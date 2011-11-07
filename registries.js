
var ctrl = require('ctrlflow')
  , request = require('request')
  , jsonRest = require('./json-rest')
  , u = require('ubelt')
  , spawn = require('child_process').spawn
  , path = require('path')
  
//
// NEXT: tests for publishing!
//
  
module.exports = function (config) {
  var exports = {}
  var sudo = jsonRest({
    url: config.couch,
    auth: config.admin
  })
  var REST = jsonRest({
    url: config.couch
  })
  var npm = jsonRest({
    url: config.registry,
  })
  exports.create = function (dbname, callback) {
    //create a new registryName
    //copy user  
    //sudo(config.
    sudo({path: '/' + dbname, method: 'PUT'},callback)
  }
  exports.copyUser = function (username, callback) {
    var userPath = '/_users/org.couchdb.user:'+username
    sudo({path:userPath}, function (err, user) {
      if(err && (err.error == 'not_found')) {
        console.error('NOT_FOUND!')
        ctrl([
          [npm, {path: userPath}],
          function (user, next) {
          console.error(user, 'NEXT:', next)
            delete user._rev
            sudo({path: userPath, method: 'PUT', json: user}, next)
          }
        ])(callback)
      } else {
        callback(err, user)
      }
    })
  }

  function authUser(dbname, username, type, auth, callback) {
    var secPath = '/' + dbname + '/_security'
    
    if(!callback)
      callback = auth, auth = null
    REST({path: secPath , auth: auth}, function (err, users) {
      users = u.deepMerge(users, {admins: {names: [], roles: []}, readers: {names: [], roles: []}})      

      if(!~users[type].names.indexOf(username))
        users[type].names.push(username) 
      //hack to ensure that there is at least one reader
      if(!users.readers.names.length)
        users.readers.names.push('gatekeeper_' + Math.random()) 

      REST({path: secPath, method: 'PUT', json: users, auth: auth}, callback)
    })
  }

  exports.addReader = function (dbname, username, auth, callback) {
    authUser(dbname, username, 'readers', auth, callback)
  }
  //rmUser
  //rmAdmin
  exports.addAdmin = function (dbname, username, auth, callback) {
    authUser(dbname, username, 'admins', auth, callback)
  }
  exports.destroy = function (dbname, callback) {
    sudo({method: 'DELETE', path: '/'+dbname}, callback)
  }
  exports.couchapp_push = function (dbname, callback) {
    var dir = path.join(__dirname, 'npmjs.org')
      , env = u.merge(process.env, {'PWD': dir})
    var url = config.couch.replace('://','://'+config.admin+'@') + '/' + dbname
    console.error('couchapp', ['push', 'registry/app.js', url], {cwd: dir, env: env})
    var child = spawn('couchapp', ['push', 'registry/app.js', url], {
        cwd: dir
      , env: env
      })

    child.on('exit', callback)
    child.stdout.pipe(process.stdout, {end: false})
    child.stderr.pipe(process.stderr, {end: false})
  }
  exports.setup = function (dbname, newAdmin, callback) {  
    
    ctrl([
      [exports.create, dbname],
      [exports.copyUser, newAdmin],
      [exports.addAdmin, dbname, newAdmin, config.admin],
      [exports.couchapp_push, dbname]
      //couchapp push
    ])(callback)
  }
  return exports
}