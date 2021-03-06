import * as React from 'react';
import { Button, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { Ionicons } from '@expo/vector-icons'; 

import WebB from './Screens/WebB'
import TextEditor from './Screens/TextEditor'
import Options from './Screens/Options'

import { observable, action} from 'mobx'
import { observer, inject } from 'mobx-react'
import { Provider } from "mobx-react";

Stack = createStackNavigator();

// 구름에서 푸쉬 확인용

export default class App extends React.Component {

  // 일단 최상단 클래스에서 스토어 구현은 포기하자...각 화면을 나타내는 클래스로 가서 구현해보자...
  // TextStore =this.props
 

  // test1() {
  //   TextStore.addUser('모벡스 테스트용 저장 스트링')
  // }

  // test2() {
  //   console.log(TextStore.TextAtoB)
  //   console.log('한번 작동함.')
  // }

  render(){

    return (
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={({ navigation }) => ({
          // 해당 네비게이터 내부의 스크린들이 공유하는 옵션
            title: null,
            headerLeft: () => (
            //좌상단에서부터 아이콘 생성
            
              <View style={{flexDirection:"row"}}>
                <MaterialCommunityIcons 
                  onPress={() => navigation.navigate('WebB')} 
                  name="home" size={50} />
                <MaterialCommunityIcons 
                  onPress={() => navigation.navigate('WebB')} 
                  name="web" size={50} />
                <MaterialCommunityIcons 
                  onPress={() => navigation.navigate('TextEditor')} 
                  name="file-document" size={50} />
                <Ionicons
                  onPress={() => navigation.navigate('TextEditor')} 
                  name="md-megaphone" size={50} />
                <MaterialCommunityIcons 
                  //onPress={() => MobxStore.addUser('모벡스 테스트용 저장 스트링')} 
                  name="content-save" size={50} />
                <Ionicons  
                  //onPress={() => console.log(MobxStore.TextAtoB)}
                  name="md-folder-open"size={50} />
                <Ionicons
                  onPress={() => navigation.navigate('Options')} 
                  name="md-options" size={50} />
              </View>
            ),
            headerBackTitleVisible: false,
            headerBackAccessibilityLabel: false})}>
          <Stack.Screen name="Options" component={Options} />
          <Stack.Screen name="WebB" component={WebB}  />
          <Stack.Screen name="TextEditor" component={TextEditor} />
          
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}