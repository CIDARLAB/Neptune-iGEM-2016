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
        console.log("hello table");
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


localStorage.crankradius = 0.63;
localStorage.pistonrod = 3;
localStorage.offset = 0.88 ;


var servoTable =
    [
        {
            "id":"A",
            "name":"FS5106B",
            "AD": 50,
            "thetaMax":157,
            "thetaMin": -13.6,
            "PWM_min": 180,
            "PWM_max": 500,
            "msRange": 1511,
            "deadbandwidth":5,
            "cost":12.95,
            "torque":69.56,
            "speed":0.18,
            "url": "https://www.sparkfun.com/products/11965"
        },
        {
            "id":"B",
            "name":"HS-422",
            "AD": 50,
            "thetaMax":170,
            "thetaMin": 0,
            "PWM_min": 180,
            "PWM_max": 500,
            "msRange": 1133.3,
            "deadbandwidth":8,
            "cost":9.95,
            "torque":45.82,
            "speed":0.21,
            "url": "https://www.sparkfun.com/products/11884"
        },
        {
            "id":"C",
            "name":"HS-425BB",
            "AD": 50,
            "thetaMax":170,
            "thetaMin": 0,
            "PWM_min": 180,
            "PWM_max": 500,
            "msRange": 1857.7,
            "deadbandwidth":8,
            "cost":12.95,
            "torque":45.82,
            "speed":0.21,
            "url": "https://www.sparkfun.com/products/11883"
        },
        {
            "id":"D",
            "name":"HS-625MG",
            "AD": 50,
            "thetaMax":170,
            "thetaMin": 0,
            "PWM_min": 180,
            "PWM_max": 500,
            "msRange": 1857.7,
            "deadbandwidth":8,
            "cost":31.95,
            "torque":76.37,
            "speed":0.18,
            "url": "https://www.sparkfun.com/products/11885"
        },
        {
            "id":"E",
            "name":"HS-85MG",
            "AD": 50,
            "thetaMax":170,
            "thetaMin": 0,
            "PWM_min": 180,
            "PWM_max": 500,
            "msRange": 1133.3,
            "deadbandwidth":8,
            "cost":29.95,
            "torque":41.66,
            "speed":0.16,
            "url": "https://www.sparkfun.com/products/11887"
        },
        {
            "id":"F",
            "name":"HS-311",
            "AD": 50,
            "thetaMax":170,
            "thetaMin": 0,
            "PWM_min": 180,
            "PWM_max": 500,
            "msRange": 1780.3,
            "deadbandwidth":5,
            "cost":7.89,
            "torque":42,
            "speed":0.19,
            "url": "http://www.robotshop.com/en/hitec-hs311-servo.html"
        },
        {
            "id":"G",
            "name":"HS-645MG",
            "AD": 50,
            "thetaMax":170,
            "thetaMin": 0,
            "PWM_min": 180,
            "PWM_max": 500,
            "msRange": 1133.3,
            "deadbandwidth":8,
            "cost":28.59,
            "torque":106.93,
            "speed":0.24,
            "url": "http://www.robotshop.com/en/hitec-hs645mg-servo-motor.html"
        },
        {
            "id":"H",
            "name":"HS-53",
            "AD": 50,
            "thetaMax":170,
            "thetaMin": 0,
            "PWM_min": 180,
            "PWM_max": 500,
            "msRange": 1621.6,
            "deadbandwidth":8,
            "cost":7.19,
            "torque":16.7,
            "speed":0.16,
            "url": "http://www.robotshop.com/en/hs-53-feather-nylon-gear-servo-motor.html"
        },
        {
            "id":"I",
            "name":"SR-1425CR",
            "AD": 50,
            "thetaMax":170,
            "thetaMin": 0,
            "PWM_min": 180,
            "PWM_max": 500,
            "msRange": 1133.3,
            "deadbandwidth":8,
            "cost":16.99,
            "torque":38.8,
            "speed":0.14,
            "url": "https://www.servocity.com/hsr-1425cr-servo"
        },
        {
            "id":"J",
            "name":"HS-322",
            "AD": 50,
            "thetaMax":170,
            "thetaMin": 0,
            "PWM_min": 180,
            "PWM_max": 500,
            "msRange": 1791.6,
            "deadbandwidth":5,
            "cost":9.89,
            "torque":41.7,
            "speed":0.15,
            "url": "http://www.robotshop.com/en/hitec-hs-322hd-servo.html"
        },
        {
            "id": "K",
            "name": "HS-5055MG",
            "AD": 300,
            "thetaMax": 170,
            "thetaMin": 0,
            "PWM_min": 180,
            "PWM_max": 500,
            "msRange": 1133.3,
            "deadbandwidth": 2,
            "cost": 17.75,
            "torque": 17,
            "speed": 0.17,
            "url": " https://www.motionrc.com/products/hitec-hs-5055mg-9g-digital-metal-gear-micro-servo?utm_medium=cpc&utm_source=googlepla&variant=19047007750&gclid=CjwKEAjwxeq9BRDDh4_MheOnvAESJABZ4VTqR8cXje7Pvj4rTdG2VXLXtYaxG9cCIpx0vVRHGq2n_RoCRkXw_wcB"
        },
        {
            "id": "L",
            "name": "HS-5645MG",
            "AD": 300,
            "thetaMax": 170,
            "thetaMin": 0,
            "PWM_min": 180,
            "PWM_max": 500,
            "msRange": 1133.3,
            "deadbandwidth": 1,
            "cost": 39.99,
            "torque": 143,
            "speed": 0.23,
            "url": "https://www.servocity.com/hs-5645mg-servo"
        },
        {
            "id": "M",
            "name": "HS-805BB",
            "AD": 50,
            "thetaMax": 199.5,
            "thetaMin": 0,
            "PWM_min": 180,
            "PWM_max": 500,
            "msRange": 1864,
            "deadbandwidth": 8,
            "cost": 39.99,
            "torque": 275,
            "speed": 0.14,
            "url": "https://www.servocity.com/hs-805bb-servo"
        },
        {
            "id": "N",
            "name": "HS-5485HB",
            "AD": 300,
            "thetaMax": 199.5,
            "thetaMin": 0,
            "PWM_min": 180,
            "PWM_max": 500,
            "msRange": 1500,
            "deadbandwidth": 8,
            "cost": 24.99,
            "torque": 72,
            "speed": 0.17,
            "url": "https://www.servocity.com/hs-5485hb-servo"
        },
        {
            "id": "O",
            "name": "SG92R Tower Pro",
            "AD": 300,
            "thetaMax": 170,
            "thetaMin": 0,
            "PWM_min": 180,
            "PWM_max": 500,
            "msRange": 1133.3,
            "deadbandwidth": 1,
            "cost": 2.60,
            "torque": 22,
            "speed": 0.12,
            "url": "http://www.towerpro.com.tw/product/sg92r-7/"
        }



    ];

var syringeTable =
    [
        {
            "ids": "1",
            "volume": 3,
            // "area": 0.091297,
            "area": 0.325 * 0.325 * 3.14159,
            "costs": 12,
            "url": "http://www.harvardapparatus.com/pumps-liquid-handling/syringes/plastic-syringes/plastic-syringes.html"
        },
        {
            "ids": "2",
            "volume": 5,
            "area": 0.177059,
            "costs": 22,
            "url": "http://www.harvardapparatus.com/pumps-liquid-handling/syringes/plastic-syringes/plastic-syringes.html"
        },
        {
            "ids": "3",
            "volume": 10,
            "area": 0.255952,
            "costs": 18,
            "url": "http://www.harvardapparatus.com/pumps-liquid-handling/syringes/plastic-syringes/plastic-syringes.html"
        },
        {
            "ids": "4",
            "volume": 20,
            "area": 0.445505,
            "costs": 23,
            "url": "http://www.harvardapparatus.com/pumps-liquid-handling/syringes/plastic-syringes/plastic-syringes.html"
        },
        {
            "ids": "5",
            "volume": 30,
            "area": 0.573247,
            "costs": 48,
            "url": "http://www.harvardapparatus.com/pumps-liquid-handling/syringes/plastic-syringes/plastic-syringes.html"
        },
        {
            "ids": "6",
            "volume": 60,
            "area": 0.867851,
            "costs": 32,
            "url": "http://www.harvardapparatus.com/pumps-liquid-handling/syringes/plastic-syringes/plastic-syringes.html"
        }
    ];


function calculateRecommended() {
    var arr = [];

    loadButtons();
    setNumberOfDispensers_JSON();
    setNumberOfPumps_JSON();

// Iterate through syringes 1-12
// Iterate through servos A-L
// Calculate Vc and Pc
// If Vc>=V and Pc<=P then save servo and syringe into table

    for (var key in servoTable) {
        if (servoTable.hasOwnProperty(key)) {
            var servoID = servoTable[key].id;

            var r = parseFloat(localStorage.crankradius);
            var b = parseFloat (localStorage.pistonrod);
            var d = parseFloat (localStorage.offset);

        }
        localStorage.numberofvalves = JSON.parse(localStorage.pumpData).length;
        localStorage.numberofdispensers = JSON.parse(localStorage.dispenserData).length;

        for (var key2 in syringeTable) {
            if (syringeTable.hasOwnProperty(key2)) {
                //loop through syringes

                var syringeID = syringeTable[key2].ids;

                //1 * 10^-9 m3 = 1 microLitre = 0.610237441 inch ^3
                //Find x1 such that Area*x1= 0.610237441 inch ^3
                //So x1 = (0.610237441 inch ^3)/Area = inches

                var syringex1 = (0.610237441)/syringeTable[key2].area;
                var syringevolume = syringeTable[key2].volume;
                var syringecost = syringeTable[key2].costs;


                var servocost = servoTable[key].cost;
                var PWM_min = servoTable[key].PWM_min;
                var PWM_max = servoTable[key].PWM_max;

                console.log("PWM MIN " + PWM_min + " PWM_MAX " + PWM_max + " syringex1 " + syringex1);
                var setupvalues = initializeSetup(PWM_min,PWM_max, 0.63, 3, 0.88, syringex1);

                // Error Check
                var insidesqrt = Math.pow((r*Math.sin(setupvalues.theta_max * Math.PI/180))+ parseFloat(d),2);
                var insidesqrt2 = Math.pow((r*Math.sin(setupvalues.theta_min * Math.PI/180))+ parseFloat(d),2);
                var x1 = (r * Math.cos(setupvalues.theta_max * Math.PI/180)) + Math.sqrt((b * b) - insidesqrt);
                var x2 = (r * Math.cos(setupvalues.theta_min * Math.PI/180)) + Math.sqrt((b *b) - insidesqrt2);
                var xtotal = Math.abs(x1 - x2);


                var servo_volume = xtotal / syringex1;
                var my_servo_volume;
                if (servo_volume > syringevolume)
                {
                    my_servo_volume = syringevolume;
                }
                else {
                    my_servo_volume = servo_volume;
                }
                // console.log("Servo volume being used : " + my_servo_volume);
                if (localStorage.volume/1000 <= syringevolume && my_servo_volume >= localStorage.volume/1000 && localStorage.precision >= setupvalues.uL_precision ) {
                    //Save servo syringe combo in array
                    console.log("Servo ID passed: " + servoID);
                    console.log("Syringe ID passed: " + syringeID);
                    var singlestage = {};
                    singlestage.servoID = servoID;
                    singlestage.syringeID = syringeID;
                    singlestage.v = xtotal / syringex1;
                    singlestage.p = setupvalues.uL_precision;
                    singlestage.cost = servocost + syringecost;
                    arr.push(singlestage);
                }
            }
        }

    }


    //comboList
    var combolist = document.getElementById("comboList");
    var i = 0;
    var count = 0;
    for (var key in arr) {
        if (arr.hasOwnProperty(key)) {
            console.log("hello list");
            var row = combolist.insertRow(i + 1);
            var cell1 = row.insertCell(0); //Combo ID
            var cell2 = row.insertCell(1); //Servo and Syringe Names
            var cell3 = row.insertCell(2); //Precision
            var cell4 = row.insertCell(3); //Volume
            var cell5 = row.insertCell(4); //Cost
            // var cell6 = row.insertCell(5); //Syringe URL
            // var cell7 = row.insertCell(6); //Servo URL

            var ServoObject = getObjects(servoTable, 'id', arr[key].servoID);
            var SyringeObject = getObjects(syringeTable, 'ids', arr[key].syringeID);

            cell1.innerHTML = arr[key].servoID +arr[key].syringeID;
            cell2.innerHTML = "Servo: " + ServoObject[0].name + " and Syringe: "+ SyringeObject[0].volume + "ml";
            cell3.innerHTML = Math.round(arr[key].p * 1000) / 1000;
            cell4.innerHTML = Math.round(arr[key].v * 1000) / 1000;
            cell5.innerHTML = Math.round(arr[key].cost * 1000) / 1000;

            // cell6.innerHTML = ServoObject[0].url;
            // cell7.innerHTML = SyringeObject[0].url;

            i++;
            count++;
        }
    }

    if(count==0){ //If no possible combinations found
        console.log("No Combinations Found!");
    }

}


function getObjects(obj, key, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getObjects(obj[i], key, val));
        } else if (i == key && obj[key] == val) {
            objects.push(obj);
        }
    }
    return objects;
}

function initializeSetup(PWM_min,PWM_max,r, b, d, a) {
    function deg2rad(degrees){
        var pi = Math.PI;
        return (degrees * (pi/180));
    }

    function PWM2rad(PWM) {
        var deg = ( (PWM - PWM_min) * (theta_max-theta_min) / (PWM_max-PWM_min) ) + theta_min;
        return (deg * (Math.PI/180));
    }

    function displacement(thetaX, r, b, d, a) {
        return ( r*Math.cos( deg2rad(thetaX) ) ) + Math.sqrt( Math.pow(b, 2) - ( Math.pow((r*Math.sin(deg2rad(thetaX))+d), 2) ) );
    }

    var thetaXArray = [];               // create array of angles to be populated in for loop
    var displacementArray = [];         // create array of displacement values
    var increment = 1000;               // Set resolution of system; from -90 to 270 degrees, 1000 total intervals is sufficient
    var stepSize = 360/increment;       // Set step size for thetas to start at -90 and end at 270, a total of 360s
    for( var i = 0; i <= increment; i++){       // Iterate from 0 to 1000 by one
        var thetaX_i = -90+stepSize*i;              // Calculate theta value from i
        thetaXArray.push(thetaX_i);             // Add current theta value to theta array
        displacementArray.push(displacement(thetaX_i, r, b, d, a));     // Add current displacement value to array
    }

    var displacement_min = Math.min.apply(null, displacementArray);         // Calculate value by finding minimum of displacement array
    var displacement_max = Math.max.apply(null, displacementArray);         // Calculate value by finding maximum of displacement array


    var theta_min = thetaXArray[displacementArray.indexOf(displacement_max)];       // Calculate theta_min by pulling theta value from theta array at the index where the displacement max was found
    var theta_max = thetaXArray[displacementArray.indexOf(displacement_min)];       // Calculate theta_max by pulling theta value from theta array at the index where the displacement min was found
    var X_max = displacement(theta_min,r,b,d,a);                             // Calculate Xmax by plugging in theta_min to displacement function
    var X_min = displacement(theta_max,r,b,d,a);                             // Calculate Xmin by plugging in theta_max to displacement function
    var mL_min = 0;      // Default value for mLmax, initalized by user in Assembly step. MUST be true
    var mL_max = mL_min + (X_max-X_min)/a                                       // Calculate mLmax by S
    var uL_min = mL_min*1000;		// convert incoming variables from mL to uL
    var uL_max = mL_max*1000;
    var mL_range = mL_max - mL_min
    var uL_range = mL_range*1000; 	// convert incoming variables from mL to uL

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Create PWM_table and find uL_precision
    var PWM_table = [];    // used in this inner function
    var PWM_dic = {};       // passed as output to easily hash

    var not_found = true;
    for (var i=PWM_min; i<=PWM_max; i++) {		// From PWM_min value to PWM_max value
        PWM_table.push(i);						// Add current PWM value to PWM_table
        var mL_temp = mL_max - ((( r*Math.cos(PWM2rad(i)) ) + Math.sqrt(Math.pow(b,2) - ( Math.pow((r*Math.sin(PWM2rad(i))+d),2) ))) - X_min)/a;	// Calculate mL value with formula of motion
        var uL_temp = Math.round(mL_temp*100000)/100;		// convert to uL and round to first decimal place
        PWM_table.push(uL_temp);				// Add uL value to PWM_table

        PWM_dic[i] = uL_temp;

        // Find uL_precision by finding the max uL difference between PWM values.
        var uL_diff = PWM_table[PWM_table.length-1] - PWM_table[PWM_table.length-3];
        var uL_diff_prev = PWM_table[PWM_table.length-3] - PWM_table[PWM_table.length-5];
        if( uL_diff < uL_diff_prev && not_found) {
            var uL_precision = Math.round(uL_diff_prev*100)/100;
            not_found = false;
        };
    };


    // create uL_table
    var uL_table = [];
    var uL_dic = {};
    for (var i=uL_min; i<uL_range+uL_min+uL_precision; i=i+uL_precision) {		// From uL_min (a given) to uL_min+uL_range! uL_precision added on to allow last uL value to be iterated through. Increase by steps of uL_precision
        // rename i (which is current uL value)
        var uL_current = i ;									// rename i to something more readable
        uL_current = Math.round(uL_current*100)/100;		// round to 2 decimal places

        // Add uL to table
        uL_table.push(uL_current); 							// Add the current uL value to uL_table

        // Find PWM values
        // Add First PWM value, matched easily
        if (i == uL_min) {		// We know the first value, which can't be found with linear interpolation
            uL_table.push(PWM_table[0]);
            uL_dic[uL_current] = PWM_table[0];
            continue;
        }
        // Linear interpolation to find other PWM values
        // Skip to 2nd value as we already logged the first
        for (var j = 3; j <= PWM_table.length; j=j+2) {			// Iterate through uL values in PWM_table (start at 2nd uL value, index 3. Go length of PWM table. Increase by 2 to avoid looking at PWM values)
            if (PWM_table[j] >= uL_current && j%2 > 0) { 		// If uL value in PWM_table is greater than or equal to our current uL value, find PWM inbetween PWMs in PWM_table
                var PWM_between = PWM_table[j-3] + (uL_current - PWM_table[j-2])*((PWM_table[j-1]-PWM_table[j-3])/(PWM_table[j]-PWM_table[j-2]));	// Find PWM value via linear interpolation
                var PWM_between = Math.round(PWM_between*100)/100;	// Round calculated PWM value to 2 decimal places
                uL_table.push(PWM_between);						// Add calculated PWM value to table

                uL_dic[uL_current] = PWM_between;
                break;
            }
        }

        if (i >= uL_range+uL_min) {
            uL_table.push(PWM_max)      // Add last PWM value, not calculated above with linear interpolation
            uL_dic[uL_current] = PWM_max;
        }
    };

    return {
        theta_min: theta_min,
        theta_max: theta_max,
        X_min: X_min,
        X_max: X_max,
        uL_min: uL_min,
        uL_max: uL_max,
        PWM_table: PWM_table,
        PWM_dic: PWM_dic,
        uL_table: uL_table,
        uL_dic: uL_dic,
        uL_precision: uL_precision,
        r: r,
        b: b,
        d: d,
        a: a
    };
};


function givecheapestjson(){
    var lowestServoObject = getObjects(servoTable, 'id', localStorage.lowestservo);
    var lowestSyringeObject = getObjects(syringeTable, 'ids', localStorage.lowestsyringe);
    var syringex1 = (0.610237441)/lowestSyringeObject[0].area;
    var PWM_min = lowestServoObject[0].PWM_min;
    var PWM_max = lowestServoObject[0].PWM_max;
    givetocontrol(PWM_min, PWM_max, syringex1);

}

function givevolumejson(){
    var vServoObject = getObjects(servoTable, 'id', localStorage.vservo);
    var vSyringeObject = getObjects(syringeTable, 'ids', localStorage.vsyringe);

    var syringex1 = (0.610237441)/vSyringeObject[0].area;
    var PWM_min = vServoObject[0].PWM_min;
    var PWM_max = vServoObject[0].PWM_max;
    givetocontrol(PWM_min, PWM_max, syringex1);
}

function givetolerancejson(){
    var pServoObject = getObjects(servoTable, 'id', localStorage.pservo);
    var pSyringeObject = getObjects(syringeTable, 'ids', localStorage.psyringe);

    var syringex1 = (0.610237441)/pSyringeObject[0].area;
    var PWM_min = pServoObject[0].PWM_min;
    var PWM_max = pServoObject[0].PWM_max;
    givetocontrol(PWM_min, PWM_max, syringex1);
}

function givetocontrol(PWM_min , PWM_max, syringex1 ) {
    var setupvalues = initializeSetup(PWM_min,PWM_max, 0.63, 3, 0.88, syringex1);
    var control_init = [];
    var disp = {};
    for (var j = 1; j != (parseInt(JSON.parse(localStorage.numberofdispensers) + 1)); j++) {
        disp.pwmtable = setupvalues.PWM_table;
        disp.pwmdic = setupvalues.PWM_dic;
        disp.ultable = setupvalues.uL_table;
        disp.uldic = setupvalues.uL_dic;
        disp.ulmax = setupvalues.uL_max;
        disp.ulmin = setupvalues.uL_min;
        disp.ulprecision = setupvalues.uL_precision;
        control_init.push(disp);
    }
//GIVE TO BECCA:
    // localStorage.control_initialization = control_init;
    localStorage.setItem('control_initialization', JSON.stringify(control_init));
}