/**
 * Created by Priya on 22/06/2016.
 */

exports.openHomePage= function(req, res){
    res.render('index', { title: 'Express' });
};