/*jshint esversion: 6 */
cforms = (function () {
  "use strict";

  // public function declarations
  let serialiseForm, populateSelect;

  // private function declarations
  let _getValue, _getFormElements, _hasData;



  _getValue = function (elem) {
    var value;
    value = null;
    if ((elem.tagName === 'INPUT' &&
            (elem.type !== 'checkbox' && elem.type !== 'radio')) || elem.tagName === 'TEXTAREA') {
      value = elem.value;
      if ($(elem).hasClass('stringify')) {
        value = JSON.parse(value);
      } else if ($(elem).hasClass('stringlist')) {
        value = value.split('|');
      } else if ($(elem).hasClass('json')) {
        if (value !== '') {
          value = JSON.parse(value);
        }
      } else if ($(elem).hasClass('integer')) {
        value = parseInt(value, 10);
        if (isNaN(value)) {
          value = null;
        }
      } else if ($(elem).hasClass('datetime')) {
        // use null instead of empty string, otherwise just use string as Postgres copes with this
        if (value === '') {
          value = null;
        }
      } else if ($(elem).hasClass('boolean')) {
        // TODO: use value.toLowerCase() but for some reason
        // despite value being a string it gives typeerrors at the mo.
        if (value === 'true') {
          value = true;
        } else if (value === 'false') {
          value = false;
        } else {
          value = null;
        }
      }
    } else if (elem.type === 'checkbox') {
      if ($(elem).hasClass('boolean')) {
        if (elem.checked) {
          value = true;
        } else {
          value = null;
        }
      } else {
        if (elem.checked) {
          value = elem.value;
        }
      }
    } else if (elem.tagName === 'SELECT') {
      value = elem.value;
      if (value !== 'none') {
        if ($(elem).hasClass('integer')) {
          value = parseInt(value, 10);
          if (isNaN(value)) {
            value = null;
          }
        } else if ($(elem).hasClass('boolean')) {
          if (value === 'true') {
            value = true;
          } else {
            if (value === 'false') {
              value = false;
            }
          }
        }
      } else if (!$(elem).hasClass('stringnotnull')) {
        value = null;
      }
    } else {
      if (elem.type === 'radio') {
        if (elem.checked === true) {
          value = elem.value;
        } else {
          value = 'radio_null';
        }
      }
    }
    return value;
  };

  _getFormElements = function (formId, elemList) {
    var elems, filteredElems;
    elems = typeof elemList !== 'undefined' ? elemList : document.getElementById(formId).elements;
    filteredElems = [];
    for (let i = 0; i < elems.length; i += 1) {
      if (elems[i].disabled === false && (elems[i].name || $(elems[i]).hasClass('data_group'))) {
        filteredElems.push(elems[i]);
      }
    }
    return filteredElems;
  };

  _hasData = function (json) {
    for (let key in json) {
      if (json.hasOwnProperty(key)) {
        if (json[key] !== null && json[key] !== '') {
          return true;
        }
      }
    }
    return false;
  };

  /**TODO: make sure you catch errors with parseInt and leave
  the string as it is - forms should be validating entry
  anyway before this point! */
  serialiseForm = function(formId, elemList, prefix) {
      var j, elems, json, elem, subelems, key, subjson, value;
    elems = _getFormElements(formId, elemList);
    json = {};
    for (let i = 0; i < elems.length; i += 1) {
      elem = elems[i];
      if ($(elem).hasClass('data_group')) {
        //construct a list of all elements descending from elem
        subelems = [];
        // j records where we are in the list of elements so we can set i
        // to this to continue our loop where we left of with sub elements
        j = i + 1;
        while ($.contains(elem, elems[j])) {
          subelems.push(elems[j]);
          j += 1;
        }
        key = typeof prefix === 'undefined' ? elem.id : elem.id.replace(prefix, '');
        subjson = serialiseForm(formId, subelems, elem.id + '_');
        if (!$.isEmptyObject(subjson)) {
          if ($(elem).hasClass('objectlist')) {
            if (_hasData(subjson)) {
              try {
                json[key.substring(0, key.lastIndexOf('_'))].push(subjson);
              } catch (err) {
                json[key.substring(0, key.lastIndexOf('_'))] = [ subjson ];
              }
            } else {
              if (!json.hasOwnProperty(key.substring(0, key.lastIndexOf('_')))) {
                json[key.substring(0, key.lastIndexOf('_'))] = [];
              }
            }
          } else if ($(elem).hasClass('stringlist')) {
            //make an array of strings
            json[key] = [];
            for (let k in subjson) {
              if (subjson.hasOwnProperty(k)) {
                // don't allow empty strings or null in the array
                if (subjson[k] !== '' && subjson[k] !== null) {
                  json[key].push(subjson[k]);
                }
              }
            }
            if (json[key].length === 0) {
              if (!$(elem).hasClass('emptylist')) {
                json[key] = null;
              }
            }
          } else if ($(elem).hasClass('json')) {
            json[key] = JSON.stringify(subjson)
          } else {
            json[key] = subjson;
          }
        } else {
          json[key] = null;
        }
        // reset i to the first element not in our sublist j-1 since we increment j *after* each addition
        i = j - 1;
      } else {
        value = _getValue(elem);
        if (elem.type !== 'radio') {
          if (typeof prefix === 'undefined') {
            json[elem.name] = value;
          } else {
            json[elem.name.replace(prefix, '')] = value;
          }
        } else {
          if (!json.hasOwnProperty(elem.name) || value !== 'radio_null') {
            if (typeof prefix === 'undefined') {
              if (value === 'radio_null') {
                json[elem.name] = null;
              } else {
                json[elem.name] = value;
              }
            } else {
              if (value === 'radio_null') {
                json[elem.name.replace(prefix, '')] = null;
              } else {
                json[elem.name.replace(prefix, '')] = value;
              }
            }
          }
        }
      }
    }
    return json;
  };

  /** Populate a select
   * data = list of json objects containing all data or a list of strings which will be used as value and display
   *        disabled key set to true can be used to disable the option
   * select = HTML element to be populated
   * value_key = a single key as a string to use as value attribute for option
   * text_keys = a string, list of strings or object with numbered keys, to use as text of option,
   *              falls through list until it finds one in the data or comma separates numbered fields if object
   * selected = optional argument to say which of the options should be selected
   * add_select = a boolean as to whether to add 'select' with value 'none' to the head of the data list
   * select_label_text = a string to display in the visible drop down with value 'none' only used if add_select is true
   *                     - if none supplied 'Select' will be used
   * reactivate = a boolean saying whether this select be reactivated once it is populated*/
  populateSelect = function (data, select, options) {
    var optionsHtml, valueKey, textKeys, j, template, mapping, textKey, optionText, optionTextList;
    if (typeof options === 'undefined') {
      options = {};
    }
    optionsHtml = '';
    // this is added by default, add_select must be false to exclude it
    if (!options.hasOwnProperty('add_select') || options.add_select === true) {
      if (options.add_select === true && options.hasOwnProperty('select_label_details')) {
        optionsHtml += '<option value="' + options.select_label_details.value + '">' +
                        options.select_label_details.label + '</option>';
      } else {
        optionsHtml += '<option value="none">select</option>';
      }
    }
    valueKey = options.hasOwnProperty('value_key') ? options.value_key : undefined;
    textKeys = options.hasOwnProperty('text_keys') ? options.text_keys : undefined;
    for (let i = 0; i < data.length; i += 1) {
      //sort out fall through to a key which does exist if textKeys is an array
      if (Array.isArray(textKeys)) {
        for (let j = 0; j < textKeys.length; j += 1) {
          if (data[i].hasOwnProperty(textKeys[j])) {
            textKey = textKeys[j];
            break;
          }
        }
      } else {
        textKey = textKeys;
      }
      // if textKey is an object map multiple keys to display in option
      if ($.isPlainObject(textKey)) {
        optionTextList = [];
        j = 1;
        while (textKey.hasOwnProperty(j)) {
          if (data[i].hasOwnProperty(textKey[j]) && data[i][textKey[j]] !== '' && data[i][textKey[j]] !== null) {
            optionTextList.push(data[i][textKey[j]]);
          }
          j += 1;
        }
        optionText = optionTextList.join(', ');
      }
      // final mapping object for option
      mapping = {val: data[i][valueKey] || data[i],
                 text: optionText || data[i][textKey] || data[i] || ' ',
                 select: "",
                 className: ""};
      if (options.hasOwnProperty('selected') &&
          (data[i][valueKey] === options.selected ||
          data[i] === options.selected ||
          data[i] === String(options.selected))) {
        mapping.select = ' selected="selected"';
      }
      if (options.hasOwnProperty('add_class') &&
          options.add_class.hasOwnProperty('data_key') &&
          options.add_class.hasOwnProperty('data_value') &&
          options.add_class.hasOwnProperty('class_name') &&
          data[i].hasOwnProperty(options.add_class.data_key) &&
          data[i][options.add_class.data_key] === options.add_class.data_value){
        mapping.className = ' class="' + options.add_class.class_name + '"';
      }
      if (data[i].hasOwnProperty('disabled') && data[i].disabled === true) {
        optionsHtml += '<option disabled="disabled" value="' + mapping.val + '"' + mapping.className +
                         mapping.select + '>' + mapping.text + '</option>';
      } else {
        optionsHtml += '<option value="' + mapping.val + '"' + mapping.className + mapping.select + '>' +
                         mapping.text + '</option>';
      }
    }
    select.innerHTML = optionsHtml;
    if (options.hasOwnProperty('reactivate') && options.reactivate === true) {
      select.disabled = false;
    }
  };



  return {
    populateSelect: populateSelect,
    serialiseForm: serialiseForm,
  };

} () );
