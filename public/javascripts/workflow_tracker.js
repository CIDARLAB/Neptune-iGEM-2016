/**
 * Created by kestas on 7/18/2016.
 */

function workflow_tracker(WORKFLOW_STAGE)
{
    switch (WORKFLOW_STAGE)
    {
        case 'start':
            document.getElementById("start_box").style.boxShadow = '0 0 1em gold';
            //document.getElementById("start_box").style.
            //$('#start_box').
            break;
        case 'specify':
            document.getElementById("start_box").style.boxShadow = '0 0 1em gold';
            break;
        case 'design':
            document.getElementById("start_box").style.boxShadow = '0 0 1em gold';
            break;
        case 'build':
            document.getElementById("start_box").style.boxShadow = '0 0 1em gold';
            break;
        case 'end':
            document.getElementById("start_box").style.boxShadow = '0 0 1em gold';
            break;
    }
}

function file_tracker(FILE_ARRAY)
{
    var lfr_state;
    var ucf_state;
    var mint_state;
    var ini_state;
    var svg_state;
    var json_state;
}