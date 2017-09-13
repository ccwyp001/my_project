
function initTableCheckbox(table_name,hidden_id) {
    var $thr = $('div#'+table_name+' table thead tr');
    var $checkAllTh = $('<th><input type="checkbox" id="checkAll" name="checkAll" /></th>');
    /*将全选/反选复选框添加到表头最前，即增加一列*/
    $thr.prepend($checkAllTh);
    /*“全选/反选”复选框*/
    var $checkAll = $thr.find('input');
    var $checkAllInput = $tbr.find('input');
    $checkAll.click(function (event) {
        /*将所有行的选中状态设成全选框的选中状态*/
        $tbr.find('input').prop('checked', $(this).prop('checked'));
        /*并调整所有选中行的CSS样式*/
        if ($(this).prop('checked')) {
            $tbr.find('input').parent().parent().addClass('warning');
        } else {
            $tbr.find('input').parent().parent().removeClass('warning');
        }
        /*阻止向上冒泡，以防再次触发点击操作*/
        event.stopPropagation();
        /*统计被选中行的id*/
        var ids = '';
        $tbr.find('input:checked').each(function () {
            ids += $(this).parent().parent().attr('id') + ',';
        });
        $('#'+hidden_id).attr('value', ids);
    });
    /*点击全选框所在单元格时也触发全选框的点击操作*/
    $checkAllTh.click(function () {
        $(this).find('input').click();
    });
    var $tbr = $('div#'+table_name+' table tbody tr');
    var $checkItemTd = $('<td><input type="checkbox" name="checkItem" /></td>');
    /*每一行都在最前面插入一个选中复选框的单元格*/
    $tbr.prepend($checkItemTd);
    /*点击每一行的选中复选框时*/
    $tbr.find('input').click(function (event) {
        /*调整选中行的CSS样式*/
        $(this).parent().parent().toggleClass('warning');
        /*如果已经被选中行的行数等于表格的数据行数，将全选框设为选中状态，否则设为未选中状态*/
        $checkAll.prop('checked', $tbr.find('input:checked').length == $tbr.length);
        /*阻止向上冒泡，以防再次触发点击操作*/
        event.stopPropagation();
        /*统计被选中行的id*/
        var ids = '';
        $tbr.find('input:checked').each(function () {
            ids += $(this).parent().parent().attr('id') + ',';
        });
        $('#'+hidden_id).attr('value', ids);
    });
    /*点击每一行时也触发该行的选中操作*/
    $tbr.click(function () {
        $(this).find('input').click();
    });
}

/*########################################################################
 *
 * #########################inspect list show##############################
 *
 * #######################################################################*/
function trim(s){
    return s.replace(/(^\s*)|(\s*$)/g, "");
}

$(function () {
    $('#reports_li').on('shown.bs.tab', function () {
        inspect_list_show()
    });
});

function inspect_list_show() {
    var data = {
        "now": new Date().getTime()
    };
    var tbody = "";
    var thead = "<tr><th>Id</th><th>Server</th><th>Hostname</th><th>Starttime</th><th>Endtime</th><th>Status</th></tr>";
    $('#report_display').attr('class', 'hidden');
    $.ajax({
        type: 'GET',
        url: '/inspect',
        data: data,
        dataType: 'json',
        success: function (data) {
            if (data.data.length > 0) {
                $.each(data.data, function (n, value) {
                    var trs = "";
                    trs += "<tr id=" + value['id'] + " ><td>" +
                        value['id'] + "</td><td>" +
                        value['server'] + "</td><td>" +
                        value['hostname'] + "</td><td>" +
                        (moment(value['starttime']).format('YYYY-MM-DD HH:mm:ss')) + "</td><td>" +
                        (value['endtime'] == 'None' ? '' : moment(value['endtime']).format('YYYY-MM-DD HH:mm:ss')) +
                        "</td><td>" +
                        value['status'] +
                        "</td></tr>";
                    tbody += trs;
                });
                var $thd = $('#inspectlist_table_body');
                $('#inspectlist_table_head').empty().append(thead);
                $thd.empty().append(tbody);
                $('#report_none_list').attr('class', 'hidden');
                $('#inspectlist_table').removeAttr('class', 'hidden');

                var $trAll = $thd.find('tr');
                $trAll.click(function (event) {
                    $trAll.removeClass('warning');
                    $(this).toggleClass('warning');
                    event.stopPropagation();
                    inspect_result_show(this);
                })
            }
            else {
                $('#inspectlist_table').attr('class', 'hidden');
                $('#report_none_list').removeAttr('class', 'hidden');
            }
        },
        error: function (xhr, type) {
        }
    });
}


function inspect_result_show(obj) {
    var data = {
        'id': $(obj).attr('id'),
        "now": new Date().getTime()
    };
    $('#report_display').removeAttr('class', 'hidden');
    $('#report_accordion').empty();
    var i = 1;
    $.ajax({
        type: 'GET',
        url: '/inspect/report',
        data: data,
        dataType: 'json',
        success: function (data) {
            if (data.data.length > 0) {
                $.each(data.data, function (n, value) {
                    var aco =
                        '<div class="panel panel-success">' +
                        '<div class="panel-heading"><h4 class="panel-title">' +
                        '<a data-toggle="collapse" data-parent="#report_accordion" id="report_a_id' + value["id"] +
                        '" href="#reportcollapse' + value["id"] + '"></a>' +
                        '</h4></div>' +
                        '<div id="reportcollapse' + value["id"] + '" class="panel-collapse collapse">' +
                        '<div class="panel-body">' +
                        '</div></div></div>';
                    $('#report_accordion').append(aco);
                    $('#report_a_id' + value["id"]).append(i + '.\t' + value['check_item']);
                    $('div#reportcollapse' + value["id"]).collapse('show');
                    $('div#reportcollapse' + value["id"] + ' div').append(
                        pre_to_ol((trim(value['result']) == 'no rows selected' ? 'No abnormal' : value['result'])));
                    i++;
                });
            }
            else {
                var aco = '<h1>空</h1>';
                $('#report_accordion').append(aco);
            }
        },
        error: function (xhr, type) {
        }
    });
}


function pre_to_ol(obj) {
    var arr = obj.split('\n');
    var text = "<pre><ul>";
    var n = 0;
    $.each(arr, function (i, item) {
        if (item.trim() != "") {
            if (n % 2 == 0) {
                text += "<li style='width:auto;white-space: pre-wrap;display: table;background:#FFFFCC'>" + item + "</li>";
            }
            else {
                text += "<li style='width:auto;white-space: pre-wrap;display: table;background:none'>" + item + "</li>";
            }
            n++;
        }
    });
    text += "</ul></pre>";
    return text
}

/*########################################################################
 *
 * #########################export show##############################
 *
 * #######################################################################*/


$(function () {
    $('#export_li').on('shown.bs.tab', function () {
        inspect_group_show()
    });
});


function inspect_group_show() {
    var data = {
        "now": new Date().getTime()
    };
    var tbody = "";
    var thead = "<tr><th>Id</th><th>Describe</th><th>Starttime</th></tr>";
    $('#exportlist_table').attr('class', 'hidden');
    $.ajax({
        type: 'GET',
        url: '/inspect/group',
        data: data,
        dataType: 'json',
        success: function (data) {
            if (data.data.length > 0) {
                $.each(data.data, function (n, value) {
                    var trs = "";

                    trs += "<tr id=" + value['id'] + " ><td>" +
                        value['id'] + "</td><td>" +
                        value['describe'] + "</td><td>" +
                        (moment(value['starttime']).format('YYYY-MM-DD HH:mm:ss')) +
                        "</td></tr>";
                    tbody += trs;
                });
                var $thd = $('#inspectgroup_table_body');
                $('#inspectgroup_table_head').empty().append(thead);
                $thd.empty().append(tbody);
                $('#export_none_list').attr('class', 'hidden');
                $('#inspectgroup_table').removeAttr('class', 'hidden');

                var $trAll = $thd.find('tr');
                $trAll.click(function (event) {
                    $trAll.removeClass('warning');
                    $(this).toggleClass('warning');
                    event.stopPropagation();
                    inspect_group_list_show(this);
                })
            }
            else {
                $('#inspectgroup_table').attr('class', 'hidden');
                $('#export_none_list').removeAttr('class', 'hidden');
            }
        },
        error: function (xhr, type) {
        }
    });
}


function inspect_group_list_show(obj){
    var data = {
        "id":$(obj).attr('id'),
        "now": new Date().getTime()
    };
    var tbody = "";
    var thead = "<tr><th>Id</th><th>Server</th><th>Hostname</th><th>Starttime</th><th>Endtime</th><th>Status</th></tr>";
    $('#exportlist_table').attr('class', 'hidden');
    $.ajax({
        type: 'GET',
        url: '/inspect',
        data: data,
        dataType: 'json',
        success: function (data) {
            if (data.data.length > 0) {
                $.each(data.data, function (n, value) {
                    var trs = "";
                    trs += "<tr id=" + value['id'] + " ><td>" +
                        value['id'] + "</td><td>" +
                        value['server'] + "</td><td>" +
                        value['hostname'] + "</td><td>" +
                        (moment(value['starttime']).format('YYYY-MM-DD HH:mm:ss')) + "</td><td>" +
                        (value['endtime'] == 'None' ? '' : moment(value['endtime']).format('YYYY-MM-DD HH:mm:ss')) +
                        "</td><td>" +
                        value['status'] +
                        "</td></tr>";
                    tbody += trs;
                });
                var $thd = $('#exportlist_table_body');
                $('#exportlist_table_head').empty().append(thead);
                $thd.empty().append(tbody);
                $('#exportlist_table').removeAttr('class', 'hidden');
                $('#export_ids').attr('value', '');
                initTableCheckbox('exportlist_table', 'export_ids');
            }
            else {
                $('#exportlist_table').attr('class', 'hidden');
            }
        },
        error: function (xhr, type) {
        }
    });

}