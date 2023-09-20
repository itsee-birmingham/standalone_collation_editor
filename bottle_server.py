import sys
import os
import json
import bottle
from bottle import run, route, static_file, request, abort, response, redirect
from collation.store import Store
from collation.core.preprocessor import PreProcessor
from collation.core.exporter_factory import ExporterFactory
from collation.core.settings_applier import SettingsApplier


bottle.BaseRequest.MEMFILE_MAX = 1024 * 1024


@route('/')
def start_point():
    redirect('/collation')


@route('/<app>', method=['GET', 'POST'])
@route('/<app>/', method=['GET', 'POST'])
def home(app):
    # print('%s/%s/static' % (basedir, app))
    return static_file('index.html', root='%s/%s/static' % (basedir, app))


@route('/<app>/<core:re:CE_core>/<static_type>/<filename:re:.*(js|css|html|png|gif)>', method=['GET', 'POST'])
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
        return json.dumps(result)
    else:
        abort(400, "Bad Request")


@route('/<app>/collationserver/', method=['POST'])
@route('<app>/collationserver', method=['POST'])
def collation(app):
    params = json.loads(request.params.options)
    p = PreProcessor(params['configs'])
    try:
        output = p.process_witness_list(params['data'])
    except Exception:
        abort(500, "Data Input Exception")
    response.content_type = 'application/json'
    return json.dumps(output)


@route('/collation/applysettings', method=['POST'])
@route('/collation/applysettings/', method=['POST'])
def apply_settings():
    data = json.loads(request.params.data)
    applier = SettingsApplier(data['options'])
    tokens = applier.apply_settings_to_token_list(data['tokens'])
    response.content_type = 'application/json'
    return json.dumps({'tokens': tokens})


@route('/collation/apparatus', method=['POST'])
@route('/collation/apparatus/', method=['POST'])
def apparatus():
    data = json.loads(request.params.data)
    print(data)
    exporter_settings = request.params.settings
    print(exporter_settings)
    options = request.params.options
    print(options)
    if exporter_settings == 'null':
        exf = ExporterFactory()
        # assume default from core exporter
        format = 'positive_xml'
        file_ext = 'xml'
    else:
        exporter_settings = json.loads(exporter_settings)
        if 'options' in exporter_settings:
            options = exporter_settings['options']
        else:
            options = {'format': 'positive_xml'}
        if 'format' in options:
            format = options['format']
            if 'xml' in options['format']:
                file_ext = 'xml'
            else:
                file_ext = 'txt'
        else:
            # assume default from core exporter
            format = 'positive_xml'
            file_ext = 'xml'
        exf = ExporterFactory(exporter_settings, options=options)

    app = exf.export_data(data)
    response.content_type = 'text/plain'
    response.headers['Content-Disposition'] = 'attachment; filename="%s-apparatus.%s"' % (format, file_ext)
    response.set_cookie('fileDownload', 'true')
    return app


@route('/<filename:path>', method=['GET', 'POST'])
@route('/<filename:path>/', method=['GET', 'POST'])
def static_data_files(filename):
    return static_file(filename, root='%s/' % (basedir))


args = sys.argv
basedir = args[1]
run(host='localhost', port=8080, debug=True)
