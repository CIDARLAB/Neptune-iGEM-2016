/**
 * Created by kestas on 2/17/2017.
 */

var exports = module.exports;
var express = require('express');
var cmd = require('node-cmd');
var multer = require('multer');
var path = require('path');
var mkdirp = require('mkdirp');
var homeDir = require('home-dir');
var jsonfile = require('jsonfile');
var mongoose = require('mongoose');
var fs = require('fs');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();

exports.Create_Unique_Bucket = function(req, res)
{
    var Target_Bucket_ID  = req.body.Target_Bucket_ID;
    var Target_Bucket_KEY = req.body.Target_Bucket_KEY;
    var Target_Bucket_BODY = req.body.Target_Bucket_BODY;
    var Parameters = {
        Bucket: Target_Bucket_ID,
        Key: Target_Bucket_KEY
    };

    s3.createBucket({Bucket: Target_Bucket_ID}, function(err, data)
    {
        if (err) {
            console.log(err);
        } else {
            console.log('Bucket Created. Bucket Id: %s\n',Target_Bucket_ID);
        }
    });
};

exports.Delete_Unique_Bucket = function(req, res)
{
    var Target_Bucket_ID  = req.body.Target_Bucket_ID;
    var Target_Bucket_KEY = req.body.Target_Bucket_KEY;
    var Target_Bucket_BODY = req.body.Target_Bucket_BODY;
    var Parameters = {
        Bucket: Target_Bucket_ID,
        Key: Target_Bucket_KEY
    };

    s3.deleteBucket({Bucket: Target_Bucket_ID}, function(err, data)
    {
        if (err) {
            console.log(err);
        } else {
            console.log('Bucket Deleted. Bucket Id: %s\n',Target_Bucket_ID);
        }
    });
}

exports.Clear_Unique_Bucket = function(req, res)
{
    var Target_Bucket_ID  = req.body.Target_Bucket_ID;
    var Target_Bucket_KEY = req.body.Target_Bucket_KEY;
    var Target_Bucket_BODY = req.body.Target_Bucket_BODY;
    var Parameters = {
        Bucket: Target_Bucket_ID,
        Key: Target_Bucket_KEY
    };

};

exports.Create_Bucket_Object = function(req, res)
{
    var Target_Bucket_ID  = req.body.Target_Bucket_ID;
    var Target_Bucket_KEY = req.body.Target_Bucket_KEY;
    var Target_Bucket_BODY = req.body.Target_Bucket_BODY;
    var Parameters = {
        Bucket: Target_Bucket_ID,
        Key: Target_Bucket_KEY,
        Body: Target_Bucket_BODY
    };

    s3.putObject(Parameters, function(err, data) {
        if (err) {
            console.log(err)
        } else {
            console.log("Successfully uploaded data!(?)");
        }
    });

};

exports.Delete_Bucket_Object = function(req, res)
{
    var Target_Bucket_ID  = req.body.Target_Bucket_ID;
    var Target_Bucket_KEY = req.body.Target_Bucket_KEY;
    var Target_Bucket_BODY = req.body.Target_Bucket_BODY;
    var Parameters = {
        Bucket: Target_Bucket_ID,
        Delete: {
            Objects: [
                {
                    Key: Target_Bucket_KEY
                }
            ],
            //Quiet: true || false
        }
    };
    s3.deleteObjects(Parameters, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });

};

exports.sendToAWS = function(req, res)
{
    var myBucket = 'Neptune_Probe_Lander';
    var myKey = 'PoissonDistribution';

    s3.createBucket({Bucket: myBucket}, function(err, data) {
        if (err) {
            console.log(err);
        } else {
            params = {Bucket: myBucket, Key: myKey, Body: 'Hello!'};
            s3.putObject(params, function(err, data) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("Successfully uploaded data!(?)");
                }
            });
        }
    });
};