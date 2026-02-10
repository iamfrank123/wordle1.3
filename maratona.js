
const socket = io();

// DOM Elements
const setupContainer = document.getElementById('maratona-setup-container');
const gameContainer = document.getElementById('maratona-game-container');
const setupMessage = document.getElementById('setup-message');
const marathonGrid = document.getElementById('marathon-grid');
const gameStatus = document.getElementById('game-status');
const backToLobbySetupBtn = document.getElementById('back-to-lobby-setup-btn');
const backToLobbyGameBtn = document.getElementById('back-to-lobby-game-btn');

// Game State
let currentGuess = '';
let gameStarted = false;
const WORD_LENGTH = 5;
let roomCode = '';

// Audio
const audioWin = new Audio('audio/audio_win.mp3');

// Initialize Player Session
let playerId = localStorage.getItem('maratonaPlayerId');
if (!playerId) {
    playerId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('maratonaPlayerId', playerId);
}

// URL Params
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');
const urlRoomCode = urlParams.get('room');

// Check for active session to rejoin
const savedRoom = localStorage.getItem('maratonaCurrentRoom');

// Initialize
if (mode === 'create') {
    const lang = localStorage.getItem('language') || 'it';
    socket.emit('createMaratonaRoom', { lang: lang, playerId: playerId });
} else if (mode === 'join' && urlRoomCode) {
    socket.emit('joinMaratonaRoom', { code: urlRoomCode, playerId: playerId });
} else if (savedRoom && !mode) {
    console.log('Tentativo di riconnessione Maratona:', savedRoom);
    socket.emit('rejoinMaratonaRoom', { roomCode: savedRoom, playerId: playerId });
    roomCode = savedRoom;
} else {
    localStorage.removeItem('maratonaCurrentRoom');
}

// ========== CONNECTION HANDLERS ==========
socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    const storedRoom = localStorage.getItem('maratonaCurrentRoom');
    const pid = localStorage.getItem('maratonaPlayerId');

    if (storedRoom && pid) {
        socket.emit('rejoinMaratonaRoom', { roomCode: storedRoom, playerId: pid });
    }
});

// ========== SOCKET EVENTS ==========

socket.on('maratonaRoomCreated', (code) => {
    roomCode = code;
    localStorage.setItem('maratonaCurrentRoom', code);
    setupMessage.textContent = TranslationManager.t('msg_room_created', { code: code, lang: 'IT' });
    setupMessage.style.color = '#51cf66';
    window.history.replaceState({}, '', `maratona.html?mode=create&room=${code}`);
});

socket.on('maratonaRoomJoined', (code) => {
    roomCode = code;
    localStorage.setItem('maratonaCurrentRoom', code);
    setupMessage.textContent = TranslationManager.t('marathon_msg_connected_waiting');
    setupMessage.style.color = '#51cf66';
});

socket.on('maratonaStateSync', (state) => {
    console.log('Sync State:', state);
    gameStarted = state.gameStarted;
    roomCode = state.roomCode;

    if (state.gameStarted) {
        setupContainer.style.display = 'none';
        gameContainer.style.display = 'flex';
        marathonGrid.innerHTML = '';

        // Rebuild History
        state.guesses.forEach(g => {
            // Check if I am the owner of this guess
            const isOwner = (g.playerId === playerId);
            // Note: Server needs to send playerId, not socket.id in history
            addCommittedRow(g.word, g.feedback, isOwner);
        });

        createTypingRow();
        gameStatus.textContent = TranslationManager.t('marathon_msg_recovered');
        setTimeout(() => { if (gameStarted) gameStatus.textContent = ""; }, 2000);
    } else {
        setupMessage.textContent = TranslationManager.t('marathon_reconnected_lobby');
    }
});

socket.on('maratonaGameStart', (data) => {
    gameStarted = true;
    setupContainer.style.display = 'none';
    gameContainer.style.display = 'flex';
    setupMessage.textContent = data.message;
    marathonGrid.innerHTML = ''; // Start clean

    // Create initial empty row for typing
    createTypingRow();
});

socket.on('maratonaGuessUpdate', (data) => {
    // data: { word, feedback, isOwner }

    // Remove the temporary typing row if it exists
    const typingRow = marathonGrid.querySelector('.typing-row');
    if (typingRow) typingRow.remove();

    // Add the committed guess row
    addCommittedRow(data.word, data.feedback, data.isOwner);

    // If it was my guess, clear current input and update keyboard
    if (data.isOwner) {
        currentGuess = '';
        // updateKeyboardFeedback(data.word, data.feedback); // REMOVED
    }

    // Re-add typing row for next guess
    createTypingRow();
    // Scroll to bottom
    marathonGrid.scrollTop = marathonGrid.scrollHeight;
});

socket.on('maratonaGameOver', (data) => {
    gameStarted = false;
    const amIWinner = data.winnerId === socket.id;

    if (amIWinner) {
        gameStatus.innerHTML = `<span style="color: #51cf66;">${TranslationManager.t('marathon_win')}</span>`;
        audioWin.play().catch(e => console.log('Audio play failed', e));
    } else {
        gameStatus.innerHTML = `<span style="color: #ff6b6b;">${TranslationManager.t('marathon_lose')}</span>`;
    }
    gameStatus.innerHTML += `<br>${TranslationManager.t('msg_secret_word', { word: data.secretWord })}`;

    createRematchButton();
});

socket.on('maratonaRematchStart', (data) => {
    gameStatus.textContent = data.message;
    resetGame();
});

socket.on('maratonaRematchRequested', (msg) => {
    gameStatus.textContent = msg;
});

socket.on('maratonaError', (msg) => {
    if (gameStarted) {
        // Show in-game error (e.g., using a toast or shaking the row)
        // For now, let's use a temporary status message or alert
        const oldStatus = gameStatus.innerHTML;
        gameStatus.innerHTML = `<span style="color: #ff6b6b;">${msg}</span>`;
        setTimeout(() => {
            if (gameStarted) gameStatus.innerHTML = oldStatus;
        }, 2000);

        // Shake animation on typing row
        const row = marathonGrid.querySelector('.typing-row');
        if (row) {
            row.classList.add('shake-anim');
            setTimeout(() => row.classList.remove('shake-anim'), 500);
        }
    } else {
        setupMessage.textContent = msg;
        setupMessage.style.color = '#ff6b6b';
    }
});

socket.on('maratonaPlayerLeft', (msg) => {
    alert(msg);
    window.location.href = 'index.html';
});


// ========== UI LOGIC ==========

function createTypingRow() {
    if (!gameStarted) return;
    const row = document.createElement('div');
    row.className = 'grid-row typing-row';
    // Style it to look like it belongs to me (blueish placeholder?) or neutral?
    // It's the row I'm typing in.

    for (let i = 0; i < WORD_LENGTH; i++) {
        const box = document.createElement('div');
        box.className = 'box';
        // Fill with currentGuess if any
        if (currentGuess[i]) {
            box.textContent = currentGuess[i];
            box.classList.add('pop-anim');
        }
        row.appendChild(box);
    }
    marathonGrid.appendChild(row);
    // Scroll to bottom
    marathonGrid.scrollTop = marathonGrid.scrollHeight;
}

function updateTypingRow() {
    const row = marathonGrid.querySelector('.typing-row');
    if (!row) return;

    const boxes = row.querySelectorAll('.box');
    boxes.forEach((box, i) => {
        box.textContent = currentGuess[i] || '';
        if (currentGuess[i]) {
            // box.classList.add('pop-anim'); // Optional: animation
        }
    });
}

function addCommittedRow(word, feedback, isOwner) {
    const row = document.createElement('div');
    row.className = `grid-row ${isOwner ? 'marathon-own' : 'marathon-opponent'}`;

    for (let i = 0; i < WORD_LENGTH; i++) {
        const box = document.createElement('div');
        box.className = 'box';
        box.textContent = word[i];

        // Add feedback colors ONLY if Owner
        if (isOwner && feedback) {
            const status = feedback[i];
            if (status === 'correct') box.classList.add('correct-position');
            else if (status === 'present') box.classList.add('wrong-position');
            else if (status === 'absent') box.classList.add('not-in-word');
        } else {
            // Opponent sees neutral (maybe greyed out or just red border from row class)
            box.classList.add('neutral-filled'); // Add a class for filled but no hint if needed
        }
        row.appendChild(box);
    }
    marathonGrid.appendChild(row);
}

function resetGame() {
    gameStarted = true;
    marathonGrid.innerHTML = '';
    currentGuess = '';

    // Remove rematch button
    const btn = document.getElementById('rematch-btn');
    if (btn) btn.remove();

    createTypingRow();
}

function createRematchButton() {
    const existingBtn = document.getElementById('rematch-btn');
    if (existingBtn) return;

    const btn = document.createElement('button');
    btn.id = 'rematch-btn';
    btn.className = 'primary-btn';
    btn.textContent = TranslationManager.t('btn_rematch');
    btn.onclick = () => {
        socket.emit('maratonaRematch');
        btn.textContent = TranslationManager.t('btn_rematch_sent');
        btn.disabled = true;
    };

    gameContainer.insertBefore(btn, keyboardContainer);
}


// ========== INPUT ==========

function handleKeyInput(key) {
    if (!gameStarted) return;

    if (key === 'ENTER') {
        if (currentGuess.length === WORD_LENGTH) {
            // Provide playerId to verify ownership on server
            socket.emit('submitMaratonaGuess', { guess: currentGuess, playerId: playerId });
        } else {
            // Shake animation or warning
        }
    } else if (key === '⌫' || key === 'BACKSPACE') {
        currentGuess = currentGuess.slice(0, -1);
        updateTypingRow();
    } else if (currentGuess.length < WORD_LENGTH) {
        if (/^[A-Z]$/.test(key)) {
            currentGuess += key;
            updateTypingRow();
        }
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleKeyInput('ENTER');
    else if (e.key === 'Backspace') handleKeyInput('BACKSPACE');
    else if (/^[a-zA-Z]$/.test(e.key)) handleKeyInput(e.key.toUpperCase());
});

// ========== NAVIGATION ==========
backToLobbySetupBtn.onclick = () => {
    localStorage.removeItem('maratonaCurrentRoom');
    window.location.href = 'index.html';
};
backToLobbyGameBtn.onclick = () => {
    if (confirm(TranslationManager.t('leave_game_msg'))) {
        localStorage.removeItem('maratonaCurrentRoom');
        window.location.href = 'index.html';
    }
};
