class Enemy {
    constructor(map) {
        this.map = map;
        this.x = 0;
        this.y = 0;
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 50; // pixels por segundo
        this.reward = 10;
        this.pathIndex = 0;
        this.color = '#ff6b6b';
        this.size = 16;
        this.type = 'Básico';
        this.description = 'Inimigo padrão';
        
        // Efeitos de status
        this.slowEffect = null;
        this.poisonEffect = null;
        this.stunned = false;
        
        // Regeneração (com fix do bug)
        this.canRegenerate = false;
        this.regenerationRate = 0;
        this.lastRegenerationTime = 0;
        this.forceKill = false; // Flag para forçar morte
        
        this.initializePosition();
    }

    initializePosition() {
        if (this.map.pathPixels && this.map.pathPixels.length > 0) {
            const startPoint = this.map.pathPixels[0];
            this.x = startPoint.x;
            this.y = startPoint.y;
        }
    }

    update(deltaTime) {
        if (this.health <= 0) {
            this.forceKill = true; // Força morte quando vida chega a 0
            return;
        }

        // Sistema de regeneração com fix do bug
        if (this.canRegenerate && !this.forceKill) {
            const now = Date.now();
            if (now - this.lastRegenerationTime >= 1000) { // Regenera a cada segundo
                if (this.health > 0 && this.health < this.maxHealth) {
                    this.health = Math.min(this.maxHealth, this.health + this.regenerationRate);
                }
                this.lastRegenerationTime = now;
            }
        }

        // Aplicar efeitos de status
        this.updateStatusEffects(deltaTime);

        if (this.stunned) return;

        // Movimento
        this.move(deltaTime);
    }

    updateStatusEffects(deltaTime) {
        // Efeito de lentidão
        if (this.slowEffect) {
            this.slowEffect.duration -= deltaTime;
            if (this.slowEffect.duration <= 0) {
                this.slowEffect = null;
            }
        }

        // Efeito de veneno
        if (this.poisonEffect) {
            this.poisonEffect.duration -= deltaTime;
            const damagePerSecond = this.poisonEffect.damage / 1000;
            this.health -= damagePerSecond * deltaTime;
            
            if (this.poisonEffect.duration <= 0) {
                this.poisonEffect = null;
            }
        }
    }

    move(deltaTime) {
        if (!this.map.pathPixels || this.pathIndex >= this.map.pathPixels.length - 1) {
            return;
        }

        const currentTarget = this.map.pathPixels[this.pathIndex + 1];
        if (!currentTarget) return;

        const dx = currentTarget.x - this.x;
        const dy = currentTarget.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 5) {
            this.pathIndex++;
            return;
        }

        const moveSpeed = this.speed * (this.slowEffect ? this.slowEffect.factor : 1);
        const moveDistance = moveSpeed * (deltaTime / 1000);

        const vx = (dx / distance) * moveDistance;
        const vy = (dy / distance) * moveDistance;

        this.x += vx;
        this.y += vy;
    }

    takeDamage(damage, source = null) {
        if (this.forceKill) return; // Não aceita mais dano se já foi marcado para morrer
        
        this.health -= damage;
        
        if (this.health <= 0) {
            this.health = 0;
            this.forceKill = true; // Força morte definitiva
        }
    }

    applySlowEffect(factor, duration) {
        this.slowEffect = {
            factor: factor,
            duration: duration
        };
    }

    applyPoisonEffect(damage, duration) {
        this.poisonEffect = {
            damage: damage,
            duration: duration
        };
    }

    draw(ctx) {
        // Sombra para inimigos voadores
        if (this.type.includes('Voador')) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + this.size + 5, this.size * 0.8, this.size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Corpo principal
        this.drawShape(ctx);

        // Asas para inimigos voadores (formato de losango)
        if (this.type.includes('Voador')) {
            this.drawWings(ctx);
        }

        // Efeitos visuais para status
        this.drawStatusEffects(ctx);

        // Barra de vida
        this.drawHealthBar(ctx);
    }

    drawShape(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawWings(ctx) {
        const wingSize = this.size * 0.8;
        
        // Asa esquerda (losango)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(this.x - this.size - wingSize, this.y);
        ctx.lineTo(this.x - this.size - wingSize/2, this.y - wingSize/2);
        ctx.lineTo(this.x - this.size, this.y);
        ctx.lineTo(this.x - this.size - wingSize/2, this.y + wingSize/2);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Asa direita (losango)
        ctx.beginPath();
        ctx.moveTo(this.x + this.size + wingSize, this.y);
        ctx.lineTo(this.x + this.size + wingSize/2, this.y - wingSize/2);
        ctx.lineTo(this.x + this.size, this.y);
        ctx.lineTo(this.x + this.size + wingSize/2, this.y + wingSize/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawStatusEffects(ctx) {
        let effectOffset = 0;

        if (this.slowEffect) {
            ctx.fillStyle = '#5bc0de';
            ctx.beginPath();
            ctx.arc(this.x - this.size, this.y - this.size + effectOffset, 4, 0, Math.PI * 2);
            ctx.fill();
            effectOffset += 10;
        }

        if (this.poisonEffect) {
            ctx.fillStyle = '#9c27b0';
            ctx.beginPath();
            ctx.arc(this.x - this.size, this.y - this.size + effectOffset, 4, 0, Math.PI * 2);
            ctx.fill();
            effectOffset += 10;
        }
    }

    drawHealthBar(ctx) {
        const barWidth = this.size * 2;
        const barHeight = 4;
        const x = this.x - barWidth / 2;
        const y = this.y - this.size - 10;

        // Fundo da barra
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Barra de vida
        const healthPercentage = Math.max(0, this.health / this.maxHealth);
        const healthWidth = barWidth * healthPercentage;
        
        if (healthPercentage > 0.6) {
            ctx.fillStyle = '#4CAF50';
        } else if (healthPercentage > 0.3) {
            ctx.fillStyle = '#FF9800';
        } else {
            ctx.fillStyle = '#F44336';
        }
        
        ctx.fillRect(x, y, healthWidth, barHeight);
    }

    hasReachedEnd() {
        return this.pathIndex >= this.map.pathPixels.length - 1;
    }

    isDead() {
        return this.health <= 0 || this.forceKill;
    }

    getInfo() {
        return {
            nome: this.type,
            descricao: this.description,
            vida: this.maxHealth,
            velocidade: (this.speed / 50).toFixed(1),
            recompensa: this.reward
        };
    }
}

// Inimigos básicos
class FastEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Rápido';
        this.description = 'Inimigo ágil, difícil de acertar';
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 80;
        this.reward = 12;
        this.color = '#ffeb3b';
        this.size = 14;
    }

    drawShape(ctx) {
        // Triângulo
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x - this.size, this.y + this.size);
        ctx.lineTo(this.x + this.size, this.y + this.size);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class StrongEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Forte';
        this.description = 'Inimigo resistente com muita vida';
        this.health = 160;
        this.maxHealth = 160;
        this.speed = 30;
        this.reward = 20;
        this.color = '#795548';
        this.size = 20;
    }

    drawShape(ctx) {
        // Quadrado
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x - this.size,
            this.y - this.size,
            this.size * 2,
            this.size * 2
        );
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            this.x - this.size,
            this.y - this.size,
            this.size * 2,
            this.size * 2
        );
    }
}

class BalancedEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Equilibrado';
        this.description = 'Inimigo com stats balanceados';
        this.health = 90;
        this.maxHealth = 90;
        this.speed = 50;
        this.reward = 15;
        this.color = '#9c27b0';
        this.size = 16;
    }

    drawShape(ctx) {
        // Hexágono
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = this.x + this.size * Math.cos(angle);
            const y = this.y + this.size * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class GliderEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Planador Voador';
        this.description = 'Inimigo voador com asas de losango';
        this.health = 80;
        this.maxHealth = 80;
        this.speed = 70;
        this.reward = 18;
        this.color = '#00bcd4';
        this.size = 15;
    }
}

class SpeedsterEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Velocista';
        this.description = 'Extremamente rápido e difícil de atingir';
        this.health = 95;
        this.maxHealth = 95;
        this.speed = 180;
        this.reward = 35;
        this.color = '#ff5722';
        this.size = 12;
    }

    drawShape(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x + this.size, this.y);
        ctx.lineTo(this.x, this.y + this.size);
        ctx.lineTo(this.x - this.size, this.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class ResistantEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Resistente';
        this.description = 'Resistente a dano, reduz dano recebido';
        this.health = 300;
        this.maxHealth = 300;
        this.speed = 45;
        this.reward = 45;
        this.color = '#607d8b';
        this.size = 18;
        this.damageReduction = 0.4;
    }

    takeDamage(damage, source = null) {
        if (this.forceKill) return;
        
        const reducedDamage = damage * (1 - this.damageReduction);
        super.takeDamage(reducedDamage, source);
    }

    drawShape(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const x = this.x + this.size * Math.cos(angle);
            const y = this.y + this.size * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class FlyingEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Voador Avançado';
        this.description = 'Inimigo voador avançado com asas de losango';
        this.health = 160;
        this.maxHealth = 160;
        this.speed = 105;
        this.reward = 40;
        this.color = '#e91e63';
        this.size = 16;
    }

    drawShape(ctx) {
        // Estrela
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const outerRadius = this.size;
            const innerRadius = this.size * 0.5;
            
            // Ponto externo
            let x = this.x + outerRadius * Math.cos(angle);
            let y = this.y + outerRadius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            // Ponto interno
            const innerAngle = angle + Math.PI / 5;
            x = this.x + innerRadius * Math.cos(innerAngle);
            y = this.y + innerRadius * Math.sin(innerAngle);
            ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class SuperBalancedEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Super Equilibrado';
        this.description = 'Inimigo com excelente balanço de atributos';
        this.health = 180; // Aumentado de 90
        this.maxHealth = 180;
        this.speed = 75; // Aumentado de 55
        this.reward = 50; // Aumentado de 28
        this.color = '#673ab7';
        this.size = 17;
    }

    drawShape(ctx) {
        // Cruz
        ctx.fillStyle = this.color;
        const crossSize = this.size;
        const crossWidth = crossSize * 0.4;
        
        // Barra vertical
        ctx.fillRect(
            this.x - crossWidth / 2,
            this.y - crossSize,
            crossWidth,
            crossSize * 2
        );
        
        // Barra horizontal
        ctx.fillRect(
            this.x - crossSize,
            this.y - crossWidth / 2,
            crossSize * 2,
            crossWidth
        );
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            this.x - crossWidth / 2,
            this.y - crossSize,
            crossWidth,
            crossSize * 2
        );
        ctx.strokeRect(
            this.x - crossSize,
            this.y - crossWidth / 2,
            crossSize * 2,
            crossWidth
        );
    }
}

class RegeneratingEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Regenerador';
        this.description = 'Regenera 10% da vida por segundo';
        this.health = 250; // Muito mais forte
        this.maxHealth = 250;
        this.speed = 70; // Mais rápido
        this.reward = 100; // Maior recompensa
        this.color = '#4caf50';
        this.size = 16;
        this.canRegenerate = true;
        this.regenerationRate = 25; // 10% de 250 = 25 HP por segundo
    }

    // Override do takeDamage para garantir que morre corretamente
    takeDamage(damage, source = null) {
        if (this.forceKill) return;
        
        this.health -= damage;
        
        if (this.health <= 0) {
            this.health = 0;
            this.forceKill = true; // Força morte definitiva, desabilitando regeneração
            this.canRegenerate = false;
        }
    }

    drawShape(ctx) {
        // Coração
        ctx.fillStyle = this.color;
        ctx.beginPath();
        const x = this.x;
        const y = this.y;
        const size = this.size;
        
        ctx.moveTo(x, y + size * 0.3);
        ctx.bezierCurveTo(x, y - size * 0.2, x - size * 0.8, y - size * 0.2, x - size * 0.8, y + size * 0.1);
        ctx.bezierCurveTo(x - size * 0.8, y + size * 0.4, x, y + size * 0.7, x, y + size);
        ctx.bezierCurveTo(x, y + size * 0.7, x + size * 0.8, y + size * 0.4, x + size * 0.8, y + size * 0.1);
        ctx.bezierCurveTo(x + size * 0.8, y - size * 0.2, x, y - size * 0.2, x, y + size * 0.3);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class LightningEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Elite Raio';
        this.description = 'Inimigo elite com velocidade extrema e chance de esquiva';
        this.health = 200;
        this.maxHealth = 200;
        this.speed = 220;
        this.reward = 150;
        this.color = '#ffeb3b';
        this.size = 20;
        this.dodgeChance = 0.25;
    }

    takeDamage(damage, source = null) {
        if (this.forceKill) return;
        
        // Chance de esquivar completamente o ataque
        if (Math.random() < this.dodgeChance) {
            return; // Esquivou!
        }
        
        super.takeDamage(damage, source);
    }

    drawShape(ctx) {
        // Raio (zigzag)
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        
        const x = this.x;
        const y = this.y;
        const size = this.size;
        
        ctx.moveTo(x - size * 0.5, y - size);
        ctx.lineTo(x + size * 0.2, y - size * 0.3);
        ctx.lineTo(x - size * 0.2, y - size * 0.1);
        ctx.lineTo(x + size * 0.5, y + size);
        ctx.lineTo(x, y + size * 0.3);
        ctx.lineTo(x + size * 0.3, y);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    draw(ctx) {
        // Efeito de brilho elétrico
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        super.draw(ctx);
        ctx.shadowBlur = 0;
    }
}

class ToughEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Elite Resistente';
        this.description = 'Inimigo elite extremamente resistente';
        this.health = 600;
        this.maxHealth = 600;
        this.speed = 35; // Aumentado de 25
        this.reward = 90; // Aumentado de 60
        this.color = '#424242';
        this.size = 24;
        this.damageReduction = 0.6; // Aumentado de 0.5
    }

    takeDamage(damage, source = null) {
        if (this.forceKill) return;
        
        const reducedDamage = damage * (1 - this.damageReduction);
        super.takeDamage(reducedDamage, source);
    }

    drawShape(ctx) {
        // Múltiplos hexágonos sobrepostos
        for (let layer = 0; layer < 3; layer++) {
            const layerSize = this.size - layer * 4;
            ctx.fillStyle = layer === 0 ? this.color : 
                            layer === 1 ? '#616161' : '#757575';
            
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const x = this.x + layerSize * Math.cos(angle);
                const y = this.y + layerSize * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            
            if (layer === 2) {
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    }
}

class GargoyleEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Elite Voador Gárgula';
        this.description = 'Gárgula voadora elite com asas poderosas';
        this.health = 400; // Muito mais forte
        this.maxHealth = 400;
        this.speed = 120; // Muito mais rápido
        this.reward = 200; // Maior recompensa
        this.color = '#37474f';
        this.size = 22;
    }

    drawShape(ctx) {
        // Corpo de gárgula (forma complexa)
        ctx.fillStyle = this.color;
        
        // Corpo principal
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Chifres
        ctx.beginPath();
        ctx.moveTo(this.x - this.size * 0.5, this.y - this.size);
        ctx.lineTo(this.x - this.size * 0.2, this.y - this.size * 1.5);
        ctx.lineTo(this.x - this.size * 0.1, this.y - this.size);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + this.size * 0.1, this.y - this.size);
        ctx.lineTo(this.x + this.size * 0.2, this.y - this.size * 1.5);
        ctx.lineTo(this.x + this.size * 0.5, this.y - this.size);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawWings(ctx) {
        const wingSize = this.size * 1.2;
        
        // Asas maiores e mais detalhadas para elite
        // Asa esquerda
        ctx.fillStyle = 'rgba(55, 71, 79, 0.8)';
        ctx.beginPath();
        ctx.moveTo(this.x - this.size - wingSize, this.y);
        ctx.lineTo(this.x - this.size - wingSize/2, this.y - wingSize);
        ctx.lineTo(this.x - this.size, this.y - wingSize/4);
        ctx.lineTo(this.x - this.size - wingSize/2, this.y + wingSize);
        ctx.closePath();
        ctx.fill();
        
        // Asa direita
        ctx.beginPath();
        ctx.moveTo(this.x + this.size + wingSize, this.y);
        ctx.lineTo(this.x + this.size + wingSize/2, this.y - wingSize);
        ctx.lineTo(this.x + this.size, this.y - wingSize/4);
        ctx.lineTo(this.x + this.size + wingSize/2, this.y + wingSize);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class SplitterEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Elite Divisor';
        this.description = 'Divide-se em inimigos menores ao morrer';
        this.health = 250; // Aumentado de 120
        this.maxHealth = 250;
        this.speed = 70; // Aumentado de 50
        this.reward = 80; // Aumentado de 40
        this.color = '#e91e63';
        this.size = 18;
        this.hasSplit = false;
    }

    takeDamage(damage, source = null) {
        if (this.forceKill) return;
        
        super.takeDamage(damage, source);
        
        // Divisão ao morrer
        if (this.health <= 0 && !this.hasSplit) {
            this.hasSplit = true;
            this.splitIntoSmaller();
        }
    }

    splitIntoSmaller() {
        // Cria 2 inimigos menores na posição atual
        if (window.gameInstance) {
            for (let i = 0; i < 2; i++) {
                const smallEnemy = new Enemy(this.map);
                smallEnemy.x = this.x + (i === 0 ? -20 : 20);
                smallEnemy.y = this.y;
                smallEnemy.health = 100;
                smallEnemy.maxHealth = 100;
                smallEnemy.speed = 70;
                smallEnemy.reward = 15;
                smallEnemy.color = '#f8bbd9';
                smallEnemy.size = 12;
                smallEnemy.pathIndex = this.pathIndex;
                smallEnemy.type = 'Fragmento';
                
                window.gameInstance.enemies.push(smallEnemy);
            }
        }
    }

    drawShape(ctx) {
        // Forma de cristal rachado
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        // Base triangular
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x - this.size, this.y + this.size);
        ctx.lineTo(this.x + this.size, this.y + this.size);
        ctx.closePath();
        ctx.fill();
        
        // Rachaduras
        ctx.strokeStyle = '#ad1457';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x, this.y + this.size);
        ctx.moveTo(this.x - this.size * 0.5, this.y);
        ctx.lineTo(this.x + this.size * 0.5, this.y);
        ctx.stroke();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class SemiImmortalEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Elite Semi-Imortal';
        this.description = 'Revive 2 vezes após morrer';
        this.health = 300; // Aumentado de 250
        this.maxHealth = 300;
        this.speed = 55; // Aumentado de 40
        this.reward = 150; // Aumentado de 80
        this.color = '#8e24aa';
        this.size = 20;
        this.livesRemaining = 2; // Pode reviver 2 vezes
        this.isReviving = false;
    }

    takeDamage(damage, source = null) {
        if (this.forceKill || this.isReviving) return;
        
        super.takeDamage(damage, source);
        
        // Revive quando morre, se ainda tem vidas
        if (this.health <= 0 && this.livesRemaining > 0 && !this.forceKill) {
            this.revive();
        }
    }

    revive() {
        this.isReviving = true;
        this.livesRemaining--;
        
        // Restaura 60% da vida máxima
        this.health = Math.floor(this.maxHealth * 0.6);
        
        // Aumenta velocidade a cada revivida
        this.speed += 20;
        
        // Muda cor para indicar revivida
        if (this.livesRemaining === 1) {
            this.color = '#7b1fa2';
        } else if (this.livesRemaining === 0) {
            this.color = '#6a1b9a';
        }
        
        setTimeout(() => {
            this.isReviving = false;
        }, 100);
    }

    drawShape(ctx) {
        // Aura brilhante
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        
        // Múltiplas formas sobrepostas
        for (let i = 0; i < 3; i++) {
            const size = this.size - i * 3;
            const alpha = 1 - i * 0.3;
            
            ctx.fillStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Novos inimigos especiais ultra-difíceis
class BerserkerEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Berserker';
        this.description = 'Fica mais rápido e forte conforme perde vida';
        this.health = 350;
        this.maxHealth = 350;
        this.speed = 45;
        this.baseSpeed = 45;
        this.reward = 120;
        this.color = '#d32f2f';
        this.size = 22;
        this.rage = 0;
    }

    takeDamage(damage, source = null) {
        if (this.forceKill) return;
        
        super.takeDamage(damage, source);
        
        // Fica mais furioso conforme perde vida
        const healthPercent = this.health / this.maxHealth;
        this.rage = 1 - healthPercent;
        
        // Aumenta velocidade e tamanho com a fúria
        this.speed = this.baseSpeed + (this.rage * 60);
        this.size = 22 + (this.rage * 8);
    }

    drawShape(ctx) {
        // Múltiplas camadas com cor mais intensa conforme a fúria
        const rageIntensity = Math.floor(this.rage * 100);
        ctx.fillStyle = `rgb(211, ${47 - rageIntensity/4}, ${47 - rageIntensity/4})`;
        
        // Forma de caveira
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Olhos vermelhos brilhantes
        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.2, this.size * 0.15, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 0.3, this.y - this.size * 0.2, this.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Efeito de fúria
        if (this.rage > 0.5) {
            ctx.shadowColor = '#ff1744';
            ctx.shadowBlur = 15;
        }
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

class PhantomEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Fantasma';
        this.description = 'Inimigo fantasma que pode se tornar intangível';
        this.health = 250;
        this.maxHealth = 250;
        this.speed = 80;
        this.reward = 100;
        this.color = '#9c27b0';
        this.size = 18;
        this.isIntangible = false;
        this.intangibleTimer = 0;
        this.phaseTimer = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Alterna entre tangível e intangível
        this.phaseTimer += deltaTime;
        if (this.phaseTimer >= 3000) { // A cada 3 segundos
            this.isIntangible = !this.isIntangible;
            this.intangibleTimer = 2000; // Fica intangível por 2 segundos
            this.phaseTimer = 0;
        }
        
        if (this.isIntangible) {
            this.intangibleTimer -= deltaTime;
            if (this.intangibleTimer <= 0) {
                this.isIntangible = false;
            }
        }
    }

    takeDamage(damage, source = null) {
        if (this.forceKill) return;
        
        // Não recebe dano quando intangível
        if (this.isIntangible) {
            return;
        }
        
        super.takeDamage(damage, source);
    }

    drawShape(ctx) {
        // Transparência baseada no estado
        const alpha = this.isIntangible ? 0.3 : 0.8;
        ctx.globalAlpha = alpha;
        
        // Forma de fantasma ondulante
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        // Corpo principal
        ctx.arc(this.x, this.y - this.size * 0.3, this.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Cauda ondulante
        const waveOffset = Date.now() * 0.01;
        ctx.beginPath();
        ctx.moveTo(this.x - this.size * 0.8, this.y + this.size * 0.5);
        for (let i = 0; i <= this.size * 1.6; i += 4) {
            const x = this.x - this.size * 0.8 + i;
            const y = this.y + this.size * 0.5 + Math.sin(waveOffset + i * 0.2) * 4;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(this.x + this.size * 0.8, this.y - this.size * 0.3);
        ctx.lineTo(this.x - this.size * 0.8, this.y - this.size * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // Efeito brilhante quando intangível
        if (this.isIntangible) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 20;
        }
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
}

class NightmareEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Pesadelo';
        this.description = 'Inimigo do pesadelo - extremamente perigoso';
        this.health = 500;
        this.maxHealth = 500;
        this.speed = 60;
        this.reward = 200;
        this.color = '#1a1a1a';
        this.size = 24;
        this.damageReduction = 0.4;
        this.canRegenerate = true;
        this.regenerationRate = 8;
        this.auraTimer = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Aura de medo que afeta torres próximas
        this.auraTimer += deltaTime;
        if (this.auraTimer >= 1000) {
            this.applyFearAura();
            this.auraTimer = 0;
        }
    }

    applyFearAura() {
        if (!window.gameInstance) return;
        
        // Reduz eficiência de torres próximas
        for (const tower of window.gameInstance.towers) {
            const distance = Math.hypot(tower.x - this.x, tower.y - this.y);
            if (distance <= 100) {
                // Torres próximas ficam mais lentas temporariamente
                tower.attackCooldown *= 1.5;
                setTimeout(() => {
                    tower.attackCooldown /= 1.5;
                }, 2000);
            }
        }
    }

    takeDamage(damage, source = null) {
        if (this.forceKill) return;
        
        const reducedDamage = damage * (1 - this.damageReduction);
        super.takeDamage(reducedDamage, source);
    }

    drawShape(ctx) {
        // Aura escura
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 25;
        
        // Múltiplas formas sobrepostas para efeito sombrio
        for (let i = 0; i < 4; i++) {
            const size = this.size - i * 3;
            const offset = Math.sin(Date.now() * 0.003 + i) * 2;
            
            ctx.fillStyle = i % 2 === 0 ? '#1a1a1a' : '#424242';
            ctx.beginPath();
            
            // Forma irregular de pesadelo
            const points = 8;
            for (let j = 0; j < points; j++) {
                const angle = (j * 2 * Math.PI) / points;
                const radius = size + Math.sin(angle * 3 + Date.now() * 0.005) * 4;
                const x = this.x + Math.cos(angle) * radius + offset;
                const y = this.y + Math.sin(angle) * radius + offset;
                
                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
        }
        
        // Olhos vermelhos brilhantes
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.2, 3, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 0.3, this.y - this.size * 0.2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
}

// Bosses significativamente mais difíceis
class GolemBoss extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Boss Golem Devastador';
        this.description = 'Boss colossal de pedra - resistência quase absoluta';
        this.health = 5000; // Aumentado drasticamente
        this.maxHealth = 5000;
        this.speed = 25; // Reduzido mas compensado com resistência
        this.reward = 800;
        this.color = '#5d4037';
        this.size = 40; // Maior
        this.damageReduction = 0.8; // 80% de resistência - quase invencível
        this.canRegenerate = true;
        this.regenerationRate = 15; // Regenera também
    }

    takeDamage(damage, source = null) {
        if (this.forceKill) return;
        
        const reducedDamage = damage * (1 - this.damageReduction);
        super.takeDamage(reducedDamage, source);
    }

    drawShape(ctx) {
        // Múltiplas formas geométricas combinadas
        
        // Corpo principal (hexágono grande)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = this.x + this.size * Math.cos(angle);
            const y = this.y + this.size * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Detalhes em pedra
        ctx.fillStyle = '#6d4c41';
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const x = this.x + (this.size * 0.6) * Math.cos(angle);
            const y = this.y + (this.size * 0.6) * Math.sin(angle);
            ctx.fillRect(x - 4, y - 4, 8, 8);
        }
        
        // Olhos vermelhos
        ctx.fillStyle = '#f44336';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 8, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - 8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = this.x + this.size * Math.cos(angle);
            const y = this.y + this.size * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();
    }

    draw(ctx) {
        // Efeito de tremor para bosses
        const shake = Math.sin(Date.now() * 0.01) * 2;
        this.x += shake;
        super.draw(ctx);
        this.x -= shake;
    }
}

class LichBoss extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Boss Lich Supremo';
        this.description = 'Arquimago morto-vivo - regeneração devastadora';
        this.health = 6000; // Aumentado drasticamente
        this.maxHealth = 6000;
        this.speed = 40; // Equilibrado
        this.reward = 1200;
        this.color = '#311b92';
        this.size = 35;
        this.canRegenerate = true;
        this.regenerationRate = 60; // Regeneração extrema
        this.damageReduction = 0.7; // 70% resistência
        this.canPhase = true;
        this.phaseTimer = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Habilidade de fase - fica intangível periodicamente
        this.phaseTimer += deltaTime;
        if (this.phaseTimer >= 5000) {
            this.damageReduction = this.damageReduction === 0.7 ? 0.95 : 0.7; // Alterna entre 70% e 95%
            this.phaseTimer = 0;
        }
    }

    takeDamage(damage, source = null) {
        if (this.forceKill) return;
        
        const reducedDamage = damage * (1 - this.damageReduction);
        
        // Só força morte se receber muito dano concentrado
        if (reducedDamage >= 200) {
            super.takeDamage(reducedDamage, source);
            if (this.health <= 0) {
                this.forceKill = true;
                this.canRegenerate = false;
            }
        } else {
            this.health -= reducedDamage;
            if (this.health <= 50) {
                this.health = 50; // Mantém vida mínima
            }
        }
    }

    drawShape(ctx) {
        // Aura mágica
        ctx.shadowColor = '#7c4dff';
        ctx.shadowBlur = 20;
        
        // Forma de mago (estrela complexa)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const radius = i % 2 === 0 ? this.size : this.size * 0.6;
            const x = this.x + radius * Math.cos(angle);
            const y = this.y + radius * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Centro mágico
        ctx.fillStyle = '#7c4dff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

class DragonBoss extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'DRAGÃO APOCALÍPTICO';
        this.description = 'Boss final absoluto - terror dos céus';
        this.health = 10000; // Vida extrema
        this.maxHealth = 10000;
        this.speed = 35; // Mais lento mas devastador
        this.reward = 2500;
        this.color = '#d32f2f';
        this.size = 45; // Gigantesco
        this.damageReduction = 0.85; // 85% resistência - quase invulnerável
        this.canRegenerate = true;
        this.regenerationRate = 80; // Regeneração absurda
        this.fireBreathTimer = 0;
        this.shieldTimer = 0;
        this.hasShield = false;
        this.enrageMode = false;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Ataque de fogo devastador
        this.fireBreathTimer += deltaTime;
        if (this.fireBreathTimer >= 2000) { // Mais frequente
            this.breathFire();
            this.fireBreathTimer = 0;
        }
        
        // Escudo mágico temporal
        this.shieldTimer += deltaTime;
        if (this.shieldTimer >= 8000) {
            this.hasShield = !this.hasShield;
            this.shieldTimer = 0;
        }
        
        // Modo enrage quando vida baixa
        if (this.health <= this.maxHealth * 0.3 && !this.enrageMode) {
            this.enrageMode = true;
            this.speed *= 1.5;
            this.regenerationRate *= 2;
        }
    }

    breathFire() {
        if (!window.gameInstance) return;
        
        // Destrói projéteis em área maior e danifica torres próximas
        for (const tower of window.gameInstance.towers) {
            const towerDistance = Math.hypot(tower.x - this.x, tower.y - this.y);
            
            // Dano às torres próximas (conceitualmente - reduziria eficiência)
            if (towerDistance <= 200) {
                // Torres próximas ficam temporariamente menos eficazes
                if (!tower.fireDebuff) {
                    tower.fireDebuff = 5000; // 5 segundos de debuff
                    tower.originalAttackSpeed = tower.attackSpeed;
                    tower.attackSpeed *= 2; // Ataca mais devagar
                }
            }
            
            // Destrói projéteis em área muito maior
            for (let i = tower.projectiles.length - 1; i >= 0; i--) {
                const projectile = tower.projectiles[i];
                const distance = Math.hypot(projectile.x - this.x, projectile.y - this.y);
                if (distance <= 250) { // Área maior
                    tower.projectiles.splice(i, 1);
                }
            }
        }
    }

    takeDamage(damage, source = null) {
        if (this.forceKill) return;
        
        const reducedDamage = damage * (1 - this.damageReduction);
        super.takeDamage(reducedDamage, source);
    }

    drawShape(ctx) {
        // Corpo de dragão (forma complexa)
        ctx.fillStyle = this.color;
        
        // Corpo principal
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.size, this.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabeça
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - this.size * 0.8, this.size * 0.6, this.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Chifres
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.moveTo(this.x - this.size * 0.3, this.y - this.size * 1.1);
        ctx.lineTo(this.x - this.size * 0.1, this.y - this.size * 1.4);
        ctx.lineTo(this.x - this.size * 0.05, this.y - this.size * 1.1);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + this.size * 0.05, this.y - this.size * 1.1);
        ctx.lineTo(this.x + this.size * 0.1, this.y - this.size * 1.4);
        ctx.lineTo(this.x + this.size * 0.3, this.y - this.size * 1.1);
        ctx.closePath();
        ctx.fill();
        
        // Olhos de fogo
        ctx.fillStyle = '#ff5722';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - this.size * 0.8, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - this.size * 0.8, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    drawWings(ctx) {
        const wingSize = this.size * 1.5;
        
        // Asas de dragão (múltiplas camadas)
        // Asa esquerda - camada externa
        ctx.fillStyle = 'rgba(211, 47, 47, 0.8)';
        ctx.beginPath();
        ctx.moveTo(this.x - this.size - wingSize, this.y);
        ctx.lineTo(this.x - this.size - wingSize/2, this.y - wingSize * 1.2);
        ctx.lineTo(this.x - this.size, this.y - wingSize/3);
        ctx.lineTo(this.x - this.size - wingSize/3, this.y + wingSize/2);
        ctx.lineTo(this.x - this.size - wingSize, this.y + wingSize/4);
        ctx.closePath();
        ctx.fill();
        
        // Asa direita - camada externa
        ctx.beginPath();
        ctx.moveTo(this.x + this.size + wingSize, this.y);
        ctx.lineTo(this.x + this.size + wingSize/2, this.y - wingSize * 1.2);
        ctx.lineTo(this.x + this.size, this.y - wingSize/3);
        ctx.lineTo(this.x + this.size + wingSize/3, this.y + wingSize/2);
        ctx.lineTo(this.x + this.size + wingSize, this.y + wingSize/4);
        ctx.closePath();
        ctx.fill();
        
        // Detalhes das asas
        ctx.strokeStyle = '#b71c1c';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    draw(ctx) {
        // Efeito de fogo
        ctx.shadowColor = '#ff5722';
        ctx.shadowBlur = 15;
        super.draw(ctx);
        ctx.shadowBlur = 0;
        
        // Tremor mais intenso para o boss final
        const shake = Math.sin(Date.now() * 0.015) * 3;
        this.x += shake;
        this.y += shake * 0.5;
        super.draw(ctx);
        this.x -= shake;
        this.y -= shake * 0.5;
    }
}

// Export das classes
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
window.BerserkerEnemy = BerserkerEnemy;
window.PhantomEnemy = PhantomEnemy;
window.NightmareEnemy = NightmareEnemy;
window.GolemBoss = GolemBoss;
window.LichBoss = LichBoss;
window.DragonBoss = DragonBoss;
