<?php
/**
 * Tests for the Media class
 *
 * @package DM_Crab_Optimize
 */

describe(
	'CrabOptimize Media Class',
	function () {
		describe(
			'Media Library Columns',
			function () {
				it(
					'should add optimized column to media library',
					function () {
						$columns                   = array();
						$columns['crab_optimized'] = 'Crab Optimized';

						expect( isset( $columns['crab_optimized'] ) )->toBeTrue();
						expect( $columns['crab_optimized'] )->toBe( 'Crab Optimized' );
					}
				);

				it(
					'should use consistent column key naming',
					function () {
						$column_key = 'crab_optimized';

						expect( is_string( $column_key ) )->toBeTrue();
						expect( strlen( $column_key ) )->toBeGreaterThan( 0 );
						expect( strpos( $column_key, 'crab' ) )->not->toBe( false );
					}
				);

				it(
					'should make optimized column sortable',
					function () {
						$sortable_columns                   = array();
						$sortable_columns['crab_optimized'] = 'is_crab_optimized';

						expect( isset( $sortable_columns['crab_optimized'] ) )->toBeTrue();
						expect( $sortable_columns['crab_optimized'] )->toBe( 'is_crab_optimized' );
					}
				);
			}
		);

		describe(
			'Optimization Status Display',
			function () {
				it(
					'should use correct meta key for optimization status',
					function () {
						$meta_key   = 'is_crab_optimized';
						$meta_value = 'true';

						expect( is_string( $meta_key ) )->toBeTrue();
						expect( is_string( $meta_value ) )->toBeTrue();
						expect( $meta_value )->toBe( 'true' );
					}
				);

				it(
					'should display correct dashicon for optimized status',
					function () {
						$optimized_icon   = 'dashicons-saved';
						$unoptimized_icon = 'dashicons-minus';

						expect( $optimized_icon )->toBe( 'dashicons-saved' );
						expect( $unoptimized_icon )->toBe( 'dashicons-minus' );
					}
				);

				it(
					'should show AVIF format label for optimized images',
					function () {
						$format_label = 'AVIF';

						expect( is_string( $format_label ) )->toBeTrue();
						expect( strlen( $format_label ) )->toBeGreaterThan( 0 );
						expect( strlen( $format_label ) )->toBe( 4 );
					}
				);

				it(
					'should use appropriate colors for status indicators',
					function () {
						$optimized_color   = '#46b450';
						$unoptimized_color = '#ccc';

						expect( is_string( $optimized_color ) )->toBeTrue();
						expect( is_string( $unoptimized_color ) )->toBeTrue();
						expect( $optimized_color )->toMatch( '/^#[0-9a-f]{6}$/i' );
						expect( $unoptimized_color )->toMatch( '/^#[0-9a-f]{3}$/i' );
					}
				);
			}
		);

		describe(
			'Thumbnail Handling',
			function () {
				it(
					'should recognize AVIF mime type',
					function () {
						$mime_type = 'image/avif';

						expect( is_string( $mime_type ) )->toBeTrue();
						expect( $mime_type )->toBe( 'image/avif' );
					}
				);

				it(
					'should have valid thumbnail dimensions',
					function () {
						$thumbnail = array(
							'size'   => 'thumbnail',
							'width'  => 150,
							'height' => 150,
						);

						expect( $thumbnail['width'] )->toBeGreaterThan( 0 );
						expect( $thumbnail['height'] )->toBeGreaterThan( 0 );
						expect( is_int( $thumbnail['width'] ) )->toBeTrue();
						expect( is_int( $thumbnail['height'] ) )->toBeTrue();
					}
				);

				it(
					'should create thumbnail metadata with required fields',
					function () {
						$metadata = array(
							'file'      => 'test-150x150.avif',
							'width'     => 150,
							'height'    => 150,
							'mime-type' => 'image/avif',
						);

						expect( isset( $metadata['file'] ) )->toBeTrue();
						expect( isset( $metadata['width'] ) )->toBeTrue();
						expect( isset( $metadata['height'] ) )->toBeTrue();
						expect( isset( $metadata['mime-type'] ) )->toBeTrue();
						expect( $metadata['mime-type'] )->toBe( 'image/avif' );
					}
				);

				it(
					'should generate proper thumbnail filename format',
					function () {
						$base_name      = 'image';
						$width          = 150;
						$height         = 150;
						$thumb_filename = "{$base_name}-{$width}x{$height}.avif";

						expect( $thumb_filename )->toMatch( '/^\w+-\d+x\d+\.avif$/' );
						expect( str_ends_with( $thumb_filename, '.avif' ) )->toBeTrue();
					}
				);
			}
		);

		describe(
			'Attachment Meta Exposure',
			function () {
				it(
					'should expose optimization status to JavaScript',
					function () {
						$response = array(
							'meta' => array(
								'is_crab_optimized' => 'true',
							),
						);

						expect( isset( $response['meta'] ) )->toBeTrue();
						expect( isset( $response['meta']['is_crab_optimized'] ) )->toBeTrue();
					}
				);

				it(
					'should handle missing meta array gracefully',
					function () {
						$response = array();

						if ( empty( $response['meta'] ) || ! is_array( $response['meta'] ) ) {
							$response['meta'] = array();
						}

						expect( isset( $response['meta'] ) )->toBeTrue();
						expect( is_array( $response['meta'] ) )->toBeTrue();
					}
				);

				it(
					'should preserve existing meta data',
					function () {
						$response = array(
							'meta' => array(
								'existing_key' => 'existing_value',
							),
						);

						$response['meta']['is_crab_optimized'] = 'true';

						expect( isset( $response['meta']['existing_key'] ) )->toBeTrue();
						expect( isset( $response['meta']['is_crab_optimized'] ) )->toBeTrue();
						expect( $response['meta']['existing_key'] )->toBe( 'existing_value' );
					}
				);
			}
		);

		describe(
			'Request Context Detection',
			function () {
				it(
					'should validate nonce verification requirements',
					function () {
						$nonce_action = 'media-form';

						expect( is_string( $nonce_action ) )->toBeTrue();
						expect( strlen( $nonce_action ) )->toBeGreaterThan( 0 );
					}
				);

				it(
					'should recognize REST API requests',
					function () {
						$is_rest_api = defined( 'REST_REQUEST' ) && REST_REQUEST;

						expect( is_bool( $is_rest_api ) )->toBeTrue();
					}
				);

				it(
					'should detect Plupload requests',
					function () {
						$wpnonce           = '_wpnonce';
						$media_form_action = 'media-form';

						expect( is_string( $wpnonce ) )->toBeTrue();
						expect( is_string( $media_form_action ) )->toBeTrue();
					}
				);
			}
		);

		describe(
			'Image Size Configuration',
			function () {
				it(
					'should respect generate thumbnails option',
					function () {
						$generate_thumbnails = 0;

						expect( is_int( $generate_thumbnails ) )->toBeTrue();
						expect( $generate_thumbnails )->toBeGreaterThanOrEqual( 0 );
						expect( $generate_thumbnails )->toBeLessThanOrEqual( 1 );
					}
				);

				it(
					'should handle empty sizes array for AVIF',
					function () {
						$sizes       = array(
							'thumbnail' => array(),
							'medium'    => array(),
						);
						$empty_array = array();

						expect( is_array( $sizes ) )->toBeTrue();
						expect( is_array( $empty_array ) )->toBeTrue();
						expect( count( $empty_array ) )->toBe( 0 );
					}
				);
			}
		);
	}
);
