import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig( {
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: [ './tests/setup.ts' ],
		watch: false,
		run: true,
		include: [
			'assets/src/**/*.test.{js,ts,jsx,tsx}',
			'assets/src/**/*.spec.{js,ts,jsx,tsx}',
			'tests/**/*.test.{js,ts,jsx,tsx}',
			'tests/**/*.spec.{js,ts,jsx,tsx}',
		],
		exclude: [ 'node_modules', 'vendor', 'dist', 'assets/build' ],
		coverage: {
			provider: 'v8',
			reporter: [ 'text', 'json', 'html' ],
			exclude: [
				'node_modules/',
				'vendor/',
				'assets/build/',
				'**/*.test.{js,ts,jsx,tsx}',
				'**/*.spec.{js,ts,jsx,tsx}',
				'tests/setup.js',
			],
		},
	},
	resolve: {
		alias: {
			'@wordpress/i18n': path.resolve( __dirname, './tests/mocks/wordpress-i18n.ts' ),
			'@wordpress/api-fetch': path.resolve( __dirname, './tests/mocks/wordpress-api-fetch.ts' ),
			'@': path.resolve( __dirname, './assets/src' ),
		},
	},
} );
