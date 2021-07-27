/*jshint esversion: 6 */
var testing;
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
      collationAlgorithmSettings = {},
      highlighted = 'none',
      highlightedAdded = [],
      showSubreadings = false,
      managingEditor = false,
      project = {},
      collateData = {},
      context = '',
      debug = false,
      stage = null,
      data = {},
      isDirty = false, // this is currently only used for witnessEditingMode but could be expanded maybe on a
      // project setting. It also only works for modifications to witnesses (adding/removing) not any other action
      // while in edit mode. That should perhaps be changed for adding as more editing is allowed (when removing all
      // you can do is remove so the dirty flag is fine)
      witnessEditingMode = false,
      witnessAddingMode = false,
      witnessRemovingMode = false,
      witnessesAdded = [],
      savedDisplaySettings = null,
      savedAlgorithmSettings = null,
      savedDataSettings = null,
      existingCollation = null;

  //private variable declarations
  let _contextInput = null,
      _defaultDisplaySettings = {},
      _collapsed = false,
      _alpha = 'abcdefghijklmnopqrstuvwxyz',
      _displayMode = 'editor'; //there used to be support for 'table' for a straight collation table view but it does not work;;

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
  markStandoffReading, findUnitPosById, findReadingById, findReadingPosById, applyPreStageChecks,
  makeStandoffReading, doMakeStandoffReading, makeMainReading, getOrderedAppLines,
  loadIndexPage, addIndexHandlers, getHandsAndSigla, createNewReading, getReadingWitnesses,
  calculatePosition, removeWitness, checkWitnessesAgainstProject, setUpRemoveWitnessesForm,
  removeWitnesses, getRemoveWitnessDataFromForm, returnToSummaryTable, prepareAdditionalCollation,
  removeSpecialWitnesses, runFunction, setOverlappedOptions, setRuleClasses;

  //private function declarations
  let _initialiseEditor, _initialiseProject, _setProjectConfig, _setDisplaySettings,
   _setLocalPythonFunctions, _setRuleConditions,
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
   _findStandoffWitness, _getPreStageChecks, _makeRegDecisionsStandoff,
   _contextInputOnload, _removeWitnessFromUnit, _addToSavedCollation,
   _displaySavedCollation, _mergeCollationObjects,
   _getUnitsByStartIndex, _mergeNewLacOmVerseReadings, _mergeNewReading,
   _getReadingHistory, _getNextTargetRuleInfo, _removeAppliedRules,
   _getHistoricalReading, _extractAllTValuesForRGAppliedRules,
   _makeStandoffReading2, _extractWordsForHeader, _getFunctionFromString;


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
      } else {
        $(this).height(window.innerHeight - $(this).offset().top - 40);
      }
    });
  };

  getHeaderHtml = function(stage, context) {
    var html;
    if (['Regulariser', 'Set Variants'].indexOf(stage) !== -1 && CL.witnessEditingMode === true) {
      if (CL.witnessAddingMode === true) {
        stage += ' - Witness Adding Mode';
      } else if (CL.witnessRemovingMode === true) {
        stage += ' - Witness Removing Mode';
      }
    }
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
    var data;
    data = CL.data;
    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        if (key.indexOf('apparatus') !== -1) {
          for (let i = 0; i < data[key].length; i += 1) {
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
    var start, end;
    start = unit.start.toString();
    end = unit.end.toString();
    for (let i = 0; i < unit.readings.length; i += 1) {
      addReadingId(unit.readings[i], start, end);
    }
  };

  addReadingId = function(reading, start, end) {
    reading._id = MD5(start + end + extractWitnessText(reading) + reading.witnesses.join(' '));
    return reading._id;
  };

  addUnitId = function(unit, appId) {
    var start, end, text;
    start = unit.start.toString();
    end = unit.end.toString();
    text = [];
    text.push(start);
    text.push(end);
    for (let i = 0; i < unit.readings.length; i += 1) {
      text.push(extractWitnessText(unit.readings[i]) + unit.readings[i].witnesses.join(' '));
    }
    if (typeof appId !== 'undefined') {
      text.push(appId);
    } else {
      text.push('apparatus');
    }
    unit._id = MD5(text.join(''));
    return unit._id;
  };

  /** */
  extractWitnessText = function(reading, options, test) {
    var text, witness_text, witness, reading_type, unit_id, app_id, required_rules, found_word;

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
      for (let i = 0; i < reading.witnesses.length; i += 1) {
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
        for (let i = 0; i < reading.text.length; i += 1) {
          text.push(reading.text[i]['interface']);
        }
        return CL.project.prepareDisplayString(text.join(' '));
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
    for (let i = 0; i < witness_text.length; i += 1) {
      found_word = undefined;
      if (reading_type === 'subreading' && witness_text[i][witness].hasOwnProperty('decision_details')) {
        //loop backwards and only use t of rules that match your list of supplied types
        if (typeof required_rules === 'undefined') {
          text.push(witness_text[i][witness].decision_details[0].t); //this gets the first t from the decision details so effectively undoing all regularisations
          if (test === true) {
            console.log('I am a subreading but have not been given specific rules to apply');
          }
        } else {
          for (let j = witness_text[i][witness].decision_details.length - 1; j >= 0; j -= 1) {
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
    return CL.project.prepareDisplayString(text.join(' '));
  };

  getAllReadingWitnesses = function(reading) {
    var witnesses;
    witnesses = reading.witnesses.slice(0); //make a copy
    if (reading.hasOwnProperty('subreadings')) {
      for (let key in reading.subreadings) {
        if (reading.subreadings.hasOwnProperty(key)) {
          for (let i = 0; i < reading.subreadings[key].length; i += 1) {
            witnesses.push.apply(witnesses, reading.subreadings[key][i].witnesses);
          }
        }
      }
    }
    //this has been added in to help with the fix_lac_om stuff with om as subreading of existing reading
    if (reading.hasOwnProperty('SR_text')) {
      for (let key in reading.SR_text) {
        if (reading.SR_text.hasOwnProperty(key)) {
          if (witnesses.indexOf(key) === -1) {
            witnesses.push(key);
          }
        }
      }
    }
    return witnesses;
  };

  findUnitById = function(appId, unitId) {
    var data;
    if (CL.data.hasOwnProperty(appId)) {
      for (let i = 0; i < CL.data[appId].length; i += 1) {
        if (CL.data[appId][i]._id === unitId) {
          return CL.data[appId][i];
        }
      }
    }
    return null;
  };

  findStandoffRegularisation = function(unit, witness, appId) {
    if (CL.data.hasOwnProperty('marked_readings')) {
      for (let key in CL.data.marked_readings) {
        if (CL.data.marked_readings.hasOwnProperty(key)) {
          for (let i = 0; i < CL.data.marked_readings[key].length; i += 1) {
            if (CL.data.marked_readings[key][i].apparatus === appId &&
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

  getRuleClasses = function(testKey, testValue, key, data) {
    var classes, list, ruleClasses;
    classes = {};
    ruleClasses = CL.ruleClasses;
    for (let i = 0; i < ruleClasses.length; i += 1) {
      if (ruleClasses[i][testKey] === testValue || typeof testKey === 'undefined') {
        if (typeof(data) === 'string') {
          classes[ruleClasses[i][key]] = ruleClasses[i][data];
        } else {
          list = [];
          for (let j = 0; j < data.length; j += 1) {
            list.push(ruleClasses[i][data[j]]);
          }
          classes[ruleClasses[i][key]] = list;
        }
      }
    }
    return classes;
  };

  _extractWordsForHeader = function (data) {
    let words, word;
    if (Array.isArray(data.overtext)) {
      // words is a list of lists with the first being the word and the second being the class to add if any or a an empty string
      if (CL.project.hasOwnProperty('extractWordsForHeader')) {
        words = CL.project.extractWordsForHeader(data.overtext[0].tokens);
      } else if (CL.services.hasOwnProperty('extractWordsForHeader')) {
        words = CL.services.extractWordsForHeader(data.overtext[0].tokens);
      } else {
        //hardcoded default
        words = [];
        for (let i = 0; i < data.overtext[0].tokens.length; i += 1) {
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
          words.push([word.join(''), '']);
        }
      }
    }
    return words;
  };

  getCollationHeader = function(data, col_spans, number_spaces) {
    var html, words, cols, j, colspan, previousLinkHtml, nextLinkHtml;
    html = [];
    words = _extractWordsForHeader(data);
    if (CL.witnessEditingMode === false) {
      previousLinkHtml = '<td class="nav" id="previous_verse">&larr;</td>';
      nextLinkHtml = '<td class="nav" id="next_verse">&rarr;</td>';
    } else {
      previousLinkHtml = '<td></td>';
      nextLinkHtml = '<td></td>';
    }

    //columns is based on number of words*2 (to include spaces) + 1 (to add space at the end)
    cols = (words.length * 2) + 1;
    if (cols === 1) {
      j = 1;
      html.push('<tr>' + previousLinkHtml + '<th colspan="' + col_spans[1] + '">Base text is ' +
                data.overtext + '</th>' + nextLinkHtml + '</tr>');
    } else {
      html.push('<tr>' + previousLinkHtml + '');
      //words are just in a list so index from 0 (j will go up slower than i)
      j = 0;
      //we don't want 0 based indexing so start i at 1
      for (let i = 1; i <= cols; i += 1) {
        if (col_spans.hasOwnProperty(i)) {
          colspan = col_spans[i];
        } else {
          colspan = 1;
        }
        //if i is even add a word; if not add a blank cell
        if (i % 2 === 0) {
          html.push('<th colspan="' + colspan + '" class="NAword redips-mark ' + words[j][1] +'" id="NA_' + (i) +
                    '"><div id="NA_' + (i) + '_div">' + words[j][0] + '</div></th>');
          j += 1;
        } else {
          html.push('<th  colspan="' + colspan + '" id="NA_' + (i) + '" class="redips-mark"><div id="NA_' + (i) +
                    '_div"></div></th>');
        }
      }
      html.push(nextLinkHtml + '</tr>');

      html.push('<tr id="number_row" class="number_row"><td></td>');
      j = 1;
      for (let i = 1; i <= cols; i += 1) {
        if (col_spans.hasOwnProperty(i)) {
          colspan = col_spans[i];
        } else {
          colspan = 1;
        }
        if (i % 2 === 0) {
          html.push('<td id="num_' + j + '" colspan="' + colspan + '" class="number redips-mark">' + j + '</td>');
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
   *      highlighted_added_wits - the added wit/s that should be highlighted
   * 			highlighted_unit - a unit to mark as having an error
   * 			column_lengths - dictionary detailing widths of columns in top apparatus
   * 			overlap_details - a dictionary keyed by id of overlapping reading giving column width for that unit
   *      getUnitDataFunction - a function to be used for getUnitData when the hard coded ones are not good enough
   *      getUnitDataOptions - this allows options to be passed into the getUnitData function
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
    if (options.hasOwnProperty('highlighted_unit') &&
          options.highlighted_unit !== undefined &&
          options.highlighted_unit[0] !== 'apparatus' + app) {
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
          if (options.hasOwnProperty('highlighted_added_wits')) {
            unit_data_options.highlighted_added_wits = options.highlighted_added_wits;
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
            unit_data = OR.getUnitData(unit.readings, id_string, unit.start, unit.end, unit_data_options);
          } else {
            unit_data = _getUnitData(unit.readings, id_string, unit.start, unit.end, unit_data_options);
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
    var alpha_id, label_suffix, reading_label;
    reading_label = '';
    label_suffix = '';
    alpha_id = getAlphaId(reading_pos);
    if (reading.hasOwnProperty('reading_classes')) {
      for (let i = 0; i < reading.reading_classes.length; i += 1) {
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
        for (let i = 0; i < CL.overlappedOptions.length; i += 1) {
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
    var reading_suffix;
    reading_suffix = '';
    if (reading.hasOwnProperty('reading_classes')) {
      for (let i = 0; i < reading.reading_classes.length; i += 1) {
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
    console.log(stage);
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
          } else if (stage === 'approved') {
            OR.showApprovedVersion({
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
          } else if (stage === 'approved') {
            OR.showApprovedVersion({
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
   * 		possibilities include:
   * 			sort - boolean - do the readings need sorting (default = false)
   * 			highlighted_wit - the witness to highlight
   * 			highlighted_version - a versional witness to highlight (version editor only)
   * 			highlighted_unit - a unit to mark as having an error
   *      getUnitDataFunction - a function to be used for getUnitData when the hard coded ones are not good enough
   *      getUnitDataOptions - this allows options to be passed into the getUnitData function*/
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
    // only care about highlighted unit if we are in the right apparatus
    if (options.hasOwnProperty('highlighted_unit') &&
      options.highlighted_unit !== undefined &&
      options.highlighted_unit[0] !== 'apparatus' + app) {
      delete options.highlighted_unit;
    }
    while (j < apparatus.length) {
      unit = apparatus[j];

      unit_index = unit.start;
      if (i < unit_index) {  // we don't have a variant for this word
        rows.push(_getEmptyCell(format));
        if (format === 'set_variants') {
          spacer_rows.push(SV.getEmptySpacerCell());
        }
        i += 1;
      } else if (i === unit_index) {  // we do have a variant for this word
        if (unit.readings.length > 1 ||
          // this is now set to always show units regardless of whether they have variation
          // the unused logic is left in incase we want to revert to the old way sometime
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
          if (options.hasOwnProperty('highlighted_added_wits')) {
            unit_data_options.highlighted_added_wits = options.highlighted_added_wits;
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
            unit_data = OR.getUnitData(unit.readings, id_string, unit.start, unit.end, unit_data_options);
          } else {
            unit_data = OR.getUnitData(unit.readings, id_string, unit.start, unit.end, unit_data_options);
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
    for (let i = 0; i < unit.readings.length; i += 1) {
      if (unit.readings[i].text.length > 0) {
        return true;
      }
      if (unit.readings[i].hasOwnProperty('subreadings')) {
        for (let key in unit.readings[i].subreadings) {
          if (unit.readings[i].subreadings.hasOwnProperty(key)) {
            for (let j = 0; j < unit.readings[i].subreadings[key].length; j += 1) {
              if (unit.readings[i].subreadings[key][j].text.length > 0) {
                return true;
              }
            }
          }
        }
      }
      if (unit.readings[i].hasOwnProperty('SR_text')) {
        for (let key in unit.readings[i].SR_text) {
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
    var temp, transcription_id, hand, text, unit;
    temp = witness.split('|');
    transcription_id = temp[0];
    hand = temp[1];
    text = [];

    document.getElementById('single_witness_reading').innerHTML = '<span class="highlighted_reading"><b>' + hand + ':</b><img id="loadingbar" src="' + staticUrl + 'CE_core/images/loadingbar.gif"/></span>';
    CL.services.getUnitData(CL.context, [transcription_id], function(response) {
      var transcriptions;
      transcriptions = response.results;
      if (transcriptions.length > 0) {
        for (let i = 0; i < transcriptions.length; i += 1) {
          unit = transcriptions[i];
          if (unit.hasOwnProperty('witnesses') && unit.witnesses !== null) {
            for (let j = 0; j < unit.witnesses.length; j += 1) {
              if (unit.witnesses[j].id === hand) {
                for (let k = 0; k < unit.witnesses[j].tokens.length; k += 1) {
                  if (unit.witnesses[j].tokens[k].hasOwnProperty('gap_before')) {
                    text.push('&lt;' + unit.witnesses[j].tokens[k].gap_before_details + '&gt;');
                  }
                  if (unit.witnesses[j].tokens[k].hasOwnProperty('expanded')) {
                    text.push(unit.witnesses[j].tokens[k].expanded);
                  } else if (unit.witnesses[j].tokens[k].hasOwnProperty('original')) {
                    text.push(unit.witnesses[j].tokens[k].original);
                  } else {
                    text.push(unit.witnesses[j].tokens[k].t);
                  }
                  if (unit.witnesses[j].tokens[k].hasOwnProperty('gap_after')) {
                    text.push('&lt;' + unit.witnesses[j].tokens[k].gap_details + '&gt;');
                  }
                }
                document.getElementById('single_witness_reading').innerHTML = '<span class="highlighted_reading"><b>' + hand + ':</b> ' + CL.project.prepareDisplayString(text.join(' ')) + '</span>';
                break;
              }
            }
          } else {
            //om unit
            document.getElementById('single_witness_reading').innerHTML = '<span class="highlighted_reading"><b>' + hand + ':</b> no text</span>';
          }
        }
      } else {
        if (transcription_id === 'none') {
          document.getElementById('single_witness_reading').innerHTML = '';
        } else {
          //lac unit
          document.getElementById('single_witness_reading').innerHTML = '<span class="highlighted_reading"><b>' + hand + ':</b> no text</span>';
        }
      }
    });
  };

  findOverlapUnitById = function(id) {
    var unit;
    unit = null;
    for (let key in CL.data) {
      if (key.match(/apparatus\d*/g) !== null) {
        // This test for length here is in case we have delted a witness and left an empty line
        if (unit === null && CL.data[key].length > 0) {
          unit = findUnitById(key, id);
        }
      }
    }
    return unit;
  };

  getReading = function(reading, witness) {
    if (reading.hasOwnProperty('SR_text') && reading.SR_text.hasOwnProperty(witness)) {
      return reading.SR_text[witness];
    }
    if (reading.hasOwnProperty('subreadings')) {
      for (let key in reading.subreadings) {
        if (reading.subreadings.hasOwnProperty(key)) {
          for (let i = 0; i < reading.subreadings[key].length; i += 1) {
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
    var apparatus, witnesses, empty_witnesses, token, extra_readings, overlap, key, subreading_data, text, overlap_status;
    //first strip all the empty units displaying gaps and then recreate the ones we still need
    _cleanExtraGaps();
    _createExtraGaps();
    apparatus = CL.data.apparatus;
    for (let i = 0; i < apparatus.length; i += 1) { // loop through units
      extra_readings = [];
      for (let j = 0; j < apparatus[i].readings.length; j += 1) { // loop through readings
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
          for (let k = 0; k < witnesses.length; k += 1) {
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
      for (let j = 0; j < extra_readings.length; j += 1) {
        addReadingId(extra_readings[j], apparatus[i].start, apparatus[i].end);
        apparatus[i].readings.push(extra_readings[j]);
      }
    }
  };

  getSubreadingOfWitness = function(reading, witness, inc_SR_text) {
    if (reading.hasOwnProperty('subreadings')) {
      for (let key in reading.subreadings) {
        if (reading.subreadings.hasOwnProperty(key)) {
          for (let i = 0; i < reading.subreadings[key].length; i += 1) {
            if (reading.subreadings[key][i].witnesses.indexOf(witness) !== -1) {
              return reading.subreadings[key][i];
            }
          }
        }
      }
    }
    if (inc_SR_text === true && reading.hasOwnProperty('SR_text')) {
      for (let key in reading.SR_text) {
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
    for (let i = list.length - 1; i >= 0; i -= 1) {
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
    var html;
    html = [];
    if (CL.project.hasOwnProperty('extraFooterButtons') && CL.project.extraFooterButtons.hasOwnProperty(stage)) {
      for (let i = 0; i < CL.project.extraFooterButtons[stage].length; i += 1) {
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
      for (let i = 0; i < CL.services.extraFooterButtons[stage].length; i += 1) {
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
    if (document.getElementById('extra_buttons')) {
      document.getElementById('extra_buttons').innerHTML = html.join('');
      if (CL.services.hasOwnProperty('addExtraFooterFunctions')) {
        CL.services.addExtraFooterFunctions();
      }
    }
    return null;
  };

  makeVerseLinks = function() {
    var verse, ok;
    if (document.getElementById('previous_verse') && CL.services.hasOwnProperty('getAdjoiningUnit')) {
      CL.services.getAdjoiningUnit(CL.context, true, function(verse) { // previous
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
    if (document.getElementById('next_verse') && CL.services.hasOwnProperty('getAdjoiningUnit')) {
      CL.services.getAdjoiningUnit(CL.context, false, function(verse) { // next
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
    var set;
    set = [];
    for (let i = 0; i < list.length; i += 1) {
      if (set.indexOf(list[i]) === -1) {
        set.push(list[i]);
      }
    }
    return set;
  };

  getActiveUnitWitnesses = function(unit, appId) {
    var witnesses, i;
    witnesses = [];
    if (appId === 'apparatus') {
      i = 0;
    } else {
      i = 1;
    }
    for (i; i < unit.readings.length; i += 1) {
      witnesses.push.apply(witnesses, unit.readings[i].witnesses);
      if (unit.readings[i].hasOwnProperty('subreadings')) {
        for (let key in unit.readings[i].subreadings) {
          if (unit.readings[i].subreadings.hasOwnProperty(key)) {
            for (let j = 0; j < unit.readings[i].subreadings[key].length; j += 1) {
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
    spinner.showLoadingOverlay();
    CL.services.getUserInfo(function(user) {
      if (user) {
        collation = {
          'structure': CL.data,
          'status': status,
          'context': CL.context,
          'user': user.id
        };
        if (status === 'regularised' && CL.witnessAddingMode === true) {
          collation.data_settings = CL.savedDataSettings;
          collation.algorithm_settings = CL.savedAlgorithmSettings;
          collation.display_settings = CL.savedDisplaySettings;
        } else {
          collation.data_settings = CL.dataSettings;
          collation.algorithm_settings = CL.collationAlgorithmSettings;
          collation.display_settings = CL.displaySettings;
        }
        //approved has different rules than others.
        if (status === 'approved') {
          approval_settings = _getApprovalSettings();
          collation.id = CL.context + '_' + status;
          confirm_message = 'This project already has an approved version of this verse.\nAre you sure you want ' +
                            'to overwrite the currently saved version with this one?';
          success_message = 'Approve successful';
        } else {
          approval_settings = [true, undefined];
          collation.id = CL.context + '_' + status + '_' + user.id;
          if (CL.witnessEditingMode === false) {
            confirm_message = 'You already have this verse saved at this stage in this environment.\n' +
                              'Are you sure you want to overwrite the currently saved version with this one?';
          }
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
            CL.isDirty = false;
            if (typeof success_callback !== 'undefined') {
              success_callback();
            }
          }
          spinner.removeLoadingOverlay();
        });
      }
    });
  };

  sortWitnesses = function(witnesses) {
    if (CL.project.hasOwnProperty('witnessSort')) {
      //use a project function if there is one
      runFunction(CL.project.witnessSort, [witnesses]);
    } else if (CL.services && CL.services.hasOwnProperty('witnessSort')) {
      //or use the default for the services if there is one
      runFunction(CL.services.witnessSort, [witnesses]);
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
    var wit_menu, witnesses, witness_html, window_height, menu_height, sub_types, id, left, top, wit_form_height;
    left = menu_pos.left;
    top = menu_pos.top;
    //if there is already an old menu hanging around remove it
    if (document.getElementById('wit_form')) {
      document.getElementsByTagName('body')[0].removeChild(document.getElementById('wit_form'));
    }
    //show the select witnesses menu
    wit_menu = document.createElement('div');
    wit_menu.setAttribute('id', 'wit_form');
    wit_menu.setAttribute('class', 'wit_form dialogue_form');
    witnesses = sortWitnesses(getAllReadingWitnesses(reading));
    witness_html = ['<div class="dialogue_form_header drag-zone">' + details.header + '</div><form id="select_wit_form">'];
    witness_html.push('<label>Selected reading: </label><span>');
    witness_html.push(CL.extractWitnessText(reading));
    witness_html.push('</span>');
    if (witnesses.length > 1 && (!details.hasOwnProperty('witness_select') || details.witness_select !== false)) {
      witness_html.push('<div id="wit_scroller"><input type="checkbox" id="wit_select_all">Select All</input><br/>');
      for (let i = 0; i < witnesses.length; i += 1) {
        if (witnesses[i] !== CL.dataSettings.base_text_siglum) {
          witness_html.push('<input type="checkbox" id="' + witnesses[i] + '" name="' + witnesses[i] + '" value="' +
                            witnesses[i] + '">' + witnesses[i] + '</input><br/>');
        }
      }
      witness_html.push('</div>');
    } else {
      for (let i = 0; i < witnesses.length; i += 1) {
        witness_html.push('<input type="hidden" name="' + witnesses[i] + '" value="true"/><br/>');
      }
    }
    if (details.type === 'overlap') {
      // squelch
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
    left = parseInt(left) - document.getElementById('scroller').scrollLeft;
    if (left + document.getElementById('wit_form').offsetWidth > window.innerWidth) {
      left = left - document.getElementById('wit_form').offsetWidth;
    }
    if (left < 0) {
      left = 4;
    }
    document.getElementById('wit_form').style.left = left + 'px';
    drag.initDraggable('wit_form', true, true);
    window_height = window.innerHeight;
    wit_form_height = document.getElementById('wit_form').offsetHeight - 43;
    document.getElementById('select_wit_form').style.height = wit_form_height + 'px';
    if (details.hasOwnProperty('form_size') && details.form_size === 'small') {
      menu_height = Math.max(wit_form_height - 100, 50);
    } else if (details.type === 'SVsubreading' || details.type === 'ORsubreading') {
      menu_height = Math.max(wit_form_height - 235, 50);
    } else {
      menu_height = Math.max(wit_form_height - 173, 50);
    }
    if (witnesses.length > 1 && (!details.hasOwnProperty('witness_select') || details.witness_select !== false)) {
      document.getElementById('wit_scroller').style.maxHeight = menu_height + 'px';
    }
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
    var i, reading, parents, unit, new_reading_id, subreading_classes, total_reading_witnesses, callback;
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
      var extra_details, data, witness_list, key, uni, callbackt;
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
        callback = function(){  document.getElementsByTagName('body')[0].removeChild(document.getElementById('wit_form'));};
        if (format === 'set_variants') {
          SV.makeStandoffReading(type, reading_details, data.parent_reading, callback);
        } else if (format === 'order_readings') {
          OR.makeStandoffReading(type, reading_details, data.parent_reading, callback);
        }
      }
    });
  };

  findUnitPosById = function(app_id, unit_id, data) {
    if (data === undefined) {
      data = CL.data;
    }
    if (data.hasOwnProperty(app_id)) {
      for (let i = 0; i < CL.data[app_id].length; i += 1) {
        if (data[app_id][i]._id === unit_id) {
          return i;
        }
      }
    }
    return null;
  };

  findReadingById = function(unit, id) {
    for (let i = 0; i < unit.readings.length; i += 1) {
      if (unit.readings[i].hasOwnProperty('_id') && unit.readings[i]._id === id) {
        return unit.readings[i];
      }
    }
    return null;
  };

  applyPreStageChecks = function(stage) {
    var preStageChecks, result;
    preStageChecks = _getPreStageChecks(stage);
    for (let i = 0; i < preStageChecks.length; i += 1) {
      result = runFunction(preStageChecks[i]['function']);
      if (result !== preStageChecks[i].pass_condition) {
        return [false, preStageChecks[i].fail_message];
      }
    }
    return [true];
  };

  _extractAllTValuesForRGAppliedRules = function(reading, unit, apparatus) {
    var witness, tValue, tokensForSettings, structuredTokens;
    tokensForSettings = [];
    if (reading.hasOwnProperty('subreadings')) {
      for (let key in reading.subreadings) {
        if (reading.subreadings.hasOwnProperty(key)) {
          for (let i = reading.subreadings[key].length - 1; i >= 0; i -= 1) {
            let k = reading.subreadings[key][i].witnesses.length - 1;
            while (k >= 0) {
              witness = reading.subreadings[key][i].witnesses[k];
              if (findStandoffRegularisation(unit, witness, apparatus) === null) {
                for(let j = 0; j < reading.subreadings[key][i].text.length; j += 1) {
                  if (reading.subreadings[key][i].text[j][witness].hasOwnProperty('decision_details')) {
                    tValue = reading.subreadings[key][i].text[j][witness].decision_details[0].t;
                    if (tokensForSettings.indexOf(tValue) === -1) {
                      tokensForSettings.push(tValue);
                    }
                  }
                }
              }
              k -= 1;
            }
          }
        }
      }
    }
    structuredTokens = [];
    for (let i=0; i<tokensForSettings.length; i+=1) {
      structuredTokens.push({'t': tokensForSettings[i]});
    }
    return structuredTokens;
  };

  makeStandoffReading = function(type, reading_details, parent_id, outerCallback) {
    var apparatus, unit, parent, reading, fosilised_reading, tValuesForSettings, options, displaySettings,
        resultCallback, data;
    data = {};
    apparatus = reading_details.app_id;
    unit = findUnitById(apparatus, reading_details.unit_id);
    parent = findReadingById(unit, parent_id);
    SR.loseSubreadings(); //must always lose subreadings first or find subreadings doesn't find them all!
    SR.findSubreadings({
      'unit_id': unit._id
    }); //we need this to see if we have any!
    reading = findReadingById(unit, reading_details.reading_id);
    fosilised_reading = JSON.parse(JSON.stringify(reading));
    tValuesForSettings = _extractAllTValuesForRGAppliedRules(reading, unit, apparatus);
    options = {};
    displaySettings = {};
    for (let setting in CL.displaySettings) {
      if (CL.displaySettings.hasOwnProperty(setting)) {
        if (CL.displaySettings[setting] === true) {
          displaySettings[setting] = CL.displaySettings[setting];
        }
      }
    }
    options.display_settings = displaySettings;
    options.display_settings_config = CL.displaySettingsDetails;

    resultCallback = function(data) {
      var baseReadingsWithSettingsApplied;
      baseReadingsWithSettingsApplied = {};
      for (let i = 0; i < data.tokens.length; i += 1) {
        baseReadingsWithSettingsApplied[data.tokens[i].t] = data.tokens[i]['interface'];
      }
      _makeStandoffReading2(reading, fosilised_reading, parent, baseReadingsWithSettingsApplied, type, unit, apparatus, reading_details);
      if (outerCallback !== undefined) {
        outerCallback();
      }
    };
    data.tokens = tValuesForSettings;
    data.options = options;
    CL.services.applySettings(data, resultCallback);
  };

  _makeStandoffReading2 = function (reading, fosilised_reading, parent, baseReadingsWithSettingsApplied, type, unit,
                                    apparatus, reading_details) {
    var ids, new_reading, witness;
    //do any existing subreadings
    if (reading.hasOwnProperty('subreadings')) {
      // now here is the tricky bit - if this subreading is a subreading because of work done in the regulariser we
      // need to preserve those decisions in the reading_history of the standoff subreading we are about to create.
      // To do this we need to pretend these are already standoff marked readings and add the data to the standoff
      // marked readings datastructure
      for (let key in reading.subreadings) {
        if (reading.subreadings.hasOwnProperty(key)) {
          for (let i = reading.subreadings[key].length - 1; i >= 0; i -= 1) {
            let k = reading.subreadings[key][i].witnesses.length - 1;
            //TODO: what is this doing and why is it so complicated! i is going backwards anyway so why check i here?
            while (reading.hasOwnProperty('subreadings') && reading.subreadings.hasOwnProperty(key) && i < reading.subreadings[key].length && k >= 0) {
              witness = reading.subreadings[key][i].witnesses[k];
              if (findStandoffRegularisation(unit, witness, apparatus) === null) {
                _makeRegDecisionsStandoff(type, apparatus, unit, reading, parent, reading.subreadings[key][i], witness, baseReadingsWithSettingsApplied);
                makeMainReading(unit, reading, key, i, {
                  'witnesses': [witness]
                });
              } else { //if we get here we must already have dealt with any regulaisations made in RG for this reading
                ids = makeMainReading(unit, reading, key, i, {
                  'witnesses': [witness]
                });
                for (let j = 0; j < ids.length; j += 1) {
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
    SV.prepareForOperation();
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
    var key, rule_details, reading_text, details, existing_standoff, position, total, temp, type_string;
    SR.loseSubreadings(); //needs to be done so the main reading we are dealing with contains *all* witnesses including those of subreadings
    rule_details = getRuleClasses('value', type, 'value', ['suffixed_sigla', 'identifier', 'name', 'subreading', 'suffixed_label']);
    //mark it as a standoff reading
    for (let i = 0; i < reading.witnesses.length; i += 1) {
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
    parent_pos = findReadingPosById(unit, parent._id);
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
      //TODO
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
    var numbers, app_ids;
    numbers = [];
    app_ids = [];
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.match(/apparatus\d/g) !== null) {
          numbers.push(parseInt(key.replace('apparatus', '')));
        }
      }
    }
    numbers.sort((a, b) => a - b);
    for (let i = 0; i < numbers.length; i += 1) {
      app_ids.push('apparatus' + numbers[i]);
    }
    return app_ids;
  };


  _removeWitnessFromUnit = function(unit, hand) {
    var reading, overlapIdsForDeletion;
    for (let i = 0; i < unit.readings.length; i += 1) {
      reading = unit.readings[i];
      if (reading.witnesses.indexOf(hand) !== -1) {
        reading.witnesses.splice(reading.witnesses.indexOf(hand), 1);
        if (reading.witnesses.length === 0) { //this was the only witness so remove the whole reading
          unit.readings[i] = null;
        } else { // we are not removing the whole reading so we need to remove the data from each word in 'text'
          for (let j = 0; j < reading.text.length; j += 1) {
            delete reading.text[j][hand];
            if (reading.text[j].reading.indexOf(hand) !== -1) {
              reading.text[j].reading.splice(reading.text[j].reading.indexOf(hand), 1);
            }
          }
        }
      }
      if (reading.hasOwnProperty('SR_text') && reading.SR_text.hasOwnProperty(hand)) {
        delete reading.SR_text[hand];
      }
      if (reading.hasOwnProperty('SR_text') && $.isEmptyObject(reading.SR_text)) {
        delete reading.SR_text;
      }
    }
    removeNullItems(unit.readings);
    // this part removes the any references to a deleted overlap reading in the top line
    overlapIdsForDeletion = [];
    if (unit.hasOwnProperty('overlap_units')) {
      for (let key in unit.overlap_units) {
        if (unit.overlap_units[key].indexOf(hand) !== -1) {
          unit.overlap_units[key].splice(unit.overlap_units[key].indexOf(hand), 1);
          if (unit.overlap_units[key].length === 0) {
            overlapIdsForDeletion.push(key);
          }
        }
      }
    }
    for (let i = 0; i < overlapIdsForDeletion.length; i += 1) {
      delete unit.overlap_units[overlapIdsForDeletion[i]];
    }
    return true;
  };

  setUpRemoveWitnessesForm = function(wits, data, stage, removeFunction) {
    var html, transcriptionIds, sigla;
    document.getElementById('remove_witnesses_div').style.left = document.getElementById('scroller').offsetWidth - document.getElementById('remove_witnesses_div').offsetWidth - 15 + 'px';
    transcriptionIds = {};
    for (let i=0; i<wits.length; i+=1) {
      for (let key in data.hand_id_map) {
        if (data.hand_id_map.hasOwnProperty(key) && data.hand_id_map[key] === wits[i]) {
          if (transcriptionIds.hasOwnProperty(wits[i])) {
            transcriptionIds[wits[i]].push(key);
          } else {
            transcriptionIds[wits[i]] = [key];
          }
        }
      }
    }
    html = [];
    //add a select all option
    html.push('<input class="boolean" type="checkbox" id="select_all" name="select_all"/><label>Select all</label><br/>');
    for (let key in transcriptionIds) {
      if (transcriptionIds[key].length > 1) {
        sigla = transcriptionIds[key].join('/');
        html.push('<input class="witness_select" type="checkbox" id="' + key + '" value="' + transcriptionIds[key].join('|') +
                  '" name="' + key + '"/>' +'<label>' + sigla + '</label><br/>');
      } else {
        sigla = transcriptionIds[key][0];
        html.push('<input class="witness_select" type="checkbox" id="' + key + '" value="' + sigla +
                  '" name="' + key + '"/>' +'<label>' + sigla + '</label><br/>');
      }

    }
    document.getElementById('witness_checkboxes').innerHTML = html.join('');
    drag.initDraggable('remove_witnesses_div', true, true);
    // DND.InitDragDrop('remove_witnesses_div', true, true);
    $('#select_all').on('click', function () {
      if ($(this).is(':checked')) {
        $('.witness_select').each(function() {
          $(this).prop('checked', true);
        });
      } else {
        $('.witness_select').each(function() {
          $(this).prop('checked', false);
        });
      }
    });
    $('.witness_select').on('click', function () {
      if (!$(this).is(':checked')) {
        $('#select_all').prop('checked', false);
      }
      if ($('.witness_select').length == $('.witness_select:checked').length) {
        $('#select_all').prop('checked', true);
      }
    });
    if (removeFunction !== undefined) {
      $('#remove_selected_button').on('click', removeFunction);
    } else {
      $('#remove_selected_button').on('click', function () {
        var handsToRemove;
        handsToRemove = getRemoveWitnessDataFromForm('remove_witnesses_form');
        removeWitnesses(handsToRemove, stage);
        CL.isDirty = true;
      });
    }
  };

  getRemoveWitnessDataFromForm = function (formId) {
    var data, handsToRemove, hands;
    handsToRemove = [];
    data = cforms.serialiseForm('remove_witnesses_form');
    for (let key in data) {
      if (data.hasOwnProperty(key) && data[key] !== null && data[key] !== true) {
        hands = data[key].split('|');
        for (let i=0; i<hands.length; i+=1) {
          handsToRemove.push(hands[i]);
        }
      }
    }
    return handsToRemove;
  };

  removeWitnesses = function(hands, stage) {
    console.log('^^^^^^^^^^ remove witnesses');
    var success, i, dataCopy, witnessListCopy;
    spinner.showLoadingOverlay();

    dataCopy = JSON.parse(JSON.stringify(CL.data));
    witnessListCopy = CL.dataSettings.witness_list.slice(0);
    success = true;
    i = 0;
    while (success === true && i < hands.length) {
      success = removeWitness(hands[i]);
      i += 1;
    }
    if (success === false) {
      CL.dataSettings.witness_list = witnessListCopy.slice(0);
      CL.data = JSON.parse(JSON.stringify(dataCopy));
    } else {
      CL.isDirty = true;
    }
    if (stage === 'regularised') {
      RG.showVerseCollation(CL.data, CL.context, CL.container);
    } else if (stage === 'set') {
      // must be the full showSetVariants here in order to update highlight menu and any highlighted text
      SV.showSetVariants({
        'container': CL.container
      });
    }
    spinner.removeLoadingOverlay();
  };

  returnToSummaryTable = function (callback) {
    var ok;
    //save warning
    if (CL.isDirty) {
      ok = confirm('Changes have been made to the collation since it was last saved.' +
                   '\nThese changes will be lost if you return to the summary table.\n\nAre you sure ' +
                   'you want to return to the summary table?');
    } else {
      ok = true;
    }
    if (ok) {
      //return to Table
      //remove the witness removal window if shown
      if (document.getElementById('remove_witnesses_div')) {
        document.getElementById('remove_witnesses_div').parentNode.removeChild(document.getElementById('remove_witnesses_div'));
      }
      if (callback !== undefined) {
        callback();
      }
      document.getElementById('container').innerHTML = '<div id="saved_collations_div"></div>';
      _findSaved(CL.context);
    }
  };


  //NB: special all gap pop up units will sort themselves out in the display phase
  removeWitness = function(hand) {
    var documentId, genuineReadingFound;
    //check it isn't the overtext which cannot be removed
    if (hand === CL.data.overtext_name) {
      alert('The basetext cannot be removed. This verse must be recollated with a new basetext.');
      return false;
    }
    //apparatuses
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.indexOf('apparatus') !== -1) {
          for (let i = 0; i < CL.data[key].length; i += 1) {
            _removeWitnessFromUnit(CL.data[key][i], hand);
            if (key === 'apparatus') { //this is a main apparatus unit so delete if only om and lac readings remain
              genuineReadingFound = false;
              for (let j = 0; j < CL.data[key][i].readings.length; j += 1) {
                if (CL.data[key][i].readings[j].text.length > 0 ||
                      CL.data[key][i].readings[j].hasOwnProperty('SR_text')) {
                  genuineReadingFound = true;
                }
              }
              if (genuineReadingFound === false) {
                CL.data[key][i] = null;
              }
            } else { //this is an overlapped unit so if only one reading remains delete it
              if (CL.data[key][i].readings.length === 1) {
                CL.data[key][i] = null;
              }
            }
          }
          CL.removeNullItems(CL.data[key]);
        }
      }
    }
    //lac readings
    if (CL.data.lac_readings.indexOf(hand) !== -1) {
      CL.data.lac_readings.splice(CL.data.lac_readings.indexOf(hand), 1);
    }
    //om readings
    if (CL.data.om_readings.indexOf(hand) !== -1) {
      CL.data.om_readings.splice(CL.data.om_readings.indexOf(hand), 1);
    }
    //hand id map
    documentId = CL.data.hand_id_map[hand];
    delete CL.data.hand_id_map[hand];
    if (CL.dataSettings.witness_list.indexOf(documentId) !== -1) {
      CL.dataSettings.witness_list.splice(CL.dataSettings.witness_list.indexOf(documentId), 1);
    }
    return SV.areAllUnitsComplete();
  };

  /* Menu Loading */
  //optionally called by initialise editor in services if they want to set up the page using js
  //alternatively services can control this themselves but instead must call addIndexHandlers in the
  //initialisation function
  loadIndexPage = function(project) {
    var url;
    url = staticUrl;
    // the form not always used but the default will always have a form value and if implementations are skipping
    // it then that is fine because they will deal with the form themselves.
    if (_contextInput && contextInput.hasOwnProperty('form') && contextInput.form !== null) {
      url += _contextInput.form;
    }
    if (url === staticUrl) {
      alert('The location of the form has not been specified so the page cannot be loaded.');
      console.log('The form url should be specified contextInput.form in either the services file or project configuration.');
      return;
    }
    $.get(url, function(html) {
      CL.container.innerHTML = html;
      document.getElementById('project_name').innerHTML = CL.project.name;
      if (_contextInput && _contextInput.hasOwnProperty('onload_function') && _contextInput.onload_function !== null) {
        runFunction(_contextInput.onload_function, [CL.project]);
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
        //just set these all to false as a precaution
        CL.witnessEditingMode = false;
        CL.witnessAddingMode = false;
        CL.witnessRemovingMode = false;
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
    var details;
    details = [];
    for (let key in CL.data.hand_id_map) {
      if (CL.data.hand_id_map.hasOwnProperty(key)) {
        details.push({'hand': key, 'document': CL.data.hand_id_map[key]+ '|' + key});
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

  //*********  private functions *********

  _initialiseEditor = function() {
    CL.container = document.getElementById('container'); //can be overridden in services if needed
    //set the dynamic screen resize
    expandFillPageClients();
    $(window).on('resize', function() {
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


    CL.project.witnesses = project.witnesses;
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
    if (project.hasOwnProperty('extractWordsForHeader') && typeof project.extractWordsForHeader === 'string') {
      CL.project.extractWordsForHeader = _getFunctionFromString(project.extractWordsForHeader);
    }

    if (project.hasOwnProperty('prepareDisplayString') && typeof project.prepareDisplayString === 'string') {
      CL.project.prepareDisplayString = _getFunctionFromString(project.prepareDisplayString);
    } else if (CL.services.hasOwnProperty('prepareDisplayString')) {
      CL.project.prepareDisplayString = CL.services.prepareDisplayString;
    } else {
      CL.project.prepareDisplayString = function (string) {
        return string;
      };
    }

    if (project.hasOwnProperty('prepareNormalisedString') && typeof project.prepareNormalisedString === 'string') {
      CL.project.prepareNormalisedString = _getFunctionFromString(project.prepareNormalisedString);
    } else if (CL.services.hasOwnProperty('prepareNormalisedString')) {
      CL.project.prepareNormalisedString = CL.services.prepareNormalisedString;
    } else {
      CL.project.prepareNormalisedString = function (string) {
        return string;
      };
    }

    //settings for collapse all button (rarely used so allowing as option to keep footer clean)
    if (project.hasOwnProperty('showCollapseAllUnitsButton')) {
      CL.project.showCollapseAllUnitsButton = project.showCollapseAllUnitsButton;
    } else if (CL.services.hasOwnProperty('showCollapseAllUnitsButton')) {
      CL.project.showCollapseAllUnitsButton = CL.services.showCollapseAllUnitsButton;
    } else {
      //default is false
      CL.project.showCollapseAllUnitsButton = false;
    }

    //settings for get apparatus button in approved view
    if (project.hasOwnProperty('showGetApparatusButton')) {
      CL.project.showGetApparatusButton = project.showGetApparatusButton;
    } else if (CL.services.hasOwnProperty('showGetApparatusButton')) {
      CL.project.showGetApparatusButton = CL.services.showGetApparatusButton;
    } else {
      //default is true
      CL.project.showGetApparatusButton = true;
    }

    if (CL.project.showGetApparatusButton === true &&
          !CL.services.hasOwnProperty('getApparatusForContext') &&
          !CL.services.hasOwnProperty('apparatusServiceUrl')) {
      //then we don't have enough info to use get apparatus so override settings and do not show the button
      console.log('The get apparatus button will not be shown as the required data for running the service was not ' +
                  'available. Either getApparatusForContext or apparatusServiceUrl must be provided in the services ' +
                  'file to be able to show the get apparatus button.');
      CL.project.showGetApparatusButton = false;
    }

    // set the algorithm settings
    if (project.hasOwnProperty('collationAlgorithmSettings')) {
      CL.collationAlgorithmSettings = project.collationAlgorithmSettings;
    } else if (CL.services.hasOwnProperty('collationAlgorithmSettings')) {
      CL.collationAlgorithmSettings = CL.services.collationAlgorithmSettings;
    } else {
      //default is changed from previous releases
      CL.collationAlgorithmSettings = {'algorithm': 'dekker',
                              'fuzzy_match': true,
                              'distance': 2};
    }

    //OR lac and OM
    // combine all lacs
    if (project.hasOwnProperty('combineAllLacsInOR')) {
      CL.project.combineAllLacsInOR = project.combineAllLacsInOR;
    } else if (CL.services.hasOwnProperty('combineAllLacsInOR')) {
      CL.project.combineAllLacsInOR = CL.services.combineAllLacsInOR;
    } else {
      //default is false
      CL.project.combineAllLacsInOR = false;
    }
    //combine all oms
    if (project.hasOwnProperty('combineAllOmsInOR')) {
      CL.project.combineAllOmsInOR = project.combineAllOmsInOR;
    } else if (CL.services.hasOwnProperty('combineAllOmsInOR')) {
      CL.project.combineAllOmsInOR = CL.services.combineAllOmsInOR;
    } else {
      //default is false
      CL.project.combineAllOmsInOR = false;
    }

    //approved lac and OM
    // combine all lacs
    if (project.hasOwnProperty('combineAllLacsInApproved')) {
      CL.project.combineAllLacsInApproved = project.combineAllLacsInApproved;
    } else if (CL.services.hasOwnProperty('combineAllLacsInApproved')) {
      CL.project.combineAllLacsInApproved = CL.services.combineAllLacsInApproved;
    } else {
      //default is false
      CL.project.combineAllLacsInApproved = false;
    }
    //combine all oms
    if (project.hasOwnProperty('combineAllOmsInApproved')) {
      CL.project.combineAllOmsInApproved = project.combineAllOmsInApproved;
    } else if (CL.services.hasOwnProperty('combineAllOmsInApproved')) {
      CL.project.combineAllOmsInApproved = CL.services.combineAllOmsInApproved;
    } else {
      //default is false
      CL.project.combineAllOmsInApproved = false;
    }


    if (project.hasOwnProperty('lacUnitLabel')) {
      CL.project.lacUnitLabel = project.lacUnitLabel;
    } else if (CL.services.hasOwnProperty('lacUnitLabel')) {
      CL.project.lacUnitLabel = CL.services.lacUnitLabel;
    } else {
      CL.project.lacUnitLabel = 'lac unit';
    }

    if (project.hasOwnProperty('omUnitLabel')) {
      CL.project.omUnitLabel = project.omUnitLabel;
    } else if (CL.services.hasOwnProperty('omUnitLabel')) {
      CL.project.omUnitLabel = CL.services.omUnitLabel;
    } else {
      CL.project.omUnitLabel = 'om unit';
    }

    if (CL.services.hasOwnProperty('undoStackLength')) {
      SV.undoStackLength = CL.services.undoStackLength;
    } //default in SV cannot be overriden in projects due to potential memory issues


    //settings for witness changes
    if (project.hasOwnProperty('allowWitnessChangesInSavedCollations')) {
      CL.project.allowWitnessChangesInSavedCollations = project.allowWitnessChangesInSavedCollations;
    } else if (CL.services.hasOwnProperty('allowWitnessChangesInSavedCollations')) {
      CL.project.allowWitnessChangesInSavedCollations = CL.services.allowWitnessChangesInSavedCollations;
    } else {
      //default is false
      CL.project.allowWitnessChangesInSavedCollations = false;
    }

    //this bit does the index page settings.
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
    setRuleClasses(project);
    _setDisplaySettings(project);
    _setLocalPythonFunctions(project);
    _setRuleConditions(project);
    setOverlappedOptions(project);
  };

  setRuleClasses = function(project) {
    if (project.hasOwnProperty('ruleClasses') && project.ruleClasses !== undefined) {
      CL.ruleClasses = project.ruleClasses;
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

  setOverlappedOptions = function(project) {
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
    var context;
    spinner.showLoadingOverlay();
    CL.dataSettings.language = document.getElementById('language').value;
    CL.dataSettings.base_text = document.getElementById('base_text').value;
    context = _getContextFromInputForm();
    if (context && CL.dataSettings.base_text !== 'none') {
      CL.context = context;
      CL.dataSettings.witness_list = _getWitnessesFromInputForm();
      CL.debug = _getDebugSetting();
      RG.getCollationData(output, 0);
    }
  };

  /* Initial page load functions */
  _findSaved = function(context) {
    spinner.showLoadingOverlay();
    if (context === undefined) {
      context = _getContextFromInputForm();
    }
    if (context) {
      CL.services.getSavedCollations(context, undefined, function(collations) {
        CL.services.getCurrentEditingProject(function(project) {
          _showSavedVersions(collations, project.witnesses, context);
        });
      });
    } else {
      spinner.removeLoadingOverlay();
    }

  };

  _getContextFromInputForm = function() {
    var context;
    if (_contextInput && _contextInput.hasOwnProperty('result_provider') && _contextInput.result_provider !== null) {
      context = runFunction(_contextInput.result_provider);
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

  _showSavedVersions = function(data, projectWitnesses, context) {
    var by_user, users, user, i, status, date, minutes, datestring, approved;
    by_user = {};
    users = [];
    //reset default settings just for safety - shouldn't really be needed
    CL.witnessEditingMode = false;
    CL.witnessAddingMode = false;
    CL.witnessRemovingMode = false;

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
          by_user[user].regularised = {};
          by_user[user].regularised.witness_comparison = checkWitnessesAgainstProject(data[i].data_settings.witness_list, projectWitnesses);
          by_user[user].regularised.radio_button = _getSavedRadio(data[i].id, by_user[user].regularised.witness_comparison[1], datestring);
        } else if (data[i].status === 'set') {
          by_user[user].set = {};
          by_user[user].set.witness_comparison = checkWitnessesAgainstProject(data[i].data_settings.witness_list, projectWitnesses);
          by_user[user].set.radio_button = _getSavedRadio(data[i].id, by_user[user].set.witness_comparison[1], datestring);
        } else if (data[i].status === 'ordered') {
          by_user[user].ordered = {};
          by_user[user].ordered.witness_comparison = checkWitnessesAgainstProject(data[i].data_settings.witness_list, projectWitnesses);
          by_user[user].ordered.radio_button = _getSavedRadio(data[i].id, by_user[user].ordered.witness_comparison[1], datestring);
        } else if (data[i].status === 'approved') {
          approved = {};
          approved.witness_comparison = checkWitnessesAgainstProject(data[i].data_settings.witness_list, projectWitnesses);
          approved.radio_button = _getSavedRadio(data[i].id, approved.witness_comparison[1], datestring);
        }
      }
    } else {
      document.getElementById('witnesses').innerHTML = '<p>There are no saved collations of this verse</p>';
      spinner.removeLoadingOverlay();
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
      spinner.removeLoadingOverlay();
    });
  };

  checkWitnessesAgainstProject = function(dataWitnesses, projectWitnesses) {
    var dataWits = dataWitnesses.slice();
    var projectWits = projectWitnesses.slice();
    var extraWits = [];
    for (let i=0; i < dataWits.length; i+=1) {
      if (projectWits.indexOf(dataWits[i]) !== -1) {
        projectWits.splice(projectWits.indexOf(dataWits[i]), 1);
      } else {
        extraWits.push(dataWits[i]);
      }
    }
    if (extraWits.length === 0 && projectWits.length === 0) {
      return [true, 'same'];
    }
    if (extraWits.length > 0 && projectWits.length > 0) {
      return [false, 'both', extraWits, projectWits];
    }
    if (extraWits.length === 0 && projectWits.length > 0) {
      return [false, 'added', extraWits, projectWits];
    }
    if (extraWits.length > 0 && projectWits.length === 0) {
      return [false, 'removed', extraWits, projectWits];
    }
  };

  _getSavedRadio = function(id,  witnessComparison, datestring) {
    return '<input class="' + witnessComparison + '" type="radio" name="saved_collation" value="' + id + '">' + datestring + '</input>';
  };

  _makeSavedCollationTable = function(by_user, approved, users, context) {
    var html, i, user_map, user, userCount, firstRow, witnessComparisonClass, hoveroverText, footerHtml,
    hasCollationsWithWitsToAdd, hasCollationsWithWitsToRemove;
    hasCollationsWithWitsToRemove = false;
    hasCollationsWithWitsToAdd = false;
    html = [];
    if (document.getElementById('collation_form')) {
      document.getElementById('collation_form').style.display = 'none';
    }
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
          if (CL.project.allowWitnessChangesInSavedCollations === true) {
            if (by_user[user].regularised.witness_comparison[0] === false) {
              witnessComparisonClass = by_user[user].regularised.witness_comparison[1];
              if (witnessComparisonClass === 'added') {
                hasCollationsWithWitsToAdd = true;
                hoveroverText = 'The witnesses in the project do not agree with those in this collation. Project witnesses have been added.';
              } else if (witnessComparisonClass === 'removed') {
                hasCollationsWithWitsToRemove = true;
                hoveroverText = 'The witnesses in the project do not agree with those in this collation. Project witnesses have been removed.';
              } else if (witnessComparisonClass === 'both') {
                hasCollationsWithWitsToRemove = true;
                hasCollationsWithWitsToAdd = true;
                hoveroverText = 'The witnesses in the project do not agree with those in this collation. Project witnesses have been both removed and added.';
              }
            } else {
              witnessComparisonClass = 'same';
              hoveroverText = '';
            }
            html.push('<td title="' + hoveroverText + '" class="regularised ' + witnessComparisonClass + '">' + by_user[user].regularised.radio_button + '</td>');
          } else {
            html.push('<td>' + by_user[user].regularised.radio_button + '</td>');
          }
        } else {
          html.push('<td></td>');
        }
        if (by_user[user].hasOwnProperty('set')) {
          if (CL.project.allowWitnessChangesInSavedCollations === true) {
            if (by_user[user].set.witness_comparison[0] === false) {
              witnessComparisonClass = by_user[user].set.witness_comparison[1];
              if (witnessComparisonClass === 'added') {
                hasCollationsWithWitsToAdd = true;
                hoveroverText = 'The witnesses in the project do not agree with those in this collation. Project witnesses have been added.';
              } else if (witnessComparisonClass === 'removed') {
                hasCollationsWithWitsToRemove = true;
                hoveroverText = 'The witnesses in the project do not agree with those in this collation. Project witnesses have been removed.';
              } else if (witnessComparisonClass === 'both') {
                hasCollationsWithWitsToRemove = true;
                hasCollationsWithWitsToAdd = true;
                hoveroverText = 'The witnesses in the project do not agree with those in this collation. Project witnesses have been both removed and added.';
              }
            } else {
              witnessComparisonClass = 'same';
              hoveroverText = '';
            }
            html.push('<td title="' + hoveroverText + '" class="set ' + witnessComparisonClass + '">' + by_user[user].set.radio_button + '</td>');
          } else {
            html.push('<td>' + by_user[user].set.radio_button + '</td>');
          }
        } else {
          html.push('<td></td>');
        }
        if (by_user[user].hasOwnProperty('ordered')) {
          if (CL.project.allowWitnessChangesInSavedCollations === true) {
            if (by_user[user].ordered.witness_comparison[0] === false) {
              witnessComparisonClass = by_user[user].ordered.witness_comparison[1];
              if (witnessComparisonClass === 'added') {
                hoveroverText = 'The witnesses in the project do not agree with those in this collation. Project witnesses have been added. This cannot be fixed at the order readings stage. The witnesses must be added at a previous stage and this stage must be completed again.';
              } else if (witnessComparisonClass === 'removed') {
                //hasCollationsWithWitsToRemove = true;
                hoveroverText = 'The witnesses in the project do not agree with those in this collation. Project witnesses have been removed. This cannot be fixed at the order readings stage. The witnesses must be removed at a previous stage and this stage must be completed again.';
              } else if (witnessComparisonClass === 'both') {
                //hasCollationsWithWitsToRemove = true;
                hoveroverText = 'The witnesses in the project do not agree with those in this collation. Project witnesses have been both removed and added. This cannot be fixed at the order readings stage. The witnesses must be removed at a previous stage and this stage must be completed again.';
              }
            } else {
              witnessComparisonClass = 'same';
              hoveroverText = '';
            }
            html.push('<td title="' + hoveroverText + '" class="ordered ' + witnessComparisonClass + '">' + by_user[user].ordered.radio_button + '</td>');
          } else {
            html.push('<td>' + by_user[user].ordered.radio_button + '</td>');
          }
        } else {
          html.push('<td></td>');
        }
        if (firstRow === true && approved !== undefined) {
          if (CL.project.allowWitnessChangesInSavedCollations === true) {
            if (approved.witness_comparison[0] === false) {
              witnessComparisonClass = approved.witness_comparison[1];
              if (witnessComparisonClass === 'added') {
                hoveroverText = 'The witnesses in the project do not agree with those in this collation. Project witnesses have been added. This cannot be fixed in an approved collation. The witnesses must be added at a previous stage, order readings redone and then the new version must be approved.';
              } else if (witnessComparisonClass === 'removed') {
                //hasCollationsWithWitsToRemove = true;
                hoveroverText = 'The witnesses in the project do not agree with those in this collation. Project witnesses have been removed. This cannot be fixed in an approved collation. The witnesses must be removed at a previous stage, order readings redone and then the new version must be approved.';
              } else if (witnessComparisonClass === 'both') {
                //hasCollationsWithWitsToRemove = true;
                hoveroverText = 'The witnesses in the project do not agree with those in this collation. Project witnesses have been both removed and added. This cannot be fixed in an approved collation. The witnesses must be removed and added at a previous stage, order readings redone and then the new version must be approved.';
              }
            } else {
              witnessComparisonClass = 'same';
              hoveroverText = '';
            }
            html.push('<td title="' + hoveroverText + '" class="approved ' + witnessComparisonClass + '" rowspan="' + userCount +'">' + approved.radio_button + '</td>');
          } else {
            html.push('<td rowspan="' + userCount +'">' + approved.radio_button + '</td>');
          }
          firstRow = false;
        }
        html.push('</tr>');
      }
    }
    html.push('</table>');
    html.push('</form>');
    if (document.getElementById('witnesses')) {
      document.getElementById('witnesses').innerHTML = '';
    }
    document.getElementById('saved_collations_div').innerHTML = html.join('');
    document.getElementById('header').innerHTML = getHeaderHtml('Collation', context);
    document.getElementById('header').className = '';

    if (CL.services.hasOwnProperty('showLoginStatus')) {
      CL.services.showLoginStatus();
    }
    $(':radio').on('click', function() {
      if ($(this).is(':checked')) {
        if ( ( $(this).parent().hasClass('regularised') || $(this).parent().hasClass('set') ) && ( $(this).hasClass('added') || $(this).hasClass('both')) ) {
          $('#load_saved_add_button').removeClass('pure-button-disabled');
        } else {
          $('#load_saved_add_button').addClass('pure-button-disabled');
        }
        if ( ( $(this).parent().hasClass('regularised') || $(this).parent().hasClass('set') ) && ( $(this).hasClass('removed') || $(this).hasClass('both') ) ) {
          $('#load_saved_remove_button').removeClass('pure-button-disabled');
        } else {
          $('#load_saved_remove_button').addClass('pure-button-disabled');
        }
      }
    });
    footerHtml = [];
    footerHtml.push('<input class="pure-button right_foot" id="load_saved_button" type="button" value="Load collation"/>');
    if (hasCollationsWithWitsToAdd === true && CL.project.allowWitnessChangesInSavedCollations === true) {
      footerHtml.push('<input class="pure-button pure-button-disabled right_foot" id="load_saved_add_button" type="button" value="Load collation and add witnesses"/>');
    }
    if (hasCollationsWithWitsToRemove === true && CL.project.allowWitnessChangesInSavedCollations === true) {
      footerHtml.push('<input class="pure-button pure-button-disabled right_foot" id="load_saved_remove_button" type="button" value="Load collation and remove witnesses"/>');
    }
    document.getElementById('footer').innerHTML = footerHtml.join('');
    $('#load_saved_button').on('click', function(event) {
      CL.witnessEditingMode = false;
      CL.witnessAddingMode = false;
      CL.witnessRemovingMode = false;
      _loadSavedCollation();
    });
    $('#load_saved_add_button').on('click', function(event) {
      CL.witnessEditingMode = true;
      CL.witnessAddingMode = true;
      CL.witnessRemovingMode = false;
      _addToSavedCollation();
    });
    $('#load_saved_remove_button').on('click', function(event) {
      CL.witnessEditingMode = true;
      CL.witnessAddingMode = false;
      CL.witnessRemovingMode = true;
      _loadSavedCollation();
    });
  };

  _addToSavedCollation = function(id) {
    var data, coll_id;
    if (id === undefined) {
      data = cforms.serialiseForm('saved_collation_form');
      coll_id = data.saved_collation;
    } else {
      coll_id = id;
    }
    CL.services.loadSavedCollation(coll_id, function(collation) {
      CL.services.getCurrentEditingProject(function(project) {
        var temp, witsToAdd;
        if (collation) {

          temp = checkWitnessesAgainstProject(collation.data_settings.witness_list, project.witnesses);
          witsToAdd = temp[3];
          if (temp[3].length === 0) {
            alert('No witnesses were found to add'); //should never happen but just in case
            returnToSummaryTable();
            return;
          }
          CL.existingCollation = collation;
          prepareAdditionalCollation(collation, witsToAdd);
        }
      });
    });
  };

  prepareAdditionalCollation = function(existing_collation, witsToAdd) {
    var context;
    spinner.showLoadingOverlay();

    if (document.getElementById('language')) {
      CL.dataSettings.language = document.getElementById('language').value;
    }
    if (document.getElementById('base_text')) {
      // if a base text is given, check that the base_text is the same as the one in the saved collation
      if (document.getElementById('base_text').value === existing_collation.data_settings.base_text) {
        CL.dataSettings.base_text = document.getElementById('base_text').value;
      } else {
        alert('You can only add witnesses if the project base text is currently the same as the one used for the ' +
              'saved collation. This is not the case with yur data.\n\nTo add witnesses change the project base ' +
              'text to match the saved collations.');
        returnToSummaryTable();
        return;
      }
    }
    if (existing_collation.data_settings.hasOwnProperty('base_text_siglum')) {
      CL.dataSettings.base_text_siglum = existing_collation.data_settings.base_text_siglum;
    }
    if (existing_collation.status !== 'regularised') {
      //ensure we use the display settings that were used for the existing collation in SV (they are read from here at collation time)
      //we do not use these for RG as the user can change and we use default ones so we don't hide anything they would want to see
      CL.displaySettings = existing_collation.display_settings;
    }
    context = existing_collation.context;
    if (context && CL.dataSettings.base_text !== 'none') {
      CL.context = context;
      CL.dataSettings.witness_list = witsToAdd;
      if (CL.dataSettings.witness_list.indexOf(CL.dataSettings.base_text) === -1) {
        CL.dataSettings.witness_list.push(CL.dataSettings.base_text);
      }
      RG.getCollationData('add_witnesses', 0, function () {
        // //TODO: remove - this manipulates the data to create an addition in the new unit so we can test making a new unit
        // for (let i=0; i<CL.collateData.data.length; i+=1) {
        //   if (CL.collateData.data[i].siglum === 'P66') {
        //     //add a unit which should end up at index 11 in the basetext
        //     CL.collateData.data[i].witnesses[0].tokens.splice(5, 0, {"index": 12, "reading": 'P66', "siglum": 'P66', "verse": 'B04K1V2', "original": 'Test', "rule_match": ['test'], "t": 'test'});
        //     //adjust following indexes
        //     CL.collateData.data[i].witnesses[0].tokens[6].index = 14;
        //     CL.collateData.data[i].witnesses[0].tokens[7].index = 16;
        //     //add 2 units at the end
        //     CL.collateData.data[i].witnesses[0].tokens.push({"index": 18, "reading": 'P66', "siglum": 'P66', "verse": 'B04K1V2', "original": 'Test', "rule_match": ['test'], "t": 'test'});
        //     CL.collateData.data[i].witnesses[0].tokens.push({"index": 20, "reading": 'P66', "siglum": 'P66', "verse": 'B04K1V2', "original": 'Test2', "rule_match": ['test2'], "t": 'test2'});
        //   }
        // }
        // //TODO: end of stuff to remove
        RG.runCollation(CL.collateData, 'add_witnesses', 0, function (data) {
            var mergedCollation;
            CL.data = data; // temporary assignment to allow all the cleaning functions to work
            lacOmFix();
            // copy so we can change CL.data without screwing this up
            data = JSON.parse(JSON.stringify(CL.data));
            console.log(JSON.parse(JSON.stringify(data)))
            // assume CL.context agrees with the new data since it was used to fetch it
            if (CL.context === existing_collation.context) {
              // check we have basetext agreement
              if (data.overtext_name === existing_collation.structure.overtext_name) {

                CL.witnessesAdded = [];
                for (let key in data.hand_id_map) {
                  if (data.hand_id_map[key] !== CL.dataSettings.base_text) {
                    CL.witnessesAdded.push(key);
                  }
                }
                if (existing_collation.status === 'regularised') {
                  //merge the existing and new collations
                  mergedCollation = _mergeCollationObjects(JSON.parse(JSON.stringify(existing_collation)), data, witsToAdd);
                  //display the pre-merged data
                  _displaySavedCollation(mergedCollation);

                } else if (existing_collation.status === 'set') {
                  //merge the existing and new collations
                  mergedCollation = _mergeCollationObjects(JSON.parse(JSON.stringify(existing_collation)), data, witsToAdd);
                  //display the pre-merged data
                  _displaySavedCollation(mergedCollation);
                }
              } else {
                alert('The new witnesses could not be added this time due to a problem with the basetexts, please try again.');
                spinner.removeLoadingOverlay();
                returnToSummaryTable();
                return;
              }
            } else {
              alert('The new witnesses could not be added this time due to a problem with the context selected, please try again.');
              spinner.removeLoadingOverlay();
              returnToSummaryTable();
              return;
            }
          });
      });
    }
  };

  _mergeCollationObjects = function (mainCollation, newData, addedWits) {
    var unit, index, newUnit, existingUnit, newUnits, existingUnits, newReadingText,
    matchingReadingFound, unitQueue, nextUnits, unit1, unit2, tempUnit, omReading,
    existingWitnesses, unitId, position, before, after, beforeIds, afterIds,
    sharedIds;

    for (let i=0; i<addedWits.length; i+=1) {
      if (mainCollation.data_settings.witness_list.indexOf(addedWits[i]) === -1) {
        mainCollation.data_settings.witness_list.push(addedWits[i]);
      }
    }
    //add any new lac readings
    for (let i=0; i<newData.lac_readings.length; i+=1) {
      if (mainCollation.structure.lac_readings.indexOf(newData.lac_readings[i]) === -1) {
        mainCollation.structure.lac_readings.push(newData.lac_readings[i]);
      }
    }
    //add any new om readings
    for (let i=0; i<newData.om_readings.length; i+=1) {
      if (mainCollation.structure.om_readings.indexOf(newData.om_readings[i]) === -1) {
        mainCollation.structure.om_readings.push(newData.om_readings[i]);
      }
    }
    //update hand_id_map
    for (let key in newData.hand_id_map) {
      if (newData.hand_id_map.hasOwnProperty(key)) {
        if (!mainCollation.structure.hand_id_map.hasOwnProperty(key)) {
          mainCollation.structure.hand_id_map[key] = newData.hand_id_map[key];
        }
      }
    }
    //should move index point by index point - check what we have in each list
    //if in existing and not new add new as om/lac verse/om_verse
    //if in new and not existing all existing needs to be om lac verse/om verse
    //make reading for any combined or shared units and check against existing readings
    index = 1; //this refers to the position indicated by numbers under the basetext
    while (index<=(newData.overtext[0].tokens.length*2)+1) {
      //if new data has one then
      newUnits = _getUnitsByStartIndex(index, newData.apparatus);
      existingUnits = _getUnitsByStartIndex(index, mainCollation.structure.apparatus);
      if (newUnits.length === 0 && existingUnits.length === 0) {
        index += 1; //because for loop will never run and index is only incremented here and in the for loop
      }
      for (let z=0; z<Math.max(newUnits.length, existingUnits.length); z+=1) {
        newUnit = z<newUnits.length ? newUnits[z] : null;
        existingUnit = z<existingUnits.length ? existingUnits[z] : null;
        if (existingUnit !== null && (newData.lac_readings.length > 0 || newData.om_readings.length > 0)) {
          _mergeNewLacOmVerseReadings(existingUnit, newData);
        }
        if (newUnit === null && existingUnit === null) {
          index += 1;
        } else {
          if (newUnit === null) {
            omReading = null;
            for (let i=0; i<existingUnit.readings.length; i+=1) {
              if (existingUnit.readings[i].hasOwnProperty('type') && existingUnit.readings[i].type == 'om' &&
                    !existingUnit.readings[i].hasOwnProperty('overlap_status')) {
                omReading = existingUnit.readings[i];
              }
            }

            if (omReading) {
              // addedWits is identifiers rather than sigla for readings so use hand_id_map here instead
              // we can assume that basetext is om in both cases as it is the same text so the check of exisitng
              // witnessses for omReading will filter this out
              for (let key in newData.hand_id_map) {
                if (newData.lac_readings.indexOf(key) === -1 && newData.om_readings.indexOf(key) === -1 ) {
                  if (omReading.witnesses.indexOf(key) === -1) {
                    omReading.witnesses.push(key);
                  }
                }
              }
              index = existingUnit.end + 1;
            } else {
              alert('The new witnesses could not be added this time due to a base text conflict.\n' +
                    'Please check that your current project base text is the same as that used for the saved ' +
                    'collations and then try again.');
              spinner.removeLoadingOverlay();
              returnToSummaryTable();
              return;
            }
          } else if (existingUnit === null) {
            //then add a new unit
            //get all the witnesses
            existingWitnesses = [];
            for (let i=0; i<mainCollation.structure.apparatus[0].readings.length; i+=1) {
              existingWitnesses.push.apply(existingWitnesses, mainCollation.structure.apparatus[0].readings[i].witnesses);
            }
            if (mainCollation.structure.lac_readings.length > 0) {
              newUnit.readings.push({'text' : [],
                                     'type' : 'lac_verse',
                                     'details' : CL.project.lacUnitLabel,
                                     'witnesses' : JSON.parse(JSON.stringify(mainCollation.structure.lac_readings))});
              for (let i=0; i<mainCollation.structure.lac_readings.length; i+=1) {
                if (existingWitnesses.indexOf(mainCollation.structure.lac_readings[i]) !== -1) {
                  existingWitnesses.splice(existingWitnesses.indexOf(mainCollation.structure.lac_readings[i]), 1);
                }
              }
            }
            if (mainCollation.structure.om_readings.length > 0) {
              newUnit.readings.push({'text' : [],
                                     'type' : 'om_verse',
                                     'details' : CL.project.omUnitLabel,
                                     'witnesses' : JSON.parse(JSON.stringify(mainCollation.structure.om_readings))});
              for (let i=0; i<mainCollation.structure.om_readings.length; i+=1) {
                if (existingWitnesses.indexOf(mainCollation.structure.om_readings[i]) !== -1) {
                  existingWitnesses.splice(existingWitnesses.indexOf(mainCollation.structure.om_readings[i]), 1);
                }
              }
            }
            for (let key in newData.hand_id_map) {
              if (newData.hand_id_map.hasOwnProperty(key) && existingWitnesses.indexOf(key) !== -1) {
                existingWitnesses.splice(existingWitnesses.indexOf(key), 1);
              }
            }
            if (existingWitnesses.length > 0) {
              omReading = null;
              for (let i=0; i<newUnit.readings.length; i+=1) {
                if (newUnit.readings[i].hasOwnProperty('type') && newUnit.readings[i].type == 'om'  &&
                      !newUnit.readings[i].hasOwnProperty('overlap_status')) {
                  omReading = newUnit.readings[i];
                }
              }
              if (omReading) {
                for (let i=0; i<existingWitnesses.length; i+=1) {
                  if (omReading.witnesses.indexOf(existingWitnesses[i]) === -1) {
                    omReading.witnesses.push(existingWitnesses[i]);
                  }
                }
              } else {
                //TODO: address comment below
                //something has probably gone wrong but we could just add an om reading!
                //We should probably quit in the same as the reverse situation above because it means
                //something is wrong in the basetext which should always be om and should always be in the unit being
                // changed
                newUnit.readings.push({'text' : [],
                  'witnesses' : existingWitnesses});
              }
            }
            mainCollation.structure.apparatus.push(newUnit);
            mainCollation.structure.apparatus.sort(SV._compareFirstWordIndexes);
            before = null;
            after = null;
            for (let i=0; i<mainCollation.structure.apparatus.length; i+=1) {
        			if (mainCollation.structure.apparatus[i].end === newUnit.start-1) {
        				before = mainCollation.structure.apparatus[i];
        			}
        			if (mainCollation.structure.apparatus[i].start === newUnit.start+1) {
        				after = mainCollation.structure.apparatus[i];
        			}
        		}
            if (before && after && before.hasOwnProperty('overlap_units') && after.hasOwnProperty('overlap_units')) {
              // find out which ones are shared and add them to the new unit (we are not concerned about the ones
              // at the edges as the user can make and merge if needed)
              beforeIds = Object.keys(before.overlap_units);
              afterIds = Object.keys(after.overlap_units);
              sharedIds = beforeIds.filter(x => afterIds.includes(x));
              if (sharedIds.length > 0) {
                //then we have shared overlaps and we must add them to the new unit
                newUnit.overlap_units = {};
                for (let i=0; i<sharedIds.length; i+=1) {
                  newUnit.overlap_units[sharedIds[i]] = before.overlap_units[sharedIds[i]];
                }
              }
            }
            index = newUnit.end + 1;
          } else {
            if (newUnit.end == existingUnit.end) {
              for (let j=0; j<newUnit.readings.length; j+=1) {
                matchingReadingFound = false;
                newReadingText = extractWitnessText(newUnit.readings[j]);

                for (let k=0; k<existingUnit.readings.length; k+=1) {
                  if (!existingUnit.readings[k].hasOwnProperty('overlap_status') &&
                        extractWitnessText(existingUnit.readings[k]) === newReadingText) {
                    matchingReadingFound = true;
                    _mergeNewReading(existingUnit.readings[k], newUnit.readings[j]);
                  }
                }
                if (matchingReadingFound === false) {
                  // the basetext will always have a matching reading as it is in the existing collation so don't
                  // need to worry about removing it from any added readings
                  existingUnit.readings.push(newUnit.readings[j]);
                }
              }
              index = newUnit.end + 1;
            } else {
              // no end agreement
              // collect all the units covered in a stack
              unitQueue = [newUnit];
              for (let i=newUnit.end+1; i<=existingUnit.end; i+=1) {
                nextUnits = _getUnitsByStartIndex(i, newData.apparatus);
                for (let j=0; j<nextUnits.length; j+=1) {
                  unitQueue.unshift(nextUnits[j]);
                }
              }
              unit1 = null;
              while (unitQueue.length > 0) {
                if (unit1 === null) {
                  unit1 = unitQueue.pop();
                }
                unit2 = unitQueue.pop();
                tempUnit = {"start": existingUnit.start,
                            "first_word_index": existingUnit.first_word_index,
                            "end": unit2.end};
                unit1 = SV._combineReadings(unit1.readings, unit2.readings, tempUnit, false);
              }
              for (let j=0; j<unit1.readings.length; j+=1) {
                matchingReadingFound = false;
                newReadingText = extractWitnessText(unit1.readings[j]);
                for (let k=0; k<existingUnit.readings.length; k+=1) {
                  if (!existingUnit.readings[k].hasOwnProperty('overlap_status') &&
                        extractWitnessText(existingUnit.readings[k]) === newReadingText) {
                    matchingReadingFound = true;
                    _mergeNewReading(existingUnit.readings[k], unit1.readings[j]);
                  }
                }
                if (matchingReadingFound === false) {
                  // the basetext will always have a matching reading as it is in the existing collation so don't
                  // need to worry about removing it from any added readings
                  existingUnit.readings.push(unit1.readings[j]);
                }
              }
              //TODO: assuming that will be the larger one for now - needs to be better maybe
              index = existingUnit.end + 1;
            }
          }
        }
      }
    }
    return mainCollation;
  };

  _mergeNewReading = function (existingReading, addedReading) {
    for (let i=0; i<addedReading.witnesses.length; i+=1) {
      if (existingReading.witnesses.indexOf(addedReading.witnesses[i]) === -1) {
        existingReading.witnesses.push(addedReading.witnesses[i]);
        for (let j=0; j<addedReading.text.length; j+=1) {
          // we can assume that there are the same number of tokens in text array in the existing reading
          // otherwise the readings wouldn't have matched
          existingReading.text[j].reading.push(addedReading.witnesses[i]);
          existingReading.text[j][addedReading.witnesses[i]] = addedReading.text[j][addedReading.witnesses[i]];
        }
      }
    }
  };

  _mergeNewLacOmVerseReadings = function (unit, newData) {
    for (let i=0; i<unit.readings.length; i+=1) {
      if (unit.readings[i].hasOwnProperty('type')) {
        if (unit.readings[i].type === 'lac_verse' && newData.lac_readings.length > 0) {
          for (let j=0; j<newData.lac_readings.length; j+=1) {
            if (unit.readings[i].witnesses.indexOf(newData.lac_readings[j]) === -1) {
              unit.readings[i].witnesses.push(newData.lac_readings[j]);
            }
          }
          // untested but same code as above
          // om verse might want to look for an overlapped unit and add to that with duplicates in the top line for
          // user to deal with
        } else if (unit.readings[i].type === 'om_verse' && newData.om_readings.length > 0) {
          for (let j=0; j<newData.om_readings.length; j+=1) {
            if (unit.readings[i].witnesses.indexOf(newData.om_readings[j]) === -1) {
              unit.readings[i].witnesses.push(newData.om_readings[j]);
            }
          }
        }
      }
    }
  };

  _getUnitsByStartIndex = function (startIndex, unitList) {
    var units = [];
    for (let i=0; i<unitList.length; i+=1) {
      if (unitList[i].start == startIndex) {
        units.push(unitList[i]);
      }
    }
    return units;
  };

  _loadSavedCollation = function(id) {
    var i, value, bk, data, coll_id, temp, witnessStatus;
    CL.isDirty = false;
    spinner.showLoadingOverlay();
    if (id === undefined) {
      data = cforms.serialiseForm('saved_collation_form');
      coll_id = data.saved_collation;
    } else {
      coll_id = id;
    }
    CL.services.loadSavedCollation(coll_id, function (collation) {
      _displaySavedCollation(collation);
    });
  };

  _displaySavedCollation = function (collation) {
      var options;
      if (collation) {
        CL.context = collation.context;
        CL.data = collation.structure;

        if (!CL.data.apparatus[0].hasOwnProperty('_id')) {
          addUnitAndReadingIds();
        }
        //If we are adding witnesses at the regularisation stage then we need to save the settings
        //from the main saved collation but not use them for the live data (we need them for saving later)
        if (collation.status === 'regularised' && CL.witnessAddingMode === true) {
          CL.savedDisplaySettings = collation.display_settings;
          CL.savedDataSettings = collation.data_settings;
          CL.savedAlgorithmSettings = collation.algorithm_settings;
        } else {
          //otherwise we can use them
          CL.displaySettings = collation.display_settings;
          CL.dataSettings = collation.data_settings;
          CL.collationAlgorithmSettings = collation.algorithm_settings;
        }
        CL.container = document.getElementById('container');

        options = {};

        if (collation.status === 'regularised') {
          RG.showVerseCollation(CL.data, CL.context, CL.container, options);
        } else if (collation.status === 'set') {
          //if anything that should have an _id attribute doesn't have one then
          //add them
          if (SV.checkIds()[0]) {
            addUnitAndReadingIds();
          }
          SV.checkBugStatus('loaded', 'saved version');
          options.container = CL.container;
          SV.showSetVariants(options);
        } else if (collation.status === 'ordered') {
          SR.loseSubreadings();
          SR.findSubreadings({
            'rule_classes': getRuleClasses('subreading', true, 'value', ['identifier', 'subreading'])
          });
          options.container = CL.container;
          OR.showOrderReadings(options);
        } else if (collation.status === 'approved') {
          //we do not do lose and find subreading here as all the saved versions are already correct
          //and if we lose them and find them on display we lose the suffixes list we generated
          //that is needed for output
          options.container = CL.container;
          OR.showApprovedVersion(options);
        }
      } else {
        spinner.removeLoadingOverlay();
      }
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
    var idno, span;
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

  _getUnitData = function(data, id, start, end, options) {
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
            //this should never happen and means the data needs some serious work but keeping to keep collaborators happy
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
          //this should never happen and means the data needs some serious work but keeping to keep collaborators happy
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
    var lac_wits, om_wits, other_wits, ol_unit, new_rdg, special_witnesses;
    //the rest of this section is really just adding the readings (and witnesses) to this unit
    lac_wits = JSON.parse(JSON.stringify(CL.data.lac_readings));
    om_wits = JSON.parse(JSON.stringify(CL.data.om_readings));
    other_wits = JSON.parse(JSON.stringify(all_witnesses));
    //if anything marked as overlapped and is empty in the first 'real' unit
    //ALL overlap indexes need adding to this one
    if (adjacent_unit.hasOwnProperty('overlap_units') &&
      overlapHasEmptyReading(adjacent_unit.overlap_units)) {
      for (let key in adjacent_unit.overlap_units) {
        if (adjacent_unit.overlap_units.hasOwnProperty(key) &&
          (typeof inclusive_overlaps === 'undefined' ||
            typeof inclusive_overlaps !== 'undefined' &&
            inclusive_overlaps.indexOf(key) !== -1)
        ) {
          ol_unit = findOverlapUnitById(key);
          for (let j=1; j<ol_unit.readings.length; j+=1) {
            new_rdg = JSON.parse(JSON.stringify(_getNewGapRdgDetails(adjacent_unit, ol_unit.readings[j])));
            new_rdg.text = [];
            //remove these readings from the ones we collected earlier (because these ones need separating)
            for (let k=0; k<new_rdg.witnesses.length; k+=1) {
              if (lac_wits.indexOf(new_rdg.witnesses[k]) !== -1) {
                lac_wits.splice(lac_wits.indexOf(new_rdg.witnesses[k]), 1);
                new_rdg.type = 'lac_verse';
                new_rdg.details = CL.project.lacUnitLabel;
              }
              if (om_wits.indexOf(new_rdg.witnesses[k]) !== -1) {
                om_wits.splice(om_wits.indexOf(new_rdg.witnesses[k]), 1);
                new_rdg.type = 'om_verse';
                new_rdg.details = CL.project.omUnitLabel;
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
        for (let i=0; i<inclusive_overlaps.length; i+=1) {
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
    special_witnesses = [];
    if (CL.data.hasOwnProperty('special_categories')){
      for (let j=0; j<CL.data.special_categories.length; j+=1) {
        for (let i=0; i<CL.data.apparatus.length; i+=1) {
          new_unit.readings.push({
            'text': [],
            'type': 'lac_verse',
            'details': CL.data.special_categories[j].label,
            'witnesses': CL.data.special_categories[j].witnesses
          });
        }
        special_witnesses.push.apply(special_witnesses, CL.data.special_categories[j].witnesses);
      }
    }
    lac_wits = removeSpecialWitnesses(lac_wits, special_witnesses);
    //now add your whole verse lac and om witnesses
    if (lac_wits.length > 0) {
      new_unit.readings.push({
        'witnesses': lac_wits,
        'text': [],
        'type': 'lac_verse',
        'details': CL.project.lacUnitLabel
      });
    }
    if (om_wits.length > 0) {
      new_unit.readings.push({
        'witnesses': om_wits,
        'text': [],
        'type': 'om_verse',
        'details': CL.project.omUnitLabel
      });
    }
    addUnitId(new_unit, 'apparatus');
    addReadingIds(new_unit);
    return new_unit;
  };

  removeSpecialWitnesses = function (original_witnesses, special_witnesses) {
    var new_witness_list = [];
    for (let i=0; i<original_witnesses.length; i+=1) {
      if (special_witnesses.indexOf(original_witnesses[i]) == -1) {
        new_witness_list.push(original_witnesses[i]);
      }
    }
    return new_witness_list;
  };

  _extraGapIsWithinAnOverlap = function(current) {
    if (current + 1 < CL.data.apparatus.length && CL.data.apparatus[current + 1].hasOwnProperty('overlap_units')) {
      for (let key in CL.data.apparatus[current].overlap_units) {
        if (CL.data.apparatus[current].overlap_units.hasOwnProperty(key) &&
          CL.data.apparatus[current + 1].overlap_units.hasOwnProperty(key)) {
          return true;
        }
      }
    }
    return false;
  };

  _getInclusiveOverlapReadings = function(current) {
    var inclusive_overlaps;
    inclusive_overlaps = [];
    if (current + 1 < CL.data.apparatus.length && CL.data.apparatus[current + 1].hasOwnProperty('overlap_units')) {
      for (let key in CL.data.apparatus[current].overlap_units) {
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
    var extra_reading;
    for (let i=0; i<extra_readings.length; i+=1) {
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
    var levels, found, latest, approved;
    spinner.showLoadingOverlay();
    CL.context = verse;
    CL.services.getUserInfo(function(user) {
      if (user) {
        CL.services.getSavedCollations(verse, user.id, function(collations) {
          //now we need to do another call to get any project (not necessarily owned by this user) approved versions
          CL.services.getSavedCollations(verse, undefined, function(approved_ones) {
            //because this will get more than just approved versions check status and only use the approved one
            for (let i=0; i<approved_ones.length; i+=1) {
              if (approved_ones[i].status == 'approved') {
                collations.push(approved_ones[i]);
              }
            }
            levels = ['approved', 'ordered', 'set', 'regularised'];
            approved = false;
            latest = null;
            for (let i=0; i<levels.length; i+=1) {
              found = false;
              for (let j=0; j<collations.length; j+=1) {
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
    SV.undoStack = [];
    OR.undoStack = [];
    if (latest === null) {
      for (let key in _defaultDisplaySettings) {
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
  _removeOverlappedReadings = function() {
    var apparatus, i, j;
    apparatus = CL.data.apparatus;
    for (let i=0; i<apparatus.length; i+=1) {
      for (let j=0; j<apparatus[i].readings.length; j+=1) {
        if (apparatus[i].readings[j].hasOwnProperty('overlap')) {
          apparatus[i].readings[j] = 'None';
        }
      }
      while (apparatus[i].readings.indexOf('None') !== -1) {
        apparatus[i].readings.splice(apparatus[i].readings.indexOf('None'), 1);
      }
    }
    CL.data.apparatus = apparatus;
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
      if (a.type === 'lac_verse' && b.type === 'lac_verse') {
        return 0;
      }
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
      document.getElementById('algorithm').value = CL.collationAlgorithmSettings.algorithm;
    }
    if (document.getElementById('fuzzy_match')) {
      document.getElementById('fuzzy_match').checked = CL.collationAlgorithmSettings.fuzzy_match;
      if (CL.collationAlgorithmSettings.fuzzy_match === false) {
        document.getElementById('distance').disabled = 'disabled';
      }
    }
    if (document.getElementById('distance')) {
      document.getElementById('distance').value = CL.collationAlgorithmSettings.distance;
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
      for (setting in CL.collationAlgorithmSettings) {
        if (CL.collationAlgorithmSettings.hasOwnProperty(setting)) {
          if (data.hasOwnProperty(setting)) {
            CL.collationAlgorithmSettings[setting] = data[setting];
          } else {
            CL.collationAlgorithmSettings[setting] = false;
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
    var parent_div, elements, checked;
    parent_div = document.getElementById(id).parentNode;
    checked = document.getElementById(id).checked;
    elements = parent_div.childNodes;
    for (let i=0; i<elements.length; i+=1) {
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
    var entry;
    for (let key in CL.data.marked_readings) {
      if (CL.data.marked_readings.hasOwnProperty(key)) {
        for (let i = CL.data.marked_readings[key].length - 1; i >= 0; i -= 1) {
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

  findReadingPosById = function(unit, id) {
    for (let i=0; i<unit.readings.length; i+=1) {
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

  _makeRegDecisionsStandoff = function(type, apparatus, unit, reading, parent, subreading, witness, baseReadingsWithSettingsApplied) {
    var rule_details, key, i, j, k, standoff_reading, values, classes, details,
      decision_details, subreading_types;

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
      for (let k = 0; k < subreading.text.length; k += 1) {
        if (subreading.text[k][witness].hasOwnProperty('decision_class')) {
          classes.push(JSON.parse(JSON.stringify(subreading.text[k][witness].decision_class)));
        } else {
          classes.push([]);
        }
        if (subreading.text[k][witness].hasOwnProperty('decision_details')) {
          decision_details = JSON.parse(JSON.stringify(subreading.text[k][witness].decision_details));

          decision_details[0].base_reading = baseReadingsWithSettingsApplied[decision_details[0].t]['interface'];
          //decision_details[0].base_reading = _applySettings(decision_details[0].t);

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
    var rule_type, positions, lowest_position;
    positions = [];
    lowest_position = 1000000000;
    for (let i = 0; i < classes.length; i += 1) {
      positions[i] = null;
      for (let j = 0; j < classes[i].length; j += 1) {
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
    for (let i = 1; i < classes.length; i += 1) {
      if (classes[i][lowest_position] !== null && typeof classes[i][lowest_position] !== 'undefined' && (typeof rule_type === 'undefined' || rule_type === null || subreading_types.indexOf(rule_type) !== -1)) {
        rule_type = classes[i][lowest_position];
      }
    }
    if (subreading_types.indexOf(rule_type) !== -1) {
      for (let i = 0; i < positions.length; i += 1) {
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

  _getFunctionFromString =  function(functionString) {
    var scope, scopeList;
    scope = window;
    scopeList = functionString.split('.');
    for (let i = 0; i < scopeList.length - 1; i += 1) {
      scope = scope[scopeList[i]];
      if (scope == undefined) return;
    }
    return scope[scopeList[scopeList.length - 1]];
  };

  runFunction = function(functionRef, args) {
    var fn;
    if (typeof args === 'undefined') {
      args = [];
    }
    if (typeof functionRef === 'string') {
      fn = _getFunctionFromString(functionRef);
      return fn(args);
    } else {
      return functionRef.apply(this, args);
    }
  };


  if (testing) {
    return {

      services: services,
      container: container,
      displaySettings: displaySettings,
      displaySettingsDetails: displaySettingsDetails,
      ruleClasses: ruleClasses,
      ruleConditions: ruleConditions,
      localPythonFunctions: localPythonFunctions,
      overlappedOptions: overlappedOptions,
      dataSettings: dataSettings,
      collationAlgorithmSettings: collationAlgorithmSettings,
      highlighted: highlighted,
      highlightedAdded: highlightedAdded,
      showSubreadings: showSubreadings,
      managingEditor: managingEditor,
      project: project,
      collateData: collateData,
      context: context,
      data: data,
      stage: stage,
      isDirty: isDirty,
      calculatePosition: calculatePosition,
      witnessEditingMode: witnessEditingMode,
      witnessRemovingMode: witnessRemovingMode,
      witnessAddingMode: witnessAddingMode,
      witnessesAdded: witnessesAdded,
      savedDisplaySettings: savedDisplaySettings,
      savedAlgorithmSettings: savedAlgorithmSettings,
      savedDataSettings: savedDataSettings,
      existingCollation: existingCollation,

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
      removeWitness: removeWitness,
      setUpRemoveWitnessesForm: setUpRemoveWitnessesForm,
      removeWitnesses: removeWitnesses,
      getRemoveWitnessDataFromForm: getRemoveWitnessDataFromForm,
      checkWitnessesAgainstProject: checkWitnessesAgainstProject,
      setOverlappedOptions: setOverlappedOptions,
      setRuleClasses: setRuleClasses,
      returnToSummaryTable: returnToSummaryTable,
      prepareAdditionalCollation: prepareAdditionalCollation,
      removeSpecialWitnesses: removeSpecialWitnesses,
      findReadingPosById: findReadingPosById,
      runFunction: runFunction,

      //deprecated function mapping for calls from older services
      set_service_provider: setServiceProvider,
      load_index_page: loadIndexPage,
      add_index_handlers: addIndexHandlers,
      _managing_editor: managingEditor,


      //private for testing only
       _initialiseEditor: _initialiseEditor,
       _initialiseProject: _initialiseProject,
       _setProjectConfig: _setProjectConfig,
       _setDisplaySettings: _setDisplaySettings,
       _setLocalPythonFunctions: _setLocalPythonFunctions,
       _setRuleConditions: _setRuleConditions,
       _includeJavascript: _includeJavascript,
       _loadSavedCollation: _loadSavedCollation,
       _prepareCollation: _prepareCollation,
       _getContextFromInputForm: _getContextFromInputForm,
       _getWitnessesFromInputForm: _getWitnessesFromInputForm,
       _showSavedVersions: _showSavedVersions,
       _getSavedRadio: _getSavedRadio,
       _makeSavedCollationTable: _makeSavedCollationTable,
       _getSubreadingWitnessData: _getSubreadingWitnessData,
       _findStandoffRegularisationText: _findStandoffRegularisationText,
       _collapseUnit: _collapseUnit,
       _expandUnit: _expandUnit,
       _expandAll: _expandAll,
       _collapseAll: _collapseAll,
       _getEmptyCell: _getEmptyCell,
       _mergeDicts: _mergeDicts,
       _getUnitData: _getUnitData,
       _hasGapBefore: _hasGapBefore,
       _hasGapAfter: _hasGapAfter,
       _getAllEmptyReadingWitnesses: _getAllEmptyReadingWitnesses,
       _containsEmptyReading: _containsEmptyReading,
       _isOverlapped: _isOverlapped,
       _removeLacOmVerseWitnesses: _removeLacOmVerseWitnesses,
       _cleanExtraGaps: _cleanExtraGaps,
       _getOverlapUnitReadings: _getOverlapUnitReadings,
       _checkExtraGapRequiredBefore: _checkExtraGapRequiredBefore,
       _extraGapRequiredBefore: _extraGapRequiredBefore,
       _extraGapRequiredAfter: _extraGapRequiredAfter,
       _combinedGapInNextUnit: _combinedGapInNextUnit,
       _getNewGapRdgDetails: _getNewGapRdgDetails,
       _addExtraGapReadings: _addExtraGapReadings,
       _extraGapIsWithinAnOverlap: _extraGapIsWithinAnOverlap,
       _getInclusiveOverlapReadings: _getInclusiveOverlapReadings,
       _getExtraGapLocation: _getExtraGapLocation,
       _createExtraGaps: _createExtraGaps,
       _addLacReading: _addLacReading,
       _addNavEvent: _addNavEvent,
       _findLatestStageVerse: _findLatestStageVerse,
       _loadLatestStageVerse: _loadLatestStageVerse,
       _removeOverlappedReadings: _removeOverlappedReadings,
       _applySettings: _applySettings,
       _getApprovalSettings: _getApprovalSettings,
       _compareReadings: _compareReadings,
       _disableEventPropagation: _disableEventPropagation,
       _showCollationSettings: _showCollationSettings,
       _checkWitnesses: _checkWitnesses,
       _getScrollPosition: _getScrollPosition,
       _getMousePosition: _getMousePosition,
       _displayWitnessesHover: _displayWitnessesHover,
       _getWitnessesForReading: _getWitnessesForReading,
       _findStandoffWitness: _findStandoffWitness,
       _getPreStageChecks: _getPreStageChecks,
       _makeRegDecisionsStandoff: _makeRegDecisionsStandoff,
       _contextInputOnload: _contextInputOnload,
       _removeWitnessFromUnit: _removeWitnessFromUnit,
       _findSaved: _findSaved,
       _addToSavedCollation: _addToSavedCollation,
       _displaySavedCollation: _displaySavedCollation,
       _mergeCollationObjects: _mergeCollationObjects,
       _getUnitsByStartIndex: _getUnitsByStartIndex,
       _mergeNewLacOmVerseReadings: _mergeNewLacOmVerseReadings,
       _mergeNewReading: _mergeNewReading,
       _getReadingHistory: _getReadingHistory,
       _getNextTargetRuleInfo: _getNextTargetRuleInfo,
       _removeAppliedRules: _removeAppliedRules,
       _getHistoricalReading: _getHistoricalReading,
       _extractAllTValuesForRGAppliedRules: _extractAllTValuesForRGAppliedRules,
       _makeStandoffReading2: _makeStandoffReading2,
       _getFunctionFromString: _getFunctionFromString,
       //private variables for testing only
       _contextInput: _contextInput,
       _defaultDisplaySettings: _defaultDisplaySettings,
       _collapsed: _collapsed,
       _alpha: _alpha,
       _displayMode: _displayMode,
    };
  } else {

    return {

      services: services,
      container: container,
      displaySettings: displaySettings,
      displaySettingsDetails: displaySettingsDetails,
      ruleClasses: ruleClasses,
      ruleConditions: ruleConditions,
      localPythonFunctions: localPythonFunctions,
      overlappedOptions: overlappedOptions,
      dataSettings: dataSettings,
      collationAlgorithmSettings: collationAlgorithmSettings,
      highlighted: highlighted,
      highlightedAdded: highlightedAdded,
      showSubreadings: showSubreadings,
      managingEditor: managingEditor,
      project: project,
      collateData: collateData,
      context: context,
      data: data,
      stage: stage,
      isDirty: isDirty,
      calculatePosition: calculatePosition,
      witnessEditingMode: witnessEditingMode,
      witnessRemovingMode: witnessRemovingMode,
      witnessAddingMode: witnessAddingMode,
      witnessesAdded: witnessesAdded,
      savedDisplaySettings: savedDisplaySettings,
      savedAlgorithmSettings: savedAlgorithmSettings,
      savedDataSettings: savedDataSettings,
      existingCollation: existingCollation,
      findReadingPosById: findReadingPosById,
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
      removeWitness: removeWitness,
      setUpRemoveWitnessesForm: setUpRemoveWitnessesForm,
      removeWitnesses: removeWitnesses,
      getRemoveWitnessDataFromForm: getRemoveWitnessDataFromForm,
      checkWitnessesAgainstProject: checkWitnessesAgainstProject,
      setOverlappedOptions: setOverlappedOptions,
      setRuleClasses: setRuleClasses,
      returnToSummaryTable: returnToSummaryTable,
      prepareAdditionalCollation: prepareAdditionalCollation,
      removeSpecialWitnesses: removeSpecialWitnesses,
      runFunction: runFunction,

      //deprecated function mapping for calls from older services
      set_service_provider: setServiceProvider,
      load_index_page: loadIndexPage,
      add_index_handlers: addIndexHandlers,
      _managing_editor: managingEditor,
    };
  }
}());
