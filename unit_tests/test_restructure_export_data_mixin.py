from unittest import TestCase
from unittest.mock import patch
from collation.core.exceptions import MissingSuffixesException
from collation.core.restructure_export_data_mixin import RestructureExportDataMixin
from copy import deepcopy


class RestructureExportDataMixinUnitTests(TestCase):

    def test__strip_keys_1(self):
        """Test that the correct keys are removed.
        """
        data = {'index': '2', 't': 'word', 'interface': 'word'}
        to_remove = ['index', 't']
        expected = {'interface': 'word'}
        mixin = RestructureExportDataMixin()
        result = mixin._strip_keys(data, to_remove)
        self.assertEqual(result, expected)

    def test__strip_keys_2(self):
        """Test that no error is raised if an item in to_remove list is not in the data.
        """
        data = {'index': '2', 't': 'word', 'interface': 'word'}
        to_remove = ['index', 't', 'missing']
        expected = {'interface': 'word'}
        mixin = RestructureExportDataMixin()
        result = mixin._strip_keys(data, to_remove)
        self.assertEqual(result, expected)

    def test__simplify_text_list(self):
        """Test that the correct keys are removed from every item in the text list.
        """
        data = {'witnesses': ['01', '03*'],
                'text': [{'index': '2', 'reading': ['01', '03*'], 'verse': 'Gal.1.2',
                          'interface': 'word1', '01': {}, '03*': {}},
                         {'index': '4', 'reading': ['01', '03*'], 'verse': 'Gal.1.2',
                          'interface': 'word2', '01': {}, '03*': {}}]}
        expected = [{'interface': 'word1'}, {'interface': 'word2'}]
        mixin = RestructureExportDataMixin()
        result = mixin._simplify_text_list(data)
        self.assertEqual(result, expected)

    def test__supply_missing_reading_data_1(self):
        """Test that the missing text_string data is added when it is missing.
        """
        data = {'text': [{'interface': 'my'}, {'interface': 'string'}],
                'reading_classes': ['reconstructed', 'lectionary_influence'],
                'label_suffix': 'r',
                'reading_suffix': 'L'}
        expected = deepcopy(data)
        expected['text_string'] = 'my string'
        mixin = RestructureExportDataMixin()
        mixin.rule_classes = [{'value': 'reconstructed',
                               'identifier': 'r',
                               'suffixed_reading': False,
                               'suffixed_label': True},
                              {'value': 'lectionary_influence',
                               'identifier': 'L',
                               'suffixed_reading': True,
                               'suffixed_label': False}]
        mixin._supply_missing_reading_data(data)
        self.assertEqual(data, expected)

    def test__supply_missing_reading_data_2(self):
        """Test that the missing label_suffix is added when it is needed.
        """
        data = {'text_string': 'my string',
                'text': [{'interface': 'my'}, {'interface': 'string'}],
                'reading_classes': ['reconstructed', 'lectionary_influence'],
                'reading_suffix': 'L'}
        expected = deepcopy(data)  # take a copy to check for changes
        expected['label_suffix'] = 'r'
        mixin = RestructureExportDataMixin()
        mixin.rule_classes = [{'value': 'reconstructed',
                               'identifier': 'r',
                               'suffixed_reading': False,
                               'suffixed_label': True},
                              {'value': 'lectionary_influence',
                               'identifier': 'L',
                               'suffixed_reading': True,
                               'suffixed_label': False}]
        mixin._supply_missing_reading_data(data)
        self.assertEqual(data, expected)

    def test__supply_missing_reading_data_3(self):
        """Test that the missing reading_suffix is added when it is needed.
        """
        data = {'text_string': 'my string',
                'text': [{'interface': 'my'}, {'interface': 'string'}],
                'reading_classes': ['reconstructed', 'lectionary_influence'],
                'label_suffix': 'r'}
        expected = deepcopy(data)
        expected['reading_suffix'] = 'L'
        mixin = RestructureExportDataMixin()
        mixin.rule_classes = [{'value': 'reconstructed',
                               'identifier': 'r',
                               'suffixed_reading': False,
                               'suffixed_label': True},
                              {'value': 'lectionary_influence',
                               'identifier': 'L',
                               'suffixed_reading': True,
                               'suffixed_label': False}]
        mixin._supply_missing_reading_data(data)
        self.assertEqual(data, expected)

    def test__supply_missing_reading_data_5(self):
        """Test that the data is unchanged if the details are already present.
        """
        data = {'text_string': 'my string',
                'text': [{'interface': 'my'}, {'interface': 'string'}],
                'reading_classes': ['reconstructed', 'lectionary_influence'],
                'label_suffix': 'r',
                'reading_suffix': 'L'}
        expected = deepcopy(data)  # take a copy to check for changes
        mixin = RestructureExportDataMixin()
        mixin.rule_classes = [{'value': 'reconstructed',
                               'identifier': 'r',
                               'suffixed_reading': False,
                               'suffixed_label': True},
                              {'value': 'lectionary_influence',
                               'identifier': 'L',
                               'suffixed_reading': True,
                               'suffixed_label': False}]
        mixin._supply_missing_reading_data(data)
        self.assertEqual(data, expected)

    @patch('collation.core.restructure_export_data_mixin.RestructureExportDataMixin._simplify_text_list')
    @patch('collation.core.restructure_export_data_mixin.RestructureExportDataMixin._supply_missing_reading_data')
    def test__clean_reading_1(self, mocked_supply_missing_reading_data, mocked_simplify_text_list):
        """Test that the correct keys are removed from a reading and the correct functions called.
        """
        data = {'witnesses': ['01'],
                'suffixes': [''],
                'SR_text': [],
                'standoff_subreadings': [],
                'text_string': 'my string',
                'text': [{'interface': 'my'}, {'interface': 'string'}],
                'reading_classes': ['reconstructed', 'lectionary_influence'],
                'label_suffix': 'r',
                'reading_suffix': 'L'}
        expected = deepcopy(data)
        del expected['SR_text']
        del expected['standoff_subreadings']
        mocked_supply_missing_reading_data.return_value = data
        mocked_simplify_text_list.return_value = [{'interface': 'my'}, {'interface': 'string'}]
        mixin = RestructureExportDataMixin()
        mixin._clean_reading(data)
        mocked_supply_missing_reading_data.assert_called_once()
        mocked_simplify_text_list.assert_called_once()
        self.assertEqual(data, expected)

    @patch('collation.core.restructure_export_data_mixin.RestructureExportDataMixin._simplify_text_list')
    @patch('collation.core.restructure_export_data_mixin.RestructureExportDataMixin._supply_missing_reading_data')
    def test__clean_reading_2(self,
                              mocked_supply_missing_reading_data,
                              mocked_simplify_text_list):
        """Test that the correct things happen if there is a subreading.
        """
        self.maxDiff = None
        subreading_1 = {'witnesses': ['02'], 'suffixes': [''], 'SR_text': [], 'text_string': 'first subreading',
                        'text': [{'interface': 'first'}, {'interface': 'subreading'}]}
        subreading_2 = {'witnesses': ['03'], 'suffixes': [''], 'SR_text': [], 'text_string': 'second subreading',
                        'text': [{'interface': 'second'}, {'interface': 'subreading'}]}
        data = {'witnesses': ['01'],
                'suffixes': [''],
                'SR_text': [],
                'standoff_subreadings': [],
                'text_string': 'my string',
                'text': [{'interface': 'my'}, {'interface': 'string'}],
                'reading_classes': ['reconstructed', 'lectionary_influence'],
                'label_suffix': 'r',
                'reading_suffix': 'L',
                'subreadings': {'orthographic': [subreading_1], 'regularised': [subreading_2]}}
        expected = deepcopy(data)
        del expected['SR_text']
        del expected['standoff_subreadings']
        del expected['subreadings']['orthographic'][0]['SR_text']
        del expected['subreadings']['regularised'][0]['SR_text']
        mocked_supply_missing_reading_data.side_effect = [data, subreading_1, subreading_2]
        mocked_simplify_text_list.side_effect = [[{'interface': 'my'}, {'interface': 'string'}],
                                                 [{'interface': 'first'}, {'interface': 'subreading'}],
                                                 [{'interface': 'second'}, {'interface': 'subreading'}]]
        mixin = RestructureExportDataMixin()
        mixin._clean_reading(data)
        self.assertEqual(mocked_supply_missing_reading_data.call_count, 3)
        self.assertEqual(mocked_simplify_text_list.call_count, 3)
        self.assertEqual(data, expected)

    def test__clean_reading_3(self):
        """Test that an exception is raised if there is no suffix list.
        """
        data = {'witnesses': ['01'],
                'SR_text': [],
                'standoff_subreadings': [],
                'text_string': 'my string',
                'text': [{'interface': 'my'}, {'interface': 'string'}],
                'reading_classes': ['reconstructed', 'lectionary_influence'],
                'label_suffix': 'r',
                'reading_suffix': 'L'}
        mixin = RestructureExportDataMixin()
        self.assertRaises(MissingSuffixesException, mixin._clean_reading, data)

    @patch('collation.core.restructure_export_data_mixin.RestructureExportDataMixin._clean_reading')
    def test_clean_variant_unit_1(self, mocked_clean_reading):
        """Test that the right keys are removed and clean reading is called for each reading.
        """
        mocked_clean_reading.side_effect = [{}, {}]
        data = {'_id': '123', 'start': 2, 'end': 2, 'first_word_index': '2.1',
                'overlap_units': [], 'readings': [{}, {}]}
        expected = deepcopy(data)
        del expected['_id']
        del expected['first_word_index']
        del expected['overlap_units']
        mixin = RestructureExportDataMixin()
        mixin._clean_variant_unit(data)
        self.assertEqual(mocked_clean_reading.call_count, 2)
        self.assertEqual(data, expected)

    @patch('collation.core.restructure_export_data_mixin.RestructureExportDataMixin._clean_reading')
    def test_clean_variant_unit_2(self, mocked_clean_reading):
        """Test that the no error is raised if any of the keys to delete are not present in the data.
        """
        mocked_clean_reading.side_effect = [{}, {}]
        data = {'_id': '123', 'start': 2, 'end': 2, 'first_word_index': '2.1', 'readings': [{}, {}]}
        expected = deepcopy(data)
        del expected['_id']
        del expected['first_word_index']
        mixin = RestructureExportDataMixin()
        mixin._clean_variant_unit(data)
        self.assertEqual(mocked_clean_reading.call_count, 2)
        self.assertEqual(data, expected)

    @patch('collation.core.restructure_export_data_mixin.RestructureExportDataMixin._clean_reading')
    def test_clean_variant_unit_3(self, mocked_clean_reading):
        """Test that the this function raises an error if _clean_reading does.
        """
        mocked_clean_reading.side_effect = [{}, MissingSuffixesException('suffixes missing')]
        data = {'_id': '123', 'start': 2, 'end': 2, 'first_word_index': '2.1',
                'overlap_units': [], 'readings': [{}, {}]}
        expected = deepcopy(data)
        del expected['_id']
        del expected['first_word_index']
        del expected['overlap_units']
        mixin = RestructureExportDataMixin()
        self.assertRaises(MissingSuffixesException, mixin._clean_variant_unit, data)

    @patch('collation.core.restructure_export_data_mixin.RestructureExportDataMixin._clean_variant_unit')
    @patch('collation.core.restructure_export_data_mixin.RestructureExportDataMixin._strip_keys')
    def test_clean_collation_unit_1(self, mocked_strip_keys, mocked_clean_variant_unit):
        """Test that the right keys are removed and _clean_variant_unit is called correctly.
        """
        data = {'context': 'Gal.1.1',
                'structure': {'special_categories': [], 'marked_readings': {}, 'apparatus': [{}, {}],
                              'overtext': [{'tokens': [{}, {}, {}]}]}}
        expected = deepcopy(data)
        del expected['structure']['special_categories']
        del expected['structure']['marked_readings']
        expected['structure']['overtext'] = [{}, {}, {}]
        mocked_strip_keys.side_effect = [{}, {}, {}]
        mocked_clean_variant_unit.side_effect = [{}, {}]
        mixin = RestructureExportDataMixin()
        mixin.clean_collation_unit(data)
        self.assertEqual(mocked_strip_keys.call_count, 3)
        self.assertEqual(mocked_clean_variant_unit.call_count, 2)
        self.assertEqual(data, expected)

    @patch('collation.core.restructure_export_data_mixin.RestructureExportDataMixin._clean_variant_unit')
    @patch('collation.core.restructure_export_data_mixin.RestructureExportDataMixin._strip_keys')
    def test_clean_collation_unit_2(self, mocked_strip_keys, mocked_clean_variant_unit):
        """Test that the right keys are removed if the keys being removed are already missing.
        """
        data = {'context': 'Gal.1.1',
                'structure': {'marked_readings': {}, 'apparatus': [{}, {}],
                              'overtext': [{'tokens': [{}, {}, {}]}]}}
        expected = deepcopy(data)
        del expected['structure']['marked_readings']
        expected['structure']['overtext'] = [{}, {}, {}]
        mocked_strip_keys.side_effect = [{}, {}, {}]
        mocked_clean_variant_unit.side_effect = [{}, {}]
        mixin = RestructureExportDataMixin()
        mixin.clean_collation_unit(data)
        self.assertEqual(mocked_strip_keys.call_count, 3)
        self.assertEqual(mocked_clean_variant_unit.call_count, 2)
        self.assertEqual(data, expected)

    @patch('collation.core.restructure_export_data_mixin.RestructureExportDataMixin._clean_variant_unit')
    @patch('collation.core.restructure_export_data_mixin.RestructureExportDataMixin._strip_keys')
    def test_clean_collation_unit_3(self, mocked_strip_keys, mocked_clean_variant_unit):
        """Test that this function raises an exception if the called function does.
        """
        data = {'context': 'Gal.1.1',
                'structure': {'special_categories': [], 'marked_readings': {}, 'apparatus': [{}, {}],
                              'overtext': [{'tokens': [{}, {}, {}]}]}}
        expected = deepcopy(data)
        del expected['structure']['special_categories']
        del expected['structure']['marked_readings']
        expected['structure']['overtext'] = [{}, {}, {}]
        mocked_strip_keys.side_effect = [{}, {}, {}]
        mocked_clean_variant_unit.side_effect = [{}, MissingSuffixesException('suffixes missing')]
        mixin = RestructureExportDataMixin()
        self.assertRaises(MissingSuffixesException, mixin.clean_collation_unit, data)
