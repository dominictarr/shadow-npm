var http = require('http'), 
    url = require('url'), 
    fs = require('fs'), 
    join = require('path').join,
    request = require('request'),
    argv = require('optimist').argv,
    loadConfig = require('./config')

var shadowProxy = require('./proxy')

var port = argv.p || argv.port || 8686
  , shadow;

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

var server = http.createServer(shadowProxy({
  getShadow: function () {return shadow.host + shadow.path},
  getReal: function () {return real.host + real.path},  
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
