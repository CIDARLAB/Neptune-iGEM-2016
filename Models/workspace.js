/**
 * Created by kestas on 2/23/2017.
 */


var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//mongodb://localhost/myTestDB

var workspaceSchema = new Schema
({
    path: String,
    name: String,
    design_files: [string],
    solution_files: [string]
});

// Create model
var Workspace = mongoose.model('Workspace', workspaceSchema);

// Export model
module.exports = Workspace;

