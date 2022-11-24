from unittest import TestCase
from collation.core.data_loader import load_json_test_data
import xml.etree.ElementTree as etree
from collation.core.exporter import Exporter


class ExporterUnitTests(TestCase):

    def setUp(self):
        self.test_data = load_json_test_data('unit_test_data.json')

    def test_get_text_default_settings(self):

        exp = Exporter()
        reading = self.test_data['apparatus'][12]['readings'][3]
        expected_text = ['και πατρος']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_default_settings_older_format(self):

        exp = Exporter()
        reading = self.test_data['apparatus'][12]['readings'][3]
        # change the data to the older format
        del reading['text_string']
        expected_text = ['και πατρος']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_default_settings_subreading(self):

        exp = Exporter()
        reading = self.test_data['apparatus'][12]['readings'][3]['subreadings']['abbreviation'][0]
        expected_text = ['και πρς']
        generated_text = exp.get_text(reading, is_subreading=True)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_default_settings_om(self):

        exp = Exporter()
        reading = self.test_data['apparatus'][12]['readings'][4]
        expected_text = ['om', 'om']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_default_settings_om_verse(self):

        exp = Exporter()
        reading = {"_id": "ebc1bfa92e5b52a692309086a3807d63",
                   "text": [],
                   "text_string": "&lt;om unit&gt;",
                   "label": "e",
                   "suffixes": ["", ""],
                   "type": "om_verse",
                   "witnesses": ["467", "1959"]
                   }
        expected_text = ['om', 'om_verse']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_default_settings_om_verse_details(self):

        exp = Exporter()
        reading = {"_id": "ebc1bfa92e5b52a692309086a3807d63",
                   "text": [],
                   "text_string": "&lt;om unit&gt;",
                   "details": "om unit",
                   "label": "e",
                   "suffixes": ["", ""],
                   "type": "om_verse",
                   "witnesses": ["467", "1959"]
                   }
        expected_text = ['om unit', 'om_verse']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_default_settings_lac(self):

        exp = Exporter()
        reading = {"_id": "ebc1bfa92e5b52a692309086a3807d63",
                   "text": [],
                   "text_string": "&lt;lac&gt;",
                   "label": "zz",
                   "suffixes": ["", ""],
                   "type": "lac",
                   "witnesses": ["467", "1959"]
                   }
        expected_text = ['lac', 'lac']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_default_settings_lac_verse(self):

        exp = Exporter()
        reading = {"_id": "ebc1bfa92e5b52a692309086a3807d63",
                   "text": [],
                   "text_string": "&lt;lac unit&gt;",
                   "label": "zz",
                   "suffixes": ["", ""],
                   "type": "lac_verse",
                   "witnesses": ["467", "1959"]
                   }
        expected_text = ['lac', 'lac_verse']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_default_settings_lac_verse_details(self):

        exp = Exporter()
        reading = {"_id": "ebc1bfa92e5b52a692309086a3807d63",
                   "text": [],
                   "text_string": "&lt;lac unit&gt;",
                   "details": "lac unit",
                   "label": "zz",
                   "suffixes": ["", ""],
                   "type": "lac_verse",
                   "witnesses": ["467", "1959"]
                   }
        expected_text = ['lac unit', 'lac_verse']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_default_settings_lac_special_category_details(self):

        exp = Exporter()
        reading = {"_id": "ebc1bfa92e5b52a692309086a3807d63",
                   "text": [],
                   "text_string": "&lt;abbreviated text&gt;",
                   "details": "abbreviated text",
                   "label": "zz",
                   "suffixes": ["", ""],
                   "type": "lac_verse",
                   "witnesses": ["467", "1959"]
                   }
        expected_text = ['abbreviated text', 'lac_verse']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_default_settings_overlapped(self):

        exp = Exporter()
        reading = {"_id": "3bee198c538c459869217960d7a90446",
                   "text": [],
                   "type": "om",
                   "label": "zu",
                   "suffixes": ["", ""],
                   "witnesses": ["642S*", "1398"],
                   "text_string": "overlapped",
                   "overlap_status": "overlapped"
                   }
        expected_text = ['', 'overlapped']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_lemma_text(self):

        exp = Exporter()
        overtext = self.test_data['overtext'][0]
    
        # test a few ranges where there is data
        expected_text = ['Παῦλος ἀπόστολος οὐκ']
        generated_text = exp.get_lemma_text(overtext, 2, 6)
        self.assertEqual(expected_text, generated_text)

        expected_text = ['ἀνθρώπων']
        generated_text = exp.get_lemma_text(overtext, 10, 10)
        self.assertEqual(expected_text, generated_text)

        expected_text = ['Παῦλος']
        generated_text = exp.get_lemma_text(overtext, 1, 3)
        self.assertEqual(expected_text, generated_text)

        # test where there is no data
        expected_text = ['', 'om']
        generated_text = exp.get_lemma_text(overtext, 9, 9)
        self.assertEqual(expected_text, generated_text)

        expected_text = ['', 'om']
        generated_text = exp.get_lemma_text(overtext, 1, 1)
        self.assertEqual(expected_text, generated_text)

    def test_get_witnesses(self):
        exp = Exporter()
        reading = self.test_data['apparatus'][10]['readings'][0]

        expected_witnesses = ['69', '1947', '1985', 'basetext']
        generated_witnesses = exp.get_witnesses(reading, [])
        self.assertEqual(expected_witnesses, generated_witnesses)

        expected_witnesses = ['69', '1947', '1985']
        generated_witnesses = exp.get_witnesses(reading, ['basetext'])
        self.assertEqual(expected_witnesses, generated_witnesses)

    def test_get_label_main_reading_1(self):
        exp = Exporter()
        reading = self.test_data['apparatus'][12]['readings'][3]
        expected_label = 'd'
        generated_label = exp.get_label('d', False, None, reading)
        self.assertEqual(expected_label, generated_label)

    def test_get_label_main_reading_2(self):
        exp = Exporter()
        reading = self.test_data['apparatus'][4]['readings'][1]
        expected_label = 'df'
        generated_label = exp.get_label('d', False, 'fehler', reading)
        self.assertEqual(expected_label, generated_label)

    def test_get_label_subreading(self):
        exp = Exporter()
        reading = self.test_data['apparatus'][12]['readings'][3]['subreadings']['abbreviation'][0]
        expected_label = 'd'
        generated_label = exp.get_label('d', True, 'fehler', reading)
        self.assertEqual(expected_label, generated_label)

    def test_get_label_subreading_legacy_1(self):
        # this tests an older form of the data where label_suffix for main readings were not added in approved data
        exp = Exporter(rule_classes=[{'value': 'fehler', 'identifier': 'f', 'suffixed_label': True}])
        reading = self.test_data['apparatus'][12]['readings'][3]
        expected_label = 'df'
        generated_label = exp.get_label('d', False, 'fehler', reading)
        self.assertEqual(expected_label, generated_label)

    def test_get_label_subreading_legacy_2(self):
        # this tests an older form of the data where label_suffix for main readings were not added in approved data
        exp = Exporter(rule_classes=[{'value': 'fehler', 'identifier': 'f', 'suffixed_label': False}])
        reading = self.test_data['apparatus'][12]['readings'][3]
        
        expected_label = 'd'
        generated_label = exp.get_label('d', False, 'fehler', reading)
        self.assertEqual(expected_label, generated_label)

    def test_check_for_suffixed_reading_marker(self):
        exp = Exporter()
        reading = self.test_data['apparatus'][12]['readings'][3]
        # adapt the data so we have the right input
        reading['reading_suffix'] = 'K'
        expected_text = ['και πατρος']
        generated_text = exp.check_for_suffixed_reading_marker(['και πατρος'], None, reading)
        self.assertEqual(expected_text, generated_text)

        expected_text = ['και πατρος (K)']
        generated_text = exp.check_for_suffixed_reading_marker(['και πατρος'], 'commentary', reading)
        self.assertEqual(expected_text, generated_text)

    def test_check_for_suffixed_reading_marker_legacy_1(self):
        exp = Exporter(rule_classes=[{'value': 'commentary', 'identifier': 'K', 'suffixed_reading': True}])
        reading = self.test_data['apparatus'][12]['readings'][3]
        expected_text = ['και πατρος (K)']
        generated_text = exp.check_for_suffixed_reading_marker(['και πατρος'], 'commentary', reading)
        self.assertEqual(expected_text, generated_text)

    def test_check_for_suffixed_reading_marker_legacy_2(self):
        exp = Exporter(rule_classes=[{'value': 'commentary', 'identifier': 'K', 'suffixed_reading': False}])
        reading = self.test_data['apparatus'][12]['readings'][3]
        expected_text = ['και πατρος']
        generated_text = exp.check_for_suffixed_reading_marker(['και πατρος'], 'commentary', reading)
        self.assertEqual(expected_text, generated_text)

    def test_make_reading_main_reading(self):
        exp = Exporter()
        reading = self.test_data['apparatus'][6]['readings'][1]
        expected_xml = '<rdg n="b" varSeq="2" wit="1751r L587-S2W14D5">ανθρωπων<wit><idno>1751r</idno><idno>L587-S2W14D5</idno></wit></rdg>'
        xml = exp.make_reading(reading, 1, reading['label'], ['1751r', 'L587-S2W14D5'])
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    def test_make_reading_subreading(self):
        exp = Exporter()
        reading = self.test_data['apparatus'][12]['readings'][3]['subreadings']['abbreviation'][0]
        expected_xml = '<rdg n="dn" type="subreading" cause="abbreviation" varSeq="4" wit="2279* 2494">και πρς<wit><idno>2279*</idno><idno>2494</idno></wit></rdg>'
        xml = exp.make_reading(reading, 3, 'dn', ['2279*', '2494'], True, 'abbreviation')
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    def test_make_reading_om_reading(self):
        exp = Exporter()
        reading = self.test_data['apparatus'][2]['readings'][1]
        expected_xml = '<rdg n="b" type="om" varSeq="2" wit="442">om<wit><idno>442</idno></wit></rdg>'
        xml = exp.make_reading(reading, 1, 'b', ['442'])
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    def test_fix_subreading_suffix(self):
        exp = Exporter()

        expected_suffix = 'of'
        generated_suffix = exp.fix_subreading_suffix('ooff')
        self.assertEqual(expected_suffix, generated_suffix)

        expected_suffix = 'o'
        generated_suffix = exp.fix_subreading_suffix('o')
        self.assertEqual(expected_suffix, generated_suffix)

    def test_app_units(self):
        exp = Exporter()
        app = [self.test_data['apparatus'][6]]
        overtext = self.test_data['overtext'][0]
        context = 'Gal.1.1'

        expected_xml = '<app type="main" n="Gal.1.1" from="16" to="16"><lem wit="basetext">ἀνθρώπου</lem><rdg n="a" varSeq="1" wit="33 69 basetext">ανθρωπου<wit><idno>33</idno><idno>69</idno><idno>basetext</idno></wit></rdg><rdg n="an" type="subreading" cause="abbreviation" varSeq="1" wit="1">ανου<wit><idno>1</idno></wit></rdg><rdg n="b" varSeq="2" wit="1751r">ανθρωπων<wit><idno>1751r</idno></wit></rdg><rdg n="bn" type="subreading" cause="abbreviation" varSeq="2" wit="935">ανων<wit><idno>935</idno></wit></rdg><rdg n="zz" type="lac" varSeq="3" wit="P51">lac<wit><idno>P51</idno></wit></rdg></app>'
        app_units = exp.get_app_units(app, overtext, context, [])
        self.assertEqual(etree.tostring(app_units[0], encoding='UTF-8').decode('UTF-8'), expected_xml)
