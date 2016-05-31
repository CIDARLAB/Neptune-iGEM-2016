

function settings_button_pressed()
{
    if( localStorage.settings_toggle == 'settings_is_closed' )
    {
        localStorage.settings_toggle = 'settings_is_open';
        if (localStorage.clear_toggle === true)
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
            resize:true,
            move:true,
            id:"settings_window",
            head:{view:"toolbar",cols:[
                {view:"button",id:"close_btn",label:"Close", width:70, click:close_settings_handler},
                {view:"button",id:"save_btn",label:"Save",width:70,click:save_handler,on: {"onItemClick": function () {alert("Your settings have been saved successfully!")}}},
                {view:"button",id:"clear_btn",label:"Clear",width:70,click:clear_settings_handler},
                {view:"button",id:"set_btn",label:"Set Values for All Pumps",width:200,click:set_all_pumps_handler},
                {view:"button",id:"num_btn",label:"Set Number of Pumps",width:200,click:change_number_of_pumps_handler},
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

function set_all_pumps_handler()
{
    if (localStorage.set_pump_page_is_open === true)
    {
        //Do nothing!
    }

    else // Proceed.
    {
        localStorage.set_pump_page_is_open = true;
        var set_all_pumps_popup = webix.ui({
            view:"window",
            resize:true,
            move:true,
            id:"pump_window",
            head:{view:"toolbar",cols:[
                {view:"button",id:"cancel_btn",label:"Cancel", width:70, click:close_pumpPage_handler},
                {view:"button",id:"apply_btn",label:"Apply",width:70,click:apply_handler,on: {"onItemClick": function () {alert("Your settings have been applied!")}}}]},
            body:
            {
                view: "form",
                elements:[
                    {view:"text",id:"open_form",label:"Open State"},
                    {view:"text",id:"closed_form",label:"Closed State"}
                    //{view:"button",value:"Set",type:"form",click:set_state_handler}
                ]
            }
        }).show();
    }
}

function change_number_of_pumps_handler()
{
    var oldNumberofPumps = localStorage.pumps;
    var numberOfPumps = $$("num_frm").getValue();
    localStorage.pumps = numberOfPumps;
    var set_pumpData_newNum = [];
    for (var i = 1; i <= localStorage.pumps; i++)
    {
        if (i <= oldNumberofPumps)
        {
            var singleStage = ($$("pumpDataTable").getItem(i.toString()));
            set_pumpData_newNum.push(singleStage);
        }
        else
        {
            var singleStage2 = {id:i, Open_State:0, Closed_State:0, Pump_Number:i};
            set_pumpData_newNum.push(singleStage2);
        }
    }
    var DataToLoad = set_pumpData_newNum;
    $$("settings_window").left = localStorage.settings_Y_pos;
    $$("settings_window").top = localStorage.settings_X_pos;
    $$("pumpDataTable").clearAll();
    localStorage.clear_toggle = true;
    localStorage.unsavedData = JSON.stringify(DataToLoad);
    $$("settings_window").close();
    localStorage.settings_toggle = 'settings_is_closed';
    settings_button_pressed();
}

function apply_handler()
{
    var open_state_value = $$("open_form").getValue();
    var closed_state_value = $$("closed_form").getValue();
    var set_pumpData = [];
    for (var k = 1; k <= localStorage.pumps; k++)
    {
        var singleStage = {id:k, Open_State:open_state_value, Closed_State:closed_state_value, Pump_Number:k};
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
    settings_button_pressed();
    localStorage.set_pump_page_is_open = false;

    //$$("pump_window").close();
    //$$("settings_window").close();
}

function close_pumpPage_handler()
{
    $$("pump_window").close();
    localStorage.set_pump_page_is_open = false;
    //$$("pumpDataTable").refreshColumns();
}

function close_settings_handler()
{
    $$("settings_window").close();
    localStorage.settings_toggle = 'settings_is_closed';
}

function clear_pumpData()
{
    var c_pumpData = [];
    for (var i = 1; i <= localStorage.pumps; i++)
    {
        var singleStage = { id:i, Open_State:0, Closed_State:0, Pump_Number:i}
        c_pumpData.push(singleStage);
    }
    return JSON.stringify(c_pumpData);
}

function save_handler()
{
    var save_pumpData = [];
    for (var i = 1; i <= localStorage.pumps; i++)
    {
        var singleStage = ($$("pumpDataTable").getItem(i.toString()));
        save_pumpData.push(singleStage);
    }
    localStorage.pumpData = JSON.stringify(save_pumpData);
}

function clear_settings_handler()
{
    var DataToLoad = JSON.parse(clear_pumpData());
    $$("pumpDataTable").clearAll();
    localStorage.clear_toggle = true;
    localStorage.unsavedData = JSON.stringify(DataToLoad);
    $$("settings_window").close();
    localStorage.settings_toggle = 'settings_is_closed';
    settings_button_pressed();
}
