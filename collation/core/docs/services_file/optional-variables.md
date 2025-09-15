---
id: optional-variables
title: Optional Services File Variables
sidebar_label: Services File Variables
---

## `localJavaScript`

This variable should be an array of strings giving the full url of any additional JavaScript you need the collation editor to load. These might be required run the services for your framework (an internal api file for example) or you might want to use additional files to store configuration functions that you call in the services. These files will be loaded as part of the collation editor initialisation functions called after the services have been set.

## `undoStackLength`

This variable determines how many snapshots of the data are stored to enable to the undo button to work, in other words how many actions you are able to undo. A full version of the data structure is held in browser memory for each position in the stack. If you have  a lot of witnesses and/or longer units then setting this too high may cause problems.  Because of the possible memory issues this can only be set in services and cannot be changed in project settings.

The default is 6.

## `localCollationFunction`

**This variable can be overridden in individual project settings (but this may not be advisable)**

**There is a default provided in core code which uses the collateX Java microservices**

This variable can be used to configure an alternative method of interacting with collateX, or, assuming the output format is the same as the JSON output provided by collateX replacing it with a different collation service. By default the collation editor will use the collateX java microservices running at the default port (7369) at localhost.

the configuration should be provided as a JSON object with the following keys:

- **python_file** *[string]* - The import path for the python file containing the class.
- **class_name** *[string]* - The name of the class containing the methods.
- **function** *[string]* - The name of the method of the python class to run for this function.

The method will be provided with the data to collate in the JSON format required by collateX and an optional dictionary of collateX settings requested by the user such as what algorithm to use and whether or not to use the Levenshtein distance matching.

The referenced python function should return the JSON output from collateX or equivalent.

## `collatexHost`

**There is a default in the core code which is explained below**

This variable should be used if the system uses the collateX Java microservices and they are not running at the default location of `http://localhost:7369/collate`. The variable should provide the full url at which the collateX microservices can be found. If the `localCollationFunction` has been set then that function will be used rather than the microservices and this variable will not be used.

## `collationAlgorithmSettings`

**This variable can be overridden in individual project settings**

**There is a default in the core code which is explained below**

This variable is used to set the starting point for the algorithm settings to be used for collateX. The data should be provided in a JSON object with the following keys:

- **algorithm** *[string]* - The name of the algorithm to use for collateX. This can be any algorithm supported by the version of collateX you are running. You can also use the string 'auto' which will allow the collation preprocessor to make a decision for you. This is probably not optimised for any projects other than the Greek New Testament and should be avoided outside this field.
- **fuzzy_match** *[boolean]* - A boolean to tell collateX whether or not to use fuzzy matching
- **distance** *[integer]* - The value to be used for the fuzzy match distance (this will only be used if the fuzzy match boolean is also true).

The default setting in the code will use the Dekker algorithm with fuzzy matching turned on and a distance of 2.

If `CL.loadIndexPage()` or a button with the id *collation_settings* was provided on the index page then the user can override these settings on a unit by unit basis.

**NB:** this setting was new in version 2.0.0 and the default settings have changed from previous versions.

## `lacUnitLabel`

**This variable can be overridden in individual project settings**

This variable should be a string and should be the text the collation editor needs to display for any witnesses which are lacunose for the entire collation unit. The default, which will be used if this variable is not present, is 'lac unit'. Until version 2.0.0 the default text was 'lac verse'.

## `omUnitLabel`

**This variable can be overridden in individual project settings**

This variable should be a string and should be the text the collation editor needs to display for any witnesses which omit the entire collation unit. The default, which will be used if this variable is not present, is 'om unit'. Until version 2.0.0 the default text was 'om verse'.

## `omCategories`

**This variable can be overridden in individual project settings**

This variable should be an array of strings. If provided the editor will be give the option to categorise om readings using the labels in the array in the Order Readings screen.

## `allowCommentsOnRegRules`

**This variable can be overridden in individual project settings**

This variable is a boolean which determines whether or not to show the comments text box in the regularisation rule menu. Nothing happens to these comments appart from them being saved along with the rule so the default is false. This setting should only be set to true if the platform using the collation editor has a mecahnism for using these comments in some way.

## `showSelectAllVariantsOption`

**This variable can be overridden in individual project settings**

**The default is false**

This variable is a boolean which determines whether ot not to show the button to select all variants in the variant unit for regularisation to the same token. This can be useful for texts with large numbers of spelling variants. The collation editor (from v3) also allows multiple selection of tokens by holding shift/alt and clicking on each one, this is an additional option to select them all with a single click.

## `allowWitnessChangesInSavedCollations`

**This variable can be overridden in individual project settings**

This variable determines whether witnesses can be added to or removed from saved collations. If this variable is set to true and the current project witnesses do not match those in the saved collations the system will allow the user to add or remove witnesses until the witnesses saved match the witnesses in the project. This is only possible at the regularisation and set variants stage, order readings always needs to be redone with the new witness set.

The default is false.

## `showCollapseAllUnitsButton`

**This variable can be overridden in individual project settings**

This variable is a boolean which determines whether or not to show the button in the footer of all stages of the collation editor which allows all the units to be collapsed to show only the a reading. The default is false. Until version 2.0.0  this button was included by default.

## `showGetApparatusButton`

**This variable can be overridden in individual project settings**

This variable is a boolean which determines whether or not to show the button in the footer of the approved stage of the collation editor. When present the button allows the user to download an export of the current unit apparatus based on the settings provided in the `exporterSettings` variable. If this variable is set to true (or the default is being used) then either `getApparatusForContext()` or `apparatusServiceUrl` must also be provided in the services file. If neither of these items are available then the get apparatus button will not be shown even if this variable is set to true. The default is true.

## `extraFooterButtons`

**This variable can be overridden in individual project settings on a stage by stage basis but addExtraFooterFunctions() in the services file must provide all the functions added in the projects**

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

## `preStageChecks`

**This variable can be overridden in individual project settings on a stage by stage basis**

This variable can be used to add additional checks before moving to the next stage of the collation editor. It can be used to enforce particular editorial rules for example.

The data should be structured as a JSON object with the stage/s to be modified as the top level key/s using the following values: set_variants, order_readings, approve. The key refers to the stage being moved to; so the checks in the key *set_variants* will be run when the *move to set variants* button is clicked in the regularisation screen.

The value of this key should be an array of JSON objects each with the following three keys:

- **function** *[string]* - the function to run. The can either be the function itself (in the services file only) or, as in the example below a reference to a function elsewhere such as the JavaScript files listed in the `localJavaScript` variable.
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

## `allowOutOfOrderWitnesses`

**This variable can be overridden in individual project settings**

A boolean to determine whether witnesses are allowed to be out of order (have rearranged words) in the collation. It works with *witnessesAllowedToBeOutOfOrder* which can limit the selection of witnesses allowed to be out of order. Any witness/es allowed to be out of order will not appear in the warnings in the Set Variants stage and moving to Order Readings will also be allowed if those witnesses are out of order.

The setting has no effect on the witnesses above overlapping units which are always allowed to be reordered.

The default is false.

## `witnessesAllowedToBeOutOfOrder`

**This variable can be overridden in individual project settings**

This setting is only relevant if *allowOutOfOrderWitnesses* is true. It should contain a list of the witnesses (by transcription ID) that should be allowed to be out of order. If an empty list is provided then all witnesses are allowed to be out of order.

The default is an empty list.

## `combineAllLacsInOR`

**This variable can be overridden in individual project settings**

This variable is a boolean. If it is set to true then in the move to order readings any lac readings, whatever their text value on the screen, will be automatically regularised to '<lac>' in every unit. For example '<ill 4 char>' and '<lac 4 char>' would both be regularised to '<lac>'. These regularised readings work as subreadings and can be viewed like all other subreadings in the interface.

The default is false.

If you are using special category lac readings and you want these to appear in your final edition then this setting should not be used.

## `combineAllOmsInOR`

**This variable can be overridden in individual project settings**

This is a boolean variable. It works in the same was as `combineAllLacsInOR` but with om readings.

The default is false.

## `combineAllLacsInApproved`

**This variable can be overridden in individual project settings**

This is a boolean variable. It works in the same was as `combineAllLacsInOR` but is applied in the approval process. If this change has already been applied in the move to order readings then this boolean, regardless of its settings, has no influence.

The default is false.

If you are using special category lac readings and you want these to appear in your final edition then this setting should not be used.

## `combineAllOmsInApproved`

**This variable can be overridden in individual project settings**

This is a boolean variable. It works in the same was as `combineAllLacsInApproved` but with om readings. If this change has already been applied in the move to order readings then this boolean, regardless of its settings, has no influence.

The default is false.

## `storeMultipleSupportLabelsAsParents`

**This variable can be overridden in individual project settings**

This is a boolean variable. If it is set to false (the default) then the label editing is completely free and the editor can type anything they want into the reading label box. If it is set to true then readings which could support multiple other readings can be recorded with links to the supported readings. The advantage of using this setting is that when the readings are reordered the labels supporting multiple other readings can be preserved and updated.

The default is false.

## `useZvForAllReadingsSupport`

**This variable can be overridden in individual project settings**

This is a boolean variable which only has an impact on the collation editor if *storeMultipleSupportLabelsAsParents* is set to true. If this boolean is also true then if all possible parent readings are selected from the list when editing a label in order readings, the label itself will be stored as 'zv' and the reading label in the collation editor will be ?.

The default is false.

## `numberEditionSubreadings``

**This variable can be overridden in individual project settings**

This is a boolean variable. If set to true subreadings that share a parent reading and  which have the same labels will also be given a number in order to differentiate them. For example if there are two subreadings for a reading labelled 'a' which share the same label suffix, for example 'o' and therefore all have the label 'ao' in the interface will be shown as 'ao1', 'ao2' etc. These number are added in the approval process and are only shown in the approved screen.

The default is false.

## `allowJoiningAcrossCollationUnits`

**This variable can be overridden in individual project settings**

This is a boolean variable. If set to true the user is given the option to add a flag to readings at the extremities of collation units to indicate that the reading should be joined to the corresponding reading in the previous or following unit. The collation editor only sets flags on the readings (join_backwards and join_forwards) which are set to true if the join has been made. All exporters must respect these flags in the exporting if they are used. There is no sanity checking on this, it requires the editor to make the joins accurately.

The default is false.

## `approvalSettings`

**This variable can be overridden in individual project settings**

The approval settings determine whether or not an approved version of a unit collation can be overwritten. The default setting is that it can be so this only needs to be added if you want to set it to false as default for all projects in the environment. Individual projects can override this explicitly in their own configurations.

The approvalSettings variable should be a JSON object with the following keys:

- **allow_approval_overwrite** *[boolean]* - false if overwriting is not allowed, true if it is.
- **no_overwrite_message** *[string]* - the string displayed to the user if an overwrite is requested but prevented by the settings, ideally it should give the user a suggestion as to how to proceed.

An example is below:

```js
approval_settings = {
  "allow_approval_overwrite": false,
  "no_overwrite_message": "This project already has an approved version of this verse. You cannot overwrite this.\nInstead you must recall the approved version using the administration interface."
};

```

## `apparatusServiceUrl`

This variable specifies the location of the apparatus export service on this platform. If the `showGetApparatusButton` is set to true (or the default is used) and `getApparatusForContext()` is not used, then this url must be provided as it is used in the default code used to generate and export the apparatus. It should provide the full path to the apparatus export services as described in the Python services section.

## `overlappedOptions`

**This variable can be overridden in individual project settings**

**There is a default in the core code which just gives the option to treat the reading as a main reading** (this option is always shown even if this variable is provided in services or project)

This variables controls the additional options that are available for the reading in the top line which it has been made into an overlapped reading. The default, and always present, option 'Make main reading' allows the words used in the overlapping reading to be used as evidence for the top line. The rearranging of these words is permitted out of transcription order as the order of words is often something which leads to overlapping readings being created. Any number of additional options can be added to the menu. This option cannot be overridden by settings and is always present.

The data for any additional options should be structured as an array of JSON objects. Each object represents an entry in the menu. The object should have the following keys (the final one is optional):

- **id** *[string]* - The string to be used as the id in the menu item (only used for HTML)
- **label** *[string]* - The string to display to the user in the menu to explain what this option does.
- **reading_flag** *[string]* - The string to be used in the data structure to describe the status of this reading (must not contain spaces).
- **reading_label** *[string]* - The label to use for the reading in the data structure - if the display label needs to be different it can be provided in the reading_label_display key.
- **reading_label_display** *[string]* - If the display of the label in the collation editor should be different from the reading_label value then it should be provided here.

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

## `contextInput`

**This variable can be overridden in individual project settings**

**There is a default in the core code**

This variable is used to control the way the collation unit is provided to and retrieved from the initial index page of
the collation editor. There is a default in the core code which will use the form at `CE_core/html_fragments/default_index_input.html`
and take the collation unit context from the value of the HTML element with the id 'context'.

The data should be structured as a JSON object with any of the following option keys as required:

- **form** *[string]* - The string representing the location of the html index file. This value will be appended to the value of `staticUrl`.
- **result_provider** *[function]* - The function to use to construct the collation context required from the form provided.
- **onload_function** *[function]* - The function to run when the form loads (for example, this can be used to populate menus from the database).

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

## `displaySettings`

**This variable can be overridden in individual project settings**

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
- **menu_pos** *[integer]* - An integer to describe where in the list of settings this one should appear on the settings menu (use `null` if this is to run behind the scenes and therefore not appear on the menu).
- **execution_pos** *[integer]* - An integer to determine the order in which settings functions are applied. This can be important in some cases as the settings can interact in different ways depending on the order in which they are applied.

For an example of the JavaScript configuration see the [default_settings.js](https://github.com/itsee-birmingham/standalone_collation_editor/blob/master/collation/core/static/CE_core/js/default_settings.js) file.

**Python requirements**

  The method is passed the JSON object for the token and must return the same token with the 'interface' key modified as appropriate for the setting being applied. For example if a setting is provided which hides markers of supplied text then these markers must be removed from the 'interface' key value before returning the token. If a setting for showing expanded form of the word exists then an expanded form of the text should have been stored in the JSON object and this can then be used to replace the interface version. More details of the JSON token structure can be found in the documentation for the standalone collation editor on github. This type of setting where the interface value is swapped for another in the JSON token data is an example of why the order of execution is important. When swapping the interface value it is important that any already applied rules are respected and therefore if an 'n' key is present in the token JSON it should be returned instead of any other value. An example of this is given in the 'expand_abbreviations' method example in the python code below.

All of the python methods required for the display settings must be supplied in a single class. That means if you want to add to the defaults with your own functions you should copy the default code into your own python class.

If a settings is required to run behind the scenes then `null` can be provided as the menu_pos value and it will not appear in the menu.

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

## `ruleClasses`

**This variable can be overridden in individual project settings**

**There is a default provided in default_settings.js**

This variable provides details of the rule classes/categories that will be available for regularising the data. The data should be structured as an array of JSON objects. The JSON object for each rule class should have the keys described below except any that are described as optional which are only required should that particular feature be needed.  

- **value** *[string]* - The name of the class/category to be used internally to identify it. This must be unique among your specified classes and should not contain spaces.
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

## `ruleConditions`

**This variable can be overridden in individual project settings**

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

If the method is a boolean type it will be provided with two pieces of data: the JSON for the token and the JSON for the rule. The method should return `True` if the given rule should be applied to the given token and `False` if it should not. For example if a rule has a condition that says it should only be applied to nomena sacra and this token does not have a flag to say that it is one then false would be returned.

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

## `exporterSettings`

**This variable can be overridden in individual project settings**

**There is a default provided in the core exporter factory code**

The exporter settings are used to control the export of data from the approved collation screen when the 'Get Apparatus' button is present. If the function is not required then the button can be hidden by setting the `showGetApparatusButton` variable to false. This export is simply intended to be a check point for editors and should be set to provide the best export format for this task. The project summary page or a similar page in the overall platform should provide options to export much larger units of text and more options can be provided to users in these export functions.

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
      "include_lemma_when_no_variants": false,
      "exclude_lemma_entry": false,
      "rule_classes": {},
      "witness_decorators": []
    }
}
```
