var DEF = (function () {
    "use strict";
    return {

    	ruleClasses: [{"linked_appendix": false, "keep_as_main_reading": false, "name": "None", "create_in_SV": true, "suffixed_label": false, "value": "none", "suffixed_reading": false, "create_in_RG": true, "create_in_OR": true, "subreading": false, "suffixed_sigla": false},
	                 {"linked_appendix": false, "keep_as_main_reading": false, "name": "Reconstructed", "create_in_SV": true, "suffixed_label": false, "value": "reconstructed", "suffixed_reading": false, "create_in_RG": true, "create_in_OR": true, "subreading": false, "identifier": "V", "suffixed_sigla": true},
	                 {"linked_appendix": false, "keep_as_main_reading": false, "name": "Regularised", "create_in_SV": true, "suffixed_label": true, "value": "regularised", "suffixed_reading": false, "create_in_RG": true, "create_in_OR": true, "subreading": true, "identifier": "r", "suffixed_sigla": false},
	                 {"linked_appendix": false, "keep_as_main_reading": false, "name": "Abbreviation", "create_in_SV": true, "suffixed_label": false, "value": "abbreviation", "suffixed_reading": false, "create_in_RG": true, "create_in_OR": true, "subreading": false, "suffixed_sigla": false},],

    	displaySettings:
    		{
    			"python_file": "collation.core.default_implementations",
    			"class_name": "ApplySettings",
    			"configs":
    			[

    			      {
    			    	  	"id": "view_supplied",
                            "label": "view supplied text",
                            "function": "hide_supplied_text",
                            "menu_pos": 1,
                            "execution_pos": 2,
                            "check_by_default": true,
                            "apply_when": false
    			      },
    			      {
                            "id": "view_unclear",
                            "label": "view unclear text",
                            "function": "hide_unclear_text",
                            "menu_pos": 2,
                            "execution_pos": 3,
                            "check_by_default": true,
                            "apply_when": false
    			      },
                      {
                            "id": "view_capitalisation",
                            "label": "view capitalisation",
                            "function": "lower_case",
                            "menu_pos": 3,
                            "execution_pos": 1,
                            "check_by_default": false,
                            "apply_when": false
                       }
    			  ]
            },
        ruleConditions: {
            "python_file": "collation.core.default_implementations",
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
                }
            ]
        },
        overlappedOptions: {

        }

    }
}());
