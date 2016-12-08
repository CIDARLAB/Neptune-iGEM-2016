/**
 * Created by kestas on 7/21/2016.
 */

var io = require('socket.io')(global.server);
var socketConnection;
var socketConnectionSet = false;

io.on('connection', function (socket) {
    socketConnection = socket;
    socketConnectionSet = true;
});
exports.socket = function() {
    if (socketConnectionSet) {
        return socketConnection;
    } else {
        console.log("Web socket connection has not been set before it was requested");
        return null;
    }
};

