
var http = require('http')
  , es = require('event-stream')

function proxy (req, res, opts, callback) {
  var _opts = {};
  _opts.host = opts.host;
  _opts.path = opts.path + req.url;
  _opts.headers = req.headers
  delete _opts.headers.host
  _opts.method = req.method;
  console.error(_opts)
  var _req = http.request(_opts)
  _req.on('response', callback);
  return _req
}

module.exports = function (lookup, config) {
  if(!lookup.getReal)
    lookup.getReal = function () {
      return { host: 'registry.npmjs.org', path: '' }
    }


  var server = http.createServer(function (req, res) {
    console.error('INCOMMING', req.method, req.url)
    var shadow = lookup.getShadow(req)
      , shadowHost = shadow.host + shadow.path
      , here = lookup.getHere()
      , hereHost = here.host + here.path
    var _req = proxy (req, res, shadow, function (_res) {
      console.error('SHADOW', _res.statusCode, _res.headers)

      //if it was okay, or was an auth error, stop now.

      if(_res.statusCode != 404) {
        res.writeHeader(_res.statusCode, _res.headers)
        if(req.headers.accept == 'application/json') {
          var replace = es.replace(shadowHost, hereHost)
          _res.pipe(replace)
          replace.pipe(res)
          _res.pipe(process.stderr, {end: false})
        } else {
        _res.pipe(res)
        //_res.pipe(process.stderr, {end: false}) 
        }
      } else {

        var _req2 = proxy (req, res, lookup.getReal(req), function (_res2) {

          console.error('NPM', _res2.statusCode)
          res.writeHeader(_res2.statusCode, _res2.headers)
          _res2.pipe(res)
        })
        _req2.end() //we are only falling back to the real npm for GET requests
      }
    })
    req.pipe(_req)
    req.on('error', console.error)
  })
  return server
}