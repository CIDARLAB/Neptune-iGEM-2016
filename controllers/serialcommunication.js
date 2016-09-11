var cmd = require('node-cmd');
var serialport = require('serialport');
var exports = module.exports = {};
var express = require('express');
var currentWebsocket = require('./websocket');
var serialPortConnection = null;


//******************* FUNCTIONS **************************************
function openConnection (fluigiPort) {

    var SerialPort = serialport.SerialPort;

    var myPort = new SerialPort(fluigiPort, {
        baudRate: 9600,
        // look for return and newline at the end of each data packet:
        parser: serialport.parsers.readline("\r")
    });




    function showPortOpen() {
        console.log('port open. Data rate: ' + myPort.options.baudRate);
    }

    function sendSerialData(data) {
        console.log(data);
        var socket = currentWebsocket.socket();
        if (socket != null) {
            var time = new Date();
            socket.emit('serial-communication-echo', {data: data, systemTime: time.getHours() + ":" + time.getMinutes() ,
            systemTimeHours: time.getHours(), systemTimeMinutes: time.getMinutes()});
        }
    }

    function showError(error) {
        console.log('Serial port error: ' + error);
    }

    myPort.on('open', showPortOpen);
    myPort.on('data', sendSerialData);
    myPort.on('error', showError);


    serialPortConnection = myPort;
    // exports.myCommand= command;

    return {message:"Serial Connection Established"};
}

function closeConnection (myPort){

    myPort.close(function(err){
        console.log('port closed', err !== null ? err : "" );
    });
    serialPortConnection = null;
}

function sendToSerial (data, myPort) {
    console.log("LOG: sending to serial: " + data);
    exports.myCommand= data;
    myPort.write(data);
}



//******************* EXPORTS **************************************
{
    exports.openSerialPage= function(req, res) {
        //exports.listPorts(); //populates ports export
        var ports = exports.listPorts(function (ports) {
            res.render('serialcommunication', {title: 'COM', serialPorts: ports});
        }); //populates ports export

    };

    exports.openSerialConnection = function(req, res){
        var port = req.body.portName;
        console.log('My Port: ' + port);
        openConnection(port);
        res.send();
    };

    exports.closeSerialConnection = function(req, res){
        var openPort = serialPortConnection;

        if (openPort != null) {
            closeConnection(openPort);
        }
        res.send();
    };

    exports.arduinoSend = function(req, res){
        var openPort = serialPortConnection;
        console.log("Log: POST request on arduinoGetCode endpoint");
        var datacommand = req.body.commandData;
        console.log("Data to arduino: " + datacommand);
        sendToSerial(datacommand , openPort );
        res.send();
    };

    exports.listPorts= function(callback) {
        // list serial ports:
        serialport.list(function (err, ports) {
            callback(ports);
        });
    };
}