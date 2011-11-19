

module.exports = function (config) {


  var x = new RegExp('^([\\w_-]+)\\.' + config.domain.replace('.', '\\.'))
  return {
    getShadow: function (req) { //in real use, we'll decide where to proxy to based on the url or subdomain.
      //var thisHost = config.domain //+ (config.port == 80 ? '' : ':'+config.port)
      var m = x.exec(req.headers.host)
      if(!m)
        return null
      var subdomain = m[1]
      return {
        host: config.couch.replace(/^https?\:\/\//, '')
      , path: '/' + subdomain + config.rewrite_path
      }
    },
    getHere: function (req) {
      return {
        host: (req.headers.host)
      , path: ''
      }
    }
  }
}