class GameMap {
    constructor() {
        this.gridSize = 32;
        this.width = 0;
        this.height = 0;
        this.grid = [];
        this.path = [];
        this.placedTowers = [];
    }

    initialize(width, height) {
        this.width = Math.floor(width / this.gridSize);
        this.height = Math.floor(height / this.gridSize);
        
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(0));
        this.definePath();
        
        for (const point of this.path) {
            const { x, y } = point;
            if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
                this.grid[y][x] = 1;
            }
        }
    }

    definePath() {
        let pathPoints = [];
        
        const startX = 0;
        const startY = Math.floor(this.height / 2);
        
        pathPoints.push({ x: startX, y: startY });
        
        for (let x = 1; x < Math.floor(this.width * 0.3); x++) {
            pathPoints.push({ x, y: startY });
        }
        
        const curveX1 = Math.floor(this.width * 0.3);
        for (let y = startY; y < Math.floor(this.height * 0.7); y++) {
            pathPoints.push({ x: curveX1, y });
        }
        
        const curveY1 = Math.floor(this.height * 0.7);
        for (let x = curveX1; x < Math.floor(this.width * 0.7); x++) {
            pathPoints.push({ x, y: curveY1 });
        }
        
        const curveX2 = Math.floor(this.width * 0.7);
        for (let y = curveY1; y > Math.floor(this.height * 0.3); y--) {
            pathPoints.push({ x: curveX2, y });
        }
        
        const curveY2 = Math.floor(this.height * 0.3);
        for (let x = curveX2; x < this.width; x++) {
            pathPoints.push({ x, y: curveY2 });
        }
        
        this.path = pathPoints;
        
        this.pathPixels = pathPoints.map(point => ({
            x: point.x * this.gridSize + this.gridSize / 2,
            y: point.y * this.gridSize + this.gridSize / 2
        }));
        
        return pathPoints;
    }

    canPlaceTower(gridX, gridY) {
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            return false;
        }
        
        if (this.grid[gridY][gridX] === 1) {
            return false;
        }
        
        for (const tower of this.placedTowers) {
            if (tower.gridX === gridX && tower.gridY === gridY) {
                return false;
            }
        }
        
        return true;
    }

    addTower(tower) {
        if (this.canPlaceTower(tower.gridX, tower.gridY)) {
            this.placedTowers.push(tower);
            return true;
        }
        return false;
    }

    removeTower(gridX, gridY) {
        const index = this.placedTowers.findIndex(
            tower => tower.gridX === gridX && tower.gridY === gridY
        );
        
        if (index !== -1) {
            const removedTower = this.placedTowers[index];
            this.placedTowers.splice(index, 1);
            return removedTower;
        }
        
        return null;
    }

    draw(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const gridValue = this.grid[y][x];
                
                if (gridValue === 1) {
                    ctx.fillStyle = '#555';
                } else {
                    ctx.fillStyle = '#222';
                }
                
                ctx.fillRect(
                    x * this.gridSize,
                    y * this.gridSize,
                    this.gridSize,
                    this.gridSize
                );
                
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.strokeRect(
                    x * this.gridSize,
                    y * this.gridSize,
                    this.gridSize,
                    this.gridSize
                );
            }
        }
        
        const entry = this.path[0];
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(
            entry.x * this.gridSize + this.gridSize / 2,
            entry.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 3,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        const exit = this.path[this.path.length - 1];
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.arc(
            exit.x * this.gridSize + this.gridSize / 2,
            exit.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    mouseToGrid(mouseX, mouseY) {
        return {
            x: Math.floor(mouseX / this.gridSize),
            y: Math.floor(mouseY / this.gridSize)
        };
    }

    gridToPixels(gridX, gridY) {
        return {
            x: gridX * this.gridSize + this.gridSize / 2,
            y: gridY * this.gridSize + this.gridSize / 2
        };
    }

    getNextPathPoint(x, y, currentIndex = 0) {
        if (currentIndex >= this.pathPixels.length - 1) {
            return this.pathPixels[this.pathPixels.length - 1];
        }
        
        return this.pathPixels[currentIndex + 1];
    }

    getClosestPathPointIndex(x, y) {
        let minDist = Infinity;
        let closestIndex = 0;
        
        for (let i = 0; i < this.pathPixels.length; i++) {
            const point = this.pathPixels[i];
            const dist = Math.hypot(point.x - x, point.y - y);
            
            if (dist < minDist) {
                minDist = dist;
                closestIndex = i;
            }
        }
        
        return closestIndex;
    }
}

window.GameMap = GameMap;
