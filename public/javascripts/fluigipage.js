ShieldIndex = 0;
PinIndex = 0;
deviceCount = 0;

// FUNCTIONALITY FOR VALVE DATA TRACKING AND COMMANDS
function setNumberOfPumps_JSON() {
    localStorage.pumps = JSON.parse(localStorage.portXcoords).length;
    var set_pumpData_newNum = [];
    var j = 1;  //  hardware pin (goes from 1 to 12)
    for (var i = 1; i <= localStorage.pumps; i++) {

        deviceCount = i;
        var singleStage2 = {id: i, HW_shield: (Math.floor(i/12) + 1), HW_pin: j, Open_State: 0, Closed_State: 0, Current_State: 'opened', deviceIndex: deviceCount};
        set_pumpData_newNum.push(singleStage2);
        j = j + 1;
        if(j == 13) {
            j = 1;
        }
        ShieldIndex = i;
        PinIndex = j;
    }
    var DataToLoad = set_pumpData_newNum;
    localStorage.clear_toggle = true;
    localStorage.unsavedData = JSON.stringify(DataToLoad);
    localStorage.pumpData = JSON.stringify(DataToLoad);
    localStorage.pumpInitial = "FALSE";
}
function clearPumpData() {
    deviceCount=0;
    var c_pumpData = [];
    var j = 1;  //  hardware pin (goes from 1 to 12)
    for (var i = 1; i <= localStorage.pumps; i++)
    {
        deviceCount = i;
        var singleStage = {id: i, HW_shield: (Math.floor(i/12) + 1), HW_pin: j, Open_State: 0, Closed_State: 0, Current_State: 'opened', deviceIndex: deviceCount};
        c_pumpData.push(singleStage);

        j = j + 1;
        if(j == 13) {
            j = 1;
        }

    }
    return JSON.stringify(c_pumpData);
}
function flipFlop_valveState(valve_to_control) {
    localStorage.portToControl = valve_to_control;
    if (JSON.parse(localStorage.valveData)[valve_to_control - 1]['Physical_State'] == 0) {
        var temp = JSON.parse(localStorage.valveData);//[valve_to_control]['Physical_State'] = 1;
        temp[valve_to_control - 1]['Physical_State'] = 1;
        localStorage.valveData = JSON.stringify(temp);
    }
    else {
        var temp = JSON.parse(localStorage.valveData);//[valve_to_control]['Physical_State'] = 1;
        temp[valve_to_control - 1]['Physical_State'] = 0;
        localStorage.valveData = JSON.stringify(temp);
    }
    sendCommand();
    return false;
}
function wrap_data_for_Arduino() {
    // var valve_to_control = (document.getElementById("ValveNumberSelector").value);
    var valve_to_control = localStorage.portToControl;
    var temp = JSON.parse(localStorage.pumpData);
    var deviceNum = temp[valve_to_control - 1]['deviceIndex'];

    localStorage.MasterData = combine_pumpData_valveData();

    var data_for_selected_object = JSON.parse(localStorage.MasterData);
    var open_state_parameter = data_for_selected_object[valve_to_control - 1]['State']['Open_State'];
    var closed_state_parameter = data_for_selected_object[valve_to_control - 1]['State']['Closed_State'];
    var physical_state_parameter = data_for_selected_object[valve_to_control - 1]['State']['Physical_State'];

    if (physical_state_parameter == 1)
    {
        var PWMval = open_state_parameter;
    }
    else
    {
        var PWMval = closed_state_parameter;
    }

    // FIRST, PAD THE VALVE_TO_CONTROL WITH 0's SUCH THAT THE VALUE IS 3 CHARACTERS LONG
    var valve_to_control_padded = zeroFill(deviceNum,4);
    // SECOND, PAD THE PWM VALUE WITH 0's SUCH THAT THE VALUE IS 4 CHARACTERS LONG
    var PWMval_padded = zeroFill(PWMval,4);
    // CONCAT THE VALVE NUMBER AND PWM VALUE
    var pre_command = valve_to_control_padded.concat(PWMval_padded);
    // ADD A START CODON TO SIGNIFY THE BEGINING OF SIGNAL
    var startStr = '';
    var pre_command_s = startStr.concat(pre_command);
    // ADD A STOP CODON TO SIGNIFY THE END OF SIGNAL
    var command = pre_command_s.concat('\n');
    // RETURN THE DATA
    return command;
}
function sendCommand() {
    var command = wrap_data_for_Arduino();
    var message = "Sending to Arduino: ";
    var command_info = message.concat(command);
    // --- Include code to serial.write() the command to the Arduino here --- //
    toastr.info(command_info);
    console.log(command);
    localStorage.setItem('myCommand', command);
    $.ajax(
        {
            url: "/serialcommunication/send", type: 'POST', async: true,
            data: {
                commandData: command
            },
            success: function (response) {
            },
            error: function (response) {
            }
        });
}
function inititateValveStates() {
    var init_valveState = [];
    for( var i = 1; i <= localStorage.pumps; i++)
    {
        var singleStage = {id:i, Physical_State:0, Valve_Number:i};
        init_valveState.push(singleStage);
    }
    return JSON.stringify(init_valveState);
}
function combine_pumpData_valveData() {
    var master_data = [];
    for (var i = 0; i < localStorage.pumps; i++)
    {
        var open_state_singleInstance = (JSON.parse(localStorage.pumpData))[i]['Open_State'];
        var closed_state_singleInstance = (JSON.parse(localStorage.pumpData))[i]['Closed_State'];
        var physical_state_singleInstance = (JSON.parse(localStorage.valveData))[i]['Physical_State'];
        var singleStage = {id:i, State:{Open_State:open_state_singleInstance,Closed_State:closed_state_singleInstance,Physical_State:physical_state_singleInstance}, Number:i};
        master_data.push(singleStage);

    }
    return JSON.stringify(master_data);
}
// ./ END VALVE FUNCTIONS

// FUNCTIONALITY FOR DISPENSER DATA TRACKING AND COMMANDS
function clearDispenserData() {
    var dispenserData = [];
    var j = PinIndex;  //  hardware pin (goes from 1 to 12)
    var shield = ShieldIndex;
    for (var i = 1; i <= localStorage.Dispensers; i++)
    {
        deviceCount = deviceCount + 1;
        var singleStage = {id: i, HW_shield: (Math.floor(shield/12) + 1), HW_pin: j, Precision: 0, Min: 0, Max: 0, Current_State: 0, orientation: "pull", deviceIndex: deviceCount};
        dispenserData.push(singleStage);
        j = j + 1;
        if(j == 13) {
            j = 1;
        }
    }
    return JSON.stringify(dispenserData);
}
function setNumberOfDispensers_JSON() {
    localStorage.Dispensers = JSON.parse(localStorage.portXcoordsDisp).length;
    var set_dispData_newNum = [];
    var j = PinIndex;  //  hardware pin (goes from 1 to 12)
    var shield = ShieldIndex;
    for (var i = 1; i <= localStorage.Dispensers; i++) {
        deviceCount = deviceCount + 1;
        var tempDispense = {id: i, HW_shield: (Math.floor(shield/12) + 1), HW_pin: j, Precision: 0, Min: 0, Max: 0, Current_State: 0, orientation: "pull", deviceIndex: deviceCount};
        set_dispData_newNum.push(tempDispense);
        j = j + 1;
        if(j == 13) {
            j = 1;
        }
        ShieldIndex = i;
        PinIndex = j;
    }
    localStorage.dispenserData = JSON.stringify(set_dispData_newNum);
    localStorage.dispenserInitial = "FALSE";

}

function incrementDispenserPosition(dispenser_to_control) {
    // identify which dispenser you are sending command to
    localStorage.dispenserToControl = dispenser_to_control;
    // see if already maxed out at highest position
    if (parseFloat(JSON.parse(localStorage.dispenserData)[dispenser_to_control - 1]['Current_State']) <= parseFloat(JSON.parse(localStorage.dispenserData)[dispenser_to_control - 1]['Max'])) {
        var conversionTable = JSON.parse(JSON.parse(localStorage.getItem("dispenserConversions"))[dispenser_to_control]);   // conversion table for specific dispenser you are controlling

        var temp = JSON.parse(localStorage.dispenserData);
        var index = parseFloat(temp[dispenser_to_control - 1]['Current_State']);    // current uL state
        // var PWMcurrent = conversionTable[index];   // find the PWM value which corresponds to the mL value chosen to send to arduino
        var foundIndex = false;
        var nextuL = 0;
        var nextPWM = 0;
        // figure out which is the next increment of uL value we can dispenser from the conversion table
        for(var uL=0; uL <= (conversionTable.length); uL = (uL + 2)){
            if(foundIndex == true){
                nextuL = conversionTable[uL];   // note the next uL value to send
                nextPWM = conversionTable[(uL + 1)];
                break;
            }
            if(conversionTable[uL] == index){
                foundIndex = true;
            }
            if(conversionTable[uL] > index){ // surpassed current value, send this one!!
                nextuL = conversionTable[uL];
                nextPWM = conversionTable[(uL + 1)];
                break;
            }
        }
        nextPWM = (nextPWM).toFixed(0);


        // set current state to one which corresponds to a value in conversion table
        temp[dispenser_to_control - 1]['Current_State'] = (nextuL).toString();
        localStorage.dispenserData = JSON.stringify(temp);

        sendCommandDispense(nextPWM);
        updateDispenseProgressBar(dispenser_to_control);
    }
    else {
        toastr.warning('You have already dispensed the full amount of this syringe.');
    }
    return false;
}

function decrementDispenserPosition(dispenser_to_control) {
    localStorage.dispenserToControl = dispenser_to_control;
    // assumes the capacity of the syringe is 9 mL
    if (parseFloat(JSON.parse(localStorage.dispenserData)[dispenser_to_control - 1]['Current_State']) > parseFloat(JSON.parse(localStorage.dispenserData)[dispenser_to_control - 1]['Min'])) {
        var conversionTable = JSON.parse(JSON.parse(localStorage.getItem("dispenserConversions"))[dispenser_to_control]);   // conversion table for specific dispenser you are controlling

        var temp = JSON.parse(localStorage.dispenserData);
        var index = parseFloat(temp[dispenser_to_control - 1]['Current_State']);    // current uL state
        var foundIndex = false;
        var nextuL = 0;
        var nextPWM = 0;


        // figure out which is the next increment of uL value we can dispenser from the conversion table
        for(var uL= (conversionTable.length - 2); uL >= 0; uL = (uL - 2)){
            if(foundIndex == true){
                nextuL = conversionTable[uL];   // note the next uL value to send
                nextPWM = conversionTable[(uL + 1)];
                break;
            }
            if(conversionTable[uL] == index){
                foundIndex = true;
            }
            if(conversionTable[uL] < index){ // surpassed current value, send this one!!
                nextuL = conversionTable[uL];
                nextPWM = conversionTable[(uL + 1)];
                break;
            }
        }
        nextPWM = (nextPWM).toFixed(0);

        // set current state to one which corresponds to a value in conversion table
        temp[dispenser_to_control - 1]['Current_State'] = (nextuL).toString();
        localStorage.dispenserData = JSON.stringify(temp);

        sendCommandDispense(nextPWM);
        updateDispenseProgressBar(dispenser_to_control);
    }
    else {
        toastr.warning('You have reached minimum volume capacity.');
    }
    return false;
}

function wrap_data_for_Arduino_Dispense(PWM) {
    var dispenser_to_control = localStorage.dispenserToControl;
    var temp = JSON.parse(localStorage.dispenserData);
    var deviceNum = temp[dispenser_to_control - 1]['deviceIndex'];
    
    // FIRST, PAD VALUES WITH 0's SUCH THAT THE VALUE IS 3 CHARACTERS LONG
    var dispenser_to_control_padded = zeroFill(deviceNum, 4);
    var PWMval_padded = zeroFill(PWM, 4);
    // CONCAT THE VALVE NUMBER AND PWM VALUE
    var pre_command = dispenser_to_control_padded.concat(PWMval_padded);
    // ADD A START CODON TO SIGNIFY THE BEGINING OF SIGNAL
    var startStr = '';
    var pre_command_s = startStr.concat(pre_command);
    // ADD A STOP CODON TO SIGNIFY THE END OF SIGNAL
    var command = pre_command_s.concat('\n');
    // RETURN THE DATA
    return command;
}
function sendCommandDispense(PWM) {
    var command = wrap_data_for_Arduino_Dispense(PWM);
    var message = "Sending to Arduino: ";
    var command_info = message.concat(command);
    // --- Include code to serial.write() the command to the Arduino here --- //
    toastr.info(command_info);
    // writeToSerialConsole(command_info);
    console.log(command);
    localStorage.setItem('myCommand', command);
    $.ajax(
        {
            url: "/serialcommunication/send", type: 'POST', async: true,
            data: {
                commandData: command
            },
            success: function (response) {
            },
            error: function (response) {
            }
        });
}
// ./ END DISPENSER FUNCTIONS

// HELPER FUNCTIONS FOR SENDING COMMANDS FOR BOTH VALVES AND DISPENSERS
function zeroFill( number, width ) {
    width -= number.toString().length;
    if (width > 0) {
        return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number;
    }
    return number + ""; // always return a string
}
function paddy(n, p, c) {
    var pad_char = typeof c !== 'undefined' ? c : '0';
    var pad = new Array(1 + p).join(pad_char);
    return (pad + n).slice(-pad.length);
}


// ./ END HELPER FUNCTIONS





// dispenser arrow key functionality
function upArrow() {
    if (JSON.parse(localStorage.dispenserData)[localStorage.dispenserToControl - 1]['orientation'] === "pull"){
        incrementDispenserPosition(localStorage.dispenserToControl); // output fluid for pull syringe = move syringe to higher position
    }
    else {
        decrementDispenserPosition(localStorage.dispenserToControl);   // output fluid for push syringe = move syringe to lower position
    }
    return false;
}
function downArrow() {
    if (JSON.parse(localStorage.dispenserData)[localStorage.dispenserToControl - 1]['orientation'] === "pull"){
        decrementDispenserPosition(localStorage.dispenserToControl);   // retract fluid for pull syringe = move syringe to lower position
    }
    else {
        incrementDispenserPosition(localStorage.dispenserToControl);   // retract fluid for push syringe = move syringe to higher position
    }
    return false;
}
function dispenseSelected(down) {
    switch (down.keyCode) {
        case 38:    // up key
            if (localStorage.activeDispenser != "none") {
                upArrow();
            }
            break;
        case 40:    // down key
            if (localStorage.activeDispenser != "none") {
                downArrow();
            }
            break;
    }
};
// ./ end dispenser arrow key functionality

// dispenser modal progress bar update
function updateDispenseProgressBar(dispenserIDNum) {
    currentState = JSON.parse(localStorage.dispenserData)[dispenserIDNum - 1]['Current_State'];
    maxVol = JSON.parse(localStorage.dispenserData)[dispenserIDNum - 1]['Max'];
    minVol = JSON.parse(localStorage.dispenserData)[dispenserIDNum - 1]['Min'];
    if (currentState == 0){
        percentageUpdate = 0;   // value is NaN otherwise
    }
    else {
        percentageUpdate = Math.floor(((currentState - minVol)/(maxVol - minVol)) * 100);
    }

    // first update syringe
    updateDispenseSyringe(dispenserIDNum, percentageUpdate);

    // now base percentage update on syringe orientation:
    if(JSON.parse(localStorage.dispenserData)[dispenserIDNum - 1]['orientation'] === "push"){
        percentageUpdate = 100 - percentageUpdate;
    }

    document.getElementById('progress' + dispenserIDNum).innerHTML = percentageUpdate + "% total vol";
    document.getElementById('stateOf' + dispenserIDNum).innerHTML = currentState + " uL";
    $('#progress' + dispenserIDNum).css('width', percentageUpdate+'%').attr('aria-valuenow', percentageUpdate);
    return false;
}

//  update dispenserUI modal syringe to dispensed value
function updateDispenseSyringe(dispenserIDNum, percentUpdate) {
    // min/max displacement for syringe is 92 - 40 = 52
    var zeroDisplacement = (percentUpdate/100) * 52;
    var displacement = zeroDisplacement + 40;
    $('#plunger' + dispenserIDNum).css('left', displacement+'px');
}

// THIS ENSURES SERIAL COMM LIST IS PRE-POPULATED!!!
$(document).ready(function(){
    window.addEventListener('keydown', dispenseSelected);  // dispenser arrow key event listener
    loadButtons();
    localStorage.activeDispenser = 'none';
    paper.view.setCenter(2135.68, 610.967);
    paper.view.setZoom(0.269988);
    $.ajax(
        {   url: "/serialcommunication/list", type: 'POST', async: true,
            data:
            {
            },
            success: function(response){
            },
            error: function(response){
            }
        });
});
// Navbar
$(function() {
    $('#slide-submenu').on('click',function() {
        $(this).closest('.list-group').fadeOut('slide',function(){
            $('.mini-submenu').fadeIn();
        });
    });
    $('.mini-submenu').on('click',function(){
        $(this).next('.list-group').toggle('slide');
        $('.mini-submenu').hide();
    })
});