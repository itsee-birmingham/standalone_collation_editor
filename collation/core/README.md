Introduction
---
This code is the core of the collation editor. The code in this repository is not designed to run as it is. It needs to
be embedded into a larger platform with a database or similar storage. The connections are made with a services file
written in JavaScript. Further configuration of settings and other options can also be provided if needed. Data input
is all in JSON.


Referencing
---

To cite the collation editor core code please use the doi:   
[![DOI](https://zenodo.org/badge/142011800.svg)](https://zenodo.org/badge/latestdoi/142011800)

Acknowledgements
---

The software was created by Catherine Smith at the Institute for Textual Scholarship and Electronic Editing (ITSEE) in
the University of Birmingham. The restructuring required for the 1.0 release was completed by Catherine Smith and Troy
A. Griffitts.  The software was developed for and supported by the following research projects:

- The Workspace for Collaborative Editing (AHRC/DFG collaborative project 2010-2013)
- COMPAUL (funded by the European Union 7th Framework Programme under grant agreement 283302, 2011-2016)
- MUYA (funded by the European Union Horizon 2020 Research and Innovation Programme under grant agreement 694612, 2016-2022)
- CATENA (funded by the European Union Horizon 2020 Research and Innovation Programme under grant agreement 770816, 2018-2023)

The collation editor makes use of several third party libraries written and made available by other developers. Details
of sources and licenses are available in the headers of the relevant JavaScript files. The redips drag and drop library
(https://github.com/dbunic/REDIPS_drag) warrants special mention as it is used for all of the drag and drop interaction.


Terminology
---

For the purposes of this documentation the Documents/Works/Texts model will be used.
(See David C. Parker, *Textual Scholarship and the making of the New Testament* Oxford: OUP (2011), pp. 10-14,29, Peter M. W. Robinson, 'The Concept of the Work in the Digital Age', *Ecdotica* 1/2013, pp. 13-42 and Peter M. W. Robinson, An approach to complex texts in multiple documents, *Digital Scholarship in the Humanities*, Volume 37, Issue 4, December 2022, Pages 1179–1196)

- **Document** - The physical artefact on which the text of a work is preserved
- **Work** - The work which is distilled from the texts that exist of it
- **Text** - The version or versions of a work preserved in document


Dependencies
---

The following are required to run the collation editor code but are not provided in the repository.

- Python3
- JQuery 3 (tested with 3.6.0)
- Pure css
- collateX (by default the Java web services are used but this is configurable)

Other dependencies are provided in the repository.

Installation
---
For the python import statements to work this repository must be a subdirectory of a folder with the name ```collation```.

Initialising the collation editor
---

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

Services File
---

To connect the collation editor to your own database or platform a services file must be provided. Some variables and
functions are required, others are optional and additional configuration can also be added. The first two types are
described in this section and the configuration additions are explained in the configuration section.

On loading the services file must call ```CL.setServiceProvider()``` passing a reference to the service file object as
the argument.

Example services files can be found in the contrib directory.

Project configuration files should not contains JavaScript functions directly but should include references to
functions available in the static files on the server and imported using the ```localJavaScript``` variable.


### Required Service File Variables


- #### ```supportedRuleScopes```

The collation editor supports four different rules scopes.
  - once - this place in this specified witness
  - verse - everywhere in every witness for this verse/collation unit
  - manuscript - everywhere in this specified witness
  - always - everywhere in every witness

You can decide which of these you want your system to support and must ensure that the selected scopes can be stored
and retrieved through the service file. The file based system offered in the standalone collation editor only supports
two scopes (once and always) due to the storage and retrieval limitations.

This variables is a JSON object in which the supported rule scopes as a string are each a key, the string must match
the one in the list above. The value of the key is what is used in the drop down box when users select the scope for
the rule they are creating. This can be any string that will adequately describe the scope for your users.

An example for a system that supports once and always rule scopes is as follows:

```js 	
  supportedRuleScopes = {
    "once": "This place, these wits",
    "always": "Everywhere, all wits"
  };
```

In future releases it may be possible for projects to limit the supported rules scopes to a subset of those provided by
the services and also to change the value of the string displayed to users. Some of the key names may also be changed
in 2.0.0 to be more generic (verse and manuscript in particular).


### Required Service File Functions


- #### ```initialiseEditor()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| project | <code>JSON</code> | [optional] The JSON of project object |

This function is called as part of the initialisation sequence.

The only requirement for this function is that it set ```CL.managingEditor``` to either ```true``` or ```false``` depending on whether the current user is the managing editor of the current project.

If the index page is to be set up with JavaScript using the settings provided in the ```contextInput``` variable in the services file then the function should call ```CL.loadIndexPage()``` with the current project as the only argument. If the index page is to be provided in an alternative way they this function must show the index page and set any other platform requirements for its use.

If ```CL.loadIndexPage()``` is not used as part of the index page setup then this function also needs to add a button with the id *switch_project_button* and one with the id *project_summary* if those functions are required on the platform. In addition, if you want users to be able to change the collation algorithm settings then a button with the id *collation_settings* should also be added. Details of how to activate the buttons can be found in the relevant entries in the Optional Service File Functions section.

- #### ```getUserInfo()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| callback  | <code>function</code> | function to be called on the user data |

This function must get the current user details as a JSON object and call ```callback``` with the result. The user object itself must contain an **id** key. Any other data can be included in the object returned for use in your other service functions for example ```showLoginStatus``` might want to show the username.

- #### ```getUserInfoByIds()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| ids | <code>array</code> | list of user ids |
| callback  | <code>function</code> | function to be called on the user data |

This function must resolve a list of user ids into basic user objects and run the callback on the data. The user data should be a JSON object with each provided id as the key to another JSON object which must at a minimum contain an **id** key which should match the top level key and ideally a **name** key to provide the name of the user.

Given the ids ```["JS", "RS"]``` the JSON object should be as follows (where name keys are technically optional):

```json
{
  "JS": {"id": "JS", "name": "Jane Smith"},
  "RS": {"id": "RS", "name": "Rob Smith"}
}
```

- #### ```applySettings()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| data | <code>object</code> | a list of tokens and the display settings options |
| callback  | <code>function</code> | function to be called on the returned data |

The function should pass the data object to a Python service and run the callback on the data returned.

The Python service required is described in the Python services section below.


- #### ```getCurrentEditingProject()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| callback  | <code>function</code> | function to be called on the project data |

This function must get the current project details as a JSON object and call ```callback``` with the result. The structure of the project JSON is discussed in the project configuration section.


- #### ```getUnitData()```


| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | <code>string</code> | the reference for the unit required |
| documentIds | <code>array</code> | the list of ids for the documents required |
| callback  | <code>function</code> | function to be called on the data |

This function must find all of the JSON data for this context in each of the documents requested. The function should return a dictionary which in its minimal form needs to have a single key **results** which should contain an array of JSON objects. The JSON structure provided for each unit in each document should match the unit structure as described in the data structures section. Pay particular attention to the treatment of lacunose and omitted units which need to be handled in different ways depending on the result required in the collation editor.

- Any documents that are lacunose for this unit and do not need a special label should be omitted from the data set entirely.

- Special category lac readings for which the special category can be determined from the input format of the transcription, such as TEI XML, can be sent in the results data using the following structure outlined in the data structures section.

- If any special lac labels are required for data that cannot be determined from the input format then a second key can be added to the main data structure with the name **special_categories**. This should contain an array of JSON objects where each object is structured as follows:

  - **label** The string to use as the label in the interface for this special category of lac.
  - **witnesses** An array of sigla for the witnesses that need to be given this label.

  The witnesses listed in the special_categories array structure should not appear elsewhere in the data returned.


When all of the data has been retrieved the callback should be run on the resulting object.

**NB:** Until version 2.0.0 this function was called ```getVerseData()```, had a boolean ```private``` as the third argument before the callback and returned a list (which is now the list in the **results** key).


- #### ```doCollation()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | <code>string</code> | the reference for the unit being collated |
| options | <code>JSON</code> | a JSON object containing all of the data and settings needed for collation |
| resultCallback  | <code>function</code> | The function called when the collation is complete which displays the data in the collation editor |

This function should send the options JSON to a python service for collation, the url used for collation can be used to determine whether a project uses the current version of the regularisation system or the legacy version. The options JSON object will contain all the options required for the collation process on the server.

The python service required for the collation process is explained in the Python/Server functions section.

When the collation process has completed the JSON response from the Python collation system should be passed to resultCallback.



- #### ```saveCollation()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | <code>string</code> | The reference for the unit required. |
| collation | <code>JSON</code> | The collation object to be saved. |
| confirm_message | <code>string</code> | The message to display if the user is required to confirm the save. |
| overwrite_allowed | <code>boolean</code> | A boolean to indicate if the settings say a user can or cannot overwrite an existing saved version. |
| no_overwrite_message | <code>string</code> | The message to display if there is already a saved version and overwrite_allowed is false. |
| callback  | <code>function</code> | The function to be called when the save is complete. It should be called with ```true``` if the save was sucessful and ```false``` if it was not. |

This function needs to save the collation object in the database. It must be stored in such a way that the ```getSavedCollations()``` and ```loadSavedCollation()``` functions can retrieve it.

- #### ```getSavedCollations()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | <code>string</code> | The reference for the unit required. |
| userId | <code>string/int</code> | [optional] Id of user whose collations are required. |
| callback | <code>function</code> | The function to be called on the retrieved data. |

This should return all of the saved collations of the requested unit restricted by the current project and, if supplied, the provided user id.

In future versions this function may include an optional projectId parameter rather than using the current project.


- #### ```loadSavedCollation()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| id | <code>string/int</code> | Id of collation object required. |
| callback | <code>function</code> | The function to be called on the retrieved data. |

This should retrieve the collation with the given id and run the callback on the result, if no collation object is found the callback should be run with ```null```. The id here is the unique identifier used by the database to refer to this collation.


### Optional Service File Variables

- #### ```localJavaScript```

This variable should be an array of strings giving the full url of any additional JavaScript you need the collation editor to load. These might be required run the services for your framework (an internal api file for example) or you might want to use additional files to store configuration functions that you call in the services. These files will be loaded as part of the collation editor initialisation functions called after the services have been set.


- #### ```localCollationFunction```

**This variable can be overwritten in individual project settings (but this may not be advisable)**

**There is a default provided in core code which uses the collateX Java microservices**

This variable can be used to configure an alternative method of interacting with collateX, or, assuming the output format is the same as the JSON output provided by collateX replacing it with a different collation service. By default the collation editor will use the collateX java microservices running at the default port (7369) at localhost.

the configuration should be provided as a JSON object with the following keys:

- **python_file** *[string]* - The import path for the python file containing the class.
- **class_name** *[string]* - The name of the class containing the methods.
- **function** *[string]* - The name of the method of the python class to run for this function.

The method will be provided with the data to collate in the JSON format required by collateX and an optional dictionary of collateX settings requested by the user such as what algorithm to use and whether or not to use the Levenshtein distance matching.

The reference python function should return the JSON output from collateX or equivalent.


- #### ```collatexHost```

**There is a default in the core code which is explained below**

This variable should be used if the system uses the collateX Java microservices and they are not running at the default location of ```http://localhost:7369/collate```. The variable should provide the full url at which the collateX microservices can be found. If the ```localCollationFunction``` has been set then that function will be used rather than the microservices and this variable will not be used.


- #### ```collationAlgorithmSettings```

**This variable can be overwritten in individual project settings**

**There is a default in the core code which is explained below**

This variable is used to set the starting point for the algorithm settings to be used for collateX. The data should be provided in a JSON object with the following keys:

- **algorithm** *[string]* - The name of the algorithm to use for collateX. This can be any algorithm supported by the version of collateX you are running. You can also use the string 'auto' which will allow the collation preprocessor to make a decision for you. This is probably not optimised for any projects other than the Greek New Testament and should be avoided outside this field.
- **fuzzy_match** *[boolean]* - A boolean to tell collateX whether or not to use fuzzy matching
- **distance** *[integer]* - The value to be used for the fuzzy match distance (this will only be used if the fuzzy match boolean is also true).

The default setting in the code will use the Dekker algorithm with fuzzy matching turned on and a distance of 2.

If ```CL.loadIndexPage()``` or a button with the id *collation_settings* was provided on the index page then the user can override these settings on a unit by unit basis.

**NB:** this setting is new in version 2.0.0 and the default settings have changed from previous versions.


- #### ```lacUnitLabel```

**This variable can be overwritten in individual project settings**

This variable should be a string and should be the text the collation editor needs to display for any witnesses which are lacunose for the entire collation unit. The default, which will be used if this variable is not present, is 'lac unit'. Until version 2.0.0 the default text was 'lac verse'.


- #### ```omUnitLabel```

**This variable can be overwritten in individual project settings**

This variable should be a string and should be the text the collation editor needs to display for any witnesses which omit the entire collation unit. The default, which will be used if this variable is not present, is 'om unit'. Until version 2.0.0 the default text was 'om verse'.


- #### ```showCollapseAllUnitsButton```

**This variable can be overwritten in individual project settings**

This variable is a boolean which determines whether or not to show the button in the footer of all stages of the collation editor which allows all the units to be collapsed to show only the a reading. The default is false. Until version 2.0.0  this button was included by default.

- #### ```showGetApparatusButton```

**This variable can be overwritten in individual project settings**

This variable is a boolean which determines whether or not to show the button in the footer of the approved stage of the collation editor. When present the button allows the user to download an export of the current unit apparatus based on the settings provided in the ```exporterSettings``` variable. If this variable is set to true (or the default is being used) then either ```getApparatusForContext()``` or ```apparatusServiceUrl``` must also be provided in the services file. If neither of these items are available then the get apparatus button will not be shown.

The default is true which maintains the behaviour of earlier releases.

- #### ```extraFooterButtons```

**This variable can be overwritten in individual project settings on a stage by stage basis but addExtraFooterFunctions() in the services file must provide all the functions added in the projects**

This variable can be used to add your own custom buttons to the footer of the display in the four stages of the collation editor. Each stage is treated separately. The data should be structured as a JSON object with the stage/s to be modified as the top level key/s using the following values: regularised, set, ordered, approved. The value for each key should be an array of objects where each object has the following two keys:

- **id** *[string]* - the string to be used in the id attribute of the button
- **label** *[string]* - the string visible to the user on the created button

This variable is used just to add the buttons to the GUI in order to make the buttons work the functions must be added in the ```addExtraFooterFunctions()``` function in the services file using the id provided in this variable to add the function.

An example of how to add a button to the set variants stage is below:

```js
extraFooterButtons = {
  "set": [
    {
      "id": "overlap_om_verse",
      "label": "Overlap om verse"
    }
  ]
};
```

- #### ```preStageChecks```

**This variable can be overwritten in individual project settings on a stage by stage basis**

This variable can be used to add additional checks before moving to the next stage of the collation editor. It can be used to enforce particular editorial rules for example.

The data should be structured as a JSON object with the stage/s to be modified as the top level key/s using the following values: set_variants, order_readings, approve. The key refers to the stage being moved to; so the checks in the key *set_variants* will be run when the *move to set variants* button is clicked in the regularisation screen.

The value of this key should be an array of JSON objects each with the following three keys:

- **function** *[string]* - the function to run. The can either be the function itself (in the services file only) or, as in the example below a reference to a function elsewhere such as the JavaScript files listed in the ```localJavaScript``` variable.
- **pass_condition** *[boolean]* - the boolean returned from the function if the test has passed and the user may continue to the next stage.
- **fail_message** *[string]* - the string displayed to the user if a test condition fails and they are prevented from moving to the next stage.

Functions will be run in the order they are provided in the array.

If a project wishes to ignore the checks set in the services file for a particular stage without adding any of its own an empty array should be given as the value to the key for that stage.

The example below shows two checks added between set variants and order readings and a single check between order readings and approved.

```js
  preStageChecks = {
    "order_readings": [
        {
           "function": "LOCAL.are_no_duplicate_statuses",
           "pass_condition": true,
           "fail_message": "You cannot move to order readings while there are duplicate overlapped readings"
        },
        {
           "function": "LOCAL.check_om_overlap_problems",
           "pass_condition": false,
           "fail_message": "You cannot move to order readings because there is a overlapped reading with the status 'overlapped' that has text in the overlapped unit"
        }
    ],
    "approve": [
        {
            "function": "LOCAL.are_no_disallowed_overlaps",
            "pass_condition": true,
            "fail_message": "You cannot approve this verse because it has an overlapped reading which is identical in word range to a main apparatus unit."
        }
    ]
  };
```

- #### ```combineAllLacsInOR```

**This variable can be overwritten in individual project settings**

This variable is a boolean. If it is set to true then in the move to order readings any lac readings, whatever their text value on the screen, will be automatically regularised to '<lac>' in every unit. For example '<ill 4 char>' and '<lac 4 char>' would both be regularised to '<lac>'. These regularised readings work as subreadings and can be viewed like all other subreadings in the interface.

The default is false.

If you are using special category lac readings and you want these to appear in your final edition then this setting should not be used.


- #### ```combineAllOmsInOR```

**This variable can be overwritten in individual project settings**

This is a boolean variable. It works in the same was as ```combineAllLacsInOR``` but with om readings.

The default is false.


- #### ```combineAllLacsInApproved```

**This variable can be overwritten in individual project settings**

This is a boolean variable. It works in the same was as ```combineAllLacsInOR``` but is applied in the approval process. If this change has already been applied in the move to order readings then this boolean, regardless of its settings, has no influence.

The default is false.

If you are using special category lac readings and you want these to appear in your final edition then this setting should not be used.


- #### ```combineAllOmsInApproved```

**This variable can be overwritten in individual project settings**

This is a boolean variable. It works in the same was as ```combineAllLacsInApproved``` but with om readings. If this change has already been applied in the move to order readings then this boolean, regardless of its settings, has no influence.

The default is false.


- #### ```approvalSettings```

**This variable can be overwritten in individual project settings**

The approval settings determine whether or not an approved version of a unit collation can be overwritten. The default setting is that it can be so this only needs to be added if you want to set it to false as default for all projects in the environment. Individual projects can override this explicitly in their own configurations.

The approvalSettings variable should be a JSON object with the following keys:

-  **allow_approval_overwrite** *[boolean]* - false if overwriting is not allowed, true if it is.
-  **no_overwrite_message** *[string]* - the string displayed to the user if an overwrite is requested but prevented by the settings, ideally it should give the user a suggestion as to how to proceed.

An example is below:

```js
approval_settings = {
  "allow_approval_overwrite": false,
  "no_overwrite_message": "This project already has an approved version of this verse. You cannot overwrite this.\nInstead you must recall the approved version using the administration interface."
};

```

- #### ```apparatusServiceUrl```

This variable specifies the location of the apparatus export service on this platform. If the ```showGetApparatusButton``` is set to true (or the default is used) and ```getApparatusForContext()``` is not used, then this url must be provided as it is used in the default code used to generate and export the apparatus. It should provide the full path to the apparatus export services as described in the Python services section.


- #### ```overlappedOptions```

**This variable can be overwritten in individual project settings**

**There is a default in the core code which just gives the option to treat the reading as a main reading** (this option is always shown even if this variable is provided in services or project)

This variables controls the additional options that are available for the reading in the top line which it has been made into an overlapped reading. The default, and always present, option 'Make main reading' allows the words used in the overlapping reading to be used as evidence for the top line. The rearranging of these words is permitted out of transcription order as the order of words is often something which leads to overlapping readings being created. Any number of additional options can be added to the menu. This option cannot be overridden by settings and is always present.

The data for any additional options should be structured as an array of JSON objects. Each object represents an entry in the menu. The object should have the following keys (the final one is optional):

-  **id** *[string]* - The string to be used as the id in the menu item (only used for HTML)
-  **label** *[string]* - The string to display to the user in the menu to explain what this option does.
-  **reading_flag** *[string]* - The string to be used in the data structure to describe the status of this reading (must not contain spaces).
-  **reading_label** *[string]* - The label to use for the reading in the data structure - if the display label needs to be different it can be provided in the reading_label_display key.
-  **reading_label_display** *[string]* - If the display of the label in the collation editor should be different from the reading_label value then it should be provided here.

An example is below:

```js
overlappedOptions = [{
    "id": "show_as_overlapped",
    "label": "Show as overlapped",
    "reading_flag": "overlapped",
    "reading_label": "zu",
    "reading_label_display": "↑"
},
{
    "id": "delete_reading",
    "label": "Delete reading",
    "reading_flag": "deleted",
    "reading_label": "zu",
}];
```


- #### ```contextInput```

**This variable can be overwritten in individual project settings**

**There is a default in the core code**

This variable is used to control the way the collation unit is provided to and retrieved from the initial index page of
the collation editor. There is a default in the core code which will use the form at ```CE_core/html_fragments/default_index_input.html```
and take the collation unit context from the value of the HTML element with the id 'context'.

The data should be structured as a JSON object with any of the following option keys as required:

-  **form** *[string]* - The string representing the location of the html index file. This value will be appended to the value of ```staticUrl```.
-  **result_provider** *[function]* - The function to use to construct the collation context required from the form provided.
-  **onload_function** *[function]* - The function to run when the form loads (for example, this can be used to populate menus from the database).

An example is below:

```js
contextInput = {
     "form" : "html/index.html",
     "result_provider" : function () {
         let book, chapter, verse, ref;
         book = document.getElementById('book').value;
         chapter = document.getElementById('chapter').value;
         verse = document.getElementById('verse').value;
         if (book !== 'none' && !CL.isBlank(chapter) && !CL.isBlank(verse)) {
             ref = book + '.' + chapter + '.' + verse;
         }
         return ref;
     }
   };
```


- #### ```displaySettings```

**This variable can be overwritten in individual project settings**

**There is a default provided in default_settings.js**

The display settings allow the display of the collation editor to be changed. The display settings can only be changed at the regularisation stage. They are applied in python and are supplied as python methods. It is important that any data needed to apply these settings is present in the JSON for the tokens.

The data should be structured as a JSON object. It should have three top level keys:

- **python_file** *[string]* - The import path for the python file containing the class.
- **class_name** *[string]* - The name of the class containing the methods.
- **configs** *[array]* - A list of JSON objects which each specified the configs for a single condition.

Each JSON object in the **configs** array should have the following keys:

- **id** *[string]* - A unique identifier for this setting which should not contain spaces.
- **label** *[string]* - A human readable name for this display setting.
- **function** *[string]* - The name of the method of the python class to run for this setting. Requirements of the python method are given below.
- **apply_when** *[boolean]* - A boolean that states whether the method should be run if the setting is selected (in which case the boolean should be true), or unselected (in which case the boolean should be false)
- **check_by_default** *[boolean]* - A boolean to determine if this setting should be selected by default or not.
- **menu_pos** *[integer]* - An integer to describe where in the list of settings this one should appear on the settings menu (use ```null``` if this is to run behind the scenes and therefore not appear on the menu).
- **execution_pos** *[integer]* - An integer to determine the order in which settings functions are applied. This can be important in some cases as the settings can interact in different ways depending on the order in which they are applied.

For an example of the JavaScript configuration see the [default_settings.js](https://github.com/itsee-birmingham/standalone_collation_editor/blob/master/collation/core/static/CE_core/js/default_settings.js) file.


**Python requirements**

  The method is passed the JSON object for the token and must return the same token with the 'interface' key modified as appropriate for the setting being applied. For example if a setting is provided which hides markers of supplied text then these markers must be removed from the 'interface' key value before returning the token. If a setting for showing expanded form of the word exists then an expanded form of the text should have been stored in the JSON object and this can then be used to replace the interface version. More details of the JSON token structure can be found in the documentation for the standalone collation editor on github. This type of setting where the interface value is swapped for another in the JSON token data is an example of why the order of execution is important. When swapping the interface value it is important that any already applied rules are respected and therefore if an 'n' key is present in the token JSON it should be returned instead of any other value. An example of this is given in the 'expand_abbreviations' method example in the python code below.

All of the python methods required for the display settings must be supplied in a single class. That means if you want to add to the defaults with your own functions you should copy the default code into your own python class.

If a settings is required to run behind the scenes then ```null``` can be provided as the menu_pos value and it will not appear in the menu.

An example of the python functions can be seen in the [default_implementations.py](https://github.com/itsee-birmingham/collation_editor_core/blob/master/default_implementations.py) file but  a sample of the two methods described above can also be seen below:

```python
class ApplySettings(object):

    def expand_abbreviations(self, token):
        if 'n' in token:  # applied rules override this setting
            token['interface'] = token['n']
        elif 'expanded' in token:
            token['interface'] = token['expanded']
        return token

    def hide_supplied_text(self, token):
        token['interface'] = re.sub('\[(?!\d)', '', re.sub('(?<!\d)\]', '', token['interface']))
        return token
```


- #### ```ruleClasses```

**This variable can be overwritten in individual project settings**

**There is a default provided in default_settings.js**

This variable provides details of the rule classes/categories that will be available for regularising the data. The data should be structured as an array of JSON objects. The JSON object for each rule class should have the keys described below except any that are described as optional which are only required should that particular feature be needed.  

-  **value** *[string]* - The name of the class/category to be used internally to identify it. This must be unique among your specified classes and should not contain spaces.
- **name** *[string]* - The human readable name for this class of rule.
- **create_in_RG** *[boolean]* - Set to true if you want this classification to be available in the regularisation screen, false if not.
- **create_in_SV** *[boolean]* - Set to true if you want this classification to be available in the set variants screen, false if not.
- **create_in_OR** *[boolean]* - Set to true if you want this classification to be available in the order readings screen, false if not.
- **identifier** *[string]* - Optional unless any of the three following settings are true. This should be the string which you want to use to identifiy any readings that have been regularised using this type of rule.
- **suffixed_sigla** *[boolean]* - Set to true if you want the regularisation to be marked by appending the rule classification identifier to the witness siglum.
- **suffixed_label** *[boolean]* - Set to true if you want the regularisation to be marked by appending the rule classification identifier to the reading label.
- **suffixed_reading** *[boolean]* - Set to true if you want the regularisation to be marked by appending the rule classification identifier to the reading text.
- **subreading** *[boolean]* - Set to true if you want readings regularised using this rule to appear as subreadings in the final edition rather than merged with the parent reading, false if not.
- **keep_as_main_reading** *[boolean]* - Set to true if you want readings regularised with this rule to continue to appear as main readings. This is mostly used when you want to mark readings in some way to explain why they are different from the others rather than for genuine regularisations.

Not all of the features make sense when combined and not all combinations will work, for example it does not make sense to mark a regularisation with a suffix to the label if you do not want to have it appear as a subreading in the final edition. For clarity when viewing subreadings in set variants or viewing non-edition subreadings in order reading all regularisation classes applied will appear suffixed to the reading label, any labels for categories that do not have 'suffixed_reading' set to true in the settings will appear in parentheses.

For an example of the JavaScript configuration see the [default_settings.js](https://github.com/itsee-birmingham/standalone_collation_editor/blob/master/collation/core/static/CE_core/js/default_settings.js) file.


- #### ```ruleConditions```

**This variable can be overwritten in individual project settings**

**There is a default provided in default_settings.js**

Rule conditions are used to give users the option to specify additional conditions in the application of rules. These rules are applied in python and are supplied as python methods. Examples of when this might be useful are to ignore supplied or unclear markers when applying rules. These are provided in the defaults and are linked to the settings so that if the settings are hiding supplied markers the markers are automatically ignored when making rules. Another circumstance in which they are useful for the New Testament is to restrict the application of a rule only to tokens which have been marked as nomen sacrum in the transcriptions.

The data should be structured as a JSON object. It should have three top level keys:

- **python_file** *[string]* - The import path for the python file containing the class
- **class_name** *[string]* - The name of the class containing the methods
- **configs** *[array]* - A list of JSON objects which each specified the configs for a single condition

Each JSON object in the **configs** array should have the following keys (optional keys are marked):

- **id** *[string]* - a unique identifier for this condition which should not contain spaces
- **label** *[string]* - a human readable name for this condition
- **function** *[string]* - the name of the method of the python class to run for this condition.
- **apply_when** *[boolean]* - a boolean that states whether the method should be run if the condition is selected (in which case the boolean should be true), or unselected (in which case the boolean should be false)
- **check_by_default** *[boolean]* - a boolean to determine if this condition should be selected by default or not
- **type** *[string]* - This should contain one of two values depending on what is returned by the function. If the function returns a boolean the string should be 'boolean', if the function modifies the data such as removing supplied markers then this should read 'string_application'.
- **linked_to_settings** *[boolean]* optional - set to true if this condition should be linked to the display settings.
- **setting_id** *[string]* optional - the id of the setting to which this condition should be linked. Required if linked_to_settings is true.

The 'linked_to_settings' key gives you the option to ensure that conditions are selected depending on the value of the setting at the point the rule is made. For example, if you have a setting which hides all the supplied text markers and that is active at the time a rule is made then the ignore supplied makers condition should also be selected since the user has no idea what supplied markers are in the text they are regularising. If the display setting value is the same as the 'apply_when' value of that setting then the condition will be automatically selected and disabled so the user cannot override that selection. it is important that the setting linked to and the condition do the same thing.

For an example of the JavaScript configuration see the [default_settings.js](https://github.com/itsee-birmingham/standalone_collation_editor/blob/master/collation/core/static/CE_core/js/default_settings.js) file.

**Python requirements**

If you specify new rule conditions in the JavaScript they need to be supported by appropriate python code since the rule conditions are applied on the server side.

The data provided to, and the data returned from, the method differ depending on the method type specified in the config.

If the method is a boolean type it will be provided with two pieces of data: the JSON for the token and the JSON for the rule. The method should return ```True``` if the given rule should be applied to the given token and ```False``` if it should not. For example if a rule has a condition that says it should only be applied to nomena sacra and this token does not have a flag to say that it is one then false would be returned.

If the method is a string_application type then it will be provided with two pieces of data: the string match for the rule and an array of all the possible matches for the token. **NB:** please note that the data is provided in reverse order in this type of method than with the boolean type. This may be rectified in future releases.) This type of method must return a tuple of the modified data having applied the condition. The rule match must come first followed by the array of token words. For example if the condition is to ignore supplied markers when applying this rule and the supplied text in your project is indicated by [] then all instances of [ and ] must be removed from the rule match string and all of the token match strings before they are returned.


The function in the 'function' key in the rule settings will only be called if there is a possibility of the rule being applied. The function is not responsible for the application of the rule itself just applying the single condition it is responsible for.

All of the python methods required for the rule conditions must be supplied in a single class. That means if you want to add to the defaults with your own functions you should copy the default code into your own python class.


An example of the python functions can be seen in the [default_implementations.py](https://github.com/itsee-birmingham/collation_editor_core/blob/master/default_implementations.py) file but  a sample of the two methods described above can also be seen below:

```python
class RuleConditions(object):

    def match_nomsac(self, token, decision):
        if 'only_nomsac' in decision['conditions'].keys() and decision['conditions']['only_nomsac'] == True \
            and ('nomSac' not in token.keys() or token['nomSac'] == False):
            return False
        return True

    def ignore_supplied(self, decision_word, token_words):
        decision_word = re.sub('\[(?!\d)', '', re.sub('(?<!\d)\]', '', decision_word))
        token_words = [re.sub('\[(?!\d)', '', re.sub('(?<!\d)\]', '', w)) for w in token_words]
        return(decision_word, token_words)
```

- #### ```exporterSettings```

**This variable can be overwritten in individual project settings**

**There is a default provided in the core exporter factory code**

The exporter settings are used to control the export of data from the approved collation screen when the 'Get Apparatus' button is present. If the function is not required then the button can be hidden by setting the ```showGetApparatusButton``` variable to false. This export is simply intended to be a check point for editors and should be set to provide the best export format for this task. The project summary page or a similar page in the overall platform should also provide options to export much larger units of text and more options can be provided to users in these export functions.

If this variable is used then the following keys must be provided.

- **python_file** *[string]* - The import path for the python file containing the exporter class
- **class_name** *[string]* - The name of the exporter class to use
- **function** *[string]* - The name of the exporter function to call to start the process.

In addition to these keys an **options** key can be provided which should contain a JSON object. The contents of this object will be passed into the exporter constructor as keyword arguments. The example below shows all of the options supported by the default exporter provided with the collation editor code along with the default values. This object can contain any keys that are accepted as keyword arguments by the function and python class in the exporterSettings. If you want to pass options to the core function then you must also supply the three required keys above. In the example below the default exporter class details are used so can be copied into your code if needed.

```json
"exporterSettings": {
    "python_file": "collation.core.exporter",
    "class_name": "Exporter",
    "function": "export_data",
    "options": {
      "format":"positive_xml",
      "negative_apparatus": false,
      "ignore_basetext": false,
      "overlap_status_to_ignore": ["overlapped", "deleted"],
      "consolidate_om_verse": true,
      "consolidate_lac_verse": true,
      "include_lemma_when_no_variants": false
    }
}
```


### Optional Service File Functions

- #### ```showLoginStatus()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| callback | <code>function</code> |[optional] A function to be called when this function completes. |

This function can be used to display the currently logged in user. It is called when pages are displayed. It should get the current user and display the required details in the preferred way for the platform. There is a <div> element on each page that calls this function which has the id 'login_status' which should be used to display the user details. When this is done the function should run the callback if one was provided.

- #### ```getSavedStageIds()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | <code>string</code> | The reference for the unit required. |
| callback | <code>function</code> |The function to be called on the returned data. |

This function populates the links to saved collations in the footer of the page. This function must get the saved collations for the context belonging to this user and the approved collation from the project even if it does not belong to this user. The callback must be run with the saved objects from the four collation stages as parameters in order of the stages (regularised, set variants, order readings, approved). If there are no saved objects for any of the stages this position in the parameters should be null.

- #### ```addExtraFooterFunctions()```

This is required if any extra footer buttons are specified in the services file variable ```extraFooterButtons```. It must attach onclick listeners to all of the buttons specified in the variable. This function must cover all buttons added in the services file and in any projects hosted on the system.

- #### ```getAdjoiningUnit()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | <code>string</code> | The unit reference for the current unit. |
| isPrevious | <code>boolean</code> | true if we are looking for the previous unit, false if we are looking for the next unit. |
| callback | <code>function</code> |The function to be called on the unit identifier string for the next or previous unit. |

This function is used to provide the data needed move through the data by collation unit using the arrows at the beginning and end of the overtext. It should return either the next (if isPrevious is false) or previous unit based on the provided context. The callback should be run on the string that represents the context string for the next/previous unit. Context here and in the parameters refers to the string used to identify the collation unit. i.e. what the user would type into the index page to run a collation for that unit. If no unit is found the callback should be run with ```null```.

**NB** Prior to release 2.0.0 this function was named ```getAdjoiningVerse()```

- #### ```switchProject()```

If this function is present in the services file and ```CL.loadIndexPage()``` is called by the services as part of the ```initialiseEditor()``` function in the services then a *switch project* button will be added to the footer of the index page and this function will be attached as an onclick event. The function itself should redirect the user to a page that allows them to select a project from the projects they are authorised to access and then return the user to the page they were viewing when they clicked the button.


- #### ```viewProjectSummary()```

If this function is present in the services file and ```CL.loadIndexPage()``` is called by the services as part of the ```initialiseEditor()``` function in the services then a *view project summary* button will be added to the footer of the index page and this function will be attached as an onclick event. The function itself should redirect the user to a page that shows a summary of the work on the project. This might, for example, include how many of the collation units have been saved at each stage and how many have been approved.


- #### ```witnessSort()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| witnesses | <code>array</code> | The list of witness sigla to be sorted. |

**This function can be overridden in individual project settings**

**There is a default in the core code which just sorts the witnesses as strings**

This function is used to sort the witness sigla into the desired order. It is used for the hover overs on the readings and to sort menus that list sigla (such as the highlight witness menu). The function should return the sorted list of sigla.

- #### ```getWitnessesFromInputForm()```

**There is a default in the core code which is explained below**

This function tells the collation editor how to extract the list of witnesses from the index page. If there is an element on the page with the id *preselected_witnesses* the default code will take that value and split on commas. If there is no such element the default will assume that there is a form with the id *collation_form* which has a series of checkboxes for the witnesses and it will use any values that are selected.

This default behaviour can be overridden by providing this function in the services. It cannot be overwritten in the project settings so the function must work for all projects you host. The function must return an array containing the ids of the documents selected for collation.

- #### ```getApparatusForContext()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| callback | <code>function</code> |[optional] A function to be called when this function completes. |

**There is a default in the core code which is explained below**

This function can be used to override the default export function in the collation editor core code. If this function is not provided and the default code used then the ```apparatusServiceUrl``` variable must be set so that the default code can find the python service. The default function will probably be good enough for many use cases as it generates the file download based on the settings specified in the ```exporterSettings``` variable in the services file. It can be useful to override the function if a CSRF token is required by the platform to download the output or to control other aspects of the export.

*NB* If you do implement this function, the data exported should not be taken from the ```CL.data``` value. Instead the unit should be retrieved from the database and the 'structure' value from the collation object should be used for the data. This is because, in some circumstances, the data stored in the JavaScript variable ```CL.data``` is not suitable for export if the 'show non-edition subreadings' button has been used. The version of the data in the database is always correct as the approved version cannot be saved other than in the approval process itself.

*NB* If you do implement this function there is a pre 2.0 version bug you need to be aware of should any of your user's projects make use of regularisation rules which have the 'keep_as_main_reading' option set to 'true'.
If this is the case, then the rule configurations must be provided in the 'options' key in the exporterSettings as the display settings for these rules are added in the exporter. The rules are available in the ```CL.ruleClasses``` variable in the JavaScript. In collations approved using the 2.0 release this is no longer necessary as the required presentation data is stored in the collation data structure during the approval process for verse 2.0.0 onwards. If you provide functions to export larger volumes of data you also need to be aware of this and ensure that the rule configurations are provided to the exporter in this case.

The function has an optional success callback argument which should be run when the function is complete.

- #### ```extractWordsForHeader()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| data | <code>list</code> | The list of token objects from the base text |

**This function can be overwritten in individual project settings**

**There is a default in the core code which is explained below**

 This function is used to extract the words that appear in the collation editor at the very top of each unit above the numbers. It can be used to both change the visible text and to add css class values to be added to the html so that the presentation can be changed in the html.

 The function is given the token list of the base text. It should return a list of lists where the first item in the inner list is the string to display for the token and the second item in the inner list is a string representing the class values that should be added to the html. If multiple classes need to applied they can be put in a single string value separated by spaces. If not classes need to be added then the second item in the inner list should be an empty string. Any punctuation or other data which should be displayed on the screen should be combined into the display string for the token.

The default does not add any extra text or classes and maintains the behaviour of previous releases. It extracts the words from the data in the selected base text using the 'original' key if that is present or 't' if it is not. It also adds any punctuation to the words based on the 'pc_before' and 'pc_after' keys.

- #### ```prepareDisplayString()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| string | <code>string</code> | The text of the reading |

**This function should not be used unless there is a very good reason to do so**

**This function can be overwritten in individual project settings**

**The default is to leave the provided string untouched**

This function is called every time a reading is displayed in the collation editor (not including the full text of the highlighted witness that appears at the bottom of the screen). It is given the string from the data structure and must return the string with any required changes.

There are probably very few, if any, good reasons to use this. It is present to support some very early implementations while the system was being developed.


- #### ```prepareNormalisedString()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| string | <code>string</code> | The display string of the reading |

**This function must be provided if prepareDisplayString() is used**

**This variable can be overwritten in individual project settings**

**The default is to leave the provided string untouched**


This function is required if ```prepareDisplayString()``` is used. It must exactly reverse the changes made to the string by that function. It is used when making regularisation rules to ensure the stored strings are what is expected and can be transformed by ```prepareNormalisedString()``` correctly in the display.


Python/Server Services
---

To support the server side code packaged with the collation editor some urls are required to provide the connection between the python and the JavaScript. The code required for each service should be minimal as they largely serve to pass data from the client side to the server side.

### Collation Service

The collation service needs to respond to an ajax call from the ```doCollation()``` services function and start the collation process by initialising and calling the collation preprocessor. The preprocessor applies the regularisation rules, runs the collation with collateX using the provided settings and processes and formats the collateX export for display in the collation editor.

All of the settings required are provided by the JavaScript. They can be altered here if needed but in most cases that will not be necessary.

The service needs to create a PreProcessor object using the data passed in the request as as options.configs. In should then call the process_witness_list function of that object using the data passed in the request as options.data. It should then return the output of this process as JSON or, if something goes wrong, an error message.

if the legacy regularisation system is also being used either this service or the ```doCollation()``` function can decide which one to create for the provided data. To use the legacy preprocessor the code requirements are the same but should use the legacy preprocessor object.

This example of the minimum code required for this service is taken from a Django implementation.

```python
from collation.core.exceptions import DataInputException
from collation.core.preprocessor import PreProcessor

def collate(request):

    options = json.loads(request.POST.get('options'))    
    p = PreProcessor(options['configs'])
    try:
        output = p.process_witness_list(options['data'])
    except DataInputException as e:
        return JsonResponse({'message': str(e)}, status=500)

    return JsonResponse(output)
```

### Settings Applier

There is one point in the collation editor code where the JavaScript needs to be able to apply the current settings to a string. This code was overlooked in the initial abstraction of the code away from the New Testament Greek context in which it was developed and the original Greek settings remained hard coded into the JavaScript code. This meant that the correct settings were not being applied for most other projects. The hard coded settings have now been removed from the JavaScript but a Python service is now required in its place. No one has reported problems with the way this worked in versions before 2.0 so it is very unlikely that any existing projects were negatively affected by this.

The collation editor provides a SettingsApplier class which uses the same configuration and Python support code as is used in the display settings configuration applied during the collation process.

The function should create an instance of the SettingsApplier class using the data in the *options* key of the request data object and then call the ```apply_settings_to_token_list()``` function from that objects using the data in the *tokens* key of the request data object.

The service will be called by the ```applySettings()``` function in the services file.

This example of the minimum code required for this service is taken from a Django implementation.

```python
from collation.core.settings_applier import SettingsApplier

def apply_settings(request):
    data = json.loads(request.POST.get('data'))
    applier = SettingsApplier(data['options'])
    tokens = applier.apply_settings_to_token_list(data['tokens'])
    return JsonResponse({'tokens': tokens})
```

### Apparatus Exporter

The apparatus exporter should be available at the URL specified in the ```apparatusServiceUrl``` variable or
the ```getApparatusForContext()``` function depending on which is used.

The service is required to pass the data and configuration from the JavaScript into the ExporterFactory which in turn
passes everything onto the exporter specified in the configuration.  The configuration is explained in the
documentation for the ```exporterSettings``` variable.

The service needs to accept the data to export and the settings for the exporter. It should instantiate the
ExporterFactory class using the exporter settings passed in and, if present, the **options** object from the
configuration. It should then call the export_data function of the ExporterFactory with the data. The result should
then be returned to the user in a suitable way. Single units are usually processed quickly enough to enable the service
to return the file to the user using a standard file download in an HTTP response. When processing larger volumes of
data some kind of asynchronous task manager will probably be required. The code below shows an example of how to
instantiate the classes but does not give an example of how to return the data. If no settings are provided then the
ExporterFactory can be created with no arguments. If there is no **options** key in the settings then no options
argument passed to the constructor.

New exporters can be added by creating new classes from scratch or inheriting from the basic exporter class provided in
the core code. Options are passed from the ExporterFactory to the exporter function as keyword arguments. Some exporter
examples are provided in the contrib repository.


```python
from collation.core.exporter_factory import ExporterFactory

def get_apparatus(request):
    data = json.loads(request.POST.get('data'))
    exporter_settings = request.POST.get('settings', None)
    exf = ExporterFactory(exporter_settings, options=exporter_settings['options'])
    app = exf.export_data(data)

```

Data Structures
---

### Data structure required for collation input

The data structure for each witness retrieved for collation by the ```getUnitData()``` function should a JSON object with the following keys:

- **transcription** *[string/integer]* An identifier for the transcription represented by this object.
- **transcription_identifier** *[string]* [optional] If the value of the **transcription** key is not the same as the value used in the index form to request the transcriptions then that value should be provided here.
- **siglum** *[string]* The siglum for the manuscript represented by this object.
- **duplicate_position** *[integer]* [optional] The position of the unit in relation to other instances of this same unit if this unit appears multiple.
- **witnesses** *[array]* An array of witness object, an empty array or ```null``` depending on the unit, this and the data structure expected is explained below.

Other keys can be included if they are needed for other functions in the platform.

For transcriptions which have text for this unit the witness array should contain an entry for each hand present in the unit. When dealing with corrected text the collation editor treats each hand as a completely separate witness to the text. For this reason it is advisable to provide a full representation of the reading and not just the corrected words if you do not want the shared words to appear as omitted in the collation editor. Each hand should be represented by a JSON object with two keys.

- **id** *[string]* The sigla used to refer to this hand in the collation editor.
- **tokens** *[array]* The array of JSON objects each of which represents a single word in this reading.


Each token object must include the following keys

- **index** *[string]* - the collation editor requires each reading in each witness to be numbered with sequential even numbers starting at 2. Data format though should be a string.
- **reading** *[string]* - this should be the same as the id for this reading.
- **t** *[string]* - a string representation of the word which will be sent to collateX. This could be normalised in some way such as always being lowercase. **NB:** this must not be an empty string or collateX will fail. If the collation editor is running in debug mode all t values will be checked before being sent to collateX and an error will be raised if any empty strings are found.
- **original** *[string]* - a string representation of the word in its original state in the witness. If you do no normalisation to t then this will be the same string. Having this value in addition allows the editor to go back to the original version before processing the display settings which are always applied to the original string (unless you have specified a setting that uses something else).
- **rule_match** *[array]* - a list of strings which should include all strings that would be considered a match for this token when applying rules. In simple cases this will just be a list of a single string equal to the same value as original. The most obvious use case when more than one token would be added is where there is an abbreviated form of a word in the text and an editor can choose to see either the expanded or abbreviated form in the collation editor. In this case a rule created for one form would need to apply to either and so both would appear in this list.

Any number of additional keys can be included in this list. If you are going to customise the settings then you may need to encode extra data in the token such as punctuation for example. You may also want to encode information about gaps in the text which is explained in the next section.

#### Encoding Units which are Entirely Omitted or Lacunose

If an entire unit is omitted then the witnesses key value should either be ```null``` or an empty array (both are treated in the same way).

If an entire unit is lac and does not require any special category label in the collation editor then it should not be returned in the data.

If an entire unit is lac and requires a special category label in the collation editor then this information can be provided in one of two ways.
- It can be pre-calculated and supplied in the **special_categories** key of the object returned from ```getUnitData()``` (see the documentation of that function for details of the format required) in which case no other data for the unit should be returned in data.
- It can be encoded in the witnesses data by providing an empty array for the **tokens** key value and adding the key **gap_reading** which should contain the string value to be assigned to this lacunose reading in the collation editor.
It is up to the platform developers to decide which is most appropriate in each circumstance. The result in the collation editor will be the same regardless of how the data is provided.



#### Encoding Gaps within a Collation Unit

Within a collation unit the collation editor assumes text is omitted unless your witnesses data tells it otherwise.

To encode lacunose text in addition to the required keys in the token object you will need to add additional keys and details about the lacunose section. When the gap follows a word (as in is not before the first word of the context unit). This is done by adding two extra keys to the token object.

- **gap_after** *[boolean]* - should always be true.
- **gap_details** *[string]*  - the details of the gap which will appear between <> in the editor eg. lac 2 char

If this is a gap before the very first extant word in the given unit then you must add the following two keys to the first token.

- **gap_before** *[boolean]* - should always be true.
- **gap_before_details** *[string]* - the details of the gap which will appear between <> in the editor eg. lac 2 char


#### Examples

##### Simple collation unit JSON example

**Document siglum:** 01  
**Text:** A simple example sentence

```json
[
  {
    "id": "01",
    "tokens": [
        {
          "index": 2,
          "reading": "01",
          "original": "A",
          "t": "a",
          "rule_match": ["a"]
        },
        {
          "index": 4,
          "reading": "01",
          "original": "simple",
          "t": "simple",
          "rule_match": ["simple"]
        },
        {
          "index": 6,
          "reading": "01",
          "original": "example",
          "t": "example",
          "rule_match": ["example"]
        },
        {
          "index": 8,
          "reading": "01",
          "original": "sentence",
          "t": "sentence",
          "rule_match": ["sentence"]
        }
    ]
  }
]
```

##### Complex collation unit JSON example

**Document siglum:** 02   
**Text:** A ~~complex~~ <sup>corrected</sup> example [lac 7-8 char] with damage

02\* will be used for the first hand and 02C for the correction

```json
[
  {
    "id": "02*",
    "tokens": [
        {
          "index": 2,
          "reading": "02*",
          "original": "A",
          "t": "a",
          "rule_match": ["a"]
        },
        {
          "index": 4,
          "reading": "02*",
          "original": "complex",
          "t": "complex",
          "rule_match": ["complex"]
        },
        {
          "index": 6,
          "reading": "02*",
          "original": "example",
          "t": "example",
          "rule_match": ["example"],
          "gap_after": true,
          "gap_details": "lac 7-8 char"
        },
        {
          "index": 8,
          "reading": "02*",
          "original": "with",
          "t": "with",
          "rule_match": ["with"]
        },
        {
          "index": 10,
          "reading": "02*",
          "original": "damage",
          "t": "damage",
          "rule_match": ["damage"]
        }
    ]
  },
  {
    "id": "02C",
    "tokens": [
        {
          "index": 2,
          "reading": "02C",
          "original": "A",
          "t": "a",
          "rule_match": ["a"]
        },
        {
          "index": 4,
          "reading": "02C",
          "original": "corrected",
          "t": "corrected",
          "rule_match": ["corrected"]
        },
        {
          "index": 6,
          "reading": "02C",
          "original": "example",
          "t": "example",
          "rule_match": ["example"],
          "gap_after": true,
          "gap_details": "lac 7-8 char"
        },
        {
          "index": 8,
          "reading": "02C",
          "original": "with",
          "t": "with",
          "rule_match": ["with"]
        },
        {
          "index": 10,
          "reading": "02C",
          "original": "damage",
          "t": "damage",
          "rule_match": ["damage"]
        }
    ]
  }
]
```


Configuration
---

Much of this is explained above but I will put more of a step by step guide here at some point.



Upgrading to collation_editor_core 1.0.x from deprecated collation_editor
---

This code is not backwards compatible with early versions of the code archived at https://github.com/itsee-birmingham/collation_editor

Code changes are largely the conversion of function names from snake case to camel case in the services file. The
required and optional function names, arguments and required behaviours are details in the Services File section above.
Please check all function in the services file use these details.

There are also some required changes to the data structures that the collation editor uses. Most of these changes are
deprecated so they will continue to work but support will be removed in future versions. Some changes are required now.

I will try to list all of the changes required immediately and those that are deprecated below. If you find any other
problems while upgrading please let me know by opening an issue in the github repository.

#### Changes to the initialisation

The inclusion of the editor and initialisation of the editor has changed. Please follow the initialisation instructions
above to correct this.

#### New service functions required

- getCurrentEditingProject - described in the service file documentation above


#### New optional service functions

- getWitnessesFromInputForm - described in the service file documentation above
- getApparatusForContext - described in the service file documentation above
- localCollationFunction - described in the service file documentation above

#### Changes to service functions

- doCollation does not need context in the url provided for the collation server
- getUserInfoByIds needs to return 'id' in user model rather than '\_id'


#### Changes to keys required/suggested in data models
Most of these are deprecated and carry warnings but will be removed in future versions.

- project model
  - 'id' should be used rather than '\_id'.
  - 'name' should be used rather than 'project'.
  - 'basetext' should be used rather than 'base_text'.

- decision/rule model
  - 'id' should be used rather than '\_id'.  **This change must be made either in the data or in the services file as 'id' is now used for rule deletion not _id.** **Collation objects saved in early versions of the software also need to be updated to use id instead of _id in any items in 'decision_details' array if they are to be fully functional in this version.**
  - '\_model' no longer required/used.
  - 'active' no longer required/used.
  - 'created_time' is used for sorting rather than '\_meta.\_last_modified_time' (both still work for now but \_meta is deprecated).

- collation model
  - '\_model' no longer required/used.
  - 'id' is used in the collation editor rather than '\_id' (this can be fixed in services by switching it if the database models need to stay the same).
  - should provide 'user' which is the id of the user owning the collation.

- user model
  - 'id' should be used rather than '\_id'.

- collation unit model
  - data for collation should use 'transcription' rather than 'transcription_id'.


Upgrading to collation_editor_core 1.1.x from 1.0.x
---

In 1.1.0 the way regularisation rules are applied has been significantly altered because in some circumstances rules
were not being applied as users (and the developer) intended. The problem stemmed from the way rules were divided into
pre- and post-collation rules. The distinction between pre- and post-collate rules was always internal to the collation
editor and was determined based on whether or not the application of the rule changed the value of the token to be sent
to collateX. This distinction meant that pre-collation rules were not always being applied if they were made after a
post-collation rule for the same word. This lead to confusion for several users.

In 1.1.0 the pre- post-collation distinction has been scrapped to remove this problem with rule chaining. This is the
regularisation system which any new projects should be using.

It is recommended that projects which started regularising on a version before 1.1.x including those started on the now
deprecated code continue to use the older system. This has been preserved in a separate repository and can be run in
parallel with the new system so different projects can use different regularisation applications. The risk of using the
new system for existing projects is that rules which had been created but had never previously been applied to the data
with the old system might be applied in the new system. In many, perhaps most, cases this will not make any difference.
However, in some cases it might. It could change the visible token or the classification of a
regularisation/subreading. The decision will need to be taken on a project by project basis for existing projects
taking into account the stage the project has reached and in consultation with the project editors.

No changes are required to upgrade to 1.1.x from a 1.0.x version.

To run the legacy version instead of or as well as the new version see the legacy_regularisation repository at
https://github.com/itsee-birmingham/legacy_regularisation.


Upgrading to collation_editor_core v2.0.x from collation_editor_core 1.1.x
---

New features in this version:

  - The option to add and/or remove witnesses from saved collations in the first two stages of the collation editor.
  - Support for lac/om unit readings where the editor need to be more specific about the reason for the absence.

As well as the new features several changes have been made to remove hard coded behaviour which might need to differ
for different texts and to remove some of the vocabulary that references biblical verses to be more consistent across
projects.

One additional change is to the way that reading labels are expressed if the number of readings in a unit is greater
than 26. In previous releases letters were joined together to form a label such as ba, bb, bc etc. In this release this
has been changed to a′, b′, c′ etc. Labels are only saved into the data in the move from set variants to order readings
so existing collation data saved at order reading and approved units will not be updated with the new labels. At the
set variants stage any saved collations will display the new labels when they are opened. To update saved collations at
later versions you can start with a saved version of the set variants stage.

The 2.0.x release of the collation editor core code is mostly backwards compatible with 1.1x. There are, however, some
additions required to the services file and the settings and some of the deprecated features from 1.x have been removed
as planned.

If you are not yet using 1.1.x you are advised to work through each upgrade listed above in turn rather than starting
here. You should use the readme file for the version you are upgrading to with the exception of the upgrade to 1.1.x
which is covered in this file.



#### Required changes to the services file.

Some of these changes are required to keep things working. Most are only required in order to maintain existing
behaviour. Where a change is required only to preserve existing behaviour it is noted in the explanation.

##### Changes to variables
  - ```lacUnitLabel``` and ```omUnitLabel``` should be provided in the services file to maintain the existing behaviour which displays 'lac verse' and 'om verse' respectively. The defaults have changed to 'lac unit' and 'om unit' to remove biblical verse assumption. The services choices can also be overridden in individual project settings if required.
  - The variable ```collationAlgorithmSettings``` has been introduced in this release which can be set in the services file and/or the project configurations. The previous defaults may not have been the best option for many projects but to maintain the previous behaviour the services file should set the ```collationAlgorithmSettings``` keys to 'auto', true, 2. The 'auto' setting for the algorithm means that the collation preprocessor will choose an algorithm based on the presence of gaps at the end of the data to be collated. The defaults are explained in the description of the setting above.
  - In this version the seldom used 'collapse all' button in the footer of all stages of the collation editor has been removed by default. The code which performs the function is still present in the core code and the button can be returned by adding the variable ```showCollapseAllUnitsButton``` and setting the value to the boolean ```true```. This should be done to maintain existing behaviour. This setting can also be used at the project level.
  - Four new boolean variables have been introduced to determine whether lac and om readings should be combined at either the Order readings or approved stages. They are:
    - ```combineAllLacsInOR```
    - ```combineAllOmsInOR```
    - ```combineAllLacsInApproved```
    - ```combineAllOmsInApproved```

  These variables can all be specified in the services file or in each project separately and the default for all four is false. To maintain existing behaviour of the editor the value of ```combineAllLacsInOR``` should be set to ```true```.
  - To enable the new feature that allows witnesses to be added and/or removed from saved collations set the ```allowWitnessChangesInSavedCollations``` variable to ```true```. This can be set in either the services file or in the project configurations for the projects which need to use this feature.
  - The undo stack length can now be altered in the services file. The default is in the code and is set at six. The variable ```undoStackLength``` can be used to increase this. A full version of the data structure is held in browser memory for each position in the stack. If you have  a lot of witnesses and/or longer units then setting this too high may cause problems.  Because of the possible memory issues this can only be set in services and cannot be changed in project settings.

##### Changes to functions and new required functions

  - changes to existing function ```getVerseData()```
    - ```getVerseData()``` function should be renamed to ```getUnitData()```.
    - The boolean argument 'private' in the third position should be removed. The third and final argument should now be the callback.
    - The return data for the function has changed (see description of service file above and details on special category lac readings). To maintain previous behaviour wrap the array returned in earlier versions in a dictionary as the value for the key *results*.
  - ```getAdjoiningVerse()``` should be renamed to ```getAdjoiningUnit```.
  - new optional functions ```prepareNormalisedString()``` and ```prepareDisplayString()```. These functions have been added to remove a hard coded action required from the early New Testament Greek implementation of the code. They are described fully in the optional services functions above. To maintain existing behaviour ```prepareNormalisedString()``` should replace an underdot (\&#803;) with an underscore and ```prepareDisplayString()``` the reverse. It is very unlikely that any projects will actually need this to be done unless unclear data is displayed with an underdot but stored in the database as an underscore.
  - ```applySettings()``` function is required along with a supporting Python service. Both are fully documented above.
  - If the 'get apparatus' button is shown (the default) and ```getApparatusForContext()``` is not provided in the services file then the new variable ```apparatusServiceUrl``` must be set in the services to the full url at which the python service for the apparatus export is running.
  - If ```getApparatusForContext()``` is provided in the services file then the data exported should not be taken from the ```CL.data``` variable in the JavaScript. Instead the approved version of the unit should be retrieved from the database and the value of the *structure* key should be used as the export data. This is because the new button to show non-edition subreadings in the approved display changes the value of ```CL.data``` when it is used and means that the version of the data loaded into the interface is not always suitable for export. The version in the database will always be suitable as it cannot be saved except in the approval process itself.


##### Optional changes

  - A new ```extractWordsForHeader()``` function can be specified in either the services file or project settings. The default option maintains current behaviour so it is unlikely that this will be needed for any existing projects. It is used to change the way the text above the numbers appears in all stages of the collation editor. It can be useful to add css classes to these words if some of them need to be highlighted or to display other text which is present in the data but which is not collated. This was introduced for the MUYA project, the first case is used to identifier main text and commentary text the second is used to display the ritual direction text.
  - The *set_rule_string* key of ```localPythonFunctions``` which was used in previous releases is no longer used in this release and can be deleted from the services file and the python files.
  - The *prepare_t* key of ```localPythonFunctions``` is not required for version 2.x. However, it is still required if the legacy regularisation system is being used and any processing was done in the extraction of the token JSON in  
    order to create the t value. It is now documented as part of the [legacy_regularisation repository](https://github.com/itsee-birmingham/legacy_regularisation).
  - The new variable ```collatexHost``` can be used to specify the location of the collateX microservices if they do not use the default of ```http://localhost:7369/collate```.
  - A new setting ```showGetApparatusButton``` will remove the 'get apparatus' button from the approved page if set to false. The default is to show the button which was always the case in previous versions so no change is required to maintain existing behaviour.

##### Changes to project settings

  - rules classes specified in project settings should use the JSON key **ruleClasses** not **regularisation_classes**. This bring them in line with the services equivalent. Both were supported for projects in earlier versions.


#### Other changes to be aware of but that do not necessarily require actions

- In all stages of the editor the select box for highlighting a witness will say 'highlight witness' rather than 'select' as was the case in 1.x There is no way to change this as it is seen as a positive change but your users might need to be aware and any screen shots in documentation may need updating.
- Deleting a created rule before it had been applied by recollating used to delete the rule but then prevent the word from being regularised again until the unit had been recollated. This has now been fixed and if a rule is deleted before recollation another rule can be made for the same word straight away.
- The code for the overlay and spinner code has changed to simplify it. Any calls to ```SPN.show_loading_overlay()``` and/or ```SPN.remove_loading_overlay()``` in the services file should be changed to ```spinner.showLoadingOverlay()``` and ```spinner.removeLoadingOverlay()```.

#### Changes required to Python services

- The collation service requirements have been simplified a lot in this release. Instead of having to unpack all of the data received from the JavaScript the collation service can now just pass it on to the collation editor python code. If you need to make changes at this stage you can still do so but if that is not necessary then the code can be much simpler. The minimum required code is provided as an example in the description of the collation service above.
- An new service is required to apply settings and is described above in the Python/Server Services section under Settings Applier. It is called from the new JavaScript services function ```applySettings()``` (also documented above).

#### Exporter changes which may need action in inherited classes

The following changes relate to the ExporterFactory class in the collation editor code.

Rather than being provided to the ```export_data()``` any settings required by the exporter are now set in the constructor. All of the settings are then saved on the instance and can be access from any functions without having to be passed in the function call. All exporters which are called via the ExporterFactory need to be updated to this new format. If the __init__ function of the core exporter is overwritten then it should either call the parent constructor or set all of the required options on the instance. The settings required for the exporter constructor should be provided to the ExporterFactory as an options dictionary. They are passed to the constructor functions as keyword arguments. The previous second and third positional arguments in the ```export_data()``` function (*format* and *ignore_basetext*) should now be part of the settings dictionary provided to the exporter constructor. This means that ```export_data()``` now contains a single positional argument which is the data to be exported. Any class inheriting from Exporter and implementing the ```export_data()``` function must change the expected arguments for the function accordingly.

The default behaviour has changed for the list of overlap status categories listed for top line readings which are ignored in the output. If you are using the Exporter class directly or inheriting from it a small change is required to maintain existing behaviour. The options dictionary used by the constructor should have an entry with the key *overlap_status_to_ignore* and the value ['overlapped', 'deleted']. This can be done in the ```exporterSettings``` variable in the Services file or, if it is always required, in the python code in the export service which instantiates the Exporter class.

The functions in the exporter code have been made smaller where possible to allow easier customisation. In most cases this will not cause problems for any existing code. The important changes are listed below with guidance on how to maintain existing behaviour if applicable.

Only one of the changes, the addition of the ```get_lemma_text()``` function, is likely to change the behaviour of existing code. To maintain previous behaviour this should be overridden in any classes inheriting from Exporter. The code in 1.x retrieved the lemma text from the apparatus from the a reading which is always the same as the overtext in the collation editor but always uses the t form of the word and does not follow the convention of the collation editor for using the data from the overtext in the very top line of each stage display. In addition not using the overtext values here limits reuse of the exporters in larger systems where a different editorial text might be selected for publication. To maintain existing behaviour any exporter classes inheriting from Exporter should include this function which still extracts from the overtext structure but uses the t value as the key which will be the same as that used in the a reading.

```python
def get_lemma_text(self, overtext, start, end):
    if start == end and start % 2 == 1:
        return ['', 'om']
    real_start = int(start/2)-1
    real_end = int(end/2)-1
    word_list = [x['t'] for x in overtext['tokens']]
    return [' '.join(word_list[real_start:real_end+1])]
```

The XML declaration returned by the Exporter class now uses double rather than single quotes. This will only break things if you ever have to remove it using a string match which is sometimes necessary for python XML processors. If this is the case then the match string will need to account for this change.

The ```make_reading()``` function of Exporter now takes an option argument 'subtype'. Any classes which inherit from Exporter and implement this function should add this optional argument. It is used in the core Exporter to add the subreading classification/s in the 'cause' attribute of the rdg element for any readings with the reading is a subreading. XML exports will all change compared to those exported from 1.x but only in the addition of this attribute which should not cause any problems.


Changelog 2.x release
---

#### Release 2.0.1

* Bug fixed in the function which combines all lac and/or all om readings in the code to approve a unit. This but was caused by the introduction of the the settings applier as a service which added an asynchronous call into a sequence of actions which had to be run in a specific order. As the settings are never relevant to lac and om readings the settings applier is now skipped when combining lac and/or om readings.
* The default behaviour of ```getApparatusForContext()``` has been changed to use the approved version of the data which has been saved rather than the version currently loaded into the interface. This is because the added ability to show the non-edition subreadings on the approved screen changes the data structure in the interface in a way that makes it unsuitable for export if certain conditions exist in the data. There is no problems with always using the saved version as there is no way to save approved data except in the approval process itself. If the services file provides ```getApparatusForContext()``` this should also be amended to use the saved version of the data.
