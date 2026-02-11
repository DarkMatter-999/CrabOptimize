import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { initMediaInterceptor } from '../editor.ts';

vi.mock( '@wordpress/api-fetch', () => ( {
	default: {
		use: vi.fn(),
	},
} ) );

vi.mock( './crab-queue', () => ( {
	CrabQueue: vi.fn().mockImplementation( () => ( {
		add: vi.fn( ( task ) => task() ),
	} ) ),
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
						avifBuffer: new ArrayBuffer( 8 ),
						fileName: 'test.avif',
						duration: 0.1,
					},
				} );
			}
		}, 0 );
	}
}

describe( 'Media Interceptor', () => {
	beforeEach( () => {
		vi.restoreAllMocks();
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
				quality: 70,
				speed: 10,
				imageSizes: {
					thumbnail: { width: 150, height: 150, crop: true },
				},
			},
		} );

		vi.stubGlobal(
			'Image',
			vi.fn( function () {
				this.naturalWidth = 1000;
				this.naturalHeight = 1000;

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
	} );

	it( 'registers middleware and plupload hook on init', () => {
		initMediaInterceptor();
		expect( apiFetch.use ).toHaveBeenCalled();
	} );

	it( 'processes image uploads in apiFetch middleware', async () => {
		initMediaInterceptor();
		const middleware = vi.mocked( apiFetch.use ).mock.calls[ 0 ][ 0 ];

		const formData = new FormData();
		const originalFile = new File( [ 'content' ], 'test.jpg', {
			type: 'image/jpeg',
		} );
		formData.append( 'file', originalFile );

		const options = {
			method: 'POST',
			path: '/wp/v2/media',
			body: formData,
		};

		const next = vi.fn( ( opts ) => opts );

		await middleware( options, next );

		const processedFile = formData.get( 'file' ) as File;

		expect( processedFile.type ).toBe( 'image/avif' );
		expect( formData.get( 'is_crab_optimized' ) ).toBe( 'true' );
		expect( formData.has( 'crab_thumbnails' ) ).toBe( true );
		expect( next ).toHaveBeenCalled();
	} );

	it( 'skips processing when keepUnoptimizedFile is true', async () => {
		( window as any ).dmCrabSettingsMain.saveUnoptimized = true;
		initMediaInterceptor();
		const middleware = vi.mocked( apiFetch.use ).mock.calls[ 0 ][ 0 ];

		const formData = new FormData();
		const file = new File( [ '' ], 'test.jpg', { type: 'image/jpeg' } );
		formData.append( 'file', file );

		const options = {
			method: 'POST',
			path: '/wp/v2/media',
			body: formData,
		};
		await middleware( options, ( opt: any ) => opt );

		const processedFile = formData.get( 'file' ) as File;
		expect( processedFile.type ).toBe( 'image/jpeg' );
	} );
} );
