import {useCallback, useEffect, useState} from 'react';
import {
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  View,
  Animated,
} from 'react-native';
import {
  Banner,
  Button,
  Dialog,
  Portal,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Avaliacoes, Boletim, Login} from '../api/API.ts';
import {IDiario, IVersionHistory} from '../api/APITypes.ts';
import MMKV from '../api/Database.ts';
import {useFocusEffect} from '@react-navigation/native';
import Diario from '../components/Diario.tsx';
import {useMMKVBoolean} from 'react-native-mmkv';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {APP_VERSION, randomHexColor} from '../helpers/Util.ts';
import {useSemestre} from '../contexts/SemestreContext';

import analytics from '@react-native-firebase/analytics';

// @ts-ignore
export default function Grades({navigation}): React.JSX.Element {
  const theme = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<IDiario[]>([]);

  // Estados para o loading com progresso
  const [loadingProgress, setLoadingProgress] = useState({
    current: 0,
    total: 0,
    currentDisciplina: '',
    fase: '' as '' | 'boletim' | 'avaliacoes',
  });

  const {semestre: sem, ano, periodo} = useSemestre();
  const [dontshowagain, setdontshowagain] = useMMKVBoolean(
    'dontshowagain.grades',
  );

  useFocusEffect(
    useCallback(() => {
      fetch(
        'https://raw.githubusercontent.com/kkauaon/qaluno/main/version-history.json',
      )
        .then(r => r.json())
        .then((res: IVersionHistory) => {
          if (res.latest > APP_VERSION) {
            setUpdateAvailable(true);
          }
        })
        .catch(() => null);

      return () => {};
    }, []),
  );

  useEffect(() => {
    const d = MMKV.getString(`semestre.${sem}`);
    let registeredData: IDiario[];

    if (d) {
      registeredData = JSON.parse(d) as IDiario[];
      setData(registeredData);
    } else {
      setData([]);
    }

    // Produção apenas ----

    if (!__DEV__) {
      setRefreshing(true);

      Login(MMKV.getString('matricula'), MMKV.getString('senha'))
        .then(() => {
          Boletim(ano, periodo)
            .then(async dataa => {
              for (let diario of dataa) {
                if (!MMKV.getString('cordisciplina.' + diario.descricao)) {
                  MMKV.set(
                    'cordisciplina.' + diario.descricao,
                    randomHexColor(),
                  );
                }
              }

              setData(dataa);
              MMKV.set(`semestre.${sem}`, JSON.stringify(dataa));
              if (!__DEV__)
                await analytics()
                  .logEvent('recarregar_presencas')
                  .catch(e => console.log(e));
              setRefreshing(false);
            })
            .catch(() => {
              setRefreshing(false);
            });
        })
        .catch(err => {
          console.error(err);
          ToastAndroid.show('Falha no login', ToastAndroid.SHORT);
          setRefreshing(false);
        });
    }
    // --------------
  }, []);

  useEffect(() => {
    const d = MMKV.getString(`semestre.${sem}`);
    let registeredData: IDiario[];

    if (d) {
      registeredData = JSON.parse(d) as IDiario[];
      setData(registeredData);
    } else {
      setData([]);
    }
  }, [sem]);

  const onRefresh = useCallback(
    (isSecondTry?: boolean) => {
      setRefreshing(true);
      setLoadingProgress({
        current: 0,
        total: 0,
        currentDisciplina: '',
        fase: 'boletim',
      });

      const d = MMKV.getString(`semestre.${sem}`);
      let registeredData: IDiario[];

      if (d) {
        registeredData = JSON.parse(d) as IDiario[];
      }

      Boletim(ano, periodo)
        .then(async dataa => {
          const total = dataa.length;
          setLoadingProgress(prev => ({...prev, total, fase: 'avaliacoes'}));

          for (let i = 0; i < dataa.length; i++) {
            const dz = dataa[i];
            setLoadingProgress(prev => ({
              ...prev,
              current: i + 1,
              currentDisciplina: dz.descricao,
            }));

            const data2 = await Avaliacoes(dz.idDiario).catch(() => null);

            if (data2)
              MMKV.set(`avaliacoes.${dz.idDiario}`, JSON.stringify(data2));
          }

          for (let diario of dataa) {
            if (!MMKV.getString('cordisciplina.' + diario.descricao)) {
              MMKV.set('cordisciplina.' + diario.descricao, randomHexColor());
            }
          }

          setData(dataa);
          MMKV.set(`semestre.${sem}`, JSON.stringify(dataa));

          await analytics()
            .logEvent('recarregar_notas')
            .catch(e => console.log(e));

          setLoadingProgress({
            current: 0,
            total: 0,
            currentDisciplina: '',
            fase: '',
          });
          setRefreshing(false);
        })
        .catch(() => {
          if (isSecondTry) {
            ToastAndroid.show('Entre novamente', ToastAndroid.SHORT);
            setRefreshing(false);
            setLoadingProgress({
              current: 0,
              total: 0,
              currentDisciplina: '',
              fase: '',
            });
            MMKV.set(`logged`, false);
            navigation.replace('Login');
          } else {
            Login(MMKV.getString('matricula'), MMKV.getString('senha'))
              .then(() => {
                setRefreshing(false);

                onRefresh(true);
              })
              .catch(err => {
                console.error(err);
                ToastAndroid.show('Falha no login', ToastAndroid.SHORT);
                setRefreshing(false);
                setLoadingProgress({
                  current: 0,
                  total: 0,
                  currentDisciplina: '',
                  fase: '',
                });
              });
          }
        });
    },
    [sem],
  );

  // Componente de Loading com Progresso
  const LoadingOverlay = () => {
    if (
      !refreshing ||
      loadingProgress.fase === '' ||
      loadingProgress.fase === 'boletim'
    )
      return null;

    const progress =
      loadingProgress.total > 0
        ? loadingProgress.current / loadingProgress.total
        : 0;

    const progressPercent = Math.round(progress * 100);

    return (
      <Surface
        style={[
          styles.loadingContainer,
          {backgroundColor: theme.colors.surface},
        ]}
        elevation={2}>
        <Icon name="school-outline" size={48} color={theme.colors.primary} />

        <Text
          variant="titleMedium"
          style={{
            marginTop: 16,
            color: theme.colors.onSurface,
            fontWeight: 'bold',
          }}>
          Carregando avaliações
        </Text>

        {loadingProgress.total > 0 && (
          <>
            <View style={styles.progressInfo}>
              <Text variant="labelLarge" style={{color: theme.colors.primary}}>
                {loadingProgress.current} de {loadingProgress.total}
              </Text>
            </View>

            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarBackground,
                  {backgroundColor: theme.colors.surfaceVariant},
                ]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: theme.colors.primary,
                      width: `${progressPercent}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <Text
              variant="bodySmall"
              numberOfLines={1}
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: 'center',
                marginTop: 8,
                paddingHorizontal: 16,
              }}>
              {loadingProgress.currentDisciplina}
            </Text>

            <Text
              variant="labelSmall"
              style={{color: theme.colors.outline, marginTop: 4}}>
              {progressPercent}% concluído
            </Text>
          </>
        )}
      </Surface>
    );
  };

  const [visible, setVisible] = useState(false);
  const [banner, setBanner] = useState(true);
  const [alertData, setAlertData] = useState('');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const hideDialog = () => setVisible(false);
  const showDialog = (msg: string) => {
    setAlertData(msg);
    setVisible(true);
  };
  const openLink = () => {
    Linking.openURL(
      'https://qaluno.netlify.app',
    ).catch(() =>
      ToastAndroid.show('Não foi possível abrir o link.', ToastAndroid.LONG),
    );
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog}>
          <Dialog.Title>Nova nota em</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{alertData}</Text>
          </Dialog.Content>
        </Dialog>
      </Portal>
      <Portal>
        <Dialog
          visible={updateAvailable}
          onDismiss={() => setUpdateAvailable(false)}>
          <Dialog.Title>Atualização disponível</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Nova versão do aplicativo disponível. É necessário atualizar para
              continuar usando o aplicativo.{'\n\n'}Clique no botão para ser redirecionado
              ao site do QAluno ou acesse pelo link:{' '}
              https://qaluno.netlify.app
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={openLink}>Baixar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <SafeAreaView style={{padding: 20}}>
        {!dontshowagain ? (
          <Banner
            visible={banner}
            style={{margin: -20, marginBottom: 20}}
            actions={[
              {
                label: 'Não mostrar novamente',
                onPress: () => setdontshowagain(true),
              },
              {
                label: 'Ok',
                onPress: () => setBanner(false),
              },
            ]}
            icon={({size}) => (
              <MaterialCommunityIcons name="bell-alert" size={size} />
            )}>
            ATENÇÃO! O app não verifica suas notas automaticamente. Arraste para
            baixo para verificar se há alguma nota nova.
          </Banner>
        ) : null}
        <Text variant="titleMedium">
          {ano} / {periodo}
        </Text>

        <Text variant="labelSmall">
          Última verificação de notas:{' '}
          {MMKV.getString(`verificacoes.notas`) || 'nunca'}
        </Text>
        <Text variant="labelSmall">
          Última verificação de presenças:{' '}
          {MMKV.getString(`verificacoes.${ano}.${periodo}.presencas`) ||
            'nunca'}
        </Text>

        <LoadingOverlay />

        {data.length > 0 ? (
          data.map(diario => (
            <Diario
              key={diario.idDiario}
              cor={
                MMKV.getString('cordisciplina.' + diario.descricao) || '#ffffff'
              }
              diario={diario}
              show={showDialog}
              navigation={navigation}
              saved={MMKV.getString(`avaliacoes.${diario.idDiario}`) || '[]'}
            />
          ))
        ) : (
          <View style={styles.container}>
            <Text variant="titleMedium">
              {'\n'}Veja como é simples de usar:{'\n'}1. Arraste para baixo toda
              vez que quiser verificar suas notas!{'\n'}2. As presenças são
              atualizadas automaticamente!{'\n'}3. Como é sua primeira vez,
              comece arrastando para baixo!
            </Text>
          </View>
        )}
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    borderRadius: 16,
    padding: 24,
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInfo: {
    marginTop: 12,
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
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
    backgroundColor: 'green',
    borderRadius: 50,
    width: 40,
    height: 25,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quadrado: {
    backgroundColor: 'white',
    width: 18,
    height: 18,
    borderRadius: 5,
  },
  faltas: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    display: 'flex',
    justifyContent: 'flex-start',
    textAlign: 'left',
  },
});
