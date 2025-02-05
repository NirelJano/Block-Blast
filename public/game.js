document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const scoreElement = document.getElementById("score");
    const piecesContainer = document.getElementById("piecesContainer");
    const exitGameBtn = document.getElementById("exitGameBtn");
    const startGameBtn = document.getElementById("startGameBtn"); // כפתור Restart/Start Game

    const gridSize = 50;
    const gridCount = 10;
    canvas.width = gridSize * gridCount;
    canvas.height = gridSize * gridCount;

    let score = 0;
    let gameBoard = Array.from({ length: gridCount }, () => Array(gridCount).fill(null));
    let currentPieces = [];
    let draggedPiece = null; // לעקוב אחרי החתיכה שמגררים

    const shapes = [
        { color: "orange", blocks: [[0, 0], [1, 0], [2, 0], [1, 1]] },
        { color: "purple", blocks: [[0, 0], [0, 1], [0, 2]] },
        { color: "green", blocks: [[0, 0], [1, 0], [1, 1]] },
    ];

    // ציור הרשת
    function drawGrid() {
        ctx.strokeStyle = "#ccc";
        for (let x = 0; x < canvas.width; x += gridSize) {
            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.strokeRect(x, y, gridSize, gridSize);
            }
        }
    }

    // יצירת חתיכות חדשות
    function generateNewPieces() {
        currentPieces = [];
        piecesContainer.innerHTML = "";

        const selectedShapes = [];
        while (selectedShapes.length < 3) {
            const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
            if (!selectedShapes.includes(randomShape)) {
                selectedShapes.push(randomShape);
            }
        }

        selectedShapes.forEach(shape => {
            const pieceDiv = document.createElement("div");
            pieceDiv.classList.add("gamePiece");
            pieceDiv.style.position = "relative";
            pieceDiv.style.width = `${(Math.max(...shape.blocks.map(b => b[0])) + 1) * gridSize}px`;
            pieceDiv.style.height = `${(Math.max(...shape.blocks.map(b => b[1])) + 1) * gridSize}px`;

            // יצירת בלוקים עבור כל צורה
            shape.blocks.forEach(([dx, dy]) => {
                const blockDiv = document.createElement("div");
                blockDiv.classList.add("gameBlock");
                blockDiv.style.width = `${gridSize}px`;
                blockDiv.style.height = `${gridSize}px`;
                blockDiv.style.backgroundColor = shape.color;
                blockDiv.style.position = "absolute";
                blockDiv.style.left = `${dx * gridSize}px`;
                blockDiv.style.top = `${dy * gridSize}px`;
                blockDiv.style.border = "2px solid black";
                pieceDiv.appendChild(blockDiv);
            });

            // שמירה של המידע על הצורה
            pieceDiv.setAttribute("data-shape", JSON.stringify(shape));
            pieceDiv.setAttribute("draggable", true);

            pieceDiv.addEventListener("dragstart", (event) => {
                draggedPiece = pieceDiv;
                event.dataTransfer.setData("shape", JSON.stringify(shape));
            });

            piecesContainer.appendChild(pieceDiv);
            currentPieces.push(pieceDiv);
        });
    }

    // בדיקה האם ניתן למקם צורה במיקום נתון
    function canPlaceShape(shape, x, y) {
        for (let [dx, dy] of shape.blocks) {
            const newX = x + dx;
            const newY = y + dy;
            // בדיקה אם התא יוצא מגבולות הלוח
            if (newX < 0 || newX >= gridCount || newY < 0 || newY >= gridCount) {
                console.warn(`❌ התא מחוץ ללוח: [${newX}, ${newY}]`);
                return false;
            }
            // בדיקה אם התא כבר תפוס
            if (gameBoard[newY][newX] !== null) {
                console.warn(`❌ התא [${newX}, ${newY}] כבר תפוס`);
                return false;
            }
        }
        return true;
    }

    // הנחת צורה – הפונקציה מחזירה true אם הצליחה
    function placeShape(shape, x, y) {
        console.log(`✅ ניסיון למקם צורה ב[${x},${y}]`);
        if (canPlaceShape(shape, x, y)) {
            shape.blocks.forEach(([dx, dy]) => {
                const newX = x + dx;
                const newY = y + dy;
                gameBoard[newY][newX] = shape.color;
                ctx.fillStyle = shape.color;
                ctx.fillRect(newX * gridSize, newY * gridSize, gridSize, gridSize);
                ctx.strokeRect(newX * gridSize, newY * gridSize, gridSize, gridSize);
            });
            score += shape.blocks.length;
            scoreElement.textContent = score;
            checkForFullLines();
            return true;
        } else {
            return false;
        }
    }

    // בדיקה וניקוי שורות ועמודות מלאות
    function checkForFullLines() {
        let linesCleared = 0;

        // בדיקת שורות מלאות – לולאה מהסוף להתחלה
        for (let y = gridCount - 1; y >= 0; y--) {
            if (gameBoard[y].every(cell => cell !== null)) {
                gameBoard.splice(y, 1);
                gameBoard.unshift(Array(gridCount).fill(null));
                linesCleared++;
            }
        }

        // בדיקת עמודות מלאות
        for (let x = 0; x < gridCount; x++) {
            if (gameBoard.every(row => row[x] !== null)) {
                gameBoard.forEach(row => row[x] = null);
                linesCleared++;
            }
        }

        if (linesCleared > 0) {
            score += linesCleared * 10;
            scoreElement.textContent = score;
            redrawBoard();
        }
    }

    // ציור מחדש של הלוח
    function redrawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        gameBoard.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    ctx.fillStyle = cell;
                    ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
                    ctx.strokeRect(x * gridSize, y * gridSize, gridSize, gridSize);
                }
            });
        });
    }

    // בדיקה האם יש מהלך חוקי עבור אחת מהחתיכות שנותרו
    function checkGameOver() {
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

    // אתחול מחדש של המשחק
    function restartGame() {
        gameBoard = Array.from({ length: gridCount }, () => Array(gridCount).fill(null));
        score = 0;
        scoreElement.textContent = score;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        piecesContainer.innerHTML = "";
        currentPieces = [];
        generateNewPieces();
    }

    // מאזינים לאירועי גרירה ושחרור על הקנבס
    canvas.addEventListener("dragover", (event) => {
        event.preventDefault();
    });

    canvas.addEventListener("drop", (event) => {
        event.preventDefault();
        const data = event.dataTransfer.getData("shape");
        if (!data) return;
        const shape = JSON.parse(data);

        const rect = canvas.getBoundingClientRect();
        const dropX = event.clientX - rect.left;
        const dropY = event.clientY - rect.top;
        // לכסות את המקרים בקצוות
        const gridX = Math.min(Math.floor(dropX / gridSize), gridCount - 1);
        const gridY = Math.min(Math.floor(dropY / gridSize), gridCount - 1);

        console.log(`Drop coordinates: ${dropX}, ${dropY} => Grid: [${gridX}, ${gridY}]`);

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
                alert("Game Over!");
                // ניתן להפעיל אתחול מחדש אוטומטי או להמתין ללחיצה
            }
        }
    });

    drawGrid();
    generateNewPieces();

    exitGameBtn.addEventListener("click", () => {
        window.location.href = "index.html";
    });

    if (startGameBtn) {
        startGameBtn.addEventListener("click", restartGame);
    }
});
