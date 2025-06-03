// Interface do usuário para o Geometric Tower Defense
let gameInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    // Aguarda a criação da instância do jogo
    setTimeout(() => {
        gameInstance = window.gameInstance;
        if (gameInstance) {
            initializeUI();
        }
    }, 100);
});

function initializeUI() {
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
    
    // Função para criar elementos de inimigo no catálogo
    function createEnemyElement(enemy) {
        const info = enemy.getInfo();
        
        const enemyElement = document.createElement('div');
        enemyElement.className = 'catalog-item';
        
        // Canvas para desenhar o inimigo
        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 60;
        canvas.className = 'catalog-icon';
        const ctx = canvas.getContext('2d');
        
        // Fundo do canvas
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, 60, 60);
        
        // Posiciona o inimigo no centro
        enemy.x = 30;
        enemy.y = 30;
        
        // Reduz o tamanho para caber no ícone
        const originalSize = enemy.size;
        enemy.size = Math.min(originalSize, 12);
        
        enemy.draw(ctx);
        
        // Restaura o tamanho original
        enemy.size = originalSize;
        
        enemyElement.appendChild(canvas);
        
        // Informações do inimigo
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
    
    // Função para preencher o catálogo de torres
    function fillTowersCatalog() {
        const towersCatalog = document.querySelector('#towers-catalog .catalog-grid');
        if (!towersCatalog || !gameInstance) return;
        
        towersCatalog.innerHTML = '';
        
        // Cria instâncias temporárias das torres para obter informações
        const towers = [
            new ArcherTower(0, 0, gameInstance.map),
            new IceTower(0, 0, gameInstance.map),
            new PoisonTower(0, 0, gameInstance.map),
            new GladiatorTower(0, 0, gameInstance.map),
            new CannonTower(0, 0, gameInstance.map),
            new SniperTower(0, 0, gameInstance.map),
            new BallistaTower(0, 0, gameInstance.map)
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
                <p><strong>Max Upgrades:</strong> ${tower.maxUpgrades}</p>
            `;
            
            towersCatalog.appendChild(towerElement);
        });
    }
    
    // Função para preencher o catálogo de inimigos
    function fillEnemiesCatalog() {
        if (!gameInstance) return;
        
        // Inimigos básicos
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
        
        // Inimigos avançados
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
        
        // Inimigos de elite
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
    
    // Função para abrir o catálogo
    function openCatalog() {
        fillTowersCatalog();
        fillEnemiesCatalog();
        catalogModal.style.display = 'block';
    }
    
    // Função para atualizar o painel de informações da torre
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
        
        // Botões de ação
        html += `<div class="tower-actions">`;
        
        if (tower.upgradeCount < tower.maxUpgrades) {
            const canAfford = gameInstance.money >= tower.upgradeCost;
            const disabledClass = canAfford ? '' : 'disabled';
            html += `<button id="upgrade-tower-btn" ${!canAfford ? 'disabled' : ''} class="${disabledClass}">
                        Melhorar ($${tower.upgradeCost})
                     </button>`;
        } else {
            html += `<p><em>Torre completamente melhorada!</em></p>`;
        }
        
        const sellPrice = Math.floor(tower.cost * 0.7);
        html += `<button id="sell-tower-btn">Vender ($${sellPrice})</button>`;
        html += `</div>`;
        
        infoPanel.innerHTML = html;
        
        // Adiciona event listeners aos botões
        const upgradeBtn = document.getElementById('upgrade-tower-btn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                const success = gameInstance.upgradeTower();
                if (success) {
                    updateTowerInfoPanel(gameInstance.selectedTower);
                } else {
                    alert('Não foi possível melhorar a torre. Verifique se você tem dinheiro suficiente.');
                }
            });
        }
        
        const sellBtn = document.getElementById('sell-tower-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                if (confirm('Tem certeza que deseja vender esta torre?')) {
                    const success = gameInstance.sellTower();
                    if (success) {
                        infoPanel.innerHTML = '<h3>Informações</h3><p>Selecione uma torre para ver detalhes</p>';
                    }
                }
            });
        }
    }
    
    // Função para atualizar a interface de seleção de torres
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
    
    // Event listeners do canvas
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
            } else {
                // Feedback visual de erro
                const towerCost = gameInstance.getTowerCost(gameInstance.selectedTowerType);
                if (gameInstance.money < towerCost) {
                    alert(`Dinheiro insuficiente! Você precisa de $${towerCost} mas tem apenas $${gameInstance.money}.`);
                } else if (!gameInstance.map.canPlaceTower(gridPos.x, gridPos.y)) {
                    alert('Não é possível colocar uma torre nesta posição!');
                }
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
            const towerCost = gameInstance.getTowerCost(gameInstance.selectedTowerType);
            const canAfford = gameInstance.money >= towerCost;
            
            canvas.style.cursor = (isValidPosition && canAfford) ? 'pointer' : 'not-allowed';
        } else {
            canvas.style.cursor = 'default';
        }
    });
    
    // Botão direito para cancelar colocação de torre
    canvas.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        
        if (gameInstance && gameInstance.placingTower) {
            gameInstance.placingTower = false;
            gameInstance.selectedTowerType = null;
            canvas.style.cursor = 'default';
            updateTowerSelectionUI();
        }
    });
    
    // Event listeners dos botões principais
    if (startWaveBtn) {
        startWaveBtn.addEventListener('click', () => {
            if (!gameInstance || gameInstance.gameOver || gameInstance.waveActive) return;
            gameInstance.startWave();
        });
    }
    
    if (resetGameBtn) {
        resetGameBtn.addEventListener('click', () => {
            if (!gameInstance) return;
            if (confirm('Tem certeza que deseja reiniciar o jogo? Todo o progresso será perdido.')) {
                gameInstance.resetGame();
                updateTowerSelectionUI();
            }
        });
    }
    
    if (catalogBtn) {
        catalogBtn.addEventListener('click', () => {
            openCatalog();
        });
    }
    
    // Event listeners do modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            catalogModal.style.display = 'none';
        });
    }
    
    // Fecha modal clicando fora
    window.addEventListener('click', (event) => {
        if (event.target === catalogModal) {
            catalogModal.style.display = 'none';
        }
    });
    
    // Event listeners das abas do catálogo
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            const targetContent = document.getElementById(`${targetTab}-catalog`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
    
    // Event listeners das torres (organizadas por preço crescente)
    towerElements.forEach(element => {
        element.addEventListener('click', () => {
            if (element.classList.contains('disabled')) {
                const towerType = element.getAttribute('data-tower');
                const towerCost = gameInstance.getTowerCost(towerType);
                alert(`Dinheiro insuficiente! Esta torre custa $${towerCost} mas você tem apenas $${gameInstance.money}.`);
                return;
            }
            
            const towerType = element.getAttribute('data-tower');
            const towerCost = gameInstance.getTowerCost(towerType);
            
            if (gameInstance.money >= towerCost) {
                // Cancela colocação anterior se houver
                if (gameInstance.placingTower) {
                    gameInstance.placingTower = false;
                    gameInstance.selectedTowerType = null;
                }
                
                gameInstance.placingTower = true;
                gameInstance.selectedTowerType = towerType;
                updateTowerSelectionUI(towerType);
                canvas.style.cursor = 'crosshair';
            }
        });
        
        // Hover effect para mostrar informações da torre
        element.addEventListener('mouseenter', () => {
            if (gameInstance && !gameInstance.placingTower) {
                const towerType = element.getAttribute('data-tower');
                const tower = gameInstance.createTower(towerType, 0, 0);
                if (tower) {
                    const info = tower.getInfo();
                    element.title = `${info.nome}\n${info.descricao}\nDano: ${info.dano}\nAlcance: ${info.alcance}\nVelocidade: ${info.velocidade}\nCusto: $${tower.cost}`;
                }
            }
        });
    });
    
    // Teclas de atalho
    document.addEventListener('keydown', (event) => {
        if (!gameInstance) return;
        
        switch (event.key.toLowerCase()) {
            case 'escape':
                if (gameInstance.placingTower) {
                    gameInstance.placingTower = false;
                    gameInstance.selectedTowerType = null;
                    canvas.style.cursor = 'default';
                    updateTowerSelectionUI();
                }
                break;
            case ' ':
                event.preventDefault();
                if (!gameInstance.waveActive && !gameInstance.gameOver) {
                    gameInstance.startWave();
                }
                break;
            case 'r':
                if (event.ctrlKey) {
                    event.preventDefault();
                    if (confirm('Tem certeza que deseja reiniciar o jogo?')) {
                        gameInstance.resetGame();
                        updateTowerSelectionUI();
                    }
                }
                break;
            case 'c':
                openCatalog();
                break;
            // Atalhos numéricos para torres (organizadas por preço)
            case '1':
                document.querySelector('[data-tower="arqueiro"]')?.click();
                break;
            case '2':
                document.querySelector('[data-tower="gelo"]')?.click();
                break;
            case '3':
                document.querySelector('[data-tower="veneno"]')?.click();
                break;
            case '4':
                document.querySelector('[data-tower="gladiador"]')?.click();
                break;
            case '5':
                document.querySelector('[data-tower="canhao"]')?.click();
                break;
            case '6':
                document.querySelector('[data-tower="sniper"]')?.click();
                break;
            case '7':
                document.querySelector('[data-tower="balista"]')?.click();
                break;
        }
    });
    
    // Atualização periódica da UI
    setInterval(() => {
        if (gameInstance) {
            gameInstance.updateUI();
            
            // Atualiza o painel de informações se uma torre estiver selecionada
            if (gameInstance.selectedTower) {
                updateTowerInfoPanel(gameInstance.selectedTower);
            }
        }
    }, 100);
    
    console.log('Interface do usuário inicializada com sucesso!');
    console.log('Atalhos disponíveis:');
    console.log('- ESC: Cancelar colocação de torre');
    console.log('- ESPAÇO: Iniciar wave');
    console.log('- Ctrl+R: Reiniciar jogo');
    console.log('- C: Abrir catálogo');
    console.log('- 1-7: Selecionar torres por preço (1=mais barata, 7=mais cara)');
}

// Função de utilidade para feedback visual
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Animação de entrada
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove após 3 segundos
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Exporta funções úteis
window.showToast = showToast;
window.updateTowerSelectionUI = updateTowerSelectionUI;
