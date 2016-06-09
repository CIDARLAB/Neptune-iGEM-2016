/**
 * Created by rebeccawolf on 6/8/16.
 */


//Upload AJAX Forms

    $(document).ready(function () {

        $('#uploadForm').submit(function () {
            $("#status").empty().text("File is uploading...");

            $(this).ajaxSubmit({

                error: function (xhr) {
                    status('Error: ' + xhr.status);
                },
                success: function (response) {
                    console.log(response);
                    $("#status").empty().text(response);


                    // Json successfully uploaded
                    var fileOfChoice = "../uploads/myjson.json";
                    $.getJSON(fileOfChoice, function (json) {
                        //alert('awesome possum');


                        // Use Json as a string
                        jsonString = JSON.stringify(json);
                        var controlOnly;

                        // figure out indices of flow and control and cut json_string to substring to only contain control
                        flowIndex = jsonString.search('flow');
                        controlIndex = jsonString.search('control');
                        if(flowIndex < controlIndex){   // control is after flow
                            controlOnly = jsonString.substr(controlIndex);
                        }
                        else {  // control is before flow
                            controlOnly = jsonString.substr(controlIndex, (flowIndex-controlIndex));
                        }

                        // Now look for all Port in the control layer only
                        var Re = /Port.+?\[(.+?),(.+?)\].+?"radius1":(.+?),"radius2":(.+?),/g;
                        var myArray;
                        var portArray = [];
                        var portX = [];
                        var portY = [];
                        var portRadius1 = [];
                        var portRadius2 = [];


                        while ((myArray = Re.exec(controlOnly)) !== null) {
                            //console.log(myArray);
                            portX.push(myArray[1]);
                            portY.push(myArray[2]);
                            portRadius1.push(myArray[3]);
                            portRadius2.push(myArray[4]);
                            portArray.push(myArray.index);
                        }
                        console.log("Port string index: " + portArray);
                        console.log("Port X coordinates: " + portX);
                        console.log("Port Y coordinates: " + portY);
                        console.log("Port Radius1: " + portRadius1);
                        console.log("Port Radius2: " + portRadius2);

                        // Store json variables to localStorage
                        localStorage.portX = portX;
                        localStorage.portY = portY;
                        localStorage.portRadius1 = portRadius1;
                        localStorage.portRadius2 = portRadius2;





                        // method using Json as JSON OBJECT
                        //    for( var i=0; i < (Object.keys(json.layers)).length; i++) { // there will be 2 -> flow and control
                        //        //console.log(json.layers[i].name);
                        //        //console.log(Object.keys(json.layers[i].params));
                        //        if(json.layers[i].name == 'flow') {
                        //            console.log(Object.keys(json.layers[0].features));
                        //            //console.log(json.layers[i].name);
                        //        }
                        //    }


                    });

                }
            });

            return false;
        });
        $('#uploadForm2').submit(function () {
            $("#status2").empty().text("File is uploading...");

            $(this).ajaxSubmit({

                error: function (xhr) {
                    status('Error: ' + xhr.status);
                },
                success: function (response) {
                    console.log(response);
                    $("#status2").empty().text(response);

                }
            });
            return false;
        });
    });
