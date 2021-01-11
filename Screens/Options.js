import * as React from 'react';
import { Button, View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

export default class TextEditor extends React.Component {
    navigate = this.props.navigation;
    render() {
        return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>

            <Button title="Go back" onPress={() => this.props.navigation.goBack()} />
        </View>
        )}
}


// function Options({ navigation }){  
//     return (
//         <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
//         <Button title="Go back" onPress={() => navigation.goBack()} />
//         </View>
//     );