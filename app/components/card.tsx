import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function Card({ manga }: { manga: any }) {
  const [pressed, setPressed] = useState(false);
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/manga", params: manga })}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <View style={[styles.card, pressed && styles.cardPressed]}>
        {/* Cover image */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: manga?.img }}
            style={styles.cover}
            resizeMode="cover"
          />
        </View>
        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {manga?.title}
          </Text>
          <Text style={styles.summary} numberOfLines={4} ellipsizeMode="tail">
            {manga?.summary}
          </Text>
          <View style={styles.readRow}>
            <View style={styles.readBadge}>
              <Text style={styles.readBadgeText}>Read →</Text>
            </View>
          </View>
        </View>

        {/* Glass highlight line at top */}
        <View style={styles.topHighlight} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 7,
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.1)",
  },
  cardPressed: {
    backgroundColor: "rgba(167,139,250,0.1)",
    borderColor: "rgba(167,139,250,0.35)",
    transform: [{ scale: 0.985 }],
  },
  coverContainer: {
    position: "relative",
  },
  cover: {
    width: 110,
    height: 160,
  },
  coverFade: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 28,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  title: {
    color: "#e8e0ff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
    lineHeight: 20,
    marginBottom: 6,
  },
  summary: {
    color: "#6b5f8c",
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  readRow: {
    marginTop: 8,
    flexDirection: "row",
  },
  readBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(167,139,250,0.12)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  readBadgeText: {
    color: "#a78bfa",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});
