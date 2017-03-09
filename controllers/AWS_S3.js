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
var s3          = new AWS.S3();
var s3s         = require('s3-streams');

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
    var Target_Bucket_KEY = req.body.Target_Bucket_KEY;
    var Target_Bucket_BODY = req.body.Target_Bucket_BODY;
    var Parameters = {
        Bucket: Target_Bucket_ID,
        Key: Target_Bucket_KEY,
        Body: Target_Bucket_BODY
    };

    s3.putObject(Parameters, function(err, data) {
        if (err) {
            console.log(err)
        } else {
            console.log(data);
            //console.log("Successfully uploaded data!(?)");
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
    User Schema and Model Exports
 */
// C: Create
exports.createNewUser = function(req, res)
{
    var username  = req.body.username;
    var password  = req.body.password;
    //var workspace = req.body.workspace;

    var User = require('../Models/user');

    var newUser = User({
        username: name,
        password: password,
        //workspace: workspace
    });

    newUser.save(function(err) {
        if(err) throw err;
        console.log('New User Created');
        console.log('Username: %s',username);
        console.log('Password: %s:',password);
    });
};

// R: Read
exports.queryUser = function(req, res)
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

// U: Update
exports.updateUser = function(req, res)
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
function updateUser(update_type, content, userId)
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


// D: Delete
exports.deleteUser = function(req, res)
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
     Workspace Schema and Model Exports
 */
// C: Create -- set path OR create if path does not exist
exports.createNewWorkspace = function(req, res)
{
    var workspace_path = req.body.workspace;

    var User = require('../Models/user');

    var newUser = User({
        username: name,
        password: password,
    })

    newUser.save(function(err) {
        if(err) throw err;
        console.log('New User Created');
        console.log('Username: %s',username);
        console.log('Password: %s:',password);
    })
};

// R: Read --
exports.queryWorkspace = function(req, res)
{
    // We can effectively add logic for searching and all else here
    var username = req.body.username;
    var lookupType = req.body.lookup;

    if (lookupType == 'Specific')
    {
        User.find({username:username}, function (err, user)
        {
            if(err) throw err;
            console.log(user);
            res.send(user.workspaces);
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
            console.log(user);
            res.send(user);
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
exports.updateWorkspace = function(req, res)
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
function updateWorkspace(update_type, content, userId)
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

exports.Create_User = function(req, res)
{
    var User = require('../Models/user');
    var username  = req.body.username;
    var password  = req.body.password;
    var default_workspaces = ['Playground','Hello_World_Project'];

    var newUser = User({
        username: username,
        password: password
        //workspaces: default_workspaces
    });

    var newUser_id;
    newUser.save(function(err,success) {
        if(err) throw err;
        console.log('-- New User Created --');
        console.log('Username: %s',username);
        console.log('Password: %s',password);
        console.log('UniqueId: %s',success.id);
        console.log('----------------------');
        newUser_id = success.id;
    });


    /*
        Above, we simply created a model user schema: Each user has a username, password, and unique_id
        Now, to get the new user started, we generate two workspaces: a "playground" and a "hello world" workspace.
        Within these workspaces will be default files needed to get the user started in their design proccess.

        What follows is a "road map" for initializing a new user. This is both meant for my own sanity, and should
        serve as a tutorial for future students learning to use a mongoDB, S3 framework.

        Step 1: Create basic user schema: username, password, unique_id. (Done above)

        Step 2: Create workspace schema: workspace_name, unique_id.
                Collect workspace unique_id.

        Step 3: Update user schema with collected unique_id from new workspace schemas.

        Step 4: Create file schema: file_name, extension, unique_id.
                Collect file unique_id's.

        Step 5: Update workspace schema with collected unique_id from new file schemas.

        Step 6: Create S3 file's with collected unique_id's from new file schemas.
                Collect callback and save S3 file path.

                There is a little bit of work to do in this step, namely in setting
                up the users new S3 files.

                6.1: S3 is pre loaded with the default ucf (.JSON) ini (.INI) and
                     lfr (.V) files. These have unique paths and should not be modified.
                     (Actually, cannot be modified through an internal S3 lock.)

                6.2: Stream the body of these S3 objects (files) into your application.
                     Collect the body of the objects.

                6.3: Create new S3 objects with unique file paths using the collected
                     stream bodies. Collect the callback S3 path.

        Step 7: Update file schema with collected S3_file paths.
     */

    /* Step 2 */
    var plyId   = create_Workspace('Playground');
    var helloId = create_Workspace('Hello_World_Project');

    /* Step 3 */
    updateUser('workspace', plyId, newUser_id);
    updateUser('workspace', helloId, newUser_id);

    /* Step 4 */
    var id1 = create_File(file_path, 'default_constraint_file.ucf', '.ucf');
    var id2 = create_File(file_path, 'default_constraint_file.ucf', '.ucf');
    var id3 = create_File(file_path, 'hello_world.lfr', '.lfr');

    /* Step 5 */
    updateWorkspace('newFile',id1,newUser_id);
    updateWorkspace('newFile',id2,newUser_id);
    updateWorkspace('newFile',id3,newUser_id);

    /* Step 6.2 */
    Create_Bucket_Object(0,id1,body1);
    Create_Bucket_Object(0,id2,body2);
    Create_Bucket_Object(0,id3,body3);

    /* Step 6.3 */
    var s3path1 = Create_Bucket_Object(0,id1,body1);
    var s3path1 = Create_Bucket_Object(0,id2,body2);
    var s3path1 = Create_Bucket_Object(0,id3,body3);


};

exports.create_Workspace = function(req, res)
{
    var workspace_path = req.body.workspace;
    var workspace_name = req.body_name;
    var user_id = req.body.user_id;
    var Workspace = require('../Models/workspace');

    var newWorkspace = Workspace({
        path: workspace_path,
        name: workspace_name
    });

    newWorkspace.save(function(err) {
        if(err) throw err;
        console.log('New Workspace');
        console.log('Workspace Path: %s',workspace_path);
        console.log('Workspace Name: %s',workspace_name);

        update(user_id,'workspace',{workspace_name: workspace_name, workspace_path: workspace_path, workspace_id: workspace_id});
    });
};
function create_Workspace(workspace_name)
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

exports.create_File = function(req, res)
{
    var file_path = req.body.file_path;
    var file_name = req.body_name;
    var file_ext  = req.body.ext;
    var user_id = req.body.user_id;
    var workspace_id = req.body.workspace_id;
    var File = require('../Models/file');

    var newFile = Workspace({
        name: filr_name,
        S3_path: file_path,
        file_extension: file_ext
    });

    newFile.save(function(err) {
        if(err) throw err;
        console.log('New File');
        console.log('File Path: %s',file_path);
        console.log('File Name: %s',file_name);

        update(user_id,'file',{file_name: file_name, file_path: file_path, file_id: file_path});
    });
};
function create_File(file_path, file_name, file_ext)
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

































