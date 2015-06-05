(function($){

if ( !$ ) return;

/** options list
 * type {String} 정사각형(square), 직사각형(rectangle), 자동판단(auto)
 * itemWidth {Number} 가로 그리드 사용자 설정
 * itemHeight {Number} 세로 그리드 사용자 설정(정사각형 type에만 적용됨.)
 * itemElem {String || jQuery object} 정렬시킬 엘리먼트 셀렉터
 * marginWidth {Number} 가로 여백 설정
 * marginHeight {Number} 세로 여백 설정
 * containerHeightControl {Boolean} 컨테이너의 height를 조작 할지 여부
 * align {String} 왼쪽(left), 오른쪽(right), 가운데(center) 정렬
 * skipInitMotion {Boolean} 최초실행시 애니메이션 없이 뿌려질지 여부
 * duration {Number} 애니메이션 러닝타임. 0이면 애니메이션 없이 정렬
 **/

var defaultOptions = {
	type:'square', //'rectangle'
	itemWidth:0,
	itemHeight:0,
	itemElem:'> *',
	marginWidth:10,
	marginHeight:10,
	containerHeightControl:true,
	align:'center',
	skipFirstMotion:true,
	duration:500
};

window.Fallin = Fallin;
Fallin.counter = 0;

function Fallin(wrap, opts){
	var _this = this;
	var options = $.extend({}, defaultOptions, opts);
	var $wrap = wrap instanceof $ ? wrap : $(wrap);
	var $cont = $('<div class="fallin_container" />');
	var $items, wrapWidth, gridWidth, gridHeight, colNum, mat;

	//초기 container 설정
	$wrap.addClass('fallin_wrap');
	if ( $wrap.find('> *').length ) $cont.append($wrap.find('> *')).appendTo($wrap);

	//css 설정
	$cont.css('position','relative');
	getItems().css('position','absolute');

	$(window).bind('resize.fallin',function(){
		var changedWrapWidth = wrapWidth != $wrap.width();
		var changedColNum = colNum != getColNum();
		var changedGridSize = gridWidth != getGridSize('width') || gridHeight != getGridSize('height');
		var isResetState = changedColNum || changedGridSize;

		//다른것은 변하지 않고 wrapWidth만 변경되면 container만 움직임. 아니면 activeFn
		if ( isResetState ) activeFn();
		else if ( changedWrapWidth && options.align != 'left' ) containerMove();
	});

	var du = options.skipFirstMotion ? 0 : options.duration;
	activeFn(du);

	// public
	wrap.fallinObj = this;

	this.activeFn = activeFn;
	this.append = append;
	this.resetOptions = resetOptions;
	this.getMetrix = getMetrix;
	
	//counter++
	Fallin.counter++;	

	function activeFn(du){
		console.log ( 'activeFn' );
		var contHeight;
		$items = $cont.find(options.itemElem+':not(.default_item)');
		wrapWidth = $wrap.width();
		gridWidth = getGridSize('width');
		gridHeight = getGridSize('height');
		colNum = getColNum();

		if ( typeof du == 'undefined' ) du = options.duration;

		//정사각형일때
		if ( options.type == 'square' ) {
			mat = [];
			mat.push ( getEmptyRow(gridWidth , wrapWidth) );

			$items.each(function(idx,o){
				var $item = $(o);
				//정렬 할 요소가 없으면 return;
				if ( !$item.length ) return;

				//현재 아이템이 matrix상 몇 칸을 차지 할 것인지 판단.
				var w = Math.ceil($item.width() / gridWidth); 
				var h = Math.ceil($item.height() / gridHeight);
				var tx, ty;
				var i, j, k, l, m, chkW, chkH, isPos = false;

				// matrix 첫번째 루프
				for ( i = 0 ; i < mat.length ; i++ ) {
					// matrix 두번째 루프
					for ( j = 0 ; j < mat[i].length ; j++ ){

						// 0을 발견 하고 item w 값이 length를 넘지 않으면. 투입가능하다.
						chkW = mat[i][j] === 0 && j + w <= mat[i].length;
						// 중간에 1이 있는지 확인. 없으면 true 상태
						if ( chkW ) {
							var cnt = 0;
							for ( k = j ; k < mat[i].length ; k++ ) {
								cnt++;
								if ( cnt <= w && mat[i][k] == 1 ) {chkW = false; break;}
							}
						}

						//W가 가능하면 H를 계산.
						if ( chkW ) {
							//현재 i가 matrix의 끝에 있거나 h값이 1일때는 투입가능하다.
							chkH = i == mat.length-1 || h == 1;
							if ( !chkH ) {
								var bln = true;
								for ( k = i ; k < mat.length ; k++ ) {
									if ( mat[k][j] == 1 ) { bln = false; break;}
								}
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
				for ( l = 0 ; l < w ; l++ ) {
					for ( m = 0 ; m < h ; m++ ) {
						if ( !mat[m+i] ) mat.push(getEmptyRow(gridWidth,wrapWidth));
						mat[i+m][j+l] = 1;
					}
				}

				$item.data({
					'fallin.tx':j*(gridWidth+options.marginWidth),
					'fallin.ty':i*(gridHeight+options.marginHeight)
				});

				//컨테이너 Height 컨트롤
				if ( options.containerHeightControl ) {
					contHeight = mat.length * (gridHeight+options.marginHeight)-options.marginHeight;
					//$cont.height( mat.length * (gridHeight+options.marginHeight)-options.marginHeight);
				}
			});
			// item each 끝.
		} // 정사각형 일때 끝.
		//직사각형일때
		else if ( options.type == 'rectangle' ) {
			mat = getEmptyRow();

			$items.each(function(i,o){
				var $item = $(o);
				//target column 요소가 들어갈 자리.
				var tc = getMinIndex(mat);
				$item.data({
					'fallin.tx':tc*(gridWidth+options.marginWidth),
					'fallin.ty':mat[tc]
				});
				mat[tc] += $item.outerHeight(true) + options.marginHeight;
			});

			if ( options.containerHeightControl ) {
				contHeight = getMaxValue(mat)-options.marginHeight;
				//$cont.height( getMaxValue(mat)-options.marginHeight );
			}
		}// 직사각형일 때 끝.

		containerMove(contHeight, du);

		$items.each(function(i,o){
			var $o = $(o).stop();
			var prop = {
				'left':$o.data('fallin.tx'),
				'top':$o.data('fallin.ty')
			};
			if ( du ) {
				$o.animate(prop, {
					'easing':'easeOutCubic',
					'duration':du
				});
			} else {
				$o.css(prop);
			}
		});

	}

	function containerMove( contHeight, du ){
		wrapWidth = $wrap.width();
		$cont.stop();
		var contProp = {
			'left':getMarginValue(),
			'width':getColNum()*(gridWidth+options.marginWidth)-options.marginWidth
		};
		if ( options.containerHeightControl && contHeight ) contProp.height = contHeight;
		if ( du ) {
			$cont.animate(contProp, {
				'easing':'easeOutCubic',
				'duration':du
			});
		} else {
			$cont.css(contProp);
		}
	}

	function append($dom, opts){
		var options = $.extend({},{
			'dir':null, // LT, LB, RT, RB or null = 제자리.
			'effect':'fadeIn',
			'fromElem':null // 방향설정 안하고 엘리먼트 위치부터. more버튼 같이.
		},opts), fl, ft;
		var $d = $($dom).addClass('fallin_added_fadeIn').css('position','absolute');
		$cont.append($d);
		activeFn(0);
		/*
		if ( typeof dom == 'string' ) dom = $(dom);
		var $f = $(options.fromElem);
		if ( $f.length ) {
			fl = $f.css('left');
			ft = $f.css('top');
		} else {
			var type = getBrickType();
			var lt, lb, rt, rb;
			switch( options.dir ) {
				case 'LB' : 

				break;
				default:
				fl = ft = 0;
				break;
			}
		}
		dom.css('visibility', false);
		$cont.append(dom);
		*/
	}

	function resetOptions(opts){
		options = $.extend({}, defaultOptions, opts);
		activeFn();
	}

	function getMetrix(){
		return mat;
	}

	//private methods
	function getColNum(){
		var cw = $wrap.width(), mw = options.marginWidth, gw = getGridSize('width');
		var colNum = Math.floor( ( cw+mw ) / ( gw+mw ) );
		if ( colNum > $items.length ) colNum = $items.length;
		return colNum;
	}

	function getEmptyRow(){
		var arr = [];
		for ( var i = 0, t = getColNum() ; i < t ; i++ ) { arr.push(0); }
		return arr;		
	}

	// align으로 인한 left 추가값 계산 후 리턴.
	function getMarginValue(){
		var v = 0, cw = $wrap.width(), mw = options.marginWidth, gw = getGridSize('width'), cn = getColNum() ;
		//remain width 계산
		var rw = cw-(cn*(gw+mw)-mw);
		if ( options.align == 'center' ) {
			v = rw/2;
		} else if ( options.align == 'right' ) {
			v = rw;
		}
		return v;		
	}

	//기본 grid 단위
	function getGridSize(tar){
		var optionAttr = 'itemWidth', method = 'outerWidth';

		if ( tar == 'height' ) {
			optionAttr = 'itemHeight';
			method = 'outerHeight';
		}
		if ( options[optionAttr] ) {
			return options[optionAttr];
		} else {
			var $defaultItem = $cont.find('.default_item');
			if ( $defaultItem.length ) {
				return $defaultItem[method]();
			} else {
				var returnValue = Number.MAX_VALUE;
				$cont.find(options.itemElem).each(function(i,o){
					var ow = $(o)[method]();
					if ( ow < returnValue ) returnValue = ow;
				});
				return returnValue;
			}
		}
	}

	// type 판별해서 return, 현재는 옵션만 리턴.
	function getBrickType(){
		return options.type;
	}
	
	function getItems(){
		return $cont.find(options.itemElem).filter(':not(.default_item)');
	}


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

//Utils
// array 데이터중 가장 큰 수를 리턴.
function getMaxValue(arr){
	var r = Number.MIN_VALUE, i, len;
	for ( i = 0, len = arr.length ; i < len ; i++ ) {
		if ( arr[i] > r ) {
			r = arr[i];
		}
	}
	return r;
}

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

// jQuery 플러그인 등록.
var methods = {
	'init':function(opts){
		return this.each(function(i,o){
			o.fallinObj = new Fallin(o, opts);
		});
	},
	'append':function(dom){
		return this.each(function(i,o){
			if ( !o.fallinObj ) return;
			o.fallinObj.append(dom);
		});
	},
	'resetOptions':function(opts){
		return this.each(function(i,o){
			if ( !o.fallinObj ) return;
			o.fallinObj.resetOptions(opts);
		});
	},
	'getFallinObject':function(){
		if ( this.length == 1 ) return this[0].fallinObj;
		else if ( this.length > 1 ) {
			var arr = [];
			this.each(function(i,o){
				arr.push ( o.fallinObj );
			});
			return arr;
		} else return false;
	}
};

$.fn.fallin = function(method) {
	if (methods[method]) {
		return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
	} else if (typeof method === 'object' || !method) {
		return methods.init.apply(this, arguments);
	} else {
		$.error('Method '+method+' does not exist on jquery.fallin');
	}
};

//html 설정
$(function(){

	$('.fallin_wrap').each(function(i,o){
		var dt = $(o).data('fallin-options'), options;
		//constructor가 Object 형식이 아니면 default로 진행.
		if ( dt.constructor !== Object ) {
			console.error( 'fallin : options은 JSON 형태로 입력해주세요.')
			dt = null;
		}
		o.fallinObj = new Fallin(o, options);
	});

});

//기본사용 easing
if ( !$.easing.easeOutCubic ) {
	$.extend( $.easing, {
		easeInCubic: function (x, t, b, c, d) {
			return c*(t/=d)*t*t + b;
		},
		easeOutCubic: function (x, t, b, c, d) {
			return c*((t=t/d-1)*t*t + 1) + b;
		},
		easeInOutCubic: function (x, t, b, c, d) {
			if ((t/=d/2) < 1) return c/2*t*t*t + b;
			return c/2*((t-=2)*t*t + 2) + b;
		}
	});
}

})(jQuery);

