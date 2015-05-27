(function($){

if ( !$ ) return;

$.fn.jk_fallin = function(opts){
	var options = $.extend({}, $.fn.jk_fallin.defaults, opts);
	var $this = this;
	
	return this.each(function(idx,o){
		var $cont = $(o);
		var $items = $cont.find(options.itemElem+':not(.default_item)');

		var gridWidth = getGridWidth();
		var gridHeight = getGridHeight();
		var containerWidth = $cont.width();

		// window resize 에 재실행.
		if ( !$cont.data('jk_fallin.initialized') ) {
			$cont.data('jk_fallin.initialized', true);
			$cont.data('jk_fallin.oldWidth', $cont.width());
			$(window).bind('resize.jk_fallin',function(){
				// 컨테이너 width가 기존과 다르면 실행.
				if ( $cont.data('jk_fallin.oldWidth') != $cont.width() ) {
					console.log ( '실행' );
					$cont.jk_fallin(options);
					$cont.data('jk_fallin.oldWidth', $cont.width() );
				}
			});
		}

		//css 설정
		$cont.css('position', 'relative');
		$items.css('position', 'absolute')

		//정사각형일때
		if ( options.type == 'square' ) {
			var mat = [];
			mat.push ( getEmptyRow(gridWidth , containerWidth) );

			$items.each(function(idx,o){
				var $item = $(o);
				//정렬 할 요소가 없으면 return;
				if ( !$item.length ) return;

				//현재 아이템이 matrix상 몇 칸을 차지 할 것인지 판단.
				var w = Math.ceil($item.width() / gridWidth); 
				var h = Math.ceil($item.height() / gridHeight);
				var tx, ty, isPos = false; //투입가능한 상태저장

				// matrix 첫번째 루프
				for ( var i = 0 ; i < mat.length ; i++ ) {
					// matrix 두번째 루프
					for ( var j = 0 ; j < mat[i].length ; j++ ){

						// 0을 발견 하고 item w 값이 length를 넘지 않으면. 투입가능하다.
						var chkW = mat[i][j] == 0 && j + w <= mat[i].length;
						// 중간에 1이 있는지 확인. 없으면 true 상태
						if ( chkW ) {
							var cnt = 0;
							for ( var k = j ; k < mat[i].length ; k++ ) {
								cnt++;
								if ( cnt <= w && mat[i][k] == 1 ) {chkW = false; break;}
							}
						}

						//W가 가능하면 H를 계산.
						if ( chkW ) {
							//현재 i가 matrix의 끝에 있거나 h값이 1일때는 투입가능하다.
							var chkH = i == mat.length-1 || h == 1;
							if ( !chkH ) {
								var bln = true;
								for ( k = i ; k < mat.length ; k++ ) {
									if ( mat[k][j] == 1 ) { bln = false; break;}
								};
								chkH = bln;
							}
						}

						//W와 H가 모두 가능하면 투입가능함.
						if ( chkW && chkH ) {
							isPos = true;
							break;
						}
					}
					// 투입가능하면 빠져나간다.
					if ( isPos ) break;
				}

				// 차지할 자리가 없으면 끝에 추가하기위한 변수 설정
				if ( !isPos ) {
					i = mat.length;
					j = 0;
				}

				// matrix에 추가.
				for ( var l = 0 ; l < w ; l++ ) {
					for ( var m = 0 ; m < h ; m++ ) {
						if ( !mat[m+i] ) mat.push(getEmptyRow(gridWidth,containerWidth));
						mat[i+m][j+l] = 1;
					}
				}

				$item.data({
					'jk_fallin.tx':j*(gridWidth+options.marginWidth) + getMarginValue(),
					'jk_fallin.ty':i*(gridHeight+options.marginHeight)
				});

				/*
				if (!du)$(this).stop().css({'left':j*tileWidth,'top':i*tileHeight});
				else $(this).stop().animate({'left':j*tileWidth,'top':i*tileHeight},{duration:du, easing:'easeInOutCubic'});
				*/

				//컨테이너 Height 컨트롤
				if ( options.contianerHeightControl ) {
					$cont.height( mat.length * (gridHeight+options.marginHeight)-options.marginHeight);
				}
			});
			// item each 끝.
		} // 정사각형 일때 끝.
		//직사각형일때
		else if ( options.type == 'rectangle' ) {
			var mat = getEmptyRow();

			$items.each(function(i,o){
				var $item = $(o);
				//target column 요소가 들어갈 자리.
				var tc = getMinIndex(mat);
				$item.data({
					'jk_fallin.tx':tc*(gridWidth+options.marginWidth) + getMarginValue(),
					'jk_fallin.ty':mat[tc]
				});
				mat[tc] += $item.outerHeight(true) + options.marginHeight;
			});

			if ( options.contianerHeightControl ) {
				$cont.height( getMaxValue(mat)-options.marginHeight );
			}
		}// 직사각형일 때 끝.

		moveItem();
		function moveItem(){
			$items.each(function(i,o){
				var $o = $(o);
				$o.stop().css({
					'left':$o.data('jk_fallin.tx'),
					'top':$o.data('jk_fallin.ty')
				})
			});
		}

		// 가로 최소단위
		function getGridWidth(){
			if ( options.itemWidth ) {
				return options.itemWidth;
			} else {
				var $defaultItem = $cont.find('.default_item');
				if ( $defaultItem.length ) {
					return $defaultItem.outerWidth();
				} else {
					var returnValue = Number.MAX_VALUE;
					$cont.find(options.itemElem).each(function(i,o){
						var ow = $(o).outerWidth();
						if ( ow < returnValue ) returnValue = ow;
					})
					return returnValue;
				}
			}
		}

		// 세로 최소단위
		function getGridHeight(){
			if ( options.itemHeight ) {
				return options.itemHeight;
			} else {
				var $defaultItem = $cont.find('.default_item');
				if ( $defaultItem.length ) {
					return $defaultItem.outerHeight();
				} else {
					var returnValue = Number.MAX_VALUE;
					$cont.find(options.itemElem).each(function(i,o){
						var ow = $(o).outerHeight();
						if ( ow < returnValue ) returnValue = ow;
					})
					return returnValue;
				}
			}
		}

		// matrix에 빈 Row를 넣기 위함.
		function getEmptyRow () {
			var arr = [];
			for ( var i = 0, t = getColNum() ; i < t ; i++ ) { arr.push(0); }
			return arr;
		}

		// array 데이터중 가장 작은 수를 가진 index를 리턴.
		function getMinIndex(arr){
			var c = Number.MAX_VALUE, r = 0, i, len;
			for ( i = 0, len = arr.length ; i < len ; i++ ) {
				if ( arr[i] < c ) {
					c = arr[i];
					r = i;
				}
			}
			return r;
		}

		function getMaxValue(arr){
			var r = Number.MIN_VALUE, i, len;
			for ( i = 0, len = arr.length ; i < len ; i++ ) {
				if ( arr[i] > r ) {
					r = arr[i];
				}
			}
			return r;
		}

		// 가로 column 개수를 리턴.
		function getColNum(){
			var colNum = Math.floor( ( containerWidth+options.marginWidth ) / ( gridWidth+options.marginWidth ) );
			if ( colNum > $items.length ) colNum = $items.length;
			return colNum;
		}

		// align으로 인한 left 추가값 계산 후 리턴.
		function getMarginValue(){
			//align 옵션에 의한 추가 x값
			var v = 0;
			var remainWidth = containerWidth-(getColNum()*(gridWidth+options.marginWidth)-options.marginWidth);
			if ( options.align == 'center' ) {
				v = remainWidth/2;
			} else if ( options.align == 'right' ) {
				v = remainWidth;
			}
			return v;
		}

	});
}

$.fn.jk_fallin.defaults = {
	type:'square', //'rectangle'
	itemWidth:0,
	itemHeight:0,
	itemElem:'> *',
	marginWidth:20,
	marginHeight:20,
	contianerHeightControl:true,
	align:'center',
	//나중에 모션 처리 할 것.
	skipFirstMotion:false,
	duration:300
}
/*
function Fallin(opts){
	var options = $.extend({}, this.defaultOptions, opts);
	console.log ( options );
	//var opts = $.extend({}, defaultOptions, $.type(options) === 'object' ? options : null);
}

Fallin.prototype = {
	'defaultOptions': {
		itemWidth:0,
		itemHeight:0,
		skipFirstMotion:false,
		duration:300
	}
}

var methods = {
	'init':function(options){
		
		this.data('jk_fallin.opts',opts);

		$(window).bind('resize.jk_fallin',function(){
			console.log(this);
			//this.jk_fallin('fallin');
		})
		return this;
	},
	'fallin':function(){
		console.log('fallin');
	},
	'reset':function(){
		//methods.init();
		console.log ( this.data('jk_fallin.opts') );



		return this;
	}
}

$.fn.jk_fallin = function(method) {
	if (methods[method]) {
		return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
	} else if (typeof method === 'object' || !method) {
		return methods.init.apply(this, arguments);
	} else {
		$.error('Method '+method+' does not exist on jQuery.jk_fallin');
	}
}
*/
})(jQuery);

function isIE8(){
	// IE8 버전체크 
	if ( navigator.userAgent ) {
		var tridentStr = navigator.userAgent.match(/Trident\/[\d\.]*/);
		if ( tridentStr ) {
			return Number( tridentStr.toString().replace('Trident/','') ) < 5;
		}
	} 
	return false;
}