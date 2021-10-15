# -*- coding: utf-8 -*-
import importlib


class ExporterFactory (object):

    def __init__(self, exporter_settings=None, options={}):
        if exporter_settings and 'python_file' in exporter_settings:
            module_name = exporter_settings['python_file']
            class_name = exporter_settings['class_name']
            self.exporter_function = exporter_settings['function']
        else:
            module_name = 'collation.core.exporter'
            class_name = 'Exporter'
            self.exporter_function = 'export_data'

        MyClass = getattr(importlib.import_module(module_name), class_name)
        self.exporter = MyClass(**options)

    def export_data(self, data):
        return getattr(self.exporter, self.exporter_function)(data)
