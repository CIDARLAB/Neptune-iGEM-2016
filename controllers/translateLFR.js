/**
 * Created by kestas on 7/19/2016.
 */
var cmd = require('node-cmd');
var exports = module.exports;
var multer = require('multer');
var express = require('express');
var fs = require('fs');
const readline = require('readline');

// exports.socket = function(req, res){
//
//     var io = require('socket.io');
//
//     io.on('connection', function (socket) {
//         socket.emit('news', { hello: 'world' });
//         socket.on('my other event', function (data) {
//             console.log(data);
//         });
//     });
// };

exports.translateLFR = function(req, res)
{
    var file_path_lfr_in = './public/uploads/Specify/specifyLFR.v'; //req.body.filePath;
    var file_path_ucf_in = './public/uploads/Specify/specifyUCF.json';
    var file_path_mint_out = './backend_results/designMINT.uf';

    var par_terminal = require('child_process').spawn(
        'java', ['-jar', './backend/MuShroomMapper.jar', '-l', file_path_lfr_in, '-u', file_path_ucf_in , '-uf', 'file_path_mint_out']
    );

    par_terminal.stdout.on('data', function(data) {
        console.log(data.toString());
    });

    par_terminal.stderr.on("data", function (data) {
        console.log(data.toString());
    });

    par_terminal.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        res.send({terminalStatus: 'Success'});
    });


};

