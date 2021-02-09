import * as React from 'react';
import { Button, Text, View, ScrollView} from 'react-native';
import { TextInput } from 'react-native';
import { Dimensions } from "react-native"

import cheerio, { html } from 'cheerio'

import TextStore from '../stores/TextStore'
import { observer} from 'mobx-react'

import * as Speech from 'expo-speech';

// 실시간공유??
@observer
export default class TextEditor extends React.Component {
    navigate = this.props.navigation;
    state = {
        TextFromWeb : '', //
        isLoading: true,
        //Url: TextStore.UrlForFetch,
		Url : 'https://namu.wiki/w/%ED%8A%B8%EB%A3%A8%EB%A8%BC%20%EB%8F%85%ED%8A%B8%EB%A6%B0', //실험에 쓸만한 임시주소. 나중에 위로 바꿔라.
        InputText : '',
		
		TextToSpeech : '', //읽을 최종 결과물
		selectedVoice : '', 
		language : 'ko-KR', 
		speechRate : TextStore.speechRate,
		speechPitch : TextStore.speechPitch,
		
		content_index : 0, // 제목 포함한 본문 요소들의 순번용
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
			var index_string = '[' + String(index+1) + ']' // [1]
			
			var index_n_text = $(element).text() // [1] 이 당시에는 셀리카도 FR이었다.
			var footnote_text = index_n_text.split(index_string)[1] // "이 당시에는 셀리카도 FR이었다."
        	
			//var footnote_obj = { [index_plus] : { footnote_string : index_string , text : footnote_text} }
			footnote_data[index_plus] = { footnote_string : index_string , text : footnote_text}
			//var footnote_data = { ...footnote_data, footnote_obj}
			// return footnote_data 이때 리턴을 써야했던가...???
		})
		
		
		//여기서부터 데이터구조 테스트
		
		var wiki_data = {} // 아래의 반복문에서 돌려가며 활용할 데이터를 선언
		
		// 아래의 각 요소는 ["제목", "내용텍스트"]
		//wiki.each(function(index, element) {
		for (var index_of_wiki=0; index_of_wiki<2; index_of_wiki++){
			console.log(index_of_wiki + "이 현재의 인덱스오브위키[=챕터]")
			var element_wiki = wiki[index_of_wiki]
			
			// 인덱스는 챕터를 나타내게 된다.
			// 제목은 모든 챕터에서 처음으로 올테니 0으로 인덱스를 지정받으며 값으로 타입:헤딩과 구성요소의 전자를 텍스트로 가진다.
			
			var content_index = this.state.content_index // 챕터 내에서 제목[=0] 다음으로의 순번. 최초값 1
			wiki_data[index_of_wiki] = {[content_index] : {type : "heading", text : element_wiki[0] }}
			this.setState({ content_index : content_index + 1})
			
			// 의도대로라면 위키데이터 = { 0: { 0 : { 타입:제목, 텍스트:내용}, ??? }} 이 된다. 이제 본문을 다루며 뒤의 ???를 채워나간다.
			// 제목의 데이터를 넣었으니 
			//만약 본문에 말줄임표가 있다면 .. 으로. 그걸 다시 . 으로 줄이게. 특유의 말줄임표기도 생략하도록
			while (element_wiki[1].includes("(...)")){
				element_wiki[1].replace("(...)", "")
			}
			while (element_wiki[1].includes("...")){
				element_wiki[1].replace("...", "..")
			}
			while (element_wiki[1].includes("..")){
				element_wiki[1].replace("..", ".")
			}
			
			// 한 챕터의 내용의 문장들을 . 을 기준으로 나눈 어레이.
			var array_of_contents = element_wiki[1].split(".")
			array_of_contents.pop() // . 을 기준으로 챕터를 나누면 마지막 문장의 ~~. 도 취급되서 마지막에 빈 텍스트가 오브젝트로 들어가게됨. 이를 삭제

			
			// 위의 . 기준으로 나뉜 문단의 문장들은 몇 챕터인지를 공유해야하니, 현재 챕터를 나타내는 인덱스를 변수로 삼언하고 아래의 each의 인수로 건내주자
			var chapter_index = index_of_wiki
			
			// 이제 위 어레이의 각 요소[=문장]마다 주석여부를 체크하고 업으면 직행.
			//array_of_contents.each(function(element, index, chapter_index ){
			for (var index_array_of_contents = 0; index_array_of_contents <array_of_contents.length; index_array_of_contents++){
				var element_array = array_of_contents[index_array_of_contents]
				
				// 위키_데이터를 위의 평션의 인수로 챕터를 추가해야하는가? 아니면 없어도 알아서 하위함수는 상위함수에서 선언한 변수값을 반영하는가???
				//var content_index = this.state.content_index // 챕터 내에서 제목[=0] 다음으로의 순번. 최초값 1
				content_index = this.state.content_index // 챕터 내에서 제목[=0] 다음으로의 순번. 최초값 1
				var footnote_index = this.state.footnote_index // 전 챕터에 걸쳐 있을 주석에 대한 번호. [1]부터 시작해야하니 최초값 1
				var footnote_string = "["+String(footnote_index)+"]" // 최초의 경우에는 "[1]"
				var after_footnote = "" // 한 문장에 여러 주석이 있는 경우 뒤에 남는 문장도 다시 여러번 자르는 과정 필요. 이때 돌려가며 사용될 변수
				
				//만약 문장에 [1]이 없다면 주석없는 문장이니 통채로 오브젝트화하고 머지
				if (!element_array.includes(footnote_string)){
					wiki_data[chapter_index][content_index] = {type : "sentence", text : element_array}
					this.setState({ content_index : content_index + 1})
					continue
				} else {
				}
				//위의 브레이크가 발동 안함 = 주석이 있는 문장의 경우 반복문 
				while (element_array.includes(footnote_string)){
					
					var split_sentnece = element_array.split(footnote_string) // 주석을 기준으로 문장을 나눈다. "그는 / [1] / 언제나[2] 그래왔다."
					
					wiki_data[chapter_index][content_index] = { type : "sentence", text : split_sentnece[0]}
					
					//footnote_data = { 1 : { footnote_string: [1], text : "텍스트" }
					// 앞에서 한거 반복인데...나중에 삭제해도 돌아가는지 확인하자
					var footnote_index  = this.state.footnote_index // 스테이트의 인덱스와 동기화. 최초값은 1
					var footnote_text = footnote_data[footnote_index].text
					var footnote_string = footnote_data[footnote_index].footnote_string
					
					//var footnote_obj = { chapter_index : { content_index : { type:"footnote", text : footnote_text}}}
					//wiki_data = {...wiki_data, ...footnote_obj}
					wiki_data[chapter_index][content_index] = { type:"footnote", text : footnote_text}
					
					footnote_index += 1 // 이걸로 풋노트스트링도 변하면서 자동으로 [2]에 맞춘 루프구문이 시행될까...? 
					content_index += 1 // 주석도 컨텐츠의 번호 대상이니 추가해준다.
					////위의 내용과 주석가져오기를 겷합해라////

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
					
					//var lastPartOfSentence = { chapter_index : { content_index : { type : "sentence", text : after_footnote}}}
					//wiki_data = { ...wiki_data, ...lastPartOfSentence}
					wiki_data[chapter_index][content_index] = { type : "sentence", text : after_footnote}
					this.setState({content_index : content_index + 1})
				} 
			}
			this.setState({content_index : 0})
			console.log(" 다음 챕터로 넘어가기 전 마지막으로 위키데이터 오브젝트 전체 출력")
			console.log(wiki_data) //확인용으로 출력한번 시켜보자.
		}
        let txtList = []
        for (let id in wiki){
        let content = wiki[id]
        txtList.push(content[0])
        txtList.push(content[1])
        }

        var WikiText = txtList.toString()
                
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

