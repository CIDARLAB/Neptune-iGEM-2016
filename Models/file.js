/**
 * Created by kestas on 2/23/2017.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//mongodb://localhost/myTestDB

var fileSchema = new Schema
({
    name: String,
    S3_path: String,
    file_extension: String
});

// Create model
var File = mongoose.model('File', fileSchema);


// Export model
module.exports = File;
