/**
 * Created by Priya on 10/07/2016.
 */

$(function() {

    // define tour
    var tour = new Tour({
        debug: true,
        basePath: location.pathname.slice(0, location.pathname.lastIndexOf('/')),
        steps: [
            {
                path: "/",
                element: "#specify",
                title: "Specify",
                content: "The first step to designing your microfluidic device is to describe the function of your device"
            },
            {
                path: "/",
                element: "#design",
                title: "Design",
                content: "The second step is to create a design schematic of your device"
            },
            {
                path: "/",
                element: "#buildverify",
                title: "Build and Verify",
                content: "The last step is to build your device using a CNC mill and 3D printer, and use this interface to control the pump array"
            },
            {
                path: "/",
                element: ".rightCenter",
                title: "About",
                content: "Click on the about button to learn more about the uses and future of Neptune"
            },
            {
                path: "/lfrpage",
                element: "#uploadLFR_start",
                title: "Upload an LFR",
                content: "We can start with the specification. Upload the file containing the liquid flow relations (LFR)"
            },
            {
                path: "/lfrpage",
                element: "#LFR_start_editor",
                title: "LFR Editor",
                content: "You can view your file and edit it here in the editor"
            },
            {
                path: "/lfrpage",
                element: "#downloadFile",
                title: "Push/ Reload/ Save/ Download File",
                content: "After editing the file, you have four options: " +
                "push the LFR to the next stage of designing once you're done, " +
                "reload the LFR to discard all changes, " +
                "save the file to add your changes, " +
                "or download the file to your local directory."
            },
            {
                path: "/uShroomPage",
                element: "#uploadMINT",
                title: "Upload Files",
                content: "In the next design stage, upload your new files. You can upload an LFR and UCF, or you could directly upload a MINT file."
            },
            {
                path: "/uShroomPage",
                element: "#MINT_editor",
                title: "Download File",
                content: "Once again, you can view your file and edit it here in the editor"
            },
            {
                path: "/uShroomPage",
                element: "#saveMINT",
                title: "MINT Options",
                content: "After editing the file, you have four options: " +
                "change the editor settings, " +
                "push the file to the next step, " +
                    "reload the file to discard changes, "+
                "or save the file to add your changes, "
            },
            {
                path: "/fluigipage",
                element: "#uploadForm2",
                title: "Upload JSON and then an SVG",
                content: "In the last step, first upload the JSON file, and then the SVG file to display the microfluidic chip"
            },
            {
                path: "/fluigipage",
                element: "#c",
                title: "Graph",
                content: "Your chip will be displayed here with clickable buttons to open and close valves"
            },
            {
                path: "/fluigipage",
                element: "#settingspage",
                title: "Settings",
                content: "In the settings page, you can specify the pump PWM values that would specify if the pump is open or closed"
            },
            {
                path: "/fluigipage",
                element: "#connected",
                title: "Connecting to an Arduino",
                content: "Then, connect to the arduino to control the pumps"
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
                path: "/fluigipage",
                element: "#myDebuggerBtn",
                title: "Debugger",
                content: "If you want to debug your pumps, you can use this modal to send direct serial commands to the pump array without clicking on the buttons."
            },
            {
                path: "/",
                element: ".rightBottom",
                title: "Help",
                content: "For any further questions, feel free to check out our help page, or email us. Thank you for taking the tour!"
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