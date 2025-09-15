---
id: project-config
title: Project Configuration
---

The project configurations are located at `collation/data/project`.

In this directory there can be a number of different project directories each must contain a `config.json` file. The project supplied for the example is called `default`. You can replace this configuration with your own or add a new directory for a second project. If you add a new project then you will need to edit the `_current_project` variable near the top of the services file (`collation/static/js/local_services.js`) which reads


```JavaScript
_current_project = 'default';  
```

and replace 'default' with the string that matches your project directory. This means you can have lots of different project configurations stored and select the one that you want to run by editing this file.

The minimum information required in the project configuration is:

- **id** *[string]* - this must agree with the name of the project directory.
- **name** *[string]* - the name of the project to be displayed in the collation editor.
- **managing_editor** *[string]* - this is the id of the user in charge of this project. For the standalone version leave this as 'default'.
- **editors** *[array]* - a list of all users with permission to edit this project. For the standalone version leave this as a list with just 'default' in it.
- **witnesses** *[array]* - a list of all of the documents whose text is to be collated. The string used should be the one you chose for the directory name and the \_id value in  the metadata.json file (this is described in the [text Repository section](text-repo-structure.md)).
- **base_text** *[string]* - the id of the document you want to use as a base text. This must be one of the documents in the list of witnesses for the project.

Many other settings and configurations can be specified in this file. They are covered in the configuration section of the documentation.
Several of the functions and variables that can be specified in the services file can also be configured at the project level. The relevant settings are linked from the [Project Settings page](project-settings.md).

## Simple project configuration example

```json
{
  "id": "default",
  "name": "example project",
  "managing_editor": "default",
  "editors": ["editors"],
  "witnesses": [
                  "document_1",
                  "document_2",
                  "document_3",
                  "document_4",
                  "document_5"
              ],
  "base_text": "document_3"
}
```