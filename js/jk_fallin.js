$.fn.assemble = function(opts){
	if ( typeof gridNum == 'undefined' ) {
		chkLayout();
		return;
	}
	var defaultOpts = {
		du : null,
		cdu : null,
		eventDispatcher : '#container',
		tile:'> div:visible',
		minRow:0,
		tileWidth:null,
		tileHeight:null
		//gn:null
	}
	var $this = $(this);
	var opts = $.extend( {}, defaultOpts, opts);
	var delay = ie8 ? 5 : 0;
	var tileWidth = opts.tileWidth || window.tileWidth;
	var tileHeight = opts.tileHeight || window.tileHeight;

	if ( !delay ) init();
	else setTimeout( init, delay );

	function init() {
		$(opts.eventDispatcher).triggerHandler('assembleStart');
		if ( !$('#container').data('initialized') ) du = 0;
		else if ( !opts.du ) du = 500;
		if ( !opts.cdu ) cdu = 0;

		$this.each(function(i,o){
			if ( $(o).css('display') == 'none' ) return true;
			var $sec = $(this);
			var tw = $sec.outerWidth(true,true);
			var mat = [];
			mat.push (getEmptyColumn(tileWidth,tw));

			$sec.find(opts.tile).each(function(i,o){
				var w = Math.ceil($(this).width() / tileWidth);
				var h = Math.ceil($(this).height() / tileHeight);
				var tx, ty, isPos = false;

				for ( var i = 0 ; i < mat.length ; i++ ) {

					for ( var j = 0 ; j < mat[i].length ; j++ ){

						var chkW = mat[i][j] == 0 && j + w <= mat[i].length;
						if ( chkW ) {
							var cnt = 0;
							for ( var k = j ; k < mat[i].length ; k++ ) {
								cnt++;
								if ( cnt <= w && mat[i][k] == 1 ) {chkW = false; break;}
							}
						}

						if ( chkW ) {
							var chkH = i == mat.length-1 || h == 1;
							if ( !chkH ) {
								var bln = true;
								for ( k = i ; k < mat.length ; k++ ) {
									if ( mat[k][j] == 1 ) { bln = false; break;}
								};
								chkH = bln;
							}
						}

						if ( chkW && chkH ) {
							isPos = true;
							break;
						}
					}
					if ( isPos ) break;
				}

				if ( !isPos ) {
					i = mat.length;
					j = 0;
				}

				for ( var l = 0 ; l < w ; l++ ) {
					for ( var m = 0 ; m < h ; m++ ) {
						if ( !mat[m+i] ) mat.push(getEmptyColumn(tileWidth,tw));
						mat[i+m][j+l] = 1;
					}
				}

				if (!du)$(this).stop().css({'left':j*tileWidth,'top':i*tileHeight});
				else $(this).stop().animate({'left':j*tileWidth,'top':i*tileHeight},{duration:du, easing:'easeInOutCubic'});
				//trace ( mat );
			});

			if ( mat.length < opts.minRow ) {
				var loopNum = mat.length;
				for ( i = 0 ; i < opts.minRow-loopNum ; i++ ) {
					mat.push(getEmptyColumn(tileWidth,tw));
				}
			}

			if ( !cdu || !Math.min(cdu,du) ) $(this).height(mat.length*tileHeight), $(window).triggerHandler('resize.sort');
			else $(this).stop().animate({'height':mat.length*tileHeight}, {duration:Math.min(cdu,du),easing:'easeInOutCubic', complete:function(){$(window).triggerHandler('resize.sort');}});

			var emptyBlock = new Array(), minPos;
			for ( i = 0 ; i < mat.length ; i++ ) {
				for ( var j = 0 ; j < mat[i].length ; j++ ) {
					if ( mat[i][j] == 0 ) {
						if ( !minPos ) minPos = {y:i,x:j};
						emptyBlock.push({y:i,x:j});
					}
				}
			}
			$(o).data({'matrix':mat,'emptyBlock':emptyBlock,'du':du,'minPos':minPos});
		});
		if ( assembleTimer ) clearTimeout( assembleTimer );
		$(opts.eventDispatcher).triggerHandler('assembleAnimateStart');
		assembleTimer = setTimeout( function(){$(opts.eventDispatcher).triggerHandler('assembleComp');}, du||1);
	}

	function getEmptyColumn ( cw, tw ) {
		var arr = [];
		for ( var i = 0 ; i < Math.floor(tw/cw) ; i++ ) { arr.push(0); }
		return arr;
	}
}

function assemble2(du) {
	if ( typeof gridNum == 'undefined' || $('#container ._detail').length ) {chkGridNum(); return};
	var $tileContainer = $('#container ._feeds');
	var $tileArr = $tileContainer.find('.tile:visible');
	yChkArr = new Array();
	if ( !$('#container').data('assembleInit') ) du = 0;
	else if ( typeof du == 'undefined' ) du = 600;

	var animateOpts = { duration:du , easing:'easeInOutCubic' };
	for ( var i = 0 ; i < gridNum ; i++ ) yChkArr.push(0);
	$tileArr.each(function(i,o){
		var tg = yChkArr.minIndex();
		if ( $(o).has('.more').length ) tg = gridNum -1;
		var opts = {'top' : yChkArr[tg],'left' : tg*tileWidth,'opacity':1};
		if ( !du ) $(o).stop().css(opts);
		else $(o).stop().animate( opts, animateOpts );
		yChkArr[tg] += $(o).outerHeight(true);
	});

	var contOpts = {'height':yChkArr.max()+3,'width':gridNum*tileWidth-10};
	if ( !du ) $tileContainer.stop().css(contOpts);
	else $tileContainer.stop().animate(contOpts,animateOpts);
}