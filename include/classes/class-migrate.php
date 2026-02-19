<?php
/**
 * Main Migrate Class File
 *
 * @package DM_Crab_Optimize
 **/

namespace DM_Crab_Optimize;

use DM_Crab_Optimize\Traits\Singleton;

/**
 * Migrate Class
 *
 * Handles backend migration operations.
 *
 * @since 1.0.0
 **/
class Migrate {
	/**
	 * Name of the custom table for tracking migration status.
	 *
	 * @var string
	 */
	private $table_name;

	/**
	 * Slug for the REST API namespace.
	 *
	 * @var string
	 */
	public $rest_namespace = 'dm-crab/v1';

	use Singleton;

	/**
	 * Constructor for the Migrate class.
	 *
	 * @return void
	 */
	public function __construct() {
		global $wpdb;
		$this->table_name = $wpdb->prefix . 'dm_crab_migration';

		add_action( 'rest_api_init', array( $this, 'register_migration_routes' ) );

								add_action( 'rest_insert_attachment', array( $this, 'handle_migration_link' ), 10, 3 );
	}

	/**
	 * Create the custom table if it doesn't exist.
	 */
	public function ensure_table_exists() {
		global $wpdb;
		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				attachment_id bigint(20) NOT NULL UNIQUE,
				optimized_id bigint(20) DEFAULT NULL,
				status varchar(20) DEFAULT 'pending',
				processed_at datetime DEFAULT NULL,
				PRIMARY KEY  (id)
			) $charset_collate;";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
	}

	/**
	 * Register REST API routes for migration operations.
	 */
	public function register_migration_routes() {
		register_rest_route(
			$this->rest_namespace,
			'/discover',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_discovery_chunk' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);

		register_rest_route(
			$this->rest_namespace,
			'/get-migration-status',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'handle_get_migration_status' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);

		register_rest_route(
			$this->rest_namespace,
			'/set-failure',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_set_failure' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'attachment_id' => array(
						'required'          => true,
						'validate_callback' => function ( $param ) {
							return is_numeric( $param ) && $param > 0;
						},
					),
				),
			)
		);
	}

	/**
	 * Check if the current user has permission to manage options.
	 *
	 * @return bool True if the user has permission, false otherwise.
	 */
	public function check_permission() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Fetch a specific chunk of images during discovery phase.
	 *
	 * @param \WP_REST_Request $request The REST request object containing parameters for pagination.
	 * @return \WP_REST_Response Response with discovered images.
	 */
	public function handle_discovery_chunk( \WP_REST_Request $request ) {
		$this->ensure_table_exists();

		$paged    = $request->get_param( 'page' ) ? (int) $request->get_param( 'page' ) : 1;
		$per_page = 50;

		$query = new \WP_Query(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'image',
				'post_status'    => 'inherit',
				'posts_per_page' => $per_page,
				'paged'          => $paged,
				'fields'         => 'ids',
			)
		);

		$ids      = $query->posts;
		$response = array();

		foreach ( $ids as $id ) {
			$is_optimized = get_post_meta( $id, 'is_crab_optimized', true );
			$optimized_id = get_post_meta( $id, 'crab_optimized_id', true );

			$response[] = array(
				'id'          => $id,
				'title'       => get_the_title( $id ),
				'url'         => wp_get_attachment_url( $id ),
				'mime_type'   => get_post_mime_type( $id ),
				'isOptimized' => ! empty( $is_optimized ),
				'optimizedId' => ( $optimized_id && get_post_status( (int) $optimized_id ) ) ? (int) $optimized_id : null,
			);

			if ( empty( $is_optimized ) ) {
				$this->add_to_migration_table( $id );
			}
		}

		return new \WP_REST_Response(
			array(
				'images'      => $response,
				'total_pages' => $query->max_num_pages,
				'current'     => $paged,
				'is_last'     => $paged >= $query->max_num_pages,
				'total_count' => $query->found_posts,
			),
			200
		);
	}

	/**
	 * Hook runs after a standard REST API media upload.
	 * We check if it's a migration upload and link it to the original.
	 *
	 * @param \WP_Post         $post    Inserted post object.
	 * @param \WP_REST_Request $request Request object.
	 * @param bool             $creating True when creating.
	 */
	public function handle_migration_link( $post, $request, $creating ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
		if ( ! $request->get_param( 'is_crab_migration' ) || ! $request->get_param( 'original_id' ) ) {
			return;
		}

		$optimized_id = $post->ID;
		$original_id  = (int) $request->get_param( 'original_id' );
		$format       = $request->get_param( 'crab_optimized_format' );

		update_post_meta( $optimized_id, 'crab_unoptimized_id', $original_id );
		update_post_meta( $original_id, 'crab_optimized_id', $optimized_id );

		if ( $format ) {
			update_post_meta( $original_id, 'crab_optimization_format', $format );
		}

		global $wpdb;
		$this->ensure_table_exists();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- We need to update the migration status immediately after optimization.
		$wpdb->update(
			$this->table_name,
			array(
				'optimized_id' => $optimized_id,
				'status'       => 'completed',
				'processed_at' => current_time( 'mysql' ),
			),
			array( 'attachment_id' => $original_id ),
			array( '%d', '%s', '%s' ),
			array( '%d' )
		);
	}

	/**
	 * Add an unoptimized attachment to the migration table.
	 *
	 * @param int $attachment_id The attachment ID.
	 * @return void
	 */
	private function add_to_migration_table( $attachment_id ) {
		global $wpdb;
		$this->ensure_table_exists();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- We need to check for existing records before inserting to avoid duplicates.
		$exists = $wpdb->get_var(
			$wpdb->prepare(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table name is status and properly escaped by $wpdb->prepare.
				"SELECT id FROM {$this->table_name} WHERE attachment_id = %d",
				$attachment_id
			)
		);

		if ( ! $exists ) {
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- We need to insert new records for unoptimized attachments during discovery.
			$wpdb->insert(
				$this->table_name,
				array(
					'attachment_id' => $attachment_id,
					'status'        => 'pending',
				),
				array( '%d', '%s' )
			);
		}
	}


	/**
	 * Get migration status summary.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return \WP_REST_Response Response with migration status.
	 */
	public function handle_get_migration_status( \WP_REST_Request $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- We need to update the migration status immediately after optimization.
		$this->ensure_table_exists();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$total_unoptimized = (int) $wpdb->get_var(
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table name is status and properly escaped by $wpdb->prepare.
			"SELECT COUNT(*) FROM {$this->table_name} WHERE status = 'pending'"
		);

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$total_completed = (int) $wpdb->get_var(
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table name is status and properly escaped by $wpdb->prepare.
			"SELECT COUNT(*) FROM {$this->table_name} WHERE status = 'completed'"
		);

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$total_failed = (int) $wpdb->get_var(
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table name is status and properly escaped by $wpdb->prepare.
			"SELECT COUNT(*) FROM {$this->table_name} WHERE status = 'failed'"
		);

		return new \WP_REST_Response(
			array(
				'pending'   => $total_unoptimized,
				'completed' => $total_completed,
				'failed'    => $total_failed,
				'total'     => $total_unoptimized + $total_completed + $total_failed,
			),
			200
		);
	}

	/**
	 * Mark a migration as failed.
	 *
	 * @param \WP_REST_Request $request The REST request containing an `attachment_id`.
	 * @return \WP_REST_Response Success or error response.
	 */
	public function handle_set_failure( \WP_REST_Request $request ) {
		$attachment_id = $request->get_param( 'attachment_id' );
		if ( ! $attachment_id ) {
			return new \WP_REST_Response( array( 'error' => 'Missing attachment_id' ), 400 );
		}
		$attachment_id = (int) $attachment_id;

		global $wpdb;
		$this->ensure_table_exists();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$exists = $wpdb->get_var(
			$wpdb->prepare(
   // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table name is status and properly escaped by $wpdb->prepare.
				"SELECT id FROM {$this->table_name} WHERE attachment_id = %d",
				$attachment_id
			)
		);
		if ( ! $exists ) {
			return new \WP_REST_Response( array( 'error' => 'Record not found' ), 404 );
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$updated = $wpdb->update(
			$this->table_name,
			array(
				'status'       => 'failed',
				'processed_at' => current_time( 'mysql' ),
			),
			array( 'attachment_id' => $attachment_id ),
			array( '%s', '%s' ),
			array( '%d' )
		);

		if ( false === $updated ) {
			return new \WP_REST_Response( array( 'error' => 'Database error' ), 500 );
		}

		return new \WP_REST_Response( array( 'success' => true ), 200 );
	}
}
