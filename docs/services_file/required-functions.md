---
id: required-functions
title: Required Service File Functions
---

## ```initialiseEditor()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| project | <code>JSON</code> | [optional] The JSON of project object |

This function is called as part of the initialisation sequence.

The only requirement for this function is that it set ```CL.managingEditor``` to either ```true``` or ```false``` depending on whether the current user is the managing editor of the current project.

If the index page is to be set up with JavaScript using the settings provided in the ```contextInput``` variable in the services file then the function should call ```CL.loadIndexPage()``` with the current project as the only argument. If the index page is to be provided in an alternative way they this function must show the index page and set any other platform requirements for its use.

If ```CL.loadIndexPage()``` is not used as part of the index page setup then this function also needs to add a button with the id *switch_project_button* and one with the id *project_summary* if those functions are required on the platform. In addition, if you want users to be able to change the collation algorithm settings then a button with the id *collation_settings* should also be added. Details of how to activate the buttons can be found in the relevant entries in the Optional Service File Functions section.

## ```getUserInfo()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| callback  | <code>function</code> | function to be called on the user data |

This function must get the current user details as a JSON object and call ```callback``` with the result. The user object itself must contain an **id** key. Any other data can be included in the object returned for use in your other service functions for example ```showLoginStatus``` might want to show the username.

## ```getUserInfoByIds()```

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

## ```applySettings()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| data | <code>object</code> | a list of tokens and the display settings options |
| callback  | <code>function</code> | function to be called on the returned data |

The function should pass the data object to a Python service and run the callback on the data returned.

The Python service required is described in the Python services section below.

## ```getCurrentEditingProject()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| callback  | <code>function</code> | function to be called on the project data |

This function must get the current project details as a JSON object and call ```callback``` with the result. The structure of the project JSON is discussed in the project configuration section.

## ```getUnitData()```

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

## ```doCollation()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | <code>string</code> | the reference for the unit being collated |
| options | <code>JSON</code> | a JSON object containing all of the data and settings needed for collation |
| resultCallback  | <code>function</code> | The function called when the collation is complete which displays the data in the collation editor |

This function should send the options JSON to a python service for collation, the url used for collation can be used to determine whether a project uses the current version of the regularisation system or the legacy version. The options JSON object will contain all the options required for the collation process on the server.

The python service required for the collation process is explained in the Python/Server functions section.

When the collation process has completed the JSON response from the Python collation system should be passed to resultCallback.

## ```saveCollation()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | <code>string</code> | The reference for the unit required. |
| collation | <code>JSON</code> | The collation object to be saved. |
| confirm_message | <code>string</code> | The message to display if the user is required to confirm the save. |
| overwrite_allowed | <code>boolean</code> | A boolean to indicate if the settings say a user can or cannot overwrite an existing saved version. |
| no_overwrite_message | <code>string</code> | The message to display if there is already a saved version and overwrite_allowed is false. |
| callback  | <code>function</code> | The function to be called when the save is complete. It should be called with ```true``` if the save was sucessful and ```false``` if it was not. |

This function needs to save the collation object in the database. It must be stored in such a way that the ```getSavedCollations()``` and ```loadSavedCollation()``` functions can retrieve it.

## ```getSavedCollations()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | <code>string</code> | The reference for the unit required. |
| userId | <code>string/int</code> | [optional] Id of user whose collations are required. |
| callback | <code>function</code> | The function to be called on the retrieved data. |

This should return all of the saved collations of the requested unit restricted by the current project and, if supplied, the provided user id.

In future versions this function may include an optional projectId parameter rather than using the current project.

## ```loadSavedCollation()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| id | <code>string/int</code> | Id of collation object required. |
| callback | <code>function</code> | The function to be called on the retrieved data. |

This should retrieve the collation with the given id and run the callback on the result, if no collation object is found the callback should be run with ```null```. The id here is the unique identifier used by the database to refer to this collation.
