var fs = require('fs')
module.exports = function loadConfig () {
  var file = argv.c || argv.config || join(__dirname, 'config.json');

  try {
    return JSON.parse(fs.readFileSync(file))
  } catch (err) {
    throw err
  }
}
