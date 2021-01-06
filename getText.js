import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, Platform, Button, FlatList, Slider, TextInput, Keyboard } from 'react-native';
import cheerio from 'cheerio-without-node-native'

export default class extends React.Component {

  state = {
    isLoading: true,
    //Url: `https://namu.wiki/w/%ED%86%A0%EC%9A%94%ED%83%80%20%EC%88%98%ED%94%84%EB%9D%BC#s-6`  //도요타
    Url: `https://namu.wiki/w/%EC%82%BC%EA%B5%AD%EC%A7%80`, //삼국지
  };

  componentDidMount() {
    const {Url} = this.state
    this.getAxios(Url);
  }

  getAxios = async (Url) => {
    //const { searchUrl } = this.state;
    const response = await fetch(Url);   // fetch page
    const htmlString = await response.text() // get response text 
    const $ = cheerio.load(htmlString);           // parse HTML string
    $(".wiki-macro-toc").remove()  //목차제거. 이런형식도 발동되는군
    $('.wiki-edit-section').remove() // 항목별로 있는 [편집] 제거
    $('.wiki-folding').remove() // 테이블이 있는 경우 [펼치기,접기] 제거
    $('.wiki-table').remove() // 테이블 자체를 제거하는 코드. 이후 옵션으로 만들자.

    let wiki = {}

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

    WikiText = WikiText.split(".")
    //let wikiTextList = wikiText.split(".")
    console.log(WikiText[10])


    
    this.setState({
      isLoading: false,
      paragraph: ''
    })

  }

  render() {
    const { isLoading, paragraph, goal } = this.state;
    return isLoading ? (
      <Text>로딩중.................</Text>
    ) : (
      <Text>로딩완료로딩완료로딩완료로딩완료로딩완료</Text>
    );

  };
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
