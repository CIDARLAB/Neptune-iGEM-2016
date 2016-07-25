/**
 * Created by kestas on 7/18/2016.
 */

var LFR_form = document.getElementById('upload_specifyLFR');
var LFR_fileSelect = document.getElementById('selectfile_LFR');
var LFR_uploadButton = document.getElementById('uploadfile_LFR');


LFR_form.onsubmit = function(event) {
    event.preventDefault();
    LFR_uploadButton.innerHTML = 'Uploading...';

    var file = LFR_fileSelect.files[0];
    var formData = new FormData();

    formData.append('specifyLFR',file,'specifyLFR');

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/specify_LFR', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            // File(s) uploaded.
            pushFileToEditor(editor_specify,'specifyLFR',LFR_tab);
            localStorage.WORKFLOW_STAGE = 'specify';
            LFR_uploadButton.innerHTML = 'Uploaded';
            $.get('../uploads/Specify/specifyLFR.v',function(data)
            {
                // var Data = JSON.stringify(data);
                // var content = Data.split(/[\r\n]+/);
                var content = data.split(/[\r\n]+/);
                localStorage.FILE_specifyLFR = JSON.stringify(content);
            });
        } else {
            alert('File upload failed.');
        }
    };
    xhr.send(formData);
};

///////////////////////////////////////////////////////////

var UCF_form = document.getElementById('upload_specifyUCF');
var UCF_fileSelect = document.getElementById('selectfile_UCF');
var UCF_uploadButton = document.getElementById('uploadfile_UCF');

UCF_form.onsubmit = function(event) {
    event.preventDefault();
    UCF_uploadButton.innerHTML = 'Uploading...';

    var file = UCF_fileSelect.files[0];
    var formData = new FormData();

    formData.append('specifyUCF',file,'specifyUCF');

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/specify_UCF', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            // File(s) uploaded.
            localStorage.WORKFLOW_STAGE = 'specify';
            $.get('../uploads/Specify/specifyUCF.json',function(data)
            {
                // var Data = JSON.stringify(data);
                // var content = Data.split(/[\r\n]+/);
                var content = data.split(/[\r\n]+/);
                localStorage.FILE_specifyUCF = JSON.stringify(content);
            });
            pushFileToEditor(editor_specify,'specifyUCF',UCF_tab);
            UCF_uploadButton.innerHTML = 'Uploaded';
        } else {
            alert('File upload failed.');
        }
    };
    xhr.send(formData);
};

///////////////////////////////////////////////////////////

