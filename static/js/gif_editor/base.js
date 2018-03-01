/**
* GIF编辑器 - 基础代码
*
* @author huzunjie@pyzy.net
*/
(function(window, document, undefined){
    'use strict';

    var _tmpObj = {};

    window.gifEditor = {

        init:function(){
            var self = this;
            
            // 初始化自定义事件（后续当前页面任意异步操作行为都通过事件消息机制进行处理）
            var evt = $(_tmpObj);
            ["on", "off", "trigger","one"].forEach(function(v){
                self[v] = function(){ 
                    evt[v].apply(evt,arguments);
                    return self;
                };
            });

            // 加载基本数据
            self.data.init();
            // 初始化逻辑
            self.logic.init();
            // 初始化UI
            self.ui.init();
            // 初始化编辑器
            self.edit.init();

        },

        // 用于创建设置监控方法(setFun 执行前触发contextObj的 act_before 事件，根据act_before结果判断是否继续，执行后触发actName事件)
        _setingFactory:function(actName, setFun, setArgObj, contextObj){
            contextObj = contextObj || this;
            var self = this,
                beforeEvtName = actName+'_before',
                beforeEvt = _tmpObj['__evt_'+beforeEvtName] || (_tmpObj['__evt_'+beforeEvtName]=$.Event(beforeEvtName));

            contextObj.trigger(beforeEvt,[setArgObj]);
            if(beforeEvt.result!==false){
                setFun();
                contextObj.trigger(actName,[setArgObj]);
            }
        },

        set:function(name,val){

            var self = this;
            self[name] = val;

            self.ui && self.logic && self.data && self.init();
        },

        ui:null,
        logic:null,
        data:null
    };

})(window, document);