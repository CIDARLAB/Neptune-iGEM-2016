/**
 * Created by kestas on 7/14/2016.
 */
{
    $(document).ready(function () {

        $('#upload_specifyLFR').submit(function () {

            $(this).ajaxSubmit({

                error: function (xhr) {
                    status('Error: ' + xhr.status);
                },
                success: function (response) {

                    toastr.success('Your LFR File was uploaded successfully!');

                    $.get('../uploads/Specify/specifyLFR.txt',function(data)
                    {
                        localStorage.FILE_specifyLFR = JSON.stringify(data.split("\n"));
                    });
                }
            });
            return false;
        });
    });
}

{
    $(document).ready(function () {

        $('#upload_specifyUCF').submit(function () {

            $(this).ajaxSubmit({

                error: function (xhr) {
                    status('Error: ' + xhr.status);
                },
                success: function (response) {

                    toastr.success('Your UCF File was uploaded successfully!');

                    $.get('../uploads/Specify/specifyUCF.txt',function(data)
                    {
                        localStorage.FILE_specifyUCF = JSON.stringify(data.split("\n"));
                    });
                }
            });
            return false;
        });
    });
}

{
    $(document).ready(function () {

        $('#upload_designINI').submit(function () {

            $(this).ajaxSubmit({

                error: function (xhr) {
                    status('Error: ' + xhr.status);
                },
                success: function (response) {

                    toastr.success('Your INI File was uploaded successfully!');

                    $.get('../uploads/Design/designINI.txt',function(data)
                    {
                        localStorage.FILE_designINI = JSON.stringify(data.split("\n"));
                    });
                }
            });
            return false;
        });
    });
}

{
    $(document).ready(function () {

        $('#upload_designMINT').submit(function () {

            $(this).ajaxSubmit({

                error: function (xhr) {
                    status('Error: ' + xhr.status);
                },
                success: function (response) {

                    toastr.success('Your MINT File was uploaded successfully!');

                    $.get('../uploads/Design/designMINT.txt',function(data)
                    {
                        localStorage.FILE_designMINT = JSON.stringify(data.split("\n"));
                    });
                }
            });
            return false;
        });
    });
}

// {
//     $(document).ready(function () {
//
//         $('#upload_buildSVG').submit(function () {
//
//             $(this).ajaxSubmit({
//
//                 error: function (xhr) {
//                     status('Error: ' + xhr.status);
//                 },
//                 success: function (response) {
//
//                     toastr.success('Your SVG File was uploaded successfully!');
//
//                     $.get('../uploads/Build_Verify/buildSVG.svg',function(data)
//                     {
//                         localStorage.FILE_buildSVG = JSON.stringify(data.split("\n"));
//                     });
//                 }
//             });
//             return false;
//         });
//     });
// }
//
// {
//     $(document).ready(function () {
//
//         $('#upload_buildJSON').submit(function () {
//
//             $(this).ajaxSubmit({
//
//                 error: function (xhr) {
//                     status('Error: ' + xhr.status);
//                 },
//                 success: function (response) {
//
//                     toastr.success('Your JSON File was uploaded successfully!');
//
//                     $.get('../uploads/Build_Verify/buildJSON.json',function(data)
//                     {
//                         localStorage.FILE_designMINT = JSON.stringify(data.split("\n"));
//                     });
//                 }
//             });
//             return false;
//         });
//     });
// }