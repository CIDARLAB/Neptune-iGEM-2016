import processing.serial.*;
import controlP5.*;
import java.util.*;

ControlP5 cp5;
Serial myPort;

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
  int width = 1200;
  int height = 680;
  size(1200, 680);
  
  //fullScreen();
  background_img = loadImage("background_img.png");
  background_img.resize(width, height);
  font = createFont("OpenSans-Regular.ttf", 72, false);
  textFont(font);
  
    cp5 = new ControlP5(this);
  
    cp5.addButton("FLUIGI")
      .setPosition( (width/2) , (height/2) )
      .setSize(buttonWidth, buttonHeight)
       .setLabel(" FLUIGI ")
      .setColorBackground(0xff00ff00 + 0x88000000)
      //.setColorForeground(0xff00ff00)
      .setOff()
      .getCaptionLabel()
      .setFont(font)
      .setSize(75)
      ;
      
    cp5.getController("FLUIGI");
      
    cp5.addButton("About")
      .setPosition( (width/10)*7 , (height/10)*7)
      .setSize(buttonWidth,buttonHeight)
      .setLabel(" About ")
      .setColorBackground(0xff00ff00 + 0x88000000)
      //.setColorForeground(0xff00ff00)
      .setOff()
      .getCaptionLabel()
      .setFont(font)
      .setSize(48)
      ;
      
    cp5.getController("About");
      
    cp5.addButton("Help")
      .setPosition( (width/10)*7 , (height/10)*8)
      .setSize(buttonWidth,buttonHeight)
      .setLabel(" Help ")
      .setColorBackground(0xff00ff00 + 0x88000000)
      //.setColorForeground(0xff00ff00)
      .setOff()
      .getCaptionLabel()
      .setFont(font)
      .setSize(48)
      ;
    
    cp5.getController("Help");
    
  
}

void draw() {
  background(background_img);
  textSize(20);
  //fill(245);
  noStroke();
  //rect(0,20,width,height-40);
 
  
}