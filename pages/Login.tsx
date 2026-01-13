import { useEffect, useState } from "react";
import { Button, Dialog, Portal, Text, TextInput } from "react-native-paper";
import { SafeAreaView, ToastAndroid, Image, useColorScheme, Linking } from "react-native";
import { HorarioIndividual, Login } from "../api/API.ts";
import MMKV from "../api/Database.ts";
import { APP_VERSION, DEFAULT_SEMESTRE } from "../helpers/Util.ts";

import analytics from '@react-native-firebase/analytics';
import { IVersionHistory } from "../api/APITypes.ts";

// @ts-ignore
export default function Entrar({ navigation }): React.JSX.Element {
    const [matr, setMatr] = useState<string>("")
    const [senha, setSenha] = useState<string>("")
    const [senhaVisivel, setSenhaVisivel] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const colorScheme = useColorScheme();
    const [updateAvailable, setUpdateAvailable] = useState(false);

    const openLink = () => {
        Linking.openURL("https://github.com/kkauaon/qaluno/releases/latest/download/qaluno.apk").catch(() => ToastAndroid.show("Não foi possível abrir o link.", ToastAndroid.LONG))
    }

    useEffect(() => {
        if (!__DEV__) analytics().setAnalyticsCollectionEnabled(true);

        const islog = MMKV.getBoolean("logged")
        if (islog) {
            navigation.replace("Home")
        } else {
            fetch('https://raw.githubusercontent.com/kkauaon/qaluno/main/version-history.json')
                .then(r => r.json())
                .then((res: IVersionHistory) => {
                    if (res.latest > APP_VERSION) {
                        setUpdateAvailable(true)
                    }
                }).catch(() => null)
        }

        const m = MMKV.getString("matricula")
        const s = MMKV.getString("senha")

        if (m && s) {
            setMatr(m)
            setSenha(s)
        }
    }, [])

    const log = () => {
        if (matr && senha) {
            setRefreshing(true)
            Login(matr, senha).then(async (data) => {
                console.log(data)
                MMKV.set("logged", true)
                MMKV.set("matricula", matr)
                MMKV.set("senha", senha)
                MMKV.set("usuario", JSON.stringify(data))
                
                let sem = MMKV.getString("current")

                if (!sem) {
                    MMKV.set("current", DEFAULT_SEMESTRE)
                    sem = DEFAULT_SEMESTRE
                }

                await HorarioIndividual(sem.split(".")[0], sem.split(".")[1]).then(data => {
                    MMKV.set(`horarios.${sem}`, JSON.stringify(data.horarios))
                }).catch(() => null)

                setRefreshing(false);
                // @ts-ignore   typings
                navigation.replace("Home")
            }).catch((err) => {
                ToastAndroid.show(err, ToastAndroid.LONG)
                setRefreshing(false);
            })            
        } else {
            ToastAndroid.show("Preencha todos os campos", ToastAndroid.SHORT)
        }

    }

    return (
        <SafeAreaView style={{ flex: 1, display: 'flex', flexDirection: 'column', rowGap: 20, justifyContent: 'center', alignItems: 'center' }}>
            <Portal>
				<Dialog visible={updateAvailable} onDismiss={() => setUpdateAvailable(false)}>
                    <Dialog.Title>Atualização disponível</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">Nova versão do aplicativo disponível. É necessário atualizar para continuar usando o aplicativo.{"\n\n"}Ao clicar em baixar, o download deve começar automaticamente, caso não, copie o link e insira manualmente no seu navegador.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={openLink}>Baixar</Button>
                    </Dialog.Actions>
				</Dialog>
			</Portal>
            <Image source={colorScheme == 'dark' ? require('../img/app_icon.png') : require('../img/app_icon_black.png')} style={{ width: 128, height: 128 }} />
            <Text variant="displayMedium">QAluno</Text>
            <Text variant="titleMedium">Aplicativo não oficial do Q-Acadêmico para IFCE</Text>
            <TextInput
                label="Matrícula"
                style={{ width: "80%" }}
                value={matr}
                onChangeText={text => setMatr(text)}
            />
            <TextInput
                label="Senha"
                style={{ width: "80%" }}
                value={senha}
                secureTextEntry={!senhaVisivel}
                onChangeText={text => setSenha(text)}
                right={
                    <TextInput.Icon 
                        icon={senhaVisivel ? "eye-off" : "eye"} 
                        onPress={() => setSenhaVisivel(!senhaVisivel)}
                    />
                }
            />
            <Button loading={refreshing} disabled={refreshing} onPress={() => log()} mode="contained" style={{ width: "80%" }} labelStyle={{ fontSize: 20, lineHeight: 35 }}>Entrar</Button>
            <Text style={{ position: 'absolute', bottom: 5, right: 5 }} variant="labelSmall">versão do app: {APP_VERSION}</Text>
        </SafeAreaView>
    )
}