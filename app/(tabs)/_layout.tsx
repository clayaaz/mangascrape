import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function HomeIcon({ focused }: { focused: boolean }) {
  return (
    <Text style={[styles.iconText, focused && styles.iconTextActive]}>⌂</Text>
  );
}

function HistoryIcon({ focused }: { focused: boolean }) {
  return (
    <Text style={[styles.iconText, focused && styles.iconTextActive]}>◷</Text>
  );
}

function TabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBarOuter,
        // Reserve safe area at the bottom so the bar clears the home indicator
        { paddingBottom: insets.bottom },
      ]}
    >
      {/* Top glass highlight line */}
      <View style={styles.topBorder} />

      <BlurView
        intensity={70}
        tint="dark"
        style={[
          styles.tabBarBlur,
          Platform.OS === "android" && styles.tabBarAndroid,
        ]}
      >
        <View style={styles.tabRow}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.75}
                style={styles.tab}
              >
                <View
                  style={[styles.tabInner, focused && styles.tabInnerActive]}
                >
                  {options.tabBarIcon?.({ focused })}
                  <Text
                    style={[styles.tabLabel, focused && styles.tabLabelActive]}
                  >
                    {options.tabBarLabel ?? route.name}
                  </Text>
                </View>

                {focused && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Tells the navigator the tab bar exists in normal flow — no overlap
        tabBarStyle: { display: "flex" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Browse",
          tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarLabel: "History",
          tabBarIcon: ({ focused }) => <HistoryIcon focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Sits in normal document flow — NOT absolute positioned
  tabBarOuter: {
    backgroundColor: "#08080C",
    borderTopWidth: 0,
  },
  topBorder: {
    height: 1,
    backgroundColor: "rgba(167,139,250,0.12)",
  },
  tabBarBlur: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.18)",
  },
  tabBarAndroid: {
    backgroundColor: "rgba(10,9,18,0.96)",
  },
  tabRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  tabInner: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 3,
  },
  tabInnerActive: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 3,
    backgroundColor: "rgba(167,139,250,0.14)",
  },
  iconText: {
    fontSize: 20,
    color: "#4a4060",
  },
  iconTextActive: {
    color: "#a78bfa",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#4a4060",
  },
  tabLabelActive: {
    color: "#c4b5fd",
  },
  activeDot: {
    position: "absolute",
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#a78bfa",
  },
});
