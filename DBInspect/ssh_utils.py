# -*- coding:utf-8 -*-

import time
import paramiko


def ssh_transport(host, port, username, password):
    s = paramiko.Transport((host, port))
    s.connect(username=username, password=password)
    chan = s.open_session()
    chan.settimeout(10)
    chan.get_pty()
    chan.invoke_shell()

    chan.send('sqlplus / as sysdba\n')

    time.sleep(1)
    chan.recv(65535)

    commond = """column name  format a30
column value format a40
SELECT name, value
  FROM v$parameter
 WHERE isdefault = 'FALSE'
 ORDER BY name;
    """

    #     commond = """archive log list;
    # """
    commond += '\n          \n'
    chan.send(commond)
    chan.recv(len(commond))

    time.sleep(1)
    info_string = chan.recv(65535)

    chan.close()
    s.close()
    print info_string
    format_list = info_string.strip().strip('SQL> 0123456789').split('\n')
    print format_list
    format_string = '\n'.join(format_list)
    print format_string
    pass


def ssh_client():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    # client.connect('192.168.1.231', 22, username='root', password='Beyondit123', timeout=4)
    client.connect('192.168.187.3', 22, username='oracle', password='oracle', timeout=4)
    stdin, stdout, stderr = client.exec_command('ls -l')
    for std in stdout.readlines():
        print std,
    # print stdin.readlines(), stderr.readlines()
    client.close()
    pass


if __name__ == '__main__':
    # ssh_client()
    cmd = """
    """
    ssh_transport('192.168.187.3', 22, 'oracle', 'oracle')
