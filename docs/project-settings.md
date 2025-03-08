---
id: project-settings
title: Project Settings
---

## Additional Optional Project Settings

Many of the options available in the services file can also be added to individual project configurations to override the settings in the services file. If this is the case it will be indicated in the documentation for the services file. This section details optional settings not available at the services level.

### ```witnessDecorators```

The data should be structured as a list containing JSON objects. Each object should have at least two top level keys with one optional key:

- **label** *[string]* - The string/character used to decorate the witness siglum.
- **superscript** *[boolean]* optional - If set to true the decorator will be superscripted when displayed.
- **witnesses** *[array]* - A list of witness to be decorated (this should always be a subset of the witnesses specified for the project).
