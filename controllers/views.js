/**
 * Created by Priya on 22/06/2016.
 */

exports.openHomePage = function(req, res) {
    res.render('index', { title: 'Neptune' });
};

exports.openDashboard = function(req, res) {
    res.render('dashboard', {title: 'Dashboard'});
};

exports.openSpecifyPage = function(req, res) {
    res.render('specify', {title: 'Specify'});
};

exports.openDesignPage = function(req, res) {
    res.render('design', {title: 'Design'});
};

exports.openControllersPage = function(req, res) {
    res.render('control', {title: 'Control'});
};

exports.openControlFullPage = function(req, res) {
    res.render('controlFull', {title: 'ControlFull'});
};

exports.openBuildPage = function(req, res) {
    res.render('build', {title: 'Build'});
};

exports.openAssemblyPage = function(req, res) {
    res.render('assembly', {title: 'Assembly'});
};

exports.getFluigiPage = function(req, res) {
    res.render('fluigipage', {title: 'Fluigi Page'});
};

exports.openMMPage = function (req, res) {
  res.render('uShroomPage', {title: 'MM Page'});
};

exports.openLfrPage= function(req, res) {
    res.render('lfrPage', {title: 'LFR Page'});
};

exports.openLfr_bsPage= function(req, res) {
    res.render('lfrPage_bs', {title: 'LFR Page Bootstrap'});
};

exports.openNewBuildPage = function (req, res){
    res.render('newbuild', {title: 'Build'});
};