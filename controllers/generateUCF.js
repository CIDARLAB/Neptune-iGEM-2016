/**
 * Created by kestas on 8/3/2016.
 */

var fs = require('fs');
var jsonfile = require('jsonfile');

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