// screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { db, auth} from '../firebaseConfig';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

// Função para formatar a data para um formato mais amigável (ex: 14 de Junho)
const formatEventDate = (dateString) => {
  const [year, month, day] = dateString.split('-');
  const date = new Date(year, month - 1, day);
  const options = { day: 'numeric', month: 'long' };
  return date.toLocaleDateString('pt-BR', options);
};

export default function HomeScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser; // Pega o usuário logado

  useEffect(() => {
    // Busca os eventos e ordena pela data
    const eventsQuery = query(collection(db, 'events'), orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const today = new Date().toISOString().split('T')[0]; // Data de hoje no formato YYYY-MM-DD
      
      const upcomingEvents = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(event => event.date >= today); // Filtra para pegar apenas eventos de hoje em diante

      setEvents(upcomingEvents);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderEventItem = ({ item }) => (
    <View style={styles.eventCard}>
      <Text style={styles.eventDate}>{formatEventDate(item.date)}</Text>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDescription}>{item.description}</Text>
      {item.location && <Text style={styles.eventLocation}>📍 {item.location}</Text>}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeTitle}>Bem-vinde de volta!</Text>
      <Text style={styles.subTitle}>Próximos Eventos da Comunidade</Text>
      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>Nenhum evento global agendado no momento.</Text>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 18,
    color: 'gray',
    marginBottom: 20,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'tomato',
    marginBottom: 5,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 15,
    color: '#333',
  },
  eventLocation: {
    fontSize: 14,
    color: 'blue',
    marginTop: 10,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: 'gray',
    marginTop: 50,
    fontSize: 16,
  },
});