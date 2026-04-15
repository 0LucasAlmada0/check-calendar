import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  Calendar,
  LocaleConfig,
  type DateData,
} from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "../src/styles/home.styles";

type MarkedDates = Record<string, { checked: true }>;

type EasterEggState = {
  count: number;
  dateString: string | null;
};

type DayCellProps = {
  date: DateData;
  isChecked: boolean;
  isToday: boolean;
  isDisabled: boolean;
  onPress: (day: DateData) => void;
};

const STORAGE_KEY = "@check_calendar_dates";
const EASTER_EGG_TRIGGER_COUNT = 5;

LocaleConfig.locales["pt-br"] = {
  monthNames: [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ],
  monthNamesShort: [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ],
  dayNames: [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ],
  dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  today: "Hoje",
};

LocaleConfig.defaultLocale = "pt-br";

function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isSpecialDate(dateString: string): boolean {
  return dateString.endsWith("-02-01") || dateString.endsWith("-08-01");
}

function showSpecialMessage(dateString: string): void {
  if (dateString.endsWith("-02-01")) {
    Alert.alert(
      "JoyCheck",
      "\u{1F499} Foi aqui que tudo começou.\nTe amo muito!"
    );
    return;
  }

  if (dateString.endsWith("-08-01")) {
    Alert.alert(
      "JoyCheck",
      "O dia que te conheci mudou tudo.\nSou muito feliz com você \u{1F499}."
    );
  }
}

function DayCell({
  date,
  isChecked,
  isToday,
  isDisabled,
  onPress,
}: DayCellProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function runPopAnimation(): void {
    scale.stopAnimation();
    scale.setValue(1);

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 65,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function handlePress(): void {
    runPopAnimation();
    onPress(date);
  }

  return (
    <Pressable
      accessibilityLabel={`Dia ${date.day}`}
      accessibilityRole="button"
      hitSlop={6}
      onPress={handlePress}
      style={({ pressed }): StyleProp<ViewStyle> => [
        styles.dayPressable,
        pressed && styles.dayPressablePressed,
      ]}
    >
      <Animated.View
        style={[
          styles.dayContainer,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <View
          style={[
            styles.dayCircle,
            isChecked && styles.dayCircleChecked,
            isToday && !isChecked && styles.dayCircleToday,
            isToday && isChecked && styles.dayCircleTodayChecked,
          ]}
        >
          <Text
            style={[
              styles.dayNumber,
              isDisabled && styles.dayNumberDisabled,
              isToday && styles.dayNumberToday,
              isChecked && styles.dayNumberChecked,
              isToday && isChecked && styles.dayNumberTodayChecked,
            ]}
          >
            {date.day}
          </Text>

          {isChecked && (
            <View style={styles.checkBadge}>
              <Text style={styles.checkIcon}>{"\u2713"}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function Index() {
  const [todayString] = useState(getTodayDateString);
  const [visibleMonthString, setVisibleMonthString] = useState(todayString);
  const [checkedDates, setCheckedDates] = useState<MarkedDates>({});
  const [isLoading, setIsLoading] = useState(true);
  const [, setEasterEgg] = useState<EasterEggState>({
    count: 0,
    dateString: null,
  });
  const infoCardAnimation = useRef(new Animated.Value(1)).current;
  const hasAnimatedInfoCard = useRef(false);

  const visibleMonthPrefix = visibleMonthString.slice(0, 7);
  const totalChecked = Object.keys(checkedDates).length;
  const checkedInVisibleMonth = Object.keys(checkedDates).filter((dateString) =>
    dateString.startsWith(visibleMonthPrefix)
  ).length;
  const infoCardOpacity = infoCardAnimation.interpolate({
    inputRange: [0.992, 1],
    outputRange: [0.95, 1],
  });

  useEffect(() => {
    void loadCheckedDates();
  }, []);

  useEffect(() => {
    if (!hasAnimatedInfoCard.current) {
      hasAnimatedInfoCard.current = true;
      return;
    }

    infoCardAnimation.stopAnimation();
    infoCardAnimation.setValue(0.992);

    Animated.spring(infoCardAnimation, {
      toValue: 1,
      friction: 8,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [checkedInVisibleMonth, infoCardAnimation, totalChecked]);

  async function loadCheckedDates(): Promise<void> {
    try {
      const storedDates = await AsyncStorage.getItem(STORAGE_KEY);

      if (storedDates) {
        setCheckedDates(JSON.parse(storedDates) as MarkedDates);
      }
    } catch (error) {
      console.log("Erro ao carregar datas:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSpecialDatePress(dateString: string): void {
    if (!isSpecialDate(dateString)) {
      setEasterEgg({ count: 0, dateString: null });
      return;
    }

    setEasterEgg((currentState) => {
      const nextCount =
        currentState.dateString === dateString ? currentState.count + 1 : 1;

      if (nextCount >= EASTER_EGG_TRIGGER_COUNT) {
        showSpecialMessage(dateString);
        return { count: 0, dateString: null };
      }

      return {
        count: nextCount,
        dateString,
      };
    });
  }

  async function handleDayPress(day: DateData): Promise<void> {
    const selectedDate = day.dateString;

    handleSpecialDatePress(selectedDate);

    const updatedDates: MarkedDates = { ...checkedDates };

    if (updatedDates[selectedDate]) {
      delete updatedDates[selectedDate];
    } else {
      updatedDates[selectedDate] = { checked: true };
    }

    setCheckedDates(updatedDates);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDates));
    } catch (error) {
      console.log("Erro ao salvar datas:", error);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View pointerEvents="none" style={styles.backgroundLayer}>
          <View style={styles.backgroundTopFade} />
          <View style={styles.backgroundBottomFade} />
          <View style={styles.backgroundOrbPrimary} />
          <View style={styles.backgroundOrbSecondary} />
        </View>

        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>Carregando calendário...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <View style={styles.backgroundTopFade} />
        <View style={styles.backgroundBottomFade} />
        <View style={styles.backgroundOrbPrimary} />
        <View style={styles.backgroundOrbSecondary} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>{"\u{1F499}"}</Text>
          <Text style={styles.title}>Meu calendário de checks</Text>
          <Text style={styles.subtitle}>
            Toque em um dia para marcar o que foi concluído.
          </Text>
        </View>

        <Animated.View
          style={[
            styles.infoCard,
            {
              opacity: infoCardOpacity,
              transform: [{ scale: infoCardAnimation }],
            },
          ]}
        >
          <View style={styles.infoGrid}>
            <View style={styles.infoMetric}>
              <Text style={styles.infoLabel}>Total de dias</Text>
              <Text style={styles.infoValue}>{totalChecked}</Text>
            </View>

            <View style={styles.infoMetric}>
              <Text style={styles.infoLabel}>No mês exibido</Text>
              <Text style={styles.infoValue}>{checkedInVisibleMonth}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.calendarCard}>
          <Calendar
            current={todayString}
            enableSwipeMonths
            firstDay={0}
            hideExtraDays={false}
            onDayPress={handleDayPress}
            onMonthChange={(month) => {
              setVisibleMonthString(month.dateString);
            }}
            theme={{
              arrowColor: "#2563eb",
              calendarBackground: "#ffffff",
              monthTextColor: "#1e3a8a",
              textDayHeaderFontSize: 13,
              textDayHeaderFontWeight: "600",
              textMonthFontSize: 22,
              textMonthFontWeight: "700",
              textSectionTitleColor: "#64748b",
            }}
            dayComponent={({ date, state }) => {
              if (!date || typeof date.day !== "number") {
                return null;
              }

              const dateString = date.dateString;

              return (
                <DayCell
                  key={dateString}
                  date={date}
                  isChecked={Boolean(checkedDates[dateString])}
                  isDisabled={state === "disabled"}
                  isToday={dateString === todayString}
                  onPress={(pressedDay) => {
                    void handleDayPress(pressedDay);
                  }}
                />
              );
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
