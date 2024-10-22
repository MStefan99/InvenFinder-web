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
				light: 'var(--color-light)',
				accent: 'var(--color-accent)',
				red: 'var(--color-red)',
				yellow: 'var(--color-yellow)',
				green: 'var(--color-green)',
				blue: 'var(--color-blue)',
				'red-bright': 'var(--color-red-bright)',
				'yellow-bright': 'var(--color-yellow-bright)',
				'green-bright': 'var(--color-green-bright)',
				'blue-bright': 'var(--color-blue-bright)'
			}
		}
	},
	plugins: []
};
