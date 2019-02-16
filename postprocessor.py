#-*- coding: utf-8 -*-
"""Algorithm for post-collate processing.

"""
from functools import partial
from .exceptions import DataInputException
import copy
import decimal
import re
import sys
import importlib
from collation.core.regulariser import Regulariser


class PostProcessor(Regulariser):
    """Convert alignment table (into zarks and then) into variant units."""

    def __init__(self,
                 alignment_table,
                 overtext_name,
                 overtext,
                 om_readings,
                 lac_readings,
                 hand_id_map,
                 settings,
                 decisions,
                 display_settings_config,
                 local_python_functions,
                 rule_conditions_config
                 ):

        self.alignment_table = alignment_table
        self.overtext_name = overtext_name
        self.overtext = overtext
        self.om_readings = om_readings
        self.lac_readings = lac_readings
        self.hand_id_map = hand_id_map
        self.settings = settings
        self.decisions = decisions
        self.display_settings_config = display_settings_config
        self.display_settings_config['configs'].sort(key=lambda k: k['execution_pos'])
        if local_python_functions:
            self.local_python_functions = local_python_functions
            module_name = local_python_functions['set_rule_string']['python_file']
            class_name = local_python_functions['set_rule_string']['class_name']
            MyClass = getattr(importlib.import_module(module_name), class_name)
            self.set_rule_string_instance = MyClass()
        else:
            self.local_python_functions = None
        Regulariser.__init__(self, rule_conditions_config, local_python_functions)
        module_name = self.display_settings_config['python_file']
        class_name = self.display_settings_config['class_name']
        MyClass = getattr(importlib.import_module(module_name), class_name)
        self.apply_settings_instance = MyClass()



    ###########################################################
    #this is starting function
    def produce_variant_units(self):
        """Produce variant units for display and editing."""
        variant_readings = self.create_readings_sets()
        return self.format_output(self.anchor_readings(variant_readings))

    def create_extra_reading(self, text_list, witness):
        new = {'witnesses': [witness], 'text': []}
        for token in text_list:
            new_word = {}
            for item in ['rule_string', 't', 'interface', 'verse', witness]:
                if item in token:
                    new_word[item] = token[item]
            new_word['reading'] = [witness]
            token['reading'].remove(witness)
            new['text'].append(new_word)
        return new

    def merge_extra_reading(self, text_list, witness, reading):
        reading['witnesses'].append(witness)
        for token in text_list:
            if witness in token:
                new_word[witness] = token[witness]
            new_word['reading'].append(witness)
            token['reading'].remove(witness)
        return reading

    #in the python we only care about embedded gaps not the ones at the edge of each unit
    #so we don't need to worry about gap_before as they are always before the first word and never embedded
    def extract_text_with_gaps(self, text_list, witness):
        text = [];
        for i, token in enumerate(text_list):
            if i == 0 or i == len(text_list)-1:
                text.append(token['interface'])
            else:
                text.append(token['interface'])
                if 'gap_after' in token[witness].keys():
                    text.append('<' + token[witness]['gap_details'] + '>')
        return ' '.join(text)

    def create_readings_sets(self):
        """turn alignment table into our variant readings structure"""
        readings = {}
        reading_sets = []

        #temporary fix to turn 'sigils' key in old collateX output to 'witnesses' for testing with both versions
        if 'sigils' in self.alignment_table:
            self.alignment_table['witnesses'] = self.alignment_table['sigils']
        for z, unit in enumerate(self.alignment_table['table']):
            #first build a dictionary with text string as key to reading structure
            variant_unit = []
            readings = {}
            for i, witness in enumerate(unit):
                witness = self.process_witness_tokens(witness)
                try:
                    reading = ' '.join([self.get_token_text(token) for token in witness])
                except:
                    reading = 'None'
                    witness = []
                if reading in readings.keys():
                    readings[reading]['witnesses'].append(self.alignment_table['witnesses'][i])
                    readings[reading]['text'] = self.combine_readings(readings[reading]['text'], witness)
                else:
                    readings[reading] = {'witnesses': [self.alignment_table['witnesses'][i]],
                                         'text': self.restructure_tokens(witness)
                                         }
            #now check to see if these units need to be smaller and split if needed
            readings_list = self.check_unit_splits(readings)
            #now build the variant reading structure
            for unit in readings_list:
                variant_unit = []
                for key in unit.keys():
                    if self.overtext_name in unit[key]['witnesses']:
                        variant_unit.insert(0, unit[key])
                    else:
                        variant_unit.append(unit[key])
                reading_sets.append(variant_unit)
        #next line was an experiment to try chunking myself.
        #reading_sets = self.check_adjacent_shared_units(reading_sets)
        return reading_sets


    def get_token_text(self, token):
        """Turn a token into a string."""
        if isinstance(token, dict):
            try:
                return token['interface']
            except:
                return token['t']
        else:
            return None

    def extract_witnesses(self, data):
        """Extract witnesses from a token or list of tokens and return"""
        witnesses = []
        try:
            for witness in data['reading']:
                if witness not in witnesses:
                    witnesses.append(witness)
        except:
            for token in data:
                for witness in token['reading']:
                    if witness not in witnesses:
                        witnesses.append(witness)
        return witnesses


    def combine_lists(self, list1, list2):
        return list1 + list(set(list2) - set(list1))


    def split_unit_into_single_words(self, readings_list, matrix, highest):
        """Split unit into single words (columns of matrix) and use vertically_combine_readings to combine any resulting shared units """
        #TODO: make work with matrices of different lengths
        #get a full set of witnesses
        witnesses = []
        for reading in readings_list:
            witnesses.extend(reading['witnesses'])
        witnesses = list(set(witnesses))
        readings = []
        for i in range(0, highest): # i is matrix columns
            new_readings = {} # new dictionary (basically a unit) for each column
            for j in range(0, len(matrix)): #j is matrix rows
                if matrix[j] == None or matrix[j][0] == 'None': #first is for collate 1.5 second for 1.3
                    text = 'None'
                else:
                    try:
                        text = matrix[j][i]
                    except:
                        text = 'None'
                if text in new_readings.keys():
                    if text == 'None':
                        new_readings[text]['witnesses'] = self.combine_lists(new_readings[text]['witnesses'], \
                                                                             readings_list[j]['witnesses'])
                    else:
                        new_readings[text]['text'] = self.vertically_merge_tokens(new_readings[text]['text'], \
                                                                                  [readings_list[j]['text'][i]])
                        new_readings[text]['witnesses'] = self.combine_lists(new_readings[text]['witnesses'], \
                                                                             readings_list[j]['witnesses'])
                else:
                    if text == 'None':
                        new_readings[text] = {'text': []}
                    else:
                        try:
                            new_readings[text] = {'text': [readings_list[j]['text'][i]]}
                        except:
                            print('**** Problem with readings_list[j][text] array max: {} '.format(len(readings_list[j]['text'])) + '; i: {}'.format(i), file=sys.stderr)
                            raise DataInputException('Error likely to have been caused by input data')
                    new_readings[text]['witnesses'] = readings_list[j]['witnesses']
            all_witnesses = copy.copy(witnesses)
            for key in new_readings:
                for wit in new_readings[key]['witnesses']:
                    try:
                        all_witnesses.remove(wit)
                    except:
                        pass
            if len(all_witnesses) > 0:
                if 'None' in new_readings.keys():
                    new_readings['None']['witnesses'].extend(all_witnesses)
                else:
                    new_readings['None'] = {'text': []}
                    new_readings['None']['witnesses'] = all_witnesses
            readings.append(new_readings)
        return readings


    def vertically_merge_tokens(self, existing_tokens, new_tokens):
        for i, token in enumerate(new_tokens):
#             existing_tokens[i]['siglum'].extend(token['siglum'])
            for reading in token['reading']:
                existing_tokens[i][reading] = token[reading]
                existing_tokens[i]['reading'].append(reading)
        return existing_tokens


    def check_unit_splits(self, readings):
        """Works out whether any units need further splitting and sends them off to restructure_unit"""
        token_matches = []
        base_text = 'None'
        #if we have at least two actual readings (not including empty readings)
        if len(readings.keys()) > 1 and 'None' not in readings.keys() or \
                 len(readings.keys()) > 2 and 'None' in readings.keys():
            matrix = [] #a token matrix one row per reading one column per token
            readings_list = [] # the full reading data in same order as matrix
            for reading in readings.keys():
                if len(reading.split()) > 0:
                    matrix.append(reading.split())
                else:
                    matrix.append(None)
                if self.overtext_name in readings[reading]['witnesses']:
                    base_text = matrix[-1]
                readings_list.append(readings[reading])
            highest = 0;
            lowest = 100000;
            for row in matrix:
                if row != None:
                    highest = max(len(row), highest)
                    if row[0] != 'None':
                        lowest = min(len(row), lowest)
            if highest > 1: #if at least one reading has more than one word
                lengths = []
                #return self.split_unit_into_single_words(readings_list, matrix, highest)
                #TODO: remove this condition once split unit into single words works with differing lengths
                if lowest == highest:
                    # if all the readings are the same length
                    return self.split_unit_into_single_words(readings_list, matrix, highest)
                else:
                    if base_text != 'None':
                        #if its not an addition
                        return self.split_unit_into_single_words(readings_list, matrix, highest)
                    else:
                        #this is an addition so doesn't need splitting
                        return [readings]
            else:
                #this is a single word unit so just return existing readings
                return [readings]
        else:
            #there is only one reading in this unit (therefore all read a - a shared unit) so just return existing readings
            return [readings]


    #may not ever need this actually
    def horizontal_combine(self, units):
        new_unit = [units[0]]
        for i in range(1, len(units)):

            new_unit['text'].append(units[i]['text'])
        return new_unit


    #TODO: may not even need this - wait for example to switch on
    def check_adjacent_shared_units(self, reading_sets):
        new_readings = []
        saved = []
        for reading in reading_sets:
            if len(reading) == 1:
                saved.append(reading)
            else:
                if len(saved) == 1:
                    new_readings.append(saved[0])
                    saved = []
                elif len(saved) > 0:
                    new_readings.append(horizontal_combine(saved))
                    saved = []
                new_readings.append(reading)
        if len(saved) == 1:
            new_readings.append(saved[0])
            saved = []
        elif len(saved) > 0:
            new_readings.append(horizontal_combine(saved))
            saved = []
        return new_readings

    def restructure_tokens(self, witness):
        """restructure the tokens so to move MS specific details into a secondary level"""
        new_witness = []
        if witness == None:
            return witness
        for token in witness:
            reading = token['reading']
            token['reading'] = [token['reading']]
            token[reading] = {}
            for key in list(token.keys())[:]:
                if key not in ['reading', 'interface', 'verse', 'rule_string'] and key != reading:
                    token[reading][key] = token[key]
                    del token[key]
            new_witness.append(token)
        return new_witness

    def combine_readings(self, existing_reading, new_reading):
        """combine a new readings with an existing reading token by token"""
        combined_reading= []
        if existing_reading == None:
            return None
        for i, token in enumerate(existing_reading):
            combined_reading.append(self.combine_tokens(token, new_reading[i]))
        return combined_reading

    def combine_tokens(self, token, new_token):
        """combine token dictionaries"""
        if 'rule_string' not in token.keys() and 'rule_string' in new_token.keys():
            token['rule_string'] = new_token['rule_string']
        reading = new_token['reading']
        token['reading'].append(new_token['reading'])
        token[reading] = {}
        for key in new_token.keys():
            if key not in ['reading', 'interface', 'verse', 'rule_string'] and key != reading:
                token[reading][key] = new_token[key]
        return token

    def get_next_sub_index(self, unit):
        highest_sub_index = 0
        for reading in unit:
            for word in reading['text']:
                sub_index = int(word['index'].split('.')[1])
                if sub_index > highest_sub_index:
                    highest_sub_index = sub_index
        return highest_sub_index + 1

    def anchor_readings(self, variant_units):
        """Match readings to the overtext."""
        anchored_readings = []
        start_index = 0
        end_index = 0
        last_addition = 0
        sub_index = 1
        previous_index = 0
        for i, unit in enumerate(variant_units):
            base_reading = unit[0]['text']
            if not len(base_reading) or (\
                    (self.lac_readings != None and self.overtext_name in self.lac_readings) \
                    or (self.om_readings != None and self.overtext_name in self.om_readings)):
                #we are looking at an addition so odd numbers
                start_index = previous_index + 1
                end_index = previous_index + 1
                if start_index == last_addition:
                    #get the next sub index
                    sub_index = self.get_next_sub_index(variant_units[i-1])
                last_addition = previous_index + 1
            else:
                #this is an even numbered unit so reset subindex
                sub_index = 1

                # we have a base text so just get the start and end from base text indexes!
                # If the data is not what the system expects then this can fail (Troy found this) so try: except:
                # used to report errors and use the logic from if above instead - ultimately data needs fixing in these cases
                try:
                    start_index = int(base_reading[0][self.overtext_name]['index'])
                    end_index = int(base_reading[-1][self.overtext_name]['index'])
                except:
                    print('**** Problem witness: %s' % self.overtext_name, file=sys.stderr)
                    start_index = previous_index + 1
                    end_index = previous_index + 1
                previous_index = end_index

            first_word_index = self.reindex_unit(unit, start_index, end_index, sub_index)
            anchored_reading = {
                'readings': unit,
                'start': start_index,
                'end': end_index,
                'first_word_index': first_word_index
                }
            anchored_readings.append(anchored_reading)

        return anchored_readings


    def reindex_unit(self, unit, start, end, sub_index_start=1):
        """Make the token indexes match the anchored reading."""
        if start % 2 == 0 and start != end:
            for reading in unit:
                index = start
                for token in reading['text']:
                    token['index'] = '%d' % index
                    index += 2
            return '%s' % start

        for reading in unit:
            #TODO: do we need to do this if there is only one word? also could we throw multi-word ones back to collate
            #and let it do better aligning?
            i = sub_index_start
            for token in reading['text']:
                token['index'] = '%s.%s' % (start, i)
                i += 1
        return '%s.%s' % (start, sub_index_start)

    def format_output(self, anchored_readings):
        """Format it nicely."""
        return {'overtext': self.overtext,
                'overtext_name': self.overtext_name,
                'apparatus': anchored_readings,
                'om_readings': self.om_readings,
                'lac_readings': self.lac_readings,
                'hand_id_map': self.hand_id_map}

    def apply_settings(self, token):
        #set up a base string for interface (this may change later with the settings)
        if 'n' in token:
            token['interface'] = token['n']
        elif 'original' in token:
            token['interface'] = token['original']
        else:
            token['interface'] = token['t']

        #display_settings_config is already in execution order
        for setting in self.display_settings_config['configs']:
            if setting['id'] in self.settings and setting['apply_when'] == True \
                    or setting['id'] not in self.settings and setting['apply_when'] == False:

                token = getattr(self.apply_settings_instance, setting['function'])(token)
        token['interface'] = token['interface'].replace('<', '&lt;').replace('>', '&gt;')
        return token

    def process_witness_tokens(self, witness):
        if not isinstance(witness, list):
            return witness
        else:
            new_witness = []
            for token in witness:
                #here check if there is a post-collate rule for the word, if there is use it if not use settings
                hit, normalised, details = self.regularise_token(token, self.decisions, 'post-collate')
                if hit == True:
                    #make sure rule string is the current last n value so new rules chain properly
                    token['rule_string'] = details[-1]['n']
                    if details != None:
                        try:
                            token['decision_class'].extend([c['class'] for c in details])
                        except:
                            token['decision_class'] = [c['class'] for c in details]
                        try:
                            token['decision_details'].extend(details)
                        except:
                            token['decision_details'] = details
                    token['interface'] = normalised.replace('<', '&lt;').replace('>', '&gt;')
                else:
                    token = self.set_rule_string(token)
                    #create the word we will see in the interface
                    self.apply_settings(token)
                new_witness.append(token)
            return new_witness

    def set_rule_string(self, token):
        if self.local_python_functions and 'set_rule_string' in self.local_python_functions:
            return getattr(self.set_rule_string_instance, self.local_python_functions['set_rule_string']['function'])(token, self.settings, self.display_settings_config)
        else:
            if 'n' in token:
                token['rule_string'] = token['n']
            else:
                token['rule_string'] = token['t']
            return token

#     #the plan was to get rid of this but js needs to follow suite as it currently expects this marking (SV does not use it)
#     def identify_regularised_readings(self, variant_readings):
#         """find all the regularised readings (basically anything that has a rule applied
#         and identify them at token level)"""
#         for unit in variant_readings:
#             extras = {}
#             for i, reading in enumerate(unit):
#                 for witness in reading['witnesses']:
#                     for j, token in enumerate(reading['text']):
#                         if 'decision_class' in token[witness].keys():
#                             token['regularised'] = True
#                         if len(reading['witnesses']) > 0 and len(reading['text']) > 0: #we only care if there is more than one witness to the reading and it has multiple words
#                             if j > 0 and j < len(reading['text'])-1: #we don't care about the first or last words of the unit
#                                 if 'gap_after' in token[witness].keys():
#                                     #make a new reading
#                                     gapped_text = self.extract_text_with_gaps(reading['text'], witness)
#                                     if gapped_text in extras:
#                                         extras[gapped_text] = self.merge_extra_reading(reading['text'], witness, extras[gapped_text])
#                                     else:
#                                         extras[gapped_text] = self.create_extra_reading(reading['text'], witness)
#
#             if len(extras.keys()) > 0:
#                 #add in the new readings - can all go on the end no issue with position
#                 for rdg in extras.keys():
#                     for wit in extras[rdg]['witnesses']:
#                         for j, reading in enumerate(unit):
#                             if wit in reading['witnesses']:
#                                 reading['witnesses'].remove(wit)
#                                 if len(reading['witnesses']) == 0:
#                                     unit.remove(reading)
#                                 else:
#                                     for token in reading['text']:
#                                         del token[wit]
#                     unit.append(extras[rdg])
#         return variant_readings
