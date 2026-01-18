<?php
/**
 * Autoloader
 *
 * This file provides the autoloader for the Plugin.
 *
 * @package DM_Crab_Optimize
 **/

namespace DM_Crab_Optimize\Helpers;

spl_autoload_register(
	function ( $what ) {
		$split = explode( '\\', $what );
		if ( 'DM_Crab_Optimize' !== $split[0] ) {
			return;
		}
		$base_dir = 'include/';

		if ( isset( $split[1] ) && 'Traits' === $split[1] ) {
			$base_dir .= 'traits/trait-';
			$split[1]  = '';
		} elseif ( isset( $split[1] ) && 'API' === $split[1] ) {
			$base_dir .= 'classes/api/class-';
			$split[1]  = '';
		} else {
			$base_dir .= 'classes/class-';
		}

		$split[ count( $split ) - 1 ] = str_replace(
			'_',
			'-',
			strtolower( $split[ count( $split ) - 1 ] ) . '.php'
		);

		$split[0] = $base_dir;

		$file_path = implode( '', $split );

		if ( file_exists( DMCO_PLUGIN_PATH . $file_path ) ) {
			include_once DMCO_PLUGIN_PATH . $file_path;
		}
	}
);
