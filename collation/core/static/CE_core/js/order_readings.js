/* exported OR */
/* global CL, SimpleContextMenu, spinner, cforms, SR, SV, drag, REDIPS */
var OR = (function() {

  const _undoStackLength = 6;

  return {

    undoStack: [],

    /**create and show the reorder readings display
     *
     * optional:
     * container - the HTML element to put the html result in
     *              (defaults to body if not supplied or can't find it)
     * options - a dict containing other options
     * 		 possibilities are:
     *              	highlighted_wit - the witness to highlight in display*/
    showOrderReadings: function(options) {
      let row, overlaps, num, newOverlapOptions, container, undoButton, showHideSubreadingsButtonText;
      console.log(JSON.parse(JSON.stringify(CL.data)));
      CL.stage = 'ordered';
      OR.addLabels(false);

      if (typeof options === 'undefined') {
        options = {};
      }
      //make sure we have a container to put things in
      if (!Object.prototype.hasOwnProperty.call(options, 'container') || options.container === null) {
        container = document.getElementsByTagName('body')[0];
      } else {
        container = options.container;
      }
      if (CL.project.witnessDecorators !== null) {
        CL.expandWitnessDecorators();
      }
      //sort out options and get layout
      if (!Object.prototype.hasOwnProperty.call(options, 'highlighted_wit') && CL.highlighted !== 'none') {
        options.highlighted_wit = CL.highlighted;
      }
      //attach right click menus
      SimpleContextMenu.setup({
        'preventDefault': true,
        'preventForms': false
      });
      SimpleContextMenu.attach('main_reading', function() {
        return OR._makeMenu('main_reading');
      });
      SimpleContextMenu.attach('main_reading_joinable_backwards', function() {
        return OR._makeMenu('main_reading', true, false);
      });
      SimpleContextMenu.attach('main_reading_joinable_forwards', function() {
        return OR._makeMenu('main_reading', false, true);
      });
      SimpleContextMenu.attach('main_reading_joinable_backwards_joinable_forwards', function() {
        return OR._makeMenu('main_reading', true, true);
      });
      SimpleContextMenu.attach('main_reading_om', function() {
        return OR._makeMenu('main_reading_om');
      });
      SimpleContextMenu.attach('main_reading_om_joinable_backwards', function() {
        return OR._makeMenu('main_reading_om', true, false);
      });
      SimpleContextMenu.attach('main_reading_om_joinable_forwards', function() {
        return OR._makeMenu('main_reading_om', false, true);
      });
      SimpleContextMenu.attach('main_reading_om_joinable_backwards_joinable_forwards', function() {
        return OR._makeMenu('main_reading_om', true, true);
      });
      SimpleContextMenu.attach('deletable', function() {
        return OR._makeMenu('deletable_unit');
      });
      SimpleContextMenu.attach('overlap_main_reading', function() {
        return OR._makeMenu('overlap_main_reading');
      });
      SimpleContextMenu.attach('overlap_main_reading_joinable_backwards', function() {
        return OR._makeMenu('overlap_main_reading', true, false);
      });
      SimpleContextMenu.attach('overlap_main_reading_joinable_forwards', function() {
        return OR._makeMenu('overlap_main_reading', false, true);
      });
      SimpleContextMenu.attach('overlap_main_reading_joinable_backwards_joinable_forwards', function() {
        return OR._makeMenu('overlap_main_reading', true, true);
      });
      SimpleContextMenu.attach('overlap_main_reading_om', function() {
        return OR._makeMenu('overlap_main_reading_om');
      });
      SimpleContextMenu.attach('overlap_main_reading_om_joinable_backwards', function() {
        return OR._makeMenu('overlap_main_reading_om', true, false);
      });
      SimpleContextMenu.attach('overlap_main_reading_om_joinable_forwards', function() {
        return OR._makeMenu('overlap_main_reading_om', false, true);
      });
      SimpleContextMenu.attach('overlap_main_reading_om_joinable_backwards_joinable_forwards', function() {
        return OR._makeMenu('overlap_main_reading_om', true, true);
      });
      SimpleContextMenu.attach('subreading', function() {
        return OR._makeMenu('subreading');
      });
      SimpleContextMenu.attach('overlap_unit', function() {
        return OR._makeMenu('overlap_unit');
      });
      SimpleContextMenu.attach('topline_unit', function() {
        return OR._makeMenu('topline_unit');
      });
      SimpleContextMenu.attach('reading_label', function() {
        return OR._makeMenu('reading_label');
      });
      const temp = CL.getUnitLayout(CL.data.apparatus, 1, 'reorder', options);
      const header = CL.getCollationHeader(CL.data, temp[1], false);
      const html = header[0];
      const highestUnit = header[1];
      html.push.apply(html, temp[0]);
      const overlapOptions = {'column_lengths': temp[1]};
      if (Object.prototype.hasOwnProperty.call(options, 'highlighted_wit')) {
        overlapOptions.highlighted_wit = options.highlighted_wit;
      }
      if (Object.prototype.hasOwnProperty.call(options, 'error_unit')) {
        overlapOptions.error_unit = options.error_unit;
      }
      overlapOptions.firstUnitOverlaps = {};
      overlapOptions.lastUnitOverlaps = {};
      if (Object.prototype.hasOwnProperty.call(CL.data.apparatus[0], 'overlap_units')) {
        overlapOptions.firstUnitOverlaps = CL.data.apparatus[0].overlap_units;
      }
      if (Object.prototype.hasOwnProperty.call(CL.data.apparatus[CL.data.apparatus.length - 1], 'overlap_units')) {
        overlapOptions.lastUnitOverlaps = CL.data.apparatus[CL.data.apparatus.length - 1].overlap_units;
      }
      const appIds = CL.getOrderedAppLines();
      for (let i = 0; i < appIds.length; i += 1) {
        num = appIds[i].replace('apparatus', '');
        newOverlapOptions = SV.calculateUnitLengths(appIds[i], overlapOptions);
        overlaps = CL.getOverlapLayout(CL.data[appIds[i]], num, 'reorder', header[1], newOverlapOptions);
        html.push.apply(html, overlaps[0]);
        temp[2].push.apply(temp[2], overlaps[1]);
      }
      html.push('<ul id="context_menu" class="SimpleContextMenu"></ul>');
      document.getElementById('header').innerHTML = CL.getHeaderHtml('Order Readings', CL.context);
      if (Object.prototype.hasOwnProperty.call(CL.services, 'showLoginStatus')) {
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
      const footerHtml = [];
      if (Object.prototype.hasOwnProperty.call(CL.project, 'showCollapseAllUnitsButton') && CL.project.showCollapseAllUnitsButton === true) {
        footerHtml.push('<button class="pure-button left_foot" id="expand_collapse_button">collapse all</button>');
      }
      footerHtml.push(
        '<button class="pure-button left_foot" id="show_hide_subreadings_button">' + showHideSubreadingsButtonText + '</button>'
      );
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
        OR._highlightWitness(event.target.value);
      });
      if (document.getElementById('save')) {
        $('#save').on('click', function() {
          CL.saveCollation('ordered');
        });
      }
      CL.addSubreadingEvents('reorder', CL.getRuleClasses('subreading', true, 'value', ['identifier', 'subreading']));
      if (document.getElementById('approve')) {
        $('#approve').on('click', function() {
          OR._approveVerse();
        });
      }
      for (let i = 0; i < highestUnit; i += 1) {
        if (document.getElementById('drag_unit_' + i) !== null) {
          OR.redipsInitOrderReadings('drag_unit_' + i);
        }
      }
      for (const key in CL.data) {
        if (Object.prototype.hasOwnProperty.call(CL.data, key)) {
          if (key.match(/apparatus\d/g) !== null) {
            for (let i = 0; i < CL.data[key].length; i += 1) {
              if (document.getElementById('drag_unit_' + i + '_app_' + key.replace('apparatus', '')) !== null) {
                OR.redipsInitOrderReadings('drag_unit_' + i + '_app_' + key.replace('apparatus', ''));
              }
            }
          }
        }
      }
      if (document.getElementById('undo_button')) {
        $('#undo_button').on('click', function() {
          spinner.showLoadingOverlay();
          OR._undo();
        });
      }
      CL.makeVerseLinks();
      const eventRows = temp[2];
      for (let i = 0; i < eventRows.length; i += 1) {
        row = document.getElementById(eventRows[i]);
        if (row !== null) {
          CL.addHoverEvents(row);
        }
      }
      SV.checkBugStatus('loaded order readings');
    },

    showApprovedVersion: function(options) {
      var html, header, row, overlaps, appIds, footerHtml, num, temp, eventRows,
          overlapOptions, newOverlapOptions, container, showHideSubreadingsButtonText;
      if (typeof options === 'undefined') {
        options = {};
      }
      CL.stage = 'approved';
      //make sure we have a container to put things in
      if (!Object.prototype.hasOwnProperty.call(options, 'container') || options.container === null) {
        container = document.getElementsByTagName('body')[0];
      } else {
        container = options.container;
      }
      if (CL.project.witnessDecorators !== null) {
        CL.expandWitnessDecorators();
      }
      //sort out options and get layout
      if (!Object.prototype.hasOwnProperty.call(options, 'highlighted_wit') && CL.highlighted !== 'none') {
        options.highlighted_wit = CL.highlighted;
      }
      temp = CL.getUnitLayout(CL.data.apparatus, 1, 'approved', options);
      header = CL.getCollationHeader(CL.data, temp[1], false);
      html = header[0];
      html.push.apply(html, temp[0]);
      overlapOptions = {'column_lengths': temp[1]};
      if (Object.prototype.hasOwnProperty.call(options, 'highlighted_wit')) {
        overlapOptions.highlighted_wit = options.highlighted_wit;
      }
      if (Object.prototype.hasOwnProperty.call(options, 'error_unit')) {
        overlapOptions.error_unit = options.error_unit;
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
      if (Object.prototype.hasOwnProperty.call(CL.services, 'showLoginStatus')) {
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
      if (Object.prototype.hasOwnProperty.call(CL.project, 'showCollapseAllUnitsButton') && CL.project.showCollapseAllUnitsButton === true) {
        footerHtml.push('<button class="pure-button left_foot" id="expand_collapse_button">collapse all</button>');
      }
      footerHtml.push(
        '<button class="pure-button left_foot" id="show_hide_subreadings_button">' + showHideSubreadingsButtonText + '</button>'
      );
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
        OR._highlightWitness(event.target.value, 'approved');
      });
      CL.addSubreadingEvents('approved', CL.getRuleClasses('subreading', true, 'value', ['identifier', 'subreading']));
      if (document.getElementById('get_apparatus')) {
        $('#get_apparatus').off('click.download_link');
        $('#get_apparatus').on('click.download_link', function() {
          OR._getApparatusForContext();
        });
      }
      CL.makeVerseLinks();
      eventRows = temp[2];
      for (let i = 0; i < eventRows.length; i += 1) {
        row = document.getElementById(eventRows[i]);
        CL.addHoverEvents(row);
      }
    },

    getUnitData: function(data, id, start, end, options) {
      let temp, rowId, overlapped, hasContextMenu, readingClass, colspan, hand, readingLabel, readingSuffix, text, overlap;
      const html = [];
      const rowList = [];
      hasContextMenu = true;
      overlap = false;
      if (id.indexOf('_app_') !== -1) {
        overlap = true;
      }
      if (Object.prototype.hasOwnProperty.call(options, 'highlighted_wit')) {
        hand = options.highlighted_wit.split('|')[1];
      } else {
        hand = null;
      }
      if (Object.prototype.hasOwnProperty.call(options, 'col_length')) {
        colspan = options.col_length;
      } else {
        colspan = end - start + 1;
      }
      const orRules = CL.getRuleClasses(undefined, undefined, 'value', ['identifier', 'keep_as_main_reading',
                                                                        'suffixed_label', 'suffixed_reading']);
      for (const key in orRules) {
        if (Object.prototype.hasOwnProperty.call(orRules, key) && orRules[key][1] === false) {
          delete orRules[key];
        }
      }
      if (OR._areAllEmptyReadings(data) && !Object.prototype.hasOwnProperty.call(options, 'created')) {
        html.push('<td class="redips-mark start_' + start + ' " colspan="' + colspan + '">' +
                  '<div class="drag_div deletable" id="drag_unit_' + id + '">');
      } else {
        html.push('<td class="redips-mark start_' + start + ' " colspan="' + colspan + '">' +
                  '<div class="drag_div" id="drag_unit_' + id + '">');
      }
      if (!overlap) {
        html.push('<table class="variant_unit topline_unit" id="variant_unit_' + id + '">');
      } else {
        html.push('<table class="variant_unit overlap_unit" id="variant_unit_' + id + '">');
      }
      for (let i = 0; i < data.length; i += 1) {
        // what is the reading text?
        if (data[i].type === 'lac') {
          // changing this for the joining options because we will need that for lacs. It was false previously.
          hasContextMenu = true;
        } else {
          hasContextMenu = true;
        }
        text = CL.extractDisplayText(data[i], i, data.length, options.unit_id, options.app_id);
  
        if (text.indexOf('system_gen_') !== -1) {
          hasContextMenu = false;
          text = text.replace('system_gen_', '');
        }
        data[i].text_string = text;
        // what labels need to be used?
        readingLabel = CL.getReadingLabel(i, data[i], orRules);
        readingSuffix = CL.getReadingSuffix(data[i], orRules);
        // what is the row id? (and add it to the list for adding events)
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
        html.push('<td id="' + rowId + '_label" class="reading_label redips-mark"><div class="spanlike">' + readingLabel);
        html.push('</div></td>');
        readingClass = [];
        if (!overlap) {
          readingClass.push('main_reading');
        } else {
          readingClass.push('overlap_main_reading');
        }
        if (!hasContextMenu) {
          readingClass.push('ncm');
        } else {
          if (['om', 'om_verse'].indexOf(data[i].type) !== -1) {
            readingClass.push('om');
          }
          if (i > 0) {
            if (Object.prototype.hasOwnProperty.call(options, 'joinable_backwards') && options.joinable_backwards === true) {
              readingClass.push('joinable_backwards');
            }
            if (Object.prototype.hasOwnProperty.call(options, 'joinable_forwards') && options.joinable_forwards === true) {
              readingClass.push('joinable_forwards');
            }
          }
        }
        html.push('<td class="redips-mark ' + readingClass.join('_') + '">');
        html.push('<div class="spanlike">');
        if (Object.prototype.hasOwnProperty.call(data[i], 'join_backwards') && data[i].join_backwards === true) {
          html.push('⇇&nbsp;');
        }
        html.push(text);
        if (readingSuffix !== '') {
          html.push(' ' + readingSuffix);
        }
        if (Object.prototype.hasOwnProperty.call(data[i], 'join_forwards') && data[i].join_forwards === true) {
          html.push('&nbsp;⇉');
        }
        html.push('</div>');
        if (Object.prototype.hasOwnProperty.call(data[i], 'subreadings')) {
          html.push('<table class="subreading_unit" id="subreading_unit_' + id + '_row_' + i + '">');
          overlapped = false;
          if (Object.prototype.hasOwnProperty.call(data[i], 'overlap_status')) {
            overlapped = true;
          }
          temp = OR._getSubunitData(data[i].subreadings, i, id, data[i].label, 'subreading', hand, overlapped);
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
    },

    relabelReadings: function(readings, overwrite) {
      let label, labels, allPotentialParents, potentialParents;
      // first do a pass through the regular readings
      for (let i = 0; i < readings.length; i += 1) {
        if (Object.prototype.hasOwnProperty.call(readings[i], 'type') &&
                (readings[i].type === 'lac' || readings[i].type === 'lac_verse')) {
          label = 'zz';
        } else if (Object.prototype.hasOwnProperty.call(readings[i], 'overlap_status')) {
          for (let j = 0; j < CL.overlappedOptions.length; j += 1) {
            if (CL.overlappedOptions[j].reading_flag === readings[i].overlap_status) {
              label = CL.overlappedOptions[j].reading_label;
            }
          }
        } else {
          label = CL.getAlphaId(i);
        }
        if (overwrite || !Object.prototype.hasOwnProperty.call(readings[i], 'label')) {
          if (!Object.prototype.hasOwnProperty.call(readings[i], 'parents') || readings[i].parents.length <= 1 || 
                CL.project.storeMultipleSupportLabelsAsParents === false ||
                      (CL.project.useZvForAllReadingsSupport == true && readings[i].label != 'zv')) {
            readings[i].label = label;
          }
        }
      }
      if (CL.project.storeMultipleSupportLabelsAsParents === true) {
        allPotentialParents = [];
        for (let i = 0; i < readings.length; i += 1) {
          if (readings[i].label !== 'zz' && readings[i].label !== 'zu' && 
                  readings[i].label !== 'zv' && readings[i].label.indexOf('/') === -1) {
            allPotentialParents.push(i);
          }
        }
        // now check the ones with parents
        for (let i = 0; i < readings.length; i += 1) {
          labels = [];
          potentialParents = allPotentialParents.slice();
          const pos = potentialParents.indexOf(i);
          if (pos !== -1) {
            potentialParents.splice(pos, 1);
          }
          if (Object.prototype.hasOwnProperty.call(readings[i], 'parents') && readings[i].parents.length > 1) {
            for (let j = 0; j < readings.length; j += 1) {
              if (readings[i].parents.indexOf(readings[j].text_string) !== -1) {
                labels.push(readings[j].label);
              }
            }
            if (labels.length > 1) {
              if (CL.project.useZvForAllReadingsSupport == true && labels.length === potentialParents.length) {
                readings[i].label ='zv';
              } else {
                readings[i].label = labels.join('/');
              }      
            } else {
              delete readings[i].parents;
            }
          }
        }
      }
    },

    putLacLast: function() {
      for (const key in CL.data) {
        if (Object.prototype.hasOwnProperty.call(CL.data, key)) {
          if (key.match(/apparatus\d?/) !== null) {
            for (let i = 0; i < CL.data[key].length; i += 1) {
              CL.data[key][i].readings.sort(OR._compareLabels);
            }
          }
        }
      }
    },

    addLabels: function(overwrite) {
      for (const key in CL.data) {
        if (Object.prototype.hasOwnProperty.call(CL.data, key)) {
          if (key.match(/apparatus\d?/) !== null) {
            for (let i = 0; i < CL.data[key].length; i += 1) {
             OR.relabelReadings(CL.data[key][i].readings, overwrite);
            }
          }
        }
      }
    },

    makeStandoffReading: function(type, readingDetails, parentReading, outerCallback) {
      const scrollOffset = [document.getElementById('scroller').scrollLeft,
                            document.getElementById('scroller').scrollTop];
      OR.addToUndoStack(CL.data);
      const apparatus = readingDetails.app_id;
      const unit = CL.findUnitById(apparatus, readingDetails.unit_id);
      const callback = function() {
        OR.relabelReadings(unit.readings, true);
        if (CL.showSubreadings === false) { // make sure we are still showing the edition subreadings
          SR.findSubreadings({
            'rule_classes': CL.getRuleClasses('subreading', true, 'value', ['identifier', 'subreading'])
          });
        }
        OR.showOrderReadings({'container': CL.container});
        document.getElementById('scroller').scrollLeft = scrollOffset[0];
        document.getElementById('scroller').scrollTop = scrollOffset[1];
        if (outerCallback !== undefined) {
          outerCallback();
        }
      };
      CL.makeStandoffReading(type, readingDetails, parentReading, callback);
    },

    removeSplits: function() {
      let apparatus;
      for (const key in CL.data) {
        if (Object.prototype.hasOwnProperty.call(CL.data, key)) {
          if (key.match(/apparatus\d?/g) !== null) {
            apparatus = CL.data[key];
            for (let i = 0; i < apparatus.length; i += 1) {
              delete apparatus[i].split_readings;
            }
            CL.data[key] = apparatus;
          }
        }
      }
    },

    // Need to work this out from the top line references to the overlap units as we can't actually rely on the start
    // and end values in the overlaps
    mergeSharedExtentOverlaps: function() {
      let match, newKey, leadUnit;
      const toDelete = [];
      const overlapLineNumbers = [];
      const overlapIndexes = {};
      const sharedOverlaps = {};
      for (const key in CL.data) {
        if (Object.prototype.hasOwnProperty.call(CL.data, key)) {
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
          if (Object.prototype.hasOwnProperty.call(CL.data.apparatus[i], 'overlap_units')) {
            for (const key in CL.data.apparatus[i].overlap_units) {
              if (Object.prototype.hasOwnProperty.call(CL.data.apparatus[i].overlap_units, key)) {
                if (!Object.prototype.hasOwnProperty.call(overlapIndexes, key)) {
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
      for (const key in overlapIndexes) {
        if (Object.prototype.hasOwnProperty.call(overlapIndexes, key)) {
          newKey = overlapIndexes[key].join('-');
          if (Object.prototype.hasOwnProperty.call(sharedOverlaps, newKey)) {
            sharedOverlaps[newKey].push(key);
          } else {
            sharedOverlaps[newKey] = [key];
          }
        }
      }
      // now see if any have more than one unit at each pair of indexes and therefore need combining
      for (const key in sharedOverlaps) {
        if (Object.prototype.hasOwnProperty.call(sharedOverlaps, key)) {
          if (sharedOverlaps[key].length > 1) {
            leadUnit = OR._findLeadUnit(sharedOverlaps[key], overlapLineNumbers);
            OR._horizontalCombineOverlaps(key, sharedOverlaps[key], leadUnit);
          }
        }
      }
      // now delete any apparatus keys which are empty
      for (const key in CL.data) {
        if (Object.prototype.hasOwnProperty.call(CL.data, key)) {
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
      OR._repositionOverlaps();
      OR._throughNumberApps(2);
      // now check the reading in each of the overlaped units for matching ones and merge if necessary
      OR.mergeSharedOverlapReadings();
    },

    // Merges any shared readings in overlap units. Most, if not all, will have been created in the process of adding
    // witnesses but it is possible that they could happen in the course of editing depending on the editor.
    mergeSharedOverlapReadings: function() {
      var match, overlapLineNumbers;
      SV.prepareForOperation();
      overlapLineNumbers = [];
      for (const key in CL.data) {
        if (Object.prototype.hasOwnProperty.call(CL.data, key)) {
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
    },

    canUnitMoveTo: function(id, newAppRow) {
      let conflict;
      const conflictUnits = OR._getPotentialConflicts(id);
      conflict = false;
      if (conflictUnits.length === 0) {
        return true;
      }
      if (!Object.prototype.hasOwnProperty.call(CL.data, 'apparatus' + newAppRow)) {
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
    },

    /** next two functions allow undo operation. */
    addToUndoStack: function(data) {
      if (OR.undoStack.length === _undoStackLength) {
        OR.undoStack.shift();
      }
      OR.undoStack.push(JSON.stringify(data));
    },

    // this currently focuses only on gaps where they are the only thing in the reading
    // we may want to do something similar where they are combined too but it doesn't seem essential at this point
    makeWasGapWordsGaps: function() {
      let reading;
      // only needed on top line because this is a feature of overlapping
      for (let i = 0; i < CL.data.apparatus.length; i += 1) {
        for (let j = 0; j < CL.data.apparatus[i].readings.length; j += 1) {
          reading = CL.data.apparatus[i].readings[j];
          if (reading.text.length === 1 && Object.prototype.hasOwnProperty.call(reading.text[0], 'was_gap')) {
            // make it a real gap again
            reading.type = 'lac';
            reading.details = reading.text[0]['interface'].replace('&gt;', '').replace('&lt;', '');
            reading.text = [];
          }
        }
      }
    },

    // optional: can be set in services or project and when moving to OR or approved
    mergeAllLacs: function() {
      const typeList = ['lac', 'lac_verse'];
      const parentTemplate = {'created': true,
                              'type': 'lac',
                              'details': 'lac',
                              'text': [],
                              'witnesses': []};
      OR._mergeAllSuppliedEmptyReadings(typeList, parentTemplate, true);
    },

    // optional: can be set in services or project and when moving to OR or approved
    mergeAllOms: function() {
      const typeList = ['om', 'om_verse'];
      const parentTemplate = {'created': true,
                              'type': 'om',
                              'text': [],
                              'witnesses': []};
      OR._mergeAllSuppliedEmptyReadings(typeList, parentTemplate, true);
    },

    reorderRows: function(rd) {
      let app, unit, readingId, readings;
      const table = document.getElementById(rd.obj.id);
      const temp = table.getElementsByTagName('TR');
      const rows = [];
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
      const order = [];
      for (let i = 0; i < rows.length; i += 1) {
        if (rows[i].id) {
          readingId = rows[i].id;
          order.push(parseInt(readingId.substring(readingId.indexOf('row_') + 4), 10));
        }
      }
      readings = CL.data[app][unit].readings;
      delete CL.data[app][unit].readings;
      readings = OR._sortArrayByIndexes(readings, order);
      OR.relabelReadings(readings, true);
      CL.data[app][unit].readings = readings;
    },

    editLabel: function(rdgDetails, menuPos, saveFunction) {
      let left, top;
      if (document.getElementById('label_form')) {
        document.getElementsByTagName('body')[0].removeChild(document.getElementById('label_form'));
      }
      left = menuPos.left;
      top = menuPos.top;
      const labelForm = document.createElement('div');
      const reading = CL.data[rdgDetails[1]][rdgDetails[0]].readings[rdgDetails[2]];
      const currentLabel = reading.label;
      const currentParents = Object.prototype.hasOwnProperty.call(reading, 'parents') ? reading.parents : [];
      labelForm.setAttribute('id', 'label_form');
      labelForm.setAttribute('class', 'label_form');
      const html = [];
      html.push('<div class="dialogue_form_header drag-zone">Edit Label</div>');
      html.push('<form id="label_change_form">');
      html.push('<label id="new_label_label" for="new_label">New label:<br/><input type="text" id="new_label" name="new_label"/></label><br/><br/>');
      if (CL.project.storeMultipleSupportLabelsAsParents === true) {
        html.push('<label for="multiple_support">Multiple support: </label><input type="checkbox" id="multiple_support"/><br/>');
        html.push('<label id="parent_select_label" for="parent_select" class="top_label disabled">Parents: </label><select class="disabled" disabled="disabled" id="parent_select" name="parent_select" multiple></select><br/><br/>');
      }
      html.push('<input class="pure-button dialogue-form-button" id="close_label_button" type="button" value="Cancel"/>');
      html.push('<input class="pure-button dialogue-form-button" id="save_label_button" type="button" value="Save"/>');
      html.push('</form>');
      labelForm.innerHTML = html.join('');
      document.getElementsByTagName('body')[0].appendChild(labelForm);
      if (CL.project.storeMultipleSupportLabelsAsParents === true) {
        const unitReadings = [];
        for (let i = 0; i < CL.data[rdgDetails[1]][rdgDetails[0]].readings.length; i += 1) {
          const label = CL.data[rdgDetails[1]][rdgDetails[0]].readings[i].label;
          if (i !== rdgDetails[2] && label !== 'zz' && label !== 'zu' && label !== 'zv' && label.indexOf('/') === -1) {
            unitReadings.push({'label': label,
                               'reading': CL.data[rdgDetails[1]][rdgDetails[0]].readings[i].text_string});
          }
        }
        cforms.populateSelect(unitReadings, document.getElementById('parent_select'),
                              {'value_key': 'reading', 'text_keys': 'reading', 'add_select': false});
      }
      document.getElementById('new_label').value = currentLabel; // populate field with current label value
      if (currentParents.length > 1) {
        document.getElementById('multiple_support').setAttribute('checked', 'checked');
        $('#parent_select_label').removeClass('disabled');
        $('#parent_select').removeClass('disabled');
        document.getElementById('parent_select').removeAttribute('disabled');
        $('#new_label_label').addClass('disabled');
        document.getElementById('new_label').setAttribute('disabled', 'disabled');
        // select the correct parents
        for (let i = 0; i < currentParents.length; i += 1) {
          $('#parent_select option[value="' + currentParents[i] + '"]').prop('selected', true);
        }
        $('#parent_select').focus();
      }
      if (document.getElementById('multiple_support')) {
        $('#multiple_support').on('click', function () {
          if (document.getElementById('multiple_support').checked === true) {
            $('#parent_select_label').removeClass('disabled');
            $('#parent_select').removeClass('disabled');
            document.getElementById('parent_select').removeAttribute('disabled');
            $('#new_label_label').addClass('disabled');
            document.getElementById('new_label').setAttribute('disabled', 'disabled');
          } else {
            $('#parent_select_label').addClass('disabled');
            $('#parent_select').addClass('disabled');
            document.getElementById('parent_select').setAttribute('disabled', 'disabled');
            $('#new_label_label').removeClass('disabled');
            document.getElementById('new_label').removeAttribute('disabled');
            // unselect all parents
            $('#parent_select option').prop('selected', false);
          }
        });
      }
      if (document.getElementById('parent_select')) {
        $('#parent_select').on('change', function () {
          OR._updateLabel(rdgDetails);
        });
      }
      // the +25 here is to move it out of the way of the other labels and readings so you can still see them
      left = parseInt(left) - document.getElementById('scroller').scrollLeft + 25;
      top = parseInt(top) - document.getElementById('scroller').scrollTop;
      document.getElementById('label_form').style.left = left + 'px';
      document.getElementById('label_form').style.top = top + 'px';
      drag.initDraggable('label_form', true, true);
      $('#close_label_button').on('click', function() {
        document.getElementsByTagName('body')[0].removeChild(document.getElementById('label_form'));
      });
      if (saveFunction !== undefined) {
        $('#save_label_button').on('click', function() {
          saveFunction();
        });
      } else {
        $('#save_label_button').on('click', function() {
          const data = cforms.serialiseForm('label_change_form');
          const newParents = data.parent_select;
          const newLabel = document.getElementById('new_label').value.replace(/\s+/g, '');
          if (newLabel !== '') {
            OR._manualChangeLabel(rdgDetails, newLabel, newParents);
          }
        });
      }
    },









    _compareLabels: function(a, b) {
      if (a.label !== 'zz' && b.label !== 'zz') {
        return 0;
      }
      if (a.label === 'zz') {
        return 1;
      }
      if (b.label === 'zz') {
        return -1;
      }
    },

    _uniqueifyIds: function() {
      let extra;
      const idList = [];
      for (const key in CL.data) {
        if (Object.prototype.hasOwnProperty.call(CL.data, key) && key.indexOf('apparatus') != -1) {
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
    },

    _approveVerse: function() {
      spinner.showLoadingOverlay();
      SR.loseSubreadings();  // for preparation and is needed
      const standoffProblems = SV.checkStandoffReadingProblems();
      if (!standoffProblems[0]) {
        const extraResults = CL.applyPreStageChecks('approve');
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
          OR._uniqueifyIds();
          OR._orderWitnessesForOutput();
          SR.loseSubreadings();  // always lose before finding
          SR.findSubreadings({'rule_classes': CL.getRuleClasses('subreading', true,
                                                                'value', ['identifier', 'subreading'])});
          if (CL.project.numberEditionSubreadings === true) {
            OR._numberEditionSubreadings();
          }
          OR._getSiglaSuffixes();
          // TODO: fosilise the reading suffixes and main reading label suffixes here
          // then make output dependent on these not being present
          OR._getMainReadingSpecialClasses();
          // The following comment is no longer true as we do have that button in the approved screen!
          // at this point the saved approved version always and only ever has the correct subreadings shown we
          // don't have the option to show/hide subreadings in the interface so we can be sure they are always correct
          CL.saveCollation('approved', function() {
            OR.showApprovedVersion({'container': CL.container});
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
    },

    _getMainReadingSpecialClasses: function () {
      let unit, reading;
      const ruleClasses = CL.getRuleClasses('keep_as_main_reading', true, 'value', ['identifier', 'suffixed_label',
                                                                                    'suffixed_reading']);
      if ($.isEmptyObject(ruleClasses)) {
          return;
      }
      for (const key in CL.data) {
        if (Object.prototype.hasOwnProperty.call(CL.data, key)) {
          if (key.indexOf('apparatus') != -1) {
            for (let i = 0; i < CL.data[key].length; i += 1) {
              unit = CL.data[key][i];
              for (let j = 0; j < unit.readings.length; j += 1) {
                reading = unit.readings[j];
                if (Object.prototype.hasOwnProperty.call(reading, 'reading_classes') && reading.reading_classes.length > 0) {
                  for (let k = 0; k < reading.reading_classes.length; k += 1) {
                    if (Object.prototype.hasOwnProperty.call(ruleClasses, reading.reading_classes[k])) {
                      if (ruleClasses[reading.reading_classes[k]][1] === true) {
                        if (Object.prototype.hasOwnProperty.call(reading, 'label_suffix')) {
                          reading.label_suffix = reading.label_suffix + ruleClasses[reading.reading_classes[k]][0];
                        } else {
                          reading.label_suffix = ruleClasses[reading.reading_classes[k]][0];
                        }
                      }
                      if (ruleClasses[reading.reading_classes[k]][2] === true) {
                        if (Object.prototype.hasOwnProperty.call(reading, 'reading_suffix')) {
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
    },

    _numberEditionSubreadings: function () {
      let unit, reading;
      for (const key in CL.data) {
        if (Object.prototype.hasOwnProperty.call(CL.data, key)) {
          if (key.indexOf('apparatus') != -1) {
            for (let i = 0; i < CL.data[key].length; i += 1) {
              unit = CL.data[key][i];
              for (let j = 0; j < unit.readings.length; j += 1) {
                reading = unit.readings[j];
                if (Object.prototype.hasOwnProperty.call(reading, 'subreadings')) {
                  for (const type in reading.subreadings) {
                    if (reading.subreadings[type].length > 1) {
                      for (let k = 0; k < reading.subreadings[type].length; k += 1) {
                        reading.subreadings[type][k].position_suffix = String(k + 1);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    _getSiglaSuffixes: function() {
      let unit, reading, subreading;
      for (const key in CL.data) {
        if (Object.prototype.hasOwnProperty.call(CL.data, key)) {
          if (key.indexOf('apparatus') != -1) {
            for (let i = 0; i < CL.data[key].length; i += 1) {
              unit = CL.data[key][i];
              for (let j = 0; j < unit.readings.length; j += 1) {
                reading = unit.readings[j];
                reading.suffixes = OR._doGetSiglaSuffixes(reading, key, unit.start, unit.end, unit.first_word_index);
                if (Object.prototype.hasOwnProperty.call(reading, 'subreadings')) {
                  for (const type in reading.subreadings) {
                    for (let k = 0; k < reading.subreadings[type].length; k += 1) {
                      subreading = reading.subreadings[type][k];
                      subreading.suffixes = OR._doGetSiglaSuffixes(subreading, key, unit.start, unit.end, unit.first_word_index);
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    _doGetSiglaSuffixes: function(data, app, start, end, firstWordIndex) {
      const readingsWithSuffixes = CL.getReadingWitnesses(data, app, start, end, firstWordIndex, true, false);
      const suffixes = [];
      data.witnesses = CL.sortWitnesses(data.witnesses);
      for (let i = 0; i < readingsWithSuffixes.length; i += 1) {
        suffixes.push(readingsWithSuffixes[i].replace(data.witnesses[i].replace('_private', ''), ''));
      }
      return suffixes;
    },

    _orderWitnessesForOutput: function() {
      let unit, reading, subreading;
      for (const key in CL.data) {
        if (Object.prototype.hasOwnProperty.call(CL.data, key)) {
          if (key.indexOf('apparatus') != -1) {
            for (let i = 0; i < CL.data[key].length; i += 1) {
              unit = CL.data[key][i];
              for (let j = 0; j < unit.readings.length; j += 1) {
                reading = unit.readings[j];
                reading.witnesses = CL.sortWitnesses(reading.witnesses);
                if (Object.prototype.hasOwnProperty.call(reading, 'subreadings')) {
                  for (const type in reading.subreadings) {
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
    },
  
    _areAllEmptyReadings: function(readings) {
      for (let i = 0; i < readings.length; i += 1) {
        if (readings[i].text.length > 0) {
          return false;
        }
      }
      return true;
    },

    _getSubunitData: function(data, parentIndex, parentId, parentLabel, subtype, hand, overlapped) {
      let subRowId;
      const rowList = [];
      const html = [];
      const rowTypeId = 'subrow';
      for (const type in data) {
        if (Object.prototype.hasOwnProperty.call(data, type)) {
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
            } else if (parentLabel === 'zv') {
              html.push('<td><div class="spanlike">?' + data[type][i].suffix + '.</td></td>');
            } else {
              html.push('<td><div class="spanlike">' + CL.getSubreadingLabel(parentLabel, data[type][i]) + '.</td></td>');
            }
            html.push('<td><div class="spanlike">' + data[type][i].text_string + '</div></td>');
            html.push('</tr>');
          }
        }
      }
      return [html, rowList];
    },

    _updateLabel: function (rdgDetails) {
      let supportsAll;
      const readings = [];
      const labels = [];
      for (let i = 0; i < document.getElementById('parent_select').selectedOptions.length; i += 1) {
        readings.push(document.getElementById('parent_select').selectedOptions[i].value);
      }
      if (readings.length === document.getElementById('parent_select').length) {
        supportsAll = true;
      } else {
        supportsAll = false;
      }
      for (let i = 0; i < CL.data[rdgDetails[1]][rdgDetails[0]].readings.length; i += 1) {
        if (readings.indexOf(CL.data[rdgDetails[1]][rdgDetails[0]].readings[i].text_string) !== -1) {
          labels.push(CL.data[rdgDetails[1]][rdgDetails[0]].readings[i].label);
        }
      }
      if (supportsAll === true && CL.project.useZvForAllReadingsSupport == true) {
        document.getElementById('new_label').value = 'zv';
      } else {
        document.getElementById('new_label').value = labels.join('/');
      } 
    },

    _manualChangeLabel: function(rdgDetails, newLabel, parents) {
      const scrollOffset = [document.getElementById('scroller').scrollLeft,
                            document.getElementById('scroller').scrollTop];
      OR.addToUndoStack(CL.data);
      const reading = CL.data[rdgDetails[1]][rdgDetails[0]].readings[rdgDetails[2]];
      reading.label = newLabel;
      if (parents !== undefined && parents.length > 0) {
        reading.parents = parents;
      }
      if (parents === undefined) {
        delete reading.parents;
      }
      document.getElementsByTagName('body')[0].removeChild(document.getElementById('label_form'));
      OR.showOrderReadings({'container': CL.container});
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    },

    /** highlight a witness, called from select box in page footer*/
    _highlightWitness: function(witness, stage) {
      const scrollOffset = [document.getElementById('scroller').scrollLeft,
                            document.getElementById('scroller').scrollTop];
      CL.highlighted = witness;
      if (stage === 'approved') {
        OR.showApprovedVersion({'container': CL.container, 'highlighted_wit': witness});
      } else {
        OR.showOrderReadings({'container': CL.container, 'highlighted_wit': witness});
      }
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
      if (witness !== 'none') {
        CL.getHighlightedText(witness);
      }
    },

    _makeMenu: function(menuName, addBackwardsJoin, addForwardsJoin) {
      // menus for full units
      if (menuName === 'subreading') {
        document.getElementById('context_menu').innerHTML = '<li id="unmark_sub"><span>Make main reading</span></li>';
      } else if (menuName === 'deletable_unit') {
        document.getElementById('context_menu').innerHTML = '<li id="delete_unit"><span>Delete unit</span></li>';
      } else if (menuName === 'main_reading' || menuName === 'overlap_main_reading' || menuName === 'main_reading_om' || menuName === 'overlap_main_reading_om') {
        const menu = [];
        menu.push('<li id="split_witnesses"><span>Split Witnesses</span></li>');
        if (menuName.indexOf('_om') !== -1 && CL.project.omCategories.length > 0) {
          menu.push('<li id="categorise_om"><span>Categorise Om</span></li>');
        }
        if (addBackwardsJoin) {
          menu.push('<li id="backwards_join"><span>Add/Remove Join ⇇</span></li>');
        }
        if (addForwardsJoin) {
          menu.push('<li id="forwards_join"><span>Add/Remove Join ⇉</span></li>');
        }
        const subreadings = [];
        const orRules = CL.getRuleClasses('create_in_OR', true, 'name', ['subreading', 'value', 'identifier',
                                                                         'keep_as_main_reading']);
        for (const key in orRules) {
          if (Object.prototype.hasOwnProperty.call(orRules, key)) {
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
                                                            '<li id="move_down"><span>Move unit down</span></li>' +
                                                            '<li id="merge_shared_readings"><span>Merge shared readings</span></li>';
      } else if (menuName === 'topline_unit') {
        document.getElementById('context_menu').innerHTML = '<li id="merge_shared_readings"><span>Merge shared readings</span></li>';
      } else if (menuName === 'reading_label') {
        document.getElementById('context_menu').innerHTML = '<li id="edit_label"><span>Edit label</span></li>';
      }
      OR._addContextMenuHandlers();
      return 'context_menu';
    },

    _makeMainReading: function(idString) {
      let unitNumber, appId;
      const scrollOffset = [document.getElementById('scroller').scrollLeft,
                            document.getElementById('scroller').scrollTop];
      OR.addToUndoStack(CL.data);
      if (idString.indexOf('_app_') === -1) {
        appId = 'apparatus';
        unitNumber = parseInt(idString.substring(idString.indexOf('unit_') + 5, idString.indexOf('_row_')));
      } else {
        unitNumber = parseInt(idString.substring(idString.indexOf('unit_') + 5, idString.indexOf('_app_')));
        appId = 'apparatus' + idString.substring(idString.indexOf('_app_') + 5, idString.indexOf('_row_'));
      }
      const unit = CL.data[appId][unitNumber];
      const subtype = idString.substring(idString.indexOf('_type_') + 6, idString.indexOf('_subrow_'));
      const parentPos = parseInt(idString.substring(idString.indexOf('_row_') + 5, idString.indexOf('_type_')));
      const subreadingPos = parseInt(idString.substring(idString.indexOf('_subrow_') + 8));
      const parentReading = unit.readings[parentPos];
      const options = {'delete_offset': true};
      CL.makeMainReading(unit, parentReading, subtype, subreadingPos, options);
      SV.prepareForOperation();
      SV.unsplitUnitWitnesses(unitNumber, appId);
      SV.unprepareForOperation();
      OR.relabelReadings(unit.readings, true);
      if (CL.showSubreadings === false) { //make sure we are still showing the edition subreadings
        SR.findSubreadings({
          'rule_classes': CL.getRuleClasses('subreading', true, 'value', ['identifier', 'subreading'])
        });
      }
      OR.showOrderReadings({'container': CL.container});
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    },

    _getDeleteUnit: function(unit) {
      const scrollOffset = [document.getElementById('scroller').scrollLeft,
                            document.getElementById('scroller').scrollTop];
      OR.addToUndoStack(CL.data);
      const details = CL.getUnitAppReading(unit.id);
      const id = CL.data[details[1]][details[0]]._id;
      OR._deleteUnit(details[1], id);
      OR.showOrderReadings({'container': CL.container});
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    },

    _moveOverlapUp: function(unit) {
      let currentLoc;
      const scrollOffset = [document.getElementById('scroller').scrollLeft,
                            document.getElementById('scroller').scrollTop];
      OR.addToUndoStack(CL.data);
      const details = CL.getUnitAppReading(unit.id);
      const id = CL.data[details[1]][details[0]]._id;
      const appNum = parseInt(details[1].replace('apparatus', ''));
      const newLoc = appNum - 1;
      const isSpace = OR.canUnitMoveTo(id, newLoc);
      currentLoc = appNum;
      if (!isSpace) {
        // then renumber all app lines from the one want to move to onwards to create a gap above the one we are looking for a space in
        // NB this will involve renumbering the line our current unit is in
        OR._throughNumberApps(appNum, appNum - 3);
        CL.data['apparatus' + newLoc] = [];
        currentLoc = appNum + 1;
      }
      // now move the unit to where we want it (we have already created the space if it was required)
      for (let i = 0; i < CL.data['apparatus' + currentLoc].length; i += 1) {
        if (CL.data['apparatus' + currentLoc][i]._id === id) {
          CL.data['apparatus' + newLoc].push(JSON.parse(JSON.stringify(CL.data['apparatus' + currentLoc][i])));
          CL.data['apparatus' + newLoc].sort(OR._compareStartIndexes);
          CL.data['apparatus' + currentLoc][i] = null;
        }
      }
      CL.removeNullItems(CL.data['apparatus' + currentLoc]);
      for (const key in CL.data) {
        if (key.indexOf('apparatus') !== -1) {
          if (CL.data[key].length === 0) {
            delete CL.data[key];
          }
        }
      }
      OR._throughNumberApps(2); // just check we are still sequential
      OR.showOrderReadings({'container': CL.container});
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    },

    _compareStartIndexes: function(a, b) {
      return a.start - b.start;
    },

    _moveOverlapDown: function(unit) {
      let newLoc;
      const scrollOffset = [document.getElementById('scroller').scrollLeft,
                            document.getElementById('scroller').scrollTop];
      OR.addToUndoStack(CL.data);
      const details = CL.getUnitAppReading(unit.id);
      const id = CL.data[details[1]][details[0]]._id;
      const appNum = parseInt(details[1].replace('apparatus', ''));
      const currentLoc = appNum;
      newLoc = appNum + 1;
      // if there is no line there add one now
      if (!Object.prototype.hasOwnProperty.call(CL.data, 'apparatus' + newLoc)) {
        CL.data['apparatus' + newLoc] = [];
      }
      const isSpace = OR.canUnitMoveTo(id, newLoc);
      if (!isSpace) {
        OR._throughNumberApps(appNum + 3, appNum);
        newLoc = newLoc + 1;
        CL.data['apparatus' + newLoc] = [];
      }
      // now move the unit to where we want it (we have already created the space if it was required)
      for (let i = 0; i < CL.data['apparatus' + currentLoc].length; i += 1) {
        if (CL.data['apparatus' + currentLoc][i]._id === id) {
          CL.data['apparatus' + newLoc].push(JSON.parse(JSON.stringify(CL.data['apparatus' + currentLoc][i])));
          CL.data['apparatus' + newLoc].sort(OR._compareStartIndexes);
          CL.data['apparatus' + currentLoc][i] = null;
        }
      }
      CL.removeNullItems(CL.data['apparatus' + currentLoc]);
      for (const key in CL.data) {
        if (key.indexOf('apparatus') !== -1) {
          if (CL.data[key].length === 0) {
            delete CL.data[key];
          }
        }
      }
      OR._throughNumberApps(2); // just check we are still sequential
      OR.showOrderReadings({'container': CL.container});
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    },

    /** add an om category to an om reading */
    _categoriseOm: function(readingDetails, menuPos) {
      let witnessList, data, newReadingId;
      const scrollOffset = [document.getElementById('scroller').scrollLeft,
                            document.getElementById('scroller').scrollTop];

      const reading = CL.data[readingDetails[1]][readingDetails[0]].readings[readingDetails[2]];
      CL.showSplitWitnessMenu(reading, menuPos, {
        'type': 'categoriseOm',
        'header': 'Select witnesses to categorise',
        'button': 'Save',
        'form_size': 'small'
      });
      // populate om categories
      const selectData = [];
      for (let i = 0; i < CL.project.omCategories.length; i += 1) {
        selectData.push({'value': CL.project.omCategories[i], 'label': CL.project.omCategories[i]});
      }
      if (reading.type === 'om_verse') {
        selectData.push({'value': 'om_verse', 'label': '&lt;om verse&gt;'});
      } else {
        selectData.push({'value': 'om', 'label': 'om.'});
      }
      cforms.populateSelect(selectData,
                            document.getElementById('om_category'),
                            {'value_key': 'value', 'text_keys': 'label'});
      $('#select_button').on('click', function() {
        witnessList = [];
        data = cforms.serialiseForm('select_wit_form');
        if (!$.isEmptyObject(data)) {
          witnessList = [];
          for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
              if (data[key] !== null) {
                witnessList.push(key);
              }
            }
          }
        }
        newReadingId = SV.doSplitReadingWitnesses(readingDetails[0], readingDetails[2], witnessList, readingDetails[1]);
        OR._doCategoriseOm(readingDetails[0], newReadingId, readingDetails[1], scrollOffset);
        document.getElementsByTagName('body')[0].removeChild(document.getElementById('wit_form'));
      });
    },

    _doCategoriseOm: function(unitNumber, readingId, apparatus, scrollOffset) {
      let reading, standoffEntry;
      const unit = CL.data[apparatus][unitNumber];
      for (let i = 0; i < unit.readings.length; i += 1) {
        if (unit.readings[i]._id === readingId) {
          reading = unit.readings[i];
        }
      }
      if (document.getElementById('om_category').value == 'om') {
        delete reading.details;
      } else if (document.getElementById('om_category').value == 'om_verse') {
        reading.details = 'om verse';
      } else {
        reading.details = document.getElementById('om_category').value;
      }
      // now we need to check if we have a standoff marked reading which needs the om details changing
      if (Object.prototype.hasOwnProperty.call(reading, 'created') && reading.created == true &&
              Object.prototype.hasOwnProperty.call(reading, 'standoff_subreadings')) {
          // find the standoff reading entries (there may be several, use the standoff_subreadings list to navigate)
          for (let i = 0; i < reading.standoff_subreadings.length; i += 1) {
            standoffEntry = SR.getMatchingStandoffReading(reading.standoff_subreadings[i], unit);
            // change the parent_text value
            standoffEntry.parent_text = '&lt;' + document.getElementById('om_category').value +'&gt;';
          }
      }
      OR.relabelReadings(CL.data[apparatus][unitNumber].readings, true);
      OR.showOrderReadings({'container': CL.container});
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    },

    /** adds the correct handler depending on subreading and keep_as_main_reading settings in the project rule configurations */
    _addEvent: function(orRules, key) {
      // if this reading is not marked to be kept as a main reading then use stand_off marking
      if (!orRules[key][3]) {
        $('#mark_as_' + orRules[key][1]).off('click.' + key + '_c');
        $('#mark_as_' + orRules[key][1]).off('mouseover.' + key + '_mo');
        $('#mark_as_' + orRules[key][1]).on('click.' + key + '_c', function() {
          const element = SimpleContextMenu._target_element;
          const div = CL.getSpecifiedAncestor(element, 'TR');
          const rdgDetails = CL.getUnitAppReading(div.id);
          const unitPos = rdgDetails[0];
          const appId = rdgDetails[1];
          const readingPos = rdgDetails[2];
          const unit = CL.data[appId][unitPos];
          const reading = unit.readings[readingPos];
          const readingDetails = {'app_id': appId,
                                  'unit_id': unit._id,
                                  'unit_pos': unitPos,
                                  'reading_pos': readingPos,
                                  'reading_id': reading._id};
          CL.markStandoffReading(orRules[key][1], key, readingDetails, 'order_readings', {
            'top': SimpleContextMenu._menuElement.style.top,
            'left': SimpleContextMenu._menuElement.style.left
          });
        });
        $('#mark_as_' + orRules[key][1]).on('mouseover.' + key + '_mo', function() {
          CL.hideTooltip();
        });
      } else {
        // else just add the marker and allow its removal
        $('#mark_as_' + orRules[key][1]).off('click.' + key + '_c');
        $('#mark_as_' + orRules[key][1]).off('mouseover.' + key + '_mo');
        $('#mark_as_' + orRules[key][1]).on('click.' + key + '_c', function() {
          const element = SimpleContextMenu._target_element;
          const div = CL.getSpecifiedAncestor(element, 'TR');
          const rdgDetails = CL.getUnitAppReading(div.id);
          const unitPos = rdgDetails[0];
          const appId = rdgDetails[1];
          const readingPos = rdgDetails[2];
          const reading = CL.data[appId][unitPos].readings[readingPos];
          OR._markReading(orRules[key][1], reading);
        });
        $('#mark_as_' + orRules[key][1]).on('mouseover.' + key + '_mo', function() {
          CL.hideTooltip();
        });
      }
    },

    _addContextMenuHandlers: function() {
      if (document.getElementById('unmark_sub')) {
        $('#unmark_sub').off('click.ums_c');
        $('#unmark_sub').off('mouseover.ums_mo');
        $('#unmark_sub').on('click.ums_c', function() {
          const element = SimpleContextMenu._target_element;
          const rowElem = CL.getSpecifiedAncestor(element, 'TR');
          OR._makeMainReading(rowElem.id);
        });
        $('#unmark_sub').on('mouseover.ums_mo', function() {
          CL.hideTooltip();
        });
      }
      if (document.getElementById('split_witnesses')) {
        $('#split_witnesses').off('click.sw_c');
        $('#split_witnesses').off('mouseover.sw_mo');
        $('#split_witnesses').on('click.sw_c', function() {
          const element = SimpleContextMenu._target_element;
          const div = CL.getSpecifiedAncestor(element, 'TR');
          const readingDetails = CL.getUnitAppReading(div.id);
          SV.splitReadingWitnesses(readingDetails, 'order_readings', {
            'top': SimpleContextMenu._menuElement.style.top,
            'left': SimpleContextMenu._menuElement.style.left
          });
        });
        $('#split_witnesses').on('mouseover.sw_mo', function() {
          CL.hideTooltip();
        });
      }
      if (document.getElementById('categorise_om')) {
        $('#categorise_om').off('click.co_c');
        $('#categorise_om').off('mouseover.co_mo');
        $('#categorise_om').on('click.co_c', function() {
          const element = SimpleContextMenu._target_element;
          const div = CL.getSpecifiedAncestor(element, 'TR');
          const readingDetails = CL.getUnitAppReading(div.id);
          OR._categoriseOm(readingDetails, {
            'top': SimpleContextMenu._menuElement.style.top,
            'left': SimpleContextMenu._menuElement.style.left
          });
        });
        $('#categorise_om').on('mouseover.co_mo', function() {
          CL.hideTooltip();
        });
      }
      if (document.getElementById('backwards_join')) {
        $('#backwards_join').off('click.bj_c');
        $('#backwards_join').off('mouseover.bj_mo');
        $('#backwards_join').on('click.bj_c', function() {
          const element = SimpleContextMenu._target_element;
          const div = CL.getSpecifiedAncestor(element, 'TR');
          const rdgDetails = CL.getUnitAppReading(div.id);
          const reading = CL.data[rdgDetails[1]][rdgDetails[0]].readings[rdgDetails[2]];
          if (Object.prototype.hasOwnProperty.call(reading, 'join_backwards') && reading.join_backwards === true) {
            reading.join_backwards = false;
          } else {
            reading.join_backwards = true;
          }
          const scrollOffset = [document.getElementById('scroller').scrollLeft,
                                document.getElementById('scroller').scrollTop];
          OR.showOrderReadings({'container': CL.container});
          document.getElementById('scroller').scrollLeft = scrollOffset[0];
          document.getElementById('scroller').scrollTop = scrollOffset[1];
        });
        $('#backwards_join').on('mouseover.bj_mo', function() {
          CL.hideTooltip();
        });
      }
      if (document.getElementById('forwards_join')) {
        $('#forwards_join').off('click.fj_c');
        $('#forwards_join').off('mouseover.fj_mo');
        $('#forwards_join').on('click.fj_c', function() {
          const element = SimpleContextMenu._target_element;
          const div = CL.getSpecifiedAncestor(element, 'TR');
          const rdgDetails = CL.getUnitAppReading(div.id);
          const reading = CL.data[rdgDetails[1]][rdgDetails[0]].readings[rdgDetails[2]];
          if (Object.prototype.hasOwnProperty.call(reading, 'join_forwards') && reading.join_forwards === true) {
            reading.join_forwards = false;
          } else {
            reading.join_forwards = true;
          }
          const scrollOffset = [document.getElementById('scroller').scrollLeft,
                                document.getElementById('scroller').scrollTop];
          OR.showOrderReadings({'container': CL.container});
          document.getElementById('scroller').scrollLeft = scrollOffset[0];
          document.getElementById('scroller').scrollTop = scrollOffset[1];
        });
        $('#forwards_join').on('mouseover.fj_mo', function() {
          CL.hideTooltip();
        });
      }
      if (document.getElementById('move_up')) {
        $('#move_up').off('click.mu_c');
        $('#move_up').off('mouseover.mu_mo');
        $('#move_up').on('click.mu_c', function() {
          const element = SimpleContextMenu._target_element;
          const div = CL.getSpecifiedAncestor(element, 'DIV', function(e) {
            if ($(e).hasClass('spanlike')) {
              return false;
            }
            return true;
          });
          OR._moveOverlapUp(div);
        });
        $('#move_up').on('mouseover.mu_mo', function() {
          CL.hideTooltip();
        });
      }
      if (document.getElementById('move_down')) {
        $('#move_down').off('click.md_c');
        $('#move_down').off('mouseover.md_mo');
        $('#move_down').on('click.md_c', function() {
          const element = SimpleContextMenu._target_element;
          const div = CL.getSpecifiedAncestor(element, 'DIV', function(e) {
            if ($(e).hasClass('spanlike')) {
              return false;
            }
            return true;
          });
          OR._moveOverlapDown(div);
        });
        $('#move_down').on('mouseover.md_mo', function() {
          CL.hideTooltip();
        });
      }
      if (document.getElementById('merge_shared_readings')) {
        $('#merge_shared_readings').off('click.msr_c');
        $('#merge_shared_readings').off('mouseover.msr_mo');
        $('#merge_shared_readings').on('click.msr_c', function() {
          let idString, appId, unitNumber;
          const element = SimpleContextMenu._target_element;
          const table = CL.getSpecifiedAncestor(element, 'TABLE');
          idString = table.id;
          if (idString.indexOf('_app_') === -1) {
            appId = 'apparatus';
            unitNumber = parseInt(idString.substring(idString.indexOf('unit_') + 5));
          } else {
            unitNumber = parseInt(idString.substring(idString.indexOf('unit_') + 5, idString.indexOf('_app_')));
            appId = 'apparatus' + idString.substring(idString.indexOf('_app_') + 5);
          }
          SV.prepareForOperation();
          SV.unsplitUnitWitnesses(unitNumber, appId);
          SV.unprepareForOperation();
          OR.showOrderReadings({'container': CL.container});
        });
        $('#merge_shared_readings').on('mouseover.msr_mo', function() {
          CL.hideTooltip();
        });
      }
      if (document.getElementById('edit_label')) {
        $('#edit_label').off('click.el_c');
        $('#edit_label').off('mouseover.el_mo');
        $('#edit_label').on('click.el_c', function() {
          const element = SimpleContextMenu._target_element;
          const labelCell = CL.getSpecifiedAncestor(element, 'TD');
          const rdgDetails = CL.getUnitAppReading(labelCell.id);
          OR.editLabel(rdgDetails, {'top': SimpleContextMenu._menuElement.style.top,
                                    'left': SimpleContextMenu._menuElement.style.left});
        });
        $('#edit_label').on('mouseover.el_mo', function() {
          CL.hideTooltip();
        });
      }
      if (document.getElementById('delete_unit')) {
        $('#delete_unit').off('click.du_c');
        $('#delete_unit').off('mouseover.du_mo');
        $('#delete_unit').on('click.du_c', function() {
          const element = SimpleContextMenu._target_element;
          const div = CL.getSpecifiedAncestor(element, 'DIV', function(e) {
            if ($(e).hasClass('spanlike')) {
              return false;
            }
            return true;
          });
          OR._getDeleteUnit(div);
        });
        $('#delete_unit').on('mouseover.du_mo', function() {
          CL.hideTooltip();
        });
      }
      //special added for OR
      const orRules = CL.getRuleClasses('create_in_OR', true, 'name', ['subreading', 'value', 'identifier',
                                                                 'keep_as_main_reading']);
      for (const key in orRules) {
        if (Object.prototype.hasOwnProperty.call(orRules, key)) {
          if (!orRules[key][0]) {
            if (document.getElementById('mark_as_' + orRules[key][1])) {
              OR._addEvent(orRules, key);
            }
          }
        }
      }
      if (document.getElementById('mark_as_ORsubreading')) {
        //make menu for mark_as_ORsubreading
        const key = 'ORsubreading';
        $('#mark_as_' + key).off('click.' + key + '_c');
        $('#mark_as_' + key).off('mouseover.' + key + '_mo');
        $('#mark_as_' + key).on('click.' + key + '_c', function() {
          var element, appId, div, unit, unitPos, rdgDetails, readingPos, reading, readingDetails;
          element = SimpleContextMenu._target_element;
          div = CL.getSpecifiedAncestor(element, 'TR');
          rdgDetails = CL.getUnitAppReading(div.id);
          unitPos = rdgDetails[0];
          appId = rdgDetails[1];
          readingPos = rdgDetails[2];
          unit = CL.data[appId][unitPos];
          reading = unit.readings[readingPos];
          // this ensures if we are storing labels as parents we remove those links before making this a subreading
          if (Object.prototype.hasOwnProperty.call(reading, 'parents')) {
            delete reading.parents;
          }
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
        $('#mark_as_' + key).on('mouseover.' + key + '_mo', function() {
          CL.hideTooltip();
        });
      } else {
        let rule, ruleName;
        for (const key in orRules) {
          if (Object.prototype.hasOwnProperty.call(orRules, key)) {
            if (orRules[key][0]) {
              if (document.getElementById('mark_as_' + orRules[key][1])) {
                rule = JSON.parse(JSON.stringify(orRules[key]));
                ruleName = key;
                //mark the reading as subreading
                $('#mark_as_' + orRules[key][1]).off('click.' + key + '_c');
                $('#mark_as_' + orRules[key][1]).off('mouseover.' + key + '_mo');
                $('#mark_as_' + orRules[key][1]).on('click.' + key + '_c', function() {
                  const element = SimpleContextMenu._target_element;
                  const div = CL.getSpecifiedAncestor(element, 'TR');
                  const rdgDetails = CL.getUnitAppReading(div.id);
                  const unitPos = rdgDetails[0];
                  const appId = rdgDetails[1];
                  const readingPos = rdgDetails[2];
                  const unit = CL.data[appId][unitPos];
                  const reading = unit.readings[readingPos];
                  // this ensures if we are storing labels as parents we remove those links before making this a
                  // subreading
                  if (Object.prototype.hasOwnProperty.call(reading, 'parents')) {
                    delete reading.parents;
                  }
                  const readingDetails = {'app_id': appId,
                                          'unit_id': unit._id,
                                          'unit_pos': unitPos,
                                          'reading_pos': readingPos,
                                          'reading_id': reading._id};
                  CL.markStandoffReading(rule[1], ruleName, readingDetails, 'order_readings', {
                    'top': SimpleContextMenu._menuElement.style.top,
                    'left': SimpleContextMenu._menuElement.style.left
                  });
                });
                $('#mark_as_' + orRules[key][1]).on('mouseover.' + key + '_mo', function() {
                  CL.hideTooltip();
                });
              }
            }
          }
        }
      }
    },

    redipsInitOrderReadings: function(id, onDropFunction) {
      const rd = REDIPS.drag;
      rd.init(id);
      if (onDropFunction !== undefined) {
        rd.event.rowDropped = onDropFunction;
      } else {
        rd.event.rowDropped = function() {
          OR.addToUndoStack(CL.data);
          OR.reorderRows(rd);
          const scrollOffset = document.getElementById('scroller').scrollLeft;
          OR.showOrderReadings({'container': CL.container});
          document.getElementById('scroller').scrollLeft = scrollOffset;
        };
      }
    },

    _markReading: function(value, reading) {
      const scrollOffset = [document.getElementById('scroller').scrollLeft,
                            document.getElementById('scroller').scrollTop];
      CL.markReading(value, reading);
      OR.showOrderReadings({'container': CL.container});
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    },

    _sortArrayByIndexes: function(array, indexes) {
      const result = [];
      for (let i = 0; i < array.length; i += 1) {
        result[i] = array[indexes[i]];
      }
      return result;
    },

    _getApparatusForContext: function() {
      if (Object.prototype.hasOwnProperty.call(CL.services, 'getApparatusForContext')) {
        CL.services.getApparatusForContext(function() {
          spinner.removeLoadingOverlay();
        });
      } else {
        const settings = JSON.parse(CL.getExporterSettings());
        if (!Object.prototype.hasOwnProperty.call(settings, 'options')) {
          settings.options = {};
        }
        settings.options.rule_classes = CL.ruleClasses;
        spinner.showLoadingOverlay();
        const url = CL.services.apparatusServiceUrl;
        const callback = function(collations) {
            let collationId;
            for (let i = 0; i < collations.length; i += 1) {
                if (collations[i].status === 'approved') {
                    collationId = collations[i].id;
                }
            }
            const innerCallback = function (collation) {
                const data = {settings: JSON.stringify(settings),
                              data: JSON.stringify([{'context': CL.context, 'structure': collation.structure}])};
                $.post(url, data).then(function (response) {
                    const blob = new Blob([response], {'type': 'text/txt'});
                    const filename = CL.context + '_apparatus.txt';
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const hiddenLink = document.createElement('a');
                    hiddenLink.style.display = 'none';
                    hiddenLink.href = downloadUrl;
                    hiddenLink.download = filename;
                    document.body.appendChild(hiddenLink);
                    hiddenLink.click();
                    window.URL.revokeObjectURL(downloadUrl);
                    spinner.removeLoadingOverlay();
                }).fail(function () {
                    alert('This unit cannot be exported 2. First try reapproving the unit. If the problem persists ' +
                          'please recollate the unit from the collation home page.');
                    spinner.removeLoadingOverlay();
                });
            };
            CL.services.loadSavedCollation(collationId, innerCallback);
        };
        CL.services.getSavedCollations(CL.context, undefined, callback);
      }
    },

    // through number all the overlapping apparatus lines from start_line with the
    // first number of the renumbered readings labeled as startIndex
    // it is safe to assume that when we call this with a startRow value that all
    // app lines are thru numbered from 2 at the point we call it.
    _throughNumberApps: function(startIndex, startRow) {
      let m, renumber, j, all, unit;
      all = false;
      if (typeof startRow === 'undefined') {
        all = true;
        startRow = 0;
      }
      const overlapLines = [];
      for (const key in CL.data) {
        if (Object.prototype.hasOwnProperty.call(CL.data, key)) {
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
        // see if we even need to renumber any app lines
        renumber = false;
        j = startIndex;
        for (let i = startRow; i < overlapLines.length; i += 1) {
          if (overlapLines[i] !== j) {
            renumber = true;
          }
          j += 1;
        }
        if (renumber === true) {
          // rename all the apparatus keys so we won't accidentally overwrite anything
          for (let i = startRow; i < overlapLines.length; i += 1) {
            if (Object.prototype.hasOwnProperty.call(CL.data, 'apparatus' + overlapLines[i])) {
              CL.data['old_apparatus' + overlapLines[i]] = CL.data['apparatus' + overlapLines[i]];
              delete CL.data['apparatus' + overlapLines[i]];
            }
          }
          j = startIndex;
          // now through number them as we want
          for (let i = startRow; i < overlapLines.length; i += 1) {
            if (Object.prototype.hasOwnProperty.call(CL.data, 'old_apparatus' + overlapLines[i])) {
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
    },

    // by this point we have added accurate start and end values for each unit so we can rely on them for testing 
    // overlaps, we added the correct start an end values in _horizontalCombineOverlaps
    _repositionOverlaps: function() {
      let m, moveTo, apparatusLine;
      const overlapLines = [];
      for (const key in CL.data) {
        if (Object.prototype.hasOwnProperty.call(CL.data, key)) {
          if (key.match(/apparatus\d+/) !== null) {
            m = key.match(/apparatus(\d+)/);
            overlapLines.push(parseInt(m[1]));
          }
        }
      }
      overlapLines.sort();
      // which is best - the algorithm below or using start and end in the overlaps themselves?
      // work from the second line of overlaps because the ones in the top line are already as high as they can be
      for (let i = 1; i < overlapLines.length; i += 1) {
        apparatusLine = CL.data['apparatus' + overlapLines[i]];
        for (let j = 0; j < apparatusLine.length; j += 1) {
          moveTo = OR._unitCanMoveTo(apparatusLine[j]._id, overlapLines, i);
          if (moveTo !== -1) {
            CL.data['apparatus' + moveTo].push(JSON.parse(JSON.stringify(apparatusLine[j])));
            SR.updateMarkedReadingData(apparatusLine[j], {'row': moveTo});
            // now we have sorted out the marked reading we can update the row on the unit
            CL.data['apparatus' + moveTo][CL.data['apparatus' + moveTo].length-1].row = moveTo;
            CL.data['apparatus' + moveTo].sort(OR._compareStartIndexes);
            apparatusLine[j] = null;
          }
        }
        CL.removeNullItems(apparatusLine);
      }
      // now delete any apparatus lines we don't need any more
      for (const key in CL.data) {
        if (Object.prototype.hasOwnProperty.call(CL.data, key)) {
          if (key.match(/apparatus\d+/) !== null) {
            if (CL.data[key].length === 0) {
              delete CL.data[key];
            }
          }
        }
      }
    },

    _getPotentialConflicts: function(id) {
      const ids = [];
      for (let i = 0; i < CL.data.apparatus.length; i += 1) {
        if (Object.prototype.hasOwnProperty.call(CL.data.apparatus[i], 'overlap_units') &&
                Object.prototype.hasOwnProperty.call(CL.data.apparatus[i].overlap_units, id)) {
          for (const key in CL.data.apparatus[i].overlap_units) {
            if (Object.prototype.hasOwnProperty.call(CL.data.apparatus[i].overlap_units, key) && key !== id) {
              if (ids.indexOf(key) === -1) {
                ids.push(key);
              }
            }
          }
        }
      }
      return ids;
    },

    // return the highest (nearest to the top, so lowest index number) app line that this unit
    // can be repositioned to without conflict with existing units
    _unitCanMoveTo: function(id, overlapKeys, currentAppRow) {
      let conflict;
      const conflictUnits = OR._getPotentialConflicts(id);
      for (let i = 0; i < currentAppRow; i += 1) {
        conflict = false;
        if (conflictUnits.length === 0) {
          // then there are no potential conflicts to move it as high as we can
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
    },

    _findLeadUnit: function(ids, overlapLines) {
      let unit;
      for (let i = 0; i < overlapLines.length; i += 1) {
        for (let j = 0; j < CL.data['apparatus' + overlapLines[i]].length; j += 1) {
          unit = CL.data['apparatus' + overlapLines[i]][j];
          if (ids.indexOf(unit._id) !== -1) {
            //just return the id we find first (we are going through apparatus in order)
            return unit._id;
          }
        }
      }
      // we should have returned by now just in case best return something sensible
      return ids[0];
    },
  
    _deleteUnit: function(apparatus, unitId) {
      for (let i = CL.data[apparatus].length - 1; i >= 0; i -= 1) {
        if (CL.data[apparatus][i]._id === unitId) {
          CL.data[apparatus].splice(i, 1);
        }
      }
    },
  
    _undo: function() {
      if (OR.undoStack.length > 0) {
        const scrollOffset = [document.getElementById('scroller').scrollLeft,
                              document.getElementById('scroller').scrollTop];
        CL.data = JSON.parse(OR.undoStack.pop());
        OR.showOrderReadings({'container': CL.container});
        document.getElementById('scroller').scrollLeft = scrollOffset[0];
        document.getElementById('scroller').scrollTop = scrollOffset[1];
      }
    },

    _findOverlapApparatusAndUnitById: function(id) {
      let key, unit;
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
      // TODO: either remove this or handle what key will be if it is returned here. It probably never is!
      return [unit, key];
    },

    // here combine all overlapped units at the same index location find the one in the lowest apparatus number
    _horizontalCombineOverlaps: function(locationInfo, unitIds, leadId) {
      let witnesses, unit, temp, apparatus;
      const locations = locationInfo.split('-');
      // here move all readings into the leadId unit and delete the others
      const leadUnit = CL.findOverlapUnitById(leadId);
      for (let i = 0; i < unitIds.length; i += 1) {
        if (unitIds[i] !== leadId) {
          temp = OR._findOverlapApparatusAndUnitById(unitIds[i]);
          unit = temp[0];
          apparatus = temp[1];
          leadUnit.readings.push(JSON.parse(JSON.stringify(unit.readings[1])));
          leadUnit.start = CL.data.apparatus[locations[0]].start;
          leadUnit.end = CL.data.apparatus[locations[1]].end;
          SR.updateMarkedReadingData(unit, {'row': leadUnit.row});
          OR._deleteUnit(apparatus, unitIds[i]);
        }
      }
      // now combine all the top line data into the lead id (this must be correct for display to work)
      for (let i = parseInt(locations[0]); i <= parseInt(locations[1]); i += 1) {
        witnesses = [];
        if (Object.prototype.hasOwnProperty.call(CL.data.apparatus[i], 'overlap_units')) {
          for (let j = 0; j < unitIds.length; j += 1) {
            if (Object.prototype.hasOwnProperty.call(CL.data.apparatus[i].overlap_units, unitIds[j])) {
              witnesses.push.apply(witnesses, CL.data.apparatus[i].overlap_units[unitIds[j]]);
              delete CL.data.apparatus[i].overlap_units[unitIds[j]];
            }
          }
        }
        CL.data.apparatus[i].overlap_units[leadId] = witnesses;
      }
    },

    // shouldn't be needed for overlapped units but just do it for safety
    // anything with an overlap_status flag should not be combined and should remain separate
    // we make a generic parent which goes in the position of the first found reading with all the others
    // as a special kind of subreading and we give the generic parent a unique id like all other readings
    _mergeAllSuppliedEmptyReadings: function(typeList, parentBlueprint, alwaysCreateNewParent) {
      let unit, reading, newParent, parentId, rdgDetails;
      SR.loseSubreadings();
      SR.findSubreadings();
      const matchedReadings = {};
      for (const key in CL.data) {
        if (key.match(/apparatus\d*/g) !== null) {
          for (let i = 0; i < CL.data[key].length; i += 1) {
            unit = CL.data[key][i];
            for (let j = 0; j < CL.data[key][i].readings.length; j += 1) {
              reading = CL.data[key][i].readings[j];
              if (reading.text.length === 0 && !Object.prototype.hasOwnProperty.call(reading, 'overlap_status')) {
                if (typeList.indexOf(reading.type) != -1) {
                  if (!Object.prototype.hasOwnProperty.call(matchedReadings, unit._id)) {
                    matchedReadings[unit._id] = [];
                  }
                  rdgDetails = {'app_id': key,
                                'unit_id': unit._id,
                                'unit_pos': i,
                                'reading_id': reading._id};
                  if (Object.prototype.hasOwnProperty.call(reading, 'subreadings')) {
                    rdgDetails.subreadings = true;
                  }
                  matchedReadings[unit._id].push(rdgDetails);
                }
              }
            }
          }
        }
      }
      // now data is collected
      SR.loseSubreadings();
      for (const key in CL.data) {
        if (key.match(/apparatus\d*/g) !== null) {
          for (let i = 0; i < CL.data[key].length; i += 1) {
            unit = CL.data[key][i];
            if (Object.prototype.hasOwnProperty.call(matchedReadings, unit._id)) {
              if ((alwaysCreateNewParent === true &&
                        matchedReadings[unit._id].length > 0) ||
                          matchedReadings[unit._id].length > 1) {
                for (let j = 0; j < matchedReadings[unit._id].length; j += 1) {
                  newParent = JSON.parse(JSON.stringify(parentBlueprint));  // copy our blueprint
                  parentId = CL.addReadingId(newParent, unit.start, unit.end);
                  unit.readings.push(newParent);
                  reading = CL.findReadingById(unit, matchedReadings[unit._id][j].reading_id);
                  // sometimes because we have lost subreadings standoff readings might no longer exist in
                  // this pass through. Somehow this still works!
                  if (reading) {
                    if (Object.prototype.hasOwnProperty.call(matchedReadings[unit._id][j], 'subreadings')) {
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
    },

    // not currently used?
    /** prep stuff for loading into order readings */
    _compareOverlaps: function(a, b) {
      // always put overlap readings at the bottom (of their parent reading)
      if (Object.prototype.hasOwnProperty.call(a, 'overlap')) {
        return 1;
      }
      if (Object.prototype.hasOwnProperty.call(b, 'overlap')) {
        return -1;
      }
    }

  };
  
}());
