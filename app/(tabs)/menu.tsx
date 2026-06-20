import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  Modal,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Switch,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
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

export default function MenuScreen() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState("Makanan");
  const [harga, setHarga] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tersedia, setTersedia] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time listener
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tbmenu"), (snapshot) => {
      const fetched: Menu[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetched.push({
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
      // Sort alphabet or keep as is
      fetched.sort((a, b) => a.nama.localeCompare(b.nama));
      setMenus(fetched);
      setLoading(false);
    }, (err) => {
      console.log("Error fetching menus:", err);
      Alert.alert("Error", "Gagal memuat daftar menu.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Form Actions
  const pickImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Izin Ditolak", "Anda perlu memberikan izin untuk mengakses galeri.");
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3, // Sangat penting agar ukuran Base64 kecil (dibawah 1MB untuk Firestore)
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      // Simpan format Base64 yang siap ditampilkan di elemen <Image />
      setImageUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const resetForm = () => {
    setKode("");
    setNama("");
    setKategori("Makanan");
    setHarga("");
    setKeterangan("");
    setImageUrl("");
    setTersedia(true);
    setEditId(null);
    setIsEditing(false);
  };

  const openAddForm = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditForm = (menu: Menu) => {
    setKode(menu.kode);
    setNama(menu.nama);
    setKategori(menu.kategori);
    setHarga(menu.harga.toString());
    setKeterangan(menu.keterangan);
    setImageUrl(menu.imageUrl);
    setTersedia(menu.tersedia);
    
    setEditId(menu.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const confirmDelete = (id: string, nama: string) => {
    Alert.alert(
      "Hapus Menu?",
      `Anda yakin ingin menghapus "${nama}"? Data tidak dapat dikembalikan.`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "tbmenu", id));
            } catch (error) {
              Alert.alert("Gagal", "Tidak dapat menghapus menu.");
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    // Validation
    if (!kode.trim() || !nama.trim() || !harga.trim() || !keterangan.trim()) {
      Alert.alert("Validasi", "Pastikan semua field teks terisi.");
      return;
    }

    const hargaNum = parseInt(harga.replace(/[^0-9]/g, ""), 10);
    if (isNaN(hargaNum) || hargaNum <= 0) {
      Alert.alert("Validasi", "Harga harus lebih dari 0 dan berupa angka.");
      return;
    }

    try {
      setIsSubmitting(true);
      const dataToSave = {
        kode: kode.trim(),
        nama: nama.trim(),
        kategori,
        harga: hargaNum,
        keterangan: keterangan.trim(),
        imageUrl: imageUrl.trim(),
        tersedia,
      };

      if (isEditing && editId) {
        await updateDoc(doc(db, "tbmenu", editId), dataToSave);
      } else {
        await addDoc(collection(db, "tbmenu"), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.log("Error save menu:", error);
      Alert.alert("Error", "Gagal menyimpan menu ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTersediaQuick = async (id: string, currentVal: boolean) => {
    try {
      await updateDoc(doc(db, "tbmenu", id), {
        tersedia: !currentVal
      });
    } catch (error) {
      Alert.alert("Gagal", "Gagal mengubah status ketersediaan.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manajemen Menu</Text>
        <Text style={styles.headerSubtitle}>Kelola katalog dan ketersediaan</Text>
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={THEME.primary} />
        ) : menus.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={60} color={THEME.inputBg} />
            <Text style={styles.emptyText}>Belum ada menu terdaftar.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openAddForm}>
              <Text style={styles.emptyBtnText}>Tambah Menu Pertama</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={menus}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.card}
                  activeOpacity={0.8}
                  onLongPress={() => {
                    Alert.alert(
                      "Opsi Menu",
                      `Pilih tindakan untuk ${item.nama}`,
                      [
                        { text: "Batal", style: "cancel" },
                        { text: "Edit", onPress: () => openEditForm(item) },
                        { text: "Hapus", style: "destructive", onPress: () => confirmDelete(item.id, item.nama) }
                      ]
                    );
                  }}
                >
                  <View style={styles.imageContainer}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.image} />
                    ) : (
                      <Ionicons name="fast-food" size={40} color={THEME.inputBg} />
                    )}
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{item.kategori}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardInfo}>
                    <Text style={styles.menuName} numberOfLines={2}>{item.nama}</Text>
                    <Text style={styles.menuPrice}>Rp {item.harga.toLocaleString("id-ID")}</Text>
                    
                    <View style={styles.toggleRow}>
                      <Text style={[styles.toggleText, !item.tersedia && { color: THEME.danger }]}>
                        {item.tersedia ? "Tersedia" : "Habis"}
                      </Text>
                      <Switch
                        value={item.tersedia}
                        onValueChange={() => toggleTersediaQuick(item.id, item.tersedia)}
                        trackColor={{ false: THEME.inputBg, true: THEME.primary + "80" }}
                        thumbColor={item.tersedia ? THEME.primary : THEME.textSecondary}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={openAddForm}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{isEditing ? "Edit Menu" : "Tambah Menu Baru"}</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={THEME.textMain} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              
              {/* Pick Image Button */}
              <Text style={styles.label}>Gambar Menu (Dari Galeri)</Text>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} color={THEME.textMain} />
                <Text style={styles.imagePickerText}>
                  {imageUrl ? "Ubah Gambar" : "Pilih Gambar"}
                </Text>
              </TouchableOpacity>

              {/* Preview Image */}
              {imageUrl ? (
                <View style={styles.previewArea}>
                  <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                </View>
              ) : null}

              <View style={styles.row}>
                <View style={{flex: 1, marginRight: 8}}>
                  <Text style={styles.label}>Kode</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="M01"
                    placeholderTextColor={THEME.textSecondary}
                    value={kode}
                    onChangeText={setKode}
                  />
                </View>
                <View style={{flex: 1, marginLeft: 8}}>
                  <Text style={styles.label}>Kategori</Text>
                  <View style={styles.kategoriRow}>
                    <TouchableOpacity 
                      style={[styles.katBtn, kategori === "Makanan" && styles.katBtnActive]}
                      onPress={() => setKategori("Makanan")}
                    >
                      <Text style={[styles.katBtnText, kategori === "Makanan" && styles.katBtnTextActive]}>Mkn</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.katBtn, kategori === "Minuman" && styles.katBtnActive]}
                      onPress={() => setKategori("Minuman")}
                    >
                      <Text style={[styles.katBtnText, kategori === "Minuman" && styles.katBtnTextActive]}>Min</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={styles.label}>Nama Menu</Text>
              <TextInput
                style={styles.input}
                placeholder="Nasi Goreng Spesial"
                placeholderTextColor={THEME.textSecondary}
                value={nama}
                onChangeText={setNama}
              />

              <Text style={styles.label}>Harga (Rp)</Text>
              <TextInput
                style={styles.input}
                placeholder="25000"
                placeholderTextColor={THEME.textSecondary}
                keyboardType="numeric"
                value={harga}
                onChangeText={setHarga}
              />

              <Text style={styles.label}>Keterangan</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Deskripsi singkat..."
                placeholderTextColor={THEME.textSecondary}
                multiline
                numberOfLines={3}
                value={keterangan}
                onChangeText={setKeterangan}
                textAlignVertical="top"
              />

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.labelSwitch}>Status Ketersediaan</Text>
                  <Text style={styles.descSwitch}>Apakah menu ini bisa dipesan?</Text>
                </View>
                <Switch
                  value={tersedia}
                  onValueChange={setTersedia}
                  trackColor={{ false: THEME.inputBg, true: THEME.primary + "80" }}
                  thumbColor={tersedia ? THEME.primary : THEME.textSecondary}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                <Text style={styles.saveBtnText}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Menu"}
                </Text>
              </TouchableOpacity>
              
              <View style={{height: 40}} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  gridRow: {
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: THEME.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  imageContainer: {
    height: 120,
    backgroundColor: THEME.inputBg,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  categoryBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  cardInfo: {
    padding: 12,
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
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: THEME.inputBg,
    paddingTop: 8,
  },
  toggleText: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: THEME.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  // Skeleton
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
  // Bottom Sheet Form
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
  formScroll: {
    maxHeight: 600,
  },
  previewArea: {
    height: 160,
    backgroundColor: THEME.background,
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewPlaceholder: {
    alignItems: "center",
  },
  previewText: {
    color: THEME.textSecondary,
    marginTop: 8,
    fontSize: 12,
  },
  label: {
    color: THEME.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: THEME.inputBg,
    color: THEME.textMain,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 14,
  },
  textArea: {
    height: 80,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  kategoriRow: {
    flexDirection: "row",
    backgroundColor: THEME.inputBg,
    borderRadius: 12,
    padding: 4,
  },
  katBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  katBtnActive: {
    backgroundColor: THEME.surface,
  },
  katBtnText: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "bold",
  },
  katBtnTextActive: {
    color: THEME.textMain,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: THEME.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  labelSwitch: {
    color: THEME.textMain,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  descSwitch: {
    color: THEME.textSecondary,
    fontSize: 12,
  },
  saveBtn: {
    backgroundColor: THEME.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  imagePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.inputBg,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.surface,
    marginBottom: 16,
    justifyContent: "center",
    gap: 8,
  },
  imagePickerText: {
    color: THEME.textMain,
    fontWeight: "600",
  },
});
