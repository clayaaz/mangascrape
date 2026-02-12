import { Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Button, Text, TextInput, View } from "react-native";
import Loader from "./components/loader";

function changeUrl(name: string) {
  let url = "https://mangakatana.com/";
  if (name) {
    url += `?search=${encodeURIComponent(name)}&search_by=m_name`;
  } else if (name === "") {
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

  const handleSearch = () => {
    setSearchedTerm(term);
    setUrl(changeUrl(term));
    setRefreshKey((k) => k + 1);
    setLoading(true);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={{ alignItems: "center" }}>
              <Text
                style={{ fontWeight: "bold", fontSize: 16, marginBottom: 4 }}
              >
                Manga Reader
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingBottom: 4,
                }}
              >
                <TextInput
                  value={term}
                  onChangeText={setTerm}
                  placeholder="Search manga..."
                  style={{
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderColor: "#ccc",
                    borderWidth: 1,
                    width: 200,
                    height: 40,
                  }}
                />
                <Button title="Search" onPress={handleSearch} />
              </View>
            </View>
          ),
        }}
      />
      {searchedTerm && (
        <Text style={{ textAlign: "center", margin: 10 }}>
          Search results for: {searchedTerm}
        </Text>
      )}
      {loading && (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" />
        </View>
      )}
      <Loader
        key={refreshKey}
        url={url}
        onLoadComplete={() => setLoading(false)}
      />
    </>
  );
}
