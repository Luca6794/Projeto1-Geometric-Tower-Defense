class Enemy {
    constructor(map, config = {}) {
        this.map = map;
        this.maxHealth = config.health || 50;
        this.health = this.maxHealth;
        this.speed = config.speed || 1;
        this.baseSpeed = this.speed;
        this.size = config.size || 20;
        this.color = config.color || '#ff4444';
        this.shape = config.shape || 'circle';
        this.reward = config.reward || 10;
        this.pathIndex = 0;
        this.progress = 0;
        this.x = 0;
        this.y = 0;
        this.type = config.type || 'Básico';
        this.description = config.description || 'Inimigo padrão';
        
        this.slowEffect = null;
        this.poisonEffect = null;
        this.burnEffect = null;
        
        if (map && map.pathPixels && map.pathPixels.length > 0) {
            this.x = map.pathPixels[0].x;
            this.y = map.pathPixels[0].y;
        }
    }

    update(deltaTime) {
        this.updateMovement(deltaTime);
        this.updateEffects(deltaTime);
    }

    updateMovement(deltaTime) {
        if (!this.map || !this.map.pathPixels || this.pathIndex >= this.map.pathPixels.length - 1) {
            return;
        }
        
        let currentSpeed = this.speed;
        if (this.slowEffect) {
            currentSpeed *= this.slowEffect.factor;
        }
        
        const target = this.map.pathPixels[this.pathIndex + 1];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < 5) {
            this.pathIndex++;
            this.progress = this.pathIndex / (this.map.pathPixels.length - 1);
        } else {
            const moveDistance = currentSpeed * (deltaTime / 16.67) * 2;
            this.x += (dx / distance) * moveDistance;
            this.y += (dy / distance) * moveDistance;
        }
    }

    updateEffects(deltaTime) {
        if (this.slowEffect) {
            this.slowEffect.duration -= deltaTime;
            if (this.slowEffect.duration <= 0) {
                this.slowEffect = null;
            }
        }
        
        if (this.poisonEffect) {
            this.poisonEffect.duration -= deltaTime;
            this.poisonEffect.tickTimer = (this.poisonEffect.tickTimer || 0) + deltaTime;
            
            if (this.poisonEffect.tickTimer >= 1000) {
                this.health -= this.poisonEffect.damage;
                this.poisonEffect.tickTimer = 0;
            }
            
            if (this.poisonEffect.duration <= 0) {
                this.poisonEffect = null;
            }
        }
        
        if (this.burnEffect) {
            this.burnEffect.duration -= deltaTime;
            this.health -= this.burnEffect.damage * (deltaTime / 1000);
            if (this.burnEffect.duration <= 0) {
                this.burnEffect = null;
            }
        }
    }

    takeDamage(damage, source = null) {
        if (this.type === 'Voador' && ['gladiador', 'balista', 'gelo', 'canhao'].includes(source)) {
            return;
        }
        
        if (this.type === 'Relâmpago' && Math.random() < 0.33) {
            return;
        }
        
        if (this.type === 'Equilibrado' && ['gelo', 'veneno'].includes(source)) {
            return;
        }
        
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }

    applySlowEffect(factor, duration) {
        if (this.type === 'Equilibrado') return;
        this.slowEffect = { factor, duration };
    }

    applyPoisonEffect(damage, duration) {
        if (this.type === 'Equilibrado') return;
        this.poisonEffect = { damage, duration };
    }

    applyBurnEffect(damage, duration) {
        this.burnEffect = { damage, duration };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        this.drawShape(ctx);
        this.drawHealthBar(ctx);
        this.drawEffects(ctx);
        
        ctx.restore();
    }

    drawShape(ctx) {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        
        switch (this.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                break;
            case 'square':
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(0, -this.size / 2);
                ctx.lineTo(-this.size / 2, this.size / 2);
                ctx.lineTo(this.size / 2, this.size / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case 'lightning':
                ctx.beginPath();
                ctx.moveTo(0, -this.size / 2);
                ctx.lineTo(-this.size / 4, -this.size / 6);
                ctx.lineTo(this.size / 6, -this.size / 6);
                ctx.lineTo(-this.size / 6, this.size / 6);
                ctx.lineTo(this.size / 4, this.size / 6);
                ctx.lineTo(0, this.size / 2);
                ctx.lineTo(-this.size / 8, this.size / 4);
                ctx.lineTo(this.size / 8, 0);
                ctx.lineTo(-this.size / 8, -this.size / 4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case 'split':
                const quarterSize = this.size / 4;
                ctx.fillRect(-quarterSize, -quarterSize, quarterSize, quarterSize);
                ctx.fillRect(0, -quarterSize, quarterSize, quarterSize);
                ctx.fillRect(-quarterSize, 0, quarterSize, quarterSize);
                ctx.fillRect(0, 0, quarterSize, quarterSize);
                ctx.strokeRect(-quarterSize, -quarterSize, this.size / 2, this.size / 2);
                break;
            default:
                ctx.beginPath();
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
        }
        
        if (this.type === 'Voador' || this.type === 'Dragão') {
            this.drawWings(ctx);
        }
    }
    
    drawWings(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.ellipse(-this.size / 2, 0, this.size / 3, this.size / 6, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.size / 2, 0, this.size / 3, this.size / 6, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHealthBar(ctx) {
        const barWidth = this.size + 10;
        const barHeight = 4;
        const barY = -this.size / 2 - 10;
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);
    }

    drawEffects(ctx) {
        let offsetY = this.size / 2 + 5;
        
        if (this.slowEffect) {
            ctx.fillStyle = '#00aaff';
            ctx.beginPath();
            ctx.arc(-8, offsetY, 3, 0, Math.PI * 2);
            ctx.fill();
            offsetY += 8;
        }
        
        if (this.poisonEffect) {
            ctx.fillStyle = '#aa00ff';
            ctx.beginPath();
            ctx.arc(0, offsetY, 3, 0, Math.PI * 2);
            ctx.fill();
            offsetY += 8;
        }
        
        if (this.burnEffect) {
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(8, offsetY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    getInfo() {
        return {
            nome: this.type,
            descricao: this.description,
            vida: this.maxHealth,
            velocidade: this.speed,
            recompensa: this.reward,
            dano: 1
        };
    }
}

class FastEnemy extends Enemy {
    constructor(map) {
        super(map, {
            health: 30,
            speed: 2.5,
            size: 18,
            color: '#ffff00',
            shape: 'triangle',
            reward: 8,
            type: 'Rápido',
            description: 'Inimigo veloz com pouca vida'
        });
    }
}

class StrongEnemy extends Enemy {
    constructor(map) {
        super(map, {
            health: 120,
            speed: 0.8,
            size: 28,
            color: '#ff0000',
            shape: 'square',
            reward: 20,
            type: 'Forte',
            description: 'Inimigo resistente e lento'
        });
    }
}

class BalancedEnemy extends Enemy {
    constructor(map) {
        super(map, {
            health: 60,
            speed: 1.5,
            size: 22,
            color: '#00ff00',
            shape: 'circle',
            reward: 12,
            type: 'Equilibrado',
            description: 'Inimigo com atributos balanceados'
        });
    }
}

class GliderEnemy extends Enemy {
    constructor(map) {
        super(map, {
            health: 45,
            speed: 1.8,
            size: 20,
            color: '#00ffff',
            shape: 'triangle',
            reward: 10,
            type: 'Planador',
            description: 'Inimigo ágil que se move suavemente'
        });
    }
}

class SpeedsterEnemy extends Enemy {
    constructor(map) {
        super(map, {
            health: 25,
            speed: 3.5,
            size: 16,
            color: '#ff00ff',
            shape: 'circle',
            reward: 15,
            type: 'Velocista',
            description: 'Extremamente rápido mas frágil'
        });
    }
}

class ResistantEnemy extends Enemy {
    constructor(map) {
        super(map, {
            health: 200,
            speed: 0.6,
            size: 32,
            color: '#8b4513',
            shape: 'square',
            reward: 35,
            type: 'Resistente',
            description: 'Muito resistente a danos'
        });
    }
}

class FlyingEnemy extends Enemy {
    constructor(map) {
        super(map, {
            health: 80,
            speed: 2.0,
            size: 24,
            color: '#ffffff',
            shape: 'circle',
            reward: 18,
            type: 'Voador',
            description: 'Voa sobre obstáculos'
        });
    }
}

class SuperBalancedEnemy extends Enemy {
    constructor(map) {
        super(map, {
            health: 100,
            speed: 1.2,
            size: 26,
            color: '#ffa500',
            shape: 'square',
            reward: 25,
            type: 'Super Equilibrado',
            description: 'Versão aprimorada do equilibrado'
        });
    }
}

class RegeneratingEnemy extends Enemy {
    constructor(map) {
        super(map, {
            health: 90,
            speed: 1.0,
            size: 24,
            color: '#90ee90',
            shape: 'circle',
            reward: 22,
            type: 'Regenerativo',
            description: 'Regenera vida lentamente'
        });
        
        this.regenRate = 2;
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + this.regenRate * (deltaTime / 1000));
        }
    }
}

class LightningEnemy extends Enemy {
    constructor(map) {
        super(map, {
            health: 40,
            speed: 4.0,
            size: 20,
            color: '#ffff99',
            shape: 'lightning',
            reward: 30,
            type: 'Relâmpago',
            description: 'Velocidade extrema com 33% chance de esquiva'
        });
    }
}

class ToughEnemy extends Enemy {
    constructor(map) {
        super(map, {
            health: 350,
            speed: 0.4,
            size: 36,
            color: '#696969',
            shape: 'square',
            reward: 50,
            type: 'Blindado',
            description: 'Extremamente resistente'
        });
    }
}

class GargoyleEnemy extends Enemy {
    constructor(map) {
        super(map, {
            health: 150,
            speed: 1.5,
            size: 30,
            color: '#2f4f4f',
            shape: 'triangle',
            reward: 40,
            type: 'Gárgula',
            description: 'Criatura mítica resistente'
        });
    }
}

class SplitterEnemy extends Enemy {
    constructor(map) {
        super(map, {
            health: 80,
            speed: 1.3,
            size: 28,
            color: '#dda0dd',
            shape: 'split',
            reward: 35,
            type: 'Divisor',
            description: 'Se divide ao morrer'
        });
    }
}

class SemiImmortalEnemy extends Enemy {
    constructor(map) {
        super(map, {
            health: 500,
            speed: 0.3,
            size: 40,
            color: '#ffd700',
            shape: 'square',
            reward: 100,
            type: 'Semi-Imortal',
            description: 'Extremamente difícil de destruir'
        });
    }
}

class GolemBoss extends Enemy {
    constructor(map) {
        super(map, {
            health: 2000,
            speed: 0.2,
            size: 50,
            color: '#8B4513',
            shape: 'square',
            reward: 500,
            type: 'Golem',
            description: 'Boss gigante com imunidades especiais'
        });
    }
    
    takeDamage(damage, source = null) {
        if (source === 'arqueiro' || source === 'veneno') {
            return;
        }
        
        if (source === 'balista') {
            damage *= 3;
        }
        
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }
    
    applySlowEffect(factor, duration) {
        return;
    }
    
    applyPoisonEffect(damage, duration) {
        return;
    }
}

class LichBoss extends Enemy {
    constructor(map) {
        super(map, {
            health: 1200,
            speed: 0.8,
            size: 45,
            color: '#4B0082',
            shape: 'triangle',
            reward: 600,
            type: 'Lich',
            description: 'Boss necromante que invoca inimigos'
        });
        
        this.lastSummonTime = 0;
        this.summonInterval = 8000;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        const now = Date.now();
        if (now - this.lastSummonTime >= this.summonInterval) {
            this.summonEnemies();
            this.lastSummonTime = now;
        }
    }
    
    summonEnemies() {
        const gameInstance = window.gameInstance;
        if (!gameInstance) return;
        
        const enemyTypes = [
            FastEnemy, StrongEnemy, BalancedEnemy, GliderEnemy,
            SpeedsterEnemy, ResistantEnemy, FlyingEnemy
        ];
        
        const summonCount = Math.floor(Math.random() * 4) + 2;
        
        for (let i = 0; i < summonCount; i++) {
            const EnemyClass = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const summonedEnemy = new EnemyClass(this.map);
            summonedEnemy.x = this.x + (Math.random() - 0.5) * 100;
            summonedEnemy.y = this.y + (Math.random() - 0.5) * 100;
            gameInstance.enemies.push(summonedEnemy);
        }
    }
}

class DragonBoss extends Enemy {
    constructor(map) {
        super(map, {
            health: 3500,
            speed: 1.0,
            size: 60,
            color: '#FF4500',
            shape: 'triangle',
            reward: 1000,
            type: 'Dragão',
            description: 'Boss voador supremo com resistências especiais'
        });
    }
    
    takeDamage(damage, source = null) {
        if (source === 'gladiador') {
            return;
        }
        
        if (source === 'gelo') {
            damage *= 5;
        } else if (source === 'balista') {
            damage *= 2;
        }
        
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }
}

window.Enemy = Enemy;
window.FastEnemy = FastEnemy;
window.StrongEnemy = StrongEnemy;
window.BalancedEnemy = BalancedEnemy;
window.GliderEnemy = GliderEnemy;
window.SpeedsterEnemy = SpeedsterEnemy;
window.ResistantEnemy = ResistantEnemy;
window.FlyingEnemy = FlyingEnemy;
window.SuperBalancedEnemy = SuperBalancedEnemy;
window.RegeneratingEnemy = RegeneratingEnemy;
window.LightningEnemy = LightningEnemy;
window.ToughEnemy = ToughEnemy;
window.GargoyleEnemy = GargoyleEnemy;
window.SplitterEnemy = SplitterEnemy;
window.SemiImmortalEnemy = SemiImmortalEnemy;
window.GolemBoss = GolemBoss;
window.LichBoss = LichBoss;
window.DragonBoss = DragonBoss;
