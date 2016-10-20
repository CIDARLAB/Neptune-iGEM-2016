/**
 * Created by kestas on 7/19/2016.
 */
var cmd = require('node-cmd');
var exports = module.exports;
var multer = require('multer');
var express = require('express');
var fs = require('fs');
var currentWebsocket = require('./websocket');
const readline = require('readline');
const path = require('path');

//io = require('socket.io')(global.server);
//io.on('connection', function(socket){
//    console.log('a user connected');
//});
var MM_BINARY_PATH = path.join(global.Neptune_ROOT_DIR, "backend", "MuShroomMapper.jar");


exports.translateLFR = function(req, res)
{
    var lfr_path = req.body.filePathLFR;
    var ucf_path = req.body.filePathUCF;
    var out_path = req.body.filePathOut;
    var name     = req.body.name;
    var outputPath = path.join(out_path,name);




    var par_terminal = require('child_process').spawn(
        'java', ['-jar', MM_BINARY_PATH, '-l', lfr_path, '-u', ucf_path , '-uf', out_path]
    );

    par_terminal.stdout.on('data', function(data) {
        console.log(data.toString());
        currentWebsocket.socket().emit('translate_console_readout',data.toString());
    });

    par_terminal.stderr.on("data", function (data) {
        console.log(data.toString());
    });

    par_terminal.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        if (code == 0) {

            var readingStream = fs.createReadStream('./testDevice.uf');
            var writingStream = fs.createWriteStream(outputPath);
            readingStream.pipe(writingStream);

            res.send({terminalStatus: 'Success'});
            res.end();
        }
        if (code != 0) {
            res.send({terminalStatus: 'Failure'});
            res.end();
        }
    });
};
