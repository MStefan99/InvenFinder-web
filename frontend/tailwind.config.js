'use strict';

module.exports = {
	content: ['./index.html', './src/**/*.vue'],
	darkMode: 'media', // 'media' or 'class'
	theme: {
		// Override the theme here
		extend: {
			// Extend the theme here
			colors: {
				foreground: 'var(--color-foreground)',
				background: 'var(--color-background)',
				muted: 'var(--color-muted)',
				accent: 'var(--color-accent)'
			}
		}
	},
	plugins: []
};
