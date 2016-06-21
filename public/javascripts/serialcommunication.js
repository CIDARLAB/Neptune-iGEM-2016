

$(document).ready(function(){
    $("#begin-comm").click(function () {
        $.ajax(
            {   url: "../serialcommunication/open", type: 'POST', async: true,
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
            {   url: "../serialcommunication/close", type: 'POST', async: true,
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

    $("#on-cmd").click(function () {


        $.ajax(
            {   url: "../serialcommunication/on", type: 'POST', async: true,
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
    $("#off-cmd").click(function () {

        $.ajax(
            {   url: "../serialcommunication/off", type: 'POST', async: true,
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

