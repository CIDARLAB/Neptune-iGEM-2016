/**
 * Created by kestas on 7/19/2016.
 */

var chartreuse = 'chartreuse';
// THIS SCRIPT IS  FOR CONTROLLING THE ACTION CENTER
// THE GENERAL USE CASE IS AS SFOLLOWS:
// - User must "commit" both files before they can press compile/translate
// - When user hits commit, cooresponding file is locked in editor, editor contents are saved, button color changes
// - When user hits commit for both buttons, compile button unlocks.


function commitLFR(EDITOR){
    if ((document.getElementById('commit_LFR')).style.backgroundColor == chartreuse) // FILE IS ALREADY COMMITED -- UNDO COMMIT
    {
        (document.getElementById('commit_LFR')).style.backgroundColor = '';
        localStorage.lfr_state = 'write';
        EDITOR.setReadOnly(false);
        lock_translate();
        (document.getElementById('upload_specifyLFR')).elements["uploadfile_LFR"].disabled = false;
    }
    else // FILE IS NOT COMMITED -- COMMIT
    {
        var LFR_FILE = localStorage.FILE_specifyLFR;
        (document.getElementById('commit_LFR')).style.backgroundColor = chartreuse;

        if ((document.getElementById('commit_UCF')).style.backgroundColor == chartreuse)
        {
            unlock_translate();
        }
        localStorage.lfr_state = 'readOnly';
        EDITOR.setReadOnly(true);
        (document.getElementById('upload_specifyLFR')).elements["uploadfile_LFR"].disabled = true;
    }
}

function commitUCF(EDITOR){
    if ((document.getElementById('commit_UCF')).style.backgroundColor == chartreuse) // FILE IS ALREADY COMMITED -- UNDO COMMIT
    {
        (document.getElementById('commit_UCF')).style.backgroundColor = '';
        localStorage.ucf_state = 'write';
        EDITOR.setReadOnly(false);
        lock_translate();
        (document.getElementById('upload_specifyUCF')).elements["uploadfile_UCF"].disabled = false;
    }
    else // FILE IS NOT COMMITED -- COMMIT
    {
        var UCF_FILE = localStorage.FILE_specifyUCF;
        (document.getElementById('commit_UCF')).style.backgroundColor = chartreuse;

        if ((document.getElementById('commit_LFR')).style.backgroundColor == chartreuse)
        {
            unlock_translate();
        }
        localStorage.ucf_state = 'readOnly';
        EDITOR.setReadOnly(true);
        (document.getElementById('upload_specifyUCF')).elements["uploadfile_UCF"].disabled = true;
    }
}

function commitMINT(EDITOR){
    if ((document.getElementById('commit_MINT')).style.backgroundColor == chartreuse) // FILE IS ALREADY COMMITED -- UNDO COMMIT
    {
        (document.getElementById('commit_MINT')).style.backgroundColor = '';
        localStorage.mint_state = 'write';
        EDITOR.setReadOnly(false);
        lock_compile();
        (document.getElementById('upload_designMINT')).elements["uploadfile_MINT"].disabled = false;
    }
    else // FILE IS NOT COMMITED -- COMMIT
    {
        var MINT_FILE = localStorage.FILE_designMINT;
        (document.getElementById('commit_MINT')).style.backgroundColor = chartreuse;

        if ((document.getElementById('commit_INI')).style.backgroundColor == chartreuse)
        {
            unlock_compile();
        }
        localStorage.mint_state = 'readOnly';
        EDITOR.setReadOnly(true);
        (document.getElementById('upload_designMINT')).elements["uploadfile_MINT"].disabled = true;
    }
}

function commitINI(EDITOR){
    if ((document.getElementById('commit_INI')).style.backgroundColor == chartreuse) // FILE IS ALREADY COMMITED -- UNDO COMMIT
    {
        (document.getElementById('commit_INI')).style.backgroundColor = '';
        localStorage.ini_state = 'write';
        EDITOR.setReadOnly(false);
        lock_compile();
        (document.getElementById('upload_designINI')).elements["uploadfile_INI"].disabled = false;
    }
    else // FILE IS NOT COMMITED -- COMMIT
    {
        var INI_FILE = localStorage.FILE_designINI;
        (document.getElementById('commit_INI')).style.backgroundColor = chartreuse;

        if ((document.getElementById('commit_MINT')).style.backgroundColor == chartreuse)
        {
            unlock_compile();
        }
        localStorage.ini_state = 'readOnly';
        EDITOR.setReadOnly(true);
        (document.getElementById('upload_designINI')).elements["uploadfile_INI"].disabled = true;
    }
}

function unlock_translate()
{
    (document.getElementById('translate_btnn')).style.boxShadow = '0 0 1em gold';
    (document.getElementById('translate_btnn')).disabled = false;
}
function lock_translate()
{
    (document.getElementById('translate_btnn')).style.boxShadow = '';
    (document.getElementById('translate_btnn')).disabled = true
}
function unlock_compile()
{
    (document.getElementById('compile_btnn')).style.boxShadow = '0 0 1em gold';
    (document.getElementById('compile_btnn')).disabled = false;
}
function lock_compile()
{
    (document.getElementById('compile_btnn')).style.boxShadow = '';
    (document.getElementById('compile_btnn')).disabled = true;
}