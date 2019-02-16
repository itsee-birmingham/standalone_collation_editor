/*jshint esversion: 6 */

RG = (function() {
  "use strict";

  //public variable declarations
  let showRegularisations = false;

  //private variable declarations
  let _rules = {},
      _forDeletion = [],
      _forGlobalExceptions = [];

  //public function declarations
  let getCollationData, getUnitData, recollate, showVerseCollation, allRuleStacksEmpty;

  //private function declarations
  let _calculateLacWits, _hasRuleApplied, _getDisplayClasses, _getToken, _getWordTokenForWitness,
  _hasDeletionScheduled, _getRegWitsAsString, _runCollation, _integrateLacOmReadings,
  _doRunCollation, _showSettings, _fetchRules, _removeUnrequiredData, _showRegularisations,
  _highlightWitness, _addNewToken, _getWordIndexForWitness, _createRule, _getDisplaySettingValue,
  _setUpRuleMenu, _getRuleScopes, _getSuffix, _makeMenu, _redipsInitRegularise,
  _getAncestorRow, _showGlobalExceptions, _removeGlobalExceptions, _scheduleAddGlobalException,
  _scheduleRuleDeletion, _deleteUnappliedRule, _addContextMenuHandlers, _showCollationTable,
  _scheduleSelectedRulesDeletion;

  //*********  public functions *********

  getCollationData = function(output, scroll_offset, callback) {
    CL.container = document.getElementById('container');
    CL.services.getVerseData(CL.context, CL.dataSettings.witness_list, false, function(verse_data) {
      var collation_data;
      collation_data = verse_data;
      //TODO: remove this call since we don't have separate private transcriptions now
      CL.services.getVerseData(CL.context, CL.dataSettings.witness_list, true, function(verse_data, lac_wits_function) {
        collation_data.push.apply(collation_data, verse_data);
        _calculateLacWits(collation_data, function(lac_witness_list) {
          CL.services.getSiglumMap(lac_witness_list, function(lac_witnesses) {
            CL.collateData = {
              'data': collation_data,
              'lac_witnesses': lac_witnesses
            };
            if (typeof callback !== 'undefined') {
              callback();
            } else {
              _runCollation(CL.collateData, output, scroll_offset);
            }
          });
        });
      });
    });
  };

  /** get the data for the unit of this type
   * 	data - the readings for that unit
   * 	id - the identifier for the unit
   * 	start - the start position
   * 	end - the end position
   * 	options - possibilities are:
   *
   * */
  getUnitData = function(data, id, start, end, options) {
    var i, html, j, k, l, decisions, rows, cells, row_list, temp, events, max_length, row_id, type,
      subrow_id, colspan, hand, class_string, div_class_string, witness, id_dict, key, words, reg_class,
      highlighted, cells_dict, rule_cells, keys_to_sort, class_list, variant_unit_id;
    if (typeof options === 'undefined') {
      options = {};
    }
    if (options.hasOwnProperty('highlighted_wit')) {
      hand = options.highlighted_wit.split('|')[1];
    } else {
      hand = null;
    }
    html = [];
    row_list = [];
    events = {};
    decisions = [];
    max_length = ((end - start) / 2) + 1;
    rows = [];
    for (i = 0; i < data.length; i += 1) {
      cells = [];
      row_id = 'variant_unit_' + id + '_row_' + i;
      row_list.push(row_id);
      if (i === 0) {
        cells.push('<tr><td class="mark" colspan="MX_LN"><span id="toggle_variant_' + id + '" class="triangle">&#9650;</span></td></tr>');
      }
      class_string = '';
      if (data[i].witnesses.indexOf(hand) != -1 && i === 0) {
        class_string = ' class="top highlighted" ';
      } else if (data[i].witnesses.indexOf(hand) != -1) {
        class_string = ' class="highlighted" ';
      } else if (i === 0) {
        class_string = ' class="top" ';
      }
      cells.push('<tr id="' + row_id + '"' + class_string + '>');
      cells.push('<td class="mark"><div class="spanlike">' + CL.getAlphaId(i) + '. </div></td>');
      if (data[i].text.length === 0) {
        if (i === 0) {
          cells.push('<td class="mark" colspan="MX_LN"><div class="spanlike">&nbsp;</div></td>');
        } else {
          if (data[i].type === 'om') {
            cells.push('<td class="mark gap" colspan="MX_LN"><div class="spanlike">om.</div></td>');
          } else {
            cells.push('<td class="mark gap" colspan="MX_LN"><div class="spanlike">&lt;' + data[i].details + '&gt;</div></td>');
          }
        }
      } else {
        if (data[i].text.length > max_length) {
          max_length = data[i].text.length;
        }
        for (j = 0; j < data[i].text.length; j += 1) {
          variant_unit_id = 'variant_unit_' + id + '_r' + i + '_w' + j;
          div_class_string = '';
          if (i > 0) {
            class_list = ['drag', 'clone', 'reg_word'];
            if (_hasRuleApplied(variant_unit_id)) {
              class_list.push('regularisation_staged');
            }
            class_list.push(_getDisplayClasses(data[i].text[j]));
            div_class_string = ' class="' + class_list.join(' ') + '" ';
          }
          cells.push('<td>');
          words = data[i].text;
          if (words[j][words[j].reading[0]].hasOwnProperty('gap_before') && words[j].hasOwnProperty('combined_gap_before')) {
            cells.push('<div class="gap spanlike"> &lt;' + words[j][words[j].reading[0]].gap_details + '&gt; </div>');
          }
          cells.push('<div ' + div_class_string + 'id="' + variant_unit_id + '">' + _getToken(words[j]) + '</div>');
          if (words[j][words[j].reading[0]].hasOwnProperty('gap_after') && (j < words.length - 1 || words[j].hasOwnProperty('combined_gap_after'))) {
            cells.push('<div class="gap spanlike"> &lt;' + words[j][words[j].reading[0]].gap_details + '&gt; </div>');
          }
          if (RG.showRegularisations) {
            id_dict = {};
            for (k = 0; k < data[i].witnesses.length; k += 1) {
              witness = data[i].witnesses[k];
              if (data[i].text[j].hasOwnProperty(witness) && data[i].text[j][witness].hasOwnProperty('decision_details')) {
                for (l = 0; l < data[i].text[j][witness].decision_details.length; l += 1) {
                  if (id_dict.hasOwnProperty(data[i].text[j][witness].decision_details[l].id)) {
                    id_dict[data[i].text[j][witness].decision_details[l].id].witnesses.push(witness);
                  } else {
                    id_dict[data[i].text[j][witness].decision_details[l].id] = {
                      'scope': data[i].text[j][witness].decision_details[l].scope,
                      't': data[i].text[j][witness].decision_details[l].t.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
                      'n': data[i].text[j][witness].decision_details[l].n.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
                      'class': data[i].text[j][witness].decision_details[l].class.replace(/[^a-zA-Z]'/g, '_'),
                      'witnesses': [witness]
                    };
                  }
                }
              }
            }
            if (Object.keys(id_dict).length > 1) {
              cells.push('<table><tbody class="selectable">');
            } else {
              cells.push('<table><tbody>');
            }
            keys_to_sort = [];
            cells_dict = {};
            for (key in id_dict) {
              if (id_dict.hasOwnProperty(key)) {
                rule_cells = [];
                if (id_dict[key].scope === 'always') {
                  reg_class = 'regularised_global ';
                } else {
                  reg_class = 'regularised ';
                }
                if (_hasDeletionScheduled(key)) {
                  reg_class += 'deleted ';
                }
		reg_class += 'regclass_'+id_dict[key].class + ' ';
                highlighted = '';
                if (id_dict[key].witnesses.length > 1) {
                  id_dict[key].witnesses = CL.sortWitnesses(id_dict[key].witnesses);
                }
                if (keys_to_sort.indexOf(id_dict[key].witnesses[0]) === -1) {
                  keys_to_sort.push(id_dict[key].witnesses[0]);
                }
                if (id_dict[key].witnesses.indexOf(hand) !== -1) {
                  highlighted = 'highlighted ';
                }
                subrow_id = row_id + '_word_' + j + '_rule_' + key;
                rule_cells.push('<tr class="' + reg_class + highlighted + '" id="' + subrow_id + '"><td>');
                if (id_dict[key].witnesses.indexOf(hand) !== -1) {
                  rule_cells.push('<div class="spanlike">');
                }
                rule_cells.push(id_dict[key].t.replace(/_/g, '&#803;'));
                rule_cells.push(' &#9654; ');
                rule_cells.push(id_dict[key].n.replace(/_/g, '&#803;'));
                if (id_dict[key].witnesses.indexOf(hand) !== -1) {
                  rule_cells.push('</div>');
                }
                rule_cells.push('</td></tr>');
                if (cells_dict.hasOwnProperty(id_dict[key].witnesses[0])) {
                  cells_dict[id_dict[key].witnesses[0]].push(rule_cells.join(' '));
                } else {
                  cells_dict[id_dict[key].witnesses[0]] = [rule_cells.join(' ')];
                }
                events[subrow_id] = id_dict[key].scope + ': ' + _getRegWitsAsString(id_dict[key].witnesses) + ' (' + id_dict[key].class + ')';
              }
            }
            keys_to_sort = CL.sortWitnesses(keys_to_sort);
            for (k = 0; k < keys_to_sort.length; k += 1) {
              if (cells_dict.hasOwnProperty(keys_to_sort[k])) {
                cells.push(cells_dict[keys_to_sort[k]].join(' '));
              }
            }
            cells.push('</tbody></table>');
          }
          cells.push('</td>');
        }
      }
      cells.push('</tr>');
      rows.push(cells.join(''));
    }
    html.push('<td class="start_' + start + '" colspan="' + (end - start + 1) + '"><div class="drag_div" id="drag' + id + '">');
    html.push('<table class="variant_unit" id="variant_unit_' + id + '">');
    html.push(rows.join('').replace(/MX_LN/g, String(max_length + 1)));
    //html.push(utils.TEMPLATE.replace_all(rows.join(''), 'MX_LN', String(max_length + 1)));
    html.push('<tr><td class="mark" colspan="' + (max_length + 1) + '"><span id="add_reading_' + id + '">+</span></td></tr>');
    html.push('</table>');
    html.push('</div></td>');
    return [html, row_list, events];
  };

  recollate = function(reset_scroll) {
    var options, scroll_offset;
    SPN.show_loading_overlay();
    if (reset_scroll === undefined) {
      reset_scroll = false;
    }
    scroll_offset = 0;
    if (!reset_scroll) {
      scroll_offset = [document.getElementById('scroller').scrollLeft,
        document.getElementById('scroller').scrollTop
      ];
    }
    if ($.isEmptyObject(CL.collateData)) {
      getCollationData('units', scroll_offset, function() {
        _runCollation(CL.collateData, 'units', scroll_offset);
      }); //collation_source, output, scroll_offset, callback
    } else {
      _runCollation(CL.collateData, 'units', scroll_offset);
    }
  };

  showVerseCollation = function(data, context, container, options) {
    var html, i, last_row, tr, temp, event_rows, row, triangles, bk, ch, v, nextCh, nextV, prevCh, prevV,
      header, unit_events, key, global_exceptions_html, show_hide_regularisations_button_text;
    console.log(JSON.parse(JSON.stringify(data)));

    if (typeof options === 'undefined') {
      options = {};
    }
    if (!options.hasOwnProperty('highlighted_wit') && CL.highlighted !== 'none') {
      options.highlighted_wit = CL.highlighted;
    }
    options.sort = true;
    SimpleContextMenu.setup({
      'preventDefault': true,
      'preventForms': false
    });
    SimpleContextMenu.attach('ui-selected', function() {
      return _makeMenu('group_delete');
    });
    SimpleContextMenu.attach('regularised', function() {
      return _makeMenu('regularised');
    });
    SimpleContextMenu.attach('regularised_global', function() {
      return _makeMenu('regularised_global');
    });
    SimpleContextMenu.attach('regularisation_staged', function() {
      return _makeMenu('regularisation_staged');
    });

    CL.lacOmFix();
    temp = CL.getUnitLayout(CL.data.apparatus, 1, 'regularise', options);
    header = CL.getCollationHeader(CL.data, temp[1], false);
    html = header[0];
    html.push.apply(html, temp[0]);
    html.push('<ul id="context_menu" class="SimpleContextMenu"></ul>');
    document.getElementById('header').innerHTML = CL.getHeaderHtml('Regulariser', CL.context);
    //TODO: this might need to be improved everywhere it has been done if it turns out we need this in the services
    if (CL.services.hasOwnProperty('showLoginStatus')) {
      CL.services.showLoginStatus();
    }
    document.getElementById('header').className = 'regularisation_header';
    global_exceptions_html = '<div class="dialogue_form dragdiv"  id="global_exceptions" style="display:none"><div class="dialogue_form_header" id="global_exceptions_header"><span>Global Exceptions</span><span id="global_exceptions_ex">&#9660;</span></div><div id="global_exceptions_list" style="display:none"></div></div>';
    container.innerHTML = '<div id="scroller" class="fillPage"><table class="collation_overview">' +
      html.join('') + '</table>' + global_exceptions_html + '</div><div id="single_witness_reading"></div>';
    CL.expandFillPageClients();

    if (RG.showRegularisations === true) {
      show_hide_regularisations_button_text = 'hide regularisations';
      CL.services.getRuleExceptions(CL.context, function(rules) {
        if (rules.length > 0) {
          _showGlobalExceptions(rules);
        } else {
          return;
        }
      });
    } else {
      show_hide_regularisations_button_text = 'show regularisations';
    }
    $('#footer').addClass('pure-form'); //this does the styling of the select elements in the footer using pure (they cannot be styled individually)
    document.getElementById('footer').innerHTML = '<button class="pure-button left_foot" id="expand_collapse_button">collapse all</button>' +
      '<button class="pure-button left_foot" id="show_hide_regularisations_button">' + show_hide_regularisations_button_text + '</button>' +
      '<span id="stage_links"></span>' +
      '<span id="extra_buttons"></span>' +
      '<button class="pure-button right_foot" id="go_to_sv_button">move to set variants</button>' +
      '<button class="pure-button right_foot" id="save_button">save</button>' +
      '<button class="pure-button right_foot" id="recollate_button" type="button">recollate</button>' +
      '<button class="pure-button right_foot" id="settings_button">settings</button>' +
      '<select class="right_foot" id="highlighted" name="highlighted"></select>';

    SPN.remove_loading_overlay();
    CL.addExtraFooterButtons('regularised');
    CL.addStageLinks();
    $('#go_to_sv_button').on('click',
      function(event) {
        var extra_results;
        SPN.show_loading_overlay();
        //remove any forms still present
        if (document.getElementById('reg_form')) {
          document.getElementById('reg_form').parentNode.removeChild(document.getElementById('reg_form'));
        }
        if (document.getElementById('global_exceptions')) {
          document.getElementById('global_exceptions').parentNode.removeChild(document.getElementById('global_exceptions'));
        }
        //check that there are no rules in stacks waiting to be added/deleted/have exceptions made etc.
        if (allRuleStacksEmpty()) {
          if (SV.areAllUnitsComplete()) { //check nothing is lost and we have a full complement of witnesses for each unit
            extra_results = CL.applyPreStageChecks('set_variants');
            if (extra_results[0] === true) {
              _removeUnrequiredData(); //remove the key-value pairs we don't need anymore
              CL.data.marked_readings = {}; //added for SV
              CL.addUnitAndReadingIds(); //added for SV

              SV.showSetVariants({
                'container': container
              });
              document.getElementById('scroller').scrollLeft = 0;
              document.getElementById('scroller').scrollTop = 0;
            } else {
              if (CL.showSubreadings === true) {
                SR.findSubreadings();
              }
              alert(extra_results[1]);
              SPN.remove_loading_overlay();
            }
          } else {
            alert('You cannot move to set variants because one of the units does not have all of its required witnesses');
            SPN.remove_loading_overlay();
          }
        } else {
          alert('You must recollate before moving to set variants because there are rule changes that have not yet been applied.');
          SPN.remove_loading_overlay();
        }
      });
    $('#settings_button').on('click',
      function(event) {
        _showSettings();
      });
    $('#recollate_button').on('click',
      function(event) {
        RG.recollate();
      });
    $('#save_button').on('click',
      function(event) {
        CL.saveCollation('regularised');
      });
    CL.addTriangleFunctions('table');
    cforms.populateSelect(CL.getHandsAndSigla(), document.getElementById('highlighted'), {'value_key': 'document', 'text_keys': 'hand', 'selected':options.highlighted_wit});
    //TODO: probably better in for loop
    i = 0;
    while (i <= temp[4]) {
      if (document.getElementById('drag' + i) !== null) {
        _redipsInitRegularise('drag' + i);
      }
      if (document.getElementById('add_reading_' + i) !== null) {
        _addNewToken(document.getElementById('add_reading_' + i));
      }
      i += 1;
    }
    $('.selectable').selectable({
      'cancel': 'regularised_global',
      selected: function(event, ui) {$(ui.selected).removeClass('regularised');},
      unselected: function(event, ui) {$(ui.unselected).addClass('regularised');}
    });
    $('#highlighted').on('change', function(event) {
      _highlightWitness(event.target.value);
    });
    _showRegularisations();

    CL.makeVerseLinks();

    event_rows = temp[2];
    for (i = 0; i < event_rows.length; i += 1) {
      row = document.getElementById(event_rows[i]);
      if (row !== null) {
        CL.addHoverEvents(row);
      }
    }
    unit_events = temp[3];
    for (key in unit_events) {
      if (unit_events.hasOwnProperty(key)) {
        row = document.getElementById(key);
        if (row) {
          CL.addHoverEvents(row, unit_events[key]);
        }
      }
    }
  };

  allRuleStacksEmpty = function() {
    if (!$.isEmptyObject(_rules) || _forDeletion.length > 0 || _forGlobalExceptions.length > 0) {
      return false;
    }
    return true;
  };

  //pub-e

  //*********  private functions *********

  _calculateLacWits = function(collation_data, result_callback) {
    var i, transcription_id, lac_transcriptions;
    lac_transcriptions = JSON.parse(JSON.stringify(CL.dataSettings.witness_list));
    if (collation_data[0].hasOwnProperty('transcription_id')) {
      console.warn('The use of \'transcription_id\' is deprecated. \'transcription\' should be used instead.');
    }
    for (i = 0; i < collation_data.length; i += 1) {
      //TODO: remove first condition and keep final two when transcription_id key no longer supported
      if (collation_data[i].hasOwnProperty('transcription_id')) {
        transcription_id = collation_data[i].transcription_id;
      } else if (collation_data[i].hasOwnProperty('transcription_identifier')) {
        transcription_id = collation_data[i].transcription_identifier;
      } else {
        transcription_id = collation_data[i].transcription;
      }
      if (lac_transcriptions.indexOf(transcription_id) !== -1) {
        lac_transcriptions.splice(lac_transcriptions.indexOf(transcription_id), 1);
      }
    }
    result_callback(lac_transcriptions);
  };

  _hasRuleApplied = function(id) {
    if (_rules.hasOwnProperty(id)) {
      return true;
    }
    return false;
  };

  _getDisplayClasses = function(word) {
    for (let i = 0; i < word.reading.length; i += 1) {
      if (word.hasOwnProperty(word.reading[i])) {
        if (word[word.reading[i]].hasOwnProperty('display_class')) {
          return word[word.reading[i]].display_class.join(' ');
        }
      }
    }
    return '';
  };

  /** returns the token with the following priorities
   * interface > n > t */
  _getToken = function(dict) {
    if (dict.hasOwnProperty('interface')) {
      return dict['interface'].replace(/_/g, '&#803;');
    }
    if (dict.hasOwnProperty('n')) {
      return dict.n.replace(/_/g, '&#803;');
    }
    return dict.t.replace(/_/g, '&#803;');
  };

  _getWordTokenForWitness = function(unit, reading, word) {
    var token;
    token = CL.data.apparatus[unit].readings[reading].text[word];
    return token['interface'];
  };

  _hasDeletionScheduled = function(rule_id) {
    for (let i = 0; i < _forDeletion.length; i += 1) {
      if (_forDeletion[i].id === rule_id) {
        return true;
      }
    }
    for (let i = 0; i < _forGlobalExceptions.length; i += 1) {
      if (_forGlobalExceptions[i].id === rule_id) {
        return true;
      }
    }
    return false;
  };

  _getRegWitsAsString = function(wit_list) {
    var i, new_wits;
    new_wits = [];
    for (i = 0; i < wit_list.length; i += 1) {
      new_wits.push(wit_list[i]);
    }
    return new_wits.join(', ');
  };

  _runCollation = function(collation_data, output, scroll_offset) {
    var rule_list;
    //put all the rules in a sinlge list
    rule_list = [];
    for (let key in _rules) {
      if (_rules.hasOwnProperty(key)) {
        rule_list.push.apply(rule_list, _rules[key]);
      }
    }
    CL.services.updateRuleset(_forDeletion, _forGlobalExceptions, rule_list, CL.context, function() {
      _forDeletion = [];
      _forGlobalExceptions = [];
      _rules = {};
      _fetchRules(collation_data, function(rules) {
        _doRunCollation(collation_data, rules, output, scroll_offset);
      });
    });
  };

  /** add lac_verse and om_verse to the collated data */
  _integrateLacOmReadings = function(data) {
    var i;
    if (typeof data.lac_readings !== 'undefined' && data.lac_readings.length > 0) {
      for (i = 0; i < data.apparatus.length; i += 1) {
        if (data.lac_readings.indexOf(data.overtext_name) != -1) {
          data.apparatus[i].readings.splice(0, 0, {
            'text': [],
            'type': 'lac_verse',
            'details': 'lac verse',
            'witnesses': data.lac_readings
          });
        } else {
          data.apparatus[i].readings.push({
            'text': [],
            'type': 'lac_verse',
            'details': 'lac verse',
            'witnesses': data.lac_readings
          });
        }
      }
    }
    if (typeof data.om_readings !== 'undefined' && data.om_readings.length > 0) {
      for (i = 0; i < data.apparatus.length; i += 1) {
        if (data.om_readings.indexOf(data.overtext_name) != -1) {
          data.apparatus[i].readings.splice(0, 0, {
            'text': [],
            'type': 'om_verse',
            'details': 'om verse',
            'witnesses': data.om_readings
          });
        } else {
          data.apparatus[i].readings.push({
            'text': [],
            'type': 'om_verse',
            'details': 'om verse',
            'witnesses': data.om_readings
          });
        }
      }
    }
    return data;
  };

  _doRunCollation = function(collation_data, rules, output, scroll_offset) {
    var options, setting, result_callback, data_settings,
      algorithm_settings, displaySettings;
    options = {};
    options.rules = rules;
    if (!$.isEmptyObject(CL.localPythonFunctions)) {
      options.local_python_functions = CL.localPythonFunctions;
    }
    options.data_input = collation_data;
    if (CL.project.hasOwnProperty('id')) {
      options.project = CL.project.id;
    }
    //data settings
    data_settings = {};
    data_settings.base_text = CL.dataSettings.base_text;
    data_settings.base_text_siglum = CL.dataSettings.base_text_siglum;
    data_settings.language = CL.dataSettings.language;
    data_settings.witness_list = CL.dataSettings.witness_list;
    options.data_settings = data_settings;

    displaySettings = {};
    for (setting in CL.displaySettings) {
      if (CL.displaySettings.hasOwnProperty(setting)) {
        if (CL.displaySettings[setting] === true) {
          displaySettings[setting] = CL.displaySettings[setting];
        }
      }
    }
    options.display_settings = displaySettings;
    options.display_settings_config = CL.displaySettingsDetails;
    options.rule_conditions_config = CL.ruleConditions;

    algorithm_settings = {};
    for (setting in CL.algorithmSettings) {
      if (CL.algorithmSettings.hasOwnProperty(setting)) {
        if (CL.algorithmSettings[setting] !== false) {
          algorithm_settings[setting] = CL.algorithmSettings[setting];
        }
      }
    }
    options.algorithm_settings = algorithm_settings;
    //TODO: this needs deleting or moving to services
    // if (output === 'table') {
    //   if (document.getElementById('book').value !== 'none' &&
    //     document.getElementById('chapter').value !== 'none' &&
    //     document.getElementById('verse').value !== 'none') {
    //
    //     CL.context = document.getElementById('book').value + 'K' +
    //       document.getElementById('chapter').value +
    //       'V' + document.getElementById('verse').value;
    //
    //     result_callback = function(data) {
    //
    //       _showCollationTable(CL.data, CL.context, document.getElementById('container'));
    //     };
    //     options.accept = 'json';
    //   } else {
    //     return;
    //   }
    //
    // } else {
      result_callback = function(data) {
        if (data === null) {
          alert(CL.context + ' does not collate.');
          SPN.remove_loading_overlay();
          location.reload();
          return;
        }
        CL.data = data;
        CL.data = _integrateLacOmReadings(CL.data);
        CL.dataSettings.base_text_siglum = data.overtext_name;
        showVerseCollation(CL.data, CL.context, document.getElementById('container'));
        if (scroll_offset !== undefined) {
          document.getElementById('scroller').scrollLeft = scroll_offset[0];
          document.getElementById('scroller').scrollTop = scroll_offset[1];
        }
      };
    // }
    // options.error = function() {
    //   alert(CL.context + ' does not collate.');
    //   SPN.remove_loading_overlay();
    // };
    CL.services.doCollation(CL.context, options, result_callback);
  };

  _showSettings = function() {
    var settings_div, i, settings_html;
    if (document.getElementById('settings') !== null) {
      document.getElementsByTagName('body')[0].removeChild(document.getElementById('settings'));
    }
    settings_div = document.createElement('div');
    settings_div.setAttribute('id', 'settings');
    settings_div.setAttribute('class', 'settings_dialogue dialogue_form');
    settings_div.innerHTML = '<div class="dialogue_form_header"><span id="settings_title">Settings</span></div><form id="settings_form"></form>';
    settings_html = [];
    CL.displaySettingsDetails.configs.sort(function(a, b) {
      return a.menu_pos - b.menu_pos;
    });
    for (i = 0; i < CL.displaySettingsDetails.configs.length; i += 1) {
      if (CL.displaySettingsDetails.configs[i].menu_pos === null) {
        settings_html.push('<input class="boolean" name="' + CL.displaySettingsDetails.configs[i].id +
          '" id="' + CL.displaySettingsDetails.configs[i].id +
          '" type="hidden" value="' + CL.displaySettingsDetails.configs[i].check_by_default + '"/>');
      } else {
        settings_html.push('<label for="' + CL.displaySettingsDetails.configs[i].id + '">');
        settings_html.push('<input class="boolean" name="' + CL.displaySettingsDetails.configs[i].id + '" id="' + CL.displaySettingsDetails.configs[i].id + '" type="checkbox"/>');
        settings_html.push(CL.displaySettingsDetails.configs[i].label + '</label>');
        settings_html.push('<br/>');
      }
    }
    settings_html.push('<input class="pure-button dialogue-form-button" type="button" id="save_settings" value="save and recollate"/>');
    settings_html.push('<input class="pure-button dialogue-form-button" type="button" id="close_settings" value="cancel"/>');
    document.getElementsByTagName('body')[0].appendChild(settings_div);
    document.getElementById('settings_form').innerHTML = settings_html.join('');
    for (i = 0; i < CL.displaySettingsDetails.configs.length; i += 1) {
      if (document.getElementById(CL.displaySettingsDetails.configs[i].id)) {
        document.getElementById(CL.displaySettingsDetails.configs[i].id).checked = CL.displaySettings[CL.displaySettingsDetails.configs[i].id];
      }
    }
    $('#save_settings').on('click', function(event) {
      var setting, data;
      data = cforms.serialiseForm('settings_form');
      for (setting in CL.displaySettings) {
        if (CL.displaySettings.hasOwnProperty(setting)) {
          if (data.hasOwnProperty(setting) && data[setting] !== null) {
            CL.displaySettings[setting] = data[setting];
          } else {
            CL.displaySettings[setting] = false;
          }
        }
      }
      RG.recollate();
      document.getElementsByTagName('body')[0].removeChild(document.getElementById('settings'));
    });
    $('#close_settings').on('click', function(event) {
      document.getElementsByTagName('body')[0].removeChild(document.getElementById('settings'));
    });
  };

  _fetchRules = function(collation_data, callback) {
    //get the rules according to the appropriate service
    CL.services.getRules(CL.context, function(rules) {
      callback(rules);
    });
  };

  _removeUnrequiredData = function() {
    var i, j, k;
    for (i = 0; i < CL.data.apparatus.length; i += 1) {
      for (j = 0; j < CL.data.apparatus[i].readings.length; j += 1) {
        for (k = 0; k < CL.data.apparatus[i].readings[j].text.length; k += 1) {
          if (CL.data.apparatus[i].readings[j].text[k].hasOwnProperty('rule_string')) {
            delete CL.data.apparatus[i].readings[j].text[k].rule_string;
          }
        }
      }
    }
  };

  _showRegularisations = function() {
    if (RG.showRegularisations === true) {
      if (document.getElementById('show_hide_regularisations_button')) {
        document.getElementById('show_hide_regularisations_button').value = document.getElementById('show_hide_regularisations_button').value.replace('show', 'hide');
        $('#show_hide_regularisations_button').on('click.hide_regularisations', function(event) {
          var scroll_offset;
          SPN.show_loading_overlay();
          scroll_offset = [document.getElementById('scroller').scrollLeft,
            document.getElementById('scroller').scrollTop
          ];
          RG.showRegularisations = false;
          showVerseCollation(CL.data, CL.context, CL.container);
          document.getElementById('scroller').scrollLeft = scroll_offset[0];
          document.getElementById('scroller').scrollTop = scroll_offset[1];
        });
      }
    } else {
      if (document.getElementById('show_hide_regularisations_button')) {
        document.getElementById('show_hide_regularisations_button').value = document.getElementById('show_hide_regularisations_button').value.replace('hide', 'show');
        $('#show_hide_regularisations_button').on('click.show_regularisations', function(event) {
          var scroll_offset;
          SPN.show_loading_overlay();
          scroll_offset = [document.getElementById('scroller').scrollLeft,
            document.getElementById('scroller').scrollTop
          ];
          RG.showRegularisations = true;
          showVerseCollation(CL.data, CL.context, CL.container);
          document.getElementById('scroller').scrollLeft = scroll_offset[0];
          document.getElementById('scroller').scrollTop = scroll_offset[1];
        });
      }
    }
  };

  _highlightWitness = function(witness) {
    var scroll_offset;
    scroll_offset = [document.getElementById('scroller').scrollLeft,
      document.getElementById('scroller').scrollTop
    ];
    CL.highlighted = witness;
    showVerseCollation(CL.data, CL.context, CL.container, {
      'highlighted_wit': witness
    });
    document.getElementById('scroller').scrollLeft = scroll_offset[0];
    document.getElementById('scroller').scrollTop = scroll_offset[1];
    if (witness !== 'none') {
      CL.getHighlightedText(witness);
    }
  };

  _addNewToken = function(element) {
    var last_row, event, tr;
    $(element).on('click', function(event) {
      last_row = event.target.parentNode.parentNode;
      tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="' + event.target.parentNode.getAttribute('colspan') + '"><input type="text" size="10"/></td>';
      last_row.parentNode.insertBefore(tr, last_row);
    });
  };

  _getWordIndexForWitness = function(unit, reading, word, witness) {
    var token;
    token = CL.data.apparatus[unit].readings[reading].text[word];
    return token[witness].index;
  };

  _createRule = function(data, user, original_text, normalised_text, unit, reading, word, witnesses) {
    var rule, rules, witness, context, i, j, reconstructed_readings;
    //sort text out so that anything we turned to &lt; or &gt; get stored as < and >
    //TODO: I'm not sure we even use original_text anymore - check and streamline?
    original_text = original_text;
    normalised_text = normalised_text.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    //now make the rules
    if (data.scope === 'always' || data.scope === 'verse') {
      rule = {
        'type': 'regularisation',
        'scope': data.scope,
        'class': data['class'] || 'none',
        't': _getWordTokenForWitness(unit, reading, word).replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        'n': normalised_text
      };
      if (data.hasOwnProperty('comments')) {
        rule.comments = data.comments;
      }
      if (data.hasOwnProperty('conditions')) {
        rule.conditions = data.conditions;
      }
      if (data.scope === 'always') {
        rule.context = {};
      } else if (data.scope === 'verse') {
        rule.context = {};
        rule.context.unit = CL.context;
      }
      if (CL.project.hasOwnProperty('id')) {
        rule.project = CL.project.id;
      }
      if (CL.project.hasOwnProperty('id')) {
        rule.project = CL.project.id;
      } else {
        rule.user = user.id;
      }
      return [rule];
    }
    if (data.scope === 'manuscript' || data.scope === 'once') {
      rules = [];
      for (i = 0; i < witnesses.length; i += 1) {
        witness = witnesses[i];
        rule = {
          'type': 'regularisation',
          'scope': data.scope,
          'class': data['class'] || 'none',
          'n': normalised_text
        };
        if (data.hasOwnProperty('comments')) {
          rule.comments = data.comments;
        }
        if (data.hasOwnProperty('conditions')) {
          rule.conditions = data.conditions;
        }
        if (CL.project.hasOwnProperty('id')) {
          rule.project = CL.project.id;
        } else {
          rule.user = user.id;
        }
        //check to see if witness already has a reconstructed rule applied and if so make sure we are ignoring the presence of underdots and []
        if (CL.data.apparatus[unit].readings[reading].text[word][witness].hasOwnProperty('decision_class')) {
          reconstructed_readings = [];
          for (j = 0; j < CL.project.ruleClasses; j += 1) {
            if (CL.project.ruleClasses[j].hasOwnProperty('reconstructedreading') && CL.project.ruleClasses[j].reconstructedreading === true) {
              reconstructed_readings.push(CL.project.ruleClasses[j].value);
            }
          }
          for (j = 0; j < CL.data.apparatus[unit].readings[reading].text[word][witness].decision_class.length; j += 1) {
            if (reconstructed_readings.indexOf(CL.data.apparatus[unit].readings[reading].text[word][witness].decision_class) !== -1) {
              if (!rule.conditions) {
                rule.conditions = {};
              }
              rule.conditions.ignore_supplied = true;
              rule.conditions.ignore_unclear = true;
            }
          }
        }
        if (data.scope === 'manuscript') {
          rule.context = {
            'witness': witness
          };
          //rule.t = original_text;
          rule.t = _getWordTokenForWitness(unit, reading, word).replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        } else if (data.scope === 'once') {
          context = {};
          context.unit = CL.context;
          context.witness = witness;
          context.word = _getWordIndexForWitness(unit, reading, word, witness);
          rule.context = context;
          rule.t = _getWordTokenForWitness(unit, reading, word).replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        }
        rules.push(rule);
      }
      return rules;
    }
  };

  _redipsInitRegularise = function(id) {
    var rd, data, clone, original_form, normalised_form, normalised_text,
      reg_menu, scope, clas, comments, witnesses, context, unit_data,
      witness, unit, reading, word, original, original_text, suffix,
      reg_rules, key, new_reg_rules, selected, ignore_supplied, ignore_unclear,
      create_function, original_display_text, word_id;
    rd = REDIPS.drag;
    rd.init(id);
    rd.event.dropped = function() {
      clone = document.getElementById(rd.obj.id);
      original = document.getElementById(rd.objOld.id);
      word_id = rd.objOld.id;
      normalised_form = rd.td.target.childNodes[0];
      //if we are normalising to a typed in value
      if (normalised_form.tagName === 'INPUT') {
        normalised_text = normalised_form.value.trim();
        if (/^\s*$/.test(normalised_text) === false) { //it there is at least one non-space character
          if (/^\S+\s\S/.test(normalised_text) === true) { // if there are two or more strings separated by a space
            //you have typed a space into the box with is not allowed, regularisation is single token to single token only!
            if (clone.parentNode !== null) {
              clone.parentNode.removeChild(clone);
            }
            alert('You are not allowed to regularise to multiple tokens, the normalised form must not include spaces.\nIf you need to regularise to multiple words this can be done in the Set Variants interface');
            return;
          } else {
            //you are asking to regularise a single token to a single token that is allowed and we will continue
            rd.td.target.innerHTML = '<div>' + normalised_text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
          }
        } else {
          //you are trying to normalise to an empty string so stop it!
          if (clone.parentNode !== null) {
            clone.parentNode.removeChild(clone);
          }
          return;
        }
      } else { // we are normalising to an existing value
        normalised_text = normalised_form.childNodes[0].textContent;
      }
      normalised_text = normalised_text.replace(/̣/g, '_');
      //stop the dragged clone being added to the dom
      if (clone.parentNode !== null) {
        clone.parentNode.removeChild(clone);
      }
      unit_data = rd.objOld.id;
      //get the unit, reading and word data to lookup stuff in data structure
      unit = parseInt(unit_data.substring(0, unit_data.indexOf('_r')).replace('variant_unit_', ''), 10);
      reading = parseInt(unit_data.substring(unit_data.indexOf('_r') + 2, unit_data.indexOf('_w')), 10);
      word = parseInt(unit_data.substring(unit_data.indexOf('_w') + 2), 10);
      witnesses = CL.data.apparatus[unit].readings[reading].witnesses;
      original_text = CL.data.apparatus[unit].readings[reading].text[word];
      original_display_text = CL.data.apparatus[unit].readings[reading].text[word]['interface'];
      if (document.getElementById('reg_form') !== null) {
        document.getElementsByTagName('body')[0].removeChild(document.getElementById('reg_form'));
      }
      create_function = function() {
        var i, data, new_unit, new_unit_data, new_reading, new_witnesses, suffix;
        //create the rule
        //make sure all the data (even any disabled ones are submitted)
        $('#conditions input').removeAttr('disabled');
        if (document.getElementById('scope').value === 'none') {
          return false;
        }
        data = cforms.serialiseForm('regularisation_menu');
        if (!data.hasOwnProperty('class')) {
          data['class'] = 'none';
        }
        CL.services.getUserInfo(function(user) {
          //FIX: here
          _rules[word_id] = _createRule(data, user, original_text, normalised_text, unit, reading, word, witnesses)
          //_rules.push.apply(_rules, _createRule(data, user, original_text, normalised_text, unit, reading, word, witnesses));
        });

        document.getElementsByTagName('body')[0].removeChild(document.getElementById('reg_form'));
        rd.enableDrag(false, rd.objOld);
        $(original).addClass('regularisation_staged');
        $(original.parentNode).addClass('mark');
        //add witnesses to normalised form in data structure
        new_unit_data = rd.td.target.firstChild.id;
        if (new_unit_data !== '') { //only try this if it is not a user added reading
          new_unit = parseInt(new_unit_data.substring(0, new_unit_data.indexOf('_r')).replace('variant_unit_', ''), 10);
          new_reading = parseInt(new_unit_data.substring(new_unit_data.indexOf('_r') + 2, new_unit_data.indexOf('_w')), 10);
          //TODO: check this isn't causing problems by not eliminating suffixes.
          new_witnesses = CL.getReadingWitnesses(CL.data.apparatus[unit].readings[reading]);
          if (CL.project.hasOwnProperty('id')) {
            for (i = 0; i < new_witnesses.length; i += 1) {
              suffix = _getSuffix(data['class']);
              CL.data.apparatus[new_unit].readings[new_reading].witnesses.push(new_witnesses[i] + suffix);
            }
          }
        }
      };
      $.get(staticUrl + 'CE_core/html_fragments/rule_menu.html', function(html) {
        reg_menu = document.createElement('div');
        reg_menu.setAttribute('id', 'reg_form');
        reg_menu.setAttribute('class', 'dragdiv reg_form dialogue_form');
        reg_menu.innerHTML = html.replace('{unit_data}', unit_data).replace('{original_text}', original_display_text.replace(/_/g, '&#803;')).replace('{normalised_text}', normalised_text.replace(/_/g, '&#803;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
        document.getElementsByTagName('body')[0].appendChild(reg_menu);
        reg_rules = CL.getRuleClasses('create_in_RG', true, 'value', ['identifier', 'name', 'RG_default']);
        new_reg_rules = [];
        selected = 'none';
        for (key in reg_rules) {
          if (reg_rules.hasOwnProperty(key)) {
            if (typeof reg_rules[key][0] !== 'undefined') {
              new_reg_rules.push({
                'value': key,
                'label': reg_rules[key][1] + ' (' + reg_rules[key][0] + ')'
              });
            } else {
              new_reg_rules.push({
                'value': key,
                'label': reg_rules[key][1]
              });
            }
            if (reg_rules[key][2] === true) {
              selected = key;
            }
          }
        }
        _setUpRuleMenu(rd, new_reg_rules, selected, create_function);
      }, 'text');
    };
  };

  _getDisplaySettingValue = function(id, key) {
    var i;
    for (i = 0; i < CL.displaySettingsDetails.configs.length; i += 1) {
      if (CL.displaySettingsDetails.configs[i].id === id) {
        return CL.displaySettingsDetails.configs[i][key];
      }
    }
    return null;
  };

  _setUpRuleMenu = function(rd, classes, selected, create_function) {
    var left_pos, window_width, rule_scopes, conditions_html, i, id, setting;
    //document.getElementById('reg_form').style.width = '300px';
    window_width = window.innerWidth;
    left_pos = rd.td.current.offsetLeft + rd.obj.redips.container.offsetParent.offsetLeft - document.getElementById('scroller').scrollLeft;
    if (left_pos + parseInt(document.getElementById('reg_form').style.width) >= window_width) {
      left_pos = (window_width - parseInt(document.getElementById('reg_form').style.width) - 20);
    }
    //hardcoded this now as a fail safe against overshooting the bottom of the page, extra tests could be added if you have time.
    //document.getElementById('reg_form').style.top = (rd.td.current.offsetTop + rd.obj.redips.container.offsetParent.offsetTop - document.getElementById('scroller').scrollTop) + 'px';
    document.getElementById('reg_form').style.left = left_pos + 'px';

    rule_scopes = _getRuleScopes();
    cforms.populateSelect(rule_scopes, document.getElementById('scope'), {'value_key': 'value', 'text_keys': 'label', 'add_select': false});
    cforms.populateSelect(classes, document.getElementById('class'), {'value_key': 'value', 'text_keys': 'label', 'add_select': false, 'selected': selected});

    if (CL.hasOwnProperty('ruleConditions') && CL.ruleConditions !== undefined) {
      conditions_html = [];
      for (i = 0; i < CL.ruleConditions.configs.length; i += 1) {
        id = 'conditions_' + CL.ruleConditions.configs[i].id;
        conditions_html.push('<label for="' + id + '">');
        conditions_html.push('<input type="checkbox" class="boolean" id="' + id + '" name="' + id + '"/>');
        conditions_html.push(CL.ruleConditions.configs[i].label);
        conditions_html.push('</label><br/>');
      }
      document.getElementById('conditions').innerHTML = conditions_html.join('');
      for (i = 0; i < CL.ruleConditions.configs.length; i += 1) {
        if (CL.ruleConditions.configs[i].hasOwnProperty('linked_to_settings') && CL.ruleConditions.configs[i].linked_to_settings === true) {
          setting = CL.ruleConditions.configs[i].setting_id;
          id = 'conditions_' + CL.ruleConditions.configs[i].id;
          if (CL.displaySettings[setting] === _getDisplaySettingValue(setting, 'apply_when')) {
            document.getElementById(id).checked = true;
            document.getElementById(id).disabled = true;
          }
        }
      }
    } else {
      document.getElementById('conditions').style.display = 'none';
    }
    DND.InitDragDrop('reg_form', true, true);
    $('#cancel_button').on('click', function(event) {
      document.getElementsByTagName('body')[0].removeChild(document.getElementById('reg_form'));
    });
    $('#save_rule_button').on('click', create_function);
  };

  _getRuleScopes = function() {
    var rule_scopes, scopes_and_labels, allowed_scopes, key;
    allowed_scopes = ['once', 'verse', 'manuscript', 'always'];
    rule_scopes = CL.services.supportedRuleScopes;
    scopes_and_labels = [];
    for (key in rule_scopes) {
      if (rule_scopes.hasOwnProperty(key) && allowed_scopes.indexOf(key) !== -1) {
        scopes_and_labels.push({
          'value': key,
          'label': rule_scopes[key]
        });
      }
    }
    return scopes_and_labels;
  };

  _getSuffix = function(decision_class) {
    var i, suffix, rule_classes;
    suffix = '';
    if (CL.project.hasOwnProperty('ruleClasses') && CL.project.ruleClasses !== undefined) {
      rule_classes = CL.project.ruleClasses;
    } else if (CL.services.hasOwnProperty('ruleClasses')) {
      rule_classes = CL.services.ruleClasses;
    } else {
      rule_classes = DEF.ruleClasses;
    }
    for (i = 0; i < rule_classes.length; i += 1) {
      if (rule_classes[i].value === decision_class) {
        if (rule_classes[i].hasOwnProperty('suffixed_sigla') &&
            rule_classes[i].suffixed_sigla === true &&
            typeof rule_classes[i].identifier !== 'undefined') {
          suffix += rule_classes[i].identifier;
        }
      }
    }
    return suffix;
  };

  _makeMenu = function(menu_name) {
    if (menu_name === 'regularised') {
      document.getElementById('context_menu').innerHTML = '<li id="delete_rule"><span>Delete rule</span></li>';
    }
    if (menu_name === 'regularised_global') {
      document.getElementById('context_menu').innerHTML = '<li id="add_exception"><span>Add exception</span></li><li id="delete_rule"><span>Delete rule</span></li>';
    }
    if (menu_name === 'regularisation_staged') {
      document.getElementById('context_menu').innerHTML = '<li id="delete_unapplied_rule"><span>Delete rule</span></li>';
    }
    if (menu_name === 'group_delete') {
      document.getElementById('context_menu').innerHTML = '<li id="delete_selected_rules"><span>Delete selected rules</span></li>';
    }

    _addContextMenuHandlers();
    return 'context_menu';
  };

  _getAncestorRow = function(element) {
    if (element.tagName === 'TR') {
      return element;
    } else {
      while (element.tagName !== 'TR' && element.tagName !== 'BODY') {
        element = element.parentNode;
      }
      return element;
    }
  };

  _showGlobalExceptions = function(rules) {
    var html, i;
    if (document.getElementById('global_exceptions').style.display === 'none') {
      document.getElementById('global_exceptions').style.display = 'block';
      document.getElementById('global_exceptions_list').style.display = 'block';
      DND.InitDragDrop('global_exceptions', true, false);
    }
    html = [];
    html.push('<form id="global_exceptions_form" class="pure-form">');
    html.push('<span>To remove an exception check the box<br/> and click the \'Remove exceptions\' button.</span><br/><ul>');
    for (i = 0; i < rules.length; i += 1) {
      html.push('<li><input type="checkbox" name="' + rules[i].id + '" id="checkbox_' + rules[i].id + '"/>');
      html.push('<label class="checkbox-label" for="checkbox_' + rules[i].id + '">' + rules[i].t + ' &gt; ' + rules[i].n + '</label></li>');
    }
    html.push('</ul><input class="pure-button dialogue-form-button" type="button" value="Remove exceptions" id="remove_exception_button"/>');
    html.push('</form>');
    document.getElementById('global_exceptions_list').innerHTML = html.join('');
    document.getElementById('global_exceptions').style.top = document.getElementById('header').offsetHeight +
        document.getElementById('scroller').offsetHeight -
        document.getElementById('global_exceptions').offsetHeight - 3 + 'px';

    $('#remove_exception_button').off('click.rem_ge');
    $('#remove_exception_button').on('click.rem_ge', function(event) {
      _removeGlobalExceptions();
    });
    $('#global_exceptions_ex').on('click', function(event) {
      if (document.getElementById('global_exceptions_list').style.display === 'block') {
        $('#global_exceptions_header').width($('#global_exceptions_list').width());
        document.getElementById('global_exceptions').style.top = parseInt(document.getElementById('global_exceptions').style.top) + parseInt(document.getElementById('global_exceptions_list').offsetHeight) + 'px';
        document.getElementById('global_exceptions_list').style.display = 'none';
        document.getElementById('global_exceptions_ex').innerHTML = '&#9650;';
      } else {
        document.getElementById('global_exceptions_list').style.display = 'block';
        document.getElementById('global_exceptions').style.top = parseInt(document.getElementById('global_exceptions').style.top) - parseInt(document.getElementById('global_exceptions_list').offsetHeight) + 'px';
        document.getElementById('global_exceptions_ex').innerHTML = '&#9660;';
      }
    });
  };

  _removeGlobalExceptions = function() {
    var data, key, rule_ids;
    data = cforms.serialiseForm('global_exceptions_form');
    rule_ids = [];
    for (key in data) {
      if (data[key] !== null) {
        rule_ids.push(key);
      }
    }
    //get the rules
    if (rule_ids.length > 0) {
      CL.services.getRulesByIds(rule_ids, function(rules) {
        var i;
        //remove this context from exceptions
        for (i = 0; i < rules.length; i += 1) {
          if (rules[i].hasOwnProperty('exceptions') && rules[i].exceptions !== null) {
            if (rules[i].exceptions.indexOf(CL.context) !== -1) {
              rules[i].exceptions.splice(rules[i].exceptions.indexOf(CL.context), 1);
              if (rules[i].exceptions.length === 0) {
                rules[i].exceptions = null;
              }
            }
          }
        }
        //resave the rules
        CL.services.updateRules(rules, CL.context, function() {
          RG.recollate(false);
        });
      });
    }
  };

  _scheduleAddGlobalException = function() {
    var element, row, rule_id;
    element = SimpleContextMenu._target_element;
    row = _getAncestorRow(element);
    rule_id = row.id.substring(row.id.indexOf('_rule_') + 6);
    _forGlobalExceptions.push({
      'id': rule_id
    });
    $(row).addClass('deleted');
  };

  _deleteUnappliedRule = function() {
    var element;
    element = SimpleContextMenu._target_element;
    delete _rules[element.id];
    $(element.parentNode).removeClass('mark');
    $(element).removeClass('regularisation_staged');
  };

  _scheduleSelectedRulesDeletion = function () {
    $('tr.ui-selected').each(function () { //if this is not limited to tr we also get the td and add rules twice which breaks everything
      _scheduleRuleDeletion(this);
      //remove the class so it is not selected again if we delete more
      $(this.parentNode).removeClass('ui-selected');
    });
  };

  _scheduleRuleDeletion = function(element) {
    var i, j, element, row, rule_id, unit_num, row_num, word_num, rule_type, word_data, key, witness_data, witnesses, ok;
    if (element === undefined) {
      element = SimpleContextMenu._target_element;
    }
    row = _getAncestorRow(element);
    unit_num = row.id.substring(row.id.indexOf('_unit_') + 6, row.id.indexOf('_row_'));
    row_num = row.id.substring(row.id.indexOf('_row_') + 5, row.id.indexOf('_word_'));
    word_num = row.id.substring(row.id.indexOf('_word_') + 6, row.id.indexOf('_rule_'));
    rule_id = row.id.substring(row.id.indexOf('_rule_') + 6);
    word_data = CL.data.apparatus[unit_num].readings[row_num].text[word_num];
    witnesses = word_data.reading;
    rule_type = null;
    i = 0;
    while (i < witnesses.length && rule_type === null) {
      witness_data = word_data[witnesses[i]];
      if (witness_data.hasOwnProperty('decision_details')) {
        j = 0;
        while (j < witness_data.decision_details.length && rule_type === null) {
          if (rule_id === witness_data.decision_details[j].id) {
            rule_type = witness_data.decision_details[j].scope;
          }
          j += 1;
        }
      }
      i += 1;
    }
    if (rule_type === 'always') {
      ok = confirm('You are asking to delete a global rule.\nDeleting this rule will mean it is deleted everywhere in your project for all editors.\nIf you just want the rule to be ignored in this verse you can add an exception.\nAre you sure you want to delete this rule?');
      if (ok) {
        $(row).addClass('deleted');
        _forDeletion.push({
          id: rule_id,
          scope: rule_type
        });
      } else {
        return;
      }
    } else {
      $(row).addClass('deleted');
      _forDeletion.push({
        id: rule_id,
        scope: rule_type
      });
    }
  };

  _addContextMenuHandlers = function() {
    if (document.getElementById('delete_rule')) {
      $('#delete_rule').off('click.dr_c');
      $('#delete_rule').off('mouseover.dr_mo');
      $('#delete_rule').on('click.dr_c', function(event) {
        _scheduleRuleDeletion();
      });
      $('#delete_rule').on('mouseover.dr_mo', function(event) {
        CL.hideTooltip();
      });
    }
    if (document.getElementById('add_exception')) {
      $('#add_exception').off('click.ae_c');
      $('#add_exception').off('mouseover.ae_mo');
      $('#add_exception').on('click.ae_c', function(event) {
        _scheduleAddGlobalException();
      });
      $('#add_exception').on('mouseover.ae_mo', function(event) {
        CL.hideTooltip();
      });
    }
    if (document.getElementById('delete_unapplied_rule')) {
      $('#delete_unapplied_rule').off('click.dur_c');
      $('#delete_unapplied_rule').off('mouseover.dur_mo');
      $('#delete_unapplied_rule').on('click.dur_c', function(event) {
        _deleteUnappliedRule();
      });
      $('#delete_unapplied_rule').on('mouseover.dur_mo', function(event) {
        CL.hideTooltip();
      });
    }
    if (document.getElementById('delete_selected_rules')) {
      $('#delete_selected_rules').off('click.dsr_c');
      $('#delete_selected_rules').off('mouseover.dsr_mo');
      $('#delete_selected_rules').on('click.dsr_c', function(event) {
        _scheduleSelectedRulesDeletion();
      });
      $('#delete_selected_rules').on('mouseover.dsr_mo', function(event) {
        CL.hideTooltip();
      });
    }
  };



  _showCollationTable = function(data, context, container) {
    var i, j, k, html, column, row, witnesses;
    html = [];
    html.push('<tr>');
    //sigils for collateX 1.3 witnesses for 1.5+
    if (data.hasOwnProperty('sigils')) {
      witnesses = data.sigils;
    } else {
      witnesses = data.witnesses;
    }
    for (i = 0; i < witnesses.length; i += 1) {
      html.push('<td>' + witnesses[i] + '</td>');
    }
    html.push('</tr>');
    for (i = 0; i < data.table.length; i += 1) {
      row = data.table[i];
      html.push('<tr>');
      for (j = 0; j < row.length; j += 1) {
        column = row[j];
        if (column === null) {
          html.push('<td></td>');
        } else {
          html.push('<td>');
          for (k = 0; k < column.length; k += 1) {
            if (column[k].hasOwnProperty('n')) {
              html.push(column[k].n);
            } else {
              html.push(column[k].t);
            }
            html.push(' ');
          }
          html.push('</td>');
        }
      }
      html.push('</tr>');
    }
    container.innerHTML = '<div id="scroller"><table id="raw_json"><tbody>' + html.join('') + '</tbody></table></div>';
  };


  //priv-e

  return {

    showRegularisations: showRegularisations,

    getCollationData: getCollationData,
    getUnitData: getUnitData,
    recollate: recollate,
    showVerseCollation: showVerseCollation,
    allRuleStacksEmpty: allRuleStacksEmpty,

  };

}());


    // //currently only used by vmr services move to there?
    // tei2json: function(tei, result_callback) {
    //   var url, options, xmldom, ts, i, lac_witnesses, lac_docID;
    //   url = staticUrl + '/tei2json/';
    //   $.post(url, {
    //     'tei': tei
    //   }, function(json) {
    //     result_callback(json);
    //   });
    // },
