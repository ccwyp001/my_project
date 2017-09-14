function inspect_pre_run_one(obj) {
    var cnm = $(obj).parent().parent().attr('id');
    $('#inspect_server_id').attr('value', cnm);
    check_group_show();
    $('#InspectRunModal').modal('show');
}

function inspect_pre_run_all() {
    check_group_show();
    $('#InspectRunModal').modal('show');
}

$(function () {
    $('#InspectRunModal').on('shown.bs.modal', function () {
        $('body').addClass('modal-open')
    });
});


function check_connect() {
    if ($('#server_ids').attr('value') == '') {
        alert_msg('please select one item least!');
        return;
    }
    connect_test_show();
}

function connect_test_dual() {
    var $in_id = $('#inspect_server_id');
    $('#inspect_group_describe').val('');
    $in_id.attr('value', '');
    $('div#CheckServerConnectModal div div div.modal-footer button').addClass('disabled');
    var $tb_tr = $('div#connect_table table tbody tr').find('td:last');
    var count = $tb_tr.length;
    var finish = 0;
    $tb_tr.each(
        function () {
            var $trd = $(this);
            var data = {
                "id": $trd.attr('id')
            };
            var $success = $('<span class="glyphicon glyphicon-ok"></span>');
            var $warning = $('<span class="glyphicon glyphicon-remove"></span>');
            $.ajax({
                type: 'GET',
                url: '/inspect/connect_check',
                data: data,
                dataType: 'json',
                success: function (data) {
                    if (data.error.length > 0) {
                        $trd.addClass('warning');
                        $trd.empty().html($warning);
                    }
                    else {
                        $trd.addClass('success');
                        $trd.empty().html($success);
                        var tmp_id = $in_id.attr('value');
                        tmp_id += $trd.attr('id') + ',';
                        $in_id.attr('value', tmp_id);
                    }
                    finish++;
                    if (finish >= count) {
                        if ($in_id.attr('value') == '') {
                            $('div#CheckServerConnectModal div div div.modal-footer button.btn-default').removeClass('disabled');
                        }
                        else {
                            $('div#CheckServerConnectModal div div div.modal-footer button').removeClass('disabled');
                        }
                    }
                }
            })
        }
    );
}

function connect_test_show() {
    var data = {
        "id": $('#server_ids').attr('value')
    };
    var tbody = "";
    var thead = "<tr><th>Describe</th><th>Hostname</th><th>Conn State</th></tr>";

    $.ajax({
        type: 'GET',
        url: '/serverlist',
        data: data,
        dataType: 'json',
        success: function (data) {
            if (data.data.length > 0) {
                $.each(data.data, function (n, value) {
                    var trs = "";
                    trs += "<tr><td>" +
                        value['describe'] + "</td><td>" +
                        value['hostname'] + "</td><td id=" + value['id'] + ">" +
                        "Connecting...<span class='glyphicon glyphicon-refresh zhuanqilai'></span>" +
                        "</td></tr>";
                    tbody += trs;
                });
                $('#connect_head').empty().append(thead);
                $('#connect_body').empty().append(tbody);
                $('#CheckServerConnectModal').modal({backdrop: 'static'}).modal('show');
                connect_test_dual();
            } else {
            }
        },
        error: function (xhr, type) {
        }
    });
}

function start_inspect() {
    var server_ids = $('#inspect_server_id').attr("value");
    var check_group_ids = $('#check_group_ids').attr("value");
    var describe = $('#inspect_group_describe').val();
    if (server_ids == '') {
        alert_msg('please select one item least!');
        return;
    }
    if (check_group_ids == '') {
        alert_msg('please select one item least!');
        return;
    }
    if (describe == '') {
        describe = ' ';
    }
    var data = {
        'server_ids': server_ids,
        'check_group_ids': check_group_ids,
        'describe': describe
    };
    $.ajax({
        type: 'POST',
        url: '/inspect/run',
        data: data,
        dataType: 'json',
        success: function (data) {
            $('li#reports_li a').tab('show');
        },
        error: function (xhr, type) {
        }
    });
}

function check_group_show() {
    var data = {
        "now": new Date().getTime()
    };
    var tbody = "";
    var thead = "<tr><th>Describe</th><th>Plat</th><th>Run User</th><th>Script Type</th></tr>";
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
                        value['plat'] + "</td><td>" +
                        value['run_user'] + "</td><td>" +
                        value['script_type'] +
                        "</td></tr>";
                    tbody += trs;
                });
                $('#checkgroup_head').empty().append(thead);
                $('#checkgroup_body').empty().append(tbody);
                $('#check_group_ids').attr('value', '');
                initTableCheckbox('checkgroup_table', 'check_group_ids');
            } else {

            }
        },
        error: function (xhr, type) {
        }
    });
}

function alert_msg(e) {
    $('#alert_msg_text').text(e);
    $('#alertMsgModal').modal('show');

    setTimeout(function () {
        $('#alertMsgModal').modal('hide');
    }, 1000);
}


function show_html() {
    if ($('#report_display').hasClass('hidden')) {
        alert_msg('please select inspect!');
        return;
    }
    downloadFile('aa.html', document.getElementById("report_display").innerHTML);
    var w = window.open();
    w.document.open("text/html", "replace");
    w.document.write(document.getElementById("report_display").innerHTML);
    w.document.close();
}


function doc_create() {
    var ids = $('#export_ids').attr('value');
    if (ids == '') {
        alert_msg('please select one item at least!');
        return;
    }
    var data = {
        "now": new Date().getTime(),
        "ids": ids
    };
    $.ajax({
        type: 'GET',
        url: '/test',
        dataType: 'html',
        data: data,
        success: function (data) {
            downloadFile(new Date().getTime() + '.doc', data);
        },
        error: function (xhr, type) {
        }

    });
}


function downloadFile(fileName, content) {
    var aLink = document.createElement('a');
    var blob = new Blob([content]);
    aLink.download = fileName;
    aLink.href = URL.createObjectURL(blob);
    clickObj(aLink);
}

function clickObj(obj) {
    if (getBrowser() == 'Firefox') {
        var evt1 = document.createEvent("MouseEvents");
        evt1.initEvent("click", false, false);
        obj.dispatchEvent(evt1);
        obj.click();
    }
    else {
        var evt2 = document.createEvent("HTMLEvents");
        evt2.initEvent("click", false, false);
        obj.dispatchEvent(evt2);
        obj.click();
    }
}
