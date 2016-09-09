/**
 * Created by Priya on 22/08/2016.
 */

localStorage.crankradius = 0.01875;
localStorage.pistonrod= 0.075;
localStorage.offset= 0.022;


var servoTable =
    [
        {
            "id":"A",
            "name":"FS5106B",
            "AD": 60,
            "thetaMax":157,
            "thetaMin": -13.6,
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
            "AD": 60,
            "thetaMax":170,
            "thetaMin": 0,
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
            "AD": 60,
            "thetaMax":170,
            "thetaMin": 0,
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
            "AD": 60,
            "thetaMax":170,
            "thetaMin": 0,
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
            "AD": 60,
            "thetaMax":170,
            "thetaMin": 0,
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
            "AD": 60,
            "thetaMax":170,
            "thetaMin": 0,
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
            "AD": 60,
            "thetaMax":170,
            "thetaMin": 0,
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
            "AD": 60,
            "thetaMax":170,
            "thetaMin": 0,
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
            "AD": 60,
            "thetaMax":170,
            "thetaMin": 0,
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
            "AD": 60,
            "thetaMax":170,
            "thetaMin": 0,
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
            "msRange": 1133.3,
            "deadbandwidth": 2,
            "cost": 39.99,
            "torque": 143,
            "speed": 0.23,
            "url": "https://www.servocity.com/hs-5645mg-servo"
        },
        {
            "id": "M",
            "name": "HS-805BB",
            "AD": 60,
            "thetaMax": 170,
            "thetaMin": 0,
            "msRange": 1133.3,
            "deadbandwidth": 2,
            "cost": 39.99,
            "torque": 143,
            "speed": 0.23,
            "url": "https://www.servocity.com/hs-5645mg-servo"
        }

];

//1 * 10^-9 m3 = 1 microLitre
//Find x1 such that Area*x1= 1*10^-9 m3
//So x1 = (1 * 10^-9)/Area

var syringeTable =
    [
        {
            "ids": "1",
            "volume (ml)": 3,
            "area": 0.091297,
            "x1": 0.00001752521989,
            "costs": 12,
            "url": "http://www.harvardapparatus.com/pumps-liquid-handling/syringes/plastic-syringes/plastic-syringes.html"
        },
        {
            "ids": "2",
            "volume": 5,
            "area": 0.177059,
            "x1": 0.000009036535843,
            "costs": 22,
            "url": "http://www.harvardapparatus.com/pumps-liquid-handling/syringes/plastic-syringes/plastic-syringes.html"
        },
        {
            "ids": "3",
            "volume": 10,
            "area": 0.255952,
            "x1": 0.000006251172094,
            "costs": 18,
            "url": "http://www.harvardapparatus.com/pumps-liquid-handling/syringes/plastic-syringes/plastic-syringes.html"
        },
        {
            "ids": "4",
            "volume": 20,
            "area": 0.445505,
            "x1": 0.00000359142995,
            "costs": 23,
            "url": "http://www.harvardapparatus.com/pumps-liquid-handling/syringes/plastic-syringes/plastic-syringes.html"
        },
        {
            "ids": "5",
            "volume": 30,
            "area": 0.573247,
            "x1": 0.000002791117965,
            "costs": 48,
            "url": "http://www.harvardapparatus.com/pumps-liquid-handling/syringes/plastic-syringes/plastic-syringes.html"
        },
        {
            "ids": "6",
            "volume": 60,
            "area": 0.867851,
            "x1": 0.000001843634448,
            "costs": 32,
            "url": "http://www.harvardapparatus.com/pumps-liquid-handling/syringes/plastic-syringes/plastic-syringes.html"
        }
        // ,
        // {
        //     "ids": "7",
        //     "volume": 5,
        //     "x1": 0.00005,
        //     "costs": 191,
        //     "url": "something.html"
        // },
        // {
        //     "ids": "8",
        //     "volume": 5,
        //     "x1": 0.00005,
        //     "costs": 6.69,
        //     "url": "https://www.amazon.com/Pack-BDTM-Dispensing-Syringe-needle/dp/B00FUO2X06/ref=sr_1_3_a_it?ie=UTF8&qid=1471893798&sr=8-3&keywords=5ml+syringe"
        // },
        // {
        //     "ids": "9",
        //     "volume": 5,
        //     "x1": 0.00005,
        //     "costs": 18.98,
        //     "url": "https://www.amazon.com/Syringes-Without-Needle-Syringe-MEDINT/dp/B00ZB51JCM/ref=sr_1_4_a_it?ie=UTF8&qid=1471893798&sr=8-4&keywords=5ml+syringe"
        // },
        // {
        //     "ids": "10",
        //     "volume": 20,
        //     "x1": 0.000067,
        //     "costs": 5.99,
        //     "url": "https://www.amazon.com/Pack-20ML-20CC-Syringe-needle/dp/B00FHLEV02/ref=sr_1_4_a_it?ie=UTF8&qid=1471894056&sr=8-4&keywords=20+ml+syringe"
        // },
        // {
        //     "ids": "11",
        //     "volume": 50,
        //     "x1": 0.0006,
        //     "costs": 6.99,
        //     "url": "https://www.amazon.com/Karlling-Syringe-Nutrient-Measuring-Handy/dp/B013DHJRPU/ref=sr_1_3?ie=UTF8&qid=1471894338&sr=8-3&keywords=50+ml+syringe"
        // },
        // {
        //     "ids": "12",
        //     "volume": 60,
        //     "x1": 0.000005,
        //     "costs": 5.95,
        //     "url": "https://www.amazon.com/EXELint-Disposable-Syringe-Sterile-Catheter/dp/B010BWOOXA/ref=sr_1_1_a_it?ie=UTF8&qid=1471894121&sr=8-1&keywords=50+ml+syringe"
        // }
    ];



function calculateRecommended() {
    var arr = [];

// Iterate through syringes 1-12
// Iterate through servos A-L
// Calculate Vc and Pc
// If Vc>=V and Pc<=P then save servo and syringe into table

    for (var key in servoTable) {
        if (servoTable.hasOwnProperty(key)) {

            var servoID = servoTable[key].id;
            // console.log("Servo id : " + servoID);
            var x1 = localStorage.crankradius * Math.cos(servoTable[key].thetaMax) + Math.sqrt((localStorage.pistonrod) ^ 2 - (localStorage.crankradius * Math.sin(servoTable[key].thetaMax) + localStorage.offset) ^ 2);
            var x2 = localStorage.crankradius * Math.cos(servoTable[key].thetaMin) + Math.sqrt((localStorage.pistonrod) ^ 2 - (localStorage.crankradius * Math.sin(servoTable[key].thetaMin) + localStorage.offset) ^ 2);
            var xtotal = Math.abs(x1 - x2);
            var pwm = servoTable[key].msRange * servoTable[key].AD * 0.004095;
            var deltax = xtotal / pwm;
            var servocost = servoTable[key].cost;
        }

        for (var key2 in syringeTable) {
            if (syringeTable.hasOwnProperty(key2)) {
                //loop through syringes

                var syringeID = syringeTable[key2].ids;
                // console.log("Syringe id : " + syringeID);
                var syringex1 = syringeTable[key2].x1 * 1000;
                // console.log("MY SYRINGE X1: " + syringex1);
                var syringevolume = syringeTable[key2].volume;
                var syringecost = syringeTable[key2].costs;

                // console.log("Volume required: " + localStorage.volume);
                // console.log("Volume we have which is greater than or equal to previous: " + syringevolume);
                // console.log("Volume in calculation: " + localStorage.volume);
                // console.log("Volume xtotal/x1 which is greater than or equal to previous: " + xtotal / syringex1);
                // console.log("Precision in calculation: " + deltax / syringex1);
                // console.log("Precision xtotal/x1 which is greater than or equal to previous: " + localStorage.precision);

                // Add inside the if statement:
                // xtotal / syringex1 >= localStorage.volume
                if (localStorage.volume <= syringevolume && xtotal / syringex1 >= localStorage.volume && deltax / syringex1 <= localStorage.precision) {
                    //Save servo syringe combo in array
                    console.log("Servo ID passed: " + servoID);
                    console.log("Syringe ID passed: " + syringeID);
                    var singlestage = {};
                    singlestage.servoID = servoID;
                    singlestage.syringeID = syringeID;
                    singlestage.v = xtotal / syringex1;
                    singlestage.p = deltax / syringex1;
                    singlestage.cost = servocost + syringecost;
                    arr.push(singlestage);
                }
            }
        }

    }


// Iterate through table of acceptable combos
// Then find lowest cost -> lowest cost
// Then find highest Pc -> highest tolerance
// Then find greatest v -> greatest volume

    console.log("-----------------------------------------");
    var lowestcost = 1000;
    var lowestservo = "";
    var lowestsyringe = "";
    var highestprecision = 0;
    var pservo = "";
    var psyringe = "";
    var largestvolume = 0;
    var vservo = "";
    var vsyringe = "";


    for (var key in arr) {
        if (arr.hasOwnProperty(key)) {
            // for (var j = 0; j < i+1; j++){
            if (arr[key].cost < lowestcost) {
                lowestcost = arr[key].cost;
                lowestservo = arr[key].servoID;
                lowestsyringe = arr[key].syringeID;
            }
            if (arr[key].p > highestprecision) {
                highestprecision = arr[key].p;
                pservo = arr[key].servoID;
                psyringe = arr[key].syringeID;
            }
            if (arr[key].v > largestvolume) {
                largestvolume = arr[key].v;
                vservo = arr[key].servoID;
                vsyringe = arr[key].syringeID;
            }

        }
    }

    if (lowestcost== 1000 || largestvolume == 0 || highestprecision ==0) {
        $("#rstats").text("Sorry! No combinations found. Please return to the previous tab to re-enter values, or click the blue link below to create your own custom set up.");
        $("#vstats").text("Sorry! No combinations found. Please return to the previous tab to re-enter values, or click the blue link below to create your own custom set up.");
        $("#tstats").text("Sorry! No combinations found. Please return to the previous tab to re-enter values, or click the blue link below to create your own custom set up.");
    }
    else {
        console.log('Lowest cost is: ' + lowestcost + ' with servo number ' + lowestservo + ' and syringe number ' + lowestsyringe);
        console.log('Highest p is: ' + highestprecision + ' with servo number ' + pservo + ' and syringe number ' + psyringe);
        console.log('Largest v accuracy is: ' + largestvolume + ' with servo number ' + vservo + ' and syringe number ' + vsyringe);

        var lowestServoObject = getObjects(servoTable, 'id', lowestservo);
        var lowestSyringeObject = getObjects(syringeTable, 'ids', lowestsyringe);
        var largestVServo = getObjects(servoTable, 'id', vservo);
        var largestVSyringe = getObjects(syringeTable, 'ids', vsyringe);
        var highestPServo = getObjects(servoTable, 'id', pservo);
        var highestPSyringe = getObjects(syringeTable, 'ids', psyringe);

        // TEXT

        $("#rstats").text("The " + lowestServoObject[0].name + " servo and " + lowestSyringeObject[0].volume + "ml syringe combination has cost of $" + lowestcost + " (as of Sept 2016), which makes it the cheapest option.");
        $("#rservo").text("Servo Datasheet: " + lowestServoObject[0].url);
        $("#rsyringe").text("Syringe Information: " + lowestSyringeObject[0].url);

        $("#vstats").text("The " + largestVServo[0].name + " servo and " + largestVSyringe[0].volume + "ml syringe combination has a volume capacity of " + largestvolume + " (as of Sept 2016), which makes it the best in this category.");
        $("#vservo").text("Servo Datasheet: " + largestVServo[0].url);
        $("#vsyringe").text("Syringe Information: " + largestVSyringe[0].url);

        $("#tstats").text("The " + highestPServo[0].name + " servo and " + highestPSyringe[0].volume + "ml syringe combination has a tolerance/precision level of " + highestprecision + " (as of Sept 2016), which makes it the most accurate servo-syringe combination.");
        $("#tservo").text("Servo Datasheet: " + highestPServo[0].url);
        $("#tsyringe").text("Syringe Information: " + highestPSyringe[0].url);


        // IMAGES

        //rservoimage, vservoimage, tservoimage
        //rsyringeimage, vsyringeimage, tsyringeimage

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