import { describe, it, expect, vi, beforeEach } from 'vitest';

describe( 'Attachment Badge Integration', () => {
	beforeEach( () => {
		vi.resetModules();
		vi.restoreAllMocks();
		document.body.innerHTML = '';
	} );

	it( 'should use the logic directly from the source file', async () => {
		const originalRender = vi.fn();
		function MockAttachment() {}
		MockAttachment.prototype.render = originalRender;

		vi.stubGlobal( 'window', {
			dmCrabSettingsMain: { showBadge: true },
			wp: {
				media: { view: { Attachment: MockAttachment } },
			},
		} );

		await import( '../main.ts' );

		document.dispatchEvent( new Event( 'DOMContentLoaded' ) );

		const instance = new ( MockAttachment as any )();
		instance.el = document.createElement( 'div' );
		instance.model = {
			get: vi.fn().mockImplementation( ( key ) => {
				if ( key === 'meta' ) {
					return { is_crab_optimized: 'true' };
				}
				return null;
			} ),
		};

		instance.render();

		const badge = instance.el.querySelector( '.dm-crab-badge' );
		expect( badge ).not.toBeNull();
		expect( badge.innerHTML ).toBe( '🦀' );
	} );
} );
