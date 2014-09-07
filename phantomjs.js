var system = require('system');
var webpage = require('webpage');
var webserver = require('webserver');
var server = webserver.create();

var PORT = system.args[1];

function respond(res, page, statusCode) {
    res.statusCode = statusCode;
    res.close();
    page.close();
}



function handleRequest(request, response) {

    var page = webpage.create();
    var options = JSON.parse(request.post);
    var timeout;

    // What's the size of the screen?
    page.viewportSize = {
        width: options.width,
        height: options.height
    };

    // Don't render the full page, only render the viewport.
    // We want an image in the exact size we requested.
    page.clipRect = {
      top: 0,
      left: 0,
      width: options.width,
      height: options.height
    };

    // Open the page.
    page.open(options.url, function (status) {

        clearTimeout(timeout);

        if (status === 'success') {
            var base64 = page.renderBase64('PNG');
            response.setEncoding('base64');
            response.write(base64);
            respond(response, page, 200);
        }
        else {
            response.write(status);
            respond(response, page, 500);
        }

    });

    // timeout = setTimeout(function(){
    //     respond(response, page, 500);
    // }, options.maxTimeout)
}

server.listen(PORT, handleRequest);
