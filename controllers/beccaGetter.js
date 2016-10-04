/**
 * Created by kestas on 9/15/2016.
 */
var fs = require('fs');
const path = require('path');

exports.getBecca = function(req, res)
{
    var jsonPath = req.body.jsonpath;
    console.log(jsonPath);
    var read = fs.createReadStream(jsonPath);
    var write = fs.createWriteStream('./public/uploads/Build_Verify/buildJSON.json');
    read.pipe(write,function(){
        res.end();
    });
};