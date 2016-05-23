var gui_state = 'home';
var help_toggle= 'help_is_closed';
var settings_toggle = "settings_is_closed";
function setup() {
 
  home_background_image = loadImage("resources/background_img.png");
  
  //Home Page
  fluigi_highlighted_logo = loadImage("resources/fluigi.png");
  fluigi_logo= loadImage("resources/fluigi_highlighted.png");
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

    // scale factor for help and about buttons
    button_scale = 1 - 180/height;
    fluigi_scale = 1 - 150/height;



    help_X = (width/100)* 75;
    help_Y = (height/100)*68;
    
    //HELP Button
    if (isOver(help_X, help_Y, 301*button_scale, 87*button_scale))
      {
        image(help_highlighted, help_X, help_Y, 301*button_scale, 87*button_scale);
      }
    else{
      image(help, help_X, help_Y, 301*button_scale, 87*button_scale);
    }


    
    //ABOUT Button
    if (isOver (help_X , (help_Y + 87*button_scale + 15), 301*button_scale, 87*button_scale))
      {
        image(about_highlighted, help_X, (help_Y + 87*button_scale + 15), 301*button_scale, 87*button_scale);
      }
    else{
        image(about, help_X , (help_Y + 87*button_scale + 15), 301*button_scale, 87*button_scale);
      }


    
    // define the position of the logo with respect to the size of the board
    fluigi_logo_X = ( (width/2) - (508*fluigi_scale/2) );
    fluigi_logo_Y = ( (height/2) - (height/8) );
    
    // if mouse is hovering over fluigi logo display hollow button, resopond to click
    if (isOver(fluigi_logo_X, fluigi_logo_Y, 508*fluigi_scale, 127*fluigi_scale) ) {
      image(fluigi_highlighted_logo, fluigi_logo_X , fluigi_logo_Y, 508*fluigi_scale, 127*fluigi_scale);
    }
    // otherwise display filled logo
    else {
      image(fluigi_logo, fluigi_logo_X , fluigi_logo_Y, 508*fluigi_scale, 127*fluigi_scale);
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




    // to be set when device is connected
    is_connected = false;

    if (is_connected) connectivity = "resources/connected.png";
    else connectivity = "resources/not_connected.png";


    webix.ui({
    view:"toolbar",
    id:"FluigiToolbar",
    cols:[
        { view:"button", type:"imageTop", id:"fluigi_logo_static", image:"resources/fluigi_transparent.png", width:360, height:80 },
        { view:"button", type:"imageTop", image:"resources/home.png", width:210, height:80, click: home_button_pressed},
        {},
        { view:"button", type:"imageTop", id:"device_indicator_static", image:connectivity, width:85, height:80 },
        { view:"button", type:"imageTop", image:"resources/settings.png", width:85, height:80, click: settings_button_pressed}]
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
  

  function settings_button_pressed()
  {
  if( settings_toggle == 'settings_is_closed'){
    //gui_state = 'settings';
  settings_toggle = 'settings_is_open';
    
  
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
        view:"datatable",
    editable:true,
    columns:[
        { id:"Pump_Number",    header:"Pump Number",   width:50},
        { id:"Open_State",   header:"Open State",    width:200, editor:"text"},
        { id:"Closed_State",    header:"Closed State",  width:80, editor:"text"}
          ],
    data: [
        { id:1, Open_State:"a", Closed_State:"x", Pump_Number:1},
        { id:2, Open_State:"b", Closed_State:"y", Pump_Number:2}
        ]
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
