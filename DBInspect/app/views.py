# -*- coding:utf-8 -*-
import traceback

from flask import render_template, flash, redirect, session, url_for, request, g, jsonify
from flask_login import login_user, logout_user, current_user, login_required
from app import app, db, lm
from .forms import LoginForm, CheckForm, ServerForm
from .models import User, Check, Server, Inspect, CheckResult, CheckMacro, InspectGroup
import datetime
from unit import s2tb_trans, connect_test


@lm.user_loader
def load_user(iid):
    return User.query.get(int(iid))


@app.before_request
def before_request():
    g.user = current_user


@app.route('/')
@app.route('/index')
@login_required
def index():
    user = g.user
    check_form = CheckForm()
    server_form = ServerForm()
    return render_template('index.html',
                           title='Home',
                           user=user,
                           check_form=check_form,
                           server_form=server_form,
                           )


def create_dict_node(big, small, doc):
    for item in doc['inspect']:
        if item['title'] == big:
            for i in item['table']:
                if i['title'] == small:
                    return i['table']
            else:
                l3 = []
                item['table'].append({'title': small, 'message': '', 'table': l3})
                return l3
    else:
        l1 = []
        l2 = []
        l1.append({'title': small, 'message': '', 'table': l2})
        doc['inspect'].append({'title': big, 'message': '', 'table': l1})
        return l2


@app.route('/test')
def test_aaa():
    try:
        doc = {'title': '',
               'unit': '',
               'overview': {'message': '',
                            'table': {},
                            },
               'inspect': [],
               }
        c_ids = [i for i in request.args.get('ids', '').split(',') if i]
        doc['title'] = doc['unit'] = \
            db.session.query(InspectGroup.describe).join(Inspect, InspectGroup.id == Inspect.gid).filter(
                Inspect.id == c_ids[0]).first()[0]
        for c_id in c_ids:
            result_list = CheckResult.query.filter(CheckResult.inspect_id == c_id).all()
            inspect = Inspect.query.filter(Inspect.id == c_id).first()
            server = Server.query.filter(Server.id == inspect.server_id).first()
            for res in result_list:
                describe = Check.query.filter(Check.id == res.check_id).first().describe.split('-')
                big, small = describe[0], describe[1]
                if big and small:
                    create_dict_node(big, small, doc).append({'title': server.hostname,
                                                              'message': '',
                                                              'n_keys': s2tb_trans(str(res.result))[0],
                                                              'n_values': s2tb_trans(str(res.result))[1],
                                                              })
        return render_template('doc_xml_templ/Template.xml',
                               doc=doc,
                               ), 200, {'Content-Type': 'application/xml'}
    except Exception as e:
        print traceback.format_exc()
        pass
    return render_template('doc_xml_templ/Template.xml',
                           doc=doc,
                           ), 200, {'Content-Type': 'application/xml'}


@app.route('/login', methods=['GET', 'POST'])
def login():
    if g.user is not None and g.user.is_authenticated:
        return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        session['remember_me'] = form.remember_me.data
        password = form.password.data
        remember_me = False
        if 'remember_me' in session:
            remember_me = session['remember_me']
            session.pop('remember_me', None)
        user = User.query.filter_by(username=form.username.data).first()

        if user and user.check_password_hash(password):
            login_user(user, remember=remember_me)
            return redirect(request.args.get('next') or url_for('index'))

        flash('Invalid login. Please try again.')
        return redirect(url_for('login'))

    return render_template('login.html',
                           title='Sign In',
                           form=form,
                           )


@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('index'))


@app.route('/checklist/add', methods=['POST'])
@login_required
def checklist_add():
    form = CheckForm()
    if form.validate_on_submit():
        try:
            check = Check()
            check.describe = form.describe.data
            check.run_user = form.run_user.data
            check.plat = form.plat.data
            check.script = form.script.data
            check.script_type = form.script_type.data
            db.session.add(check)
            db.session.flush()
            for data in form.macros.data:
                if data['key']:
                    check_macro = CheckMacro(check_id=check.id)
                    check_macro.macro_key = data['key']
                    check_macro.macro_value = data['value']
                    db.session.add(check_macro)
            db.session.commit()
            return jsonify({'data': 'add success', 'error': ''})
        except:
            return jsonify({'data': 'something wrong', 'error': '500'})
    return jsonify({'data': 'something wrong', 'error': '400'})


@app.route('/checklist/edit', methods=['POST'])
@login_required
def checklist_edit():
    form = CheckForm()
    if form.validate_on_submit():
        try:
            c_id = request.form.get('check_edit_id', '')
            check = Check.query.filter(Check.id == c_id).first()
            check.describe = form.describe.data
            check.run_user = form.run_user.data
            check.plat = form.plat.data
            check.script = form.script.data
            check.script_type = form.script_type.data
            db.session.add(check)
            db.session.flush()
            checklist_macro_del(check.id)
            for data in form.macros.data:
                if data['key']:
                    check_macro = CheckMacro(check_id=check.id)
                    check_macro.macro_key = data['key']
                    check_macro.macro_value = data['value']
                    db.session.add(check_macro)
            db.session.commit()
            return jsonify({'data': 'add success', 'error': ''})
        except Exception, e:
            return jsonify({'data': str(e), 'error': '500'})

    return jsonify({'data': 'something wrong', 'error': '500'})


@app.route('/checklist/del', methods=['POST'])
@login_required
def checklist_del():
    try:
        c_ids = request.form.get('ids', '').split(',')
        for c_id in c_ids:
            check = Check.query.filter(Check.id == c_id).first()
            if check:
                db.session.delete(check)
                checklist_macro_del(check.id)
                db.session.commit()
        return jsonify({'data': 'del success', 'error': ''})
    except Exception, e:
        return jsonify({'data': str(e), 'error': '500'})


def checklist_macro_del(check_id):
    try:
        check_macros = CheckMacro.query.filter(CheckMacro.check_id == check_id).all()
        for macro in check_macros:
            db.session.delete(macro)
        db.session.commit()
    except:
        raise


def checklist_macro_2dict(check_id):
    try:
        check_macros = CheckMacro.query.filter(CheckMacro.check_id == check_id).all()
        _ = []
        for macro in check_macros:
            _.append({'key': macro.macro_key, 'value': macro.macro_value})
        return _
    except:
        raise


@app.route('/checklist')
@login_required
def checklist():
    c_id = request.args.get('id', '')
    check_list = Check.query.all()
    if c_id:
        check_list = Check.query.filter(Check.id == c_id).all()
    l0 = []
    for check in check_list:
        macros = checklist_macro_2dict(check.id)
        l1 = ['id', 'describe', 'run_user', 'plat', 'script_type', 'script', 'macros']
        l2 = [check.id, check.describe, check.run_user, check.plat, check.script_type, check.script, macros]
        l0.append(dict(zip(l1, l2)))
    return jsonify({
        'data': l0,
        'error': ''
    })


@app.route('/serverlist/add', methods=['POST'])
@login_required
def serverlist_add():
    form = ServerForm()
    if form.validate_on_submit():
        try:
            server = Server()
            server.describe = form.describe.data
            server.hostname = form.hostname.data
            server.username = form.username.data
            server.password = form.password.data
            server.port = form.port.data
            server.root_password = form.root_password.data
            server.plat = form.plat.data
            db.session.add(server)
            db.session.commit()
            return jsonify({'data': 'add success', 'error': ''})
        except:
            return jsonify({'data': 'something wrong', 'error': '500'})
    return jsonify({'data': 'something wrong', 'error': '504'})


@app.route('/serverlist')
@login_required
def serverlist():
    c_ids = request.args.get('id', '')
    server_list = Server.query.all()
    if c_ids:
        server_list = []
        for c_id in c_ids:
            server_list += Server.query.filter(Server.id == c_id).all()
    l0 = []
    for server in server_list:
        l1 = ['id', 'describe', 'hostname', 'plat', 'username', 'password', 'root_password', 'port']
        l2 = [server.id, server.describe, server.hostname, server.plat, server.username, server.password,
              server.root_password, server.port]
        l0.append(dict(zip(l1, l2)))
    return jsonify({
        'data': l0,
        'error': ''
    })


@app.route('/serverlist/del', methods=['POST'])
@login_required
def serverlist_del():
    try:
        c_ids = request.form.get('ids', '').split(',')
        for c_id in c_ids:
            server = Server.query.filter(Server.id == c_id).first()
            if server:
                db.session.delete(server)
                db.session.commit()
        return jsonify({'data': 'del success', 'error': ''})
    except:
        return jsonify({'data': 'something wrong', 'error': '500'})


@app.route('/serverlist/edit', methods=['POST'])
@login_required
def serverlist_edit():
    form = ServerForm()
    if form.validate_on_submit():
        try:
            c_id = request.form.get('server_edit_id', '')
            server = Server.query.filter(Server.id == c_id).first()
            server.describe = form.describe.data
            server.hostname = form.hostname.data
            server.username = form.username.data
            server.password = form.password.data
            server.port = form.port.data
            server.root_password = form.root_password.data
            server.plat = form.plat.data
            db.session.add(server)
            db.session.commit()
            return jsonify({'data': 'add success', 'error': ''})
        except Exception, e:
            return jsonify({'data': str(e), 'error': '500'})
    return jsonify({'data': 'something wrong', 'error': '500'})


@app.route('/inspect/connect_check')
@login_required
def inspect_connect_check():
    try:
        c_id = request.args.get('id', '')
        if c_id:
            server = Server.query.filter(Server.id == c_id).first()
            if connect_test(server):
                return jsonify({'data': 'connect success', 'error': ''})
        return jsonify({'data': 'something wrong', 'error': '500'})
    except:
        return jsonify({'data': 'something wrong', 'error': '5001'})


@app.route('/inspect/run', methods=['POST'])
@login_required
def inspect_run():
    try:
        c_ids = request.form.get('check_group_ids', '').split(',')
        if c_ids:
            s_ids = request.form.get('server_ids', '').split(',')
            inspect_group = InspectGroup()
            inspect_group.start_time = datetime.datetime.now()
            inspect_group.describe = request.form.get('describe', '')
            db.session.add(inspect_group)
            db.session.flush()
            for s_id in s_ids:
                if s_id:
                    inspect = Inspect()
                    inspect.server_id = s_id
                    inspect.gid = inspect_group.id
                    db.session.add(inspect)
                    db.session.commit()
                    for c_id in c_ids:
                        if c_id:
                            check_res = CheckResult()
                            check_res.check_id = c_id
                            check_res.inspect_id = inspect.id
                            check_res.status = 'pre'
                            db.session.add(check_res)
                            db.session.commit()
                    inspect.status = 'pre'
                    inspect.start_time = datetime.datetime.now()
                    db.session.add(inspect)
                    db.session.commit()
            return jsonify({'data': 'run success', 'error': ''})
        return jsonify({'data': 'something wrong', 'error': '500'})
    except:
        return jsonify({'data': 'something wrong', 'error': '500'})


@app.route('/inspect')
@login_required
def inspectlist():
    g_id = request.args.get('id', '')
    inspect_list = Inspect.query.all()
    if g_id:
        inspect_list = Inspect.query.filter(Inspect.gid == g_id).all()
    l0 = []
    for inspect in inspect_list:
        server = Server.query.filter(Server.id == inspect.server_id).first()
        l1 = ['id', 'server', 'hostname', 'starttime', 'endtime', 'status']
        l2 = [inspect.id, server.describe, server.hostname, str(inspect.start_time), str(inspect.end_time),
              inspect.status]
        l0.append(dict(zip(l1, l2)))
    l0.reverse()
    return jsonify({
        'data': l0,
        'error': ''
    })


@app.route('/inspect/group')
@login_required
def inspectgroup():
    c_id = request.args.get('id', '')
    inspect_group_list = InspectGroup.query.all()
    if c_id:
        inspect_group_list = InspectGroup.query.filter(Inspect.id == c_id).all()
    l0 = []
    for inspect_group in inspect_group_list:
        l1 = ['id', 'describe', 'starttime']
        l2 = [inspect_group.id, inspect_group.describe, str(inspect_group.start_time)]
        l0.append(dict(zip(l1, l2)))
    l0.reverse()
    return jsonify({
        'data': l0,
        'error': ''
    })


@app.route('/inspect/report')
@login_required
def inspect_report():
    c_id = request.args.get('id', '')
    if not c_id:
        return jsonify({
            'data': '',
            'error': '500'
        })
    result_list = CheckResult.query.filter(CheckResult.inspect_id == c_id).all()
    l0 = []
    for res in result_list:
        l1 = ['id', 'check_item', 'result', 'status']
        check_item = Check.query.filter(Check.id == res.check_id).first()
        l2 = [res.id, check_item.describe, res.result, res.status]
        l0.append(dict(zip(l1, l2)))

    return jsonify({
        'data': l0,
        'error': ''
    })
