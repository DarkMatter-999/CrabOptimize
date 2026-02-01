import { __ } from '@wordpress/i18n';

document.addEventListener( 'DOMContentLoaded', () => {
	if ( ! window?.dmCrabSettingsMain?.showBadge ) {
		return;
	}

	if ( ! window.wp?.media?.view?.Attachment ) {
		return;
	}

	const Attachment = window.wp.media.view.Attachment;
	const originalRender = Attachment.prototype.render;

	Attachment.prototype.render = function (
		this: AttachmentView
	): AttachmentView {
		// eslint-disable-next-line prefer-rest-params
		originalRender.apply( this, arguments as any );

		const meta = this.model.get( 'meta' );

		if ( 'true' === meta?.is_crab_optimized ) {
			const badge = document.createElement( 'div' );
			badge.className = 'dm-crab-badge';

			badge.title = __( 'Crab Optimized', 'dm-crab-optimize' );
			badge.innerHTML = '🦀';

			this.el.appendChild( badge );
		}

		return this;
	};
} );
