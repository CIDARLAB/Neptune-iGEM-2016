/**
 * Created by Johan Ospina on 9/7/16.
 */



$(document).ready(function() {
    var socket = io();

    socket.on('connect', function () {
        console.log("connected");
    });

    socket.on('communications', function(data){
        console.log(data.data.length);
        console.log(data.data);
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
                    commandData: "read\r"
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
function drawChart() {
    var data = google.visualization.arrayToDataTable([
        ['Diameter', 'Age'],
        [8, 37], [4, 19.5], [11, 52], [4, 22], [3, 16.5], [6.5, 32.8], [14, 72]]);

    var options = {
        title: 'Age of sugar maples vs. trunk diameter, in inches',
        hAxis: {title: 'Diameter'},
        vAxis: {title: 'Age'},
        legend: 'none',
        trendlines: { 0: {} }    // Draw a trendline for data series 0.
    };

    var chart = new google.visualization.ScatterChart(document.getElementById('neptune-data-container'));
    chart.draw(data, options);
}



//document.getElementById('neptune-data-container')