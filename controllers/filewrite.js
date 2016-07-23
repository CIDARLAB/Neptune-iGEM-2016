/**
 * Created by kestas on 7/11/2016.
 */
var fs = require('fs');

exports.writeToFile = function(req, res)
{
    var data = req.body.fileData;
    var file_type = req.body.fileType;
    var path = '';
    
    switch (file_type)
    {
        case 'specifyLFR':
            path = "./public/uploads/Specify/specifyLFR.v";
            break;
        case 'specifyUCF':
            path = "./public/uploads/Specify/specifyUCF.json";
            break;
        case 'designMINT':
            path = "./public/uploads/Design/designMINT.uf";
            break;
        case 'designINI':
            path = "./public/uploads/Design/designINI.txt";
            break;
        case 'buildJSON':
            path = "./public/uploads/Build_Verify/buildJSON.json";
            break;
        case 'buildSVG':
            path = "./public/uploads/Build_Verify/buildSVG.svg";
            break;
    }
    fs.writeFile(path, data , function(err) {
        console.log("The file was saved!");
    });
    
    res.end;
};














