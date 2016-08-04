/**
 * Created by kestas on 8/3/2016.
 */

var fs = require('fs');

exports.generateUCF = function(req, res)
{

    var data = JSON.stringify(req.body.content);
    var path = "./public/uploads/Specify/specifyUCF.json";

    fs.writeFile(path, data , function(err) {
        console.log("Wrote to: " + path);
    });

    res.end();
};