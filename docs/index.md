---
id: index
title: Introduction
---

This is a standalone version of the collation editor. It works with the local file system on your computer. A small example of a single Greek verse is included as a sample file.

The collation editor is a GUI wrapper around [collateX](https://collatex.net/). A version of that software is included with this editor.

If you want to use the collation editor on a server with multiple users and projects, then please consider [Collation Editor Core](https://github.com/itsee-birmingham/collation_editor_core) as an alternative.

## Terminology

For the purposes of this documentation the Documents/Works/Texts model will be used.[^1]

- **Document** - The physical artefact on which the text of a work is preserved
- **Work** - The work which is distilled from the texts that exist of it
- **Text** - The version or versions of a work preserved in document

## Configuration

The behaviour of the collation editor can be configured at both the service level (per installation) and the project level.
Project configurations will override the service level configurations which will in turn override any default configurations provided.
The configurations available at the services level are documented in the Services File section. If a setting can also be used at the
project level it is mentioned in the services file documentation. Settings only available at project level are documented in the
project settings section. 

Not all configuration options from the core code are available in the standalone version, for example the file based system
offered in the standalone collation editor only supports two scopes (once and always) due to the storage and retrieval limitations.

## Acknowledgements

The software was created by Catherine Smith at the Institute for Textual Scholarship and Electronic Editing (ITSEE) in
the University of Birmingham. The restructuring required for the 1.0 release was completed by Catherine Smith and Troy
A. Griffitts. The software was developed for and supported by the following research projects:

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

To cite the standalone collation editor please use the DOI: [![DOI](https://zenodo.org/badge/142014378.svg)](https://zenodo.org/badge/latestdoi/142014378)

[^1]: See David C. Parker, *Textual Scholarship and the making of the New Testament* Oxford: OUP (2011), pp. 10-14,29, Peter M. W. Robinson, 'The Concept of the Work in the Digital Age', *Ecdotica* 1/2013, pp. 13-42 and Peter M. W. Robinson, An approach to complex texts in multiple documents, *Digital Scholarship in the Humanities*, Volume 37, Issue 4, December 2022, Pages 1179–1196
