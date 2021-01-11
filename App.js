import * as React from 'react';
import { Button, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { Ionicons } from '@expo/vector-icons'; 

import WebB from './Screens/WebB'
import TextEditor from './Screens/TextEditor'
import Options from './Screens/Options'

const Stack = createStackNavigator();

function MyStack() {
  return (
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
              onPress={() => navigation.navigate('Profile')} 
              name="content-save" size={50} />
            <Ionicons  
              onPress={() => navigation.navigate('Profile')}
              name="md-folder-open"size={50} />
            <Ionicons
              onPress={() => navigation.navigate('Options')} 
              name="md-options" size={50} />
          </View>
        ),
        headerBackTitleVisible: false,
        headerBackAccessibilityLabel: false})}>
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

// 하 시바...클래스로 통합하는거 왜 안되지?
// const Stack = createStackNavigator();

// export default class App extends React.Component {
//   render(){
//     return (
//       <NavigationContainer>
//         <Stack.Navigator screenOptions={{
//           title: null,
//           headerLeft: () => (
//             <View style={{flexDirection:"row"}}>
//               <MaterialCommunityIcons 
//                 onPress={() => navigation.navigate('Profile')} 
//                 name="home" size={50} />
//               <MaterialCommunityIcons 
//                 onPress={() => navigation.navigate('Profile')} 
//                 name="web" size={50} />
//               <MaterialCommunityIcons 
//                 onPress={() => navigation.navigate('Profile')} 
//                 name="file-document" size={50} />
//               <Ionicons
//                 onPress={() => navigation.navigate('Profile')} 
//                 name="md-megaphone" size={50} />
//               <MaterialCommunityIcons 
//                 onPress={() => navigation.navigate('Profile')} 
//                 name="content-save" size={50} />
//               <Ionicons  
//                 onPress={() => navigation.navigate('Profile')}
//                 name="md-folder-open"size={50} />
//               <Ionicons
//                 onPress={() => navigation.navigate('Profile')} 
//                 name="md-options" size={50} />
//             </View>
//         ),
//         headerBackTitleVisible: false,
//         headerBackAccessibilityLabel: false,
//         headerBackTitle:'시발년아'}}>
//           <Stack.Screen name="WebB" component={WebB}  />
//           <Stack.Screen name="TextEditor" component={TextEditor} />
//           <Stack.Screen name="Options" component={Options} />
//         </Stack.Navigator>      );  }
//       </NavigationContainer>
//     );
//   }
// }