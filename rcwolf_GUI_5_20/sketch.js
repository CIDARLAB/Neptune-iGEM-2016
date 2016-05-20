var gui_state = 'home';
var help_toggle= 'help_is_closed';
var settings_toggle = "settings_is_closed";
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
  
  exit_button = createButton('X');
  exit_button.mousePressed(exit_button_pressed);
  
  settings_button = createButton('Settings');
  settings_button.mousePressed(settings_button_pressed);
  
  //home_button = createButton('Home');
  //home_button.mousePressed(home_button_pressed)
  
  back_to_fluigi = createButton('FLUIGI');
  back_to_fluigi.mousePressed(back_to_fluigi_pressed);
  
  
}
function draw() {
 
  exit_button.position ( (width/100)* 94, (height/100) * 2);
  exit_button.size(width/25,height/25);

  settings_button.position( (width/100)*15 , (height/100)*5 );
  settings_button.size(width/9,height/13);

  //home_button.position( (width/100)*35 , (height/100)*5 );
  //home_button.size(width/9,height/13);

  back_to_fluigi.position( (width/100)*15 , (height/100)*5 );
  back_to_fluigi.size(width/9,height/13);
  
  //////////////////////////////////////////////////////////////////
  //                 HOME PAGE
  //////////////////////////////////////////////////////////////////
  
  if (gui_state == 'home'){
    background(home_background_image);
    exit_button.hide();
   // home_button.hide();
    back_to_fluigi.hide();
    settings_button.hide();
    
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
    
    //home_button.show();
    back_to_fluigi.hide();
    //settings_button.show();




      
  }
  
  
 //////////////////////////////////////////////////////////////////
 //                 SETTINGS PAGE
 //////////////////////////////////////////////////////////////////
  
  if (gui_state == 'settings'){
  
    //home_button.show();
    back_to_fluigi.show();
    //settings_button.hide();
  }
    
}
  //////////////////////////////////////////////////////////////////
  //                 BUTTONS
  //////////////////////////////////////////////////////////////////
 
  function fluigi_button_pressed()
  {
    gui_state= 'fluigi';


    webix.ui({
    view:"toolbar",
    id:"FluigiToolbar",
    cols:[
        { view:"button", type:"imageTop", image:"resources/fluigi_transparent.png", width:360, height:95 },
        { view:"button", type:"imageTop", image:"resources/home.png", width:220, height:90, click: home_button_pressed},
        {},
        { view:"button", type:"imageTop", image:"resources/not_connected.png", width:85, height:85 },
        { view:"button", type:"imageTop", image:"resources/settings.gif", width:85, height:85, click: settings_button_pressed}]
    }).show();


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
  if( settings_toggle == 'settings_is_closed'){
    //gui_state = 'settings';
  settings_toggle = 'settings_is_open';
    
/*  var pumpTable = new webix.ui({
    view:"datatable",
    footer:true,
    editable:true,
    //autoconfig:true,
    columns:[
        {id:"Pump number", header:["Pump Number"]},
        {id:"Open state", header:["Open State"]},
        {id:"Closed state", header:["Closed State"]}
        ]}) */
  
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
