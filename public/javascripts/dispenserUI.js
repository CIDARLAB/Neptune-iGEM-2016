/**
 * Created by rebeccawolf on 8/22/16.
 */

function sendDispense(sender){
    // console.log("hello from " + sender.id);
    var form = sender.parentNode.parentNode;
    var volume = form.querySelector(".dispenseVol");
    var time = form.querySelector(".dispenseTime");
    // console.log(volume.value);
    // console.log(time.value);

    var dispenserID = sender.id;
    dispenserID = dispenserID.replace(/\D/g,'');
    console.log(dispenserID);

    var currentVolume = JSON.parse(localStorage.dispenserData)[dispenserID - 1]['Current_State'];


    var create_table_outputs = create_uL_table(32.6);
    var PWM_table = create_table_outputs.PWM_table;
    var uL_table = create_table_outputs.uL_table;
    even_uL_steps(1, uL_table, PWM_table, 32.6, currentVolume, volume.value, time.value);
    
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