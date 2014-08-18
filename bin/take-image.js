var system = require('system');
var args = system.args;
var argsObject = {};
var webPage = require('webpage');
var page = webPage.create();

var options = {
    width : 1280,
    height : 990,
    maxTimeout : 5000
};

/*
This generates an object from the command line args.
It assumes the structure of: '$ phantomjs .take-image.js foo=bar lol=yolo'
Because options could contain '=' we split on the first '=' & then
rejoin the rest.

This means you can pass options such as "url=http://url.com/lol=foo" and
get: { url : 'http://url.com/lol=foo' }

Since these are called not from node but from phantomjs there is a lot of
weirdness that happens when using packages like nomnom etc. to parse
the command line args. Hence this weird solution.
*/
args.forEach(function(arg, i) {
    if (i == 0) { // Ingnore the file path.
        return;
    }
    var splitArgs = arg.split("=");
    var argName = splitArgs.shift();
    options[argName] = splitArgs.join("=");
});

/*
Exit if a url or outputImage path hasn't been provided.
*/
if (!options.url || !options.outputImage){
    phantom.exit(1);
}

/*
What's the size of the screen?
*/
page.viewportSize = {
    width: options.width,
    height: options.height
};

/*
Don't render the full page, only render the viewport.
We want an image in the exact size we requested.
*/
page.clipRect = {
  top: 0,
  left: 0,
  width: options.width,
  height: options.height
};

/*
Open the page and take a screenshot.
Image format is infered from outputImage path.
*/
page.open(options.url, function (status) {
    if (status === 'success'){
        page.render(options.outputImage, { quality: 100 });
        phantom.exit(0);
    }
    else {
        phantom.exit(1);
    }
});

/*
Timeout after a magic number/amount of time.
*/
setTimeout(function(){
    phantom.exit(1);
}, options.maxTimeout);
