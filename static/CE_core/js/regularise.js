/* exported RG */
/* global CL, SV, SR, spinner, cforms, SimpleContextMenu, staticUrl, Selectable, drag, REDIPS */
var RG = (function() {


  //private variable declarations
  let _rules = {},
      _forDeletion = [],
      _forGlobalExceptions = [];

  return {

    _allDeletableRules: {},
    showRegularisations: false,

    getCollationData: function(output, scrollOffset, callback) {
      CL.container = document.getElementById('container');
      CL.services.getUnitData(CL.context, CL.dataSettings.witness_list, function(collationData) {
        RG._calculateLacWits(collationData, function(lacWitnessList) {
          CL.services.getSiglumMap(lacWitnessList, function(lacWitnesses) {
            CL.collateData = {
              'data': collationData.results,
              'lac_witnesses': lacWitnesses
            };
            if (Object.prototype.hasOwnProperty.call(collationData, 'special_categories')) {
              CL.collateData.special_categories = collationData.special_categories;
            }
            if (typeof callback !== 'undefined') {
              callback();
            } else {
              RG.runCollation(CL.collateData, output, scrollOffset);
            }
          });
        });
      });
    },
    
    /** get the data for the unit of this type
     * 	data - the readings for that unit
     * 	id - the identifier for the unit
     * 	start - the start position
     * 	end - the end position
     * 	options - possibilities are:
     *
     * */
    getUnitData: function(data, id, start, end, options) {
      let cells, events, maxLength, rowId, rowIdBase, highlightedHand, classes, divClassString, witness, words,
          cellsDict, ruleCells, keysToSort, classList, variantUnitId, deletableRules, nonDeletableRules;
      if (options === undefined) {
        options = {};
      }
      if (Object.prototype.hasOwnProperty.call(options, 'highlighted_wit')) {
        highlightedHand = options.highlighted_wit.split('|')[1];
      } else {
        highlightedHand = null;
      }
      const html = [];
      const rowList = [];
      events = {};
      maxLength = ((end - start) / 2) + 1;
      const rows = [];
      for (let i = 0; i < data.length; i += 1) {
        cells = [];
        rowId = 'variant_unit_' + id + '_row_' + i;
        rowList.push(rowId);
        if (i === 0) {
          // cells.push('<tr><td class="redips-mark" colspan="MX_LN"><span id="toggle_variant_' + id +
          //           '" class="triangle">&#9650;</span></td></tr>');
          cells.push('<tr><td class="mark" colspan="MX_LN"><img onclick="RG.doSelectAll(this)" id="'+i+
                     '" class="selectall" src="'+staticUrl+'CE_core/images/checkall.png" height="16px">' +
                     '<span id="toggle_variant_' + id + '" class="triangle">&#9650;</span></td></tr>');

        }
        classes = [];
        if (i === 0) {
          classes.push('top');
        }
        if (data[i].witnesses.indexOf(highlightedHand) != -1) {
          classes.push('highlighted');
        }
        if (Object.prototype.hasOwnProperty.call(options, 'highlighted_added_wits') &&
            data[i].witnesses.filter(x => options.highlighted_added_wits.includes(x)).length > 0) {
          classes.push('added_highlighted');
        }
        cells.push('<tr id="' + rowId + '" class="' + classes.join(' ') + '">');
        cells.push('<td class="redips-mark"><div class="spanlike">' + CL.getAlphaId(i) + '. </div></td>');
        if (data[i].text.length === 0) {
          if (i === 0) {
            cells.push('<td class="redips-mark" colspan="MX_LN"><div class="spanlike">&nbsp;</div></td>');
          } else {
            if (data[i].type === 'om') {
              cells.push('<td class="redips-mark gap" colspan="MX_LN"><div class="spanlike">om.</div></td>');
            } else {
              cells.push('<td class="redips-mark gap" colspan="MX_LN"><div class="spanlike">&lt;' + data[i].details +
                        '&gt;</div></td>');
            }
          }
        } else {
          if (data[i].text.length > maxLength) {
            maxLength = data[i].text.length;
          }
          for (let j = 0; j < data[i].text.length; j += 1) {
            variantUnitId = 'variant_unit_' + id + '_r' + i + '_w' + j;
            divClassString = '';

            classList = [];
            // if we are in witnessAdding mode only allow regularisation of readings that have added witnesses
            // (the rules will only be made with the added ones not the full set)
            if (i > 0 && (CL.witnessAddingMode === false ||
                    (CL.witnessAddingMode === true &&
                        data[i].witnesses.filter(x => CL.witnessesAdded.includes(x)).length > 0))) {
              classList = ['redips-drag', 'redips-clone', 'reg_word'];
            }

            if (i > 0) {
              if (RG._hasRuleApplied(variantUnitId)) {
                classList.push('regularisation_staged');
              }
              classList.push(RG._getDisplayClasses(data[i].text[j]));
              divClassString = ' class="' + classList.join(' ') + '" ';
            }
            cells.push('<td>');
            words = data[i].text;
            if (Object.prototype.hasOwnProperty.call(words[j][words[j].reading[0]], 'gap_before') &&
                    Object.prototype.hasOwnProperty.call(words[j], 'combined_gap_before')) {
              cells.push('<div class="gap spanlike"> &lt;' + words[j][words[j].reading[0]].gap_details + '&gt; </div>');
            }
            cells.push('<div ' + divClassString + 'id="' + variantUnitId + '">' + RG._getToken(words[j]) + '</div>');
            if (Object.prototype.hasOwnProperty.call(words[j][words[j].reading[0]], 'gap_after') &&
                    (j < words.length - 1 || Object.prototype.hasOwnProperty.call(words[j], 'combined_gap_after'))) {
              cells.push('<div class="gap spanlike"> &lt;' + words[j][words[j].reading[0]].gap_details + '&gt; </div>');
            }
            if (RG.showRegularisations) {
              deletableRules = {};
              nonDeletableRules = {};

              for (let k = 0; k < data[i].witnesses.length; k += 1) {
                witness = data[i].witnesses[k];
                if (CL.witnessAddingMode === false || CL.witnessesAdded.indexOf(witness) !== -1) {
                  if (Object.prototype.hasOwnProperty.call(data[i].text[j], witness) &&
                          Object.prototype.hasOwnProperty.call(data[i].text[j][witness], 'decision_details')) {
                    for (let l = 0; l < data[i].text[j][witness].decision_details.length; l += 1) {
                      if (Object.prototype.hasOwnProperty.call(deletableRules, data[i].text[j][witness].decision_details[l].id)) {
                        deletableRules[data[i].text[j][witness].decision_details[l].id].witnesses.push(witness);
                      } else {
                        if (CL.witnessAddingMode === false || data[i].text[j][witness].decision_details[l].scope !== 'always') {
                          deletableRules[data[i].text[j][witness].decision_details[l].id] = {
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
                }
                if (CL.witnessAddingMode === true) {
                  if (Object.prototype.hasOwnProperty.call(data[i].text[j], witness) &&
                        Object.prototype.hasOwnProperty.call(data[i].text[j][witness], 'decision_details')) {
                    for (let l = 0; l < data[i].text[j][witness].decision_details.length; l += 1) {
                      if (!Object.prototype.hasOwnProperty.call(deletableRules, data[i].text[j][witness].decision_details[l].id)) {
                        if (Object.prototype.hasOwnProperty.call(nonDeletableRules, data[i].text[j][witness].decision_details[l].id)) {
                          nonDeletableRules[data[i].text[j][witness].decision_details[l].id].witnesses.push(witness);
                        } else {
                          if (data[i].text[j][witness].decision_details[l].scope !== 'always') {
                            nonDeletableRules[data[i].text[j][witness].decision_details[l].id] = {
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
                  }
                }
              }
              rowIdBase = rowId + '_word_' + j;
              ruleCells = RG._getRulesForDisplay(deletableRules, events, true, highlightedHand, rowIdBase);
              keysToSort = ruleCells[0];
              cellsDict = ruleCells[1];
              events = ruleCells[2];
              cells.push('<table><tbody>');
              keysToSort = CL.sortWitnesses(keysToSort);
              for (let k = 0; k < keysToSort.length; k += 1) {
                if (Object.prototype.hasOwnProperty.call(cellsDict, keysToSort[k])) {
                  cells.push(cellsDict[keysToSort[k]].join(' '));
                }
              }
              cells.push('</tbody></table>');
              if (Object.keys(nonDeletableRules).length > 1) {
                cells.push('<table><tbody>');
                ruleCells = RG._getRulesForDisplay(nonDeletableRules, events, false, highlightedHand, rowIdBase);
                keysToSort = ruleCells[0];
                cellsDict = ruleCells[1];
                events = ruleCells[2];

                keysToSort = CL.sortWitnesses(keysToSort);
                for (let k = 0; k < keysToSort.length; k += 1) {
                  if (Object.prototype.hasOwnProperty.call(cellsDict, keysToSort[k])) {
                    cells.push(cellsDict[keysToSort[k]].join(' '));
                  }
                }
                cells.push('</tbody></table>');
              }
            }
            cells.push('</td>');
          }
          if (deletableRules) {
            if (!Object.prototype.hasOwnProperty.call(RG._allDeletableRules, id)) {
              RG._allDeletableRules[id] = {};
            }
            RG._allDeletableRules[id] = Object.assign(RG._allDeletableRules[id], deletableRules);
          }
        }
        cells.push('</tr>');
        rows.push(cells.join(''));
      }
      html.push('<td class="start_' + start + '" colspan="' + (end - start + 1) + '"><div class="drag_div" id="redips-drag' + id + '">');
      html.push('<table class="variant_unit" id="variant_unit_' + id + '">');
      html.push(rows.join('').replace(/MX_LN/g, String(maxLength + 1)));
      html.push('<tr><td class="redips-mark" colspan="' + (maxLength + 1) + '"><span id="add_reading_' + id + '">+</span></td></tr>');
      html.push('</table>');
      html.push('</div></td>');
      return [html, rowList, events];
    },

    recollate: function(resetScroll) {
      let scrollOffset;
      spinner.showLoadingOverlay();
      if (resetScroll === undefined) {
        resetScroll = false;
      }
      scrollOffset = 0;
      if (!resetScroll) {
        scrollOffset = [document.getElementById('scroller').scrollLeft,
                        document.getElementById('scroller').scrollTop];
      }
      if (CL.witnessAddingMode !== true) {
        if ($.isEmptyObject(CL.collateData)) {
          RG.getCollationData('units', scrollOffset, function() {
            RG.runCollation(CL.collateData, 'units', scrollOffset);
          });
        } else {
          RG.runCollation(CL.collateData, 'units', scrollOffset);
        }
      } else {
        CL.prepareAdditionalCollation(CL.existingCollation, CL.dataSettings.witness_list);
      }
    },

    showVerseCollation: function(data, context, container, options) {
      let i, row, showHideRegularisationsButtonText, removeWitsForm, wits, preselectedAddedHighlight;
      console.log(JSON.parse(JSON.stringify(data)));
      CL.stage = 'regularise';
  
      if (typeof options === 'undefined') {
        options = {};
      }
      if (!Object.prototype.hasOwnProperty.call(options, 'highlighted_wit') && CL.highlighted !== 'none') {
        options.highlighted_wit = CL.highlighted;
      }
      if (CL.project.witnessDecorators !== null) {
        CL.expandWitnessDecorators();
      }
      if (CL.witnessAddingMode === true) {
        // this sets this a default so that when all is highlighted this will work - any data specified
        // in options will override it
        CL.highlightedAdded = JSON.parse(JSON.stringify(CL.witnessesAdded));
      }
      if (CL.witnessAddingMode === true && !Object.prototype.hasOwnProperty.call(options, 'highlighted_added_wits')) {
        options.highlighted_added_wits = CL.highlightedAdded;
      }
      options.sort = true;
      SimpleContextMenu.setup({'preventDefault': true, 'preventForms': false});
      if (CL.witnessEditingMode === false || CL.witnessAddingMode === true) {
        SimpleContextMenu.attach('selected_rule', function() {
          return RG._makeMenu('group_delete');
        });
        SimpleContextMenu.attach('regularised', function() {
          return RG._makeMenu('regularised');
        });
        SimpleContextMenu.attach('regularised_global', function() {
          return RG._makeMenu('regularised_global');
        });
        SimpleContextMenu.attach('regularisation_staged', function() {
          return RG._makeMenu('regularisation_staged');
        });
      }
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
              CL.setUpRemoveWitnessesForm(wits[2], data, 'regularised');
            }, 'text');
          }
        }
      }
      CL.lacOmFix();
      const temp = CL.getUnitLayout(CL.data.apparatus, 1, 'regularise', options);
      const header = CL.getCollationHeader(CL.data, temp[1], false);
      const html = header[0];
      html.push.apply(html, temp[0]);
      html.push('<ul id="context_menu" class="SimpleContextMenu"></ul>');
      document.getElementById('header').innerHTML = CL.getHeaderHtml('Regulariser', CL.context);
      //TODO: this might need to be improved everywhere it has been done if it turns out we need this in the services
      if (Object.prototype.hasOwnProperty.call(CL.services, 'showLoginStatus')) {
        CL.services.showLoginStatus();
      }
      document.getElementById('header').className = 'regularisation_header';
      const globalExceptionsHtml = '<div class="dialogue_form"  id="global_exceptions" style="display:none">' +
                                   '<div class="dialogue_form_header drag-zone" id="global_exceptions_header">' +
                                   '<span>Global Exceptions</span><span id="global_exceptions_ex">&#9660;</span></div>' +
                                   '<div id="global_exceptions_list" style="display:none"></div></div>';
      container.innerHTML = '<div id="scroller" class="fillPage"><table class="collation_overview">' +
        html.join('') + '</table>' + globalExceptionsHtml + '</div><div id="single_witness_reading"></div>';
      CL.expandFillPageClients();
  
      if (RG.showRegularisations === true) {
        showHideRegularisationsButtonText = 'hide regularisations';
        CL.services.getRuleExceptions(CL.context, function(rules) {
          if (rules.length > 0) {
            RG._showGlobalExceptions(rules);
          } else {
            return;
          }
        });
      } else {
        showHideRegularisationsButtonText = 'show regularisations';
      }
      //this does the styling of the select elements in the footer using pure (they cannot be styled individually)
      $('#footer').addClass('pure-form');
      const footerHtml = [];
      if (Object.prototype.hasOwnProperty.call(CL.project, 'showCollapseAllUnitsButton') &&
              CL.project.showCollapseAllUnitsButton === true) {
        footerHtml.push('<button class="pure-button left_foot" id="expand_collapse_button">collapse all</button>');
      }
      if (CL.witnessEditingMode === false || CL.witnessAddingMode === true) {
        footerHtml.push('<button class="pure-button left_foot" id="show_hide_regularisations_button">' +
                        showHideRegularisationsButtonText + '</button>');
      }
      if (CL.witnessEditingMode === false) {
        footerHtml.push('<span id="extra_buttons"></span>');
        footerHtml.push('<span id="stage_links"></span>');
      }
      if (CL.witnessEditingMode === true) {
        footerHtml.push('<button class="pure-button right_foot" id="return_to_saved_table_button">' +
                        'Return to summary table</button>');
      } else {
        footerHtml.push('<button class="pure-button right_foot" id="go_to_sv_button">move to set variants</button>');
      }
      footerHtml.push('<button class="pure-button right_foot" id="save_button">save</button>');
      if (CL.witnessEditingMode === false || CL.witnessAddingMode === true) {
        footerHtml.push('<button class="pure-button right_foot" id="recollate_button" type="button">recollate</button>');
        footerHtml.push('<button class="pure-button right_foot" id="settings_button">settings</button>');
      }
      footerHtml.push('<select class="right_foot" id="highlighted" name="highlighted"></select>');
      if (CL.witnessAddingMode === true && CL.witnessesAdded.length > 0) {
        footerHtml.push('<select class="right_foot" id="added_highlight" name="added_highlight"></select>');
      }
      document.getElementById('footer').innerHTML = footerHtml.join('');
  
      spinner.removeLoadingOverlay();
      CL.addExtraFooterButtons('regularised');
      CL.addStageLinks();
      RG._addFooterFunctions();
  
      CL.addTriangleFunctions('table');
      cforms.populateSelect(CL.getHandsAndSigla(),
                            document.getElementById('highlighted'),
                            {'value_key': 'document',
                             'text_keys': 'hand',
                             'selected':options.highlighted_wit,
                             'add_select': true,
                             'select_label_details': {'label': 'highlight witness', 'value': 'none' }});
      if (CL.witnessAddingMode === true && CL.witnessesAdded.length > 0) {
        if (options.highlighted_added_wits.length === 1) {
          preselectedAddedHighlight = options.highlighted_added_wits[0];
        } else {
          preselectedAddedHighlight = 'all';
        }
        cforms.populateSelect(CL.sortWitnesses(CL.witnessesAdded),
                              document.getElementById('added_highlight'),
                              {'selected': preselectedAddedHighlight,
                               'add_select': true,
                               'select_label_details': {'label': 'highlight all added witnesses', 'value': 'all'}});
      }
  
      //TODO: probably better in for loop
      if (CL.witnessRemovingMode !== true) {
        i = 0;
        while (i <= temp[4]) {
          if (document.getElementById('redips-drag' + i) !== null) {
            RG._redipsInitRegularise('redips-drag' + i);
          }
          if (document.getElementById('add_reading_' + i) !== null) {
            RG._addNewToken(document.getElementById('add_reading_' + i));
          }
          i += 1;
        }
      }
      RG._addMultiSelectionFunctions();
  
      $('#highlighted').on('change', function(event) {
        RG._highlightWitness(event.target.value);
      });
      if (document.getElementById('added_highlight')) {
        $('#added_highlight').on('change', function (event) {RG._highlightAddedWitness(event.target.value);});
      }
      RG._showRegularisations();
  
      CL.makeVerseLinks();
  
      const eventRows = temp[2];
      for (let i = 0; i < eventRows.length; i += 1) {
        row = document.getElementById(eventRows[i]);
        if (row !== null) {
          CL.addHoverEvents(row);
          RG._addMultipleSelectionEvents(row);
        }
      }
      const unitEvents = temp[3];
      for (const key in unitEvents) {
        if (Object.prototype.hasOwnProperty.call(unitEvents, key)) {
          row = document.getElementById(key);
          if (row) {
            CL.addHoverEvents(row, unitEvents[key]);
            RG._addMultipleSelectionEvents(row);
          }
        }
      }
    },

    allRuleStacksEmpty: function() {
      if (!$.isEmptyObject(_rules) || _forDeletion.length > 0 || _forGlobalExceptions.length > 0) {
        return false;
      }
      return true;
    },

    runCollation: function(collationData, output, scrollOffset, callback) {
      // put all the rules in a single list
      const ruleList = [];
      for (const key in _rules) {
        if (Object.prototype.hasOwnProperty.call(_rules, key)) {
          ruleList.push.apply(ruleList, _rules[key]);
        }
      }
      CL.services.updateRuleset(_forDeletion, _forGlobalExceptions, ruleList, CL.context, function() {
        _forDeletion = [];
        _forGlobalExceptions = [];
        _rules = {};
        RG._fetchRules(function(rules) {
          RG._doRunCollation(collationData, rules, output, scrollOffset, callback);
        });
      });
    },

    //PR added this so we can select all the regularisable readings at this point
    doSelectAll: function(element) {
      var rows=$($(element).parents("table")[0]).find("tr");
      let url1=staticUrl + 'CE_core/images/checkall.png';
      let url2=staticUrl + 'CE_core/images/allchecked.png';
      if ($(element).attr("src") == url1) {
      $(element).attr("src", url2)
      $(".selected_reg_word").removeClass("selected_reg_word");
      $.each(rows, function(i, row){
        if (i==0) return;
        if ($(row).hasClass("top")) return;
        if ($($(row).children("td")[1]).hasClass("gap")) return;
        if ($($(row).find("div")[1]).hasClass("regularised")) return;
        if ($(row).children("td").length==1) return;
        $($(row).find("div")[1]).addClass("selected_reg_word");
      });
      } else {
      $(element).attr("src", url1)
      $(".selected_reg_word").removeClass("selected_reg_word");
      }
    },
    //End PR addition

    _getRulesForDisplay: function(rules, events, deletable, highlightedHand, rowIdBase) {
      let regClass, highlighted, ruleCells, subrowId;
      const keysToSort = [];
      const cellsDict = {};
      for (const key in rules) {
        if (Object.prototype.hasOwnProperty.call(rules, key)) {
          ruleCells = [];
          if (deletable === true) {
            if (rules[key].scope === 'always') {
              regClass = 'regularised_global ';
            } else {
              regClass = 'deletable_rule regularised ';
            }
            if (RG._hasDeletionScheduled(key)) {
              regClass += 'deleted ';
            }
          } else {
            regClass = 'non_deletable_rule ';
          }
          regClass += 'regclass_' + rules[key].class + ' ';
          highlighted = '';
          if (rules[key].witnesses.length > 1) {
            rules[key].witnesses = CL.sortWitnesses(rules[key].witnesses);
          }
          if (keysToSort.indexOf(rules[key].witnesses[0]) === -1) {
            keysToSort.push(rules[key].witnesses[0]);
          }
          if (rules[key].witnesses.indexOf(highlightedHand) !== -1) {
            highlighted = 'highlighted ';
          }
          subrowId = rowIdBase + '_rule_' + key;
          ruleCells.push('<tr class="' + regClass + highlighted + '" id="' + subrowId + '"><td id="' + key + '">');
          if (rules[key].witnesses.indexOf(highlightedHand) !== -1) {
            ruleCells.push('<div class="spanlike">');
          }
          ruleCells.push(CL.project.prepareDisplayString(rules[key].t));
          ruleCells.push(' &#9654; ');
          ruleCells.push(CL.project.prepareDisplayString(rules[key].n));
          if (rules[key].witnesses.indexOf(highlightedHand) !== -1) {
            ruleCells.push('</div>');
          }
          ruleCells.push('</td></tr>');
          if (Object.prototype.hasOwnProperty.call(cellsDict, rules[key].witnesses[0])) {
            cellsDict[rules[key].witnesses[0]].push(ruleCells.join(' '));
          } else {
            cellsDict[rules[key].witnesses[0]] = [ruleCells.join(' ')];
          }
          events[subrowId] = rules[key].scope + ': ' +
                             RG._getRegWitsAsString(rules[key].witnesses) + ' (' +
                             rules[key].class + ')';
        }
      }
      return [keysToSort, cellsDict, events];
    },

    _addMultiSelectionFunctions: function () {
      // NB: in this function we need to add and remove the regularised class because of how the context menus are attached
      $('.deletable_rule').on('click', function (e) {
        if (e.shiftKey || e.altKey) {
          // check if there are already words in other variant units selected and remove them.
          const thisVariantUnitId = $(e.target).parents('div').attr('id');
          const prevSelected = $('.selected_rule');
          $.each(prevSelected, function (i, selected) {
            if ($(selected).parents('div').attr('id') != thisVariantUnitId) {
              $(selected).removeClass('selected_rule');
              $(selected).addClass('regularised');
            }
          })
          const tr = $(e.target).closest('tr');
          if ($(tr).hasClass('selected_rule')) {
            // we are deselecting this so remove the colour and add regularised
            $(tr).removeClass('selected_rule');
            $(tr).addClass('regularised');
          } else {
            $(tr).addClass('selected_rule');
            $(tr).removeClass('regularised');
          }
        }
      });
    },

    _addMultipleSelectionEvents: function (row) {
      $(row).click(function(e) {
        if (e.shiftKey || e.altKey) {
          let elem;
          // check if there are already words in other variant units selected and remove them.
          const thisVariantUnitId = $(e.target).parents('div').attr('id');
          const prevSelected = $('.selected_reg_word');
          $.each(prevSelected, function (i, selected) {
            if ($(selected).parents('div').attr('id') != thisVariantUnitId) {
              $(selected).removeClass('selected_reg_word');
            }
          })
          if ($(e.target).hasClass('spanlike')) {
            elem = $(e.target).closest('td').next('td').children('div')[0];
          } else {
            elem = $(e.target)[0];
          }
          if ($(elem).hasClass('selected_reg_word')) {
            $(elem).removeClass('selected_reg_word');
          } else {
            $(elem).addClass('selected_reg_word');
          }
        }
      });
    },

    /** highlight a witness that has been added or highlight all added witnesses with 'all' 
     * (only in CL.witnessAddingMode), called from select box in page footer */
    _highlightAddedWitness: function (witness) {
      let witnesses;
      const scrollOffset = [document.getElementById('scroller').scrollLeft,
                            document.getElementById('scroller').scrollTop];

      if (witness === 'all') {
        witnesses = CL.witnessesAdded;
      } else {
        witnesses = [witness];
      }
      CL.highlightedAdded = witnesses;
      RG.showVerseCollation(CL.data, CL.context, CL.container, {'highlighted_added_wits': witnesses});

      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
    },

    _addFooterFunctions: function () {
      $('#return_to_saved_table_button').on('click', function() {
          const callback = function () {
            _rules = {};
            _forDeletion = [];
            _forGlobalExceptions = [];
            CL.isDirty = false;
          };
          CL.returnToSummaryTable(callback);
      });
      $('#go_to_sv_button').on('click',
        function() {
          let extraResults;
          spinner.showLoadingOverlay();
          //remove any forms still present
          if (document.getElementById('reg_form')) {
            document.getElementById('reg_form').parentNode.removeChild(document.getElementById('reg_form'));
          }
          if (document.getElementById('global_exceptions')) {
            document.getElementById('global_exceptions').parentNode.removeChild(document.getElementById('global_exceptions'));
          }
          //check that there are no rules in stacks waiting to be added/deleted/have exceptions made etc.
          if (RG.allRuleStacksEmpty()) {
            if (SV.areAllUnitsComplete()) { //check nothing is lost and we have a full complement of witnesses for each unit
              extraResults = CL.applyPreStageChecks('set_variants');
              if (extraResults[0] === true) {
                RG._removeUnrequiredData(); //remove the key-value pairs we don't need anymore
                CL.data.marked_readings = {}; //added for SV
                CL.addUnitAndReadingIds(); //added for SV
                SV.showSetVariants({'container': CL.container});
                document.getElementById('scroller').scrollLeft = 0;
                document.getElementById('scroller').scrollTop = 0;
              } else {
                if (CL.showSubreadings === true) {
                  SR.findSubreadings();
                }
                alert(extraResults[1]);
                spinner.removeLoadingOverlay();
              }
            } else {
              alert('You cannot move to set variants because one of the units does not have all of its required witnesses');
              spinner.removeLoadingOverlay();
            }
          } else {
            alert('You must recollate before moving to set variants because there are rule changes that have not yet been applied.');
            spinner.removeLoadingOverlay();
          }
        });
      $('#settings_button').on('click',
        function() {
          RG._showSettings();
        });
      $('#recollate_button').on('click',
        function() {
          RG.recollate();
        });
      $('#save_button').on('click',
        function() {
          CL.saveCollation('regularised');
        });
    },

    _calculateLacWits: function(collationData, resultCallback) {
      let transcriptionId;
      const lacTranscriptions = JSON.parse(JSON.stringify(CL.dataSettings.witness_list));
      if (Object.prototype.hasOwnProperty.call(collationData.results[0], 'transcription_id')) {
        console.warn('The use of \'transcription_id\' is deprecated. \'transcription\' should be used instead.');
      }
      for (let i = 0; i < collationData.results.length; i += 1) {
        //TODO: remove first condition and keep final two when transcription_id key no longer supported
        if (Object.prototype.hasOwnProperty.call(collationData.results[i], 'transcription_id')) {
          transcriptionId = collationData.results[i].transcription_id;
        } else if (Object.prototype.hasOwnProperty.call(collationData.results[i], 'transcription_identifier')) {
          transcriptionId = collationData.results[i].transcription_identifier;
        } else {
          transcriptionId = collationData.results[i].transcription;
        }
        if (lacTranscriptions.indexOf(transcriptionId) !== -1) {
          lacTranscriptions.splice(lacTranscriptions.indexOf(transcriptionId), 1);
        }
      }
      resultCallback(lacTranscriptions);
    },

    _hasRuleApplied: function(id) {
      if (Object.prototype.hasOwnProperty.call(_rules, id)) {
        return true;
      }
      return false;
    },

    _getDisplayClasses: function(word) {
      for (let i = 0; i < word.reading.length; i += 1) {
        if (Object.prototype.hasOwnProperty.call(word, word.reading[i])) {
          if (Object.prototype.hasOwnProperty.call(word[word.reading[i]], 'display_class')) {
            return word[word.reading[i]].display_class.join(' ');
          }
        }
      }
      return '';
    },

    /** returns the token with the following priorities
     * interface > n > t */
    _getToken: function(dict) {
      if (Object.prototype.hasOwnProperty.call(dict, 'interface')) {
        return CL.project.prepareDisplayString(dict['interface']);
      }
      if (Object.prototype.hasOwnProperty.call(dict, 'n')) {
        return CL.project.prepareDisplayString(dict.n);
      }
      return CL.project.prepareDisplayString(dict.t);
    },

    _getWordTokenForWitness: function(unit, reading, word) {
      const token = CL.data.apparatus[unit].readings[reading].text[word];
      return token['interface'];
    },

    _hasDeletionScheduled: function(ruleId) {
      for (let i = 0; i < _forDeletion.length; i += 1) {
        if (_forDeletion[i].id === ruleId) {
          return true;
        }
      }
      for (let i = 0; i < _forGlobalExceptions.length; i += 1) {
        if (_forGlobalExceptions[i].id === ruleId) {
          return true;
        }
      }
      return false;
    },

    _getRegWitsAsString: function(witList) {
      const newWits = [];
      for (let i = 0; i < witList.length; i += 1) {
        newWits.push(witList[i]);
      }
      return newWits.join(', ');
    },

    /** add lac_verse and om_verse to the collated data */
    _integrateLacOmReadings: function(data) {
      const specialWitnesses = [];
      if (Object.prototype.hasOwnProperty.call(data, 'special_categories')) {
        for (let j = 0; j < data.special_categories.length; j+=1) {
          for (let i = 0; i < data.apparatus.length; i += 1) {
            data.apparatus[i].readings.push({
              'text': [],
              'type': 'lac_verse',
              'details': data.special_categories[j].label,
              'witnesses': data.special_categories[j].witnesses
            });
          }
          specialWitnesses.push.apply(specialWitnesses, data.special_categories[j].witnesses);
        }
      }
      const newLacWitnesses = CL.removeSpecialWitnesses(data.lac_readings, specialWitnesses);
      if (typeof data.lac_readings !== 'undefined' && data.lac_readings.length > 0 && newLacWitnesses.length > 0) {
        for (let i = 0; i < data.apparatus.length; i += 1) {
          if (data.lac_readings.indexOf(data.overtext_name) != -1) {
            data.apparatus[i].readings.splice(0, 0, {
              'text': [],
              'type': 'lac_verse',
              'details': CL.project.lacUnitLabel,
              'witnesses': newLacWitnesses
            });
          } else {
            data.apparatus[i].readings.push({
              'text': [],
              'type': 'lac_verse',
              'details': CL.project.lacUnitLabel,
              'witnesses': newLacWitnesses
            });
          }
        }
      }
      if (typeof data.om_readings !== 'undefined' && data.om_readings.length > 0) {
        for (let i = 0; i < data.apparatus.length; i += 1) {
          if (data.om_readings.indexOf(data.overtext_name) != -1) {
            data.apparatus[i].readings.splice(0, 0, {
              'text': [],
              'type': 'om_verse',
              'details': CL.project.omUnitLabel,
              'witnesses': data.om_readings
            });
          } else {
            data.apparatus[i].readings.push({
              'text': [],
              'type': 'om_verse',
              'details': CL.project.omUnitLabel,
              'witnesses': data.om_readings
            });
          }
        }
      }
      return data;
    },

    _doRunCollation: function(collationData, rules, output, scrollOffset, callback) {
      let resultCallback;
      const options = {'configs': {}, 'data': {}};
      // set the data values
      options.data.rules = rules;
      options.data.unit_data = collationData;
      // data settings
      const dataSettings = {};
      dataSettings.base_text = CL.dataSettings.base_text;
      dataSettings.base_text_siglum = CL.dataSettings.base_text_siglum;
      dataSettings.language = CL.dataSettings.language;
      dataSettings.witness_list = CL.dataSettings.witness_list;
      options.data.data_settings = dataSettings;
  
      const displaySettings = {};
      for (const setting in CL.displaySettings) {
        if (Object.prototype.hasOwnProperty.call(CL.displaySettings, setting)) {
          if (CL.displaySettings[setting] === true) {
            displaySettings[setting] = CL.displaySettings[setting];
          }
        }
      }
      options.data.display_settings = displaySettings;
  
      // Set all the config options
      options.configs.display_settings_config = CL.displaySettingsDetails;
      options.configs.rule_conditions_config = CL.ruleConditions;
      options.configs.debug = CL.debug;
      if (!$.isEmptyObject(CL.localPythonFunctions)) {
        options.configs.local_python_functions = CL.localPythonFunctions;
      }
      const algorithmSettings = {};
      for (const setting in CL.collationAlgorithmSettings) {
        if (Object.prototype.hasOwnProperty.call(CL.collationAlgorithmSettings, setting)) {
          if (CL.collationAlgorithmSettings[setting] !== false) {
            algorithmSettings[setting] = CL.collationAlgorithmSettings[setting];
          }
        }
      }
      options.configs.algorithm_settings = algorithmSettings;
  
      if (Object.prototype.hasOwnProperty.call(CL.services, 'collatexHost')) {
        options.configs.collatexHost = CL.services.collatexHost;
      }
  
      if (output === 'add_witnesses') {
        options.configs.split_single_reading_units = true;
        resultCallback = function(data) {
          callback(data);
        };
      } else {
        resultCallback = function(data) {
          if (data === null) {
            alert(CL.context + ' does not collate.');
            spinner.removeLoadingOverlay();
            location.reload();
            return;
          }
          CL.data = data;
          CL.data = RG._integrateLacOmReadings(CL.data);
          CL.dataSettings.base_text_siglum = data.overtext_name;
          RG.showVerseCollation(CL.data, CL.context, document.getElementById('container'));
          if (scrollOffset !== undefined) {
            document.getElementById('scroller').scrollLeft = scrollOffset[0];
            document.getElementById('scroller').scrollTop = scrollOffset[1];
          }
        };
      }
      CL.services.doCollation(CL.context, options, resultCallback);
    },

    _showSettings: function() {
      if (document.getElementById('settings') !== null) {
        document.getElementsByTagName('body')[0].removeChild(document.getElementById('settings'));
      }
      const settingsDiv = document.createElement('div');
      settingsDiv.setAttribute('id', 'settings');
      settingsDiv.setAttribute('class', 'settings_dialogue dialogue_form');
      settingsDiv.innerHTML = '<div class="dialogue_form_header"><span id="settings_title">Settings</span></div>' +
                              '<form id="settings_form"></form>';
      const settingsHtml = [];
      CL.displaySettingsDetails.configs.sort(function(a, b) {
        return a.menu_pos - b.menu_pos;
      });
      for (let i = 0; i < CL.displaySettingsDetails.configs.length; i += 1) {
        if (CL.displaySettingsDetails.configs[i].menu_pos === null) {
          settingsHtml.push('<input class="boolean" name="' + CL.displaySettingsDetails.configs[i].id +
            '" id="' + CL.displaySettingsDetails.configs[i].id +
            '" type="hidden" value="' + CL.displaySettingsDetails.configs[i].check_by_default + '"/>');
        } else {
          settingsHtml.push('<label for="' + CL.displaySettingsDetails.configs[i].id + '">');
          settingsHtml.push('<input class="boolean" name="' + CL.displaySettingsDetails.configs[i].id + '" id="' +
                            CL.displaySettingsDetails.configs[i].id + '" type="checkbox"/>');
          settingsHtml.push(CL.displaySettingsDetails.configs[i].label + '</label>');
          settingsHtml.push('<br/>');
        }
      }
      settingsHtml.push('<input class="pure-button dialogue-form-button" type="button" id="save_settings" value="save and recollate"/>');
      settingsHtml.push('<input class="pure-button dialogue-form-button" type="button" id="close_settings" value="cancel"/>');
      document.getElementsByTagName('body')[0].appendChild(settingsDiv);
      document.getElementById('settings_form').innerHTML = settingsHtml.join('');
      for (let i = 0; i < CL.displaySettingsDetails.configs.length; i += 1) {
        if (document.getElementById(CL.displaySettingsDetails.configs[i].id)) {
          document.getElementById(CL.displaySettingsDetails.configs[i].id).checked = CL.displaySettings[CL.displaySettingsDetails.configs[i].id];
        }
      }
      $('#save_settings').on('click', function() {
        const data = cforms.serialiseForm('settings_form');
        for (const setting in CL.displaySettings) {
          if (Object.prototype.hasOwnProperty.call(CL.displaySettings, setting)) {
            if (Object.prototype.hasOwnProperty.call(data, setting) && data[setting] !== null) {
              CL.displaySettings[setting] = data[setting];
            } else {
              CL.displaySettings[setting] = false;
            }
          }
        }
        RG.recollate();
        CL.isDirty = true; // may not have changed but let's be safe
        document.getElementsByTagName('body')[0].removeChild(document.getElementById('settings'));
      });
      $('#close_settings').on('click', function() {
        document.getElementsByTagName('body')[0].removeChild(document.getElementById('settings'));
      });
    },

    _fetchRules: function(callback) {
      //get the rules according to the appropriate service
      CL.services.getRules(CL.context, function(rules) {
        callback(rules);
      });
    },

    // This is not really needed anymore as we are no longer adding rule_string into the data It is still here because
    // we may have data at the regularisation stage which does still have this key and it may as well be deleted.
    _removeUnrequiredData: function() {
      for (let i = 0; i < CL.data.apparatus.length; i += 1) {
        for (let j = 0; j < CL.data.apparatus[i].readings.length; j += 1) {
          for (let k = 0; k < CL.data.apparatus[i].readings[j].text.length; k += 1) {
            if (Object.prototype.hasOwnProperty.call(CL.data.apparatus[i].readings[j].text[k], 'rule_string')) {
              delete CL.data.apparatus[i].readings[j].text[k].rule_string;
            }
          }
        }
      }
    },

    _showRegularisations: function() {
      if (RG.showRegularisations === true) {
        if (document.getElementById('show_hide_regularisations_button')) {
          document.getElementById('show_hide_regularisations_button').value = document.getElementById('show_hide_regularisations_button').value.replace('show', 'hide');
          $('#show_hide_regularisations_button').on('click.hide_regularisations', function() {
            spinner.showLoadingOverlay();
            const scrollOffset = [document.getElementById('scroller').scrollLeft,
                                  document.getElementById('scroller').scrollTop];
            RG.showRegularisations = false;
            RG.showVerseCollation(CL.data, CL.context, CL.container);
            document.getElementById('scroller').scrollLeft = scrollOffset[0];
            document.getElementById('scroller').scrollTop = scrollOffset[1];
          });
        }
      } else {
        if (document.getElementById('show_hide_regularisations_button')) {
          document.getElementById('show_hide_regularisations_button').value = document.getElementById('show_hide_regularisations_button').value.replace('hide', 'show');
          $('#show_hide_regularisations_button').on('click.show_regularisations', function() {
            spinner.showLoadingOverlay();
            const scrollOffset = [document.getElementById('scroller').scrollLeft,
                                  document.getElementById('scroller').scrollTop];
            RG.showRegularisations = true;
            RG.showVerseCollation(CL.data, CL.context, CL.container);
            document.getElementById('scroller').scrollLeft = scrollOffset[0];
            document.getElementById('scroller').scrollTop = scrollOffset[1];
          });
        }
      }
    },

    _highlightWitness: function(witness) {
      const scrollOffset = [document.getElementById('scroller').scrollLeft,
                            document.getElementById('scroller').scrollTop];
      CL.highlighted = witness;
      RG.showVerseCollation(CL.data, CL.context, CL.container, {
        'highlighted_wit': witness
      });
      document.getElementById('scroller').scrollLeft = scrollOffset[0];
      document.getElementById('scroller').scrollTop = scrollOffset[1];
      if (witness !== 'none') {
        CL.getHighlightedText(witness);
      }
    },

    _addNewToken: function(element) {
      let lastRow, tr;
      $(element).on('click', function(event) {
        lastRow = event.target.parentNode.parentNode;
        tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="' + event.target.parentNode.getAttribute('colspan') + '"><input type="text" size="10"/></td>';
        lastRow.parentNode.insertBefore(tr, lastRow);
      });
    },

    _getWordIndexForWitness: function(unit, reading, word, witness) {
      const token = CL.data.apparatus[unit].readings[reading].text[word];
      return token[witness].index;
    },

    // TODO: check on originalText use
    _createRule: function(data, user, originalText, normalisedText, unit, reading, word, witnesses) {
      let rule, rules, witness, context, reconstructedReadings;
      //sort text out so that anything we turned to &lt; or &gt; get stored as < and >
      //TODO: I'm not sure we even use originalText anymore - check and streamline?
      // originalText = originalText;
      normalisedText = normalisedText.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      //now make the rules
      if (data.scope === 'always' || data.scope === 'verse') {
        rule = {'type': 'regularisation',
                'scope': data.scope,
                'class': data['class'] || 'none',
                't': RG._getWordTokenForWitness(unit, reading, word).replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
                'n': normalisedText};
        if (Object.prototype.hasOwnProperty.call(data, 'comments')) {
          rule.comments = data.comments;
        }
        if (Object.prototype.hasOwnProperty.call(data, 'conditions')) {
          rule.conditions = data.conditions;
        }
        if (data.scope === 'always') {
          rule.context = {};
        } else if (data.scope === 'verse') {
          rule.context = {};
          rule.context.unit = CL.context;
        }
        if (Object.prototype.hasOwnProperty.call(CL.project, 'id')) {
          rule.project = CL.project.id;
        }
        if (Object.prototype.hasOwnProperty.call(CL.project, 'id')) {
          rule.project = CL.project.id;
        } else {
          rule.user = user.id;
        }
        return [rule];
      }
      if (data.scope === 'manuscript' || data.scope === 'once') {
        rules = [];
        for (let i = 0; i < witnesses.length; i += 1) {
          witness = witnesses[i];
          rule = {'type': 'regularisation',
                  'scope': data.scope,
                  'class': data['class'] || 'none',
                  'n': normalisedText};
          if (Object.prototype.hasOwnProperty.call(data, 'comments')) {
            rule.comments = data.comments;
          }
          if (Object.prototype.hasOwnProperty.call(data, 'conditions')) {
            rule.conditions = data.conditions;
          }
          if (Object.prototype.hasOwnProperty.call(CL.project, 'id')) {
            rule.project = CL.project.id;
          } else {
            rule.user = user.id;
          }
          // check to see if witness already has a reconstructed rule applied and if so make sure we are ignoring
          // the presence of underdots and []
          if (Object.prototype.hasOwnProperty.call(CL.data.apparatus[unit].readings[reading].text[word][witness], 'decision_class')) {
            reconstructedReadings = [];
            for (let j = 0; j < CL.project.ruleClasses; j += 1) {
              if (Object.prototype.hasOwnProperty.call(CL.project.ruleClasses[j], 'reconstructedreading') &&
                        CL.project.ruleClasses[j].reconstructedreading === true) {
                reconstructedReadings.push(CL.project.ruleClasses[j].value);
              }
            }
            for (let j = 0; j < CL.data.apparatus[unit].readings[reading].text[word][witness].decision_class.length; j += 1) {
              if (reconstructedReadings.indexOf(CL.data.apparatus[unit].readings[reading].text[word][witness].decision_class) !== -1) {
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
            rule.t = RG._getWordTokenForWitness(unit, reading, word).replace(/&lt;/g, '<').replace(/&gt;/g, '>');
          } else if (data.scope === 'once') {
            context = {};
            context.unit = CL.context;
            context.witness = witness;
            context.word = RG._getWordIndexForWitness(unit, reading, word, witness);
            rule.context = context;
            rule.t = RG._getWordTokenForWitness(unit, reading, word).replace(/&lt;/g, '<').replace(/&gt;/g, '>');
          }
          rules.push(rule);
        }
        if (CL.witnessEditingMode === true) {
          CL.isDirty = true;
        }
        return rules;
      }
    },

    _redipsInitRegularise: function(id) {
      let clone, original, wordId, normalisedForm, normalisedText, unitData, unit, reading, word, witnesses,
          originalText, originalDisplayText, createFunction, variantUnit, collectedWitnesses;
      const rd = REDIPS.drag;
      rd.init(id);
      rd.event.dropped = function() {
        collectedWitnesses = [];
        clone = document.getElementById(rd.obj.id);
        original = document.getElementById(rd.objOld.id);
        wordId = rd.objOld.id;
        normalisedForm = rd.td.target.childNodes[0];
        variantUnit = $(rd.td.target).closest('table')[0];
        // if we are normalising to a typed in value
        if (normalisedForm.tagName === 'INPUT') {
          normalisedText = normalisedForm.value.trim();
          if (/^\s*$/.test(normalisedText) === false) {  // it there is at least one non-space character
            if (/^\S+\s\S/.test(normalisedText) === true) {  // if there are two or more strings separated by a space
              // you have typed a space into the box with is not allowed, regularisation is single token to single token only!
              if (clone.parentNode !== null) {
                clone.parentNode.removeChild(clone);
              }
              alert('You are not allowed to regularise to multiple tokens, the normalised form must not include ' +
                    'spaces.\n\nIf you need to regularise to multiple words this can be done in the Set Variants ' +
                    'interface');
              return;
            } else {
              // you are asking to regularise a single token to a single token that is allowed and we will continue
              rd.td.target.innerHTML = '<div>' + normalisedText.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
            }
          } else {
            // you are trying to normalise to an empty string so stop it!
            if (clone.parentNode !== null) {
              clone.parentNode.removeChild(clone);
            }
            return;
          }
        } else {  // we are normalising to an existing value
          normalisedText = normalisedForm.childNodes[0].textContent;
        }
        normalisedText = CL.project.prepareNormalisedString(normalisedText);
        // stop the dragged clone being added to the dom
        if (clone.parentNode !== null) {
          clone.parentNode.removeChild(clone);
        }
        // get any selected words from this unit, if there are any then we use these alone, if none then just use the word at original
        const selectedWords = $('#' + variantUnit.id + ' *.selected_reg_word');
        for (let i = 0; i < selectedWords.length; i += 1 ) {
          selectedWords[i].objOld={id:$(selectedWords[i]).attr("id")};
          selectedWords[i].unit_data=$(selectedWords[i]).attr("id");
          selectedWords[i].original=$(selectedWords[i]).attr("id");
          selectedWords[i].unit = parseInt(selectedWords[i].unit_data.substring(0, selectedWords[i].unit_data.indexOf('_r')).replace('variant_unit_', ''), 10);
          selectedWords[i].reading = parseInt(selectedWords[i].unit_data.substring(selectedWords[i].unit_data.indexOf('_r') + 2, selectedWords[i].unit_data.indexOf('_w')), 10);
          selectedWords[i].word = parseInt(selectedWords[i].unit_data.substring(selectedWords[i].unit_data.indexOf('_w') + 2), 10);
          selectedWords[i].original_text = CL.data.apparatus[selectedWords[i].unit].readings[selectedWords[i].reading].text[selectedWords[i].word];
          if (CL.witnessAddingMode !== true) {
            selectedWords[i].witnesses = CL.data.apparatus[selectedWords[i].unit].readings[selectedWords[i].reading].witnesses;
          } else {
            selectedWords[i].witnesses = CL.data.apparatus[selectedWords[i].unit].readings[selectedWords[i].reading].witnesses.filter(x => CL.witnessesAdded.includes(x));
          }
          collectedWitnesses.push.apply(collectedWitnesses, selectedWords[i].witnesses);
        }

        unitData = rd.objOld.id;
        unit = parseInt(unitData.substring(0, unitData.indexOf('_r')).replace('variant_unit_', ''), 10);
        
        if (selectedWords.length > 0) {
          let originalWords = []
          for (let i = 0; i < selectedWords.length; i += 1) {
            originalWords.push(CL.data.apparatus[selectedWords[i].unit].readings[selectedWords[i].reading].text[selectedWords[i].word]['interface']);
          }
          originalDisplayText = originalWords.join(', ');
        } else {
          // get the unit, reading and word data to lookup stuff in data structure
          reading = parseInt(unitData.substring(unitData.indexOf('_r') + 2, unitData.indexOf('_w')), 10);
          word = parseInt(unitData.substring(unitData.indexOf('_w') + 2), 10);
          if (CL.witnessAddingMode !== true) {
            witnesses = CL.data.apparatus[unit].readings[reading].witnesses;
          } else {
            witnesses = CL.data.apparatus[unit].readings[reading].witnesses.filter(x => CL.witnessesAdded.includes(x));
          }
          originalText = CL.data.apparatus[unit].readings[reading].text[word];
          originalDisplayText = CL.data.apparatus[unit].readings[reading].text[word]['interface'];
          collectedWitnesses.push.apply(collectedWitnesses, witnesses)
        }

        if (document.getElementById('reg_form') !== null) {
          document.getElementsByTagName('body')[0].removeChild(document.getElementById('reg_form'));
        }
        // function to create the rules - triggered from the form
        createFunction = function() {
          let newUnit, newReading, newWitnesses, suffix;
          // create the rule
          // make sure all the data (even any disabled ones are submitted)
          $('#conditions input').removeAttr('disabled');
          if (document.getElementById('scope').value === 'none') {
            return false;
          }
          const data = cforms.serialiseForm('regularisation_menu');
          if (!Object.prototype.hasOwnProperty.call(data, 'class')) {
            data['class'] = 'none';
          }
          CL.services.getUserInfo(function(user) {
            if (selectedWords.length > 0) {
              for (let i = 0; i < selectedWords.length; i += 1) {
                _rules[selectedWords[i].objOld.id] = RG._createRule(
                  data,
                  user,
                  selectedWords[i].original_text,
                  normalisedText,
                  selectedWords[i].unit,
                  selectedWords[i].reading,
                  selectedWords[i].word,
                  selectedWords[i].witnesses
                );
              }
            } else {
              _rules[wordId] = RG._createRule(data, user, originalText, normalisedText, unit, reading, word, witnesses);
            }
          });
          document.getElementsByTagName('body')[0].removeChild(document.getElementById('reg_form'));
          rd.enableDrag(false, rd.objOld);
          $(original).addClass('regularisation_staged');
          $(original.parentNode).addClass('redips-mark');
	        if ($(original).hasClass('selected_reg_word')) {
            $(original).removeClass('selected_reg_word');
          }
          for (let i = 0; i < selectedWords.length; i += 1) {
            $(selectedWords[i]).removeClass('selected_reg_word');
            $(selectedWords[i]).addClass('regularisation_staged');
            $(selectedWords[i].parentNode).addClass('mark');
          };

          // add witnesses to normalised form in data structure
          const newUnitData = rd.td.target.firstChild.id;
          if (newUnitData !== '') {  // only try this if it is not a user added reading
            newUnit = parseInt(newUnitData.substring(0, newUnitData.indexOf('_r')).replace('variant_unit_', ''), 10);
            newReading = parseInt(newUnitData.substring(newUnitData.indexOf('_r') + 2, newUnitData.indexOf('_w')), 10);
            if (CL.witnessAddingMode !== true) {
              newWitnesses = collectedWitnesses;
            } else {
              newWitnesses = collectedWitnesses.filter(x => CL.witnessesAdded.includes(x));
            }
            if (Object.prototype.hasOwnProperty.call(CL.project, 'id')) {
              for (let i = 0; i < newWitnesses.length; i += 1) {
                suffix = RG._getSuffix(data['class']);
                CL.data.apparatus[newUnit].readings[newReading].witnesses.push(newWitnesses[i] + suffix);
              }
            }
          }
        };  // end of createFunction
        $.get(staticUrl + 'CE_core/html_fragments/rule_menu.html', function(html) {
          let selected;
          const regMenu = document.createElement('div');
          regMenu.setAttribute('id', 'reg_form');
          regMenu.setAttribute('class', 'reg_form dialogue_form');
          html = html.replace('{unit_data}', unitData);
          html = html.replace('{original_text}', CL.project.prepareDisplayString(originalDisplayText));
          html = html.replace('{normalised_text}',
                              CL.project.prepareDisplayString(normalisedText).replace(/</g, '&lt;').replace(/>/g, '&gt;'));
          regMenu.innerHTML = html;
          document.getElementsByTagName('body')[0].appendChild(regMenu);
          if (CL.project.allowCommentsOnRegRules === true) {
            document.getElementById('reg_rules_comments_div').style.display = 'block';
          }
          const regRules = CL.getRuleClasses('create_in_RG', true, 'value', ['identifier', 'name', 'RG_default']);
          const newRegRules = [];
          selected = 'none';
          for (const key in regRules) {
            if (Object.prototype.hasOwnProperty.call(regRules, key)) {
              if (typeof regRules[key][0] !== 'undefined') {
                newRegRules.push({'value': key, 'label': regRules[key][1] + ' (' + regRules[key][0] + ')'});
              } else {
                newRegRules.push({'value': key, 'label': regRules[key][1]});
              }
              if (regRules[key][2] === true) {
                selected = key;
              }
            }
          }
          RG._setUpRuleMenu(rd, newRegRules, selected, createFunction);
        }, 'text');
      };
    },

    _getDisplaySettingValue: function(id, key) {
      for (let i = 0; i < CL.displaySettingsDetails.configs.length; i += 1) {
        if (CL.displaySettingsDetails.configs[i].id === id) {
          return CL.displaySettingsDetails.configs[i][key];
        }
      }
      return null;
    },

    _setUpRuleMenu: function(rd, classes, selected, createFunction) {
      let leftPos, conditionsHtml, id, setting;
      const windowWidth = window.innerWidth;
      leftPos = rd.td.current.offsetLeft + rd.obj.redips.container.offsetParent.offsetLeft -
                          document.getElementById('scroller').scrollLeft;
      if (leftPos + parseInt(document.getElementById('reg_form').offsetWidth) >= windowWidth) {
        leftPos = (windowWidth - parseInt(document.getElementById('reg_form').offsetWidth) - 20);
      }
      document.getElementById('reg_form').style.left = leftPos + 'px';
  
      if (CL.witnessAddingMode === true) {
        document.getElementById('rule_creation_warning').innerHTML = 'Rules created will only apply to the witnesses being added.';
      }
  
      const ruleScopes = RG._getRuleScopes();
      cforms.populateSelect(ruleScopes,
                            document.getElementById('scope'),
                            {'value_key': 'value', 'text_keys': 'label', 'add_select': false});
      cforms.populateSelect(classes,
                            document.getElementById('class'),
                            {'value_key': 'value', 'text_keys': 'label', 'add_select': false, 'selected': selected});
  
      if (Object.prototype.hasOwnProperty.call(CL, 'ruleConditions') && CL.ruleConditions !== undefined) {
        conditionsHtml = [];
        for (let i = 0; i < CL.ruleConditions.configs.length; i += 1) {
          id = 'conditions_' + CL.ruleConditions.configs[i].id;
          conditionsHtml.push('<label for="' + id + '">');
          conditionsHtml.push('<input type="checkbox" class="boolean" id="' + id + '" name="' + id + '"/>');
          conditionsHtml.push(CL.ruleConditions.configs[i].label);
          conditionsHtml.push('</label><br/>');
        }
        document.getElementById('conditions').innerHTML = conditionsHtml.join('');
        for (let i = 0; i < CL.ruleConditions.configs.length; i += 1) {
          if (Object.prototype.hasOwnProperty.call(CL.ruleConditions.configs[i], 'linked_to_settings') &&
                  CL.ruleConditions.configs[i].linked_to_settings === true) {
            setting = CL.ruleConditions.configs[i].setting_id;
            id = 'conditions_' + CL.ruleConditions.configs[i].id;
            if (CL.displaySettings[setting] === RG._getDisplaySettingValue(setting, 'apply_when')) {
              document.getElementById(id).checked = true;
              document.getElementById(id).disabled = true;
            }
          }
        }
      } else {
        document.getElementById('conditions').style.display = 'none';
      }
      drag.initDraggable('reg_form', true, true);
      document.getElementById('regularisation_menu').style.height = document.getElementById('reg_form').offsetHeight - 43 + 'px';
      $('#cancel_button').on('click', function() {
        document.getElementsByTagName('body')[0].removeChild(document.getElementById('reg_form'));
      });
      $('#save_rule_button').on('click', createFunction);
    },

    _getRuleScopes: function() {
      const allowedScopes = ['once', 'verse', 'manuscript', 'always'];
      const ruleScopes = CL.services.supportedRuleScopes;
      const scopesAndLabels = [];
      for (const key in ruleScopes) {
        if (Object.prototype.hasOwnProperty.call(ruleScopes, key) && allowedScopes.indexOf(key) !== -1) {
          scopesAndLabels.push({'value': key, 'label': ruleScopes[key]});
        }
      }
      return scopesAndLabels;
    },

    _getSuffix: function(decisionClass) {
      let suffix;
      suffix = '';
      for (let i = 0; i < CL.ruleClasses.length; i += 1) {
        if (CL.ruleClasses[i].value === decisionClass) {
          if (Object.prototype.hasOwnProperty.call(CL.ruleClasses[i], 'suffixed_sigla') &&
              CL.ruleClasses[i].suffixed_sigla === true &&
              typeof CL.ruleClasses[i].identifier !== 'undefined') {
            suffix += CL.ruleClasses[i].identifier;
          }
        }
      }
      return suffix;
    },

    _makeMenu: function(menuName) {
      if (menuName === 'regularised') {
        document.getElementById('context_menu').innerHTML = '<li id="delete_rule"><span>Delete rule</span></li>' +
                                                            '<li id="delete_variant_unit_rules"><span>Delete rule for all witnesses</span></li>';
      }
      if (menuName === 'regularised_global') {
        document.getElementById('context_menu').innerHTML = '<li id="add_exception"><span>Add exception</span></li>' +
                                                            '<li id="delete_rule"><span>Delete rule</span></li>';
      }
      if (menuName === 'regularisation_staged') {
        document.getElementById('context_menu').innerHTML = '<li id="delete_unapplied_rule"><span>Delete rule</span></li>';
      }
      if (menuName === 'group_delete') {
        document.getElementById('context_menu').innerHTML = '<li id="delete_selected_rules"><span>Delete selected rules</span></li>';
      }
      RG._addContextMenuHandlers();
      return 'context_menu';
    },

    _getAncestorRow: function(element) {
      if (element.tagName === 'TR') {
        return element;
      } else {
        while (element.tagName !== 'TR' && element.tagName !== 'BODY') {
          element = element.parentNode;
        }
        return element;
      }
    },

    _showGlobalExceptions: function(rules) {
      if (document.getElementById('global_exceptions').style.display === 'none') {
        document.getElementById('global_exceptions').style.display = 'block';
        document.getElementById('global_exceptions_list').style.display = 'block';
        drag.initDraggable('global_exceptions', true, true);
      }
      const html = [];
      html.push('<form id="global_exceptions_form" class="pure-form">');
      html.push('<span>To remove an exception check the box<br/> and click the \'Remove exceptions\' button.</span><br/><ul>');
      for (let i = 0; i < rules.length; i += 1) {
        html.push('<li><input type="checkbox" name="' + rules[i].id + '" id="checkbox_' + rules[i].id + '"/>');
        html.push('<label class="checkbox-label" for="checkbox_' + rules[i].id + '">' + rules[i].t + ' &gt; ' + rules[i].n + '</label></li>');
      }
      html.push('</ul><input class="pure-button dialogue-form-button" type="button" value="Remove exceptions" id="remove_exception_button"/>');
      html.push('</form>');
      document.getElementById('global_exceptions_list').innerHTML = html.join('');
      document.getElementById('global_exceptions_list').style.height = document.getElementById('global_exceptions').offsetHeight - 35 + 'px';
      document.getElementById('global_exceptions').style.top = (document.getElementById('header').offsetHeight +
          document.getElementById('scroller').offsetHeight + document.getElementById('single_witness_reading').offsetHeight) -
          document.getElementById('global_exceptions').offsetHeight + 15 + 'px';
      document.getElementById('global_exceptions').style.left = 15 + 'px';
  
      $('#remove_exception_button').off('click.rem_ge');
      $('#remove_exception_button').on('click.rem_ge', function() {
        RG._removeGlobalExceptions();
      });
      $('#global_exceptions_ex').on('click', function() {
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
    },

    _removeGlobalExceptions: function() {
      const data = cforms.serialiseForm('global_exceptions_form');
      const ruleIds = [];
      for (const key in data) {
        if (data[key] !== null) {
          ruleIds.push(key);
        }
      }
      // get the rules
      if (ruleIds.length > 0) {
        CL.services.getRulesByIds(ruleIds, function(rules) {
          // remove this context from exceptions
          for (let i = 0; i < rules.length; i += 1) {
            if (Object.prototype.hasOwnProperty.call(rules[i], 'exceptions') && rules[i].exceptions !== null) {
              if (rules[i].exceptions.indexOf(CL.context) !== -1) {
                rules[i].exceptions.splice(rules[i].exceptions.indexOf(CL.context), 1);
                if (rules[i].exceptions.length === 0) {
                  rules[i].exceptions = null;
                }
              }
            }
          }
          // resave the rules
          CL.services.updateRules(rules, CL.context, function() {
            RG.recollate(false);
          });
        });
      }
    },

    _scheduleAddGlobalException: function() {
      const element = SimpleContextMenu._target_element;
      const row = RG._getAncestorRow(element);
      const ruleId = row.id.substring(row.id.indexOf('_rule_') + 6);
      _forGlobalExceptions.push({'id': ruleId});
      $(row).addClass('deleted');
    },

    _deleteUnappliedRule: function() {
      const element = SimpleContextMenu._target_element;
      delete _rules[element.id];
      $(element.parentNode).removeClass('redips-mark');
      $(element).removeClass('regularisation_staged');
      const rd = REDIPS.drag;
      rd.enableDrag(true, element);
    },

    _scheduleSelectedRulesDeletion: function () {
      var element, row, tbody, selectableId;
      element = SimpleContextMenu._target_element;
      row = RG._getAncestorRow(element);
      tbody = row.parentNode;
      selectableId = tbody.id;
      $('tr.selected_rule').each(function () {
        RG._scheduleRuleDeletion(this);
        // remove the class so it is not selected again if we delete more
        $(this).removeClass('selected_rule');
      });
    },

    _scheduleRuleDeletion: function(element) {
      if (element === undefined) {
        element = SimpleContextMenu._target_element;
      }
      const row = RG._getAncestorRow(element);
      const unitNum = row.id.substring(row.id.indexOf('_unit_') + 6, row.id.indexOf('_row_'));
      const ruleId = row.id.substring(row.id.indexOf('_rule_') + 6);
      const rule = RG._allDeletableRules[unitNum][ruleId];
      const ruleType = rule.scope;
      if (ruleType === 'always') {
        const ok = confirm('You are asking to delete a global rule.\nDeleting this rule will mean it is deleted everywhere ' +
                     'in your project for all editors.\nIf you just want the rule to be ignored in this verse you can ' +
                     'add an exception.\nAre you sure you want to delete this rule?');
        if (ok) {
          $(row).addClass('deleted');
          _forDeletion.push({id: ruleId, scope: ruleType});
          if (CL.witnessEditingMode === true) {
            CL.isDirty = true;
          }
        } else {
          return;
        }
      } else {
        $(row).addClass('deleted');
        _forDeletion.push({id: ruleId, scope: ruleType});
        if (CL.witnessEditingMode === true) {
          CL.isDirty = true;
        }
      }
    },

    _scheduleAllRuleDeletion: function() {
      /* schedule the deletion of all rules in the unit which match the n, t and scope of the clicked rule */
      const element = SimpleContextMenu._target_element;
      const row = RG._getAncestorRow(element);
      const unitNum = row.id.substring(row.id.indexOf('_unit_') + 6, row.id.indexOf('_row_'));
      const ruleId = row.id.substring(row.id.indexOf('_rule_') + 6);
      const rule = RG._allDeletableRules[unitNum][ruleId];
      const ok = confirm(
        'You are asking to delete all regularisations of "' + rule.t + '" to "' + rule.n + '".\n' +
        'Are you sure you want to delete this regularisation in all witnesses in this variant unit?'
      );
      if (ok) {
        // find all the rules we need to delete
        for (let key in RG._allDeletableRules[unitNum]) {
          if (RG._allDeletableRules[unitNum][key].n === rule.n &&
              RG._allDeletableRules[unitNum][key].t === rule.t &&
              RG._allDeletableRules[unitNum][key].scope === rule.scope) {
            $('#' + key).closest('tr').addClass('deleted');
            _forDeletion.push({id: key, scope: rule.scope});
          }
        }
      } else {
        return;
      }
    },

    _addContextMenuHandlers: function() {
      if (document.getElementById('delete_rule')) {
        $('#delete_rule').off('click.dr_c');
        $('#delete_rule').off('mouseover.dr_mo');
        $('#delete_rule').on('click.dr_c', function() {
          RG._scheduleRuleDeletion();
        });
        $('#delete_rule').on('mouseover.dr_mo', function() {
          CL.hideTooltip();
        });
      }
      if (document.getElementById('delete_variant_unit_rules')) {
        $('#delete_variant_unit_rules').off('click.dar_c');
        $('#delete_variant_unit_rules').off('mouseover.dar_mo');
        $('#delete_variant_unit_rules').on('click.dar_c', function() {RG._scheduleAllRuleDeletion();});
        $('#delete_variant_unit_rules').on('mouseover.dar_mo', function() {CL.hideTooltip();});
      }
      if (document.getElementById('add_exception')) {
        $('#add_exception').off('click.ae_c');
        $('#add_exception').off('mouseover.ae_mo');
        $('#add_exception').on('click.ae_c', function() {
          RG._scheduleAddGlobalException();
        });
        $('#add_exception').on('mouseover.ae_mo', function() {
          CL.hideTooltip();
        });
      }
      if (document.getElementById('delete_unapplied_rule')) {
        $('#delete_unapplied_rule').off('click.dur_c');
        $('#delete_unapplied_rule').off('mouseover.dur_mo');
        $('#delete_unapplied_rule').on('click.dur_c', function() {
          RG._deleteUnappliedRule();
        });
        $('#delete_unapplied_rule').on('mouseover.dur_mo', function() {
          CL.hideTooltip();
        });
      }
      if (document.getElementById('delete_selected_rules')) {
        $('#delete_selected_rules').off('click.dsr_c');
        $('#delete_selected_rules').off('mouseover.dsr_mo');
        $('#delete_selected_rules').on('click.dsr_c', function() {
          RG._scheduleSelectedRulesDeletion();
        });
        $('#delete_selected_rules').on('mouseover.dsr_mo', function() {
          CL.hideTooltip();
        });
      }
    },

    /* not currently used but can be useful in debugging */
    _showCollationTable: function(data, context, container) {
      let row, column, witnesses;
      const html = [];
      html.push('<tr>');
      //TODO do we still need both of these
      //sigils for collateX 1.3 witnesses for 1.5+
      if (Object.prototype.hasOwnProperty.call(data, 'sigils')) {
        witnesses = data.sigils;
      } else {
        witnesses = data.witnesses;
      }
      for (let i = 0; i < witnesses.length; i += 1) {
        html.push('<td>' + witnesses[i] + '</td>');
      }
      html.push('</tr>');
      for (let i = 0; i < data.table.length; i += 1) {
        row = data.table[i];
        html.push('<tr>');
        for (let j = 0; j < row.length; j += 1) {
          column = row[j];
          if (column === null) {
            html.push('<td></td>');
          } else {
            html.push('<td>');
            for (let k = 0; k < column.length; k += 1) {
              if (Object.prototype.hasOwnProperty.call(column[k], 'n')) {
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
    }

  };

}());
