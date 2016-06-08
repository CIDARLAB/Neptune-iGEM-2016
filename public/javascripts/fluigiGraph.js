//Graphing the SVG

function onclickanchortag(){
    console.log('hey beb');
    var location = getLocation(this.src);
    console.log( );

    switch (location.pathname){
        case "/images/fluigi/valveMarkerOpen.svg":
            $(this).attr("src", "../images/fluigi/valveMarkerClosed.svg" );
            break;

        case "/images/fluigi/valveMarkerClosed.svg":
            $(this).attr("src", "../images/fluigi/valveMarkerOpen.svg" );
            break;

        default:
            $(this).attr("src", "../images/fluigi/valveMarkerClosed.svg" );
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











// GRAPH FORMATTING
$(document).ready(function(SVGscaleG){

    var canWidth = 1280;
    var canHeight = 725;

    var cx = document.querySelector("canvas").getContext("2d");
    // Formatting Canvas
    cx.canvas.width = canWidth;
    cx.canvas.height = canHeight;
    document.getElementById("canvasID").style.background = '#34495e';

// coords of center of valve circles
//    var Xcoords = [37.702655, 54.143625];
//    var Ycoords = [34.868005, 34.868005];

    // load svg to canvas and reformat
     var svgGraph = document.createElement("img");
     svgGraph.src = "../images/fluigi/test1DeviceFlow.svg";
     svgGraph.addEventListener("load", function () {

         // original width and height of SVG upon load
         SVGwidth = this.width;
         SVGheight = this.height;

        // ratio to preserve aspect ratio of svg
         SVGscale = (canHeight) / SVGheight;


        // starting x position of SVG on canvas
         SVGx = canWidth / 2 - ( (SVGwidth * ( (canHeight) / SVGheight) ) / 2 );
         console.log(SVGx);

         cx.drawImage(svgGraph, SVGx, -10 * SVGscale, SVGwidth * SVGscale, SVGheight * SVGscale);
     });





    // x and y coordinates of the valves --> provided at higher level, or limit formatting of svg
    var Xcoords = [35.716586, 52.157556];
    var Ycoords = [34.866191, 34.826191];

    // for each pump, create new instance of valve template
    for(i=0; i<Xcoords.length; i++){

        var content = $("#content");
        var template = document.getElementById("valve-template").content.cloneNode(true);
        var valveDiv = template.querySelector('.valve');
        valveDiv.style.position = 'absolute';
        valveDiv.style.top  = (Ycoords[i]*14.79) - 10*14.79 + 'px';
        valveDiv.style.left = (Xcoords[i]*14.79) - 25.81 + 'px';

        var specificImage = template.querySelector('.valve_color');
        // set id of each valve anchor based on location in array
        specificImage.id = 'valve'+i;


        specificImage.onclick = onclickanchortag;




        content.append(template);
        
        
    }

 });

