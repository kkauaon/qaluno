import { useCallback, useEffect, useState } from "react";
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, ToastAndroid, View } from "react-native";
import { Banner, Dialog, Portal, Text } from "react-native-paper";
import MMKV from "../api/Database.ts";
import { IDiario } from "../api/APITypes.ts";
import MaterialAula from "../components/MaterialAula.tsx";
import { Boletim, MaterialDeAula } from "../api/API.ts";
import { useMMKVString } from "react-native-mmkv";

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DEFAULT_SEMESTRE } from "../helpers/Util.ts";

import analytics from '@react-native-firebase/analytics';

// @ts-ignore
export default function Materials({ navigation }): React.JSX.Element {
	const [sem, setSem] = useMMKVString("current")

    const [data, setData]  = useState<IDiario[]>([])

	const [refreshing, setRefreshing] = useState(false);

    const [visible, setVisible] = useState(false);
    const [banner, setBanner] = useState(true)
    const [alertData, setAlertData] = useState("");
	const hideDialog = () => setVisible(false);
    const showDialog = (msg: string) => {
        setAlertData(msg)
        setVisible(true);
    }

    useEffect(() => {
        if (!sem) setSem(DEFAULT_SEMESTRE)

        const d = JSON.parse(MMKV.getString(`semestre.${sem}`)||"[]") as IDiario[]

        setData(d)
    }, [])

    const onRefresh = useCallback(() => {
        setRefreshing(true);

        // @ts-ignore
        Boletim(sem.split(".")[0], sem.split(".")[1]).then(async dataa => {
            for (const dz of dataa) {
                const data2 = await MaterialDeAula(dz.idDiario).catch(() => {
                    console.log('Falha ao obter material de aula para a disciplina: ' + dz.descricao)
                })

                if (data2)
                    MMKV.set(`materiais.${dz.idDiario}`, JSON.stringify(data2))
            }

            setData(dataa)
            MMKV.set(`semestre.${sem}`, JSON.stringify(dataa))
            await analytics().logEvent('recarregar_materiais').catch((e) => console.log(e))
            setRefreshing(false);
        }).catch(() => {
            ToastAndroid.show("Entre novamente", ToastAndroid.SHORT)
            setRefreshing(false);
            MMKV.set(`logged`, false)
            navigation.replace("Login")
        })

    }, []);
    
    return (
		<ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} style={{ flex: 1 }}>
			<Portal>
				<Dialog visible={visible} onDismiss={hideDialog}>
                    <Dialog.Title>Novo material em</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">{alertData}</Text>
                    </Dialog.Content>
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
                    ATENÇÃO! O app não verifica materiais automaticamente. Role para baixo para verificar se há algum novo material.
                </Banner>
                <Text variant="titleMedium">{sem?.split(".")[0]} / {sem?.split(".")[1]}</Text>
                {data.length > 0 ? data.map(diario => <MaterialAula key={diario.idDiario} diario={diario} show={showDialog} saved={MMKV.getString(`materiais.${diario.idDiario}`)||"[]"} />) :
                <View style={styles.centered}>
                    <Text variant="titleLarge" style={{textAlign: 'center'}}>{"\n"}Nenhum material. Role para baixo para atualizar</Text>
                </View>
                }
                <Text>{"\n\n\n"}</Text>                
            </SafeAreaView>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    centered: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
})