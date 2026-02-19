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
		add_filter( 'intermediate_image_sizes_advanced', array( $this, 'disable_image_thumbnails' ), 10, 3 );
		add_filter( 'wp_generate_attachment_metadata', array( $this, 'handle_thumbnails' ), 10, 2 );
		add_filter( 'wp_prepare_attachment_for_js', array( $this, 'expose_meta_to_js' ), 10, 2 );
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
	 * Displays the optimization status and format in the custom column.
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
			$format = get_post_meta( $post_id, 'crab_optimized_format', true );
			$format = $format ? strtoupper( $format ) : 'AVIF';
			$title  = "Optimized to {$format}";

			echo '<span class="dashicons dashicons-saved" style="color: #46b450;" title="' . esc_attr( $title ) . '"></span>';
			echo ' <code style="font-size: 10px;">' . esc_html( $format ) . '</code>';
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
	 * Saves the optimization flag and format to post meta if present in the upload request.
	 *
	 * @param int $post_id The ID of the attachment.
	 */
	public function save_crab_optimization_meta( $post_id ) {
		$is_plupload = isset( $_REQUEST['_wpnonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_REQUEST['_wpnonce'] ) ), 'media-form' );

		$is_rest_api = defined( 'REST_REQUEST' ) && REST_REQUEST;

		if ( ! $is_plupload && ! $is_rest_api ) {
			return;
		}

		if ( isset( $_REQUEST['is_crab_optimized'] ) && 'true' === $_REQUEST['is_crab_optimized'] ) {
			update_post_meta( $post_id, 'is_crab_optimized', 'true' );

			$mime_type = get_post_mime_type( $post_id );
			if ( 'image/avif' === $mime_type ) {
				update_post_meta( $post_id, 'crab_optimized_format', 'avif' );
			} elseif ( 'image/webp' === $mime_type ) {
				update_post_meta( $post_id, 'crab_optimized_format', 'webp' );
			}
		}
	}

	/**
	 * Makes the 'is_crab_optimized' and 'crab_optimized_format' meta accessible to the JS Media models.
	 *
	 * @param array   $response   Array of prepared attachment data.
	 * @param WP_Post $attachment Attachment object.
	 * @return array
	 */
	public function expose_meta_to_js( $response, $attachment ) {
		if ( empty( $response['meta'] ) || ! is_array( $response['meta'] ) ) {
			$response['meta'] = array();
		}

		$response['meta']['is_crab_optimized']     = get_post_meta( $attachment->ID, 'is_crab_optimized', true );
		$response['meta']['crab_optimized_format'] = get_post_meta( $attachment->ID, 'crab_optimized_format', true );

		return $response;
	}

	/**
	 * Disable generation of intermediate image sizes for optimized attachments.
	 *
	 * @param array $sizes        Array of image sizes that would be generated.
	 * @param array $metadata     Attachment metadata array.
	 * @param int   $attachment_id Attachment post ID.
	 * @return array Modified list of sizes (empty for optimized formats).
	 */
	public function disable_image_thumbnails( $sizes, $metadata, $attachment_id ) {
		if ( ! get_option( 'dm_crab_optimize_generate_thumbnails', 0 ) ) {
			return $sizes;
		}

		$mime_type = get_post_mime_type( $attachment_id );

		if ( 'image/avif' === $mime_type || 'image/webp' === $mime_type ) {
			return array();
		}

		return $sizes;
	}

	/**
	 * Handle creation of optimized thumbnail files when the upload request includes them.
	 *
	 * This method checks the request context (Plupload or REST API), verifies that
	 * the required fields are present, decodes the base‑64 image data and writes the
	 * thumbnail files to the uploads directory. It then adds the generated sizes
	 * to the attachment metadata array.
	 *
	 * @param array $metadata     Existing attachment metadata.
	 * @param int   $attachment_id Attachment post ID.
	 * @return array Updated metadata including any optimized thumbnails.
	 */
	public function handle_thumbnails( $metadata, $attachment_id ) {
		if ( ! get_option( 'dm_crab_optimize_generate_thumbnails', 0 ) ) {
			return $metadata;
		}

		$is_plupload = isset( $_REQUEST['_wpnonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_REQUEST['_wpnonce'] ) ), 'media-form' );

		$is_rest_api = defined( 'REST_REQUEST' ) && REST_REQUEST;

		if ( ! $is_plupload && ! $is_rest_api ) {
			return $metadata;
		}

		if ( ! isset( $_REQUEST['is_crab_optimized'] ) || ! isset( $_REQUEST['crab_thumbnails'] ) ) {
			return $metadata;
		}

		$crab_thumbnails_raw = isset( $_REQUEST['crab_thumbnails'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['crab_thumbnails'] ) ) : '';
		$thumbnails          = json_decode( $crab_thumbnails_raw, true );
		if ( empty( $thumbnails ) ) {
			return $metadata;
		}

		$file_path  = get_attached_file( $attachment_id );
		$upload_dir = dirname( $file_path );
		$base_name  = pathinfo( $file_path, PATHINFO_FILENAME );

		$mime_type           = get_post_mime_type( $attachment_id );
		$extension           = 'avif';
		$mime_type_thumbnail = 'image/avif';

		if ( 'image/webp' === $mime_type ) {
			$extension           = 'webp';
			$mime_type_thumbnail = 'image/webp';
		}

		foreach ( $thumbnails as $thumb ) {
			$size_name = sanitize_text_field( $thumb['size'] );
			$width     = intval( $thumb['width'] );
			$height    = intval( $thumb['height'] );

			$thumb_filename = "{$base_name}-{$width}x{$height}.{$extension}";
			$thumb_path     = "{$upload_dir}/{$thumb_filename}";

			global $wp_filesystem;
			if ( empty( $wp_filesystem ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
				WP_Filesystem();
			}

			$decoded_data = base64_decode( $thumb['data'] ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode

			if ( $wp_filesystem && $wp_filesystem->put_contents( $thumb_path, $decoded_data, FS_CHMOD_FILE ) === false ) {
				return $metadata;
			}

			$metadata['sizes'][ $size_name ] = array(
				'file'      => $thumb_filename,
				'width'     => $width,
				'height'    => $height,
				'mime-type' => $mime_type_thumbnail,
			);
		}

		return $metadata;
	}
}
