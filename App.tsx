import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { GuideOverlay } from './src/GuideOverlay';
import { DEFAULT_GUIDE, GuideMode, GuideSpec } from './src/types';

type Screen = 'home' | 'reference' | 'camera';

const MODES: { key: GuideMode; label: string }[] = [
  { key: 'simple', label: 'Simple' },
  { key: 'outline', label: 'Outline' },
  { key: 'pose', label: 'Pose' },
];

export default function App() {
  const { width, height } = useWindowDimensions();
  const [screen, setScreen] = useState<Screen>('home');
  const [referenceUri, setReferenceUri] = useState<string | null>(null);
  const [guide, setGuide] = useState<GuideSpec>(DEFAULT_GUIDE);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const frameWidth = Math.min(width, 520);
  const frameHeight = Math.min(height * 0.66, frameWidth * 4 / 3);

  const pickReference = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (!uri) return;

    setReferenceUri(uri);
    setGuide({ ...DEFAULT_GUIDE, sourceUri: uri });
    setScreen('reference');
  };

  const shiftGuide = (dx: number, dy: number) => {
    const clamp = (v: number) => Math.max(0.04, Math.min(0.96, v));
    setGuide((g) => ({
      ...g,
      head: { ...g.head, center: { x: clamp(g.head.center.x + dx), y: clamp(g.head.center.y + dy) } },
      shoulders: {
        left: { x: clamp(g.shoulders.left.x + dx), y: clamp(g.shoulders.left.y + dy) },
        right: { x: clamp(g.shoulders.right.x + dx), y: clamp(g.shoulders.right.y + dy) },
      },
      torso: {
        ...g.torso,
        top: { x: clamp(g.torso.top.x + dx), y: clamp(g.torso.top.y + dy) },
        bottom: { x: clamp(g.torso.bottom.x + dx), y: clamp(g.torso.bottom.y + dy) },
      },
    }));
  };

  const scaleGuide = (factor: number) => {
    setGuide((g) => {
      const c = g.torso.top;
      const scalePoint = (p: { x: number; y: number }) => ({
        x: c.x + (p.x - c.x) * factor,
        y: c.y + (p.y - c.y) * factor,
      });
      return {
        ...g,
        head: {
          ...g.head,
          center: scalePoint(g.head.center),
          rx: Math.max(0.04, Math.min(0.18, g.head.rx * factor)),
          ry: Math.max(0.06, Math.min(0.22, g.head.ry * factor)),
        },
        shoulders: { left: scalePoint(g.shoulders.left), right: scalePoint(g.shoulders.right) },
        torso: { ...g.torso, bottom: scalePoint(g.torso.bottom), width: g.torso.width * factor },
      };
    });
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) {
        Alert.alert('Camera permission required', 'Camera access is needed to align the live shot with the guide.');
        return;
      }
    }
    setScreen('camera');
  };

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.92 });
      if (photo?.uri) {
        Alert.alert('Shot captured', Platform.OS === 'web' ? 'The photo was captured in the browser session.' : 'The photo was captured successfully.');
      }
    } catch {
      Alert.alert('Could not capture photo');
    }
  };

  const guideControls = useMemo(() => (
    <View style={styles.controlPanel}>
      <View style={styles.modeRow}>
        {MODES.map((m) => (
          <Pressable
            key={m.key}
            onPress={() => setGuide((g) => ({ ...g, mode: m.key }))}
            style={[styles.modeButton, guide.mode === m.key && styles.modeButtonActive]}
          >
            <Text style={[styles.modeText, guide.mode === m.key && styles.modeTextActive]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.nudgeRow}>
        <Pressable style={styles.nudge} onPress={() => shiftGuide(-0.025, 0)}><Text style={styles.nudgeText}>←</Text></Pressable>
        <Pressable style={styles.nudge} onPress={() => shiftGuide(0, -0.02)}><Text style={styles.nudgeText}>↑</Text></Pressable>
        <Pressable style={styles.nudge} onPress={() => shiftGuide(0, 0.02)}><Text style={styles.nudgeText}>↓</Text></Pressable>
        <Pressable style={styles.nudge} onPress={() => shiftGuide(0.025, 0)}><Text style={styles.nudgeText}>→</Text></Pressable>
        <Pressable style={styles.nudge} onPress={() => scaleGuide(0.94)}><Text style={styles.nudgeText}>−</Text></Pressable>
        <Pressable style={styles.nudge} onPress={() => scaleGuide(1.06)}><Text style={styles.nudgeText}>＋</Text></Pressable>
      </View>
    </View>
  ), [guide.mode]);

  if (screen === 'home') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.home}>
          <Text style={styles.eyebrow}>BOYFRIEND PHOTO SAVIOR</Text>
          <Text style={styles.hero}>See it. Guide it. Shoot it.</Text>
          <Text style={styles.subhead}>Turn a photo you like into a clean composition guide, then place the real person directly into it.</Text>

          <View style={styles.diagram}>
            <View style={styles.diagramCard}><Text style={styles.diagramIcon}>▧</Text><Text style={styles.diagramLabel}>Reference</Text></View>
            <Text style={styles.arrow}>→</Text>
            <View style={styles.diagramCard}><Text style={styles.diagramIcon}>◎</Text><Text style={styles.diagramLabel}>Guide</Text></View>
            <Text style={styles.arrow}>→</Text>
            <View style={styles.diagramCard}><Text style={styles.diagramIcon}>◉</Text><Text style={styles.diagramLabel}>Camera</Text></View>
          </View>

          <Pressable style={styles.primaryButton} onPress={pickReference}>
            <Text style={styles.primaryButtonText}>Choose reference photo</Text>
          </Pressable>
          <Text style={styles.note}>MVP: editable portrait guide. Automatic landmark extraction is the next detector module.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'reference') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.topBar}>
          <Pressable onPress={() => setScreen('home')}><Text style={styles.back}>‹ Back</Text></Pressable>
          <Text style={styles.topTitle}>Build guide</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.center}>
          <View style={[styles.preview, { width: frameWidth, height: frameHeight }]}>
            {referenceUri && <Image source={{ uri: referenceUri }} resizeMode="cover" style={StyleSheet.absoluteFillObject} />}
            <View style={styles.referenceShade} />
            <GuideOverlay guide={guide} width={frameWidth} height={frameHeight} />
          </View>
        </View>

        {guideControls}

        <View style={styles.bottomActions}>
          <Pressable style={styles.secondaryButton} onPress={pickReference}><Text style={styles.secondaryText}>Change photo</Text></Pressable>
          <Pressable style={styles.primarySmall} onPress={openCamera}><Text style={styles.primaryButtonText}>Use this guide</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.cameraSafe}>
      <StatusBar style="light" />
      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />
        <GuideOverlay guide={guide} width={width} height={height} opacity={0.96} />
        <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE GUIDE · {guide.mode.toUpperCase()}</Text></View>
        <View style={styles.cameraBottom}>
          <Pressable style={styles.cameraSideButton} onPress={() => setScreen('reference')}><Text style={styles.cameraSideText}>Guide</Text></Pressable>
          <Pressable style={styles.shutterOuter} onPress={takePhoto}><View style={styles.shutterInner} /></Pressable>
          <Pressable
            style={styles.cameraSideButton}
            onPress={() => setGuide((g) => ({ ...g, head: { ...g.head, facing: g.head.facing === 'left' ? 'right' : 'left' }, lookSpace: g.lookSpace === 'left' ? 'right' : 'left' }))}
          ><Text style={styles.cameraSideText}>Flip</Text></Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0C0D0F' },
  cameraSafe: { flex: 1, backgroundColor: '#000' },
  home: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center', gap: 18 },
  eyebrow: { color: '#F8FF61', fontSize: 12, fontWeight: '800', letterSpacing: 1.8 },
  hero: { color: '#FFF', fontSize: 42, lineHeight: 46, fontWeight: '900', textAlign: 'center', maxWidth: 520 },
  subhead: { color: '#A7ABB4', fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 520 },
  diagram: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 8 },
  diagramCard: { width: 88, height: 88, borderRadius: 22, backgroundColor: '#17191E', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#24272E' },
  diagramIcon: { color: '#F8FF61', fontSize: 26 },
  diagramLabel: { color: '#E7E8EA', fontSize: 12, fontWeight: '700' },
  arrow: { color: '#60636B', fontSize: 20 },
  primaryButton: { backgroundColor: '#F8FF61', paddingVertical: 16, paddingHorizontal: 26, borderRadius: 18, minWidth: 240, alignItems: 'center' },
  primaryButtonText: { color: '#111315', fontSize: 15, fontWeight: '900' },
  note: { color: '#676B73', fontSize: 12, textAlign: 'center', maxWidth: 440, marginTop: 4 },
  topBar: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  back: { color: '#F8FF61', fontSize: 16, fontWeight: '700' },
  topTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  center: { alignItems: 'center' },
  preview: { overflow: 'hidden', borderRadius: 24, backgroundColor: '#17191E' },
  referenceShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.22)' },
  controlPanel: { paddingHorizontal: 18, paddingTop: 16, gap: 14 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeButton: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 14, backgroundColor: '#181A1F', borderWidth: 1, borderColor: '#262930' },
  modeButtonActive: { backgroundColor: '#F8FF61', borderColor: '#F8FF61' },
  modeText: { color: '#A8ABB2', fontWeight: '800' },
  modeTextActive: { color: '#111315' },
  nudgeRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  nudge: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#17191E' },
  nudgeText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  bottomActions: { flexDirection: 'row', gap: 10, padding: 18, marginTop: 'auto' },
  secondaryButton: { flex: 1, paddingVertical: 15, borderRadius: 16, alignItems: 'center', backgroundColor: '#17191E' },
  secondaryText: { color: '#FFF', fontWeight: '800' },
  primarySmall: { flex: 1.35, paddingVertical: 15, borderRadius: 16, alignItems: 'center', backgroundColor: '#F8FF61' },
  cameraWrap: { flex: 1, overflow: 'hidden' },
  liveBadge: { position: 'absolute', top: 18, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.58)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  liveBadgeText: { color: '#F8FF61', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  cameraBottom: { position: 'absolute', left: 0, right: 0, bottom: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  cameraSideButton: { width: 72, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.58)', alignItems: 'center' },
  cameraSideText: { color: '#FFF', fontWeight: '800' },
  shutterOuter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#F8FF61' },
});
