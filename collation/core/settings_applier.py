# -*- coding: utf-8 -*-
import sys
import importlib


class SettingsApplier(object):

    # def __init__(self, display_settings, display_settings_config):
    def __init__(self, options):
        self.settings = options['display_settings']
        self.display_settings_config = options['display_settings_config']
        self.display_settings_config['configs'].sort(key=lambda k: k['execution_pos'])

        module_name = self.display_settings_config['python_file']
        class_name = self.display_settings_config['class_name']
        MyClass = getattr(importlib.import_module(module_name), class_name)
        self.apply_settings_instance = MyClass()

    def apply_settings(self, token):
        # set up a base string for interface (this may change later with the settings)
        if 'n' in token:
            token['interface'] = token['n']
        elif 'original' in token:
            token['interface'] = token['original']
        else:
            token['interface'] = token['t']

        # display_settings_config is already in execution order
        for setting in self.display_settings_config['configs']:
            if (setting['id'] in self.settings and setting['apply_when'] is True
                    or setting['id'] not in self.settings and setting['apply_when'] is False):

                token = getattr(self.apply_settings_instance, setting['function'])(token)
        token['interface'] = token['interface'].replace('<', '&lt;').replace('>', '&gt;')
        return token

    def apply_settings_to_token_list(self, token_list):
        settings_token_list = []
        for token in token_list:
            settings_token_list.append(self.apply_settings(token))
        return settings_token_list
