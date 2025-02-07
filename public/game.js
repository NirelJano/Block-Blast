document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const scoreElement = document.getElementById("score");
    const bestScoreElement = document.getElementById("bestScore");
    const piecesContainer = document.getElementById("piecesContainer");
    const exitGameBtn = document.getElementById("exitGameBtn");
    const startGameBtn = document.getElementById("startGameBtn"); // Restart/Start Game button

    const gridSize = 50;
    const gridCount = 10;
    canvas.width = gridSize * gridCount;
    canvas.height = gridSize * gridCount;


    let score = 0;
    let bestScore = 0;
    let gameBoard = Array.from({ length: gridCount }, () => Array(gridCount).fill(null));
    let currentPieces = [];
    let draggedPiece = null; // Track the piece being dragged

    const colorMap = {
        red: "#ff4d4d",
        green: "#4dff88",
        blue: "#4d88ff",
        orange: "#ff9933",
        purple: "#b84dff",
        yellow: "#ffff66",
        cyan: "#4dffff",
    };

    const shapes = [
        // Shapes with color classes
        { colorClass: "red", blocks: [[0, 0], [1, 0], [0, 1], [1, 1]] }, // Square
        { colorClass: "green", blocks: [[0, 0], [1, 0], [2, 0], [3, 0]] }, // Line
        { colorClass: "blue", blocks: [[0, 0], [0, 1], [1, 1], [1, 2]] }, // Z
        { colorClass: "orange", blocks: [[1, 0], [0, 1], [1, 1], [2, 1]] }, // T
        { colorClass: "purple", blocks: [[0, 0], [0, 1], [0, 2]] }, // Short line
        { colorClass: "yellow", blocks: [[0, 0], [1, 0], [0, 1]] }, // Small L
        { colorClass: "cyan", blocks: [[0, 1], [1, 0], [1, 1], [2, 0]] }, // S reversed
        // Add more shapes if desired
    ];

    // Drawing the grid
    function drawGrid() {
        ctx.strokeStyle = "#ccc";
        for (let x = 0; x <= canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    // Generate new pieces
    function generateNewPieces() {
        currentPieces = [];
        piecesContainer.innerHTML = "";

        const selectedShapes = [];
        while (selectedShapes.length < 3) {
            const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
            if (!selectedShapes.some(shape => JSON.stringify(shape) === JSON.stringify(randomShape))) {
                selectedShapes.push(randomShape);
            }
        }

        selectedShapes.forEach((shape) => {
            const pieceDiv = document.createElement("div");
            pieceDiv.classList.add("gamePiece");
            pieceDiv.style.position = "relative";
            pieceDiv.style.display = "inline-block";
            pieceDiv.style.margin = "10px";
            pieceDiv.style.width = `${(Math.max(...shape.blocks.map(b => b[0])) + 1) * gridSize}px`;
            pieceDiv.style.height = `${(Math.max(...shape.blocks.map(b => b[1])) + 1) * gridSize}px`;

            // Creating blocks for each shape
            shape.blocks.forEach(([dx, dy]) => {
                const blockDiv = document.createElement("div");
                blockDiv.classList.add("gameBlock");
                blockDiv.classList.add(shape.colorClass); // Adding color class
                blockDiv.style.left = `${dx * gridSize}px`;
                blockDiv.style.top = `${dy * gridSize}px`;
                pieceDiv.appendChild(blockDiv);
            });

            // Save shape information
            pieceDiv.setAttribute("data-shape", JSON.stringify(shape));
            pieceDiv.setAttribute("draggable", true);

            pieceDiv.addEventListener("dragstart", (event) => {
                draggedPiece = pieceDiv;
                event.dataTransfer.setData("shape", JSON.stringify(shape));
                // Calculate offset between mouse and piece
                const rect = pieceDiv.getBoundingClientRect();
                const offsetX = event.clientX - rect.left;
                const offsetY = event.clientY - rect.top;
                event.dataTransfer.setData("offsetX", offsetX);
                event.dataTransfer.setData("offsetY", offsetY);
                // Make piece transparent while dragging
                setTimeout(() => {
                    pieceDiv.style.opacity = "0.5";
                }, 0);
            });

            pieceDiv.addEventListener("dragend", () => {
                pieceDiv.style.opacity = "1";
            });

            piecesContainer.appendChild(pieceDiv);
            currentPieces.push(pieceDiv);
        });
    }

    // Check if shape can be placed at given position
    function canPlaceShape(shape, x, y) {
        for (let [dx, dy] of shape.blocks) {
            const newX = x + dx;
            const newY = y + dy;
            // Check if cell is out of bounds
            if (newX < 0 || newX >= gridCount || newY < 0 || newY >= gridCount) {
                return false;
            }
            // Check if cell is already occupied
            if (gameBoard[newY][newX] !== null) {
                return false;
            }
        }
        return true;
    }

    // Place shape – returns true if successful
    function placeShape(shape, x, y) {
        if (canPlaceShape(shape, x, y)) {
            shape.blocks.forEach(([dx, dy]) => {
                const newX = x + dx;
                const newY = y + dy;
                gameBoard[newY][newX] = shape.colorClass; // Use colorClass for the cell
                // Draw the block on the canvas with styling
                drawBlock(newX * gridSize, newY * gridSize, shape.colorClass);
            });
            updateScore(score += shape.blocks.length);
            activateCanvasEffect();
            checkForFullLines();
            return true;
        } else {
            return false;
        }
    }

    function updateScore(newScore) {
        score = newScore;
        scoreElement.textContent = ` ${score}`;
        
        // הוספת מחלקה לעיצוב אנימציה
        scoreElement.classList.add("updated");
    
        // הסרת האנימציה אחרי 200ms
        setTimeout(() => {
            scoreElement.classList.remove("updated");
        }, 200);

        if (score > bestScore) {
            bestScore = score;
            bestScoreElement.textContent = `🏆 ${bestScore}`;
        }
    }
    
    
    function activateCanvasEffect() {
        const canvas = document.getElementById("gameCanvas");
        canvas.classList.add("active");
        setTimeout(() => {
            canvas.classList.remove("active");
        }, 200);
    }
    
    
    // Draw block with styles
    function drawBlock(x, y, colorClass) {
        const color = colorMap[colorClass] || "#ccc";

        // Save current context state
        ctx.save();

        // Draw rounded rectangle
        ctx.beginPath();
        roundedRect(ctx, x + 2, y + 2, gridSize - 4, gridSize - 4, 8);

        // Create gradient to simulate 3D effect
        const gradient = ctx.createLinearGradient(x, y, x + gridSize, y + gridSize);
        gradient.addColorStop(0, lightenColor(color, 0.2));
        gradient.addColorStop(1, color);

        ctx.fillStyle = gradient;

        // Apply shadow to simulate 3D effect
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fill();
        ctx.strokeStyle = "#999";
        ctx.stroke();

        // Restore context state
        ctx.restore();
    }

    // Utility function to draw rounded rectangle
    function roundedRect(ctx, x, y, width, height, radius) {
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    // Function to lighten color
    function lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16),
            amt = Math.round(2.55 * percent * 100),
            R = (num >> 16) + amt,
            G = ((num >> 8) & 0x00ff) + amt,
            B = (num & 0x0000ff) + amt;
        return (
            "#" +
            (
                0x1000000 +
                (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
                (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
                (B < 255 ? (B < 1 ? 0 : B) : 255)
            )
                .toString(16)
                .slice(1)
        );
    }

    // Check and clear full rows and columns
    function checkForFullLines() {
        let linesCleared = 0;
        let rowsToClear = [];
        
        // זיהוי שורות מלאות
        for (let y = 0; y < gridCount; y++) {
            if (gameBoard[y].every(cell => cell !== null)) {
                rowsToClear.push(y);
                linesCleared++;
            }
        }
    
        // זיהוי עמודות מלאות
        let colsToClear = [];
        for (let x = 0; x < gridCount; x++) {
            if (gameBoard.every(row => row[x] !== null)) {
                colsToClear.push(x);
                linesCleared++;
            }
        }
    
        if (linesCleared > 0) {
            // הפעלת אפקט זוהר רגע לפני המחיקה
            animateLineClear(rowsToClear, colsToClear);
            
            setTimeout(() => {
                // מחיקת השורות בפועל לאחר האנימציה
                rowsToClear.forEach(y => {
                    for (let x = 0; x < gridCount; x++) {
                        gameBoard[y][x] = null;
                    }
                });
    
                // מחיקת העמודות בפועל לאחר האנימציה
                colsToClear.forEach(x => {
                    for (let y = 0; y < gridCount; y++) {
                        gameBoard[y][x] = null;
                    }
                });
    
                updateScore(score += linesCleared * 10);
                redrawBoard();
            }, 300); // עיכוב מחיקה קצר לאנימציה
        }
    }
    
    function animateLineClear(rows, cols) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 255, 0, 0.5)"; // זוהר ירוק שקוף
    
        // אנימציית זוהר לשורות
        rows.forEach(y => {
            ctx.fillRect(0, y * gridSize, canvas.width, gridSize);
        });
    
        // אנימציית זוהר לעמודות
        cols.forEach(x => {
            ctx.fillRect(x * gridSize, 0, gridSize, canvas.height);
        });
    
        setTimeout(() => {
            ctx.restore();
            redrawBoard(); // ציור מחדש אחרי האפקט
        }, 250); // עיכוב קטן לזוהר לפני מחיקה בפועל
    }
    

    // Redraw the board
    function redrawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        gameBoard.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    drawBlock(x * gridSize, y * gridSize, cell);
                }
            });
        });
    }

    // Check if there is a valid move for any remaining pieces
    function checkGameOver() {
        if (currentPieces.length === 0) {
            generateNewPieces();
        }

        for (let pieceDiv of currentPieces) {
            const shape = JSON.parse(pieceDiv.getAttribute("data-shape") || "{}");
            for (let y = 0; y < gridCount; y++) {
                for (let x = 0; x < gridCount; x++) {
                    if (canPlaceShape(shape, x, y)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // Restart the game
    function restartGame() {
        gameBoard = Array.from({ length: gridCount }, () => Array(gridCount).fill(null));
        updateScore(0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        piecesContainer.innerHTML = "";
        currentPieces = [];
        generateNewPieces();
    }

    // Event listeners for dragging and dropping on the canvas
    canvas.addEventListener("dragover", (event) => {
        event.preventDefault();
    });

    canvas.addEventListener("drop", (event) => {
        event.preventDefault();
        const data = event.dataTransfer.getData("shape");
        if (!data) return;
        const shape = JSON.parse(data);

        const offsetX = parseFloat(event.dataTransfer.getData("offsetX")) || 0;
        const offsetY = parseFloat(event.dataTransfer.getData("offsetY")) || 0;

        const rect = canvas.getBoundingClientRect();
        const dropX = event.clientX - rect.left - offsetX + gridSize / 2;
        const dropY = event.clientY - rect.top - offsetY + gridSize / 2;

        const gridX = Math.floor(dropX / gridSize);
        const gridY = Math.floor(dropY / gridSize);

        console.log(`Drop coordinates: ${dropX.toFixed(2)}, ${dropY.toFixed(2)} => Grid: [${gridX}, ${gridY}]`);

        if (placeShape(shape, gridX, gridY)) {
            if (draggedPiece) {
                piecesContainer.removeChild(draggedPiece);
                currentPieces = currentPieces.filter(piece => piece !== draggedPiece);
                draggedPiece = null;
            }
            if (currentPieces.length === 0) {
                generateNewPieces();
            }

            if (checkGameOver()) {
                checkAndUpdateHighScore();
                setTimeout(() => {
                    alert(`🛑 Game Over! Final Score: ${score}`);
                    restartGame();
                }, 100);
            }
        }
    });

    drawGrid();
    generateNewPieces();

    exitGameBtn.addEventListener("click", () => {
        // Implement exit functionality if needed
        window.location.href = "index.html";
    });

    if (startGameBtn) {
        startGameBtn.addEventListener("click", restartGame);
    }

    function checkAndUpdateHighScore() {
        fetch('/update-high-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score })
        })
        .then(response => response.json())
        .then(data => console.log(data.message))
        .catch(error => console.error('Error:', error));
    }
    
    function getHighScore() {
        fetch('/api/best-score')
        .then(response => response.json())
        .then(data => {
            bestScore = data.highScore;
            bestScoreElement.textContent = `🏆 ${data.bestScore}`;
        })
        .catch(error => console.error('Error:', error));
    }
});

