/**
 * Created by Priya on 22/06/2016.
 */

exports.openMMPage = function (req, res) {
  res.render('uShroomPage', {title: 'MM Page'});
};
var exec = require('child_process').exec, child;

exports.executeJAR = function (req, res) {
  child = exec('/usr/bin/java -jar ~/Applications/example.jar',
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
      //save files that MM/Fluigi output (possibly with res)
    });

};