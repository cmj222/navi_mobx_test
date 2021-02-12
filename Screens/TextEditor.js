import * as React from 'react';
import { Button, Text, View, ScrollView,  Alert} from 'react-native';
import { TextInput } from 'react-native';
import { Dimensions } from "react-native"

import cheerio, { html } from 'cheerio'

import TextStore from '../stores/TextStore'
import { observer} from 'mobx-react'

import * as Speech from 'expo-speech';
//await적용 본격화 시작 전에 세이브
@observer
export default class TextEditor extends React.Component {
    navigate = this.props.navigation;
    state = {
        TextFromWeb : '', //
        isLoading: true,
        //Url: TextStore.UrlForFetch,
		// 전쟁. 20개 이상항목 https://namu.wiki/w/%EC%A0%84%EC%9F%81
		// 트루먼 독트린. 적당한 길이와 각 홍목의 분량 https://namu.wiki/w/%ED%8A%B8%EB%A3%A8%EB%A8%BC%20%EB%8F%85%ED%8A%B8%EB%A6%B0
		Url : 'https://namu.wiki/w/%EC%A0%84%EC%9F%81', //실험에 쓸만한 임시주소. 나중에 위로 바꿔라.
        InputText : '',
		
		// 데이터 구조관련 변수
		wiki_data : {},
		
		content_index : 0, // 제목 포함한 본문 요소들의 순번용
		footnote_index  : 1, // 여러 챕터 전체에 걸친 주석과 연결될 번호. [1] 부터 시작이니 초기값은 1로. 
		
		// 읽기관련 변수
		TextToSpeech : '', //읽을 최종 결과물
		selectedVoice : '', 
		language : 'ko-KR', 
		speechRate : TextStore.speechRate,
		speechPitch : TextStore.speechPitch,
		
		// 읽기관련 좌표 변수
		chapter_length : 0,
		content_length : 0,
		chapter_reading : 0,
		content_reading : 0

    };

    componentDidMount() {
        const {Url} = this.state
        this.awaitfunction(Url)
		//this.getAxios(Url);        
    }
	
	awaitfunction = async (Url) => {
		//var wiki,footnote_data = this.getAxios(Url) // [제목, 컨텐츠]들로 이뤄진 자료를 반환.
		var wiki = await this.getAxios(Url) // [제목, 컨텐츠]들로 이뤄진 자료를 반환.
		//var footnote_data = this.getFootnote($)	// 풋노트 데이터를 반환.
		var footnote_data = await this.state.footnote_data
		var wiki_data = await this.getWikiData(wiki, footnote_data) // 위의 위키와 풋노트데이터를 받아서 원하는 궁극적 자료를 얻음.
		this.setState({wiki_data : wiki_data, chapter_length : Object.keys(wiki_data).length})
		this.setState({isLoading: false}) // 할 거 다 했으니 로딩 완료다.
	}
    getAxios = async (Url) => {
        const response = await fetch(Url);   // fetch page
        const htmlString = await response.text() // get response text 
        const $ = cheerio.load(htmlString);           // parse HTML string
		var wiki = {}                
        // ======이후 옵션의 체크에 따라서 적용이 될지 안될지를 결정하게 만들자======
        $(".wiki-macro-toc").remove()  //목차제거. 이런형식도 발동되는군
        $('.wiki-edit-section').remove() // 항목별로 있는 [편집] 제거
        $('.wiki-folding').remove() // 테이블이 있는 경우 [펼치기,접기] 제거
        $('.wiki-table').remove() // 테이블 자체를 제거하는 코드. 이후 옵션으로 만들자.
		// ==================================================================
        $(".w").children().filter('.wiki-heading').each(function (index, element) {
        wiki[index] = ['','']
        wiki[index][0] = ($(element).text())
        })
        $(".w").children().filter('.wiki-heading-content').each(function (index, element) {
        wiki[index][1] = ($(element).text())
        })
		
		//=============================사전에 주석처리========================================
		//=============================사전에 주석처리========================================
		//=============================사전에 주석처리========================================
		// 데이터 구조 돌입하기 전에 미리 주석에 대한 정리가 필요.
		// 다음과 같을 것이다. {1 : { footnote_string: [1], text : "텍스트" }
		var footnote_data = {}
        $(".footnote-list").each(function (index, element) {
			var index_plus = index + 1
			var index_string = '[' + String(index+1) + ']' // [1]
			
			var index_n_text = $(element).text() // [1] 이 당시에는 셀리카도 FR이었다.
			var footnote_text = index_n_text.split(index_string)[1] // "이 당시에는 셀리카도 FR이었다."
        	
			footnote_data[index_plus] = { footnote_string : index_string , text : footnote_text}
		})
		this.setState({footnote_data:footnote_data})
		return wiki//, footnote_data
	}
		
		//=============================데이터 구조처리========================================
		//=============================데이터 구조처리========================================
		//=============================데이터 구조처리========================================
	getWikiData = async(wiki, footnote_data) =>{
		var wiki = wiki
		var footnote_data = footnote_data
		var wiki_data = {}
		//console.log(Object.keys(wiki).length)
		var wiki_length
		for (var index_of_wiki=0; index_of_wiki<4; index_of_wiki++){
			console.log(index_of_wiki + "이 현재의 인덱스오브위키[=챕터]")
			var element_wiki = wiki[index_of_wiki]
			// 인덱스오브위키는 [제목, 본문]인 챕터들 중 몇번째인지를 의미. 
			
			var content_index = this.state.content_index //초기값은 0.
			wiki_data[index_of_wiki] = {[content_index] : {type : "heading", text : element_wiki[0] }} // 초기값은 0챕터 안에 0번째 요소로 제목타입의 "제목텍스트"가 들어옴.
			this.setState({ content_index : content_index + 1}) // 요소가 추가될때마다 요소인덱스를 +1시키자.
			
			// 의도대로라면 위키데이터 = { 0[번째챕터]: { 0[번째요소값] : { 타입:제목, 텍스트:"내용"}, ??? }} 이 된다. 이제 본문을 다루며 뒤의 ???를 채워나간다.
			
			//만약 본문에 말줄임표가 있다면 .. 으로. 그걸 다시 . 으로 줄이게. 더하여 특유의 말줄임표기 (...)도 생략하는 과정을 추가
			while (element_wiki[1].includes("(...)")){
				element_wiki[1].replace("(...)", "")
			}
			while (element_wiki[1].includes("...")){
				element_wiki[1].replace("...", "..")
			}
			while (element_wiki[1].includes("..")){
				element_wiki[1].replace("..", ".")
			}
			
			// 한 챕터의 내용의 문장들을 . 을 기준으로 나눠서 어레이화.
			var array_of_contents = element_wiki[1].split(".")
			array_of_contents.pop() // . 을 기준으로 챕터를 나누면 마지막 문장의 ~~. 도 취급되서 마지막에 빈 텍스트가 오브젝트로 들어가게됨. 이를 삭제

			
			// 위의 . 기준으로 나뉜 문단의 문장들은 몇 챕터인지를 공유해야하니, 현재 챕터를 나타내는 인덱스를 변수로 삼언하고 아래의 each의 인수로 건내주자
			//var index_of_wiki = index_of_wiki
			
			// 이제 위 어레이의 각 요소[=문장]마다 주석여부를 체크.
			
			// 여기 아래를 어떻게 await로 묶어놔야하나???
			
			for (var index_array_of_contents = 0; index_array_of_contents <array_of_contents.length; index_array_of_contents++){
				var element_array = array_of_contents[index_array_of_contents]
				
				// 위키_데이터를 위의 평션의 인수로 챕터를 추가해야하는가? 아니면 없어도 알아서 하위함수는 상위함수에서 선언한 변수값을 반영하는가???
				//var content_index = this.state.content_index // 챕터 내에서 제목[=0] 다음으로의 순번. 최초값 1
				content_index = this.state.content_index // 챕터 내에서 제목[=0] 다음으로의 순번. 최초값 1
				var footnote_index = this.state.footnote_index // 전 챕터에 걸쳐 있을 주석에 대한 번호. [1]부터 시작해야하니 최초값 1
				var footnote_string = "["+String(footnote_index)+"]" // 최초의 경우에는 "[1]"
				var footnote_text = footnote_data[footnote_index].text
				var after_footnote = "" // 한 문장에 여러 주석이 있는 경우 뒤에 남는 문장도 다시 여러번 자르는 과정 필요. 이때 돌려가며 사용될 변수
				
				//만약 문장에 [1]이 없다면 주석없는 문장이니 통채로 오브젝트화하고 머지
				if (!element_array.includes(footnote_string)){
					wiki_data[index_of_wiki][content_index] = {type : "sentence", text : element_array}
					this.setState({ content_index : content_index + 1})
					continue
				} else {
				}
				//위의 브레이크가 발동 안함 = 주석이 있는 문장의 경우 반복문 
				while (element_array.includes(footnote_string)){
					wiki_data[index_of_wiki][content_index] = { type: "footnote", text : footnote_text}
					
					footnote_index += 1 // 이걸로 풋노트스트링도 변하면서 자동으로 [2]에 맞춘 루프구문이 시행될까...? 
					// ㅇㅇ 된다.
					content_index += 1 // 주석도 컨텐츠의 번호 대상이니 추가해준다.
					
					var split_sentnece = element_array.split(footnote_string) // 주석을 기준으로 문장을 나눈다. "그는 / [1] / 언제나[2] 그래왔다."
					after_footnote = split_sentnece[1] // 더이상 주석이 없을 때까지 계속 돌려질 값. 
					element_array = split_sentnece[1] // 이제 뒤에 남은 문장이 체크대상이 된다. 
					//[2]가 포함되었는지 체크하고 그를 기준으로 전자를 오브젝트화 및 병합한다.
					//다룰 대상이 "언제나 / [2] / 그래왔다" 로 바뀌게 된다.
					
					//추가된 번호를 스테이트에 업뎃. 주석이 포함된 한문장이 완료되서 다음 문장을 다룰때마다 초기에 이 스테이트값을 가져와서 대입함으로서 증가된 번호를 매 문장마다 반영.
					this.setState({footnote_index : footnote_index, content_index : content_index}) 
				}
				// 컨티뉴 통과했으니 주석이 있는 문장인데 위의 주석 체크조건문도 통과했으면 남는 건 주석있는 문장의 마지막 텍스트다.
				if (after_footnote !== '' || '.') { // 문장 마지막 주석 뒤에 마침표가 아닌 텍스트 내용이 있다면...
					var content_index = this.state.content_index // 챕터 내에서 몇번째인지를 반영하기 위해서 동기화시켜주고...
					wiki_data[index_of_wiki][content_index] = { type : "sentence", text : after_footnote}
					this.setState({content_index : content_index + 1})
				} 
			}
			this.setState({content_index : 0}) // 매 챕터마다 제목을 0으로 그 다음 문장부터는 1,2,3...이 되도록 초기화하는 과정을 챕터전환 직전에 시행.
			console.log(" 다음 챕터로 넘어가기 전 마지막으로 출력")
			//console.log(wiki_data)
			//
		}
		//this.setState({wiki_data : wiki_data, chapter_length : Object.keys(wiki_data).length})
        //console.log(WikiText)
        return wiki_data
    }

  
    play = (chapter_reading, content_reading) => {
		Speech.stop()
		console.log("챕터길이는 " + this.state.chapter_length)
		if (this.state.chapter_length == 0){
			console.log("챕터길이가 0이니 아래에서 브레이크")
			return false
		} 
		Speech.speak(
			this.state.wiki_data[chapter_reading][content_reading].text, {
				rate : this.state.speechRate, onDone : this.play_next
			}
		)
	}
	
	play_next = () => {
		var content_reading = this.state.content_reading + 1 // 초기값은 1
		var chapter_reading = this.state.chapter_reading	// 초기값은 0
		// 챕터길이는 위키데이터 모집하면서 구해놨으니 현재 읽는 챕터의 컨텐츠 길이를 구한다.
		var content_length = Object.keys(this.state.wiki_data[chapter_reading]).length
		console.log(content_length)
		// 만약 읽을 컨텐츠 번호가 컨텐츠 길이보다 길다면...이때 컨텐츠길이는 숫자 그자체이지만 리딩번호는 0부터 시작하니 맞추기 위해서 후자에 -1
		if (content_reading > content_length - 1){
			// 컨텐츠번호를 초기화시키고, 챕터번호를 + 1 시켜라
			content_reading = 0
			chapter_reading += 1
		}
		// 만약 챕터의 길이까지도 총 챕터의 길이를 넘는다면...
		if (chapter_reading > this.state.chapter_length){
			//챕터 번호를 초기화시키고 이를 업데이트한 다음에 재생과정을 브레이크해라.
			chapter_reading = 0
			this.setState({chapter_reading : chapter_reading, content_reading : content_reading})
			return false
		}
		this.setState({chapter_reading : chapter_reading, content_reading : content_reading})
		console.log("스피크 하기 직전의 챕터리딩과 콘텐츠리딩은 " + chapter_reading + "과 " + content_reading)
		Speech.speak(
			this.state.wiki_data[chapter_reading][content_reading].text, {	rate : this.state.speechRate, 
				onDone : this.play_next
			}
		)
	}
	trans = (next_or_before) => {

		
		
	}
	
	stop = () => {
		Speech.stop()
		this.setState({chapter_reading : 0 , content_reading : 0})
	}

	pause = () => { 
		//A = Speech.isSpeakingAsync()
		if (Speech.isSpeakingAsync()) {
			Speech.pause()
		} else {
			Speech.resume()
		}
	}
	
	rate_up = () => {
		if (this.state.speechRate < 2.9) {
			TextStore.ST_setSpeechRate(this.state.speechRate + 0.1)
			this.setState({ speechRate : TextStore.speechRate})
		}
	}
	rate_down = () => {
		if (this.state.speechRate > 0.1) {
			TextStore.ST_setSpeechRate(this.state.speechRate - 0.1)
			this.setState({ speechRate : TextStore.speechRate})
		}
	}
	next_content = () => {
		//일단 현재 재생하던것을 멈추고	
		Speech.stop()
		this.play_next()
			
	}
	before_content = () => {
		
	}
	next_chapter = () => {
		Speech.stop()
		//현재의 챕터를 확인하고, 전체 챕터의 길이와 비교해서 다음이 있다면 챕터바꾸고 컨텐츠번호는 0으로 초기화하면서 플레이.
		var chapter_reading = this.state.chapter_reading + 1
		if (chapter_reading > this.state.chapter_length){
			//챕터 번호를 초기화시키고 이를 업데이트한 다음에 재생과정을 브레이크해라.
			Alert.alert("마지막 챕터", "현재의 챕터가 마지막 챕터입니다.")
			return false
		}
		this.setState({chapter_reading : chapter_reading, content_reading : 0})
		this.play(chapter_reading, 0)
	}

    render() {
        const { isLoading, TextFromWeb} = this.state
        if (isLoading == false) { // 로딩이 완료되면 아래의 리턴을 반환.
            return (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
					<View style={{flex:9}}>
					<ScrollView>
                    <Text 
                        style={{ 
                            flex: 9,
                            width: Dimensions.get('screen').width * 0.99, 
                            borderColor: 'white', borderWidth: 1,
                            fontSize: 20
                            }}
						>{TextFromWeb}</Text>
					</ScrollView>
					</View>
                    <View style={{flexDirection: 'row', flex: 1}}>
                        <Button title="설정" onPress={this.onPressButton.bind(this)} />
                        <Button title="재생" onPress={() => this.play(0, 0)} />
						<Button title="정지" onPress={() => this.stop()} />
						<Button title="다음문장" onPress={() => this.next_content()} />
                        <Button title="다음챕터" onPress={() => this.next_chapter()} />
						<Button title="속도+" onPress={() => this.rate_up()} />
						<Button title="속도-" onPress={() => this.rate_down()} />
                    </View>
                </View>
            )
        } else {
            return(<View><Text>로딩중...</Text></View>)
                    }
    }

    onPressButton() {
        const { navigate } = this.props.navigation;
        
        this.props.navigation.navigate('Options')
        }
}

