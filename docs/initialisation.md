---
id: initialisation
title: Initialisation
---

As the collation editor is a GUI designed to work with different web platform back ends there are a few things that need
to be in place before the system will run correctly. Although most of the code runs in the browser some functions do need
support from Python services. Most of the code required to create these services is provided in the documentation. While
this might not work for all use cases it should be enough to get a system up and running. The main file which connects the
collation editor to the plaform and database you are using is a JavaScript Services file.

You will also need a copy of collateX. You can either use the Python version (which can be installed from PyPI) or the
Java [collatex-tools](https://collatex.net/download/) package version. If you use the Java version then the collate
web service must be running (the URL is configurable in the collation editor), this is not necessary for the Python
version. Instructions for configuring the collation editor to work with either the Java or Python version of collateX
is provided in xxx.

## Initialising the Collation Editor

Once the Python services and Services file are in place the collation editor can be intialised. In addition to the files
provided in the repository the collation editor requires JQuery and Pure CSS to be available. In the example below these
dependecies are loaded from CDNs, you can download them and load them from the local system if you prefer.

The HTML file which will contain the collation editor must load in JQuery, Pure CSS and the
```static/CE_core/js/collation_editor.js``` file.

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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/purecss@3.0.0/build/pure-min.css" integrity="sha384-X38yfunGUhNzHpBaEBsWLO+A0HDYOQi8ufWDkZ0k9e0eXz/tH3II7uKZ9msv++Ls" crossorigin="anonymous">
<script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo="       crossorigin="anonymous"></script>
<script type="text/JavaScript" src="collation/CE_core/js/collation_editor.js"></script>
<script type="text/JavaScript">
  const staticUrl = 'http://localhost:8080/collation/';
  const servicesFile = 'js/local_services.js';
  collation_editor.init();
</script>
```

## Check List

+ [ ] CollateX running as web service or available in Python environment
+ [ ] Python services running
  + [ ] List Python services
+ [ ] Services File with all required variables and functions
+ [ ] Services Configured correctly for CollateX
