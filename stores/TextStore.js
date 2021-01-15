import { observable, action } from 'mobx'

class TextStore {
  @observable TextAtoB = '아놔 시발'

  @observable counter = [{counterNum: 0}]

  @observable UrlForFetch = '기본값'
	
  constructor() {
    this.TextAtoB = '시발 좀'
  }

  @action.bound
  addUser(getText) {
    this.TextAtoB = getText
  }

  @action.bound
  UrlForFetching(Text) {
    this.UrlForFetch = Text
  }}

  export default new TextStore()
  // 시발...!! 이거 안써서 그랬냐?????