{
    $(document).ready(function () {

        $('#uploadLFR').submit(function () {

            $(this).ajaxSubmit({

                error: function (xhr) {
                    status('Error: ' + xhr.status);
                },
                success: function (response) {

                    $.get('../uploads/myverilog.txt',function(data)
                    {
                        localStorage.LFR_STRING = data;
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
                    console.log(response);
                    $("#statusUCF").empty().text(response);
                    location.reload();
                }
            });
            return false;
        });
    });
    
}

