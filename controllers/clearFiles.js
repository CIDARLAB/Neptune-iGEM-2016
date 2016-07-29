/**
 * Created by kestas on 7/28/2016.
 */

var fs = require('fs');

exports.clearFiles = function(req, res)
{

    var file = __dirname;
    var len = file.length;
    file = file.substring(0,len-12);

    var file1 = file + '/testMINT.uf';
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

    fs.unlink(file1);
    fs.unlink(file2);
    fs.unlink(file3);
    fs.unlink(file4);
    fs.unlink(file5);
    fs.unlink(file6);
    fs.unlink(file7);
    fs.unlink(file8);
    fs.unlink(path1);
    fs.unlink(path2);
    fs.unlink(path3);
    fs.unlink(path4);
    fs.unlink(path5);
    fs.unlink(path6);
    fs.unlink(path7);
    fs.unlink(path8);
    fs.unlink(path9);
    fs.unlink(path10);
    fs.unlink(path11);
};