var http = require('http')

var config = require('shadow-npm/config')()
  , shadowProxy = require('shadow-npm/proxy')


var shadowRegistry = 'http://localhost:' + config.port
  , shadowObj = {
      host: config.couch.replace(/^https?\:\/\//, '')
    , path: '/' + config.localdb + config.rewrite_path
    }

var handler = shadowProxy({
  getShadow: function () { //in real use, we'll decide where to proxy to based on the url or subdomain.
    return shadowObj
  },
  getReal: function () {
    return {host: config.registry, path: ''}
  },
  getHere: function () {
    return {host: 'localhost:' + config.port, path: ''}
  }
})

http.createServer(handler).listen(config.port, function () {
  console.error('shadow-npm listening on ' + config.port)
})