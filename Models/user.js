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
    currentWorkspace: { type: String, required: false },
    meta: {
        age: Number,
        website: String
    },
    created_at: Date,
    updated_at: Date
});

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

// Create model
var User = mongoose.model('User', userSchema);

// Export model
module.exports = User;



