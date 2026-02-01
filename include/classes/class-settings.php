<?php
/**
 * Main Settings Class File
 *
 * @package DM_Crab_Optimize
 **/

namespace DM_Crab_Optimize;

use DM_Crab_Optimize\Traits\Singleton;

/**
 * Settings Class
 *
 * Handles backend settings modifications.
 *
 * @since 1.0.0
 **/
class Settings {

	use Singleton;

	/**
	 * Constructor for the Settings class.
	 *
	 * @return void
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'add_settings_page' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
	}

	/**
	 * Add the settings page under the Media menu.
	 *
	 * @since 1.0.0
	 */
	public function add_settings_page() {
		add_media_page(
			__( 'CrabOptimize Settings', 'dm-crab-optimize' ),
			__( 'CrabOptimize', 'dm-crab-optimize' ),
			'manage_options',
			'dm-crab-optimize-settings',
			array( $this, 'render_settings_page' )
		);
	}

	/**
	 * Register plugin settings for optimized image handling.
	 *
	 * @since 1.0.0
	 */
	public function register_settings() {
		register_setting(
			'dm_crab_optimize_settings_group',
			'dm_crab_optimize_keep_optimized',
			array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'default'           => 0,
			)
		);

		register_setting(
			'dm_crab_optimize_settings_group',
			'dm_crab_optimize_show_badge',
			array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'default'           => 0,
			)
		);
	}

	/**
	 * Render the settings page markup.
	 *
	 * @since 1.0.0
	 */
	public function render_settings_page() {
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Crab Optimize Settings', 'dm-crab-optimize' ); ?></h1>
			<form method="post" action="options.php">
				<?php
				settings_fields( 'dm_crab_optimize_settings_group' );
				do_settings_sections( 'dm_crab_optimize_settings_group' );
				?>
				<table class="form-table">
					<tr valign="top">
					<th scope="row"><?php esc_html_e( 'Keep Optimized Images', 'dm-crab-optimize' ); ?></th>
					<td>
						<label class="dm-crab-toggle-switch">
							<input type="checkbox" name="dm_crab_optimize_keep_optimized" value="1" <?php checked( get_option( 'dm_crab_optimize_keep_optimized' ), 1 ); ?> />
							<span class="dm-crab-slider"></span>
						</label>
					</td>
					</tr>
					<tr valign="top">
					<th scope="row"><?php esc_html_e( 'Show Crab Badge for Optimized images', 'dm-crab-optimize' ); ?></th>
					<td>
						<label class="dm-crab-toggle-switch">
							<input type="checkbox" name="dm_crab_optimize_show_badge" value="1" <?php checked( get_option( 'dm_crab_optimize_show_badge' ), 1 ); ?> />
							<span class="dm-crab-slider"></span>
						</label>
					</td>
					</tr>
				</table>
				<?php submit_button(); ?>
			</form>
		</div>
		<?php
	}
}
