# shadow-npm

use npm to manage your private modules, without having to replicate all of npm.

## How it Works

shadow-npm works a lot like puting something at the front of your `$PATH` 
when searching for a module, look there at the start first, then the next if you don't find it.

shadow-npm does this for npm, it proxies all requests, and checks for modules in your private npm first.
then, if it does not find them, it will retrive them from the real npm! 
this works even if you have a private module with open dependencies!

## Installation

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

The simplest and best way to do authentication is to copy the users  
you want from the real npm, since `registry.npmjs.org/-/user/org.couchdb.user:$USERNAME` gives the user document,
we will pretty much just copy it over, and then that user will be able to use the private npm, without
having to signup again, or change or reveal their credentials.

you just have to tell npm to always use authentication:

``` bash
npm config set always-auth true
```

After you have installed the couchapp, and created an admin user,  
go to the registry database in futon (your-couchdb`/_utils/database.html?registry`)
click on "Security", then add `"team"` to the roles array.

then, this command creates a user:

``` bash
node shadow-npm.js -u username -a admin:password
```

This will allow `username` to use your private npm!

You will be able to remove the user later, but you will not ever know their password.

## Search UI

this didn't work for some reason.

You wont have enough modules that you will need it anyway,  
so just use the `npm search --registry ...` command.  
it will only return results from the shadow registry.  

