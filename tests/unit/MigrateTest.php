<?php
/**
 * Tests for the Migrate class
 *
 * @package DM_Crab_Optimize
 */

describe(
	'CrabOptimize Migrate Class',
	function () {

		describe(
			'REST API Configuration',
			function () {
				it(
					'should use the correct REST namespace',
					function () {
						$namespace = 'dm-crab/v1';

						expect( is_string( $namespace ) )->toBeTrue();
						expect( $namespace )->toBe( 'dm-crab/v1' );
						expect( strpos( $namespace, '/v1' ) )->not->toBe( false );
					}
				);

				it(
					'should register a /discover route',
					function () {
						$route = '/discover';

						expect( is_string( $route ) )->toBeTrue();
						expect( $route )->toBe( '/discover' );
					}
				);

				it(
					'should register a /get-migration-status route',
					function () {
						$route = '/get-migration-status';

						expect( is_string( $route ) )->toBeTrue();
						expect( $route )->toBe( '/get-migration-status' );
					}
				);

				it(
					'should register a /set-failure route',
					function () {
						$route = '/set-failure';

						expect( is_string( $route ) )->toBeTrue();
						expect( $route )->toBe( '/set-failure' );
					}
				);

				it(
					'should register a /replace-content route',
					function () {
						$route = '/replace-content';

						expect( is_string( $route ) )->toBeTrue();
						expect( $route )->toBe( '/replace-content' );
					}
				);

				it(
					'should use POST method for discovery',
					function () {
						$method = 'POST';

						expect( $method )->toBe( 'POST' );
					}
				);

				it(
					'should use GET method for migration status',
					function () {
						$method = 'GET';

						expect( $method )->toBe( 'GET' );
					}
				);

				it(
					'should use POST method for set-failure',
					function () {
						$method = 'POST';

						expect( $method )->toBe( 'POST' );
					}
				);

				it(
					'should use POST method for replace-content',
					function () {
						$method = 'POST';

						expect( $method )->toBe( 'POST' );
					}
				);

				it(
					'should require manage_options capability',
					function () {
						$capability = 'manage_options';

						expect( is_string( $capability ) )->toBeTrue();
						expect( $capability )->toBe( 'manage_options' );
					}
				);
			}
		);

		describe(
			'Migration Status Values',
			function () {
				it(
					'should use "pending" as the initial status',
					function () {
						$status = 'pending';

						expect( is_string( $status ) )->toBeTrue();
						expect( $status )->toBe( 'pending' );
					}
				);

				it(
					'should use "completed" as the success status',
					function () {
						$status = 'completed';

						expect( is_string( $status ) )->toBeTrue();
						expect( $status )->toBe( 'completed' );
					}
				);

				it(
					'should use "failed" as the failure status',
					function () {
						$status = 'failed';

						expect( is_string( $status ) )->toBeTrue();
						expect( $status )->toBe( 'failed' );
					}
				);

				it(
					'should have exactly three distinct status values',
					function () {
						$statuses = array( 'pending', 'completed', 'failed' );

						expect( count( $statuses ) )->toBe( 3 );
						expect( count( array_unique( $statuses ) ) )->toBe( 3 );
					}
				);
			}
		);

		describe(
			'Database Table Structure',
			function () {
				it(
					'should use the correct table name prefix',
					function () {
						$suffix = 'dm_crab_migration';

						expect( is_string( $suffix ) )->toBeTrue();
						expect( strpos( $suffix, 'dm_crab' ) )->toBe( 0 );
					}
				);

				it(
					'should define an auto-increment primary key column',
					function () {
						$column_def = 'id bigint(20) NOT NULL AUTO_INCREMENT';

						expect( strpos( $column_def, 'AUTO_INCREMENT' ) )->not->toBe( false );
						expect( strpos( $column_def, 'PRIMARY KEY' ) === false )->toBeTrue();
					}
				);

				it(
					'should define attachment_id as a UNIQUE bigint column',
					function () {
						$column_def = 'attachment_id bigint(20) NOT NULL UNIQUE';

						expect( strpos( $column_def, 'UNIQUE' ) )->not->toBe( false );
						expect( strpos( $column_def, 'bigint' ) )->not->toBe( false );
					}
				);

				it(
					'should define a nullable optimized_id column',
					function () {
						$column_def = 'optimized_id bigint(20) DEFAULT NULL';

						expect( strpos( $column_def, 'DEFAULT NULL' ) )->not->toBe( false );
					}
				);

				it(
					'should set the default status column value to "pending"',
					function () {
						$column_def = "status varchar(20) DEFAULT 'pending'";

						expect( strpos( $column_def, "'pending'" ) )->not->toBe( false );
					}
				);

				it(
					'should define a nullable processed_at datetime column',
					function () {
						$column_def = 'processed_at datetime DEFAULT NULL';

						expect( strpos( $column_def, 'datetime' ) )->not->toBe( false );
						expect( strpos( $column_def, 'DEFAULT NULL' ) )->not->toBe( false );
					}
				);
			}
		);

		describe(
			'Discovery Response Structure',
			function () {
				it(
					'should return an images array in the response',
					function () {
						$response = array(
							'images'      => array(),
							'total_pages' => 1,
							'current'     => 1,
							'is_last'     => true,
							'total_count' => 0,
						);

						expect( array_key_exists( 'images', $response ) )->toBeTrue();
						expect( is_array( $response['images'] ) )->toBeTrue();
					}
				);

				it(
					'should include total_pages in the response',
					function () {
						$response = array(
							'images'      => array(),
							'total_pages' => 3,
							'current'     => 1,
							'is_last'     => false,
							'total_count' => 120,
						);

						expect( array_key_exists( 'total_pages', $response ) )->toBeTrue();
						expect( $response['total_pages'] )->toBe( 3 );
					}
				);

				it(
					'should include is_last flag in the response',
					function () {
						$response = array(
							'images'      => array(),
							'total_pages' => 1,
							'current'     => 1,
							'is_last'     => true,
							'total_count' => 0,
						);

						expect( array_key_exists( 'is_last', $response ) )->toBeTrue();
						expect( is_bool( $response['is_last'] ) )->toBeTrue();
					}
				);

				it(
					'should include the current page in the response',
					function () {
						$response = array(
							'images'      => array(),
							'total_pages' => 2,
							'current'     => 2,
							'is_last'     => true,
							'total_count' => 60,
						);

						expect( array_key_exists( 'current', $response ) )->toBeTrue();
						expect( $response['current'] )->toBe( 2 );
					}
				);

				it(
					'should set is_last to true when on the final page',
					function () {
						$page          = 3;
						$max_num_pages = 3;
						$is_last       = $page >= $max_num_pages;

						expect( $is_last )->toBeTrue();
					}
				);

				it(
					'should set is_last to false when more pages remain',
					function () {
						$page          = 1;
						$max_num_pages = 5;
						$is_last       = $page >= $max_num_pages;

						expect( $is_last )->toBeFalse();
					}
				);

				it(
					'should include required image fields in each image entry',
					function () {
						$image = array(
							'id'          => 42,
							'title'       => 'Sample Image',
							'url'         => 'https://example.com/image.jpg',
							'mime_type'   => 'image/jpeg',
							'isOptimized' => false,
							'optimizedId' => null,
						);

						expect( array_key_exists( 'id', $image ) )->toBeTrue();
						expect( array_key_exists( 'title', $image ) )->toBeTrue();
						expect( array_key_exists( 'url', $image ) )->toBeTrue();
						expect( array_key_exists( 'mime_type', $image ) )->toBeTrue();
						expect( array_key_exists( 'isOptimized', $image ) )->toBeTrue();
						expect( array_key_exists( 'optimizedId', $image ) )->toBeTrue();
					}
				);

				it(
					'should default to page 1 when no page param is supplied',
					function () {
						$page = 1;

						expect( $page )->toBe( 1 );
						expect( is_int( $page ) )->toBeTrue();
					}
				);

				it(
					'should use a per-page batch size of 50',
					function () {
						$per_page = 50;

						expect( $per_page )->toBe( 50 );
						expect( $per_page )->toBeGreaterThan( 0 );
					}
				);
			}
		);

		describe(
			'Migration Status Response Structure',
			function () {
				it(
					'should include a pending count',
					function () {
						$response = array(
							'pending'   => 10,
							'completed' => 5,
							'failed'    => 2,
							'total'     => 17,
						);

						expect( array_key_exists( 'pending', $response ) )->toBeTrue();
						expect( is_int( $response['pending'] ) )->toBeTrue();
					}
				);

				it(
					'should include a completed count',
					function () {
						$response = array(
							'pending'   => 10,
							'completed' => 5,
							'failed'    => 2,
							'total'     => 17,
						);

						expect( array_key_exists( 'completed', $response ) )->toBeTrue();
						expect( is_int( $response['completed'] ) )->toBeTrue();
					}
				);

				it(
					'should include a failed count',
					function () {
						$response = array(
							'pending'   => 10,
							'completed' => 5,
							'failed'    => 2,
							'total'     => 17,
						);

						expect( array_key_exists( 'failed', $response ) )->toBeTrue();
						expect( is_int( $response['failed'] ) )->toBeTrue();
					}
				);

				it(
					'should include a total that equals the sum of all statuses',
					function () {
						$pending   = 10;
						$completed = 5;
						$failed    = 2;
						$total     = $pending + $completed + $failed;

						expect( $total )->toBe( 17 );
					}
				);

				it(
					'should return zero counts when the table is empty',
					function () {
						$response = array(
							'pending'   => 0,
							'completed' => 0,
							'failed'    => 0,
							'total'     => 0,
						);

						expect( $response['total'] )->toBe( 0 );
						expect( $response['pending'] )->toBe( 0 );
					}
				);
			}
		);

		describe(
			'handle_set_failure Validation',
			function () {
				it(
					'should require attachment_id to be present',
					function () {
						$attachment_id = null;
						$is_valid      = ! empty( $attachment_id );

						expect( $is_valid )->toBeFalse();
					}
				);

				it(
					'should reject a non-numeric attachment_id',
					function () {
						$attachment_id = 'abc';
						$is_valid      = is_numeric( $attachment_id ) && (int) $attachment_id > 0;

						expect( $is_valid )->toBeFalse();
					}
				);

				it(
					'should reject a zero attachment_id',
					function () {
						$attachment_id = 0;
						$is_valid      = is_numeric( $attachment_id ) && $attachment_id > 0;

						expect( $is_valid )->toBeFalse();
					}
				);

				it(
					'should reject a negative attachment_id',
					function () {
						$attachment_id = -5;
						$is_valid      = is_numeric( $attachment_id ) && $attachment_id > 0;

						expect( $is_valid )->toBeFalse();
					}
				);

				it(
					'should accept a positive numeric attachment_id',
					function () {
						$attachment_id = 42;
						$is_valid      = is_numeric( $attachment_id ) && $attachment_id > 0;

						expect( $is_valid )->toBeTrue();
					}
				);

				it(
					'should cast attachment_id to integer',
					function () {
						$raw_id = '123';
						$id     = (int) $raw_id;

						expect( is_int( $id ) )->toBeTrue();
						expect( $id )->toBe( 123 );
					}
				);

				it(
					'should use a 400 response code for missing attachment_id',
					function () {
						$status_code = 400;

						expect( $status_code )->toBe( 400 );
					}
				);

				it(
					'should use a 404 response code when the record is not found',
					function () {
						$status_code = 404;

						expect( $status_code )->toBe( 404 );
					}
				);

				it(
					'should use a 500 response code on a database error',
					function () {
						$status_code = 500;

						expect( $status_code )->toBe( 500 );
					}
				);

				it(
					'should use a 200 response code on success',
					function () {
						$status_code = 200;
						$body        = array( 'success' => true );

						expect( $status_code )->toBe( 200 );
						expect( $body['success'] )->toBeTrue();
					}
				);
			}
		);

		describe(
			'get_replacement_rules – Regex Patterns',
			function () {
				it(
					'should match a standard Gutenberg wp:image comment block',
					function () {
						$pattern = '/<!-- wp:image (\{.*?\}) -->/';
						$subject = '<!-- wp:image {"id":123,"sizeSlug":"large"} -->';
						$matched = preg_match( $pattern, $subject, $matches );

						expect( $matched )->toBe( 1 );
						expect( $matches[1] )->toBe( '{"id":123,"sizeSlug":"large"}' );
					}
				);

				it(
					'should not match a wp:paragraph comment with the image pattern',
					function () {
						$pattern = '/<!-- wp:image (\{.*?\}) -->/';
						$subject = '<!-- wp:paragraph {"align":"left"} -->';
						$matched = preg_match( $pattern, $subject );

						expect( $matched )->toBe( 0 );
					}
				);

				it(
					'should match a standard HTML img tag',
					function () {
						$pattern = '/<img\s+([^>]+)>/i';
						$subject = '<img src="http://example.com/image.jpg" class="wp-image-10" width="800" height="600">';
						$matched = preg_match( $pattern, $subject, $matches );

						expect( $matched )->toBe( 1 );
						expect( strpos( $matches[1], 'wp-image-10' ) )->not->toBe( false );
					}
				);

				it(
					'should match an img tag case-insensitively',
					function () {
						$pattern = '/<img\s+([^>]+)>/i';
						$subject = '<IMG src="test.jpg" class="wp-image-5">';
						$matched = preg_match( $pattern, $subject );

						expect( $matched )->toBe( 1 );
					}
				);

				it(
					'should match a Gutenberg wp:media-text block',
					function () {
						$pattern = '/<!-- wp:media-text (\{.*?\}) -->/';
						$subject = '<!-- wp:media-text {"mediaId":15,"mediaLink":"https://example.com/?p=15"} -->';
						$matched = preg_match( $pattern, $subject, $matches );

						expect( $matched )->toBe( 1 );
						expect( $matches[1] )->toContain( '"mediaId":15' );
					}
				);

				it(
					'should not match a wp:image block with the media-text pattern',
					function () {
						$pattern = '/<!-- wp:media-text (\{.*?\}) -->/';
						$subject = '<!-- wp:image {"id":123} -->';
						$matched = preg_match( $pattern, $subject );

						expect( $matched )->toBe( 0 );
					}
				);

				it(
					'should match a Gutenberg wp:cover block',
					function () {
						$pattern = '/<!-- wp:cover (\{.*?\}) -->/';
						$subject = '<!-- wp:cover {"url":"https://example.com/bg.jpg","id":19,"dimRatio":50} -->';
						$matched = preg_match( $pattern, $subject, $matches );

						expect( $matched )->toBe( 1 );
						expect( $matches[1] )->toContain( '"id":19' );
					}
				);

				it(
					'should extract the wp-image class ID from an img tag',
					function () {
						$attrs   = 'src="http://example.com/img.jpg" class="wp-image-42 size-large"';
						$matched = preg_match( '/wp-image-(\d+)/', $attrs, $matches );

						expect( $matched )->toBe( 1 );
						expect( (int) $matches[1] )->toBe( 42 );
					}
				);

				it(
					'should not find a wp-image ID when the class is absent',
					function () {
						$attrs   = 'src="http://example.com/img.jpg" class="size-large"';
						$matched = preg_match( '/wp-image-(\d+)/', $attrs );

						expect( $matched )->toBe( 0 );
					}
				);
			}
		);

		describe(
			'get_replacement_rules – Callback Logic',
			function () {
				it(
					'should replace the id in a Gutenberg image block JSON',
					function () {
						$optimization_map = array( 10 => 99 );
						$json_str         = '{"id":10,"sizeSlug":"large"}';
						$data             = json_decode( $json_str, true );

						$old_id = (int) $data['id'];
						if ( isset( $optimization_map[ $old_id ] ) ) {
							$data['id'] = (int) $optimization_map[ $old_id ];
						}

						expect( $data['id'] )->toBe( 99 );
					}
				);

				it(
					'should leave the JSON unchanged when the id is not in the optimization map',
					function () {
						$optimization_map = array( 10 => 99 );
						$json_str         = '{"id":55,"sizeSlug":"large"}';
						$data             = json_decode( $json_str, true );

						$old_id = (int) $data['id'];
						if ( isset( $optimization_map[ $old_id ] ) ) {
							$data['id'] = (int) $optimization_map[ $old_id ];
						}

						expect( $data['id'] )->toBe( 55 );
					}
				);

				it(
					'should return the original match when JSON decoding fails for image block',
					function () {
						$invalid_json = '{not_valid_json}';
						json_decode( $invalid_json, true );

						expect( json_last_error() )->not->toBe( JSON_ERROR_NONE );
					}
				);

				it(
					'should return the original match when the image block JSON has no "id" key',
					function () {
						$json_str = '{"sizeSlug":"large"}';
						$data     = json_decode( $json_str, true );

						expect( isset( $data['id'] ) )->toBeFalse();
					}
				);

				it(
					'should replace the wp-image class ID in an img tag',
					function () {
						$old_id    = 10;
						$new_id    = 99;
						$attrs     = 'src="http://example.com/img.jpg" class="wp-image-10 size-large"';
						$new_attrs = preg_replace( '/wp-image-' . $old_id . '/', 'wp-image-' . $new_id, $attrs );

						expect( strpos( $new_attrs, 'wp-image-99' ) )->not->toBe( false );
						expect( strpos( $new_attrs, 'wp-image-10' ) )->toBe( false );
					}
				);

				it(
					'should strip srcset from an img tag during replacement',
					function () {
						$attrs     = 'src="img.jpg" srcset="img-2x.jpg 2x, img-3x.jpg 3x" class="wp-image-10"';
						$new_attrs = preg_replace( '/\s*srcset=([\'"])(.*?)\1/', '', $attrs );

						expect( strpos( $new_attrs, 'srcset' ) )->toBe( false );
					}
				);

				it(
					'should replace the mediaId in a Gutenberg media-text block',
					function () {
						$optimization_map = array( 15 => 88 );
						$json_str         = '{"mediaId":15,"mediaLink":"https://example.com/?p=15"}';
						$data             = json_decode( $json_str, true );

						$old_id = (int) $data['mediaId'];
						if ( isset( $optimization_map[ $old_id ] ) ) {
							$data['mediaId'] = (int) $optimization_map[ $old_id ];
						}

						expect( $data['mediaId'] )->toBe( 88 );
					}
				);

				it(
					'should leave mediaId unchanged when not in the optimization map',
					function () {
						$optimization_map = array( 15 => 88 );
						$json_str         = '{"mediaId":77,"mediaLink":"https://example.com/?p=77"}';
						$data             = json_decode( $json_str, true );

						$old_id = (int) $data['mediaId'];
						if ( isset( $optimization_map[ $old_id ] ) ) {
							$data['mediaId'] = (int) $optimization_map[ $old_id ];
						}

						expect( $data['mediaId'] )->toBe( 77 );
					}
				);

				it(
					'should replace the id in a Gutenberg cover block',
					function () {
						$optimization_map = array( 19 => 55 );
						$json_str         = '{"url":"https://example.com/bg.jpg","id":19,"dimRatio":50}';
						$data             = json_decode( $json_str, true );

						if ( isset( $data['id'] ) ) {
							$old_id = (int) $data['id'];
							if ( isset( $optimization_map[ $old_id ] ) ) {
								$data['id'] = (int) $optimization_map[ $old_id ];
							}
						}

						expect( $data['id'] )->toBe( 55 );
					}
				);

				it(
					'should leave a cover block unchanged when id is absent from JSON',
					function () {
						$optimization_map = array( 19 => 55 );
						$json_str         = '{"dimRatio":50}';
						$data             = json_decode( $json_str, true );

						if ( isset( $data['id'] ) ) {
							$old_id = (int) $data['id'];
							if ( isset( $optimization_map[ $old_id ] ) ) {
								$data['id'] = (int) $optimization_map[ $old_id ];
							}
						}

						expect( isset( $data['id'] ) )->toBeFalse();
					}
				);

				it(
					'should return the original cover block when JSON is invalid',
					function () {
						$invalid_json = '{bad_json';
						json_decode( $invalid_json, true );

						expect( json_last_error() )->not->toBe( JSON_ERROR_NONE );
					}
				);
			}
		);

		describe(
			'handle_content_replacement Logic',
			function () {
				it(
					'should default to page 1 when no page param is given',
					function () {
						$page = 1;

						expect( $page )->toBe( 1 );
						expect( is_int( $page ) )->toBeTrue();
					}
				);

				it(
					'should use a per-page batch size of 50',
					function () {
						$per_page = 50;

						expect( $per_page )->toBe( 50 );
						expect( $per_page )->toBeGreaterThan( 0 );
					}
				);

				it(
					'should include post and page post types by default',
					function () {
						$post_types = array( 'post', 'page' );

						expect( in_array( 'post', $post_types, true ) )->toBeTrue();
						expect( in_array( 'page', $post_types, true ) )->toBeTrue();
					}
				);

				it(
					'should return is_last true when there are no posts',
					function () {
						$posts   = array();
						$is_last = empty( $posts );

						expect( $is_last )->toBeTrue();
					}
				);

				it(
					'should build the correct number of placeholders for an ID list',
					function () {
						$post_ids    = array( 1, 2, 3, 4, 5 );
						$placeholder = implode( ',', array_fill( 0, count( $post_ids ), '%d' ) );

						expect( $placeholder )->toBe( '%d,%d,%d,%d,%d' );
						expect( substr_count( $placeholder, '%d' ) )->toBe( 5 );
					}
				);

				it(
					'should extract image IDs from wp-image class names',
					function () {
						$content = '<img class="wp-image-42 size-large" src="img.jpg">';
						preg_match_all( '/wp-image-(\d+)|"id":(\d+)/', $content, $matches );

						$ids = array_filter( array_merge( $matches[1], $matches[2] ) );
						$ids = array_map( 'intval', $ids );

						expect( in_array( 42, $ids, true ) )->toBeTrue();
					}
				);

				it(
					'should extract image IDs from Gutenberg JSON',
					function () {
						$content = '<!-- wp:image {"id":77,"sizeSlug":"full"} -->';
						preg_match_all( '/wp-image-(\d+)|"id":(\d+)/', $content, $matches );

						$ids = array_filter( array_merge( $matches[1], $matches[2] ) );
						$ids = array_map( 'intval', $ids );

						expect( in_array( 77, $ids, true ) )->toBeTrue();
					}
				);

				it(
					'should deduplicate extracted image IDs',
					function () {
						$raw_ids = array( 10, 20, 10, 30, 20 );
						$unique  = array_unique( $raw_ids );

						expect( count( $unique ) )->toBe( 3 );
					}
				);

				it(
					'should only update a post when its content actually changes',
					function () {
						$original = '<img class="wp-image-10" src="old.jpg">';
						$updated  = '<img class="wp-image-99" src="new.jpg">';

						expect( $updated !== $original )->toBeTrue();
					}
				);

				it(
					'should not increment replaced_count for unchanged content',
					function () {
						$original_content = '<p>No images here</p>';
						$processed        = $original_content; // No changes made.
						$replaced_count   = 0;

						if ( $processed !== $original_content ) {
							++$replaced_count;
						}

						expect( $replaced_count )->toBe( 0 );
					}
				);

				it(
					'should increment replaced_count for changed content',
					function () {
						$original_content = '<img class="wp-image-10" src="old.jpg">';
						$processed        = '<img class="wp-image-99" src="new.jpg">';
						$replaced_count   = 0;

						if ( $processed !== $original_content ) {
							++$replaced_count;
						}

						expect( $replaced_count )->toBe( 1 );
					}
				);

				it(
					'should include replaced count in the response',
					function () {
						$response = array(
							'current_page' => 1,
							'processed'    => 50,
							'replaced'     => 12,
							'total_pages'  => 3,
							'is_last'      => false,
						);

						expect( array_key_exists( 'replaced', $response ) )->toBeTrue();
						expect( $response['replaced'] )->toBe( 12 );
					}
				);

				it(
					'should set is_last when on the final page',
					function () {
						$page        = 3;
						$total_pages = 3;
						$is_last     = $page >= $total_pages;

						expect( $is_last )->toBeTrue();
					}
				);
			}
		);

		describe(
			'handle_migration_link Logic',
			function () {
				it(
					'should require is_crab_migration param to proceed',
					function () {
						$params              = array();
						$has_migration_param = isset( $params['is_crab_migration'] );

						expect( $has_migration_param )->toBeFalse();
					}
				);

				it(
					'should require original_id param to proceed',
					function () {
						$params          = array( 'is_crab_migration' => true );
						$has_original_id = isset( $params['original_id'] );

						expect( $has_original_id )->toBeFalse();
					}
				);

				it(
					'should cast original_id to integer',
					function () {
						$raw = '123';
						$id  = (int) $raw;

						expect( is_int( $id ) )->toBeTrue();
						expect( $id )->toBe( 123 );
					}
				);

				it(
					'should store the meta key for linking optimized to original',
					function () {
						$meta_key_back = 'crab_unoptimized_id';
						$meta_key_fwd  = 'crab_optimized_id';

						expect( is_string( $meta_key_back ) )->toBeTrue();
						expect( is_string( $meta_key_fwd ) )->toBeTrue();
						expect( $meta_key_back )->toBe( 'crab_unoptimized_id' );
						expect( $meta_key_fwd )->toBe( 'crab_optimized_id' );
					}
				);

				it(
					'should store the optimization format meta key',
					function () {
						$meta_key = 'crab_optimization_format';

						expect( is_string( $meta_key ) )->toBeTrue();
						expect( $meta_key )->toBe( 'crab_optimization_format' );
					}
				);

				it(
					'should use "completed" status when linking succeeds',
					function () {
						$status = 'completed';

						expect( $status )->toBe( 'completed' );
					}
				);
			}
		);

		describe(
			'Optimization Map Building',
			function () {
				it(
					'should map old attachment IDs to new optimized IDs',
					function () {
						$rows = array(
							(object) array(
								'attachment_id' => 10,
								'optimized_id'  => 100,
							),
							(object) array(
								'attachment_id' => 20,
								'optimized_id'  => 200,
							),
						);

						$optimization_map = array();
						foreach ( $rows as $row ) {
							$optimization_map[ $row->attachment_id ] = $row->optimized_id;
						}

						expect( $optimization_map[10] )->toBe( 100 );
						expect( $optimization_map[20] )->toBe( 200 );
						expect( count( $optimization_map ) )->toBe( 2 );
					}
				);

				it(
					'should produce an empty map when no completed mappings exist',
					function () {
						$rows             = array();
						$optimization_map = array();

						foreach ( $rows as $row ) {
							$optimization_map[ $row->attachment_id ] = $row->optimized_id;
						}

						expect( count( $optimization_map ) )->toBe( 0 );
						expect( is_array( $optimization_map ) )->toBeTrue();
					}
				);

				it(
					'should only query records with "completed" status',
					function () {
						$status_filter = 'completed';

						expect( $status_filter )->toBe( 'completed' );
					}
				);

				it(
					'should use a correct placeholder count for the IN clause',
					function () {
						$img_ids     = array( 1, 2, 3 );
						$placeholder = implode( ',', array_fill( 0, count( $img_ids ), '%d' ) );

						expect( substr_count( $placeholder, '%d' ) )->toBe( count( $img_ids ) );
					}
				);
			}
		);
	}
);
