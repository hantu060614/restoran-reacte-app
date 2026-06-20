import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { currentUserRole, setRole } from "../login";
import { Colors } from "../../constants/Colors";

export default function TabsLayout() {
  const handleLogout = () => {
    setRole("");
    router.replace("/login");
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0F172A", shadowOpacity: 0, elevation: 0, borderBottomWidth: 1, borderBottomColor: "#1E293B" },
        headerTintColor: "#fff",
        tabBarStyle: { backgroundColor: "#1E293B", borderTopColor: "#334155" },
        tabBarActiveTintColor: "#F97316",
        tabBarInactiveTintColor: "#94A3B8",
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        )
      }}
    >
      <Tabs.Screen 
        name="dashboard" 
        options={{ 
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          href: currentUserRole === "dapur" ? null : "/(tabs)/dashboard"
        }} 
      />
      <Tabs.Screen 
        name="menu" 
        options={{ 
          title: "Menu",
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" size={size} color={color} />,
          href: currentUserRole === "admin" ? "/(tabs)/menu" : null
        }} 
      />
      <Tabs.Screen 
        name="pemesanan" 
        options={{ 
          title: "Kasir",
          tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />,
          href: (currentUserRole === "admin" || currentUserRole === "kasir") ? "/(tabs)/pemesanan" : null
        }} 
      />
      <Tabs.Screen
        name="dapur"
        options={{
          title: "Dapur",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "restaurant" : "restaurant-outline"} size={24} color={color} />
          ),
          href: (currentUserRole === "admin" || currentUserRole === "dapur") ? "/(tabs)/dapur" : null
        }}
      />
      <Tabs.Screen
        name="laporan"
        options={{
          title: "Laporan",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "document-text" : "document-text-outline"} size={24} color={color} />
          ),
          href: (currentUserRole === "admin" || currentUserRole === "kasir") ? "/(tabs)/laporan" : null
        }}
      />
    </Tabs>
  );
}
