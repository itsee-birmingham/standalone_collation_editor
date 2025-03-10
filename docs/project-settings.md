---
id: project-settings
title: Additional Optional Project Settings
sidebar_label: Project Settings
---

Many of the options available in the services file can also be added to individual project configurations to override the settings in the services file. If this is the case it will be indicated in the documentation for the services file and they will be listed in the [Additional Options](#additional-options) section below.

## ```witnessDecorators```

If this setting is provided then all hands from that witness will have the label appended after them in the hover overs of the collation editor. This was introduced to provide an easy way to see a group of manuscripts when the grouping was not otherwise made obvious in the sigla. The specific example from the New Testament is the use of a ᴷ to make commentary manuscripts more easily identifiable. A basic application of the decorators is provided in the exporter code which appends the decorator after the full sigla including the hand details.

The data should be structured as a list containing JSON objects. Each object should have two top level keys:

- **label** *[string]* - The string/character used to decorate the witness siglum.
- **witnesses** *[array]* - A list of witness to be decorated (this should always be a subset of the witnesses specified for the project).

## Additional Options

These options are can be configured at both the service level and the project level. If they are configured at both levels
then the project level settings are used.

### Variables


### Functions

[```witnessSort()```](services_file/optiona-functions.html#witnessSort)


