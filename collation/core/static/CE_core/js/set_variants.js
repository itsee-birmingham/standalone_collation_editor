/*jshint esversion: 6 */
var testing = false;
SV = (function() {
  "use strict";

  /** Major operations in this file (by which I mean ones directly called by the user interface) are:
   * combine_units (calling do_combine_units)
   * split_unit
   * move_reading
   * move_unit (calling do_move_whole_unit and do_move_single-reading)
   *  */

  // public variable declarations
  let undoStack = [],
    	messagePosLeft = null,
    	undoStackLength = 6,
    	showSharedUnits = false;

  // private variable declarations
  let _watchList = [],
    	_selectedVariantUnits = [],
    	_messageExpanded = true;

  // public function declarations
  let showSetVariants, showSetVariantsData, calculateUnitLengths, getUnitData,
    	getSpacerUnitData, getEmptySpacerCell, reindexUnit, checkCombinedGapFlags,
    	doSplitReadingWitnesses, unsplitUnitWitnesses, splitReadingWitnesses, separateOverlapWitnesses,
    	doSeperateOverlapWitnesses, prepareForOperation, unprepareForOperation, makeStandoffReading,
    	checkIds, checkBugStatus, checkStandoffReadingProblems, areAllUnitsComplete;

  // private function declarations
  let _moveToReorder, _setupMessage, _highlightWitness, _showSubreadings,
	    _redipsInitSV, _reindexMovedReading, _indexLessThan, _indexLessThanOrEqualTo,
	    _incrementSubIndex, _decrementSubIndex, _incrementMainIndex, _decrementMainIndex,
	    _reindexReadings, _checkAndFixIndexOrder, _checkAndFixReadingIndexes, _splitReadings,
	    _unsplitReadings, _removeWitnessFromTokens, _removeWitnessFromReading,
	    _removeSeparatedWitnessData, _getOverlappedWitnessesForUnit,
	    _doMoveWholeUnit, _targetHasOverlapConflict, _sourceHasOverlapConflict, _allOverlapsMatch,
	    _neighboursShareOverlaps, _doMoveSingleReading, _unitAtLocation, _getOverlapDetailsForGap,
	    _getOverlappedWitnessesForGap, _moveUnit, _checkWitnessEquality, _getLowestIndex,
	    _doCombineUnits, _checkOverlapBoundaries, _checkSpecialOverlapStatusAgreement,
	    _checkOverlapStatusAgreement, _getObjectKeys, _getGapDetails, _isSubsetOf, _specialCombineReadings,
	    _doSpecialCombineUnits, _combineUnits, _combineApparatusIds, _findApparatusPositionsByOverlapId,
	    _moveReading, _areAdjacent, _neighboursShareAllOverlaps, _getOverlappedIds,
	    _getReplacementOmReading, _combineReadings, _fixIndexNumbers, _orderUnitText,
	    _combineReadingText, _addTypeAndDetails, _combineWords, _separateIndividualOverlapWitnesses,
	    _doSplitUnit, _splitUnit, _tidyUnits, _checkUnitUniqueness, _getPosInUnitSet,
	    _overlapReading, _makeOverlappingReading, _moveOverlapping, _mergeOverlaps,
	    _checkAllWitnessesIntegrity, _checkWitnessIntegrity, _getFirstIndexForWitnesses,
	    _compareWitnessQueue, _checkWordOrderIntegrity, _checkUnitIntegrity,
	    _removeOffsetSubreadings, _hasStandoffSubreading, _makeMainReading, _addReadingFlag, _removeReadingFlag,
      _subreadingIdSort, _makeMenu, _addContextMenuHandlers, _addOverlappedEvent, _addEvent, _markReading, _undo,
	    _addToUndoStack, _removeSplits, _checkTAndNPresence, _checkForStandoffReading,
	    _checkSiglaProblems, _checkIndexesPresent, _checkUniqueWitnesses, _getAllUnitWitnesses,
	    _compareIndexStrings, _compareIndexes, _compareFirstWordIndexes, _setUpSVRemoveWitnessesForm,
      _highlightAddedWitness;


  //*********  public functions *********
  /**create and show the set variants display
   *
   * optional:
   * options - a dict containing other options
   * 		 possibilities are:
   * 			container - the HTML element to put the html result in
   *              		(defaults to body if not supplied or can't find it)
   * 			message - a string containing a message to display in the header bar
   *              		(used for warnings and errors)
   *              	highlighted_wit - the witness to highlight in display
   *              	highlighted_unit - the unit which needs to be highlighted as an error*/
  showSetVariants = function(options) {
    var footerHtml, preselectedAddedHighlight;
    console.log(CL.data);
    CL.stage = 'set';
    if (typeof options === 'undefined') {
      options = {};
    }
    // make sure we have a container to put things in
    if (options.hasOwnProperty('container')) {
      if (container !== options.container) {
        container = options.container;
      }
    } else {
      container = document.getElementsByTagName('body')[0];
    }
    if (CL.witnessRemovingMode !== true) {
      // attach right click menus
      SimpleContextMenu.setup({
        'preventDefault': true,
        'preventForms': false
      });
      SimpleContextMenu.attach('unit', function() {
        return _makeMenu('unit');
      });
      SimpleContextMenu.attach('overlap_unit', function() {
        return _makeMenu('overlap_unit');
      });
      SimpleContextMenu.attach('split_unit_a', function() {
        return _makeMenu('split_unit_a');
      });
      SimpleContextMenu.attach('split_unit', function() {
        return _makeMenu('split_unit');
      });
      SimpleContextMenu.attach('overlap_split_unit_a', function() {
        return _makeMenu('overlap_split_unit_a');
      });
      SimpleContextMenu.attach('overlap_split_unit', function() {
        return _makeMenu('overlap_split_unit');
      });
      SimpleContextMenu.attach('subreading', function() {
        return _makeMenu('subreading');
      });
      SimpleContextMenu.attach('split_omlac_unit', function() {
        return _makeMenu('split_omlac_unit');
      });
      SimpleContextMenu.attach('split_duplicate_unit', function() {
        return _makeMenu('split_duplicate_unit');
      });
      SimpleContextMenu.attach('split_deleted_unit', function() {
        return _makeMenu('split_overlapped_change_unit');
      });
      SimpleContextMenu.attach('split_overlapped_unit', function() {
        return _makeMenu('split_overlapped_change_unit');
      });
    }

    // sort out header and main page
    document.getElementById('header').innerHTML = CL.getHeaderHtml('Set Variants', CL.context);
    document.getElementById('header').className = 'set_variants_header';
    if (CL.services.hasOwnProperty('showLoginStatus')) {
      CL.services.showLoginStatus();
    }
    _addContextMenuHandlers();

    // sort out footer stuff
    CL.expandFillPageClients();
    footerHtml = [];
    if (CL.project.hasOwnProperty('showCollapseAllUnitsButton') && CL.project.showCollapseAllUnitsButton === true) {
      footerHtml.push('<button class="pure-button left_foot" id="expand_collapse_button">collapse all</button>');
    }
    footerHtml.push('<button class="pure-button left_foot" id="show_hide_subreadings_button">show subreadings</button>');
    if (CL.witnessEditingMode === false) {
      footerHtml.push('<span id="extra_buttons"></span>');
      footerHtml.push('<span id="stage_links"></span>');
    }
    if (CL.witnessEditingMode === true) {
      footerHtml.push('<button class="pure-button right_foot" id="return_to_saved_table_button">Return to summary table</button>');
    } else {
      footerHtml.push('<button class="pure-button right_foot" id="move_to_reorder_button">Move to Reorder Variants</button>');
    }
    footerHtml.push('<button class="pure-button right_foot" id="save">Save</button>');
    footerHtml.push('<select class="right_foot" id="highlighted" name="highlighted"></select>');
    if (CL.witnessAddingMode === true && CL.witnessesAdded.length > 0) {
      footerHtml.push('<select class="right_foot" id="added_highlight" name="added_highlight"></select>');
    }
    footerHtml.push('<button class="pure-button right_foot" id="undo_button" style="display:none">undo</button>');
    // this does the styling of the select elements in the footer using pure (they cannot be styled individually)
    $('#footer').addClass('pure-form');
    document.getElementById('footer').innerHTML = footerHtml.join('');
    CL.addExtraFooterButtons('set');
    CL.addStageLinks();

    // get the data itself
    container.innerHTML = '<div id="redips-drag"><div id="scroller" class="fillPage"></div>' +
                          '<div id="single_witness_reading"></div></div>';
    document.getElementById('single_witness_reading').style.bottom = document.getElementById('footer').offsetHeight +
                                                                     'px';
    if (CL.witnessAddingMode === true) {
      // this sets this a default so that when all is highlighted this will work - any data specified in
      // options will override it
      CL.highlightedAdded = JSON.parse(JSON.stringify(CL.witnessesAdded));
    }
    showSetVariantsData(options);

    //add functions and populate dropdowns etc.
    CL.addSubreadingEvents('set_variants');

    cforms.populateSelect(CL.getHandsAndSigla(), document.getElementById('highlighted'), {
      'value_key': 'document',
      'text_keys': 'hand',
      'selected': options.highlighted_wit,
      'add_select': true,
      'select_label_details': {
        'label': 'highlight witness',
        'value': 'none'
      }
    });
    if (CL.witnessAddingMode === true && CL.witnessesAdded.length > 0) {
      if (options.highlighted_added_wits.length === 1) {
        preselectedAddedHighlight = options.highlighted_added_wits[0];
      } else {
        preselectedAddedHighlight = 'all';
      }
      cforms.populateSelect(CL.sortWitnesses(CL.witnessesAdded), document.getElementById('added_highlight'), {
        'selected': preselectedAddedHighlight,
        'add_select': true,
        'select_label_details': {
          'label': 'highlight all added witnesses',
          'value': 'all'
        }
      });
    }

    $('#move_to_reorder_button').on('click', function(event) {
      _moveToReorder();
    });

    $('#save').on('click', function(event) {
      checkBugStatus('saved', 'state');
      SR.loseSubreadings();
      CL.saveCollation('set');
      if (CL.showSubreadings === true) {
        SR.findSubreadings();
      }
    });

    $('#return_to_saved_table_button').on('click', function() {
      let callback;
      callback = function() {
        SV.undoStack = [];
        CL.isDirty = false;
      };
      CL.returnToSummaryTable(callback);
    });

    $('#highlighted').on('change', function(event) {
      _highlightWitness(event.target.value);
    });
    if (document.getElementById('added_highlight')) {
      $('#added_highlight').on('change', function(event) {
        _highlightAddedWitness(event.target.value);
      });
    }
    if (document.getElementById('undo_button')) {
      $('#undo_button').on('click', function(event) {
        spinner.showLoadingOverlay();
        _undo();
      });
    }
    CL.makeVerseLinks();
  };

  showSetVariantsData = function(options) {
    var temp, header, html, appIds, num, overlaps, overlapOptions, newOverlapOptions, errorPanelHtml, eventRows,
				row, wits, removeWitsForm, removeFunction;
    // sort out options and get layout
    if (typeof options === 'undefined') {
      options = {};
    }
    if (!options.hasOwnProperty('highlighted_wit') && CL.highlighted !== 'none') {
      options.highlighted_wit = CL.highlighted;
    }
    if (CL.witnessAddingMode === true && !options.hasOwnProperty('highlighted_added_wits')) {
      options.highlighted_added_wits = CL.highlightedAdded;
    }
    options.sort = true;
    // remove the witness removal window if shown
    if (document.getElementById('remove_witnesses_div')) {
      document.getElementById('remove_witnesses_div').parentNode.removeChild(document.getElementById('remove_witnesses_div'));
    }
    if (CL.witnessEditingMode === true) {
      wits = CL.checkWitnessesAgainstProject(CL.dataSettings.witness_list, CL.project.witnesses);
      if (wits[0] === false) {
        if ((wits[1] === 'removed' || wits[1] === 'both') && CL.witnessRemovingMode === true) {
          $.get(staticUrl + 'CE_core/html_fragments/remove_witnesses_form.html', function(html) {
            if (!document.getElementById('remove_witnesses_div')) {
              removeWitsForm = document.createElement('div');
            } else {
              removeWitsForm = document.getElementById('remove_witnesses_div');
            }
            removeWitsForm.setAttribute('id', 'remove_witnesses_div');
            removeWitsForm.setAttribute('class', 'remove_witnesses_div dialogue_form');
            removeWitsForm.innerHTML = html;
            document.getElementsByTagName('body')[0].appendChild(removeWitsForm);
            removeFunction = function() {
              var handsToRemove;
              handsToRemove = CL.getRemoveWitnessDataFromForm('remove_witnesses_form');
              prepareForOperation();
              CL.removeWitnesses(handsToRemove, 'set');
              // clear undo stack so you can't go back to a point with the witnesses still present.
              SV.undoStack = [];
              unprepareForOperation();
              CL.isDirty = true;
            };
            CL.setUpRemoveWitnessesForm(wits[2], CL.data, 'set', removeFunction);
          }, 'text');
        }
      }
    }

    prepareForOperation();
    CL.lacOmFix();  // also does extra gaps
    unprepareForOperation();
    temp = CL.getUnitLayout(CL.data.apparatus, 1, 'set_variants', options);
    header = CL.getCollationHeader(CL.data, temp[1], true);
    html = header[0];
    html.push.apply(html, temp[0]);

    overlapOptions = {
      'column_lengths': temp[1]
    };
    if (options.hasOwnProperty('highlighted_wit')) {
      overlapOptions.highlighted_wit = options.highlighted_wit;
    }
    if (options.hasOwnProperty('highlighted_added_wits')) {
      overlapOptions.highlighted_added_wits = options.highlighted_added_wits;
    }
    if (options.hasOwnProperty('highlighted_unit')) {
      overlapOptions.highlighted_unit = options.highlighted_unit;
    }
    appIds = CL.getOrderedAppLines();
    for (let i = 0; i < appIds.length; i += 1) {
      num = appIds[i].replace('apparatus', '');
      newOverlapOptions = calculateUnitLengths(appIds[i], overlapOptions);
      overlaps = CL.getOverlapLayout(CL.data[appIds[i]], num, 'set_variants', header[1], newOverlapOptions);
      html.push.apply(html, overlaps[0]);
      temp[2].push.apply(temp[2], overlaps[1]);
    }
    html.push('<ul id="context_menu" class="SimpleContextMenu"></ul>');
    errorPanelHtml = '<div id="error_panel" class="warning dialogue_form" style="display:none">' +
      '<div class="dialogue_form_header drag-zone"><span id="message_summary">Messages</span>' +
      '<span id="error_coll_ex">&#9660;</span></div><div id="error_message_panel">' +
      '<span id="error_message">message</span></div></div>';
    document.getElementById('scroller').innerHTML = '<table class="collation_overview">' + html.join('') +
      '</table>' + errorPanelHtml;
    eventRows = temp[2];
    for (let i = 0; i < eventRows.length; i += 1) {
      row = document.getElementById(eventRows[i]);
      CL.addHoverEvents(row);
    }
    spinner.removeLoadingOverlay();
    if (CL.witnessRemovingMode !== true) {
      //initialise DnD
      _redipsInitSV();
    }

    if (SV.undoStack.length > 0) {
      CL.isDirty = true;
      document.getElementById("undo_button").style.display = 'inline';
    } else {
      document.getElementById("undo_button").style.display = 'none';
    }
    CL.addTriangleFunctions('list');
    // decide if we need to display any messages and display them if we do
    for (let i = 0; i < _watchList.length; i += 1) {
      if (_checkWitnessIntegrity(_watchList[i])) {
        _watchList[i] = null;
      }
    }
    CL.removeNullItems(_watchList);
    // TODO: something is off here when we get an info message and there is already a warning. Position is slightly
		// off and warning disappears but it should stay test by getting something out of order and then trying to split
		// witnesses on a single witness reading
    if (options.hasOwnProperty('message') && _watchList.length > 0) {
      _setupMessage('warning', options.message.message + '<br/><br/>WARNING: the following witnesses still have ' +
										'words out of order: ' + _watchList.join(', '));
    } else if (options.hasOwnProperty('message')) {
      _setupMessage(options.message.type, options.message.message);
    } else if (_watchList.length > 0) {
      _setupMessage('warning', 'WARNING: the following witnesses still have words out of order: ' +
										_watchList.join(', '));
    }
    CL.expandFillPageClients();
  };

  _setUpSVRemoveWitnessesForm = function(wits, data) {
    var html;
    document.getElementById('remove_witnesses_div').style.left = document.getElementById('scroller').offsetWidth -
																							document.getElementById('remove_witnesses_div').offsetWidth - 15 + 'px';
    html = [];
    for (let i = 0; i < wits.length; i += 1) {
      for (let key in data.hand_id_map) {
        if (data.hand_id_map.hasOwnProperty(key) && data.hand_id_map[key] === wits[i]) {
          html.push('<input class="boolean" type="checkbox" id="' + key + '" name="' + key + '"/><label>' +
										key + '</label><br/>');
        }
      }
    }
    document.getElementById('witness_checkboxes').innerHTML = html.join('');
    drag.initDraggable('remove_witnesses_div', true, true);
    $('#remove_selected_button').on('click', function() {
      var data, handsToRemove;
      handsToRemove = [];
      data = cforms.serialiseForm('remove_witnesses_form');
      for (let key in data) {
        if (data.hasOwnProperty(key) && data[key] === true) {
          handsToRemove.push(key);
        }
      }
      prepareForOperation();
      CL.removeWitnesses(handsToRemove, 'set');
      //clear undo stack so you can't go back to a point with the witnesses still present.
      SV.undoStack = [];
      unprepareForOperation();
    });
  };

  calculateUnitLengths = function(appId, options) {
    var index, app, topLine, id, start, firstHit, gapBefore, lastEnd, length, gapCounts, highestGap, gapAfter,
      	previousUnitGapAfter, previousUnitEnd, originalColumnLengths;
    if (options === undefined) {
      options = {};
    }
    topLine = CL.data.apparatus;
    app = CL.data[appId];
    options.overlap_details = {};  // get rid of the one from the last apparatus
    // copy the originalColumnLengths data so we can use to calculate gapAfter accurately
    originalColumnLengths = JSON.parse(JSON.stringify(options.column_lengths));

    for (let i = 0; i < app.length; i += 1) {
      id = app[i]._id;
      // first find real start value
      start = -1;
      for (let j = 0; j < topLine.length; j += 1) {
        if (topLine[j].hasOwnProperty('overlap_units') &&
              topLine[j].overlap_units.hasOwnProperty(id) && start === -1) {
          start = topLine[j].start;
          app[i].start = start;
        }
      }
      length = 0;
      gapBefore = 0;
      // find the first hit of this overlap_unit id in the top line
      // recoding the number of units in top line at this index which come before
      firstHit = -1;
      for (let j = 0; j < topLine.length; j += 1) {
        if (topLine[j].start === start) {
          if (topLine[j].hasOwnProperty('overlap_units') &&
                topLine[j].overlap_units.hasOwnProperty(id)) {
            if (firstHit === -1) {
              firstHit = j;
            }
          } else {
            if (firstHit === -1) {
              gapBefore += 1;
            }
          }
        }
      }
      // if we might have a conflict with gaps here then adjust as necessary
      if (start === previousUnitEnd) {
        gapBefore = Math.max(gapBefore - (originalColumnLengths[previousUnitEnd] - previousUnitGapAfter), 0);
      }
      index = firstHit;
      lastEnd = null;
      gapCounts = {};
      highestGap = 0;
      gapAfter = 0;
      while (index < topLine.length) {
        if (topLine[index].hasOwnProperty('overlap_units') &&
              topLine[index].overlap_units.hasOwnProperty(id)) {
              length += topLine[index].end - topLine[index].start + 1;
          if (lastEnd !== null && lastEnd + 2 === topLine[index].start) {
            length += 1;
          }
          // now work out what we might need to take off the last position column length
          if (topLine[index].start % 2 === 1) {  // if we start with odd number
            if (topLine[index].start > highestGap) {
              highestGap = topLine[index].start;
            }
            if (gapCounts.hasOwnProperty(topLine[index].start)) {
              gapCounts[topLine[index].start] += 1;
            } else {
              gapCounts[topLine[index].start] = 1;
            }
          }
          lastEnd = topLine[index].end;
        } else {
          if (topLine[index].start === lastEnd) {
            gapAfter += 1;
          }
        }
        index += 1;
      }
      if (app[i].end !== lastEnd) {
        SR.updateMarkedReadingData(app[i], {'end': lastEnd});
      }
      // change the end value of the overlap
      app[i].end = lastEnd;
      previousUnitGapAfter = gapAfter;
      previousUnitEnd = lastEnd;
      // adjust column length if necessary
      if (lastEnd % 2 === 1) {
        if (gapCounts.hasOwnProperty(highestGap)) {
          // The second condition here was added on 6th October 2021 - It might break some situations but fixes a bug found
          // TODO: this whole thing could perhaps be removed - need to find a situation where it is actually needed
          // and the second condition doesn't prevent it being applied
          if (options.column_lengths.hasOwnProperty(highestGap) &&
                  options.column_lengths[highestGap] !== gapCounts[highestGap]) {
            options.column_lengths[highestGap] = options.column_lengths[highestGap] - gapCounts[highestGap];
          }
        }
      }
      options.overlap_details[id] = {
        'col_length': length,
        'gap_before': gapBefore,
        'gap_after': gapAfter
      };
    }
    return options;
  };

  /** get the unit data for set variants. Control the display of the data
   * 	data - the list of readings for the unit
   * 	id - the identifier for the unit
   * 	start - the start position of the unit
   * 	end - the end position of the unit
   * 	options - dictionary of other options
   * 		split - boolean - does this unit display as separate readings
   * 		overlap - boolean - is this unit overlapping
   * 		gap_unit - boolean - is this a unit which only contains lac/om readings
   * 		col_length - int - the expected column width based on other table rows
   * 		highlighted_wit - the witness to highlight
   * 		highlighted_added_wits - the witnesses to highlight of those that have been added CL.witnessAddingMode only
   * 		highlighted_unit - the unit to highlight (used for showing which units have errors I think)
   * 		created - boolean (is this a specially created gap element)
   * 		overlapping_ids - a list of ids for any overlapping readings realted to this top line reading
   * 		td_id - the id for the cell (used in overlap rows to allow readings to be moved between rows))
   *    overlap_units - the overlap_units object as recorded on the unit (for working out overlap witnesses)*/
  getUnitData = function(data, id, start, end, options) {
    var html, decisions, rows, cells, rowList, temp, events, colspan, rowId, text, splitClass, highlightedHand,
      	highlightedUnit, highlightedClasses, svRules, readingSuffix, readingLabel, allOverlappedWitnesses;
    html = [];
    rowList = [];
    if (typeof options === 'undefined') {
      options = {};
    }
    if (options.hasOwnProperty('highlighted_wit')) {
      highlightedHand = options.highlighted_wit.split('|')[1];
    } else {
      highlightedHand = null;
    }
    if (options.hasOwnProperty('col_length')) {
      colspan = options.col_length;
    } else {
      colspan = end - start + 1;
    }
    //get all the subreading rules and delete any that stay as main reading
    svRules = CL.getRuleClasses(undefined, undefined, 'value', ['identifier', 'keep_as_main_reading', 'suffixed_label', 'suffixed_reading']);
    for (let key in svRules) {
      if (svRules.hasOwnProperty(key) && svRules[key][1] === false) {
        delete svRules[key];
      }
    }
    if (options.hasOwnProperty('td_id')) {
      html.push('<td id="' + options.td_id + '" class="start_' + start + '" headers="NA_' + start + '" colspan="' + colspan + '">');
    } else {
      html.push('<td class="start_' + start + '" headers="NA_' + start + '" colspan="' + colspan + '">');
    }

    // is the unit highlighted? used for showing errors
    if (options.hasOwnProperty('highlighted_unit') && parseInt(id) === options.highlighted_unit[1]) {
      highlightedUnit = ' highlighted_unit';
    } else {
      highlightedUnit = '';
    }

    allOverlappedWitnesses = [];
    if (options.hasOwnProperty('split') && options.split === true && options.hasOwnProperty('overlap_units')) {
      for (let key in options.overlap_units) {
        allOverlappedWitnesses = allOverlappedWitnesses.concat(options.overlap_units[key]);
      }
    }
    for (let i = 0; i < data.length; i += 1) {
      // what is the reading text?
      text = CL.extractDisplayText(data[i], i, data.length, options.unit_id, options.app_id);

      if (text.indexOf('system_gen_') !== -1) {
        text = text.replace('system_gen_', '');
      }
      // what labels need to be used?
      readingLabel = CL.getReadingLabel(i, data[i], svRules);
      readingSuffix = CL.getReadingSuffix(data[i], svRules);
      // what is the row id? (and add it to the list for adding events)
      rowId = 'variant_unit_' + id + '_row_' + i;
      rowList.push(rowId);

      // Work out what reading highlighting classes we need
      highlightedClasses = [];
      if (data[i].witnesses.indexOf(highlightedHand) != -1) {
        // this is the regular highlighting of any selected witness
        highlightedClasses.push('highlighted');
      }
      if (options.hasOwnProperty('highlighted_added_wits') &&
            data[i].witnesses.filter(x => options.highlighted_added_wits.includes(x)).length > 0) {
        highlightedClasses.push('added_highlighted');
      }
      if (options.hasOwnProperty('split') && options.split === true) {
        if (data[i].hasOwnProperty('overlap_status')) {
          html.push('<div id="' + 'drag_unit_' + id + '_reading_' + i + '" class="redips-drag split_' +
                    data[i].overlap_status + '_unit">');
        } else {
          if (options.hasOwnProperty('overlap') && options.overlap === true) {
            if (i === 0) {
              splitClass = 'overlap_split_unit_a';
            } else {
              splitClass = 'overlap_split_unit';
            }
          } else {
            if (i === 0) {
              splitClass = 'split_unit_a';
            } else {
              if (CL.witnessAddingMode === true &&
                    data[i].witnesses.filter(x => allOverlappedWitnesses.includes(x)).length === data[i].witnesses.length) {
                splitClass = 'redips-drag split_duplicate_unit';
              } else {
                splitClass = 'redips-drag split_unit';
              }
            }
          }
          html.push('<div id="' + 'drag_unit_' + id + '_reading_' + i + '" class="' + splitClass + '">');
        }
        html.push('<ul class="variant_unit" id="variant_unit_' + id + '_reading_' + i + '">');

        html.push('<li id="' + rowId + '" class="' + highlightedClasses.join(' ') + '">');
        html.push('<div class="spanlike">' + readingLabel + ' ' + text + readingSuffix + '  </div>');
        temp = _showSubreadings(data[i], id, i, highlightedHand, options.highlighted_added_wits);
        html.push.apply(html, temp[0]);
        rowList.push.apply(rowList, temp[1]);
        html.push('</li>');
        html.push('</ul>');
        html.push('</div>');
      } else {
        if (i === 0) {
          if (options.hasOwnProperty('overlap') && options.overlap === true) {
            html.push('<div id="' + 'drag_unit_' + id + '" class="redips-drag overlap_unit' + highlightedUnit + '">');
          } else if (options.hasOwnProperty('gap_unit') && options.gap_unit === true) {
            html.push('<div id="' + 'drag_unit_' + id + '" class="redips-drag gap_unit' + highlightedUnit + '">');
          } else {
            html.push('<div id="' + 'drag_unit_' + id + '" class="redips-drag unit' + highlightedUnit + '">');
          }
          if (data.length > 1) {
            html.push('<ul class="variant_unit" id="variant_unit_' + id + '"><span id="toggle_variant_' + id + '" class="triangle">&#9660;</span><br/>');
          } else {
            html.push('<ul class="variant_unit" id="variant_unit_' + id + '"><br/>');
          }
          html.push('<li id="' + rowId + '" class="top ' + highlightedClasses.join(' ') + '">');
        } else {
          html.push('<li id="' + rowId + '" class="' + highlightedClasses.join(' ') + '">');
        }
        html.push('<div class="spanlike">' + readingLabel + ' ' + text + readingSuffix + '  </div>');
        temp = _showSubreadings(data[i], id, i, highlightedHand, options.highlighted_added_wits);
        html.push.apply(html, temp[0]);
        rowList.push.apply(rowList, temp[1]);
        html.push('</li>');
      }
    }
    html.push('</ul>');
    html.push('</div>');
    html.push('</td>');
    return [html, rowList];
  };

  /** next two functions deal with creation of 'spacer cells'. These cells maintain the width of all table cells
   * during dragging of units. Without them the table collapses when a unit is dragged */
  getSpacerUnitData = function(id, start, end, colLength) {
    var colspan;
    if (colLength !== undefined) {
      colspan = colLength + (end - start);
    } else {
      colspan = end - start + 1;
    }
    if (id !== undefined) {
      return '<td  class="redips-mark"colspan="' + colspan + '"><div id="spacer_' + id + '" class="spacer"></div></td>';
    } else {
      return '<td  class="redips-mark"colspan="' + colspan + '"><div class="spacer"></div></td>';
    }
  };

  getEmptySpacerCell = function(start, end) {
    if (typeof start === 'undefined' || typeof end === 'undefined') {
      return '<td class="redips-mark"></td>';
    } else {
      return '<td class="redips-mark" colspan="' + (end - start + 1) + '"></td>';
    }
  };

  /** reindex the specified unit starting with the location. Or all the units at this location if a multiple entry gap.
   * This is used when we are relocating units or relocating readings so that split words doesn't return
   * them back to their original locations but they are properly rooted to the location they have been moved to*/
  reindexUnit = function(location) {
    var firstWordIndex;
    firstWordIndex = 1;
    for (let i = 0; i < CL.data.apparatus.length; i += 1) {
      if (CL.data.apparatus[i].start === location) {
        CL.data.apparatus[i].first_word_index = location + '.' + firstWordIndex;
        firstWordIndex = _reindexReadings(CL.data.apparatus[i].readings, location, firstWordIndex);
      }
    }
  };

  /** this assumes combined gap details for subreadings are correct and simply checks to see if the one in the text tokens of the main reading are required or not */
  checkCombinedGapFlags = function(reading) {
    if (reading.text.length > 0) {
      if (reading.text[0].hasOwnProperty('combined_gap_before')) {
        if (reading.text[0].combined_gap_before.length === 0) {
          if (!reading.hasOwnProperty('combined_gap_before_subreadings')) {
            delete reading.text[0].combined_gap_before;
          }
        }
      }
      if (reading.text[0].hasOwnProperty('combined_gap_after')) {
        if (reading.text[0].combined_gap_after.length === 0) {
          if (!reading.hasOwnProperty('combined_gap_after_subreadings')) {
            delete reading.text[0].combined_gap_after;
          }
        }
      }
    }
  };

  /** split supplied witnesses away from others in the reading */
  doSplitReadingWitnesses = function(unitNum, readingPos, witnessList, apparatus, log, idForNewReading) {
    var originalUnit, aReading, reading, newReading, newWitnessList, originalRemoved;
    if (apparatus === undefined) {
      apparatus = 'apparatus';
    }
    originalUnit = CL.data[apparatus][unitNum];
    aReading = originalUnit.readings[0];
    reading = originalUnit.readings[readingPos];
    // copy the original reading to make a the new one
    newReading = JSON.parse(JSON.stringify(reading));
    // remove readings on witnessList from the original reading
    for (let i = 0; i < witnessList.length; i += 1) {
      _removeWitnessFromReading(reading, witnessList[i]);
    }
    // if no witnesses left at all and there are no subreadings then delete the original reading
    if (reading.witnesses.length === 0 && !reading.hasOwnProperty('subreadings')) {
      originalUnit.readings.splice(readingPos, 1);
      originalRemoved = true;
    } else {
      checkCombinedGapFlags(reading);
      originalRemoved = false;
    }
    // remove all not on witnessList from newReading
    newWitnessList = CL.getAllReadingWitnesses(newReading);  // a copy so we aren't manipulating what we are looping!
    for (let i = 0; i < newWitnessList.length; i += 1) {
      if (witnessList.indexOf(newWitnessList[i]) === -1) {
        _removeWitnessFromReading(newReading, newWitnessList[i]);
      }
    }
    checkCombinedGapFlags(newReading);
    if (typeof idForNewReading !== 'undefined') {
      newReading._id = idForNewReading;
			// add the new reading into the unit, we know this is an addition because it has a supplied id
      originalUnit.readings.splice(readingPos + 1, 0, newReading);
      return newReading._id;
    } else if (originalRemoved === true) {
      if (!newReading.hasOwnProperty('_id')) {
        CL.addReadingId(newReading, originalUnit.start, originalUnit.end);
      }
      originalUnit.readings.splice(readingPos, 0, newReading);  // add the new reading into the unit
      return newReading._id;
    } else {
      // change id of new reading so it is distinct from the original one
      // in the if loop we deleted the original so id can stay!
      CL.addReadingId(newReading, originalUnit.start, originalUnit.end);
      originalUnit.readings.splice(readingPos + 1, 0, newReading);  // add the new reading into the unit
      return newReading._id;
    }
    if (log) {
      checkBugStatus('split witnesses', 'in ' + apparatus + ' unit ' + unitNum + ' reading ' + readingPos +
										 ' witnesses ' + witnessList.join(',') + '.');
    }
  };

  /** recombine the witnesses of any identical readings
   *
   * should always have called prepare_for_operation before calling this
   * so subreadings are always hidden and standoff readings are always main readings
   * after this unprepare_for_operation will run find subreadings
   * at the end of this operation standoff marked readings should still be main readings even if they share a parent with another reading
   * we only need to combined readings that are not marked as standoff
   * */
  unsplitUnitWitnesses = function(unitNum, appId) {
    var text, unit, reading, readingList, index, witness, standoffRecord, isStandoff;
    readingList = [];
    unit = CL.data[appId][unitNum];
    _removeSeparatedWitnessData(appId, unit._id);

    for (let i = 0; i < unit.readings.length; i += 1) {
      reading = unit.readings[i];
      // get the text and add '_a' if it is the first reading of an overlapped unit (although I don't
      // think we ever call this on overlapped units anymore)
      text = CL.extractWitnessText(reading, {
        'app_id': appId,
        'unit_id': unit._id
      });
      if (i === 0 && appId !== 'apparatus') {
        text = text + '_a';
      }
      if (reading.hasOwnProperty('overlap_status')) {
        if (reading.overlap_status === 'duplicate') {
          // make sure each duplicate is unique because we do not want to merge
          // these - they might need to be treated differently
          text = text + '_OLSTS_duplicate' + i;
        } else {
          // the capital letters are there to help ensure no clash with any real words
          text = text + '_OLSTS_' + reading.overlap_status;
        }
      }
      if (reading.hasOwnProperty('reading_classes') && reading.reading_classes.length > 0) {
        text = text + '_RDGCLS_' + reading.reading_classes.join('_');
      }
      if (reading.hasOwnProperty('type') && reading.type === 'lac_verse') {
        text = text + '_lac_verse';
      }
      // find out if this is a standoff reading
      // at this point all witnesses to the reading should be standoff if it is a standoff reading made into a main
      // reading so just check first witness (and keep fingers crossed!)
      isStandoff = true;
      standoffRecord = CL.findStandoffRegularisation(unit, reading.witnesses[0], appId);
      if (standoffRecord === null) {
        isStandoff = false;
      }
      //ignore standoff readings
      if (isStandoff === true) {
        readingList.push(null);
      } else {
        index = readingList.indexOf(text);
        if (index !== -1 && text.length > 0) {  // if we have text and the reading is already in the list of readings
          readingList.push(null); //needed so our list indexes stay alligned with the readings in the unit
          for (let j = 0; j < reading.witnesses.length; j += 1) {
            if (unit.readings[index].witnesses.indexOf(reading.witnesses[j]) === -1) {
              unit.readings[index].witnesses.push(reading.witnesses[j]);
            }
          }
          // put individual details for each witness in the new reading
          for (let j = 0; j < reading.witnesses.length; j += 1) {
            witness = reading.witnesses[j];
            for (let k = 0; k < reading.text.length; k += 1) {
              if (reading.text[k].hasOwnProperty(witness)) {
                unit.readings[index].text[k][witness] = reading.text[k][witness];
              }
              // check if any readings need the regularised flag (because some witnesses have decisions to apply)
              if (unit.readings[index].text[k][witness].hasOwnProperty('decision_class')) {
                unit.readings[index].text[k].regularised = true;
              }
            }
          }
          // append the new witnesses to reading and doc_id inside text
          for (let j = 0; j < unit.readings[index].text.length; j += 1) {
            for (let k = 0; k < reading.text[j].reading.length; k += 1) {
              if (unit.readings[index].text[j].reading.indexOf(reading.text[j].reading[k]) === -1) {
                unit.readings[index].text[j].reading.push(reading.text[j].reading[k]);
              }
            }
          }
          unit.readings[i] = null;
        } else if (index !== -1 && text.length === 0 && reading.type === 'om') {
          readingList.push(null);  // needed so our list indexes stay alligned with the readings in the unit
          if (unit.readings[index].type === 'om') {
            unit.readings[index].witnesses.push.apply(unit.readings[index].witnesses, reading.witnesses);
            reading = null;
          }
        } else {
          readingList.push(text);
        }
      }
    }
    CL.removeNullItems(unit.readings);
  };

  /** displays menu for splitting witnesses of a reading */
  splitReadingWitnesses = function(rdgDetails, stage, menuPos) {
    var reading, scrollOffset, witnessList, data, unit;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
      							document.getElementById('scroller').scrollTop];
    reading = CL.data[rdgDetails[1]][rdgDetails[0]].readings[rdgDetails[2]];
    if (CL.getAllReadingWitnesses(reading).length > 1) {
      CL.showSplitWitnessMenu(reading, menuPos, {
        'type': 'duplicate',
        'header': 'Select witnesses',
        'button': 'Split witnesses',
        'form_size': 'small'
      });
      $('#select_button').on('click', function(event) {
        witnessList = [];
        data = cforms.serialiseForm('select_wit_form');
        if (!$.isEmptyObject(data)) {
          witnessList = [];
          for (let key in data) {
            if (data.hasOwnProperty(key)) {
              if (data[key] !== null) {
                witnessList.push(key);
              }
            }
          }
        }
        if (stage === 'order_readings') {
          OR.addToUndoStack(CL.data);
        }
        // Do not need to prepare for this operation as we just manipulate all the data directly and we need
        // everything to stay as subreadings etc.
				// make the data structure to remember this split
        if (!CL.data.hasOwnProperty('separated_witnesses')) {
          CL.data.separated_witnesses = [];
        }
        unit = CL.data[rdgDetails[1]][rdgDetails[0]];
        CL.data.separated_witnesses.push({
          'app_id': rdgDetails[1],
          'unit_id': unit._id,
          'witnesses': witnessList
        });
        doSplitReadingWitnesses(rdgDetails[0], rdgDetails[2], witnessList, rdgDetails[1], true);
        document.getElementsByTagName('body')[0].removeChild(document.getElementById('wit_form'));
        if (stage === 'set_variants') {
          checkBugStatus('move', 'split witnesses ' + witnessList.join(', ') + ' out of reading ' + rdgDetails[2] +
												 ' in unit ' + rdgDetails[0] + ' in apparatus.');
          showSetVariantsData();
        }
        if (stage === 'order_readings') {
          OR.relabelReadings(CL.data[rdgDetails[1]][rdgDetails[0]].readings, true);
          OR.showOrderReadings({
            'container': CL.container
          });
        }
        document.getElementById('scroller').scrollLeft = scrollOffset[0];
        document.getElementById('scroller').scrollTop = scrollOffset[1];
      });
    } else {
      _setupMessage('error', 'ERROR: Readings with a single witness cannot be split');
    }
  };

  //subreading functions

  /** Get ready to do an operation of moving/combining/splitting etc.
   *  by making all offset subreadings main readings (in case following the action
   *  the standoff mark no longer applies) and by merging all non-standoff subreadings
   *  into their parents so we don't have to worry about them.
   */
  prepareForOperation = function() {
    _removeOffsetSubreadings();  // this runs find_subreadings
    SR.loseSubreadings();
  };

  /** Reverse the prepare operation by returning the necessary subreadings and offset readings */
  unprepareForOperation = function() {
    // first run find_subreadings so that the offset subreadings that were made
    // main readings in prepare are put back as subreadings (if they still match their offset record)
    SR.loseSubreadings();
    SR.findSubreadings();  // this looks like the breaking point
    // then if we aren't looking at subreadings hide them again
    if (CL.showSubreadings === false) {
      SR.loseSubreadings();
      if (CL.stage === 'ordered') {
        SR.findSubreadings({
          'rule_classes': CL.getRuleClasses('subreading', true, 'value', ['identifier', 'subreading'])
        });  // only show the subreadings when there class is labelled as subreading in the project)))
      }
    }
  };

  makeStandoffReading = function(type, readingDetails, parentReading, outerCallback) {
    var scrollOffset, callback;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    _addToUndoStack(CL.data);
    callback = function() {
      checkBugStatus('make offset reading', 'of type ' + type + ' in apparatus unit ' + readingDetails.unit_pos +
										 ' of reading ' + readingDetails.reading_pos + ' as a subreading of ' + parentReading + '.');
      showSetVariantsData();
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
      if (outerCallback !== undefined) {
        outerCallback();
      }
    };
    CL.makeStandoffReading(type, readingDetails, parentReading, callback);
  };

  checkIds = function() {
    for (let key in CL.data) {
      if (key.indexOf('apparatus') !== -1) {
        for (let i = 0; i < CL.data[key].length; i += 1) {
          if (!CL.data[key][i].hasOwnProperty('_id')) {
            return [true, ' there is no id on unit ' + i + ' in ' + key];
          }
          for (let j = 0; j < CL.data[key][i].readings.length; j += 1) {
            if (!CL.data[key][i].readings[j].hasOwnProperty('_id')) {
              return [true, ' there is no id on reading ' + j + ' in unit ' + i + ' in ' + key];
            }
          }
        }
      }
    }
    return [false];
  };

  /** My bug self reporting system attempt! */
  checkBugStatus = function(action, details) {
    var indexProblem, witnessProblem, bugReport, newWindow1, tmp, siglaProblem, standoffProblem, tnCheck, idProblem;
    if (!CL.data.hasOwnProperty('event_list')) {
      CL.data.event_list = [];
    }
    //first log the event in the list
    CL.data.event_list.push(action + ' ' + details);
    //then check the event didn't cause a recognised data issue
    indexProblem = _checkIndexesPresent();
    witnessProblem = _checkUniqueWitnesses();
    siglaProblem = _checkSiglaProblems();
    standoffProblem = checkStandoffReadingProblems();
    tnCheck = _checkTAndNPresence();
    idProblem = checkIds();
    //if it does then prepare a bug report
    if (indexProblem[0] || witnessProblem[0] || siglaProblem[0] || standoffProblem[0] || tnCheck[0] || idProblem[0]) {
      bugReport = [];
      bugReport.push(CL.context + '\n');
      for (let i = 0; i < CL.data.event_list.length; i += 1) {
        bugReport.push(CL.data.event_list[i]);
      }
      if (indexProblem[0]) {
        bugReport.push(indexProblem[1]);
      }
      if (witnessProblem[0]) {
        bugReport.push(witnessProblem[1]);
      }
      if (siglaProblem[0]) {
        bugReport.push(siglaProblem[1]);
      }
      if (standoffProblem[0]) {
        bugReport.push(standoffProblem[1]);
      }
      if (tnCheck[0]) {
        bugReport.push(tnCheck[1]);
      }
      if (idProblem[0]) {
        bugReport.push(idProblem[1]);
      }
      alert('A problem has occurred.\nA bug report will open in a new window.\nYou will need to start again.');
      newWindow1 = open('', 'name', 'height=400,width=400,scrollbars=yes');
      newWindow1.focus();
      tmp = newWindow1.document.body;
      tmp.innerHTML = bugReport.join('<br/>');
    }
  };

  //this function checks that each instance of SR_text or standoff_subreadings
  //has a corresponding entry in the marked_readings object
  checkStandoffReadingProblems = function() {
    var unit, reading, result;
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.match(/apparatus\d*/g) !== null) {
          for (let i = 0; i < CL.data[key].length; i += 1) {
            unit = CL.data[key][i];
            for (let j = 0; j < unit.readings.length; j += 1) {
              reading = unit.readings[j];
              if (reading.hasOwnProperty('SR_text') || reading.hasOwnProperty('standoff_subreadings')) {
                if (reading.hasOwnProperty('SR_text')) {
                  for (let witness in reading.SR_text) {
                    if (reading.SR_text.hasOwnProperty(witness)) {
                      result = _checkForStandoffReading(witness, unit);
                      if (result === false) {
                        return [true, witness + ' has SR_text in the unit starting at ' + unit.start +
																' and ending at ' + unit.end + ' and there is no corresponding marked reading entry.'];
                      }
                    }
                  }
                }
                if (reading.hasOwnProperty('standoff_subreadings')) {
                  for (let k = 0; k < reading.standoff_subreadings.length; k += 1) {
                    result = _checkForStandoffReading(reading.standoff_subreadings[k], unit);
                    if (result === false) {
                      return [true, reading.standoff_subreadings[k] + ' has standoff_subreadings in the unit ' +
															'starting at ' + unit.start + ' and ending at ' + unit.end + ' and there is no ' +
															'corresponding marked reading entry.'];
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return [false];
  };

  areAllUnitsComplete = function() {
    var totalRequired, witnesses, totalSigla;
    totalRequired = 0;
    totalSigla = [];
    for (let key in CL.data.hand_id_map) {
      if (CL.data.hand_id_map.hasOwnProperty(key)) {
        totalRequired += 1;
        totalSigla.push(key);
      }
    }
    for (let i = 0; i < CL.data.apparatus.length; i += 1) {
      witnesses = _getAllUnitWitnesses(CL.data.apparatus[i]);
      if (witnesses.length !== totalRequired) {
        for (let j = 0; j < witnesses.length; j += 1) {
          if (totalSigla.indexOf(witnesses[j]) === -1) {
            console.log('extra witness ' + witnesses[j]);
          } else {
            totalSigla[totalSigla.indexOf(witnesses[j])] = null;
          }
        }
        console.log('witnesses missing in unit ' + i);
        return false;
      }
    }
    return true;
  };


  //*********  private functions *********

  _moveToReorder = function() {
    var allComplete, allInOrder, standoffProblems, extraResults;
    // we are keeping any empty units from the last state of SV
    // we need to combined overlaps with identical index points
    spinner.showLoadingOverlay();
    SR.loseSubreadings(); //  for preparation and is needed
    allComplete = areAllUnitsComplete();
    allInOrder = _checkAllWitnessesIntegrity();
    standoffProblems = checkStandoffReadingProblems();

    if (allComplete && allInOrder && !standoffProblems[0]) {
      extraResults = CL.applyPreStageChecks('order_readings');
      if (extraResults[0] === true) {
        CL.showSubreadings = false;
        // we have some legacy data which has not had all of the matching readings in each unit combined
        // so to ensure they are fixed now we need to call the following 3 functions
        // would be nicer to just change the data on the database but it would mean rewriting in python
        prepareForOperation();
        _removeSplits();
        unprepareForOperation();
        SR.loseSubreadings(); //  for preparation and is needed
        OR.removeSplits(); //  ensure all the units are unsplit (readings wise) - still needed
        OR.mergeSharedExtentOverlaps(); //  do this before adding labels so the labels are correct))
        OR.makeWasGapWordsGaps();
        // merge lacs into a single unit if in settings (default is also true to protect existing projects)
        // we used to do this with OM as well but om verse should never be merged with OM so I don't run it anymore
        // as there should be no more that one OM and om verse in any given unit.
        if (CL.project.combineAllLacsInOR === true) {
          OR.mergeAllLacs();
        }
        if (CL.project.combineAllOmsInOR === true) {
          OR.mergeAllOms();
        }

        OR.addLabels(true); // this adds the reading labels to the datastructure itself - still required so they can be edited
        // log that we have moved to OR in the event_list
        if (CL.data.hasOwnProperty('event_list')) {
          CL.data.event_list.push('moved to order readings');
        }
        SR.findSubreadings({
          'rule_classes': CL.getRuleClasses('subreading', true, 'value', ['identifier', 'subreading'])
        }); // only show the subreadings when there class is labelled as subreading in the project)))
        // remove the remove witnesses menu if it is still hanging about
        if (document.getElementById('remove_witnesses_div')) {
          document.getElementById('remove_witnesses_div').parentNode.removeChild(document.getElementById('remove_witnesses_div'));
        }
        OR.showOrderReadings({
          'container': container
        });
      } else {
        if (CL.showSubreadings === true) {
          SR.findSubreadings();
        }
        alert(extraResults[1]);
        spinner.removeLoadingOverlay();
      }
    } else if (!allComplete) {
      if (CL.showSubreadings === true) {
        SR.findSubreadings();
      }
      alert('You cannot move to order readings because one of the units does not have all of its required witnesses');
      spinner.removeLoadingOverlay();
    } else if (!allInOrder) {
      if (CL.showSubreadings === true) {
        SR.findSubreadings();
      }
      alert('You cannot move to order readings because one of the witnesses has words out of order');
      spinner.removeLoadingOverlay();
      // TODO: more informative errors for the above including highlighting the problems on the screen
    } else if (standoffProblems[0]) {
      if (CL.showSubreadings === true) {
        SR.findSubreadings();
      }
      alert('You cannot move to order readings because ' + standoffProblems[1]);
      spinner.removeLoadingOverlay();
    }
  };

  /** displays warning and error messages on the screen in a draggable and collapsable box */
  _setupMessage = function(type, message) {
    var dropFunction;
    document.getElementById('error_message_panel').innerHTML = message;
    $('#error_panel').removeClass('warning');
    $('#error_panel').removeClass('error');
    $('#error_panel').removeClass('clear');
    $('#error_panel').addClass(type);
    if (document.getElementById('error_panel').style.display === 'none') {
      document.getElementById('error_panel').style.display = 'block';
      dropFunction = function(draggable) {
        SV.messagePosLeft = draggable.style.left;
        SV.messagePosTop = draggable.style.top;
      };
      drag.initDraggable('error_panel', true, true, dropFunction);
      document.getElementById('error_message_panel').style.height = document.getElementById('error_panel').offsetHeight - 40 + 'px';
    }
    if (_messageExpanded === true) {
      document.getElementById('error_message_panel').style.display = 'block';
      document.getElementById('error_coll_ex').innerHTML = '&#9660;';
    } else {
      document.getElementById('error_message_panel').style.display = 'none';
      document.getElementById('error_coll_ex').innerHTML = '&#9650;';
    }
    if (SV.messagePosLeft !== null) {
      document.getElementById('error_panel').style.left = SV.messagePosLeft;
      document.getElementById('error_panel').style.top = SV.messagePosTop;

    } else {
      document.getElementById('error_panel').style.top = (document.getElementById('header').offsetHeight +
          document.getElementById('scroller').offsetHeight +
          document.getElementById('single_witness_reading').offsetHeight) -
        document.getElementById('error_panel').offsetHeight + 'px';
      document.getElementById('error_panel').style.left = document.getElementById('scroller').offsetWidth -
        document.getElementById('error_panel').offsetWidth - 15 + 'px';
    }
    $('#error_coll_ex').on('click', function(event) {
      if (document.getElementById('error_message_panel').style.display === 'block') {
        document.getElementById('error_panel').style.top = parseInt(document.getElementById('error_panel').style.top) +
          parseInt(document.getElementById('error_message_panel').offsetHeight) + 'px';
        document.getElementById('error_message_panel').style.display = 'none';
        document.getElementById('error_coll_ex').innerHTML = '&#9650;';
        SV.messagePosTop = document.getElementById('error_panel').style.top;
        _messageExpanded = false;
      } else {
        document.getElementById('error_message_panel').style.display = 'block';
        document.getElementById('error_panel').style.top = parseInt(document.getElementById('error_panel').style.top) -
          parseInt(document.getElementById('error_message_panel').offsetHeight) + 'px';
        document.getElementById('error_coll_ex').innerHTML = '&#9660;';
        SV.messagePosTop = document.getElementById('error_panel').style.top;
        _messageExpanded = true;
      }
    });
  };

  /** highlight a witness, called from select box in page footer */
  _highlightWitness = function(witness) {
    var scrollOffset;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
      							document.getElementById('scroller').scrollTop];
    CL.highlighted = witness;
    showSetVariantsData({
      'highlighted_wit': CL.highlighted
    });
    CL.getHighlightedText(CL.highlighted);
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  /** highlight a witness that has been added or highlight all added witnesses with 'all'
	* (only in CL.witnessAddingMode), called from select box in page footer */
  _highlightAddedWitness = function(witness) {
    var scrollOffset, witnesses;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
      							document.getElementById('scroller').scrollTop];
    if (witness === 'all') {
      witnesses = CL.witnessesAdded;
    } else {
      witnesses = [witness];
    }
    CL.highlightedAdded = witnesses;
    showSetVariantsData({
      'highlighted_added_wits': witnesses
    });

    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  /** the code for displaying subreadings present in the object model */
  _showSubreadings = function(reading, id, i, hand, highlightedAdded) {
    var html, subrowId, rowList, suffixed, suffix, highlighted, textString, highlightedClasses;
    html = [];
    rowList = [];
    textString = '';
    if (reading.hasOwnProperty('subreadings')) {
      html.push('<ul class="subreading_unit" id="subreading_unit_' + id + '_row_' + i + '">');
      for (let type in reading.subreadings) {
        if (reading.subreadings.hasOwnProperty(type)) {
          suffix = reading.subreadings[type][0].suffix;
          for (let j = 0; j < reading.subreadings[type].length; j += 1) {
            highlightedClasses = [];
            subrowId = 'subreading_unit_' + id + '_row_' + i + '_type_' + type + '_subrow_' + j;
            rowList.push(subrowId);
            if (reading.subreadings[type][j].witnesses.indexOf(hand) !== -1) {
              highlightedClasses.push('highlighted');
            }
            if (highlightedAdded !== undefined &&
                  reading.subreadings[type][j].witnesses.filter(x => highlightedAdded.includes(x)).length > 0) {
              highlightedClasses.push('added_highlighted');
            }
            if (reading.subreadings[type][j].type === 'lac') {
              textString = '&lt;' + reading.subreadings[type][j].text_string + '&gt;';
            } else {
              textString = reading.subreadings[type][j].text_string;
            }
            html.push('<li class="subreading ' + highlightedClasses.join(' ') + '" id="' + subrowId +
              '"><div class="spanlike"><div class="spanlike">' +
              CL.getAlphaId(i) + suffix + '. ' + textString + '</div></div></li>');
          }
        }
      }
      html.push('</ul>');
    }
    return [html, rowList];
  };

  /** initiate the drag and drop
   * also some functions and tests for behaviours are included in here
	 **/
  _redipsInitSV = function() {
    var rd, i, unitNum, sourceCol, targetCol, sourceRow, targetRow, errorMess, triangles, unit1, unit2,
				unit, scrollOffset, width, isSpace;
    rd = REDIPS.drag;
    rd.init();
    rd.event.clicked = function() {
      width = document.getElementById(rd.obj.id).offsetWidth;
      if (document.getElementById(rd.obj.id.replace('drag_unit', 'spacer'))) {
        document.getElementById(rd.obj.id.replace('drag_unit', 'spacer')).style.width = width + 'px';
      }
    };
    rd.event.dropped = function() {
      scrollOffset = [document.getElementById('scroller').scrollLeft,
                      document.getElementById('scroller').scrollTop];
      if (rd.td.target.parentElement.id === 'number_row') {  // if you drag onto a number
        _moveUnit(rd);
      } else {
        _selectedVariantUnits = [];
        // get children of target cell (TD) and push to selected list for combining
        for (let i = 0; i < rd.td.target.childNodes.length; i += 1) {
          _selectedVariantUnits.push(CL.getUnitAppReading(rd.td.target.childNodes[i].childNodes[0].id));
        }
        if (_selectedVariantUnits.length === 2) {  // if there are 2
          // if they are from the same line of apparatus
          if (_selectedVariantUnits[0][1] === _selectedVariantUnits[1][1]) {
            // if they are both full units (test if the third item is undefined in which case both are full units
						// would be reading pos if single reading)
            if (typeof _selectedVariantUnits[0][2] === 'undefined' &&
										typeof _selectedVariantUnits[1][2] === 'undefined') {
              _combineUnits(_selectedVariantUnits, rd);
            } else {
              //at least one is a reading
              _moveReading(_selectedVariantUnits, rd);
            }
          } else {
            //we are not currently allowing merging between different lines so display a message and do nothing else
            errorMess = 'ERROR: units from different lines cannot be combined';
            showSetVariantsData({
              'message': {
                'type': 'error',
                'message': errorMess
              }
            });
            document.getElementById('scroller').scrollLeft = scrollOffset[0];
            document.getElementById('scroller').scrollTop = scrollOffset[1];
          }
        } else {
          if (_selectedVariantUnits[0][1] !== 'apparatus') {
            sourceCol = parseInt(rd.td.source.id.substring(rd.td.source.id.indexOf('_') + 1));
            targetCol = parseInt(rd.td.target.id.substring(rd.td.target.id.indexOf('_') + 1));
            if (sourceCol === targetCol) {
              sourceRow = rd.td.source.id.substring(0, rd.td.source.id.indexOf('_'));
              targetRow = rd.td.target.id.substring(0, rd.td.target.id.indexOf('_'));
              isSpace = OR.canUnitMoveTo(CL.data[_selectedVariantUnits[0][1]][_selectedVariantUnits[0][0]]._id,
																				 sourceRow, targetRow);
              if (isSpace) {
                //move it to the target row or combine if there are two
                _moveOverlapping(_selectedVariantUnits[0], targetRow);
              } else {
                errorMess = 'ERROR: There is not enough space to relocate this unit to that position.';
                showSetVariantsData({
                  'message': {
                    'type': 'error',
                    'message': errorMess
                  }
                });
                document.getElementById('scroller').scrollLeft = scrollOffset[0];
                document.getElementById('scroller').scrollTop = scrollOffset[1];
              }
            } else {
              //illegal move
              //nothing to do
              errorMess = 'ERROR: This unit cannot be moved to that position';
              showSetVariantsData({
                'message': {
                  'type': 'error',
                  'message': errorMess
                }
              });
              document.getElementById('scroller').scrollLeft = scrollOffset[0];
              document.getElementById('scroller').scrollTop = scrollOffset[1];
            }
          } else {
            //illegal move
            //nothing to do
            showSetVariantsData();
            document.getElementById('scroller').scrollLeft = scrollOffset[0];
            document.getElementById('scroller').scrollTop = scrollOffset[1];
          }
        }
      }
    };
  };

  /**This will only ever be used for moving a single reading which will never happen in overlapping variants.
   * It is also only called if the resulting unit doesn't have the same start and end number which in the main
   * apparatus will only happen with an even start and an even end as units are not allowed to start or end on an odd
   * number if the next even number is part of the unit so we can assume that we will always start and end on a even
   * number the reading that is moved has no index numbers (they are stripped as part of the move) so we just need to
	 * ensure any moved words get their ids back we also need to make sure we are always incrementing left to right
   * (problems sometimes caused by readings being moved into the unit out of sequence) so we check that too
   **/
  _reindexMovedReading = function(location, witnesses) {
    var firstWordIndex, k, index, start, end, unit, reading, found;
    firstWordIndex = 1;
    // find the unit
    for (let i = 0; i < CL.data.apparatus.length; i += 1) {
      if (CL.data.apparatus[i].start === location) {
        unit = CL.data.apparatus[i];
        start = unit.start;
        end = unit.end;
        unit.first_word_index = location + '.' + firstWordIndex;  // set the first word index for the unit
        // for each witness in the list
        for (let j = 0; j < witnesses.length; j += 1) {
          found = false;
          k = 0;
          while (!found && k < unit.readings.length) {
            if (unit.readings[k].witnesses.indexOf(witnesses[j]) !== -1) {
              found = true;
              for (let l = 0; l < unit.readings[k].text.length; l += 1) {
                if (!unit.readings[k].text[l].hasOwnProperty('index') ||
                  typeof unit.readings[k].text[l].index === 'undefined' ||
                  (l > 0 && _indexLessThanOrEqualTo(unit.readings[k].text[l].index,
																										unit.readings[k].text[l - 1].index))) {
                  if (l === 0) {
                    unit.readings[k].text[l].index = location + '.' + firstWordIndex;
                  } else {
                    unit.readings[k].text[l].index = _incrementSubIndex(unit.readings[k].text[l - 1].index,
																																				firstWordIndex);
                  }
                }
              }
            }
            k += 1;
          }
        }
      }
    }
  };

  //TODO: this could do with a better name
  _indexLessThan = function(index1, index2) {
    var index1Main, index1Sub, index2Main, index2Sub;
    if (typeof index1 === 'undefined' || typeof index2 === 'undefined') {
      return false;
    }
    if (index1.indexOf('.') !== -1) {
      index1Main = parseInt(index1.split('.')[0]);
      index1Sub = parseInt(index1.split('.')[1]);
    } else {
      index1Main = parseInt(index1);
      index1Sub = 0;
    }
    if (index2.indexOf('.') !== -1) {
      index2Main = parseInt(index2.split('.')[0]);
      index2Sub = parseInt(index2.split('.')[1]);
    } else {
      index2Main = parseInt(index2);
      index2Sub = 0;
    }
    if (index1Main === index2Main) {
      if (index1Sub < index2Sub) {
        return true;
      }
    } else if (index1Main < index2Main) {
      return true;
    }
    return false;
  };

  _indexLessThanOrEqualTo = function(index1, index2) {
    var index1Main, index1Sub, index2Main, index2Sub;
    if (index1.indexOf('.') !== -1) {
      index1Main = parseInt(index1.split('.')[0]);
      index1Sub = parseInt(index1.split('.')[1]);
    } else {
      index1Main = parseInt(index1);
      index1Sub = 0;
    }
    if (index2.indexOf('.') !== -1) {
      index2Main = parseInt(index2.split('.')[0]);
      index2Sub = parseInt(index2.split('.')[1]);
    } else {
      index2Main = parseInt(index2);
      index2Sub = 0;
    }
    if (index1Main === index2Main) {
      if (index1Sub <= index2Sub) {
        return true;
      }
    } else if (index1Main <= index2Main) {
      return true;
    }
    return false;
  };

  _incrementSubIndex = function(current, increment) {
    var mainIndex, subIndex;
    mainIndex = parseInt(current.split('.')[0]);
    subIndex = parseInt(current.split('.')[1]);
    if (isNaN(subIndex)) {
      subIndex = 1;
    }
    subIndex = subIndex + increment;
    return mainIndex + '.' + subIndex;
  };

  _decrementSubIndex = function(current, decrement) {
    var mainIndex, subIndex;
    mainIndex = parseInt(current.split('.')[0]);
    subIndex = parseInt(current.split('.')[1]);
    subIndex = subIndex - decrement;
    return mainIndex + '.' + subIndex;
  };

  _incrementMainIndex = function(current, increment) {
    var mainIndex, subIndex;
    if (current.indexOf('.') !== -1) {
      mainIndex = parseInt(current.split('.')[0]);
      subIndex = parseInt(current.split('.')[1]);
      mainIndex = mainIndex + increment;
      return mainIndex + '.' + subIndex;
    }
    mainIndex = parseInt(current);
    return mainIndex + increment;
  };

  _decrementMainIndex = function(current, decrement) {
    var mainIndex, subIndex;
    if (current.indexOf('.') !== -1) {
      mainIndex = parseInt(current.split('.')[0]);
      subIndex = parseInt(current.split('.')[1]);
      mainIndex = mainIndex - decrement;
      return mainIndex + '.' + subIndex;
    }
    mainIndex = parseInt(current);
    return mainIndex - decrement;
  };

  /** reindex all the readings in the unit (called by reindex_unit)*/
  _reindexReadings = function(readings, location, firstWordIndex) {
    var nextAllocation, counter;
    nextAllocation = firstWordIndex;
    for (let i = 0; i < readings.length; i += 1) {
      counter = firstWordIndex;
      if (readings[i].text.length === 0) {
        //remove the index key from any om readings
        if (readings[i].hasOwnProperty('index')) {
          delete readings[i].index;
        }
      }
      for (let j = 0; j < readings[i].text.length; j += 1) {
        readings[i].text[j].index = location + '.' + counter;
        counter += 1;
      }
      if (counter > nextAllocation) {
        nextAllocation = counter;
      }
    }
    if (counter === nextAllocation) {
      nextAllocation += 1;
    }
    return nextAllocation;
  };

  _checkAndFixIndexOrder = function(location) {
    for (let i = 0; i < CL.data.apparatus.length; i += 1) {
      if (CL.data.apparatus[i].start === location) {
        for (let j = 0; j < CL.data.apparatus[i].readings.length; j += 1) {
          _checkAndFixReadingIndexes(CL.data.apparatus[i].readings[j]);
        }
      }
    }
  };

  _checkAndFixReadingIndexes = function(reading) {
    for (let i = 0; i < reading.text.length; i += 1) {
      if (i + 1 < reading.text.length) {
        if (!_indexLessThan(reading.text[i].index, reading.text[i + 1].index)) {
          reading.text[i + 1].index = _incrementSubIndex(reading.text[i].index, 1);
        }
      }
    }
  };

  /** split the display of a unit's readings so they can be manipulated separately */
  _splitReadings = function(details) {
    var scrollOffset;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    CL.data[details[1]][details[0]].split_readings = true;
    showSetVariantsData();
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  /** recombine the display of a unit's readings */
  _unsplitReadings = function(details) {
    var scrollOffset;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    prepareForOperation(); //we do this because we have to sort out split witnesses as well
    delete CL.data[details[1]][details[0]].split_readings;
    unsplitUnitWitnesses(details[0], details[1]);
    unprepareForOperation();
    checkBugStatus('recombine', 'readings in unit ' + details[0] + 'in  apparatus ' + details[1] + '.');
    showSetVariantsData();
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  /** remove references to the given witness from  a list of tokens
   * */
  _removeWitnessFromTokens = function(tokens, witness) {
    var index;
    for (let i = 0; i < tokens.length; i += 1) {
      index = tokens[i].reading.indexOf(witness);
      if (index !== -1) {
        tokens[i].reading.splice(index, 1);
      }
      if (tokens[i].hasOwnProperty(witness)) {
        delete tokens[i][witness];
      }
    }
  };

  /** remove references to the given witness from the given reading (deleting entries as necessary
	* (will not delete reading itself even if no witnesses remain)
	*/
  _removeWitnessFromReading = function(reading, witness) {
    if (reading.witnesses.indexOf(witness) !== -1) {
      reading.witnesses.splice(reading.witnesses.indexOf(witness), 1);
      _removeWitnessFromTokens(reading.text, witness);
    }
    //now check subreadings
    if (reading.hasOwnProperty('subreadings')) {
      for (let key in reading.subreadings) {
        if (reading.subreadings.hasOwnProperty(key)) {
          for (let i = 0; i < reading.subreadings[key].length; i += 1) {
            if (reading.subreadings[key][i].witnesses.indexOf(witness) !== -1) {
              reading.subreadings[key][i].witnesses.splice(reading.subreadings[key][i].witnesses.indexOf(witness), 1);
              if (reading.subreadings[key][i].witnesses.length === 0) {
                reading.subreadings[key][i] = null;
              }
              if (reading.subreadings[key][i] !== null) {
                _removeWitnessFromTokens(reading.subreadings[key][i].text, witness);
              }
            }
          }
          CL.removeNullItems(reading.subreadings[key]);
        }
        if (reading.subreadings[key].length === 0) {
          delete reading.subreadings[key];
        }
      }
      if ($.isEmptyObject(reading.subreadings)) {
        delete reading.subreadings;
      }
    }
    //now check all the other places we could be hiding references to a witness
    if (reading.hasOwnProperty('SR_text')) {
      for (let key in reading.SR_text) {
        if (reading.SR_text.hasOwnProperty(key)) {
          if (key === witness) {
            delete reading.SR_text[key];
          }
        }
      }
      if ($.isEmptyObject(reading.SR_text)) {
        delete reading.SR_text;
      }
    }
    if (reading.hasOwnProperty('standoff_subreadings') && reading.standoff_subreadings.indexOf(witness) !== -1) {
      reading.standoff_subreadings.splice(reading.standoff_subreadings.indexOf(witness), 1);
      if (reading.standoff_subreadings.length === 0) {
        delete reading.standoff_subreadings;
      }
    }
    if (reading.hasOwnProperty('combined_gap_after_subreadings') &&
          reading.combined_gap_after_subreadings.indexOf(witness) !== -1) {
      reading.combined_gap_after_subreadings.splice(reading.combined_gap_after_subreadings.indexOf(witness), 1);
      if (reading.combined_gap_after_subreadings.length === 0) {
        delete reading.combined_gap_after_subreadings;
      }
    }
    if (reading.hasOwnProperty('combined_gap_before_subreadings') &&
            reading.combined_gap_before_subreadings.indexOf(witness) !== -1) {
      reading.combined_gap_before_subreadings.splice(reading.combined_gap_before_subreadings.indexOf(witness), 1);
      if (reading.hasOwnProperty('combined_gap_before_subreadings_details')) {
        delete reading.combined_gap_before_subreadings_details[witness];
      }
      if (reading.combined_gap_before_subreadings.length === 0) {
        delete reading.combined_gap_before_subreadings;
        delete reading.combined_gap_before_subreadings_details;
      }
    }
  };

  _removeSeparatedWitnessData = function(appId, unitId) {
    if (CL.data.hasOwnProperty('separated_witnesses')) {
      for (let i = 0; i < CL.data.separated_witnesses.length; i += 1) {
        if (CL.data.separated_witnesses[i].app_id === appId && CL.data.separated_witnesses[i].unit_id === unitId) {
          CL.data.separated_witnesses[i] = null;
        }
      }
      CL.data.separated_witnesses = CL.removeNullItems(CL.data.separated_witnesses);
    }
  };

  /** Combine/Move stuff */
  _getOverlappedWitnessesForUnit = function(unitPos) {
    var witnesses, unit;
    witnesses = [];
    unit = CL.data.apparatus[unitPos];
    if (!unit.hasOwnProperty('overlap_units')) {
      return [];
    }
    for (let key in unit.overlap_units) {
      if (unit.overlap_units.hasOwnProperty(key)) {
        for (let i = 0; i < unit.overlap_units[key].length; i += 1) {
          if (witnesses.indexOf(unit.overlap_units[key][i]) === -1) {
            witnesses.push(unit.overlap_units[key][i]);
          }
        }
      }
    }
    return witnesses;
  };

  separateOverlapWitnesses = function(unitNum, gapLocation) {
    var overlappedWitnesses, toAdd, unit, toSplit, newReadingId, newReading;
    //get the overlapped witnesses for this point
    if (typeof gapLocation !== 'undefined') {
      overlappedWitnesses = _getOverlappedWitnessesForGap(gapLocation);
    } else {
      overlappedWitnesses = _getOverlappedWitnessesForUnit(unitNum);
    }
    if (overlappedWitnesses.length > 0) {
      unit = CL.data.apparatus[unitNum];
      for (let i = unit.readings.length - 1; i >= 0; i -= 1) {
        if (!unit.readings[i].hasOwnProperty('overlap_status') ||
          (unit.readings[i].hasOwnProperty('overlap_status') &&
            unit.readings[i].overlap_status === 'duplicate')) {
          toSplit = [];
          for (let j = 0; j < unit.readings[i].witnesses.length; j += 1) {
            if (overlappedWitnesses.indexOf(unit.readings[i].witnesses[j]) !== -1) {
              toSplit.push(unit.readings[i].witnesses[j]);
            }
          }
          if (toSplit.length > 0) {
            toAdd = _separateIndividualOverlapWitnesses(toSplit, unit.overlap_units);
            for (let j = 0; j < toAdd.length; j += 1) {
              newReadingId = doSplitReadingWitnesses(unitNum, i, toAdd[j][0], 'apparatus', false);
              newReading = CL.findReadingById(unit, newReadingId);
              if (toAdd[j][1].hasOwnProperty('type')) {
                newReading.type = toAdd[j][1].type;
              }
              // for some reason doSplitReadingWitnesses adds incorrect details so for now we are overwriting them
              // because that code is used in many other places and I don't want to break them!
              if (toAdd[j][1].hasOwnProperty('details')) {
                newReading.details = toAdd[j][1].details;
              } else {
                delete newReading.details;
              }
              newReading.overlap_status = 'duplicate';
            }
          }
        }
      }
    }
  };

  /** reposition an entire unit to a different index point (this only works from odd numbered index
  * point to odd numbered index point)*/
  _doMoveWholeUnit = function(targetLocation, originalLocation, unitNum) {
    var scrollOffset, problems, warningMess;
    //then move the whole unit
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    // check that the unit is not currently associated with an overlapped unit
    // AND that the location its moving to is either not part of an overlapped unit or is but with om or
    //lac readings for overlapped witnesses OR it has overlapping units and the new gap has the same ones
    if ((!CL.data.apparatus[unitNum].hasOwnProperty('overlap_units') &&
        !_targetHasOverlapConflict(targetLocation, unitNum)) ||
      (CL.data.apparatus[unitNum].hasOwnProperty('overlap_units') &&
        JSON.stringify(CL.data.apparatus[unitNum].overlap_units) === JSON.stringify(_getOverlapDetailsForGap(targetLocation)))) {
      prepareForOperation();
      _addToUndoStack(CL.data);
      CL.data.apparatus[unitNum].start = targetLocation;
      CL.data.apparatus[unitNum].end = targetLocation;
      CL.data.apparatus[unitNum].first_word_index = CL.data.apparatus[unitNum].first_word_index.first_word_index;
      if (_getOverlappedWitnessesForGap(targetLocation).length > 0) {
        CL.data.apparatus[unitNum].overlap_units = _getOverlapDetailsForGap(targetLocation);
        separateOverlapWitnesses(unitNum, targetLocation);
      }
      //sort the result
      CL.data.apparatus.sort(_compareFirstWordIndexes);
      //reindex the moved unit
      SV.reindexUnit(targetLocation);
      //sort it again (this needs to be two stages to preserve word order)
      CL.data.apparatus.sort(_compareFirstWordIndexes);
      unprepareForOperation();
      checkBugStatus('move', 'unit ' + unitNum + ' to index ' + targetLocation + ' in apparatus.');
      problems = _checkWordOrderIntegrity(originalLocation, targetLocation);
      if (problems.length > 0) {
        warningMess = 'WARNING: Moving the unit has created word order problems in following witnesses: ' +
                      problems.join(', ');
        showSetVariantsData({
          'message': {
            'type': 'warning',
            'message': warningMess
          }
        });
      } else {
        showSetVariantsData();
      }
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    } else {
      warningMess = 'ERROR: This unit cannot be moved here because of a conflict with the overlapping variant';
      showSetVariantsData({
        'message': {
          'type': 'error',
          'message': warningMess
        }
      });
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    }
  };

  /* find out if the index point recieving the new unit is part of an overlap*/
  _targetHasOverlapConflict = function(gapLocation, unitNum, reading) {
    var overlappedWitnesses, unit;
    overlappedWitnesses = _getOverlappedWitnessesForGap(gapLocation);
    if (overlappedWitnesses.length > 0) {
      if (typeof reading !== 'undefined') { //the test for moving a single reading
        for (let i = 0; i < reading.witnesses.length; i += 1) {
          if (overlappedWitnesses.indexOf(reading.witnesses[i]) !== -1) {
            // if any of the witnesses to the reading being moved are overlapped then return true
            return true;
          }
        }
      } else { // the test for moving a whole unit
        unit = CL.data.apparatus[unitNum];
        for (let i = 0; i < unit.readings.length; i += 1) {
          if (unit.readings[i].text.length > 0) {
            for (let j = 0; j < unit.readings[i].witnesses.length; j += 1) {
              if (overlappedWitnesses.indexOf(unit.readings[i].witnesses[j]) !== -1) {
                // if any of the witnesses with text (i.e. not lac or om) in the unit being moved are overlapped
								// then return true
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  };

  /* only used when moving a single reading to a new odd numered index point
  /* checks to see if the reading being moved has any overlapped witnesses at its current location */
  _sourceHasOverlapConflict = function(unitNum, reading) {
    var overlappedWitnesses, unit;
    unit = CL.data.apparatus[unitNum];
    if (!unit.hasOwnProperty('overlap_units')) {
      return false;
    }
    overlappedWitnesses = [];
    for (let key in unit.overlap_units) {
      if (unit.overlap_units.hasOwnProperty(key)) {
        overlappedWitnesses.push.apply(overlappedWitnesses, unit.overlap_units[key]);
      }
    }
    for (let i = 0; i < reading.witnesses.length; i += 1) {
      if (overlappedWitnesses.indexOf(reading.witnesses[i]) !== -1) {
        return true;
      }
    }
    return false;
  };

  _allOverlapsMatch = function(gapLocation, unitNum) {
    var unit, gapOverlappedWitnesses, unitOverlappedWitnesses;
    unit = CL.data.apparatus[unitNum];
    if (!unit.hasOwnProperty('overlap_units')) {
      return false;
    }
    gapOverlappedWitnesses = _getOverlapDetailsForGap(gapLocation);
    unitOverlappedWitnesses = unit.overlap_units;
    for (let key in unitOverlappedWitnesses) {
      if (unitOverlappedWitnesses.hasOwnProperty(key) && gapOverlappedWitnesses.hasOwnProperty(key)) {
        if (unitOverlappedWitnesses[key].length === gapOverlappedWitnesses[key].length) {
          for (let i = 0; i < unitOverlappedWitnesses[key].length; i += 1) {
            if (gapOverlappedWitnesses[key].indexOf(unitOverlappedWitnesses[key][i]) === -1) {
              return false;
            }
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  };

  _neighboursShareOverlaps = function(indexPoint, data) {
    var before, after;
    if (data === undefined) {
      data = CL.data;
    }
    for (let i = 0; i < data.apparatus.length; i += 1) {
      if (data.apparatus[i].end === indexPoint - 1) {
        before = data.apparatus[i];
      }
      if (data.apparatus[i].start === indexPoint + 1) {
        after = data.apparatus[i];
      }
    }
    if (!after || !before) {
      return false;
    }
    if (!before.hasOwnProperty('overlap_units') && !after.hasOwnProperty('overlap_units')) {
      return false;
    }
    if (before.hasOwnProperty('overlap_units') && after.hasOwnProperty('overlap_units')) {
      if (JSON.stringify(before.overlap_units) === JSON.stringify(after.overlap_units)) {
        return true;
      }
    }
    return false;
  };

  /** reposition a single reading to a different index point (this only works to odd numbered index point)*/
  _doMoveSingleReading = function(targetLocation, originalLocation, unitNum, rd) {
    var scrollOffset, witnesses, newunit, readings, unit2, reading, added, problems, warningMess,
      	rdgDetails, replacementReadings, newUnitId, newUnitPos, readingPos;

    //move the single reading
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    //get some details we need to check for overlap
    unit2 = CL.data.apparatus[unitNum];
    rdgDetails = CL.getUnitAppReading(rd.obj.id);
    //get the reading you've moved and copy it otherwise prepareForOperation will lose data
    reading = JSON.parse(JSON.stringify(unit2.readings[rdgDetails[2]]));
    if (!reading.hasOwnProperty('overlap_status') || reading.overlap_status === 'duplicate') {
      if ((!_targetHasOverlapConflict(targetLocation, unitNum, reading) &&
						!_sourceHasOverlapConflict(unitNum, reading)) ||
        			(_allOverlapsMatch(targetLocation, unitNum) && reading.text.length > 0)) {
				//last condition allows movement to gaps within the same overlap unit set

        prepareForOperation();
        _addToUndoStack(CL.data);
        //now get the position of the reading after running prepareForOperation
        readingPos = CL.findReadingPosById(unit2, reading._id);

        //get all the witnesses
        witnesses = [];
        for (let i = 0; i < CL.data.apparatus[unitNum].readings.length; i += 1) {
          witnesses.push.apply(witnesses, CL.data.apparatus[unitNum].readings[i].witnesses);
        }
        //make a new unit
        //need to observe lac_verse and om_verse and om all other witnesses
        newunit = {};
        newunit.start = targetLocation;
        newunit.end = targetLocation;
        //get the unit you moved the word from
        readings = [];
        readings.push(reading);
        //if unit2 has overlap_units key then copy this to new unit if it is still within the overlap
        if (unit2.hasOwnProperty('overlap_units') && _neighboursShareOverlaps(targetLocation)) {
          newunit.overlap_units = unit2.overlap_units;
        }
        for (let i = 0; i < reading.witnesses.length; i += 1) {
          witnesses.splice(witnesses.indexOf(reading.witnesses[i]), 1);
        }
        if (CL.data.lac_readings.length > 0) {
          readings.push({
            'text': [],
            'type': 'lac_verse',
            'details': CL.project.lacUnitLabel,
            'witnesses': JSON.parse(JSON.stringify(CL.data.lac_readings))
          });
          for (let i = 0; i < CL.data.lac_readings.length; i += 1) {
            witnesses.splice(witnesses.indexOf(CL.data.lac_readings[i]), 1);
          }
        }
        if (CL.data.om_readings.length > 0) {
          readings.push({
            'text': [],
            'type': 'om_verse',
            'details': CL.project.omUnitLabel,
            'witnesses': JSON.parse(JSON.stringify(CL.data.om_readings))
          });
          for (let i = 0; i < CL.data.om_readings.length; i += 1) {
            witnesses.splice(witnesses.indexOf(CL.data.om_readings[i]), 1);
          }
        }
        if (witnesses.length > 0) {
          readings.push({
            'text': [],
            'witnesses': witnesses
          });
        }

        newunit.readings = readings;
        // remove original making sure you get the current position of the reading that has
        // moved (after prepareForOperation)
        unit2.readings.splice(readingPos, 1);
        // replace it with an om reading or two depending on overlap status
        replacementReadings = _getReplacementOmReading(unit2, reading);
        for (let i = 0; i < replacementReadings.length; i += 1) {
          CL.addReadingId(replacementReadings[i], unit2.start, unit2.end);
          unit2.readings.push(replacementReadings[i]);
        }
        unsplitUnitWitnesses(unitNum, 'apparatus'); //merge with any other oms if needed

        newUnitId = CL.addUnitId(newunit, 'apparatus');
        CL.addReadingIds(newunit);
        // add the new unit to the apparatus (we can't actually calculate where in the list this gap is so just
				// stick it on the end then sort
        CL.data.apparatus.push(newunit);
        //sort the apparatus
        CL.data.apparatus.sort(_compareFirstWordIndexes);
        // reindex the moved unit - this works because target location actually becomes start index in the function
        SV.reindexUnit(targetLocation);
        newUnitPos = CL.findUnitPosById('apparatus', newUnitId);
        CL.data.apparatus = CL.removeNullItems(CL.data.apparatus);
        if (_getOverlappedWitnessesForGap(targetLocation).length > 0) {
          CL.data.apparatus[newUnitPos].overlap_units = _getOverlapDetailsForGap(targetLocation);
          separateOverlapWitnesses(newUnitPos, targetLocation);
        }
        // see if the unit that things were moved out of needs deleting or not
        if (!CL.unitHasText(unit2)) {
          if (!unit2.hasOwnProperty('overlap_units')) {
            CL.data.apparatus[unitNum] = null;
          }
        }
        CL.data.apparatus = CL.removeNullItems(CL.data.apparatus);
        // sort the apparatus again - it is important to do this twice (before and after reindexing)
				// but the reason eludes me just now
        CL.data.apparatus.sort(_compareFirstWordIndexes);
        unprepareForOperation();
        checkBugStatus('move', 'reading ' + readingPos + ' with witnesses ' + witnesses.join(', ') + ' from unit ' +
											 unitNum + ' to index ' + targetLocation + ' in apparatus.');
        problems = _checkWordOrderIntegrity(originalLocation, targetLocation, reading.witnesses);
        if (problems.length > 0) {
          warningMess = 'WARNING: Moving the reading has created word order problems in following witnesses: ' +
												problems.join(', ');
          showSetVariantsData({
            'message': {
              'type': 'warning',
              'message': warningMess
            }
          });
        } else {
          showSetVariantsData();
        }
        document.getElementById('scroller').scrollLeft = scrollOffset[0];
        document.getElementById('scroller').scrollTop = scrollOffset[1];
      } else {
        warningMess = 'ERROR: This reading cannot be moved here because of a conflict with the overlapping variant';
        showSetVariantsData({
          'message': {
            'type': 'error',
            'message': warningMess
          }
        });
        document.getElementById('scroller').scrollLeft = scrollOffset[0];
        document.getElementById('scroller').scrollTop = scrollOffset[1];
      }
    } else {
      warningMess = 'ERROR: Deleted and overlapped readings cannot be relocated (they can be overwritten by another word)';
      showSetVariantsData({
        'message': {
          'type': 'error',
          'message': warningMess
        }
      });
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    }
  };

  _unitAtLocation = function(targetLocation) {
    for (let i = 0; i < CL.data.apparatus.length; i += 1) {
      if (CL.data.apparatus[i].start === targetLocation) {
        return true;
      }
    }
    return false;
  };

  _getOverlapDetailsForGap = function(gapIndex) {
    var unitBefore, unitAfter, overlapUnits;
    overlapUnits = {};
    for (let i = 0; i < CL.data.apparatus.length; i += 1) {
      if (CL.data.apparatus[i].end === gapIndex - 1) {
        unitBefore = CL.data.apparatus[i];
      }
      if (CL.data.apparatus[i].start === gapIndex + 1) {
        unitAfter = CL.data.apparatus[i];
      }
      if (typeof unitBefore !== 'undefined' && typeof unitAfter !== 'undefined') {
        if (unitBefore.hasOwnProperty('overlap_units') && unitAfter.hasOwnProperty('overlap_units')) {
          for (let key in unitBefore.overlap_units) {
            if (unitBefore.overlap_units.hasOwnProperty(key) && unitAfter.overlap_units.hasOwnProperty(key)) {
              overlapUnits[key] = unitBefore.overlap_units[key];
            }
          }
        }
      }
    }
    return overlapUnits;
  };

  /** return all overlapped witnesses for overlaps that contain this index point (odd numbered indexes only) */
  _getOverlappedWitnessesForGap = function(gapIndex) {
    var unitBefore, unitAfter, overlappedWitnesses, apparatus;
    overlappedWitnesses = [];
    apparatus = CL.data.apparatus;
    for (let i = 0; i < apparatus.length; i += 1) {
      if (apparatus[i].end === gapIndex - 1) {
        unitBefore = apparatus[i];
      }
      if (apparatus[i].start === gapIndex + 1) {
        unitAfter = apparatus[i];
      }
      if (typeof unitBefore !== 'undefined' && typeof unitAfter !== 'undefined') {
        if (unitBefore.hasOwnProperty('overlap_units') && unitAfter.hasOwnProperty('overlap_units')) {
          for (let key in unitBefore.overlap_units) {
            if (unitBefore.overlap_units.hasOwnProperty(key) && unitAfter.overlap_units.hasOwnProperty(key)) {
              for (let j = 0; j < unitBefore.overlap_units[key].length; j += 1) {
                if (overlappedWitnesses.indexOf(unitBefore.overlap_units[key][j]) === -1) {
                  overlappedWitnesses.push(unitBefore.overlap_units[key][j]);
                }
              }
            }
          }
        }
      }
    }
    return overlappedWitnesses;
  };

  /** move the unit to a new location (when dropped on the number) */
  _moveUnit = function(rd) {
    var unitDetails, unitNum, unit, targetLocation, originalLocation, errorMess, scrollOffset;

    //then move the element
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    unitDetails = CL.getUnitAppReading(rd.obj.firstChild.id);
    unitNum = unitDetails[0];
    unit = CL.data[unitDetails[1]][unitNum];
    targetLocation = parseInt(rd.td.target.id.replace('num_', ''), 10);
    originalLocation = CL.data.apparatus[unitNum].start;
    if (targetLocation % 2 === 1) {
      if ((unit.start === unit.end && unit.start % 2 === 1) || typeof unitDetails[2] !== 'undefined') {
        if (unitDetails[1] === 'apparatus') {  // check this is a main reading not an overlapping one
          if (!_unitAtLocation(targetLocation)) {
            if (!CL.data.apparatus[unitNum].hasOwnProperty('split_readings')) {
              _doMoveWholeUnit(targetLocation, originalLocation, unitNum);
            } else {
              _doMoveSingleReading(targetLocation, originalLocation, unitNum, rd);
            }
          } else {
            errorMess = 'ERROR: units and readings cannot be moved into a gap which already contains a unit';
            showSetVariantsData({
              'message': {
                'type': 'error',
                'message': errorMess
              }
            });
            document.getElementById('scroller').scrollLeft = scrollOffset[0];
            document.getElementById('scroller').scrollTop = scrollOffset[1];
          }
        } else {
          errorMess = 'ERROR: overlapping units cannot be moved';
          showSetVariantsData({
            'message': {
              'type': 'error',
              'message': errorMess
            }
          });
          document.getElementById('scroller').scrollLeft = scrollOffset[0];
          document.getElementById('scroller').scrollTop = scrollOffset[1];
        }
      } else {
        errorMess = 'ERROR: units with an \'a\' reading cannot be moved';
        showSetVariantsData({
          'message': {
            'type': 'error',
            'message': errorMess
          }
        });
        document.getElementById('scroller').scrollLeft = scrollOffset[0];
        document.getElementById('scroller').scrollTop = scrollOffset[1];
      }
    } else {  // no need to do anything
      showSetVariantsData();
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    }
  };

  /** check the set of witnesses in unit 1 and unit 2 are the same*/
  _checkWitnessEquality = function(unit1, unit2, appId) {
    var witnesses1, witnesses2;
    witnesses1 = CL.getActiveUnitWitnesses(unit1, appId);
    witnesses2 = CL.getActiveUnitWitnesses(unit2, appId);
    if (witnesses1.length !== witnesses2.length) {
      return false;
    }
    for (let i = 0; i < witnesses1.length; i += 1) {
      if (witnesses2.indexOf(witnesses1[i]) === -1) {
        return false;
      }
    }
    return true;
  };

  _getLowestIndex = function(a, b) {
    var aMain, bMain, aSub, bSub;
    if (a.indexOf('.') !== -1) {
      aMain = parseInt(a.split('.')[0]);
      aSub = parseInt(a.split('.')[1]);
    } else {
      aMain = parseInt(a);
      aSub = 0;
    }
    if (b.indexOf('.') !== -1) {
      bMain = parseInt(b.split('.')[0]);
      bSub = parseInt(b.split('.')[1]);
    } else {
      bMain = parseInt(b);
      bSub = 0;
    }
    if (aMain < bMain) {
      return a;
    }
    if (aMain > bMain) {
      return b;
    }
    if (aSub < bSub) {
      return a;
    }
    if (aSub > bSub) {
      return b;
    }
    return a;
  };

  _doCombineUnits = function(units, appId, keepId) {
    var newunit, index, unit1, unit2, warningMess, errorMess, problems, warningUnit, scrollOffset,
        combinedGapBeforeSubreadings, combinedGapAfterSubreadings, combinedGapBeforeSubreadingsDetails,
        witnessEquality, overlapBoundaries, overlapStatusAgreement;

    scrollOffset = [document.getElementById('scroller').scrollLeft,
      							document.getElementById('scroller').scrollTop];
    // make sure unit 1 is leftmost and unit 2 is rightmost
    unit1 = CL.data[appId][Math.min(units[0][0], units[1][0])];
    unit2 = CL.data[appId][Math.max(units[0][0], units[1][0])];
    witnessEquality = _checkWitnessEquality(unit1, unit2, appId);
    overlapBoundaries = _checkOverlapBoundaries(unit1, unit2, appId);
    overlapStatusAgreement = _checkOverlapStatusAgreement(unit1, unit2, appId);
    if (witnessEquality && overlapBoundaries && overlapStatusAgreement) {
      if (keepId === true) {
        //combine the reference ids in the top apparatus
        _combineApparatusIds(unit1._id, unit2._id);
      }
      combinedGapBeforeSubreadings = [];
      combinedGapAfterSubreadings = [];
      combinedGapBeforeSubreadingsDetails = {};
      //make a list of all the combinedGapBeforeSubreadings witnesses in the leftmost unit
      for (let i = 0; i < unit1.readings.length; i += 1) {
        if (unit1.readings[i].hasOwnProperty('combined_gap_before_subreadings')) {
          combinedGapBeforeSubreadings.push.apply(combinedGapBeforeSubreadings,
																									unit1.readings[i].combined_gap_before_subreadings);
        }
        if (unit1.readings[i].hasOwnProperty('combined_gap_before_subreadings_details')) {
          for (let key in unit1.readings[i].combined_gap_before_subreadings_details) {
            if (unit1.readings[i].combined_gap_before_subreadings_details.hasOwnProperty(key)) {
              combinedGapBeforeSubreadingsDetails[key] = unit1.readings[i].combined_gap_before_subreadings_details[key];
            }
          }
        }
      }
      //make a list of all the combinedGapAfterSubreadings witnesses in the rightmost unit
      for (let i = 0; i < unit2.readings.length; i += 1) {
        if (unit2.readings[i].hasOwnProperty('combined_gap_after_subreadings')) {
          combinedGapAfterSubreadings.push.apply(combinedGapAfterSubreadings,
																								 unit2.readings[i].combined_gap_after_subreadings);
        }
      }
      _addToUndoStack(CL.data);
      //make a new unit
      newunit = {};
      newunit.start = Math.min(unit1.start, unit2.start);
      newunit.end = Math.max(unit1.end, unit2.end);
      newunit.first_word_index = _getLowestIndex(unit1.first_word_index, unit2.first_word_index);
      if (unit1.hasOwnProperty('row')) {
        newunit.row = unit1.row;
      }

      if (unit1.hasOwnProperty('overlap_units')) { //at this point they are the same so we can just take one
        newunit.overlap_units = unit1.overlap_units;
      }
      if (appId === 'apparatus') {
        //if the new unit starts or ends in with an addition remove the NA space from the unit
        //not for overlapping readings
        if (newunit.start !== newunit.end) {
          if (newunit.start % 2 === 1) {
            newunit.start = newunit.start + 1;
          }
          if (newunit.end % 2 === 1) {
            newunit.end = newunit.end - 1;
          }
          if (newunit.first_word_index.split('.')[0] < newunit.start) {
            newunit.first_word_index = newunit.start + '.' + 1;
          }
        }
      }
      newunit = _combineReadings(unit1.readings, unit2.readings, newunit, false);
      if (keepId === true) {
        newunit._id = unit1._id;
      } else {
        CL.addUnitId(newunit);
      }
      CL.addReadingIds(newunit);
      //put back any combinedGapBeforeSubreadings
      for (let i = 0; i < combinedGapBeforeSubreadings.length; i += 1) {
        for (let j = 0; j < newunit.readings.length; j += 1) {
          if (newunit.readings[j].witnesses.indexOf(combinedGapBeforeSubreadings[i]) !== -1) {
            if (newunit.readings[j].hasOwnProperty('combined_gap_before_subreadings')) {
              newunit.readings[j].combined_gap_before_subreadings.push(combinedGapBeforeSubreadings[i]);
            } else {
              newunit.readings[j].combined_gap_before_subreadings = [combinedGapBeforeSubreadings[i]];
            }
            if (combinedGapBeforeSubreadingsDetails.hasOwnProperty(combinedGapBeforeSubreadings[i])) {
              if (newunit.readings[j].hasOwnProperty('combined_gap_before_subreadings_details')) {
                newunit.readings[j].combined_gap_before_subreadings_details[combinedGapBeforeSubreadings[i]] = combinedGapBeforeSubreadingsDetails[combinedGapBeforeSubreadings[i]];
              } else {
                newunit.readings[j].combined_gap_before_subreadings_details = {};
                newunit.readings[j].combined_gap_before_subreadings_details[combinedGapBeforeSubreadings[i]] = combinedGapBeforeSubreadingsDetails[combinedGapBeforeSubreadings[i]];
              }
            }
          }
        }
      }
      //put back any combinedGapAfterSubreadings
      for (let i = 0; i < combinedGapAfterSubreadings.length; i += 1) {
        for (let j = 0; j < newunit.readings.length; j += 1) {
          if (newunit.readings[j].witnesses.indexOf(combinedGapAfterSubreadings[i]) !== -1) {
            if (newunit.readings[j].hasOwnProperty('combined_gap_after_subreadings')) {
              newunit.readings[j].combined_gap_after_subreadings.push(combinedGapAfterSubreadings[i]);
            } else {
              newunit.readings[j].combined_gap_after_subreadings = [combinedGapAfterSubreadings[i]];
            }
          }
        }
      }
      //check the combined gap flags on main reading are okay
      for (let i = 0; i < newunit.readings.length; i += 1) {
        checkCombinedGapFlags(newunit.readings[i]);
      }
      //remove old units;
      index = Math.min(units[0][0], units[1][0]);
      CL.data[appId].splice(Math.max(units[0][0], units[1][0]), 1);
      CL.data[appId].splice(Math.min(units[0][0], units[1][0]), 1);
      //here add this to data and then reload page
      CL.data[appId].splice(index, 0, newunit);
      separateOverlapWitnesses(index);
      if (newunit.start === newunit.end) {
        SV.reindexUnit(newunit.start);
      } else {
        _checkAndFixIndexOrder(newunit.start);
      }
      //in here split out 'a' reading if we are dealing with overlapping units
      //and always separate is as a different reading even when other readings agree
      if (appId !== 'apparatus') {
        //find the reading with the base text witness
        for (let i = 0; i < CL.data[appId][index].readings.length; i += 1) {
          if (CL.data[appId][index].readings[i].witnesses.indexOf(CL.dataSettings.base_text_siglum) !== -1) {
            //split it out
            doSplitReadingWitnesses(index, i, [CL.dataSettings.base_text_siglum], appId, false);
            CL.sortReadings(CL.data[appId][index].readings);
            break;
          }
        }
      }
      unsplitUnitWitnesses(index, 'apparatus'); //just in case
      unprepareForOperation();
      if (appId !== 'apparatus') {
        //then check that all witness words in the unit are only 2 apart
        problems = _checkUnitIntegrity(appId, index);
        if (problems.length > 0) {
          warningMess = 'WARNING: The following witnesses have words missing in the highlighted unit: ' + problems.join(', ');
          warningUnit = [appId, index];
        }
      }
      checkBugStatus('combine', appId + ' unit ' + Math.min(units[0][0], units[1][0]) + ' with unit ' + Math.max(units[0][0], units[1][0]) + '.');
      if (warningMess !== undefined) {
        showSetVariantsData({
          'message': {
            'type': 'warning',
            'message': warningMess
          },
          'highlighted_unit': warningUnit
        });
      } else {
        showSetVariantsData({});
      }
    } else {
      //redraw without making any changes and error messages
      if (witnessEquality === false) {
        errorMess = 'ERROR: units with different witness sets cannot be combined';
      } else if (overlapBoundaries === false) {
        errorMess = 'ERROR: units cannot be combined across overlapping unit boundaries';
      } else if (overlapStatusAgreement === false) {
        errorMess = 'ERROR: These units cannot be combined as some of the witnesses have different statuses (deleted, overlapped etc.)';
      }
      unprepareForOperation();
      showSetVariantsData({
        'message': {
          'type': 'error',
          'message': errorMess
        }
      });
    }
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  // allGaps is true when one of the units contains only gaps
  _checkOverlapBoundaries = function(unit1, unit2, appId, allGaps) {
    var unit1Ids, unit2Ids;
    if (appId !== 'apparatus') {
      return true;
    }
    if ((!unit1.hasOwnProperty('overlap_units') || $.isEmptyObject(unit1.overlap_units)) &&
          (!unit2.hasOwnProperty('overlap_units') || $.isEmptyObject(unit2.overlap_units))) {
      return true;
    }
    if (allGaps === true) {
      if (!CL.unitHasText(unit1) && (!unit1.hasOwnProperty('overlap_units') ||
                                      $.isEmptyObject(unit1.overlap_units))) {
        return true;
      }
      if (!CL.unitHasText(unit2) && (!unit2.hasOwnProperty('overlap_units') ||
                                      $.isEmptyObject(unit2.overlap_units))) {
        return true;
      }
    }
    if (unit1.hasOwnProperty('overlap_units') && unit2.hasOwnProperty('overlap_units')) {
      unit1Ids = _getObjectKeys(unit1.overlap_units);
      unit2Ids = _getObjectKeys(unit2.overlap_units);
      if (unit1Ids.length === unit2Ids.length) {
        if (JSON.stringify(unit1Ids) === JSON.stringify(unit2Ids)) {
          return true;
        }
      }
    }
    return false;
  };

  _checkSpecialOverlapStatusAgreement = function(textUnit, emptyUnit) {
    var witnesses;
    witnesses = [];
    for (let key in textUnit.overlap_units) {
      if (textUnit.overlap_units.hasOwnProperty(key)) {
        witnesses.push.apply(witnesses, textUnit.overlap_units[key]);
      }
    }
    for (let i = 0; i < emptyUnit.readings.length; i += 1) {
      if (emptyUnit.readings[i].hasOwnProperty('type') && emptyUnit.readings[i].type === 'om') {
        for (let j = 0; j < emptyUnit.readings[i].witnesses.length; j += 1) {
          if (witnesses.indexOf(emptyUnit.readings[i].witnesses[j]) !== -1) {
            witnesses.splice(witnesses.indexOf(emptyUnit.readings[i].witnesses[j]), 1);
          }
        }
      }
    }
    if (witnesses.length === 0) {
      return true;
    }
    return false;
  };

  //allGaps is true when one of the units contains only gaps
  _checkOverlapStatusAgreement = function(unit1, unit2, appId, allGaps) {
    var specialWits1, specialWits2, keys1, keys2, agreement;
    if (appId !== 'apparatus') {
      return true;
    }
    if (allGaps === true) {
      if (!CL.unitHasText(unit1) && !unit1.hasOwnProperty('overlap_units') && unit2.hasOwnProperty('overlap_units')) {
        return _checkSpecialOverlapStatusAgreement(unit2, unit1);
      }
      if (!CL.unitHasText(unit2) && !unit2.hasOwnProperty('overlap_units') && unit1.hasOwnProperty('overlap_units')) {
        return _checkSpecialOverlapStatusAgreement(unit1, unit2);
      }
    }
    specialWits1 = {};
    for (let i = 0; i < unit1.readings.length; i += 1) {
      if (unit1.readings[i].hasOwnProperty('overlap_status')) {
        if (!specialWits1.hasOwnProperty(unit1.readings[i].overlap_status)) {
          specialWits1[unit1.readings[i].overlap_status] = [];
        }
        specialWits1[unit1.readings[i].overlap_status].push.apply(specialWits1[unit1.readings[i].overlap_status],
																																	unit1.readings[i].witnesses);
      }
    }
    specialWits2 = {};
    for (let i = 0; i < unit2.readings.length; i += 1) {
      if (unit2.readings[i].hasOwnProperty('overlap_status')) {
        if (!specialWits2.hasOwnProperty(unit2.readings[i].overlap_status)) {
          specialWits2[unit2.readings[i].overlap_status] = [];
        }
        specialWits2[unit2.readings[i].overlap_status].push.apply(specialWits2[unit2.readings[i].overlap_status],
																																	unit2.readings[i].witnesses);
      }
    }
    keys1 = _getObjectKeys(specialWits1);
    keys2 = _getObjectKeys(specialWits2);
    if (keys1.length === keys2.length) {
      if (JSON.stringify(keys1) === JSON.stringify(keys2)) {
        agreement = true;
        for (let i = 0; i < keys1.length; i += 1) {
          if (JSON.stringify(specialWits1[keys1[i]].sort) !== JSON.stringify(specialWits2[keys2[i]].sort)) {
            agreement = false;
          }
        }
        return agreement;
      }
    }
    return false;
  };

  _getObjectKeys = function(obj) {
    var keys;
    keys = [];
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    return keys.sort();
  };

  _getGapDetails = function(previousUnit, hitWitnesses) {
    var gapDetails;
    if (typeof previousUnit !== 'undefined') {
      for (let i = 0; i < previousUnit.readings.length; i += 1) {
        //at this point all the witnesses definitely read the same so just check one witness
        if (previousUnit.readings[i].witnesses.indexOf(hitWitnesses[0]) !== -1) {
          gapDetails = previousUnit.readings[i].text[previousUnit.readings[i].text.length - 1][hitWitnesses[0]].gap_details;
          return gapDetails;
        }
      }
    }
    return null;
  };

  /** returns true is list1 is subset of list 2
   * false if not */
  _isSubsetOf = function(list1, list2) {
    for (let i = 0; i < list1.length; i += 1) {
      if (list2.indexOf(list1[i]) === -1) {
        return false;
      }
    }
    return true;
  };

  _specialCombineReadings = function(emptyUnit, textUnit, textUnitPos, gapPosition, appId, adjacentUnit) {
    var targetWitnesses, adjacentWitnesses, hitWitnesses, readingsToAdd, newReadingId, reading, gapDetails;

    targetWitnesses = [];
    adjacentWitnesses = [];
    readingsToAdd = [];
    //find the witnesses might be interested in (any type lacs which are not lac verse) from special gap unit
    for (let i = 0; i < emptyUnit.readings.length; i += 1) {
      if (emptyUnit.readings[i].type === 'lac') {
        targetWitnesses.push.apply(targetWitnesses, emptyUnit.readings[i].witnesses);
      }
    }
    if (typeof adjacentUnit !== 'undefined') {
      //Now get all the witness which are lac in the adjacent unit (this will either be the unit before or after the gap depending on direction of merge)
      //because they will not need gaps combining
      for (let i = 0; i < adjacentUnit.readings.length; i += 1) {
        if (adjacentUnit.readings[i].type === 'lac') {
          adjacentWitnesses.push.apply(adjacentWitnesses, adjacentUnit.readings[i].witnesses);
        }
      }
    }
    //now loop through the witnesses we might be interested in and remove any that have gaps in the adjacent unit
    //go backwards so you can splice
    for (let i = targetWitnesses.length - 1; i >= 0; i -= 1) {
      if (adjacentWitnesses.indexOf(targetWitnesses[i]) !== -1) {
        targetWitnesses.splice(i, 1);
      }
    }
    //add special attribute to the readings of any remaining witnesses making new readings if necessary
    for (let i = 0; i < textUnit.readings.length; i += 1) {
      hitWitnesses = [];
      for (let j = 0; j < textUnit.readings[i].witnesses.length; j += 1) {
        if (targetWitnesses.indexOf(textUnit.readings[i].witnesses[j]) != -1) {
          hitWitnesses.push(textUnit.readings[i].witnesses[j]);
        }
      }
      for (let j = 0; j < hitWitnesses.length; j += 1) {
        //we need to remember these and add it later (when we are not looping through the readings)
        readingsToAdd.push([textUnitPos, i, [hitWitnesses[j]], appId]);
      }
    }
		// go backwards so you don't screw up positions by adding readings
    for (let i = readingsToAdd.length - 1; i >= 0; i -= 1) {
      newReadingId = doSplitReadingWitnesses(readingsToAdd[i][0], readingsToAdd[i][1],
																						 readingsToAdd[i][2], readingsToAdd[i][3], false);
      reading = CL.findReadingById(CL.data[appId][textUnitPos], newReadingId);
      if (reading.text.length > 0) {
        if (gapPosition === 'before') {
          reading.text[0].combined_gap_before = readingsToAdd[i][2];
          if (reading.text[0][readingsToAdd[i][2][0]].hasOwnProperty('gap_before_details')) {
            reading.text[0].combined_gap_before_details = reading.text[0][readingsToAdd[i][2][0]].gap_before_details;
          }
          if (typeof adjacentUnit !== 'undefined') {
            gapDetails = _getGapDetails(adjacentUnit, readingsToAdd[i][2]);
            if (gapDetails !== null) {
              reading.text[0].combined_gap_before_details = gapDetails;
            }
          }
        } else {
          reading.text[reading.text.length - 1].combined_gap_after = readingsToAdd[i][2];
        }
      }
    }
    CL.addUnitId(textUnit);
    CL.addReadingIds(textUnit);
    unsplitUnitWitnesses(textUnitPos, 'apparatus');
  };

  _doSpecialCombineUnits = function(units, appId) {
    var scrollOffset, unit1, unit2, unit1Pos, unit2Pos, witnessEquality, errorMess, warningUnit;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    _addToUndoStack(CL.data);
    //make sure unit 1 is leftmost and unit 2 is rightmost
    unit1Pos = Math.min(units[0][0], units[1][0]);
    unit2Pos = Math.max(units[0][0], units[1][0]);
    unit1 = CL.data[appId][unit1Pos];
    unit2 = CL.data[appId][unit2Pos];
    witnessEquality = _checkWitnessEquality(unit1, unit2, appId);
    if (witnessEquality) {
      if (!CL.unitHasText(unit1)) {
        //we need the unit before to get data from it
        if (unit1Pos !== 0) {
          _specialCombineReadings(unit1, unit2, unit2Pos, 'before', appId, CL.data[appId][unit1Pos - 1]);
        } else {
          _specialCombineReadings(unit1, unit2, unit2Pos, 'before', appId);
        }
      }
      if (!CL.unitHasText(unit2)) {
        //we need the unit after to get data from it
        if (unit2Pos + 1 < CL.data[appId].length) {
          _specialCombineReadings(unit2, unit1, unit1Pos, 'after', appId, CL.data[appId][unit2Pos + 1]);
        } else {
          _specialCombineReadings(unit2, unit1, unit1Pos, 'after', appId);
        }
      }

      unprepareForOperation();

      if (appId !== 'apparatus') {
        //then check that all witness words in the unit are only 2 apart
        problems = _checkUnitIntegrity(appId, index);
        if (problems.length > 0) {
          warningMess = 'WARNING: The following witnesses have words missing in the highlighted unit: ' +
												problems.join(', ');
          warningUnit = [appId, index];
        }
      }
      checkBugStatus('special combine', appId + ' unit ' + Math.min(units[0][0], units[1][0]) + ' with unit ' +
										 Math.max(units[0][0], units[1][0]) + '.');
      showSetVariantsData({});
    } else {
      //redraw without making any changes and error messages
      if (witnessEquality === false) {
        errorMess = 'ERROR: units with different witness sets cannot be combined';
      }
      unprepareForOperation();
      showSetVariantsData({
        'message': {
          'type': 'error',
          'message': errorMess
        }
      });
    }
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  /** combine two units */
  //TODO: come up with a way of testing adjacency with overlapping rows
  _combineUnits = function(units, rd) {
    var unit1, unit2, scrollOffset, added, appId, errorMess;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    prepareForOperation();
    //at this point both units are from same apparatus
    appId = units[0][1];
    if (appId === 'apparatus') {
      if (Math.max(units[0][0], units[1][0]) - Math.min(units[0][0], units[1][0]) === 1) {
        //the units are adjacent
        if ((CL.data[appId][units[0][0]].hasOwnProperty('created') &&
                  !CL.unitHasText(CL.data[appId][units[0][0]])) ||
                      (CL.data[appId][units[1][0]].hasOwnProperty('created') &&
                            !CL.unitHasText(CL.data[appId][units[1][0]]))) {
          _doSpecialCombineUnits(units, appId);
        } else {
          _doCombineUnits(units, appId);
        }
      } else {
        //redraw without making any changes
        errorMess = 'ERROR: non-adjacent units cannot be combined';
        unprepareForOperation();
        showSetVariantsData({
          'message': {
            'type': 'error',
            'message': errorMess
          }
        });
      }
    } else {
      //make sure unit 1 is leftmost and unit 2 is rightmost
      unit1 = CL.data[appId][Math.min(units[0][0], units[1][0])];
      unit2 = CL.data[appId][Math.max(units[0][0], units[1][0])];
      //at the same time change the overlap unit id of the second one to match the first
      if (_areAdjacent(unit1._id, unit2._id)) {
        _doCombineUnits(units, appId, true);
      } else {
        //redraw without making any changes
        errorMess = 'ERROR: non-adjacent units cannot be combined';
        unprepareForOperation();
        showSetVariantsData({
          'message': {
            'type': 'error',
            'message': errorMess
          }
        });
      }
    }
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  _combineApparatusIds = function(unit1Id, unit2Id) {
    var topLine, unitPositions, witDetails;
    topLine = CL.data.apparatus;
    unitPositions = _findApparatusPositionsByOverlapId(unit1Id, unit2Id);
    witDetails = topLine[unitPositions[0]].overlap_units[unit1Id];
    for (let i = unitPositions[1]; i < topLine.length; i += 1) {
      if (topLine[i].hasOwnProperty('overlap_units') && topLine[i].overlap_units.hasOwnProperty(unit2Id)) {
        delete topLine[i].overlap_units[unit2Id];
        topLine[i].overlap_units[unit1Id] = witDetails;
      }
    }
  };

  _findApparatusPositionsByOverlapId = function(unit1Id, unit2Id) {
    var topLine, last1, first2;
    topLine = CL.data.apparatus;
    for (let i = 0; i < topLine.length; i += 1) {
      if (topLine[i].hasOwnProperty('overlap_units')) {
        if (topLine[i].overlap_units.hasOwnProperty(unit1Id)) {
          last1 = i;
        }
        if (topLine[i].overlap_units.hasOwnProperty(unit2Id) && typeof first2 === 'undefined') {
          first2 = i;
        }
      }
    }
    return [last1, first2];
  };

  _areAdjacent = function(unit1Id, unit2Id) {
    var unitPositions;
    unitPositions = _findApparatusPositionsByOverlapId(unit1Id, unit2Id);
    if (typeof unitPositions[0] !== 'undefined' && typeof unitPositions[1] !== 'undefined') {
      if (unitPositions[0] + 1 === unitPositions[1]) {
        return true;
      }
    }
    return false;
  };

  /** move a reading to a new unit which already has readings in it */
  _moveReading = function(units, rd) {
    var appId, unit1, unit2, unit2ReadingPos, problems, warningMess, reading, added, newunit, scrollOffset,
      	witnesses, doMoveOut, doMoveIn, replacementReadings, readingId;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    // at this point both units are from same apparatus
    appId = units[0][1];
    // first in merge list is always the target, second is always the one you moved
    // so you are moving the second one and taking position from first
    unit1 = CL.data[appId][units[0][0]];
    unit2 = CL.data[appId][units[1][0]];
    unit2ReadingPos = units[1][2];
    // get the reading you've moved (as a list for later merging)
    // TODO: is there any good reason why reading is made into a list?
    reading = [unit2.readings[unit2ReadingPos]];
    readingId = reading[0]._id;

    prepareForOperation();
    // Now get the real reading and position following the prepare operation
    reading = [CL.findReadingById(unit2, readingId)];
    unit2ReadingPos = CL.findReadingPosById(unit2, readingId);

    witnesses = reading[0].witnesses.join(',');
    if (!reading[0].hasOwnProperty('overlap_status') || reading[0].overlap_status === 'duplicate') {
      doMoveOut = true;
      // if any of these witnesses are in the list of overlapped readings
      // if the unit you are moving it into is part of the same overlapped reading
      if (unit2.hasOwnProperty('overlap_units')) {
        for (let key in unit2.overlap_units) {
          if (unit2.overlap_units.hasOwnProperty(key) && doMoveOut === true) {
            for (let i = 0; i < reading[0].witnesses.length; i += 1) {
              if (unit2.overlap_units[key].indexOf(reading[0].witnesses[i]) !== -1) {
                if (!unit1.hasOwnProperty('overlap_units') ||
                  			(unit1.hasOwnProperty('overlap_units') &&
                    			!unit1.overlap_units.hasOwnProperty(key))) {
                  doMoveOut = false;
                  break;
                }
              }
            }
          }
        }
      }
      doMoveIn = true;
      if (unit1.hasOwnProperty('overlap_units')) {
        for (let key in unit1.overlap_units) {
          if (unit1.overlap_units.hasOwnProperty(key) && doMoveIn === true) {
            for (let i = 0; i < reading[0].witnesses.length; i += 1) {
              if (unit1.overlap_units[key].indexOf(reading[0].witnesses[i]) !== -1) {
                if (!unit2.hasOwnProperty('overlap_units') ||
                  (unit2.hasOwnProperty('overlap_units') &&
                    !unit2.overlap_units.hasOwnProperty(key))) {
                  doMoveIn = false;
                  break;
                }
              }
            }
          }
        }
      }
      // remove overlap flags where necessary check equivalence etc and work out
			// hierarchy, nothing, duplicated, overlapped, deleted
      if (doMoveOut === true && doMoveIn === true) {
        _addToUndoStack(CL.data);
        //delete any combined gap details on subreadings
        delete reading[0].combined_gap_before_subreadings;
        delete reading[0].combined_gap_before_subreadings_details;
        delete reading[0].combined_gap_after_subreadings;
        // and remove its index numbers so it doesn't influence later reindexing
        // and any combined gap details
        for (let i = 0; i < reading[0].text.length; i += 1) {
          delete reading[0].text[i].index;
          delete reading[0].text[i].combined_gap_before;
          delete reading[0].text[i].combined_gap_after;
        }

        // remove reading from its original unit
        unit2.readings.splice(unit2ReadingPos, 1);
        // replace it with an om reading or two depending on overlap status
        replacementReadings = _getReplacementOmReading(unit2, reading[0]);
        for (let i = 0; i < replacementReadings.length; i += 1) {
          CL.addReadingId(replacementReadings[i], unit2.start, unit2.end);
          unit2.readings.push(replacementReadings[i]);
        }

        unsplitUnitWitnesses(units[1][0], appId);
        // merge reading into target unit
        unit1 = _combineReadings(unit1.readings, reading, unit1, true);

        if (unit1.start === unit1.end) {
          SV.reindexUnit(unit1.start);
        } else {
          _reindexMovedReading(unit1.start, reading[0].witnesses);
        }
        separateOverlapWitnesses(units[0][0]);
        problems = _checkWordOrderIntegrity(unit2.start, unit1.start, reading[0].witnesses);
        CL.addReadingIds(unit1);
        // now see if the remaining unit has any text left and if not check to see if it has overlapping readings
        // if it doesn't have overlapping readings we can delete it.
        // if it does its safer to leave it here for the editor to decide what to do.
        if (!CL.unitHasText(CL.data[appId][units[1][0]])) {
          if (!unit2.hasOwnProperty('overlap_units')) {
            CL.data[appId][units[1][0]] = null;
          }
        }
        CL.data.apparatus = CL.removeNullItems(CL.data[appId]);
        unprepareForOperation();
        checkBugStatus('move reading', unit2ReadingPos + ' with witnesses ' + witnesses + ' from unit ' +
											 units[1][0] + ' to unit ' + units[0][0] + ' in ' + appId + '.');
        if (problems.length > 0) {
          warningMess = 'WARNING: Moving the reading has created word order problems in following witnesses: ' +
												problems.join(', ');
          showSetVariantsData({
            'message': {
              'type': 'warning',
              'message': warningMess
            }
          });
        } else {
          showSetVariantsData({});
        }
        document.getElementById('scroller').scrollLeft = scrollOffset[0];
        document.getElementById('scroller').scrollTop = scrollOffset[1];
      } else if (doMoveOut === false) {
        unprepareForOperation();
        warningMess = 'ERROR: Readings which have been overlapped cannot be relocated outside the scope of the ' +
											'overlapped unit';
        showSetVariantsData({
          'message': {
            'type': 'error',
            'message': warningMess
          }
        });
        document.getElementById('scroller').scrollLeft = scrollOffset[0];
        document.getElementById('scroller').scrollTop = scrollOffset[1];
      } else if (doMoveIn === false) {
        unprepareForOperation();
        warningMess = 'ERROR: Readings cannot be relocated to units in which any of the witnesses to the reading ' +
											'being moved have been overlapped';
        showSetVariantsData({
          'message': {
            'type': 'error',
            'message': warningMess
          }
        });
        document.getElementById('scroller').scrollLeft = scrollOffset[0];
        document.getElementById('scroller').scrollTop = scrollOffset[1];
      }
    } else {
      unprepareForOperation();
      warningMess = 'ERROR: Deleted and overlapped readings cannot be relocated (they can be overwritten)';
      showSetVariantsData({
        'message': {
          'type': 'error',
          'message': warningMess
        }
      });
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    }
  };

  //checks to see if each overlapped unit in the current unit is shared by at least one neighbour
  _neighboursShareAllOverlaps = function(appId, unitPos) {
    var olIds, nextOlIds, previousOlIds;
    olIds = _getOverlappedIds(CL.data[appId][unitPos]);
    if (unitPos + 1 < CL.data[appId].length) {
      nextOlIds = _getOverlappedIds(CL.data[appId][unitPos + 1]);
    } else {
      nextOlIds = [];
    }
    if (unitPos !== 0) {
      previousOlIds = _getOverlappedIds(CL.data[appId][unitPos - 1]);
    } else {
      previousOlIds = [];
    }
    for (let i = 0; i < olIds.length; i += 1) {
      if (nextOlIds.indexOf(olIds[i]) === -1 && previousOlIds.indexOf(olIds[i]) === -1) {
        return false;
      }
    }
    return true;
  };

  _getOverlappedIds = function(topUnit) {
    var ids;
    ids = [];
    if (topUnit.hasOwnProperty('overlap_units')) {
      for (let key in topUnit.overlap_units) {
        if (topUnit.overlap_units.hasOwnProperty(key)) {
          ids.push(key);
        }
      }
    }
    return ids;
  };

  //this will return a list of readings (because we might need to split into overlapped and not overlapped
  _getReplacementOmReading = function(unit, movedReading) {
    var witnesses, olWitnesses;
    if (movedReading.hasOwnProperty('overlap_status')) {
      //then all witnesses are implicated and we can just return a single om reading with duplicate status
      return [{
        'text': [],
        'type': 'om',
        'witnesses': movedReading.witnesses.slice(0),
        'overlap_status': 'duplicate'
      }];
    }
    //otherwise this reading might have been made a main reading and combined with other readings
    //so we need to check and split out any overlapped witnesses returning 2 om readings
    //or we could just return a single om reading with no overlap status if no witneses are overlapped
    olWitnesses = [];
    if (unit.hasOwnProperty('overlap_units')) {
      for (let key in unit.overlap_units) {
        if (unit.overlap_units.hasOwnProperty(key)) {
          for (let i = 0; i < unit.overlap_units[key].length; i += 1) {
            if (movedReading.witnesses.indexOf(unit.overlap_units[key][i]) !== -1) {
              olWitnesses.push(unit.overlap_units[key][i]);
            }
          }
        }
      }
    }
    if (olWitnesses.length === 0) {
      //then none of this readings witnesses are overlapped so return an om reading
      return [{
        'text': [],
        'type': 'om',
        'witnesses': movedReading.witnesses.slice(0)
      }];
    }
    if (olWitnesses.length === movedReading.witnesses.length) {
      //then they are all overlapped so return a single overlapped om reading
      return [{
        'text': [],
        'type': 'om',
        'witnesses': movedReading.witnesses.slice(0),
        'overlap_status': 'duplicate'
      }];
    }
    //otherwise we need to split them
    witnesses = movedReading.witnesses.slice(0);
    for (let i = 0; i < olWitnesses.length; i += 1) {
      if (witnesses.indexOf(olWitnesses[i]) !== -1) {
        witnesses.splice(witnesses.indexOf(olWitnesses[i]), 1);
      }
    }
    return [{
      'text': [],
      'type': 'om',
      'witnesses': witnesses
    }, {
      'text': [],
      'type': 'om',
      'witnesses': olWitnesses,
      'overlap_status': 'duplicate'
    }];
  };

  // keep combined_gap_before_subreadings
  /** used when moving readings and combining units to figure out all the reading combinations */
  _combineReadings = function(readings1, readings2, newunit, moveReading) {
    var read1, read2, newReadings, witness, index, current, text, newRdg;
    newReadings = {};
    // this section builds a dictionary with reading index numbers (for empty readings) or the text with indication
		// of overlapstatus for extant readings as key to witnesses and text. empty reading keys are 1-2 meaning first
    // reading in unit1 and second reading in unit2 for each reading in readings 1
    for (let i = 0; i < readings1.length; i += 1) {
      // for each witness in reading
      for (let j = 0; j < readings1[i].witnesses.length; j += 1) {
        witness = readings1[i].witnesses[j];
        read1 = i;
        for (let k = 0; k < readings2.length; k += 1) {
          if (readings2[k].witnesses.indexOf(witness) !== -1) {
            read2 = k;
          } else if (moveReading === true) {
            // readings 2 could be a single reading from another unit and not have a reading for all witnesses
            read2 = null;
          }
        }

        // need to make a fake new reading in order to extract the text
        newRdg = {
          'text': _orderUnitText(readings1, readings2, [read1, read2], witness)
        };
        text = CL.extractWitnessText(newRdg, {
          'witness': witness,
          'reading_type': 'mainreading'
        });

        if (readings1[read1].hasOwnProperty('overlap_status')) {
          text = text + '_' + readings1[read1].overlap_status;
        }
        if (read2 !== null && readings2[read2].hasOwnProperty('overlap_status')) {
          text = text + '_' + readings2[read2].overlap_status;
        }
        // now if we don't have any text which is possible use the reading positions in each unit as key
				// (keeps all our different om/lac etc. reading separate)
        if (text.length === 0) {
          if (moveReading === true && read2 === null) {
            text = read1;
          } else {
            text = read1 + '-' + read2;
          }
        }
        if (newReadings.hasOwnProperty(text)) {
          _addTypeAndDetails(newReadings[text], readings1[read1], readings2[read2]);
          newReadings[text].witnesses.push(witness);
          newReadings[text].text = _combineReadingText(readings1, readings2,
																										   [read1, read2], witness,
																											 newReadings[text].text).sort(_compareIndexes);
        } else {
          newRdg = {
            'witnesses': [witness],
            'text': _combineReadingText(readings1, readings2, [read1, read2], witness, [])
          };
          if (read2 !== null) {  // we only need to worry about which one to chose if we have two readings
            if (readings1[read1].hasOwnProperty('overlap_status') &&
									readings2[read2].hasOwnProperty('overlap_status')) {
              if (readings1[read1].overlap_status === readings2[read2].overlap_status) {
                newRdg.overlap_status = readings1[read1].overlap_status;
              } else if (readings1[read1].overlap_status === 'duplicate' ||
														readings2[read2].overlap_status === 'duplicate') {
                newRdg.overlap_status = 'duplicate';
              } else {
                for (let k = 0; k < CL.overlappedOptions.length; k += 1) {
                  if (CL.overlappedOptions[k].reading_flag === readings1[read1].overlap_status ||
													CL.overlappedOptions[k].reading_flag === readings2[read2].overlap_status) {
                    newRdg.overlap_status = CL.overlappedOptions[k].reading_flag;
                  }
                }
              }
            } else if (readings1[read1].hasOwnProperty('overlap_status') ||
													readings2[read2].hasOwnProperty('overlap_status')) {
              newRdg.overlap_status = 'duplicate';  // make it duplicate because its the safest.
            }
          } else if (readings1[read1].hasOwnProperty('overlap_status')) {
						// otherwise we just use readings1 overlap status if there is one
            newRdg.overlap_status = readings1[read1].overlap_status;
          }
          newReadings[text] = newRdg;
          _addTypeAndDetails(newReadings[text], readings1[read1], readings2[read2]);
        }
      }
    }
    newunit.readings = [];
    for (let key in newReadings) {
      if (newReadings.hasOwnProperty(key)) {
        newunit.readings.push(_fixIndexNumbers(newReadings[key]));
      }
    }
    return newunit;
  };

  _fixIndexNumbers = function(reading) {
    for (let i = 1; i < reading.text.length; i += 1) {
      if (typeof reading.text[i].index !== 'undefined') {
        if (reading.text[i - 1].index === reading.text[i].index) {
          reading.text[i].index = _incrementSubIndex(reading.text[i].index, 1);
        }
      }
    }
    return reading;
  };

  _orderUnitText = function(readings1, readings2, pattern, witness, changeIndexes) {
    var words, indexes, ordered;
    words = [];
    for (let i = 0; i < pattern.length; i += 1) {
      if (i === 0) {
        if (pattern[i] !== null) {
          words.push.apply(words, readings1[pattern[i]].text);
        }
      } else {
        if (pattern[i] !== null) {
          words.push.apply(words, readings2[pattern[i]].text);
        }
      }
    }
    //sort the words for the witness
    words.sort(function(a, b) {
      if (a.hasOwnProperty(witness) && b.hasOwnProperty(witness)) {
        return parseInt(a[witness].index) - parseInt(b[witness].index);
      }
    });
    if (changeIndexes === true) {
      indexes = [];
      ordered = true;
      for (let i = 0; i < words.length; i += 1) {
        if (_indexLessThan(words[i].index, indexes[indexes.length - 1])) {
          ordered = false;
        }
        indexes.push(words[i].index);
      }
      if (ordered === false) {
        indexes.sort(_compareIndexStrings);
        for (let i = 0; i < words.length; i += 1) {
          words[i].index = indexes[i];
        }
      }
    }
    return words;
  };


  /**  */
  _combineReadingText = function(readings1, readings2, pattern, witness, currentText) {
    var k, current, words;
    if (typeof currentText === 'undefined') {
      return [];
    }
    words = _orderUnitText(readings1, readings2, pattern, witness, true);
    k = 0;
    for (let i = 0; i < words.length; i += 1) {
      current = currentText[k] || {};
      currentText[k] = _combineWords(current, words[i], witness);
      if (k > 0 && currentText[k].hasOwnProperty('combined_gap_before')) {
        //if this gap is now embedded delete its reference
        delete currentText[k].combined_gap_before;
        delete currentText[k].combined_gap_before_details;
      }
      k += 1;
    }
    for (let i = 0; i < currentText.length - 1; i += 1) {
      if (currentText[i].hasOwnProperty('combined_gap_after')) {
        delete currentText[i].combined_gap_after;
      }
    }
    return currentText;
  };

  /** add type and detail data for empty (lac/om) readings */
  _addTypeAndDetails = function(newreading, reading1, reading2) {
    var type1, type2;
    // I think lac should trump om should that ever occur (which it shouldn't)
    // if both are the same type them details come from reading1 they should also be the same anyway
    if (typeof reading2 === 'undefined') {
      if (reading1.text.length === 0) {
        newreading.type = reading1.type;
        if (reading1.hasOwnProperty('details')) {
          newreading.details = reading1.details;
        }
      }
    } else if (reading1.text.length === 0 && reading2.text.length === 0) {
      type1 = reading1.type;
      type2 = reading2.type;
      if (type1 === type2) {
        newreading.type = type1;
        if (reading1.hasOwnProperty('details')) {
          newreading.details = reading1.details;
        }
      } else if (type1 === 'lac') {
        newreading.type = type1;
        if (reading1.hasOwnProperty('details')) {
          newreading.details = reading1.details;
        }
      } else {
        newreading.type = type2;
        if (reading2.hasOwnProperty('details')) {
          newreading.details = reading2.details;
        }
      }
    }
    // TODO: test if this works with non-empty readings (difficult to find example with identical witnesses)
    if (reading1.hasOwnProperty('overlap')) {
      newreading.overlap = true;
    }
  };

  /** combine two word token properties*/
  _combineWords = function(newWord, oldWord, witness) {
    if (!newWord.hasOwnProperty('index')) {
      newWord.index = oldWord.index;
    }
    if (!newWord.hasOwnProperty('verse')) {
      newWord.verse = oldWord.verse;
    }
    if (!newWord.hasOwnProperty('interface')) {
      newWord['interface'] = oldWord['interface'];
    }
    if (!newWord.hasOwnProperty('reading')) {
      newWord.reading = [];
    }
    if (oldWord.hasOwnProperty('regularised')) {
      newWord.regularised = oldWord.regularised;
    }
    if (oldWord.hasOwnProperty('was_gap')) {
      newWord.was_gap = oldWord.was_gap;
    }
    if (oldWord.hasOwnProperty('combined_gap_before')) {
      if (!newWord.hasOwnProperty('combined_gap_before')) {
        newWord.combined_gap_before = oldWord.combined_gap_before;
      } else {
        for (let i = 0; i < oldWord.combined_gap_before.length; i += 1) {
          if (newWord.combined_gap_before.indexOf(oldWord.combined_gap_before[i]) === -1) {
            newWord.combined_gap_before.push(oldWord.combined_gap_before[i]);
          }
        }
      }
    }
    if (oldWord.hasOwnProperty('combined_gap_before_details')) {
      newWord.combined_gap_before_details = oldWord.combined_gap_before_details;
    }
    if (oldWord.hasOwnProperty('combined_gap_after')) {
      if (!newWord.hasOwnProperty('combined_gap_after')) {
        newWord.combined_gap_after = oldWord.combined_gap_after;
      } else {
        for (let i = 0; i < oldWord.combined_gap_after.length; i += 1) {
          if (newWord.combined_gap_after.indexOf(oldWord.combined_gap_after[i]) === -1) {
            newWord.combined_gap_after.push(oldWord.combined_gap_after[i]);
          }
        }
      }
    }
    newWord[witness] = oldWord[witness];
    for (let i = 0; i < oldWord.reading.length; i += 1) {
      if (oldWord.reading[i] === witness) {
        newWord.reading.push(oldWord.reading[i]);
      }
    }
    return newWord;
  };

  _separateIndividualOverlapWitnesses = function(witnessList, overlaps) {
    var newAdds, olAdds, olUnit, olRdgDetails;
    newAdds = [];
    for (let key in overlaps) {
      if (overlaps.hasOwnProperty(key)) {
        olUnit = CL.findOverlapUnitById(key);
        olRdgDetails = {};

        if (olUnit.readings.length > 1 && olUnit.readings[1].hasOwnProperty('type')) {
          olRdgDetails.type = olUnit.readings[1].type;
        } else if (olUnit.readings[0].hasOwnProperty('type')) {
					// if it is an om that is overlapped and basetext is also om then there will only be on reading in
					// the data structure even though display shows two
          olRdgDetails.type = olUnit.readings[0].type;
        }
        if (olUnit.readings.length > 1 && olUnit.readings[1].hasOwnProperty('details')) {
          olRdgDetails.details = olUnit.readings[1].details;
        } else if (olUnit.readings[0].hasOwnProperty('details')) {
          olRdgDetails.details = olUnit.readings[0].details;
        }
        olAdds = [];
        for (let i = 0; i < overlaps[key].length; i += 1) {
          if (witnessList.indexOf(overlaps[key][i]) !== -1) {
            olAdds.push(overlaps[key][i]);
          }
        }
        if (olAdds.length > 0) {
          newAdds.push([olAdds, olRdgDetails]);
        }
      }
    }
    return newAdds;
  };

  /** split unit stuff*/
  _doSplitUnit = function(unit, appId, index) {
    var text, apps, witnesses, witnessesCopy, overlapWitnesses, words, wordsDict, scrollOffset, rdg, add,
      	splitAdds, newunit, omReadingsCopy, lacReadingsCopy, newReading, specialCategoryWitnesses;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    _addToUndoStack(CL.data);
    CL.hideTooltip();
    prepareForOperation();
    words = [];
    text = [];
    apps = [];
    witnesses = [];
    overlapWitnesses = {};  // this is a keyed by overlap_status
    // get all the witnesses in the unit and any in corresponding overlapping units (using the overlap_status flag)
    for (let i = 0; i < unit.readings.length; i += 1) {
      witnesses.push.apply(witnesses, CL.getAllReadingWitnesses(unit.readings[i]));
      if (unit.readings[i].hasOwnProperty('overlap_status')) {
        if (!overlapWitnesses.hasOwnProperty(unit.readings[i].overlap_status)) {
          overlapWitnesses[unit.readings[i].overlap_status] = [];
        }
        overlapWitnesses[unit.readings[i].overlap_status].push.apply(overlapWitnesses[unit.readings[i].overlap_status],
																																		 CL.getAllReadingWitnesses(unit.readings[i]));
      }
      //while we are looping through readings remove any combined gap information so all the gaps come back
      if (unit.readings[i].hasOwnProperty('combined_gap_before_subreadings')) {
        delete unit.readings[i].combined_gap_before_subreadings;
        if (unit.readings[i].hasOwnProperty('combined_gap_before_subreadings_details')) {
          delete unit.readings[i].combined_gap_before_subreadings_details;
        }
      }
      if (unit.readings[i].hasOwnProperty('combined_gap_after_subreadings')) {
        delete unit.readings[i].combined_gap_after_subreadings;
      }
      if (unit.readings[i].text.length > 0) {
        if (unit.readings[i].text[0].hasOwnProperty('combined_gap_before')) {
          delete unit.readings[i].text[0].combined_gap_before;
          if (unit.readings[i].text[0].hasOwnProperty('combined_gap_before_details')) {
            delete unit.readings[i].text[0].combined_gap_before_details;
          }
        }
        if (unit.readings[i].text[unit.readings[i].text.length - 1].hasOwnProperty('combined_gap_after')) {
          delete unit.readings[i].text[unit.readings[i].text.length - 1].combined_gap_after;
        }
      }
    }
    //make a sets of all of witnesses
    witnesses = CL.setList(witnesses);
    //remove any om and lac verse witnesses
    if (CL.data.hasOwnProperty('om_readings')) {
      for (let i = 0; i < CL.data.om_readings.length; i += 1) {
        witnesses.splice(witnesses.indexOf(CL.data.om_readings[i]), 1);
      }
    }
    if (CL.data.hasOwnProperty('lac_readings')) {
      for (let i = 0; i < CL.data.lac_readings.length; i += 1) {
        witnesses.splice(witnesses.indexOf(CL.data.lac_readings[i]), 1);
      }
    }
    //get all the words from all readings and mark those from overlapping readings
    for (let i = 0; i < unit.readings.length; i += 1) {
      if (unit.readings[i].hasOwnProperty('overlap_status')) {
        for (let j = 0; j < unit.readings[i].text.length; j += 1) {
          unit.readings[i].text[j].overlap_status = unit.readings[i].overlap_status;
        }
      }
      words.push.apply(words, unit.readings[i].text);
    }
    //sort the words based on their indexes
    words.sort(_compareIndexes);
    //build a dictionary of words using the word's index numbers as keys
    wordsDict = {};
    for (let i = 0; i < words.length; i += 1) {
      if (wordsDict.hasOwnProperty(words[i].index)) {
        wordsDict[words[i].index].push(words[i]);
      } else {
        wordsDict[words[i].index] = [(words[i])];
      }
    }
    for (let key in wordsDict) {
      if (wordsDict.hasOwnProperty(key)) {
        text.push(wordsDict[key]);
      }
    }
    //step through the words again and construct the variant unit data structure
    //here text is a list containing all the tokens at this index point in the split
    for (let i = 0; i < text.length; i += 1) {
      witnessesCopy = JSON.parse(JSON.stringify(witnesses)); //work on a copy
      newunit = {
        'start': parseInt(text[i][0].index, 10),
        'end': parseInt(text[i][0].index, 10),
        'first_word_index': text[i][0].index,
        'readings': [],
      };
      if (unit.hasOwnProperty('overlap_units')) {
        newunit.overlap_units = JSON.parse(JSON.stringify(unit.overlap_units));  // make a copy or they stay linked
      }
      for (let j = 0; j < text[i].length; j += 1) {
        if (typeof text[i][j].witnesses !== 'undefined') { //TODO: check if this condition is ever used
          newunit.readings.push(text[i][j]);
        } else {
          rdg = {
            'witnesses': text[i][j].reading.slice(0),
            'text': [text[i][j]]
          };
          if (text[i][j].hasOwnProperty('overlap_status')) {
            rdg.overlap_status = text[i][j].overlap_status;
          }
          newunit.readings.push(rdg);
        }
      }
      for (let j = 0; j < newunit.readings.length; j += 1) {
        for (let k = 0; k < newunit.readings[j].witnesses.length; k += 1) {
          witnessesCopy.splice(witnessesCopy.indexOf(newunit.readings[j].witnesses[k]), 1);
        }
      }
      if (witnessesCopy.length > 0) {
        for (let key in overlapWitnesses) {
          if (overlapWitnesses.hasOwnProperty(key)) {
            add = [];
            if (overlapWitnesses[key].length > 0) {
              for (let j = 0; j < overlapWitnesses[key].length; j += 1) {
                if (witnessesCopy.indexOf(overlapWitnesses[key][j]) !== -1) {
                  add.push(overlapWitnesses[key][j]);
                  witnessesCopy.splice(witnessesCopy.indexOf(overlapWitnesses[key][j]), 1);
                }
              }
              if (add.length > 0) {
                if (unit.hasOwnProperty('overlap_units')) {
                  splitAdds = _separateIndividualOverlapWitnesses(add, unit.overlap_units);
                  for (let k = 0; k < splitAdds.length; k += 1) {
                    if (key === 'duplicate') {
                      newReading = {
                        'witnesses': splitAdds[k][0],
                        'text': [],
                        'overlap_status': key
                      };
                      if (splitAdds[k][1].hasOwnProperty('type')) {
                        newReading.type = splitAdds[k][1].type;
                      } else {
                        newReading.type = 'om';
                      }
                      if (splitAdds[k][1].hasOwnProperty('details')) {
                        newReading.details = splitAdds[k][1].details;
                      }
                      newunit.readings.push(newReading);
                    } else {
                      newunit.readings.push({
                        'witnesses': splitAdds[k][0],
                        'text': [],
                        'overlap_status': key,
                        'type': 'om'
                      });
                    }
                  }
                } else {
                  newunit.readings.push({
                    'witnesses': add,
                    'text': [],
                    'overlap_status': key,
                    'type': 'om'
                  });
                }
              }
            }
          }
        }
        if (witnessesCopy.length > 0) {
          newunit.readings.push({
            'witnesses': witnessesCopy,
            'text': [],
            'type': 'om'
          });
        }
      }
      if (CL.data.hasOwnProperty('om_readings') && CL.data.om_readings.length > 0) {
        omReadingsCopy = CL.data.om_readings.slice(0);
        for (let key in overlapWitnesses) {
          if (overlapWitnesses.hasOwnProperty(key)) {
            add = [];
            if (overlapWitnesses[key].length > 0) {
              for (let j = 0; j < overlapWitnesses[key].length; j += 1) {
                if (omReadingsCopy.indexOf(overlapWitnesses[key][j]) !== -1) {
                  add.push(overlapWitnesses[key][j]);
                  omReadingsCopy.splice(omReadingsCopy.indexOf(overlapWitnesses[key][j]), 1);
                }
              }
              if (add.length > 0) {
                newunit.readings.push({
                  'witnesses': add,
                  'text': [],
                  'overlap_status': key,
                  'type': 'om_verse',
                  'details': CL.project.omUnitLabel
                });
              }
            }
          }
        }
        if (omReadingsCopy.length > 0) {
          newunit.readings.push({
            'witnesses': omReadingsCopy,
            'text': [],
            'type': 'om_verse',
            'details': CL.project.omUnitLabel
          });
        }
      }
      if (CL.data.hasOwnProperty('lac_readings') && CL.data.lac_readings.length > 0) {
        lacReadingsCopy = CL.data.lac_readings.slice(0);
        for (let key in overlapWitnesses) {
          if (overlapWitnesses.hasOwnProperty(key)) {
            add = [];
            if (overlapWitnesses[key].length > 0) {
              for (let j = 0; j < overlapWitnesses[key].length; j += 1) {
                if (lacReadingsCopy.indexOf(overlapWitnesses[key][j]) !== -1) {
                  add.push(overlapWitnesses[key][j]);
                  lacReadingsCopy.splice(lacReadingsCopy.indexOf(overlapWitnesses[key][j]), 1);
                }
              }
              if (add.length > 0) {
                newunit.readings.push({
                  'witnesses': add,
                  'text': [],
                  'overlap_status': key,
                  'type': 'lac_verse',
                  'details': CL.project.lacUnitLabel
                });
              }
            }
          }
        }
        if (lacReadingsCopy.length > 0) {
          if (CL.data.hasOwnProperty('special_categories')) {
            for (let i = 0; i < CL.data.special_categories.length; i += 1) {
              specialCategoryWitnesses = [];
              for (let j = 0; j < CL.data.special_categories[i].witnesses.length; j += 1) {
                if (lacReadingsCopy.indexOf(CL.data.special_categories[i].witnesses[j]) >= -1) {
                  specialCategoryWitnesses.push(CL.data.special_categories[i].witnesses[j]);
                  lacReadingsCopy.splice(lacReadingsCopy.indexOf(CL.data.special_categories[i].witnesses[j]), 1);
                }
              }
              newunit.readings.push({
                'witnesses': specialCategoryWitnesses,
                'text': [],
                'type': 'lac_verse',
                'details': CL.data.special_categories[i].label
              });
            }
            if (lacReadingsCopy.length > 0) {
              newunit.readings.push({
                'witnesses': lacReadingsCopy,
                'text': [],
                'type': 'lac_verse',
                'details': CL.project.lacUnitLabel
              });
            }
          } else {
            newunit.readings.push({
              'witnesses': lacReadingsCopy,
              'text': [],
              'type': 'lac_verse',
              'details': CL.project.lacUnitLabel
            });
          }
        }
      }
      CL.addUnitId(newunit);
      apps.push(newunit);
    }
    // replace the current data with this new stuff
    CL.data[appId].splice(index, 1);
    for (let i = apps.length - 1; i >= 0; i -= 1) {
      CL.addUnitId(apps[i]);
      CL.addReadingIds(apps[i]);
      CL.data[appId].splice(index, 0, apps[i]);
      unsplitUnitWitnesses(index, appId);
      //if this is an overlapped unit split the base text out as the a reading
      if (appId !== 'apparatus') {
        for (let j = 0; j < unit.readings.length; j += 1) {
          if (unit.readings[j].witnesses.indexOf(CL.dataSettings.base_text_siglum) !== -1) {
            doSplitReadingWitnesses(index, 0, [CL.dataSettings.base_text_siglum], appId, false);
            break;
          }
        }
      }
    }
    // now sort them by start index and then by index of first item in text
    CL.data[appId].sort(_compareFirstWordIndexes);
    _tidyUnits(appId);
    unprepareForOperation();
    showSetVariantsData();

    checkBugStatus('split', appId + ' unit ' + index + '.');
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  /** split the unit into individual words */
  _splitUnit = function(index) {
    var appId, apparatusNum, scrollOffset, operationNeeded;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    // find the correct apparatus
    if (index.match(/_app_/g)) {
      apparatusNum = parseInt(index.match(/\d+/g)[1], 10);
      index = parseInt(index.match(/\d+/g)[0], 10);
      appId = 'apparatus' + apparatusNum;
    } else {
      appId = 'apparatus';
    }
    // make sure this only happens if at least one of the readings has more that one token or one has combined
    // gap before or after at this point all subreadings will be same length as main reading or have been turned back
    // into main readings by prepare_for_operation
    operationNeeded = false;
    for (let i = 0; i < CL.data[appId][index].readings.length; i += 1) {
      if (CL.data[appId][index].readings[i].text.length > 1) {
        operationNeeded = true;
      } else if (CL.data[appId][index].readings[i].text.length > 0 &&
        (CL.data[appId][index].readings[i].text[0].hasOwnProperty('combined_gap_before') ||
          CL.data[appId][index].readings[i].text[0].hasOwnProperty('combined_gap_after'))) {
        operationNeeded = true;
      } else if (CL.data[appId][index].readings[i].hasOwnProperty('combined_gap_before_subreadings') ||
        CL.data[appId][index].readings[i].hasOwnProperty('combined_gap_after_subreadings')) {
        operationNeeded = true;
      }
    }
    if (operationNeeded === true) {
      _doSplitUnit(CL.data[appId][index], appId, index);
    } else {
      showSetVariantsData();
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    }
  };

  /** Called after splitting units to push any addition readings into the following gap*/
  _tidyUnits = function(appId) {
		// loop backwards so if more than one needs to be moved they stay in the correct order
    for (let i = CL.data[appId].length - 1; i >= 0; i = i - 1) {
      //if start and end are the same and its an even number
      if (CL.data[appId][i].start === CL.data[appId][i].end && CL.data[appId][i].start % 2 === 0) {
        if (CL.sortReadings(CL.data[appId][i].readings)[0].text.length === 0) {
          // move the extra one to the next unit space
          CL.data[appId][i].start = CL.data[appId][i].start + 1;
          CL.data[appId][i].end = CL.data[appId][i].end + 1;
          SV.reindexUnit(CL.data[appId][i].start);
        }
      }
    }
  };

  /** Overlap related stuff */

  /** checks that a single word/space index of the base text has a single unit of variation underneath it.
   * i.e. that a space only has one unit that starts and ends at that index.
   * This is used as a check before making an overlapping reading as it makes the overlap code easier
   * it is only relevant for first line of apparatus so only need to supply unitNum */
  _checkUnitUniqueness = function(unitNum, appId) {
    var start, end, prevStart, prevEnd, nextStart, nextEnd;
    //get start and end words of unit
    start = CL.data[appId][unitNum].start;
    end = CL.data[appId][unitNum].end;
    //check the unit before
    if (unitNum > 0) {
      prevStart = CL.data[appId][unitNum - 1].start;
      prevEnd = CL.data[appId][unitNum - 1].end;
      if (prevStart === start || prevStart === end || prevEnd === start || prevEnd === end) {
        return false;
      }
    }
    //check the unit after
    if (unitNum + 1 < CL.data[appId].length) {
      nextStart = CL.data[appId][unitNum + 1].start;
      nextEnd = CL.data[appId][unitNum + 1].end;
      if (nextStart === start || nextStart === end || nextEnd === start || nextEnd === end) {
        return false;
      }
    }
    return true;
  };

	// TODO: is this used?
	/* build a list of units that start and end with the same values remembering where the target is */
  _getPosInUnitSet = function(unitNum, appId) {
    var start, end, unitList, i, prevStart, prevEnd, nextStart, nextEnd;
    start = CL.data[appId][unitNum].start;
    end = CL.data[appId][unitNum].end;
    unitList = ['hit'];
    i = 1;
    while (unitNum - i > 0) {
      prevStart = CL.data[appId][unitNum - i].start;
      prevEnd = CL.data[appId][unitNum - i].end;
      if (prevStart === start && prevEnd === end) {
        unitList.splice(0, 0, 'pre');
        i += 1;
      } else {
        break;
      }
    }
    i = 1;
    while (unitNum + i < CL.data[appId].length) {
      nextStart = CL.data[appId][unitNum + i].start;
      nextEnd = CL.data[appId][unitNum + i].end;
      if (nextStart === start && nextEnd === end) {
        unitList.push('post');
        i += 1;
      } else {
        break;
      }
    }
    return [unitList.indexOf('hit'), unitList.length];
  };

  // duplicate is retained here just in case minds are changed on always duplicating it will always be true and will
	// not show on menu
  /** make a reading overlap (move to new line of apparatus) */
  _overlapReading = function(unitNum, readingNum, menuPos) {
    var reading, errorMess, duplicate, scrollOffset, witnessList, data, newReadingId;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
      							document.getElementById('scroller').scrollTop];
    duplicate = true;
    if (_checkUnitUniqueness(unitNum, 'apparatus')) {
      reading = CL.data.apparatus[unitNum].readings[readingNum];
      if (!_hasStandoffSubreading(reading)) {
        if (reading.witnesses.length > 1) {
          CL.showSplitWitnessMenu(reading, menuPos, {
            'type': 'overlap',
            'header': 'Select witnesses to overlap',
            'button': 'Overlap witnesses',
            'form_size': 'small'
          });
          $('#select_button').on('click', function(event) {
            witnessList = [];
            data = cforms.serialiseForm('select_wit_form');
            if (!$.isEmptyObject(data)) {
              witnessList = [];
              for (let key in data) {
                if (key === 'duplicate' && data[key] !== null) {
                  duplicate = true;
                } else if (data.hasOwnProperty(key)) {
                  if (data[key] !== null) {
                    witnessList.push(key);
                  }
                }
              }
            }
            newReadingId = doSplitReadingWitnesses(unitNum, readingNum, witnessList, 'apparatus', true);
            _makeOverlappingReading(unitNum, newReadingId, duplicate);
            document.getElementsByTagName('body')[0].removeChild(document.getElementById('wit_form'));
          });
        } else {
          _makeOverlappingReading(unitNum, reading._id, duplicate);
        }
      } else {
        errorMess = 'ERROR: readings which have a subreading created in set variants (as apposed to in the regulariser) cannot be overlapped';
        //the other kind of regularised readings are okay because they will always be token for token and never involve gaps having been regularised or different reading lengths
        showSetVariantsData({
          'message': {
            'type': 'error',
            'message': errorMess
          }
        });
        document.getElementById('scroller').scrollLeft = scrollOffset[0];
        document.getElementById('scroller').scrollTop = scrollOffset[1];
      }
    } else {
      errorMess = 'ERROR: variation units have to be merged for each index point before creating an overlapping variant';
      showSetVariantsData({
        'message': {
          'type': 'error',
          'message': errorMess
        }
      });
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    }
  };

  _makeOverlappingReading = function(unitNum, readingId, duplicate) {
    var originalUnit, aReading, reading, newunit, found, key, scrollOffset, olId, newWord, temp, appIds;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
      							document.getElementById('scroller').scrollTop];
    _addToUndoStack(CL.data);
    originalUnit = CL.data.apparatus[unitNum];
    aReading = CL.data.apparatus[unitNum].readings[0];
    reading = CL.findReadingById(originalUnit, readingId);
    // must do this after we have caputured the readings or is messes up positions! we don't use positions for the
		// reading anymore but it can stay here anyway
    prepareForOperation();
		// we prepare above because it makes sorting out the gaps easier. Any reading with standoff overlap has already
		// been disallowed overlap status by this point
    if (duplicate === true) {
      reading.overlap_status = 'duplicate';
    }
    // make the new unit for the overlapping reading
    newunit = {};
    newunit.start = CL.data.apparatus[unitNum].start;
		// having end is pointless we never use it for displaying but we do need a value because most things
		// (especially id adding functions) assume its there
    newunit.end = CL.data.apparatus[unitNum].end;
    newunit.first_word_index = CL.data.apparatus[unitNum].first_word_index;
    // work out the first app line that has space for the unit
    appIds = CL.getOrderedAppLines();
    if (appIds.length === 0) {
      newunit.row = 2;
    } else {
      for (let i = 0; i < appIds.length; i += 1) {
        found = false;
        for (let j = 0; j < CL.data[appIds[i]].length; j += 1) {
          if (CL.data[appIds[i]][j].start <= newunit.start && CL.data[appIds[i]][j].end >= newunit.end) {
            found = true;
          }
        }
        if (!found) {
          newunit.row = parseInt(appIds[i].replace('apparatus', ''));
          break;
        }
      }
      if (typeof newunit.row === 'undefined') {
        newunit.row = parseInt(appIds[appIds.length - 1].replace('apparatus', '')) + 1;
      }
    }
    newunit.readings = [JSON.parse(JSON.stringify(aReading)), JSON.parse(JSON.stringify(reading))];
    delete newunit.readings[1].overlap_status;
    newunit.readings[0].witnesses = [CL.dataSettings.base_text_siglum];
    delete newunit.readings[0].subreadings;
    delete newunit.readings[0].otherreadings;
    for (let i = 0; i < newunit.readings[0].text.length; i += 1) {
      for (let key in newunit.readings[0].text[i]) {
        if (newunit.readings[0].text[i].hasOwnProperty(key)) {
          if ([CL.dataSettings.base_text_siglum, 'verse', 'interface', 't', 'index', 'siglum'].indexOf(key) === -1) {
            delete newunit.readings[0].text[i][key];
          }
        }
      }
      newunit.readings[0].text[i].reading = [CL.dataSettings.base_text_siglum];
    }
    // now sort out any gaps which need to become full readings this must happen after we have copied
    // the subreading (which now becomes the 'genuine' presentation of this reading)
    for (let i = reading.text.length - 1; i >= 0; i -= 1) {
      if (reading.text[i][reading.witnesses[0]].hasOwnProperty('gap_after') &&
        		(i + 1 >= reading.text.length || (i + 1 < reading.text.length &&
							!reading.text[i + 1].hasOwnProperty('was_gap')))) {
				// this was_gap (above) use is safe as only triggered while making overlap and order will not have been
				// changed at this point
        if (i < reading.text.length - 1 ||
							i === reading.text.length - 1 &&
								newunit.readings[1].text[newunit.readings[1].text.length - 1].hasOwnProperty('combined_gap_after')) {
          newWord = {
            'index': _incrementSubIndex(reading.text[i].index, 1),
            'interface': '&lt;' + reading.text[i][reading.witnesses[0]].gap_details + '&gt;',
            'was_gap': true,
            'verse': reading.text[i].verse,
            'reading': [],
          };
          for (let j = 0; j < reading.witnesses.length; j += 1) {
            newWord.reading.push(reading.witnesses[j]);
            newWord[reading.witnesses[j]] = {
              'index': _incrementMainIndex(reading.text[i][reading.witnesses[j]].index, 1),
              'original': newWord['interface']
            };
            if (reading.text[i][reading.witnesses[j]].hasOwnProperty('gap_after')) {
							// the absence of this flag is only important for extract text which only cares about this reading
							// so we don't need to look at any previous units
              delete reading.text[i][reading.witnesses[j]].gap_after;
            }
          }
          delete reading.text[i].combined_gap_after;
          reading.text.splice(i + 1, 0, newWord);
        }
      }
      if (i === 0 && newunit.readings[1].text[0].hasOwnProperty('combined_gap_before')) {
        newWord = {
          'interface': '&lt;' + newunit.readings[1].text[0].combined_gap_before_details + '&gt;',
          'was_gap': true,
          'verse': reading.text[i].verse,
          'reading': [],
        };
        if (parseInt(reading.text[0].index) % 2 === 0) { //check to see if it is an even numbered index
          temp = _decrementMainIndex(reading.text[0].index, 1);
          newWord.index = temp.split('.')[0] + '.99';
        } else {
          newWord.index = _decrementSubIndex(reading.text[i].index, 1);
          reading.text[i].index = _incrementSubIndex(newWord.index, 1);
        }
        for (let j = 0; j < reading.witnesses.length; j += 1) {
          newWord.reading.push(reading.witnesses[j]);
          newWord[reading.witnesses[j]] = {
            'index': String(reading.text[i][reading.witnesses[j]].index - 1),
            'original': newWord['interface']
          };
          if (reading.text[i][reading.witnesses[j]].hasOwnProperty('gap_before')) {
            delete reading.text[i][reading.witnesses[j]].gap_before;
          }
        }
        delete reading.text[0].combined_gap_before;
        delete reading.text[0].combined_gap_before_details;
        reading.text.splice(0, 0, newWord);
      }
      reading = _fixIndexNumbers(reading);
    }
    //get the id and then add it to the original unit so we know the extent of this overlapping unit
    olId = CL.addUnitId(newunit, 'apparatus' + newunit.row);
    if (!CL.data.apparatus[unitNum].hasOwnProperty('overlap_units')) {
      CL.data.apparatus[unitNum].overlap_units = {};
    }
    CL.data.apparatus[unitNum].overlap_units[olId] = CL.getAllReadingWitnesses(reading);
    if (CL.data.hasOwnProperty('apparatus' + newunit.row)) {
      CL.data['apparatus' + newunit.row].push(newunit);
      CL.data['apparatus' + newunit.row].sort(_compareFirstWordIndexes);
    } else {
      CL.data['apparatus' + newunit.row] = [newunit];
    }
    unprepareForOperation();
    checkBugStatus('make overlapping reading', 'of witnesses ' +
									 CL.getAllReadingWitnesses(newunit.readings[1]).join(', '));
    showSetVariantsData();
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  /** move an overlapping reading to a different row (same column)*/
  _moveOverlapping = function(unitDetails, targetRow) {
    var unit, scrollOffset;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    _addToUndoStack(CL.data);
    unit = CL.data[unitDetails[1]][unitDetails[0]];
    unit.row = parseInt(targetRow);
    CL.data['apparatus' + targetRow].push(unit);
    CL.data['apparatus' + targetRow].sort(_compareFirstWordIndexes);
    CL.data[unitDetails[1]].splice(unitDetails[0], 1);
    checkBugStatus('move overlapping unit', unitDetails[0] + ' from ' + unitDetails[1] + ' to ' + targetRow + '.');
    showSetVariantsData();
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  //Integrity checks

  //check order integrity in all witnesses
  _checkAllWitnessesIntegrity = function() {
    for (let hand in CL.data.hand_id_map) {
      if (CL.data.hand_id_map.hasOwnProperty(hand)) {
        if (_checkWitnessIntegrity(hand) == false) {
          return false;
        }
      }
    }
    return true;
  };

  //check a single witness in the whole verse
  _checkWitnessIntegrity = function(witness) {
    var index, unit, id, olUnit;
    index = 0;
    for (let i = 0; i < CL.data.apparatus.length; i += 1) {  // step through the top line apparatus
      unit = CL.data.apparatus[i];  // get the current unit
      if (unit.hasOwnProperty('overlap_units') && !unit.overlap_units.hasOwnProperty(id)) {
        for (let key in unit.overlap_units) {
          if (unit.overlap_units.hasOwnProperty(key) && unit.overlap_units[key].indexOf(witness) !== -1) {
            id = key;  // set id to the id of the overlapped unit (anything above this unit will now be ignored)
            olUnit = CL.findOverlapUnitById(key);
            for (let j = 0; j < olUnit.readings.length; j += 1) {
              if (olUnit.readings[j].witnesses.indexOf(witness) !== -1) {
                if (olUnit.readings[j].hasOwnProperty('standoff_subreadings') &&
											olUnit.readings[j].standoff_subreadings.indexOf(witness) !== -1) {
                  for (let type in olUnit.readings[j].subreadings) {
                    for (let k = 0; k < olUnit.readings[j][type].length; k += 1) {
                      if (olUnit.readings[j][type][k].indexOf(witness) !== -1) {
                        for (let l = 0; l < olUnit.readings[j][type][k].text.length; l += 1) {
                          if (olUnit.readings[j][type][k].text[l][witness].index - index === 2) {
                            index = olUnit.readings[j].text[k][witness].index;
                          } else {
                            return false;
                          }
                        }
                      }
                    }
                  }
                } else if (olUnit.readings[j].hasOwnProperty('SR_text') &&
														olUnit.readings[j].SR_text.hasOwnProperty(witness)) {
                  for (let k = 0; k < olUnit.readings[j].SR_text[witness].text.length; k += 1) {
                    if (olUnit.readings[j].SR_text[witness].text[k][witness].index - index === 2) {
                      index = olUnit.readings[j].SR_text[witness].text[k][witness].index;
                    } else {
                      return false;
                    }
                  }
                } else {
                  for (let k = 0; k < olUnit.readings[j].text.length; k += 1) {
                    if (olUnit.readings[j].text[k][witness].index - index === 2) {
                      index = olUnit.readings[j].text[k][witness].index;
                    } else {
                      return false;
                    }
                  }
                }
              }
            }
          }
        }
      }
      // this needs to be a separate if and not in an else because the top loop ultimately only hits the units where
			// the specified witness is overlapped - this one deals with all the rest
      if (!unit.hasOwnProperty('overlap_units') || (unit.hasOwnProperty('overlap_units') &&
						!unit.overlap_units.hasOwnProperty(id))) {
        for (let j = 0; j < unit.readings.length; j += 1) {
          if (unit.readings[j].witnesses.indexOf(witness) !== -1) {
            //check the main reading
            if (unit.readings[j].text.length > 0 && unit.readings[j].text[0].hasOwnProperty(witness)) {
              for (let k = 0; k < unit.readings[j].text.length; k += 1) {
                if (unit.readings[j].text[k][witness].index - index === 2) {
                  index = unit.readings[j].text[k][witness].index;
                } else {
                  return false;
                }
              }
            }
            //TODO:check the subreadings? this will be complex if you can away without it then do!
            //so long as subreadings are always hidden then checking SR_text should be enough
            //check the SR_text
            if (unit.readings[j].hasOwnProperty('SR_text') && unit.readings[j].SR_text.hasOwnProperty(witness)) {
              for (let k = 0; k < unit.readings[j].SR_text[witness].text.length; k += 1) {
                if (unit.readings[j].SR_text[witness].text[k][witness].index - index === 2) {
                  index = unit.readings[j].SR_text[witness].text[k][witness].index;
                } else {
                  return false;
                }
              }
            }
          }
        }
      }
    }
    return true;
  };

  //used for checking the witness order is correct
  _getFirstIndexForWitnesses = function(unit, witnesses) {
    var witnessIndex, wit;
    witnessIndex = {};
    for (let i = 0; i < unit.readings.length; i += 1) {
      for (let j = 0; j < unit.readings[i].witnesses.length; j += 1) {
        wit = unit.readings[i].witnesses[j];
        if (witnesses === undefined || witnesses.indexOf(wit) !== -1) {
          if (unit.readings[i].text.length > 0) {
            if (unit.readings[i].text[0].hasOwnProperty(wit)) {
              //this deals with main readings and visible subreadings
              witnessIndex[wit] = parseInt(unit.readings[i].text[0][wit].index, 10);
            } else {
              //this deals with stuff in SR_text for unshown standoff subreadings
              if (unit.readings[i].hasOwnProperty('SR_text') && unit.readings[i].SR_text.hasOwnProperty(wit)) {
                witnessIndex[wit] = parseInt(unit.readings[i].SR_text[wit].text[0][wit].index, 10);
              }
            }
          } else {
            witnessIndex[wit] = 0;
          }
        }
      }
    }
    return witnessIndex;
  };

  _compareWitnessQueue = function(queue, problems) {
    // if the overlapped witness unit covers the whole verse
    if (queue.length !== 2) {
      return problems;
    }
    for (let key in queue[0]) {
      if (problems.indexOf(key) === -1) {  // if we already know its a problem we can ignore it
        if (queue[0].hasOwnProperty(key)) {
          if (queue[1].hasOwnProperty(key)) {
            if (queue[1][key] !== 0 && queue[0][key] > queue[1][key]) {
              problems.push(key);
            } else if (queue[1][key] === 0) {
              queue[1][key] = queue[0][key];
            }
          }
        }
      }
    }
    problems = CL.setList(problems);
    return problems;
  };

  //witnesses supplied when we move a reading, but not when we move a whole unit
  _checkWordOrderIntegrity = function(originalUnit, newUnit, witnesses) {
    var working, problems, witnessQueue, wit, indexes, start, end, unit;
    problems = [];
    working = false;
    witnessQueue = [];
    start = Math.min(originalUnit, newUnit);
    end = Math.max(originalUnit, newUnit);
    indexes = [];
    for (let i = 0; i < CL.data.apparatus.length; i += 1) {
      unit = CL.data.apparatus[i];
      // capture the unit that is the final location (where words may have been added) for later
			// testing we will send it to check_unit_integrity
      if (unit.end === newUnit || unit.start === newUnit) {
        //this should always be the top line unit not an overlapped one (we will never have altered the overlap one)
        indexes.push(i);
      }
      // check each pair of units in turn between the start unit and the end unit
      // each pair for comparison contains a dictionary with witnesses (supplied or all) as key to
			// first index of witness in that unit
      if (unit.start >= start && working !== true) {
        working = true;
        witnessQueue.push(_getFirstIndexForWitnesses(unit, witnesses));
      } else if (unit.end > end) {
        if (witnessQueue.length === 2) {
          witnessQueue.shift(); //remove first item from list
        }
        witnessQueue.push(_getFirstIndexForWitnesses(unit, witnesses));
        problems = _compareWitnessQueue(witnessQueue, problems);
        break;
      } else if (working === true) {
        if (witnessQueue.length === 2) {
          witnessQueue.shift(); //remove first item from list
        }
        witnessQueue.push(_getFirstIndexForWitnesses(unit, witnesses));
        problems = _compareWitnessQueue(witnessQueue, problems);
      }
    }
    for (let i = 0; i < indexes.length; i += 1) {
      // now check the unit that is the final location because we might have added to it
      problems.push.apply(problems, _checkUnitIntegrity('apparatus', indexes[i]));
    }
    problems = CL.setList(problems);
    // now run through the problems and see if any of the units selected as end units (should only ever be one!) is
    // overlapped (our other rules should provent moving of data that conflicts with overlaps so checking one feels
    // safe)if it is then it removed from the problems list and not reported
    for (let i = 0; i < indexes.length; i += 1) {
      if (CL.data.apparatus[indexes[i]].hasOwnProperty('overlap_units')) {
        for (let key in CL.data.apparatus[indexes[i]].overlap_units) {
          if (CL.data.apparatus[indexes[i]].overlap_units.hasOwnProperty(key)) {
            for (let j = 0; j < CL.data.apparatus[indexes[i]].overlap_units[key].length; j += 1) {
              if (problems.indexOf(CL.data.apparatus[indexes[i]].overlap_units[key][j]) !== -1) {
                problems.splice(problems.indexOf(CL.data.apparatus[indexes[i]].overlap_units[key][j]), 1);
              }
            }
          }
        }
      }
    }
    _watchList.push.apply(_watchList, problems);
    _watchList = CL.setList(_watchList);
    return problems;
  };

  //check every the words of every witness in the given unit are
  //no more than 2 words apart
  _checkUnitIntegrity = function(appId, index) {
    var problems, count, witness, unit;
    problems = [];
    unit = CL.data[appId][index];
    for (let i = 0; i < unit.readings.length; i += 1) {
      if (unit.readings[i].text.length > 0) {
        for (let j = 0; j < unit.readings[i].witnesses.length; j += 1) {
          witness = unit.readings[i].witnesses[j];
          count = null;
          for (let k = 0; k < unit.readings[i].text.length; k += 1) {
            if (unit.readings[i].text[k].hasOwnProperty(witness)) {
              //JS casts strings as ints if it can so this works despite index being a string
							// > in second condition here used to be !== now it allows smaller gaps because of solidified gaps
              if (count !== null && unit.readings[i].text[k][witness].index - count > 2) {
                problems.push(witness);
              } else {
                count = unit.readings[i].text[k][witness].index;
              }
            }
          }
        }
      }
    }
    problems = CL.setList(problems);
    _watchList.push.apply(_watchList, problems);
    _watchList = CL.setList(_watchList);
    return problems;
  };

  /** This is used in preparing for operations to put all offset subreadings back as main readings.
   * This is important because
   * a) we do not want to have to faff with subreadings during combine and split operations
   * b) We cannot just subsume them into parents as with other subreadings because they need to become main readings
	 *    if their unit extent changes.
   * */
  _removeOffsetSubreadings = function() {
    var data, apparatus, unit, readings, parent, appString, subreadingId, rowNum, makeMainIds, makeMainIdsList;
    // need to lose subreadings first as for some reason running find subreadings when they are already found loses
		// witnesses if you fix that bug you can stop running _lose_subreadings first. You always need to find them
    // because the rest of the function works on the basis they are there
    SR.loseSubreadings();
    SR.findSubreadings();
    data = CL.data;
    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        if (key.indexOf('apparatus') !== -1) {
          apparatus = data[key];
          for (let i = 0; i < apparatus.length; i += 1) {
            makeMainIds = {};
            // loop through standoff readings
            for (let type in data.marked_readings) {
              if (data.marked_readings.hasOwnProperty(type)) {
                for (let k = 0; k < data.marked_readings[type].length; k += 1) {
                  if (data.marked_readings[type][k].apparatus === key) {  // if in right apparatus row
                    if (data.marked_readings[type][k].start === apparatus[i].start &&
                      data.marked_readings[type][k].end === apparatus[i].end) {  // if unit extent is correct
											//check position within index point if indicated
                      if (!data.marked_readings[type][k].hasOwnProperty('first_word_index') ||
														data.marked_readings[type][k].first_word_index === apparatus[i].first_word_index) {
                        //we are in the matching unit and all is fine with extents
                        //so we can now make the marked reading a main reading again
                        //loop through readings until we find one that matches the marked parent
                        readings = apparatus[i].readings;
                        //find the parent
                        for (let j = 0; j < readings.length; j += 1) {
                          if (data.marked_readings[type][k].parent_text !== '') {
                            if (CL.extractWitnessText(readings[j], {
                                'app_id': key,
                                'unit_id': apparatus[i]._id
                              }) === data.marked_readings[type][k].parent_text) {
                              parent = readings[j];
                              rowNum = j;
                            }
                          } else {
                            if (readings[j].text.length === 0) {
                              if (!data.marked_readings[type][k].hasOwnProperty('om_details') &&
																		!readings[j].hasOwnProperty('details')) {
                                parent = readings[j];
                                rowNum = j;
                              } else if (readings[j].details === data.marked_readings[type][k].om_details) {
                                parent = readings[j];
                                rowNum = j;
                              }
                            }
                          }
                        }
                        // Because we are calling _find_subreadings at the start we will always have our readings
												// available as subreadings
                        if (parent.hasOwnProperty('subreadings')) {
                          //make it a main reading
                          if (key === 'apparatus') {
                            appString = '';
                          } else {
                            appString = 'app_' + key.replace('apparatus', '') + '_';
                          }
                          for (let sr in readings[rowNum].subreadings) {
                            if (readings[rowNum].subreadings.hasOwnProperty(sr)) {
                              if (sr === type) { //this may need to change if we allow chaining here
                                for (let l = 0; l < readings[rowNum].subreadings[sr].length; l += 1) {
                                  if (readings[rowNum].subreadings[sr][l].witnesses.indexOf(data.marked_readings[type][k].witness) !== -1) {
                                    subreadingId = 'unit_' + i + '_' + appString + 'row_' + rowNum + '_type_' + type + '_subrow_' + l;
                                    if (makeMainIds.hasOwnProperty(subreadingId)) {
                                      makeMainIds[subreadingId].push(data.marked_readings[type][k].witness);
                                    } else {
                                      makeMainIds[subreadingId] = [data.marked_readings[type][k].witness];
                                    }
                                  }
                                }
                              }
                            }
                          }
                        } else {
                          console.log('For some reason we don\'t have any subreadings for the parent we found');
                        }
                      }
                    }
                  }
                }
              }
            }
            if (!$.isEmptyObject(makeMainIds)) {
              makeMainIdsList = [];
              for (let idKey in makeMainIds) {
                makeMainIdsList.push(idKey);
              }
              _makeMainReading(makeMainIdsList, makeMainIds);
            }
          }
        }
      }
    }
  };

  _hasStandoffSubreading = function(reading) {
    if (reading.hasOwnProperty('SR_text') || reading.hasOwnProperty('standoff_subreadings')) {
      return true;
    }
    return false;
  };

  /** takes a subreading and make it into a main reading
   * the interface value is caculated from the text_string value of the subreading so as long as that is correct
   * we should be okay here! */
  _makeMainReading = function(idString, details) {
    var scrollOffset, unitNumber, appId, unit, parentPos, subtype, subreadingPos, parentReading, subreading, options;
    if (Array.isArray(idString)) {
      //this section deals with making things a main reading in the context of removing the offset marked
      //subreadings from the field of play in prepareForOperation()
      //sort by row then type then subrow always working from the bottom to the top
      idString.sort(_subreadingIdSort);
      //send each item on list in turn to CL.makeMainReading(idString, false);
      //false stops the standoff record from being deleted
      for (let i = 0; i < idString.length; i += 1) {
        if (idString[i].indexOf('_app_') === -1) {
          appId = 'apparatus';
          unitNumber = parseInt(idString[i].substring(idString[i].indexOf('unit_') + 5, idString[i].indexOf('_row_')));
        } else {
          unitNumber = parseInt(idString[i].substring(idString[i].indexOf('unit_') + 5, idString[i].indexOf('_app_')));
          appId = 'apparatus' + idString[i].substring(idString[i].indexOf('_app_') + 5, idString[i].indexOf('_row_'));
        }
        unit = CL.data[appId][unitNumber];
        subtype = idString[i].substring(idString[i].indexOf('_type_') + 6, idString[i].indexOf('_subrow_'));
        parentPos = parseInt(idString[i].substring(idString[i].indexOf('_row_') + 5, idString[i].indexOf('_type_')));
        subreadingPos = parseInt(idString[i].substring(idString[i].indexOf('_subrow_') + 8));
        parentReading = unit.readings[parentPos];
        subreading = parentReading.subreadings[subtype][subreadingPos];
        options = {
          'delete_offset': false,
          'witnesses': details[idString[i]]
        };
        CL.makeMainReading(unit, parentReading, subtype, subreadingPos, options);
      }
    } else {
      scrollOffset = [document.getElementById('scroller').scrollLeft,
                      document.getElementById('scroller').scrollTop];
      _addToUndoStack(CL.data);

      if (idString.indexOf('_app_') === -1) {
        appId = 'apparatus';
        unitNumber = parseInt(idString.substring(idString.indexOf('unit_') + 5, idString.indexOf('_row_')));
      } else {
        unitNumber = parseInt(idString.substring(idString.indexOf('unit_') + 5, idString.indexOf('_app_')));
        appId = 'apparatus' + idString.substring(idString.indexOf('_app_') + 5, idString.indexOf('_row_'));
      }
      unit = CL.data[appId][unitNumber];
      subtype = idString.substring(idString.indexOf('_type_') + 6, idString.indexOf('_subrow_'));
      parentPos = parseInt(idString.substring(idString.indexOf('_row_') + 5, idString.indexOf('_type_')));
      subreadingPos = parseInt(idString.substring(idString.indexOf('_subrow_') + 8));
      parentReading = unit.readings[parentPos];
      subreading = parentReading.subreadings[subtype][subreadingPos];
      options = {
        'delete_offset': true
      };
      CL.makeMainReading(unit, parentReading, subtype, subreadingPos, options);
      //Need to prepare for unsplitting but not for make_main_reading
      prepareForOperation();
      unsplitUnitWitnesses(unitNumber, appId);
      unprepareForOperation();
      checkBugStatus('make main reading', idString);
      showSetVariantsData();
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    }
  };

  /* This is used for marking how any duplicate (because of overlapping reading) should be flagged
   * options at the moment are 'deleted' and 'overlapped'*/
  _addReadingFlag = function(readingDetails, flag) {
    var scrollOffset, reading;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    _addToUndoStack(CL.data);
    //now add the flag and set to true
		reading = CL.data[readingDetails[1]][readingDetails[0]].readings[readingDetails[2]];
    reading.overlap_status = flag;
    reading.text = [];
    reading.witnesses = CL.getAllReadingWitnesses(reading);
    delete reading.combined_gap_before_subreadings;
    delete reading.combined_gap_before_subreadings_details;
    delete reading.combined_gap_after_subreadings;
    delete reading.subreadings;
    delete reading.SR_text;
    delete reading.type;
    delete reading.details;
    showSetVariantsData();
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  // needs to be in prepare/unprepare sandwich because of unsplitUnitWitnesses
  _removeReadingFlag = function(readingDetails) {
    var scrollOffset;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    _addToUndoStack(CL.data);
    delete CL.data[readingDetails[1]][readingDetails[0]].readings[readingDetails[2]].overlap_status;
    unsplitUnitWitnesses(readingDetails[0], readingDetails[1]);
    showSetVariantsData();
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  _subreadingIdSort = function(a, b) {
    var rowA, rowB, typeA, typeB, subRowA, subRowB;
    // row first
    rowA = parseInt(a.substring(a.indexOf('_row_') + 5, a.indexOf('_type_')));
    rowB = parseInt(b.substring(b.indexOf('_row_') + 5, b.indexOf('_type_')));
    if (rowA !== rowB) {
      return rowB - rowA;
    }
    // then type
    typeA = a.substring(a.indexOf('_type_') + 6, a.indexOf('_subrow_'));
    typeB = b.substring(b.indexOf('_type_') + 6, b.indexOf('_subrow_'));
    if (typeA !== typeB) {
      return a < b ? -1 : 1;
    }
    // then subrow
    subRowA = parseInt(a.substring(a.indexOf('_subrow_') + 8));
    subRowB = parseInt(b.substring(b.indexOf('_subrow_') + 8));
    if (subRowA !== subRowB) {
      return subRowB - subRowA;
    }
  };

  /** The next three functions are concerned with the context menu and associated event handling */

  /** creates context menu for right clicked on element
   * unit, overlap_unit, subreading and split_duplicate_unit are straight hard coded menus
   * the others are determined from project configuration
   *  */
  _makeMenu = function(menuName) {
    var menu, subreadings, svRules;
    // menus for full units
    if (menuName === 'unit') {
      document.getElementById('context_menu').innerHTML = '<li id="split_words"><span>Split words</span></li><li id="split_readings"><span>Split readings</span></li>';
    } else if (menuName === 'overlap_unit') {
      document.getElementById('context_menu').innerHTML = '<li id="split_readings"><span>Split readings</span></li>';
    } else if (menuName === 'subreading') {
      document.getElementById('context_menu').innerHTML = '<li id="make_main_reading"><span>Make main reading</span></li>';
    } else if (menuName === 'split_duplicate_unit') {
      // used for reading in top line labelled 'duplicate' when the unit is in split readings state
      menu = ['<li id="treat_as_main"><span>Make main reading</span></li>'];
      for (let i = 0; i < CL.overlappedOptions.length; i += 1) {
        menu.push('<li id="' + CL.overlappedOptions[i].id + '"><span>' + CL.overlappedOptions[i].label + '</span></li>');
      }
      document.getElementById('context_menu').innerHTML = menu.join('');
    } else if (menuName === 'split_overlapped_change_unit') {
      menu = [];
      for (let i = 0; i < CL.overlappedOptions.length; i += 1) {
        menu.push('<li id="' + CL.overlappedOptions[i].id + '"><span>' + CL.overlappedOptions[i].label + '</span></li>');
      }
      document.getElementById('context_menu').innerHTML = menu.join('');
    } else {
      menu = [];
      menu.push('<li id="recombine_readings"><span>Recombine</span></li>');
      if (menuName === 'split_unit' || menuName === 'split_unit_a') {
        menu.push('<li id="overlap"><span>Overlap</span></li>');
      }
      if (menuName === 'split_unit' || menuName === 'split_unit_a' || menuName === 'overlap_split_unit') {
        menu.push('<li id="split_witnesses"><span>Split Witnesses</span></li>');
      }

      if (menuName === 'split_unit' || menuName === 'split_omlac_unit' || menuName === 'overlap_split_unit') {
        svRules = CL.getRuleClasses('create_in_SV', true, 'name', ['subreading', 'value', 'identifier', 'keep_as_main_reading']);
        subreadings = [];
        for (let key in svRules) {
          if (svRules.hasOwnProperty(key)) {
            if (svRules[key][3]) {
              menu.push('<li id="mark_as_' + svRules[key][1] + '"><span>Mark/Unmark as ' + key + '</span></li>');
            } else {
              subreadings.push([key, svRules[key][1], svRules[key][2]]);
            }
          }
        }
        if (subreadings.length === 1) {
          if (typeof subreadings[0][2] !== 'undefined') {
            menu.push('<li id="mark_as_' + subreadings[0][1] + '"><span>Mark as ' + subreadings[0][0] + ' (' + subreadings[0][2] + ')</span></li>');
          } else {
            menu.push('<li id="mark_as_' + subreadings[0][1] + '"><span>Mark as ' + subreadings[0][0] + '</span></li>');
          }
        } else if (subreadings.length > 1) {
          menu.push('<li id="mark_as_SVsubreading"><span>Mark as subreading</span></li>');
        }
      }
      document.getElementById('context_menu').innerHTML = menu.join('');
    }
    _addContextMenuHandlers();
    return 'context_menu';
  };

  /**adds events for context menu */
  _addContextMenuHandlers = function() {
    var svRules, key;
    if (document.getElementById('split_words')) {
      $('#split_words').off('click.swd_c');
      $('#split_words').off('mouseover.swd_mo');
      $('#split_words').on('click.swd_c', function(event) {
        var element, div, unitNumber;
        element = SimpleContextMenu._target_element;
        div = CL.getSpecifiedAncestor(element, 'DIV', function(e) {
          if ($(e).hasClass('spanlike')) {
            return false;
          }
          return true;
        });
        unitNumber = div.id.replace('drag_unit_', '');
        _splitUnit(unitNumber);
      });
      $('#split_words').on('mouseover.swd_mo', function(event) {
        CL.hideTooltip();
      });
    }
    if (document.getElementById('split_readings')) {
      $('#split_readings').off('click.sr_c');
      $('#split_readings').off('mouseover.sr_mo');
      $('#split_readings').on('click.sr_c', function(event) {
        var element, div, rdgDetails;
        element = SimpleContextMenu._target_element;
        div = CL.getSpecifiedAncestor(element, 'DIV', function(e) {
          if ($(e).hasClass('spanlike')) {
            return false;
          }
          return true;
        });
        rdgDetails = CL.getUnitAppReading(div.id);
        _splitReadings(rdgDetails);
      });
      $('#split_readings').on('mouseover.sr_mo', function(event) {
        CL.hideTooltip();
      });
    }
    if (document.getElementById('make_main_reading')) {
      $('#make_main_reading').off('click.mmr_c');
      $('#make_main_reading').off('mouseover.mmr_mo');
      $('#make_main_reading').on('click.mmr_c', function(event) {
        var element, li, idString;
        element = SimpleContextMenu._target_element;
        li = CL.getSpecifiedAncestor(element, 'LI');
        idString = li.id.replace('subreading_', '');
        _makeMainReading(idString);
      });
      $('#make_main_reading').on('mouseover.mmr_mo', function(event) {
        CL.hideTooltip();
      });
    }
    if (document.getElementById('recombine_readings')) {
      $('#recombine_readings').off('click.rr_c');
      $('#recombine_readings').off('mouseover.rr_mo');
      $('#recombine_readings').on('click.rr_c', function(event) {
        var element, div, rdgDetails;
        element = SimpleContextMenu._target_element;
        div = CL.getSpecifiedAncestor(element, 'DIV', function(e) {
          if ($(e).hasClass('spanlike')) {
            return false;
          }
          return true;
        });
        rdgDetails = CL.getUnitAppReading(div.id);
        _unsplitReadings(rdgDetails);
      });
      $('#recombine_readings').on('mouseover.rr_mo', function(event) {
        CL.hideTooltip();
      });
    }
    if (document.getElementById('overlap')) {
      $('#overlap').off('click.or_c');
      $('#overlap').off('mouseover.or_mo');
      $('#overlap').on('click.or_c', function(event) {
        var element, div, readingDetails;
        element = SimpleContextMenu._target_element;
        div = CL.getSpecifiedAncestor(element, 'DIV', function(e) {
          if ($(e).hasClass('spanlike')) {
            return false;
          }
          return true;
        });
        readingDetails = CL.getUnitAppReading(div.id);
        _overlapReading(readingDetails[0], readingDetails[2], {
          'top': SimpleContextMenu._menuElement.style.top,
          'left': SimpleContextMenu._menuElement.style.left
        });
      });
      $('#overlap').on('mouseover.or_mo', function(event) {
        CL.hideTooltip();
      });
    }
    if (document.getElementById('split_witnesses')) {
      $('#split_witnesses').off('click.sw_c');
      $('#split_witnesses').off('mouseover.sw_mo');
      $('#split_witnesses').on('click.sw_c', function(event) {
        var element, div, readingDetails;
        element = SimpleContextMenu._target_element;
        div = CL.getSpecifiedAncestor(element, 'DIV', function(e) {
          if ($(e).hasClass('spanlike')) {
            return false;
          }
          return true;
        });
        readingDetails = CL.getUnitAppReading(div.id);
        splitReadingWitnesses(readingDetails, 'set_variants', {
          'top': SimpleContextMenu._menuElement.style.top,
          'left': SimpleContextMenu._menuElement.style.left
        });
      });
      $('#split_witnesses').on('mouseover.sw_mo', function(event) {
        CL.hideTooltip();
      });
    }
    // next if and for deal with overlapped options
    if (document.getElementById('treat_as_main')) {
      $('#treat_as_main').off('click.tam_c');
      $('#treat_as_main').off('mouseover.tam_mo');
      $('#treat_as_main').on('click.tam_c', function(event) {
        var element, div, readingDetails;
        element = SimpleContextMenu._target_element;
        div = CL.getSpecifiedAncestor(element, 'DIV', function(e) {
          if ($(e).hasClass('spanlike')) {
            return false;
          }
          return true;
        });
        readingDetails = CL.getUnitAppReading(div.id);
        prepareForOperation();
        _removeReadingFlag(readingDetails);
        unprepareForOperation();
      });
      $('#treat_as_main').on('mouseover.tam_mo', function(event) {
        CL.hideTooltip();
      });
    }
    for (let i = 0; i < CL.overlappedOptions.length; i += 1) {
      if (document.getElementById(CL.overlappedOptions[i].id)) {
        _addOverlappedEvent(CL.overlappedOptions[i].id, CL.overlappedOptions[i].reading_flag);
      }
    }
    // special added for SV
    svRules = CL.getRuleClasses('create_in_SV', true, 'name',
                                ['subreading', 'value', 'identifier', 'keep_as_main_reading']);
    // this deals with all non-genuine subreadings which will always have their own entry in the context menu
    for (let key in svRules) {
      if (svRules.hasOwnProperty(key)) {
        if (!svRules[key][0]) {
          if (document.getElementById('mark_as_' + svRules[key][1])) {
            // add event decides if its a keep as main reading or not and adds correct handler
            _addEvent(svRules, key);
          }
        }
      }
    }
    // if there is a generic SVsubreading entry in the context menu then we deal with the distinction in a drop down
    if (document.getElementById('mark_as_SVsubreading')) {
      // make menu for mark_as_SVsubreading
      key = 'SVsubreading';
      $('#mark_as_' + key).off('click.' + key + '_c');
      $('#mark_as_' + key).off('mouseover.' + key + '_mo');
      $('#mark_as_' + key).on('click.' + key + '_c', function(event) {
        var element, div, unit, appId, unitPos, rdgDetails, readingPos, reading, readingDetails,
            readingText, tokenList;
        element = SimpleContextMenu._target_element;
        div = CL.getSpecifiedAncestor(element, 'DIV', function(e) {
          if ($(e).hasClass('spanlike')) {
            return false;
          }
          return true;
        });
        rdgDetails = CL.getUnitAppReading(div.id);
        unitPos = rdgDetails[0];
        appId = rdgDetails[1];
        readingPos = rdgDetails[2];
        unit = CL.data[appId][unitPos];
        reading = unit.readings[readingPos];
        readingText = reading.text_string;
        if (readingText === undefined) {
          tokenList = [];
          for (let i = 0; i < reading.text.length; i += 1) {
            tokenList.push(reading.text[i].interface);
          }
          readingText = tokenList.join(' ');
        }
        readingDetails = {
          'app_id': appId,
          'unit_id': unit._id,
          'unit_pos': unitPos,
          'reading_pos': readingPos,
          'reading_id': reading._id,
          'reading_text': readingText
        };
        CL.markStandoffReading(key, 'Subreading', readingDetails, 'set_variants', {
          'top': SimpleContextMenu._menuElement.style.top,
          'left': SimpleContextMenu._menuElement.style.left
        });
      });
      $('#mark_as_' + key).on('mouseover.' + key + '_mo', function(event) {
        CL.hideTooltip();
      });
    } else {
      for (let key in svRules) {
        if (svRules.hasOwnProperty(key)) {
          if (svRules[key][0]) {  // if this is a subreading (hence dealt with as subreading in menu)
            if (document.getElementById('mark_as_' + svRules[key][1])) {
              _addEvent(svRules, key);
            }
          }
        }
      }
    }
  };

  _addOverlappedEvent = function(id, flag) {
    $('#' + id).off('click.' + id + '_c');
    $('#' + id).off('mouseover.' + id + '_mo');
    $('#' + id).on('click.' + id + '_c', function(event) {
      var element, div, readingDetails;
      element = SimpleContextMenu._target_element;
      div = CL.getSpecifiedAncestor(element, 'DIV', function(e) {
        if ($(e).hasClass('spanlike')) {
          return false;
        }
        return true;
      });
      readingDetails = CL.getUnitAppReading(div.id);
      _addReadingFlag(readingDetails, flag);
    });
    $('#' + id).on('mouseover.' + id + '_mo', function(event) {
      CL.hideTooltip();
    });
  };

  /**adds the correct handler depending on subreading and keep_as_main_reading settings in the
	project rule configurations */
  _addEvent = function(svRules, key) {
    //if this reading is not marked to be kept as a main reading then use stand_off marking
    if (!svRules[key][3]) {
      $('#mark_as_' + svRules[key][1]).off('click.' + key + '_c');
      $('#mark_as_' + svRules[key][1]).off('mouseover.' + key + '_mo');
      $('#mark_as_' + svRules[key][1]).on('click.' + key + '_c', function(event) {
        var element, div, rdgDetails, unit, unitPos, readingPos, reading, readingDetails, appId, readingText, tokenList;
        element = SimpleContextMenu._target_element;
        div = CL.getSpecifiedAncestor(element, 'DIV', function(e) {
          if ($(e).hasClass('spanlike')) {
            return false;
          }
          return true;
        });
        rdgDetails = CL.getUnitAppReading(div.id);
        unitPos = rdgDetails[0];
        appId = rdgDetails[1];
        readingPos = rdgDetails[2];
        unit = CL.data[appId][unitPos];
        reading = unit.readings[readingPos];
        readingText = reading.text_string;
        if (readingText === undefined) {
          tokenList = [];
          for (let i = 0; i < reading.text.length; i += 1) {
            tokenList.push(reading.text[i].interface);
          }
          readingText = tokenList.join(' ');
        }
        readingDetails = {
          'app_id': appId,
          'unit_id': unit._id,
          'unit_pos': unitPos,
          'reading_pos': readingPos,
          'reading_id': reading._id,
          'reading_text': readingText
        };
        CL.markStandoffReading(svRules[key][1], key, readingDetails, 'set_variants', {
          'top': SimpleContextMenu._menuElement.style.top,
          'left': SimpleContextMenu._menuElement.style.left
        });
      });
      $('#mark_as_' + svRules[key][1]).on('mouseover.' + key + '_mo', function(event) {
        CL.hideTooltip();
      });
    } else {
      // else just add the marker and allow its removal
      $('#mark_as_' + svRules[key][1]).off('click.' + key + '_c');
      $('#mark_as_' + svRules[key][1]).off('mouseover.' + key + '_mo');
      $('#mark_as_' + svRules[key][1]).on('click.' + key + '_c', function(event) {
        var element, div, rdgDetails, readingPos, reading, appId, unitPos;
        element = SimpleContextMenu._target_element;
        div = CL.getSpecifiedAncestor(element, 'DIV', function(e) {
          if ($(e).hasClass('spanlike')) {
            return false;
          }
          return true;
        });
        rdgDetails = CL.getUnitAppReading(div.id);
        unitPos = rdgDetails[0];
        appId = rdgDetails[1];
        readingPos = rdgDetails[2];
        reading = CL.data[appId][unitPos].readings[readingPos];
        _markReading(svRules[key][1], reading);
      });
      $('#mark_as_' + svRules[key][1]).on('mouseover.' + key + '_mo', function(event) {
        CL.hideTooltip();
      });
    }
  };

  _markReading = function(value, reading) {
    var scrollOffset;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    CL.markReading(value, reading);
    showSetVariantsData();
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  /** next two functions allow undo operation. */

  /** Length of undo stack is determined by SV.undoStackLength variable.
   * The default can be overwritten by the services (but not by projects)
   * Not all operations lead to a new entry on the stack only those that really
   * change the object so split readings and recombine readings for example
   * don't get added to the stack. Functions that are considered important enough to
   * be undone call _addToUndoStack before making the object changes.*/
  _addToUndoStack = function(data) {
    if (SV.undoStack.length === SV.undoStackLength) {
      SV.undoStack.shift();
    }
    SV.undoStack.push(JSON.stringify(data));
  };

  _undo = function() {
    var eventList, scrollOffset;
    if (SV.undoStack.length > 0) {
      scrollOffset = [document.getElementById('scroller').scrollLeft,
                      document.getElementById('scroller').scrollTop];
      eventList = CL.data.event_list;
      CL.data = JSON.parse(SV.undoStack.pop());
      CL.data.event_list = eventList;
      _removeSplits();
      SR.loseSubreadings();
      if (CL.showSubreadings === true) {
        SR.findSubreadings();
      }
      checkBugStatus('undo', 'last action recorded');
      showSetVariantsData();
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    }
  };

  _removeSplits = function() {
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key) && key.indexOf('apparatus') !== -1) {
        for (let i = 0; i < CL.data[key].length; i += 1) {
          if (CL.data[key][i].hasOwnProperty('split_readings')) {
            delete CL.data[key][i].split_readings;
            // this is only called if they are split at the time this function is called
            unsplitUnitWitnesses(i, key);
          }
        }
      }
    }
  };

  _checkTAndNPresence = function() {
    for (let i = 0; i < CL.data.apparatus.length; i += 1) {
      for (let j = 0; j < CL.data.apparatus[i].readings.length; j += 1) {
        if (CL.data.apparatus[i].readings[j].hasOwnProperty('subreadings')) {
          for (let key in CL.data.apparatus[i].readings[j].subreadings) {
            for (let k = 0; k < CL.data.apparatus[i].readings[j].subreadings[key].length; k += 1) {
              for (let l = 0; l < CL.data.apparatus[i].readings[j].subreadings[key][l]; l += 1) {
                for (let m = 0; m < CL.data.apparatus[i].readings[j].subreadings[key][l].text.length; m += 1) {
                  if (CL.data.apparatus[i].readings[j].subreadings[key][l].text[m].hasOwnProperty('t')) {
                    return [true, 'there is a rogue t in word ' + m + ' in subreading ' + l + ' of the ' + key +
                      ' subreadings of reading ' + j + ' of apparatus unit ' + i
                    ];
                  }
                  if (CL.data.apparatus[i].readings[j].subreadings[key][l].text[m].hasOwnProperty('n')) {
                    return [true, 'there is a rogue n in word ' + m + ' in subreading ' + l + ' of the ' + key +
                      ' subreadings of reading ' + j + ' of apparatus unit ' + i
                    ];
                  }
                }
              }
            }
          }
        }
        for (let k = 0; k < CL.data.apparatus[i].readings[j].text.length; k += 1) {
          if (CL.data.apparatus[i].readings[j].text[k].hasOwnProperty('t')) {
            return [true, 'there is a rogue t in word ' + k + ' in reading ' + j + ' of apparatus unit ' + i];
          }
          if (CL.data.apparatus[i].readings[j].text[k].hasOwnProperty('n')) {
            return [true, 'there is a rogue n in word ' + k + ' in reading ' + j + ' of apparatus unit ' + i];
          }
        }
      }
    }
    return [false];
  };

  _checkForStandoffReading = function(witness, unit) {
    if (CL.data.hasOwnProperty('marked_readings')) {
      for (let type in CL.data.marked_readings) {
        if (CL.data.marked_readings.hasOwnProperty(type)) {
          for (let i = 0; i < CL.data.marked_readings[type].length; i += 1) {
            if (CL.data.marked_readings[type][i].start === unit.start &&
										CL.data.marked_readings[type][i].end === unit.end) {
              if (CL.data.marked_readings[type][i].witness === witness) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  };

  _checkSiglaProblems = function() {
    var unit, reading;
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.match(/apparatus\d*/g) !== null) {
          for (let i = 0; i < CL.data[key].length; i += 1) {
            unit = CL.data[key][i];
            for (let j = 0; j < unit.readings.length; j += 1) {
              reading = unit.readings[j];
              for (let k = 0; k < reading.text.length; k += 1) {
                if (reading.text[k].hasOwnProperty('siglum')) {
                  return [true, 'word ' + k + ' in reading ' + j + ' in ' + key + ' in unit ' + i +
													'has been given a siglum list'];
                }
              }
            }
          }
        }
      }
    }
    return [false];
  };

  /** a method for finding and maybe reporting bugs with combining and splitting */
  _checkIndexesPresent = function() {
    var unit, reading, word;
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.match(/apparatus\d*/g) !== null) {
          for (let i = 0; i < CL.data[key].length; i += 1) {
            unit = CL.data[key][i];
            for (let j = 0; j < unit.readings.length; j += 1) {
              reading = unit.readings[j];
              for (let k = 0; k < reading.text.length; k += 1) {
                word = reading.text[k];
                if (!word.hasOwnProperty('index') || typeof word.index === 'undefined') {
                  return [true, 'error with word ' + k + ' in reading ' + j + ' in ' + key + ' in unit ' + i];
                }
              }
            }
          }
        }
      }
    }
    return [false];
  };

  _checkUniqueWitnesses = function() {
    var unit, reading, word, witCheck;
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.match(/apparatus\d*/g) !== null) {
          for (let i = 0; i < CL.data[key].length; i += 1) {
            unit = CL.data[key][i];
            witCheck = [];
            for (let j = 0; j < unit.readings.length; j += 1) {
              reading = unit.readings[j];
              for (let k = 0; k < reading.witnesses.length; k += 1) {
                if (witCheck.indexOf(reading.witnesses[k]) === -1) {
                  witCheck.push(reading.witnesses[k]);
                } else {
                  return [true, 'witnesses ' + reading.witnesses[k] + 'dupicated in  ' + key + ' in unit ' + i];
                }
              }
            }
          }
        }
      }
    }
    return [false];
  };

  _getAllUnitWitnesses = function(unit) {
    var witnesses;
    witnesses = [];
    for (let i = 0; i < unit.readings.length; i += 1) {
      witnesses.push.apply(witnesses, CL.getAllReadingWitnesses(unit.readings[i]));
    }
    return witnesses;
  };

  _compareIndexStrings = function(a, b) {
    var aMain, bMain, aSub, bSub;
    if (a.indexOf('.') !== -1) {
      aMain = parseInt(a.split('.')[0]);
      aSub = parseInt(a.split('.')[1]);
    } else {
      aMain = parseInt(a);
      aSub = 0;
    }
    if (b.indexOf('.') !== -1) {
      bMain = parseInt(b.split('.')[0]);
      bSub = parseInt(b.split('.')[1]);
    } else {
      bMain = parseInt(b);
      bSub = 0;
    }
    if (aMain < bMain) {
      return -1;
    }
    if (aMain > bMain) {
      return 1;
    }
    if (aSub < bSub) {
      return -1;
    }
    if (aSub > bSub) {
      return 1;
    }
    return 0;
  };

  _compareIndexes = function(a, b) {
    var aMain, bMain, aSub, bSub;
    if (typeof a.index === 'undefined' || typeof b.index === 'undefined') {
      return 0;
    }
    if (a.index.indexOf('.') !== -1) {
      aMain = parseInt(a.index.split('.')[0]);
      aSub = parseInt(a.index.split('.')[1]);
    } else {
      aMain = parseInt(a.index);
      aSub = 0;
    }
    if (b.index.indexOf('.') !== -1) {
      bMain = parseInt(b.index.split('.')[0]);
      bSub = parseInt(b.index.split('.')[1]);
    } else {
      bMain = parseInt(b.index);
      bSub = 0;
    }
    if (aMain < bMain) {
      return -1;
    }
    if (aMain > bMain) {
      return 1;
    }
    if (aSub < bSub) {
      return -1;
    }
    if (aSub > bSub) {
      return 1;
    }
    return 0;
  };

  _compareFirstWordIndexes = function(a, b) {
    var aMain, bMain, aSub, bSub;
    if (typeof a.first_word_index === 'undefined' || typeof b.first_word_index === 'undefined') {
      return 0;
    }
    if (a.first_word_index.indexOf('.') !== -1) {
      aMain = parseInt(a.first_word_index.split('.')[0]);
      aSub = parseInt(a.first_word_index.split('.')[1]);
    } else {
      aMain = parseInt(a.first_word_index);
      aSub = 0;
    }
    if (b.first_word_index.indexOf('.') !== -1) {
      bMain = parseInt(b.first_word_index.split('.')[0]);
      bSub = parseInt(b.first_word_index.split('.')[1]);
    } else {
      bMain = parseInt(b.first_word_index);
      bSub = 0;
    }
    if (aMain < bMain) {
      return -1;
    }
    if (aMain > bMain) {
      return 1;
    }
    if (aSub < bSub) {
      return -1;
    }
    if (aSub > bSub) {
      return 1;
    }
    return 0;
  };

	//TODO: we don't actually use this now but it might form the basis of being able to recombined overlapped readings with the top row
	/** merge two overlapping readings from the same column or merge an overlapped back into the main reading*/
	_mergeOverlaps = function(units, rd) {
		var i, j, k, unit1, unit2, text_string, target, counter, errorMess, scrollOffset;
		scrollOffset = [document.getElementById('scroller').scrollLeft,
			              document.getElementById('scroller').scrollTop];
		unit1 = CL.data[units[0][1]][units[0][0]];
		unit2 = CL.data[units[1][1]][units[1][0]];
		_addToUndoStack(CL.data);
		//if we are merging back in with the top apparatus
		//TODO: do these extract witness text calls need the unit_id?
		if (units[0][1] === 'apparatus') {
			for (i = 1; i < unit2.readings.length; i += 1) {
				text_string = CL.extractWitnessText(unit2.readings[i]);
				for (j = 0; j < unit1.readings.length; j += 1) {
					if (CL.extractWitnessText(unit1.readings[j]) === text_string) {
						for (k = 0; k < unit1.readings[j].witnesses.length; k += 1) {
							if (unit2.readings[i].witnesses.indexOf(unit1.readings[j].witnesses[k]) !== -1) {
								delete unit1.readings[j].overlap;
								unit2.readings[i].witnesses.splice(unit2.readings[i].witnesses.indexOf(unit1.readings[j].witnesses[k]), 1, null);
							}
						}
						CL.removeNullItems(unit2.readings[i].witnesses);
						if (unit2.readings[i].witnesses.length === 0) {
							unit2.readings.splice(i, 1, null);
						}
					}
				}
			}
			CL.removeNullItems(unit2.readings);
			if (unit2.readings.length === 1) {
				CL.data[units[1][1]].splice(units[1][0], 1);
			} else {
				warningMess = 'WARNING: Not all readings could be merged';
				unsplitUnitWitnesses(units[0][0], units[0][1]);
				checkBugStatus('merge overlap', 'merge unit ' + units[1][0] + ' from ' + units[1][1] + ' into unit ' + units[0][0] + ' in ' + units[0][1] + '.');
				showSetVariantsData({
					'message': {
						'type': 'warning',
						'message': warningMess
					}
				});
				document.getElementById('scroller').scrollLeft = scrollOffset[0];
				document.getElementById('scroller').scrollTop = scrollOffset[1];
			}
		} else {
			//just shove it in the reading and let unsplit_unit_witnesses sort out the mess left behind!
			for (i = 1; i < unit2.readings.length; i += 1) {
				unit1.readings.push(unit2.readings[i]);
			}
			//delete the one you moved
			CL.data[units[1][1]].splice(units[1][0], 1);
		}
		unsplitUnitWitnesses(units[0][0], units[0][1]);
		checkBugStatus('merge overlap', 'merge unit ' + units[1][0] + ' from ' + units[1][1] + ' into unit ' + units[0][0] + ' in ' + units[0][1] + '.');
		showSetVariantsData();
		document.getElementById('scroller').scrollLeft = scrollOffset[0];
		document.getElementById('scroller').scrollTop = scrollOffset[1];
	};


  if (testing) {
    return {
      undoStack: undoStack,
      messagePosLeft: messagePosLeft,
      showSharedUnits: showSharedUnits,

      showSetVariantsData: showSetVariantsData,
      showSetVariants: showSetVariants,
      calculateUnitLengths: calculateUnitLengths,
      getUnitData: getUnitData,
      getSpacerUnitData: getSpacerUnitData,
      getEmptySpacerCell: getEmptySpacerCell,
      reindexUnit: reindexUnit,
      checkCombinedGapFlags: checkCombinedGapFlags,
      separateOverlapWitnesses: separateOverlapWitnesses,
      doSplitReadingWitnesses: doSplitReadingWitnesses,
      doSeperateOverlapWitnesses: doSeperateOverlapWitnesses,
      unsplitUnitWitnesses: unsplitUnitWitnesses,
      splitReadingWitnesses: splitReadingWitnesses,
      prepareForOperation: prepareForOperation,
      unprepareForOperation: unprepareForOperation,
      makeStandoffReading: makeStandoffReading,
      checkIds: checkIds,
      checkBugStatus: checkBugStatus,
      checkStandoffReadingProblems: checkStandoffReadingProblems,
      areAllUnitsComplete: areAllUnitsComplete,
      undoStackLength: undoStackLength,

      //TODO: properly make this public!
      _combineReadings: _combineReadings,
      _compareFirstWordIndexes: _compareFirstWordIndexes,

      //private variables
      _watchList: _watchList,
      _selectedVariantUnits: _selectedVariantUnits,
      _messageExpanded: _messageExpanded,

      //private functions
      _moveToReorder: _moveToReorder,
      _setupMessage: _setupMessage,
      _highlightWitness: _highlightWitness,
      _showSubreadings: _showSubreadings,
      _redipsInitSV: _redipsInitSV,
      _reindexMovedReading: _reindexMovedReading,
      _indexLessThan: _indexLessThan,
      _indexLessThanOrEqualTo: _indexLessThanOrEqualTo,
      _incrementSubIndex: _incrementSubIndex,
      _decrementSubIndex: _decrementSubIndex,
      _incrementMainIndex: _incrementMainIndex,
      _decrementMainIndex: _decrementMainIndex,
      _reindexReadings: _reindexReadings,
      _checkAndFixIndexOrder: _checkAndFixIndexOrder,
      _checkAndFixReadingIndexes: _checkAndFixReadingIndexes,
      _splitReadings: _splitReadings,
      _unsplitReadings: _unsplitReadings,
      _removeWitnessFromTokens: _removeWitnessFromTokens,
      _removeWitnessFromReading: _removeWitnessFromReading,
      _removeSeparatedWitnessData: _removeSeparatedWitnessData,
      _getOverlappedWitnessesForUnit: _getOverlappedWitnessesForUnit,
      _doMoveWholeUnit: _doMoveWholeUnit,
      _targetHasOverlapConflict: _targetHasOverlapConflict,
      _sourceHasOverlapConflict: _sourceHasOverlapConflict,
      _allOverlapsMatch: _allOverlapsMatch,
      _neighboursShareOverlaps: _neighboursShareOverlaps,
      _doMoveSingleReading: _doMoveSingleReading,
      _unitAtLocation: _unitAtLocation,
      _getOverlapDetailsForGap: _getOverlapDetailsForGap,
      _getOverlappedWitnessesForGap: _getOverlappedWitnessesForGap,
      _moveUnit: _moveUnit,
      _checkWitnessEquality: _checkWitnessEquality,
      _getLowestIndex: _getLowestIndex,
      _doCombineUnits: _doCombineUnits,
      _checkOverlapBoundaries: _checkOverlapBoundaries,
      _checkSpecialOverlapStatusAgreement: _checkSpecialOverlapStatusAgreement,
      _checkOverlapStatusAgreement: _checkOverlapStatusAgreement,
      _getObjectKeys: _getObjectKeys,
      _getGapDetails: _getGapDetails,
      _isSubsetOf: _isSubsetOf,
      _specialCombineReadings: _specialCombineReadings,
      _doSpecialCombineUnits: _doSpecialCombineUnits,
      _combineUnits: _combineUnits,
      _combineApparatusIds: _combineApparatusIds,
      _findApparatusPositionsByOverlapId: _findApparatusPositionsByOverlapId,
      _moveReading: _moveReading,
      _areAdjacent: _areAdjacent,
      _neighboursShareAllOverlaps: _neighboursShareAllOverlaps,
      _getOverlappedIds: _getOverlappedIds,
      _getReplacementOmReading: _getReplacementOmReading,
      _fixIndexNumbers: _fixIndexNumbers,
      _orderUnitText: _orderUnitText,
      _combineReadingText: _combineReadingText,
      _addTypeAndDetails: _addTypeAndDetails,
      _combineWords: _combineWords,
      _separateIndividualOverlapWitnesses: _separateIndividualOverlapWitnesses,
      _doSplitUnit: _doSplitUnit,
      _splitUnit: _splitUnit,
      _tidyUnits: _tidyUnits,
      _checkUnitUniqueness: _checkUnitUniqueness,
      _getPosInUnitSet: _getPosInUnitSet,
      _overlapReading: _overlapReading,
      _makeOverlappingReading: _makeOverlappingReading,
      _moveOverlapping: _moveOverlapping,
      _mergeOverlaps: _mergeOverlaps,
      _checkAllWitnessesIntegrity: _checkAllWitnessesIntegrity,
      _checkWitnessIntegrity: _checkWitnessIntegrity,
      _getFirstIndexForWitnesses: _getFirstIndexForWitnesses,
      _compareWitnessQueue: _compareWitnessQueue,
      _checkWordOrderIntegrity: _checkWordOrderIntegrity,
      _checkUnitIntegrity: _checkUnitIntegrity,
      _removeOffsetSubreadings: _removeOffsetSubreadings,
      _hasStandoffSubreading: _hasStandoffSubreading,
      _makeMainReading: _makeMainReading,
      _addReadingFlag: _addReadingFlag,
      // _removeReadingFlag: _removeReadingFlag,
      _subreadingIdSort: _subreadingIdSort,
      _makeMenu: _makeMenu,
      _addContextMenuHandlers: _addContextMenuHandlers,
      _addOverlappedEvent: _addOverlappedEvent,
      _addEvent: _addEvent,
      _markReading: _markReading,
      _addToUndoStack: _addToUndoStack,
      _undo: _undo,
      _removeSplits: _removeSplits,
      _checkTAndNPresence: _checkTAndNPresence,
      _checkForStandoffReading: _checkForStandoffReading,
      _checkSiglaProblems: _checkSiglaProblems,
      _checkIndexesPresent: _checkIndexesPresent,
      _checkUniqueWitnesses: _checkUniqueWitnesses,
      _getAllUnitWitnesses: _getAllUnitWitnesses,
      _compareIndexStrings: _compareIndexStrings,
      _compareIndexes: _compareIndexes,
      _setUpSVRemoveWitnessesForm: _setUpSVRemoveWitnessesForm,
      _highlightAddedWitness: _highlightAddedWitness,

    };
  } else {
    return {

      undoStack: undoStack,
      messagePosLeft: messagePosLeft,
      showSharedUnits: showSharedUnits,

      showSetVariantsData: showSetVariantsData,
      showSetVariants: showSetVariants,
      calculateUnitLengths: calculateUnitLengths,
      getUnitData: getUnitData,
      getSpacerUnitData: getSpacerUnitData,
      getEmptySpacerCell: getEmptySpacerCell,
      reindexUnit: reindexUnit,
      checkCombinedGapFlags: checkCombinedGapFlags,
      separateOverlapWitnesses: separateOverlapWitnesses,
      doSplitReadingWitnesses: doSplitReadingWitnesses,
      doSeperateOverlapWitnesses: doSeperateOverlapWitnesses,
      unsplitUnitWitnesses: unsplitUnitWitnesses,
      splitReadingWitnesses: splitReadingWitnesses,
      prepareForOperation: prepareForOperation,
      unprepareForOperation: unprepareForOperation,
      makeStandoffReading: makeStandoffReading,
      checkIds: checkIds,
      checkBugStatus: checkBugStatus,
      checkStandoffReadingProblems: checkStandoffReadingProblems,
      areAllUnitsComplete: areAllUnitsComplete,
      undoStackLength: undoStackLength,


      //TODO: properly make this public!
      _combineReadings: _combineReadings,
      _compareFirstWordIndexes: _compareFirstWordIndexes,


    };
  }
}());
