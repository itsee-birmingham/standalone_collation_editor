---
id: index
title: Introduction
---

This code is the core of the collation editor. The collation editor is a GUI wrapper around [collateX](https://collatex.net).
The code in this repository is not designed to run as it is. It needs to be embedded into a larger platform with a
database or similar storage. The connections to the platform are made with a services file
written in JavaScript. Some minimal Python services are also required, basic code examples of which are provided in the
documentation. CollateX is not provided in the repository and must be installed separately. By default the Java web
services are used but the system can be configured to use the Python version of collateX instead.

If you are just looking to try out the collation editor or want to use it on a single machine rather than on a server, then
please consider the [Standalone Collation Editor](https://github.com/itsee-birmingham/standalone_collation_editor) as an
alternative. The standalone collation editor requires Python and a Java runtime environment but otherwise is packaged with
everything needed to run the code and includes some example data.

If you would like to see the collation editor in action Professor Hugh Houghton has made a video of it being used
to edit a verse of Romans for the Editio Critica Maior. It is available on the [IGNTP YouTube Channel](https://www.youtube.com/watch?v=uhZrNm6Nmes).
The collation editor section starts around [3:25](https://youtu.be/uhZrNm6Nmes?t=204). The bug seen at 31:10 has been fixed in v3.0.0.

## Documentation Overview

This documentation covers the setup and configuration of the collation editor as part of a larger system. It also
provides information about the data expected as input.

As the collation editor is a web application it is not really installed in the traditional sense. Instead all of the
necessary dependecies, html, JavaScript and supporting services are covered in the Setup section. This includes the variables and
functions which must be provided in the JavaScript services file to link the collation editor to your platform and database.
Additional optional configuration settings are covered in the configuration section. The behaviour of the collation
editor can be configured at both the service level (per installation) and the project level. Project configurations will
override the service level configurations which will in turn override any default configurations provided.

The collation editor requires the data to be provided in JSON and details of what to provide and how it should be
provided can be found in the Input Data section.

For the purposes of this documentation the Documents/Works/Texts model will be used.[^1]

- **Document** - The physical artefact on which the text of a work is preserved
- **Work** - The work which is distilled from the texts that exist of it
- **Text** - The version or versions of a work preserved in document

## Upgrading

If you are upgrading from an earlier version of the collation editor please follow the guidance in the Upgrading Versions section of the documentation.
It is recommended that you upgrade one release version at a time and ensure that each works before upgrading to the next.
All changes in each version should be listed in the documentation with an indication of whether this will require mandatory
changes in any of the supporting code or whether changes are only required to retain existing behaviour. New features
and configuration options will also be listed in the Upgrade section but for fuller documentation you will also need to
see the appropriate configuration documentation. The documentation should be linked from the upgrade section. If this
is not the case then you can easily search the full documentation using the search option in the header.

## Acknowledgements

The software was created by Catherine Smith at the Institute for Textual Scholarship and Electronic Editing (ITSEE) in
the University of Birmingham. The restructuring required for the 1.0 release was completed by Catherine Smith and Troy
A. Griffitts. The software is currently developed by Catherine Smith now a member of the Research Software Group, part
of Advanced Research Computing at the University of Birmingham.

The software was developed for and supported by the following research projects:

- The Workspace for Collaborative Editing (an AHRC/DFG collaborative project 2010-2013)
- COMPAUL (funded by the European Union 7th Framework Programme under grant agreement 283302, 2011-2016)
- MUYA (funded by the European Union Horizon 2020 Research and Innovation Programme under grant agreement 694612, 2016-2022)
- CATENA (funded by the European Union Horizon 2020 Research and Innovation Programme under grant agreement 770816, 2018-2023)
- GALaCSy (an AHRC/DFG collaborative project 2022-2025)
- 1Cor (an FWO Odysseus Type I Project under grant agreement G0E9821N, 2022-2027)

The collation editor makes use of several third party libraries written and made available by other developers. Details
of sources and licenses are available in the headers of the relevant JavaScript files. The
[redips drag and drop library](https://github.com/dbunic/REDIPS_drag) warrants special mention as it is used for all of
the drag and drop interaction.

## Referencing

To cite the collation editor core code please use the doi:
[![DOI](https://zenodo.org/badge/142011800.svg)](https://zenodo.org/badge/latestdoi/142011800)

[^1]: See David C. Parker, *Textual Scholarship and the making of the New Testament* Oxford: OUP (2011), pp. 10-14,29, Peter M. W. Robinson, 'The Concept of the Work in the Digital Age', *Ecdotica* 1/2013, pp. 13-42 and Peter M. W. Robinson, An approach to complex texts in multiple documents, *Digital Scholarship in the Humanities*, Volume 37, Issue 4, December 2022, Pages 1179–1196
