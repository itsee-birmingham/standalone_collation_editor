# -*- coding: utf-8 -*-
import importlib


class ExporterFactory (object):

    def __init__(self, exporter_settings=None):
        if exporter_settings:
            module_name = exporter_settings['python_file']
            class_name = exporter_settings['class_name']
            self.exporter_function = exporter_settings['function']
            if 'ignore_basetext' in exporter_settings:
                self.ignore_basetext = exporter_settings['ignore_basetext']
            else:
                self.ignore_basetext = False
        else:
            module_name = 'collation.core.exporter'
            class_name = 'Exporter'
            self.exporter_function = 'export_data'
            self.ignore_basetext = False
        MyClass = getattr(importlib.import_module(module_name), class_name)
        self.exporter = MyClass()

    def export_data(self, data, format='positive_xml'):
        return getattr(self.exporter, self.exporter_function)(data, format, self.ignore_basetext)
