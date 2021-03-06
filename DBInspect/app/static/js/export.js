
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
