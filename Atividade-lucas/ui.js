let gameInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    gameInstance = window.gameInstance || new Game();
    
    const canvas = document.getElementById('game-canvas');
    const startWaveBtn = document.getElementById('start-wave-btn');
    const resetGameBtn = document.getElementById('reset-game-btn');
    const catalogBtn = document.getElementById('catalog-btn');
    const catalogModal = document.getElementById('catalog-modal');
    const closeBtn = document.querySelector('.close-btn');
    const towerElements = document.querySelectorAll('.tower');
    const infoPanel = document.getElementById('tower-info-panel');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    function createEnemyElement(enemy) {
        const info = enemy.getInfo();
        
        const enemyElement = document.createElement('div');
        enemyElement.className = 'catalog-item';
        
        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 60;
        canvas.className = 'catalog-icon';
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, 60, 60);
        
        enemy.x = 30;
        enemy.y = 30;
        enemy.draw(ctx);
        
        enemyElement.appendChild(canvas);
        
        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = `
            <h4>${info.nome}</h4>
            <p>${info.descricao}</p>
            <p><strong>Vida:</strong> ${info.vida}</p>
            <p><strong>Velocidade:</strong> ${info.velocidade}x</p>
            <p><strong>Recompensa:</strong> $${info.recompensa}</p>
        `;
        
        enemyElement.appendChild(infoDiv);
        
        return enemyElement;
    }
    
    function fillTowersCatalog() {
        const towersCatalog = document.querySelector('#towers-catalog .catalog-grid');
        if (towersCatalog) {
            towersCatalog.innerHTML = '';
            
            const towers = [
                new ArcherTower(0, 0, gameInstance.map),
                new CannonTower(0, 0, gameInstance.map),
                new SniperTower(0, 0, gameInstance.map),
                new IceTower(0, 0, gameInstance.map),
                new PoisonTower(0, 0, gameInstance.map),
                new BallistaTower(0, 0, gameInstance.map),
                new GladiatorTower(0, 0, gameInstance.map)
            ];
            
            towers.forEach(tower => {
                const info = tower.getInfo();
                const towerType = gameInstance.getTowerTypeFromInstance(tower);
                const iconClass = `tower-icon tower-${towerType}`;
                
                const towerElement = document.createElement('div');
                towerElement.className = 'catalog-item';
                towerElement.innerHTML = `
                    <div class="${iconClass}"></div>
                    <h4>${info.nome}</h4>
                    <p>${info.descricao}</p>
                    <p><strong>Dano:</strong> ${info.dano}</p>
                    <p><strong>Alcance:</strong> ${info.alcance}</p>
                    <p><strong>Velocidade:</strong> ${info.velocidade}</p>
                    <p><strong>Custo:</strong> $${tower.cost}</p>
                `;
                
                towersCatalog.appendChild(towerElement);
            });
        }
    }
    
    function fillEnemiesCatalog() {
        const basicEnemiesCatalog = document.querySelector('#enemies-catalog .catalog-section:nth-child(1) .catalog-grid');
        if (basicEnemiesCatalog) {
            basicEnemiesCatalog.innerHTML = '';
            
            const basicEnemies = [
                new Enemy(gameInstance.map),
                new FastEnemy(gameInstance.map),
                new StrongEnemy(gameInstance.map),
                new BalancedEnemy(gameInstance.map),
                new GliderEnemy(gameInstance.map)
            ];
            
            basicEnemies.forEach(enemy => {
                basicEnemiesCatalog.appendChild(createEnemyElement(enemy));
            });
        }
        
        const advancedEnemiesCatalog = document.querySelector('#enemies-catalog .catalog-section:nth-child(2) .catalog-grid');
        if (advancedEnemiesCatalog) {
            advancedEnemiesCatalog.innerHTML = '';
            
            const advancedEnemies = [
                new SpeedsterEnemy(gameInstance.map),
                new ResistantEnemy(gameInstance.map),
                new FlyingEnemy(gameInstance.map),
                new SuperBalancedEnemy(gameInstance.map),
                new RegeneratingEnemy(gameInstance.map)
            ];
            
            advancedEnemies.forEach(enemy => {
                advancedEnemiesCatalog.appendChild(createEnemyElement(enemy));
            });
        }
        
        const eliteEnemiesCatalog = document.querySelector('#enemies-catalog .catalog-section:nth-child(3) .catalog-grid');
        if (eliteEnemiesCatalog) {
            eliteEnemiesCatalog.innerHTML = '';
            
            const eliteEnemies = [
                new LightningEnemy(gameInstance.map),
                new ToughEnemy(gameInstance.map),
                new GargoyleEnemy(gameInstance.map),
                new SplitterEnemy(gameInstance.map),
                new SemiImmortalEnemy(gameInstance.map),
                new GolemBoss(gameInstance.map),
                new LichBoss(gameInstance.map),
                new DragonBoss(gameInstance.map)
            ];
            
            eliteEnemies.forEach(enemy => {
                eliteEnemiesCatalog.appendChild(createEnemyElement(enemy));
            });
        }
    }
    
    function openCatalog() {
        fillTowersCatalog();
        fillEnemiesCatalog();
        catalogModal.style.display = 'block';
    }
    
    function updateTowerInfoPanel(tower) {
        if (!tower) {
            infoPanel.innerHTML = '<h3>Informações</h3><p>Selecione uma torre para ver detalhes</p>';
            return;
        }
        
        const info = tower.getInfo();
        
        let html = `
            <h3>${info.nome} (Nível ${info.nivel})</h3>
            <p>${info.descricao}</p>
            <div class="tower-stats">
                <p><strong>Dano:</strong> ${info.dano}</p>
                <p><strong>Alcance:</strong> ${info.alcance}</p>
                <p><strong>Velocidade:</strong> ${info.velocidade}</p>
                <p><strong>Melhorias:</strong> ${info.melhorias}</p>
            </div>
        `;
        
        html += `<div class="tower-actions">`;
        
        if (tower.upgradeCount < tower.maxUpgrades) {
            html += `<button id="upgrade-tower-btn">Melhorar ($${tower.upgradeCost})</button>`;
        }
        
        html += `<button id="sell-tower-btn">Vender</button>`;
        html += `</div>`;
        
        infoPanel.innerHTML = html;
        
        const upgradeBtn = document.getElementById('upgrade-tower-btn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                const success = gameInstance.upgradeTower();
                if (success) {
                    updateTowerInfoPanel(gameInstance.selectedTower);
                }
            });
        }
        
        const sellBtn = document.getElementById('sell-tower-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                const success = gameInstance.sellTower();
                if (success) {
                    infoPanel.innerHTML = '<h3>Informações</h3><p>Selecione uma torre para ver detalhes</p>';
                }
            });
        }
    }
    
    function updateTowerSelectionUI(selectedType = null) {
        towerElements.forEach(element => {
            const towerType = element.getAttribute('data-tower');
            if (towerType === selectedType) {
                element.classList.add('selected');
            } else {
                element.classList.remove('selected');
            }
        });
    }
    
    canvas.addEventListener('click', (event) => {
        if (!gameInstance || gameInstance.gameOver) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        const gridPos = gameInstance.map.mouseToGrid(mouseX, mouseY);
        
        if (gameInstance.placingTower) {
            const success = gameInstance.placeTower(gridPos.x, gridPos.y);
            
            if (success) {
                updateTowerSelectionUI();
            }
        } else {
            const tower = gameInstance.selectTower(gridPos.x, gridPos.y);
            
            if (tower) {
                updateTowerInfoPanel(tower);
            } else {
                gameInstance.selectedTower = null;
                infoPanel.innerHTML = '<h3>Informações</h3><p>Selecione uma torre para ver detalhes</p>';
            }
        }
    });
    
    canvas.addEventListener('mousemove', (event) => {
        if (!gameInstance) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        gameInstance.updateMousePosition(mouseX, mouseY);
        
        if (gameInstance.placingTower) {
            const gridPos = gameInstance.map.mouseToGrid(mouseX, mouseY);
            const isValidPosition = gameInstance.map.canPlaceTower(gridPos.x, gridPos.y);
            canvas.style.cursor = isValidPosition ? 'pointer' : 'not-allowed';
        } else {
            canvas.style.cursor = 'default';
        }
    });
    
    canvas.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        
        if (gameInstance && gameInstance.placingTower) {
            gameInstance.placingTower = false;
            gameInstance.selectedTowerType = null;
            canvas.style.cursor = 'default';
            updateTowerSelectionUI();
        }
    });
    
    startWaveBtn.addEventListener('click', () => {
        if (!gameInstance || gameInstance.gameOver || gameInstance.waveActive) return;
        gameInstance.startWave();
    });
    
    resetGameBtn.addEventListener('click', () => {
        if (!gameInstance) return;
        if (confirm('Tem certeza que deseja reiniciar o jogo?')) {
            gameInstance.resetGame();
        }
    });
    
    catalogBtn.addEventListener('click', () => {
        openCatalog();
    });
    
    closeBtn.addEventListener('click', () => {
        catalogModal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === catalogModal) {
            catalogModal.style.display = 'none';
        }
    });
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`${targetTab}-catalog`).classList.add('active');
        });
    });
    
    towerElements.forEach(element => {
        element.addEventListener('click', () => {
            const towerType = element.getAttribute('data-tower');
            const towerCost = gameInstance.getTowerCost(towerType);
            
            if (gameInstance.money >= towerCost) {
                gameInstance.placingTower = true;
                gameInstance.selectedTowerType = towerType;
                updateTowerSelectionUI(towerType);
                canvas.style.cursor = 'crosshair';
            } else {
                alert('Dinheiro insuficiente para esta torre!');
            }
        });
    });
});
