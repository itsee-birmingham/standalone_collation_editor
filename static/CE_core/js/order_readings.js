/*jshint esversion: 6 */
var testing;
OR = (function() {
  "use strict";

  // public variable declarations
  let undoStack = [];

  // private variable declarations
  let _undoStackLength = 6;

  // public function declarations
  let showOrderReadings, showApprovedVersion, getUnitData, relabelReadings, reorderRows, editLabel,
      addLabels, makeStandoffReading, removeSplits, mergeSharedExtentOverlaps, mergeSharedOverlapReadings,
      canUnitMoveTo, addToUndoStack, makeWasGapWordsGaps, mergeAllLacs, mergeAllOms, redipsInitOrderReadings;

  // private function declarations
  let _uniqueifyIds, _approveVerse, _getSiglaSuffixes, _doGetSiglaSuffixes, _getMainReadingSpecialClasses,
      _orderWitnessesForOutput, _areAllEmptyReadings, _getSubunitData,
      _manualChangeLabel, _highlightWitness, _makeMenu, _makeMainReading, _getDeleteUnit,
      _moveOverlapUp, _compareStartIndexes, _moveOverlapDown, _addContextMenuHandlers,
      _addEvent, _markReading, _sortArrayByIndexes,
      _getApparatusForContext, _compareOverlaps, _throughNumberApps, _repositionOverlaps,
      _getPotentialConflicts, _unitCanMoveTo, _findLeadUnit, _deleteUnit, _undo,
      _findOverlapApparatusAndUnitById, _horizontalCombineOverlaps,
      _mergeAllSuppliedEmptyReadings;

  //*********  public functions *********

  /**create and show the reorder readings display
   *
   * optional:
   * container - the HTML element to put the html result in
   *              (defaults to body if not supplied or can't find it)
   * options - a dict containing other options
   * 		 possibilities are:
   *              	highlighted_wit - the witness to highlight in display*/
  showOrderReadings = function(options) {
    var html, highestUnit, header, row, overlaps, appIds, footerHtml, num, temp, eventRows,
        overlapOptions, newOverlapOptions, container, undoButton, showHideSubreadingsButtonText;
    console.log(JSON.parse(JSON.stringify(CL.data)));
    CL.stage = 'ordered';
    addLabels(false);

    if (typeof options === 'undefined') {
      options = {};
    }
    //make sure we have a container to put things in
    if (!options.hasOwnProperty('container') || options.container === null) {
      container = document.getElementsByTagName('body')[0];
    } else {
      container = options.container;
    }
    //sort out options and get layout
    if (!options.hasOwnProperty('highlighted_wit') && CL.highlighted !== 'none') {
      options.highlighted_wit = CL.highlighted;
    }
    //attach right click menus
    SimpleContextMenu.setup({
      'preventDefault': true,
      'preventForms': false
    });
    SimpleContextMenu.attach('main_reading', function() {
      return _makeMenu('main_reading');
    });
    SimpleContextMenu.attach('deletable', function() {
      return _makeMenu('deletable_unit');
    });
    SimpleContextMenu.attach('overlap_main_reading', function() {
      return _makeMenu('overlap_main_reading');
    });
    SimpleContextMenu.attach('subreading', function() {
      return _makeMenu('subreading');
    });
    SimpleContextMenu.attach('overlap_unit', function() {
      return _makeMenu('overlap_unit');
    });
    SimpleContextMenu.attach('reading_label', function() {
      return _makeMenu('reading_label');
    });
    temp = CL.getUnitLayout(CL.data.apparatus, 1, 'reorder', options);
    header = CL.getCollationHeader(CL.data, temp[1], false);
    html = header[0];
    highestUnit = header[1];
    html.push.apply(html, temp[0]);
    overlapOptions = {'column_lengths': temp[1]};
    if (options.hasOwnProperty('highlighted_wit')) {
      overlapOptions.highlighted_wit = options.highlighted_wit;
    }
    if (options.hasOwnProperty('highlighted_unit')) {
      overlapOptions.highlighted_unit = options.highlighted_unit;
    }
    appIds = CL.getOrderedAppLines();
    for (let i = 0; i < appIds.length; i += 1) {
      num = appIds[i].replace('apparatus', '');
      newOverlapOptions = SV.calculateUnitLengths(appIds[i], overlapOptions);
      overlaps = CL.getOverlapLayout(CL.data[appIds[i]], num, 'reorder', header[1], newOverlapOptions);
      html.push.apply(html, overlaps[0]);
      temp[2].push.apply(temp[2], overlaps[1]);
    }
    html.push('<ul id="context_menu" class="SimpleContextMenu"></ul>');
    document.getElementById('header').innerHTML = CL.getHeaderHtml('Order Readings', CL.context);
    if (CL.services.hasOwnProperty('showLoginStatus')) {
      CL.services.showLoginStatus();
    }
    document.getElementById('header').className = 'reorder_header';
    container.innerHTML = '<div id="scroller" class="fillPage"><table class="collation_overview">' +
      html.join('') + '</table></div><div id="single_witness_reading"></div>';
    CL.expandFillPageClients();
    if (OR.undoStack.length > 0) {
      undoButton = '<button class="pure-button right_foot" id="undo_button">undo</button>';
    } else {
      undoButton = '';
    }
    //sort out footer stuff
    if (CL.showSubreadings === true) {
      showHideSubreadingsButtonText = 'hide non-edition subreadings';
    } else {
      showHideSubreadingsButtonText = 'show non-edition subreadings';
    }
    footerHtml = [];
    if (CL.project.hasOwnProperty('showCollapseAllUnitsButton') && CL.project.showCollapseAllUnitsButton === true) {
      footerHtml.push('<button class="pure-button left_foot" id="expand_collapse_button">collapse all</button>');
    }
    footerHtml.push('<button class="pure-button left_foot" id="show_hide_subreadings_button">' +
                    showHideSubreadingsButtonText + '</button>');
    footerHtml.push('<span id="extra_buttons"></span>');
    footerHtml.push('<span id="stage_links"></span>');

    if (CL.managingEditor === true) {
      footerHtml.push('<button class="pure-button right_foot" id="approve">Approve</button>');
    }
    footerHtml.push('<button class="pure-button right_foot" id="save">Save</button>');
    footerHtml.push('<select class="right_foot" id="highlighted" name="highlighted"></select>');
    footerHtml.push(undoButton);
    // this does the styling of the select elements in the footer using pure (they cannot be styled individually)
    $('#footer').addClass('pure-form');
    document.getElementById('footer').innerHTML = footerHtml.join('');
    CL.addExtraFooterButtons('ordered');
    CL.addStageLinks();
    spinner.removeLoadingOverlay();
    CL.addTriangleFunctions('table');
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
    $('#highlighted').on('change', function(event) {
      _highlightWitness(event.target.value);
    });
    if (document.getElementById('save')) {
      $('#save').on('click', function(event) {
        CL.saveCollation('ordered');
      });
    }
    CL.addSubreadingEvents('reorder', CL.getRuleClasses('subreading', true, 'value', ['identifier', 'subreading']));
    if (document.getElementById('approve')) {
      $('#approve').on('click', function() {
        _approveVerse();
      });
    }
    for (let i = 0; i < highestUnit; i += 1) {
      if (document.getElementById('drag_unit_' + i) !== null) {
        redipsInitOrderReadings('drag_unit_' + i);
      }
    }
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.match(/apparatus\d/g) !== null) {
          for (let i = 0; i < CL.data[key].length; i += 1) {
            if (document.getElementById('drag_unit_' + i + '_app_' + key.replace('apparatus', '')) !== null) {
              redipsInitOrderReadings('drag_unit_' + i + '_app_' + key.replace('apparatus', ''));
            }
          }
        }
      }
    }
    if (document.getElementById('undo_button')) {
      $('#undo_button').on('click', function(event) {
        spinner.showLoadingOverlay();
        _undo();
      });
    }
    CL.makeVerseLinks();
    eventRows = temp[2];
    for (let i = 0; i < eventRows.length; i += 1) {
      row = document.getElementById(eventRows[i]);
      if (row !== null) {
        CL.addHoverEvents(row);
      }
    }
    SV.checkBugStatus('loaded order readings');
  };

  showApprovedVersion = function(options) {
    var html, highestUnit, header, row, overlaps, appIds, footerHtml, num, temp, eventRows,
        overlapOptions, newOverlapOptions, container, showHideSubreadingsButtonText;
    if (typeof options === 'undefined') {
      options = {};
    }
    CL.stage = 'approved';
    //make sure we have a container to put things in
    if (!options.hasOwnProperty('container') || options.container === null) {
      container = document.getElementsByTagName('body')[0];
    } else {
      container = options.container;
    }
    //sort out options and get layout
    if (!options.hasOwnProperty('highlighted_wit') && CL.highlighted !== 'none') {
      options.highlighted_wit = CL.highlighted;
    }
    temp = CL.getUnitLayout(CL.data.apparatus, 1, 'approved', options);
    header = CL.getCollationHeader(CL.data, temp[1], false);
    html = header[0];
    highestUnit = header[1];
    html.push.apply(html, temp[0]);
    overlapOptions = {'column_lengths': temp[1]};
    if (options.hasOwnProperty('highlighted_wit')) {
      overlapOptions.highlighted_wit = options.highlighted_wit;
    }
    if (options.hasOwnProperty('highlighted_unit')) {
      overlapOptions.highlighted_unit = options.highlighted_unit;
    }
    appIds = CL.getOrderedAppLines();
    for (let i = 0; i < appIds.length; i += 1) {
      num = appIds[i].replace('apparatus', '');
      newOverlapOptions = SV.calculateUnitLengths(appIds[i], overlapOptions);
      overlaps = CL.getOverlapLayout(CL.data[appIds[i]], num, 'reorder', header[1], newOverlapOptions);
      html.push.apply(html, overlaps[0]);
      temp[2].push.apply(temp[2], overlaps[1]);
    }
    document.getElementById('header').innerHTML = CL.getHeaderHtml('Approved', CL.context);
    if (CL.services.hasOwnProperty('showLoginStatus')) {
      CL.services.showLoginStatus();
    }
    document.getElementById('header').className = 'approved_header';
    container.innerHTML = '<div id="scroller" class="fillPage"><table class="collation_overview">' +
      html.join('') + '</table></div><div id="single_witness_reading"></div>';
    CL.expandFillPageClients();
    // sort out footer stuff
    if (CL.showSubreadings === true) {
      showHideSubreadingsButtonText = 'hide non-edition subreadings';
    } else {
      showHideSubreadingsButtonText = 'show non-edition subreadings';
    }
    footerHtml = [];
    if (CL.project.hasOwnProperty('showCollapseAllUnitsButton') && CL.project.showCollapseAllUnitsButton === true) {
      footerHtml.push('<button class="pure-button left_foot" id="expand_collapse_button">collapse all</button>');
    }
    footerHtml.push('<button class="pure-button left_foot" id="show_hide_subreadings_button">' +
                    showHideSubreadingsButtonText + '</button>');
    footerHtml.push('<span id="extra_buttons"></span>');
    footerHtml.push('<span id="stage_links"></span>');
    if (CL.project.showGetApparatusButton === true) {
      footerHtml.push('<button class="pure-button right_foot" id="get_apparatus">Get apparatus</button>');
    }
    footerHtml.push('<select class="right_foot" id="highlighted" name="highlighted"></select>');
    document.getElementById('footer').innerHTML = footerHtml.join('');
    CL.addExtraFooterButtons('approved');
    CL.addStageLinks();
    spinner.removeLoadingOverlay();
    CL.addTriangleFunctions('table');
    cforms.populateSelect(CL.getHandsAndSigla(),
      document.getElementById('highlighted'), {
        'value_key': 'document',
        'text_keys': 'hand',
        'selected': options.highlighted_wit,
        'add_select': true,
        'select_label_details': {
          'label': 'highlight witness',
          'value': 'none'
        }
      });
    $('#highlighted').on('change', function(event) {
      _highlightWitness(event.target.value, 'approved');
    });
    CL.addSubreadingEvents('approved', CL.getRuleClasses('subreading', true, 'value', ['identifier', 'subreading']));
    if (document.getElementById('get_apparatus')) {
      $('#get_apparatus').off('click.download_link');
      $('#get_apparatus').on('click.download_link', function() {
        _getApparatusForContext();
      });
    }
    CL.makeVerseLinks();
    eventRows = temp[2];
    for (let i = 0; i < eventRows.length; i += 1) {
      row = document.getElementById(eventRows[i]);
      CL.addHoverEvents(row);
    }
  };

  getUnitData = function(data, id, start, end, options) {
    var html, rows, cells, rowList, temp, events, rowId, type, overlapped, hasContextMenu,
        colspan, hand, orRules, readingLabel, readingSuffix, text, overlap;
    html = [];
    rowList = [];
    hasContextMenu = true;
    overlap = false;
    if (id.indexOf('_app_') !== -1) {
      overlap = true;
    }
    if (options.hasOwnProperty('highlighted_wit')) {
      hand = options.highlighted_wit.split('|')[1];
    } else {
      hand = null;
    }
    if (options.hasOwnProperty('col_length')) {
      colspan = options.col_length;
    } else {
      colspan = end - start + 1;
    }
    orRules = CL.getRuleClasses(undefined, undefined, 'value', ['identifier', 'keep_as_main_reading',
                                                                'suffixed_label', 'suffixed_reading']);
    for (let key in orRules) {
      if (orRules.hasOwnProperty(key) && orRules[key][1] === false) {
        delete orRules[key];
      }
    }
    if (_areAllEmptyReadings(data) && !options.hasOwnProperty('created')) {
      html.push('<td class="redips-mark start_' + start + ' " colspan="' + colspan + '">' +
                '<div class="drag_div deletable" id="drag_unit_' + id + '">');
    } else {
      html.push('<td class="redips-mark start_' + start + ' " colspan="' + colspan + '">' +
                '<div class="drag_div" id="drag_unit_' + id + '">');
    }
    if (!overlap) {
      html.push('<table class="variant_unit" id="variant_unit_' + id + '">');
    } else {
      html.push('<table class="variant_unit overlap_unit" id="variant_unit_' + id + '">');
    }
    for (let i = 0; i < data.length; i += 1) {
      //what is the reading text?
      if (data[i].type === 'lac') {
        hasContextMenu = false;
      } else {
        hasContextMenu = true;
      }
      text = CL.extractDisplayText(data[i], i, data.length, options.unit_id, options.app_id);
      if (text.indexOf('system_gen_') !== -1) {
        hasContextMenu = false;
        text = text.replace('system_gen_', '');
      }
      data[i].text_string = text;
      //what labels need to be used?
      readingLabel = CL.getReadingLabel(i, data[i], orRules);
      readingSuffix = CL.getReadingSuffix(data[i], orRules);
      //what is the row id? (and add it to the list for adding events)
      rowId = 'variant_unit_' + id + '_row_' + i;
      rowList.push(rowId);

      if (i === 0) {
        html.push('<tr><td colspan="3" class="redips-mark"><span id="toggle_variant_' + id +
                  '" class="triangle">&#9650;</span></td></tr>');
        if (data[i].witnesses.indexOf(hand) != -1) {
          html.push('<tr id="' + rowId + '" class="top highlighted">');
        } else {
          html.push('<tr id="' + rowId + '" class="top">');
        }
        html.push('<td class="redips-mark"></td>');
      } else {
        if (data[i].witnesses.indexOf(hand) != -1) {
          html.push('<tr id="' + rowId + '" class="highlighted">');
        } else {
          html.push('<tr id="' + rowId + '">');
        }
        html.push('<td class="redips-rowhandler"><div class="redips-drag redips-row">+</div></td>');
      }

      html.push('<td id="' + rowId + '_label" class="reading_label redips-mark"><div class="spanlike">' +
                readingLabel);
      html.push('</div></td>');
      if (!overlap) {
        if (hasContextMenu) {
          html.push('<td class="redips-mark main_reading">');
        } else {
          html.push('<td class="redips-mark main_reading_ncm">');
        }
      } else {
        if (hasContextMenu) {
          html.push('<td class="redips-mark overlap_main_reading">');
        } else {
          html.push('<td class="redips-mark overlap_main_reading_ncm">');
        }
      }
      html.push('<div class="spanlike">');
      html.push(text);
      if (readingSuffix !== '') {
        html.push(' ' + readingSuffix);
      }
      html.push('</div>');
      if (data[i].hasOwnProperty('subreadings')) {
        html.push('<table class="subreading_unit" id="subreading_unit_' + id + '_row_' + i + '">');
        overlapped = false;
        if (data[i].hasOwnProperty('overlap_status')) {
          overlapped = true;
        }
        temp = _getSubunitData(data[i].subreadings, i, id, data[i].label, 'subreading', hand, overlapped);
        html.push.apply(html, temp[0]);
        rowList.push.apply(rowList, temp[1]);
        html.push('</table>');
      }
      html.push('</td>');
      html.push('</tr>');
    }
    html.push('</table>');
    html.push('</div></td>');
    return [html, rowList];
  };

  relabelReadings = function(readings, overwrite) {
    var label;
    for (let i = 0; i < readings.length; i += 1) {
      if (readings[i].hasOwnProperty('type') && (readings[i].type === 'lac' || readings[i].type === 'lac_verse')) {
        label = 'zz';
      } else if (readings[i].hasOwnProperty('overlap_status')) {
        for (let j = 0; j < CL.overlappedOptions.length; j += 1) {
          if (CL.overlappedOptions[j].reading_flag === readings[i].overlap_status) {
            label = CL.overlappedOptions[j].reading_label;
          }
        }
      } else {
        label = CL.getAlphaId(i);
      }
      if (overwrite || !readings[i].hasOwnProperty('label')) {
        readings[i].label = label;
      }
    }
  };

  addLabels = function(overwrite) {
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.match(/apparatus\d?/) !== null) {
          for (let i = 0; i < CL.data[key].length; i += 1) {
            relabelReadings(CL.data[key][i].readings, overwrite);
          }
        }
      }
    }
  };

  makeStandoffReading = function(type, readingDetails, parentReading, outerCallback) {
    var scrollOffset, apparatus, unit, callback;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    addToUndoStack(CL.data);
    apparatus = readingDetails.app_id;
    unit = CL.findUnitById(apparatus, readingDetails.unit_id);
    callback = function() {
      relabelReadings(unit.readings, true);
      if (CL.showSubreadings === false) { //make sure we are still showing the edition subreadings
        SR.findSubreadings({
          'rule_classes': CL.getRuleClasses('subreading', true, 'value', ['identifier', 'subreading'])
        });
      }
      showOrderReadings({
        'container': CL.container
      });
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
      if (outerCallback !== undefined) {
        outerCallback();
      }
    };
    CL.makeStandoffReading(type, readingDetails, parentReading, callback);
  };

  removeSplits = function() {
    var apparatus;
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.match(/apparatus\d?/g) !== null) {
          apparatus = CL.data[key];
          for (let i = 0; i < apparatus.length; i += 1) {
            delete apparatus[i].split_readings;
          }
          CL.data[key] = apparatus;
        }
      }
    }
  };

  // Need to work this out from the top line references to the overlap units as we can't actually rely on the start
  // and end values in the overlaps
  mergeSharedExtentOverlaps = function() {
    var match, overlapLineNumbers, overlapIndexes, sharedOverlaps, newKey, leadUnit, toDelete;
    toDelete = [];
    overlapLineNumbers = [];
    overlapIndexes = {};
    sharedOverlaps = {};
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.match(/apparatus\d+/) !== null) {
          match = key.match(/apparatus(\d+)/);
          overlapLineNumbers.push(parseInt(match[1]));
        }
      }
    }
    overlapLineNumbers.sort();
    // no point in even looking if we don't have more than one line of overlapped apparatus
    if (overlapLineNumbers.length > 1) {
      // create a dictionary with each overlapped unit as key to a 2 entry list.
      // by the end the first index will be pos 0 and the final pos 1
      for (let i = 0; i < CL.data.apparatus.length; i += 1) {
        if (CL.data.apparatus[i].hasOwnProperty('overlap_units')) {
          for (let key in CL.data.apparatus[i].overlap_units) {
            if (CL.data.apparatus[i].overlap_units.hasOwnProperty(key)) {
              if (!overlapIndexes.hasOwnProperty(key)) {
                overlapIndexes[key] = [i, i];
              } else {
                overlapIndexes[key][1] = i;
              }
            }
          }
        }
      }
    }
    // now switch the dictionary round so each set of index points are key to unit ids
    for (let key in overlapIndexes) {
      if (overlapIndexes.hasOwnProperty(key)) {
        newKey = overlapIndexes[key].join('-');
        if (sharedOverlaps.hasOwnProperty(newKey)) {
          sharedOverlaps[newKey].push(key);
        } else {
          sharedOverlaps[newKey] = [key];
        }
      }
    }
    // now see if any have more than one unit at each pair of indexes and therefore need combining
    for (let key in sharedOverlaps) {
      if (sharedOverlaps.hasOwnProperty(key)) {
        if (sharedOverlaps[key].length > 1) {
          leadUnit = _findLeadUnit(sharedOverlaps[key], overlapLineNumbers);
          _horizontalCombineOverlaps(key, sharedOverlaps[key], leadUnit);
        }
      }
    }
    // now delete any apparatus keys which are empty
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.match(/apparatus\d+/) !== null) {
          if (CL.data[key].length === 0) {
            toDelete.push(key);
          }
        }
      }
    }
    for (let i = 0; i < toDelete.length; i += 1) {
      delete CL.data[toDelete[i]];
    }
    // this needs to be called at the end once we have deleted any empty overlap lines otherwise it will fill up
    // the empty ones again it reruns the empty line deletion once it is done so maybe make that a separate function?
    _repositionOverlaps();
    _throughNumberApps(2);
    // now check the reading in each of the overlaped units for matching ones and merge if necessary
    mergeSharedOverlapReadings();
  };

  // Merges any shared readings in overlap units. Most, if not all, will have been created in the process of adding
  // witnesses but it is possible that they could happen in the course of editing depending on the editor.
  mergeSharedOverlapReadings = function() {
    var match, overlapLineNumbers;
    SV.prepareForOperation();
    overlapLineNumbers = [];
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.match(/apparatus\d+/) !== null) {
          match = key.match(/apparatus(\d+)/);
          overlapLineNumbers.push(parseInt(match[1]));
        }
      }
    }
    for (let i = 0; i < overlapLineNumbers.length; i += 1) {
      for (let j = 0; j < CL.data['apparatus' + overlapLineNumbers[i]].length; j += 1) {
        SV.unsplitUnitWitnesses(j, 'apparatus' + overlapLineNumbers[i]);
      }
    }
    SV.unprepareForOperation();
  };

  //
  canUnitMoveTo = function(id, currentAppRow, newAppRow) {
    var conflictUnits, conflict;
    conflictUnits = _getPotentialConflicts(id);
    conflict = false;
    if (conflictUnits.length === 0) {
      return true;
    }
    if (!CL.data.hasOwnProperty('apparatus' + newAppRow)) {
      return false;
    }
    for (let i = 0; i < CL.data['apparatus' + newAppRow].length; i += 1) {
      if (conflictUnits.indexOf(CL.data['apparatus' + newAppRow][i]._id) !== -1) {
        conflict = true;
      }
    }
    if (conflict === false) {
      return true;
    }
    return false;
  };

  /** next two functions allow undo operation. */
  addToUndoStack = function(data) {
    if (OR.undoStack.length === _undoStackLength) {
      OR.undoStack.shift();
    }
    OR.undoStack.push(JSON.stringify(data));
  };

  //this currently focuses only on gaps where they are the only thing in the reading
  //we may want to do something similar where they are combined too but it doesn't seem essential at this point
  makeWasGapWordsGaps = function() {
    var reading;
    //only needed on top line because this is a feature of overlapping
    for (let i = 0; i < CL.data.apparatus.length; i += 1) {
      for (let j = 0; j < CL.data.apparatus[i].readings.length; j += 1) {
        reading = CL.data.apparatus[i].readings[j];
        if (reading.text.length === 1 && reading.text[0].hasOwnProperty('was_gap')) {
          //make it a real gap again
          reading.type = 'lac';
          reading.details = reading.text[0]['interface'].replace('&gt;', '').replace('&lt;', '');
          reading.text = [];
        }
      }
    }
  };

  //optional: can be set in services or project and when moving to OR or approved
  mergeAllLacs = function() {
    var typeList, parentTemplate;
    typeList = ['lac', 'lac_verse'];
    parentTemplate = {'created': true,
                      'type': 'lac',
                      'details': 'lac',
                      'text': [],
                      'witnesses': []};
    _mergeAllSuppliedEmptyReadings(typeList, parentTemplate, true);
  };

  //optional: can be set in services or project and when moving to OR or approved
  mergeAllOms = function() {
    var typeList, parentTemplate;
    typeList = ['om', 'om_verse'];
    parentTemplate = {'created': true,
                      'type': 'om',
                      'text': [],
                      'witnesses': []};
    _mergeAllSuppliedEmptyReadings(typeList, parentTemplate, true);
  };


  //*********  private functions *********

  _uniqueifyIds = function() {
    var idList, extra;
    idList = [];
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key) && key.indexOf('apparatus') != -1) {
        for (let i = 0; i < CL.data[key].length; i += 1) {
          //we are assuming units already have unique ids
          //if we start changing them we need to keep the overlapped_units ids in synch
          for (let j = 0; j < CL.data[key][i].readings.length; j += 1) {
            extra = 0;
            while (idList.indexOf(CL.data[key][i].readings[j]._id) !== -1) {
              CL.addReadingId(CL.data[key][i].readings[j],
                              CL.data[key][i].start,
                              CL.data[key][i].end + 'extra' + extra);
              extra += 1;
            }
            idList.push(CL.data[key][i].readings[j]._id);
          }
        }
      }
    }
  };

  _approveVerse = function() {
    var standoffProblems, extraResults;
    spinner.showLoadingOverlay();
    SR.loseSubreadings();  // for preparation and is needed
    standoffProblems = SV.checkStandoffReadingProblems();
    if (!standoffProblems[0]) {
      extraResults = CL.applyPreStageChecks('approve');
      if (extraResults[0] === true) {
        if (CL.project.combineAllLacsInApproved === true) {
          OR.mergeAllLacs();
        }
        if (CL.project.combineAllOmsInApproved === true) {
          OR.mergeAllOms();
        }
        CL.showSubreadings = false;
        // now do the stuff we need to do
        // make sure all ids are unique (we know there is a problem with overlapping a readings for example)
        delete CL.data.event_list;
        _uniqueifyIds();
        _orderWitnessesForOutput();
        SR.loseSubreadings();  // always lose before finding
        SR.findSubreadings({'rule_classes': CL.getRuleClasses('subreading', true,
                                                              'value', ['identifier', 'subreading'])});
        _getSiglaSuffixes();
        // TODO: fosilise the reading suffixes and main reading label suffixes here
        // then make output dependent on these not being present
        _getMainReadingSpecialClasses();
        // The following comment is no longer true as we do have that button in the approved screen!
        // at this point the saved approved version always and only ever has the correct subreadings shown we
        // don't have the option to show/hide subreadings in the interface so we can be sure they are always correct
        CL.saveCollation('approved', function() {
          showApprovedVersion({
            'container': CL.container
          });
        });
      } else {
        SR.loseSubreadings();  // always lose before finding
        if (CL.showSubreadings === true) {
          SR.findSubreadings();
        } else {
          SR.findSubreadings({'rule_classes': CL.getRuleClasses('subreading', true,
                                                                'value', ['identifier', 'subreading'])});
        }
        alert(extraResults[1]);
        spinner.removeLoadingOverlay();
      }
    } else if (standoffProblems[0]) {
      SR.loseSubreadings();  // always lose before finding
      if (CL.showSubreadings === true) {
        SR.findSubreadings();
      } else {
        SR.findSubreadings({
          'rule_classes': CL.getRuleClasses('subreading', true, 'value', ['identifier', 'subreading'])
        });
      }
      alert('You cannot approve this verse because ' + standoffProblems[1]);
      spinner.removeLoadingOverlay();
    }
  };

  _getMainReadingSpecialClasses = function () {
    var unit, reading, ruleClasses;
    ruleClasses = CL.getRuleClasses('keep_as_main_reading', true, 'value', ['identifier', 'suffixed_label', 'suffixed_reading']);
    if ($.isEmptyObject(ruleClasses)) {
        return;
    }
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.indexOf('apparatus') != -1) {
          for (let i = 0; i < CL.data[key].length; i += 1) {
            unit = CL.data[key][i];
            for (let j = 0; j < unit.readings.length; j += 1) {
              reading = unit.readings[j];
              if (reading.hasOwnProperty('reading_classes') && reading.reading_classes.length > 0) {
                for (let k = 0; k < reading.reading_classes.length; k += 1) {
                  if (ruleClasses.hasOwnProperty(reading.reading_classes[k])) {
                    if (ruleClasses[reading.reading_classes[k]][1] === true) {
                      if (reading.hasOwnProperty('label_suffix')) {
                        reading.label_suffix = reading.label_suffix + ruleClasses[reading.reading_classes[k]][0];
                      } else {
                        reading.label_suffix = ruleClasses[reading.reading_classes[k]][0];
                      }
                    }
                    if (ruleClasses[reading.reading_classes[k]][2] === true) {
                      if (reading.hasOwnProperty('reading_suffix')) {
                        reading.reading_suffix = reading.reading_suffix + ruleClasses[reading.reading_classes[k]][0];
                      } else {
                        reading.reading_suffix = ruleClasses[reading.reading_classes[k]][0];
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  _getSiglaSuffixes = function() {
    var unit, reading, subreading;
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.indexOf('apparatus') != -1) {
          for (let i = 0; i < CL.data[key].length; i += 1) {
            unit = CL.data[key][i];
            for (let j = 0; j < unit.readings.length; j += 1) {
              reading = unit.readings[j];
              reading.suffixes = _doGetSiglaSuffixes(reading, key, unit.start, unit.end, unit.first_word_index);
              if (reading.hasOwnProperty('subreadings')) {
                for (let type in reading.subreadings) {
                  for (let k = 0; k < reading.subreadings[type].length; k += 1) {
                    subreading = reading.subreadings[type][k];
                    subreading.suffixes = _doGetSiglaSuffixes(subreading, key, unit.start, unit.end, unit.first_word_index);
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  _doGetSiglaSuffixes = function(data, app, start, end, firstWordIndex) {
    var readingsWithSuffixes, suffixes;
    readingsWithSuffixes = CL.getReadingWitnesses(data, app, start, end, firstWordIndex, true);
    suffixes = [];
    data.witnesses = CL.sortWitnesses(data.witnesses);
    for (let i = 0; i < readingsWithSuffixes.length; i += 1) {
      suffixes.push(readingsWithSuffixes[i].replace(data.witnesses[i].replace('_private', ''), ''));
    }
    return suffixes;
  };

  _orderWitnessesForOutput = function() {
    var unit, reading, subreading;
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.indexOf('apparatus') != -1) {
          for (let i = 0; i < CL.data[key].length; i += 1) {
            unit = CL.data[key][i];
            for (let j = 0; j < unit.readings.length; j += 1) {
              reading = unit.readings[j];
              reading.witnesses = CL.sortWitnesses(reading.witnesses);
              if (reading.hasOwnProperty('subreadings')) {
                for (let type in reading.subreadings) {
                  for (let k = 0; k < reading.subreadings[type].length; k += 1) {
                    subreading = reading.subreadings[type][k];
                    subreading.witnesses = CL.sortWitnesses(subreading.witnesses);
                  }
                }
              }
            }
          }
        }
      }
    }
    CL.data.lac_readings = CL.sortWitnesses(CL.data.lac_readings);
    CL.data.om_readings = CL.sortWitnesses(CL.data.om_readings);
  };

  _areAllEmptyReadings = function(readings) {
    for (let i = 0; i < readings.length; i += 1) {
      if (readings[i].text.length > 0) {
        return false;
      }
    }
    return true;
  };

  _getSubunitData = function(data, parentIndex, parentId, parentLabel, subtype, hand, overlapped) {
    var rowTypeId, rowList, html, subRowId;
    rowList = [];
    html = [];
    rowTypeId = 'subrow';
    for (let type in data) {
      if (data.hasOwnProperty(type)) {
        for (let i = 0; i < data[type].length; i += 1) {
          subRowId = 'subreading_unit_' + parentId + '_row_' + parentIndex + '_type_' + type + '_' +
                     rowTypeId + '_' + i;
          rowList.push(subRowId);
          if (data[type][i].witnesses.indexOf(hand) != -1) {
            html.push('<tr class="' + subtype + ' highlighted" id="' + subRowId + '">');
          } else {
            html.push('<tr class="' + subtype + '" id="' + subRowId + '">');
          }
          if (parentLabel === 'zz') {
            html.push('<td></td>');
          } else if (overlapped === true) {
            html.push('<td></td>');
          } else {
            html.push('<td><div class="spanlike">' + parentLabel + data[type][i].suffix + '.</td></td>');
          }
          html.push('<td><div class="spanlike">' + data[type][i].text_string + '</div></td>');
          html.push('</tr>');
        }
      }
    }
    return [html, rowList];
  };

  editLabel = function(rdgDetails, menuPos, saveFunction) {
    var left, top, labelForm, html, newLabel, reading, currentLabel;
    if (document.getElementById('label_form')) {
      document.getElementsByTagName('body')[0].removeChild(document.getElementById('label_form'));
    }
    left = menuPos.left;
    top = menuPos.top;
    labelForm = document.createElement('div');
    reading = CL.data[rdgDetails[1]][rdgDetails[0]].readings[rdgDetails[2]];
    currentLabel = reading.label;
    labelForm.setAttribute('id', 'label_form');
    labelForm.setAttribute('class', 'label_form');
    html = [];
    html.push('<div class="dialogue_form_header drag-zone">Edit Label</div>');
    html.push('<form id="label_change_form">');
    html.push('<label for="new_label">new label:<br/><input type="text" id="new_label"/></label><br/><br/>');
    html.push('<input class="pure-button dialogue-form-button" id="close_label_button" type="button" value="Cancel"/>');
    html.push('<input class="pure-button dialogue-form-button" id="save_label_button" type="button" value="Save"/>');
    html.push('</form>');
    labelForm.innerHTML = html.join('');
    document.getElementsByTagName('body')[0].appendChild(labelForm);

    // the +25 here is to move it out of the way of the other labels and readings so you can still see them
    left = parseInt(left) - document.getElementById('scroller').scrollLeft + 25;
    top = parseInt(top) - document.getElementById('scroller').scrollTop;
    document.getElementById('label_form').style.left = left + 'px';
    document.getElementById('label_form').style.top = top + 'px';
    document.getElementById('new_label').value = currentLabel; // populate field with current label value
    drag.initDraggable('label_form', true, true);
    $('#close_label_button').on('click', function(event) {
      document.getElementsByTagName('body')[0].removeChild(document.getElementById('label_form'));
    });
    if (saveFunction !== undefined) {
      $('#save_label_button').on('click', function(event) {
        saveFunction();
      });
    } else {
      $('#save_label_button').on('click', function(event) {
        newLabel = document.getElementById('new_label').value.replace(/\s+/g, '');
        if (newLabel != '') {
          _manualChangeLabel(rdgDetails, newLabel);
        }
      });
    }
  };

  _manualChangeLabel = function(rdgDetails, newLabel) {
    var reading, scrollOffset;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    addToUndoStack(CL.data);
    reading = CL.data[rdgDetails[1]][rdgDetails[0]].readings[rdgDetails[2]];
    reading.label = newLabel;
    document.getElementsByTagName('body')[0].removeChild(document.getElementById('label_form'));
    showOrderReadings({'container': CL.container});
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  /** highlight a witness, called from select box in page footer*/
  _highlightWitness = function(witness, stage) {
    var scrollOffset;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    CL.highlighted = witness;
    if (stage === 'approved') {
      showApprovedVersion({'container': CL.container, 'highlighted_wit': witness});
    } else {
      showOrderReadings({'container': CL.container, 'highlighted_wit': witness});
    }
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
    if (witness !== 'none') {
      CL.getHighlightedText(witness);
    }
  };

  _makeMenu = function(menuName) {
    var menu, div, key, subreadings, orRules;
    div = document.createElement('div');
    //menus for full units
    if (menuName === 'subreading') {
      document.getElementById('context_menu').innerHTML = '<li id="unmark_sub"><span>Make main reading</span></li>';
    } else if (menuName === 'deletable_unit') {
      document.getElementById('context_menu').innerHTML = '<li id="delete_unit"><span>Delete unit</span></li>';
    } else if (menuName === 'main_reading' || menuName === 'overlap_main_reading') {
      menu = [];
      menu.push('<li id="split_witnesses"><span>Split Witnesses</span></li>');
      subreadings = [];
      orRules = CL.getRuleClasses('create_in_OR', true, 'name', ['subreading', 'value', 'identifier',
                                                                 'keep_as_main_reading']);
      for (let key in orRules) {
        if (orRules.hasOwnProperty(key)) {
          if (orRules[key][3]) {
            menu.push('<li id="mark_as_' + orRules[key][1] + '"><span>Mark/Unmark as ' + key + '</span></li>');
          } else {
            subreadings.push([key, orRules[key][1], orRules[key][2]]);
          }
        }
      }
      if (subreadings.length === 1) {
        if (typeof subreadings[0][2] !== 'undefined') {
          menu.push('<li id="mark_as_' + subreadings[0][1] + '"><span>Mark as ' + subreadings[0][0] + ' (' +
                    subreadings[0][2] + ')</span></li>');
        } else {
          menu.push('<li id="mark_as_' + subreadings[0][1] + '"><span>Mark as ' + subreadings[0][0] + '</span></li>');
        }
      } else if (subreadings.length > 1) {
        menu.push('<li id="mark_as_ORsubreading"><span>Mark as subreading</span></li>');
      }
      document.getElementById('context_menu').innerHTML = menu.join('');
    } else if (menuName === 'overlap_unit') {
      document.getElementById('context_menu').innerHTML = '<li id="move_up"><span>Move unit up</span></li>' +
                                                          '<li id="move_down"><span>Move unit down</span></li>';
    } else if (menuName === 'reading_label') {
      document.getElementById('context_menu').innerHTML = '<li id="edit_label"><span>Edit label</span></li>';
    }
    _addContextMenuHandlers();
    return 'context_menu';
  };

  _makeMainReading = function(idString) {
    var scrollOffset, unitNumber, appId, unit, subtype, parentPos, subreadingPos, parentReading,
      subreading, options;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    addToUndoStack(CL.data);

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
    SV.prepareForOperation();
    SV.unsplitUnitWitnesses(unitNumber, appId);
    SV.unprepareForOperation();
    relabelReadings(unit.readings, true);
    if (CL.showSubreadings === false) { //make sure we are still showing the edition subreadings
      SR.findSubreadings({
        'rule_classes': CL.getRuleClasses('subreading', true, 'value', ['identifier', 'subreading'])
      });
    }
    showOrderReadings({
      'container': CL.container
    });
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  _getDeleteUnit = function(unit) {
    var scrollOffset, details, id;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    addToUndoStack(CL.data);
    details = CL.getUnitAppReading(unit.id);
    id = CL.data[details[1]][details[0]]._id;
    _deleteUnit(details[1], id);
    showOrderReadings({
      'container': CL.container
    });
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  _moveOverlapUp = function(unit) {
    var details, id, appNum, isSpace, scrollOffset, currentLoc, newLoc;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
      document.getElementById('scroller').scrollTop
    ];
    addToUndoStack(CL.data);
    details = CL.getUnitAppReading(unit.id);
    id = CL.data[details[1]][details[0]]._id;
    appNum = parseInt(details[1].replace('apparatus', ''));
    currentLoc = appNum;
    newLoc = appNum - 1;
    isSpace = canUnitMoveTo(id, currentLoc, newLoc);
    if (!isSpace) {
      //then renumber all app lines from the one want to move to onwards to create a gap above the one we are looking for a space in
      //NB this will involve renumbering the line our current unit is in
      _throughNumberApps(appNum, appNum - 3);
      CL.data['apparatus' + newLoc] = [];
      currentLoc = appNum + 1;
    }
    //now move the unit to where we want it (we have already created the space if it was required)
    for (let i = 0; i < CL.data['apparatus' + currentLoc].length; i += 1) {
      if (CL.data['apparatus' + currentLoc][i]._id === id) {
        CL.data['apparatus' + newLoc].push(JSON.parse(JSON.stringify(CL.data['apparatus' + currentLoc][i])));
        CL.data['apparatus' + newLoc].sort(_compareStartIndexes);
        CL.data['apparatus' + currentLoc][i] = null;
      }
    }
    CL.removeNullItems(CL.data['apparatus' + currentLoc]);
    for (let key in CL.data) {
      if (key.indexOf('apparatus') !== -1) {
        if (CL.data[key].length === 0) {
          delete CL.data[key];
        }
      }
    }
    _throughNumberApps(2); //just check we are still sequential
    showOrderReadings({
      'container': CL.container
    });
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  _compareStartIndexes = function(a, b) {
    return a.start - b.start;
  };

  _moveOverlapDown = function(unit) {
    var details, id, scrollOffset, appNum, currentLoc, newLoc, isSpace;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    addToUndoStack(CL.data);
    details = CL.getUnitAppReading(unit.id);
    id = CL.data[details[1]][details[0]]._id;
    appNum = parseInt(details[1].replace('apparatus', ''));
    currentLoc = appNum;
    newLoc = appNum + 1;
    // if there is no line there add one now
    if (!CL.data.hasOwnProperty('apparatus' + newLoc)) {
      CL.data['apparatus' + newLoc] = [];
    }
    isSpace = canUnitMoveTo(id, currentLoc, newLoc);
    if (!isSpace) {
      _throughNumberApps(appNum + 3, appNum);
      newLoc = newLoc + 1;
      CL.data['apparatus' + newLoc] = [];
    }
    // now move the unit to where we want it (we have already created the space if it was required)
    for (let i = 0; i < CL.data['apparatus' + currentLoc].length; i += 1) {
      if (CL.data['apparatus' + currentLoc][i]._id === id) {
        CL.data['apparatus' + newLoc].push(JSON.parse(JSON.stringify(CL.data['apparatus' + currentLoc][i])));
        CL.data['apparatus' + newLoc].sort(_compareStartIndexes);
        CL.data['apparatus' + currentLoc][i] = null;
      }
    }
    CL.removeNullItems(CL.data['apparatus' + currentLoc]);
    for (let key in CL.data) {
      if (key.indexOf('apparatus') !== -1) {
        if (CL.data[key].length === 0) {
          delete CL.data[key];
        }
      }
    }
    _throughNumberApps(2); //just check we are still sequential
    showOrderReadings({
      'container': CL.container
    });
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  _addContextMenuHandlers = function() {
    // TODO: how many of these declarations are needed?
    var orRules, key, rule, ruleName, subtype, subreading;
    if (document.getElementById('unmark_sub')) {
      $('#unmark_sub').off('click.ums_c');
      $('#unmark_sub').off('mouseover.ums_mo');
      $('#unmark_sub').on('click.ums_c', function(event) {
        var element, rowElem;
        element = SimpleContextMenu._target_element;
        rowElem = CL.getSpecifiedAncestor(element, 'TR');
        _makeMainReading(rowElem.id);
      });
      $('#unmark_sub').on('mouseover.ums_mo', function(event) {
        CL.hideTooltip();
      });
    }
    if (document.getElementById('split_witnesses')) {
      $('#split_witnesses').off('click.sw_c');
      $('#split_witnesses').off('mouseover.sw_mo');
      $('#split_witnesses').on('click.sw_c', function(event) {
        var element, div, readingDetails;
        element = SimpleContextMenu._target_element;
        div = CL.getSpecifiedAncestor(element, 'TR');
        readingDetails = CL.getUnitAppReading(div.id);
        SV.splitReadingWitnesses(readingDetails, 'order_readings', {
          'top': SimpleContextMenu._menuElement.style.top,
          'left': SimpleContextMenu._menuElement.style.left
        });
      });
      $('#split_witnesses').on('mouseover.sw_mo', function(event) {
        CL.hideTooltip();
      });
    }
    if (document.getElementById('move_up')) {
      $('#move_up').off('click.mu_c');
      $('#move_up').off('mouseover.mu_mo');
      $('#move_up').on('click.mu_c', function(event) {
        var element, div;
        element = SimpleContextMenu._target_element;
        div = CL.getSpecifiedAncestor(element, 'DIV', function(e) {
          if ($(e).hasClass('spanlike')) {
            return false;
          }
          return true;
        });
        _moveOverlapUp(div);
      });
      $('#move_up').on('mouseover.mu_mo', function(event) {
        CL.hideTooltip();
      });
    }
    if (document.getElementById('move_down')) {
      $('#move_down').off('click.md_c');
      $('#move_down').off('mouseover.md_mo');
      $('#move_down').on('click.md_c', function(event) {
        var element, div;
        element = SimpleContextMenu._target_element;
        div = CL.getSpecifiedAncestor(element, 'DIV', function(e) {
          if ($(e).hasClass('spanlike')) {
            return false;
          }
          return true;
        });
        _moveOverlapDown(div);
      });
      $('#move_down').on('mouseover.md_mo', function(event) {
        CL.hideTooltip();
      });
    }
    if (document.getElementById('edit_label')) {
      $('#edit_label').off('click.el_c');
      $('#edit_label').off('mouseover.el_mo');
      $('#edit_label').on('click.el_c', function(event) {
        var element, labelCell, rdgDetails;
        element = SimpleContextMenu._target_element;
        labelCell = CL.getSpecifiedAncestor(element, 'TD');
        rdgDetails = CL.getUnitAppReading(labelCell.id);
        editLabel(rdgDetails, {
          'top': SimpleContextMenu._menuElement.style.top,
          'left': SimpleContextMenu._menuElement.style.left
        });
      });
      $('#edit_label').on('mouseover.el_mo', function(event) {
        CL.hideTooltip();
      });
    }
    if (document.getElementById('delete_unit')) {
      $('#delete_unit').off('click.du_c');
      $('#delete_unit').off('mouseover.du_mo');
      $('#delete_unit').on('click.du_c', function(event) {
        var element, div;
        element = SimpleContextMenu._target_element;
        div = CL.getSpecifiedAncestor(element, 'DIV', function(e) {
          if ($(e).hasClass('spanlike')) {
            return false;
          }
          return true;
        });
        _getDeleteUnit(div);
      });
      $('#delete_unit').on('mouseover.du_mo', function(event) {
        CL.hideTooltip();
      });
    }
    //special added for OR
    orRules = CL.getRuleClasses('create_in_OR', true, 'name', ['subreading', 'value', 'identifier',
                                                               'keep_as_main_reading']);
    for (let key in orRules) {
      if (orRules.hasOwnProperty(key)) {
        if (!orRules[key][0]) {
          if (document.getElementById('mark_as_' + orRules[key][1])) {
            _addEvent(orRules, key);
          }
        }
      }
    }
    if (document.getElementById('mark_as_ORsubreading')) {
      //make menu for mark_as_ORsubreading
      key = 'ORsubreading';
      $('#mark_as_' + key).off('click.' + key + '_c');
      $('#mark_as_' + key).off('mouseover.' + key + '_mo');
      $('#mark_as_' + key).on('click.' + key + '_c', function(event) {
        var element, appId, div, unit, unitPos, rdgDetails, readingPos, reading, readingDetails;
        element = SimpleContextMenu._target_element;
        div = CL.getSpecifiedAncestor(element, 'TR');
        rdgDetails = CL.getUnitAppReading(div.id);
        unitPos = rdgDetails[0];
        appId = rdgDetails[1];
        readingPos = rdgDetails[2];
        unit = CL.data[appId][unitPos];
        reading = unit.readings[readingPos];
        readingDetails = {'app_id': appId,
                          'unit_id': unit._id,
                          'unit_pos': unitPos,
                          'reading_pos': readingPos,
                          'reading_id': reading._id};
        CL.markStandoffReading(key, 'Subreading', readingDetails, 'order_readings', {
          'top': SimpleContextMenu._menuElement.style.top,
          'left': SimpleContextMenu._menuElement.style.left
        });
      });
      $('#mark_as_' + key).on('mouseover.' + key + '_mo', function(event) {
        CL.hideTooltip();
      });
    } else {
      for (let key in orRules) {
        if (orRules.hasOwnProperty(key)) {
          if (orRules[key][0]) {
            if (document.getElementById('mark_as_' + orRules[key][1])) {
              rule = JSON.parse(JSON.stringify(orRules[key]));
              ruleName = key;
              //mark the reading as subreading
              $('#mark_as_' + orRules[key][1]).off('click.' + key + '_c');
              $('#mark_as_' + orRules[key][1]).off('mouseover.' + key + '_mo');
              $('#mark_as_' + orRules[key][1]).on('click.' + key + '_c', function(event) {
                var element, div, unit, unitPos, rdgDetails, readingPos, reading, readingDetails, appId;
                element = SimpleContextMenu._target_element;
                div = CL.getSpecifiedAncestor(element, 'TR');
                rdgDetails = CL.getUnitAppReading(div.id);
                unitPos = rdgDetails[0];
                appId = rdgDetails[1];
                readingPos = rdgDetails[2];
                unit = CL.data[appId][unitPos];
                reading = unit.readings[readingPos];
                readingDetails = {'app_id': appId,
                                  'unit_id': unit._id,
                                  'unit_pos': unitPos,
                                  'reading_pos': readingPos,
                                  'reading_id': reading._id};
                CL.markStandoffReading(rule[1], ruleName, readingDetails, 'order_readings', {
                  'top': SimpleContextMenu._menuElement.style.top,
                  'left': SimpleContextMenu._menuElement.style.left
                });
              });
              $('#mark_as_' + orRules[key][1]).on('mouseover.' + key + '_mo', function(event) {
                CL.hideTooltip();
              });
            }
          }
        }
      }
    }
  };

  /**adds the correct handler depending on subreading and keep_as_main_reading settings in the project rule configurations */
  _addEvent = function(orRules, key) {
    //if this reading is not marked to be kept as a main reading then use stand_off marking
    if (!orRules[key][3]) {
      $('#mark_as_' + orRules[key][1]).off('click.' + key + '_c');
      $('#mark_as_' + orRules[key][1]).off('mouseover.' + key + '_mo');
      $('#mark_as_' + orRules[key][1]).on('click.' + key + '_c', function(event) {
        var element, div, rdgDetails, unitPos, appId, readingPos, unit, reading, readingDetails;
        element = SimpleContextMenu._target_element;
        div = CL.getSpecifiedAncestor(element, 'TR');
        rdgDetails = CL.getUnitAppReading(div.id);
        unitPos = rdgDetails[0];
        appId = rdgDetails[1];
        readingPos = rdgDetails[2];
        unit = CL.data[appId][unitPos];
        reading = unit.readings[readingPos];
        readingDetails = {'app_id': appId,
                          'unit_id': unit._id,
                          'unit_pos': unitPos,
                          'reading_pos': readingPos,
                          'reading_id': reading._id};
        CL.markStandoffReading(orRules[key][1], key, readingDetails, 'order_readings', {
          'top': SimpleContextMenu._menuElement.style.top,
          'left': SimpleContextMenu._menuElement.style.left
        });
      });
      $('#mark_as_' + orRules[key][1]).on('mouseover.' + key + '_mo', function(event) {
        CL.hideTooltip();
      });
    } else {
      //else just add the marker and allow its removal
      $('#mark_as_' + orRules[key][1]).off('click.' + key + '_c');
      $('#mark_as_' + orRules[key][1]).off('mouseover.' + key + '_mo');
      $('#mark_as_' + orRules[key][1]).on('click.' + key + '_c', function(event) {
        var element, div, rdgDetails, unitPos, appId, readingPos, reading;
        element = SimpleContextMenu._target_element;
        div = CL.getSpecifiedAncestor(element, 'TR');
        rdgDetails = CL.getUnitAppReading(div.id);
        unitPos = rdgDetails[0];
        appId = rdgDetails[1];
        readingPos = rdgDetails[2];
        reading = CL.data[appId][unitPos].readings[readingPos];
        _markReading(orRules[key][1], reading);
      });
      $('#mark_as_' + orRules[key][1]).on('mouseover.' + key + '_mo', function(event) {
        CL.hideTooltip();
      });
    }
  };

  _markReading = function(value, reading) {
    var scrollOffset;
    scrollOffset = [document.getElementById('scroller').scrollLeft,
                    document.getElementById('scroller').scrollTop];
    CL.markReading(value, reading);
    showOrderReadings({'container': CL.container});
    document.getElementById('scroller').scrollLeft = scrollOffset[0];
    document.getElementById('scroller').scrollTop = scrollOffset[1];
  };

  redipsInitOrderReadings = function(id, onDropFunction) {
    var rd = REDIPS.drag;
    rd.init(id);
    if (onDropFunction !== undefined) {
      rd.event.rowDropped = onDropFunction;
    } else {
      rd.event.rowDropped = function() {
        var scrollOffset
        addToUndoStack(CL.data);
        reorderRows(rd);
        scrollOffset = document.getElementById('scroller').scrollLeft;
        showOrderReadings({'container': CL.container});
        document.getElementById('scroller').scrollLeft = scrollOffset;
      };
    }
  };

  reorderRows = function(rd) {
    var table, temp, rows, app, unit, order, readingId, readings;
    // addToUndoStack(CL.data);
    table = document.getElementById(rd.obj.id);
    temp = table.getElementsByTagName('TR');
    rows = [];
    if (rd.obj.id.indexOf('_app_') === -1) {
      app = 'apparatus';
      unit = parseInt(rd.obj.id.replace('variant_unit_', ''), 10);
    } else {
      app = 'apparatus' + rd.obj.id.substring(rd.obj.id.indexOf('_app_') + 5);
      unit = parseInt(rd.obj.id.substring(rd.obj.id.indexOf('unit_') + 5, rd.obj.id.indexOf('_app_')), 10);
    }
    for (let i = 0; i < temp.length; i += 1) {
      if (temp[i].id.indexOf('subreading') === -1) {
        rows.push(temp[i]);
      }
    }
    order = [];
    for (let i = 0; i < rows.length; i += 1) {
      if (rows[i].id) {
        readingId = rows[i].id;
        order.push(parseInt(readingId.substring(readingId.indexOf('row_') + 4), 10));
      }
    }
    readings = CL.data[app][unit].readings;
    delete CL.data[app][unit].readings;
    readings = _sortArrayByIndexes(readings, order);
    relabelReadings(readings, true);
    CL.data[app][unit].readings = readings;
  };

  _sortArrayByIndexes = function(array, indexes) {
    var result;
    result = [];
    for (let i = 0; i < array.length; i += 1) {
      result[i] = array[indexes[i]];
    }
    return result;
  };

  _getApparatusForContext = function() {
    if (CL.services.hasOwnProperty('getApparatusForContext')) {
      CL.services.getApparatusForContext(function() {
        spinner.removeLoadingOverlay();
      });
    } else {
      var url, settings, callback;
      settings = JSON.parse(CL.getExporterSettings());
      if (!settings.hasOwnProperty('options')) {
        settings.options = {};
      }
      settings.options.rule_classes = CL.ruleClasses;
      spinner.showLoadingOverlay();
      url = CL.services.apparatusServiceUrl;
      callback = function(collations) {
          var collationId, innerCallback;
          for (let i=0; i<collations.length; i+=1) {
              if (collations[i].status === 'approved') {
                  collationId = collations[i].id;
              }
          }
          innerCallback = function (collation) {
              var data;
              data = {settings: JSON.stringify(settings),
                      data: JSON.stringify([{'context': CL.context, 'structure': collation.structure}])
                      };
              $.post(url, data).then(function (response) {
                  var blob, filename, downloadUrl, hiddenLink;
                  blob = new Blob([response], {'type': 'text/txt'});
                  filename = CL.context + '_apparatus.txt';
                  downloadUrl = window.URL.createObjectURL(blob);
                  hiddenLink = document.createElement('a');
                  hiddenLink.style.display = 'none';
                  hiddenLink.href = downloadUrl;
                  hiddenLink.download = filename;
                  document.body.appendChild(hiddenLink);
                  hiddenLink.click();
                  window.URL.revokeObjectURL(downloadUrl);
                  spinner.removeLoadingOverlay();
              }).fail(function (response) {
                  alert('This unit cannot be exported 2. First try reapproving the unit. If the problem persists please ' +
                        'recollate the unit from the collation home page.');
                  spinner.removeLoadingOverlay();
              });
          };
          loadSavedCollation(collationId, innerCallback);
      };
      getSavedCollations(CL.context, undefined, callback);
    }
  };

  /** prep stuff for loading into order readings */
  _compareOverlaps = function(a, b) {
    // always put overlap readings at the bottom (of their parent reading)
    if (a.hasOwnProperty('overlap')) {
      return 1;
    }
    if (b.hasOwnProperty('overlap')) {
      return -1;
    }
  };

  // through number all the overlapping apparatus lines from start_line with the
  // first number of the renumbered readings labeled as startIndex
  // it is safe to assume that when we call this with a startRow value that all
  // app lines are thru numbered from 2 at the point we call it.
  _throughNumberApps = function(startIndex, startRow) {
    var overlapLines, m, renumber, j, all, unit;
    all = false;
    if (typeof startRow === 'undefined') {
      all = true;
      startRow = 0;
    }
    overlapLines = [];
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.match(/apparatus\d+/) !== null) {
          m = key.match(/apparatus(\d+)/);
          overlapLines.push(parseInt(m[1]));
        }
      }
    }
    overlapLines.sort();
    if (all === false && startIndex < overlapLines[startRow]) {
      console.log('That operation is not allowed');
    } else {
      //see if we even need to renumber any app lines
      renumber = false;
      j = startIndex;
      for (let i = startRow; i < overlapLines.length; i += 1) {
        if (overlapLines[i] !== j) {
          renumber = true;
        }
        j += 1;
      }
      if (renumber === true) {
        //rename all the apparatus keys so we won't accidentally overwrite anything
        for (let i = startRow; i < overlapLines.length; i += 1) {
          if (CL.data.hasOwnProperty('apparatus' + overlapLines[i])) {
            CL.data['old_apparatus' + overlapLines[i]] = CL.data['apparatus' + overlapLines[i]];
            delete CL.data['apparatus' + overlapLines[i]];
          }
        }
        j = startIndex;
        //now through number them as we want
        for (let i = startRow; i < overlapLines.length; i += 1) {
          if (CL.data.hasOwnProperty('old_apparatus' + overlapLines[i])) {
            CL.data['apparatus' + j] = CL.data['old_apparatus' + overlapLines[i]];
            for (let k = 0; k < CL.data['apparatus' + j].length; k += 1) {
              unit = CL.data['apparatus' + j][k];
              // now check that any marked_readings for this row are also updated
              SR.updateMarkedReadingData(unit, {'row': j});
              // and update the row info in the unit
              unit.row = j;
            }
            delete CL.data['old_apparatus' + overlapLines[i]];
          }
          j += 1;
        }
      }
    }
  };

  //by this point we have added accurate start and end values for each unit so we can rely on them for testing overlaps
  //we added the correct start an end values in _horizontalCombineOverlaps
  _repositionOverlaps = function() {
    var m, overlapLines, movingStart, movingEnd, moveTo, apparatusLine;
    overlapLines = [];
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.match(/apparatus\d+/) !== null) {
          m = key.match(/apparatus(\d+)/);
          overlapLines.push(parseInt(m[1]));
        }
      }
    }
    overlapLines.sort();
    //which is best - the algorithm below or using start and end in the overlaps themselves?
    //work from the second line of overlaps because the ones in the top line are already as high as they can be
    for (let i = 1; i < overlapLines.length; i += 1) {
      apparatusLine = CL.data['apparatus' + overlapLines[i]];
      for (let j = 0; j < apparatusLine.length; j += 1) {
        movingStart = apparatusLine[j].start;
        movingEnd = apparatusLine[j].end;
        moveTo = _unitCanMoveTo(apparatusLine[j]._id, overlapLines, i);
        if (moveTo !== -1) {
          CL.data['apparatus' + moveTo].push(JSON.parse(JSON.stringify(apparatusLine[j])));
          SR.updateMarkedReadingData(apparatusLine[j], {'row': moveTo});
          // now we have sorted out the marked reading we can update the row on the unit
          CL.data['apparatus' + moveTo][CL.data['apparatus' + moveTo].length-1].row = moveTo;
          CL.data['apparatus' + moveTo].sort(_compareStartIndexes);
          apparatusLine[j] = null;
        }
      }
      CL.removeNullItems(apparatusLine);
    }
    // now delete any apparatus lines we don't need any more
    for (let key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.match(/apparatus\d+/) !== null) {
          if (CL.data[key].length === 0) {
            delete CL.data[key];
          }
        }
      }
    }
  };

  _getPotentialConflicts = function(id) {
    var ids;
    ids = [];
    for (let i = 0; i < CL.data.apparatus.length; i += 1) {
      if (CL.data.apparatus[i].hasOwnProperty('overlap_units') &&
        CL.data.apparatus[i].overlap_units.hasOwnProperty(id)) {
        for (let key in CL.data.apparatus[i].overlap_units) {
          if (CL.data.apparatus[i].overlap_units.hasOwnProperty(key) &&
            key !== id) {
            if (ids.indexOf(key) === -1) {
              ids.push(key);
            }
          }
        }
      }
    }
    return ids;
  };

  //return the highest (nearest to the top, so lowest index number) app line that this unit
  //can be repositioned to without conflict with existing units
  _unitCanMoveTo = function(id, overlapKeys, currentAppRow) {
    var conflictUnits, conflict;
    conflictUnits = _getPotentialConflicts(id);
    for (let i = 0; i < currentAppRow; i += 1) {
      conflict = false;
      if (conflictUnits.length === 0) {
        //then there are no potential conflicts to move it as high as we can
        return overlapKeys[i];
      }
      for (let j = 0; j < CL.data['apparatus' + overlapKeys[i]].length; j += 1) {
        if (conflictUnits.indexOf(CL.data['apparatus' + overlapKeys[i]][j]._id) !== -1) {
          conflict = true;
        }
      }
      if (conflict === false) {
        return overlapKeys[i];
      }
    }
    return -1;
  };

  _findLeadUnit = function(ids, overlapLines) {
    var unit;
    for (let i = 0; i < overlapLines.length; i += 1) {
      for (let j = 0; j < CL.data['apparatus' + overlapLines[i]].length; j += 1) {
        unit = CL.data['apparatus' + overlapLines[i]][j];
        if (ids.indexOf(unit._id) !== -1) {
          //just return the id we find first (we are going through apparatus in order)
          return unit._id;
        }
      }
    }
    //we should have returned by now just in case best return something sensible
    return ids[0];
  };

  _deleteUnit = function(apparatus, unitId) {
    for (let i = CL.data[apparatus].length - 1; i >= 0; i -= 1) {
      if (CL.data[apparatus][i]._id === unitId) {
        CL.data[apparatus].splice(i, 1);
      }
    }
  };

  _undo = function() {
    var eventList, scrollOffset;
    if (OR.undoStack.length > 0) {
      scrollOffset = [document.getElementById('scroller').scrollLeft,
                      document.getElementById('scroller').scrollTop];
      eventList = CL.data.event_list;
      CL.data = JSON.parse(OR.undoStack.pop());
      showOrderReadings({
        'container': CL.container
      });
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    }
  };

  _findOverlapApparatusAndUnitById = function(id) {
    var unit;
    unit = null;
    for (let key in CL.data) {
      if (key.match(/apparatus\d*/g) !== null) {
        if (unit === null) {
          unit = CL.findUnitById(key, id);
          if (unit !== null) {
            return [unit, key];
          }
        }
      }
    }
    return [unit, key];
  };

  //here combine all overlapped units at the same index location find the one in the lowest apparatus number
  _horizontalCombineOverlaps = function(locationInfo, unitIds, leadId) {
    var locations, witnesses, leadUnit, unit, temp, apparatus;
    locations = locationInfo.split('-');
    //here move all readings into the leadId unit and delete the others
    leadUnit = CL.findOverlapUnitById(leadId);
    for (let i = 0; i < unitIds.length; i += 1) {
      if (unitIds[i] !== leadId) {
        temp = _findOverlapApparatusAndUnitById(unitIds[i]);
        unit = temp[0];
        apparatus = temp[1];
        leadUnit.readings.push(JSON.parse(JSON.stringify(unit.readings[1])));
        leadUnit.start = CL.data.apparatus[locations[0]].start;
        leadUnit.end = CL.data.apparatus[locations[1]].end;
        SR.updateMarkedReadingData(unit, {'row': leadUnit.row});
        _deleteUnit(apparatus, unitIds[i]);
      }
    }
    // now combine all the top line data into the lead id (this must be correct for display to work)
    for (let i = parseInt(locations[0]); i <= parseInt(locations[1]); i += 1) {
      witnesses = [];
      if (CL.data.apparatus[i].hasOwnProperty('overlap_units')) {
        for (let j = 0; j < unitIds.length; j += 1) {
          if (CL.data.apparatus[i].overlap_units.hasOwnProperty(unitIds[j])) {
            witnesses.push.apply(witnesses, CL.data.apparatus[i].overlap_units[unitIds[j]]);
            delete CL.data.apparatus[i].overlap_units[unitIds[j]];
          }
        }
      }
      CL.data.apparatus[i].overlap_units[leadId] = witnesses;
    }
  };

  // shouldn't be needed for overlapped units but just do it for safety
  // anything with an overlap_status flag should not be combined and should remain separate
  // we make a generic parent which goes in the position of the first found reading with all the others
  // as a special kind of subreading and we give the generic parent a unique id like all other readings
  _mergeAllSuppliedEmptyReadings = function(typeList, parentBlueprint, alwaysCreateNewParent) {
    var unit, reading, matchedReadings, newParent, witness, type, parentId, rdgDetails;
    SR.loseSubreadings();
    SR.findSubreadings();
    matchedReadings = {};
    for (let key in CL.data) {
      if (key.match(/apparatus\d*/g) !== null) {
        for (let i = 0; i < CL.data[key].length; i += 1) {
          unit = CL.data[key][i];
          for (let j = 0; j < CL.data[key][i].readings.length; j += 1) {
            reading = CL.data[key][i].readings[j];
            if (reading.text.length === 0 && !reading.hasOwnProperty('overlap_status')) {
              if (typeList.indexOf(reading.type) != -1) {
                if (!matchedReadings.hasOwnProperty(unit._id)) {
                  matchedReadings[unit._id] = [];
                }
                rdgDetails = {'app_id': key,
                              'unit_id': unit._id,
                              'unit_pos': i,
                              'reading_id': reading._id};
                if (reading.hasOwnProperty('subreadings')) {
                  rdgDetails.subreadings = true;
                }
                matchedReadings[unit._id].push(rdgDetails);
              }
            }
          }
        }
      }
    }
    //now data is collected
    SR.loseSubreadings();
    for (let key in CL.data) {
      if (key.match(/apparatus\d*/g) !== null) {
        for (let i = 0; i < CL.data[key].length; i += 1) {
          unit = CL.data[key][i];
          if (matchedReadings.hasOwnProperty(unit._id)) {
            if ((alwaysCreateNewParent === true &&
                      matchedReadings[unit._id].length > 0) ||
                        matchedReadings[unit._id].length > 1) {
              for (let j = 0; j < matchedReadings[unit._id].length; j += 1) {
                newParent = JSON.parse(JSON.stringify(parentBlueprint)); //copy our blueprint
                parentId = CL.addReadingId(newParent, unit.start, unit.end);
                unit.readings.push(newParent);
                reading = CL.findReadingById(unit, matchedReadings[unit._id][j].reading_id);
                // sometimes because we have lost subreadings standoff readings might no longer exist in
                // this pass through. Somehow this still works!
                if (reading) {
                  if (matchedReadings[unit._id][j].hasOwnProperty('subreadings')) {
                    CL.makeStandoffReading('none',
                                           {'app_id': key,
                                            'unit_id': unit._id,
                                            'unit_pos': i,
                                            'reading_id': matchedReadings[unit._id][j].reading_id},
                                            parentId, undefined, true);
                  } else {
                    CL.doMakeStandoffReading('none', key, unit, reading, newParent);
                  }
                }
              }
            }
          }
        }
      }
    }
    SR.loseSubreadings();
    SR.findSubreadings();
    SR.loseSubreadings();
  };


  if (testing) {
    return {
      //variables
      undoStack: undoStack,

      //functions
      showOrderReadings: showOrderReadings,
      showApprovedVersion: showApprovedVersion,
      getUnitData: getUnitData,
      relabelReadings: relabelReadings,
      addLabels: addLabels,
      makeStandoffReading: makeStandoffReading,
      removeSplits: removeSplits,
      mergeSharedExtentOverlaps: mergeSharedExtentOverlaps,
      mergeSharedOverlapReadings: mergeSharedOverlapReadings,
      canUnitMoveTo: canUnitMoveTo,
      addToUndoStack: addToUndoStack,
      makeWasGapWordsGaps: makeWasGapWordsGaps,
      mergeAllLacs: mergeAllLacs,
      mergeAllOms: mergeAllOms,
      redipsInitOrderReadings: redipsInitOrderReadings,
      reorderRows: reorderRows,
      editLabel: editLabel,


      // private for testing
      _mergeAllSuppliedEmptyReadings: _mergeAllSuppliedEmptyReadings,

    };
  } else {
    return {
      //variables
      undoStack: undoStack,

      //functions
      showOrderReadings: showOrderReadings,
      showApprovedVersion: showApprovedVersion,
      getUnitData: getUnitData,
      relabelReadings: relabelReadings,
      addLabels: addLabels,
      makeStandoffReading: makeStandoffReading,
      removeSplits: removeSplits,
      mergeSharedExtentOverlaps: mergeSharedExtentOverlaps,
      mergeSharedOverlapReadings: mergeSharedOverlapReadings,
      canUnitMoveTo: canUnitMoveTo,
      addToUndoStack: addToUndoStack,
      makeWasGapWordsGaps: makeWasGapWordsGaps,
      mergeAllLacs: mergeAllLacs,
      mergeAllOms: mergeAllOms,
      redipsInitOrderReadings: redipsInitOrderReadings,
      reorderRows: reorderRows,
      editLabel: editLabel,

    };
  }
}());
