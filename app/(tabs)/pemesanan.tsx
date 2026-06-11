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
    getDocs,
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

type ItemPesanan = {
  kode_menu: string;
  nama_menu: string;
  kategori: string;
  harga: number;
  jumlah: number;
  subtotal: number;
};

export default function PemesananScreen() {
  const [menus, setMenus] = useState<Menu[]>([]);

  const [kodePesan, setKodePesan] = useState("");
  const [atasnama, setAtasnama] = useState("");

  const [kodeMenu, setKodeMenu] = useState("");
  const [namaMenu, setNamaMenu] = useState("");
  const [kategori, setKategori] = useState("");
  const [harga, setHarga] = useState(0);
  const [jumlah, setJumlah] = useState("1");

  const [showMenuList, setShowMenuList] = useState(false);
  const [items, setItems] = useState<ItemPesanan[]>([]);

  useEffect(() => {
    getMenus();
    buatKodePesanOtomatis();
  }, []);

  async function getMenus() {
    try {
      const snapshot = await getDocs(collection(db, "tbmenu"));

      const data: Menu[] = snapshot.docs.map((document) => {
        const item = document.data();

        return {
          id: document.id,
          kode_menu: item.kode_menu || "",
          nama_menu: item.nama_menu || "",
          kategori: item.kategori || "",
          harga: Number(item.harga || 0),
          keterangan: item.keterangan || "",
        };
      });

      setMenus(data);
    } catch (error) {
      console.log("Gagal mengambil data menu:", error);
      Alert.alert("Error", "Gagal mengambil data menu.");
    }
  }

  async function buatKodePesanOtomatis() {
    try {
      const snapshot = await getDocs(collection(db, "tbpemesanan"));

      let nomorTerbesar = 0;

      snapshot.docs.forEach((document) => {
        const data = document.data();
        const kode = data.kode_pesan || "";

        if (kode.startsWith("PE")) {
          const angka = parseInt(kode.replace("PE", ""), 10);

          if (!isNaN(angka) && angka > nomorTerbesar) {
            nomorTerbesar = angka;
          }
        }
      });

      const nomorBaru = nomorTerbesar + 1;
      const kodeBaru = "PE" + nomorBaru.toString().padStart(3, "0");

      setKodePesan(kodeBaru);
    } catch (error) {
      console.log("Gagal membuat kode otomatis:", error);
      setKodePesan("PE001");
    }
  }

  function pilihMenu(menu: Menu) {
    setKodeMenu(menu.kode_menu);
    setNamaMenu(menu.nama_menu);
    setKategori(menu.kategori);
    setHarga(menu.harga);
    setJumlah("1");
    setShowMenuList(false);
  }

  function tambahKeTabelPesanan() {
    if (atasnama.trim() === "") {
      Alert.alert("Peringatan", "Atas nama wajib diisi terlebih dahulu.");
      return;
    }

    if (kodeMenu.trim() === "") {
      Alert.alert("Peringatan", "Silakan pilih menu makanan/minuman.");
      return;
    }

    const jumlahNumber = Number(jumlah || 0);

    if (jumlahNumber <= 0) {
      Alert.alert("Peringatan", "Jumlah pesanan harus lebih dari 0.");
      return;
    }

    const subtotal = harga * jumlahNumber;

    const itemBaru: ItemPesanan = {
      kode_menu: kodeMenu,
      nama_menu: namaMenu,
      kategori: kategori,
      harga: harga,
      jumlah: jumlahNumber,
      subtotal: subtotal,
    };

    setItems([...items, itemBaru]);

    setKodeMenu("");
    setNamaMenu("");
    setKategori("");
    setHarga(0);
    setJumlah("1");
  }

  function hapusItem(index: number) {
    const dataBaru = items.filter((_, i) => i !== index);
    setItems(dataBaru);
  }

  const totalBayar = items.reduce((total, item) => {
    return total + item.subtotal;
  }, 0);

  async function pembayaran() {
    if (kodePesan.trim() === "" || atasnama.trim() === "") {
      Alert.alert("Peringatan", "Kode pesan dan atas nama wajib diisi.");
      return;
    }

    if (items.length === 0) {
      Alert.alert("Peringatan", "Belum ada menu yang dimasukkan ke tabel pemesanan.");
      return;
    }

    try {
      const tanggal = new Date().toLocaleDateString("id-ID");
      const jam = new Date().toLocaleTimeString("id-ID");

      for (const item of items) {
        await addDoc(collection(db, "tbpemesanan"), {
          kode_pesan: kodePesan,
          atasnama: atasnama,
          kode_menu: item.kode_menu,
          nama_menu: item.nama_menu,
          kategori: item.kategori,
          harga: item.harga,
          jumlah: item.jumlah,
          subtotal: item.subtotal,
          total_bayar: totalBayar,
          tanggal: tanggal,
          jam: jam,
        });
      }

      const detailStruk = items
        .map((item, index) => {
          return `${index + 1}. ${item.nama_menu}\n   ${item.jumlah} x Rp ${item.harga.toLocaleString(
            "id-ID"
          )} = Rp ${item.subtotal.toLocaleString("id-ID")}`;
        })
        .join("\n\n");

      Alert.alert(
        "Struk Pembayaran",
        `RESTORAN FIREBASE\n\nKode Pesan: ${kodePesan}\nAtas Nama: ${atasnama}\nTanggal: ${tanggal}\nJam: ${jam}\n\n${detailStruk}\n\nTotal Bayar: Rp ${totalBayar.toLocaleString(
          "id-ID"
        )}\n\nTerima kasih atas pesanan Anda.`
      );

      resetTransaksi();
    } catch (error) {
      console.log("Gagal menyimpan pembayaran:", error);
      Alert.alert("Error", "Gagal menyimpan pembayaran ke Firebase.");
    }
  }

  function resetTransaksi() {
    setAtasnama("");
    setKodeMenu("");
    setNamaMenu("");
    setKategori("");
    setHarga(0);
    setJumlah("1");
    setItems([]);
    setShowMenuList(false);
    buatKodePesanOtomatis();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Pemesanan</Text>
        <Text style={styles.subHeader}>
          Satu kode pesan dapat memiliki lebih dari satu menu
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Form Pemesanan</Text>

          <TextInput
            style={styles.inputDisabled}
            placeholder="Kode Pesan"
            placeholderTextColor="#9ca3af"
            value={kodePesan}
            editable={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Atas Nama"
            placeholderTextColor="#9ca3af"
            value={atasnama}
            onChangeText={setAtasnama}
          />

          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowMenuList(!showMenuList)}
          >
            <Text style={styles.selectText}>
              {kodeMenu === ""
                ? "Pilih Menu Makanan/Minuman"
                : `${kodeMenu} - ${namaMenu}`}
            </Text>
          </TouchableOpacity>

          {showMenuList && (
            <View style={styles.menuList}>
              {menus.length === 0 ? (
                <Text style={styles.empty}>Data menu belum ada.</Text>
              ) : (
                menus.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.menuOption}
                    onPress={() => pilihMenu(item)}
                  >
                    <Text style={styles.menuTitle}>
                      {item.kode_menu} - {item.nama_menu}
                    </Text>
                    <Text style={styles.menuText}>
                      {item.kategori} | Rp {item.harga.toLocaleString("id-ID")}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          <TextInput
            style={styles.inputDisabled}
            placeholder="Nama Menu"
            placeholderTextColor="#9ca3af"
            value={namaMenu}
            editable={false}
          />

          <TextInput
            style={styles.inputDisabled}
            placeholder="Kategori"
            placeholderTextColor="#9ca3af"
            value={kategori}
            editable={false}
          />

          <TextInput
            style={styles.inputDisabled}
            placeholder="Harga"
            placeholderTextColor="#9ca3af"
            value={harga === 0 ? "" : `Rp ${harga.toLocaleString("id-ID")}`}
            editable={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Jumlah"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            value={jumlah}
            onChangeText={setJumlah}
          />

          <TouchableOpacity
            style={styles.addButton}
            onPress={tambahKeTabelPesanan}
          >
            <Text style={styles.saveText}>Masukkan ke Tabel Pemesanan</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.listTitle}>Tabel Pemesanan</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colNo]}>No</Text>
              <Text style={[styles.th, styles.colKode]}>Kode</Text>
              <Text style={[styles.th, styles.colNama]}>Nama Menu</Text>
              <Text style={[styles.th, styles.colKategori]}>Kategori</Text>
              <Text style={[styles.th, styles.colHarga]}>Harga</Text>
              <Text style={[styles.th, styles.colJumlah]}>Jml</Text>
              <Text style={[styles.th, styles.colTotal]}>Subtotal</Text>
              <Text style={[styles.th, styles.colAksi]}>Aksi</Text>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.empty}>
                  Belum ada menu yang dimasukkan.
                </Text>
              </View>
            ) : (
              items.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.td, styles.colNo]}>{index + 1}</Text>

                  <Text style={[styles.td, styles.colKode]}>
                    {kodePesan}
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

                  <Text style={[styles.td, styles.colJumlah]}>
                    {item.jumlah}
                  </Text>

                  <Text style={[styles.td, styles.colTotal]}>
                    Rp {item.subtotal.toLocaleString("id-ID")}
                  </Text>

                  <View style={[styles.colAksi, styles.actionBox]}>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => hapusItem(index)}
                    >
                      <Text style={styles.actionText}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total Bayar Seluruh Pesanan</Text>
          <Text style={styles.totalText}>
            Rp {totalBayar.toLocaleString("id-ID")}
          </Text>
        </View>

        <TouchableOpacity style={styles.payButton} onPress={pembayaran}>
          <Text style={styles.saveText}>Pembayaran / Cetak Struk</Text>
        </TouchableOpacity>
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
    fontSize: 30,
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

  inputDisabled: {
    backgroundColor: "#374151",
    borderRadius: 12,
    padding: 14,
    color: "#e5e7eb",
    marginBottom: 12,
  },

  selectButton: {
    backgroundColor: "#f97316",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },

  selectText: {
    color: "#ffffff",
    fontWeight: "bold",
    textAlign: "center",
  },

  menuList: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },

  menuOption: {
    backgroundColor: "#1f2937",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },

  menuTitle: {
    color: "#ffffff",
    fontWeight: "bold",
  },

  menuText: {
    color: "#d1d5db",
    marginTop: 4,
  },

  addButton: {
    backgroundColor: "#f97316",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  payButton: {
    backgroundColor: "#16a34a",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 35,
  },

  saveText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 15,
  },

  listTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },

  table: {
    minWidth: 930,
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
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
    width: 45,
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

  colJumlah: {
    width: 70,
  },

  colTotal: {
    width: 150,
  },

  colAksi: {
    width: 110,
  },

  actionBox: {
    flexDirection: "row",
    justifyContent: "center",
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

  empty: {
    color: "#d1d5db",
    textAlign: "center",
  },

  totalBox: {
    backgroundColor: "#7c2d12",
    borderRadius: 16,
    padding: 18,
    marginBottom: 15,
  },

  totalLabel: {
    color: "#fed7aa",
    fontSize: 15,
  },

  totalText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 5,
  },
});
