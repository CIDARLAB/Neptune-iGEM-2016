/**
 * Created by kestas on 7/8/2016.
 */

function fill_editor(File_To_Fill_Editor_With,Editor_To_Fill)
{
    // Clear Editor before adding our file 
    Editor_To_Fill.session.setValue('');
    
    // We'll fill the editor line-by-line, so we needa know how many lines we're adding
    var file_size = File_To_Fill_Editor_With.length;
    
    
    for (var i = 0; i < file_size; i++)
    {
        Editor_To_Fill.session.replace({
            start: {row: i, column: 0},
            end: {row: i, column: Number.MAX_VALUE}
        }, File_To_Fill_Editor_With[i] + '\n')
    }
}

function pushFileToEditor(Editor_To_Push_Toward,FILE_TYPE)
{
    var CONTENT_TO_PUSH = [];
    switch(FILE_TYPE)
    {
        case 'LFR_start':
            $.get('../uploads/Specify/myLFR_start.txt',function(data)
            {
                CONTENT_TO_PUSH = data.split("\n");
                fill_editor(CONTENT_TO_PUSH,Editor_To_Push_Toward);
            });
            //CONTENT_TO_PUSH = JSON.parse(localStorage.LFR_start_STRING);
            break;
        case 'LFR':
            $.get('../uploads/Design/myLFR.txt',function(data)
            {
                CONTENT_TO_PUSH = data.split("\n");
                fill_editor(CONTENT_TO_PUSH,Editor_To_Push_Toward);
            });
            //CONTENT_TO_PUSH = JSON.parse(localStorage.LFR_STRING);
            break;
        case 'MINT':
            $.get('../uploads/Design/myMINT.txt',function(data)
            {
                CONTENT_TO_PUSH = data.split("\n");
                fill_editor(CONTENT_TO_PUSH,Editor_To_Push_Toward);
            });
            //CONTENT_TO_PUSH = JSON.parse(localStorage.MINT_STRING);
            break;
        case 'UCF':
            $.get('../uploads/Design/myUCF.json',function(data)
            {
                CONTENT_TO_PUSH = data.split("\n");
                fill_editor(CONTENT_TO_PUSH,Editor_To_Push_Toward);
            });
            //CONTENT_TO_PUSH = JSON.parse(localStorage.UCF_STRING);
            break;
    }
}

function refreshEditor(File_To_Fill_Editor_With, Editor_To_Refresh)
{
    fill_editor(File_To_Fill_Editor_With, Editor_To_Refresh);
}

function saveEditorContent(Editor_To_Save_Content,FILE_TYPE)
{
    var EDITOR_SESSION = [];
    var file_size = Editor_To_Save_Content.session.getLength();
    for (var i = 0; i < file_size; i++)
    {
        var tempLine = Editor_To_Save_Content.session.getLine(i);
        EDITOR_SESSION.push(tempLine);
    }
    switch(FILE_TYPE)
    {
        case 'LFR_start':
            localStorage.LFR_start_STRING =  JSON.stringify(EDITOR_SESSION);
            break;
        case 'LFR':
            localStorage.LFR_STRING =  JSON.stringify(EDITOR_SESSION);
            break;
        case 'MINT':
            localStorage.MINT_STRING =  JSON.stringify(EDITOR_SESSION);
            break;
        case 'UCF':
            localStorage.UCF_STRING =  JSON.stringify(EDITOR_SESSION);
            break;
    }

}

function saveEditorOptions(Editor_To_Update,theme_ID,syntax_ID,fontSize_ID,fontFamily_ID)
{
    var THEME =  (document.getElementById(theme_ID)).value;
    var SYNTAX = (document.getElementById(syntax_ID)).value;
    var FONT_SIZE =  (document.getElementById(fontSize_ID)).value;
    var FONT_FAMILY = (document.getElementById(fontFamily_ID)).value;
    var editor = ace.edit(Editor_To_Update);

    var theme_str = "ace/theme/" + THEME;
    var mode_str = "ace/mode/" + SYNTAX;


    editor.setTheme(theme_str);
    editor.getSession().setMode(mode_str);
    editor.setOptions({
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE
    });
}

function downloadFile(File_Type,File_Name)
{
    var string_to_write = '';
    var file_name = File_Name;
    switch(File_Type)
    {
        case 'LFR File (Specify)':
            string_to_write = localStorage.LFR_start_STRING;
            break;
        case 'UCF File (Specify)':
            break;
        case 'LFR File (Design)':
            string_to_write = localStorage.LFR_STRING;
            break;
        case 'UCF File (Design)':
            string_to_write = localStorage.UCF_STRING;
            break;
        case 'MINT File (Design)':
            string_to_write = localStorage.MINT_STRING;
            break;
        case 'JSON File (Build)':
            break;
        case 'SVG File (Build)':
            break;
    }

    $.post("/api/writeToFile",{fileData: string_to_write});
    //window.open('../public/downloads/test.txt');
    uriContent = "data:application/octet-stream," + encodeURIComponent(string_to_write);
    newWindow = window.open(uriContent, 'New Document');
}

function openDownloadModal()
{
    (document.getElementById('download_modal')).style.display = "block";
}
function closeDownloadModal()
{
    (document.getElementById('download_modal')).style.display = "none";
}

    // $.ajax({
    //     type: 'POST'
    //     //action: '/api/writeToFile' ,
    //     //url: url, //url of receiver file on server
    //     //data: data //your data
    //     //success: success, //callback when ajax request finishes
    //     //dataType: dataType //text/json...
    // });


    // $.post(url, myText, function(data){
    //     console.log('response from the callback function: '+ data);
    // }).fail(function(jqXHR){
    //     alert(jqXHR.status +' '+jqXHR.statusText+ ' $.post failed!');
    // });
