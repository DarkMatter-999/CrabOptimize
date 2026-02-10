import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig( {
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: [ './tests/setup.js' ],
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
			'@': path.resolve( __dirname, './assets/src' ),
		},
	},
} );
