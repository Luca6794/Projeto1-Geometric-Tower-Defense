/**
 * Game.js
 * Controlador principal do jogo Geometric Tower Defense
 * Gerencia o loop do jogo, waves de inimigos e lógica de jogo
 */

class Game {
    constructor() {
        // Canvas e contexto
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Estado do jogo
        this.isRunning = false;
        this.gameOver = false;
        this.waveActive = false;
        this.currentWave = 0;
        this.totalWaves = 10;
        
        // Recursos do jogador
        this.lives = 20;
        this.money = 500;
        
        // Entidades do jogo
        this.map = new GameMap();
        this.towers = [];
        this.enemies = [];
        
        // Seleção de torres
        this.selectedTowerType = null;
        this.placingTower = false;
        this.selectedTower = null;
        
        // Cronometragem
        this.lastFrameTime = 0;
        this.lastEnemySpawnTime = 0;
        
        // Configurações de wave
        this.waveConfig = this.createWaveConfigurations();
        this.currentWaveEnemies = []; // Fila de inimigos a serem criados nesta wave
        this.enemySpawnInterval = 1000; // Intervalo de spawn em ms
        
        // Inicialização do jogo
        this.initialize();
    }

    /**
     * Inicializa o jogo, configurando o canvas e eventos
     */
    initialize() {
        // Redimensiona o canvas para preencher o contêiner
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Inicializa o mapa
        this.map.initialize(this.canvas.width, this.canvas.height);
        
        // Define o jogo como em execução
        this.isRunning = true;
        
        // Inicia o loop do jogo
        this.gameLoop(0);
        
        // Exporta a instância para uso global (para projéteis, efeitos, etc.)
        window.gameInstance = this;
        window.game = this;
    }

    /**
     * Redimensiona o canvas para se ajustar ao contêiner
     */
    resizeCanvas() {
        const gameArea = document.querySelector('.game-area');
        const rect = gameArea.getBoundingClientRect();
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Reinicializa o mapa se existir
        if (this.map) {
            this.map.initialize(this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Loop principal do jogo
     * @param {number} timestamp - Timestamp atual fornecido pelo requestAnimationFrame
     */
    gameLoop(timestamp) {
        // Calcula o tempo decorrido desde o último frame
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        // Limpa o canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Atualiza e desenha o jogo
        this.update(deltaTime);
        this.draw();
        
        // Continua o loop
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    /**
     * Atualiza o estado do jogo a cada frame
     * @param {number} deltaTime - Tempo decorrido desde o último frame em ms
     */
    update(deltaTime) {
        // Só atualiza se o jogo estiver rodando e não estiver terminado
        if (!this.isRunning || this.gameOver) return;
        
        // Atualiza torres
        for (const tower of this.towers) {
            tower.update(deltaTime, this.enemies);
        }
        
        // Atualiza inimigos e verifica se chegaram ao fim
        let totalDamage = 0;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const damage = enemy.update(deltaTime);
            
            // Se o inimigo chegou ao fim do caminho
            if (damage > 0) {
                totalDamage += damage;
                this.enemies.splice(i, 1);
            }
            // Se o inimigo morreu
            else if (enemy.health <= 0) {
                // Verifica se é um inimigo divisor
                if (enemy instanceof SplitterEnemy) {
                    const splitEnemies = enemy.split();
                    this.enemies.push(...splitEnemies);
                }
                
                // Adiciona dinheiro pela morte do inimigo
                this.money += enemy.reward;
                
                // Remove o inimigo morto
                this.enemies.splice(i, 1);
                
                // Atualiza a interface
                document.getElementById('money-counter').textContent = this.money;
            }
        }
        
        // Aplica dano às vidas do jogador
        if (totalDamage > 0) {
            this.lives -= totalDamage;
            document.getElementById('lives-counter').textContent = Math.max(0, this.lives);
            
            // Verifica condição de game over
            if (this.lives <= 0) {
                this.gameOver = true;
                this.waveActive = false;
                alert('Fim de jogo! Todas as vidas perdidas.');
            }
        }
        
        // Gerencia spawn de inimigos durante uma wave
        if (this.waveActive && this.currentWaveEnemies.length > 0) {
            const now = Date.now();
            if (now - this.lastEnemySpawnTime >= this.enemySpawnInterval) {
                this.spawnNextEnemy();
                this.lastEnemySpawnTime = now;
            }
        }
        
        // Verifica se a wave acabou
        if (this.waveActive && this.currentWaveEnemies.length === 0 && this.enemies.length === 0) {
            this.waveActive = false;
            
            // Adiciona bônus por completar a wave
            const waveBonus = 50 + this.currentWave * 10;
            this.money += waveBonus;
            document.getElementById('money-counter').textContent = this.money;
            
            // Atualiza a interface
            document.getElementById('start-wave-btn').textContent = 'Iniciar Wave';
            
            // Verifica se o jogo foi concluído
            if (this.currentWave >= this.totalWaves) {
                setTimeout(() => {
                    alert(`Parabéns! Você completou todas as ${this.totalWaves} waves!`);
                }, 500);
            } else {
                setTimeout(() => {
                    alert(`Wave ${this.currentWave} concluída! Bônus: $${waveBonus}`);
                }, 500);
            }
        }
    }

    /**
     * Desenha todos os elementos do jogo no canvas
     */
    draw() {
        // Desenha o mapa
        this.map.draw(this.ctx);
        
        // Desenha as torres
        for (const tower of this.towers) {
            tower.draw(this.ctx);
        }
        
        // Desenha os inimigos
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }
        
        // Desenha torre em posicionamento
        if (this.placingTower && this.mouseGridPos) {
            // Verifica se a posição é válida
            const { x, y } = this.mouseGridPos;
            const isValidPosition = this.map.canPlaceTower(x, y);
            
            // Desenha um indicador de posição
            const pos = this.map.gridToPixels(x, y);
            this.ctx.globalAlpha = isValidPosition ? 0.6 : 0.3;
            this.ctx.fillStyle = isValidPosition ? '#5cb85c' : '#d9534f';
            this.ctx.fillRect(
                pos.x - this.map.gridSize / 2,
                pos.y - this.map.gridSize / 2,
                this.map.gridSize,
                this.map.gridSize
            );
            this.ctx.globalAlpha = 1;
            
            // Desenha o alcance da torre
            if (isValidPosition && this.selectedTowerType) {
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, this.getTowerRange(this.selectedTowerType), 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.fill();
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.stroke();
            }
        }
        
        // Desenha estado do jogo
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#f44336';
            this.ctx.font = '32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Clique em "Reiniciar Jogo" para jogar novamente', this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
    }

    /**
     * Inicia uma nova wave de inimigos
     */
    startWave() {
        if (this.waveActive) return;
        
        this.currentWave++;
        
        if (this.currentWave > this.totalWaves) {
            alert('Você já completou todas as waves!');
            return;
        }
        
        this.waveActive = true;
        document.getElementById('wave-counter').textContent = `${this.currentWave}/${this.totalWaves}`;
        document.getElementById('start-wave-btn').textContent = 'Wave em andamento...';
        
        // Prepara a lista de inimigos para a wave atual
        this.prepareWaveEnemies(this.currentWave);
        
        // Inicia o spawn de inimigos
        this.lastEnemySpawnTime = Date.now();
    }

    /**
     * Prepara a lista de inimigos para a wave atual
     * @param {number} waveNumber - Número da wave atual
     */
    prepareWaveEnemies(waveNumber) {
        this.currentWaveEnemies = [];
        
        // Obtém a configuração da wave
        const waveConfig = this.waveConfig[waveNumber - 1];
        
        // Adiciona cada tipo de inimigo à fila
        for (const [enemyType, count] of Object.entries(waveConfig.enemies)) {
            for (let i = 0; i < count; i++) {
                this.currentWaveEnemies.push(enemyType);
            }
        }
        
        // Embaralha levemente a ordem para variedade
        for (let i = this.currentWaveEnemies.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.currentWaveEnemies[i], this.currentWaveEnemies[j]] = 
            [this.currentWaveEnemies[j], this.currentWaveEnemies[i]];
        }
        
        // Define o intervalo de spawn
        this.enemySpawnInterval = waveConfig.spawnInterval;
    }

    /**
     * Cria um novo inimigo da fila de spawn
     */
    spawnNextEnemy() {
        if (this.currentWaveEnemies.length === 0) return;
        
        const enemyType = this.currentWaveEnemies.shift();
        let enemy;
        
        // Cria o inimigo baseado no tipo
        switch (enemyType) {
            case 'fast':
                enemy = new FastEnemy(this.map);
                break;
            case 'strong':
                enemy = new StrongEnemy(this.map);
                break;
            case 'balanced':
                enemy = new BalancedEnemy(this.map);
                break;
            case 'glider':
                enemy = new GliderEnemy(this.map);
                break;
            case 'speedster':
                enemy = new SpeedsterEnemy(this.map);
                break;
            case 'resistant':
                enemy = new ResistantEnemy(this.map);
                break;
            case 'flying':
                enemy = new FlyingEnemy(this.map);
                break;
            case 'superBalanced':
                enemy = new SuperBalancedEnemy(this.map);
                break;
            case 'regenerating':
                enemy = new RegeneratingEnemy(this.map);
                break;
            case 'lightning':
                enemy = new LightningEnemy(this.map);
                break;
            case 'tough':
                enemy = new ToughEnemy(this.map);
                break;
            case 'gargoyle':
                enemy = new GargoyleEnemy(this.map);
                break;
            case 'splitter':
                enemy = new SplitterEnemy(this.map);
                break;
            case 'semiImmortal':
                enemy = new SemiImmortalEnemy(this.map);
                break;
            default:
                enemy = new BalancedEnemy(this.map);
        }
        
        this.enemies.push(enemy);
    }

    /**
     * Configura o modo de colocação de torre
     * @param {string} towerType - Tipo de torre a ser colocada
     */
    setTowerType(towerType) {
        // Remove a seleção de qualquer torre existente
        this.selectedTower = null;
        
        // Configura o modo de colocação
        this.selectedTowerType = towerType;
        this.placingTower = true;
    }

    /**
     * Tenta colocar uma torre na posição do grid
     * @param {number} gridX - Posição X no grid
     * @param {number} gridY - Posição Y no grid
     * @returns {boolean} - Verdadeiro se a torre foi colocada com sucesso
     */
    placeTower(gridX, gridY) {
        if (!this.selectedTowerType || !this.map.canPlaceTower(gridX, gridY)) {
            return false;
        }
        
        // Verifica se tem dinheiro suficiente
        const towerCost = this.getTowerCost(this.selectedTowerType);
        if (this.money < towerCost) {
            alert('Dinheiro insuficiente para construir esta torre!');
            return false;
        }
        
        // Cria a torre baseada no tipo selecionado
        let tower;
        switch (this.selectedTowerType) {
            case 'arqueiro':
                tower = new ArcherTower(gridX, gridY, this.map);
                break;
            case 'canhao':
                tower = new CannonTower(gridX, gridY, this.map);
                break;
            case 'sniper':
                tower = new SniperTower(gridX, gridY, this.map);
                break;
            case 'gelo':
                tower = new IceTower(gridX, gridY, this.map);
                break;
            case 'veneno':
                tower = new PoisonTower(gridX, gridY, this.map);
                break;
            case 'balista':
                tower = new BallistaTower(gridX, gridY, this.map);
                break;
            default:
                return false;
        }
        
        // Adiciona a torre e deduz o custo
        this.towers.push(tower);
        this.money -= towerCost;
        
        // Atualiza a interface
        document.getElementById('money-counter').textContent = this.money;
        
        return true;
    }

    /**
     * Seleciona uma torre existente
     * @param {number} gridX - Posição X no grid
     * @param {number} gridY - Posição Y no grid
     * @returns {Tower|null} - A torre selecionada ou null se não houver torre
     */
    selectTower(gridX, gridY) {
        for (const tower of this.towers) {
            if (tower.gridX === gridX && tower.gridY === gridY) {
                this.selectedTower = tower;
                this.placingTower = false;
                this.selectedTowerType = null;
                tower.showRange();
                return tower;
            }
        }
        
        this.selectedTower = null;
        return null;
    }

    /**
     * Melhora a torre selecionada
     * @returns {boolean} - Verdadeiro se a melhoria foi aplicada com sucesso
     */
    upgradeTower() {
        if (!this.selectedTower) return false;
        
        // Verifica se já está no nível máximo
        if (this.selectedTower.upgradeCount >= this.selectedTower.maxUpgrades) {
            alert('Esta torre já está no nível máximo!');
            return false;
        }
        
        // Verifica se tem dinheiro suficiente
        if (this.money < this.selectedTower.upgradeCost) {
            alert('Dinheiro insuficiente para melhorar esta torre!');
            return false;
        }
        
        // Aplica a melhoria
        this.selectedTower.upgrade();
        this.money -= this.selectedTower.upgradeCost;
        
        // Atualiza a interface
        document.getElementById('money-counter').textContent = this.money;
        
        return true;
    }

    /**
     * Vende a torre selecionada, recuperando parte do custo
     * @returns {boolean} - Verdadeiro se a torre foi vendida com sucesso
     */
    sellTower() {
        if (!this.selectedTower) return false;
        
        // Remove a torre do jogo
        const index = this.towers.indexOf(this.selectedTower);
        if (index !== -1) {
            // Calcula o valor de venda (50% do custo total investido)
            const towerType = this.getTowerTypeFromInstance(this.selectedTower);
            const baseCost = this.getTowerCost(towerType);
            
            // Soma o custo das melhorias
            let upgradeCost = 0;
            for (let i = 0; i < this.selectedTower.upgradeCount; i++) {
                upgradeCost += this.selectedTower.upgradeCost / Math.pow(1.5, i + 1);
            }
            
            const sellValue = Math.floor((baseCost + upgradeCost) * 0.5);
            
            this.towers.splice(index, 1);
            this.money += sellValue;
            
            // Atualiza a interface
            document.getElementById('money-counter').textContent = this.money;
            
            this.selectedTower = null;
            
            return true;
        }
        
        return false;
    }

    /**
     * Atualiza a posição do mouse no grid
     * @param {number} mouseX - Posição X do mouse
     * @param {number} mouseY - Posição Y do mouse
     */
    updateMousePosition(mouseX, mouseY) {
        this.mouseGridPos = this.map.mouseToGrid(mouseX, mouseY);
    }

    /**
     * Reseta o jogo para o estado inicial
     */
    resetGame() {
        // Reseta estado do jogo
        this.isRunning = true;
        this.gameOver = false;
        this.waveActive = false;
        this.currentWave = 0;
        
        // Reseta recursos
        this.lives = 20;
        this.money = 500;
        
        // Limpa entidades
        this.towers = [];
        this.enemies = [];
        this.currentWaveEnemies = [];
        
        // Reseta seleção
        this.selectedTowerType = null;
        this.placingTower = false;
        this.selectedTower = null;
        
        // Atualiza interface
        document.getElementById('lives-counter').textContent = this.lives;
        document.getElementById('money-counter').textContent = this.money;
        document.getElementById('wave-counter').textContent = `0/${this.totalWaves}`;
        document.getElementById('start-wave-btn').textContent = 'Iniciar Wave';
        
        // Limpa o painel de informações
        const infoPanel = document.getElementById('tower-info-panel');
        infoPanel.innerHTML = '<h3>Informações</h3><p>Selecione uma torre para ver detalhes</p>';
        
        // Reinicia o mapa
        this.map.initialize(this.canvas.width, this.canvas.height);
    }

    /**
     * Retorna o custo de uma torre baseado no tipo
     * @param {string} towerType - Tipo da torre
     * @returns {number} - Custo da torre
     */
    getTowerCost(towerType) {
        switch (towerType) {
            case 'arqueiro': return 100;
            case 'canhao': return 200;
            case 'sniper': return 250;
            case 'gelo': return 150;
            case 'veneno': return 180;
            case 'balista': return 300;
            default: return 100;
        }
    }

    /**
     * Retorna o alcance de uma torre baseado no tipo
     * @param {string} towerType - Tipo da torre
     * @returns {number} - Alcance da torre
     */
    getTowerRange(towerType) {
        switch (towerType) {
            case 'arqueiro': return 150;
            case 'canhao': return 120;
            case 'sniper': return 250;
            case 'gelo': return 120;
            case 'veneno': return 130;
            case 'balista': return 180;
            default: return 120;
        }
    }

    /**
     * Retorna o tipo de uma instância de torre
     * @param {Tower} tower - Instância de torre
     * @returns {string} - Tipo da torre
     */
    getTowerTypeFromInstance(tower) {
        if (tower instanceof ArcherTower) return 'arqueiro';
        if (tower instanceof CannonTower) return 'canhao';
        if (tower instanceof SniperTower) return 'sniper';
        if (tower instanceof IceTower) return 'gelo';
        if (tower instanceof PoisonTower) return 'veneno';
        if (tower instanceof BallistaTower) return 'balista';
        return '';
    }

    /**
     * Cria configurações para as waves de inimigos
     * @returns {Array} - Array de configurações de wave
     */
    createWaveConfigurations() {
        return [
            {
                // Wave 1: Introdução com inimigos básicos
                enemies: {
                    'balanced': 5,
                    'fast': 3
                },
                spawnInterval: 1500
            },
            {
                // Wave 2: Mais inimigos básicos
                enemies: {
                    'balanced': 7,
                    'fast': 5,
                    'strong': 2
                },
                spawnInterval: 1300
            },
            {
                // Wave 3: Introduz inimigo glider
                enemies: {
                    'balanced': 6,
                    'fast': 6,
                    'strong': 3,
                    'glider': 2
                },
                spawnInterval: 1200
            },
            {
                // Wave 4: Primeiro inimigo avançado
                enemies: {
                    'balanced': 8,
                    'fast': 6,
                    'strong': 4,
                    'glider': 3,
                    'speedster': 1
                },
                spawnInterval: 1100
            },
            {
                // Wave 5: Mais inimigos avançados
                enemies: {
                    'balanced': 10,
                    'fast': 8,
                    'strong': 5,
                    'glider': 4,
                    'speedster': 2,
                    'resistant': 1,
                    'flying': 1
                },
                spawnInterval: 1000
            },
            {
                // Wave 6: Introduz regenerador
                enemies: {
                    'balanced': 8,
                    'fast': 6,
                    'strong': 6,
                    'glider': 5,
                    'speedster': 3,
                    'resistant': 2,
                    'flying': 2,
                    'regenerating': 1
                },
                spawnInterval: 900
            },
            {
                // Wave 7: Primeiro inimigo elite
                enemies: {
                    'balanced': 10,
                    'fast': 7,
                    'strong': 7,
                    'glider': 5,
                    'speedster': 4,
                    'resistant': 3,
                    'flying': 3,
                    'regenerating': 2,
                    'superBalanced': 2,
                    'lightning': 1
                },
                spawnInterval: 800
            },
            {
                // Wave 8: Mais inimigos elite
                enemies: {
                    'speedster': 5,
                    'resistant': 4,
                    'flying': 4,
                    'regenerating': 3,
                    'superBalanced': 3,
                    'lightning': 2,
                    'tough': 1,
                    'splitter': 1
                },
                spawnInterval: 700
            },
            {
                // Wave 9: Desafio difícil
                enemies: {
                    'speedster': 6,
                    'resistant': 5,
                    'flying': 5,
                    'regenerating': 4,
                    'superBalanced': 4,
                    'lightning': 3,
                    'tough': 2,
                    'splitter': 2,
                    'gargoyle': 1
                },
                spawnInterval: 600
            },
            {
                // Wave 10: Wave final com todos os inimigos elite
                enemies: {
                    'speedster': 8,
                    'resistant': 6,
                    'flying': 6,
                    'regenerating': 5,
                    'superBalanced': 5,
                    'lightning': 4,
                    'tough': 3,
                    'splitter': 3,
                    'gargoyle': 2,
                    'semiImmortal': 1
                },
                spawnInterval: 500
            }
        ];
    }
}

// Inicia o jogo quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    window.game = game; // Disponibiliza o jogo globalmente para debug
});
