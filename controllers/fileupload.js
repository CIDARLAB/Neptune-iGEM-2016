

var cmd = require('node-cmd');
var exports = module.exports;
var multer = require('multer');
var express = require('express');
var fs = require('fs');

//**************************************************************
// FUNCTIONS THAT SEND UPLOAD FILES TO ARGUMENT STRING DIRECTORY
//**************************************************************
exports.sendToUploads = function(req , res) {
    res.sendFile(__dirname + "./public/uploads");
};
exports.sendToUploadsSpecify = function(req , res) {
    res.sendFile(__dirname + "./public/uploads/Specify");
};
exports.sendToUploadsDesign = function(req , res) {
    res.sendFile(__dirname + "./public/uploads/Design");
};
exports.sendToUploadsBuild_Verify = function(req , res) {
    res.sendFile(__dirname + "./public/uploads/Build_Verify");
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// -----------------------------------FILE UPLOAD FOR specify_LFR -----------------------------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.send_specifyLFR = function(req, res) {

    var storage_specifyLFR = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads/Specify');
        },
        filename: function (req, file, callback) {
            callback(null, file.fieldname + '.v');
        }
    });

    var upload_specifyLFR = multer({
        storage : storage_specifyLFR
    }).single('specifyLFR');

    upload_specifyLFR(req,res,function(err) {

        if(err) {
            return res.end("Error uploading LFR file.");
        }
        if(req.fileValidationError) {
            return res.end(req.fileValidationError);
        }
        return res.send("LFR file is uploaded");
        console.log("My specifyLFR: " + res);
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// -----------------------------------FILE UPLOAD FOR specify_UCF -----------------------------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.send_specifyUCF = function(req, res) {

    var storage_specifyUCF =   multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads/Specify');
        },
        filename: function (req, file, callback) {
            callback(null, file.fieldname + '.json');
        }
    });

    var upload_specifyUCF = multer({
        storage : storage_specifyUCF
    }).single('specifyUCF');

    upload_specifyUCF(req,res,function(err) {
        if(err) {
            return res.end("Error uploading UCF file.");
        }
        if(req.fileValidationError) {
            return res.end(req.fileValidationError);
        }
        return res.send("UCF file is uploaded");
        console.log("My specifyUCF: " + res);
    });
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// -----------------------------------FILE UPLOAD FOR design_INI -----------------------------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.send_designINI = function(req, res) {
    var storage_designINI =   multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads/Design');
        },
        filename: function (req, file, callback) {
            callback(null, file.fieldname + '.txt');
        }
    });

    var upload_designINI = multer({
        storage : storage_designINI
    }).single('designINI');

    upload_designINI(req,res,function(err) {
        if(err) {
            return res.end("Error uploading INI file.");
        }
        if(req.fileValidationError) {
            return res.end(req.fileValidationError);
        }
        return res.send("INI file is uploaded");
        console.log("My designINI: " + res);
    });
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// -----------------------------------FILE UPLOAD FOR design_MINT -----------------------------------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.send_designMINT = function(req, res) {
    var storage_designMINT =   multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads/Design');
        },
        filename: function (req, file, callback) {

            callback(null, file.fieldname + '.uf');
        }
    });

    var upload_designMINT = multer({
        storage : storage_designMINT
    }).single('designMINT');

    upload_designMINT(req,res,function(err) {
        if(err) {
            return res.end("Error uploading MINT file.");
        }
        if(req.fileValidationError) {
            return res.end(req.fileValidationError);
        }
        return res.send("MINT file is uploaded");
        console.log("My designMINT: " + res);
    });
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// -----------------------------------FILE UPLOAD FOR JSON ----------------------------------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports.send_buildJSON = function(req, res) {
//
//     var storage_buildJSON = multer.diskStorage({
//         destination: function (req, file, callback) {
//             callback(null, './public/uploads/Build_Verify');
//         },
//         filename: function (req, file, callback) {
//             callback(null, file.fieldname + '.json');
//         }
//     });
//
//     var upload_buildJSON = multer({
//         storage: storage_buildJSON
//         // fileFilter: function (req, file, cb) {
//         //     if (file.mimetype !== 'application/octet-stream') {
//         //         req.fileValidationError = 'Wrong Filetype!';
//         //         console.log('My filetype: ' + file.mimetype);
//         //         return cb(null, false, new Error('goes wrong on the mimetype'));
//         //     }
//         //     cb(null, true);
//         // }
//     }).single('buildJSON');
//
//     upload_buildJSON(req, res, function (err) {
//         if (err) {
//             return res.end("Error uploading JSON file.");
//         }
//         if (req.fileValidationError) {
//             return res.end(req.fileValidationError);
//         }
//         return res.send("JSON file is uploaded");
//         console.log("My buildJSON: " + res);
//
//     });
// };
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// -----------------------------------FILE UPLOAD FOR JSON ----------------------------------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.send_buildJSON = function(req, res) {

    var storage_buildJSON = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads/Build_Verify');

        },
        filename: function (req, file, callback) {
            callback(null, file.fieldname + '.json');
        }
    });

    var upload_buildJSON = multer({
        storage: storage_buildJSON
        // fileFilter: function (req, file, cb) {
        //     if (file.mimetype !== 'application/octet-stream') {
        //         req.fileValidationError = 'Wrong Filetype!';
        //         console.log('My filetype: ' + file.mimetype);
        //         return cb(null, false, new Error('goes wrong on the mimetype'));
        //     }
        //     cb(null, true);
        // }
    }).single('myjson'); // MUST MATCH FILE NAME!

    upload_buildJSON(req, res, function (err) {
        if (err) {
            return res.end("Error uploading JSON file.");
        }
        if (req.fileValidationError) {
            return res.end(req.fileValidationError);
        }
        return res.send("JSON file is uploaded");
        console.log("My buildJSON: " + res);

    });
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// -----------------------------------FILE UPLOAD FOR buildSVG ----------------------------------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.send_buildSVG = function(req, res) {

    var storage_buildSVG = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './public/uploads/');
        },
        filename: function (req, file, callback) {
            callback(null, file.fieldname + '.svg');
        }
    });

    var upload_buildSVG = multer({
        storage: storage_buildSVG
        // fileFilter: function (req, file, cb) {
        //     if (file.mimetype !== 'application/octet-stream') {
        //         req.fileValidationError = 'Wrong Filetype!';
        //         console.log('My filetype: ' + file.mimetype);
        //         return cb(null, false, new Error('goes wrong on the mimetype'));
        //     }
        //     cb(null, true);
        // }
    }).single('mysvg');

    upload_buildSVG(req, res, function (err) {
        if (err) {
            return res.end("Error uploading SVG file.");
        }
        if (req.fileValidationError) {
            return res.end(req.fileValidationError);
        }
        return res.send("SVG file is uploaded");
        console.log("My buildSVG: " + res);

    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// -----------------------------------FILE UPLOAD FOR LFR_start -----------------------------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports.sendLFR_start = function(req, res) {
//     var storage_LFR_start =   multer.diskStorage({
//         destination: function (req, file, callback) {
//             callback(null, './public/uploads/Specify');
//         },
//         filename: function (req, file, callback) {
//             callback(null, file.fieldname + '.txt');
//         }
//     });
//
//     var upload_LFR_start = multer({
//         storage : storage_LFR_start
//     }).single('myLFR_start');
//
//     upload_LFR_start(req,res,function(err) {
//         if(err) {
//             return res.end("Error uploading file.");
//         }
//         if(req.fileValidationError) {
//             return res.end(req.fileValidationError);
//         }
//         res.end("LFR File is uploaded");
//         console.log("My LFR_start: " + res);
//     });
// };

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// -----------------------------------FILE UPLOAD FOR LFR -----------------------------------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports.sendLFR = function(req, res) {
//     var storage_LFR =   multer.diskStorage({
//         destination: function (req, file, callback) {
//             callback(null, './public/uploads/Design');
//         },
//         filename: function (req, file, callback) {
//
//             callback(null, file.fieldname + '.txt');
//         }
//     });
//
//     var upload_LFR = multer({
//         storage : storage_LFR
//     }).single('myLFR');
//
//     upload_LFR(req,res,function(err) {
//         if(err) {
//             return res.end("Error uploading file.");
//         }
//         if(req.fileValidationError) {
//             return res.end(req.fileValidationError);
//         }
//         res.end("LFR File is uploaded");
//         console.log("My LFR: " + res);
//     });
// };

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// -----------------------------------FILE UPLOAD FOR UCF -----------------------------------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports.sendUCF = function(req, res) {
//     var storage_UCF =   multer.diskStorage({
//         destination: function (req, file, callback) {
//             callback(null, './public/uploads/Design');
//         },
//         filename: function (req, file, callback) {
//
//             callback(null, file.fieldname + '.json');
//
//         }
//     });
//
//     var upload_UCF = multer({
//         storage: storage_UCF
//         // fileFilter: function (req, file, cb) {
//         //     if (file.mimetype !== 'image/svg+xml') {
//         //         req.fileValidationError = 'Wrong Filetype!';
//         //         console.log('My filetype: ' + file.mimetype);
//         //         return cb(null, false, new Error('goes wrong on the mimetype'));
//         //     }
//         //     cb(null, true);
//         // }
//     }).single('myUCF');
//
//     upload_UCF(req, res, function (err) {
//         if (err) {
//             return res.end("Error uploading file2.");
//         }
//         if (req.fileValidationError) {
//             return res.end(req.fileValidationError);
//         }
//         res.end("UCF File is uploaded");
//         console.log("My UCF: " + res);
//     });
// };

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// -----------------------------------FILE UPLOAD FOR MINT ----------------------------------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports.sendMINT = function(req, res) {
//     var storage_MINT =   multer.diskStorage({
//         destination: function (req, file, callback) {
//             callback(null, './public/uploads/Design');
//         },
//         filename: function (req, file, callback) {
//             callback(null, file.fieldname + '.txt');
//         }
//     });
//
//     var upload_MINT = multer({
//         storage : storage_MINT
//     }).single('myMINT');
//
//     upload_MINT(req,res,function(err) {
//         if(err) {
//             return res.end("Error uploading file.");
//         }
//         if(req.fileValidationError) {
//             return res.end(req.fileValidationError);
//         }
//         res.end("MINT File is uploaded");
//         console.log("My MINT: " + res);
//     });
// };


///////////////////////////////////////////////////////////////////////////////////////////////////////////
// -----------------------------------FILE UPLOAD FOR JSON ----------------------------------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports.sendJSON = function(req, res) {
//
//     var storageJSON = multer.diskStorage({
//         destination: function (req, file, callback) {
//             callback(null, './public/uploads/Build_Verify');
//         },
//         filename: function (req, file, callback) {
//             callback(null, file.fieldname + '.json');
//         }
//     });
//
//     var uploadJSON = multer({
//         storage: storageJSON
//         // fileFilter: function (req, file, cb) {
//         //     if (file.mimetype !== 'application/octet-stream') {
//         //         req.fileValidationError = 'Wrong Filetype!';
//         //         console.log('My filetype: ' + file.mimetype);
//         //         return cb(null, false, new Error('goes wrong on the mimetype'));
//         //     }
//         //     cb(null, true);
//         // }
//     }).single('myJSON');
//
//         uploadJSON(req, res, function (err) {
//             if (err) {
//                 return res.end("Error uploading file.");
//             }
//             if (req.fileValidationError) {
//                 return res.end(req.fileValidationError);
//             }
//             res.end("JSON File is uploaded");
//             console.log("My JSON: " + res);
//
//         });
// };


///////////////////////////////////////////////////////////////////////////////////////////////////////////
// -----------------------------------FILE UPLOAD FOR SVG -----------------------------------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports.sendSVG = function(req, res) {
//     var storageSVG =   multer.diskStorage({
//         destination: function (req, file, callback) {
//             callback(null, './public/uploads/Build_Verify');
//         },
//         filename: function (req, file, callback) {
//             callback(null, file.fieldname + '.svg');
//         }
//     });
//
//     var uploadSVG = multer({
//         storage: storageSVG,
//         fileFilter: function (req, file, cb) {
//             if (file.mimetype !== 'image/svg+xml') {
//                 req.fileValidationError = 'Wrong Filetype!';
//                 console.log('My filetype: ' + file.mimetype);
//                 return cb(null, false, new Error('goes wrong on the mimetype'));
//             }
//             cb(null, true);
//         }
//     }).single('mySVG');
//
//         uploadSVG(req, res, function (err) {
//             if (err) {
//                 return res.end("Error uploading file2.");
//             }
//             if (req.fileValidationError) {
//                 return res.end(req.fileValidationError);
//             }
//             res.end("SVG File is uploaded");
//             console.log("My SVG: " + res);
//         });
//     };


// FILE UPLOAD FOR MINT ---------------------------------------------------------------------------------
// exports.sendMINT = function(req, res) {
//     var storage_MINT =   multer.diskStorage({
//         destination: function (req, file, callback) {
//             callback(null, './public/uploads');
//         },
//         filename: function (req, file, callback) {
//             callback(null, file.fieldname + '.uf');
//         }
//     });
//
//     var upload_UCF = multer({
//         storage: storage_MINT
//         // fileFilter: function (req, file, cb) {
//         //     if (file.mimetype !== 'image/svg+xml') {
//         //         req.fileValidationError = 'Wrong Filetype!';
//         //         console.log('My filetype: ' + file.mimetype);
//         //         return cb(null, false, new Error('goes wrong on the mimetype'));
//         //     }
//         //     cb(null, true);
//         // }
//     }).single('myMint');
//
//     upload_UCF(req, res, function (err) {
//         if (err) {
//             return res.end("Error uploading mint file.");
//         }
//         if (req.fileValidationError) {
//             return res.end(req.fileValidationError);
//         }
//         res.end("MINT File is uploaded");
//         console.log("My MINT: " + res);
//
//     });
// };

// SEND TO FLUIGI AND MUSHROOM PAGES --------------------------------------------------------------------------

//**************************************************************
// FUNCTIONS THAT SEND UPLOAD FILES TO ARGUMENT STRING DIRECTORY
//**************************************************************
exports.sendToUploads = function(req , res) {
        res.sendFile(__dirname + "./public/uploads");
};
exports.sendToUploadsSpecify = function(req , res) {
    res.sendFile(__dirname + "./public/uploads/Specify");
};
exports.sendToUploadsDesign = function(req , res) {
    res.sendFile(__dirname + "./public/uploads/Design");
};
exports.sendToUploadsBuild_Verify = function(req , res) {
    res.sendFile(__dirname + "./public/uploads/Build_Verify");
};
