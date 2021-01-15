import * as React from 'react';
import { Button, View, StyleSheet } from 'react-native';

import TextStore from '../stores/TextStore'

import { observer } from 'mobx-react'

@observer
export default class TextEditor extends React.Component {
    navigate = this.props.navigation;
    render() {
        return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>

            <Button title="Go back" onPress={() => this.props.navigation.goBack()} />
            <Button title="옵션스크린에서 옵션이라 저장하기" onPress={() => TextStore.addUser('옵션스크린')} />
            <Button title="옵션스크린에서 읽어내기" onPress={() => console.log(TextStore.TextAtoB)} />
        </View>
        )}
}