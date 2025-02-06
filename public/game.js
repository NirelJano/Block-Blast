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
    let draggedPiece = null; // לעקוב אחרי החתיכה שנגררת

    // הוספת צורות נוספות למגוון
    const shapes = [
        // צורה של T
        { color: "#FF5733", blocks: [[1, 0], [0, 1], [1, 1], [2, 1]] },
        // צורה של L
        { color: "#33FF57", blocks: [[0, 0], [0, 1], [0, 2], [1, 2]] },
        // צורה של ריבוע
        { color: "#FFC300", blocks: [[0, 0], [1, 0], [0, 1], [1, 1]] },
        // קו ארוך
        { color: "#DAF7A6", blocks: [[0, 0], [0, 1], [0, 2], [0, 3]] },
        // צורת Z
        { color: "#C70039", blocks: [[0, 0], [1, 0], [1, 1], [2, 1]] },
        // צורות קיימות
        { color: "orange", blocks: [[0, 0], [1, 0], [2, 0], [1, 1]] },
        { color: "purple", blocks: [[0, 0], [0, 1], [0, 2]] },
        { color: "green", blocks: [[0, 0], [1, 0], [1, 1]] },
    ];

    // ציור הרשת
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

    // יצירת חתיכות חדשות
    function generateNewPieces() {
        currentPieces = [];
        piecesContainer.innerHTML = "";

        const selectedShapes = [];
        while (selectedShapes.length < 3) {
            const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
            // בדיקה אם הצורה כבר נבחרה על פי התוכן שלה
            if (!selectedShapes.some(shape => JSON.stringify(shape) === JSON.stringify(randomShape))) {
                selectedShapes.push(randomShape);
            }
        }

        selectedShapes.forEach((shape, index) => {
            const pieceDiv = document.createElement("div");
            pieceDiv.classList.add("gamePiece");
            pieceDiv.style.position = "relative";
            pieceDiv.style.display = "inline-block";
            pieceDiv.style.margin = "10px";
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
                // הסרת גבול כדי למנוע חישובי גודל נוספים
                // blockDiv.style.border = "2px solid black";
                pieceDiv.appendChild(blockDiv);
            });

            // שמירה של המידע על הצורה
            pieceDiv.setAttribute("data-shape", JSON.stringify(shape));
            pieceDiv.setAttribute("draggable", true);

            pieceDiv.addEventListener("dragstart", (event) => {
                draggedPiece = pieceDiv;
                event.dataTransfer.setData("shape", JSON.stringify(shape));
                // חישוב ההיסט בין העכבר לחתיכה
                const rect = pieceDiv.getBoundingClientRect();
                const offsetX = event.clientX - rect.left;
                const offsetY = event.clientY - rect.top;
                event.dataTransfer.setData("offsetX", offsetX);
                event.dataTransfer.setData("offsetY", offsetY);
                // מאפשרת שקיפות בעת גרירה
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

    // בדיקה האם ניתן למקם צורה במיקום נתון
    function canPlaceShape(shape, x, y) {
        for (let [dx, dy] of shape.blocks) {
            const newX = x + dx;
            const newY = y + dy;
            // בדיקה אם התא יוצא מגבולות הלוח
            if (newX < 0 || newX >= gridCount || newY < 0 || newY >= gridCount) {
                // console.warn(`❌ התא מחוץ ללוח: [${newX}, ${newY}]`);
                return false;
            }
            // בדיקה אם התא כבר תפוס
            if (gameBoard[newY][newX] !== null) {
                // console.warn(`❌ התא [${newX}, ${newY}] כבר תפוס`);
                return false;
            }
        }
        return true;
    }

    // הנחת צורה – הפונקציה מחזירה true אם הצליחה
    function placeShape(shape, x, y) {
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
            scoreElement.textContent = `Score: ${score}`;
            checkForFullLines();
            return true;
        } else {
            return false;
        }
    }

    // בדיקה וניקוי שורות ועמודות מלאות
    function checkForFullLines() {
        let linesCleared = 0;

        // בדיקת שורות מלאות
        for (let y = 0; y < gridCount; y++) {
            if (gameBoard[y].every(cell => cell !== null)) {
                // ניקוי השורה
                for (let x = 0; x < gridCount; x++) {
                    gameBoard[y][x] = null;
                }
                linesCleared++;
            }
        }

        // בדיקת עמודות מלאות
        for (let x = 0; x < gridCount; x++) {
            if (gameBoard.every(row => row[x] !== null)) {
                // ניקוי העמודה
                for (let y = 0; y < gridCount; y++) {
                    gameBoard[y][x] = null;
                }
                linesCleared++;
            }
        }

        if (linesCleared > 0) {
            score += linesCleared * 10;
            scoreElement.textContent = `Score: ${score}`;
            // הוספת אנימציה בעת ניקוי שורות/עמודות
            animateLineClear();
            setTimeout(() => {
                redrawBoard();
            }, 300);
        }
    }

    // אנימציה לניקוי שורות/עמודות
    function animateLineClear() {
        // ניתן להוסיף אפקט הבהוב או דהייה
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
        // אם אין חתיכות נוכחיות, ניצור חדשות
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

    // אתחול מחדש של המשחק
    function restartGame() {
        gameBoard = Array.from({ length: gridCount }, () => Array(gridCount).fill(null));
        score = 0;
        scoreElement.textContent = `Score: ${score}`;
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
                setTimeout(() => {
                    alert(`🛑 המשחק נגמר! ניקוד סופי: ${score}`);
                    restartGame();
                }, 100);
            }
        } else {
            // משוב חזותי במקרה שלא ניתן למקם את הצורה
            alert("❌ לא ניתן למקם את הצורה כאן!");
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
