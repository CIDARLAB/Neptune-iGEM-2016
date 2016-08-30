/**
 * Created by kestas on 8/21/2016.
 */

var fs = require('fs');
var path = require('path');

exports.scanFiles = function(req,res)
{
    var workspace = req.body.workspace;
    var info = dirTree(workspace);
    res.send(info);
}


function dirTree(filename)
{
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