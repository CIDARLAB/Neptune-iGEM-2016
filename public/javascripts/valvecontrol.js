/**
 * Created by kestas on 6/1/2016.
 */

function calibrateValveState_with_pumpSettings()
{

}

function mediateValveState(event)
{
    event.preventDefault();
    var changedData = JSON.parse(localStorage.valveData);
    var valve_to_control = (document.getElementById("ValveNumberSelector").value);
    var state_to_set_valve_to = document.getElementById("ValveStateAssigner").value;

    //localStorage.valveData
    changedData[valve_to_control - 1]['Physical_State'] = state_to_set_valve_to;
    localStorage.valveData = JSON.stringify(changedData);
    //These changes are to allow this function toa send to Arduino
    sendCommand();
}

function flipFlop_valveState()
{
    var valve_to_control; // This needs to be pulled from image overlay
    if (localStorage.valveData[valve_to_control]['Physical_State'] == 0) {
        localStorage.valveData[valve_to_control]['Physical_State'] = 1;
    }
    else {
        localStorage.valveData[valve_to_control]['Physical_State'] = 0;
    }
    sendCommand();
}

function wrap_data_for_Arduino()
{
    var valve_to_control = (document.getElementById("ValveNumberSelector").value);
    localStorage.MasterData = combine_pumpData_valveData();

    var data_for_selected_object = JSON.parse(localStorage.MasterData);
    var open_state_parameter = data_for_selected_object[valve_to_control - 1]['State']['Open_State'];
    var closed_state_parameter = data_for_selected_object[valve_to_control - 1]['State']['Closed_State'];
    var physical_state_parameter = data_for_selected_object[valve_to_control - 1]['State']['Physical_State'];

    //var data_to_send_unabridged; //Concatenate above crap and send. If we don't need open and close state parameters,
    // then we can send pump number and state.
    if (physical_state_parameter == 1)
    {
        var PWMval = open_state_parameter;
    }
    else
    {
        var PWMval = closed_state_parameter;
    }
    var data_to_send_abridged = valve_to_control.concat(PWMval);
    return data_to_send_abridged;
}

function sendCommand()
{
    var command = wrap_data_for_Arduino();
    // --- Include code to serial.write() the command to the Arduino here --- //
    //toastr.info(command);
    console.log("Log: ajax function is being called");
    // localStorage.command= command;
    $.ajax(
        {   url: "/arduinoGetCode", type: 'POST', async: true,
            data:
            {
                myCommand: command,
                portName: $("#ports").val()
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