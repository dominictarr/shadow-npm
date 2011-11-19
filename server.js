var connect = require('connect')
  , config = require('./config')()
  , registries = require('./registries')(config)
  , shadowProxy = require('./proxy')
  , fs = require('fs')
  , ghm = require('github-flavored-markdown')
  , http = require('http')
  , https = require('https')
  ;

function split (list) {
  if(!list) return []
  return list.split(',')
}

var html
function readme () {
  if(config.env == 'development' || !html)
    html = [
      '<html>',
      '<head><title>shadow-npm</title>',
      '<style>',
      fs.readFileSync(__dirname+'/style.css', 'utf-8'),
      '</style></head><body>',
      '<a href="http://github.com/dominictarr/shadow-npm"><img style="position: absolute; top: 0; right: 0; border: 0;" src="https://a248.e.akamai.net/assets.github.com/img/71eeaab9d563c2b3c590319b398dd35683265e85/687474703a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f677261795f3664366436642e706e67" alt="Fork me on GitHub"></a>',
      '<div id=content>',
      ghm.parse(fs.readFileSync(__dirname+'/readme.markdown', 'utf-8')),
      '</div></body></html>'
    ].join('')

  return html
}


var handler = 
  connect(
    shadowProxy(require('./subdomains')(config)),
    connect.query(),
    connect.logger(),
    connect.router(function (app) {
      app.all('/', function (req, res) {
        res.writeHeader(200, {'content-type': 'text/html'})
        res.end(readme())
      })
      app.put('/:db', function (req, res) {
        var users = {
            admins: split(req.query.admins),
            readers: split(req.query.readers)
          }
        var db = req.params.db
        console.error(req.params, req.query)
        registries.setup(db, users, function (err, data) {
          //what can the error be?
          //
          //  400s
          //  - a user did not exist
          //  - database name already taken
          //  500s
          //  - couchdb error
          //  - auth error.
          //  - couchapp could fail.
          //
          console.error('RESPONDING')
          if(err) {
            res.writeHeader(400)
            console.error(err && err.stack || err)
            res.end(err && (err.message || err.reason) || 'unknown error')
          } else {
            res.writeHeader(202)
            res.end(JSON.stringify({
              created: db,
              users: users,
              message: 'access with `npm --registry http://'+db+'.'+config.domain+'`'
            }))
          }
          console.error('created db')
        })      
      })
    })
  )

if(!module.parent) {
    handler.listen(config.port, function () {
      console.error(config.domain +' listening on port:' + config.port)
    })
    if(config.env == 'production')
      connect({
        key: fs.readFileSync(__dirname+'/keys/shadow-npm_key.pem')
      , cert: fs.readFileSync(__dirname+'/keys/shadow-npm_cert.pem')      
      }, handler).listen(config.httpsPort, function () {
        console.error(config.domain +' listening for https on port:' + config.httpsPort)
      })

}