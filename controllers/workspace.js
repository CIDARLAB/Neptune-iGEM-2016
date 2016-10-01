/**
 * Created by kestas on 8/17/2016.
 */

var fs = require('fs');
var path = require('path');

exports.getProjects = function(req,res)
{
    var workspace = req.body.workspace;
    var projects = getDirectories(workspace);
    res.send({projects:projects});
};

function getDirectories(srcpath)
{
    return fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

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


        var readingStream = fs.createReadStream('./defaults/defaultUCF.json');
        var writingStream = fs.createWriteStream(projectName + '/specifyUCF.json');
        readingStream.pipe(writingStream);

        var readStream = fs.createReadStream('./defaults/defaultINI.txt');
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


exports.scanFiles = function(req,res)
{
    var workspace = req.body.workspace;
    var info = dirTree(workspace);
    res.send(info);
}


function dirTree(filename)
{
    filename = filename.replace(/\\/g,'/');
    filename = path.normalize(filename);
    if (process.platform === 'win32')
    {
        filename = filename.replace(/\\/g,'\\\\');
    }

    var stats = fs.lstatSync(filename),
        info =
        {
            path: filename,
            name: path.basename(filename)
        };
    if (stats.isDirectory())
    {
        info.type = "folder";
        info.children = fs.readdirSync(filename).map(function(child) {
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
