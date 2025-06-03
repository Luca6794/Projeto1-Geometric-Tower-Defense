class Tower {
    constructor(gridX, gridY, map) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.map = map;
        
        const pos = map.gridToPixels(gridX, gridY);
        this.x = pos.x;
        this.y = pos.y;
        
        this.size = map.gridSize * 0.8;
        this.range = 120;
        this.damage = 10;
        this.attackSpeed = 1;
        this.lastAttackTime = 0;
        this.attackCooldown = 1000 / this.attackSpeed;
        this.level = 1;
        this.upgradeCount = 0;
        this.maxUpgrades = 5; // Limitado a 5 níveis máximo
        this.cost = 100;
        this.upgradeCost = this.cost; // Custo de upgrade aumentado
        this.color = '#5cb85c';
        this.target = null;
        this.projectiles = [];
        this.type = 'Torre';
        this.description = 'Torre básica';
        this.specialEffect = null;
        this.drawRange = false;
        this.drawRangeTimeout = null;
    }

    update(deltaTime, enemies) {
        // Atualiza projéteis
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(deltaTime);
            
            if (projectile.remove) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Sistema de ataque
        const now = Date.now();
        if (now - this.lastAttackTime >= this.attackCooldown) {
            this.findTarget(enemies);
            if (this.target) {
                this.attack();
                this.lastAttackTime = now;
            }
        }
    }

    findTarget(enemies) {
        this.target = null;
        let highestProgress = -1;
        
        for (const enemy of enemies) {
            if (enemy.health <= 0) continue;
            
            const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            
            if (distance <= this.range) {
                // Prioriza inimigos mais próximos da saída
                if (enemy.pathIndex > highestProgress) {
                    this.target = enemy;
                    highestProgress = enemy.pathIndex;
                }
            }
        }
        
        return this.target;
    }

    attack() {
        if (this.target) {
            this.projectiles.push(
                new Projectile(
                    this.x,
                    this.y,
                    this.target,
                    this.damage,
                    this.color,
                    this.specialEffect,
                    this.getSourceType()
                )
            );
        }
    }
    
    getSourceType() {
        return 'torre';
    }

    upgrade() {
        if (this.upgradeCount >= this.maxUpgrades) {
            return false;
        }
        
        this.upgradeCount++;
        this.level++;
        
        // Melhorias balanceadas
        this.damage *= 1.3;
        this.range *= 1.1;
        this.attackSpeed *= 1.2;
        this.attackCooldown = 1000 / this.attackSpeed;
        
        // Custo de upgrade aumentado significativamente
        this.upgradeCost = Math.floor(this.upgradeCost * 2);
        
        return true;
    }

    draw(ctx) {
        // Desenha alcance se selecionado
        if (this.drawRange) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.stroke();
        }
        
        // Torre principal
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x - this.size / 2,
            this.y - this.size / 2,
            this.size,
            this.size
        );
        
        this.drawDetails(ctx);
        
        // Nível da torre
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.level, this.x, this.y + 3);
        
        // Desenha projéteis
        for (const projectile of this.projectiles) {
            projectile.draw(ctx);
        }
    }

    drawDetails(ctx) {
        // Implementado pelas subclasses
    }

    showRange(duration = 2000) {
        this.drawRange = true;
        
        if (this.drawRangeTimeout) {
            clearTimeout(this.drawRangeTimeout);
        }
        
        this.drawRangeTimeout = setTimeout(() => {
            this.drawRange = false;
        }, duration);
    }

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

class Projectile {
    constructor(x, y, target, damage, color, specialEffect = null, source = null) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = 400;
        this.size = 5;
        this.color = color;
        this.remove = false;
        this.hit = false;
        this.specialEffect = specialEffect;
        this.source = source;
    }

    update(deltaTime) {
        if (this.remove || !this.target) return;
        
        if (this.target.health <= 0) {
            this.remove = true;
            return;
        }
        
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        const vx = dx / distance;
        const vy = dy / distance;
        
        const moveDistance = this.speed * (deltaTime / 1000);
        
        if (moveDistance >= distance) {
            this.x = this.target.x;
            this.y = this.target.y;
            this.hitTarget();
        } else {
            this.x += vx * moveDistance;
            this.y += vy * moveDistance;
        }
    }

    hitTarget() {
        if (!this.hit && this.target) {
            this.hit = true;
            this.remove = true;
            
            this.target.takeDamage(this.damage, this.source);
            
            if (this.specialEffect && typeof this.specialEffect === 'function') {
                this.specialEffect(this.target);
            }
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

// Torres específicas organizadas por preço crescente

class ArcherTower extends Tower {
    constructor(gridX, gridY, map) {
        super(gridX, gridY, map);
        this.type = 'Arqueiro';
        this.description = 'Ataque equilibrado, dano moderado';
        this.color = '#5cb85c';
        this.damage = 15;
        this.range = 140;
        this.attackSpeed = 1.5;
        this.attackCooldown = 1000 / this.attackSpeed;
        this.cost = 80;
        this.upgradeCost = 80;
    }

    getSourceType() {
        return 'arqueiro';
    }

    drawDetails(ctx) {
        ctx.fillStyle = '#2b542c';
        ctx.fillRect(
            this.x - 2,
            this.y - this.size / 2 + 5,
            4,
            this.size - 10
        );
    }
}

class IceTower extends Tower {
    constructor(gridX, gridY, map) {
        super(gridX, gridY, map);
        this.type = 'Gelo';
        this.description = 'Congela inimigos, reduz velocidade drasticamente';
        this.color = '#5bc0de';
        this.damage = 8;
        this.range = 110;
        this.attackSpeed = 1.2;
        this.attackCooldown = 1000 / this.attackSpeed;
        this.cost = 120;
        this.upgradeCost = 120;
        this.slowEffect = 0.7;
        this.slowDuration = 3000;
        
        this.specialEffect = (target) => {
            target.applySlowEffect(this.slowEffect, this.slowDuration);
        };
    }

    upgrade() {
        const upgraded = super.upgrade();
        if (upgraded) {
            this.slowEffect = Math.max(0.3, this.slowEffect - 0.1);
            this.slowDuration += 500;
        }
        return upgraded;
    }

    getSourceType() {
        return 'gelo';
    }

    drawDetails(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

class PoisonTower extends Tower {
    constructor(gridX, gridY, map) {
        super(gridX, gridY, map);
        this.type = 'Veneno';
        this.description = 'Veneno letal que causa dano por segundo';
        this.color = '#9c27b0';
        this.damage = 5;
        this.range = 115;
        this.attackSpeed = 1.1;
        this.attackCooldown = 1000 / this.attackSpeed;
        this.cost = 150;
        this.upgradeCost = 150;
        this.poisonDamage = 20;
        this.poisonDuration = 5000;
        
        this.specialEffect = (target) => {
            target.applyPoisonEffect(this.poisonDamage, this.poisonDuration);
        };
    }

    upgrade() {
        const upgraded = super.upgrade();
        if (upgraded) {
            this.poisonDamage *= 1.5;
            this.poisonDuration += 1000;
        }
        return upgraded;
    }

    getSourceType() {
        return 'veneno';
    }

    drawDetails(ctx) {
        ctx.fillStyle = '#6a0080';
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-this.size / 4, -this.size / 4, this.size / 2, this.size / 2);
        ctx.restore();
    }
}

class GladiatorTower extends Tower {
    constructor(gridX, gridY, map) {
        super(gridX, gridY, map);
        this.type = 'Gladiador';
        this.description = 'Combatente corpo a corpo, alcance limitado';
        this.color = '#8b4513';
        this.damage = 25; // Reduzido de 35 para 25
        this.range = 60; // Alcance curto
        this.attackSpeed = 2.0;
        this.attackCooldown = 1000 / this.attackSpeed;
        this.cost = 200;
        this.upgradeCost = 200;
    }

    getSourceType() {
        return 'gladiador';
    }

    drawDetails(ctx) {
        // Corpo
        ctx.fillStyle = '#5d2f0a';
        ctx.fillRect(
            this.x - 2,
            this.y - this.size / 2 + 5,
            4,
            this.size - 10
        );
        
        // Espada
        ctx.fillRect(
            this.x - this.size / 3,
            this.y - 3,
            this.size / 1.5,
            6
        );
    }
}

class CannonTower extends Tower {
    constructor(gridX, gridY, map) {
        super(gridX, gridY, map);
        this.type = 'Canhão';
        this.description = 'Dano em área devastador';
        this.color = '#d9534f';
        this.damage = 45;
        this.splashRadius = 70;
        this.range = 130;
        this.attackSpeed = 0.7;
        this.attackCooldown = 1000 / this.attackSpeed;
        this.cost = 250;
        this.upgradeCost = 250;
        
        this.specialEffect = (target) => {
            const enemies = window.gameInstance.enemies;
            const targetX = target.x;
            const targetY = target.y;
            
            for (const enemy of enemies) {
                if (enemy !== target && enemy.health > 0) {
                    const distance = Math.hypot(enemy.x - targetX, enemy.y - targetY);
                    if (distance <= this.splashRadius) {
                        const damageMultiplier = Math.max(0.4, 1 - (distance / this.splashRadius) * 0.6);
                        enemy.takeDamage(this.damage * damageMultiplier, 'canhao');
                    }
                }
            }
        };
    }

    getSourceType() {
        return 'canhao';
    }

    drawDetails(ctx) {
        ctx.fillStyle = '#761c19';
        ctx.fillRect(
            this.x - this.size / 2 + 5,
            this.y - 5,
            this.size - 10,
            10
        );
    }

    attack() {
        if (this.target) {
            const projectile = new Projectile(
                this.x,
                this.y,
                this.target,
                this.damage,
                this.color,
                this.specialEffect,
                this.getSourceType()
            );
            projectile.size = 8;
            projectile.speed = 300;
            this.projectiles.push(projectile);
        }
    }
}

class SniperTower extends Tower {
    constructor(gridX, gridY, map) {
        super(gridX, gridY, map);
        this.type = 'Sniper';
        this.description = 'Dano extremo, alcance máximo';
        this.color = '#337ab7';
        this.damage = 120;
        this.range = 300;
        this.attackSpeed = 0.4;
        this.attackCooldown = 1000 / this.attackSpeed;
        this.cost = 300;
        this.upgradeCost = 300;
    }

    getSourceType() {
        return 'sniper';
    }

    drawDetails(ctx) {
        ctx.fillStyle = '#1b4770';
        ctx.fillRect(
            this.x - 2,
            this.y - this.size / 2,
            4,
            this.size
        );
    }

    attack() {
        if (this.target) {
            const projectile = new Projectile(
                this.x,
                this.y,
                this.target,
                this.damage,
                this.color,
                this.specialEffect,
                this.getSourceType()
            );
            projectile.speed = 800;
            projectile.size = 3;
            this.projectiles.push(projectile);
        }
    }
}

class BallistaTower extends Tower {
    constructor(gridX, gridY, map) {
        super(gridX, gridY, map);
        this.type = 'Balista';
        this.description = 'Projéteis perfurantes devastadores';
        this.color = '#ff9800';
        this.damage = 80;
        this.range = 200;
        this.attackSpeed = 0.5;
        this.attackCooldown = 1000 / this.attackSpeed;
        this.cost = 600;
        this.upgradeCost = 600;
        this.pierceCount = 3;
        
        this.specialEffect = (target) => {
            // Efeito perfurante - continua após atingir um inimigo
            const enemies = window.gameInstance.enemies;
            let pierced = 0;
            
            for (const enemy of enemies) {
                if (enemy !== target && enemy.health > 0 && pierced < this.pierceCount) {
                    const distance = Math.hypot(enemy.x - target.x, enemy.y - target.y);
                    if (distance <= 40) {
                        enemy.takeDamage(this.damage * 0.7, 'balista');
                        pierced++;
                    }
                }
            }
        };
    }

    upgrade() {
        const upgraded = super.upgrade();
        if (upgraded) {
            this.pierceCount += 1;
        }
        return upgraded;
    }

    getSourceType() {
        return 'balista';
    }

    drawDetails(ctx) {
        ctx.fillStyle = '#b26a00';
        // Hastes horizontais
        ctx.fillRect(
            this.x - this.size / 2 + 5,
            this.y - 2,
            this.size - 10,
            4
        );
        ctx.fillRect(
            this.x - this.size / 2 + 5,
            this.y + 6,
            this.size - 10,
            4
        );
    }

    attack() {
        if (this.target) {
            const projectile = new Projectile(
                this.x,
                this.y,
                this.target,
                this.damage,
                this.color,
                this.specialEffect,
                this.getSourceType()
            );
            projectile.speed = 600;
            projectile.size = 6;
            this.projectiles.push(projectile);
        }
    }
}

window.Tower = Tower;
window.Projectile = Projectile;
window.ArcherTower = ArcherTower;
window.IceTower = IceTower;
window.PoisonTower = PoisonTower;
window.GladiatorTower = GladiatorTower;
window.CannonTower = CannonTower;
window.SniperTower = SniperTower;
window.BallistaTower = BallistaTower;
