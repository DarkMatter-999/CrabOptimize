/**
 * Load the WebAssembly module and expose the AVIF conversion function.
 */
// eslint-disable-next-line camelcase
import init, { convert_to_avif } from '../../../wasm/pkg/craboptimize_wasm';

let wasmReady = false;

/**
 * Handles incoming messages from the main thread.
 *
 * @param {MessageEvent} e - Message event. `e.data` should be an object with:
 *                         - `fileBuffer` {ArrayBuffer}: Buffer containing the source image.
 *                         - `fileName`   {string}:       Original file name of the image.
 *                         - `quality`    {number}:       Desired AVIF quality (0‑100).
 *                         - `speed`      {number}:       Compression speed setting (0‑10).
 *
 *                         Sends back either:
 *                         - An object with `avifBuffer`, `fileName`, and `duration`.
 *                         - An object with an `error` property if conversion fails.
 */
self.onmessage = async ( e: MessageEvent ) => {
	const { fileBuffer, fileName, quality, speed } = e.data;

	if ( ! wasmReady ) {
		await init();
		wasmReady = true;
	}

	try {
		const input = new Uint8Array( fileBuffer );
		const start = performance.now();
		const avif = convert_to_avif( input, quality, speed );
		const duration = ( performance.now() - start ) / 1000;

		self.postMessage(
			{
				avifBuffer: avif.buffer,
				fileName: fileName.replace( /\.[^/.]+$/, '' ) + '.avif',
				duration,
			},
			[ avif.buffer ] as any
		);
	} catch ( err ) {
		self.postMessage( { error: err.message } );
	}
};
