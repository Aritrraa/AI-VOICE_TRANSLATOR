import os
import uuid
import tempfile
from flask import Flask, request, jsonify, send_file, render_template
from flask_cors import CORS
import assemblyai as aai
from deep_translator import GoogleTranslator
from gtts import gTTS
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

# Initialize Flask app with proper template and static folders
app = Flask(__name__, 
            template_folder='.', 
            static_folder='static',
            static_url_path='/static')
CORS(app)  # Enable CORS for all routes


ASSEMBLYAI_API_KEY = os.getenv('ASSEMBLYAI_API_KEY')

# Configure AssemblyAI
aai.settings.api_key = ASSEMBLYAI_API_KEY

# Language codes mapping
LANGUAGE_CODES = {
    "English": {"code": "en", "voice_id": "21m00Tcm4TlvDq8ikWAM"},   # Rachel voice
    "Hindi": {"code": "hi", "voice_id": "IKne3meq5aSn9XLyUdCD"},     # Prabhat voice
    "Japanese": {"code": "ja", "voice_id": "pNInz6obpgDQGcFmaJgB"},  # Tomoko voice
    "Spanish": {"code": "es", "voice_id": "EXAVITQu4vr4xnSDxMaL"},   # Antonio voice
    "Russian": {"code": "ru", "voice_id": "GBv7mTt0atIp3Br8iCZE"},   # Dmitry voice
    "German": {"code": "de", "voice_id": "UBhIiElKbNeidRm6JYKp"},    # Gigi voice
    "Korean": {"code": "ko", "voice_id": "XrExE9yKIg0eXQXPvsxG"},    # Seoyeon voice
    "French": {"code": "fr", "voice_id": "TxGEqnHWrfWFTfGW9XjX"},    # Celine voice (placeholder)
    "Italian": {"code": "it", "voice_id": "zcAOhNBS3c14rBihAFp1"}    # Matteo voice (placeholder)
}


# AssemblyAI language code mapping (if different from standard codes)
ASSEMBLYAI_LANGUAGE_CODES = {
    "English": "en",
    "Hindi": "hi",
    "Japanese": "ja",
    "Spanish": "es",
    "Russian": "ru",
    "German": "de",
    "Korean": "ko",
    "French": "fr",
    "Italian": "it"
}


@app.route('/')
def index():
    return render_template('templates/index.html')

@app.route('/api/translate', methods=['POST'])
def translate_audio():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    audio_file = request.files['audio']
    source_language = request.form.get('source_language', 'English')
    
    if source_language not in LANGUAGE_CODES:
        return jsonify({"error": f"Invalid source language: {source_language}"}), 400
    
    temp_audio_path = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}.wav")
    audio_file.save(temp_audio_path)
    
    try:
        # Specify the language for transcription
        source_lang_code = ASSEMBLYAI_LANGUAGE_CODES.get(source_language, "en")
        
        # Convert recorded voice to text with the specified language
        source_text = transcribe_audio(temp_audio_path, source_lang_code)

        if not source_text.strip():  # Avoid empty text
            return jsonify({"error": "Transcription failed or empty"}), 500

        # Translate text to all languages
        translations = {source_language: source_text}
        audio_paths = {}
        
        # First, store the original language audio
        source_lang_code = LANGUAGE_CODES[source_language]["code"]
        source_audio_path = text_to_speech(source_text, source_lang_code)
        if source_audio_path:
            audio_paths[source_language] = f"/api/audio/{os.path.basename(source_audio_path)}"
        
        # Then translate to other languages
        for lang_name, lang_data in LANGUAGE_CODES.items():
            if lang_name != source_language:
                try:
                    # Translate from source language to target language
                    translated_text = translate_text(
                        source_text, 
                        LANGUAGE_CODES[source_language]["code"], 
                        lang_data["code"]
                    )
                    translations[lang_name] = translated_text
                    
                    # Convert the translated text to speech
                    audio_path = text_to_speech(translated_text, lang_data["code"])
                    if audio_path:
                        audio_paths[lang_name] = f"/api/audio/{os.path.basename(audio_path)}"
                except Exception as e:
                    print(f"Error processing {lang_name}: {str(e)}")
                    translations[lang_name] = f"[Translation error: {str(e)}]"
        
        return jsonify({
            "original_text": source_text,
            "translations": translations,
            "audio_paths": audio_paths
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

@app.route('/api/audio/<filename>', methods=['GET'])
def get_audio(filename):
    """Serve the generated audio files"""
    audio_path = os.path.join(tempfile.gettempdir(), filename)
    if os.path.exists(audio_path):
        return send_file(audio_path, mimetype="audio/mpeg")
    return jsonify({"error": "Audio file not found"}), 404

def transcribe_audio(audio_file, language_code="en"):
    """Transcribe audio using AssemblyAI with specified language"""
    transcriber = aai.Transcriber()
    try:
        # Set up the transcription configuration with the specified language
        config = aai.TranscriptionConfig(
            language_code=language_code
        )
        
        # Transcribe with the specific language configuration
        transcript = transcriber.transcribe(audio_file, config=config)
        
        # Check if we received a proper transcript object
        if not hasattr(transcript, 'text'):
            raise Exception("AssemblyAI returned an unexpected response format")
            
        return transcript.text  # Return just the text string
    except Exception as e:
        raise Exception(f"Transcription error: {str(e)}")

def translate_text(text, source_lang, target_lang):
    """Translate text using Google Translator"""
    try:
        # If source and target are the same, return the original text
        if source_lang == target_lang:
            return text
            
        translated_text = GoogleTranslator(source=source_lang, target=target_lang).translate(text)
        print(f"Translating: {text} -> {target_lang}: {translated_text}")
        return translated_text
    except Exception as e:
        print(f"Translation error for {target_lang}: {str(e)}")
        raise Exception(f"Translation error for {target_lang}: {str(e)}")

def text_to_speech(text, lang="en"):
    """Convert text to speech using gTTS (Google TTS)"""
    try:
        output_file = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}.mp3")
        tts = gTTS(text=text, lang=lang)
        tts.save(output_file)
        print(f"TTS saved: {output_file}")
        return output_file
    except Exception as e:
        print(f"TTS Error: {str(e)}")
        return None

# Add a cleanup function to remove old temporary files periodically
def cleanup_temp_files(max_age_hours=24):
    """Clean up temporary files older than max_age_hours"""
    import time
    from datetime import datetime, timedelta
    
    temp_dir = tempfile.gettempdir()
    cutoff_time = time.time() - (max_age_hours * 60 * 60)
    
    for filename in os.listdir(temp_dir):
        if filename.endswith('.mp3') or filename.endswith('.wav'):
            file_path = os.path.join(temp_dir, filename)
            if os.path.isfile(file_path) and os.path.getmtime(file_path) < cutoff_time:
                try:
                    os.remove(file_path)
                    print(f"Removed old temp file: {file_path}")
                except Exception as e:
                    print(f"Error removing {file_path}: {e}")

if __name__ == "__main__":
    # Clean up any old temp files on startup
    cleanup_temp_files()
    app.run(debug=True, port=5000)