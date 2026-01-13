/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type {PropsWithChildren} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';

import {
  Appbar,
  IconButton,
  PaperProvider,
  adaptNavigationTheme,
  useTheme,
} from 'react-native-paper';

import {
  getFocusedRouteNameFromRoute,
  NavigationContainer,
  ParamListBase,
  RouteProp,
} from '@react-navigation/native';

import {MD3LightTheme, MD3DarkTheme, Text, Button} from 'react-native-paper';

import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';

import {createMaterialBottomTabNavigator} from 'react-native-paper/react-navigation';
// @ts-ignore: Typings.
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Notas from './pages/Notas';
import Turma from './pages/Turma';

import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from './pages/Login';
import Materiais from './pages/Materiais';
import Disciplina from './pages/Disciplina';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {normalizeName} from './helpers/Util';
import WebPage from './pages/WebPage';
import {SemestreProvider} from './contexts/SemestreContext';

const Stack = createNativeStackNavigator();

const {LightTheme, DarkTheme} = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CombinedDefaultTheme = {
  ...MD3LightTheme,
  ...LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...LightTheme.colors,
  },
};
const CombinedDarkTheme = {
  ...MD3DarkTheme,
  ...DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkTheme.colors,
  },
};

const Tab = createMaterialBottomTabNavigator();

function getHeaderTitle(route: RouteProp<ParamListBase, 'Home'>) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'Grades';

  switch (routeName) {
    case 'Grades':
      return 'Notas';
    case 'Class':
      return 'Turma';
    case 'Materials':
      return 'Materiais de Aula';
  }
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <PaperProvider
        theme={isDarkMode ? CombinedDarkTheme : CombinedDefaultTheme}>
        <SemestreProvider>
          <BottomSheetModalProvider>
            <NavigationContainer
              theme={isDarkMode ? NavigationDarkTheme : CombinedDefaultTheme}>
              <Stack.Navigator
                screenOptions={({navigation}) => ({
                  headerShown: true,
                  headerRight: () => (
                    <IconButton
                      icon="comment-plus-outline"
                      onPress={() =>
                        navigation.push('WebView', {
                          url: 'https://qaluno.netlify.app/rate',
                        })
                      }></IconButton>
                  ),
                })}>
                <Stack.Screen
                  name="Login"
                  component={Login}
                  options={{headerShown: false}}
                />
                <Stack.Screen
                  name="Home"
                  component={Tabs}
                  options={({route}) => ({
                    headerTitle: getHeaderTitle(route),
                    headerStyle: {
                      backgroundColor: isDarkMode
                        ? CombinedDarkTheme.colors.secondaryContainer
                        : CombinedDefaultTheme.colors.secondaryContainer,
                    },
                  })}
                />
                <Stack.Screen
                  name="Disciplina"
                  component={Disciplina}
                  options={({route}) => ({
                    /*// @ts-ignore fix later typings
							headerTitle: route.params.diario.descricao,
							// @ts-ignore fix later typings
							headerStyle: { backgroundColor: route.params.cor },*/
                    // @ts-ignore fix later typings
                    headerStyle: {backgroundColor: route.params.cor},
                    headerTintColor: 'black',
                    headerRight: undefined,
                    headerTitle: props => (
                      // @ts-ignore fix later typings
                      <Text
                        numberOfLines={2}
                        variant="titleMedium"
                        style={{
                          marginLeft: -15,
                          marginRight: 60,
                          textAlign: 'left',
                          color: 'black',
                        }}>
                        {normalizeName(route.params.diario.descricao)}
                      </Text>
                    ),
                  })}
                />
                <Stack.Screen
                  name="WebView"
                  component={WebPage}
                  options={{headerRight: undefined}}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </BottomSheetModalProvider>
        </SemestreProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

function Tabs(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Tab.Navigator
      initialRouteName="Grades"
      theme={isDarkMode ? MD3DarkTheme : MD3LightTheme}>
      <Tab.Screen
        name="Class"
        component={Turma}
        options={{
          tabBarLabel: 'Turma',
          tabBarIcon: ({color}) => (
            <MaterialCommunityIcons name="home" color={color} size={26} />
          ),
          title: 'Turma',
        }}
      />
      <Tab.Screen
        name="Grades"
        component={Notas}
        options={{
          tabBarLabel: 'Notas',
          tabBarIcon: ({color}) => (
            <MaterialCommunityIcons name="school" color={color} size={26} />
          ),
          title: 'Notas',
        }}
      />
      <Tab.Screen
        name="Materials"
        component={Materiais}
        options={{
          tabBarLabel: 'Materiais',
          tabBarIcon: ({color}) => (
            <MaterialCommunityIcons name="folder" color={color} size={26} />
          ),
          title: 'Materiais',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  quadrado: {
    backgroundColor: 'white',
    width: 23,
    height: 23,
    borderRadius: 5,
  },
});

export default App;
