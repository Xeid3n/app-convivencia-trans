// screens/CalendarioScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  Alert,
  ActivityIndicator,
  Platform,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { db } from '../firebaseConfig'; 
import { collection, query, onSnapshot } from 'firebase/firestore';

// Configurando o calendário para o português
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan.','Fev.','Mar','Abr','Mai','Jun','Jul.','Ago','Set.','Out.','Nov.','Dez.'],
  dayNames: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  dayNamesShort: ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

const ASYNC_STORAGE_KEY = '@lembretes_calendario';

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

export default function CalendarioScreen() {
  // --- DECLARAÇÃO DOS ESTADOS ---
  const [lembretes, setLembretes] = useState({});
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [novoLembrete, setNovoLembrete] = useState('');
  const [globalEvents, setGlobalEvents] = useState({});

  // --- EFEITO PARA CARREGAR DADOS NA INICIALIZAÇÃO ---
  useEffect(() => {
    // Carrega lembretes pessoais do armazenamento local
    async function carregarDadosPessoais() {
      try {
        const dadosSalvos = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
        if (dadosSalvos !== null) {
          setLembretes(JSON.parse(dadosSalvos));
        }
      } catch (error) {
        Alert.alert("Erro", "Não foi possível carregar os lembretes pessoais.");
      }
    }
    carregarDadosPessoais();

    // Carrega eventos globais do Firestore em tempo real
    const eventsQuery = query(collection(db, 'events'));
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = {};
      snapshot.forEach(doc => {
        const event = doc.data();
        const dateString = event.date;
        if (dateString) {
          if (eventsData[dateString]) {
            eventsData[dateString].push({ id: doc.id, ...event });
          } else {
            eventsData[dateString] = [{ id: doc.id, ...event }];
          }
        }
      });
      setGlobalEvents(eventsData);
    });

    // Função de limpeza para parar de escutar o Firestore
    return () => unsubscribeEvents();
  }, []);

  // --- EFEITO PARA SALVAR LEMBRETES PESSOAIS QUANDO MUDAM ---
  useEffect(() => {
    async function salvarDados() {
      try {
        await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(lembretes));
      } catch (error) { /* Erro silencioso */ }
    }
    salvarDados();
  }, [lembretes]);

  // --- FUNÇÕES DE MANIPULAÇÃO ---
  const handleSalvarLembrete = () => {
    if (novoLembrete.trim() === '') return;
    const lembreteParaSalvar = { id: String(new Date().getTime()), text: novoLembrete };
    const novosLembretes = { ...lembretes };
    const lembretesDoDia = novosLembretes[selectedDate] || [];
    lembretesDoDia.push(lembreteParaSalvar);
    novosLembretes[selectedDate] = lembretesDoDia;
    setLembretes(novosLembretes);
    setNovoLembrete('');
    Keyboard.dismiss();
  };
  
  const handleDeletarLembrete = (id) => {
    const novosLembretes = { ...lembretes };
    let lembretesDoDia = novosLembretes[selectedDate] || [];
    novosLembretes[selectedDate] = lembretesDoDia.filter(item => item.id !== id);
    if (novosLembretes[selectedDate].length === 0) {
      delete novosLembretes[selectedDate];
    }
    setLembretes(novosLembretes);
  };

  // --- LÓGICA DE RENDERIZAÇÃO ---
  const itemsParaOdia = useMemo(() => {
    const personalItems = lembretes[selectedDate] || [];
    const globalItems = globalEvents[selectedDate] || [];
    return [...personalItems, ...globalItems];
  }, [lembretes, globalEvents, selectedDate]);

  const markedDates = useMemo(() => {
    const marks = {};
    for (const date in lembretes) {
      if (lembretes[date].length > 0) {
        marks[date] = { dots: [{ key: 'pessoal', color: '#89CFF0' }], marked: true };
      }
    }
    for (const date in globalEvents) {
      const existingDots = marks[date]?.dots || [];
      marks[date] = { ...marks[date], dots: [...existingDots, { key: 'global', color: 'blue' }], marked: true };
    }
    if (selectedDate) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: 'lightblue' };
    }
    return marks;
  }, [lembretes, globalEvents, selectedDate]);

  const renderItem = ({ item }) => {
    const isGlobalEvent = item.title !== undefined;

    if (isGlobalEvent) {
      // Lógica para renderizar Eventos Globais
      const handleEventPress = () => {
    // Só tenta abrir o mapa se o campo 'location' existir no evento
    if (item.location) {
      // Prepara a localização para ser usada na URL, trocando espaços por '+' etc.
      const encodedLocation = encodeURIComponent(item.location);

      // NOVO FORMATO DE URL: Link universal do Google Maps que funciona em tudo
      const url = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;

      // --- Depuração: Vamos ver o link que estamos tentando abrir ---
      console.log("Tentando abrir o link do mapa:", url);

      // Tenta abrir a URL e captura qualquer erro que possa acontecer
      Linking.openURL(url).catch(err => {
        console.error("Erro ao tentar abrir o link:", err);
        Alert.alert("Erro", "Não foi possível abrir o aplicativo de mapas.");
      });
    }
  };

      return (
        <TouchableOpacity onPress={handleEventPress} disabled={!item.location}>
          <View style={styles.globalEventItem}>
            <Text style={styles.itemTitle}>{`EVENTO: ${item.title}`}</Text>
            {/* Mostra a descrição, se houver */}
            {item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
            {/* Mostra a localização com um ícone, se houver */}
            {item.location && <Text style={styles.locationText}>📍 {item.location}</Text>}
          </View>
        </TouchableOpacity>
      );

    } else {
      // Lógica para renderizar Lembretes Pessoais (continua a mesma)
      return (
        <View style={styles.lembreteItem}>
          <Text style={styles.lembreteText}>{item.text}</Text>
          <TouchableOpacity onPress={() => handleDeletarLembrete(item.id)}>
            <Text style={styles.deleteText}>X</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        monthFormat={'MMMM yyyy'}
        theme={{ todayTextColor: '#89CFF0', arrowColor: '#89CFF0' }}
      />
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Atividades para {selectedDate}:</Text>
        <FlatList
          data={itemsParaOdia}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={() => <Text style={styles.emptyText}>Nenhuma atividade para este dia.</Text>}
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Adicionar lembrete pessoal..."
          value={novoLembrete}
          onChangeText={setNovoLembrete}
        />
        <TouchableOpacity style={styles.button} onPress={handleSalvarLembrete}>
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  listTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  inputContainer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderColor: '#eee' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 20, marginRight: 10 },
  button: { backgroundColor: '#89CFF0', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 24 },
  lembreteItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 15, borderRadius: 5, marginBottom: 10 },
  globalEventItem: { backgroundColor: '#e6f7ff', borderColor: '#91d5ff', borderWidth: 1, padding: 15, borderRadius: 5, marginBottom: 10 },
  lembreteText: { fontSize: 16 },
  deleteText: { color: 'red', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 20 },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  itemDescription: { fontSize: 14, color: '#555', marginTop: 4 },
  locationText: { fontSize: 14, color: 'blue', marginTop: 8, fontStyle: 'italic' },
});