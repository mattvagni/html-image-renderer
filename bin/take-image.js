var system = require('system');
var args = system.args;
var argsObject = {};

args.forEach(function(arg, i) {
    if (i == 0) { // Ingnore the file path.
        return;
    }
    var splitArgs = arg.split("=");
    var argName = splitArgs.shift();
    argsObject[argName] = splitArgs.join("=");
});

var webPage = require('webpage');
var page = webPage.create();

page.viewportSize = {
    width: argsObject.width || 600,
    height: argsObject.height || 600
};

console.log(argsObject.url);

page.open(argsObject.url, function (status) {
    if (status === 'success'){
        page.render(argsObject.outputImagePath, { quality: 100 });
        phantom.exit(0);
    }
    else {
        phantom.exit(1);
    }
});
