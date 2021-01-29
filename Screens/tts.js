import React, { Component } from "react";
import {
  Platform,  StyleSheet,  Text,  View,  Button,  FlatList,  TextInput,  Keyboard
} from "react-native";
import Slider from '@react-native-community/slider';
import * as Speech from 'expo-speech';

type Props = {};
export default class App extends Component<Props> {
  state = {
    voices: [], // 선택가능한 보이스들을 여기에 담을 것임.
    ttsStatus: "initiliazing", // tts의 이벤트를 체크해서 시작중, 시작됨, 끝남, 취소됨 중 하나를 넣게함.
    selectedVoice: null, // 아직 선택된 보이스가 없음.
    speechRate: 0.5,
    speechPitch: 1,
    text: "테스트 텍스트입니다.", // 읽을 내용??? 이걸 어떻게 이을까...
    language : 'kr'
  };

  initTts = async () => {
    // 사용가능한 음성들을 구하고 voices에 반환한다.
    const voices = await Speech.getAvailableVoicesAsync();
    
    // 이런 음성들을 음성마다 네트워크연결이 불필요한지? 설치가 완료되었는지?로 필터링하고
    // 필터링한 요소마다 음성의 아이디, 이름, '사용가능음성'으로 오브젝트화하여 리턴한다.
    const availableVoices = voices
      .filter(v => !v.networkConnectionRequired && !v.notInstalled)
      .map(v => {
        return { id: v.id, name: v.name, language: v.language };
      });
    // 선택된음성을 초기화시킨다.    
    let selectedVoice = null;
    // 만약 사용가능한 음성들이 있다면...
    if (voices && voices.length > 0) {
      // 그 중 첫번째놈의 아이디를 선택된음성으로 지정.
      selectedVoice = voices[0].id;
      
      // 이후 필터링거친 사용가능음성들을 스테이트.사용가능음성들에,
      // 선택된 음성을 스테이트.선택된음성에 덮씌운다.
      // 그리고 tts스테이터스를 시작중에서 시작됨으로 바꾼다.
      this.setState({
        voices: availableVoices,
        selectedVoice,
        ttsStatus: "initialized",
        text: '아놔 시발'
      });
    // 만약 추출할 음성 자체가 없다면...어쨋든 걍 시작됨으로 바꿔라.
    } else {
      this.setState({ ttsStatus: "initialized", text:'실패다' });
    }
  };


  // readText라는 문구를 눌렀을때 발동. 이전의 재생을 멈추고 텍스트창의 텍스트를 읽는다.
  readText = async () => {
    Speech.stop()
        // 아마 텍스트입력창의 텍스트가 바뀔때마다 스테이트.텍스트를 업데이트하겠지?
    Speech.speak(
      this.state.text, {
        voice: this.state.selectedVoice,
        language: this.state.language,
        rate: this.state.speechRate,
        pitch: this.state.speechPitch
      }
    )
  };

  //주어진 시간에 몇 단어? = 스피드, 템포
  // rate라는 인수를 받아서 설정하는 메소드 시행하고, 현재의 스테이트에 반영.
  // 슬라이더를 통해서 시행되기 때문에 슬라이더 범위 내의 값을 전달 받을 예정임.
  setSpeechRate = async rate => {
    this.setState({ speechRate: rate });
  };
  // 음성 톤 설정. 위와 마찬가지
  setSpeechPitch = async rate => {
    this.setState({ speechPitch: rate });
  };

  // 아래의 음성리스트의 음성 선택시 발동. 원래는 언어도 따라서 선택하는데 해당 기능은 삭제하고 음성선택만 남긴다.
  onVoicePress = async voice => {
    this.setState({ selectedVoice: voice.identifier });
  };

  //이거 흠...당장은 불필요하지만 나중에 음성선택기능 넣을때 필요할듯.
  //선택가능한 음성들로 리스트 만들기.
  renderVoiceItem = ({ item }) => {
    // 음성이라는 오브젝트를 아이템이라는 인수로 받으면...
		// 이 인수를 가지고 정해진 방식으로 풀어서 '언어-언어이름' 형태의 버튼으로 만든다.
    // 받을 아이템의 오브젝트 구조를 알고 있다...
    // return { id: v.id, name: v.name, language: v.language };
    // 위 코드의 결과물이기에 아이디와 이름과 언어라는 속성이 있다.
    // 이 속성들을 가진 데이터를 표현할때 버튼의 제목은 아이템의 언어 - 아이템의 이름
    // 그리고 해당 버튼을 누르면 아이템을 인수로하는 아래의 언어설정 함수가 작동한다.
    return (
      <Button
        title={`${item.language} - ${item.name || item.id}`}
        color={this.state.selectedVoice === item.id ? undefined : "#969696"}
        //누르면 아래의 해당 아이템을 인수로하는 언어설정 시행.
        onPress={() => this.onVoicePress(item)}
      />
    );
  };
 
  render() {
    /*
     *       React Native TTS Example
     *             |Read text|
     *           Status: ready
     *    Selected Voice: com.apple....
     *      Speed: 0.50   ------o------
     *      Pitch: 1.00   -----o-------
     *  ________________________________
     * | This is an example text        |
     * |                                |
     * |________________________________|
     *           |de-DE - Anna|
     *          |en-GB - Arthur|
     *           |it-IT - Alice|
     */
    return ( 
      <View style={styles.container}> {/* //최상단 콘테이너. 위의 스테이터스창을 위해서 26띄운다. 여하늘색바탕지정.
      
        //타이틀양식으로 '리액트 네이티브 tts 예제' 라고 써져있다. */}
        <Text style={styles.title}>{`React Native TTS Example`}</Text>
        
        {/* '리드 텍스트'라 써져있는 버튼이 있고 누르면 리드.텍스트 함수 시행. */}
        <Button title={`Read text`} onPress={this.readText} />

        {/* // 상태 : 스테이트의 상태 인 작은 한 줄.
        // 달러 표시는 텍스트 조합할때 + + 할 것 없이 자동으로 반영하게 하는 그거 맞겠지.
        // || 이것의 기능은 앞에것이 있으면 앞의것을, 아니라면 뒤의것을 가져오라는 소리인듯. 일종의 or의 확장판?
        // 만약 스테이터스값이 있으면 가져오고 없으면 "" 공백을 반환해라? */}
        <Text style={styles.label}>{`Status: ${this.state.ttsStatus ||
          ""}`}</Text>

        {/* // 위와 마찬가지로 현재 선택된 음성을 한줄로 표현하게 함. */}
        <Text style={styles.label}>{`Selected Voice: ${this.state
          .selectedVoice || ""}`}</Text>

        {/* //슬라이더 컨테이너!!!
        // 이것 자체는 중앙배치와 상하 대신 좌우row 배열이라는 것 뿐임... */}
        <View style={styles.sliderContainer}>
          {/* // 따라서 아래의 텍스트와 슬라이더는 나란히 존재한다. */}
          <Text
            style={styles.sliderLabel} // 중앙배치에 오른쪽[슬라이더]으로부터 20마진
          >{`Speed: ${this.state.speechRate.toFixed(2)}`}</Text> 
          {/* // 스피치레이트 값을 소숫점 2자리까지 잘라서 표현.
          // 슬라이더. 좌우 기준 0.01~0.99 값 지정. 슬라이더의 현재값은 스테이트의 음성속도와 같다.  */}
          <Slider
            style={styles.slider} // 너비값width 150
            minimumValue={0.01}
            maximumValue={0.99}
            value={this.state.speechRate}
            onSlidingComplete={this.setSpeechRate} // 슬라이딩 조작 완료시 함수시행. (인수)를 안써도 자동으로 밸류를 전달하게 되는듯. 하긴...
          />
        </View>

        <View style={styles.sliderContainer}>
          <Text
            style={styles.sliderLabel}
          >{`Pitch: ${this.state.speechPitch.toFixed(2)}`}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={2}
            value={this.state.speechPitch}
            onSlidingComplete={this.setSpeechPitch}
          />
        </View>
        
        // 텍스트입력창. 
        <TextInput
          style={styles.textInput} // 너비100%
          multiline={true}  // 여러줄짜리.
          onChangeText={text => this.setState({ text })} // 내용이 바뀌면 텍스트를 스테이트의 텍스트에 대입
          value={this.state.text} // 이 입력창의 텍스트 값은 스테이트.텍스트임.
          onSubmitEditing={Keyboard.dismiss} //입력창의 제출버튼이 눌러지면 키보드해제. 근데 제출버튼이 어디야???
        />

        {/* // 위의 renderVoiceItem 반환함수로 얻은 데이터 형식을 출력할 것이다.
        // 키추출기는 각 요소를 구별하는 기능이다...뭐지 시발. 걍 그대로 하자. 오브젝트에 아이디가 있으면 어찌어찌 작동하겠지.
        // this.state.voices에는 필터링을 거친 모든 음성들이 리스트로 있다.
        // 데이터= 에 연결해서 이 음성리스트들을 리스트로 출력하게 만든다.
        // 엑스트라 데이터는 이와 연결된 스테이트 값이 바뀌면 리스트를 리렌더링을 하라는 지표이다. 
        // 선택된음성이 바뀌면 리스트 중 선택된  색상된 요소의 글자 색을 바꾸는 새로고침이 필요할테니 ㅇㅇ.
        // 이거 없으면 사실상 그냥 순수콤포넌트임. */}
        <FlatList
          keyExtractor={item => item.id}
          renderItem={this.renderVoiceItem}
          extraData={this.state.selectedVoice}
          data={this.state.voices}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 26,
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
    alignItems: "center"
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