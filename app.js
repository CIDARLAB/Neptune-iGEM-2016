//Define all variables for modules
{
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
}

//Controllers
{
// var homeController = require('./controllers/');
   var fileController = require('./controllers/fileupload');
//   var mmController = require('./controllers/mm');
  var serialController = require('./controllers/serialcommunication');
}

//Sending http request
{
// Get port from environment and store in Express.
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

 // Create HTTP server.
var server = http.createServer(app);

// Listen on provided port, on all network interfaces.
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// Normalize a port into a number, string, or false.
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

// Event listener for HTTP server "error" event.
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

// Event listener for HTTP server "listening" event.
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

}

//View engine setup
{
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'hbs');
}

//App usage
{
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  // app.use('/', app);
}

//Error handlers
{
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
  
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


/**************** RENDER PAGES ****************/
{
  app.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
  });

  app.get('/fluigipage', function (req, res, next) {
    res.render('fluigipage', {title: 'Fluigi Page'});
    res.sendFile(__dirname + "./public/uploads");
  });

  app.get('/uShroomPage',function(req,res,next) {
    res.render('uShroomPage',{title: 'Fluigi Page'});
    res.sendFile(__dirname + "./public/uploads");
  });

  app.get('/serialcommunication', serialController.loadSerialPage());

}

/**************** SERIAL COMMUNICATION ****************/
{
  app.post('./serialcommunication/open', serialController.openSerialConnection());
  app.post('./serialcommunication/close', serialController.closeSerialConnection());
  app.post('./serialcommunication/on', serialController.arduinoOn());
  app.post('./serialcommunication/off', serialController.arduinoOff());
  app.post('./serialcommunication/send', serialController.arduinoSend());
}

/************** FILE UPLOAD  ************/
{

  app.post('./api/photo', fileController.sendJSON());
  app.post('./api/svg', fileController.sendSVG());
  app.post('./api/verilog', fileController.sendVERILOG());
  app.post('./api/ucf', fileController.sendUCF());
}




module.exports = app;
