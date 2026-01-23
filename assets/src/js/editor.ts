import apiFetch from '@wordpress/api-fetch';
// eslint-disable-next-line camelcase
import init, { convert_to_avif } from '../../../wasm/pkg/craboptimize_wasm';

/**
 * Helper to initialize WASM once
 */
let wasmInitialized = false;
const ensureWasm = async () => {
	if ( ! wasmInitialized ) {
		await init();
		wasmInitialized = true;
	}
};

const mediaUploadMiddleware = async ( options: any, next: any ) => {
	if (
		'POST' === options.method &&
		options.path &&
		options.path.includes( '/wp/v2/media' ) &&
		options.body instanceof FormData
	) {
		const file = options.body.get( 'file' ) as File;

		if (
			file instanceof File &&
			file.type.startsWith( 'image/' ) &&
			'image/avif' !== file.type
		) {
			try {
				// eslint-disable-next-line no-console
				console.group( `🦀 CrabOptimize: Converting ${ file.name }` );

				await ensureWasm();

				const arrayBuffer = await file.arrayBuffer();
				const inputBytes = new Uint8Array( arrayBuffer );

				const startTime = performance.now();
				const avifBytes = convert_to_avif( inputBytes, 70.0, 10 );
				const endTime = performance.now();

				const newFileName =
					file.name.replace( /\.[^/.]+$/, '' ) + '.avif';
				const avifFile = new File( [ avifBytes ], newFileName, {
					type: 'image/avif',
				} );

				options.body.set( 'file', avifFile );

				// eslint-disable-next-line no-console
				console.log(
					`Converted in ${ ( ( endTime - startTime ) / 1000 ).toFixed(
						2
					) }s`
				);
				// eslint-disable-next-line no-console
				console.log(
					`Reduction: ${ (
						( ( inputBytes.length - avifBytes.length ) /
							inputBytes.length ) *
						100
					).toFixed( 1 ) }%`
				);
				// eslint-disable-next-line no-console
				console.groupEnd();
			} catch ( error ) {
				// eslint-disable-next-line no-console
				console.error(
					'CrabOptimize: Conversion failed, falling back to original upload.',
					error
				);
				// eslint-disable-next-line no-console
				console.groupEnd();
				// We don't throw here, let the original file upload as a fallback
			}
		}
	}

	return next( options );
};

apiFetch.use( mediaUploadMiddleware );
