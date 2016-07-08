/**
 * Created by kestas on 7/5/2016.
 */
if (localStorage.firstVisitLfr == true || localStorage.firstVisitLfr == undefined )
{

    localStorage.LFR_start_THEME = 'monokai';
    localStorage.LFR_start_SYNTAX = 'mint';
    localStorage.LFR_start_FONT_SIZE = '';
    localStorage.LFR_start_FONT_FAMILY = '';

    // LFR_start_STRING represents our internal storage of the LFR file the user uploaded. 
    // By default, when the user first loads the program, this string below is their initial 
    // LFR file; it is displayed in the editor as a welcome message. 
    // When the user loads a new LFR file, or if the user edits the file in the editor, this 
    // variable will be modified to reflect the contents of their new file. 
    
    // More so, when we "fill" the editor with content, this content is pulled directly from
    // this string. So in effect, this string is our internal representation of the users LFR_start file.
    var LFR_start_STRING = []; 
        LFR_start_STRING[0] = 'Welcome to the LFR editor!';
        LFR_start_STRING[1] = 'You can begin designing a new microfluidic';
        LFR_start_STRING[2] = 'device here by creating a new LFR file.';
        LFR_start_STRING[3] = '\n';
        LFR_start_STRING[4] = 'Or, you can upload a LFR file that you have';
        LFR_start_STRING[5] = 'been working on, and finish it here.';
        LFR_start_STRING[6] = '\n';
        LFR_start_STRING[7] = 'Once you are done, you can save your changes';
        LFR_start_STRING[8] = 'and push your LFR file to the DESIGN portion';
        LFR_start_STRING[9] = 'of the workflow, where the LFR file will be';
        LFR_start_STRING[10] = 'compiled into a MINT file.';
    localStorage.LFR_start_STRING = JSON.stringify(LFR_start_STRING);
    fill_editor(LFR_start_STRING,LFR_start_editor);
    
    localStorage.firstVisitLfr = false;
}
else
{}


// THIS FUNCTION IS USED TO WRITE TO THE EDITOR 
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
