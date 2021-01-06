import * as React from 'react';
import { Button, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { Ionicons } from '@expo/vector-icons'; 

export default function MyStack(){
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
  };