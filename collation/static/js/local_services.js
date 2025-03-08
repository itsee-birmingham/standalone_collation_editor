local_services = (function() {


  //function called on document ready
  $(function () {
    CL.setServiceProvider(local_services);
  });

  //compulsory settings

	const supportedRuleScopes = {'once': 'This place, these wits',
	    			                   'always': 'Everywhere, all wits'};

  const allowWitnessChangesInSavedCollations = true;

  getUserInfo = function (success_callback) {
    success_callback(_local_user);
  };

  initialiseEditor = function () {
    getCurrentEditingProject(CL.loadIndexPage);
    //in local services everyone is a managing editor as they are not collaborative projects
    CL.managingEditor = true;
  };

  getCurrentEditingProject = function (success_callback) {
    _get_resource('project/' + _current_project  + '/config.json', function (project) {
		    success_callback(JSON.parse(project));
	   });
  };

  getUnitData = function(context, witnesses, success_callback) {
    _load_witnesses(context, witnesses, function(results) {
      success_callback({results:results}, RG.calculate_lac_wits);
    });
  };

  // maps siglum to docid
	getSiglumMap = function(id_list, result_callback, i, siglum_map) {
	  var wit;
	  if (typeof i === 'undefined') {
	    i = 0;
	    siglum_map = {};
	  }
	  if (i >= id_list.length) {
	    return result_callback(siglum_map);
	  }
	  _get_resource('textrepo/json/' + id_list[i] + '/metadata.json', function(wit_text) {
	    try {
	      wit = JSON.parse(wit_text);
	      siglum_map[wit.siglum] = id_list[i];
	    } catch (err) {
	      siglum_map[id_list[i]] = id_list[i];
	    }
	    getSiglumMap(id_list, result_callback, ++i, siglum_map);
	  });
	};

  // if verse is passed, then verse rule; otherwise global
	updateRules = function(rules, verse, success_callback) {
	  updateRuleset([], [], rules, verse, success_callback);
  },



  updateRuleset = function(for_deletion, for_global_exceptions, for_addition, verse, success_callback, i, j, k) {

    if (typeof i === 'undefined') i = 0;
    if (typeof j === 'undefined') j = 0;
    if (typeof k === 'undefined') k = 0;
    if (i < for_deletion.length) {
      _delete_resource(_get_rule_type(for_deletion[i], verse), function() {

        return updateRuleset(for_deletion, for_global_exceptions, for_addition, verse, success_callback, ++i, j, k);
      });
    } else if (j < for_addition.length) {
      if (typeof for_addition[j].id === 'undefined') {
        for_addition[j].id = (for_addition[j].scope === 'always' ? 'global_' : ('verse_' + verse + '_')) + _generate_uuid();
      }
      CL.services.getUserInfo(function(user) {
        for_addition[j]._meta = {
          _last_modified_time: new Date().getTime(),
          _last_modified_by: user.id,
          _last_modified_by_display: user.name
        };
        _put_resource(_get_rule_type(for_addition[j], verse), for_addition[j], function(result) {
          // we know how special we are and we always and only update a rule when we are adding an exception
          return updateRuleset(for_deletion, for_global_exceptions, for_addition, verse, success_callback, i, ++j, k);
        });
      });
    } else if (k < for_global_exceptions.length) {
      getRulesByIds([for_global_exceptions[k].id], function(result) {
        //we are only asking for a single rule so we can just deal with the first thing returned
        if (result.length > 0) {
          if (result[0].hasOwnProperty('exceptions') && result[0].exceptions !== null) {
            if (result[0].exceptions.indexOf(verse) === -1 && verse) {
              result[0].exceptions.push(verse);
            }
          } else {
            result[0].exceptions = [verse];
          }
          //first save the exception then continue the loop in callback
          updateRuleset([], [], [result[0]], undefined, function() {
            return updateRuleset(for_deletion, for_global_exceptions, for_addition, verse, success_callback, i, j, ++k);
          });
        } else {
          return updateRuleset(for_deletion, for_global_exceptions, for_addition, verse, success_callback, i, j, ++k);
        }
      });
    } else if (success_callback) {
      success_callback();
    }
  };

  // get a set of rules specified by array of rule ids
	getRulesByIds = function(ids, result_callback, rules, i) {
	  var rule_type, resource_type;
	  if (typeof i === 'undefined') {
	    rules = [];
	    i = 0;
	  }
	  if (i >= ids.length) {
	    return result_callback(rules);
	  }
	  rule_type = ids[i].split('_')[0];
	  resource_type = 'project/' + CL.project.id +
	    '/rule' +
	    '/' + rule_type + (rule_type === 'verse' ? ('/' + ids[i].split('_')[1]) : '') +
	    '/' + ids[i] + '.json';
	  _get_resource(resource_type, function(rule, status) {
	    if (status === 200) {
	      rules.push(JSON.parse(rule));
	    }
	    return getRulesByIds(ids, result_callback, rules, ++i);
	  });
	};

  getRuleExceptions = function(verse, result_callback, rules, resource_types, i) {
    if (typeof i === 'undefined') {
      rules = [];
      _get_resource_children('project/' + CL.project.id + '/rule/global/', function(resource_types, status) {
        getRuleExceptions(verse, result_callback, rules, resource_types, 0);
      });
      return;
    }
    if (i >= resource_types.length) {
      return result_callback(rules);
    }
    if (resource_types[i].type === 'file') {
      _get_resource('project/' + CL.project.id + '/rule/global/' + resource_types[i].name, function(rule, status) {
        rule = JSON.parse(rule);
        if (rule.exceptions && rule.exceptions.indexOf(verse) !== -1) {
          rules.push(rule);
        }
        return getRuleExceptions(verse, result_callback, rules, resource_types, ++i);
      });
    } else {
      return getRuleExceptions(verse, result_callback, rules, resource_types, ++i);
    }
  };

  //locally everything is a project so only need project rules
	getRules = function(verse, result_callback, rules, resource_types, path_type, i) {
	  var path, parsed;
	  if (typeof i === 'undefined') {
	    if (typeof path_type === 'undefined') {
	      rules = [];
	      path = 'project/' + CL.project.id + '/rule/global/';
	      path_type = 'global';
	    } else {
	      path = 'project/' + CL.project.id + '/rule/verse/' + verse + '/';
	      path_type = 'verse';
	    }
	    _get_resource_children(path, function(resource_types, status) {
	      getRules(verse, result_callback, rules, resource_types ? resource_types : [], path_type, 0);
	    });
	    return;
	  }
	  if (i >= resource_types.length) {
	    if (path_type === 'global') {
	      getRules(verse, result_callback, rules, resource_types, 'verse');
	      return;
	    } else {
	      return result_callback(rules);
	    }
	  }
	  if (resource_types[i].type === 'file') {
	    if (path_type === 'global') {
	      path = 'project/' + CL.project.id + '/rule/global/';
	    } else {
	      path = 'project/' + CL.project.id + '/rule/verse/' + verse + '/';
	    }
	    _get_resource(path + resource_types[i].name, function(rule, status) {
	      rule = JSON.parse(rule);
	      //filter out any with global exceptions for this verse
	      if (!rule.hasOwnProperty('exceptions') || rule.exceptions === null ||  rule.exceptions.indexOf(verse) === -1) {
          rules.push(rule);
	      }
	      return getRules(verse, result_callback, rules, resource_types, path_type, ++i);
	    });
	  } else {
	    return getRules(verse, result_callback, rules, resource_types, path_type, ++i);
	  }
	};

  doCollation = function(verse, options, result_callback) {
    var url;
    if (typeof options === "undefined") {
      options = {};
    }
    url = staticUrl + 'collationserver/';
    if (options.hasOwnProperty('accept')) {
      url += options.accept;
    }
    $.post(url, {
      options: JSON.stringify(options)
    }, function(data) {
      result_callback(data);
    }).fail(function(o) {
      result_callback(null);
    });
  };

  getAdjoiningUnit = function (verse, is_previous, result_callback) {
	    return result_callback(null);
	};

  applySettings = function (data, resultCallback) {
    var url;
    url = staticUrl + 'applysettings/';
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


  // save a collation to local datastore
	saveCollation = function(verse, collation, confirm_message, overwrite_allowed, no_overwrite_message, result_callback) {
	  CL.services.getUserInfo(function(user) {
	    var resource_type;
	    resource_type = 'project/' + CL.project.id + '/user/' + user.id + '/collation/' + collation.status + '/' + verse + '.json';
      //TODO: add created time if needed?
      collation.last_modified_time = new Date().getTime();
      collation.last_modified_by = user.id;
      collation.last_modified_display = user.name;
	    collation.id = resource_type;
      collation.user = user.id;
	    _get_resource(resource_type, function(result, status) {
	      // if exists
	      if (status === 200) {
	        if (overwrite_allowed) {
            if (confirm_message === undefined) {
              confirmed = true;
            } else {
              confirmed = confirm(confirm_message);
            }
	          if (confirmed === true) {
	            _put_resource(resource_type, collation, function(result) {
	              return result_callback(true);
	            });
	          } else {
	            return result_callback(false);
	          }
	        } else {
	          alert(no_overwrite_message);
	          return result_callback(false);
	        }
	      } else {
	        // if doesn't already exist
	        _put_resource(resource_type, collation, function(result) {
	          return result_callback(true);
	        });
	      }
	    });
	  });
	};

  getSavedCollations = function(verse, user_id, result_callback, collations, users, i) {
    var resource_type;
    if (typeof i === 'undefined') {
      collations = [];
      if (user_id) {
        return getSavedCollations(verse, user_id, result_callback, collations, [{
          name: user_id,
          type: 'dir'
        }], 0);
      } else {
        resource_type = 'project/' + CL.project.id + '/user/';
        _get_resource_children(resource_type, function(users, status) {
          if (status === 200) {
            return getSavedCollations(verse, user_id, result_callback, collations, users, 0);
          } else result_callback([]);
        });
        return;
      }
    }

    if (i >= users.length) {
      return result_callback(collations);
    }

    if (users[i].type === 'dir') {
      _get_saved_user_collations(users[i].name, verse, function(user_collations) {
        collations.push.apply(collations, user_collations);
        getSavedCollations(verse, user_id, result_callback, collations, users, ++i);
      });
    } else {
      getSavedCollations(verse, user_id, result_callback, collations, users, ++i);
    }
  };

  getUserInfoByIds = function(ids, success_callback) {
    var user_infos, i;
    user_infos = {};
    for (i = 0; i < ids.length; ++i) {
      if (ids[i] === _local_user.id) {
        user_infos[ids[i]] = _local_user;
      } else {
        user_infos[ids[i]] = {
          _id: ids[i],
          name: ids[i]
        };
      }
    }
    success_callback(user_infos);
  };

  loadSavedCollation = function(id, result_callback) {
    _get_resource(id, function(result, status) {
      if (result_callback) result_callback(status === 200 ? JSON.parse(result) : null);
    });
  };

  getSavedStageIds = function(verse, result_callback) {
    CL.services.getUserInfo(function(user) {
      var r, s, o, a;
      r = null;
      s = null;
      o = null;
      a = null;
      var resource_type;
      resource_type = 'project/' + CL.project.id + '/user/' + user.id + '/collation/regularised/' + verse + '.json';
      _get_resource(resource_type, function(result, status) {
        r = (status === 200) ? resource_type : null;
        resource_type = 'project/' + CL.project.id + '/user/' + user.id + '/collation/set/' + verse + '.json';
        _get_resource(resource_type, function(result, status) {
          s = (status === 200) ? resource_type : null;
          resource_type = 'project/' + CL.project.id + '/user/' + user.id + '/collation/ordered/' + verse + '.json';
          _get_resource(resource_type, function(result, status) {
            o = (status === 200) ? resource_type : null;
            resource_type = 'project/' + CL.project.id + '/user/' + user.id + '/collation/approved/' + verse + '.json';
            _get_resource(resource_type, function(result, status) {
              a = (status === 200) ? resource_type : null;
              result_callback(r, s, o, a);
            });
          });
        });
      });
    });
  };

  //internal service functions/values
  _local_user = {
    id: 'default',
  };

  _current_project = 'default';

  _data_repo = staticUrl + 'data/';

  _data_store_service_url = staticUrl + 'datastore/';

  _generate_uuid = function () {
                        var new_uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                                return v.toString(16);
                        });
                        return new_uuid;
                };


  _get_resource = function (resource_type, result_callback) {
    var url = _data_repo + resource_type + '?defeat_cache='+new Date().getTime();
    $.get(url, function(resource) {
      result_callback(resource, 200);
    }, 'text').fail(function(o) {
      result_callback(null, o.status);
    });
  };

  _put_resource = function(resource_type, resource, result_callback) {
    var params = {
      action: 'put',
      resource_type: resource_type,
      resource: JSON.stringify(resource)
    };
    $.post(_data_store_service_url, params, function(data) {
      result_callback(200);
    }).fail(function(o) {
      result_callback(o.status);
    });
  };

  _delete_resource = function(resource_type, result_callback) {
    var params = {
      action: 'delete',
      resource_type: resource_type
    };
    $.post(_data_store_service_url, params, function(data) {
      result_callback(200);
    }).fail(function(o) {
      result_callback(o.status);
    });
  };

  // returns children for a resource, e.g.,[{ name: "resource_name", type: "file", size: n }]
  _get_resource_children = function(resource_type, result_callback) {
    var params = {
      action: 'list_children',
      resource_type: resource_type
    };
    $.post(_data_store_service_url, params, function(data) {
      result_callback(data, 200);
    }).fail(function() {
      result_callback(null, 400);
    });
  };

  _load_witnesses = function(verse, witness_list, finished_callback, results, i) {
    if (typeof i === 'undefined') {
      i = 0;
      results = [];
    } else if (i > witness_list.length - 1) {
      if (finished_callback) finished_callback(results);
      return;
    }
    var data = [];
    _get_resource('textrepo/json/' + witness_list[i] + '/' + verse + '.json', function(json, status) {
      if (status === 200) {
        var j = JSON.parse(json);
        if (!$.isArray(j)) {
          j = [j];
        }
        for (var k = 0; k < j.length; k += 1) {
          var doc_wit = {
            _id: witness_list[i] + '_' + verse,
            context: verse,
            tei: '',
            siglum: j[k].siglum,
            transcription_siglum: j[k].transcription_siglum,
            witnesses: j[k].witnesses
          };
          //a fudge so exsiting and new data structures still work. Eventually all should just be transcription including the key in doc_wit
          if (j[k].hasOwnProperty('transcription')) {
            doc_wit.transcription_id = j[k].transcription;
          } else {
            doc_wit.transcription_id = j[k].transcription_id
          }
          results.push(doc_wit);
        }
      }
      _load_witnesses(verse, witness_list, finished_callback, results, ++i);
    });
  };

  _get_rule_type = function(rule, verse) {
    return 'project/' + CL.project.id +
      '/rule' +
      '/' + (rule.scope == 'always' ? 'global' : ('verse/' + verse)) +
      '/' + rule.id + '.json';
  };

  _get_saved_user_collations = function(user, verse, result_callback, collations, i) {
    var types = ['regularised', 'set', 'ordered', 'approved'];
    if (typeof collations === 'undefined') {
      collations = [];
    }
    if (typeof i === 'undefined') {
      i = 0;
    }
    if (i >= types.length) {
      return result_callback(collations);
    }
    resource_type = 'project/' + CL.project.id + '/user/' + user + '/collation/' + types[i] + '/' + verse + '.json';
    _get_resource(resource_type, function(collation, status) {
      if (status === 200) {
        collations.push(JSON.parse(collation));
      }
      return _get_saved_user_collations(user, verse, result_callback, collations, ++i);
    });
  };


  getApparatusForContext = function() {
      spinner.showLoadingOverlay();
      CL.services.getUserInfo(function(user) {
        let resource_type, format, url, approved, settings;
        resource_type = 'project/' + CL.project.id + '/user/' + user.id + '/collation/approved/' + CL.context + '.json';
        _get_resource(resource_type, function(result, status) {
          if (status === 200) {
            approved = JSON.parse(result);
          }
          url = staticUrl + 'apparatus';   
          settings = JSON.parse(CL.getExporterSettings());
          if (!settings.hasOwnProperty('options')) {
            settings.options = {};
          }
          settings.options.rule_classes = CL.ruleClasses;
          settings.options.witness_decorators = CL.project.witnessDecorators;
          format = settings.options.format;
          if (format === undefined) {
            // use the default
            format = 'xml';
          }
          data = {settings: JSON.stringify(settings),
                  data: JSON.stringify([{'context': CL.context,
                                         'structure': approved.structure}])};
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
              spinner.removeLoadingOverlay();
          }).fail(function (response) {
            alert('This unit cannot be exported. First try reapproving the unit. If the problem persists please ' +
                  'recollate the unit from the collation home page.');
          });
      });
    });
  };


  return {

    getCurrentEditingProject: getCurrentEditingProject,
    initialiseEditor: initialiseEditor,
    getUnitData: getUnitData,
    getSiglumMap: getSiglumMap,
    getRulesByIds: getRulesByIds,
    updateRules: updateRules,
    updateRuleset: updateRuleset,
    getRules: getRules,
    doCollation: doCollation,
    getAdjoiningUnit: getAdjoiningUnit,
    supportedRuleScopes: supportedRuleScopes,
    getUserInfo: getUserInfo,
    getRuleExceptions: getRuleExceptions,
    saveCollation: saveCollation,
    getSavedCollations: getSavedCollations,
    getUserInfoByIds: getUserInfoByIds,
    loadSavedCollation: loadSavedCollation,
    getSavedStageIds: getSavedStageIds,
    getApparatusForContext: getApparatusForContext,
    applySettings: applySettings,
    allowWitnessChangesInSavedCollations: allowWitnessChangesInSavedCollations

  };

} () );
