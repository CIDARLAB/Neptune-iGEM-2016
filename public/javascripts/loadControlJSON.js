/**
 * Created by rebeccawolf on 10/5/16.
 */
// SET JSON TO LOAD TO 3DuF AND VALVES/DISPENSERS
if (localStorage.JSONloaded != "true") {
    var defaultJSON = {"name":"My Device","params":{"width":75800,"height":51000},"layers":[{"name":"flow","color":"indigo","params":{"z_offset":0,"flip":false},"features":{}},{"name":"control","color":"red","params":{"z_offset":1200,"flip":true},"features":{}}],"groups":[]};
    $(document).ready(function() {
        //document.getElementById("json_in").value = localStorage.JSON_CONTROL;-->
        $('#findJSON').modal('show');
    });
    // Reference for the html input element
    var inputElement = document.getElementById("JSONinput");
    // on change run the 'handleFiles' method
    inputElement.addEventListener("change", handleFiles, false);
    function handleFiles() {
        var file = this.files[0]; /* now you can work with the file list */

        console.log(file.name); /* logged the filename */
        console.log(file.size); /* logged the filesize  */
        reader.readAsText(file); /* this will make sense in a bit */

    }
    var reader = new FileReader();
    reader.onload = function (e) {
        console.log(reader.result);
        /* Do something with the read reader.result */
        var JSONstring = reader.result;
        localStorage.setItem('JSONtoLoad', JSONstring);
        localStorage.setItem('JSONloaded', 'true');
    }
}
else {
    console.log("got to else statement.");
    var defaultJSON = JSON.parse(localStorage.getItem('JSONtoLoad'));
}