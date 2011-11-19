
var ctrl = require('ctrlflow')
  , request = require('request')
  , jsonRest = require('json-rest')
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
    sudo({path: '/' + dbname, method: 'PUT'}, callback)
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
  //
  // request a doc from one database, and then push it to another database.
  //
  exports.copy = function (from, to, callback) {
    sudo(from, function (err, obj) {
      if(err) return callback(err)
      delete obj._rev
      to.method = 'PUT'
      to.json = obj
      console.error(to)
      sudo(to, callback)
    })
  }

  exports.copyUsers = function (usernames, callback) {
    if('string' == typeof usernames)
      usernames = [usernames]
    ctrl.parallel.map(exports.copyUser)(usernames, callback)
  }

  function authUsers(dbname, added, auth, callback) {
    var secPath = '/' + dbname + '/_security'
    REST({path: secPath , auth: auth}, function (err, users) {
      var users = u.deepMerge(users, {admins: {names: [], roles: []}, readers: {names: [], roles: []}})      

      if(added.admins)
        users.admins.names = u.union(users.admins.names, added.admins)
      if(added.readers)
        users.readers.names = u.union(users.readers.names, added.readers)

      if(!users.readers.names.length)
        users.readers.names.push('gatekeeper_' + Math.random()) 

      REST({path: secPath, method: 'PUT', json: users, auth: auth}, callback)

    })      
  }

  exports.initRegistry = function (db, callback) {
    exports.copy({path: '/prototype/_design/app'}, {path: '/'+db+'/_design/app'}, callback)
  }

/*  function authUser(dbname, username, type, auth, callback) {
    var secPath = '/' + dbname + '/_security'
    
    if(!callback)
      callback = auth, auth = null
    
    REST({path: secPath , auth: auth}, function (err, users) {
      var users = u.deepMerge(users, {admins: {names: [], roles: []}, readers: {names: [], roles: []}})      

      if(!~users[type].names.indexOf(username))
        users[type].names.push(username)
      //hack to ensure that there is at least one reader
      if(!users.readers.names.length)
        users.readers.names.push('gatekeeper_' + Math.random()) 

      REST({path: secPath, method: 'PUT', json: users, auth: auth}, callback)
    })

  }
*/
  exports.addReader = function (dbname, username, auth, callback) {
    authUsers(dbname, {readers: [username] }, auth, callback)
  }
  exports.addAdmin = function (dbname, username, auth, callback) {
    authUsers(dbname, {admins: [username] }, auth, callback)
  }
  exports.destroy = function (dbname, callback) {
    sudo({method: 'DELETE', path: '/'+dbname}, callback)
  }
  
  //it's just one doc, so copy this with a http request instead.
  exports.couchapp_push = function (dbname, callback) {
    var dir = path.join(__dirname, 'npmjs.org')
      , env = u.merge(process.env, {'PWD': dir})
    var url = config.couch.replace('://','://'+config.admin+'@') + '/' + dbname
    console.error('couchapp', ['push', 'registry/app.js', url], {cwd: dir, env: env})
    var child = spawn('couchapp', ['push', 'registry/app.js', url], {
        cwd: dir
      , env: env
      })

    child.on('exit', function (code) {
      console.error('EXIT!!!', code)
      if(code) callback({error: 'create_registry_fail', message: 'create npm registry failed'})
      else callback()
    })
    child.stdout.pipe(process.stdout, {end: false})
    child.stderr.pipe(process.stderr, {end: false})
  }

  exports.setup = function (dbname, users, callback) {
    if(!users.admins.length)
      return callback({error:'missing_admin', message: 'a new registry must have at least 1 admin'})
   
    console.error(callback) 
    var addusers = u.union(users.admins, users.readers)
    
    ctrl([
      [exports.create, dbname]
    , {
        users: [
          [exports.copyUsers, addusers]
        , [authUsers, dbname, users, config.admin]
        ],
        app: [
          [exports.initRegistry, dbname]
        ]
      }
    ])(callback)
  }
  
  return exports
}