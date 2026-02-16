import { vi } from 'vitest';

export const __ = vi.fn( ( text: string ) => text );
export const _x = vi.fn( ( text: string ) => text );
export const _n = vi.fn( ( single: string ) => single );
