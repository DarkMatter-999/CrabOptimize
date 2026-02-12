/**
 * Load the WebAssembly module and expose the AVIF conversion function.
 * Also includes WebP encoding support via jsquash.
 */
import init, {
	// eslint-disable-next-line camelcase
	convert_to_avif,
	// eslint-disable-next-line camelcase
	convert_to_avif_resize,
} from '../../../wasm/pkg/craboptimize_wasm';
import { encode as encodeWebp } from '@jsquash/webp';
import { ImageFormat } from './format-utils';

let wasmReady = false;

/**
 * Encode image data to WebP format.
 *
 * @param imageData The raw image data to encode.
 * @param quality   Quality setting (0-100).
 * @return Promise that resolves with the WebP buffer.
 */
const encodeToWebP = async (
	imageData: ImageData,
	quality: number
): Promise< Uint8Array > => {
	try {
		const webpBuffer = await encodeWebp( imageData, { quality } );
		return new Uint8Array( webpBuffer );
	} catch ( err ) {
		throw new Error(
			`WebP encoding failed: ${
				err instanceof Error ? err.message : String( err )
			}`
		);
	}
};

/**
 * Handles incoming messages from the main thread.
 *
 * @param {MessageEvent} e - Message event. `e.data` should be an object with:
 *                         - `fileBuffer` {ArrayBuffer}: Buffer containing the source image (AVIF only).
 *                         - `imageData` {ImageData}: Pre-decoded image data (WebP).
 *                         - `fileName`   {string}:       Original file name of the image.
 *                         - `format`     {string}:       Target format ('avif' or 'webp').
 *                         - `quality`    {number}:       Desired quality (0‑100).
 *                         - `speed`      {number}:       Compression speed setting (0‑10, AVIF only).
 *                         - `width`      {number}:       Target width for resizing (optional).
 *                         - `height`     {number}:       Target height for resizing (optional).
 *                         - `crop`       {boolean}:      Whether to crop to exact dimensions (optional).
 *
 *                         Sends back either:
 *                         - An object with `buffer`, `fileName`, `format`, and `duration`.
 *                         - An object with an `error` property if conversion fails.
 */
self.onmessage = async ( e: MessageEvent ) => {
	const {
		fileBuffer,
		imageData,
		fileName,
		format = 'avif',
		quality,
		speed,
		width,
		height,
		crop,
	} = e.data;

	if ( ! wasmReady && format === 'avif' ) {
		await init();
		wasmReady = true;
	}

	try {
		const start = performance.now();
		let resultBuffer: Uint8Array;
		let resultFormat: ImageFormat = ( format as ImageFormat ) || 'avif';

		if ( format === 'webp' ) {
			// WebP encoding via jsquash
			// imageData should already be provided by main thread
			if ( ! imageData ) {
				throw new Error(
					'WebP encoding requires imageData to be provided from main thread'
				);
			}
			resultBuffer = await encodeToWebP( imageData, quality );
		} else {
			if ( ! fileBuffer ) {
				throw new Error(
					'AVIF encoding requires fileBuffer to be provided'
				);
			}
			const input = new Uint8Array( fileBuffer );

			let avif: Uint8Array;
			if ( width > 0 && height > 0 ) {
				avif = convert_to_avif_resize(
					input,
					quality,
					speed,
					width,
					height,
					crop
				);
			} else {
				avif = convert_to_avif( input, quality, speed );
			}

			resultBuffer = avif;
			resultFormat = 'avif';
		}

		const duration = ( performance.now() - start ) / 1000;

		const extension = resultFormat === 'webp' ? 'webp' : 'avif';
		const newFileName =
			fileName.replace( /\.[^/.]+$/, '' ) + '.' + extension;

		self.postMessage(
			{
				buffer: resultBuffer.buffer,
				fileName: newFileName,
				format: resultFormat,
				duration,
			},
			[ resultBuffer.buffer ] as any
		);
	} catch ( err ) {
		self.postMessage( {
			error: err instanceof Error ? err.message : String( err ),
		} );
	}
};
