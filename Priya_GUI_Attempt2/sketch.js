
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
  
  exit_button = createButton('X');
  exit_button.position ( (width/100)* 95, (height/100) * 2);
  exit_button.size(50,50);
  exit_button.mousePressed(exit_button_pressed);
}

function draw() {
  
  if (gui_state == 'home'){
    background(home_background_image);
    fluigi_button.show();
    about_button.show();
    help_button.show();
    exit_button.hide();
  }
  if (gui_state == 'fluigi' || gui_state == 'about' || gui_state == 'help')
  {
    createCanvas(1440,1024);
    background(44, 62, 80);
    fluigi_button.hide();
    about_button.hide();
    help_button.hide();
    exit_button.show();
  }
    
}

function fluigi_button_pressed() 
{
  gui_state = 'fluigi';
 
}
function about_button_pressed()
{
  gui_state= 'about';
}
function help_button_pressed()
{
  gui_state= 'help';
}

function exit_button_pressed()
{
  gui_state= 'home'; 
}
