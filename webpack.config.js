'use strict';

const path = require('path');

const {VueLoaderPlugin} = require('vue-loader');


module.exports = {
	mode: 'development',
	entry: {
		index: './src/index.ts'
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].js'
	},
	module: {
		rules: [
			{test: /.vue$/, use: 'vue-loader'},
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.pug$/,
				oneOf: [
					{resourceQuery: /^\?vue/, use: ['pug-plain-loader']},
					{use: ['raw-loader', 'pug-plain-loader']}
				]
			},
			{test: /.css$/, use: ['style-loader', 'css-loader']},
			{test: /.styl(us)?$/, use: ['style-loader', 'css-loader', 'stylus-loader']}
		]
	},
	plugins: [
		new VueLoaderPlugin()
	],
	devServer: {
		static: './dist',
		allowedHosts: ['localhost', 'iv.localhost'],
		port: 3000,
		compress: true,
		hot: true
	},
	stats: 'minimal',
	devtool: 'source-map'
};
