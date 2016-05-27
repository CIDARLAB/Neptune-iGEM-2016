/**
 * Created by kestas on 5/27/2016.
 */

var dataCenter = new Object();
    dataCenter.pumpData = [];
    dataCenter.unsavedData = [];
    dataCenter.oldPumpData = [];
    dataCenter.numPumps = 10;

$(document).ready(function()
{
    dataCenter.pumpData = initiateORClear_pumpData();

    $('#pumpDataTable').DataTable({
        data: dataCenter.pumpData,
        columns: [
            { data: 'Pump Number'},
            { data: 'Open State'},
            { data: 'Closed State'}
        ]
    });
} );

function initiateORClear_pumpData()
{
    var cleared_pumpData = [];
    for (var i = 1; i <= dataCenter.numPumps; i++)
    {
        var singleStage = {"Pump Number":i,"Open State":0,"Closed State":0};
        cleared_pumpData.push(singleStage);
    }
    return cleared_pumpData;
}


