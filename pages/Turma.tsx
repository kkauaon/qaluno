import {useCallback, useEffect, useRef, useState} from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  View,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import {RefreshControl} from 'react-native-gesture-handler';
import {
  Button,
  Dialog,
  Divider,
  Portal,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import {HorarioIndividual} from '../api/API.ts';
import {IAluno, IDiario, IHorario} from '../api/APITypes.ts';
import MMKV from '../api/Database.ts';
import {
  normalizeName,
  QACADEMICO_BASE_URL,
  randomHexColor,
} from '../helpers/Util.ts';
import {useSemestre} from '../contexts/SemestreContext';
import analytics from '@react-native-firebase/analytics';
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Tipos para o grid de horários
interface TimeSlot {
  startHour: number;
  startMinute: number;
  label: string;
}

interface DayColumn {
  dayNumber: number;
  label: string;
  shortLabel: string;
}

// Configuração dos dias da semana (2=Seg, 3=Ter, etc.)
const DIAS_SEMANA: DayColumn[] = [
  {dayNumber: 2, label: 'Segunda', shortLabel: 'Seg'},
  {dayNumber: 3, label: 'Terça', shortLabel: 'Ter'},
  {dayNumber: 4, label: 'Quarta', shortLabel: 'Qua'},
  {dayNumber: 5, label: 'Quinta', shortLabel: 'Qui'},
  {dayNumber: 6, label: 'Sexta', shortLabel: 'Sex'},
];

// Slots de horário padrão
const TIME_SLOTS: TimeSlot[] = [
  {startHour: 7, startMinute: 30, label: '07:30'},
  {startHour: 8, startMinute: 30, label: '08:30'},
  {startHour: 10, startMinute: 0, label: '10:00'},
  {startHour: 11, startMinute: 0, label: '11:00'},
  {startHour: 13, startMinute: 30, label: '13:30'},
  {startHour: 14, startMinute: 30, label: '14:30'},
  {startHour: 16, startMinute: 0, label: '16:00'},
  {startHour: 17, startMinute: 0, label: '17:00'},
];

// Converte string de horário "HH:MM" para número decimal
function parseTimeToDecimal(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return -1;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return -1;
  return hours + minutes / 60;
}

// Obtém horários para um dia e slot específico
function getHorariosForSlot(
  horarios: IHorario[],
  dayNumber: number,
  slot: TimeSlot,
): IHorario[] {
  const slotDecimal = slot.startHour + slot.startMinute / 60;
  return horarios.filter(h => {
    const horarioDecimal = parseTimeToDecimal(h.horaInicio);
    return (
      h.diaSem === dayNumber && Math.abs(horarioDecimal - slotDecimal) < 0.01
    );
  });
}

// Horário vazio para células sem aula
const EMPTY_HORARIO: IHorario = {
  diaSem: 0,
  anoLet: 0,
  periodoLet: 0,
  horaInicio: '',
  horaFinal: '',
  descDiaSem: '',
  idDisciplina: 0,
  siglaDisciplina: '',
  descDisciplina: '',
  idProfessor: 0,
  idPessoaProfessor: 0,
  nomeProfessor: '',
  idSala: 0,
  siglaSala: '',
  descSala: '',
  localizacaoSala: '',
  idPlanoEnsino: 0,
  siglaTurma: '',
};

// @ts-ignore
export default function Home({navigation}): React.JSX.Element {
  const {
    semestre: sem,
    ano,
    periodo,
    setSemestre: setSem,
    semestresDisponiveis,
  } = useSemestre();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [horarios, setHorarios] = useState<IHorario[]>([]);

  const [aluno, setAluno] = useState<IAluno>();

  const {width} = useWindowDimensions();

  const [diarios, setDiarios] = useState<IDiario[]>([]);

  const theme = useTheme();

  // Calcula largura de cada célula do grid (padding 20 de cada lado + margin 2 de cada célula * 5 células * 2 lados)
  const cellWidth = Math.floor((width - 40 - 20) / 5);

  useEffect(() => {
    const d = MMKV.getString(`horarios.${sem}`);

    const d2 = MMKV.getString(`semestre.${sem}`);
    let registeredData: IDiario[];

    if (d2) {
      registeredData = JSON.parse(d2) as IDiario[];
      setDiarios(registeredData);
    }

    if (d) {
      setHorarios(JSON.parse(d) as IHorario[]);
    } else {
      setHorarios([]);
    }

    const u = MMKV.getString(`usuario`);

    if (u) {
      setAluno(JSON.parse(u) as IAluno);
    }
  }, [sem]);

  // Atualiza cores das disciplinas quando horários mudam
  useEffect(() => {
    horarios.forEach(hr => {
      if (
        hr.descDisciplina &&
        !MMKV.getString('cordisciplina.' + hr.descDisciplina)
      ) {
        MMKV.set('cordisciplina.' + hr.descDisciplina, randomHexColor());
      }
    });
  }, [horarios]);

  const fetchHorarios = useCallback(async () => {
    if (!sem) return;

    setLoading(true);
    try {
      const data = await HorarioIndividual(ano, periodo);
      setHorarios(data.horarios);
      MMKV.set(`horarios.${sem}`, JSON.stringify(data.horarios));
      if (!__DEV__) {
        analytics().logEvent('recarregar_horarios').catch(console.log);
      }
    } catch (err) {
      ToastAndroid.show(
        'Erro ao carregar horários. Tente novamente.',
        ToastAndroid.SHORT,
      );
      MMKV.set(`logged`, false);
      navigation.replace('Login');
    } finally {
      setLoading(false);
    }
  }, [sem, navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHorarios().finally(() => setRefreshing(false));
  }, [fetchHorarios]);

  const getCorDisciplina = (descDisciplina: string): string => {
    if (!descDisciplina) return 'transparent';
    return MMKV.getString('cordisciplina.' + descDisciplina) || '#ffffff';
  };

  // Dialog ao clicar em um horário
  const [visible, setVisible] = useState(false);
  const [horarioDialogData, setHorarioDialogData] = useState<IHorario | null>(
    null,
  );
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
    props => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={1}
        style={[props.style, {backgroundColor: theme.colors.backdrop}]}
      />
    ),
    [],
  );

  const mudaSemestre = (semestr: string) => {
    setSem(semestr);
    bottomSheetModalRef.current?.dismiss();
    ToastAndroid.show('Semestre alterado para ' + semestr, ToastAndroid.SHORT);
  };

  // Componente de célula do horário
  const ScheduleCell = ({
    horario,
    width: cellW,
  }: {
    horario: IHorario | null;
    width: number;
  }) => {
    if (!horario || !horario.descDisciplina) {
      return (
        <View
          style={[
            styles.scheduleCell,
            {width: cellW, backgroundColor: theme.colors.surfaceVariant},
          ]}
        />
      );
    }

    return (
      <Pressable
        onPress={() => {
          setHorarioDialogData(horario);
          setVisible(true);
        }}
        style={[
          styles.scheduleCell,
          {
            width: cellW,
            backgroundColor: getCorDisciplina(horario.descDisciplina),
          },
        ]}
        android_ripple={{color: 'rgba(0,0,0,.2)', borderless: false}}>
        <Text
          numberOfLines={2}
          style={styles.scheduleCellText}
          variant="labelSmall">
          {horario.descDisciplina}
        </Text>
      </Pressable>
    );
  };

  // Componente do grid de horários
  const ScheduleGrid = () => {
    if (loading) {
      return (
        <Surface
          style={[
            styles.emptyStateContainer,
            {backgroundColor: theme.colors.surfaceVariant},
          ]}
          elevation={1}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            variant="bodyLarge"
            style={{marginTop: 16, color: theme.colors.onSurfaceVariant}}>
            Carregando horários...
          </Text>
        </Surface>
      );
    }

    if (horarios.length === 0) {
      return (
        <Surface
          style={[
            styles.emptyStateContainer,
            {backgroundColor: theme.colors.surfaceVariant},
          ]}
          elevation={1}>
          <Icon
            name="calendar-blank-outline"
            size={64}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="titleMedium"
            style={{
              marginTop: 16,
              color: theme.colors.onSurfaceVariant,
              textAlign: 'center',
            }}>
            Nenhum horário disponível
          </Text>
          <Text
            variant="bodyMedium"
            style={{
              marginTop: 8,
              color: theme.colors.onSurfaceVariant,
              textAlign: 'center',
            }}>
            Clique no botão abaixo para carregar seus horários
          </Text>
          <Button
            mode="contained"
            onPress={fetchHorarios}
            style={{marginTop: 20}}
            icon="refresh">
            Buscar Horários
          </Button>
        </Surface>
      );
    }

    return (
      <View style={styles.scheduleContainer}>
        {/* Cabeçalho dos dias */}
        <View style={styles.scheduleHeader}>
          {DIAS_SEMANA.map(dia => (
            <View
              key={dia.dayNumber}
              style={[styles.headerCell, {width: cellWidth + 4}]}>
              <Text
                variant="labelMedium"
                style={{fontWeight: 'bold', color: theme.colors.onSurface}}>
                {dia.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Grid de horários */}
        {TIME_SLOTS.map((slot, slotIndex) => (
          <View key={`slot-${slotIndex}`} style={styles.scheduleRow}>
            {DIAS_SEMANA.map(dia => {
              const horariosDoSlot = getHorariosForSlot(
                horarios,
                dia.dayNumber,
                slot,
              );
              const horario =
                horariosDoSlot.length > 0 ? horariosDoSlot[0] : null;

              return (
                <ScheduleCell
                  key={`${dia.dayNumber}-${slotIndex}`}
                  horario={horario}
                  width={cellWidth}
                />
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      style={{flex: 1}}>
      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog}>
          <Dialog.Title
            style={{fontWeight: 'bold', fontSize: 18, lineHeight: 24}}>
            {horarioDialogData?.descDisciplina}
          </Dialog.Title>
          <Dialog.Content>
            <View style={styles.dialogRow}>
              <Icon name="account" size={20} color={theme.colors.onSurface} />
              <Text variant="bodyMedium" style={{marginLeft: 8}}>
                {normalizeName(
                  horarioDialogData?.nomeProfessor || 'Sem professor',
                )}
              </Text>
            </View>
            <View style={styles.dialogRow}>
              <Icon
                name="clock-start"
                size={20}
                color={theme.colors.onSurface}
              />
              <Text variant="bodyMedium" style={{marginLeft: 8}}>
                Início: {horarioDialogData?.horaInicio || '-'}
              </Text>
            </View>
            <View style={styles.dialogRow}>
              <Icon name="clock-end" size={20} color={theme.colors.onSurface} />
              <Text variant="bodyMedium" style={{marginLeft: 8}}>
                Fim: {horarioDialogData?.horaFinal || '-'}
              </Text>
            </View>
            <View style={styles.dialogRow}>
              <Icon name="door" size={20} color={theme.colors.onSurface} />
              <Text variant="bodyMedium" style={{marginLeft: 8}}>
                Sala: {horarioDialogData?.siglaSala || '-'}{' '}
                {horarioDialogData?.descSala
                  ? `(${horarioDialogData.descSala})`
                  : ''}
              </Text>
            </View>
            <View style={styles.dialogRow}>
              <Icon
                name="map-marker"
                size={20}
                color={theme.colors.onSurface}
              />
              <Text variant="bodyMedium" style={{marginLeft: 8}}>
                {horarioDialogData?.localizacaoSala ||
                  'Localização não informada'}
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Fechar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <SafeAreaView style={{padding: 20}}>
        <Text variant="titleMedium">
          {ano} / {periodo}
        </Text>
        <Text>{'\n'}</Text>
        <Text variant="titleLarge" style={{fontWeight: 'bold'}}>
          Horário das Aulas
        </Text>
        <Divider bold style={{marginVertical: 8}} />

        <ScheduleGrid />

        <Text variant="labelLarge">{''}</Text>

        <Surface
          style={[
            styles.infoCard,
            {backgroundColor: theme.colors.secondaryContainer},
          ]}
          elevation={1}>
          <Text
            style={{
              fontWeight: 'bold',
              color: theme.colors.onSecondaryContainer,
            }}
            variant="titleLarge">
            Informações do Aluno
          </Text>
          <Divider bold style={{marginVertical: 8}} />
          <Text
            style={{color: theme.colors.onSecondaryContainer}}
            variant="titleMedium">
            Nome: {aluno?.nomePessoa || '-'}
          </Text>
          <Text
            style={{color: theme.colors.onSecondaryContainer}}
            variant="titleMedium">
            Curso: {aluno?.descCurso || '-'}
          </Text>
          <Text
            style={{color: theme.colors.onSecondaryContainer}}
            variant="titleMedium">
            Matrícula: {aluno?.matricula || '-'}
          </Text>
        </Surface>

        <Text variant="labelLarge">{''}</Text>

        {/*<Menu
					visible={menuVisible}
					onDismiss={closeMenu}
					anchor={<Button mode="contained-tonal" onPress={openMenu}>Mudar semestre</Button>}>
					{["2024.2","2024.1","2023.2","2023.1","2022.2","2022.1"].map((it, idx) => 
						<Menu.Item key={idx} onPress={() => { mudaSemestre(it), setMenuVisible(false) }} title={it} />
					)}
				</Menu>*/}

        <Button mode="contained" onPress={handlePresentModalPress}>
          Mudar Semestre
        </Button>

        <Text variant="labelLarge">{''}</Text>

        <Button
          mode="contained"
          onPress={() =>
            navigation.push('WebView', {
              url: `${QACADEMICO_BASE_URL}/qacademico/index.asp?t=2000`,
            })
          }>
          Site Q-Acadêmico
        </Button>

        <Text variant="labelLarge">{''}</Text>

        {/*<Button
          mode="contained"
          onPress={() =>
            navigation.push('WebView', {
              url: 'https://novo.qacademico.ifce.edu.br/qacademico/index.asp?t=2082',
            })
          }>
          Renovação de Matrícula
        </Button>*/}

        {/*<Text variant="labelLarge">{''}</Text>*/}

        {/*<Button
          mode="contained"
          onPress={() =>
            navigation.push('WebView', {
              url: `${QACADEMICO_BASE_URL}/webapp/documentos`,
            })
          }>
          Solicitar Documentos
        </Button>

        <Text variant="labelLarge">{''}</Text>*/}

        <Button
          mode="contained"
          onPress={() =>
            navigation.push('WebView', {url: 'https://qaluno.netlify.app/rate'})
          }>
          Sugestão ou Reportar Bug
        </Button>

		<Text variant="labelLarge">{''}</Text>

        <Button
          mode="contained"
		  textColor='#ffffff'
		  buttonColor='#ff4d4d'
          onPress={() => {
            MMKV.set(`logged`, false);
            navigation.replace('Login');
		  }}
        >
          Sair da Conta
        </Button>

        <BottomSheetModal
          ref={bottomSheetModalRef}
          onChange={handleSheetChanges}
          backdropComponent={renderBackdrop}
          snapPoints={['40%', '70%']}
          enableDynamicSizing={false}
          backgroundStyle={{backgroundColor: theme.colors.background}}
          handleIndicatorStyle={{backgroundColor: theme.colors.onBackground}}>
          <BottomSheetFlatList
            data={semestresDisponiveis}
            keyExtractor={i => i}
            renderItem={it =>
              it.item == sem ? (
                <Button
                  mode="contained-tonal"
                  onPress={() => mudaSemestre(it.item)}>
                  {it.item} (Selecionado)
                </Button>
              ) : (
                <Button
                  mode="contained-tonal"
                  onPress={() => mudaSemestre(it.item)}>
                  {it.item}
                </Button>
              )
            }
            contentContainerStyle={{...styles.VStack, padding: 20, rowGap: 10}}
          />
        </BottomSheetModal>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scheduleContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  headerCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 2,
  },
  scheduleCell: {
    height: 48,
    marginHorizontal: 2,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  scheduleCellText: {
    color: '#000000',
    fontWeight: '500',
  },
  emptyStateContainer: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
  },
  dialogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  VStack: {
    display: 'flex',
    flexDirection: 'column',
  },
  HStack: {
    display: 'flex',
    flexDirection: 'row',
  },
});
