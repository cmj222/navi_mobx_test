import * as React from 'react';
import { Button, View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { TextInput } from 'react-native';
import { Dimensions } from "react-native"

import TextStore from '../stores/TextStore'

import { observer} from 'mobx-react'

@observer
export default class TextEditor extends React.Component {
    navigate = this.props.navigation;

    state = { Text : ''}

    updateUrlText = (text) => {
        this.setState({
            Text: text
        });
    };
 
    test1 = () => {
      TextStore.addUser('테스트1함수를 통해서 작동')
    }
  
    test2 = () => {
      console.log(TextStore.TextAtoB)
      console.log(TextStore.UrlForFetch)
    }

    render() {
        console.log(TextStore.UrlForFetch)
        const state = this
        const {Text} = state
        return (

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <TextInput 
                style={{ 
                    flex: 90,
                    //height: Dimensions.get('screen').height * 0.75, 
                    width: Dimensions.get('screen').width * 0.99, 
                    borderColor: 'white', borderWidth: 1,
                    fontSize: 20
                    }}
                onChangeText={this.updateUrlText}
                value={Text}
                multiline={true}
            />
            <View style={{flexDirection: 'row', flex: 10}}>
                <Button
                    title="설정으로 가기"
                    onPress={this.onPressButton.bind(this)}
                />
                <Button title="Go back" onPress={() => this.props.navigation.goBack()} />
                <Button title="save" onPress={() => this.test1()} />
                <Button title="read" onPress={() => this.test2()} />
            </View>
            
        </View>
        )}

    onPressButton() {
        const { navigate } = this.props.navigation;
        
        this.props.navigation.navigate('Options')
        }
    }