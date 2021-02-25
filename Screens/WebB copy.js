import React, {Component} from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Keyboard,
    Image,
    TouchableHighlight,
    ActivityIndicator
} from "react-native";
import {WebView} from "react-native-webview";

// 텍스트에디터와 합치기 전 버전 보관

// 아이콘
import arrowBackIcon from '../assets/arrow_back.png';
import arrowNextIcon from '../assets/arrow_next.png';
import webIcon from '../assets/web.png';
import refreshIcon from '../assets/refresh_page.png';
import incognitoIcon from '../assets/incognito.png';

import TextStore from '../stores/TextStore'
import { observer} from 'mobx-react'

// keeps the reference to the browser ... 이건 역할이 뭐지
let browserRef = null;

// 브라우저 첫화면 주소
const url = 'https://namu.wiki/w/Fate/Grand%20Order/%ED%95%B4%EC%99%B8%20%EC%84%9C%EB%B9%84%EC%8A%A4/%ED%95%9C%EA%B5%AD/%EC%82%AC%EA%B1%B4%EC%82%AC%EA%B3%A0';

// 여러 검색엔진용 코드 있지만 생략해버림
const searchEngines = {
    'google': (uri) => `https://www.google.com/search?q=${uri}`,
};

// 주소로 개떡같이 입력해도 알아서 수정해주고, 규격외면 입력내용으로 구글검색.
function upgradeURL(uri, searchEngine = 'google') {
    const isURL = uri.split(' ').length === 1 && uri.includes('.');
    if (isURL) {
        if (!uri.startsWith('http')) {
            return 'https://www.' + uri;
        }
        return uri;
    }
    const encodedURI = encodeURI(uri);
    return searchEngines[searchEngine](encodedURI);
}

// javascript to inject into the window
const injectedJavaScript = `
      window.ReactNativeWebView.postMessage('injected javascript works!');
      true; // note: this is required, or you'll sometimes get silent failures   
`;

//비밀모드 관련 코드가 있음. 건들기 귀찮으니 걍 비밀모드 버튼만 없애자.
// 모벡스를 사용할 클래스의 바로 윗줄에 옵져버 데코레이터를 붙인다.
@observer
class Browser extends Component {
    state = {
        currentURL: url,
        urlText: url,
        title: '',
        canGoForward: false,
        canGoBack: false,
        incognito: false,
        // change configurations so the user can
        // better control the browser
        config: {
            detectorTypes: 'all',
            allowStorage: true,
            allowJavascript: true,
            allowCookies: true,
            allowLocation: true,
            allowCaching: true,
            defaultSearchEngine: 'google'
        }
    };

    // 텍스트 입력창의 텍스트를 주소로 연결하는 함수
    loadURL = () => {
        // 스테이트에서 설정값, 첫화면주소, 기본검색엔진을 가져온다. 주소가 이상하면 개선하는 함수거쳐서 주소값 반환받는다.
        const {config, urlText} = this.state;
        const { defaultSearchEngine } = config;
        const newURL = upgradeURL(urlText, defaultSearchEngine);
        
        // 반환된 주소값을 기존 주소값에 덮씌
        this.setState({
            currentURL: newURL,
            urlText: newURL
        });

        Keyboard.dismiss();
    };

    // 주소창에 입력된 텍스트를 스테이트의 주소창텍스트에 덮기 함수.
    updateUrlText = (text) => {
        this.setState({
            urlText: text
        });
    };

    //앞으로, 뒤로, 새로고침 기능 함수. 내버려두자.
    goForward = () => {
        if (browserRef && this.state.canGoForward) {
            browserRef.goForward();
        }    };
    goBack = () => {
        if (browserRef && this.state.canGoBack) {
            browserRef.goBack();
        }    };
    reload = () => {
        if (browserRef) {
            browserRef.reload();
        }    };

    // set the reference for the browser
    setBrowserRef = (browser) => {
        if (!browserRef) {
            browserRef = browser
        }    };

    // called when there is an error in the browser
    onBrowserError = (syntheticEvent) => {
        const {nativeEvent} = syntheticEvent;
        console.warn('WebView error: ', nativeEvent)
    };

    // 웹뷰가 로드되거나 페이지가 로드된 경우의 시행함수들. 현재상태를 반영한 상태값[앞뒤이동가능여부, 타이틀]을 스테이트에 덮씌.
    onBrowserLoad = (syntheticEvent) => {
        const { canGoForward, canGoBack, title} = syntheticEvent.nativeEvent;
        this.setState({
            canGoForward,
            canGoBack,
            title
        })
    };
    onNavigationStateChange = (navState) => {
        const {canGoForward, canGoBack, title} = navState;
        this.setState({
            canGoForward,
            canGoBack,
            title
        })    
    };

    // 원래 위의 네비게이션스테이트체인지를 통해서 주소변경을 감지하지만 어쩌선지 안되서 이걸로 대신 댐빵....
    onLoadProgress = (syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        TextStore.UrlForFetching(nativeEvent.url)
        console.log(TextStore.UrlForFetch)
        console.log('작동완료')
    }
    
    filterRequest = (request) => {
        return true;
    };

    // called when the browser sends a message using "window.ReactNativeWebView.postMessage"
    onBrowserMessage = (event) => {
        console.log('*'.repeat(10));
        console.log('Got message from the browser:', event.nativeEvent.data);
        console.log('*'.repeat(10));
    };

    render() {
        const {config, state} = this;
        const {currentURL, urlText, canGoForward, canGoBack, title, incognito} = state;

        //TextStore.UrlForFetching(currentURL)
        // 작동안한다...여기가 아닌듯. 다른곳에서 구현 ㄱㄱ
        // const {currentURL} = this.state
        // TextStore.UrlForFetching(currentURL)
        // console.log(currentURL + '커런트유알엘')
        // console.log(TextStore.UrlForFetch + '스토어에 저장된 주소')

        
        return (
            <View style={styles.root}>
                <View style={styles.browserContainer}>

                    <WebView
                        ref={this.setBrowserRef}
                        originWhitelist={['*']}
                        source={{uri: currentURL}}
                        onLoad={this.onBrowserLoad}
                        onError={this.onBrowserError}
                        onNavigationStateChange={this.onNavigationStateChange}
                        renderLoading={() => <ActivityIndicator size="large" color="#0000ff" /> }
                        onShouldStartLoadWithRequest={this.filterRequest}
                        onMessage={this.onBrowserMessage}
                        injectedJavaScript={injectedJavaScript}
                        onLoadProgress={this.onLoadProgress}
                    />
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    browser: {
        flex: 1
    },
    root: {
        flex: 1,
        backgroundColor: 'skyblue'
    },
    icon: {
        width: 30,
        height: 30,
        resizeMode: 'contain'
    },
    disabled: {
        opacity: 0.3
    },
    browserTitleContainer: {
      height: 30,
      justifyContent: 'center',
      paddingLeft: 8
    },
    browserTitle: {
        fontWeight: 'bold'
    },
    browserBar: {
        height: 40,
        backgroundColor: 'steelblue',
        flexDirection: 'row',
        alignItems: 'center'
    },
    browserAddressBar: {
        height: 40,
        backgroundColor: 'white',
        borderRadius: 3,
        flex: 1,
        borderWidth: 0,
        marginRight: 8,
        paddingLeft: 8
    },
    browserContainer: {
        flex: 2
    }
});

export default Browser;
