var express = require('express');
var router = express.Router();
var serialcommunication = require('../serialcommunication');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


/* GET Serial Communication page. */
router.get('/serialcommunication', function(req, res, next) {
  //res.render('serialcommunication', { title: 'COM' });
  res.send(serialcommunication.command());
});



module.exports = router;
