Introduction
---
This code is the core of the collation editor. The code in this repository is not designed to run as it is.
It needs to be embedded into a larger platform with a database or similar storage. The connections are made with a services file writen in Javascript. Further configuration of settings and other options can also be provided if needed. Data input is all in JSON.


Referencing
---

To cite the collation editor core code please use the doi:   [![DOI](https://zenodo.org/badge/142011800.svg)](https://zenodo.org/badge/latestdoi/142011800)

Documentation
---

This documentation is a work in progress. I will gradually fill in the gaps as time allows. The data structures required as input are fairly well documentated in the README file of the standalone collation editor repository on github:

 https://github.com/itsee-birmingham/standalone_collation_editor

Terminology
---

For the purposes of this documentation the Documents/Works/Texts model will be used.(See David C. Parker, *Textual Scholarship and the making of the New Testament* Oxford: OUP (2011), pp. 10-14,29)

- **Document** - The physical artifact on which the text of a work is preserved
- **Work** - The work which is distilled from the texts that exist of it
- **Text** - The version or versions of a work preserved in document



Dependencies
---

- Python3
- JQuery 3 (tested with 3.3.1)
- JQuery-ui (tested with 1.12.1)
- Pure css
- collateX (by default the Java web services are used but this is configurable)

Initialising the collation editor
---

The HTML file which will contain the collation editor must load in all of the javascript and css dependencies listed above and the ```static/CE_core/js/collation_editor.js``` file.

The variable ```staticUrl``` must be set to the full path to the static files on the system.

You will also need a services file as described below to make the connections to your own platform. The path from staticUrl to the services file must be specified in a ```servicesFile``` variable.

Once these two variables have been set you need to call ```collation_editor.init()```. This will load in all of the other javascript and css files required for the collation editor to work. You may also supply a callback function which will be run on the completion of the file loading.

Once the services file has loaded it must call ```CL.setServiceProvider()``` providing itself as the argument. Setting this will trigger the initialisation of the editor.


Services File
---

To connect the collation editor to your own database or platform a services file must be provided. Some variables and functions are required, others are optional and additional configuration can also be added. The first two types are described in this section and the configuration additions are expalined in the configuration section.  

On loading the services file must call ```CL.setServiceProvider()``` passing a reference to the service file object as the argument.

Example services files can be found in the services directory of the collation_editor_contrib repository here: **TODO: make contrib repository and put stuff in it**


### Required Service File Variables


- #### ```supportedRuleScopes```

The collation editor supports four different rules scopes.
  - once - this place in this specified witness
  - verse - everywhere in every witness for this verse/collation unit
  - manuscript - everywhere in this specified witness
  - always - everywhere in every witness

You can decide which of these you want your system to support and must ensure that the selected scopes can be stored and retrieved through the service file. The file based system offered in the standalone collation editor only supports two scopes (once and always) due to the storage and retrieval limitations.

This variables is a JSON object in which the supported rule scopes as a string are each a key, the string must match the one in the list above. The value of the key is what is used in the drop down box when users select the scope for the rule they are creating. This can be any string that will adequately describe the scope for your users.

An example for a system that supports once and always rule scopes is as follows:

```js 	
  supportedRuleScopes = {
    "once": "This place, these wits",
    "always": "Everywhere, all wits"
  };
```

In future releases it may be possible for projects to limit the supported rules scopes to a subset of those provided by the services and also to change the value of the string displayed to users. Some of the key names may also be changed in 2.0.0 to be more generic (verse and manuscript in particular).


### Required Service File Functions


- #### ```initialiseEditor()```

This function is called as part of the initialisation sequence.

The only requirement for this function is that it set ```CL.managingEditor``` to either ```true``` or ```false``` depending on whether the current user is the managing editor of the current project.

The functional can also be used to set any platform specific requirements such as loading the correct home page for the current project.

- #### ```getUserInfo()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| callback  | <code>function</code> | function to be called on the user data |

This function must get the current user details as a JSON object and call ```callback``` with the result. The user object iself must contain an **id** key. Any other data can be included for use in your own functions for example ```showLoginStatus``` might want to show the username.

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

- #### ```getCurrentEditingProject()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| callback  | <code>function</code> | function to be called on the project data |

This function must get the current project details as a JSON object and call ```callback``` with the result. The structure of the project JSON is discussed in the project configuration section.


- #### ```getVerseData()```


| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | <code>string</code> | the reference for the unit required |
| documentIds | <code>array</code> | the list of ids for the documents required |
| private | <code>boolean</code> | boolean to indicate if the witnesses are private or not (deprecated, will be removed in 2.0.0) |
| callback  | <code>function</code> | function to be called on the data |

This function must find all of the JSON data for this context in each of the documents requested. The callback should be run on the resulting list of JSON objects. Any documents that are lacunose for this unit can be ommitted from the data sent to the callback (they will be handled later).

The JSON structure provided for each unit in each document should match the unit structure as described in the data structures section.

**NB:** In 2.0.0 this function will be renamed ```getUnitData()``` and the ```private``` parameter will be removed.

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

In future versions this function may require an optional projectId parameter.


- #### ```loadSavedCollation()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| id | <code>string/int</code> | Id of collation object required. |
| callback | <code>function</code> | The function to be called on the retreived data. |

This should retrieve the collation with the given id and run the callback on the result, if no collation object is found the callback should be run with ```null```.

### Optional Service File Variables

- #### ```localJavascript```

This variable should be an array of strings giving the full url of any additional javascript you need the collation editor to load. These might be required run the services for your framework (an internal api file for example) or you might want to use additional files to store configuration functions that you call in the services. These files will be loaded as part of the collation editor initialisation functions called once the services are set.

- #### ```extraFooterButtons```

**TODO: check values required for stages**

This variable can be used to add your own custom buttons to the footer of the display in the four stages of the collation editor. Each stage is treated separately. The data should be structured as a JSON object with the stage/s to be modified as the top level key/s using the following values: regularised, set, ordered, approved. The value for each key should be an array of objects where each object has the following two keys:

- **id** *[string]* - the string to be used in the id attribute of the button
-  **label** *[string]* - the string visible to the user on the created button

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

The data should be structured as a JSON object with the stage/s to be modified as the top level key/s using the following values: set_variants, order_readings, approve. The key refers to the stage being moved to so the checks in the key *set_variants* will be run when the *move to set variants* button is clicked in the regulariser screen.

The value of this key should be an array of JSON objects each with the following three keys:

- **function** *[string]* - the function to run. The can either be the function itself or, as in the example below a reference to a function elsewhere sich as the javascript files listed in the ```localJavascript``` variable.
-  **pass_condition** *[boolean]* - the boolean returned from the function if the test has passed and the user may continue to the next stage.
-  **fail_message** *[string]* - the string displayed to the user if a test condition fails and they are prevented from moving to the next stage.

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

- #### ```overlappedOptions```

**This variable can be overwritten in individual project settings**

**There is a default in the core code which just gives the option to treat the reading as a main reading** (this option is always shown even if this variable is provided in services or project - this may change in future releases)

This variables controls the options that are available for the reading in the topline which it has been made into an overlapped reading. The default 'Make main reading' allows the words used in the overlapping reading to be used as evidence for the top line. The rearranging of these words is permitted out of transcription order as the order of words is often something which leads to overlapping readings being created. Any number of additional options can be added to the menu.

The data should be structured as an array of JSON objects. Each object represents an entry in the menu. The object should have the following keys (the final one is optional):

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

This variable is used to control the way the collation unit is provided to and retrieved from the initial index page of the collation editor. There is a default in the core code which will use the form at ```CE_core/html_fragments/default_index_input.html``` and take the collation unit context from the value of the HTML element with the id 'context'.

The data should be structured as a JSON object with the following two keys:

-  **form** *[string]* - The string representing the location of the html index file. This value will be appended to the value of ```staticUrl```.
-  **result_provider** *[function]* - The function to use to contruct the collation context required from the form provided.

If you chose to provide contextInput then both keys should be provided if you only need to overwrite part of the default behaviour the key not in use must be provided and set to ```null```. If you are not providing a value for form and not using the default then you should not use CL.loadIndexPage but instead the framework should provide the index page independently.

An example is below:

```js
contextInput = { //this is only a partial implementation as form itself is handled by the framework
     'form' : null,
     'result_provider' : function () {
         var book, chapter, verse, ref;
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
- **menu_pos** *[integer]* - An integer to desribe where in the list of settings this one should appear on the settings menu.
- **execution_pos** *[integer]* - An integer to determine the order in which settings functions are applied. This can be important in some cases as the settings can interact in different ways depending on the order in which they are applied.

- **Python Method Requirements**

  The method is passed the JSON object for the token and must retrun the same token with the 'interface' key modified as appropriate for the setting being applied. For example if a setting is provided which hides markers of supplied text then these markers must be removed from the 'interface' key value before returning the token. If a setting for showing expanded form of the word exists then an expanded form of the text should have been stored in the JSON object and this can then be used to replace the interface version. more details of the JSON token structure can be found in the documentation for the standalone collation editor on github. This type of setting where the interface value is swapped for another in the JSON token data is an example of why the order of execution is important. When swapping the interface value it is important that any already applied rules are respected and therefore if an 'n' key is present in the token JSON it should be returned instead of any other value. An example of this is given in the 'expand_abbreviations' method example in the python code below.

All of the python methods required for the display settings must be supplied in a single class. That means if you want to add to the defaults with your own functions you should copy the default code into your own python class.

If a settings is required to run behind the scenes then ```null``` can be provided as the menu_pos value and it will not appear.

An example of the settings can be seen in ```static/CE_core/js/default_setting.js```

An example of the python functions can be seen in the ```collation/core/default_implementations.py``` file but  a sample of the two methods described above can also be seen below:

```python
class ApplySettings(object):

    def expand_abbreviations(self, token):
        if 'n' in token: #applied rules override this setting
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

-  **value** *[string]* - The name of the class/category to be used internally to identify it. This must be unique amoung your specified classes and should not contain spaces.
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

Not all of the features make sense when combined and not all combinations will work, for example it does not make sense to mark a regularisation with a suffix to the label if you do not want to have it appear as a subreading in the final edition. For clarity when viewing subreading in set variants or viewing non-edition subreadings in order reading all regularisation classes applied will appear suffixed to the reading label, any which do not have 'suffixed_reading' set to true in the settings will appear in parentheses.

An example can be seen in ```static/CE_core/js/default_setting.js```

**NB:** legacy support for regularisation_classes instead of this variable will be removed in 2.0.0. The content of the two is the same and will remain so.

- #### ```ruleConditions```

**This variable can be overwritten in individual project settings**

**There is a default provided in default_settings.js**

Rule conditions are used to give users the option to specify additional conditions in the application of rules. These rules are applied in python and are supplied as python methods. Examples of when this might be useful are to ignore supplied or unclear markers when applying rules. These are provided in the defaults and are linked to the settings so that if the settings are hiding spplied markers the markers are automatically ignored when making rules. Another circumstance in which they are useful for the New Testament is to restrict the application of a rule only to tokens which have been marked as nomen sacrum in the transcriptions.

The data should be structured as a JSON object. It should have three top level keys:

- **python_file** *[string]* - The import path for the python file containing the class
- **class_name** *[string]* - The name of the class containing the methods
- **configs** *[array]* - A list of JSON objects whcih each specified the configs for a single condition

Each JSON object in the **configs** array should have the following keys (optional keys are marked):

- **id** *[string]* - a unique identifier for this condition which should not contain spaces
- **label** *[string]* - a human readable name for this condition
- **function** *[string]* - the name of the method of the python class to run for this condition. Requirements of the python method are given below.
- **apply_when** *[boolean]* - a boolean that states whether the method should be run if the condition is selected (in which case the boolean should be true), or unselected (in which case the boolean should be false)
- **check_by_default** *[boolean]* - a boolean to determine if this condition should be selected by default or not
- **type** *[string]* - This should contain one of two values depending on what is returned by the function. If the function returns a boolean the string should be 'boolean', if the function modifies the data such as removing supplied markers then this should read 'string_application'.
- **linked_to_settings** *[boolean]* optional - set to true if this condition should be linked to the display settings.
- **setting_id** *[string]* optional - the id of the setting to which this condition should be linked. Required if linked_to_settings is true.


- **Python Method Requirements**

  The data provided to and the data returned from the method differ depending on the method type specified in the config.

  If the method is a boolean type it will be provided with two pieces of data: the JSON for the token and the JSON for the rule. The method should return True if the given rule should be applied to the given token and False if it should not. For example if a rule has a condition that says it should only be applied to nomena sacra and this token does not have a flag to say that it is one then false would be returned.

  If the method is a string_application type then it will be provided with two pieces of data: the string match for the rule and an array of all the possible matches for the token. ()*NB:* please note that the data is provided in reverse order in this type of method than with the boolean type. This may be rectified in future releases.) This type of method must return a tuple of the modified data having applied the condition. The rule match must come first followed by the array of token words. For example if the condition is to ignore supplied markers when applying this rule and the supplied text in your project is indicated by [] then all instances of [ and ] must be removed from the rule match string and all of the token match strings before they are returned.

- **Link to Settings**

  The link to settings gives you the option to ensure that conditions are selected depending on the value of the setting at the point the rule is made. For example, if you have a setting which hides all the supplied text markers and that is active at the time a rule is made then the ignore supplied makers condition should also be selected since the user has no idea what supplied markers are in the text they are regularising. If the display setting value is the same as the 'apply_when' value of that setting then the condition will be automatically selected and disabled so the user cannot override that selection. it is important that the setting linked to and the condition do the same thing.



The function will only be called if there is a possibility of the rule being applied. The function is not responsible for the application of the rule itself just applying the single condition it is responsible for.

All of the python methods required for the rule conditions must be supplied in a single class. That means if you want to add to the defaults with your own functions you should copy the default code into your own python class.


An example of the settings can be seen in ```static/CE_core/js/default_setting.js```

An example of the python functions can be seen in the ```collation/core/default_implementations.py``` file but  a sample of the two methods described above can also be seen below:

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

- #### ```localPythonImplementations```

**This variable can be overwritten in individual project settings**

There are a few functions which can be provided as python methods if required.

- **prepare_t** should be provided if any processing was done in the extraction of the token JSON in  
  order to create the t value. This method should do the same as that process. It is used to determine if rules should be applied before or after the data is sent to collateX. For example, if when preparing the JSON data, you lowercase the value of t then collateX will be sent the lowercase version and therefore any rules which change the case should be applied to the data once it is returned from collateX.

  This method is provided with:
  - a string representing the value of the current word
  - a dictionary of the display settings with the id of each setting providing the key to a boolean that describes whether it is selected or not
  - an array containing the JSON objects of the full display_settings configuration.

  It should return the string modified to the same way as the t values in the token JSON data is created.

- **set_rule_string** This seems to be important in the regularisation process but I can't remember exactly why (I think it is probably to do with rule chaining). I will look into this and update the documentation when I work it out. Sorry!

The data should be provided as a JSON object with the function names above as top level keys (only required for the functions you wish to provide). The data for each of those keys should be another JSON object with the following keys:

- **python_file** *[string]* - The import path for the python file containing the class
- **class_name** *[string]* - The name of the class containing the methods
- **function** *[string]* - the name of the method of the python class to run for this function. Requirements of the python methods are given in the descriptions above.

An example of the config is shown below:

```js
localPythonImplementations = {
    "prepare_t": {
        "python_file": "collation.greek_implementations",
        "class_name": "PrepareData",
        "function": "prepare_t"
    },
    "set_rule_string": {
        "python_file": "collation.greek_implementations",
        "class_name": "PrepareData",
        "function": "set_rule_string"
    }
};
```

The corresonding python for the config above is below:

```python
class PrepareData(object):

    def prepare_t(self, string, display_settings={}, display_settings_config=[]):
        #turn it into a dictionary so we can use other functions
        settingsApplier = ApplySettings()
        token = {'interface': string}
        token = settingsApplier.lower_case_greek(token)
        token = settingsApplier.hide_supplied_text(token)
        token = settingsApplier.hide_unclear_text(token)
        token = settingsApplier.hide_apostrophes(token)
        token = settingsApplier.hide_diaeresis(token)
        return token['interface']


    def set_rule_string(self, token, display_settings={}, display_settings_config=[]):
        if 'n' in token:
            word = token['n']
        elif 'expand_abbreviations' in display_settings and 'expanded' in token.keys():
            word = token['expanded']
        else:
            word = token['original']
        temp_token = {'interface': word}
        settingsApplier = ApplySettings()
        temp_token = settingsApplier.lower_case_greek(temp_token)
        temp_token = settingsApplier.hide_apostrophes(temp_token)
        temp_token = settingsApplier.hide_diaeresis(temp_token)
        token['rule_string'] = temp_token['interface']
        return token
```

- ```localCollationFunction```

**This variable can be overwritten in individual project settings (but this may not be advisable)**

**There is a default provided in core code which uses the collateX Java microservices**

This variable can be used to configure an alternative method of interacting with collateX, or, assuming the output format is the same as the JSON output provided by collateX replacing it with a different collation service. By default the collation editor will use the collateX java microservices running at the default port (7369) at localhost.

the configuration should be provided as a JSON object with the following keys:

- **python_file** *[string]* - The import path for the python file containing the class
- **class_name** *[string]* - The name of the class containing the methods
- **function** *[string]* - the name of the method of the python class to run for this function. Requirements of the python methods are given in the descriptions above.

The method will be provided with the data to collate in the JSON format required by collateX and an optional dictionary of collateX settings requested by the user such as what algorithm to use and whether or not to use the Levenshtein distance matching.

It should return the JSON output from collateX or equivalent.


- #### ```exporterSettings```

**This variable can be overwritten in individual project settings**

**There is a default provided in the core exporter factory code**

More will be added here soon.



### Optional Service File Functions

- #### ```showLoginStatus()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| callback | <code>function</code> |[optional] The function to be called when the function completes. |

This function can be used to display the currently logged in user. It is called when pages are displayed. It should get the current user, display the details in the desired way and then run the callback if there is one.


- #### ```getSavedStageIds()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | <code>string</code> | The reference for the unit required. |
| callback | <code>function</code> |The function to be called on the returned data. |

This function populates the links to saved collations in the footer of the page. This function must get the saved callations for this user and the approved from the project even if it does not belong to this user. The callback must be run with the saved objects from the four collation stages as paramters in order of the stages (regularised, set variants, order readings, approved). If there are no saved objects for any of the stages this position in the parameters should be null.

- #### ```addExtraFooterFunctions()```

This is required if any extra footer buttons are specified in the services file varabile ```extraFooterButtons```. It must attach onclick listeners to all of the buttons specified in the variable.

- #### ```getAdjoiningVerse()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | <code>string</code> | The reference for the current unit. |
| isPrevious | <code>boolean</code> | true if we are looking for the previous unit, false if we are looking for the next unit.
| callback | <code>function</code> |The function to be called on the unit identifier string for the next or previous unit. |

This function is used to provide the data needed move through the data by collation unit using the arrows at the beginning and end of the overtext. It should return either the next (if isPrevious is false) or previous unit based on the provided context. The callback should be run on the string that represents the next/previous unit. If no unit is found the callback should be run with ```null```.

- #### ```switchProject()```

If this function is present in the services file and ```CL.loadIndexPage()``` is called by the services as part of the ```initialiseEditor()``` function in the services then a *switch project* button will be added to the footer of the index page and this function will be attached as an onclick event. The function itself should redirect the user to a page that allows them to select a project from the projects they are authorised to access.


- #### ```viewProjectSummary()```

If this function is present in the services file and ```CL.loadIndexPage()``` is called by the services as part of the ```initialiseEditor()``` function in the services then a *view projct summary* button will be added to the footer of the index page and this function will be attached as an onclick event. The function itself should redirect the user to a page that shows a summary of the work on the project. This might, for example, include how many of the collation units have been saved at each stage and how many have been aproved.


- #### ```witnessSort()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| witnesses | <code>array</code> | The list of witness sigla to be sorted. |

**This function can be overridden with another in individual project settings**

**There is a default in the core code which just sorts the witnesses as strings**

This function is used to sort the witness sigla into the desired order. It is used for the hover overs on the readings and to sort menus that list sigla (such as the highlight witness menu). The function should return the sorted list of sigla.

- #### ```getWitnessesFromInputForm()```

**There is a default in the core code which is explained below**

This function tells the collation editor how to extract the list of witnesses from the index page. If there is an element on the page with the id *preselected_witnesses* the default code will take that value and split on commas. If there is no such element the default will assume that there is a form with the id *collation_form* whih has a series of checkboxes for the witnesses and it will use any values that are selected.

This default behaviour can be overridden by providing this function in the services. It cannot be overwritten in the project settings so the function must work for all projects you host. The function must return an array containing the ids of the documents selected to be collated.

- #### ```getApparatusForContext()```

This function can be used to override the default in the collation editor core code. It takes as an argument a success callback which can be used in conjunction with the export settings to control the export process. Can be useful if a CSRF token is required to download the output.

Data Structures
---

Please see the documentation for the standalone collation editor repository.


Configuration
---

Much of this is explained above but I will put more of a step by step guide here at some point.







Upgrading to collation_editor_core 1.0.x from deprecated collation_editor
---

This code is not backwards compatible with early versions of the code archived at https://github.com/itsee-birmingham/collation_editor

Code changes are largely the conversion of function names from snake case to camel case in the services file.

There are also some required changes to the data structures that the collation editor uses. Most of these changes are deprecated so they will continue to work but support will be removed in future versions. Some changes are required now.

I will try to list all of the changes required now and those that are deprecated below. If you find any other problems while upgrading please let me know by opening an issue in the github repository.

#### Changes to the initialisation

The inclusion of the editor and initialisation of the editor has changed. Please follow the initialisation instructions above to correct this.

#### New service functions required

- getCurrentEditingProject - described in the service file documentation above


#### New optional service functions

- getWitnessesFromInputForm - descibed in the service file documentation above
- getApparatusForContext - descibed in the service file documentation above
- localCollationFunction - descibed in the service file documentation above

#### Changes to service functions

- doCollation does not need context in url to collation server
- getUserInfoByIds needs to return 'id' in user model rather than '\_id'


#### Changes to keys required/suggested in data models (most are deprecated and carry warnings but will be removed in future versions)

- project model
  - 'id' should be used rather than '\_id'
  - 'name' should be used rather than 'project'
  - 'basetext' should be used rather than 'base_text'

- decision/rule model
  - 'id' should be used rather than '\_id'.  **this change must be made either in the data or in the services file as 'id' is now used for rule deletion not _id** **Collation objects saved in early versions of the software also need to be updated to use id instead of _id in any items in 'decision_details' array if they are to be fully functional in this version**
  - '\_model' no longer required/used
  - 'active' no longer required/used
  - use 'created_time' for sorting rather than '\_meta.\_last_modified_time' (both still work for now but \_meta is deprecated)

- collation model
  - '\_model' no longer required/used
  - 'id' is used in the collation editor rather than '\_id' (this can be fixed in services by switching it if the database models need to stay the same)
  - should provide 'user' which is the id of the user owning the collation

- user model
  - 'id' should be used rather than '\_id'

- collation unit model
  - data for collation should use 'transcription' rather than 'transcription_id'
