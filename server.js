var connect = require('connect')
  , config = require('./config')()
  , registries = require('./registries')(config)
  , shadowProxy = require('./proxy')
  , fs = require('fs')
  , ghm = require('github-flavored-markdown')
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
      '</style></head><body><div id=content>',
      ghm.parse(fs.readFileSync(__dirname+'/readme.markdown', 'utf-8')),
      '</div></body></html>'
    ].join('')

  return html
}


var server = 
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

if(!module.parent)
  server.listen(config.port, function () {
    console.error(config.domain +' listening on port:' + config.port)
  })
