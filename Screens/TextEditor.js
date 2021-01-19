import * as React from 'react';
import { Button, Text, View} from 'react-native';
import { TextInput } from 'react-native';
import { Dimensions } from "react-native"

import cheerio, { html } from 'cheerio'

import TextStore from '../stores/TextStore'
import { observer} from 'mobx-react'

@observer
export default class TextEditor extends React.Component {
    navigate = this.props.navigation;

    state = {
        TextFromWeb : '',
        isLoading: true,
        Url: TextStore.UrlForFetch,
        InputText : ''
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
        
        console.log(WikiText)
        
        this.setState({
        isLoading: false,
        TextFromWeb: WikiText
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
  
    test2 = () => {
      console.log(TextStore.TextAtoB)
      console.log(TextStore.UrlForFetch)
    }

    render() {
        console.log(TextStore.UrlForFetch)
        const { isLoading, TextFromWeb} = this.state
        if (isLoading == false) { // 로딩이 완료되면 아래의 리턴을 반환.
            return (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <TextInput 
                        style={{ 
                            flex: 90,
                            //height: Dimensions.get('screen').height * 0.75, 
                            width: Dimensions.get('screen').width * 0.99, 
                            borderColor: 'white', borderWidth: 1,
                            fontSize: 20
                            }}
                        onChangeText={this.updateUrlText}
                        //value={this.InputText}
                        value={TextFromWeb}
                        multiline={true}
                    />
                    <View style={{flexDirection: 'row', flex: 10}}>
                        <Button
                            title="설정으로 가기"
                            onPress={this.onPressButton.bind(this)}
                        />
                        <Button title="Go back" onPress={() => this.props.navigation.goBack()} />
                        <Button title="save" onPress={() => this.test1()} />
                        <Button title="read" onPress={() => this.test2()} />
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

