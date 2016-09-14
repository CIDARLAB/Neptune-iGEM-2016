/**
 * Created by kestas on 7/19/2016.
 */
var cmd = require('node-cmd');
var exports = module.exports;
var multer = require('multer');
var express = require('express');
var fs = require('fs');
const readline = require('readline');
const path = require('path');
var slash = require('slash');
var replace = require("replace");
var lineder = require( "lineder" );

io = require('socket.io')(global.server);
io.on('connection', function(socket){
    console.log('a user connected');
});

exports.compileMint = function(req, res)
{
    var count = 0;

    var mint_path  = req.body.filePathMINT;
    var ini_path   = req.body.filePathINI;
    var lfr_path = req.body.filePathLFR;
    var ucf_path = req.body.filePathUCF;

    var out_folder = req.body.outPath;
    var name       = req.body.name;
    var basename   = req.body.base_name;
    var outputPath = path.join(out_folder,name);
    var outp = outputPath;
    outputPath = 'outputDirectory=' + outputPath;
    var uName = '3D DEVICE ' + basename;

    var configFileLoc = path.join(outp,'proj.ini');

    var svgloc = outp + basename + '_device_flow.svg';

    var iniREGEX = '';
    var mintREGEX = '';

    lineder(ini_path).find("outputDirectory=",function(err,results){
        //console.log(results);
        iniREGEX = (results[0]).value;
        iniREGEX = iniREGEX.substring(0, iniREGEX.length - 1);
        iniREGEX = slash(iniREGEX);

        //TODO: ERROR OCCURING; REPLACE PATH BREAKS CODE. FIX THIS
        replace({
            regex: iniREGEX,
            replacement: slash(outputPath),
            paths: [ini_path],
            recursive: true,
            silent: true,
        });
    });

    lineder(mint_path).find("3D DEVICE",function(err,results){
        //console.log(results);
        mintREGEX = (results[0]).value;
        mintREGEX = mintREGEX.substring(0, mintREGEX.length - 1);
        mintREGEX = slash(mintREGEX);
        replace({
            regex: mintREGEX,
            replacement: slash(uName),
            paths: [mint_path],
            recursive: true,
            silent: true,
        });
    });

    var par_terminal = require('child_process').spawn(
        'java', ['-jar', './backend/Fluigi-jar-with-dependencies.jar', mint_path, '-i', ini_path, '-o', 'sej']
    );

    par_terminal.stdout.on('data', function(data) {
        console.log(data.toString());
        io.emit('compile_console_readout',data.toString());
    });

    par_terminal.stderr.on("data", function (data) {
        console.log(data.toString());
    });

    par_terminal.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        if (code == 0) {

            var read = fs.createReadStream(svgloc);
            var write = fs.createWriteStream('./public/mysvg.svg');
            read.pipe(write);

            var configFile = fs.openSync(configFileLoc,'w');

            res.send({terminalStatus: 'Success'});
            res.end();
        }
        if (code != 0) {
            res.send({terminalStatus: 'Failure'});
            res.end();
        }
    });
};