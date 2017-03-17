/**
 * Created by kestas on 2/9/2017.
 */


var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//mongodb://localhost/myTestDB

var userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    workspaces: { type: [String], required: false },
    created_at: Date,
    updated_at: Date
});

userSchema.methods.generateWorkspaces_and_updateSchema = function generateWorkspaces_and_updateSchema()
{
    var AWS_S3 = require('../controllers/AWS_S3');

    var body ={body:{name:'Playground'}};
    AWS_S3.Create_Workspace(body,function(workspace_id){
        this.workspaces.push(workspace_id);
    });
    var body ={body:{name:'Microfluidic Examples'}};
    AWS_S3.Create_Workspace(body,function(workspace_id){
        this.workspaces.push(workspace_id);
    })

    // $.post('/api/Create_Workspace',{name:'Playground'},function(workspace_id){
    //     this.workspaces.push(workspace_id);
    // });
    // $.post('/api/Create_Workspace',{name:'Microfluidic Examples'},function(workspace_id){
    //     this.workspaces.push(workspace_id);
    // });

};

// Upon creation of a new user schema, generate and save the following content:
userSchema.pre('save', function(next)
{
    // Save date of creation
    var currentDate = new Date();       // Get the current date
    this.updated_at = currentDate;      // Change the updated_at field to current date
    if (!this.created_at)
        this.created_at = currentDate;  // If created_at doesn't exist, add to that field

                                        // Unique id is automatically generated

    next();                             // Execute next function.
});

var User = mongoose.model('User', userSchema);
module.exports = User;



