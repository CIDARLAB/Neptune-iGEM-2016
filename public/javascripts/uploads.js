/**
 * Created by kestas on 7/18/2016.
 */

var form = document.getElementById('upload_specifyLFR');
var fileSelect = document.getElementById('selectfile_LFR');
var uploadButton = document.getElementById('uploadfile_LFR');

form.onsubmit = function(event) {
    event.preventDefault();
    uploadButton.innerHTML = 'Uploading...';

    var file = fileSelect.files[0];
    var formData = new FormData();
    
    formData.append('specifyLFR',file,'specifyLFR');

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/specify_LFR', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            // File(s) uploaded.
            uploadButton.innerHTML = 'Uploaded';
        } else {
            alert('An error occurred!');
        }
    };
    xhr.send(formData);
};