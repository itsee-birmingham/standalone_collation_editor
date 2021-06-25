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
        else:
            self.local_python_functions = None

    def match_tokens(self, token, decision):
        if '_id' in decision:
            print('deprecated - use \'id\' for rules not \'_id\'', file=sys.stderr)
            decision['id'] = decision['_id']
        decision_word = decision['t']
        token_matches = token['rule_match']
        for condition in self.rule_conditions_config['configs']:
            if 'conditions' in decision and decision['conditions'] is not None:
                if ((condition['id'] in decision['conditions'].keys()
                    and decision['conditions'][condition['id']] is True
                    and condition['apply_when'] is True)
                    or
                    ((condition['id'] not in decision['conditions'].keys()
                        or (condition['id'] in decision['conditions'].keys()
                            and decision['conditions'][condition['id']] is False))
                        and condition['apply_when'] is False)):
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
                return (True, decision['n'], decision['class'], decision['scope'], decision['id'], decision['t'])
        return (False, None, None, None, None, None, None)

    def regularise_token(self, token, decisions):
        """Check the token against the rules."""
        decision_matches = []
        for decision in decisions:
            if '_id' in decision:
                print('deprecated - use \'id\' for rules not \'_id\'', file=sys.stderr)
                decision['id'] = decision['_id']

            if (decision['scope'] == u'always'
                or decision['scope'] == u'verse'
                or (decision['scope'] == u'manuscript'
                    and token['reading'] == decision['context']['witness'])
                or (decision['scope'] == u'once'
                    and (token['index'] == str(decision['context']['word'])
                    and token['reading'] == decision['context']['witness']))):
                decision_matches.append(decision)
        # order by time last modified or created for newer data
        # TODO: perhaps always better to do created time otherwise adding exception
        # to a global rule will change the order for all verses
        if len(decision_matches) > 1:
            decision_matches.sort(key=lambda x: x['_meta']['_last_modified_time']
                                  if '_meta' in x else x['created_time'])

        classes = []
        last_match = None
        matched = False
        for i, match_d in enumerate(decision_matches):
            if last_match and last_match[0] is True:
                # append the last matched n to the list of match word
                # if its not in there in the token to allow chaining
                if last_match[1] not in token['rule_match']:
                    token['rule_match'].append(last_match[1])
            match = self.match_tokens(token, match_d)
            if match[0] is True:
                last_match = match
                matched = True
                classes.append({'class': match[2], 'scope': match[3], 'id': match[4], 't': match[5], 'n': match[1]})
            if i + 1 == len(decision_matches):
                if matched is True:
                    return (True, last_match[1], classes)
        return (False, None, None)
