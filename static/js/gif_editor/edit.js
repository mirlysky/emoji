(function(window, document, undefined){
	'use strict';

	gifEditor.set('edit',{
        b_canvas:$('#frame_background_canvas')[0],
        o_canvas:$('#frame_overlay_canvas')[0],
        p_canvas:$('#frame_preview_canvas')[0],
        b_ctx:$('#frame_background_canvas')[0].getContext('2d'),
        o_ctx:$('#frame_overlay_canvas')[0].getContext('2d'),
        p_ctx:$('#frame_preview_canvas')[0].getContext('2d'),
		init:function(){
			var self = this;
			self.initEditTool();
		},
		initEditTool:function(){
            var self = this;
            var canvasCon = $('#edit_canvas_con');

            var geData = gifEditor.data;
            var modeFunc = [self.drawLine,self.drawSLine,self.drawRect,self.drawCir,self.earse,self.preview,self.clip,self.choose];
            $('.edit-tool-con .js_tool').on('click',function(){
                $(this).siblings().removeClass('active');
                $(this).toggleClass('active');
                $(this).hasClass('active')?geData.setEditMode(parseInt($(this).attr('data-mode'))):geData.setEditMode(5);
                $('.paint-tool-con')[$('.paint-tool-switch').hasClass('active')?'addClass':'removeClass']('active');
            });
            canvasCon.on('mousedown',function(){
                var point = self.getPos();
                var mode = geData.getEditMode();
                self.o_ctx.strokeStyle = geData.getEditColor();
                geData.setEditStartPoint(point);

                mode==7?self.checkIn():geData.setEditSelectArea(false);

                canvasCon[0].addEventListener('mousemove',modeFunc[mode]);

                geData.getEditSelectIn()&&mode==7?null:self.p_canvas.addEventListener('mousemove',self.preview);
            })
            .on('mouseup',function(){
            	var point = self.getPos();
                var mode = geData.getEditMode();
                modeFunc[mode](0,point);
                canvasCon[0].removeEventListener('mousemove',modeFunc[mode]);
                geData.setEditPoints([]);

                self.p_canvas.removeEventListener('mousemove',self.preview);
        		mode==7?null:self.p_ctx.clearRect(0,0,self.p_canvas.width,self.p_canvas.height);
            })
            .on('mouseout',function(){
                var mode = geData.getEditMode();

                canvasCon[0].removeEventListener('mousemove',modeFunc[mode]);

                self.p_canvas.removeEventListener('mousemove',self.preview);
                mode==7?null:self.p_ctx.clearRect(0,0,self.p_canvas.width,self.p_canvas.height);
            });   
            $('.edit-btn-con .save').on('click',function(){
                var overlayImg = document.createElement('img');
                overlayImg.src = self.o_canvas.toDataURL({format:'png'});
                self.b_canvas.getContext('2d').drawImage(overlayImg,0,0);

                var uri = self.b_canvas.toDataURL({format:'jpg'});
                $('#cvs_frame_box img')[0].src = uri;
                gifEditor.logic.changeFrameSrc(0,uri);
                $('#frame_edit_modal').addClass('hide');
                $('#foot_frames_box .on').css('background-image','url('+uri+')');
            });
            ColorPicker(
                document.getElementById('palette_slide'),
                document.getElementById('palette_picker'),
                function(hex, hsv, rgb) {
                    $('.preview').css('background',hex);
                    geData.setEditColor(hex);
                });
        },
        drawLine:function(e){
            var self = gifEditor.edit;
            var points = gifEditor.data.getEditPoints();
            var ctx = self.o_ctx;
            points.push(self.getPos());
            if(points.length>=2){
                ctx.beginPath();
                ctx.moveTo(points[0].x,points[0].y);
                ctx.lineTo(points[1].x,points[1].y);
                ctx.stroke();
                ctx.closePath();
                points.shift();
            }
        },
        drawSLine:function(e,end){
            if(end){
                var self = gifEditor.edit;
                var start = gifEditor.data.getEditStartPoint();
                var ctx = self.o_ctx;
                ctx.beginPath();
                ctx.moveTo(start.x,start.y);
                ctx.lineTo(end.x,end.y);
                ctx.stroke();
                ctx.closePath();
            }
        },
        drawRect:function(e,end){
            if(end){
                var self = gifEditor.edit;
                var start = gifEditor.data.getEditStartPoint();
                var ctx = self.o_ctx;
                ctx.strokeRect(start.x,start.y,end.x-start.x,end.y-start.y);
            }
        },
        drawCir:function(e,end){
            if(end){
                var self = gifEditor.edit;
                var start = gifEditor.data.getEditStartPoint();
                var ctx = self.o_ctx;
                ctx.beginPath();
                ctx.arc(start.x,start.y,Math.abs(start.x-end.x),0,Math.PI*(2),false);
                ctx.stroke();
                ctx.closePath();
            }
        },
        earse:function(){
            var self = gifEditor.edit;
            var point = self.getPos();
            var ctx = self.o_ctx;
            ctx.clearRect(point.x,point.y,15,15);
        },
        preview:function(e){
        	var self = gifEditor.edit;
        	var geData = gifEditor.data;
        	var type = geData.getEditMode();
        	var start = gifEditor.data.getEditStartPoint();
        	var pos = self.getPos();
        	var preview_canvas = $('#frame_preview_canvas');
        	var ctx = self.p_ctx;
        	ctx.strokeStyle = '#333333';
        	ctx.clearRect(0,0,self.p_canvas.width,self.p_canvas.height);
        	switch(type)
        	{	
        		//直线
        		case 1:
	        		ctx.beginPath();
	        		ctx.moveTo(start.x,start.y);
	        		ctx.lineTo(pos.x,pos.y);
	        		ctx.stroke();
	        		ctx.closePath();
        		break;
        		//圆形
        		case 3:
	        		ctx.beginPath();
	        		ctx.arc(start.x,start.y,Math.abs(start.x-pos.x),0,Math.PI*(2),false);
	        		ctx.stroke();
	        		ctx.closePath();
        		break;
        		//剪裁与选择与矩形
        		case 2:
        		case 6:
        		case 7:
        			ctx.strokeRect(start.x,start.y,pos.x-start.x,pos.y-start.y);
        		break;
        	}
        },
        clip:function(e,end){
            if(end){
                if(confirm('确认要剪裁相应区域吗？')){
                    var self = gifEditor.edit;
                    var canvascon = $('#edit_canvas_con');
                    var start = gifEditor.data.getEditStartPoint();
                    var b_imgData = self.b_ctx.getImageData(start.x,start.y,end.x,end.y);
                    var o_imgData = self.o_ctx.getImageData(start.x,start.y,end.x,end.y);
                    var w = Math.abs(end.x-start.x);
                    var h = Math.abs(end.y-start.y);
                    self.b_canvas.width = w;
                    self.b_canvas.height = h;
                    self.o_canvas.width = w;
                    self.o_canvas.height = h;
                    self.p_canvas.width = w;
                    self.p_canvas.height = h;
                    canvascon.css({'height':h+'px','width':w+'px','margin-top':'-'+h/2+'px','margin-left':'-'+w/2+'px'});
                    self.b_ctx.putImageData(b_imgData,0,0);
                    self.o_ctx.putImageData(o_imgData,0,0);
                }
            }
        },
        choose:function(e,end){
            var self = gifEditor.edit;
            var geData = gifEditor.data;
            var point = self.getPos();
            var hasSelect = geData.getEditSelectArea();
            var inSelect = geData.getEditSelectIn();
            //当没有选区时，创建选区
            if(!hasSelect){
                if(end){
                    geData.setEditSelectArea([geData.getEditStartPoint(),end]);
                    console.log('generate select area');                    
                }
            }else{
                if(inSelect){
                    self.moveSelect(point,geData.getEditStartPoint(),end);                    
                }else if(end){
                    geData.setEditSelectArea([geData.getEditStartPoint(),end]);
                    console.log('change generate select area');                     
                }
            }
        },
        moveSelect:function(p,s,end){
            var self = gifEditor.edit;
            var geData = gifEditor.data;
            var area = geData.getEditSelectArea();
            var x = p.x-s.x;
            var y = p.y-s.y;
            var w = Math.abs(area[1].x-area[0].x);
            var h = Math.abs(area[1].y-area[0].y);
            var ax = Math.min(area[1].x,area[0].x);
            var ay = Math.min(area[1].y,area[0].y);
            var select_content = self.b_ctx.getImageData(ax,ay,w,h);
            self.p_ctx.clearRect(0,0,self.p_canvas.width,self.p_canvas.height);
            self.p_ctx.strokeRect(ax+x-1,ay+y,w+1,h);
            self.p_ctx.putImageData(select_content,ax+x,ay+y);
            if(end){
                geData.setEditSelectArea([{x:area[0].x+x,y:area[0].y+y},{x:area[1].x+x,y:area[1].y+y}]);     
                self.b_ctx.putImageData(select_content,ax+x,ay+y);
                self.b_ctx.clearRect(ax,ay,w,h);

                console.log('move generate select area');  
            }
        },
        checkIn:function(){
            console.log('check if the start point is in select area');
            var geData = gifEditor.data;
            var area = geData.getEditSelectArea();
            var p = geData.getEditStartPoint();
            if(area){
                console.log(!!(p.x>Math.min(area[0].x,area[1].x)&&p.y>Math.min(area[0].y,area[1].y)&&p.x<Math.max(area[0].x,area[1].x)&&p.y<Math.max(area[0].y,area[1].y)));

                !!(p.x>Math.min(area[0].x,area[1].x)&&p.y>Math.min(area[0].y,area[1].y)&&p.x<Math.max(area[0].x,area[1].x)&&p.y<Math.max(area[0].y,area[1].y))?geData.setEditSelectIn(true):geData.setEditSelectIn(false);
            }else{
                console.log('there is no select area');
                geData.setEditSelectIn(false);
            }
        },
        getPos:function(e){
            var canvas = $('#frame_background_canvas')[0];
            var e = window.event||e;
            var rect = canvas.getBoundingClientRect();
            var curX = e.clientX - rect.left;
            var curY = e.clientY - rect.top;
            return({x:curX,y:curY});
        }
	});
}(window, document))