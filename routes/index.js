var express = require('express');
<<<<<<< HEAD
=======
var serialcommunication = require('../serialcommunication');
>>>>>>> d791ecf2e4beedf56c3429180ddd7203a660f564
var router = express.Router();
var multer= require('multer');
var upload = multer({ storage : storage}).single('userPhoto');



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

<<<<<<< HEAD
// Get Fluigi Page
router.get('/fluigipage', function(req, res, next) {
  res.render('fluigipage', { title: 'Fluigi Page' });
});

=======
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


>>>>>>> d791ecf2e4beedf56c3429180ddd7203a660f564
// Store Files
var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now());
  }
});

router.get('/fluigipage',function(req,res){
  res.sendFile(__dirname + "/public/uploads");
});

router.post('/api/photo',function(req,res){
  upload(req,res,function(err) {
    if(err) {
      return res.end("Error uploading file.");
    }
    res.end("File is uploaded");
  });
});

<<<<<<< HEAD

=======
>>>>>>> d791ecf2e4beedf56c3429180ddd7203a660f564
module.exports = router;

