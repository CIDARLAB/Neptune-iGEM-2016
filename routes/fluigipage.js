var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('fluigipage', { title: 'Fluigi Page' });
});

module.exports = router;
/**
 * Created by Priya on 27/05/2016.
 */



