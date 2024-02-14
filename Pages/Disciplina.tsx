import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, ToastAndroid, View } from "react-native";
import { Button, Divider, SegmentedButtons, Text } from "react-native-paper";
import MMKV from "../api/Database.ts";
import { IAula, IAvaliacao, IDiario } from "../api/APITypes.ts";
import { Circle, G, Svg } from "react-native-svg";
import { corNota, corNotaTexto, escalarNota, randomHexColor } from "../helpers/Util.ts";

// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ListarAulas } from "../api/API.ts";

const calculaFreqGrafico = (total: number, dadas: number) => {
    const percentage = (dadas / total) * 100;
    const strokeDashoffset = circleCircumference - (circleCircumference * percentage) / 100;

    return strokeDashoffset
}

const radius = 90;
const circleCircumference = 2 * Math.PI * radius;

// @ts-ignore
export default function Disciplina({ route, navigation }): React.JSX.Element {
    const { diario }: { diario: IDiario } = route.params

    const [ava, setAva] = useState<IAvaliacao[]>([])
    const [value, setValue] = useState("notas")
    const [aulas, setAulas] = useState<IAula[]|null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setAva(JSON.parse(MMKV.getString(`avaliacoes.${diario.idDiario}`)||"[]") as IAvaliacao[])
    }, [])

    const carregarAulas = () => {
        setLoading(true)
        ListarAulas(diario.idDiario).then(a => {
            setLoading(false)
            setAulas(a)
        }).catch(() => {
            ToastAndroid.show("Falha. Você está logado?", ToastAndroid.LONG)
            setLoading(false)
        })
    }
    
    return (
		<ScrollView style={{ flex: 1 }}>
            <SafeAreaView style={{ padding: 20 }}>
                <View style={{ marginHorizontal: -20, paddingHorizontal: 20, paddingVertical: 5 }} >
                    <View style={{ display: "flex", flexDirection: "row", columnGap: 10, alignItems: "center" }}>
                        <View style={{ ...styles.quadrado, backgroundColor: randomHexColor() }}></View>
                        <Text variant="titleLarge">{diario.descricao}</Text>
                    </View>               
                </View>

                <Text variant="titleMedium">{diario.professor || "Sem professor"}</Text>
                <Text variant="titleMedium">Carga horária: {diario.cargaHoraria}h</Text>
                <Text variant="titleMedium">Aulas dadas: {diario.totalAulasDadas}</Text>
                <Text variant="titleMedium">Situação: {diario.situacaoDisciplina}{"\n"}</Text>

                <SegmentedButtons
                    value={value}
                    onValueChange={setValue}
                    buttons={[
                    {
                        value: 'notas',
                        label: 'Notas',
                    },
                    {
                        value: 'aulas',
                        label: 'Aulas',
                    },
                    ]}
                />

                {value == 'notas' ? 
                <View>
                    <View style={styles.notas}>
                        <Text variant="labelLarge">N1</Text>
                        <Text variant="labelLarge">Nota</Text>
                    </View> 
                    <Divider style={{ marginHorizontal: -20 }} />
                    <Divider style={{ marginHorizontal: -20 }} />
                    {ava.filter(d => d.tipoAvaliacao == 0 && d.idEtapa == '1B').map(etapa => {
                        return (
                            <View key={etapa.id}><Divider style={{ marginHorizontal: -20 }} /><View style={styles.notas} >
                                <View style={styles.VStack}>
                                    <Text numberOfLines={1} style={{ minWidth: "85%", maxWidth: "85%" }}>{etapa.descricao}</Text>
                                    <Text numberOfLines={1}>{new Date(etapa.data||"1969").toLocaleDateString()}</Text>
                                </View>
                                {etapa.nota ? <View style={{ ...styles.nota, backgroundColor: corNota(escalarNota(etapa.nota, etapa.notaMaxima, 10)) }}>
                                    <Text style={{ textAlign: "center", color: corNotaTexto(escalarNota(etapa.nota, etapa.notaMaxima, 10)) }}>{etapa.nota}</Text>
                                </View> : <Text>-</Text>}
                            </View></View>
                        )
                    })}
                    <View style={styles.notas}>
                        <Text variant="labelLarge">N2</Text>
                        <Text variant="labelLarge">Nota</Text>
                    </View> 
                    <Divider style={{ marginHorizontal: -20 }} />
                    {ava.filter(d => d.tipoAvaliacao == 0 && d.idEtapa == '2B').map(etapa => {
                        return (
                            <View key={etapa.id}><Divider style={{ marginHorizontal: -20 }} /><View style={styles.notas} >
                                <View style={styles.VStack}>
                                    <Text numberOfLines={1} style={{ minWidth: "85%", maxWidth: "85%" }}>{etapa.descricao}</Text>
                                    <Text numberOfLines={1}>{new Date(etapa.data||"1969").toLocaleDateString()}</Text>
                                </View>
                                {etapa.nota ? <View style={{ ...styles.nota, backgroundColor: corNota(escalarNota(etapa.nota, etapa.notaMaxima, 10)) }}>
                                    <Text style={{ textAlign: "center", color: corNotaTexto(escalarNota(etapa.nota, etapa.notaMaxima, 10)) }}>{etapa.nota}</Text>
                                </View> : <Text>-</Text>}
                            </View></View>
                        )
                    })}
                    <View style={styles.notas}>
                        <Text variant="labelLarge">Outras</Text>
                        <Text variant="labelLarge">Nota</Text>
                    </View> 
                    <Divider style={{ marginHorizontal: -20 }} />
                    {ava.filter(d => d.idEtapa != '1B' && d.idEtapa != '2B' && d.tipoAvaliacao != 2).map(etapa => {
                        return (
                            <View key={etapa.id}><Divider style={{ marginHorizontal: -20 }} /><View style={styles.notas} >
                                <View style={styles.VStack}>
                                    <Text numberOfLines={1} style={{ minWidth: "85%", maxWidth: "85%" }}>{etapa.descricao}</Text>
                                    <Text numberOfLines={1}>{new Date(etapa.data||"1969").toLocaleDateString()}</Text>
                                </View>
                                {etapa.nota ? <View style={{ ...styles.nota, backgroundColor: corNota(escalarNota(etapa.nota, etapa.notaMaxima, 10)) }}>
                                    <Text style={{ textAlign: "center", color: corNotaTexto(escalarNota(etapa.nota, etapa.notaMaxima, 10)) }}>{etapa.nota}</Text>
                                </View> : <Text>-</Text>}
                            </View></View>
                        )
                    })}
                    <Divider style={{ marginHorizontal: -20 }} />
                    <Divider style={{ marginHorizontal: -20 }} />
                    <View style={styles.label} >
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
                    </View>
                    <View style={styles.label}>
                        <Text variant="labelLarge">% Presenças</Text>
                        <Text variant="labelLarge">{diario.percentualFrequencia}</Text>
                    </View>
                </View> : <View>
                    <Text>{"\n"}</Text>
                    {aulas == null ? <Button disabled={loading} loading={loading} mode="contained" onPress={() => carregarAulas()}>Carregar Aulas</Button> : 
                    <View style={{ display: 'flex', flexDirection: 'column-reverse', rowGap: 10 }}>
                        {aulas.filter(s => s.processada).map((aula, i) =>
                        <View key={i} style={{ ...styles.aula, borderColor: aula.faltas ? 'red' : 'green' }}>
                            <MaterialCommunityIcons name={aula.faltas ? 'close' : 'check'} size={20} color={aula.faltas ? 'red' : 'green'} />
                            <Text style={{ minWidth: "90%", maxWidth: "90%" }}>{aula.conteudo}</Text>
                        </View>
                        )}
                    </View>}
                </View>}

            </SafeAreaView>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    VStack: {
        display: 'flex',
        flexDirection: 'column'
    },
    aula: {
        borderColor: 'green',
        borderRadius: 4,
        borderWidth: 1,
        padding: 10,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 5,
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
    label: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
        paddingVertical: 5,
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
        width: 23,
        height: 23,
        borderRadius: 5
    },
    faltas: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    }
})