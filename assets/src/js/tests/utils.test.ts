import { describe, it, expect, vi } from 'vitest';
import { getImageDimensions, calculateDimensions } from '../utils.ts';

describe( 'getImageDimensions', () => {
	it( 'should return natural dimensions and cleanup the object URL', async () => {
		const createObjectURLMock = vi.fn( () => 'mock-url' );
		const revokeObjectURLMock = vi.fn();

		vi.stubGlobal( 'URL', {
			createObjectURL: createObjectURLMock,
			revokeObjectURL: revokeObjectURLMock,
		} );

		const MockImage = vi.fn( function () {
			this.naturalWidth = 1024;
			this.naturalHeight = 768;
			this.onload = () => {};

			Object.defineProperty( this, 'src', {
				set: ( value ) => {
					this._src = value;
					setTimeout( () => this.onload(), 0 );
				},
				get: () => this._src,
			} );
		} );

		vi.stubGlobal( 'Image', MockImage );

		const file = new File( [ '' ], 'test.jpg', { type: 'image/jpeg' } );
		const dimensions = await getImageDimensions( file );

		expect( dimensions ).toEqual( { w: 1024, h: 768 } );
		expect( createObjectURLMock ).toHaveBeenCalledWith( file );
		expect( revokeObjectURLMock ).toHaveBeenCalledWith( 'mock-url' );

		vi.unstubAllGlobals();
	} );
} );

describe( 'calculateDimensions', () => {
	const original = { w: 2000, h: 1000 }; // 2:1 Aspect Ratio

	it( 'returns null if no target dimensions are provided', () => {
		expect( calculateDimensions( 2000, 1000 ) ).toBeNull();
		expect( calculateDimensions( 2000, 1000, 0, 0 ) ).toBeNull();
	} );

	it( 'returns exact dimensions when crop is true', () => {
		const result = calculateDimensions(
			original.w,
			original.h,
			300,
			300,
			true
		);
		expect( result ).toEqual( { width: 300, height: 300 } );
	} );

	it( 'scales based on width only', () => {
		const result = calculateDimensions(
			original.w,
			original.h,
			500,
			undefined
		);
		// Original 2:1 -> 500w should result in 250h
		expect( result ).toEqual( { width: 500, height: 250 } );
	} );

	it( 'scales based on height only', () => {
		const result = calculateDimensions(
			original.w,
			original.h,
			undefined,
			500
		);
		// Original 2:1 -> 500h should result in 1000w
		expect( result ).toEqual( { width: 1000, height: 500 } );
	} );

	it( 'fits within a bounding box (constrained by height)', () => {
		// Target 400x400. Since original is wide (2:1), height will be the constraint
		// 400w / 200h fits in the 400x400 box.
		const result = calculateDimensions( original.w, original.h, 400, 400 );
		expect( result ).toEqual( { width: 400, height: 200 } );
	} );

	it( 'fits within a bounding box (constrained by width)', () => {
		const portrait = { w: 1000, h: 2000 }; // 1:2 Aspect Ratio
		const result = calculateDimensions( portrait.w, portrait.h, 400, 400 );
		expect( result ).toEqual( { width: 200, height: 400 } );
	} );

	it( 'never scales up beyond original dimensions', () => {
		const small = { w: 100, h: 100 };
		const result = calculateDimensions( small.w, small.h, 500, 500 );
		expect( result ).toEqual( { width: 100, height: 100 } );
	} );

	it( 'handles rounding correctly', () => {
		// 100 / 3 = 33.333...
		const result = calculateDimensions( 100, 100, 33, undefined );
		expect( result?.height ).toBe( 33 );
	} );
} );
