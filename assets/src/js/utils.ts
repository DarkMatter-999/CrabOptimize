/**
 * Retrieves the natural dimensions of an image file.
 *
 * @param {File} file - The image file to inspect.
 * @return {Promise<{ w: number; h: number }>} A promise that resolves with the width (`w`) and height (`h`) of the image.
 */
export const getImageDimensions = (
	file: File
): Promise< { w: number; h: number } > => {
	return new Promise( ( resolve ) => {
		const img = new Image();
		img.onload = () => {
			resolve( { w: img.naturalWidth, h: img.naturalHeight } );
			URL.revokeObjectURL( img.src );
		};
		img.src = URL.createObjectURL( file );
	} );
};

/**
 * Calculates resized dimensions for an image while preserving aspect ratio, recreating WP functionality.
 *
 * @param {number}  origW        - Original image width.
 * @param {number}  origH        - Original image height.
 * @param {number}  [targetW]    - Desired target width (optional).
 * @param {number}  [targetH]    - Desired target height (optional).
 * @param {boolean} [crop=false] - Whether to force a crop to the exact target dimensions.
 * @return {{ width: number; height: number } | null} The calculated dimensions, or `null` if no target dimensions were provided.
 */
export const calculateDimensions = (
	origW: number,
	origH: number,
	targetW?: number,
	targetH?: number,
	crop: boolean = false
) => {
	const w = targetW && targetW > 0 ? targetW : 0;
	const h = targetH && targetH > 0 ? targetH : 0;

	if ( ! w && ! h ) {
		return null;
	}

	if ( crop && w && h ) {
		return {
			width: Math.round( w ),
			height: Math.round( h ),
		};
	}

	const aspectRatio = origW / origH;

	let newW = w;
	let newH = h;

	if ( w && ! h ) {
		newW = Math.min( w, origW );
		newH = Math.round( newW / aspectRatio );
	} else if ( ! w && h ) {
		newH = Math.min( h, origH );
		newW = Math.round( newH * aspectRatio );
	} else if ( w && h ) {
		if ( w / h > aspectRatio ) {
			newH = Math.min( h, origH );
			newW = Math.round( newH * aspectRatio );
		} else {
			newW = Math.min( w, origW );
			newH = Math.round( newW / aspectRatio );
		}
	}

	if ( newW > origW || newH > origH ) {
		newW = origW;
		newH = origH;
	}

	return {
		width: Math.round( newW ),
		height: Math.round( newH ),
	};
};

/**
 * Load and decode an image file into ImageData format.
 * Used for formats like WebP that need pre-decoded image data.
 *
 * @param file The image File to decode.
 * @return Promise that resolves with ImageData object.
 */
export const decodeImageToImageData = async (
	file: File
): Promise< ImageData > => {
	return new Promise( ( resolve, reject ) => {
		const img = new Image();
		const reader = new FileReader();

		reader.onload = ( e ) => {
			img.src = e.target?.result as string;
		};

		reader.onerror = () => {
			reject( new Error( 'Failed to read image file' ) );
		};

		img.onload = () => {
			const canvas = document.createElement( 'canvas' );
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext( '2d' );

			if ( ! ctx ) {
				reject( new Error( 'Failed to get canvas context' ) );
				return;
			}

			ctx.drawImage( img, 0, 0 );
			const imageData = ctx.getImageData( 0, 0, img.width, img.height );
			resolve( imageData );
		};

		img.onerror = () => {
			reject( new Error( 'Failed to load image' ) );
		};

		reader.readAsDataURL( file );
	} );
};
