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
        const bothModelsLoaded = data.breed_model_loaded && data.disease_model_loaded;
        const dbConnected = data.database_connected;
        
        // Store model information
        setModelInfo({
          diseaseModelType: data.disease_model_type || 'standard',
          diseaseInputSize: data.disease_input_size || 224,
          numBreeds: data.num_breeds || 0,
          numDiseases: data.num_diseases || 0,
          kerasVersion: data.keras_version || 'unknown',
          tfVersion: data.tensorflow_version || 'unknown'
        });
        
        console.log('📊 Backend Health Check:', {
          breedModel: data.breed_model_loaded ? '✅' : '❌',
          diseaseModel: data.disease_model_loaded ? '✅' : '❌',
          modelType: data.disease_model_type,
          database: dbConnected ? '✅' : '❌',
          diseases: data.num_diseases
        });
        
        if (bothModelsLoaded && dbConnected) {
          setBackendStatus('connected');
        } else if (bothModelsLoaded && !dbConnected) {
          setBackendStatus('no-db');
        } else if (!data.disease_model_loaded && scanMode === 'disease') {
          setBackendStatus('disease-model-missing');
          setError('Disease detection model not loaded. Please check backend logs.');
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

    const formData = new FormData();
    formData.append('image', selectedImage);
    
    // Add user info to form data from authenticated user
    if (user && user.email) {
      formData.append('user_email', user.email);
      if (user.id) {
        formData.append('user_id', user.id);
      }
    }

    try {
      const endpoint = scanMode === 'breed' ? '/predict/breed' : '/predict/disease';
      console.log(`🔮 Sending request to: ${API_URL}${endpoint}`);
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('📥 Response:', data);

      if (response.ok && data.success) {
        setPredictions(data);
        
        // Show success message if saved to database
        if (data.scan_id) {
          console.log(`✅ Scan saved to database with ID: ${data.scan_id}`);
        }
      } else {
        // Enhanced error handling
        let errorMessage = data.error || 'Prediction failed. Please try again.';
        
        // Check for specific error patterns
        if (data.training_instructions) {
          errorMessage = `${errorMessage}\n\nℹ️ Model Training Required:\n${data.training_instructions.message}`;
        }
        
        setError(errorMessage);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const switchMode = (mode) => {
    setScanMode(mode);
    setPredictions(null);
    setError(null);
    // Recheck backend when switching modes
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

  const getModelBadge = () => {
    if (!modelInfo || scanMode !== 'disease') return null;
    
    const modelType = modelInfo.diseaseModelType;
    const isAdvanced = modelType === 'advanced';
    const isImproved = modelType === 'improved';
    
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
        isAdvanced
          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
          : isImproved 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
            : 'bg-gray-200 text-gray-700'
      }`}>
        {isAdvanced ? (
          <>
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            <span>ADVANCED MODEL • EfficientNetB3 • 90%+ Accuracy</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">
              {modelInfo.diseaseInputSize}×{modelInfo.diseaseInputSize}
            </span>
          </>
        ) : isImproved ? (
          <>
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            <span>IMPROVED MODEL • 80-90% Accuracy</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">
              {modelInfo.diseaseInputSize}×{modelInfo.diseaseInputSize}
            </span>
          </>
        ) : (
          <>
            <span>STANDARD MODEL</span>
            <span className="text-[10px] bg-gray-300 px-2 py-0.5 rounded">
              {modelInfo.diseaseInputSize}×{modelInfo.diseaseInputSize}
            </span>
          </>
        )}
      </div>
    );
  };

  const getBackendStatusDisplay = () => {
    switch (backendStatus) {
      case 'checking':
        return (
          <span className="text-gray-600">Checking backend...</span>
        );
      case 'connected':
        return (
          <>
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-600">Backend & Database Connected</span>
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
      case 'disease-model-missing':
        return (
          <>
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
            <span className="text-orange-600">Disease Model Not Loaded</span>
          </>
        );
      case 'model-error':
        return (
          <>
            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
            <span className="text-yellow-600">Model Loading Error</span>
          </>
        );
      default:
        return null;
    }
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
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-800 mb-3">
                🐕 Dog AI Scanner
              </h1>
              <p className="text-lg text-gray-700 mb-6">
                Upload a photo to identify breed or detect skin diseases using AI
              </p>

              {/* Mode Toggle */}
              <div className="inline-flex bg-gray-100 rounded-xl p-1 mb-4">
                <button
                  onClick={() => switchMode('breed')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    scanMode === 'breed'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🐶 Breed Scanner
                </button>
                <button
                  onClick={() => switchMode('disease')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    scanMode === 'disease'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🏥 Disease Detector
                </button>
              </div>

              {/* Model Badge - Show for disease mode */}
              <div className="mb-3">
                {getModelBadge()}
              </div>

              {/* Backend Status Indicator */}
              <div className="flex items-center justify-center gap-2 text-sm">
                {getBackendStatusDisplay()}
              </div>

              {/* Model Info Debug (only in development) */}
              {modelInfo && process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-500">
                  Keras: {modelInfo.kerasVersion} | TF: {modelInfo.tfVersion} | 
                  Diseases: {modelInfo.numDiseases}
                </div>
              )}
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
              {!previewUrl ? (
                /* Upload Area */
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
                      ? 'Upload a photo of a dog to identify its breed'
                      : 'Upload a photo of dog skin to detect potential diseases'
                    }
                  </div>
                  <div className="text-gray-400 text-sm mt-2">
                    Supports JPG, JPEG, PNG
                  </div>
                  {scanMode === 'disease' && modelInfo && (modelInfo.diseaseModelType === 'improved' || modelInfo.diseaseModelType === 'advanced') && (
                    <div className={`mt-4 ${
                      modelInfo.diseaseModelType === 'advanced'
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
                        : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                    } rounded-lg p-3`}>
                      <p className={`${
                        modelInfo.diseaseModelType === 'advanced' ? 'text-blue-800' : 'text-green-800'
                      } text-sm font-semibold`}>
                        🎯 Using {modelInfo.diseaseModelType === 'advanced' ? 'Advanced' : 'Improved'} AI Model
                      </p>
                      <p className={`${
                        modelInfo.diseaseModelType === 'advanced' ? 'text-blue-700' : 'text-green-700'
                      } text-xs mt-1`}>
                        Expected accuracy: {modelInfo.diseaseModelType === 'advanced' ? '90%+' : '80-90%'} • 
                        High-resolution analysis ({modelInfo.diseaseInputSize}×{modelInfo.diseaseInputSize})
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
                /* Preview Section */
                <div className="space-y-6">
                  {/* Image Preview */}
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-96 object-contain rounded-2xl shadow-lg"
                    />
                    {scanMode === 'disease' && modelInfo && (modelInfo.diseaseModelType === 'improved' || modelInfo.diseaseModelType === 'advanced') && (
                      <div className={`absolute top-3 right-3 ${
                        modelInfo.diseaseModelType === 'advanced'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600'
                      } text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg`}>
                        🎯 {modelInfo.diseaseModelType === 'advanced' ? 'ADVANCED' : 'IMPROVED'} MODEL
                      </div>
                    )}
                  </div>

                  {/* Analyze Button */}
                  {!predictions && !loading && (
                    <button
                      onClick={analyzeDog}
                      disabled={backendStatus === 'offline' || backendStatus === 'model-error' || backendStatus === 'disease-model-missing'}
                      className={`w-full py-4 px-8 rounded-xl text-xl font-semibold
                               shadow-lg transition-all duration-200
                               ${(backendStatus === 'connected' || backendStatus === 'no-db') && 
                                 (scanMode === 'breed' || (scanMode === 'disease' && backendStatus !== 'disease-model-missing'))
                                 ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:scale-105 hover:shadow-xl'
                                 : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                               }`}
                    >
                      {backendStatus === 'disease-model-missing' && scanMode === 'disease'
                        ? '⚠️ Disease Model Not Loaded'
                        : (backendStatus === 'connected' || backendStatus === 'no-db')
                          ? (scanMode === 'breed' ? '🔍 Analyze Dog Breed' : '🔬 Detect Skin Disease')
                          : '⚠️ Backend Not Connected'
                      }
                    </button>
                  )}

                  {/* Loading State */}
                  {loading && (
                    <div className="text-center py-12">
                      <div className="inline-block w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-xl text-purple-600 font-medium">
                        {scanMode === 'breed' 
                          ? 'Analyzing dog breed...'
                          : 'Analyzing skin condition...'
                        }
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {scanMode === 'disease' && modelInfo && (modelInfo.diseaseModelType === 'improved' || modelInfo.diseaseModelType === 'advanced')
                          ? `Processing with ${modelInfo.diseaseModelType} AI model (${modelInfo.diseaseInputSize}×${modelInfo.diseaseInputSize})...`
                          : 'Processing with AI model...'
                        }
                      </p>
                      {user && user.email && (
                        <p className="text-xs text-green-600 mt-2">
                          Results will be saved to your history
                        </p>
                      )}
                    </div>
                  )}

                  {/* Error Message */}
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
                    <div className="space-y-4">
                      {/* Save confirmation */}
                      {predictions.scan_id && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
                          <p className="text-sm text-green-800 font-medium">
                            ✅ Scan saved to database (ID: {predictions.scan_id})
                          </p>
                        </div>
                      )}

                      <h2 className="text-xl font-bold text-gray-800 text-center mb-6">
                        🐕 Breed Predictions
                      </h2>

                      {predictions.predictions.map((pred, index) => (
                        <div
                          key={index}
                          className={`
                            p-5 rounded-xl transition-all duration-300
                            ${index === 0
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform hover:scale-102'
                              : 'bg-purple-50 hover:bg-purple-100 hover:translate-x-2'
                            }
                          `}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`font-semibold ${index === 0 ? 'text-lg' : 'text-md'}`}>
                              {index === 0 && '👑 '}
                              {pred.breed}
                            </span>
                            <span className={`font-bold ${index === 0 ? 'text-lg' : 'text-md'}`}>
                              {pred.confidence.toFixed(2)}%
                            </span>
                          </div>
                          
                          {index === 0 && (
                            <div className="mt-3 bg-white/30 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-white h-full rounded-full transition-all duration-500"
                                style={{ width: `${pred.confidence}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Disease Results */}
                  {predictions && scanMode === 'disease' && predictions.top_prediction && (
                    <div className="space-y-6">
                      {/* Model Info Badge in Results */}
                      {predictions.model_info && (
                        <div className={`text-center p-3 rounded-xl ${
                          predictions.model_info.type === 'advanced'
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200'
                            : predictions.model_info.type === 'improved'
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
                              : 'bg-gray-50 border-2 border-gray-200'
                        }`}>
                          <p className={`text-sm font-semibold ${
                            predictions.model_info.type === 'advanced'
                              ? 'text-blue-800'
                              : predictions.model_info.type === 'improved' 
                                ? 'text-green-800' 
                                : 'text-gray-700'
                          }`}>
                            {predictions.model_info.type === 'advanced' ? '🎯' : predictions.model_info.type === 'improved' ? '🎯' : '📊'} 
                            {' '}Analyzed with {predictions.model_info.type.toUpperCase()} model
                            {' '}({predictions.model_info.input_size}×{predictions.model_info.input_size})
                            {predictions.model_info.type === 'advanced' && ' • 90%+ accuracy'}
                            {predictions.model_info.type === 'improved' && ' • 80-90% accuracy'}
                          </p>
                        </div>
                      )}

                      {/* Save confirmation */}
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

                          {!predictions.is_healthy && (
                            <div className="mt-4 bg-white rounded-xl p-4">
                              <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <span>💊</span> Recommended Treatment:
                              </p>
                              <p className="text-gray-700 text-sm">
                                {predictions.top_prediction.treatment}
                              </p>
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
                          <span className="font-semibold">⚠️ Important:</span> This is an AI-powered analysis and should not replace professional veterinary diagnosis. Always consult a qualified veterinarian for accurate diagnosis and treatment.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Reset Button */}
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

            {/* Footer Info */}
            <div className="text-center mt-8 text-gray-600">
              <p className="text-sm">
                {scanMode === 'breed' 
                  ? `Powered by TensorFlow & MobileNetV2 • ${modelInfo?.numBreeds || 121} Dog Breeds Supported`
                  : modelInfo?.diseaseModelType === 'advanced'
                    ? `Powered by TensorFlow & EfficientNetB3 • ${modelInfo?.numDiseases || 6} Disease Categories • 90%+ Accuracy`
                    : modelInfo?.diseaseModelType === 'improved'
                      ? `Powered by TensorFlow & EfficientNetV2-B2 • ${modelInfo?.numDiseases || 6} Disease Categories • 80-90% Accuracy`
                      : `Powered by TensorFlow • ${modelInfo?.numDiseases || 6} Disease Categories Supported`
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                KB5074109 Compatible Mode Active • Database Integration Enabled • Keras 3 Compatible
                {modelInfo && (modelInfo.diseaseModelType === 'improved' || modelInfo.diseaseModelType === 'advanced') && scanMode === 'disease' && (
                  <span className={`font-semibold ${
                    modelInfo.diseaseModelType === 'advanced' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {' '}• Using {modelInfo.diseaseModelType === 'advanced' ? 'Advanced' : 'Improved'} AI Model
                  </span>
                )}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DogScanner;  