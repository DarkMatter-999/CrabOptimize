import { afterEach, vi } from 'vitest';

afterEach( () => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
} );

if ( typeof window !== 'undefined' ) {
	( window as any ).wp = ( window as any ).wp || {};
}
