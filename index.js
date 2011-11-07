
var ctrl = require('ctrlflow')
  , jsonRest = require('./json-rest')
  , u = require('ubelt')
  , commands = require('optimist').argv._
  ;


var config = require('./config')()
  , registries = require('./registries')(config)
  , proxy = require('./proxy')

if(commands[0] == 'create' && commands.length == 3) {
  registries.setup(commands[1], commands[2], console.error)
}

if(commands[0] == 'start' && commands.length == 2) {
  var db = commands[1]
    , port = config.port

/*  config._couch = config.couch 
  config.couch = 'http://localhost:86468'
  var net = require('net')
  net.createServer(function (socket) {
    console.error('connection!')
    var _socket = net.createConnection(80, config._couch.replace(/https?\:\/\//,''))
    socket.pipe(_socket)
    _socket.pipe(socket)
  }).listen(86468)*/

  proxy({
    getShadow   : function () { return {host: config.couch.replace(/^https?\:\/\//, ''), path: '/' + db + config.rewrite_path} } 
  , getHere   : function () { return {host: 'localhost:' + config.port, path: '' } }
  }).listen(port, function () {
    console.error('shadow-npm ('+config.couch + '/' + db + ') listening on port:' + port)
    console.error('set: NPM_CONFIG_REGISTRY=http://localhost:' + port)
  })

}


/*
//CLEAN TEST DBS
ctrl([
  [sudo,{path:'/_all_dbs'}],
  function (dbs,next) {
    next(null, u.filter(dbs, /^test_\d+$/))
  },
  ctrl.parallel.map(function (db, next) {
    sudo({method: 'DELETE', path: '/' + db}, next)
  })
])(console.error)
*/