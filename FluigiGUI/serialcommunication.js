var cmd=require('node-cmd');


var command = function() {

    cmd.get(
        'pwd',
        function(data){
            dataResponse = data;
            console.log('the current working dir is : ',data)
        }
    );

};
module.exports.command = command;


