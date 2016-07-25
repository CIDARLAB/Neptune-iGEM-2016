/**
 * Created by kestas on 7/19/2016.
 */
var cmd = require('node-cmd');
var exports = module.exports;
var multer = require('multer');
var express = require('express');
var fs = require('fs');
const readline = require('readline');

exports.compileMint = function(req, res)
{
    var count = 0;
    var file_path = './public/uploads/Design/designMINT.uf'; //req.body.filePath;

    var par_terminal = require('child_process').spawn(
        'java', ['-jar', './backend/Fluigi-jar-with-dependencies.jar', file_path, '-i', './public/uploads/Design/designINI.txt', '-o', 'sej']
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