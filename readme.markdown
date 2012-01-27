<pre class=art>

        /          /         
   _   /_  __.  __/  __ , , ,
  /_)_/ /_(_/|_(_/_ (_)(_(_/_
  .-----..-----..--------.
  |     ||  _  ||        |
  |__|__||   __||__|__|__|
         |__|             

</pre>

# shadow-npm

use npm to manage your private modules, without having to replicate all of npm.

## Usage

create a private registry named `rego` for npm users `you` and your friends `jim`, `paul`, and `emma`

<pre>
curl -X PUT 'http://shadow-npm.net/rego?admins=you&readers=jim,paul,emma'
</pre>


publish a module to it!

<pre>
npm config set always-auth true
cd path/to/private/module
npm publish --registry http://rego.shadow-npm.net
</pre>

## How it Works

shadow-npm works a lot like putting something at the front of your `$PATH` 
when searching for a module, look there first, and if you don't find it, check the next place in the chain.

shadow-npm does this for npm, by proxying all requests, 
it checks for modules in your private npm first.
then, if it does not find them, it will retrive them from the real npm! 
this works even if you have a private module with open source dependencies!

## Trouble Shooting

post issues here: https://github.com/dominictarr/shadow-npm/issues

if something does not work on shadow-npm, but it does with regular npm, post the issue here.
do not post the issue on npm's github page.

this is a test launch, so bugs are expected. all feedback is warmly welcomed!

send to either: 

  * https://github.com/dominictarr/shadow-npm/issues
  * [@dominictarr](http://twitter.com/#!/dominictarr)
  * dominic.tarr@gmail.com

## Search

<pre>
  npm search --registry http://rego.shadow-npm.net
</pre>

## https

today, there is only http. I'll get https tomorrow. must sleep now.

## User Authentication

  shadow-npm copies your couchdb user from the npm registry, and uses couchdb to auth against it. the your password is hashed, and shadow-npm never reads it.
  
  read the shadow-npm code here: https://github.com/dominictarr/shadow-npm

## Licence

MIT licence, Dominic Tarr, 2011. 

(_not_ isaacs, joyent, etc. please don't bug them if this doesn't work)