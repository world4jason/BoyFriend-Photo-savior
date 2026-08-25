import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { GuideOverlay } from './src/GuideOverlay';
import { SAMPLE_REFERENCES, SampleReference } from './src/sampleReferences';
import { DEFAULT_GUIDE, GuideMode, GuideSpec } from './src/types';

type Screen = 'home' | 'reference' | 'camera';

const MODES: { key: GuideMode; label: string }[] = [
  { key: 'simple', label: 'Simple' },
  { key: 'outline', label: 'Outline' },
  { key: 'pose', label: 'Pose' },
];

const cloneGuide = (guide: GuideSpec): GuideSpec => JSON.parse(JSON.stringify(guide)) as GuideSpec;

export default function App() {
  const { width, height } = useWindowDimensions();
  const [screen, setScreen] = useState<Screen>('home');
  const [referenceUri, setReferenceUri] = useState<string | null>(null);
  const [activeSample, setActiveSample] = useState<SampleReference | null>(null);
  const [guide, setGuide] = useState<GuideSpec>(cloneGuide(DEFAULT_GUIDE));
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [showReference, setShowReference] = useState(true);
  const cameraRef = useRef<CameraView | null>(null);

  const frameWidth = Math.min(Math.max(width - 24, 280), 560);
  const frameHeight = Math.min(height * 0.60, frameWidth * 4 / 3);

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
    setActiveSample(null);
    setGuide({ ...cloneGuide(DEFAULT_GUIDE), sourceUri: uri });
    setShowReference(true);
    setScreen('reference');
  };

  const useSample = (sample: SampleReference) => {
    const nextGuide = cloneGuide(sample.guide);
    nextGuide.sourceUri = sample.imageUrl;
    setGuide(nextGuide);
    setReferenceUri(sample.imageUrl);
    setActiveSample(sample);
    setShowReference(true);
    setScreen('reference');
  };

  const updateTransform = (patch: Partial<GuideSpec['transform']>) => {
    setGuide((current) => ({
      ...current,
      transform: {
        ...current.transform,
        ...patch,
      },
    }));
  };

  const shiftGuide = (dx: number, dy: number) => {
    const nextX = Math.max(-0.35, Math.min(0.35, guide.transform.dx + dx));
    const nextY = Math.max(-0.35, Math.min(0.35, guide.transform.dy + dy));
    updateTransform({ dx: nextX, dy: nextY });
  };

  const scaleGuide = (factor: number) => {
    updateTransform({ scale: Math.max(0.55, Math.min(1.65, guide.transform.scale * factor)) });
  };

  const resetTransform = () => updateTransform({ dx: 0, dy: 0, scale: 1 });

  const flipGuide = () => {
    if (guide.kind !== 'portrait') return;
    setGuide((current) => ({
      ...current,
      lookSpace: current.lookSpace === 'left' ? 'right' : current.lookSpace === 'right' ? 'left' : 'center',
      people: current.people.map((person) => ({
        ...person,
        head: {
          ...person.head,
          facing: person.head.facing === 'left' ? 'right' : person.head.facing === 'right' ? 'left' : 'front',
        },
      })),
    }));
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) {
        Alert.alert('Camera permission required', 'Camera access is needed to align the live shot with the guide.');
        return;
      }
    }
    setCapturedUri(null);
    setScreen('camera');
  };

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.92 });
      if (photo?.uri) setCapturedUri(photo.uri);
    } catch {
      Alert.alert('Could not capture photo', 'Please check camera permission and try again.');
    }
  };

  const visibleModes = guide.kind === 'food' ? MODES.filter((mode) => mode.key !== 'pose') : MODES;

  const guideControls = useMemo(() => (
    <View style={styles.controlPanel}>
      <View style={styles.modeRow}>
        {visibleModes.map((mode) => (
          <Pressable
            key={mode.key}
            onPress={() => setGuide((current) => ({ ...current, mode: mode.key }))}
            style={[styles.modeButton, guide.mode === mode.key && styles.modeButtonActive]}
          >
            <Text style={[styles.modeText, guide.mode === mode.key && styles.modeTextActive]}>{mode.label}</Text>
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
        <Pressable style={styles.resetButton} onPress={resetTransform}><Text style={styles.resetText}>Reset</Text></Pressable>
      </View>
    </View>
  ), [guide.kind, guide.mode, guide.transform.dx, guide.transform.dy, guide.transform.scale]);

  if (screen === 'home') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.homeContent}>
          <Text style={styles.eyebrow}>BOYFRIEND PHOTO SAVIOR · MVP</Text>
          <Text style={styles.hero}>Put the person into the shot.</Text>
          <Text style={styles.subhead}>Pick a reference, reduce it to a clean guide, then match that guide in the live camera instead of trying to remember the pose.</Text>

          <Pressable style={styles.primaryButton} onPress={pickReference}>
            <Text style={styles.primaryButtonText}>Use my reference photo</Text>
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Try an instant guide</Text>
            <Text style={styles.sectionCaption}>These demo photos are free Unsplash references.</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sampleRow}>
            {SAMPLE_REFERENCES.map((sample) => (
              <Pressable key={sample.id} style={styles.sampleCard} onPress={() => useSample(sample)}>
                <Image source={{ uri: sample.imageUrl }} style={styles.sampleImage} resizeMode="cover" />
                <View style={styles.sampleGradient} />
                <View style={styles.sampleTextWrap}>
                  <Text style={styles.sampleTag}>{sample.tag}</Text>
                  <Text style={styles.sampleTitle}>{sample.title}</Text>
                  <Text style={styles.sampleCredit}>{sample.credit}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.howCard}>
            <View style={styles.howStep}><Text style={styles.howNumber}>1</Text><Text style={styles.howText}>Choose a pose or food reference.</Text></View>
            <View style={styles.howStep}><Text style={styles.howNumber}>2</Text><Text style={styles.howText}>Keep only the useful anchors: head, shoulders, limbs, object zones.</Text></View>
            <View style={styles.howStep}><Text style={styles.howNumber}>3</Text><Text style={styles.howText}>Open camera and physically match the guide.</Text></View>
          </View>

          <Text style={styles.note}>Custom-photo AI extraction is the next detector step. This MVP already validates the actual shooting UX across Web, iOS and Android.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'reference') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.topBar}>
          <Pressable onPress={() => setScreen('home')}><Text style={styles.back}>‹ Library</Text></Pressable>
          <Text style={styles.topTitle}>{activeSample?.title ?? 'My reference'}</Text>
          <Pressable onPress={() => setShowReference((value) => !value)}><Text style={styles.back}>{showReference ? 'Guide only' : 'Show photo'}</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.referenceContent}>
          <View style={[styles.preview, { width: frameWidth, height: frameHeight }]}>
            {referenceUri && showReference && <Image source={{ uri: referenceUri }} resizeMode="cover" style={StyleSheet.absoluteFillObject} />}
            {showReference && <View style={styles.referenceShade} />}
            <GuideOverlay guide={guide} width={frameWidth} height={frameHeight} />
            {!showReference && <View style={styles.guideOnlyLabel}><Text style={styles.guideOnlyText}>GUIDE ONLY</Text></View>}
          </View>

          <View style={styles.referenceMeta}>
            <Text style={styles.referenceMetaTitle}>{guide.kind === 'food' ? 'Match the object relationship' : 'Match the body anchors'}</Text>
            <Text style={styles.referenceMetaText}>{guide.kind === 'food' ? 'Start with the biggest object, then place the secondary objects into their zones. Exact styling does not matter.' : 'Start with the head and shoulders. Then match hand / hip / knee anchors. The guide can be moved and scaled before shooting.'}</Text>
          </View>

          {guideControls}

          <View style={styles.bottomActions}>
            <Pressable style={styles.secondaryButton} onPress={pickReference}><Text style={styles.secondaryText}>Choose another</Text></Pressable>
            <Pressable style={styles.primarySmall} onPress={openCamera}><Text style={styles.primaryButtonText}>Open camera</Text></Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.cameraSafe}>
      <StatusBar style="light" />
      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />
        <GuideOverlay guide={guide} width={width} height={height} opacity={0.98} />

        <View style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>{guide.kind === 'food' ? 'MATCH OBJECT ZONES' : `MATCH ${guide.people.length > 1 ? `${guide.people.length} PEOPLE` : 'THE POSE'}`}</Text>
        </View>

        <View style={styles.liveHint}>
          <Text style={styles.liveHintText}>{guide.kind === 'food' ? 'Move the camera until size + spacing match.' : 'Head → shoulders → hands → legs. Do not copy the background.'}</Text>
        </View>

        {capturedUri && (
          <View style={styles.capturedPreview}>
            <Image source={{ uri: capturedUri }} style={styles.capturedImage} />
            <Text style={styles.capturedText}>Captured</Text>
          </View>
        )}

        <View style={styles.cameraBottom}>
          <Pressable style={styles.cameraSideButton} onPress={() => setScreen('reference')}><Text style={styles.cameraSideText}>Guide</Text></Pressable>
          <Pressable style={styles.shutterOuter} onPress={takePhoto}><View style={styles.shutterInner} /></Pressable>
          <Pressable style={styles.cameraSideButton} onPress={guide.kind === 'portrait' ? flipGuide : resetTransform}><Text style={styles.cameraSideText}>{guide.kind === 'portrait' ? 'Flip' : 'Reset'}</Text></Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0C0D0F' },
  cameraSafe: { flex: 1, backgroundColor: '#000' },
  homeContent: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 44, alignItems: 'center' },
  eyebrow: { color: '#F8FF61', fontSize: 12, fontWeight: '900', letterSpacing: 1.6 },
  hero: { color: '#FFF', fontSize: 42, lineHeight: 45, fontWeight: '900', textAlign: 'center', maxWidth: 620, marginTop: 14 },
  subhead: { color: '#A7ABB4', fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 570, marginTop: 14 },
  primaryButton: { backgroundColor: '#F8FF61', paddingVertical: 16, paddingHorizontal: 28, borderRadius: 18, minWidth: 260, alignItems: 'center', marginTop: 24 },
  primaryButtonText: { color: '#111315', fontSize: 15, fontWeight: '900' },
  sectionHeader: { width: '100%', maxWidth: 920, marginTop: 38, marginBottom: 14 },
  sectionTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  sectionCaption: { color: '#777C86', fontSize: 12, marginTop: 5 },
  sampleRow: { gap: 12, paddingHorizontal: 2, paddingBottom: 4 },
  sampleCard: { width: 208, height: 292, borderRadius: 22, overflow: 'hidden', backgroundColor: '#181A1F', borderWidth: 1, borderColor: '#282B31' },
  sampleImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  sampleGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.16)', borderBottomWidth: 115, borderBottomColor: 'rgba(0,0,0,0.66)' },
  sampleTextWrap: { position: 'absolute', left: 14, right: 14, bottom: 14 },
  sampleTag: { color: '#F8FF61', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  sampleTitle: { color: '#FFF', fontSize: 21, fontWeight: '900', marginTop: 4 },
  sampleCredit: { color: '#C3C6CC', fontSize: 9, marginTop: 5 },
  howCard: { width: '100%', maxWidth: 620, marginTop: 30, padding: 18, borderRadius: 20, backgroundColor: '#15171B', borderWidth: 1, borderColor: '#24272E', gap: 14 },
  howStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  howNumber: { width: 28, height: 28, textAlign: 'center', lineHeight: 28, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F8FF61', color: '#111315', fontWeight: '900' },
  howText: { color: '#E5E7EA', flex: 1, lineHeight: 20 },
  note: { color: '#676B73', fontSize: 12, textAlign: 'center', maxWidth: 560, marginTop: 20, lineHeight: 18 },
  topBar: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, gap: 8 },
  back: { color: '#F8FF61', fontSize: 14, fontWeight: '800' },
  topTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', flexShrink: 1, textAlign: 'center' },
  referenceContent: { alignItems: 'center', paddingBottom: 24 },
  preview: { overflow: 'hidden', borderRadius: 24, backgroundColor: '#16181C', borderWidth: 1, borderColor: '#292C32' },
  referenceShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.24)' },
  guideOnlyLabel: { position: 'absolute', bottom: 12, alignSelf: 'center', backgroundColor: 'rgba(248,255,97,0.12)', borderWidth: 1, borderColor: 'rgba(248,255,97,0.36)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  guideOnlyText: { color: '#F8FF61', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  referenceMeta: { width: '100%', maxWidth: 560, paddingHorizontal: 18, paddingTop: 14 },
  referenceMetaTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  referenceMetaText: { color: '#8F949E', fontSize: 12, lineHeight: 18, marginTop: 5 },
  controlPanel: { width: '100%', maxWidth: 560, paddingHorizontal: 18, paddingTop: 16, gap: 12 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeButton: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 14, backgroundColor: '#181A1F', borderWidth: 1, borderColor: '#262930' },
  modeButtonActive: { backgroundColor: '#F8FF61', borderColor: '#F8FF61' },
  modeText: { color: '#A8ABB2', fontWeight: '800' },
  modeTextActive: { color: '#111315' },
  nudgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7 },
  nudge: { width: 42, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#17191E' },
  nudgeText: { color: '#FFF', fontSize: 19, fontWeight: '800' },
  resetButton: { height: 40, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#22252B' },
  resetText: { color: '#C9CCD2', fontSize: 11, fontWeight: '800' },
  bottomActions: { width: '100%', maxWidth: 560, flexDirection: 'row', gap: 10, paddingHorizontal: 18, marginTop: 18 },
  secondaryButton: { flex: 1, paddingVertical: 15, borderRadius: 16, alignItems: 'center', backgroundColor: '#17191E' },
  secondaryText: { color: '#FFF', fontWeight: '800' },
  primarySmall: { flex: 1.35, paddingVertical: 15, borderRadius: 16, alignItems: 'center', backgroundColor: '#F8FF61' },
  cameraWrap: { flex: 1, overflow: 'hidden' },
  liveBadge: { position: 'absolute', top: Platform.OS === 'web' ? 18 : 12, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.62)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  liveBadgeText: { color: '#F8FF61', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  liveHint: { position: 'absolute', left: 22, right: 22, top: 56, alignItems: 'center' },
  liveHintText: { color: '#FFF', fontSize: 12, fontWeight: '700', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.42)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, overflow: 'hidden' },
  capturedPreview: { position: 'absolute', right: 18, bottom: 126, alignItems: 'center', gap: 4 },
  capturedImage: { width: 72, height: 96, borderRadius: 12, borderWidth: 2, borderColor: '#F8FF61' },
  capturedText: { color: '#F8FF61', fontSize: 10, fontWeight: '900' },
  cameraBottom: { position: 'absolute', left: 0, right: 0, bottom: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  cameraSideButton: { width: 72, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.60)', alignItems: 'center' },
  cameraSideText: { color: '#FFF', fontWeight: '800' },
  shutterOuter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#F8FF61' },
});
