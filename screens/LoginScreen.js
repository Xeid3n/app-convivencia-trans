// screens/LoginScreen.js
import React, { useState, useRef } from 'react';
// ADICIONADO: TextInput e ActivityIndicator
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { MaskedTextInput } from "react-native-mask-text";
import { app, auth } from '../firebaseConfig';

export default function LoginScreen() {
  const recaptchaVerifier = useRef(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false); // ADICIONADO: Estado de carregamento

  const sendVerification = async () => {
    // LINHA DE DEPURAÇÃO: Vamos ver o que está sendo verificado
    console.log("Verificando o número:", phoneNumber, "Comprimento:", phoneNumber.length);
    // ADICIONADO: Validação do comprimento do número
    if (phoneNumber.length !== 14) { // Formato +5511987654321 tem 14 caracteres
      Alert.alert("Número Inválido", "Por favor, preencha o número de telefone completo.");
      return;
    }
    setLoading(true); // ADICIONADO
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const id = await phoneProvider.verifyPhoneNumber(phoneNumber, recaptchaVerifier.current);
      setVerificationId(id);
      Alert.alert("Código Enviado!", "Verifique seu SMS e insira o código de 6 dígitos.");
    } catch (error) {
      Alert.alert("Erro", `Não foi possível enviar o código. ${error.message}`);
    }
    setLoading(false); // ADICIONADO
  };

  const confirmCode = async () => {
    setLoading(true); // ADICIONADO
    try {
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      await signInWithCredential(auth, credential);
    } catch (error) {
      Alert.alert("Erro", `Código inválido ou expirado. ${error.message}`);
    }
    setLoading(false); // ADICIONADO
  };

  return (
    <View style={styles.container}>
      <FirebaseRecaptchaVerifierModal ref={recaptchaVerifier} firebaseConfig={app.options} title="Confirme que você não é um robô" cancelLabel="x"/>

      <Text style={styles.title}>Login por Telefone</Text>

      {!verificationId ? (
        <>
          <Text style={styles.label}>Digite seu número de telefone:</Text>
          <MaskedTextInput
            style={styles.input}
            mask="+55 (99) 99999-9999"
            placeholder="+55 (11) 91234-5678"
            keyboardType="phone-pad"
            onChangeText={(text, rawText) => {
              const numeroFinal = "+" + rawText;
               setPhoneNumber(numeroFinal);
            }}
          />
          <TouchableOpacity style={styles.button} onPress={sendVerification} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar Código</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>Digite o código de 6 dígitos:</Text>
          <TextInput
            style={styles.input}
            placeholder="123456"
            keyboardType="number-pad"
            onChangeText={setVerificationCode}
            value={verificationCode}
            maxLength={6}
          />
          <TouchableOpacity style={styles.button} onPress={confirmCode} disabled={loading}>
             {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirmar e Entrar</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  label: { fontSize: 16, marginBottom: 10, color: 'gray' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 5, fontSize: 18, marginBottom: 20 },
  button: { backgroundColor: 'pink', padding: 15, borderRadius: 5, alignItems: 'center', height: 55 }, // ADICIONADO: altura fixa
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});