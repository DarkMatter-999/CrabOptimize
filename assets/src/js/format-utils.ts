/**
 * Format configuration and utilities for image optimization.
 * Provides format-specific settings and quality values.
 */

/**
 * Supported image formats for optimization.
 */
export type ImageFormat = 'avif' | 'webp' | 'jpeg' | 'png';

/**
 * Configuration for each supported image format.
 */
export interface FormatConfig {
	/** The MIME type for this format */
	mimeType: string;
	/** The file extension for this format */
	extension: string;
	/** Default quality value for this format (0-100) */
	defaultQuality: number;
	/** Whether this format supports the speed/compression setting */
	supportsSpeed: boolean;
}

/**
 * Map of all supported formats to their configurations.
 * This structure is designed to be easily extendable for future formats.
 */
export const FORMAT_CONFIG: Record< ImageFormat, FormatConfig > = {
	avif: {
		mimeType: 'image/avif',
		extension: 'avif',
		defaultQuality: 70,
		supportsSpeed: true,
	},
	webp: {
		mimeType: 'image/webp',
		extension: 'webp',
		defaultQuality: 75,
		supportsSpeed: false,
	},
	jpeg: {
		mimeType: 'image/jpeg',
		extension: 'jpg',
		defaultQuality: 80,
		supportsSpeed: false,
	},
	png: {
		mimeType: 'image/png',
		extension: 'png',
		defaultQuality: 100,
		supportsSpeed: false,
	},
};

/**
 * Get the configuration for a specific format.
 *
 * @param format The image format to get configuration for.
 * @return The format configuration object.
 */
export const getFormatConfig = ( format: ImageFormat ): FormatConfig => {
	return FORMAT_CONFIG[ format ] || FORMAT_CONFIG.avif;
};

/**
 * Get the MIME type for a specific format.
 *
 * @param format The image format.
 * @return The MIME type string.
 */
export const getFormatMimeType = ( format: ImageFormat ): string => {
	return getFormatConfig( format ).mimeType;
};

/**
 * Get the file extension for a specific format.
 *
 * @param format The image format.
 * @return The file extension (without the dot).
 */
export const getFormatExtension = ( format: ImageFormat ): string => {
	return getFormatConfig( format ).extension;
};

/**
 * Get the default quality value for a specific format.
 *
 * @param format The image format.
 * @return The default quality value (0-100).
 */
export const getDefaultQuality = ( format: ImageFormat ): number => {
	return getFormatConfig( format ).defaultQuality;
};

/**
 * Check if a format supports the speed/compression setting.
 *
 * @param format The image format.
 * @return True if the format supports speed settings, false otherwise.
 */
export const supportsSpeed = ( format: ImageFormat ): boolean => {
	return getFormatConfig( format ).supportsSpeed;
};

/**
 * Get the quality setting for the current selected format.
 *
 * @param format      The image format.
 * @param quality     AVIF quality value.
 * @param qualityWebp WebP quality value.
 * @return The appropriate quality value for the format.
 */
export const getQualityForFormat = (
	format: ImageFormat,
	quality: number,
	qualityWebp: number
): number => {
	switch ( format ) {
		case 'avif':
			return quality;
		case 'webp':
			return qualityWebp;
		default:
			return getDefaultQuality( format );
	}
};

/**
 * Replace the file extension in a filename with the target format's extension.
 *
 * @param fileName The original file name.
 * @param format   The target image format.
 * @return The file name with updated extension.
 */
export const getFormattedFileName = (
	fileName: string,
	format: ImageFormat
): string => {
	const extension = getFormatExtension( format );
	return fileName.replace( /\.[^/.]+$/, '' ) + '.' + extension;
};
