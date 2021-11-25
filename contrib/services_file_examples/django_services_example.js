/*jshint esversion: 6 */
django_services = (function() {


  const allowWitnessChangesInSavedCollations = false;

  const supportedRuleScopes = {
            'once': 'This place, these MSS',
	    			'verse': 'This verse, all MSS',
	    			'manuscript': 'Everywhere, these MSS',
	    			'always': 'Everywhere, all MSS'};

  const localJavascript = [staticUrl + 'api/js/api.js',
                            staticUrl + 'collation/js/greek_implementations.js'];

  const localPythonImplementations = {
	                    "prepare_t": {
	                        "python_file": "collation.greek_implementations",
	                        "class_name": "PrepareData",
	                        "function": "prepare_t"
	                    }
	                };


  const contextInput = { //this is only a partial implementation as form itself is handled by Django
       'form' : null,
       'result_provider' : function () {
           var book, chapter, verse, ref;
           book = document.getElementById('book').value;
           chapter = document.getElementById('chapter').value;
           verse = document.getElementById('verse').value;
           if (book !== 'none' && !CL.isBlank(chapter) && !CL.isBlank(verse)) {
             if (chapter === '0' && verse == '0' ) {
               return book + '.inscriptio';
             }
             if (chapter === '99' && verse == '0' ) {
               return book + '.subscriptio';
             }
             return book + '.' + chapter + '.' + verse;
           }
           return;
       }
   };

   const witnessSort = function (witnesses) {
	    return witnesses.sort(LOCAL.compareWitnessTypes);
	 };

   const prepareDisplayString = function (string) {
     return LOCAL.prepareDisplayString(string);
   };

   const prepareNormalisedString = function (string) {
     return LOCAL.prepareNormalisedString(string);
   };

   const combineAllLacsInOR = true;
   const combineAllOmsInOR = false;
   const combineAllLacsInApproved = false;
   const combineAllOmsInApproved = false;
   const lacUnitLabel = 'lac verse';
   const omUnitLabel = 'om verse';
   const showGetApparatusButton = true;

   const collationAlgorithmSettings = {'algorithm': 'auto',
                                       'fuzzy_match': true,
                                       'distance': 2};

   const collatexHost = 'http://localhost:7369/collate';

   const preStageChecks = {
	    "order_readings": [
        	{
        	   "function": "LOCAL.areNoDuplicateStatuses",
        	   "pass_condition": true,
        	   "fail_message": "You cannot move to order readings while there are duplicate overlapped readings in the top line."
        	},
        	{
        	   "function": "LOCAL.checkOmOverlapProblems",
        	   "pass_condition": false,
        	   "fail_message": "You cannot move to order readings because there is a overlapped reading with the status 'overlapped' that has text in the overlapped unit."
        	},
          {
            "function": "LOCAL.areNoMultipleAdditionUnits",
            "pass_condition": true,
            "fail_message": "You cannot move to order readings while there are multiple additions at a single index point."
          }
	    ],
	    "approve": [
	        {
	            "function": "LOCAL.areNoDisallowedOverlaps",
	            "pass_condition": true,
	            "fail_message": "You cannot approve this verse because it has an overlapped reading which is identical in word range to a main apparatus unit."
	        }
	    ]
	};

  const overlappedOptions = [{
	    "id": "show_as_overlapped",
	    "label": "Show as overlapped",
	    "reading_flag": "overlapped",
	    "reading_label": "zu",
	    "reading_label_display": "↑"
	},
	{
	    "id": "delete_reading",
	    "label": "Delete reading",
	    "reading_flag": "deleted",
	    "reading_label": "zu",
	}];

	const displaySettings = {
            "python_file": "collation.greek_implementations",
            "class_name": "ApplySettings",
            "configs": [
                {
                    "id": "view_supplied",
                    "label": "view supplied text",
                    "function": "hide_supplied_text",
                    "menu_pos": 1,
                    "execution_pos": 5,
                    "check_by_default": true,
                    "apply_when": false
                },
                {
                    "id": "view_unclear",
                    "label": "view unclear text",
                    "function": "hide_unclear_text",
                    "menu_pos": 2,
                    "execution_pos": 4,
                    "check_by_default": true,
                    "apply_when": false
                },
                {
                    "id": "view_capitalisation",
                    "label": "view capitalisation",
                    "function": "lower_case_greek",
                    "menu_pos": 4,
                    "execution_pos": 3,
                    "check_by_default": false,
                    "apply_when": false
                },
                {
                    "id": "use_lemma",
                    "function": "select_lemma",
                    "menu_pos": null,
                    "execution_pos": 1,
                    "check_by_default": true,
                    "apply_when": true
                },
                {
                    "id": "expand_abbreviations",
                    "label": "expand abbreviations",
                    "function": "expand_abbreviations",
                    "menu_pos": 3,
                    "execution_pos": 2,
                    "check_by_default": true,
                    "apply_when": true
                },
                {
                    "id": "show apostrophes",
                    "label": "show apostrophes",
                    "function": "hide_apostrophes",
                    "menu_pos": 5,
                    "execution_pos": 6,
                    "check_by_default": false,
                    "apply_when": false
                },
                {
                    "id": "show_diaeresis",
                    "label": "show diaeresis",
                    "function": "hide_diaeresis",
                    "menu_pos": 6,
                    "execution_pos": 7,
                    "check_by_default": false,
                    "apply_when": false
                },
                {
                    "id": "show_punctuation",
                    "label": "show punctuation",
                    "function": "show_punctuation",
                    "menu_pos": 7,
                    "execution_pos": 8,
                    "check_by_default": false,
                    "apply_when": true
                }
            ]
        };

    const ruleConditions = {
        "python_file": "collation.greek_implementations",
        "class_name": "RuleConditions",
        "configs" : [
            {
                "id": "ignore_supplied",
                "label": "Ignore supplied markers",
                "linked_to_settings": true,
                "setting_id": "view_supplied",
                "function": "ignore_supplied",
                "apply_when": true,
                "check_by_default": false,
                "type": "string_application"
            },
            {
                "id": "ignore_unclear",
                "label": "Ignore unclear markers",
                "linked_to_settings": true,
                "setting_id": "view_unclear",
                "function": "ignore_unclear",
                "apply_when": true,
                "check_by_default": false,
                "type": "string_application"
            },
            {
                "id": "only_nomsac",
                "label": "Only apply to Nomina Sacra",
                "linked_to_settings": false,
                "function": "match_nomsac",
                "apply_when": true,
                "check_by_default": false,
                "type": "boolean"
            }
        ]
    };


  //function called on document ready
  $(function () {
    CL.setServiceProvider(django_services);
  });

  getUserInfo = function (successCallback) {
    api.getCurrentUser(function (response) {
      if (successCallback !== undefined) {
        successCallback(response);
      }
    });
	};

  initialiseEditor = function () {
    api.setupAjax();
    CL.addIndexHandlers();
    getCurrentEditingProject(function (project) {
      getUserInfo(function (user) {
        if (project.managing_editor == user.id) {
          CL.managingEditor = true;
        } else {
          CL.managingEditor = false;
        }
      });
    });
  };

  showLoginStatus = function(callback) {
    var elem, loginStatusMessage;
    elem = document.getElementById('login_status');
    if (elem !== null) {
      CL.services.getUserInfo(function(response) {
        if (response) {
          loginStatusMessage = 'logged in as ' + response.username;
          elem.innerHTML = loginStatusMessage + '<br/><a href="/accounts/logout?next=/collation">logout</a>';
        } else {
          elem.innerHTML = '<br/><a href="/accounts/login?next=/collation">login</a>';
        }
        if (callback) callback();
      });
    }
  };

  getCurrentEditingProject = function(successCallback) {
    var projectId;
    if (CL.project.hasOwnProperty('id')) {
      projectId = CL.project.id;
    } else {
      projectId = document.getElementById('project').value;
    }
    api.getItemFromDatabase('collation', 'project', projectId, undefined, function(project) {
      if (project.configuration !== null) {
        for (let key in project.configuration) {
          if (project.configuration.hasOwnProperty(key)) {
            project[key] = project.configuration[key];
          }
        }
      }
      delete project.configuration;
      if (successCallback) {
        successCallback(project);
      }
    });
  };

  //WARNING: this returns only the specified fields which are fine for current uses but if extra uses are added extra fields may be needed.
	getUnitData = function (verse, witnessList, successCallback) {
    var search = {'limit': 1000000,
                  'context': verse,
                  '_fields': 'siglum,witnesses,duplicate_position,transcription,transcription_identifier,public,identifier'};
    if (isNaN(parseInt(witnessList[0]))) {
      search.transcription__identifier = witnessList.join();
    } else {
      search.transcription__id = witnessList.join();
    }
    $.ajax({'url': '/collation/collationdata/verse',
        'method': 'POST',
        'data': search}
    ).done(function (response) {
      if (typeof successCallback !== 'undefined') {
        successCallback(response);
      }
    }).fail(function (response) {
      if (typeof errorCallback !== 'undefined') {
        errorCallback(response);
      } else {
        console.log('could not retrieve collation data for ' + verse);
      }
    });
    return;
	};

  getSiglumMap = function (idList, resultCallback) {
    var search;
    if (idList.length > 0) {
      search = {'identifier': idList.join(), '_fields': 'id,identifier,siglum', 'limit': 100000};
      $.ajax({'url': 'collation/collationdata/transcription',
          'method': 'POST',
          'data': search}
      ).done(function (response) {
        var transcriptionList, siglumMap;
        transcriptionList = response.results;
        siglumMap = {};
        for (let i = 0; i < transcriptionList.length; i += 1) {
          if (idList.indexOf(transcriptionList[i].identifier) !== -1) {
            siglumMap[transcriptionList[i].siglum] = transcriptionList[i].identifier;
          }
        }
        resultCallback(siglumMap);
      });
    } else {
      resultCallback({});
    }
  };

  getWitnessesFromInputForm = function() {
    var witnessList, data, key;
    if (document.getElementById('preselected_witnesses')) {
      witnessList = document.getElementById('preselected_witnesses').value.split(',');
    } else {
      witnessList = [];
      data = cforms.serialiseForm('collation_form');
      if (!$.isEmptyObject(data)) {
        witnessList = [];
        for (key in data) {
          if (data.hasOwnProperty(key)) {
            if (data[key] !== null) {
              witnessList.push(key);
            }
          }
        }
        if (witnessList.indexOf(CL.dataSettings.base_text) === -1) {
          witnessList.push(CL.dataSettings.base_text);
        }
      }
    }
    return witnessList;
  };

  getDebugSetting = function() {
    if (document.getElementById('debug') && document.getElementById('debug').value === 'True') {
      return true;
    }
    return false;
  };

  applySettings = function (data, resultCallback) {
    var url;
    url = '/collation/applysettings/';
    $.ajax({
      type: 'POST',
      url: url,
      data: {'data' :JSON.stringify(data)},
      success: function(data){
        resultCallback(data);
      }}).fail(function(o) {
        resultCallback(null);
    });
  };

  updateRuleset  = function (forDeletion, forGlobalExceptions, forAddition, verse, successCallback) {
    if (forDeletion.length > 0) {
      api.deleteItemFromDatabase('collation', 'decision', forDeletion[0].id, function (deleted) {
        forDeletion.shift(); //remove the first item from the list
        return updateRuleset(forDeletion, forGlobalExceptions, forAddition, verse, successCallback);
      }, function (deleted) {
        forDeletion.shift(); //remove the first item from the list
        return updateRuleset(forDeletion, forGlobalExceptions, forAddition, verse, successCallback);
      });
    } else if (forGlobalExceptions.length > 0) {
      api.getItemFromDatabase('collation', 'decision', forGlobalExceptions[0].id, CL.project.id, function (response) {
        if (response.hasOwnProperty('exceptions') && response.exceptions !== null) {
          if (response.exceptions.indexOf(verse) === -1 && verse) {
            response.exceptions.push(verse);
          }
        } else {
          response.exceptions = [verse];
        }
        api.updateItemInDatabase('collation', 'decision', response, function () {
          forGlobalExceptions.shift();
          return updateRuleset(forDeletion, forGlobalExceptions, forAddition, verse, successCallback);
        });
      }, function (response) {
        forGlobalExceptions.shift();
        return updateRuleset(forDeletion, forGlobalExceptions, forAddition, verse, successCallback);
      });
    } else if (forAddition.length > 0) {
      api.createItemInDatabase('collation', 'decision', fixClassificationKey(forAddition[0]), function(response) {
        forAddition.shift();
        return updateRuleset(forDeletion, forGlobalExceptions, forAddition, verse, successCallback);
      });
    } else {
      if (successCallback) successCallback();
    }
  };

  // if verse is passed, then verse rule; otherwise global
  //TODO: this is only used in global exception editing. If this remains the case change name
  //This must handle the concurrency control of the database so I am redoing the exception removal here
  //this does not need to be replicated in local services or any service in which rules are not shared by mupltiple users
  // as concurrency control is not an issue
	updateRules = function(rules, verse, successCallback) {
    if (rules.length === 0) {
      if (successCallback) successCallback();
      return;
    }
    api.getItemFromDatabase('collation', 'decision', rules[0].id, CL.project.id, function (response) {
      if (response.hasOwnProperty('exceptions') && response.exceptions !== null) {
        if (response.exceptions.indexOf(verse) !== -1) {
          response.exceptions.splice(response.exceptions.indexOf(verse), 1);
          if (response.exceptions.length === 0) {
            response.exceptions = null;
          }
        }
      }
      api.updateFieldsInDatabase('collation', 'decision', response.id, {'exceptions': response.exceptions}, function() {
        rules.shift();
        return updateRules(rules, verse, successCallback);
      });
    });
	};


  getRulesByIds = function(ids, resultCallback) {
    api.getItemsFromDatabase('collation',
                             'decision',
                             {'project__id': CL.project.id, 'limit': 1000000, 'id': ids.join()},
                             'GET', function (response) {
      resultCallback(response.results);
    });
	};

  fixClassificationKey = function (rule) {
    if (rule.hasOwnProperty('class')) {
      rule.classification = rule.class;
      delete rule.class;
    }
    return rule;
  };

  //get all rules that could be applied to the given verse
  getRules = function (verse, resultCallback) {
    getUserInfo(function(currentUser) {
      var shared, always, rules;
      if (currentUser) {
        if (CL.project.hasOwnProperty('id')) {
          shared = {'limit': 1000000, 'project__id': CL.project.id};
        } else {
          shared = {'limit': 1000000, 'user__id': currentUser._id};
        }
      } else {
        //Should never happen as this would mean noone is logged in
        shared = {};
      }
      rules = [];
      //get global rules
      always = JSON.parse(JSON.stringify(shared));
      always.scope = 'always';
      always.exceptions = '!' + verse;
      api.getItemsFromDatabase('collation', 'decision', always, 'GET', function (glbl) {
        var verseOnce;
        rules.push.apply(rules, glbl.results);
        verseOnce = JSON.parse(JSON.stringify(shared));
        verseOnce.scope = 'verse,once';
        verseOnce.context__unit = verse;
        api.getItemsFromDatabase('collation', 'decision', verseOnce, 'GET', function (veronce) {
          var ms;
          rules.push.apply(rules, veronce.results);
          ms = JSON.parse(JSON.stringify(shared));
          ms.scope = 'manuscript';
          api.getItemsFromDatabase('collation', 'decision', ms, 'GET', function (manu) {
            rules.push.apply(rules, manu.results);
            for (let i = 0; i < rules.length; i += 1) {
              if (rules[i].hasOwnProperty('classification')) {
                rules[i]['class'] = rules[i].classification;
                delete rules[i].classification;
              }
            }
            resultCallback(rules);
          });
        });
      });
    });
  };

  getRuleExceptions = function(verse, resultCallback) {
      api.getItemsFromDatabase('collation',
                               'decision',
                               {'limit': 1000000,'scope': 'always', 'project__id': CL.project.id, 'exceptions': verse},
                               'GET',
                               function (response) {resultCallback(response.results);}
                               );
  };

  doCollation = function(verse, options, resultCallback) {
    var url, legacyProjects;
    legacyProjects = ['ECM John', 'John Family 13', 'John Family 1 with Catena group',
                      'John Family Π', 'John MT', 'Theophylact (John)', 'ECM Mark', '2 Thessalonians (GE)'];
    if (typeof options === "undefined") {
      options = {};
    }
    if (legacyProjects.indexOf(CL.project.name) !== -1) {
      url = 'collation/legacycollationserver/';
    } else {
      url = 'collation/collationserver/';
    }
    if (options.hasOwnProperty('accept')) {
      url += options.accept;
    }
    $.post(url, { options : JSON.stringify(options) }, function(data) {
      resultCallback(data);
    }).fail(function(err) {
      if (err.hasOwnProperty('responseJSON')) {
        alert(err.responseJSON.message);
        spinner.removeLoadingOverlay();
        location.reload();
        return;
      } else {
        resultCallback(null);
      }
    });
  };

  getAdjoiningUnit = function(context, is_previous, resultCallback) {
    var temp, bk, ch, v, nextCh, nextV, criteria;
    temp = context.split('.');
    bk = temp[0];
    if (temp[1] === 'inscriptio' || temp[1] === 'subscriptio') {
      ch = temp[1];
    } else {
      ch = parseInt(temp[1]);
    }
    v = parseInt(temp[2]);
    nextCh = ch;
    nextV = v;
    criteria = {'corpus__language': CL.dataSettings.language + '|i', 'abbreviation': bk};
    api.getItemsFromDatabase('transcriptions', 'structure', criteria, 'GET', function (response) {
      work_data = response.results[0];
      if (is_previous) {
        if (ch === 'inscriptio') {
          return resultCallback(null);
        }
        if ((v === 0 && ch === 99) || ch === 'subscriptio') {
          nextCh = work_data.total_chapters;
          nextV = work_data.verses_per_chapter[work_data.total_chapters];
        } else if (v === 1 && ch === 1) {
          return resultCallback(bk + '.inscriptio');
        } else if (v === 1 && ch !== 0) {
          nextCh = ch - 1;
          if (nextCh === 0) {
            nextV = 0;
          } else {
            nextV = work_data.verses_per_chapter[nextCh];
          }
        } else if (v > 1) {
          nextV = v - 1;
        }
      } else {
        if (ch === 'subscriptio') {
          return resultCallback(null);
        }
        if (ch === 'inscriptio') {
          return resultCallback(bk + '.1.1');
        }
        if (v + 1 <= work_data.verses_per_chapter[ch]) {
          nextCh = ch;
          nextV = v + 1;
        } else if (ch !== work_data.total_chapters) {
          nextCh = ch + 1;
          nextV = 1;
        } else if (ch === work_data.total_chapters) {
          return resultCallback(bk + '.subscriptio');
        }
      }
      if (nextCh !== ch || nextV !== v) {
        return resultCallback(bk + '.' + nextCh + '.' + nextV);
      }
      return resultCallback(null);
    });
  };

  // save a collation
  // result: true if saved and successful, false otherwise
  saveCollation = function(context, collation, confirmMessage, overwriteAllowed, noOverwriteMessage, resultCallback) {
    //add in the NT specific stuff we need
    var temp;
    collation.identifier = collation.id;
    delete collation.id;
    temp = context.split('.');
    collation.verse_number = parseInt(temp[2]);
    collation.chapter_number = parseInt(temp[1]);
    //get work from project
    api.getItemFromDatabase('collation', 'project', collation.project, undefined, function(project) {
      collation.work = project.work;
      //see if we already have a saved version with this identifier (and project due to model restrictions)
      api.getItemsFromDatabase('collation', 'collation', {'identifier': collation.identifier,
                                                          'project__id': project.id}, 'GET', function (response) {
        if (response.count === 0) {
          //then this is a new collation to save
          api.createItemInDatabase('collation', 'collation', collation, function () {
            //successfully created
            resultCallback(true);
            return;
          }, function () {
            resultCallback(false);
            return;
          });
        } else if (response.count === 1) {
          //a saved collation already exists
          var confirmed;
          if (overwriteAllowed) {
            if (confirmMessage === undefined) {
              confirmed = true;
            } else {
              confirmed = confirm(confirmMessage);
            }
            if (confirmed === true) {
              //user decided to overwrite so do that
              collation.id = response.results[0].id;
              api.updateItemInDatabase('collation', 'collation', collation, function() {
                //here if it is approved remove the text selected version if exists
                if (collation.status === 'approved') {
                  criteria = {'status': 'edited',
                              'project__id': collation.project,
                              'context': collation.context
                              };
                  api.getItemsFromDatabase('collation', 'collation', criteria, 'GET', function (edited_collations) {
                    if (edited_collations.results.length === 1) {
                      api.deleteItemFromDatabase('collation',
                                                 'collation',
                                                 edited_collations.results[0].id,
                                                function () {
                                                  resultCallback(true);
                                                  return;
                                                });
                    } else {
                      resultCallback(true);
                      return;
                    }
                  });
                } else {
                  resultCallback(true);
                  return;
                }
              }, function () {
                resultCallback(false);
                return;
              });
            } else {
              //user decided not to overwrite
              resultCallback(false);
              return;
            }
          } else {
            //no permission to overwrite existing saved version
            alert(noOverwriteMessage);
            resultCallback(false);
            return;
          }
        } else {
          alert('There are too many saved versions of this collation. Please contact your systems administrator.');
          resultCallback(false);
          return;
        }
      });
    });
  };


  getApparatusForContext = function (successCallback)  {
    var url, settings, data, format;
    settings = JSON.parse(CL.getExporterSettings());
    if (!settings.hasOwnProperty('options')) {
      settings.options = {};
    }
    settings.options.rule_classes = CL.ruleClasses;
    spinner.showLoadingOverlay();
    url = '/collation/apparatus';
    data = {settings: JSON.stringify(settings),
            data: JSON.stringify([{'context': CL.context, 'structure': CL.data}])
            };
    format = settings.options.format;
    $.post(url, data).then(function (response) {
        var blob, filename, downloadUrl, hiddenLink;
        if (format.indexOf('xml') !== -1) {
          blob = new Blob([response], {'type': 'text/xml'});
          filename = CL.context + '_' + format + '_apparatus.xml';
        } else {
          blob = new Blob([response], {'type': 'text/txt'});
          filename = CL.context + '_' + format + '_apparatus.txt';
        }
        downloadUrl = window.URL.createObjectURL(blob);
        hiddenLink = document.createElement('a');
        hiddenLink.style.display = 'none';
        hiddenLink.href = downloadUrl;
        hiddenLink.download = filename;
        document.body.appendChild(hiddenLink);
        hiddenLink.click();
        window.URL.revokeObjectURL(downloadUrl);
        if (successCallback) {
          successCallback();
        }
    });
  };

	getSavedCollations = function(verse, userId, resultCallback) {
    var criteria;
    criteria = {};
    criteria.context = verse;
    CL.services.getUserInfo(function(currentUser) {
      if (currentUser) {
        if (CL.project.hasOwnProperty('id')) {
          criteria.project__id = CL.project.id;
        } else {
          criteria.user__id = currentUser.id;
        }
        if (userId) {
          criteria.user__id = userId;
        }
        criteria._fields = 'id,user,status,data_settings,last_modified_time,created_time';
        api.getItemsFromDatabase('collation', 'collation', criteria, 'GET', function (response) {
          resultCallback(response.results);
        });
      }
    });
  };

  getUserInfoByIds = function(ids, successCallback) {
    $.ajax({'url': '/collation/whoarethey',
            'method': 'GET',
            'data': {ids: ids.join()}
    }).done(function (response) {
      if (typeof successCallback !== 'undefined') {
        successCallback(response);
      }
    }).fail(function (response) {
      successCallback(null);
    });
  };

  loadSavedCollation = function(id, resultCallback) {
    api.getItemsFromDatabase('collation', 'collation',
                             {'project__id': CL.project.id, 'id': id}, 'GET', function(response) {
      resultCallback(response.results[0]);
    }, function() {
      resultCallback(null);
    });
  };

  getSavedStageIds = function(context, resultCallback) {
    CL.services.getUserInfo(function(user) {
      if (user) {
        var r, s, o, a, results, criteria;
        r = null;
        s = null;
        o = null;
        a = null;
        //first get all of the ones belonging to the user
        criteria = {'user__id': user.id, 'context': context};
        if (CL.project.hasOwnProperty('id')) {
          criteria.project__id = CL.project.id;
        }
        console.log(criteria);
        api.getItemsFromDatabase('collation', 'collation', criteria, 'GET', function (response) {
          results = response.results;
          //now get the approved version for the project
          if (CL.project.hasOwnProperty('id')) {
            criteria = {'context': context, 'project__id': CL.project.id, 'status': 'approved'};
            api.getItemsFromDatabase('collation', 'collation', criteria, 'GET', function (response) {
              results.push.apply(results, response.results);
              for (let i = 0; i < results.length; i += 1) {
                if (results[i].status === 'regularised') {
                  r = results[i].id;
                } else if (results[i].status === 'set') {
                  s = results[i].id;
                } else if (results[i].status === 'ordered') {
                  o = results[i].id;
                } else if (results[i].status === 'approved') {
                  a = results[i].id;
                }
              }
              resultCallback(r, s, o, a);
            });
          } else {
            for (let i = 0; i < results.length; i += 1) {
              if (results[i].status === 'regularised') {
                r = results[i].id;
              } else if (results[i].status === 'set') {
                s = results[i].id;
              } else if (results[i].status === 'ordered') {
                o = results[i].id;
              } else if (results[i].status === 'approved') {
                a = results[i].id;
              }
            }
            resultCallback(r, s, o, a);
          }
        });
      }
    });
  };

  addExtraFooterFunctions = function() {
    if (document.getElementById('overlap_oms')) {
      $('#overlap_oms').off('click.overlap_oms');
      $('#overlap_oms').on('click.overlap_oms', function() {
        // loop through each witness and see if it has om for at least the required number of units

        // collect the oms as you loop
        // then split out the new unit and overlap the witnesses in the corresponding
      });
    }
    if (document.getElementById('overlap_om_verse')) {
      $('#overlap_om_verse').off('click.overlap_om');
      $('#overlap_om_verse').on('click.overlap_om', function() {
        var data, foundOmVerse, appIds, newunit, textList, newTextObject, unitId;
        //make the new unit for the overlapping reading
        newunit = {};
        newunit.start = CL.data.apparatus[0].start;
        // end is pointless we never use it for displaying but we do need a value because most things
        // (especially id adding functions) assume its there
        newunit.end = CL.data.apparatus[CL.data.apparatus.length - 1].end;
        newunit.first_word_index = CL.data.apparatus[0].first_word_index;
        //work on a copy in case we have to abort
        data = JSON.parse(JSON.stringify(CL.data));
        if (data.om_readings.length === 0) {
          return;
        }
        textList = [];
        for (let i = 0; i < data.apparatus.length; i += 1) {
          foundOmVerse = false;
          for (let j = 0; j < data.apparatus[i].readings.length; j += 1) {
            if (data.apparatus[i].readings[j].witnesses.indexOf(data.overtext_name) !== -1) {
              for (let k = 0; k < data.apparatus[i].readings[j].text.length; k += 1) {
                newTextObject = {};
                newTextObject[data.overtext_name] = JSON.parse(JSON.stringify(data.apparatus[i].readings[j].text[k][data.overtext_name]));
                newTextObject.interface = data.apparatus[i].readings[j].text[k].interface;
                newTextObject.verse = data.apparatus[i].readings[j].text[k].verse;
                newTextObject.index = data.apparatus[i].readings[j].text[k].index;
                newTextObject.reading = data.overtext_name;
                textList.push(newTextObject);
              }
            }
            if (data.apparatus[i].readings[j].hasOwnProperty('type') &&
              data.apparatus[i].readings[j].type === 'om_verse' &&
              !data.apparatus[i].readings[j].hasOwnProperty('overlap_status') &&
              data.apparatus[i].readings[j].witnesses.length === data.om_readings.length) {

              foundOmVerse = true;
              delete data.apparatus[i].readings[j].details;
              delete data.apparatus[i].readings[j].type;
              data.apparatus[i].readings[j].overlap_status = 'overlapped';
            }
          }
          if (foundOmVerse === false) {
            alert('There was an error in the data and the om verse readings could not be overlapped');
            return;
          }
        }
        appIds = CL.getOrderedAppLines();
        if (appIds.length === 0) {
          newunit.row = 2;
        } else {
          newunit.row = parseInt(appIds[appIds.length - 1].replace('apparatus', '')) + 1;
        }
        newunit.readings = [{
            'witnesses': [data.overtext_name],
            'text': textList
          },
          {
            'details': 'om verse',
            'type': 'om_verse',
            'text': [],
            'witnesses': JSON.parse(JSON.stringify(data.om_readings))
          }
        ];
        data['apparatus' + newunit.row] = [newunit];
        CL.data = data;
        unitId = CL.addUnitId(CL.data['apparatus' + newunit.row][0], 'apparatus' + newunit.row);
        CL.addReadingIds(CL.data['apparatus' + newunit.row][0]);
        for (let i = 0; i < data.apparatus.length; i += 1) {
          if (!data.apparatus[i].hasOwnProperty('overlap_units')) {
            data.apparatus[i].overlap_units = {};
          }
          data.apparatus[i].overlap_units[unitId] = data.om_readings;
        }
        SV.showSetVariantsData();
      });
    }
  };

  return {

    allowWitnessChangesInSavedCollations: allowWitnessChangesInSavedCollations,
    contextInput: contextInput,
    supportedRuleScopes: supportedRuleScopes,
    localJavascript: localJavascript,
    localPythonImplementations: localPythonImplementations,
    witnessSort: witnessSort,
    prepareNormalisedString: prepareNormalisedString,
    prepareDisplayString: prepareDisplayString,
    combineAllLacsInOR: combineAllLacsInOR,
    combineAllOmsInOR: combineAllOmsInOR,
    combineAllLacsInApproved: combineAllLacsInApproved,
    combineAllOmsInApproved: combineAllOmsInApproved,
    lacUnitLabel: lacUnitLabel,
    omUnitLabel: omUnitLabel,
    showGetApparatusButton: showGetApparatusButton,
    collationAlgorithmSettings: collationAlgorithmSettings,
    collatexHost: collatexHost,
    preStageChecks: preStageChecks,
    ruleConditions: ruleConditions,
    overlappedOptions: overlappedOptions,
    displaySettings: displaySettings,
    initialiseEditor: initialiseEditor,
    getCurrentEditingProject: getCurrentEditingProject,
    getUnitData: getUnitData,
    getSiglumMap: getSiglumMap,
    applySettings: applySettings,
    updateRuleset: updateRuleset,
    getRules: getRules,
    doCollation: doCollation,
    getWitnessesFromInputForm: getWitnessesFromInputForm,
    getDebugSetting: getDebugSetting,
    getAdjoiningUnit: getAdjoiningUnit,
    getUserInfo: getUserInfo,
    getRuleExceptions: getRuleExceptions,
    getRulesByIds: getRulesByIds,
    updateRules: updateRules,
    saveCollation: saveCollation,
    getSavedCollations: getSavedCollations,
    getUserInfoByIds: getUserInfoByIds,
    loadSavedCollation: loadSavedCollation,
    getSavedStageIds: getSavedStageIds,
    getApparatusForContext: getApparatusForContext,
    showLoginStatus: showLoginStatus,
    addExtraFooterFunctions: addExtraFooterFunctions
  };

} () );
