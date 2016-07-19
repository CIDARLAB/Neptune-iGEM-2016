var cmd = require('node-cmd');
var serialport = require('serialport');
var exports = module.exports;
var express = require('express');


//******************* EXPORTS **************************************
{

exports.openSerialPage= function(req, res) {
            exports.listPorts(); //populates ports export
            var ports = exports.ports;
            res.render('serialcommunication', {title: 'COM', serialPorts: ports});
    };

exports.openSerialConnection = function(req, res){
    console.log("got here");
    var port = req.body.portName;
    console.log('My Port: ' + port);
    openConnection(port);
    res.send();
};

exports.closeSerialConnection = function(req, res){
    var openPort = SerialPortConnection;
    closeConnection(openPort);
    res.send();
};

exports.arduinoSend = function(req, res){
    var openPort = SerialPortConnection;
    console.log("Log: POST request on arduinoGetCode endpoint");
    var datacommand = req.body.commandData;
    console.log("Data to arduino: " + datacommand);
    sendToSerial(datacommand , openPort );
    res.send();
};
    
exports.listPorts= function() {
   var returnPorts = [{}];

   // list serial ports:
   serialport.list(function (err, ports) {
      returnPorts = ports;
      console.log(ports);
      exports.ports = ports; //makes it available outside of this file
   });
   return returnPorts;
};
}



//******************* FUNCTIONS **************************************
function openConnection (fluigiPort) {

    var SerialPort = serialport.SerialPort;

    var myPort = new SerialPort(fluigiPort, {
        baudRate: 9600,
        // look for return and newline at the end of each data packet:
        parser: serialport.parsers.readline("\n")
    });


    myPort.on('open', showPortOpen);
    myPort.on('data', sendSerialData);
    myPort.on('error', showError);

    function showPortOpen() {
        console.log('port open. Data rate: ' + myPort.options.baudRate);
    }

    function sendSerialData(data) {
        console.log(data);
    }

    function showError(error) {
        console.log('Serial port error: ' + error);
    }

    exports.SerialPortConnection = myPort;
    // exports.myCommand= command;

    return {message:"Serial Connection Established"};
}

function closeConnection (myPort){

    myPort.close(function(err){
        console.log('port closed', err !== null ? err : "" );
    });
    exports.SerialPortConnection = "";
}

function sendToSerial (data, myPort) {
    console.log("LOG: sending to serial: " + data);
    exports.myCommand= data;
    myPort.write(data);
}



