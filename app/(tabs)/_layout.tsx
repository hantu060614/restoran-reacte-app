import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#f97316",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#111827",
          borderTopColor: "#374151",
        },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="menu" options={{ title: "Menu" }} />
      <Tabs.Screen name="pemesanan" options={{ title: "Pemesanan" }} />
      <Tabs.Screen name="laporan" options={{ title: "Laporan" }} />
    </Tabs>
  );
}
