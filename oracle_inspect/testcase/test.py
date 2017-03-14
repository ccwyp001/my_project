# -*- coding:utf-8 -*-
import unittest
from oracle_inspect.inspect import iter_dichotomy_from_mid, date_interval_deal
import os


class MyTestCase(unittest.TestCase):
    def setUp(self):
        self.alert_log_file = "testdata.txt"
        self._end_p = os.path.getsize(self.alert_log_file)
        self._start_p = 0
        self._fstream = open(self.alert_log_file, 'rb')

    def test_null_input(self):
        begin_pos, end_pos = self.input_and_out('')
        self.assertEqual(begin_pos, 0)
        self.assertEqual(end_pos, 54000454)

    def test_wrong_string_input(self):
        begin_pos, end_pos = self.input_and_out('1111jclxzjash-dljsaflkjsa')
        self.assertEqual(begin_pos, 0)
        self.assertEqual(end_pos, 54000454)

    def test_zero_to_null(self):
        begin_pos, end_pos = self.input_and_out('0-')
        self.assertEqual(begin_pos, 0)
        self.assertEqual(end_pos, 54000454)

    def test_zero_without_mid__(self):
        begin_pos, end_pos = self.input_and_out('0')
        self.assertEqual((begin_pos, end_pos), (0, 54000454))

    def test_without_begin_time(self):
        begin_pos, end_pos = self.input_and_out('-20160101')
        self.assertEqual((begin_pos, end_pos), (0, 8962486))

    def test_right_format_one(self):
        begin_pos, end_pos = self.input_and_out('20151122001311-20160101')
        self.assertEqual((begin_pos, end_pos), (1399703, 8962486))

    def test_right_format(self):
        begin_pos, end_pos = self.input_and_out('20151122001311-20160123181818')
        self.assertEqual((begin_pos, end_pos), (1399703, 9366208))

    def input_and_out(self, strings):
        st, et = date_interval_deal(strings)
        begin_pos = iter_dichotomy_from_mid(self._fstream, self._start_p, self._end_p, st, 0)
        end_pos = iter_dichotomy_from_mid(self._fstream, self._start_p, self._end_p, et, 1)
        return begin_pos, end_pos

    def look_for_pos(self, pos):
        self._fstream.seek(pos)
        return self._fstream.readline()

    def tearDown(self):
        self._fstream.close()


if __name__ == '__main__':
    unittest.main()
