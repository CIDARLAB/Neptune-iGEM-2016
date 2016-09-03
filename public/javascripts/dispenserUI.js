/**
 * Created by rebeccawolf on 8/22/16.
 */

$(document).ready(function(){



});


function sendDispense(sender){
    // console.log("hello from " + sender.id);
    var form = sender.parentNode.parentNode;
    var volume = form.querySelector(".dispenseVol");
    var time = form.querySelector(".dispenseTime");

    console.log(volume.value);
    console.log(time.value);



    return false;
}