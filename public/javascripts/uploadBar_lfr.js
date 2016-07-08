///////////////////////////////////////////////////////////////////////////////////////////////////////////
//            The following uploads SHOULD have their contents saved to a LOCAL STORAGE ARRAY            //
//   x  LFR_start --> localStorage.LFR_start_STRING;                                                     //
//   x  LFR       --> localStorage.LFR_STRING;                                                           //
//   x  MINT      --> localStorage.MINT_STRING;                                                          //                     
//   x  UCF       --> localStorage.UCF_STRING                                                            //
//                                                                                                       //
//                    o = Needs to be Implemented    x = Implemented and Working                         //                
///////////////////////////////////////////////////////////////////////////////////////////////////////////
{
    $(document).ready(function () {

        $('#uploadLFR_start').submit(function () {

            $(this).ajaxSubmit({

                error: function (xhr) {
                    status('Error: ' + xhr.status);
                },
                success: function (response) {

                    $.get('../uploads/Specify/myLFR_start.txt',function(data)
                    {
                        localStorage.LFR_start_STRING = JSON.stringify(data.split("\n"));
                    });
                }
            });
            return false;
        });
    });
}