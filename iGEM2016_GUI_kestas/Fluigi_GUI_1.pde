import processing.serial.*;
import controlP5.*;
import java.util.*;
ControlP5 cp5;
Serial myPort;

//////////////////////////////////////////////////////////////////////////////////////////
//    This variable determines what state the GUI is in, i.e. What screen we are on     // 
String gui_state = "Home";                                                              //
int background_color = color(0,0,0);                                                    //
PFont font;                                                                             //
//////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////
//                            Topology Variables                                        //
int numControlPumps;                                                                    //
int numInputs = 10;                                                                     //
//////////////////////////////////////////////////////////////////////////////////////////

List<String> inputList = new ArrayList<String>();

//////////////////////////////////////////////////////////////////////////////////////////
//                             Routing Variables                                        //
int dropdownIndex = 0;                                                                  //
IntList destLevel = new IntList();                                                      //
IntList currentLevel = new IntList();                                                   //
IntList levelDifference = new IntList();                                                //
IntList inputOrder = new IntList();                                                     //
IntList inputDiff = new IntList();                                                      //
boolean cease = false;                                                                  //
boolean greedyFail = false;                                                             //
////////////////////////////////////////////////////////////////////////////////////////// 

//////////////////////////////////////////////////////////////////////////////////////////
//                          Graph display variables                                     //
boolean error = false;                                                                  //
int missingOutput = 0;                                                                  //
//DirectedGraph g = new DirectedGraph();                                                //
//ArrayList<TreeNode> treenodes = new ArrayList<TreeNode>();                            //
//ArrayList<XposerNode> xposernodes = new ArrayList<XposerNode>();                      //  
//ArrayList<Xposer> xposers = new ArrayList<Xposer>();                                  //
//ArrayList<Node> nodes = new ArrayList<Node>();                                        //
//ArrayList<TreeNode> rootnodes = new ArrayList<TreeNode>();                            //
//ArrayList<ArrayList<XposerNode>> validPath = new ArrayList<ArrayList<XposerNode>>();  //
//////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////
//                            Flow Pump variables                                       //
int pwmSpeed = 100;  //PWM duty cycle from 0-255                                        //
float loopDelay = 1;                                                                    //
//////////////////////////////////////////////////////////////////////////////////////////

//***************************  Control Pump variables  *********************************//

///////////////////////////////////////////////////////////////////////////////////////////
//                                 Hardware variables                                    //
float syringeInnerD = 14.74; // mm                                                       //
int syringeMaxCap = 10000; // uL                                                         //
float pitch = 0.8; // mm/rev                                                             //
float stepAngle = 1.8; // deg/step                                                       //
int uStepsPerStep = 1; // uSteps/step                                                    //
int motorMaxSpeed = 1500; // uSteps/s                                                    //
///////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////
//                                     Flow Profile                                      //
float flowAcc = 2000; // uL/s/s                                                          //
float flowSpeed = 300; // uL/s                                                           //
///////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////
//             Calculated Values - update when hardware parameters are updated           //
float ulPerUStep; // ul/ustep                                                            //
float flowMaxSpeed; // ul/s                                                              //
int uStepsAcc; // uL/s/s * uSteps/uL                                                     //
int uStepsSpeed; // uL/s * uSteps/uL                                                     //
int uStepsMove; // uL * uSteps/uL                                                        //
int dispenseVolume;                                                                      //
///////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////
//                        Create arrays of control and flow pumps                        //
//ArrayList<Pump> controlPumps = new ArrayList<Pump>();                                  //
//ArrayList<PumpFlow> flowPumps = new ArrayList<PumpFlow>();                             //
ArrayList<Boolean> crossMap = new ArrayList<Boolean>();                                  //
///////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////
//                                      Constants                                        //
boolean PUSH = true;                                                                     // 
boolean PULL = false;                                                                    //
///////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////
//                                        Flags                                          //
boolean firstActuation = true;                                                           //
///////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////
//                                    Display Variables                                  //
int margin = 50;                                                                         //
int textBoxWidth = 100;                                                                  //
int textBoxHeight = 35;                                                                  //
int buttonHeight = 35;                                                                   //
int buttonWidth = 100;                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////
//                                 Styles, images, ect...                                // 
PImage background_img;                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////



void setup() 
{
  
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
     .setColorBackground(#F0E6E6 )
     //.setColorForeground(#000000 )
     .setOff()
     .getCaptionLabel()
     .setFont(font)
     .setSize(45)
     ;
     
   cp5.addButton("About")
     .setPosition( (width/10)*7 , (height/10)*7)
     .setSize(buttonWidth*2,buttonHeight*2)
     .setLabel(" About ")
     .setColorBackground(#F0E6E6 )
     //.setColorForeground(0xff00ff00)
     .setOff()
     .getCaptionLabel()
     .setFont(font)
     .setSize(20)
     ;
     
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
     
   cp5.addButton("Back_to_Home")
     .setPosition( (width/10)*3, (height/100)*8 )
     .setSize(buttonWidth*2,buttonHeight*2)
     .setLabel(" Home ")
     .setColorBackground(#F0E6E6)
     //.setColorForeground()
     .setOff()
     .getCaptionLabel()
     .setFont(font)
     .setSize(20)
     .setVisible(false)
     ;
   
   //cp5.get(Button.class, "Back_to_Home").setVisible(false);
   //cp5.get(Button.class,"Back_to_Home").setBroadcast(false);

   cp5.addButton("Settings")
     .setPosition( (width/10)*7, (height/100)*8 )
     .setSize(buttonWidth*2,buttonHeight*2)
     .setLabel(" Settings ")
     .setColorBackground(#F0E6E6)
     //.setColorForeground()
     .setOff()
     .getCaptionLabel()
     .setFont(font)
     .setSize(20)
     .setVisible(false)
     ;
   
   //cp5.get(Button.class, "Settings").setVisible(false);
   //cp5.get(Button.class,"Settings").setBroadcast(false);
  
}

void draw() 
{
  
  if (gui_state == "Home")
  {
  background(background_img);
  //textSize(20);
  //noStroke();
  }
  
  if (gui_state == "Fluigi") 
  {
  background(11,33,48);
  //textSize(20);
  //noStroke();
  }
 
  
}

void controlEvent(ControlEvent theEvent) {

  if(theEvent.isController()) 
  {
    print("control event from : "+theEvent.getName());
    println(", value : "+theEvent.getName());
    
    if(theEvent.getName() == "FLUIGI")
    {
      gui_state = "Fluigi";
      
      /////////// Display Fluigi Screen Controllers ////////////
      cp5.get(Button.class,"Back_to_Home").setBroadcast(true);
      cp5.get(Button.class,"Back_to_Home").setVisible(true);
      cp5.get(Button.class,"Settings").setBroadcast(true);
      cp5.get(Button.class,"Settings").setVisible(true);
      /////////////////////////////////////////////////////////
      
      ////////// Hide Home Screen Controllers /////////////////  
      cp5.get(Button.class, "FLUIGI").setVisible(false);
      cp5.get(Button.class,"FLUIGI").setBroadcast(false);
      cp5.get(Button.class,"About").setVisible(false);
      cp5.get(Button.class,"About").setBroadcast(false);
      cp5.get(Button.class,"Help").setVisible(false);
      cp5.get(Button.class,"Help").setBroadcast(false);
      //////////////////////////////////////////////////////////
    }
    
    if(theEvent.getName() == "Back_to_Home")
    { 
       gui_state = "Home";
       
      ////////// Display Home Screen Controllers ////////////////
      cp5.get(Button.class, "FLUIGI").setVisible(true);
      cp5.get(Button.class,"FLUIGI").setBroadcast(true);
      cp5.get(Button.class,"About").setVisible(true);
      cp5.get(Button.class,"About").setBroadcast(true);
      cp5.get(Button.class,"Help").setVisible(true);
      cp5.get(Button.class,"Help").setBroadcast(true);
      //////////////////////////////////////////////////////////
       
      /////////// Hide Fluigi Screen Controllers ////////////////
      cp5.get(Button.class, "Back_to_Home").setVisible(false);
      cp5.get(Button.class,"Back_to_Home").setBroadcast(false);
      cp5.get(Button.class, "Settings").setVisible(false);
      cp5.get(Button.class,"Settings").setBroadcast(false);
      ///////////////////////////////////////////////////////////
       
    }
    if(theEvent.getName() == "About"){
      
    }
    if(theEvent.getName() == "Help"){
      
    }
    
  }
}