import { useEffect, useState } from "react";
import { Button, Text, TextInput } from "react-native-paper";
import { SafeAreaView, ToastAndroid, Image } from "react-native";
import { HorarioIndividual, Login } from "../api/API.ts";
import MMKV from "../api/Database.ts";
import { DEFAULT_SEMESTRE } from "../helpers/Util.ts";

import analytics from '@react-native-firebase/analytics';

// @ts-ignore
export default function Entrar({ navigation }): React.JSX.Element {
    const [matr, setMatr] = useState<string>("")
    const [senha, setSenha] = useState<string>("")
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        if (!__DEV__) analytics().setAnalyticsCollectionEnabled(true);

        const islog = MMKV.getBoolean("logged")
        if (islog) {
            navigation.replace("Home")
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

                // @ts-ignore
                await HorarioIndividual(sem.split(".")[0], sem.split(".")[1]).then(data => {
                    MMKV.set(`horarios.${sem}`, JSON.stringify(data.horarios))
                }).catch(() => null)

                setRefreshing(false);
                // @ts-ignore
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
            <Image source={require('../img/app_icon.png')} style={{ width: 128, height: 128 }} />
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
                secureTextEntry
                onChangeText={text => setSenha(text)}
            />
            <Button loading={refreshing} disabled={refreshing} onPress={() => log()} mode="contained" style={{ width: "80%" }} labelStyle={{ fontSize: 20, lineHeight: 35 }}>Entrar</Button>
        </SafeAreaView>
    )
}