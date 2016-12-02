/**
 * Created by rebeccawolf on 7/26/16.
 */
// Sets up settings Modal
// Settings table save functionality

function drawValveTable(data) {
    $("#ValveTable").find("tr:gt(0)").remove();
    for (var i = 0; i < data.length; i++) {
        drawValveRow(data[i]);
    }
}

function drawValveRow(rowData) {
    var row = $("<tr class='tempData' />")
    $("#ValveTable").append(row);
    row.append($("<td>" + rowData.id + "</td>"));
    row.append($("<td>" + rowData.HW_shield + "</td>"));
    row.append($("<td>" + rowData.HW_pin + "</td>"));
    //row.append($("<td contenteditable='true'>" + rowData.Open_State + "</td>"));
    //row.append($("<td contenteditable='true'>" + rowData.Closed_State + "</td>"));
    row.append($("<td>" + rowData.Open_State + "</td>"));
    row.append($("<td>" + rowData.Closed_State + "</td>"));
    row.append($("<td>" + rowData.Current_State + "</td>"));
}


// A few jQuery helpers for exporting only
jQuery.fn.pop = [].pop;
jQuery.fn.shift = [].shift;

function exporting() {
    var $rows = $('#ValveTable').find('tr:not(:hidden):not(:empty)');
    var keys = ["id", "HW_shield", "HW_pin", "Open_State", "Closed_State", "Current_State", "deviceIndex"];
    //var data = [];
    var x = 0; // making sure we are not counting the headers row here
    var valveData = JSON.parse(localStorage.pumpData);
    // Turn all existing rows into a loopable array
    $rows.each(function () {
        if(x > 0){
            //deviceCount = deviceCount + 1;
            var $td = $(this).find('td');
            var h = {};
            // Use pre-defined Hash keys
            keys.forEach(function (header, i) {
                if(header === "Current_State"){
                    //h[header] = $td.eq(i).text();
                    valveData[x - 1][header] = $td.eq(i).text();
                    console.log("Editing header " + header + " for index " + (x - 1) + " which should be " + $td.eq(i).text());
                }
                else if(header === "deviceIndex") {
                    //h["deviceIndex"] = deviceCount;
                    valveData[x - 1][header] = deviceCount;
                    console.log("Editing header " + header + " for index " + (x - 1) + " which should be " + deviceCount);
                }
                else{
                    //h[header] = parseInt($td.eq(i).text());
                    valveData[x - 1][header] = parseInt($td.eq(i).text());
                    console.log("Editing header " + header + " for index " + (x - 1) + " which should be " + parseInt($td.eq(i).text()));
                }
            });
            //console.log(h);
            //data.push(h);
        }
        x = x + 1;
    });
    // Output the result
    localStorage.pumpData = JSON.stringify(valveData);
};













function drawDispenserTable(data) {
    $("#DispenserTable").find("tr:gt(0)").remove();
    for (var i = 0; i < data.length; i++) {
        drawDispRow(data[i]);
    }
}

function drawDispRow(rowData) {
    var row = $("<tr class='tempData' />")
    $("#DispenserTable").append(row);
    row.append($("<td>" + rowData.id + "</td>"));
    row.append($("<td>" + rowData.HW_shield + "</td>"));
    row.append($("<td>" + rowData.HW_pin + "</td>"));
    row.append($("<td contenteditable='true'>" + rowData.Precision + "</td>"));
    row.append($("<td contenteditable='true'>" + rowData.Min + "</td>"));
    row.append($("<td contenteditable='true'>" + rowData.Max + "</td>"));
    row.append($("<td contenteditable='true'>" + rowData.Current_State + "</td>"));
    row.append($("<td>" + rowData.orientation + "</td>"));
}

function exportingDispenser() {
    var $rows = $('#DispenserTable').find('tr:not(:hidden):not(:empty)');
    var keys = ["id", "HW_shield", "HW_pin", "Precision", "Min", "Max", "Current_State", "orientation", "deviceIndex"];
    var data = [];
    var x = 0; // making sure we are not counting the headers row here
    // Turn all existing rows into a loopable array
    $rows.each(function () {
        if(x > 0){
            deviceCount = deviceCount + 1;
            var $td = $(this).find('td');
            var h = {};
            // Use pre-defined Hash keys
            keys.forEach(function (header, i) {
                if(header === "deviceIndex"){
                    h["deviceIndex"] = deviceCount;
                }
                else if(header === "orientation") {
                    h[header] = $td.eq(i).text();
                }
                else if(header === "Precision") {
                    h[header] = $td.eq(i).text();
                }
                else if(header === "Min") {
                    h[header] = parseFloat($td.eq(i).text()).toFixed(1);
                }
                else if(header === "Max") {
                    h[header] = parseFloat($td.eq(i).text()).toFixed(1);
                }
                else if(header === "Current_State") {
                    h[header] = parseFloat($td.eq(i).text()).toFixed(1);
                }
                else{
                    h[header] = parseInt($td.eq(i).text());
                }

            });
            data.push(h);
        }
        x = x + 1;
    });

    // Output the result
    console.log(JSON.parse(JSON.stringify(data)));
    localStorage.dispenserData = JSON.stringify(data);
};


function totalExport() {
    deviceCount = 0;
    exporting();
    exportingDispenser();
};

