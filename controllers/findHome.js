/**
 * Created by kestas on 9/17/2016.
 */
var fs = require('fs');
const path = require('path');
var homeDir = require('home-dir');

exports.findHome = function(req, res)
{
    var dir = homeDir();
    res.send({home_directory: dir});
};
