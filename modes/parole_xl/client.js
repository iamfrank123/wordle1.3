const socket = io('/parole_xl');

// State
let myId = null;
let currentRoom = null;
let isHost = false;
let currentLength = 5;
let myTurn = false;
let currentRow = 0;
let currentGuess = '';
let grid = []; // Array of {letter, status}
let maxRows = 6;
let timerInterval = null;
let currentMode = 'turns';

// DOM Elements
const screens = document.querySelectorAll('.screen');
const lobbyScreen = document.getElementById('lobby-screen');
const waitingScreen = document.getElementById('waiting-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');

// Audio Elements
let audioWin, audioMyTurn, audioTick;

// Emoji Reactions
let myNickname = '';
let playerNicknames = {}; // Map of playerId -> nickname

// Initialize audio after DOM loads
window.addEventListener('DOMContentLoaded', () => {
    audioWin = document.getElementById('audio-win');
    audioMyTurn = document.getElementById('audio-myturn');
    audioTick = document.getElementById('audio-tick');

    // Initialize emoji reaction buttons
    initEmojiReactions();
});

// --- NAVIGATION ---
function showScreen(id) {
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// --- LOBBY ---
document.querySelectorAll('.checkbox-label').forEach(label => {
    label.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') {
            e.target.parentElement.classList.toggle('checked', e.target.checked);
        }
    });
});

function createRoom() {
    const nickname = document.getElementById('nickname').value || 'Host';
    const lengths = [];
    document.querySelectorAll('#length-options input:checked').forEach(cb => lengths.push(parseInt(cb.value)));

    if (lengths.length === 0) {
        document.getElementById('create-error').innerText = "Seleziona almeno una lunghezza.";
        return;
    }

    const gameMode = document.querySelector('input[name="gameMode"]:checked').value;

    const config = {
        nickname,
        selectedLengths: lengths,
        gameMode,
        shuffle: document.getElementById('shuffle-mode').checked,
        // timerEnabled implies turns, handled by server
    };

    socket.emit('createRoom', config);
}

function joinRoom() {
    const nickname = document.getElementById('nickname').value || 'Player';
    const code = document.getElementById('room-code-input').value.toUpperCase();

    if (!code) {
        document.getElementById('join-error').innerText = "Inserisci un codice.";
        return;
    }

    socket.emit('joinRoom', { roomCode: code, nickname });
}

// --- SOCKET EVENTS ---
socket.on('connect', () => {
    myId = socket.id;
    console.log("Connected", myId);
});

socket.on('roomCreated', (data) => {
    currentRoom = data.roomCode;
    isHost = true;
    enterWaitingRoom();
});

socket.on('playerJoined', (data) => {
    // data.players is array
    updatePlayerList(data.players);

    // Update nickname map for emoji reactions
    data.players.forEach(p => {
        playerNicknames[p.id] = p.nickname;
        if (p.id === myId) {
            myNickname = p.nickname;
        }
    });

    if (!isHost && !currentRoom) {
        // I just joined
        currentRoom = document.getElementById('room-code-input').value.toUpperCase(); // Simplification
        enterWaitingRoom();
    }
});

socket.on('error', (msg) => {
    alert(msg);
});

function enterWaitingRoom() {
    showScreen('waiting-screen');
    document.getElementById('display-room-code').innerText = currentRoom;
    if (isHost) {
        document.getElementById('start-btn').style.display = 'block';
    }
}

function updatePlayerList(players) {
    const list = document.getElementById('players-list');
    list.innerHTML = '';

    // Also update opponent list for game
    const oppList = document.getElementById('opponent-list');
    oppList.innerHTML = '';

    players.forEach(p => {
        const div = document.createElement('div');
        div.innerText = `${p.nickname} ${p.id === myId ? '(Tu)' : ''}`;
        div.style.padding = "10px";
        div.style.background = "rgba(255,255,255,0.1)";
        div.style.marginBottom = "5px";
        list.appendChild(div);

        // Opponent list
        if (p.id !== myId) {
            const oppCard = document.createElement('div');
            oppCard.className = 'player-card';
            oppCard.id = `opp-${p.id}`;
            oppCard.innerHTML = `<div class="player-name">${p.nickname}</div><div class="opp-info">Score: ${p.score || 0}</div><div class="opp-status">Attesa...</div>`;
            oppList.appendChild(oppCard);
        }
    });
}

function startGame() {
    socket.emit('startGame');
}

socket.on('gameStarted', (data) => {
    currentLength = data.wordLength;
    currentMode = data.gameMode || 'turns';
    maxRows = 6;
    currentRow = 0;
    currentGuess = '';
    grid = [];

    document.getElementById('current-length').innerText = currentLength;
    initGrid();
    initKeyboard();
    showScreen('game-screen');

    // Reset opponent status
    data.players.forEach(p => {
        if (p.id !== myId) {
            const card = document.getElementById(`opp-${p.id}`);
            if (card) {
                if (currentMode === 'realtime') {
                    // Change structure for realtime score
                    card.innerHTML = `<div class="player-name">${p.nickname}</div><div class="big-score" id="score-${p.id}">0/${currentLength}</div>`;
                } else {
                    // Turn based
                    card.querySelector('.opp-info').innerText = "Score: " + (p.score || 0); // Or status
                    card.querySelector('.opp-status').innerText = "In gioco";
                }
            }
        }
    });

    if (currentMode === 'realtime') {
        myTurn = true;
        document.getElementById('turn-indicator').innerText = "GARA DI VELOCITÀ!";
        document.getElementById('turn-indicator').style.color = "var(--primary-color)";
        document.getElementById('timer').innerText = "∞";
    }

    // Hide modal if visible
    document.getElementById('end-modal').classList.remove('active');
});

socket.on('turnUpdate', (data) => {
    if (currentMode === 'realtime') return;
    const isMe = data.playerId === myId;
    myTurn = isMe;
    const indicator = document.getElementById('turn-indicator');

    if (isMe) {
        indicator.innerText = "IL TUO TURNO!";
        indicator.style.color = "var(--primary-color)";
        // Play turn sound
        if (audioMyTurn) {
            audioMyTurn.currentTime = 0;
            audioMyTurn.play().catch(e => console.log('Audio play failed:', e));
        }
    } else {
        indicator.innerText = "Turno degli avversari...";
        indicator.style.color = "gray";
    }

    // Timer
    if (data.timeLeft !== null) {
        startTimer(data.timeLeft);
    } else {
        document.getElementById('timer').innerText = "--:--";
    }
});

function startTimer(seconds) {
    if (timerInterval) clearInterval(timerInterval);
    let t = seconds;
    const el = document.getElementById('timer');
    el.innerText = t;
    let tickPlayed = false; // Flag to ensure tick plays only once
    timerInterval = setInterval(() => {
        t--;
        el.innerText = t;

        // Play tick sound at exactly 7 seconds before timeout (38 seconds for 45s timer)
        if (t === 7 && !tickPlayed && audioTick) {
            tickPlayed = true;
            audioTick.currentTime = 0;
            audioTick.play().catch(e => console.log('Audio play failed:', e));
        }

        if (t <= 0) clearInterval(timerInterval);
    }, 1000);
}

socket.on('scoreUpdate', (data) => {
    // For Realtime mode
    const scoreEl = document.getElementById(`score-${data.playerId}`);
    if (scoreEl) {
        scoreEl.innerText = `${data.greenCount}/${data.totalLength}`;
        if (data.won) {
            scoreEl.innerText = "VITTORIA!";
            scoreEl.style.color = "gold";
        }
    }
});

socket.on('guessResult', (data) => {
    if (data.playerId === myId) {
        // My result
        updateMyGrid(data.word, data.feedback);
    } else {
        if (currentMode === 'turns') {
            // Shared Grid: Show opponent guess on MY grid 
            updateMyGrid(data.word, data.feedback);
        }

        // Update generic status text if card exists (fallback)
        const card = document.getElementById(`opp-${data.playerId}`);
        if (card && currentMode === 'turns') {
            card.querySelector('.opp-status').innerText = `Ha tentato: ${data.word}`;
        }
    }
});

socket.on('roundEnded', (data) => {
    // Clear timer interval
    if (timerInterval) clearInterval(timerInterval);

    // Show modal overlay
    const modal = document.getElementById('end-modal');
    modal.classList.add('active');

    // Set word
    document.getElementById('modal-word').innerText = data.secretWord;

    // Set title based on winner
    const isWinner = data.winnerId === myId;
    const winner = data.players ? data.players.find(p => p.id === data.winnerId) : null;
    const winnerName = winner ? winner.nickname : 'Avversario';

    if (isWinner) {
        document.getElementById('modal-title').innerText = "HAI VINTO!";
        // Play win sound
        if (audioWin) {
            audioWin.currentTime = 0;
            audioWin.play().catch(e => console.log('Audio play failed:', e));
        }
    } else {
        document.getElementById('modal-title').innerText = `${winnerName} ha vinto!`;
    }

    // Button visibility
    if (isHost) {
        document.getElementById('btn-new-game').style.display = 'block';
        document.getElementById('host-options').style.display = 'block';
        document.getElementById('modal-waiting-msg').style.display = 'none';
    } else {
        document.getElementById('btn-new-game').style.display = 'none';
        document.getElementById('host-options').style.display = 'none';
        document.getElementById('modal-waiting-msg').style.display = 'block';
    }
});

// --- GAME LOGIC ---

function initGrid() {
    const container = document.getElementById('grid-container');
    container.innerHTML = '';
    // Create just the first row initially
    createNewRow(0);
}

function createNewRow(rowIndex) {
    const container = document.getElementById('grid-container');
    const row = document.createElement('div');
    row.className = 'grid-row';
    for (let c = 0; c < currentLength; c++) {
        const box = document.createElement('div');
        box.className = 'box';
        box.id = `box-${rowIndex}-${c}`;
        row.appendChild(box);
    }
    container.appendChild(row);
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}



function initKeyboard() {
    const container = document.getElementById('keyboard');
    container.innerHTML = '';
    const rows = [
        "QWERTYUIOP",
        "ASDFGHJKL",
        "ZXCVBNM"
    ];

    rows.forEach(r => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';

        // Add Enter/Back on last row
        if (r === rows[rows.length - 1]) {
            const enter = createKey('ENTER', true);
            enter.onclick = submitGuess;
            rowDiv.appendChild(enter);
        }

        r.split('').forEach(char => {
            const k = createKey(char, false);
            k.onclick = () => handleInput(char);
            rowDiv.appendChild(k);
        });

        if (r === rows[rows.length - 1]) {
            const back = createKey('⌫', true);
            back.onclick = backspace;
            rowDiv.appendChild(back);
        }

        container.appendChild(rowDiv);
    });
}

function createKey(char, big) {
    const div = document.createElement('div');
    div.className = `key ${big ? 'big' : ''}`;
    div.innerText = char;
    div.id = `key-${char}`;
    return div;
}

function handleInput(char) {
    if (!myTurn) return;
    if (currentGuess.length < currentLength) {
        currentGuess += char;
        updateCurrentRow();
    }
}

function backspace() {
    if (!myTurn) return;
    if (currentGuess.length > 0) {
        currentGuess = currentGuess.slice(0, -1);
        updateCurrentRow();
    }
}

function updateCurrentRow() {
    for (let i = 0; i < currentLength; i++) {
        const box = document.getElementById(`box-${currentRow}-${i}`);
        box.innerText = currentGuess[i] || '';
        box.classList.add('current-row-box'); // Optional styling
    }
}

function submitGuess() {
    if (!myTurn) return;
    if (currentGuess.length !== currentLength) {
        // Animation?
        return;
    }

    socket.emit('submitGuess', currentGuess);
    // Don't advance row yet, wait for result
}

function updateMyGrid(word, feedback) {
    // word: string, feedback: ['correct', 'absent'...]
    for (let i = 0; i < currentLength; i++) {
        const box = document.getElementById(`box-${currentRow}-${i}`);
        box.innerText = word[i];
        box.classList.add(feedback[i]);

        // Key update
        const key = document.getElementById(`key-${word[i]}`);
        if (key) {
            // Logic for priority: correct > present > absent
            // If already correct, don't change.
            if (!key.classList.contains('correct')) {
                if (feedback[i] === 'correct') {
                    key.classList.remove('present', 'absent');
                    key.classList.add('correct');
                } else if (feedback[i] === 'present' && !key.classList.contains('correct')) {
                    key.classList.remove('absent');
                    key.classList.add('present');
                } else if (feedback[i] === 'absent' && !key.classList.contains('present') && !key.classList.contains('correct')) {
                    key.classList.add('absent');
                }
            }
        }
    }
    currentRow++;
    createNewRow(currentRow);
    currentGuess = '';
}

// Host controls
function nextRound() {
    const lenSelect = document.getElementById('next-length-modal');
    const len = lenSelect ? lenSelect.value : currentLength;
    socket.emit('nextRound', { length: parseInt(len) });
}

// Keyboard events
document.addEventListener('keydown', (e) => {
    if (document.getElementById('game-screen').classList.contains('active')) {
        const key = e.key.toUpperCase();
        if (key === 'ENTER') submitGuess();
        else if (key === 'BACKSPACE') backspace();
        else if (/^[A-Z]$/.test(key)) handleInput(key);
    }
});

// --- EMOJI REACTIONS ---

function initEmojiReactions() {
    const emojiButtons = document.querySelectorAll('.emoji-button');
    emojiButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const emoji = btn.getAttribute('data-emoji');
            sendEmojiReaction(emoji);
        });
    });
}

function sendEmojiReaction(emoji) {
    // Create floating animation locally
    createFloatingEmoji(emoji);

    // Send to server to broadcast to other players
    socket.emit('emojiReaction', { emoji, roomCode: currentRoom });
}

function createFloatingEmoji(emoji) {
    const floatingEmoji = document.createElement('div');
    floatingEmoji.className = 'floating-emoji';
    floatingEmoji.textContent = emoji;

    // Random horizontal position near the emoji panel
    const randomX = window.innerWidth - 100 - Math.random() * 50;
    const randomY = window.innerHeight - 100 - Math.random() * 100;

    floatingEmoji.style.left = randomX + 'px';
    floatingEmoji.style.top = randomY + 'px';

    document.body.appendChild(floatingEmoji);

    // Remove after animation completes
    setTimeout(() => {
        floatingEmoji.remove();
    }, 3000);
}

function displayReaction(emoji, playerName) {
    const reactionsDisplay = document.getElementById('emoji-reactions-display');

    const reactionItem = document.createElement('div');
    reactionItem.className = 'reaction-item';
    reactionItem.innerHTML = `
        <span class="emoji">${emoji}</span>
        <span class="player-name">${playerName}</span>
    `;

    reactionsDisplay.appendChild(reactionItem);

    // Remove after 3 seconds
    setTimeout(() => {
        reactionItem.remove();
    }, 3000);
}

// Socket event for receiving emoji reactions from other players
socket.on('emojiReaction', (data) => {
    // data: { emoji, playerId, playerName }
    if (data.playerId !== myId) {
        // Display reaction from other player
        displayReaction(data.emoji, data.playerName);
        createFloatingEmoji(data.emoji);
    }
});
