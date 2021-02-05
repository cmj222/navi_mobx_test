import * as React from 'react';
import { Button, Text, View, ScrollView} from 'react-native';
import { TextInput } from 'react-native';
import { Dimensions } from "react-native"

import cheerio, { html } from 'cheerio'

import TextStore from '../stores/TextStore'
import { observer} from 'mobx-react'

import * as Speech from 'expo-speech';

@observer
export default class TextEditor extends React.Component {
    navigate = this.props.navigation;
    state = {
        TextFromWeb : '', //
        isLoading: true,
        Url: TextStore.UrlForFetch,
        InputText : '',
		
		
		TextToSpeech : '', //읽을 최종 결과물
		selectedVoice : '', 
		language : 'ko-KR', 
		speechRate : TextStore.speechRate,
		speechPitch : TextStore.speechPitch,
		
		content_index : 1, // 제목 제외한 본문 요소들의 순번용
		footnote_index  : 1 // 여러 챕터 전체에 걸친 주석과 연결될 번호 
    };

    componentDidMount() {
        const {Url} = this.state
        this.getAxios(Url);        
    }

    getAxios = async (Url) => {
        let wiki = {}
        let WikiTextSplited = []
        
        const response = await fetch(Url);   // fetch page
        const htmlString = await response.text() // get response text 
        const $ = cheerio.load(htmlString);           // parse HTML string
                
        // 이후 옵션의 체크에 따라서 적용이 될지 안될지를 결정하게 만들 것임...
        $(".wiki-macro-toc").remove()  //목차제거. 이런형식도 발동되는군
        $('.wiki-edit-section').remove() // 항목별로 있는 [편집] 제거
        $('.wiki-folding').remove() // 테이블이 있는 경우 [펼치기,접기] 제거
        $('.wiki-table').remove() // 테이블 자체를 제거하는 코드. 이후 옵션으로 만들자.

        $(".w").children().filter('.wiki-heading').each(function (index, element) {
        wiki[index] = ['','']
        wiki[index][0] = ($(element).text())
        })
        $(".w").children().filter('.wiki-heading-content').each(function (index, element) {
        wiki[index][1] = ($(element).text())
        })
		
		// 데이터 구조 돌입하기 전에 미리 주석에 대한 정리가 필요하다... 대략 { 1 : { footnote_string: [1], text : "텍스트" }
		var footnote_data = {} // 주석을 [1] : '이 당시에는 ...', [2] : '어쩌구저쩌구..' 하게 만들것임.

        $(".footnote-list").each(function (index, element) {
			var index_plus = index + 1
			var index_n_text = $(element).text() // [1] 이 당시에는 셀리카도 FR이었다.
			var index_string = '[' + String(index+1) + ']' // [1]
			var footnote_text = index_n_text.split(index_string)[1] // "이 당시에는 셀리카도 FR이었다."
        	var footnote_obj = { index_plus_1 : { footnote_string : index_string , text : footnote_text} }
			var footnote_data = { ...footnote_data, footnote_obj}
			// return footnote_data 이때 리턴을 써야했던가...???
		})
		
		
		//여기서부터 데이터구조 테스트
		// 아래의 각 요소는 ["제목", "내용텍스트"]
		var wiki_data = {} // 아래의 반복문에서 돌려가며 활용할 데이터를 선언
		
		wiki.each(function(index, element) {

			// 인덱스는 챕터를 나타내게 된다.
			// 제목은 모든 챕터에서 처음으로 올테니 0으로 인덱스를 지정받으며 값으로 타입:헤딩과 구성요소의 전자를 텍스트로 가진다.
			var heading_data = { index : { 0 : {type : "heading", text : element[0] }}}
			var wiki_data = {...wiki_data, heading_data}
			
			// 의도대로라면 위키데이터 = { 0: { 0 : { 타입:제목, 텍스트:내용}, ??? }} 이 된다. 이제 본문을 다루며 뒤의 ???를 채워나간다.
			// 제목의 데이터를 넣었으니 
			//만약 본문에 말줄임표가 있다면 .. 으로. 그걸 다시 . 으로 줄이게
			if (element[1].includes("...")){
				element[1].replace("...", "..")
			}
			if (element[1].includes("..")){
				element[1].replace("..", ".")
			}
			var array_of_contents = element[1].split(".")
			
			// 위의 . 기준으로 나뉜 문단의 문장들은 몇 챕터인지를 공유해야하니, 현재 챕터를 나타내는 인덱스를 변수로 삼언하고 아래의 each의 인수로 건내주자
			var chapter_index = index
			
			// 이제 위 어레이의 각 요소[=문장]마다 주석여부를 체크하고 업으면 직행.
			array_of_contents.each(function(element, index, chapter_index ){
				
				// 위키_데이터를 위의 평션의 인수로 챕터를 추가해야하는가? 아니면 없어도 알아서 하위함수는 상위함수에서 선언한 변수값을 반영하는가???
				var content_index = index + this.state.content_index // 챕터 내에서 제목[=0] 다음으로의 순번. 최초값 1
				var footnote_index = this.state.footnote_index // 전 챕터에 걸쳐 있을 주석에 대한 번호. [1]부터 시작해야하니 최초값 1
				var footnote_string = "["+footnote_index.string+"]" // 최초의 경우에는 "[1]"
				var after_footnote = "" // 주석이 있는 경우 돌려서 사용될 변수
				
				//만약 문장에 [1]이 없다면 주석없는 문장이니 통채로 오브젝트화하고 머지
				if (!element.includes("["+footnote_index.string+"]")){
					var sentences = { chapter_index : { content_index : {type : "sentence", text : element}} }
					console.log("주석없는 것의 전체 텍스트 " + sentences.chapter_index.text)
					wiki_data = { ...wiki_data, ...sentences} 
					//생각대로라면 위키데이터 = { 0: { 0 : { 타입:제목, 텍스트:내용}, 1 : {타입:문장, 텍스트:내용}}} 로 0번째 챕터가 마무리 되는 셈이다...
					
					this.setState({ content_index : content_index + 1})
					// return true // 이게 컨티뉴와 같은 기능인가? 흠...
				}
				//위의 브레이크가 발동 안함 = 주석이 있는 문장의 경우 반복문 
				while (element.includes(footnote_string)){
					var split_sentnece = element.split(footnote_string) // 주석을 기준으로 문장을 나눈다. "그는 / [1] / 언제나[2] 그래왔다."
					var before_footnote = { chapter_index: { content_index :{ type : "sentence", text : split_sentnece[0]}} }
					console.log("주석있는 것의 앞부분은 " + before_footnote.chapter_index.text) // "그는"
					wiki_data = { ...wiki_data, ...before_footnote}
					
					//////////////////////////////////////
					//footnote_data = { 1 : { footnote_string: [1], text : "텍스트" }
					// 앞에서 한거 반복인데...나중에 삭제해도 돌아가는지 확인하자
					var footnote_index  = this.state.footnote_index // 스테이트의 인덱스와 동기화. 최초값은 1
					var footnote_text = footnote_data.footnote_index.text
					var footnote_string = footnote_data.footnote_index.footnote_string
					console.log("주석. 내용은 " + footnote_text + ". 번호는 " + footnote_string)
					
					var footnote_obj = { chapter_index : { content_index : { type:"footnote", text : footnote_text}}}
					wiki_data = {...wiki_data, ...footnote_obj}
					footnote_index += 1 // 이걸로 풋노트스트링도 변하면서 자동으로 [2]에 맞춘 루프구문이 시행될까...? 
					content_index += 1 // 주석도 컨텐츠의 번호 대상이니 추가해준다.
					////위의 내용과 주석가져오기를 겷합해라////

					after_footnote = split_sentnece[1] // 더이상 주석이 없을 때까지 계속 돌려질 값. 
					element = split_sentnece[1] // 이제 뒤에 남은 문장이 체크대상이 된다. 
					//[2]가 포함되었는지 체크하고 그를 기준으로 전자를 오브젝트화 및 병합한다.
					//다룰 대상이 "언제나 / [2] / 그래왔다" 로 바뀌게 된다.
					
					//추가된 번호를 스테이트에 업뎃. 주석이 포함된 한문장이 완료되서 다음 문장을 다룰때마다 초기에 이 스테이트값을 가져와서 대입함으로서 증가된 번호를 매 문장마다 반영.
					this.setState({footnote_index : footnote_index, content_index : content_index}) 
				}
				// 브레이크도 안거치고 위 조건문도 통과했으면 남는 건 주석있는 문장의 마지막 텍스트다. "그래왔다"
				if (after_footnote !== '' || '.') { // 문장 마지막 주석 뒤에 마침표가 아닌 텍스트 내용이 있다면...
					var content_index = this.state.content_index // 챕터 내에서 몇번째인지를 반영하기 위해서 동기화시켜주고...
					
					var lastPartOfSentence = { chapter_index : { content_index : { type : "sentence", text : after_footnote}}}
					wiki_data = { ...wiki_data, ...lastPartOfSentence}
					this.setState({content_index : content_index + 1})
					console.log("주석뒤에 남은부분은 " + lastPartOfSentence.chapter_index.text)
				} 
				// 이제 한문장을 다 마무리 했으니 다음 문장을 대상으로 해야함. each가 알아서 돌아감. 따로 건들건 없나???
				console.log("한문장 완료.")
				console.log(wiki_data) //확인용으로 출력한번 시켜보자.
				return false // 확인용으로 반복문 탈출. 한챕터만 다루고 마치도록...
			})
			
			setState( index = mid_array)
		})
        let txtList = []
        for (let id in wiki){
        let content = wiki[id]
        txtList.push(content[0])
        txtList.push(content[1])
        }

        WikiText = txtList.toString()
                
        let footnote = {} // 주석을 [1] : '이 당시에는 ...', [2] : '어쩌구저쩌구..' 하게 만들것임.

        $(".footnote-list").each(function (index, element) {
        var index_text = $(element).text() // [1] 이 당시에는 셀리카도 FR이었다.
        var index_plus_1 = '[' + String(index+1) + ']'
        var only_text = index_text.split(index_plus_1)[1]
        
        footnote[index_plus_1] = only_text
        })

        for (let id in footnote){
        WikiText = WikiText.replace(id, `.` + id + `.`)
        //WikiText = WikiText.replace(id, footnote[id]) 주석을 주석내용으로 바꿔치기식
        }
        
        WikiTextSplited = WikiText.split(".")
        
        //console.log(WikiText)
        
        this.setState({
        isLoading: false,
        TextFromWeb: WikiText,
		TextToSpeech: WikiText.substr(0, 3000)
		
        })
    }

    updateUrlText = (text) => {
        this.setState({
            InputText: text
        });
    };
 
    test1 = () => {
      TextStore.addUser('테스트1함수를 통해서 작동')
    }
  
    play = () => {
		Speech.stop()
		Speech.speak(
			'현재속도는 ' + this.state.speechRate + '입니다아아아아' + this.state.TextToSpeech, {
				rate : this.state.speechRate
			}
		)
	}
	
	stop = () => {
		Speech.stop()
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

    render() {
        console.log(TextStore.UrlForFetch)
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
                        <Button
                            title="설정으로 가기"
                            onPress={this.onPressButton.bind(this)}
                        />
                        <Button title="Go back" onPress={() => this.props.navigation.goBack()} />
                        <Button title="save" onPress={() => this.test1()} />
                        <Button title="재생" onPress={() => this.play()} />
						<Button title="정지" onPress={() => this.stop()} />
						<Button title="++" onPress={() => this.rate_up()} />
						<Button title="--" onPress={() => this.rate_down()} />
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

