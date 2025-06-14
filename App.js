// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

// Importando a autenticação do nosso arquivo de configuração
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

// Importando nossas telas
import HomeScreen from './screens/HomeScreen';
import CalendarioScreen from './screens/CalendarioScreen';
import RecursosScreen from './screens/RecursosScreen';
import MuralScreen from './screens/MuralScreen';
import LoginScreen from './screens/LoginScreen'; 
import PerfilScreen from './screens/PerfilScreen'; 

const Tab = createBottomTabNavigator();

// Separamos o navegador de abas em seu próprio componente
function MainAppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Início') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Calendário') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Recursos') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Mural') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'pink',
        tabBarInactiveTintColor: '#89CFF0'
      })}
    >
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Calendário" component={CalendarioScreen} />
      <Tab.Screen name="Recursos" component={RecursosScreen} />
      <Tab.Screen name="Mural" component={MuralScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null); // Para guardar a informação do usuário logado
  const [loading, setLoading] = useState(true); // Para mostrar um "carregando" inicial

  useEffect(() => {
    // onAuthStateChanged é o nosso "espião"
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Se o usuário logar, currentUser terá os dados. Se deslogar, será null.
      setLoading(false);
    });

    // Limpa o "espião" quando o app é fechado
    return () => unsubscribe();
  }, []);

  // Enquanto o Firebase verifica se há um usuário logado, mostramos uma tela de "carregando"
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // O Porteiro: decide qual tela mostrar
  return (
    <NavigationContainer>
      {user ? <MainAppTabs /> : <LoginScreen />}
    </NavigationContainer>
  );
}