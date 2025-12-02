import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from "react-native";
import { getAuth } from "../../lib/authStorage";
import { useNavigation } from "@react-navigation/native";

export default function SelectItemToReport() {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);

  const BASE = "http://192.168.1.8:8000";
  const IN_USE_URL = BASE + "/api/in-use-items/";

  useEffect(() => {
    const load = async () => {
      const auth = await getAuth();

      if (!auth || !auth.accessToken) {
        console.log("❌ No token found, user not logged in");
        return;
      }

      const token = auth.accessToken;
      console.log("TOKEN:", token);

      fetch(IN_USE_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("IN USE RESPONSE:", data);

          if (data.success) {
            setItems(data.items);
          } else {
            console.log("❌ API failed:", data);
          }
        })
        .catch((err) => console.log("❌ Fetch error:", err));
    };

    load();
  }, []);

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={styles.title}>Select Item to Report</Text>

      {items.length === 0 ? (
        <Text style={{ color: "#888" }}>You have no borrowed items currently in use.</Text>
      ) : (
        items
          .flatMap(res => (res.items || []).map(it => ({
            ...it,
            reservation_id: res.reservation_id,
            date_borrowed: res.date_borrowed,
            date_return: res.date_return
          })))
          .map(item => (
            <TouchableOpacity
              key={`${item.reservation_id}-${item.item_id}`}
              style={styles.card}
              onPress={() =>
                navigation.navigate("Report_Damage", {
                  reservation_id: item.reservation_id,
                  item_id: item.item_id,
                  item_name: item.item_name,
                  quantity: item.quantity,
                  image_url: item.image,
                  date_borrowed: item.date_borrowed,
                  date_return: item.date_return,
                })
              }
            >
              <Image source={{ uri: item.image }} style={styles.img} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.item_name}</Text>
                <Text style={styles.details}>Qty: {item.quantity}</Text>
                <Text style={styles.details}>
                  {item.date_borrowed} → {item.date_return}
                </Text>
              </View>
            </TouchableOpacity>
          ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
    color: "#1976D2",
  },

  card: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#E3F2FD",
    marginBottom: 12,
    alignItems: "center",
    borderColor: "#90CAF9",
    borderWidth: 1,
  },

  img: {
    width: 55,
    height: 55,
    marginRight: 12,
    borderRadius: 10,
  },

  name: {
    fontWeight: "700",
    color: "#0D47A1",
    fontSize: 15,
  },

  details: {
    color: "#444",
    fontSize: 12,
    marginTop: 2,
  },
});
