/**
 * Created by kestas on 7/28/2016.
 */

var fs = require('fs');
var exports = module.exports;
var multer = require('multer');
var express = require('express');

exports.clearFiles = function(req, res)
{
    var file = __dirname;
    var len = file.length;
    file = file.substring(0,len-12);

    var file1 = file + '/testDevice.uf';
    var file2 = file + '/output/testDevice.json';
    var file3 = file + '/output/testDevice_device_bounding_box.svg';
    var file4 = file + '/output/testDevice_device_cell.svg';
    var file5 = file + '/output/testDevice_device_control.svg';
    var file6 = file + '/output/testDevice_device_flow.svg';
    var file7 = file + '/output/testDevice_device.eps';
    var file8 = file + '/output/testDevice_photomask.eps';
    var path1 = "./public/uploads/Specify/specifyLFR.v";
    var path2 = "./public/uploads/Specify/specifyUCF.json";
    var path3 = "./public/uploads/Design/designMINT.uf";
    var path4 = "./public/uploads/Design/designINI.txt";
    var path5 = "./public/uploads/Build_Verify/buildJSON.json";
    var path6 = "./public/uploads/Build_Verify/buildSVG_boundary.svg";
    var path7 = "./public/uploads/Build_Verify/buildSVG_cell.svg";
    var path8 = "./public/uploads/Build_Verify/buildSVG_control.svg";
    var path9 = "./public/uploads/Build_Verify/buildSVG_flow.svg";
    var path10 = "./public/uploads/Build_Verify/buildEPS_device.eps";
    var path11 = "./public/uploads/Build_Verify/buildEPS_photo.eps";

    var fileArray = [
        file1,file2,file3,file4,
        file5,file6,file7,file8,
        path1,path2,path3,path4,
        path5,path6,path7,path8,
        path9,path10,path11
        ];

    try
    {
        for (var j = 0; j < fileArray.length; j++)
        {
            fs.unlink(fileArray[j], function (err)
            {
                if (err)
                {
                    console.log(err);
                }
            });
        }
    }
    catch (err)
    {
        console.log(err);
    }
};











// fs.exists(fileArray[j], (exists) => {
//     var filepath = fileArray[j];
//     if (exists) {
//         console.log('Deleting: ' + filepath);
//         fs.unlink(filepath,function(error){
//             if(error)
//             {console.log(error)}
//         });
//     } else {
//         console.log('File not found: ' + filepath);
//     }
// });

// fs.exists(fileArray[j], function (exists) {
//     var filepath = fileArray[j];
//     if (exists) {
//         console.log('Deleting: ' + filepath);
//         fs.unlink(filepath,function(error){
//             if(error)
//             {console.log(error)}
//         });
//     } else {
//         console.log('File not found: ' + filepath);
//     }
// });