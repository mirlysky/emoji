function cropper(obj,w){
	var _ = {
		data:{
			width:w||40,
			parent:{
				obj:obj,
				width:obj.width(),
				height:obj.height()
			},
			prevPos:{
				top: 0,
				left: 0,
				bottom: obj.height(),
				right: obj.width()
			},
			//暂存鼠标位置
			mpos:{
				x0:0,
				y0:0,
				x1:0,
				y1:0
			},
			curbd:'',
			//边框对css属性映射
			bdRelation:{
				left:'left',
				top:'top',
				bottom:'top',
				right:'left'					
			},
			init: function(){
				const w = _.data.parent.obj.width();
				const h = _.data.parent.obj.height();
				_.data.prevPos = {
					top: 0,
					left: 0,
					bottom: h,
					right: w					
				}
				_.data.parent.width = w;
				_.data.parent.height = h;
				console.log(_.data);
			}
		},
		ui:{
			insertBorder: function(){
				const w = _.data.width/2;
				const borderHTML = `<div class='_lt_clip_preview_area' style='left:`+_.data.prevPos.left+`px;top:`+_.data.prevPos.top+`px;right:`+(_.data.parent.width-_.data.prevPos.right)+`px;bottom:`+(_.data.parent.height-_.data.prevPos.bottom)+`px;'></div>
									<div class='_lt_clip_border vertical'  style='width:`+_.data.width+`px;left:`+(_.data.prevPos.left-w)+`px' data-bd='left'></div>
									<div class='_lt_clip_border horizonal' style='height:`+_.data.width+`px;top:`+(_.data.prevPos.top-w)+`px' data-bd='top'></div>
									<div class='_lt_clip_border vertical'  style='width:`+_.data.width+`px;left:`+(_.data.prevPos.right-w)+`px' data-bd='right'></div>
									<div class='_lt_clip_border horizonal' style='height:`+_.data.width+`px;top:`+(_.data.prevPos.bottom-w)+`px' data-bd='bottom'></div>`;
				_.data.parent.obj.append(borderHTML);
			},
			bindEvent: function(){
				_.data.parent.obj.on('mousedown','._lt_clip_border',function(e){
					_.data.curbd = $(e.target).data('bd');
					_.logic.setMousePos(e.offsetX,e.offsetY,'start');
					$(this).get(0).addEventListener('mousemove',_.logic.borderMove,false);})
				.on('mouseup mouseout','._lt_clip_border',function(e){
					_.logic.initMpos();
					$(this).get(0).removeEventListener('mousemove',_.logic.borderMove,false);});					
			},
			render: function(border){
				border.css(_.data.bdRelation[_.data.curbd],(_.data.prevPos[_.data.curbd]-_.data.width/2)+'px');
				_.data.parent.obj.find('._lt_clip_preview_area').css({'left':_.data.prevPos.left+'px','top':_.data.prevPos.top+'px','right':(_.data.parent.width-_.data.prevPos.right)+'px','bottom':(_.data.parent.height-_.data.prevPos.bottom)+'px'});
			}
		},
		logic:{
			setMousePos: function(x,y,flag){
				if(flag==='start'){
					_.data.mpos.x0 = x;
					_.data.mpos.y0 = y;					
				}else{
					_.data.mpos.x1 = x;
					_.data.mpos.y1 = y;
				}
			},
			updatePrevPos: function(bd){
				const tmpX = _.data.mpos.x1 - _.data.mpos.x0;
				const tmpY = _.data.mpos.y1 - _.data.mpos.y0;
				let tmp = (bd=='left'||bd=='right')?_.logic.validateBorderPos(_.data.parent.width,_.data.prevPos[bd]+tmpX):_.logic.validateBorderPos(_.data.parent.height,_.data.prevPos[bd]+tmpY);
				// console.log('鼠标移动距离',tmpX,tmpY,bd,tmp);
				_.data.prevPos[bd] = tmp;
			},
			//检查边框是否在容器中
			validateBorderPos: function(max,val){
				if(val<0){
					return 0;
				}else if(val>max){
					return max;
				}else{
					return val;
				}
			},
			borderMove: function(e){
				_.logic.setMousePos(e.offsetX,e.offsetY,'end');
				_.logic.updatePrevPos(_.data.curbd);
				_.ui.render($(e.target));
			},
			initMpos: function(){
				_.data.mpos = {x0:0,y0:0,x1:0,y1:0}					
			}
		},
		init: function(){
			_.ui.insertBorder();
			_.ui.bindEvent();
		},
		resize: function(){
			_.data.parent.obj.empty();
			_.data.init();
			_.ui.insertBorder();
		},
		getData: function(){
			return _.data.prevPos;
		}
	}
	return _;
}
