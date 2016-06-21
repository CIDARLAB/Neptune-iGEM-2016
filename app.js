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

    console.log("Runing the server on " + host + " " + port);
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
// var homeController = require('./controllers/');
  var fileController = require('./controllers/fileupload');
//   var mmController = require('./controllers/mm');
  var serialController = require('./controllers/serialcommunication');
}

/**************** RENDER PAGES ****************/
{

 app.get('/' , function (req,res) {
 res.render('index', { title: 'Express' });
 });

  app.get('/fluigipage', function (req, res, next) {
    res.render('fluigipage', {title: 'Fluigi Page'});
  });

  app.get('/uShroomPage',function(req,res,next) {
    res.render('uShroomPage', {title: 'MM Page'});
  });

  app.get('/serialcommunication', function(req, res) {
    serialController.listPorts(); //populates ports export
    var ports = serialController.ports;
    res.render('serialcommunication', {title: 'COM', serialPorts: ports});
  });

  app.get('/fluigipage',function(req,res,next) {
    res.sendFile(__dirname + "./public/uploads");
  });

  app.get('/uShroomPage',function(req,res,next) {
    res.sendFile(__dirname + "./public/uploads");
  });

 }

/**************** SERIAL COMMUNICATION ****************/
{

  app.post('/serialcommunication/open', function(req, res){
    serialController.openSerialConnection(req, res);
  });
  app.post('/serialcommunication/close', function(req, res){
    serialController.closeSerialConnection(req, res);
  });
  app.post('/serialcommunication/send', function(req, res){
    serialController.arduinoSend(req, res);
  });

}

/************** FILE UPLOAD  ************/
{

  app.post('/api/json', function(req, res) {
    fileController.sendJSON(req, res);
  });
  app.post('/api/svg', function(req, res) {
    fileController.sendSVG(req, res);
  });
  app.post('/api/verilog', function(req, res) {
    fileController.sendVERILOG(req, res);
  });
  app.post('/api/ucf', function(req, res){
    fileController.sendUCF(req, res);
  });

}

