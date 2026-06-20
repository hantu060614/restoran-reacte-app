import React, { useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

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
type OrderItem = {
  menuId: string;
  nama: string;
  harga: number;
  qty: number;
  subtotal: number;
};

type Order = {
  id: string;
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  diskon: number;
  pajak: number;
  total: number;
  metodePembayaran: string;
  tipePesanan: string;
  nomorMeja: string;
  status: string;
  createdAtRaw: Date | null;
  waktuFormat: string;
};

type TimeFilter = "Hari Ini" | "Minggu Ini" | "Bulan Ini";

export default function LaporanScreen() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<TimeFilter>("Hari Ini");
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptVisible, setReceiptVisible] = useState(false);

  const fetchOrders = () => {
    const q = query(collection(db, "tbpemesanan"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const fetched: Order[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        const dateObj = d.createdAt ? d.createdAt.toDate() : new Date();
        
        fetched.push({
          id: doc.id,
          orderId: d.orderId || "-",
          items: d.items || [],
          subtotal: Number(d.subtotal || 0),
          diskon: Number(d.diskon || 0),
          pajak: Number(d.pajak || 0),
          total: Number(d.total || 0),
          metodePembayaran: d.metodePembayaran || "Unknown",
          tipePesanan: d.tipePesanan || "-",
          nomorMeja: d.nomorMeja || "-",
          status: d.status || "selesai",
          createdAtRaw: dateObj,
          waktuFormat: dateObj.toLocaleString("id-ID", { 
            day: 'numeric', month: 'short', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
          }),
        });
      });
      setAllOrders(fetched);
      setLoading(false);
    }, (err) => {
      console.log("Error fetching reports:", err);
      setLoading(false);
    });
  };

  useEffect(() => {
    const unsub = fetchOrders();
    return () => unsub();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Since we use onSnapshot, it's already realtime, 
    // but we simulate network delay for the UX requirement
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Filter Logic
  const filteredOrders = useMemo(() => {
    const now = new Date();
    
    return allOrders.filter(order => {
      if (!order.createdAtRaw) return true;
      const orderDate = order.createdAtRaw;
      
      if (filter === "Hari Ini") {
        return orderDate.getDate() === now.getDate() &&
               orderDate.getMonth() === now.getMonth() &&
               orderDate.getFullYear() === now.getFullYear();
      } 
      else if (filter === "Minggu Ini") {
        // Simple logic: last 7 days
        const diffTime = Math.abs(now.getTime() - orderDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      } 
      else if (filter === "Bulan Ini") {
        return orderDate.getMonth() === now.getMonth() &&
               orderDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [allOrders, filter]);

  const totalPendapatan = filteredOrders.reduce((sum, order) => sum + order.total, 0);

  const openReceipt = (order: Order) => {
    setSelectedOrder(order);
    setReceiptVisible(true);
  };

  const printReceipt = async () => {
    if (!selectedOrder) return;
    
    let itemsHTML = '';
    selectedOrder.items.forEach(it => {
      itemsHTML += `
        <div class="row" style="margin-bottom: 5px;">
          <div style="flex: 1;">
            <div>${it.nama}</div>
            <div style="font-size: 12px; color: #555;">${it.qty} x Rp ${it.harga.toLocaleString("id-ID")}</div>
          </div>
          <div>Rp ${it.subtotal.toLocaleString("id-ID")}</div>
        </div>
      `;
    });

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            @page { margin: 20px; }
            body { font-family: 'Courier New', Courier, monospace; font-size: 14px; color: #000; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .dashed-line { border-bottom: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; }
            .header { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            .sub-header { font-size: 12px; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="center header">RESTORAN BERKAH</div>
          <div class="center sub-header">Jl. Contoh No. 123, Kota<br/>Telp: 0812-3456-7890</div>
          <div class="dashed-line"></div>
          <div class="row">
            <span>Order ID:</span>
            <span>${selectedOrder.orderId}</span>
          </div>
          <div class="row">
            <span>Waktu:</span>
            <span>${selectedOrder.waktuFormat}</span>
          </div>
          <div class="row">
            <span>Metode:</span>
            <span>${selectedOrder.metodePembayaran}</span>
          </div>
          <div class="dashed-line"></div>
          ${itemsHTML}
          <div class="dashed-line"></div>
          <div class="row">
            <span>Subtotal</span>
            <span>Rp ${selectedOrder.subtotal.toLocaleString("id-ID")}</span>
          </div>
          ${selectedOrder.diskon > 0 ? `
          <div class="row" style="color: red;">
            <span>Diskon</span>
            <span>- Rp ${selectedOrder.diskon.toLocaleString("id-ID")}</span>
          </div>
          ` : ''}
          <div class="row">
            <span>PPN (10%)</span>
            <span>Rp ${selectedOrder.pajak.toLocaleString("id-ID")}</span>
          </div>
          <div class="row bold" style="font-size: 16px; margin-top: 10px;">
            <span>TOTAL</span>
            <span>Rp ${selectedOrder.total.toLocaleString("id-ID")}</span>
          </div>
          <div class="dashed-line"></div>
          <div class="center" style="margin-top: 20px;">
            Terima kasih atas kunjungan Anda!<br/>
            Silakan datang kembali
          </div>
        </body>
      </html>
    `;

    try {
      await Print.printAsync({ html });
    } catch (error) {
      console.log("Error printing:", error);
    }
  };

  // --- RENDERERS ---

  const renderSkeleton = () => (
    <View style={{paddingHorizontal: 20}}>
      {[1,2,3,4,5].map(i => (
        <View key={i} style={styles.skeletonCard}>
          <View style={{flex: 1}}>
            <View style={styles.skeletonTextLarge} />
            <View style={styles.skeletonTextSmall} />
          </View>
          <View style={styles.skeletonTextMedium} />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Laporan Penjualan</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(["Hari Ini", "Minggu Ini", "Bulan Ini"] as TimeFilter[]).map(f => (
            <TouchableOpacity 
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Pendapatan ({filter})</Text>
        <Text style={styles.summaryValue}>Rp {totalPendapatan.toLocaleString("id-ID")}</Text>
        <View style={styles.summaryFoot}>
          <Text style={styles.summaryFootText}>{filteredOrders.length} Transaksi Selesai</Text>
        </View>
      </View>

      {/* List */}
      <View style={styles.listContainer}>
        {loading ? (
          renderSkeleton()
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color={THEME.inputBg} />
            <Text style={styles.emptyText}>Tidak ada transaksi untuk periode ini.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />
            }
            renderItem={({ item }) => {
              if (item.status === "dimasak") return null; // Sembunyikan pesanan yang masih dimasak di laporan
              return (
                <TouchableOpacity 
                  style={styles.orderCard}
                  activeOpacity={0.7}
                  onPress={() => openReceipt(item)}
                >
                  <View style={styles.orderCardLeft}>
                    <View style={styles.iconBox}>
                      <Ionicons name="document-text" size={20} color={THEME.primary} />
                    </View>
                    <View>
                      <Text style={styles.orderId}>{item.orderId}</Text>
                      <Text style={styles.orderMeta}>{item.waktuFormat}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.orderTotal}>Rp {item.total.toLocaleString("id-ID")}</Text>
                    <View style={styles.methodBadge}>
                      <Text style={styles.methodText}>{item.metodePembayaran}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        )}
      </View>

      {/* Receipt Modal */}
      <Modal
        visible={receiptVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReceiptVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptSheet}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptTitle}>Detail Transaksi</Text>
              <TouchableOpacity onPress={() => setReceiptVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={THEME.textMain} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.receiptTop}>
                  <View style={styles.qrPlaceholder}>
                    <Ionicons name="qr-code-outline" size={40} color={THEME.textSecondary} />
                  </View>
                  <Text style={styles.rOrderId}>{selectedOrder.orderId}</Text>
                  <Text style={styles.rDate}>{selectedOrder.waktuFormat}</Text>
                  <Text style={{color: THEME.textSecondary, marginTop: 4}}>{selectedOrder.tipePesanan} {selectedOrder.nomorMeja !== "-" ? `(Meja ${selectedOrder.nomorMeja})` : ""}</Text>
                  <View style={styles.rMethodBadge}>
                    <Text style={styles.rMethodText}>{selectedOrder.metodePembayaran}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.rItemList}>
                  {selectedOrder.items.map((it, idx) => (
                    <View key={idx} style={styles.rItemRow}>
                      <View style={{flex: 1}}>
                        <Text style={styles.rItemName}>{it.nama}</Text>
                        <Text style={styles.rItemQty}>{it.qty} x Rp {it.harga.toLocaleString("id-ID")}</Text>
                      </View>
                      <Text style={styles.rItemSub}>Rp {it.subtotal.toLocaleString("id-ID")}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.divider} />

                <View style={styles.rSummaryBox}>
                  <View style={styles.rSummaryRow}>
                    <Text style={styles.rSummaryLabel}>Subtotal</Text>
                    <Text style={styles.rSummaryValue}>Rp {selectedOrder.subtotal.toLocaleString("id-ID")}</Text>
                  </View>
                  {selectedOrder.diskon > 0 && (
                    <View style={styles.rSummaryRow}>
                      <Text style={styles.rSummaryLabel}>Diskon</Text>
                      <Text style={[styles.rSummaryValue, {color: THEME.danger}]}>- Rp {selectedOrder.diskon.toLocaleString("id-ID")}</Text>
                    </View>
                  )}
                  <View style={styles.rSummaryRow}>
                    <Text style={styles.rSummaryLabel}>PPN (10%)</Text>
                    <Text style={styles.rSummaryValue}>Rp {selectedOrder.pajak.toLocaleString("id-ID")}</Text>
                  </View>
                  <View style={styles.rGrandTotalRow}>
                    <Text style={styles.rGrandTotalLabel}>Total Dibayar</Text>
                    <Text style={styles.rGrandTotalValue}>Rp {selectedOrder.total.toLocaleString("id-ID")}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.printBtn} onPress={printReceipt}>
                  <Ionicons name="print-outline" size={24} color="#fff" />
                  <Text style={styles.printBtnText}>Cetak Struk</Text>
                </TouchableOpacity>

                <View style={{height: 40}} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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
    paddingBottom: 16,
  },
  headerTitle: {
    color: THEME.textMain,
    fontSize: 28,
    fontWeight: "800",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterScroll: {
    paddingHorizontal: 24,
    flexDirection: "row",
  },
  filterPill: {
    backgroundColor: THEME.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: THEME.inputBg,
  },
  filterPillActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  filterText: {
    color: THEME.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  filterTextActive: {
    color: "#fff",
  },
  summaryCard: {
    marginHorizontal: 24,
    backgroundColor: THEME.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: THEME.primary,
  },
  summaryLabel: {
    color: THEME.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  summaryValue: {
    color: THEME.textMain,
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 16,
  },
  summaryFoot: {
    backgroundColor: THEME.inputBg,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  summaryFootText: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  listContainer: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderCardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    backgroundColor: THEME.primary + "20",
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  orderId: {
    color: THEME.textMain,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  orderMeta: {
    color: THEME.textSecondary,
    fontSize: 13,
  },
  orderTotal: {
    color: THEME.success,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  methodBadge: {
    backgroundColor: THEME.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  methodText: {
    color: THEME.textSecondary,
    fontSize: 10,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: THEME.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  // Skeletons
  skeletonCard: {
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  skeletonTextLarge: {
    height: 20,
    backgroundColor: THEME.inputBg,
    borderRadius: 4,
    marginBottom: 8,
    width: "60%",
  },
  skeletonTextMedium: {
    height: 24,
    backgroundColor: THEME.inputBg,
    borderRadius: 6,
    width: "30%",
  },
  skeletonTextSmall: {
    height: 14,
    backgroundColor: THEME.inputBg,
    borderRadius: 4,
    width: "40%",
  },
  // Receipt Modal Bottom Sheet
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  receiptSheet: {
    backgroundColor: THEME.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  receiptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  receiptTitle: {
    color: THEME.textMain,
    fontSize: 20,
    fontWeight: "800",
  },
  closeBtn: {
    backgroundColor: THEME.inputBg,
    padding: 6,
    borderRadius: 16,
  },
  receiptTop: {
    alignItems: "center",
    paddingVertical: 10,
  },
  qrPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: THEME.inputBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  rOrderId: {
    color: THEME.textMain,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  rDate: {
    color: THEME.textSecondary,
    fontSize: 14,
  },
  rMethodBadge: {
    backgroundColor: THEME.primary + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: THEME.primary + "50",
  },
  rMethodText: {
    color: THEME.primary,
    fontWeight: "bold",
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.inputBg,
    marginVertical: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: THEME.inputBg,
  },
  rItemList: {
    paddingHorizontal: 4,
  },
  rItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  rItemName: {
    color: THEME.textMain,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  rItemQty: {
    color: THEME.textSecondary,
    fontSize: 13,
  },
  rItemSub: {
    color: THEME.textMain,
    fontSize: 15,
    fontWeight: "600",
  },
  rSummaryBox: {
    backgroundColor: THEME.background,
    padding: 16,
    borderRadius: 16,
  },
  rSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rSummaryLabel: {
    color: THEME.textSecondary,
    fontSize: 14,
  },
  rSummaryValue: {
    color: THEME.textMain,
    fontSize: 14,
    fontWeight: "600",
  },
  rGrandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.inputBg,
  },
  rGrandTotalLabel: {
    color: THEME.textMain,
    fontSize: 16,
    fontWeight: "800",
  },
  rGrandTotalValue: {
    color: THEME.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  printBtn: {
    backgroundColor: THEME.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
    gap: 8,
  },
  printBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
