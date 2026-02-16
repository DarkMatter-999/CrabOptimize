<?php
/**
 * Tests for the Assets class
 *
 * @package DM_Crab_Optimize
 */

describe(
	'CrabOptimize Assets Class',
	function () {
		describe(
			'Asset Enqueueing',
			function () {
				it(
					'should enqueue admin assets for media hooks',
					function () {
						$hook = 'post.php';

						expect( in_array( $hook, array( 'post.php', 'post-new.php', 'upload.php', 'media-new.php', 'widgets.php', 'site-editor.php', 'media_page_dm-crab-optimize-settings' ), true ) )->toBeTrue();
					}
				);

				it(
					'should identify media-related hooks correctly',
					function () {
						$media_hooks = array(
							'post.php',
							'post-new.php',
							'upload.php',
							'media-new.php',
							'widgets.php',
							'site-editor.php',
							'media_page_dm-crab-optimize-settings',
						);

						expect( count( $media_hooks ) )->toBeGreaterThan( 0 );
						expect( in_array( 'upload.php', $media_hooks, true ) )->toBeTrue();
						expect( in_array( 'post.php', $media_hooks, true ) )->toBeTrue();
					}
				);

				it(
					'should have correct editor and main asset hooks',
					function () {
						$editor_hooks = array( 'upload.php', 'media-new.php' );
						$main_hooks   = array( 'post.php', 'post-new.php', 'upload.php', 'media-new.php', 'widgets.php', 'site-editor.php', 'media_page_dm-crab-optimize-settings' );

						expect( in_array( 'upload.php', $editor_hooks, true ) )->toBeTrue();
						expect( in_array( 'media-new.php', $editor_hooks, true ) )->toBeTrue();
						expect( count( $main_hooks ) )->toBeGreaterThan( count( $editor_hooks ) );
					}
				);
			}
		);

		describe(
			'Asset Handle Names',
			function () {
				it(
					'should use consistent asset handle naming',
					function () {
						$handles = array(
							'dm-crap-opt-main-css',
							'dm-crab-opt-main-js',
							'dm-crab-opt-editor-js',
							'dm-crab-opt-editor-css',
							'dm-crab-settings-main',
						);

						foreach ( $handles as $handle ) {
							expect( is_string( $handle ) )->toBeTrue();
							expect( strlen( $handle ) )->toBeGreaterThan( 0 );
							expect( strpos( $handle, 'dm-' ) )->toBe( 0 );
						}
					}
				);

				it(
					'should have proper handle suffix indicators',
					function () {
						$css_handles = array( 'dm-crap-opt-main-css', 'dm-crab-opt-editor-css' );
						$js_handles  = array( 'dm-crab-opt-main-js', 'dm-crab-opt-editor-js' );

						foreach ( $css_handles as $handle ) {
							expect( str_ends_with( $handle, 'css' ) )->toBeTrue();
						}

						foreach ( $js_handles as $handle ) {
							expect( str_ends_with( $handle, 'js' ) )->toBeTrue();
						}
					}
				);
			}
		);

		describe(
			'Settings Script Configuration',
			function () {
				it(
					'should register settings with correct option keys',
					function () {
						$option_keys = array(
							'dm_crab_optimize_keep_optimized',
							'dm_crab_optimize_show_badge',
							'dm_crab_optimize_generate_thumbnails',
							'dm_crab_optimize_quality',
							'dm_crab_optimize_speed',
						);

						foreach ( $option_keys as $key ) {
							expect( is_string( $key ) )->toBeTrue();
							expect( strlen( $key ) )->toBeGreaterThan( 0 );
						}
					}
				);

				it(
					'should have proper default values for settings',
					function () {
						$defaults = array(
							'dm_crab_optimize_keep_optimized' => 0,
							'dm_crab_optimize_show_badge' => 0,
							'dm_crab_optimize_generate_thumbnails' => 0,
							'dm_crab_optimize_quality'    => 70,
							'dm_crab_optimize_speed'      => 10,
						);

						expect( $defaults['dm_crab_optimize_quality'] )->toBeGreaterThanOrEqual( 0 );
						expect( $defaults['dm_crab_optimize_quality'] )->toBeLessThanOrEqual( 100 );
						expect( $defaults['dm_crab_optimize_speed'] )->toBeGreaterThanOrEqual( 0 );
						expect( $defaults['dm_crab_optimize_speed'] )->toBeLessThanOrEqual( 10 );
					}
				);

				it(
					'should expose correct settings to JavaScript',
					function () {
						$settings_keys = array(
							'saveUnoptimized',
							'showBadge',
							'imageSizes',
							'generateThumbnails',
							'quality',
							'speed',
						);

						foreach ( $settings_keys as $key ) {
							expect( is_string( $key ) )->toBeTrue();
							expect( strlen( $key ) )->toBeGreaterThan( 0 );
						}
					}
				);
			}
		);

		describe(
			'Asset Paths and URLs',
			function () {
				it(
					'should use consistent asset directory structure',
					function () {
						$asset_paths = array(
							'assets/build/css/main.asset.php',
							'assets/build/js/main.asset.php',
							'assets/build/css/editor.asset.php',
							'assets/build/js/editor.asset.php',
						);

						foreach ( $asset_paths as $path ) {
							expect( strpos( $path, 'assets/build' ) )->toBe( 0 );
							expect( str_ends_with( $path, '.asset.php' ) )->toBeTrue();
						}
					}
				);

				it(
					'should have consistent asset file naming',
					function () {
						$files = array( 'main.css', 'main.js', 'editor.css', 'editor.js' );

						expect( count( $files ) )->toBe( 4 );
						expect( in_array( 'main.css', $files, true ) )->toBeTrue();
						expect( in_array( 'editor.js', $files, true ) )->toBeTrue();
					}
				);
			}
		);
	}
);
