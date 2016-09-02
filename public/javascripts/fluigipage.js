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

    console.log(valve_to_control + 'CHECK THE VALVE');
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
    var stringgggg = "Sending to Arduino: ";
    var command_info = stringgggg.concat(command);
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
        var singleStage = {id: i, HW_shield: (Math.floor(shield/12) + 1), HW_pin: j, Precision: 0, Min: 0, Max: 0, Current_State: 0, deviceIndex: deviceCount};
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
        var tempDispense = {id: i, HW_shield: (Math.floor(shield/12) + 1), HW_pin: j, Precision: 0, Min: 0, Max: 0, Current_State: 0, deviceIndex: deviceCount};
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
function increaseDispenserOutput(dispenser_to_control) {
    localStorage.dispenserToControl = dispenser_to_control;
    // assumes the capacity of the syringe is 9 mL
    if (JSON.parse(localStorage.dispenserData)[dispenser_to_control - 1]['Current_State'] < JSON.parse(localStorage.dispenserData)[dispenser_to_control - 1]['Max']) {
        var temp = JSON.parse(localStorage.dispenserData);//[valve_to_control]['Physical_State'] = 1;
        temp[dispenser_to_control - 1]['Current_State'] = (temp[dispenser_to_control - 1]['Current_State'] + 0.25);
        localStorage.dispenserData = JSON.stringify(temp);
        sendCommandDispense();
        updateDispenseProgressBar(dispenser_to_control);
    }
    else {
        toastr.warning('You have already dispensed the full amount of this syringe.');
    }
    return false;
}

function decreaseDispenserOutput(dispenser_to_control) {
    localStorage.dispenserToControl = dispenser_to_control;
    // assumes the capacity of the syringe is 9 mL
    if (JSON.parse(localStorage.dispenserData)[dispenser_to_control - 1]['Current_State'] > JSON.parse(localStorage.dispenserData)[dispenser_to_control - 1]['Min']) {
        var temp = JSON.parse(localStorage.dispenserData);//[valve_to_control]['Physical_State'] = 1;
        temp[dispenser_to_control - 1]['Current_State'] = (temp[dispenser_to_control - 1]['Current_State'] - 0.25);
        localStorage.dispenserData = JSON.stringify(temp);
        sendCommandDispense();
        updateDispenseProgressBar(dispenser_to_control);
    }
    else {
        toastr.warning('You have reached minimum volume capacity.');
    }
    return false;
}

function wrap_data_for_Arduino_Dispense() {
    var dispenser_to_control = localStorage.dispenserToControl;
    var temp = JSON.parse(localStorage.dispenserData);
    console.log("dispenser to control: " + temp[dispenser_to_control - 1]['deviceIndex']);
    var deviceNum = temp[dispenser_to_control - 1]['deviceIndex'];
    
    // FIRST, PAD THE VALVE_TO_CONTROL WITH 0's SUCH THAT THE VALUE IS 3 CHARACTERS LONG
    console.log("deviceNum: " + deviceNum);
    var dispenser_to_control_padded = zeroFill(deviceNum,4);
    // SECOND, PAD THE ML VALUE WITH 0's SUCH THAT THE VALUE IS 4 CHARACTERS LONG
    console.log(JSON.parse(localStorage.dispenserData)[dispenser_to_control - 1]['Current_State']);

    if(Math.floor(JSON.parse(localStorage.dispenserData)[dispenser_to_control - 1]['Current_State']) < JSON.parse(localStorage.dispenserData)[dispenser_to_control - 1]['Current_State']) {
        var MLval_padded = zeroFill(JSON.parse(localStorage.dispenserData)[dispenser_to_control - 1]['Current_State'],3);
    }
    else{
        var MLval_padded = zeroFill(JSON.parse(localStorage.dispenserData)[dispenser_to_control - 1]['Current_State'],4);
    }
    // CONCAT THE VALVE NUMBER AND PWM VALUE
    var pre_command = dispenser_to_control_padded.concat(MLval_padded);
    // ADD A START CODON TO SIGNIFY THE BEGINING OF SIGNAL
    var startStr = '';
    var pre_command_s = startStr.concat(pre_command);
    // ADD A STOP CODON TO SIGNIFY THE END OF SIGNAL
    var command = pre_command_s.concat('\n');
    // RETURN THE DATA
    return command;
}
function sendCommandDispense() {
    var command = wrap_data_for_Arduino_Dispense();
    var stringgggg = "Sending to Arduino: ";
    var command_info = stringgggg.concat(command);
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
    increaseDispenserOutput(localStorage.dispenserToControl);
    return false;
}
function downArrow() {
    decreaseDispenserOutput(localStorage.dispenserToControl);
    return false;
}
function dispenseSelected(down) {
    switch (down.keyCode) {
        case 38:
            if (localStorage.activeDispenser != "none") {
                console.log("up arrow pressed");
                upArrow();
            }
            break;
        case 40:
            if (localStorage.activeDispenser != "none") {
                console.log("down arrow pressed");
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
    percentageUpdate = Math.floor(((currentState - minVol)/(maxVol - minVol)) * 100);
    console.log("progress of " + dispenserIDNum + " : " + percentageUpdate);
    // $('.progress-bar').innerHTML = "%";
    document.getElementById('progress' + dispenserIDNum).innerHTML = percentageUpdate + "% total vol";
    document.getElementById('stateOf' + dispenserIDNum).innerHTML = currentState + " mL";

    $('#progress' + dispenserIDNum).css('width', percentageUpdate+'%').attr('aria-valuenow', percentageUpdate);
    return false;
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