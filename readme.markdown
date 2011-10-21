# shadow-npm

use npm to manage your private modules, without having to replicate all of npm.

## how it works

shadow-npm works a lot like puting something at the front of your `$PATH` 
when searching for a module, look there at the start first, then the next if you don't find it.

shadow-npm does this for npm, it proxies all requests, and checks for modules in your private npm first.
then, if it does not find them, it will retrive them from the real npm! 
this works even if you have a private module with open dependencies!

## installation

 1. install an npm registry in your couchdb following the instructions at: https://github.com/isaacs/npmjs.org
    note: you may have to disable 'secure rewrites' under your couchdb configuration
 2. setup a `./config.json` file 
 
it will probably look like this:

``` json
{
  "host": "yourname.iriscouch.com",
  "path": "/registry/_design/app/_rewrite"
}
```

start shadow-npm

``` bash
>node shadow-npm.js -c config.json
shadow-npm listening on port:8686
```

publish a module to it!

``` bash
npm --registry http://localhost:8686 publish
```

enjoy!

## User Authentication
I havn't looked into this yet. we accept pull requests.
