import React, { useEffect, useState, useMemo } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Modal,
  ScrollView,
  SafeAreaView,
  Animated,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

import { db } from "../../config/firebase";

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
type Menu = {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  harga: number;
  keterangan: string;
  imageUrl: string;
  tersedia: boolean;
};

type CartItem = {
  menuId: string;
  nama: string;
  harga: number;
  qty: number;
  subtotal: number;
};

type PaymentMethod = "Cash" | "QRIS" | "Transfer Bank";

export default function PemesananScreen() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [kategoriFilter, setKategoriFilter] = useState<string>("Semua");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [metodePembayaran, setMetodePembayaran] = useState("Tunai");
  const [tipePesanan, setTipePesanan] = useState("Makan di Tempat");
  const [nomorMeja, setNomorMeja] = useState("");
  const [diskonStr, setDiskonStr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);

  // Fetch menus real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tbmenu"), (snapshot) => {
      const fetchedMenus: Menu[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMenus.push({
          id: doc.id,
          nama: data.nama || data.nama_menu || "",
          kode: data.kode || data.kode_menu || "",
          harga: Number(data.harga || 0),
          kategori: data.kategori || "Makanan",
          keterangan: data.keterangan || "",
          imageUrl: data.imageUrl || "",
          tersedia: data.tersedia !== undefined ? data.tersedia : (data.keterangan === "Tersedia"),
        });
      });
      setMenus(fetchedMenus);
      setLoading(false);
    }, (err) => {
      console.log("Error fetching menus:", err);
      Alert.alert("Error", "Gagal memuat menu dari server.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtered menus
  const filteredMenus = useMemo(() => {
    if (kategoriFilter === "Semua") return menus;
    return menus.filter(m => m.kategori === kategoriFilter);
  }, [menus, kategoriFilter]);

  // Cart Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
  const diskon = parseInt(diskonStr) || 0;
  const subtotalAfterDiskon = Math.max(0, subtotal - diskon);
  const pajak = subtotalAfterDiskon * 0.1;
  const total = subtotalAfterDiskon + pajak;
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleProcessCheckout = async () => {
    if (tipePesanan === "Makan di Tempat" && !nomorMeja.trim()) {
      Alert.alert("Gagal", "Silakan isi Nomor Meja untuk Makan di Tempat.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = "ORD-" + Date.now().toString().slice(-6);
      await addDoc(collection(db, "tbpemesanan"), {
        orderId,
        items: cart,
        subtotal,
        diskon,
        pajak,
        total,
        metodePembayaran,
        tipePesanan,
        nomorMeja: tipePesanan === "Makan di Tempat" ? nomorMeja : "-",
        status: "dimasak", // FastFood style: pay first, then cook
        createdAt: serverTimestamp(),
      });
      setCart([]);
      setCheckoutModalVisible(false);
      setIsCartOpen(false);
      setTipePesanan("Makan di Tempat");
      setNomorMeja("");
      setDiskonStr("");
      Alert.alert("Sukses", `Pesanan ${orderId} berhasil dibayar & masuk ke Dapur!`);
    } catch (error: any) {
      console.log("Error checkout:", error);
      Alert.alert("Gagal", "Terjadi kesalahan saat memproses pembayaran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cart Actions
  const addToCart = (menu: Menu) => {
    if (!menu.tersedia) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.menuId === menu.id);
      if (existing) {
        return prev.map(item => 
          item.menuId === menu.id 
            ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.harga }
            : item
        );
      }
      return [...prev, {
        menuId: menu.id,
        nama: menu.nama,
        harga: menu.harga,
        qty: 1,
        subtotal: menu.harga
      }];
    });
  };

  const updateQty = (menuId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.menuId === menuId) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return null as any; // marked for deletion
          return { ...item, qty: newQty, subtotal: newQty * item.harga };
        }
        return item;
      }).filter(Boolean); // remove nulls
    });
  };

  const removeItem = (menuId: string) => {
    setCart(prev => prev.filter(item => item.menuId !== menuId));
  };

  // --- RENDERERS ---

  const renderSkeleton = () => (
    <FlatList
      data={[1, 2, 3, 4, 5, 6]}
      numColumns={2}
      keyExtractor={item => item.toString()}
      columnWrapperStyle={styles.menuGridRow}
      renderItem={() => (
        <View style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={{ padding: 12 }}>
            <View style={styles.skeletonTextLarge} />
            <View style={styles.skeletonTextSmall} />
            <View style={styles.skeletonButton} />
          </View>
        </View>
      )}
    />
  );

  const renderMenuCard = ({ item }: { item: Menu }) => {
    const isHabis = !item.tersedia;
    return (
      <TouchableOpacity 
        style={[styles.menuCard, isHabis && styles.menuCardHabis]}
        activeOpacity={0.7}
        onPress={() => addToCart(item)}
        disabled={isHabis}
      >
        <View style={styles.menuImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.menuImage} contentFit="cover" />
          ) : (
            <Ionicons name="fast-food" size={40} color={THEME.inputBg} />
          )}
          {isHabis && (
            <View style={styles.habisOverlay}>
              <Text style={styles.habisText}>HABIS</Text>
            </View>
          )}
        </View>
        <View style={styles.menuInfo}>
          <Text style={styles.menuName} numberOfLines={2}>{item.nama}</Text>
          <Text style={styles.menuPrice}>Rp {item.harga.toLocaleString("id-ID")}</Text>
          <View style={[styles.addButton, isHabis && { backgroundColor: THEME.inputBg }]}>
            <Ionicons name="add" size={20} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Kasir & Pesanan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {["Semua", "Makanan", "Minuman"].map(kat => (
              <TouchableOpacity 
                key={kat}
                style={[styles.filterPill, kategoriFilter === kat && styles.filterPillActive]}
                onPress={() => setKategoriFilter(kat)}
              >
                <Text style={[styles.filterText, kategoriFilter === kat && styles.filterTextActive]}>
                  {kat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.menuListContainer}>
          {loading ? (
            renderSkeleton()
          ) : filteredMenus.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={60} color={THEME.inputBg} />
              <Text style={styles.emptyText}>Tidak ada menu yang ditemukan.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredMenus}
              keyExtractor={item => item.id}
              numColumns={2}
              columnWrapperStyle={styles.menuGridRow}
              renderItem={renderMenuCard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          )}
        </View>

        {cart.length > 0 && !isCartOpen && (
          <TouchableOpacity 
            style={styles.floatingCart} 
            activeOpacity={0.9}
            onPress={() => setIsCartOpen(true)}
          >
            <View style={styles.floatingCartLeft}>
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalQty}</Text>
              </View>
              <Text style={styles.floatingCartText}>Lihat Keranjang</Text>
            </View>
            <Text style={styles.floatingCartPrice}>Rp {total.toLocaleString("id-ID")}</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      <Modal
        visible={isCartOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCartOpen(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Keranjang ({totalQty})</Text>
              <TouchableOpacity onPress={() => setIsCartOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={THEME.textMain} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
              {cart.map(item => (
                <View key={item.menuId} style={styles.cartItemRow}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.nama}</Text>
                    <Text style={styles.cartItemPrice}>Rp {item.harga.toLocaleString("id-ID")}</Text>
                  </View>
                  
                  <View style={styles.qtyController}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.menuId, -1)}>
                      <Ionicons name="remove" size={16} color={THEME.textMain} />
                    </TouchableOpacity>
                    <Text style={styles.qtyNumber}>{item.qty}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.menuId, 1)}>
                      <Ionicons name="add" size={16} color={THEME.textMain} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.menuId)}>
                    <Ionicons name="trash-outline" size={18} color={THEME.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {cart.length > 0 && (
              <ScrollView style={styles.checkoutScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Detail Pembayaran</Text>

                <Text style={styles.sectionLabel}>Tipe Pesanan</Text>
                <View style={styles.methodRow}>
                  {["Makan di Tempat", "Bungkus"].map(tipe => (
                    <TouchableOpacity
                      key={tipe}
                      style={[styles.methodCard, tipePesanan === tipe && styles.methodCardActive]}
                      onPress={() => setTipePesanan(tipe)}
                    >
                      <Ionicons 
                        name={tipe === "Bungkus" ? "bag-handle-outline" : "restaurant-outline"} 
                        size={24} 
                        color={tipePesanan === tipe ? THEME.primary : THEME.textSecondary} 
                      />
                      <Text style={[styles.methodText, tipePesanan === tipe && styles.methodTextActive]}>{tipe}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {tipePesanan === "Makan di Tempat" && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={styles.sectionLabel}>Nomor Meja</Text>
                    <TextInput
                      style={styles.inputBox}
                      placeholder="Contoh: 12"
                      placeholderTextColor={THEME.textSecondary}
                      value={nomorMeja}
                      onChangeText={setNomorMeja}
                      keyboardType="number-pad"
                    />
                  </View>
                )}

                <Text style={styles.sectionLabel}>Metode Pembayaran</Text>
                <View style={styles.methodRow}>
                  {["Tunai", "QRIS", "Kartu"].map(method => (
                    <TouchableOpacity
                      key={method}
                      style={[styles.methodCard, metodePembayaran === method && styles.methodCardActive]}
                      onPress={() => setMetodePembayaran(method)}
                    >
                      <Ionicons 
                        name={method === "Tunai" ? "cash-outline" : method === "QRIS" ? "qr-code-outline" : "card-outline"} 
                        size={24} 
                        color={metodePembayaran === method ? THEME.primary : THEME.textSecondary} 
                      />
                      <Text style={[styles.methodText, metodePembayaran === method && styles.methodTextActive]}>{method}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>Diskon (Rp)</Text>
                <TextInput
                  style={styles.inputBox}
                  placeholder="0"
                  placeholderTextColor={THEME.textSecondary}
                  value={diskonStr}
                  onChangeText={setDiskonStr}
                  keyboardType="number-pad"
                />

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>Rp {subtotal.toLocaleString("id-ID")}</Text>
                </View>
                {diskon > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Diskon</Text>
                    <Text style={[styles.summaryValue, {color: THEME.danger}]}>- Rp {diskon.toLocaleString("id-ID")}</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>PPN (10%)</Text>
                  <Text style={styles.summaryValue}>Rp {pajak.toLocaleString("id-ID")}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Bayar</Text>
                  <Text style={styles.totalValue}>Rp {total.toLocaleString("id-ID")}</Text>
                </View>

                <TouchableOpacity 
                  style={[styles.processBtn, isSubmitting && { opacity: 0.7 }]} 
                  onPress={handleProcessCheckout}
                  disabled={isSubmitting}
                >
                  <Text style={styles.processBtnText}>{isSubmitting ? "Memproses..." : "Konfirmasi Pembayaran"}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
    paddingBottom: 10,
  },
  headerTitle: {
    color: THEME.textMain,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 16,
  },
  filterScroll: {
    flexDirection: "row",
  },
  filterPill: {
    backgroundColor: THEME.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
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
  menuListContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  menuGridRow: {
    justifyContent: "space-between",
  },
  menuCard: {
    width: "48%",
    backgroundColor: THEME.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  menuCardHabis: {
    opacity: 0.5,
  },
  menuImageContainer: {
    height: 120,
    backgroundColor: THEME.inputBg,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  menuImage: {
    width: "100%",
    height: "100%",
  },
  habisOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  habisText: {
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 2,
    transform: [{ rotate: "-15deg" }],
  },
  menuInfo: {
    padding: 12,
    position: "relative",
  },
  menuName: {
    color: THEME.textMain,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    height: 40, 
  },
  menuPrice: {
    color: THEME.primary,
    fontSize: 14,
    fontWeight: "bold",
  },
  addButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: THEME.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonCard: {
    width: "48%",
    backgroundColor: THEME.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  skeletonImage: {
    height: 120,
    backgroundColor: THEME.inputBg,
  },
  skeletonTextLarge: {
    height: 14,
    backgroundColor: THEME.inputBg,
    borderRadius: 4,
    marginBottom: 8,
    width: "80%",
  },
  skeletonTextSmall: {
    height: 14,
    backgroundColor: THEME.inputBg,
    borderRadius: 4,
    width: "50%",
  },
  skeletonButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.inputBg,
  },
  floatingCart: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: THEME.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingCartLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartBadge: {
    backgroundColor: "#fff",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cartBadgeText: {
    color: THEME.primary,
    fontWeight: "bold",
    fontSize: 14,
  },
  floatingCartText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  floatingCartPrice: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  bottomSheet: {
    backgroundColor: THEME.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    color: THEME.textMain,
    fontSize: 20,
    fontWeight: "800",
  },
  closeBtn: {
    backgroundColor: THEME.inputBg,
    padding: 6,
    borderRadius: 16,
  },
  cartList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  cartItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    color: THEME.textMain,
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 4,
  },
  cartItemPrice: {
    color: THEME.primary,
    fontWeight: "600",
    fontSize: 13,
  },
  qtyController: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.inputBg,
    borderRadius: 8,
    padding: 4,
    marginRight: 12,
  },
  qtyBtn: {
    padding: 4,
  },
  qtyNumber: {
    color: THEME.textMain,
    fontWeight: "bold",
    marginHorizontal: 12,
    fontSize: 14,
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
  },
  checkoutScroll: {
    flexGrow: 0,
  },
  modalTitle: {
    color: THEME.textMain,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
  },
  sectionLabel: {
    color: THEME.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 8,
  },
  methodRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  methodCard: {
    flex: 1,
    backgroundColor: THEME.background,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  methodCardActive: {
    borderColor: THEME.primary,
    backgroundColor: THEME.primary + "10",
  },
  methodText: {
    color: THEME.textSecondary,
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
  methodTextActive: {
    color: THEME.primary,
  },
  inputBox: {
    backgroundColor: THEME.inputBg,
    borderRadius: 12,
    padding: 16,
    color: THEME.textMain,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.surface,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.inputBg,
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    color: THEME.textSecondary,
    fontSize: 14,
  },
  summaryValue: {
    color: THEME.textMain,
    fontSize: 14,
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 24,
  },
  totalLabel: {
    color: THEME.textMain,
    fontSize: 18,
    fontWeight: "800",
  },
  totalValue: {
    color: THEME.primary,
    fontSize: 24,
    fontWeight: "900",
  },
  processBtn: {
    backgroundColor: THEME.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 40,
  },
  processBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Receipt Modal
  receiptOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  receiptCard: {
    width: "100%",
    backgroundColor: THEME.surface,
    borderRadius: 24,
    padding: 24,
  },
  receiptHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  receiptTitle: {
    color: THEME.textMain,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 12,
  },
  receiptBody: {
    backgroundColor: THEME.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  receiptOrderId: {
    color: THEME.textMain,
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  receiptDate: {
    color: THEME.textSecondary,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: THEME.inputBg,
    marginVertical: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: THEME.inputBg,
  },
  receiptItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  receiptItemName: {
    color: THEME.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  receiptItemPrice: {
    color: THEME.textMain,
    fontSize: 14,
    fontWeight: "600",
  },
  receiptSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  receiptSummaryLabel: {
    color: THEME.textSecondary,
    fontSize: 13,
  },
  receiptSummaryValue: {
    color: THEME.textMain,
    fontSize: 13,
  },
  receiptGrandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  receiptGrandTotalLabel: {
    color: THEME.textMain,
    fontWeight: "900",
    fontSize: 16,
  },
  receiptGrandTotalValue: {
    color: THEME.primary,
    fontWeight: "900",
    fontSize: 16,
  },
  receiptMethodBadge: {
    alignSelf: "center",
    backgroundColor: THEME.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: THEME.inputBg,
  },
  receiptMethodText: {
    color: THEME.primary,
    fontWeight: "bold",
    fontSize: 12,
  },
  receiptCloseBtn: {
    backgroundColor: THEME.inputBg,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  receiptCloseText: {
    color: THEME.textMain,
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: THEME.textSecondary,
    marginTop: 16,
    fontSize: 16,
  }
});
