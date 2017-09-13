
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
