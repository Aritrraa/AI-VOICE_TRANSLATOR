# 🎙️ VoiceXChange - Real-Time AI Speech Translator  
**VoiceXChange** is a sleek and intuitive web application that enables seamless real-time speech translation. Simply speak into your microphone, and receive instant translations across multiple languages—with audio playback for both original and translated speech.

> **🌐 Try VoiceXChange in Action**


## 📸 How It Works

### 1. 🎤 Voice Input
Capture your voice in real-time through an intuitive recording interface.

![Voice Input](YOUR_IMAGE_URL_1)

### 2. 📄 Translation & Transcription
Your speech is transcribed using AssemblyAI and translated using Google Translate.

![Transcription & Translation](YOUR_IMAGE_URL_2)

### 3. 🔊 Voice Output
Translated text is converted back to speech using gTTS.

![Voice Output](YOUR_IMAGE_URL_3)
![Voice Output](YOUR_IMAGE_URL_4)
---

## ✨ Key Features

- **🎤 Voice Capture**: Record your voice effortlessly with real-time waveform animations  
- **📝 Instant Transcription**: Powered by AssemblyAI’s cutting-edge speech recognition  
- **🌍 Multi-Language Translation**: Currently supports translation between 7 global languages:  
  - English 🇬🇧  
  - Hindi 🇮🇳  
  - Japanese 🇯🇵  
  - Spanish 🇪🇸  
  - Russian 🇷🇺  
  - German 🇩🇪  
  - Korean 🇰🇷  
- **🔊 Speech Playback**: Listen to both the original and translated outputs  
- **📱 Mobile-Friendly UI**: Designed to be fully responsive on both desktop and mobile  
- **🎨 Visually Appealing**: Sleek dark theme with smooth transitions and dynamic elements  

> 🗂️ Each translation appears as a stylized card with playback and text preview

---

## 🚀 Setup Instructions

### ✅ Prerequisites

- Python 3.8 or higher  
- Node.js + npm (for frontend tools)  
- API key from AssemblyAI  

### 🔧 Installation Steps

Clone the repository:

```bash
git clone https://github.com/AdarshXKumAR/AI-Voice-Translator.git
cd AI-Voice-Translator
```

Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # For Windows: venv\Scripts\activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env.local` file with your API credentials:

```
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
```

---

### ▶️ Run the App

Start the Flask server:

```bash
python app.py
```

Then open your browser and go to:

```
http://localhost:5000
```

---

## 🛠️ Tech Stack

### Backend:
- **Flask** — Python micro web framework  
- **AssemblyAI** — Real-time speech-to-text conversion  
- **Google Translate API** — For multilingual text translations  
- **gTTS (Google Text-to-Speech)** — Converts translated text to spoken audio  

### Frontend:
- **HTML5 & CSS3** — Core structure and styling  
- **JavaScript** — Frontend interactivity  
- **MediaRecorder API** — Microphone audio capture  
- **Web Audio API** — Waveform rendering & visualization  

---

## 📁 Directory Overview

```
├── app.py                 # Main Flask backend
├── static/
│   ├── script.js          # Client-side JS logic
│   └── styles.css         # Application styling
├── templates/
│   └── index.html         # Web interface
├── .env.local             # Configuration file (not included)
└── README.md              # Project overview (this file)
```

---

## 🔐 Privacy & Data Handling

- Voice recordings are **temporarily processed on the server**
- Transcriptions are securely handled by **AssemblyAI**
- All temporary audio files are **automatically deleted within 24 hours**

---

## 📄 License

This project is open-source under the **MIT License**. Refer to the `LICENSE` file for more details.

---

## 🙌 Credits & Tools

- [AssemblyAI](https://www.assemblyai.com/) for speech recognition  
- [Google Translate](https://translate.google.com/) for translations  
- [Font Awesome](https://fontawesome.com/) for UI icons  
- [Google Fonts](https://fonts.google.com/specimen/Poppins) for typography  

---

## 🚧 Upcoming Features

- 🌐 Add more supported languages  
- 🎙️ Custom voices per language  
- 💾 Download or save translated outputs  
- 🔐 User login system with translation history  
- 📶 Offline mode with caching and fallback support
