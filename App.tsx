import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
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
import { cleanupTemporaryUri, prepareAnalysisImage } from './src/analysis/prepareAnalysisImage';
import { GuideOverlay } from './src/GuideOverlay';
import { MatchFeedback, scorePortraitMatch } from './src/matching/guideMatch';
import { SAMPLE_REFERENCES, SampleReference } from './src/sampleReferences';
import {
  OutlineAnalysisRequest,
  PersonOutlineAnalyzer,
} from './src/segmentation/PersonOutlineAnalyzer';
import { buildGuideFromContour, PersonContourDetection } from './src/segmentation/guideFromContour';
import { DEFAULT_GUIDE, GuideMode, GuideSpec } from './src/types';

type Screen = 'home' | 'reference' | 'camera';
type AnalysisStatus = 'idle' | 'analyzing' | 'ready' | 'error' | 'preset';

const FOOD_MODES: { key: GuideMode; label: string }[] = [
  { key: 'simple', label: 'Zones' },
  { key: 'outline', label: 'Outline' },
];

const cloneGuide = (guide: GuideSpec): GuideSpec => JSON.parse(JSON.stringify(guide)) as GuideSpec;

const cleanupRequestFiles = (request?: OutlineAnalysisRequest | null) => {
  request?.cleanupUris?.forEach(cleanupTemporaryUri);
};

export default function App() {
  const { width, height } = useWindowDimensions();
  const [screen, setScreen] = useState<Screen>('home');
  const [referenceUri, setReferenceUri] = useState<string | null>(null);
  const [activeSample, setActiveSample] = useState<SampleReference | null>(null);
  const [guide, setGuide] = useState<GuideSpec>(cloneGuide(DEFAULT_GUIDE));
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [showReference, setShowReference] = useState(true);
  const [analysisRequest, setAnalysisRequest] = useState<OutlineAnalysisRequest | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [analysisMessage, setAnalysisMessage] = useState('');

  const [cameraReady, setCameraReady] = useState(false);
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [liveRequest, setLiveRequest] = useState<OutlineAnalysisRequest | null>(null);
  const [liveFeedback, setLiveFeedback] = useState<MatchFeedback | null>(null);
  const [liveError, setLiveError] = useState('');

  const cameraRef = useRef<CameraView | null>(null);
  const liveBusyRef = useRef(false);
  const referencePrepareGenerationRef = useRef(0);

  const previewWidth = Math.min(Math.max(width - 24, 280), 620);
  const previewHeight = Math.min(height * 0.60, 680);

  const pickReference = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
      base64: false,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset?.uri) return;

    const prepareGeneration = ++referencePrepareGenerationRef.current;
    cleanupRequestFiles(analysisRequest);
    setAnalysisRequest(null);

    const aspectRatio = asset.width && asset.height ? asset.width / asset.height : 0.75;
    const fallback = cloneGuide(DEFAULT_GUIDE);
    fallback.mode = 'outline';
    fallback.sourceUri = asset.uri;
    fallback.aspectRatio = aspectRatio;

    setReferenceUri(asset.uri);
    setActiveSample(null);
    setGuide(fallback);
    setShowReference(true);
    setAnalysisStatus('analyzing');
    setAnalysisMessage('Preparing photo for local analysis…');
    setScreen('reference');

    try {
      const prepared = await prepareAnalysisImage(asset.uri, asset.width, asset.height, 1280, 0.74);

      if (prepareGeneration !== referencePrepareGenerationRef.current) {
        cleanupTemporaryUri(prepared.temporaryUri);
        return;
      }

      setAnalysisRequest({
        id: `ref-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        dataUrl: prepared.dataUrl,
        sourceUri: asset.uri,
        aspectRatio,
        cleanupUris: prepared.temporaryUri ? [prepared.temporaryUri] : [],
      });
      setAnalysisMessage('Extracting silhouette + pose + face direction…');
    } catch (error) {
      if (prepareGeneration !== referencePrepareGenerationRef.current) return;
      setAnalysisStatus('error');
      setAnalysisMessage(error instanceof Error ? error.message : 'Could not prepare the reference for local analysis.');
    }
  };

  const onOutlineResult = (request: OutlineAnalysisRequest, detection: PersonContourDetection) => {
    try {
      const nextGuide = buildGuideFromContour(detection, request.aspectRatio, request.sourceUri);
      setGuide(nextGuide);
      setAnalysisStatus('ready');
      const extras = [
        detection.poseLandmarks?.length ? 'pose' : null,
        detection.faceDirection ? `face ${detection.faceDirection}` : null,
      ].filter(Boolean).join(' · ');
      setAnalysisMessage(`Outer contour ready · ${detection.contour.length} points${extras ? ` · ${extras}` : ''}`);
    } catch (error) {
      setAnalysisStatus('error');
      setAnalysisMessage(error instanceof Error ? error.message : 'Could not build an outer contour.');
    } finally {
      cleanupRequestFiles(request);
      setAnalysisRequest(null);
    }
  };

  const onOutlineError = (request: OutlineAnalysisRequest, message: string) => {
    cleanupRequestFiles(request);
    setAnalysisStatus('error');
    setAnalysisMessage(`${message} The editable outer-contour fallback is still available.`);
    setAnalysisRequest(null);
  };

  const useSample = (sample: SampleReference) => {
    referencePrepareGenerationRef.current += 1;
    cleanupRequestFiles(analysisRequest);
    setAnalysisRequest(null);

    const nextGuide = cloneGuide(sample.guide);
    nextGuide.sourceUri = sample.imageUrl;
    nextGuide.aspectRatio = nextGuide.aspectRatio ?? 0.75;
    if (nextGuide.kind === 'portrait') nextGuide.mode = 'outline';
    setGuide(nextGuide);
    setReferenceUri(sample.imageUrl);
    setActiveSample(sample);
    setAnalysisStatus('preset');
    setAnalysisMessage('Preset outer contour · ready to test in camera');
    setShowReference(true);
    setScreen('reference');
  };

  const updateTransform = (patch: Partial<GuideSpec['transform']>) => {
    setGuide((current) => ({
      ...current,
      transform: { ...current.transform, ...patch },
    }));
  };

  const shiftGuide = (dx: number, dy: number) => {
    updateTransform({
      dx: Math.max(-0.35, Math.min(0.35, guide.transform.dx + dx)),
      dy: Math.max(-0.35, Math.min(0.35, guide.transform.dy + dy)),
    });
  };

  const scaleGuide = (factor: number) => {
    updateTransform({ scale: Math.max(0.55, Math.min(1.65, guide.transform.scale * factor)) });
  };

  const resetTransform = () => updateTransform({ dx: 0, dy: 0, scale: 1 });

  const openCamera = async () => {
    if (analysisStatus === 'analyzing') {
      Alert.alert('Guide is still analyzing', 'Wait for the reference guide to finish before opening the camera.');
      return;
    }

    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) {
        Alert.alert('Camera permission required', 'Camera access is needed to line up the live subject with the guide.');
        return;
      }
    }
    setCapturedUri(null);
    setCameraReady(false);
    setLiveFeedback(null);
    setLiveError('');
    setLiveEnabled(guide.kind === 'portrait');
    setScreen('camera');
  };

  const leaveCamera = () => {
    cleanupRequestFiles(liveRequest);
    setCameraReady(false);
    setLiveRequest(null);
    setLiveFeedback(null);
    liveBusyRef.current = false;
    setScreen('reference');
  };

  const toggleLiveCoach = () => {
    if (liveEnabled) {
      cleanupRequestFiles(liveRequest);
      setLiveRequest(null);
      setLiveFeedback(null);
      setLiveError('');
      liveBusyRef.current = false;
      setLiveEnabled(false);
      return;
    }

    setLiveEnabled(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    // A real shutter press wins over the low-priority sampled analyzer. Cancel
    // its request before capture so its cache lifetime and feedback cannot
    // overlap the user's actual photo.
    cleanupRequestFiles(liveRequest);
    setLiveRequest(null);

    try {
      liveBusyRef.current = true;
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.92 });
      if (photo?.uri) setCapturedUri(photo.uri);
    } catch {
      Alert.alert('Could not capture photo', 'Please check camera permission and try again.');
    } finally {
      liveBusyRef.current = false;
    }
  };

  const onLiveResult = (request: OutlineAnalysisRequest, detection: PersonContourDetection) => {
    try {
      const liveGuide = buildGuideFromContour(detection, request.aspectRatio);
      setLiveFeedback(scorePortraitMatch(guide, liveGuide));
      setLiveError('');
    } catch (error) {
      setLiveFeedback(null);
      setLiveError(error instanceof Error ? error.message : 'Could not match the live subject.');
    } finally {
      cleanupRequestFiles(request);
      setLiveRequest(null);
      liveBusyRef.current = false;
    }
  };

  const onLiveError = (request: OutlineAnalysisRequest, message: string) => {
    cleanupRequestFiles(request);
    setLiveFeedback(null);
    setLiveError(message);
    setLiveRequest(null);
    liveBusyRef.current = false;
  };

  useEffect(() => {
    if (screen !== 'camera' || !cameraReady || !liveEnabled || guide.kind !== 'portrait') return;

    let cancelled = false;

    const sampleFrame = async () => {
      if (cancelled || liveBusyRef.current || !cameraRef.current) return;
      liveBusyRef.current = true;
      let sourceUri: string | null = null;
      let preparedUri: string | null = null;

      try {
        const frame = await cameraRef.current.takePictureAsync({
          quality: 0.32,
          shutterSound: false,
        });

        if (!frame?.uri) {
          liveBusyRef.current = false;
          setLiveError('Live analysis frame was unavailable.');
          return;
        }

        sourceUri = frame.uri;
        const prepared = await prepareAnalysisImage(frame.uri, frame.width, frame.height, 720, 0.52);
        preparedUri = prepared.temporaryUri ?? null;

        if (cancelled) {
          cleanupTemporaryUri(sourceUri);
          cleanupTemporaryUri(preparedUri);
          liveBusyRef.current = false;
          return;
        }

        setLiveRequest({
          id: `live-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          dataUrl: prepared.dataUrl,
          sourceUri: frame.uri,
          aspectRatio: frame.width && frame.height ? frame.width / frame.height : (guide.aspectRatio ?? 0.75),
          cleanupUris: [sourceUri, preparedUri].filter((uri): uri is string => Boolean(uri)),
        });
      } catch (error) {
        cleanupTemporaryUri(sourceUri);
        cleanupTemporaryUri(preparedUri);
        liveBusyRef.current = false;
        if (!cancelled) setLiveError(error instanceof Error ? error.message : 'Live sampling failed.');
      }
    };

    const first = setTimeout(sampleFrame, 700);
    const timer = setInterval(sampleFrame, 1700);

    return () => {
      cancelled = true;
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [screen, cameraReady, liveEnabled, guide.kind, guide.aspectRatio, guide.transform.dx, guide.transform.dy, guide.transform.scale]);

  const analyzer = (
    <PersonOutlineAnalyzer
      request={analysisRequest}
      onResult={onOutlineResult}
      onError={onOutlineError}
    />
  );

  const liveAnalyzer = (
    <PersonOutlineAnalyzer
      request={liveRequest}
      onResult={onLiveResult}
      onError={onLiveError}
    />
  );

  const adjustmentControls = (
    <View style={styles.controlPanel}>
      {guide.kind === 'portrait' ? (
        <View style={styles.outlineOnlyBanner}>
          <Text style={styles.outlineOnlyTitle}>HUMAN GUIDE · OUTER CONTOUR</Text>
          <Text style={styles.outlineOnlyText}>Pose and face landmarks stay hidden. They only improve the guide geometry and live coaching.</Text>
        </View>
      ) : (
        <View style={styles.modeRow}>
          {FOOD_MODES.map((mode) => (
            <Pressable
              key={mode.key}
              onPress={() => setGuide((current) => ({ ...current, mode: mode.key }))}
              style={[styles.modeButton, guide.mode === mode.key && styles.modeButtonActive]}
            >
              <Text style={[styles.modeText, guide.mode === mode.key && styles.modeTextActive]}>{mode.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

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
  );

  if (screen === 'home') {
    return (
      <SafeAreaView style={styles.safe}>
        {analyzer}
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.homeContent}>
          <Text style={styles.eyebrow}>BOYFRIEND PHOTO SAVIOR · MVP</Text>
          <Text style={styles.hero}>Match the outline, not the memory.</Text>
          <Text style={styles.subhead}>Reference photo → clean outer guide → live camera coaching. The photographer never needs to memorize the pose.</Text>

          <Pressable style={styles.primaryButton} onPress={pickReference}>
            <Text style={styles.primaryButtonText}>Use my reference photo</Text>
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Instant examples</Text>
            <Text style={styles.sectionCaption}>Portraits use step-in outlines. Food uses composition zones.</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sampleRow}>
            {SAMPLE_REFERENCES.map((sample) => (
              <Pressable key={sample.id} style={styles.sampleCard} onPress={() => useSample(sample)}>
                <Image source={{ uri: sample.imageUrl }} style={styles.sampleImage} resizeMode="cover" />
                <View style={styles.sampleShade} />
                <View style={styles.sampleTextWrap}>
                  <Text style={styles.sampleTag}>{sample.tag}</Text>
                  <Text style={styles.sampleTitle}>{sample.title}</Text>
                  <Text style={styles.sampleCredit}>{sample.credit}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.howCard}>
            <View style={styles.howStep}><Text style={styles.howNumber}>1</Text><Text style={styles.howText}>Import a photo you want to recreate.</Text></View>
            <View style={styles.howStep}><Text style={styles.howNumber}>2</Text><Text style={styles.howText}>AI reduces it to an outside contour + hidden pose metadata.</Text></View>
            <View style={styles.howStep}><Text style={styles.howNumber}>3</Text><Text style={styles.howText}>Camera samples the subject and tells you the next adjustment.</Text></View>
          </View>

          <Text style={styles.note}>Current automatic portrait flow targets one primary person. Multi-person automatic instance separation comes later.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'reference') {
    const statusTone = analysisStatus === 'ready' || analysisStatus === 'preset'
      ? styles.statusReady
      : analysisStatus === 'error'
        ? styles.statusError
        : styles.statusWorking;
    const isAnalyzing = analysisStatus === 'analyzing';

    return (
      <SafeAreaView style={styles.safe}>
        {analyzer}
        <StatusBar style="light" />
        <View style={styles.topBar}>
          <Pressable onPress={() => setScreen('home')}><Text style={styles.back}>‹ Library</Text></Pressable>
          <Text style={styles.topTitle}>{activeSample?.title ?? 'My reference'}</Text>
          <Pressable onPress={() => setShowReference((value) => !value)}>
            <Text style={styles.back}>{showReference ? 'Guide only' : 'Show photo'}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.referenceContent}>
          <View style={[styles.preview, { width: previewWidth, height: previewHeight }]}>
            {referenceUri && showReference && (
              <Image source={{ uri: referenceUri }} resizeMode="contain" style={StyleSheet.absoluteFillObject} />
            )}
            {showReference && <View style={styles.referenceShade} />}
            <GuideOverlay guide={guide} width={previewWidth} height={previewHeight} />
            {!showReference && <View style={styles.guideOnlyLabel}><Text style={styles.guideOnlyText}>GUIDE ONLY</Text></View>}
          </View>

          <View style={[styles.statusCard, statusTone]}>
            <Text style={styles.statusTitle}>
              {isAnalyzing
                ? 'Analyzing reference'
                : analysisStatus === 'ready'
                  ? 'Automatic guide ready'
                  : analysisStatus === 'error'
                    ? 'Automatic guide unavailable'
                    : analysisStatus === 'preset'
                      ? 'Preset guide'
                      : 'Outer contour'}
            </Text>
            <Text style={styles.statusText}>{analysisMessage || 'Human guides are rendered as outside contours.'}</Text>
          </View>

          <View style={styles.referenceMeta}>
            <Text style={styles.referenceMetaTitle}>
              {guide.kind === 'food' ? 'Match the object relationship' : 'Put the person inside the line'}
            </Text>
            <Text style={styles.referenceMetaText}>
              {guide.kind === 'food'
                ? 'Start with the largest object, then match secondary-object spacing and relative size.'
                : 'Match the outside shape first. Live Coach will then prioritize position, scale, face direction and pose.'}
            </Text>
          </View>

          {adjustmentControls}

          <View style={styles.bottomActions}>
            <Pressable style={styles.secondaryButton} onPress={pickReference}><Text style={styles.secondaryText}>Choose another</Text></Pressable>
            <Pressable
              style={[styles.primarySmall, isAnalyzing && styles.primarySmallDisabled]}
              onPress={openCamera}
              disabled={isAnalyzing}
            >
              <Text style={styles.primaryButtonText}>{isAnalyzing ? 'Analyzing…' : 'Open camera'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const matchLabel = guide.kind === 'portrait'
    ? liveFeedback
      ? `${liveFeedback.score}% · ${liveFeedback.status.toUpperCase()}`
      : liveEnabled
        ? 'SCANNING…'
        : 'LIVE COACH OFF'
    : 'MATCH OBJECT ZONES';

  const liveHint = guide.kind === 'food'
    ? 'Match size + spacing. Ignore styling details.'
    : liveFeedback?.hint ?? (liveError ? 'Find the subject again' : 'Hold one person clearly inside the camera view.');

  const liveDetail = guide.kind === 'food'
    ? 'Food live detection is the next matcher.'
    : liveFeedback?.detail ?? liveError ?? 'Sampled matching updates about every 1–2 seconds.';

  return (
    <SafeAreaView style={styles.cameraSafe}>
      {analyzer}
      {liveAnalyzer}
      <StatusBar style="light" />
      <View style={styles.cameraWrap}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        />
        <GuideOverlay guide={guide} width={width} height={height} opacity={0.99} />

        <Pressable
          style={[styles.liveBadge, liveFeedback?.status === 'matched' && styles.liveBadgeMatched]}
          onPress={() => guide.kind === 'portrait' && toggleLiveCoach()}
        >
          <Text style={styles.liveBadgeText}>{matchLabel}</Text>
          {guide.kind === 'portrait' && <Text style={styles.liveBadgeSub}>LIVE COACH · SAMPLED</Text>}
        </Pressable>

        {liveFeedback && guide.kind === 'portrait' && (
          <View style={styles.scoreStrip}>
            <Text style={styles.scoreItem}>POS {liveFeedback.framingScore}</Text>
            <Text style={styles.scoreItem}>SIZE {liveFeedback.scaleScore}</Text>
            {liveFeedback.poseScore != null && <Text style={styles.scoreItem}>POSE {liveFeedback.poseScore}</Text>}
            {liveFeedback.faceScore != null && <Text style={styles.scoreItem}>FACE {liveFeedback.faceScore}</Text>}
          </View>
        )}

        <View style={styles.liveHint}>
          <Text style={styles.liveHintTitle}>{liveHint}</Text>
          <Text style={styles.liveHintText}>{liveDetail}</Text>
        </View>

        {capturedUri && (
          <View style={styles.capturedPreview}>
            <Image source={{ uri: capturedUri }} style={styles.capturedImage} />
            <Text style={styles.capturedText}>Captured</Text>
          </View>
        )}

        <View style={styles.cameraBottom}>
          <Pressable style={styles.cameraSideButton} onPress={leaveCamera}><Text style={styles.cameraSideText}>Guide</Text></Pressable>
          <Pressable style={[styles.shutterOuter, liveFeedback?.status === 'matched' && styles.shutterMatched]} onPress={takePhoto}>
            <View style={styles.shutterInner} />
          </Pressable>
          <Pressable
            style={styles.cameraSideButton}
            onPress={() => guide.kind === 'portrait' ? toggleLiveCoach() : resetTransform()}
          >
            <Text style={styles.cameraSideText}>{guide.kind === 'portrait' ? (liveEnabled ? 'AI On' : 'AI Off') : 'Reset'}</Text>
          </Pressable>
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
  hero: { color: '#FFF', fontSize: 42, lineHeight: 45, fontWeight: '900', textAlign: 'center', maxWidth: 650, marginTop: 14 },
  subhead: { color: '#A7ABB4', fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 590, marginTop: 14 },
  primaryButton: { backgroundColor: '#F8FF61', paddingVertical: 16, paddingHorizontal: 28, borderRadius: 18, minWidth: 260, alignItems: 'center', marginTop: 24 },
  primaryButtonText: { color: '#111315', fontSize: 15, fontWeight: '900' },
  sectionHeader: { width: '100%', maxWidth: 920, marginTop: 38, marginBottom: 14 },
  sectionTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  sectionCaption: { color: '#777C86', fontSize: 12, marginTop: 5 },
  sampleRow: { gap: 12, paddingHorizontal: 2, paddingBottom: 4 },
  sampleCard: { width: 208, height: 292, borderRadius: 22, overflow: 'hidden', backgroundColor: '#181A1F', borderWidth: 1, borderColor: '#282B31' },
  sampleImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  sampleShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)', borderBottomWidth: 115, borderBottomColor: 'rgba(0,0,0,0.68)' },
  sampleTextWrap: { position: 'absolute', left: 14, right: 14, bottom: 14 },
  sampleTag: { color: '#F8FF61', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  sampleTitle: { color: '#FFF', fontSize: 21, fontWeight: '900', marginTop: 4 },
  sampleCredit: { color: '#C3C6CC', fontSize: 9, marginTop: 5 },
  howCard: { width: '100%', maxWidth: 650, marginTop: 30, padding: 18, borderRadius: 20, backgroundColor: '#15171B', borderWidth: 1, borderColor: '#24272E', gap: 14 },
  howStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  howNumber: { width: 28, height: 28, textAlign: 'center', lineHeight: 28, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F8FF61', color: '#111315', fontWeight: '900' },
  howText: { flex: 1, color: '#D4D6DA', fontSize: 14, lineHeight: 20 },
  note: { color: '#686D76', fontSize: 12, textAlign: 'center', maxWidth: 620, marginTop: 24 },
  topBar: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, gap: 10 },
  back: { color: '#F8FF61', fontSize: 14, fontWeight: '800' },
  topTitle: { color: '#FFF', fontSize: 15, fontWeight: '900', flexShrink: 1, textAlign: 'center' },
  referenceContent: { alignItems: 'center', paddingBottom: 28 },
  preview: { overflow: 'hidden', borderRadius: 24, backgroundColor: '#08090A', borderWidth: 1, borderColor: '#24272E' },
  referenceShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.22)' },
  guideOnlyLabel: { position: 'absolute', right: 12, bottom: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.65)' },
  guideOnlyText: { color: '#F8FF61', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  statusCard: { width: '100%', maxWidth: 620, marginTop: 14, padding: 14, borderRadius: 16, borderWidth: 1 },
  statusWorking: { backgroundColor: '#181A1F', borderColor: '#343941' },
  statusReady: { backgroundColor: '#171B14', borderColor: '#4A5A31' },
  statusError: { backgroundColor: '#201617', borderColor: '#614046' },
  statusTitle: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  statusText: { color: '#AEB2BA', fontSize: 12, lineHeight: 18, marginTop: 4 },
  referenceMeta: { width: '100%', maxWidth: 620, paddingHorizontal: 4, marginTop: 16 },
  referenceMetaTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  referenceMetaText: { color: '#999EA8', fontSize: 13, lineHeight: 19, marginTop: 6 },
  controlPanel: { width: '100%', maxWidth: 620, paddingTop: 16, gap: 12 },
  outlineOnlyBanner: { padding: 13, borderRadius: 16, backgroundColor: '#17191E', borderWidth: 1, borderColor: '#31353C' },
  outlineOnlyTitle: { color: '#F8FF61', fontSize: 11, fontWeight: '900', letterSpacing: 0.65 },
  outlineOnlyText: { color: '#999EA8', fontSize: 11, lineHeight: 17, marginTop: 4 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeButton: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 14, backgroundColor: '#181A1F', borderWidth: 1, borderColor: '#262930' },
  modeButtonActive: { backgroundColor: '#F8FF61', borderColor: '#F8FF61' },
  modeText: { color: '#A8ABB2', fontWeight: '800' },
  modeTextActive: { color: '#111315' },
  nudgeRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8 },
  nudge: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#17191E' },
  nudgeText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  resetButton: { minWidth: 66, height: 40, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#23262C' },
  resetText: { color: '#D8DADE', fontSize: 12, fontWeight: '800' },
  bottomActions: { width: '100%', maxWidth: 620, flexDirection: 'row', gap: 10, paddingTop: 18 },
  secondaryButton: { flex: 1, paddingVertical: 15, borderRadius: 16, alignItems: 'center', backgroundColor: '#17191E' },
  secondaryText: { color: '#FFF', fontWeight: '800' },
  primarySmall: { flex: 1.35, paddingVertical: 15, borderRadius: 16, alignItems: 'center', backgroundColor: '#F8FF61' },
  primarySmallDisabled: { opacity: 0.45 },
  cameraWrap: { flex: 1, overflow: 'hidden' },
  liveBadge: { position: 'absolute', top: 20, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.72)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  liveBadgeMatched: { backgroundColor: 'rgba(29,75,45,0.88)', borderColor: '#85F3A7' },
  liveBadgeText: { color: '#F8FF61', fontSize: 12, fontWeight: '900', letterSpacing: 0.7 },
  liveBadgeSub: { color: '#A9ADB6', fontSize: 8, fontWeight: '800', letterSpacing: 0.9, marginTop: 2 },
  scoreStrip: { position: 'absolute', top: 82, alignSelf: 'center', flexDirection: 'row', gap: 6, backgroundColor: 'rgba(0,0,0,0.58)', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12 },
  scoreItem: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  liveHint: { position: 'absolute', left: 18, right: 18, bottom: 132, alignItems: 'center' },
  liveHintTitle: { color: '#111315', fontSize: 22, fontWeight: '900', textAlign: 'center', backgroundColor: '#F8FF61', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, overflow: 'hidden' },
  liveHintText: { color: '#FFF', fontSize: 11, fontWeight: '700', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.64)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, overflow: 'hidden', marginTop: 6 },
  capturedPreview: { position: 'absolute', right: 16, top: 68, width: 72, alignItems: 'center' },
  capturedImage: { width: 66, height: 88, borderRadius: 12, borderWidth: 2, borderColor: '#F8FF61' },
  capturedText: { color: '#FFF', fontSize: 9, fontWeight: '800', marginTop: 5 },
  cameraBottom: { position: 'absolute', left: 0, right: 0, bottom: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  cameraSideButton: { width: 72, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.62)', alignItems: 'center' },
  cameraSideText: { color: '#FFF', fontWeight: '800' },
  shutterOuter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  shutterMatched: { borderColor: '#85F3A7', borderWidth: 6 },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#F8FF61' },
});
