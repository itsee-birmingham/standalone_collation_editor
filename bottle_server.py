import sys
import os
import json
import bottle
from bottle import run, route, static_file, request, abort, response, redirect
from collation.store import Store
from collation.core.preprocessor import PreProcessor
from collation.core.exporter_factory import ExporterFactory


bottle.BaseRequest.MEMFILE_MAX = 1024 * 1024


@route('/')
def start_point():
    redirect('/collation')


@route('/<app>', method=['GET', 'POST'])
@route('/<app>/', method=['GET', 'POST'])
def home(app):
    # print('%s/%s/static' % (basedir, app))
    return static_file('index.html', root='%s/%s/static' % (basedir, app))


@route('/<app>/<core:re:CE_core>/<static_type>/<filename:re:.*(js|css|html)>', method=['GET', 'POST'])
def core_static_files(app, core, static_type, filename):
    return static_file(filename, root='%s/%s/core/static/CE_core/%s/' % (basedir, app, static_type))


@route('/<app>/<static_type>/<filename:re:.*(js|css)>', method=['GET', 'POST'])
def static_files(app, static_type, filename):
    return static_file(filename, root='%s/%s/static/%s/' % (basedir, app, static_type))


# @route('/sitedomain.js')
# def site_domain():
#     return static_file('sitedomain.js', root='%s/static/' % (basedir))


# the Store handler
@route('/<app>/datastore', method=['GET', 'POST'])
@route('/<app>/datastore/', method=['GET', 'POST'])
def datastore(app):
    action = request.params.action
    if not action:
        abort(400, "Bad Request")
    resource_type = request.params.resource_type
    if not resource_type:
        abort(400, "Bad Request")
    # TODO: put this in settings somehow
    data_root = '%s/collation/data' % (basedir)
    if action == 'put':
        resource = request.params.resource
        if not resource:
            abort(400, "Bad Request")
        so = Store()
        so.store_resource(data_root, resource_type, resource)
        return
    elif action == 'delete':
        so = Store()
        so.delete_resource(data_root, resource_type)
        return
    elif action == 'list_children':
        path = os.path.join(data_root, resource_type)
        if not os.path.exists(path):
            abort(400, "Bad Request")
        so = Store()
        result = so.list_child_directories_and_files(path)
        response.content_type = 'application/json'
        return json.dumps(result)  # , default=json_util.default)
    else:
        abort(400, "Bad Request")


@route('/<app>/collationserver/<context>/', method=['POST'])
@route('<app>/collationserver/<context>', method=['POST'])
def collation(app, context):
    params = json.loads(request.params.options)
    requested_witnesses = params['data_settings']['witness_list']
    data_input = params['data_input']
    rules = params['rules']

    if request.params.accept:
        accept = request.params.accept
    else:
        accept = 'lcs'

    if 'project' in params:
        project = params['project']
    else:
        project = None

    if 'base_text' in params['data_settings']:
        basetext_transcription = params['data_settings']['base_text']

    collate_settings = {}
    collate_settings['host'] = 'localhost:7369'
    if 'algorithm' in params['algorithm_settings']:
        collate_settings['algorithm'] = params['algorithm_settings']['algorithm']
    collate_settings['tokenComparator'] = {}
    if 'fuzzy_match' in params['algorithm_settings']:
        collate_settings['tokenComparator']['type'] = 'levenshtein'
        if 'distance' in params['algorithm_settings']:
            collate_settings['tokenComparator']['distance'] = params['algorithm_settings']['distance']
        else:
            # default to 2
            collate_settings['tokenComparator']['distance'] = 2
    else:
        collate_settings['tokenComparator']['type'] = 'equality'

    if 'display_settings_config' in params:
        display_settings_config = params['display_settings_config']

    if 'display_settings' in params:
        display_settings = params['display_settings']

    if 'local_python_functions' in params:
        local_python_functions = params['local_python_functions']
    else:
        local_python_functions = None

    if 'rule_conditions_config' in params:
        rule_conditions_config = params['rule_conditions_config']
    else:
        rule_conditions_config = None

    p = PreProcessor(display_settings_config, local_python_functions, rule_conditions_config)
    try:
        output = p.process_witness_list(data_input, requested_witnesses, rules, basetext_transcription, project, display_settings, collate_settings, accept)
    except:
        abort(500, "Data Input Exception")
    response.content_type = 'application/json'
    return json.dumps(output)  # , default=json_util.default)


@route('/collation/apparatus', method=['POST'])
@route('/collation/apparatus/', method=['POST'])
def apparatus():
    data = json.loads(request.params.data)
    format = request.params.format
    if not format:
        format = 'xml'
    if format == 'xml':
        file_ext = 'xml'
    else:
        file_ext = 'txt'
    exporter_settings = request.params.settings
    print(exporter_settings)
    if exporter_settings != 'null':
        exf = ExporterFactory(exporter_settings)
    else:
        exf = ExporterFactory()

    app = exf.export_data(data, format)
    response.content_type = 'text/plain'
    response.headers['Content-Disposition'] = 'attachment; filename="%s-apparatus.%s"' % (format, file_ext)
    response.set_cookie('fileDownload', 'true')
    return app


@route('/<filename:path>', method=['GET', 'POST'])
@route('/<filename:path>/', method=['GET', 'POST'])
def static_data_files(filename):
    return static_file(filename, root='%s/'% (basedir))


args = sys.argv
basedir = args[1]
run(host='localhost', port=8080, debug=True)
