
// functionality attached to valves
function onclickanchortag(){
    var location = getLocation(this.src);

    switch (location.pathname){
        case "/images/fluigi/valveMarkerOpen.svg":
            $(this).attr("src", "../images/fluigi/valveMarkerClosed.svg");
            console.log("Port " + this.id + " clicked");
            valve_to_control = this.id;
            // change recorded state in table
            var temp = JSON.parse(localStorage.pumpData);
            temp[valve_to_control - 1]['Current_State'] = "closed";
            localStorage.pumpData = JSON.stringify(temp);
            flipFlop_valveState(valve_to_control);
            break;

        case "/images/fluigi/valveMarkerClosed.svg":
            $(this).attr("src", "../images/fluigi/valveMarkerOpen.svg");
            console.log("Port " + this.id + " clicked");
            valve_to_control = this.id;
            // change recorded state in table
            var temp = JSON.parse(localStorage.pumpData);
            temp[valve_to_control - 1]['Current_State'] = "opened";
            localStorage.pumpData = JSON.stringify(temp);
            flipFlop_valveState(valve_to_control);
            break;

        default:
            $(this).attr("src", "../images/fluigi/valveMarkerClosed.svg");
            break;
    }
    if (location.pathname == "/images/fluigi/valveMarkerOpen.svg"){
    }
    return false;
}

var getLocation = function(href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
};

function onclickanchortagDispense(){
    dispenser_to_control = this.id;
    incrementDispenserPosition(dispenser_to_control);
    return false;
}

function activateDispenser(dispenserIDNum) {
    localStorage.activeDispenser = dispenserIDNum;
    localStorage.dispenserToControl = dispenserIDNum;
    updateDispenseProgressBar(dispenserIDNum);
}

function deactivateDispenser() {
    localStorage.activeDispenser = "none";
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


function valve_uL_to_PWM(uL_table,uL_precision,uL_goal) {
    for (var i=0; i <= uL_table.length; i=i+2) {
        if (uL_goal-uL_table[i] <= uL_precision/2) {
            return Math.round(uL_table[i+1]);
        }
    }
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

    var initializeSetup_outputs = initializeSetup(180,460,0.69,3,0.88,0.25);
    var uL_table = initializeSetup_outputs.uL_table;
    var uL_precision = initializeSetup_outputs.uL_precision;
    PWMval = valve_uL_to_PWM(uL_table,uL_precision,PWMval);

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
    // console.log(command);
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

