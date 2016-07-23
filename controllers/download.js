/**
 * Created by kestas on 7/20/2016.
 */
var cmd = require('node-cmd');
var exports = module.exports;
var multer = require('multer');
var express = require('express');
var fs = require('fs');
var path = require('path');
var mime = require('mime');

exports.download = function(req, res)
{
    var CASE = req.body.downloadType;
    console.log(CASE);
    switch (CASE)
    {
        case 'mint':
            var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/backend_results/designMINT.uf';
            var file = __dirname + '/backend_results/designMINT.uf'; // the right way to do it-- but __dirname is at /controllers, which is one down
            var filename = path.basename(fileLong);
            var mimetype = mime.lookup(fileLong);
            res.setHeader('Content-disposition', 'attachment; filename=' + filename);
            res.setHeader('Content-type', mimetype);
            var filestream = fs.createReadStream(fileLong);
            filestream.pipe(res);
            break;
        case 'json':
            var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/output/testDevice.json';
            var file = __dirname + '/output/PAR_testdevice_log.txt'; // the right way to do it-- but __dirname is at /controllers, which is one down
            var filename = path.basename(fileLong);
            var mimetype = mime.lookup(fileLong);
            res.setHeader('Content-disposition', 'attachment; filename=' + filename);
            res.setHeader('Content-type', mimetype);
            var filestream = fs.createReadStream(fileLong);
            filestream.pipe(res);
            break;
        case 'svg':
            var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/output/testDevice_device_flow.svg';
            var file = __dirname + '/output/PAR_testdevice_log.txt'; // the right way to do it-- but __dirname is at /controllers, which is one down
            var filename = path.basename(fileLong);
            var mimetype = mime.lookup(fileLong);
            res.setHeader('Content-disposition', 'attachment; filename=' + filename);
            res.setHeader('Content-type', mimetype);
            var filestream = fs.createReadStream(fileLong);
            filestream.pipe(res);
            break;
    }
};