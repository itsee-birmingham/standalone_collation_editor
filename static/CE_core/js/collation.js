/*jshint esversion: 6 */

CL = (function() {
  "use strict";

  //public variable declarations
  let services = null,
      container = null,
      displaySettings = {},
      displaySettingsDetails = [],
      ruleClasses = null,
      ruleConditions = [],
      localPythonFunctions = {},
      overlappedOptions = [],
      dataSettings = {
        'witness_list': [],
        'base_text': '',
        'language': ''
      },
      algorithmSettings = {
        'algorithm': 'auto',
        'fuzzy_match': true,
        'distance': 2
      },
      highlighted = 'none',
      showSubreadings = false,
      managingEditor = false,
      project = {},
      collateData = {},
      context = '',
      data = {},
      debug = false;


  //private variable declarations
  let _contextInput = null,
      _defaultDisplaySettings = {},
      _collapsed = false,
      _alpha = 'abcdefghijklmnopqrstuvwxyz',
      _displayMode = 'editor'; //there used ot be support for 'table' for a straight collation table view but it does not work;;

  //public function declarations
  let setServiceProvider, expandFillPageClients, getHeaderHtml, addUnitAndReadingIds,
  addReadingIds, addReadingId, addUnitId, extractWitnessText, getAllReadingWitnesses,
  findUnitById, findStandoffRegularisation, getRuleClasses, getCollationHeader,
  addTriangleFunctions, getOverlapLayout, sortReadings, extractDisplayText,
  getReadingLabel, getAlphaId, getReadingSuffix, addSubreadingEvents, getUnitLayout,
  unitHasText, isBlank, getHighlightedText, findOverlapUnitById,
  getReading, lacOmFix, getSubreadingOfWitness, overlapHasEmptyReading, removeNullItems,
  addStageLinks, addExtraFooterButtons, makeVerseLinks, getUnitAppReading, setList,
  getActiveUnitWitnesses, getExporterSettings, saveCollation, sortWitnesses,
  getSpecifiedAncestor, hideTooltip, addHoverEvents, markReading, showSplitWitnessMenu,
  markStandoffReading, findUnitPosById, findReadingById, applyPreStageChecks,
  makeStandoffReading, doMakeStandoffReading, makeMainReading, getOrderedAppLines,
  loadIndexPage, addIndexHandlers, getHandsAndSigla, createNewReading, getReadingWitnesses,
  calculatePosition;

  //private function declarations
  let _initialiseEditor, _initialiseProject, _setProjectConfig, _setDisplaySettings,
   _setLocalPythonFunctions, _setRuleClasses, _setRuleConditions, _setOverlappedOptions,
   _includeJavascript, _prepareCollation, _findSaved, _getContextFromInputForm,
   _getWitnessesFromInputForm, _getDebugSetting, _showSavedVersions, _getSavedRadio, _makeSavedCollationTable,
   _loadSavedCollation, _getSubreadingWitnessData, _findStandoffRegularisationText,
   _collapseUnit, _expandUnit, _expandAll, _collapseAll, _getEmptyCell, _mergeDicts,
   _getUnitData, _hasGapBefore, _hasGapAfter, _getAllEmptyReadingWitnesses, _containsEmptyReading,
   _isOverlapped, _removeLacOmVerseWitnesses, _cleanExtraGaps, _getOverlapUnitReadings,
   _checkExtraGapRequiredBefore, _extraGapRequiredBefore, _extraGapRequiredAfter,
   _combinedGapInNextUnit, _getNewGapRdgDetails, _addExtraGapReadings, _extraGapIsWithinAnOverlap,
   _getInclusiveOverlapReadings, _getExtraGapLocation, _createExtraGaps, _addLacReading,
   _addNavEvent, _findLatestStageVerse, _loadLatestStageVerse, _removeOverlappedReadings,
   _applySettings, _getApprovalSettings, _compareReadings,
   _disableEventPropagation, _showCollationSettings, _checkWitnesses, _getScrollPosition,
   _getMousePosition, _displayWitnessesHover, _getWitnessesForReading,
   _findStandoffWitness, _findReadingPosById, _getPreStageChecks, _makeRegDecisionsStandoff,
   _contextInputOnload, _getReadingHistory, _getNextTargetRuleInfo, _removeAppliedRules,
   _getHistoricalReading;


  //*********  public functions *********
   /**
   * set our service provider layer,
   * allowing re-implementation of core services */
  setServiceProvider = function(serviceProvider) {
    CL.services = serviceProvider;
    _initialiseEditor();
  };

  expandFillPageClients = function() {
    $('.fillPage').each(function() {
      if (document.getElementById('footer')) {
        $(this).height(window.innerHeight - $(this).offset().top - 40 - document.getElementById('footer').offsetHeight);
        //make sure the global exceptions div stays fixed to horizontal scroll bar when page is resized
        if (document.getElementById('global_exceptions')) {
          document.getElementById('global_exceptions').style.top = document.getElementById('header').offsetHeight +
              document.getElementById('scroller').offsetHeight -
              document.getElementById('global_exceptions').offsetHeight - 3 + 'px';
        }
        //do the same for errors in SV
        if (document.getElementById('error_panel')) {
          document.getElementById('error_panel').style.top = document.getElementById('scroller').offsetHeight + document.getElementById('header').offsetHeight - document.getElementById('error_panel').offsetHeight - 3 + 'px';
        }
      } else {
        $(this).height(window.innerHeight - $(this).offset().top - 40);
      }
    });
  };

  getHeaderHtml = function(stage, context) {
    var html;
    html = '<h1 id="stage_id">' + stage + '</h1>' +
      '<h1 id="verse_ref">' + context +
      '</h1><h1 id="project_name">';
    if (CL.project.hasOwnProperty('name')) {
      html += CL.project.name;
    }
    html += '</h1><div id="message_panel"></div><div id="login_status"></div>';
    return html;
  };

  //will not overwrite existing unit ids as these are used for offset reading recording
  //will overwrite readings as consistency is not needed over sessions
  addUnitAndReadingIds = function() {
    var data, key, i;
    data = CL.data;
    for (key in data) {
      if (data.hasOwnProperty(key)) {
        if (key.indexOf('apparatus') !== -1) {
          for (i = 0; i < data[key].length; i += 1) {
            if (!data[key][i].hasOwnProperty('_id')) {
              addUnitId(data[key][i]);
            }
            addReadingIds(data[key][i]);
          }
        }
      }
    }
  };

  addReadingIds = function(unit) {
    var i, start, end;
    start = unit.start.toString();
    end = unit.end.toString();
    for (i = 0; i < unit.readings.length; i += 1) {
      addReadingId(unit.readings[i], start, end);
    }
  };

  addReadingId = function(reading, start, end) {
    reading._id = MD5(start + end + extractWitnessText(reading) + reading.witnesses.join(' '));
    return reading._id;
  };

  addUnitId = function(unit, app_id) {
    var start, end, text;
    start = unit.start.toString();
    end = unit.end.toString();
    text = [];
    text.push(start);
    text.push(end);
    for (let i = 0; i < unit.readings.length; i += 1) {
      text.push(extractWitnessText(unit.readings[i]) + unit.readings[i].witnesses.join(' '));
    }
    if (typeof app_id !== 'undefined') {
      text.push(app_id);
    } else {
      text.push('apparatus');
    }
    unit._id = MD5(text.join(''));
    return unit._id;
  };

  /** */
  extractWitnessText = function(reading, options, test) {
    var text, witness_text, i, j, witness, reading_type, unit_id, app_id, required_rules, found_word;

    if (test === true) {
      console.log(JSON.parse(JSON.stringify(reading)));
    }
    if (typeof options === 'undefined') {
      options = {};
    }

    text = [];
    witness_text = [];
    //first fix the display of overlapped statuses
    if (reading.hasOwnProperty('overlap_status') && reading.overlap_status !== 'duplicate') {
      if (test === true) {
        console.log('I have been overlapped and ' + reading.overlap_status);
      }
      return 'system_gen_' + reading.overlap_status;
    }
    //now look at options and set flag accordingly
    if (options.hasOwnProperty('witness')) {
      witness = options.witness;
      if (test === true) {
        console.log('I was given the witnesses ' + witness);
      }
    }
    if (options.hasOwnProperty('reading_type')) {
      reading_type = options.reading_type;
      if (test === true) {
        console.log('I was asked to look for a ' + reading_type);
      }
    }
    if (options.hasOwnProperty('unit_id')) {
      unit_id = options.unit_id; //unit_id and app_id needed to recover standoff regularised readings accurately
      if (test === true) {
        console.log('I am from unit ' + unit_id);
      }
    }
    if (options.hasOwnProperty('app_id')) {
      app_id = options.app_id; //unit_id and app_id needed to recover standoff regularised readings accurately
    }
    if (options.hasOwnProperty('required_rules')) {
      required_rules = options.required_rules;
    }

    //set default positions it we don't have a witness
    if (typeof witness === 'undefined') {
      reading_type = 'mainreading'; //can't extract subreading without witness
      if (test === true) {
        console.log('I got no reading type so I\'m assuming mainreading');
      }
    }
    //if no witness was supplied try to find a main reading witness and if not just return interface reading of all words or lac/om stuff
    if (typeof witness === 'undefined' && !reading.hasOwnProperty('created')) { //don't do this for created readings as you are overwriting the genuine witness text in these cases
      for (i = 0; i < reading.witnesses.length; i += 1) {
        if (reading.text.length > 0 && reading.text[0].hasOwnProperty(reading.witnesses[i])) {
          witness = reading.witnesses[i];
          if (test === true) {
            console.log('I found the witness ' + witness + ' by looping the readings and checking it has a direct entry in the reading');
          }
          break;
        }
      }
    }
    if (typeof witness === 'undefined' && reading.hasOwnProperty('witnesses') &&
      getAllReadingWitnesses(reading).length === 1 && !reading.hasOwnProperty('created')) {
      witness = getAllReadingWitnesses(reading)[0];
      if (test === true) {
        console.log('I found the witness ' + witness + ' because it was the only one in the reading at all');
      }
    }
    //we didn't find a main reading witness so return interface reading of all words or lac/om stuff
    //TODO: ? this does not check for gap after or any other gap details - should it?
    if (typeof witness === 'undefined') {
      if (test === true) {
        console.log('I found no appropriate main reading witness');
      }
      if (reading.text.length > 0) {
        if (test === true) {
          console.log('here are all the interface values of the reading');
        }
        for (i = 0; i < reading.text.length; i += 1) {
          text.push(reading.text[i]['interface']);
        }
        return text.join(' ').replace(/_/g, '&#803;');
      }
      if (reading.hasOwnProperty('details')) {
        if (test === true) {
          console.log('The reading is lac - here are the details');
        }
        return '&lt;' + reading.details + '&gt;';
      }
      if (reading.hasOwnProperty('type') && reading.type === 'om') {
        if (test === true) {
          console.log('the reading is om');
        }
        return 'om.';
      }
      if (test === true) {
        console.log('I didn\'t find a reading so here is an empty string by way of compensation!');
      }
      return '';
    }
    //get the text list for the reading and witness combo
    if (reading.text.length > 0 && reading.text[0].hasOwnProperty(witness)) {
      witness_text = reading.text;
      if (test === true) {
        console.log('my witness is a main reading so here is the reading text');
        console.log(JSON.parse(JSON.stringify(witness_text)));
      }
    } else if (reading.hasOwnProperty('SR_text') && reading.SR_text.hasOwnProperty(witness)) {
      if (reading.SR_text[witness].text.length > 0) {
        witness_text = reading.SR_text[witness].text;
        if (test === true) {
          console.log('My witnesses is in SR_text with text so here is the SR_text');
          console.log(witness_text);
        }
      } else {
        if (reading.SR_text[witness].hasOwnProperty('details')) {
          if (test === true) {
            console.log('My witness is an SR_text lac');
          }
          return '&lt;' + reading.SR_text[witness].details + '&gt;';
        }
        if (reading.SR_text[witness].hasOwnProperty('type') && reading.SR_text[witness].type === 'om') {
          if (test === true) {
            console.log('my witness is an SR_text om');
          }
          return 'om.';
        }
        if (test === true) {
          console.log('I didn\'t find a reading so here is an empty string by way of compensation!');
        }
        return '';
      }
    } else if (reading.text.length > 0) {
      witness_text = _getSubreadingWitnessData(reading, witness);
      if (test === true) {
        console.log('my witness is a subreading here is the subreading text');
        console.log(witness_text);
      }
    } else { //if its om or lac return reading (they can never have combined gaps) - we've already checked for main reading and subreadings
      if (reading.hasOwnProperty('details')) {
        if (test === true) {
          console.log('my reading is a lac so I returned it');
        }
        return '&lt;' + reading.details + '&gt;';
      }
      if (reading.hasOwnProperty('type') && reading.type === 'om') {
        if (test === true) {
          console.log('my reading is an om so I returned it');
        }
        return 'om.';
      }
      if (test === true) {
        console.log('I didn\'t find a reading so here is an empty string by way of compensation!');
      }
      return '';
    }
    if (reading_type === 'mainreading' && typeof app_id !== 'undefined' && typeof unit_id !== 'undefined' && typeof witness !== 'undefined') {
      //if we have a standoff regularisation return its parent text
      text = _findStandoffRegularisationText(app_id, unit_id, witness, test);
      if (text !== null) {
        if (test === true) {
          console.log(app_id);
          console.log(unit_id);
          console.log('This reading has been regularised using standoff so here it what it should read');
        }
        return text;
      }
    }
    //at this point we have returned anything that isn't a case that needs to be extracted word by word from witness_text
    text = [];
    if (test === true) {
      console.log(text);
    }
    //deal with combined gap before
    if (reading.hasOwnProperty('combined_gap_before_subreadings') &&
      reading.combined_gap_before_subreadings.indexOf(witness) !== -1 &&
      reading.hasOwnProperty('combined_gap_before_subreadings_details') &&
      reading.combined_gap_before_subreadings_details.hasOwnProperty(witness)) {
      text.push('&lt;' + reading.combined_gap_before_subreadings_details[witness] + '&gt;');
      if (test === true) {
        console.log('There was a combined gap before a subreading of the first token in this reading');
      }
    } else if (reading.text.length > 0 && reading.text[0].hasOwnProperty('combined_gap_before') && (!reading.hasOwnProperty('SR_text') || !reading.SR_text.hasOwnProperty(witness))) {
      if (reading.text[0].hasOwnProperty(witness) && reading.text[0][witness].hasOwnProperty('gap_before')) { //first unit in verse this might actually work like the others now
        text.push('&lt;' + reading.text[0][witness].gap_before_details + '&gt;');
        if (test === true) {
          console.log('There was a combined gap before this first token in this reading and this token is also the first word in the verse');
        }
      } else if (reading.text[0].hasOwnProperty('combined_gap_before') && reading.text[0].combined_gap_before.length > 0 && reading.text[0].hasOwnProperty('combined_gap_before_details')) { //subsequent units in verse
        text.push('&lt;' + reading.text[0].combined_gap_before_details + '&gt;');
        if (test === true) {
          console.log('There was a combined gap before this first token in this reading');
        }
      }
    }
    //deal with text and internal gaps
    for (i = 0; i < witness_text.length; i += 1) {
      found_word = undefined;
      if (reading_type === 'subreading' && witness_text[i][witness].hasOwnProperty('decision_details')) {
        //loop backwards and only use t of rules that match your list of supplied types
        if (typeof required_rules === 'undefined') {
          text.push(witness_text[i][witness].decision_details[0].t); //this gets the first t from the decision details so effectively undoing all regularisations
          if (test === true) {
            console.log('I am a subreading but have not been given specific rules to apply');
          }
        } else {
          for (j = witness_text[i][witness].decision_details.length - 1; j >= 0; j -= 1) {
            if (required_rules.indexOf(witness_text[i][witness].decision_details[j]['class']) !== -1) {
              found_word = witness_text[i][witness].decision_details[j].t;
            }
          }
          if (typeof found_word !== 'undefined') {
            text.push(found_word);
            if (test === true) {
              console.log('I am a subreading and have applied the given rules');
            }
          } else {
            //else just do the interface because we don't want to apply any of the rules at all
            text.push(witness_text[i]['interface']);
            if (test === true) {
              console.log('I am a subreading but do not have any of the rules specified applied to me so I am returning the interface value');
            }
          }
        }
      } else if (reading_type === 'mainreading' && witness_text[i][witness].hasOwnProperty('decision_details')) {
        //TODO: restrict this to list of supplied types as well??
        text.push(witness_text[i][witness].decision_details[witness_text[i][witness].decision_details.length - 1].n); //this gets the final n from the decision details
        if (test === true) {
          console.log('I am a mainreading with a rule applied');
        }
      } else {
        text.push(witness_text[i]['interface']);
        if (test === true) {
          console.log('I am just the same as the interface value');
        }
      }
      if (i === witness_text.length - 1 && reading.text.length > 0 && reading.text[reading.text.length - 1].hasOwnProperty('combined_gap_after')) {
        //this is the last word in our witness so deal with combined_gap_after
        //are we sure this works for all witnesses - what if a subreading does not need combining such as P66 in 16:23

        if (witness_text[i][witness].hasOwnProperty('gap_after')) {
          text.push('&lt;' + witness_text[i][witness].gap_details + '&gt;');
          if (test === true) {
            console.log('I am the last word in the unit and have a combined gap after me');
          }
        }
      } else if (i === witness_text.length - 1 && reading.hasOwnProperty('combined_gap_after_subreadings') && reading.combined_gap_after_subreadings.indexOf(witness) !== -1) {
        if (witness_text[i][witness].hasOwnProperty('gap_after')) {
          text.push('&lt;' + witness_text[i][witness].gap_details + '&gt;');
          if (test === true) {
            console.log('I am the last word in the unit and have a combined gap after a subreading');
          }
        }
      } else if (i !== witness_text.length - 1) {
        if (witness_text[i][witness].hasOwnProperty('gap_after')) {
          text.push('&lt;' + witness_text[i][witness].gap_details + '&gt;');
          if (test === true) {
            console.log('I am internal to the reading and have a gap after me so here are the details');
          }
        }
      }
      if (test === true) {
        console.log(text);
      }
    }
    return text.join(' ').replace(/_/g, '&#803;');
  };

  getAllReadingWitnesses = function(reading) {
    var i, witnesses, key;
    witnesses = reading.witnesses.slice(0); //make a copy
    if (reading.hasOwnProperty('subreadings')) {
      for (key in reading.subreadings) {
        if (reading.subreadings.hasOwnProperty(key)) {
          for (i = 0; i < reading.subreadings[key].length; i += 1) {
            witnesses.push.apply(witnesses, reading.subreadings[key][i].witnesses);
          }
        }
      }
    }
    //this has been added in to help with the fix_lac_om stuff with om as subreading of existing reading
    if (reading.hasOwnProperty('SR_text')) {
      for (key in reading.SR_text) {
        if (reading.SR_text.hasOwnProperty(key)) {
          if (witnesses.indexOf(key) === -1) {
            witnesses.push(key);
          }
        }
      }
    }
    return witnesses;
  };

  findUnitById = function(app_id, unit_id) {
    var i, data;
    if (CL.data.hasOwnProperty(app_id)) {
      for (i = 0; i < CL.data[app_id].length; i += 1) {
        if (CL.data[app_id][i]._id === unit_id) {
          return CL.data[app_id][i];
        }
      }
    }
    return null;
  };

  findStandoffRegularisation = function(unit, witness, app_id) {
    var key, i;
    if (CL.data.hasOwnProperty('marked_readings')) {
      for (key in CL.data.marked_readings) {
        if (CL.data.marked_readings.hasOwnProperty(key)) {
          for (i = 0; i < CL.data.marked_readings[key].length; i += 1) {
            if (CL.data.marked_readings[key][i].apparatus === app_id &&
              CL.data.marked_readings[key][i].start === unit.start &&
              CL.data.marked_readings[key][i].end === unit.end &&
              CL.data.marked_readings[key][i].witness === witness) {
              if (CL.data.marked_readings[key][i].hasOwnProperty('first_word_index')) {
                if (CL.data.marked_readings[key][i].first_word_index === unit.first_word_index) {
                  return CL.data.marked_readings[key][i];
                }
              } else {
                return CL.data.marked_readings[key][i];
              }
            }
          }
        }
      }
    }
    return null;
  };
  //TODO: sort out this mess of what is called what and snake vs camel for regularisation_classes and ruleClasses and rule_classes!!!!
  //TODO: is this the most efficient way to do this?
  //rule_classes could at least be set once in project config even if we have to cycle through them every time here
  getRuleClasses = function(test_key, test_value, key, data) {
    var i, j, classes, list, rule_classes;
    classes = {};
    rule_classes = CL.ruleClasses;
    for (i = 0; i < rule_classes.length; i += 1) {
      if (rule_classes[i][test_key] === test_value || typeof test_key === 'undefined') {
        if ($.type(data) === 'string') {
          classes[rule_classes[i][key]] = rule_classes[i][data];
        } else {
          list = [];
          for (j = 0; j < data.length; j += 1) {
            list.push(rule_classes[i][data[j]]);
          }
          classes[rule_classes[i][key]] = list;
        }
      }
    }
    return classes;
  };

  //TODO: see if you really need to return j and then remove if you can
  getCollationHeader = function(data, col_spans, number_spaces) {
    var html, word, words, cols, i, j, colspan;
    html = [];
    words = [];
    //extract all the words from the data you get back
    if ($.isArray(data.overtext)) {
      for (i = 0; i < data.overtext[0].tokens.length; i += 1) {
        word = [];
        if (data.overtext[0].tokens[i].hasOwnProperty('pc_before')) {
          word.push(data.overtext[0].tokens[i].pc_before);
        }
        if (data.overtext[0].tokens[i].hasOwnProperty('original')) {
          word.push(data.overtext[0].tokens[i].original);
        } else {
          word.push(data.overtext[0].tokens[i].t);
        }
        if (data.overtext[0].tokens[i].hasOwnProperty('pc_after')) {
          word.push(data.overtext[0].tokens[i].pc_after);
        }
        words.push(word.join(''));
      }
    }
    //columns is based on number of words*2 (to include spaces) + 1 (to add space at the end)
    cols = (words.length * 2) + 1;
    if (cols === 1) {
      j = 1;
      html.push('<tr><td class="nav" id="previous_verse">&larr;</td><th colspan="' + col_spans[1] + '">Base text is ' + data.overtext + '</th><td class="nav" id="next_verse">&rarr;</td></tr>');
    } else {
      html.push('<tr><td class="nav" id="previous_verse">&larr;</td>');
      //words are just in a list so index from 0 (j will go up slower than i)
      j = 0;
      //we don't want 0 based indexing so start i at 1
      for (i = 1; i <= cols; i += 1) {
        if (col_spans.hasOwnProperty(i)) {
          colspan = col_spans[i];
        } else {
          colspan = 1;
        }
        //if i is even add a word if not a blank cell
        if (i % 2 === 0) {
          html.push('<th colspan="' + colspan + '" class="NAword mark" id="NA_' + (i) + '"><div id="NA_' + (i) + '_div">' + words[j] + '</div></th>');
          j += 1;
        } else {
          html.push('<th  colspan="' + colspan + '" id="NA_' + (i) + '" class="mark"><div id="NA_' + (i) + '_div"></div></th>');
        }
      }
      html.push('<td class="nav" id="next_verse">&rarr;</td></tr>');


      html.push('<tr id="number_row" class="number_row"><td></td>');
      j = 1;
      for (i = 1; i <= cols; i += 1) {
        if (col_spans.hasOwnProperty(i)) {
          colspan = col_spans[i];
        } else {
          colspan = 1;
        }
        if (i % 2 === 0) {
          html.push('<td id="num_' + j + '" colspan="' + colspan + '" class="number mark">' + j + '</td>');
          j += 1;
        } else {
          if (number_spaces === true) {
            html.push('<td id="num_' + j + '" colspan="' + colspan + '" class="space">' + j + '</td>');
          } else {
            html.push('<td id="num_' + j + '" colspan="' + colspan + '"></td>');
          }
          j += 1;
        }
      }
      html.push('<td></td></tr>');
    }
    return [html, j];
  };

  addTriangleFunctions = function(format) {
    var triangles;
    $('.triangle').on('click.collapse', function(event) {
      _collapseUnit(event.target.id, format);
      _disableEventPropagation(event);
    });
    if (document.getElementById('expand_collapse_button')) {
      if (_collapsed === true) {
        _collapseAll(format);
        document.getElementById('expand_collapse_button').value = 'expand all';
        $('#expand_collapse_button').on('click.expand_all', function(event) {
          _expandAll(format);
        });
      } else {
        _expandAll(format);
        document.getElementById('expand_collapse_button').value = 'collapse all';
        $('#expand_collapse_button').on('click.collapse_all', function(event) {
          _collapseAll(format);
        });
      }
    }
  };

  /**apparatus - the list of units
   * app - a number showing which row of apparatus
   * format - which stage of the editor are we at
   * overtext_length - the number of words and spaces (columns) in overtext
   * options - a dictionary of possible options
   * 		possibilities are:
   * 			sort - boolean - do the readings need sorting (default = false)
   * 			highlighted_wit - the witness to highlight
   * 			highlighted_unit - a unit to mark as having an error
   * 			column_lengths - dictionary detailing widths of columns in top apparatus
   * 			overlap_details - a dictionary keyed by id of overlapping reading giving column width for that unit
   * */
  getOverlapLayout = function(apparatus, app, format, overtext_length, options) {
    var j, i, k, id, rows, unit, row_list, extra_rows, events,
      new_row, previous_index, id_string, expected, td_id, unit_index, spacer_rows,
      unit_data, empty_cell_options, unit_data_options, next_start;
    if (typeof options === 'undefined') {
      options = {};
    }
    j = 0;
    i = 1;
    rows = [];
    row_list = [];
    extra_rows = {};
    events = {};
    if (format === 'set_variants') {
      spacer_rows = [];
      spacer_rows.push('<tr><td></td>');
    }
    rows.push('<tr><td></td>'); //the extra ones for navigation arrows
    //only care about highlighted unit if we are in the right apparatus
    if (options.hasOwnProperty('highlighted_unit') && options.highlighted_unit !== undefined && options.highlighted_unit[0] !== 'apparatus' + app) {
      delete options.highlighted_unit;
    }
    while (i <= overtext_length) {
      td_id = app + '_' + i;
      unit_index = null;

      unit = apparatus[j];
      if (unit !== undefined) {
        if (unit.hasOwnProperty('extra_start')) {
          unit_index = unit.start + unit.extra_start;
        } else {
          unit_index = unit.start;
        }
      }
      if (unit_index === null || i < unit_index) { //we don't have a variant for this word
        if (options.hasOwnProperty('column_lengths') && options.column_lengths.hasOwnProperty(i)) {
          for (k = 0; k < options.column_lengths[i]; k += 1) {
            rows.push(_getEmptyCell(format, {
              'dropable': true,
              'id': td_id
            }));
            if (format === 'set_variants') {
              spacer_rows.push(SV.getEmptySpacerCell());
            }
          }
        } else {
          rows.push(_getEmptyCell(format, {
            'dropable': true,
            'id': td_id
          }));
          if (format === 'set_variants') {
            spacer_rows.push(SV.getEmptySpacerCell());
          }
        }
        i += 1;
      } else if (i === unit_index) { //we do have a variant for this word
        if (unit.readings.length > 0 ||
          //this is now set to always show units regardless of whether they have variation
          //the unused logic is left in incase we want to revert to the old way sometime
          (format === 'reorder') ||
          (format === 'set_variants') ||
          (format === 'approved') ||
          (format === 'set_variants' && SV.showSharedUnits === true) ||
          (format === 'regularise' && CL.displaySettings.view_original_forms === true) ||
          (format === 'regularise' && RG.showRegularisations === true) ||
          format === 'version_additions' ||
          format === 'other_version_additions') {
          //check to see if we need any gaps at this index point before the unit (to account for combined gap before in another reading)
          if (options.overlap_details[unit._id].hasOwnProperty('gap_before') &&
            options.overlap_details[unit._id].gap_before > 0) {
            rows.push('<td class="mark" colspan="' + options.overlap_details[unit._id].gap_before + '"></td>');
          }
          if (options.hasOwnProperty('sort') && options.sort === true) {
            unit.readings = sortReadings(unit.readings);
          }
          if (app > 1) {
            id_string = j + '_app_' + app;
          } else {
            id_string = String(j);
          }
          if (options.hasOwnProperty('getUnitDataOptions')) {
            unit_data_options = options.getUnitDataOptions;
            unit_data_options.overlap = true;
            unit_data_options.col_length = options.overlap_details[unit._id].col_length;
            unit_data_options.unit_id = unit._id;
          } else {
            unit_data_options = {
              'overlap': true,
              'col_length': options.overlap_details[unit._id].col_length,
              'unit_id': unit._id
            };
          }
          if (app > 1) {
            unit_data_options.app_id = 'apparatus' + app;
          } else {
            unit_data_options.app_id = 'apparatus';
          }
          if (options.hasOwnProperty('highlighted_wit')) {
            unit_data_options.highlighted_wit = options.highlighted_wit;
          }
          if (options.hasOwnProperty('highlighted_version')) {
            unit_data_options.highlighted_version = options.highlighted_version;
          }
          if (options.hasOwnProperty('highlighted_unit')) {
            unit_data_options.highlighted_unit = options.highlighted_unit;
          }
          if (unit.hasOwnProperty('split_readings') && unit.split_readings === true) {
            unit_data_options.split = true;
          }
          if (unit.hasOwnProperty('created') && unit.created === true) {
            unit_data_options.created = true;
          }
          if (options.hasOwnProperty('getUnitDataFunction')) {
            unit_data_options.format = format;
            unit_data = options.getUnitDataFunction(unit.readings, id_string, unit.start, unit.end, unit_data_options);
          } else if (format === 'regularise') {
            unit_data = RG.getUnitData(unit.readings, id_string, unit.start, unit.end, unit_data_options);
          } else if (format === 'set_variants') {
            unit_data_options.td_id = td_id;
            unit_data = SV.getUnitData(unit.readings, id_string, unit.start, unit.end, unit_data_options);
            spacer_rows.push(SV.getSpacerUnitData(id_string, unit.start, unit.end));
          } else if (format === 'reorder') {
            unit_data = OR.getUnitData(unit.readings, id_string, format, unit.start, unit.end, unit_data_options);
          // } else if (format === 'version' || format === 'version_additions' || format === 'other_version_additions') {
          //   unit_data = VER.get_unit_data(unit.readings, id_string, format, unit.start, unit.end, unit_data_options);
          } else {
            unit_data = _getUnitData(unit.readings, id_string, format, unit.start, unit.end, unit_data_options);
          }
          rows.push(unit_data[0].join(''));
          row_list.push.apply(row_list, unit_data[1]);
          events = _mergeDicts(events, unit_data[2]);
        } else {
          empty_cell_options = {
            'start': unit.start,
            'end': unit.end,
            'dropable': true,
            'id': td_id
          };
          if (options.hasOwnProperty('column_lengths') && options.column_lengths.hasOwnProperty(i)) {
            for (k = 0; k < options.column_lengths[i]; k += 1) {
              rows.push(_getEmptyCell(format, empty_cell_options));
              if (format === 'set_variants') {
                spacer_rows.push(SV.getEmptySpacerCell());
              }
            }
          } else {
            rows.push(_getEmptyCell(format, empty_cell_options));
            if (format === 'set_variants') {
              spacer_rows.push(SV.getEmptySpacerCell());
            }
          }
          rows.push(_getEmptyCell(format, empty_cell_options));
          if (format === 'set_variants') {
            spacer_rows.push(SV.getEmptySpacerCell());
          }
        }
        if (j + 1 < apparatus.length) {
          next_start = apparatus[j + 1].start;
          if (apparatus[j + 1].hasOwnProperty('extra_start')) {
            next_start = apparatus[j + 1].start + apparatus[j + 1].extra_start;
          }
          if (next_start !== unit_index) {
            if (unit.hasOwnProperty('extra_start')) {
              i += (unit.end - (unit.start + unit.extra_start) + 1);
            } else {
              i += (unit.end - unit.start + 1);
            }
          }
        } else {
          if (unit.hasOwnProperty('extra_start')) {
            i += (unit.end - (unit.start + unit.extra_start) + 1);
          } else {
            i += (unit.end - unit.start + 1);
          }
        }
        j += 1;
      } else {
        i -= 1; //this might cause problems but its working for now!
      }
    }
    rows.push('<td></td></tr>'); //the extra ones for navigation arrows
    if (format === 'set_variants') {
      spacer_rows.push('<td></td></tr>');
      rows.push(spacer_rows.join(''));
    }
    return [rows, row_list, events];
  };

  sortReadings = function(readings) {
    readings.sort(_compareReadings);
    return readings;
  };

  //TODO: fix with &nbsp; is temporary need better solution for entire cell hover over
  extractDisplayText = function(reading, reading_pos, total_readings, unit_id, app_id) {
    if (reading.text.length === 0 && reading_pos === 0 && total_readings > 1) {
      return '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    } else {
      return extractWitnessText(reading, {
        'app_id': app_id,
        'unit_id': unit_id
      });
    }
  };

  getReadingLabel = function(reading_pos, reading, rules) {
    var alpha_id, i, label_suffix, reading_label;
    reading_label = '';
    label_suffix = '';
    alpha_id = getAlphaId(reading_pos);
    if (reading.hasOwnProperty('reading_classes')) {
      for (i = 0; i < reading.reading_classes.length; i += 1) {
        if (rules[reading.reading_classes[i]][2] === true) {
          if (typeof rules[reading.reading_classes[i]][0] !== 'undefined') {
            label_suffix += rules[reading.reading_classes[i]][0];
          }
        }
      }
    }
    if (reading.hasOwnProperty('label') && typeof reading.label !== 'undefined') {
      if (reading.label === 'zz') {
        reading_label = '—';
      }
    }
    if (reading.hasOwnProperty('overlap_status')) {
      reading_label = ''; //this will be the default if it doesn't get replaced
      if (reading.overlap_status === 'duplicate') {
        reading_label = '↓';
      } else {
        for (i = 0; i < CL.overlappedOptions.length; i += 1) {
          if (CL.overlappedOptions[i].reading_flag === reading.overlap_status &&
            CL.overlappedOptions[i].hasOwnProperty('reading_label_display')) {
            reading_label = CL.overlappedOptions[i].reading_label_display;
          }
        }
      }
    } else if (reading.label !== 'zz') {
      if (reading.hasOwnProperty('label')) {
        reading_label = reading.label + label_suffix + '.';
      } else {
        reading_label = alpha_id + label_suffix + '.';
      }
    }
    return reading_label;
  };

  getAlphaId = function(n) {
    if (n < 26) {
      return _alpha[n];
    }
    return _alpha[Math.floor(n / 26)] + _alpha[n % 26];
  };

  getReadingSuffix = function(reading, rules) {
    var reading_suffix, i;
    reading_suffix = '';
    if (reading.hasOwnProperty('reading_classes')) {
      for (i = 0; i < reading.reading_classes.length; i += 1) {
        if (rules[reading.reading_classes[i]][3] === true) {
          if (typeof rules[reading.reading_classes[i]][0] !== 'undefined') {
            reading_suffix += rules[reading.reading_classes[i]][0];
          }
        }
      }
    }
    if (reading_suffix !== '') {
      reading_suffix = '(' + reading_suffix + ')';
    }
    return reading_suffix;
  };

  addSubreadingEvents = function(stage, base_subreading_rules) {
    var scroll_offset;
    if (CL.showSubreadings === true) {
      if (document.getElementById('show_hide_subreadings_button')) {
        $('#show_hide_subreadings_button').on('click.hide_subreadings', function(event) {
          scroll_offset = [document.getElementById('scroller').scrollLeft,
            document.getElementById('scroller').scrollTop
          ];
          $(this).text($(this).text().replace('hide', 'show'));
          CL.showSubreadings = false;
          SR.loseSubreadings();
          if (typeof base_subreading_rules !== 'undefined') {
            SR.findSubreadings({
              'rule_classes': base_subreading_rules
            });
          }
          if (stage === 'reorder') {
            OR.showOrderReadings({
              'container': CL.container
            });
          } else {
            SV.showSetVariantsData();
            addSubreadingEvents(stage, base_subreading_rules);
          }
          document.getElementById('scroller').scrollLeft = scroll_offset[0];
          document.getElementById('scroller').scrollTop = scroll_offset[1];
        });
      }
    } else {
      if (document.getElementById('show_hide_subreadings_button')) {
        $('#show_hide_subreadings_button').on('click.show_subreadings', function(event) {
          scroll_offset = [document.getElementById('scroller').scrollLeft,
            document.getElementById('scroller').scrollTop
          ];
          $(this).text($(this).text().replace('show', 'hide'));
          CL.showSubreadings = true;
          SR.loseSubreadings(); //this is needed because if we have any showing (for example in order readings) and we try to fun find_subreadings we will lose the ones already showing
          SR.findSubreadings();
          if (stage === 'reorder') {
            OR.showOrderReadings({
              'container': CL.container
            });
          } else {
            SV.showSetVariantsData();
            addSubreadingEvents(stage, base_subreading_rules);
          }
          document.getElementById('scroller').scrollLeft = scroll_offset[0];
          document.getElementById('scroller').scrollTop = scroll_offset[1];
        });
      }
    }
  };

  /**apparatus - the list of units
   * app - a number showing which row of apparatus
   * format - which stage of the editor are we at
   * options - a dictionary of possible options
   * 		possibilities are:
   * 			sort - boolean - do the readings need sorting (default = false)
   * 			highlighted_wit - the witness to highlight
   * 			highlighted_version - a versional witness to highlight (version editor only)
   * 			highlighted_unit - a unit to mark as having an error*/
  getUnitLayout = function(apparatus, app, format, options) {
    var j, i, k, rows, unit, col_len_dict, row_list, extra_rows, new_row, unit_data_options,
      previous_index, id_string, events, unit_data, unit_index, split, spacer_rows, key;
    if (typeof options === 'undefined') {
      options = {};
    }
    j = 0;
    i = 1;
    rows = [];
    col_len_dict = {};
    row_list = [];
    extra_rows = {};
    events = {};
    if (format === 'set_variants') {
      spacer_rows = [];
      spacer_rows.push('<tr><td></td>');
    }
    rows.push('<tr><td></td>');
    //only care about highlighted unit if we are in the right apparatus
    if (options.hasOwnProperty('highlighted_unit') &&
      options.highlighted_unit !== undefined &&
      options.highlighted_unit[0] !== 'apparatus' + app) {
      delete options.highlighted_unit;
    }
    while (j < apparatus.length) {
      unit = apparatus[j];
      unit_index = unit.start;
      if (i < unit_index) { //we don't have a variant for this word
        rows.push(_getEmptyCell(format));
        if (format === 'set_variants') {
          spacer_rows.push(SV.getEmptySpacerCell());
        }
        i += 1;
      } else if (i === unit_index) { //we do have a variant for this word
        if (unit.readings.length > 1 ||
          //this is now set to always show units regardless of whether they have variation
          //the unused logic is left in incase we want to revert to the old way sometime
          (format === 'set_variants' && SV.showSharedUnits === true) ||
          (format === 'regularise') ||
          (format === 'reorder') ||
          (format === 'approved') ||
          (format === 'set_variants') ||
          format === 'version_additions' ||
          format === 'other_version_additions') {
          if (options.hasOwnProperty('sort') && options.sort === true) {
            unit.readings = sortReadings(unit.readings);
          }
          if (app > 1) {
            id_string = j + '_app_' + app;
          } else {
            id_string = String(j);
          }
          if (options.hasOwnProperty('getUnitDataOptions')) {
            unit_data_options = options.getUnitDataOptions;
            unit_data_options.unit_id = unit._id;
          } else {
            unit_data_options = {
              'unit_id': unit._id
            };
          }
          if (app > 1) {
            unit_data_options.app_id = 'apparatus' + app;
          } else {
            unit_data_options.app_id = 'apparatus';
          }
          if (options.hasOwnProperty('highlighted_wit')) {
            unit_data_options.highlighted_wit = options.highlighted_wit;
          }
          if (options.hasOwnProperty('highlighted_version')) {
            unit_data_options.highlighted_version = options.highlighted_version;
          }
          if (options.hasOwnProperty('highlighted_unit')) {
            unit_data_options.highlighted_unit = options.highlighted_unit;
          }
          if (unit.hasOwnProperty('split_readings') && unit.split_readings === true) {
            unit_data_options.split = true;
          }
          if (unit.hasOwnProperty('created') && unit.created === true) {
            unit_data_options.created = true;
          }
          if (unit.hasOwnProperty('overlap_units')) {
            unit_data_options.overlapping_ids = [];
            for (key in unit.overlap_units) {
              if (unit.overlap_units.hasOwnProperty(key)) {
                unit_data_options.overlapping_ids.push(key);
              }
            }
          }
          if (!unitHasText(unit)) {
            unit_data_options.gap_unit = true;
          }
          if (options.hasOwnProperty('getUnitDataFunction')) {
            unit_data_options.format = format;
            unit_data = options.getUnitDataFunction(unit.readings, id_string, unit.start, unit.end, unit_data_options);
          } else if (format === 'regularise') {
            unit_data = RG.getUnitData(unit.readings, id_string, unit.start, unit.end, unit_data_options);
          } else if (format === 'set_variants') {
            unit_data = SV.getUnitData(unit.readings, id_string, unit.start, unit.end, unit_data_options);
            spacer_rows.push(SV.getSpacerUnitData(id_string, unit.start, unit.end));
          } else if (format === 'reorder') {
            unit_data = OR.getUnitData(unit.readings, id_string, format, unit.start, unit.end, unit_data_options);
          } else if (format === 'version') {
            unit_data = VER.get_unit_data(unit.readings, id_string, format, unit.start, unit.end, unit_data_options);
          } else {
            unit_data = OR.getUnitData(unit.readings, id_string, format, unit.start, unit.end, unit_data_options);
          }
          rows.push(unit_data[0].join(''));
          row_list.push.apply(row_list, unit_data[1]);
          events = _mergeDicts(events, unit_data[2]);
        } else {
          rows.push(_getEmptyCell(format, {
            'start': unit.start,
            'end': unit.end
          }));
          if (format === 'set_variants') {
            spacer_rows.push(SV.getEmptySpacerCell(unit.start, unit.end));
          }
        }
        if (j + 1 < apparatus.length && apparatus[j + 1].start !== unit_index) {
          i += (unit.end - unit.start + 1);
        } else if (j + 1 < apparatus.length) {
          if (col_len_dict.hasOwnProperty(i)) {
            col_len_dict[i] += 1;
          } else {
            col_len_dict[i] = 2;
          }
        }
        j += 1;
      } else { // this should be an overlapping variant
        console.log('this should never be happening! Your units are not sequentially numbered!');
      }
    }
    rows.push('<td></td></tr>');
    if (format === 'set_variants') {
      spacer_rows.push('<td></td></tr>');
      rows.push(spacer_rows.join(''));
    }
    return [rows, col_len_dict, row_list, events, j];
  };

  /**
   * Tests whether the given unit has a reading that contains text or not
   *
   * @method unitHasText
   * @param {Object} unit The unit to be tested
   * @return {boolean} returns true if the unit contains a reading with text or false if all om/lac etc.
   * */
  unitHasText = function(unit) {
    var i, j, key;
    for (i = 0; i < unit.readings.length; i += 1) {
      if (unit.readings[i].text.length > 0) {
        return true;
      }
      if (unit.readings[i].hasOwnProperty('subreadings')) {
        for (key in unit.readings[i].subreadings) {
          if (unit.readings[i].subreadings.hasOwnProperty(key)) {
            for (j = 0; j < unit.readings[i].subreadings[key].length; j += 1) {
              if (unit.readings[i].subreadings[key][j].text.length > 0) {
                return true;
              }
            }
          }
        }
      }
      if (unit.readings[i].hasOwnProperty('SR_text')) {
        for (key in unit.readings[i].SR_text) {
          if (unit.readings[i].SR_text.hasOwnProperty(key)) {
            if (unit.readings[i].SR_text[key].text.length > 0) {
              return true;
            }
          }
        }
      }
    }
    return false;
  };



  isBlank = function(str) {
    return (!str || /^\s*$/.test(str));
  };

  getHighlightedText = function(witness) {
    var i, j, k, temp, transcription_id, hand, text, display_hand, verse, is_private;
    temp = witness.split('|');
    transcription_id = temp[0];
    hand = temp[1];
    text = [];
    display_hand = hand;
    document.getElementById('single_witness_reading').innerHTML = '<span class="highlighted_reading"><b>' + display_hand + ':</b><img id="loadingbar" src="' + staticUrl + 'CE_core/images/loadingbar.gif"/></span>';
    if (hand.search('_private') === -1) {
      is_private = false;
    } else {
      is_private = true;
    }
    CL.services.getVerseData(CL.context, [transcription_id], is_private, function(transcriptions) {
      if (transcriptions.length > 0) {
        for (i = 0; i < transcriptions.length; i += 1) {
          verse = transcriptions[i];
          if (verse.hasOwnProperty('witnesses')) {
            for (j = 0; j < verse.witnesses.length; j += 1) {
              if (verse.witnesses[j].id === hand) {
                for (k = 0; k < verse.witnesses[j].tokens.length; k += 1) {
                  if (verse.witnesses[j].tokens[k].hasOwnProperty('gap_before')) {
                    text.push('&lt;' + verse.witnesses[j].tokens[k].gap_before_details + '&gt;');
                  }
                  if (verse.witnesses[j].tokens[k].hasOwnProperty('expanded')) {
                    text.push(verse.witnesses[j].tokens[k].expanded);
                  } else if (verse.witnesses[j].tokens[k].hasOwnProperty('original')) {
                    text.push(verse.witnesses[j].tokens[k].original);
                  } else {
                    text.push(verse.witnesses[j].tokens[k].t);
                  }
                  if (verse.witnesses[j].tokens[k].hasOwnProperty('gap_after')) {
                    text.push('&lt;' + verse.witnesses[j].tokens[k].gap_details + '&gt;');
                  }
                }
                document.getElementById('single_witness_reading').innerHTML = '<span class="highlighted_reading"><b>' + display_hand + ':</b> ' + text.join(' ').replace(/_/g, '&#803;') + '</span>';
                break;
              }
            }
          } else {
            //om verse
            document.getElementById('single_witness_reading').innerHTML = '<span class="highlighted_reading"><b>' + display_hand + ':</b> no text</span>';
          }
        }
      } else {
        //lac verse
        document.getElementById('single_witness_reading').innerHTML = '<span class="highlighted_reading"><b>' + display_hand + ':</b> no text</span>';
      }
    });
  };

  findOverlapUnitById = function(id) {
    var app_id, key, unit;
    unit = null;
    for (key in CL.data) {
      if (key.match(/apparatus\d*/g) !== null) {
        if (unit === null) {
          unit = findUnitById(key, id);
        }
      }
    }
    return unit;
  };

  getReading = function(reading, witness) {
    var key, i;
    if (reading.hasOwnProperty('SR_text') && reading.SR_text.hasOwnProperty(witness)) {
      return reading.SR_text[witness];
    }
    if (reading.hasOwnProperty('subreadings')) {
      for (key in reading.subreadings) {
        if (reading.subreadings.hasOwnProperty(key)) {
          for (i = 0; i < reading.subreadings[key].length; i += 1) {
            if (reading.subreadings[key][i].witnesses.indexOf(witness) !== -1) {
              return reading.subreadings[key][i];
            }
          }
        }
      }
    }
    if (reading.witnesses.indexOf(witness) !== -1) {
      return reading;
    }
  };

  /** This deals with getting the correct om and lac details in the interface when a MS has no text for a reading
   * it needs to be done 'live' because when units and readings are moved values can change
   *
   * this could be run when subreadings are shown and when subreadings are hidden
   *
   *  */
  lacOmFix = function() {
    var i, j, k, apparatus, witnesses, empty_witnesses, token, extra_readings, overlap, key, subreading_data, text, overlap_status;
    //first strip all the empty units displaying gaps and then recreate the ones we still need
    _cleanExtraGaps();
    _createExtraGaps();
    apparatus = CL.data.apparatus;
    for (i = 0; i < apparatus.length; i += 1) { // loop through units
      extra_readings = [];
      for (j = 0; j < apparatus[i].readings.length; j += 1) { // loop through readings
        //if this is reading contains an empty reading and if this isn't a whole verse lac or whole verse om
        if (_containsEmptyReading(apparatus[i].readings[j]) && //includes subreadings and SR_text
          apparatus[i].readings[j].type !== 'lac_verse' &&
          apparatus[i].readings[j].type !== 'om_verse') {
          overlap_status = undefined;
          if (apparatus[i].readings[j].hasOwnProperty('overlap_status')) {
            overlap_status = apparatus[i].readings[j].overlap_status;
          }
          // gets all witnesses that have an empty reading including those in subreadings
          empty_witnesses = _getAllEmptyReadingWitnesses(apparatus[i].readings[j]);
          //get all the witnesses for the reading
          witnesses = getAllReadingWitnesses(apparatus[i].readings[j]);
          //now work out from context if it should be lac or om
          for (k = 0; k < witnesses.length; k += 1) {
            //if this witness is overlapped do not try to fix - it should be displayed as om regardless
            if (!_isOverlapped(apparatus[i], witnesses[k])) {
              //TODO: need to test that this works if first unit word has gap before and after I think it probably does
              if (i === 0) { //this is the first unit so we need to look for gaps before the first word in witness
                token = _hasGapBefore(apparatus, witnesses[k]);
              } else {
                token = _hasGapAfter(apparatus, witnesses[k], i);
              }
              if (token[0] === true && empty_witnesses.indexOf(witnesses[k]) !== -1) {
                //set up a new reading for the lac version
                extra_readings = _addLacReading(extra_readings, witnesses[k], token[1], overlap_status);
                witnesses[k] = null; // just make it null and delete later so you don't change size mid loop
              } else if (apparatus[i].readings[j].witnesses.indexOf(witnesses[k]) !== -1 &&
                ((apparatus[i].readings[j].hasOwnProperty('SR_text') && !apparatus[i].readings[j].SR_text.hasOwnProperty(witnesses[k])) ||
                  !apparatus[i].readings[j].hasOwnProperty('SR_text'))) {
                //if this witness is a genuine main reading
                //then leave the witness alone and if its text length is 0 ensure it is om not lac (it may have changed when moving readings about)
                if (apparatus[i].readings[j].text.length === 0) {
                  apparatus[i].readings[j].type = 'om';
                  delete apparatus[i].readings[j].details;
                }
              } else if (apparatus[i].readings[j].witnesses.indexOf(witnesses[k]) !== -1 &&
                apparatus[i].readings[j].hasOwnProperty('SR_text') &&
                apparatus[i].readings[j].SR_text.hasOwnProperty(witnesses[k]) &&
                apparatus[i].readings[j].SR_text[witnesses[k]].text.length === 0) {
                //squelch if this is an om reading which is a subreading of another reading

              } else {
                witnesses[k] = null;
              }
            }
          }
          apparatus[i].readings[j].witnesses = removeNullItems(witnesses); //strip null from witnesses
          //if no witnesses remain delete the reading
          if (apparatus[i].readings[j].witnesses.length === 0) {
            apparatus[i].readings[j] = null;
          }
        }
      }
      apparatus[i].readings = removeNullItems(apparatus[i].readings);
      for (j = 0; j < extra_readings.length; j += 1) {
        addReadingId(extra_readings[j], apparatus[i].start, apparatus[i].end);
        apparatus[i].readings.push(extra_readings[j]);
      }
    }
  };

  getSubreadingOfWitness = function(reading, witness, inc_SR_text) {
    var key, i;
    if (reading.hasOwnProperty('subreadings')) {
      for (key in reading.subreadings) {
        if (reading.subreadings.hasOwnProperty(key)) {
          for (i = 0; i < reading.subreadings[key].length; i += 1) {
            if (reading.subreadings[key][i].witnesses.indexOf(witness) !== -1) {
              return reading.subreadings[key][i];
            }
          }
        }
      }
    }
    if (inc_SR_text === true && reading.hasOwnProperty('SR_text')) {
      for (key in reading.SR_text) {
        if (key === witness) {
          return reading.SR_text[key];
        }
      }
    }
    return null;
  };

  //if any of the provided ovlerap_units object have an empty reading
  overlapHasEmptyReading = function(overlap_units) {
    var empty_reading, key, ol_unit;
    for (key in overlap_units) {
      if (overlap_units.hasOwnProperty(key)) {
        ol_unit = findOverlapUnitById(key);
        //the 1 in the next line can be hard coded because overlapped readings only ever have a single reading
        //after the a reading at this point
        if (ol_unit.readings[1].text.length === 0) {
          return true;
        }
      }
    }
    return false;
  };

  removeNullItems = function(list) {
    var i;
    for (i = list.length - 1; i >= 0; i -= 1) {
      if (list[i] === null) {
        list.splice(i, 1);
      }
    }
    return list;
  };

  addStageLinks = function() {
    if (document.getElementById('stage_links') && CL.services.hasOwnProperty('getSavedStageIds')) {
      document.getElementById('stage_links').innerHTML = '<span id="R">Reg</span><span id="S">Set</span><span id="O">Ord</span><span id="A">App</span>';
      CL.services.getSavedStageIds(CL.context, function(r, s, o, a) {
        if (r) {
          $('#R').addClass('saved_version');
          _addNavEvent('R', r);
        }
        if (s) {
          $('#S').addClass('saved_version');
          _addNavEvent('S', s);
        }
        if (o) {
          $('#O').addClass('saved_version');
          _addNavEvent('O', o);
        }
        if (a) {
          $('#A').addClass('saved_version');
          _addNavEvent('A', a);
        }
      });
    }
  };


  addExtraFooterButtons = function(stage) {
    var i, html;
    html = [];
    if (CL.project.hasOwnProperty('extraFooterButtons') && CL.project.extraFooterButtons.hasOwnProperty(stage)) {
      for (i = 0; i < CL.project.extraFooterButtons[stage].length; i += 1) {
        if (CL.project.extraFooterButtons[stage][i].hasOwnProperty('id')) {
          html.push('<input class="pure-button left_foot" type="button" id="' + CL.project.extraFooterButtons[stage][i].id + '" value="');
          if (CL.project.extraFooterButtons[stage][i].hasOwnProperty('label')) {
            html.push(CL.project.extraFooterButtons[stage][i].label);
          } else {
            html.push(CL.project.extraFooterButtons[stage][i].id);
          }
          html.push('"/>');
        }
      }
    } else if (CL.services.hasOwnProperty('extraFooterButtons') && CL.services.extraFooterButtons.hasOwnProperty(stage)) {
      for (i = 0; i < CL.services.extraFooterButtons[stage].length; i += 1) {
        if (CL.services.extraFooterButtons[stage][i].hasOwnProperty('id')) {
          html.push('<input class="pure-button left_foot" type="button" id="' + CL.services.extraFooterButtons[stage][i].id + '" value="');
          if (CL.services.extraFooterButtons[stage][i].hasOwnProperty('label')) {
            html.push(CL.services.extraFooterButtons[stage][i].label);
          } else {
            html.push(CL.services.extraFooterButtons[stage][i].id);
          }
          html.push('"/>');
        }
      }

    }
    document.getElementById('extra_buttons').innerHTML = html.join('');
    if (CL.services.hasOwnProperty('addExtraFooterFunctions')) {
      CL.services.addExtraFooterFunctions();
    }
    return null;
  };

  makeVerseLinks = function() {
    var verse, ok;
    if (document.getElementById('previous_verse') && CL.services.hasOwnProperty('getAdjoiningVerse')) {
      CL.services.getAdjoiningVerse(CL.context, true, function(verse) { // previous
        if (verse) {
          $('#previous_verse').on('click', function() {
            if (!RG.hasOwnProperty('_rules') || (RG.hasOwnProperty('_rules') && RG.allRuleStacksEmpty())) {
              _findLatestStageVerse(verse);
            } else {
              ok = confirm('You have unapplied rule changes in this verse. They will be lost if you navigate away.\nAre you sure you want to continue?');
              if (ok) {
                _findLatestStageVerse(verse);
              } else {
                return;
              }
            }
          });
        } else {
          document.getElementById('previous_verse').innerHTML = '';
        }
      });
    }
    if (document.getElementById('next_verse') && CL.services.hasOwnProperty('getAdjoiningVerse')) {
      CL.services.getAdjoiningVerse(CL.context, false, function(verse) { // next
        if (verse) {
          $('#next_verse').on('click', function() {
            if (!RG.hasOwnProperty('_rules') || (RG.hasOwnProperty('_rules') && RG.allRuleStacksEmpty())) {
              _findLatestStageVerse(verse);
            } else {
              ok = confirm('You have unapplied rule changes in this verse. They will be lost if you navigate away.\nAre you sure you want to continue?');
              if (ok) {
                _findLatestStageVerse(verse);
              } else {
                return;
              }
            }
          });
        } else {
          document.getElementById('next_verse').innerHTML = '';
        }
      });
    }
  };

  getUnitAppReading = function(id) {
    var unit_details_regex, m, details;
    unit_details_regex = /(variant|drag)_unit_(\d+)(_app_)?(\d+)?(_reading_|_row_)?(\d+)?/;
    m = id.match(unit_details_regex);
    if (m === null) {
      console.log(unit_details_regex);
    }
    details = [parseInt(m[2], 10)];
    if (typeof m[4] !== 'undefined') {
      details.push('apparatus' + m[4]);
    } else {
      details.push('apparatus');
    }
    if (typeof m[6] !== 'undefined') {
      details.push(parseInt(m[6]));
    } else {
      details.push(m[6]);
    }
    return details;
  };

  /** turn a list into another list which only contains unique items */
  //TODO: can this be done by casting?
  setList = function(list) {
    var i, set;
    set = [];
    for (i = 0; i < list.length; i += 1) {
      if (set.indexOf(list[i]) === -1) {
        set.push(list[i]);
      }
    }
    return set;
  };

  getActiveUnitWitnesses = function(unit, app_id) {
    var witnesses, i, j, key;
    witnesses = [];
    if (app_id === 'apparatus') {
      i = 0;
    } else {
      i = 1;
    }
    for (i; i < unit.readings.length; i += 1) {
      witnesses.push.apply(witnesses, unit.readings[i].witnesses);
      if (unit.readings[i].hasOwnProperty('subreadings')) {
        for (key in unit.readings[i].subreadings) {
          if (unit.readings[i].subreadings.hasOwnProperty(key)) {
            for (j = 0; j < unit.readings[i].subreadings[key].length; j += 1) {
              witnesses.push.apply(witnesses, unit.readings[i].subreadings[key][j].witnesses);
            }
          }
        }
      }
    }
    return witnesses;
  };

  getExporterSettings = function() {
    if (CL.project.hasOwnProperty('exporterSettings')) {
      return JSON.stringify(CL.project.exporterSettings);
    }
    if (CL.services.hasOwnProperty('exporterSettings')) {
      return JSON.stringify(CL.services.exporterSettings);
    }
    //exporter factory has its own defaults so no need to have any here
    return;
  };

  saveCollation = function(status, success_callback) {
    var collation, confirmed, confirm_message, success_message, approval_settings;
    SPN.show_loading_overlay();
    CL.services.getUserInfo(function(user) {
      if (user) {
        //approved has different rules than others.
        collation = {
          'structure': CL.data,
          'status': status,
          'context': CL.context,
          'user': user.id,
          'data_settings': CL.dataSettings,
          'algorithm_settings': CL.algorithmSettings,
          'display_settings': CL.displaySettings
        };
        if (status === 'approved') {
          approval_settings = _getApprovalSettings();
          collation.id = CL.context + '_' + status;
          confirm_message = "This project already has an approved version of this verse.\nAre you sure you want to overwrite the currently saved version with this one?";
          success_message = 'Approve successful';
        } else {
          approval_settings = [true, undefined];
          collation.id = CL.context + '_' + status + '_' + user.id;
          confirm_message = "You already have this verse saved at this stage in this environment.\nAre you sure you want to overwrite the currently saved version with this one?";
          success_message = 'Save successful';
        }
        if (CL.project.hasOwnProperty('id')) {
          collation.project = CL.project.id;
          collation.id += '_' + CL.project.id;
        } else {
          // should never happen but just in case stick in the user id.
          collation.id += '_' + user.id;
        }
        CL.services.saveCollation(CL.context, collation, confirm_message, approval_settings[0], approval_settings[1], function(saved_successful) {
          document.getElementById('message_panel').innerHTML = saved_successful ? success_message : '';
          if (saved_successful) { //only run success callback if successful!
            if (typeof success_callback !== 'undefined') {
              success_callback();
            }
          }
          SPN.remove_loading_overlay();
        });
      }
    });
  };

  sortWitnesses = function(witnesses) {
    //TODO: this should look for project_witnessSort or use the key witnessSort in CL.project
    if (CL.project.hasOwnProperty('witnessSort')) {
      //use a project function if there is one
      CL.run_function(CL.project.witnessSort, [witnesses]);
    } else if (CL.services && CL.services.hasOwnProperty('witnessSort')) {
      //or use the default for the services if there is one
      CL.run_function(CL.services.witnessSort, [witnesses]);
    } else {
      //or just use regular sort
      witnesses.sort();
    }
    return witnesses;
  };

  getSpecifiedAncestor = function(element, ancestor, condition_test) {
    if (typeof condition_test === 'undefined') {
      condition_test = function(e) {
        return true;
      };
    }
    if (element.tagName === ancestor && condition_test(element)) {
      return element;
    } else {
      while (element.tagName !== 'BODY' && (element.tagName !== ancestor || (element.tagName === ancestor && condition_test(element) === false))) {
        element = element.parentNode;
      }
      return element;
    }
  };

  hideTooltip = function() {
    document.getElementById('tool_tip').style.display = 'none';
  };

  addHoverEvents = function(row, witnesses) {
    $(row).on('mouseover', function(event) {
      _displayWitnessesHover(event, witnesses);
    });
    $(row).on('mouseout', function(event) {
      hideTooltip();
    });
  };

  markReading = function(value, reading) {
    if (reading.hasOwnProperty('reading_classes')) {
      if (reading.reading_classes.indexOf(value) === -1) {
        reading.reading_classes.push(value);
      } else {
        reading.reading_classes.splice(reading.reading_classes.indexOf(value), 1);
        if (reading.reading_classes.length === 0) {
          delete reading.reading_classes;
        }
      }
    } else {
      reading.reading_classes = [value];
    }
  };

  //TODO: think about putting html in a html file and calling in
  showSplitWitnessMenu = function(reading, menu_pos, details) {
    var wit_menu, witnesses, witness_html, window_height, menu_height, sub_types, id, left, top;
    left = menu_pos.left;
    top = menu_pos.top;
    //if there is already an old menu hanging around remove it
    if (document.getElementById('wit_form')) {
      document.getElementsByTagName('body')[0].removeChild(document.getElementById('wit_form'));
    }
    //show the select witnesses menu
    wit_menu = document.createElement('div');
    wit_menu.setAttribute('id', 'wit_form');
    wit_menu.setAttribute('class', 'wit_form dragdiv dialogue_form');
    witnesses = sortWitnesses(getAllReadingWitnesses(reading));
    witness_html = ['<div class="dialogue_form_header">' + details.header + '</div><form id="select_wit_form">'];
    witness_html.push('<label>Selected reading: </label><span>');
    witness_html.push(CL.extractWitnessText(reading));
    witness_html.push('</span>');
    if (witnesses.length > 1 && (!details.hasOwnProperty('witness_select') || details.witness_select !== false)) {
      witness_html.push('<div id="wit_scroller"><input type="checkbox" id="wit_select_all">Select All</input><br/>');
      for (i = 0; i < witnesses.length; i += 1) {
        if (witnesses[i] !== CL.dataSettings.base_text_siglum) {
          witness_html.push('<input type="checkbox" id="' + witnesses[i] + '" name="' + witnesses[i] + '" value="' + witnesses[i] + '">' + witnesses[i] + '</input><br/>');
        }
      }
      witness_html.push('</div>');
    } else {
      for (i = 0; i < witnesses.length; i += 1) {
        witness_html.push('<input type="hidden" name="' + witnesses[i] + '" value="true"/><br/>');
      }
      //witness_html.push('<br/><br/>');
    }
    if (details.type === 'overlap') {
      //witness_html.push('<label>Duplicate reading? <input type="checkbox" id="duplicate" name="duplicate"/></label><br/><br/>');
    } else if (details.type === 'SVsubreading' || details.type === 'ORsubreading') {
      witness_html.push('<label class="inline-label">Parent reading:</label><select name="parent_reading" id="parent_reading"></select><br/><br/>');
      witness_html.push('<label class="inline-label">Details:</label><input disabled="disabled" type="text" name="reading_details" id="reading_details"/><br/></br/>');
      sub_types = getRuleClasses('subreading', true, 'value', 'identifier');
      if (Object.keys(sub_types).length > 1) {
        witness_html.push('<label>Subreading type: <select name="subreading_type" id="subreading_select"></select></label><br/><br/>');
      } else {
        id = error_types[Object.keys(sub_types)];
        witness_html.push('<input type="hidden" id="subreading_type" name="subreading_type" value="' + id + '"/>');
      }
    } else if (details.type !== 'duplicate') {
      witness_html.push('<label class="inline-label">Parent reading:</label><select name="parent_reading" id="parent_reading"></select><br/>');
      witness_html.push('<label class="inline-label">Details:</label><input disabled="disabled" type="text" name="reading_details" id="reading_details"/><br/></br/>');
    }
    witness_html.push('<input class="pure-button dialogue-form-button" id="close_button" type="button" value="Cancel"/>');
    witness_html.push('<input class="pure-button dialogue-form-button" id="select_button" type="button" value="' + details.button + '"/></form>');
    wit_menu.innerHTML = witness_html.join('');
    document.getElementsByTagName('body')[0].appendChild(wit_menu);
    window_height = window.innerHeight;
    menu_height = window_height - 300;
    if (menu_height < 50) {
      menu_height = 50;
    }
    left = parseInt(left) - document.getElementById('scroller').scrollLeft;
    if (left + document.getElementById('wit_form').offsetWidth > window.innerWidth) {
      left = left - document.getElementById('wit_form').offsetWidth;
    }
    if (witnesses.length > 1 && (!details.hasOwnProperty('witness_select') || details.witness_select !== false)) {
      document.getElementById('wit_scroller').style.maxHeight = menu_height + 'px';
    }
    document.getElementById('wit_form').style.left = left + 'px';
    DND.InitDragDrop('wit_form', true, true);
    $('#close_button').on('click', function(event) {
      document.getElementsByTagName('body')[0].removeChild(document.getElementById('wit_form'));
    });
    if (document.getElementById('wit_select_all')) {
      $('#wit_select_all').on('click', function(event) {
        _checkWitnesses(event.target.id);
      });
    }
  };

  //mark readings using standoff model
  markStandoffReading = function(type, name, reading_details, format, menu_pos) {
    var i, reading, parents, unit, new_reading_id, subreading_classes, total_reading_witnesses;
    reading = CL.data[reading_details.app_id][reading_details.unit_pos].readings[reading_details.reading_pos];
    total_reading_witnesses = reading.witnesses.length;
    //show the menu to identify the parent reading and split the witnesses if necessary
    if (reading.witnesses.length > 1 || reading.hasOwnProperty('subreadings')) {
      showSplitWitnessMenu(reading, menu_pos, {
        'type': type,
        'header': 'Select witnesses to mark as ' + name,
        'button': 'Mark ' + name
      });
    } else {
      showSplitWitnessMenu(reading, menu_pos, {
        'type': type,
        'header': 'Select parent reading',
        'button': 'Mark ' + name
      });
    }
    //populate the parent drop down
    parents = [];
    for (i = 0; i < CL.data[reading_details.app_id][reading_details.unit_pos].readings.length; i += 1) {
      //if the reading is
      //	not the reading being made a subreading
      //	its not an empty reading (doesn't have a type attribute)
      //	it is an empty reading but isn't lac verse or om verse (probably should change this and deal with them differently)
      //	the unit is an overlap and i != 0 (which means this is the a reading)
      if (i !== reading_details.reading_pos &&
        (!CL.data[reading_details.app_id][reading_details.unit_pos].readings[i].hasOwnProperty('type') ||
          (CL.data[reading_details.app_id][reading_details.unit_pos].readings[i].hasOwnProperty('type') &&
            CL.data[reading_details.app_id][reading_details.unit_pos].readings[i].type !== 'om_verse' &&
            CL.data[reading_details.app_id][reading_details.unit_pos].readings[i].type !== 'lac_verse')) &&
        (reading_details.app_id === 'apparatus' || (
          reading_details.app_id !== 'apparatus' && i !== 0))) {
        parents.push({
          'label': getAlphaId(i),
          'value': CL.data[reading_details.app_id][reading_details.unit_pos].readings[i]._id
        });
      }
    }
    parents.push({
      'label': 'om',
      'value': 'om'
    });
    parents.push({
      'label': 'gap',
      'value': 'gap'
    });
    parents.push({
      'label': 'other',
      'value': 'other'
    });

    cforms.populateSelect(parents, document.getElementById('parent_reading'), {'value_key': 'value', 'text_keys': 'label'});
    //Populate the subreading type dropdown
    if (document.getElementById('subreading_select')) {
      subreading_classes = [];
      for (i = 0; i < CL.ruleClasses.length; i += 1) {
        if (CL.ruleClasses[i].create_in_SV === true && CL.ruleClasses[i].subreading === true) {
          subreading_classes.push(CL.ruleClasses[i]);
        }
      }
      cforms.populateSelect(subreading_classes, document.getElementById('subreading_select'), {'value_key': 'value', 'text_keys': 'name', 'add_select': false});
    }
    //Add event handler to provide extra data box for gap and other
    $('#parent_reading').on('change', function(event) {
      if (event.target.value === 'gap') {
        document.getElementById('reading_details').value = '';
        document.getElementById('reading_details').removeAttribute('disabled');
      } else if (event.target.value === 'other') {
        document.getElementById('reading_details').value = '';
        document.getElementById('reading_details').removeAttribute('disabled');
      } else {
        document.getElementById('reading_details').value = '';
        document.getElementById('reading_details').setAttribute('disabled', 'disabled');
      }
    });
    //Add event handler to do the job
    $('#select_button').on('click', function(event) {
      var extra_details, data, witness_list, key, unit;
      data = cforms.serialiseForm('select_wit_form');
      if (data.parent_reading !== 'none') {
        witness_list = [];
        for (key in data) {
          if (key === 'duplicate') {
            duplicate = true;
          } else if (key === 'subreading_type') {
            type = data[key];
          } else if (key === 'reading_details') {
            extra_details = data[key].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          } else if (key !== 'parent_reading' && data.hasOwnProperty(key) && data[key] !== null) {
            witness_list.push(key);
          }
        }
        //					console.log(witness_list)
        if (data.parent_reading === 'other') {
          //if the reading that is being created is not the same as the a reading when we are in an overlapped reading
          if (reading_details.app_id === 'apparatus' || (reading_details.app_id !== 'apparatus' && extra_details.trim() !== extractWitnessText(CL.data[reading_details.app_id][reading_details.unit_pos].readings[0]))) {
            data.parent_reading = createNewReading(CL.data[reading_details.app_id][reading_details.unit_pos], data.parent_reading, extra_details);
          } else {
            alert('The reading you have entered is the same as the a reading. This is not allowed in overlapped units.');
            return;
          }
        } else if (data.parent_reading === 'gap') {
          data.parent_reading = createNewReading(CL.data[reading_details.app_id][reading_details.unit_pos], data.parent_reading, extra_details);
        } else if (data.parent_reading === 'om') {
          data.parent_reading = createNewReading(CL.data[reading_details.app_id][reading_details.unit_pos], data.parent_reading);
        }

        new_reading_id = SV.doSplitReadingWitnesses(reading_details.unit_pos, reading_details.reading_pos, witness_list, reading_details.app_id, true);
        //					console.log(new_reading_id)
        reading_details.reading_id = new_reading_id;
        //					console.log(reading_details)
        //record it in the separated_witnesses structure if we didn't select all witnesses in the reading
        if (witness_list.length < total_reading_witnesses) {
          if (!CL.data.hasOwnProperty('separated_witnesses')) {
            CL.data.separated_witnesses = [];
          }
          unit = CL.data[reading_details.app_id][reading_details.unit_pos];
          CL.data.separated_witnesses.push({
            'app_id': reading_details.app_id,
            'unit_id': unit._id,
            'witnesses': witness_list,
            'reading_id': reading_details.reading_id
          });
        }
        if (format === 'set_variants') {
          SV.makeStandoffReading(type, reading_details, data.parent_reading, extra_details);
        } else if (format === 'order_readings') {
          OR.makeStandoffReading(type, reading_details, data.parent_reading);
        }


        document.getElementsByTagName('body')[0].removeChild(document.getElementById('wit_form'));
      }
    });
  };

  findUnitPosById = function(app_id, unit_id) {
    var i, data;
    if (CL.data.hasOwnProperty(app_id)) {
      for (i = 0; i < CL.data[app_id].length; i += 1) {
        if (CL.data[app_id][i]._id === unit_id) {
          return i;
        }
      }
    }
    return null;
  };

  findReadingById = function(unit, id) {
    var i;
    for (i = 0; i < unit.readings.length; i += 1) {
      if (unit.readings[i].hasOwnProperty('_id') && unit.readings[i]._id === id) {
        return unit.readings[i];
      }
    }
    return null;
  };

  applyPreStageChecks = function(stage) {
    var preStageChecks, i, result;
    preStageChecks = _getPreStageChecks(stage);
    for (i = 0; i < preStageChecks.length; i += 1) {
      result = CL.run_function(preStageChecks[i]['function']);
      if (result !== preStageChecks[i].pass_condition) {
        return [false, preStageChecks[i].fail_message];
      }
    }
    return [true];
  };

  makeStandoffReading = function(type, reading_details, parent_id) {
    var apparatus, unit, reading, fosilised_reading, parent, key, i, j, k, ids, new_reading, witness;
    apparatus = reading_details.app_id;
    unit = findUnitById(apparatus, reading_details.unit_id);
    parent = findReadingById(unit, parent_id);
    SR.loseSubreadings(); //must always lose subreadings first or find subreadings doesn't find them all!
    SR.findSubreadings({
      'unit_id': unit._id
    }); //we need this to see if we have any!
    reading = findReadingById(unit, reading_details.reading_id);
    fosilised_reading = JSON.parse(JSON.stringify(reading));
    //do any existing subreadings
    if (reading.hasOwnProperty('subreadings')) {
      //now here is the tricky bit - if this subreading is a subreading because of work done in the regulariser we need to
      //preserve those decisions in the reading_history of the standoff subreading we are about to create.
      //To do this we need to pretend these are already standoff marked readings and add the data to the standoff marked readings datastructure
      for (key in reading.subreadings) {
        if (reading.subreadings.hasOwnProperty(key)) {
          for (i = reading.subreadings[key].length - 1; i >= 0; i -= 1) {
            k = reading.subreadings[key][i].witnesses.length - 1;
            while (reading.hasOwnProperty('subreadings') && reading.subreadings.hasOwnProperty(key) && i < reading.subreadings[key].length && k >= 0) {
              witness = reading.subreadings[key][i].witnesses[k];
              if (findStandoffRegularisation(unit, witness, apparatus) === null) {
                _makeRegDecisionsStandoff(type, apparatus, unit, reading, parent, reading.subreadings[key][i], witness);
                makeMainReading(unit, reading, key, i, {
                  'witnesses': [witness]
                });
              } else {
                ids = makeMainReading(unit, reading, key, i, {
                  'witnesses': [witness]
                });
                for (j = 0; j < ids.length; j += 1) {
                  new_reading = findReadingById(unit, ids[j]);
                  doMakeStandoffReading(type, apparatus, unit, new_reading, parent);
                }
              }
              SR.loseSubreadings();
              SR.findSubreadings({
                'unit_id': unit._id
              });
              k -= 1;
            }
          }

        }
      }
    }
    //then do the parent reading itself if it has genuine readings
    if (fosilised_reading.witnesses.length > 0) {
      doMakeStandoffReading(type, apparatus, unit, reading, parent); //this includes call to lose_subreadings
    } else {
      SR.loseSubreadings();
    }
    //			console.log('++++++++++++++++++++++++ about to find subreadings')
    /*
     * NB: running SR.findSubreadings actually makes the standoff marked reading a real subreading in
     * the display and is a required step even if it is to be hidden again immediately afterwards
     */
    SR.findSubreadings({
      'unit_id': unit._id
    });
    //			console.log('RESULT OF _FIND_SUBREADINGS BELOW')
    //			console.log(JSON.parse(JSON.stringify(CL.data)))
    //			console.log('++++++++++++++++++++++++ about to lose subreadings')
    SR.loseSubreadings();
    //			console.log('RESULT OF _LOSE_SUBREADINGS BELOW')
    //			console.log(JSON.parse(JSON.stringify(CL.data)))
    //now check that we don't have any shared readings (need to prepare and unprepare for this)
    SV.prepareForOperation({
      'app_id': apparatus,
      'unit_id': unit._id
    });
    //			console.log('now we have prepared')
    //			console.log(JSON.parse(JSON.stringify(CL.data)))
    SV.unsplitUnitWitnesses(reading_details.unit_pos, 'apparatus');
    //			console.log('now we have unsplit')
    //			console.log(JSON.parse(JSON.stringify(CL.data)))
    SV.unprepareForOperation();
    //			console.log('now we have sorted out shared readings')
    //			console.log(JSON.parse(JSON.stringify(CL.data)))

  };

  //at this point the reading is *always* a main reading never a subreading
  doMakeStandoffReading = function(type, apparatus, unit, reading, parent) {
    var key, i, rule_details, reading_text, details, existing_standoff, position, total, temp, type_string;
    SR.loseSubreadings(); //needs to be done so the main reading we are dealing with contains *all* witnesses including those of subreadings
    rule_details = getRuleClasses('value', type, 'value', ['suffixed_sigla', 'identifier', 'name', 'subreading', 'suffixed_label']);
    //mark it as a standoff reading
    for (i = 0; i < reading.witnesses.length; i += 1) {
      //we must find reading_text value in this loop as we need witness for extracting any regulariser created subreading text
      reading_text = extractWitnessText(reading, {
        'witness': reading.witnesses[i],
        'reading_type': 'subreading'
      }); //adding true to extract_witness_text call will print debugging to console
      /* subreadings accumulate decision classes so...
       *  if we already have this witness in our marked with the same type label and unit start and end then replace the stored data
       *  if we have it with a different type label but the same start and end then merge the data
       *  */
      existing_standoff = _findStandoffWitness(reading.witnesses[i], unit.start, unit.end, unit.first_word_index);
      if (existing_standoff !== null) {
        //then we need to merge the data this will occur if we have applied a standoff to a parent that already has standoff children!
        details = existing_standoff[0];
        //Now check if we have already recorded the first_word_index and if not record it now
        if (!details.hasOwnProperty('first_word_index')) {
          details.first_word_index = unit.first_word_index;
        }
        //first of all add the current parent reading to the history - do this before you change the parent!
        if (details.hasOwnProperty('reading_history')) {
          details.reading_history.push(details.parent_text);
        } else { // if we don't have a reading history (this will be for legacy data only) we will need to hash one together!
          details.reading_history = [details.reading_text, details.parent_text];
        }
        type_string = existing_standoff[1] + '|' + type;
        details.parent_text = extractWitnessText(parent, {
          'app_id': apparatus,
          'unit_id': unit._id
        });
        details.identifier.push(rule_details[Object.keys(rule_details)[0]][1]);
        details.suffixed_sigla.push(rule_details[Object.keys(rule_details)[0]][0]);
        details.suffixed_label.push(rule_details[Object.keys(rule_details)[0]][4]);
        details.subreading.push(rule_details[Object.keys(rule_details)[0]][3]);
        details.name.push(rule_details[Object.keys(rule_details)[0]][2]);
        details.value = type_string;
        if (parent.text.length === 0 && parent.hasOwnProperty('details')) {
          details.om_details = parent.details;
        }
        if (reading.text.length > 0 && reading.text[reading.text.length - 1].hasOwnProperty('combined_gap_after')) {
          details.combined_gap_after = true;
        }
        if (reading.text.length > 0 && reading.text[0].hasOwnProperty('combined_gap_before')) {
          details.combined_gap_before = true;
          if (reading.text[0].hasOwnProperty('combined_gap_before_details')) {
            details.combined_gap_before_details = reading.text[0].combined_gap_before_details;
          }
        }
        if (!CL.data.marked_readings.hasOwnProperty(type_string)) {
          CL.data.marked_readings[type_string] = [];
        }
        CL.data.marked_readings[type_string].push(details);
        //					}
      } else {
        //this is a completely new subreading so make a new one
        //DAVID broken 11:23 here regularising an om to a lac
        if (!CL.data.marked_readings.hasOwnProperty(type)) {
          CL.data.marked_readings[type] = [];
        }
        details = {
          'start': unit.start,
          'end': unit.end,
          'unit_id': unit._id,
          'first_word_index': unit.first_word_index,
          'witness': reading.witnesses[i],
          'apparatus': apparatus,
          'reading_text': reading_text,
          'parent_text': extractWitnessText(parent, {
            'app_id': apparatus,
            'unit_id': unit._id
          }),
          'identifier': [rule_details[Object.keys(rule_details)[0]][1]],
          'suffixed_sigla': [rule_details[Object.keys(rule_details)[0]][0]],
          'suffixed_label': [rule_details[Object.keys(rule_details)[0]][4]],
          'reading_history': [reading_text],
          'value': type,
          'subreading': [rule_details[Object.keys(rule_details)[0]][3]],
          'name': [rule_details[Object.keys(rule_details)[0]][2]],
        };
        if (parent.text.length === 0 && parent.hasOwnProperty('details')) {
          details.om_details = parent.details;
        }
        if (reading.text.length === 0 && reading.hasOwnProperty('details')) {
          details.details = reading.details;
        }
        if (reading.text.length === 0 && reading.hasOwnProperty('type')) {
          details.type = reading.type;
        }
        if (reading.text.length > 0 && reading.text[reading.text.length - 1].hasOwnProperty('combined_gap_after')) {
          details.combined_gap_after = true;
        }
        if (reading.text.length > 0 && reading.text[0].hasOwnProperty('combined_gap_before')) {
          details.combined_gap_before = true;
          if (reading.text[0].hasOwnProperty('combined_gap_before_details')) {
            details.combined_gap_before_details = reading.text[0].combined_gap_before_details;
          }
        }
        CL.data.marked_readings[type].push(details);
      }
    }
  };

  makeMainReading = function(unit, parent, subtype, subreading_pos, options) {
    var unit_number, parent_reading, parent_pos, app_id, subreading, text, witnesses,
      i, j, k, interface_word_list, key, new_reading, parent_id, delete_subreading,
      new_readings, ids;
    if (typeof options === 'undefined') {
      options = {};
    }
    parent_pos = _findReadingPosById(unit, parent._id);
    subreading = parent.subreadings[subtype][subreading_pos];

    if (typeof options.witnesses !== 'undefined') {
      witnesses = options.witnesses;
    } else {
      witnesses = subreading.witnesses;
    }
    text = JSON.parse(JSON.stringify(subreading.text)); //copy because we need them independent
    if (witnesses.length !== subreading.witnesses.length) {
      //we are now working on the subreading we are leaving behind
      //we are making fewer witnesses into a main reading than there are witnesses (if they are the same we can leave them)
      //so we need to remove witnesses from subreading.text (and not delete the subreading at the end)
      delete_subreading = false;
      for (i = 0; i < witnesses.length; i += 1) {
        subreading.witnesses.splice(subreading.witnesses.indexOf(witnesses[i]), 1);
        for (j = 0; j < subreading.text.length; j += 1) {
          subreading.text[j].reading.splice(subreading.text[j].reading.indexOf(witnesses[i]), 1);
          if (subreading.text[j].hasOwnProperty(witnesses[i])) {
            delete subreading.text[j][witnesses[i]];
          }
        }
      }
    } else {
      //we are dealing with all witnesses to this subreading so we want to delete the subreading when
      //we get to the end
      delete_subreading = true;
    }

    //now we need to remove all not selected witnesses from the text info for the new reading we are creating
    //this needs to be done per witness just for safety
    //TODO: make this more efficient by combining entries as you go?
    new_readings = [];
    for (j = 0; j < witnesses.length; j += 1) {
      new_reading = {
        'witnesses': [witnesses[j]],
        'text': JSON.parse(JSON.stringify(text))
      };
      if (subreading.hasOwnProperty('type')) {
        new_reading.type = subreading.type;
      }
      if (subreading.hasOwnProperty('details')) {
        new_reading.details = subreading.details;
      }
      for (i = 0; i < new_reading.text.length; i += 1) {
        if (new_reading.text[i].hasOwnProperty(witnesses[j]) && new_reading.text[i][witnesses[j]].hasOwnProperty('decision_details')) { //all witness selected will have the same subreading by now even if they have been created via different routes because they are showing as subreadings
          new_reading.text[i]['interface'] = new_reading.text[i][witnesses[j]].decision_details[0].t;
        } else if (new_reading.text[i].hasOwnProperty('t')) {
          new_reading.text[i]['interface'] = new_reading.text[i].t;
        } else {
          if (new_reading.text[i].hasOwnProperty([witnesses[j]]) && typeof(new_reading.text[i][witnesses[j]]['interface']) !== 'undefined') { //ALERT: this line used to say witnesses.legnth === 1 need to be sure that  multiple witnesses always have the same value????
            new_reading.text[i]['interface'] = new_reading.text[i][witnesses[j]]['interface'];
          } else {
            new_reading.text[i]['interface'] = new_reading.text[i]['interface'];
          }
        }
        //delete decisions if there are any
        if (new_reading.text[i].hasOwnProperty(witnesses[j])) {
          delete new_reading.text[i][witnesses[j]].decision_class;
          delete new_reading.text[i][witnesses[j]].decision_details;
        }
        for (k = 0; k < new_reading.text[i].reading.length; k += 1) {
          if (new_reading.text[i].reading[k] !== witnesses[j]) {
            if (new_reading.text[i].hasOwnProperty(new_reading.text[i].reading[k])) {
              delete new_reading.text[i][new_reading.text[i].reading[k]];
            }
            new_reading.text[i].reading[k] = null;
          }
        }
        removeNullItems(new_reading.text[i].reading);
      }
      //note that the information is stored in different places depending on whether this is a standoff subreading or one created in the regulariser (this is not
      //especially sensible but it is how it is at present and working with it is easier and less dangerous than trying to change it!) In version 2 I would fix this!
      if (parent.text.length > 0 && parent.text[0].hasOwnProperty('combined_gap_before') && parent.text[0].combined_gap_before.indexOf(witnesses[j]) !== -1) {
        new_reading.text[0].combined_gap_before = [witnesses[j]];
        new_reading.text[0].combined_gap_before_details = parent.text[0].combined_gap_before_details;
        //now remove the details for this witness from the parent
        parent.text[0].combined_gap_before.splice(parent.text[0].combined_gap_before.indexOf(witnesses[j]), 1);
        //we do not need to remove the details here because it is a simple string (because this only happens when they all read the same)
      }
      if (parent.hasOwnProperty('combined_gap_before_subreadings') && parent.combined_gap_before_subreadings.indexOf(witnesses[j]) !== -1) {
        new_reading.text[0].combined_gap_before = [witnesses[j]];
        new_reading.text[0].combined_gap_before_details = parent.combined_gap_before_subreadings_details[witnesses[j]];
        //now remove the details for this witness from the parent
        parent.combined_gap_before_subreadings.splice(parent.combined_gap_before_subreadings.indexOf(witnesses[j]), 1);
        delete parent.combined_gap_before_subreadings_details[witnesses[j]];
      }
      //repeat for combined gap after - note that there are not details stored for this because they are always available from the reading details of the particular MS
      //also note that the information is stored in different places depending on whether this is a standoff subreading or one created in the regulariser (this is not
      //especially sensible but it is how it is at present and working with it is easier and less dangerous than trying to change it!) In version 2 I would fix this!
      if (parent.text.length > 0 && parent.text[parent.text.length - 1].hasOwnProperty('combined_gap_after') && parent.text[parent.text.length - 1].combined_gap_after.indexOf(witnesses[j]) !== -1) {
        new_reading.text[text.length - 1].combined_gap_after = [witnesses[j]];
        parent.text[parent.text.length - 1].combined_gap_after.splice(parent.text[parent.text.length - 1].combined_gap_after.indexOf(witnesses[j]), 1);
      }
      if (parent.hasOwnProperty('combined_gap_after_subreadings') && parent.combined_gap_after_subreadings.indexOf(witnesses[j]) !== -1) {
        new_reading.text[text.length - 1].combined_gap_after = [witnesses[j]];
        //now remove the details for this witness from the parent
        parent.combined_gap_after_subreadings.splice(parent.combined_gap_after_subreadings.indexOf(witnesses[j]), 1);
      }
      //remove witnesses from SR_text in parent (if present)
      if (parent.hasOwnProperty('SR_text') && parent.SR_text.hasOwnProperty(witnesses[j])) {
        delete parent.SR_text[witnesses[j]];
      }
      //remove witnesses from standoff_subreadings in parent (if present)
      if (parent.hasOwnProperty('standoff_subreadings') && parent.standoff_subreadings.indexOf(witnesses[j]) !== -1) {
        parent.standoff_subreadings.splice(parent.standoff_subreadings.indexOf(witnesses[j]), 1);
      }
      new_readings.push(new_reading);
    }
    //check whether the parent has any empty combined gap infomation which needs removing
    if (parent.hasOwnProperty('combined_gap_before_subreadings') && parent.combined_gap_before_subreadings.length === 0) {
      delete parent.combined_gap_before_subreadings;
      delete parent.combined_gap_before_subreadings_details;
    }
    if (parent.text.length > 0 && parent.text[0].hasOwnProperty('combined_gap_before') && parent.text[0].combined_gap_before.length === 0) {
      delete parent.text[0].combined_gap_before;
      delete parent.text[0].combined_gap_before_details;
    }
    if (parent.hasOwnProperty('combined_gap_after_subreadings') && parent.combined_gap_after_subreadings.length === 0) {
      delete parent.combined_gap_after_subreadings;
    }
    if (parent.text.length > 0 && parent.text[parent.text.length - 1].hasOwnProperty('combined_gap_after') && parent.text[parent.text.length - 1].combined_gap_after.length === 0) {
      delete parent.text[parent.text.length - 1].combined_gap_after;
    }
    if (parent.hasOwnProperty('SR_text') && $.isEmptyObject(parent.SR_text)) {
      delete parent.SR_text;
    }
    if (parent.hasOwnProperty('standoff_subreadings') && parent.standoff_subreadings.length === 0) {
      delete parent.standoff_subreadings;
    }
    //check here to see if parent still needs its combined gap before.
    SV.checkCombinedGapFlags(parent);
    ids = [];
    for (i = 0; i < new_readings.length; i += 1) {
      unit.readings.splice(parent_pos + 1, 0, new_readings[i]);
      ids.push(addReadingId(unit.readings[parent_pos + 1], unit.start, unit.end));
    }
    if (delete_subreading) {
      parent.subreadings[subtype].splice(subreading_pos, 1);
    }

    if (parent.subreadings[subtype].length === 0) {
      delete parent.subreadings[subtype];
    }
    if ($.isEmptyObject(parent.subreadings)) {
      delete parent.subreadings;
    }

    //now check the parent is still required and if not remove it
    if (parent.witnesses.length === 0 && !parent.hasOwnProperty('subreadings')) {
      unit.readings.splice(parent_pos, 1);
    }
    //now if this was a standoff marked reading delete the entry in marked_readings unless this is part of prepare_for_operation
    if (options.hasOwnProperty('delete_offset') && options.delete_offset === true) {
      for (key in CL.data.marked_readings) {
        if (CL.data.marked_readings.hasOwnProperty(key)) {
          for (i = 0; i < CL.data.marked_readings[key].length; i += 1) {
            if (CL.data.marked_readings[key][i].start === unit.start && //needs to use unit id
                CL.data.marked_readings[key][i].end === unit.end) { //if this is the right unit
              if (witnesses.indexOf(CL.data.marked_readings[key][i].witness) !== -1) { //and we have the right witness
                CL.data.marked_readings[key][i] = null;
              }
            }
          }
          CL.data.marked_readings[key] = removeNullItems(CL.data.marked_readings[key]);
          if (CL.data.marked_readings[key].length === 0) {
            delete CL.data.marked_readings[key];
          }
        }
      }
    }
    return ids;
  };

  getOrderedAppLines = function() {
    var key, numbers, i, app_ids;
    numbers = [];
    app_ids = [];
    for (key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.match(/apparatus\d/g) !== null) {
          numbers.push(parseInt(key.replace('apparatus', '')));
        }
      }
    }
    numbers.sort();
    for (i = 0; i < numbers.length; i += 1) {
      app_ids.push('apparatus' + numbers[i]);
    }
    return app_ids;
  };

  /* Menu Loading */
  //optionally called by initialise editor in services if they want to set up the page using js
  //alternatively services can control this themselves but instead must call addIndexHandlers in the initialisation function
  loadIndexPage = function(project) {
    var url;
    url = staticUrl;
    if (_contextInput) {
      url += _contextInput.form;
    }
    $.get(url, function(html) {
      CL.container.innerHTML = html;
      document.getElementById('project_name').innerHTML = CL.project.name;
      if (_contextInput && _contextInput.hasOwnProperty('onload_function')) {
        CL.run_function(_contextInput.onload_function, [CL.project]);
      } else {
        //run the default function to populate hideen form elements
        _contextInputOnload(project);
      }
      var footer;

      footer = [];

      if (CL.services.hasOwnProperty('switchProject')) {
        footer.push('<input class="pure-button left_foot" type="button" id="switch_project_button" value="Switch project" />');
      }
      if (CL.services.hasOwnProperty('viewProjectSummary')) {
        footer.push('<input class="pure-button right_foot" type="button" id="project_summary" value="View Project Page"/>');
      }

      footer.push('<input class="pure-button right_foot" id="collation_settings" type="button" value="Change Collation Settings"/>');

      document.getElementById('footer').innerHTML = footer.join('');
      addIndexHandlers();
    });
  };

  addIndexHandlers = function() {
    if (document.getElementById('switch_project_button') && CL.services.hasOwnProperty('switchProject')) {
      CL.services.switchProject();
    }
    if (document.getElementById('collation_settings')) {
      $('#collation_settings').off('click.show_collation_settings');
      $('#collation_settings').on('click.show_collation_settings', _showCollationSettings);
    }
    if (document.getElementById('project_summary')) {
      CL.services.viewProjectSummary();
    }
    if (document.getElementById('collate')) {
      $('#collate').off('click.run_collation');
      $('#collate').on('click.run_collation', function() {
        if (document.getElementById('settings')) {
          document.getElementById('settings').parentNode.removeChild(document.getElementById('settings'));
        }
        _prepareCollation(_displayMode);
      });
    } else {
      //TODO: better error message - add others too?
      console.error('The collation editor requires a button with the id \'collate\' in order to work. This button is missing from this page.');
    }
    if (document.getElementById('load_saved')) {
      $('#load_saved').off('click.find_saved');
      $('#load_saved').on('click.find_saved', function () {
        if (document.getElementById('settings')) {
          document.getElementById('settings').parentNode.removeChild(document.getElementById('settings'));
        }
        _findSaved();
      });
    }
  };

  getHandsAndSigla = function () {
    var details, key;
    details = [];
    for (key in CL.data.hand_id_map) {
      if (CL.data.hand_id_map.hasOwnProperty(key)) {
        details.push({'hand': key.replace('_private', ' (private)'), 'document': CL.data.hand_id_map[key]+ '|' + key});
      }
    }
    details = sortWitnesses(details);
    return details;
  };

  createNewReading = function (unit, reading_type, extra_details) {
    var i, new_reading, text, orig_reading_details, reading_details, index, id, timestamp, joining_mode, joined;
    //check it's not already a reading and if it is just return the id of that reading
    for (i = 0; i < unit.readings.length; i += 1) {
      if (reading_type === 'om' && extractWitnessText(unit.readings[i]) === 'om.') {
        return unit.readings[i]._id;
      }
      if (extractWitnessText(unit.readings[i]) === extra_details) {
        return unit.readings[i]._id;
      }
      if (extractWitnessText(unit.readings[i]) === '&lt;' + extra_details + '&gt;') {
        return unit.readings[i]._id;
      }
    }
    //if its not already a reading you can add one
    timestamp = new Date().getTime(); //timestamp ensures the MD5 is unique (but is probably overkill)
    if (reading_type === 'om') {
      id = MD5(unit.start + unit.end + 'om.' + timestamp);
      new_reading = {'_id': id, 'created': true, 'text': [], 'witnesses': [], 'type': 'om'};
    } else if (reading_type === 'gap') {
      id = MD5(unit.start + unit.end + extra_details + timestamp);
      new_reading = {'_id': id, 'created': true, 'text': [], 'witnesses': [], 'type': 'lac', 'details': extra_details};
    } else if (reading_type === 'other') {
      //readings created here will always be fake (i.e. not be the reading of any witness.
      //we cannot deal with gaps using gap_after because we have no 'witness' to this reading before the current unit as we are making the reading up
      //even so it is probably best that the gap counts as a single token so we will rejoin anything between < and > into a single token.
      //I think that is the best we can do with these fake readings
      text = [];
      orig_reading_details = extra_details.split(' ');
      reading_details = [];
      joined = [];
      joining_mode = false;
      //because someone might have legitimitely types spaces inside <> to do something like <lac 1 char> we need to reunify these
      for (i = 0; i < orig_reading_details.length; i += 1) {
        if (!joining_mode && orig_reading_details[i].indexOf('&lt;') !== -1 && orig_reading_details[i].indexOf('&gt;') === -1) {
          joining_mode = true;
          joined.push(orig_reading_details[i]);
        } else if (joining_mode) {
          joined.push(orig_reading_details[i]);
          if (orig_reading_details[i].indexOf('&gt;') !== -1) {
            reading_details.push(joined.join(' '));
            joining_mode = false;
            joined = [];
          }
        } else {
          reading_details.push(orig_reading_details[i]);
        }
      }
      //just check we don't still have any in the joined stack
      if (joined.length > 0) {
        reading_details.push(joined.join(' '));
      }
      //reading_details = orig_reading_details;
      id = MD5(unit.start + unit.end + extra_details + timestamp);
      for (i = 0; i < reading_details.length; i += 1) {
        index = i*2;
        text.push({'index': index.toString(),'interface': reading_details[i], 'reading': []});
      }
      new_reading = {'_id': id, 'created': true, 'text': text, 'witnesses': []};
    }
    unit.readings.push(new_reading);
    return new_reading._id;
  };

  //data is a reading object
  getReadingWitnesses = function(data, app_id, start, end, first_word_index, with_suffixes) {
    var i, j, k, witness, suffix, witnesses, key, suffix_types, has_versions;
    witnesses = [];
    for (i = 0; i < data.witnesses.length; i += 1) {
      witness = data.witnesses[i];
      suffix = '';
      if (with_suffixes !== false) {
        //then we do want to have the rule suffixes not just the hands
        //get all the rules that require a suffixed_sigla
        suffix_types = getRuleClasses('suffixed_sigla', true, 'value', 'identifier');
        //I don't think this if statement is ever used - but I'm not confident enough to delete it
        //TODO: comment this out and see if anything breaks!
        if (data.hasOwnProperty('reading_classes')) {
          for (key in suffix_types) {
            if (suffix_types.hasOwnProperty(key)) {
              if (data.reading_classes.indexOf(key) !== -1 && suffix.indexOf(suffix_types[key]) === -1) {
                suffix += suffix_types[key];
              }
            }
          }
        }
        for (j = 0; j < data.text.length; j += 1) {
          for (key in suffix_types) {
            if (suffix_types.hasOwnProperty(key)) {
              if (data.text[j][witness] && data.text[j][witness].hasOwnProperty('decision_class') &&
                data.text[j][witness].decision_class.indexOf(key) !== -1) {
                if (suffix.indexOf(suffix_types[key]) === -1) {
                  suffix += suffix_types[key];
                }
              }
            }
          }
        }
        //now check offset marked readings (i.e created in SV or OR)
        //this needs to check the id of the unit (which we don't have at this point) is the same as the marked reading unit_id property
        if (typeof start !== 'undefined' && typeof end !== 'undefined' && typeof app_id !== 'undefined') {
          for (key in CL.data.marked_readings) {
            for (j = 0; j < CL.data.marked_readings[key].length; j += 1) {
              if (CL.data.marked_readings[key][j].start === start &&
                CL.data.marked_readings[key][j].end === end &&
                CL.data.marked_readings[key][j].apparatus === app_id &&
                CL.data.marked_readings[key][j].witness === witness) {
                if (CL.data.marked_readings[key][j].hasOwnProperty('first_word_index')) {
                  if (CL.data.marked_readings[key][j].first_word_index === first_word_index) {
                    for (k = 0; k < CL.data.marked_readings[key][j].suffixed_sigla.length; k += 1) {
                      if (CL.data.marked_readings[key][j].suffixed_sigla[k] === true) {
                        if (suffix.indexOf(CL.data.marked_readings[key][j].identifier[k]) === -1) {
                          suffix += CL.data.marked_readings[key][j].identifier[k];
                        }
                      }
                    }
                  }
                } else {
                  for (k = 0; k < CL.data.marked_readings[key][j].suffixed_sigla.length; k += 1) {
                    if (CL.data.marked_readings[key][j].suffixed_sigla[k] === true) {
                      if (suffix.indexOf(CL.data.marked_readings[key][j].identifier[k]) === -1) {
                        suffix += CL.data.marked_readings[key][j].identifier[k];
                      }
                    }
                  }
                }
              }
            }
          }
        }
        //now if we have an auto V rule for supplied text on the project add those
        if (CL.project.hasOwnProperty('useVForSupplied') && CL.project.useVForSupplied === true) {
          for (j = 0; j < data.text.length; j += 1) {
            //check the main reading
            if (data.text[j][witness] && data.text[j][witness].hasOwnProperty('supplied')) {
              if (suffix.indexOf('V') === -1) {
                suffix += 'V';
              }
            }
          }
          if (data.hasOwnProperty('SR_text') && data.SR_text.hasOwnProperty(witness)) {
            for (j = 0; j < data.SR_text[witness].text.length; j += 1) {
              if (data.SR_text[witness].text[j][witness] && data.SR_text[witness].text[j][witness].hasOwnProperty('supplied')) {
                if (suffix.indexOf('V') === -1) {
                  suffix += 'V';
                }
              }
            }
          }
        }
      }
      witnesses.push(witness + suffix);
    }
    witnesses = sortWitnesses(witnesses);
    return witnesses;
  };



  //pub-e




  //*********  private functions *********

  _initialiseEditor = function() {
    CL.container = document.getElementById('container'); //can be overridden in services if needed
    //set the dynamic screen resize
    expandFillPageClients();
    $(window).resize(function() {
      expandFillPageClients();
    });
    if (!CL.services.hasOwnProperty('localJavascript')) {
      CL.services.localJavascript = [];
    }
    _includeJavascript(CL.services.localJavascript, function() {
      CL.services.getCurrentEditingProject(_initialiseProject);
    });
    if (document.getElementById('tool_tip') === null) {
      $('body').append($('<div id="tool_tip" class="tooltip"></div>'));
    }
  };

  _initialiseProject = function(project) {
    var local_js, i;
    _setProjectConfig(project);
    local_js = [];
    //TODO: this is untested as we don't currently specify js in any projects
    //TOTEST: this
    if (project.hasOwnProperty('local_js_file')) {
      for (i = 0; i < project.local_js_file.length; i += 1) {
        local_js.push(staticUrl + project.local_js_file[i]);
      }
    }
    _includeJavascript(local_js, function() {
      CL.services.initialiseEditor();
      //TODO: add standard event handlers
      //add standard event handlers?
      //call services initialise
    });
  };

  _setProjectConfig = function(project) {
    CL.project = {};

    //TODO DEPRECATE _id (for id) and project (for name) in future release
    if (project.hasOwnProperty('_id')) {
      CL.project.id = project._id;
      console.warn('The use of \'_id\' in project is deprecated. \'id\' should be used instead.');
    } else if (project.hasOwnProperty('id')) {
      CL.project.id = project.id;
    }
    if (project.hasOwnProperty('project')) {
      CL.project.name = project.project;
      console.warn('The use of \'project\' in project is deprecated. \'name\' should be used instead.');
    } else if (project.hasOwnProperty('name')) {
      CL.project.name = project.name;
    }
    //end deprecation
    if (project.hasOwnProperty('book_name')) {
      CL.project.book_name = project.book_name;
    }
    if (project.hasOwnProperty('witnessSort')) {
      CL.project.witnessSort = project.witnessSort;
    }
    if (project.hasOwnProperty('preStageChecks')) {
      CL.project.preStageChecks = project.preStageChecks;
    }
    if (project.hasOwnProperty('approvalSettings')) {
      CL.project.approvalSettings = project.approvalSettings;
    }
    if (project.hasOwnProperty('exporterSettings')) {
      CL.project.exporterSettings = project.exporterSettings;
    }
    if (project.hasOwnProperty('extraFooterButtons')) {
      CL.project.extraFooterButtons = project.extraFooterButtons;
    }
    if (project.hasOwnProperty('useVForSupplied')) {
      CL.project.useVForSupplied = project.useVForSupplied;
    }
    //this bit does the index page settings.
    //If the services want to do their own thing regarding forms (like Django)
    //then CL.services.contextInput or relevant subsections should be null
    if (project.hasOwnProperty('contextInput')) {
      _contextInput = project.contextInput;
    } else if (CL.services.hasOwnProperty('contextInput')) {
      _contextInput = CL.services.contextInput;
    } else {
      //use defaults
      _contextInput = {
        'form': 'CE_core/html_fragments/default_index_input.html'
      };
    }
    _setRuleClasses(project);
    _setDisplaySettings(project);
    _setLocalPythonFunctions(project);
    _setRuleConditions(project);
    _setOverlappedOptions(project);
  };

  _setRuleClasses = function(project) {
    if (project.hasOwnProperty('ruleClasses') && project.ruleClasses !== undefined) {
      CL.ruleClasses = project.ruleClasses;
    } else if (project.hasOwnProperty('regularisation_classes') && project.regularisation_classes !== undefined) {
      //a temporary thing while we sort out names of settings!!
      CL.ruleClasses = project.regularisation_classes;
    } else if (CL.services && CL.services.hasOwnProperty('ruleClasses')) {
      CL.ruleClasses = CL.services.ruleClasses;
    } else {
      CL.ruleClasses = DEF.ruleClasses;
    }
  };

  _setDisplaySettings = function(project) {
    //default is used as a base line for new verses/collations
    //as the other will change during the editing process
    _defaultDisplaySettings = {};
    CL.displaySettings = {};
    //use project settings if there are some
    if (project && project.hasOwnProperty('displaySettings')) {
      CL.displaySettingsDetails = JSON.parse(JSON.stringify(project.displaySettings));
      for (let i = 0; i < project.displaySettings.configs.length; i += 1) {
        _defaultDisplaySettings[project.displaySettings.configs[i].id] = project.displaySettings.configs[i].check_by_default;
        CL.displaySettings[project.displaySettings.configs[i].id] = project.displaySettings.configs[i].check_by_default;
      }
    } else if (CL.services.hasOwnProperty('displaySettings')) {
      //else use the services settings
      CL.displaySettingsDetails = JSON.parse(JSON.stringify(CL.services.displaySettings));
      for (let i = 0; i < CL.services.displaySettings.configs.length; i += 1) {
        _defaultDisplaySettings[CL.services.displaySettings.configs[i].id] = CL.services.displaySettings.configs[i].check_by_default;
        CL.displaySettings[CL.services.displaySettings.configs[i].id] = CL.services.displaySettings.configs[i].check_by_default;
      }
    } else {
      //else use the basic defaults
      CL.displaySettingsDetails = JSON.parse(JSON.stringify(DEF.displaySettings));
      for (let i = 0; i < DEF.displaySettings.configs.length; i += 1) {
        _defaultDisplaySettings[DEF.displaySettings.configs[i].id] = DEF.displaySettings.configs[i].check_by_default;
        CL.displaySettings[DEF.displaySettings.configs[i].id] = DEF.displaySettings.configs[i].check_by_default;
      }
    }
  };

  _setLocalPythonFunctions = function(project) {
    if (project.hasOwnProperty('localPythonImplementations')) {
      CL.localPythonFunctions = project.localPythonImplementations;
    } else if (CL.services.hasOwnProperty('localPythonImplementations')) {
      CL.localPythonFunctions = CL.services.localPythonImplementations;
    }
    //local collation function is set separately but needs adding to local_python_functions here.
    //It is set separately because we do not want to have to add it to all projects
    //that need to override some of the local functions
    if (project.hasOwnProperty('localCollationFunction')) {
      CL.localPythonFunctions.local_collation_function = project.localCollationFunction;
    } else if (CL.services.hasOwnProperty('localCollationFunction')) {
      CL.localPythonFunctions.local_collation_function = CL.services.localCollationFunction;
    }
    //defaults are already in the code
  };

  _setRuleConditions = function(project) {
    if (project.hasOwnProperty('ruleConditions')) {
      CL.ruleConditions = project.ruleConditions;
    } else if (CL.services.hasOwnProperty('ruleConditions')) {
      CL.ruleConditions = CL.services.ruleConditions;
    } else {
      CL.ruleConditions = DEF.ruleConditions;
    }
  };

  _setOverlappedOptions = function(project) {
    if (project.hasOwnProperty('overlappedOptions')) {
      CL.overlappedOptions = project.overlappedOptions;
    } else if (CL.services.hasOwnProperty('overlappedOptions')) {
      CL.overlappedOptions = CL.services.overlappedOptions;
    }
    //there doesn't need to be any so no defaults required
  };


  //recursive function to load a list of js files and then once done run the supplied callback
  _includeJavascript = function(js, callback, i) {
    if (js.length === 0) {
      if (typeof callback !== 'undefined') {
        callback();
      }
      return;
    }
    if (typeof i === 'undefined') {
      i = 0;
    }
    if (i === (js.length - 1)) {
      $.getScript(js[i], callback);
      return;
    } else {
      $.getScript(js[i], function() {
        _includeJavascript(js, callback, ++i);
      });
    }
  };

  _prepareCollation = function(output) {
    var language, base_text, options, context;
    SPN.show_loading_overlay();
    CL.dataSettings.language = document.getElementById('language').value;
    CL.dataSettings.base_text = document.getElementById('base_text').value;
    context = _getContextFromInputForm();
    if (context && base_text !== 'none') {
      CL.context = context;
      CL.dataSettings.witness_list = _getWitnessesFromInputForm();
      CL.debug = _getDebugSetting();
      RG.getCollationData(output, 0);
    }
  };

  /* Initial page load functions */
  _findSaved = function() {
    var context;
    SPN.show_loading_overlay();
    context = _getContextFromInputForm();
    if (context) {
      CL.services.getSavedCollations(context, undefined, function(collations) {
        _showSavedVersions(collations, context);
      });
    } else {
      SPN.remove_loading_overlay();
    }
  };

  _getContextFromInputForm = function() {
    var context;
    if (_contextInput && _contextInput.hasOwnProperty('result_provider')) {
      context = CL.run_function(_contextInput.result_provider);
    } else {
      context = document.getElementById('context').value;
    }
    return context;
  };

  _getWitnessesFromInputForm = function () {
    var witnessList, data;
    if (CL.services.hasOwnProperty('getWitnessesFromInputForm')) {
      return CL.services.getWitnessesFromInputForm();
    } else {
      if (document.getElementById('preselected_witnesses')) {
        return document.getElementById('preselected_witnesses').value.split(',');
      } else {
        //TODO: test this
        witnessList = [];
        data = cforms.serialiseForm('collation_form');
        if (!$.isEmptyObject(data)) {
          for (let key in data) {
            if (data.hasOwnProperty(key)) {
              witnessList.push(key);
            }
          }
          if (witnessList.indexOf(CL.dataSettings.base_text) === -1) {
            witnessList.push(CL.dataSettings.base_text);
          }
        }
        return witnessList;
      }
    }
  };

  _getDebugSetting = function () {
    if (CL.services.hasOwnProperty('getDebugSetting')) {
      return CL.services.getDebugSetting();
    }
    return false;
  };

  _showSavedVersions = function(data, context) {
    var by_user, users, user, i, status, date, minutes, datestring, approved;
    by_user = {};
    users = [];
    if (data.length > 0) {
      for (i = 0; i < data.length; i += 1) {
        if (data[i].hasOwnProperty('_id')) {
          console.warn('\'_id\' is deprecated. Use \'id\' instead.');
          data[i].id = data[i]._id;
        }
        if (data[i].hasOwnProperty('_meta')) {
          console.warn('\'_meta\' is deprecated. Use \'created_time\' and \'last_modified_time\' as keys on collation objects.');
          date = new Date(data[i]._meta._last_modified_time.$date);
        } else if (data[i].hasOwnProperty('last_modified_time') && data[i].last_modified_time !== null) {
          date = new Date(data[i].last_modified_time);
        } else {
          date = new Date(data[i].created_time);
        }
        if (date.getMinutes() < 10) {
          minutes = '0' + date.getMinutes();
        } else {
          minutes = String(date.getMinutes());
        }
        datestring = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + minutes;
        if (data[i].hasOwnProperty('user')) {
          user = data[i].user;
        } else {
          console.warn('In future versions collation objects will be required to have a \'user\' key');
          user = 'unknown';
        }
        if (!by_user.hasOwnProperty(user)) {
          by_user[user] = {};
          users.push(user);
        }
        if (data[i].status === 'regularised') {
          by_user[user].regularised = _getSavedRadio(data[i].id, datestring);
        } else if (data[i].status === 'set') {
          by_user[user].set = _getSavedRadio(data[i].id, datestring);
        } else if (data[i].status === 'ordered') {
          by_user[user].ordered = _getSavedRadio(data[i].id, datestring);
        }
        else if (data[i].status === 'approved') {
          approved = _getSavedRadio(data[i].id, datestring);
        }
      }
    } else {
      document.getElementById('witnesses').innerHTML = '<p>There are no saved collations of this verse</p>';
      SPN.remove_loading_overlay();
    }
    CL.services.getUserInfoByIds(users, function(user_info) {
      if (user_info) {
        var user_names = {};
        for (var k in user_info) {
          if ( user_info[k].hasOwnProperty('name')) {
            user_names[user_info[k].id] = user_info[k].name;
          } else {
            user_names[user_info[k].id] = user_info[k].id;
          }
        }
        _makeSavedCollationTable(by_user, approved, user_names, context);
      } else {
        _makeSavedCollationTable(by_user, approved, undefined, context);
      }
      SPN.remove_loading_overlay();
    });
  };

  _getSavedRadio = function(id, datestring) {
    return '<input type="radio" name="saved_collation" value="' + id + '">' + datestring + '</input>';
  };

  _makeSavedCollationTable = function(by_user, approved, users, context) {
    var html, i, user_map, user, userCount, firstRow;
    html = [];
    html.push('<form id="saved_collation_form">');
    html.push('<table id="saved_collations">');
    html.push('<th>User</th><th>Regularised</th><th>Variants Set</th><th>Ordered</th><th>Approved</th>');
    userCount = Object.keys(by_user).length;
    firstRow = true;
    for (user in by_user) {
      if (by_user.hasOwnProperty(user)) {
        if (users !== undefined) {
          if (users.hasOwnProperty(user)) {
            html.push('<tr><td>' + users[user] + '</td>');
          } else if (users.hasOwnProperty(String(user)) ) {
            html.push('<tr><td>' + users[String(user)] + '</td>');
          } else {
            html.push('<tr><td>' + user + '</td>');
          }
        } else {
          html.push('<tr><td>' + user + '</td>');
        }
        if (by_user[user].hasOwnProperty('regularised')) {
          html.push('<td>' + by_user[user].regularised + '</td>');
        } else {
          html.push('<td></td>');
        }
        if (by_user[user].hasOwnProperty('set')) {
          html.push('<td>' + by_user[user].set + '</td>');
        } else {
          html.push('<td></td>');
        }
        if (by_user[user].hasOwnProperty('ordered')) {
          html.push('<td>' + by_user[user].ordered + '</td>');
        } else {
          html.push('<td></td>');
        }
        if (firstRow === true && approved !== undefined) {
          html.push('<td valign="middle" rowspan="' + userCount +'">' +approved + '</td>');
          firstRow = false;
        }
        html.push('</tr>');
      }
    }
    html.push('</table>');
    html.push('</form>');
    document.getElementById('witnesses').innerHTML = '';
    document.getElementById('saved_collations_div').innerHTML = html.join('');
    document.getElementById('header').innerHTML = getHeaderHtml('Collation', context);
    if (CL.services.hasOwnProperty('showLoginStatus')) {
      CL.services.showLoginStatus();
    }
    document.getElementById('footer').innerHTML = '<input class="pure-button right_foot" id="load_saved_button" type="button" value="Load collation"/>';
    $('#load_saved_button').on('click', function(event) {
      _loadSavedCollation();
    });
  };

  _loadSavedCollation = function(id) {
    var i, value, bk, data, coll_id;
    SPN.show_loading_overlay();
    if (id === undefined) {
      data = cforms.serialiseForm('saved_collation_form');
      coll_id = data.saved_collation;
    } else {
      coll_id = id;
    }
    CL.services.loadSavedCollation(coll_id, function(collation) {
      if (collation) {
        CL.context = collation.context;
        CL.data = collation.structure;
        if (!CL.data.apparatus[0].hasOwnProperty('_id')) {
          addUnitAndReadingIds();
        }
        CL.displaySettings = collation.display_settings;
        CL.dataSettings = collation.data_settings;
        CL.algorithmSettings = collation.algorithm_settings;
        CL.container = document.getElementById('container');
        if (collation.status === 'regularised') {
          RG.showVerseCollation(CL.data, CL.context, CL.container);
        } else if (collation.status === 'set') {
          //if anything that should have an _id attribute doesn't have one then
          //add them
          if (SV.checkIds()[0]) {
            addUnitAndReadingIds();
          }
          SV.checkBugStatus('loaded', 'saved version');
          SV.showSetVariants({
            'container': CL.container
          });
        } else if (collation.status === 'ordered') {
          SR.loseSubreadings();
          SR.findSubreadings({
            'rule_classes': getRuleClasses('subreading', true, 'value', ['identifier', 'subreading'])
          });
          OR.showOrderReadings({
            'container': CL.container
          });
        } else if (collation.status === 'approved') {
          //we do not do lose and find subreading here as all the saved versions are already correct
          //and if we lose them and find them on display we lose the suffixes list we generated
          //that is needed for output
          OR.showApprovedVersion({
            'container': CL.container
          });
        }
      } else {
        SPN.remove_loading_overlay();
      }
    });
  };

  _getSubreadingWitnessData = function(reading, witness) {
    var key, i;
    for (key in reading.subreadings) {
      if (reading.subreadings.hasOwnProperty(key)) {
        for (i = 0; i < reading.subreadings[key].length; i += 1) {
          if (reading.subreadings[key][i].witnesses.indexOf(witness) !== -1) {
            return reading.subreadings[key][i].text;
          }
        }
      }
    }
    return null;
  };

  _findStandoffRegularisationText = function(app_id, unit_id, witness, test) {
    var standoff_record, unit;
    unit = findUnitById(app_id, unit_id);
    if (test) {
      console.log(unit);
    }
    standoff_record = findStandoffRegularisation(unit, witness, app_id, test);
    if (standoff_record === null) {
      return null;
    }
    return standoff_record.parent_text;
  };

  _collapseUnit = function(id, format) {
    var table, rows, i, span, list, items, idno;
    idno = id.replace('toggle_variant_', '');
    if (format === 'table') {
      $('#variant_unit_' + idno).find('TR:gt(1)').addClass('hidden');
    } else {
      $('#variant_unit_' + idno).find('LI:first').removeClass('top');
      $('#variant_unit_' + idno).find('LI:gt(0)').addClass('hidden');
    }
    span = document.getElementById('toggle_variant_' + idno);
    span.innerHTML = '&#9660;';
    $(span).off('click.collapse');
    $(span).on('click.expand', function(event) {
      _expandUnit(event.target.id, format);
      _disableEventPropagation(event);
    });
  };

  _expandUnit = function(id, format) {
    var table, rows, i, span, idno, list, items;
    idno = id.replace('toggle_variant_', '');
    if (format === 'table') {
      $('#variant_unit_' + idno).find('TR').removeClass('hidden');
    } else {
      $('#variant_unit_' + idno).find('LI:first').addClass('top');
      $('#variant_unit_' + idno).find('LI').removeClass('hidden');
    }
    span = document.getElementById('toggle_variant_' + idno);
    span.innerHTML = '&#9650;';
    $(span).off('click.expand');
    $(span).on('click.collapse', function(event) {
      _collapseUnit(event.target.id, format);
      _disableEventPropagation(event);
    });
  };

  _expandAll = function(format) {
    var triangles, i;
    triangles = document.getElementsByClassName('triangle');
    for (i = 0; i < triangles.length; i += 1) {
      _expandUnit(triangles[i].id, format);
    }
    $('#expand_collapse_button').off('click.expand_all');
    $('#expand_collapse_button').on('click.expand_collapse_button', function(event) {
      $(this).text('expand all');
      _collapseAll(format);
    });
    _collapsed = false;
  };

  _collapseAll = function(format) {
    var triangles, i;
    triangles = document.getElementsByClassName('triangle');
    for (i = 0; i < triangles.length; i += 1) {
      _collapseUnit(triangles[i].id, format);
    }
    $('#expand_collapse_button').off('click.collapse_all');
    $('#expand_collapse_button').on('click.expand_all', function(event) {
      $(this).text('collapse all');
      _expandAll(format);
    });
    _collapsed = true;
  };

  /** format - which editor stage are we at
   * options - dict of options
   * 		start - the start point of unit
   * 		end - the end point of unit
   * 		dropable - is it dropable on (mainly for set variants)
   * 		id - used in set variants to allow overlapped readings to be moved between rows*/
  _getEmptyCell = function(format, options) {
    var cell, id_string;
    if (typeof options === 'undefined') {
      options = {};
    }
    switch (format) {
      case 'set_variants':
        if (options.hasOwnProperty('id')) {
          id_string = ' id="' + options.id + '"';
        } else {
          id_string = '';
        }
        if (!options.hasOwnProperty('start') || !options.hasOwnProperty('end')) {
          if (options.hasOwnProperty('dropable') && options.dropable === true) {
            cell = '<td' + id_string + '></td>';
          } else {
            cell = '<td' + id_string + ' class="mark"></td>';
          }
        } else {
          if (options.dropable) {
            cell = '<td' + id_string + ' class="start_' + options.start + '" colspan="' + (options.end - options.start + 1) + '"></td>';
          } else {
            cell = '<td' + id_string + ' class="mark start_' + options.start + '" colspan="' + (options.end - options.start + 1) + '"></td>';
          }
        }
        break;
      case 'reorder':
        if (!options.hasOwnProperty('start') || !options.hasOwnProperty('end')) {
          cell = '<td class="mark"></td>';
        } else {
          cell = '<td class="mark start_' + options.start + '" colspan="' + (options.end - options.start + 1) + '"></td>';
        }
        break;
      default:
        if (!options.hasOwnProperty('start') || !options.hasOwnProperty('end')) {
          cell = '<td></td>';
        } else {
          cell = '<td class="start_' + options.start + '" colspan="' + (options.end - options.start + 1) + '"></td>';
        }
    }
    return cell;
  };

  //merge dictionaries values from dict1 take priority
  _mergeDicts = function(dict1, dict2) {
    var key;
    for (key in dict2) {
      if (dict2.hasOwnProperty(key)) {
        if (!dict1.hasOwnProperty(key)) {
          dict1[key] = dict2[key];
        }
      }
    }
    return dict1;
  };

  _getUnitData = function(data, id, format, start, end, options) {
    var i, html, j, decisions, rows, cells, row_list, temp, events, max_length, row_id,
      type, subrow_id, colspan, hand, text, label, rules, key, reading_label, reading_suffix;
    html = [];
    row_list = [];
    if (options.hasOwnProperty('highlighted_wit')) {
      hand = options.highlighted_wit.split('|')[1];
    } else {
      hand = null;
    }
    rules = getRuleClasses(undefined, undefined, 'value', ['identifier', 'keep_as_main_reading', 'suffixed_label', 'suffixed_reading']);
    for (key in rules) {
      if (rules.hasOwnProperty(key) && rules[key][1] === false) {
        delete rules[key];
      }
    }
    html.push('<td class="mark start_' + start + ' " colspan="' + (end - start + 1) + '">');
    html.push('<table class="variant_unit" id="variant_unit_' + id + '">');
    for (i = 0; i < data.length; i += 1) {
      row_id = 'variant_unit_' + id + '_row_' + i;
      row_list.push(row_id);
      if (i === 0) {
        html.push('<tr><td colspan="3" ><span id="toggle_variant_' + id + '" class="triangle">&#9650;</span></td></tr>');
        if (data[i].witnesses.indexOf(hand) != -1) {
          html.push('<tr id="' + row_id + '" class="top highlighted">');
        } else {
          html.push('<tr id="' + row_id + '" class="top">');
        }
      } else {
        if (data[i].witnesses.indexOf(hand) != -1) {
          html.push('<tr id="' + row_id + '" class="highlighted">');
        } else {
          html.push('<tr id="' + row_id + '">');
        }
      }
      text = extractDisplayText(data[i], i, data.length, options.unit_id, options.app_id);
      if (text.indexOf('system_gen_') !== -1) {
        text = text.replace('system_gen_', '');
      }
      reading_label = getReadingLabel(i, data[i], rules);
      reading_suffix = getReadingSuffix(data[i], rules);

      html.push('<td></td>');
      html.push('<td id="' + row_id + '_label">' + reading_label);
      html.push('</td>');
      html.push('<td class="main_reading">');
      html.push(text);
      if (reading_suffix !== '') {
        html.push(' ' + reading_suffix);
      }
      html.push('</td>');
      html.push('</tr>');
    }
    html.push('</table>');
    html.push('</td>');
    return [html, row_list];
  };

  /*
   * finds the first word of the witness (by finding the first reading of the
   * witness with a length and checking that the index is 2)
   * if that word has a gap_before attribute then return true and the details (as a list)
   * else return false (as a list)
   * */
  _hasGapBefore = function(apparatus, witness) {
    var i, j, reading, key, temp, ol_unit, k;
    //find first word of witness
    for (i = 0; i < apparatus.length; i += 1) {
      for (j = 0; j < apparatus[i].readings.length; j += 1) {
        if (apparatus[i].readings[j] && getAllReadingWitnesses(apparatus[i].readings[j]).indexOf(witness) !== -1) {
          //TODO: this exact code to get reading is repeated in has_gap_after and may also be needed to deal with create extra gaps so might be worth functioning
          reading = getReading(apparatus[i].readings[j], witness);
          //						console.log(reading)
          //This next section is commented out as it makes the om readings in top line get populated by the relevant gap details
          //if the reading is overlapped. Now we are solidifying gaps I think that if they are moved any resulting oms should
          //stay as om - in reality probably this should never happen and of course they can be regularised to something else
          //but I think it is far less confusing to show om instead of having some solid and some elastic gaps in the same situation.
          //						if (reading.hasOwnProperty('overlap_status') && apparatus[i].hasOwnProperty('overlap_units')) {
          //						for (key in apparatus[i].overlap_units) {
          //						if (apparatus[i].overlap_units.hasOwnProperty(key)) {
          //						if (apparatus[i].overlap_units[key].indexOf(witness) !== -1) {
          //						temp = findOverlapUnitById(key);
          //						if (temp !== null) {
          //						ol_unit = temp;
          //						}
          //						for (k = 0; k < ol_unit.readings.length; k += 1) {
          //						if (ol_unit.readings[k].witnesses.indexOf(witness) !== -1) {
          //						reading = getReading(ol_unit.readings[k], witness);
          //						}
          //						}
          //						}
          //						}
          //						}
          //						}
          //						console.log(witness)
          if (reading.text.length !== 0) {
            //							console.log(reading.text[0])
            //this should never happen and means the data needs osme serious work but keeping to keep collaborators happy
            if (!reading.text[0].hasOwnProperty(witness)) {
              console.log('**** Problem witness: ' + witness);
              return[false];
            }
            if (reading.text[0][witness].index === '2') {
              if (reading.hasOwnProperty('combined_gap_before_subreadings') && reading.combined_gap_before_subreadings.hasOwnProperty(witness)) {
                return [false];
              }
              if (reading.text[0][witness].hasOwnProperty('gap_before')) {
                return [true, reading.text[0][witness].gap_before_details];
              }
              return [false];
            }
          }
        }
      }
    }
    return [false];
  };

  _hasGapAfter = function(apparatus, witness, unit) {
    var i, j, k, ol_unit, reading, key, temp;
    for (i = unit - 1; i >= 0; i -= 1) {
      for (j = 0; j < apparatus[i].readings.length; j += 1) {
        if (getAllReadingWitnesses(apparatus[i].readings[j]).indexOf(witness) !== -1) {
          reading = getReading(apparatus[i].readings[j], witness);
          if (reading.hasOwnProperty('overlap_status') && apparatus[i].hasOwnProperty('overlap_units')) {
            for (key in apparatus[i].overlap_units) {
              if (apparatus[i].overlap_units.hasOwnProperty(key)) {
                if (apparatus[i].overlap_units[key].indexOf(witness) !== -1) {
                  temp = findOverlapUnitById(key);
                  if (temp !== null) {
                    ol_unit = temp;
                  }
                  for (k = 0; k < ol_unit.readings.length; k += 1) {
                    if (ol_unit.readings[k].witnesses.indexOf(witness) !== -1) {
                      reading = getReading(ol_unit.readings[k], witness);
                    }
                  }
                }
              }
            }
          }
          if (reading.text.length === 0) {
            if (reading.type === 'lac') {
              return [true, reading.details];
            }
            return [false];
          }
          //this should never happen and means the data needs osme serious work but keeping to keep collaborators happy
          if (!reading.text[reading.text.length - 1].hasOwnProperty(witness)) {
            console.log('**** Problem witness: ' + witness);
            return[false];
          }
          if (reading.text[reading.text.length - 1][witness].hasOwnProperty('gap_after')) {
            return [true, reading.text[reading.text.length - 1][witness].gap_details];
          }
          return [false];
        }
      }
    }
    return [false];
  };

  _getAllEmptyReadingWitnesses = function(reading) {
    var i, j, key, witnesses;
    witnesses = [];
    if (reading.text.length === 0) {
      for (i = 0; i < reading.witnesses.length; i += 1) {
        if ((reading.hasOwnProperty('SR_text') && !reading.SR_text.hasOwnProperty(reading.witnesses[i])) ||
          !reading.hasOwnProperty('SR_text')) {
          if (witnesses.indexOf(reading.witnesses[i]) === -1) {
            witnesses.push(reading.witnesses[i]);
          }
        }
      }
    }
    if (reading.hasOwnProperty('SR_text')) {
      for (key in reading.SR_text) {
        if (reading.SR_text.hasOwnProperty(key)) {
          if (reading.SR_text[key].text.length === 0) {
            if (witnesses.indexOf(key) === -1) {
              witnesses.push(key);
            }
          }
        }
      }
    }
    //don't think this is needed
    if (reading.hasOwnProperty('subreadings')) {
      for (key in reading.subreadings) {
        if (reading.subreadings.hasOwnProperty(key)) {
          for (i = 0; i < reading.subreadings[key].length; i += 1) {
            if (reading.subreadings[key][i].text.length === 0) {
              for (j = 0; j < reading.subreadings[key][i].witnesses.length; j += 1) {
                if (witnesses.indexOf(reading.subreadings[key][i].witnesses[j]) === -1) {
                  witnesses.push(reading.subreadings[key][i].witnesses[j]);
                }
              }
            }
          }
        }
      }
    }
    return witnesses;
  };

  _containsEmptyReading = function(reading) {
    var key, i;
    if (reading.text.length === 0) {
      return true;
    }
    if (reading.hasOwnProperty('subreadings')) {
      for (key in reading.subreadings) {
        if (reading.subreadings.hasOwnProperty(key)) {
          for (i = 0; i < reading.subreadings[key].length; i += 1) {
            if (reading.subreadings[key][i].text.length === 0) {
              return true;
            }
          }
        }
      }
    }
    if (reading.hasOwnProperty('SR_text')) {
      for (key in reading.SR_text) {
        if (reading.SR_text.hasOwnProperty(key)) {
          if (reading.SR_text[key].text.length === 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  _isOverlapped = function(unit, witness) {
    var key;
    if (!unit.hasOwnProperty('overlap_units')) {
      return false;
    }
    for (key in unit.overlap_units) {
      if (unit.overlap_units.hasOwnProperty(key)) {
        if (unit.overlap_units[key].indexOf(witness) !== -1) {
          return true;
        }
      }
    }
    return false;
  };

  _removeLacOmVerseWitnesses = function(all_witnesses) {
    var lac, om, i;
    lac = CL.data.lac_readings;
    om = CL.data.om_readings;
    for (i = 0; i < lac.length; i += 1) {
      if (all_witnesses.indexOf(lac[i]) !== -1) {
        all_witnesses.splice(all_witnesses.indexOf(lac[i]), 1);
      }
    }
    for (i = 0; i < om.length; i += 1) {
      if (all_witnesses.indexOf(om[i]) !== -1) {
        all_witnesses.splice(all_witnesses.indexOf(om[i]), 1);
      }
    }
    return all_witnesses;
  };

  /**
   * Removes units which only contain om/lac readings from the data structure
   *
   * @method clean_extra_gaps
   * */
  _cleanExtraGaps = function() {
    var i;
    for (i = 0; i < CL.data.apparatus.length; i += 1) {
      if (CL.data.apparatus[i].hasOwnProperty('created') && !unitHasText(CL.data.apparatus[i])) {
        CL.data.apparatus[i] = null;
      }
    }
    CL.data.apparatus = removeNullItems(CL.data.apparatus);
  };

  /** returns a copy of the readings (not a pointer) as a single list regardless of how many overlap units there are
   *
   */
  _getOverlapUnitReadings = function(unit) {
    var overlap_readings, key, ol_unit, i;
    overlap_readings = [];
    if (unit.hasOwnProperty('overlap_units')) {
      for (key in unit.overlap_units) {
        if (unit.overlap_units.hasOwnProperty(key)) {
          ol_unit = findOverlapUnitById(key);
          if (ol_unit !== null) {
            for (i = 1; i < ol_unit.readings.length; i += 1) { //start at 1 because we don't care about a reading (its just the base text)
              overlap_readings.push(JSON.parse(JSON.stringify(ol_unit.readings[i])));
            }
          }
        }
      }
    }
    return overlap_readings;
  };

  _checkExtraGapRequiredBefore = function(reading, witness) {
    var subreading;
    if (reading.text.length > 0 && !reading.text[0].hasOwnProperty('combined_gap_before')) {
      if (!reading.hasOwnProperty('combined_gap_before_subreadings') ||
        (reading.hasOwnProperty('combined_gap_before_subreadings') &&
          reading.combined_gap_before_subreadings.indexOf(witness === -1))) {
        if (reading.text.length > 0 &&
          reading.text[0].hasOwnProperty(witness) &&
          reading.text[0][witness].hasOwnProperty('gap_before')) {
          return true;
        }
        if (reading.hasOwnProperty('subreadings') || reading.hasOwnProperty('SR_text')) {
          subreading = getSubreadingOfWitness(reading, witness, true);
          if (subreading && subreading.text.length > 0 &&
            !subreading.text[0].hasOwnProperty('combined_gap_before') &&
            subreading.text[0][witness].hasOwnProperty('gap_before')) {
            return true;
          }
        }
      }
    }
    return false;
  };

  //this is only ever going to be called on the very first unit in the apparatus
  _extraGapRequiredBefore = function(unit) {
    var i, j, k, readings, witnesses, ol_readings;
    readings = unit.readings;
    for (i = 0; i < readings.length; i += 1) {
      witnesses = getAllReadingWitnesses(readings[i]);
      for (j = 0; j < witnesses.length; j += 1) {
        if (!_isOverlapped(unit, witnesses[j])) {
          if (_checkExtraGapRequiredBefore(readings[i], witnesses[j]) === true) {
            return true;
          }
        } else {
          ol_readings = _getOverlapUnitReadings(unit);
          for (k = 0; k < ol_readings.length; k += 1) {
            if (_checkExtraGapRequiredBefore(ol_readings[k], witnesses[j]) === true) {
              return true;
            }
          }
        }
      }
    }
    return false;
  };

  _extraGapRequiredAfter = function(unit_list, unit_pos) {
    var unit, i, j, subreading, witnesses, word_count, readings, overlapped;
    //			if (unit_pos === 0) {
    //			console.log('checking if extra gap needed after')
    //			}
    unit = unit_list[unit_pos];
    readings = unit.readings;
    for (i = 0; i < readings.length; i += 1) {
      witnesses = getAllReadingWitnesses(readings[i]);
      for (j = 0; j < witnesses.length; j += 1) {
        overlapped = _isOverlapped(unit, witnesses[j]);
        //					console.log(overlapped)
        if (!overlapped || //if unit/wit is not overlapped
          (overlapped && unit_pos + 1 >= unit_list.length) || //or it is overlapped and its the last unit in the verse
          (overlapped && !_isOverlapped(unit_list[unit_pos + 1], witnesses[j]))) { //or it is overlapped and the next unit/wit is not overlapped (it represents the last unit of an overlap)
          //						if (unit_pos === 0) {
          //						console.log('still checking')
          //						}
          if (readings[i].text.length > 0 && !readings[i].text[readings[i].text.length - 1].hasOwnProperty('combined_gap_after')) {
            //							if (unit_pos === 0) {
            //							console.log('continuing to check')
            //							}
            if (!readings[i].hasOwnProperty('combined_gap_after_subreadings') ||
              (readings[i].hasOwnProperty('combined_gap_after_subreadings') &&
                readings[i].combined_gap_after_subreadings.indexOf(witnesses[j] === -1))) {
              if (readings[i].text.length > 0 &&
                readings[i].text[readings[i].text.length - 1].hasOwnProperty(witnesses[j]) &&
                readings[i].text[readings[i].text.length - 1][witnesses[j]].hasOwnProperty('gap_after')) {
                if (_combinedGapInNextUnit(unit_list, unit_pos, witnesses[j]) === false) {
                  return true;
                }
              }
              if (readings[i].hasOwnProperty('subreadings') || readings[i].hasOwnProperty('SR_text')) {
                subreading = getSubreadingOfWitness(readings[i], witnesses[j], true);
                if (subreading && subreading.text.length > 0 &&
                  !subreading.text[subreading.text.length - 1].hasOwnProperty('combined_gap_after') &&
                  subreading.text[subreading.text.length - 1][witnesses[j]].hasOwnProperty('gap_after')) {
                  if (_combinedGapInNextUnit(unit_list, unit_pos, witnesses[j]) === false) {
                    return true;
                  }
                }
              }
            }
          }
        }
      }
    }
    return false;
  };

  //returns true if the unit following the position supplied has a combined gap at the beginning.
  //will use overlapped reading if there is on (and check 1st word only)
  //This should not be called in the middle of an overlapped unit
  _combinedGapInNextUnit = function(unit_list, unit_pos, witness) {
    var unit, i, subreading, readings;
    if (unit_pos + 1 < unit_list.length) {
      unit = unit_list[unit_pos + 1];
      if (_isOverlapped(unit, witness)) {
        readings = _getOverlapUnitReadings(unit);
      } else {
        readings = unit.readings;
      }
      for (i = 0; i < readings.length; i += 1) {
        if (readings[i].witnesses.indexOf(witness) !== -1) {
          if (readings[i].hasOwnProperty('combined_gap_before_subreadings') &&
            readings[i].combined_gap_before_subreadings.indexOf(witness) !== -1) {
            return true;
          }
          if (readings[i].text.length > 0 && readings[i].text[0].hasOwnProperty('combined_gap_before')) {
            return true;
          }
          subreading = getSubreadingOfWitness(readings[i], witness, true);
          if (!subreading && readings[i].text.length === 0) {
            return true;
          }
          if (subreading && subreading.text.length === 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  _getNewGapRdgDetails = function(unit, ol_reading) {
    var i, details;
    details = {};
    if (ol_reading.hasOwnProperty('combined_gap_before_subreadings')) {
      details.witnesses = ol_reading.combined_gap_before_subreadings;
      details.details = ol_reading.combined_gap_before_subreadings_details[ol_reading.combined_gap_before_subreadings[0]];
    } else {
      if (ol_reading.text.length > 0 &&
        ol_reading.text[0].hasOwnProperty('combined_gap_before')) {
        details.details = ol_reading.text[0].combined_gap_before_details;
      }
    }
    if (ol_reading.hasOwnProperty('combined_gap_after_subreadings')) {
      details.details = ol_reading.text[ol_reading.text.length - 1][ol_reading.combined_gap_after_subreadings].gap_details;
      details.witnesses = ol_reading.combined_gap_after_subreadings;
    } else {
      if (ol_reading.text.length > 0 &&
        ol_reading.text[ol_reading.text.length - 1].hasOwnProperty('combined_gap_after')) {
        details.details = ol_reading.text[ol_reading.text.length - 1][ol_reading.witnesses[0]].gap_details;
      }
    }
    if (!details.hasOwnProperty('witnesses')) {
      details.witnesses = ol_reading.witnesses;
    }
    for (i = 0; i < unit.readings.length; i += 1) {
      if (unit.readings[i].witnesses.indexOf(details.witnesses[0]) !== -1) {
        if (typeof unit.readings[i].overlap_status !== 'undefined') {
          details.overlap_status = unit.readings[i].overlap_status;
        } else {
          details.overlap_status = 'duplicate';
        }
      }
    }
    if (ol_reading.hasOwnProperty('type')) {
      details.type = ol_reading.type;
    } else {
      details.type = 'om';
    }
    if (ol_reading.hasOwnProperty('details')) {
      details.details = ol_reading.details;
    }
    return details;
  };

  _addExtraGapReadings = function(adjacent_unit, all_witnesses, new_unit, inclusive_overlaps) {
    var lac_wits, om_wits, other_wits, key, ol_unit, i, j, k, new_rdg;
    //the rest of this section is really just adding the readings (and witnesses) to this unit
    lac_wits = JSON.parse(JSON.stringify(CL.data.lac_readings));
    om_wits = JSON.parse(JSON.stringify(CL.data.om_readings));
    other_wits = JSON.parse(JSON.stringify(all_witnesses));
    //if anything marked as overlapped and is empty in the first 'real' unit
    //ALL overlap indexes need adding to this one
    if (adjacent_unit.hasOwnProperty('overlap_units') &&
      overlapHasEmptyReading(adjacent_unit.overlap_units)) {
      for (key in adjacent_unit.overlap_units) {
        if (adjacent_unit.overlap_units.hasOwnProperty(key) &&
          (typeof inclusive_overlaps === 'undefined' ||
            typeof inclusive_overlaps !== 'undefined' &&
            inclusive_overlaps.indexOf(key) !== -1)
        ) {
          ol_unit = findOverlapUnitById(key);
          for (j = 1; j < ol_unit.readings.length; j += 1) {
            new_rdg = JSON.parse(JSON.stringify(_getNewGapRdgDetails(adjacent_unit, ol_unit.readings[j])));
            new_rdg.text = [];
            //remove these readings from the ones we collected earlier (because these ones need separating)
            for (k = 0; k < new_rdg.witnesses.length; k += 1) {
              if (lac_wits.indexOf(new_rdg.witnesses[k]) !== -1) {
                lac_wits.splice(lac_wits.indexOf(new_rdg.witnesses[k]), 1);
                new_rdg.type = 'lac_verse';
                new_rdg.details = 'lac verse';
              }
              if (om_wits.indexOf(new_rdg.witnesses[k]) !== -1) {
                om_wits.splice(om_wits.indexOf(new_rdg.witnesses[k]), 1);
                new_rdg.type = 'om_verse';
                new_rdg.details = 'om verse';
              }
              if (other_wits.indexOf(new_rdg.witnesses[k]) !== -1) {
                other_wits.splice(other_wits.indexOf(new_rdg.witnesses[k]), 1);
              }
            }
            new_unit.readings.push(new_rdg);
          }
        }
      }
      //now add the relevant overlap_units key to the new unit
      if (typeof inclusive_overlaps !== 'undefined') {
        new_unit.overlap_units = {};
        for (i = 0; i < inclusive_overlaps.length; i += 1) {
          new_unit.overlap_units[inclusive_overlaps[i]] = adjacent_unit.overlap_units[inclusive_overlaps[i]];
        }
      } else {
        new_unit.overlap_units = adjacent_unit.overlap_units;
      }

    }
    //add all remaining witnesses (lac_om_fix will sort them out later)
    if (other_wits.length > 0) {
      new_unit.readings.push({
        'witnesses': other_wits,
        'text': []
      });
    }
    //now add your whole verse lac and om witnesses
    if (lac_wits.length > 0) {
      new_unit.readings.push({
        'witnesses': lac_wits,
        'text': [],
        'type': 'lac_verse',
        'details': 'lac verse'
      });
    }
    if (om_wits.length > 0) {
      new_unit.readings.push({
        'witnesses': om_wits,
        'text': [],
        'type': 'om_verse',
        'details': 'om verse'
      });
    }
    addUnitId(new_unit, 'apparatus');
    addReadingIds(new_unit);
    return new_unit;
  };

  _extraGapIsWithinAnOverlap = function(current) {
    var key;
    if (current + 1 < CL.data.apparatus.length && CL.data.apparatus[current + 1].hasOwnProperty('overlap_units')) {
      for (key in CL.data.apparatus[current].overlap_units) {
        if (CL.data.apparatus[current].overlap_units.hasOwnProperty(key) &&
          CL.data.apparatus[current + 1].overlap_units.hasOwnProperty(key)) {
          return true;
        }
      }
    }
    return false;
  };

  _getInclusiveOverlapReadings = function(current) {
    var inclusive_overlaps, key;
    inclusive_overlaps = [];
    if (current + 1 < CL.data.apparatus.length && CL.data.apparatus[current + 1].hasOwnProperty('overlap_units')) {
      for (key in CL.data.apparatus[current].overlap_units) {
        if (CL.data.apparatus[current].overlap_units.hasOwnProperty(key) &&
          CL.data.apparatus[current + 1].overlap_units.hasOwnProperty(key)) {
          inclusive_overlaps.push(key);
        }
      }
    }
    return inclusive_overlaps;
  };

  _getExtraGapLocation = function(prev_unit_end) {
    var new_loc;
    new_loc = {};
    if (prev_unit_end % 2 === 1) {
      new_loc.start = prev_unit_end;
      new_loc.end = prev_unit_end;
      new_loc.first_word_index = prev_unit_end + '.1';
    } else {
      new_loc.start = prev_unit_end + 1;
      new_loc.end = prev_unit_end + 1;
      new_loc.first_word_index = prev_unit_end + 1 + '.1';
    }
    return new_loc;
  };

  _createExtraGaps = function() {
    var apparatus, i, j, k, rdg_witnesses, all_witnesses, key, extras, keys, dict, ol_unit,
      before, after, mid, new_rdg, rdg_details, empty_reading, lac_wits, om_wits, other_wits,
      inclusive_overlaps, temp;
    apparatus = CL.data.apparatus;
    extras = {};
    for (i = 0; i < apparatus.length; i += 1) {
      all_witnesses = _removeLacOmVerseWitnesses(getActiveUnitWitnesses(apparatus[i], 'apparatus'));
      rdg_details = {};
      if (i === 0) { //then we are in the very first unit and if we have gaps before then we must add a unit
        if (_extraGapRequiredBefore(apparatus[i])) {
          //create a new unit
          dict = {
            'start': 1,
            'end': 1,
            'created': true,
            'first_word_index': '1.1',
            'readings': []
          };
          dict = _addExtraGapReadings(apparatus[i], all_witnesses, dict);
          //store the new unit for adding later (so we don't destroy our loop)
          extras['0'] = dict;
        }
      }
      if (_extraGapRequiredAfter(apparatus, i)) {
        if (i === apparatus.length - 1) {
          //this is the very last unit
          dict = {
            'start': apparatus[i].end + 1,
            'end': apparatus[i].end + 1,
            'created': true,
            'first_word_index': apparatus[i].end + 1 + '.' + 1,
            'readings': []
          };
          dict = _addExtraGapReadings(apparatus[i], all_witnesses, dict);
          extras['' + (i + 1)] = dict;
          //8.4.16 - commented out this next section as a fix to bug number 88 but I'm sure it will break something somewhere else so leaving it here for now
          //						} else if (_extraGapIsWithinAnOverlap(i)) {
          //						console.log('branch 2')
          //						inclusive_overlaps = _getInclusiveOverlapReadings(i);
          //						console.log(inclusive_overlaps)
          //						console.log('^^^^')
          //						temp = _getExtraGapLocation(apparatus[i].end);
          //						//if this has any shared overlaps on either side
          //						dict = {'start': temp['start'],
          //						'end': temp['end'],
          //						'created': true,
          //						'first_word_index': temp['first_word_index'],
          //						'readings': []};
          //						console.log(dict)
          //						//this needs to only separate the ones that appear on both sides.
          //						//dict = _addExtraGapReadings(apparatus[i], all_witnesses, dict, inclusive_overlaps);
          //						dict = _addExtraGapReadings(apparatus[i], all_witnesses, dict, undefined);
          //						extras['' + (i+1)] = dict;
        } else {
          //otherwise we have no inclusive overlaps
          temp = _getExtraGapLocation(apparatus[i].end);
          dict = {
            'start': temp.start,
            'end': temp.end,
            'created': true,
            'first_word_index': temp.first_word_index,
            'readings': []
          };
          dict = _addExtraGapReadings(apparatus[i], all_witnesses, dict);
          extras['' + (i + 1)] = dict;
        }
      }
    }
    keys = Object.keys(extras).sort(function(a, b) {
      return b - a;
    });

    for (i = 0; i < keys.length; i += 1) {
      addUnitId(extras[keys[i]]);
      apparatus.splice(parseInt(keys[i]), 0, extras[keys[i]]);
      SV.reindexUnit(extras[keys[i]].start);
      //unsplit was added on 9.3.16 it may cause problems
      SV.unsplitUnitWitnesses(parseInt(keys[i]), 'apparatus');
    }
  };

  _addLacReading = function(extra_readings, witness, gap_details, overlap_status) {
    var i, extra_reading, key;
    for (i = 0; i < extra_readings.length; i += 1) {
      if (extra_readings[i].details === gap_details &&
        ((typeof overlap_status === 'undefined' && !extra_readings[i].hasOwnProperty('overlap_status')) ||
          (typeof overlap_status !== 'undefined' && extra_readings[i].overlap_status === overlap_status))) {
        extra_readings[i].witnesses.push(witness);
        return extra_readings;
      }
    }
    extra_reading = {
      'type': 'lac',
      'details': gap_details,
      'text': [],
      'witnesses': [witness]
    };
    if (typeof overlap_status !== 'undefined') {
      extra_reading.overlap_status = overlap_status;
    }
    extra_readings.push(extra_reading);
    return extra_readings;
  };

  _addNavEvent = function(elemId, collId) {
    $('#' + elemId).on('click', function() {
      _loadSavedCollation(collId);
    });
  };

  _findLatestStageVerse = function(verse) {
    var i, j, levels, found, latest, approved;
    SPN.show_loading_overlay();
    CL.context = verse;
    CL.services.getUserInfo(function(user) {
      if (user) {
        CL.services.getSavedCollations(verse, user.id, function(collations) {
          //now we need to do another call to get any project (not necessarily owned by this user) approved versions
          CL.services.getSavedCollations(verse, undefined, function(approved_ones) {
            //because this will get more than just approved versions we need to check status and only use the approved one
            for (i = 0; i < approved_ones.length; i += 1) {
              if (approved_ones[i].status == 'approved') {
                collations.push(approved_ones[i]);
              }
            }
            levels = ['approved', 'ordered', 'set', 'regularised'];
            approved = false;
            latest = null;
            for (i = 0; i < levels.length; i += 1) {
              found = false;
              for (j = 0; j < collations.length; j += 1) {
                if (collations[j].status === levels[i]) {
                  latest = collations[j];
                  found = true;
                }
              }
              if (found === true) {
                if (levels[i] === 'approved') {
                  approved = true;
                } else {
                  break;
                }
              }
            }
            if (latest === null || latest.status === 'regularised') {
              //then get the data from the repository and replace the exiting stuff (in case we need to recollate from the interface)
              RG.getCollationData('units', 0, function() {
                _loadLatestStageVerse(latest, approved);
              });
            } else {
              //wipe the data we currently have stored just for safety as we should not need it again and do not want old stuff hanging around in memory
              CL.collateData = {};
              _loadLatestStageVerse(latest, approved);
            }
          });
        });
      }
    });
  };

  _loadLatestStageVerse = function(latest, approved) {
    var key;
    SV.undoStack = [];
    OR.undoStack = [];
    if (latest === null) {
      for (key in _defaultDisplaySettings) {
        if (_defaultDisplaySettings.hasOwnProperty(key)) {
          CL.displaySettings[key] = _defaultDisplaySettings[key];
        }
      }
      RG.recollate(true);
    } else {
      CL.services.loadSavedCollation(latest.id, function(response) {

        CL.data = response.structure;
        if (latest.status === 'regularised') {
          RG.showVerseCollation(response.structure, CL.context, CL.container);
          document.getElementById('scroller').scrollLeft = 0;
          document.getElementById('scroller').scrollTop = 0;
        } else if (latest.status === 'set') {
          //if anything that should have an _id attribute doesn't have one then
          //add them
          if (SV.checkIds()[0]) {
            addUnitAndReadingIds();
          }
          SV.checkBugStatus('loaded', 'saved version');
          SV.showSetVariants({
            'container': CL.container
          });
          document.getElementById('scroller').scrollLeft = 0;
          document.getElementById('scroller').scrollTop = 0;
        } else if (latest.status === 'ordered') {
          SR.loseSubreadings();
          SR.findSubreadings({
            'rule_classes': getRuleClasses('subreading', true, 'value', ['identifier', 'subreading'])
          });
          OR.showOrderReadings({
            'container': CL.container
          });
          document.getElementById('scroller').scrollLeft = 0;
          document.getElementById('scroller').scrollTop = 0;
        } else if (approved === true) {
          SR.loseSubreadings();
          SR.findSubreadings({
            'rule_classes': getRuleClasses('subreading', true, 'value', ['identifier', 'subreading'])
          });
          OR.showApprovedVersion({
            'container': CL.container
          });
          document.getElementById('scroller').scrollLeft = 0;
          document.getElementById('scroller').scrollTop = 0;
        }
      });
    }
  };

  //not used at the moment
  // _removeOverlappedReadings = function() {
  //   var apparatus, i, j;
  //   apparatus = CL.data.apparatus;
  //   for (i = 0; i < apparatus.length; i += 1) {
  //     for (j = 0; j < apparatus[i].readings.length; j += 1) {
  //       if (apparatus[i].readings[j].hasOwnProperty('overlap')) {
  //         apparatus[i].readings[j] = 'None';
  //       }
  //     }
  //     while (apparatus[i].readings.indexOf('None') !== -1) {
  //       apparatus[i].readings.splice(apparatus[i].readings.indexOf('None'), 1);
  //     }
  //   }
  //   CL.data.apparatus = apparatus;
  // };

  /** apply the current display settings to the given token */
  _applySettings = function(word) {
    if (CL.displaySettings.view_capitalisation === false) {
      word = word.toLowerCase();
    }
    if (CL.displaySettings.view_diaeresis === false) {
      word = word.replace(/ϊ/g, 'ι');
      word = word.replace(/ϊ/g, 'ι');
      word = word.replace(/ϋ/g, 'υ');
      word = word.replace(/ϋ/g, 'υ');
    }
    if (CL.displaySettings.view_apostrophes === false) {
      word = word.replace(/’/g, '');
      word = word.replace(/\'/g, '');
    }
    if (CL.displaySettings.view_unclear === false) {
      word = word.replace(/&#803;/g, '');
    }
    if (CL.displaySettings.view_supplied === false) {
      word = word.replace(/\[([^0-9]*?)\]/g, '$1');
    }
    //TODO: this needs to be converted into js if we want punctuation to show up in subreadings
    //			if 'view_punctuation' in self.settings:
    //			if 'pc_before' in token:
    //			word = '%s%s' % (token['pc_before'], word)
    //			if 'pc_after' in token:
    //			word = '%s%s' % (word, token['pc_after'])
    return word;
  };

  _getApprovalSettings = function() {
    var defaults;
    defaults = [true, ''];
    if (CL.project.hasOwnProperty('approvalSettings')) {
      if (CL.project.approvalSettings.hasOwnProperty('allow_approval_overwrite')) {
        if (CL.project.approvalSettings.allow_approval_overwrite === true) {
          return [true, ''];
        }
        if (CL.project.approvalSettings.hasOwnProperty('no_overwrite_message')) {
          return [false, CL.project.approvalSettings.no_overwrite_message];
        }
        return [false, 'You are not allowed to overwrite a previously approved version in this project.'];
      }
      return defaults;
    }
    if (CL.services.hasOwnProperty('approvalSettings')) {
      if (CL.services.approvalSettings.hasOwnProperty('allow_approval_overwrite')) {
        if (CL.services.approvalSettings.allow_approval_overwrite === true) {
          return [true];
        }
        if (CL.services.approvalSettings.hasOwnProperty('no_overwrite_message')) {
          return [false, CL.services.approvalSettings.no_overwrite_message];
        }
        return [false, 'You are not allowed to overwrite a previously approved version.'];
      }
      return defaults;
    }
    return defaults;
  };

  _compareReadings = function(a, b) {
    //always put the reading containing the base text at the top
    if (a.witnesses.indexOf(CL.dataSettings.base_text_siglum) !== -1) {
      return -1;
    }
    if (b.witnesses.indexOf(CL.dataSettings.base_text_siglum) !== -1) {
      return 1;
    }
    //if one is overlapped put it at the bottom
    if (a.hasOwnProperty('overlap_status') && b.hasOwnProperty('overlap_status')) {
      return 0;
    }
    if (a.hasOwnProperty('overlap_status')) {
      return 1;
    }
    if (b.hasOwnProperty('overlap_status')) {
      return -1;
    }
    //otherwise check if they are both om lac readings
    if (a.text.length === 0 && b.text.length === 0) {
      //put verse_lac at the very bottom
      if (a.type === 'lac_verse') {
        return 1;
      }
      if (b.type === 'lac_verse') {
        return -1;
      }
      if (a.type === 'lac' && b.type === 'lac') {
        return 0;
      }
      if (a.type === 'lac') {
        return 1;
      }
      if (b.type === 'lac') {
        return -1;
      }
      if (a.type === 'om_verse') {
        return 1;
      }
      if (b.type === 'om_verse') {
        return -1;
      }
    }
    //otherwise if only
    if (a.text.length === 0) {
      return 1;
    }
    if (b.text.length === 0) {
      return -1;
    }
    return 0;
  };

  _disableEventPropagation = function(event) {
    if (event.stopPropagation) {
      event.stopPropagation();
    } else if (window.event) {
      window.event.cancelBubble = true;
    }
  };

  _showCollationSettings = function() {
    var settings_div, data;
    if (document.getElementById('settings') !== null) {
      document.getElementsByTagName('body')[0].removeChild(document.getElementById('settings'));
    }
    settings_div = document.createElement('div');
    settings_div.setAttribute('id', 'settings');
    settings_div.setAttribute('class', 'dialogue_form settings_dialogue');
    settings_div.innerHTML = '<div class="dialogue_form_header"><span id="settings_title">Algorithm Settings</span></div><form id="settings_form">' +
      '<label class="inline-label" for="algorithm">Algorithm:</label><select id="algorithm" name="algorithm">' +
      '<option value="auto">Auto</option><option value="dekker">Dekker</option><option value="needleman-wunsch">Needleman-Wunsch</option>' +
      '</select><br/>' +
      '<label class="inline-label" for="fuzzy_match">Use fuzzy matching:</label><input class="boolean" name="fuzzy_match" id="fuzzy_match" type="checkbox"/><br/>' +
      '<label class="inline-label" for="distance">Distance:</label><input size="4" class="string" name="distance" id="distance" type="text"/><br/>' +
      '<input class="pure-button dialogue-form-button" type="button" id="save_settings" value="Save"/>' +
      '<input class="pure-button dialogue-form-button" type="button" id="close_settings" value="Cancel"/></form>';
    document.getElementsByTagName('body')[0].appendChild(settings_div);
    if (document.getElementById('algorithm')) {
      document.getElementById('algorithm').value = CL.algorithmSettings.algorithm;
    }
    if (document.getElementById('fuzzy_match')) {
      document.getElementById('fuzzy_match').checked = CL.algorithmSettings.fuzzy_match;
      if (CL.algorithmSettings.fuzzy_match === false) {
        document.getElementById('distance').disabled = 'disabled';
      }
    }
    if (document.getElementById('distance')) {
      document.getElementById('distance').value = CL.algorithmSettings.distance;
    }
    $('#fuzzy_match').on('click', function(event) {
      if (document.getElementById('fuzzy_match').checked === true) {
        document.getElementById('distance').removeAttribute('disabled');
      } else {
        document.getElementById('distance').disabled = 'disabled';
      }
    });
    $('#save_settings').on('click', function(event) {
      var setting;
      data = cforms.serialiseForm('settings_form');
      for (setting in CL.algorithmSettings) {
        if (CL.algorithmSettings.hasOwnProperty(setting)) {
          if (data.hasOwnProperty(setting)) {
            CL.algorithmSettings[setting] = data[setting];
          } else {
            CL.algorithmSettings[setting] = false;
          }
        }
      }
      document.getElementsByTagName('body')[0].removeChild(document.getElementById('settings'));
    });
    $('#close_settings').on('click', function(event) {
      document.getElementsByTagName('body')[0].removeChild(document.getElementById('settings'));
    });
  };

  /** checks to see if controlling checkbox is checked/unchecked and then check/uncheck children */
  _checkWitnesses = function(id) {
    var parent_div, elements, checked, i;
    parent_div = document.getElementById(id).parentNode;
    checked = document.getElementById(id).checked;
    elements = parent_div.childNodes;
    for (i = 0; i < elements.length; i += 1) {
      if (elements[i].tagName === 'INPUT') {
        if (checked === true) {
          elements[i].checked = true;
        } else {
          elements[i].checked = false;
        }
      }
    }
  };

  _getScrollPosition = function() {
    var x, y, position;
    x = 0;
    y = 0;
    if (typeof(window.pageYOffset) === 'number') {
      x = window.pageXOffset;
      y = window.pageYOffset;
    } else if (document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop)) {
      x = document.documentElement.scrollLeft;
      y = document.documentElement.scrollTop;
    } else if (document.body && (document.body.scrollLeft || document.body.scrollTop)) {
      x = document.body.scrollLeft;
      y = document.body.scrollTop;
    }
    position = {
      'x': x,
      'y': y
    };
    return position;
  };

  _getMousePosition = function(e, elem_width) {
    var position, width;
    e = e ? e : window.event;
    width = document.getElementById('container').offsetWidth;
    // if the menu is too near the right
    if ((e.clientX + elem_width) > width) {
      position = {
        'x': width - (elem_width + 30),
        'y': e.clientY + 3
      };
    } else { // if the menu is not too near the right
      position = {
        'x': e.clientX,
        'y': e.clientY + 3
      };
    }
    return position;
  };

  calculatePosition = function(e, element) {
    var width, position, scroll_position;
    element.style.left = '-1000px';
    element.style.top = '-1000px';
    element.style.display = "block";
    width = element.offsetWidth;
    element.style.display = "none";
    position = _getMousePosition(e, width);
    scroll_position = _getScrollPosition();
    element.style.left = (position.x + scroll_position.x) + "px";
    element.style.top = (position.y + scroll_position.y) + "px";
  };

  _displayWitnessesHover = function(event, witnesses) {
    var element;
    element = document.getElementById('tool_tip');
    if (witnesses === undefined) {
      if (event.target.tagName === 'LI') {
        witnesses = _getWitnessesForReading(event.target.id);
      } else if (event.target.parentNode.tagName === 'LI') {
        witnesses = _getWitnessesForReading(event.target.parentNode.id);
      } else if (event.target.tagName.id === 'TR') {
        witnesses = _getWitnessesForReading(event.target.id);
      } else if (event.target.parentNode.tagName === 'TR') {
        witnesses = _getWitnessesForReading(event.target.parentNode.id);
      } else {
        witnesses = _getWitnessesForReading(event.target.parentNode.parentNode.id);
      }
    }
    if (witnesses !== null) {
      element.innerHTML = witnesses;
    } else {
      return;
    }
    calculatePosition(event, element);
    element.style.display = "block";
    event.stopPropagation();
  };

  _getWitnessesForReading = function(id_string) {
    var i, j, unit, reading, app, type, subrow, witnesses;
    if (id_string.indexOf('_app_') !== -1) {
      app = 'apparatus' + id_string.substring(id_string.indexOf('app_') + 4, id_string.indexOf('_row'));
    } else {
      app = 'apparatus';
    }
    if (id_string.indexOf('variant_unit') !== -1) {
      unit = parseInt(id_string.substring(0, id_string.indexOf('_row')).replace('variant_unit_', ''), 10);
      reading = parseInt(id_string.substring(id_string.indexOf('row_') + 4), 10);
      if (!isNaN(unit) && !isNaN(reading)) {
        return getReadingWitnesses(CL.data[app][unit].readings[reading], app, CL.data[app][unit].start, CL.data[app][unit].end, CL.data[app][unit].first_word_index).join(', ');
      }
      return null;
    }
    unit = parseInt(id_string.substring(0, id_string.indexOf('_row')).replace('subreading_unit_', ''), 10);
    reading = parseInt(id_string.substring(id_string.indexOf('row_') + 4, id_string.indexOf('_type_')), 10);
    type = id_string.substring(id_string.indexOf('type_') + 5, id_string.indexOf('_subrow_'));
    subrow = parseInt(id_string.substring(id_string.indexOf('subrow_') + 7), 10);
    if (!isNaN(unit) && !isNaN(reading) && !isNaN(subrow)) {
      return getReadingWitnesses(CL.data[app][unit].readings[reading].subreadings[type][subrow], app, CL.data[app][unit].start, CL.data[app][unit].end, CL.data[app][unit].first_word_index).join(', ');
    }
    return null;
  };

  /** check to see if the given witness has an entry in the standoff marked_readings
   * if it does return the reading
   * if it does not return null */
  _findStandoffWitness = function(witness, start, end, first_word_index) {
    var key, i, entry;
    for (key in CL.data.marked_readings) {
      if (CL.data.marked_readings.hasOwnProperty(key)) {
        for (i = CL.data.marked_readings[key].length - 1; i >= 0; i -= 1) {
          if (CL.data.marked_readings[key][i].witness === witness &&
            CL.data.marked_readings[key][i].start === start &&
            CL.data.marked_readings[key][i].end === end) {
            if (CL.data.marked_readings[key][i].hasOwnProperty('first_word_index')) {
              if (CL.data.marked_readings[key][i].first_word_index === first_word_index) {
                entry = JSON.parse(JSON.stringify(CL.data.marked_readings[key][i]));
                CL.data.marked_readings[key].splice(i, 1);
                return [entry, key];
              }
            } else {
              entry = JSON.parse(JSON.stringify(CL.data.marked_readings[key][i]));
              CL.data.marked_readings[key].splice(i, 1);
              return [entry, key];
            }
          }
        }
      }
    }
    return null;
  };

  _findReadingPosById = function(unit, id) {
    var i;
    for (i = 0; i < unit.readings.length; i += 1) {
      if (unit.readings[i].hasOwnProperty('_id') && unit.readings[i]._id === id) {
        return i;
      }
    }
    return null;
  };

  //I considered making these cumulative but decided against so that projects can always override services
  //if they have different editorial practices (can be overridden on a stage by stage basis)
  _getPreStageChecks = function(stage) {
    if (CL.project.hasOwnProperty('preStageChecks') && CL.project.preStageChecks.hasOwnProperty(stage)) {
      return CL.project.preStageChecks[stage];
    }
    if (CL.services.hasOwnProperty('preStageChecks') && CL.services.preStageChecks.hasOwnProperty(stage)) {
      return CL.services.preStageChecks[stage];
    }
    return [];
  };

  _makeRegDecisionsStandoff = function(type, apparatus, unit, reading, parent, subreading, witness) {
    var rule_details, key, i, j, k, standoff_reading, values, classes, details, decision_details, subreading_types;
    //get all the possible rules
    rule_details = getRuleClasses(undefined, undefined, 'value', ['suffixed_sigla', 'identifier', 'name', 'subreading', 'suffixed_label']);
    subreading_types = [];
    for (key in rule_details) {
      if (rule_details.hasOwnProperty(key) && rule_details[key][3] === true) {
        subreading_types.push(key);
      }
    }
    //now for each witness construct its regularisation history and make a standoff entry for it
    standoff_reading = {
      'start': unit.start,
      'end': unit.end,
      'unit_id': unit._id,
      'first_word_index': unit.first_word_index,
      'witness': witness,
      'apparatus': apparatus,
      'parent_text': extractWitnessText(parent, {
        'app_id': apparatus,
        'unit_id': unit._id
      }),
      'identifier': [],
      'suffixed_sigla': [],
      'suffixed_label': [],
      'reading_history': [extractWitnessText(reading, {
        'witness': witness,
        'reading_type': 'subreading'
      })],
      'subreading': [],
      'name': [],
      'values': []
    };



    //now get all the words and their decisions or an empty list if no decisions
    classes = [];
    details = [];
    //loop through the words and get the decisions for each word
    for (k = 0; k < subreading.text.length; k += 1) {
      if (subreading.text[k][witness].hasOwnProperty('decision_class')) {
        classes.push(JSON.parse(JSON.stringify(subreading.text[k][witness].decision_class)));
      } else {
        classes.push([]);
      }
      if (subreading.text[k][witness].hasOwnProperty('decision_details')) {
        decision_details = JSON.parse(JSON.stringify(subreading.text[k][witness].decision_details));
        decision_details[0].base_reading = _applySettings(decision_details[0].t);
        details.push(decision_details);
      } else {
        details.push([{
          'n': subreading.text[k]['interface']
        }]);
      }
    }



    //now implement your algorithm and push each result to the standoff reading
    //work out the text at this stage as part of that - text should be before the rules are applied so first one has none applied etc.
    standoff_reading = _getReadingHistory(classes, details, standoff_reading, rule_details, type, subreading_types, reading, witness, subreading);
    standoff_reading.value = standoff_reading.values.join('|');
    delete standoff_reading.values;
    if (!CL.data.marked_readings.hasOwnProperty(standoff_reading.value)) {
      CL.data.marked_readings[standoff_reading.value] = [];
    }
    if (reading.text.length > 0 && reading.text[reading.text.length - 1].hasOwnProperty('combined_gap_after')) {
      standoff_reading.combined_gap_after = true;
    }
    if (reading.text.length > 0 && reading.text[0].hasOwnProperty('combined_gap_before')) {
      standoff_reading.combined_gap_before = true;
      if (reading.text[0].hasOwnProperty('combined_gap_before_details')) {
        standoff_reading.combined_gap_before_details = reading.text[0].combined_gap_before_details;
      }
    }

    CL.data.marked_readings[standoff_reading.value].push(standoff_reading);
  };

  _contextInputOnload = function(project) {
    //TODO: check we need language - I think it is optional
    document.getElementById('language').value = project.language;
    document.getElementById('base_text').value = project.base_text;
    document.getElementById('project').value = project._id;
    document.getElementById('preselected_witnesses').value = project.witnesses.join();
  };

  _getReadingHistory = function(classes, details, standoff_reading, rule_details, type, subreading_types, original_reading, witness, subreading) {
    var position, temp, rule_type, lowest_rule_positions, all_done, reading;
    //position is how far through the decision lists we are
    position = 0;
    all_done = false;
    while (!all_done) {
      temp = _getNextTargetRuleInfo(classes, subreading_types);
      rule_type = temp[0];
      lowest_rule_positions = temp[1];
      if (!rule_type) {
        all_done = true;
      } else {
        //['suffixed_sigla', 'identifier', 'name', 'subreading', 'suffixed_label']
        standoff_reading.suffixed_sigla.push(rule_details[rule_type][0]);
        standoff_reading.identifier.push(rule_details[rule_type][1]);
        standoff_reading.name.push(rule_details[rule_type][2]);
        standoff_reading.subreading.push(rule_details[rule_type][3]);
        standoff_reading.suffixed_label.push(rule_details[rule_type][4]);
        standoff_reading.values.push(rule_type);
        standoff_reading.reading_history.push(_getHistoricalReading(rule_type, lowest_rule_positions, classes, details, original_reading, witness, subreading));
        classes = _removeAppliedRules(rule_type, lowest_rule_positions, classes);
      }
    }
    //now add the current one
    standoff_reading.suffixed_sigla.push(rule_details[type][0]);
    standoff_reading.identifier.push(rule_details[type][1]);
    standoff_reading.name.push(rule_details[type][2]);
    standoff_reading.subreading.push(rule_details[type][3]);
    standoff_reading.suffixed_label.push(rule_details[type][4]);
    standoff_reading.values.push(type);
    standoff_reading.reading_text = standoff_reading.reading_history[0];
    return standoff_reading;
  };

  _getNextTargetRuleInfo = function(classes, subreading_types) {
    var rule_type, positions, lowest_position, i, j;
    positions = [];
    lowest_position = 1000000000;
    for (i = 0; i < classes.length; i += 1) {
      positions[i] = null;
      for (j = 0; j < classes[i].length; j += 1) {
        if (classes[i][j] && positions[i] === null) {
          positions[i] = j;
          if (j < lowest_position) {
            lowest_position = j;
          }
        }
      }
    }
    //put a rule type in to start off with so we always have one - overwrite if needed in the loop
    rule_type = classes[0][lowest_position];
    for (i = 1; i < classes.length; i += 1) {
      if (classes[i][lowest_position] !== null && typeof classes[i][lowest_position] !== 'undefined' && (typeof rule_type === 'undefined' || rule_type === null || subreading_types.indexOf(rule_type) !== -1)) {
        rule_type = classes[i][lowest_position];
      }
    }
    if (subreading_types.indexOf(rule_type) !== -1) {
      for (i = 0; i < positions.length; i += 1) {
        if (classes[i][positions[i]] !== null && typeof classes[i][positions[i]] !== 'undefined' && subreading_types.indexOf(classes[i][positions[i]]) === -1) {
          rule_type = classes[i][positions[i]];
          break;
        }
      }
    }
    return [rule_type, positions];
  };

  _removeAppliedRules = function(rule_type, positions, classes) {
    for (let i = 0; i < classes.length; i += 1) {
      if (classes[i][positions[i]] === rule_type) {
        classes[i][positions[i]] = null;
      }
    }
    return classes;
  };

  _getHistoricalReading = function(rule_type, positions, classes, details, reading, witness, subreading) {
    var new_reading;
    new_reading = [];
    if (reading.hasOwnProperty('combined_gap_before_subreadings') &&
      reading.combined_gap_before_subreadings.indexOf(witness) !== -1 &&
      reading.hasOwnProperty('combined_gap_before_subreadings_details') &&
      reading.combined_gap_before_subreadings_details.hasOwnProperty(witness)) {
      new_reading.push('&lt;' + reading.combined_gap_before_subreadings_details[witness] + '&gt;');
    } else if (reading.text.length > 0 && reading.text[0].hasOwnProperty('combined_gap_before') && (!reading.hasOwnProperty('SR_text') || !reading.SR_text.hasOwnProperty(witness))) {
      if (reading.text[0].hasOwnProperty(witness) && reading.text[0][witness].hasOwnProperty('gap_before')) { //first unit in verse this might actually work like the others now
        new_reading.push('&lt;' + reading.text[0][witness].gap_before_details + '&gt;');
      } else if (reading.text[0].hasOwnProperty('combined_gap_before') && reading.text[0].combined_gap_before.length > 0 && reading.text[0].hasOwnProperty('combined_gap_before_details')) { //subsequent units in verse
        //this may be the only condition ever hit here
        new_reading.push('&lt;' + reading.text[0].combined_gap_before_details + '&gt;');
      }
    }
    for (let i = 0; i < positions.length; i += 1) {
      if (positions[i] !== null) {
        if (classes[i][positions[i]] === rule_type) {
          new_reading.push(details[i][positions[i]].n);
        } else {
          if (positions[i] > 0) {
            new_reading.push(details[i][positions[i] - 1].n);
          } else {
            new_reading.push(details[i][0].base_reading);
          }
        }
      } else if (details[i].length > 0) {
        new_reading.push(details[i][details[i].length - 1].n);
      } else {
        new_reading.push(details[i][0].n);
      }
      if (i === positions.length - 1 && reading.text[i].hasOwnProperty('combined_gap_after') && reading.text[i].combined_gap_after.indexOf(witness) !== -1) {
        if (subreading.text[i][witness].hasOwnProperty('gap_after')) {
          new_reading.push('&lt;' + subreading.text[i][witness].gap_details + '&gt;');
        }
      } else if (i !== positions.length - 1) {
        if (subreading.text[i][witness].hasOwnProperty('gap_after')) {
          new_reading.push('&lt;' + subreading.text[i][witness].gap_details + '&gt;');
        }
      }
    }
    return new_reading.join(' ');
  };




//priv-e


//OLD STYLE FROM HERE

  return {

    //This needs to go because of eval
    run_function: function(function_ref, args) {
      var fn;
      if (typeof args === 'undefined') {
        args = [];
      }
      if (typeof function_ref === 'string') {
        // console.warn('This feature will be deprecated soon. All js functions should be specified in a file and referenced in projects and services only');
        // console.log(function_ref)
        if (function_ref.indexOf('(') === -1 && function_ref.indexOf('{') === -1) {

          fn = eval(function_ref);
          return fn.apply(this, args);
        } else {
          alert('there may be a security problem on this page');
        }
      } else {
        // console.log('running the else condition in run_function with ')
        // console.log(function_ref)
        return function_ref.apply(this, args);
      }
    },
    services: services,
    container: container,
    displaySettings: displaySettings,
    displaySettingsDetails: displaySettingsDetails,
    ruleConditions: ruleConditions,
    localPythonFunctions: localPythonFunctions,
    overlappedOptions: overlappedOptions,
    dataSettings: dataSettings,
    algorithmSettings: algorithmSettings,
    highlighted: highlighted,
    showSubreadings: showSubreadings,
    managingEditor: managingEditor,
    project: project,
    collateData: collateData,
    context: context,
    data: data,
    calculatePosition: calculatePosition,
    debug: debug,

    setServiceProvider: setServiceProvider,
    expandFillPageClients: expandFillPageClients,
    getHeaderHtml: getHeaderHtml,
    addUnitAndReadingIds: addUnitAndReadingIds,
    addReadingIds: addReadingIds,
    addReadingId: addReadingId,
    addUnitId: addUnitId,
    extractWitnessText: extractWitnessText,
    getAllReadingWitnesses: getAllReadingWitnesses,
    findUnitById: findUnitById,
    findStandoffRegularisation: findStandoffRegularisation,
    getRuleClasses: getRuleClasses,
    getCollationHeader: getCollationHeader,
    addTriangleFunctions: addTriangleFunctions,
    getOverlapLayout: getOverlapLayout,
    sortReadings: sortReadings,
    extractDisplayText: extractDisplayText,
    getReadingLabel: getReadingLabel,
    getAlphaId: getAlphaId,
    getReadingSuffix: getReadingSuffix,
    addSubreadingEvents: addSubreadingEvents,
    getUnitLayout: getUnitLayout,
    unitHasText: unitHasText,
    isBlank: isBlank,
    getHighlightedText: getHighlightedText,
    findOverlapUnitById: findOverlapUnitById,
    getReading: getReading,
    lacOmFix: lacOmFix,
    getSubreadingOfWitness: getSubreadingOfWitness,
    overlapHasEmptyReading: overlapHasEmptyReading,
    removeNullItems: removeNullItems,
    addStageLinks: addStageLinks,
    addExtraFooterButtons: addExtraFooterButtons,
    makeVerseLinks: makeVerseLinks,
    getUnitAppReading: getUnitAppReading,
    setList: setList,
    getActiveUnitWitnesses: getActiveUnitWitnesses,
    getExporterSettings: getExporterSettings,
    saveCollation: saveCollation,
    sortWitnesses: sortWitnesses,
    getSpecifiedAncestor: getSpecifiedAncestor,
    hideTooltip: hideTooltip,
    addHoverEvents: addHoverEvents,
    markReading: markReading,
    showSplitWitnessMenu: showSplitWitnessMenu,
    markStandoffReading: markStandoffReading,
    findUnitPosById: findUnitPosById,
    findReadingById: findReadingById,
    applyPreStageChecks: applyPreStageChecks,
    makeStandoffReading: makeStandoffReading,
    doMakeStandoffReading: doMakeStandoffReading,
    makeMainReading: makeMainReading,
    getOrderedAppLines: getOrderedAppLines,
    loadIndexPage: loadIndexPage,
    addIndexHandlers: addIndexHandlers,
    getHandsAndSigla: getHandsAndSigla,
    createNewReading: createNewReading,
    getReadingWitnesses: getReadingWitnesses,

    //deprecated function mapping for calls from older services
    set_service_provider: setServiceProvider,
    load_index_page: loadIndexPage,
    add_index_handlers: addIndexHandlers,
    _managing_editor: managingEditor,

  };
}());



    // set_project_cookie: function(project_id) {
    //   document.cookie = 'project=' + project_id + 'path=/collation/';
    // },
    //
    // get_project_cookie: function() {
    //   var cookie_pairs, pair, i, name;
    //   cookie_pairs = document.cookie.split(';');
    //   name = 'project=';
    //   for (i = 0; i < cookie_pairs.length; i += 1) {
    //     pair = cookie_pairs[i].trim();
    //     if (pair.indexOf(name) === 0) {
    //       return pair.substring(name.length, pair.length);
    //     }
    //   }
    //   return '';
    // },
    //
    // delete_project_cookie: function() {
    //   document.cookie = "project=; path=/collation/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    // },



    // //TODO: we may not need all of this data
    // //at the moment I am just keeping everything we have in the collation object
    // //but this can probably be thinned out when I know what we need
    // export_to_apparatusEditor: function() {
    //   var main_app, data, i, key, apparatus;
    //   CL.services.getUserInfo(function(user) {
    //     if (user) {
    //       console.log('exporting to apparatus editor');
    //       main_app = {
    //         '_model': 'main_apparatus',
    //         'structure': CL.data,
    //         'status': status,
    //         'context': CL.get_context_dict(),
    //         'user': user.id,
    //         'data_settings': CL.dataSettings,
    //         'algorithm_settings': CL.algorithmSettings,
    //         'display_settings': CL.displaySettings
    //       };
    //       if (CL.project.hasOwnProperty('id')) {
    //         main_app.project = CL.project.id;
    //         main_app._id = CL.context + '_' + CL.project.id;
    //       } else {
    //         // should never happen but just in case stick in the user id.
    //         main_app._id += '_' + user.id;
    //       }
    //
    //       //TODO: Important! make an error message that checks if any versions have been added
    //       //and if they have then don't allow
    //
    //       var confirm_message = "This project already has an version of this verse in the main apparatus.\nAre you sure you want to overwrite the currently saved version with this one?\nOverwriting may mean versional data needs to be checked and edited in the apparatus editor.";
    //       var success_message = "Approved successful";
    //       CL.services.saveCollation(CL.context, main_app, confirm_message, true, function(saved_successful) {
    //         document.getElementById('message_panel').innerHTML = saved_successful ? success_message : '';
    //       });
    //     }
    //   });
    // },
    //
    // //only used in Magpy specific stuff - move somewhere else
    // get_context_dict: function(witness, verse) {
    //   var context;
    //   if (typeof verse === 'undefined') {
    //     verse = CL.context;
    //   }
    //   context = {
    //     'book': parseInt(verse.substring(verse.indexOf('B') + 1, verse.indexOf('K')), 10),
    //     'chapter': parseInt(verse.substring(verse.indexOf('K') + 1, verse.indexOf('V')), 10),
    //     'verse': parseInt(verse.substring(verse.indexOf('V') + 1), 10)
    //   };
    //   if (typeof witness !== 'undefined') {
    //     context.witness = witness;
    //   }
    //   return context;
    // },


        // delete_reading_by_id: function(unit, reading_id) {
        //   var i;
        //   for (i = 0; i < unit.readings.length; i += 1) {
        //     if (unit.readings[i]._id === reading_id) {
        //       unit.readings[i] = null;
        //     }
        //   }
        //   removeNullItems(unit.readings);
        // },

        //if all of the provided overlap_unit ids have empty readings
        // overlaps_are_all_empty_readings: function(overlap_units) {
        //   var i, ol_unit;
        //   for (i = 0; i < overlap_units.length; i += 1) {
        //     ol_unit = findOverlapUnitById(overlap_units[i]);
        //     if (ol_unit.readings[1].text.length > 0) {
        //       return false;
        //     }
        //   }
        //   return true;
        // },

        // /** prepare the token for collate */
        // prepare_t: function(data) {
        //   data = data.replace(/ϊ/g, 'ι');
        //   data = data.replace(/ϊ/g, 'ι');
        //   data = data.replace(/ϋ/g, 'υ');
        //   data = data.replace(/ϋ/g, 'υ');
        //   data = data.replace(/\[/g, '').replace(/\]/g, '').replace(/_/g, '').replace(/〚/g, '').replace(/〛/g, '');
        //   data = CL.lower_greek(data);
        //   //TODO: need full list of punctuation to also strip!
        //   return data;
        // },

        // /** special lower case method for Greek to deal with sigmas properly*/
        // lower_greek: function(data) {
        //   console.error('lower_greek should be in settings');
        //   var chars, i, newchars, lower;
        //   newchars = [];
        //   chars = data.split('');
        //   if (chars.length > 0) {
        //     for (i = 0; i < chars.length; i += 1) {
        //       lower = chars[i].toLowerCase();
        //       if (i === chars.length - 1 && lower === 'σ') {
        //         newchars.push('ς');
        //       } else {
        //         newchars.push(lower);
        //       }
        //     }
        //     return newchars.join('');
        //   }
        //   return data;
        // },

        // check_login_status: function(output) {
        //   var criteria;
        //   SPN.show_loading_overlay();
        //   expandFillPageClients();
        //   $(window).resize(function() {
        //     expandFillPageClients();
        //   });
        //   CL.services.showLoginStatus(function() {
        //     if (typeof output !== 'undefined') {
        //       _displayMode = output;
        //     }
        //     CL.container = document.getElementById('container');
        //     CL.services.getUserInfo(function(user) { // success
        //       if (user) {
        //         criteria = {
        //           'editors': {
        //             '$in': [user.id]
        //           }
        //         };
        //         //we are using the ITSEE interface
        //         //so display the correct menu for the circumstances
        //         MENU.choose_menu_to_display(user, criteria, 'collation');
        //       } else { // failure
        //         CL.container.innerHTML = '<p>Please login using the link in the top right corner to use the editing interface</p>';
        //         SPN.remove_loading_overlay();
        //       }
        //     });
        //   });
        // },

        // cbgm_export: function() {
        //   COLLATE.exporter(CL.context);
        // },

        // show_header_row: function(ref) {
        //   document.getElementById('header_row').innerHTML = ref;
        // },

        // list_content_matches: function(list1, list2) {
        //   var i;
        //   if (list1.length !== list2.length) {
        //     return false;
        //   }
        //   for (i = 0; i < list1.length; i += 1) {
        //     if (list2.indexOf(list1[i]) === -1) {
        //       return false;
        //     }
        //   }
        //   return true;
        // },

        /** check to see if parent needs to be unchecked/checked */
        //TODO: this is actually used for selecting witnesses from the menu of all availble transcriptions
        // check_witness_lead: function(id) {
        //   var parent_div, elements, all_checked, i, summary_box;
        //   if (document.getElementById(id).checked === false) {
        //     document.getElementById(id).parentNode.childNodes[0].checked = false;
        //   } else {
        //     parent_div = document.getElementById(id).parentNode;
        //     elements = parent_div.childNodes;
        //     all_checked = true;
        //     for (i = 0; i < elements.length; i += 1) {
        //       if (elements[i].tagName === 'INPUT') {
        //         if (elements[i].id.search('Every_') !== -1) {
        //           summary_box = elements[i];
        //         } else {
        //           if (elements[i].checked === false) {
        //             all_checked = false;
        //             break;
        //           }
        //         }
        //       }
        //     }
        //     if (all_checked === true) {
        //       summary_box.checked = true;
        //     }
        //   }
        // },








            // processesHandId = function(hand) {
            //   var display_hand;
            //   if (CL._remove_private_for.indexOf(hand.replace('_private', ' (private)')) !== -1) {
            //     display_hand = hand.replace('_private', '');
            //   } else {
            //     display_hand = hand.replace('_private', ' (private)');
            //   }
            //   return display_hand;
            // };
