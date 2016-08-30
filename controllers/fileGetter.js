/**
 * Created by kestas on 8/23/2016.
 */

var fs = require('fs');
var path = require('path');

exports.getFile = function(req,res)
{
    var path = req.body.path;

    var readStream = fs.createReadStream(path);
    readStream.pipe(res);
};

