/* exported DEF */
var DEF = (function() {

  return {

    ruleClasses: [{
        "value": "none",
        "name": "None",
        "create_in_RG": true,
        "create_in_SV": true,
        "create_in_OR": true,
        "suffixed_sigla": false,
        "suffixed_label": false,
        "suffixed_reading": false,
        "subreading": false,
        "keep_as_main_reading": false
      },
      {
        "value": "reconstructed",
        "name": "Reconstructed",
        "create_in_RG": true,
        "create_in_SV": true,
        "create_in_OR": true,
        "identifier": "V",
        "suffixed_sigla": true,
        "suffixed_label": false,
        "suffixed_reading": false,
        "subreading": false,
        "keep_as_main_reading": false
      },
      {
        "value": "regularised",
        "name": "Regularised",
        "create_in_RG": true,
        "create_in_SV": true,
        "create_in_OR": true,
        "identifier": "r",
        "suffixed_sigla": false,
        "suffixed_label": true,
        "suffixed_reading": false,
        "subreading": true,
        "keep_as_main_reading": false
      },
      {
        "value": "abbreviation",
        "name": "Abbreviation",
        "create_in_RG": true,
        "create_in_SV": true,
        "create_in_OR": true,
        "suffixed_sigla": false,
        "suffixed_label": false,
        "suffixed_reading": false,
        "subreading": false,
        "keep_as_main_reading": false
      }
    ],

    ruleConditions: {
      "python_file": "collation.core.default_implementations",
      "class_name": "RuleConditions",
      "configs": [{
          "id": "ignore_supplied",
          "label": "Ignore supplied markers",
          "function": "ignore_supplied",
          "apply_when": true,
          "check_by_default": false,
          "type": "string_application",
          "linked_to_settings": true,
          "setting_id": "view_supplied",

        },
        {
          "id": "ignore_unclear",
          "label": "Ignore unclear markers",
          "function": "ignore_unclear",
          "apply_when": true,
          "check_by_default": false,
          "type": "string_application",
          "linked_to_settings": true,
          "setting_id": "view_unclear",

        }
      ]
    },

    displaySettings: {
      "python_file": "collation.core.default_implementations",
      "class_name": "ApplySettings",
      "configs": [{
          "id": "view_supplied",
          "label": "view supplied text",
          "function": "hide_supplied_text",
          "apply_when": false,
          "check_by_default": true,
          "menu_pos": 1,
          "execution_pos": 2
        },
        {
          "id": "view_unclear",
          "label": "view unclear text",
          "function": "hide_unclear_text",
          "apply_when": false,
          "check_by_default": true,
          "menu_pos": 2,
          "execution_pos": 3
        },
        {
          "id": "view_capitalisation",
          "label": "view capitalisation",
          "function": "lower_case",
          "apply_when": false,
          "check_by_default": false,
          "menu_pos": 3,
          "execution_pos": 1
        }
      ]
    },
  };
}());
