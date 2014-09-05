var express = require('express');
var hoganExpress = require('hogan-express');
var morgan = require('morgan');
var crypto = require('crypto');
var packageJSON = require('./package.json');
var childProcess = require('child_process');
var url = require('url');
var fs = require('fs');
var _ = require('underscore');
var http = require('http');

/*
Yo, the app.
*/
var app = express();

/*
Ports
*/
var APP_PORT = 3000;
var PHANTOM_PORT = 6666;

/*
The maximum amount of time we are going to give phantom to
render an image.
*/
var PHANTOM_MAX_TIMEOUT = 500;

/*
Cache (if true, returns images from disk if it has them allready.)
*/
var CACHE_ENABLED = false;

/*
A list of available templates.
*/
var TEMPLATES = fs.readdirSync(__dirname + '/templates/images/');



/*
Return a unique image url based on the version of renderer, template & data
e.g '/0.0.0/header-area/7c20f3372ef740c4eb08ca56f44335a5'
*/
function makeImageUrl(width, height, templateName, data) {
    var dataString = '';

    for (var property in data) {
        if (data.hasOwnProperty(property)) {
            dataString += encodeURIComponent(property);
            dataString += encodeURIComponent(data[property]);
        }
    }

    dataString = crypto.createHash('md5').update(dataString).digest('hex');

    return [
        '/image-store',
        packageJSON.version,
        width + 'x' + height,
        templateName,
        dataString
    ].join('/') + '.jpeg'
}

/*
Given the url of an image such as: /image/foo/?bar=yolo, this returns the
equivalent path for the template, i.e: /image/foo/?bar=yolo
*/
function makeTemplateUrlFromImageUrl(reqUrl, templateName, templateData) {
    var search = url.parse(reqUrl, true).search;
    return 'http://localhost:' + APP_PORT + '/html/' + templateName + '/' + search;
}

/*
Take a screenshot by posting to the next available phantomJS server.
*/
function takeScreenshot(options, callback) {

    var postData = JSON.stringify({
        width : options.width,
        height : options.height,
        url : options.url,
        renderedImagePath : options.renderedImagePath,
        maxTimeout : PHANTOM_MAX_TIMEOUT
    });

    var phantomRequest = http.request({
        port: PHANTOM_PORT,
        path: '/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    }, function(){
        callback();
    });

    // Send post data.
    phantomRequest.write(postData + '\n');
    phantomRequest.end();
}


/*
Setup
*/
app.set('views', __dirname + '/templates/');
app.set('layout', __dirname + '/templates/_layouts/image-base.html');
app.engine('html', hoganExpress);

/*
Middleware
*/
app.use('/', morgan('tiny'));
app.use('/static/', express.static(__dirname + '/static/'));
app.use('/image-store/', express.static(__dirname + '/image-store/'));

/*
Route - Templates index
*/
app.get('/', function(req, res) {
    res.render('app/index.html', {
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

    res.render('images/' + template + '/index.html', data);
});

/*
Route - Render a template using phantomjs & respond as an image.
*/
app.get('/image/:width/:height/:template/', function(req, res){

    var width = req.params.width;
    var height = req.params.height;

    var templateData = req.query;
    var templateName = req.params.template;
    var templateUrl = makeTemplateUrlFromImageUrl(req.url, templateName, templateData);

    var renderedImageUrl = makeImageUrl(width, height, templateName, templateData);
    var renderedImagePath = __dirname + renderedImageUrl;

    var screenshotOptions = {
        url : templateUrl,
        width : width,
        height : height,
        renderedImagePath : renderedImagePath
    };

    // Redirect the user to the image.
    function redirectToImage() {
        res.redirect(renderedImageUrl);
        res.end();
    }

    // Check if the file allready exists. If it does then just redirect.
    fs.exists(renderedImagePath, function (exists) {
        if (exists && CACHE_ENABLED) {
            return redirectToImage();
        }
        takeScreenshot(screenshotOptions, redirectToImage);
    });
});

/*
Let's get this show on the road
*/
var server = app.listen(APP_PORT, function() {
    console.log('Listening on port %d', server.address().port);
});
