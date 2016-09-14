/**
 * Created by rebeccawolf on 8/22/16.
 */

function sendDispense(sender){
    var form = sender.parentNode.parentNode;
    var volume = form.querySelector(".dispenseVol");
    var time = form.querySelector(".dispenseTime");
    // console.log(volume.value);
    // console.log(time.value);

    var dispenserID = sender.id;
    dispenserID = dispenserID.replace(/\D/g,'');

    var currentVolume = parseFloat(JSON.parse(localStorage.dispenserData)[dispenserID - 1]['Current_State']);
    
    // Hardware computations
    var create_table_outputs = create_uL_table(32.6);
    var PWM_table = create_table_outputs.PWM_table;
    var uL_table = create_table_outputs.uL_table;
    
    // store conversion tables to be accessed by other parts of dispense operations
    var storedConversions = JSON.parse(localStorage.dispenserConversions);
    var conversions = {};
    conversions = create_table_outputs.conversion_table;
    storedConversions[dispenserID] = JSON.stringify(conversions);
    localStorage.dispenserConversions = JSON.stringify(storedConversions);
    

    // update conversion chart for dispenser
    JSON.parse(localStorage.dispenserData)[dispenserID - 1]['conversion'] = conversions;

    var dispOrientation = JSON.parse(localStorage.dispenserData)[dispenserID - 1]['orientation'];
    var valueToDispense = 0;

    if(dispOrientation === "push"){
        valueToDispense = currentVolume - parseFloat(volume.value);
    }
    else {      // pull orientaion
        valueToDispense = currentVolume + parseFloat(volume.value);
    }

    // Will be defined when servo is selected in build/assembly
    var precision = parseFloat(JSON.parse(localStorage.dispenserData)[dispenserID - 1]['Precision']);
    PWMsteps = even_uL_steps(uL_table, PWM_table, precision, currentVolume, valueToDispense, time.value);   // [0] is seconds/step [1] is PWM value array to be sent

    // values needed for dispense rate
    var msecondsPerStep = PWMsteps[0] * 1000;
    var PWMvalueArray = PWMsteps[1];
    console.log(PWMvalueArray);
    
    // set correct dispenser to command
    localStorage.dispenserToControl = dispenserID;
    console.log("length: " + PWMvalueArray.length);
    
    // iterate over command array at appropriate time intervals
    for(i = 0; i < PWMvalueArray.length; i++){

        (function () {
            var iPrime = i;
            var dispenser_to_control = dispenserID;
            var tempVolumeIncrease = volume.value/(time.value/(msecondsPerStep/1000));
            setTimeout(function(){
                var temp = JSON.parse(localStorage.dispenserData);
                if(dispOrientation === "push"){
                    temp[dispenserID - 1]['Current_State'] = (parseFloat(temp[dispenserID - 1]['Current_State']) - parseFloat(time.value/(msecondsPerStep/1000))).toFixed(1).toString();
                }
                else {      // pull orientaion
                    temp[dispenserID - 1]['Current_State'] = (parseFloat(temp[dispenserID - 1]['Current_State']) + parseFloat(time.value/(msecondsPerStep/1000))).toFixed(1).toString();
                }
                localStorage.dispenserData = JSON.stringify(temp);
                sendCommandDispense(PWMvalueArray[iPrime]); 
                updateDispenseProgressBar(dispenser_to_control);
            }, i*msecondsPerStep);
        })();



        // updateDispenseProgressBar(dispenserID);

        // NEED TO SEND COMMAND WITH PWM VAL INSTEAD OF uL VALUE!!!!!!!!
        // if (JSON.parse(localStorage.dispenserData)[dispenserID - 1]['Current_State'] < JSON.parse(localStorage.dispenserData)[dispenserID - 1]['Max']) {
        //     // var temp = JSON.parse(localStorage.dispenserData);
        //     // temp[dispenserID - 1]['Current_State'] = (temp[dispenserID - 1]['Current_State'] + 0.25);
        //     // localStorage.dispenserData = JSON.stringify(temp);
        //     console.log(PWMvalueArray[i]));
        //     setInterval(sendCommandDispense(PWMvalueArray[i]), 6000);
        //     // updateDispenseProgressBar(dispenserID);
        // }
        // else {
        //     toastr.warning('You have already dispensed the full amount of this syringe.');
        // }
    }
    return false;
}

function changeDispenseOrientation(sender) {
    dispenserID = sender.id.replace(/\D/g,'');
    var temp = JSON.parse(localStorage.dispenserData);
    currentOrientation = sender.innerHTML;
    if (currentOrientation === "pull") {
        sender.innerHTML = "push";
        temp[dispenserID - 1]['orientation'] = "push";
        localStorage.dispenserData = JSON.stringify(temp);
    }
    else {      // currentOrientation === "push"
        sender.innerHTML = "pull";
        temp[dispenserID - 1]['orientation'] = "pull";
        localStorage.dispenserData = JSON.stringify(temp);
    }
    return false;
}