/**
 * Created by kestas on 7/5/2016.
 */

function openMintEditorModal()
{
    (document.getElementById('mintEditorSettings_modal')).style.display = "block";
}

function closeMintEditorModal()
{
    (document.getElementById('mintEditorSettings_modal')).style.display = "none";
}

function saveEditorChanges()
{
    var THEME =  (document.getElementById('theme_selectID')).value;
    var SYNTAX = (document.getElementById('syntax_selectID')).value;
    var editor = ace.edit("MINT_editor");

    var theme_str = "ace/theme/" + THEME;
    var mode_str = "ace/mode/" + SYNTAX;

    editor.setTheme(theme_str);
    editor.getSession().setMode(mode_str);
}

function saveMintEditorSession()
{
    var MINT_EDITOR_SESSION = [];
    localStorage.MintEditorFileSize = editor.session.getLength();
    for (var i = 0; i < localStorage.MintEditorFileSize; i++)
    {
        var tempLine = editor.session.getLine(i);
        MINT_EDITOR_SESSION.push(tempLine);
    }
    localStorage.MINT_EDITOR_SESSION = JSON.stringify(MINT_EDITOR_SESSION);
}

function refreshMintEditorSession()
{
    for (var i = 0; i < localStorage.MintEditorFileSize; i++)
    {
        editor.session.replace({
            start: {row: i, column: 0},
            end: {row: i, column: Number.MAX_VALUE}
        }, JSON.parse(localStorage.MINT_EDITOR_SESSION)[i])
    }
}

function loadMintFromLocal()
{

}

function saveUploadedLFR()
{
    var lines = (localStorage.LFR_STRING).split("\n");
    localStorage.LFR_STRING_ARRAY = lines;
    
}

