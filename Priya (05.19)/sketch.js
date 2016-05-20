var gui_state = 'home';
function setup() {
 
  home_background_image = loadImage("resources/background_img.png");
  fluigi_logo= loadImage("resources/fluigi.png");
  fluigi_highlighted_logo= loadImage("resources/fluigi_highlighted.png");
  createCanvas(windowWidth ,windowHeight);
  
  about_button = createButton('About');
  about_button.mousePressed(about_button_pressed);
  
  help_button = createButton('Help');
  help_button.mousePressed(help_button_pressed);
  
  exit_button = createButton('X');
  exit_button.mousePressed(exit_button_pressed);
  
  settings_button = createButton('Settings');
  settings_button.mousePressed(settings_button_pressed);
  
  home_button = createButton('Home');
  home_button.mousePressed(home_button_pressed)
  
  back_to_fluigi = createButton('FLUIGI');
  back_to_fluigi.mousePressed(back_to_fluigi_pressed);
  
}
function draw() {
  about_button.position( (width/100)*75 , (height/100)*77);
  about_button.size(width/9,height/13);
  
  help_button.position( (width/100)* 75 , (height/100)*68);
  help_button.size(width/9,height/13);
 
  exit_button.position ( (width/100)* 94, (height/100) * 2);
  exit_button.size(width/25,height/25);

  settings_button.position( (width/100)*15 , (height/100)*5 );
  settings_button.size(width/9,height/13);

  home_button.position( (width/100)*35 , (height/100)*5 );
  home_button.size(width/9,height/13);

  back_to_fluigi.position( (width/100)*15 , (height/100)*5 );
  back_to_fluigi.size(width/9,height/13);
  
  //////////////////////////////////////////////////////////////////
  //                 HOME PAGE
  //////////////////////////////////////////////////////////////////
  
  if (gui_state == 'home'){
    background(home_background_image);
    about_button.show();
    help_button.show();
    exit_button.hide();
    home_button.hide();
    back_to_fluigi.hide();
    settings_button.hide();
    
    // define the position of the logo with respect to the size of the board
    fluigi_logo_X = ( (width/2)-(width/5) );
    fluigi_logo_Y = ( (height/2)-(height/8) );
    
    // if mouse is hovering over fluigi logo display hollow button, resopond to click
    if ( isOver(mouseX, mouseY, fluigi_logo_X, fluigi_logo_Y, fluigi_logo.width, fluigi_logo.height) ) {
      image(fluigi_highlighted_logo, fluigi_logo_X , fluigi_logo_Y, width/3.3, height/6.5);
      if (mouseIsPressed) {
        fluigi_button_pressed();
      }
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
    about_button.hide();
    help_button.hide();
    home_button.show();
    back_to_fluigi.hide();
    settings_button.show();
  }
  
  
 //////////////////////////////////////////////////////////////////
 //                 HELP PAGE
 //////////////////////////////////////////////////////////////////
  if (gui_state == 'help'){
    createCanvas(windowWidth ,windowHeight);
    background(44, 62, 80);
    var strWindowFeatures = '';
    var help_window;
    about_button.hide();
    help_button.hide();
    exit_button.show();
  }
  
 //////////////////////////////////////////////////////////////////
 //                 SETTINGS PAGE
 //////////////////////////////////////////////////////////////////
  
  if (gui_state == 'settings'){
  
    about_button.hide();
    help_button.hide();
    home_button.show();
    back_to_fluigi.show();
    settings_button.hide();
  }
    
}
  //////////////////////////////////////////////////////////////////
  //                 BUTTONS
  //////////////////////////////////////////////////////////////////
 
  function fluigi_button_pressed()
  {
    gui_state= 'fluigi';
  }
  function about_button_pressed()
  {
    var strWindowFeatures = "resizable=yes";
    var about_CIDAR_window = window.open('http://cidarlab.org/fluigi/','About',strWindowFeatures);
  }
  function help_button_pressed()
  {
    gui_state= 'help';
  }
  
  function exit_button_pressed()
  {
    gui_state= 'home'; 
  }
  
  function settings_button_pressed()
  {
    gui_state = 'settings';
  
  }
  
  function home_button_pressed()
  {
    gui_state = 'home';
  }
  
  function back_to_fluigi_pressed()
  {
    gui_state = 'fluigi';
   
  }
  // returns true if cursor is within button range
  function isOver(x, y, im_x, im_y, im_width, im_height) {
    if ( (x > im_x) && (x < im_x + im_width) && (y > im_y) && (y < im_y + im_height) ) return true;
    else return false;
  }
  
  function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}