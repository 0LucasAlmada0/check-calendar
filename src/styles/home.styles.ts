import { StyleSheet } from "react-native";

const PRIMARY_BLUE = "#2563eb";
const SOFT_BLUE = "#dbeafe";
const BG_BLUE = "#eff6ff";
const TEXT_DARK = "#1e3a8a";
const TEXT_MUTED = "#64748b";

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG_BLUE,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 18,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: TEXT_DARK,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: TEXT_MUTED,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 280,
  },
  infoCard: {
    backgroundColor: SOFT_BLUE,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  infoLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 28,
    fontWeight: "800",
    color: PRIMARY_BLUE,
  },
  calendarCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 18,
    color: TEXT_DARK,
    fontWeight: "600",
  },
  dayPressable: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  dayPressablePressed: {
    opacity: 0.78,
  },
  dayContainer: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleChecked: {
    backgroundColor: PRIMARY_BLUE,
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: PRIMARY_BLUE,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  dayNumberChecked: {
    color: "#ffffff",
    fontWeight: "700",
  },
  dayNumberToday: {
    color: PRIMARY_BLUE,
    fontWeight: "800",
  },
  dayNumberDisabled: {
    color: "#cbd5e1",
  },
  checkBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#86efac",
    alignItems: "center",
    justifyContent: "center",
  },
  checkIcon: {
    fontSize: 10,
    fontWeight: "900",
    color: "#065f46",
  },
});
