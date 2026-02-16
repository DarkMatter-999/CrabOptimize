module.exports = {
	'**/*.php': [ 'npm run lint:php' ],
	'**/*.{js,jsx,ts,tsx}': [ 'npm run lint:js' ],
	'**/*.{css,scss}': [ 'npm run lint:css' ],
};
