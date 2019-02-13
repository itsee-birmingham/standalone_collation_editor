Introduction
---
This is a standalone version of the collation editor. It works with the local file system on your computer. A small example of a single Greek verse is included as a sample file.

Requirements
---
The collation editor requires Python3.

The version of collateX packaged with this code requires Java Runtime Environment (JRE) version 8 or higher.

The collation editor has primarily been tested in Firefox but should also work in Chrome.

Installation and Start up
---

### On Mac and Linux

To start the collation editor download the code from github and navigate to the collation_editor directory. From here run the start up script `startup.sh`. This script should start both collateX and the server that runs the collation editor.

If collate has started sucessfully you should be able to see it at:
localhost:7369

If the script has been successful you should be able to see the collation editor when you visit:
localhost:8080/collation

### On Windows

To start the collation editor download the code from github  and navigate to the collation_editor directory. From here run the start up script `startup.bat`. This script should start both collateX and the server that runs the collation editor.

If collate has started sucessfully you should be able to see it at:
localhost:7369

If the collation editor has started successfully you should be able to see the collation editor when you visit:
localhost:8080/collation

Collating the example
---

Currently there is one example available in the collation editor download, it is unfortunately in Greek and uses some Greek specific configurations rather than the default ones. To run this example start the collation editor following the instructions above. Then visit:
localhost:8080/collation

In the text box type 'B04K6V23' and hit run collation.

This should provide a collation of all Greek minuscule manuscripts of John 6:23.
