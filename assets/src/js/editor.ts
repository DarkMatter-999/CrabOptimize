import apiFetch from '@wordpress/api-fetch';

import { CrabQueue } from './crab-queue';
import { calculateDimensions, getImageDimensions } from './utils';

/**
 * Configuration flag that determines whether to keep the original unoptimized
 * image files. When `false` only the AVIF-converted files are retained.
 */
const keepUnoptimizedFile = !! window?.dmCrabSettingsMain?.saveUnoptimized;

const crabQueue = new CrabQueue();

/**
 * Convert an image `File` to AVIF format using the WASM module.
 *
 * The function validates that the input is an image and not already AVIF, reads
 * the file into an `ArrayBuffer`, and delegates the conversion to a dedicated
 * WebWorker. If the conversion succeeds, a new `File` containing the AVIF data
 * is returned. When conversion fails, or the input is not a convertible image,
 * the original `File` is resolved unchanged.
 *
 * @param file   The image `File` to be processed.
 * @param width
 * @param height
 * @param crop
 * @return A `Promise` that resolves with either the converted AVIF `File` or
 *          the original file when no conversion occurs.
 */
const processFile = (
	file: File,
	width?: number,
	height?: number,
	crop?: boolean
): Promise< File > => {
	if (
		! ( file instanceof File ) ||
		! file.type.startsWith( 'image/' ) ||
		'image/avif' === file.type
	) {
		return Promise.resolve( file );
	}

	return crabQueue.add( async () => {
		return new Promise( ( resolve ) => {
			console.log( `🦀 CrabOptimize: Converting ${ file.name }` );

			const worker = new Worker(
				new URL( './crab-worker.ts', import.meta.url )
			);
			const reader = new FileReader();

			reader.onload = () => {
				const fileBuffer = reader.result as ArrayBuffer;

				const handleMessage = ( e: MessageEvent ) => {
					worker.removeEventListener( 'message', handleMessage );
					worker.terminate();

					if ( e.data.error ) {
						console.error( 'CrabOptimize: Failed', e.data.error );
						resolve( file );
						return;
					}

					const { avifBuffer, fileName, duration } = e.data;

					const timeLabel =
						'number' === typeof duration
							? `${ duration.toFixed( 2 ) }s`
							: 'unknown duration';

					const avifFile = new File( [ avifBuffer ], fileName, {
						type: 'image/avif',
					} );

					console.log( `Time: ${ timeLabel }` );
					resolve( avifFile );
				};

				worker.addEventListener( 'message', handleMessage );

				worker.postMessage(
					{
						fileBuffer,
						fileName: file.name,
						quality: 70.0,
						speed: 10,
						width: width || 0,
						height: height || 0,
						crop: crop || false,
					},
					[ fileBuffer ]
				);
			};

			reader.onerror = () => {
				console.error( 'CrabOptimize: FileReader error' );
				worker.terminate();
				resolve( file );
			};

			reader.readAsArrayBuffer( file );
		} );
	} );
};

/**
 * Generates AVIF thumbnails for various sizes based on the provided file.
 *
 * @param {File}                     file           - The original image File.
 * @param {{ w: number; h: number }} originalDims   - Object containing the original image dimensions (width `w` and height `h`).
 * @param                            originalDims.w
 * @param                            originalDims.h
 * @param {Record<string, any>}      imageSizes     - Object containing WordPress‑style image size configurations.
 * @return {Promise<Array<{ size: string; width: number; height: number; data: string }>>}
 *          A promise that resolves to an array of thumbnail objects.
 */
const generateThumbnails = async (
	file: File,
	originalDims: { w: number; h: number },
	imageSizes: Record< string, any >
) => {
	if ( ! imageSizes ) {
		return [];
	}

	const sizesToGenerate = Object.entries( imageSizes ).map(
		( [ name, config ]: [ string, any ] ) => ( {
			name,
			width: parseInt( config.width, 10 ),
			height: parseInt( config.height, 10 ),
			crop: !! config.crop,
		} )
	);

	const thumbnailPromises = sizesToGenerate.map( async ( size ) => {
		const { width, height } = calculateDimensions(
			originalDims.w,
			originalDims.h,
			size.width,
			size.height,
			size.crop
		);

		if (
			! size.crop &&
			originalDims.w <= width &&
			originalDims.h <= height
		) {
			console.log(
				`🦀 CrabOptimize: Skipping ${ size.name } (too small)`
			);
			return null;
		}

		console.log(
			`🦀 CrabOptimize: Generating ${ size.name } (${ width }x${ height })`
		);

		const thumbFile = await processFile( file, width, height, size.crop );

		const base64 = await new Promise< string >( ( resolve ) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				const res = reader.result as string;
				// Remove the Data URL prefix (data:image/avif;base64,)
				resolve( res.split( ',' )[ 1 ] );
			};
			reader.readAsDataURL( thumbFile );
		} );

		return {
			size: size.name,
			width,
			height,
			data: base64,
		};
	} );

	const results = await Promise.all( thumbnailPromises );
	return results.filter( ( t ) => t !== null );
};

/**
 * API fetch middleware for the Block editor.
 * Intercepts media uploads, runs image conversion, and appends metadata.
 *
 * @param options Fetch options passed by `apiFetch`.
 * @param next    The next middleware in the chain.
 * @return The result of the next middleware.
 */
const mediaUploadMiddleware = async ( options: any, next: any ) => {
	if (
		'POST' === options.method &&
		options.path?.includes( '/wp/v2/media' ) &&
		options.body instanceof FormData
	) {
		const file = options.body.get( 'file' );
		if ( file instanceof File && ! keepUnoptimizedFile ) {
			const processed = await processFile( file );

			const originalDims = await getImageDimensions( file );
			console.log(
				`🦀 CrabOptimize: Original dimensions ${ originalDims.w }x${ originalDims.h }`
			);

			const imageSizes = window?.dmCrabSettingsMain?.imageSizes || {};

			const thumbnails = await generateThumbnails(
				file,
				originalDims,
				imageSizes
			);

			options.body.set( 'file', processed, processed.name );
			options.body.append(
				'crab_thumbnails',
				JSON.stringify( thumbnails )
			);

			if (
				'image/avif' === processed.type &&
				'image/avif' !== file.type
			) {
				options.body.append( 'is_crab_optimized', 'true' );
			}
		}
	}
	return next( options );
};

/**
 * Classic editor - Plupload interceptor.
 * Hooks into the raw Plupload global to process images before they are sent.
 */
const hookLegacyPlupload = () => {
	if ( ! ( window as any ).plupload ) {
		return;
	}

	const OriginalUploader = ( window as any ).plupload.Uploader;

	( window as any ).plupload.Uploader = function ( settings: any ) {
		const instance = new OriginalUploader( settings );

		console.log( '🦀 CrabOptimize: Hooked to Uploader' );
		setupUploaderEvents( instance );

		return instance;
	};

	// Copy prototype and static properties to the new constructor
	( window as any ).plupload.Uploader.prototype = OriginalUploader.prototype;
	Object.assign( ( window as any ).plupload.Uploader, OriginalUploader );
};

/**
 * Shared logic to bind CrabOptimize to ANY Plupload instance.
 * @param uploader
 */
const setupUploaderEvents = ( uploader: PluploadInstance ) => {
	if ( ! uploader || uploader._crabHooked ) {
		return;
	}
	uploader._crabHooked = true;

	// Inject meta flag for optimized files before upload
	uploader.bind( 'BeforeUpload', ( up: any, file: any ) => {
		if ( file._crabOptimized ) {
			up.settings.multipart_params = {
				...( up.settings.multipart_params || {} ),
				is_crab_optimized: 'true',
				crab_thumbnails: file._crabThumbnails
					? JSON.stringify( file._crabThumbnails )
					: '',
			};
		}
	} );

	// Process newly added files
	uploader.bind( 'FilesAdded', ( up: any, files: any[] ) => {
		if ( up._processing ) {
			return;
		}

		const queue: { plupload: any; native: File }[] = [];

		files.forEach( ( f ) => {
			const native = f.getNative ? f.getNative() : f.fileobj;
			if (
				native &&
				native.type.startsWith( 'image/' ) &&
				'image/avif' !== native.type &&
				! f._crabOptimized
			) {
				queue.push( { plupload: f, native } );
			}
		} );

		if ( ! queue.length ) {
			return;
		}

		up.stop();
		up._processing = true;

		if ( ! keepUnoptimizedFile ) {
			queue.forEach( ( { plupload } ) => {
				if ( plupload.attachment ) {
					plupload.attachment.destroy();
				}
				up.removeFile( plupload );
			} );
			up.refresh();
		}

		( async () => {
			try {
				const results = await Promise.all(
					queue.map( async ( item ) => {
						const processed = await processFile( item.native );

						const originalDims = await getImageDimensions(
							item.native
						);
						console.log(
							`🦀 CrabOptimize: Original dimensions ${ originalDims.w }x${ originalDims.h }`
						);

						const imageSizes =
							window?.dmCrabSettingsMain?.imageSizes || {};

						const thumbnails = await generateThumbnails(
							item.native,
							originalDims,
							imageSizes
						);

						if ( 'image/avif' === processed.type ) {
							return {
								file: processed,
								thumbnails,
								success: true,
							};
						}

						console.warn(
							`CrabOptimize: Skipping ${ item.native.name } due to conversion failure.`
						);
						return { success: false };
					} )
				);

				results.forEach( ( res ) => {
					if ( res.success && res.file ) {
						up.addFile( res.file, res.file.name );
						const added = up.files[ up.files.length - 1 ];
						if ( added ) {
							added._crabOptimized = true;
							added._crabThumbnails = res.thumbnails;
						}
					}
				} );
			} catch ( err ) {
				console.error( 'CrabOptimize: Critical error in queue', err );
			} finally {
				up._processing = false;
				up.refresh();

				if ( up.files.length > 0 ) {
					setTimeout( () => up.start(), 300 );
				}
			}
		} )();
	} );
};

/**
 * Initializes the media interceptor by registering the middleware and
 * hooking Plupload.
 */
export const initMediaInterceptor = () => {
	apiFetch.use( mediaUploadMiddleware );
	hookLegacyPlupload();
	console.log( '🦀 CrabOptimize: Ready' );
};

initMediaInterceptor();
