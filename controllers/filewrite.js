/**
 * Created by kestas on 7/11/2016.
 */
var fs = require('fs');

exports.writeToFile = function(req, res)
{
    var data = JSON.parse(req.body.fileData);
    fs.writeFile("./public/downloads/test.txt", data , function(err) {
        console.log("The file was saved!");
    });
    
    res.end;
};














