/**
 * Created by Priya on 10/07/2016.
 */

$(function() {

    // define tour
    var tour = new Tour({
        debug: true,
        basePath: location.pathname.slice(0, location.pathname.lastIndexOf('/')),
        template: "<div class='popover tour' style='background-color: lightblue;'><div class='arrow'></div><h3 class='popover-title' ></h3>" +
        "<div class='popover-content'></div>" +
        "<div class='popover-navigation'>" +
        "<button class='btn btn-default' data-role='prev'>« Prev</button>" +
        "<button class='btn btn-default' data-role='next'>Next »</button>" +
        "<button class='btn btn-default' data-role='end'>End tour</button>" +
        "</div></div>",
        steps: [
            {
                path: "/dashboard",
                element: "#start_box",
                title: "Start",
                content: "To begin creating a microfluidic chip, you have multiple options:" +
                "Start from scratch and begin with the 'specify' section of the workflow, " +
                "or begin with the 'design' section and import an LFR or MINT." +
                    " Also, you could jump to the 'build', 'assembly', and 'control' sections to fabricate and control your device."
            },
            {
                path: "/dashboard",
                element: "#specify_box",
                title: "Specify",
                content: "Specify the function of your microfluidic chip through a high level description"
            },
            {
                path: "/dashboard",
                element: "#design_box",
                title: "Design",
                content: "Generate a design schematic of your microfluidic chip."
            },
            {
                path: "/dashboard",
                element: "#build_box",
                title: "Build",
                content: "Build your setup and hardware to control the microfluidic chip."
            },
            // {
            //     path: "/dashboard",
            //     element: "#assembly_box",
            //     title: "Assembly",
            //     content: "Put parts together and assemble the entire experiment to start using."
            // },
            // {
            //     path: "/dashboard",
            //     element: "#control_box",
            //     title: "Control",
            //     content: "Control your experiment by turning on and off valves, and opening the syringes to allow liquid into the chip."
            // },
            {
                path: "/specify",
                element: "#editor_specify",
                title: "Editor",
                content: "Write your liquid flow relations (LFR) and UCF in the editor"
            },
            {
                path: "/specify",
                element: "#upload_specifyLFR",
                title: "Upload",
                content: "Or, you could simply upload both files"
            },
            {
                path: "/specify",
                element: "#translate_btnn",
                title: "Translate",
                content: "And when you translate both files, " +
                "you will get a microfluidic netlist (MINT) file that you can use for the next design stage"
            },
            {
                path: "/design",
                element: "#editor_design",
                title: "Editor",
                content: "In the design stage, write or edit your MINT file, and the INI will be provided to you for editing if you wish."
            },
            {
                path: "/design",
                element: "#upload_designMINT",
                title: "Upload",
                content: "Or, you could simply upload your MINT from the previous stage."
            },
            {
                path: "/design",
                element: "#compile_btnn",
                title: "Compile",
                content: "Compile both files to output a JSON and SVG to control and view your microfluidic chip."
            },
            {
                path: "/build",
                element: "#checkVolume",
                title: "Volume",
                content: "Depending on your experiment, input the volume you wish to dispense."
            },
            {
                path: "/build",
                element: "#checkTolerance",
                title: "Tolerance",
                content: "Also, input the tolerance of the servos. You will then be provided with a customized selection of hardware you wish to use, and be provided with an order list" +
                " and your customized 3D printing (stl) files"
            },
            {
                path: "/assembly",
                element: ".stepwizard-row",
                title: "Assembly",
                content: "Go through the steps to assemble your microfluidic chip."
            },
            {
                path: "/serialcommunication",
                element: "#begin-comm",
                title: "Begin Serial Communication",
                content: "This button will open serial communication, after which the page would need to be refreshed to load the ports. Then, you can connect to the arduino. " +
                "You should upload the code to the arduino using the arduino program, and Neptune will take over from there"
            },
            {
                path: "/serialcommunication",
                element: "#end-comm",
                title: "End Serial Communication",
                content: "Once you're done, you can end the serial communication."
            },
            {
                path: "/BuildAndVerify",
                element: "#view_container",
                title: "Control",
                content: "Input your SVG file, and control the valves"
            }
        ]
    });

    // initialize tour
    tour.init();

    // start tour
    $('#demo').click(function() {
        tour.restart();
    });

    
    
});




// Element class: . operator
// Element id: # operator