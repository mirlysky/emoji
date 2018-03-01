/**
* GIF编辑器 - 文件上传功能仓促版
*
* @author huzunjie@pyzy.net
*/
(function(window){
    
    if(!window.FormData){
        return alert("当前环境不支持H5文件批量上传功能，您可以切换到webkit内核浏览器解决该问题。");
    }

    var filesUpload = window.filesUpload = {
        parentPath:'/', //文件存储目录
        filesInputSelector:'._upload_files', /* 文件选择框对应选择器 */
        _files:[ ],
        _paths:[ ],
        _count:0,
        _size:0,
        writeMsg:function(msgHTML,isAppend){
            return $('#divUploadMsg')[isAppend?'append':'html'](msgHTML).show();
        },
        reset:function(uiReset){
            var _t = this;
            _t._files = [];
            _t._paths = [];

            //清空已选上传文件
            if(uiReset){
                $(_t.filesInputSelector).val("");
                _t.writeMsg("").hide();
            }

            _t.change(-this._count,-this._size);
        },
        /* 添加图片到处理队列 */
        push:function(file){
            var _t = this;
            var fielPath = file.webkitRelativePath||file.name;
            //过滤不允许上传的文件们
            if(/\.(jpg|jpeg|png|gif|bmp)$/.test(fielPath)){
                var filesArr = _t._files, pathsArr = _t._paths;
                filesArr.push(file);
                pathsArr.push(fielPath);
                _t.change(1,file.size);
            }
        },
        /* 遍历处理队列中的文件对象 */
        each:function(fun){
            var _t = this, count = _t._count, files = _t._files;
            for(var i=0;i<count;i++){
                var ret = fun && fun(files[i],i);
                if(ret===true)break;
            }
        },
        /* 处理队列发生变更（插入或移除图片、重置） */
        change:function(count,size){
            this._count+=count;
            this._size+=size;
            this.onChange && this.onChange();
        },
        /* 上传文件 */
        uploadFiles:function(uploadType){
            var _t = this;

            _t.onUploadStart && _t.onUploadStart();

            $("#uploading").removeClass('hide');

            // 构造表单数据
            var form = new FormData();
            form.append("paths", _t._paths.join(";"));
            _t.each(function(file,i){
                form.append("f"+i, file);
            });

            // 发送异步上传请求
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
                //console.log("Upload complete.",xhr.response);
                $("#uploading").addClass('hide');

                //console.log(xhr.response);

                var resStr = xhr.response, resJSON = resStr=='err'?resStr:$.parseJSON(resStr), callbackName = resStr=='err'?'onUploadFail':'onUploadSuccess';
                
                //失败返回 'err' 否则返回图片地址数组
                resJSON._uploadType = uploadType;
                _t[callbackName] && _t[callbackName](resJSON);
            };
            xhr.open("post", 'files_upload.php', true);
            xhr.send(form);
        },

        /* 从文件输入表单中读取选择的文件们，并加入上传队列 */
        receiveFiles:function(fileInputEl){
            var _t = this, files = fileInputEl.files, isDirectory = $(fileInputEl).attr("directory")!=undefined;
            
            for (var i = 0, file; file = files[i]; ++i) {
                if(isDirectory && !file.webkitRelativePath){
                    alert('当前环境不支持文件夹上传，请切换为webkit内核浏览器。')
                    return false;
                }
                _t.push(file);
            }
            return files.length>0;
        },
        /* 校验是否可执行上传操作，不可以则给出提示 */
        validate:function(){
            return this.onValidate?this.onValidate():true;
        },
        /* 校验上传的文件是否是视频，如果是视频的话则不走上传流程 */
        validate_video:function(obj){
            var oneMB = 1048576;
            var size = obj.target.files[0].size;
            if(Math.ceil(size/oneMB)>=50){
                alert('视频文件大小超过50M');
                return false;
            }
            return new RegExp('video').test(obj.target.files[0].type);
        },
        /* 通知UI层进行视频渲染 */
        handle_video:function(e){
            gifEditor.ui.renderVideo(e);
        }
    };

    /* 绑业务逻辑处理 */
    $.extend(filesUpload,{
        _init:function(){
            var _t = this;
            $(_t.filesInputSelector)
            /* 文本框内容改变则触发更新 */
            .change(function(e){
                _t.reset(false);
                /* 检查文件是否为视频 */
                /* 是：单独处理,转化为bob对象添加至video标签 */
                /* 否：取得上传文件，确定有可上传的文件则触发上传 */
                if(e.target.id=='_video_upload'){
                    _t.validate_video(e)?_t.handle_video(e):null;
                }else{
                    _t.receiveFiles(this) && _t.validate() && _t.uploadFiles($(this).data("upload-type"));
                }
            });
            /*.on("dragenter dragover",function(e){
                console.log(e.type);
            }).on("dragleave", function(e) {
                console.log(e.type);
            })*/

        },

        onChange: function(){
            var _t = this, size = _t._size, oneMB = 1048576;
            if(size>oneMB){
                size = Math.round(size/oneMB)+' MB';
            }else{
                size = Math.round(size/1024)+' KB';
            }
            _t.writeMsg('<p class="text-info">共选择'+_t._count+'个文件，文件大小共计'+size+'。</p>');
        },
        onUploadSuccess: function(resJSON){
            this.writeMsg('<p class="text-success">上传成功</p>',1);
        },
        onUploadFail: function(resJSON){
            this.writeMsg('<p class="text-danger">上传失败</p>',1);
        },
        onValidate:function(){
            var _t = this, size = _t._size, oneMB = 1048576;

            //名称字符校验
            //console.log(_t._paths.join("/-/"))
            /*if(!/(^[\/\w\u4E00-\u9FA5\._-]+$)/.test(_t._paths.join("/-/"))){
                _t.writeMsg('<p class="text-danger">文件路径只能包含汉字、字母、数字、中划线、下划线，不允许空格以及其他特殊字符。</p>');
                return false;
            }*/

            /* 总文件大小限制在50M以内 */
            if(size>50*oneMB){
                if(size>oneMB){
                    size = Math.round(_t._size/oneMB)+' MB';
                }else{
                    size = Math.round(_t._size/1024)+' KB';
                }
                _t.writeMsg('<p class="text-danger">所选择文件总大小为<b>'+size+'</b>，超过了50MB的最大限制上限。</p>');
                return false;
            }
            /* 总文件数量限制在20个以内 */
            if(_t._count>100){
                _t.writeMsg('<p class="text-danger">所选择文件总数量为<b>'+_t._count+'个</b>，超过了100个的最大限制上限。</p>');
                return false;
            }
            return true;
        }
    });
    
    //初始化文件批量上传功能
    filesUpload._init();
})(window);
/* 静态资源文件上传功能逻辑代码 end */
