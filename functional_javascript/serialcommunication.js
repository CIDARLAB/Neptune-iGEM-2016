var cmd = require('node-cmd');
var serialport = require('serialport');
var exports = module.exports;


exports.openConnection = function(fluigiPort) {

    /*cmd.get(
        "./hello",
        function(data){
            dataResponse = data;
            console.log(data)
        }
    );
    */

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

    return {message:"Serial Connection Established"};
};

exports.closeConnection = function(myPort){

    myPort.close(function(err){
        console.log('port closed', err !== null ? err : "" );
    });
    exports.SerialPortConnection = "";
};

exports.sendToSerial = function (data, myPort) {
    console.log("sending to serial: " + data);
    myPort.write(data);
};

exports.listPorts = function(){


    var returnPorts = [{}];

    // list serial ports:
    serialport.list(function (err, ports) {
        returnPorts = ports;
        console.log(ports);
        exports.ports = ports; //makes it available outside of this file
    });

    return returnPorts;




};


