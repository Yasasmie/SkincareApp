import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MotionView } from "../../components/MotionView";
import { useAppTheme } from "../../components/ThemeProvider";
import { AppColors, RADIUS, SPACING } from "../../constants/theme";
import {
  clearCurrentUserNotifications,
  deleteNotification,
  getCurrentUserNotifications,
  markNotificationAsRead,
  type UserNotification,
} from "../../services/notificationService";

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const unreadCount = notifications.filter((item) => !item.read).length;

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setNotifications(await getCurrentUserNotifications());
    } catch (error) {
      console.error("[Notifications] Failed to load:", error);
      Alert.alert("Error", "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  const handleNotificationPress = async (item: UserNotification) => {
    try {
      if (item.id && !item.read) {
        await markNotificationAsRead(item.id);
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === item.id
              ? { ...notification, read: true }
              : notification,
          ),
        );
      }

      if (item.consultationId) {
        router.push({
          pathname: "/dashboard/consultation",
          params: { consultationId: item.consultationId },
        });
        return;
      }

      await loadNotifications();
    } catch {
      Alert.alert("Error", "Failed to open notification.");
    }
  };

  const handleDeleteNotification = async (item: UserNotification) => {
    if (!item.id) return;

    try {
      await deleteNotification(item.id);
      setNotifications((current) =>
        current.filter((notification) => notification.id !== item.id),
      );
    } catch (error) {
      console.error("[Notifications] Delete failed:", error);
      Alert.alert("Error", "Failed to clear notification.");
    }
  };

  const handleClearAll = async () => {
    if (!notifications.length) {
      return;
    }

    Alert.alert(
      "Clear Notifications",
      "Remove all notifications from your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await clearCurrentUserNotifications();
                setNotifications([]);
              } catch (error) {
                console.error("[Notifications] Clear all failed:", error);
                Alert.alert("Error", "Failed to clear notifications.");
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <MotionView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => void handleClearAll()}
          disabled={!notifications.length}
          style={!notifications.length ? styles.clearButtonDisabled : undefined}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </MotionView>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id || item.createdAt.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.card, !item.read && styles.cardUnread]}>
              <TouchableOpacity onPress={() => void handleNotificationPress(item)}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {!item.read ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.cardMessage}>{item.message}</Text>
                <Text style={styles.cardDate}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => void handleDeleteNotification(item)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
                <Text style={[styles.deleteButtonText, { color: colors.error }]}>
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>
                When a dermatologist replies to your consultation, it will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: SPACING.l,
      paddingTop: SPACING.l,
      paddingBottom: SPACING.m,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
    },
    headerSubtitle: {
      marginTop: 2,
      fontSize: 12,
      color: colors.textSecondary,
    },
    clearButtonText: {
      color: colors.primary,
      fontWeight: "700",
      minWidth: 40,
      textAlign: "right",
    },
    clearButtonDisabled: {
      opacity: 0.35,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    listContent: {
      padding: SPACING.l,
      paddingBottom: SPACING.xl,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.m,
      padding: SPACING.m,
      marginBottom: SPACING.m,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardUnread: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "08",
    },
    cardTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      flex: 1,
      paddingRight: SPACING.s,
    },
    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    cardMessage: {
      marginTop: SPACING.s,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    cardDate: {
      marginTop: SPACING.m,
      color: colors.textSecondary,
      fontSize: 12,
    },
    deleteButton: {
      marginTop: SPACING.m,
      paddingTop: SPACING.m,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: SPACING.s,
    },
    deleteButtonText: {
      fontSize: 13,
      fontWeight: "600",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
    },
    emptyTitle: {
      marginTop: SPACING.m,
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    emptyText: {
      marginTop: SPACING.s,
      textAlign: "center",
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });
