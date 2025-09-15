---
id: upgrade-3-0-x
title: Catena Dev branch changes (3.0.0 release candidate)
sidebar_label: Upgrading to 3.0.x
---

Most of the changes in 3.0.0 add functionality and most do not require any changes to existing implementations. If changes
are required to maintain existing behaviour this is noted below.

There are breaking changes in the exporter code but if the exporter has not been subclassed in your implementation then
these should not cause any problems. Any exporters inherting from the core export class will need updating.

## Additional optional sevice and project level settings

- Optional services and project setting *storeMultipleSupportLabelsAsParents* added which changes the behaviour of the label editing in order readings and stores support for multiple readings using the reading data itself so that it can be preserved and updated when readings are reordered. If this setting is used and set to true it will not have any impact on existing data but will offer the new label storage option for new data or existing data which is re-edited at the relevant stages.
- Optional services and project setting *useZvForAllReadingsSupport* added. This setting only works if *storeMultipleSupportLabelsAsParents* is also set to true. If this settings is true then when editing the label in order readings if all possible parent witnesses are selected as readings which could be supported by the current reading then the label used internally will be 'zv' and it will show in the collation editor with ?. This is not likely be of interest to most projects.
- Optional services and project setting *omCategories* added which allows the user to specificy a set of labels as strings to use as classifications for om readings.
- Optional services and project setting *allowJoiningAcrossCollationUnits* added which, if set to true, allows readings to be joined across collation unit boundaries. The collation editor itself only sets a flag on the reading to identify the join. It is up to all exporters to respect this in the export. There is no accuracy checking on the flags, they rely on the editor being consistent.
- Optional services and project setting *allowCommentsOnRegRules* added. This is a boolean which determines whether or not to show the comments box in the regularisation rule menu. This also involves a change in the default behaviour which will not show the comments box. To maintain existing beaviour this boolean should be set to true.
- Optional services and project setting *allowOutOfOrderWitnesses* added along with *witnessesAllowedToBeOutOfOrder*. These settings are explained in the service file documentation. The defaults maintain existing behaviour.
- Optional services and project setting *showSelectAllVariantsOption* added. This setting is explained in the service file documentation. The default maintains existing behaviour.
- Optional services and project setting *numberEditionSubreadings* added. This setting is explained in the service file documentation. The default maintains existing behaviour.

## Additional project only settings

- Optional project setting *witnessDecorators* added. This is not available at the services level as the data will be specific to each project. The structure is explained in the project settings section. If data is provided then all hands from that witness will have the label appended after them in the hover overs of the collation editor. This was introduced to provide an easy way to see a group of manuscripts when the grouping was not otherwise made obvious in the sigla. The specific example from the New Testament is the use of a ᴷ to make commentary manuscripts more easily identifiable. A basic application of the decorators has also been added to the exporter code.

## Interface changes

- There is a very small change to the way pre-stage checks are implemented. If no message is provided in the configuration of the pre-stagechecks then no alert will be displayed. The result of the check will still be followed so if a test fails the unit will not progress to the next stage. This was done so that confirm boxes can be used in the code of the check itself to issue warnings that can be overridden by the user, in these cases it should be the result of the confirmation which is passed back as the results of the checks.
- The message on a successful save has been changed from 'Save successful' to 'Last saved:' with a time stamp.

## Additions and changes to the regularisation options

There are some additional features in the regularisation screen and a small change to the way rules can be selected for deletion. There is no option to maintain existing behaviour for most of these as they are unobtrusive and users can just not to use them if they are not relevant. Thanks to Peter Robinson for these suggestions and the draft code to implement them.

- When regularising there is now an option to select multiple tokens from the same unit to regularise to the same word. To do this hold down the shift or alt key, click on all the words that should be selected and then drag one of them to the work you want to regularise them to.
- The way in which multiple rules can be selected for deletion has been changed to match the new function for selecting multiple rules for deletion, to select multiple rules you should now hold down the shift or alt key as they are clicked.
- There is an additional way to delete regularisation rules which have been applied individually to multiple witnesses. Right clicking on a single rule will bring up the deletion menu which now has an additional option *Delete rule for all witnesses* which will find all of the rules that have the same original form and regularised form and select all of those rules for deletion.
- There is also an optional setting on the service or project level which adds a button to the top line of each variant unit that selects all of the regularisable tokens in that unit so they can be regularised to the same token in one drag move. This option is explained in the options section above and in the service file documentation.

## Changes to the exporter

- The collation data is now simplified at the very start of the exporter process. Generally this involves removing keys that are not used but the overtext is also restructured as part of this process and therefore any functions which access the overtext such as ```get_lemma_text()``` will need to be updated to reflect the new, simpler structure. Instead of the tokens being accessesed via ```overtext[0]['tokens']``` they are now directly in ```overtext```.
- In exporter.py there is a breaking change in the ```get_text()```, ```make_reading()``` and ```get_label()``` function arguments. The argument 'type' which used to be the string 'subreading' or None is now a boolean called 'is_subreading'. All calls to this function in exporters which inherit from this will need to be changed accordingly.
- Exported XML apparatus uses the n attribute for the identifier of ```<ab>``` elements rather than xml:id. The value of the attribute remains unchanged.
- In exporter.py ```get_lemma_text()``` now takes start and end arguments as strings. This is important for dealing with joined units in inheriting exporters.
- In exporter.py ```get_text()``` when om and lac are returned their string value is always returned with the full stop eg. ```om.```
- In exporter.py there is a new function ```get_required_end()```. This is irrelevant in this particular exporter but is important in exporters which build on this one and which are required to make joins across collation unit boundaries. This function can be overwritten in inheriting exporters to allow the correct data for the end of the unit to be set in the XML.
- In exporter.py there is a small change to the way the ```overtext``` argument passed into ```get_app_units()``` is structured. it is now calculated in the ```get_overtext_data()``` function. The new structure puts the older overtext data in a dictionary as the value for the key 'current'. The change has been made to allow for readings to be joined over collation unit boundaries. The core code does not support joining over collation unit boundaries but exporters which inherit from exporter.py may want to use this new function. If this function is being overridden in inheriting exporters then the ```get_lemma_text()``` function must also be updated for the structure produced by ```get_overtext_data()```.
