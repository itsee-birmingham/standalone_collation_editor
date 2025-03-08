---
id: upgrade-1-0-x
title: Upgrading to 1.0.x from deprecated version
sidebar_label: Upgrading to 1.0.x
---

This code is not backwards compatible with early versions of the code archived at
[https://github.com/itsee-birmingham/collation_editor](https://github.com/itsee-birmingham/collation_editor)

Code changes are largely the conversion of function names from snake_case to camelCase in the services file. The
required and optional function names, arguments and required behaviours are detailed in the Services File section.
Please check all functions in the services file use these new details.

There are also some required changes to the data structures that the collation editor uses. Most of these changes are
deprecated so they will continue to work but support will be removed in future versions. Some changes are required now.

The changes required immediately and those that are deprecated are listed below. If you find any other
problems while upgrading please let me know by opening an issue in the GitHub repository.

## Changes to the initialisation

The inclusion of the editor and initialisation of the editor has changed. Please follow the initialisation instructions
above to correct this.

## New service functions required

- getCurrentEditingProject - described in the service file section

## New optional service functions

- getWitnessesFromInputForm - described in the service file section
- getApparatusForContext - described in the service file section
- localCollationFunction - described in the service file section

## Changes to service functions

- doCollation does not need context in the url provided for the collation server
- getUserInfoByIds needs to return 'id' in user model rather than '\_id'

## Changes to keys required/suggested in data models

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
