# -*- coding:utf-8 -*-

from wtforms import Form
from flask_wtf import FlaskForm
from wtforms import StringField, BooleanField, SubmitField, SelectField, TextAreaField, PasswordField
from wtforms.validators import DataRequired
from wtforms.fields import FieldList, FormField


class LoginForm(FlaskForm):
    username = StringField('username', validators=[DataRequired()],
                           render_kw={})
    password = StringField('password', validators=[DataRequired()])
    remember_me = BooleanField('remember_me', default=False)
    submit = SubmitField('Submit')


class MacroFrom(Form):
    key = StringField('key', validators=[])
    value = StringField('value', validators=[])


class CheckForm(FlaskForm):
    describe = StringField('describe', validators=[DataRequired()],
                           render_kw={})
    plat = SelectField('plat', validators=[DataRequired()],
                       choices=[('linux', 'linux'), ('other', 'other')])
    run_user = SelectField('run_user', validators=[DataRequired()],
                           choices=[('oracle', 'oracle'), ('root', 'root')])
    script_type = SelectField('script_type', validators=[DataRequired()],
                              choices=[('bash', 'bash'), ('sql', 'sql'), ('other', 'other')])
    script = TextAreaField('script', validators=[DataRequired()],
                           render_kw={'cols': 20, 'rows': 7})
    macros = FieldList(FormField(MacroFrom), min_entries=0)


class ServerForm(FlaskForm):
    describe = StringField('describe', validators=[DataRequired()],
                           render_kw={})
    hostname = StringField('hostname', validators=[DataRequired()],
                           render_kw={})
    username = StringField('username', validators=[DataRequired()],
                           render_kw={})
    password = PasswordField('password', validators=[DataRequired()])
    port = StringField('port', validators=[DataRequired()], default='22')
    root_password = PasswordField('root_password', validators=[])
    plat = SelectField('plat', validators=[DataRequired()],
                       choices=[('linux', 'linux'), ('other', 'other')])
