import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
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
import { GUIDE_PRESETS, getGuidePreset } from './src/guidePresets';
import { GuideOverlay } from './src/GuideOverlay';
import { MatchFeedback, scorePortraitMatch } from './src/matching/guideMatch';
import {
  advanceMatchStability,
  didEnterStableMatch,
  MatchStabilityState,
  resetMatchStability,
  stableMatchProgress,
} from './src/matching/stableMatch';
import { SAMPLE_REFERENCES, SampleReference } from './src/sampleReferences';
import { OutlineAnalysisRequest, PersonOutlineAnalyzer } from './src/segmentation/PersonOutlineAnalyzer';
import { buildGuideFromContour, PersonContourDetection } from './src/segmentation/guideFromContour';
import { lensHintFromExif } from './src/shooting/lensHint';
import { BENCHMARK_TEMPLATES, BenchmarkTemplate } from './src/templates';
import { DEFAULT_GUIDE, GuideMode, GuidePreset, GuideSpec } from './src/types';

type Screen = 'home' | 'reference' | 'camera';
type AnalysisStatus = 'idle' | 'analyzing' | 'ready' | 'error' | 'preset';
type CaptureSource = 'manual' | 'auto' | null;

const FOOD_MODES: { key: GuideMode; label: string }[] = [
  { key: 'simple', label: 'Soft zones' },
  { key: 'outline', label: 'Rings' },
];

const LARGE_TEMPLATE_CATALOG_THRESHOLD = 24;
const TEMPLATE_CARD_WIDTH = 174;
const TEMPLATE_CARD_GAP = 12;
const TEMPLATE_CARD_EXTENT = TEMPLATE_CARD_WIDTH + TEMPLATE_CARD_GAP;

const cloneGuide = (guide: GuideSpec): GuideSpec => JSON.parse(JSON.stringify(guide)) as GuideSpec;
const cleanupRequestFiles = (request?: OutlineAnalysisRequest | null) => {
  request?.cleanupUris?.forEach(cleanupTemporaryUri);
};

const templateCategoryLabel = (category: string) => {
  const parts = category.split('/').map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1) return parts.slice(1).join(' / ');
  return parts[0] ?? 'Other';
};

const uniqueTemplateCategories = (templates: BenchmarkTemplate[]) => Array.from(new Set(
  templates.map((template) => templateCategoryLabel(template.category)),
));

export default function App() {
  const { width, height } = useWindowDimensions();
  const [screen, setScreen] = useState<Screen>('home');
  const [referenceUri, setReferenceUri] = useState<string | null>(null);
  const [activeSample, setActiveSample] = useState<SampleReference | null>(null);
  const [activeTemplateTitle, setActiveTemplateTitle] = useState<string | null>(null);
  const [templateMode, setTemplateMode] = useState<GuidePreset>('sovs');
  const [templateCategory, setTemplateCategory] = useState('All');
  const [guide, setGuide] = useState<GuideSpec>(cloneGuide(DEFAULT_GUIDE));
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [captureSource, setCaptureSource] = useState<CaptureSource>(null);
  const [showReference, setShowReference] = useState(true);
  const [analysisRequest, setAnalysisRequest] = useState<OutlineAnalysisRequest | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [analysisMessage, setAnalysisMessage] = useState('');

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraMountError, setCameraMountError] = useState('');
  const [cameraViewport, setCameraViewport] = useState(() => ({
    width: Math.max(1, width),
    height: Math.max(1, height),
  }));
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(false);
  const [liveRequest, setLiveRequest] = useState<OutlineAnalysisRequest | null>(null);
  const [liveFeedback, setLiveFeedback] = useState<MatchFeedback | null>(null);
  const [liveError, setLiveError] = useState('');
  const [matchStability, setMatchStability] = useState<MatchStabilityState>(() => resetMatchStability());

  const cameraRef = useRef<CameraView | null>(null);
  const liveBusyRef = useRef(false);
  const photoCaptureRef = useRef(false);
  const liveSessionRef = useRef(0);
  const matchStabilityRef = useRef<MatchStabilityState>(resetMatchStability());
  const referencePrepareGenerationRef = useRef(0);
  const selectedPresetRef = useRef<GuidePreset>(DEFAULT_GUIDE.visualStyle ?? 'sovs');

  const previewWidth = Math.min(Math.max(width - 24, 280), 620);
  const previewHeight = Math.min(height * 0.60, 680);
  const activePreset = getGuidePreset(guide.visualStyle ?? 'sovs');
  const availablePresets = GUIDE_PRESETS.filter((preset) => preset.supportedKinds.includes(guide.kind));
  const liveCoachEligible = guide.kind === 'portrait' && guide.people.length === 1;

  const modeTemplates = useMemo(
    () => BENCHMARK_TEMPLATES.filter((template) => template.defaultPreset === templateMode),
    [templateMode],
  );
  const templateCategories = useMemo(() => uniqueTemplateCategories(modeTemplates), [modeTemplates]);
  const isLargeTemplateCatalog = modeTemplates.length > LARGE_TEMPLATE_CATALOG_THRESHOLD;
  const templateCategoryOptions = useMemo(
    () => isLargeTemplateCatalog ? templateCategories : ['All', ...templateCategories],
    [isLargeTemplateCatalog, templateCategories],
  );
  const filteredTemplates = useMemo(
    () => templateCategory === 'All'
      ? modeTemplates
      : modeTemplates.filter((template) => templateCategoryLabel(template.category) === templateCategory),
    [modeTemplates, templateCategory],
  );

  useEffect(() => {
    const nextCategory = modeTemplates.length > LARGE_TEMPLATE_CATALOG_THRESHOLD
      ? (templateCategories[0] ?? 'All')
      : 'All';
    setTemplateCategory(nextCategory);
  }, [templateMode, modeTemplates.length, templateCategories]);

  const resetLiveStability = () => {
    const reset = resetMatchStability();
    matchStabilityRef.current = reset;
    setMatchStability(reset);
    setLiveFeedback(null);
  };

  const invalidateLiveSession = () => {
    liveSessionRef.current += 1;
  };

  const isCurrentLiveRequest = (request: OutlineAnalysisRequest) =>
    request.sessionId != null && request.sessionId === liveSessionRef.current;

  const setGuidePreset = (preset: GuidePreset) => {
    selectedPresetRef.current = preset;
    setGuide((current) => ({ ...current, visualStyle: preset }));
  };

  const pickReference = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
      base64: false,
      exif: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset?.uri) return;

    const generation = ++referencePrepareGenerationRef.current;
    cleanupRequestFiles(analysisRequest);
    setAnalysisRequest(null);

    const aspectRatio = asset.width && asset.height ? asset.width / asset.height : 0.75;
    const pickedLensHint = lensHintFromExif(
      asset.exif as Record<string, unknown> | null | undefined,
    );
    const fallback = cloneGuide(DEFAULT_GUIDE);
    selectedPresetRef.current = 'sovs';
    fallback.visualStyle = 'sovs';
    fallback.sourceUri = asset.uri;
    fallback.aspectRatio = aspectRatio;
    if (pickedLensHint) fallback.lensHint = pickedLensHint;

    setReferenceUri(asset.uri);
    setActiveSample(null);
    setActiveTemplateTitle(null);
    setGuide(fallback);
    setShowReference(true);
    setAnalysisStatus('analyzing');
    setAnalysisMessage('Preparing photo for local analysis…');
    setScreen('reference');

    try {
      const prepared = await prepareAnalysisImage(asset.uri, asset.width, asset.height, 1280, 0.74);
      if (generation !== referencePrepareGenerationRef.current) {
        cleanupTemporaryUri(prepared.temporaryUri);
        return;
      }
      setAnalysisRequest({
        id: `ref-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        dataUrl: prepared.dataUrl,
        sourceUri: asset.uri,
        aspectRatio,
        lensHint: pickedLensHint ?? undefined,
        cleanupUris: prepared.temporaryUri ? [prepared.temporaryUri] : [],
      });
      setAnalysisMessage('Extracting contour + pose + face direction…');
    } catch (error) {
      if (generation !== referencePrepareGenerationRef.current) return;
      setAnalysisStatus('error');
      setAnalysisMessage(error instanceof Error ? error.message : 'Could not prepare the reference for local analysis.');
    }
  };

  const onOutlineResult = (request: OutlineAnalysisRequest, detection: PersonContourDetection) => {
    try {
      const nextGuide = buildGuideFromContour(detection, request.aspectRatio, request.sourceUri);
      nextGuide.visualStyle = selectedPresetRef.current;
      if (request.lensHint) nextGuide.lensHint = request.lensHint;
      setGuide(nextGuide);
      setAnalysisStatus('ready');
      const extras = [
        detection.poseLandmarks?.length ? 'pose' : null,
        detection.faceDirection ? `face ${detection.faceDirection}` : null,
      ].filter(Boolean).join(' · ');
      setAnalysisMessage(`Shared geometry ready · ${detection.contour.length} contour points${extras ? ` · ${extras}` : ''}`);
    } catch (error) {
      setAnalysisStatus('error');
      setAnalysisMessage(error instanceof Error ? error.message : 'Could not build a guide.');
    } finally {
      cleanupRequestFiles(request);
      setAnalysisRequest(null);
    }
  };

  const onOutlineError = (request: OutlineAnalysisRequest, message: string) => {
    cleanupRequestFiles(request);
    setAnalysisStatus('error');
    setAnalysisMessage(`${message} The editable fallback guide is still available.`);
    setAnalysisRequest(null);
  };

  const useSample = (sample: SampleReference) => {
    referencePrepareGenerationRef.current += 1;
    cleanupRequestFiles(analysisRequest);
    setAnalysisRequest(null);
    const nextGuide = cloneGuide(sample.guide);
    nextGuide.sourceUri = sample.imageUrl;
    nextGuide.aspectRatio = nextGuide.aspectRatio ?? 0.75;
    selectedPresetRef.current = nextGuide.visualStyle ?? 'sovs';
    setGuide(nextGuide);
    setReferenceUri(sample.imageUrl);
    setActiveSample(sample);
    setActiveTemplateTitle(null);
    setAnalysisStatus('preset');
    setAnalysisMessage('Template geometry ready · switch display mode without re-analyzing');
    setShowReference(true);
    setScreen('reference');
  };

  const useBenchmarkTemplate = (template: BenchmarkTemplate) => {
    referencePrepareGenerationRef.current += 1;
    cleanupRequestFiles(analysisRequest);
    setAnalysisRequest(null);
    const nextGuide = cloneGuide(template.guide);
    selectedPresetRef.current = template.defaultPreset;
    nextGuide.visualStyle = template.defaultPreset;
    setGuide(nextGuide);
    setReferenceUri(null);
    setActiveSample(null);
    setActiveTemplateTitle(template.title);
    setAnalysisStatus('preset');
    setAnalysisMessage(`${template.inspiredBy}-inspired pattern · recreated as our own normalized geometry`);
    setShowReference(false);
    setScreen('reference');
  };

  const updateTransform = (patch: Partial<GuideSpec['transform']>) => {
    setGuide((current) => ({ ...current, transform: { ...current.transform, ...patch } }));
  };
  const shiftGuide = (dx: number, dy: number) => updateTransform({
    dx: Math.max(-0.35, Math.min(0.35, guide.transform.dx + dx)),
    dy: Math.max(-0.35, Math.min(0.35, guide.transform.dy + dy)),
  });
  const scaleGuide = (factor: number) => updateTransform({
    scale: Math.max(0.55, Math.min(1.65, guide.transform.scale * factor)),
  });
  const resetTransform = () => updateTransform({ dx: 0, dy: 0, scale: 1 });

  const openCamera = async () => {
    if (analysisStatus === 'analyzing') {
      Alert.alert('Guide is still analyzing', 'Wait for the shared geometry to finish before opening the camera.');
      return;
    }
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) {
        Alert.alert('Camera permission required', 'Camera access is needed to line up the shot with the guide.');
        return;
      }
    }
    invalidateLiveSession();
    liveBusyRef.current = false;
    setCapturedUri(null);
    setCaptureSource(null);
    setAutoCaptureEnabled(false);
    setCameraReady(false);
    setCameraMountError('');
    setCameraViewport({ width: Math.max(1, width), height: Math.max(1, height) });
    setLiveError('');
    resetLiveStability();
    setLiveEnabled(liveCoachEligible);
    setScreen('camera');
  };

  const leaveCamera = () => {
    invalidateLiveSession();
    cleanupRequestFiles(liveRequest);
    setCameraReady(false);
    setLiveRequest(null);
    resetLiveStability();
    liveBusyRef.current = false;
    setScreen('reference');
  };

  const toggleLiveCoach = () => {
    if (!liveCoachEligible) return;
    invalidateLiveSession();
    resetLiveStability();
    cleanupRequestFiles(liveRequest);
    setLiveRequest(null);
    liveBusyRef.current = false;
    if (liveEnabled) {
      setAutoCaptureEnabled(false);
      setLiveError('');
      setLiveEnabled(false);
      return;
    }
    setLiveError('');
    setLiveEnabled(true);
  };

  const toggleAutoCapture = () => {
    if (!liveEnabled || !liveCoachEligible) return;
    const nextEnabled = !autoCaptureEnabled;
    setAutoCaptureEnabled(nextEnabled);
    setLiveError('');
    if (nextEnabled) {
      invalidateLiveSession();
      cleanupRequestFiles(liveRequest);
      setLiveRequest(null);
      liveBusyRef.current = false;
      resetLiveStability();
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    if (!cameraReady || cameraMountError) {
      setLiveError(cameraMountError || 'Camera is still starting. Wait for the preview to be ready.');
      return;
    }
    if (photoCaptureRef.current) {
      setLiveError('Camera is finishing another capture. Try the shutter again.');
      return;
    }
    invalidateLiveSession();
    cleanupRequestFiles(liveRequest);
    setLiveRequest(null);
    setLiveError('');
    photoCaptureRef.current = true;
    try {
      liveBusyRef.current = true;
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.92 });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        setCaptureSource('manual');
      }
    } catch {
      Alert.alert('Could not capture photo', 'Please check camera permission and try again.');
    } finally {
      photoCaptureRef.current = false;
      liveBusyRef.current = false;
    }
  };

  const onLiveResult = async (request: OutlineAnalysisRequest, detection: PersonContourDetection) => {
    if (!isCurrentLiveRequest(request)) {
      cleanupRequestFiles(request);
      return;
    }

    try {
      const liveGuide = buildGuideFromContour(detection, request.aspectRatio);
      const feedback = scorePortraitMatch(guide, liveGuide);
      const previousStability = matchStabilityRef.current;
      const nextStability = advanceMatchStability(previousStability, feedback);
      const shouldAutoCapture = liveCoachEligible
        && liveEnabled
        && autoCaptureEnabled
        && cameraReady
        && !cameraMountError
        && didEnterStableMatch(previousStability, nextStability);

      matchStabilityRef.current = nextStability;
      setMatchStability(nextStability);
      setLiveFeedback(feedback);
      setLiveError('');

      if (shouldAutoCapture && cameraRef.current && !photoCaptureRef.current) {
        photoCaptureRef.current = true;
        try {
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.92 });
          if (isCurrentLiveRequest(request) && photo?.uri) {
            setCapturedUri(photo.uri);
            setCaptureSource('auto');
          }
        } catch {
          if (isCurrentLiveRequest(request)) {
            setLiveError('Auto capture failed. Use the shutter to take the photo.');
          }
        } finally {
          photoCaptureRef.current = false;
        }
      }
    } catch (error) {
      if (isCurrentLiveRequest(request)) {
        resetLiveStability();
        setLiveError(error instanceof Error ? error.message : 'Could not match the live subject.');
      }
    } finally {
      cleanupRequestFiles(request);
      if (isCurrentLiveRequest(request)) {
        setLiveRequest(null);
        liveBusyRef.current = false;
      }
    }
  };

  const onLiveError = (request: OutlineAnalysisRequest, message: string) => {
    cleanupRequestFiles(request);
    if (!isCurrentLiveRequest(request)) return;
    resetLiveStability();
    setLiveError(message);
    setLiveRequest(null);
    liveBusyRef.current = false;
  };

  useEffect(() => {
    if (screen !== 'camera' || !cameraReady || !liveEnabled || !liveCoachEligible) return;
    let cancelled = false;
    const sampleFrame = async () => {
      if (cancelled || liveBusyRef.current || photoCaptureRef.current || !cameraRef.current) return;
      const sessionId = liveSessionRef.current;
      liveBusyRef.current = true;
      let sourceUri: string | null = null;
      let preparedUri: string | null = null;
      try {
        photoCaptureRef.current = true;
        let frame;
        try {
          frame = await cameraRef.current.takePictureAsync({ quality: 0.32, shutterSound: false });
        } finally {
          photoCaptureRef.current = false;
        }
        if (!frame?.uri) {
          if (sessionId === liveSessionRef.current) {
            liveBusyRef.current = false;
            resetLiveStability();
            setLiveError('Live analysis frame was unavailable.');
          }
          return;
        }
        sourceUri = frame.uri;
        const prepared = await prepareAnalysisImage(frame.uri, frame.width, frame.height, 720, 0.52);
        preparedUri = prepared.temporaryUri ?? null;
        if (cancelled || sessionId !== liveSessionRef.current) {
          cleanupTemporaryUri(sourceUri);
          cleanupTemporaryUri(preparedUri);
          return;
        }
        const request: OutlineAnalysisRequest = {
          id: `live-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          dataUrl: prepared.dataUrl,
          sourceUri: frame.uri,
          aspectRatio: frame.width && frame.height ? frame.width / frame.height : (guide.aspectRatio ?? 0.75),
          sessionId,
          cleanupUris: [sourceUri, preparedUri].filter((uri): uri is string => Boolean(uri)),
        };
        setLiveRequest(request);
      } catch (error) {
        cleanupTemporaryUri(sourceUri);
        cleanupTemporaryUri(preparedUri);
        if (sessionId === liveSessionRef.current) {
          liveBusyRef.current = false;
          if (!cancelled) {
            resetLiveStability();
            setLiveError(error instanceof Error ? error.message : 'Live sampling failed.');
          }
        }
      }
    };
    const first = setTimeout(sampleFrame, 700);
    const timer = setInterval(sampleFrame, 1700);
    return () => {
      cancelled = true;
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [screen, cameraReady, liveEnabled, liveCoachEligible, guide.aspectRatio, guide.transform.dx, guide.transform.dy, guide.transform.scale]);

  const analyzer = <PersonOutlineAnalyzer request={analysisRequest} onResult={onOutlineResult} onError={onOutlineError} />;
  const liveAnalyzer = <PersonOutlineAnalyzer request={liveRequest} onResult={onLiveResult} onError={onLiveError} />;

  const modeSelector = (
    <View style={styles.presetBlock}>
      <Text style={styles.presetHeading}>DISPLAY MODE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
        {availablePresets.map((preset) => {
          const active = (guide.visualStyle ?? 'sovs') === preset.key;
          return (
            <Pressable
              key={preset.key}
              onPress={() => setGuidePreset(preset.key)}
              style={[styles.presetButton, active && styles.presetButtonActive]}
            >
              <Text style={[styles.presetShort, active && styles.presetShortActive]}>{preset.shortLabel}</Text>
              <Text style={[styles.presetBrand, active && styles.presetBrandActive]}>{preset.benchmarkLabel}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={styles.presetDescription}>{activePreset.description}</Text>
    </View>
  );

  const adjustmentControls = (
    <View style={styles.controlPanel}>
      {modeSelector}
      {guide.kind === 'food' && (
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
          <Text style={styles.hero}>One shot. Four display modes.</Text>
          <Text style={styles.subhead}>Outline, Skeleton, Ghost and Guide are how we show a shot. Templates are the actual pose or composition you want to recreate.</Text>

          <Pressable style={styles.primaryButton} onPress={pickReference}>
            <Text style={styles.primaryButtonText}>Use my reference photo</Text>
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Instant photo examples</Text>
            <Text style={styles.sectionCaption}>Openly licensed reference photos with reusable guide geometry.</Text>
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

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Template library</Text>
            <Text style={styles.sectionCaption}>Choose a display mode, then a shot category. Large catalogs open to a focused subset.</Text>
          </View>
          <View style={styles.templateFilterRow}>
            {GUIDE_PRESETS.map((preset) => {
              const active = templateMode === preset.key;
              const count = BENCHMARK_TEMPLATES.filter((template) => template.defaultPreset === preset.key).length;
              return (
                <Pressable
                  key={preset.key}
                  onPress={() => setTemplateMode(preset.key)}
                  style={[styles.templateFilter, active && styles.templateFilterActive]}
                >
                  <Text style={[styles.templateFilterText, active && styles.templateFilterTextActive]}>{preset.shortLabel}</Text>
                  <Text style={[styles.templateFilterCount, active && styles.templateFilterCountActive]}>{count}</Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryFilterRow}>
            {templateCategoryOptions.map((category) => {
              const active = templateCategory === category;
              const count = category === 'All'
                ? modeTemplates.length
                : modeTemplates.filter((template) => templateCategoryLabel(template.category) === category).length;
              return (
                <Pressable
                  key={category}
                  onPress={() => setTemplateCategory(category)}
                  style={[styles.categoryFilter, active && styles.categoryFilterActive]}
                >
                  <Text style={[styles.categoryFilterText, active && styles.categoryFilterTextActive]}>{category}</Text>
                  <Text style={[styles.categoryFilterCount, active && styles.categoryFilterCountActive]}>{count}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.templateListWrap}>
            <FlatList
              horizontal
              data={filteredTemplates}
              keyExtractor={(template) => template.id}
              showsHorizontalScrollIndicator={false}
              initialNumToRender={5}
              maxToRenderPerBatch={6}
              windowSize={5}
              getItemLayout={(_, index) => ({ length: TEMPLATE_CARD_WIDTH, offset: TEMPLATE_CARD_EXTENT * index, index })}
              ItemSeparatorComponent={() => <View style={styles.templateSeparator} />}
              contentContainerStyle={styles.templateRow}
              renderItem={({ item: template }) => (
                <Pressable style={styles.templateCard} onPress={() => useBenchmarkTemplate(template)}>
                  <View style={styles.templatePreview}>
                    <GuideOverlay guide={template.guide} width={150} height={200} opacity={0.96} />
                  </View>
                  <Text style={styles.templateSource}>{getGuidePreset(template.defaultPreset).shortLabel} · {template.inspiredBy}</Text>
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <Text style={styles.templateCategory}>{templateCategoryLabel(template.category)}</Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.templateEmpty}>No templates in this category yet.</Text>}
            />
          </View>

          <View style={styles.howCard}>
            <View style={styles.howStep}><Text style={styles.howNumber}>1</Text><Text style={styles.howText}>Import a photo or choose a template.</Text></View>
            <View style={styles.howStep}><Text style={styles.howNumber}>2</Text><Text style={styles.howText}>Keep one shared geometry model: contour, joints, objects and composition annotations.</Text></View>
            <View style={styles.howStep}><Text style={styles.howNumber}>3</Text><Text style={styles.howText}>Choose Outline, Skeleton, Ghost or Guide depending on the shot.</Text></View>
          </View>
          <Text style={styles.note}>Commercial app screenshots are research references only; shipped templates use our own geometry.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'reference') {
    const statusTone = analysisStatus === 'ready' || analysisStatus === 'preset'
      ? styles.statusReady
      : analysisStatus === 'error' ? styles.statusError : styles.statusWorking;
    const isAnalyzing = analysisStatus === 'analyzing';
    return (
      <SafeAreaView style={styles.safe}>
        {analyzer}
        <StatusBar style="light" />
        <View style={styles.topBar}>
          <Pressable onPress={() => setScreen('home')}><Text style={styles.back}>‹ Library</Text></Pressable>
          <Text style={styles.topTitle}>{activeSample?.title ?? activeTemplateTitle ?? 'My reference'}</Text>
          <Pressable onPress={() => setShowReference((value) => !value)} disabled={!referenceUri}>
            <Text style={[styles.back, !referenceUri && styles.backDisabled]}>{showReference && referenceUri ? 'Guide only' : referenceUri ? 'Show photo' : 'Vector'}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.referenceContent}>
          <View style={[styles.preview, { width: previewWidth, height: previewHeight }]}>
            {referenceUri && showReference && <Image source={{ uri: referenceUri }} resizeMode="contain" style={StyleSheet.absoluteFillObject} />}
            {showReference && referenceUri && <View style={styles.referenceShade} />}
            <GuideOverlay guide={guide} width={previewWidth} height={previewHeight} />
            {(!showReference || !referenceUri) && <View style={styles.guideOnlyLabel}><Text style={styles.guideOnlyText}>GUIDE ONLY</Text></View>}
          </View>
          <View style={[styles.statusCard, statusTone]}>
            <Text style={styles.statusTitle}>
              {isAnalyzing ? 'Analyzing reference' : analysisStatus === 'ready' ? 'Shared geometry ready' : analysisStatus === 'error' ? 'Automatic guide unavailable' : 'Template ready'}
            </Text>
            <Text style={styles.statusText}>{analysisMessage || 'Choose how the geometry should be shown.'}</Text>
          </View>
          <View style={styles.referenceMeta}>
            <Text style={styles.referenceMetaTitle}>{activePreset.shortLabel}</Text>
            <Text style={styles.referenceMetaText}>{activePreset.description} · Inspired by {activePreset.benchmarkLabel}.</Text>
          </View>
          {adjustmentControls}
          <View style={styles.bottomActions}>
            <Pressable style={styles.secondaryButton} onPress={pickReference}><Text style={styles.secondaryText}>Choose photo</Text></Pressable>
            <Pressable style={[styles.primarySmall, isAnalyzing && styles.primarySmallDisabled]} onPress={openCamera} disabled={isAnalyzing}>
              <Text style={styles.primaryButtonText}>{isAnalyzing ? 'Analyzing…' : 'Open camera'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const stabilityProgress = stableMatchProgress(matchStability);
  const headlineScore = matchStability.sampleCount > 0
    ? matchStability.smoothedScore
    : liveFeedback?.score;
  const holdingForStable = Boolean(
    liveCoachEligible
      && liveEnabled
      && liveFeedback?.status === 'matched'
      && !matchStability.stableMatched,
  );

  const matchLabel = cameraMountError
    ? 'CAMERA ERROR'
    : guide.kind === 'portrait'
      ? !liveCoachEligible
        ? 'MANUAL GUIDE'
        : matchStability.stableMatched
          ? `${headlineScore ?? 0}% · STABLE`
          : liveFeedback
            ? holdingForStable
              ? `${headlineScore ?? liveFeedback.score}% · HOLD ${stabilityProgress.current}/${stabilityProgress.required}`
              : `${headlineScore ?? liveFeedback.score}% · ${liveFeedback.status.toUpperCase()}`
            : liveEnabled ? 'SCANNING…' : 'LIVE COACH OFF'
      : guide.kind === 'food' ? 'MATCH OBJECT GUIDE' : 'MATCH COMPOSITION GUIDE';

  const liveHint = cameraMountError
    ? 'Camera unavailable'
    : guide.kind === 'portrait'
      ? !liveCoachEligible
        ? 'Match the group manually'
        : liveError
          ? (liveError.toLowerCase().includes('capture') ? 'Capture unavailable' : 'Find the subject again')
          : matchStability.stableMatched
            ? '✓ Stable match'
            : holdingForStable
              ? 'Hold position'
              : (liveFeedback?.hint ?? 'Hold one person clearly inside the camera view.')
      : guide.kind === 'food' ? 'Match object size + spacing' : 'Line the scene up with the guide';

  const liveDetail = cameraMountError
    ? cameraMountError
    : guide.kind === 'portrait'
      ? !liveCoachEligible
        ? 'Live Coach and Auto Capture currently support one-person targets. Use the selected overlay for duo or group composition.'
        : liveError
          ? liveError
          : matchStability.stableMatched
            ? autoCaptureEnabled
              ? 'Stable match. Auto Capture fires once when each stable period begins.'
              : 'Composition stayed matched across samples. Ready to shoot.'
            : holdingForStable
              ? `Keep the pose steady for ${stabilityProgress.required - stabilityProgress.current} more matched sample.`
              : (liveFeedback?.detail ?? 'Sampled matching updates about every 1–2 seconds.')
      : guide.kind === 'food' ? 'Use the labeled zones as placement targets.' : 'Use the lines, zones, points and frames as composition anchors.';

  return (
    <SafeAreaView style={styles.cameraSafe}>
      {analyzer}
      {liveAnalyzer}
      <StatusBar style="light" />
      <View
        style={styles.cameraWrap}
        onLayout={({ nativeEvent: { layout } }) => {
          const nextWidth = Math.max(1, layout.width);
          const nextHeight = Math.max(1, layout.height);
          setCameraViewport((current) => (
            Math.abs(current.width - nextWidth) < 0.5 && Math.abs(current.height - nextHeight) < 0.5
              ? current
              : { width: nextWidth, height: nextHeight }
          ));
        }}
      >
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing="back"
          animateShutter={false}
          onCameraReady={() => {
            setCameraMountError('');
            setCameraReady(true);
          }}
          onMountError={(event) => {
            invalidateLiveSession();
            setCameraReady(false);
            setCameraMountError(event.message || 'Camera preview could not start.');
            setLiveError(event.message || 'Camera preview could not start.');
            resetLiveStability();
            liveBusyRef.current = false;
          }}
        />
        <GuideOverlay guide={guide} width={cameraViewport.width} height={cameraViewport.height} opacity={0.99} />

        <Pressable
          style={[styles.liveBadge, matchStability.stableMatched && styles.liveBadgeMatched]}
          onPress={() => liveCoachEligible && toggleLiveCoach()}
          disabled={!liveCoachEligible || Boolean(cameraMountError)}
        >
          <Text style={styles.liveBadgeText}>{matchLabel}</Text>
          {liveCoachEligible && <Text style={styles.liveBadgeSub}>LIVE COACH · SAMPLED</Text>}
        </Pressable>

        {liveCoachEligible && (
          <Pressable
            style={[
              styles.autoCaptureBadge,
              autoCaptureEnabled && styles.autoCaptureBadgeActive,
              (!liveEnabled || Boolean(cameraMountError)) && styles.autoCaptureBadgeDisabled,
            ]}
            onPress={toggleAutoCapture}
            disabled={!liveEnabled || Boolean(cameraMountError)}
          >
            <Text style={[styles.autoCaptureText, autoCaptureEnabled && styles.autoCaptureTextActive]}>
              AUTO {autoCaptureEnabled ? 'ON' : 'OFF'}
            </Text>
          </Pressable>
        )}

        {guide.kind === 'portrait' && (
          <View style={styles.cameraPresetWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cameraPresetRow}>
              {availablePresets.map((preset) => {
                const active = (guide.visualStyle ?? 'sovs') === preset.key;
                return (
                  <Pressable key={preset.key} onPress={() => setGuidePreset(preset.key)} style={[styles.cameraPresetButton, active && styles.cameraPresetButtonActive]}>
                    <Text style={[styles.cameraPresetText, active && styles.cameraPresetTextActive]}>{preset.shortLabel}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {liveFeedback && liveCoachEligible && (
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
            <Text style={styles.capturedText}>{captureSource === 'auto' ? 'Auto captured' : 'Captured'}</Text>
          </View>
        )}

        <View style={styles.cameraBottom}>
          <Pressable style={styles.cameraSideButton} onPress={leaveCamera}><Text style={styles.cameraSideText}>Guide</Text></Pressable>
          <Pressable
            style={[
              styles.shutterOuter,
              matchStability.stableMatched && styles.shutterMatched,
              (!cameraReady || Boolean(cameraMountError)) && styles.shutterDisabled,
            ]}
            onPress={takePhoto}
            disabled={!cameraReady || Boolean(cameraMountError)}
          >
            <View style={styles.shutterInner} />
          </Pressable>
          <Pressable
            style={styles.cameraSideButton}
            onPress={() => liveCoachEligible ? toggleLiveCoach() : resetTransform()}
            disabled={liveCoachEligible && Boolean(cameraMountError)}
          >
            <Text style={styles.cameraSideText}>{liveCoachEligible ? (liveEnabled ? 'AI On' : 'AI Off') : 'Reset'}</Text>
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
  subhead: { color: '#A7ABB4', fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 620, marginTop: 14 },
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
  templateFilterRow: { width: '100%', maxWidth: 920, flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  templateFilter: { minWidth: 92, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 14, backgroundColor: '#17191E', borderWidth: 1, borderColor: '#2B2F36' },
  templateFilterActive: { backgroundColor: '#F8FF61', borderColor: '#F8FF61' },
  templateFilterText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  templateFilterTextActive: { color: '#111315' },
  templateFilterCount: { color: '#747983', fontSize: 10, fontWeight: '900' },
  templateFilterCountActive: { color: '#4D5117' },
  categoryFilterRow: { gap: 7, paddingHorizontal: 2, paddingBottom: 12 },
  categoryFilter: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: '#121419', borderWidth: 1, borderColor: '#272B32' },
  categoryFilterActive: { backgroundColor: '#2B2E19', borderColor: '#F8FF61' },
  categoryFilterText: { color: '#A7ABB4', fontSize: 10, fontWeight: '800' },
  categoryFilterTextActive: { color: '#FFF' },
  categoryFilterCount: { color: '#666B74', fontSize: 9, fontWeight: '900' },
  categoryFilterCountActive: { color: '#F8FF61' },
  templateListWrap: { width: '100%', maxWidth: 920, minHeight: 286 },
  templateRow: { paddingHorizontal: 2, paddingBottom: 4 },
  templateSeparator: { width: TEMPLATE_CARD_GAP },
  templateCard: { width: TEMPLATE_CARD_WIDTH, minHeight: 286, borderRadius: 20, padding: 11, backgroundColor: '#14161A', borderWidth: 1, borderColor: '#292D34' },
  templatePreview: { width: 150, height: 200, borderRadius: 14, overflow: 'hidden', alignSelf: 'center', backgroundColor: '#08090A' },
  templateSource: { color: '#F8FF61', fontSize: 8, fontWeight: '900', letterSpacing: 0.7, marginTop: 10 },
  templateTitle: { color: '#FFF', fontSize: 15, fontWeight: '900', marginTop: 3 },
  templateCategory: { color: '#7D828C', fontSize: 9, marginTop: 3 },
  templateEmpty: { color: '#777C86', fontSize: 12, paddingVertical: 28, paddingHorizontal: 6 },
  howCard: { width: '100%', maxWidth: 650, marginTop: 30, padding: 18, borderRadius: 20, backgroundColor: '#15171B', borderWidth: 1, borderColor: '#24272E', gap: 14 },
  howStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  howNumber: { width: 28, height: 28, textAlign: 'center', lineHeight: 28, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F8FF61', color: '#111315', fontWeight: '900' },
  howText: { flex: 1, color: '#D4D6DA', fontSize: 14, lineHeight: 20 },
  note: { color: '#686D76', fontSize: 12, textAlign: 'center', maxWidth: 620, marginTop: 24 },
  topBar: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, gap: 10 },
  back: { color: '#F8FF61', fontSize: 14, fontWeight: '800' },
  backDisabled: { color: '#555A63' },
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
  presetBlock: { gap: 8 },
  presetHeading: { color: '#F8FF61', fontSize: 10, fontWeight: '900', letterSpacing: 0.9 },
  presetRow: { gap: 8, paddingRight: 4 },
  presetButton: { minWidth: 112, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 14, backgroundColor: '#17191E', borderWidth: 1, borderColor: '#2B2F36' },
  presetButtonActive: { backgroundColor: '#F8FF61', borderColor: '#F8FF61' },
  presetShort: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  presetShortActive: { color: '#111315' },
  presetBrand: { color: '#777C86', fontSize: 9, fontWeight: '700', marginTop: 2 },
  presetBrandActive: { color: '#4D5117' },
  presetDescription: { color: '#999EA8', fontSize: 11, lineHeight: 17 },
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
  autoCaptureBadge: { position: 'absolute', top: 22, right: 12, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  autoCaptureBadgeActive: { backgroundColor: '#F8FF61', borderColor: '#F8FF61' },
  autoCaptureBadgeDisabled: { opacity: 0.38 },
  autoCaptureText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  autoCaptureTextActive: { color: '#111315' },
  cameraPresetWrap: { position: 'absolute', top: 78, left: 12, right: 12, height: 40 },
  cameraPresetRow: { gap: 7, paddingHorizontal: 2, alignItems: 'center' },
  cameraPresetButton: { minWidth: 70, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.58)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  cameraPresetButtonActive: { backgroundColor: '#F8FF61', borderColor: '#F8FF61' },
  cameraPresetText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  cameraPresetTextActive: { color: '#111315' },
  scoreStrip: { position: 'absolute', top: 122, alignSelf: 'center', flexDirection: 'row', gap: 6, backgroundColor: 'rgba(0,0,0,0.58)', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12 },
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
  shutterDisabled: { opacity: 0.35 },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#F8FF61' },
});