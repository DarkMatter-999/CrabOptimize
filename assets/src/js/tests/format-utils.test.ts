import { describe, it, expect } from 'vitest';
import {
	FORMAT_CONFIG,
	getFormatConfig,
	getFormatMimeType,
	getFormatExtension,
	getDefaultQuality,
	supportsSpeed,
	getQualityForFormat,
	getFormattedFileName,
	type ImageFormat,
} from '../format-utils.ts';

describe( 'FORMAT_CONFIG', () => {
	it( 'defines all required formats', () => {
		expect( FORMAT_CONFIG ).toHaveProperty( 'avif' );
		expect( FORMAT_CONFIG ).toHaveProperty( 'webp' );
		expect( FORMAT_CONFIG ).toHaveProperty( 'jpeg' );
		expect( FORMAT_CONFIG ).toHaveProperty( 'png' );
	} );

	it( 'provides correct AVIF configuration', () => {
		expect( FORMAT_CONFIG.avif ).toEqual( {
			mimeType: 'image/avif',
			extension: 'avif',
			defaultQuality: 70,
			supportsSpeed: true,
		} );
	} );

	it( 'provides correct WebP configuration', () => {
		expect( FORMAT_CONFIG.webp ).toEqual( {
			mimeType: 'image/webp',
			extension: 'webp',
			defaultQuality: 75,
			supportsSpeed: false,
		} );
	} );

	it( 'provides correct JPEG configuration', () => {
		expect( FORMAT_CONFIG.jpeg ).toEqual( {
			mimeType: 'image/jpeg',
			extension: 'jpg',
			defaultQuality: 80,
			supportsSpeed: false,
		} );
	} );

	it( 'provides correct PNG configuration', () => {
		expect( FORMAT_CONFIG.png ).toEqual( {
			mimeType: 'image/png',
			extension: 'png',
			defaultQuality: 100,
			supportsSpeed: false,
		} );
	} );
} );

describe( 'getFormatConfig', () => {
	it( 'returns AVIF config for avif format', () => {
		const config = getFormatConfig( 'avif' );
		expect( config.mimeType ).toBe( 'image/avif' );
		expect( config.extension ).toBe( 'avif' );
		expect( config.defaultQuality ).toBe( 70 );
		expect( config.supportsSpeed ).toBe( true );
	} );

	it( 'returns WebP config for webp format', () => {
		const config = getFormatConfig( 'webp' );
		expect( config.mimeType ).toBe( 'image/webp' );
		expect( config.extension ).toBe( 'webp' );
		expect( config.defaultQuality ).toBe( 75 );
		expect( config.supportsSpeed ).toBe( false );
	} );

	it( 'returns JPEG config for jpeg format', () => {
		const config = getFormatConfig( 'jpeg' );
		expect( config.mimeType ).toBe( 'image/jpeg' );
		expect( config.extension ).toBe( 'jpg' );
		expect( config.defaultQuality ).toBe( 80 );
		expect( config.supportsSpeed ).toBe( false );
	} );

	it( 'returns PNG config for png format', () => {
		const config = getFormatConfig( 'png' );
		expect( config.mimeType ).toBe( 'image/png' );
		expect( config.extension ).toBe( 'png' );
		expect( config.defaultQuality ).toBe( 100 );
		expect( config.supportsSpeed ).toBe( false );
	} );

	it( 'defaults to AVIF for invalid format', () => {
		const config = getFormatConfig( 'invalid' as ImageFormat );
		expect( config.mimeType ).toBe( 'image/avif' );
		expect( config.extension ).toBe( 'avif' );
	} );
} );

describe( 'getFormatMimeType', () => {
	it( 'returns correct MIME type for avif', () => {
		expect( getFormatMimeType( 'avif' ) ).toBe( 'image/avif' );
	} );

	it( 'returns correct MIME type for webp', () => {
		expect( getFormatMimeType( 'webp' ) ).toBe( 'image/webp' );
	} );

	it( 'returns correct MIME type for jpeg', () => {
		expect( getFormatMimeType( 'jpeg' ) ).toBe( 'image/jpeg' );
	} );

	it( 'returns correct MIME type for png', () => {
		expect( getFormatMimeType( 'png' ) ).toBe( 'image/png' );
	} );

	it( 'defaults to AVIF MIME type for invalid format', () => {
		expect( getFormatMimeType( 'invalid' as ImageFormat ) ).toBe(
			'image/avif'
		);
	} );
} );

describe( 'getFormatExtension', () => {
	it( 'returns correct extension for avif', () => {
		expect( getFormatExtension( 'avif' ) ).toBe( 'avif' );
	} );

	it( 'returns correct extension for webp', () => {
		expect( getFormatExtension( 'webp' ) ).toBe( 'webp' );
	} );

	it( 'returns correct extension for jpeg', () => {
		expect( getFormatExtension( 'jpeg' ) ).toBe( 'jpg' );
	} );

	it( 'returns correct extension for png', () => {
		expect( getFormatExtension( 'png' ) ).toBe( 'png' );
	} );

	it( 'defaults to AVIF extension for invalid format', () => {
		expect( getFormatExtension( 'invalid' as ImageFormat ) ).toBe( 'avif' );
	} );
} );

describe( 'getDefaultQuality', () => {
	it( 'returns correct default quality for avif', () => {
		expect( getDefaultQuality( 'avif' ) ).toBe( 70 );
	} );

	it( 'returns correct default quality for webp', () => {
		expect( getDefaultQuality( 'webp' ) ).toBe( 75 );
	} );

	it( 'returns correct default quality for jpeg', () => {
		expect( getDefaultQuality( 'jpeg' ) ).toBe( 80 );
	} );

	it( 'returns correct default quality for png', () => {
		expect( getDefaultQuality( 'png' ) ).toBe( 100 );
	} );

	it( 'defaults to AVIF quality for invalid format', () => {
		expect( getDefaultQuality( 'invalid' as ImageFormat ) ).toBe( 70 );
	} );
} );

describe( 'supportsSpeed', () => {
	it( 'returns true for avif which supports speed', () => {
		expect( supportsSpeed( 'avif' ) ).toBe( true );
	} );

	it( 'returns false for webp which does not support speed', () => {
		expect( supportsSpeed( 'webp' ) ).toBe( false );
	} );

	it( 'returns false for jpeg which does not support speed', () => {
		expect( supportsSpeed( 'jpeg' ) ).toBe( false );
	} );

	it( 'returns false for png which does not support speed', () => {
		expect( supportsSpeed( 'png' ) ).toBe( false );
	} );

	it( 'defaults to AVIF speed support for invalid format', () => {
		expect( supportsSpeed( 'invalid' as ImageFormat ) ).toBe( true );
	} );
} );

describe( 'getQualityForFormat', () => {
	it( 'returns AVIF quality when format is avif', () => {
		const quality = getQualityForFormat( 'avif', 65, 75 );
		expect( quality ).toBe( 65 );
	} );

	it( 'returns WebP quality when format is webp', () => {
		const quality = getQualityForFormat( 'webp', 65, 75 );
		expect( quality ).toBe( 75 );
	} );

	it( 'returns default quality for jpeg', () => {
		const quality = getQualityForFormat( 'jpeg', 65, 75 );
		expect( quality ).toBe( 80 );
	} );

	it( 'returns default quality for png', () => {
		const quality = getQualityForFormat( 'png', 65, 75 );
		expect( quality ).toBe( 100 );
	} );

	it( 'returns default quality for invalid format', () => {
		const quality = getQualityForFormat( 'invalid' as ImageFormat, 65, 75 );
		expect( quality ).toBe( 70 );
	} );

	it( 'uses different quality values for avif and webp', () => {
		const avifQuality = getQualityForFormat( 'avif', 50, 90 );
		const webpQuality = getQualityForFormat( 'webp', 50, 90 );

		expect( avifQuality ).toBe( 50 );
		expect( webpQuality ).toBe( 90 );
		expect( avifQuality ).not.toBe( webpQuality );
	} );
} );

describe( 'getFormattedFileName', () => {
	it( 'replaces extension for AVIF format', () => {
		const fileName = getFormattedFileName( 'photo.jpg', 'avif' );
		expect( fileName ).toBe( 'photo.avif' );
	} );

	it( 'replaces extension for WebP format', () => {
		const fileName = getFormattedFileName( 'photo.jpg', 'webp' );
		expect( fileName ).toBe( 'photo.webp' );
	} );

	it( 'replaces extension for JPEG format', () => {
		const fileName = getFormattedFileName( 'photo.png', 'jpeg' );
		expect( fileName ).toBe( 'photo.jpg' );
	} );

	it( 'replaces extension for PNG format', () => {
		const fileName = getFormattedFileName( 'photo.jpg', 'png' );
		expect( fileName ).toBe( 'photo.png' );
	} );

	it( 'handles files without extension', () => {
		const fileName = getFormattedFileName( 'photo', 'avif' );
		expect( fileName ).toBe( 'photo.avif' );
	} );

	it( 'handles files with multiple dots in the filename', () => {
		const fileName = getFormattedFileName( 'my.photo.backup.jpg', 'webp' );
		expect( fileName ).toBe( 'my.photo.backup.webp' );
	} );

	it( 'handles files with uppercase extensions', () => {
		const fileName = getFormattedFileName( 'photo.JPG', 'avif' );
		expect( fileName ).toBe( 'photo.avif' );
	} );

	it( 'handles files with mixed case extensions', () => {
		const fileName = getFormattedFileName( 'photo.JpG', 'webp' );
		expect( fileName ).toBe( 'photo.webp' );
	} );

	it( 'preserves filename when replacing extension', () => {
		const fileName = getFormattedFileName(
			'my-important-photo-2024.jpg',
			'avif'
		);
		expect( fileName ).toBe( 'my-important-photo-2024.avif' );
	} );

	it( 'handles files with special characters in name', () => {
		const fileName = getFormattedFileName( 'photo_#1 (copy).jpg', 'webp' );
		expect( fileName ).toBe( 'photo_#1 (copy).webp' );
	} );
} );
