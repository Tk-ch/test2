// Main game class
class ShapeMatcherGame {
    constructor() {
        // Initialize canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game state
        this.grid = [];
        this.score = 0;
        this.selectedCell = null;
        this.animating = false;
        this.gameWon = false;

        // Animation properties
        this.animations = [];

        // Initialize the game
        this.initGrid();
        this.setupEventListeners();

        // Start game loop
        this.gameLoop();
    }

    // Initialize the grid with random shapes
    initGrid() {
        for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
            this.grid[y] = [];
            for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
                this.grid[y][x] = this.getRandomShape();
            }
        }

        // Check for initial matches and resolve them
        this.resolveInitialMatches();
    }

    // Resolve any matches that might exist when the grid is first created
    resolveInitialMatches() {
        let hasMatches = true;

        while (hasMatches) {
            hasMatches = false;
            for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
                for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
                    if (this.checkMatch(x, y)) {
                        this.grid[y][x] = this.getRandomShape();
                        hasMatches = true;
                    }
                }
            }
        }
    }

    // Get a random shape type
    getRandomShape() {
        return Math.floor(Math.random() * 4);
    }

    // Setup mouse event listeners
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            if (this.animating || this.gameWon) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / CONFIG.CELL_SIZE);
            const y = Math.floor((e.clientY - rect.top) / CONFIG.CELL_SIZE);

            if (x >= 0 && x < CONFIG.GRID_SIZE && y >= 0 && y < CONFIG.GRID_SIZE) {
                this.handleCellClick(x, y);
            }
        });
    }

    // Handle cell click
    handleCellClick(x, y) {
        if (!this.selectedCell) {
            this.selectedCell = { x, y };
        } else {
            // Check if adjacent
            const dx = Math.abs(this.selectedCell.x - x);
            const dy = Math.abs(this.selectedCell.y - y);

            if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                this.swapShapes(this.selectedCell.x, this.selectedCell.y, x, y);
            }

            this.selectedCell = null;
        }
    }

    // Swap two shapes
    swapShapes(x1, y1, x2, y2) {
        // Store original shapes
        const shape1 = this.grid[y1][x1];
        const shape2 = this.grid[y2][x2];

        // Swap
        this.grid[y1][x1] = shape2;
        this.grid[y2][x2] = shape1;

        // Check if the swap created a match
        const matches = this.findMatches();

        if (matches.length > 0) {
            // Valid move, process matches
            this.animating = true;
            this.animateSwap(x1, y1, x2, y2, () => {
                this.processMatches(matches);
            });
        } else {
            // Invalid move, swap back
            this.grid[y1][x1] = shape1;
            this.grid[y2][x2] = shape2;
        }
    }

    // Find all matches in the grid
    findMatches() {
        const matches = [];

        // Check horizontal matches
        for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
            for (let x = 0; x < CONFIG.GRID_SIZE - 2; x++) {
                const shape = this.grid[y][x];
                if (shape === this.grid[y][x+1] && shape === this.grid[y][x+2]) {
                    // Found a horizontal match of at least 3
                    const match = { cells: [] };
                    let matchLength = 3;

                    // Add the initial 3 cells
                    for (let i = 0; i < 3; i++) {
                        match.cells.push({ x: x + i, y });
                    }

                    // Check for additional matching cells
                    for (let i = 3; x + i < CONFIG.GRID_SIZE && this.grid[y][x+i] === shape; i++) {
                        match.cells.push({ x: x + i, y });
                        matchLength++;
                    }

                    matches.push(match);
                    x += matchLength - 1; // Skip the matched cells
                }
            }
        }

        // Check vertical matches
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
            for (let y = 0; y < CONFIG.GRID_SIZE - 2; y++) {
                const shape = this.grid[y][x];
                if (shape === this.grid[y+1][x] && shape === this.grid[y+2][x]) {
                    // Found a vertical match of at least 3
                    const match = { cells: [] };
                    let matchLength = 3;

                    // Add the initial 3 cells
                    for (let i = 0; i < 3; i++) {
                        match.cells.push({ x, y: y + i });
                    }

                    // Check for additional matching cells
                    for (let i = 3; y + i < CONFIG.GRID_SIZE && this.grid[y+i][x] === shape; i++) {
                        match.cells.push({ x, y: y + i });
                        matchLength++;
                    }

                    matches.push(match);
                    y += matchLength - 1; // Skip the matched cells
                }
            }
        }

        return matches;
    }

    // Process matches and update score
    processMatches(matches) {
        // Mark matched cells
        const matchedCells = new Set();

        for (const match of matches) {
            for (const cell of match.cells) {
                matchedCells.add(`${cell.x},${cell.y}`);
            }
        }

        // Calculate score
        const totalMatched = matchedCells.size;
        const pointsEarned = totalMatched * CONFIG.POINTS_MULTIPLIER;
        this.score += pointsEarned;

        // Update score display
        document.getElementById('score').textContent = this.score;

        // Check for win condition
        if (this.score >= CONFIG.WIN_SCORE && !this.gameWon) {
            this.gameWon = true;
            document.getElementById('winMessage').style.display = 'block';
        }

        // Remove matched shapes and drop new ones
        setTimeout(() => {
            this.removeMatches(matchedCells);
        }, CONFIG.ANIMATION_DELAY);
    }

    // Remove matched shapes and fill with new ones
    removeMatches(matchedCells) {
        // Remove matched shapes
        for (const cellStr of matchedCells) {
            const [x, y] = cellStr.split(',').map(Number);
            this.grid[y][x] = -1; // Mark as empty
        }

        // Drop shapes and fill with new ones
        this.dropShapes();
    }

    // Drop shapes to fill empty spaces
    dropShapes() {
        const dropAnimations = [];

        // For each column
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
            // Count empty spaces and shift shapes down
            let emptyCount = 0;

            for (let y = CONFIG.GRID_SIZE - 1; y >= 0; y--) {
                if (this.grid[y][x] === -1) {
                    emptyCount++;
                } else if (emptyCount > 0) {
                    // Move shape down by emptyCount
                    this.grid[y + emptyCount][x] = this.grid[y][x];
                    this.grid[y][x] = -1;

                    // Add drop animation
                    dropAnimations.push({
                        fromX: x,
                        fromY: y,
                        toX: x,
                        toY: y + emptyCount,
                        shape: this.grid[y + emptyCount][x]
                    });
                }
            }

            // Fill the top with new shapes
            for (let y = 0; y < emptyCount; y++) {
                const newShape = this.getRandomShape();
                this.grid[y][x] = newShape;

                // Add drop animation from above the grid
                dropAnimations.push({
                    fromX: x,
                    fromY: -1 - (emptyCount - y - 1),
                    toX: x,
                    toY: y,
                    shape: newShape
                });
            }
        }

        // Animate the drops
        this.animateDrops(dropAnimations, () => {
            // Check for new matches after dropping
            const newMatches = this.findMatches();
            if (newMatches.length > 0) {
                this.processMatches(newMatches);
            } else {
                this.animating = false;
            }
        });
    }

    // Check if a specific cell is part of a match
    checkMatch(x, y) {
        const shape = this.grid[y][x];

        // Check horizontal match
        if (x < CONFIG.GRID_SIZE - 2 &&
            this.grid[y][x+1] === shape &&
            this.grid[y][x+2] === shape) {
            return true;
        }

        // Check vertical match
        if (y < CONFIG.GRID_SIZE - 2 &&
            this.grid[y+1][x] === shape &&
            this.grid[y+2][x] === shape) {
            return true;
        }

        // Check if part of a horizontal match (middle or end)
        if (x > 0 && x < CONFIG.GRID_SIZE - 1 &&
            this.grid[y][x-1] === shape &&
            this.grid[y][x+1] === shape) {
            return true;
        }

        // Check if part of a horizontal match (end)
        if (x > 1 &&
            this.grid[y][x-2] === shape &&
            this.grid[y][x-1] === shape) {
            return true;
        }

        // Check if part of a vertical match (middle or end)
        if (y > 0 && y < CONFIG.GRID_SIZE - 1 &&
            this.grid[y-1][x] === shape &&
            this.grid[y+1][x] === shape) {
            return true;
        }

        // Check if part of a vertical match (end)
        if (y > 1 &&
            this.grid[y-2][x] === shape &&
            this.grid[y-1][x] === shape) {
            return true;
        }

        return false;
    }

    // Animate swapping of shapes
    animateSwap(x1, y1, x2, y2, callback) {
        const startTime = Date.now();
        const duration = 300; // ms

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            this.render(x1, y1, x2, y2, progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                callback();
            }
        };

        animate();
    }

    // Animate dropping shapes
    animateDrops(animations, callback) {
        const startTime = Date.now();
        const duration = 500; // ms

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            this.renderDrops(animations, progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                callback();
            }
        };

        animate();
    }

    // Render dropping animations
    renderDrops(animations, progress) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw static shapes (not being animated)
        for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
            for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
                // Skip cells that are part of animations
                const isAnimated = animations.some(anim =>
                    (anim.toX === x && anim.toY === y) ||
                    (anim.fromX === x && anim.fromY === y && anim.fromY >= 0)
                );

                if (!isAnimated && this.grid[y][x] !== -1) {
                    this.drawShape(
                        x * CONFIG.CELL_SIZE,
                        y * CONFIG.CELL_SIZE,
                        this.grid[y][x]
                    );
                }
            }
        }

        // Draw animated shapes
        for (const anim of animations) {
            const startX = anim.fromX * CONFIG.CELL_SIZE;
            const startY = anim.fromY * CONFIG.CELL_SIZE;
            const endX = anim.toX * CONFIG.CELL_SIZE;
            const endY = anim.toY * CONFIG.CELL_SIZE;

            // Use easing function for smoother animation
            const easeProgress = this.easeOutBounce(progress);

            const currentX = startX;
            const currentY = startY + (endY - startY) * easeProgress;

            this.drawShape(currentX, currentY, anim.shape);
        }

        // Draw grid lines
        this.drawGrid();

        // Draw selection
        if (this.selectedCell) {
            this.drawSelection(this.selectedCell.x, this.selectedCell.y);
        }
    }

    // Easing function for smoother animations
    easeOutBounce(x) {
        const n1 = 7.5625;
        const d1 = 2.75;

        if (x < 1 / d1) {
            return n1 * x * x;
        } else if (x < 2 / d1) {
            return n1 * (x -= 1.5 / d1) * x + 0.75;
        } else if (x < 2.5 / d1) {
            return n1 * (x -= 2.25 / d1) * x + 0.9375;
        } else {
            return n1 * (x -= 2.625 / d1) * x + 0.984375;
        }
    }

    // Main game loop
    gameLoop() {
        if (!this.animating) {
            this.render();
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    // Render the game
    render(swapX1, swapY1, swapX2, swapY2, swapProgress) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw shapes
        for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
            for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
                if (this.grid[y][x] === -1) continue; // Skip empty cells

                let drawX = x * CONFIG.CELL_SIZE;
                let drawY = y * CONFIG.CELL_SIZE;

                // Animate swapping if applicable
                if (swapProgress !== undefined) {
                    if (x === swapX1 && y === swapY1) {
                        drawX += (swapX2 - swapX1) * CONFIG.CELL_SIZE * swapProgress;
                        drawY += (swapY2 - swapY1) * CONFIG.CELL_SIZE * swapProgress;
                    } else if (x === swapX2 && y === swapY2) {
                        drawX += (swapX1 - swapX2) * CONFIG.CELL_SIZE * swapProgress;
                        drawY += (swapY1 - swapY2) * CONFIG.CELL_SIZE * swapProgress;
                    }
                }

                this.drawShape(drawX, drawY, this.grid[y][x]);
            }
        }

        // Draw grid lines
        this.drawGrid();

        // Draw selection
        if (this.selectedCell && !this.animating) {
            this.drawSelection(this.selectedCell.x, this.selectedCell.y);
        }
    }

    // Draw grid lines
    drawGrid() {
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= CONFIG.GRID_SIZE; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * CONFIG.CELL_SIZE, 0);
            this.ctx.lineTo(x * CONFIG.CELL_SIZE, CONFIG.GRID_SIZE * CONFIG.CELL_SIZE);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= CONFIG.GRID_SIZE; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * CONFIG.CELL_SIZE);
            this.ctx.lineTo(CONFIG.GRID_SIZE * CONFIG.CELL_SIZE, y * CONFIG.CELL_SIZE);
            this.ctx.stroke();
        }
    }

    // Draw selection indicator
    drawSelection(x, y) {
        this.ctx.strokeStyle = '#ffcc00';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(
            x * CONFIG.CELL_SIZE + 2,
            y * CONFIG.CELL_SIZE + 2,
            CONFIG.CELL_SIZE - 4,
            CONFIG.CELL_SIZE - 4
        );
    }

    // Draw a shape at the specified position
    drawShape(x, y, shapeType) {
        const centerX = x + CONFIG.CELL_SIZE / 2;
        const centerY = y + CONFIG.CELL_SIZE / 2;
        const radius = CONFIG.CELL_SIZE * 0.4;

        this.ctx.fillStyle = CONFIG.COLORS[shapeType];

        switch (shapeType) {
            case CONFIG.SHAPES.CIRCLE:
                // Draw circle
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.fill();
                break;

            case CONFIG.SHAPES.HEXAGON:
                // Draw hexagon
                this.ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const px = centerX + radius * Math.cos(angle);
                    const py = centerY + radius * Math.sin(angle);

                    if (i === 0) {
                        this.ctx.moveTo(px, py);
                    } else {
                        this.ctx.lineTo(px, py);
                    }
                }
                this.ctx.closePath();
                this.ctx.fill();
                break;

            case CONFIG.SHAPES.TRIANGLE:
                // Draw triangle
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY - radius);
                this.ctx.lineTo(centerX - radius, centerY + radius * 0.7);
                this.ctx.lineTo(centerX + radius, centerY + radius * 0.7);
                this.ctx.closePath();
                this.ctx.fill();
                break;

            case CONFIG.SHAPES.TRAPEZIUM:
                // Draw trapezium
                this.ctx.beginPath();
                this.ctx.moveTo(centerX - radius * 0.7, centerY - radius * 0.6);
                this.ctx.lineTo(centerX + radius * 0.7, centerY - radius * 0.6);
                this.ctx.lineTo(centerX + radius, centerY + radius * 0.6);
                this.ctx.lineTo(centerX - radius, centerY + radius * 0.6);
                this.ctx.closePath();
                this.ctx.fill();
                break;
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new ShapeMatcherGame();
});
