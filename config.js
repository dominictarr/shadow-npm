var fs = require('fs')
  , argv = require('optimist').argv
  , join = require('path').join
  , cc = require('config-chain')
  , render = require('render')
module.exports = function (env) {
  env = env || argv.env || 'development'
  var config = cc(
    {env: env},
    argv,
    argv.config, //allow passing in a config file
    cc.find('shadow-npm_' + env + '.json'),
    cc.find('shadow-npm.json'),
    join(__dirname, 'config.json'),
    {
      port: env == 'production' ? 80 : 8686 
    , rewrite_path: "/_design/app/_rewrite"
    }
  ).store
  
  render.log.cf(config)
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