# Fallin

HTML 요소를 그리드에 맞게 자동으로 정렬해주는 jQuery 플러그인 입니다.


## 설치하기


## 실행하기
### javascript로 실행
````javascript
//Native
var fo = new Fallin(container, {options});

//jQuery
$(container).fallin({options});
````

### html 속성으로 실행
컨테이너가 될 요소에 클래스를 "fallin_wrap"으로 지정 해주면 실행 됩니다.
````html
...
<div class="fallin_wrap" data-fallin-options='{options}'>
	/* .fallin_sizer는 요소의 사이즈를 체크하는 용도 입니다. 화면에 표시되지 않습니다. */
	<item class="fallin_sizer fallin_item"></item>
	<item class="fallin_item"></item>
	<item class="fallin_item"></item>
	<item class="fallin_item"></item>
	...
</div>
...
````

## Options
### type:String
정렬시킬 그리드 타입을 설정합니다.
기본값 : "grid"

* "grid" : 바둑판 형식의 그리드 기준으로 정렬합니다.
* "fixedWidth" : 폭(width) 고정, 높이(height) 가변 기준으로 정렬합니다. 가로만 그리드가 적용 되며 grid타입보다 연산이 적습니다.
* "auto" : 정렬시킬 item의 width값을 기준으로 grid와 fixedWidth중 적절한 타입으로 자동 판단합니다.

### itemSelector:String
정렬시킬 요소를 선택할 jQuery 셀렉터 입니다.
기본값 : ".fallin_item"

### itemWidth:Number
그리드의 폭(width)을 설정합니다.
최소값 : 10 (최소값 이하로 설정되어 있으면 정렬시킬 요소의 width값으로 설정됩니다.)
기본값 : 0

### itemHeight:Number
그리드의 높이(height)을 설정합니다.
최소값 : 10 (최소값 이하로 설정되어 있으면 정렬시킬 요소의 height값으로 설정됩니다.)
기본값 : 0

### marginWidth:Number
그리드의 가로 여백을 설정합니다.
기본값 : 0

### marginHeight:Number
그리드의 세로 여백을 설정합니다.
기본값 : 0

### containerHeightControl:Boolean
Fallin이 컨테이너의 높이값을 조작할 것 인지 여부를 설정합니다.
기본값 : true

### align:String
정렬 방향을 설정합니다.
기본값 : center

* "center"
* "left"
* "right"

### easing:String
정렬시 움직임의 easing 값을 설정합니다. jquery.easing 패키지에 등록되어 있는 easing값을 사용할 수 있습니다. fallin내부에는 아래의 목록이 등록되어 있습니다.
기본값 : easeOutCubic

* "linear"
* "swing"
* "easeOutCubic"
* "easeInCubic"
* "easeInOutCubic"

### duration:Number
정렬시 움직임의 시간을 밀리세컨드(ms) 단위로 설정합니다.
기본값 : 500

### skipFirstMotion:Boolean
처음 실행시 모션을 skip합니다.
기본값 : true

### fillEmpty:Boolean
type이 grid시에 빈 영역에 요소를 채워 넣을지 여부.
기본값 : false


## Methods
### activeFn(duration)
요소를 정렬시킵니다.

### append(dom, {options})
요소를 추가하고 재정렬 시킵니다.

### removeElem(selector)
요소를 삭제하고 재정렬 시킵니다.

### resetOptions({options}, onlyData)
option을 재 설정하고 재정렬 시킵니다.














