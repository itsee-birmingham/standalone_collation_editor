/* global QUnit, sinon, CL, SR */
QUnit.module('subreadings', function(hooks) {

    const allRules = {"none": [undefined, false], "reconstructed": ["V", false], "unclear": ["V", false],
                      "fehler": ["f", true], "fehlerSuff": ["f", false], "orthographic": ["o", true],
                      "regularised": ["r", false], "abbreviation": ["a", false], "nomsac": ["n", false]};

    hooks.afterEach(function () {
        sinon.restore();
    });


    QUnit.test("test _addToSubreadings 1", (assert) => {
        /** Simple data as a first test */

        sinon.stub(CL, 'getRuleClasses').returns(allRules);

        const subreadings = {
            "regularised": [
              {
                "text": [
                  {
                    "1506": {
                      "t": "ει",
                      "index": "16",
                      "siglum": "1506",
                      "original": "ει",
                      "rule_match": [
                        "ει"
                      ]
                    },
                    "index": "14.1",
                    "verse": "Rom.1.10",
                    "interface": "ει",
                    "reading": [
                      "1506"
                    ]
                  },
                  {
                    "1506": {
                      "n": "πως",
                      "t": "πος",
                      "index": "18",
                      "siglum": "1506",
                      "unclear": true,
                      "original": "πο̣ς",
                      "rule_match": [
                        "πο̣ς"
                      ],
                      "decision_class": [
                        "regularised"
                      ],
                      "decision_details": [
                        {
                          "n": "πως",
                          "t": "πος",
                          "id": 285656,
                          "class": "regularised",
                          "scope": "once"
                        }
                      ]
                    },
                    "index": "16.1",
                    "verse": "Rom.1.10",
                    "interface": "πως",
                    "reading": [
                      "1506"
                    ]
                  }
                ],
                "text_string": "ει πος",
                "witnesses": [
                  "1506"
                ],
                "suffix": "(r)"
              },
              {
                "text": [
                  {
                    "index": "14.1",
                    "verse": "Rom.1.10",
                    "L1126-S2W1D7": {
                      "t": "η",
                      "index": "14",
                      "siglum": "L1126-S2W1D7",
                      "original": "η",
                      "interface": "η",
                      "rule_match": [
                        "η"
                      ]
                    },
                    "interface": "η",
                    "reading": [
                      "L1126-S2W1D7"
                    ]
                  },
                  {
                    "index": "16.1",
                    "verse": "Rom.1.10",
                    "L1126-S2W1D7": {
                      "t": "πως",
                      "index": "16",
                      "siglum": "L1126-S2W1D7",
                      "original": "πως",
                      "interface": "πως",
                      "rule_match": [
                        "πως"
                      ]
                    },
                    "interface": "πως",
                    "reading": [
                      "L1126-S2W1D7"
                    ]
                  }
                ],
                "text_string": "η πως",
                "witnesses": [
                  "L1126-S2W1D7"
                ],
                "suffix": "(r)"
              }
            ]
          };

        const expectedSubreadings = JSON.parse(JSON.stringify(subreadings));
        // add the data we are expecting for the new subreading
        expectedSubreadings.orthographic = [
            {
                "text": [
                    {
                        "index": "14.1",
                        "verse": "Rom.1.10",
                        "020": {
                            "t": "οπως",
                            "index": "14",
                            "siglum": "020",
                            "original": "οπως",
                            "interface": "οπως",
                            "rule_match": [
                                "οπως"
                            ]
                        },
                        "interface": "οπως",
                        "reading": [
                            "020"
                        ]
                    }
                ],
                "text_string": "οπως",
                "witnesses": [
                    "020"
                ],
                "suffix": "o"
            }
        ];

        const reading = {
            "_id": "44949d5ecca24dffae35ed8c03f35328",
            "text": [
              {              
                "33": {
                  "t": "ει",
                  "index": "14",
                  "siglum": "33",
                  "original": "ει",
                  "rule_match": [
                    "ει"
                  ]
                },
                "reading": [
                  "basetext",                 
                  "33"
                ],
                "basetext": {
                  "t": "ει",
                  "index": "14",
                  "lemma": "ει",
                  "siglum": "basetext",
                  "original": "εἴ",
                  "rule_match": [
                    "ει"
                  ]
                },
                "interface": "ει",
              },
              {
                "33": {
                  "t": "πως",
                  "index": "16",
                  "siglum": "33",
                  "original": "πως",
                  "rule_match": [
                    "πως"
                  ]
                },
                "basetext": {
                  "t": "πως",
                  "index": "16",
                  "lemma": "πως",
                  "siglum": "basetext",
                  "original": "πως",
                  "rule_match": [
                    "πως"
                  ]
                },
                "interface": "πως",
                "regularised": true,
              }
            ],
            "SR_text": {
              "020": {
                "text": [
                  {
                    "020": {
                      "t": "οπως",
                      "index": "14",
                      "siglum": "020",
                      "original": "οπως",
                      "interface": "οπως",
                      "rule_match": [
                        "οπως"
                      ]
                    },
                    "index": "14.1",
                    "verse": "Rom.1.10",
                    "reading": [
                      "020"
                    ],
                    "interface": "οπως"
                  }
                ]
              },
              "L1126-S2W1D7": {
                "text": [
                  {
                    "index": "14.1",
                    "verse": "Rom.1.10",
                    "reading": [
                      "L1126-S2W1D7"
                    ],
                    "interface": "η",
                    "L1126-S2W1D7": {
                      "t": "η",
                      "index": "14",
                      "siglum": "L1126-S2W1D7",
                      "original": "η",
                      "interface": "η",
                      "rule_match": [
                        "η"
                      ]
                    }
                  },
                  {
                    "index": "16.1",
                    "verse": "Rom.1.10",
                    "reading": [
                      "L1126-S2W1D7"
                    ],
                    "interface": "πως",
                    "L1126-S2W1D7": {
                      "t": "πως",
                      "index": "16",
                      "siglum": "L1126-S2W1D7",
                      "original": "πως",
                      "interface": "πως",
                      "rule_match": [
                        "πως"
                      ]
                    }
                  }
                ]
              },            
            "witnesses": [
              "basetext",
              "33",
              "L1126-S2W1D7",
              "020"
            ],
            "subreadings": {
              "regularised": [
                {
                  "text": [
                    {
                      "1506": {
                        "t": "ει",
                        "index": "16",
                        "siglum": "1506",
                        "original": "ει",
                        "rule_match": [
                          "ει"
                        ]
                      },
                      "index": "14.1",
                      "verse": "Rom.1.10",
                      "interface": "ει",
                      "reading": [
                        "1506"
                      ]
                    },
                    {
                      "1506": {
                        "n": "πως",
                        "t": "πος",
                        "index": "18",
                        "siglum": "1506",
                        "unclear": true,
                        "original": "πο̣ς",
                        "rule_match": [
                          "πο̣ς"
                        ],
                        "decision_class": [
                          "regularised"
                        ],
                        "decision_details": [
                          {
                            "n": "πως",
                            "t": "πος",
                            "id": 285656,
                            "class": "regularised",
                            "scope": "once"
                          }
                        ]
                      },
                      "index": "16.1",
                      "verse": "Rom.1.10",
                      "interface": "πως",
                      "reading": [
                        "1506"
                      ]
                    }
                  ],
                  "text_string": "ει πος",
                  "witnesses": [
                    "1506"
                  ],
                  "suffix": "(r)"
                },
                {
                  "text": [
                    {
                      "index": "14.1",
                      "verse": "Rom.1.10",
                      "L1126-S2W1D7": {
                        "t": "η",
                        "index": "14",
                        "siglum": "L1126-S2W1D7",
                        "original": "η",
                        "interface": "η",
                        "rule_match": [
                          "η"
                        ]
                      },
                      "interface": "η",
                      "reading": [
                        "L1126-S2W1D7"
                      ]
                    },
                    {
                      "index": "16.1",
                      "verse": "Rom.1.10",
                      "L1126-S2W1D7": {
                        "t": "πως",
                        "index": "16",
                        "siglum": "L1126-S2W1D7",
                        "original": "πως",
                        "interface": "πως",
                        "rule_match": [
                          "πως"
                        ]
                      },
                      "interface": "πως",
                      "reading": [
                        "L1126-S2W1D7"
                      ]
                    }
                  ],
                  "text_string": "η πως",
                  "witnesses": [
                    "L1126-S2W1D7"
                  ],
                  "suffix": "(r)"
                }
              ]
            },
            "standoff_subreadings": [
              "L1126-S2W1D7"
            ]
          }
        };

        const witness = '020';
    
        const typeList = ['orthographic'];

        const options = {
            "standoff": true,
            "text": "οπως"
          }
        
        const newSubreadings = SR._addToSubreadings(subreadings, reading, witness, typeList, options);
        assert.equal(JSON.stringify(newSubreadings), JSON.stringify(expectedSubreadings));        
    });

    QUnit.test("test _addToSubreadings 2", (assert) => {
        /** This test uses the same data as _addToSubreadings 3 but uses all the rules so strips the subreadings
         * back to their first reading. Only stripping back some of the regularisations was causing a bug with this
         * data where we had om > text(-) > text(o)
         */

        sinon.stub(CL, 'getRuleClasses').returns(allRules);

        const subreadings = {
            "orthographic": [
              {
                "text": [
                  {                   
                    "index": "14.1",
                    "verse": "Rom.1.10",
                    "020": {
                      "t": "οπως",
                      "index": "14",
                      "siglum": "020",
                      "original": "οπως",
                      "interface": "οπως",
                      "rule_match": [
                        "οπως"
                      ]
                    },
                    "interface": "οπως",
                    "reading": [
                      "020"
                    ]
                  }
                ],
                "text_string": "οπως",
                "witnesses": [
                  "020",
                ],
                "suffix": "o"
              }
            ]
          };

        const expectedSubreadings = JSON.parse(JSON.stringify(subreadings));
        // add the data we are expecting for the new subreading
        expectedSubreadings['none|orthographic'] = [
            {
                "text": [],
                "text_string": "om.",
                "witnesses": [
                    "2102*"
                ],
                "suffix": "o(-)",
                "type": "om"
            }
        ];

        const reading = {
            "_id": "44949d5ecca24dffae35ed8c03f35328",
            "text": [
              {
                "33": {
                  "t": "ει",
                  "index": "14",
                  "siglum": "33",
                  "original": "ει",
                  "rule_match": [
                    "ει"
                  ]
                },
                "1506": {
                  "t": "ει",
                  "index": "16",
                  "siglum": "1506",
                  "original": "ει",
                  "rule_match": [
                    "ει"
                  ]
                },
                "index": "14.1",
                "verse": "Rom.1.10",
                "reading": [
                  "basetext",
                  "33",
                  "1506"
                ],
                "basetext": {
                  "t": "ει",
                  "index": "14",
                  "lemma": "ει",
                  "siglum": "basetext",
                  "original": "εἴ",
                  "rule_match": [
                    "ει"
                  ]
                },
                "interface": "ει"
              },
              {
                "33": {
                  "t": "πως",
                  "index": "16",
                  "siglum": "33",
                  "original": "πως",
                  "rule_match": [
                    "πως"
                  ]
                },
                "1506": {
                  "n": "πως",
                  "t": "πος",
                  "index": "18",
                  "siglum": "1506",
                  "unclear": true,
                  "original": "πο̣ς",
                  "rule_match": [
                    "πο̣ς"
                  ],
                  "decision_class": [
                    "regularised"
                  ],
                  "decision_details": [
                    {
                      "n": "πως",
                      "t": "πος",
                      "id": 285656,
                      "class": "regularised",
                      "scope": "once"
                    }
                  ]
                },
                "reading": [
                  "basetext",
                  "33",
                  "1506"
                ],
                "basetext": {
                  "t": "πως",
                  "index": "16",
                  "lemma": "πως",
                  "siglum": "basetext",
                  "original": "πως",
                  "rule_match": [
                    "πως"
                  ]
                },
                "interface": "πως"
              }
            ],
            "witnesses": [
              "basetext",
              "33",
              "1506",
              "L1126-S2W1D7",
              "020",
              "2102*"
            ],
            "SR_text": {
              "L1126-S2W1D7": {
                "text": [
                  {
                    "index": "14.1",
                    "verse": "Rom.1.10",
                    "L1126-S2W1D7": {
                      "t": "η",
                      "index": "14",
                      "siglum": "L1126-S2W1D7",
                      "original": "η",
                      "interface": "η",
                      "rule_match": [
                        "η"
                      ]
                    },
                    "interface": "η",
                    "reading": [
                      "L1126-S2W1D7"
                    ]
                  },
                  {
                    "index": "16.1",
                    "verse": "Rom.1.10",
                    "L1126-S2W1D7": {
                      "t": "πως",
                      "index": "16",
                      "siglum": "L1126-S2W1D7",
                      "original": "πως",
                      "interface": "πως",
                      "rule_match": [
                        "πως"
                      ]
                    },
                    "interface": "πως",
                    "reading": [
                      "L1126-S2W1D7"
                    ]
                  }
                ]
              },
              "020": {
                "text": [
                  {
                    "index": "14.1",
                    "verse": "Rom.1.10",
                    "020": {
                      "t": "οπως",
                      "index": "14",
                      "siglum": "020",
                      "original": "οπως",
                      "interface": "οπως",
                      "rule_match": [
                        "οπως"
                      ]
                    },
                    "interface": "οπως",
                    "reading": [
                      "020"
                    ]
                  }
                ]
              },
              "2102*": {
                "text": [],
                "type": "om"
              },
            },
            "label": "a",
            "standoff_subreadings": [
              "L1126-S2W1D7",
              "020"
            ],
            "subreadings": {
              "orthographic": [
                {
                  "text": [
                    {
                      "index": "14.1",
                      "verse": "Rom.1.10",
                      "020": {
                        "t": "οπως",
                        "index": "14",
                        "siglum": "020",
                        "original": "οπως",
                        "interface": "οπως",
                        "rule_match": [
                          "οπως"
                        ]
                      },
                      "interface": "οπως",
                      "reading": [
                        "020",
                      ]
                    }
                  ],
                  "text_string": "οπως",
                  "witnesses": [
                    "020"
                  ],
                  "suffix": "o"
                }
              ]
            }
          };

        const witness = '2102*';
    
        const typeList = ['none', 'orthographic'];

        const options = {
            "standoff": true,
            "text": "οπως"
          }
        
        const newSubreadings = SR._addToSubreadings(subreadings, reading, witness, typeList, options);
        assert.equal(JSON.stringify(newSubreadings), JSON.stringify(expectedSubreadings));        
    })

    QUnit.test("test _addToSubreadings 3", (assert) => {
        /** This test uses the same data as _addToSubreadings 2 but only uses the rules for OR 
         * This was producing a bug in this specific context where we had om > text(-) > text(o)
        */

        const subreadings = {
            "orthographic": [
              {
                "text": [
                  {                   
                    "index": "14.1",
                    "verse": "Rom.1.10",
                    "020": {
                      "t": "οπως",
                      "index": "14",
                      "siglum": "020",
                      "original": "οπως",
                      "interface": "οπως",
                      "rule_match": [
                        "οπως"
                      ]
                    },
                    "interface": "οπως",
                    "reading": [
                      "020"
                    ]
                  }
                ],
                "text_string": "οπως",
                "witnesses": [
                  "020",
                ],
                "suffix": "o"
              }
            ]
          };

        const expectedSubreadings = JSON.parse(JSON.stringify(subreadings));
        // add the data we are expecting for the new subreading
        expectedSubreadings.orthographic[0].witnesses.push('2102*');
        expectedSubreadings.orthographic[0].text[0].reading.push('2102*');

        const reading = {
            "_id": "44949d5ecca24dffae35ed8c03f35328",
            "text": [
              {
                "33": {
                  "t": "ει",
                  "index": "14",
                  "siglum": "33",
                  "original": "ει",
                  "rule_match": [
                    "ει"
                  ]
                },
                "1506": {
                  "t": "ει",
                  "index": "16",
                  "siglum": "1506",
                  "original": "ει",
                  "rule_match": [
                    "ει"
                  ]
                },
                "index": "14.1",
                "verse": "Rom.1.10",
                "reading": [
                  "basetext",
                  "33",
                  "1506"
                ],
                "basetext": {
                  "t": "ει",
                  "index": "14",
                  "lemma": "ει",
                  "siglum": "basetext",
                  "original": "εἴ",
                  "rule_match": [
                    "ει"
                  ]
                },
                "interface": "ει"
              },
              {
                "33": {
                  "t": "πως",
                  "index": "16",
                  "siglum": "33",
                  "original": "πως",
                  "rule_match": [
                    "πως"
                  ]
                },
                "1506": {
                  "n": "πως",
                  "t": "πος",
                  "index": "18",
                  "siglum": "1506",
                  "unclear": true,
                  "original": "πο̣ς",
                  "rule_match": [
                    "πο̣ς"
                  ],
                  "decision_class": [
                    "regularised"
                  ],
                  "decision_details": [
                    {
                      "n": "πως",
                      "t": "πος",
                      "id": 285656,
                      "class": "regularised",
                      "scope": "once"
                    }
                  ]
                },
                "reading": [
                  "basetext",
                  "33",
                  "1506"
                ],
                "basetext": {
                  "t": "πως",
                  "index": "16",
                  "lemma": "πως",
                  "siglum": "basetext",
                  "original": "πως",
                  "rule_match": [
                    "πως"
                  ]
                },
                "interface": "πως"
              }
            ],
            "witnesses": [
              "basetext",
              "33",
              "1506",
              "L1126-S2W1D7",
              "020",
              "2102*"
            ],
            "SR_text": {
              "L1126-S2W1D7": {
                "text": [
                  {
                    "index": "14.1",
                    "verse": "Rom.1.10",
                    "L1126-S2W1D7": {
                      "t": "η",
                      "index": "14",
                      "siglum": "L1126-S2W1D7",
                      "original": "η",
                      "interface": "η",
                      "rule_match": [
                        "η"
                      ]
                    },
                    "interface": "η",
                    "reading": [
                      "L1126-S2W1D7"
                    ]
                  },
                  {
                    "index": "16.1",
                    "verse": "Rom.1.10",
                    "L1126-S2W1D7": {
                      "t": "πως",
                      "index": "16",
                      "siglum": "L1126-S2W1D7",
                      "original": "πως",
                      "interface": "πως",
                      "rule_match": [
                        "πως"
                      ]
                    },
                    "interface": "πως",
                    "reading": [
                      "L1126-S2W1D7"
                    ]
                  }
                ]
              },
              "020": {
                "text": [
                  {
                    "index": "14.1",
                    "verse": "Rom.1.10",
                    "020": {
                      "t": "οπως",
                      "index": "14",
                      "siglum": "020",
                      "original": "οπως",
                      "interface": "οπως",
                      "rule_match": [
                        "οπως"
                      ]
                    },
                    "interface": "οπως",
                    "reading": [
                      "020"
                    ]
                  }
                ]
              },
              "2102*": {
                "text": [],
                "type": "om"
              },
            },
            "label": "a",
            "standoff_subreadings": [
              "L1126-S2W1D7",
              "020"
            ],
            "subreadings": {
              "orthographic": [
                {
                  "text": [
                    {
                      "index": "14.1",
                      "verse": "Rom.1.10",
                      "020": {
                        "t": "οπως",
                        "index": "14",
                        "siglum": "020",
                        "original": "οπως",
                        "interface": "οπως",
                        "rule_match": [
                          "οπως"
                        ]
                      },
                      "interface": "οπως",
                      "reading": [
                        "020",
                      ]
                    }
                  ],
                  "text_string": "οπως",
                  "witnesses": [
                    "020"
                  ],
                  "suffix": "o"
                }
              ]
            }
          };

        const witness = '2102*';
    
        const typeList = ['none', 'orthographic'];

        const options = {
            "standoff": true,
            "rules": {
              "fehler": [
                "f",
                true
              ],
              "orthographic": [
                "o",
                true
              ]
            },
            "text": "οπως"
          }
        
        const newSubreadings = SR._addToSubreadings(subreadings, reading, witness, typeList, options);
        assert.equal(JSON.stringify(newSubreadings), JSON.stringify(expectedSubreadings));        
    });


    QUnit.test("test _addToSubreadings 4", (assert) => {
      /** This test uses the similar data to _addToSubreadings 2 and 3 but there is text in the subreading being added
      */

      const subreadings = {
          "orthographic": [
            {
              "text": [
                {                   
                  "index": "14.1",
                  "verse": "Rom.1.10",
                  "020": {
                    "t": "οπως",
                    "index": "14",
                    "siglum": "020",
                    "original": "οπως",
                    "interface": "οπως",
                    "rule_match": [
                      "οπως"
                    ]
                  },
                  "interface": "οπως",
                  "reading": [
                    "020"
                  ]
                }
              ],
              "text_string": "οπως",
              "witnesses": [
                "020",
              ],
              "suffix": "o"
            }
          ]
        };

      const expectedSubreadings = JSON.parse(JSON.stringify(subreadings));
      // add the data we are expecting for the new subreading
      expectedSubreadings.orthographic[0].witnesses.push('2102*');
      expectedSubreadings.orthographic[0].text[0].reading.push('2102*');
      expectedSubreadings.orthographic[0].text[0]['2102*'] = {"t": "οπως",
                                                              "index": "14",
                                                              "siglum": "2102*",
                                                              "original": "οπως",
                                                              "interface": "οπως",
                                                              "rule_match": [
                                                                "οπως"
                                                              ]};

      const reading = {
          "_id": "44949d5ecca24dffae35ed8c03f35328",
          "text": [
            {
              "33": {
                "t": "ει",
                "index": "14",
                "siglum": "33",
                "original": "ει",
                "rule_match": [
                  "ει"
                ]
              },
              "1506": {
                "t": "ει",
                "index": "16",
                "siglum": "1506",
                "original": "ει",
                "rule_match": [
                  "ει"
                ]
              },
              "index": "14.1",
              "verse": "Rom.1.10",
              "reading": [
                "basetext",
                "33",
                "1506"
              ],
              "basetext": {
                "t": "ει",
                "index": "14",
                "lemma": "ει",
                "siglum": "basetext",
                "original": "εἴ",
                "rule_match": [
                  "ει"
                ]
              },
              "interface": "ει"
            },
            {
              "33": {
                "t": "πως",
                "index": "16",
                "siglum": "33",
                "original": "πως",
                "rule_match": [
                  "πως"
                ]
              },
              "1506": {
                "n": "πως",
                "t": "πος",
                "index": "18",
                "siglum": "1506",
                "unclear": true,
                "original": "πο̣ς",
                "rule_match": [
                  "πο̣ς"
                ],
                "decision_class": [
                  "regularised"
                ],
                "decision_details": [
                  {
                    "n": "πως",
                    "t": "πος",
                    "id": 285656,
                    "class": "regularised",
                    "scope": "once"
                  }
                ]
              },
              "reading": [
                "basetext",
                "33",
                "1506"
              ],
              "basetext": {
                "t": "πως",
                "index": "16",
                "lemma": "πως",
                "siglum": "basetext",
                "original": "πως",
                "rule_match": [
                  "πως"
                ]
              },
              "interface": "πως"
            }
          ],
          "witnesses": [
            "basetext",
            "33",
            "1506",
            "L1126-S2W1D7",
            "020",
            "2102*"
          ],
          "SR_text": {
            "L1126-S2W1D7": {
              "text": [
                {
                  "index": "14.1",
                  "verse": "Rom.1.10",
                  "L1126-S2W1D7": {
                    "t": "η",
                    "index": "14",
                    "siglum": "L1126-S2W1D7",
                    "original": "η",
                    "interface": "η",
                    "rule_match": [
                      "η"
                    ]
                  },
                  "interface": "η",
                  "reading": [
                    "L1126-S2W1D7"
                  ]
                },
                {
                  "index": "16.1",
                  "verse": "Rom.1.10",
                  "L1126-S2W1D7": {
                    "t": "πως",
                    "index": "16",
                    "siglum": "L1126-S2W1D7",
                    "original": "πως",
                    "interface": "πως",
                    "rule_match": [
                      "πως"
                    ]
                  },
                  "interface": "πως",
                  "reading": [
                    "L1126-S2W1D7"
                  ]
                }
              ]
            },
            "020": {
              "text": [
                {
                  "index": "14.1",
                  "verse": "Rom.1.10",
                  "020": {
                    "t": "οπως",
                    "index": "14",
                    "siglum": "020",
                    "original": "οπως",
                    "interface": "οπως",
                    "rule_match": [
                      "οπως"
                    ]
                  },
                  "interface": "οπως",
                  "reading": [
                    "020"
                  ]
                }
              ]
            },
            "2102*": {
              "text": [
                {
                  "index": "14.1",
                  "verse": "Rom.1.10",
                  "2102*": {
                    "t": "οπως",
                    "index": "14",
                    "siglum": "2102*",
                    "original": "οπως",
                    "interface": "οπως",
                    "rule_match": [
                      "οπως"
                    ]
                  },
                  "interface": "οπως",
                  "reading": [
                    "2102*"
                  ]
                }
              ]
            },
          },
          "label": "a",
          "standoff_subreadings": [
            "L1126-S2W1D7",
            "020"
          ],
          "subreadings": {
            "orthographic": [
              {
                "text": [
                  {
                    "index": "14.1",
                    "verse": "Rom.1.10",
                    "020": {
                      "t": "οπως",
                      "index": "14",
                      "siglum": "020",
                      "original": "οπως",
                      "interface": "οπως",
                      "rule_match": [
                        "οπως"
                      ]
                    },
                    "interface": "οπως",
                    "reading": [
                      "020",
                    ]
                  }
                ],
                "text_string": "οπως",
                "witnesses": [
                  "020"
                ],
                "suffix": "o"
              }
            ]
          }
        };

      const witness = '2102*';
  
      const typeList = ['none', 'orthographic'];

      const options = {
          "standoff": true,
          "rules": {
            "fehler": [
              "f",
              true
            ],
            "orthographic": [
              "o",
              true
            ]
          },
          "text": "οπως"
        }
      
      const newSubreadings = SR._addToSubreadings(subreadings, reading, witness, typeList, options);
      assert.equal(JSON.stringify(newSubreadings), JSON.stringify(expectedSubreadings));        
  });
});