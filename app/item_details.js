import React, { useState, useEffect } from "react";
import {View,Text,Image,TextInput,TouchableOpacity,StyleSheet,ScrollView,Alert,ActivityIndicator,} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import * as ImagePicker from "expo-image-picker";
import Modal from "react-native-modal";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";

export default function ItemDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowDate, setBorrowDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [availableQty, setAvailableQty] = useState(null);
  const [borrowQty, setBorrowQty] = useState("");
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showProceedModal, setShowProceedModal] = useState(false);
  const [selectingType, setSelectingType] = useState("borrow");
  const [markedDates, setMarkedDates] = useState({});
  const [checking, setChecking] = useState(false);
  const [priority, setPriority] = useState("Low");
  const [message, setMessage] = useState("");
  const [letterPhoto, setLetterPhoto] = useState(null);
  const [idPhoto, setIdPhoto] = useState(null);
  const [calendarMap, setCalendarMap] = useState({});
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [priorityDetail, setPriorityDetail] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [showSuggestedModal, setShowSuggestedModal] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [addedItems, setAddedItems] = useState([]);



  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch("http://192.168.1.8:8000/api/inventory_list/");
        const data = await res.json();
        const found = data.find((i) => i.item_id === parseInt(id));
        setItem(found);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const fetchAvailabilityMap = async () => {
    try {
      setCalendarLoading(true);

      const res = await fetch(`http://192.168.1.8:8000/api/items/${id}/availability-map/`);
      const json = await res.json();

      const map = json.calendar || {};
      setCalendarMap(map);

      const marks = {};
      Object.entries(map).forEach(([date, info]) => {
        if (info.status === "fully_reserved") {
          // Red for fully reserved
          marks[date] = {
            disabled: true,
            disableTouchEvent: true,
            customStyles: {
              container: { backgroundColor: "#ffcccc" },
              text: { color: "#a00", fontWeight: "bold" },
            },
          };
        } else {
          // Green for available
          marks[date] = {
            customStyles: {
              container: { backgroundColor: "#e6ffe6" },
              text: { color: "#008000", fontWeight: "600" },
            },
          };
        }
      });

      setMarkedDates(marks);
    } catch (e) {
      console.warn("Failed to fetch map:", e);
    } finally {
      setCalendarLoading(false);
    }
  };



  useEffect(() => {
    if (showCalendarModal) fetchAvailabilityMap();
  }, [showCalendarModal]);

  const fetchAvailability = async (date) => {
    try {
      const res = await fetch(
        `http://192.168.1.8:8000/api/items/${id}/availability/?date=${date}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const qty = data.available_qty ?? data.remaining_qty ?? data.available ?? 0;
      setAvailableQty(qty);
      return data;
    } catch (e) {
      console.warn("Availability fetch error:", e);
      return null;
    }
  };

  const handleSaveDate = () => {
    if (!availableQty && availableQty !== 0) return Alert.alert("Select a date first.");
    if (!borrowQty) return Alert.alert("Enter quantity to borrow.");
    if (parseInt(borrowQty) > availableQty)
      return Alert.alert("Quantity exceeds available items.");
    setShowCalendarModal(false);
  };

  const pickImage = async (setImage) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Toast.show({
        type: "error",
        text1: "Permission Denied",
        text2: "Please allow gallery access to upload a photo.",
      });
      return;
    }

    Alert.alert("Upload Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,

            allowsEditing: true,
            quality: 0.7,
          });
          if (!result.canceled) setImage(result.assets[0].uri);
           Toast.show({
            type: "success",
            text1: "Photo Added",
            text2: "Your photo was captured successfully.",
          });
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,

            allowsEditing: true,
            quality: 0.7,
          });
          if (!result.canceled) setImage(result.assets[0].uri);
          Toast.show({
            type: "success",
            text1: "Photo Added",
            text2: "Your photo has been selected.",
          });
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };


const preflightAndGoToSummary = async () => {
  if (!borrowDate || !returnDate) {
    Toast.show({
      type: "error",
      text1: "Missing Dates",
      text2: "Please select both borrow and return dates before continuing.",
    });
    return;
  }

  if (!borrowQty) {
    Toast.show({
      type: "error",
      text1: "Missing Quantity",
      text2: "Enter how many items you want to borrow.",
    });
    return;
  }

  setChecking(true);
  try {
    const res = await fetch("http://192.168.1.8:8000/api/reservations/check/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: Number(id),
        qty: Number(borrowQty),
        start_date: borrowDate,
        end_date: returnDate,
      }),
    });

    if (res.status === 200) {
      Toast.show({
        type: "success",
        text1: "Checking Completed",
        text2: "Item is available. Redirecting to summary...",
      });

      setTimeout(() => {
       router.push({
        pathname: "/item_reservation_summary",
        params: {
          main_item_id: String(item?.item_id),
          main_item_name: item?.name,
          main_item_image: item?.image,
          main_item_qty: String(borrowQty),

          added_items: JSON.stringify(selectedItems),

          start_date: borrowDate,
          end_date: returnDate,
          priority,
          priorityDetail,
          letterPhoto,
          idPhoto
        },
      });
      }, 800);
    } else if (res.status === 409) {
      const data = await res.json();
      Alert.alert(
        "Unavailable",
        `Sorry, this item is unavailable for your selected date.\nNext available: ${
          data.suggestions?.[0]?.date || "N/A"
        }`,
        [{ text: "OK", style: "default" }]
      );
    } else {
      const data = await res.json();
      Toast.show({
        type: "error",
        text1: "Error Checking Availability",
        text2: data.detail || "Could not check item availability.",
      });
    }
  } catch {
    Toast.show({
      type: "error",
      text1: "Network Error",
      text2: "Please check your internet connection.",
    });
  } finally {
    setChecking(false);
  }
};


const fetchSuggestedItems = async () => {
  if (!borrowDate || !returnDate) {
    Toast.show({
      type: "error",
      text1: "Select Dates First",
      text2: "Borrow and return dates are required.",
    });
    return;
  }

  try {
    setLoadingSuggestions(true);

    const res = await fetch("http://192.168.1.8:8000/api/suggest-items/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_date: borrowDate,
        end_date: returnDate,
        exclude_item_id: id,
      }),
    });



    const data = await res.json();
    setSuggestedItems(data.suggestions || []);
    setShowSuggestedModal(true);
  } catch (err) {
    console.log("Suggestion Error:", err);
    Toast.show({
      type: "error",
      text1: "Failed to Load Suggestions",
      text2: "Try again later.",
    });
  } finally {
    setLoadingSuggestions(false);
  }
};

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    );

  if (!item) {
  return (
    <View style={styles.centered}>
      <Text style={{ color: "#fff" }}>Item not found.</Text>
    </View>
  );
}

return (
  <LinearGradient colors={["#4FC3F7", "#4FC3F7"]} style={{ flex: 1 }}>

    {/* HEADER */}
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Reservation</Text>
    </View>

    {/* ⭐ EVERYTHING SCROLLS TOGETHER (single ScrollView only) */}
    <ScrollView contentContainerStyle={{ paddingBottom: 45, paddingHorizontal: 20,  }}>

      {/* DATE SELECTION */}
      <View style={styles.dateRow}>
        {["borrow", "return"].map((type) => (
          <TouchableOpacity
            key={type}
            style={styles.dateBox}
            onPress={() => {
              setSelectingType(type);
              setShowCalendarModal(true);
            }}
          >
            <Ionicons name="calendar-outline" size={20} color="#555" />
            <Text style={styles.dateText}>
              {type === "borrow"
                ? borrowDate || "Borrow Date"
                : returnDate || "Return Date"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {availableQty !== null && (
        <Text style={styles.availableText}>Available: {availableQty} item(s)</Text>
      )}

      {/* BORROW QTY BAR */}
      <View style={styles.qtyDisplay}>
        <Text style={styles.qtyText}>Borrow Qty: {borrowQty || "—"}</Text>
      </View>

      {/* UPLOAD REQUEST LETTER */}
      <TouchableOpacity
        style={styles.uploadCard}
        onPress={() => pickImage(setLetterPhoto)}
        activeOpacity={0.8}
      >
        <Ionicons name="document-text-outline" size={26} color="#1976D2" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.uploadTitle}>Upload Request Letter</Text>
          <Text style={styles.uploadHint}>
            Please upload a short request letter explaining why you need the item.
          </Text>
        </View>
      </TouchableOpacity>

      {letterPhoto && <Image source={{ uri: letterPhoto }} style={styles.preview} />}

      {/* UPLOAD VALID ID */}
      <TouchableOpacity
        style={styles.uploadCard}
        onPress={() => pickImage(setIdPhoto)}
        activeOpacity={0.8}
      >
        <Ionicons name="id-card-outline" size={26} color="#1976D2" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.uploadTitle}>Upload Valid ID</Text>
          <Text style={styles.uploadHint}>
            Accepted IDs:{" "}
            <Text style={styles.uploadEmphasis}>
              Government-issued, Student ID, or Birth Certificate
            </Text>.
          </Text>
        </View>
      </TouchableOpacity>

      {idPhoto && <Image source={{ uri: idPhoto }} style={styles.preview} />}

      {/* REASON FOR BORROWING */}
      <Text style={styles.label}>Reason for Borrowing:</Text>

      <View style={styles.priorityContainer}>
        <TouchableOpacity
          style={[
            styles.priorityPill,
            priorityDetail === "Funeral" && styles.priorityPillSelected,
          ]}
          onPress={() => {
            setPriority("High");
            setPriorityDetail("Funeral");
          }}
        >
          <Text
            style={[
              styles.priorityPillText,
              priorityDetail === "Funeral" && styles.priorityPillTextSelected,
            ]}
          >
            Funeral
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.priorityPill,
            priorityDetail === "Government Activities" &&
              styles.priorityPillSelected,
          ]}
          onPress={() => {
            setPriority("High");
            setPriorityDetail("Government Activities");
          }}
        >
          <Text
            style={[
              styles.priorityPillText,
              priorityDetail === "Government Activities" &&
                styles.priorityPillTextSelected,
            ]}
          >
            Government Activities
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.priorityPill,
            priorityDetail === "Family Gathering" &&
              styles.priorityPillSelected,
          ]}
          onPress={() => {
            setPriority("Low");
            setPriorityDetail("Family Gathering");
          }}
        >
          <Text
            style={[
              styles.priorityPillText,
              priorityDetail === "Family Gathering" &&
                styles.priorityPillTextSelected,
            ]}
          >
            Family Gathering
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.priorityPill,
            priorityDetail === "School Events" &&
              styles.priorityPillSelected,
          ]}
          onPress={() => {
            setPriority("Low");
            setPriorityDetail("School Events");
          }}
        >
          <Text
            style={[
              styles.priorityPillText,
              priorityDetail === "School Events" &&
                styles.priorityPillTextSelected,
            ]}
          >
            School Events
          </Text>
        </TouchableOpacity>

        {/* OTHERS */}
        <TouchableOpacity
          style={[
            styles.priorityPillFull,
            priorityDetail === "Others" && styles.priorityPillSelected,
          ]}
          onPress={() => {
            setPriority("Low");
            setPriorityDetail("Others");
          }}
        >
          <Text
            style={[
              styles.priorityPillText,
              priorityDetail === "Others" && styles.priorityPillTextSelected,
            ]}
          >
            Others (Specify)
          </Text>
        </TouchableOpacity>

        {priorityDetail === "Others" && (
          <TextInput
            style={styles.otherInput}
            placeholder="Please specify your reason..."
            value={otherReason}
            onChangeText={setOtherReason}
          />
        )}
      </View>

      {/* DIVIDER */}
      <View style={{ height: 1, backgroundColor: "#1E9CD6", marginVertical: 15 }} />

      <View style={styles.detailsContainer}>
  <Text style={styles.detailsTitle}>Item Details</Text>

  <View style={styles.detailsBigCard}>

    {/* MAIN ITEM */}
    <View style={styles.itemRow}>
      <Image
        source={{ uri: item?.image }}
        style={styles.detailsRowImage}
      />

      <View style={styles.detailsRight}>
        <Text style={styles.mainItemName}>{item.name}</Text>
        <Text style={styles.detailsRowOwner}>Owner: {item.owner}</Text>
        <Text style={styles.detailsRowDesc}>{item.description}</Text>

        <TouchableOpacity
          style={styles.addItemBtnMain}
          onPress={fetchSuggestedItems}
        >
          <Text style={styles.addItemBtnMainText}>Add Another Item</Text>
        </TouchableOpacity>
      </View>
    </View>

    {/* DIVIDER */}
    {selectedItems.length > 0 && <View style={styles.itemDivider} />}

    {/* ADDED ITEMS */}
    {selectedItems.map((itm, index) => (
      <View key={index} style={styles.itemRow}>
        <Image source={{ uri: itm.image }} style={styles.detailsRowImage} />

        <View style={styles.detailsRight}>
          <Text style={styles.mainItemName}>{itm.name}</Text>
          <Text style={styles.detailsRowOwner}>Available: {itm.available_qty}</Text>
          <Text style={styles.detailsRowDesc}>{itm.description}</Text>

          <View style={styles.actionColumn}>
            <TextInput
              placeholder="Qty"
              keyboardType="numeric"
              style={styles.qtyInput}
              onChangeText={(val) => {
                setSelectedItems(prev => {
                  const c = [...prev];
                  c[index].qty = val;
                  return c;
                });
              }}
            />

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() =>
                setSelectedItems(prev => prev.filter(p => p.item_id !== itm.item_id))
              }
            >
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ))}

  </View>
</View>


    

      {/* CONTINUE BUTTON */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.reserveBtn}
        disabled={checking}
        onPress={() => {
          if (!letterPhoto) {
            Toast.show({
              type: "error",
              text1: "Request Letter Required",
              text2: "Please upload your Request letter.",
            });
            return;
          }

          if (!idPhoto) {
            Toast.show({
              type: "error",
              text1: "Valid ID Required",
              text2: "Please upload your valid ID.",
            });
            return;
          }

          setShowProceedModal(true);
        }}
      >
        <LinearGradient
          colors={["#FFA500", "#FFA500"]}
          start={[0, 0]}
          end={[1, 0]}
          style={styles.reserveGradient}
        >
          {checking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.reserveText}>Continue</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

    </ScrollView>

     {/* Calendar Modal */}
      <Modal
        isVisible={showCalendarModal}
        backdropOpacity={0.4}
        onBackdropPress={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalCard}>
          {calendarLoading ? (
            <ActivityIndicator size="large" color="#1E88E5" />
          ) : (
            <>
              <Calendar
                markingType="custom"
                markedDates={markedDates}
                onDayPress={async (day) => {
                const date = day.dateString;
                const info = calendarMap[date];

                // Block fully reserved dates
                if (info?.status === "fully_reserved") {
                  Alert.alert("Unavailable", "That date is fully reserved.");
                  return;
                }

                // Update available qty
                if (info && info.available_qty !== undefined) {
                  setAvailableQty(info.available_qty);
                } else {
                  const data = await fetchAvailability(date);
                  if (!data) return;
                  setAvailableQty(data.available_qty || 0);
                }

                // Set borrow or return date
                if (selectingType === "borrow") setBorrowDate(date);
                else if (borrowDate && date < borrowDate)
                  return Alert.alert("Invalid", "Return date must be after borrow date.");
                else setReturnDate(date);

                // Reset all previous blue highlights, keep default map colors
                const newMarks = {};

                Object.entries(calendarMap).forEach(([key, info]) => {
                  if (info.status === "fully_reserved") {
                    newMarks[key] = {
                      ...markedDates[key],
                      customStyles: {
                        container: { backgroundColor: "#ffcccc" },
                        text: { color: "#a00", fontWeight: "bold" },
                      }
                    };
                  } else {
                    newMarks[key] = {
                      ...markedDates[key],
                      customStyles: {
                        container: { backgroundColor: "#e6ffe6" },
                        text: { color: "#008000", fontWeight: "600" },
                      }
                    };
                  }
                });

                // Mark the user-selected date as blue
                newMarks[date] = {
                  ...newMarks[date],
                  customStyles: {
                    container: { backgroundColor: "#1E88E5" },
                    text: { color: "#fff", fontWeight: "bold" }
                  }
                };

                setMarkedDates(newMarks);
              }}

                minDate={new Date().toISOString().slice(0, 10)}
                theme={{ todayTextColor: "#FFA500", arrowColor: "#1E88E5" }}
              />

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#e6ffe6" }]} />
                  <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#ffcccc" }]} />
                  <Text style={styles.legendText}>Fully Reserved</Text>
                </View>

              </View>

              <Text style={styles.modalAvail}>
                {availableQty === null
                  ? "Tap a date to check availability"
                  : `Available: ${availableQty}`}
              </Text>

              <TextInput
                style={styles.modalQtyInput}
                placeholder="Enter quantity"
                keyboardType="numeric"
                value={borrowQty}
                onChangeText={setBorrowQty}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#4CAF50" }]}
                  onPress={handleSaveDate}
                >
                  <Text style={styles.modalBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#E53935" }]}
                  onPress={() => setShowCalendarModal(false)}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
  
     {/* Proceed Notice Modal */}
      <Modal
        isVisible={showProceedModal}
        backdropOpacity={0.5}
        animationIn="fadeInUp"
        animationOut="fadeOutDown"
        onBackdropPress={() => setShowProceedModal(false)}
      >
        <View style={styles.noticeCard}>
          {/* Header */}
          <View style={styles.noticeHeader}>
            <Ionicons name="alert-circle-outline" size={28} color="#64B5F6" />
            <Text style={styles.noticeTitle}>Before You Proceed</Text>
          </View>

          <Text style={styles.noticeSubtitle}>
            Please review the following reminders carefully before submitting your reservation request.
          </Text>

          {/* Content */}
          <ScrollView
            style={{ maxHeight: 420 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 10 }}
          >
            {[
              {
                title: "Reservation Recording",
                text:
                  "All reservation details — including your name, contact information, and selected items — will be recorded in the system for proper documentation and verification.",
              },
              {
                title: "Accuracy of Information",
                text:
                  "Ensure all details you provide are true and complete. False or misleading information may result in cancellation or account suspension.",
              },
              {
                title: "Identification Requirement",
                text:
                  "A valid government-issued ID is required. A Student ID or Birth Certificate may also be accepted. Fake or expired IDs will result in immediate suspension.",
              },
              {
                title: "Claiming Policy",
                text:
                  "Items must be claimed on the scheduled date. Failure to claim will result in 1 warning. Accumulating 3 warnings will mark your account as a bad borrower and may result in a ban.",
              },
              {
                title: "Late Return Policy",
                text:
                  "Late returns will be recorded and may result in warnings. Repeated late returns will mark you as a bad borrower.",
              },
              {
                title: "Unreturned or Lost Items",
                text:
                  "Failure to return an item within 7 days after the due date is a serious violation. You may be required to replace the item or face suspension. Repeated cases can lead to permanent banning.",
              },
              {
                title: "Damaged Items",
                text:
                  "Any damage must be reported immediately. Borrowers are responsible for repair or replacement. Three recorded damages will result in borrowing suspension.",
              },
              {
                title: "Privacy Policy",
                text:
                  "All personal data is handled confidentially and used only for official TrailLend and Barangay Kauswagan purposes, following the Data Privacy Act.",
              },
            ].map((item, index) => (
              <View key={index} style={styles.noticeItem}>
                <View style={styles.noticeDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noticeHeading}>{item.title}</Text>
                  <Text style={styles.noticeText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Buttons */}
          <View style={styles.noticeBtnRow}>
            <TouchableOpacity
              style={[styles.noticeBtn, styles.noticeCancelBtn]}
              onPress={() => setShowProceedModal(false)}
            >
              <Ionicons name="close-circle-outline" size={18} color="#555" />
              <Text style={[styles.noticeBtnText, { color: "#333" }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.noticeBtn, styles.noticeContinueBtn]}
              onPress={() => {
                setShowProceedModal(false);
                preflightAndGoToSummary();
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={[styles.noticeBtnText, { color: "#fff" }]}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    <Modal
      isVisible={showSuggestedModal}
      backdropOpacity={0.4}
      onBackdropPress={() => setShowSuggestedModal(false)}
    >
      <View style={{
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 18
      }}>
        
        <Text style={{
          fontSize: 18,
          fontWeight: "700",
          color: "#1976D2",
          textAlign: "center",
          marginBottom: 10
        }}>
          Suggested Items
        </Text>

        {loadingSuggestions ? (
          <ActivityIndicator size="large" color="#1976D2" />
        ) : suggestedItems.length === 0 ? (

          <Text style={{ textAlign: "center", color: "#666", marginVertical: 20 }}>
            No available suggested items for this date range.
          </Text>

        ) : (
          <ScrollView style={{ maxHeight: 350 }}>
            {suggestedItems.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  backgroundColor: "#E3F2FD",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                  alignItems: "center"
                }}
              >
                <Image
                  source={{ uri: item.image }}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 10,
                    backgroundColor: "#fff",
                    marginRight: 12
                  }}
                />

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#0D47A1" }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#1A237E" }}>
                    Available: {item.available_qty}
                  </Text>

                  <TouchableOpacity
                    style={{
                      marginTop: 8,
                      backgroundColor: "#FFC107",
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 8,
                      alignSelf: "flex-start"
                    }}
                  onPress={() => {
                    setSelectedItems((prev) => [
                      ...prev,
                      {
                        item_id: item.item_id,
                        name: item.name,
                        available_qty: item.available_qty,
                        image: item.image,
                        description: item.description,
                        owner: item.owner,
                        borrow_qty: "",   
                      }
                    ]);

                    setShowSuggestedModal(false);

                    Toast.show({
                      type: "success",
                      text1: "Item Added",
                      text2: `${item.name} was added to your reservation.`,
                    });
                  }}


                  >
                    <Text style={{ fontWeight: "700", color: "#000" }}>Select Item</Text>
                  </TouchableOpacity>

                </View>
              </View>
            ))}
          </ScrollView>
        )}

          {/* Close Button */}
          <TouchableOpacity
            style={{
              marginTop: 10,
              backgroundColor: "#E53935",
              padding: 12,
              borderRadius: 12
            }}
            onPress={() => setShowSuggestedModal(false)}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
  </LinearGradient>
);

}
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#4FC3F7" },
  header: { flexDirection: "row", alignItems: "center", paddingTop: 50, paddingHorizontal: 16, marginBottom: 10 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700", flex: 1, textAlign: "center", right: 15 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  imageWrapper: { alignItems: "center", marginBottom: 10 },
  itemImage: { width: 220, height: 220, borderRadius: 18, backgroundColor: "#fff", elevation: 6 },

  itemName: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 8, textAlign: "center" },
  itemOwner: { color: "#E0F7FA", textAlign: "center", marginBottom: 4 },
  itemDesc: { color: "#E0F7FA", marginBottom: 14, textAlign: "center" },

  dateRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    flex: 0.48,
    justifyContent: "center",
    elevation: 3,
  },
  backButton: { backgroundColor: "rgba(255,255,255,0.25)", padding: 8, borderRadius: 8 },
  dateText: { color: "#333", fontWeight: "600", marginLeft: 6 },
  availableText: { color: "#fff", textAlign: "center", marginVertical: 6 },

  qtyDisplay: {
    backgroundColor: "#FFD55A",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginBottom: 14,
  },
  qtyText: { color: "#333", fontWeight: "700" },

  uploadSection: { marginTop: 10, marginBottom: 20 },

  uploadCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#1976D2",
    padding: 14,
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  uploadTitle: { fontSize: 14, fontWeight: "700", color: "#1976D2", marginBottom: 2 },
  uploadHint: { fontSize: 12, color: "#555", fontStyle: "italic", lineHeight: 16 },
  uploadEmphasis: { color: "#E65100", fontWeight: "600" },

  preview: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
    marginTop: -2,
  },

  label: { color: "#fff", fontWeight: "600", marginBottom: 6 },

  priorityRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  pill: { borderWidth: 1, borderColor: "#ddd", backgroundColor: "#fff", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  pillSelected: { borderColor: "#FFC107", backgroundColor: "#FFF8E1" },
  pillText: { color: "#333", fontSize: 12, fontWeight: "600" },
  pillTextSelected: { color: "#E65100" },

  textArea: { backgroundColor: "#fff", borderRadius: 10, minHeight: 80, padding: 10, marginBottom: 15 },

  reserveBtn: { borderRadius: 10, overflow: "hidden", elevation: 5, marginBottom: 20 },
  reserveGradient: { paddingVertical: 16, alignItems: "center" },
  reserveText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  modalCard: { backgroundColor: "#fff", borderRadius: 20, padding: 16 },
  modalAvail: { textAlign: "center", fontWeight: "600", marginVertical: 8 },

  modalQtyInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    textAlign: "center",
    marginBottom: 12,
  },

  modalBtnRow: { flexDirection: "row", justifyContent: "space-between" },
  modalBtn: { flex: 0.48, borderRadius: 10, padding: 12 },
  modalBtnText: { color: "#fff", textAlign: "center", fontWeight: "600" },

  legendRow: { flexDirection: "row", justifyContent: "center", gap: 15, marginTop: 5 },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 5 },
  legendText: { fontSize: 13, color: "#333" },

  noticeCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  noticeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  noticeTitle: { fontSize: 20, fontWeight: "700", color: "#64B5F6", marginLeft: 8 },
  noticeSubtitle: { fontSize: 13, color: "#555", textAlign: "center", marginBottom: 12, lineHeight: 18 },

  noticeItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  noticeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#64B5F6", marginRight: 10, marginTop: 6 },
  noticeHeading: { fontWeight: "700", fontSize: 13.5, color: "#1976D2", marginBottom: 2 },
  noticeText: { color: "#444", fontSize: 13, lineHeight: 18 },

  noticeBtnRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  noticeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", flex: 0.48, paddingVertical: 10, borderRadius: 10, elevation: 2 },
  noticeCancelBtn: { backgroundColor: "#eee" },
  noticeContinueBtn: { backgroundColor: "#64B5F6" },
  noticeBtnText: { fontWeight: "600", fontSize: 14, marginLeft: 5 },

  priorityGroup: { marginBottom: 12 },
  priorityHeader: { color: "#fff", fontWeight: "700", marginBottom: 4, marginTop: 10, fontSize: 14 },

  priorityContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 15 },

  priorityPill: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#d8d8d8",
    justifyContent: "center",
    alignItems: "center",
  },

  priorityPillFull: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#d8d8d8",
    justifyContent: "center",
    alignItems: "center",
  },

  priorityPillSelected: { backgroundColor: "#FFF8E1", borderColor: "#FFB300" },
  priorityPillText: { fontSize: 13, fontWeight: "500", color: "#333" },
  priorityPillTextSelected: { color: "#E65100" },

  otherInput: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 8,
  },

  detailsContainer: {
  marginTop: 25,
  marginBottom: 25,
  alignItems: "center",
},

detailsTitle: {
  color: "#fff",
  fontSize: 20,
  fontWeight: "700",
  marginBottom: 15,
},

/* WHOLE CARD */
detailsBigCard: {
  width: "100%",
  backgroundColor: "#bce2f9",
  borderRadius: 18,
  padding: 20,
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 6,
  elevation: 6,
},

/* A SINGLE ROW (main item or added items) */
itemRow: {
  flexDirection: "row",
  alignItems: "flex-start",
  marginBottom: 18,
},

/* IMAGE LEFT */
detailsRowImage: {
  width: 110,
  height: 110,
  borderRadius: 18,
  backgroundColor: "#fff",
  marginRight: 15,
},

/* TEXT RIGHT SIDE */
detailsRight: {
  flex: 1,
},

mainItemName: {
  fontSize: 17,
  fontWeight: "700",
  color: "#0D47A1",
  marginBottom: 4,
},

detailsRowOwner: {
  fontSize: 14,
  color: "#1A237E",
  marginBottom: 4,
},

detailsRowDesc: {
  fontSize: 13,
  color: "#0D47A1",
  marginBottom: 10,
  lineHeight: 17,
},

/* Divider between rows */
itemDivider: {
  width: "100%",
  height: 1.4,
  backgroundColor: "#0D47A1",
  marginVertical: 10,
  borderRadius: 999,
},

/* MAIN ADD BUTTON (stays at top, never moves) */
addItemBtnMain: {
  marginTop: 8,
  backgroundColor: "#FFC107",
  paddingVertical: 9,
  paddingHorizontal: 15,
  borderRadius: 10,
  alignSelf: "flex-start",
  elevation: 2,
},

addItemBtnMainText: {
  color: "#000",
  fontWeight: "700",
  fontSize: 13,
},

/* COLUMN: QTY + REMOVE (aligned right) */
actionColumn: {
  flexDirection: "column",
  alignItems: "flex-end",
  justifyContent: "flex-start",
  marginTop: 5,
},

qtyInput: {
  backgroundColor: "#fff",
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#bbb",
  paddingVertical: 6,
  paddingHorizontal: 12,
  width: 75,
  marginBottom: 6,
},

removeBtn: {
  backgroundColor: "#E53935",
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 8,
},

removeBtnText: {
  color: "#fff",
  fontWeight: "700",
},



});

