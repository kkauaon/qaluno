import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, ToastAndroid, View, useWindowDimensions } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import { Button, Dialog, Divider, Headline, Menu, Portal, Text, useTheme } from "react-native-paper";
import { HorarioIndividual } from "../api/API.ts";
import { IAluno, IDiario, IHorario } from "../api/APITypes.ts";
import MMKV from "../api/Database.ts";
import { DEFAULT_SEMESTRE, normalizeName, randomHexColor } from "../helpers/Util.ts";
import { useMMKVString } from "react-native-mmkv";
import analytics from '@react-native-firebase/analytics';
import { BottomSheetModal, BottomSheetView, BottomSheetModalProvider, BottomSheetFlatList, BottomSheetBackdrop } from "@gorhom/bottom-sheet";

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
  
	return n;
}

// @ts-ignore
export default function Home({ navigation }): React.JSX.Element {
	const [sem, setSem] = useMMKVString("current")

	const [refreshing, setRefreshing] = useState(false);
	const [horarios, setHorarios] = useState<IHorario[]>([])

	const [aluno, setAluno] = useState<IAluno>()

	const {height, width} = useWindowDimensions();

	const [diarios, setDiarios] = useState<IDiario[]>([])

	const theme = useTheme()

    useEffect(() => {
		if (!sem) setSem(DEFAULT_SEMESTRE)

        const d = MMKV.getString(`horarios.${sem}`)

		const d2 = MMKV.getString(`semestre.${sem}`)
        let registeredData: IDiario[];

        if (d2) {
            registeredData = JSON.parse(d2) as IDiario[]
			setDiarios(registeredData)
        }

        if (d) {
            setHorarios(JSON.parse(d) as IHorario[])
        } else {
            setHorarios([])
        }

		for (let hr of horarios) {
			if (!MMKV.getString("cordisciplina." + hr.descDisciplina)) {
				MMKV.set("cordisciplina." + hr.descDisciplina, randomHexColor())
			}
		}

		const u = MMKV.getString(`usuario`)

		if (u) {
			setAluno(JSON.parse(u) as IAluno)
		}
    }, [])

	const onRefresh = useCallback(() => {
        setRefreshing(true);

		HorarioIndividual(sem?.split(".")[0], sem?.split(".")[1]).then(data => {
			setHorarios(data.horarios)
			MMKV.set(`horarios.${sem}`, JSON.stringify(data.horarios))
			if (!__DEV__) analytics().logEvent('recarregar_horarios').catch((e) => console.log(e))
			setRefreshing(false)
		}).catch(err => {
            ToastAndroid.show("Entre novamente", ToastAndroid.SHORT)
            setRefreshing(false);
            MMKV.set(`logged`, false)
            navigation.replace("Login")
        })
	}, [])

	const corHorario = (id: string): string => {
		return MMKV.getString("cordisciplina."+id) || "#ffffff"
	}

	// Dialog ao clicar em um horário
	const [visible, setVisible] = useState(false);
	const [horarioDialogData, setHorarioDialogData] = useState<IHorario|null>(null)
	const hideDialog = () => setVisible(false);

	const bottomSheetModalRef = useRef<BottomSheetModal>(null);

	// callbacks
	const handlePresentModalPress = useCallback(() => {
	  bottomSheetModalRef.current?.present();
	}, []);
	const handleSheetChanges = useCallback((index: number) => {
	  console.log('handleSheetChanges', index);
	}, []);
	const renderBackdrop = useCallback(
		//@ts-ignore  fix later
		(props) => (
			<BottomSheetBackdrop
				{...props}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
				opacity={1}
				style={[
					props.style,
					{backgroundColor: theme.colors.backdrop},
				  ]}
			/>
		),
		[]
	);

	const mudaSemestre = (semestr: string) => {
		setSem(semestr)
		ToastAndroid.show("Reinicie o aplicativo", ToastAndroid.LONG)
	}

	return (
		<ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} style={{ flex: 1 }}>
			<Portal>
				<Dialog visible={visible} onDismiss={hideDialog}>
				<Dialog.Title style={{fontWeight:"bold", fontSize: 18, lineHeight: 24}}>{horarioDialogData?.descDisciplina}</Dialog.Title>
					<Dialog.Content>
						<Text variant="bodyMedium">Professor: {normalizeName(horarioDialogData?.nomeProfessor||"Sem professor")}</Text>
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
				<Text variant="titleLarge" style={{fontWeight: "bold"}}>Horário das Aulas</Text>
				<Divider bold />
				<View style={{ ...styles.HStack, justifyContent: 'space-around' }}>
					{["Seg.", "Ter.", "Qua.", "Qui.", "Sex."].map((s, i) =>
						<View key={i}>
							<Text variant="labelLarge">{s}</Text>
						</View>
					)}
				</View>
				{[7.5, 8.5, 10, 11, 13.5, 14.5, 16, 17].map((s, i) => 
					<View key={i} style={{ ...styles.HStack, justifyContent: "center" }}>
						{preenchaArray(horarios.filter((a) => horarioParaNumero(a.horaInicio) == s), 5).map((x,i2,z) => 
							<Pressable onPress={() => { x.horaInicio ? (setHorarioDialogData(x), setVisible(true)) : null }} key={i2} style={{ ...styles.MateriaHorario, width: (((68 * width) / 384) / z.filter(kj => kj.diaSem == x.diaSem).length), backgroundColor: x.anoLet ? corHorario(x.descDisciplina) : "transparent" }} android_ripple={{ color: "rgba(0,0,0,.2)", borderless: false }}>
								<Text numberOfLines={2} style={{ ...styles.TextoHorario }} variant="labelMedium">{x.descDisciplina}</Text>
							</Pressable>
						)}
					</View>
				)}

				<Text variant="labelLarge">{""}</Text>

				<View style={{ ...styles.VStack, borderRadius: 20, padding: 20,  backgroundColor: theme.colors.secondaryContainer }}>
					<Text style={{ fontWeight: "bold", color: theme.colors.onSecondaryContainer }} variant="titleLarge">Informações do Aluno</Text>
					<Divider bold />
					<Text style={{ color: theme.colors.onSecondaryContainer }} variant="titleMedium">Nome: {aluno?.nomePessoa}</Text>
					<Text style={{ color: theme.colors.onSecondaryContainer }} variant="titleMedium">Curso: {aluno?.descCurso}</Text>
					<Text style={{ color: theme.colors.onSecondaryContainer }} variant="titleMedium">Matrícula: {aluno?.matricula}</Text>					
				</View>

				<Text variant="labelLarge">{""}</Text>

				{/*<Menu
					visible={menuVisible}
					onDismiss={closeMenu}
					anchor={<Button mode="contained-tonal" onPress={openMenu}>Mudar semestre</Button>}>
					{["2024.2","2024.1","2023.2","2023.1","2022.2","2022.1"].map((it, idx) => 
						<Menu.Item key={idx} onPress={() => { mudaSemestre(it), setMenuVisible(false) }} title={it} />
					)}
				</Menu>*/}

				<Button mode="contained" onPress={handlePresentModalPress}>Mudar Semestre</Button>

				<Text variant="labelLarge">{""}</Text>

				<Button mode="contained" onPress={() => navigation.push("WebView", { url: "https://novo.qacademico.ifce.edu.br/webapp/dashboard" })}>Site Q-Acadêmico</Button>

				<Text variant="labelLarge">{""}</Text>

				<Button mode="contained" onPress={() => navigation.push("WebView", { url: "https://novo.qacademico.ifce.edu.br/qacademico/index.asp?t=2082" })}>Renovação de Matrícula</Button>

				<Text variant="labelLarge">{""}</Text>

				<Button mode="contained" onPress={() => navigation.push("WebView", { url: "https://novo.qacademico.ifce.edu.br/webapp/documentos" })}>Solicitar Documentos</Button>
				
				<Text variant="labelLarge">{""}</Text>

				<Button mode="contained" onPress={() => navigation.push("WebView", { url: "https://qaluno.netlify.app/rate" })}>Sugestão ou Reportar Bug</Button>

				<BottomSheetModal
					ref={bottomSheetModalRef}
					onChange={handleSheetChanges}
					backdropComponent={renderBackdrop}
					snapPoints={['40%','70%']}
					enableDynamicSizing={false}
					backgroundStyle={{backgroundColor: theme.colors.background}}
					handleIndicatorStyle={{backgroundColor: theme.colors.onBackground}}
				>
					<BottomSheetFlatList
						data={["2025.2","2025.1","2024.2","2024.1","2023.2","2023.1","2022.2","2022.1"]}
						keyExtractor={(i) => i}
						renderItem={(it) => it.item == sem ? 
							<Button mode="contained-tonal" onPress={() => mudaSemestre(it.item)}>{it.item} (Selecionado)</Button> : 
							<Button mode="contained-tonal" onPress={() => mudaSemestre(it.item)}>{it.item}</Button>
						}
						contentContainerStyle={{ ...styles.VStack, padding: 20, rowGap: 10 }}
					/>
				</BottomSheetModal>
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
		padding: 4,
		backgroundColor: "white",
		borderRadius: 5,
	},
	TextoHorario: {
		color: "black",
		
	}
})