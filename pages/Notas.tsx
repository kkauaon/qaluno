import { useCallback, useEffect, useState } from "react";
import { Linking, RefreshControl, SafeAreaView, ScrollView, StyleSheet, ToastAndroid, View } from "react-native";
import { Banner, Button, Dialog, Portal, Text, useTheme } from "react-native-paper";
import { Avaliacoes, Boletim, Login } from '../api/API.ts';
import { IDiario, IVersionHistory } from "../api/APITypes.ts";
import MMKV from "../api/Database.ts";
import { useFocusEffect } from "@react-navigation/native";
import Diario from "../components/Diario.tsx";
import { useMMKVBoolean, useMMKVString } from "react-native-mmkv";

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { APP_VERSION, DEFAULT_SEMESTRE, randomHexColor } from "../helpers/Util.ts";

import analytics from '@react-native-firebase/analytics';

// @ts-ignore
export default function Grades({ navigation }): React.JSX.Element {
    const theme = useTheme()

    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<IDiario[]>([])

    const [sem, setSem] = useMMKVString("current")
    const [dontshowagain, setdontshowagain] = useMMKVBoolean("dontshowagain.grades")

    useFocusEffect(
        useCallback(() => {
            fetch('https://raw.githubusercontent.com/kkauaon/qaluno/main/version-history.json').then(r => r.json())
            .then((res: IVersionHistory) => {
                if (res.latest > APP_VERSION) {
                    setUpdateAvailable(true)
                }
            }).catch(() => null)
            
            return () => {
            };
        }, [])
    )

    useEffect(() => {
        if (!sem) setSem(DEFAULT_SEMESTRE)

        const d = MMKV.getString(`semestre.${sem}`)
        let registeredData: IDiario[];

        if (d) {
            registeredData = JSON.parse(d) as IDiario[]
            setData(registeredData)
        } else {
            setData([])
        }

        
        // Produção apenas ----

        if (!__DEV__) {
        setRefreshing(true);

        Login(MMKV.getString("matricula"), MMKV.getString("senha")).then(() => {

            Boletim(sem?.split(".")[0], sem?.split(".")[1]).then(async dataa => {
                for (let diario of dataa) {
                    if (!MMKV.getString("cordisciplina." + diario.descricao)) {
                        MMKV.set("cordisciplina." + diario.descricao, randomHexColor())
                    }
                }

                setData(dataa)
                MMKV.set(`semestre.${sem}`, JSON.stringify(dataa))
                if (!__DEV__) await analytics().logEvent('recarregar_presencas').catch((e) => console.log(e))
                setRefreshing(false);
            }).catch(() => {
                setRefreshing(false);
            })
        }).catch((err) => {
            console.error(err)
            ToastAndroid.show("Falha no login", ToastAndroid.SHORT)
            setRefreshing(false);
        })
        }
        // --------------
        
    }, [])

    const onRefresh = useCallback((isSecondTry?: boolean) => {
        setRefreshing(true);

        const d = MMKV.getString(`semestre.${sem}`)
        let registeredData: IDiario[];

        if (d) {
            registeredData = JSON.parse(d) as IDiario[]
        }

        Boletim(sem?.split(".")[0], sem?.split(".")[1]).then(async dataa => {
            for (const dz of dataa) {
                const data2 = await Avaliacoes(dz.idDiario).catch(() => null)

                if (data2)
                    MMKV.set(`avaliacoes.${dz.idDiario}`, JSON.stringify(data2))
            }

            for (let diario of dataa) {
                if (!MMKV.getString("cordisciplina." + diario.descricao)) {
                    MMKV.set("cordisciplina." + diario.descricao, randomHexColor())
                }
            }

            setData(dataa)
            MMKV.set(`semestre.${sem}`, JSON.stringify(dataa))

            await analytics().logEvent('recarregar_notas').catch((e) => console.log(e))

            setRefreshing(false);
        }).catch(() => {
            if (isSecondTry) {
                ToastAndroid.show("Entre novamente", ToastAndroid.SHORT)
                setRefreshing(false);
                MMKV.set(`logged`, false)
                navigation.replace("Login")
            } else {

                Login(MMKV.getString("matricula"), MMKV.getString("senha")).then(() => {
                    setRefreshing(false);
                    
                    onRefresh(true)
                }).catch((err) => {
                    console.error(err)
                    ToastAndroid.show("Falha no login", ToastAndroid.SHORT)
                    setRefreshing(false);
                })  
            }

        })

    }, []);

	const [visible, setVisible] = useState(false);
    const [banner, setBanner] = useState(true);
    const [alertData, setAlertData] = useState("");
    const [updateAvailable, setUpdateAvailable] = useState(false);
	const hideDialog = () => setVisible(false);
    const showDialog = (msg: string) => {
        setAlertData(msg)
        setVisible(true);
    }
    const openLink = () => {
        Linking.openURL("https://github.com/kkauaon/qaluno/releases/latest/download/qaluno.apk").catch(() => ToastAndroid.show("Não foi possível abrir o link.", ToastAndroid.LONG))
    }

    return (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <Portal>
				<Dialog visible={visible} onDismiss={hideDialog}>
                    <Dialog.Title>Nova nota em</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">{alertData}</Text>
                    </Dialog.Content>
				</Dialog>
			</Portal>
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
            <SafeAreaView style={{ padding: 20 }}>
                {!dontshowagain ? <Banner
                    visible={banner}
                    style={{ margin: -20, marginBottom: 20 }}
                    actions={[
                        {
                            label: "Não mostrar novamente",
                            onPress: () => setdontshowagain(true)
                        },
                        {
                            label: 'Ok',
                            onPress: () => setBanner(false),
                        }
                    ]}
                    icon={({size}) => (
                        <MaterialCommunityIcons name="bell-alert" size={size} />
                    )}
                >
                    ATENÇÃO! O app não verifica suas notas automaticamente. Arraste para baixo para verificar se há alguma nota nova.
                </Banner>
                : null }
                <Text variant="titleMedium">{sem?.split(".")[0]} / {sem?.split(".")[1]}</Text>

                <Text variant="labelSmall">Última verificação de notas: {MMKV.getString(`verificacoes.notas`) || "nunca"}</Text>
                <Text variant="labelSmall">Última verificação de presenças: {MMKV.getString(`verificacoes.${sem?.split(".")[0]}.${sem?.split(".")[1]}.presencas`) || "nunca"}</Text>

                {data.length > 0 ? data.map(diario => <Diario key={diario.idDiario} cor={MMKV.getString("cordisciplina."+diario.descricao)||"#ffffff"} diario={diario} show={showDialog} navigation={navigation} saved={MMKV.getString(`avaliacoes.${diario.idDiario}`)||"[]"} />) :
                <View style={styles.container}>
                    <Text variant="titleMedium">{"\n"}Veja como é simples de usar:{"\n"}1. Arraste para baixo toda vez que quiser verificar suas notas!{"\n"}2. As presenças são atualizadas automaticamente!{"\n"}3. Como é sua primeira vez, comece arrastando para baixo!</Text>
                </View>
                }             
            </SafeAreaView>

        </ScrollView>
        
    )
}

const styles = StyleSheet.create({
    notas: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
        height: 50,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    nota: {
        backgroundColor: "green",
        borderRadius: 50,
        width: 40,
        height: 25,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },
    quadrado: {
        backgroundColor: "white",
        width: 18,
        height: 18,
        borderRadius: 5
    },
    faltas: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },
    container: {
        display: "flex",
        justifyContent: "flex-start",
        textAlign: "left"
    }
})