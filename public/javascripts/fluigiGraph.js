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
    console.log("Dispenser " + this.id + " clicked");
    dispenser_to_control = this.id;
    increaseDispenserOutput(dispenser_to_control);
    return false;
}

function activateDispenser(dispenserIDNum) {
    console.log("Dispenser " + dispenserIDNum + " activated!");
    localStorage.activeDispenser = dispenserIDNum;
    localStorage.dispenserToControl = dispenserIDNum;
}

function deactivateDispenser() {
    console.log("All dispensers deactivated!");
    localStorage.activeDispenser = "none";
}


function placeButtons() {
    var canvasZoom = paper.view.zoom;
    
    // for each pump, create new instance of valve template
    for(var i=0; i<JSON.parse(localStorage.getItem('portXcoords')).length; i++){

        var content = $("#content");
        var template = document.getElementById("valve-template").content.cloneNode(true);
        var valveDiv = template.querySelector('.valve');
        
        valveDiv.style.position = 'absolute';

        // valveDiv.style.top  = ((JSON.parse(localStorage.getItem('portYcoords'))[i])* paper.view.zoom)+ 'px';
        // valveDiv.style.left = ((JSON.parse(localStorage.getItem('portXcoords'))[i])* paper.view.zoom)+ 'px';


        valveDiv.style.top  = (parseInt(JSON.parse(localStorage.portYcoords)[i]) - paper.view.bounds.topLeft['_y']) * canvasZoom + (1.25 * Math.pow((canvasZoom *5), 5)) + 'px';
        valveDiv.style.left = (parseInt(JSON.parse(localStorage.portXcoords)[i]) - paper.view.bounds.topLeft['_x']) * canvasZoom + (1.25 * Math.pow((canvasZoom *5), 5)) + 'px';

        console.log("canvas bounds: ");
        console.log(paper.view.bounds);

        console.log(canvasZoom);
        
        // console.log(paper.view.zoom);
        console.log(paper.view.projectToView((parseInt(JSON.parse(localStorage.portXcoords)[i]), parseInt(JSON.parse(localStorage.portYcoords)[i]))));


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

        // create new dispenser instance
        var template = document.getElementById("dispenser-template").content.cloneNode(true);
        var valveDiv = template.querySelector('.valve');
        var modalDiv = template.querySelector('.dispenserModalClass');
        var gottaCatchEmAll = template.querySelector('.catchDispenser');



        valveDiv.style.position = 'absolute';

        // +220 bc canvas is positioned 220px from top & -20 so that valve is positioned from center of circle
        var yCoord = (parseInt(JSON.parse(localStorage.portYcoordsDisp)[i]) - paper.view.bounds.topLeft['_y']) * canvasZoom + (1.25 * Math.pow((canvasZoom *5), 5));
        var xCoord = (parseInt(JSON.parse(localStorage.portXcoordsDisp)[i]) - paper.view.bounds.topLeft['_x']) * canvasZoom + (1.25 * Math.pow((canvasZoom *5), 5));

        modalDiv.id = "dispenserModal" + (i + 1);
        var modalID = template.querySelector("#dispenserModal" + (i + 1));

        // style position of dispenser modal
        modalID.style.top = (yCoord + 'px');
        modalID.style.left = (xCoord + 'px');

        // place dispensers
        valveDiv.style.top  = yCoord + 'px';
        valveDiv.style.left = xCoord + 'px';


        var specificImage = template.querySelector('.dispenserImg');
        // set id of each valve anchor based on location in array
        specificImage.id = i + 1;

        // specificImage.onclick = onclickanchortagDispense;
        valveButton = template.querySelector('.valve');


        var valveIDLabel = template.querySelector('.IDtext');
        valveIDLabel.textContent = (i + 1);
        if ((i + 1) > 9) {
            template.querySelector('.IDtext').style = "padding-left: 9px";
        }

        var catchID = "catch" + (i + 1);
        gottaCatchEmAll.id = catchID;



        var dispenserTitle = template.querySelector('#dispenserModalTitle');
        dispenserTitle.textContent = "Dispenser " + (i + 1);




        var dispenserCatch = "#dispenserModal" + (i + 1);
        content.append(template);
        // attach reference to correct dispenser modal
        $("#" + catchID).attr("href", dispenserCatch);
        $("#" + catchID).attr("onclick", "activateDispenser(" + (i + 1) + ")");



    }
}


