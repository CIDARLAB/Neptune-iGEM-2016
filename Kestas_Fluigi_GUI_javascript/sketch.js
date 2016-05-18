
var gui_state = 'Home';


function setup() {
  home_background_image = loadImage("resources/background_img.png");
  createCanvas(1440,1024);
  
  fluigi_button = createButton('FLUIGI');
  fluigi_button.position( (width/100)*40 , (height/100)*50 );
  fluigi_button.size(150,50);
  fluigi_button.mousePressed(fluigi_button_pressed)
  
  about_button = createButton('About');
  about_button.position( (width/100)*75 , (height/100)*20 );
  about_button.size(90,30);
  
  help_button = createButton('Help');
  help_button.position( (width/100)*75 , (height/100)*35 );
  help_button.size(90,30);
}

function draw() {
  
  if (gui_state == 'Home')
    background(home_background_image);
  if (gui_state == 'Fluigi')
  {
    createCanvas(1440,1024);
    background(11,33,48);
  }
    
}

function fluigi_button_pressed() 
{
  gui_state = 'fluigi';
}
function about_button_pressed()
{

}
function help_button_pressed()
{
  
}