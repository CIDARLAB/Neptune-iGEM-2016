ShieldIndex = 0;
PinIndex = 0;
deviceCount = 0;



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

function clearPumpData()
{
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

// function mediateMotorPosition(event)
// {
//     event.preventDefault();
//     var valve_to_control = (document.getElementById("ValveNumberSelectorDebug").value);
//     if ((parseInt(valve_to_control,10) > parseInt(localStorage.pumps,10)) || (parseInt(valve_to_control,10) < 0))
//     {
//         toastr.warning("Pump Index Out of Bounds");
//     }
//     var valve_to_control_padded = zeroFill(valve_to_control,4);
//     var PWM_to_send = (document.getElementById("MotorPositionAssignerDebug").value);
//     if ((parseInt(PWM_to_send,10) > 4096) || (parseInt(PWM_to_send,10) < 0))
//     {
//         toastr.warning("Invalid PWM value");
//     }
//     var PWM_to_send_padded = zeroFill(PWM_to_send,4);
//     var command_core = valve_to_control_padded.concat(PWM_to_send_padded);
//     var begin_signal = 's';
//     var end_signal = 'e';
//     var pre_command = begin_signal.concat(command_core);
//     var command = pre_command.concat(end_signal);
//     var stringgggg = "Sending to Arduino: ";
//     var command_info = stringgggg.concat(command);
//     // --- Include code to serial.write() the command to the Arduino here --- //
//     toastr.info(command_info);
//     localStorage.setItem('myCommand', command);
// }


// function mediateValveState(event)
// {
//     event.preventDefault();
//     var changedData = JSON.parse(localStorage.valveData);
//
//     if (localStorage.DEBUGGER_FLAG == false) {
//         var valve_to_control = (document.getElementById("ValveNumberSelector").value);
//         if ( (parseInt(valve_to_control,10) > parseInt(localStorage.pumps,10)) || (parseInt(valve_to_control,10) < 0))
//         {
//             toastr.warning("Pump Index Out of Bounds");
//         }
//         var state_to_set_valve_to = document.getElementById("ValveStateAssigner").value;
//         if ((parseInt(state_to_set_valve_to,10) != 0) && (parseInt(state_to_set_valve_to,10) != 1))
//         {
//             toastr.warning("Invalid State! Apply 0 or 1");
//         }
//     }
//     else {
//         var valve_to_control = (document.getElementById("ValveNumberSelectorDebug").value);
//         if ((parseInt(valve_to_control,10) > parseInt(localStorage.pumps,10)) || (parseInt(valve_to_control,10) < 0))
//         {
//             toastr.warning("Pump Index Out of Bounds");
//         }
//         var state_to_set_valve_to = document.getElementById("ValveStateAssignerDebug").value;
//         if ((parseInt(state_to_set_valve_to,10) != 0) && (parseInt(state_to_set_valve_to,10) != 1))
//         {
//             toastr.warning("Invalid State! Apply 0 or 1");
//         }
//     }
//     localStorage.DEBUGGER_FLAG = false;
//     localStorage.portToControl = valve_to_control;
//
//     //localStorage.valveData
//     changedData[valve_to_control - 1]['Physical_State'] = state_to_set_valve_to;
//     localStorage.valveData = JSON.stringify(changedData);
//     //These changes are to allow this function toa send to Arduino
//     sendCommand();
// }

function flipFlop_valveState(valve_to_control)
{
    localStorage.portToControl = valve_to_control;

    //var valve_to_control; // This needs to be pulled from image overlay
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

function wrap_data_for_Arduino()
{
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
        var singleStage2 = {id: i, HW_shield: (Math.floor(shield/12) + 1), HW_pin: j, Precision: 0, Min: 0, Max: 0, Current_State: 0, deviceIndex: deviceCount};
        set_dispData_newNum.push(singleStage2);
        j = j + 1;
        if(j == 13) {
            j = 1;
        }
        ShieldIndex = i;
        PinIndex = j;
    }
    var DataToLoad = set_dispData_newNum;
    localStorage.dispenserData = JSON.stringify(DataToLoad);
    localStorage.dispenserInitial = "FALSE";
}


function increaseDispenserOutput(dispenser_to_control)
{
    localStorage.dispenserToControl = dispenser_to_control;
    // assumes the capacity of the syringe is 9 mL
    if (JSON.parse(localStorage.dispenserData)[dispenser_to_control - 1]['Current_State'] < JSON.parse(localStorage.dispenserData)[dispenser_to_control - 1]['Max']) {
        var temp = JSON.parse(localStorage.dispenserData);//[valve_to_control]['Physical_State'] = 1;
        temp[dispenser_to_control - 1]['Current_State'] += 1;
        localStorage.dispenserData = JSON.stringify(temp);
        sendCommandDispense();
    }
    else {
        toastr.warning('You have already dispensed the full amount of this syringe.');
    }
    return false;
}

function wrap_data_for_Arduino_Dispense()
{
    var dispenser_to_control = localStorage.dispenserToControl;
    var temp = JSON.parse(localStorage.dispenserData);
    var deviceNum = temp[dispenser_to_control - 1]['deviceIndex'];
    
    // FIRST, PAD THE VALVE_TO_CONTROL WITH 0's SUCH THAT THE VALUE IS 3 CHARACTERS LONG
    var dispenser_to_control_padded = zeroFill(deviceNum,4);
    // SECOND, PAD THE ML VALUE WITH 0's SUCH THAT THE VALUE IS 4 CHARACTERS LONG
    var MLval_padded = zeroFill(JSON.parse(localStorage.dispenserData)[dispenser_to_control - 1]['Current_State'],4);
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

function sendCommandDispense()
{
    var command = wrap_data_for_Arduino_Dispense();
    var stringgggg = "Sending to Arduino: ";
    var command_info = stringgggg.concat(command);
    // --- Include code to serial.write() the command to the Arduino here --- //
    toastr.info(command_info);
    // writeToSerialConsole(command_info);
    console.log(command);
    localStorage.setItem('myCommand', command);
    // document.forms.form1.area.value = document.forms.form1.area.value + '\nSerial Command Sent: ' + localStorage.myCommand;

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















// Function to open Arduino Modal
function openConnectionPage() {
    (document.getElementById('connection_modal')).style.display = "block";


}
// THIS ENSURES SERIAL COMM LIST IS PRE-POPULATED!!!
$(document).ready(function(){
    // placeButtons();
    loadButtons();
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

function closeConnectionPage()
{
    (document.getElementById('connection_modal')).style.display = "none";
}





function sendCommand()
{
    var command = wrap_data_for_Arduino();
    var stringgggg = "Sending to Arduino: ";
    var command_info = stringgggg.concat(command);
    // --- Include code to serial.write() the command to the Arduino here --- //
    toastr.info(command_info);
    // writeToSerialConsole(command_info);
    console.log(command);
    localStorage.setItem('myCommand', command);
    // document.forms.form1.area.value = document.forms.form1.area.value + '\nSerial Command Sent: ' + localStorage.myCommand;

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

function inititateValveStates()
{
    var init_valveState = [];
    for( var i = 1; i <= localStorage.pumps; i++)
    {
        var singleStage = {id:i, Physical_State:0, Valve_Number:i};
        init_valveState.push(singleStage);
    }
    return JSON.stringify(init_valveState);
}

function combine_pumpData_valveData()
{
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

function zeroFill( number, width )
{
    width -= number.toString().length;
    if (width > 0) {
        return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number;
    }
    return number + ""; // always return a string
}

function paddy(n, p, c)
{
    var pad_char = typeof c !== 'undefined' ? c : '0';
    var pad = new Array(1 + p).join(pad_char);
    return (pad + n).slice(-pad.length);
}

//Navbar
$(function(){

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

