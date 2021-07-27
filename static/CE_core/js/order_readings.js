/*jshint esversion: 6 */
var testing;
OR = (function() {
  "use strict";

  //public variable declarations
  let undoStack = [];

  //private variable declarations
  let _undoStackLength = 6;

  //public function declarations
  let showOrderReadings, showApprovedVersion, getUnitData, relabelReadings, reorderRows, editLabel,
  addLabels, makeStandoffReading, removeSplits, mergeSharedExtentOverlaps, mergedSharedOverlapReadings,
  canUnitMoveTo, addToUndoStack, makeWasGapWordsGaps, mergeAllLacs, mergeAllOms, redipsInitOrderReadings;

  //private function declarations
  let _uniqueifyIds, _approveVerse, _getSiglaSuffixes, _doGetSiglaSuffixes,
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
    var html, i, highest_unit, header, triangles, row, label, key, overlaps, app_ids, footer_html,
      num, temp, event_rows, scroll_offset, overlap_options, new_overlap_options, container,
      undo_button, show_hide_subreadings_button_text;
    //console.log(CL.data);
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
    highest_unit = header[1];
    html.push.apply(html, temp[0]);
    overlap_options = {
      'column_lengths': temp[1]
    };
    if (options.hasOwnProperty('highlighted_wit')) {
      overlap_options.highlighted_wit = options.highlighted_wit;
    }
    if (options.hasOwnProperty('highlighted_unit')) {
      overlap_options.highlighted_unit = options.highlighted_unit;
    }
    app_ids = CL.getOrderedAppLines();
    for (i = 0; i < app_ids.length; i += 1) {
      num = app_ids[i].replace('apparatus', '');
      new_overlap_options = SV.calculateUnitLengths(app_ids[i], overlap_options);
      overlaps = CL.getOverlapLayout(CL.data[app_ids[i]], num, 'reorder', header[1], new_overlap_options);
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
      undo_button = '<button class="pure-button right_foot" id="undo_button">undo</button>';
    } else {
      undo_button = '';
    }
    //sort out footer stuff
    if (CL.showSubreadings === true) {
      show_hide_subreadings_button_text = 'hide non-edition subreadings';
    } else {
      show_hide_subreadings_button_text = 'show non-edition subreadings';
    }
    footer_html = [];
    if (CL.project.hasOwnProperty('showCollapseAllUnitsButton') && CL.project.showCollapseAllUnitsButton === true) {
      footerHtml.push('<button class="pure-button left_foot" id="expand_collapse_button">collapse all</button>');
    }
    footer_html.push('<button class="pure-button left_foot" id="show_hide_subreadings_button">' + show_hide_subreadings_button_text + '</button>');
    footer_html.push('<span id="extra_buttons"></span>');
    footer_html.push('<span id="stage_links"></span>');

    if (CL.managingEditor === true) {
      footer_html.push('<button class="pure-button right_foot" id="approve">Approve</button>');
    }
    footer_html.push('<button class="pure-button right_foot" id="save">Save</button>');
    footer_html.push('<select class="right_foot" id="highlighted" name="highlighted"></select>');
    footer_html.push(undo_button);
    $('#footer').addClass('pure-form'); //this does the styling of the select elements in the footer using pure (they cannot be styled individually)
    document.getElementById('footer').innerHTML = footer_html.join('');
    CL.addExtraFooterButtons('ordered');
    CL.addStageLinks();
    spinner.removeLoadingOverlay();
    CL.addTriangleFunctions('table');
    cforms.populateSelect(CL.getHandsAndSigla(), document.getElementById('highlighted'), {'value_key': 'document', 'text_keys': 'hand', 'selected': options.highlighted_wit, 'add_select': true, 'select_label_details': {'label': 'highlight witness', 'value': 'none' }});
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
    for (i = 0; i < highest_unit; i += 1) {
      if (document.getElementById('drag_unit_' + i) !== null) {
        redipsInitOrderReadings('drag_unit_' + i);
      }
    }
    for (key in CL.data) {
      if (CL.data.hasOwnProperty(key)) {
        if (key.match(/apparatus\d/g) !== null) {
          for (i = 0; i < CL.data[key].length; i += 1) {
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
    event_rows = temp[2];
    for (i = 0; i < event_rows.length; i += 1) {
      row = document.getElementById(event_rows[i]);
      if (row !== null) {
        CL.addHoverEvents(row);
      }
    }
  };

  showApprovedVersion = function(options) {
    var html, i, highest_unit, header, triangles, row, label, key, overlaps, app_ids, footer_html, num, temp,
      event_rows, scroll_offset, overlap_options, new_overlap_options, container, show_hide_subreadings_button_text;
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
    highest_unit = header[1];
    html.push.apply(html, temp[0]);
    overlap_options = {
      'column_lengths': temp[1]
    };
    if (options.hasOwnProperty('highlighted_wit')) {
      overlap_options.highlighted_wit = options.highlighted_wit;
    }
    if (options.hasOwnProperty('highlighted_unit')) {
      overlap_options.highlighted_unit = options.highlighted_unit;
    }
    app_ids = CL.getOrderedAppLines();
    for (i = 0; i < app_ids.length; i += 1) {
      num = app_ids[i].replace('apparatus', '');
      new_overlap_options = SV.calculateUnitLengths(app_ids[i], overlap_options);
      overlaps = CL.getOverlapLayout(CL.data[app_ids[i]], num, 'reorder', header[1], new_overlap_options);
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
    //sort out footer stuff
    if (CL.showSubreadings === true) {
      show_hide_subreadings_button_text = 'hide non-edition subreadings';
    } else {
      show_hide_subreadings_button_text = 'show non-edition subreadings';
    }
    footer_html = [];
    if (CL.project.hasOwnProperty('showCollapseAllUnitsButton') && CL.project.showCollapseAllUnitsButton === true) {
      footerHtml.push('<button class="pure-button left_foot" id="expand_collapse_button">collapse all</button>');
    }
    footer_html.push('<button class="pure-button left_foot" id="show_hide_subreadings_button">' + show_hide_subreadings_button_text + '</button>');
    footer_html.push('<span id="extra_buttons"></span>');
    footer_html.push('<span id="stage_links"></span>');
    if (CL.project.showGetApparatusButton === true) {
      footer_html.push('<button class="pure-button right_foot" id="get_apparatus">Get apparatus</button>');
    }
    footer_html.push('<select class="right_foot" id="highlighted" name="highlighted"></select>');
    document.getElementById('footer').innerHTML = footer_html.join('');
    CL.addExtraFooterButtons('approved');
    CL.addStageLinks();
    spinner.removeLoadingOverlay();
    CL.addTriangleFunctions('table');
    cforms.populateSelect(CL.getHandsAndSigla(),
                          document.getElementById('highlighted'),
                          {'value_key': 'document',
                           'text_keys': 'hand',
                           'selected': options.highlighted_wit,
                           'add_select': true,
                           'select_label_details': {'label': 'highlight witness', 'value': 'none' }});
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
    event_rows = temp[2];
    for (i = 0; i < event_rows.length; i += 1) {
      row = document.getElementById(event_rows[i]);
      CL.addHoverEvents(row);
    }
  };

  getUnitData = function(data, id, start, end, options) {
    var html, j, decisions, rows, cells, row_list, temp, events, max_length, row_id, type, overlapped, has_context_menu,
      subrow_id, colspan, hand, OR_rules, key, reading_label, label_suffix, reading_suffix, text, label, overlap;
    html = [];
    row_list = [];
    has_context_menu = true;
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
    OR_rules = CL.getRuleClasses(undefined, undefined, 'value', ['identifier', 'keep_as_main_reading', 'suffixed_label', 'suffixed_reading']);
    for (key in OR_rules) {
      if (OR_rules.hasOwnProperty(key) && OR_rules[key][1] === false) {
        delete OR_rules[key];
      }
    }
    if (_areAllEmptyReadings(data) && !options.hasOwnProperty('created')) {
      html.push('<td class="redips-mark start_' + start + ' " colspan="' + colspan + '"><div class="drag_div deletable" id="drag_unit_' + id + '">');
    } else {
      html.push('<td class="redips-mark start_' + start + ' " colspan="' + colspan + '"><div class="drag_div" id="drag_unit_' + id + '">');
    }
    if (!overlap) {
      html.push('<table class="variant_unit" id="variant_unit_' + id + '">');
    } else {
      html.push('<table class="variant_unit overlap_unit" id="variant_unit_' + id + '">');
    }
    for (let i = 0; i < data.length; i += 1) {
      //what is the reading text?
      if (data[i].type === 'lac') {
        has_context_menu = false;
      } else {
        has_context_menu = true;
      }
      text = CL.extractDisplayText(data[i], i, data.length, options.unit_id, options.app_id);
      if (text.indexOf('system_gen_') !== -1) {
        has_context_menu = false;
        text = text.replace('system_gen_', '');
      }
      data[i].text_string = text;
      //what labels need to be used?
      reading_label = CL.getReadingLabel(i, data[i], OR_rules);
      reading_suffix = CL.getReadingSuffix(data[i], OR_rules);
      //what is the row id? (and add it to the list for adding events)
      row_id = 'variant_unit_' + id + '_row_' + i;
      row_list.push(row_id);

      if (i === 0) {
        html.push('<tr><td colspan="3" class="redips-mark"><span id="toggle_variant_' + id + '" class="triangle">&#9650;</span></td></tr>');
        if (data[i].witnesses.indexOf(hand) != -1) {
          html.push('<tr id="' + row_id + '" class="top highlighted">');
        } else {
          html.push('<tr id="' + row_id + '" class="top">');
        }
        html.push('<td class="redips-mark"></td>');
      } else {
        if (data[i].witnesses.indexOf(hand) != -1) {
          html.push('<tr id="' + row_id + '" class="highlighted">');
        } else {
          html.push('<tr id="' + row_id + '">');
        }
        html.push('<td class="redips-rowhandler"><div class="redips-drag redips-row">+</div></td>');
      }

      html.push('<td id="' + row_id + '_label" class="reading_label redips-mark"><div class="spanlike">' + reading_label);
      html.push('</div></td>');
      if (!overlap) {
        if (has_context_menu) {
          html.push('<td class="redips-mark main_reading">');
        } else {
          html.push('<td class="redips-mark main_reading_ncm">');
        }
      } else {
        if (has_context_menu) {
          html.push('<td class="redips-mark overlap_main_reading">');
        } else {
          html.push('<td class="redips-mark overlap_main_reading_ncm">');
        }
      }
      html.push('<div class="spanlike">');
      html.push(text);
      if (reading_suffix !== '') {
        html.push(' ' + reading_suffix);
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
        row_list.push.apply(row_list, temp[1]);
        html.push('</table>');
      }
      html.push('</td>');
      html.push('</tr>');
    }
    html.push('</table>');
    html.push('</div></td>');
    return [html, row_list];
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
        //TODO: replace with proper string match
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
      document.getElementById('scroller').scrollTop
    ];
    addToUndoStack(CL.data);
    apparatus = readingDetails.app_id;
    unit = CL.findUnitById(apparatus, readingDetails.unit_id);
    callback = function () {
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
    mergedSharedOverlapReadings();

  };

  // Merges any shared readings in overlap units. Most, if not all, will have been created in the process of adding
  // witnesses but it is possible that they could happen in the course of editing depending on the editor.
  mergedSharedOverlapReadings = function () {
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
  canUnitMoveTo = function(id, current_app_row, new_app_row) {
    var conflict_units, conflict;
    conflict_units = _getPotentialConflicts(id);
    conflict = false;
    if (conflict_units.length === 0) {
      return true;
    }
    if (!CL.data.hasOwnProperty('apparatus' + new_app_row)) {
      return false;
    }
    for (let i = 0; i < CL.data['apparatus' + new_app_row].length; i += 1) {
      if (conflict_units.indexOf(CL.data['apparatus' + new_app_row][i]._id) !== -1) {
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
    //only needed on top line because this is a feature of overlapping
    for (let i = 0; i < CL.data.apparatus.length; i += 1) {
      for (let j = 0; j < CL.data.apparatus[i].readings.length; j += 1) {
        if (CL.data.apparatus[i].readings[j].text.length === 1 && CL.data.apparatus[i].readings[j].text[0].hasOwnProperty('was_gap')) {
          //make it a real gap again
          CL.data.apparatus[i].readings[j].type = 'lac';
          CL.data.apparatus[i].readings[j].details = CL.data.apparatus[i].readings[j].text[0]['interface'].replace('&gt;', '').replace('&lt;', '');
          CL.data.apparatus[i].readings[j].text = [];
        }
      }
    }
  };

  //optional: can be set in services or project and when moving to OR or approved
  mergeAllLacs = function() {
    var typeList, parentTemplate;
    typeList = ['lac', 'lac_verse'];
    parentTemplate = {'created': true, 'type': 'lac', 'details': 'lac',
                      'text': [], 'witnesses': []};
    _mergeAllSuppliedEmptyReadings(typeList, parentTemplate, true);
  };

  //optional: can be set in services or project and when moving to OR or approved
  mergeAllOms = function() {
    var typeList, parentTemplate;
    typeList = ['om', 'om_verse'];
    parentTemplate = {'created': true, 'type': 'om', 'text': [], 'witnesses': []};
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
    var standoff_problems, extra_results;
    spinner.showLoadingOverlay();
    SR.loseSubreadings(); //for preparation and is needed
    standoff_problems = SV.checkStandoffReadingProblems();
    if (!standoff_problems[0]) {
      extra_results = CL.applyPreStageChecks('approve');
      if (extra_results[0] === true) {
        if (CL.project.combineAllLacsInApproved === true) {
					OR.mergeAllLacs();
				}
				if (CL.project.combineAllOmsInApproved === true) {
					OR.mergeAllOms();
				}
        CL.showSubreadings = false;
        //now do the stuff we need to do
        //make sure all ids are unique (we know there is a problem with overlapping a readings for example)
        delete CL.data.event_list;
        _uniqueifyIds();
        _orderWitnessesForOutput();
        SR.loseSubreadings(); //always lose before finding
        SR.findSubreadings({
          'rule_classes': CL.getRuleClasses('subreading', true, 'value', ['identifier', 'subreading'])
        });
        _getSiglaSuffixes();
        //at this point the saved approved version always and only ever has the correct subreadings shown
        //we don't have the option to show/hide subreadings in the interface so we can be sure they are always correct
        CL.saveCollation('approved', function() {
          showApprovedVersion({
            'container': CL.container
          });
        });
      } else {
        SR.loseSubreadings(); //always lose before finding
        if (CL.showSubreadings === true) {
          SR.findSubreadings();
        } else {
          SR.findSubreadings({
            'rule_classes': CL.getRuleClasses('subreading', true, 'value', ['identifier', 'subreading'])
          });
        }
        alert(extra_results[1]);
        spinner.removeLoadingOverlay();
      }
    } else if (standoff_problems[0]) {
      SR.loseSubreadings(); //always lose before finding
      if (CL.showSubreadings === true) {
        SR.findSubreadings();
      } else {
        SR.findSubreadings({
          'rule_classes': CL.getRuleClasses('subreading', true, 'value', ['identifier', 'subreading'])
        });
      }
      alert('You cannot approve this verse because ' + standoff_problems[1]);
      spinner.removeLoadingOverlay();
    }
  };

  _getSiglaSuffixes = function() {
      for (let key in CL.data) {
        if (CL.data.hasOwnProperty(key)) {
          if (key.indexOf('apparatus') != -1) {
            for (let i = 0; i < CL.data[key].length; i += 1) {
              for (let j = 0; j < CL.data[key][i].readings.length; j += 1) {
                CL.data[key][i].readings[j].suffixes = _doGetSiglaSuffixes(CL.data[key][i].readings[j], key, CL.data[key][i].start, CL.data[key][i].end, CL.data[key][i].first_word_index);
                if (CL.data[key][i].readings[j].hasOwnProperty('subreadings')) {
                  for (let type in CL.data[key][i].readings[j].subreadings) {
                    for (let k = 0; k < CL.data[key][i].readings[j].subreadings[type].length; k += 1) {
                      CL.data[key][i].readings[j].subreadings[type][k].suffixes = _doGetSiglaSuffixes(CL.data[key][i].readings[j].subreadings[type][k], key, CL.data[key][i].start, CL.data[key][i].end, CL.data[key][i].first_word_index);
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    _doGetSiglaSuffixes = function(data, app, start, end, first_word_index) {
      var readings_with_suffixes, suffixes;
      readings_with_suffixes = CL.getReadingWitnesses(data, app, start, end, first_word_index, true);
      suffixes = [];
      data.witnesses = CL.sortWitnesses(data.witnesses);
      for (let i = 0; i < readings_with_suffixes.length; i += 1) {
        suffixes.push(readings_with_suffixes[i].replace(data.witnesses[i].replace('_private', ''), ''));
      }
      return suffixes;
    };

    _orderWitnessesForOutput = function() {
      for (let key in CL.data) {
        if (CL.data.hasOwnProperty(key)) {
          if (key.indexOf('apparatus') != -1) {
            for (let i = 0; i < CL.data[key].length; i += 1) {
              for (let j = 0; j < CL.data[key][i].readings.length; j += 1) {
                CL.data[key][i].readings[j].witnesses = CL.sortWitnesses(CL.data[key][i].readings[j].witnesses);
                if (CL.data[key][i].readings[j].hasOwnProperty('subreadings')) {
                  for (let type in CL.data[key][i].readings[j].subreadings) {
                    for (let k = 0; k < CL.data[key][i].readings[j].subreadings[type].length; k += 1) {
                      CL.data[key][i].readings[j].subreadings[type][k].witnesses = CL.sortWitnesses(CL.data[key][i].readings[j].subreadings[type][k].witnesses);
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

    _getSubunitData = function(data, parent_index, parent_id, parent_label, subtype, hand, overlapped) {
      var row_type_id, rowList, html, subrow_id;
      rowList = [];
      html = [];
      row_type_id = 'subrow';
      for (let type in data) {
        if (data.hasOwnProperty(type)) {
          for (let i = 0; i < data[type].length; i += 1) {
            subrow_id = 'subreading_unit_' + parent_id + '_row_' + parent_index + '_type_' + type + '_' + row_type_id + '_' + i;
            rowList.push(subrow_id);
            if (data[type][i].witnesses.indexOf(hand) != -1) {
              html.push('<tr class="' + subtype + ' highlighted" id="' + subrow_id + '">');
            } else {
              html.push('<tr class="' + subtype + '" id="' + subrow_id + '">');
            }
            if (parent_label === 'zz') {
              html.push('<td></td>');
            } else if (overlapped === true) {
              html.push('<td></td>');
            } else {
              html.push('<td><div class="spanlike">' + parent_label + data[type][i].suffix + '.</td></td>');
            }
            html.push('<td><div class="spanlike">' + data[type][i].text_string + '</div></td>');
            html.push('</tr>');
          }
        }
      }
      return [html, rowList];
    };

    editLabel = function(rdg_details, menu_pos, saveFunction) {
      var left, top, label_form, html, new_label, reading, current_label;
      left = menu_pos.left;
      top = menu_pos.top;
      label_form = document.createElement('div');
      reading = CL.data[rdg_details[1]][rdg_details[0]].readings[rdg_details[2]];
      current_label = reading.label;
      label_form.setAttribute('id', 'label_form');
      label_form.setAttribute('class', 'label_form');
      html = [];
      html.push('<div class="dialogue_form_header drag-zone">Edit Label</div>')
      html.push('<form id="label_change_form">');
      html.push('<label for="new_label">new label:<br/><input type="text" id="new_label"/></label><br/><br/>');
      html.push('<input class="pure-button dialogue-form-button" id="close_label_button" type="button" value="Cancel"/>');
      html.push('<input class="pure-button dialogue-form-button" id="save_label_button" type="button" value="Save"/>');
      html.push('</form>');
      label_form.innerHTML = html.join('');
      document.getElementsByTagName('body')[0].appendChild(label_form);

      //the +25 here is to move it out of the way of the other labels and readings so you can still see them
      left = parseInt(left) - document.getElementById('scroller').scrollLeft + 25;
      top = parseInt(top) - document.getElementById('scroller').scrollTop;
      document.getElementById('label_form').style.left = left + 'px';
      document.getElementById('label_form').style.top = top + 'px';
      document.getElementById('new_label').value = current_label; //populate field with current label value
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
          new_label = document.getElementById('new_label').value.replace(/\s+/g, '');
          if (new_label != '') {
            _manualChangeLabel(rdg_details, new_label);
          }
        });
      }
    };

    _manualChangeLabel = function(rdg_details, new_label) {
      var reading, scroll_offset;
      scroll_offset = [document.getElementById('scroller').scrollLeft,
        document.getElementById('scroller').scrollTop
      ];
      addToUndoStack(CL.data);
      reading = CL.data[rdg_details[1]][rdg_details[0]].readings[rdg_details[2]];
      reading.label = new_label;
      document.getElementsByTagName('body')[0].removeChild(document.getElementById('label_form'));
      showOrderReadings({
        'container': CL.container
      });
      document.getElementById('scroller').scrollLeft = scroll_offset[0];
      document.getElementById('scroller').scrollTop = scroll_offset[1];
    };

    /** highlight a witness, called from select box in page footer*/
    _highlightWitness = function(witness, stage) {
      var scroll_offset;
      scroll_offset = [document.getElementById('scroller').scrollLeft,
        document.getElementById('scroller').scrollTop
      ];
      CL.highlighted = witness;
      if (stage === 'approved') {
        showApprovedVersion({
          'container': CL.container,
          'highlighted_wit': witness
        });
      } else {
        showOrderReadings({
          'container': CL.container,
          'highlighted_wit': witness
        });
      }
      document.getElementById('scroller').scrollLeft = scroll_offset[0];
      document.getElementById('scroller').scrollTop = scroll_offset[1];
      if (witness !== 'none') {
        CL.getHighlightedText(witness);
      }
    };

    _makeMenu = function(menu_name) {
      var menu, div, key, subreadings, OR_rules;
      div = document.createElement('div');
      //menus for full units
      if (menu_name === 'subreading') {
        document.getElementById('context_menu').innerHTML = '<li id="unmark_sub"><span>Make main reading</span></li>';
      } else if (menu_name === 'deletable_unit') {
        document.getElementById('context_menu').innerHTML = '<li id="delete_unit"><span>Delete unit</span></li>';
      } else if (menu_name === 'main_reading' || menu_name === 'overlap_main_reading') {
        menu = [];
        menu.push('<li id="split_witnesses"><span>Split Witnesses</span></li>');
        subreadings = [];
        OR_rules = CL.getRuleClasses('create_in_OR', true, 'name', ['subreading', 'value', 'identifier', 'keep_as_main_reading']);
        for (key in OR_rules) {
          if (OR_rules.hasOwnProperty(key)) {
            if (OR_rules[key][0]) {
              subreadings.push([key, OR_rules[key][1], OR_rules[key][2]]);
            } else if (OR_rules[key][3]) {
              menu.push('<li id="mark_as_' + OR_rules[key][1] + '"><span>Mark/Unmark as ' + key + '</span></li>');
            } else {
              menu.push('<li id="mark_as_' + OR_rules[key][1] + '"><span>Mark as ' + key + '</span></li>');
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
          menu.push('<li id="mark_as_ORsubreading"><span>Mark as subreading</span></li>');
        }
        document.getElementById('context_menu').innerHTML = menu.join('');
      } else if (menu_name === 'overlap_unit') {
        document.getElementById('context_menu').innerHTML = '<li id="move_up"><span>Move unit up</span></li><li id="move_down"><span>Move unit down</span></li>';
      } else if (menu_name === 'reading_label') {
        document.getElementById('context_menu').innerHTML = '<li id="edit_label"><span>Edit label</span></li>';
      }
      _addContextMenuHandlers();
      return 'context_menu';
    };

    _makeMainReading = function(id_string) {
      var scroll_offset, unit_number, app_id, unit, subtype, parent_pos, subreading_pos, parent_reading,
        subreading, options;
      scroll_offset = [document.getElementById('scroller').scrollLeft,
        document.getElementById('scroller').scrollTop
      ];
      addToUndoStack(CL.data);

      if (id_string.indexOf('_app_') === -1) {
        app_id = 'apparatus';
        unit_number = parseInt(id_string.substring(id_string.indexOf('unit_') + 5, id_string.indexOf('_row_')));
      } else {
        unit_number = parseInt(id_string.substring(id_string.indexOf('unit_') + 5, id_string.indexOf('_app_')));
        app_id = 'apparatus' + id_string.substring(id_string.indexOf('_app_') + 5, id_string.indexOf('_row_'));
      }
      unit = CL.data[app_id][unit_number];
      subtype = id_string.substring(id_string.indexOf('_type_') + 6, id_string.indexOf('_subrow_'));
      parent_pos = parseInt(id_string.substring(id_string.indexOf('_row_') + 5, id_string.indexOf('_type_')));
      subreading_pos = parseInt(id_string.substring(id_string.indexOf('_subrow_') + 8));
      parent_reading = unit.readings[parent_pos];
      subreading = parent_reading.subreadings[subtype][subreading_pos];
      options = {
        'delete_offset': true
      };
      CL.makeMainReading(unit, parent_reading, subtype, subreading_pos, options);
      SV.prepareForOperation();
      SV.unsplitUnitWitnesses(unit_number, app_id);
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
      document.getElementById('scroller').scrollLeft = scroll_offset[0];
      document.getElementById('scroller').scrollTop = scroll_offset[1];
    };

    _getDeleteUnit = function(unit) {
      var scroll_offset, details, id;
      scroll_offset = [document.getElementById('scroller').scrollLeft,
        document.getElementById('scroller').scrollTop
      ];
      addToUndoStack(CL.data);
      details = CL.getUnitAppReading(unit.id);
      id = CL.data[details[1]][details[0]]._id;
      _deleteUnit(details[1], id);
      showOrderReadings({
        'container': CL.container
      });
      document.getElementById('scroller').scrollLeft = scroll_offset[0];
      document.getElementById('scroller').scrollTop = scroll_offset[1];
    };

    _moveOverlapUp = function(unit) {
      var details, id, app_num, is_space, i, key, scroll_offset,
        current_loc, new_loc;
      scroll_offset = [document.getElementById('scroller').scrollLeft,
        document.getElementById('scroller').scrollTop
      ];
      addToUndoStack(CL.data);
      details = CL.getUnitAppReading(unit.id);
      id = CL.data[details[1]][details[0]]._id;
      app_num = parseInt(details[1].replace('apparatus', ''));
      current_loc = app_num;
      new_loc = app_num - 1;
      //console.log('I would like to move a unit from ' + current_loc + ' to ' + new_loc);
      is_space = canUnitMoveTo(id, current_loc, new_loc);
      if (!is_space) {
        //then renumber all app lines from the one want to move to onwards to create a gap above the one we are looking for a space in
        //NB this will involve renumbering the line our current unit is in
        //console.log('renumber from ' + (app_num-3) + ' starting with number ' + app_num)
        _throughNumberApps(app_num, app_num - 3);
        CL.data['apparatus' + new_loc] = [];
        current_loc = app_num + 1;
      }
      //now move the unit to where we want it (we have already created the space if it was required)
      for (i = 0; i < CL.data['apparatus' + current_loc].length; i += 1) {
        if (CL.data['apparatus' + current_loc][i]._id === id) {
          CL.data['apparatus' + new_loc].push(JSON.parse(JSON.stringify(CL.data['apparatus' + current_loc][i])));
          CL.data['apparatus' + new_loc].sort(_compareStartIndexes);
          CL.data['apparatus' + current_loc][i] = null;
        }
      }
      CL.removeNullItems(CL.data['apparatus' + current_loc]);
      for (key in CL.data) {
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
      document.getElementById('scroller').scrollLeft = scroll_offset[0];
      document.getElementById('scroller').scrollTop = scroll_offset[1];
    };

    _compareStartIndexes = function(a, b) {
      return a.start - b.start;
    };

    _moveOverlapDown = function(unit) {
      var details, id, scroll_offset, app_num, current_loc, new_loc,
        is_space, i, key;
      scroll_offset = [document.getElementById('scroller').scrollLeft,
        document.getElementById('scroller').scrollTop
      ];
      addToUndoStack(CL.data);
      details = CL.getUnitAppReading(unit.id);
      id = CL.data[details[1]][details[0]]._id;
      app_num = parseInt(details[1].replace('apparatus', ''));
      current_loc = app_num;
      new_loc = app_num + 1;
      //console.log('I would like to move a unit from ' + current_loc + ' to ' + new_loc);
      //if there is no line there add one now
      if (!CL.data.hasOwnProperty('apparatus' + new_loc)) {
        //console.log('I need to add a new line which is ' + new_loc)
        CL.data['apparatus' + new_loc] = [];
      }
      is_space = canUnitMoveTo(id, current_loc, new_loc);
      if (!is_space) {
        //console.log('renumber from ' + (app_num) + ' starting with number ' + (app_num + 3))
        _throughNumberApps(app_num + 3, app_num);
        new_loc = new_loc + 1;
        CL.data['apparatus' + new_loc] = [];
      }
      //now move the unit to where we want it (we have already created the space if it was required)
      for (i = 0; i < CL.data['apparatus' + current_loc].length; i += 1) {
        if (CL.data['apparatus' + current_loc][i]._id === id) {
          CL.data['apparatus' + new_loc].push(JSON.parse(JSON.stringify(CL.data['apparatus' + current_loc][i])));
          CL.data['apparatus' + new_loc].sort(_compareStartIndexes);
          CL.data['apparatus' + current_loc][i] = null;
        }
      }
      CL.removeNullItems(CL.data['apparatus' + current_loc]);
      for (key in CL.data) {
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
      document.getElementById('scroller').scrollLeft = scroll_offset[0];
      document.getElementById('scroller').scrollTop = scroll_offset[1];
    };

    _addContextMenuHandlers = function() {
      var OR_rules, key, rule, rule_name, subtype, parent_pos, subreading_pos,
        parent_reading, subreading;
      if (document.getElementById('unmark_sub')) {
        $('#unmark_sub').off('click.ums_c');
        $('#unmark_sub').off('mouseover.ums_mo');
        $('#unmark_sub').on('click.ums_c', function(event) {
          var element, row_elem;
          element = SimpleContextMenu._target_element;
          row_elem = CL.getSpecifiedAncestor(element, 'TR');
          //row_elem = element.parentNode;
          _makeMainReading(row_elem.id);
        });
        $('#unmark_sub').on('mouseover.ums_mo', function(event) {
          CL.hideTooltip();
        });
      }
      if (document.getElementById('split_witnesses')) {
        $('#split_witnesses').off('click.sw_c');
        $('#split_witnesses').off('mouseover.sw_mo');
        $('#split_witnesses').on('click.sw_c', function(event) {
          var element, div, reading_details;
          element = SimpleContextMenu._target_element;
          div = CL.getSpecifiedAncestor(element, 'TR');
          reading_details = CL.getUnitAppReading(div.id);
          SV.splitReadingWitnesses(reading_details, 'order_readings', {
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
          var element, label_cell, rdg_details;
          element = SimpleContextMenu._target_element;
          label_cell = CL.getSpecifiedAncestor(element, 'TD');
          rdg_details = CL.getUnitAppReading(label_cell.id);
          editLabel(rdg_details, {
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
      OR_rules = CL.getRuleClasses('create_in_OR', true, 'name', ['subreading', 'value', 'identifier', 'keep_as_main_reading']);
      for (key in OR_rules) {
        if (OR_rules.hasOwnProperty(key)) {
          if (!OR_rules[key][0]) {
            if (document.getElementById('mark_as_' + OR_rules[key][1])) {
              _addEvent(OR_rules, key);
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
          var element, app_id, div, unit, unit_pos, rdg_details, reading_pos, reading, reading_details;
          element = SimpleContextMenu._target_element;
          div = CL.getSpecifiedAncestor(element, 'TR');
          rdg_details = CL.getUnitAppReading(div.id);
          unit_pos = rdg_details[0];
          app_id = rdg_details[1];
          reading_pos = rdg_details[2];
          unit = CL.data[app_id][unit_pos];
          reading = unit.readings[reading_pos];
          reading_details = {
            'app_id': app_id,
            'unit_id': unit._id,
            'unit_pos': unit_pos,
            'reading_pos': reading_pos,
            'reading_id': reading._id
          };
          CL.markStandoffReading(key, 'Subreading', reading_details, 'order_readings', {
            'top': SimpleContextMenu._menuElement.style.top,
            'left': SimpleContextMenu._menuElement.style.left
          });
        });
        $('#mark_as_' + key).on('mouseover.' + key + '_mo', function(event) {
          CL.hideTooltip();
        });
      } else {
        for (key in OR_rules) {
          if (OR_rules.hasOwnProperty(key)) {
            if (OR_rules[key][0]) {
              if (document.getElementById('mark_as_' + OR_rules[key][1])) {
                rule = JSON.parse(JSON.stringify(OR_rules[key]));
                rule_name = key;
                //mark the reading as subreading
                $('#mark_as_' + OR_rules[key][1]).off('click.' + key + '_c');
                $('#mark_as_' + OR_rules[key][1]).off('mouseover.' + key + '_mo');
                $('#mark_as_' + OR_rules[key][1]).on('click.' + key + '_c', function(event) {
                  var element, div, unit, unit_pos, rdg_details, reading_pos, reading, reading_details, app_id;
                  element = SimpleContextMenu._target_element;
                  div = CL.getSpecifiedAncestor(element, 'TR');
                  rdg_details = CL.getUnitAppReading(div.id);
                  unit_pos = rdg_details[0];
                  app_id = rdg_details[1];
                  reading_pos = rdg_details[2];
                  unit = CL.data[app_id][unit_pos];
                  reading = unit.readings[reading_pos];
                  reading_details = {
                    'app_id': app_id,
                    'unit_id': unit._id,
                    'unit_pos': unit_pos,
                    'reading_pos': reading_pos,
                    'reading_id': reading._id
                  };
                  CL.markStandoffReading(rule[1], rule_name, reading_details, 'order_readings', {
                    'top': SimpleContextMenu._menuElement.style.top,
                    'left': SimpleContextMenu._menuElement.style.left
                  });
                });
                $('#mark_as_' + OR_rules[key][1]).on('mouseover.' + key + '_mo', function(event) {
                  CL.hideTooltip();
                });
              }
            }
          }
        }
      }
    };

    /**adds the correct handler depending on subreading and keep_as_main_reading settings in the project rule configurations */
    _addEvent = function(OR_rules, key) {
      //if this reading is not marked to be kept as a main reading then use stand_off marking
      if (!OR_rules[key][3]) {
        $('#mark_as_' + OR_rules[key][1]).off('click.' + key + '_c');
        $('#mark_as_' + OR_rules[key][1]).off('mouseover.' + key + '_mo');
        $('#mark_as_' + OR_rules[key][1]).on('click.' + key + '_c', function(event) {
          var element, div, rdg_details, unit, unit_pos, reading_pos, reading, reading_details, app_id;
          element = SimpleContextMenu._target_element;
          div = CL.getSpecifiedAncestor(element, 'TR');
          rdg_details = CL.getUnitAppReading(div.id);
          unit_pos = rdg_details[0];
          app_id = rdg_details[1];
          reading_pos = rdg_details[2];
          unit = CL.data[app_id][unit_pos];
          reading = unit.readings[reading_pos];
          reading_details = {
            'app_id': app_id,
            'unit_id': unit._id,
            'unit_pos': unit_pos,
            'reading_pos': reading_pos,
            'reading_id': reading._id
          };
          CL.markStandoffReading(OR_rules[key][1], key, reading_details, 'order_readings', {
            'top': SimpleContextMenu._menuElement.style.top,
            'left': SimpleContextMenu._menuElement.style.left
          });
        });
        $('#mark_as_' + OR_rules[key][1]).on('mouseover.' + key + '_mo', function(event) {
          CL.hideTooltip();
        });
      } else {
        //else just add the marker and allow its removal
        $('#mark_as_' + OR_rules[key][1]).off('click.' + key + '_c');
        $('#mark_as_' + OR_rules[key][1]).off('mouseover.' + key + '_mo');
        $('#mark_as_' + OR_rules[key][1]).on('click.' + key + '_c', function(event) {
          var element, div, rdg_details, reading_pos, reading, app_id, unit_pos;
          element = SimpleContextMenu._target_element;
          div = CL.getSpecifiedAncestor(element, 'TR');
          rdg_details = CL.getUnitAppReading(div.id);
          unit_pos = rdg_details[0];
          app_id = rdg_details[1];
          reading_pos = rdg_details[2];
          reading = CL.data[app_id][unit_pos].readings[reading_pos];
          _markReading(OR_rules[key][1], reading);
        });
        $('#mark_as_' + OR_rules[key][1]).on('mouseover.' + key + '_mo', function(event) {
          CL.hideTooltip();
        });
      }
    };

    _markReading = function(value, reading) {
      var scroll_offset;
      scroll_offset = [document.getElementById('scroller').scrollLeft,
        document.getElementById('scroller').scrollTop
      ];
      CL.markReading(value, reading);
      showOrderReadings({
        'container': CL.container
      });
      document.getElementById('scroller').scrollLeft = scroll_offset[0];
      document.getElementById('scroller').scrollTop = scroll_offset[1];
    };

    redipsInitOrderReadings = function(id, onDropFunction) {
      var rd = REDIPS.drag;
      rd.init(id);
      if (onDropFunction !== undefined) {
        rd.event.rowDropped =  onDropFunction;
      } else {
        rd.event.rowDropped = function() {
          var scroll_offset
          addToUndoStack(CL.data);
          reorderRows(rd);
          scroll_offset = document.getElementById('scroller').scrollLeft;
          showOrderReadings({
            'container': CL.container
          });
          document.getElementById('scroller').scrollLeft = scroll_offset;
        };
      }
    };

    reorderRows = function(rd) {
      var table, rows, readings, order, new_order, reading, reading_id, unit, scroll_offset, temp, app;
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
          reading_id = rows[i].id;
          order.push(parseInt(reading_id.substring(reading_id.indexOf('row_') + 4), 10));
        }
      }
      readings = CL.data[app][unit].readings;
      delete CL.data[app][unit].readings;
      readings = _sortArrayByIndexes(readings, order);
      relabelReadings(readings, true);
      CL.data[app][unit].readings = readings;
      // scroll_offset = document.getElementById('scroller').scrollLeft;
      // showOrderReadings({
      //   'container': CL.container
      // });
      // document.getElementById('scroller').scrollLeft = scroll_offset;
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
        CL.services.getApparatusForContext(function () {spinner.removeLoadingOverlay();});
      } else {
        var url;
        spinner.showLoadingOverlay();
        url = CL.services.apparatusServiceUrl;
        $.fileDownload(url, {
          httpMethod: "POST",
          data: {
            settings: CL.getExporterSettings(),
            data: JSON.stringify([{
              "context": CL.context,
              "structure": CL.data
            }])
          },
          successCallback: function() {
            spinner.removeLoadingOverlay();
          }
          //can also add a failCallback here if you want
        });
      }
    };

    /** prep stuff for loading into order readings */
    _compareOverlaps = function(a, b) {
      //always put overlap readings at the bottom (of their parent reading)
      if (a.hasOwnProperty('overlap')) {
        return 1;
      }
      if (b.hasOwnProperty('overlap')) {
        return -1;
      }
    };

    //through number all the overlapping apparatus lines from start_line with the
    //first number of the renumbered readings labeled as start_index
    //it is safe to assume that when we call this with a start_row value that all
    //app lines are thru numbered from 2 at the point we call it.
    _throughNumberApps = function(start_index, start_row) {
      var key, overlap_lines, i, m, renumber, j, all;
      all = false;
      if (typeof start_row === 'undefined') {
        all = true;
        start_row = 0;
      }
      overlap_lines = [];
      for (key in CL.data) {
        if (CL.data.hasOwnProperty(key)) {
          if (key.match(/apparatus\d+/) !== null) {
            m = key.match(/apparatus(\d+)/);
            overlap_lines.push(parseInt(m[1]));
          }
        }
      }
      overlap_lines.sort();
      if (all === false && start_index < overlap_lines[start_row]) {
        console.log('That operation is not allowed');
      } else {
        //see if we even need to renumber any app lines
        renumber = false;
        j = start_index;
        for (i = start_row; i < overlap_lines.length; i += 1) {
          if (overlap_lines[i] !== j) {
            renumber = true;
          }
          j += 1;
        }
        if (renumber === true) {
          //rename all the apparatus keys so we won't accidentally overwrite anything
          for (i = start_row; i < overlap_lines.length; i += 1) {
            if (CL.data.hasOwnProperty('apparatus' + overlap_lines[i])) {
              CL.data['old_apparatus' + overlap_lines[i]] = CL.data['apparatus' + overlap_lines[i]];
              delete CL.data['apparatus' + overlap_lines[i]];
            }
          }
          j = start_index;
          //now through number them as we want
          for (i = start_row; i < overlap_lines.length; i += 1) {
            if (CL.data.hasOwnProperty('old_apparatus' + overlap_lines[i])) {
              CL.data['apparatus' + j] = CL.data['old_apparatus' + overlap_lines[i]];
              delete CL.data['old_apparatus' + overlap_lines[i]];
            }
            j += 1;
          }
        }
      }
    };

    //by this point we have added accurate start and end values for each unit so we can rely on them for testing overlaps
    //we added the correct start an end values in _horizontalCombineOverlaps
    _repositionOverlaps = function() {
      var key, m, overlap_lines, i, j, moving_start, moving_end, move_to, apparatus_line;
      overlap_lines = [];
      for (key in CL.data) {
        if (CL.data.hasOwnProperty(key)) {
          if (key.match(/apparatus\d+/) !== null) {
            m = key.match(/apparatus(\d+)/);
            overlap_lines.push(parseInt(m[1]));
          }
        }
      }
      overlap_lines.sort();
      //which is best - the algorithm below or using start and end in the overlaps themselves?
      //work from the second line of overlaps because the ones in the top line are already as high as they can be
      for (i = 1; i < overlap_lines.length; i += 1) {
        apparatus_line = CL.data['apparatus' + overlap_lines[i]];
        for (j = 0; j < apparatus_line.length; j += 1) {
          moving_start = apparatus_line[j].start;
          moving_end = apparatus_line[j].end;
          move_to = _unitCanMoveTo(apparatus_line[j]._id, overlap_lines, i);
          if (move_to !== -1) {
            CL.data['apparatus' + move_to].push(JSON.parse(JSON.stringify(apparatus_line[j])));
            CL.data['apparatus' + move_to].sort(_compareStartIndexes);
            apparatus_line[j] = null;
          }
        }
        CL.removeNullItems(apparatus_line);
      }
      //now delete any apparatus lines we don't need any more
      for (key in CL.data) {
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
      var i, ids, key;
      ids = [];
      for (i = 0; i < CL.data.apparatus.length; i += 1) {
        if (CL.data.apparatus[i].hasOwnProperty('overlap_units') &&
          CL.data.apparatus[i].overlap_units.hasOwnProperty(id)) {
          for (key in CL.data.apparatus[i].overlap_units) {
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
    _unitCanMoveTo = function(id, overlap_keys, current_app_row) {
      var conflict_units, i, j, conflict;
      conflict_units = _getPotentialConflicts(id);
      for (i = 0; i < current_app_row; i += 1) {
        conflict = false;
        if (conflict_units.length === 0) {
          //then there are no potential conflicts to move it as high as we can
          return overlap_keys[i];
        }
        for (j = 0; j < CL.data['apparatus' + overlap_keys[i]].length; j += 1) {
          if (conflict_units.indexOf(CL.data['apparatus' + overlap_keys[i]][j]._id) !== -1) {
            conflict = true;
          }
        }
        if (conflict === false) {
          return overlap_keys[i];
        }
      }
      return -1;
    };

    _findLeadUnit = function(ids, overlap_lines) {
      var i, j, k, unit;
      for (i = 0; i < overlap_lines.length; i += 1) {
        for (j = 0; j < CL.data['apparatus' + overlap_lines[i]].length; j += 1) {
          unit = CL.data['apparatus' + overlap_lines[i]][j];
          if (ids.indexOf(unit._id) !== -1) {
            //just return the id we find first (we are going through apparatus in order)
            return unit._id;
          }
        }
      }
      //we should have returned by now just in case best return something sensible
      return ids[0];
    };

    _deleteUnit = function(apparatus, unit_id) {
      var i;
      for (i = CL.data[apparatus].length - 1; i >= 0; i -= 1) {
        if (CL.data[apparatus][i]._id === unit_id) {
          CL.data[apparatus].splice(i, 1);
        }
      }
    };

    _undo = function() {
      var i, event_list, scroll_offset;
      if (OR.undoStack.length > 0) {
        scroll_offset = [document.getElementById('scroller').scrollLeft,
          document.getElementById('scroller').scrollTop
        ];
        event_list = CL.data.event_list;
        CL.data = JSON.parse(OR.undoStack.pop());
        showOrderReadings({
          'container': CL.container
        });
        document.getElementById('scroller').scrollLeft = scroll_offset[0];
        document.getElementById('scroller').scrollTop = scroll_offset[1];
      }
    };

    _findOverlapApparatusAndUnitById = function(id) {
      var app_id, key, unit;
      unit = null;
      for (key in CL.data) {
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
    _horizontalCombineOverlaps = function(location_info, unit_ids, lead_id) {
      var key, i, j, locations, witnesses, lead_unit, unit, temp, apparatus;
      locations = location_info.split('-');
      //here move all readings into the lead_id unit and delete the others
      lead_unit = CL.findOverlapUnitById(lead_id);
      for (i = 0; i < unit_ids.length; i += 1) {
        if (unit_ids[i] !== lead_id) {
          temp = _findOverlapApparatusAndUnitById(unit_ids[i]);
          unit = temp[0];
          apparatus = temp[1];
          lead_unit.readings.push(JSON.parse(JSON.stringify(unit.readings[1])));
          lead_unit.start = CL.data.apparatus[locations[0]].start;
          lead_unit.end = CL.data.apparatus[locations[1]].end;
          _deleteUnit(apparatus, unit_ids[i]);
        }
      }
      //now combine all the top line data into the lead id (this must be correct for display to work)
      for (i = parseInt(locations[0]); i <= parseInt(locations[1]); i += 1) {
        witnesses = [];
        if (CL.data.apparatus[i].hasOwnProperty('overlap_units')) {
          for (j = 0; j < unit_ids.length; j += 1) {
            if (CL.data.apparatus[i].overlap_units.hasOwnProperty(unit_ids[j])) {
              witnesses.push.apply(witnesses, CL.data.apparatus[i].overlap_units[unit_ids[j]]);
              delete CL.data.apparatus[i].overlap_units[unit_ids[j]];
            }
          }
        }
        CL.data.apparatus[i].overlap_units[lead_id] = witnesses;
      }
    };

    //shouldn't be needed for overlapped units but just do it for safety
    //anything with an overlap_status flag should not be combined and should remain separate
    //we make a generic parent which goes in the position of the first found reading with all the others as a special kind of subreading
    //and we give the generic parent a unique id like all other readings
    _mergeAllSuppliedEmptyReadings = function(type_list, parent_blueprint, always_create_new_parent) {
      var unit, reading, first_hit_index, matched_readings, new_parent, witness, type, parent_id,
        rdg_details;
      SR.loseSubreadings();
      SR.findSubreadings();
      matched_readings = {};
      for (let key in CL.data) {
        if (key.match(/apparatus\d*/g) !== null) {
          for (let i = 0; i < CL.data[key].length; i += 1) {
            unit = CL.data[key][i];
            for (let j = 0; j < CL.data[key][i].readings.length; j += 1) {
              reading = CL.data[key][i].readings[j];
              if (reading.text.length === 0 && !reading.hasOwnProperty('overlap_status')) {
                if (type_list.indexOf(reading.type) != -1) {
                  if (!matched_readings.hasOwnProperty(unit._id)) {
                    matched_readings[unit._id] = [];
                  }
                  rdg_details = {
                    'app_id': key,
                    'unit_id': unit._id,
                    'unit_pos': i,
                    'reading_id': reading._id
                  };
                  if (reading.hasOwnProperty('subreadings')) {
                    rdg_details.subreadings = true;
                  }
                  matched_readings[unit._id].push(rdg_details);
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
            if (matched_readings.hasOwnProperty(unit._id)) {
              if ((always_create_new_parent === true &&
                  matched_readings[unit._id].length > 0) ||
                    matched_readings[unit._id].length > 1) {
                for (let j = 0; j < matched_readings[unit._id].length; j += 1) {
                  new_parent = JSON.parse(JSON.stringify(parent_blueprint)); //copy our blueprint
                  parent_id = CL.addReadingId(new_parent, unit.start, unit.end);
                  unit.readings.push(new_parent);
                  reading = CL.findReadingById(unit, matched_readings[unit._id][j].reading_id);
                  if (reading) { //sometimes because we have lost subreadings standoff readings might no longer exist in this pass through. Somehow this still works!
                    if (matched_readings[unit._id][j].hasOwnProperty('subreadings')) {
                      CL.makeStandoffReading('none', {
                        'app_id': key,
                        'unit_id': unit._id,
                        'unit_pos': i,
                        'reading_id': matched_readings[unit._id][j].reading_id
                      }, parent_id);
                    } else {
                      CL.doMakeStandoffReading('none', key, unit, reading, new_parent);
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
      mergedSharedOverlapReadings: mergedSharedOverlapReadings,
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
      mergedSharedOverlapReadings: mergedSharedOverlapReadings,
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
