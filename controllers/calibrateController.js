/**
 * Created by kestas on 7/26/2016.
 */

var PythonShell = require('python-shell');
var cmd = require('node-cmd');
var exports = module.exports;
var multer = require('multer');
var express = require('express');
var fs = require('fs');
const readline = require('readline');

exports.calibrate = function(req, res)
{
    var options = {
        mode: 'text',
        scriptPath: 'backend'
    };

    PythonShell.run('html_py_test.py', options, function (err, results) {
        if (err) throw err;
        // results is an array consisting of messages collected during execution
        console.log('results: %j', results);
    });
};