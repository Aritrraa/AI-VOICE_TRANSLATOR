// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const mainContainer = document.getElementById('mainContainer');
const greeting = document.getElementById('greeting');
const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');
const clearButton = document.getElementById('clearButton');
const translateButton = document.getElementById('translateButton');
const recorderTime = document.getElementById('recorderTime');
const recorderStatus = document.getElementById('recorderStatus');
const visualizer = document.getElementById('visualizer');
const originalAudioPlayer = document.getElementById('originalAudioPlayer');
const originalAudio = document.getElementById('originalAudio');
const originalText = document.getElementById('originalText');
const translationsSection = document.getElementById('translationsSection');
const translationsContainer = document.getElementById('translationsContainer');
const processingModal = document.getElementById('processingModal');
const sourceLanguage = document.getElementById('sourceLanguage');

// API endpoints - Improving flexibility for different environments
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api'
    : '/api';

// Global variables
let mediaRecorder;
let audioChunks = [];
let recordingStartTime;
let recordingTimer;
let recordingBlob;
let audioContext;
let analyser;
let canvasContext;
let animationFrame;

// Flag icons mapping
const languageIcons = {
    'English': '🇬🇧',
    'Hindi': '🇮🇳',
    'Japanese': '🇯🇵',
    'Spanish': '🇪🇸',
    'Russian': '🇷🇺',
    'German': '🇩🇪',
    'Korean': '🇰🇷',
    'French': '🇫🇷',  // Using French flag for Bengali as requested
    'Italian': '🇮🇹'
};


// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Show loading screen for 2 seconds
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainContainer.classList.add('visible');
        }, 500);
    }, 2000);

    // Set greeting based on time of day
    setGreeting();

    // Setup canvas for audio visualization
    canvasContext = visualizer.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize event listeners
    recordButton.addEventListener('click', startRecording);
    stopButton.addEventListener('click', stopRecording);
    clearButton.addEventListener('click', clearRecording);
    translateButton.addEventListener('click', translateAudio);
});

// Add this after your existing event listeners
sourceLanguage.addEventListener('change', function() {
    const selectedLanguage = this.value;
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'language-notification';
    notificationDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${selectedLanguage} selected`;
    
    // Remove any existing notification
    const existingNotification = document.querySelector('.language-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Add the notification after the language selector
    this.parentNode.appendChild(notificationDiv);
    
    // Remove the notification after 3 seconds
    setTimeout(() => {
        if (notificationDiv.parentNode) {
            notificationDiv.classList.add('fade-out');
            setTimeout(() => notificationDiv.remove(), 500);
        }
    }, 3000);
});

// Set appropriate greeting based on time of day
function setGreeting() {
    const hour = new Date().getHours();
    let greetingText = '';
    
    if (hour >= 5 && hour < 12) {
        greetingText = 'Good morning';
    } else if (hour >= 12 && hour < 18) {
        greetingText = 'Good afternoon';
    } else {
        greetingText = 'Good evening';
    }
    
    greeting.textContent = `${greetingText}, Welcome to VoiceXChange!`;
}

// Resize canvas to fit its container
function resizeCanvas() {
    visualizer.width = visualizer.offsetWidth;
    visualizer.height = visualizer.offsetHeight;
}

// Start recording audio
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Setup AudioContext for visualization
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        
        // Setup MediaRecorder
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            recordingBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(recordingBlob);
            originalAudio.src = audioUrl;
            originalAudioPlayer.style.display = 'block';
            
            // Stop visualizer animation
            cancelAnimationFrame(animationFrame);
            drawFlatLine();
            
            // Enable appropriate buttons
            recordButton.disabled = false;
            stopButton.disabled = true;
            clearButton.disabled = false;
        };
        
        // Start recording
        mediaRecorder.start();
        recordingStartTime = Date.now();
        updateRecordingTime();
        
        // Update UI
        recordButton.disabled = true;
        stopButton.disabled = false;
        recorderStatus.innerHTML = '<i class="fas fa-microphone-alt"></i><span>Recording...</span>';
        recorderStatus.style.color = 'var(--error-color)';
        
        // Start visualizer
        drawVisualizer();
    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Unable to access microphone. Please check your permissions.');
    }
}

// Stop recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        // Clear recording timer
        clearInterval(recordingTimer);
        
        // Update UI
        recorderStatus.innerHTML = '<i class="fas fa-check-circle"></i><span>Recording complete</span>';
        recorderStatus.style.color = 'var(--success-color)';
    }
}

// Clear recording
function clearRecording() {
    // Reset UI
    recorderTime.textContent = '00:00';
    recorderStatus.innerHTML = '<i class="fas fa-microphone"></i><span>Click to record</span>';
    recorderStatus.style.color = '';
    originalAudioPlayer.style.display = 'none';
    translationsSection.style.display = 'none';
    translationsContainer.innerHTML = '';
    
    // Reset recording data
    recordingBlob = null;
    audioChunks = [];
    
    // Enable/disable appropriate buttons
    recordButton.disabled = false;
    clearButton.disabled = true;
    
    // Clear canvas
    drawFlatLine();
}

// Update recording time display
function updateRecordingTime() {
    recordingTimer = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - recordingStartTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
        const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
        recorderTime.textContent = `${minutes}:${seconds}`;
    }, 1000);
}

// Draw audio visualizer
function drawVisualizer() {
    if (!analyser) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
        animationFrame = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        
        canvasContext.fillStyle = 'rgba(0, 0, 0, 0.2)';
        canvasContext.fillRect(0, 0, visualizer.width, visualizer.height);
        
        const barWidth = (visualizer.width / bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * visualizer.height;
            
            // Use gradient for bars
            const gradient = canvasContext.createLinearGradient(0, visualizer.height - barHeight, 0, visualizer.height);
            gradient.addColorStop(0, '#7c4dff'); // Same as --primary-color
            gradient.addColorStop(1, '#b47cff'); // Same as --primary-light
            
            canvasContext.fillStyle = gradient;
            canvasContext.fillRect(x, visualizer.height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
    };
    
    draw();
}

// Draw flat line on visualizer when not recording
function drawFlatLine() {
    canvasContext.fillStyle = 'rgba(0, 0, 0, 0.2)';
    canvasContext.fillRect(0, 0, visualizer.width, visualizer.height);
    
    canvasContext.beginPath();
    canvasContext.moveTo(0, visualizer.height / 2);
    canvasContext.lineTo(visualizer.width, visualizer.height / 2);
    canvasContext.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    canvasContext.lineWidth = 2;
    canvasContext.stroke();
}

// Translate the recorded audio
// Translate the recorded audio
async function translateAudio() {
    if (!recordingBlob) {
        alert('Please record some audio first.');
        return;
    }
    
    // Show processing modal
    processingModal.classList.add('active');
    
    try {
        const formData = new FormData();
        formData.append('audio', recordingBlob, 'recording.wav');
        formData.append('source_language', sourceLanguage.value);

        console.log(`Sending translation request to: ${API_URL}/translate`);
        
        const response = await fetch(`${API_URL}/translate`, {
            method: 'POST',
            body: formData
        });
        
        // Get response as text first for better error logging
        const responseText = await response.text();
        console.log('Server response:', responseText);
        
        if (!response.ok) {
            throw new Error(`Translation request failed: ${response.status} ${response.statusText}`);
        }
        
        // Parse the response text as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error(`Failed to parse server response: ${parseError.message}`);
        }
        
        // Check if data has expected structure
        if (!data.translations || !data.audio_paths) {
            throw new Error('Invalid response format from server');
        }
        
        // Display original text
        originalText.textContent = data.translations[sourceLanguage.value] || 'Transcription not available';
        
        // Clear previous translations
        translationsContainer.innerHTML = '';
        
        // Create translation cards
        let cardsCreated = 0;
        for (const language in data.translations) {
            if (language !== sourceLanguage.value) {
                if (data.translations[language] && data.audio_paths[language]) {
                    createTranslationCard(language, data.translations[language], data.audio_paths[language]);
                    cardsCreated++;
                }
            }
        }
        
        if (cardsCreated === 0) {
            translationsContainer.innerHTML = '<div class="no-translations">No translations available. Please try again.</div>';
        }
        
        // Show translations section
        translationsSection.style.display = 'block';
        
        // Smooth scroll to translations
        translationsSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error translating audio:', error);
        
        // Display more helpful error message based on error type
        let errorMessage = error.message;
        if (error.message.includes('500')) {
            errorMessage = 'Server error while processing your audio. Please check your API keys or server logs.';
        } else if (error.message.includes('404')) {
            errorMessage = 'Translation service not found. Please check your server configuration.';
        } else if (error.message.includes('parse')) {
            errorMessage = 'Received invalid response from server. Please check server logs.';
        }
        
        alert(`Failed to translate: ${errorMessage}`);
    } finally {
        // Always hide processing modal
        processingModal.classList.remove('active');
    }
}
// Create translation card
function createTranslationCard(language, text, audioPath) {
    const card = document.createElement('div');
    card.className = 'translation-card';
    
    // Add animation delay for staggered appearance
    const delay = Array.from(translationsContainer.children).length * 0.1;
    card.style.animationDelay = `${delay}s`;
    
    card.innerHTML = `
        <div class="card-header">
            <div class="flag-icon">${languageIcons[language]}</div>
            <h3>${language}</h3>
        </div>
        <div class="card-body">
            <div class="translation-text">${text}</div>
            <audio controls src="${audioPath}" class="translation-audio"></audio>
        </div>
    `;
    
    translationsContainer.appendChild(card);
}