#! /usr/bin/env node

/*
    Module dependencies.
    Please provide a brief description of the module function and purpose in the app:
    Directory           Description
    --------------------------------
    express
    path
    multer
    morgan
    cookie-parser
    body-parser
    fs
    mongoose            MongoDB object modeling tool.
    s3                  High level Amazon S3 client to support upload and download of files and directories to S3.
*/

//var MongoStore = require('connect-mongo/es5')(session);
//var session = require('express-session');
var express         = require("express");
var path            = require('path');
var multer          = require("multer");
var logger          = require('morgan');
var cookieParser    = require('cookie-parser');
var bodyParser      = require('body-parser');
var fs              = require('fs');
var mongoose        = require('mongoose');
var s3              = require('s3');
var app = express();


/*
    Initiate connection to mongoDB.
 */
// var db = mongoose.connection;
// var mongoDB = 'mongodb://localhost/myTestDB';
// mongoose.connect(mongoDB);
// db.on('error', function (err)
// {
//     console.log('connection error', err);
// });
// db.once('open', function ()
// {
//     console.log('connected.');
// });


/*
     Initiate connection to S3.
 */
// var client = s3.createClient({
//     maxAsyncS3: 20,     // this is the default
//     s3RetryCount: 3,    // this is the default
//     s3RetryDelay: 1000, // this is the default
//     multipartUploadThreshold: 20971520, // this is the default (20 MB)
//     multipartUploadSize: 15728640, // this is the default (15 MB)
//     s3Options:
//     {
//         accessKeyId: "AKIAILNCWP4S2WM4VLPA",
//         secretAccessKey: "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"
//         // any other options are passed to new AWS.S3()
//         // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
//     }
// });



/*
    Save application path into a global variable.
*/
global.Neptune_ROOT_DIR = __dirname;

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

/*
    Create server.
*/
{
    global.server = app.listen(3000, function () {                  // Set port
    var host = server.address().address;
    var port = server.address().port;
    console.log("Running the server on " + host + " " + port);
  });
}
global.server.timeout = 1000000000;                                 // Set timeout



/*
    View-engine setup.
*/
{
  app.use(express.static(path.join(__dirname, 'public')));

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'hbs');

  var hbs = require('hbs');
  hbs.registerPartials(__dirname + '/views/partials');
}
//app.use(express.static(__dirname + '/public'));


/*
    App usage.
*/
{

      app.use(logger('dev'));
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({extended: false}));
      app.use(cookieParser());
      //app.use(express.static(path.join(__dirname + 'output')));
      app.use(express.static(path.join(__dirname, 'public')));

      app.use("/output", express.static(__dirname + "/output"));
}

/*
    Error handlers.
*/
{
    /*
     Development error handler.
     Will print stacktrace.
    */
    if (app.get('env') === 'development')
    {
        app.use(function (err, req, res, next) {
          res.status(err.status || 500);
          res.render('error', {
            message: err.message,
            error: err
          });
        });
    }
    /*
    Production error handler.
    No stacktraces leaked to user.
    */
    app.use(function (err, req, res, next)
    {
        res.status(err.status || 500);
        res.render('error', {
          message: err.message,
          error: {}
        });
    });
}




/**************** CONTROLLERS ****************/
{
    var viewsController = require('./controllers/views');
    var fileController = require('./controllers/fileupload');
    var writeController = require('./controllers/filewrite');
    var serialController = require('./controllers/serialcommunication');
    var workspaceController = require('./controllers/workspace');
    var compileMintController = require('./controllers/compileMint');
    var translateLFRController = require('./controllers/translateLFR');
    var filesystemController = require('./controllers/filesystem');

    var AWS_S3_Controller = require('./controllers/AWS_S3');
}

/************************************************/
/****************** App Routes ******************/
/************************************************/

/**************** RENDER PAGES ****************/
{
    // Bootstrap:
    app.get('/' , viewsController.openHomePage);
    app.get('/dashboard', viewsController.openDashboard);
    app.get('/specify', viewsController.openSpecifyPage);
    app.get('/design', viewsController.openDesignPage);
    app.get('/control', viewsController.openControllersPage);
    app.get('/controlFull', viewsController.openControlFullPage);
    app.get('/Build', viewsController.openBuildPage);
    app.get('/buildfull', viewsController.openNewBuildPage);
    app.get('/assembly', viewsController.openAssemblyPage);

    app.get('/fluigipage', viewsController.getFluigiPage);
    app.get('/uShroomPage', viewsController.openMMPage);
    app.get('/serialcommunication', serialController.openSerialPage);

    app.get('/lfrpage', viewsController.openLfrPage);
    app.get('/lfrpage_bs', viewsController.openLfr_bsPage);
}

/**************** SERIAL COMMUNICATION ****************/
{
    app.post('/serialcommunication/open', serialController.openSerialConnection);
    app.post('/serialcommunication/close', serialController.closeSerialConnection);
    app.post('/serialcommunication/send', serialController.arduinoSend);
    app.post('/serialcommunication/list', serialController.listPorts);
}

/*************************** FILE WRITE ********************/
{
    app.post('/api/writeToFile',writeController.writeToFile);
}

/************** AMAZON WEB SERVICES S3 FILE STORAGE  ***************/
{
    app.post('/api/Create_Unique_Bucket', AWS_S3_Controller.Create_Unique_Bucket);
    app.post('/api/Delete_Unique_Bucket', AWS_S3_Controller.Delete_Unique_Bucket);
    app.post('/api/Delete_Bucket_Object', AWS_S3_Controller.Delete_Bucket_Object);
    app.post('/api/Create_Bucket_Object', AWS_S3_Controller.Create_Bucket_Object);
}

/**************** USHROOM MAPPER & FLUIGI ****************/
{
    app.post('/api/compileMint', compileMintController.compileMint);
    app.post('/api/translateLFR', translateLFRController.translateLFR);
}

/**************** WORKSPACE INITIATION AND MAINTAINENCE ****************/
{
    app.post('/api/clearFiles', workspaceController.clearFiles);
    app.post('/api/generateUCF', workspaceController.generateUCF);
    app.post('/api/getFile', workspaceController.getFile);
    app.post('/api/download', workspaceController.download);
    app.post('/api/parseDir', workspaceController.parseDir);
    app.post('/api/getProjects', workspaceController.getProjects);
    app.post('/api/makeProject', workspaceController.makeProject);
    app.post('/api/scanFiles', workspaceController.scanFiles);
    app.post('/api/findHome', workspaceController.findHome);
}

/**************** AWS - MONGOOSE - MONGODB - FILE SYSTEM  ****************/
{
    app.post('/api/AWS_FS', filesystemController.AWS_FS);
}




/**************** DEPRECATED CONTROLLERS ****************/
//var downloadController = require('./controllers/download');
//var zipController = require('./controllers/zipFiles');
//      app.post('/api/zipFiles',zipController.zipFiles);
//var fileGetter = require('./controllers/fileGetter');
//var ucfMaker = require('./controllers/generateUCF');
//var clearFilesController = require('./controllers/clearFiles');