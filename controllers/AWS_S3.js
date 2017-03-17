/**
 * Created by kestas on 2/17/2017.
 */

var exports     = module.exports;
var express     = require('express');
var cmd         = require('node-cmd');
var path        = require('path');
var mkdirp      = require('mkdirp');
var homeDir     = require('home-dir');
var jsonfile    = require('jsonfile');
var mongoose    = require('mongoose');
var fs          = require('fs');
var AWS         = require('aws-sdk');
var s3s         = require('s3-streams');
AWS.config.update({
    accessKeyId: "AKIAJIA6AHY4LT35NDAA",
    secretAccessKey: "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"
});
var s3          = new AWS.S3();

/*
    Amazon Web Services Management Exports
 */
exports.Create_Unique_Bucket = function(req, res)
{
    var Target_Bucket_ID  = req.body.Target_Bucket_ID;
    var Target_Bucket_KEY = req.body.Target_Bucket_KEY;
    var Target_Bucket_BODY = req.body.Target_Bucket_BODY;
    var Parameters = {
        Bucket: Target_Bucket_ID,
        Key: Target_Bucket_KEY
    };

    s3.createBucket({Bucket: Target_Bucket_ID}, function(err, data)
    {
        if (err) {
            console.log(err);
        } else {
            console.log('Bucket Created. Bucket Id: %s\n',Target_Bucket_ID);
        }
    });
};

exports.Delete_Unique_Bucket = function(req, res)
{
    var Target_Bucket_ID  = req.body.Target_Bucket_ID;
    var Target_Bucket_KEY = req.body.Target_Bucket_KEY;
    var Target_Bucket_BODY = req.body.Target_Bucket_BODY;
    var Parameters = {
        Bucket: Target_Bucket_ID,
        Key: Target_Bucket_KEY
    };

    s3.deleteBucket({Bucket: Target_Bucket_ID}, function(err, data)
    {
        if (err) {
            console.log(err);
        } else {
            console.log('Bucket Deleted. Bucket Id: %s\n',Target_Bucket_ID);
        }
    });
};

exports.Clear_Unique_Bucket = function(req, res)
{
    var Target_Bucket_ID  = req.body.Target_Bucket_ID;
    var Target_Bucket_KEY = req.body.Target_Bucket_KEY;
    var Target_Bucket_BODY = req.body.Target_Bucket_BODY;
    var Parameters = {
        Bucket: Target_Bucket_ID,
        Key: Target_Bucket_KEY
    };

};

exports.Create_Bucket_Object = function(req, res)
{
    var Target_Bucket_ID  = req.body.Target_Bucket_ID;
    var Target_Object_KEY = req.body.Target_Object_KEY;
    var Target_Object_BODY = req.body.Target_Object_BODY;

    var Parameters = {
        Bucket: Target_Bucket_ID,
        Key: Target_Object_KEY,
        Body: Target_Object_BODY
    };

    s3.putObject(Parameters, function(err, data) {
        if (err) {
            console.log(err)
        } else {
            console.log(data);
            //res.send(data);
            return data;
        }
    });

};

exports.read_link = function(req, res)
{

    var Target_Bucket_ID = 'neptune.primary.fs';
    var Target_Object_KEY = req.body.key;
    var download = s3s.ReadStream(new AWS.S3(), {
        Bucket: Target_Bucket_ID,
        Key: Target_Object_KEY
    });
    console.log(download);
    res.send(download);
};

exports.Read_S3_Link = function(req, res)
{
    var path = req.body.path;
    if ((typeof path) === 'string')
    {
        var readStream = fs.createReadStream(path);
        readStream.on('error',function()
        {
            res.send('filepath_error2');
        });
        readStream.on('open',function()
        {
            readStream.pipe(res);
        });
    }
    else
    {
        res.send('filepath_error');
    }
};

exports.Get_Bucket_Object = function(req, res)
{
    var Target_Bucket_ID  = req.body.Target_Bucket_ID;
    var Target_Bucket_KEY = req.body.Target_Bucket_KEY;
    var Parameters = {
        Bucket: Target_Bucket_ID,
        Key: Target_Bucket_KEY,
    };

    s3.getObject(Parameters, function(err, data) {
        if (err) {
            console.log(err)
        } else {
            console.log(data);
            res.send(data);
            //console.log("Successfully uploaded data!(?)");
        }
    });

};

exports.Delete_Bucket_Object = function(req, res)
{
    var Target_Bucket_ID  = req.body.Target_Bucket_ID;
    var Target_Bucket_KEY = req.body.Target_Bucket_KEY;
    var Target_Bucket_BODY = req.body.Target_Bucket_BODY;
    var Parameters = {
        Bucket: Target_Bucket_ID,
        Delete: {
            Objects: [
                {
                    Key: Target_Bucket_KEY
                }
            ],
            //Quiet: true || false
        }
    };
    s3.deleteObjects(Parameters, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });

};

exports.sendToAWS = function(req, res)
{
    var myBucket = 'Neptune_Probe_Lander';
    var myKey = 'PoissonDistribution';

    s3.createBucket({Bucket: myBucket}, function(err, data) {
        if (err) {
            console.log(err);
        } else {
            params = {Bucket: myBucket, Key: myKey, Body: 'Hello!'};
            s3.putObject(params, function(err, data) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("Successfully uploaded data!(?)");
                }
            });
        }
    });
};














/*
     Workspace Schema and Model Exports
 */
// C: Create
exports.createNewWorkspace = function(req, res)
{
    var workspace_path = req.body.workspace;

    var User = require('../Models/user');

    var newUser = User({
        username: name,
        password: password
    })

    newUser.save(function(err) {
        if(err) throw err;
        console.log('New User Created');
        console.log('Username: %s',username);
        console.log('Password: %s:',password);
    })
};

// R: Read



// D: Delete
exports.deleteWorkspace = function(req, res)
{
    username = req.body.username;
    user_id = req.body.id;

    User.find({ username: username }, function(err, user)
    {
        if (err) throw err;

        user.remove(function(err)
        {
            if (err) throw err;

            console.log('User %s deleted!',username);
        });
    });

    User.findByIdAndRemove(user_id, function(err)
    {
        if (err) throw err;

        console.log('User with id %s deleted!',user_id);
    });

    // User.findOneAndRemove({ username: 'starlord55' }, function(err) {
    //     if (err) throw err;
    //
    //     console.log('User deleted!');
    // });

    // find the user with id 4

};

/*
  File Schema and Model Exports
 */
// C: Create -- set path OR create if path does not exist
exports.createNewFile = function(req, res)
{
    var File = require('../Models/file');

    var file_path = req.body.filePath;
    var user_id   = req.body.userId;

    var newFile = File({

    });

    newUser.save(function(err) {
        if(err) throw err;
        console.log('New User Created');
        console.log('Username: %s',username);
        console.log('Password: %s:',password);
    })
};

// R: Read --
exports.queryFile = function(req, res)
{
    // We can effectively add logic for searching and all else here
    var workspace  = req.body.workspace;
    var lookupType = req.body.lookup;
    var Workspace  = require('../Models/workspace');
    if (lookupType == 'Specific')
    {
        Workspace.find({workspace:workspace}, function (err, workspace)
        {
            if(err) throw err;
            console.log(user);
            res.send(workspace);
        })
    }
    else if (lookupType == 'Full')
    {
        Workspace.find({}, function (err, users)
        {
            if(err) throw err;
            console.log(users)
        })
    }
    else if (lookupType == 'Id')
    {
        var id = req.body.id;
        Workspace.findById(id, function (err,user)
        {
            if(err) throw err;
            console.log(user)
        })
    }
    else if (lookupType == 'Query')
    {
        var timespan = req.body.timespan;
        switch(timespan)
        {
            case 'day':
                break;
            case 'week':
                break;
            case 'month':
                timespan.setMonth(timespan.getMonth()-1);
                // User.find({ admin: true }).where('created_at').gt(monthAgo).exec(function(err, users) {
                //     if (err) throw err;
                //
                //     // show the admins in the past month
                //     console.log(users);
                break;
            case 'year':
                break;
        }

    }
};

// U: Update
exports.updateFile = function(req, res)
{
    var userId = req.body.id;
    User.findById(userId, function(err, user){
        if(err) throw err;

        var update_type = req.body.update_type;
        switch(update_type)
        {
            case 'username':
                console.log('Username updated!');
                break;
            case 'password':
                console.log('Password updated!');
                break;
        }
    });

    // OTHER IMPLEMENTATIONS:

    // // find the user starlord55
    // // update him to starlord 88
    // User.findOneAndUpdate({ username: 'starlord55' }, { username: 'starlord88' }, function(err, user) {
    //     if (err) throw err;
    //
    //     // we have the updated user returned to us
    //     console.log(user);
    // });

    // // find the user with id 4
    // // update username to starlord 88
    // User.findByIdAndUpdate(4, { username: 'starlord88' }, function(err, user) {
    //     if (err) throw err;
    //
    //     // we have the updated user returned to us
    //     console.log(user);
    // });

};

// D: Delete
exports.deleteFile = function(req, res)
{
    username = req.body.username;
    user_id = req.body.id;

    User.find({ username: username }, function(err, user)
    {
        if (err) throw err;

        user.remove(function(err)
        {
            if (err) throw err;

            console.log('User %s deleted!',username);
        });
    });

    User.findByIdAndRemove(user_id, function(err)
    {
        if (err) throw err;

        console.log('User with id %s deleted!',user_id);
    });

    // User.findOneAndRemove({ username: 'starlord55' }, function(err) {
    //     if (err) throw err;
    //
    //     console.log('User deleted!');
    // });

    // find the user with id 4

};


// Mongoose Interface Calls

function update(user_id,update_type,body)
{
    switch (update_type)
    {
        case 'user':
            break;
        case 'workspace':
            break;
        case 'file':
            break;
    }
}






exports.Read_User = function(req, res)
{
    // We can effectively add logic for searching and all else here
    var username = req.body.username;
    var lookupType = req.body.lookupType;
    var User = require('../Models/user');

    if (lookupType == 'Specific')
    {
        User.find({username:username}, function (err, user)
        {
            if(err) throw err;
            console.log(user)
        })
    }
    else if (lookupType == 'Full')
    {
        User.find({}, function (err, users)
        {
            if(err) throw err;
            console.log(users)
        })
    }
    else if (lookupType == 'Id')
    {
        var id = req.body.id;
        User.findById(id, function (err,user)
        {
            if(err) throw err;
            console.log(user)
        })
    }
    else if (lookupType == 'Query')
    {
        var timespan = req.body.timespan;
        switch(timespan)
        {
            case 'day':
                break;
            case 'week':
                break;
            case 'month':
                timespan.setMonth(timespan.getMonth()-1);
                // User.find({ admin: true }).where('created_at').gt(monthAgo).exec(function(err, users) {
                //     if (err) throw err;
                //
                //     // show the admins in the past month
                //     console.log(users);
                break;
            case 'year':
                break;
        }
    }
};

exports.read_Workspace = function(req, res)
{
    // We can effectively add logic for searching and all else here
    var username = req.body.username;
    var lookupType = req.body.lookup;

    if (lookupType == 'Full')
    {
        User.find({username:username}, function (err, user)
        {
            if(err) throw err;
            console.log(user)
        })
    }
    else if (lookupType == 'Specific')
    {
        User.find({}, function (err, users)
        {
            if(err) throw err;
            console.log(users)
        })
    }
    else if (lookupType == 'Id')
    {
        var id = req.body.id;
        User.findById(id, function (err,user)
        {
            if(err) throw err;
            console.log(user)
        })
    }
    else if (lookupType == 'Query')
    {
        var timespan = req.body.timespan;
        switch(timespan)
        {
            case 'day':
                break;
            case 'week':
                break;
            case 'month':
                timespan.setMonth(timespan.getMonth()-1);
                // User.find({ admin: true }).where('created_at').gt(monthAgo).exec(function(err, users) {
                //     if (err) throw err;
                //
                //     // show the admins in the past month
                //     console.log(users);
                break;
            case 'year':
                break;
        }
    }
};

exports.read_File = function(req, res){     // We can effectively add logic for searching and all else here
    var user_id = req.body.user_id;
    var workspace_id = req.body.workspace_id;
    var file_id = req.body.file_id;

    var File = require('../Models/file');

    File.findById(id, function (err,file)
    {
        if(err) throw err;
        console.log(file)

        // Add logic to send body of S3 link to client.

    });
};

exports.update_User = function(req, res){

};

exports.update_Workspace = function(req, res){

};

exports.update_File = function(req, res){
    var user_id = req.body.user_id;
    var workspace_id = req.body.workspace_id;
    var file_id = req.body.file_id;

    var File = require('../Models/file');

    File.findById(id, function (err,file)
    {
        if(err) throw err;
        console.log(file)

        // Add logic to send body of client to S3 link.

    });
};

exports.redirectToSpecify = function(req,res)
{
    res.redirect('../Specify');
};





/* User Model DB Calls  */
exports.Create_User = function(req, res)
{
    var User = require('../Models/user');
    var username  = req.body.username;
    var password  = req.body.password;

    var newUser = User({
        username: username,
        password: password
    });

    newUser.save(function(err,success) {
        if(err) throw err;
        console.log('-- New User Created --');
        console.log('Username: %s',username);
        console.log('Password: %s',password);
        console.log('UniqueId: %s',success.id);
        console.log('----------------------');
    });

    newUser.generateWorkspaces_and_updateSchema();

    res.send(newUser.id);
};
exports.Update_User = function(req, res)
{
    var userId = req.body.id;
    User.findById(userId, function(err, user){
        if(err) throw err;

        var update_type = req.body.update_type;
        switch(update_type)
        {
            case 'username':
                console.log('Username updated!');
                break;
            case 'password':
                console.log('Password updated!');
                break;
            case 'workspace':
                var workspace = req.body.workspace;
                user.workspace = workspace;
                console.log('Workspace set to: %s', workspace);
                break;
            case 'newWorkspace':
                var workspace = req.body.workspace;
                break;
        }
    });

    // OTHER IMPLEMENTATIONS:

    // // find the user starlord55
    // // update him to starlord 88
    // User.findOneAndUpdate({ username: 'starlord55' }, { username: 'starlord88' }, function(err, user) {
    //     if (err) throw err;
    //
    //     // we have the updated user returned to us
    //     console.log(user);
    // });

    // // find the user with id 4
    // // update username to starlord 88
    // User.findByIdAndUpdate(4, { username: 'starlord88' }, function(err, user) {
    //     if (err) throw err;
    //
    //     // we have the updated user returned to us
    //     console.log(user);
    // });

};
exports.Query_User = function(req, res)
{
    // We can effectively add logic for searching and all else here
    var User        = require('../Models/user');
    var id          = req.body.id;
    var username    = req.body.username;
    var lookupType  = req.body.lookupType;
    var inquery     = req.body.inquery;

    if (lookupType == 'Specific')
    {
        User.find({username:username}, function (err, user)
        {
            if(err) throw err;
            console.log(user)
        })
    }
    else if (lookupType == 'Full')
    {
        User.find({}, function (err, users)
        {
            if(err) throw err;
            console.log(users)
        })
    }
    else if (lookupType == 'Id')
    {
        var id = req.body.id;
        User.findById(id, function (err,user)
        {
            if(err) throw err;
            if (inquery == 'workspace')
            {
                console.log('Sending to Client: ', user.workspaces);
                res.send(user.workspaces)
            }
        })
    }
    else if (lookupType == 'Query')
    {
        var timespan = req.body.timespan;
        switch(timespan)
        {
            case 'day':
                break;
            case 'week':
                break;
            case 'month':
                timespan.setMonth(timespan.getMonth()-1);
                // User.find({ admin: true }).where('created_at').gt(monthAgo).exec(function(err, users) {
                //     if (err) throw err;
                //
                //     // show the admins in the past month
                //     console.log(users);
                break;
            case 'year':
                break;
        }

    }


};
exports.Delete_User = function(req, res)
{
    var user_id = req.body.id;
    var User = require('../Models/user');
    User.findByIdAndRemove(user_id, function(err)
    {
        if (err) throw err;

        console.log('User with id %s deleted!',user_id);
    });
};


exports.Create_Workspace = function(req, res)
{
    var workspace_name = req.body.name;
    var Workspace = require('../Models/workspace');

    var newWorkspace = Workspace({
        name: workspace_name
    });

    newWorkspace.save(function(err) {
        if(err) throw err;
        console.log('New Workspace');
        console.log('Workspace Name: %s',workspace_name);
    });

    newWorkspace.generateFiles_and_updateSchema();
    //res.send(newWorkspace.id);
    return newWorkspace.id;
};
exports.Query_Workspace = function(req, res)
{
    var workspace_id = req.body.workspace_id;
    var Workspace = require('../Models/workspace');

    Workspace.findById(id, function (err,workspace)
    {
        if(err) throw err;
        res.send(workspace);
    })

};
exports.Update_Workspace = function(req, res)
{
    var userId = req.body.id;
    User.findById(userId, function(err, user){
        if(err) throw err;

        var update_type = req.body.update_type;
        switch(update_type)
        {
            case 'username':
                console.log('Username updated!');
                break;
            case 'password':
                console.log('Password updated!');
                break;
        }
    });

    // OTHER IMPLEMENTATIONS:

    // // find the user starlord55
    // // update him to starlord 88
    // User.findOneAndUpdate({ username: 'starlord55' }, { username: 'starlord88' }, function(err, user) {
    //     if (err) throw err;
    //
    //     // we have the updated user returned to us
    //     console.log(user);
    // });

    // // find the user with id 4
    // // update username to starlord 88
    // User.findByIdAndUpdate(4, { username: 'starlord88' }, function(err, user) {
    //     if (err) throw err;
    //
    //     // we have the updated user returned to us
    //     console.log(user);
    // });

};
exports.Delete_Workspace = function(req, res)
{
    var workspace_id = req.body.id;
    var Workspace = require('../Models/workspace');
    Workspace.findByIdAndRemove(workspace_id, function(err)
    {
        if (err) throw err;
        console.log('Workspace with id %s deleted!',workspace_id);
    });
};


exports.Create_File = function(req, res)
{
    var file_name = req.body.file_name;
    var file_ext  = req.body.ext;

    var File = require('../Models/file');

    var newFile = File({
        name: file_name,
        file_extension: file_ext
    });

    newFile.save(function(err) {
        if(err) throw err;
        console.log('New File');
        console.log('File Name: %s',file_name);
    });

    newFile.createS3File_and_linkToMongoDB();
    return newFile.id;
    //res.send(newFile.id);

};












function Create_Workspace(workspace_name)
{
    var Workspace = require('../Models/workspace');

    var newWorkspace = Workspace({
        name: workspace_name
    });

    newWorkspace.save(function(data, err) {
        if(err) throw err;
        console.log('New Workspace');
        console.log('Workspace Name: %s',workspace_name);

        return data.id;

        //update(user_id,'workspace',{workspace_name: workspace_name, workspace_path: workspace_path, workspace_id: workspace_id});
    });
};
function Create_File(file_path, file_name, file_ext)
{
    var File = require('../Models/file');

    var newFile = Workspace({
        name: file_name,
        S3_path: file_path,
        file_extension: file_ext
    });

    newFile.save(function(err, success) {
        if(err) throw err;
        console.log('New File');
        console.log('File Path: %s',file_path);
        console.log('File Name: %s',file_name);

        return success.id;
        //update(user_id,'file',{file_name: file_name, file_path: file_path, file_id: file_path});
    });
};
function Update_Workspace(update_type, content, userId)
{
    var Workspace = require('../Models/workspace');
    Workspace.findById(userId, function(err, workspace){
        if(err) throw err;
        switch(update_type)
        {
            case 'newFile':
                var file = content;
                Workspace.design_files.push(file);
                console.log('Added file: %s', file);
                break;
            case 'newWorkspace':
                var workspace = req.body.workspace;
                break;
        }
    });
};
function Update_User(update_type, content, userId)
{
    var User = require('../Models/user');
    User.findById(userId, function(err, user){
        if(err) throw err;
        switch(update_type)
        {
            case 'username':
                console.log('Username updated!');
                break;
            case 'password':
                console.log('Password updated!');
                break;
            case 'workspace':
                var workspace = content;
                user.workspaces.push(workspace);
                console.log('Workspace set to: %s', workspace);
                break;
            case 'newWorkspace':
                var workspace = req.body.workspace;
                break;
        }
    });
};
function Create_Bucket_Object(Target_Bucket_ID, Target_Object_KEY, Target_Object_BODY)
{
    Target_Bucket_ID = 'neptune.primary.fs';
    var Parameters = {
        Bucket: Target_Bucket_ID,   // Bucket we place object into- static
        Key: Target_Object_KEY,     // Name of object being created
        Body: Target_Object_BODY    // Contents of object being created
    };

    s3.putObject(Parameters, function(err, data) {
        if (err) {
            console.log(err)
        } else {
            console.log(data);
        }
    });
};
function read_link(Target_Bucket_ID, Target_Object_KEY)
{
    Target_Bucket_ID = 'neptune.primary.fs';
    var download = s3s.ReadStream(new S3(), {
        Bucket: Target_Bucket_ID,
        Key: Target_Object_KEY,
    });
}



