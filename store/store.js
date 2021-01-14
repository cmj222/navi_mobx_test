import { observable, action } from 'mobx'

class Store {
  @observable TextAtoB

  @observable counter = [{counterNum: 0}]
	
  constructor() {
    this.TextAtoB
  }

  @action.bound
  addUser(getText) {
    this.TextAtoB = getText
  }}

export default Store