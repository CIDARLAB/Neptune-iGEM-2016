/**
 * Created by Johan Ospina on 9/7/16.
 */

var chart;
var chartDataContinuous;
var chartOptionsContinuous;
var sensors = [];
var oldReadings = []; //arrays in js function like stacks.
var numOfSensors = 0;
var sensorCollectionStyle ;
//0 is visualize a single reading // 1 is visualize multiple readings from now on.
// if you want to load something from memory or a file write a new function to do that with.

$(document).ready(function() {
    var socket = io();

    socket.on('connect', function () {
        console.log("connected");
    });

    socket.on('serial-communication-echo', function(data){
        console.log(data.data);
        //do stuff to display data in real time. but also send it off to the server to add it to the CSV for that time frame
        //console.log(parseArduinoOutput(data.data));
        if (data.data == '\0'){
            //done sending data
            handleDataDisplay();
        } else {
            addToQueues(parseArduinoOutput(data.data));
        }

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
        sensorCollectionStyle = 0;
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
        sensorCollectionStyle = 1;
        chartDataContinuous = "";
        //maybe set up continuous chart here?

        //
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
    for ( i = 1; i < numOfSensors + 1 ; i++ ) {
        var sensor = {
            address: parseInt($("#sensor-index-" + i).val()),
            type: $("#sensor-index-" + i + "-type").val(),
            queue: new Queue()
        };
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
    var sensorVar = {
        address: 12,
        type: 'PH',
        value: 7.00,
        timeElapsed: "00.07"
    };
    var i;
    for (i = 0; i < numOfSensors; i++){
        sensors[i].queue.enqueue(sensorVar);
    }
}

function sensorMapping(index, address, type, code, timeElapsed){
    var sensor = {
        address: address,
        type: type,
        code: code,
        timeElapsed: timeElapsed
    };
    return sensor
}

function addToQueues(sensorData){
    //look into using a hash map approach for constant time look up complexity

    //todo -> add to a var to check if I need to update the sensor data

    //THIS CAN BE IMPROVED WITH A HASH MAP { sensor address -> value }
    var i;
    for (i = 1; i < numOfSensors + 1; i++){
        if (sensorData.address == sensors[i].address) {
            sensors[i].queue.enqueue(sensorData);
        }
    }
}

function handleDataDisplay(){
    switch(sensorCollectionStyle) {
        case 0: //this is the single read mode

            var dataTable = new google.visualization.DataTable();
            dataTable.addColumn('string', 'Sensor');
            dataTable.addColumn('number', 'Reading');
            var sensorReadingNow = [];

            var i;
            for (i = 1; i < numOfSensors + 1; i++){ //AGAIN -> can't use address 0, if you map this to sensor addresses in js.
                var sensorData = sensors[i].queue.dequeue();
                if (sensorData != null){
                    sensorReadingNow.push(sensorData);
                }

                dataTable.addRows([[sensorData.type + '\nNum:' + sensorData.address, sensorData.readingValue]]);
            }
            var date = new Date();
            var payload = { data: sensorReadingNow, timeStamp: date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() };
            oldReadings.push(payload);

            chart.draw(dataTable, chartOptions);

            //so this is done and it's adding payloads to my history object (which is NOICE)

            break;
        case 1: //this is the continuous read mode
            //need to implement something that will keep track of this.
            //to that end i'm probably gonna need some sort of global var for the chart data here. I'd want to minimize O(n) look ups
            //so in that way I'm not creating something that's O(n^2) (look up and populate a chart data from the list of queues


            break;
        default:
            break;
    }

}

function sendKillCmd(){
    $.ajax(
        {   url: "/serialcommunication/send", type: 'POST', async: true,
            data:
            {
                commandData: "q\r"
            },
            success: function(response){

            },
            error: function(response){
            }
        });
}
