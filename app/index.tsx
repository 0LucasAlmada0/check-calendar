import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  Calendar,
  LocaleConfig,
  type DateData,
} from "react-native-calendars";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { styles } from "../src/styles/home.styles";

type CalendarDateData = {
  checked?: boolean;
  note?: string;
  emoji?: string;
};

type CalendarDates = Record<string, CalendarDateData>;

type HabitCategory = {
  id: string;
  name: string;
  emoji?: string;
  entries: CalendarDates;
};

type AppData = {
  categories: HabitCategory[];
  selectedCategoryId?: string;
};

type EasterEggState = {
  count: number;
  dateString: string | null;
};

type DayCellProps = {
  date: DateData;
  isChecked: boolean;
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
  emoji?: string;
  onPress: (day: DateData) => void;
  onLongPress: (day: DateData) => void;
};

type CategoryFormMode = "create" | "edit" | null;

const STORAGE_KEY = "@check_calendar_dates";
const EASTER_EGG_TRIGGER_COUNT = 5;
const DAY_EMOJI_OPTIONS = ["✅", "❌", "⭐", "💪", "💙"];
const DEFAULT_CATEGORIES: HabitCategory[] = [
  {
    id: "geral",
    name: "Geral",
    entries: {},
  },
];

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

function normalizeCalendarDates(storedDates: unknown): CalendarDates {
  if (!storedDates || typeof storedDates !== "object") {
    return {};
  }

  return Object.entries(storedDates as Record<string, unknown>).reduce(
    (normalizedDates, [dateString, rawValue]) => {
      if (!rawValue || typeof rawValue !== "object") {
        return normalizedDates;
      }

      const value = rawValue as Partial<CalendarDateData>;
      const checked = Boolean(value.checked);
      const note = typeof value.note === "string" ? value.note : "";
      const emoji = typeof value.emoji === "string" ? value.emoji : undefined;

      if (checked || note.trim().length > 0 || emoji) {
        normalizedDates[dateString] = {
          ...(checked ? { checked } : {}),
          ...(note.trim().length > 0 ? { note } : {}),
          ...(emoji ? { emoji } : {}),
        };
      }

      return normalizedDates;
    },
    {} as CalendarDates
  );
}

function createDefaultCategories(firstCategoryEntries: CalendarDates = {}) {
  return DEFAULT_CATEGORIES.map((category, index) => ({
    ...category,
    entries: index === 0 ? firstCategoryEntries : {},
  }));
}

function createCategoryId(name: string, existingCategories: HabitCategory[]) {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const baseId = slug.length > 0 ? slug : "categoria";
  let nextId = baseId;
  let suffix = 2;

  while (existingCategories.some((category) => category.id === nextId)) {
    nextId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return nextId;
}

function normalizeCategory(rawCategory: unknown): HabitCategory | null {
  if (!rawCategory || typeof rawCategory !== "object") {
    return null;
  }

  const category = rawCategory as Partial<HabitCategory>;

  if (typeof category.id !== "string" || typeof category.name !== "string") {
    return null;
  }

  return {
    id: category.id,
    name: category.name,
    ...(typeof category.emoji === "string" ? { emoji: category.emoji } : {}),
    entries: normalizeCalendarDates(category.entries),
  };
}

function normalizeAppData(storedData: unknown): AppData {
  if (!storedData || typeof storedData !== "object") {
    return {
      categories: createDefaultCategories(),
      selectedCategoryId: DEFAULT_CATEGORIES[0].id,
    };
  }

  const data = storedData as Partial<AppData>;

  if (Array.isArray(data.categories)) {
    const categories = data.categories
      .map(normalizeCategory)
      .filter((category): category is HabitCategory => Boolean(category));

    if (categories.length > 0) {
      const selectedCategoryId = categories.some(
        (category) => category.id === data.selectedCategoryId
      )
        ? data.selectedCategoryId
        : categories[0].id;

      return {
        categories,
        selectedCategoryId,
      };
    }
  }

  const migratedEntries = normalizeCalendarDates(storedData);

  return {
    categories: createDefaultCategories(migratedEntries),
    selectedCategoryId: DEFAULT_CATEGORIES[0].id,
  };
}

function formatSelectedDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function DayCell({
  date,
  isChecked,
  isSelected,
  isToday,
  isDisabled,
  emoji,
  onPress,
  onLongPress,
}: DayCellProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const didLongPress = useRef(false);

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
    if (didLongPress.current) {
      didLongPress.current = false;
      return;
    }

    runPopAnimation();
    onPress(date);
  }

  function handleLongPress(): void {
    didLongPress.current = true;
    runPopAnimation();
    onLongPress(date);
  }

  return (
    <Pressable
      accessibilityLabel={`Dia ${date.day}`}
      accessibilityRole="button"
      delayLongPress={360}
      hitSlop={6}
      onLongPress={handleLongPress}
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
            isSelected && !isChecked && styles.dayCircleSelected,
            isSelected && isChecked && styles.dayCircleCheckedSelected,
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

        {emoji && (
          <View style={styles.dayEmojiBadge}>
            <Text style={styles.dayEmojiText}>{emoji}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function Index() {
  const insets = useSafeAreaInsets();
  const [todayString] = useState(getTodayDateString);
  const [visibleMonthString, setVisibleMonthString] = useState(todayString);
  const [calendarResetKey, setCalendarResetKey] = useState(0);
  const [categories, setCategories] = useState<HabitCategory[]>(
    createDefaultCategories
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    DEFAULT_CATEGORIES[0].id
  );
  const [categoryFormMode, setCategoryFormMode] =
    useState<CategoryFormMode>(null);
  const [categoryNameDraft, setCategoryNameDraft] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [selectedDateString, setSelectedDateString] = useState<string | null>(
    null
  );
  const [noteText, setNoteText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [, setEasterEgg] = useState<EasterEggState>({
    count: 0,
    dateString: null,
  });
  const infoCardAnimation = useRef(new Animated.Value(1)).current;
  const notesCardAnimation = useRef(new Animated.Value(0)).current;
  const hasAnimatedInfoCard = useRef(false);

  const visibleMonthPrefix = visibleMonthString.slice(0, 7);
  const isViewingCurrentMonth = visibleMonthPrefix === todayString.slice(0, 7);
  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ??
    categories[0];
  const selectedCategoryEntries = selectedCategory?.entries ?? {};
  const checkedDateEntries = Object.entries(selectedCategoryEntries).filter(
    ([, value]) => value.checked
  );
  const totalChecked = checkedDateEntries.length;
  const checkedInVisibleMonth = checkedDateEntries.filter(([dateString]) =>
    dateString.startsWith(visibleMonthPrefix)
  ).length;
  const selectedDateLabel = selectedDateString
    ? formatSelectedDate(selectedDateString)
    : "";
  const selectedDateEmoji = selectedDateString
    ? selectedCategoryEntries[selectedDateString]?.emoji
    : undefined;
  const bottomSafeSpacing = Math.max(insets.bottom + 12, 20);
  const notesCardOpacity = notesCardAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const notesCardTranslateY = notesCardAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
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

  useEffect(() => {
    if (!selectedDateString) {
      notesCardAnimation.setValue(0);
      return;
    }

    notesCardAnimation.setValue(0);

    Animated.timing(notesCardAnimation, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [notesCardAnimation, selectedDateString]);

  async function loadCheckedDates(): Promise<void> {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);

      if (storedData) {
        const normalizedData = normalizeAppData(JSON.parse(storedData));

        setCategories(normalizedData.categories);
        setSelectedCategoryId(
          normalizedData.selectedCategoryId ?? normalizedData.categories[0].id
        );
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

  async function saveAppData(updatedData: AppData): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    } catch (error) {
      console.log("Erro ao salvar datas:", error);
    }
  }

  async function handleCategoryPress(categoryId: string): Promise<void> {
    const nextCategory = categories.find(
      (category) => category.id === categoryId
    );

    if (!nextCategory) {
      return;
    }

    setSelectedCategoryId(categoryId);
    setNoteText(
      selectedDateString
        ? nextCategory.entries[selectedDateString]?.note ?? ""
        : ""
    );

    await saveAppData({
      categories,
      selectedCategoryId: categoryId,
    });
  }

  function closeCategoryForm(): void {
    setCategoryFormMode(null);
    setCategoryNameDraft("");
    setEditingCategoryId(null);
  }

  function handleNewCategoryPress(): void {
    setCategoryFormMode("create");
    setCategoryNameDraft("");
    setEditingCategoryId(null);
  }

  function handleEditCategoryPress(category: HabitCategory): void {
    setCategoryFormMode("edit");
    setCategoryNameDraft(category.name);
    setEditingCategoryId(category.id);
  }

  function handleCategoryLongPress(category: HabitCategory): void {
    Alert.alert(category.name, "O que deseja fazer com esta categoria?", [
      {
        text: "Renomear",
        onPress: () => {
          handleEditCategoryPress(category);
        },
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          handleDeleteCategoryPress(category);
        },
      },
      {
        text: "Cancelar",
        style: "cancel",
      },
    ]);
  }

  async function handleSaveCategoryPress(): Promise<void> {
    const trimmedName = categoryNameDraft.trim();

    if (!trimmedName) {
      Alert.alert("JoyCheck", "Digite um nome para a categoria.");
      return;
    }

    if (categoryFormMode === "create") {
      const newCategory: HabitCategory = {
        id: createCategoryId(trimmedName, categories),
        name: trimmedName,
        entries: {},
      };
      const updatedCategories = [...categories, newCategory];

      setCategories(updatedCategories);
      setSelectedCategoryId(newCategory.id);
      setNoteText("");
      closeCategoryForm();

      await saveAppData({
        categories: updatedCategories,
        selectedCategoryId: newCategory.id,
      });

      return;
    }

    if (categoryFormMode === "edit" && editingCategoryId) {
      const updatedCategories = categories.map((category) =>
        category.id === editingCategoryId
          ? {
              ...category,
              name: trimmedName,
            }
          : category
      );

      setCategories(updatedCategories);
      closeCategoryForm();

      await saveAppData({
        categories: updatedCategories,
        selectedCategoryId,
      });
    }
  }

  function handleDeleteCategoryPress(category: HabitCategory): void {
    if (categories.length <= 1) {
      Alert.alert("JoyCheck", "Mantenha pelo menos uma categoria.");
      return;
    }

    Alert.alert(
      "Excluir categoria",
      `Excluir "${category.name}" também remove seus checks e anotações.`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            void deleteCategory(category.id);
          },
        },
      ]
    );
  }

  async function deleteCategory(categoryId: string): Promise<void> {
    const updatedCategories = categories.filter(
      (category) => category.id !== categoryId
    );
    const nextSelectedCategoryId =
      selectedCategoryId === categoryId
        ? updatedCategories[0].id
        : selectedCategoryId;
    const nextSelectedCategory = updatedCategories.find(
      (category) => category.id === nextSelectedCategoryId
    );

    setCategories(updatedCategories);
    setSelectedCategoryId(nextSelectedCategoryId);
    setNoteText(
      selectedDateString && nextSelectedCategory
        ? nextSelectedCategory.entries[selectedDateString]?.note ?? ""
        : ""
    );

    if (editingCategoryId === categoryId) {
      closeCategoryForm();
    }

    await saveAppData({
      categories: updatedCategories,
      selectedCategoryId: nextSelectedCategoryId,
    });
  }

  async function handleDayPress(day: DateData): Promise<void> {
    const selectedDate = day.dateString;
    const currentDateData = selectedCategoryEntries[selectedDate];

    handleSpecialDatePress(selectedDate);

    const updatedEntries: CalendarDates = { ...selectedCategoryEntries };

    if (currentDateData?.checked) {
      const updatedDateData = {
        note: currentDateData.note,
        emoji: currentDateData.emoji,
      };

      if (
        (updatedDateData.note ?? "").trim().length > 0 ||
        updatedDateData.emoji
      ) {
        updatedEntries[selectedDate] = updatedDateData;
      } else {
        delete updatedEntries[selectedDate];
      }
    } else {
      updatedEntries[selectedDate] = {
        checked: true,
        note: currentDateData?.note ?? "",
        emoji: currentDateData?.emoji,
      };
    }

    const updatedCategories = categories.map((category) =>
      category.id === selectedCategoryId
        ? {
            ...category,
            entries: updatedEntries,
          }
        : category
    );

    setCategories(updatedCategories);
    await saveAppData({
      categories: updatedCategories,
      selectedCategoryId,
    });
  }

  function handleDayLongPress(day: DateData): void {
    const selectedDate = day.dateString;
    const currentDateData = selectedCategoryEntries[selectedDate];

    setSelectedDateString(selectedDate);
    setNoteText(currentDateData?.note ?? "");
  }

  function handleCloseNotesPress(): void {
    setSelectedDateString(null);
    setNoteText("");
  }

  function handleTodayPress(): void {
    setVisibleMonthString(todayString);
    setCalendarResetKey((currentKey) => currentKey + 1);
  }

  async function updateSelectedDateEntry(
    entryChanges: Partial<CalendarDateData>
  ): Promise<void> {
    if (!selectedDateString) {
      return;
    }

    const currentDateData = selectedCategoryEntries[selectedDateString];
    const updatedEntries: CalendarDates = { ...selectedCategoryEntries };
    const updatedDateData = {
      checked: currentDateData?.checked ?? false,
      note: currentDateData?.note,
      emoji: currentDateData?.emoji,
      ...entryChanges,
    };

    if (
      updatedDateData.checked ||
      (updatedDateData.note ?? "").trim().length > 0 ||
      updatedDateData.emoji
    ) {
      updatedEntries[selectedDateString] = updatedDateData;
    } else {
      delete updatedEntries[selectedDateString];
    }

    const updatedCategories = categories.map((category) =>
      category.id === selectedCategoryId
        ? {
            ...category,
            entries: updatedEntries,
          }
        : category
    );

    setCategories(updatedCategories);
    await saveAppData({
      categories: updatedCategories,
      selectedCategoryId,
    });
  }

  async function handleNoteChange(text: string): Promise<void> {
    setNoteText(text);
    await updateSelectedDateEntry({ note: text });
  }

  async function handleEmojiPress(emoji: string): Promise<void> {
    const nextEmoji = selectedDateEmoji === emoji ? undefined : emoji;

    await updateSelectedDateEntry({ emoji: nextEmoji });
  }

  async function handleRemoveEmojiPress(): Promise<void> {
    await updateSelectedDateEntry({ emoji: undefined });
  }

  if (isLoading) {
    return (
      <SafeAreaView
        edges={["top", "right", "bottom", "left"]}
        style={styles.screen}
      >
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
    <SafeAreaView
      edges={["top", "right", "bottom", "left"]}
      style={styles.screen}
    >
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <View style={styles.backgroundTopFade} />
        <View style={styles.backgroundBottomFade} />
        <View style={styles.backgroundOrbPrimary} />
        <View style={styles.backgroundOrbSecondary} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.contentScroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: bottomSafeSpacing,
            },
          ]}
        >
        <View style={styles.header}>
          <Text style={styles.emoji}>{"\u{1F499}"}</Text>
          <Text style={styles.title}>Meu calendário de checks</Text>
          <Text style={styles.subtitle}>
            Toque em um dia para marcar o que foi concluído.
          </Text>
        </View>

        <View style={styles.categoryTabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabsContent}
          >
            {categories.map((category) => {
              const isActive = category.id === selectedCategoryId;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={category.id}
                  onPress={() => {
                    void handleCategoryPress(category.id);
                  }}
                  onLongPress={() => {
                    handleCategoryLongPress(category);
                  }}
                  style={({ pressed }): StyleProp<ViewStyle> => [
                    styles.categoryChip,
                    isActive && styles.categoryChipActive,
                    pressed && styles.categoryChipPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isActive && styles.categoryChipTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              accessibilityRole="button"
              onPress={handleNewCategoryPress}
              style={({ pressed }): StyleProp<ViewStyle> => [
                styles.categoryChip,
                styles.categoryChipNew,
                pressed && styles.categoryChipPressed,
              ]}
            >
              <Text style={styles.categoryChipNewText}>+ Nova</Text>
            </Pressable>
          </ScrollView>
        </View>

        {categoryFormMode && (
          <View style={styles.categoryForm}>
            <TextInput
              autoFocus
              onChangeText={setCategoryNameDraft}
              placeholder="Nome da categoria"
              placeholderTextColor="#94a3b8"
              style={styles.categoryInput}
              value={categoryNameDraft}
            />

            <View style={styles.categoryFormActions}>
              <Pressable
                accessibilityRole="button"
                onPress={closeCategoryForm}
                style={({ pressed }): StyleProp<ViewStyle> => [
                  styles.categoryActionButton,
                  styles.categoryActionButtonSecondary,
                  pressed && styles.categoryChipPressed,
                ]}
              >
                <Text style={styles.categoryActionButtonSecondaryText}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void handleSaveCategoryPress();
                }}
                style={({ pressed }): StyleProp<ViewStyle> => [
                  styles.categoryActionButton,
                  styles.categoryActionButtonPrimary,
                  pressed && styles.categoryChipPressed,
                ]}
              >
                <Text style={styles.categoryActionButtonPrimaryText}>
                  Salvar
                </Text>
              </Pressable>
            </View>
          </View>
        )}

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

        {!isViewingCurrentMonth && (
          <View style={styles.calendarToolbar}>
            <Pressable
              accessibilityRole="button"
              onPress={handleTodayPress}
              style={({ pressed }): StyleProp<ViewStyle> => [
                styles.todayButton,
                pressed && styles.categoryChipPressed,
              ]}
            >
              <Text style={styles.todayButtonText}>Hoje</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.calendarCard}>
          <Calendar
            key={`${todayString}-${calendarResetKey}`}
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
                  emoji={selectedCategoryEntries[dateString]?.emoji}
                  isChecked={Boolean(
                    selectedCategoryEntries[dateString]?.checked
                  )}
                  isDisabled={state === "disabled"}
                  isSelected={dateString === selectedDateString}
                  isToday={dateString === todayString}
                  onLongPress={handleDayLongPress}
                  onPress={(pressedDay) => {
                    void handleDayPress(pressedDay);
                  }}
                />
              );
            }}
          />
        </View>

        {selectedDateString && (
          <Animated.View
            style={[
              styles.notesCard,
              {
                marginBottom: bottomSafeSpacing,
                opacity: notesCardOpacity,
                transform: [{ translateY: notesCardTranslateY }],
              },
            ]}
          >
            <View style={styles.notesHeader}>
              <View style={styles.notesHeaderText}>
                <Text style={styles.notesTitle}>Anotações</Text>
                <Text style={styles.notesDate}>{selectedDateLabel}</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={handleCloseNotesPress}
                style={({ pressed }): StyleProp<ViewStyle> => [
                  styles.notesCloseButton,
                  pressed && styles.categoryChipPressed,
                ]}
              >
                <Text style={styles.notesCloseButtonText}>Fechar</Text>
              </Pressable>
            </View>

            <View style={styles.emojiSection}>
              <Text style={styles.emojiSectionLabel}>Emoji do dia</Text>

              <View style={styles.emojiOptionsRow}>
                {DAY_EMOJI_OPTIONS.map((emoji) => {
                  const isEmojiSelected = selectedDateEmoji === emoji;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={emoji}
                      onPress={() => {
                        void handleEmojiPress(emoji);
                      }}
                      style={({ pressed }): StyleProp<ViewStyle> => [
                        styles.emojiOption,
                        isEmojiSelected && styles.emojiOptionSelected,
                        pressed && styles.categoryChipPressed,
                      ]}
                    >
                      <Text style={styles.emojiOptionText}>{emoji}</Text>
                    </Pressable>
                  );
                })}

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void handleRemoveEmojiPress();
                  }}
                  style={({ pressed }): StyleProp<ViewStyle> => [
                    styles.emojiRemoveButton,
                    pressed && styles.categoryChipPressed,
                  ]}
                >
                  <Text style={styles.emojiRemoveButtonText}>Remover</Text>
                </Pressable>
              </View>
            </View>

            <TextInput
              multiline
              onChangeText={(text) => {
                void handleNoteChange(text);
              }}
              placeholder="Escreva uma anotação para este dia..."
              placeholderTextColor="#94a3b8"
              style={styles.notesInput}
              textAlignVertical="top"
              value={noteText}
            />
          </Animated.View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
