import React from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/hooks/useSettings';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, ThemeMode } from '@/constants/theme';
import { t } from '@/i18n';

export default function SettingsScreen() {
  const { colors, settings, updateSettings } = useSettings();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScreenHeader title={t('settings.title')} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Section label='Aparência' colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(['light', 'dark', 'system'] as ThemeMode[]).map((mode, i, arr) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.row,
                { borderBottomColor: colors.border },
                i === arr.length - 1 && styles.lastRow,
              ]}
              onPress={() => updateSettings({ themeMode: mode })}
            >
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                {t(`settings.theme${mode.charAt(0).toUpperCase()}${mode.slice(1)}`)}
              </Text>
              {settings.themeMode === mode && (
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Section label='Perfil' colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.row, styles.lastRow]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings.weight')}</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={String(settings.weightKg)}
              keyboardType='decimal-pad'
              onChangeText={(v) => {
                const n = parseFloat(v);
                if (!isNaN(n)) updateSettings({ weightKg: n });
              }}
            />
          </View>
        </View>

        <Section label='Áudio' colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.row, styles.lastRow]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings.audioCues')}</Text>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('settings.audioCuesDesc')}</Text>
            </View>
            <Switch
              value={settings.audioCuesEnabled}
              onValueChange={(v) => updateSettings({ audioCuesEnabled: v })}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor='#FFF'
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ label, colors }: { label: string; colors: Colors }) {
  return (
    <Text style={[styles.section, { color: colors.textSecondary }]}>{label.toUpperCase()}</Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: {
    fontSize: 12,
    letterSpacing: 0.8,
    fontFamily: 'SFProDisplay-Medium',
    marginTop: 20,
    marginBottom: 8,
  },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastRow: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 15, fontFamily: 'SFProDisplay-Regular' },
  hint: { fontSize: 12, marginTop: 2, fontFamily: 'SFProDisplay-Regular' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    minWidth: 64,
    textAlign: 'right',
    fontFamily: 'SFProDisplay-Regular',
  },
});
