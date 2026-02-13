import { BlurView } from "expo-blur";
import { Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Loader from "./components/loader";

function changeUrl(name: string) {
  let url = "https://mangakatana.com/";
  if (name) {
    url += `?search=${encodeURIComponent(name)}&search_by=m_name`;
  } else {
    url += "page/1";
  }
  return url;
}

export default function Index() {
  const [term, setTerm] = useState("");
  const [url, setUrl] = useState("https://mangakatana.com/");
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchedTerm, setSearchedTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  // Header height: status bar + nav bar (~44px iOS / ~56px Android)
  const NAV_BAR_HEIGHT = Platform.OS === "ios" ? 44 : 56;
  const headerBottom = insets.top + NAV_BAR_HEIGHT;

  const handleSearch = () => {
    setSearchedTerm(term);
    setUrl(changeUrl(term));
    setRefreshKey((k) => k + 1);
    setLoading(true);
  };

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          headerTitle: () => null,
          headerLeft: () => (
            <Text style={styles.headerBrand}>
              <Text style={styles.headerBrandAccent}>M</Text>ANGA IKUZO
            </Text>
          ),
          headerRight: () => null,
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
        }}
      />

      {/* Search bar — sits flush below the transparent nav header */}
      <View style={[styles.searchWrapper, { marginTop: headerBottom }]}>
        <BlurView
          intensity={60}
          tint="dark"
          style={[
            styles.searchBlur,
            Platform.OS === "android" && styles.searchBlurAndroid,
          ]}
        >
          <View style={styles.searchRow}>
            <TextInput
              value={term}
              onChangeText={setTerm}
              placeholder="Search titles..."
              placeholderTextColor="#5a5272"
              style={styles.input}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              selectionColor="#a78bfa"
            />
            <Pressable
              onPress={handleSearch}
              style={({ pressed }) => [
                styles.searchBtn,
                pressed && styles.searchBtnPressed,
              ]}
            >
              <Text style={styles.searchBtnText}>Search</Text>
            </Pressable>
          </View>
        </BlurView>
        <View style={styles.searchBorderBottom} />
      </View>

      {searchedTerm ? (
        <View style={styles.resultsBadgeRow}>
          <Text style={styles.resultsBadge}>
            Results for{" "}
            <Text style={styles.resultsBadgeAccent}>"{searchedTerm}"</Text>
          </Text>
        </View>
      ) : (
        <View style={styles.resultsBadgeRow}>
          <Text style={styles.resultsBadge}>
            <Text style={styles.resultsBadgeAccent}>Trending</Text> this week
          </Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#a78bfa" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      <Loader
        key={refreshKey}
        url={url}
        onLoadComplete={() => setLoading(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#08080C",
  },
  headerBrand: {
    fontSize: 22,
    fontWeight: "800",
    color: "#e8e0ff",
    letterSpacing: 4,
    marginLeft: 4,
  },
  headerBrandAccent: {
    color: "#a78bfa",
  },
  searchWrapper: {
    zIndex: 10,
  },
  searchBlur: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBlurAndroid: {
    backgroundColor: "rgba(14,13,22,0.95)",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 16,
    color: "#e8e0ff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    letterSpacing: 0.3,
  },
  searchBtn: {
    backgroundColor: "rgba(167,139,250,0.18)",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.45)",
  },
  searchBtnPressed: {
    backgroundColor: "rgba(167,139,250,0.35)",
    borderColor: "rgba(167,139,250,0.8)",
  },
  searchBtnText: {
    color: "#c4b5fd",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.4,
  },
  searchBorderBottom: {
    height: 1,
    backgroundColor: "rgba(167,139,250,0.12)",
  },
  resultsBadgeRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  resultsBadge: {
    color: "#6b5f8c",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  resultsBadgeAccent: {
    color: "#a78bfa",
    fontWeight: "700",
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  loadingText: {
    color: "#5a4e7a",
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
