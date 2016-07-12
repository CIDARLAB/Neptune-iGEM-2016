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


        $('#uploadLFR').submit(function () {

            $(this).ajaxSubmit({

                error: function (xhr) {
                    status('Error: ' + xhr.status);
                },
                success: function (response) {

                    toastr.success('Your LFR File was uploaded successfully!');

                    $.get('../uploads/Design/myLFR.txt',function(data)
                    {
                        localStorage.LFR_STRING = JSON.stringify(data.split("\n"));
                    });
                }
            });
            return false;
        });

        $('#uploadUCF').submit(function () {
            //$("#statusUCF").empty().text("File is uploading...");

            $(this).ajaxSubmit({

                error: function (xhr) {
                    status('Error: ' + xhr.status);
                },
                success: function (response) {

                    toastr.success('Your UCF File was uploaded successfully!');

                    $.get('../uploads/Design/myUCF.json',function(data)
                    {
                        localStorage.UCF_STRING = JSON.stringify(data.split("\n"));
                    });
                }
            });
            return false;
        });

        $('#uploadMINT').submit(function () {

            $(this).ajaxSubmit({

                error: function (xhr) {
                    status('Error: ' + xhr.status);
                },
                success: function (response) {

                    toastr.success('Your MINT File was uploaded successfully!');

                    $.get('../uploads/Design/myMINT.txt',function(data)
                    {
                        localStorage.MINT_STRING = JSON.stringify(data.split("\n"));
                    });
                }
            });
            return false;
        });

    });
}

