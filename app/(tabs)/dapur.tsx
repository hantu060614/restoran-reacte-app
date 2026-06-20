import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

const THEME = {
  background: "#0F172A",
  surface: "#1E293B",
  primary: "#F97316",
  textMain: "#F8FAFC",
  textSecondary: "#94A3B8",
  inputBg: "#334155",
  success: "#10B981",
  warning: "#F59E0B",
};

export default function DapurScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only use `where` in query to prevent Firebase Composite Index requirements
    const q = query(
      collection(db, "tbpemesanan"), 
      where("status", "==", "dimasak")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: any[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        const dateObj = d.createdAt ? d.createdAt.toDate() : new Date();
        fetched.push({
          id: doc.id,
          ...d,
          createdAtRaw: dateObj,
          waktu: dateObj.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })
        });
      });
      
      // Sort in JavaScript instead of Firestore to avoid manual index creation
      fetched.sort((a, b) => a.createdAtRaw.getTime() - b.createdAtRaw.getTime());
      
      setOrders(fetched);
      setLoading(false);
    }, (err) => {
      console.log("Error fetching kitchen orders:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsReady = async (id: string) => {
    try {
      await updateDoc(doc(db, "tbpemesanan", id), {
        status: "selesai"
      });
    } catch (error) {
      console.log("Error updating order status", error);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>{item.orderId}</Text>
          <Text style={styles.orderTime}>Waktu Pesan: {item.waktu}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.tipePesanan}</Text>
        </View>
      </View>

      {item.tipePesanan === "Makan di Tempat" && (
        <View style={styles.tableBadge}>
          <Text style={styles.tableText}>Meja {item.nomorMeja}</Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.itemList}>
        {item.items.map((it: any, idx: number) => (
          <View key={idx} style={styles.itemRow}>
            <View style={styles.qtyBox}>
              <Text style={styles.qtyText}>{it.qty}x</Text>
            </View>
            <Text style={styles.itemName}>{it.nama}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.doneBtn}
        onPress={() => markAsReady(item.id)}
      >
        <Ionicons name="checkmark-done" size={20} color="#fff" />
        <Text style={styles.doneBtnText}>Siap Disajikan</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dapur / KDS</Text>
        <Text style={styles.headerSub}>{orders.length} Pesanan Menunggu</Text>
      </View>

      {loading ? (
        <Text style={styles.emptyText}>Memuat pesanan...</Text>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={60} color={THEME.inputBg} />
          <Text style={styles.emptyText}>Tidak ada pesanan masuk.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    color: THEME.textMain,
    fontSize: 28,
    fontWeight: "800",
  },
  headerSub: {
    color: THEME.warning,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: THEME.textSecondary,
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  orderCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: THEME.warning,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderId: {
    color: THEME.textMain,
    fontSize: 18,
    fontWeight: "bold",
  },
  orderTime: {
    color: THEME.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    backgroundColor: THEME.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "bold",
  },
  tableBadge: {
    backgroundColor: THEME.primary + "20",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: THEME.primary,
  },
  tableText: {
    color: THEME.primary,
    fontWeight: "900",
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.inputBg,
    marginVertical: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: THEME.inputBg,
  },
  itemList: {
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  qtyBox: {
    backgroundColor: THEME.inputBg,
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  qtyText: {
    color: THEME.textMain,
    fontWeight: "bold",
    fontSize: 14,
  },
  itemName: {
    color: THEME.textMain,
    fontSize: 16,
    flex: 1,
  },
  doneBtn: {
    backgroundColor: THEME.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
