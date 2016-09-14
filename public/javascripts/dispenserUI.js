/**
 * Created by rebeccawolf on 8/22/16.
 */

function sendDispense(sender){

    // VALUES FROM THE FORM:
    var form = sender.parentNode.parentNode;
    var volume = form.querySelector(".dispenseVol");
    var time = form.querySelector(".dispenseTime");
    var dispenserID = sender.id;    // ID of dispenser you are controlling
    dispenserID = dispenserID.replace(/\D/g,'');
    // console.log(volume.value);
    // console.log(time.value);

    var currentVolume = parseFloat(JSON.parse(localStorage.dispenserData)[dispenserID - 1]['Current_State']);   // current volume state of selected syringe
    var precision = parseFloat(JSON.parse(localStorage.dispenserData)[dispenserID - 1]['Precision']);   // pull precision from settings table

    // Hardware computations
    var create_table_outputs = create_uL_table(32.6);
    var PWM_table = create_table_outputs.PWM_table;
    var uL_table = create_table_outputs.uL_table;
    var conversions = {};
    conversions = create_table_outputs.conversion_table;
    console.log('conversions: ');
    console.log(conversions);
    
    // store conversion tables to be accessed by other parts of dispense operations
    var storedConversions = JSON.parse(localStorage.dispenserConversions);  // load here so as not to overwrite tables already stored
    storedConversions[dispenserID] = JSON.stringify(conversions);   // update computed conversions in temp variable
    localStorage.dispenserConversions = JSON.stringify(storedConversions);  // store temp in localStorage

    var dispOrientation = JSON.parse(localStorage.dispenserData)[dispenserID - 1]['orientation'];   // determine whether is pull/push dispenser
    var valueToDispense;

    // COMPUTE VALUE TO PASS INTO even_uL_steps()
    if(dispOrientation === "push"){
        valueToDispense = currentVolume - parseFloat(volume.value);
    }
    else {      // pull orientaion
        valueToDispense = currentVolume + parseFloat(volume.value);
    }

    var even_uL_steps_output = even_uL_steps(uL_table, PWM_table, precision, currentVolume, valueToDispense, time.value);   // [0] is seconds/step [1] is PWM value array to be sent
    // values needed for dispense rate
    var msecondsPerStep = even_uL_steps_output.seconds_per_step * 1000; // must be in milliseconds
    var PWMvalueArray = even_uL_steps_output.PWM_values;
    var commandConversionTable = even_uL_steps_output.conversion_table; // conversions only for commands being sent at the moment (this way its easier to update the current volume)
    console.log('commandConversionTable: ');
    console.log(commandConversionTable);
    
    // set correct dispenser to command
    localStorage.dispenserToControl = dispenserID;
    console.log("Command arrray: ");
    console.log(PWMvalueArray);
    
    // iterate over command array at appropriate time intervals
    for(i = 0; i < PWMvalueArray.length; i++){

        (function () {
            // need to re-define some variables here due to scope
            var iPrime = i;
            var dispenser_to_control = dispenserID;
            setTimeout(function(){
                var temp = JSON.parse(localStorage.dispenserData);
                temp[dispenserID - 1]['Current_State'] = (commandConversionTable[PWMvalueArray[iPrime]]).toString();
                localStorage.dispenserData = JSON.stringify(temp);  // update local storage to correct new volume amount
                sendCommandDispense(PWMvalueArray[iPrime]);     // now send command
                updateDispenseProgressBar(dispenser_to_control);    // and update graphics
            }, i*msecondsPerStep);
        })();
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