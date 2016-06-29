//Define all variables for modules

var express = require("express");
var multer = require("multer");
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();
var debug = require('debug')('FluigiGUI:server');
var http = require('http');

//Create server
{
  var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Running the server on " + host + " " + port);
  });
}

//View engine setup
{
  app.use(express.static(path.join(__dirname, 'public')));
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'hbs');
}

//App usage
{
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
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
  var fileController = require('./controllers/fileupload');
  var mmController = require('./controllers/mm');
  var serialController = require('./controllers/serialcommunication');
  var fluigiController= require('./controllers/fluigi');
}

/**************** RENDER PAGES ****************/
{
  app.get('/' , homeController.openHomePage);
  app.get('/fluigipage', fluigiController.getFluigiPage);
  app.get('/uShroomPage',mmController.openMMPage);
  app.get('/serialcommunication', serialController.openSerialPage);

}

/**************** SERIAL COMMUNICATION ****************/
{

  app.post('/serialcommunication/open', serialController.openSerialConnection);
  app.post('/serialcommunication/close', serialController.closeSerialConnection);
  app.post('/serialcommunication/send', serialController.arduinoSend);

}

/************** FILE UPLOAD  ************/
{
  app.get('/fluigipage', fileController.sendToUploads);
  app.get('/uShroomPage', fileController.sendToUploads);
  app.post('/api/json', fileController.sendJSON);
  app.post('/api/svg', fileController.sendSVG);
  app.post('/api/verilog', fileController.sendVERILOG);
  app.post('/api/ucf', fileController.sendUCF);
}


