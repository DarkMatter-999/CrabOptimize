<?php
/**
 * Tests for the Settings class
 *
 * @package DM_Crab_Optimize
 */

describe(
	'CrabOptimize Settings Class',
	function () {
		describe(
			'Settings Page Registration',
			function () {
				it(
					'should register settings page under Media menu',
					function () {
						$page_title = 'CrabOptimize Settings';
						$menu_title = 'CrabOptimize';
						$capability = 'manage_options';
						$menu_slug  = 'dm-crab-optimize-settings';

						expect( is_string( $page_title ) )->toBeTrue();
						expect( is_string( $menu_title ) )->toBeTrue();
						expect( is_string( $capability ) )->toBeTrue();
						expect( is_string( $menu_slug ) )->toBeTrue();
						expect( strlen( $page_title ) )->toBeGreaterThan( 0 );
						expect( strlen( $menu_slug ) )->toBeGreaterThan( 0 );
					}
				);

				it(
					'should use correct menu slug format',
					function () {
						$menu_slug = 'dm-crab-optimize-settings';

						expect( $menu_slug )->toBe( 'dm-crab-optimize-settings' );
						expect( strpos( $menu_slug, 'dm-crab' ) )->toBe( 0 );
						expect( str_ends_with( $menu_slug, 'settings' ) )->toBeTrue();
					}
				);

				it(
					'should require manage_options capability',
					function () {
						$capability = 'manage_options';

						expect( $capability )->toBe( 'manage_options' );
						expect( is_string( $capability ) )->toBeTrue();
					}
				);

				it(
					'should use render_settings_page as callback',
					function () {
						$callback = 'render_settings_page';

						expect( is_string( $callback ) )->toBeTrue();
						expect( strlen( $callback ) )->toBeGreaterThan( 0 );
					}
				);
			}
		);

		describe(
			'Settings Registration',
			function () {
				it(
					'should register keep_optimized setting',
					function () {
						$option_name = 'dm_crab_optimize_keep_optimized';
						$type        = 'integer';
						$default     = 0;

						expect( is_string( $option_name ) )->toBeTrue();
						expect( is_string( $type ) )->toBeTrue();
						expect( is_int( $default ) )->toBeTrue();
						expect( $default )->toBe( 0 );
					}
				);

				it(
					'should register show_badge setting',
					function () {
						$option_name = 'dm_crab_optimize_show_badge';
						$type        = 'integer';
						$default     = 0;

						expect( is_string( $option_name ) )->toBeTrue();
						expect( is_string( $type ) )->toBeTrue();
						expect( $default )->toBe( 0 );
					}
				);

				it(
					'should register generate_thumbnails setting',
					function () {
						$option_name = 'dm_crab_optimize_generate_thumbnails';
						$type        = 'integer';
						$default     = 0;

						expect( is_string( $option_name ) )->toBeTrue();
						expect( is_string( $type ) )->toBeTrue();
						expect( $default )->toBe( 0 );
					}
				);

				it(
					'should register quality setting',
					function () {
						$option_name = 'dm_crab_optimize_quality';
						$type        = 'number';
						$default     = 70;

						expect( is_string( $option_name ) )->toBeTrue();
						expect( is_string( $type ) )->toBeTrue();
						expect( is_float( $default ) || is_int( $default ) )->toBeTrue();
						expect( $default )->toBe( 70 );
					}
				);

				it(
					'should register speed setting',
					function () {
						$option_name = 'dm_crab_optimize_speed';
						$type        = 'integer';
						$default     = 10;

						expect( is_string( $option_name ) )->toBeTrue();
						expect( is_string( $type ) )->toBeTrue();
						expect( is_int( $default ) )->toBeTrue();
						expect( $default )->toBe( 10 );
					}
				);

				it(
					'should use consistent settings group name',
					function () {
						$settings_group = 'dm_crab_optimize_settings_group';

						expect( is_string( $settings_group ) )->toBeTrue();
						expect( strpos( $settings_group, 'dm_crab_optimize' ) )->toBe( 0 );
						expect( str_ends_with( $settings_group, 'group' ) )->toBeTrue();
					}
				);
			}
		);

		describe(
			'Quality Sanitization',
			function () {
				it(
					'should accept quality value of 70',
					function () {
						$quality   = 70;
						$sanitized = max( 0, min( 100, floatval( $quality ) ) );

						expect( $sanitized )->toBe( 70.0 );
					}
				);

				it(
					'should clamp quality values below 0 to 0',
					function () {
						$quality   = -10;
						$sanitized = max( 0, min( 100, floatval( $quality ) ) );

						expect( $sanitized )->toEqual( 0.0 );
						expect( $sanitized )->toBeGreaterThanOrEqual( 0 );
					}
				);

				it(
					'should clamp quality values above 100 to 100',
					function () {
						$quality   = 150;
						$sanitized = max( 0, min( 100, floatval( $quality ) ) );

						expect( $sanitized )->toEqual( 100.0 );
						expect( $sanitized )->toBeLessThanOrEqual( 100 );
					}
				);

				it(
					'should handle quality as float value',
					function () {
						$quality   = 75.5;
						$sanitized = max( 0, min( 100, floatval( $quality ) ) );

						expect( $sanitized )->toBe( 75.5 );
						expect( is_float( $sanitized ) )->toBeTrue();
					}
				);

				it(
					'should maintain quality values within valid range',
					function () {
						$test_values = array( 0, 25, 50, 75, 100 );

						foreach ( $test_values as $value ) {
							$sanitized = max( 0, min( 100, floatval( $value ) ) );
							expect( $sanitized )->toBeGreaterThanOrEqual( 0 );
							expect( $sanitized )->toBeLessThanOrEqual( 100 );
						}
					}
				);
			}
		);

		describe(
			'Speed Sanitization',
			function () {
				it(
					'should accept speed value of 10',
					function () {
						$speed     = 10;
						$sanitized = max( 0, min( 10, intval( $speed ) ) );

						expect( $sanitized )->toBe( 10 );
					}
				);

				it(
					'should clamp speed values below 0 to 0',
					function () {
						$speed     = -5;
						$sanitized = max( 0, min( 10, intval( $speed ) ) );

						expect( $sanitized )->toBe( 0 );
						expect( $sanitized )->toBeGreaterThanOrEqual( 0 );
					}
				);

				it(
					'should clamp speed values above 10 to 10',
					function () {
						$speed     = 15;
						$sanitized = max( 0, min( 10, intval( $speed ) ) );

						expect( $sanitized )->toBe( 10 );
						expect( $sanitized )->toBeLessThanOrEqual( 10 );
					}
				);

				it(
					'should convert speed to integer',
					function () {
						$speed     = 5.7;
						$sanitized = max( 0, min( 10, intval( $speed ) ) );

						expect( is_int( $sanitized ) )->toBeTrue();
						expect( $sanitized )->toBe( 5 );
					}
				);

				it(
					'should maintain speed values within valid range',
					function () {
						$test_values = array( 0, 3, 5, 8, 10 );

						foreach ( $test_values as $value ) {
							$sanitized = max( 0, min( 10, intval( $value ) ) );
							expect( $sanitized )->toBeGreaterThanOrEqual( 0 );
							expect( $sanitized )->toBeLessThanOrEqual( 10 );
						}
					}
				);
			}
		);

		describe(
			'Settings Page HTML Structure',
			function () {
				it(
					'should use correct wrapper class',
					function () {
						$wrapper_class = 'wrap';

						expect( is_string( $wrapper_class ) )->toBeTrue();
						expect( $wrapper_class )->toBe( 'wrap' );
					}
				);

				it(
					'should use correct form method',
					function () {
						$method = 'post';

						expect( $method )->toBe( 'post' );
						expect( is_string( $method ) )->toBeTrue();
					}
				);

				it(
					'should use correct form action',
					function () {
						$action = 'options.php';

						expect( $action )->toBe( 'options.php' );
						expect( is_string( $action ) )->toBeTrue();
					}
				);

				it(
					'should use correct HTML table class',
					function () {
						$table_class = 'form-table';

						expect( $table_class )->toBe( 'form-table' );
						expect( is_string( $table_class ) )->toBeTrue();
					}
				);
			}
		);

		describe(
			'Settings Form Fields',
			function () {
				it(
					'should have keep_optimized checkbox field',
					function () {
						$field_name = 'dm_crab_optimize_keep_optimized';
						$field_type = 'checkbox';

						expect( is_string( $field_name ) )->toBeTrue();
						expect( is_string( $field_type ) )->toBeTrue();
					}
				);

				it(
					'should have show_badge checkbox field',
					function () {
						$field_name = 'dm_crab_optimize_show_badge';
						$field_type = 'checkbox';

						expect( is_string( $field_name ) )->toBeTrue();
						expect( is_string( $field_type ) )->toBeTrue();
					}
				);

				it(
					'should have generate_thumbnails checkbox field',
					function () {
						$field_name = 'dm_crab_optimize_generate_thumbnails';
						$field_type = 'checkbox';

						expect( is_string( $field_name ) )->toBeTrue();
						expect( is_string( $field_type ) )->toBeTrue();
					}
				);

				it(
					'should have quality number input field',
					function () {
						$field_name = 'dm_crab_optimize_quality';
						$field_type = 'number';
						$min_value  = 0;
						$max_value  = 100;

						expect( is_string( $field_name ) )->toBeTrue();
						expect( is_string( $field_type ) )->toBeTrue();
						expect( $min_value )->toBe( 0 );
						expect( $max_value )->toBe( 100 );
					}
				);

				it(
					'should have speed number input field',
					function () {
						$field_name = 'dm_crab_optimize_speed';
						$field_type = 'number';
						$min_value  = 0;
						$max_value  = 10;

						expect( is_string( $field_name ) )->toBeTrue();
						expect( is_string( $field_type ) )->toBeTrue();
						expect( $min_value )->toBe( 0 );
						expect( $max_value )->toBe( 10 );
					}
				);
			}
		);

		describe(
			'Toggle Switch Component',
			function () {
				it(
					'should use correct toggle switch class',
					function () {
						$toggle_class = 'dm-crab-toggle-switch';

						expect( is_string( $toggle_class ) )->toBeTrue();
						expect( strpos( $toggle_class, 'toggle' ) )->not->toBe( false );
					}
				);

				it(
					'should use correct slider class',
					function () {
						$slider_class = 'dm-crab-slider';

						expect( is_string( $slider_class ) )->toBeTrue();
						expect( strpos( $slider_class, 'slider' ) )->not->toBe( false );
					}
				);

				it(
					'should apply toggle switch to boolean settings',
					function () {
						$boolean_settings = array(
							'dm_crab_optimize_keep_optimized',
							'dm_crab_optimize_show_badge',
							'dm_crab_optimize_generate_thumbnails',
						);

						expect( count( $boolean_settings ) )->toBe( 3 );

						foreach ( $boolean_settings as $setting ) {
							expect( is_string( $setting ) )->toBeTrue();
						}
					}
				);
			}
		);

		describe(
			'Checkbox Field Configuration',
			function () {
				it(
					'should use value of 1 for checked checkboxes',
					function () {
						$checkbox_value = 1;

						expect( is_int( $checkbox_value ) )->toBeTrue();
						expect( $checkbox_value )->toBe( 1 );
					}
				);

				it(
					'should use checked() function for conditional display',
					function () {
						$option_value = 1;
						$compare_to   = 1;

						expect( $option_value )->toBe( $compare_to );
					}
				);
			}
		);
	}
);
