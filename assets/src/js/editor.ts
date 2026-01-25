import apiFetch from '@wordpress/api-fetch';

/**
 * Configuration flag that determines whether to keep the original unoptimized
 * image files. When `false` only the AVIF‑converted files are retained.
 */
const KEEP_UNOPTIMIZED_FILE = false;

/**
 * Types used by the legacy Plupload uploader.
 */

/**
 * Represents a file in the Plupload queue.
 */
interface PluploadFile {
	/** Unique identifier for the file. */
	id: string;
	/** Original filename. */
	name: string;
	/** MIME type of the file. */
	type: string;
	/** Returns the native `File` instance. */
	getNative: () => File;
	/** Flag indicating the file has already been processed to AVIF. */
	_crabOptimized?: boolean;
}

/**
 * Represents the Plupload instance used in the classic editor.
 */
interface PluploadInstance {
	/** Files currently queued for upload. */
	files: PluploadFile[];
	/** Binds an event handler to the uploader. */
	bind: (
		event: string,
		cb: ( up: PluploadInstance, files: PluploadFile[] ) => void
	) => void;
	/** Stops automatic upload start. */
	stop: () => void;
	/** Starts the upload process. */
	start: () => void;
	/** Removes a file from the queue. */
	removeFile: ( file: PluploadFile | string ) => void;
	/** Adds a file to the queue. */
	addFile: ( file: File, name?: string ) => void;
	/** Refreshes the UI after queue changes. */
	refresh: () => void;
	/** Upload settings, including multipart parameters. */
	settings: {
		multipart_params?: Record< string, string >;
	};
}

/**
 * Global window extension for WordPress uploader integration.
 */
declare global {
	interface Window {
		wp?: {
			Uploader?: {
				prototype: { init: () => void };
			};
		};
	}
}

const worker = new Worker( new URL( './crab-worker.ts', import.meta.url ) );

/**
 * Convert an image `File` to AVIF format using the WASM module.
 *
 * The function validates that the input is an image and not already AVIF, reads
 * the file into an `ArrayBuffer`, and delegates the conversion to a dedicated
 * WebWorker. If the conversion succeeds, a new `File` containing the AVIF data
 * is returned. When conversion fails, or the input is not a convertible image,
 * the original `File` is resolved unchanged.
 *
 * @param file The image `File` to be processed.
 * @return A `Promise` that resolves with either the converted AVIF `File` or
 *          the original file when no conversion occurs.
 */
const processFile = ( file: File ): Promise< File > => {
	if (
		! ( file instanceof File ) ||
		! file.type.startsWith( 'image/' ) ||
		'image/avif' === file.type
	) {
		return Promise.resolve( file );
	}

	return new Promise( ( resolve ) => {
		console.group( `🦀 CrabOptimize: Converting ${ file.name }` );

		const reader = new FileReader();

		reader.onload = () => {
			const fileBuffer = reader.result as ArrayBuffer;

			const handleMessage = ( e: MessageEvent ) => {
				worker.removeEventListener( 'message', handleMessage );

				if ( e.data.error ) {
					console.error( 'CrabOptimize: Failed', e.data.error );
					console.groupEnd();
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
				console.groupEnd();
				resolve( avifFile );
			};

			worker.addEventListener( 'message', handleMessage );

			worker.postMessage(
				{
					fileBuffer,
					fileName: file.name,
					quality: 70.0,
					speed: 10,
				},
				[ fileBuffer ]
			);
		};

		reader.onerror = () => {
			console.error( 'CrabOptimize: FileReader error' );
			console.groupEnd();
			resolve( file );
		};

		reader.readAsArrayBuffer( file );
	} );
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
		options.method === 'POST' &&
		options.path?.includes( '/wp/v2/media' ) &&
		options.body instanceof FormData
	) {
		const file = options.body.get( 'file' );
		if ( file instanceof File && ! KEEP_UNOPTIMIZED_FILE ) {
			const processed = await processFile( file );
			options.body.set( 'file', processed, processed.name );
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
 * Classic editor – Plupload interceptor.
 * Hooks into the legacy uploader to process images before they are sent.
 */
const hookLegacyPlupload = () => {
	if ( ! window.wp?.Uploader ) {
		return;
	}

	const proto = window.wp.Uploader.prototype;
	const originalInit = proto.init;

	proto.init = function ( this: any ) {
		// eslint-disable-next-line prefer-rest-params
		originalInit.apply( this, arguments as any );
		const uploader = this.uploader as PluploadInstance;
		if ( ! uploader ) {
			return;
		}

		// Inject meta flag for optimized files before upload
		uploader.bind( 'BeforeUpload', ( up, file ) => {
			if ( ( file as any )._crabOptimized ) {
				up.settings.multipart_params = {
					...( up.settings.multipart_params || {} ),
					is_crab_optimized: 'true',
				};
			} else {
				// eslint-disable-next-line camelcase
				const { is_crab_optimized, ...rest } =
					up.settings.multipart_params ?? {};
				up.settings.multipart_params = rest;
			}
		} );

		// Process newly added files
		uploader.bind( 'FilesAdded', ( up, files ) => {
			if ( ( up as any )._processing ) {
				return;
			}

			const queue: { plupload: PluploadFile; native: File }[] = [];

			files.forEach( ( f ) => {
				const native = f.getNative();
				if (
					native &&
					native.type.startsWith( 'image/' ) &&
					'image/avif' !== native.type &&
					! ( f as any )._crabOptimized
				) {
					queue.push( { plupload: f, native } );
				}
			} );

			if ( ! queue.length ) {
				return;
			}

			up.stop();
			( up as any )._processing = true;

			if ( ! KEEP_UNOPTIMIZED_FILE ) {
				queue.forEach( ( { plupload } ) => {
					if ( ( plupload as any ).attachment ) {
						( plupload as any ).attachment.destroy();
					}
					up.removeFile( plupload );
				} );
				up.refresh();
			}

			( async () => {
				try {
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					for ( const { plupload, native } of queue ) {
						const result = await processFile( native );
						if ( 'image/avif' === result.type ) {
							up.addFile( result, result.name );
							const added = up.files[ up.files.length - 1 ];
							if ( added ) {
								( added as any )._crabOptimized = true;
							}
						} else if ( ! KEEP_UNOPTIMIZED_FILE ) {
							up.addFile( native, native.name );
						}
					}
				} finally {
					( up as any )._processing = false;
					up.refresh();
					setTimeout( () => {
						if ( up.files.length ) {
							up.start();
						}
					}, 300 );
				}
			} )();
		} );
	};
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
