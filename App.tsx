/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
	SafeAreaView,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	useColorScheme,
	View,
} from 'react-native';

import { PaperProvider, adaptNavigationTheme, useTheme } from 'react-native-paper';

import { NavigationContainer } from '@react-navigation/native';

import {
	MD3LightTheme,
	MD3DarkTheme,
} from 'react-native-paper';

import {
	DarkTheme as NavigationDarkTheme,
	DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';

import { createMaterialBottomTabNavigator } from 'react-native-paper/react-navigation';
// @ts-ignore: Typings.
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Grades from './Pages/Grades';
import Home from './Pages/Home';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Entrar from './Pages/Entrar';
import Materials from './Pages/Materials';
import Disciplina from './Pages/Disciplina';

const Stack = createNativeStackNavigator();

const { LightTheme, DarkTheme } = adaptNavigationTheme({
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

function App(): React.JSX.Element {
	const isDarkMode = useColorScheme() === 'dark';

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<PaperProvider theme={isDarkMode ? CombinedDarkTheme : CombinedDefaultTheme}>
				<NavigationContainer theme={isDarkMode ? NavigationDarkTheme : CombinedDefaultTheme}>
					<Stack.Navigator screenOptions={{ headerShown: false }}>
						<Stack.Screen name="Login" component={Entrar} />
						<Stack.Screen name="Home" component={Tabs} />
						<Stack.Screen name="Disciplina" component={Disciplina} />
					</Stack.Navigator>
				</NavigationContainer>
			</PaperProvider>			
		</GestureHandlerRootView>

	)
}

function Tabs(): React.JSX.Element {
	const isDarkMode = useColorScheme() === 'dark';

	return (
		<Tab.Navigator initialRouteName='Grades' theme={isDarkMode ? MD3DarkTheme : MD3LightTheme}>
			<Tab.Screen
				name="Class"
				component={Home}
				options={{
					tabBarLabel: 'Turma',
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons name="home" color={color} size={26} />
					),
				}}
			/>
			<Tab.Screen
				name="Grades"
				component={Grades}
				options={{
					tabBarLabel: 'Notas',
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons name="school" color={color} size={26} />
					),
				}}
			/>
			<Tab.Screen
				name="Materials"
				component={Materials}
				options={{
					tabBarLabel: 'Materiais',
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons name="folder" color={color} size={26} />
					),
				}}
			/>
		</Tab.Navigator>
	)
}


const styles = StyleSheet.create({

});

export default App;
