var http = require('http'), 
    url = require('url'), 
    fs = require('fs'), 
    join = require('path').join,
    request = require('request'),
    argv = require('optimist').argv

 var port = argv.p || argv.port || 8686,
    shadow;

function usage() {

  console.error([
    'USAGE:',
    '  start shadow-npm:',
    '     node shadow-npm.js -c config.json -p 8686 ',
    '',
    '  add npm user `user` to your private npm:',
    '    node shadow-npm.js -c config.json -u user -a admin:password',
    '',
    '  show this help message',
    '    node shadow-npm.js -h'
    ].join('\n')
    )
}

if(argv.h || argv.help) return usage()


var shadow = loadConfig()

var real = {
  host: 'registry.npmjs.org',
  path: ''
};

function proxy (req, res, opts, callback) {
  var _opts = {};
  _opts.host = opts.host;
  _opts.path = opts.path + req.url;
  _opts.headers = req.headers
  delete _opts.headers.host
  /*{
    authorization: req.headers.authorization
  , 'content-type': req.headers['content-type']
  }*/
  _opts.method = req.method;
  console.error(_opts)
  return http.request(_opts, callback);
}

var server = http.createServer(function (req, res) {
  console.error('INCOMMING', req.method, req.url);

  var _req = proxy (req, res, shadow, function (_res) {
    console.error('SHADOW', _res.statusCode)

    //if it was okay, or was an auth error, stop now.

    if(_res.statusCode < 300 || _res.statusCode == 401 || _res.statusCode == 409) {

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

})

//copy a user from the real npm
function adduser (username, auth, callback) {
  request('http://' + real.host + '/-/user/org.couchdb.user:' + username, function (error, res, body) {

    var user = JSON.parse(body)
    delete user._rev
    user.roles.push('team')
    console.error(user)
    console.error('AUTH', 
    auth)
    request.put({
      url: 'http://' + shadow.host + '/_users/org.couchdb.user:' + username,
      headers: {authorization: 'Basic ' + new Buffer(auth).toString('base64') },
      json: user
      }, function (err, res, body) {
        callback(err, body)
      })
  })
}


if (!argv.u || argv.user) {
  server.listen(port, function () {
    console.error('shadow-npm listening on port:' + port)
  })

  process.on('uncaughtException', function (err) {
    console.error(err && err.stack || err)
  })

} else {
  adduser(argv.u || argv.user, argv.a || auth, function (err, result) {
    if(err) throw err
    console.log(result)
  })
}
