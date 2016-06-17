

$(document).ready(function(){
    $("#begin-comm").click(function () {
        $.ajax(
            {   url: "../openSerialConnection", type: 'POST', async: true,
                data:
                {
                  portName: $("#ports").val()
                },
                success: function(response){
                    localStorage.port= $("#ports").val()
                },
                error: function(response){
                }
            });
    });
    $("#end-comm").click(function () {


        $.ajax(
            {   url: "../closeSerialConnection", type: 'POST', async: true,
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
});

function writeToSerialConsole(command_info)
{
    var doc = document.getElementById('serial_console').contentWindow.document;
    doc.open();
    doc.write('Test');
    doc.close();
}