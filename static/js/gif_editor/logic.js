/* UI数据中间处理逻辑 */
(function(window, document, undefined){
    'use strict';

    gifEditor.set('logic', {

        init:function(){

            var self=this;
            /* 监测环境是否支持 */
            self.checkSupport();
            self.initDataBindUI();
        },


        /* 环境监测，返回对象的{errCount}大于0则环境不支持 */
        checkSupport:function(dotAlert){
            /* 特性检测，用以判断当前环境是否支持编辑器依赖的功能 */

            var errs = [], /* 强依赖的功能，不支持则不能正常使用 */
                warns = []; /* 弱依赖的功能，不支持的情形下依然能使用主要功能 */

            document.createElement('canvas').getContext==null && errs.push('HTML5 Canvas');

            var css3Dom = $('<div style="flex:1; counter-increment: ct;" />');
            /* 下面两行CSS3检测，标准浏览器下可行，IE下上面写的啥下面即便不支持也能取到啥，并且IE10下display:-ms-flex会取值为block，这里无视IE环境 */
            css3Dom.css('flex')==undefined && errs.push('CSS3 flex');
            css3Dom.css('counter-increment')==undefined &&  warns.push('CSS3 counter');

            !window.localStorage && errs.push('JSAPI localStorage');
            !window.Worker && errs.push('JSAPI Worker');
            !window.Blob && !window.BlobBuilder && !window.WebKitBlobBuilder && !window.MozBlobBuilder && errs.push('JSAPI Blob');
            !window.ArrayBuffer && errs.push('JSAPI ArrayBuffer');
            !window.Uint8Array && errs.push('JSAPI Uint8Array');
            !window.Int32Array && errs.push('JSAPI Int32Array');
            !window.Float64Array && errs.push('JSAPI Float64Array');
            !window.URL && errs.push('JSAPI URL');
            !document.createElement('canvas').getContext && errs.push('CANVAS');

            var errCount = errs.length, warnCount=warns.length;
            if(!dotAlert){
                if(errCount>0){
                    alert("您当前使用的浏览器环境不支持必须的功能："+errs.join("、")+"，建议更换360安全浏览器或Chrome的最新版！");
                }else if(warnCount>0){
                    alert("您当前使用的浏览器环境不支持辅助的功能："+warns.join("、")+"，部分相关功能将不能正常使用。");
                }
            }

            return { errCount:errCount, errs:errs, warnCount:warnCount, warns:warns };
        },

        // 包装查询接口，进行校验
        queryIpcPics:function(kw, staTime, endTime){

            if(!$.isEmpty(kw)){
                gifEditor.data.queryIpcPics(kw, staTime, endTime);
                return true;
            }
            return false;

        },

        // 初始化帧处理逻辑
        initDataBindUI:function(){
            var ui = gifEditor.ui,
                geData = gifEditor.data;

            geData.getRulerStatus()==1 && ui.toolRulerSwitch(1);

            /* 检测到数据变化，通知UI层 */

            //添加帧UI
            gifEditor.on("add_frames",function(e, actData){
                ui.addFramesUI(actData);
            })
            //删除帧UI
            .on("del_frames",function(e, actData){
                ui.delFramesUI(actData);
            })
            .on("move_frames",function(e, actData){
                //console.log('move_frames:\n',JSON.stringify(actData) );
                ui.moveFramesUI(actData);
            })
            .on("clear_frames",function(e, actData){
                ui.clearFramesUI();
            })
            .on("add-frame-el del-frame-el",function(e, actData){
                ui.renderFrame( geData.getCurrentFrameIndex() );
                ui.focusTxtarea( geData.getCurrentEleIndex() );
            })
            //数据填入UI输入框中进行展示
            .on("base_field_change",function(e, actData){
                //console.log(actData)
                ui.backfillBaseField(actData);
            })
            //标尺开关
            .on("rulerStatus_change",function(e, actData){
                ui.toolRulerSwitch(+actData.newVal);
            })
            //开关侧边栏
            .on("asideStatus_change",function(e, actData){
                ui.toolAsideSwitch(+actData.newVal);
            })
            //开关裁切
            .on("clipStatus_change",function(e, actData){
                ui.toolClipSwitch(+actData.newVal);
            })
            //开关网格
            .on("gridStatus_change",function(e, actData){
                ui.toolGridSwitch(+actData.newVal);
            })
            //开关编辑
            .on("editStatus_change",function(e, actData){
                ui.toolEditSwitch(+actData.newVal);
            })
            //缩放比例变化
            .on("zoom_change",function(e, actData){
                ui.setZoomUI(actData.newVal);
            })
            //宽度变化
            .on("width_change",function(e, actData){
                ui.setCvsWidth(actData.newVal);
                if(!ui._lock_w && geData.getLock_w_h()==1 ){
                    ui._lock_h = true;
                    //console.log(actData.newVal,actData.oldVal, geData.getHeight())
                    geData.setHeight( Math.round((actData.newVal/actData.oldVal) * geData.getHeight()) )
                }
                ui._lock_w = false;
            })
            //高度变化
            .on("height_change",function(e, actData){
                ui.setCvsHeight(actData.newVal);
                if( !ui._lock_h && geData.getLock_w_h()==1 ){
                    ui._lock_w = true;
                    //console.log(actData.newVal,actData.oldVal, geData.getWidth())
                    geData.setWidth( Math.round((actData.newVal/actData.oldVal) * geData.getWidth()) )
                }
                ui._lock_h = false;
            })
            //选中帧变化
            .on("currentFrameIndex_change",function(e, actData){
                ui.setCurrFrame(actData.newVal);
                //geData.getCurrentEleIndex()
            })
            //选中帧内元素变化
            .on("currentEleIndex_change",function(e, actData){
                ui.renderEleAttrs(actData.newVal);
            })
            //选中帧内元素属性变化
            .on("frame_el_attr_change",function(e, actData){
                //console.log("frame_el_attr_change 重新渲染")

                var currFrameEl = geData.getCurrFrameEl(actData.elIndex,null,true);

                //渲染帧内元素效果
                ui.renderFrameEl(currFrameEl);


                //根据具体属性变化做UI响应
                var fieldName = actData.fieldName, fieldHandler = ui.frameElAttrHandler[fieldName];
                fieldHandler && fieldHandler(actData.elIndex==null?currFrameEl._rid:actData.elIndex, actData.newVal);

            });
        },

        //设置选中帧序号
        setCurrentFrameIndex:function(index){
            var geData = gifEditor.data, frameCount = geData.getFramesCount(), frameIndex = frameCount==0 ? -1 : (index>=frameCount ? frameCount-1 : index);

            geData.setCurrentFrameIndex( frameIndex );

            frameIndex!=-1 && geData.getCurrentEleIndex()==-1 && geData.setCurrentEleIndex(0);

        },

        // 通过UI传入多个img HTMLELement来插入帧数据，同时根据图片尺寸设备名称设置默认宽高等
        addFrames:function($imgEls){

            if($imgEls.length==0){
                alert("您需要先选择要导入的图片。");
                return false;
            }

            var self = this, geData = gifEditor.data;

            // 导入图片地址到数据中
            geData.addFrames( $imgEls.map(function(i,imgEl){ return imgEl.src }).toArray() ,null,$imgEls.map(function(i,imgEl){ return imgEl.dataurl }).toArray());

            // 还没被编辑过的空白文档，设置上标题和初始宽高
            if(geData.isPure()){

                //设置名称
                var ipcName = $imgEls.data('ipc-name'), ipcSN = $imgEls.data('ipc-sn');
                (ipcName && ipcSN) && geData.setTitle( ipcName+'_sn'+ipcSN );

                //设置宽高
                var imgWH = new Image();
                imgWH.onload = function(){
                    this.onload = null;
                    console.log("resize by addFrames:",$imgEls.attr('width')||this.width,$imgEls.attr('height')||this.height);
                    geData.setWidth($imgEls.attr('width')||this.width).setHeight($imgEls.attr('height')||this.height);
                };
                imgWH.src=$imgEls.attr('src');
                $imgEls.attr('height')?imgWH.height=$imgEls.attr('height'):null;
                $imgEls.attr('width')?imgWH.width=$imgEls.attr('width'):null;

                // 设置选中帧为第一帧
                self.setCurrentFrameIndex(0);
            }

            return true;
        },

        //删除帧
        delFrame:function(index){
            var self = this, geData = gifEditor.data, count=geData.getFramesCount();

            if(index<0 || index>=count){
                return alert("要删除的帧序号["+index+"]超出正常取值范围[0~"+count+"]，无法执行删除操作！");
            }
            geData.delFrame(index,function(frameIndex){
                //删除的是焦点帧，则切换焦点帧到第一帧
                if(frameIndex==geData.getCurrentFrameIndex()){
                    self.setCurrentFrameIndex(0);
                }
            });
        },

        //改变帧的图片源
        changeFrameSrc:function(index,uri){
            var self = this, geData = gifEditor.data;
            geData.setCurrFrameEl('src',uri,index);
        }
    });
})(window, document);
