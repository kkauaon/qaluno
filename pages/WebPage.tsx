import { SafeAreaView } from "react-native";
import WebView, { WebViewNavigation } from "react-native-webview";

// @ts-ignore typings
export default function WebPage({ route, navigation }): React.JSX.Element {
    const { url }: { url: string } = route.params

    const handleState = (state: WebViewNavigation) => {
        navigation.setOptions({ title: state.title || "Página" })
    }

    return (
        <SafeAreaView style={{flex:1}}>
            <WebView source={{ uri: url }} onNavigationStateChange={handleState} />
        </SafeAreaView>
    )
}