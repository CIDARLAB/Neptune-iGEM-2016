/**
 * Created by rebeccawolf on 8/22/16. DIspenserUI
 */

function sendDispense(sender){

    // VALUES FROM THE FORM:
    var form = sender.parentNode.parentNode;
    var volume = form.querySelector(".dispenseVol");
    var time = form.querySelector(".dispenseTime");
    var dispenserID = sender.id;    // ID of dispenser you are controlling
    dispenserID = dispenserID.replace(/\D/g,'');
    // console.log((JSON.parse(localStorage.dispenserData)[dispenserID])[HW_pin]);
    // console.log(volume.value);
    // console.log(time.value);

    if(isNaN(volume.value)){
        toastr.error("Please enter a valid number for dispense volume.");
        return false;
    }
    else if (isNaN(time.value)){
        toastr.error("Please enter a valid number for dispense time.");
        return false;
    }
    else{
        var currentVolume = parseFloat(JSON.parse(localStorage.dispenserData)[dispenserID - 1]['Current_State']);   // current volume state of selected syringe
        // var precision = parseFloat(JSON.parse(localStorage.dispenserData)[dispenserID - 1]['Precision']);   // pull precision from settings table

        // Hardware computations
        var initializeSetup_outputs = initializeSetup(180,460,0.69,3,0.88,0.25);
        var PWM_table = initializeSetup_outputs.PWM_table;
        var PWM_dic = initializeSetup_outputs.PWM_dic;
        var uL_table = initializeSetup_outputs.uL_table;
        var uL_dic = initializeSetup_outputs.uL_dic;
        // var theta_min = initializeSetup_outputs.theta_min;
        // var theta_max = initializeSetup_outputs.theta_max;
        // var X_min = initializeSetup_outputs.X_min;
        // var X_max = initializeSetup_outputs.X_max;
        var uL_min = initializeSetup_outputs.uL_min;
        var uL_max = initializeSetup_outputs.uL_max;
        var uL_precision = initializeSetup_outputs.uL_precision;
        // var r = initializeSetup_outputs.r;
        // var b = initializeSetup_outputs.b;
        // var d = initializeSetup_outputs.d;
        // var a = initializeSetup_outputs.a;
        console.log('conversions (PWM and uL): ');
        console.log(PWM_table);
        console.log(uL_table);


        var temp = JSON.parse(localStorage.dispenserData);
        temp[dispenserID - 1]['Min'] = (uL_min).toString();
        temp[dispenserID - 1]['Max'] = (uL_max).toString();
        localStorage.dispenserData = JSON.stringify(temp);

        // store conversion tables to be accessed by other parts of dispense operations
        var storedConversions = JSON.parse(localStorage.dispenserConversions);  // load here so as not to overwrite tables already stored
        storedConversions[dispenserID] = JSON.stringify(uL_table);   // update computed conversions in temp variable
        localStorage.dispenserConversions = JSON.stringify(storedConversions);  // store temp in localStorage
        // console.log("uL table: ");
        // console.log(uL_table);

        var dispOrientation = JSON.parse(localStorage.dispenserData)[dispenserID - 1]['orientation'];   // determine whether is pull/push dispenser
        var valueToDispense;

        // COMPUTE VALUE TO PASS INTO even_uL_steps()
        if(dispOrientation === "push"){
            valueToDispense = currentVolume - parseFloat(volume.value);
            if(valueToDispense < 0){
                toastr.error("Requested dispense volume exceedes remaining syringe volume");
            }
        }
        else {      // pull orientaion
            valueToDispense = currentVolume + parseFloat(volume.value);
            if(valueToDispense >= (parseFloat(temp[dispenserID - 1]['Max']) - parseFloat(temp[dispenserID - 1]['Current_State']))){
                toastr.error("Requested dispense volume exceedes remaining syringe volume");
            }
        }

        var even_uL_steps_output = even_uL_steps(uL_table, PWM_table, uL_precision, currentVolume, valueToDispense, time.value);   // [0] is seconds/step [1] is PWM value array to be sent
        // values needed for dispense rate
        var msecondsPerStep = even_uL_steps_output.seconds_per_step * 1000; // must be in milliseconds
        // console.log("step per sec: " + (1/msecondsPerStep));
        var stepsPerSecond = even_uL_steps_output.steps_per_second; // conversions only for commands being sent at the moment (this way its easier to update the current volume)
        var PWMvalueArray = even_uL_steps_output.PWM_values;
        // console.log("even steps array: ");
        // console.log(PWMvalueArray);

        // set correct dispenser to command
        localStorage.dispenserToControl = dispenserID;
        // console.log("Command arrray: ");
        // console.log(PWMvalueArray);

        // iterate over command array at appropriate time intervals
        for(i = 0; i < PWMvalueArray.length; i++){

            (function () {
                // need to re-define some variables here due to scope
                var iPrime = i;
                var dispenser_to_control = dispenserID;
                setTimeout(function(){
                    var temp = JSON.parse(localStorage.dispenserData);
                    temp[dispenserID - 1]['Current_State'] = (PWM_dic[PWMvalueArray[iPrime]]).toString();
                    localStorage.dispenserData = JSON.stringify(temp);  // update local storage to correct new volume amount
                    sendCommandDispense(PWMvalueArray[iPrime], dispenser_to_control);     // now send command
                    updateDispenseProgressBar(dispenser_to_control);    // and update graphics
                }, i*msecondsPerStep);
            })();
        }
        return false;
    }
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