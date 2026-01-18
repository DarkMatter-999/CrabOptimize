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
	 * Enqueues admin styles and scripts for the plugin.
	 *
	 * @return void
	 */
	public function enqueue_admin_assets() {
		$style_asset = include DMCO_PLUGIN_PATH . 'assets/build/css/main.asset.php';
		wp_enqueue_style(
			'main-css',
			DMCO_PLUGIN_URL . 'assets/build/css/main.css',
			$style_asset['dependencies'],
			$style_asset['version']
		);

		$script_asset = include DMCO_PLUGIN_PATH . 'assets/build/js/main.asset.php';

		wp_enqueue_script(
			'main-js',
			DMCO_PLUGIN_URL . 'assets/build/js/main.js',
			$script_asset['dependencies'],
			$script_asset['version'],
			true
		);
	}

	/**
	 * Enqueues styles and scripts for the block editor.
	 *
	 * @return void
	 */
	public function enqueue_block_editor_assets() {
		$style_asset = include DMCO_PLUGIN_PATH . 'assets/build/css/editor.asset.php';

		wp_enqueue_style(
			'editor-css',
			DMCO_PLUGIN_URL . 'assets/build/css/editor.css',
			$style_asset['dependencies'],
			$style_asset['version']
		);

		$script_asset = include DMCO_PLUGIN_PATH . 'assets/build/js/editor.asset.php';

		wp_enqueue_script(
			'editor-js',
			DMCO_PLUGIN_URL . 'assets/build/js/editor.js',
			$script_asset['dependencies'],
			$script_asset['version'],
			true
		);
	}
}
