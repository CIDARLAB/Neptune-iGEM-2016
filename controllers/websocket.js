/**
 * Created by kestas on 7/21/2016.
 */

var app = require('express')();
var http = require('http').Server(app);

exports.socket = function(req,res){

    var io = require('socket.io');

    io.on('connection', function (socket) {
        socket.emit('news', { hello: 'world' });
        socket.on('my other event', function (data) {
            console.log(data);
        });
    });
};