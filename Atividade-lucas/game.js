class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.map = new GameMap();
        
        // Estado do jogo
        this.gameRunning = false;
        this.gameOver = false;
        this.waveActive = false;
        this.currentWave = 0;
        this.maxWaves = 20;
        
        // Recursos
        this.lives = 20;
        this.money = 200; // Reduzido drasticamente de 500
        
        // Arrays de entidades
        this.towers = [];
        this.enemies = [];
        this.waveEnemies = [];
        this.spawnTimer = 0;
        this.spawnDelay = 1500; // ms entre spawns
        
        // Interface
        this.selectedTower = null;
        this.placingTower = false;
        this.selectedTowerType = null;
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Timing
        this.lastTime = 0;
        this.animationId = null;
        
        this.initializeCanvas();
        this.initializeGame();
        
        // Torna disponível globalmente
        window.gameInstance = this;
    }

    initializeCanvas() {
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.map.initialize(this.canvas.width, this.canvas.height);
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    initializeGame() {
        this.gameRunning = true;
        this.gameLoop();
    }

    gameLoop(currentTime = 0) {
        if (!this.gameRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        if (this.gameOver) return;
        
        // Atualiza spawn de inimigos
        this.updateEnemySpawning(deltaTime);
        
        // Atualiza torres
        for (const tower of this.towers) {
            tower.update(deltaTime, this.enemies);
        }
        
        // Atualiza inimigos
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime);
            
            // Remove inimigos mortos
            if (enemy.isDead()) {
                this.money += enemy.reward;
                this.enemies.splice(i, 1);
                this.updateUI();
                continue;
            }
            
            // Remove inimigos que chegaram ao fim
            if (enemy.hasReachedEnd()) {
                this.lives--;
                this.enemies.splice(i, 1);
                this.updateUI();
                
                if (this.lives <= 0) {
                    this.gameOver = true;
                    this.showGameOverMessage();
                }
            }
        }
        
        // Verifica fim de wave
        if (this.waveActive && this.enemies.length === 0 && this.waveEnemies.length === 0) {
            this.waveActive = false;
            
            if (this.currentWave >= this.maxWaves) {
                this.showVictoryMessage();
            }
        }
    }

    updateEnemySpawning(deltaTime) {
        if (!this.waveActive || this.waveEnemies.length === 0) return;
        
        this.spawnTimer -= deltaTime;
        
        if (this.spawnTimer <= 0) {
            const enemyType = this.waveEnemies.shift();
            const enemy = this.createEnemy(enemyType);
            this.enemies.push(enemy);
            
            this.spawnTimer = this.spawnDelay;
        }
    }

    createEnemy(type) {
        switch (type) {
            case 'basic': return new Enemy(this.map);
            case 'fast': return new FastEnemy(this.map);
            case 'strong': return new StrongEnemy(this.map);
            case 'balanced': return new BalancedEnemy(this.map);
            case 'glider': return new GliderEnemy(this.map);
            case 'speedster': return new SpeedsterEnemy(this.map);
            case 'resistant': return new ResistantEnemy(this.map);
            case 'flying': return new FlyingEnemy(this.map);
            case 'superbalanced': return new SuperBalancedEnemy(this.map);
            case 'regenerating': return new RegeneratingEnemy(this.map);
            case 'lightning': return new LightningEnemy(this.map);
            case 'tough': return new ToughEnemy(this.map);
            case 'gargoyle': return new GargoyleEnemy(this.map);
            case 'splitter': return new SplitterEnemy(this.map);
            case 'semiimmortal': return new SemiImmortalEnemy(this.map);
            case 'berserker': return new BerserkerEnemy(this.map);
            case 'phantom': return new PhantomEnemy(this.map);
            case 'nightmare': return new NightmareEnemy(this.map);
            case 'golem': return new GolemBoss(this.map);
            case 'lich': return new LichBoss(this.map);
            case 'dragon': return new DragonBoss(this.map);
            default: return new Enemy(this.map);
        }
    }

    generateWaveEnemies(waveNumber) {
        const enemies = [];
        const baseEnemyCount = 8 + Math.floor(waveNumber * 3); // Progressão muito mais agressiva
        
        // Waves 1-5: Inimigos básicos com crescimento rápido
        if (waveNumber <= 5) {
            const types = ['basic', 'fast', 'strong', 'balanced'];
            for (let i = 0; i < baseEnemyCount; i++) {
                enemies.push(types[Math.floor(Math.random() * types.length)]);
            }
            
            // Voadores desde wave 2
            if (waveNumber >= 2) {
                for (let i = 0; i < Math.floor(waveNumber); i++) {
                    enemies.push('glider');
                }
            }
        }
        // Waves 6-9: Avançados dominam
        else if (waveNumber <= 9) {
            const advancedTypes = ['speedster', 'resistant', 'flying', 'superbalanced', 'regenerating'];
            const basicTypes = ['fast', 'strong', 'balanced'];
            
            // 80% avançados
            for (let i = 0; i < Math.floor(baseEnemyCount * 0.8); i++) {
                enemies.push(advancedTypes[Math.floor(Math.random() * advancedTypes.length)]);
            }
            
            // 20% básicos
            for (let i = 0; i < Math.floor(baseEnemyCount * 0.2); i++) {
                enemies.push(basicTypes[Math.floor(Math.random() * basicTypes.length)]);
            }
        }
        // Wave 10: Boss Golem + elite + avançados
        else if (waveNumber === 10) {
            const eliteTypes = ['lightning', 'tough', 'gargoyle', 'splitter'];
            const advancedTypes = ['speedster', 'resistant', 'flying', 'regenerating'];
            
            // Boss principal
            enemies.push('golem');
            
            // Elite support
            for (let i = 0; i < Math.floor(baseEnemyCount * 0.6); i++) {
                enemies.push(eliteTypes[Math.floor(Math.random() * eliteTypes.length)]);
            }
            
            // Avançados support
            for (let i = 0; i < Math.floor(baseEnemyCount * 0.4); i++) {
                enemies.push(advancedTypes[Math.floor(Math.random() * advancedTypes.length)]);
            }
        }
        // Waves 11-14: Elite dominam
        else if (waveNumber <= 14) {
            const eliteTypes = ['lightning', 'tough', 'gargoyle', 'splitter', 'semiimmortal', 'berserker', 'phantom'];
            const advancedTypes = ['speedster', 'resistant', 'flying', 'regenerating'];
            
            // 85% elite
            for (let i = 0; i < Math.floor(baseEnemyCount * 0.85); i++) {
                enemies.push(eliteTypes[Math.floor(Math.random() * eliteTypes.length)]);
            }
            
            // 15% avançados
            for (let i = 0; i < Math.floor(baseEnemyCount * 0.15); i++) {
                enemies.push(advancedTypes[Math.floor(Math.random() * advancedTypes.length)]);
            }
        }
        // Wave 15: Boss Lich + nightmare + elite
        else if (waveNumber === 15) {
            const eliteTypes = ['lightning', 'tough', 'gargoyle', 'splitter', 'semiimmortal', 'berserker', 'phantom', 'nightmare'];
            const advancedTypes = ['speedster', 'resistant', 'flying', 'regenerating'];
            
            // Boss principal
            enemies.push('lich');
            
            // Nightmare mode enemies
            for (let i = 0; i < Math.floor(baseEnemyCount * 0.4); i++) {
                enemies.push('nightmare');
            }
            
            // Elite support
            for (let i = 0; i < Math.floor(baseEnemyCount * 0.4); i++) {
                enemies.push(eliteTypes[Math.floor(Math.random() * eliteTypes.length)]);
            }
            
            // Avançados support
            for (let i = 0; i < Math.floor(baseEnemyCount * 0.2); i++) {
                enemies.push(advancedTypes[Math.floor(Math.random() * advancedTypes.length)]);
            }
        }
        // Waves 16-19: Pesadelo total
        else if (waveNumber <= 19) {
            const nightmareTypes = ['nightmare', 'berserker', 'phantom', 'semiimmortal'];
            const eliteTypes = ['lightning', 'tough', 'gargoyle', 'splitter'];
            
            // 70% nightmare tier
            for (let i = 0; i < Math.floor(baseEnemyCount * 0.7); i++) {
                enemies.push(nightmareTypes[Math.floor(Math.random() * nightmareTypes.length)]);
            }
            
            // 30% elite
            for (let i = 0; i < Math.floor(baseEnemyCount * 0.3); i++) {
                enemies.push(eliteTypes[Math.floor(Math.random() * eliteTypes.length)]);
            }
            
            // Extra mini-bosses
            if (waveNumber >= 17) {
                enemies.push('golem');
            }
            if (waveNumber >= 18) {
                enemies.push('lich');
            }
        }
        // Wave 20: APOCALIPSE FINAL - Todos os 3 bosses + nightmare army
        else if (waveNumber === 20) {
            // Os 3 bosses principais
            enemies.push('golem', 'lich', 'dragon');
            
            // Exército de pesadelo
            const nightmareArmy = ['nightmare', 'berserker', 'phantom', 'semiimmortal'];
            for (let i = 0; i < baseEnemyCount; i++) {
                enemies.push(nightmareArmy[Math.floor(Math.random() * nightmareArmy.length)]);
            }
            
            // Elite support adicional
            const eliteSupport = ['lightning', 'tough', 'gargoyle', 'splitter'];
            for (let i = 0; i < Math.floor(baseEnemyCount * 0.5); i++) {
                enemies.push(eliteSupport[Math.floor(Math.random() * eliteSupport.length)]);
            }
        }
        
        return enemies;
    }

    startWave() {
        if (this.waveActive || this.gameOver) return;
        
        this.currentWave++;
        this.waveEnemies = this.generateWaveEnemies(this.currentWave);
        this.waveActive = true;
        this.spawnTimer = 0;
        
        this.updateUI();
    }

    placeTower(gridX, gridY) {
        if (!this.placingTower || !this.selectedTowerType) return false;
        
        if (!this.map.canPlaceTower(gridX, gridY)) return false;
        
        const towerCost = this.getTowerCost(this.selectedTowerType);
        if (this.money < towerCost) return false;
        
        const tower = this.createTower(this.selectedTowerType, gridX, gridY);
        if (tower && this.map.addTower(tower)) {
            this.towers.push(tower);
            this.money -= towerCost;
            this.placingTower = false;
            this.selectedTowerType = null;
            this.updateUI();
            return true;
        }
        
        return false;
    }

    createTower(type, gridX, gridY) {
        switch (type) {
            case 'arqueiro': return new ArcherTower(gridX, gridY, this.map);
            case 'gelo': return new IceTower(gridX, gridY, this.map);
            case 'veneno': return new PoisonTower(gridX, gridY, this.map);
            case 'gladiador': return new GladiatorTower(gridX, gridY, this.map);
            case 'canhao': return new CannonTower(gridX, gridY, this.map);
            case 'sniper': return new SniperTower(gridX, gridY, this.map);
            case 'balista': return new BallistaTower(gridX, gridY, this.map);
            default: return null;
        }
    }

    getTowerCost(type) {
        const costs = {
            'arqueiro': 80,
            'gelo': 120,
            'veneno': 150,
            'gladiador': 200,
            'canhao': 250,
            'sniper': 300,
            'balista': 600
        };
        return costs[type] || 0;
    }

    getTowerTypeFromInstance(tower) {
        if (tower instanceof ArcherTower) return 'arqueiro';
        if (tower instanceof IceTower) return 'gelo';
        if (tower instanceof PoisonTower) return 'veneno';
        if (tower instanceof GladiatorTower) return 'gladiador';
        if (tower instanceof CannonTower) return 'canhao';
        if (tower instanceof SniperTower) return 'sniper';
        if (tower instanceof BallistaTower) return 'balista';
        return 'torre';
    }

    selectTower(gridX, gridY) {
        this.selectedTower = null;
        
        for (const tower of this.towers) {
            if (tower.gridX === gridX && tower.gridY === gridY) {
                this.selectedTower = tower;
                tower.showRange();
                return tower;
            }
        }
        
        return null;
    }

    upgradeTower() {
        if (!this.selectedTower) return false;
        
        if (this.money < this.selectedTower.upgradeCost) return false;
        
        if (this.selectedTower.upgrade()) {
            this.money -= this.selectedTower.upgradeCost;
            this.updateUI();
            return true;
        }
        
        return false;
    }

    sellTower() {
        if (!this.selectedTower) return false;
        
        const sellPrice = Math.floor(this.selectedTower.cost * 0.7);
        this.money += sellPrice;
        
        // Remove da lista de torres
        const towerIndex = this.towers.indexOf(this.selectedTower);
        if (towerIndex !== -1) {
            this.towers.splice(towerIndex, 1);
        }
        
        // Remove do mapa
        this.map.removeTower(this.selectedTower.gridX, this.selectedTower.gridY);
        
        this.selectedTower = null;
        this.updateUI();
        return true;
    }

    updateMousePosition(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }

    render() {
        // Limpa o canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenha o mapa
        this.map.draw(this.ctx);
        
        // Desenha torres
        for (const tower of this.towers) {
            tower.draw(this.ctx);
        }
        
        // Desenha inimigos
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }
        
        // Desenha prévia da torre se estiver colocando
        if (this.placingTower && this.selectedTowerType) {
            this.drawTowerPreview();
        }
    }

    drawTowerPreview() {
        const gridPos = this.map.mouseToGrid(this.mouseX, this.mouseY);
        const pixelPos = this.map.gridToPixels(gridPos.x, gridPos.y);
        
        const canPlace = this.map.canPlaceTower(gridPos.x, gridPos.y);
        const towerCost = this.getTowerCost(this.selectedTowerType);
        const canAfford = this.money >= towerCost;
        
        // Cor da prévia
        this.ctx.fillStyle = canPlace && canAfford ? 
            'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)';
        
        const size = this.map.gridSize * 0.8;
        this.ctx.fillRect(
            pixelPos.x - size / 2,
            pixelPos.y - size / 2,
            size,
            size
        );
        
        // Alcance da torre
        if (canPlace && canAfford) {
            const tower = this.createTower(this.selectedTowerType, 0, 0);
            if (tower) {
                this.ctx.beginPath();
                this.ctx.arc(pixelPos.x, pixelPos.y, tower.range, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.fill();
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.stroke();
            }
        }
    }

    updateUI() {
        const livesCounter = document.getElementById('lives-counter');
        const moneyCounter = document.getElementById('money-counter');
        const waveCounter = document.getElementById('wave-counter');
        
        if (livesCounter) livesCounter.textContent = this.lives;
        if (moneyCounter) moneyCounter.textContent = this.money;
        if (waveCounter) waveCounter.textContent = `${this.currentWave}/${this.maxWaves}`;
        
        // Atualiza disponibilidade dos botões de torre
        const towerElements = document.querySelectorAll('.tower');
        towerElements.forEach(element => {
            const towerType = element.getAttribute('data-tower');
            const cost = this.getTowerCost(towerType);
            
            if (this.money >= cost) {
                element.classList.remove('disabled');
            } else {
                element.classList.add('disabled');
            }
        });
        
        // Atualiza botão de wave
        const startWaveBtn = document.getElementById('start-wave-btn');
        if (startWaveBtn) {
            startWaveBtn.disabled = this.waveActive || this.gameOver;
            startWaveBtn.textContent = this.waveActive ? 
                'Wave em Andamento' : 
                this.currentWave >= this.maxWaves ? 'Jogo Completo' : 'Iniciar Wave';
        }
    }

    resetGame() {
        this.gameRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Reset do estado
        this.gameOver = false;
        this.waveActive = false;
        this.currentWave = 0;
        this.lives = 20;
        this.money = 500;
        
        // Limpa arrays
        this.towers = [];
        this.enemies = [];
        this.waveEnemies = [];
        this.map.placedTowers = [];
        
        // Reset da interface
        this.selectedTower = null;
        this.placingTower = false;
        this.selectedTowerType = null;
        
        // Limpa painel de informações
        const infoPanel = document.getElementById('tower-info-panel');
        if (infoPanel) {
            infoPanel.innerHTML = '<h3>Informações</h3><p>Selecione uma torre para ver detalhes</p>';
        }
        
        this.updateUI();
        this.initializeGame();
    }

    showGameOverMessage() {
        setTimeout(() => {
            alert('Game Over! Suas defesas foram superadas.\n\nWave alcançada: ' + this.currentWave);
        }, 100);
    }

    showVictoryMessage() {
        setTimeout(() => {
            alert('Parabéns! Você defendeu com sucesso contra todas as 30 waves!\n\nVocê é um verdadeiro mestre da defesa!');
            this.gameOver = true;
        }, 100);
    }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
});

window.Game = Game;
