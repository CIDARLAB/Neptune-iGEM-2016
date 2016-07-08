/**
 * Created by Priya on 20/06/2016.
 */
var cmd = require('node-cmd');
var exports = module.exports;
var multer = require('multer');
var express = require('express');
var fs = require('fs');

// FILE UPLOAD FOR JSON ---------------------------------------------------------------------------------
exports.sendJSON = function(req, res) {

    var storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads');
        },
        filename: function (req, file, callback) {
            callback(null, file.fieldname + '.json');
        }
    });

    var upload = multer({
        storage: storage,
        fileFilter: function (req, file, cb) {
            if (file.mimetype !== 'application/octet-stream') {
                req.fileValidationError = 'Wrong Filetype!';
                console.log('My filetype: ' + file.mimetype);
                return cb(null, false, new Error('goes wrong on the mimetype'));
            }
            cb(null, true);
        }
    }).single('myjson');

        upload(req, res, function (err) {
            if (err) {
                return res.end("Error uploading file.");
            }
            if (req.fileValidationError) {
                return res.end(req.fileValidationError);
            }
            res.end("JSON File is uploaded");
            console.log("My JSON: " + res);

        });
};


    // FILE UPLOAD FOR SVG ---------------------------------------------------------------------------------
exports.sendSVG = function(req, res) {
    var storage2 =   multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads');
        },
        filename: function (req, file, callback) {
            callback(null, file.fieldname + '.svg');
        }
    });

    var upload2 = multer({
        storage: storage2,
        fileFilter: function (req, file, cb) {
            if (file.mimetype !== 'image/svg+xml') {
                req.fileValidationError = 'Wrong Filetype!';
                console.log('My filetype: ' + file.mimetype);
                return cb(null, false, new Error('goes wrong on the mimetype'));
            }
            cb(null, true);
        }
    }).single('mysvg');

        upload2(req, res, function (err) {
            if (err) {
                return res.end("Error uploading file2.");
            }
            if (req.fileValidationError) {
                return res.end(req.fileValidationError);
            }
            res.end("SVG File is uploaded");
            console.log("My SVG: " + res);
        });
    };


    // FILE UPLOAD FOR VERILOG ---------------------------------------------------------------------------------
exports.sendVERILOG = function(req, res) {
    var storage_VERILOG =   multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads');
        },
        filename: function (req, file, callback) {
            callback(null, file.fieldname + '.v');
        }
    });

    var upload_VERILOG = multer({
        storage : storage_VERILOG,
        fileFilter: function (req, file, cb) {
            if (file.mimetype !== 'text/x-verilog') {
                req.fileValidationError = 'Wrong Filetype!';
                console.log('My filetype: '+file.mimetype);
                return cb(null, false, new Error('goes wrong on the mimetype'));
            }
            cb(null, true);
        }
    }).single('myVerilog');

        upload_VERILOG(req,res,function(err) {
            if(err) {
                return res.end("Error uploading file.");
            }
            if(req.fileValidationError) {
                return res.end(req.fileValidationError);
            }
            res.end("Verilog File is uploaded");
            console.log("My Verilog: "+res);
        });
    };


    // FILE UPLOAD FOR UCF ---------------------------------------------------------------------------------
exports.sendUCF = function(req, res) {
    var storage_UCF =   multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads');
        },
        filename: function (req, file, callback) {
            callback(null, file.fieldname + '.ucf');
        }
    });

    var upload_UCF = multer({
        storage: storage_UCF
        // fileFilter: function (req, file, cb) {
        //     if (file.mimetype !== 'image/svg+xml') {
        //         req.fileValidationError = 'Wrong Filetype!';
        //         console.log('My filetype: ' + file.mimetype);
        //         return cb(null, false, new Error('goes wrong on the mimetype'));
        //     }
        //     cb(null, true);
        // }
    }).single('myUCF');

        upload_UCF(req, res, function (err) {
            if (err) {
                return res.end("Error uploading file2.");
            }
            if (req.fileValidationError) {
                return res.end(req.fileValidationError);
            }
            res.end("UCF File is uploaded");
            console.log("My UCF: " + res);

        });
    };


// FILE UPLOAD FOR MINT ---------------------------------------------------------------------------------
exports.sendMINT = function(req, res) {
    var storage_MINT =   multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads');
        },
        filename: function (req, file, callback) {
            callback(null, file.fieldname + '.uf');
        }
    });

    var upload_UCF = multer({
        storage: storage_MINT
        // fileFilter: function (req, file, cb) {
        //     if (file.mimetype !== 'image/svg+xml') {
        //         req.fileValidationError = 'Wrong Filetype!';
        //         console.log('My filetype: ' + file.mimetype);
        //         return cb(null, false, new Error('goes wrong on the mimetype'));
        //     }
        //     cb(null, true);
        // }
    }).single('myMint');

    upload_UCF(req, res, function (err) {
        if (err) {
            return res.end("Error uploading mint file.");
        }
        if (req.fileValidationError) {
            return res.end(req.fileValidationError);
        }
        res.end("MINT File is uploaded");
        console.log("My MINT: " + res);

    });
};




// SEND TO FLUIGI AND MUSHROOM PAGES --------------------------------------------------------------------------

exports.sendToUploads= function(req, res) {
        res.sendFile(__dirname + "./public/uploads");
};

