ShieldIndex = 0;
PinIndex = 0;
deviceCount = 0;

// FUNCTIONALITY FOR VALVE DATA TRACKING
function setNumberOfPumps_JSON() {
    localStorage.pumps = JSON.parse(localStorage.portXcoords).length;
    var set_pumpData_newNum = [];
    var j = 1;  //  hardware pin (goes from 1 to 12)
    for (var i = 1; i <= localStorage.pumps; i++) {
        var initialize_valve_conversion = initializeSetup(180,460,0.69,3,0.88,0.25);
        deviceCount = i;
        var singleStage = {id: i, HW_shield: (Math.floor(i/12) + 1), HW_pin: j, Open_State: initialize_valve_conversion.uL_max, Closed_State: 0, Current_State: 'opened', deviceIndex: deviceCount, uL_Conversion_Table: (initialize_valve_conversion.uL_table), uL_Precision: (initialize_valve_conversion.uL_precision)};
        set_pumpData_newNum.push(singleStage);
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
    deviceCount = 0;
    var c_pumpData = [];
    var j = 1;  //  hardware pin (goes from 1 to 12)
    for (var i = 1; i <= localStorage.pumps; i++)
    {
        var initialize_valve_conversion = initializeSetup(180,460,0.69,3,0.88,0.25);
        deviceCount = i;
        var singleStage = {id: i, HW_shield: (Math.floor(i/12) + 1), HW_pin: j, Open_State: initialize_valve_conversion.uL_max, Closed_State: 0, Current_State: 'opened', deviceIndex: deviceCount, uL_Conversion_Table: (initialize_valve_conversion.uL_table), uL_Precision: (initialize_valve_conversion.uL_precision)};
        c_pumpData.push(singleStage);

        j = j + 1;
        if(j == 13) {
            j = 1;
        }

    }
    return JSON.stringify(c_pumpData);
}

/*
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
*/

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


// THIS ENSURES SERIAL COMM LIST IS PRE-POPULATED!!!
$(document).ready(function(){
    window.addEventListener('keydown', dispenseSelected);  // dispenser arrow key event listener
    loadButtons();
    localStorage.activeDispenser = 'none';
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