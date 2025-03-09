from unittest import TestCase
from unittest.mock import patch, call
import xml.etree.ElementTree as etree
from collation.core.exporter import Exporter


class ExporterUnitTests(TestCase):

    BASE_UNIT = {
            '_id': 'b236b6d444ace44590ff97c1c95499df',
            'end': 8,
            'start': 6,
            'readings': [
              {
                '_id': '58aebee1743da8ee68cd0144168c79b9',
                'text': [
                  {
                    '5': {
                      't': 'υιον',
                      'index': '6',
                      'siglum': '5',
                      'original': 'υιον',
                      'rule_match': [
                        'υιον'
                      ]
                    },
                    '35': {
                      't': 'υιον',
                      'index': '6',
                      'siglum': '35',
                      'original': 'υιον',
                      'rule_match': [
                        'υιον'
                      ]
                    },
                    '38': {
                      't': 'υιον',
                      'index': '6',
                      'siglum': '38',
                      'original': 'υιον',
                      'rule_match': [
                        'υιον'
                      ]
                    },
                    '02': {
                      'n': 'υιον',
                      't': 'υν',
                      'index': '6',
                      'nomSac': True,
                      'siglum': '02',
                      'original': '[υν]',
                      'supplied': True,
                      'rule_match': [
                        '[υν]'
                      ],
                      'decision_class': [
                        'reconstructed'
                      ],
                      'decision_details': [
                        {
                          'n': 'υιον',
                          't': '[υν]',
                          'id': 216662,
                          'class': 'reconstructed',
                          'scope': 'once'
                        }
                      ]
                    },
                    'index': '6',
                    'verse': 'Gal.1.16',
                    'reading': [
                      '35',
                      '38',
                      '5',
                      'L23-S3W4D1',
                      'basetext',
                      '02'
                    ],
                    'basetext': {
                      't': 'υιον',
                      'index': '6',
                      'lemma': 'υιον',
                      'siglum': 'basetext',
                      'original': 'υἱὸν',
                      'rule_match': [
                        'υιον'
                      ]
                    },
                    'interface': 'υιον',
                    'L23-S3W4D1': {
                      't': 'υιον',
                      'index': '6',
                      'siglum': 'L23-S3W4D1',
                      'original': 'υιον',
                      'rule_match': [
                        'υιον'
                      ]
                    }
                  },
                  {
                    '5': {
                      't': 'αυτου',
                      'index': '8',
                      'siglum': '5',
                      'original': 'αυτου',
                      'rule_match': [
                        'αυτου'
                      ]
                    },
                    '35': {
                      't': 'αυτου',
                      'index': '8',
                      'siglum': '35',
                      'original': 'αυτου',
                      'rule_match': [
                        'αυτου'
                      ]
                    },
                    '38': {
                      't': 'αυτου',
                      'index': '8',
                      'siglum': '38',
                      'original': 'αυτου',
                      'rule_match': [
                        'αυτου'
                      ]
                    },
                    '02': {
                      't': 'αυτου',
                      'index': '8',
                      'siglum': '02',
                      'original': 'αυτου',
                      'rule_match': [
                        'αυτου'
                      ]
                    },
                    'index': '8',
                    'verse': 'Gal.1.16',
                    'reading': [
                      '35',
                      '38',
                      '5',
                      'L23-S3W4D1',
                      'basetext',
                      '02'
                    ],
                    'basetext': {
                      't': 'αυτου',
                      'index': '8',
                      'lemma': 'αυτου',
                      'siglum': 'basetext',
                      'original': 'αὐτοῦ',
                      'rule_match': [
                        'αυτου'
                      ]
                    },
                    'interface': 'αυτου',
                    'L23-S3W4D1': {
                      't': 'αυτου',
                      'index': '8',
                      'siglum': 'L23-S3W4D1',
                      'original': 'αυτου',
                      'rule_match': [
                        'αυτου'
                      ]
                    }
                  }
                ],
                'label': 'a',
                'SR_text': {
                  '2574-2': {
                    'text': [],
                    'type': 'om'
                  }
                },
                'suffixes': [
                  'V',
                  '',
                  '',
                  '',
                  '',
                  ''
                ],
                'witnesses': [
                  '02',
                  '5',
                  '35',
                  '38',
                  'L23-S3W4D1',
                  'basetext'
                ],
                'subreadings': {
                  'abbreviation': [
                    {
                      'text': [
                        {
                          '1': {
                            'n': 'υιον',
                            't': 'υν',
                            'index': '6',
                            'nomSac': True,
                            'siglum': '1',
                            'original': 'υν',
                            'rule_match': [
                              'υν'
                            ],
                            'decision_class': [
                              'abbreviation'
                            ],
                            'decision_details': [
                              {
                                'n': 'υιον',
                                't': 'υν',
                                'id': 216738,
                                'class': 'abbreviation',
                                'scope': 'once'
                              }
                            ]
                          },
                          'index': '6',
                          'verse': 'Gal.1.16',
                          'reading': [
                            '1',
                            'L60-S3W3D1'
                          ],
                          'interface': 'υιον',
                          'L60-S3W3D1': {
                            'n': 'υιον',
                            't': 'υν',
                            'index': '6',
                            'nomSac': True,
                            'siglum': 'L60-S3W3D1',
                            'original': 'υν',
                            'rule_match': [
                              'υν'
                            ],
                            'decision_class': [
                              'abbreviation'
                            ],
                            'decision_details': [
                              {
                                'n': 'υιον',
                                't': 'υν',
                                'id': 217381,
                                'class': 'abbreviation',
                                'scope': 'once'
                              }
                            ]
                          }
                        },
                        {
                          '1': {
                            't': 'αυτου',
                            'index': '8',
                            'siglum': '1',
                            'original': 'αυτου',
                            'rule_match': [
                              'αυτου'
                            ]
                          },
                          'index': '8',
                          'verse': 'Gal.1.16',
                          'reading': [
                            '1',
                            'L60-S3W3D1'
                          ],
                          'interface': 'αυτου',
                          'L60-S3W3D1': {
                            't': 'αυτου',
                            'index': '8',
                            'siglum': 'L60-S3W3D1',
                            'original': 'αυτου',
                            'rule_match': [
                              'αυτου'
                            ]
                          }
                        }
                      ],
                      'suffix': 'n',
                      'suffixes': [
                        '',
                        ''
                      ],
                      'witnesses': [
                        '1',
                        'L60-S3W3D1'
                      ],
                      'text_string': 'υν αυτου'
                    },
                    {
                      'text': [
                        {
                          '0278': {
                            'n': 'υιον',
                            't': 'υιν',
                            'index': '6',
                            'nomSac': True,
                            'siglum': '0278',
                            'original': 'υιν',
                            'rule_match': [
                              'υιν'
                            ],
                            'decision_class': [
                              'abbreviation'
                            ],
                            'decision_details': [
                              {
                                'n': 'υιον',
                                't': 'υιν',
                                'id': 216731,
                                'class': 'abbreviation',
                                'scope': 'once'
                              }
                            ]
                          },
                          'index': '6',
                          'verse': 'Gal.1.16',
                          'reading': [
                            '0278'
                          ],
                          'interface': 'υιον'
                        },
                        {
                          '0278': {
                            't': 'αυτου',
                            'index': '8',
                            'siglum': '0278',
                            'original': 'αυτου',
                            'rule_match': [
                              'αυτου'
                            ]
                          },
                          'index': '8',
                          'verse': 'Gal.1.16',
                          'reading': [
                            '0278'
                          ],
                          'interface': 'αυτου'
                        }
                      ],
                      'suffix': 'n',
                      'suffixes': [
                        ''
                      ],
                      'witnesses': [
                        '0278'
                      ],
                      'text_string': 'υιν αυτου'
                    }
                  ]
                },
                'text_string': 'υιον αυτου'
              },
              {
                '_id': 'ec1147ec8fac61b27144abbc40eb8e75',
                'text': [],
                'type': 'lac',
                'label': 'zz',
                'SR_text': {
                  '04': {
                    'text': [],
                    'type': 'lac_verse',
                    'details': 'lac verse'
                  },
                  'P51': {
                    'text': [
                      {
                        'P51': {
                          'n': 'υιον',
                          't': 'υιον',
                          'index': '6',
                          'siglum': 'P51',
                          'unclear': True,
                          'original': 'υ_[ιον]',
                          'supplied': True,
                          'interface': 'υ_[ιον]',
                          'rule_match': [
                            'υ_[ιον]'
                          ]
                        },
                        'index': '6',
                        'verse': 'Gal.1.16',
                        'reading': [
                          'P51'
                        ],
                        'interface': 'υ_[ιον]'
                      },
                      {
                        'P51': {
                          'n': 'αυτου',
                          't': 'αυτου',
                          'index': '8',
                          'siglum': 'P51',
                          'original': '[αυτου]',
                          'supplied': True,
                          'interface': '[αυτου]',
                          'rule_match': [
                            '[αυτου]'
                          ]
                        },
                        'index': '8',
                        'verse': 'Gal.1.16',
                        'reading': [
                          'P51'
                        ],
                        'interface': '[αυτου]'
                      }
                    ]
                  }
                },
                'created': True,
                'details': 'lac',
                'suffixes': [
                  '',
                  ''
                ],
                'witnesses': [
                  'P51',
                  '04'
                ],
                'text_string': '&lt;lac&gt;',
                'standoff_subreadings': [
                  '04',
                  'P51'
                ]
              }
            ],
            'first_word_index': '6'
          }

    def test_get_text_main_reading(self):
        """Test getting the main reading text.
        """
        exp = Exporter()
        reading = {'_id': 'abc',
                   'text': [{}, {}],
                   'label': 'a',
                   'text_string': 'my text',
                   'subreadings': {'abbreviation': [{'text_string': 'my subreading text', 'text': [{}, {}, {}]}]}}
        expected_text = ['my text']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_subreading(self):
        """Test getting the subreading text.
        """
        exp = Exporter()
        reading = {'_id': 'abc',
                   'text': [{}, {}],
                   'label': 'a',
                   'text_string': 'my text',
                   'subreadings': {'abbreviation': [{'text_string': 'my subreading text', 'text': [{}, {}, {}]}]}}
        expected_text = ['my subreading text']
        generated_text = exp.get_text(reading['subreadings']['abbreviation'][0], is_subreading=True)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_om(self):
        """Test getting the text if the text is omitted.
        """
        exp = Exporter()
        reading = {'_id': 'abc',
                   'text': [],
                   'type': 'om',
                   'label': 'b',
                   'suffixes': [''],
                   'witnesses': ['1838'],
                   'text_string': 'om.'}
        expected_text = ['om.', 'om']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_om_verse(self):
        """Test getting the text if the entire collation unit is omitted but no details are given.
        """
        exp = Exporter()
        reading = {'_id': 'abc',
                   'text': [],
                   'text_string': '&lt;om unit&gt;',
                   'label': 'b',
                   'suffixes': ['', ''],
                   'type': 'om_verse',
                   'witnesses': ['467', '1959']}
        expected_text = ['om.', 'om']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_om_verse_details(self):
        """Test getting the text if the entire collation unit is omitted and details are given.
        """
        exp = Exporter()
        reading = {'_id': 'abc',
                   'text': [],
                   'text_string': '&lt;om unit&gt;',
                   'details': 'om unit',
                   'label': 'b',
                   'suffixes': ['', ''],
                   'type': 'om_verse',
                   'witnesses': ['467', '1959']}
        expected_text = ['om unit', 'om']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_lac(self):
        """Test getting the text if the reading is lac.
        """
        exp = Exporter()
        reading = {'_id': 'abc',
                   'text': [],
                   'text_string': '&lt;lac&gt;',
                   'label': 'zz',
                   'suffixes': ['', ''],
                   'type': 'lac',
                   'witnesses': ['467', '1959']}
        expected_text = ['lac.', 'lac']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_lac_verse(self):
        """Test getting the text if the entire unit is lac but no details are given.
        """
        exp = Exporter()
        reading = {'_id': 'abc',
                   'text': [],
                   'text_string': '&lt;lac unit&gt;',
                   'label': 'zz',
                   'suffixes': ['', ''],
                   'type': 'lac_verse',
                   'witnesses': ['467', '1959']}
        expected_text = ['lac.', 'lac']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_lac_verse_details(self):
        """Test getting the text if the reading is lac and details are given.
        """
        exp = Exporter()
        reading = {'_id': 'abc',
                   'text': [],
                   'text_string': '&lt;lac unit&gt;',
                   'details': 'lac unit',
                   'label': 'zz',
                   'suffixes': ['', ''],
                   'type': 'lac_verse',
                   'witnesses': ['467', '1959']}
        expected_text = ['lac unit', 'lac']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_lac_special_category_details(self):
        """Test getting the text if the reading is lac and there are special categories to apply.
        """
        exp = Exporter()
        reading = {'_id': 'abc',
                   'text': [],
                   'text_string': '&lt;abbreviated text&gt;',
                   'details': 'abbreviated text',
                   'label': 'zz',
                   'suffixes': ['', ''],
                   'type': 'lac_verse',
                   'witnesses': ['467', '1959']}
        expected_text = ['abbreviated text', 'lac']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_overlapped(self):
        """Test getting the text if the reading has been overlapped.
        """
        exp = Exporter()
        reading = {'_id': 'abc',
                   'text': [],
                   'label': 'zu',
                   'suffixes': [''],
                   'witnesses': ['1929*'],
                   'text_string': 'overlapped',
                   'overlap_status': 'overlapped'}
        expected_text = ['', 'overlapped']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_lemma_text(self):
        """Tests to check lemma text extraction without punctuation.
        """
        exp = Exporter()
        # simplified version of overtext data for testing
        overtext = {'current': [{'original': 'this'},
                                {'original': 'is'},
                                {'original': 'the'},
                                {'original': 'lemma'},
                                {'original': 'text'},
                                {'original': 'for'},
                                {'original': 'a'},
                                {'original': 'unit'},
                                {'original': 'verse',
                                 'pc_after': ')',
                                 'pc_before': '('}]}

        # test a few ranges where there is data
        expected_text = ['this is the']
        generated_text = exp.get_lemma_text(overtext, '2', '6')
        self.assertEqual(expected_text, generated_text)

        expected_text = ['text']
        generated_text = exp.get_lemma_text(overtext, '10', '10')
        self.assertEqual(expected_text, generated_text)

        expected_text = ['this']
        generated_text = exp.get_lemma_text(overtext, '1', '3')
        self.assertEqual(expected_text, generated_text)

        expected_text = ['this']
        generated_text = exp.get_lemma_text(overtext, '0', '3')
        self.assertEqual(expected_text, generated_text)

        expected_text = ['is the lemma text for']
        generated_text = exp.get_lemma_text(overtext, '3', '12')
        self.assertEqual(expected_text, generated_text)

        # test where there is no data
        expected_text = ['', 'om']
        generated_text = exp.get_lemma_text(overtext, '9', '9')
        self.assertEqual(expected_text, generated_text)

        expected_text = ['', 'om']
        generated_text = exp.get_lemma_text(overtext, '1', '1')
        self.assertEqual(expected_text, generated_text)

    def test_get_lemma_text_with_punctuation(self):
        """Tests to check lemma text extraction with punctuation.
        """
        exp = Exporter(include_punctuation=True)
        # simplified version of overtext data for testing
        overtext = {'current': [{'original': 'this'},
                                {'original': 'is'},
                                {'original': 'the'},
                                {'original': 'lemma'},
                                {'original': 'text'},
                                {'original': 'for'},
                                {'original': 'a'},
                                {'original': 'unit'},
                                {'original': 'verse',
                                 'pc_after': ')',
                                 'pc_before': '('}]}

        expected_text = ['(verse)']
        generated_text = exp.get_lemma_text(overtext, '18', '18')
        self.assertEqual(expected_text, generated_text)

        expected_text = ['unit (verse)']
        generated_text = exp.get_lemma_text(overtext, '16', '18')
        self.assertEqual(expected_text, generated_text)

    def test_get_witnesses(self):
        """Test get witnesses with and without a to_remove list.
        """
        exp = Exporter()
        reading = {'witnesses': ['02', '5', '35', '38*', 'L23-S3W4D1', 'basetext'],
                   'suffixes': ['V', '', 'r', '', '', '']}

        expected_witnesses = ['02V', '5', '35r', '38*', 'L23-S3W4D1', 'basetext']
        generated_witnesses = exp.get_witnesses(reading, [])
        self.assertEqual(expected_witnesses, generated_witnesses)

        expected_witnesses = ['02V', '35r', '38*', 'L23-S3W4D1']
        generated_witnesses = exp.get_witnesses(reading, ['5', 'basetext'])
        self.assertEqual(expected_witnesses, generated_witnesses)

    def test_get_label_main_reading_1(self):
        """Test get main reading label with no suffix.
        """
        exp = Exporter()
        reading = {'_id': 'abc', 'label': 'b'}
        expected_label = 'b'
        generated_label = exp.get_label('b', False, reading)
        self.assertEqual(expected_label, generated_label)

    def test_get_label_main_reading_2(self):
        """Test get main reading label with a label_suffix.
        """
        exp = Exporter()
        reading = {'_id': 'abc', 'label': 'b', 'label_suffix': 'f'}
        expected_label = 'bf'
        generated_label = exp.get_label('b', False, reading)
        self.assertEqual(expected_label, generated_label)

    def test_get_label_subreading(self):
        """Test get subreading label. Note that subreading labels are calculated before we get here and are simply
        returned.
        """
        exp = Exporter()
        reading = {'_id': 'def', 'suffix': 'f'}
        expected_label = 'bf'
        generated_label = exp.get_label('bf', True, reading)
        self.assertEqual(expected_label, generated_label)

    def test_check_for_suffixed_reading_marker_with_marker(self):
        """Test the reading suffix is added to the text if there is one.
        """
        exp = Exporter()
        reading = {'text_string': 'my text', 'reading_suffix': 'K'}
        expected_text = ['my text (K)']
        generated_text = exp.check_for_suffixed_reading_marker(['my text'], reading)
        self.assertEqual(expected_text, generated_text)

    def test_check_for_suffixed_reading_marker_without_marker(self):
        """Test the the text is returned unchanged if there is no reading suffix.
        """
        exp = Exporter()
        reading = {'text_string': 'my text'}
        expected_text = ['my text']
        generated_text = exp.check_for_suffixed_reading_marker(['my text'], reading)
        self.assertEqual(expected_text, generated_text)

    def test_fix_subreading_suffix(self):
        exp = Exporter()

        expected_suffix = 'of'
        generated_suffix = exp.fix_subreading_suffix('ooff')
        self.assertEqual(expected_suffix, generated_suffix)

        expected_suffix = 'o'
        generated_suffix = exp.fix_subreading_suffix('o')
        self.assertEqual(expected_suffix, generated_suffix)

    @patch('collation.core.exporter.Exporter.check_for_suffixed_reading_marker')
    @patch('collation.core.exporter.Exporter.get_text')
    @patch('collation.core.exporter.Exporter.get_label')
    def test_make_reading_main_reading_1(self,
                                         mocked_get_label,
                                         mocked_get_text,
                                         mocked_check_for_suffixed_reading_marker):
        """Test make_reading for a main reading with a single witness and a simple label.
        """
        mocked_get_label.return_value = 'b'
        mocked_get_text.return_value = ['και']
        mocked_check_for_suffixed_reading_marker.return_value = ['και']
        # set required args so they are easier to see in the test
        reading = None  # we don't actually need one because the functions that use it are mocked
        index_position = 1
        reading_label = 'b'
        witnesses = ['6']
        exp = Exporter()
        expected_xml = '<rdg n="b" varSeq="2" wit="6">και<wit><idno>6</idno></wit></rdg>'
        xml = exp.make_reading(reading, index_position, reading_label, witnesses)
        # check the right things are passed to the mocked functions
        mocked_get_label.assert_called_with(reading_label, False, reading)
        mocked_get_text.assert_called_with(reading, False)
        mocked_check_for_suffixed_reading_marker.assert_called_with(['και'], reading)
        # check the result
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.check_for_suffixed_reading_marker')
    @patch('collation.core.exporter.Exporter.get_text')
    @patch('collation.core.exporter.Exporter.get_label')
    def test_make_reading_main_reading_2(self,
                                         mocked_get_label,
                                         mocked_get_text,
                                         mocked_check_for_suffixed_reading_marker):
        """Test make_reading for a main reading with multiple witnesses and a complex label.
        """
        mocked_get_label.return_value = 'cf'
        mocked_get_text.return_value = ['κι']
        mocked_check_for_suffixed_reading_marker.return_value = ['κι']
        # set required args so they are easier to see in the test
        reading = None  # we don't actually need one because the functions that use it are mocked
        index_position = 2
        reading_label = 'c'
        witnesses = ['6', '7']
        exp = Exporter()
        expected_xml = '<rdg n="cf" varSeq="3" wit="6 7">κι<wit><idno>6</idno><idno>7</idno></wit></rdg>'
        xml = exp.make_reading(reading, index_position, reading_label, witnesses)
        # check the right things are passed to the mocked functions
        mocked_get_label.assert_called_with(reading_label, False, reading)
        mocked_get_text.assert_called_with(reading, False)
        mocked_check_for_suffixed_reading_marker.assert_called_with(['κι'], reading)
        # check the result
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.check_for_suffixed_reading_marker')
    @patch('collation.core.exporter.Exporter.get_text')
    @patch('collation.core.exporter.Exporter.get_label')
    def test_make_reading_subreading(self,
                                     mocked_get_label,
                                     mocked_get_text,
                                     mocked_check_for_suffixed_reading_marker):
        """Test make_reading for a subreading.
        """
        mocked_get_label.return_value = 'af'
        mocked_get_text.return_value = ['om.', 'om']
        mocked_check_for_suffixed_reading_marker.return_value = ['om.', 'om']
        # set required args so they are easier to see in the test
        reading = None  # we don't actually need one because the functions that use it are mocked
        index_position = 1
        reading_label = 'af'  # subreadings have pre-compiled labels in the data
        witnesses = ['206*']
        subreading = True
        subreading_subtype = 'fehler'
        exp = Exporter()
        expected_xml = ('<rdg n="af" type="subreading" cause="fehler" varSeq="2" wit="206*">om.<wit>'
                        '<idno>206*</idno></wit></rdg>')
        xml = exp.make_reading(reading, index_position, reading_label, witnesses, subreading, subreading_subtype)
        # check the right things are passed to the mocked functions
        mocked_get_label.assert_called_with(reading_label, subreading, reading)
        mocked_get_text.assert_called_with(reading, subreading)
        mocked_check_for_suffixed_reading_marker.assert_called_with(['om.', 'om'], reading)
        # check the result
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.check_for_suffixed_reading_marker')
    @patch('collation.core.exporter.Exporter.get_text')
    @patch('collation.core.exporter.Exporter.get_label')
    def test_make_reading_om_reading(self,
                                     mocked_get_label,
                                     mocked_get_text,
                                     mocked_check_for_suffixed_reading_marker):
        """Test make_reading for an om reading.
        """
        mocked_get_label.return_value = 'b'
        mocked_get_text.return_value = ['om.', 'om']
        mocked_check_for_suffixed_reading_marker.return_value = ['om.', 'om']
        # set required args so they are easier to see in the test
        reading = None  # we don't actually need one because the functions that use it are mocked
        index_position = 1
        reading_label = 'b'
        witnesses = ['1838']
        exp = Exporter()
        expected_xml = '<rdg n="b" type="om" varSeq="2" wit="1838">om.<wit><idno>1838</idno></wit></rdg>'
        xml = exp.make_reading(reading, index_position, reading_label, witnesses)
        # check the right things are passed to the mocked functions
        mocked_get_label.assert_called_with(reading_label, False, reading)
        mocked_get_text.assert_called_with(reading, False)
        mocked_check_for_suffixed_reading_marker.assert_called_with(['om.', 'om'], reading)
        # check the result
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.check_for_suffixed_reading_marker')
    @patch('collation.core.exporter.Exporter.get_text')
    @patch('collation.core.exporter.Exporter.get_label')
    def test_make_reading_lac_verse_reading(self,
                                            mocked_get_label,
                                            mocked_get_text,
                                            mocked_check_for_suffixed_reading_marker):
        """Test make_reading for a lac reading.
        """
        mocked_get_label.return_value = 'b'
        mocked_get_text.return_value = ['lac.', 'lac']
        mocked_check_for_suffixed_reading_marker.return_value = ['lac.', 'lac']
        # set required args so they are easier to see in the test
        reading = None  # we don't actually need one because the functions that use it are mocked
        index_position = 1
        reading_label = 'zz'
        witnesses = ['1838']
        exp = Exporter()
        expected_xml = '<rdg n="b" type="lac" varSeq="2" wit="1838">lac.<wit><idno>1838</idno></wit></rdg>'
        xml = exp.make_reading(reading, index_position, reading_label, witnesses)
        # check the right things are passed to the mocked functions
        mocked_get_label.assert_called_with(reading_label, False, reading)
        mocked_get_text.assert_called_with(reading, False)
        mocked_check_for_suffixed_reading_marker.assert_called_with(['lac.', 'lac'], reading)
        # check the result
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.check_for_suffixed_reading_marker')
    @patch('collation.core.exporter.Exporter.get_text')
    @patch('collation.core.exporter.Exporter.get_label')
    def test_make_reading_overlapped_verse_reading(self,
                                                   mocked_get_label,
                                                   mocked_get_text,
                                                   mocked_check_for_suffixed_reading_marker):
        """Test make_reading for an overlapped reading.
        """
        mocked_get_label.return_value = 'b'
        mocked_get_text.return_value = ['', 'overlapped']
        mocked_check_for_suffixed_reading_marker.return_value = ['', 'overlapped']
        # set required args so they are easier to see in the test
        reading = None  # we don't actually need one because the functions that use it are mocked
        index_position = 1
        reading_label = 'zu'
        witnesses = ['1838']
        exp = Exporter()
        expected_xml = '<rdg n="b" type="overlapped" varSeq="2" wit="1838"><wit><idno>1838</idno></wit></rdg>'
        xml = exp.make_reading(reading, index_position, reading_label, witnesses)
        # check the right things are passed to the mocked functions
        mocked_get_label.assert_called_with(reading_label, False, reading)
        mocked_get_text.assert_called_with(reading, False)
        mocked_check_for_suffixed_reading_marker.assert_called_with(['', 'overlapped'], reading)
        # check the result
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.make_reading')
    @patch('collation.core.exporter.Exporter.get_witnesses')
    @patch('collation.core.exporter.Exporter.get_lemma_text')
    def test_get_app_units_positive_apparatus(self,
                                              mocked_get_lemma_text,
                                              mocked_get_witnesses,
                                              mocked_make_reading):
        """Test get_app_units on a positive apparatus with no subreadings.
        """
        mocked_get_lemma_text.side_effect = [['my lemma'], ['here'], ['', 'om']]
        mocked_get_witnesses.side_effect = [['basetext', '6'], ['7', '8'], ['basetext'], ['7', '8'],
                                            ['6'], ['basetext', '8'], ['6', '7']]
        mocked_make_reading.side_effect = [etree.fromstring('<rdg n="a" varSeq="1" wit="basetext 6">my lemma<wit>'
                                                            '<idno>basetext</idno><idno>6</idno></wit></rdg>'),
                                           etree.fromstring('<rdg n="b" varSeq="2" wit="7 8">my lema<wit>'
                                                            '<idno>7</idno><idno>8</idno></wit></rdg>'),
                                           etree.fromstring('<rdg n="a" varSeq="1" wit="basetext">here<wit>'
                                                            '<idno>basetext</idno></wit></rdg>'),
                                           etree.fromstring('<rdg n="b" varSeq="2" wit="7 8">my lema<wit>'
                                                            '<idno>7</idno><idno>8</idno></wit></rdg>'),
                                           etree.fromstring('<rdg n="c" type="om" cause="fehlerMR" varSeq="3" '
                                                            'wit="6">om.<wit><idno>6</idno></wit></rdg>'),
                                           etree.fromstring('<rdg n="a" varSeq="1" wit="basetext 8">om.<wit>'
                                                            '<idno>basetext</idno><idno>8</idno></wit></rdg>'),
                                           etree.fromstring('<rdg n="b" varSeq="2" wit="6 7">addition<wit>'
                                                            '<idno>6</idno><idno>7</idno></wit></rdg>')]
        context = 'Gal.1.1'
        overtext = {'current': {'id': 'basetext'}}
        # give it just enough to control the loops and stop calls breaking (data seems to be needed even though they
        # are mocked)
        apparatus = [{'start': 2, 'end': 4, 'readings': [{'label': 'a'}, {'label': 'b'}]},
                     {'start': 6, 'end': 6, 'readings': [{'label': 'a'}, {'label': 'b'}, {'label': 'c',
                                                                                          'reading_classes': ['fehlerMR']  # NoQA
                                                                                          }]},
                     {'start': 7, 'end': 7, 'readings': [{'label': 'a'}, {'label': 'b'}]}]
        missing = []
        exp = Exporter()
        exp.overtext_siglum = 'basetext'
        expected_xml = [('<app type="main" n="Gal.1.1" from="2" to="4"><lem wit="basetext">my lemma</lem>'
                         '<rdg n="a" varSeq="1" wit="basetext 6">my lemma<wit><idno>basetext</idno><idno>6</idno></wit>'
                         '</rdg><rdg n="b" varSeq="2" wit="7 8">my lema<wit><idno>7</idno><idno>8</idno></wit>'
                         '</rdg></app>'),
                        ('<app type="main" n="Gal.1.1" from="6" to="6"><lem wit="basetext">here</lem>'
                         '<rdg n="a" varSeq="1" wit="basetext">here<wit><idno>basetext</idno></wit></rdg>'
                         '<rdg n="b" varSeq="2" wit="7 8">my lema<wit><idno>7</idno><idno>8</idno></wit></rdg>'
                         '<rdg n="c" type="om" cause="fehlerMR" varSeq="3" wit="6">om.<wit><idno>6</idno></wit>'
                         '</rdg></app>'),
                        ('<app type="main" n="Gal.1.1" from="7" to="7"><lem wit="basetext" type="om" />'
                         '<rdg n="a" varSeq="1" wit="basetext 8">om.<wit><idno>basetext</idno><idno>8</idno></wit>'
                         '</rdg><rdg n="b" varSeq="2" wit="6 7">addition<wit><idno>6</idno><idno>7</idno></wit>'
                         '</rdg></app>')]
        app_units = exp.get_app_units(apparatus, overtext, context, missing)
        result = []
        for unit in app_units:
            result.append(etree.tostring(unit, encoding='UTF-8').decode('UTF-8'))
        # check the right things are passed to the mocked functions
        mocked_get_lemma_text.assert_has_calls([call(overtext, 2, 4), call(overtext, 6, 6), call(overtext, 7, 7)])
        mocked_get_witnesses.assert_has_calls([call({'label': 'a'}, missing),
                                               call({'label': 'b'}, missing),
                                               call({'label': 'a'}, missing),
                                               call({'label': 'b'}, missing),
                                               call({'label': 'c', 'reading_classes': ['fehlerMR']}, missing),
                                               call({'label': 'a'}, missing),
                                               call({'label': 'b'}, missing)
                                               ])
        mocked_make_reading.assert_has_calls([call({'label': 'a'}, 0, 'a', ['basetext', '6'], subtype=None),
                                              call({'label': 'b'}, 1, 'b', ['7', '8'], subtype=None),
                                              call({'label': 'a'}, 0, 'a', ['basetext'], subtype=None),
                                              call({'label': 'b'}, 1, 'b', ['7', '8'], subtype=None),
                                              call({'label': 'c', 'reading_classes': ['fehlerMR']}, 2, 'c', ['6'],
                                              subtype='fehlerMR'),
                                              call({'label': 'a'}, 0, 'a', ['basetext', '8'], subtype=None),
                                              call({'label': 'b'}, 1, 'b', ['6', '7'], subtype=None)
                                              ])
        # check the result
        self.assertEqual(result, expected_xml)

    @patch('collation.core.exporter.Exporter.make_reading')
    @patch('collation.core.exporter.Exporter.get_witnesses')
    @patch('collation.core.exporter.Exporter.get_lemma_text')
    def test_get_app_units_positive_apparatus_subreading(self,
                                                         mocked_get_lemma_text,
                                                         mocked_get_witnesses,
                                                         mocked_make_reading):
        """Test get_app_units on a positive apparatus with a subreading.
        """
        mocked_get_lemma_text.side_effect = [['my lemma']]
        mocked_get_witnesses.side_effect = [['basetext', '6'], ['7'], ['8']]
        mocked_make_reading.side_effect = [etree.fromstring('<rdg n="a" varSeq="1" wit="basetext 6">my lemma<wit>'
                                                            '<idno>basetext</idno><idno>6</idno></wit></rdg>'),
                                           etree.fromstring('<rdg n="b" varSeq="2" wit="7">my lema<wit><idno>7</idno>'
                                                            '</wit></rdg>'),
                                           etree.fromstring('<rdg type="subreading" cause="orthographic" n="bo" '
                                                            'varSeq="3" wit="8">mie lema<wit><idno>8</idno></wit></rdg>')]  # NoQA
        context = 'Gal.1.1'
        overtext = {'current': {'id': 'basetext'}}
        apparatus = [{'start': 2, 'end': 4, 'readings': [{'label': 'a'},
                     {'label': 'b', 'subreadings': {'orthographic': [{'label': 'b', 'suffix': ''}]}}]}]
        missing = []
        exp = Exporter()
        exp.overtext_siglum = 'basetext'
        expected_xml = [('<app type="main" n="Gal.1.1" from="2" to="4"><lem wit="basetext">my lemma</lem>'
                         '<rdg n="a" varSeq="1" wit="basetext 6">my lemma<wit><idno>basetext</idno><idno>6</idno>'
                         '</wit></rdg><rdg n="b" varSeq="2" wit="7">my lema<wit><idno>7</idno></wit></rdg>'
                         '<rdg type="subreading" cause="orthographic" n="bo" varSeq="3" wit="8">mie lema<wit>'
                         '<idno>8</idno></wit></rdg></app>')]
        app_units = exp.get_app_units(apparatus, overtext, context, missing)
        result = []
        for unit in app_units:
            result.append(etree.tostring(unit, encoding='UTF-8').decode('UTF-8'))
        # check the right things are passed to the mocked functions
        mocked_get_lemma_text.assert_has_calls([call(overtext, 2, 4)])
        mocked_get_witnesses.assert_has_calls([call({'label': 'a'}, missing),
                                               call({'label': 'b',
                                                     'subreadings': {'orthographic': [{'label': 'b',
                                                                                       'suffix': ''}]}}, missing),
                                               call({'label': 'b', 'suffix': ''}, missing)
                                               ])
        mocked_make_reading.assert_has_calls([call({'label': 'a'}, 0, 'a', ['basetext', '6'], subtype=None),
                                              call({'label': 'b',
                                                    'subreadings': {'orthographic': [{'label': 'b',
                                                                                      'suffix': ''}]}}, 1, 'b', ['7'], subtype=None),  # NoQA
                                              call({'label': 'b', 'suffix': ''}, 1, 'b', ['8'], True, 'orthographic')
                                              ])
        # check the result
        self.assertEqual(result, expected_xml)

    @patch('collation.core.exporter.Exporter.make_reading')
    @patch('collation.core.exporter.Exporter.get_witnesses')
    @patch('collation.core.exporter.Exporter.get_lemma_text')
    def test_get_app_units_negative_apparatus(self,
                                              mocked_get_lemma_text,
                                              mocked_get_witnesses,
                                              mocked_make_reading):
        """Test get_app_units on a negative apparatus with no subreadings.
        """
        mocked_get_lemma_text.side_effect = [['my lemma'], ['here'], ['', 'om']]
        mocked_get_witnesses.side_effect = [['basetext', '6'], ['7', '8'], ['basetext'], ['7', '8'],
                                            ['6'], ['basetext', '8'], ['6', '7']]
        mocked_make_reading.side_effect = [etree.fromstring('<rdg n="a" varSeq="1">my lemma</rdg>'),
                                           etree.fromstring('<rdg n="b" varSeq="2" wit="7 8">my lema<wit>'
                                                            '<idno>7</idno><idno>8</idno></wit></rdg>'),
                                           etree.fromstring('<rdg n="a" varSeq="1">here</rdg>'),
                                           etree.fromstring('<rdg n="b" varSeq="2" wit="7 8">my lema<wit><idno>7</idno>'
                                                            '<idno>8</idno></wit></rdg>'),
                                           etree.fromstring('<rdg n="c" type="om" cause="fehlerMR" varSeq="3" '
                                                            'wit="6">om.<wit><idno>6</idno></wit></rdg>'),
                                           etree.fromstring('<rdg n="a" varSeq="1">om.</rdg>'),
                                           etree.fromstring('<rdg n="b" varSeq="2" wit="6 7">addition<wit>'
                                                            '<idno>6</idno><idno>7</idno></wit></rdg>')]
        context = 'Gal.1.1'
        overtext = {'current': {'id': 'basetext'}}
        # give it just enough to control the loops and stop calls breaking (data seems to be needed even though they
        # are mocked)
        apparatus = [{'start': 2, 'end': 4, 'readings': [{'label': 'a'}, {'label': 'b'}]},
                     {'start': 6, 'end': 6, 'readings': [{'label': 'a'}, {'label': 'b'},
                                                         {'label': 'c', 'reading_classes': ['fehlerMR']}]},
                     {'start': 7, 'end': 7, 'readings': [{'label': 'a'}, {'label': 'b'}]}]
        missing = []
        exp = Exporter(format='negative_xml')
        exp.overtext_siglum = 'basetext'
        expected_xml = [('<app type="main" n="Gal.1.1" from="2" to="4"><lem wit="basetext">my lemma</lem>'
                         '<rdg n="a" varSeq="1">my lemma</rdg><rdg n="b" varSeq="2" wit="7 8">my lema<wit>'
                         '<idno>7</idno><idno>8</idno></wit></rdg></app>'),
                        ('<app type="main" n="Gal.1.1" from="6" to="6"><lem wit="basetext">here</lem>'
                         '<rdg n="a" varSeq="1">here</rdg><rdg n="b" varSeq="2" wit="7 8">my lema<wit><idno>7</idno>'
                         '<idno>8</idno></wit></rdg><rdg n="c" type="om" cause="fehlerMR" varSeq="3" wit="6">om.<wit>'
                         '<idno>6</idno></wit></rdg></app>'),
                        ('<app type="main" n="Gal.1.1" from="7" to="7"><lem wit="basetext" type="om" />'
                         '<rdg n="a" varSeq="1">om.</rdg><rdg n="b" varSeq="2" wit="6 7">addition<wit><idno>6</idno>'
                         '<idno>7</idno></wit></rdg></app>')]
        app_units = exp.get_app_units(apparatus, overtext, context, missing)
        result = []
        for unit in app_units:
            result.append(etree.tostring(unit, encoding='UTF-8').decode('UTF-8'))
        # check the right calls are made - only make_reading should differ from positive version as it should always
        # get an empty list for the witnesses in the a reading calls.
        mocked_get_lemma_text.assert_has_calls([call(overtext, 2, 4), call(overtext, 6, 6), call(overtext, 7, 7)])
        mocked_get_witnesses.assert_has_calls([call({'label': 'a'}, missing),
                                               call({'label': 'b'}, missing),
                                               call({'label': 'a'}, missing),
                                               call({'label': 'b'}, missing),
                                               call({'label': 'c', 'reading_classes': ['fehlerMR']}, missing),
                                               call({'label': 'a'}, missing),
                                               call({'label': 'b'}, missing)
                                               ])
        mocked_make_reading.assert_has_calls([call({'label': 'a'}, 0, 'a', [], subtype=None),
                                              call({'label': 'b'}, 1, 'b', ['7', '8'], subtype=None),
                                              call({'label': 'a'}, 0, 'a', [], subtype=None),
                                              call({'label': 'b'}, 1, 'b', ['7', '8'], subtype=None),
                                              call({'label': 'c', 'reading_classes': ['fehlerMR']}, 2, 'c', ['6'],
                                              subtype='fehlerMR'),
                                              call({'label': 'a'}, 0, 'a', [], subtype=None),
                                              call({'label': 'b'}, 1, 'b', ['6', '7'], subtype=None)
                                              ])
        # check the result
        self.assertEqual(result, expected_xml)

    @patch('collation.core.exporter.Exporter.make_reading')
    @patch('collation.core.exporter.Exporter.get_witnesses')
    @patch('collation.core.exporter.Exporter.get_lemma_text')
    def test_get_app_units_negative_apparatus_subreading(self,
                                                         mocked_get_lemma_text,
                                                         mocked_get_witnesses,
                                                         mocked_make_reading):
        """Test get_app_units on a negative apparatus with a subreading.
        """
        mocked_get_lemma_text.side_effect = [['my lemma']]
        mocked_get_witnesses.side_effect = [['basetext', '6'], ['7'], ['8']]
        mocked_make_reading.side_effect = [etree.fromstring('<rdg n="a" varSeq="1">my lemma</rdg>'),
                                           etree.fromstring('<rdg n="b" varSeq="2" wit="7">my lema<wit><idno>7</idno>'
                                                            '</wit></rdg>'),
                                           etree.fromstring('<rdg type="subreading" cause="orthographic" n="bo" '
                                                            'varSeq="3" wit="8">mie lema<wit><idno>8</idno>'
                                                            '</wit></rdg>')]
        context = 'Gal.1.1'
        overtext = {'current': {'id': 'basetext'}}
        apparatus = [{'start': 2, 'end': 4, 'readings': [{'label': 'a'},
                                                         {'label': 'b',
                                                          'subreadings': {'orthographic': [{'label': 'b',
                                                                                            'suffix': ''}]}}]}]
        missing = []
        exp = Exporter(format='negative_xml')
        exp.overtext_siglum = 'basetext'
        expected_xml = [('<app type="main" n="Gal.1.1" from="2" to="4"><lem wit="basetext">my lemma</lem>'
                         '<rdg n="a" varSeq="1">my lemma</rdg><rdg n="b" varSeq="2" wit="7">my lema<wit>'
                         '<idno>7</idno></wit></rdg><rdg type="subreading" cause="orthographic" n="bo" varSeq="3" '
                         'wit="8">mie lema<wit><idno>8</idno></wit></rdg></app>')]
        app_units = exp.get_app_units(apparatus, overtext, context, missing)
        result = []
        for unit in app_units:
            result.append(etree.tostring(unit, encoding='UTF-8').decode('UTF-8'))
        # check the right things are passed to the mocked functions - only make_reading should differ from positive
        # version as it should always get an empty list for the witnesses in the a reading calls.
        mocked_get_lemma_text.assert_has_calls([call(overtext, 2, 4)])
        mocked_get_witnesses.assert_has_calls([call({'label': 'a'}, missing),
                                               call({'label': 'b',
                                                     'subreadings': {'orthographic': [{'label': 'b',
                                                                                       'suffix': ''}]}},
                                                    missing),
                                               call({'label': 'b', 'suffix': ''}, missing)
                                               ])
        mocked_make_reading.assert_has_calls([call({'label': 'a'}, 0, 'a', [], subtype=None),
                                              call({'label': 'b',
                                                    'subreadings': {'orthographic': [{'label': 'b',
                                                                                      'suffix': ''}]}},
                                                   1, 'b', ['7'], subtype=None),
                                              call({'label': 'b', 'suffix': ''}, 1, 'b', ['8'], True, 'orthographic')
                                              ])
        # check the result
        self.assertEqual(result, expected_xml)

# # TODO: work out what is going on with 'include_lemma_when_no_variants' because False doesn't seem to do anything

    @patch('collation.core.exporter.Exporter.get_app_units')
    def test_get_unit_xml_defaults(self, mocked_get_app_units):
        """Test the defaults."""
        mocked_get_app_units.return_value = [etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="8"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="4"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="6" to="8"></app>')]
        self.maxDiff = None
        # data included in lac and om readings to check the default settings works on consolidating
        app = {'context': 'Gal.1.1',
               'structure': {'overtext': [{'original': 'my'}, {'original': 'overtext'}],
                             'apparatus': [],
                             'lac_readings': ['6', '8'],
                             'om_readings': ['7']}
               }
        exp = Exporter()
        expected_missing = ['6', '8', '7']
        expected_xml = ('<ab n="Gal.1.1-APP"><app type="lac" n="Gal.1.1"><lem wit="editorial">Whole verse</lem>'
                        '<rdg type="lac" wit="6 8">Def.<wit><idno>6</idno><idno>8</idno></wit></rdg>'
                        '<rdg type="lac" wit="7">Om.<wit><idno>7</idno></wit></rdg></app>'
                        '<app type="main" n="Gal.1.1" from="2" to="8" /><app type="main" n="Gal.1.1" from="2" to="4" />'
                        '<app type="main" n="Gal.1.1" from="6" to="8" /></ab>')
        xml = exp.get_unit_xml(app)
        mocked_get_app_units.assert_called_with([],
                                                {'current': [{'original': 'my'}, {'original': 'overtext'}]},
                                                'Gal.1.1',
                                                expected_missing)
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.get_app_units')
    def test_get_unit_xml_no_consolidate_lac(self, mocked_get_app_units):
        """Test with only om consolidated."""
        mocked_get_app_units.return_value = [etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="8"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="4"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="6" to="8"></app>')]
        self.maxDiff = None
        # data included in lac and om readings to check the settings works on consolidating
        app = {'context': 'Gal.1.1',
               'structure': {'overtext': [{'original': 'my'}, {'original': 'overtext'}],
                             'apparatus': [],
                             'lac_readings': ['6', '8'],
                             'om_readings': ['7']}
               }
        exp = Exporter(consolidate_lac_verse=False)
        expected_missing = ['7']
        expected_xml = ('<ab n="Gal.1.1-APP"><app type="lac" n="Gal.1.1"><lem wit="editorial">Whole verse</lem>'
                        '<rdg type="lac" wit="7">Om.<wit><idno>7</idno></wit></rdg></app>'
                        '<app type="main" n="Gal.1.1" from="2" to="8" /><app type="main" n="Gal.1.1" from="2" to="4" />'
                        '<app type="main" n="Gal.1.1" from="6" to="8" /></ab>')
        xml = exp.get_unit_xml(app)
        mocked_get_app_units.assert_called_with([],
                                                {'current': [{'original': 'my'}, {'original': 'overtext'}]},
                                                'Gal.1.1',
                                                expected_missing)
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.get_app_units')
    def test_get_unit_xml_no_consolidate_om(self, mocked_get_app_units):
        """Test with only lac consolidated."""
        mocked_get_app_units.return_value = [etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="8"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="4"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="6" to="8"></app>')]
        self.maxDiff = None
        # data included in lac and om readings to check the settings works on consolidating
        app = {'context': 'Gal.1.1',
               'structure': {'overtext': [{'original': 'my'}, {'original': 'overtext'}],
                             'apparatus': [],
                             'lac_readings': ['6', '8'],
                             'om_readings': ['7']}
               }
        exp = Exporter(consolidate_om_verse=False)
        expected_missing = ['6', '8']
        expected_xml = ('<ab n="Gal.1.1-APP"><app type="lac" n="Gal.1.1"><lem wit="editorial">Whole verse</lem>'
                        '<rdg type="lac" wit="6 8">Def.<wit><idno>6</idno><idno>8</idno></wit></rdg></app>'
                        '<app type="main" n="Gal.1.1" from="2" to="8" /><app type="main" n="Gal.1.1" from="2" to="4" />'
                        '<app type="main" n="Gal.1.1" from="6" to="8" /></ab>')
        xml = exp.get_unit_xml(app)
        mocked_get_app_units.assert_called_with([],
                                                {'current': [{'original': 'my'}, {'original': 'overtext'}]},
                                                'Gal.1.1',
                                                expected_missing)
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.get_app_units')
    def test_get_unit_xml_no_consolidate_lac_or_om(self, mocked_get_app_units):
        """Test with lac and om unconsolidated."""
        mocked_get_app_units.return_value = [etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="8"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="4"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="6" to="8"></app>')]
        self.maxDiff = None
        # data included in lac and om readings to check the settings works on consolidating
        app = {'context': 'Gal.1.1',
               'structure': {'overtext': [{'original': 'my'}, {'original': 'overtext'}],
                             'apparatus': [],
                             'lac_readings': ['6', '8'],
                             'om_readings': ['7']}
               }
        exp = Exporter(consolidate_om_verse=False, consolidate_lac_verse=False)
        expected_missing = []
        expected_xml = ('<ab n="Gal.1.1-APP"><app type="main" n="Gal.1.1" from="2" to="8" />'
                        '<app type="main" n="Gal.1.1" from="2" to="4" />'
                        '<app type="main" n="Gal.1.1" from="6" to="8" /></ab>')
        xml = exp.get_unit_xml(app)
        mocked_get_app_units.assert_called_with([],
                                                {'current': [{'original': 'my'}, {'original': 'overtext'}]},
                                                'Gal.1.1',
                                                expected_missing)
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.get_app_units')
    def test_get_unit_xml_ignore_basetext(self, mocked_get_app_units):
        """Test we can ignore the basetext."""
        mocked_get_app_units.return_value = [etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="8"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="4"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="6" to="8"></app>')]
        app = {'context': 'Gal.1.1',
               'structure': {'overtext': [{'original': 'my'}, {'original': 'overtext'}],
                             'apparatus': [],
                             'lac_readings': ['6', '8'],
                             'om_readings': ['7']}
               }
        exp = Exporter(consolidate_om_verse=False, consolidate_lac_verse=False, ignore_basetext=True)
        exp.overtext_siglum = 'basetext'  # we have to suppl the basetext id as it is generated once for the exporter
        # no point testing export just test the call is correct
        expected_missing = ['basetext']
        exp.get_unit_xml(app)
        mocked_get_app_units.assert_called_with([],
                                                {'current': [{'original': 'my'}, {'original': 'overtext'}]},
                                                'Gal.1.1',
                                                expected_missing)

    @patch('collation.core.exporter.Exporter.get_app_units')
    def test_get_unit_xml_unit_sorting(self, mocked_get_app_units):
        """Test the unit sorting."""
        mocked_get_app_units.return_value = [etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="8"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="4"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="6" to="8"></app>')]
        # give it some units to sort
        original_ordered_units = [{'start': 6, 'end': 8},
                                  {'start': 2, 'end': 4},
                                  {'start': 9, 'end': 9},
                                  {'start': 2, 'end': 8}]
        expected_ordered_units = [{'start': 2, 'end': 8},
                                  {'start': 2, 'end': 4},
                                  {'start': 6, 'end': 8},
                                  {'start': 9, 'end': 9}]
        original_app = {'context': 'Gal.1.1',
                        'structure': {'overtext': [{'original': 'my'}, {'original': 'overtext'}],
                                      'apparatus': original_ordered_units,
                                      'lac_readings': [],
                                      'om_readings': []}
                        }
        exp = Exporter()
        exp.get_unit_xml(original_app)
        mocked_get_app_units.assert_called_with(expected_ordered_units,
                                                {'current': [{'original': 'my'}, {'original': 'overtext'}]},
                                                'Gal.1.1',
                                                [])

    @patch('collation.core.exporter.Exporter.get_app_units')
    def test_get_unit_apparatus_line_sorting(self, mocked_get_app_units):
        """Test that app units from all units get included in the export.
        """
        mocked_get_app_units.return_value = [etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="8"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="4"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="6" to="8"></app>')]
        app = {'context': 'Gal.1.1',
               'structure': {'overtext': [{'original': 'my'}, {'original': 'overtext'}],
                             'apparatus': [{'start': 2, 'end': 4}],
                             'apparatus2': [{'start': 9, 'end': 9}],
                             'apparatus3': [{'start': 2, 'end': 8}],
                             'lac_readings': [],
                             'om_readings': []}
               }
        exp = Exporter()
        expected_app_order = [{'start': 2, 'end': 8}, {'start': 2, 'end': 4}, {'start': 9, 'end': 9}]
        exp.get_unit_xml(app)
        mocked_get_app_units.assert_called_with(expected_app_order,
                                                {'current': [{'original': 'my'}, {'original': 'overtext'}]},
                                                'Gal.1.1',
                                                [])

    @patch('collation.core.restructure_export_data_mixin.RestructureExportDataMixin.clean_collation_unit')
    @patch('collation.core.exporter.Exporter.get_unit_xml')
    def test_export_data(self, mocked_get_unit_xml, mocked_clean_collation_unit):
        """Test the overall structure produced by export_data.
        """
        mocked_get_unit_xml.side_effect = [etree.fromstring('<ab n="Gal.1.1-APP" />'),
                                           etree.fromstring('<ab n="Gal.1.2-APP" />')]
        # by the time this is called the overtext_name will be set so we don't need it here
        mocked_clean_collation_unit.side_effect = [{}, {}]
        # just enough to get the loops working and set the overtext_name
        data = [{'structure': {'overtext_name': 'basetext'}}, {}]
        expected_xml = ('<?xml version="1.0" encoding="utf-8"?><TEI xmlns="http://www.tei-c.org/ns/1.0">'
                        '<ab n="Gal.1.1-APP" />\n<ab n="Gal.1.2-APP" /></TEI>')
        exp = Exporter()
        xml = exp.export_data(data)
        self.assertEqual(xml, expected_xml)
