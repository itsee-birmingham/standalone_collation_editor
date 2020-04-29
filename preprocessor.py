# -*- coding: utf-8 -*-
import sys
import importlib
import json
import warnings
from .exceptions import DataInputException
from collation.core.postprocessor import PostProcessor
import urllib.request
from collation.core.regulariser import Regulariser


class PreProcessor(Regulariser):

    # last arg just to be compatible with dev branch
    def __init__(self, display_settings_config=None, local_python_functions=None,
                 rule_conditions_config=None, split_single_reading_units=False):

        self.display_settings_config = display_settings_config
        self.local_python_functions = local_python_functions
        self.rule_conds_config = rule_conditions_config
        self.split_single_reading_units = split_single_reading_units
        Regulariser.__init__(self, rule_conditions_config, local_python_functions)

    def process_witness_list(self, data_input, requested_witnesses, rules, basetext_transcription,
                             project, settings, collation_settings, accept):
        self.settings = settings
        data = data_input['data']
        witnesses = {}
        collatable_witnesses = []
        om_witnesses = []
        lac_hands = []
        lac_witnesses = requested_witnesses  # assume everything is lac until we find it
        hand_to_transcript_map = {}
        verse = None
        basetext_siglum = None
        # TODO: remove deprecation warning when ready
        # TODO: also need to note that there is now an optional human readable key of identifier
        # which can be provided in the verse data if required
        # this means we don't have to use the numerical pk
        # it must match with whatever is used in the services 'get_siglum_map' code
        if 'transcription_id' in data[0]:
            warnings.warn("The use of 'transcription_id' as a key in 'verse' object is "
                          "deprecated in favour of 'transcription'. "
                          "Support will be removed in future releases.", PendingDeprecationWarning)
        # Add all the witness texts and keep record of witnesses omitting the verse and lacunose witnesses
        for transcription_verse in data:

            # TODO: remove legacy support when ready
            if 'transcription_id' in transcription_verse:
                transcription_verse['transcription'] = transcription_verse['transcription_id']
                del transcription_verse['transcription_id']
            # END OF CODE TO REMOVE

            # try to remove witness from lac_witnesses (if successful its not lac)
            if 'transcription_identifier' in transcription_verse:
                try:
                    lac_witnesses.remove(transcription_verse['transcription_identifier'])
                except ValueError:
                    pass
            else:
                try:
                    lac_witnesses.remove(transcription_verse['transcription'])
                except ValueError:
                    pass

            # now find your base text.
            # this is obtained by matching the basetext_transcription supplied in the project
            # settings with the trascription or transcription_identifier
            # value in the verse if this matches and either the duplicate_pos key is
            # not present or it is present and == 1 then we have a base text.
            # it is not clear how the NTVMR will supply duplicate verses because I don't think they
            # have thought about it yet so this may not work accurately for their stuff
            # however it shouldn't break it just might not always select the first occurrence.
            if (transcription_verse['transcription'] == basetext_transcription
                    or transcription_verse['transcription_identifier'] == basetext_transcription):
                if verse is None and ('duplicate_position' not in transcription_verse
                                      or transcription_verse['duplicate_position'] is None
                                      or transcription_verse['duplicate_position'] == 1):
                    verse = transcription_verse
                    basetext_siglum = verse['siglum']

            # start to make the hand_id_map and also find our om witnesses and remove them
            try:
                trans_verse = transcription_verse['witnesses']
                for i, reading in enumerate(trans_verse):
                    # transcription_identifier is used as a human readable string
                    # for the django version as our pks are auto generated
                    if 'transcription_identifier' in transcription_verse:
                        hand_to_transcript_map[reading['id']] = transcription_verse['transcription_identifier']
                    else:
                        hand_to_transcript_map[reading['id']] = transcription_verse['transcription']
                    if len(reading['tokens']) == 0:
                        if 'gap_reading' in reading:
                            lac_hands.append(reading['id'])
                            trans_verse[i] = None
                        else:
                            om_witnesses.append(reading['id'])
                            trans_verse[i] = None
                for reading in reversed(trans_verse):
                    if reading is None:
                        trans_verse.remove(reading)
            except Exception:
                om_witnesses.append(transcription_verse['siglum'])
                if 'transcription_identifier' in transcription_verse:
                    hand_to_transcript_map[transcription_verse['siglum']] = \
                        transcription_verse['transcription_identifier']
                else:
                    hand_to_transcript_map[transcription_verse['siglum']] = \
                        transcription_verse['transcription']
            else:
                collatable_witnesses.extend(trans_verse)

        witnesses['collatable'] = collatable_witnesses
        witnesses['lac'] = list(data_input['lac_witnesses'].keys())
        witnesses['lac'].extend(lac_hands)
        witnesses['om'] = om_witnesses

        # can this all be better so one thing does both WCE and NTVMR??
        # now add in lac witnesses to the mapping
        if 'lac_transcription' in data_input.keys():
            # this deals with NTVMR witnesses
            for i, docID in enumerate(data_input['lac_transcription']):
                hand_to_transcript_map[data_input['lac_witnesses'][i]] = docID
        else:
            hand_to_transcript_map.update(data_input['lac_witnesses'])
        witnesses['hand_id_map'] = hand_to_transcript_map

        if verse is None:
            if not basetext_siglum or basetext_siglum in witnesses['lac']:
                missing_reason = 'lac'
            elif basetext_siglum in witnesses['om']:
                missing_reason = 'om'
            else:
                missing_reason = 'unknown'
            verse = {'siglum': basetext_siglum,
                     'missing_reason': missing_reason,
                     'index': 1
                     }
        return self.regularise(rules, witnesses, verse, settings, collation_settings, project, accept)

    def regularise(self, decisions, witnesses, verse, settings, collation_settings, project, accept):
        """Regularise the witness."""
        print('There are {} decisions'.format(len(decisions)), file=sys.stderr)
        for witness in witnesses['collatable']:
            for token in witness['tokens']:
                hit, normalised, details = self.regularise_token(token, decisions, 'pre-collate')
                if hit:
                    token['n'] = normalised
                    if details != 'None':
                        try:
                            token['decision_class'].extend([c['class'] for c in details])
                        except KeyError:
                            token['decision_class'] = [c['class'] for c in details]
                        try:
                            token['decision_details'].extend(details)
                        except KeyError:
                            token['decision_details'] = details
        return self.get_collation(witnesses, verse, decisions, settings, collation_settings, project, accept)

    def get_collation(self, witnesses, verse, decisions, settings, collation_settings, project, accept):
        """
        Get the collation for the context.
        """
        algorithm = 'auto'
        tokenComparator = {}
        if collation_settings['algorithm']:
            algorithm = collation_settings['algorithm']
        if collation_settings['tokenComparator'] and collation_settings['tokenComparator']['type']:
            tokenComparator['type'] = 'levenshtein'
            if collation_settings['tokenComparator'] and collation_settings['tokenComparator']['distance']:
                tokenComparator['distance'] = collation_settings['tokenComparator']['distance']
            else:
                # default to 2
                tokenComparator['distance'] = 2
        else:
            tokenComparator['type'] = 'equality'

        if len(witnesses['collatable']) > 0:
            witness_list = {'witnesses': witnesses['collatable']}
            if (algorithm == 'auto'):
                algorithm = 'needleman-wunsch'
                for witness in witness_list['witnesses']:
                    if len(witness['tokens']) > 0 and 'gap_after' in witness['tokens'][-1].keys():
                        algorithm = 'dekker'
                        break
            print('preprocessing complete', file=sys.stderr)
            options = {'outputFormat': accept,
                       'algorithm': algorithm,
                       'tokenComparator': tokenComparator,
                       'collatexHost': collation_settings['host']
                       }
            collatex_response = self.do_collate(witness_list, options)

            # these options are not currently used but could be useful later
            # they deal with outputs from collate that are not the collation editor display
            # # Start with raw XML types
            # if accept == 'xml' or accept == 'graphml' or accept == 'tei':
            #     self.set_header("Content-Type", "application/xml; charset=UTF-8")
            #     self.write(collatex_response)
            #     self.finish()
            #     return
            #
            # # Next is raw JSON
            # elif accept == 'json':
            #     self.set_header("Content-Type", "application/json; charset=UTF-8")
            #     self.write(collatex_response)
            #     self.finish()
            #     return

            try:
                alignment_table = json.loads(collatex_response.decode('utf-8'))
            except AttributeError:  # python returns a string rather than bytes
                alignment_table = json.loads(collatex_response)

            # get overtext details
            overtext_details = self.get_overtext(verse)
            print('collation done', file=sys.stderr)
            return self.do_post_processing(alignment_table, decisions, overtext_details[0],
                                           overtext_details[1], witnesses['om'], witnesses['lac'],
                                           witnesses['hand_id_map'], settings)

    def do_post_processing(self, alignment_table, decisions, overtext_name, overtext,
                           om_readings, lac_readings, hand_id_map, settings):

        pp = PostProcessor(
            alignment_table=alignment_table,
            overtext_name=overtext_name,
            overtext=overtext,
            om_readings=om_readings,
            lac_readings=lac_readings,
            hand_id_map=hand_id_map,
            settings=settings,
            decisions=decisions,
            display_settings_config=self.display_settings_config,
            local_python_functions=self.local_python_functions,
            rule_conditions_config=self.rule_conds_config,
            split_single_reading_units=self.split_single_reading_units
            )
        try:
            output = pp.produce_variant_units()
        except DataInputException:
            raise DataInputException
        return output

    def get_overtext(self, verse):

        if 'witnesses' not in verse.keys():
            try:
                return [verse['siglum'], verse['missing_reason']]
            except KeyError:
                return [verse['siglum'], 'om']
        elif len(verse['witnesses']) == 1:
            return [verse['siglum'], verse['witnesses']]
        else:
            readings = []
            for witness in verse['witnesses']:
                readings.append(witness['id'])
            if '{}*'.format(verse['siglum']) in readings:
                return ['{}*'.format(verse['siglum']),
                        [verse['witnesses'][readings.index('{}*'.format(verse['siglum']))]]
                        ]
            elif '{}T'.format(verse['siglum']) in readings:
                return ['{}T'.format(verse['siglum']),
                        [verse['witnesses'][readings.index('{}T'.format(verse['siglum']))]]
                        ]
            else:
                return [verse['witnesses'][0]['id'], [verse['witnesses'][0]]]

    def do_collate(self, data, options):  # accept, algorithm, tokenComparator, host='localhost'):
        """Do the collation"""
        print('COLLATING', file=sys.stderr)
        try:
            print('algorithm - {}'.format(options['algorithm']), file=sys.stderr)
            print('tokenComparator - {}'.format(options['tokenComparator']), file=sys.stderr)
        except KeyError:
            pass

        if (self.local_python_functions
                and 'local_collation_function' in self.local_python_functions):
            module_name = self.local_python_functions['local_collation_function']['python_file']
            class_name = self.local_python_functions['local_collation_function']['class_name']
            MyClass = getattr(importlib.import_module(module_name), class_name)
            collation_class = MyClass()
            return getattr(collation_class,
                           self.local_python_functions['local_collation_function']['function']
                           )(data, options)
        else:
            # use collateX Java microservices
            if 'algorithm' in options:
                # examples include 'needleman-wunsch'#'dekker'#'dekker-experimental'
                data['algorithm'] = options['algorithm']
            if 'tokenComparator' in options:
                # examples include {"type": "levenshtein", "distance": 2}#{'type': 'equality'}
                data['tokenComparator'] = options['tokenComparator']

            if 'collatexHost' in options:
                target = 'http://{}/collate'.format(options['collatexHost'])
            else:
                target = 'http://localhost:7369//collate'

            json_witnesses = json.dumps(data)
            if 'outputFormat' in options:
                accept_header = self.convert_header_argument(options['outputFormat'])
            else:
                accept_header = "application/json"

            req = urllib.request.Request(target)
            req.add_header('content-type', 'application/json')
            req.add_header('Accept', accept_header)
            response = urllib.request.urlopen(req, json_witnesses.encode('utf-8'))

            return response.read()

    def convert_header_argument(self, accept):
        """Convert shortname to MIME type."""
        if accept == 'json' or accept == 'lcs':
            return "application/json"
        elif accept == 'tei':
            return "application/tei+xml"
        elif accept == 'graphml':
            return 'application/graphml+xml'
        elif accept == 'dot':
            return 'text/plain'
        elif accept == 'svg':
            return 'image/svg+xml'
