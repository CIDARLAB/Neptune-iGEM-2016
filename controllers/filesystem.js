/**
 * Created by kestas on 2/9/2017.
 */

/*
    filesystem . js
 */

var exports = module.exports;
var express = require('express');
var cmd = require('node-cmd');
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var homeDir = require('home-dir');
var jsonfile = require('jsonfile');
var mongoose = require('mongoose');
var User = require('../Models/user');


// create a new user
var newUser = User({
    name: 'Peter Quill',
    username: 'starlord55',
    password: 'password',
    admin: true
});

// save the user
newUser.save(function(err) {
    if (err) throw err;

    console.log('User created!');
});



/*
    Purely for development and testing purposes. Let's see if we can get this guy to
    talk too MongoDB. Or AWS.
 */
exports.AWS_FS = function(req, res)
{

};