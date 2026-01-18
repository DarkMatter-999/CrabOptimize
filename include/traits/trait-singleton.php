<?php
/**
 * Singleton Trait
 *
 * This file provides the definition of the Singleton trait for use elsewhere.
 *
 * @package DM_Crab_Optimize
 **/

namespace DM_Crab_Optimize\Traits;

trait Singleton {


	/**
	 * Instance of the singleton class.
	 *
	 * @var self
	 */
	private static $instance = null;

	/**
	 * Get the singleton instance
	 *
	 * @return self
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * __construct
	 *
	 * @return void
	 */
	private function __construct() {
	}
	/**
	 * __clone
	 *
	 * @return void
	 */
	public function __clone() {
	}
	/**
	 * __wakeup
	 *
	 * @return void
	 */
	public function __wakeup() {
	}
}
