<?php
/**
 * Main Media Class File
 *
 * @package DM_Crab_Optimize
 **/

namespace DM_Crab_Optimize;

use DM_Crab_Optimize\Traits\Singleton;

/**
 * Media Class
 *
 * Handles backend Media Library modifications.
 *
 * @since 1.0.0
 **/
class Media {

	use Singleton;

	/**
	 * Constructor for the Media class.
	 *
	 * @return void
	 */
	public function __construct() {
		add_filter( 'manage_media_columns', array( $this, 'add_optimized_column' ) );
		add_action( 'manage_media_custom_column', array( $this, 'display_optimized_column_content' ), 10, 2 );
		add_filter( 'manage_upload_sortable_columns', array( $this, 'make_optimized_column_sortable' ) );
		add_action( 'add_attachment', array( $this, 'save_crab_optimization_meta' ) );
	}

	/**
	 * Adds the "Optimized" column to the Media Library list view.
	 *
	 * @param array $columns Existing columns.
	 * @return array Modified columns.
	 */
	public function add_optimized_column( $columns ) {
		$columns['crab_optimized'] = __( 'Crab Optimized', 'dm-crab-optimize' );
		return $columns;
	}

	/**
	 * Displays the optimization status in the custom column.
	 *
	 * @param string $column_name Name of the column.
	 * @param int    $post_id     ID of the media attachment.
	 * @return void
	 */
	public function display_optimized_column_content( $column_name, $post_id ) {
		if ( 'crab_optimized' !== $column_name ) {
			return;
		}

		$is_optimized = get_post_meta( $post_id, 'is_crab_optimized', true );

		if ( 'true' === $is_optimized ) {
			echo '<span class="dashicons dashicons-saved" style="color: #46b450;" title="Optimized to AVIF"></span>';
			echo ' <code style="font-size: 10px;">AVIF</code>';
		} else {
			echo '<span class="dashicons dashicons-minus" style="color: #ccc;"></span>';
		}
	}

	/**
	 * Makes the optimization column sortable.
	 *
	 * @param array $columns Sortable columns.
	 * @return array Modified sortable columns.
	 */
	public function make_optimized_column_sortable( $columns ) {
		$columns['crab_optimized'] = 'is_crab_optimized';
		return $columns;
	}

	/**
	 * Saves the optimization flag to post meta if present in the upload request.
	 *
	 * @param int $post_id The ID of the attachment.
	 */
	public function save_crab_optimization_meta( $post_id ) {
		$is_plupload = isset( $_REQUEST['_wpnonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_REQUEST['_wpnonce'] ) ), 'media-form' );

		$is_rest_api = defined( 'REST_REQUEST' ) && REST_REQUEST;

		if ( ! $is_plupload && ! $is_rest_api ) {
			return;
		}

		if ( isset( $_POST['is_crab_optimized'] ) && 'true' === $_POST['is_crab_optimized'] ) {
			update_post_meta( $post_id, 'is_crab_optimized', 'true' );
		}
	}
}
