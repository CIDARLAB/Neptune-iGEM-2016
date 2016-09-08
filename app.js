//Define all variables for modules

var express = require("express");
var app = express();
var path = require('path');
var multer = require("multer");
var logger = require('morgan');
var cookieParser = require('cookie-parser');
// var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var fs = require('fs');
var io = require('socket.io')(global.server);
var exports = module.exports;

var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

//Web Socket Connection ONLY ONCE
io.on('connection', function(socket){
    socket.emit('communications', { message:'world' });
    websocketConnection = socket;
    exports.webSocketConnection = socket;
});


//


//Create server
{
  global.server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Running the server on " + host + " " + port);
  });
}
global.server.timeout = 1000000000;

//View engine setup
{
  app.use(express.static(path.join(__dirname, 'public')));

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'hbs');
}
//app.use(express.static(__dirname + '/public'));


//App usage
{

      app.use(logger('dev'));
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({extended: false}));
      app.use(cookieParser());
      //app.use(express.static(path.join(__dirname + 'output')));
      app.use(express.static(path.join(__dirname, 'public')));

      app.use("/output", express.static(__dirname + "/output"));
}

//Error handlers
{
  
// development error handler
// will print stacktrace
  if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err
      });
    });
  }

// production error handler
// no stacktraces leaked to user
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {}
    });
  });
}

/**************** CONTROLLERS ****************/
{
    var homeController = require('./controllers/homepage');
    var dashboardController = require('./controllers/dashboard');
    var fileController = require('./controllers/fileupload');
    var writeController = require('./controllers/filewrite');
    var specifyController = require('./controllers/specify');
    var designController = require('./controllers/design');
    var mmController = require('./controllers/mm');
    var serialController = require('./controllers/serialcommunication');
    var fluigiController = require('./controllers/fluigi');
    var lfrController = require('./controllers/lfrpage');
    var lfr_bsController = require('./controllers/lfrpage_bs');
    var controlController = require('./controllers/control');
    var buildController = require('./controllers/build');
    var assemblyController = require('./controllers/assembly');
    var dataCollectionController = require('./controllers/datacollection');
}

/**************** RENDER PAGES ****************/
{
    // Bootstrap:
    app.get('/' , homeController.openHomePage);
    app.get('/dashboard',dashboardController.openDashboard);
    app.get('/specify',specifyController.openSpecifyPage);
    app.get('/design',designController.openDesignPage);
    app.get('/control',controlController.openControllersPage);
    app.get('/controlFull',controlController.openControlFullPage);
    app.get('/Build',buildController.openBuildPage);
    app.get('/assembly', assemblyController.openAssemblyPage);
    app.get('/fluigipage', fluigiController.getFluigiPage);
    app.get('/uShroomPage',mmController.openMMPage);
    app.get('/serialcommunication', serialController.openSerialPage);
    app.get('/datacollection', dataCollectionController.openDataCollectionPage);
    app.get('/lfrpage', lfrController.openLfrPage);
    app.get('/lfrpage_bs', lfr_bsController.openLfr_bsPage);
}

/**************** SERIAL COMMUNICATION ****************/
{
    app.post('/serialcommunication/open', serialController.openSerialConnection);
    app.post('/serialcommunication/close', serialController.closeSerialConnection);
    app.post('/serialcommunication/send', serialController.arduinoSend);
    app.post('/serialcommunication/list', serialController.listPorts);
}

/************** FILE UPLOAD  ************/
{
    // Bootstrap:
    app.get('/specify',fileController.sendToUploadsSpecify);
    app.get('/design',fileController.sendToUploadsDesign);
    app.get('/build',fileController.sendToUploadsBuild_Verify);

    app.post('/api/specify_LFR',fileController.send_specifyLFR);
    app.post('/api/specify_UCF',fileController.send_specifyUCF);
    app.post('/api/design_INI',fileController.send_designINI);
    app.post('/api/design_MINT',fileController.send_designMINT);
    app.post('/api/build_SVG',fileController.send_buildSVG);
    app.post('/api/build_JSON',fileController.send_buildJSON);

    // Pre-Bootstrap:
    //  app.get('/lfrpage', fileController.sendToUploadsSpecify);
    //  app.get('/lfrpage_bs', fileController.sendToUploadsSpecify);
    //  app.get('/uShroomPage', fileController.sendToUploadsDesign);
    //  app.get('/fluigipage', fileController.sendToUploadsBuild_Verify);
     // app.post('/api/JSON', fileController.sendJSON);
     // app.post('/api/SVG', fileController.sendSVG);
     // app.post('/api/LFR', fileController.sendLFR);
     // app.post('/api/LFR_start', fileController.sendLFR_start);
     // app.post('/api/UCF', fileController.sendUCF);
     // app.post('/api/MINT',fileController.sendMINT);
}

/************** FILE WRITE ********************/
{
    app.post('/api/writeToFile',writeController.writeToFile)
}

// MINT and LFR compiler

    var compileMintController = require('./controllers/compileMint');
    app.post('/api/compileMint',compileMintController.compileMint);

    var translateLFRController = require('./controllers/translateLFR');
    app.post('/api/translateLFR',translateLFRController.translateLFR);

// download 

    var downloadController = require('./controllers/download');
    app.post('/api/download',downloadController.download);

    var clearFilesController = require('./controllers/clearFiles');
    app.post('/api/clearFiles',clearFilesController.clearFiles);

    var zipController = require('./controllers/zipFiles');
    app.post('/api/zipFiles',zipController.zipFiles);

    var ucfMaker = require('./controllers/generateUCF');
    app.post('/api/generateUCF',ucfMaker.generateUCF);

    var parser = require('./controllers/parseDir');
    app.post('/api/parseDir',parser.parseDir);

    var projectGetter = require('./controllers/getProjects');
    app.post('/api/getProjects',projectGetter.getProjects);

    var projectMaker = require('./controllers/makeProject');
    app.post('/api/makeProject',projectMaker.makeProject);

    var fileScanner = require('./controllers/scanFiles');
    app.post('/api/scanFiles',fileScanner.scanFiles);

    var fileGetter = require('./controllers/fileGetter');
    app.post('/api/getFile',fileGetter.getFile);

