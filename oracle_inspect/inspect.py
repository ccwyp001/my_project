# -*- coding:utf-8 -*-

import datetime
from sys import stdout
from subprocess import Popen, PIPE
from optparse import OptionParser
from getpass import getuser
import re
import os
import pyh

script_dir = os.path.split(os.path.realpath(__file__))[0]
cwd_dir = os.getcwd()

TABLESPACE_USAGE = """     SET LINESIZE 500
     SET PAGESIZE 1000
     col FREE_SPACE(M) for 999999999
     col USED_SPACE(M) for 999999999
     col TABLESPACE_NAME for a15
     SELECT D.TABLESPACE_NAME,SPACE "SUM_SPACE(M)",SPACE - NVL(FREE_SPACE, 0) "USED_SPACE(M)",
        ROUND((1 - NVL(FREE_SPACE, 0) / SPACE) * 100, 2) "USED_RATE(%)", FREE_SPACE "FREE_SPACE(M)",
        case when FREE_SPACE=REA_FREE_SPACE then null else ROUND((1 - NVL(REA_FREE_SPACE, 0) / SPACE) * 100, 2) end "REA_USED_RATE(%)",
        case when FREE_SPACE=REA_FREE_SPACE then null else REA_FREE_SPACE end "REA_FREE_SPACE(M)",
        decode(MAXSPACE,0,SPACE,MAXSPACE,MAXSPACE) "MAX_SPACE(M)"
     FROM
       (SELECT TABLESPACE_NAME, ROUND(SUM(BYTES) / (1024 * 1024), 2) SPACE, ROUND(SUM(MAXBYTES) / (1024 * 1024), 2) MAXSPACE
        FROM DBA_DATA_FILES GROUP BY TABLESPACE_NAME) D,
       ( SELECT F1.TABLESPACE_NAME, F1.FREE_SPACE-NVL(F2.FREE_SPACE,0) REA_FREE_SPACE,F1.FREE_SPACE
         FROM
         (SELECT TABLESPACE_NAME, ROUND(SUM(BYTES) / (1024 * 1024), 2) FREE_SPACE
           FROM DBA_FREE_SPACE GROUP BY TABLESPACE_NAME
         ) F1,
         (SELECT TS_NAME TABLESPACE_NAME, ROUND(SUM(SPACE)*8/1024,2) FREE_SPACE
           FROM  DBA_RECYCLEBIN GROUP BY TS_NAME
         ) F2
         WHERE F1.TABLESPACE_NAME=F2.TABLESPACE_NAME(+)
       ) F
      WHERE D.TABLESPACE_NAME = F.TABLESPACE_NAME(+)
      ORDER BY  1 - NVL(REA_FREE_SPACE, 0) / SPACE DESC;
         exit"""

ASM_DISK_USAGE = """SET LINESIZE 500
SET PAGESIZE 1000
column "NAME"     format a15
column "USED(%)"  format a8
SELECT   group_number,
         name,
         state,
         type,
         round(total_mb/1024, 2) AS "TOTAL(G)",
         round((total_mb-free_mb)/1024, 2) AS "USED(G)",
         round(free_mb/1024, 2) AS "FREE(G)",
         to_char((total_mb-free_mb)/total_mb*100, '909.99') AS "USED(%)"
FROM     v$asm_diskgroup
ORDER BY group_number;"""

RMAN_STATUS = """column "DURATION" format a20
SELECT to_char(start_time, 'mm/dd/yy hh24:mi') AS "START",
       to_char(end_time, 'mm/dd/yy hh24:mi') AS "END",
       input_type,
       status,
       time_taken_display AS "DURATION"
  FROM v$rman_backup_job_details
 WHERE start_time > (SYSDATE - 15)
 ORDER BY session_key DESC;"""

BOOL_RAC = """select value from v$parameter where name='cluster_database';"""


def limit_user(user):
    """
    decorator only use in *nix
    :param user: cur user
    :return: error when run as wrong user, the func when true.
    """

    def _deco(func):
        def __deco(*args, **kwargs):
            return func(*args, **kwargs)

        return __deco

    def _error(func):
        def __error(*args, **kwargs):
            return "Sorry, This could only be used by user %s !" % user + os.linesep

        return __error

    if os.name == 'nt' or getuser() in user:
        return _deco
    return _error


def sqlplus_by_popen():
    return Popen(["sqlplus", "-S", "system/oracle", "as", "sysdba"], stdout=PIPE, stdin=PIPE)


def rman_by_popen():
    return Popen(["rman", "target", "/"], stdout=PIPE, stdin=PIPE)


def is_rac():
    sqlplus = sqlplus_by_popen()
    sqlplus.stdin.write("set pagesize 0" + os.linesep)
    sqlplus.stdin.write(BOOL_RAC)
    out, err = sqlplus.communicate()
    return False if out.startswith('FALSE') else True


def get_rac_node_list():
    _ = Popen(["srvctl", "config", "nodeapps"], stdout=PIPE, stdin=PIPE)
    out, err = _.communicate()
    return re.findall('(?<=VIP exists: /).*?/(.*?)(?=/)', out, re.MULTILINE)


def remote_command(ip):
    _ = Popen(["ssh", "-q", "-o StrictHostKeyChecking=no", "%s" % ip, "df -TH"], stdout=PIPE, stdin=PIPE)
    out, err = _.communicate()
    return out.decode("gbk")


def check_file_system_usage():
    if os.name == 'nt':
        _ = Popen(["wmic", "LOGICALDISK", "list", "BRIEF"], stdout=PIPE, stdin=PIPE)

    else:
        if is_rac():
            _ = {}
            for ip in get_rac_node_list():
                _['VIP: %s' % ip] = remote_command(ip)
            return _
        else:
            _ = Popen(["df", "-TH"], stdout=PIPE, stdin=PIPE)
    out, err = _.communicate()
    return out.decode("gbk")


# @limit_user('grid')
def check_asm_disk():
    sqlplus = sqlplus_by_popen()
    sqlplus.stdin.write(ASM_DISK_USAGE)
    out, err = sqlplus.communicate()
    return out


@limit_user('oracle')
def check_tablespace_usage():
    sqlplus = sqlplus_by_popen()
    sqlplus.stdin.write(TABLESPACE_USAGE)
    out, err = sqlplus.communicate()
    return out


@limit_user('oracle')
def check_rman_backup_status():
    sqlplus = sqlplus_by_popen()
    sqlplus.stdin.write(RMAN_STATUS)
    out, err = sqlplus.communicate()
    return out


@limit_user('oracle')
def check_rman_backup():
    rman = rman_by_popen()
    rman.stdin.write("REPORT NEED BACKUP RECOVERY WINDOW OF 7 DAYS;" + os.linesep)
    out, err = rman.communicate()
    return out


def dist_alert_log():
    sqlplus = sqlplus_by_popen()
    sqlplus.stdin.write("set pagesize 0" + os.linesep)
    sqlplus.stdin.write("select value as from v$diag_info where name='Diag Trace';")
    out, err = sqlplus.communicate()
    return out


def get_file_alert_log():
    alert_dir = dist_alert_log().strip()
    alert_log = [x for x in os.listdir(alert_dir) if x.startswith('alert')][0]
    return os.path.join(alert_dir, alert_log)


def deal_alert_log(st, et):
    alert_log_file = get_file_alert_log()
    time = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    tmpfile = os.path.join(cwd_dir, time + ".log")

    _end_p = os.path.getsize(alert_log_file)
    _start_p = 0
    _fstream = open(alert_log_file, 'rb')
    begin_pos = iter_dichotomy_from_mid(_fstream, _start_p, _end_p, st, 0)
    end_pos = iter_dichotomy_from_mid(_fstream, _start_p, _end_p, et, 1)
    _fstream.close()

    buff = 102400
    with open(tmpfile, 'a+') as a:
        with open(alert_log_file, 'r') as f:
            f.seek(begin_pos)
            while begin_pos < end_pos:
                line = f.read(buff)
                begin_pos += buff
                if end_pos - begin_pos < buff:
                    buff = end_pos - begin_pos
                a.write(line)
    return tmpfile


def iter_dichotomy_from_mid(fstream, start_p, end_p, t, end_flag):
    fstream.seek((end_p + start_p) / 2)
    while 1:
        p = fstream.tell()
        if p == end_p:
            return traverse_after_dichotomy(fstream, start_p, end_p, t, end_flag)
        cur_time = date_deal(fstream.readline())
        if cur_time:
            if cur_time < t or (cur_time == t and end_flag):
                start_p = p
            else:
                end_p = p
            return iter_dichotomy_from_mid(fstream, start_p, end_p, t, end_flag)


def traverse_after_dichotomy(fstream, start_p, end_p, t, end_flag):
    fstream.seek(start_p)
    while 1:
        p = fstream.tell()
        if p >= (start_p + end_p) / 2:
            return end_p
        cur_time = date_deal(fstream.readline())
        if cur_time:
            if cur_time > t or (cur_time == t and not end_flag):
                return p


def date_deal(strtime):
    """

    :param strtime: time format by string, deal with the time format of alert log like 'Tue Nov 17 00:24:52 2015'.
    :return: datetime class object or ''
    """
    try:
        if strtime.startswith(('Sun', 'Sat', 'Fri', 'Thu', 'Wed', 'Tue', 'Mon')):
            return datetime.datetime.strptime(strtime.strip(), "%a %b %d %H:%M:%S %Y")
    except ValueError:
        return ''


def str2datetime(strtime):
    try:
        return datetime.datetime.strptime(strtime.ljust(14).replace(' ', '0'), "%Y%m%d%H%M%S")
    except ValueError:
        return ''


def date_interval_deal(time_range):
    """

    :param time_range: string type;
        example: 20100101-20170101, means start at 2010-01-01 00:00:00,and end at 2017-01-01 00:00:00 ;
    :return: a tuple of the start time and end time .
    """
    time_min = datetime.datetime.min
    time_max = datetime.datetime.max
    if not time_range:
        return time_min, time_max
    time_list = time_range.split("-")
    if len(time_list) == 1:
        st = str2datetime(time_list[0].strip())
        return st if st else time_min, time_max
    else:
        st = str2datetime(time_list[0].strip())
        et = str2datetime(time_list[1].strip())
        return st if st else time_min, et if et else time_max


def date_from_now(t):
    try:
        now = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        start_time = (datetime.datetime.now() - datetime.timedelta(days=t)).strftime("%Y%m%d%H%M%S")
        return "{0}-{1}".format(start_time, now)
    except:
        return ''


def out_2_html(result, outfile=stdout):
    """
    view the module code, she overwrites the lshift(<<) Operator, maybe not friendly to PEP8
    :param result:
    :param outfile:
    """
    page = pyh.PyH("Main Report")
    page.addStyleSnippet(os.path.join(script_dir, 'awr.css'))
    page.body.attributes['cl'] = 'awr'
    page << pyh.a(name='top')
    page << pyh.h2(cl='awr') << "Main Report"
    page = ul_parse(page, result)
    page.printOut(outfile)
    print "Outfile Path: ", os.path.join(cwd_dir, outfile)


def ul_parse(page, result, sub=False, key_name=''):
    menu_ul = page << pyh.ul()
    for key, val in result.items():
        menu_ul << pyh.li(cl='awr') << pyh.a(cl='awr', href='#%s' % key) << str(key)
        page << pyh.a(name='%s' % key)
        if sub:
            page << pyh.h4(cl='awr') << str(key)
        else:
            page << pyh.h3(cl='awr') << str(key)
        if isinstance(val, dict):
            page = ul_parse(page, val, True, str(key))
        else:
            unit_ul = page << pyh.ul()
            for l in val.split('\n'):
                if l.strip():
                    unit_ul << pyh.li(cl='awr') << pyh.pre(cl='awr') << str(l)
            page << pyh.br()
            if sub:
                page << pyh.a(cl='awr', href='#%s' % key_name) << "Back to %s" % key_name
                page << pyh.br()
            page << pyh.a(cl='awr', href='#top') << "Back to Top"
            page << pyh.hr()
    return page


def display_values(obj):
    if isinstance(obj, list):
        return ''.join([display_values(o) for o in obj])
    if isinstance(obj, dict):
        return ''.join([i + '\n' + display_values(o) for i, o in obj.items()])
    return obj


if __name__ == '__main__':
    opt = OptionParser(version="%prog version: 1.2beta")
    opt.add_option("-a", "--all", help="check all list", action="store_true",
                   dest="check_all", default=False)
    opt.add_option("", "--date", help="Format:yyyymmddHHMMSS,ex:20170808181818-20180808181818",
                   action="store", type="string", dest="date_interval")
    opt.add_option("-d", "", help="Days before current time, -d 7 means 7 days before",
                   action="store", type="int", dest="days_from_now")
    opt.add_option("", "--alert", help="alert log",
                   action="store_true", dest="alert_log")
    opt.add_option("", "--fsinfo", help="local disk",
                   action="store_true", dest="fsinfo")
    opt.add_option("", "--tbs", help="tablespace usage check",
                   action="store_true", dest="tablespace")
    opt.add_option("", "--asmdisk", help="asmdisk usage check",
                   action="store_true", dest="asmdisk")
    opt.add_option("", "--rman", help="rman backup check",
                   action="store_true", dest="rmanbackup")
    opt.add_option("-o", "--outfile", help="output to html, only support for '-a'",
                   action="store", type="string", dest="outfile")
    (options, arg) = opt.parse_args()

    if options.days_from_now:
        _st, _et = date_interval_deal(date_from_now(options.days_from_now))
    else:
        _st, _et = date_interval_deal(options.date_interval)
    _out_file = options.outfile
    if options.check_all:
        loc = locals()
        _result = {}
        # call all functions which func name start with 'check'.
        funcs = [(k, v) for k, v in loc.items() if 'check' in k and hasattr(v, '__call__')]
        for k, v in funcs:
            name = k.replace('_', ' ').replace('check', '').title()
            _result[name] = v()
        if _out_file:
            out_2_html(_result, _out_file)
        else:
            print display_values(_result)
        print "log path truncated from alert log: ", deal_alert_log(_st, _et)
        exit(0)

    if options.alert_log:
        print deal_alert_log(_st, _et)
    if options.tablespace:
        print display_values(check_tablespace_usage())
    if options.fsinfo:
        print display_values(check_file_system_usage())
    if options.asmdisk:
        print display_values(check_asm_disk())
    if options.rmanbackup:
        print display_values(check_rman_backup_status())
        print display_values(check_rman_backup())
    if not any(options.__dict__.values()):
        opt.print_help()
