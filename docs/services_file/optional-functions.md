---
id: optional-functions
title: Optional Services File Functions
sidebar_label: Services File Functions
---

In many cases this configuration can be set at different levels: in the services file, in which case they
apply to the entire installation; in the project configuration, in which case they apply only to that project. Project
settings will always be used over services file settings which will in turn override any default provided in the core code.
The documentation clearly states at which level the setting can be used and, if applicable, what the default behaviour is.

## ```getDebugSetting()```

This function should return a boolean to determine whether the system should run in debug mode. Running in debug mode can help identify problems with the data before it is sent to collation. it is a function rather than a boolean so it is possible for a user to set this variable themselves, for example in the url of the home page.

The default is false.

## ```showLoginStatus()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| callback | <code>function</code> |[optional] A function to be called when this function completes. |

This function can be used to display the currently logged in user. It is called when pages are displayed. It should get the current user and display the required details in the preferred way for the platform. There is a <div> element on each page that calls this function which has the id 'login_status' which should be used to display the user details. When this is done the function should run the callback if one was provided.

## ```getSavedStageIds()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | <code>string</code> | The reference for the unit required. |
| callback | <code>function</code> |The function to be called on the returned data. |

This function populates the links to saved collations in the footer of the page. This function must get the saved collations for the context belonging to this user and the approved collation from the project even if it does not belong to this user. The callback must be run with the saved objects from the four collation stages as parameters in order of the stages (regularised, set variants, order readings, approved). If there are no saved objects for any of the stages the parameter for the missing stages should be null.

## ```addExtraFooterFunctions()```

This is required if any extra footer buttons are specified in the services file variable ```extraFooterButtons```. It must attach onclick listeners to all of the buttons specified in the variable. This function must cover all buttons added in the services file and in any projects hosted on the system.

## ```getAdjoiningUnit()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| context | <code>string</code> | The unit reference for the current unit. |
| isPrevious | <code>boolean</code> | true if we are looking for the previous unit, false if we are looking for the next unit. |
| callback | <code>function</code> |The function to be called on the unit identifier string for the next or previous unit. |

This function is used to provide the data needed move through the work using the arrows at the beginning and end of the overtext for each collation unit. It should return either the next (if isPrevious is false) or previous unit based on the provided context. The callback should be run on the string that represents the context string for the next/previous unit. Context here and in the parameters refers to the string used to identify the collation unit. i.e. what the user would type into the index page to run a collation for that unit. If no unit is found the callback should be run with ```null```.

**NB** Prior to release 2.0.0 this function was named ```getAdjoiningVerse()```

## ```switchProject()```

If this function is present in the services file and ```CL.loadIndexPage()``` is called by the services as part of the ```initialiseEditor()``` function in the services then a *switch project* button will be added to the footer of the index page and this function will be attached as an onclick event. The function itself should redirect the user to a page that allows them to select a project from the projects they are authorised to access and then return the user to the page they were viewing when they clicked the button.

## ```viewProjectSummary()```

If this function is present in the services file and ```CL.loadIndexPage()``` is called by the services as part of the ```initialiseEditor()``` function in the services then a *view project summary* button will be added to the footer of the index page and this function will be attached as an onclick event. The function itself should redirect the user to a page that shows a summary of the work on the project. This might, for example, include how many of the collation units have been saved at each stage and how many have been approved.

## ```witnessSort()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| witnesses | <code>array</code> | The list of witness sigla to be sorted. |

**This function can be overridden in individual project settings**

**There is a default in the core code which just sorts the witnesses as strings**

This function is used to sort the witness sigla into the desired order. It is used for the hover overs on the readings and to sort menus that list sigla (such as the highlight witness menu). The function should sort the list in place rather than returning the list.

## ```getWitnessesFromInputForm()```

**There is a default in the core code which is explained below**

This function tells the collation editor how to extract the list of witnesses from the index page. If there is an element on the page with the id *preselected_witnesses* the default code will take that value and split on commas. If there is no such element the default will assume that there is a form with the id *collation_form* which has a series of checkboxes for the witnesses and it will use any values that are selected.

This default behaviour can be overridden by providing this function in the services. It cannot be overridden in the project settings so the function must work for all projects you host. The function must return an array containing the ids of the documents selected for collation.

## ```getApparatusForContext()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| callback | <code>function</code> |[optional] A function to be called when this function completes. |

**There is a default in the core code which is explained below**

This function can be used to override the default export function in the collation editor core code. If this function is not provided and the default code used then the ```apparatusServiceUrl``` variable must be set so that the default code can find the python service. The default function will probably be good enough for many use cases as it generates the file download based on the settings specified in the ```exporterSettings``` variable in the services file. It can be useful to override the function if a CSRF token is required by the platform to download the output or to control other aspects of the export.

*NB* If you do implement this function, the data exported should not be taken from the current ```CL.data``` value. Instead the unit should be retrieved from the database and the 'structure' value from the collation object should be used for the data. This is because, in some circumstances, the data stored in the JavaScript variable ```CL.data``` is not suitable for export if the 'show non-edition subreadings' button has been used. The version of the data in the database is always correct as the approved version cannot be saved other than in the approval process itself.

*NB* If you do implement this function there is a pre 2.0 version bug you need to be aware of should any of your user's projects make use of regularisation rules which have the 'keep_as_main_reading' option set to 'true'.
If this is the case, then the rule configurations must be provided in the 'options' key in the exporterSettings as the display settings for these rules are added in the exporter. The rules are available in the ```CL.ruleClasses``` variable in the JavaScript. In collations approved using the 2.0 release this is no longer necessary as the required presentation data is stored in the collation data structure during the approval process for verse 2.0.0 onwards. If you provide functions to export larger volumes of data you also need to be aware of this and ensure that the rule configurations are provided to the exporter in this case.

The function has an optional success callback argument which should be run when the function is complete.

## ```extractWordsForHeader()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| data | <code>list</code> | The list of token objects from the base text |

**This function can be overridden in individual project settings**

**There is a default in the core code which is explained below**

 This function is used to extract the words that appear in the collation editor at the very top of each unit above the numbers. It can be used to both change the visible text and to add css class values to be added to the html so that the presentation can be changed in the html.

 The function is given the token list of the base text. It should return a list of lists where the first item in the inner list is the string to display for the token and the second item in the inner list is a string representing the class values that should be added to the html. If multiple classes need to applied they can be put in a single string value separated by spaces. If not classes need to be added then the second item in the inner list should be an empty string. Any punctuation or other data which should be displayed on the screen should be combined into the display string for the token.

The default does not add any extra text or classes. It extracts the words from the data in the selected base text using the 'original' key if that is present or 't' if it is not. It also adds any punctuation to the words based on the 'pc_before' and 'pc_after' keys.

## ```prepareDisplayString()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| string | <code>string</code> | The text of the reading |

**This function should not be used unless there is a very good reason to do so**

**This function can be overridden in individual project settings**

**The default is to leave the provided string untouched**

This function is called every time a reading is displayed in the collation editor (not including the full text of the highlighted witness that appears at the bottom of the screen). It is given the string from the data structure and must return the string with any required changes.

There are probably very few, if any, good reasons to use this. It is present to support some very early implementations while the system was being developed.

## ```prepareNormalisedString()```

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| string | <code>string</code> | The display string of the reading |

**This function must be provided if prepareDisplayString() is used**

**This variable can be overridden in individual project settings**

**The default is to leave the provided string untouched**

This function is required if ```prepareDisplayString()``` is used. It must exactly reverse the changes made to the string by that function. It is used when making regularisation rules to ensure the stored strings are what is expected and can be transformed by ```prepareNormalisedString()``` correctly in the display.
