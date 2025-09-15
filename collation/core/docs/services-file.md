---
id: services-file
title: Services File
---

The services file is a key element of the collation editor setup. there are several variables and functions which
must be defined in this file in order to work. In addition to this the services file is also one of the places where
the behaviour collation editor can be configured to meet the preferences of your users. The required items are covered
on this page, the optional variables and functions are covered in the configuration section.

On loading the services file must call `CL.setServiceProvider()` passing a reference to the services file object as the argument as in this example:

```js
  var my_services = (function() {

    //function called on document ready
    $(function () {
      CL.setServiceProvider(my_services);
    });

    // remaining service variables and functions go here

  } () );
```

## Required Variables

There is currently only one required service file variable, this must be set in order for the collation editor to function.

### `supportedRuleScopes`

The collation editor supports four different rules scopes.

- once - this place in this specified witness
- verse - everywhere in every witness for this verse/collation unit
- manuscript - everywhere in this specified witness
- always - everywhere in every witness

You can decide which of these you want your system to support and must ensure that the selected scopes can be stored
and retrieved through the services file.

This variable is a JSON object in which the supported rule scopes as a string are each a key, the string must match
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
in future releases to be more generic (verse and manuscript in particular).

## Required Functions

These functions are all required in order for the collation editor to function.

### `initialiseEditor()`

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| project | JSON | [optional] The JSON of project object |

This function is called as part of the initialisation sequence.

The only requirement for this function is that it set `CL.managingEditor` to either `true` or `false` depending on whether the current user is the managing editor of the current project.

If the index page is to be set up with JavaScript using the optional settings provided in the `contextInput` variable in the services file then the function should call `CL.loadIndexPage()` with the current project as the only argument. If the index page is to be provided in an alternative way they this function must show the index page and set any other platform requirements for its use.

If `CL.loadIndexPage()` is not used as part of the index page setup then this function also needs to add a button with the id *switch_project_button* and one with the id *project_summary* if those functions are required on the platform. In addition, if you want users to be able to change the collation algorithm settings then a button with the id *collation_settings* should also be added. Details of how to activate the buttons can be found in the relevant entries in the Optional Functions page in the configuration section.

### `getUserInfo()`

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| callback  | function | function to be called on the user data |

This function must get the current user details as a JSON object and call `callback` with the result. The user object itself must contain an **id** key. Any other data can be included in the object returned for use in your other service functions for example `showLoginStatus` might want to show the username.

### `getUserInfoByIds()`

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| ids | array | list of user ids |
| callback  | function | function to be called on the user data |

This function must resolve a list of user ids into basic user objects and run the callback on the data. The user data should be a JSON object with each provided id as the key to another JSON object which must at a minimum contain an **id** key which should match the top level key and ideally a **name** key to provide the name of the user.

Given the ids `["JS", "RS"]` the JSON object should be as follows (where name keys are technically optional):

```json
{
  "JS": {"id": "JS", "name": "Jane Smith"},
  "RS": {"id": "RS", "name": "Rob Smith"}
}
```

### `applySettings()`

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| data | object | a list of tokens and the display settings options |
| callback  | function | function to be called on the returned data |

The function should pass the data object to a Python service and run the callback on the data returned.

The Python service required is described in the [Python services](python-services.md) section.

### `getCurrentEditingProject()`

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| callback  | function | function to be called on the project data |

This function must get the current project details as a JSON object and call `callback` with the result. The structure of the project JSON is discussed in the project configuration section.

### `getUnitData()`

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | string | the reference for the unit required |
| documentIds | array | the list of ids for the documents required |
| callback  | function | function to be called on the data |

This function must find all of the JSON data for this context in each of the documents requested. The function should return a dictionary which in its minimal form needs to have a single key **results** which should contain an array of JSON objects. The JSON structure provided for each unit in each document should match the unit structure as described in the data structures section. Pay particular attention to the treatment of lacunose and omitted units which need to be handled in different ways depending on the result required in the collation editor.

- Any documents that are lacunose for this unit and do not need a special label should be omitted from the data set entirely.
- Special category lac readings for which the special category can be determined from the input format of the transcription, such as TEI XML, can be sent in the results data using the following structure outlined in the data structures section.
- If any special lac labels are required for data that cannot be determined from the input format then a second key can be added to the main data structure with the name **special_categories**. This should contain an array of JSON objects where each object is structured as follows:
  - **label** The string to use as the label in the interface for this special category of lac.
  - **witnesses** An array of sigla for the witnesses that need to be given this label.

  The witnesses listed in the special_categories array structure should not appear elsewhere in the data returned.

When all of the data has been retrieved the callback should be run on the resulting object.

**NB:** Until version 2.0.0 this function was called `getVerseData()`, had a boolean `private` as the third argument before the callback and returned a list (which is now the list in the **results** key).

### `doCollation()`

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | string | the reference for the unit being collated |
| options | JSON | a JSON object containing all of the data and settings needed for collation |
| resultCallback  | function | The function called when the collation is complete which displays the data in the collation editor |

This function should send the options JSON to a python service for collation, the url used for collation can be used to determine whether a project uses the current version of the regularisation system or the legacy version. The options JSON object will contain all the options required for the collation process on the server.

The python service required for the collation process is explained in the Python/Server functions section.

When the collation process has completed the JSON response from the Python collation system should be passed to resultCallback.

### `saveCollation()`

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | string | The reference for the unit required. |
| collation | JSON | The collation object to be saved. |
| confirmMessage | string | The message to display if the user is required to confirm the save. |
| overwriteAllowed | boolean | A boolean to indicate if the settings say a user can or cannot overwrite an existing saved version. |
| noOverwriteMessage | string | The message to display if there is already a saved version and overwriteAllowed is false. |
| callback  | function | The function to be called when the save is complete. It should be called with `true` if the save was sucessful and `false` if it was not. |

This function needs to save the collation object in the database repsecting the settings provided. It must be stored in such a way that the `getSavedCollations()` and `loadSavedCollation()` functions can retrieve it.

### `getSavedCollations()`

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | string | The reference for the unit required. |
| userId | string/int | [optional] Id of user whose collations are required. |
| callback | function | The function to be called on the retrieved data. |

This should return all of the saved collations of the requested unit restricted by the current project and, if supplied, the provided user id.

In future versions this function may include an optional projectId parameter rather than using the current project.

### `loadSavedCollation()`

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| id | string/int | Id of collation object required. |
| callback | function | The function to be called on the retrieved data. |

This should retrieve the collation with the given id and run the callback on the result, if no collation object is found the callback should be run with `null`. The id here is the unique identifier used by the database to refer to this collation.

### `getSiglumMap()`

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| idList | array | An array of strings, each string the id to a document in the collation. |
| callback | function | The function to be called with the created siglum map as the argument. |

This function must take the list of ids provided, find its corresponding sigla and return a JSON object in which each sigla is the key to the document id. This function used in the collation editor to provide the mapping details for documents which are lacunose in the entire collation unit. For all other documents this mapping can be extracted from the data returned for collation but in lacunose units no data is returned so this additional function is used. One the siglum map has been created the callback should be run using this as the argument. If the idList is empty then the callback should be run with an empty JSON object.

### `updateRuleset()`

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| forDeletion | array | An array of JSON objects each representing containing the id and scope of a rule to be deleted. |
| forGlobalExceptions | array | An array of JSON objects each contining the id of a global rule which needs an exception adding. |
| forAddition | array | An array of JSON objects each representing a rule to be added to the database. |
| unitId | string | The identifier for the unit being collated. |
| callback | function | The function to be called after saving the data. |

This function must perform the appropriate action on each item in the three arrays of rules provided and then run the supplied callback. Each rule in the first list must be removed from the database, `id` and `scope` are provided to ensure the correct rule can be found. Those in the second list must have the `unitId` value added to the list of exceptions stored in the rule, only `id`is provided in this case as all of the rules will be global rules. The file array of rules contains the full rule JSON and each of these rules must be stored in the database. Any of the three arrays could be empty arrays. Once the data as all been handled appropriately the provided callback must be run.

### `updateRules()`

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| rules | array | An array of JSON objects each representing an updated rule. |
| unitId | string | The identifier for the unit being collated. |
| callback | function | The function to be called after saving the data. |

This function needs to store all of the rules provided in the database. This function is only called when exceptions are being removed from rules so all of the rules will already exist and should be overwritten by the new data. If concurrency control is not something that needs to be considered in your system then unitId can be ignored as the unit reference has already been removed from the rules by the collation editor. If you do need to consider concurrency control then the ids from the rule array can be used to retrieve each of the rules in turn from the database, the unitId can then be removed from the list of exceptions before the rule is saved.

### `getRules()`

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| unitId | string | The identifier for the unit being collated. |
| callback | function | The function to be called on the retrieved data. |

This function should retrieve all of the rules which are applicable to the unit identified by the provided unitId. Depending on your system you may need to filter the rules based of project and user as well as the provided verse. If this is the case then the service function `getUserInfo()` can be used to get the current user and `CL.project.id` stores the id of the current project (or the poject can be established by calling `getCurrentEditingProject()`). The provided callback should then be called with the list of rules as the argument. The rules should be returned as an array of JSON objects and the JSON objects should have the same structure as that provided to `updateRules()`.

### `getRulesByIds()`

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| ids | array | The ids of the rules required. |
| callback | function | The function to be called on the retrieved data. |

This function should retrieve all of the rules which match the rules ids provided in the ids array and
run the provided callback on the results. The rules should be returned as an array of JSON objects and the JSON objects
should have the same structure as that provided to `updateRules()`. User and project filters should not be required as these rules will be a subset of those returned by `getRules()`.

### `getRuleExceptions()`

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| unitId | string | The identifier for the unit being collated. |
| callback | function | The function to be called on the retrieved data. |

This function should retrieve all of the global rules for this user/project, those which have the `scope` set to *always*, and also have the provided unitId in the list of exceptions. The rules should be returned as an array of JSON items as with `getRules()`, the provided callback should be run with the result as the argument. If your system does not use global rules then the callback can just be run with an empty array.
