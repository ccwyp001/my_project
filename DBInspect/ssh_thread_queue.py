# -*- coding:utf-8 -*-
import argparse
import logging

import multiprocessing
from threading import Thread, RLock, Condition
from collections import deque as _deque
import Queue
import time
from app import db
from app.models import Server, CheckResult, Check, Inspect, CheckMacro
import datetime
from app.unit import SSH

SHELL_TYPE = {"1": 'sql',
              "2": 'bash', }

LOG_FORMAT = '%(levelname)s\t%(asctime)s\t%(message)s'
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
log = logging.getLogger(__name__)


class SSHThread(Thread):
    def __init__(self, cmd_list, queue, server_info):
        super(SSHThread, self).__init__()
        self.cmd_list = cmd_list
        self.res_queue = queue
        self.server_info = server_info

    def run(self):
        ssh = SSH(self.server_info)
        ssh.login()
        for item in self.cmd_list:
            result = ssh.execute(item[1])
            self.res_queue.put((item[0], result['content']))
            time.sleep(0.3)
        ssh.logout()
        log.debug(self.name + ' sshthread out')


class ResultThread(Thread):
    def __init__(self, queue):
        super(ResultThread, self).__init__()
        self.res_queue = queue

    def run(self):
        while 1:
            try:
                item = self.res_queue.get(timeout=30)
            except:
                break
            check_res = CheckResult.query.filter(CheckResult.id == item[0]).first()
            check_res.result = item[1]
            check_res.status = 'done'
            db.session.add(check_res)
            db.session.commit()
            time.sleep(0.2)
            check_status = CheckResult.query.filter(CheckResult.status != 'done',
                                                    CheckResult.inspect_id == check_res.inspect_id).all()
            if not check_status:
                break
        log.debug('result thread out')


def main():
    log.debug('thread start')
    while 1:
        inspect = Inspect.query.filter(Inspect.status == 'pre').first()
        if inspect:
            Q = Queue.Queue()
            P = []
            server = Server.query.filter(Server.id == inspect.server_id).first()
            run_users = list(Check.query.distinct(Check.run_user).values(Check.run_user))
            script_types = list(Check.query.distinct(Check.script_type).values(Check.script_type))
            for x in run_users:
                for y in script_types:
                    ser_info = {'username': server.username, 'ip': server.hostname, 'port': server.port,
                                'password': server.password, 'root_password': server.root_password, 'run_user': x[0],
                                'script_type': y[0]}
                    checks = Check.query.filter(Check.run_user == x[0], Check.script_type == y[0]).all()
                    cmdlist = []
                    for c in checks:
                        cid = CheckResult.query.filter(CheckResult.inspect_id == inspect.id,
                                                       CheckResult.check_id == c.id).value(CheckResult.id)
                        macros = CheckMacro.query.filter(CheckMacro.check_id == c.id).all()
                        script = c.script
                        for macro in macros:
                            script = script.replace(macro.macro_key, macro.macro_value)
                        if cid:
                            cmdlist.append((cid, script))
                    if cmdlist:
                        t = SSHThread(cmdlist, Q, ser_info)
                        P.append(t)
            C = None

            for t in P:
                t.start()
                log.debug(str(t) + ' is up')
                time.sleep(0.1)
            if P:
                C = ResultThread(Q)
                C.start()

            log.debug(str(inspect.id) + ' running')
            inspect.status = 'running'
            inspect.result = 'abnormal'
            db.session.add(inspect)
            db.session.commit()
            for t in P:
                t.join()
                while t.isAlive():
                    time.sleep(0.2)
            if C:
                C.join()
                while C.isAlive():
                    time.sleep(0.2)
            inspect.status = 'done'
            inspect.end_time = datetime.datetime.now()
            inspect.result = 'done'
            db.session.add(inspect)
            db.session.commit()
            log.debug(str(inspect.id) + ' done')
        time.sleep(1)


class BoundedQueue(object):
    def __init__(self, limit):
        self.mon = RLock()
        self.rc = Condition(self.mon)
        self.wc = Condition(self.mon)
        self.limit = limit
        self.queue = _deque()

    def put(self, item):
        self.mon.acquire()
        while len(self.queue) >= self.limit:
            self.wc.wait()
        self.queue.append(item)
        self.rc.notify()
        self.mon.release()

    def get(self):
        self.mon.acquire()
        while not self.queue:
            self.rc.wait()
        item = self.queue.popleft()
        self.wc.notify()
        self.mon.release()
        return item


if __name__ == '__main__':
    main()
