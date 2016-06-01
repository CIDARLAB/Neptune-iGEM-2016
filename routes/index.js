var express = require('express');
var serialcommunication = require('../serialcommunication');
var router = express.Router();
var multer= require('multer');
// Store Files


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



router.get('/fluigipage',function(req,res){
  res.sendFile(__dirname + "/public/uploads");
});


var storage =   multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './public/uploads');
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + '.jpg');
    }
});

var upload = multer({ storage : storage}).single('userPhoto');


router.post('/api/photo', function(req,res){

});
module.exports = router;



