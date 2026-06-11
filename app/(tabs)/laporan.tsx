import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { collection, getDocs } from "firebase/firestore";

import { db } from "../../config/firebase";

type LaporanItem = {
  id: string;
  kode_pesan: string;
  atasnama: string;
  kode_menu: string;
  nama_menu: string;
  kategori: string;
  harga: number;
  jumlah: number;
  subtotal: number;
  total_bayar: number;
  tanggal: string;
  jam: string;
};

type RekapTransaksi = {
  kode_pesan: string;
  atasnama: string;
  tanggal: string;
  jam: string;
  jumlah_item: number;
  total_transaksi: number;
};

export default function LaporanScreen() {
  const [dataLaporan, setDataLaporan] = useState<LaporanItem[]>([]);
  const [rekapTransaksi, setRekapTransaksi] = useState<RekapTransaksi[]>([]);

  const [totalPendapatan, setTotalPendapatan] = useState(0);
  const [totalTransaksi, setTotalTransaksi] = useState(0);
  const [totalItemTerjual, setTotalItemTerjual] = useState(0);

  useEffect(() => {
    getLaporan();
  }, []);

  async function getLaporan() {
    try {
      const snapshot = await getDocs(collection(db, "tbpemesanan"));

      const data: LaporanItem[] = snapshot.docs.map((document) => {
        const item = document.data();

        return {
          id: document.id,
          kode_pesan: item.kode_pesan || "",
          atasnama: item.atasnama || "",
          kode_menu: item.kode_menu || "",
          nama_menu: item.nama_menu || "",
          kategori: item.kategori || "",
          harga: Number(item.harga || 0),
          jumlah: Number(item.jumlah || 0),
          subtotal: Number(item.subtotal || item.total || 0),
          total_bayar: Number(item.total_bayar || item.total || 0),
          tanggal: item.tanggal || "",
          jam: item.jam || "",
        };
      });

      data.sort((a, b) => {
        if (a.kode_pesan < b.kode_pesan) return 1;
        if (a.kode_pesan > b.kode_pesan) return -1;
        return 0;
      });

      const totalPendapatanHitung = data.reduce((total, item) => {
        return total + item.subtotal;
      }, 0);

      const totalItemHitung = data.reduce((total, item) => {
        return total + item.jumlah;
      }, 0);

      const rekapMap: { [key: string]: RekapTransaksi } = {};

      data.forEach((item) => {
        if (!rekapMap[item.kode_pesan]) {
          rekapMap[item.kode_pesan] = {
            kode_pesan: item.kode_pesan,
            atasnama: item.atasnama,
            tanggal: item.tanggal,
            jam: item.jam,
            jumlah_item: 0,
            total_transaksi: 0,
          };
        }

        rekapMap[item.kode_pesan].jumlah_item += item.jumlah;
        rekapMap[item.kode_pesan].total_transaksi += item.subtotal;
      });

      const rekapArray = Object.values(rekapMap);

      setDataLaporan(data);
      setRekapTransaksi(rekapArray);
      setTotalPendapatan(totalPendapatanHitung);
      setTotalTransaksi(rekapArray.length);
      setTotalItemTerjual(totalItemHitung);
    } catch (error) {
      console.log("Gagal mengambil laporan:", error);
      Alert.alert("Error", "Gagal mengambil laporan dari Firebase.");
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Laporan Keuangan</Text>
        <Text style={styles.subHeader}>
          Rekap transaksi dari collection tbpemesanan
        </Text>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Pendapatan</Text>
          <Text style={styles.summaryValue}>
            Rp {totalPendapatan.toLocaleString("id-ID")}
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summarySmallBox}>
              <Text style={styles.summarySmallLabel}>Transaksi</Text>
              <Text style={styles.summarySmallValue}>{totalTransaksi}</Text>
            </View>

            <View style={styles.summarySmallBox}>
              <Text style={styles.summarySmallLabel}>Item Terjual</Text>
              <Text style={styles.summarySmallValue}>{totalItemTerjual}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={getLaporan}>
          <Text style={styles.refreshText}>Refresh Laporan</Text>
        </TouchableOpacity>

        <Text style={styles.listTitle}>Rekap Per Transaksi</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.tableRekap}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colNo]}>No</Text>
              <Text style={[styles.th, styles.colKode]}>Kode Pesan</Text>
              <Text style={[styles.th, styles.colNama]}>Atas Nama</Text>
              <Text style={[styles.th, styles.colJumlah]}>Jml Item</Text>
              <Text style={[styles.th, styles.colTotal]}>Total</Text>
              <Text style={[styles.th, styles.colTanggal]}>Tanggal</Text>
              <Text style={[styles.th, styles.colJam]}>Jam</Text>
            </View>

            {rekapTransaksi.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>Belum ada data transaksi.</Text>
              </View>
            ) : (
              rekapTransaksi.map((item, index) => (
                <View key={item.kode_pesan} style={styles.tableRow}>
                  <Text style={[styles.td, styles.colNo]}>{index + 1}</Text>

                  <Text style={[styles.td, styles.colKode]}>
                    {item.kode_pesan}
                  </Text>

                  <Text style={[styles.td, styles.colNama]}>
                    {item.atasnama}
                  </Text>

                  <Text style={[styles.td, styles.colJumlah]}>
                    {item.jumlah_item}
                  </Text>

                  <Text style={[styles.td, styles.colTotal]}>
                    Rp {item.total_transaksi.toLocaleString("id-ID")}
                  </Text>

                  <Text style={[styles.td, styles.colTanggal]}>
                    {item.tanggal}
                  </Text>

                  <Text style={[styles.td, styles.colJam]}>{item.jam}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <Text style={styles.listTitle}>Detail Menu Terjual</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.tableDetail}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colNo]}>No</Text>
              <Text style={[styles.th, styles.colKode]}>Kode Pesan</Text>
              <Text style={[styles.th, styles.colNama]}>Atas Nama</Text>
              <Text style={[styles.th, styles.colKodeMenu]}>Kode Menu</Text>
              <Text style={[styles.th, styles.colMenu]}>Nama Menu</Text>
              <Text style={[styles.th, styles.colKategori]}>Kategori</Text>
              <Text style={[styles.th, styles.colHarga]}>Harga</Text>
              <Text style={[styles.th, styles.colJumlah]}>Jml</Text>
              <Text style={[styles.th, styles.colTotal]}>Subtotal</Text>
              <Text style={[styles.th, styles.colTanggal]}>Tanggal</Text>
            </View>

            {dataLaporan.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>Belum ada detail transaksi.</Text>
              </View>
            ) : (
              dataLaporan.map((item, index) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.td, styles.colNo]}>{index + 1}</Text>

                  <Text style={[styles.td, styles.colKode]}>
                    {item.kode_pesan}
                  </Text>

                  <Text style={[styles.td, styles.colNama]}>
                    {item.atasnama}
                  </Text>

                  <Text style={[styles.td, styles.colKodeMenu]}>
                    {item.kode_menu}
                  </Text>

                  <Text style={[styles.td, styles.colMenu]}>
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

                  <Text style={[styles.td, styles.colTanggal]}>
                    {item.tanggal}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
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

  summaryBox: {
    backgroundColor: "#7c2d12",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },

  summaryLabel: {
    color: "#fed7aa",
    fontSize: 15,
  },

  summaryValue: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 6,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },

  summarySmallBox: {
    flex: 1,
    backgroundColor: "#9a3412",
    borderRadius: 14,
    padding: 12,
  },

  summarySmallLabel: {
    color: "#fed7aa",
    fontSize: 13,
  },

  summarySmallValue: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 4,
  },

  refreshButton: {
    backgroundColor: "#f97316",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },

  refreshText: {
    color: "#ffffff",
    fontWeight: "bold",
  },

  listTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 8,
  },

  tableRekap: {
    minWidth: 850,
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 28,
  },

  tableDetail: {
    minWidth: 1200,
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
    width: 45,
  },

  colKode: {
    width: 110,
  },

  colNama: {
    width: 140,
  },

  colKodeMenu: {
    width: 110,
  },

  colMenu: {
    width: 170,
  },

  colKategori: {
    width: 120,
  },

  colHarga: {
    width: 130,
  },

  colJumlah: {
    width: 80,
  },

  colTotal: {
    width: 150,
  },

  colTanggal: {
    width: 120,
  },

  colJam: {
    width: 110,
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
