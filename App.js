import * as React from 'react';
import { Button, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { Ionicons } from '@expo/vector-icons'; 

// 깃허브 업로드 테스트
// 브랜치 테스트
// 강제병합 테스트

function WebB({ navigation }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button
        title="텍스트에디터로 가기 테스트"
        onPress={() => navigation.navigate('TextEditor')}
      />
    </View>
  );}

function TextEditor({ navigation }){ 
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button
        title="설정으로 가기"
        onPress={() => navigation.navigate('Options')}
      />
      <Button title="Go back" onPress={() => navigation.goBack()} />
    </View>
  );
}

function Options({ navigation }){  
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button title="Go back" onPress={() => navigation.goBack()} />
    </View>
  );
}

const Stack = createStackNavigator();

function MyStack() {
  return (
    <Stack.Navigator screenOptions={{
      title: null,
      headerLeft: () => (
        <View style={{flexDirection:"row"}}>
          <MaterialCommunityIcons 
            onPress={() => navigation.navigate('Profile')} 
            name="home" size={50} />
          <MaterialCommunityIcons 
            onPress={() => navigation.navigate('Profile')} 
            name="web" size={50} />
          <MaterialCommunityIcons 
            onPress={() => navigation.navigate('Profile')} 
            name="file-document" size={50} />
          <Ionicons
            onPress={() => navigation.navigate('Profile')} 
            name="md-megaphone" size={50} />
          <MaterialCommunityIcons 
            onPress={() => navigation.navigate('Profile')} 
            name="content-save" size={50} />
          <Ionicons  
            onPress={() => navigation.navigate('Profile')}
            name="md-folder-open"size={50} />
          <Ionicons
            onPress={() => navigation.navigate('Profile')} 
            name="md-options" size={50} />
        </View>
    ),
    headerBackTitleVisible: false,
    headerBackAccessibilityLabel: false,
    headerBackTitle:'시발년아'}}>
      <Stack.Screen name="WebB" component={WebB}  />
      <Stack.Screen name="TextEditor" component={TextEditor} />
      <Stack.Screen name="Options" component={Options} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <MyStack />
    </NavigationContainer>
  );
}
//웨더앱에서 다른 js파일에서 익스폴트 디폴트 펑션 함수명 한 다음 클래스가 있는 앱.ㅈㅅ에서 임포트하고 렌더의 리턴에서 활용...
// 왜 여기서는 안되지? 일단 렌더 안에 쑤셔넣자...이거 생각해두며 다른 예제 보다보면 알게 되겠지...