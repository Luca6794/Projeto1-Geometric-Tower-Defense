class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.map = new GameMap();
        
        this.money = 500;
        this.lives = 20;
        this.wave = 1;
        this.enemies = [];
        this.gameLoop = null;
        this.lastTime = 0;
        this.waveActive = false;
        this.gameOver = false;
        this.selectedTower = null;
        this.placingTower = false;
        this.selectedTowerType = null;
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.waveData = [
            { enemies: [FastEnemy, BalancedEnemy], count: 8, interval: 1000 },
            { enemies: [FastEnemy, StrongEnemy], count: 10, interval: 900 },
            { enemies: [BalancedEnemy, GliderEnemy], count: 12, interval: 800 },
            { enemies: [StrongEnemy, SpeedsterEnemy], count: 14, interval: 750 },
            { enemies: [ResistantEnemy, FlyingEnemy], count: 16, interval: 700 },
            { enemies: [SpeedsterEnemy, SuperBalancedEnemy], count: 18, interval: 650 },
            { enemies: [ResistantEnemy, RegeneratingEnemy], count: 20, interval: 600 },
            { enemies: [FlyingEnemy, LightningEnemy], count: 22, interval: 550 },
            { enemies: [ToughEnemy, GargoyleEnemy], count: 24, interval: 500 },
            { enemies: [GolemBoss], count: 1, interval: 0, boss: true },
            { enemies: [SplitterEnemy, SemiImmortalEnemy], count: 26, interval: 450 },
            { enemies: [LightningEnemy, ToughEnemy], count: 28, interval: 400 },
            { enemies: [GargoyleEnemy, SplitterEnemy], count: 30, interval: 350 },
            { enemies: [SemiImmortalEnemy, RegeneratingEnemy], count: 32, interval: 300 },
            { enemies: [LichBoss], count: 1, interval: 0, boss: true },
            { enemies: [FastEnemy, StrongEnemy, BalancedEnemy], count: 35, interval: 250 },
            { enemies: [SpeedsterEnemy, ResistantEnemy, FlyingEnemy], count: 38, interval: 200 },
            { enemies: [LightningEnemy, ToughEnemy, GargoyleEnemy], count: 40, interval: 150 },
            { enemies: [SplitterEnemy, SemiImmortalEnemy, RegeneratingEnemy], count: 42, interval: 100 },
            { enemies: [GolemBoss, LichBoss, DragonBoss], count: 3, interval: 5000, boss: true }
        ];
        
        this.initializeCanvas();
        this.initializeGame();
        this.startGameLoop();
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
        this.updateUI();
    }

    startGameLoop() {
        const gameLoop = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.update(deltaTime);
            this.render();
            
            this.gameLoop = requestAnimationFrame(gameLoop);
        };
        
        this.gameLoop = requestAnimationFrame(gameLoop);
    }

    update(deltaTime) {
        if (this.gameOver) return;
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime);
            
            if (enemy.health <= 0) {
                this.money += enemy.reward;
                this.enemies.splice(i, 1);
                this.updateUI();
            } else if (enemy.progress >= 1) {
                this.lives--;
                this.enemies.splice(i, 1);
                this.updateUI();
                
                if (this.lives <= 0) {
                    this.endGame();
                }
            }
        }
        
        for (const tower of this.map.placedTowers) {
            tower.update(deltaTime, this.enemies);
        }
    }

    render() {
        this.map.draw(this.ctx);
        
        for (const tower of this.map.placedTowers) {
            tower.draw(this.ctx);
        }
        
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }
        
        if (this.placingTower && this.selectedTowerType) {
            this.drawTowerPreview();
        }
    }

    drawTowerPreview() {
        const gridPos = this.map.mouseToGrid(this.mouseX, this.mouseY);
        const pixelPos = this.map.gridToPixels(gridPos.x, gridPos.y);
        const canPlace = this.map.canPlaceTower(gridPos.x, gridPos.y);
        
        this.ctx.globalAlpha = 0.7;
        this.ctx.fillStyle = canPlace ? '#00ff00' : '#ff0000';
        this.ctx.fillRect(
            pixelPos.x - this.map.gridSize * 0.4,
            pixelPos.y - this.map.gridSize * 0.4,
            this.map.gridSize * 0.8,
            this.map.gridSize * 0.8
        );
        this.ctx.globalAlpha = 1.0;
    }

    startWave() {
        if (this.waveActive || this.gameOver) return;
        
        this.waveActive = true;
        const waveConfig = this.waveData[Math.min(this.wave - 1, this.waveData.length - 1)];
        
        if (waveConfig.boss) {
            // Spawn bosses imediatamente
            waveConfig.enemies.forEach((EnemyClass, index) => {
                setTimeout(() => {
                    this.enemies.push(new EnemyClass(this.map));
                }, index * (waveConfig.interval || 3000));
            });
            this.checkWaveComplete();
        } else {
            // Spawn normal de inimigos
            let enemiesSpawned = 0;
            const spawnInterval = setInterval(() => {
                if (enemiesSpawned >= waveConfig.count) {
                    clearInterval(spawnInterval);
                    this.checkWaveComplete();
                    return;
                }
                
                const EnemyClass = waveConfig.enemies[Math.floor(Math.random() * waveConfig.enemies.length)];
                this.enemies.push(new EnemyClass(this.map));
                enemiesSpawned++;
            }, waveConfig.interval);
        }
        
        this.updateUI();
    }

    checkWaveComplete() {
        const checkComplete = () => {
            if (this.enemies.length === 0 && this.waveActive) {
                this.waveActive = false;
                this.wave++;
                this.money += 50;
                this.updateUI();
                
                if (this.wave > 20) {
                    this.winGame();
                }
            } else if (this.waveActive) {
                setTimeout(checkComplete, 1000);
            }
        };
        
        setTimeout(checkComplete, 2000);
    }

    placeTower(gridX, gridY) {
        if (!this.selectedTowerType || !this.map.canPlaceTower(gridX, gridY)) {
            return false;
        }
        
        const towerCost = this.getTowerCost(this.selectedTowerType);
        if (this.money < towerCost) {
            return false;
        }
        
        const TowerClass = this.getTowerClass(this.selectedTowerType);
        const tower = new TowerClass(gridX, gridY, this.map);
        
        if (this.map.addTower(tower)) {
            this.money -= towerCost;
            this.updateUI();
            return true;
        }
        
        return false;
    }

    selectTower(gridX, gridY) {
        for (const tower of this.map.placedTowers) {
            if (tower.gridX === gridX && tower.gridY === gridY) {
                this.selectedTower = tower;
                tower.showRange();
                return tower;
            }
        }
        
        this.selectedTower = null;
        return null;
    }

    upgradeTower() {
        if (!this.selectedTower) return false;
        
        if (this.money >= this.selectedTower.upgradeCost) {
            this.money -= this.selectedTower.upgradeCost;
            this.selectedTower.upgrade();
            this.updateUI();
            return true;
        }
        
        return false;
    }

    sellTower() {
        if (!this.selectedTower) return false;
        
        const sellValue = Math.floor(this.selectedTower.cost * 0.7);
        this.money += sellValue;
        
        this.map.removeTower(this.selectedTower.gridX, this.selectedTower.gridY);
        this.selectedTower = null;
        this.updateUI();
        
        return true;
    }

    getTowerClass(towerType) {
        const towerClasses = {
            'arqueiro': ArcherTower,
            'canhao': CannonTower,
            'sniper': SniperTower,
            'gelo': IceTower,
            'veneno': PoisonTower,
            'balista': BallistaTower,
            'gladiador': GladiatorTower
        };
        
        return towerClasses[towerType] || ArcherTower;
    }

    getTowerCost(towerType) {
        const costs = {
            'arqueiro': 80,
            'canhao': 250,
            'sniper': 300,
            'gelo': 120,
            'veneno': 150,
            'balista': 600,
            'gladiador': 200
        };
        
        return costs[towerType] || 100;
    }

    getTowerTypeFromInstance(towerInstance) {
        if (towerInstance instanceof ArcherTower) return 'arqueiro';
        if (towerInstance instanceof CannonTower) return 'canhao';
        if (towerInstance instanceof SniperTower) return 'sniper';
        if (towerInstance instanceof IceTower) return 'gelo';
        if (towerInstance instanceof PoisonTower) return 'veneno';
        if (towerInstance instanceof BallistaTower) return 'balista';
        if (towerInstance instanceof GladiatorTower) return 'gladiador';
        return 'arqueiro';
    }

    updateMousePosition(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }

    updateUI() {
        document.getElementById('lives-counter').textContent = this.lives;
        document.getElementById('money-counter').textContent = this.money;
        document.getElementById('wave-counter').textContent = `${this.wave}/20`;
    }

    resetGame() {
        this.money = 500;
        this.lives = 20;
        this.wave = 1;
        this.enemies = [];
        this.waveActive = false;
        this.gameOver = false;
        this.selectedTower = null;
        this.placingTower = false;
        this.selectedTowerType = null;
        this.map.placedTowers = [];
        this.updateUI();
    }

    endGame() {
        this.gameOver = true;
        alert('Game Over! Você perdeu todas as vidas.');
    }

    winGame() {
        this.gameOver = true;
        alert('Parabéns! Você completou todas as ondas!');
    }
}

window.Game = Game;
window.gameInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
    window.game = window.gameInstance;
});
