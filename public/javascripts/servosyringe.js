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
        }

];


var syringeTable =
    [
        {
            "ids": "1",
            "volume (ml)": 1,
            "x1": 0.0001,
            "costs": 4.99,
            "url": "https://www.amazon.com/Duda-Energy-Syringepk001-Industrial-Syringes/dp/B00NDETMR2/ref=sr_1_2?ie=UTF8&qid=1471892958&sr=8-2&keywords=1ml+syringe"
        },
        {
            "ids": "2",
            "volume": 1,
            "x1": 0.0001,
            "costs": 11.9,
            "url": "https://www.amazon.com/Easy-Glide-Luer-Syringe-Needle/dp/B00XZ96DOA/ref=sr_1_1_a_it?ie=UTF8&qid=1471892958&sr=8-1&keywords=1ml+syringe"
        },
        {
            "ids": "3",
            "volume": 1,
            "x1": 0.00005,
            "costs": 34.11,
            "url": "https://www.amazon.com/04-04-02-01-Borosilicate-Reusable-Capacity-Graduation/dp/B00S4IH2EC/ref=sr_1_1?ie=UTF8&qid=1471887726&sr=8-1&keywords=0.1ml+syringe"
        },
        {
            "ids": "4",
            "volume": 3,
            "x1": 0.000067,
            "costs": 6.99,
            "url": "https://www.amazon.com/Duda-Energy-Syringepk003-Industrial-Syringes/dp/B00DXPQIFU/ref=sr_1_5?ie=UTF8&qid=1471893400&sr=8-5&keywords=3ml+syringe"
        },
        {
            "ids": "5",
            "volume": 3,
            "x1": 0.0000125,
            "costs": 4.99,
            "url": "https://www.amazon.com/10-Pack-Syringe-Tipped-Storage/dp/B01D6D3Y14/ref=sr_1_7?ie=UTF8&qid=1471893400&sr=8-7&keywords=3ml+syringe"
        },
        {
            "ids": "6",
            "volume": 3,
            "x1": 0.0000125,
            "costs": 7.99,
            "url": "https://www.amazon.com/Industrial-Syringes-Long-Needles-Protective/dp/B00NT35ZVO/ref=sr_1_11?ie=UTF8&qid=1471893400&sr=8-11&keywords=3ml+syringe"
        },
        {
            "ids": "7",
            "volume": 5,
            "x1": 0.00005,
            "costs": 5.36,
            "url": "https://www.amazon.com/Pack-TSP-Slip-Syringes-needle/dp/B00EXXZSTI/ref=sr_1_2_a_it?ie=UTF8&qid=1471893798&sr=8-2&keywords=5ml+syringe"
        },
        {
            "ids": "8",
            "volume": 5,
            "x1": 0.00005,
            "costs": 6.69,
            "url": "https://www.amazon.com/Pack-BDTM-Dispensing-Syringe-needle/dp/B00FUO2X06/ref=sr_1_3_a_it?ie=UTF8&qid=1471893798&sr=8-3&keywords=5ml+syringe"
        },
        {
            "ids": "9",
            "volume": 5,
            "x1": 0.00005,
            "costs": 18.98,
            "url": "https://www.amazon.com/Syringes-Without-Needle-Syringe-MEDINT/dp/B00ZB51JCM/ref=sr_1_4_a_it?ie=UTF8&qid=1471893798&sr=8-4&keywords=5ml+syringe"
        },
        {
            "ids": "10",
            "volume": 20,
            "x1": 0.000067,
            "costs": 5.99,
            "url": "https://www.amazon.com/Pack-20ML-20CC-Syringe-needle/dp/B00FHLEV02/ref=sr_1_4_a_it?ie=UTF8&qid=1471894056&sr=8-4&keywords=20+ml+syringe"
        },
        {
            "ids": "11",
            "volume": 50,
            "x1": 0.0006,
            "costs": 6.99,
            "url": "https://www.amazon.com/Karlling-Syringe-Nutrient-Measuring-Handy/dp/B013DHJRPU/ref=sr_1_3?ie=UTF8&qid=1471894338&sr=8-3&keywords=50+ml+syringe"
        },
        {
            "ids": "12",
            "volume": 60,
            "x1": 0.000005,
            "costs": 5.95,
            "url": "https://www.amazon.com/EXELint-Disposable-Syringe-Sterile-Catheter/dp/B010BWOOXA/ref=sr_1_1_a_it?ie=UTF8&qid=1471894121&sr=8-1&keywords=50+ml+syringe"
        }
    ];



function calculateRecommended() {
    var arr = [];
    var i = 0;

// Iterate through syringes 1-12
// Iterate through servos A-L
// Calculate Vc and Pc
// If Vc>=V and Pc<=P then save servo and syringe into table

for (var key in servoTable) {
    if (servoTable.hasOwnProperty(key)){

        var servoID = servoTable[key].id;
        console.log ("Servo id : " + servoID);
        var x1 =localStorage.crankradius * Math.cos(servoTable[key].thetaMax) + Math.sqrt((localStorage.pistonrod)^2 - (localStorage.crankradius* Math.sin(servoTable[key].thetaMax) + localStorage.offset)^2);
        var x2 =localStorage.crankradius * Math.cos(servoTable[key].thetaMin) + Math.sqrt((localStorage.pistonrod)^2 - (localStorage.crankradius* Math.sin(servoTable[key].thetaMin) + localStorage.offset)^2);
        var xtotal = Math.abs(x1-x2);
        var pwm = servoTable[key].msRange * servoTable[key].AD * 0.004095;
        var deltax = xtotal/pwm;
        var servocost = servoTable[key].cost;
    }

    for (var key2 in syringeTable) {
        if (syringeTable.hasOwnProperty(key2)) {
                //loop through syringes

                var syringeID = syringeTable[key2].ids;
                console.log("Syringe id : " + syringeID);
                var syringex1 = syringeTable[key2].x1;
                var syringevolume = syringeTable[key2].volume;
                var syringecost = syringeTable[key2].costs;

                if (localStorage.volume <= syringevolume && xtotal / x1 >= localStorage.volume && deltax / x1 <= localStorage.precision) {
                    //Save servo syringe combo in array
                    console.log("Servo ID passed: " + servoID);
                    console.log("Syringe ID passed: " + syringeID);
                    arr[i].servoID = servoID;
                    arr[i].syringeID = syringeID;
                    arr[i].v = xtotal / syringex1;
                    arr[i].p = deltax / syringex1;
                    arr[i].cost = servocost + syringecost;
                    i++;
                }
            }
        }

}


// Iterate through table of acceptable combos
// Then find lowest cost -> lowest cost
// Then find highest Pc -> highest tolerance
// Then find greatest v -> greatest volume

console.log("Done with calculations. Moving on to find lowest cost, highest tolerance, and greatest volume");
var lowestcost = 1000;
    var lowestservo = "";
    var lowestsyringe= "";
var highestprecision = 0;
    var pservo = "";
    var psyringe= "";
var largestvolume = 0;
    var vservo = "";
    var vsyringe= "";

    for (var j = 0; j < i+1; j++){
        if (arr[j].cost < lowestcost) {
            lowestcost= arr[j].cost;
            lowestservo= arr[j].servoID;
            lowestsyringe= arr[j].syringeID;
        }
        if (arr[j].p > highestprecision) {
            highestprecision = arr[j].p;
            pservo= arr[j].servoID;
            psyringe= arr[j].syringeID;
        }
        if (arr[j].v > largestvolume) {
            largestvolume = arr[j].v;
            vservo= arr[j].servoID;
            vsyringe= arr[j].syringeID;
        }
    }

    console.log('Lowest cost is: ' + lowestcost);
    console.log('Highest p is: ' + highestprecision);
    console.log('Largest v is: ' + largestvolume);



}

//localStorage.precision
//localStorage.volume
//JSON.stringify
//JSON.parse