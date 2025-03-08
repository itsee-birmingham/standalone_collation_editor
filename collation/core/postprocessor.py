# -*- coding: utf-8 -*-
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
from collation.core.settings_applier import SettingsApplier


class PostProcessor(Regulariser, SettingsApplier):
    """Convert alignment table into variant units."""

    def __init__(self,
                 alignment_table,
                 overtext_name,
                 overtext,
                 om_readings,
                 lac_readings,
                 hand_id_map,
                 special_categories,
                 display_settings,
                 decisions,
                 display_settings_config,
                 local_python_functions,
                 rule_conditions_config,
                 split_single_reading_units
                 ):

        self.alignment_table = alignment_table
        self.overtext_name = overtext_name
        self.overtext = overtext
        self.om_readings = om_readings
        self.lac_readings = lac_readings
        self.special_categories = special_categories
        self.hand_id_map = hand_id_map
        self.display_settings = display_settings
        self.decisions = decisions
        self.display_settings_config = display_settings_config
        self.display_settings_config['configs'].sort(key=lambda k: k['execution_pos'])
        if local_python_functions:
            self.local_python_functions = local_python_functions
        else:
            self.local_python_functions = None
        self.split_single_reading_units = split_single_reading_units
        Regulariser.__init__(self, rule_conditions_config, local_python_functions)
        SettingsApplier.__init__(self, {'display_settings': self.display_settings,
                                        'display_settings_config': self.display_settings_config})

    ###########################################################
    # this is the starting function
    def produce_variant_units(self):
        """Produce variant units for display and editing."""
        variant_readings = self.create_readings_sets()
        return self.format_output(self.anchor_readings(variant_readings))

    def create_extra_reading(self, text_list, witness):
        new = {'witnesses': [witness], 'text': []}
        for token in text_list:
            new_word = {}
            for item in ['t', 'interface', 'verse', witness]:
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

    # in the python we only care about embedded gaps not the ones at the edge of each unit
    # so we don't need to worry about gap_before as they are always before the first word and never embedded
    def extract_text_with_gaps(self, text_list, witness):
        text = []
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

        for z, unit in enumerate(self.alignment_table['table']):
            # first build a dictionary with text string as key to reading structure
            variant_unit = []
            readings = {}
            for i, witness in enumerate(unit):
                witness = self.process_witness_tokens(witness)
                reading = ' '.join([self.get_token_text(token) for token in witness])
                # empty string not a valid key in python dict so change to underscore
                # this is only used internally in this class and does not get passed out to js
                if reading == '':
                    reading = '_'

                if reading in readings.keys():
                    readings[reading]['witnesses'].append(self.alignment_table['witnesses'][i])
                    readings[reading]['text'] = self.combine_readings(readings[reading]['text'], witness)
                else:
                    readings[reading] = {'witnesses': [self.alignment_table['witnesses'][i]],
                                         'text': self.restructure_tokens(witness)
                                         }
            # now check to see if these units need to be smaller and split if needed
            readings_list = self.check_unit_splits(readings)
            # now build the variant reading structure
            for unit in readings_list:
                variant_unit = []
                for key in unit.keys():
                    if self.overtext_name in unit[key]['witnesses']:
                        variant_unit.insert(0, unit[key])
                    else:
                        variant_unit.append(unit[key])
                reading_sets.append(variant_unit)

        # next line was an experiment to try chunking myself.
        # reading_sets = self.check_adjacent_shared_units(reading_sets)
        return reading_sets

    def get_token_text(self, token):
        """Turn a token into a string."""
        if isinstance(token, dict):
            try:
                return token['interface']
            except KeyError:
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
        except KeyError:
            for token in data:
                for witness in token['reading']:
                    if witness not in witnesses:
                        witnesses.append(witness)
        return witnesses

    def combine_lists(self, list1, list2):
        return list1 + list(set(list2) - set(list1))

    def split_unit_into_single_words(self, readings_list, matrix, highest):
        """Split unit into single words (columns of matrix) and use
        vertically_combine_readings to combine any resulting shared units """
        # TODO: make work with matrices of different lengths
        # get a full set of witnesses
        witnesses = []
        for reading in readings_list:
            witnesses.extend(reading['witnesses'])
        witnesses = list(set(witnesses))
        readings = []
        for i in range(0, highest):  # i is matrix columns
            new_readings = {}  # new dictionary (basically a unit) for each column
            for j in range(0, len(matrix)):  # j is matrix rows
                if matrix[j] is None:
                    text = ''
                else:
                    try:
                        text = matrix[j][i]
                    except IndexError:
                        text = ''
                if text in new_readings.keys():
                    if text == '':
                        new_readings[text]['witnesses'] = self.combine_lists(new_readings[text]['witnesses'],
                                                                             readings_list[j]['witnesses'])
                    else:
                        new_readings[text]['text'] = self.vertically_merge_tokens(new_readings[text]['text'],
                                                                                  [readings_list[j]['text'][i]])
                        new_readings[text]['witnesses'] = self.combine_lists(new_readings[text]['witnesses'],
                                                                             readings_list[j]['witnesses'])
                else:
                    if text == '':
                        new_readings[text] = {'text': []}
                    else:
                        try:
                            new_readings[text] = {'text': [readings_list[j]['text'][i]]}
                        except Exception:
                            print('**** Problem with readings_list[j][text] ({2}) array max: {0}; i: {1}'
                                  .format(len(readings_list[j]['text']), i, readings_list[j]['text']), file=sys.stderr)
                            raise DataInputException('Error likely to have been caused by input data')
                    new_readings[text]['witnesses'] = readings_list[j]['witnesses']
            all_witnesses = copy.copy(witnesses)
            for key in new_readings:
                for wit in new_readings[key]['witnesses']:
                    try:
                        all_witnesses.remove(wit)
                    except ValueError:
                        pass
            if len(all_witnesses) > 0:
                if '' in new_readings.keys():
                    new_readings['']['witnesses'].extend(all_witnesses)
                else:
                    new_readings[''] = {'text': []}
                    new_readings['']['witnesses'] = all_witnesses
            readings.append(new_readings)
        return readings

    def vertically_merge_tokens(self, existing_tokens, new_tokens):
        for i, token in enumerate(new_tokens):
            for reading in token['reading']:
                existing_tokens[i][reading] = token[reading]
                existing_tokens[i]['reading'].append(reading)
        return existing_tokens

    def split_unit(self, readings):
        matrix = []  # a token matrix one row per reading one column per token
        readings_list = []  # the full reading data in same order as matrix
        for reading in readings.keys():
            if len(reading.split()) > 0 and reading != '_':
                matrix.append(reading.split())
            else:
                matrix.append(None)
            if self.overtext_name in readings[reading]['witnesses']:
                base_text = matrix[-1]
            readings_list.append(readings[reading])
        highest = 0
        lowest = 100000
        for row in matrix:
            if row is not None:
                highest = max(len(row), highest)
                # I don't know what is expected here - it used to test for 'None'. It might not be needed at all
                if row[0] != '_' and row[0] is not None:
                    lowest = min(len(row), lowest)
        if highest > 1:  # if at least one reading has more than one word
            lengths = []
            # return self.split_unit_into_single_words(readings_list, matrix, highest)
            # TODO: remove this condition once split unit into single words works with differing lengths
            if lowest == highest:
                # if all the readings are the same length
                return self.split_unit_into_single_words(readings_list, matrix, highest)
            else:
                if base_text is not None:
                    # if its not an addition
                    return self.split_unit_into_single_words(readings_list, matrix, highest)
                else:
                    # this is an addition so doesn't need splitting
                    return [readings]
        else:
            # this is a single word unit so just return existing readings
            return [readings]

    def check_unit_splits(self, readings):
        """Works out whether any units need further splitting and sends them off to restructure_unit"""
        token_matches = []
        base_text = None
        # if we have at least two actual readings (not including empty readings)
        if ((len(readings.keys()) > 1 and ('_' not in readings.keys())) or
                (len(readings.keys()) > 2 and ('_' in readings.keys()))):
            return self.split_unit(readings)
        # we have at least one real reading and we have asked to split these
        elif (len([x for x in readings.keys() if x != '_']) == 1 and self.split_single_reading_units is True):
            return self.split_unit(readings)
        else:
            return [readings]

    # may not ever need this actually
    def horizontal_combine(self, units):
        new_unit = [units[0]]
        for i in range(1, len(units)):

            new_unit['text'].append(units[i]['text'])
        return new_unit

    # TODO: may not even need this - wait for example to switch on
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
        if witness is None:
            return witness
        for token in witness:
            reading = token['reading']
            token['reading'] = [token['reading']]
            token[reading] = {}
            for key in list(token.keys())[:]:
                if key not in ['reading', 'interface', 'verse'] and key != reading:
                    token[reading][key] = token[key]
                    del token[key]
            new_witness.append(token)
        return new_witness

    def combine_readings(self, existing_reading, new_reading):
        """combine a new readings with an existing reading token by token"""
        combined_reading = []
        if existing_reading is None:
            return None
        for i, token in enumerate(existing_reading):
            combined_reading.append(self.combine_tokens(token, new_reading[i]))
        return combined_reading

    def combine_tokens(self, token, new_token):
        """combine token dictionaries"""
        reading = new_token['reading']
        token['reading'].append(new_token['reading'])
        token[reading] = {}
        for key in new_token.keys():
            if key not in ['reading', 'interface', 'verse'] and key != reading:
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
            if not len(base_reading) or (
                    (self.lac_readings is not None and self.overtext_name in self.lac_readings)
                    or (self.om_readings is not None and self.overtext_name in self.om_readings)):
                # we are looking at an addition so odd numbers
                start_index = previous_index + 1
                end_index = previous_index + 1
                if start_index == last_addition:
                    # get the next sub index
                    sub_index = self.get_next_sub_index(variant_units[i-1])
                last_addition = previous_index + 1
            else:
                # this is an even numbered unit so reset subindex
                sub_index = 1

                # we have a base text so just get the start and end from base text indexes!
                # If the data is not what the system expects then this can fail (Troy found this) so try: except:
                # used to report errors and use the logic from if above instead
                # ultimately data needs fixing in these cases
                try:
                    start_index = int(base_reading[0][self.overtext_name]['index'])
                    end_index = int(base_reading[-1][self.overtext_name]['index'])
                except Exception:
                    print('**** Problem witness: {}'.format(self.overtext_name), file=sys.stderr)
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
                    token['index'] = '{}'.format(index)
                    index += 2
            return '{}'.format(start)

        for reading in unit:
            # TODO: do we need to do this if there is only one word? also could we throw multi-word ones back to
            # collate and let it do better aligning?
            i = sub_index_start
            for token in reading['text']:
                token['index'] = '{}.{}'.format(start, i)
                i += 1
        return '{}.{}'.format(start, sub_index_start)

    def format_output(self, anchored_readings):
        """Format it nicely."""
        return {'overtext': self.overtext,
                'overtext_name': self.overtext_name,
                'apparatus': anchored_readings,
                'om_readings': self.om_readings,
                'lac_readings': self.lac_readings,
                'special_categories': self.special_categories,
                'hand_id_map': self.hand_id_map}

    def process_witness_tokens(self, witness):
        if not isinstance(witness, list):
            return witness
        else:
            new_witness = []
            for token in witness:
                if 'decision_details' in token and len(token['decision_details']) > 0:
                    token['interface'] = token['decision_details'][-1]['n'].replace('<', '&lt;').replace('>', '&gt;')
                else:
                    # create the word we will see in the interface
                    self.apply_settings(token)
                new_witness.append(token)
            return new_witness
