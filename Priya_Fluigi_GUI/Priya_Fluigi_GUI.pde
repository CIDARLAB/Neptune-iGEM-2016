import processing.serial.*;
import controlP5.*;
import java.util.*;

ControlP5 cp5;
Serial myPort;

//This variable determines what state the GUI is in 
char gui_state = 'a'; 


int background_color = color(0,0,0);
PFont font;

//Topology Variables
int numControlPumps;
int numInputs = 10;
List<String> inputList = new ArrayList<String>();

//Routing Variables
int dropdownIndex = 0;
IntList destLevel = new IntList();
IntList currentLevel = new IntList();
IntList levelDifference = new IntList();
IntList inputOrder = new IntList();
IntList inputDiff = new IntList();
boolean cease = false;
boolean greedyFail = false;

//Graph display variables
boolean error = false;
int missingOutput = 0;
//DirectedGraph g = new DirectedGraph();
//ArrayList<TreeNode> treenodes = new ArrayList<TreeNode>();
//ArrayList<XposerNode> xposernodes = new ArrayList<XposerNode>();
//ArrayList<Xposer> xposers = new ArrayList<Xposer>();
//ArrayList<Node> nodes = new ArrayList<Node>();
//ArrayList<TreeNode> rootnodes = new ArrayList<TreeNode>();
//ArrayList<ArrayList<XposerNode>> validPath = new ArrayList<ArrayList<XposerNode>>();

//Flow Pump variables
int pwmSpeed = 100;  //PWM duty cycle from 0-255
float loopDelay = 1;

//Control Pump variables
// Hardware 
float syringeInnerD = 14.74; // mm
int syringeMaxCap = 10000; // uL
float pitch = 0.8; // mm/rev
float stepAngle = 1.8; // deg/step
int uStepsPerStep = 1; // uSteps/step
int motorMaxSpeed = 1500; // uSteps/s
// Flow Profile
float flowAcc = 2000; // uL/s/s
float flowSpeed = 300; // uL/s    
// Calculated Values - update when hardware parameters are updated
float ulPerUStep; // ul/ustep
float flowMaxSpeed; // ul/s
int uStepsAcc; // uL/s/s * uSteps/uL
int uStepsSpeed; // uL/s * uSteps/uL
int uStepsMove; // uL * uSteps/uL
int dispenseVolume;

//Create arrays of control and flow pumps
//ArrayList<Pump> controlPumps = new ArrayList<Pump>();
//ArrayList<PumpFlow> flowPumps = new ArrayList<PumpFlow>();
ArrayList<Boolean> crossMap = new ArrayList<Boolean>();

//Constants
boolean PUSH = true;
boolean PULL = false;

//Flags
boolean firstActuation = true;

//Display Variables
int margin = 50;
int textBoxWidth = 100;
int textBoxHeight = 35;
int buttonHeight = 35;
int buttonWidth = 100;


// Styles, images, ect... 
PImage background_img; 

void setup() {
  size(1440,1024);
  background_img = loadImage("background_img.png");
  //fullScreen();
  font = createFont("AndaleMono-48.vlw",15, false);
  textFont(font);
  
    cp5 = new ControlP5(this);
  
  cp5.addButton("FLUIGI")
      .setPosition( (width/100)*40 , (height/100)*40 )
      .setSize(buttonWidth*3,buttonHeight*3)
       .setLabel(" FLUIGI ")
      .setColorBackground(#F0E6E6)
      //.setColorForeground(#000000)
      .setOff()
      .getCaptionLabel()
      .setFont(font)
      .setSize(45)
     ;
     
    
    //cp5.getController("FLUIGI");
      
    cp5.addButton("About")
      .setPosition( (width/10)*7 , (height/10)*7)
      .setSize(buttonWidth*2,buttonHeight*2)
      .setLabel(" About ")
      .setColorBackground(#F0E6E6)
      //.setColorForeground(0xff00ff00)
      .setOff()
      .getCaptionLabel()
      .setFont(font)
      .setSize(20)
      ;
      
    //cp5.getController("About");
  
     
    cp5.addButton("Help")
      .setPosition( (width/10)*7 , (height/10)*8)
      .setSize(buttonWidth*2,buttonHeight*2)
      .setLabel(" Help ")
      .setColorBackground(#F0E6E6)
      //.setColorForeground(0xff00ff00)
      .setOff()
      .getCaptionLabel()
      .setFont(font)
      .setSize(20)
      ;
    
    //cp5.getController("Help");
    
    cp5.addButton("EXIT")
        .setPosition(1300,10)
        .setSize(buttonWidth, buttonHeight)
        .setLabel("X")
        .setFont(font)
        .setOff()
        .setColorBackground(#F0E6E6)
        ;

    
    
    //cp5.setColorForeground(0xffaaaaaa)
    // .setColorBackground(0xffffffff)
    // .setColorValueLabel(0xff00ff00)
    // ;
     
    //cp5.getTab("default")
    // .setLabel(" Controller ")
    // .setColorLabel(0xff000000)
    // .setColorActive(0xffaaaaaa)
    // .setWidth(width/3)
    // ;  
     
    //cp5.addTab("graph")
    // .setLabel(" Graph ")
    // .setColorLabel(0xff000000)
    // .setColorActive(0xffaaaaaa)
    // .setWidth(width/3)
    // .activateEvent(true)
    // ;

    //cp5.addTab("settings")
    // .setLabel(" Settings ")
    // .setColorLabel(0xff000000)
    // .setColorActive(0xffaaaaaa)
    // .setWidth(width/3)
    // .activateEvent(true)
    // ;

    // cp5.addTextfield("controlVolume")
    // .setPosition(margin+3*buttonWidth,(height/4)+buttonHeight)
    // .setSize(textBoxWidth,textBoxHeight)
    // .setFont(font)
    // .setColor(color(50,50,50))
    // .setColorCursor(color(0,0,0))
    // .setText("1000")
    // .setLabel("Air Displacement (uL)")
    // .setColorCaptionLabel(#FFFFFF)
    // ;
     
    //cp5.getController("controlVolume")
    // .getCaptionLabel()
    // .setFont(font)
    // .setSize(12)
    // ;
     
    //  cp5.addTextfield("delay")
    // .setPosition(margin+3.5*buttonWidth, height/16+buttonHeight)
    // .setSize(textBoxWidth,textBoxHeight)
    // .setFont(font)
    // .setColor(color(50,50,50))
    // .setColorCursor(color(0,0,0))
    // .setText("1")
    // .setLabel("Loop Delay")
    // .setColorCaptionLabel(#FFFFFF)
    // ;
     
    //cp5.getController("delay")
    // .getCaptionLabel()
    // .setFont(font)
    // .setSize(12)
    // ;

    //cp5.addButton("startFlow")
    // .setPosition(margin, height/16+buttonHeight)
    // .setSize(buttonWidth,buttonHeight)
    // .setLabel(" Start Flow ")
    // .setColorBackground(0xff00ff00 + 0x88000000)
    // .setColorForeground(0xff00ff00)
    // .setOff()
    // .getCaptionLabel()
    // .setFont(font)
    // .setSize(15)
    // ;

    //cp5.addButton("test")
    // .setPosition(margin,13*(height/16)+buttonHeight)
    // .setSize(buttonWidth,buttonHeight)
    // .setLabel(" Test n ")
    // .setColorBackground(0xff00ff00 + 0x88000000)
    // .setColorForeground(0xff00ff00)
    // .setOff()
    // .getCaptionLabel()
    // .setFont(font)
    // .setSize(15)
    // ;

    //cp5.addButton("randomize")
    // .setPosition(margin+4.5*buttonWidth,7*(height/16)+buttonHeight)
    // .setSize(buttonWidth,buttonHeight)
    // .setLabel(" Random ")
    // .setColorBackground(0xff00ff00 + 0x88000000)
    // .setColorForeground(0xff00ff00)
    // .setOff()
    // .getCaptionLabel()
    // .setFont(font)
    // .setSize(15)
    // ;

    //cp5.addButton("fullSwap")
    // .setPosition(margin+3*buttonWidth,7*(height/16)+buttonHeight)
    // .setSize(buttonWidth,buttonHeight)
    // .setLabel(" full Swap ")
    // .setColorBackground(0xff00ff00 + 0x88000000)
    // .setColorForeground(0xff00ff00)
    // .setOff()
    // .getCaptionLabel()
    // .setFont(font)
    // .setSize(15)
    // ;

    //cp5.addButton("setOutput")
    // .setPosition(margin+1.5*buttonWidth,7*(height/16)+buttonHeight)
    // .setSize(buttonWidth,buttonHeight)
    // .setLabel(" Set Output ")
    // .setColorBackground(0xff00ff00 + 0x88000000)
    // .setColorForeground(0xff00ff00)
    // .setOff()
    // .getCaptionLabel()
    // .setFont(font)
    // .setSize(15)
    // ;

    //cp5.addButton("actuate")
    // .setPosition(margin+1.5*buttonWidth,(height/4)+buttonHeight)
    // .setSize(buttonWidth,buttonHeight)
    // .setLabel(" Actuate ")
    // .setColorBackground(0xff00ff00 + 0x88000000)
    // .setColorForeground(0xff00ff00)
    // .setOff()
    // .getCaptionLabel()
    // .setFont(font)
    // .setSize(15)
    // ;

    //cp5.addButton("route")
    // .setPosition(margin,(height/4)+buttonHeight)
    // .setSize(buttonWidth,buttonHeight)
    // .setLabel("Route")
    // .setColorBackground(0xff00ff00 + 0x88000000)
    // .setColorForeground(0xff00ff00)
    // .setOff()
    // .getCaptionLabel()
    // .setFont(font)
    // .setSize(15)
    // ;

    //cp5.addButton("initialize")
    // .setPosition(margin+6*buttonWidth,(height/4)+buttonHeight)
    // .setSize(buttonWidth,buttonHeight)
    // .setLabel(" Initialize ")
    // .setColorBackground(0xff00ff00 + 0x88000000)
    // .setColorForeground(0xff00ff00)
    // .setOff()
    // .getCaptionLabel()
    // .setFont(font)
    // .setSize(15)
    // ;

    //cp5.addButton("returnToOrigin")
    // .setPosition(margin+4.5*buttonWidth,(height/4)+buttonHeight)
    // .setSize(buttonWidth,buttonHeight)
    // .setLabel(" Return ")
    // .setColorBackground(0xff00ff00 + 0x88000000)
    // .setColorForeground(0xff00ff00)
    // .setOff()
    // .getCaptionLabel()
    // .setFont(font)
    // .setSize(15)
    // ;

    //cp5.addTextfield("output")
    // .setPosition(margin, 7*(height/16)+buttonHeight)
    // .setSize(textBoxWidth,textBoxHeight)
    // .setFont(font)
    // .setColor(color(50,50,50))
    // .setColorCursor(color(0,0,0))
    // .setLabel("Select from dropdown menu")
    // .setVisible(true)
    // ;  
     
    //cp5.getController("output")
    // .getCaptionLabel()
    // .setFont(font)
    // .setSize(12)
    // ;

    //cp5.addTextfield("numInputsTxt")
    // .setPosition(margin+buttonWidth*1.5, height/16+buttonHeight)
    // .setSize(25,textBoxHeight)
    // .setFont(font)
    // .setColor(color(50,50,50))
    // .setColorCursor(color(0,0,0))
    // .setLabel("Number of Inputs")
    // .setText(str(numInputs))
    // .setColorCaptionLabel(#FFFFFF)
    // ;   
     
    //cp5.getController("numInputsTxt")
    // .getCaptionLabel()
    // .setFont(font)
    // .setSize(12)
    // ;

    //cp5.addButton("numInputsBtn")
    // .setPosition(margin+buttonWidth*2, height/16+buttonHeight)
    // .setSize(buttonWidth,buttonHeight)
    // .setLabel(" Enter ")
    // .setColorBackground(0xff00ff00 + 0x88000000)
    // .setColorForeground(0xff00ff00)
    // .setOff()
    // .getCaptionLabel()
    // .setFont(font)
    // .setSize(15)
    // ;
     
    //  cp5.addScrollableList("dropdown")
    // .setPosition(20+width/2, height/16)
    // .setSize(width/2-40, height-40)
    // .setBarHeight(buttonHeight)
    // .setItemHeight(buttonHeight)
    // .addItems(inputList)
    // .setLabel("Routing: Input - Output")
    // .setColorBackground(#00ffff + 0x88000000)
    // .setType(ScrollableList.DROPDOWN)
    // .setOpen(true) 
    // .getValueLabel()
    // .setColor(0)
    // .setFont(font)
    // .setSize(15)
    // ;
     
    //cp5.getController("dropdown")
    // .getCaptionLabel()
    // .setColor(#FF0000)
    // .setFont(font)
    // .setSize(15)
    // ; 
}

void draw() {
  
  if (gui_state == 'a')
  {
      cp5.get(Button.class, "FLUIGI").setVisible(true);
      cp5.get(Button.class,"FLUIGI").setBroadcast(true);
      cp5.get(Button.class,"About").setVisible(true);
      cp5.get(Button.class,"About").setBroadcast(true);
      cp5.get(Button.class,"Help").setVisible(true);
      cp5.get(Button.class,"Help").setBroadcast(true);
      
      //EXIT BUTTON TURNED OFF
      cp5.get(Button.class,"EXIT").setVisible(false);
      cp5.get(Button.class,"EXIT").setBroadcast(false);
 
  background(background_img);
  textSize(20);
  noStroke();
  
  }
  if (gui_state == 'b' || gui_state=='h' || gui_state=='d') 
  {
    
    background(#2c3e50);
      cp5.get(Button.class, "FLUIGI").setVisible(false);
      cp5.get(Button.class,"FLUIGI").setBroadcast(false);
      cp5.get(Button.class,"About").setVisible(false);
      cp5.get(Button.class,"About").setBroadcast(false);
      cp5.get(Button.class,"Help").setVisible(false);
      cp5.get(Button.class,"Help").setBroadcast(false);
      
      //EXIT BUTTON
      cp5.get(Button.class,"EXIT").setVisible(true);
      cp5.get(Button.class,"EXIT").setBroadcast(true);
  }
 
  
}

void controlEvent(ControlEvent theEvent) {
  /* events triggered by controllers are automatically forwarded to 
     the controlEvent method. by checking the name of a controller one can 
     distinguish which of the controllers has been changed.
  */ 
 
  /* check if the event is from a controller otherwise you'll get an error
     when clicking other interface elements like Radiobutton that don't support
     the controller() methods
  */
  
  if(theEvent.isController()) {
    print("control event from : "+theEvent.getName());
    println(", value : "+theEvent.getName());
     
    if(theEvent.getName() == "FLUIGI"){
      gui_state = 'b';
    }
    if(theEvent.getName() == "About"){
       gui_state = 'd';
    }
    if(theEvent.getName() == "Help"){
      gui_state='h';
    }
    
    if(theEvent.getName() == "EXIT"){
      gui_state = 'a';      
    }
    
  }
}

void drawHome() {
  
}

void drawMain() {
  
}

void drawOptions() {
  
}

void drawHelp() {
  
}

void drawAbout() {
  
} 