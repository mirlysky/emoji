/**
* GIF编辑器 - UI交互逻辑
*
* @author huzunjie@pyzy.net
*/
(function(window, document, undefined){
    'use strict';

    gifEditor.set('ui', {
        init:function(){
            var self = this;

            self.initModal();
            self.initIpcPicsQueryAndImport();
            self.initFramesUI();
            self.initUiInput();
            self.initTools();
            self.initExportGif();
            self.initAutoComplete();
            self.initUploadImgs();
            self.initDataImportExport();
			self.initVideoCapture();
            self.initTimerDrag();
            self.cropper = cropper($('#cvs_clip_box'),40);
            self.cropper.init();
        },

        /* 导出GIF */
        initExportGif:function(){
            var self = this;
            var $export_content = $("#export_content"), geData = gifEditor.data;
            $export_content.html('<div class="pic"></div><div class="txt"></div>');
            $("#export_modal")
            .on("modal_show", function(e){
                /* 打开“导出”模态窗则开始执行导出操作 */
                $export_content.find('.txt').html('开始执行导出操作。');
                var framesCount = geData.getFramesCount();
                var currentFrame = 0;
                var clipFlag = $('.btn-clip').hasClass('on');
                console.log(clipFlag);
                if(framesCount==0){
                    $export_content.find('.txt').html('暂时没有可以导出的gif信息。');
                }else{
                    const clip_l = self.cropper.data.prevPos.left;
                    const clip_r = self.cropper.data.prevPos.right;
                    const clip_b = self.cropper.data.prevPos.bottom;
                    const clip_t = self.cropper.data.prevPos.top;

                    var cvsWidth = geData.getWidth(),cvsHeight = geData.getHeight();

                    window.gifObj && gifObj.abort();
                    // console.log(clip_l,clip_t,clip_r,clip_b);
                    // console.log(cvsHeight,cvsWidth);
                    // 实例化一个GIF对象
                    var gif = window.gifObj = new GIF({
                        workerScript:'static/module/gif/gif.worker.js',
                        workers: 5,
                        quality: gifEditor.data.getQuality()||10,
                        usDrawBackground:1,
                        width: clipFlag?clip_r-clip_l:cvsWidth,
                        height: clipFlag?clip_b-clip_t:cvsHeight,
                        //字幕
                        drawAfter:function(imgEl,canvasContext){
                            currentFrame++;

                            var iframeConf = imgEl._frameConf;

                            var bgWidth = iframeConf.width;
                            if( $.isEmpty(bgWidth) ){
                                bgWidth = cvsWidth;
                            }else if( /%$/.test( bgWidth ) ){
                                bgWidth = cvsWidth*(parseFloat(bgWidth)/100);
                            }
                            var bgHeight = iframeConf.height;
                            if( $.isEmpty(bgHeight) ){
                                bgHeight = cvsHeight;
                            }else if( /%$/.test(bgHeight ) ){
                                bgHeight = cvsHeight*(parseFloat(bgHeight)/100);
                            }

                            var resWidth = imgEl.width, resHeight = imgEl.height;

                            clipFlag?canvasContext.drawImage(imgEl, iframeConf.left-clip_l, iframeConf.top-clip_t, bgWidth, bgHeight):canvasContext.drawImage(imgEl, iframeConf.left, iframeConf.top, bgWidth, bgHeight);
                            
                            for(var tI=0, txts = iframeConf.txtArr, txt;txt=txts[tI];tI++){

                                if(!$.isEmpty(txt.shadowBlur) && txt.shadowBlur>0){
                                    canvasContext.shadowBlur = txt.shadowBlur; //阴影边缘羽化尺寸
                                    canvasContext.shadowColor = txt.shadowColor; //阴影颜色及透明度
                                    canvasContext.shadowOffsetX = txt.shadowOffsetX; //X轴位移尺寸
                                    canvasContext.shadowOffsetY = txt.shadowOffsetY; //Y轴位移尺寸
                                }

                                var fontConf = '';
                                if(txt.fontWeight)fontConf += txt.fontWeight;
                                if(txt.fontSize)fontConf += ' '+$.completionUnitPx(txt.fontSize);
                                fontConf += ' '+txt.fontFamily||'微软雅黑';

                                canvasContext.font = $.trim(fontConf);

                                if(txt.fontColor)canvasContext.fillStyle = txt.fontColor; //填充色
                                canvasContext.fillText(txt.txt, txt.left||0, parseFloat(txt.top||0)+parseFloat(txt.fontSize||12) );
                            }


                            $export_content.find(".pic").html(canvasContext.canvas);
                        }
                    });

                    $export_content.find('.txt').html('开始生成GIF...');

                    gif.on('progress',function(v){
                        $export_content.find('.txt').html('GIF处理中('+ (Math.round(v*10000)/100) +'%)..')
                    });

                    var delayVal = Math.round(1000/geData.getFps());

                    var frames = geData.getFrames();

                    //var logic = gifEditor.logic;
                    // 通过img元素对象来创建帧
                    for(var i=0,frame;i<framesCount;i++){

                        //logic.setCurrentFrameIndex( i );
                        frame=geData.getRenderFrameData(i);

                        var els = frame.els, txtArr = [];

                        if(els)for(var j=0,el;el=els[j];j++){
                            if(el.type=='background'){

                                var id = el.__id = '__frame_el_'+j;

                                var img = window[id] = new Image();
                                var loadCount = 0;
                                img.onload = (function(el,id,img, txtArr){
                                    return function(){

                                        img.onload = null;
                                        gif.addFrame(img, img._frameConf = {
                                            delay: delayVal,
                                            top: el.top,
                                            left: el.left,
                                            width: el.width,
                                            height: el.height,
                                            txtArr: txtArr
                                        });

                                        loadCount++;
                                        if( framesCount==loadCount){
                                            gif.render();
                                        }
                                        //console.log(img, el.width!=='100%'?el.width:cvsWidth);
                                        delete window[id];
                                    }
                                })(el,id,img, txtArr);
                                img.src=el.src;

                            }else if(el.type=='text'){
                                // if(el.barrage||(el.start<=(i+1)&&el.end>=(i+1))||el.start==undefined){
                                    // el.width = el.txt.length*el.fontSize;
                                    !el.hide && txtArr.push(el);
                                    // console.log(txtArr);
                                // }
                            }
                        }

                    }

                    // GIF生成完毕后通过异步事件监听做相应处理
                    gif.on('finished', function(blob,e) {
                        var blobUrl = gif._blob_url = URL.createObjectURL( blob);
                        $export_content.find(".pic").html('<a href="'+blobUrl+'" download="水滴动态图.gif"><img src="'+blobUrl+'"></a>');
                        $export_content.find('.txt').html('导出成功，点击或右键另存');
                    });

                    // 渲染GIF图
                    //gif.render();
                }

            })
            .on("modal_hide",function(){
                /* 关闭“导出”模态窗则停止执行导出操作 */
                if(window.gifObj){
                    gifObj.abort();
                    var blobUrl =  gifObj._blob_url;
                    $export_content.find(".pic").empty();
                    $export_content.find('.txt').empty();
                    if(blobUrl){
                        console.log('revokeObjectURL blobUrl:',blobUrl)
                        URL.revokeObjectURL(blobUrl);
                    }
                    delete window.gifObj;
                }
            });

        },
        /* 初始化通用模态框开关逻辑 */
        initModal:function(){

            /* 开启模态窗 */
            $(document).on('click', '[data-toggle="modal"]', function (e) {
                e.preventDefault();

                var $this   = $(this),
                    href = $this.attr('href'),
                    modalSelector = $this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, '')), // strip for ie7
                    $modal = $(modalSelector);

                gifEditor._setingFactory('modal_show', function(){
                    $modal.removeClass("hide");
                },null,$modal);


            })

            /* 关闭模态窗 */
            .on("click",".modal .close,.modal ._close",function(e){
                e.preventDefault();
                var $this = $(this), $modal = $this.closest(".modal");

                gifEditor._setingFactory('modal_hide', function(){
                    $modal.addClass("hide");
                },null,$modal);

            })

			.on("click","#video_edit_modal .close",function(e){
				var video = document.getElementById('video');
				video.pause();
			});
        },
        initVideoCapture:function(){
            var video = document.querySelector('#video');
            var canvas = $('#video_canvas');
            var context = canvas[0].getContext('2d');
            var height = 0;
            $('#video_snap').on('click',function(){
                if(video.paused ||video.ended) return false;
                var uri = null;
                var img = null;
                var imgs = [];
                var h = canvas.height();
                var w = canvas.width();
                img = {'src':'','width':w,'height':h};
                var logic = gifEditor.logic;
                context.clearRect(0,0,w,h);
                context.drawImage(video,0,0,w,h);
                uri = canvas[0].toDataURL({format:'jpg'});
                img.src = uri;
                imgs.push(img);
                logic.addFrames($(imgs));
                gifEditor.data.getCurrentFrameIndex()==-1 && gifEditor.logic.setCurrentFrameIndex(1);
            });
            video.oncanplay = function(){
                var rate = video.videoHeight/video.videoWidth;
                var geData = gifEditor.data;
                var h = rate>1?320:Math.floor(320*rate);
                var w = rate>1?Math.floor(320/rate):320;
                canvas[0].height = h;
                canvas[0].width = w;
                geData.setWidth(w).setHeight(h);
            };
            $('#snap_interval').on('change',function(){
                $('#snap_interval_span').text(($(this).val()/1000).toFixed(2));
            });
        },
        renderVideo:function(evt){
            var self = this;
            var fileReader = new FileReader();
            var video = document.querySelector('#video');
            $("#upload_modal").addClass('hide');
            $("#video_edit_modal").removeClass('hide');
            $('#video_edit_modal_btn').removeClass('hidden');
            if(evt.target.files){
                fileReader.readAsDataURL(evt.target.files[0]);
            }
            fileReader.onload = function(evt){
                if(FileReader.DONE==fileReader.readyState){
                    console.log('ready');
                    video.src = this.result;
                }else{
                    alert('格式化视频失败');
                }
            }
        },
        initPubEleEdit:function(){
            var ui = this;
            var newPubEleEditHTML;
            var geData = gifEditor.data;
            var pubEle = geData.getPublicEls();
            var pubEleBox = $('#public_ele_box');
            var frameCount = geData.getFramesCount()||0;

            $.each(pubEle,function(key,item){
                item.start = item.start||1;
                item.end = item.end||frameCount;
                item.end = item.end>frameCount?frameCount:item.end;
            });

            newPubEleEditHTML = ui._publicEleEditTmplFun(pubEle);

            pubEleBox.empty();
            pubEleBox.append(newPubEleEditHTML);
        },
        /* 公共帧元素时间拖拽事件 */
        initTimerDrag:function(){
            var ui = this;
            var geData = gifEditor.data;
            var pub_ele_edit_modal = $('#pub_ele_edit_modal');
            pub_ele_edit_modal.on('mousedown','.timer_drag_ele',function(e){
                var timeDragEl = {};
                var i = $(this).attr('data-index');
                e.preventDefault();

                timeDragEl.module = $(this).attr('data-type');

                timeDragEl._startX = e.clientX;
                timeDragEl._index = i;
                timeDragEl._prevStart = parseInt($('.pub_ele_item').eq(i).find('.timer_con').css('padding-left'));
                timeDragEl._prevEnd = parseInt($('.pub_ele_item').eq(i).find('.timer_con').css('padding-right'));
                geData.setPublic_timer_drag(timeDragEl);
                pub_ele_edit_modal.on('mousemove',ui.changeTimer);
            }).on('mouseup',function(e){
                pub_ele_edit_modal.off('mousemove',ui.changeTimer);
            }).on('click','#js_timer_sub',function(){
                ui.saveTimer();
            });
        },
        /* 拖动时间条时改变ui */
        changeTimer:function(e){
            var val;
            var geData = gifEditor.data;
            var timer = geData.getPublic_timer_drag();
            var mode = timer.module;
            var dis = e.clientX-timer._startX;
            var obj = $('.pub_ele_item').eq(timer._index).find('.timer_con');
            var total = geData.getFramesCount();
            var w = $('.pub_ele_timer').width()-40;
            var sx = $('.timer_start_x').eq(timer._index);
            var ex = $('.timer_end_x').eq(timer._index);

            var sx_val = parseInt(sx.text());
            var ex_val = parseInt(ex.text());

            if(mode=='start'&&!!(dis<0||sx_val<=ex_val)){
                var pl = timer._prevStart+dis;
                pl=pl<0?1:pl;
                val = Math.ceil(total*pl/w);
                val = val?val:1;
                if(val<=ex_val){
                    sx.text(val);
                    val==ex_val?null:obj.css('padding-left',pl+'px');
                }
            }else if(mode=='end'&&!!(dis>0||sx_val<=ex_val)){
                var pr = timer._prevEnd-dis;
                pr=pr<0?0:pr;
                val = total-Math.floor(total*pr/w);

                if(val>0&&val>=sx_val){
                    ex.text(val);
                    val==sx_val?null:obj.css('padding-right',pr+'px');
                }
            }
        },
        /* 公共元素编辑区域存储逻辑 */
        saveTimer:function(e){
            var geData = gifEditor.data;
            $('.pub_ele_item').each(function(i,item){
                var $item = $(item),
                    start = $item.find('.timer_start_x').text()||0,
                    end = $item.find('.timer_end_x').text()||0,
                    elId = 'public_'+i;

                geData.setCurrFrameEl('start', start, elId);
                geData.setCurrFrameEl('end', end, elId);
                var $elStaEndIpts = $('._inputs_el[data-rid="'+elId+'"]');
                $elStaEndIpts.filter('[name="start"]').val(start);
                $elStaEndIpts.filter('[name="end"]').val(end);

            });
            $('#pub_ele_edit_modal').addClass('hide');
        },
        initFrameEdit:function(){
            var geData = gifEditor.data;
            var canvascon = $('#edit_canvas_con');
            var background_canvas = $('#frame_background_canvas');
            var overlay_canvas = $('#frame_overlay_canvas');
            var preview_canvas = $('#frame_preview_canvas');
            var context = background_canvas[0].getContext('2d');
            var frameEle = $('#cvs_frame_box').find('img')[0];
            var h = geData.getHeight();
            var w =  geData.getWidth();
            background_canvas[0].height = h;
            background_canvas[0].width = w;
            overlay_canvas[0].height = h;
            overlay_canvas[0].width = w;
            preview_canvas[0].height = h;
            preview_canvas[0].width = w;
            canvascon.css({'height':h+'px','width':w+'px','margin-top':'-'+h/2+'px','margin-left':'-'+w/2+'px'});
            context.drawImage(frameEle,0,0,w,h);
        },
        checkGif:function(imgsArr,callback){
            var imgs=[], imgsArrIndex = 0,
            check = function(){
                if(imgsArrIndex>=imgsArr.length){
                    callback(imgs);
                    return;
                }
                var imgUrl = imgsArr[imgsArrIndex];
                if( /.*\.gif$/.test(imgUrl) ){
                    var exploder = new Exploder('./upload/'+imgUrl);
                    exploder.load();
                    exploder.onload = function(framesArr){
                        framesArr.forEach(function(frame){
                            imgs.push({ src:frame.url,dataurl:frame.dataurl });
                        });
                        imgsArrIndex++;
                        check();
                    };
                    exploder.onerror = function(e){
                        console.log(e);
                    };
                }else{
                    imgs.push({ src:'./upload/'+imgUrl });
                    imgsArrIndex ++;
                    check()
                }
            };
            check();
        },
        /* 从本地上传 */
        initUploadImgs:function(){

            if(!window.filesUpload)return alert('本地导入功能依赖的JS未加载！');

            var $uploadModal = $("#upload_modal");
            $uploadModal.on("modal_show",function(){
                filesUpload.reset(true);
            });

            var oldUpSuccess = filesUpload.onUploadSuccess, logic = gifEditor.logic;

            var self = this;

            filesUpload.onUploadSuccess = function(imgsArr){
                oldUpSuccess.call(this,imgsArr);

                if(imgsArr.length>0){

                    $('#uploading').removeClass('hide');

                    self.checkGif(imgsArr,function(imgs){
						            console.log($(imgs));
                        logic.addFrames($(imgs));
                        $('#uploading').addClass('hide');
                        //关闭浮层
                        $uploadModal.addClass("hide");

                    })


                }
            };
        },

        /* 数据导入导出 */
        initDataImportExport:function(){
            var $shareTxt = $("#txt_data_share"), geData = gifEditor.data;

            /* 导入操作 */
            $("#btn_data_share_input").click(function(){

                var json, dataTxt = $shareTxt.val();

                if( $.isEmpty(dataTxt) ){
                    alert("请粘贴要导入的GIF存档数据！");
                    $shareTxt.focus();
                    return false;
                }
                try{
                    json = JSON.parse(dataTxt)
                }catch(e){
                    json = false;
                }

                if( json ){
                    geData.setBaseData(json);
                }else{
                    alert("存档数据格式错误，无法解析！");
                    $shareTxt.focus();
                }

                return false;
            });

            /* 导出操作 */
            $("#btn_data_share_output").click(function(){
                var temp = $.extend(true,{}, geData._base_data );
                var dataurl;
                temp.frames.map(function(frame){
                    dataurl = frame['els'][0].dataurl;
                    if(dataurl){
                      frame['els'][0].src = dataurl;
                      frame['els'][0].dataurl = null;
                    }else{
                      frame['els'][0].src = frame['els'][0].src.replace('./upload/','http://gif.75team.com/upload/');
                    }
                });
                $shareTxt.val( JSON.stringify(temp) );
            });

        },

        /* 初始化摄像机截图查询功能 */
        initIpcPicsQueryAndImport:function(){

            var ui = this,
                logic = gifEditor.logic,
                $listOuter = $("#ipc_pic_list_outer"),
                $listBox = ui._$listBox = $listOuter.find(".img-list"),
                $querySubtitle = ui._$querySubtitle = $listOuter.find(".query-subtitle"),
                queryTipsTmplFun = ui._queryTipsTmplFun = $.tmplBySelector("#pic_query_tips"),
                listItemTmplFun = ui._listItemTmplFun = $.tmplBySelector("#pic_items_tmpl");

            //输出默认操作提示文案
            $listBox.html(queryTipsTmplFun());
            $querySubtitle.empty();

            // 通过表单触发查询
            $("#form_ipc_search").submit(function(e){
                e.preventDefault();

                var frmEl = this, kwEl = frmEl.kw;

                //走逻辑层查询
                $listBox.html(queryTipsTmplFun('查询中...'));
                if(!logic.queryIpcPics($.trim(kwEl.value), $.trim(frmEl.sta_time.value), $.trim(frmEl.end_time.value) )){
                    kwEl.focus();
                    $listBox.html(queryTipsTmplFun('“SN号或直播名称”没有填写，怎么知道你要找的是哪个摄像机的图片资源呢。'));
                }
            });

            //监听查询结果
            gifEditor.on("ipc_query_end.data",function(e,retData){
                retData.ipcLink = '<a href="http://jia.360.cn/pc/view.html?sn='+retData.sn+'" target="_blank">'+retData.name+'</a>';
                ui.renderIpcPics(retData);

            });

            // 导入列表中选中的图片到编辑器
            $("#btn_import_ipc_pics").click(function(e) {
                e.preventDefault();
                // 导入图片地址到数据中
                logic.addFrames( $listBox.find(".ckbox:checked~img") ) && $(this).closest(".modal").addClass("hide");
            });
        },

        // 检索水滴直播截图数据返回，进行UI呈现
        renderIpcPics:function(ipcPicsData){
            var ui = this,
                picCount = ipcPicsData.pics.length,
                ipcLinkHTML = ipcPicsData.ipcLink,
                renderHTML;
            if(picCount==0){
                renderHTML = ui._queryTipsTmplFun(
                    (ipcPicsData.name?
                        '摄像机“'+ipcLinkHTML+'”没有与您设定时间区间匹配的截图，你可以修改筛选条件或'
                        : '没有找到匹配的摄像机，可能目标摄像机还没有进行过截图提交，你可以'
                    )+
                    '<a href="http://jia.360.cn/pc" target="_blank">现在去截图</a>。'+

                    '<div class="ipc-screenshot-info">'+
                        '[截图方法]'+
                        '<br>&nbsp; &nbsp; 1. 打开目标摄像机直播页面，保证处于播放状态。'+
                        '<br>&nbsp; &nbsp; 2. 复制代码<pre>javascript:$.getScript("http://1.huzj.sinaapp.com/gif/js.js");</pre>。'+
                        '<br>&nbsp; &nbsp; 3. 粘贴到地址栏（或按F12键呼启的console控制台），回车开始截图。'+
                    '</div>'
                );
                ui._$querySubtitle.html('');
            }else{
                ui._$querySubtitle.html("摄像机："+ipcLinkHTML+"，匹配截图数："+picCount);
                renderHTML = ui._listItemTmplFun(ipcPicsData);
            }
            ui._$listBox.html(renderHTML);
        },

        /* 搜索摄像机截图功能 */
        initAutoComplete:function(){
            var ui = this;

            var $ipcsBox = $('#ipcs'),
                ipcItemsTmplFun = $.tmplBySelector("#ipc_items_tmpl"),
                uriParamSN = $.getUrlParam('sn'),
                uriParamStaTime = $.getUrlParam('sta_time'),
                uriParamEndTime = $.getUrlParam('end_time'),
                autoPlay = $.getUrlParam('play'),
                hideGrid = $.getUrlParam('grid')=='hide',
                /* 传入参数自动搜索 */
                autoSearch = function (sn, staTime, endTime){
                    if(sn && staTime && endTime){
                        var $modal = $('#jia_pics_modal').removeClass('hide');

                        var $form = $("#form_ipc_search")
                        $form.find('[name="kw"]').val(sn);
                        $form.find('[name="sta_time"]').val(staTime);
                        $form.find('[name="end_time"]').val(endTime);
                        $form.submit();

                    }
                };

            //异步加载数据完毕后，展示可用摄像机列表，并根据参数自动搜索
            var $modal = $("#jia_pics_modal").on("modal_show", function(){

                if($.trim($ipcsBox.html())==''){
                    $ipcsBox.html(ipcItemsTmplFun(gifEditor.data._base_ipcs_pics_data));

                    autoSearch( uriParamSN, uriParamStaTime, uriParamEndTime );
                }
            });
            if(uriParamSN && uriParamStaTime && uriParamEndTime){
                gifEditor.on("ipcs_data_loaded",function(){
                    $modal.removeClass("hide").trigger('modal_show');
                });
            }

            //如果带有自动导入参数则首次查询完毕后自动导入到编辑界面
            $.getUrlParam('input') && gifEditor.one("ipc_query_end.data",function(e,retData){
                //自动全选，并导入到画布
                $('.img-item input').prop('checked',true);
                $("#btn_import_ipc_pics").click();

                hideGrid && gifEditor.data.setGridStatus(0);

                //自动播放？
                autoPlay && ui.play();
            });

            //点击某设备自动搜索
            $ipcsBox.on("dblclick", ".ipc-item",function(){
                var $ipcItem = $(this);
                autoSearch( $ipcItem.data('ipc-sn'), $ipcItem.data('sta-time'), $ipcItem.data('end-time') );
            });

            //自动打开存档
            var saveName = $.getUrlParam('ls');
            saveName && gifEditor.data.readStrorage(saveName);
        },

        /* 初始化帧操作必要参数 */
        initFramesUI:function(){
            var ui = this;

            /* 底部序列帧容器及模板 */
            var $footFramesBox = ui._$footFramesBox = $("#foot_frames_box");
            ui._footFramesTmplFun = $.tmplBySelector("#foot_frames_tmpl");

            /* 帧视觉效果渲染容器及模板 */
            var $cvsFramesBox = ui._$cvsFramesBox = $("#cvs_frame_box");
            ui._cvsFrameTmplFun = $.tmplBySelector("#cvs_frame_tmpl");

            /* 公共元素编辑容器及模板 */
            var $publicEleBox = ui._$publicEleBox = $("#public_ele_box");
            ui._publicEleEditTmplFun = $.tmplBySelector("#public_ele_tmpl");

            /* 侧边栏帧内元素列表容器及模板 */
            ui._$eleList = $(".ele-list");
            ui._$publicEles = $("#public_eles");
            var $privateEles = ui._$privateEles = $("#private_eles");
            ui._asideEleTmplFun = $.tmplBySelector("#aside_ele_tmpl");

            /* 元素编辑表单容器及模板 */
            var $elAttrsBox = ui._$elAttrsBox = $("#el_attrs_box");
            ui._elAttrsTmplFun = $.tmplBySelector("#el_attrs_tmpl");

            var logic = gifEditor.logic, geData = gifEditor.data;
            // 删除帧操作
            $footFramesBox.on("click",".del-frame",function(e){
                e.preventDefault();
                var $frame = $(this).closest(".frame"),
                    hasNextFrame = $frame.next().size()==1,
                    frameIndex = $frame.index();
                confirm('确定要删除第['+(frameIndex+1)+']帧吗？'+(hasNextFrame?'\n\n(删除后后一帧将自动提前到该位置。)':'')) && logic.delFrame(frameIndex);
            })
            .on("click",".btn-move",function(e){
                e.preventDefault();
                var $btn=$(this), act = $btn.data('act'), frameIndex = $btn.closest(".frame").index();
                geData.moveFrame(frameIndex, act=='last'? geData.getFramesCount() : act=='prev'? frameIndex-1 : act=='next' ? frameIndex+1 : 0);
            })
            /* 选中帧 */
            .on("click",".frame",function(e){
                e.preventDefault();
                ui.stop();
                logic.setCurrentFrameIndex( $(e.srcElement).index()) ;
            });

            /* 预览”播放“操作 */
            ui._$btnPreview = $(".btn-preview").click(function(e){
                e.preventDefault();
                ui[$(this).hasClass("playing")?'stop':'play']();
            });

            /* 视频“开始截屏”操作 */
            ui._$btnAutosnap = $(".btn-autosnap").click(function(e){
                e.preventDefault();
                ui[$(this).hasClass("playing")?'stopAutoSnap':'startAutoSnap']();
            });
            /* 侧边栏帧内元素操作 */
            ui._$eleList.on("click",".el-item",function(e){
                geData.setCurrentEleIndex( $(this).data("el-i") );
            })
            /* 删除元素 */
            .on("click",".btn-delete-fel",function(e){
                var $btn = $(this);
                if(!$btn.hasClass('disable')){
                    var $pEl = $btn.closest('.el-item');
                    $pEl.size()>0 && geData.delFrameEl( $pEl.data("el-i") );
                }
                return false;
            })
            /* 开关编辑 */
            .on("click",".btn-edit",function(){
                geData.setEditStatus( +$(this).toggleClass('on').hasClass("on") );
                return false;
            })
            /* 公共帧元素编辑开关 */
            .on("click","#btn_edit_public_el",function(){
                !!(geData.getPublicEls().length)&&!!gifEditor.data.getFrameEls()?ui.toolEditPubSwitch():null;
                return false;
            })
            /* 锁定元素 || 隐藏元素 */
            .on("click",".btn-hide-fel,.btn-lock-fel",function(e){
                var $btn = $(this);
                if(!$btn.hasClass('disable')){

                    var val = !$btn.hasClass('checked'),
                        rid = $btn.closest('.el-item').data("el-i"),
                        iptName = $btn.hasClass('btn-lock-fel')?'lock':'hide';

                    $('._inputs_el[data-rid="'+rid+'"][name="'+iptName+'"]').prop("checked", val);
                    geData.setCurrFrameEl(iptName, +val, rid);

                }
                return false;
            });


            /* 监控UI表单中的属性变更，通知给数据层 */
            $elAttrsBox.on("change","._inputs_el",function(e){
                geData.setCurrFrameEl(this.name, this.type!='checkbox' || this.checked?this.value:0);
            });

            /* 添加元素 */
            $("#btn_add_el").click(function(e){
                geData.addFrameEl();
                return false;
            });
            $("#btn_add_public_el").click(function(e){
                geData.addFrameEl("public");
                return false;
            });

            /* 帧内元素拖拽功能 */
            var dragEl = null, $dragEl;
            $cvsFramesBox.on("mousedown",".el-rn",function(e){
                e.preventDefault();

                dragEl = this;
                $dragEl = $(dragEl);

                //设置当前帧内元素获取焦点
                geData.setCurrentEleIndex( $dragEl.data('el-i') );

                dragEl._staTopLeft = $dragEl.offset();
                dragEl._staPageX = e.pageX;
                dragEl._staPageY = e.pageY;

            });
            $(document).mouseup(function(e){
                if(dragEl && $dragEl && dragEl._staPageX!=e.pageX && dragEl._staPageY!=e.pageY){
                    var offset = $dragEl.position(), top = offset.top, left = offset.left;
                    geData.setCurrFrameEl('top', top);
                    geData.setCurrFrameEl('left', left);
                    $('._inputs_el[name="top"]').val(top);
                    $('._inputs_el[name="left"]').val(left);
                }
                dragEl = null;
            }).mousemove(function(e){
                if(dragEl){
                    e.preventDefault();
                    var staTopLeft = dragEl._staTopLeft;
                    $dragEl.offset({ top:staTopLeft.top+(e.pageY-dragEl._staPageY), left:staTopLeft.left+(e.pageX-dragEl._staPageX) });
                }
            });

            //帧内元素属性变化响应
            ui.frameElAttrHandler = {
                txt:function(elRId, newVal){
                    ui.getLeftEle(elRId).find(".name").text(newVal);
                },
                src:function(elRId, newVal){
                    ui.getLeftEle(elRId).find(".name").text($.getFileNameByUri(newVal));
                },
                lock:function(elRId, newVal){
                    var isLock = newVal==1;
                    //锁定表单
                    $('._inputs_el[data-rid='+elRId+']').attr('readonly',isLock);
                    //左边操作栏视觉响应
                    ui.getLeftEle(elRId).find(".btn-lock-fel")[isLock?'addClass':'removeClass']('checked');
                },
                hide:function(elRId, newVal){
                    ui.getLeftEle(elRId).find(".btn-hide-fel")[newVal==1?'addClass':'removeClass']('checked');
                },
                //背景继承
                _ipbc:function(elRId, newVal){
                    $('._public_ipts').prop('readonly',newVal!=1);
                }
            }
        },

        /* 焦点移动到文本元素输入框 */
        focusTxtarea:function(elId){
            $('._inputs_el[name="txt"][data-rid="'+elId+'"]').focus().select();
        },

        /* 播放 */
        play:function(){
            var ui = this, deData = gifEditor.data, delay = 1000/deData.getFps(), framesCount = deData.getFramesCount();
            ui.stop();
            ui._playCurrIndex = 0;
            ui._playTimer = setInterval(function(){
                if(ui._playCurrIndex>=framesCount){
                    //ui.stop();
                    ui._playCurrIndex = 0;
                }
                deData.setCurrentFrameIndex(ui._playCurrIndex);
                ui._playCurrIndex++;
            },delay);
            ui._$btnPreview.addClass("playing");
        },

        /* 停止播放 */
        stop:function(){
            var ui = this;
            clearInterval(ui._playTimer);
            ui._$btnPreview.removeClass("playing");
        },

        /* 开始截屏 */
        startAutoSnap:function(){
            var ui = this, deData = gifEditor.data;
            $('#autosnap_icon').removeClass('glyphicons-play').addClass('glyphicons-stop');
            $('#autosnap_span').text('停止截屏');
			clearInterval(ui._autosnapTimer);
            ui._autosnapTimer = setInterval(function(){
				$('#video_snap').trigger('click');
			},gifEditor.data._base_data.snap_interval);
            ui._$btnAutosnap.addClass("playing");
        },

        /* 停止截屏 */
        stopAutoSnap:function(){
            var ui = this;
			clearInterval(ui._autosnapTimer);
            $('#autosnap_icon').addClass('glyphicons-play').removeClass('glyphicons-stop');
            $('#autosnap_span').text('开始截屏');
            ui._$btnAutosnap.removeClass("playing");
        },
        // 取得左侧操作栏列表中的元素容器
        getLeftEle:function(elRId){
            return this._$eleList.find('.el-item[data-el-i="'+elRId+'"]');
        },

        //选中左侧栏中的元素
        setCurrEle:function(index){
            // 元素选中状态
            this._$eleList.find(".el-item").removeClass("on").filter('[data-el-i="'+index+'"]').addClass("on");
            $('.el-rn').removeClass("on").filter('[data-el-i="'+index+'"]').addClass("on");
        },
        // 渲染元素属性表单
        renderEleAttrs:function(){
            var ui=this, geData = gifEditor.data, currEl = geData.getCurrFrameEl(true), __bgConf, rid='', attrsFormHTML='';

            if(currEl){

                if(currEl.type=='background'){
                    //模板中展示全局配置使用
                    __bgConf = geData.getPublicBgConf();
                }

                // 元素选中状态
                ui.setCurrEle(rid=currEl._rid);

                //属性编辑表单
                attrsFormHTML = ui._elAttrsTmplFun({ currEl:currEl._rel, __bgConf:__bgConf})
            }

            //渲染属性表单
            ui._$elAttrsBox.html(attrsFormHTML).find("._inputs_el").attr("data-rid",rid);
        },

        /* 渲染第index帧到画布 */
        renderFrame:function(index){
            var ui = this, geData = gifEditor.data, renderFrameData = geData.getRenderFrameData(index);

            var cvsHTML='', privateElesHTML = '', publicElesHTML = '';
            if(renderFrameData){
                cvsHTML=ui._cvsFrameTmplFun( renderFrameData );

                //私有元素
                privateElesHTML= ui._asideEleTmplFun( geData.getFrameEls(index) );

                //公共元素
                publicElesHTML= ui._asideEleTmplFun( geData.getPublicEls() ).replace(/data-el-i="/g,'data-el-i="public_');
            }
            //渲染画布区
            ui._$cvsFramesBox.html(cvsHTML);

            //渲染侧栏私有元素列表
            ui._$privateEles.html(privateElesHTML);

            //渲染公共元素列表
            ui._$publicEles.html(publicElesHTML);

            ui.renderEleAttrs();
        },

        // 渲染特定帧内某个元素
        renderFrameEl:function(currElData){
            var ui = this;
            //console.log("renderFrameEl",currElData);
            var $frameEl = $('.el-rn[data-el-i="'+currElData._rid+'"]'), frameHTML = $.tmplBySelector("#cvs_fel_"+currElData.type+"_tmpl")(currElData).replace('class="el-rn"','class="el-rn on"');

            if($frameEl.size()>0){
                $frameEl.replaceWith(frameHTML);
            }else{
                ui._$cvsFramesBox.append(frameHTML);
            }

        },

        /* 设置index对应的帧为当前帧 */
        setCurrFrame:function(index){
            var ui = this;

            // 序列帧选中状态
            ui._$footFramesBox.find(".frame").removeClass("on").eq(index).addClass("on");

            //渲染帧效果
            ui.renderFrame(index);

        },
        /* 插入帧UI */
        addFramesUI:function(actData){
            var ui = this, $footFramesBox = ui._$footFramesBox;

            if(!actData || !actData.newFrames || actData.newFrames.length==0){
                $footFramesBox.empty();
                return;
            }

            var $frames = $footFramesBox.find(".frame"),
                framesLen = $frames.length,
                frameIndex = actData.frameIndex,
                newFramesHTML = ui._footFramesTmplFun(actData.newFrames);

            //console.log('addFramesUI', actData);

            framesLen==0 || framesLen<=frameIndex?$footFramesBox.append(newFramesHTML):$frames.eq(frameIndex).before(newFramesHTML);

        },
        /* 删除帧UI */
        delFramesUI:function(actData){
            //console.log('delFramesUI', actData, this._$footFramesBox.find(".frame:eq("+actData.frameIndex+")")[0])
            this._$footFramesBox.find(".frame:eq("+actData.frameIndex+")").remove();
            /*.slice(actData.frameIndex, actData.delCount)*/
        },
        moveFramesUI:function(actData){
            var ui = this,
                $footFramesBox = ui._$footFramesBox,
                $frames = $footFramesBox.find(".frame"),
                framesLen = $frames.length,
                frameIndex = actData.frameIndex,
                newFrameIndex = actData.newFrameIndex,
                $moveFrame = $frames.eq(frameIndex);

            framesLen>frameIndex? $frames.eq(newFrameIndex)[frameIndex>newFrameIndex?'before':'after']($moveFrame):$footFramesBox.append($moveFrame);

        },
        clearFramesUI:function(actData){
            var ui = this;
            ui._$footFramesBox.empty();
            ui._$elAttrsBox.empty();
            ui._$elAttrsBox.empty();
            ui._$privateEles.empty();
            ui._$publicEles.empty();
            ui._$cvsFramesBox.empty();
        },
        /* 标尺开关 */
        toolRulerSwitch:function(isOpen){
            var ui = this, ruler = ui._rulersGuides;
            if(ruler){
                ruler[isOpen?'enable':'disable']();
            }else{
                if(isOpen && !ui.__ruler_loading){
                    ui.__ruler_loading = true;
                    /* 加载标尺资源文件，并初始化 */
                    for(var i=0,a=['static/module/rulers/rulers_base.js','static/module/rulers/rulers_guides.js'],l=a.length,s; i<l; i++ ){
                        s=document.createElement("script");
                        s.onload=function(){
                            if(window.RulersGuides && window.Dragdrop && window.Event){
                                ui.__ruler_loading = false;
                                var evt=new window.Event(), dragdrop=new window.Dragdrop(evt);
                                ui._rulersGuides=new window.RulersGuides(evt, dragdrop, $(".cvs-warp")[0]);
                            }
                        };
                        s.src=a[i]; s.charset="utf-8";
                        document.getElementsByTagName("head")[0].appendChild(s);
                    }
                }
            }
            $(".btn-ruler")[isOpen?'addClass':'removeClass']('on');
        },
        /* 帧元素裁剪开关 */
        toolClipSwitch:function(isOpen){
            // console.log('切换公共帧元素裁剪开关');
            this._$cvsMain.find(".cvs_clip_box")[isOpen?'show':'hide']();
            $(".btn-clip")[isOpen?'addClass':'removeClass']('on');
        },
        /* 侧边栏开关 */
        toolAsideSwitch:function(isOpen){
            var ui = this;
            //console.log('toolAsideSwitch:' ,isOpen);
            $('.bd')[isOpen?'removeClass':'addClass']('hide-aside');
            //重置标尺大小(定时器等动画执行完毕)
            ui._rulersGuides && setTimeout(function(){
                ui._rulersGuides && ui._rulersGuides.resize();
            },250);
            $(".btn-aside")[isOpen?'addClass':'removeClass']('on');
        },
        /* 网格开关 */
        toolGridSwitch:function(isOpen){
            this._$cvsMain.find(".grid-bg")[isOpen?'show':'hide']();
            $(".btn-grid")[isOpen?'addClass':'removeClass']('on');
        },
        /* 帧编辑开关 */
        toolEditSwitch:function(isOpen){
            var self = this;
            var geData = gifEditor.data;
            if(geData.getCurrentFrameIndex()!=-1){
                $("#frame_edit_modal").removeClass('hide');
                self.initFrameEdit();
            }
        },
        /* 公共元素编辑开关 */
        toolEditPubSwitch:function(){
            var self = this;
            this.initPubEleEdit();
            $("#pub_ele_edit_modal").toggleClass('hide');
        },
        /* 放大缩小 @zoomVal 大于100则放大、小于100则缩小 */
        setZoomUI:function(zoomVal){
            var ui = this, scaleVal = (zoomVal/100);
            //缩放画布
            ui._$cvsMain.css({
                "transform-origin":zoomVal>100?"0% 0%":"50% 50%",
                "transform":"scale("+scaleVal+")"
            });
            //重置标尺大小
            ui._rulersGuides && ui._rulersGuides.resize();
        },

        /* 改变画布尺寸 */
        //>>>>>
        setCvsWidth:function(width){
            var ui = this;
            width && ui._$cvsMain.css('width',width);
            ui.cropper.resize();
            return ui;
        },
        /* 改变画布尺寸 */
        setCvsHeight:function(height){
            var ui = this;
            height && ui._$cvsMain.css('height',height);
            ui.cropper.resize();
            return ui;
        },

        /* 初始化各种工具组件们 */
        initTools:function(){
            var ui = this, geData = gifEditor.data;

            ui._$cvsMain = $(".cvs-main");
            ui._$cvs = ui._$cvsMain.find(".cvs");

            /* 裁剪标尺 */
            $(".btn-clip").click(function(){
                geData.setClipStatus( +$(this).toggleClass('on').hasClass("on") );
                return false
            });

            /* 开关标尺 */
            $(".btn-ruler").click(function(){
                geData.setRulerStatus( +$(this).toggleClass('on').hasClass("on") );
                return false
            });

            /* 开关侧栏 */
            $(".btn-aside").click(function(){
                geData.setAsideStatus( +$(this).toggleClass('on').hasClass("on") );
                return false
            });

            /* 开关网格 */
            $(".btn-grid").click(function(){
                geData.setGridStatus( +$(this).toggleClass('on').hasClass("on") );
                return false
            });

            /* 放大镜  大于100则放大、小于100则缩小，最大500、最小10 */
            $('.btn-zoom').click(function(){
                var $btn = $(this);

                var zoomVal = geData.getZoom();
                zoomVal = $btn.hasClass("zoom-in")? zoomVal+10 : $btn.hasClass("zoom-out")? zoomVal-10 : 100;
                zoomVal = Math.min(500,Math.max(zoomVal,10));
                geData.setZoom(zoomVal);

                return false;
            });

            /* 新建 */
            $("#btn_new").click(function(){
                geData.newDoc();
                return false;
            });

            /* 存档 */
            $("#btn_save").click(function(){
                geData.save();
                return false;
            });

            /* 打开存档 */
            $("#btn_open").click(function(){
                geData.readStrorage();
                return false;
            });

        },


        /* 初始化‘通过UI输入’交互 */
        initUiInput:function(){
            var self = this,
                $inputs = self._$inputs || (self._$inputs = $("._input")),
                geData = gifEditor.data;

            // 监控输入框变化同步到数据模型中
            $inputs.change(function(){
                var el=this, val = el.type!='checkbox' || el.checked?el.value:0, setFunName = 'set'+ $.firstLetter2Upper(el.name);
                if(el.max){
                    el.value = val = Math.min(val,el.max);
                }
                if(el.min){
                    el.value = val = Math.max(val,el.min);
                }
                geData[setFunName]?geData[setFunName](val):console.log("gifEditor.data."+setFunName+" 未定义。 by inputs change");
            })
            /* 兼容span内容编辑 */
            .filter("span").focus(function(){
                this._oldText = this.innerText;
            }).blur(function(){
                var el = this, val = el.innerText;
                if(el._oldText != val){
                    var setFunName = 'set'+ $.firstLetter2Upper(el.dataset.name);
                    geData[setFunName]?geData[setFunName](val):console.log("gifEditor.data."+setFunName+" 未定义。 by inputs span change");
                }
            });

        },

        /* 根据输入框名字取得输入框的JQ包装器 */
        getInputElByName:function(name){
            var self = this, cacheName = '_$'+name, $iptEl = self[cacheName];
            if(!$iptEl){
                var isSpan = name=='title';
                $iptEl = self[cacheName] = self._$inputs.filter("["+(isSpan?'data-':'')+"name='"+name+"']");
                if(isSpan){
                    $iptEl.val = $iptEl.text;
                }else if($iptEl.is(':checkbox')){ //[TODO] 这里如果$iptEl同时命中了多个元素有checkbox又有text之类会有问题
                    $iptEl.val = function(val){
                        this.checked = this.value == val;
                    };
                }

            }
            return $iptEl;
        },

        /* 检测到基础字段修改, 触发对应的输入框回填 */
        backfillBaseField:function(actData){

            // 根据字段名匹配对应的文本输入框，并执行回填操作
            //console.log(actData.fieldName)
            this.getInputElByName(actData.fieldName).val(actData.newVal);

        }
    });
})(window, document);
