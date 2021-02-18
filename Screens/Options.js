import React, { Component } from "react";
import { Button, View, StyleSheet, Text, FlatList,  TextInput,  Keyboard
} from "react-native";
import Slider from '@react-native-community/slider';
import * as Speech from 'expo-speech';
import Checkbox from 'expo-checkbox';

import TextStore from '../stores/TextStore'
import { observer } from 'mobx-react'

@observer
export default class TextEditor extends React.Component {
    
  navigate = this.props.navigation;

  state = {
      voices: [], // 선택가능한 보이스들을 여기에 담을 것임.
      selectedVoice: null, // 아직 선택된 보이스가 없음. 플랫리스트에서 이것과 대조하여 버튼 색 차별.
      
      language : 'kr',
      speechRate: TextStore.speechRate,
      speechPitch: TextStore.speechPith,

      ttsStatus: "initiliazing", // tts의 이벤트를 체크해서 시작중, 시작됨, 끝남, 취소됨 중 하나를 넣게함.
      isLoading: true,
      text: "테스트 텍스트입니다.",

      mobx_test : TextStore.UrlForFetc,
      footnote_OnOff : TextStore.footnote_Checked
  };

  //이 페이지가 로딩되면 아래의 함수를 시행하여 사용가능한 음성 모으게함.
  componentDidMount(){
    this.initTts()
  }

  initTts = async () => {
      // 사용가능한 음성들을 구하고 voices에 반환한다.
      const voices = await Speech.getAvailableVoicesAsync();
      
      // 이런 음성들을 음성마다 네트워크연결이 불필요한지? 설치가 완료되었는지?로 필터링하고
      // 추가로 v.language=="ko-KR" 를 붙여서 한국어인 음성만 가져온다.
      // 필터링한 요소마다 음성의 아이디, 이름, '사용가능음성'으로 오브젝트화하여 리턴한다.
      const availableVoices = voices
          .filter(v => !v.networkConnectionRequired && !v.notInstalled && v.language=="ko-KR" )
          .map(v => {
          return { id: v.identifier, name: v.name, language: v.language };
          });
      console.log(availableVoices)
      // 선택된음성을 초기화시킨다.    
      let selectedVoice = null;
      // 만약 사용가능한 음성들이 있다면...
      if (availableVoices && availableVoices.length > 0) {
          // 그 중 첫번째놈의 아이디를 선택된음성으로 지정.
          selectedVoice = availableVoices[0].id
          
          // 이후 필터링거친 사용가능음성들을 스테이트.사용가능음성들에,
          // 선택된 음성을 스테이트.선택된음성에 덮씌운다.
          // 그리고 tts스테이터스를 시작중에서 시작됨으로 바꾼다.
          this.setState({
              voices: availableVoices,
              selectedVoice,
              ttsStatus: "initialized",
              text: '보이스 세팅 완료'
          });
        console.log("보이스선택완료")
        TextStore.ST_set_selecedVoice(this.state.selectedVoice)
        this.setState({isLoading:false})
      // 만약 추출할 음성 자체가 없다면...어쨋든 걍 시작됨으로 바꿔라.
      } else {
        console.log("적합한 음성이 없음")
          this.setState({ ttsStatus: "initialized", text:'실패다' });
      }
  };

  // readText라는 문구를 눌렀을때 발동. 이전의 재생을 멈추고 텍스트창의 텍스트를 읽는다.
  readText = async () => {
    Speech.stop()
    Speech.speak(
      this.state.text, {
        voice: this.state.selectedVoice,
        language: this.state.language,
        rate: this.state.speechRate,
        pitch: this.state.speechPitch
      }    )
  };

  //주어진 시간에 몇 단어? = 스피드, 템포
  // rate라는 인수를 받아서 설정하는 메소드 시행하고, 현재의 스테이트에 반영.
  // 슬라이더를 통해서 시행되기 때문에 슬라이더 범위 내의 값을 전달 받을 예정임.
  // 추가로 스토어에 저장되어 텍스트에디터에서도 활용될 스피치레이트를 덮어씌운다.
  setSpeechRate = async rate => {
    TextStore.ST_setSpeechRate(rate)
    this.setState({ speechRate: rate })
  };
  // 음성 높낮이 톤 설정. 위와 마찬가지
  setSpeechPitch = async rate => {
    TextStore.ST_setSpeechPitch(rate)
    this.setState({ speechPitch: rate });
  };

  // 아래의 음성리스트의 음성 선택시 발동. 원래는 언어도 따라서 선택하는데 해당 기능은 삭제하고 음성선택만 남긴다.
  onVoicePress = async voice => {
    this.setState({ selectedVoice: voice.identifier });
  };

  //선택가능한 음성들로 리스트 만들기.
  renderVoiceItem = ({ item }) => {
      return (
          <Button
          title={`${item.id}`}
          color={this.state.selectedVoice === item.id ? "black" : "grey"}
          //누르면 아래의 해당 아이템을 인수로하는 언어설정 시행.
          onPress={() => this.onVoicePress(item)}
          />
      );
  }

  //체크박스 기능 테스트.
  setChecked = () => {
    TextStore.footnote_toggle()
    this.setState({footnote_OnOff : TextStore.footnote_Checked})
  }



  // 컨테이너는 플렉스1, 슬라이더콘테이너는 플렉스방향가로, 플렉스는없음.
  // 텍스트 인풋은 플렉스1
  render() {
    const { isLoading } = this.state
    if (isLoading == false) { // 로딩이 완료되면 아래의 리턴을 반환.
      //const footnote_OnOff = TextStore.footnote_Checked
      const footnote_OnOff = this.state
      return (
        <View style={styles.container}> 
          <View style={styles.sliderContainer}>
            <Text
            style={styles.sliderLabel} // 중앙배치에 오른쪽[슬라이더]으로부터 20마진
            >{`속도: ${this.state.speechRate.toFixed(2)}`}</Text> 
            <Slider
            style={styles.slider} // 너비값width 150
            minimumValue={0.01}
            maximumValue={3.99}
            value={this.state.speechRate}
            onSlidingComplete={this.setSpeechRate}/> 
          </View>
          
          <View style={styles.sliderContainer}>
              <Text
              style={styles.sliderLabel}
              >{`높이: ${this.state.speechPitch.toFixed(2)}`}</Text>
              <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={2}
              value={this.state.speechPitch}
              onSlidingComplete={this.setSpeechPitch}
              />
          </View>
          <FlatList
            keyExtractor={item => item.id}
            renderItem={this.renderVoiceItem}
            extraData={this.state.selectedVoice}
            data={this.state.voices}
          />
          <View style={styles.sliderContainer}>
          <Button title={`테스트 음성 듣기`} onPress={this.readText} />
          <Button title={'설정저장하기'} />
          </View>

          <View style={styles.sliderContainer}>
            <Checkbox value={this.state.footnote_OnOff} onValueChange={this.setChecked} />
            <Text>체크박스 옆 텍스트</Text>
          </View>

          <Button title="스토어내용 콘솔로그" onPress={()=>console.log(TextStore.footnote_Checked)}/>

          
        
          <View style={{ flex: 0.3, alignItems: 'center', justifyContent: 'center' }}>
            <Button title="텍스트에디터로" onPress={() => this.props.navigation.navigate('TextEditor')} />
            <Button title="옵션스크린에서 옵션이라 저장하기" onPress={() => TextStore.addUser('옵션스크린')} />
            <Button title="옵션스크린에서 읽어내기" onPress={() => console.log('스토어밸류는 ' + TextStore.TextAtoB)} />
          </View>
        </View>
        )
    } else {
      return(<View><Text>로딩중...</Text></View>)
    }
  }
}

const styles = StyleSheet.create({
    container: {
      marginTop: 0,
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F5FCFF"
    },
    title: {
      fontSize: 20,
      textAlign: "center",
      margin: 10
    },
    label: {
      textAlign: "center"
    },
    sliderContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20
    },
    sliderLabel: {
      textAlign: "center",
      marginRight: 20
    },
    slider: {
      width: 150
    },
    textInput: {
      borderColor: "gray",
      borderWidth: 1,
      flex: 1,
      width: "100%"
    }
  });