var webpack = require('webpack');

module.exports = {
	entry: {
		imageSelector: __dirname + '/src/imageSelector.js',
	},
	output: {
		filename: '[name].js',
		libraryTarget: 'umd',
		library: 'imageSelector',
		umdNamedDefine: true
	},
	plugins: [
		new webpack.optimize.UglifyJsPlugin()
	],
	devtool: '#sourcemap',
};
