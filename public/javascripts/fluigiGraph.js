//Graphing the SVG

function onclickanchortag(){
    var location = getLocation(this.src);

    switch (location.pathname){
        case "/images/fluigi/valveMarkerOpen.svg":
            $(this).attr("src", "../images/fluigi/valveMarkerClosed.svg");
            console.log("Port " + this.id + " clicked");
            valve_to_control = this.id;
            // change recorded state in table
            var temp = JSON.parse(localStorage.pumpData);
            temp[valve_to_control - 1]['Current_State'] = "closed";
            localStorage.pumpData = JSON.stringify(temp);
            flipFlop_valveState(valve_to_control);
            break;

        case "/images/fluigi/valveMarkerClosed.svg":
            $(this).attr("src", "../images/fluigi/valveMarkerOpen.svg");
            console.log("Port " + this.id + " clicked");
            valve_to_control = this.id;
            // change recorded state in table
            var temp = JSON.parse(localStorage.pumpData);
            temp[valve_to_control - 1]['Current_State'] = "opened";
            localStorage.pumpData = JSON.stringify(temp);
            flipFlop_valveState(valve_to_control);
            break;

        default:
            $(this).attr("src", "../images/fluigi/valveMarkerClosed.svg");
            break;
    }
    if (location.pathname == "/images/fluigi/valveMarkerOpen.svg"){

    }

    return false;
}




var getLocation = function(href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
};













function onclickanchortagDispense(){
    var location = getLocation(this.src);
    console.log("Dispenser " + this.id + " clicked");
    dispenser_to_control = this.id;
    increaseDispenserOutput(dispenser_to_control);




    // switch (location.pathname){
    //     case "/images/fluigi/valveMarkerOpen.svg":
    //         $(this).attr("src", "../images/fluigi/valveMarkerClosed.svg");
    //         console.log("Port " + this.id + " clicked");
    //         valve_to_control = this.id;
    //         flipFlop_valveState(valve_to_control);
    //         break;
    //
    //     case "/images/fluigi/valveMarkerClosed.svg":
    //         $(this).attr("src", "../images/fluigi/valveMarkerOpen.svg");
    //         console.log("Port " + this.id + " clicked");
    //         valve_to_control = this.id;
    //         flipFlop_valveState(valve_to_control);
    //         break;
    //
    //     default:
    //         $(this).attr("src", "../images/fluigi/valveMarkerClosed.svg");
    //         break;
    // }
    // if (location.pathname == "/images/fluigi/valveMarkerOpen.svg"){
    //
    // }

    return false;
}





















// GRAPH FORMATTING
$(document).ready(function(){

    var canWidth = 1280;
    var canHeight = 725;

    var cx = document.querySelector("canvas").getContext("2d");
    // Formatting Canvas
    cx.canvas.width = canWidth;
    cx.canvas.height = canHeight;


    // for each pump, create new instance of valve template
    for(var i=0; i<JSON.parse(localStorage.getItem('portXcoords')).length; i++){

        var content = $("#content");
        var template = document.getElementById("valve-template").content.cloneNode(true);
        var valveDiv = template.querySelector('.valve');

        valveDiv.style.position = 'absolute';

        // +220 bc canvas is positioned 220px from top & -20 so that valve is positioned from center of circle
        valveDiv.style.top  = ((JSON.parse(localStorage.getItem('portYcoords'))[i])*(51000/localStorage.getItem('SVGdimY'))*0.010294117647058823 + 90 + 425) + 'px';
        valveDiv.style.left = ((JSON.parse(localStorage.getItem('portXcoords'))[i])*(75800/localStorage.getItem('SVGdimX'))*0.010294117647058823 - 20 + 363 + 100) + 'px';


        // console.log("this is the 3DUF Zoom: " + paper.view.zoom);

        // console.log( 'Y coordinate: ' + ((JSON.parse(localStorage.getItem('portYcoords'))[i])) );
        // console.log( 'X coordinate: ' + ((JSON.parse(localStorage.getItem('portXcoords'))[i])) );

        var specificImage = template.querySelector('.valve_color');
        // set id of each valve anchor based on location in array
        specificImage.id = i + 1;

        specificImage.onclick = onclickanchortag;

        valveButton = template.querySelector('.valve');
        // valveButton.onclick = onclickanchortag;


        var valveIDLabel = template.querySelector('.IDtext');
        valveIDLabel.textContent = (i + 1);
        if ((i + 1) > 9) {
            template.querySelector('.IDtext').style = "padding-left: 9px";
        }

        console.log("found another valve!");
        content.append(template);


    }

























    // for each DISPENSER, create new instance of DISPENSER template
    for(var i=0; i<JSON.parse(localStorage.getItem('portXcoordsDisp')).length; i++){

        var content = $("#content");
        var template = document.getElementById("dispenser-template").content.cloneNode(true);
        var valveDiv = template.querySelector('.valve');

        valveDiv.style.position = 'absolute';

        // +220 bc canvas is positioned 220px from top & -20 so that valve is positioned from center of circle
        valveDiv.style.top  = ((JSON.parse(localStorage.getItem('portYcoordsDisp'))[i])*(51000/localStorage.getItem('SVGdimY'))*0.010294117647058823 + 90 + 110) + 'px';
        valveDiv.style.left = ((JSON.parse(localStorage.getItem('portXcoordsDisp'))[i])*(75800/localStorage.getItem('SVGdimX'))*0.010294117647058823 - 20 + 150 + 100) + 'px';

        var specificImage = template.querySelector('.valve_color');
        // set id of each valve anchor based on location in array
        specificImage.id = i + 1;

        specificImage.onclick = onclickanchortagDispense;

        valveButton = template.querySelector('.valve');
        // valveButton.onclick = onclickanchortag;


        var valveIDLabel = template.querySelector('.IDtext');
        valveIDLabel.textContent = (i + 1);
        if ((i + 1) > 9) {
            template.querySelector('.IDtext').style = "padding-left: 9px";
        }

        console.log("found another dispenser!");
        content.append(template);


    }

});

