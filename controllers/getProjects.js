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