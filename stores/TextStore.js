import { observable, action } from 'mobx'

class TextStore {
  constructor() {
    this.TextAtoB = '시발 좀'
  }

  @observable TextAtoB = '아놔 시발'

  // 크롤링할 주소 관련
  @observable UrlForFetch = 'https://namu.wiki/random'

  @action.bound
  UrlForFetching(Text) {
    this.UrlForFetch = Text
  }

  // 크롤링 옵션들
  @observable footnote_Checked = true
  
  @action.bound
  footnote_toggle() {
    this.footnote_Checked = !this.footnote_Checked
    console.log('스토어의 변경 함수상 값은 '+ this.footnote_Checked)
  }

  // tts 관련 설정들.
  @observable selectedVoice = null
  @observable speechRate = 1
  @observable speechPith = 1

  @action.bound
  ST_set_selecedVoice(voice) {
    this.selectedVoice = voice
    console.log("텍스트스토어상의 선택된음성은 다음과 같음 : " + voice)
  }

  @action.bound
  ST_setSpeechRate(rate) {
    this.speechRate = rate
    console.log(rate)
    console.log(this.speechRate)
  }




}

  export default new TextStore()
  // 시발...!! 이거 안써서 그랬냐?????