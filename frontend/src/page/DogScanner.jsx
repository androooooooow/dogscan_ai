import React, { useState, useRef, useEffect } from 'react';
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

// ✅ KB5074109 FIX: Use 127.0.0.1 instead of localhost
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
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        const breedModelLoaded = data.breed_model_loaded;
        const diseaseModelLoaded = data.disease_model_loaded;
        const emotionModelLoaded = data.emotion_model_loaded;
        const dbConnected = data.database_connected;
        
        setModelInfo({
          diseaseModelType: data.disease_model_type || 'standard',
          diseaseInputSize: data.disease_input_size || 224,
          numBreeds: data.num_breeds || 0,
          numEmotions: data.num_emotions || 0,
          numDiseases: data.num_diseases || 0,
          breedModelLoaded: breedModelLoaded,
          emotionModelLoaded: emotionModelLoaded,
          diseaseModelLoaded: diseaseModelLoaded,
          kerasVersion: data.keras_version || 'unknown',
          tfVersion: data.tensorflow_version || 'unknown'
        });
        
        console.log('📊 Backend Health Check:', {
          breedModel: breedModelLoaded ? '✅' : '❌',
          emotionModel: emotionModelLoaded ? '✅' : '❌',
          diseaseModel: diseaseModelLoaded ? '✅' : '❌',
          modelType: data.disease_model_type,
          database: dbConnected ? '✅' : '❌',
          diseases: data.num_diseases
        });
        
        // Check if current mode's model is loaded
        let currentModeOk = true;
        if (scanMode === 'breed' && !breedModelLoaded) {
          currentModeOk = false;
          setError('Breed detection model not loaded. Please check backend logs.');
        } else if (scanMode === 'emotion' && !emotionModelLoaded) {
          currentModeOk = false;
          setError('Emotion detection model not loaded. Please train the model first.');
        } else if (scanMode === 'disease' && !diseaseModelLoaded) {
          currentModeOk = false;
          setError('Disease detection model not loaded. Please train the model first using: python train_dog_skin_disease.py');
        }
        
        if (currentModeOk && dbConnected) {
          setBackendStatus('connected');
        } else if (currentModeOk && !dbConnected) {
          setBackendStatus('no-db');
        } else {
          setBackendStatus('model-error');
        }
      } else {
        setBackendStatus('error');
      }
    } catch (err) {
      console.error('Backend connection error:', err);
      setBackendStatus('offline');
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
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

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const analyzeDog = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError(null);

    try {
      if (scanMode === 'breed') {
        // Call BOTH breed and emotion endpoints
        console.log('🔮 Sending requests for breed + emotion detection...');
        
        // Create FormData for breed request
        const breedFormData = new FormData();
        breedFormData.append('image', selectedImage);
        if (user && user.email) {
          breedFormData.append('user_email', user.email);
          if (user.id) {
            breedFormData.append('user_id', user.id);
          }
        }
        
        // Call breed endpoint
        const breedResponse = await fetch(`${API_URL}/predict/breed`, {
          method: 'POST',
          body: breedFormData,
        });
        const breedData = await breedResponse.json();
        
        // Call emotion endpoint (if model is loaded)
        let emotionData = null;
        if (modelInfo?.emotionModelLoaded) {
          const emotionFormData = new FormData();
          emotionFormData.append('image', selectedImage);
          if (user && user.email) {
            emotionFormData.append('user_email', user.email);
            if (user.id) {
              emotionFormData.append('user_id', user.id);
            }
          }
          
          try {
            const emotionResponse = await fetch(`${API_URL}/predict/emotion`, {
              method: 'POST',
              body: emotionFormData,
            });
            emotionData = await emotionResponse.json();
            console.log('📥 Emotion Response:', emotionData);
          } catch (emotionErr) {
            console.warn('⚠️ Emotion detection failed:', emotionErr);
          }
        }
        
        // Combine results
        if (breedResponse.ok && breedData.success) {
          const combinedData = {
            ...breedData,
            breed_predictions: breedData.predictions,
            emotion: emotionData && emotionData.success ? {
              emotion: emotionData.top_emotion,
              confidence: emotionData.top_confidence,
              all_probabilities: emotionData.predictions ? 
                Object.fromEntries(
                  emotionData.predictions.map(p => [p.emotion, p.confidence])
                ) : {},
              scan_id: emotionData.scan_id
            } : { emotion: 'unavailable' }
          };
          
          setPredictions(combinedData);
          console.log('✅ Combined breed + emotion results:', combinedData);
        } else {
          let errorMessage = breedData.error || 'Breed prediction failed. Please try again.';
          setError(errorMessage);
          console.error('❌ Breed prediction error:', breedData);
        }
        
      } else if (scanMode === 'disease') {
        // Create FormData for disease request
        const formData = new FormData();
        formData.append('image', selectedImage);
        if (user && user.email) {
          formData.append('user_email', user.email);
          if (user.id) {
            formData.append('user_id', user.id);
          }
        }
        
        console.log(`🔮 Sending request to: ${API_URL}/predict/disease`);
        
        const response = await fetch(`${API_URL}/predict/disease`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        console.log('📥 Disease Detection Response:', data);

        if (response.ok && data.success) {
          setPredictions(data);
          
          if (data.scan_id) {
            console.log(`✅ Scan saved to database with ID: ${data.scan_id}`);
          }
        } else {
          let errorMessage = data.error || 'Prediction failed. Please try again.';
          setError(errorMessage);
          console.error('❌ Prediction error:', data);
        }
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const switchMode = (mode) => {
    setScanMode(mode);
    setPredictions(null);
    setError(null);
    checkBackendConnection();
  };

  const getSeverityColor = (severity) => {
    if (!severity) return 'text-gray-600';
    const lower = severity.toLowerCase();
    if (lower.includes('severe')) return 'text-red-600';
    if (lower.includes('moderate')) return 'text-orange-600';
    if (lower.includes('none')) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getEmotionEmoji = (emotion) => {
    const emotionMap = {
      'happy': '😊',
      'sad': '😢',
      'angry': '😠',
      'relaxed': '😌',
      'neutral': '😐',
      'fearful': '😰',
      'surprised': '😲'
    };
    return emotionMap[emotion?.toLowerCase()] || '🐕';
  };

  const getModelBadge = () => {
    if (scanMode === 'disease' && modelInfo) {
      const modelType = modelInfo.diseaseModelType;
      const isMobileNetV2H5 = modelType === 'mobilenetv2_h5';
      const isMobileNetV2Final = modelType === 'mobilenetv2_final';
      const isMobileNetV2Checkpoint = modelType === 'mobilenetv2_checkpoint';
      const isMobileNetV2V1 = modelType === 'mobilenetv2_v1';
      const isEfficientNetB3 = modelType === 'efficientnet_b3_final' || modelType === 'efficientnet_b3_checkpoint';
      const isEfficientNetV1 = modelType === 'efficientnet_v1';
      
      return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
          isMobileNetV2H5 || isMobileNetV2Final || isMobileNetV2Checkpoint
            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
            : isMobileNetV2V1
              ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white'
              : isEfficientNetB3
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                : isEfficientNetV1
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                  : 'bg-gray-200 text-gray-700'
        }`}>
          {isMobileNetV2H5 ? (
            <>
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span>MOBILENETV2 H5 • Transfer Learning • 224x224</span>
            </>
          ) : isMobileNetV2Final ? (
            <>
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span>MOBILENETV2 FINAL • Transfer Learning • 224x224</span>
            </>
          ) : isMobileNetV2Checkpoint ? (
            <>
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span>MOBILENETV2 CHECKPOINT • Best Model • 224x224</span>
            </>
          ) : isMobileNetV2V1 ? (
            <>
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span>MOBILENETV2 V1 • Custom Trained • 224x224</span>
            </>
          ) : isEfficientNetB3 ? (
            <>
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span>EFFICIENTNET B3 • 90%+ Accuracy • 224x224</span>
            </>
          ) : isEfficientNetV1 ? (
            <>
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span>EFFICIENTNET V1 • Custom Trained • 224x224</span>
            </>
          ) : (
            <span>STANDARD MODEL</span>
          )}
        </div>
      );
    }
    
    if (scanMode === 'breed' && modelInfo?.emotionModelLoaded) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          <span>BREED + EMOTION AI • MobileNetV2</span>
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
                • {modelInfo.diseaseModelType === 'mobilenetv2_h5' ? 'MobileNetV2 H5' :
                   modelInfo.diseaseModelType === 'mobilenetv2_final' ? 'MobileNetV2 Final' : 
                   modelInfo.diseaseModelType === 'mobilenetv2_checkpoint' ? 'MobileNetV2 Checkpoint' :
                   modelInfo.diseaseModelType === 'mobilenetv2_v1' ? 'MobileNetV2 V1' :
                   modelInfo.diseaseModelType.toUpperCase()} Active
              </span>
            )}
            {modelInfo?.emotionModelLoaded && scanMode === 'breed' && (
              <span className="text-green-600 font-semibold">• Emotion Detection Active</span>
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
            <span className="text-orange-600">Model Not Loaded - Run: python train_dog_skin_disease.py</span>
          </>
        );
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    switch (scanMode) {
      case 'breed':
        return 'Breed & Emotion Detection';
      case 'disease':
        return 'Skin Disease Detection';
      default:
        return 'Dog AI Scanner';
    }
  };

  const getPageDescription = () => {
    switch (scanMode) {
      case 'breed':
        return 'Identify breed and detect emotion in one scan';
      case 'disease':
        return modelInfo?.diseaseModelType === 'mobilenetv2_h5' 
          ? 'Detect skin diseases using your custom-trained MobileNetV2 H5 AI with Transfer Learning'
          : modelInfo?.diseaseModelType === 'mobilenetv2_final' 
            ? 'Detect skin diseases using your custom-trained MobileNetV2 AI with Transfer Learning'
            : modelInfo?.diseaseModelType === 'mobilenetv2_checkpoint'
              ? 'Detect skin diseases using MobileNetV2 checkpoint model'
              : modelInfo?.diseaseModelType === 'mobilenetv2_v1'
                ? 'Detect skin diseases using MobileNetV2 V1 model'
                : 'Detect skin diseases using AI';
      default:
        return 'Advanced AI-powered dog analysis';
    }
  };

  const getUrgencyColor = (urgency) => {
    if (!urgency) return 'text-gray-600';
    const lower = urgency.toLowerCase();
    if (lower.includes('immediate') || lower.includes('urgent')) return 'text-red-600';
    if (lower.includes('moderate')) return 'text-orange-600';
    if (lower.includes('low') || lower.includes('routine')) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
          setUser={setUser}
        />

        <main className="flex-1 overflow-auto bg-white py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-800 mb-3">
                🐕 {getPageTitle()}
              </h1>
              <p className="text-lg text-gray-700 mb-6">
                {getPageDescription()}
              </p>

              <div className="inline-flex bg-gray-100 rounded-xl p-1 mb-4">
                <button
                  onClick={() => switchMode('breed')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    scanMode === 'breed'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🐶 Breed ID
                </button>
                <button
                  onClick={() => switchMode('disease')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    scanMode === 'disease'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🏥 Disease
                </button>
              </div>

              <div className="mb-3">
                {getModelBadge()}
              </div>

              <div className="flex items-center justify-center gap-2 text-sm">
                {getBackendStatusDisplay()}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`
                    border-4 border-dashed rounded-2xl p-16 text-center cursor-pointer
                    transition-all duration-300 ease-in-out
                    ${isDragging 
                      ? 'border-purple-600 bg-purple-50 scale-105'
                      : 'border-purple-300 bg-purple-50/50 hover:border-purple-500 hover:bg-purple-50'
                    }
                  `}
                >
                  <div className="text-7xl mb-6">
                    {scanMode === 'breed' ? '📸' : '🔬'}
                  </div>
                  <div className="text-2xl font-semibold text-purple-600 mb-2">
                    Click to upload or drag and drop
                  </div>
                  <div className="text-gray-500">
                    {scanMode === 'breed' 
                      ? 'Upload a photo of a dog to identify breed & detect emotion'
                      : 'Upload a photo of dog skin to detect potential diseases'
                    }
                  </div>
                  <div className="text-gray-400 text-sm mt-2">
                    Supports JPG, JPEG, PNG
                  </div>
                  
                  {scanMode === 'disease' && modelInfo?.diseaseModelType && (
                    <div className="mt-4 inline-block bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
                      <p className="text-purple-700 text-sm font-medium">
                        ✨ {modelInfo.diseaseModelType === 'mobilenetv2_final' ? 'Using your custom-trained MobileNetV2 model with Transfer Learning' :
                           modelInfo.diseaseModelType === 'mobilenetv2_checkpoint' ? 'Using MobileNetV2 checkpoint model' :
                           modelInfo.diseaseModelType === 'mobilenetv2_v1' ? 'Using MobileNetV2 V1 model' :
                           'Using disease detection model'}
                      </p>
                    </div>
                  )}
                  
                  {user && user.email && (
                    <div className="text-green-600 text-sm mt-3 font-medium">
                      ✓ Scan will be saved to your history
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-96 object-contain rounded-2xl shadow-lg"
                    />
                  </div>

                  {!predictions && !loading && (
                    <button
                      onClick={analyzeDog}
                      disabled={backendStatus === 'offline' || backendStatus === 'model-error'}
                      className={`w-full py-4 px-8 rounded-xl text-xl font-semibold
                               shadow-lg transition-all duration-200
                               ${(backendStatus === 'connected' || backendStatus === 'no-db')
                                 ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:scale-105 hover:shadow-xl'
                                 : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                               }`}
                    >
                      {scanMode === 'breed' 
                        ? '🔍 Analyze Breed & Emotion'
                        : '🔬 Detect Skin Disease'
                      }
                    </button>
                  )}

                  {loading && (
                    <div className="text-center py-12">
                      <div className="inline-block w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-xl text-purple-600 font-medium">
                        {scanMode === 'breed' 
                          ? 'Analyzing breed & detecting emotion...'
                          : modelInfo?.diseaseModelType === 'mobilenetv2_final'
                            ? 'Analyzing with your custom MobileNetV2...'
                            : 'Analyzing skin condition...'
                        }
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-500 text-white p-5 rounded-xl shadow-lg">
                      <p className="font-semibold mb-2">❌ Error</p>
                      <p className="text-sm whitespace-pre-line">{error}</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={checkBackendConnection}
                          className="px-4 py-2 bg-white text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                        >
                          Retry Connection
                        </button>
                        <button
                          onClick={reset}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                        >
                          Try Another Image
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Breed Results */}
                  {predictions && scanMode === 'breed' && predictions.predictions && (
                    <div className="space-y-6">
                      {predictions.scan_id && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
                          <p className="text-sm text-green-800 font-medium">
                            ✅ Scan saved to database (ID: {predictions.scan_id})
                          </p>
                        </div>
                      )}

                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                          🐕 Breed Identification
                        </h2>

                        {predictions.predictions.map((pred, index) => (
                          <div
                            key={index}
                            className={`
                              p-4 rounded-xl mb-3 transition-all duration-300
                              ${index === 0
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                                : 'bg-white text-gray-800 border border-gray-100'
                              }
                            `}
                          >
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

                      {/* EMOTION SECTION */}
                      {predictions.emotion && predictions.emotion.emotion !== 'unavailable' && (
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                          <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-gray-800">
                            😊 Emotion Detected
                          </h2>

                          <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <p className="text-4xl font-bold capitalize text-gray-800">
                                  {predictions.emotion.emotion}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  Primary emotion detected
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-4xl font-bold text-gray-800">
                                  {predictions.emotion.confidence.toFixed(1)}%
                                </p>
                                <p className="text-xs text-gray-500">confidence</p>
                              </div>
                            </div>
                          </div>

                          {predictions.emotion.all_probabilities && (
                            <div className="space-y-2 mb-5">
                              {Object.entries(predictions.emotion.all_probabilities)
                                .sort((a, b) => b[1] - a[1])
                                .map(([emotion, prob]) => (
                                  <div key={emotion}>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className="capitalize font-medium flex items-center gap-1.5 text-gray-700">
                                        {getEmotionEmoji(emotion)} {emotion}
                                      </span>
                                      <span className="font-bold text-sm text-gray-800">{prob.toFixed(1)}%</span>
                                    </div>
                                    <div className="bg-purple-100 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${prob}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}

                          <div className="bg-purple-100 rounded-lg p-3 text-xs leading-relaxed">
                            <p className="text-gray-700">
                              💡 <strong>Tip:</strong> Your dog's emotional state can vary based on many factors including 
                              environment, health, and recent activities. This is an AI analysis for entertainment and 
                              general awareness.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Disease Results - UPDATED FOR MOBILENETV2 */}
                  {predictions && scanMode === 'disease' && predictions.top_prediction && (
                    <div className="space-y-6">
                      {predictions.model_info && (
                        <div className={`text-center p-3 rounded-xl ${
                          predictions.model_info.type === 'mobilenetv2_h5'
                            ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300'
                            : predictions.model_info.type === 'mobilenetv2_final'
                              ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300'
                              : predictions.model_info.type === 'mobilenetv2_checkpoint'
                                ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200'
                                : predictions.model_info.type === 'mobilenetv2_v1'
                                  ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200'
                                  : predictions.model_info.type === 'efficientnet_b3_final'
                                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300'
                                    : 'bg-gray-50 border-2 border-gray-200'
                        }`}>
                          <p className={`text-sm font-semibold ${
                            predictions.model_info.type === 'mobilenetv2_h5'
                              ? 'text-purple-800'
                              : predictions.model_info.type === 'mobilenetv2_final'
                                ? 'text-purple-800'
                                : predictions.model_info.type === 'mobilenetv2_checkpoint'
                                  ? 'text-purple-700'
                                  : predictions.model_info.type === 'mobilenetv2_v1'
                                    ? 'text-purple-700'
                                    : predictions.model_info.type === 'efficientnet_b3_final'
                                      ? 'text-blue-800'
                                      : 'text-gray-700'
                          }`}>
                            {predictions.model_info.type === 'mobilenetv2_h5' ? (
                              <>🎯 Analyzed with YOUR CUSTOM MOBILENETV2 H5 model (Transfer Learning, 224x224)</>
                            ) : predictions.model_info.type === 'mobilenetv2_final' ? (
                              <>🎯 Analyzed with YOUR CUSTOM MOBILENETV2 model (Transfer Learning, 224x224)</>
                            ) : predictions.model_info.type === 'mobilenetv2_checkpoint' ? (
                              <>🎯 Analyzed with MOBILENETV2 CHECKPOINT model (224x224)</>
                            ) : predictions.model_info.type === 'mobilenetv2_v1' ? (
                              <>🎯 Analyzed with MOBILENETV2 V1 model (224x224)</>
                            ) : (
                              <>🎯 Analyzed with {predictions.model_info.type.toUpperCase()} model</>
                            )}
                          </p>
                        </div>
                      )}

                      {predictions.scan_id && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
                          <p className="text-sm text-green-800 font-medium">
                            ✅ Scan saved to database (ID: {predictions.scan_id})
                          </p>
                        </div>
                      )}

                      <div className={`p-6 rounded-2xl text-center ${
                        predictions.is_healthy 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                          : predictions.uncertain
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                            : 'bg-gradient-to-r from-orange-500 to-red-600'
                      } text-white shadow-lg`}>
                        <div className="text-5xl mb-3">
                          {predictions.is_healthy ? '✅' : predictions.uncertain ? '🤔' : '⚠️'}
                        </div>
                        <h2 className="text-2xl font-bold mb-2">
                          {predictions.is_healthy 
                            ? 'Healthy Skin!' 
                            : predictions.uncertain 
                              ? 'Uncertain Diagnosis'
                              : 'Potential Issue Detected'
                          }
                        </h2>
                        <p className="text-white/90">
                          {predictions.recommendation}
                        </p>
                        
                        {predictions.warning && (
                          <div className="mt-3 bg-white/20 rounded-lg p-3">
                            <p className="text-sm text-white font-medium">
                              ⚠️ {predictions.warning}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                          Primary Detection
                        </h3>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-2xl font-bold text-purple-600 mb-1">
                                {predictions.top_prediction.name}
                              </p>
                              <p className="text-sm text-gray-600 mb-2">
                                {predictions.top_prediction.description}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-3xl font-bold text-purple-600">
                                {predictions.top_prediction.confidence.toFixed(1)}%
                              </p>
                              <p className={`text-sm font-semibold ${getSeverityColor(predictions.top_prediction.severity)}`}>
                                {predictions.top_prediction.severity}
                              </p>
                            </div>
                          </div>

                          <div className="bg-white/50 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${predictions.top_prediction.confidence}%` }}
                            ></div>
                          </div>

                          {/* SYMPTOMS */}
                          {predictions.top_prediction.symptoms && predictions.top_prediction.symptoms.length > 0 && (
                            <div className="mt-4 bg-white rounded-xl p-4">
                              <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <span>🔍</span> Common Symptoms:
                              </p>
                              <ul className="text-gray-700 text-sm space-y-1 ml-6">
                                {predictions.top_prediction.symptoms.map((symptom, idx) => (
                                  <li key={idx} className="list-disc">{symptom}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* TREATMENT */}
                          {!predictions.is_healthy && predictions.top_prediction.treatment && (
                            <div className="mt-4 bg-white rounded-xl p-4">
                              <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <span>💊</span> Recommended Treatment:
                              </p>
                              <p className="text-gray-700 text-sm">
                                {predictions.top_prediction.treatment}
                              </p>
                            </div>
                          )}

                          {/* URGENCY & CONTAGIOUS INFO */}
                          {!predictions.is_healthy && (
                            <div className="mt-4 grid grid-cols-2 gap-3">
                              {predictions.top_prediction.urgency && (
                                <div className="bg-white rounded-xl p-3">
                                  <p className="text-xs text-gray-600 mb-1">Urgency Level</p>
                                  <p className={`text-sm font-bold ${getUrgencyColor(predictions.top_prediction.urgency)}`}>
                                    {predictions.top_prediction.urgency}
                                  </p>
                                </div>
                              )}
                              {predictions.top_prediction.contagious !== undefined && (
                                <div className="bg-white rounded-xl p-3">
                                  <p className="text-xs text-gray-600 mb-1">Contagious</p>
                                  <p className={`text-sm font-bold ${predictions.top_prediction.contagious ? 'text-red-600' : 'text-green-600'}`}>
                                    {predictions.top_prediction.contagious ? '⚠️ Yes' : '✅ No'}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {predictions.all_predictions && predictions.all_predictions.length > 1 && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-3">
                            Other Possibilities
                          </h3>
                          <div className="space-y-2">
                            {predictions.all_predictions.slice(1).map((pred, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 hover:bg-gray-100 p-4 rounded-xl transition-all"
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-semibold text-gray-800">
                                      {pred.name}
                                    </p>
                                    <p className={`text-xs ${getSeverityColor(pred.severity)}`}>
                                      {pred.severity}
                                    </p>
                                  </div>
                                  <p className="text-lg font-bold text-gray-600">
                                    {pred.confidence.toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <span className="font-semibold">⚠️ Important:</span> This is an AI-powered analysis and should not replace professional veterinary diagnosis.
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={reset}
                    className="w-full bg-white border-2 border-purple-600 text-purple-600 
                             py-3 px-6 rounded-xl text-lg font-semibold
                             hover:bg-purple-600 hover:text-white
                             transform hover:scale-105 transition-all duration-200"
                  >
                    Upload Another Photo
                  </button>
                </div>
              )}
            </div>

            <div className="text-center mt-8 text-gray-600">
              <p className="text-sm">
                {scanMode === 'breed' 
                  ? `Powered by TensorFlow • ${modelInfo?.numBreeds || 121} Breeds • ${modelInfo?.numEmotions || 4} Emotions`
                  : modelInfo?.diseaseModelType === 'mobilenetv2_h5'
                    ? `Powered by MobileNetV2 H5 • Your Custom Model • ${modelInfo?.numDiseases || 6} Diseases • Transfer Learning`
                    : modelInfo?.diseaseModelType === 'mobilenetv2_final'
                      ? `Powered by MobileNetV2 • Your Custom Model • ${modelInfo?.numDiseases || 6} Diseases • Transfer Learning`
                      : `Powered by TensorFlow • ${modelInfo?.numDiseases || 6} Disease Categories`
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {modelInfo?.diseaseModelType && scanMode === 'disease'
                  ? 'Advanced AI Detection • Database Enabled • Comprehensive Disease Info'
                  : 'Advanced AI Detection • Database Enabled • Keras 3 Compatible'
                }
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DogScanner;