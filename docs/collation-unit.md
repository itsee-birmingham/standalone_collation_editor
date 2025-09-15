---
id: collation-unit
title: Collation Unit Structure
sidebar_label: Collation Unit
---

The data structure for each collation unit should be a JSON object with the following keys:

- **transcription** *[string/integer]* An identifier for the transcription represented by this object.
- **transcription_identifier** *[string]* [optional] If the value of the **transcription** key is not the same as the value used in the index form to request the transcriptions then that value should be provided here.
- **siglum** *[string]* The siglum for the manuscript represented by this object.
- **duplicate_position** *[integer]* [optional] The position of the unit in relation to other instances of this same unit if this unit appears multiple.
- **witnesses** *[array]* An array of witness object, an empty array or `null` depending on the unit, this and the data structure expected is explained below.

Other keys can be included if they are needed for other functions in the platform.

For transcriptions which have extant text in this unit, the witness array should contain an entry for each hand present in the unit. When dealing with corrected text the collation editor treats each hand as a completely separate witness to the text. For this reason it is advisable to provide a full representation of the corrector reading and not just the corrected words. If you do not do this, then the shared words will appear as *om.* in the corrector hand. Each hand should be represented by a JSON object with two keys.

- **id** *[string]* The sigla used to refer to this hand in the collation editor.
- **tokens** *[array]* The array of JSON objects each of which represents a single word in this reading.

Each token object must include the following keys

- **index** *[string]* - the collation editor requires each reading in each witness to be numbered with sequential even numbers starting at 2. Data format though should be a string.
- **reading** *[string]* - this should be the same as the id for this reading.
- **t** *[string]* - a string representation of the word which will be sent to collateX. This could be normalised in some way such as always being lowercase. **NB:** this must not be an empty string or collateX will fail. If the collation editor is running in debug mode all t values will be checked before being sent to collateX and an error will be raised if any empty strings are found.
- **original** *[string]* - a string representation of the word in its original state in the witness. If you do no normalisation to t then this will be the same string. Having this value in addition allows the editor to go back to the original version before processing the display settings which are always applied to the original string (unless you have specified a setting that uses something else).
- **rule_match** *[array]* - a list of strings which should include all strings that would be considered a match for this token when applying rules. In simple cases this will just be a list of a single string equal to the same value as original. The most obvious use case when more than one token would be added is where there is an abbreviated form of a word in the text and an editor can choose to see either the expanded or abbreviated form in the collation editor. In this case a rule created for one form would need to apply to either and so both would appear in this list.

Any number of additional keys can be included in this list. If you are going to customise the settings then you may need to encode extra data in the token such as punctuation for example. You may also want to encode information about gaps in the text which is explained in the next section.

## Encoding Gaps within a Collation Unit

Within a collation unit the collation editor assumes text is omitted unless your witnesses data tells it otherwise.

To encode lacunose text in addition to the required keys in the token object you will need to add additional keys and details about the lacunose section. When the gap follows a word (as in is not before the first word of the context unit). This is done by adding two extra keys to the token object.

- **gap_after** *[boolean]* - should always be true.
- **gap_details** *[string]*  - the details of the gap which will appear between <> in the editor eg. lac 2 char

If this is a gap before the very first extant word in the given unit then you must add the following two keys to the first token.

- **gap_before** *[boolean]* - should always be true.
- **gap_before_details** *[string]* - the details of the gap which will appear between <> in the editor eg. lac 2 char


## Examples

### Simple collation unit JSON example

**Document siglum:** 01  
**Text:** A simple example sentence

```json
[
  {
    "id": "01",
    "tokens": [
        {
          "index": 2,
          "reading": "01",
          "original": "A",
          "t": "a",
          "rule_match": ["a"]
        },
        {
          "index": 4,
          "reading": "01",
          "original": "simple",
          "t": "simple",
          "rule_match": ["simple"]
        },
        {
          "index": 6,
          "reading": "01",
          "original": "example",
          "t": "example",
          "rule_match": ["example"]
        },
        {
          "index": 8,
          "reading": "01",
          "original": "sentence",
          "t": "sentence",
          "rule_match": ["sentence"]
        }
    ]
  }
]
```

### Complex collation unit JSON example

**Document siglum:** 02
**Text:** A ~~complex~~ <sup>corrected</sup> example [lac 7-8 char] with damage

02\* will be used for the first hand and 02C for the correction

```json
[
  {
    "id": "02*",
    "tokens": [
        {
          "index": 2,
          "reading": "02*",
          "original": "A",
          "t": "a",
          "rule_match": ["a"]
        },
        {
          "index": 4,
          "reading": "02*",
          "original": "complex",
          "t": "complex",
          "rule_match": ["complex"]
        },
        {
          "index": 6,
          "reading": "02*",
          "original": "example",
          "t": "example",
          "rule_match": ["example"],
          "gap_after": true,
          "gap_details": "lac 7-8 char"
        },
        {
          "index": 8,
          "reading": "02*",
          "original": "with",
          "t": "with",
          "rule_match": ["with"]
        },
        {
          "index": 10,
          "reading": "02*",
          "original": "damage",
          "t": "damage",
          "rule_match": ["damage"]
        }
    ]
  },
  {
    "id": "02C",
    "tokens": [
        {
          "index": 2,
          "reading": "02C",
          "original": "A",
          "t": "a",
          "rule_match": ["a"]
        },
        {
          "index": 4,
          "reading": "02C",
          "original": "corrected",
          "t": "corrected",
          "rule_match": ["corrected"]
        },
        {
          "index": 6,
          "reading": "02C",
          "original": "example",
          "t": "example",
          "rule_match": ["example"],
          "gap_after": true,
          "gap_details": "lac 7-8 char"
        },
        {
          "index": 8,
          "reading": "02C",
          "original": "with",
          "t": "with",
          "rule_match": ["with"]
        },
        {
          "index": 10,
          "reading": "02C",
          "original": "damage",
          "t": "damage",
          "rule_match": ["damage"]
        }
    ]
  }
]
```
