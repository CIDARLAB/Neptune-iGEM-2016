var express = require('express');
var serialcommunication = require('../serialcommunication');
var router = express.Router();
var multer= require('multer');
var fs = require('fs');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET fluigi page. */
router.get('/fluigipage', function(req, res, next) {
    res.render('fluigipage', { title: 'Fluigi Page' });
});

/* GET Serial Communication page. */
router.get('/serialcommunication', function(req, res, next) {
    serialcommunication.listPorts(); //populates ports export
    var ports = serialcommunication.ports;

    res.render('serialcommunication', { title: 'COM' , serialPorts: ports });

});

/* POST Open Serial Comm command */
router.post('/openSerialConnection', function(req, res, next) {
    var port =  req.body.portName;
    console.log( 'my port yo; ' + port);

    res.send(serialcommunication.openConnection(port));
});

/* POST Close Serial Comm Command */
router.post('/closeSerialConnection', function(req, res, next){
    var openPort = serialcommunication.SerialPortConnection;

    res.send(serialcommunication.closeConnection(openPort));

});


/* POST arduino ON Serial Comm Command */
router.post('/arduinoON', function(req, res, next){
    var openPort = serialcommunication.SerialPortConnection;

    res.send(serialcommunication.sendToSerial('on', openPort));

});

/* POST arduino OFF Serial Comm Command */
router.post('/arduinoOFF', function(req, res, next){
    var openPort = serialcommunication.SerialPortConnection;

    res.send(serialcommunication.sendToSerial('off', openPort));

});


// File Upload for JSON


var storage =   multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './public/uploads');
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '.json');
    }
});

var upload = multer({
    storage : storage,
    fileFilter: function (req, file, cb) {
            if (file.mimetype !== 'application/octet-stream') {
                req.fileValidationError = 'Wrong Filetype!';
                console.log('My filetype: '+file.mimetype);
                return cb(null, false, new Error('goes wrong on the mimetype'));
            }
        cb(null, true);
    }
}).single('myjson');


router.post('/api/photo', function(req,res){
  upload(req,res,function(err) {
    if(err) {
      return res.end("Error uploading file.");
    }
      if(req.fileValidationError) {
          return res.end(req.fileValidationError);
      }
      res.end("JSON File is uploaded");
    console.log("My JSON: "+res);

  });
});

// File Upload for SVG
var storage2 =   multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './public/uploads');
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '.svg');
    }
});

var upload2 = multer({
    storage: storage2,
    fileFilter: function (req, file, cb) {
        if (file.mimetype !== 'image/svg+xml') {
            req.fileValidationError = 'Wrong Filetype!';
            console.log('My filetype: ' + file.mimetype);
            return cb(null, false, new Error('goes wrong on the mimetype'));
        }
        cb(null, true);
    }
}).single('mysvg');

router.post('/api/svg', function(req,res){
    upload2(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file2.");
        }
        if(req.fileValidationError) {
            return res.end(req.fileValidationError);
        }
        res.end("SVG File is uploaded");
        console.log("My SVG: "+res);

    });
});

module.exports = router;



