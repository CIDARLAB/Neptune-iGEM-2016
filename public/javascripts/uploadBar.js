

//Upload AJAX Forms

// Initialize localStorage values


$(document).ready(function () {

    $('#uploadForm').submit(function () {
        // $("#status").empty().text("File is uploading...");

        $(this).ajaxSubmit({

            error: function (xhr) {
                status('Error: ' + xhr.status);
            },
            success: function (response) {
                console.log(response);
                // $("#status").empty().text(response);
                $("#status").empty().text();
                var JSONbutton = document.getElementById("inputfile");
                JSONbutton.style.backgroundColor = "#2ecc71";


                // Json successfully uploaded
                var fileOfChoice = "../uploads/myjson.json";
                $.getJSON(fileOfChoice, function (json) {

                    // Use Json as a string
                    jsonString = JSON.stringify(json);
                    var controlOnly;

                    // find size of entire SVG from JSON
                    localStorage.SVGdimX = JSON.stringify(Object(json.params.width));
                    localStorage.SVGdimY = JSON.stringify(Object(json.params.height));


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
                        portX.push(myArray[1]);
                        portY.push(myArray[2]);
                        portRadius1.push(myArray[3]);
                        portRadius2.push(myArray[4]);
                        portArray.push(myArray.index);
                    }


                    // Store json variables to localStorage in form of JSON object...
                    localStorage.portXcoords = JSON.stringify(portX);
                    localStorage.portYcoords = JSON.stringify(portY);
                    localStorage.portRadius1vals = JSON.stringify(portRadius1);
                    localStorage.portRadius2vals = JSON.stringify(portRadius2);
                    //  Update number of Pumps for settings page
                    setNumberOfPumps_JSON();

                    //console.log("Port x coordinates from localStorage: " + JSON.parse(localStorage.getItem('portXcoords'))[1]);

                });

            }
        });

        return false;
    });
    $('#uploadForm2').submit(function () {
        // $("#status2").empty().text("File is uploading...");

        $(this).ajaxSubmit({

            error: function (xhr) {
                status('Error: ' + xhr.status);
            },
            success: function (response) {
                console.log(response);
                // $("#status2").empty().text(response);
                $("#status2").empty().text();
                var SVGbutton = document.getElementById("inputfile2");
                SVGbutton.style.backgroundColor = "#2ecc71";
                // refresh the page so that svg loads
                location.reload();

            }
        });
        return false;
    });
});

