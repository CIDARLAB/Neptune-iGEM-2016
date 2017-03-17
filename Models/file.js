/**
 * Created by kestas on 2/23/2017.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var fileSchema = new Schema
({
    name: String,
    S3_path: String,
    file_extension: String,
    created_at: Date,
    updated_at: Date
});

fileSchema.methods.createS3File_and_linkToMongoDB = function createS3File_and_linkToMongoDB()
{
    var AWS_S3 = require('../controllers/AWS_S3');
    var body ={body:{Target_Bucket_ID:'neptune.primary.fs', Target_Object_KEY: this.id, Target_Object_BODY:'edit me :)\n\nexample body'}};
    AWS_S3.Create_Bucket_Object(body,function(S3_path){
        this.S3_path = S3_path.ETag;
    });

    // $.post('/api/Create_Bucket_Object',{Target_Bucket_ID:'neptune.primary.fs', Target_Object_Key:this.name, Target_Object_Body:'edit me :)\n\nexample body'},function(S3_path){
    //     this.S3_path = S3_path;
    // });
};

fileSchema.pre('save', function(next)
{
    // Save date of creation
    var currentDate = new Date();       // Get the current date
    this.updated_at = currentDate;      // Change the updated_at field to current date
    if (!this.created_at)
        this.created_at = currentDate;  // If created_at doesn't exist, add to that field

    // Unique id is automatically generated

    next();                             // Execute next function.
});


var File = mongoose.model('File', fileSchema);
module.exports = File;
