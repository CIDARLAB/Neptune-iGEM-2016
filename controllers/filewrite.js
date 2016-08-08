/**
 * Created by kestas on 7/11/2016.
 */
var fs = require('fs');

exports.writeToFile = function(req, res)
{
    var data = req.body.fileData;
    var file_type = req.body.fileType;
    var path = '';
    
    switch (file_type)
    {
        case 'specifyLFR':
            path = "./public/uploads/Specify/specifyLFR.v";
            break;
        case 'specifyUCF':
            path = "./public/uploads/Specify/specifyUCF.json";
            break;
        case 'designMINT':
            path = "./public/uploads/Design/designMINT.uf";
            break;
        case 'designINI':
            path = "./public/uploads/Design/designINI.txt";
            break;
        case 'buildJSON':
            path = "./public/uploads/Build_Verify/buildJSON.json";
            break;
        // case 'buildSVG_boundary':
        //     path = "./public/uploads/Build_Verify/buildSVG_boundary.svg";
        //     break;
        case 'buildSVG_cell':
            path = "./public/uploads/Build_Verify/buildSVG_cell.svg";
            break;
        case 'buildSVG_control':
            path = "./public/uploads/Build_Verify/buildSVG_control.svg";
            break;
        case 'buildSVG_flow':
            path = "./public/uploads/Build_Verify/buildSVG_flow.svg";
            break;
        case 'buildEPS_device':
            path = "./public/uploads/Build_Verify/buildEPS_device.eps";
            break;
        case 'buildEPS_photo':
            path = "./public/uploads/Build_Verify/buildEPS_photo.eps";
            break;

        case 'serverMINT':
            var file = __dirname;
            var len = file.length;
            file = file.substring(0,len-12);
            file = file + '/testMINT.uf';
            var path = file;
            //path = "./public/uploads/Build_Verify/buildEPS_photo.eps";
            break;
        case 'serverJSON':
            var file = __dirname;
            var len = file.length;
            file = file.substring(0,len-12);
            file = file + '/output/testDevice.json';
            var path = file;
            //path = "./public/uploads/Build_Verify/buildEPS_photo.eps";
            break;
        case 'serverSVG_bounding':
            var file = __dirname;
            var len = file.length;
            file = file.substring(0,len-12);
            file = file + '/output/testDevice_device_bounding_box.svg';
            var path = file;
            //path = "./public/uploads/Build_Verify/buildEPS_photo.eps";
            break;
        case 'serverSVG_cell':
            var file = __dirname;
            var len = file.length;
            file = file.substring(0,len-12);
            file = file + '/output/testDevice_device_cell.svg';
            var path = file;
            //path = "./public/uploads/Build_Verify/buildEPS_photo.eps";
            break;
        case 'serverSVG_control':
            var file = __dirname;
            var len = file.length;
            file = file.substring(0,len-12);
            file = file + '/output/testDevice_device_control.svg';
            var path = file;
            //path = "./public/uploads/Build_Verify/buildEPS_photo.eps";
            break;
        case 'serverSVG_flow':
            var file = __dirname;
            var len = file.length;
            file = file.substring(0,len-12);
            file = file + '/output/testDevice_device_flow.svg';
            var path = file;
            //path = "./public/uploads/Build_Verify/buildEPS_photo.eps";
            break;
        case 'serverEPS_device':
            var file = __dirname;
            var len = file.length;
            file = file.substring(0,len-12);
            file = file + '/output/testDevice_device.eps';
            var path = file;
            //path = "./public/uploads/Build_Verify/buildEPS_photo.eps";
            break;
        case 'serverEPS_photo':
            var file = __dirname;
            var len = file.length;
            file = file.substring(0,len-12);
            file = file + '/output/testDevice_photomask.eps';
            var path = file;
            //path = "./public/uploads/Build_Verify/buildEPS_photo.eps";
            break;
    }
    fs.writeFile(path, data , function(err) {
        console.log("Wrote to: " + path);
    });
    
    res.end;
};














