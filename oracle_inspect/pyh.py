# coding:utf-8
# @file: pyh.py
# @purpose: a HTML tag generator
# @author: Emmanuel Turlay <turlay@cern.ch>
__doc__ = """The pyh.py module is the core of the PyH package. PyH lets you
generate HTML tags from within your python code.
See http://code.google.com/p/pyh/ for documentation.
"""
__author__ = "Emmanuel Turlay <turlay@cern.ch>"
__version__ = '$Revision: 63 $'
__date__ = '$Date: 2010-05-21 03:09:03 +0200 (Fri, 21 May 2010) $'

from sys import _getframe, stdout, modules, version
nOpen = {}

nl = '\n'
doctype = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">\n'
charset = '<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />\n'

tags = ['html', 'body', 'head', 'link', 'meta', 'div', 'p', 'form', 'legend',
        'input', 'select', 'span', 'b', 'i', 'option', 'img', 'style',
        'table', 'tr', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'fieldset', 'a', 'title', 'body', 'head', 'title', 'script', 'br', 'table',
        'tbody','ul', 'li', 'ol', 'hr', 'pre']

selfClose = ['input', 'img', 'link', 'br', 'hr']


class Tag(list):
    tagname = ''

    def __init__(self, *arg, **kw):
        self.attributes = kw
        if self.tagname:
            name = self.tagname
            self.isSeq = False
        else:
            name = 'sequence'
            self.isSeq = True
        self.id = kw.get('id', name)
        # self.extend(arg)
        self.indentlvl = 0
        for a in arg:
            self.addObj(a)

    def __iadd__(self, obj):
        "重载累加操作符"
        if isinstance(obj, Tag) and obj.isSeq:
            for o in obj:
                self.addObj(o)
        else:
            self.addObj(obj)

        return self

    def addObj(self, obj):
        if not isinstance(obj, Tag):
            # obj = str(obj)
            obj=unicode(obj)
        id = self.setID(obj)
        setattr(self, id, obj)
        self.append(obj)

    def setID(self, obj):
        if isinstance(obj, Tag):
            id = obj.id
            n = len(
                [t for t in self if isinstance(t, Tag) and t.id.startswith(id)])
        else:
            id = 'content'
            n = len([t for t in self if not isinstance(t, Tag)])
        if n:
            id = '%s_%03i' % (id, n)
        if isinstance(obj, Tag):
            obj.id = id
        return id

    def __add__(self, obj):
        if self.tagname:
            return Tag(self, obj)
        self.addObj(obj)
        return self

    def __lshift__(self, obj):
        "操作符<<重载"
        self += obj
        if isinstance(obj, Tag):
            return obj

    def render(self, file_name=None):
        result = ''

        if self.tagname:
            result = '<%s%s%s>\n' % (
                self.tagname, self.renderAtt(), self.selfClose() * ' /')

        if not self.selfClose():
            for c in self:
                if isinstance(c, Tag):
                    result += c.render()
                else:
                    result += c
            if self.tagname:
                result += '\n</%s>' % self.tagname
        result += '\n'

        if file_name:
            with open(file_name, "w") as f:
                f.write(result)
        else:
            return result

    def renderAtt(self):
        result = ''
        for n, v in self.attributes.iteritems():
            if n != 'txt' and n != 'open':
                if n == 'cl':
                    n = 'class'
                result += ' %s="%s"' % (n, v)
        return result

    def selfClose(self):
        return self.tagname in selfClose


def TagFactory(name):
    class f(Tag):
        tagname = name
    f.__name__ = name
    return f

thisModule = modules[__name__]

for t in tags:
    setattr(thisModule, t, TagFactory(t))


def ValidW3C():
    out = ''
    return out


class PyH(Tag):
    tagname = 'html'

    def __init__(self, name='MyPyHPage'):
        self += head()
        self += body()
        self.attributes = dict(lang='en')
        self.head += title(name)

    def __iadd__(self, obj):
        if isinstance(obj, head) or isinstance(obj, body):
            self.addObj(obj)
        elif isinstance(obj, meta) or isinstance(obj, link):
            self.head += obj
        else:
            self.body += obj
            id = self.setID(obj)
            setattr(self, id, obj)
        return self

    def addJS(self, *arg):
        for f in arg:
            self.head += script(type='text/javascript', src=f)

    def addCSS(self, *arg):
        for f in arg:
            self.head += link(rel='stylesheet', type='text/css', href=f)


    def addStyleSnippet(self, filename):
        "从某个文件中导入css代码段"
        with open(filename, "r") as f:
            txt = f.read()
            self.head += style(txt, type="text/css")

    def addScriptSnippet(self, filename):
        "从某个文件中导入js代码段"
        with open(filename, "r") as f:
            txt = f.read()
            self.head += script(txt, type="text/javascript")

    def printOut(self, file='',encodetype="utf-8"):
        if file:
            f = open(file, 'w')
        else:
            f = stdout
        f.write(unicode(self.render()).encode(encodetype))
        f.flush()
        if file:
            f.close()
