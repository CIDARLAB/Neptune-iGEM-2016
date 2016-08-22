///////////////////////////////////////////////////////////////////////////////////////////////////////////
//            The following uploads SHOULD have their contents saved to a LOCAL STORAGE ARRAY            //
//   x  LFR_start --> localStorage.LFR_start_STRING;                                                     //
//   x  LFR       --> localStorage.LFR_STRING;                                                           //
//   x  MINT      --> localStorage.MINT_STRING;                                                          //
//   x  UCF       --> localStorage.UCF_STRING                                                            //
//                                                                                                       //
//                    o = Needs to be Implemented    x = Implemented and Working                         //
///////////////////////////////////////////////////////////////////////////////////////////////////////////



//  NO LONGER USED




function loadButtons() {

    var fileOfChoice = "../uploads/Build_Verify/buildJSON.json";
    $.getJSON(fileOfChoice, function (json) {
        // console.log(JSON.stringify((json.layers[2]).name));

        // CONTROL LAYER ONLY
        if(((json.layers[1]).name) === "control")
        {
            controlOnly = JSON.stringify((json.layers[1]).features);
            console.log(controlOnly);
        }
        else if(((json.layers[2]).name) === "control")
        {
            controlOnly = JSON.stringify((json.layers[2]).features);
            console.log(controlOnly);
        }
        else if(((json.layers[0]).name) === "control")
        {
            controlOnly = JSON.stringify((json.layers[0]).features);
            console.log(controlOnly);
        }



        // FLOW LAYER ONLY
        if(((json.layers[1]).name) === "flow")
        {
            flowOnly = JSON.stringify((json.layers[1]).features);
            console.log(flowOnly);
        }
        else if(((json.layers[2]).name) === "flow")
        {
            flowOnly = JSON.stringify((json.layers[2]).features);
            console.log(flowOnly);
        }
        else if(((json.layers[0]).name) === "flow") {
            flowOnly = JSON.stringify((json.layers[0]).features);
            console.log(flowOnly);
        }
        

        // Use Json as a string
        var jsonString = JSON.stringify(json);
        // var controlOnly;

        // find size of entire SVG from JSON
        // localStorage.SVGdimX = JSON.stringify(Object(json.params.width));
        // console.log("width: " + JSON.stringify(Object(json.params.width)));
        // localStorage.SVGdimY = JSON.stringify(Object(json.params.height));
        // console.log("height: " + JSON.stringify(Object(json.params.height)));

        // controlOnly = JSON.stringify((json.layers[2]).features);

        console.log("control only: " + controlOnly);

        // Now look for all Port in the control layer only
        var Re = /Port.+?\[(.+?),(.+?)\].+?/g;
        var myArray;
        var portArray = [];
        var portX = [];
        var portY = [];
        // var portRadius1 = [];


        while ((myArray = Re.exec(controlOnly)) !== null) {
            portX.push(myArray[1]);
            portY.push(myArray[2]);
            portArray.push(myArray.index);
        }

        // Store json variables to localStorage in form of JSON object...
        localStorage.portXcoords = JSON.stringify(portX);
        localStorage.portYcoords = JSON.stringify(portY);
        // localStorage.portRadius1vals = JSON.stringify(portRadius1);
        // localStorage.portRadius2vals = JSON.stringify(portRadius2);
        //  Update number of Pumps for settings page
        setNumberOfPumps_JSON();
        // clearPumpData();


        // Display JSON via 3DuF
        var result = json;
        Registry.viewManager.loadDeviceFromJSON(result);
    });
    // location.reload();
};



$(document).ready(function () {

    $('#uploadForm').submit(function () {
        // $("#status").empty().text("File is uploading...");
    
        $(this).ajaxSubmit({
    
            error: function (xhr) {
                status('Error: ' + xhr.status);
            },
            success: function (response) {
    
                toastr.success('Your JSON File was uploaded successfully!');
    
                console.log(response);
    
    
                // $("#status").empty().text(response);
                $("#status").empty().text();
                var JSONbutton = document.getElementById("inputfile_JSON");
                JSONbutton.style.backgroundColor = "#2ecc71";
                loadButtons();
            }
        });
        // location.reload();
        return false;
    });
    
    
    
    $('#uploadForm2').submit(function () {

        toastr.success('Your SVG File was uploaded successfully!');

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
                // location.reload();
            }
        });
        return false;
    });
});

