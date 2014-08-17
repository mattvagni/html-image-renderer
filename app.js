var express = require('express');
var hoganExpress = require('hogan-express');
var morgan = require('morgan');
var crypto = require('crypto');
var packageJSON = require('./package.json');
var childProcess = require('child_process');
var url = require('url');
var fs = require('fs');

var PORT = 3000;

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
    return 'http://localhost:' + PORT + '/html/' + templateName + '/' + search;
}

/*
Yo, the app.
*/
var app = express();

/*
Setup
*/
app.set('views', __dirname + '/templates/');
app.set('layout', __dirname + '/templates/_base.html');
app.engine('html', hoganExpress);

/*
Middleware
*/
app.use('/', morgan('tiny'));
app.use('/static/', express.static(__dirname + '/static/'));
app.use('/image-store/', express.static(__dirname + '/image-store/'));

/*
Routing for rendering templates.
*/
app.get('/html/:template/', function(req, res){
    var data = req.query;
    res.render(req.params.template + '/index.html', data);
});

/*
Render a template using phantomjs & respond as an image.
*/
app.get('/image/:width/:height/:template/', function(req, res){

    var width = req.params.width;
    var height = req.params.height;
    var templateData = req.query;
    var templateName = req.params.template;
    var templateUrl = makeTemplateUrlFromImageUrl(req.url, templateName, templateData);

    var screenshotUrl = makeImageUrl(width, height, templateName, templateData);
    var screenshotPath = __dirname + screenshotUrl;

    var phantom;

    /*
    Redirect the user to the image.
    */
    function redirectToImage() {
        res.redirect(screenshotUrl);
        res.end();
    }

    /*
    Spawn Phantom
    */
    function spawnPhantom() {
        phantom = childProcess.spawn('phantomjs', [
            __dirname + '/bin/take-image.js',
            'outputImagePath=' + screenshotPath,
            'url=' + templateUrl ,
            'width=' + width,
            'height=' + height
        ]);

        phantom.on('close', onPhantomClose);
    }

    /*
    Close handler for phantom child proccess
    */
    function onPhantomClose(code) {
        if (code == 0) {
            return redirectToImage();
        }

        res.send(503);
        res.end();
    }

    /*
    Check if the file allready exists. If it does then just redirect.
    */
    fs.exists(screenshotPath, function (exists) {
      if (exists) {
          return redirectToImage();
      }
      spawnPhantom();
    });
});

/*
Let's get this show on the road
*/
var server = app.listen(PORT, function() {
    console.log('Listening on port %d', server.address().port);
});
