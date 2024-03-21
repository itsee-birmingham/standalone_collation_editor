from unittest import TestCase
from unittest.mock import patch, call
import xml.etree.ElementTree as etree
from collation.core.exporter import Exporter


class ExporterUnitTests(TestCase):

    BASE_UNIT = {
            "_id": "b236b6d444ace44590ff97c1c95499df",
            "end": 8,
            "start": 6,
            "readings": [
              {
                "_id": "58aebee1743da8ee68cd0144168c79b9",
                "text": [
                  {
                    "5": {
                      "t": "υιον",
                      "index": "6",
                      "siglum": "5",
                      "original": "υιον",
                      "rule_match": [
                        "υιον"
                      ]
                    },
                    "35": {
                      "t": "υιον",
                      "index": "6",
                      "siglum": "35",
                      "original": "υιον",
                      "rule_match": [
                        "υιον"
                      ]
                    },
                    "38": {
                      "t": "υιον",
                      "index": "6",
                      "siglum": "38",
                      "original": "υιον",
                      "rule_match": [
                        "υιον"
                      ]
                    },
                    "02": {
                      "n": "υιον",
                      "t": "υν",
                      "index": "6",
                      "nomSac": True,
                      "siglum": "02",
                      "original": "[υν]",
                      "supplied": True,
                      "rule_match": [
                        "[υν]"
                      ],
                      "decision_class": [
                        "reconstructed"
                      ],
                      "decision_details": [
                        {
                          "n": "υιον",
                          "t": "[υν]",
                          "id": 216662,
                          "class": "reconstructed",
                          "scope": "once"
                        }
                      ]
                    },
                    "index": "6",
                    "verse": "Gal.1.16",
                    "reading": [
                      "35",
                      "38",
                      "5",
                      "L23-S3W4D1",
                      "basetext",
                      "02"
                    ],
                    "basetext": {
                      "t": "υιον",
                      "index": "6",
                      "lemma": "υιον",
                      "siglum": "basetext",
                      "original": "υἱὸν",
                      "rule_match": [
                        "υιον"
                      ]
                    },
                    "interface": "υιον",
                    "L23-S3W4D1": {
                      "t": "υιον",
                      "index": "6",
                      "siglum": "L23-S3W4D1",
                      "original": "υιον",
                      "rule_match": [
                        "υιον"
                      ]
                    }
                  },
                  {
                    "5": {
                      "t": "αυτου",
                      "index": "8",
                      "siglum": "5",
                      "original": "αυτου",
                      "rule_match": [
                        "αυτου"
                      ]
                    },
                    "35": {
                      "t": "αυτου",
                      "index": "8",
                      "siglum": "35",
                      "original": "αυτου",
                      "rule_match": [
                        "αυτου"
                      ]
                    },
                    "38": {
                      "t": "αυτου",
                      "index": "8",
                      "siglum": "38",
                      "original": "αυτου",
                      "rule_match": [
                        "αυτου"
                      ]
                    },
                    "02": {
                      "t": "αυτου",
                      "index": "8",
                      "siglum": "02",
                      "original": "αυτου",
                      "rule_match": [
                        "αυτου"
                      ]
                    },
                    "index": "8",
                    "verse": "Gal.1.16",
                    "reading": [
                      "35",
                      "38",
                      "5",
                      "L23-S3W4D1",
                      "basetext",
                      "02"
                    ],
                    "basetext": {
                      "t": "αυτου",
                      "index": "8",
                      "lemma": "αυτου",
                      "siglum": "basetext",
                      "original": "αὐτοῦ",
                      "rule_match": [
                        "αυτου"
                      ]
                    },
                    "interface": "αυτου",
                    "L23-S3W4D1": {
                      "t": "αυτου",
                      "index": "8",
                      "siglum": "L23-S3W4D1",
                      "original": "αυτου",
                      "rule_match": [
                        "αυτου"
                      ]
                    }
                  }
                ],
                "label": "a",
                "SR_text": {
                  "2574-2": {
                    "text": [],
                    "type": "om"
                  }
                },
                "suffixes": [
                  "V",
                  "",
                  "",
                  "",
                  "",
                  ""
                ],
                "witnesses": [
                  "02",
                  "5",
                  "35",
                  "38",
                  "L23-S3W4D1",
                  "basetext"
                ],
                "subreadings": {
                  "abbreviation": [
                    {
                      "text": [
                        {
                          "1": {
                            "n": "υιον",
                            "t": "υν",
                            "index": "6",
                            "nomSac": True,
                            "siglum": "1",
                            "original": "υν",
                            "rule_match": [
                              "υν"
                            ],
                            "decision_class": [
                              "abbreviation"
                            ],
                            "decision_details": [
                              {
                                "n": "υιον",
                                "t": "υν",
                                "id": 216738,
                                "class": "abbreviation",
                                "scope": "once"
                              }
                            ]
                          },
                          "index": "6",
                          "verse": "Gal.1.16",
                          "reading": [
                            "1",
                            "L60-S3W3D1"
                          ],
                          "interface": "υιον",
                          "L60-S3W3D1": {
                            "n": "υιον",
                            "t": "υν",
                            "index": "6",
                            "nomSac": True,
                            "siglum": "L60-S3W3D1",
                            "original": "υν",
                            "rule_match": [
                              "υν"
                            ],
                            "decision_class": [
                              "abbreviation"
                            ],
                            "decision_details": [
                              {
                                "n": "υιον",
                                "t": "υν",
                                "id": 217381,
                                "class": "abbreviation",
                                "scope": "once"
                              }
                            ]
                          }
                        },
                        {
                          "1": {
                            "t": "αυτου",
                            "index": "8",
                            "siglum": "1",
                            "original": "αυτου",
                            "rule_match": [
                              "αυτου"
                            ]
                          },
                          "index": "8",
                          "verse": "Gal.1.16",
                          "reading": [
                            "1",
                            "L60-S3W3D1"
                          ],
                          "interface": "αυτου",
                          "L60-S3W3D1": {
                            "t": "αυτου",
                            "index": "8",
                            "siglum": "L60-S3W3D1",
                            "original": "αυτου",
                            "rule_match": [
                              "αυτου"
                            ]
                          }
                        }
                      ],
                      "suffix": "n",
                      "suffixes": [
                        "",
                        ""
                      ],
                      "witnesses": [
                        "1",
                        "L60-S3W3D1"
                      ],
                      "text_string": "υν αυτου"
                    },
                    {
                      "text": [
                        {
                          "0278": {
                            "n": "υιον",
                            "t": "υιν",
                            "index": "6",
                            "nomSac": True,
                            "siglum": "0278",
                            "original": "υιν",
                            "rule_match": [
                              "υιν"
                            ],
                            "decision_class": [
                              "abbreviation"
                            ],
                            "decision_details": [
                              {
                                "n": "υιον",
                                "t": "υιν",
                                "id": 216731,
                                "class": "abbreviation",
                                "scope": "once"
                              }
                            ]
                          },
                          "index": "6",
                          "verse": "Gal.1.16",
                          "reading": [
                            "0278"
                          ],
                          "interface": "υιον"
                        },
                        {
                          "0278": {
                            "t": "αυτου",
                            "index": "8",
                            "siglum": "0278",
                            "original": "αυτου",
                            "rule_match": [
                              "αυτου"
                            ]
                          },
                          "index": "8",
                          "verse": "Gal.1.16",
                          "reading": [
                            "0278"
                          ],
                          "interface": "αυτου"
                        }
                      ],
                      "suffix": "n",
                      "suffixes": [
                        ""
                      ],
                      "witnesses": [
                        "0278"
                      ],
                      "text_string": "υιν αυτου"
                    }
                  ]
                },
                "text_string": "υιον αυτου"
              },
              {
                "_id": "ec1147ec8fac61b27144abbc40eb8e75",
                "text": [],
                "type": "lac",
                "label": "zz",
                "SR_text": {
                  "04": {
                    "text": [],
                    "type": "lac_verse",
                    "details": "lac verse"
                  },
                  "P51": {
                    "text": [
                      {
                        "P51": {
                          "n": "υιον",
                          "t": "υιον",
                          "index": "6",
                          "siglum": "P51",
                          "unclear": True,
                          "original": "υ_[ιον]",
                          "supplied": True,
                          "interface": "υ_[ιον]",
                          "rule_match": [
                            "υ_[ιον]"
                          ]
                        },
                        "index": "6",
                        "verse": "Gal.1.16",
                        "reading": [
                          "P51"
                        ],
                        "interface": "υ_[ιον]"
                      },
                      {
                        "P51": {
                          "n": "αυτου",
                          "t": "αυτου",
                          "index": "8",
                          "siglum": "P51",
                          "original": "[αυτου]",
                          "supplied": True,
                          "interface": "[αυτου]",
                          "rule_match": [
                            "[αυτου]"
                          ]
                        },
                        "index": "8",
                        "verse": "Gal.1.16",
                        "reading": [
                          "P51"
                        ],
                        "interface": "[αυτου]"
                      }
                    ]
                  }
                },
                "created": True,
                "details": "lac",
                "suffixes": [
                  "",
                  ""
                ],
                "witnesses": [
                  "P51",
                  "04"
                ],
                "text_string": "&lt;lac&gt;",
                "standoff_subreadings": [
                  "04",
                  "P51"
                ]
              }
            ],
            "first_word_index": "6"
          }

    OVERTEXT = [
          {
            "id": "basetext",
            "hand": "firsthand",
            "tokens": [
              {
                "t": "αποκαλυψαι",
                "index": "2",
                "lemma": "αποκαλυψαι",
                "verse": "Gal.1.16",
                "siglum": "basetext",
                "reading": "basetext",
                "original": "ἀποκαλύψαι",
                "rule_match": ["αποκαλυψαι"]
              },
              {
                "t": "τον",
                "index": "4",
                "lemma": "τον",
                "verse": "Gal.1.16",
                "siglum": "basetext",
                "reading": "basetext",
                "original": "τὸν",
                "rule_match": ["τον"]
              },
              {
                "t": "υιον",
                "index": "6",
                "lemma": "υιον",
                "verse": "Gal.1.16",
                "siglum": "basetext",
                "reading": "basetext",
                "original": "υἱὸν",
                "rule_match": ["υιον"]
              },
              {
                "t": "αυτου",
                "index": "8",
                "lemma": "αυτου",
                "verse": "Gal.1.16",
                "siglum": "basetext",
                "reading": "basetext",
                "original": "αὐτοῦ",
                "rule_match": ["αυτου"]
              },
              {
                "t": "εν",
                "index": "10",
                "lemma": "εν",
                "verse": "Gal.1.16",
                "siglum": "basetext",
                "reading": "basetext",
                "original": "ἐν",
                "pc_before": "(",
                "pc_after": ")",
                "rule_match": ["εν"]
              },
              {
                "t": "εμοι",
                "index": "12",
                "lemma": "εμοι",
                "verse": "Gal.1.16",
                "siglum": "basetext",
                "reading": "basetext",
                "original": "ἐμοί",
                "pc_after": ",",
                "rule_match": ["εμοι"]
              },
              {
                "t": "ινα",
                "index": "14",
                "lemma": "ινα",
                "verse": "Gal.1.16",
                "siglum": "basetext",
                "reading": "basetext",
                "original": "ἵνα",
                "rule_match": ["ινα"]
              },
              {
                "t": "ευαγγελιζωμαι",
                "index": "16",
                "lemma": "ευαγγελιζωμαι",
                "verse": "Gal.1.16",
                "siglum": "basetext",
                "reading": "basetext",
                "original": "εὐαγγελίζωμαι",
                "rule_match": ["ευαγγελιζωμαι"]
              },
              {
                "t": "αυτον",
                "index": "18",
                "lemma": "αυτον",
                "verse": "Gal.1.16",
                "siglum": "basetext",
                "reading": "basetext",
                "original": "αὐτὸν",
                "rule_match": ["αυτον"]
              },
              {
                "t": "εν",
                "index": "20",
                "lemma": "εν",
                "verse": "Gal.1.16",
                "siglum": "basetext",
                "reading": "basetext",
                "original": "ἐν",
                "rule_match": ["εν"]
              },
              {
                "t": "τοις",
                "index": "22",
                "lemma": "τοις",
                "verse": "Gal.1.16",
                "siglum": "basetext",
                "reading": "basetext",
                "original": "τοῖς",
                "rule_match": ["τοις"]
              },
              {
                "t": "εθνεσιν",
                "index": "24",
                "lemma": "εθνεσιν",
                "verse": "Gal.1.16",
                "siglum": "basetext",
                "reading": "basetext",
                "original": "ἔθνεσιν",
                "pc_after": ",",
                "rule_match": ["εθνεσιν"]
              },
              {
                "t": "ευθεως",
                "index": "26",
                "lemma": "ευθεως",
                "verse": "Gal.1.16",
                "siglum": "basetext",
                "reading": "basetext",
                "original": "εὐθέως",
                "rule_match": ["ευθεως"]
              },
              {
                "t": "ου",
                "index": "28",
                "lemma": "ου",
                "verse": "Gal.1.16",
                "siglum": "basetext",
                "reading": "basetext",
                "original": "οὐ",
                "rule_match": ["ου"]
              }
            ],
            "hand_abbreviation": "*"
          }
        ]

    def test_get_text_default_settings(self):
        exp = Exporter()
        reading = self.BASE_UNIT['readings'][0]
        expected_text = ['υιον αυτου']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_default_settings_older_format(self):
        exp = Exporter()
        reading = self.BASE_UNIT['readings'][0]
        # change the data to the older format
        del reading['text_string']
        expected_text = ['υιον αυτου']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_default_settings_subreading(self):
        exp = Exporter()
        reading = self.BASE_UNIT['readings'][0]['subreadings']['abbreviation'][0]
        expected_text = ['υν αυτου']
        generated_text = exp.get_text(reading, is_subreading=True)
        self.assertEqual(expected_text, generated_text)

    def test_get_text_default_settings_om(self):
        exp = Exporter()
        reading = {
                "_id": "9be18d000f92e381ecb456215c00fa0b",
                "text": [],
                "type": "om",
                "label": "b",
                "suffixes": [""],
                "witnesses": ["1838"],
                "text_string": "om."
              }
        expected_text = ['om.', 'om']
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
        expected_text = ['om.', 'om_verse']
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
        expected_text = ['lac.', 'lac']
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
        expected_text = ['lac.', 'lac_verse']
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
        reading = {
                "_id": "e8cfee9e910e487b54542fd6d8953f0c",
                "text": [],
                "type": "om",
                "label": "zu",
                "suffixes": [""],
                "witnesses": ["1929*"],
                "text_string": "overlapped",
                "overlap_status": "overlapped"
              }
        expected_text = ['', 'overlapped']
        generated_text = exp.get_text(reading)
        self.assertEqual(expected_text, generated_text)

    def test_get_lemma_text_defaults(self):
        exp = Exporter()
        overtext = {'current': self.OVERTEXT[0]}

        # test a few ranges where there is data
        expected_text = ['ἀποκαλύψαι τὸν υἱὸν']
        generated_text = exp.get_lemma_text(overtext, '2', '6')
        self.assertEqual(expected_text, generated_text)

        expected_text = ['ἐν']
        generated_text = exp.get_lemma_text(overtext, '10', '10')
        self.assertEqual(expected_text, generated_text)

        expected_text = ['ἀποκαλύψαι']
        generated_text = exp.get_lemma_text(overtext, '1', '3')
        self.assertEqual(expected_text, generated_text)

        expected_text = ['ἔθνεσιν']
        generated_text = exp.get_lemma_text(overtext, '24', '24')
        self.assertEqual(expected_text, generated_text)

        expected_text = ['αὐτοῦ ἐν ἐμοί ἵνα εὐαγγελίζωμαι αὐτὸν ἐν']
        generated_text = exp.get_lemma_text(overtext, '7', '20')
        self.assertEqual(expected_text, generated_text)

        expected_text = ['αὐτοῦ ἐν ἐμοί ἵνα εὐαγγελίζωμαι αὐτὸν ἐν']
        generated_text = exp.get_lemma_text(overtext, '8', '21')
        self.assertEqual(expected_text, generated_text)

        # test where there is no data
        expected_text = ['', 'om']
        generated_text = exp.get_lemma_text(overtext, '27', '27')
        self.assertEqual(expected_text, generated_text)

        expected_text = ['', 'om']
        generated_text = exp.get_lemma_text(overtext, '1', '1')
        self.assertEqual(expected_text, generated_text)

    def test_get_lemma_text_with_punctuation(self):
        exp = Exporter(include_punctuation=True)
        overtext = {'current': self.OVERTEXT[0]}

        expected_text = ['ἔθνεσιν,']
        generated_text = exp.get_lemma_text(overtext, '24', '24')
        self.assertEqual(expected_text, generated_text)

        expected_text = ['(ἐν)']
        generated_text = exp.get_lemma_text(overtext, '10', '10')
        self.assertEqual(expected_text, generated_text)

    def test_get_witnesses(self):
        exp = Exporter()
        reading = self.BASE_UNIT['readings'][0]

        expected_witnesses = ['02V', '5', '35', '38', 'L23-S3W4D1', 'basetext']
        generated_witnesses = exp.get_witnesses(reading, [])
        self.assertEqual(expected_witnesses, generated_witnesses)

        expected_witnesses = ['02V', '35', '38', 'L23-S3W4D1']
        generated_witnesses = exp.get_witnesses(reading, ['5', 'basetext'])
        self.assertEqual(expected_witnesses, generated_witnesses)

    def test_get_label_main_reading_1(self):
        exp = Exporter()
        reading = self.BASE_UNIT['readings'][1]
        expected_label = 'b'
        generated_label = exp.get_label('b', False, None, reading)
        self.assertEqual(expected_label, generated_label)

    def test_get_label_main_reading_2(self):
        exp = Exporter()
        reading = {
                "_id": "6411b86361757a8d56e7006eddb8ebae",
                "text": [],
                "type": "om",
                "label": "b",
                "suffixes": [""],
                "witnesses": ["1929*"],
                "text_string": "om.",
                "label_suffix": "f",
                "reading_classes": ["fehlerMR"]
              }
        expected_label = 'bf'
        generated_label = exp.get_label('b', False, 'fehler', reading)
        self.assertEqual(expected_label, generated_label)

    def test_get_label_subreading(self):
        exp = Exporter()
        reading = {
                      "text": [
                        {
                          "1398": {
                            "n": "ευαγγελισωμαι",
                            "t": "ευαγγελισομαι",
                            "index": "16",
                            "siglum": "1398",
                            "original": "ευαγγελισομαι",
                            "interface": "ευαγγελισομαι",
                            "rule_match": ["ευαγγελισομαι"]
                          },
                          "index": "16.1",
                          "verse": "Gal.1.16",
                          "reading": ["1398"],
                          "interface": "ευαγγελισομαι"
                        }
                      ],
                      "suffix": "f",
                      "suffixes": [""],
                      "witnesses": ["1398"],
                      "text_string": "ευαγγελισομαι"
                    }
        expected_label = 'b'
        generated_label = exp.get_label('b', True, 'fehler', reading)
        self.assertEqual(expected_label, generated_label)

    def test_get_label_subreading_legacy_1(self):
        # this tests an older form of the data where label_suffix for main readings were not added in approved data
        exp = Exporter(rule_classes=[{'value': 'fehler', 'identifier': 'f', 'suffixed_label': True}])
        reading = {
                "_id": "6411b86361757a8d56e7006eddb8ebae",
                "text": [],
                "type": "om",
                "label": "b",
                "suffixes": [""],
                "witnesses": ["1929*"],
                "text_string": "om.",
                "label_suffix": "f",
                "reading_classes": ["fehlerMR"]
              }
        del reading['label_suffix']
        expected_label = 'bf'
        generated_label = exp.get_label('b', False, 'fehler', reading)
        self.assertEqual(expected_label, generated_label)

    def test_get_label_subreading_legacy_2(self):
        # this tests an older form of the data where label_suffix for main readings were not added in approved data
        exp = Exporter(rule_classes=[{'value': 'fehler', 'identifier': 'f', 'suffixed_label': False}])
        reading = {
                "_id": "6411b86361757a8d56e7006eddb8ebae",
                "text": [],
                "type": "om",
                "label": "b",
                "suffixes": [""],
                "witnesses": ["1929*"],
                "text_string": "om.",
                "label_suffix": "f",
                "reading_classes": ["fehlerMR"]
              }
        del reading['label_suffix']
        expected_label = 'b'
        generated_label = exp.get_label('b', False, 'fehler', reading)
        self.assertEqual(expected_label, generated_label)

    def test_check_for_suffixed_reading_marker(self):
        exp = Exporter()
        reading = self.BASE_UNIT['readings'][0]
        # adapt the data so we have the right input
        reading['reading_suffix'] = 'K'
        expected_text = ['υιον αυτου']
        generated_text = exp.check_for_suffixed_reading_marker(['υιον αυτου'], None, reading)
        self.assertEqual(expected_text, generated_text)

        expected_text = ['υιον αυτου (K)']
        generated_text = exp.check_for_suffixed_reading_marker(['υιον αυτου'], 'commentary', reading)
        self.assertEqual(expected_text, generated_text)

    def test_check_for_suffixed_reading_marker_legacy_1(self):
        exp = Exporter(rule_classes=[{'value': 'commentary', 'identifier': 'K', 'suffixed_reading': True}])
        reading = self.BASE_UNIT['readings'][0]
        if 'reading_suffix' in reading:
            del reading['reading_suffix']
        expected_text = ['υιον αυτου (K)']
        generated_text = exp.check_for_suffixed_reading_marker(['υιον αυτου'], 'commentary', reading)
        self.assertEqual(expected_text, generated_text)

    def test_check_for_suffixed_reading_marker_legacy_2(self):
        exp = Exporter(rule_classes=[{'value': 'commentary', 'identifier': 'K', 'suffixed_reading': False}])
        reading = self.BASE_UNIT['readings'][0]
        if 'reading_suffix' in reading:
            del reading['reading_suffix']
        expected_text = ['υιον αυτου']
        generated_text = exp.check_for_suffixed_reading_marker(['υιον αυτου'], 'commentary', reading)
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
        mocked_get_label.assert_called_with(reading_label, False, None, reading)
        mocked_get_text.assert_called_with(reading, False)
        mocked_check_for_suffixed_reading_marker.assert_called_with(['και'], None, reading)
        # check the result
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.check_for_suffixed_reading_marker')
    @patch('collation.core.exporter.Exporter.get_text')
    @patch('collation.core.exporter.Exporter.get_label')
    def test_make_reading_main_reading_2(self,
                                         mocked_get_label,
                                         mocked_get_text,
                                         mocked_check_for_suffixed_reading_marker):
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
        mocked_get_label.assert_called_with(reading_label, False, None, reading)
        mocked_get_text.assert_called_with(reading, False)
        mocked_check_for_suffixed_reading_marker.assert_called_with(['κι'], None, reading)
        # check the result
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.check_for_suffixed_reading_marker')
    @patch('collation.core.exporter.Exporter.get_text')
    @patch('collation.core.exporter.Exporter.get_label')
    def test_make_reading_subreading(self,
                                     mocked_get_label,
                                     mocked_get_text,
                                     mocked_check_for_suffixed_reading_marker):
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
        mocked_get_label.assert_called_with(reading_label, subreading, subreading_subtype, reading)
        mocked_get_text.assert_called_with(reading, subreading)
        mocked_check_for_suffixed_reading_marker.assert_called_with(['om.', 'om'], subreading_subtype, reading)
        # check the result
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.check_for_suffixed_reading_marker')
    @patch('collation.core.exporter.Exporter.get_text')
    @patch('collation.core.exporter.Exporter.get_label')
    def test_make_reading_om_reading(self,
                                     mocked_get_label,
                                     mocked_get_text,
                                     mocked_check_for_suffixed_reading_marker):
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
        mocked_get_label.assert_called_with(reading_label, False, None, reading)
        mocked_get_text.assert_called_with(reading, False)
        mocked_check_for_suffixed_reading_marker.assert_called_with(['om.', 'om'], None, reading)
        # check the result
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.make_reading')
    @patch('collation.core.exporter.Exporter.get_witnesses')
    @patch('collation.core.exporter.Exporter.get_lemma_text')
    def test_get_app_units_positive_apparatus(self,
                                              mocked_get_lemma_text,
                                              mocked_get_witnesses,
                                              mocked_make_reading):
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

# TODO: work out what is going on with 'include_lemma_when_no_variants' because False doesn't seem to do anything

    @patch('collation.core.exporter.Exporter.get_app_units')
    def test_get_unit_xml_defaults(self, mocked_get_app_units):
        mocked_get_app_units.return_value = [etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="8"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="4"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="6" to="8"></app>')]
        self.maxDiff = None
        # data included in lac and om readings to check the default settings works on consolidating
        app = {'context': 'Gal.1.1',
               'structure': {'overtext': [{'id': 'basetext'}],
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
        mocked_get_app_units.assert_called_with([], {'current': {'id': 'basetext'}}, 'Gal.1.1', expected_missing)
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.get_app_units')
    def test_get_unit_xml_no_consolidate_lac(self, mocked_get_app_units):
        mocked_get_app_units.return_value = [etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="8"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="4"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="6" to="8"></app>')]
        self.maxDiff = None
        # data included in lac and om readings to check the settings works on consolidating
        app = {'context': 'Gal.1.1',
               'structure': {'overtext': [{'id': 'basetext'}],
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
        mocked_get_app_units.assert_called_with([], {'current': {'id': 'basetext'}}, 'Gal.1.1', expected_missing)
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.get_app_units')
    def test_get_unit_xml_no_consolidate_om(self, mocked_get_app_units):
        mocked_get_app_units.return_value = [etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="8"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="4"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="6" to="8"></app>')]
        self.maxDiff = None
        # data included in lac and om readings to check the settings works on consolidating
        app = {'context': 'Gal.1.1',
               'structure': {'overtext': [{'id': 'basetext'}],
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
        mocked_get_app_units.assert_called_with([], {'current': {'id': 'basetext'}}, 'Gal.1.1', expected_missing)
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.get_app_units')
    def test_get_unit_xml_no_consolidate_lac_or_om(self, mocked_get_app_units):
        mocked_get_app_units.return_value = [etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="8"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="4"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="6" to="8"></app>')]
        self.maxDiff = None
        # data included in lac and om readings to check the settings works on consolidating
        app = {'context': 'Gal.1.1',
               'structure': {'overtext': [{'id': 'basetext'}],
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
        mocked_get_app_units.assert_called_with([], {'current': {'id': 'basetext'}}, 'Gal.1.1', expected_missing)
        self.assertEqual(etree.tostring(xml, encoding='UTF-8').decode('UTF-8'), expected_xml)

    @patch('collation.core.exporter.Exporter.get_app_units')
    def test_get_unit_xml_ignore_basetext(self, mocked_get_app_units):
        mocked_get_app_units.return_value = [etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="8"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="4"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="6" to="8"></app>')]
        app = {'context': 'Gal.1.1',
               'structure': {'overtext': [{'id': 'basetext'}],
                             'apparatus': [],
                             'lac_readings': ['6', '8'],
                             'om_readings': ['7']}
               }
        exp = Exporter(consolidate_om_verse=False, consolidate_lac_verse=False, ignore_basetext=True)
        # no point testing export just test the call is correct
        expected_missing = ['basetext']
        exp.get_unit_xml(app)
        mocked_get_app_units.assert_called_with([], {'current': {'id': 'basetext'}}, 'Gal.1.1', expected_missing)

    @patch('collation.core.exporter.Exporter.get_app_units')
    def test_get_unit_xml_unit_sorting(self, mocked_get_app_units):
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
                        'structure': {'overtext': [{'id': 'basetext'}],
                                      'apparatus': original_ordered_units,
                                      'lac_readings': [],
                                      'om_readings': []}
                        }
        exp = Exporter()
        exp.get_unit_xml(original_app)
        mocked_get_app_units.assert_called_with(expected_ordered_units, {'current': {'id': 'basetext'}}, 'Gal.1.1', [])

    # test units from all app lines are included
    @patch('collation.core.exporter.Exporter.get_app_units')
    def test_get_unit_apparatus_line_sorting(self, mocked_get_app_units):
        mocked_get_app_units.return_value = [etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="8"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="2" to="4"></app>'),
                                             etree.fromstring('<app type="main" n="Gal.1.1" from="6" to="8"></app>')]
        app = {'context': 'Gal.1.1',
               'structure': {'overtext': [{'id': 'basetext'}],
                             'apparatus': [{'start': 2, 'end': 4}],
                             'apparatus2': [{'start': 9, 'end': 9}],
                             'apparatus3': [{'start': 2, 'end': 8}],
                             'lac_readings': [],
                             'om_readings': []}
               }
        exp = Exporter()
        expected_app_order = [{'start': 2, 'end': 8}, {'start': 2, 'end': 4}, {'start': 9, 'end': 9}]
        exp.get_unit_xml(app)
        mocked_get_app_units.assert_called_with(expected_app_order, {'current': {'id': 'basetext'}}, 'Gal.1.1', [])

    @patch('collation.core.exporter.Exporter.get_unit_xml')
    def test_export_data(self, mocked_get_unit_xml):
        mocked_get_unit_xml.side_effect = [etree.fromstring('<ab n="Gal.1.1-APP" />'),
                                           etree.fromstring('<ab n="Gal.1.2-APP" />')]
        # just enough to get the loops working
        data = [{}, {}]
        expected_xml = ('<?xml version="1.0" encoding="utf-8"?><TEI xmlns="http://www.tei-c.org/ns/1.0">'
                        '<ab n="Gal.1.1-APP" />\n<ab n="Gal.1.2-APP" /></TEI>')
        exp = Exporter()
        xml = exp.export_data(data)
        self.assertEqual(xml, expected_xml)
