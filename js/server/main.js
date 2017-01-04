/*eslint-env node*/

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const proxy = require('http-proxy-middleware');

const webpack = require('webpack');
const webpackMiddleware = require('webpack-dev-middleware');
const WEBPACK_CONFIG = require('../webpack.config');

const argv = require('minimist')(process.argv.slice(2));

const PORT = argv.port || 8000;
const HOST = argv.host || 'localhost';
const API_HOST = argv.apihost || 'localhost';
const API_PORT = argv.apiport || process.env.BC_GOV_SCHOOLBUS_API_PORT || 8080;

const PROJECT_ROOT = path.join(__dirname, '..');
const DIST_PATH = path.join(PROJECT_ROOT, 'dist');

const app = express();

app.use(morgan('dev'));

// TODO: Remove - just for testing
var count = 0;
app.get('/api/test', function(req, res) {
  res.status(200);
  count++;
  var newCount = count;
  setTimeout(function() {
    res.send(JSON.stringify({ count: newCount })).end();
  }, Math.random() * 10 * 1000);
});


app.use('/api', proxy({
  target: `https://${API_HOST}:${API_PORT}/schoolbus-tbd/api`,
  changeOrigin: true,
}));

// Override WebPack config to work with this express server
WEBPACK_CONFIG.output.path = '/';
WEBPACK_CONFIG.output.publicPath = '/js/';

const compiler = webpack(WEBPACK_CONFIG);
const middleware = webpackMiddleware(compiler, {
  publicPath: WEBPACK_CONFIG.output.publicPath,
  contentBase: 'src',
  stats: {
    colors: true,
    hash: false,
    timings: true,
    chunks: false,
    chunkModules: false,
    modules: false,
  },
});
app.use(require('webpack-hot-middleware')(compiler));

app.use(middleware);

app.use(express.static(DIST_PATH));

app.use('/test', express.static(PROJECT_ROOT + '/test'));
app.use('/node_modules', express.static(PROJECT_ROOT + '/node_modules'));

app.listen(PORT, function () {
  console.log('\uD83C\uDF0E   Dev web server initialized http://' + HOST + ':' + PORT);
});
