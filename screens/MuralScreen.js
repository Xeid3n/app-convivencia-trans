// screens/MuralScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, 
  KeyboardAvoidingView, Platform, ActivityIndicator, Image 
} from 'react-native';
import { app, auth, db } from '../firebaseConfig';
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';

export default function MuralScreen() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null); // Estado para guardar o perfil do usuário

  const currentUser = auth.currentUser;

  // Efeito para carregar o perfil do usuário logado E as mensagens do mural
  useEffect(() => {
    // Busca o perfil do usuário para pegar nome e foto
    const fetchUserProfile = async () => {
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      }
    };
    fetchUserProfile();

    // Busca as mensagens do mural em tempo real
    const q = query(collection(db, 'mural'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setMessages(messagesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSendMessage = async () => {
    console.log("Enviando mensagem... Estado do userProfile:", userProfile);
    if (newMessage.trim() === '' || !currentUser) return;

    try {
      await addDoc(collection(db, 'mural'), {
        text: newMessage,
        createdAt: serverTimestamp(),
        userId: currentUser.uid, // Carimbo do ID do usuário
        userName: userProfile?.displayName || "Anônimo", // Carimbo do Nome
        userPhotoURL: userProfile?.photoURL || null, // Carimbo da Foto
      });
      setNewMessage('');
    } catch (error) {
      console.error("Erro ao enviar mensagem: ", error);
      Alert.alert("Não foi possível enviar a mensagem.");
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMyMessage = item.userId === currentUser.uid; // Verifica se a mensagem é do usuário logado

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
        {!isMyMessage && (
            <Image 
                source={{ uri: item.userPhotoURL || 'https://via.placeholder.com/150' }} 
                style={styles.profilePic}
            />
        )}
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
          {!isMyMessage && <Text style={styles.userName}>{item.userName}</Text>}
          <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="tomato" /></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container} keyboardVerticalOffset={90}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        inverted
      />
      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder="Escreva uma mensagem de apoio..." value={newMessage} onChangeText={setNewMessage} editable={!!userProfile} />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} disabled={!userProfile}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// --- ESTILOS ATUALIZADOS ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f0f0' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messageContainer: {
        flexDirection: 'row',
        marginVertical: 5,
        marginHorizontal: 10,
        alignItems: 'flex-end',
    },
    myMessageContainer: {
        justifyContent: 'flex-end',
    },
    otherMessageContainer: {
        justifyContent: 'flex-start',
    },
    profilePic: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        marginRight: 8,
    },
    messageBubble: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        maxWidth: '80%',
    },
    myMessageBubble: {
        backgroundColor: '#55CDFC',
    },
    otherMessageBubble: {
        backgroundColor: 'white',
    },
    userName: {
        fontWeight: 'bold',
        fontSize: 13,
        color: 'gray',
        marginBottom: 3,
    },
    myMessageText: {
        color: 'white',
        fontSize: 16,
    },
    otherMessageText: {
        color: 'black',
        fontSize: 16,
    },
    inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#ddd' },
    input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10 },
    sendButton: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
    sendButtonText: { color: '#F7A8B8', fontSize: 16, fontWeight: 'bold' },
});