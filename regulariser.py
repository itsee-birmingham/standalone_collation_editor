# -*- coding: utf-8 -*-
import sys
import importlib


class Regulariser(object):

    def __init__(self, rule_conditions_config, local_python_functions):
        self.rule_conditions_config = rule_conditions_config
        module_name = rule_conditions_config['python_file']
        class_name = rule_conditions_config['class_name']
        MyClass = getattr(importlib.import_module(module_name), class_name)
        self.instance = MyClass()
        if local_python_functions:
            self.local_python_functions = local_python_functions
            if 'prepare_t' in local_python_functions:
                module_name = local_python_functions['prepare_t']['python_file']
                class_name = local_python_functions['prepare_t']['class_name']
                MyClass = getattr(importlib.import_module(module_name), class_name)
                self.prepare_t_instance = MyClass()
        else:
            self.local_python_functions = None

    def match_tokens(self, token, decision, stage):
        if '_id' in decision:
            print('deprecated - use \'id\' for rules not \'_id\'', file=sys.stderr)
            decision['id'] = decision['_id']
        decision_word = decision['t']
        token_matches = token['rule_match']
        for condition in self.rule_conditions_config['configs']:
            if 'conditions' in decision and decision['conditions'] is not None:
                if (condition['id'] in decision['conditions'].keys()
                        and decision['conditions'][condition['id']] is True
                        and condition['apply_when'] is True) \
                        or \
                        ((condition['id'] not in decision['conditions'].keys()
                         or (condition['id'] in decision['conditions'].keys()
                         and decision['conditions'][condition['id']] is False))
                         and condition['apply_when'] is False):
                    if condition['type'] == 'boolean':
                        result = getattr(self.instance, condition['function'])(token, decision)
                        if result is False:
                            # if any of these don't match then we know the rule is
                            # irrelevant so we can return false already
                            return (False, None, None, None, None, None, None)
                    if condition['type'] == 'string_application':
                        decision_word, token_matches = getattr(self.instance, condition['function'])(decision_word,
                                                                                                     token_matches)
        for word in token_matches:
            if word == decision_word:
                if stage == 'post-collate' and 'n' in token.keys():
                    # this is used so post collate rules do no override changes that were made in pre-collate rules
                    return (True, token['n'], decision['class'], decision['scope'], decision['id'], decision['t'])
                return (True, decision['n'], decision['class'], decision['scope'], decision['id'], decision['t'])
        return (False, None, None, None, None, None, None)

    def regularise_token(self, token, decisions, stage):
        """Check the token against the rules."""
        decision_matches = []
        for decision in decisions:
            if '_id' in decision:
                print('deprecated - use \'id\' for rules not \'_id\'', file=sys.stderr)
                decision['id'] = decision['_id']
            # we are not recording subtypes anymore so we need to check here t against n
            if (self.prepare_t(decision['t']) != decision['n'] and stage == 'pre-collate') \
                    or (self.prepare_t(decision['t']) == decision['n'] and stage == 'post-collate'):

                if decision['scope'] == u'always' \
                    or decision['scope'] == u'verse' \
                    or (decision['scope'] == u'manuscript'
                        and token['reading'] == decision['context']['witness']) \
                    or (decision['scope'] == u'once'
                        and (token['index'] == str(decision['context']['word'])
                        and token['reading'] == decision['context']['witness'])):
                    decision_matches.append(decision)
        # order by time last modified or created for newer data
        # TODO: perhaps always better to do created time otherwise adding exception
        # to a global rule will change the order for all verses
        if len(decision_matches) > 1:
            decision_matches.sort(key=lambda x: x['_meta']['_last_modified_time'] if '_meta' in x else x['created_time'])

        classes = []
        last_match = None
        matched = False
        for i, match_d in enumerate(decision_matches):
            if last_match and last_match[0] is True:
                # append the last matched n to the list of match word if its not in there in the token to allow chaining
                if last_match[1] not in token['rule_match']:
                    token['rule_match'].append(last_match[1])
            match = self.match_tokens(token, match_d, stage)
            if match[0] is True:
                last_match = match
                matched = True
                classes.append({'class': match[2], 'scope': match[3], 'id': match[4], 't': match[5], 'n': match[1]})
            if i + 1 == len(decision_matches):
                if matched is True:
                    return (True, last_match[1], classes)
        return (False, None, None)

    def prepare_t(self, data):
        """the result of this determines if a rule is to be applied pre- or post-collate
        It should match whatever you do to the tokens to prepare them for collation"""
        if self.local_python_functions and 'prepare_t' in self.local_python_functions:
            return getattr(self.prepare_t_instance,
                           self.local_python_functions['prepare_t']['function']
                           )(data, self.settings, self.display_settings_config)
        else:
            # default is not to touch the input
            return data
