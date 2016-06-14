//Graphing the SVG

function onclickanchortag(){
    console.log('hey beb');
    var location = getLocation(this.src);
    console.log( );

    switch (location.pathname){
        case "/images/fluigi/valveMarkerOpen.svg":
            $(this).attr("src", "../images/fluigi/valveMarkerClosed.svg" );
            var myid = $(this).id;
            flipFlop_valveState(myid);
            break;

        case "/images/fluigi/valveMarkerClosed.svg":
            $(this).attr("src", "../images/fluigi/valveMarkerOpen.svg" );
            var myid = $(this).id;
            flipFlop_valveState(myid);
            break;

        default:
            $(this).attr("src", "../images/fluigi/valveMarkerClosed.svg" );
            //var myid = $(this).id;
            //flipFlop_valveState(myid);
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
$(document).ready(function(){

    var canWidth = 1280;
    var canHeight = 725;

    var cx = document.querySelector("canvas").getContext("2d");
    // Formatting Canvas
    cx.canvas.width = canWidth;
    cx.canvas.height = canHeight;
    //document.getElementById("canvasID").style.background = '#34495e';


    // load svg to canvas and reformat
    var svgGraph = document.createElement("img");

    svgGraph.src = "../uploads/mysvg.svg";

    svgGraph.addEventListener("load", function () {


        // original width and height of SVG upon load
        console.log("Testing if local storage works: " + localStorage.getItem('SVGdimX'));
        SVGwidth = JSON.parse(localStorage.getItem('SVGdimX'));
        SVGheight = JSON.parse(localStorage.getItem('SVGdimY'));
        // console.log('SVG width: ' + SVGwidth);



        // ratio to preserve aspect ratio of svg
        SVGscaleX = (canWidth) / SVGwidth;
        SVGscaleY = (canHeight) / SVGheight;

        localStorage.setItem('SVGscaleX', SVGscaleX);
        localStorage.setItem('SVGscaleY', SVGscaleY);

        //console.log('SVG scale x: ' + JSON.parse(localStorage.getItem('SVGscaleX')));


        // cx.drawImage(svgGraph, SVGx - 200, -10 * SVGscale, SVGwidth * SVGscale, SVGheight * SVGscale);
        cx.drawImage(svgGraph, 0, 0, canWidth, canHeight);
    });




    // for each pump, create new instance of valve template
    for(var i=0; i<JSON.parse(localStorage.getItem('portXcoords')).length; i++){

        var content = $("#content");
        var template = document.getElementById("valve-template").content.cloneNode(true);
        var valveDiv = template.querySelector('.valve');
        valveDiv.style.position = 'absolute';

        // +220 bc canvas is positioned 220px from top & -20 so that valve is positioned from center of circle
        valveDiv.style.top  = ((JSON.parse(localStorage.getItem('portYcoords'))[i])*JSON.parse(localStorage.getItem('SVGscaleY')) + 220 - 20) + 'px';
        valveDiv.style.left = ((JSON.parse(localStorage.getItem('portXcoords'))[i])*JSON.parse(localStorage.getItem('SVGscaleX')) - 20) + 'px';

        // console.log( ((JSON.parse(localStorage.getItem('portYcoords'))[i])*JSON.parse(localStorage.getItem('SVGscaleY'))) + 'px' );
        // console.log( ((JSON.parse(localStorage.getItem('portXcoords'))[i])*JSON.parse(localStorage.getItem('SVGscaleX'))) + 'px' );


        var specificImage = template.querySelector('.valve_color');
        // set id of each valve anchor based on location in array
        specificImage.id = i;

        specificImage.onclick = onclickanchortag;

        content.append(template);


    }

});

