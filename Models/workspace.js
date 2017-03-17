/**
 * Created by kestas on 2/23/2017.
 */


var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//mongodb://localhost/myTestDB

var workspaceSchema = new Schema
({
    //path: String,
    name: String,
    specify_files: [],
    design_files: [],
    solution_files: [],
    created_at: Date,
    updated_at: Date
});

workspaceSchema.methods.generateFiles_and_updateSchema = function generateFiles_and_updateSchema()
{
    var AWS_S3 = require('../controllers/AWS_S3');

    var body ={body:{file_name:'myLFR.v',file_ext:'.v'}};
    AWS_S3.Create_File(body,function(file_id){
        this.specify_files.push(file_id);
    });
    var body ={body:{file_name:'defaultUCF.JSON',file_ext:'.JSON'}};
    AWS_S3.Create_File(body,function(file_id){
        this.specify_files.push(file_id);
    });
    var body ={body:{file_name:'myMINT.mint',file_ext:'.mint'}};
    AWS_S3.Create_File(body,function(file_id){
        this.specify_files.push(file_id);
    });
    var body ={body:{file_name:'defaultConfig.ini',file_ext:'.ini'}};
    AWS_S3.Create_File(body,function(file_id){
        this.specify_files.push(file_id);
    });

    // $.post('/api/Create_File',{file_name:'myLFR.v',file_ext:'.v'},function(file_id)
    // {
    //     this.specify_files.push(file_id);
    // });
    // $.post('/api/Create_File',{file_name:'defaultUCF.JSON',file_ext:'.JSON'},function(file_id)
    // {
    //     this.specify_files.push(file_id);
    // });
    // $.post('/api/Create_File',{file_name:'myMINT.mint',file_ext:'.mint'},function(file_id)
    // {
    //     this.design_files.push(file_id);
    // });
    // $.post('/api/Create_File',{file_name:'defaultConfig.ini',file_ext:'.ini'},function(file_id)
    // {
    //     this.design_files.push(file_id);
    // });

};

workspaceSchema.pre('save', function(next)
{
    // Save date of creation
    var currentDate = new Date();       // Get the current date
    this.updated_at = currentDate;      // Change the updated_at field to current date
    if (!this.created_at)
        this.created_at = currentDate;  // If created_at doesn't exist, add to that field

    // Unique id is automatically generated

    next();                             // Execute next function.
});


var Workspace = mongoose.model('Workspace', workspaceSchema);
module.exports = Workspace;

