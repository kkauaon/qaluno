import { useEffect, useState } from "react";
import { Button, Text, TextInput } from "react-native-paper";
import { SafeAreaView, ToastAndroid } from "react-native";
import { HorarioIndividual, Login } from "../API/QAPI";
import MMKV from "../API/Database.ts";
import { useNavigation } from "@react-navigation/native";

// @ts-ignore
export default function Entrar({ navigation }): React.JSX.Element {
    const [matr, setMatr] = useState<string>("")
    const [senha, setSenha] = useState<string>("")
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
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
                    MMKV.set("current", "2024.1")
                    sem = "2024.1"
                }

                // @ts-ignore
                await HorarioIndividual(sem.split(".")[0], sem.split(".")[1]).then(data => {
                    MMKV.set(`horarios.${sem}`, JSON.stringify(data.horarios))
                }).catch(() => null)

                setRefreshing(false);
                // @ts-ignore
                navigation.replace("Home")
            }).catch((err) => {
                console.error(err)
                ToastAndroid.show("Falha no login", ToastAndroid.SHORT)
                setRefreshing(false);
            })            
        } else {
            ToastAndroid.show("Preencha todos os campos", ToastAndroid.SHORT)
        }

    }

    return (
        <SafeAreaView style={{ flex: 1, display: 'flex', flexDirection: 'column', rowGap: 30, justifyContent: 'center', alignItems: 'center' }}>
            <Text variant="displayMedium">QAluno</Text>
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