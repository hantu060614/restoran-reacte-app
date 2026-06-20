import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { BarChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

// --- THEME ---
const THEME = {
  background: "#0F172A",
  surface: "#1E293B",
  primary: "#F97316",
  textMain: "#F8FAFC",
  textSecondary: "#94A3B8",
  inputBg: "#334155",
  success: "#10B981",
  danger: "#EF4444",
};

// --- TYPES ---
type DashboardData = {
  pendapatanHariIni: number;
  transaksiHariIni: number;
  menuAktif: number;
};

type RecentOrder = {
  id: string;
  orderId: string;
  total: number;
  metodePembayaran: string;
  waktu: string;
};

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData & { chartLabels: string[], chartValues: number[] }>({
    pendapatanHariIni: 0,
    transaksiHariIni: 0,
    menuAktif: 0,
    chartLabels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
    chartValues: [0, 0, 0, 0, 0, 0, 0],
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // 7 days window

    const qOrders = query(collection(db, "tbpemesanan"), orderBy("createdAt", "desc"));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      let pendapatan = 0;
      let transaksiCount = 0;
      const recent: RecentOrder[] = [];
      
      const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const chartMap = new Map();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        chartMap.set(dateStr, { day: dayNames[d.getDay()], revenue: 0 });
      }

      snapshot.forEach((doc) => {
        const d = doc.data();
        const createdAt = d.createdAt?.toDate();
        
        if (createdAt) {
          if (createdAt >= today) {
            pendapatan += Number(d.total || 0);
            transaksiCount += 1;
          }

          if (createdAt >= sevenDaysAgo) {
            const dateStr = createdAt.toISOString().split('T')[0];
            if (chartMap.has(dateStr)) {
               const current = chartMap.get(dateStr);
               chartMap.set(dateStr, { ...current, revenue: current.revenue + Number(d.total || 0) });
            }
          }

          if (recent.length < 5) {
            recent.push({
              id: doc.id,
              orderId: d.orderId,
              total: Number(d.total || 0),
              metodePembayaran: d.metodePembayaran,
              waktu: createdAt.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }),
            });
          }
        }
      });

      const labels: string[] = [];
      const values: number[] = [];
      chartMap.forEach((val) => {
         labels.push(val.day);
         values.push(val.revenue);
      });

      setData(prev => ({ 
        ...prev, 
        pendapatanHariIni: pendapatan, 
        transaksiHariIni: transaksiCount,
        chartLabels: labels,
        chartValues: values
      }));
      setRecentOrders(recent);
      setLoading(false);
    }, (err) => {
      console.log("Error fetching orders for dashboard:", err);
      setLoading(false);
    });

    // 2. Listen to Menus (to get active menus count)
    const qMenus = query(collection(db, "tbmenu"), where("tersedia", "==", true));
    const unsubMenus = onSnapshot(qMenus, (snapshot) => {
      setData(prev => ({ ...prev, menuAktif: snapshot.size }));
    });

    return () => {
      unsubOrders();
      unsubMenus();
    };
  }, []);

  const renderSkeleton = () => (
    <View>
      <View style={styles.mainCard}>
        <View style={styles.skeletonTextSmall} />
        <View style={styles.skeletonTextLarge} />
      </View>
      <View style={styles.rowCards}>
        <View style={styles.subCard}>
          <View style={styles.skeletonTextSmall} />
          <View style={styles.skeletonTextMedium} />
        </View>
        <View style={styles.subCard}>
          <View style={styles.skeletonTextSmall} />
          <View style={styles.skeletonTextMedium} />
        </View>
      </View>
      <Text style={styles.sectionTitle}>5 Transaksi Terakhir</Text>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.recentCard}>
          <View style={{flex: 1}}>
            <View style={[styles.skeletonTextMedium, {width: 100}]} />
            <View style={[styles.skeletonTextSmall, {width: 60}]} />
          </View>
          <View style={[styles.skeletonTextMedium, {width: 80}]} />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Ringkasan bisnis hari ini</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          renderSkeleton()
        ) : (
          <>
            {/* METRICS */}
            <View style={styles.mainCard}>
              <View style={styles.mainCardTop}>
                <View>
                  <Text style={styles.mainCardLabel}>Total Pendapatan</Text>
                  <Text style={styles.mainCardValue}>Rp {data.pendapatanHariIni.toLocaleString("id-ID")}</Text>
                </View>
                <View style={styles.iconCircle}>
                  <Ionicons name="stats-chart" size={24} color="#fff" />
                </View>
              </View>
              <View style={styles.dateBadge}>
                <Text style={styles.dateBadgeText}>Hari Ini</Text>
              </View>
            </View>

            <View style={styles.rowCards}>
              <View style={styles.subCard}>
                <Ionicons name="receipt-outline" size={24} color={THEME.primary} style={{marginBottom: 8}} />
                <Text style={styles.subCardValue}>{data.transaksiHariIni}</Text>
                <Text style={styles.subCardLabel}>Transaksi</Text>
              </View>
              <View style={styles.subCard}>
                <Ionicons name="fast-food-outline" size={24} color={THEME.primary} style={{marginBottom: 8}} />
                <Text style={styles.subCardValue}>{data.menuAktif}</Text>
                <Text style={styles.subCardLabel}>Menu Aktif</Text>
              </View>
            </View>

            {/* CHART ANALYTICS */}
            <Text style={styles.sectionTitle}>Grafik Penjualan (7 Hari)</Text>
            <View style={styles.chartCard}>
              <BarChart
                data={{
                  labels: data.chartLabels,
                  datasets: [
                    {
                      data: data.chartValues,
                    },
                  ],
                }}
                width={screenWidth - 80} // padding 24*2 + card padding 16*2
                height={220}
                yAxisLabel="Rp"
                yAxisSuffix=""
                yAxisInterval={1}
                chartConfig={{
                  backgroundColor: THEME.surface,
                  backgroundGradientFrom: THEME.surface,
                  backgroundGradientTo: THEME.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
                  labelColor: (opacity = 1) => THEME.textSecondary,
                  style: { borderRadius: 16 },
                  barPercentage: 0.6,
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>

            {/* RECENT ORDERS */}
            <Text style={styles.sectionTitle}>5 Transaksi Terakhir</Text>
            
            {recentOrders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={40} color={THEME.inputBg} />
                <Text style={styles.emptyText}>Belum ada transaksi hari ini.</Text>
              </View>
            ) : (
              recentOrders.map(order => (
                <View key={order.id} style={styles.recentCard}>
                  <View style={styles.recentLeft}>
                    <View style={styles.recentIconBox}>
                      <Ionicons name="checkmark-done" size={16} color={THEME.success} />
                    </View>
                    <View>
                      <Text style={styles.recentOrderId}>{order.orderId}</Text>
                      <Text style={styles.recentMeta}>{order.waktu} • {order.metodePembayaran}</Text>
                    </View>
                  </View>
                  <Text style={styles.recentTotal}>Rp {order.total.toLocaleString("id-ID")}</Text>
                </View>
              ))
            )}
            
            <View style={{height: 40}} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 20,
  },
  headerTitle: {
    color: THEME.textMain,
    fontSize: 28,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: THEME.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  // Metrics
  mainCard: {
    backgroundColor: THEME.primary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  mainCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mainCardLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  mainCardValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
  },
  iconCircle: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  dateBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 16,
  },
  dateBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  rowCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  subCard: {
    width: "48%",
    backgroundColor: THEME.surface,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  subCardValue: {
    color: THEME.textMain,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 2,
  },
  subCardLabel: {
    color: THEME.textSecondary,
    fontSize: 13,
  },
  // Chart
  chartCard: {
    backgroundColor: THEME.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  // Recent List
  sectionTitle: {
    color: THEME.textMain,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  recentCard: {
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recentLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  recentIconBox: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    padding: 8,
    borderRadius: 10,
    marginRight: 12,
  },
  recentOrderId: {
    color: THEME.textMain,
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 2,
  },
  recentMeta: {
    color: THEME.textSecondary,
    fontSize: 12,
  },
  recentTotal: {
    color: THEME.success,
    fontWeight: "800",
    fontSize: 15,
  },
  emptyContainer: {
    backgroundColor: THEME.surface,
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: THEME.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  // Skeletons
  skeletonTextLarge: {
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    marginTop: 8,
    width: "70%",
  },
  skeletonTextMedium: {
    height: 24,
    backgroundColor: THEME.inputBg,
    borderRadius: 6,
    marginTop: 8,
    width: "50%",
  },
  skeletonTextSmall: {
    height: 14,
    backgroundColor: THEME.inputBg,
    borderRadius: 4,
    width: "30%",
  }
});
