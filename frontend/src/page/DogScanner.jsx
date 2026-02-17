import React, { useState, useRef, useEffect } from 'react';
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

const API_URL = 'http://127.0.0.1:5000';

const DogScanner = ({ user, setUser }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dogscanner');
  const [scanMode, setScanMode] = useState('breed');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [modelInfo, setModelInfo] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/health`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setModelInfo({
          diseaseModelType: data.disease_model_type || 'standard',
          diseaseInputSize: data.disease_input_size || 224,
          ageModelType: data.age_model_type || 'unknown',
          numBreeds: data.num_breeds || 0,
          numAges: data.num_ages || 0,
          numEmotions: data.num_emotions || 0,
          numDiseases: data.num_diseases || 0,
          breedModelLoaded: data.breed_model_loaded,
          ageModelLoaded: data.age_model_loaded,
          emotionModelLoaded: data.emotion_model_loaded,
          diseaseModelLoaded: data.disease_model_loaded,
          kerasVersion: data.keras_version || 'unknown',
          tfVersion: data.tensorflow_version || 'unknown'
        });

        console.log('📊 Backend Health Check:', {
          breedModel: data.breed_model_loaded ? '✅' : '❌',
          ageModel: data.age_model_loaded ? '✅' : '❌',
          ageModelType: data.age_model_type,
          emotionModel: data.emotion_model_loaded ? '✅' : '❌',
          diseaseModel: data.disease_model_loaded ? '✅' : '❌',
          modelType: data.disease_model_type,
          database: data.database_connected ? '✅' : '❌',
        });

        let currentModeOk = true;
        if (scanMode === 'breed' && !data.breed_model_loaded) {
          currentModeOk = false;
          setError('Breed detection model not loaded. Please check backend logs.');
        } else if (scanMode === 'disease' && !data.disease_model_loaded) {
          currentModeOk = false;
          setError('Disease detection model not loaded. Please train the model first.');
        }

        if (currentModeOk && data.database_connected) setBackendStatus('connected');
        else if (currentModeOk && !data.database_connected) setBackendStatus('no-db');
        else setBackendStatus('model-error');
      } else {
        setBackendStatus('error');
      }
    } catch (err) {
      console.error('Backend connection error:', err);
      setBackendStatus('offline');
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, JPEG)');
      return;
    }
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setPredictions(null);
    setError(null);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const analyzeDog = async () => {
    if (!selectedImage) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      if (user?.email) {
        formData.append('user_email', user.email);
        if (user.id) formData.append('user_id', user.id);
      }

      const endpoint = scanMode === 'breed' ? '/predict/breed' : '/predict/disease';
      console.log(`🔮 Sending request to: ${API_URL}${endpoint}`);

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log(`📥 ${scanMode} response:`, data);

      if (response.ok && data.success) {
        setPredictions(data);
      } else {
        setError(data.error || 'Prediction failed. Please try again.');
        console.error('❌ Prediction error:', data);
      }
    } catch (err) {
      console.error('❌ API Error:', err);
      setError('Failed to connect to backend. Make sure the Flask server is running on http://127.0.0.1:5000');
      setBackendStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setPredictions(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const switchMode = (mode) => {
    setScanMode(mode);
    setPredictions(null);
    setError(null);
    checkBackendConnection();
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getSeverityColor = (severity) => {
    if (!severity) return 'text-gray-600';
    const lower = severity.toLowerCase();
    if (lower.includes('severe')) return 'text-red-600';
    if (lower.includes('moderate')) return 'text-orange-600';
    if (lower.includes('none')) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getUrgencyColor = (urgency) => {
    if (!urgency) return 'text-gray-600';
    const lower = urgency.toLowerCase();
    if (lower.includes('immediate') || lower.includes('urgent')) return 'text-red-600';
    if (lower.includes('moderate')) return 'text-orange-600';
    if (lower.includes('low') || lower.includes('routine') || lower.includes('none')) return 'text-green-600';
    return 'text-gray-600';
  };

  const getEmotionEmoji = (emotion) => ({
    happy: '😊', sad: '😢', angry: '😠', relaxed: '😌',
    neutral: '😐', fearful: '😰', surprised: '😲'
  })[emotion?.toLowerCase()] || '🐕';

  const getAgeEmoji = (age) => ({
    young: '🐶', adult: '🐕', senior: '🦴'
  })[age?.toLowerCase()] || '🐕';

  const getModelBadge = () => {
    if (scanMode === 'disease' && modelInfo) {
      const t = modelInfo.diseaseModelType;
      const colorClass =
        t?.startsWith('mobilenetv2') ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
        : t?.startsWith('efficientnet') ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
        : 'bg-gray-200 text-gray-700';
      return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          <span>{t?.toUpperCase().replace(/_/g, ' ')} • Transfer Learning • {modelInfo.diseaseInputSize}x{modelInfo.diseaseInputSize}</span>
        </div>
      );
    }

    if (scanMode === 'breed' && modelInfo) {
      const isFast = modelInfo.ageModelType === 'mobilenetv2_fast';
      return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
          isFast ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                 : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
        }`}>
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          <span>
            BREED{modelInfo.ageModelLoaded ? ` + AGE${isFast ? ' ⚡FAST' : ''}` : ''}
            {modelInfo.ageModelLoaded && modelInfo.emotionModelLoaded ? ' + ' : ''}
            {modelInfo.emotionModelLoaded ? 'EMOTION' : ''} AI
            {' '}• {isFast ? 'MobileNetV2 FAST' : 'Transfer Learning'}
          </span>
        </div>
      );
    }
    return null;
  };

  const getBackendStatusDisplay = () => {
    switch (backendStatus) {
      case 'checking':
        return <span className="text-gray-600">Checking backend...</span>;
      case 'connected':
        return (
          <>
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-600">Backend & Database Connected</span>
            {modelInfo?.diseaseModelType && scanMode === 'disease' && (
              <span className="text-purple-600 font-semibold">
                • {modelInfo.diseaseModelType.replace(/_/g, ' ').toUpperCase()} Active
              </span>
            )}
            {modelInfo?.ageModelLoaded && scanMode === 'breed' && (
              <span className="text-green-600 font-semibold">
                • Age: {modelInfo.ageModelType === 'mobilenetv2_fast' ? '⚡ FAST'
                       : modelInfo.ageModelType === 'efficientnet_limited' ? 'Limited (200)'
                       : 'Full Model'}
              </span>
            )}
          </>
        );
      case 'no-db':
        return (
          <>
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            <span className="text-yellow-600">Backend Connected (No Database)</span>
          </>
        );
      case 'offline':
        return (
          <>
            <span className="w-2 h-2 bg-red-400 rounded-full"></span>
            <span className="text-red-600">Backend Offline</span>
          </>
        );
      case 'model-error':
        return (
          <>
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
            <span className="text-orange-600">Model Not Loaded</span>
          </>
        );
      default:
        return null;
    }
  };

  // ── Disease results: normalise the flat backend response into a top_prediction shape ──
  // Backend sends: top_disease, top_disease_name, top_confidence, severity, treatment,
  //                symptoms, contagious, urgency, description, all_diseases[]
  const normaliseDiseaseResponse = (data) => {
    if (!data) return null;

    // Already in old shape (shouldn't happen, but guard)
    if (data.top_prediction) return data;

    // Build a unified top_prediction object from flat fields
    const top_prediction = {
      disease: data.top_disease,
      name: data.top_disease_name || data.top_disease,
      confidence: data.top_confidence,
      description: data.description || '',
      severity: data.severity || 'Unknown',
      treatment: data.treatment || '',
      symptoms: data.symptoms || [],
      contagious: data.contagious ?? false,
      urgency: data.urgency || 'Unknown',
    };

    // all_diseases from backend, fallback to predictions array
    const all_predictions = (data.all_diseases || data.predictions || []).map(d => ({
      disease: d.disease,
      name: d.name || d.disease,
      confidence: d.confidence,
      severity: d.severity || 'Unknown',
      description: d.description || '',
      treatment: d.treatment || '',
      symptoms: d.symptoms || [],
      contagious: d.contagious ?? false,
      urgency: d.urgency || 'Unknown',
    }));

    return {
      ...data,
      top_prediction,
      all_predictions,
    };
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const diseaseData = scanMode === 'disease' ? normaliseDiseaseResponse(predictions) : null;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar sidebarOpen={sidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} setUser={setUser} />

        <main className="flex-1 overflow-auto bg-white py-12 px-4">
          <div className="max-w-4xl mx-auto">

            {/* ── Page header ── */}
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-800 mb-3">
                🐕 {scanMode === 'breed' ? 'Breed, Age & Emotion Detection' : 'Skin Disease Detection'}
              </h1>
              <p className="text-lg text-gray-700 mb-6">
                {scanMode === 'breed'
                  ? 'Identify breed, age category, and emotion in one comprehensive scan'
                  : 'Detect skin diseases using AI-powered Transfer Learning'}
              </p>

              {/* Mode switcher */}
              <div className="inline-flex bg-gray-100 rounded-xl p-1 mb-4">
                {['breed', 'disease'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => switchMode(mode)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                      scanMode === mode ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {mode === 'breed' ? '🐶 Breed ID' : '🏥 Disease'}
                  </button>
                ))}
              </div>

              <div className="mb-3">{getModelBadge()}</div>
              <div className="flex items-center justify-center gap-2 text-sm">{getBackendStatusDisplay()}</div>
            </div>

            {/* ── Card ── */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
              {!previewUrl ? (
                /* Upload area */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  className={`border-4 border-dashed rounded-2xl p-16 text-center cursor-pointer
                    transition-all duration-300
                    ${isDragging
                      ? 'border-purple-600 bg-purple-50 scale-105'
                      : 'border-purple-300 bg-purple-50/50 hover:border-purple-500 hover:bg-purple-50'
                    }`}
                >
                  <div className="text-7xl mb-6">{scanMode === 'breed' ? '📸' : '🔬'}</div>
                  <div className="text-2xl font-semibold text-purple-600 mb-2">Click to upload or drag and drop</div>
                  <div className="text-gray-500">
                    {scanMode === 'breed'
                      ? 'Upload a photo of a dog to identify breed, age & emotion'
                      : 'Upload a photo of dog skin to detect potential diseases'}
                  </div>
                  <div className="text-gray-400 text-sm mt-2">Supports JPG, JPEG, PNG</div>
                  {scanMode === 'breed' && modelInfo?.ageModelLoaded && (
                    <div className="mt-4 inline-block bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
                      <p className="text-purple-700 text-sm font-medium">
                        ✨ Multi-model AI: Breed + Age {modelInfo.ageModelType === 'mobilenetv2_fast' && '⚡'} + Emotion
                      </p>
                    </div>
                  )}
                  {user?.email && (
                    <div className="text-green-600 text-sm mt-3 font-medium">✓ Scan will be saved to your history</div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Preview */}
                  <img src={previewUrl} alt="Preview" className="w-full max-h-96 object-contain rounded-2xl shadow-lg" />

                  {/* Analyse button */}
                  {!predictions && !loading && (
                    <button
                      onClick={analyzeDog}
                      disabled={backendStatus === 'offline' || backendStatus === 'model-error'}
                      className={`w-full py-4 px-8 rounded-xl text-xl font-semibold shadow-lg transition-all duration-200 ${
                        backendStatus === 'connected' || backendStatus === 'no-db'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:scale-105 hover:shadow-xl'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {scanMode === 'breed' ? '🔍 Analyze Breed, Age & Emotion' : '🔬 Detect Skin Disease'}
                    </button>
                  )}

                  {/* Spinner */}
                  {loading && (
                    <div className="text-center py-12">
                      <div className="inline-block w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-xl text-purple-600 font-medium">
                        {scanMode === 'breed' ? 'Analyzing breed, age & emotion...' : 'Analyzing skin condition...'}
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="bg-red-500 text-white p-5 rounded-xl shadow-lg">
                      <p className="font-semibold mb-2">❌ Error</p>
                      <p className="text-sm whitespace-pre-line">{error}</p>
                      <div className="flex gap-2 mt-3">
                        <button onClick={checkBackendConnection} className="px-4 py-2 bg-white text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition">
                          Retry Connection
                        </button>
                        <button onClick={reset} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
                          Try Another Image
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ══════════════════════════════════════════════════════
                      BREED + AGE + EMOTION RESULTS
                  ══════════════════════════════════════════════════════ */}
                  {predictions && scanMode === 'breed' && predictions.predictions && (
                    <div className="space-y-6">
                      {predictions.scan_id && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
                          <p className="text-sm text-green-800 font-medium">✅ Scan saved (ID: {predictions.scan_id})</p>
                        </div>
                      )}

                      {/* Breed */}
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">🐕 Breed Identification</h2>
                        {predictions.predictions.map((pred, index) => (
                          <div key={index} className={`p-4 rounded-xl mb-3 transition-all ${
                            index === 0
                              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                              : 'bg-white text-gray-800 border border-gray-100'
                          }`}>
                            <div className="flex justify-between items-center">
                              <span className={`font-semibold ${index === 0 ? 'text-base flex items-center gap-2' : 'text-sm'}`}>
                                {index === 0 && '👑'} {pred.breed}
                              </span>
                              <span className={`font-bold ${index === 0 ? 'text-base' : 'text-sm'}`}>
                                {pred.confidence.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Age */}
                      {predictions.age ? (
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
                          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                            {getAgeEmoji(predictions.age.age)} Age Category
                            {predictions.age.model_type === 'mobilenetv2_fast' && (
                              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">⚡ FAST</span>
                            )}
                            {predictions.age.model_type === 'efficientnet_limited' && (
                              <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">200</span>
                            )}
                          </h2>
                          <div className="flex justify-between items-center mb-6">
                            <div>
                              <p className="text-4xl font-bold capitalize text-gray-800">{predictions.age.age}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                {predictions.age.model_type === 'mobilenetv2_fast' ? 'MobileNetV2 FAST model'
                                  : predictions.age.model_type === 'efficientnet_limited' ? 'Limited dataset (200 images)'
                                  : 'EfficientNetB0 full model'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-4xl font-bold text-gray-800">{predictions.age.confidence?.toFixed(1)}%</p>
                              <p className="text-xs text-gray-500">confidence</p>
                            </div>
                          </div>
                          {predictions.age.all_probabilities && (
                            <div className="space-y-2 mb-5">
                              {Object.entries(predictions.age.all_probabilities).sort((a, b) => b[1] - a[1]).map(([age, prob]) => (
                                <div key={age}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="capitalize font-medium flex items-center gap-1.5 text-gray-700">{getAgeEmoji(age)} {age}</span>
                                    <span className="font-bold text-sm text-gray-800">{prob.toFixed(1)}%</span>
                                  </div>
                                  <div className="bg-blue-100 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-500 to-cyan-600 h-full rounded-full transition-all duration-500" style={{ width: `${prob}%` }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="bg-blue-100 rounded-lg p-3 text-xs leading-relaxed">
                            <p className="text-gray-700">
                              💡 <strong>Categories:</strong> Young (puppies & juveniles), Adult (prime years), Senior (elderly dogs)
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4 text-center">
                          <p className="text-gray-600 text-sm">⚠️ Age detection not available (model not loaded or low confidence)</p>
                        </div>
                      )}

                      {/* Emotion */}
                      {predictions.emotion && (
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                          <h2 className="text-xl font-bold mb-4 text-gray-800">😊 Emotion Detected</h2>
                          <div className="flex justify-between items-center mb-6">
                            <div>
                              <p className="text-4xl font-bold capitalize text-gray-800">{predictions.emotion.emotion}</p>
                              <p className="text-xs text-gray-600 mt-1">Primary emotion detected</p>
                            </div>
                            <div className="text-right">
                              <p className="text-4xl font-bold text-gray-800">{predictions.emotion.confidence.toFixed(1)}%</p>
                              <p className="text-xs text-gray-500">confidence</p>
                            </div>
                          </div>
                          {predictions.emotion.all_probabilities && (
                            <div className="space-y-2 mb-5">
                              {Object.entries(predictions.emotion.all_probabilities).sort((a, b) => b[1] - a[1]).map(([emotion, prob]) => (
                                <div key={emotion}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="capitalize font-medium flex items-center gap-1.5 text-gray-700">{getEmotionEmoji(emotion)} {emotion}</span>
                                    <span className="font-bold text-sm text-gray-800">{prob.toFixed(1)}%</span>
                                  </div>
                                  <div className="bg-purple-100 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${prob}%` }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="bg-purple-100 rounded-lg p-3 text-xs leading-relaxed">
                            <p className="text-gray-700">
                              💡 <strong>Tip:</strong> Emotion detection is for general awareness. Your dog's state varies by environment, health, and recent activities.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ══════════════════════════════════════════════════════
                      DISEASE RESULTS  (uses normalised diseaseData)
                  ══════════════════════════════════════════════════════ */}
                  {diseaseData && scanMode === 'disease' && diseaseData.top_prediction && (
                    <div className="space-y-6">
                      {diseaseData.scan_id && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
                          <p className="text-sm text-green-800 font-medium">✅ Scan saved (ID: {diseaseData.scan_id})</p>
                        </div>
                      )}

                      {/* Status banner */}
                      <div className={`p-6 rounded-2xl text-center ${
                        diseaseData.is_healthy
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                          : 'bg-gradient-to-r from-orange-500 to-red-600'
                      } text-white shadow-lg`}>
                        <div className="text-5xl mb-3">{diseaseData.is_healthy ? '✅' : '⚠️'}</div>
                        <h2 className="text-2xl font-bold mb-2">{diseaseData.is_healthy ? 'Healthy Skin!' : 'Potential Issue Detected'}</h2>
                        <p className="text-white/90">{diseaseData.recommendation}</p>
                      </div>

                      {/* Primary detection */}
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Primary Detection</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-2xl font-bold text-purple-600 mb-1">{diseaseData.top_prediction.name}</p>
                              <p className="text-sm text-gray-600 mb-2">{diseaseData.top_prediction.description}</p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-3xl font-bold text-purple-600">{diseaseData.top_prediction.confidence.toFixed(1)}%</p>
                              <p className={`text-sm font-semibold ${getSeverityColor(diseaseData.top_prediction.severity)}`}>
                                {diseaseData.top_prediction.severity}
                              </p>
                            </div>
                          </div>

                          <div className="bg-white/50 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${diseaseData.top_prediction.confidence}%` }}
                            />
                          </div>

                          {diseaseData.top_prediction.symptoms?.length > 0 && (
                            <div className="mt-4 bg-white rounded-xl p-4">
                              <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">🔍 Common Symptoms:</p>
                              <ul className="text-gray-700 text-sm space-y-1 ml-6 list-disc">
                                {diseaseData.top_prediction.symptoms.map((s, i) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                          )}

                          {!diseaseData.is_healthy && diseaseData.top_prediction.treatment && (
                            <div className="mt-4 bg-white rounded-xl p-4">
                              <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">💊 Recommended Treatment:</p>
                              <p className="text-gray-700 text-sm">{diseaseData.top_prediction.treatment}</p>
                            </div>
                          )}

                          {!diseaseData.is_healthy && (
                            <div className="mt-4 grid grid-cols-2 gap-3">
                              {diseaseData.top_prediction.urgency && (
                                <div className="bg-white rounded-xl p-3">
                                  <p className="text-xs text-gray-600 mb-1">Urgency Level</p>
                                  <p className={`text-sm font-bold ${getUrgencyColor(diseaseData.top_prediction.urgency)}`}>
                                    {diseaseData.top_prediction.urgency}
                                  </p>
                                </div>
                              )}
                              {diseaseData.top_prediction.contagious !== undefined && (
                                <div className="bg-white rounded-xl p-3">
                                  <p className="text-xs text-gray-600 mb-1">Contagious</p>
                                  <p className={`text-sm font-bold ${diseaseData.top_prediction.contagious ? 'text-red-600' : 'text-green-600'}`}>
                                    {diseaseData.top_prediction.contagious ? '⚠️ Yes' : '✅ No'}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Other possibilities */}
                      {diseaseData.all_predictions?.length > 1 && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-3">Other Possibilities</h3>
                          <div className="space-y-2">
                            {diseaseData.all_predictions.slice(1).map((pred, index) => (
                              <div key={index} className="bg-gray-50 hover:bg-gray-100 p-4 rounded-xl transition-all">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-semibold text-gray-800">{pred.name}</p>
                                    <p className={`text-xs ${getSeverityColor(pred.severity)}`}>{pred.severity}</p>
                                  </div>
                                  <p className="text-lg font-bold text-gray-600">{pred.confidence.toFixed(1)}%</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Disclaimer */}
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <span className="font-semibold">⚠️ Important:</span> This is an AI-powered analysis and should not replace professional veterinary diagnosis.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Reset */}
                  <button
                    onClick={reset}
                    className="w-full bg-white border-2 border-purple-600 text-purple-600 py-3 px-6 rounded-xl text-lg font-semibold hover:bg-purple-600 hover:text-white transform hover:scale-105 transition-all duration-200"
                  >
                    Upload Another Photo
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-gray-600">
              <p className="text-sm">
                {scanMode === 'breed'
                  ? `Powered by TensorFlow • ${modelInfo?.numBreeds || 121} Breeds • ${modelInfo?.numAges || 3} Ages • ${modelInfo?.numEmotions || 4} Emotions`
                  : `Powered by TensorFlow • ${modelInfo?.numDiseases || 6} Disease Categories`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {modelInfo?.ageModelLoaded && scanMode === 'breed'
                  ? `Multi-Model AI • ${modelInfo.ageModelType === 'mobilenetv2_fast' ? 'MobileNetV2 FAST ⚡'
                      : modelInfo.ageModelType === 'efficientnet_limited' ? 'Limited Age Model'
                      : 'EfficientNetB0 Age Model'} • Database Enabled`
                  : 'Advanced AI Detection • Database Enabled • Keras 3 Compatible'}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DogScanner;