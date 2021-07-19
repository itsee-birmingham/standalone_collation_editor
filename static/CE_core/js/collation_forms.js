/*jshint esversion: 6 */
cforms = (function () {
  "use strict";

  //public function declarations
  let serialiseForm, populateSelect;

  //private function declarations
  let _getFormElements, _getValue;

  /**TODO: make sure you catch errors with parseInt and leave
  the string as it is - forms should be validating entry
  anyway before this point! */
  serialiseForm = function(form_id, elem_list, prefix) {
      var i, j, k, elems, json, elem, subelems, key, subjson, value;
    elems = _getFormElements(form_id, elem_list);
    json = {};
    for (i = 0; i < elems.length; i += 1) {
      elem = elems[i];
      if ($(elem).hasClass('data_group')) {
        //construct a list of all elements descending from elem
        subelems = [];
        //j records where we are in the list of elements so we can set i
        //to this to continue our loop where we left of with sub elements
        j = i + 1;
        while ($.contains(elem, elems[j])) {
          subelems.push(elems[j]);
          j += 1;
        }
        key = typeof prefix === 'undefined' ? elem.id : elem.id.replace(prefix, '');
        subjson = serialiseForm(form_id, subelems, elem.id + '_');
        if (!$.isEmptyObject(subjson)) {
          if ($(elem).hasClass('objectlist')) {
            if (hasData(subjson)) {
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
            for (k in subjson) {
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
          } else {
            json[key] = subjson;
          }
        } else {
          json[key] = null;
        }
        //reset i to the first element not in our sublist j-1 since we increment j *after* each addition
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

  //NB not all form fields covered - input[radio] for example
  _getValue = function (elem) {
    var value;
    value = null;
    if ((elem.tagName === 'INPUT' && (elem.type !== 'checkbox' && elem.type !== 'radio')) || elem.tagName === 'TEXTAREA') {
      value = elem.value;
      if ($(elem).hasClass('stringify')) {
        value = JSON.parse(value);
      } else if ($(elem).hasClass('stringlist')) {
        value = value.split('|');
      } else if ($(elem).hasClass('integer')) {
        value = parseInt(value, 10);
        if (isNaN(value)) {
          value = null;
        }
      } else if ($(elem).hasClass('datetime')) {
        //use null instead of empty string, otherwise just use string as Postgres copes with this
        if (value === '') {
          value = null;
        }
      } else if ($(elem).hasClass('boolean')) {
        //TODO: use value.toLowerCase() but for some reason
        //despite value being a string it gives typeerrors at the mo.
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
        } else {
          if ($(elem).hasClass('boolean')) {
            if (value === 'true') {
              value = true;
            } else {
              if (value === 'false') {
                value = false;
              }
            }
          }
        }
      } else {
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

  _getFormElements = function (form_id, elem_list) {
    var elems, filtered_elems, i;
    elems = typeof elem_list !== 'undefined' ? elem_list : document.getElementById(form_id).elements;
    filtered_elems = [];
    for (i=0; i < elems.length; i+=1) {
      if (elems[i].disabled === false && (elems[i].name || $(elems[i]).hasClass('data_group'))) {
        filtered_elems.push(elems[i]);
      }
    }
    return filtered_elems;
  };

  /** Populate a select
   * data = list of json objects containing all data or a list of strings which will be used as value and display
   * select = HTML element to be populated
   * value_key = a single key as a string to use as value attribute for option
   * text_keys = a string, list of strings or object with numbered keys, to use as text of option,
   *              falls through list until it finds one in the data or comma separates numbered fields if object
   * selected = optional argument to say which of the options should be selected
   * add_select = a boolean as to whether to add 'select' with value 'none' to the head of the data list
   * select_label_text = a string to display in the visible drop down with value 'none' only used if add_select is true - if none supplied 'Select' will be used
   * reactivate = a boolean saying whether this select be reactivated once it is populated*/
  populateSelect = function (data, select, options) {
    var options_html, value_key, text_keys, i, j, template, mapping, text_key, inner_template, inner_template_list, option_text, inner_mapping, option_text_list;
    if (typeof options === 'undefined') {
      options = {};
    }
    options_html = '';
    //this is added by default, add_select must be false to exclude it
    if (!options.hasOwnProperty('add_select') || options.add_select === true) {
      if (options.add_select === true && options.hasOwnProperty('select_label_details')) {
        options_html += '<option value="' + options.select_label_details.value + '">' + options.select_label_details.label + '</option>';
      } else {
        options_html += '<option value="none">select</option>';
      }
    }

    value_key = options.hasOwnProperty('value_key') ? options.value_key : undefined;
    text_keys = options.hasOwnProperty('text_keys') ? options.text_keys : undefined;
    for (i = 0; i < data.length; i += 1) {
      //sort out fall through to a key which does exist if text_keys is an array
      if (Array.isArray(text_keys)) {
        for (j = 0; j < text_keys.length; j += 1) {
          if (data[i].hasOwnProperty(text_keys[j])) {
            text_key = text_keys[j];
            break;
          }
        }
      } else {
        text_key = text_keys;
      }
      //if text_key is an object map multiple keys to display in option
      if ($.isPlainObject(text_key)) {
        option_text_list = [];
        j = 1;
        while (text_key.hasOwnProperty(j)) {
          if (data[i].hasOwnProperty(text_key[j]) && data[i][text_key[j]] !== '' && data[i][text_key[j]] !== null) {
            option_text_list.push(data[i][text_key[j]]);
          }
          j += 1;
        }
        option_text = option_text_list.join(', ');
      }
      //final mapping object for option
      mapping = {	val: data[i][value_key] || data[i],
            text: option_text || data[i][text_key] || data[i] || ' ',
            select: "",
            className: ""};
      if (options.hasOwnProperty('selected') &&
          (data[i][value_key] === options.selected ||
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
      options_html += '<option value="' + mapping.val + '"' + mapping.className + mapping.select + '>' + mapping.text + '</option>';
    }
    select.innerHTML = options_html;
    if (options.hasOwnProperty('reactivate') && options.reactivate === true) {
      select.disabled = false;
    }
  };

  return {
    populateSelect: populateSelect,
    serialiseForm: serialiseForm,
  };

} () );
