/**
 * Created by rebeccawolf on 7/26/16.
 */

function loadButtons() {

    var fileOfChoice = "../uploads/Build_Verify/buildJSON.json";
    $.getJSON(fileOfChoice, function (json) {
        for(var i = 0; i < json.layers.length; i++){
            if(((json.layers[i]).name) === "control") {
                controlOnly = JSON.stringify((json.layers[i]).features);
            }
            if(((json.layers[i]).name) === "flow"){
                flowOnly = JSON.stringify((json.layers[i]).features);
            }
        }

        // Use Json as a string
        var jsonString = JSON.stringify(json);

        // Now look for all Port in the control layer only
        var Re = /Port.+?\[(.+?),(.+?)\].+?/g;
        var myArray;
        var portArray = [];
        var portX = [];
        var portY = [];

        // look through control layer for ports
        while ((myArray = Re.exec(controlOnly)) !== null) {
            portX.push(myArray[1]);
            // console.log("should be x coord: " + myArray[1]);
            portY.push(myArray[2]);
            portArray.push(myArray.index);
        }

        // Store json variables to localStorage in form of JSON object...
        localStorage.portXcoords = JSON.stringify(portX);
        localStorage.portYcoords = JSON.stringify(portY);

        //  Update number of Pumps for settings page
        if(localStorage.pumpsInitial == "TRUE") {
            setNumberOfPumps_JSON();
        }
        
        // Now look for all Ports (Dispensers) in the control layer only
        var myArrayDisp;
        var portArrayDisp = [];
        var portXDisp = [];
        var portYDisp = [];

        // look through flow layer for ports
        while ((myArrayDisp = Re.exec(flowOnly)) !== null) {
            portXDisp.push(myArrayDisp[1]);
            // console.log("should be x coord in flow layer: " + myArrayDisp[1]);
            portYDisp.push(myArrayDisp[2]);
            portArrayDisp.push(myArrayDisp.index);
        }
        
        // Store json variables to localStorage in form of JSON object...
        localStorage.portXcoordsDisp = JSON.stringify(portXDisp);
        localStorage.portYcoordsDisp = JSON.stringify(portYDisp);

        //  Update number of Dispensers for settings page
        if (localStorage.initialDispensers == "TRUE") {
            setNumberOfDispensers_JSON();
        }

        // Display JSON via 3DuF
        // var result = json;
        // Registry.viewManager.loadDeviceFromJSON(result);
    });
    // location.reload();
};





var JSON_form = document.getElementById('upload_buildJSON');
var JSON_fileSelect = document.getElementById('selectfile_JSON');
var JSON_uploadButton = document.getElementById('uploadfile_JSON');

JSON_form.onsubmit = function(event) {

    event.preventDefault();
    JSON_uploadButton.innerHTML = 'Uploading...';

    var file = JSON_fileSelect.files[0];
    var formData = new FormData();

    formData.append('buildJSON',file,'buildJSON');

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/build_JSON', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            // File(s) uploaded.
            localStorage.WORKFLOW_STAGE = 'build';
            $.get('../uploads/Build_Verify/buildJSON.json',function(data)
            {
                var string = data + '';
                var content = string.split(/[\r\n]+/);
                localStorage.FILE_designMINT = JSON.stringify(content);

            });
            loadButtons();
            // location.reload();
            JSON_uploadButton.innerHTML = 'Uploaded';
        } else {
            alert('File upload failed.');
        }
    };
    xhr.send(formData);
};