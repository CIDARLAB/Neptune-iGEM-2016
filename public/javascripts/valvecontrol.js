/**
 * Created by kestas on 6/1/2016.
 */

function mediateValveState(event)
{
    event.preventDefault();
    var changedData = JSON.parse(localStorage.valveData);
    var valve_to_control = (document.getElementById("ValveNumberSelector").value);
    var state_to_set_valve_to = document.getElementById("ValveStateAssigner").value;
    localStorage.portToControl = valve_to_control;

    //localStorage.valveData
    changedData[valve_to_control - 1]['Physical_State'] = state_to_set_valve_to;
    localStorage.valveData = JSON.stringify(changedData);
    //These changes are to allow this function toa send to Arduino
    sendCommand();
}

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
    var valve_to_control_padded = zeroFill(valve_to_control,4);
    // SECOND, PAD THE PWM VALUE WITH 0's SUCH THAT THE VALUE IS 4 CHARACTERS LONG
    var PWMval_padded = zeroFill(PWMval,4);
    // CONCAT THE VALVE NUMBER AND PWM VALUE
    var pre_command = valve_to_control_padded.concat(PWMval_padded);
    // ADD A START CODON TO SIGNIFY THE BEGINING OF SIGNAL
    var startStr = 's';
    var pre_command_s = startStr.concat(pre_command);
    // ADD A STOP CODON TO SIGNIFY THE END OF SIGNAL
    var command = pre_command_s.concat('\n');
    // RETURN THE DATA
    return command;
}

function sendCommand()
{
    var command = wrap_data_for_Arduino();
    var stringgggg = "Sending to Arduino: "
    var command_info = stringgggg.concat(command);
    // --- Include code to serial.write() the command to the Arduino here --- //
    // toastr.info(command);
    console.log(command);
    // localStorage.command= command;
    $.ajax(
        {   url: "/arduinoGetCode", type: 'POST', async: true,
            data:
            {
                commandData: command
            },
            success: function(response){
            },
            error: function(response){
            }
        });
    
}

function inititateValveStates()
{
    var init_valveState = [];
    for( var i = 1; i <= localStorage.pumps; i++)
    {
        var singleStage = {id:i, Physical_State:0, Valve_Number:i}
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