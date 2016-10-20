Copyright (c) 2016, CIDAR at Boston University
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.




Notes, issues, installation instruction and misc. information can go here :)

[]  Needs to be done
[x] Done ;)

Code Cleanup To Do
[] Clean [/views] folder, remove deprecated views, and delete commented sections of the code
[] Clean [/public/javascripts] folder:
    [] Consolidate related functions into related .js files
    [] Remove deprecated functions and .js files
    [] Segregate .hbs files into a new folder, i.e: /public/hbs_templates
[] Clean [/public] folder. This folder has a lot of crap in it, much of it deprecated.
    [] Clean [/javascripts]
    [] Clean [/stylesheets]
    [] [/socket.io]?
    [] [/uploads]?
    [] [/lib]?
[] Clean [/controllers] folder.
    [] Consolidate controllers by function
    [] Clean "app.js" to reflect consolidated controllers
[] Standardize [/backend] and [/defaults] folder contents/
[] Clean [/Neptune] main directory
    [] "/backend_results", "data", "output" ; deprecated folders should be culled
[] Implement some user history
    [] Thoughts?
[] package.JSON should be updated to ensure simple npm-install
[] Local libraries and dependencies for neptune should be organized.
