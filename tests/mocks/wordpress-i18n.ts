import { vi } from 'vitest';

export const __ = vi.fn( ( text: string ) => text );
export const _x = vi.fn( ( text: string ) => text );
export const _n = vi.fn( ( single: string ) => single );
export const sprintf = vi.fn( ( format: string, ...args: any[] ) => {
	let i = 0;
	return format.replace( /%(?:\d+\$)?[sdif]/g, () =>
		String( args[ i++ ] ?? '' )
	);
} );
