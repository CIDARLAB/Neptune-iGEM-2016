var express = require('express');
var serialcommunication = require('../serialcommunication');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


/* GET Serial Communication page. */
router.get('/serialcommunication', function(req, res, next) {
  res.render('serialcommunication', { title: 'COM' });
});

/* GET Serial Comm command */
router.get('/serialcommunicationcommand', function(req, res, next) {
  res.send(serialcommunication.command());
});


module.exports = router;
