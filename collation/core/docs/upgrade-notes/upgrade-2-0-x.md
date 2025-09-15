---
id: upgrade-2-0-x
title: Upgrading to 2.0.x from 1.1.x
sidebar_label: Upgrading to 2.0.x
---

## New features in this version

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

## Required changes to the services file

Some of these changes are required to keep things working. Most are only required in order to maintain existing
behaviour. Where a change is required only to preserve existing behaviour it is noted in the explanation.

### Changes to variables

- `lacUnitLabel` and `omUnitLabel` should be provided in the services file to maintain the existing behaviour which displays 'lac verse' and 'om verse' respectively. The defaults have changed to 'lac unit' and 'om unit' to remove biblical verse assumption. The services choices can also be overridden in individual project settings if required.
- The variable `collationAlgorithmSettings` has been introduced in this release which can be set in the services file and/or the project configurations. The previous defaults may not have been the best option for many projects but to maintain the previous behaviour the services file should set the `collationAlgorithmSettings` keys to 'auto', true, 2. The 'auto' setting for the algorithm means that the collation preprocessor will choose an algorithm based on the presence of gaps at the end of the data to be collated. The defaults are explained in the description of the setting above.
- In this version the seldom used 'collapse all' button in the footer of all stages of the collation editor has been removed by default. The code which performs the function is still present in the core code and the button can be returned by adding the variable `showCollapseAllUnitsButton` and setting the value to the boolean `true`. This should be done to maintain existing behaviour. This setting can also be used at the project level.
- Four new boolean variables have been introduced to determine whether lac and om readings should be combined at either the Order readings or approved stages. They are:
  - `combineAllLacsInOR`
  - `combineAllOmsInOR`
  - `combineAllLacsInApproved`
  - `combineAllOmsInApproved`

These variables can all be specified in the services file or in each project separately and the default for all four is false. To maintain existing behaviour of the editor the value of `combineAllLacsInOR` should be set to `true`.

- To enable the new feature that allows witnesses to be added and/or removed from saved collations set the `allowWitnessChangesInSavedCollations` variable to `true`. This can be set in either the services file or in the project configurations for the projects which need to use this feature.
- The undo stack length can now be altered in the services file. The default is in the code and is set at six. The variable `undoStackLength` can be used to increase this. A full version of the data structure is held in browser memory for each position in the stack. If you have  a lot of witnesses and/or longer units then setting this too high may cause problems.  Because of the possible memory issues this can only be set in services and cannot be changed in project settings.

### Changes to functions and new required functions

- changes to existing function `getVerseData()`
  - `getVerseData()` function should be renamed to `getUnitData()`.
  - The boolean argument 'private' in the third position should be removed. The third and final argument should now be the callback.
  - The return data for the function has changed (see description of service file above and details on special category lac readings). To maintain previous behaviour wrap the array returned in earlier versions in a dictionary as the value for the key *results*.
- `getAdjoiningVerse()` should be renamed to `getAdjoiningUnit`.
- new optional functions `prepareNormalisedString()` and `prepareDisplayString()`. These functions have been added to remove a hard coded action required from the early New Testament Greek implementation of the code. They are described fully in the optional services functions above. To maintain existing behaviour `prepareNormalisedString()` should replace an underdot (\&#803;) with an underscore and `prepareDisplayString()` the reverse. It is very unlikely that any projects will actually need this to be done unless unclear data is displayed with an underdot but stored in the database as an underscore.
- `applySettings()` function is required along with a supporting Python service. Both are fully documented above.
- If the 'get apparatus' button is shown (the default) and `getApparatusForContext()` is not provided in the services file then the new variable `apparatusServiceUrl` must be set in the services to the full url at which the python service for the apparatus export is running.
- If `getApparatusForContext()` is provided in the services file then the data exported should not be taken from the `CL.data` variable in the JavaScript. Instead the approved version of the unit should be retrieved from the database and the value of the *structure* key should be used as the export data. This is because the new button to show non-edition subreadings in the approved display changes the value of `CL.data` when it is used and means that the version of the data loaded into the interface is not always suitable for export. The version in the database will always be suitable as it cannot be saved except in the approval process itself.

### Optional changes

- A new `extractWordsForHeader()` function can be specified in either the services file or project settings. The default option maintains current behaviour so it is unlikely that this will be needed for any existing projects. It is used to change the way the text above the numbers appears in all stages of the collation editor. It can be useful to add css classes to these words if some of them need to be highlighted or to display other text which is present in the data but which is not collated. This was introduced for the MUYA project, the first case is used to identifier main text and commentary text the second is used to display the ritual direction text.
- The *set_rule_string* key of `localPythonFunctions` which was used in previous releases is no longer used in this release and can be deleted from the services file and the python files.
- The *prepare_t* key of `localPythonFunctions` is not required for version 2.x. However, it is still required if the legacy regularisation system is being used and any processing was done in the extraction of the token JSON in order to create the t value. It is now documented as part 
of the [legacy_regularisation repository](https://github.com/itsee-birmingham/legacy_regularisation).
- The new variable `collatexHost` can be used to specify the location of the collateX microservices if they do not use the default of `http://localhost:7369/collate`.
- A new setting `showGetApparatusButton` will remove the 'get apparatus' button from the approved page if set to false. The default is to show the button which was always the case in previous versions so no change is required to maintain existing behaviour.

## Changes required to project settings

- rules classes specified in project settings should use the JSON key **ruleClasses** not **regularisation_classes**. This bring them in line with the services equivalent. Both were supported for projects in earlier versions.

## Other changes to be aware of but that do not necessarily require actions

- In all stages of the editor the select box for highlighting a witness will say 'highlight witness' rather than 'select' as was the case in 1.x There is no way to change this as it is seen as a positive change but your users might need to be aware and any screen shots in documentation may need updating.
- Deleting a created rule before it had been applied by recollating used to delete the rule but then prevent the word from being regularised again until the unit had been recollated. This has now been fixed and if a rule is deleted before recollation another rule can be made for the same word straight away.
- The code for the overlay and spinner code has changed to simplify it. Any calls to `SPN.show_loading_overlay()` and/or `SPN.remove_loading_overlay()` in the services file should be changed to `spinner.showLoadingOverlay()` and `spinner.removeLoadingOverlay()`.

## Changes required to Python services

- The collation service requirements have been simplified a lot in this release. Instead of having to unpack all of the data received from the JavaScript the collation service can now just pass it on to the collation editor python code. If you need to make changes at this stage you can still do so but if that is not necessary then the code can be much simpler. The minimum required code is provided as an example in the description of the collation service above.
- An new service is required to apply settings and is described above in the Python/Server Services section under Settings Applier. It is called from the new JavaScript services function `applySettings()` (also documented above).

## Exporter changes which may need action in inherited classes

The following changes relate to the ExporterFactory class in the collation editor code.

Rather than being provided to the `export_data()` any settings required by the exporter are now set in the constructor. All of the settings are then saved on the instance and can be access from any functions without having to be passed in the function call. All exporters which are called via the ExporterFactory need to be updated to this new format. If the __init__ function of the core exporter is overwritten then it should either call the parent constructor or set all of the required options on the instance. The settings required for the exporter constructor should be provided to the ExporterFactory as an options dictionary. They are passed to the constructor functions as keyword arguments. The previous second and third positional arguments in the `export_data()` function (*format* and *ignore_basetext*) should now be part of the settings dictionary provided to the exporter constructor. This means that `export_data()` now contains a single positional argument which is the data to be exported. Any class inheriting from Exporter and implementing the `export_data()` function must change the expected arguments for the function accordingly.

The default behaviour has changed for the list of overlap status categories listed for top line readings which are ignored in the output. If you are using the Exporter class directly or inheriting from it a small change is required to maintain existing behaviour. The options dictionary used by the constructor should have an entry with the key *overlap_status_to_ignore* and the value ['overlapped', 'deleted']. This can be done in the `exporterSettings` variable in the Services file or, if it is always required, in the python code in the export service which instantiates the Exporter class.

The functions in the exporter code have been made smaller where possible to allow easier customisation. In most cases this will not cause problems for any existing code. The important changes are listed below with guidance on how to maintain existing behaviour if applicable.

Only one of the changes, the addition of the `get_lemma_text()` function, is likely to change the behaviour of existing code. To maintain previous behaviour this should be overridden in any classes inheriting from Exporter. The code in 1.x retrieved the lemma text from the apparatus from the a reading which is always the same as the overtext in the collation editor but always uses the t form of the word and does not follow the convention of the collation editor for using the data from the overtext in the very top line of each stage display. In addition not using the overtext values here limits reuse of the exporters in larger systems where a different editorial text might be selected for publication. To maintain existing behaviour any exporter classes inheriting from Exporter should include this function which still extracts from the overtext structure but uses the t value as the key which will be the same as that used in the a reading.

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

The `make_reading()` function of Exporter now takes an option argument 'subtype'. Any classes which inherit from Exporter and implement this function should add this optional argument. It is used in the core Exporter to add the subreading classification/s in the 'cause' attribute of the rdg element for any readings with the reading is a subreading. XML exports will all change compared to those exported from 1.x but only in the addition of this attribute which should not cause any problems.

## Changelog 2.x release

### Release 2.0.1

- Bug fixed in the function which combines all lac and/or all om readings in the code to approve a unit. This but was caused by the introduction of the the settings applier as a service which added an asynchronous call into a sequence of actions which had to be run in a specific order. As the settings are never relevant to lac and om readings the settings applier is now skipped when combining lac and/or om readings.
- The default behaviour of `getApparatusForContext()` has been changed to use the approved version of the data which has been saved rather than the version currently loaded into the interface. This is because the added ability to show the non-edition subreadings on the approved screen changes the data structure in the interface in a way that makes it unsuitable for export if certain conditions exist in the data. There is no problems with always using the saved version as there is no way to save approved data except in the approval process itself. If the services file provides `getApparatusForContext()` this should also be amended to use the saved version of the data.
