
function settingsButtonPressed()
{
    if( localStorage.settings_toggle == 'settings_is_closed' )
    {
        localStorage.settings_toggle = 'settings_is_open';
        if (localStorage.clear_toggle == "true")
        {
            var DataToLoad = JSON.parse(localStorage.unsavedData);
        }
        else
        {
            var DataToLoad = JSON.parse(localStorage.pumpData);
        }
        localStorage.clear_toggle = false;

        var settings_window_popup = webix.ui({
            view:"window",
            resize:false,
            move:false,
            id:"settings_window",
            head:{view:"toolbar",cols:[
                {view:"button",id:"close_btn",label:"Close", width:70, click:closeSettingsHandler},
                {view:"button",id:"save_btn",label:"Save",width:70,click:saveHandler,on: {"onItemClick": function () {alert("Your settings have been saved successfully!")}}},
                {view:"button",id:"clear_btn",label:"Clear",width:70,click:clearSettingsHandler},
                {view:"button",id:"set_btn",label:"Set Values for All Pumps",width:200,click:setAllPumpsHandler},
                {view:"button",id:"num_btn",label:"Set Number of Pumps",width:200,click:changeNumberOfPumpsHandler},
                {view:"text"  ,id:"num_frm",label:""}
            ]},
            width: 700,
            height: 500,
            left: localStorage.settings_X_pos,
            top: localStorage.settings_Y_pos,
            body:{
                view: "datatable",
                id:"pumpDataTable",
                select: "cell", multiselect: true, blockselect: true,
                editable:true,
                scroll:true,
                columns: [
                    { id:"Pump_Number",    header:"Pump Number",   width:150},
                    { id:"Open_State",   header:"Open State",    fillspace:true, editor:"text"},
                    { id:"Closed_State",    header:"Closed State",  fillspace:true, editor:"text"}
                ],
                data: DataToLoad
            }
        }).show();
    }
}

function setAllPumpsHandler()
{
    if (localStorage.set_pump_page_is_open == "true")
    {}   // Do nothing!

    else // Proceed!
    {
        localStorage.set_pump_page_is_open = true;
        var set_all_pumps_popup = webix.ui({
            view:"window",
            resize:false,
            move:false,
            left: 900,
            top: localStorage.settings_Y_pos,
            id:"pump_window",
            head:{view:"toolbar",cols:[
                {view:"button",id:"cancel_btn",label:"Cancel", width:70, click:closePumpPageHandler},
                {view:"button",id:"apply_btn",label:"Apply",width:70,click:applyHandler,on: {"onItemClick": function () {alert("Your settings have been applied!")}}}]},
            body:
            {
                view: "form",
                elements:[
                    {view:"text",id:"open_form",label:"Open State",labelWidth:115},
                    {view:"text",id:"closed_form",label:"Closed State",labelWidth:115}
                    //{view:"button",value:"Set",type:"form",click:set_state_handler}
                ]
            }
        }).show();
    }
}

function changeNumberOfPumpsHandler()
{
    var oldNumberofPumps = localStorage.pumps;
    var numberOfPumps = $$("num_frm").getValue();

    if (numberOfPumps == "")
    {
        alert("You entered an empty value");
    }
    else if (numberOfPumps >= 1000)
    {
        alert("Too many pumps!");
    }
    else {
        localStorage.pumps = numberOfPumps;
        var set_pumpData_newNum = [];
        for (var i = 1; i <= localStorage.pumps; i++) {
            if (i <= oldNumberofPumps) {
                var singleStage = ($$("pumpDataTable").getItem(i.toString()));
                set_pumpData_newNum.push(singleStage);
            }
            else {
                var singleStage2 = {id: i, Open_State: 0, Closed_State: 0, Pump_Number: i};
                set_pumpData_newNum.push(singleStage2);
            }
        }
        var DataToLoad = set_pumpData_newNum;
        //$$("settings_window").left = localStorage.settings_Y_pos;
        //$$("settings_window").top = localStorage.settings_X_pos;
        $$("pumpDataTable").clearAll();
        localStorage.clear_toggle = true;
        localStorage.unsavedData = JSON.stringify(DataToLoad);
        $$("settings_window").close();
        localStorage.settings_toggle = 'settings_is_closed';
        settingsButtonPressed();
    }
}



function setNumberOfPumps_JSON() {
    localStorage.pumps = JSON.parse(localStorage.portXcoords).length;
    var set_pumpData_newNum = [];
    for (var i = 1; i <= localStorage.pumps; i++) {
        var singleStage2 = {id: i, Open_State: 0, Closed_State: 0, Pump_Number: i};
        set_pumpData_newNum.push(singleStage2);
    }
    var DataToLoad = set_pumpData_newNum;
    localStorage.clear_toggle = true;
    localStorage.unsavedData = JSON.stringify(DataToLoad);
    //localStorage.pumpData = JSON.stringify(DataToLoad);
}


function applyHandler()
{
    var open_state_value = $$("open_form").getValue();
    var closed_state_value = $$("closed_form").getValue();

    if (open_state_value == "" || closed_state_value == "")
    {
     alert("You entered an empty value");
    }
    else {
        var set_pumpData = [];

        for (var k = 1; k <= localStorage.pumps; k++) {
            var singleStage = {id: k, Open_State: open_state_value, Closed_State: closed_state_value, Pump_Number: k};
            set_pumpData.push(singleStage);
        }
        var DataToLoad = set_pumpData;
        $$("settings_window").left = localStorage.settings_Y_pos;
        $$("settings_window").top = localStorage.settings_X_pos;
        $$("pumpDataTable").clearAll();
        localStorage.clear_toggle = true;
        localStorage.unsavedData = JSON.stringify(DataToLoad);
        $$("pump_window").close();
        $$("settings_window").close();
        localStorage.settings_toggle = 'settings_is_closed';
        settingsButtonPressed();
        localStorage.set_pump_page_is_open = false;
    }
}

function closePumpPageHandler()
{
    $$("pump_window").close();
    localStorage.set_pump_page_is_open = false;
    //$$("pumpDataTable").refreshColumns();
}

function closeSettingsHandler()
{
    $$("settings_window").close();
    localStorage.settings_toggle = 'settings_is_closed';
}

function clearPumpData()
{
    var c_pumpData = [];
    for (var i = 1; i <= localStorage.pumps; i++)
    {
        var singleStage = { id:i, Open_State:0, Closed_State:0, Pump_Number:i};
        c_pumpData.push(singleStage);
    }
    return JSON.stringify(c_pumpData);
}

function saveHandler()
{
    var save_pumpData = [];
    for (var i = 1; i <= localStorage.pumps; i++)
    {
        var singleStage = ($$("pumpDataTable").getItem(i.toString()));
        save_pumpData.push(singleStage);
    }
    localStorage.pumpData = JSON.stringify(save_pumpData);
    update_numberOfValves();
}

function update_numberOfValves() {
    var new_valves = [];
    var oldNumberofValves = (JSON.parse(localStorage.valveData)).length;
    for (var i = 1; i <= localStorage.pumps; i++) {
        if (i <= oldNumberofValves) {
            var singleStage = (JSON.parse(localStorage.valveData))[(i - 1)];
            new_valves.push(singleStage);
        }
        else {
            var singleStage2 = {id: i, Open_State: 0, Closed_State: 0, Pump_Number: i};
            new_valves.push(singleStage2);
        }
    }
    var DataToLoad = new_valves;
    localStorage.valveData = JSON.stringify(DataToLoad);
}


function clearSettingsHandler()
{
    var DataToLoad = JSON.parse(clearPumpData());
    $$("pumpDataTable").clearAll();
    localStorage.clear_toggle = true;
    localStorage.unsavedData = JSON.stringify(DataToLoad);
    $$("settings_window").close();
    localStorage.settings_toggle = 'settings_is_closed';
    settingsButtonPressed();
}


function openDebugger()
{
    (document.getElementById('debugger_modal')).style.display = "block";
}

function closeDebugger()
{
    (document.getElementById('debugger_modal')).style.display = "none";
}

function openSerialConsole()
{
    (document.getElementById('serialConsole_modal')).style.display = "block";
}

function closeSerialConsole()
{
    (document.getElementById('serialConsole_modal')).style.display = "none";
}

function writeToSerialConsole(serial_data)
{

}

function mediateMotorPosition(event)
{
    event.preventDefault();
    var valve_to_control = (document.getElementById("ValveNumberSelectorDebug").value);
    if ((parseInt(valve_to_control,10) > parseInt(localStorage.pumps,10)) || (parseInt(valve_to_control,10) < 0))
    {
        toastr.warning("Pump Index Out of Bounds");
    }
    var valve_to_control_padded = zeroFill(valve_to_control,4);
    var PWM_to_send = (document.getElementById("MotorPositionAssignerDebug").value);
    if ((parseInt(PWM_to_send,10) > 4096) || (parseInt(PWM_to_send,10) < 0))
    {
        toastr.warning("Invalid PWM value");
    }
    var PWM_to_send_padded = zeroFill(PWM_to_send,4);
    var command_core = valve_to_control_padded.concat(PWM_to_send_padded);
    var begin_signal = 's';
    var end_signal = 'e';
    var pre_command = begin_signal.concat(command_core);
    var command = pre_command.concat(end_signal);
    var stringgggg = "Sending to Arduino: ";
    var command_info = stringgggg.concat(command);
    // --- Include code to serial.write() the command to the Arduino here --- //
    toastr.info(command_info);
    localStorage.setItem('myCommand', command);
    //document.forms.form1.area.value = document.forms.form1.area.value + '\nSerial Command Sent: ' + localStorage.myCommand;
    // $.ajax(
    //     {   url: "/arduinoGetCode", type: 'POST', async: true,
    //         data:
    //         {
    //             commandData: command
    //         },
    //         success: function(response){
    //         },
    //         error: function(response){
    //         }
    //     });
}

function mediateValveState_fromDebugger(event)
{
    localStorage.DEBUGGER_FLAG = true;
    mediateValveState(event);
}

function mediateValveState(event)
{
    event.preventDefault();
    var changedData = JSON.parse(localStorage.valveData);

    if (localStorage.DEBUGGER_FLAG == false) {
        var valve_to_control = (document.getElementById("ValveNumberSelector").value);
        if ( (parseInt(valve_to_control,10) > parseInt(localStorage.pumps,10)) || (parseInt(valve_to_control,10) < 0))
        {
            toastr.warning("Pump Index Out of Bounds");
        }
        var state_to_set_valve_to = document.getElementById("ValveStateAssigner").value;
        if ((parseInt(state_to_set_valve_to,10) != 0) && (parseInt(state_to_set_valve_to,10) != 1))
        {
            toastr.warning("Invalid State! Apply 0 or 1");
        }
    }
    else {
        var valve_to_control = (document.getElementById("ValveNumberSelectorDebug").value);
        if ((parseInt(valve_to_control,10) > parseInt(localStorage.pumps,10)) || (parseInt(valve_to_control,10) < 0))
        {
            toastr.warning("Pump Index Out of Bounds");
        }
        var state_to_set_valve_to = document.getElementById("ValveStateAssignerDebug").value;
        if ((parseInt(state_to_set_valve_to,10) != 0) && (parseInt(state_to_set_valve_to,10) != 1))
        {
            toastr.warning("Invalid State! Apply 0 or 1");
        }
    }
    localStorage.DEBUGGER_FLAG == false;
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
    var startStr = '';
    var pre_command_s = startStr.concat(pre_command);
    // ADD A STOP CODON TO SIGNIFY THE END OF SIGNAL
    var command = pre_command_s.concat('\n');
    // RETURN THE DATA
    return command;
}




// Function to open Arduino Modal
function openConnectionPage() {
    (document.getElementById('connection_modal')).style.display = "block";


}
// THIS ENSURES SERIAL COMM LIST IS PRE-POPULATED!!!
$(document).ready(function(){
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
    writeToSerialConsole(command_info);
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


    // $.ajax(
    //     {   url: "/serialcommunication/send", type: 'POST', async: true,
    //         data:
    //         {
    //             commandData: command
    //
    //         },
    //         success: function(response){
    //
    //         },
    //         error: function(response){
    //         }
    //     });

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
})

