---
id: installation
title: Installation
---

# Installation

## Dependencies

The following are required to run the collation editor code but are not provided in the repository.

- Python3
- JQuery 3 (tested with 3.6.0)
- Pure css
- collateX (by default the Java web services are used but this is configurable)

Other dependencies are provided in the repository.

## Installation path

For the python import statements to work this repository must be a subdirectory of a folder with the name ```collation```.

## Initialising the collation editor

The HTML file which will contain the collation editor must load in all of the JavaScript and css dependencies listed
above and the ```static/CE_core/js/collation_editor.js``` file.

The variable ```staticUrl``` must be set to the full path to the static files on the system.

You will also need a services file as described below to make the connections to your own platform. The path from
staticUrl to the services file must be specified in a ```servicesFile``` variable.

Once these two variables have been set you need to call ```collation_editor.init()```. This will load in all of the
other JavaScript and css files required for the collation editor to work. You may also supply a callback function which
will be run on the completion of the file loading.

Once the services file has loaded it must call ```CL.setServiceProvider()``` providing itself as the argument. Setting
this will trigger the initialisation of the editor.

An example of the initialisation code.

```html
<link rel=stylesheet href="collation/pure-release-1.0.0/pure-min.css" type="text/css"/>
<script type="text/JavaScript" src="collation/js/jquery-3.6.0.min.js"></script>
<script type="text/JavaScript" src="collation/CE_core/js/collation_editor.js"></script>
<script type="text/JavaScript">
  const staticUrl = 'http://localhost:8080/collation/';
  const servicesFile = 'js/local_services.js';
  collation_editor.init();
</script>
```

## Services File

To connect the collation editor to your own database or platform, a services file must be provided. Some variables and
functions are required, others are optional and additional configuration can also be added. The first two types are
described in the services file section and the configuration additions are explained in the configuration section.

On loading the services file must call ```CL.setServiceProvider()``` passing a reference to the service file object as
the argument.

Example services files can be found in the contrib directory.

Project configuration files should not contain JavaScript functions directly but should include references to
functions available in the static files on the server and imported using the ```localJavaScript``` variable.
