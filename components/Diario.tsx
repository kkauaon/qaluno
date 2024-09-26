import { Pressable, StyleSheet, View } from "react-native"
import { IAvaliacao, IDiario } from "../api/APITypes.ts"
import { Divider, Text } from "react-native-paper"
import { Circle, G, Svg } from "react-native-svg"
import { corNota, corNotaTexto, escalarNota, randomHexColor } from "../helpers/Util.ts"
import { useEffect, useState } from "react"
import { useMMKVString } from "react-native-mmkv"

const calculaFreqGrafico = (total: number, dadas: number) => {
    const percentage = (dadas / total) * 100;
    const strokeDashoffset = circleCircumference - (circleCircumference * percentage) / 100;

    return strokeDashoffset
}

const verificarN1ouN2 = (ava: IAvaliacao[]) => ava.filter(d => d.idEtapa == '2B' && d.tipoAvaliacao == 0 && d.nota != null).length > 0

const radius = 90;
const circleCircumference = 2 * Math.PI * radius;

type DiarioProps = { diario: IDiario, saved: string, show: (msg: string) => void, navigation: any }

export default function Diario({ diario, show, saved, navigation }: DiarioProps): React.JSX.Element {
    const [aval, setAval] = useMMKVString(`avaliacoes.${diario.idDiario}`)

    const [ava, setAva] = useState<IAvaliacao[]>([])

    useEffect(() => {
        const parsed = JSON.parse(aval || "[]") as IAvaliacao[]

        if (parsed != ava && saved != aval && parsed.length > 0 && parsed.some(l => l.nota != null)) {
            show(diario.descricao)
        }

        setAva(parsed)
    }, [aval])

    const navega = () => {
        navigation.push("Disciplina", { diario: diario })
    }

    return (
        <View key={diario.idDiario}>
            <Text variant="labelSmall">{"\n"}</Text>
            <Pressable style={{ marginHorizontal: -20, paddingHorizontal: 20, paddingVertical: 5 }} android_ripple={{ color: "rgba(0,0,0,.2)", borderless: false }} onPress={() => navega()}>
                <View style={{ display: "flex", flexDirection: "row", columnGap: 10, alignItems: "center" }}>
                    <View style={{ ...styles.quadrado, backgroundColor: diario.cor || randomHexColor() }}></View>
                    <Text variant="titleMedium">{diario.descricao}</Text>
                </View>
                <View style={styles.notas}>
                    <Text variant="labelLarge">{ava.filter(d => d.idEtapa == '2B' && d.tipoAvaliacao == 0 && d.nota != null).length > 0 ? 'N2' : 'N1'}</Text>
                    <Text variant="labelLarge">Nota</Text>
                </View>                
            </Pressable>

            <Divider style={{ marginHorizontal: -20 }} />
            {verificarN1ouN2(ava) ? ava.filter(d => d.tipoAvaliacao == 0 && d.idEtapa != '1B').map(etapa => {
                return (
                    <View key={etapa.id}><Divider style={{ marginHorizontal: -20 }} /><Pressable style={styles.notas} android_ripple={{ color: "rgba(0,0,0,.2)", borderless: false }} onPress={() => navega()}>
                        <View style={styles.VStack}>
                            <Text numberOfLines={1} style={{ minWidth: "85%", maxWidth: "85%" }}>{etapa.descricao}</Text>
                            <Text numberOfLines={1}>{new Date(etapa.data||"1969").toLocaleDateString()}</Text>
                        </View>
                        {etapa.nota ? <View style={{ ...styles.nota, backgroundColor: corNota(escalarNota(etapa.nota, etapa.notaMaxima, 10)) }}>
                            <Text style={{ fontWeight: "bold", textAlign: "center", color: corNotaTexto(escalarNota(etapa.nota, etapa.notaMaxima, 10)) }}>{etapa.nota.toLocaleString(undefined, { minimumFractionDigits: 1 })}</Text>
                        </View> : <Text>-</Text>}
                    </Pressable></View>
                )
            }) : ava.filter(d => d.tipoAvaliacao == 0 && d.idEtapa == '1B').map(etapa => {
                return (
                    <View key={etapa.id}><Divider style={{ marginHorizontal: -20 }} /><Pressable style={styles.notas} android_ripple={{ color: "rgba(0,0,0,.2)", borderless: false }} onPress={() => navega()}>
                        <View style={styles.VStack}>
                            <Text numberOfLines={1} style={{ minWidth: "85%", maxWidth: "85%" }}>{etapa.descricao}</Text>
                            <Text numberOfLines={1}>{new Date(etapa.data||"1969").toLocaleDateString()}</Text>
                        </View>
                        {etapa.nota ? <View style={{ ...styles.nota, backgroundColor: corNota(escalarNota(etapa.nota, etapa.notaMaxima, 10)) }}>
                            <Text style={{ fontWeight: "bold", textAlign: "center", color: corNotaTexto(escalarNota(etapa.nota, etapa.notaMaxima, 10)) }}>{etapa.nota.toLocaleString(undefined, { minimumFractionDigits: 1 })}</Text>
                        </View> : <Text>-</Text>}
                    </Pressable></View>
                )
            })}
            <Divider style={{ marginHorizontal: -20 }} />
            <Divider style={{ marginHorizontal: -20 }} />
            <Pressable style={styles.notas} android_ripple={{ color: "rgba(0,0,0,.2)", borderless: false }} onPress={() => navega()}>
                <Text variant="labelLarge">Faltas</Text>
                <View style={styles.faltas}>
                    <Svg height="25" width="25" viewBox="0 0 220 220">
                        <G rotation={-90} originX="110" originY="110">
                            <Circle
                                cx="50%"
                                cy="50%"
                                r={radius}
                                stroke="#6A6A6A"
                                fill="transparent"
                                strokeWidth="30"
                            />
                            <Circle
                                cx="50%"
                                cy="50%"
                                r={radius}
                                stroke="#0099FF"
                                fill="transparent"
                                strokeWidth="30"
                                strokeDasharray={circleCircumference}
                                strokeDashoffset={calculaFreqGrafico(diario.cargaHoraria, diario.totalAulasDadas - diario.totalFaltas)}
                                strokeLinecap="butt"
                            />
                            <Circle
                                cx="50%"
                                cy="50%"
                                r={radius}
                                stroke="#FF5255"
                                fill="transparent"
                                strokeWidth="30"
                                strokeDasharray={circleCircumference}
                                strokeDashoffset={-calculaFreqGrafico(diario.cargaHoraria, diario.totalFaltas)}
                                strokeLinecap="butt"
                            />
                        </G>
                    </Svg>
                    <Text variant="labelLarge" style={{ position: "absolute", textAlign: "center" }}>{diario.totalFaltas}</Text>
                </View>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    VStack: {
        display: 'flex',
        flexDirection: 'column'
    },
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