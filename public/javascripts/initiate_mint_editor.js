/**
 * Created by kestas on 7/5/2016.
 */
/**
 * Created by kestas on 7/5/2016.
 */
if (localStorage.firstVisituShroom == true || localStorage.firstVisituShroom == undefined )
{

    localStorage.MINT_THEME = 'monokai';
    localStorage.MINT_SYNTAX = 'mint';
    localStorage.MINT_FONT_SIZE = '';
    localStorage.MINT_FONT_FAMILY = '';

    // LFR_start_STRING represents our internal storage of the LFR file the user uploaded.
    // By default, when the user first loads the program, this string below is their initial
    // LFR file; it is displayed in the editor as a welcome message.
    // When the user loads a new LFR file, or if the user edits the file in the editor, this
    // variable will be modified to reflect the contents of their new file.

    // More so, when we "fill" the editor with content, this content is pulled directly from
    // this string. So in effect, this string is our internal representation of the users LFR_start file.
    var MINT_STRING = [];
        MINT_STRING[0] = 'Welcome to the MINT editor!';
        MINT_STRING[1] = 'Upload an LFR file and hit COMPILE,';
        MINT_STRING[2] = 'and our program will generate and load';
        MINT_STRING[3] = 'a MINT file into this editor for you.';
        MINT_STRING[4] = '\n';
        MINT_STRING[5] = 'You can fine tune your microfluidic design';
        MINT_STRING[6] = 'by changing MINT parameters in this editor.';
        MINT_STRING[7] = '\n';
        MINT_STRING[8] = 'Once you are done, you can save your MINT';
        MINT_STRING[9] = 'file and hit PLACE AND ROUTE to generate a';
        MINT_STRING[10] = 'design schematic of your device.';
        MINT_STRING[11] = '\n';
        MINT_STRING[12] = 'These design schematics are represented by';
        MINT_STRING[13] = 'SVG and JSON files that describe the chip layout.';
        MINT_STRING[14] = 'When you are ready, push these files to the next';
        MINT_STRING[15] = 'stage of the workflow, where you can build and';
        MINT_STRING[16] = 'Tcontrol your microfluidic chip.';
    localStorage.MINT_STRING = JSON.stringify(MINT_STRING);
    fill_editor(MINT_STRING,MINT_editor);

    localStorage.firstVisituShroom = false;
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