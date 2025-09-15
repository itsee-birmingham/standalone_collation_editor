---
id: initialisation
title: Initialisation
---

As the collation editor is a GUI designed to work with different web platform back ends there are a few things that need
to be in place before the system will run correctly. Although most of the code runs in the browser some functions do need
support from Python services. Most of the code required to create these services is provided in the documentation. While
these simple services might not be suitable for all use cases they should be enough to get a system up and running. The
main file which connects the collation editor to the plaform and database you are using is a JavaScript Services file.
Functions provided in this file are called by the collation editor to perform actions like retrieve and save data from
the database, the file is also used to set the configuration options.

In addition to the collation editor code you will also need a copy of CollateX. You can either use the Python version
(which can be installed from PyPI) or the Java [collatex-tools](https://collatex.net/download/) package version. If you
use the Java version then the collate web service must be running (the URL is configurable in the collation editor),
this is not necessary for the Python version.

## Python Services

Three specific Python services need to be available on your system for the collation editor to work. These services are
used to pass data from the client (GUI) side to the server to perform a few operations which cannot be done on the client
side. The services required are fully documented in the [Python Services](python-services.md) section of the documentation.
Some of the service file settings also require some python support but these do not need to be run as services, instead
the python code is accessed via importing the specified classes. These Python requirements are covered in the relevant
sections of the configuration documentation.

## Services File

The services file provides the key link between the collation editor and your own platform. Some variables and functions
are required in order for the system to run. These are covered in the [Services File](services-file.md) section. Optional
[variables](optional-variables.md) and [functions](optional-functions.md) are covered in the configuration section.

## Configuring the CollateX Service

By default the collation editor assumes that you are using the Java collatex-tools and that the service is running at
the default URL `http://localhost:7369/collate`. If this is the case for your system then no addition configuration
is required. If you are using the Java collatex-tools but they are running at a different location then the host path
can be set in the [collatexHost variable](services_file/optional-variables.html#collatexhost) in the services file. If you are using the
Python version of collateX then a collation service can be configured in the
[localCollationFunction](services_file/optional-variables.html#localcollationfunction) variable. Note that if this variable
is provided then it will overwrite the previously described collatexHost setting.

## Initialising the Collation Editor

Once the Python services and Services file are in place the collation editor can be intialised. In addition to the files
provided in the repository the collation editor requires JQuery and Pure CSS to be available. In the example below these
dependecies are loaded from CDNs, you can download them and load them from the local system if you prefer.

The HTML file which will contain the collation editor must load in JQuery, Pure CSS and the
`static/CE_core/js/collation_editor.js` file.

The variable `staticUrl` must be set to the full path to the static files on the system.

You will also need a services file as described below to make the connections to your own platform. The path from
staticUrl to the services file must be specified in a `servicesFile` variable.

Once these two variables have been set you need to call `collation_editor.init()`. This will load in all of the
other JavaScript and CSS files required for the collation editor to work. You may also supply a callback function which
will be run on the completion of the file loading.

Once the services file has loaded it must call `CL.setServiceProvider()` providing itself as the argument. Setting
this will trigger the initialisation of the editor.

An example of the initialisation code.

```html
<link rel="stylesheet" 
      href="https://cdn.jsdelivr.net/npm/purecss@3.0.0/build/pure-min.css" 
      integrity="sha384-X38yfunGUhNzHpBaEBsWLO+A0HDYOQi8ufWDkZ0k9e0eXz/tH3II7uKZ9msv++Ls"
      crossorigin="anonymous">
<script src="https://code.jquery.com/jquery-3.7.1.min.js"
        integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo="
        crossorigin="anonymous"></script>
<script type="text/JavaScript" src="collation/CE_core/js/collation_editor.js"></script>
<script type="text/JavaScript">
  const staticUrl = 'http://localhost:8080/collation/';
  const servicesFile = 'js/local_services.js';
  collation_editor.init();
</script>
```

## Check List

+ CollateX running as web service or available in Python environment
+ Python services running
  + [Collation Service](python-services.html#collation-service)
  + [Settings Applier](python-services.html#settings-applier)
  + [Apparatus Exporter](python-services.html#apparatus-exporter)
+ [Services File](services-file.md) with all required variables and functions
+ [Services Configured correctly for CollateX](#configuring-the-collatex-service)
+ [Initialise Collation Editor](#initialising-the-collation-editor)
  + Load Javascipt dependencies
  + Set staticUrl variable
  + Set servicesFile variable
  + Run `collation_editor.init()`
