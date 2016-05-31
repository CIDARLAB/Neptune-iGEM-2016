var gui_state = 'home';
var help_toggle= 'help_is_closed';
var settings_toggle = "settings_is_closed";
var numPumps = 11;
var hide=0;

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
  
  createCanvas(windowWidth, windowHeight);

  // TEMPLATE GRAPH c/o Krishna on Slack
  //temp_graph = loadImage("test1_device_flow.svg");
  
  
  
}


function draw() {
 
  
  //////////////////////////////////////////////////////////////////
  //                 HOME PAGE
  //////////////////////////////////////////////////////////////////
  
  if (gui_state == 'home'){
    createCanvas(windowWidth, windowHeight);
    background(home_background_image);

    // scale factor for help and about buttons
    button_scale = 1 - 180/height;
    fluigi_scale = 1 - 150/height;


    help_X = (width/100)*75;
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
    createCanvas(windowWidth , 0);
    background(44, 62, 80);
    fill(52, 152, 219);



    //image(temp_graph, 0, 0);
      
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
 
function fluigi_button_pressed() {
  gui_state= 'fluigi';

  // to be set when device is connected
  is_connected = false;
  if (9<20) is_connected = true;

  if (is_connected) connectivity = "resources/connected.png";
  else connectivity = "resources/not_connected.png";

  //image(temp_graph, 0, 0);





  webix.ui({
  view:"toolbar",
  id:"FluigiToolbar",
  cols:[
      { view:"button", type:"imageTop", id:"fluigi_logo_static", image:"resources/fluigi_transparent.png", width: 360, height: 80 },
      { view:"button", type:"imageTop", image:"resources/home.png", width: 210, height: 80, click: home_button_pressed},
      {},
      { view:"button", type:"imageTop", id:"device_indicator_static", image:connectivity, width: 85, height: 80 },
      { view:"button", type:"imageTop", image:"resources/settings.png", width: 85, height: 80, click: settings_button_pressed}]
  }).show();

  $$("fluigi_logo_static").disable();
  $$("device_indicator_static").disable();




  var hide_toolbar = webix.ui({
      view:"toolbar",
      id:"hide_toolbar",
      height: 35,
      type: "head",
      cols:[

            {
                view:"button",
                type:"imageTop",
                image:"resources/up-down.png",
                value: "Hide/Show Toolbar",
                height:35, click: hide_inputs,
                id:"hide"
            }
          ]
        }).show();

  var drag_and_drop_toolbar = webix.ui({
    view:"toolbar",
    complexData:true,
    id:"file_inputs",
    height: 100,
    type: "head",
    cols:[
      {
        view:"form",
        rows:[
          {
            view:"uploader",
            id: "upl1",
            value:"Upload JSON file",
            link:"mylist",
            upload:"resources/upload.json", //path that gets uploaded information
            datatype:"js"
            //width: width/2
            
          }, 
          {
            view:"list",  
            id:"mylist", 
            type:"uploader", 
            autoheight:true, 
            borderless:true, 
            multiple:false
            //width: width/2

          }
        ]
      },
      {
        view:"form", 
        rows:[
          {
            view:"uploader",
            id: "upl2",
            value:"Upload SVG file",
            link:"mylist2",
            upload:"resources/upload.svg", //path that gets uploaded information
            datatype:"svg"
            //width: width/2
          }, 
          {
            view:"list",  
            id:"mylist2", 
            type:"uploader",
            autoheight:true, 
            borderless:true, 
            multiple: false
            //width: width/2
          }       
        ]
      }
    ]
  }).show();
  
  // ERROR CHECK for file uploads (file types)
  $$("upl1").attachEvent("onBeforeFileAdd", function(item){
    var type = item.type.toLowerCase();
      if (type != "js"){
        webix.alert("Only JSON files are supported");
        return false;
      }
  });
  
  $$("upl2").attachEvent("onBeforeFileAdd", function(item){
    var type = item.type.toLowerCase();
    if (type != "svg"){
      webix.alert("Only SVG files are supported");
      return false;
    }
  });
        
  
  //HOW TO ACCESS FILES: see: http://docs.webix.com/desktop__file_upload.html
  /*
  
  $$("upl1").files.data.pull; 
  
  var file_id = $$("upl1").files.getFirstId(); //getting the ID
  var fileobj = $$("upl1").files.getItem(file_id).file; //getting file object
  filename = $$("upl1").files.getItem(file_id).name; //getting properties
  
  $$("upl1").files.getFirstId(); //get ID of the first element from the collection
   
  var file2= $$("upl1").files.getNextId(id);//get ID of the next file according to the specified one
  
  */


//var s = Snap();
// Snap.load("test1_device_flow.svg", function(f) {
//   s.append(f.select("g"));
// });




}


function hide_inputs()
  {
    if (hide==0){ //hide toolbar
      hide=1;
      $$("file_inputs").hide();
    }
    else if (hide==1){ //show toolbar
      hide=0;
      $$("file_inputs").show();

      $$("hide_toolbar").show();
    }
  }
 



function about_button_pressed() {
  var strWindowFeatures = "resizable=yes";
  var about_CIDAR_window = window.open('http://cidarlab.org/fluigi/','About',strWindowFeatures);
}

function help_button_pressed() {

    
  var help_window_popup = webix.ui({
    view:"window",
    resize:true,
    move:true,
    id:"help_window",
    head:{view:"button", label:"Close", width:70, click:help_handler}, //("$$('help_window').close();") click:(help_toggle = 'help_is_closed')},
    width: 1050,
    height: 800,
    left: 550,
    top: 100,
    body: {
        template:"<img src='resources/Fluigi_HELP.jpg'/>"
    }
  }).show();
}


  
function help_handler() {
  $$("help_window").close();
  help_toggle = 'help_is_closed';
}
  
  
function exit_button_pressed() {
  gui_state= 'home'; 
}
  

function settings_button_pressed() {
  gui_state = 'settings';

  if( settings_toggle == 'settings_is_closed')
  {
    settings_toggle = 'settings_is_open';
  
  var pumpData = [];
  for (var i = 1; i <= numPumps; i++)
  {
     var singleStage = { id:i, Open_State:0, Closed_State:0, Pump_Number:i}
  //pumpData[i] = singleStage;
   pumpData.push(singleStage);
  }

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
//      container:"box",
      view:"datatable",
      editable:true,
//      on: {"onItemClick": function () {alert("item has just been clicked");}},
      columns:[
        { id:"Pump_Number",    header:"Pump Number",   width:50},
        { id:"Open_State",   header:"Open State",    width:200, editor:"text"},
        { id:"Closed_State",    header:"Closed State",  width:80, editor:"text"}
          ],
      data: pumpData
     }
  }).show();
  }
  
  }
  
  function settings_handler()
  {

    $$("settings_window").close();
    settings_toggle = 'settings_is_closed';
    gui_state = 'fluigi';
  }



function home_button_pressed() {
  gui_state = 'home';
  $$("FluigiToolbar").hide();
  $$("file_inputs").hide();
  $$("hide_toolbar").hide();
}
  


function back_to_fluigi_pressed() {
  gui_state = 'fluigi';
  $$("FluigiToolbar").show();
  $$("file_inputs").show();
  $$("hide_toolbar").show();
  hide = 1;
}



// returns true if cursor is within button range
function isOver(im_x, im_y, im_width, im_height) {
  if ( (mouseX > im_x) && (mouseX < im_x + im_width) && (mouseY > im_y) && (mouseY < im_y + im_height) ) return true;
  else return false;
}


 
function mouseClicked() {
  if(gui_state=='home') {
    if (isOver ((width/100)*75 , (height/100)*77, width/9,height/13)) {
      about_button_pressed();
    }
    else if (isOver((width/100)* 75 , (height/100)*68, width/9, height/13) && (help_toggle == 'help_is_closed') ) {
      help_button_pressed();
      help_toggle = 'help_is_open';
    }
    else if (isOver(fluigi_logo_X, fluigi_logo_Y, fluigi_logo.width, fluigi_logo.height) ) {
      fluigi_button_pressed();
    }
  } 
}



function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}



function initiate_pump_DataTable(numPumps) {
  var pumpData = [];
  for (var i = 1; i <= numPumps; i++) {
    //pumpData[i] = [i,0,0];
    pumpData[i] = {id:i,Open_State:"x",Closed_State:"y",Pump_Number:i};
  }
  //  { id:1, Open_State:"x", Closed_State:"y", Pump_Number:1},
  return pumpData; 
}

