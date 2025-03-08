Introduction
---
This is a standalone version of the collation editor. It works with the local file system on your computer. A small example of a single Greek verse is included as a sample file. 

The collation editor is a GUI wrapper around [collateX](https://collatex.net/). A version of that software is included with this editor.


Requirements
---
The collation editor requires Python3.

The version of collateX packaged with this code requires Java Runtime Environment (JRE) version 8 or higher.

The collation editor has primarily been tested in Firefox but should also work in Chrome.

Installation and Start up
---

Before trying to start the collation editor please ensure that there are no spaces in the directory name.

By default the collation editor runs on port 8080. If you need to change the port number, you can edit the last line of the bottle_server.py file to refer to the port you wish to use.

### On Mac and Linux

To start the collation editor download the code from github and navigate to the standalone_collation_editor directory. From here run the start up script `startup.sh`. This script should start both collateX and the server that runs the collation editor.

If collate has started sucessfully you should be able to see it at:
localhost:7369

If the script has been successful you should be able to see the collation editor when you visit:
localhost:8080/collation

### On Windows

To start the collation editor download the code from github  and navigate to the standalone_collation_editor directory. From here run the start up script `startup.bat`. This script should start both collateX and the server that runs the collation editor.

If collate has started sucessfully you should be able to see it at:
localhost:7369

If the collation editor has started successfully you should be able to see the collation editor when you visit:
localhost:8080/collation

Further Documentation
---
For details of how to collate the example and prepare your own data for use in the standalone collation editor see the project wiki https://github.com/itsee-birmingham/standalone_collation_editor/wiki

Referencing
---

To cite the standalone collation editor please use the DOI: [![DOI](https://zenodo.org/badge/142014378.svg)](https://zenodo.org/badge/latestdoi/142014378)
