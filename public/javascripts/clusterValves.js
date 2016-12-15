/**
 * Created by rebeccawolf on 12/14/16.
 */


var clusterMembers = {};
function drawClusterTable(data) {
    clusterMembers = {};
    $("#makeValveCluster").find("tr:gt(0)").remove();
    for (var i = 0; i < data.length; i++) {
        drawClusterRow(data[i]);
    }
}

function drawClusterRow(rowData) {
    var row = $("<tr class='tempData' />");
    $("#makeValveCluster").append(row);
    row.append($("<td>" + rowData.id + "</td>"));
    var id = (rowData.id).toString();
    row.append($("<td>" + "<input type=\"checkbox\" name=\"member\" value="+id+" onchange=\"updateClusterList()\"> " + "</td>"));
}

function updateClusterList(){
    var checked = $('input[name=member]:checked').map(function() {
        return this.value;
    }).get();
//    alert(checked);
    checked = checked.toString();
    $('#newClusterList').text(
        'Cluster Members: '
        + checked);
}
