var fs = require('fs')
  , argv = require('optimist').argv
  , join = require('path').join
  , cc = require('config-chain')

module.exports = function (env) {
  env = env || argv.env || 'development'
  var config = cc(
    {env: env},
    argv,
    argv.config, //allow passing in a config file
    cc.find('config_shadow-npm/' + env + '.json'),
    cc.find('config_shadow-npm/config.json'),
    {
      port: env == 'production' ? 80 : 8686 
    , httpsPort: 443
    , rewrite_path: "/_design/app/_rewrite"
    , registry: "http://registry.npmjs.org"
    , domain: 'shadow-npm.net'
    , couch: 'http://localhost:5984'
    , localdb: 'registry' //used when running shadow-npm locally. see local.js
    }
  ).store
  
  return config
}

/*
module.exports = function loadConfig () {
  var file = argv.c || argv.config || join(__dirname, 'config.json');

  try {
    return JSON.parse(fs.readFileSync(file))
  } catch (err) {
    throw err
  }
}
*/