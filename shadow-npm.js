var http = require('http'), 
    url = require('url'), 
    fs = require('fs'), 
    join = require('path').join,
    argv = require('optimist').argv

var file = argv.c || argv.config || join(__dirname, 'config.json'),
    port = argv.p || argv.port || 8686,
    shadow;
try {
  shadow = JSON.parse(fs.readFileSync(file))
} catch (err) {
  console.error('USAGE: node shadow-npm.js -c config.json -p 8686')
  throw err
}

var real = {
  host: 'registry.npmjs.org',
  path: ''
};

function proxy (req, res, opts, callback) {
  var _opts = {};
  _opts.host = opts.host;
  _opts.path = opts.path + req.url;
  _opts.method = req.method;

  return http.request(_opts, callback);
}

http.createServer(function (req, res) {
  console.error('INCOMMING', req.method, req.url);

  var _req = proxy (req, res, shadow, function (_res) {
    console.error('SHADOW', _res.statusCode)

    if(_res.statusCode < 300) {

      res.writeHeader(_res.statusCode, _res.headers)
      _res.pipe(res)

    } else {

      var _req2 = proxy (req, res, real, function (_res2) {

        console.error('NPM', _res2.statusCode)
        res.writeHeader(_res2.statusCode, _res2.headers)
        _res2.pipe(res)
      })
      _req2.end() //we are only falling back to the real npm for GET requests
    }
  })
  req.pipe(_req)

}).listen(port, function () {
  console.error('shadow-npm listening on port:' + port)
})

process.on('uncaughtException', function (err) {
  console.error(err && err.stack || err)
})
