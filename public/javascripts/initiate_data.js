/**
 * Created by kestas on 6/2/2016.
 */

if (localStorage.firstVisit == true || localStorage.firstVisit == undefined )
{
    localStorage.clear();
    //      DECLARING PUMP VALVE STATE
    localStorage.valveData = [];
    localStorage.pumpData = [];
    localStorage.MasterData = [];
    //localStorage.dataCenter = new Object();
    localStorage.unsavedData = [];
    localStorage.oldPumpData = [];
    localStorage.pumps =  11;
    localStorage.settings_X_pos = 200;
    localStorage.settings_Y_pos= 200;
    localStorage.DataToLoad;
    localStorage.dataTable_config = [
        { id:"Pump_Number",    header:"Pump Number",   width:50},
        { id:"Open_State",   header:"Open State",    width:200, editor:"text"},
        { id:"Closed_State",    header:"Closed State",  width:80, editor:"text"}
                                    ];

    localStorage.pumpData = clearPumpData();
    localStorage.valveData = inititateValveStates();
    localStorage.firstVisit = false;
}
localStorage.clear_toggle = false;
localStorage.set_pump_page_is_open = false;
localStorage.settings_toggle = "settings_is_closed";
localStorage.close_pressed_last = false;
localStorage.hide=0;
localStorage.settings_button_has_been_pressed_before = false;