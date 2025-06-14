// screens/PerfilScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Button, Image, TouchableOpacity, ActivityIndicator, Alert, TextInput 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { app, auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function PerfilScreen() {
  const user = auth.currentUser;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // --- NOVO ESTADO para guardar o nome que o usuário digita ---
  const [name, setName] = useState('');

  // Efeito para carregar os dados do perfil do Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setProfile(profileData);
          // --- NOVO: Preenche o campo de nome com o valor salvo ---
          setName(profileData.displayName || '');
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  // Função para escolher a imagem (continua a mesma)
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permissão necessária", "Você precisa permitir o acesso à galeria.");
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!pickerResult.canceled) {
      uploadImage(pickerResult.assets[0].uri);
    }
  };

  // Função de upload (continua a mesma)
  const uploadImage = async (uri) => {
    setUploading(true);
    const response = await fetch(uri);
    const blob = await response.blob();
    const storage = getStorage(app);
    const storageRef = ref(storage, `profile_pictures/${user.uid}`);
    const uploadTask = uploadBytesResumable(storageRef, blob);
    uploadTask.on('state_changed', null, 
      (error) => {
        setUploading(false);
        Alert.alert("Erro de upload", "Não foi possível enviar sua foto.");
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          handleSaveProfile({ photoURL: downloadURL }); // Alterado para chamar a função genérica de salvar
          setUploading(false);
        });
      }
    );
  };

  // --- FUNÇÃO ATUALIZADA para salvar nome e/ou foto ---
  const handleSaveProfile = async (dataToSave) => {
    if (user) {
      const docRef = doc(db, "users", user.uid);
      try {
        // A 'dataToSave' pode ser { displayName: name } ou { photoURL: url }
        await setDoc(docRef, dataToSave, { merge: true });
        // Atualiza o estado local para a mudança aparecer na hora
        setProfile(prevProfile => ({ ...prevProfile, ...dataToSave }));
        Alert.alert("Sucesso!", "Seu perfil foi atualizado.");
      } catch (error) {
        Alert.alert("Erro", "Não foi possível salvar seu perfil.");
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="tomato" /></View>;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} disabled={uploading}>
        <Image
          source={{ uri: profile?.photoURL || 'https://via.placeholder.com/150' }}
          style={styles.profileImage}
        />
        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.infoText}>Toque na imagem para alterar</Text>

      {/* --- NOVA SEÇÃO PARA EDITAR O NOME --- */}
      <Text style={styles.label}>Seu nome de exibição:</Text>
      <TextInput
        style={styles.input}
        placeholder="Como você gostaria de ser chamado(a)?"
        value={name}
        onChangeText={setName}
      />
      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={() => handleSaveProfile({ displayName: name })}
      >
        <Text style={styles.saveButtonText}>Salvar Nome</Text>
      </TouchableOpacity>
      
      {/* Botão de Logout agora com mais espaço */}
      <View style={styles.logoutButtonContainer}>
        <Button title="Sair (Logout)" onPress={handleLogout} color="#F7A8B8" />
      </View>
    </View>
  );
}

// --- ESTILOS ATUALIZADOS ---
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20, paddingTop: 40 },
  profileImage: { width: 150, height: 150, borderRadius: 75, borderWidth: 3, borderColor: '#F7A8B8' },
  uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderRadius: 75 },
  infoText: { color: 'gray', marginTop: 5, marginBottom: 30 },
  label: { fontSize: 16, color: 'gray', alignSelf: 'flex-start', marginLeft: '5%', marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    borderRadius: 5,
    fontSize: 16,
    marginBottom: 15,
    width: '90%',
  },
  saveButton: {
    backgroundColor: '#55CDFC',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    width: '90%',
  },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  logoutButtonContainer: {
    marginTop: 40,
  }
});