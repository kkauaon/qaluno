import { useCallback, useEffect, useState } from "react";
import { FlatList, Linking, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, ToastAndroid, TouchableNativeFeedback, View } from "react-native";
import { Banner, Button, DataTable, Dialog, Divider, Portal, Text, TouchableRipple, useTheme } from "react-native-paper";
import { Circle, G, Svg } from "react-native-svg";
import { Avaliacoes, Boletim, Login } from '../API/QAPI.ts';
import { IDiario, IVersionHistory } from "../API/APITypes.ts";
import MMKV from "../API/Database.ts";
import { useFocusEffect } from "@react-navigation/native";
import Diario from "../Components/Diario.tsx";
import { useMMKVString } from "react-native-mmkv";

// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { APP_VERSION } from "../Helpers/Util.ts";

// @ts-ignore
export default function Grades({ navigation }): React.JSX.Element {
    const theme = useTheme()

    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<IDiario[]>([])

    const [sem, setSem] = useMMKVString("current")

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
        if (!sem) setSem("2024.1")

        const d = MMKV.getString(`semestre.${sem}`)
        
        if (d) {
            setData(JSON.parse(d) as IDiario[])
        } else {
            setData([])
        }

        
        // Produção apenas ----

        setRefreshing(true);
        //@ts-ignore
        Login(MMKV.getString("matricula"), MMKV.getString("senha")).then(() => {
            // @ts-ignore
            Boletim(sem.split(".")[0], sem.split(".")[1]).then(async dataa => {
                setData(dataa)
                MMKV.set(`semestre.${sem}`, JSON.stringify(dataa))

                setRefreshing(false);
            }).catch(() => {
                setRefreshing(false);
            })
        }).catch((err) => {
            console.error(err)
            ToastAndroid.show("Falha no login", ToastAndroid.SHORT)
            setRefreshing(false);
        })

        // --------------
        
    }, [])

    const onRefresh = useCallback((isSecondTry?: boolean) => {
        setRefreshing(true);

        // @ts-ignore
        Boletim(sem.split(".")[0], sem.split(".")[1]).then(async dataa => {
            for (const dz of dataa) {
                const data2 = await Avaliacoes(dz.idDiario).catch(() => null)

                if (data2)
                    MMKV.set(`avaliacoes.${dz.idDiario}`, JSON.stringify(data2))
            }

            setData(dataa)
            MMKV.set(`semestre.${sem}`, JSON.stringify(dataa))

            setRefreshing(false);
        }).catch(() => {
            if (isSecondTry) {
                ToastAndroid.show("Entre novamente", ToastAndroid.SHORT)
                setRefreshing(false);
                MMKV.set(`logged`, false)
                navigation.replace("Login")
            } else {
                //@ts-ignore
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
        Linking.openURL("https://github.com/kkauaon/qaluno/releases/latest/download/qaluno.apk").catch(() => ToastAndroid.show("Erro ao abrir link", ToastAndroid.LONG))
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
                        <Text variant="bodyMedium">Nova versão do aplicativo disponível. Atualize agora.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={openLink}>Atualizar</Button>
                    </Dialog.Actions>
				</Dialog>
			</Portal>
            <SafeAreaView style={{ padding: 20 }}>
                <Banner
                    visible={banner}
                    style={{ margin: -20, marginBottom: 20 }}
                    actions={[
                        {
                        label: 'OK',
                        onPress: () => setBanner(false),
                        }
                    ]}
                    icon={({size}) => (
                        <MaterialCommunityIcons name="bell-alert" size={size} />
                    )}
                >
                    ATENÇÃO! O app não verifica suas notas automaticamente. Role para baixo para verificar se há alguma nota nova.
                </Banner>
                <Text variant="titleMedium">{sem?.split(".")[0]} / {sem?.split(".")[1]}</Text>
                {data.length > 0 ? data.map(diario => <Diario key={diario.idDiario} diario={diario} show={showDialog} navigation={navigation} saved={MMKV.getString(`avaliacoes.${diario.idDiario}`)||"[]"} />) :
                <View style={styles.faltas}>
                    <Text variant="titleLarge" style={{textAlign: 'center'}}>{"\n"}Sem disciplinas. Role para baixo para atualizar</Text>
                </View>
                }
                <Text>{"\n\n\n"}</Text>                
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
    }
})