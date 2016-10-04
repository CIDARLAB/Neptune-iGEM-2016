/**
 * Created by zach on 8/29/16.
 */


function deg2rad(degrees){
    var pi = Math.PI;
    return (degrees * (pi/180));

}

function displacement(thetaX, r, b, d, a) {
    return ( r*Math.cos( deg2rad(thetaX) ) ) + Math.sqrt( Math.pow(b, 2) - ( Math.pow((r*Math.sin(deg2rad(thetaX))+d), 2) ) );
}


function initializeSetup(mLmin, r, b, d, a) {

    // what is thetaX: 1st deriv of displacement
    //var thetaX = 0;
    //var firstDerivativeDisplacement = (-(r*Math.cos(deg2rad(thetaX))*(d+r*Math.sin(deg2rad(thetaX))))/Math.sqrt((Math.pow(b, 2))-(Math.pow((d+r*Math.sin(deg2rad(thetaX))), 2))))-r*Math.sin(deg2rad(thetaX));

    var thetaXArray = [];               // create array of angles to be populated in for loop
    var displacementArray = [];         // create array of displacement values
    var increment = 1000;               // Set resolution of system; from -90 to 270 degrees, 1000 total intervals is sufficient
    var stepSize = 360/increment;       // Set step size for thetas to start at -90 and end at 270, a total of 360s

    for( var i = 0; i <= increment; i++){       // Iterate from 0 to 1000 by one
        thetaX_i = -90+stepSize*i;              // Calculate theta value from i
        thetaXArray.push(thetaX_i);             // Add current theta value to theta array
        displacementArray.push(displacement(thetaX_i, r, b, d, a));     // Add current displacement value to array
    }

    var displacement_min = Math.min.apply(null, displacementArray);         // Calculate value by finding minimum of displacement array
    var displacement_max = Math.max.apply(null, displacementArray);         // Calculate value by finding maximum of displacement array
    var theta_min = thetaXArray[displacementArray.indexOf(displacement_max)];       // Calculate theta_min by pulling theta value from theta array at the index where the displacement max was found
    var theta_max = thetaXArray[displacementArray.indexOf(displacement_min)];       // Calculate theta_max by pulling theta value from theta array at the index where the displacement min was found

    var Xmax = displacement(theta_min,r,b,d,a);                             // Calculate Xmax by plugging in theta_min to displacement function
    var Xmin = displacement(theta_max,r,b,d,a);                             // Calculate Xmin by plugging in theta_max to displacement function
    var mLmax = mLmin - (Xmax-Xmin)/a;                                      // Calculate mLmax by S

    return {
        theta_min:  theta_min,
        theta_max:  theta_max,
        Xmin:       Xmin,
        Xmax:       Xmax,
        mLmax:      mLmax,
        mLmin:      mLmin,
        r:          r,
        b:          b,
        d:          d,
        a:          a
    };
}

var initializeSetup_outputs = initializeSetup(9.125,0.75,3,0.88,0.25);
var theta_min = initializeSetup_outputs.theta_min;
var theta_max = initializeSetup_outputs.theta_max;

var Xmin = initializeSetup_outputs.Xmin;

var Xmax = initializeSetup_outputs.Xmax;
var mLmax = initializeSetup_outputs.mLmax;

var mLmin = initializeSetup_outputs.mLmin;

var r = initializeSetup_outputs.r;
var b = initializeSetup_outputs.b;
var d = initializeSetup_outputs.d;
var a = initializeSetup_outputs.a;

console.log("ThetaMin: ",theta_min);
console.log("ThetaMax: ",theta_max);
console.log("Xmin: ",Xmin);
console.log("Xmax: ",Xmax); 
console.log("mLmin: ",mLmin);
console.log("mLmax: ",mLmax);
console.log("r: ",r);
console.log("b: ",b);
console.log("d: ",d);
console.log("a: ",a);
