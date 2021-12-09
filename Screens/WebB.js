import React, {Component} from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Keyboard,
    Image,
    TouchableHighlight,
    ActivityIndicator,
    ScrollView,
    Dimensions,
    html 
} from "react-native";
import cheerio from 'cheerio'
import {WebView} from "react-native-webview";
import Slider from '@react-native-community/slider';
import * as Speech from 'expo-speech';
//ㅋㅋㅋ
// 아이콘
import { AntDesign } from '@expo/vector-icons';
import arrowBackIcon from '../assets/arrow_back.png';
import arrowNextIcon from '../assets/arrow_next.png';
import webIcon from '../assets/web.png';
import refreshIcon from '../assets/refresh_page.png';
import incognitoIcon from '../assets/incognito.png';
// 테스트
import TextStore from '../stores/TextStore'
import { observer} from 'mobx-react'

// keeps the reference to the browser ... 이건 역할이 뭐지
let browserRef = null;

// 브라우저 첫화면 주소. 옵션으로 지정 가능하게. 랜덤/지정.
// 현재는 나무위키
//const url = 'https://namu.wiki/w/%EB%82%98%EB%AC%B4%EC%9C%84%ED%82%A4';

// 여러 검색엔진용 코드 있지만 생략해버림
const searchEngines = {
    'google': (uri) => `https://www.google.com/search?q=${uri}`
};


// 주소로 개떡같이 입력해도 알아서 수정해주고, 규격외면 입력내용으로 구글검색.
function upgradeURL(uri, searchEngine = 'google') {
    const isURL = uri.split(' ').length === 1 && uri.includes('.');
    if (isURL) {
        if (!uri.startsWith('http')) {
            return 'https://www.' + uri;
        }
        return uri;
    }
    const encodedURI = encodeURI(uri);
    return searchEngines[searchEngine](encodedURI);
}

// javascript to inject into the window 뭔진 몰라도 냅두자...
const injectedJavaScript = `
      window.ReactNativeWebView.postMessage('injected javascript works!');
      true; // note: this is required, or you'll sometimes get silent failures   
`;

//비밀모드 관련 코드가 있음. 건들기 귀찮으니 걍 비밀모드 버튼 없애자.

// 모벡스를 사용할 클래스의 바로 윗줄에 옵져버 데코레이터를 붙인다.
@observer
class Browser extends Component {
    state = {
        //웹뷰의 스테이트
        homeUrl:'https://namu.wiki/w/%EB%82%98%EB%AC%B4%EC%9C%84%ED%82%A4',
        currentURL: 'https://namu.wiki/w/%EB%82%98%EB%AC%B4%EC%9C%84%ED%82%A4',
        title: '',
        canGoForward: false,
        canGoBack: false,
        incognito: false,
        // change configurations so the user can
        // better control the browser
        config: {
            detectorTypes: 'all',
            allowStorage: true,
            allowJavascript: true,
            allowCookies: true,
            allowLocation: true,
            allowCaching: true,
            defaultSearchEngine: 'google'
        },

        //여기서부터 텍스트에서 가져온것.
        isLoading: true,
        Url:'https://namu.wiki/w/%EB%82%98%EB%AC%B4%EC%9C%84%ED%82%A4',
        
		//요소마다 { 인덱스0 : { "챕터1제목", "챕터1문장전체"}, 인덱스1 : { }와 같은 리스트가 될 예정
		wiki : {},
		// { 인덱스1 : {풋노트_스트링:[1],텍스트:"주석의텍스트"}, 인덱스2:{}...}과 같은 리스트가 될 예정.
		footnote_data : {},
		//...위의 둘을 담은 리스트를 getAxios(Url)을 통해서 리턴 받는다.

		wiki_data : {},
        content_index : 0, // 제목 포함한 본문 요소들의 순번용
		footnote_index  : 1, // 여러 챕터 전체에 걸친 주석과 연결될 번호. [1] 부터 시작이니 초기값은 1로.
		// 아니다...본문 이전에 주석이 등장하는 경우 [1]부터 시작이 아닐 수 있다.
		// 이걸 적절한 초기값으로 주는게 핵심인가?
		// 문장을 [풋노트_인덱스]포함여부로 주석여부를 체크한다...만약 본문이[3]부터 시작한다면, [1]로 검색하니 
		// 주석이 없다고 생각한다...그러니 본문을 검색해서 [1]이 있나 체크하고 있다면 패스...없다면 풋노트인덱스++하고 재검색,
		// 없으면 다시 재검색...반복해서 적절한 풋노트인덱스를 찾은 뒤에 이를 반환하는 식을 만들어야 한다.
		know_footnote_index : false,

		// 읽기관련 변수
		TextToSpeech : '', //읽을 최종 결과물
		selectedVoice : '', 
		language : 'ko-KR',
		//이거 최초 값이 있던가???
		speechRate : TextStore.speechRate,
		speechPitch : TextStore.speechPitch,
		isPlaying : false,

		// 읽기관련 좌표 변수
		index_of_wiki : 0,
		chapter_length : 0,
		content_length : 0,
		chapter_reading : 0,
		content_reading : 0,
		object_length : 0
		
    };



    //앞으로, 뒤로, 새로고침 기능 함수. 내버려두자.
    goForward = () => {
        if (browserRef && this.state.canGoForward) {
            browserRef.goForward();
        }    };
    goBack = () => {
        if (browserRef && this.state.canGoBack) {
            browserRef.goBack();
        }    };
    reload = () => {
        if (browserRef) {
            browserRef.reload();
        }    };

    // set the reference for the browser
    setBrowserRef = (browser) => {
        if (!browserRef) {
            browserRef = browser
        }    };

    // called when there is an error in the browser
    onBrowserError = (syntheticEvent) => {
        const {nativeEvent} = syntheticEvent;
        console.warn('WebView error: ', nativeEvent)
    };

    // 웹뷰가 로드되거나 페이지가 로드된 경우의 시행함수들.
    // 현재상태를 반영한 상태값[앞뒤이동가능여부, 타이틀]을 스테이트에 덮씌.
    onBrowserLoad = (syntheticEvent) => {
        const { canGoForward, canGoBack, title} = syntheticEvent.nativeEvent;
        this.setState({
            canGoForward,
            canGoBack,
            title
        })
    };
    onNavigationStateChange = (navState) => {
        const {canGoForward, canGoBack, title} = navState;
        this.setState({
            canGoForward,
            canGoBack,
            title
        })    
    };

    // 원래 위의 네비게이션스테이트체인지를 통해서 주소변경을 감지하지만 어쩌선지 안되서 이걸로 대신 댐빵....
    onLoadProgress = (syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        TextStore.UrlForFetching(nativeEvent.url)
        if (nativeEvent.url){
            if (!(nativeEvent.url == this.state.Url)) {
				console.log("주소차이 발생 감지")
				console.log('주소변경 감지. 변경된 주소는 : ' + nativeEvent.url + 
				"스테이트에 저장된 Url 변수는 : " + this.state.Url)

				const Url = nativeEvent.url
				this.getDataFromUrl(nativeEvent.url)
				this.setState({
					Url : nativeEvent.url, 
					content_index : 0, 
					footnote_index : 1,
					chapter_reading : 0,
					content_reading : 0,
					isPlaying:false
				})
				Speech.stop()
				//읽기 지표 초기화 및 재생 중지
				
            }
        }
    }
    
    filterRequest = (request) => {
        return true;
    };

    // called when the browser sends a message using "window.ReactNativeWebView.postMessage"
    onBrowserMessage = (event) => {
        console.log('*'.repeat(10));
        console.log('Got message from the browser:', event.nativeEvent.data);
        console.log('*'.repeat(10));
    };

    // 페이지 로딩 후 자료처리 구간
    componentDidMount() {
		//스테이트의 Url을 상수로 받아서 전 함수에서 사용할 인수로 공용처리하려는 듯.
        const {Url} = this.state
		this.getDataFromUrl(Url)
    }


    getDataFromUrl = async (Url) => {
		var wiki_footnote_array = await this.getAxios(Url) // [제목, 컨텐츠]들로 이뤄진 자료를 반환.
		var wiki = wiki_footnote_array[0]
		var footnote_data = wiki_footnote_array[1]
		console.log("위키와 풋노트데이터 작업완료.")
		this.setState({wiki:wiki})
		this.setState({footnote_data:footnote_data}) 
		
		var wiki_data = await this.getWikiData(0)
		this.setState({wiki_data : wiki_data})
		this.setState({chapter_length : Object.keys(wiki).length})
		console.log(Object.keys(wiki).length)
		console.log("위키데이터와 위키렝스 작업완료.")
		this.setState({isLoading: false}) // 할 거 다 했으니 로딩 완료. 화면 출력.
	}

    getAxios = async (Url) => {
        const response = await fetch(Url);   // fetch page
        const htmlString = await response.text() // get response text 
        const $ = cheerio.load(htmlString);           // parse HTML string
		var wiki = {}          
		



        // ======이후 옵션의 체크에 따라서 적용이 될지 안될지를 결정하게 만들자======
        $(".wiki-macro-toc").remove()  //목차제거. 
        $('.wiki-edit-section').remove() // 항목별로 있는 [편집] 제거
        $('.wiki-folding').remove() // 테이블이 있는 경우 [펼치기,접기] 제거
        $('.wiki-table').remove() // 테이블 자체를 제거하는 코드. 이후 옵션으로 만들자.
		// ==================================================================
		
		//=============================사전에 주석처리========================================
		//=============================사전에 주석처리========================================
		//=============================사전에 주석처리========================================
		// 데이터 구조 돌입하기 전에 미리 주석에 대한 정리가 필요.
		// 다음과 같을 것이다. {1 : { footnote_string: [1], text : "텍스트" }  }		
		var footnote_data = {}
		// $(".footnote-list").each(function (index, element) {
		// 	console.log($(element).text())
		// })
		$(".footnote-list").each(function (index, element) {
			var index_plus = index + 1
			var index_string = '[' + String(index+1) + ']' // [1]
			
			var index_n_text = $(element).text() // [1] 이 당시에는 셀리카도 FR이었다.
			var footnote_text = index_n_text.split(index_string)[1] // "이 당시에는 셀리카도 FR이었다."
			
			footnote_data[index_plus] = { footnote_string : index_string , text : footnote_text}
		})
		//=============================사전에 주석처리========================================
		//=============================사전에 주석처리========================================
		//=============================사전에 주석처리========================================

		$(".w").children().filter('.wiki-heading').each(function (index, element) {
			wiki[index] = ['','']
			wiki[index][0] = ($(element).text())
			})
			$(".w").children().filter('.wiki-heading-content').each(function (index, element) {
			wiki[index][1] = ($(element).text())
		})

		//this.setState({footnote_data:footnote_data, wiki:wiki})
		return [wiki, footnote_data]
	}
    getWikiData = async (chapter_index) =>{
		var wiki = this.state.wiki
		var footnote_data = this.state.footnote_data
		var wiki_data = this.state.wiki_data
		var content_index = 0

		//while (index_of_wiki < 8){
		//for (var index_of_wiki=0; index_of_wiki<4; index_of_wiki++){
		console.log(chapter_index + "이 현재의 인덱스오브위키[=챕터]")

		var element_wiki = wiki[chapter_index]
		// 인덱스오브위키는 위키 내부에 [제목, 본문]으로 이뤄진 챕터들 중 몇번째인지를 의미. 
		
		wiki_data[chapter_index] = {[content_index] : {type : "heading", text : element_wiki[0] }} 
		// 초기값은 0챕터 안에 0번째 요소로 제목타입의 "제목텍스트"가 들어옴.
		content_index ++

		// 의도대로라면 위키데이터 = { 0[번째챕터]: { 0[번째요소값] : { 타입:제목, 텍스트:"내용"}, ??? }} 이 된다. 이제 본문을 다루며 뒤의 ???를 채워나간다.
		
		// 옵션으로 적용여부를 정하게.
		element_wiki[1] = element_wiki[1].replace(/[一-龥]/ig,'')
		
		//만약 본문에 말줄임표가 있다면 .. 으로. 그걸 다시 . 으로 줄이게. 더하여 특유의 말줄임표기 (...)도 생략하는 과정을 추가
		while (element_wiki[1].includes("(...)")){
			element_wiki[1] = element_wiki[1].replace("(...)", "")
		}
		while (element_wiki[1].includes("...")){
			element_wiki[1] = element_wiki[1].replace("...", ".")
		}
		while (element_wiki[1].includes("..")){
			element_wiki[1] = element_wiki[1].replace("..", ".")
		}

		// 한 챕터의 내용의 문장들을 . 을 기준으로 나눠서 어레이화.
		var array_of_contents = element_wiki[1].split(".")
		// . 을 기준으로 챕터를 나누면 마지막 문장의 ~~. 도 취급되서 마지막에 빈 텍스트가 오브젝트로 들어가게됨. 이를 삭제
		array_of_contents.pop() 
		
		// 이제 위 어레이의 각 요소[=문장]마다 주석여부를 체크.
		var reg = /[[0-9]*]/
		//console.log(footnote_data)



		for (var index_array_of_contents = 0; index_array_of_contents <array_of_contents.length; index_array_of_contents++){
			// . 으로 나눠진 요소들[문장]의 어레이오브컨텐츠. 0부터 시작하는 인덱스와 크기비교하며 반복.
			var element_array = array_of_contents[index_array_of_contents]
			// 어레이의 요소[하나의문장]. 몇번째 문장 하나를 지칭.

			var after_footnote = "" // 한 문장에 여러 주석이 있는 경우 뒤에 남는 문장도 다시 여러번 자르는 과정 필요. 이때 돌려가며 사용될 변수
			
			
			if (!this.state.know_footnote_index){
				//만약 주석번호아니?가 거짓이면...이는 첫 주석을 찾았을때 참을 반환케하여 그때부턴 작동 안하게 할것임
				if (reg.test(element_array)){
					//[숫자]정규식으로 문장 하나하나를 분석한다....
					var test1 = element_array.match(reg)[0]
					// 문장을 정규식으로 분석하여 일치한 놈들의 리스트의 첫번째놈을 test1이라 정한다.
					test1 = new String(test1)
					test1.replace("[","")
					test1.replace("]","")					
					var test2 = parseInt(test1[1])
					//괄호를 제거하여 숫자만 반환하게 다듬고 숫자로 취급하게 만든다.
					this.state = {footnote_index : parseInt(test1[1])}
					this.state = {know_footnote_index : true}
					//this.setState({footnote_index : test1})
					//this.setState({know_footnote_index : true})
					//주석번호아니?가 참이된다...이 반복은 멈춘다. 그리고 풋노트_인덱스에는 문장을 뒤지던 중 처음 발견한[숫자]의 숫자대입
					console.log("풋노트인덱스는.." + this.state.footnote_index)
					console.log(test2)
					console.log(this.state.know_footnote_index)
					//4와 5를 반환한다....이제 스테이트에 참거짓 변수하나 놓고, 거짓상태면 매번 이짓하게 하자..
				}

				//console.log("풋노트인덱스는.." + this.state.footnote_index)
			}
			var footnote_index = this.state.footnote_index // 전 챕터에 걸쳐 있을 주석에 대한 번호. [1]부터 시작해야하니 최초값 1
			var footnote_string = "["+String(footnote_index)+"]" // 최초의 경우에는 "[1]"
			console.log(footnote_index)
			var footnote_text = footnote_data[footnote_index].text //풋노트_데이터에 주석자료들...이걸 위키_데이터에 적절한 위치에 삽입


			//만약 문장에 [1]이 없다면 주석없는 문장이니 통채로 오브젝트화하여 반영. 반복문 처음으로 되돌아감.
			if (!element_array.includes(footnote_string)){
				wiki_data[chapter_index][content_index] = {type : "sentence", text : element_array}
				content_index ++
				continue
			} else {
			}
			//위의 컨티뉴가 발동 안함 = 주석이 있는 문장의 경우 반복문 
			while (element_array.includes(footnote_string)){
				wiki_data[chapter_index][content_index] = { type: "footnote", text : footnote_text}
				footnote_index ++ // 이걸로 풋노트스트링도 변하면서 자동으로 [2]에 맞춘 루프구문이 시행될까...? 
				// ㅇㅇ 된다.
				content_index ++ // 주석도 컨텐츠의 번호 대상이니 추가해준다.
				var split_sentnece = element_array.split(footnote_string) // 주석을 기준으로 문장을 나눈다. 
				//"그는 / [1] / 언제나[2] 그래왔다."
				after_footnote = split_sentnece[1] // 더이상 주석이 없을 때까지 계속 돌려질 값. 
				element_array = split_sentnece[1] // 이제 뒤에 남은 문장이 체크대상이 된다. 
				//[2]가 포함되었는지 체크하고 그를 기준으로 전자를 오브젝트화 및 병합한다.
				//다룰 대상이 "언제나 / [2] / 그래왔다" 로 바뀌게 된다.
				//추가된 번호를 스테이트에 업뎃. 주석이 포함된 한문장이 완료되서 다음 문장을 다룰때마다 초기에 이 스테이트값을 가져와서 대입함으로서 증가된 번호를 매 문장마다 반영.
				this.setState({footnote_index : footnote_index}) 
			}
			// 컨티뉴 통과했으니 주석이 있는 문장인데 위의 주석 체크조건문도 통과했으면 남는 건 주석있는 문장의 마지막 텍스트다.
			if (after_footnote !== '' || '.') { // 문장 마지막 주석 뒤에 마침표가 아닌 텍스트 내용이 있다면...
				wiki_data[chapter_index][content_index] = { type : "sentence", text : after_footnote}
				content_index++
			} 
		}
		console.log("챕터 하나 완결하고 위키_데이터로 반환")
        return wiki_data
	}

    //===========================버튼 처리 구간==============================================
	//===========================버튼 처리 구간==============================================
	//===========================버튼 처리 구간==============================================
    play = (chapter_reading, content_reading) => {
		if (!this.state.isPlaying){
			this.setState({isPlaying:true})	
			Speech.stop()
			console.log("재생버튼 작동함. 챕터길이는 " + this.state.chapter_length)
			if (this.state.chapter_length == 0){
				console.log("챕터길이가 0이니 아래에서 브레이크")
				return false
			} 
			Speech.speak(
				this.state.wiki_data[chapter_reading][content_reading].text, {
					rate : TextStore.speechRate, 
					pitch: TextStore.speechPitch,
					voice: TextStore.selectedVoice,
					onDone : this.play_next
				}
		)
		} else {
			this.setState({isPlaying:false})	
			Speech.stop()
		}
	}

	play_next = async () => {
		var content_reading = this.state.content_reading + 1 // 초기값은 1
		var chapter_reading = this.state.chapter_reading	// 초기값은 0
		// 챕터길이는 위키데이터 모집하면서 구해놨으니 현재 읽는 챕터의 컨텐츠 길이를 구한다.
		var content_length = Object.keys(this.state.wiki_data[chapter_reading]).length
		console.log(content_length)
		// 만약 읽을 컨텐츠 번호가 컨텐츠 길이보다 길다면...이때 컨텐츠길이는 숫자 그자체이지만 리딩번호는 0부터 시작하니 맞추기 위해서 후자에 -1
		if (content_reading > content_length - 1){
			// 컨텐츠번호를 초기화시키고, 챕터번호를 + 1 시켜라
			console.log(content_reading + "은 컨텐츠리딩이 더 크다..." + content_length + " -1 보다... 그러니 0으로 리셋하고 " + chapter_reading + "을 ++")
			content_reading = 0
			chapter_reading ++
		}
		// 만약 챕터의 길이까지도 총 챕터의 길이를 넘는다면...
		if (chapter_reading > this.state.chapter_length){
			//챕터 번호를 초기화시키고 이를 업데이트한 다음에 재생과정을 브레이크해라.
			chapter_reading = 0
			this.setState({chapter_reading : chapter_reading, content_reading : content_reading})
			return false
		}

		//만약 챕터번호가 원래의 챕터번호와 달라졌다면...새로운 챕터번호에 해당하는 위키의 챕터 데이터를 해석하게 함수시행.
		if (!(chapter_reading == this.state.chapter_reading) ){
			console.log("챕터 바뀐 상황")
			var wiki_data = await this.getWikiData(chapter_reading)
			this.setState({wiki_data:wiki_data})
			content_reading = 0
			this.setState({chapter_reading : chapter_reading, content_reading : content_reading})
		}
		
		this.setState({chapter_reading : chapter_reading, content_reading : content_reading})
		console.log("스피크 하기 직전의 챕터리딩과 콘텐츠리딩은 " + chapter_reading + "과 " + content_reading)
		if (this.state.isPlaying){
			Speech.speak(
				this.state.wiki_data[chapter_reading][content_reading].text, 
				{	
					rate : TextStore.speechRate, 
					pitch: TextStore.speechPitch,
					voice: TextStore.selectedVoice,
					onDone : this.play_next
				}
			)
		}
	}
	play_before = async () => {
		var content_reading = this.state.content_reading - 1 
		var chapter_reading = this.state.chapter_reading	
		// 만약 현재 컨텐츠리딩이 0이라면 현재 챕터가 0인지 체크. 0이면 씹는다. 아니라면 이전의 챕터로 가라...
		if (content_reading < 0){
			if (chapter_reading == 0){
				return false
			}
			content_reading = 0
			chapter_reading --
			var wiki_data = await this.getWikiData(chapter_reading)
			this.setState({wiki_data:wiki_data})
			//this.setState({chapter_reading : chapter_reading, content_reading : content_reading})
		}

		this.setState({chapter_reading : chapter_reading, content_reading : content_reading})
		if (this.state.isPlaying){
			Speech.speak(
				this.state.wiki_data[chapter_reading][content_reading].text, 
				{	
					rate : TextStore.speechRate, 
					pitch: TextStore.speechPitch,
					voice: TextStore.selectedVoice,
					onDone : this.play_next
				}
			)
		}
	}

	pause = () => { 
		Speech.stop()
	}
	resume = () => {
		Speech.speak(
			this.state.wiki_data[this.state.chapter_reading][this.state.content_reading].text, {
				rate : this.state.speechRate, onDone : this.play_next
			})
	}

	next_content = () => {
		Speech.stop()
		this.play_next()
	}
	before_content = () => {
		Speech.stop()
		this.play_before()
	}
	next_chapter = async () => {
		Speech.stop()
		//현재의 챕터를 확인하고, 전체 챕터의 길이와 비교해서 다음이 있다면 챕터바꾸고 컨텐츠번호는 0으로 초기화하면서 플레이.
		var chapter_reading = this.state.chapter_reading + 1
		if (chapter_reading + 1 > this.state.chapter_length){
			//챕터 번호를 초기화시키고 이를 업데이트한 다음에 재생과정을 브레이크해라.
			chapter_reading = chapter_reading - 1
			Alert.alert("마지막 챕터", "현재의 챕터가 마지막 챕터입니다.")
			return false
		}
		console.log("다음챕터 버튼 눌러서 챕터 바뀜")
		var wiki_data = await this.getWikiData(chapter_reading)
		this.setState({wiki_data:wiki_data})
		this.setState({chapter_reading : chapter_reading, content_reading : 0})
		//this.play(chapter_reading, 0)
		if (this.state.isPlaying){
		Speech.speak(
			this.state.wiki_data[chapter_reading][0].text, 
			{
				rate : TextStore.speechRate, 
				pitch: TextStore.speechPitch,
				voice: TextStore.selectedVoice,
				onDone : this.play_next
			})}
	}
	before_chapter = async () => {
		Speech.stop()
		//현재의 챕터에 - 1하고, 0 보다 작으면 챕터0, 컨텐츠0으로 재생.
		var chapter_reading = this.state.chapter_reading - 1 
		if (chapter_reading < 0){
			//챕터 번호를 초기화시키고 이를 업데이트한 다음에 재생과정을 브레이크해라.
			chapter_reading = 0
			var content_reading = 0
			this.setState({chapter_reading:chapter_reading, content_reading:content_reading})
			this.play(0,0)
			return false
		}
		console.log("이전챕터 버튼 눌러서 챕터 바뀜")
		var wiki_data = await this.getWikiData(chapter_reading)
		this.setState({wiki_data:wiki_data})
		this.setState({chapter_reading : chapter_reading, content_reading : 0})
		if (this.state.isPlaying){
			Speech.speak(
				this.state.wiki_data[chapter_reading][0].text, 
				{
					rate : TextStore.speechRate, 
					pitch: TextStore.speechPitch,
					voice: TextStore.selectedVoice,
					onDone : this.play_next
				})}
	}
	
	add_this_page = () => {
		//현재의 url을 모벡스에 추가.
	}

	//내부에서 즉각으로 속도 조절하는 옵션 띄우기...하지말자.
	setSpeechRate = async rate => {
		this.setState({ speechRate: rate });
	};

    render() {
        const {config, state} = this;
        const {currentURL, urlText, canGoForward, canGoBack, title, incognito} = state;
        
        const Console_after_Loading = 
            <View style={{flexDirection: 'row', flex: 1}}>
                <AntDesign name="banckward" size={48} color="black"onPress={() => this.before_chapter()} />
                <AntDesign name="caretleft" size={48} color="black"onPress={() => this.before_content()} />
                <AntDesign name={this.state.isPlaying ? "pausecircle" : "play"}
                size={48} color="black" onPress={() => this.play(this.state.chapter_reading,this.state.content_reading)} />
                <AntDesign name="caretright" size={48} color="black"onPress={() => this.next_content()} />
                <AntDesign name="forward" size={48} color="black" onPress={() => this.next_chapter()}/>
                
				<AntDesign name="setting" size={48} color="black" onPress={() => this.props.navigation.navigate('Options')}/>
			</View>
			//<AntDesign name="plussquareo" size={48} color="black" onPress={() => this.add_this_page()}/>            
		
			
        const Console_before_Loading = 
            <View style={{ justifyContent: 'center',alignItems: 'center'}}>
                <Text>로딩중. 나중에 로딩아이콘으로 체인지.</Text>
            </View>
        return (
            <View style={styles.root}>
                <View style={styles.browserContainer}>
                    <WebView
                        ref={this.setBrowserRef}
                        originWhitelist={['*']}
                        source={{uri: currentURL}}
                        onLoad={this.onBrowserLoad}
                        onError={this.onBrowserError}
                        onNavigationStateChange={this.onNavigationStateChange}
                        renderLoading={() => <ActivityIndicator size="large" color="#0000ff" /> }
                        onShouldStartLoadWithRequest={this.filterRequest}
                        onMessage={this.onBrowserMessage}
                        injectedJavaScript={injectedJavaScript}
                        onLoadProgress={this.onLoadProgress}
                    />
                </View>
                <View style={{flexDirection: 'row', flex: 1}}>
                    {this.state.isLoading ? Console_before_Loading : Console_after_Loading}
                </View>
            </View>
        );
    }

}

const styles = StyleSheet.create({
    browser: {
        flex: 1
    },
    browserContainer: {
        flex: 10
    },
    root: {
        flex: 1,
        backgroundColor: 'white'
    },
    disabled: {
        opacity: 0.3
    },


});

export default Browser;
