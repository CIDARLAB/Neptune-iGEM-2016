
var gui_state = 'home';

function setup() {
  home_background_image = loadImage("resources/background_img.png");
  fluigi_logo= loadImage("resources/fluigi.png");
  createCanvas(1440,1024);
  
  fluigi_button = createButton('FLUIGI');
  fluigi_button.position( (width/100)*40 , (height/100)*40 );
  fluigi_button.size(300,100);
  fluigi_button.mousePressed(fluigi_button_pressed);
  
  about_button = createButton('About');
  about_button.position( (width/100)*75 , (height/100)*77);
  about_button.size(200,50);
  about_button.mousePressed(about_button_pressed);
  
  help_button = createButton('Help');
  help_button.position( (width/100)*75 , (height/100)*70);
  help_button.size(200,50);
  help_button.mousePressed(help_button_pressed);
  
  settings_button = createButton('Settings');
  settings_button.position( (width/100)*15 , (height/100)*5 );
  settings_button.size(200,50);
  settings_button.mousePressed(settings_button_pressed);
  
  home_button = createButton('Home');
  home_button.position( (width/100)*35 , (height/100)*5 );
  home_button.size(200,50);
  home_button.mousePressed(home_button_pressed)
  
  back_to_fluigi = createButton('FLUIGI');
  back_to_fluigi.position( (width/100)*15 , (height/100)*5 );
  back_to_fluigi.size(200,50);
  back_to_fluigi.mousePressed(back_to_fluigi_pressed);
  
  // Because we always start with the "home" state, we set these variables as so: 
  fluigi_button.show();
  about_button.show();
  help_button.show();
  home_button.hide();
  back_to_fluigi.hide();
  settings_button.hide();
  
}

function draw() {
  
  if (gui_state == 'home'){
    background(home_background_image);

  }
  if (gui_state == 'fluigi')
  {
    background(44, 62, 80);
  }
  if (gui_state == 'about')
  {
    
  }
  if (gui_state == 'help')
  {
    
  }
  if (gui_state == "settings")
  {

  }
  
}

function fluigi_button_pressed() 
{
  gui_state = 'fluigi';
  fluigi_button.hide();
  about_button.hide();
  help_button.hide();
  home_button.show();
  back_to_fluigi.hide();
  settings_button.show();
 
}
function about_button_pressed()
{
  //gui_state= 'about';
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
    head:{view:"button", label:"Close", width:70, click:("$$('my_win').close();")},
    width: 200,
    height: 200,
    body:{
        template:"Documentation"
    }
    
}).show();
}

function settings_button_pressed()
{
  gui_state = 'settings';
  fluigi_button.hide();
  about_button.hide();
  help_button.hide();
  home_button.show();
  back_to_fluigi.show();
  settings_button.hide();
}

function home_button_pressed()
{
  gui_state = 'home';
  fluigi_button.show();
  about_button.show();
  help_button.show();
  home_button.hide();
  back_to_fluigi.hide();
  settings_button.hide();
}

function back_to_fluigi_pressed()
{
  gui_state = 'fluigi';
  fluigi_button.hide();
  about_button.hide();
  help_button.hide();
  home_button.show();
  back_to_fluigi.hide();
  settings_button.show();
}