import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";

import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import AlertesScreen from "./src/screens/AlertesScreen";
import BlacklistScreen from "./src/screens/BlacklistScreen";
import LogsScreen from "./src/screens/LogsScreen";
import RapportScreen from "./src/screens/RapportScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#2E75B6",
        tabBarInactiveTintColor: "#aaa",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          elevation: 10,
        },
        headerStyle: { backgroundColor: "#1A3C5E" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📡</Text>,
        }}
      />
      <Tab.Screen
        name="Alertes"
        component={AlertesScreen}
        options={{
          title: "Alertes",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>⚠️</Text>,
        }}
      />
      <Tab.Screen
        name="Logs"
        component={LogsScreen}
        options={{
          title: "Logs",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="Blacklist"
        component={BlacklistScreen}
        options={{
          title: "Blacklist",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🚫</Text>,
        }}
      />
      <Tab.Screen
        name="Rapport"
        component={RapportScreen}
        options={{
          title: "Rapport",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
