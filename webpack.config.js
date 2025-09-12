const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );
const path = require( 'path' );
const fs = require( 'fs' );

function generateEntries() {
	const entries = {};

	// Add JS files
	const jsDir = path.resolve( __dirname, 'assets/src/js' );
	if ( fs.existsSync( jsDir ) ) {
		fs.readdirSync( jsDir ).forEach( ( file ) => {
			if ( file.endsWith( '.js' ) ) {
				const name = `js/${ file.replace( /\.js$/, '' ) }`;
				entries[ name ] = path.join( jsDir, file );
			}
		} );
	}

	// Add SCSS files
	const cssDir = path.resolve( __dirname, 'assets/src/css' );
	if ( fs.existsSync( cssDir ) ) {
		fs.readdirSync( cssDir ).forEach( ( file ) => {
			if ( file.endsWith( '.scss' ) ) {
				const name = `css/${ file.replace( /\.scss$/, '' ) }`;
				entries[ name ] = path.join( cssDir, file );
			}
		} );
	}

	// Add block files
	const blocksDir = path.resolve( __dirname, 'assets/src/blocks' );
	if ( fs.existsSync( blocksDir ) ) {
		fs.readdirSync( blocksDir ).forEach( ( blockName ) => {
			const blockPath = path.join( blocksDir, blockName );
			if ( fs.statSync( blockPath ).isDirectory() ) {
				const jsFile = path.join( blockPath, 'index.js' );
				const scssFile = path.join( blockPath, 'index.scss' );

				if ( fs.existsSync( jsFile ) ) {
					entries[ `blocks/${ blockName }/index` ] = jsFile;
				}

				if ( fs.existsSync( scssFile ) ) {
					entries[ `blocks/${ blockName }/style` ] = scssFile;
				}
			}
		} );
	}

	return entries;
}

module.exports = {
	...defaultConfig,
	entry: {
		...defaultConfig.entry(),
		...generateEntries(),
	},
	output: {
		path: path.resolve( __dirname, 'assets/build' ),
		filename: '[name].js',
	},
	plugins: [
		...defaultConfig.plugins,
		new RemoveEmptyScriptsPlugin( {
			stage: RemoveEmptyScriptsPlugin.STAGE_AFTER_PROCESS_PLUGINS,
		} ),
	],
};
