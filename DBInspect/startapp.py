# -*- coding:utf-8 -*-
import argparse
import logging
from ssh_thread_queue import main, log, LOG_FORMAT
from run import app
import multiprocessing

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='start db inspect')
    parser.add_argument('--logfile', dest='logfile', action='store',
                        help='log file name', default=None)
    parser.add_argument('-v', dest='verbose', action='store_true',
                        help='verbose mode')
    options = parser.parse_args()
    log_level = logging.DEBUG if options.verbose else logging.INFO
    log.setLevel(log_level)
    if options.logfile is not None:
        fh = logging.FileHandler(options.logfile)
        fh.setLevel(log_level)
        fh.setFormatter(logging.Formatter(LOG_FORMAT))
        log.addHandler(fh)
    ssh_pro = multiprocessing.Process(target=main,)
    ssh_pro.start()
    app.run()
    ssh_pro.join()
