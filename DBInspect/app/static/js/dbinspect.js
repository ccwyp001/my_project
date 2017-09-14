
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
        var $checkAllInput = $tbr.find('input');
        if ($(this).prop('checked')) {
            $checkAllInput.parent().parent().addClass('warning');
        } else {
            $checkAllInput.parent().parent().removeClass('warning');
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

function alert_msg(e) {
    $('#alert_msg_text').text(e);
    $('#alertMsgModal').modal('show');

    setTimeout(function () {
        $('#alertMsgModal').modal('hide');
    }, 1000);
}

function trim(s){
    return s.replace(/(^\s*)|(\s*$)/g, "");
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

function getBrowser() {
    var ua = window.navigator.userAgent;
    var isIE = window.ActiveXObject != undefined && ua.indexOf("MSIE") != -1;
    var isFirefox = ua.indexOf("Firefox") != -1;
    var isOpera = window.opr != undefined;
    var isChrome = ua.indexOf("Chrome") && window.chrome;
    var isSafari = ua.indexOf("Safari") != -1 && ua.indexOf("Version") != -1;
    if (isIE) {
        return "IE";
    } else if (isFirefox) {
        return "Firefox";
    } else if (isOpera) {
        return "Opera";
    } else if (isChrome) {
        return "Chrome";
    } else if (isSafari) {
        return "Safari";
    } else {
        return "Unkown";
    }
}