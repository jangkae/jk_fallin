(function($){

if ( !$ ) return;
if ( !window.console ) console = {"log":function(){},"error":function(){}};

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

/** options list
 * type {String} 그리드(grid:default), 가로폭고정높이가변(fixedWidth)
 * gridWidth {Number} 가로 그리드 사용자 설정
 * gridHeight {Number} 세로 그리드 사용자 설정(정사각형 type에만 적용됨.)
 * itemSelector {String || jQuery object} 정렬시킬 엘리먼트 셀렉터
 * marginWidth {Number} 가로 여백 설정
 * marginHeight {Number} 세로 여백 설정
 * containerHeightControl {Boolean} 컨테이너의 height를 조작 할지 여부
 * align {String} 왼쪽(left), 오른쪽(right), 가운데(center) 정렬
 * skipInitMotion {Boolean} 최초실행시 애니메이션 없이 뿌려질지 여부
 * duration {Number} 애니메이션 러닝타임. 0이면 애니메이션 없이 정렬
 **/

var cls = {
	cont:'fallin_wrap',
	item:'fallin_item',
	ignore:'fallin_ignore',
	empty:'fallin_empty',
	adding:'fallin_adding',
	sizer:'fallin_sizer',
	added:'fallin_added_',
	remove:'fallin_remove_'
};

var tagStr = {
	empty:'<div class="'+cls.item+" "+cls.empty+" "+cls.ignore+'"></div>'
}

var defaultOptions = {
	type:'grid',
	itemSelector:'.'+cls.item,
	gridWidth:0,
	gridHeight:0,
	marginWidth:0,
	marginHeight:0,
	containerHeightControl:true,
	align:'center',
	easing:'easeOutCubic',
	skipFirstMotion:true,
	fillEmpty:false,
	duration:500
};

var indexCounter = 0;

window.Fallin = Fallin;
Fallin.defaultOptions = defaultOptions;

function Fallin(cont, opts){
	var _this = this, options;
	var $cont = (cont instanceof $) ? cont : $(cont);
	var $items, contWidth, gridWidth, gridHeight, colNum, mat, contHeight, alignMargin, timer, mWidth, mHeight, maxColNum;
	var id = indexCounter++;
	var emptyTileTimer;

	resetOptions(opts, true);

	$cont.find('.'+cls.sizer).css('visibility','hidden').hide();
	$cont.addClass(cls.cont).css('position','relative').find('> *').css('position','absolute');

	//resize 이벤트
	bindResize();

	var du = options.skipFirstMotion ? 0 : options.duration;
	activeFn(du);

	// public
	cont.fallinObj = this;

	this.append = append;
	this.removeElem = removeElem;
	this.resetOptions = resetOptions;


	this.activeFn = activeFn;
	this.getMatrix = getMatrix;
	this.unbindResize = unbindResize;
	this.fallinIdx = id;
	this.options = options;
	this.getOptions = getOptions;

	//테스트
	this.itemsMove = itemsMove;

	//옵션을 검사하고 변경한다.
	function resetOptions(opts, onlyData){
		options = $.extend({}, defaultOptions, opts);
		//타입 확인
		confirmOptions(options, defaultOptions);
		//데이터 확인
		if ( options.type == 'auto' ) options.type = getBrickType();
		else if ( options.type != 'fixedWidth' ) options.type = 'grid';
		if ( !$.easing[options.easing] ) options.easing = defaultOptions.easing;
		if ( options.duration <= 0 ) options.duration = defaultOptions.duration;

		//옵션에 의한 변수 설정
		mWidth = getMarginSize('width');
		mHeight = getMarginSize('height');

		if ( !onlyData ) activeFn();
	}

	function activeFn(du){
		//console.log ( 'activeFn' );
		if ( typeof du == 'undefined' ) du = options.duration;
		updateFallinVar();
		setTargetPosition();
		setContHeight(du);
		itemsMove(du);
		resetEmptyTile(du);
	}

	function setTargetPosition(){
		//console.log ( contWidth , gridWidth, gridHeight, colNum );
		//정사각형일때
		maxColNum = 0;
		if ( options.type == 'grid' ) {
			mat = [];
			mat.push ( getEmptyRow(gridWidth , contWidth) );

			$items.each(function(idx,o){
				var $item = $(o);
				//정렬 할 요소가 없으면 return;
				if ( !$item.length ) return;
				//현재 아이템이 matrix상 몇 칸을 차지 할 것인지 판단.
				var w = Math.ceil($item.outerWidth(true) / (gridWidth+mWidth) ); 
				var h = Math.ceil($item.outerHeight(true) / (gridHeight+mHeight));
				//console.log ( w , $item.outerWidth() , gridWidth );
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

				/*
				if ( idx == 0 ) {
					isPos = true;
					i = j = 0;
				}
				*/
				// 차지할 자리가 없으면 끝에 추가하기위한 변수 설정
				if ( !isPos ) {
					i = mat.length;
					j = 0;
				}

				// matrix에 추가.
				for ( l = 0 ; l < w ; l++ ) {
					for ( m = 0 ; m < h ; m++ ) {
						if ( !mat[m+i] ) mat.push(getEmptyRow(gridWidth,contWidth));
						mat[i+m][j+l] = 1;
					}
				}

				$item.data({
					'fallin.tx':j*(gridWidth+mWidth),
					'fallin.ty':i*(gridHeight+mHeight)
				});

				//정렬을 위한 가장 긴 column을 저장.
				if ( maxColNum < j+l ) maxColNum = j+l;

				//console.log ( $item.data() );
				//컨테이너 Height 컨트롤
				if ( options.containerHeightControl ) {
					contHeight = mat.length * (gridHeight+mHeight)-mHeight;
					//$cont.height( mat.length * (gridHeight+mHeight)-mHeight);
				}
			});
			// item each 끝.
		} // 정사각형 일때 끝.
		//직사각형일때
		else if ( options.type == 'fixedWidth' ) {
			mat = getEmptyRow();

			$items.each(function(i,o){
				var $item = $(o);
				//target column 요소가 들어갈 자리.
				var tc = getMinIndex(mat);
				$item.data({
					'fallin.tx':tc*(gridWidth+mWidth),
					'fallin.ty':mat[tc]
				});
				mat[tc] += $item.outerHeight(true) + mHeight;
				maxColNum = i;
			});

			maxColNum = Math.min(maxColNum+1,mat.length);
			
			if ( options.containerHeightControl ) {
				contHeight = getMaxValue(mat)-mHeight;
				//$cont.height( getMaxValue(mat)-mHeight );
			}
		}// 직사각형일 때 끝.

		alignMargin = getAlignMargin();
	}

	function itemsMove(du){
		$items.each(function(i,o){
			itemMove($(o),du);
		});
	}

	function itemMove($item, du) {
		$item.stop();
		var prop = {
			"left":$item.data('fallin.tx') + alignMargin,
			"top":$item.data('fallin.ty')
		};
		//위치가 같으면 return;
		if ( isSamePos(prop, $item.position()) ) return;
		if ( du ) {
			$item.animate(prop, {
				'easing':options.easing,
				'duration':du
			});
		} else {
			$item.css(prop);
		}
	}

	function setContHeight( du ){
		if ( !options.containerHeightControl || !contHeight ) return;
		var p = {'height':contHeight};
		if ( du ) {
			$cont.stop().animate(p, {
				'easing':options.easing,
				'duration':du
			});
		} else {
			$cont.stop().css(p);
		}
	}

	function append(dom, opts){
		var op = $.extend({},{
			/* from
			default : 제자리
			left : 왼쪽부터
			right : 오른쪽에서 부터
			end : 아이템중 마지막 다음부터
			element : 특정 엘리먼트 부터
			pos : 특정 좌표에서부터
			*/
			'from':'default',
			//from에 따른 선택적 사용
			'fromElem':null,
			'fromLeft':0,
			'fromTop':0,
			/* effect
			default : fadeIn과 scale함께
			fadeIn : fadeIn 만.
			*/
			'effect':'default',
			'duration':300
		},opts), fl, ft;

		//옵션 유효성 검사
		if ( op.from == 'element' ) {
			var te = op.fromElem;
			// fromElem 인데 html요소가 아니면 default로 고정
			if ( !te || !(te instanceof $||te.nodeName) ) {
				op.from = 'default';
			}
		}
		
		//등장효과 클래스 정의
		var effectClass = cls.added + op.effect;

		var $newItems = $(dom).css('position','absolute').addClass(cls.item);
		var du = 0, tx, ty, fo, co, delay;
		var $oldItem = $items;

		//등장방향
		if ( op.from != 'default' ) {
			du = op.duration;
			delay = op.delay;
		}

		$cont.append($newItems.css('visibility','hidden'));

		if ( delay ) {
			removeEmptyTile();
			updateFallinVar();
			setTargetPosition();
			setContHeight(du);
			$oldItem.each(function(i,o){
				itemMove($(o), du);
			});

			var newItemLength = $newItems.length;
			$newItems.each(function(i,o){
				var $o = $(o);
				setTimeout(function(){
					switch ( op.from ) {
						case 'left' :
						tx = 0;
						ty = $cont.height() + mHeight;
						break;
						case 'right' :
						tx = $cont.width() - getGridSize('height');
						ty = $cont.height() + mHeight;
						break;
						case 'end' :
						var to = $oldItem.eq(-1);
						tx = to.css('left');
						ty = to.css('top');
						break;
						case 'pos' :
						tx = op.fromLeft;
						ty = op.fromTop;
						break;
						case 'element' : 
						fo = $(op.fromElem).offset();
						co = $cont.offset();
						tx = fo.left - co.left;
						ty = fo.top - co.top;
						break;
						default :
						break;
					}
					$o.css({
						'left':tx,
						'top':ty,
						'visibility':'visible'
					}).addClass(effectClass);
					itemMove($o, du);
					if ( i == newItemLength - 1 ) resetEmptyTile(du);
				}, op.delay*i);
			});
		} else {
			$newItems.addClass(effectClass).css('visibility', 'visible');
			activeFn(du);
		}

	}
	
	function removeElem( $dom, effect ) {
		if ( !$dom ) return;
		if ( !effect ) effect = 'default';
		if ( $dom.constructor == String ) $dom = $cont.find($dom);
		if ( !($dom instanceof $) || !$dom.length ) return;

		var effectClass = cls.remove+effect;
		$dom.addClass(effectClass).addClass(cls.ignore);
		setTimeout( function(){
			$dom.remove();
		}, 300);
		activeFn();
	}
	
	function updateFallinVar(){
		$items = getItems();
		contWidth = $cont.width();
		gridWidth = getGridSize('width');
		gridHeight = getGridSize('height');
		colNum = getColNum();

		//console.log ( 'updateFallinVar' , $items, contWidth , gridWidth, gridHeight, colNum, alignMargin, mWidth, mHeight);
	}
	/*
		sqaure타입에서만 작동함. 빈 곳 채워넣기 기능.
	*/
	function resetEmptyTile(delay){
		removeEmptyTile();
		if ( !options.fillEmpty || options.type != 'grid' ) return;
		if ( emptyTileTimer ) clearTimeout(emptyTileTimer);
		if ( !delay ) fillEmptyTile();
		else emptyTileTimer = setTimeout(fillEmptyTile, delay);
	}

	function fillEmptyTile(){
		//옵션 설정 안하거나 square가 아니면 리턴.
		if ( !options.fillEmpty || options.type != 'grid' ) return;
		if ( emptyTileTimer ) clearTimeout(emptyTileTimer);

		var w = getGridSize('width')+mWidth;
		var h = getGridSize('height')+mHeight;
		
		for ( var i = 0, t = mat.length ; i < t ; i++ ) {
			for ( var j = 0, tt = mat[i].length ; j < tt ; j++ ) {
				if ( mat[i][j] != 1 ) {
					$cont.append($(tagStr.empty).css({
						'position':'absolute',
						'left':j*w+alignMargin,
						'top':i*h
					}));
				}
			}
		}
	}

	function removeEmptyTile(){
		//console.log ( $cont.find('.empty_item').length );
		$cont.find('.'+cls.empty).remove();
	}

	function bindResize(){
		$(window).bind('resize.fallin'+id,function(){
			if ( timer ) clearTimeout( timer );

			timer = setTimeout(function(){
				var changedContWidth = contWidth != $cont.width();
				var changedColNum = colNum != getColNum();
				var changedGridSize = gridWidth != getGridSize('width') || gridHeight != getGridSize('height');
				var isResetState = changedColNum || changedGridSize;

				//다른것은 변하지 않고 contWidth만 변경되면 container만 움직임. 아니면 activeFn
				if ( changedColNum || changedGridSize || (changedContWidth && options.align != 'left') ) activeFn();
			}, 30);

		});
	}

	function unbindResize(){
		$(window).unbind('resize.fallin'+id);
	}

	function getMatrix(){
		return mat;
	}

	//private methods
	function getColNum(){
		var cw = $cont.width(), mw = mWidth, gw = getGridSize('width');
		var colNum = Math.floor( ( cw+mw ) / ( gw+mw ) );
		if ( colNum < 1 ) colNum = 1;
		//if ( colNum > $items.length ) colNum = $items.length;
		return colNum;
	}

	function getEmptyRow(){
		var arr = [];
		for ( var i = 0, t = getColNum() ; i < t ; i++ ) { arr.push(0); }
		return arr;		
	}

	// align으로 인한 left 추가값 계산 후 리턴.
	function getAlignMargin(){
		var v = 0, cw = $cont.width(), mw = mWidth, gw = getGridSize('width'), cn = maxColNum ;
		//console.log ( cn );
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
		var optionAttr, method;

		if ( tar == 'height' ) {
			optionAttr = 'gridHeight';
			method = 'outerHeight';
		} else {
			optionAttr = 'gridWidth';
			method = 'outerWidth';
		}

		//options에 설정한 값이 있으면 return;
		if ( options[optionAttr] ) {
			return options[optionAttr];
		} else {
			var $sizerItem = $cont.find('.'+cls.sizer), returnValue=0;
			//사이즈 설정 엘리먼트가 있으면 item 크기를 return;
			if ( $sizerItem.length ) {
				$sizerItem.css('visibility','visible').show();
				returnValue = $sizerItem[method](true);
				$sizerItem.css('visibility','hidden').hide();
			} else { //설정된 값이 없으면 items중 가장작은 단위를 찾아 return;
				returnValue = Number.MAX_VALUE;
				getItems().each(function(i,o){
					var ow = $(o)[method](true);
					if ( ow >= 10 && ow < returnValue ) returnValue = ow;
				});
				//10픽셀 이하밖에 없거나 체크 불가 상황이면
				if ( returnValue == Number.MAX_VALUE || !returnValue ) returnValue = 100;
			}
			return returnValue;
		}
	}

	function getMarginSize(tar){
		var optionAttr, cssArr;

		if ( tar == 'height' ) {
			optionAttr = 'marginHeight';
			cssArr = ['marginTop', 'marginBottom'];
		} else {
			optionAttr = 'marginWidth';
			cssArr = ['marginLeft', 'marginRight'];
		}

		return options[optionAttr];
		/*
		if ( options[optionAttr] ) {
			return options[optionAttr];
		} else {
			var $sizerItem = $cont.find('.'+cls.sizer), $targetItem, rv = 0, cv;
			$targetItem = $sizerItem.length ? $sizerItem : getItems().eq(0);
			if ( !$targetItem.length ) return 0;
			$sizerItem.css('visibility','visible').show();
			for ( var i =0, t=cssArr.length; i < t; i++ ) {
				cv = parseInt($targetItem.css(cssArr[i]));
				if ( !isNaN(cv) ) rv += cv;		
			}
			$sizerItem.css('visibility','hidden').hide();
			return rv;
		}
		*/
	}

	// type 판별해서 return, 현재는 옵션만 리턴.
	function getBrickType(){
		var ow = 0, r = 'fixedWidth';
		getItems().each(function(i,o){
			var cw = $(o).outerWidth();
			if ( !i ) ow = cw
			else {
				if ( ow != cw ) {
					r = 'grid';
					return false;
				}
			}
		});
		return r;
	}
	
	function getItems(){
		return $cont.find(options.itemSelector).filter(':not(.'+cls.sizer+',.'+cls.ignore+')');
	}

	function getOptions(){
		return options;
	}
}

//left와 top을 비교하여 같으면 true 반환.
function isSamePos(o, t){
	if ( !o.left || !o.top || !t.left || !t.top ) return false;
	else if ( o.left == t.left && o.top == t.top ) return true;
	else return false;
}

//Utils
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

/*
옵션의 데이터타입을 검사하여 맞지 않을 경우 default의 데이터로 교체.
o : options
defaults : defaultOptions
*/

function confirmOptions( o, defaults, exceptionArr ) {
	for ( var n in defaults ) {
		if ( hasValue(n, exceptionArr) ) continue;
		var v = defaults[n];
		switch ( typeof v ) {
			case 'string':
			if ( typeof o[n] != 'string' ) {
				o[n] = v;
			}
			break;
			case 'number':
			if ( typeof o[n] != 'number' ) {
				if ( isNaN(o[n]) ) {
					o[n] = v;
				} else {
					o[n] = Number(o[n]);
				}
			} 
			break;
			case 'boolean':
			if ( typeof o[n] != 'boolean' ) {
				o[n] = Boolean(o[n]);
			}
			break;
			//case 'object':
			default:
			break;
		}
	}		
}

function hasValue(t, arr){
	var r = false, i, tn;
	if ( !arr || !(arr instanceof Array) || !arr.length ) return r;
	for ( i = 0, tn = arr.length ; i < tn ; i++ ) {
		if ( arr[i] == t ) {
			r = true;
			break;
		}
	}
	return r;
}

// jQuery 플러그인 등록.
var methods = {
	'init':function(opts){
		return this.each(function(i,o){
			o.fallinObj = new Fallin(o, opts);
		});
	},
	'append':function(dom, opts){
		return this.each(function(i,o){
			if ( !o.fallinObj ) return;
			o.fallinObj.append(dom, opts);
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
	},
	'getOptions':function(){
		return this[0].fallinObj.getOptions();
	},
	'getMatrix':function(){
		return this[0].fallinObj.getMatrix();	
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
		//constructor가 Object가 아니면 default로 진행.
		if ( dt && dt.constructor !== Object ) {
			console.error( 'fallin : options은 JSON 형태로 입력해주세요.');
			dt = null;
		}
		o.fallinObj = new Fallin(o, options);
	});

});

})(jQuery);

