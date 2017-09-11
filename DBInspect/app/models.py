# -*- coding:utf-8 -*-


from app import db
from werkzeug.security import check_password_hash, generate_password_hash


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True)
    email = db.Column(db.String(120))
    password_hash = db.Column(db.String(120), unique=True)
    posts = db.relationship('Post', backref='author', lazy='dynamic')

    is_authenticated = True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        try:
            return unicode(self.id)  # python 2
        except NameError:
            return str(self.id)  # python 3

    # 不能读取
    @property
    def password(self):
        raise Exception("you cant read it")

    # 使用user.password='asda'设置时存入生成的散列密码
    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password_hash(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return '<User %r>' % self.username


class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.String(140))
    timestamp = db.Column(db.DateTime)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    def __repr__(self):
        return '<Post %r>' % (self.body)


class Check(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    describe = db.Column(db.String(100))
    run_user = db.Column(db.String(100))
    plat = db.Column(db.String(100))
    script = db.Column(db.String())
    script_type = db.Column(db.String())
    filter_within = db.Column(db.String())
    filter_without = db.Column(db.String())
    group_id = db.Column(db.Integer, db.ForeignKey('check_group.id'))


class Server(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    describe = db.Column(db.String(120))
    hostname = db.Column(db.String(64), unique=True)
    username = db.Column(db.String(64))
    password = db.Column(db.String(120))
    root_password = db.Column(db.String(120))
    port = db.Column(db.String(10), default='22')
    plat = db.Column(db.String(100))


class Inspect(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    server_id = db.Column(db.Integer, db.ForeignKey('server.id'))
    status = db.Column(db.String)
    result = db.Column(db.String)
    gid = db.Column(db.Integer, db.ForeignKey('inspect_group.id'))


class CheckResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    check_id = db.Column(db.Integer, db.ForeignKey('check.id'))
    result = db.Column(db.String)
    status = db.Column(db.String)
    inspect_id = db.Column(db.Integer, db.ForeignKey('inspect.id'))


class InspectGroup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    describe = db.Column(db.String(100))
    start_time = db.Column(db.DateTime)


class CheckGroup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    describe = db.Column(db.String(100))


class CheckMacro(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    check_id = db.Column(db.Integer, db.ForeignKey('check.id'))
    macro_key = db.Column(db.String(100))
    macro_value = db.Column(db.String(100))


