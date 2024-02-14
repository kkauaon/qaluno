import { useCallback, useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, ToastAndroid, View, useWindowDimensions, Text as RNText } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import { Banner, Button, Dialog, Portal, Text } from "react-native-paper";
import { HorarioIndividual } from "../API/QAPI";
import { IAluno, IHorario } from "../API/APITypes.ts";
import MMKV from "../API/Database.ts";
import { randomHexColor } from "../Helpers/Util";
import { useMMKVString } from "react-native-mmkv";
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

function horarioParaNumero(h: string): number {
	const j = h.split(":")
	const k = Number(j[0])
	const l = Number(j[1])

	return k + (l / 60)
}

function preenchaArray(arr: IHorario[], qtd: number): IHorario[] {
	const diasPresentes = arr.map((horario) => horario.diaSem);
	const diasFaltantes = [2, 3, 4, 5, 6].filter((dia) => !diasPresentes.includes(dia));
  
	const n = [...arr];
  
	for (const dia of diasFaltantes) {
	  n.push({
		  diaSem: dia,
		  anoLet: 0,
		  periodoLet: 0,
		  horaInicio: "",
		  horaFinal: "",
		  descDiaSem: "",
		  idDisciplina: 0,
		  siglaDisciplina: "",
		  descDisciplina: "",
		  idProfessor: 0,
		  idPessoaProfessor: 0,
		  nomeProfessor: "",
		  idSala: 0,
		  siglaSala: "",
		  descSala: "",
		  localizacaoSala: "",
		  idPlanoEnsino: 0,
		  siglaTurma: ""
	  });
	}
  
	// Ordena a array pelo diaSem para garantir que os elementos estão na ordem correta
	n.sort((a, b) => a.diaSem - b.diaSem);
  
	// Limita o comprimento da array para qtd, se necessário
	return n;
}

// @ts-ignore
export default function Home({ navigation }): React.JSX.Element {
	const [sem, setSem] = useMMKVString("current")

	const [refreshing, setRefreshing] = useState(false);
	const [horarios, setHorarios] = useState<IHorario[]>([])

	const [aluno, setAluno] = useState<IAluno>()

	const {height, width} = useWindowDimensions();

	const [cores,setCores] = useState<{id:number,c:string}[]>([])

    useEffect(() => {
		if (!sem) setSem("2024.1")

        const d = MMKV.getString(`horarios.${sem}`)

        if (d) {
            setHorarios(JSON.parse(d) as IHorario[])
        } else {
            setHorarios([])
        }

		const u = MMKV.getString(`usuario`)

		if (u) {
			setAluno(JSON.parse(u) as IAluno)
		}
    }, [])

	const onRefresh = useCallback(() => {
        setRefreshing(true);

		// @ts-ignore
		HorarioIndividual(sem.split(".")[0], sem.split(".")[1]).then(data => {
			console.log(data.horarios)
			setHorarios(data.horarios)
			MMKV.set(`horarios.${sem}`, JSON.stringify(data.horarios))
			setRefreshing(false)
		}).catch(err => {
            ToastAndroid.show("Entre novamente", ToastAndroid.SHORT)
            setRefreshing(false);
            MMKV.set(`logged`, false)
            navigation.replace("Login")
        })
	}, [])

	const corHorario = (id: number): string => {
		if (cores.find(d => d.id == id)) {
			return cores.find(d => d.id == id)?.c || "#fff"
		}
		
		const dd = [...cores]
		
		dd.push({
			id: id,
			c: randomHexColor()
		})

		setCores(dd)

		return dd.find(d => d.id == id)?.c || "#fff"
	}

	const [visible, setVisible] = useState(false);
	const [banner, setBanner] = useState(true);
	const [horarioDialogData, setHorarioDialogData] = useState<IHorario|null>(null)
	const hideDialog = () => setVisible(false);

	const mudaSemestre = (semestr: string) => {
		setSem(semestr)
		ToastAndroid.show("Reinicie o aplicativo", ToastAndroid.LONG)
	}

	return (
		<ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} style={{ flex: 1 }}>
			<Portal>
				<Dialog visible={visible} onDismiss={hideDialog}>
				<Dialog.Title>{horarioDialogData?.descDisciplina}</Dialog.Title>
					<Dialog.Content>
						<Text variant="bodyMedium">Professor: {horarioDialogData?.nomeProfessor}</Text>
						<Text variant="bodyMedium">Início: {horarioDialogData?.horaInicio}</Text>
						<Text variant="bodyMedium">Fim: {horarioDialogData?.horaFinal}</Text>
						<Text variant="bodyMedium">Sala: {horarioDialogData?.siglaSala} ({horarioDialogData?.descSala})</Text>
						<Text variant="bodyMedium">Localização: {horarioDialogData?.localizacaoSala}</Text>
					</Dialog.Content>
				</Dialog>
			</Portal>
			<SafeAreaView style={{ padding: 20 }}>
				<Text variant="titleMedium">{sem?.split(".")[0]} / {sem?.split(".")[1]}</Text>
				<Text>{"\n"}</Text>
				<Text variant="titleLarge">Horário das Aulas</Text>
				<View style={{ ...styles.HStack, justifyContent: 'space-around' }}>
					{["Seg", "Ter", "Qua", "Qui", "Sex"].map((s, i) =>
						<View key={i}>
							<Text variant="labelLarge">{s}</Text>
						</View>
					)}
				</View>
				{[7.5, 8.5, 10, 11, 13.5, 14.5, 16, 17].map((s, i) => 
					<View key={i} style={{ ...styles.HStack, justifyContent: "center" }}>
						{preenchaArray(horarios.filter((a) => horarioParaNumero(a.horaInicio) == s), 5).map((x,i2,z) => 
							<Pressable onPress={() => { x.horaInicio ? (setHorarioDialogData(x), setVisible(true)) : null }} key={i2} style={{ ...styles.MateriaHorario, width: (((68 * width) / 384) / z.filter(kj => kj.diaSem == x.diaSem).length), backgroundColor: x.anoLet ? corHorario(x.idDisciplina) : "transparent" }} android_ripple={{ color: "rgba(0,0,0,.2)", borderless: false }}>
								<Text numberOfLines={2} style={{ ...styles.TextoHorario }} variant="labelLarge">{x.descDisciplina}</Text>
							</Pressable>
						)}
					</View>
				)}
				<Text variant="titleLarge">{"\n"}Mudar semestre</Text>
				<View style={{ ...styles.VStack, rowGap: 15 }}>
					{["2024.1","2023.2","2023.1"].map((s, i) => 
						<Button key={i} icon="swap-horizontal-bold" mode="contained-tonal" onPress={() => mudaSemestre(s)} >
							{s}
						</Button>
					)}					
				</View>
				<Text variant="titleLarge">{"\n"}Informações do Aluno</Text>
				<Text variant="titleMedium">Nome: {aluno?.nomePessoa}</Text>
				<Text variant="titleMedium">Curso: {aluno?.descCurso}</Text>
				<Text variant="titleMedium">Matrícula: {aluno?.matricula}</Text>
			</SafeAreaView>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	VStack: {
		display: 'flex',
		flexDirection: 'column'
	},
	HStack: {
		display: 'flex',
		flexDirection: 'row'
	},
	MateriaHorario: {
		height: 50,
		backgroundColor: "white",
		borderRadius: 5,
	},
	TextoHorario: {
		color: "black",
		
	}
})