/**
 * Created by kestas on 8/23/2016.
 */

var fs = require('fs');
var path = require('path');

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

