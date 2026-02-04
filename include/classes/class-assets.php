<?php
/**
 * Main Assets Class File
 *
 * Main Theme Asset class file for the Plugin. This class enqueues the necessary scripts and styles.
 *
 * @package DM_Crab_Optimize
 **/

namespace DM_Crab_Optimize;

use DM_Crab_Optimize\Traits\Singleton;

/**
 * Main Assets Class File
 *
 * Main Theme Asset class file for the Plugin. This class enqueues the necessary scripts and styles.
 *
 * @since 1.0.0
 **/
class Assets {

	use Singleton;

	/**
	 * Constructor for the Assets class.
	 *
	 * @return void
	 */
	public function __construct() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
		add_action(
			'enqueue_block_editor_assets',
			array(
				$this,
				'enqueue_block_editor_assets',
			)
		);
	}

	/**
	 * Enqueue admin styles and scripts for the plugin.
	 *
	 * Loads the compiled CSS and JS assets for the admin interface.
	 *
	 * @param string $hook The current admin page hook suffix.
	 * @return void
	 */
	public function enqueue_admin_assets( $hook ) {
		if ( $this->is_media_hook( $hook ) ) {
			$style_asset = include DMCO_PLUGIN_PATH . 'assets/build/css/main.asset.php';
			wp_enqueue_style(
				'dm-crap-opt-main-css',
				DMCO_PLUGIN_URL . 'assets/build/css/main.css',
				$style_asset['dependencies'],
				$style_asset['version']
			);

			$script_asset = include DMCO_PLUGIN_PATH . 'assets/build/js/main.asset.php';

			wp_enqueue_script(
				'dm-crab-opt-main-js',
				DMCO_PLUGIN_URL . 'assets/build/js/main.js',
				$script_asset['dependencies'],
				$script_asset['version'],
				true
			);

			$this->enqueue_settings_script();
		}

		if ( 'upload.php' === $hook || 'media-new.php' === $hook ) {
			$script_asset = include DMCO_PLUGIN_PATH . 'assets/build/js/editor.asset.php';

			wp_enqueue_script(
				'dm-crab-opt-editor-js',
				DMCO_PLUGIN_URL . 'assets/build/js/editor.js',
				$script_asset['dependencies'],
				$script_asset['version'],
				true
			);
		}
	}

	/**
	 * Enqueues styles and scripts for the block editor.
	 *
	 * @return void
	 */
	public function enqueue_block_editor_assets() {
		$style_asset = include DMCO_PLUGIN_PATH . 'assets/build/css/editor.asset.php';

		wp_enqueue_style(
			'dm-crab-opt-editor-css',
			DMCO_PLUGIN_URL . 'assets/build/css/editor.css',
			$style_asset['dependencies'],
			$style_asset['version']
		);

		$script_asset = include DMCO_PLUGIN_PATH . 'assets/build/js/editor.asset.php';

		wp_enqueue_script(
			'dm-crab-opt-editor-js',
			DMCO_PLUGIN_URL . 'assets/build/js/editor.js',
			$script_asset['dependencies'],
			$script_asset['version'],
			true
		);

		$this->enqueue_settings_script();
	}

	/**
	 * Determines whether the given admin page hook corresponds to a media-related screen.
	 *
	 * @param string $hook The current admin page hook suffix.
	 * @return bool True if the hook matches a media-related admin page, false otherwise.
	 */
	private function is_media_hook( $hook ) {
		return in_array(
			$hook,
			array(
				'post.php',
				'post-new.php',
				'upload.php',
				'media-new.php',
				'widgets.php',
				'site-editor.php',
				'media_page_dm-crab-optimize-settings',
			),
			true
		);
	}

	/**
	 * Enqueues the inline settings script used by the plugin.
	 *
	 * Registers an empty script handle and adds a localized settings object to the
	 * global `window.dmCrabSettingsMain` variable.
	 *
	 * @return void
	 */
	private function enqueue_settings_script() {
		wp_register_script(
			'dm-crab-settings-main',
			'',
			array(),
			'v1.0',
			true
		);

		wp_enqueue_script( 'dm-crab-settings-main' );

		wp_add_inline_script(
			'dm-crab-settings-main',
			'window.dmCrabSettingsMain = ' . wp_json_encode(
				array(
					'saveUnoptimized' => (int) get_option( 'dm_crab_optimize_keep_optimized', 0 ),
					'showBadge'       => (int) get_option( 'dm_crab_optimize_show_badge', 0 ),
					'imageSizes'      => wp_get_registered_image_subsizes(),
				)
			) . ';',
			'before'
		);
	}
}
