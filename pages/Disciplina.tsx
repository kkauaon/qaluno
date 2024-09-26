import React, { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, ToastAndroid, Touchable, TouchableHighlight, View } from "react-native";
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

type ContainerNotaProps = { etapa: IAvaliacao };
function ContainerNota({ etapa }: ContainerNotaProps): React.JSX.Element {
    return (
        <View key={etapa.id}>
            <Divider style={{ marginHorizontal: -20 }} />
            <View style={styles.notas} >
                <Pressable onPress={() => ToastAndroid.show(etapa.descricao, ToastAndroid.SHORT)} android_ripple={{ color: "rgba(0,0,0,.2)", borderless: false }} style={{...styles.VStack, minWidth: "60%", maxWidth: "60%"}}>
                    <Text numberOfLines={1}>{etapa.descricao}</Text>
                    <Text numberOfLines={1}>{new Date(etapa.data||"1969").toLocaleDateString()}</Text>
                </Pressable>
                <Text>{etapa.notaMaxima.toLocaleString(undefined, { minimumFractionDigits: 1 })}</Text>
                {etapa.nota ? 
                    <View style={{ ...styles.nota, backgroundColor: corNota(escalarNota(etapa.nota, etapa.notaMaxima, 10)) }}>
                        <Text style={{ fontWeight: "bold", textAlign: "center", color: corNotaTexto(escalarNota(etapa.nota, etapa.notaMaxima, 10)) }}>{etapa.nota.toLocaleString(undefined, { minimumFractionDigits: 1 })}</Text>
                    </View> 
                    : <Text style={{ width: 40, textAlign: "center"}}>  -</Text>
                }
            </View>
        </View>
    )
}

// @ts-ignore
export default function Disciplina({ route, navigation }): React.JSX.Element {
    const { diario }: { diario: IDiario } = route.params

    const [ava, setAva] = useState<IAvaliacao[]>([])
    const [value, setValue] = useState("notas")
    const [aulas, setAulas] = useState<IAula[]|null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setAva(JSON.parse(MMKV.getString(`avaliacoes.${diario.idDiario}`)||"[]") as IAvaliacao[])
        console.log(diario.etapas)
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
                        <View style={{ ...styles.quadrado, backgroundColor: diario.cor || randomHexColor() }}></View>
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
                    { /* Provas de tipo N1 (1B) */ }
                    <View style={styles.notas}>
                        <Text style={{...styles.VStack, minWidth: "60%", maxWidth: "60%"}} variant="labelLarge">N1</Text>
                        <Text variant="labelLarge">Máx.</Text>
                        <Text variant="labelLarge">Nota</Text>
                    </View> 
                    <Divider style={{ marginHorizontal: -20 }} />
                    <Divider style={{ marginHorizontal: -20 }} />
                    {ava.filter(d => d.tipoAvaliacao == 0 && d.idEtapa == '1B').map(etapa => {
                        return <ContainerNota key={etapa.id} etapa={etapa} />
                    })}
                    { /* Provas de tipo N2 (2B) */ }
                    <View style={styles.notas}>
                        <Text style={{...styles.VStack, minWidth: "60%", maxWidth: "60%"}} variant="labelLarge">N2</Text>
                        <Text variant="labelLarge">Máx.</Text>
                        <Text variant="labelLarge">Nota</Text>
                    </View> 
                    <Divider style={{ marginHorizontal: -20 }} />
                    {ava.filter(d => d.tipoAvaliacao == 0 && d.idEtapa == '2B').map(etapa => {
                        return <ContainerNota key={etapa.id} etapa={etapa} />
                    })}
                    { /* Provas de tipo AF */ }
                    <View style={styles.notas}>
                        <Text style={{...styles.VStack, minWidth: "60%", maxWidth: "60%"}} variant="labelLarge">Outras avaliações</Text>
                        <Text variant="labelLarge">Máx.</Text>
                        <Text variant="labelLarge">Nota</Text>
                    </View> 
                    <Divider style={{ marginHorizontal: -20 }} />
                    {ava.filter(d => d.idEtapa != '1B' && d.idEtapa != '2B' && d.tipoAvaliacao != 2).map(etapa => {
                        return <ContainerNota key={etapa.id} etapa={etapa} />
                    })}
                    <View style={{...styles.label, paddingTop: 20}} >
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
                    <View style={styles.label}>
                        <Text variant="labelLarge">Média N1</Text>
                        <Text variant="labelLarge">{diario.etapas.find(e => e.sigla == "N1")?.nota || "-"}</Text>
                    </View>
                    <View style={styles.label}>
                        <Text variant="labelLarge">Média N2</Text>
                        <Text variant="labelLarge">{diario.etapas.find(e => e.sigla == "N2")?.nota || "-"}</Text>
                    </View>
                    <View style={styles.label}>
                        <Text variant="labelLarge">Média Parcial</Text>
                        <Text variant="labelLarge">{(diario.etapas.find(e => e.sigla == "N1")?.nota != null && diario.etapas.find(e => e.sigla == "N2")?.nota != null) ? diario.etapas.find(e => e.sigla == "MP")?.nota || "-" : "-"}</Text>
                    </View>
                    <View style={styles.label}>
                        <Text variant="labelLarge">Média Final</Text>
                        <Text variant="labelLarge">{(diario.etapas.find(e => e.sigla == "N1")?.nota != null && diario.etapas.find(e => e.sigla == "N2")?.nota != null) ? diario.etapas.find(e => e.sigla == "MF")?.nota || "-" : "-"}</Text>
                    </View>
                </View> : <View>
                    <Text>{"\n"}</Text>
                    {aulas == null ? <Button disabled={loading} loading={loading} mode="contained" onPress={() => carregarAulas()}>Carregar Aulas</Button> : 
                    <View style={{ display: 'flex', flexDirection: 'column-reverse', rowGap: 10 }}>
                        {aulas.filter(s => s.processada).map((aula, i) =>
                        <View key={i} style={{ ...styles.aula, borderColor: aula.faltas ? 'red' : 'green' }}>
                            <MaterialCommunityIcons name={aula.faltas ? 'close' : 'check'} size={20} color={aula.faltas ? 'red' : 'green'} />
                            <View style={{ minWidth: "90%", maxWidth: "90%" }}>
                                <Text>{aula.conteudo}</Text>
                                <Text style={styles.dataaula}>{`Aula ministrada em ${new Date(aula.dtAulaMinistrada).toLocaleDateString()} ${aula.horaInicio.split("T")[1].slice(0, 5)}~${aula.horaTermino.split("T")[1].slice(0, 5)}`}</Text>
                                <Text style={styles.dataaula}>{`Presenças: ${aula.numeroDeAulas - aula.faltas}/${aula.numeroDeAulas}`}</Text>
                            </View>
                            
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
    dataaula: {
        fontStyle: 'italic',
        color: 'gray'
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
        alignItems: "center",
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