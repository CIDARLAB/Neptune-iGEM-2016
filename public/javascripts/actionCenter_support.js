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
    }
}

function commitUCF(EDITOR){
    if ((document.getElementById('commit_UCF')).style.backgroundColor == chartreuse) // FILE IS ALREADY COMMITED -- UNDO COMMIT
    {
        (document.getElementById('commit_UCF')).style.backgroundColor = '';
        localStorage.ucf_state = 'write';
        EDITOR.setReadOnly(false);
        lock_translate();
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
    }
}

function commitMINT(EDITOR){
    if ((document.getElementById('commit_MINT')).style.backgroundColor == chartreuse) // FILE IS ALREADY COMMITED -- UNDO COMMIT
    {
        (document.getElementById('commit_MINT')).style.backgroundColor = '';
        localStorage.mint_state = 'write';
        EDITOR.setReadOnly(false);
        lock_compile();
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
    }
}

function commitINI(EDITOR){
    if ((document.getElementById('commit_INI')).style.backgroundColor == chartreuse) // FILE IS ALREADY COMMITED -- UNDO COMMIT
    {
        (document.getElementById('commit_INI')).style.backgroundColor = '';
        localStorage.ini_state = 'write';
        EDITOR.setReadOnly(false);
        lock_compile();
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
    }
}
// function commitUCF(EDITOR){
//     if ((document.getElementById('commit_LFR')).style.backgroundColor == chartreuse)
//     {
//         var LFR_FILE = localStorage.FILE_specifyUCF;
//         (document.getElementById('commit_UCF')).style.backgroundColor = '';
//
//         if ((document.getElementById('commit_LFR')).style.backgroundColor == chartreuse)
//         {
//             unlock_translate();
//         }
//         localStorage.ucf_state = 'readOnly';
//         EDITOR.setReadOnly(true);
//         lock_translate();
//     }
//     else
//     {
//         (document.getElementById('commit_UCF')).style.backgroundColor = '';
//         localStorage.ucf_state = 'write';
//         EDITOR.setReadOnly(false)
//     }
// }
//
// function commitMINT(EDITOR){
//     if ((document.getElementById('commit_INI')).style.backgroundColor == chartreuse)
//     {
//         var LFR_FILE = localStorage.FILE_designMINT;
//         (document.getElementById('commit_MINT')).style.backgroundColor = chartreuse;
//
//         if ((document.getElementById('commit_INI')).style.backgroundColor == chartreuse)
//         {
//             unlock_compile();
//         }
//         localStorage.mint_state = 'readOnly';
//         EDITOR.setReadOnly(true);
//         lock_compile();
//     }
//     else
//     {
//         (document.getElementById('commit_MINT')).style.backgroundColor = '';
//         localStorage.mint_state = 'write';
//         EDITOR.setReadOnly(false);
//     }
// }
//
// function commitINI(EDITOR){
//     if ((document.getElementById('commit_MINT')).style.backgroundColor == chartreuse)
//     {
//         var LFR_FILE = localStorage.FILE_designINI;
//         (document.getElementById('commit_INI')).style.backgroundColor = chartreuse;
//
//         if ((document.getElementById('commit_MINT')).style.backgroundColor == chartreuse)
//         {
//             unlock_compile();
//         }
//         localStorage.ini_state = 'readOnly';
//         EDITOR.setReadOnly(true);
//         lock_compile();
//     }
//     else
//     {
//         (document.getElementById('commit_INI')).style.backgroundColor = chartreuse;
//         localStorage.ini_state = 'write';
//         EDITOR.setReadOnly(false);
//     }
// }

function unlock_translate()
{
    (document.getElementById('translate_btn')).style.backgroundColor = 'forestgreen';
}
function lock_translate()
{
    (document.getElementById('translate_btn')).style.backgroundColor = '';
}
function unlock_compile()
{
    (document.getElementById('compile_btn')).style.backgroundColor = 'forestgreen';
}
function lock_compile()
{
    (document.getElementById('compile_btn')).style.backgroundColor = '';
}