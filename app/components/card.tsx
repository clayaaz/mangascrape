import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

export default function Card({ manga }: { manga: any }) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/manga", params: manga })}
      onPressIn={() => setIsHovered(true)}
      onPressOut={() => setIsHovered(false)}
    >
      <View
        style={{
          padding: 10,
          flexDirection: "row",
          backgroundColor: isHovered ? "#5a5a5a" : "#fff",
          flex: 1,
          borderBottomWidth: 1,
        }}
      >
        <Image
          source={{ uri: manga?.img }}
          style={{ width: 100, height: 142 }}
        ></Image>
        <View
          style={{
            flexDirection: "column",
            marginLeft: 10,
            flex: 1,
          }}
        >
          <Text style={{ fontWeight: "bold" }}>{manga?.title}</Text>
          <Text
            style={{
              fontSize: 12,
            }}
            numberOfLines={5}
            ellipsizeMode="tail"
          >
            {manga?.summary}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
