import { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";

import { db } from "../../config/firebase";

type Menu = {
  id: string;
  kode_menu: string;
  nama_menu: string;
  kategori: string;
  harga: number;
  keterangan: string;
};

export default function MenuScreen() {
  const [menus, setMenus] = useState<Menu[]>([]);

  const [kodeMenu, setKodeMenu] = useState("");
  const [namaMenu, setNamaMenu] = useState("");
  const [kategori, setKategori] = useState("");
  const [harga, setHarga] = useState("");
  const [keterangan, setKeterangan] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMenus();
  }, []);

  async function getMenus() {
    try {
      const q = query(collection(db, "tbmenu"), orderBy("kode_menu", "asc"));
      const snapshot = await getDocs(q);

      const data: Menu[] = snapshot.docs.map((document) => ({
        id: document.id,
        kode_menu: document.data().kode_menu,
        nama_menu: document.data().nama_menu,
        kategori: document.data().kategori,
        harga: document.data().harga,
        keterangan: document.data().keterangan,
      }));

      setMenus(data);
    } catch (error) {
      console.log("Gagal mengambil data menu:", error);
      Alert.alert("Error", "Gagal mengambil data menu dari Firebase.");
    }
  }

  function resetForm() {
    setKodeMenu("");
    setNamaMenu("");
    setKategori("");
    setHarga("");
    setKeterangan("");
    setEditId(null);
  }

  async function simpanMenu() {
    if (
      kodeMenu.trim() === "" ||
      namaMenu.trim() === "" ||
      kategori.trim() === "" ||
      harga.trim() === ""
    ) {
      Alert.alert("Peringatan", "Kode, nama menu, kategori, dan harga wajib diisi.");
      return;
    }

    if (Number(harga) <= 0) {
      Alert.alert("Peringatan", "Harga harus lebih dari 0.");
      return;
    }

    try {
      setLoading(true);

      const dataMenu = {
        kode_menu: kodeMenu,
        nama_menu: namaMenu,
        kategori: kategori,
        harga: Number(harga),
        keterangan: keterangan,
      };

      if (editId === null) {
        await addDoc(collection(db, "tbmenu"), dataMenu);
        Alert.alert("Berhasil", "Data menu berhasil ditambahkan.");
      } else {
        await updateDoc(doc(db, "tbmenu", editId), dataMenu);
        Alert.alert("Berhasil", "Data menu berhasil diperbarui.");
      }

      resetForm();
      getMenus();
    } catch (error) {
      console.log("Gagal menyimpan data menu:", error);
      Alert.alert("Error", "Gagal menyimpan data menu.");
    } finally {
      setLoading(false);
    }
  }

  function pilihEdit(item: Menu) {
    setEditId(item.id);
    setKodeMenu(item.kode_menu);
    setNamaMenu(item.nama_menu);
    setKategori(item.kategori);
    setHarga(String(item.harga));
    setKeterangan(item.keterangan);
  }

  function hapusMenu(id: string) {
    Alert.alert("Konfirmasi", "Yakin ingin menghapus menu ini?", [
      {
        text: "Batal",
        style: "cancel",
      },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "tbmenu", id));
            Alert.alert("Berhasil", "Data menu berhasil dihapus.");

            if (editId === id) {
              resetForm();
            }

            getMenus();
          } catch (error) {
            console.log("Gagal menghapus data menu:", error);
            Alert.alert("Error", "Gagal menghapus data menu.");
          }
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Input Makanan/Minuman</Text>
        <Text style={styles.subHeader}>Collection Firebase: tbmenu</Text>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {editId === null ? "Tambah Menu" : "Edit Menu"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Kode Menu, contoh: M001"
            placeholderTextColor="#9ca3af"
            value={kodeMenu}
            onChangeText={setKodeMenu}
          />

          <TextInput
            style={styles.input}
            placeholder="Nama Menu"
            placeholderTextColor="#9ca3af"
            value={namaMenu}
            onChangeText={setNamaMenu}
          />

          <TextInput
            style={styles.input}
            placeholder="Kategori, contoh: Makanan / Minuman"
            placeholderTextColor="#9ca3af"
            value={kategori}
            onChangeText={setKategori}
          />

          <TextInput
            style={styles.input}
            placeholder="Harga"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            value={harga}
            onChangeText={setHarga}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Keterangan"
            placeholderTextColor="#9ca3af"
            value={keterangan}
            onChangeText={setKeterangan}
            multiline
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={simpanMenu}
            disabled={loading}
          >
            <Text style={styles.saveText}>
              {loading
                ? "Menyimpan..."
                : editId === null
                ? "Simpan Menu"
                : "Update Menu"}
            </Text>
          </TouchableOpacity>

          {editId !== null && (
            <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.cancelText}>Batal Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.listTitle}>Data Menu</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colNo]}>No</Text>
              <Text style={[styles.th, styles.colKode]}>Kode</Text>
              <Text style={[styles.th, styles.colNama]}>Nama Menu</Text>
              <Text style={[styles.th, styles.colKategori]}>Kategori</Text>
              <Text style={[styles.th, styles.colHarga]}>Harga</Text>
              <Text style={[styles.th, styles.colKet]}>Keterangan</Text>
              <Text style={[styles.th, styles.colAksi]}>Aksi</Text>
            </View>

            {menus.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>Belum ada data menu.</Text>
              </View>
            ) : (
              menus.map((item, index) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.td, styles.colNo]}>{index + 1}</Text>

                  <Text style={[styles.td, styles.colKode]}>
                    {item.kode_menu}
                  </Text>

                  <Text style={[styles.td, styles.colNama]}>
                    {item.nama_menu}
                  </Text>

                  <Text style={[styles.td, styles.colKategori]}>
                    {item.kategori}
                  </Text>

                  <Text style={[styles.td, styles.colHarga]}>
                    Rp {item.harga.toLocaleString("id-ID")}
                  </Text>

                  <Text style={[styles.td, styles.colKet]}>
                    {item.keterangan}
                  </Text>

                  <View style={[styles.colAksi, styles.actionBox]}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => pilihEdit(item)}
                    >
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => hapusMenu(item.id)}
                    >
                      <Text style={styles.actionText}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    padding: 20,
  },

  header: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 35,
  },

  subHeader: {
    color: "#d1d5db",
    marginTop: 5,
    marginBottom: 18,
  },

  formCard: {
    backgroundColor: "#1f2937",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 22,
  },

  formTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 14,
  },

  input: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    padding: 14,
    color: "#ffffff",
    marginBottom: 12,
  },

  textArea: {
    height: 80,
    textAlignVertical: "top",
  },

  saveButton: {
    backgroundColor: "#f97316",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  saveText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 15,
  },

  cancelButton: {
    marginTop: 12,
    alignItems: "center",
  },

  cancelText: {
    color: "#facc15",
    fontWeight: "bold",
  },

  listTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },

  table: {
    minWidth: 900,
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 35,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f97316",
    paddingVertical: 12,
    alignItems: "center",
  },

  tableRow: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    paddingVertical: 12,
    alignItems: "center",
  },

  th: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 6,
  },

  td: {
    color: "#e5e7eb",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 6,
  },

  colNo: {
    width: 50,
  },

  colKode: {
    width: 90,
  },

  colNama: {
    width: 170,
  },

  colKategori: {
    width: 120,
  },

  colHarga: {
    width: 130,
  },

  colKet: {
    width: 190,
  },

  colAksi: {
    width: 140,
  },

  actionBox: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },

  editButton: {
    backgroundColor: "#0284c7",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  deleteButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  actionText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 11,
  },

  emptyRow: {
    backgroundColor: "#1f2937",
    padding: 18,
  },

  emptyText: {
    color: "#d1d5db",
    textAlign: "center",
  },
});
