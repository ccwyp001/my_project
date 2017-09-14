/*########################################################################
 *
 * #########################inspect list show##############################
 *
 * #######################################################################*/

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
