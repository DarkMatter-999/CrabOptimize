import apiFetch from '@wordpress/api-fetch';

import { CrabQueue } from './crab-queue';
import {
	calculateDimensions,
	getImageDimensions,
	decodeImageToImageData,
} from './utils';
import {
	ImageFormat,
	getQualityForFormat,
	getFormatMimeType,
} from './format-utils';

/**
 * Configuration flag that determines whether to keep the original unoptimized
 * image files. When `false` only the converted files are retained.
 */
const keepUnoptimizedFile = () =>
	!! window?.dmCrabSettingsMain?.saveUnoptimized;

/**
 * Configuration flag that enables thumbnail generation.
 * Defaults to `false` when the setting is missing or falsy.
 */
const isGenerateThumbnailsEnabled = () =>
	!! window?.dmCrabSettingsMain?.generateThumbnails;

/**
 * Get the selected image format.
 * Defaults to 'avif'. Valid values: 'avif', 'webp'.
 */
const getFormatSetting = (): ImageFormat => {
	const format = window?.dmCrabSettingsMain?.format;
	if (
		'string' === typeof format &&
		( 'avif' === format || 'webp' === format )
	) {
		return format as ImageFormat;
	}
	return 'avif';
};

/**
 * Get the quality setting for the current format.
 * Defaults to format-specific defaults.
 */
const getQualitySetting = () => {
	const format = getFormatSetting();
	const quality = window?.dmCrabSettingsMain?.quality;
	const qualityWebp = window?.dmCrabSettingsMain?.qualityWebp;

	const qualityValue =
		'number' === typeof quality
			? Math.max( 0, Math.min( 100, quality ) )
			: 70;
	const qualityWebpValue =
		'number' === typeof qualityWebp
			? Math.max( 0, Math.min( 100, qualityWebp ) )
			: 75;

	return getQualityForFormat( format, qualityValue, qualityWebpValue );
};

/**
 * Get the compression speed setting.
 * Only used for AVIF. Defaults to 10. Valid range: 0-10, where 10 is fastest and 0 is slowest.
 */
const getSpeedSetting = () => {
	const speed = window?.dmCrabSettingsMain?.speed;
	if ( 'number' === typeof speed ) {
		return Math.max( 0, Math.min( 10, speed ) );
	}
	return 10;
};

/**
 * Get the list of file extensions that should be excluded from optimization.
 * Returns a lower-cased array of extensions (e.g. ['gif', 'svg', 'png']).
 */
export const getExcludedTypes = (): string[] => {
	const excluded = window?.dmCrabSettingsMain?.excludedTypes;
	if ( ! excluded ) {
		return [];
	}
	return excluded
		.split( ',' )
		.map( ( t ) => t.trim().toLowerCase() )
		.filter( Boolean );
};

/**
 * Determine whether a given File should be skipped by the optimizer,
 * based on the excluded file types setting.
 *
 * Checks the file extension derived from the filename first, then falls
 * back to a best-effort extension extracted from the MIME type.
 *
 * @param file The File to inspect.
 * @return `true` when the file should NOT be optimized.
 */
export const isFileExcluded = ( file: File ): boolean => {
	const excluded = getExcludedTypes();
	if ( ! excluded.length ) {
		return false;
	}

	const nameParts = file.name.split( '.' );
	if ( nameParts.length > 1 ) {
		const ext = nameParts.pop()!.toLowerCase();
		if ( excluded.includes( ext ) ) {
			return true;
		}
	}

	// Fallback: derive extension from MIME type (e.g. 'image/png' -> 'png').
	// Special-case 'image/jpeg' -> 'jpg' so users can exclude with 'jpg'.
	const mimeSubtype = file.type.split( '/' ).pop()?.toLowerCase();
	if ( mimeSubtype ) {
		const mimeExt = 'jpeg' === mimeSubtype ? 'jpg' : mimeSubtype;
		if (
			excluded.includes( mimeExt ) ||
			excluded.includes( mimeSubtype )
		) {
			return true;
		}
	}

	return false;
};

/**
 * Determine whether a given MIME type string should be skipped by the
 * optimizer, based on the excluded file types setting.
 *
 * Useful in contexts where only a MIME type is available (e.g. bulk migration).
 *
 * @param mimeType A MIME type string such as `image/gif` or `image/svg+xml`.
 * @return `true` when the type should NOT be optimized.
 */
export const isMimeTypeExcluded = ( mimeType: string ): boolean => {
	const excluded = getExcludedTypes();
	if ( ! excluded.length ) {
		return false;
	}

	// Derive a normalised extension from the subtype.
	// 'image/jpeg' -> 'jpg', 'image/svg+xml' -> 'svg'
	const subtype = mimeType.split( '/' ).pop()?.toLowerCase() ?? '';

	let ext = subtype;
	if ( 'jpeg' === subtype ) {
		ext = 'jpg';
	} else if ( subtype.includes( '+' ) ) {
		ext = subtype.split( '+' )[ 0 ];
	}

	return excluded.includes( ext ) || excluded.includes( subtype );
};

const crabQueue = new CrabQueue();

/**
 * Convert an image `File` to the configured format using the WASM module or jsquash.
 *
 * The function validates that the input is an image and not already in the target format,
 * reads the file into an `ArrayBuffer`, and delegates the conversion to a dedicated
 * WebWorker. If the conversion succeeds, a new `File` containing the converted data
 * is returned. When conversion fails, or the input is not a convertible image,
 * the original `File` is resolved unchanged.
 *
 * @param file   The image `File` to be processed.
 * @param width  Optional target width for resizing.
 * @param height Optional target height for resizing.
 * @param crop   Optional flag to crop to exact dimensions.
 * @return A `Promise` that resolves with either the converted `File` or
 *          the original file when no conversion occurs.
 */
export const processFile = (
	file: File,
	width?: number,
	height?: number,
	crop?: boolean
): Promise< File > => {
	const format = getFormatSetting();
	const targetMimeType = getFormatMimeType( format );

	if (
		! ( file instanceof File ) ||
		! file.type.startsWith( 'image/' ) ||
		targetMimeType === file.type ||
		isFileExcluded( file )
	) {
		return Promise.resolve( file );
	}

	return crabQueue.add( async () => {
		return new Promise( async ( resolve ) => {
			console.log(
				`🦀 CrabOptimize: Converting ${
					file.name
				} to ${ format.toUpperCase() }`
			);

			try {
				let fileBuffer: ArrayBuffer | undefined;
				let imageData: ImageData | undefined;

				if ( 'webp' === format ) {
					imageData = await decodeImageToImageData( file );
				} else {
					fileBuffer = await file.arrayBuffer();
				}

				const worker = new Worker(
					new URL( './crab-worker.ts', import.meta.url )
				);

				const handleMessage = ( e: MessageEvent ) => {
					worker.removeEventListener( 'message', handleMessage );
					worker.terminate();

					if ( e.data.error ) {
						console.error( 'CrabOptimize: Failed', e.data.error );
						resolve( file );
						return;
					}

					const {
						buffer,
						fileName,
						format: resultFormat,
						duration,
					} = e.data;

					const timeLabel =
						'number' === typeof duration
							? `${ duration.toFixed( 2 ) }s`
							: 'unknown duration';

					const mimeType = getFormatMimeType( resultFormat );
					const convertedFile = new File( [ buffer ], fileName, {
						type: mimeType,
					} );

					console.log( `Time: ${ timeLabel }` );
					resolve( convertedFile );
				};

				const handleError = ( err: ErrorEvent ) => {
					console.error( 'CrabOptimize: Worker error', err.message );
					worker.removeEventListener( 'error', handleError );
					worker.terminate();
					resolve( file );
				};

				worker.addEventListener( 'message', handleMessage );
				worker.addEventListener( 'error', handleError );

				const messageData: any = {
					fileName: file.name,
					format,
					quality: getQualitySetting(),
					speed: getSpeedSetting(),
					width: width || 0,
					height: height || 0,
					crop: crop || false,
				};

				if ( fileBuffer ) {
					messageData.fileBuffer = fileBuffer;
					worker.postMessage( messageData, [ fileBuffer ] );
				} else if ( imageData ) {
					messageData.imageData = imageData;
					worker.postMessage( messageData );
				}
			} catch ( err ) {
				console.error( 'CrabOptimize: Error preparing image', err );
				resolve( file );
			}
		} );
	} );
};

/**
 * Generates optimized thumbnails for various sizes based on the provided file.
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
	if ( ! isGenerateThumbnailsEnabled() ) {
		return [];
	}

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
				// Remove the Data URL prefix (data:image/avif;base64, or data:image/webp;base64)
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
		if (
			file instanceof File &&
			! keepUnoptimizedFile() &&
			! isFileExcluded( file )
		) {
			const format = getFormatSetting();
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

			if ( thumbnails.length > 0 ) {
				options.body.append(
					'crab_thumbnails',
					JSON.stringify( thumbnails )
				);
			}

			const targetMimeType = getFormatMimeType( format );
			if (
				targetMimeType === processed.type &&
				targetMimeType !== file.type
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

		const format = getFormatSetting();
		const targetMimeType = getFormatMimeType( format );
		const queue: { plupload: any; native: File }[] = [];

		files.forEach( ( f ) => {
			const native = f.getNative ? f.getNative() : f.fileobj;
			if (
				native &&
				native.type.startsWith( 'image/' ) &&
				targetMimeType !== native.type &&
				! f._crabOptimized &&
				! isFileExcluded( native )
			) {
				queue.push( { plupload: f, native } );
			}
		} );

		if ( ! queue.length ) {
			return;
		}

		up.stop();
		up._processing = true;

		if ( ! keepUnoptimizedFile() ) {
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

						if ( targetMimeType === processed.type ) {
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
							if ( res?.thumbnails?.length > 0 ) {
								added._crabThumbnails = res.thumbnails;
							}
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
