import apiFetch from '@wordpress/api-fetch';
// eslint-disable-next-line camelcase
import init, { convert_to_avif } from '../../../wasm/pkg/craboptimize_wasm';

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

/**
 * WASM helper – ensures the WebAssembly module is loaded before conversion.
 */
let wasmReady = false;

/**
 * Loads the WASM module if it hasn't been loaded yet.
 */
const ensureWasm = async () => {
	if ( ! wasmReady ) {
		await init();
		wasmReady = true;
	}
};

/**
 * Converts an image `File` to AVIF using the WASM module.
 * Returns the original file if conversion fails or if the file is already AVIF.
 *
 * @param file The image file to process.
 * @return A promise that resolves to the (potentially) converted `File`.
 */
const processFile = async ( file: File ): Promise< File > => {
	if (
		! ( file instanceof File ) ||
		! file.type.startsWith( 'image/' ) ||
		'image/avif' === file.type
	) {
		return file;
	}
	try {
		console.group( `🦀 CrabOptimize: Converting ${ file.name }` );
		await ensureWasm();

		const input = new Uint8Array( await file.arrayBuffer() );
		const start = performance.now();
		const avif = convert_to_avif( input, 70.0, 10 );
		const duration = ( performance.now() - start ) / 1000;

		const avifName = file.name.replace( /\.[^/.]+$/, '' ) + '.avif';
		const avifFile = new File( [ avif ], avifName, { type: 'image/avif' } );

		console.log( `Time: ${ duration.toFixed( 2 ) }s` );
		console.groupEnd();
		return avifFile;
	} catch ( err ) {
		console.error( 'CrabOptimize: Failed', err );
		console.groupEnd();
		return file;
	}
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
