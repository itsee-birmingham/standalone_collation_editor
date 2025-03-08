---
id: index
title: Introduction
---

## Introduction

This code is the core of the collation editor. The code in this repository is not designed to run as it is. It needs to
be embedded into a larger platform with a database or similar storage. The connections are made with a services file
written in JavaScript. Further configuration of settings and other options can also be provided if needed. Data input
is all in JSON.

### Terminology

For the purposes of this documentation the Documents/Works/Texts model will be used.[^1]

- **Document** - The physical artefact on which the text of a work is preserved
- **Work** - The work which is distilled from the texts that exist of it
- **Text** - The version or versions of a work preserved in document

### Configuration

The behaviour of the collation editor can be configured at both the service level (per installation) and the project level.
Project configurations will override the service level configurations which will in turn override any default configurations provided.
The configurations available at the services level are documented in the Services File section. If a setting can also be used at the
project level it is mentioned in the services file documentation. Settings only available at project level are documented in the
project settings section.

### Acknowledgements

The software was created by Catherine Smith at the Institute for Textual Scholarship and Electronic Editing (ITSEE) in
the University of Birmingham. The restructuring required for the 1.0 release was completed by Catherine Smith and Troy
A. Griffitts. The software was developed for and supported by the following research projects:

- The Workspace for Collaborative Editing (AHRC/DFG collaborative project 2010-2013)
- COMPAUL (funded by the European Union 7th Framework Programme under grant agreement 283302, 2011-2016)
- MUYA (funded by the European Union Horizon 2020 Research and Innovation Programme under grant agreement 694612, 2016-2022)
- CATENA (funded by the European Union Horizon 2020 Research and Innovation Programme under grant agreement 770816, 2018-2023)

The collation editor makes use of several third party libraries written and made available by other developers. Details
of sources and licenses are available in the headers of the relevant JavaScript files. The
[redips drag and drop library](https://github.com/dbunic/REDIPS_drag) warrants special mention as it is used for all of
the drag and drop interaction.

### Referencing

To cite the collation editor core code please use the doi:
[![DOI](https://zenodo.org/badge/142011800.svg)](https://zenodo.org/badge/latestdoi/142011800)

[^1]: See David C. Parker, *Textual Scholarship and the making of the New Testament* Oxford: OUP (2011), pp. 10-14,29, Peter M. W. Robinson, 'The Concept of the Work in the Digital Age', *Ecdotica* 1/2013, pp. 13-42 and Peter M. W. Robinson, An approach to complex texts in multiple documents, *Digital Scholarship in the Humanities*, Volume 37, Issue 4, December 2022, Pages 1179–1196
