/**
 * Created by kestas on 7/8/2016.
 */

function popToast(CASE)
{
    switch (CASE)
    {
        case 'LFR _upload_s':
            toastr.success('LFR file upload successful');
            break;
        case 'LFR_upload_f':
            break;
        case 'UCF _upload_s':
            break;
        case 'UCF_upload_f':
            break;
        case 'MINT _upload_s':
            break;
        case 'MINT_upload_f':
            break;
        case 'INI _upload_s':
            break;
        case 'INI_upload_f':
            break;
        case 'SVG _upload_s':
            break;
        case 'SVG_upload_f':
            break;
        case 'JSON _upload_s':
            break;
        case 'JSON_upload_f':
            break;
    }
}

function displayFileContent(File_To_Display)
{
    var string_to_display = '';
    var title = '';

    switch (File_To_Display)
    {
        case 'specifyLFR':
            localStorage.display_file_modal_state = 'specifyLFR';
            localStorage.display_file_modal_name = 'Specify LFR';
            string_to_display = localStorage.FILE_specifyLFR;
            title = 'LFR Preview';
            break;
        case 'specifyUCF':
            localStorage.display_file_modal_state = 'specifyUCF';
            localStorage.display_file_modal_name = 'Specify_UCF';
            string_to_display = localStorage.FILE_specifyUCF;
            title = 'UCF Preview';
            break;
        case 'designMINT':
            localStorage.display_file_modal_state = 'designMINT';
            localStorage.display_file_modal_name = 'Design_MINT';
            string_to_display = localStorage.FILE_designMINT;
            title = 'MINT Preview';
            break;
        case 'designINI':
            localStorage.display_file_modal_state = 'designINI';
            localStorage.display_file_modal_name = 'Design_INI';
            string_to_display = localStorage.FILE_designINI;
            title = 'INI Preview';
            break;
        case 'buildSVG':
            localStorage.display_file_modal_state = 'buildSVG';
            localStorage.display_file_modal_name = 'Build_SVG';
            string_to_display = localStorage.FILE_buildSVG;
            title = 'SVG Preview';
            break;
        case 'buildJSON':
            localStorage.display_file_modal_state = 'buildJSON';
            localStorage.display_file_modal_name = 'Build_JSON';
            string_to_display = localStorage.FILE_buildJSON;
            title = 'JSON Preview';
            break;

    }
    var dataArray = JSON.parse(string_to_display);
    $('#myModalLabel').append(title);
    for (var i = 0; i < dataArray.length; i++)
    {
        $('#fileGoesHere').append(dataArray[i] + '<br>');
    }
    //$('#fileGoesHere').text(string_to_display);
}

function clearPreviewModalContent() 
{
    $('#fileGoesHere').empty();
    $('#myModalLabel').empty();
}

function changeSpecifyTabs(Editor,Tab_To_Switch_To,SessionArray)
{
    switch (Tab_To_Switch_To)
    {
        case 'LFRtab':
            document.getElementById('LFRtab').className = 'active';
            document.getElementById('UCFtab').className = '';
            localStorage.specify_editor_state = 'specifyLFR';
            Editor.setSession(SessionArray[0]);
            if (localStorage.lfr_state == 'write')
            {
                Editor.setReadOnly(false);
            }
            else 
            {
                Editor.setReadOnly(true);
            }
            break;
        case 'UCFtab':
            document.getElementById('LFRtab').className = '';
            document.getElementById('UCFtab').className = 'active';
            localStorage.specify_editor_state = 'specifyUCF';
            Editor.setSession(SessionArray[1]);
            if (localStorage.ucf_state == 'write')
            {
                Editor.setReadOnly(false);
            }
            else
            {
                Editor.setReadOnly(true);
            }
            break;
    }
}

function changeDesignTabs(Editor,Tab_To_Switch_To,SessionArray)
{
    switch (Tab_To_Switch_To)
    {
        case 'MINTtab':
            document.getElementById('INItab').className = '';
            document.getElementById('MINTtab').className = 'active';
            localStorage.design_editor_state = 'designMINT';
            Editor.setSession(SessionArray[0]);
            if (localStorage.mint_state == 'write')
            {
                Editor.setReadOnly(false);
            }
            else
            {
                Editor.setReadOnly(true);
            }
            break;
        case 'INItab':
            document.getElementById('INItab').className = 'active';
            document.getElementById('MINTtab').className = '';
            localStorage.design_editor_state = 'designINI';
            Editor.setSession(SessionArray[1]);
            if (localStorage.ini_state == 'write')
            {
                Editor.setReadOnly(false);
            }
            else
            {
                Editor.setReadOnly(true);
            }
            break;
    }
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
        case 'specifyLFR':
            localStorage.FILE_specifyLFR =  JSON.stringify(EDITOR_SESSION);
            break;
        case 'specifyUCF':
            localStorage.FILE_specifyUCF =  JSON.stringify(EDITOR_SESSION);
            break;
        case 'designINI':
            localStorage.FILE_designINI =  JSON.stringify(EDITOR_SESSION);
            break;
        case 'designMINT':// Fix
            localStorage.FILE_designMINT =  JSON.stringify(EDITOR_SESSION);
            break;
    }
}

function downloadFile(File_Name,FILE_TYPE)
{
    // IMPLEMENT AUTO SAVE BEFORE DOWNLOAD!
    // ALSO LOOK INTO res.download!

    var string_to_write = '';
    var file_name = File_Name; // NOTE: File_Name argument is overwritten internally, for now
    switch(FILE_TYPE)
    {
        case 'specifyLFR':
            string_to_write = localStorage.FILE_specifyLFR;
            file_name = 'specifyLFR';
            break;
        case 'specifyUCF':
            string_to_write = localStorage.FILE_specifyUCF;
            file_name = 'specifyUCF';
            break;
        case 'designINI':
            string_to_write = localStorage.FILE_designINI;
            file_name = 'designINI';
            break;
        case 'designMINT':
            string_to_write = localStorage.FILE_designMINT;
            file_name = 'designMINT';
            break;
        case 'MINT File (Design)':
            string_to_write = localStorage.MINT_STRING;
            break;
        case 'JSON File (Build)':
            break;
        case 'SVG File (Build)':
            break;
    }

    //$.post("/api/writeToFile",{fileData: string_to_write});

    var w = window.open();
    var html = JSON.parse(string_to_write);
    for (var i = 0; i < html.length; i++) {
        $(w.document.body).append(html[i] + '<br>');
    }

}

function fill_editor(File_To_Fill_Editor_With,Editor_To_Fill,session)
{
    // Clear Editor before adding our file 
    Editor_To_Fill.setSession(session);
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

function pushFileToEditor(Editor_To_Push_Toward,FILE_TYPE,session)
{
    var CONTENT_TO_PUSH = [];
    switch(FILE_TYPE)
    {
        case 'specifyLFR':
            $.get('../uploads/Specify/specifyLFR.txt',function(data)
            {
                CONTENT_TO_PUSH = data.split("\n");
                fill_editor(CONTENT_TO_PUSH,Editor_To_Push_Toward,session);

                document.getElementById('LFRtab').className = 'active';
                document.getElementById('UCFtab').className = '';
            });
            //CONTENT_TO_PUSH = JSON.parse(localStorage.LFR_start_STRING);
            break;
        case 'specifyUCF':
            $.get('../uploads/Specify/specifyUCF.txt',function(data)
            {
                CONTENT_TO_PUSH = data.split("\n");
                fill_editor(CONTENT_TO_PUSH,Editor_To_Push_Toward,session);

                document.getElementById('LFRtab').className = '';
                document.getElementById('UCFtab').className = 'active';
            });
            //CONTENT_TO_PUSH = JSON.parse(localStorage.LFR_STRING);
            break;
        case 'designINI':
            $.get('../uploads/Design/designINI.txt',function(data)
            {
                CONTENT_TO_PUSH = data.split("\n");
                fill_editor(CONTENT_TO_PUSH,Editor_To_Push_Toward,session);

                document.getElementById('INItab').className = 'active';
                document.getElementById('MINTtab').className = '';
            });
            //CONTENT_TO_PUSH = JSON.parse(localStorage.MINT_STRING);
            break;
        case 'designMINT':
            $.get('../uploads/Design/designMINT.txt',function(data)
            {
                CONTENT_TO_PUSH = data.split("\n");
                fill_editor(CONTENT_TO_PUSH,Editor_To_Push_Toward,session);

                document.getElementById('INItab').className = '';
                document.getElementById('MINTtab').className = 'active';
            });
            //CONTENT_TO_PUSH = JSON.parse(localStorage.UCF_STRING);
            break;
    }
}

function refreshEditor(Editor_To_Refresh, File_To_Fill_Editor_With)
{
    var file = [];
    switch (File_To_Fill_Editor_With)
    {
        case 'specifyLFR':
            file = JSON.parse(localStorage.FILE_specifyLFR);
            break;
        case 'specifyUCF':
            file = JSON.parse(localStorage.FILE_specifyUCF);
            break;
        case 'designMINT':
            file = JSON.parse(localStorage.FILE_designMINT);
            break;
        case 'designINI':
            file = JSON.parse(localStorage.FILE_designINI);
            break;
    }
    fill_editor(file, Editor_To_Refresh);
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

function openDownloadModal()
{
    (document.getElementById('download_modal')).style.display = "block";
}

function closeDownloadModal()
{
    (document.getElementById('download_modal')).style.display = "none";
}

