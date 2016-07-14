/**
 * Created by kestas on 7/12/2016.
 */

exports.openDashboard = function(req, res)
{
    res.render('dashboard', {title: 'Dashboard'});
};