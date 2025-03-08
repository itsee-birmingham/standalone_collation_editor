---
id: required-variables
title: Required Service File Variables
---

## ```supportedRuleScopes```

The collation editor supports four different rules scopes.

- once - this place in this specified witness
- verse - everywhere in every witness for this verse/collation unit
- manuscript - everywhere in this specified witness
- always - everywhere in every witness

You can decide which of these you want your system to support and must ensure that the selected scopes can be stored
and retrieved through the service file. The file based system offered in the standalone collation editor only supports
two scopes (once and always) due to the storage and retrieval limitations.

This variables is a JSON object in which the supported rule scopes as a string are each a key, the string must match
the one in the list above. The value of the key is what is used in the drop down box when users select the scope for
the rule they are creating. This can be any string that will adequately describe the scope for your users.

An example for a system that supports once and always rule scopes is as follows:

```js
  supportedRuleScopes = {
    "once": "This place, these wits",
    "always": "Everywhere, all wits"
  };
```

In future releases it may be possible for projects to limit the supported rules scopes to a subset of those provided by
the services and also to change the value of the string displayed to users. Some of the key names may also be changed
in 2.0.0 to be more generic (verse and manuscript in particular).