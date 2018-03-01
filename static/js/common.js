/**
* GIF编辑器 - 全局静态方法
*
* @author huzunjie@pyzy.net
*/
(function(window, document, undefined){

    $.getUrlParam = function(e,t){
        var n=new RegExp("(^|&)"+e+"=([^&]*)(&|$)"),
            i=t?t:window.location.search,
            r=i.substr(1).match(n);
        return r?decodeURIComponent(r[2]):null;
    };

    /* 格式化日期对象或日期字串，输出为指定格式对应的字符串或日期对象
    *   @d: Date 日期对象 || 字串 2015-11-12、2015-11-12 12:58、2015-11-12 12:58:59 || 数字 1446734738418
    *   @pattern： 要返回的日期格式，支持 "yyyy-MM-dd hh:mm:ss" || "date"返回日期对象
    *   @retDateObj：返回格式化后的字串或Date对象（如果pattern=='date'）
    */
    $.formatDate = function(d, pattern) {
        if(!d){
            return null;
        }

        var dType = $.type(d);
        if(dType!=='date'){
            if(dType=='string'){
                if(/^(\d+)[-/](\d+)[-/](\d+)(?:[ T](\d+)\:(\d+)(?:\:(\d+))?)?$/.test(d)){
                    d=RegExp.$1+'/'+RegExp.$2+'/'+RegExp.$3+' '+(RegExp.$4||'00')+':'+(RegExp.$5||'00')+':'+(RegExp.$6||'00');
                }else if($.isNumeric(d)){
                    d = +d;
                }
            }

            d = new Date(d);
        }
        if(pattern=="date")return d;

        pattern = pattern || 'yyyy-MM-dd';
        var y = d.getFullYear().toString(),
            o = {
                M: d.getMonth() + 1, //month
                '[dD]': d.getDate(), //day
                h: d.getHours(), //hour
                m: d.getMinutes(), //minute
                s: d.getSeconds() //second
            };
        pattern = pattern.replace(/(y+)/ig, function(a, b) {
            return y.substr(4 - Math.min(4, b.length));
        });
        for (var i in o) {
            pattern = pattern.replace(new RegExp('(' + i + '+)', 'g'), function(a, b) {
                return (o[i] < 10 && b.length > 1) ? '0' + o[i] : o[i];
            });
        }
        return pattern;
    };

    /**
     * 将HTML转码为文本(tmpl插件中有用到)
     * @param {String} str 要转码的目标字串
     * @returns {String} 转码后的字串
     */
    $.encode4Html = function(str) {
        var el = document.createElement('pre'); //这里要用pre，用div有时会丢失换行，例如：'a\r\n\r\nb'
        var text = document.createTextNode(str);
        el.appendChild(text);
        return el.innerHTML;
    };

    /**
     * 将HTML转码为文本框文本(tmpl插件中有用到)
     * @param {String} str 要转码的目标字串
     * @returns {String} 转码后的字串
     */
    $.encode4HtmlValue = function(str) {
        return $.encode4Html(str).replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    };

    /**
     * 判断传入变量是否为空(tmpl插件中有用来实现empty方法)
     * @param {String} str 要判断的目标字串
     * @param {Boolean} ignoreSpace 是否忽略空格字符
     * @returns {Boolean}
     */
    $.isEmpty = function(str,ignoreSpace) {
        if(ignoreSpace){
            str = $.trim(str);
        }
        return str=='' || str==null || str==undefined;
    };

    $.isString = function(obj){
        return $.type(obj)=='string'
    };

    // 首字母大写
    $.firstLetter2Upper = function(str){
        return str.replace(/^[a-z]/,function(s){ return s.toLocaleUpperCase() });
    };

    /**
     * 按长度限制，将超过长度限制的字符串从中间截掉多出字符并替换为"..."
     */
    $.substrCenter = function(str, maxLen){
        var strLen = str.length;
        if(strLen>maxLen){
            var realMaxLen = maxLen-3, realMaxLenHalf = Math.round(realMaxLen/2);
            return str.replace(str.substr(realMaxLenHalf,strLen-realMaxLen),'...');
        }
        return str;
    };

    $.getFileNameByUri = function(uri){
        return (/([^=/\\]+)$/.exec(uri)||[uri])[0];
    };

    $.completionUnitPx = function(str){
        return str+($.isNumeric(str)?'px':'')
    };

})(window, document, undefined);
