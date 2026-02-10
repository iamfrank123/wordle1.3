const { getRandomWord } = require('./words');

// Rooms storage
const rooms = {};

// Generate unique room code
function generateRoomCode() {
    let code;
    do {
        code = Math.random().toString(36).substring(2, 6).toUpperCase();
    } while (rooms[code]);
    return code;
}

// Select secret word based on room configuration
function selectSecretWord(wordLength) {
    const word = getRandomWord(wordLength);
    console.log(`[IMPICCATO] Selected word (length ${wordLength}): ${word}`);
    return word;
}

function initImpiccato(ioMain) {
    const io = ioMain.of('/impiccato');

    console.log("[IMPICCATO] Module initialized on namespace /impiccato");

    io.on('connection', (socket) => {
        console.log(`[IMPICCATO] New connection: ${socket.id}`);

        // Create Room
        socket.on('createRoom', ({ nickname, wordLength }) => {
            const roomCode = generateRoomCode();

            rooms[roomCode] = {
                code: roomCode,
                host: socket.id,
                players: [{
                    id: socket.id,
                    nickname: nickname || 'Host',
                    score: 0
                }],
                config: {
                    wordLength: wordLength || 5
                },
                gameState: {
                    status: 'lobby', // lobby, playing, ended
                    secretWord: null,
                    revealedLetters: {}, // { position: letter }
                    guessedLetters: [], // letters that have been guessed
                    turnIndex: 0,
                    currentPlayerId: null,
                    timer: null,
                    timeLeft: 30
                }
            };

            socket.join(roomCode);
            socket.roomId = roomCode;

            socket.emit('roomCreated', { roomCode, wordLength });
            console.log(`[IMPICCATO] Room created: ${roomCode} by ${nickname}`);
        });

        // Join Room
        socket.on('joinRoom', ({ roomCode, nickname }) => {
            const room = rooms[roomCode];
            if (!room) {
                return socket.emit('error', 'Stanza non trovata');
            }
            if (room.gameState.status !== 'lobby') {
                return socket.emit('error', 'Partita già in corso');
            }

            const newPlayer = {
                id: socket.id,
                nickname: nickname || `Player ${room.players.length + 1}`,
                score: 0
            };

            room.players.push(newPlayer);
            socket.join(roomCode);
            socket.roomId = roomCode;

            console.log(`[IMPICCATO] ${nickname} joined ${roomCode}`);

            // Notify everyone
            io.to(roomCode).emit('playerJoined', {
                players: room.players.map(p => ({ id: p.id, nickname: p.nickname }))
            });
        });

        // Start Game
        socket.on('startGame', () => {
            const roomCode = socket.roomId;
            const room = rooms[roomCode];

            if (!room || room.host !== socket.id) return;

            startRound(roomCode);
        });

        function startRound(roomCode) {
            const room = rooms[roomCode];
            const secretWord = selectSecretWord(room.config.wordLength);

            if (!secretWord) {
                io.to(roomCode).emit('error', 'Impossibile trovare una parola');
                return;
            }

            // Clean up existing timer
            if (room.gameState.timer) {
                clearInterval(room.gameState.timer);
                room.gameState.timer = null;
            }

            room.gameState.status = 'playing';
            room.gameState.secretWord = secretWord;
            room.gameState.revealedLetters = {};
            room.gameState.guessedLetters = [];
            room.gameState.turnIndex = 0;
            room.gameState.currentPlayerId = room.players[0].id;
            room.gameState.timeLeft = 30;

            io.to(roomCode).emit('gameStarted', {
                wordLength: room.config.wordLength,
                players: room.players.map(p => ({ id: p.id, nickname: p.nickname }))
            });

            console.log(`[IMPICCATO] Game started in ${roomCode}. Word: ${secretWord}`);

            notifyTurn(room);
        }

        function notifyTurn(room) {
            if (!room || !room.players || room.players.length === 0) {
                console.log(`[IMPICCATO] Cannot notify turn - invalid room state`);
                return;
            }

            const currentPlayerId = room.gameState.currentPlayerId;
            if (!currentPlayerId) {
                console.log(`[IMPICCATO] Cannot notify turn - no current player ID`);
                return;
            }

            io.to(room.code).emit('turnUpdate', {
                playerId: currentPlayerId,
                timeLeft: 30
            });

            // Clean up existing timer
            if (room.gameState.timer) {
                clearInterval(room.gameState.timer);
                room.gameState.timer = null;
            }

            // Start timer
            let seconds = 30;
            const roomCode = room.code;
            room.gameState.timer = setInterval(() => {
                if (!rooms[roomCode]) {
                    clearInterval(room.gameState.timer);
                    console.log(`[IMPICCATO] Timer stopped - room ${roomCode} no longer exists`);
                    return;
                }

                seconds--;
                room.gameState.timeLeft = seconds;

                // Send timer update every second
                io.to(roomCode).emit('timerTick', { timeLeft: seconds });

                if (seconds <= 0) {
                    clearInterval(room.gameState.timer);
                    room.gameState.timer = null;
                    console.log(`[IMPICCATO] Timer expired in ${roomCode}, passing turn`);
                    handlePassTurn(rooms[roomCode]);
                }
            }, 1000);
        }

        function handlePassTurn(room) {
            if (!room || !room.gameState) {
                console.log(`[IMPICCATO] Cannot pass turn - invalid room`);
                return;
            }

            // Clean up timer
            if (room.gameState.timer) {
                clearInterval(room.gameState.timer);
                room.gameState.timer = null;
            }

            if (room.gameState.status !== 'playing') {
                console.log(`[IMPICCATO] Cannot pass turn - game status is ${room.gameState.status}`);
                return;
            }

            if (!room.players || room.players.length === 0) {
                console.log(`[IMPICCATO] Cannot pass turn - no players in room`);
                return;
            }

            // Move to next player
            room.gameState.turnIndex = (room.gameState.turnIndex + 1) % room.players.length;
            room.gameState.currentPlayerId = room.players[room.gameState.turnIndex].id;

            console.log(`[IMPICCATO] Turn passed to player ${room.gameState.currentPlayerId}`);
            notifyTurn(room);
        }

        // Submit Letter
        socket.on('submitLetter', (letter) => {
            const roomCode = socket.roomId;
            const room = rooms[roomCode];

            if (!room || room.gameState.status !== 'playing') return;

            // Validate turn
            if (room.gameState.currentPlayerId !== socket.id) {
                return socket.emit('error', 'Non è il tuo turno!');
            }

            const upperLetter = letter.toUpperCase();

            // Check if letter already guessed
            if (room.gameState.guessedLetters.includes(upperLetter)) {
                return socket.emit('letterResult', {
                    success: false,
                    message: 'Lettera già tentata!',
                    private: true
                });
            }

            // Add to guessed letters
            room.gameState.guessedLetters.push(upperLetter);

            // Check if letter is in the word
            const secretWord = room.gameState.secretWord;
            const positions = [];

            for (let i = 0; i < secretWord.length; i++) {
                if (secretWord[i] === upperLetter) {
                    positions.push(i);
                    room.gameState.revealedLetters[i] = upperLetter;
                }
            }

            if (positions.length > 0) {
                // Letter is CORRECT
                console.log(`[IMPICCATO] Correct letter ${upperLetter} at positions ${positions}`);

                // Broadcast to all players
                io.to(roomCode).emit('letterResult', {
                    success: true,
                    letter: upperLetter,
                    positions: positions,
                    revealedLetters: room.gameState.revealedLetters
                });

                // Check win condition
                if (Object.keys(room.gameState.revealedLetters).length === secretWord.length) {
                    handleWin(room, socket.id);
                } else {
                    // Turn stays with current player - just restart timer
                    if (room.gameState.timer) {
                        clearInterval(room.gameState.timer);
                        room.gameState.timer = null;
                    }
                    notifyTurn(room);
                }
            } else {
                // Letter is INCORRECT
                console.log(`[IMPICCATO] Incorrect letter ${upperLetter}`);

                // Private message to player
                socket.emit('letterResult', {
                    success: false,
                    letter: upperLetter,
                    message: 'Lettera assente nella parola',
                    private: true
                });

                // Broadcast generic message to others (they don't see which letter)
                socket.to(roomCode).emit('opponentGuessed', {
                    playerId: socket.id,
                    wasCorrect: false
                });

                // Pass turn
                handlePassTurn(room);
            }
        });

        function handleWin(room, winnerId) {
            // Clean up timer
            if (room.gameState.timer) {
                clearInterval(room.gameState.timer);
                room.gameState.timer = null;
                console.log(`[IMPICCATO] Timer cleaned on win in room ${room.code}`);
            }

            room.gameState.status = 'ended';

            const winner = room.players.find(p => p.id === winnerId);
            if (winner) winner.score++;

            io.to(room.code).emit('roundEnded', {
                winnerId,
                winnerNickname: winner ? winner.nickname : 'Unknown',
                secretWord: room.gameState.secretWord,
                players: room.players.map(p => ({ id: p.id, nickname: p.nickname, score: p.score }))
            });

            console.log(`[IMPICCATO] Round ended in ${room.code}. Winner: ${winnerId}`);
        }

        // Next Round / Rematch
        socket.on('nextRound', (configUpdate) => {
            const roomCode = socket.roomId;
            const room = rooms[roomCode];

            if (!room || room.host !== socket.id) return;

            // Allow host to update word length
            if (configUpdate && configUpdate.wordLength) {
                room.config.wordLength = configUpdate.wordLength;
            }

            startRound(roomCode);
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`[IMPICCATO] Disconnect: ${socket.id}`);

            if (socket.roomId && rooms[socket.roomId]) {
                const room = rooms[socket.roomId];

                // Clean up timer if current player disconnected
                if (room.gameState && room.gameState.currentPlayerId === socket.id) {
                    if (room.gameState.timer) {
                        clearInterval(room.gameState.timer);
                        room.gameState.timer = null;
                    }
                }

                room.players = room.players.filter(p => p.id !== socket.id);
                io.to(room.code).emit('playerLeft', {
                    playerId: socket.id,
                    players: room.players.map(p => ({ id: p.id, nickname: p.nickname }))
                });

                if (room.players.length === 0) {
                    // Clean up timer before deleting room
                    if (room.gameState && room.gameState.timer) {
                        clearInterval(room.gameState.timer);
                        room.gameState.timer = null;
                    }
                    delete rooms[socket.roomId];
                    console.log(`[IMPICCATO] Room ${socket.roomId} deleted - no players left`);
                } else if (socket.id === room.host) {
                    // Assign new host
                    room.host = room.players[0].id;
                    io.to(room.code).emit('newHost', { hostId: room.host });

                    // If game is active and it was disconnected player's turn, pass turn
                    if (room.gameState && room.gameState.status === 'playing' && room.gameState.currentPlayerId === socket.id) {
                        console.log(`[IMPICCATO] Passing turn due to disconnect`);
                        handlePassTurn(room);
                    }
                }
            }
        });
    });
}

module.exports = initImpiccato;
