<?php
/**
 * Plugin Name:       CrabOptimize
 * Plugin URI:        https://github.com/DarkMatter-999/CrabOptimize
 * Description:       A next-generation image optimization plugin that uses WebAssembly and Rust to convert images to modern formats directly in your browsers, reducing server load and boosting site performance.
 * Version:           1.0.0
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Author:            DarkMatter-999
 * Author URI:        https://github.com/DarkMatter-999
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       craboptimize
 * Domain Path:       /languages
 *
 * @category Plugin
 * @package  DM_Crab_Optimize
 * @author   DarkMatter-999 <darkmatter999official@gmail.com>
 * @license  GPL v2 or later <https://www.gnu.org/licenses/gpl-2.0.html>
 * @link     https://github.com/DarkMatter-999/CrabOptimize
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit();
}

/**
 * Plugin base path and URL.
 */
define( 'DMCO_PLUGIN_PATH', plugin_dir_path( __FILE__ ) );
define( 'DMCO_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once DMCO_PLUGIN_PATH . 'include/helpers/autoloader.php';

use DM_Crab_Optimize\Plugin;

Plugin::get_instance();
