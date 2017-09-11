# -*- coding:utf-8 -*-

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_bootstrap import Bootstrap
from werkzeug.contrib.cache import SimpleCache


app = Flask(__name__)
app.config.from_object('config')
db = SQLAlchemy(app)
bootstrap = Bootstrap(app)
cache = SimpleCache()

lm = LoginManager()
lm.init_app(app)
lm.login_view = 'login'


from app import views, models
