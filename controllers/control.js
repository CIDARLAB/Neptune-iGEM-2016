/**
 * Created by Priya on 28/07/2016.
 */

exports.openControllersPage = function(req, res)
{
    res.render('control', {title: 'Control'});
};

exports.openControlFullPage = function(req, res)
{
    res.render('controlFull', {title: 'ControlFull'});
};