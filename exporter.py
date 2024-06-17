import re
import xml.etree.ElementTree as etree
from .restructure_export_data_mixin import RestructureExportDataMixin


class Exporter(RestructureExportDataMixin, object):
    """The basic exporter to export a collation unit apparatus to TEI XML.

    This exporter offers a basic conversion of the collation editor aparatus format to an almost TEI compliant format
    of XML. It works only one unit a time and does not include a header since the output will not be sufficient for
    real world use. This exporter should be used as the base for a more complex exporter suitable for the text
    being edited or the output from this exporter can be manually edited to produce the format required. The mixin
    restructures the data from collation data into a simpler stripped down format to use for exporting and also
    backfills some data which may be missing in collations produced in the early versions of the collation editor.

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
        include_lemma_when_no_variants (bool, optional): Indicates whether or not to include the lemma in the export
            if it has no variant readings. Defaults to False.
        exclude_lemma_entry (bool, optional): Indicates if the lemma entry in the apparatus should be excluded. If the
            setting is True the apparatus will not have a <lem> tag for each entry. Defaults to False.
        rule_classes (dict, optional): This is the dictionary representing the rule classes used in the current
            editing project. Defaults to {}. Only needed for older data.
    """

    def __init__(self,
                 format='positive_xml',
                 include_punctuation=False,
                 ignore_basetext=False,
                 overlap_status_to_ignore=['overlapped', 'deleted'],
                 consolidate_om_verse=True,
                 consolidate_lac_verse=True,
                 include_lemma_when_no_variants=False,
                 exclude_lemma_entry=False,
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
        self.exclude_lemma_entry = exclude_lemma_entry
        self.rule_classes = rule_classes
        # set once in export_data
        self.overtext_siglum = None

    def export_data(self, data):
        """Takes the JSON data from the collation editor process it into TEI XML and returns that as a string.

        The main function called by ExporterFactory.

        Args:
            data (dict): The JSON data structure from the collation editor.

        Returns:
            str: A string representing the serialised XML apparatus.
        """
        output = []
        self.overtext_siglum = data[0]['structure']['overtext_name']
        for collation_unit in data:
            restructured_collation_unit = self.clean_collation_unit(collation_unit)
            output.append(etree.tostring(self.get_unit_xml(restructured_collation_unit), 'utf-8').decode())
        return '<?xml version="1.0" encoding="utf-8"?><TEI xmlns="http://www.tei-c.org/ns/1.0">{}' \
               '</TEI>'.format('\n'.join(output).replace('<?xml version=\'1.0\' encoding=\'utf-8\'?>', ''))

    def get_text(self, reading, is_subreading=False):
        """Extracts the text of the reading supplied and returns it as a string.

        Args:
            reading (dict): The JSON segment representing a reading in the collation editor apparatus.
            is_subreading (bool, optional): Set to true if this reading is a subreading and not a main reading.
                Defaults to False.

        Returns:
            list: A list with at most two items, the first is a string of the text of the reading, the second an
                optional string representing the type of the reading in the case of a reading with no text (such as a
                lac or om reading).
        """
        if is_subreading is True:
            return [reading['text_string'].replace('&lt;', '<').replace('&gt;', '>')]
        if len(reading['text']) > 0:
            return [reading['text_string'].replace('&lt;', '<').replace('&gt;', '>')]
        if 'overlap_status' in reading.keys():
            if reading['overlap_status'] in self.overlap_status_to_ignore:
                return ['', reading['overlap_status']]
            return [reading['overlap_status'], 'overlapped']
        if 'type' in reading.keys() and reading['type'] in ['om_verse', 'om']:
            if 'details' in reading.keys():
                return [reading['details'], 'om']
            return ['om.', 'om']
        if 'type' in reading.keys() and reading['type'] in ['lac_verse', 'lac']:
            if 'details' in reading.keys():
                return [reading['details'], 'lac']
            else:
                return ['lac.', 'lac']

    def get_lemma_text(self, overtext, start, end):
        """Function to get the text of the lemma within the specified range in the overtext.

        Args:
            overtext (dict): The JSON segment representing the overtext tokens for this unit. The data should be
                wrapped in a dictionary as the value to the key 'current'
                eg. {'current': [{'index': 2, 'original': 'word1'}, {'index': 4, 'original': 'word2}]}
            start (str): The start index for the current lemma required.
            end (str): The end index for the current lemma required.

        Returns:
            list: A list of up to two items, the first is the string representing the overtext for this range,
                the optional second item is the string 'om' if the first item is an empty string.
        """
        start = int(start)
        end = int(end)
        if start == end and start % 2 == 1:
            return ['', 'om']
        if start % 2 == 1:
            start += 1
        real_start = int(start/2)-1
        real_end = int(end/2)-1
        if real_start < 0:
            real_start = 0
        required_text = overtext['current'][real_start:real_end+1]
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
            reading (dict): The JSON segment representing the reading.
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

    def get_label(self, label, is_subreading, reading):
        """Function to get the correct label to display for the reading.

        Args:
            label (str): The current label of the reading (the basic form for a main reading or the full label
                for a subreading).
            is_subreading (bool): A boolean to say whether or not this is a subreading.
            reading (dict): The JSON segment representing the reading.

        Returns:
            str: The label to display for the reading.
        """
        if is_subreading is True:
            return label
        if 'label_suffix' in reading:
            return '{}{}'.format(label, reading['label_suffix'])
        return label

    def check_for_suffixed_reading_marker(self, text, reading):
        """Function to add any required reading suffixes to the text of the reading.

        Args:
            text (str): The extracted text of the current reading.
            reading (dict): The JSON segent representing the reading.

        Returns:
            str: The text of the reading as it should now be displayed including any suffixes.
        """
        if 'reading_suffix' in reading:
            text[0] = '{} ({})'.format(text[0], reading['reading_suffix'])
            return text
        return text

    def make_reading(self, reading, index_position, label, witnesses, is_subreading=False, subtype=None):
        """Function to make the TEI XML version of a reading.

        Args:
            reading (dict): The JSON segment representing the reading.
            index_position (int): The position of this reading in the apparatus unit.
            label (str): The current label of the reading (the basic form).
            witnesses (list): A list of witnesses for this reading.
            is_subreading (bool, optional): A boolean indicating if this reading is a subreading. Defaults to False.
            subtype (str, optional): The subtype category of this reading. Defaults to None.

        Returns:
            ElementTree.Element: The XML structure as an element tree rdg element.
        """
        rdg = etree.Element('rdg')
        rdg.set('n', self.get_label(label, is_subreading, reading))
        text = self.get_text(reading, is_subreading)
        text = self.check_for_suffixed_reading_marker(text, reading)
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
            unit (dict): The current apparatus unit being processed.
            context (str): The context of this collation unit (used in inheriting classes to recognise joined readings)

        Returns:
            str: The string to use for the end value in the apparatus <app> tag.
        """
        return unit['end']

    def get_app_units(self, apparatus, overtext, context, missing):
        """Function to take the JSON apparatus and turn it into a list of ElementTree.Elements with each entry
        representing one variant unit in TEI XML.

        Args:
            apparatus (dict): The JSON segment representing the apparatus for this unit.
            overtext (dict): The JSON segment representing the overtext for this unit. The data should be wrapped in a
                             dictionary as the value to the key 'current'
                             eg. {'current': [{'id': 'basetext', 'tokens': []}]}
            context (str): The reference for this apparatus unit context.
            missing (list): The list of witnesses to exclude from this apparatus.

        Returns:
            list: A list of XML elements which make up the apparatus for this unit.
        """
        app_list = []
        for unit in apparatus:
            start = unit['start']
            end = self.get_required_end(unit, context)
            app = etree.fromstring('<app type="main" n="%s" from="%s" to="%s"></app>' % (context, start, end))
            if self.exclude_lemma_entry is not True:
                lem = etree.Element('lem')
                lem.set('wit', self.overtext_siglum)
                text = self.get_lemma_text(overtext, start, end)
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
                            subtype = '|'.join(reading['reading_classes'])
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

    def get_overtext_data(self, entry):
        return {'current': entry['structure']['overtext']}

    def sort_units(self, unit):
        return (unit['start'], -unit['end'])

    def get_unit_xml(self, entry):
        """Function to turn the JSON apparatus of the collation unit into TEI XML.

        Args:
            entry (dict): The JSON fragment representing the apparatus of a collation unit.

        Returns:
            ElementTree.Element: The root element of a tree representing this collation unit in TEI XML.
        """
        context = entry['context']
        basetext_siglum = self.overtext_siglum

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
        apparatus = sorted(apparatus, key=self.sort_units)
        overtext = self.get_overtext_data(entry)

        app_units = self.get_app_units(apparatus, overtext, context, missing)
        for app in app_units:
            vtree.append(app)

        return vtree
