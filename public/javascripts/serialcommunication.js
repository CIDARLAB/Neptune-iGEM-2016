

$(document).ready(function(){
    $("#begin-comm").click(function () {
        $.ajax(
            {   url: "/serialcommunication/open", type: 'POST', async: true,
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

  
});

