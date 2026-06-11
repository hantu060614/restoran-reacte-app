import { StyleSheet, Text, View } from "react-native";

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard Restoran</Text>
      <Text style={styles.subtitle}>
        Selamat datang di aplikasi pemesanan makanan dan minuman berbasis Firebase.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    padding: 22,
    justifyContent: "center",
  },
  title: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#d1d5db",
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 22,
  },
});
