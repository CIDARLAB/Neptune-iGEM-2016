/**
 * Created by kestas on 8/16/2016.
 */

var fs = require('fs');

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