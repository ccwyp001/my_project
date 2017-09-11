// ##############################check list######################//
function checklist_add() {
    var data = $('#check_list_add_form').serialize();

    $.ajax({
        type: 'POST',
        url: '/checklist/add',
        data: data,
        dataType: 'json',
        success: function () {
            checklist_show();
            $('#check_list_add_form')[0].reset();
            $('#check-macros').empty();
        },
        error: function (xhr, type) {
        }
    });
}

function checklist_del() {
    var data = {
        'ids': $('#check_ids').attr('value')
    };

    $.ajax({
        type: 'POST',
        url: '/checklist/del',
        data: data,
        dataType: 'json',
        success: function () {
            checklist_show();
        },
        error: function (xhr, type) {
        }
    });
}


function checklist_edit_simple(obj) {
    var data = {
        'id': $(obj).parent().parent().attr('id')
    };
    var $thd = $('#check-edit-macros');
    $('#check_list_edit_form')[0].reset();
    $.ajax({
        type: 'GET',
        url: '/checklist',
        data: data,
        dataType: 'json',
        success: function (data) {
            var va = data.data[0];
            var check_id = '<input type="hidden" name="check_edit_id" id="check_edit_id" value="" />';
            $('form#check_list_edit_form input#check_edit_id').remove();
            $('form#check_list_edit_form').append(check_id);
            $('#check_edit_id').attr('value', va['id']);
            $('form#check_list_edit_form #describe').attr('value', va['describe']);
            $('form#check_list_edit_form #run_user').val(va['run_user']);
            $('form#check_list_edit_form #plat').val(va['plat']);
            $('form#check_list_edit_form #script').val(va['script']);
            $('form#check_list_edit_form #script_type').val(va['script_type']);
            $thd.empty();
            $.each(va['macros'], function (n, value) {
                add_check_macro($thd.siblings('button'), value['key'], value['value']);
            });

            $('#CheckEditModal').modal('show')
        },
        error: function (xhr, type) {
        }
    });
}

function del_check_macro(obj) {
    var $thd = $(obj).parent().parent();
    $thd.empty()
}

function add_check_macro(obj, k, v) {
    var $thd = $(obj).siblings("div");
    var macro_id = $thd.find('.row').size();
    k = k || '';
    v = v || '';
    var $thds = '<div class="row"><div class="col-md-5"><div class="form-group">' +
        '<input class="form-control" id="macros-' +
        macro_id +
        '-key" name="macros-' +
        macro_id +
        '-key" type="text" value="' + k +
        '" placeholder="key"></div>' +
        '</div><div class="col-md-6"><div class="form-group">' +
        '<input class="form-control" id="macros-' +
        macro_id +
        '-value" name="macros-' +
        macro_id +
        '-value" type="text" value="' + v +
        '" placeholder="value"></div></div>' +
        '<div class="col-md-1" style="padding-left: 5px" >' +
        '<button type="button" class="btn btn-link" onclick="del_check_macro(this)"> ' +
        '<span class="glyphicon glyphicon-trash"></span></button>' +
        '</div></div>';
    $thd.append($thds);
}

function checklist_edit() {
    var data = $('#check_list_edit_form').serialize();
    $.ajax({
        type: 'POST',
        url: '/checklist/edit',
        data: data,
        dataType: 'json',
        success: function () {
            checklist_show();
        },
        error: function (xhr, type) {
        }
    });
}


$(function () {
    $('#checklist_li').on('shown.bs.tab', function () {
        checklist_show();
    });
});

function checklist_show() {
    var data = {
        "now": new Date().getTime()
    };
    var tbody = "";
    var thead = "<tr><th>Describe</th><th>RunUser</th><th>Plat</th><th>ScriptType</th><th>Options</th></tr>";
    $.ajax({
        type: 'GET',
        url: '/checklist',
        data: data,
        dataType: 'json',
        success: function (data) {
            if (data.data.length > 0) {
                $.each(data.data, function (n, value) {
                    var trs = "";
                    trs += "<tr id=" + value['id'] + "><td>" +
                        value['describe'] + "</td><td>" +
                        value['run_user'] + "</td><td>" +
                        value['plat'] + "</td><td>" +
                        value['script_type'] + "</td><td>" +
                        '<button type="button" class="btn btn-info btn-xs" onclick="checklist_edit_simple(this)">' +
                        "<span class='glyphicon glyphicon-edit'></span></button>" +
                        "</td></tr>";
                    tbody += trs;
                });
                $('#checklist_table_head').empty().append(thead);
                $('#checklist_table_body').empty().append(tbody);
                $('#nonelist').attr('class', 'hidden');
                $('#checklist_table').removeAttr('class', 'hidden');
                $('#check_ids').attr('value', '');
                initTableCheckbox('checklist_table', 'check_ids');
            } else {
                $('#checklist_table').attr('class', 'hidden');
                $('#nonelist').removeAttr('class', 'hidden')
            }
        },
        error: function (xhr, type) {
        }
    });

}

// ##############################check list end######################//


function initTableCheckbox(table_name,hidden_id) {
    var $thr = $('div#'+table_name+' table thead tr');
    var $checkAllTh = $('<th><input type="checkbox" id="checkAll" name="checkAll" /></th>');
    /*将全选/反选复选框添加到表头最前，即增加一列*/
    $thr.prepend($checkAllTh);
    /*“全选/反选”复选框*/
    var $checkAll = $thr.find('input');
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


// ##############################server list######################//
function serverlist_add() {
    var data = $('#server_list_add_form').serialize();

    $.ajax({
        type: 'POST',
        url: '/serverlist/add',
        data: data,
        dataType: 'json',
        success: function () {
            serverlist_show();
            $('#server_list_add_form')[0].reset()
        },
        error: function (xhr, type) {
        }
    });
}


$(function () {
    $('#serverlist_li').on('shown.bs.tab', function () {
        serverlist_show()
    });
});

function serverlist_show() {
    var data = {
        "now": new Date().getTime()
    };
    var tbody = "";
    var thead = "<tr><th>Describe</th><th>hostname</th><th>username</th><th>Plat</th><th>Options</th></tr>";
    $.ajax({
        type: 'GET',
        url: '/serverlist',
        data: data,
        dataType: 'json',
        success: function (data) {
            if (data.data.length > 0) {
                $.each(data.data, function (n, value) {
                    var trs = "";
                    trs += "<tr id=" + value['id'] + "><td>" +
                        value['describe'] + "</td><td>" +
                        value['hostname'] + "</td><td>" +
                        value['username'] + "</td><td>" +
                        value['plat'] + "</td><td>" +
                        '<button type="button" class="btn btn-primary btn-xs" onclick="serverlist_edit_simple(this)">' +
                        "<span class='glyphicon glyphicon-edit'></span></button>" +
                        "</td></tr>";
                    tbody += trs;
                });
                $('#server_table_head').empty().append(thead);
                $('#server_table_body').empty().append(tbody);
                $('#server_none_list').attr('class', 'hidden');
                $('#serverlist_table').removeAttr('class', 'hidden');
                $('#server_ids').attr('value', '');
                initTableCheckbox('serverlist_table', 'server_ids');
            } else {
                $('#serverlist_table').attr('class', 'hidden');
                $('#server_none_list').removeAttr('class', 'hidden')
            }
        },
        error: function (xhr, type) {
        }
    });
}


function serverlist_del() {
    var ids = $('#server_ids').attr('value');
    if (ids == '') {
        alert_msg('please select one item least!');
        return;
    }
    var data = {
        'ids': ids
    };

    $.ajax({
        type: 'POST',
        url: '/serverlist/del',
        data: data,
        dataType: 'json',
        success: function () {
            serverlist_show();
        },
        error: function (xhr, type) {
        }
    });
}


function serverlist_edit_simple(obj) {
    var data = {
        'id': $(obj).parent().parent().attr('id')
    };
    $('form#server_list_edit_form')[0].reset();
    $.ajax({
        type: 'GET',
        url: '/serverlist',
        data: data,
        dataType: 'json',
        success: function (data) {
            var va = data.data[0];
            var server_id = '<input type="hidden" name="server_edit_id" id="server_edit_id" value="" />';
            $('form#server_list_edit_form input#server_edit_id').remove();
            $('form#server_list_edit_form').append(server_id);
            $('#server_edit_id').attr('value', va['id']);
            $('form#server_list_edit_form #describe').attr('value', va['describe']);
            $('form#server_list_edit_form #hostname').attr('value', va['hostname']);
            $('form#server_list_edit_form #username').attr('value', va['username']);
            $('form#server_list_edit_form #password').attr('value', va['password']);
            $('form#server_list_edit_form #port').attr('value', va['port']);
            $('form#server_list_edit_form #root_password').attr('value', va['root_password']);
            $('form#server_list_edit_form #plat').val(va['plat']);
            $('#ServerEditModal').modal('show')
        },
        error: function (xhr, type) {
        }
    });
}


function serverlist_edit() {
    var data = $('#server_list_edit_form').serialize();

    $.ajax({
        type: 'POST',
        url: '/serverlist/edit',
        data: data,
        dataType: 'json',
        success: function () {
            serverlist_show();
        },
        error: function (xhr, type) {
        }
    });

}

// ##############################server list end######################//


function checklistgroup_add() {

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