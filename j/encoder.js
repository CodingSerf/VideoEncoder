/*!
 * Video Encoder for Web v1.0.0
 *
 * http://www.codingserf.com
 *
 * Date: 2013-09-29-12:25
 *
 * Author: David Li
 */
$(function(){
/***************************************everything launch***************************************/
(function(window){

window.VEC = (function(){
	var encoder = {
		extend: function() {
		    var modules, methods, key, i
		    
		    /* get list of modules */
		    modules = [].slice.call(arguments)
		    
		    /* get object with extensions */
		    methods = modules.pop()
		    
		    for (i = modules.length - 1; i >= 0; i--){
		    	if (modules[i]){
		    		for (key in methods){
		          		modules[i][key] = methods[key];
		    		}
		    	}
		        
		    }
		},
		getRandomColor: function(){
			return "#"+(Math.random()*0.16777215).toString(16).substring(3,9);
		}, 
		num2time: function(num){
			var time,
				num = parseFloat(num).toFixed(3),
				ms = parseInt(num*1000%1000),
				hour = parseInt(num/3600),
				minute = parseInt(num/60)-hour*60,
				second = parseInt(num)-minute*60-hour*3600;
			hour = hour.toString();
			//hour.length<2 && (hour = '0'+hour);
			minute = minute.toString();
			minute.length<2 && (minute = '0'+minute);
			second = second.toString();
			second.length<2 && (second = '0'+second);
			ms = ms.toString();
			ms.length<2 && (ms = '00'+ms);
			ms.length<3 && (ms = '0'+ms);
			time = hour+':'+minute+':'+second+'.'+ms;
			return time;
		}
	};
	return {Encoder:encoder};
})();


/*VEC Video Player*/
VEC.Encoder.VideoPlayer = (function(encoder){
	var vp,
		duration,
		$panel = $('body').layout('panel','center'),
		$container = $('#encoder-vpContainer'),
		$loading = $('#encoder-vpLoading'),
		$controls = $('#encoder-vpControls'),
		$video = $('#encoder-video'),
		$playBtn = $controls.find('#encoder-vpControls-playbtn'),
		$stopBtn = $controls.find('#encoder-vpControls-btn_stop'),
		$fastRewindBtn = $controls.find('#encoder-vpControls-btn_fastRewind'),
		$fastForwardBtn = $controls.find('#encoder-vpControls-btn_fastForward'),
		$volumeBtn = $controls.find('#encoder-vpControls-btn_volume'),
		$loopBtn = $controls.find('#encoder-vpControls-btn_loop'),
		$snapshotBtn = $controls.find('#encoder-vpControls-btn_snapshot'),
		$timeline = $controls.find('#encoder-vpControls-timeline'),
		$timelineBufferProgress = $controls.find('#encoder-vpControls-timelineBufferProgress'),
		$timelinePlayProgress = $controls.find('#encoder-vpControls-timelinePlayProgress'),
		$timelineHandle = $controls.find('#encoder-vpControls-timelineHandle'),
		$currentTime = $controls.find('#encoder-vpControls-curTime'),
		$duration = $controls.find('#encoder-vpControls-duration'),
		$volumeSlider = $controls.find('#encoder-vpControls-volumeSlider'),
		$volumeSliderHandle = $controls.find('#encoder-vpControls-volumeSliderHandle'),
		_video = $video[0],
		muteVolume = .49,
		isTimelineHandleMouseDown = false,
		isVolumeSliderHandleMouseDown = false,
		actualVPW = 600,
		actualVPH = 300,
		curVPW = actualVPW,
		curVPH = actualVPH,
		timeupdateCallbacks = [],
		loadedmetaCallbacks = [],
		init = function(paramObject){
			var src = paramObject.src || '',
				name = paramObject.name || 'Video Encoder for Web',
				id = paramObject.id;
			timelineUIUpdate($timelineBufferProgress,0);
			timelineUIUpdate($timelinePlayProgress,0);
			pause();
			$panel.panel('setTitle',name);
			_video.src = src;
		},
		isPaused = function(){
			return _video.paused;
		},
		play = function(){
			_video.playbackRate = 1;
			_video.play();
			$playBtn.addClass('encoder-vpControls-btn_pause');
		},
		pause = function(){
			_video.pause();
			$playBtn.removeClass('encoder-vpControls-btn_pause');
		},
		timelineUIUpdate = function($progress,percent){
			$progress.css({'width':percent*100+'%'});
		},
		setSize = function(w,h){
			curVPW = w;
			curVPH = h;
			$container.css({width: curVPW, height: curVPH});
		},
		getSize = function(){
			return {w: curVPW, h: curVPH};
		},
		getActualSize = function(){
			return {w:actualVPW, h: actualVPH};
		},
		setCurrentTime = function(time){
			_video.currentTime = time;
		},
		getCurrentSrc = function(){
			return _video.currentSrc;
		},
		addTimeupdateCallback = function(){
			var i,
				funs = [].slice.call(arguments);

			for (i = funs.length - 1; i >= 0; i--){
				timeupdateCallbacks.push(funs[i]);
			}
		},
		addLoadedmetaCallback = function(){
			var i,
				funs = [].slice.call(arguments);

			for (i = funs.length - 1; i >= 0; i--){
				loadedmetaCallbacks.push(funs[i]);
			}
		},
		getDuration = function(){
			return _video.duration.toFixed(3);
		};
	/*init vp state*/
	_video.volume = muteVolume;
	$video.on('loadedmetadata',function(event){
		var i;
		/*it's amazing*/
		actualVPW = _video.videoWidth;
		actualVPH = _video.videoHeight;
		setSize(actualVPW,actualVPH);
		$duration.text(encoder.num2time(_video.duration));
		for (i = loadedmetaCallbacks.length - 1; i >= 0; i--){
			loadedmetaCallbacks[i]();
		}
		$loading.hide();
	}).on('progress',function(event){
		if(_video.buffered.length){
			var percent = _video.buffered.end(_video.buffered.length-1) / _video.duration;
			timelineUIUpdate($timelineBufferProgress,percent);
		}
	}).on('timeupdate',function(event){
		var i
		, percent = _video.currentTime / _video.duration;
		timelineUIUpdate($timelinePlayProgress,percent);
		$currentTime.text(encoder.num2time(_video.currentTime));
		for (i = timeupdateCallbacks.length - 1; i >= 0; i--){
			timeupdateCallbacks[i]();
		}
	}).on('volumechange',function(event){
		var volume = _video.volume;
		$volumeBtn.attr('class','encoder-vpControls-btn');
		if(volume == 0.0){
			$volumeBtn.addClass('encoder-vpControls-btn_volume_mute');
		}
		if(volume>0.0 && volume<0.5){
			$volumeBtn.addClass('encoder-vpControls-btn_volume_low');
			muteVolume = volume;
		}
		if(volume>=0.5 && volume<=1.0){
			$volumeBtn.addClass('encoder-vpControls-btn_volume_loud');
			muteVolume = volume;
		}
		$volumeSliderHandle.css('left',volume*100+'%');
	}).on('ended',function(event){
		!_video.loop && pause();
	});
	/*init vp controls events*/
	$playBtn.on('click',function(event){
		_video.duration && (_video.paused ? play() : pause());
	});
	$stopBtn.on('click',function(event){
		_video.currentTime = 0;
		pause();
	});
	$fastRewindBtn.on('click',function(event){

		_video.playbackRate>0.2 && (_video.playbackRate -= 0.2);
	});
	$fastForwardBtn.on('click',function(event){
		_video.playbackRate += 0.2;
	});
	$volumeBtn.on('click',function(event){
		if(_video.muted){
			_video.volume = muteVolume;
			_video.muted = false;
		} else {
			_video.volume = 0;
			_video.muted = true;
		}
	});
	$volumeSliderHandle.on('mousedown',function(event){
		isVolumeSliderHandleMouseDown = true;
	});

	$loopBtn.on('click',function(event){
		if(_video.loop){
			_video.loop = false;
			$loopBtn.removeClass('encoder-vpControls-btn_loop_on')
		} else {
			_video.loop = true;
			$loopBtn.addClass('encoder-vpControls-btn_loop_on');
		}
	});
	$snapshotBtn.on('click',function(event){
		 $.messager.alert('Snapshot','Comming soon...');
	});
	$timelineHandle.on('mousedown',function(event){
		_video.duration && (isTimelineHandleMouseDown = true);
	});
	$timeline.on('click',function(event){
		var percent = (event.pageX - $timeline.offset().left)/$timeline.width();
			_video.duration && (_video.currentTime = percent * _video.duration);
	});
	$(document).on('mousemove',function(event){
		event.preventDefault();
		if(isTimelineHandleMouseDown){
			var timelineW = $timeline.width(),
				timelineH = 20,
				percent = (event.pageX - $timeline.offset().left)/timelineW;
			percent > 1 && (percent = 1);
			_video.duration && (_video.currentTime = percent * _video.duration);
		}
		if(isVolumeSliderHandleMouseDown){
			var volumeSliderW = 100,
				volumeSliderH = 10,
				percent = (event.pageX - $volumeSlider.offset().left)/volumeSliderW;
			(percent > 1) && (percent = 1.0);
			(percent < 0) && (percent = 0.0);
			_video.volume = percent;
		}
	}).on('mouseup',function(event){
		isTimelineHandleMouseDown = isVolumeSliderHandleMouseDown = false;
	});
	/*return vp 最小授权*/
	vp = {
		init: init,
		getCurrentSrc: getCurrentSrc,
		getSize: getSize,
		getActualSize: getActualSize,
		$loading: $loading,
		setSize: setSize,
		setCurrentTime: setCurrentTime,
		addTimeupdateCallback: addTimeupdateCallback,
		addLoadedmetaCallback: addLoadedmetaCallback,
		getDuration: getDuration
	};
	return vp;
})(VEC.Encoder);

/*VEC Menu Buttons*/
VEC.Encoder.MenuButton = (function(encoder){
	var mb,
		vp = encoder.VideoPlayer,
		$dragOpenZone = $('#encoder-hotspotsEditArea'),
		$menuProject = $('#encoder-siteSubmenu_project'),
		$localOpenFile = $menuProject.find('#encoder-menuBtn-localOpenFile'),
		initProject = function(file){
			var url;
			if(file.type !== 'video/mp4'){
				alert('Sorry, only support .mp4 file.');
				return false;
			} 
			url = vp.getCurrentSrc();
			url !== '' && window.URL.revokeObjectURL(url);
			url = window.URL.createObjectURL(file);
			vp.init({
				src: url,
				name: file.name
			});
		};

	/*menu events*/
	$localOpenFile.on('change',function(event){
		initProject(event.target.files[0]);
	});
	$dragOpenZone.on('dragover',function(event){
		event.stopPropagation();
   		event.preventDefault();
    	event.originalEvent.dataTransfer.dropEffect = 'copy'; 
	}).on('drop',function(event){
		event.stopPropagation();
	    event.preventDefault();
	    initProject(event.originalEvent.dataTransfer.files[0]);
	});

	return {};
})(VEC.Encoder);

/* VEC tools buttons*/
VEC.Encoder.Tools = (function(encoder){
	var tools,
		videoPlayer = encoder.VideoPlayer,
		encoderData = encoder.Data,
		$toolBtns = $('.encoder-toolBtn'),
		$pointerBtn = $toolBtns.filter('.encoder-toolBtn_pointer'),
		$rectBtn = $toolBtns.filter('.encoder-toolBtn_rect'),
		$circleBtn = $toolBtns.filter('.encoder-toolBtn_circle'),
		$polygonBtn = $toolBtns.filter('.encoder-toolBtn_polygon'),
		$showHotspotsBtn = $toolBtns.filter('.encoder-toolBtn_showHotspots'),
		$fillModeBtn = $toolBtns.filter('.encoder-toolBtn_fillMode'),
		$zoominBtn = $toolBtns.filter('.encoder-toolBtn_zoomin'),
		$zoomoutBtn = $toolBtns.filter('.encoder-toolBtn_zoomout'),
		$zoomactualBtn = $toolBtns.filter('.encoder-toolBtn_zoomactual'),
		$curToolBtn = $pointerBtn,
		$stage = $('#encoder-canvasStage'),
		_stage = $stage[0],
		stageActualSize = {w: 600, h: 300},
		stageRatio = 2,
		zoomStep = 5,
		moduleInited = false,

		stage = new createjs.Stage('encoder-canvasStage'),
		shapeEditHandle,
		rect,
		circle,
		polygon,/*目前不实现*/
		polygonPoints,
		shapeColor = {fill:'rgba(0,0,0,.5)',stroke:'rgba(0,0,0,1)'},
		toBeShape = 10,
		isFillMode = true,
		stageMouseLayer = new createjs.Shape(),
		shapesContainer = new createjs.Container(),
		mousedownPoint = new createjs.Point(0,0),

		operationType = 'pointer', /* pointer, draw */
		isDrawMousedown = false,
		isModifyMousedown = false,
		modifyType = 'move', /* move, lt, tm, rt, rm, rb, bm, lb, lm */
		shapeType = '', /* rect, circle, polygon */

		changeToolBtnState = function($btn,operaType){
			if($btn.hasClass('encoder-toolBtn_active')) return;
			operationType = operaType || 'pointer';

			if(operationType == 'pointer'){
				stageMouseLayer.cursor = 'default';
			} else {
				shapeEditHandle.isVisible && shapeEditHandle.hide();
				stageMouseLayer.cursor = 'crosshair';
				stage.update();
			}

			$curToolBtn.removeClass('encoder-toolBtn_active');
			$btn.addClass('encoder-toolBtn_active');
			$curToolBtn = $btn;
		},
		setZoomSize = function(zoomRatio){
			var curSize = videoPlayer.getSize(),
				w = parseInt(curSize.w*(100+zoomRatio)/100),
				h = parseInt(curSize.h*(100+zoomRatio)/100),
				curRatio = w/h;
			curRatio > stageRatio && (w -= 1);
			curRatio < stageRatio && (h -= 1);
			videoPlayer.setSize(w,h);
		},
		getShapeColor = function(){
			var r = parseInt(Math.random()*200)+50,
				g = parseInt(Math.random()*200)+50,
				b = parseInt(Math.random()*200)+50,
				fill = 'rgba('+r+','+g+','+b+',0.4)',
				border = 'rgba('+r+','+g+','+b+',0.008)',
				stroke = 'rgba('+r+','+g+','+b+',1)';
			return {fill: fill, border: border, stroke: stroke};
		},
		getShapeBounds = function(x,y){
			var width = x - mousedownPoint.x,
				height = y - mousedownPoint.y,
				x = width < 0 ? mousedownPoint.x+width : mousedownPoint.x,
				y = height < 0 ? mousedownPoint.y+height : mousedownPoint.y;
				width = Math.abs(width);
				height = Math.abs(height);
			return {x: x, y: y, w: width, h: height};
		},
		isInited = function(){
			moduleInited || $.messager.alert('提示','请选择[Project]>[Local Open/Web Open]来加载视频；或直接把视频文件拖进播放区域。');
			return moduleInited;
		},

		drawRectMousedownHandler = function(event){
			rect = new createjs.Shape();
			rect.x = mousedownPoint.x;
			rect.y = mousedownPoint.y;
			rect.graphics.setStrokeStyle(1).beginFill(isFillMode ? shapeColor.fill : shapeColor.border).beginStroke(shapeColor.stroke).drawRect(0,0, 1,1);
			shapesContainer.addChild(rect);
			rect.on('mousedown',function(event){
				operationType == 'pointer' && shapeEditHandle.show(event.currentTarget.getBounds());

				console.log('pointer down: ',event.currentTarget.getBounds());
			});
		},
		drawRectMousemoveHandler = function(event){
			rect.graphics.clear().setStrokeStyle(1).beginFill(isFillMode ? shapeColor.fill : shapeColor.border).beginStroke(shapeColor.stroke).drawRect(0,0, event.stageX-mousedownPoint.x,event.stageY-mousedownPoint.y);
		},
		drawRectMouseupHandler = function(event){
			var bounds = getShapeBounds(event.stageX, event.stageY);
			if(bounds.w<toBeShape && bounds.h<toBeShape){
				shapesContainer.removeChild(rect);
			}else{
				rect.setBounds(bounds.x,bounds.y,bounds.w,bounds.h);
				console.log('draw up: ',bounds);
			}
			rect.graphics.closePath().endStroke().endFill();
			isDrawMousedown = false;
		},
		drawCircleMousedownHandler = function(event){
			circle = new createjs.Shape();
			circle.x = mousedownPoint.x;
			circle.y = mousedownPoint.y;
			circle.graphics.clear().setStrokeStyle(1).beginFill(isFillMode ? shapeColor.fill : shapeColor.border).beginStroke(shapeColor.stroke).drawEllipse(0,0,1,1);
			shapesContainer.addChild(circle);
			circle.on('mousedown',function(event){
				operationType == 'pointer' && shapeEditHandle.show(event.currentTarget.getBounds());
			});
		},
		drawCircleMousemoveHandler = function(event){
			circle.graphics.clear().setStrokeStyle(1).beginFill(isFillMode ? shapeColor.fill : shapeColor.border).beginStroke(shapeColor.stroke).drawEllipse(0,0,event.stageX-mousedownPoint.x,event.stageY-mousedownPoint.y);
		},
		drawCircleMouseupHandler = function(event){
			var bounds = getShapeBounds(event.stageX, event.stageY);
			if(bounds.w<toBeShape && bounds.h<toBeShape){
				shapesContainer.removeChild(circle);
			}else{
				circle.setBounds(bounds.x,bounds.y,bounds.w,bounds.h);
			}
			circle.graphics.closePath().endStroke().endFill();
			isDrawMousedown = false;
		},
		drawPolygonMousedownHandler = function(event){
			polygonPoints = [mousedownPoint];
			polygon = new createjs.Shape();
			polygon.x = mousedownPoint.x;
			polygon.y = mousedownPoint.y;
			shapesContainer.addChild(polygon);
		},
		drawPolygonMousemoveHandler = function(event){
			var i,
				oldLocalPoint,
				length = polygonPoints.length,
				curLocalPoint = polygon.globalToLocal(event.stageX,event.stageY);
			polygon.graphics.clear().setStrokeStyle(1).beginFill(isFillMode ? shapeColor.fill : shapeColor.border).beginStroke(shapeColor.stroke).moveTo(0,0);
			for (i =  1; i < length; i++) {
				oldLocalPoint = polygon.globalToLocal(polygonPoints[i].x,polygonPoints[i].y);
				polygon.graphics.lineTo(oldLocalPoint.x,oldLocalPoint.y);
			};
			polygon.graphics.lineTo(curLocalPoint.x,curLocalPoint.y);
		},
		drawPolygonMouseupHandler = function(event){
			var globalPoint = new createjs.Point(event.stageX,event.stageY),
				localPoint = polygon.globalToLocal(globalPoint.x,globalPoint.y);
			if(Math.abs(localPoint.x)<toBeShape && Math.abs(localPoint.y)<toBeShape){
				if(polygonPoints.length === 1){
					shapesContainer.removeChild(polygon);
				}else{
					var i,
						oldLocalPoint,
						length = polygonPoints.length;
					polygon.graphics.closePath().endStroke().endFill();
					polygon.graphics.clear().setStrokeStyle(1).beginFill(isFillMode ? shapeColor.fill : shapeColor.border).beginStroke(shapeColor.stroke).moveTo(0,0);
					for (i =  1; i < length; i++) {
						oldLocalPoint = polygon.globalToLocal(polygonPoints[i].x,polygonPoints[i].y);
						polygon.graphics.lineTo(oldLocalPoint.x,oldLocalPoint.y);
					};
					polygon.graphics.lineTo(0,0).endFill().endStroke().closePath();
				}
				isDrawMousedown = false;
			}else{
				polygonPoints.push(globalPoint);
			}
		},
		ShapeEditHandle = function(){
			var handleW = 6,
				handles = {
					lt : null,
					tm : null,
					rt : null,
					rm : null,
					rb : null,
					bm : null,
					lb : null,
					lm : null,
					cc : null
				},
				container = new createjs.Container(),
				boundsRect = new createjs.Shape();

			container.addChild(boundsRect);
			boundsRect.cursor = 'move';
			for (var handle in handles) {
				if(handle !== 'cc'){
					handles[handle] = new createjs.Shape();
					handles[handle].graphics.setStrokeStyle(2).beginFill('#fff').beginStroke('#000').drawRect(0,0,handleW,handleW);
					handles[handle].on('mousedown',function(event){
						isModifyMousedown = true;
						modifyType = handle;
					});
					container.addChild(handles[handle]);
				}
			};
			handles.lt.cursor = handles.rb.cursor = 'nwse-resize';
			handles.tm.cursor = handles.bm.cursor = 'ns-resize';
			handles.rt.cursor = handles.lb.cursor = 'nesw-resize';
			handles.rm.cursor = handles.lm.cursor = 'ew-resize';


			handles.cc = new createjs.Shape();
			handles.cc.graphics.setStrokeStyle(2).beginFill('#fff').beginStroke('#000').drawCircle(0,0,handleW/2+1);
			container.addChild(handles.cc);
			container.visible = false;
			stage.addChild(container);

			this.isVisible = function(){
				return container.visible;
			};

			this.hide  = function(){
				container.visible = false;
			};
			this.show =function(bounds){
				var ox = handleW/2,
					x = bounds.x,
					y = bounds.y,
					w = bounds.width,
					h = bounds.height;
				container.x = x;
				container.y = y;
				boundsRect.graphics.clear().setStrokeStyle(.5).beginFill('rgba(0,0,0,.2)').beginStroke('#000').drawRect(0,0,w,h).moveTo(0,0).lineTo(w,h).moveTo(0,h).lineTo(w,0);
				handles.lt.x = -ox;
				handles.lt.y = -ox;
				handles.tm.x = w/2-ox;
				handles.tm.y = -ox;
				handles.rt.x = w-ox;
				handles.rt.y = -ox;
				handles.rm.x = w-ox;
				handles.rm.y = h/2-ox;
				handles.rb.x = w-ox;
				handles.rb.y = h-ox;
				handles.bm.x = w/2-ox;
				handles.bm.y = h-ox;
				handles.lb.x = -ox;
				handles.lb.y = h-ox;
				handles.lm.x = -ox;
				handles.lm.y = h/2-ox;
				handles.cc.x = w/2;
				handles.cc.y = h/2;

				container.visible = true;
				stage.update();
			};
		},
		clear = function(){
			/* 清理工作 */
			stage.removeAllChildren();
			stage.update();
		},

		init = function(){
			stageActualSize = videoPlayer.getActualSize();
			_stage.width = stageActualSize.w;
			_stage.height = stageActualSize.h;
			stageRatio = stageActualSize.w/stageActualSize.h;
			stageMouseLayer.x = stageMouseLayer.y = 0;
			stageMouseLayer.graphics.beginFill('rgba(0,0,0,0.01)').drawRect(0,0,stageActualSize.w,stageActualSize.h);
			stageMouseLayer.cursor = 'default';


			stage.addChild(stageMouseLayer);
			stage.addChild(shapesContainer);
			/* 	注意：ShapeEditHandle 初始化的位置，
				因为其在new的时候会添加到stage中，
				所以，为保证其在最上层要放到最后 
			*/
			shapeEditHandle = new ShapeEditHandle();
			stage.enableMouseOver();
			stage.mouseMoveOutside = false;
			stage.update();
			moduleInited = true;
		};




	stage.on('stagemousedown',function(event){
		if(operationType == 'draw'){
			if(!isDrawMousedown){
				shapeColor = getShapeColor();
				mousedownPoint.x = event.stageX-1;
				mousedownPoint.y = event.stageY-1;
				switch(shapeType){
					case 'rect':
						drawRectMousedownHandler(event);
						break;
					case 'circle':
						drawCircleMousedownHandler(event);
						break;
					case 'polygon':
						drawPolygonMousedownHandler(event);
						break;
					default:
						console.log('unknow mousedown shape');
						break;
				}
				isDrawMousedown = true;
				stage.update();
			}
		}
	});
	stage.on('stagemousemove',function(event){
		if(operationType == 'draw'){
			if(isDrawMousedown){
				switch(shapeType){
					case 'rect':
						drawRectMousemoveHandler(event);
						break;
					case 'circle':
						drawCircleMousemoveHandler(event);
						break;
					case 'polygon':
						drawPolygonMousemoveHandler(event);
						break;
					default:
						console.log('unknow mousemove shape');
						break;
				}
			}
			stage.update();
		}
	});
	stage.on('stagemouseup',function(event){
		if(operationType == 'draw'){
			if(isDrawMousedown){
				switch(shapeType){
					case 'rect':
						drawRectMouseupHandler(event);
						break;
					case 'circle':
						drawCircleMouseupHandler(event);
						break;
					case 'polygon':
						drawPolygonMouseupHandler(event);
						break;
					default:
						console.log('unknow mouseup shape');
						break;
				}
				stage.update();
			}
		}
	});



	$pointerBtn.on('click',function(event){
		changeToolBtnState($pointerBtn,'pointer');
	});
	$rectBtn.on('click',function(event){
		if(!isInited()) return;
		shapeType = 'rect';
		changeToolBtnState($rectBtn,'draw');
	});
	$circleBtn.on('click',function(event){
		if(!isInited()) return;
		shapeType = 'circle';
		changeToolBtnState($circleBtn,'draw');
	});
	$polygonBtn.on('click',function(event){
		if(!isInited()) return;
		shapeType = 'polygon'
		changeToolBtnState($polygonBtn,'draw');
	});
	$showHotspotsBtn.on('click',function(event){
		if($showHotspotsBtn.hasClass('encoder-toolBtn_showHotspots')){
			$showHotspotsBtn.removeClass('encoder-toolBtn_showHotspots').addClass('encoder-toolBtn_hideHotspots');
			$stage.hide();
		}else{
			$showHotspotsBtn.removeClass('encoder-toolBtn_hideHotspots').addClass('encoder-toolBtn_showHotspots');
			$stage.show();
		}
	});
	$fillModeBtn.on('click',function(event){
		if($fillModeBtn.hasClass('encoder-toolBtn_fillMode')){
			$fillModeBtn.removeClass('encoder-toolBtn_fillMode').addClass('encoder-toolBtn_borderMode');
			/* shapesContainer 中的图形全部重绘只有边框， 并且以后新添加的图形也只有边框*/
			isFillMode = false;
		}else{
			$fillModeBtn.removeClass('encoder-toolBtn_borderMode').addClass('encoder-toolBtn_fillMode');
			/* shapesContainer 中的图形全部重绘为填充模式， 并且以后新添加的图形也是填充模式*/
			isFillMode = true;
		}
	});
	$zoominBtn.on('click',function(event){
		setZoomSize(zoomStep);
	});
	$zoomoutBtn.on('click',function(event){
		setZoomSize(-zoomStep);
	});
	$zoomactualBtn.on('click',function(event){
		videoPlayer.setSize(stageActualSize.w, stageActualSize.h);
	});


	videoPlayer.addLoadedmetaCallback(init);

	tools = {

	};
	return tools;
})(VEC.Encoder);

VEC.Encoder.Data = (function(encoder){
	var data,
		projectList = [],
		sceneList = [],
		hotspotList = [],
		p3List = [],
		createProject = function(param){
			var project = {
				id: param.id || '',
				title: param.title || '',
				duration: param.duration || 0,
				width: param.width || 600,
				height: param.height || 300,
				lastSubmited: param.lastSubmited || $.now(),
				publishDate: param.publishDate || '',
				scenes: param.scenes || 0,
				hotspots: param.hotspots || 0,
				p3s: param.p3s || 0
			};
			projectList.push(project);
			return project;
		},
		createScene = function(){
			var scene = {
				id: param.id || '',
				title: param.title || '',
				startTime: param.startTime || 0,
				stopTime: param.stopTime || 0,
				duration: param.duration || 0,
				hotspots: param.hotspots || 0,
				p3s: param.p3s || 0,
				$scene: param.$scene || null
			};
			sceneList.push(scene);
			return scene;
		},
		createHotspot = function(param){
			var hotspot = {
				id: param.id || '',
				title: param.title || '',
				startTime: param.startTime || 0,
				stopTime: param.stopTime || 0,
				duration: param.duration || 0,
				shape: param.shape || 'rect',
				color: param.color || '#123',
				points: param.points || [],
				movements: param.movements || [],
				p3ID: param.p3ID,
				$hotspot: param.$hotspot || null
			};
			hotspotList.push(hotspot);
			return hotspot;
		},
		createP3 = function(param) {
			var p3 = {
				id: param.id || '',
				title: param.title || '',
				type: param.type || '',
				description: param.description || '',
				brand: param.brand || '',
				moreInfo: param.moreInfo || '',
				moreInfoURL: param.moarInfoURL || '',
				callToAction: param.callToAction || '',
				callToActionURL: param.callToActionURL || '',
				pic: param.pic || ''
			};
			return p3;
		},
		createMovement = function(param){
			var movement = {
				time: 0,
				x: 0,
				y: 0
			};
			return movement;
		},
		createPoint = function(param){
			var point = {
				x: 0,
				y: 0
			};
			return point;
		};
	//for debug
	projectList = [
		{videoName:'1福特锐界.mp4',videoID:'310086', videoSize:'1400×300'},
		{videoName:'5福特锐界.mp4',videoID:'610086', videoSize:'5400×300'},
		{videoName:'2福特锐界.mp4',videoID:'210086', videoSize:'6400×300'}
	];
	sceneList = [
		{title:'进入公路',startTime:'32.098', stopTime:'40.456'},
		{title:'福特锐界.mp4',startTime:'32.095', stopTime:'46.456'},
		{title:'福特锐界.mp4',startTime:'32.097', stopTime:'42.456'}
	];
	hotspotList = [
		{title:'进入公路',startTime:'32.098', stopTime:'40.456'},
		{title:'福特锐界.mp4',startTime:'32.095', stopTime:'46.456'},
		{title:'福特锐界.mp4',startTime:'32.097', stopTime:'42.456'}
	];
	data = {
		projectList: projectList,
		sceneList: sceneList,
		hotspotList: hotspotList
	};
	return data;

})(VEC.Encoder);

VEC.Encoder.Info = (function(encoder){
	var info,
		data = encoder.Data,
		$layoutEast = $('#encoder-layout_east'),
		$projectPropertyGrid = $('#encoder-projectPropertyGrid'),
		$scenePeropertyGrid = $('#encoder-scenePropertyGrid'),
		$hotspotPropertyGrid = $('#encoder-hotspotPropertyGrid'),
		$p3infoPropertyGrid = $('#encoder-p3PropertyGrid'),
		$projectListGrid = $('#encoder-projectListGrid'),
		$sceneListGrid = $('#encoder-sceneListGrid'),
		$hotspotListGrid = $('#encoder-hotspotListGrid'),
		$p3ListGrid = $('#encoder-p3ListGrid'),
		getPropertyChanges = function($propertygrid){
	        var s = '',
	        	rows = $propertygrid.propertygrid('getChanges');
	        for(var i=rows.length-1; i>=0; i--){
	            s += rows[i].name + ':' + rows[i].value + ',';
	        }
	        return s;
	    },
	    initPropertyGrid = function(param){
	    	var $pg = param.$pg,
	    		data = param.data;
	    	$pg.propertygrid({
				toolbar: [{
					iconCls: 'icon-save',
					text: 'Save Changes',
					handler: function(){
						var rows = getPropertyChanges($pg);
						alert('change: '+rows);
					}
				},'-',{
					iconCls: 'icon-delete',
					text: 'Delete Current',
					handler: function(){
						alert('delete item');
					}
				}],
				border: false,
				showGroup: true,
		    	scrollbarSize: 13,
		    	fitColumns: true,
		    	showHeader: false,
		    	fit: true,
		    	data: data
			});
	    },
	    initListGrid = function(param){
	    	var $lg = param.$lg,
	    		data = param.data,
	    		columns = param.columns;

	    	$lg.datagrid({
				striped: true,
				fit: true,
		    	scrollbarSize: 13,
				singleSelect: true,
				border: 0,
				fitColumns: true,/*
				rownumbers: true, */
				remoteSort: false,
				data: data,
			    columns: columns,
			    onSelect:function(rowIndex, rowData){
			    	console.log(rowData);
			    }
			});

	    };
    initPropertyGrid({
    	$pg: $projectPropertyGrid,
    	data: [
			{"name":"Video ID","value":" ", "group":"Editable Info","editor":"text"},
		    {"name":"Video Title","value":" ","group":"Editable Info","editor":"text"},
		    {"name":"Video Size","value":"600×300","group":"Base Info"},
		    {"name":"Video Duration","value":"0","group":"Base Info"},
		    {"name":"Last Submited","value":" ","group":"Base Info"},
		    {"name":"Publish Date","value":" ","group":"Base Info"},
		    {"name":"Hotspots","value":"0","group":"Base Info"},
		    {"name":"P3 Info","value":"0","group":"Base Info"}
		]
	});
	initPropertyGrid({
		$pg: $scenePeropertyGrid,
		data: [
		    {"name":"Scene Title","value":" ","group":"Editable Info","editor":"text"},
		    {"name":"Start Time","value":"00:00:00.000","group":"Editable Info","editor":"text"},
		    {"name":"Stop Time","value":"00:00:00.000","group":"Editable Info","editor":"text"},
		    {"name":"Hotspots","value":"0","group":"Base Info"},
		    {"name":"P3 Info","value":"0","group":"Base Info"},
		    {"name":"Duration","value":"0","group":"Base Info"}
		]
	});
	initPropertyGrid({
		$pg: $hotspotPropertyGrid,
		data: [
			{"name":"Hotspot Title","value":" ","group":"Editable Info","editor":"text"},
		    {"name":"Start Time","value":"00:00:00.000","group":"Editable Info","editor":"text"},
		    {"name":"Stop Time","value":"00:00:00.000","group":"Editable Info","editor":"text"},
		    {"name":"P3 Info","value":" ","group":"Editable Info","editor":"text"},
		    {"name":"Shape","value":"rect","group":"Base Info"},
		    {"name":"Duration","value":"0","group":"Base Info"}
		]
	});
	initListGrid({
		$lg: $projectListGrid,
		data: data.projectList,
	    columns:[[
	        {field:'videoID',title:'Video ID',width:90,sortable:true},
	        {field:'videoName',title:'Video Title',width:110,sortable:true},
	        {field:'lastSubmited',title:'Last Submited',width:120,sortable:true},
	        {field:'publishDate',title:'Publish Date',width:120,sortable:true}
	    ]]
	});
	initListGrid({
		$lg: $sceneListGrid,
		data: data.sceneList,
	    columns:[[
	        {field:'title',title:'Title',width:100,sortable:true},
	        {field:'startTime',title:'Start',width:100,sortable:true},
	        {field:'stopTime',title:'Stop',width:100,sortable:true}
	    ]]
	});
	initListGrid({
		$lg: $hotspotListGrid,
		data: data.hotspotList,
		columns:[[
	        {field:'title',title:'Title',width:100,sortable:true},
	        {field:'startTime',title:'Start',width:100,sortable:true},
	        {field:'stopTime',title:'Stop',width:100,sortable:true},
	        {field:'shape',title:'Shape',width:100,sortable:true}
	    ]]
	});

})(VEC.Encoder);

/* timeline */
VEC.Encoder.Timeline = (function(encoder){
	var timeline,
		videoPlayer = encoder.VideoPlayer,
		duration = 0,
		$timelineWrapper = $('#encoder-timelineWrapper'),
		$timelineContainer = $('#encoder-timelineContainer'),
		$timelineScale = $('#encoder-timeline-scale'),
		$timeline = $('#encoder-timeline'),
		$btnZoomIn = $('#encoder-timeline-btn_zoomIn'),
		$btnZoomOut = $('#encoder-timeline-btn_zoomOut'),
		$pointerWrapper = $('#encoder-timeline-pointerWrapper'),
		$pointerHandle = $('#encoder-timeline-pointerHandle'),
		_canvas = $('#encoder-timeline-scale-canvas')[0],
		canvasContext = _canvas.getContext('2d'),
		canvasBgImageData = (function(){
			/*get scale background image*/
			var i,
				x;
			canvasContext.strokeStyle = '#ffffff';
			canvasContext.lineWidth = 2;
			for(i=0;i<10;i++){
				x = i*10+1;
				canvasContext.moveTo(x,0);
				canvasContext.lineTo(x,5);
			}
			canvasContext.moveTo(1,0);
			canvasContext.lineTo(1,22);
			canvasContext.moveTo(51,0);
			canvasContext.lineTo(51,10);
			canvasContext.stroke();
			return canvasContext.getImageData(0,0,100,22);
		})(),
		screenWidth = window.screen.width,
		timelineScaleSteps = [.040, .080, .160, .320, .500, 1, 2, 5, 10, 20, 40, 80, 160, 320, 640, 1280] /* 16 levels*/,
		zoomLevel = 8,
		timelineScaleWidth = 2000,
		isPointerHandleMousedown = false,
		init = function(){
			duration = videoPlayer.getDuration();
			setScaleZoomLevel(8);
		},
		getScaleZoomLevel = function(){
			return zoomLevel;
		},
		setScaleZoomLevel = function(level){
			zoomLevel = level;
			var  scaleStep = timelineScaleSteps[zoomLevel]
			, seconds = ((Math.ceil(duration/scaleStep)+1)*scaleStep)
			, actualWidth = Math.ceil(seconds/scaleStep*100);
			actualWidth < screenWidth && (actualWidth = screenWidth);
			$timeline.width(actualWidth);
			scaleUpdateDraw($timelineContainer.scrollLeft());
		},
		scaleUpdateDraw = function(offsetX){
			var i
			, scaleStepX = 0
			, windowWidth = $(window).width()
			, scaleStep = timelineScaleSteps[getScaleZoomLevel()]
			, perOffsetX = -(offsetX % 100)
			, offsetStep = Math.floor(offsetX/100)
			, bgCount = Math.ceil(windowWidth/100)
			_canvas.width = windowWidth;

			canvasContext.fillStyle = '#ffffff';
			canvasContext.textAlign = 'start';
			canvasContext.textBaseline="top";

			for (i = 0; i <= bgCount; i++) {
				scaleStepX = perOffsetX+i*100;
				canvasContext.putImageData(canvasBgImageData,scaleStepX,0);
				canvasContext.fillText(encoder.num2time((offsetStep+i)*scaleStep),scaleStepX+4,9);
			}
		},
		timeupdate = function(){

		};
	/*设置*/
	$pointerHandle.on('mousedown',function(event){
		duration && (isPointerHandleMousedown = true);
	});
	$(document).on('mousemove',function(event){
		var pointerX = event.pageX;
		if(isPointerHandleMousedown){
			//event.pageX<=0 && (pointerX = 0);
			//event.pageX>=_canvas.width && (pointerX = _canvas.width);
			$pointerWrapper.css({left:pointerX-$timeline.offset().left})
		}
	}).on('mouseup',function(event){
		isPointerHandleMousedown = false;
	});
	$timelineContainer.on('scroll resize',function(event){
		scaleUpdateDraw($timelineContainer.scrollLeft());
	});
	$btnZoomOut.on('click',function(event){
		var curZoomLevel = getScaleZoomLevel()+1,
			tepsLength = timelineScaleSteps.length-1;
		if(curZoomLevel<=stepsLength){
			setScaleZoomLevel(curZoomLevel);
			curZoomLevel==stepsLength && $btnZoomOut.css({opacity:'.25'});
		}
		$btnZoomIn.attr('style','');
	});
	$btnZoomIn.on('click',function(event){
		var curZoomLevel = getScaleZoomLevel()-1;
		if(curZoomLevel>=0){
			setScaleZoomLevel(curZoomLevel);
			curZoomLevel == 0 && $btnZoomIn.css({opacity:'.25'});
		}
		$btnZoomOut.attr('style','');
	}).triggerHandler('click');
	$
	videoPlayer.addLoadedmetaCallback(init);

})(VEC.Encoder);


})(window);

/********************************everything end********************************/
});