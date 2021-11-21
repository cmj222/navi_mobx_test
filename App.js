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

export default class App extends React.Component {

  render(){

    return (
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={({ navigation }) => ({
          // 해당 네비게이터 내부의 스크린들이 공유하는 옵션
            title: null,
            headerLeft: () => (
            //좌상단에서부터 아이콘 생성
            //시발 이 아래를 없애서 탑바 자체를 없애려고하면
            //웹뷰상의 옵션이동버튼이 빨간 오류를 낸다...아마 상단에 뭐낙 존재해야한다는
            //합의가 있는 듯...            
              <View style={{flexDirection:"row"}}>
              </View>
            ),
            headerBackTitleVisible: false,
            headerBackAccessibilityLabel: false})}>
          <Stack.Screen name="WebB" component={WebB}  />
          <Stack.Screen name="Options" component={Options} />
          <Stack.Screen name="TextEditor" component={TextEditor} />
          
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}