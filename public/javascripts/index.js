var express = require('express');
var serialcommunication = require('../../functional_javascript/serialCommunication');
var router = express.Router();
var multer= require('multer');
var fs = require('fs');
var pumpDataFile= require('../javascripts/initiate_data.js');





/**************** SERIAL COMMUNICATION ****************/
{
    /* GET Serial Communication page. */
    router.get('/serialcommunication', function (req, res, next) {
        serialcommunication.listPorts(); //populates ports export
        var ports = serialcommunication.ports;
        res.render('serialcommunication', {title: 'COM', serialPorts: ports});
    });

    /* POST Open Serial Comm command */
    router.post('/openSerialConnection', function (req, res, next) {
        var port = req.body.portName;
        console.log('my port yo; ' + port);
        res.send(serialcommunication.openConnection(port));
    });

    /* POST Close Serial Comm Command */
    router.post('/closeSerialConnection', function (req, res, next) {
        var openPort = serialcommunication.SerialPortConnection;
        res.send(serialcommunication.closeConnection(openPort));

    });


    /* POST arduino ON Serial Comm Command */
    router.post('/arduinoON', function (req, res, next) {
        var openPort = serialcommunication.SerialPortConnection;

        res.send(serialcommunication.sendToSerial('on', openPort));

    });

    /* POST arduino OFF Serial Comm Command */
    router.post('/arduinoOFF', function (req, res, next) {
        var openPort = serialcommunication.SerialPortConnection;
        res.send(serialcommunication.sendToSerial('off', openPort));

    });
    router.post('/arduinoGetCode', function (req, res, next) {
        var openPort = serialcommunication.SerialPortConnection;
        var command= serialcommunication.myCommand;
        res.send(serialcommunication.sendToSerial(command, openPort));

    });
    
}
/************** END SERIAL COMMUNICATION  ************/
/************* HOME PAGE  ********************/
{
    /* GET home page. */
    router.get('/', function(req, res, next) {
        res.render('index', { title: 'Express' });
    });

}
/************* END HOME PAGE *****************/

/************ FLUIGI PAGE *******************/
{
    /* GET fluigi page. */
    router.get('/fluigipage', function (req, res, next) {
        res.render('fluigipage', {title: 'Fluigi Page'});
    });

    router.get('/fluigipage', function (req, res) {
        res.sendFile(__dirname + "./public/uploads");
    });

    router.get('/uShroomPage',function(req,res,next) {
        res.render('uShroomPage',{title: 'Fluigi Page'});
    });

    router.get('/uShroomPage', function (req, res) {
        res.sendFile(__dirname + "./public/uploads");
    });
    
    // FILE UPLOAD FOR JSON ---------------------------------------------------------------------------------
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
            if (file.mimetype !== 'application/json') {
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

    // FILE UPLOAD FOR SVG ---------------------------------------------------------------------------------
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


    // FILE UPLOAD FOR VERILOG ---------------------------------------------------------------------------------
    var storage_VERILOG =   multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads');
        },
        filename: function (req, file, callback) {
            callback(null, file.fieldname + '.json');
        }
    });

    var upload_VERILOG = multer({
        storage : storage_VERILOG,
        fileFilter: function (req, file, cb) {
            if (file.mimetype !== 'text/x-verilog') {
                req.fileValidationError = 'Wrong Filetype!';
                console.log('My filetype: '+file.mimetype);
                return cb(null, false, new Error('goes wrong on the mimetype'));
            }
            cb(null, true);
        }
    }).single('myVerilog');


    router.post('/api/verilog', function(req,res){
        upload_VERILOG(req,res,function(err) {
            if(err) {
                return res.end("Error uploading file.");
            }
            if(req.fileValidationError) {
                return res.end(req.fileValidationError);
            }
            res.end("Verilog File is uploaded");
            console.log("My Verilog: "+res);

        });
    });

    // FILE UPLOAD FOR UCF ---------------------------------------------------------------------------------
    var storage_UCF =   multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads');
        },
        filename: function (req, file, callback) {
            callback(null, file.fieldname + '.svg');
        }
    });

    var upload_UCF = multer({
        storage: storage_UCF
        // fileFilter: function (req, file, cb) {
        //     if (file.mimetype !== 'image/svg+xml') {
        //         req.fileValidationError = 'Wrong Filetype!';
        //         console.log('My filetype: ' + file.mimetype);
        //         return cb(null, false, new Error('goes wrong on the mimetype'));
        //     }
        //     cb(null, true);
        // }
    }).single('myUCF');

    router.post('/api/ucf', function(req,res){
        upload_UCF(req,res,function(err) {
            if(err) {
                return res.end("Error uploading file2.");
            }
            if(req.fileValidationError) {
                return res.end(req.fileValidationError);
            }
            res.end("UCF File is uploaded");
            console.log("My UCF: "+res);

        });
    });

}



/********** END FLUIGI PAGE *****************/


module.exports = router;



