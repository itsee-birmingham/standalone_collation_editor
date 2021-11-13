# -*- coding: utf-8 -*-
import re
import codecs
import json
# using etree rather than lxml here to reduce dependencies in core code
import xml.etree.ElementTree as etree


class Exporter(object):

    def __init__(self,
                 format='positive_xml',
                 include_punctuation=False,
                 ignore_basetext=False,
                 overlap_status_to_ignore=['overlapped', 'deleted'],
                 consolidate_om_verse=True,
                 consolidate_lac_verse=True,
                 include_lemma_when_no_variants=False,
                 rule_classes={}):

        self.format = format
        self.include_punctuation = include_punctuation
        if 'negative' in self.format:
            self.negative_apparatus = True
        else:
            self.negative_apparatus = False
        self.ignore_basetext = ignore_basetext
        self.overlap_status_to_ignore = overlap_status_to_ignore
        self.consolidate_om_verse = consolidate_om_verse
        self.consolidate_lac_verse = consolidate_lac_verse
        self.include_lemma_when_no_variants = include_lemma_when_no_variants
        self.rule_classes = rule_classes

    def export_data(self, data):
        output = []
        for unit in data:
            output.append(etree.tostring(self.get_unit_xml(unit), 'utf-8').decode())
        return '<?xml version="1.0" encoding="utf-8"?><TEI xmlns="http://www.tei-c.org/ns/1.0">{}' \
               '</TEI>'.format('\n'.join(output).replace('<?xml version=\'1.0\' encoding=\'utf-8\'?>', ''))

    def get_text(self, reading, type=None):
        if type == 'subreading':
            return [reading['text_string'].replace('&lt;', '<').replace('&gt;', '>')]
        if len(reading['text']) > 0:
            if 'text_string' in reading:
                return [reading['text_string'].replace('&lt;', '<').replace('&gt;', '>')]
            return [' '.join(i['interface'] for i in reading['text'])]
        else:
            if 'overlap_status' in reading.keys() and (reading['overlap_status'] in self.overlap_status_to_ignore):
                text = ['', reading['overlap_status']]
            # TODO: make sure this works for special category readings
            elif 'type' in reading.keys() and reading['type'] in ['om_verse', 'om']:
                if 'details' in reading.keys():
                    text = [reading['details'], reading['type']]
                else:
                    text = ['om', reading['type']]
            elif 'type' in reading.keys() and reading['type'] in ['lac_verse', 'lac']:
                if 'details' in reading.keys():
                    text = [reading['details'], reading['type']]
                else:
                    text = ['lac', reading['type']]
        return text

    def get_lemma_text(self, overtext, start, end):
        if start == end and start % 2 == 1:
            return ['', 'om']
        real_start = int(start/2)-1
        real_end = int(end/2)-1
        if real_start < 0:
            real_start = 0
        word_list = [x['original'] for x in overtext['tokens']]
        return [' '.join(word_list[real_start:real_end+1])]

    def get_witnesses(self, reading, missing):
        witnesses = ['{}{}'.format(x, reading['suffixes'][i]) for i, x in enumerate(reading['witnesses'])]
        for miss in missing:
            if miss in witnesses:
                witnesses.remove(miss)
        return witnesses

    def get_label(self, label, type, subtype, reading):
        if type == 'subreading':
            return label
        if subtype is None:
            return label
        if 'label_suffix' in reading:
            return '{}{}'.format(label, reading['label_suffix'])
        for entry in self.rule_classes:
            if entry['value'] == subtype:
                if entry['suffixed_label'] is True:
                    return '{}{}'.format(label, entry['identifier'])
                break
        return label

    def check_for_suffixed_reading_marker(self, text, subtype, reading):
        if subtype is None:
            return text
        if 'reading_suffix' in reading:
            text[0] = '{} ({})'.format(text[0], reading['reading_suffix'])
            return text
        for entry in self.rule_classes:
            if entry['value'] == subtype:
                if entry['suffixed_reading'] is True:
                    text[0] = '{} ({})'.format(text[0], entry['identifier'])
                    return text
                break
        return text

    def make_reading(self, reading, i, label, witnesses, type=None, subtype=None):
        rdg = etree.Element('rdg')
        rdg.set('n', self.get_label(label, type, subtype, reading))
        text = self.get_text(reading, type)
        text = self.check_for_suffixed_reading_marker(text, subtype, reading)
        if type:
            rdg.set('type', type)
        elif len(text) > 1:
            rdg.set('type', text[1])
        if subtype:
            rdg.set('cause', subtype)
        rdg.text = text[0]
        pos = i+1
        rdg.set('varSeq', '{}'.format(pos))
        if len(witnesses) > 0:
            rdg.set('wit', ' '.join(witnesses))
            wit = etree.Element('wit')
            for witness in witnesses:
                idno = etree.Element('idno')
                idno.text = witness
                wit.append(idno)
            rdg.append(wit)
        return rdg

    # This function removes any duplicate letters in the subreading suffix. Version 2.0 prevents this from happening
    # in the data when items are approved but before that duplication could have been saved in the data.
    def fix_subreading_suffix(self, suffix):
        if len(suffix) <= 1:
            return suffix
        new_label = []
        for char in suffix:
            if char not in new_label:
                new_label.append(char)
        return ''.join(new_label)

    def get_app_units(self, apparatus, overtext, context, missing):
        app_list = []
        for unit in apparatus:
            start = unit['start']
            end = unit['end']
            app = etree.fromstring('<app type="main" n="%s" from="%s" to="%s"></app>' % (context, start, end))
            lem = etree.Element('lem')
            lem.set('wit', overtext['id'])
            text = self.get_lemma_text(overtext, int(start), int(end))
            lem.text = text[0]
            if len(text) > 1:
                lem.set('type', text[1])
            app.append(lem)
            readings = False
            if self.include_lemma_when_no_variants:
                readings = True
            for i, reading in enumerate(unit['readings']):
                wits = self.get_witnesses(reading, missing)
                if self.negative_apparatus is True:
                    if ((len(wits) > 0 or reading['label'] == 'a' or 'subreadings' in reading)
                            and ('overlap_status' not in reading
                                 or reading['overlap_status'] not in self.overlap_status_to_ignore)):
                        if reading['label'] == 'a':
                            wits = []
                        if len(wits) > 0:
                            readings = True
                        subtype = None
                        if 'reading_classes' in reading:
                            subtype = ' '.join(reading['reading_classes'])
                        app.append(self.make_reading(reading, i, reading['label'], wits, subtype=subtype))
                    if 'subreadings' in reading:
                        for key in reading['subreadings']:
                            for subreading in reading['subreadings'][key]:
                                wits = self.get_witnesses(subreading, missing)
                                if len(wits) > 0:
                                    readings = True
                                    subreading_label = '{}{}'.format(reading['label'],
                                                                     self.fix_subreading_suffix(subreading['suffix']))
                                    app.append(self.make_reading(subreading, i, subreading_label,
                                                                 wits, 'subreading', key))

                else:
                    if ((len(wits) > 0 or reading['label'] == 'a' or 'subreadings' in reading)
                            and ('overlap_status' not in reading
                                 or reading['overlap_status'] not in self.overlap_status_to_ignore)):
                        if len(wits) > 0:
                            readings = True
                        subtype = None
                        if 'reading_classes' in reading:
                            subtype = ' '.join(reading['reading_classes'])
                        app.append(self.make_reading(reading, i, reading['label'], wits, subtype=subtype))
                    if 'subreadings' in reading:
                        for key in reading['subreadings']:
                            for subreading in reading['subreadings'][key]:
                                wits = self.get_witnesses(subreading, missing)
                                if len(wits) > 0:
                                    readings = True
                                    subreading_label = '{}{}'.format(reading['label'],
                                                                     self.fix_subreading_suffix(subreading['suffix']))
                                    app.append(self.make_reading(subreading, i, subreading_label,
                                                                 wits, 'subreading', key))

            if readings:
                app_list.append(app)
        return app_list

    def get_unit_xml(self, entry):
        context = entry['context']
        basetext_siglum = entry['structure']['overtext'][0]['id']

        apparatus = entry['structure']['apparatus'][:]

        # make sure we append lines in order
        ordered_keys = []
        for key in entry['structure']:
            if re.match(r'apparatus\d+', key) is not None:
                ordered_keys.append(int(key.replace('apparatus', '')))
        ordered_keys.sort()

        for num in ordered_keys:
            apparatus.extend(entry['structure']['apparatus{}'.format(num)])

        vtree = etree.fromstring('<ab xml:id="{}-APP"></ab>'.format(context))
        # here deal with the whole verse lac and om and only use witnesses elsewhere not in these lists
        missing = []
        if self.consolidate_om_verse or self.consolidate_lac_verse:
            app = etree.fromstring('<app type="lac" n="{}">'
                                   '<lem wit="editorial">Whole verse</lem>'
                                   '</app>'.format(context))

            if self.consolidate_lac_verse:
                if len(entry['structure']['lac_readings']) > 0:
                    rdg = etree.Element('rdg')

                    rdg.set('type', 'lac')
                    rdg.text = 'Def.'
                    lac_witnesses = entry['structure']['lac_readings']
                    rdg.set('wit', ' '.join(lac_witnesses))
                    wit = etree.Element('wit')
                    for witness in lac_witnesses:
                        idno = etree.Element('idno')
                        idno.text = witness
                        wit.append(idno)
                    rdg.append(wit)
                    app.append(rdg)
                missing.extend(entry['structure']['lac_readings'])

            if self.consolidate_om_verse:
                if len(entry['structure']['om_readings']) > 0:
                    rdg = etree.Element('rdg')
                    rdg.set('type', 'lac')
                    rdg.text = 'Om.'
                    om_witnesses = entry['structure']['om_readings']
                    rdg.set('wit', ' '.join(om_witnesses))
                    wit = etree.Element('wit')
                    for witness in om_witnesses:
                        idno = etree.Element('idno')
                        idno.text = witness
                        wit.append(idno)
                    rdg.append(wit)
                    app.append(rdg)
                missing.extend(entry['structure']['om_readings'])

            vtree.append(app)

        # if we are ignoring the basetext add it to our missing list so it isn't listed (except in lemma)
        if self.ignore_basetext:
            missing.append(basetext_siglum)
        # this sort will change the order of the overlap units so longest starting at each index point comes first
        apparatus = sorted(apparatus, key=lambda d: (d['start'], -d['end']))

        app_units = self.get_app_units(apparatus, entry['structure']['overtext'][0], context, missing)
        for app in app_units:
            vtree.append(app)

        return vtree
