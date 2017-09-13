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
