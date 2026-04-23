import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useTheme,
  palette,
  typography,
  spacing,
  radii,
  gradients,
  durations,
} from '../../theme';
import {
  QupayLogo,
  CTAButton,
  GradientButton,
  HapticButton,
  Card,
  Surface,
  GradientBorder,
  ScreenHeader,
  FormField,
  SearchInput,
  StatusBadge,
  StatBox,
  StatPill,
  Chip,
  ProgressRail,
  Avatar,
  GradientAvatar,
  Shimmer,
  ShimmerCard,
  Toast,
  Odometer,
  CorridorWire,
  SolverPulse,
} from '../../components';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[typography.label, { color: theme.text.secondary, marginBottom: spacing(3) }]}>
        {title}
      </Text>
      {children}
    </View>
  );
};

const ColorSwatch: React.FC<{
  name: string;
  color: string;
  textColor?: string;
}> = ({ name, color, textColor }) => {
  const { theme } = useTheme();
  const displayTextColor = textColor || (color.startsWith('rgba') ? theme.text.primary : '#FFFFFF');
  
  return (
    <View style={[styles.swatch, { backgroundColor: color }]}>
      <Text style={[typography.captionMedium, { color: displayTextColor }]}>
        {name}
      </Text>
      <Text style={[typography.monoXs, { color: displayTextColor, opacity: 0.7 }]}>
        {color}
      </Text>
    </View>
  );
};

export const DesignSystemScreen: React.FC = () => {
  const { theme, brand, mode, setPreference } = useTheme();
  const [searchValue, setSearchValue] = useState('');
  const [selectedChip, setSelectedChip] = useState('All');
  const [showToast, setShowToast] = useState(false);

  if (!__DEV__) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.default }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Design System"
          right={
            <HapticButton
              onPress={() => setPreference(mode === 'dark' ? 'light' : 'dark')}
              style={[styles.modeToggle, { backgroundColor: theme.background.surface }]}
            >
              <Text style={{ color: theme.text.primary }}>
                {mode === 'dark' ? '☀️' : '🌙'}
              </Text>
            </HapticButton>
          }
        />

        {/* Logo */}
        <Section title="Logo">
          <View style={styles.row}>
            <QupayLogo size={32} variant="full" />
            <QupayLogo size={40} variant="mark" />
          </View>
        </Section>

        {/* Colors — Royal ramp */}
        <Section title="Royal Brand Ramp">
          <View style={styles.swatchGrid}>
            <ColorSwatch name="Royal 300" color={palette.royal[300]} textColor={palette.grey[900]} />
            <ColorSwatch name="Royal 400" color={palette.royal[400]} textColor={palette.grey[900]} />
            <ColorSwatch name="Royal 500" color={palette.royal[500]} />
            <ColorSwatch name="Royal 600" color={palette.royal[600]} />
            <ColorSwatch name="Royal 700" color={palette.royal[700]} />
          </View>
        </Section>

        <Section title="Status Colors">
          <View style={styles.swatchGrid}>
            <ColorSwatch name="Positive" color={palette.status.positive} textColor={palette.grey[900]} />
            <ColorSwatch name="Partial" color={palette.status.partial} textColor={palette.grey[900]} />
            <ColorSwatch name="Negative" color={palette.status.negative} />
            <ColorSwatch name="Highlight" color={palette.highlight} textColor={palette.grey[900]} />
          </View>
        </Section>

        <Section title="Grey Ramp">
          <View style={styles.swatchGrid}>
            <ColorSwatch name="100" color={palette.grey[100]} textColor={palette.grey[900]} />
            <ColorSwatch name="300" color={palette.grey[300]} textColor={palette.grey[900]} />
            <ColorSwatch name="500" color={palette.grey[500]} />
            <ColorSwatch name="700" color={palette.grey[700]} />
            <ColorSwatch name="900" color={palette.grey[900]} textColor={palette.grey[100]} />
          </View>
        </Section>

        {/* Gradients */}
        <Section title="Gradients">
          <View style={styles.gradientRow}>
            <LinearGradient
              colors={[...gradients.corridor.colors]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientSwatch}
            >
              <Text style={[typography.caption, { color: palette.grey[100] }]}>Corridor</Text>
            </LinearGradient>
            <LinearGradient
              colors={[...gradients.shimmer.colors]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientSwatch}
            >
              <Text style={[typography.caption, { color: palette.grey[300] }]}>Shimmer</Text>
            </LinearGradient>
            <LinearGradient
              colors={[...gradients.celebrate.colors]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientSwatch}
            >
              <Text style={[typography.caption, { color: palette.grey[100] }]}>Celebrate</Text>
            </LinearGradient>
          </View>
        </Section>

        {/* Typography */}
        <Section title="Typography (Geist 400)">
          <Text style={[typography.display1, { color: theme.text.primary }]}>Display 1</Text>
          <Text style={[typography.display2, { color: theme.text.primary }]}>Display 2</Text>
          <Text style={[typography.h1, { color: theme.text.primary }]}>Heading 1</Text>
          <Text style={[typography.h2, { color: theme.text.primary }]}>Heading 2</Text>
          <Text style={[typography.body, { color: theme.text.primary }]}>Body text</Text>
          <Text style={[typography.bodySm, { color: theme.text.secondary }]}>Body small</Text>
          <Text style={[typography.caption, { color: theme.text.muted }]}>Caption</Text>
          <Text style={[typography.label, { color: theme.text.secondary }]}>LABEL</Text>
          <Text style={[typography.value, { color: theme.text.primary }]}>$1,234.56</Text>
        </Section>

        {/* Odometer */}
        <Section title="Odometer">
          <Odometer value="$1,234.56" fontSize={49} color={theme.text.primary} />
        </Section>

        {/* Corridor Wire */}
        <Section title="Corridor Wire">
          <CorridorWire width={300} height={40} progress={0.65} />
        </Section>

        {/* Solver Pulse */}
        <Section title="Solver Pulse">
          <View style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}>
            <SolverPulse size={100} />
            <Text style={[typography.caption, { color: theme.text.secondary, marginTop: spacing(2) }]}>
              Solvers competing...
            </Text>
          </View>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <View style={styles.buttonColumn}>
            <CTAButton title="Primary CTA" onPress={() => {}} />
            <CTAButton title="Disabled" onPress={() => {}} disabled />
            <CTAButton title="Ghost" onPress={() => {}} ghost />
            <CTAButton title="Danger" onPress={() => {}} danger />
            <GradientButton title="Primary" onPress={() => {}} />
            <GradientButton title="Secondary" onPress={() => {}} variant="secondary" />
            <GradientButton title="Tertiary" onPress={() => {}} variant="tertiary" />
          </View>
        </Section>

        {/* Cards & Surfaces */}
        <Section title="Cards">
          <Card>
            <Text style={[typography.bodyMedium, { color: theme.text.primary }]}>Default Card</Text>
            <Text style={[typography.bodySm, { color: theme.text.secondary }]}>
              Hairline border on dark, shadow on light
            </Text>
          </Card>
          <View style={{ height: spacing(3) }} />
          <Card variant="inner">
            <Text style={[typography.bodyMedium, { color: theme.text.primary }]}>Inner Card</Text>
          </Card>
          <View style={{ height: spacing(3) }} />
          <Surface level="raised" style={{ padding: spacing(4) }}>
            <Text style={[typography.bodyMedium, { color: theme.text.primary }]}>Surface (raised)</Text>
          </Surface>
          <View style={{ height: spacing(3) }} />
          <GradientBorder>
            <View style={{ padding: spacing(4) }}>
              <Text style={[typography.bodyMedium, { color: theme.text.primary }]}>Gradient Border</Text>
            </View>
          </GradientBorder>
        </Section>

        {/* Form Elements */}
        <Section title="Form Elements">
          <FormField
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
          />
          <FormField
            label="Valid Input"
            placeholder="Valid state"
            isValid
            value="test@example.com"
          />
          <FormField
            label="Error Input"
            placeholder="Error state"
            error="This field is required"
          />
          <SearchInput
            value={searchValue}
            onChangeText={setSearchValue}
            placeholder="Search..."
          />
        </Section>

        {/* Status & Chips */}
        <Section title="Status & Chips">
          <View style={styles.row}>
            <StatusBadge label="Success" variant="success" />
            <StatusBadge label="Warning" variant="warning" />
            <StatusBadge label="Error" variant="error" />
            <StatusBadge label="Info" variant="info" />
          </View>
          <View style={[styles.row, { marginTop: spacing(3) }]}>
            {['All', 'Pending', 'Complete'].map((chip) => (
              <Chip
                key={chip}
                label={chip}
                selected={selectedChip === chip}
                onPress={() => setSelectedChip(chip)}
              />
            ))}
          </View>
          <View style={[styles.row, { marginTop: spacing(3) }]}>
            <StatPill label="Rate" value="1.05" />
            <StatPill label="Fee" value="$0.50" variant="warning" />
          </View>
        </Section>

        {/* Stat Boxes */}
        <Section title="Stat Boxes">
          <View style={styles.row}>
            <StatBox label="Sent" value="$5,430" subValue="+12%" />
            <StatBox label="Received" value="$3,210" />
          </View>
        </Section>

        {/* Progress */}
        <Section title="Progress">
          <ProgressRail progress={0.65} />
          <View style={{ height: spacing(2) }} />
          <ProgressRail progress={0.3} />
          <View style={{ height: spacing(2) }} />
          <ProgressRail progress={1} />
        </Section>

        {/* Avatars */}
        <Section title="Avatars">
          <View style={styles.row}>
            <Avatar seed="John Doe" size={44} />
            <Avatar seed="Jane Smith" size={44} bankBadge="GTBank" />
            <GradientAvatar initials="QP" size={44} />
            <GradientAvatar initials="AB" size={44} />
          </View>
        </Section>

        {/* Loading States */}
        <Section title="Loading States">
          <ShimmerCard lines={3} />
          <View style={{ marginTop: spacing(3) }}>
            <Shimmer width={200} height={20} />
            <View style={{ height: spacing(2) }} />
            <Shimmer width={150} height={14} />
          </View>
        </Section>

        {/* Radii */}
        <Section title="Border Radii">
          <View style={styles.row}>
            {(['sm', 'md', 'lg', 'xl'] as const).map((key) => (
              <View
                key={key}
                style={[
                  styles.radiusSwatch,
                  {
                    borderRadius: radii[key],
                    backgroundColor: theme.background.surface,
                  },
                ]}
              >
                <Text style={[typography.monoXs, { color: theme.text.primary }]}>
                  {key}
                </Text>
                <Text style={[typography.monoXs, { color: theme.text.muted }]}>
                  {radii[key]}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Motion */}
        <Section title="Motion Durations">
          <View style={styles.row}>
            {(['fast', 'base', 'slow'] as const).map((key) => (
              <View key={key} style={[styles.motionSwatch, { backgroundColor: theme.background.surface }]}>
                <Text style={[typography.caption, { color: theme.text.primary }]}>
                  {key}
                </Text>
                <Text style={[typography.monoXs, { color: theme.text.muted }]}>
                  {durations[key]}ms
                </Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Toast Demo */}
        <Section title="Toast">
          <CTAButton
            title="Show Toast"
            onPress={() => setShowToast(true)}
          />
        </Section>

        <View style={{ height: spacing(20) }} />
      </ScrollView>

      <Toast
        visible={showToast}
        message="This is a success toast!"
        type="success"
        onDismiss={() => setShowToast(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing(5),
  },
  section: {
    marginTop: spacing(6),
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(3),
    alignItems: 'center',
  },
  buttonColumn: {
    gap: spacing(3),
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
  },
  swatch: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    padding: spacing(2),
    justifyContent: 'flex-end',
  },
  gradientRow: {
    flexDirection: 'row',
    gap: spacing(3),
  },
  gradientSwatch: {
    flex: 1,
    height: 60,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusSwatch: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motionSwatch: {
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  modeToggle: {
    width: 44,
    height: 44,
    borderRadius: radii.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DesignSystemScreen;
