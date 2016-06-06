
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


// function pumpData_to_ArduinoCompatibleFormat()
// {
//     var arduino_commands = [];
//     for (var i = 0; i < length(localStorage.pumpData); 1++)
//     {
//         var pump_num = localStorage.pumpData[i].Pump_Number;
//         var open_state = localStorage.pumpData[i].Open_State;
//         var closed_state = localStorage.pumpData[]
//         arduino_commans[i] = {}
//     }
//
// }