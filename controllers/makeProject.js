/**
 * Created by kestas on 8/18/2016.
 */

var fs = require('fs');
var path = require('path');

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