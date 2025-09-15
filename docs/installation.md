---
id: installation
title: Installation
---

## Requirements

The standalone collation editor 3.0.0 requires Python3. It should work with python 3.9 - 3.13.

The version of collateX packaged with this code requires Java Runtime Environment (JRE) version 8 or higher.

The collation editor has primarily been tested in Firefox but should also work in Chrome and Edge.

## Download and Start up

Either clone the repository to your local machine or download the zipped file and unzip it. 

If you decide not to use the default directory name of standalone_collation_editor when either cloning or unzipping, then please ensure there are no spaces in the name you choose instead.

By default the collation editor runs on port 8080. If you need to change the port number, you can edit the last line of the bottle_server.py file to refer to the port you wish to use. If you do this you will also need to edit the `SITE_DOMAIN` variable in the `index.html` file.

### On Mac and Linux

To start the collation editor download the code from github and navigate to the standalone_collation_editor directory. From here run the start up script `startup.sh`. This script should start both collateX and the server that runs the collation editor.

If collate has started sucessfully you should be able to see it at:
`localhost:7369`

If the script has been successful you should be able to see the collation editor when you visit:
`localhost:8080/collation`

### On Windows

To start the collation editor download the code from github  and navigate to the standalone_collation_editor directory. From here run the start up script `startup.bat`. This script should start both collateX and the server that runs the collation editor.

If collate has started sucessfully you should be able to see it at:
`localhost:7369`

If the collation editor has started successfully you should be able to see the collation editor when you visit:
`localhost:8080/collation`
