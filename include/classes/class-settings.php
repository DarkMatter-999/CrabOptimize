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

		register_setting(
			'dm_crab_optimize_settings_group',
			'dm_crab_optimize_generate_thumbnails',
			array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'default'           => 0,
			)
		);

		register_setting(
			'dm_crab_optimize_settings_group',
			'dm_crab_optimize_format',
			array(
				'type'              => 'string',
				'sanitize_callback' => array( $this, 'sanitize_format' ),
				'default'           => 'avif',
			)
		);

		register_setting(
			'dm_crab_optimize_settings_group',
			'dm_crab_optimize_quality',
			array(
				'type'              => 'number',
				'sanitize_callback' => array( $this, 'sanitize_quality' ),
				'default'           => 70,
			)
		);

		register_setting(
			'dm_crab_optimize_settings_group',
			'dm_crab_optimize_quality_webp',
			array(
				'type'              => 'number',
				'sanitize_callback' => array( $this, 'sanitize_quality' ),
				'default'           => 75,
			)
		);

		register_setting(
			'dm_crab_optimize_settings_group',
			'dm_crab_optimize_speed',
			array(
				'type'              => 'integer',
				'sanitize_callback' => array( $this, 'sanitize_speed' ),
				'default'           => 10,
			)
		);
	}

	/**
	 * Sanitize quality setting - ensure it's between 0 and 100.
	 *
	 * @param mixed $value The value to sanitize.
	 * @return float The sanitized quality value.
	 */
	public function sanitize_quality( $value ) {
		$quality = floatval( $value );
		return max( 0, min( 100, $quality ) );
	}

	/**
	 * Sanitize speed setting - ensure it's between 0 and 10.
	 *
	 * @param mixed $value The value to sanitize.
	 * @return int The sanitized speed value.
	 */
	public function sanitize_speed( $value ) {
		$speed = intval( $value );
		return max( 0, min( 10, $speed ) );
	}

	/**
	 * Sanitize format setting - ensure it's a valid format.
	 *
	 * @param mixed $value The value to sanitize.
	 * @return string The sanitized format value.
	 */
	public function sanitize_format( $value ) {
		$allowed_formats = array( 'avif', 'webp' );
		$format          = sanitize_text_field( $value );
		return in_array( $format, $allowed_formats, true ) ? $format : 'avif';
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
					<th scope="row"><?php esc_html_e( 'Keep Unoptimized Images', 'dm-crab-optimize' ); ?></th>
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
					<tr valign="top">
					<th scope="row"><?php esc_html_e( 'Generate Thumbnails on frontend', 'dm-crab-optimize' ); ?></th>
					<td>
						<label class="dm-crab-toggle-switch">
							<input type="checkbox" name="dm_crab_optimize_generate_thumbnails" value="1" <?php checked( get_option( 'dm_crab_optimize_generate_thumbnails' ), 1 ); ?> />
							<span class="dm-crab-slider"></span>
						</label>
					</td>
					</tr>
					<tr valign="top">
					<th scope="row"><label for="dm_crab_optimize_format"><?php esc_html_e( 'Image Format', 'dm-crab-optimize' ); ?></label></th>
					<td>
						<select id="dm_crab_optimize_format" name="dm_crab_optimize_format">
							<option value="avif" <?php selected( get_option( 'dm_crab_optimize_format', 'avif' ), 'avif' ); ?>><?php esc_html_e( 'AVIF', 'dm-crab-optimize' ); ?></option>
							<option value="webp" <?php selected( get_option( 'dm_crab_optimize_format', 'avif' ), 'webp' ); ?>><?php esc_html_e( 'WebP', 'dm-crab-optimize' ); ?></option>
						</select>
						<p class="description"><?php esc_html_e( 'Select the image format to use for optimization. Additional formats (JPEG, PNG) will be supported in the future.', 'dm-crab-optimize' ); ?></p>
					</td>
					</tr>
					<tr valign="top">
					<th scope="row"><label for="dm_crab_optimize_quality"><?php esc_html_e( 'AVIF Quality', 'dm-crab-optimize' ); ?></label></th>
					<td>
						<input type="number" id="dm_crab_optimize_quality" name="dm_crab_optimize_quality" min="0" max="100" value="<?php echo esc_attr( get_option( 'dm_crab_optimize_quality', 70 ) ); ?>" />
						<p class="description"><?php esc_html_e( 'AVIF quality level (0-100). Higher values produce better quality but larger files. Default: 70', 'dm-crab-optimize' ); ?></p>
					</td>
					</tr>
					<tr valign="top">
					<th scope="row"><label for="dm_crab_optimize_quality_webp"><?php esc_html_e( 'WebP Quality', 'dm-crab-optimize' ); ?></label></th>
					<td>
						<input type="number" id="dm_crab_optimize_quality_webp" name="dm_crab_optimize_quality_webp" min="0" max="100" value="<?php echo esc_attr( get_option( 'dm_crab_optimize_quality_webp', 75 ) ); ?>" />
						<p class="description"><?php esc_html_e( 'WebP quality level (0-100). Higher values produce better quality but larger files. Default: 75', 'dm-crab-optimize' ); ?></p>
					</td>
					</tr>
					<tr valign="top">
					<th scope="row"><label for="dm_crab_optimize_speed"><?php esc_html_e( 'Compression Speed', 'dm-crab-optimize' ); ?></label></th>
					<td>
						<input type="number" id="dm_crab_optimize_speed" name="dm_crab_optimize_speed" min="0" max="10" value="<?php echo esc_attr( get_option( 'dm_crab_optimize_speed', 10 ) ); ?>" />
						<p class="description"><?php esc_html_e( 'Compression speed (0-10). Lower values produce smaller files but take longer. Default: 10', 'dm-crab-optimize' ); ?></p>
					</td>
					</tr>
				</table>
				<?php submit_button(); ?>
			</form>
		</div>
		<?php
	}
}
