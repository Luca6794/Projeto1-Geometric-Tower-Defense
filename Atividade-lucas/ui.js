/**
 * UI.js
 * Gerencia a interação do usuário com o jogo
 * Controla a interface, eventos e catálogo
 */

// Cria uma instância do jogo
let gameInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa o jogo
    gameInstance = new Game();
    
    // Referência ao jogo
    const game = window.game;
    
    // Elementos da interface
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
    
    // Função para criar um elemento de inimigo no catálogo
    function createEnemyElement(enemy) {
        const info = enemy.getInfo();
        
        const enemyElement = document.createElement('div');
        enemyElement.className = 'catalog-item';
        
        // Cria um mini canvas para desenhar o inimigo
        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        
        // Posiciona o inimigo no centro do canvas
        enemy.x = 30;
        enemy.y = 30;
        enemy.draw(ctx);
        
        enemyElement.appendChild(canvas);
        enemyElement.innerHTML += `
            <h4>${info.nome}</h4>
            <p>${info.descricao}</p>
            <p><strong>Vida:</strong> ${info.vida}</p>
            <p><strong>Velocidade:</strong> ${info.velocidade}</p>
            <p><strong>Recompensa:</strong> $${info.recompensa}</p>
            <p><strong>Dano:</strong> ${info.dano}</p>
        `;
        
        return enemyElement;
    }
    
    /**
     * Preenche o catálogo de torres com informações
     */
    function fillTowersCatalog() {
        const towersCatalog = document.querySelector('#towers-catalog .catalog-grid');
        if (towersCatalog) {
            towersCatalog.innerHTML = '';
            
            // Informações de torres disponíveis
            const towers = [
                new ArcherTower(0, 0, game.map),
                new CannonTower(0, 0, game.map),
                new SniperTower(0, 0, game.map),
                new IceTower(0, 0, game.map),
                new PoisonTower(0, 0, game.map),
                new BallistaTower(0, 0, game.map)
            ];
            
            // Criar elementos para cada torre
            towers.forEach(tower => {
                const info = tower.getInfo();
                const towerType = game.getTowerTypeFromInstance(tower);
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
    
    /**
     * Preenche o catálogo de inimigos com informações
     */
    function fillEnemiesCatalog() {
        // Preenche os inimigos básicos
        const basicEnemiesCatalog = document.querySelector('#enemies-catalog .catalog-section:nth-child(1) .catalog-grid');
        if (basicEnemiesCatalog) {
            basicEnemiesCatalog.innerHTML = '';
            
            const basicEnemies = [
                new FastEnemy(game.map),
                new StrongEnemy(game.map),
                new BalancedEnemy(game.map),
                new GliderEnemy(game.map)
            ];
            
            // Adiciona os inimigos à seção
            basicEnemies.forEach(enemy => {
                basicEnemiesCatalog.appendChild(createEnemyElement(enemy));
            });
        }
        
        // Preenche os inimigos avançados
        const advancedEnemiesCatalog = document.querySelector('#enemies-catalog .catalog-section:nth-child(2) .catalog-grid');
        if (advancedEnemiesCatalog) {
            advancedEnemiesCatalog.innerHTML = '';
            
            const advancedEnemies = [
                new SpeedsterEnemy(game.map),
                new ResistantEnemy(game.map),
                new FlyingEnemy(game.map),
                new SuperBalancedEnemy(game.map),
                new RegeneratingEnemy(game.map)
            ];
            
            // Adiciona os inimigos à seção
            advancedEnemies.forEach(enemy => {
                advancedEnemiesCatalog.appendChild(createEnemyElement(enemy));
            });
        }
        
        // Preenche os inimigos elite
        const eliteEnemiesCatalog = document.querySelector('#enemies-catalog .catalog-section:nth-child(3) .catalog-grid');
        if (eliteEnemiesCatalog) {
            eliteEnemiesCatalog.innerHTML = '';
            
            const eliteEnemies = [
                new LightningEnemy(game.map),
                new ToughEnemy(game.map),
                new GargoyleEnemy(game.map),
                new SplitterEnemy(game.map),
                new SemiImmortalEnemy(game.map)
            ];
            
            // Adiciona os inimigos à seção
            eliteEnemies.forEach(enemy => {
                eliteEnemiesCatalog.appendChild(createEnemyElement(enemy));
            });
        }
    }
    
    /**
     * Abre o catálogo e preenche com informações
     */
    function openCatalog() {
        // Preenche o catálogo de torres
        fillTowersCatalog();
        
        // Preenche o catálogo de inimigos
        fillEnemiesCatalog();
        
        // Exibe o modal
        catalogModal.style.display = 'block';
    }
    
    /**
     * Atualiza o painel de informações da torre
     * @param {Tower} tower - Torre selecionada
     */
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
        
        // Adiciona botões de melhoria e venda se tiver mais melhorias disponíveis
        html += `<div class="tower-actions">`;
        
        if (tower.upgradeCount < tower.maxUpgrades) {
            html += `<button id="upgrade-tower-btn">Melhorar ($${tower.upgradeCost})</button>`;
        }
        
        html += `<button id="sell-tower-btn">Vender</button>`;
        html += `</div>`;
        
        infoPanel.innerHTML = html;
        
        // Adiciona eventos aos botões
        const upgradeBtn = document.getElementById('upgrade-tower-btn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                const success = game.upgradeTower();
                if (success) {
                    updateTowerInfoPanel(game.selectedTower);
                }
            });
        }
        
        const sellBtn = document.getElementById('sell-tower-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                const success = game.sellTower();
                if (success) {
                    infoPanel.innerHTML = '<h3>Informações</h3><p>Selecione uma torre para ver detalhes</p>';
                }
            });
        }
    }
    
    /**
     * Atualiza a interface de seleção de torre
     * @param {string} selectedType - Tipo da torre selecionada
     */
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
    
    // Inicializa eventos do canvas
    
    // Clique no canvas para colocar torre ou selecionar torre existente
    canvas.addEventListener('click', (event) => {
        if (!game || game.gameOver) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        const gridPos = game.map.mouseToGrid(mouseX, mouseY);
        
        if (game.placingTower) {
            // Tenta colocar uma torre
            const success = game.placeTower(gridPos.x, gridPos.y);
            
            if (success) {
                // Continua no modo de colocação para colocar mais torres
                updateTowerSelectionUI();
            }
        } else {
            // Tenta selecionar uma torre existente
            const tower = game.selectTower(gridPos.x, gridPos.y);
            
            if (tower) {
                updateTowerInfoPanel(tower);
            } else {
                // Limpa a seleção se clicou em um espaço vazio
                game.selectedTower = null;
                infoPanel.innerHTML = '<h3>Informações</h3><p>Selecione uma torre para ver detalhes</p>';
            }
        }
    });
    
    // Atualiza a posição do mouse para pré-visualização da torre
    canvas.addEventListener('mousemove', (event) => {
        if (!game) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        game.updateMousePosition(mouseX, mouseY);
        
        // Atualiza o cursor
        if (game.placingTower) {
            const gridPos = game.map.mouseToGrid(mouseX, mouseY);
            const isValidPosition = game.map.canPlaceTower(gridPos.x, gridPos.y);
            canvas.style.cursor = isValidPosition ? 'pointer' : 'not-allowed';
        } else {
            canvas.style.cursor = 'default';
        }
    });
    
    // Cancela a colocação de torre com o botão direito
    canvas.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        
        if (game && game.placingTower) {
            game.placingTower = false;
            game.selectedTowerType = null;
            canvas.style.cursor = 'default';
            updateTowerSelectionUI();
        }
    });
    
    // Eventos dos botões principais
    
    // Inicia uma nova wave
    startWaveBtn.addEventListener('click', () => {
        if (!game || game.gameOver || game.waveActive) return;
        game.startWave();
    });
    
    // Reinicia o jogo
    resetGameBtn.addEventListener('click', () => {
        if (!game) return;
        if (confirm('Tem certeza que deseja reiniciar o jogo?')) {
            game.resetGame();
        }
    });
    
    // Abre o catálogo
    catalogBtn.addEventListener('click', () => {
        openCatalog();
    });
    
    // Fecha o catálogo
    closeBtn.addEventListener('click', () => {
        catalogModal.style.display = 'none';
    });
    
    // Fecha o catálogo ao clicar fora
    window.addEventListener('click', (event) => {
        if (event.target === catalogModal) {
            catalogModal.style.display = 'none';
        }
    });
    
    // Alternância entre abas do catálogo
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Atualiza botões
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Atualiza conteúdo
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${targetTab}-catalog`).classList.add('active');
        });
    });
    
    // Seleciona uma torre para colocar
    towerElements.forEach(element => {
        element.addEventListener('click', () => {
            if (!game || game.gameOver || game.waveActive) return;
            
            const towerType = element.getAttribute('data-tower');
            const towerCost = game.getTowerCost(towerType);
            
            // Verifica se tem dinheiro suficiente
            if (game.money < towerCost) {
                alert('Dinheiro insuficiente para construir esta torre!');
                return;
            }
            
            game.setTowerType(towerType);
            updateTowerSelectionUI(towerType);
        });
    });
    
    // Inicialização da interface
    updateTowerSelectionUI();
});
