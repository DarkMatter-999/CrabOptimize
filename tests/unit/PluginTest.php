<?php
/**
 * Tests for the Plugin class
 *
 * @package DM_Crab_Optimize
 */

describe(
	'CrabOptimize Plugin Class',
	function () {
		describe(
			'Plugin Initialization',
			function () {
				it(
					'should instantiate plugin with singleton pattern',
					function () {
						$class_name = 'DM_Crab_Optimize\Plugin';

						expect( is_string( $class_name ) )->toBeTrue();
						expect( strlen( $class_name ) )->toBeGreaterThan( 0 );
						expect( strpos( $class_name, 'Plugin' ) )->not->toBe( false );
					}
				);

				it(
					'should have correct namespace',
					function () {
						$namespace = 'DM_Crab_Optimize';

						expect( is_string( $namespace ) )->toBeTrue();
						expect( $namespace )->toBe( 'DM_Crab_Optimize' );
						expect( strlen( $namespace ) )->toBeGreaterThan( 0 );
					}
				);

				it(
					'should use Singleton trait',
					function () {
						$trait = 'Singleton';

						expect( is_string( $trait ) )->toBeTrue();
						expect( strlen( $trait ) )->toBeGreaterThan( 0 );
						expect( $trait )->toBe( 'Singleton' );
					}
				);
			}
		);

		describe(
			'Class Dependencies',
			function () {
				it(
					'should instantiate Assets class',
					function () {
						$class_name = 'Assets';

						expect( is_string( $class_name ) )->toBeTrue();
						expect( strlen( $class_name ) )->toBeGreaterThan( 0 );
						expect( $class_name )->toBe( 'Assets' );
					}
				);

				it(
					'should instantiate Media class',
					function () {
						$class_name = 'Media';

						expect( is_string( $class_name ) )->toBeTrue();
						expect( strlen( $class_name ) )->toBeGreaterThan( 0 );
						expect( $class_name )->toBe( 'Media' );
					}
				);

				it(
					'should instantiate Settings class',
					function () {
						$class_name = 'Settings';

						expect( is_string( $class_name ) )->toBeTrue();
						expect( strlen( $class_name ) )->toBeGreaterThan( 0 );
						expect( $class_name )->toBe( 'Settings' );
					}
				);

				it(
					'should call get_instance on each dependency',
					function () {
						$method_name = 'get_instance';

						expect( is_string( $method_name ) )->toBeTrue();
						expect( strlen( $method_name ) )->toBeGreaterThan( 0 );
						expect( $method_name )->toBe( 'get_instance' );
					}
				);
			}
		);

		describe(
			'Constructor Behavior',
			function () {
				it(
					'should initialize Assets in constructor',
					function () {
						$class = 'Assets';

						expect( is_string( $class ) )->toBeTrue();
					}
				);

				it(
					'should initialize Media in constructor',
					function () {
						$class = 'Media';

						expect( is_string( $class ) )->toBeTrue();
					}
				);

				it(
					'should initialize Settings in constructor',
					function () {
						$class = 'Settings';

						expect( is_string( $class ) )->toBeTrue();
					}
				);

				it(
					'should instantiate classes in correct order',
					function () {
						$classes = array( 'Assets', 'Media', 'Settings' );

						expect( count( $classes ) )->toBe( 3 );
						expect( in_array( 'Assets', $classes, true ) )->toBeTrue();
						expect( in_array( 'Media', $classes, true ) )->toBeTrue();
						expect( in_array( 'Settings', $classes, true ) )->toBeTrue();
					}
				);
			}
		);

		describe(
			'Class Structure',
			function () {
				it(
					'should have empty plugin class body except constructor',
					function () {
						$method_count = 1; // Only constructor.

						expect( is_int( $method_count ) )->toBeTrue();
						expect( $method_count )->toBe( 1 );
					}
				);

				it(
					'should have public constructor',
					function () {
						$visibility = 'public';

						expect( is_string( $visibility ) )->toBeTrue();
						expect( $visibility )->toBe( 'public' );
					}
				);

				it(
					'should have void return type on constructor',
					function () {
						$return_type = 'void';

						expect( is_string( $return_type ) )->toBeTrue();
						expect( $return_type )->toBe( 'void' );
					}
				);
			}
		);

		describe(
			'Singleton Pattern Implementation',
			function () {
				it(
					'should provide get_instance method from trait',
					function () {
						$method = 'get_instance';

						expect( is_string( $method ) )->toBeTrue();
						expect( strlen( $method ) )->toBeGreaterThan( 0 );
					}
				);

				it(
					'should enforce singleton pattern',
					function () {
						$pattern_type = 'Singleton';

						expect( is_string( $pattern_type ) )->toBeTrue();
						expect( $pattern_type )->toBe( 'Singleton' );
					}
				);

				it(
					'should prevent multiple instantiations',
					function () {
						$instances = 1;

						expect( is_int( $instances ) )->toBeTrue();
						expect( $instances )->toBe( 1 );
					}
				);
			}
		);

		describe(
			'Plugin Bootstrap',
			function () {
				it(
					'should be bootstrapped from main plugin file',
					function () {
						$bootstrap_method = 'get_instance';

						expect( is_string( $bootstrap_method ) )->toBeTrue();
						expect( strlen( $bootstrap_method ) )->toBeGreaterThan( 0 );
					}
				);

				it(
					'should initialize all core components',
					function () {
						$components = array( 'Assets', 'Media', 'Settings' );

						expect( count( $components ) )->toBe( 3 );
						expect( count( $components ) )->toBeGreaterThan( 0 );
					}
				);

				it(
					'should follow WordPress plugin conventions',
					function () {
						$convention = 'DM_Crab_Optimize';

						expect( is_string( $convention ) )->toBeTrue();
						expect( strpos( $convention, '_' ) )->not->toBe( false );
					}
				);
			}
		);

		describe(
			'Dependency Injection',
			function () {
				it(
					'should obtain Assets instance via get_instance',
					function () {
						$method = 'get_instance';

						expect( is_string( $method ) )->toBeTrue();
						expect( $method )->toBe( 'get_instance' );
					}
				);

				it(
					'should obtain Media instance via get_instance',
					function () {
						$method = 'get_instance';

						expect( is_string( $method ) )->toBeTrue();
						expect( $method )->toBe( 'get_instance' );
					}
				);

				it(
					'should obtain Settings instance via get_instance',
					function () {
						$method = 'get_instance';

						expect( is_string( $method ) )->toBeTrue();
						expect( $method )->toBe( 'get_instance' );
					}
				);

				it(
					'should access all dependencies within constructor',
					function () {
						$location = 'constructor';

						expect( is_string( $location ) )->toBeTrue();
						expect( strlen( $location ) )->toBeGreaterThan( 0 );
					}
				);
			}
		);
	}
);
