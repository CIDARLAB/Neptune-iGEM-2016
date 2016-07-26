/**
 * Created by rebeccawolf on 7/26/16.
 */

function loadButtons() {

    var fileOfChoice = "../uploads/Build_Verify/buildJSON.json";
    $.getJSON(fileOfChoice, function (json) {
        // console.log(JSON.stringify((json.layers[2]).name));

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

        // Use Json as a string
        var jsonString = JSON.stringify(json);

        // find size of entire SVG from JSON
        localStorage.SVGdimX = JSON.stringify(Object(json.params.width));
        console.log("width: " + JSON.stringify(Object(json.params.width)));
        localStorage.SVGdimY = JSON.stringify(Object(json.params.height));
        console.log("height: " + JSON.stringify(Object(json.params.height)));

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
            // console.log("should be x coord: " + myArray[1]);
            portY.push(myArray[2]);

            portArray.push(myArray.index);
        }

        // Store json variables to localStorage in form of JSON object...
        localStorage.portXcoords = JSON.stringify(portX);
        localStorage.portYcoords = JSON.stringify(portY);

        //  Update number of Pumps for settings page
        setNumberOfPumps_JSON();
        // clearPumpData();


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
            location.reload();
            JSON_uploadButton.innerHTML = 'Uploaded';
        } else {
            alert('File upload failed.');
        }
    };
    xhr.send(formData);
};