/**
 * Created by kestas on 7/19/2016.
 */

var MINT_form = document.getElementById('upload_designMINT');
var MINT_fileSelect = document.getElementById('selectfile_MINT');
var MINT_uploadButton = document.getElementById('uploadfile_MINT');

MINT_form.onsubmit = function(event) {

    event.preventDefault();
    MINT_uploadButton.innerHTML = 'Uploading...';

    var file = MINT_fileSelect.files[0];
    var formData = new FormData();

    formData.append('designMINT',file,'designMINT');

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/design_MINT', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            // File(s) uploaded.
            pushFileToEditor(editor_design,'designMINT',MINT_tab);
            MINT_uploadButton.innerHTML = 'Uploaded';
        } else {
            alert('File upload failed.');
        }
    };
    xhr.send(formData);
};

///////////////////////////////////////////////////////////

var INI_form = document.getElementById('upload_designINI');
var INI_fileSelect = document.getElementById('selectfile_INI');
var INI_uploadButton = document.getElementById('uploadfile_INI');

INI_form.onsubmit = function(event) {
    event.preventDefault();
    INI_uploadButton.innerHTML = 'Uploading...';

    var file = INI_fileSelect.files[0];
    var formData = new FormData();

    formData.append('designINI',file,'designINI');

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/design_INI', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            // File(s) uploaded.
            pushFileToEditor(editor_design,'designINI',INI_tab);
            INI_uploadButton.innerHTML = 'Uploaded';
        } else {
            alert('File upload failed.');
        }
    };
    xhr.send(formData);
};