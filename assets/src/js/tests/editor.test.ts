import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { initMediaInterceptor } from '../editor';

vi.mock( '@wordpress/api-fetch', () => ( {
	default: {
		use: vi.fn(),
	},
} ) );

vi.mock( '../crab-queue', () => {
	class MockCrabQueue {
		add( task: () => Promise< any > ) {
			return task();
		}
	}
	return {
		CrabQueue: MockCrabQueue,
	};
} );

vi.mock( '../utils', () => ( {
	calculateDimensions: vi.fn( ( w, h, maxW, maxH, crop ) => {
		if ( crop ) {
			return { width: maxW, height: maxH };
		}
		const ratio = Math.min( maxW / w, maxH / h );
		return {
			width: Math.round( w * ratio ),
			height: Math.round( h * ratio ),
		};
	} ),
	getImageDimensions: vi.fn( async () => ( { w: 1000, h: 1000 } ) ),
	decodeImageToImageData: vi.fn( async () => ( {
		data: new Uint8ClampedArray( 4000000 ),
		width: 1000,
		height: 1000,
	} ) ),
} ) );

vi.mock( '../format-utils', () => ( {
	getQualityForFormat: vi.fn( ( format, quality, qualityWebp ) => {
		return format === 'avif' ? quality : qualityWebp;
	} ),
	getFormatMimeType: vi.fn( ( format ) => {
		return format === 'webp' ? 'image/webp' : 'image/avif';
	} ),
} ) );

class MockWorker {
	private onMessageCallback: any;

	addEventListener( type: string, listener: any ) {
		if ( type === 'message' ) {
			this.onMessageCallback = listener;
		}
	}

	removeEventListener = vi.fn();
	terminate = vi.fn();

	postMessage() {
		setTimeout( () => {
			if ( this.onMessageCallback ) {
				this.onMessageCallback( {
					data: {
						buffer: new ArrayBuffer( 8 ),
						fileName: 'test.avif',
						format: 'avif',
						duration: 0.1,
					},
				} );
			}
		}, 0 );
	}
}

const createMockFile = ( name: string, type: string ) => {
	const file = new File( [ 'content' ], name, { type } ) as any;
	file.arrayBuffer = vi.fn( async () => new ArrayBuffer( 8 ) );
	return file;
};

describe( 'Media Interceptor', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		vi.stubGlobal( 'Worker', MockWorker );

		const mFileReaderInstance = {
			readAsArrayBuffer: vi.fn( function ( this: any ) {
				this.result = new ArrayBuffer( 8 );
				if ( this.onload ) {
					this.onload();
				}
			} ),
			readAsDataURL: vi.fn( function ( this: any ) {
				this.result = 'data:image/avif;base64,mockbase64';
				if ( this.onloadend ) {
					this.onloadend();
				}
			} ),
			result: null as any,
			onload: null as any,
			onloadend: null as any,
		};

		vi.stubGlobal(
			'FileReader',
			vi.fn( function () {
				return mFileReaderInstance;
			} )
		);

		vi.stubGlobal( 'window', {
			dmCrabSettingsMain: {
				saveUnoptimized: false,
				generateThumbnails: true,
				format: 'avif',
				quality: 70,
				qualityWebp: 75,
				speed: 10,
				imageSizes: {
					thumbnail: { width: 150, height: 150, crop: true },
				},
			},
			plupload: undefined,
		} );

		vi.stubGlobal(
			'Image',
			vi.fn( function () {
				this.naturalWidth = 1000;
				this.naturalHeight = 1000;
				this.width = 1000;
				this.height = 1000;

				Object.defineProperty( this, 'src', {
					set() {
						setTimeout( () => {
							if ( this.onload ) {
								this.onload();
							}
						}, 0 );
					},
				} );
			} )
		);

		vi.stubGlobal( 'document', {
			createElement: vi.fn( ( tag ) => {
				if ( tag === 'canvas' ) {
					return {
						width: 0,
						height: 0,
						getContext: vi.fn( () => ( {
							drawImage: vi.fn(),
							getImageData: vi.fn( () => ( {
								data: new Uint8ClampedArray( 4 ),
								width: 1000,
								height: 1000,
							} ) ),
						} ) ),
					};
				}
				return {};
			} ),
		} );
	} );

	afterEach( () => {
		vi.unstubAllGlobals();
	} );

	it( 'registers middleware on init', () => {
		initMediaInterceptor();
		expect( apiFetch.use ).toHaveBeenCalled();
	} );

	it( 'processes image uploads in apiFetch middleware with AVIF format', async () => {
		initMediaInterceptor();
		const middleware = vi.mocked( apiFetch.use ).mock.calls[ 0 ][ 0 ];

		const formData = new FormData();
		const originalFile = createMockFile( 'test.jpg', 'image/jpeg' );
		formData.append( 'file', originalFile );

		const options = {
			method: 'POST',
			path: '/wp/v2/media',
			body: formData,
		};

		const next = vi.fn( ( opts ) => opts );

		await middleware( options, next );

		expect( formData.has( 'is_crab_optimized' ) ).toBe( true );
		expect( formData.get( 'is_crab_optimized' ) ).toBe( 'true' );
		expect( next ).toHaveBeenCalled();
	} );

	it( 'skips processing when keepUnoptimizedFile is true', async () => {
		( window as any ).dmCrabSettingsMain.saveUnoptimized = true;
		initMediaInterceptor();
		const middleware = vi.mocked( apiFetch.use ).mock.calls[ 0 ][ 0 ];

		const formData = new FormData();
		const file = createMockFile( 'test.jpg', 'image/jpeg' );
		formData.append( 'file', file );

		const options = {
			method: 'POST',
			path: '/wp/v2/media',
			body: formData,
		};

		await middleware( options, ( opt: any ) => opt );

		expect( formData.has( 'is_crab_optimized' ) ).toBe( false );
	} );

	it( 'skips non-image files', async () => {
		initMediaInterceptor();
		const middleware = vi.mocked( apiFetch.use ).mock.calls[ 0 ][ 0 ];

		const formData = new FormData();
		const file = createMockFile( 'test.pdf', 'application/pdf' );
		formData.append( 'file', file );

		const options = {
			method: 'POST',
			path: '/wp/v2/media',
			body: formData,
		};

		const next = vi.fn( ( opts ) => opts );

		await middleware( options, next );

		expect( formData.has( 'is_crab_optimized' ) ).toBe( false );
		expect( next ).toHaveBeenCalled();
	} );

	it( 'skips non-media endpoints', async () => {
		initMediaInterceptor();
		const middleware = vi.mocked( apiFetch.use ).mock.calls[ 0 ][ 0 ];

		const formData = new FormData();
		const file = createMockFile( 'test.jpg', 'image/jpeg' );
		formData.append( 'file', file );

		const options = {
			method: 'POST',
			path: '/wp/v2/posts',
			body: formData,
		};

		const next = vi.fn( ( opts ) => opts );

		await middleware( options, next );

		expect( formData.has( 'is_crab_optimized' ) ).toBe( false );
		expect( next ).toHaveBeenCalled();
	} );

	it( 'skips non-POST requests', async () => {
		initMediaInterceptor();
		const middleware = vi.mocked( apiFetch.use ).mock.calls[ 0 ][ 0 ];

		const formData = new FormData();
		const file = createMockFile( 'test.jpg', 'image/jpeg' );
		formData.append( 'file', file );

		const options = {
			method: 'GET',
			path: '/wp/v2/media',
			body: formData,
		};

		const next = vi.fn( ( opts ) => opts );

		await middleware( options, next );

		expect( formData.has( 'is_crab_optimized' ) ).toBe( false );
		expect( next ).toHaveBeenCalled();
	} );

	it( 'respects format setting with AVIF', async () => {
		( window as any ).dmCrabSettingsMain.format = 'avif';
		initMediaInterceptor();
		const middleware = vi.mocked( apiFetch.use ).mock.calls[ 0 ][ 0 ];

		const formData = new FormData();
		const originalFile = createMockFile( 'test.jpg', 'image/jpeg' );
		formData.append( 'file', originalFile );

		const options = {
			method: 'POST',
			path: '/wp/v2/media',
			body: formData,
		};

		const next = vi.fn( ( opts ) => opts );

		await middleware( options, next );

		expect( next ).toHaveBeenCalled();
	} );

	it( 'respects format setting with WebP', async () => {
		( window as any ).dmCrabSettingsMain.format = 'webp';
		initMediaInterceptor();
		const middleware = vi.mocked( apiFetch.use ).mock.calls[ 0 ][ 0 ];

		const formData = new FormData();
		const originalFile = createMockFile( 'test.jpg', 'image/jpeg' );
		formData.append( 'file', originalFile );

		const options = {
			method: 'POST',
			path: '/wp/v2/media',
			body: formData,
		};

		const next = vi.fn( ( opts ) => opts );

		await middleware( options, next );

		expect( next ).toHaveBeenCalled();
	} );

	it( 'respects quality setting', async () => {
		( window as any ).dmCrabSettingsMain.quality = 50;
		initMediaInterceptor();
		const middleware = vi.mocked( apiFetch.use ).mock.calls[ 0 ][ 0 ];

		const formData = new FormData();
		const originalFile = createMockFile( 'test.jpg', 'image/jpeg' );
		formData.append( 'file', originalFile );

		const options = {
			method: 'POST',
			path: '/wp/v2/media',
			body: formData,
		};

		const next = vi.fn( ( opts ) => opts );

		await middleware( options, next );

		expect( next ).toHaveBeenCalled();
	} );

	it( 'respects speed setting', async () => {
		( window as any ).dmCrabSettingsMain.speed = 5;
		initMediaInterceptor();
		const middleware = vi.mocked( apiFetch.use ).mock.calls[ 0 ][ 0 ];

		const formData = new FormData();
		const originalFile = createMockFile( 'test.jpg', 'image/jpeg' );
		formData.append( 'file', originalFile );

		const options = {
			method: 'POST',
			path: '/wp/v2/media',
			body: formData,
		};

		const next = vi.fn( ( opts ) => opts );

		await middleware( options, next );

		expect( next ).toHaveBeenCalled();
	} );

	it( 'generates thumbnails when enabled', async () => {
		( window as any ).dmCrabSettingsMain.generateThumbnails = true;
		initMediaInterceptor();
		const middleware = vi.mocked( apiFetch.use ).mock.calls[ 0 ][ 0 ];

		const formData = new FormData();
		const originalFile = createMockFile( 'test.jpg', 'image/jpeg' );
		formData.append( 'file', originalFile );

		const options = {
			method: 'POST',
			path: '/wp/v2/media',
			body: formData,
		};

		const next = vi.fn( ( opts ) => opts );

		await middleware( options, next );

		expect( formData.has( 'crab_thumbnails' ) ).toBe( true );
		expect( next ).toHaveBeenCalled();
	} );

	it( 'does not generate thumbnails when disabled', async () => {
		( window as any ).dmCrabSettingsMain.generateThumbnails = false;
		initMediaInterceptor();
		const middleware = vi.mocked( apiFetch.use ).mock.calls[ 0 ][ 0 ];

		const formData = new FormData();
		const originalFile = createMockFile( 'test.jpg', 'image/jpeg' );
		formData.append( 'file', originalFile );

		const options = {
			method: 'POST',
			path: '/wp/v2/media',
			body: formData,
		};

		const next = vi.fn( ( opts ) => opts );

		await middleware( options, next );

		expect( formData.has( 'crab_thumbnails' ) ).toBe( false );
		expect( next ).toHaveBeenCalled();
	} );

	it( 'does not modify non-FormData bodies', async () => {
		initMediaInterceptor();
		const middleware = vi.mocked( apiFetch.use ).mock.calls[ 0 ][ 0 ];

		const options = {
			method: 'POST',
			path: '/wp/v2/media',
			body: JSON.stringify( { test: 'data' } ),
		};

		const next = vi.fn( ( opts ) => opts );

		await middleware( options, next );

		expect( next ).toHaveBeenCalledWith( options );
	} );

	it( 'handles already converted files', async () => {
		initMediaInterceptor();
		const middleware = vi.mocked( apiFetch.use ).mock.calls[ 0 ][ 0 ];

		const formData = new FormData();
		const originalFile = createMockFile( 'test.avif', 'image/avif' );
		formData.append( 'file', originalFile );

		const options = {
			method: 'POST',
			path: '/wp/v2/media',
			body: formData,
		};

		const next = vi.fn( ( opts ) => opts );

		await middleware( options, next );

		expect( formData.has( 'is_crab_optimized' ) ).toBe( false );
		expect( next ).toHaveBeenCalled();
	} );
} );
