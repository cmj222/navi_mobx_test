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

// 아이콘들은 이런 방식으로 부르는군.
// 이러고 렌더할때 태그 생성하면서 
// <Image source={arrowBackIcon}/> 하는식으로 연결.
import arrowBackIcon from '../assets/arrow_back.png';
import arrowNextIcon from '../assets/arrow_next.png';
import webIcon from '../assets/web.png';
import refreshIcon from '../assets/refresh_page.png';
import incognitoIcon from '../assets/incognito.png';

// keeps the reference to the browser
// 이건 역할이 뭐지
let browserRef = null;

// initial url for the browser
const url = 'http://www.namu.wiki';

// functions to search using different engines
const searchEngines = {
    'google': (uri) => `https://www.google.com/search?q=${uri}`,
};

// upgrade the url to make it easier for the user:
//
// https://www.facebook.com => https://www.facebook.com
// facebook.com => https://www.facebook.com
// facebook => https://www.google.com/search?q=facebook
function upgradeURL(uri, searchEngine = 'google') {
    const isURL = uri.split(' ').length === 1 && uri.includes('.');
    if (isURL) {
        if (!uri.startsWith('http')) {
            return 'https://www.' + uri;
        }
        return uri;
    }
    // search for the text in the search engine
    const encodedURI = encodeURI(uri);
    return searchEngines[searchEngine](encodedURI);
}

// javascript to inject into the window
const injectedJavaScript = `
      window.ReactNativeWebView.postMessage('injected javascript works!');
      true; // note: this is required, or you'll sometimes get silent failures   
`;

//비밀모드 관련 코드가 있음. 건들기 귀찮으니 걍 비밀모드 버튼만 없애자.
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

    // 텍스트 입력창의 텍스트를 주소로 연결 
    loadURL = () => {
        // 스테이트의 주소텍스트를 가져오고, 기본검색엔진도 가져온다.
        // 새로운주소 값으로 가져온것들을 조합
        const {config, urlText} = this.state;
        const { defaultSearchEngine } = config;
        // 앞에서 다룬, 텍스트에 공백이 있는지, '.'을 포함하는지 등을 체크하여 적합한 주소 혹은 검색창직행을 반환
        const newURL = upgradeURL(urlText, defaultSearchEngine);

        // 반환된 값을 현재주소와 주소창 텍스트로 덮기.
        this.setState({
            currentURL: newURL,
            urlText: newURL
        });

        //키보드 입력모드 해제
        Keyboard.dismiss();
    };

    // 주소창에 입력된 텍스트를 스테이트의 주소창텍스트에 덮기.
    updateUrlText = (text) => {
        this.setState({
            urlText: text
        });
    };

    //앞으로, 뒤로 기능 함수는 내버려두자
    // go to the next page
    goForward = () => {
        if (browserRef && this.state.canGoForward) {
            browserRef.goForward();
        }
    };

    // go back to the last page
    goBack = () => {
        if (browserRef && this.state.canGoBack) {
            browserRef.goBack();
        }
    };

    // reload the page
    reload = () => {
        if (browserRef) {
            browserRef.reload();
        }
    };

    // set the reference for the browser
    setBrowserRef = (browser) => {
        if (!browserRef) {
            browserRef = browser
        }
    };

    // called when there is an error in the browser
    onBrowserError = (syntheticEvent) => {
        const {nativeEvent} = syntheticEvent;
        console.warn('WebView error: ', nativeEvent)
    };

    // called when the webview is loaded
    onBrowserLoad = (syntheticEvent) => {
        const {canGoForward, canGoBack, title} = syntheticEvent.nativeEvent;
        this.setState({
            canGoForward,
            canGoBack,
            title
        })
    };

    // called when the navigation state changes (page load)
    onNavigationStateChange = (navState) => {
        const {canGoForward, canGoBack, title} = navState;
        this.setState({
            canGoForward,
            canGoBack,
            title
        })
    };

    // can prevent requests from fulfilling, good to log requests
    // or filter ads and adult content.
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
