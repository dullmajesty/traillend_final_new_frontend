import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const toastConfig = {
  success: ({ text1, text2 }) => (
    <View
      style={{
        width: "92%",
        backgroundColor: "#ffffff",
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 18,
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
        elevation: 5,
        borderLeftWidth: 5,
        borderLeftColor: "#4CAF50",
      }}
    >
      <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />

      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: "#222" }}>
          {text1}
        </Text>
        {text2 ? (
          <Text
            style={{
              fontSize: 14,
              color: "#555",
              marginTop: 2,
            }}
          >
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),

  error: ({ text1, text2 }) => (
    <View
      style={{
        width: "92%",
        backgroundColor: "#ffffff",
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 18,
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
        elevation: 5,
        borderLeftWidth: 5,
        borderLeftColor: "#E53935",
      }}
    >
      <Ionicons name="close-circle" size={28} color="#E53935" />

      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: "#222" }}>
          {text1}
        </Text>
        {text2 ? (
          <Text style={{ fontSize: 14, color: "#444", marginTop: 2 }}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),
};
