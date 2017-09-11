# -*- coding:utf-8 -*-

import socket
import time
import paramiko
import re

SHELL_TYPE = {"1": 'sql',
              "2": 'bash', }


class SSH(object):
    def __init__(self, kws):
        self.username = kws["username"]
        self.password = kws["password"]
        self.port = kws["port"]
        self.ip = kws["ip"]
        self.run_user = kws["run_user"]
        self.script_type = kws['script_type']
        self.root_password = kws["root_password"]
        self.port = int(self.port)
        self.base_prompt = r'(>|#|\]|\$|\)) *$'
        self.active = False
        self.chan = None
        self.ssh = None
        self.prompt = ''
        self.current_user = ''
        self.current_shell = ''

    def login(self):
        ssh_info = {"status": False, "content": ""}
        try:
            self.ssh = paramiko.Transport((self.ip, self.port))
            self.ssh.connect(username=self.username, password=self.password)
            self.chan = self.ssh.open_session()
            self.chan.get_pty()
            self.chan.invoke_shell()

            self.active = True
            self.current_shell = SHELL_TYPE['2']
            data = self.clean_buffer()
            if not data["status"]:
                raise Exception(data["content"])
            self.current_user = self.username

            if not self.run_user == self.username:
                self.su_login()
                self.su_login(self.run_user)

            if self.script_type == SHELL_TYPE['1']:
                self.oracle_connect()
                self.get_prompt()
                cmd = 'set linesize 200 \n set pagesize 200'
                self.execute(cmd)

            self.get_prompt()

            ssh_info["status"] = True
        except socket.error:
            ssh_info["content"] = "无法连接主机"
        except paramiko.ssh_exception.AuthenticationException:
            ssh_info["content"] = "账号或者密码错误"
        except Exception, e:
            ssh_info['status'] = False
            ssh_info['content'] = str(e)

        return ssh_info

    def clean_buffer(self):
        ssh_info = {"status": False, "content": ""}
        try:
            if not self.active:
                raise Exception("已经与主机断开连接")
            self.chan.send('\n')
            time.sleep(0.5)
            buff = ""
            while not re.search(self.prompt.split('\r\n')[-1], buff):
                buff += self.chan.recv(512)
            ssh_info["status"] = True
        except Exception, e:
            print "清除缓存失败", str(e)
            ssh_info["status"] = False
            ssh_info["content"] = str(e)
        return ssh_info

    def execute(self, cmd=''):
        ssh_info = {"status": False, "content": ""}
        base_len_r = cmd.count('\r')
        base_len_n = cmd.count('\n')
        cmd = cmd.replace('\r', '').strip('\n')
        if self.active:
            try:
                self.clean_buffer()
                if self.current_shell == SHELL_TYPE['1']:
                    cmd += '\n          \n'
                else:
                    cmd += '\n\n'
                self.chan.send(cmd)
                time.sleep(1)
                self.chan.recv(len(cmd) + base_len_r + base_len_n)
                info_string = self.recv()
                if self.current_shell == SHELL_TYPE['1']:
                    format_list = info_string.strip().strip(self.prompt + ' 0123456789').split('\n')
                else:
                    format_list = info_string.strip().split('\n')
                ssh_info["status"] = True
                # print format_list
                ssh_info["content"] = '\n'.join(format_list[:-2])
            except Exception, e:
                ssh_info["status"] = False
                ssh_info["content"] = str(e)
        return ssh_info

    def recv(self):
        buff = ''
        while not re.search(self.prompt, buff.split('\n')[-1]):
            _buff = self.chan.recv(10240)
            buff += _buff
            time.sleep(0.1)
        return buff

    def set_prompt(self):
        self.chan.send("export PS1='[\u@\h]\$'\n")
        buff = ''
        while not re.search(self.base_prompt, buff.split('\n')[-1]):
            _buff = self.chan.recv(1024)
            buff += _buff
        self.prompt = re.escape(buff.split('\n')[-1])
        return buff

    def get_prompt(self):
        buff = ''
        ssh_info = {"status": False, "content": ""}
        try:
            self.chan.send('\n')
            while not re.search(self.base_prompt, buff.split('\n')[-1]):
                buff += self.chan.recv(1024)
            ssh_info["content"] = buff
            self.prompt = re.escape(buff.split('\n')[-1])
            ssh_info["status"] = True
        except Exception, e:
            ssh_info["content"] = "获取主机提示符错误:[%s]" % str(e)
            ssh_info["status"] = False
        return ssh_info

    def oracle_connect(self):
        ssh_info = {"status": False, "content": ""}
        if self.active:
            try:
                self.chan.send('sqlplus / as sysdba\n')
                time.sleep(1)
                self.recv()
                self.current_shell = SHELL_TYPE['1']
                ssh_info["status"] = True
            except Exception, e:
                ssh_info["content"] = "连接错误:[%s]" % str(e)
                ssh_info["status"] = False
        return ssh_info

    def su_login(self, user='root'):
        ssh_info = {"status": False, "content": ""}
        try:
            if self.current_user == user:
                ssh_info["status"] = True
                ssh_info["content"] = "current user is %s already" % user
                return ssh_info
            if self.current_user == "root":
                # raise Exception("您当前已经是超级管理员!")
                self.chan.send("su - %s\n" % user)
                time.sleep(1)
                self.recv()
                self.current_user = user
                ssh_info['status'] = True
                return ssh_info
            elif self.current_user != "root" and user == "root":
                self.chan.send("su  - root\n")
                buff = ''
                _buff = ""
                while True:
                    buff += self.chan.recv(1024)
                    if re.search("assword|密码", buff.split("\n")[-1]):
                        self.chan.send("%s\n" % self.root_password)
                        while True:
                            _buff += self.chan.recv(1024)
                            if re.search("^su", _buff.split("\n")[-2]):
                                raise Exception("su密码错误")
                            elif re.search(self.base_prompt, _buff.split("\n")[-1]):
                                ssh_info["status"] = True
                                self.current_user = 'root'
                                return ssh_info

        except Exception, e:
            ssh_info["status"] = False
            ssh_info["content"] = str(e)
        return ssh_info

    def logout(self):
        if self.active:
            self.chan.close()
            self.ssh.close()
            self.active = False
        pass


def split_by_num(string, index):
    x2 = 0
    _ = []
    for i in index:
        x1, x2 = x2, int(x2) + i + 1
        _.append(string[x1:x2].strip())
    return _


def s2tb_trans(s):
    if isinstance(s, str):
        s = '\n' + s
        if 'no rows selected' in s.strip():
            return ['result'], [[u'无异常']]
        s = [i.expandtabs(8) for i in s.strip(' ').split('\n') if i and not i.endswith('rows selected.')]
        if s and not s[0].strip():
            s.pop(0)
        if len(s) > 1 and s[1].startswith('---'):
            tb_len = [len(i) for i in s.pop(1).strip().split(' ') if i]
            tb_th = split_by_num(s.pop(0), tb_len)
            tb_tb = []
            for i in s:
                temp_l = split_by_num(i, tb_len)
                if len(temp_l) == len([i for i in temp_l if i]):
                    tb_tb.append(temp_l)
                else:
                    tb_tb[-1] = [tb_tb[-1][i] + temp_l[i] for i in range(len(temp_l))]
            return tb_th, tb_tb
        else:
            return ['result'], [['\n'.join(s)]]


def connect_test(server):
    ser_info = {'username': server.username, 'ip': server.hostname, 'port': server.port,
                'password': server.password, 'root_password': server.root_password, 'run_user': 'oracle',
                'script_type': 'sql'}
    ssh = SSH(ser_info)
    if ssh.login()['status']:
        return 1
    return 0


if __name__ == '__main__':
    pass
