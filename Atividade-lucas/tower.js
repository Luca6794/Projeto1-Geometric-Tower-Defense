/**
 * Towers.js
 * Contém as definições de todas as torres do jogo
 */

// Classe base para todas as torres
class Tower {
    constructor(gridX, gridY, map) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.map = map;
        
        // Posição em pixels
        const pos = map.gridToPixels(gridX, gridY);
        this.x = pos.x;
        this.y = pos.y;
        
        this.size = map.gridSize * 0.8; // Tamanho da torre
        this.range = 120; // Alcance padrão
        this.damage = 10; // Dano padrão
        this.attackSpeed = 1; // Ataques por segundo
        this.lastAttackTime = 0;
        this.attackCooldown = 1000 / this.attackSpeed; // Em milissegundos
        this.level = 1;
        this.upgradeCount = 0;
        this.maxUpgrades = 3;
        this.cost = 100;
        this.upgradeCost = this.cost / 2;
        this.color = '#5cb85c'; // Cor padrão
        this.target = null; // Inimigo alvo atual
        this.projectiles = []; // Projéteis ativos
        this.type = 'Torre';
        this.description = 'Torre básica';
        this.specialEffect = null;
        this.drawRange = true; // Se deve desenhar o alcance da torre
        this.drawRangeTimeout = null;
    }

    /**
     * Atualiza o estado da torre a cada frame
     * @param {number} deltaTime - Tempo desde o último frame em ms
     * @param {Array} enemies - Array de inimigos ativos
     */
    update(deltaTime, enemies) {
        // Atualiza os projéteis existentes
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(deltaTime);
            
            // Remove projéteis que atingiram o alvo ou saíram da tela
            if (projectile.remove) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Verifica se pode atacar
        const now = Date.now();
        if (now - this.lastAttackTime >= this.attackCooldown) {
            this.findTarget(enemies);
            if (this.target) {
                this.attack();
                this.lastAttackTime = now;
            }
        }
    }

    /**
     * Encontra um alvo válido entre os inimigos
     * @param {Array} enemies - Array de inimigos ativos
     */
    findTarget(enemies) {
        this.target = null;
        let highestPathIndex = -1;
        
        for (const enemy of enemies) {
            if (enemy.health <= 0) continue;
            
            const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            
            // Verifica se o inimigo está no alcance da torre
            if (distance <= this.range) {
                // Estratégia: mirar no inimigo mais avançado no caminho
                if (enemy.pathIndex > highestPathIndex) {
                    this.target = enemy;
                    highestPathIndex = enemy.pathIndex;
                }
            }
        }
        
        return this.target;
    }

    /**
     * Realiza um ataque ao alvo atual
     */
    attack() {
        // Cria um novo projétil
        if (this.target) {
            this.projectiles.push(
                new Projectile(
                    this.x,
                    this.y,
                    this.target,
                    this.damage,
                    this.color,
                    this.specialEffect
                )
            );
        }
    }

    /**
     * Aplica uma melhoria à torre
     * @returns {boolean} - Verdadeiro se a melhoria foi aplicada com sucesso
     */
    upgrade() {
        if (this.upgradeCount >= this.maxUpgrades) {
            return false;
        }
        
        this.upgradeCount++;
        this.level++;
        
        // Aumenta os atributos da torre
        this.damage *= 1.3;
        this.range *= 1.1;
        this.attackSpeed *= 1.2;
        this.attackCooldown = 1000 / this.attackSpeed;
        
        // Calcula o novo custo de melhoria
        this.upgradeCost = Math.floor(this.upgradeCost * 1.5);
        
        return true;
    }

    /**
     * Desenha a torre no contexto do canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    draw(ctx) {
        if (this.drawRange) {
            // Desenha o alcance da torre
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.stroke();
        }
        
        // Desenha a torre (um quadrado)
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x - this.size / 2,
            this.y - this.size / 2,
            this.size,
            this.size
        );
        
        // Desenha detalhes específicos da torre
        this.drawDetails(ctx);
        
        // Desenha indicador de nível
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.level, this.x, this.y + 3);
        
        // Desenha projéteis ativos
        for (const projectile of this.projectiles) {
            projectile.draw(ctx);
        }
    }

    /**
     * Desenha detalhes específicos para cada tipo de torre
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    drawDetails(ctx) {
        // Implementado nas subclasses
    }

    /**
     * Mostra temporariamente o alcance da torre
     * @param {number} duration - Duração em milissegundos
     */
    showRange(duration = 2000) {
        this.drawRange = true;
        
        // Limpa qualquer timeout existente
        if (this.drawRangeTimeout) {
            clearTimeout(this.drawRangeTimeout);
        }
        
        // Define um novo timeout para esconder o alcance
        this.drawRangeTimeout = setTimeout(() => {
            this.drawRange = false;
        }, duration);
    }

    /**
     * Retorna informações da torre para exibição
     * @returns {Object} - Objeto com informações da torre
     */
    getInfo() {
        return {
            nome: this.type,
            nivel: this.level,
            dano: this.damage.toFixed(1),
            alcance: this.range.toFixed(0),
            velocidade: this.attackSpeed.toFixed(1) + '/s',
            melhorias: `${this.upgradeCount}/${this.maxUpgrades}`,
            custoMelhoria: this.upgradeCost,
            descricao: this.description
        };
    }
}

// Classe para os projéteis lançados pelas torres
class Projectile {
    constructor(x, y, target, damage, color, specialEffect = null, source = null) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = 300; // Pixels por segundo
        this.size = 5;
        this.color = color;
        this.remove = false;
        this.hit = false;
        this.specialEffect = specialEffect;
        this.source = source; // Tipo da torre que lançou o projétil
    }

    /**
     * Atualiza a posição do projétil
     * @param {number} deltaTime - Tempo desde o último frame em ms
     */
    update(deltaTime) {
        if (this.remove || !this.target) return;
        
        // Se o alvo foi destruído, remove o projétil
        if (this.target.health <= 0) {
            this.remove = true;
            return;
        }
        
        // Calcula a direção para o alvo
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        // Normaliza o vetor de direção
        const vx = dx / distance;
        const vy = dy / distance;
        
        // Movimento do projétil
        const moveDistance = this.speed * (deltaTime / 1000);
        
        // Se o movimento ultrapassa a distância até o alvo, atingimos o alvo
        if (moveDistance >= distance) {
            this.x = this.target.x;
            this.y = this.target.y;
            this.hitTarget();
        } else {
            // Move o projétil em direção ao alvo
            this.x += vx * moveDistance;
            this.y += vy * moveDistance;
        }
    }

    /**
     * Lógica quando o projétil atinge o alvo
     */
    hitTarget() {
        if (!this.hit && this.target) {
            this.hit = true;
            this.remove = true;
            
            // Aplica dano ao inimigo
            this.target.takeDamage(this.damage);
            
            // Aplica efeito especial, se houver
            if (this.specialEffect && typeof this.specialEffect === 'function') {
                this.specialEffect(this.target);
            }
        }
    }

    /**
     * Desenha o projétil no contexto do canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

// Torre Arqueiro - Ataque rápido, dano baixo
class ArcherTower extends Tower {
    constructor(gridX, gridY, map) {
        super(gridX, gridY, map);
        this.type = 'Arqueiro';
        this.description = 'Ataque rápido, dano baixo';
        this.color = '#5cb85c';
        this.damage = 8;
        this.range = 150;
        this.attackSpeed = 2;
        this.attackCooldown = 1000 / this.attackSpeed;
        this.cost = 100;
        this.upgradeCost = 50;
    }

    drawDetails(ctx) {
        // Desenha um arco e flecha estilizado
        ctx.fillStyle = '#2b542c';
        ctx.fillRect(
            this.x - 2,
            this.y - this.size / 2 + 5,
            4,
            this.size - 10
        );
    }
}

// Torre Canhão - Dano em área, mais lento
class CannonTower extends Tower {
    constructor(gridX, gridY, map) {
        super(gridX, gridY, map);
        this.type = 'Canhão';
        this.description = 'Dano em área, ataque lento';
        this.color = '#d9534f';
        this.damage = 20;
        this.splashRadius = 50;
        this.range = 120;
        this.attackSpeed = 0.8;
        this.attackCooldown = 1000 / this.attackSpeed;
        this.cost = 200;
        this.upgradeCost = 100;
        
        // Função de efeito especial: dano em área
        this.specialEffect = (target) => {
            // Pega todos os inimigos próximos ao alvo
            const enemies = window.gameInstance.enemies;
            for (const enemy of enemies) {
                if (enemy !== target && enemy.health > 0) {
                    const distance = Math.hypot(enemy.x - target.x, enemy.y - target.y);
                    if (distance <= this.splashRadius) {
                        // Aplica dano reduzido aos inimigos próximos
                        enemy.takeDamage(this.damage * 0.5, 'canhao');
                    }
                }
            }
        };
    }

    drawDetails(ctx) {
        // Desenha o cano do canhão
        ctx.fillStyle = '#761c19';
        ctx.fillRect(
            this.x - this.size / 2 + 5,
            this.y - 5,
            this.size - 10,
            10
        );
    }

    attack() {
        // Sobreescreve o método de ataque para usar projéteis maiores
        if (this.target) {
            const projectile = new Projectile(
                this.x,
                this.y,
                this.target,
                this.damage,
                this.color,
                this.specialEffect,
                'canhao' // Identifica o tipo de ataque
            );
            projectile.size = 8; // Projétil maior
            this.projectiles.push(projectile);
        }
    }
}

// Torre Sniper - Dano alto, alcance longo, ataque lento
class SniperTower extends Tower {
    constructor(gridX, gridY, map) {
        super(gridX, gridY, map);
        this.type = 'Sniper';
        this.description = 'Dano alto, alcance longo, ataque lento';
        this.color = '#337ab7';
        this.damage = 60;
        this.range = 250;
        this.attackSpeed = 0.3;
        this.attackCooldown = 1000 / this.attackSpeed;
        this.cost = 250;
        this.upgradeCost = 125;
    }

    drawDetails(ctx) {
        // Desenha o cano do sniper
        ctx.fillStyle = '#1b4770';
        ctx.fillRect(
            this.x - 2,
            this.y - this.size / 2,
            4,
            this.size
        );
    }

    findTarget(enemies) {
        // Sobreescreve para mirar no inimigo com mais vida
        this.target = null;
        let highestHealth = 0;
        
        for (const enemy of enemies) {
            if (enemy.health <= 0) continue;
            
            const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            
            if (distance <= this.range && enemy.health > highestHealth) {
                this.target = enemy;
                highestHealth = enemy.health;
            }
        }
        
        return this.target;
    }
}

// Torre de Gelo - Reduz a velocidade dos inimigos
class IceTower extends Tower {
    constructor(gridX, gridY, map) {
        super(gridX, gridY, map);
        this.type = 'Gelo';
        this.description = 'Reduz a velocidade dos inimigos';
        this.color = '#5bc0de';
        this.damage = 10;
        this.range = 120;
        this.attackSpeed = 1.2;
        this.attackCooldown = 1000 / this.attackSpeed;
        this.slowFactor = 0.6; // Reduz velocidade para 60%
        this.slowDuration = 2000; // 2 segundos
        this.cost = 150;
        this.upgradeCost = 75;
        
        // Função de efeito especial: redução de velocidade
        this.specialEffect = (target) => {
            target.slow(this.slowFactor, this.slowDuration);
        };
    }

    drawDetails(ctx) {
        // Desenha um círculo branco no centro
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 3, 0, Math.PI * 2);
        ctx.fill();
    }

    update(deltaTime, enemies) {
        super.update(deltaTime, enemies);
        
        // Efeito de aura: reduz velocidade de todos os inimigos no alcance
        for (const enemy of enemies) {
            if (enemy.health <= 0) continue;
            
            const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            
            if (distance <= this.range) {
                // Aplica uma redução de velocidade leve mesmo sem atacar diretamente
                enemy.slow(Math.sqrt(this.slowFactor), 500);
            }
        }
    }
}

// Torre de Veneno - Causa dano ao longo do tempo
class PoisonTower extends Tower {
    constructor(gridX, gridY, map) {
        super(gridX, gridY, map);
        this.type = 'Veneno';
        this.description = 'Causa dano ao longo do tempo';
        this.color = '#9c27b0';
        this.damage = 3;
        this.range = 130;
        this.attackSpeed = 1.3;
        this.attackCooldown = 1000 / this.attackSpeed;
        this.poisonDamage = 6; // Dano por tick
        this.poisonDuration = 4000; // 4 segundos
        this.cost = 180;
        this.upgradeCost = 90;
        
        // Função de efeito especial: envenenamento
        this.specialEffect = (target) => {
            target.poison(this.poisonDamage, this.poisonDuration);
        };
    }

    drawDetails(ctx) {
        // Desenha um losango no centro
        ctx.fillStyle = '#6a0080';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size / 4);
        ctx.lineTo(this.x + this.size / 4, this.y);
        ctx.lineTo(this.x, this.y + this.size / 4);
        ctx.lineTo(this.x - this.size / 4, this.y);
        ctx.closePath();
        ctx.fill();
    }
}

// Torre Balista - Atravessa múltiplos inimigos
class BallistaTower extends Tower {
    constructor(gridX, gridY, map) {
        super(gridX, gridY, map);
        this.type = 'Balista';
        this.description = 'Atravessa múltiplos inimigos com alto dano';
        this.color = '#ff9800';
        this.damage = 100.0;
        this.range = 200;
        this.attackSpeed = 0.5;
        this.attackCooldown = 1000 / this.attackSpeed;
        this.pierceCount = 3; // Número de inimigos que o projétil atravessa
        this.cost = 500;
        this.upgradeCost = 250;
    }

    drawDetails(ctx) {
        // Desenha o mecanismo da balista
        ctx.fillStyle = '#b26a00';
        ctx.fillRect(
            this.x - this.size / 2 + 5,
            this.y - 7,
            this.size - 10,
            4
        );
        ctx.fillRect(
            this.x - this.size / 2 + 5,
            this.y + 3,
            this.size - 10,
            4
        );
    }

    attack() {
        // Sobreescreve o método de ataque para implementar o atravessamento
        if (this.target) {
            // Cria um projétil normal, mas com um efeito especial que atravessa inimigos
            const projectile = new Projectile(
                this.x,
                this.y,
                this.target,
                this.damage,
                this.color,
                // Função de efeito especial para simular atravessamento
                (target) => {
                    // Implementação do efeito de atravessar
                    const hitEnemy = target;
                    
                    // Encontra inimigos próximos na mesma direção
                    const dirX = hitEnemy.x - this.x;
                    const dirY = hitEnemy.y - this.y;
                    const angle = Math.atan2(dirY, dirX);
                    
                    let hitCount = 1; // Já acertou um inimigo (o alvo principal)
                    
                    // Procura por mais inimigos para atravessar
                    for (const enemy of window.gameInstance.enemies) {
                        if (enemy === hitEnemy || enemy.health <= 0) continue;
                        
                        // Verifica se está dentro do alcance
                        const distToEnemy = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                        if (distToEnemy > this.range) continue;
                        
                        // Verifica se está aproximadamente na mesma direção
                        const enemyAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                        const angleDiff = Math.abs(enemyAngle - angle);
                        
                        if (angleDiff < 0.3 || angleDiff > Math.PI * 2 - 0.3) {
                            enemy.takeDamage(this.damage, 'balista');
                            hitCount++;
                            
                            // Limita o número de inimigos atingidos
                            if (hitCount >= this.pierceCount) break;
                        }
                    }
                }
            );
            
            // Aumenta o tamanho do projétil
            projectile.size = 8;
            
            this.projectiles.push(projectile);
        }
    }
}

// Projétil especial que atravessa múltiplos inimigos
class PierceProjectile extends Projectile {
    constructor(x, y, dirX, dirY, damage, color, pierceCount, maxDistance) {
        super(x, y, null, damage, color);
        this.dirX = dirX;
        this.dirY = dirY;
        this.pierceCount = pierceCount;
        this.maxDistance = maxDistance;
        this.distanceTraveled = 0;
        this.hitEnemies = new Set(); // Rastreia inimigos já atingidos
    }

    update(deltaTime) {
        if (this.remove) return;
        
        // Move o projétil na direção estabelecida
        const moveDistance = this.speed * (deltaTime / 1000);
        this.x += this.dirX * moveDistance;
        this.y += this.dirY * moveDistance;
        this.distanceTraveled += moveDistance;
        
        // Verifica colisão com inimigos
        const enemies = window.gameInstance.enemies;
        for (const enemy of enemies) {
            if (enemy.health <= 0 || this.hitEnemies.has(enemy.id)) continue;
            
            const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (distance <= enemy.size / 2 + this.size) {
                // Aplica dano ao inimigo
                enemy.takeDamage(this.damage);
                this.hitEnemies.add(enemy.id);
                this.pierceCount--;
                
                // Verifica se ainda pode atravessar mais inimigos
                if (this.pierceCount <= 0) {
                    this.remove = true;
                    break;
                }
            }
        }
        
        // Remove o projétil se ultrapassou a distância máxima
        if (this.distanceTraveled >= this.maxDistance) {
            this.remove = true;
        }
    }

    // Desenha uma linha para representar o projétil atravessando
    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x - this.dirX * this.size * 2, this.y - this.dirY * this.size * 2);
        ctx.lineTo(this.x + this.dirX * this.size * 2, this.y + this.dirY * this.size * 2);
        ctx.lineWidth = this.size;
        ctx.strokeStyle = this.color;
        ctx.stroke();
        
        // Desenha a ponta do projétil
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

// Exporta as classes para uso global
window.Tower = Tower;
window.Projectile = Projectile;
window.ArcherTower = ArcherTower;
window.CannonTower = CannonTower;
window.SniperTower = SniperTower;
window.IceTower = IceTower;
window.PoisonTower = PoisonTower;
window.BallistaTower = BallistaTower;
