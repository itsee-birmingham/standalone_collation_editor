---
id: data-format
title: Data Structure Required for Collation Input
sidebar_label: Data Format
---

The data structure for each witness retrieved for collation by the ```getUnitData()``` function should follow the 
structure outlined in the [collation unit section](collation-unit.md).


## Encoding Units which are Entirely Omitted or Lacunose

If an entire unit is omitted then the witnesses key value should either be ```null``` or an empty array (both are treated in the same way).

If an entire unit is lac and does not require any special category label in the collation editor then it should not be returned in the data.

If an entire unit is lac and requires a special category label in the collation editor then this information can be provided in one of two ways.

- It can be pre-calculated and supplied in the **special_categories** key of the object returned from ```getUnitData()``` (see the documentation of that function for details of the format required) in which case no other data for the unit should be returned in data.
- It can be encoded in the witnesses data by providing an empty array for the **tokens** key value and adding the key **gap_reading** which should contain the string value to be assigned to this lacunose reading in the collation editor.

It is up to the platform developers to decide which is most appropriate in each circumstance. The result in the collation editor will be the same regardless of how the data is provided.
