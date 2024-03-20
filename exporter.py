import re
import xml.etree.ElementTree as etree


class Exporter(object):
    """The basic exporter to export a collation unit apparatus to TEI XML.

    This exporter offers a basic conversion of the collation editor aparatus format to an almost TEI compliant format
    of XML. It works only one unit a time and does not include a header since the output will not be sufficient for
    real world use. This exporter should be used as the base for a more complex exporter suitable for the text
    being edited or the output from this exporter can be manually edited to produce the format required.

    Args:
        format (str, optional): The output format requires. options are [negative_xml|positive_xml].
            Defaults to positive_xml.
        include_punctuation (bool, optional): Indicates whether or not to include punctuation in the lemma.
            Defaults to False.
        ignore_basetext (bool, optional): Indicates whether or not to report the base text as a witness.
        overlap_status_to_ignore (list, optional): A list of strings representing the overlap status categories
            that should be ignored in the export. Defaults to ['overlapped','deleted'].
        consolidate_om_verse (bool, optional): Indicates whether or not witnesses omitted in the entire collation
            unit are listed once at the start of the apparatus or indicated in each variant unit. Defaults to True.
        consolidate_lac_verse (bool, optional): Indicates whether or not witnesses which are lac for the entire
            collation unit are listed once at the start of the apparatus or indicated in each variant unit.
            Defaults to True.
        include_lemma_when_no_variants (bool, optional): Indicates whether ot not to include the lemma in the export
            if it has no variant readings. Defaults to False.
        rule_classes (dict, optional): This if the dictionary representing the rule classes used in the current
            editing project. Defaults to {}.
    """

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
        """The main function called by ExporterFactory.

        This function takes the JSON data from the collation editor process it into TEI XML and returns that as a
        string.

        Args:
            data (JSON): The JSON data structure from the collation editor.

        Returns:
            str: A string representing the serialised XML apparatus.
        """
        output = []
        for unit in data:
            output.append(etree.tostring(self.get_unit_xml(unit), 'utf-8').decode())
        return '<?xml version="1.0" encoding="utf-8"?><TEI xmlns="http://www.tei-c.org/ns/1.0">{}' \
               '</TEI>'.format('\n'.join(output).replace('<?xml version=\'1.0\' encoding=\'utf-8\'?>', ''))

    def get_text(self, reading, is_subreading=False):
        """Extracts the text of the reading supplied and returns it as a string.

        Args:
            reading (JSON): The JSON segment representing a reading in the collation editor apparatus.
            is_subreading (bool, optional): Set to true if this reading is a subreading and not a main reading.
                Defaults to False.

        Returns:
            list: A list with at most two items, the first is a string of the text of the reading, the second an
                optional string representing the text to present in the case of a reading with no text (such as a
                lac or om reading).
        """
        if is_subreading is True:
            return [reading['text_string'].replace('&lt;', '<').replace('&gt;', '>')]
        if len(reading['text']) > 0:
            if 'text_string' in reading:
                return [reading['text_string'].replace('&lt;', '<').replace('&gt;', '>')]
            return [' '.join(i['interface'] for i in reading['text'])]
        else:
            if 'overlap_status' in reading.keys() and (reading['overlap_status'] in self.overlap_status_to_ignore):
                text = ['', reading['overlap_status']]
            elif 'type' in reading.keys() and reading['type'] in ['om_verse', 'om']:
                if 'details' in reading.keys():
                    text = [reading['details'], reading['type']]
                else:
                    text = ['om.', reading['type']]
            elif 'type' in reading.keys() and reading['type'] in ['lac_verse', 'lac']:
                if 'details' in reading.keys():
                    text = [reading['details'], reading['type']]
                else:
                    text = ['lac.', reading['type']]
        return text

    def get_lemma_text(self, overtext, start, end):
        """Function to get the text of the lemma within the specified range in the overtext.

        Args:
            overtext (JSON): The JSON segment representing the overtext.
            start (int): The start index for the current lemma required.
            end (int): The end index for the current lemma required.

        Returns:
            list: A list of up to two items, the first is the string representing the overtext for this range,
                the optional second item is the string 'om' if the first item is an empty string.
        """
        if start == end and start % 2 == 1:
            return ['', 'om']
        real_start = int(start/2)-1
        real_end = int(end/2)-1
        if real_start < 0:
            real_start = 0
        required_text = overtext['tokens'][real_start:real_end+1]
        words = []
        for token in required_text:
            word = []
            if self.include_punctuation and 'pc_before' in token:
                word.append(token['pc_before'])
            word.append(token['original'])
            if self.include_punctuation and 'pc_after' in token:
                word.append(token['pc_after'])
            words.append(''.join(word))
        return [' '.join(words)]

    def get_witnesses(self, reading, to_remove):
        """Function to return the witnesses that should be reported for the given reading.

        Args:
            reading (JSON): The JSON segment representing the reading.
            to_remove (list): A list of witnesses which should be excluded from the output.

        Returns:
            list: The list of witnesses to this reading once the witnesses in the to_remove list have been removed.
        """
        # suffixes can be joined to witnesses before removing the unrequired witnesses because the unrequired witnesses
        # will not have edited text and therefore not have suffixes. They will be lac, om or the basetext.
        witnesses = ['{}{}'.format(x, reading['suffixes'][i]) for i, x in enumerate(reading['witnesses'])]
        for wit in to_remove:
            if wit in witnesses:
                witnesses.remove(wit)
        return witnesses

    def get_label(self, label, is_subreading, subtype, reading):
        """Function to get the correct label to display for the reading.

        Args:
            label (str): The current label of the reading (the basic form).
            is_subreading (bool): A boolean to say whether or not this is a subreading.
            subtype (str): The category of subreading if applicable.
            reading (JSON): The JSON segment representing the reading.

        Returns:
            str: The label to display for the reading.
        """
        if is_subreading is True:
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
        """Function to add any required reading suffixes to the text of the reading.

        Args:
            text (str): The extracted text of the current reading.
            subtype (str): The subtype category of this reading if applicable.
            reading (JSON): The JSON segent representing the reading.

        Returns:
            str: The text of the reading as it should now be displayed including any suffixes.
        """
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

    def make_reading(self, reading, index_position, label, witnesses, is_subreading=False, subtype=None):
        """Function to make the TEI XML version of a reading.

        Args:
            reading (JSON): The JSON segment representing the reading.
            index_position (int): The position of this reading in the apparatus unit.
            label (str): The current label of the reading (the basic form).
            witnesses (list): A list of witnesses for this reading.
            is_subreading (bool, optional): A boolean indicating if this reading is a subreading. Defaults to False.
            subtype (str, optional): The subtype category of this reading. Defaults to None.

        Returns:
            ElementTree.Element: The XML structure as an element tree rdg element.
        """
        rdg = etree.Element('rdg')
        rdg.set('n', self.get_label(label, is_subreading, subtype, reading))
        text = self.get_text(reading, is_subreading)
        text = self.check_for_suffixed_reading_marker(text, subtype, reading)
        if is_subreading is True:
            rdg.set('type', 'subreading')
        elif len(text) > 1:
            rdg.set('type', text[1])
        if subtype:
            rdg.set('cause', subtype)
        rdg.text = text[0]
        pos = index_position + 1  # add one because of 0-indexing
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

    def fix_subreading_suffix(self, suffix):
        """This function removes duplicate letters from the supplied subreading suffix.

        This function removes any duplicate letters in the supplied subreading suffix. Version 2.0 of the collation
        editor prevents this from happening in the data when items are approved but before that duplication could have
        been saved in the data.

        Args:
            suffix (str): The subreading suffix.

        Returns:
            str: The subreading suffix with duplicate letters removed.
        """
        if len(suffix) <= 1:
            return suffix
        new_label = []
        for char in suffix:
            if char not in new_label:
                new_label.append(char)
        return ''.join(new_label)

    def get_required_end(self, unit, context):
        """This is a function which is not important when working on a single unit where the end value is taken
        directly from the unit. It is a separate function so inheriting classes, which may be joining readings
        over multiple units, can overwrite it to provide the end value required.

        Args:
            unit (JSON): The current apparatus unit being processed.

        Returns:
            string: The string to use for the end value in the apparatus <app> tag.
        """
        return unit['end']

    def get_app_units(self, apparatus, overtext, context, missing):
        """Function to take the JSON apparatus and turn it into a list of ElementTree.Elements with each entry
        representing one variant unit in TEI XML.

        Args:
            apparatus (JSON): The JSON segment representing the apparatus for this unit.
            overtext (JSON): The JSON segment representing the overtext for this unit.
            context (str): The reference for this apparatus unit context.
            missing (list): The list of witnesses to exclude from this apparatus.

        Returns:
            list: A list of XML elements which make up the apparatus for this unit.
        """
        app_list = []
        for unit in apparatus:
            start = unit['start']
            end = unit['end']
            display_end = self.get_required_end(unit, context)
            app = etree.fromstring('<app type="main" n="%s" from="%s" to="%s"></app>' % (context, start, display_end))
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
                                                                 wits, True, key))

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
                                                                 wits, True, key))

            if readings:
                app_list.append(app)
        return app_list

    def get_unit_xml(self, entry):
        """Function to turn the JSON apparatus of the collation unit into TEI XML.

        Args:
            entry (JSON): The JSON fragment representing the apparatus of a collation unit.

        Returns:
            ElementTree.Element: The root element of a tree representing this collation unit in TEI XML.
        """
        context = entry['context']
        basetext_siglum = entry['structure']['overtext'][0]['id']

        apparatus = entry['structure']['apparatus'][:]

        # add all the apparatus line data into one line (order doesn't matter as we sort the units later)
        for key in entry['structure']:
            if re.match(r'apparatus\d+', key) is not None:
                apparatus.extend(entry['structure'][key])

        vtree = etree.fromstring('<ab n="{}-APP"></ab>'.format(context))
        # here deal with the whole verse lac and om and only use witnesses elsewhere not in these lists
        missing = []
        if self.consolidate_om_verse or self.consolidate_lac_verse:
            app = etree.fromstring('<app type="lac" n="{}">'
                                   '<lem wit="editorial">Whole verse</lem>'
                                   '</app>'.format(context))
            add_whole_verse_app = False

            if self.consolidate_lac_verse:
                if len(entry['structure']['lac_readings']) > 0:
                    add_whole_verse_app = True
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
                    add_whole_verse_app = True
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
            if add_whole_verse_app:
                vtree.append(app)

        # if we are ignoring the basetext add it to our missing list so it isn't listed (except in lemma)
        if self.ignore_basetext:
            missing.append(basetext_siglum)
        # this sort will change the order of the overlap units so shortest starting at each index point comes first
        apparatus = sorted(apparatus, key=lambda d: (d['start'], d['end']))

        app_units = self.get_app_units(apparatus, entry['structure']['overtext'][0], context, missing)
        for app in app_units:
            vtree.append(app)

        return vtree
