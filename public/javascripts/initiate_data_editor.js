/**
 * Created by kestas on 7/5/2016.
 */
if (localStorage.firstVisitUshroom == true || localStorage.firstVisitUshroom == undefined )
{
    
    localStorage.THEME = 'monokai';
    localStorage.SYNTAX = 'mint';
    localStorage.FONT_SIZE = '';
    localStorage.FONT_FAMILY = '';
    
    localStorage.LFR_STRING_ARRAY = [];
    localStorage.MINT_EDITOR_SESSION = [];
    localStorage.firstVisitUshroom = false;
}
else
{
    // editor.session.setValue('');
    // for (var i = 0; i < localStorage.MintEditorFileSize; i++)
    // {
    //     editor.session.replace({
    //         start: {row: i, column: 0},
    //         end: {row: i, column: Number.MAX_VALUE}
    //     }, JSON.parse(localStorage.MINT_EDITOR_SESSION)[i])
    // }
}