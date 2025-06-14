import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';

export default function RecursosScreen() {
  // A função renderItem corrigida
  const renderItem = ({ item }) => {
    // A função handlePress agora está dentro do corpo da função
    const handlePress = () => {
      if (item.type === 'whatsapp') {
        // Se for whatsapp, monta a URL especial e abre
        Linking.openURL(`https://wa.me/${item.number}`);
      } else {
        // Senão, abre o link normal
        Linking.openURL(item.url);
      }
    };

    // E nós retornamos o JSX explicitamente
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={handlePress} // <-- Agora chama a função correta!
      >
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={RECURSOS_DATA}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

// Adapte o seu StyleSheet para incluir os novos estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Um cinza claro para o fundo
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 14,
    color: '#333',
  },
});

const RECURSOS_DATA = [
  {
    id: '1',
    title: 'Como Retificar Nome e Gênero',
    description: 'Guia completo do processo de retificação de documentos.',
    url: 'https://www.google.com/search?q=guia+retificação+de+nome' 
  },

  {
    id: '2',
    title: 'AME PRO TRANS WHATSAPP',
    description: 'Whatsapp do ambulatorio de Guarulhos.',
    number: '5511912015072',
    type: 'whatsapp'
    
  },

  {
    id: '3',
    title: 'CTA WHATSAPP',
    description: 'Whatsapp do Centro de testagem e aconselhamento de Guarulhos.',
    number: '5511918252753',
    type: 'whatsapp'
    
  },

  {
    id: '4',
    title: 'Direitos da População Trans no Brasil',
    description: 'Conheça seus direitos no trabalho, saúde e educação.',
    url: 'https://www.google.com/search?q=direitos+população+trans+brasil'
  },
];