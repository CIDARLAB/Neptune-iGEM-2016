/**
 * Created by Priya on 22/06/2016.
 */


exports.openMMPage = function (req, res)
{
  res.render('uShroomPage', {title: 'MM Page'});
};
/*  //Backend integration code (not fully implemented)

var lfrFile = "";
var ucfFile = "";

const spawn = require('child_process').spawn;
const mm = spawn('java', ['-jar', 'MuShroomMapper.jar', '-l ' + lfrFile, '-u ' + ucfFile]);

mm.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

mm.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`);
});

mm.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
*/

/*  //Notes on what to do for MM integration
 var mmJAR = require('child_process').spawn('java', ['-jar', 'MuShroomMapper.jar', '-l ' + lfrFile, '-u ' + ucfFile]);



 var exec = require('child_process').exec, child;

 exports.executeJAR = function (req, res) {
 child = exec('java' ['-jar', 'MuShroomMapper.jar', '']);
 function (error, stdout, stderr) {
 console.log('stdout: ' + stdout);
 console.log('stderr: ' + stderr);
 if (error !== null)
 {
 console.log('exec error: ' + error);
 }
 //save files that MM/Fluigi output (possibly with res)
 });

 };
 */