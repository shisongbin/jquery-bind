var util = {};

/*
*数据对象重组
*param objData 源对象
*return
*/
util.recombine =function(objData){
    return util.eachRecombine('', objData);
}
util.eachRecombine = function(prefix,obj){
    var data = {};
    if('' != prefix){
        prefix += '.';
    }
    $.each(obj,function(k,v){
        if(v instanceof Object){
            data = $.extend(data, util.eachRecombine(prefix + k,v));
        }else{
            data[prefix + k] = v;
        }
    });
    return data;
}
/*
*数据对象还原
*param data 源对象
*return
*/
util.restore =function(data){
    var objData = {};
    for (var k in data) {
        var arr = k.split(".")
        var key_str = '';
        for (var kk in arr) {
            key_str += ('.'+arr[kk]);
            if(!eval("objData" + key_str)){
                eval("objData" + key_str + '={}');
            }
        }
        if(data[k]){
            eval("objData." + k + "='" + data[k] +"'");
        }else{
            eval("objData." + k + "= null");
        }
    }
    return objData;
}
/*
*双向数据绑定（赋值）
*param objData 源对象
*return
*/
util.bind = function (objData) {
    var obj = util.recombine(objData);
    var key, value, tagName, type, arr;
    for (x in obj) {
        key = x;
        value = obj[x];
        $("[ng-model='" + key + "']").each(function () {
            tagName = $(this)[0].tagName;
            type = $(this).attr('type');
            if (tagName == 'INPUT') {
                if (type == 'radio') {
                    $(this).attr('checked', $(this).val() == value);
                } else if (type == 'checkbox') {
                    arr = value.split(',');
                    for (var i = 0; i < arr.length; i++) {
                        if ($(this).val() == arr[i]) {
                            $(this).attr('checked', true);
                            break;
                        }
                    }
                } else {
                    $(this).val(value);
                }
            } else if (tagName == 'SELECT') {
                $(this).val(value);
            } else if (tagName == 'TEXTAREA') {
                $(this).val('' + value);
            }else{
                $(this).val('' + value);
            }
        });
    }
};
/*
*双向数据绑定（取值）
*param data 源对象
*return
*/
util.getBind = function () {
    var tagName, type, key;
    var data = {};
    $("[ng-model]").each(function () {
        key = $(this).attr('ng-model');
        tagName = $(this)[0].tagName;
        type = $(this).attr('type');
        if (tagName == 'INPUT') {
            if (type == 'radio') {
                data[key] = $("input[ng-model='" + key + "']:checked").attr("value");
            } else if (type == 'checkbox') {
                var checkValue = [];
                $("input[ng-model='" + key + "']:checked").each(function () {
                    checkValue.push($(this).val());
                });
                data[key] = checkValue.join(",");
            } else {
                data[key] = $(this).val();
            }
        } else if (tagName == 'SELECT') {
            data[key] = $(this).val();
        } else if (tagName == 'TEXTAREA') {
            data[key] = $(this).val().replace(new RegExp('\n','gm'),'\\n');
        }else{
            data[key] = $(this).val();
        }
    });
    return util.restore(data);
};

util.validate = function(model, validations) {
    model = util.recombine(model);
    for(var key in model){
        var value = model[key];
        // if($("[ng-model='" + key + "']").length < 1) continue;
        var rule;
        try {
            rule = eval("validations." + key); //用户的规则配置
        }catch(e){}
        if(undefined == rule)continue;
        var title = rule.title;
        for (var ruleKey in rule) {
            var ruleValidator = validationRules[ruleKey];
            if (ruleValidator) { //如果该key存在校验器
                var oriOption = rule[ruleKey];
                var option = (oriOption instanceof Object)? oriOption.value : oriOption; //如果是对象,只取option里的value
                var success = ruleValidator.validator(value, option);
                if (!success) { //校验不通过,弹出错误提示
                    var message = oriOption.message ? oriOption.message : ruleValidator.message;
                    if (message) {
                        alert(message.replace("${title}", title).replace("${option}", option));
                    }
                    return false;
                }
            }
        }
    }
    return true;
};

/*
*树状的算法
*@params list     代转化数组
*@params parentId 起始节点
*/
util.getTrees = function(list, parentId) {
    var items= {};
    // 获取每个节点的直属子节点，*记住是直属，不是所有子节点
    for (var i = 0; i < list.length; i++) {
        var key = list[i].parentId;
        if (items[key]) {
            items[key].push(list[i]);
        } else {
            items[key] = [];
            items[key].push(list[i]);
        }
    }
    return formatTree(items, parentId);
}

var validationRules = {
    required: {
        validator: function (value, option) {
            return (undefined == value || '' == (''+$.trim(value))) ? false : true;
        },
        message: '${title}不能为空!'
    },
    maxLength: {
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            var len = 0;
            if(value instanceof Array){
                len = value.length;
            }else{
                len = $.trim(value).length;
            }
            return len <= option;
        },
        message: '${title}必须小于${option}个字符!'
    },
    minLength: {
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            var len = 0;
            if(value instanceof Array){
                len = value.length;
            }else{
                len = $.trim(value).length;
            }
            return len >= option;
        },
        message: '${title}必须大于${option}个字符!'
    },
    lengthEquals: { // 值是否等于指定长度
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            var len = 0;
            if(value instanceof Array){
                len = value.length;
            }else{
                len = $.trim(value).length;
            }
            return len == option;
        },
        message: '${title}必须等于${option}个字符!'
    },
    integer: { // 整形数字
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            return /^(([-]?[1-9]+\d*)|0)$/.test(value);
        },
        message: '${title}必须为整数!'
    },
    positiveInteger: { // 整形数字
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            return /^([1-9]+\d*)$/.test(value);
        },
        message: '${title}必须为正整数!'
    },
    number: { //数字
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            var len = $.trim(value);
            var reg = /^(\-|\+)?([1-9]([0-9]+)?|[0-9])(\.[0-9]+)?$/;
            return reg.test(len);
        },
        message: '${title}必须为数字!'
    },
    numberOrLetter: { //数字
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            var reg = /^[0-9a-zA-Z]*$/g;
            return reg.test(value);
        },
        message: '${title}必须为数字或字母!'
    },
    phone: { // 座机号码
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            return /^\d{3,4}([\-]{1})?\d{7,8}$/.test(value);
        },
        message: '${title}必须为合法的座机号码,如：[010-88888888]!'
    },
    mobile: { // 手机号码
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            return /^1\d{10}$/.test(value);
        },
        message: '${title}必须为合法的手机号码!'
    },
    custom: {
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            return option(value);
        }
    },
    mix:{
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            var len = $.trim(value);
            return parseFloat(len) >= parseFloat(option);
        },
        message: '${title}必须大于等于${option}!'
    },
    max:{
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            var len = $.trim(value);
            return parseFloat(len) <= parseFloat(option);
        },
        message: '${title}必须小于等于${option}!'
    },
    money:{
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            var len = $.trim(value);
            var reg = /(^(\-|\+)?[1-9]([0-9]+)?(\.[0-9]{1,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/;
            return reg.test(len);
        },
        message: '${title}金额格式有误!'
    },
    unicode:{
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            var len = $.trim(value);
            var reg = /^[\u4e00-\u9fa5]+$/;
            return reg.test(len);
        },
        message: '${title}输入非中文!'
    },
    url:{
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            var strRegex = "^((https|http)?://)"
            + "(([0-9]{1,3}\.){3}[0-9]{1,3}" // IP形式的URL- 199.194.52.184
            + "|" // 允许IP和DOMAIN（域名）
            + "([0-9a-z_!~*'()-]+\.)*" // 域名- www.
            + "([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\." // 二级域名
            + "[a-z]{2,6})" // first level domain- .com or .museum
            + "(:[0-9]{1,4})?" // 端口- :80
            + "((/?)|" // a slash isn't required if there is no file name
            + "(/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+/?)$";
            var reg = new RegExp(strRegex);
            return reg.test(value);
        },
        message: '${title}输入url地址有误!'
    },
    ip:{
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            if(value == '%') return true;
            var reg = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
            return reg.test(value);
        },
        message: '${title}输入IP有误!'
    },
    email:{
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            var reg = /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/;
            return reg.test(value);
        },
        message: '${title}输入格式有误!'
    },
    mixDecimalPointLength:{
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            var len = $.trim(value).toString().split(".")[1].length;
            return parseFloat(len) >= parseFloat(option);
        },
        message: '${title}小数点后长度必须大于等于${option}!'
    },
    maxDecimalPointLength:{
        validator: function (value, option) {
            if(undefined == value || '' == (''+$.trim(value))) return true;
            var len = $.trim(value).toString().split(".")[1].length;
            return parseFloat(len) <= parseFloat(option);
        },
        message: '${title}小数点后长度必须小于等于${option}!'
    }
};

function fmtDate(fmt, date) {
    var o = {
        "M+": date.getMonth() + 1,                 //月份
        "d+": date.getDate(),                    //日
        "h+": date.getHours(),                   //小时
        "m+": date.getMinutes(),                 //分
        "s+": date.getSeconds(),                 //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds()             //毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

/*
*利用递归格式化每个节点
*items 源数据
*parentid 父ID
*return
*/
function formatTree(items, parentId) {
    var result = [];
    if (!items[parentId]) {
        return result;
    }
    for (var k in items[parentId]) {
        var t = items[parentId][k];
        t.children = formatTree(items, t.id)
        result.push(t);
    }
    return result;
}


/**
 * 校验整数
 * @param t 输入的控件
 * @param max 最大值
 */
var numberCheck = function (t,max) {
    var num = t.value;
    var re=/^\d*$/;
    if(!re.test(num)){
        isNaN(parseInt(num))?t.value='':t.value=parseInt(num);
    }
    if(t.value>max){
        t.value=max;
    }
}

/**
 * 校验整数
 * @param e 输入的控件
 * @param num 最大小数位
 */
var validationNumber = function(e,num,maxValue) {
    var regu = /^[0-9]+\.?[0-9]*$/;
    if (e.value != "") {
        if (!regu.test(e.value)) {
            alert("请输入正确的数字");
            e.value = '';
            e.focus();
            return;
        }
        if(e.value.charAt(0)=='0'&&e.value!='0'&&e.value.indexOf('.')!=1){
            alert("数字不能以0开头");
            return;
        } else {
            if (num == 0) {
                if (e.value.indexOf('.') > -1) {
                    e.value = e.value.substring(0, e.value.length - 1);
                    e.focus();
                    alert("只能输入整数");
                    return;
                }
            }
            if (e.value.indexOf('.') > -1) {
                if (e.value.split('.')[1].length > num) {
                    var w = e.value.indexOf('.');
                    e.value = e.value.substring(0, w+num+1);
                    e.focus();
                    alert("只能输入"+num+"位小数");
                    return;
                }
            }
        }
        if((!isNaN(maxValue))&&e.value>maxValue){
            e.value=maxValue;
        }
    }
}