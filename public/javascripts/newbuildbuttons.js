/**
 * Created by Priya on 27/09/2016.
 */



function updateTable(){
    loadButtons();
    setNumberOfDispensers_JSON();
    setNumberOfPumps_JSON();
    var table = document.getElementById("combo_table");
    localStorage.numberofvalves = JSON.parse(localStorage.pumpData).length;
    localStorage.numberofdispensers = JSON.parse(localStorage.dispenserData).length;
    for (var i=0; i!= localStorage.numberofdispensers; i++) {
        console.log("hello 2");
        var row = table.insertRow(i+1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
       
        cell1.innerHTML = i+1;
        cell2.innerHTML=  "<select> " +
            "<option value='a1'>A1</option>    " +
            "<option value='a2'>A2</option> " +
            "<option value='a3'>A3</option> " +
            "<option value='b1'>B1</option> " +
            "<option value='b2'>B2</option> " +
            "<option value='b3'>B3</option> " +
            "</select>";

    }


}