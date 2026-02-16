import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock( '../../../../wasm/pkg/craboptimize_wasm', () => ( {
	default: vi.fn().mockResolvedValue( true ),
	convert_to_avif: vi.fn( () => ( {
		buffer: new Uint8Array( [ 5, 6, 7, 8 ] ).buffer,
	} ) ),
	convert_to_avif_resize: vi.fn( () => ( {
		buffer: new Uint8Array( [ 1, 2, 3, 4 ] ).buffer,
	} ) ),
} ) );

describe( 'CrabWorker', () => {
	beforeEach( async () => {
		vi.resetModules();
		vi.clearAllMocks();

		vi.stubGlobal( 'self', {
			postMessage: vi.fn(),
			onmessage: null,
		} );

		vi.stubGlobal( 'performance', {
			now: vi.fn().mockReturnValue( 0 ),
		} );

		await import( '../crab-worker.ts' );
	} );

	it( 'should replace the file extension correctly', async () => {
		const mockData = {
			fileBuffer: new ArrayBuffer( 8 ),
			fileName: 'my.image.with.many.dots.jpeg',
			width: 0,
			height: 0,
		};

		if ( typeof self.onmessage !== 'function' ) {
			throw new Error( 'Worker failed to assign self.onmessage' );
		}

		await ( self as any ).onmessage( { data: mockData } as MessageEvent );

		const response = vi.mocked( self.postMessage ).mock.calls[ 0 ][ 0 ];
		expect( response.fileName ).toBe( 'my.image.with.many.dots.avif' );
	} );
} );
