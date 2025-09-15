---
id: python-services
title: Python/Server Services
sidebar_label: Python Services
---

To support the server side code packaged with the collation editor some urls are required to provide the connection between the python and the JavaScript. The code required for each service should be minimal as they largely serve to pass data from the client side to the server side. The examples in this documentation are taken from a Django Implementation. Examples of the same services in a bottle.py implementation can be found in the [bottle_server.py](https://github.com/itsee-birmingham/standalone_collation_editor/blob/main/bottle_server.py) file from the standalone_collation_editor.

## Collation Service

The collation service needs to respond to an ajax call from the `doCollation()` services function and start the collation process by initialising and calling the collation preprocessor. The preprocessor applies the regularisation rules, runs the collation with collateX using the provided settings and processes and formats the collateX export for display in the collation editor.

All of the settings required are provided by the JavaScript. They can be altered here if needed but in most cases that will not be necessary.

The service needs to create a PreProcessor object using the data passed in the request as as options.configs. In should then call the process_witness_list function of that object using the data passed in the request as options.data. It should then return the output of this process as JSON or, if something goes wrong, an error message.

If the legacy regularisation system is also being used either this service or the `doCollation()` function can decide which one to create for the provided data. To use the legacy preprocessor the code requirements are the same but should use the legacy preprocessor object.

This example of the minimum code required for this service is taken from a Django implementation.

```python
from collation.core.exceptions import DataInputException
from collation.core.preprocessor import PreProcessor

def collate(request):

    options = json.loads(request.POST.get('options'))    
    p = PreProcessor(options['configs'])
    try:
        output = p.process_witness_list(options['data'])
    except DataInputException as e:
        return JsonResponse({'message': str(e)}, status=500)

    return JsonResponse(output)
```

## Settings Applier

There is one point in the collation editor code where the JavaScript needs to be able to apply the current settings to a string. This code was overlooked in the initial abstraction of the code away from the New Testament Greek context in which it was developed and the original Greek settings remained hard coded into the JavaScript code. This meant that the correct settings were not being applied for most other projects. The hard coded settings have now been removed from the JavaScript but a Python service is now required in its place. No one has reported problems with the way this worked in versions before 2.0 so it is very unlikely that any existing projects were negatively affected by this.

The collation editor provides a SettingsApplier class which uses the same configuration and Python support code as is used in the display settings configuration applied during the collation process.

The function should create an instance of the SettingsApplier class using the data in the *options* key of the request data object and then call the `apply_settings_to_token_list()` function from that objects using the data in the *tokens* key of the request data object.

The service will be called by the `applySettings()` function in the services file.

This example of the minimum code required for this service is taken from a Django implementation.

```python
from collation.core.settings_applier import SettingsApplier

def apply_settings(request):
    data = json.loads(request.POST.get('data'))
    applier = SettingsApplier(data['options'])
    tokens = applier.apply_settings_to_token_list(data['tokens'])
    return JsonResponse({'tokens': tokens})
```

## Apparatus Exporter

The apparatus exporter should be available at the URL specified in the `apparatusServiceUrl` variable or
the `getApparatusForContext()` function, both in the services file, depending on which is used.

The service is required to pass the data and configuration from the JavaScript into the ExporterFactory which in turn
passes everything onto the exporter specified in the configuration.  The configuration is explained in the
documentation for the `exporterSettings` variable.

The service needs to accept the data to export and the settings for the exporter. It should instantiate the
ExporterFactory class using the exporter settings passed in and, if present, the **options** object from the
configuration. It should then call the export_data function of the ExporterFactory with the data. The result should
then be returned to the user in a suitable way. Single units are usually processed quickly enough to enable the service
to return the file to the user using a standard file download in an HTTP response. When processing larger volumes of
data some kind of asynchronous task manager will probably be required. The code below shows an example of how to
instantiate the classes but does not give an example of how to return the data as this will vary depending on the platform
used. If no settings are provided then the ExporterFactory can be created with no arguments. If there is no **options**
key in the settings then no options argument passed to the constructor.

New exporters can be added by creating new classes from scratch or inheriting from the basic exporter class provided in
the core code. Options are passed from the ExporterFactory to the exporter function as keyword arguments. Some exporter
examples are provided in the contrib repository.

```python
from collation.core.exporter_factory import ExporterFactory

def get_apparatus(request):
    data = json.loads(request.POST.get('data'))
    exporter_settings = request.POST.get('settings', None)
    exf = ExporterFactory(exporter_settings, options=exporter_settings['options'])
    app = exf.export_data(data)

```
