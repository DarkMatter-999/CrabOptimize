import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiFetch from '@wordpress/api-fetch';

vi.mock( '../editor', () => ( {
	processFile: vi.fn(),
	isMimeTypeExcluded: vi.fn().mockReturnValue( false ),
} ) );

vi.mock( '../logger', () => ( {
	logger: {
		log: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
} ) );

import { CrabMigration } from '../migrate';
import { processFile, isMimeTypeExcluded } from '../editor';

const DEFAULT_SETTINGS = {
	restUrl: 'https://example.com/wp-json/dm-crab/v1',
	nonce: 'test-nonce-123',
};

const setupDOM = () => {
	document.body.innerHTML = '<div id="migration-root"></div>';
};

const createInstance = (): any => {
	setupDOM();
	return new CrabMigration() as any;
};

describe( 'CrabMigration – constructor', () => {
	it( 'renders the base UI when the root element exists', () => {
		const instance = createInstance();
		expect( instance.root ).not.toBeNull();
		expect( document.getElementById( 'crab-progress-bar' ) ).not.toBeNull();
		expect(
			document.getElementById( 'migration-status-text' )
		).not.toBeNull();
		expect(
			document.getElementById( 'start-migration-btn' )
		).not.toBeNull();
		expect(
			document.getElementById( 'pause-migration-btn' )
		).not.toBeNull();
		expect(
			document.getElementById( 'resume-migration-btn' )
		).not.toBeNull();
		expect( document.getElementById( 'migration-logs' ) ).not.toBeNull();
		expect( document.getElementById( 'migration-details' ) ).not.toBeNull();
	} );

	it( 'does nothing when the root element is absent', () => {
		document.body.innerHTML = '';
		const instance = new CrabMigration() as any;
		expect( instance.root ).toBeNull();
		expect( instance.progressBar ).toBeNull();
		expect( instance.statusText ).toBeNull();
	} );

	it( 'initial state has idle phase', () => {
		const instance = createInstance();
		expect( instance.currentPhase ).toBe( 'idle' );
	} );

	it( 'initial counts are all zero', () => {
		const instance = createInstance();
		expect( instance.convertedCount ).toBe( 0 );
		expect( instance.failedCount ).toBe( 0 );
		expect( instance.replacedPostsCount ).toBe( 0 );
		expect( instance.discoveredImages ).toHaveLength( 0 );
	} );

	it( 'initial isPaused is false', () => {
		const instance = createInstance();
		expect( instance.isPaused ).toBe( false );
	} );

	it( 'start button is enabled on render', () => {
		createInstance();
		const btn = document.getElementById(
			'start-migration-btn'
		) as HTMLButtonElement;
		expect( btn.disabled ).toBe( false );
	} );

	it( 'pause and resume buttons are hidden on render', () => {
		createInstance();
		const pause = document.getElementById(
			'pause-migration-btn'
		) as HTMLButtonElement;
		const resume = document.getElementById(
			'resume-migration-btn'
		) as HTMLButtonElement;
		expect( pause.style.display ).toBe( 'none' );
		expect( resume.style.display ).toBe( 'none' );
	} );
} );

describe( 'CrabMigration – updateUI', () => {
	it( 'sets progress bar width and text', () => {
		const instance = createInstance();
		instance.updateUI( 42, 'Working...' );
		const bar = document.getElementById( 'crab-progress-bar' )!;
		expect( bar.style.width ).toBe( '42%' );
		expect( bar.textContent ).toBe( '42%' );
	} );

	it( 'rounds fractional percentages', () => {
		const instance = createInstance();
		instance.updateUI( 33.7, 'Working...' );
		expect(
			document.getElementById( 'crab-progress-bar' )!.textContent
		).toBe( '34%' );
	} );

	it( 'clamps the bar width to 100%', () => {
		const instance = createInstance();
		instance.updateUI( 150, 'Overflow' );
		expect(
			document.getElementById( 'crab-progress-bar' )!.style.width
		).toBe( '100%' );
	} );

	it( 'updates the status text element', () => {
		const instance = createInstance();
		instance.updateUI( 0, 'Hello status' );
		expect(
			document.getElementById( 'migration-status-text' )!.textContent
		).toBe( 'Hello status' );
	} );

	it( 'handles zero percent', () => {
		const instance = createInstance();
		instance.updateUI( 0, 'Starting' );
		expect(
			document.getElementById( 'crab-progress-bar' )!.style.width
		).toBe( '0%' );
	} );
} );

describe( 'CrabMigration – addLog', () => {
	it( 'appends a new entry to the logs container', () => {
		const instance = createInstance();
		instance.addLog( 'First message' );
		const logs = document.getElementById( 'migration-logs' )!;
		expect( logs.children ).toHaveLength( 1 );
	} );

	it( 'includes the message text in the log entry', () => {
		const instance = createInstance();
		instance.addLog( 'Test log entry' );
		const logs = document.getElementById( 'migration-logs' )!;
		expect( logs.children[ 0 ].textContent ).toContain( 'Test log entry' );
	} );

	it( 'colours error messages containing ❌ in red', () => {
		const instance = createInstance();
		instance.addLog( '❌ Something went wrong' );
		const entry = document.getElementById( 'migration-logs' )!
			.children[ 0 ] as HTMLElement;
		// JSDOM normalises hex colours to rgb(), so we test the rgb equivalent of #d63638
		expect( entry.style.color ).toBe( 'rgb(214, 54, 56)' );
	} );

	it( 'colours error messages containing "Error" in red', () => {
		const instance = createInstance();
		instance.addLog( 'Error: bad thing' );
		const entry = document.getElementById( 'migration-logs' )!
			.children[ 0 ] as HTMLElement;
		expect( entry.style.color ).toBe( 'rgb(214, 54, 56)' );
	} );

	it( 'colours normal messages in black', () => {
		const instance = createInstance();
		instance.addLog( 'All good' );
		const entry = document.getElementById( 'migration-logs' )!
			.children[ 0 ] as HTMLElement;
		// JSDOM normalises #000 to rgb(0, 0, 0)
		expect( entry.style.color ).toBe( 'rgb(0, 0, 0)' );
	} );

	it( 'appends multiple entries in order', () => {
		const instance = createInstance();
		instance.addLog( 'First' );
		instance.addLog( 'Second' );
		instance.addLog( 'Third' );
		const logs = document.getElementById( 'migration-logs' )!;
		expect( logs.children ).toHaveLength( 3 );
		expect( logs.children[ 1 ].textContent ).toContain( 'Second' );
	} );

	it( 'does nothing when the logs container is absent', () => {
		const instance = createInstance();
		document.getElementById( 'migration-logs' )!.remove();
		expect( () => instance.addLog( 'No container' ) ).not.toThrow();
	} );
} );

describe( 'CrabMigration – updateDetails', () => {
	it( 'capitalises and displays the current phase', () => {
		const instance = createInstance();
		instance.currentPhase = 'discovery';
		instance.updateDetails();
		expect( document.getElementById( 'detail-phase' )!.textContent ).toBe(
			'Discovery'
		);
	} );

	it( 'shows the discovered images count', () => {
		const instance = createInstance();
		instance.discoveredImages = [ { id: 1 }, { id: 2 } ];
		instance.updateDetails();
		expect(
			document.getElementById( 'detail-discovered' )!.textContent
		).toBe( '2' );
	} );

	it( 'shows the converted count', () => {
		const instance = createInstance();
		instance.convertedCount = 7;
		instance.updateDetails();
		expect(
			document.getElementById( 'detail-converted' )!.textContent
		).toBe( '7' );
	} );

	it( 'shows the failed count', () => {
		const instance = createInstance();
		instance.failedCount = 3;
		instance.updateDetails();
		expect( document.getElementById( 'detail-failed' )!.textContent ).toBe(
			'3'
		);
	} );

	it( 'works when detail elements are absent', () => {
		const instance = createInstance();
		document.getElementById( 'detail-phase' )!.remove();
		expect( () => instance.updateDetails() ).not.toThrow();
	} );
} );

describe( 'CrabMigration – pauseMigration', () => {
	it( 'sets isPaused to true', () => {
		const instance = createInstance();
		instance.pauseMigration();
		expect( instance.isPaused ).toBe( true );
	} );

	it( 'hides the pause button', () => {
		const instance = createInstance();
		instance.pauseMigration();
		const btn = document.getElementById(
			'pause-migration-btn'
		) as HTMLElement;
		expect( btn.style.display ).toBe( 'none' );
	} );

	it( 'shows the resume button', () => {
		const instance = createInstance();
		instance.pauseMigration();
		const btn = document.getElementById(
			'resume-migration-btn'
		) as HTMLElement;
		expect( btn.style.display ).toBe( 'inline-block' );
	} );

	it( 'adds a log entry for the pause', () => {
		const instance = createInstance();
		instance.pauseMigration();
		const logs = document.getElementById( 'migration-logs' )!;
		expect( logs.children.length ).toBeGreaterThan( 0 );
	} );
} );

describe( 'CrabMigration – resumeMigration', () => {
	it( 'sets isPaused to false', () => {
		const instance = createInstance();
		instance.isPaused = true;
		instance.resumeMigration();
		expect( instance.isPaused ).toBe( false );
	} );

	it( 'shows the pause button', () => {
		const instance = createInstance();
		instance.resumeMigration();
		const btn = document.getElementById(
			'pause-migration-btn'
		) as HTMLElement;
		expect( btn.style.display ).toBe( 'inline-block' );
	} );

	it( 'hides the resume button', () => {
		const instance = createInstance();
		instance.resumeMigration();
		const btn = document.getElementById(
			'resume-migration-btn'
		) as HTMLElement;
		expect( btn.style.display ).toBe( 'none' );
	} );

	it( 'adds a log entry for the resume', () => {
		const instance = createInstance();
		instance.resumeMigration();
		const logs = document.getElementById( 'migration-logs' )!;
		expect( logs.children.length ).toBeGreaterThan( 0 );
	} );
} );

describe( 'CrabMigration – runDiscoveryPhase', () => {
	beforeEach( () => {
		vi.mocked( isMimeTypeExcluded ).mockReturnValue( false );
	} );

	it( 'appends unoptimized images to discoveredImages', async () => {
		const instance = createInstance();

		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					images: [
						{
							id: 1,
							title: 'Img 1',
							url: 'http://x.com/1.jpg',
							mime_type: 'image/jpeg',
							isOptimized: false,
							optimizedId: null,
						},
						{
							id: 2,
							title: 'Img 2',
							url: 'http://x.com/2.jpg',
							mime_type: 'image/jpeg',
							isOptimized: false,
							optimizedId: null,
						},
					],
					total_pages: 1,
					is_last: true,
				} ),
			} )
		);

		await instance.runDiscoveryPhase( DEFAULT_SETTINGS );
		expect( instance.discoveredImages ).toHaveLength( 2 );
	} );

	it( 'filters out already-optimized images (isOptimized: true)', async () => {
		const instance = createInstance();

		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					images: [
						{
							id: 1,
							title: 'Done',
							url: 'http://x.com/1.jpg',
							mime_type: 'image/jpeg',
							isOptimized: true,
							optimizedId: null,
						},
						{
							id: 2,
							title: 'Pending',
							url: 'http://x.com/2.jpg',
							mime_type: 'image/jpeg',
							isOptimized: false,
							optimizedId: null,
						},
					],
					total_pages: 1,
					is_last: true,
				} ),
			} )
		);

		await instance.runDiscoveryPhase( DEFAULT_SETTINGS );
		expect( instance.discoveredImages ).toHaveLength( 1 );
		expect( instance.discoveredImages[ 0 ].id ).toBe( 2 );
	} );

	it( 'filters out images that already have an optimizedId', async () => {
		const instance = createInstance();

		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					images: [
						{
							id: 3,
							title: 'Has optimized',
							url: 'http://x.com/3.jpg',
							mime_type: 'image/jpeg',
							isOptimized: false,
							optimizedId: 99,
						},
					],
					total_pages: 1,
					is_last: true,
				} ),
			} )
		);

		await instance.runDiscoveryPhase( DEFAULT_SETTINGS );
		expect( instance.discoveredImages ).toHaveLength( 0 );
	} );

	it( 'filters out images with excluded mime types', async () => {
		const instance = createInstance();
		vi.mocked( isMimeTypeExcluded ).mockImplementation(
			( mime ) => mime === 'image/svg+xml'
		);

		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					images: [
						{
							id: 4,
							title: 'SVG',
							url: 'http://x.com/icon.svg',
							mime_type: 'image/svg+xml',
							isOptimized: false,
							optimizedId: null,
						},
						{
							id: 5,
							title: 'JPEG',
							url: 'http://x.com/photo.jpg',
							mime_type: 'image/jpeg',
							isOptimized: false,
							optimizedId: null,
						},
					],
					total_pages: 1,
					is_last: true,
				} ),
			} )
		);

		await instance.runDiscoveryPhase( DEFAULT_SETTINGS );
		expect( instance.discoveredImages ).toHaveLength( 1 );
		expect( instance.discoveredImages[ 0 ].id ).toBe( 5 );
	} );

	it( 'paginates through multiple pages', async () => {
		const instance = createInstance();

		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					images: [
						{
							id: 1,
							title: 'Img 1',
							url: 'http://x.com/1.jpg',
							mime_type: 'image/jpeg',
							isOptimized: false,
							optimizedId: null,
						},
					],
					total_pages: 2,
					is_last: false,
				} ),
			} )
			.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					images: [
						{
							id: 2,
							title: 'Img 2',
							url: 'http://x.com/2.jpg',
							mime_type: 'image/jpeg',
							isOptimized: false,
							optimizedId: null,
						},
					],
					total_pages: 2,
					is_last: true,
				} ),
			} );

		vi.stubGlobal( 'fetch', fetchMock );

		await instance.runDiscoveryPhase( DEFAULT_SETTINGS );
		expect( fetchMock ).toHaveBeenCalledTimes( 2 );
		expect( instance.discoveredImages ).toHaveLength( 2 );
	} );

	it( 'includes the page query parameter in the fetch URL', async () => {
		const instance = createInstance();
		const fetchMock = vi.fn().mockResolvedValue( {
			ok: true,
			json: async () => ( { images: [], total_pages: 1, is_last: true } ),
		} );
		vi.stubGlobal( 'fetch', fetchMock );

		await instance.runDiscoveryPhase( DEFAULT_SETTINGS );
		const calledUrl: string = fetchMock.mock.calls[ 0 ][ 0 ];
		expect( calledUrl ).toContain( 'page=1' );
	} );

	it( 'sends the correct nonce header', async () => {
		const instance = createInstance();
		const fetchMock = vi.fn().mockResolvedValue( {
			ok: true,
			json: async () => ( { images: [], total_pages: 1, is_last: true } ),
		} );
		vi.stubGlobal( 'fetch', fetchMock );

		await instance.runDiscoveryPhase( DEFAULT_SETTINGS );
		const options = fetchMock.mock.calls[ 0 ][ 1 ];
		expect( options.headers[ 'X-WP-Nonce' ] ).toBe(
			DEFAULT_SETTINGS.nonce
		);
	} );

	it( 'uses POST method for discovery request', async () => {
		const instance = createInstance();
		const fetchMock = vi.fn().mockResolvedValue( {
			ok: true,
			json: async () => ( { images: [], total_pages: 1, is_last: true } ),
		} );
		vi.stubGlobal( 'fetch', fetchMock );

		await instance.runDiscoveryPhase( DEFAULT_SETTINGS );
		expect( fetchMock.mock.calls[ 0 ][ 1 ].method ).toBe( 'POST' );
	} );

	it( 'logs an error and returns early on a non-ok response', async () => {
		const instance = createInstance();
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValueOnce( { ok: false, status: 500 } )
		);

		await instance.runDiscoveryPhase( DEFAULT_SETTINGS );

		const logs = document.getElementById( 'migration-logs' )!;
		const logTexts = Array.from( logs.children ).map(
			( el ) => el.textContent ?? ''
		);
		expect(
			logTexts.some(
				( t ) =>
					t.includes( '500' ) ||
					t.includes( 'Error' ) ||
					t.includes( 'error' )
			)
		).toBe( true );
	} );

	it( 'logs an error and returns early when fetch throws', async () => {
		const instance = createInstance();
		vi.stubGlobal(
			'fetch',
			vi.fn().mockRejectedValueOnce( new Error( 'Network failure' ) )
		);

		await instance.runDiscoveryPhase( DEFAULT_SETTINGS );

		const logs = document.getElementById( 'migration-logs' )!;
		const logTexts = Array.from( logs.children ).map(
			( el ) => el.textContent ?? ''
		);
		expect(
			logTexts.some( ( t ) => t.includes( 'Network failure' ) )
		).toBe( true );
	} );

	it( 'stops iterating when isPaused becomes true', async () => {
		const instance = createInstance();
		instance.isPaused = true;
		const fetchMock = vi.fn();
		vi.stubGlobal( 'fetch', fetchMock );

		await instance.runDiscoveryPhase( DEFAULT_SETTINGS );
		expect( fetchMock ).not.toHaveBeenCalled();
	} );

	it( 'handles an empty images array gracefully', async () => {
		const instance = createInstance();
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					images: [],
					total_pages: 1,
					is_last: true,
				} ),
			} )
		);

		await instance.runDiscoveryPhase( DEFAULT_SETTINGS );
		expect( instance.discoveredImages ).toHaveLength( 0 );
	} );
} );

describe( 'CrabMigration – runConversionPhase', () => {
	const makeImage = ( id: number, mime = 'image/jpeg' ) => ( {
		id,
		title: `Image ${ id }`,
		url: `https://example.com/img-${ id }.jpg`,
		mime_type: mime,
	} );

	beforeEach( () => {
		vi.mocked( isMimeTypeExcluded ).mockReturnValue( false );
		vi.mocked( apiFetch ).mockResolvedValue( undefined );
	} );

	it( 'does nothing when discoveredImages is empty', async () => {
		const instance = createInstance();
		instance.discoveredImages = [];
		await instance.runConversionPhase( DEFAULT_SETTINGS );
		expect( instance.convertedCount ).toBe( 0 );
	} );

	it( 'increments convertedCount on a successful conversion', async () => {
		const instance = createInstance();
		instance.discoveredImages = [ makeImage( 10 ) ];

		const mockBlob = new Blob( [ 'data' ], { type: 'image/avif' } );
		const mockConvertedFile = new File( [ mockBlob ], 'img-10.avif', {
			type: 'image/avif',
		} );

		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue( { ok: true, blob: async () => mockBlob } )
		);
		vi.mocked( processFile ).mockResolvedValue( mockConvertedFile );
		vi.mocked( apiFetch ).mockResolvedValue( { id: 99 } );

		await instance.runConversionPhase( DEFAULT_SETTINGS );
		expect( instance.convertedCount ).toBe( 1 );
	} );

	it( 'increments failedCount when processFile throws', async () => {
		const instance = createInstance();
		instance.discoveredImages = [ makeImage( 11 ) ];

		const mockBlob = new Blob( [ 'data' ], { type: 'image/jpeg' } );
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue( { ok: true, blob: async () => mockBlob } )
		);
		vi.mocked( processFile ).mockRejectedValue(
			new Error( 'WASM exploded' )
		);

		await instance.runConversionPhase( DEFAULT_SETTINGS );
		expect( instance.failedCount ).toBe( 1 );
		expect( instance.convertedCount ).toBe( 0 );
	} );

	it( 'increments failedCount when fetch of the image URL fails', async () => {
		const instance = createInstance();
		instance.discoveredImages = [ makeImage( 12 ) ];

		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue( { ok: false, status: 404 } )
		);

		await instance.runConversionPhase( DEFAULT_SETTINGS );
		expect( instance.failedCount ).toBe( 1 );
	} );

	it( 'increments failedCount when convertedFile is null', async () => {
		const instance = createInstance();
		instance.discoveredImages = [ makeImage( 13 ) ];

		const mockBlob = new Blob( [ 'data' ], { type: 'image/jpeg' } );
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue( { ok: true, blob: async () => mockBlob } )
		);
		vi.mocked( processFile ).mockResolvedValue( null as any );

		await instance.runConversionPhase( DEFAULT_SETTINGS );
		expect( instance.failedCount ).toBe( 1 );
	} );

	it( 'calls the set-failure endpoint when an image fails', async () => {
		const instance = createInstance();
		instance.discoveredImages = [ makeImage( 14 ) ];

		const mockBlob = new Blob( [ 'data' ], { type: 'image/jpeg' } );
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue( { ok: true, blob: async () => mockBlob } )
		);
		vi.mocked( processFile ).mockRejectedValue( new Error( 'fail' ) );

		const apiFetchMock = vi
			.mocked( apiFetch )
			.mockResolvedValue( undefined );

		await instance.runConversionPhase( DEFAULT_SETTINGS );

		const setFailureCall = apiFetchMock.mock.calls.find(
			( call ) =>
				typeof call[ 0 ] === 'object' &&
				( call[ 0 ] as any ).path?.includes( 'set-failure' )
		);
		expect( setFailureCall ).toBeDefined();
	} );

	it( 'skips images with excluded mime types', async () => {
		const instance = createInstance();
		const svgImage = makeImage( 15, 'image/svg+xml' );
		instance.discoveredImages = [ svgImage ];

		vi.mocked( isMimeTypeExcluded ).mockImplementation(
			( mime ) => mime === 'image/svg+xml'
		);

		const fetchMock = vi
			.fn()
			.mockResolvedValue( { ok: true, blob: async () => new Blob() } );
		vi.stubGlobal( 'fetch', fetchMock );

		await instance.runConversionPhase( DEFAULT_SETTINGS );

		expect( vi.mocked( processFile ) ).not.toHaveBeenCalled();
		expect( instance.convertedCount ).toBe( 0 );
		expect( instance.failedCount ).toBe( 0 );
	} );

	it( 'stops processing when isPaused is set during iteration', async () => {
		const instance = createInstance();
		instance.discoveredImages = [ makeImage( 16 ), makeImage( 17 ) ];

		const mockBlob = new Blob( [ 'data' ], { type: 'image/jpeg' } );
		vi.stubGlobal(
			'fetch',
			vi.fn().mockImplementation( () => {
				instance.isPaused = true;
				return Promise.resolve( {
					ok: true,
					blob: async () => mockBlob,
				} );
			} )
		);
		vi.mocked( processFile ).mockResolvedValue(
			new File( [ mockBlob ], 'img.avif', { type: 'image/avif' } )
		);
		vi.mocked( apiFetch ).mockResolvedValue( { id: 50 } );

		await instance.runConversionPhase( DEFAULT_SETTINGS );

		// Since isPaused is set immediately, loop should stop quickly.
		expect( instance.isPaused ).toBe( true );
	} );

	it( 'accumulates counts across multiple images', async () => {
		const instance = createInstance();
		instance.discoveredImages = [
			makeImage( 20 ),
			makeImage( 21 ),
			makeImage( 22 ),
		];

		const mockBlob = new Blob( [ 'data' ], { type: 'image/jpeg' } );
		let callCount = 0;

		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue( { ok: true, blob: async () => mockBlob } )
		);
		vi.mocked( processFile ).mockImplementation( () => {
			callCount++;
			if ( callCount === 2 ) {
				return Promise.reject( new Error( 'mid-fail' ) );
			}
			return Promise.resolve(
				new File( [ mockBlob ], 'img.avif', { type: 'image/avif' } )
			);
		} );
		vi.mocked( apiFetch ).mockResolvedValue( { id: 55 } );

		await instance.runConversionPhase( DEFAULT_SETTINGS );

		expect( instance.convertedCount ).toBe( 2 );
		expect( instance.failedCount ).toBe( 1 );
	} );
} );

describe( 'CrabMigration – uploadOptimizedImage', () => {
	it( 'returns the optimized attachment ID from the response', async () => {
		const instance = createInstance();
		vi.mocked( apiFetch ).mockResolvedValue( { id: 77 } );

		const file = new File( [ 'abc' ], 'test.avif', { type: 'image/avif' } );
		const result = await instance.uploadOptimizedImage( 42, file );
		expect( result ).toBe( 77 );
	} );

	it( 'sends is_crab_migration flag in form data', async () => {
		const instance = createInstance();

		let capturedBody: FormData | null = null;
		vi.mocked( apiFetch ).mockImplementation( ( options: any ) => {
			capturedBody = options.body as FormData;
			return Promise.resolve( { id: 10 } );
		} );

		const file = new File( [ 'abc' ], 'test.avif', { type: 'image/avif' } );
		await instance.uploadOptimizedImage( 5, file );

		expect( capturedBody ).not.toBeNull();
		expect( ( capturedBody as any ).get( 'is_crab_migration' ) ).toBe(
			'true'
		);
	} );

	it( 'sends the original_id in form data', async () => {
		const instance = createInstance();

		let capturedBody: FormData | null = null;
		vi.mocked( apiFetch ).mockImplementation( ( options: any ) => {
			capturedBody = options.body as FormData;
			return Promise.resolve( { id: 10 } );
		} );

		const file = new File( [ 'abc' ], 'test.avif', { type: 'image/avif' } );
		await instance.uploadOptimizedImage( 42, file );

		expect( ( capturedBody as any ).get( 'original_id' ) ).toBe( '42' );
	} );

	it( 'sends is_crab_optimized flag in form data', async () => {
		const instance = createInstance();

		let capturedBody: FormData | null = null;
		vi.mocked( apiFetch ).mockImplementation( ( options: any ) => {
			capturedBody = options.body as FormData;
			return Promise.resolve( { id: 10 } );
		} );

		const file = new File( [ 'abc' ], 'test.avif', { type: 'image/avif' } );
		await instance.uploadOptimizedImage( 5, file );

		expect( ( capturedBody as any ).get( 'is_crab_optimized' ) ).toBe(
			'true'
		);
	} );

	it( 'includes the optimized format from dmCrabSettingsMain', async () => {
		const instance = createInstance();
		vi.stubGlobal( 'window', {
			...window,
			dmCrabSettingsMain: { format: 'webp' },
		} );

		let capturedBody: FormData | null = null;
		vi.mocked( apiFetch ).mockImplementation( ( options: any ) => {
			capturedBody = options.body as FormData;
			return Promise.resolve( { id: 10 } );
		} );

		const file = new File( [ 'abc' ], 'test.webp', { type: 'image/webp' } );
		await instance.uploadOptimizedImage( 5, file );

		expect( ( capturedBody as any ).get( 'crab_optimized_format' ) ).toBe(
			'webp'
		);
	} );

	it( 'defaults to avif format when dmCrabSettingsMain is absent', async () => {
		const instance = createInstance();
		vi.stubGlobal( 'window', { ...window, dmCrabSettingsMain: undefined } );

		let capturedBody: FormData | null = null;
		vi.mocked( apiFetch ).mockImplementation( ( options: any ) => {
			capturedBody = options.body as FormData;
			return Promise.resolve( { id: 10 } );
		} );

		const file = new File( [ 'abc' ], 'test.avif', { type: 'image/avif' } );
		await instance.uploadOptimizedImage( 5, file );

		expect( ( capturedBody as any ).get( 'crab_optimized_format' ) ).toBe(
			'avif'
		);
	} );

	it( 'targets the /wp/v2/media endpoint', async () => {
		const instance = createInstance();

		let capturedPath: string | null = null;
		vi.mocked( apiFetch ).mockImplementation( ( options: any ) => {
			capturedPath = options.path;
			return Promise.resolve( { id: 10 } );
		} );

		const file = new File( [ 'abc' ], 'test.avif', { type: 'image/avif' } );
		await instance.uploadOptimizedImage( 5, file );

		expect( capturedPath ).toBe( '/wp/v2/media' );
	} );

	it( 'uses POST method for the upload', async () => {
		const instance = createInstance();

		let capturedMethod: string | null = null;
		vi.mocked( apiFetch ).mockImplementation( ( options: any ) => {
			capturedMethod = options.method;
			return Promise.resolve( { id: 10 } );
		} );

		const file = new File( [ 'abc' ], 'test.avif', { type: 'image/avif' } );
		await instance.uploadOptimizedImage( 5, file );

		expect( capturedMethod ).toBe( 'POST' );
	} );

	it( 'throws when the response has no id', async () => {
		const instance = createInstance();
		vi.mocked( apiFetch ).mockResolvedValue( {} );

		const file = new File( [ 'abc' ], 'test.avif', { type: 'image/avif' } );
		await expect(
			instance.uploadOptimizedImage( 5, file )
		).rejects.toThrow();
	} );

	it( 'throws when apiFetch rejects', async () => {
		const instance = createInstance();
		vi.mocked( apiFetch ).mockRejectedValue( new Error( 'Upload failed' ) );

		const file = new File( [ 'abc' ], 'test.avif', { type: 'image/avif' } );
		await expect(
			instance.uploadOptimizedImage( 5, file )
		).rejects.toThrow( 'Upload failed' );
	} );
} );

describe( 'CrabMigration – runReplacementPhase', () => {
	it( 'fetches the replace-content endpoint', async () => {
		const instance = createInstance();
		const fetchMock = vi.fn().mockResolvedValue( {
			ok: true,
			json: async () => ( {
				replaced: 0,
				total_pages: 1,
				is_last: true,
			} ),
		} );
		vi.stubGlobal( 'fetch', fetchMock );

		await instance.runReplacementPhase( DEFAULT_SETTINGS );

		expect( fetchMock ).toHaveBeenCalledTimes( 1 );
		const calledUrl: string = fetchMock.mock.calls[ 0 ][ 0 ];
		expect( calledUrl ).toContain( 'replace-content' );
	} );

	it( 'includes the page query parameter', async () => {
		const instance = createInstance();
		const fetchMock = vi.fn().mockResolvedValue( {
			ok: true,
			json: async () => ( {
				replaced: 0,
				total_pages: 1,
				is_last: true,
			} ),
		} );
		vi.stubGlobal( 'fetch', fetchMock );

		await instance.runReplacementPhase( DEFAULT_SETTINGS );
		expect( fetchMock.mock.calls[ 0 ][ 0 ] ).toContain( 'page=1' );
	} );

	it( 'sends the correct nonce header', async () => {
		const instance = createInstance();
		const fetchMock = vi.fn().mockResolvedValue( {
			ok: true,
			json: async () => ( {
				replaced: 0,
				total_pages: 1,
				is_last: true,
			} ),
		} );
		vi.stubGlobal( 'fetch', fetchMock );

		await instance.runReplacementPhase( DEFAULT_SETTINGS );
		expect( fetchMock.mock.calls[ 0 ][ 1 ].headers[ 'X-WP-Nonce' ] ).toBe(
			DEFAULT_SETTINGS.nonce
		);
	} );

	it( 'accumulates replacedPostsCount from multiple pages', async () => {
		const instance = createInstance();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					replaced: 3,
					total_pages: 2,
					is_last: false,
				} ),
			} )
			.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					replaced: 2,
					total_pages: 2,
					is_last: true,
				} ),
			} );
		vi.stubGlobal( 'fetch', fetchMock );

		await instance.runReplacementPhase( DEFAULT_SETTINGS );
		expect( instance.replacedPostsCount ).toBe( 5 );
	} );

	it( 'paginates until is_last is true', async () => {
		const instance = createInstance();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					replaced: 1,
					total_pages: 3,
					is_last: false,
				} ),
			} )
			.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					replaced: 1,
					total_pages: 3,
					is_last: false,
				} ),
			} )
			.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					replaced: 1,
					total_pages: 3,
					is_last: true,
				} ),
			} );
		vi.stubGlobal( 'fetch', fetchMock );

		await instance.runReplacementPhase( DEFAULT_SETTINGS );
		expect( fetchMock ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'logs updated post counts for pages with replacements', async () => {
		const instance = createInstance();
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue( {
				ok: true,
				json: async () => ( {
					replaced: 4,
					total_pages: 1,
					is_last: true,
				} ),
			} )
		);

		await instance.runReplacementPhase( DEFAULT_SETTINGS );

		const logs = document.getElementById( 'migration-logs' )!;
		const logTexts = Array.from( logs.children ).map(
			( el ) => el.textContent ?? ''
		);
		expect( logTexts.some( ( t ) => t.includes( '4' ) ) ).toBe( true );
	} );

	it( 'stops and logs error when fetch throws', async () => {
		const instance = createInstance();
		vi.stubGlobal(
			'fetch',
			vi.fn().mockRejectedValue( new Error( 'Net error' ) )
		);

		await instance.runReplacementPhase( DEFAULT_SETTINGS );

		const logs = document.getElementById( 'migration-logs' )!;
		const logTexts = Array.from( logs.children ).map(
			( el ) => el.textContent ?? ''
		);
		expect(
			logTexts.some(
				( t ) =>
					t.includes( 'Net error' ) ||
					t.includes( 'error' ) ||
					t.includes( 'Error' )
			)
		).toBe( true );
	} );

	it( 'stops early when isPaused is true', async () => {
		const instance = createInstance();
		instance.isPaused = true;
		const fetchMock = vi.fn();
		vi.stubGlobal( 'fetch', fetchMock );

		await instance.runReplacementPhase( DEFAULT_SETTINGS );
		expect( fetchMock ).not.toHaveBeenCalled();
	} );
} );

describe( 'CrabMigration – getMigrationStatus', () => {
	it( 'returns the parsed JSON response', async () => {
		const instance = createInstance();
		const statusData = { pending: 2, completed: 5, failed: 1, total: 8 };
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue( {
				ok: true,
				json: async () => statusData,
			} )
		);

		const result = await instance.getMigrationStatus( DEFAULT_SETTINGS );
		expect( result ).toEqual( statusData );
	} );

	it( 'uses GET method', async () => {
		const instance = createInstance();
		const fetchMock = vi.fn().mockResolvedValue( {
			ok: true,
			json: async () => ( {} ),
		} );
		vi.stubGlobal( 'fetch', fetchMock );

		await instance.getMigrationStatus( DEFAULT_SETTINGS );
		expect( fetchMock.mock.calls[ 0 ][ 1 ].method ).toBe( 'GET' );
	} );

	it( 'includes the nonce header', async () => {
		const instance = createInstance();
		const fetchMock = vi.fn().mockResolvedValue( {
			ok: true,
			json: async () => ( {} ),
		} );
		vi.stubGlobal( 'fetch', fetchMock );

		await instance.getMigrationStatus( DEFAULT_SETTINGS );
		expect( fetchMock.mock.calls[ 0 ][ 1 ].headers[ 'X-WP-Nonce' ] ).toBe(
			DEFAULT_SETTINGS.nonce
		);
	} );

	it( 'fetches the get-migration-status endpoint', async () => {
		const instance = createInstance();
		const fetchMock = vi.fn().mockResolvedValue( {
			ok: true,
			json: async () => ( {} ),
		} );
		vi.stubGlobal( 'fetch', fetchMock );

		await instance.getMigrationStatus( DEFAULT_SETTINGS );
		expect( fetchMock.mock.calls[ 0 ][ 0 ] ).toContain(
			'get-migration-status'
		);
	} );

	it( 'returns null when fetch throws', async () => {
		const instance = createInstance();
		vi.stubGlobal(
			'fetch',
			vi.fn().mockRejectedValue( new Error( 'offline' ) )
		);

		const result = await instance.getMigrationStatus( DEFAULT_SETTINGS );
		expect( result ).toBeNull();
	} );

	it( 'returns null when the response is not ok', async () => {
		const instance = createInstance();
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue( { ok: false, status: 401 } )
		);

		const result = await instance.getMigrationStatus( DEFAULT_SETTINGS );
		expect( result ).toBeNull();
	} );
} );
