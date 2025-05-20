/**
 * Map.js
 * Responsável pela criação e gerenciamento do mapa do jogo
 */

class GameMap {
    constructor() {
        this.gridSize = 32; // Tamanho de cada célula do grid
        this.width = 0;
        this.height = 0;
        this.grid = [];
        this.path = []; // Caminho que os inimigos seguirão
        this.placedTowers = [];
    }

    /**
     * Inicializa o mapa com base nas dimensões do canvas
     * @param {number} width - Largura do canvas em pixels
     * @param {number} height - Altura do canvas em pixels
     */
    initialize(width, height) {
        this.width = Math.floor(width / this.gridSize);
        this.height = Math.floor(height / this.gridSize);
        
        // Inicializa o grid
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(0));
        
        // Define o caminho (0 = caminho, 1 = área para colocar torres)
        this.definePath();
        
        // Marca as células do caminho no grid
        for (const point of this.path) {
            const { x, y } = point;
            if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
                this.grid[y][x] = 1; // 1 representa o caminho
            }
        }
    }

    /**
     * Define o caminho que os inimigos seguirão
     * Retorna um array de pontos {x, y} em coordenadas de grid
     */
    definePath() {
        // Definindo um caminho em forma de S para os inimigos seguirem
        let pathPoints = [];
        
        // Entrada no mapa (à esquerda)
        const startX = 0;
        const startY = Math.floor(this.height / 2);
        
        // Pontos do caminho
        pathPoints.push({ x: startX, y: startY }); // Ponto de entrada
        
        // Primeiro segmento - para a direita
        for (let x = 1; x < Math.floor(this.width * 0.3); x++) {
            pathPoints.push({ x, y: startY });
        }
        
        // Curva para baixo
        const curveX1 = Math.floor(this.width * 0.3);
        for (let y = startY; y < Math.floor(this.height * 0.7); y++) {
            pathPoints.push({ x: curveX1, y });
        }
        
        // Segundo segmento - para a direita
        const curveY1 = Math.floor(this.height * 0.7);
        for (let x = curveX1; x < Math.floor(this.width * 0.7); x++) {
            pathPoints.push({ x, y: curveY1 });
        }
        
        // Curva para cima
        const curveX2 = Math.floor(this.width * 0.7);
        for (let y = curveY1; y > Math.floor(this.height * 0.3); y--) {
            pathPoints.push({ x: curveX2, y });
        }
        
        // Terceiro segmento - para a direita (até a saída)
        const curveY2 = Math.floor(this.height * 0.3);
        for (let x = curveX2; x < this.width; x++) {
            pathPoints.push({ x, y: curveY2 });
        }
        
        this.path = pathPoints;
        
        // Calculando as coordenadas em pixels para o renderizador
        this.pathPixels = pathPoints.map(point => ({
            x: point.x * this.gridSize + this.gridSize / 2,
            y: point.y * this.gridSize + this.gridSize / 2
        }));
        
        return pathPoints;
    }

    /**
     * Verifica se é possível colocar uma torre em uma determinada posição
     * @param {number} gridX - Posição X no grid
     * @param {number} gridY - Posição Y no grid
     * @returns {boolean} - Verdadeiro se a posição estiver disponível
     */
    canPlaceTower(gridX, gridY) {
        // Verifica se está dentro dos limites do grid
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            return false;
        }
        
        // Verifica se não é um caminho (valor 1)
        if (this.grid[gridY][gridX] === 1) {
            return false;
        }
        
        // Verifica se já existe uma torre nessa posição
        for (const tower of this.placedTowers) {
            if (tower.gridX === gridX && tower.gridY === gridY) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Adiciona uma torre ao mapa
     * @param {Tower} tower - Objeto da torre a ser adicionada
     * @returns {boolean} - Verdadeiro se a torre foi adicionada com sucesso
     */
    addTower(tower) {
        if (this.canPlaceTower(tower.gridX, tower.gridY)) {
            this.placedTowers.push(tower);
            return true;
        }
        return false;
    }

    /**
     * Remove uma torre do mapa
     * @param {number} gridX - Posição X no grid
     * @param {number} gridY - Posição Y no grid
     * @returns {Tower|null} - A torre removida ou null se não houver torre
     */
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

    /**
     * Desenha o mapa no contexto do canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    draw(ctx) {
        // Limpa o canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Desenha o grid de fundo
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const gridValue = this.grid[y][x];
                
                // Define a cor com base no valor da célula
                if (gridValue === 1) {
                    // Célula do caminho
                    ctx.fillStyle = '#555';
                } else {
                    // Célula para colocar torre
                    ctx.fillStyle = '#222';
                }
                
                // Desenha a célula
                ctx.fillRect(
                    x * this.gridSize,
                    y * this.gridSize,
                    this.gridSize,
                    this.gridSize
                );
                
                // Desenha a borda da célula
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
        
        // Desenha os pontos de entrada e saída
        // Entrada (primeiro ponto do caminho)
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
        
        // Saída (último ponto do caminho)
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

    /**
     * Converte coordenadas do mouse para coordenadas de grid
     * @param {number} mouseX - Posição X do mouse
     * @param {number} mouseY - Posição Y do mouse
     * @returns {Object} - Coordenadas do grid {x, y}
     */
    mouseToGrid(mouseX, mouseY) {
        return {
            x: Math.floor(mouseX / this.gridSize),
            y: Math.floor(mouseY / this.gridSize)
        };
    }

    /**
     * Retorna as coordenadas em pixels a partir das coordenadas de grid
     * @param {number} gridX - Posição X no grid
     * @param {number} gridY - Posição Y no grid
     * @returns {Object} - Coordenadas em pixels {x, y}
     */
    gridToPixels(gridX, gridY) {
        return {
            x: gridX * this.gridSize + this.gridSize / 2,
            y: gridY * this.gridSize + this.gridSize / 2
        };
    }

    /**
     * Retorna o ponto no caminho mais próximo da posição atual
     * @param {number} x - Posição X atual em pixels
     * @param {number} y - Posição Y atual em pixels
     * @returns {Object} - Ponto do caminho {x, y} em pixels
     */
    getNextPathPoint(x, y, currentIndex = 0) {
        // Se já estiver no último ponto, retorna o último ponto
        if (currentIndex >= this.pathPixels.length - 1) {
            return this.pathPixels[this.pathPixels.length - 1];
        }
        
        return this.pathPixels[currentIndex + 1];
    }

    /**
     * Retorna o índice do ponto do caminho mais próximo
     * @param {number} x - Posição X em pixels
     * @param {number} y - Posição Y em pixels
     * @returns {number} - Índice do ponto no array pathPixels
     */
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

// Exporta a classe para uso global
window.GameMap = GameMap;
