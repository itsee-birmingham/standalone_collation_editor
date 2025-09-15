---
id: text-repo-structure
title: The Text Repository
---

Collating your own data requires the data to be prepared in the correct JSON format and that JSON to be stored in the text repository. It also requires a [project](project-config.md) to be configured.

Each of your witnesses will need to be broken down into the units you want to collate. While collateX should be able to collate large chunks of data the collation editor is best suited to texts that can be broken down into shorter units. It was written for editing the New Testament so verse sized chunks are ideal, other projects have used poetic lines, sentences or other syntactic units.

## Structuring the Text Repository

The text repostory is located at `collation/data/textrepo`.

In this location there is directory called `json`.

In this directory each document you want to collate needs its own directory. The directory name needs to be a unique reference to that document and should not use spaces in the name. The data for each document is stored in the relevant directory.

### The Document/Transcription Metadata

Each document directory must contain a file called `metadata.json`.

This file must contain a JSON object with the following two keys:

- **id** *[string]* - must match the name of the directory for the document
- **siglum** *[string]* - the label to be used for this document in the collation editor interface and any generated apparatus

The values can be the same if your data allows this but both keys should still be provided. You can add other keys if they are useful to you for other purposes but the collation editor only requires, and will only use, these two.

Example:

```json
{
  "id" : "NT_GRC_01_John",
  "siglum" : "01"
}
```

### Collation Units

Each unit for collation also needs its own file in the relevant document folders.

The work you are editing needs to be divided into collatable chunks and each of these chunks or units must be given a label so you can refer to them. In the directory for each document you need a JSON file for each of the units that is extant in that particular document (lacunose and omitted units are discussed later). The file name should be the label for the unit and the file extension should be `.json`.

#### Lacunose and Omitted Units

The collation editor can make a distinction between lacunose sections of text and omitted sections of text. Lacunose is used for text which is absent because it is missing due to physical damage to the manuscript, or missing pages. Omitted is used for text which is omitted from the text even though the material that it would have ben written on is present.

If a document is Lacunose for an entire collation unit then you should not create a JSON file for the unit in that document directory. The collation editor will interpret this as a lacunose passage in this document.

If a document omits an entire collation unit then the JSON file should be created for the unit unit but there should be no witnesses key in the JSON object. The collation editor will interpret the lack of the witnesses key as an omission.
