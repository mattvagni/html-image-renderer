var system = require('system');
var args = system.args;
var argsObject = {};
var webPage = require('webpage');
var page = webPage.create();


/*
This generates an object from the command line args.
It assumes the structure of: '$ phantomjs .take-image.js foo=bar lol=yolo'
Because options could contain '=' we split on the first '=' & then
rejoin the rest.

This means you can pass options such as "url=http://url.com/lol=foo" and
get: { url : 'http://url.com/lol=foo' }

*/
args.forEach(function(arg, i) {
    if (i == 0) { // Ingnore the file path.
        return;
    }
    var splitArgs = arg.split("=");
    var argName = splitArgs.shift();
    argsObject[argName] = splitArgs.join("=");
});

page.viewportSize = {
    width: argsObject.width || 600,
    height: argsObject.height || 600
};

page.open(argsObject.url, function (status) {
    if (status === 'success'){
        page.render(argsObject.outputImagePath, { quality: 100 });
        phantom.exit(0);
    }
    else {
        phantom.exit(1);
    }
});

// Just you.. know.. in case of an emergency.
setTimeout(function(){
    phantom.exit(1);
}, 2000);
