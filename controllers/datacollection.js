/**
 * Created by Johan Ospina on 9/6/16.
 */
var serialCommunication = require('./serialcommunication');
var currentWebsocket = require('./websocket');

exports.openDataCollectionPage = function(req, res)
{
    serialCommunication.listPorts( function(ports) {
        res.render('datacollection', {title: 'Data Collection', serialPorts: ports});
    });

};



