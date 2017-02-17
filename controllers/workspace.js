// Workspace Controller
//      This file houses all functions related to instantiating and maintaining a users workspace in Neptune.
//

var exports = module.exports;
var express = require('express');
var cmd = require('node-cmd');
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var homeDir = require('home-dir');
var jsonfile = require('jsonfile');

/*
    Parses the directory at _filename_ and returns
    a JSON object representation of the directory tree.
 */
function dirTree(filename)
{
    filename = filename.replace(/\\/g,'/');
    filename = path.normalize(filename);

    var prjname = filename + '..';
    prjname = path.resolve(prjname);
    prjname = path.basename(prjname);
    var file = path.basename(filename);

    if (process.platform === 'win32')
    {
        filename = filename.replace(/\\/g,'\\\\');
    }

    var stats = fs.lstatSync(filename),
        info =
        {
            path: filename,
            name: path.basename(filename),
            id: prjname + "_" + file + "_id"
        };
    if (stats.isDirectory())
    {
        info.type = "folder";
        info.children = fs.readdirSync(filename).map(function(child)
        {
            return dirTree(filename + '/' + child);
        });
    }
    else
    {
        // Assuming it's a file. In real life it could be a symlink or
        // something else!
        //info.type = "file";
        var ext = path.extname(filename);
        info.type = ext;
        //var extension = path.extname('states')
    }
    return info;
}

/*

 */
function getDirectories(srcpath)
{
    try{
        fs.accessSync(srcpath, fs.F_OK);
    }
    catch(e){
        console.log("Workspace Directory does not exist. Creating a new Directory");
        mkdirp.sync(srcpath);
    }
    return fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

/*
    Utilizes the [ var homeDir = require('home-dir'); ] Node module to find the users home file-path.
    Response is the home file-path.
 */
exports.findHome = function(req, res)
{
    var dir = homeDir();
    res.send({home_directory: dir});
};

/*

 */
exports.getProjects = function(req,res)
{
    var workspace = req.body.workspace;
    var projects = getDirectories(workspace);
    res.send({projects:projects});
};

/*
    Generates a directory for a new project.
    Creates a LFR, UCF, MINT, and INI file for the project.
 */
exports.makeProject = function(req,res)
{
    var projectName = req.body.projectName;

    if (!fs.existsSync(projectName))
    {
        fs.mkdirSync(projectName);
        fs.openSync(projectName + '/specifyLFR.v', 'w');
        fs.openSync(projectName + '/specifyUCF.json', 'w');
        fs.openSync(projectName + '/designMINT.uf', 'w');
        fs.openSync(projectName + '/designINI.ini', 'w');

        //console.log("Testing out __dirname: " + path.join(global.Neptune_ROOT_DIR,"defaults","defaultUCF.json"));
        var readingStream = fs.createReadStream(path.join(global.Neptune_ROOT_DIR,"defaults","defaultUCF.json"));
        var writingStream = fs.createWriteStream(projectName + '/specifyUCF.json');
        readingStream.pipe(writingStream);

        var readStream = fs.createReadStream(path.join(global.Neptune_ROOT_DIR,"defaults","defaultINI.txt"));
        var writeStream = fs.createWriteStream(projectName + '/designINI.ini');
        readStream.pipe(writeStream);

        res.send({status: 'project_created'});

    }
    else
    {
        res.send({status: 'project_exists_already'});
        res.status(501);
    }
};

/*

 */
exports.parseDir = function(req,res)
{
    var file = __dirname;
    var len = file.length;
    file = file.substring(0, len - 12);
    var outputs_file = file + '/output';
    var uploads_file_specify = file + '/public/uploads/Specify';
    var uploads_file_design = file + '/public/uploads/Design';
    var uploads_file_build = file + '/public/uploads/Build_Verify';

    var json = {output:'',specify:'',design:'',build:''};

    fs.readdir(outputs_file,function(error,data)
    {
        console.log(err);
        json.output = data;
    });
    fs.readdir(uploads_file_specify,function(error,data)
    {
        json.specify = data;
    });
    fs.readdir(uploads_file_design,function(error,datadata)
    {
        json.design = data;
    });
    fs.readdir(uploads_file_build,function(error,data)
    {
        json.build = data;
        res.send(json);
    });

}

/*
    Uses function dirTree() to create a JSON object representation of a directory tree rooted at the provided workspace directory.
    Response is a JSON object directory tree.
 */
exports.scanFiles = function(req,res)
{
    var workspace = req.body.workspace;
    var info = dirTree(workspace);
    res.send(info);
}

/*
    Deprecated I believe...
    I will delete once I verify there are  no dependencies.
 */
exports.download = function(req, res)
{
    var location = req.body.fileLocation;
    var CASE = req.body.downloadType;

    if (location == 'server')
    {
        switch (CASE) {
            case 'default_ucf':
                var file = __dirname;
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/backend/defaultUCF.json';
                var filename = path.basename(file);
                //var mimetype = mime.lookup(file);
                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                //res.setHeader('Content-type', mimetype);
                var filestream = fs.createReadStream(file);
                filestream.pipe(res);
                break;
            case 'default_ini':
                var file = __dirname;
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/backend/defaultINI.txt';
                var filename = path.basename(file);
                //var mimetype = mime.lookup(file);
                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                //res.setHeader('Content-type', mimetype);
                var filestream = fs.createReadStream(file);
                filestream.pipe(res);
                break;
            case 'mint':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/testDevice.uf';
                var file = __dirname; // + '/backend_results/designMINT.uf'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/testDevice.uf';
                var filename = path.basename(file);
                //var mimetype = mime.lookup(file);
                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                //res.setHeader('Content-type', mimetype);
                var filestream = fs.createReadStream(file);
                filestream.pipe(res);
                break;
            case 'mint_previewImg':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/testDevice.uf';
                var file = __dirname; // + '/backend_results/designMINT.uf'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/testDevice.uf';
                var filename = path.basename(file);
                //var mimetype = mime.lookup(file);
                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                //res.setHeader('Content-type', mimetype);
                var filestream = fs.createReadStream(file);
                filestream.pipe(res);
                break;
            case 'json':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/output/testDevice.json';
                var file = __dirname; // + '/output/PAR_testdevice_log.txt'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/output/testDevice.json';
                var filename = path.basename(file);
                //var mimetype = mime.lookup(file);
                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                //res.setHeader('Content-type', mimetype);
                var filestream = fs.createReadStream(file);
                filestream.pipe(res);
                break;
            case 'svg_bounding':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/output/testDevice_device_flow.svg';
                var file = __dirname; // + '/output/PAR_testdevice_log.txt'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/output/testDevice_device_bounding_box.svg';
                var filename = path.basename(file);
                //var mimetype = mime.lookup(file);
                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                //res.setHeader('Content-type', mimetype);
                var filestream = fs.createReadStream(file);
                filestream.pipe(res);
                break;
            case 'svg_cell':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/output/testDevice_device_flow.svg';
                var file = __dirname; // + '/output/PAR_testdevice_log.txt'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/output/testDevice_device_cell.svg';
                var filename = path.basename(file);
                //var mimetype = mime.lookup(file);
                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                //res.setHeader('Content-type', mimetype);
                var filestream = fs.createReadStream(file);
                filestream.pipe(res);
                break;
            case 'svg_control':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/output/testDevice_device_flow.svg';
                var file = __dirname; // + '/output/PAR_testdevice_log.txt'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/output/testDevice_device_control.svg';
                var filename = path.basename(file);
                //var mimetype = mime.lookup(file);
                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                //res.setHeader('Content-type', mimetype);
                var filestream = fs.createReadStream(file);
                filestream.pipe(res);
                break;
            case 'svg_flow':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/output/testDevice_device_flow.svg';
                var file = __dirname; // + '/output/PAR_testdevice_log.txt'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/output/testDevice_device_flow.svg';
                var filename = path.basename(file);
                //var mimetype = mime.lookup(file);
                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                //res.setHeader('Content-type', mimetype);
                var filestream = fs.createReadStream(file);
                filestream.pipe(res);
                break;
            case 'eps_device':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/output/testDevice_device_flow.svg';
                var file = __dirname; // + '/output/PAR_testdevice_log.txt'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/output/testDevice_device.eps';
                var filename = path.basename(file);
                //var mimetype = mime.lookup(file);
                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                //res.setHeader('Content-type', mimetype);
                var filestream = fs.createReadStream(file);
                filestream.pipe(res);
                break;
            case 'eps_photo':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/output/testDevice_device_flow.svg';
                var file = __dirname; // + '/output/PAR_testdevice_log.txt'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/output/testDevice_photomask.eps';
                var filename = path.basename(file);
                //var mimetype = mime.lookup(file);
                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                //res.setHeader('Content-type', mimetype);
                var filestream = fs.createReadStream(file);
                filestream.pipe(res);
                break;
        }
    }
    if (location == 'client')
    {
        switch (CASE)
        {
            case 'default_ucf':
                var file = __dirname;
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/backend/defaultUCF.json';
                var filename = path.basename(file);
                //var mimetype = mime.lookup(file);
                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                //res.setHeader('Content-type', mimetype);
                var filestream = fs.createReadStream(file);
                filestream.pipe(res);
                break;
            case 'default_ini':
                var file = __dirname;
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/backend/defaultINI.txt';
                break;
            case 'mint':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/testDevice.uf';
                var file = __dirname; // + '/backend_results/designMINT.uf'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/testDevice.uf';
                break;
            case 'mint_previewImg':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/testDevice.uf';
                var file = __dirname; // + '/backend_results/designMINT.uf'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/testDevice.uf';
                break;
            case 'json':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/output/testDevice.json';
                var file = __dirname; // + '/output/PAR_testdevice_log.txt'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/output/testDevice.json';
                break;
            case 'svg_bounding':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/output/testDevice_device_flow.svg';
                var file = __dirname; // + '/output/PAR_testdevice_log.txt'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/output/testDevice_device_bounding_box.svg';
                break;
            case 'svg_cell':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/output/testDevice_device_flow.svg';
                var file = __dirname; // + '/output/PAR_testdevice_log.txt'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/output/testDevice_device_cell.svg';
                break;
            case 'svg_control':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/output/testDevice_device_flow.svg';
                var file = __dirname; // + '/output/PAR_testdevice_log.txt'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/output/testDevice_device_control.svg';
                break;
            case 'svg_flow':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/output/testDevice_device_flow.svg';
                var file = __dirname; // + '/output/PAR_testdevice_log.txt'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/output/testDevice_device_flow.svg';
                break;
            case 'eps_device':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/output/testDevice_device_flow.svg';
                var file = __dirname; // + '/output/PAR_testdevice_log.txt'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/output/testDevice_device.eps';
                break;
            case 'eps_photo':
                //var fileLong = 'c:/Users/kestas/Desktop/iGEM2016-GUI/output/testDevice_device_flow.svg';
                var file = __dirname; // + '/output/PAR_testdevice_log.txt'; // the right way to do it-- but __dirname is at /controllers, which is one down
                var len = file.length;
                file = file.substring(0, len - 12);
                file = file + '/output/testDevice_photomask.eps';
                break;
        }
    }
};

/*
    Creates a readStream of the file at the specified file-path.
    Response is a stream of the contents of the specified file.
 */
exports.getFile = function(req,res)
{
    var path = req.body.path;

    if ((typeof path) === 'string')
    {
        var readStream = fs.createReadStream(path);
        readStream.on('error',function()
        {
            res.send('filepath_error');
        });
        readStream.on('open',function()
        {
            readStream.pipe(res);
        });
    }
    else
    {
        res.send('filepath_error');
    }
};

/*
    Used by the UCF creator UI element.
    This will generate a UCF JSON file.
 */
exports.generateUCF = function(req, res)
{

    var data = req.body.content;//JSON.stringify(req.body.content);
    var path = req.body.path;

    fs.openSync(path,'w');
    // fs.writeFile(path, data , function(err) {
    //     console.log("Wrote to: " + path);
    // });
    jsonfile.writeFile(path, data, {spaces: 2}, function (err)
    {
        res.send('success');
        console.error(err)
    });
};

/*
    Deletes all files in the directory.
    Deprecated and needsimprovments.
 */
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