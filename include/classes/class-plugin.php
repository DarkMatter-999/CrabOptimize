<?php
/**
 * Main Plugin File for Plugin.
 *
 * @package DM_Crab_Optimize
 */

namespace DM_Crab_Optimize;

use DM_Crab_Optimize\Traits\Singleton;

/**
 * Main Plugin File for the Plugin.
 */
class Plugin {


	use Singleton;

	/**
	 * Constructor for the Plugin.
	 *
	 * @return void
	 */
	public function __construct() {
		Assets::get_instance();
		Media::get_instance();
		Settings::get_instance();
	}
}
