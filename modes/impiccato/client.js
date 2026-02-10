const socket = io('/impiccato');

let roomCode = null;
let myId = null;
let isHost = false;
let currentWordLength = 5;
let revealedLetters = {};
let guessedLetters = [];

// Audio elements
const audioWin = document.getElementById('audio-win');
const audioMyTurn = document.getElementById('audio-myturn');
const audioTick = document.getElementById('audio-tick');

// Screen elements
const lobbyScreen = document.getElementById('lobby-screen');
const waitingScreen = document.getElementById('waiting-screen');
const gameScreen = document.getElementById('game-screen');
const endModal = document.getElementById('end-modal');

// ======================
// LOBBY FUNCTIONS
// ======================

function createRoom() {
    const nickname = document.getElementById('nickname').value.trim();
    if (!nickname) {
        document.getElementById('create-error').textContent = 'Inserisci un nickname!';
        return;
    }

    const wordLength = parseInt(document.querySelector('input[name="wordLength"]:checked').value);
    currentWordLength = wordLength;

    socket.emit('createRoom', { nickname, wordLength });
}

function joinRoom() {
    const nickname = document.getElementById('nickname').value.trim();
    const code = document.getElementById('room-code-input').value.trim().toUpperCase();

    if (!nickname) {
        document.getElementById('join-error').textContent = 'Inserisci un nickname!';
        return;
    }

    if (!code) {
        document.getElementById('join-error').textContent = 'Inserisci il codice stanza!';
        return;
    }

    socket.emit('joinRoom', { roomCode: code, nickname });
}

function startGame() {
    socket.emit('startGame');
}

// ======================
// SOCKET EVENTS
// ======================

socket.on('roomCreated', ({ roomCode: code, wordLength }) => {
    roomCode = code;
    myId = socket.id;
    isHost = true;
    currentWordLength = wordLength;

    document.getElementById('display-room-code').textContent = code;
    document.getElementById('start-btn').style.display = 'block';

    switchScreen(waitingScreen);
});

socket.on('roomJoined', () => {
    // Will be followed by playerJoined event
});

socket.on('playerJoined', ({ players }) => {
    roomCode = socket.roomCode;
    myId = socket.id;

    updatePlayersList(players);

    if (!isHost) {
        switchScreen(waitingScreen);
    }
});

socket.on('gameStarted', ({ wordLength, players }) => {
    currentWordLength = wordLength;
    revealedLetters = {};
    guessedLetters = [];

    initializeGame(wordLength, players);
    switchScreen(gameScreen);
});

socket.on('turnUpdate', ({ playerId, timeLeft }) => {
    updateTurnIndicator(playerId);
    updateTimer(timeLeft);

    if (playerId === socket.id) {
        playSound(audioMyTurn);
    }
});

socket.on('timerTick', ({ timeLeft }) => {
    updateTimer(timeLeft);

    // Play tick sound in last 5 seconds
    if (timeLeft <= 5 && timeLeft > 0) {
        playSound(audioTick);
    }
});

socket.on('letterResult', ({ success, letter, positions, revealedLetters: revealed, message, private: isPrivate }) => {
    if (success) {
        // Correct letter - update grid
        revealedLetters = revealed;
        updateWordGrid(positions, letter);
        markKeyAsUsed(letter, 'correct');
        guessedLetters.push(letter);
    } else {
        // Incorrect letter - show private message
        if (isPrivate) {
            showTemporaryMessage(message || 'Lettera assente!', 'error');
            markKeyAsUsed(letter, 'incorrect');
            guessedLetters.push(letter);
        }
    }
});

socket.on('opponentGuessed', ({ playerId, wasCorrect }) => {
    // Just visual feedback that opponent guessed (don't reveal letter)
    console.log(`Player ${playerId} guessed. Correct: ${wasCorrect}`);
});

socket.on('roundEnded', ({ winnerId, winnerNickname, secretWord, players }) => {
    showWinModal(winnerNickname, secretWord);
    updatePlayersStatus(players);

    if (winnerId === socket.id) {
        playSound(audioWin);
    }
});

socket.on('newHost', ({ hostId }) => {
    isHost = (hostId === socket.id);
    if (isHost) {
        document.getElementById('host-options').style.display = 'block';
        document.getElementById('modal-waiting-msg').style.display = 'none';
    }
});

socket.on('playerLeft', ({ playerId, players }) => {
    updatePlayersList(players);
    updatePlayersStatus(players);
});

socket.on('error', (message) => {
    alert(message);
});

// ======================
// GAME FUNCTIONS
// ======================

function initializeGame(wordLength, players) {
    // Create word grid
    const wordGrid = document.getElementById('word-grid');
    wordGrid.innerHTML = '';

    for (let i = 0; i < wordLength; i++) {
        const box = document.createElement('div');
        box.className = 'letter-box empty';
        box.dataset.index = i;
        wordGrid.appendChild(box);
    }

    // Create keyboard
    const keyboard = document.getElementById('keyboard');
    keyboard.innerHTML = '';

    const letters = 'ABCDEFGHILMNOPQRSTUVZ'.split('');
    letters.forEach(letter => {
        const key = document.createElement('div');
        key.className = 'key';
        key.textContent = letter;
        key.dataset.letter = letter;
        key.addEventListener('click', () => submitLetter(letter));
        keyboard.appendChild(key);
    });

    // Update players status
    updatePlayersStatus(players);
}

function submitLetter(letter) {
    const key = document.querySelector(`.key[data-letter="${letter}"]`);

    // Check if already guessed
    if (guessedLetters.includes(letter) || key.classList.contains('disabled')) {
        return;
    }

    socket.emit('submitLetter', letter);
}

function updateWordGrid(positions, letter) {
    positions.forEach(pos => {
        const box = document.querySelector(`.letter-box[data-index="${pos}"]`);
        if (box) {
            box.textContent = letter;
            box.classList.remove('empty');
            box.classList.add('revealed');
        }
    });
}

function markKeyAsUsed(letter, status) {
    const key = document.querySelector(`.key[data-letter="${letter}"]`);
    if (key) {
        key.classList.add('disabled', status);
    }
}

function updateTurnIndicator(playerId) {
    const indicator = document.getElementById('turn-indicator');

    if (playerId === socket.id) {
        indicator.textContent = '🎯 IL TUO TURNO';
        indicator.classList.add('your-turn');
    } else {
        indicator.textContent = '⏳ Turno avversario...';
        indicator.classList.remove('your-turn');
    }
}

function updateTimer(seconds) {
    const timer = document.getElementById('timer');
    timer.textContent = seconds;

    if (seconds <= 5) {
        timer.classList.add('warning');
    } else {
        timer.classList.remove('warning');
    }
}

function updatePlayersStatus(players) {
    const playersStatus = document.getElementById('players-status');
    playersStatus.innerHTML = '';

    players.forEach(player => {
        const item = document.createElement('div');
        item.className = 'player-status-item';
        item.innerHTML = `
            <span class="player-name">${player.nickname}${player.id === socket.id ? ' (Tu)' : ''}</span>
            <span class="player-score">🏆 ${player.score || 0}</span>
        `;
        playersStatus.appendChild(item);
    });
}

function updatePlayersList(players) {
    const playersList = document.getElementById('players-list');
    playersList.innerHTML = '<h3>Giocatori:</h3>';

    players.forEach(player => {
        const item = document.createElement('div');
        item.className = 'player-item';
        if (player.id === myId && isHost) {
            item.classList.add('host');
        }
        item.textContent = player.nickname;
        playersList.appendChild(item);
    });
}

function showWinModal(winnerNickname, secretWord) {
    document.getElementById('modal-winner').textContent = winnerNickname;
    document.getElementById('modal-word').textContent = secretWord;

    if (isHost) {
        document.getElementById('host-options').style.display = 'block';
        document.getElementById('modal-waiting-msg').style.display = 'none';
    } else {
        document.getElementById('host-options').style.display = 'none';
        document.getElementById('modal-waiting-msg').style.display = 'block';
    }

    endModal.classList.add('active');
}

function nextRound() {
    endModal.classList.remove('active');

    let configUpdate = {};
    if (isHost) {
        const selectedLength = parseInt(document.getElementById('next-length-modal').value);
        configUpdate.wordLength = selectedLength;
        currentWordLength = selectedLength;
    }

    socket.emit('nextRound', configUpdate);
}

// ======================
// UTILITY FUNCTIONS
// ======================

function switchScreen(targetScreen) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    targetScreen.classList.add('active');
}

function showTemporaryMessage(message, type = 'info') {
    const existingMsg = document.querySelector('.temp-message');
    if (existingMsg) existingMsg.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = `temp-message ${type}`;
    msgDiv.textContent = message;
    msgDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#ff4444' : '#00ff88'};
        color: #1a1a2e;
        padding: 15px 30px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 2000;
        animation: slideDown 0.3s ease-out;
    `;

    document.body.appendChild(msgDiv);

    setTimeout(() => {
        msgDiv.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => msgDiv.remove(), 300);
    }, 2000);
}

function playSound(audio) {
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
}

// Add CSS for message animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Physical keyboard support
document.addEventListener('keydown', (e) => {
    if (gameScreen.classList.contains('active')) {
        const letter = e.key.toUpperCase();
        if (/^[A-Z]$/.test(letter)) {
            submitLetter(letter);
        }
    }
});
