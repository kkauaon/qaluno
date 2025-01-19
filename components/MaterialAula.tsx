import { Linking, Pressable, StyleSheet, ToastAndroid, View } from "react-native"
import { IDiario, IMaterialDeAula } from "../api/APITypes.ts"
import { Divider, Text } from "react-native-paper"
import { useMMKVString } from "react-native-mmkv"
import { useEffect, useState } from "react"
import { compararDatas, randomHexColor } from "../helpers/Util.ts"
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinkMaterialDeAula } from "../api/API.ts"
import MMKV from "../api/Database.ts"

type MaterialAulaProps = { diario: IDiario, saved: string, show: (msg: string) => void }

export default function MaterialAula({ diario, show, saved }: MaterialAulaProps): React.JSX.Element {
    const [aval, setAval] = useMMKVString(`materiais.${diario.idDiario}`)

    const [ava, setAva] = useState<IMaterialDeAula[]>([])

    useEffect(() => {
        const parsed = JSON.parse(aval || "[]") as IMaterialDeAula[]

        if (parsed != ava && saved != aval && parsed.length >0) {
            show(diario.descricao)
        }

        setAva(parsed)
    }, [aval])

    const baixar = (id: number) => {
        ToastAndroid.show("Carregando", ToastAndroid.SHORT)

        LinkMaterialDeAula(id).then(link => {
            console.log("opening link " + link)
            Linking.openURL(link)
        }).catch(() => {
            ToastAndroid.show("Falha", ToastAndroid.SHORT)
        })
    }

    if (ava.length > 0)
    return (
        <View key={diario.idDiario}>
            <Text variant="labelSmall">{"\n"}</Text>
            <Pressable style={{ marginHorizontal: -20, paddingHorizontal: 20, paddingVertical: 10 }} android_ripple={{ color: "rgba(0,0,0,.2)", borderless: false }} onPress={() => console.log('asd')}>
                <View style={{ display: "flex", flexDirection: "row", columnGap: 10, alignItems: "center" }}>
                    <View style={{ ...styles.quadrado, backgroundColor: MMKV.getString("cordisciplina."+diario.descricao) || "#ffffff" }}></View>
                    <Text variant="titleMedium">{diario.descricao}</Text>
                </View>            
            </Pressable>

            <Divider style={{ marginHorizontal: -20 }} />
            {ava.sort((a, b) => compararDatas(b.data, a.data)).map(mat => {
                return (
                    <View key={mat.id}>
                        <Divider style={{ marginHorizontal: -20 }} />
                        <Pressable style={styles.notas} android_ripple={{ color: "rgba(0,0,0,.2)", borderless: false }} onPress={() => baixar(mat.id)}>
                            <MaterialCommunityIcons name="download" size={30} />
                            <View>
                                <Text variant="bodyLarge" numberOfLines={2} style={{ minWidth: "96%", maxWidth: "96%" }}>{mat.descricao}</Text>
                            </View>
                        </Pressable>
                    </View>
                )
            })}
        </View>
    )
    else return (
        <View></View>
    )
}

const styles = StyleSheet.create({
    notas: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
        height: 70,
        display: 'flex',
        flexDirection: 'row',
        columnGap: 10,
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