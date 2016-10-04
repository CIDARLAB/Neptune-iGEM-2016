/**
 * Created by Johan Ospina on 9/7/16.
 */

var chart;
var chartData;
var chartOptions;
var sensors = [];
var numOfSensors = 0;

$(document).ready(function() {
    var socket = io();

    socket.on('connect', function () {
        console.log("connected");
    });

    socket.on('serial-communication-echo', function(data){
        console.log(data.data);
        //do stuff to display data in real time. but also send it off to the server to add it to the CSV for that time frame
        //console.log(parseArduinoOutput(data.data));

        updateChart(parseArduinoOutput(data.data));

        //put it to somewhere

    });

    $("#begin-comm").click(function () {
        $.ajax(
            {   url: "/serialcommunication/open", type: 'POST', async: true,
                data:
                {
                    portName: $("#ports").val()

                },
                success: function(response){
                    localStorage.port= $("#ports").val();
                    console.log('Youve selected port: ' + localStorage.port);
                },
                error: function(response){
                }
            });
    });

    //example for AJAX onclick
    $("#end-comm").click(function () {

        $.ajax(
            {   url: "/serialcommunication/close", type: 'POST', async: true,
                data:
                {
                    portName: $("#ports").val()
                },
                success: function(response){
                },
                error: function(response){
                }
            });
    });

    $("#read-button").click( function () {
        $.ajax(
            {   url: "/serialcommunication/send", type: 'POST', async: true,
                data:
                {
                    commandData: "read\r"
                },
                success: function(response){

                },
                error: function(response){
                }
            });
    });

    $("#read-continuously-button").click( function () {
        $.ajax(
            {   url: "/serialcommunication/send", type: 'POST', async: true,
                data:
                {
                    commandData: "readc,1\r"
                },
                success: function(response){
                },
                error: function(response){
                }
            });
    });
});

//Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
function drawChart() { // Data Object I will pass in.
    chartData = new google.visualization.DataTable();
    chartData.addColumn('string', 'Sensor');
    chartData.addColumn('number', 'Reading');

    chartOptions = {
        title: 'Sensor Readings',
        chartArea: {width: '50%' },
        hAxis: {
            title: 'Sensor Reading',
            minValue: 0
        },
        vAxis: {
            title: 'Sensor Type'
        }
    };

    chart = new google.charts.Bar(document.getElementById('neptune-data-container'));
    chart.draw(chartData, chartOptions);
}


function updateChart(data){
    chartData.addRows([[data.type + '\nNum:' + data.address, data.readingValue]]);

    chart.draw(chartData, chartOptions);
}

function parseArduinoOutput( output ) {
    var length = output.length;
    var i;

    var address = 0; //not allowed
    var type    = "**"; //not set value;
    var value   = 0.0;
    var timeElapsed = 0.0;

    var addressRange = 0;
    var typeRange    = 0;
    var valueRange   = 0;
    var timeElapsedRange  = length; // range is 4 and it is the last 4 chars from the response string.

    // Example output 12SPH7.543
    for (i = 0; i < length; i++) {
        if ( addressRange == 0 && output[i] == 'S') { // so it only gets set once
            addressRange = i;
            typeRange = i + 3; // the next 2 chars after the S is the Type of sensor
        }

        if (valueRange == 0 && output[i] == 'T') {
            valueRange = i;
        }
    }
    address = parseInt(output.substring(0, addressRange));
    type    = output.substring(addressRange + 1, typeRange);
    value   = parseFloat(output.substring(typeRange, valueRange));
    timeElapsed = output.substring(valueRange + 1, timeElapsedRange);
    return  {address: address, type: type, readingValue: value, minutes: timeElapsed.substring(0,2), seconds: timeElapsed.substring(2,5)};
}


function initSensorListFromButton() {
    var numberOfSensors = parseInt($("#sensor-menu").val());
    numOfSensors = numberOfSensors;
    var template = sensorTemplate();
    $("#sensor-list").html("");
    var i;
    for (i = 1; i < (numberOfSensors + 1); i++) { //sensors can't have address 0
        var context = {};
        context.address = i;
        var html = Mustache.to_html(template, context);
        $("#sensor-list").append(html);
    }
}
//feed this puppy a json object for the sensors to populate;
function initSensorsFromCachedData(data){

}

function initHardwareFromListedData() {
    //here i need to create a referece to the n queues that I will make
    alert (numOfSensors);
    sensors = new Array(numOfSensors);
    var i;
    for ( i = 0; i < numOfSensors ; i++ ) {
        var sensor = {
            address: "",
            type: "",
            code: "",
            queue: new Queue()
        }
        sensors[i] = sensor;
    }
}

function sensorTemplate() {
    return "\<li> <label for=\"sensor-index-{{address}}\">Sensor Address {{address}} </label>" +
        "\<br><input id=\"sensor-index-{{address}}\" type=\"number\" value=\"0\" min=\"0\" max=\"102\">" +
        "\<label for='sensor-index-{{address}}-type'>Type: </label>" +
        "\<input id='sensor-index-{{address}}-type' style='width: 50px;' type='text'></li>"
}

function flubAbout() {
    alert("FLUBBBING");
}

function sensorMapping(index, address, type, code){
    var sensor = {
        address: address,
        type: type,
        code: code,
    };
    return sensor
}
