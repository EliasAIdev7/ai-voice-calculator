// ===== WEB SPEECH API SETUP =====
// Check if browser supports Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert('Sorry, your browser does not support Speech Recognition. Please use Chrome or Edge.');
}

const recognition = new SpeechRecognition();
const synthesis = window.speechSynthesis;

// Configure speech recognition
recognition.continuous = false;  // Stop after one result
recognition.interimResults = false;  // Only final results
recognition.lang = 'en-US';  // Language

// ===== DOM ELEMENTS =====
const micButton = document.getElementById('micButton');
const clearButton = document.getElementById('clearButton');
const displayText = document.getElementById('displayText');
const resultText = document.getElementById('resultText');
const status = document.getElementById('status');
const historyList = document.getElementById('historyList');

// ===== STATE =====
let isListening = false;
let history = [];

// ===== WORD REPLACEMENTS =====
const replacements = {
    'plus': '+',
    'add': '+',
    'and': '+',
    'minus': '-',
    'subtract': '-',
    'take away': '-',
    'times': '*',
    'multiply': '*',
    'multiplied by': '*',
    'x': '*',
    'divided by': '/',
    'divide': '/',
    'over': '/',
    'percent': '/100',
    'squared': '**2',
    'cubed': '**3'
};

// ===== FUNCTIONS =====

/**
 * Process voice input and convert to math expression
 */
function processVoiceInput(text) {
    text = text.toLowerCase();
    
    // Remove filler words
    const fillers = ['what is', 'calculate', 'equals', 'equal', 'what\'s'];
    fillers.forEach(word => {
        text = text.replace(new RegExp(word, 'g'), '');
    });
    
    // Apply word replacements
    Object.keys(replacements).forEach(key => {
        text = text.replace(new RegExp(key, 'g'), replacements[key]);
    });
    
    return text.trim();
}

/**
 * Calculate the result safely
 */
function calculate(expression) {
    try {
        // Remove spaces
        expression = expression.replace(/\s/g, '');
        
        // Evaluate (be careful with eval in production!)
        const result = eval(expression);
        
        // Check if result is valid
        if (isNaN(result) || !isFinite(result)) {
            throw new Error('Invalid result');
        }
        
        return result;
    } catch (error) {
        return null;
    }
}

/**
 * Speak text using Text-to-Speech
 */
function speak(text) {
    // Cancel any ongoing speech
    synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;  // Speed
    utterance.pitch = 1.0;  // Pitch
    utterance.volume = 1.0;  // Volume
    
    synthesis.speak(utterance);
}

/**
 * Add to history
 */
function addToHistory(expression, result) {
    history.unshift({
        expression: expression,
        result: result,
        time: new Date().toLocaleTimeString()
    });
    
    // Keep only last 10
    if (history.length > 10) {
        history.pop();
    }
    
    updateHistoryDisplay();
}

/**
 * Update history display
 */
function updateHistoryDisplay() {
    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-history">No calculations yet</p>';
        return;
    }
    
    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <span class="history-expression">${item.expression}</span>
            <span class="history-result">= ${item.result}</span>
        </div>
    `).join('');
}

/**
 * Clear everything
 */
function clearAll() {
    displayText.textContent = 'Tap microphone to start';
    resultText.textContent = '---';
    status.textContent = '';
    status.className = 'status';
}

// ===== EVENT HANDLERS =====

/**
 * Microphone button click
 */
micButton.addEventListener('click', () => {
    if (isListening) return;  // Prevent multiple clicks
    
    isListening = true;
    micButton.classList.add('listening');
    micButton.querySelector('.mic-text').textContent = 'Listening...';
    displayText.textContent = 'Speak now...';
    status.textContent = '🎤 Listening for 5 seconds';
    status.className = 'status';
    
    recognition.start();
});

/**
 * Speech recognition result
 */
recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    displayText.textContent = `"${transcript}"`;
    
    // Process the voice input
    const expression = processVoiceInput(transcript);
    const result = calculate(expression);
    
    if (result !== null) {
        // Success!
        resultText.textContent = result;
        status.textContent = '✅ Calculation successful!';
        status.className = 'status success';
        
        // Speak the answer
        speak(`The answer is ${result}`);
        
        // Add to history
        addToHistory(expression, result);
    } else {
        // Error
        resultText.textContent = 'Error';
        status.textContent = '❌ Could not calculate that';
        status.className = 'status error';
        speak('Sorry, I could not calculate that');
    }
};

/**
 * Speech recognition end
 */
recognition.onend = () => {
    isListening = false;
    micButton.classList.remove('listening');
    micButton.querySelector('.mic-text').textContent = 'Tap to Speak';
};

/**
 * Speech recognition error
 */
recognition.onerror = (event) => {
    isListening = false;
    micButton.classList.remove('listening');
    micButton.querySelector('.mic-text').textContent = 'Tap to Speak';
    
    if (event.error === 'no-speech') {
        status.textContent = '❌ No speech detected';
        status.className = 'status error';
        displayText.textContent = 'No speech detected. Try again.';
    } else {
        status.textContent = `❌ Error: ${event.error}`;
        status.className = 'status error';
    }
};

/**
 * Clear button click
 */
clearButton.addEventListener('click', clearAll);

// ===== INITIALIZATION =====
console.log('🎤 AI Voice Calculator loaded successfully!');
console.log('Built by @EliasAIdev7');
