var gui_state = 'home';
var help_toggle= 'help_is_closed';
var settings_toggle = "settings_is_closed";
var numPumps = 11;
function setup() {
 
  home_background_image = loadImage("resources/background_img.png");
  
  //Home Page
  fluigi_logo= loadImage("resources/fluigi.png");
  fluigi_highlighted_logo= loadImage("resources/fluigi_highlighted.png");
  help= loadImage("resources/help.png");
  about= loadImage("resources/about.png");
  help_highlighted= loadImage("resources/help_highlighted.png");
  about_highlighted= loadImage("resources/about_highlighted.png");
  
  //FLUIGI Page
  home= loadImage("resources/home.png");
  fluigi_transparent= loadImage("resources/fluigi_transparent.png");
  settings= loadImage("resources/settings.png");
  not_connected= loadImage("resources/not_connected.png");
  connected= loadImage("resources/connected.png");
  
  createCanvas(windowWidth ,windowHeight);
  
  
  
}
function draw() {
 
 
  
  //////////////////////////////////////////////////////////////////
  //                 HOME PAGE
  //////////////////////////////////////////////////////////////////
  
  if (gui_state == 'home'){
    background(home_background_image);

    
    //HELP Button
    if (isOver((width/100)* 75 , (height/100)*68, width/9, height/13))
      {
        image(help_highlighted, (width/100)* 75 , (height/100)*68, width/9, height/13);
      }
    else{
      image(help, (width/100)* 75 , (height/100)*68, width/9, height/13);
    }
    
    //ABOUT Button
    if (isOver ((width/100)*75 , (height/100)*77, width/9,height/13))
      {
        image(about_highlighted, (width/100)* 75 , (height/100)*77, width/9, height/13);
      }
    else{
        image(about, (width/100)*75 , (height/100)*77, width/9,height/13);
      }
    
    // define the position of the logo with respect to the size of the board
    fluigi_logo_X = ( (width/2)-(width/5) );
    fluigi_logo_Y = ( (height/2)-(height/8) );
    
    // if mouse is hovering over fluigi logo display hollow button, resopond to click
    if (isOver(fluigi_logo_X, fluigi_logo_Y, fluigi_logo.width, fluigi_logo.height) ) {
      image(fluigi_highlighted_logo, fluigi_logo_X , fluigi_logo_Y, width/3.3, height/6.5);
    }
    // otherwise display filled logo
    else {
      image(fluigi_logo, fluigi_logo_X , fluigi_logo_Y, width/3.3, height/6.5);
    }
  }
  
  //////////////////////////////////////////////////////////////////
  //                 FLUIGI PAGE
  //////////////////////////////////////////////////////////////////
  if (gui_state == 'fluigi')
  {
    createCanvas(windowWidth ,windowHeight);
    background(44, 62, 80);
    fill(52, 152, 219);
      
  }
  
  
 //////////////////////////////////////////////////////////////////
 //                 SETTINGS PAGE
 //////////////////////////////////////////////////////////////////
  
  if (gui_state == 'settings'){
  
  }
    
}
  //////////////////////////////////////////////////////////////////
  //                 BUTTONS
  //////////////////////////////////////////////////////////////////
 
  function fluigi_button_pressed()
  {
    gui_state= 'fluigi';


    // to be set when we determine if the device is connected or not
    disconnected_path = "resources/not_connected.png";
    connected_path = "resources/connected.png";


    webix.ui({
    view:"toolbar",
    id:"FluigiToolbar",
    cols:[
        { view:"button", type:"imageTop", id:"fluigi_logo_static", image:"resources/fluigi_transparent.png", width:360, height:95 },
        { view:"button", type:"imageTop", image:"resources/home.png", width:220, height:90, click: home_button_pressed},
        {},
        { view:"button", type:"imageTop", id:"device_indicator_static", image:connected_path, width:85, height:85 },
        { view:"button", type:"imageTop", image:"resources/settings.gif", width:85, height:85, click: settings_button_pressed}]
    }).show();

    $$("fluigi_logo_static").disable();
    $$("device_indicator_static").disable();


  }

  function about_button_pressed()
  {
    var strWindowFeatures = "resizable=yes";
    var about_CIDAR_window = window.open('http://cidarlab.org/fluigi/','About',strWindowFeatures);
  }

  function help_button_pressed()
  {
    //gui_state= 'help';
    
    var help_window_popup = webix.ui({
      view:"window",
      resize:true,
      move:true,
      id:"help_window",
      head:{view:"button", label:"Close", width:70, click:help_handler}, //("$$('help_window').close();") click:(help_toggle = 'help_is_closed')},
      width: 1050,
      height: 800,
      left:550,
      top:100,
      body:{
          template:"<img src='resources/Fluigi_HELP.jpg'/>"
      }
      
  }).show();
  }
  
  function help_handler()
    {
    $$("help_window").close();
    help_toggle = 'help_is_closed';
    }
  
  
  function exit_button_pressed()
  {
    gui_state= 'home'; 
  }
  
  // function settings_button_pressed()
  // {
  //   gui_state = 'settings';
    
  // }
  function settings_button_pressed()
  {
  if( settings_toggle == 'settings_is_closed')
  {
    settings_toggle = 'settings_is_open';
  
	var pumpData = [];
	for (var i = 1; i <= numPumps; i++)
	{
     var singleStage = { id:i, Open_State:0, Closed_State:0, Pump_Number:i}
	//pumpData[i] = singleStage;
	 pumpData.push(singleStage);
	}

    var settings_window_popup = webix.ui({
      view:"window",
      resize:true,
      move:true,
      id:"settings_window",
      head:{view:"button", label:"Close", width:70, click:settings_handler},
      width: 1050,
      height: 800,
      left:550,
      top:100,
      body:{
//      container:"box",
      view:"datatable",
      editable:true,
//      on: {"onItemClick": function () {alert("item has just been clicked");}},
      columns:[
        { id:"Pump_Number",    header:"Pump Number",   width:50},
        { id:"Open_State",   header:"Open State",    width:200, editor:"text"},
        { id:"Closed_State",    header:"Closed State",  width:80, editor:"text"}
          ],
      data: pumpData
     }
  }).show();
  }
  
  }
  
  function settings_handler()
  {
    $$("settings_window").close();
    settings_toggle = 'settings_is_closed';
  }



  function home_button_pressed()
  {
    gui_state = 'home';
    $$("FluigiToolbar").hide();
    
  }
  
  function back_to_fluigi_pressed()
  {
    gui_state = 'fluigi';
    $$("FluigiToolbar").show();
   
  }
  // returns true if cursor is within button range
  function isOver(im_x, im_y, im_width, im_height) {
    if ( (mouseX > im_x) && (mouseX < im_x + im_width) && (mouseY > im_y) && (mouseY < im_y + im_height) ) return true;
    else return false;
  }
 
 function mouseClicked(){
   if(gui_state=='home'){
      if (isOver ((width/100)*75 , (height/100)*77, width/9,height/13))
      {
        about_button_pressed();
      }
      else if (isOver((width/100)* 75 , (height/100)*68, width/9, height/13) && (help_toggle == 'help_is_closed') )
      {
        help_button_pressed();
        help_toggle = 'help_is_open';
      }
      else if (isOver(fluigi_logo_X, fluigi_logo_Y, fluigi_logo.width, fluigi_logo.height) ) 
      {
        fluigi_button_pressed();
      }
    } 
 }
  function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function initiate_pump_DataTable(numPumps)
{
  var pumpData = [];
  for (var i = 1; i <= numPumps; i++)
  {
  //pumpData[i] = [i,0,0];
    pumpData[i] = {id:i,Open_State:"x",Closed_State:"y",Pump_Number:i};
  }
//  { id:1, Open_State:"x", Closed_State:"y", Pump_Number:1},
  return pumpData; 
}







