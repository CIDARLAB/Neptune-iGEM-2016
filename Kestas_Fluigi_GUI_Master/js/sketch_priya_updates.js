var gui_state = 'home';
​
function setup() {
 
  home_background_image = loadImage("resources/background_img.png");
  fluigi_logo= loadImage("resources/fluigi.png");
  fluigi_highlighted_logo= loadImage("resources/fluigi_highlighted.png");
  createCanvas(1440,1024);
  
  about_button = createButton('About');
  about_button.position( (width/100)*75 , (height/100)*76);
  about_button.size(250,70);
  about_button.mousePressed(about_button_pressed);
  smooth();
  
  help_button = createButton('Help');
  help_button.position( (width/100)* 75 , (height/100)*68);
  help_button.size(250,70);
  help_button.mousePressed(help_button_pressed);
  
  exit_button = createButton('X');
  exit_button.position ( (width/100)* 95, (height/100) * 2);
  exit_button.size(50,50);
  exit_button.mousePressed(exit_button_pressed);
​
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
  
}
​
function draw() {
  
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
    
    
  //If the mouse is hovering over the logo, display the highlighted logo
    if (mouseX > ((width/100)*35) && mouseX < (fluigi_logo.width + (width/100)*35) 
        && mouseY > ((height/100)*35) && mouseY < (fluigi_logo.height + ((height/100)*35)) )
    {
      image(fluigi_highlighted_logo, (width/100)*35 , (height/100)*35, fluigi_logo.width, fluigi_logo.height )
     //Move to next page if the mouse is pressed 
      if (mouseIsPressed){
        fluigi_button_pressed();
      }
    }
    //If the mouse is not hovering over the logo, display the original logo
    else
    {
      image(fluigi_logo, (width/100)*35 , (height/100)*35, fluigi_logo.width, fluigi_logo.height);
    }
  }
  
  //////////////////////////////////////////////////////////////////
  //                 FLUIGI PAGE
  //////////////////////////////////////////////////////////////////
  if (gui_state == 'fluigi')
  {
    createCanvas(1440,1024);
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
    createCanvas(1440,1024);
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