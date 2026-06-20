import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// We use simple hardcoded Auth for demonstration to avoid Firebase Auth Console setup complexities.
// In a real production app, this should query Firestore `tbusers` or use Firebase Auth.
const USERS = [
  { username: "admin", password: "123", role: "admin" },
  { username: "kasir", password: "123", role: "kasir" },
  { username: "dapur", password: "123", role: "dapur" }
];

const THEME = {
  background: "#0F172A",
  surface: "#1E293B",
  primary: "#F97316",
  textMain: "#F8FAFC",
  textSecondary: "#94A3B8",
  inputBg: "#334155",
};

// Global state to store current role (In production, use Context/Redux + AsyncStorage)
export let currentUserRole = "admin"; 

export const setRole = (role: string) => {
  currentUserRole = role;
};

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    const user = USERS.find(u => u.username === username.toLowerCase() && u.password === password);
    if (user) {
      setRole(user.role);
      Alert.alert("Login Berhasil", `Selamat datang, ${user.username}!`);
      
      // Navigate based on role
      if (user.role === "dapur") {
        router.replace("/(tabs)/dapur");
      } else if (user.role === "kasir") {
        router.replace("/(tabs)/pemesanan");
      } else {
        router.replace("/(tabs)/dashboard");
      }
    } else {
      Alert.alert("Login Gagal", "Username atau Password salah.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoBox}>
          <Ionicons name="restaurant" size={60} color={THEME.primary} />
        </View>
        <Text style={styles.title}>Restoran Berkah</Text>
        <Text style={styles.subtitle}>Masuk untuk melanjutkan</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="admin / kasir / dapur"
            placeholderTextColor={THEME.textSecondary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="123"
            placeholderTextColor={THEME.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>Masuk</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>Demo Accounts:</Text>
          <Text style={styles.hintText}>• Admin (Semua Akses): admin / 123</Text>
          <Text style={styles.hintText}>• Kasir (Kasir Saja): kasir / 123</Text>
          <Text style={styles.hintText}>• Dapur (Dapur Saja): dapur / 123</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logoBox: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: THEME.textMain,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.textSecondary,
    textAlign: "center",
    marginBottom: 40,
  },
  form: {
    backgroundColor: THEME.surface,
    padding: 24,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  label: {
    color: THEME.textMain,
    fontWeight: "600",
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: THEME.inputBg,
    color: THEME.textMain,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  loginBtn: {
    backgroundColor: THEME.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  hintBox: {
    marginTop: 40,
    padding: 16,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.3)",
  },
  hintTitle: {
    color: THEME.primary,
    fontWeight: "bold",
    marginBottom: 8,
  },
  hintText: {
    color: THEME.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  }
});
