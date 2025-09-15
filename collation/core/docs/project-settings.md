---
id: project-settings
title: Additional Optional Project Settings
sidebar_label: Project Settings
---

Many of the options available in the services file can also be added to individual project configurations to override the settings in the services file. If this is the case it will be indicated in the documentation for the services file and they will be listed in the [Additional Options](#additional-options) section below.

Project configuration files should not contain JavaScript functions directly but should include references to
functions available in the static files on the server and imported using the `localJavaScript` variable.

## `witnessDecorators`

If this setting is provided then all hands from that witness will have the label appended after them in the hover overs of the collation editor. This was introduced to provide an easy way to see a group of manuscripts when the grouping was not otherwise made obvious in the sigla. The specific example from the New Testament is the use of a ᴷ to make commentary manuscripts more easily identifiable. A basic application of the decorators is provided in the exporter code which appends the decorator after the full sigla including the hand details.

The data should be structured as a list containing JSON objects. Each object should have two top level keys:

- **label** *[string]* - The string/character used to decorate the witness siglum.
- **witnesses** *[array]* - A list of witness to be decorated (this should always be a subset of the witnesses specified for the project).

## Additional Options

These options are can be configured at both the service level and the project level. If they are configured at both levels
then the project level settings are used.

### Variables

- [`allowWitnessChangesInSavedCollations`](services_file/optional-variables.html#allowwitnesschangesinsavedcollations)
- [`localCollationFunction`](services_file/optional-variables.html#localcollationfunction)
- [`collationAlgorithmSettings`](services_file/optional-variables.html#collationalgorithmsettings)
- [`lacUnitLabel`](services_file/optional-variables.html#lacunitlabel)
- [`omUnitLabel`](services_file/optional-variables.html#omunitlabel)
- [`omCategories`](services_file/optional-variables.html#omcategories)
- [`allowCommentsOnRegRules`](services_file/optional-variables.html#allowcommentsonregrules)
- [`showCollapseAllUnitsButton`](services_file/optional-variables.html#showcollapseallunitsbutton)
- [`showGetApparatusButton`](services_file/optional-variables.html#showgetapparatusbutton)
- [`extraFooterButtons`](services_file/optional-variables.html#extrafooterbuttons)
- [`preStageChecks`](services_file/optional-variables.html#prestagechecks)
- [`allowOutOfOrderWitnesses`](services_file/optional-variables.html#allowoutoforderwitnesses)
- [`witnessesAllowedToBeOutOfOrder`](services_file/optional-variables.html#witnessesallowedtobeoutoforder)
- [`combineAllLacsInOR`](services_file/optional-variables.html#combinealllacsinor)
- [`combineAllOmsInOR`](services_file/optional-variables.html#combineallomsinor)
- [`combineAllLacsInApproved`](services_file/optional-variables.html#combinealllacsinapproved)
- [`combineAllOmsInApproved`](services_file/optional-variables.html#combineallomsinapproved)
- [`storeMultipleSupportLabelsAsParents`](services_file/optional-variables.html#storemultiplesupportlabelsasparents)
- [`useZvForAllReadingsSupport`](services_file/optional-variables.html#usezvforallreadingssupport)
- [`allowJoiningAcrossCollationUnits`](services_file/optional-variables.html#allowjoiningacrosscollationunits)
- [`approvalSettings`](services_file/optional-variables.html#approvalsettings)
- [`overlappedOptions`](services_file/optional-variables.html#overlappedoptions)
- [`contextInput`](services_file/optional-variables.html#contextinput)
- [`displaySettings`](services_file/optional-variables.html#displaysettings)
- [`ruleClasses`](services_file/optional-variables.html#ruleclasses)
- [`ruleConditions`](services_file/optional-variables.html#ruleconditions)
- [`exporterSettings`](services_file/optional-variables.html#exportersettings)

### Functions

- [`witnessSort()`](services_file/optional-functions.html#witnesssort)
- [`extractWordsForHeader()`](services_file/optional-functions.html#extractwordsforheader)
- [`prepareDisplayString()`](services_file/optional-functions.html#preparedisplaystring)
- [`prepareNormalisedString()`](services_file/optional-functions.html#preparenormalisedstring)
