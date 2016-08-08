/**
 * Created by kestas on 8/1/2016.
 */
var fs = require("fs");
var AdmZip = require('adm-zip');
var archiver = require('archiver');


exports.zipFiles = function(req,res)
{
    //var zip = new AdmZip();

    var file = __dirname;
    var len = file.length;
    file = file.substring(0, len - 12);
    var ZIPHERE = file + '/output/ProjectContents.zip';
    var zipInfo = '';
    //zip.writeZip(ZIPHERE);

    var output = fs.createWriteStream(ZIPHERE);
    var archive = archiver('zip');
    output.on('close', function() {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
        zipInfo = zipInfo + '\n' + archive.pointer() + ' total bytes';
        res.send(zipInfo);
    });
    archive.on('error', function(err) {
        throw err;
    });

    archive.pipe(output);

    var numFiles = 11;
    var fileExtensions = [];
    var fullPath = [];
    var fileNames = [];

    fileExtensions[0] = '/public/uploads/Specify/specifyLFR.v';
    fileExtensions[1] = '/public/uploads/Specify/specifyUCF.json';
    fileExtensions[2] = '/public/uploads/Design/designMINT.uf';
    fileExtensions[3] = '/public/uploads/Design/designINI.txt';
    fileExtensions[4] = '/output/testDevice.json';
    fileExtensions[5] = '/output/testDevice_device_bounding_box.svg';
    fileExtensions[6] = '/output/testDevice_device_cell.svg';
    fileExtensions[7] = '/output/testDevice_device_control.svg';
    fileExtensions[8] = '/output/testDevice_device_flow.svg';
    fileExtensions[9] = '/output/testDevice_device.eps';
    fileExtensions[10] = '/output/testDevice_photomask.eps';
    fileNames[0] = 'specifyLFR.v';
    fileNames[1] = 'specifyUCF.json';
    fileNames[2] = 'designMINT.uf';
    fileNames[3] = 'designINI.txt';
    fileNames[4] = 'schematic.json';
    fileNames[5] = 'bounding_layer_schematic.svg';
    fileNames[6] = 'cell_layer_schematic.svg';
    fileNames[7] = 'flow_layer_schematic.svg';
    fileNames[8] = 'flow_layer_schematic.svg';
    fileNames[9] = 'device_eps.eps';
    fileNames[10] = 'photolithogrophy_eps.eps';


    for (var i = 0; i < numFiles; i++)
    {
        var file = __dirname;
        var len = file.length;
        file = file.substring(0, len - 12);
        file = file + fileExtensions[i];

        if(!(fs.exists(file)))
        {
            fullPath.push(file);
        }
    }

    // for (var i = 0; i < numFiles; i++)
    // {
    //     if (fullPath[i].exists == false)
    //     {
    //         //Delete non-existing element in both arrays
    //     }
    // }
    // Get new array length, use below!

    for (var i = 0; i < numFiles; i++)
    {
        console.log('Zipping: ' + fullPath[i]);
        var fileSize = getFileSizeInBytes(fullPath[i]);
        zipInfo = zipInfo + '\n' + 'Added to Project Zip: ' + fileNames[i] + ' -- ' + fileSize + ' bytes';
        archive.append(fs.createReadStream(fullPath[i]), { name: fileNames[i] });
    }
    archive.finalize();
    
};

function getFileSizeInBytes(filename) {
    var stats = fs.statSync(filename);
    var fileSizeInBytes = stats["size"];
    return fileSizeInBytes
}