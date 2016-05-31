var cmd=require('node-cmd');


var command = function() {

    cmd.get(
        "./hello",
        function(data){
            dataResponse = data;
            console.log(data)
        }
    );

};
module.exports.command = command;


