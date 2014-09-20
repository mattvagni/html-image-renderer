// Node
var childProcess = require('child_process');
var url = require('url');
var fs = require('fs');
var http = require('http');

// Libs
var express = require('express');
var hoganExpress = require('hogan-express');
var morgan = require('morgan');
var _ = require('underscore');
var nomnom = require('nomnom');

var server;

/*
Yo, the app.
*/
var app = express();


/*
The maximum amount of time we are going to give phantom to
render an image.
*/
var PHANTOM_MAX_TIMEOUT = 1000;


/*
Stores a list of phantom processes & the port they run on
e.g [{ process: , port: }, ...]
*/
var PHANTOM_PROCESSES = [];


/*
A list of available templates.
*/
var TEMPLATES = fs.readdirSync(__dirname + '/templates/image-templates/');


/*
Setup our options
Use --help when invoking this for... you... know... help.
*/
var options = nomnom
    .option('app_port', {
      help: 'The port on which to run the main app.',
      default : 3000,
    })
    .option('phantom_ports', {
        help: 'A list of ports on which you\'d like to start a phantom child process. An instance of phantomjs will be started for each port and reqeusts will be distributed accross them. Each phantomjs can deal with 10 concurrent requests.',
        list : true,
        position: 0
    })
    .parse();


/*
Given the url of an image such as: /image/200/200/foo/?bar=yolo, this returns the
equivalent path for the template, i.e: /html/foo/?bar=yolo

@param {string} url - The request url you would like to transform
@param {string} templateName - The name of the template.
*/
function makeTemplateUrlFromImageUrl(reqUrl, templateName) {
    var queryString = url.parse(reqUrl).search;
    return 'http://localhost:' + options.app_port + '/html/' + templateName + '/' + queryString;
}


/*
Send an image
@param  {object} res - An express response object.
@param {string} imageData - The imagedata (png)
*/
function sendImage(res, imageData){
    res.set('Content-Type', 'image/png');
    res.send(new Buffer(imageData, 'base64'));
}


/*
Returns next available phantomjs port.
*/
function getNextPhantomPort() {
    // Distribute requests accross the available
    // phantom processes.
    var port = PHANTOM_PROCESSES[0].port;
    PHANTOM_PROCESSES.push(PHANTOM_PROCESSES.shift());
    return port;
};


/*
Take a screenshot by posting to the next available phantomJS server.

@param {number} options.width - The width of the screenshot you want
@param {number} options.height - The height of the screenshot you want
@param {string} options.url - The url you want to screenshot
@param {function} callback - Callback (called with the raw image data)
*/
function takeScreenshot(options, callback) {

    var phantomRequest;
    var imageData = '';

    var postData = JSON.stringify({
        width : options.width,
        height : options.height,
        url : options.url,
        maxTimeout : PHANTOM_MAX_TIMEOUT
    });

    function handleResponse(response) {
        // When receiving data from phantom, keep it.
        response.on('data', function(chunk){
            imageData += chunk;
        });

        // When it's over, call back with the image data.
        response.on('end', function(){
            callback(imageData);
        });
    }

    phantomRequest = http.request({
        port: getNextPhantomPort(),
        path: '/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    }, handleResponse);

    // Send post data.
    phantomRequest.write(postData + '\n');
    phantomRequest.end();
}


/*
Spawn X child processes of Phantom

@param {number} number - The number of phantom processes you would like to start.
*/
function spawnPhantoms(number) {

    for (var i = 0; i < number; i++) {

        var port = options.phantom_ports[i];
        var phantom = childProcess.spawn('phantomjs', [
            __dirname + '/phantomjs.js',
            port
        ]);

        phantom.stdout.on('data', function (data) {
            console.log('phantomjs stdout: ' + data);
        });

        phantom.stderr.on('data', function (data) {
            console.log('phantomjs stderr: ' + data);
        });

        PHANTOM_PROCESSES.push({
            port : port,
            process : phantom
        });
    }
};


/*
Setup
*/
app.set('views', __dirname + '/templates/');
app.set('layout', __dirname + '/templates/_layouts/image-base.html');
app.engine('html', hoganExpress);


/*
Middleware
*/
app.use('/static/', express.static(__dirname + '/static/'));
app.use('/', morgan('tiny'));


/*
Route - Templates index
*/
app.get('/', function(req, res) {
    res.render('app-templates/index.html', {
        templates : TEMPLATES,
        layout: '_layouts/app-base.html'
    });
});


/*
Route - Rendere a template.
*/
app.get('/html/:template/', function(req, res) {
    var data = req.query;
    var template = req.params.template;

    if (!_.contains(TEMPLATES, template)) {
        res.status(404).end();
    }

    res.render('image-templates/' + template + '/index.html', data);
});


/*
Route - Render a template using phantomjs & respond as an image.
*/
app.get('/image/:width/:height/:template/', function(req, res){

    var screenshotOptions = {
        url : makeTemplateUrlFromImageUrl(req.url, req.params.template),
        width : req.params.width,
        height : req.params.height
    };

    takeScreenshot(screenshotOptions, function(imageData){
        sendImage(res, imageData);
    });
});


/*
Start a bunch of phantom processes
*/
spawnPhantoms(options.phantom_ports.length);


/*
Start the server
*/
server = app.listen(options.app_port, function() {
    console.log('%d child processes of PhantomJS were started on port(s): %s', options.phantom_ports.length, options.phantom_ports.join(', '));
    console.log('Main app is listening on port %d', server.address().port);
});
