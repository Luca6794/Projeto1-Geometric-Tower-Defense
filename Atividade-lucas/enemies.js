/**
 * Enemies.js
 * Contém as definições de todos os inimigos do jogo
 */

// Contador de IDs para inimigos
let enemyIdCounter = 0;

// Classe base para todos os inimigos
class Enemy {
    constructor(map) {
        this.id = ++enemyIdCounter;
        this.map = map;
        this.pathIndex = 0;
        this.reachedEnd = false;
        
        // Posição inicial (entrada do mapa)
        const startPos = map.pathPixels[0];
        this.x = startPos.x;
        this.y = startPos.y;
        
        // Atributos básicos
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.baseSpeed = 50; // Pixels por segundo
        this.speed = this.baseSpeed;
        this.size = 15; // Tamanho do inimigo
        this.reward = 10; // Moedas recebidas ao derrotar
        this.damage = 1; // Dano causado ao chegar ao fim
        this.color = '#f44336'; // Cor padrão
        this.shape = 'circle'; // Forma padrão
        
        // Efeitos de status
        this.effects = {
            slowed: { active: false, factor: 1, endTime: 0 },
            poisoned: { active: false, damage: 0, endTime: 0, tickTime: 0, interval: 500 }
        };
        
        // Informações para o catálogo
        this.type = 'Inimigo';
        this.description = 'Inimigo básico';
        this.category = 'Básico';
    }

    /**
     * Atualiza a posição e estado do inimigo
     * @param {number} deltaTime - Tempo desde o último frame em ms
     * @returns {number} - Dano causado se o inimigo chegou ao fim
     */
    update(deltaTime) {
        if (this.health <= 0 || this.reachedEnd) return 0;
        
        const timeFactor = deltaTime / 1000; // Converter para segundos
        
        // Atualiza efeitos de status
        this.updateEffects(deltaTime);
        
        // Pega o próximo ponto no caminho
        const targetPoint = this.map.pathPixels[this.pathIndex];
        
        // Calcula a direção para o próximo ponto
        const dx = targetPoint.x - this.x;
        const dy = targetPoint.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        // Se estamos perto o suficiente do ponto, avançamos para o próximo
        if (distance < 5) {
            this.pathIndex++;
            
            // Verifica se chegamos ao fim do caminho
            if (this.pathIndex >= this.map.pathPixels.length) {
                this.reachedEnd = true;
                return this.damage; // Retorna o dano causado
            }
        } else {
            // Move o inimigo em direção ao próximo ponto
            const moveDistance = this.speed * timeFactor;
            
            // Normaliza o vetor de direção
            const vx = dx / distance;
            const vy = dy / distance;
            
            // Atualiza posição
            this.x += vx * moveDistance;
            this.y += vy * moveDistance;
        }
        
        // Se chegou ao final, retorna o dano
        if (this.reachedEnd) {
            return this.damage;
        }
        
        return 0;
    }

    /**
     * Atualiza os efeitos de status (lentidão, veneno, etc.)
     * @param {number} deltaTime - Tempo desde o último frame em ms
     */
    updateEffects(deltaTime) {
        const now = Date.now();
        
        // Atualiza efeito de lentidão
        if (this.effects.slowed.active && now > this.effects.slowed.endTime) {
            this.effects.slowed.active = false;
            this.speed = this.baseSpeed;
        }
        
        // Atualiza efeito de veneno
        if (this.effects.poisoned.active) {
            if (now > this.effects.poisoned.endTime) {
                this.effects.poisoned.active = false;
            } else if (now > this.effects.poisoned.tickTime) {
                // Aplica dano por veneno
                this.health -= this.effects.poisoned.damage;
                this.effects.poisoned.tickTime = now + this.effects.poisoned.interval;
            }
        }
    }

    /**
     * Aplica dano ao inimigo
     * @param {number} amount - Quantidade de dano
     * @returns {boolean} - Verdadeiro se o inimigo morreu
     */
    takeDamage(amount, source = null) {
        // Implementação padrão de dano
        this.health -= amount;
        
        if (this.health <= 0) {
            this.health = 0;
            return true;
        }
        
        return false;
    }

    /**
     * Aplica efeito de lentidão ao inimigo
     * @param {number} factor - Fator de redução de velocidade (0-1)
     * @param {number} duration - Duração em milissegundos
     */
    slow(factor, duration) {
        const now = Date.now();
        
        // Só aplica se for um efeito mais forte ou estendendo a duração
        if (!this.effects.slowed.active || factor < this.effects.slowed.factor ||
            now + duration > this.effects.slowed.endTime) {
            
            this.effects.slowed = {
                active: true,
                factor: factor,
                endTime: now + duration
            };
            
            this.speed = this.baseSpeed * factor;
        }
    }

    /**
     * Aplica efeito de veneno ao inimigo
     * @param {number} damage - Dano por tick
     * @param {number} duration - Duração em milissegundos
     */
    poison(damage, duration) {
        const now = Date.now();
        
        // Só aplica se for um efeito mais forte ou estendendo a duração
        if (!this.effects.poisoned.active || damage > this.effects.poisoned.damage ||
            now + duration > this.effects.poisoned.endTime) {
            
            this.effects.poisoned = {
                active: true,
                damage: damage,
                endTime: now + duration,
                tickTime: now + 500,
                interval: 500
            };
        }
    }

    /**
     * Desenha o inimigo no contexto do canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    draw(ctx) {
        // Barra de vida
        this.drawHealthBar(ctx);
        
        // Desenha o inimigo baseado na forma
        ctx.fillStyle = this.color;
        
        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.size / 2);
            ctx.lineTo(this.x + this.size / 2, this.y + this.size / 2);
            ctx.lineTo(this.x - this.size / 2, this.y + this.size / 2);
            ctx.closePath();
            ctx.fill();
        } else if (this.shape === 'square') {
            ctx.fillRect(
                this.x - this.size / 2,
                this.y - this.size / 2,
                this.size,
                this.size
            );
        } else if (this.shape === 'diamond') {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.size / 2);
            ctx.lineTo(this.x + this.size / 2, this.y);
            ctx.lineTo(this.x, this.y + this.size / 2);
            ctx.lineTo(this.x - this.size / 2, this.y);
            ctx.closePath();
            ctx.fill();
        } else if (this.shape === 'star') {
            const spikes = 5;
            const outerRadius = this.size / 2;
            const innerRadius = this.size / 4;
            
            ctx.beginPath();
            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI / spikes) * i;
                
                ctx.lineTo(
                    this.x + Math.cos(angle) * radius,
                    this.y + Math.sin(angle) * radius
                );
            }
            ctx.closePath();
            ctx.fill();
        }
        
        // Desenha efeitos de status
        this.drawEffects(ctx);
    }

    /**
     * Desenha a barra de vida do inimigo
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    drawHealthBar(ctx) {
        const healthPercent = this.health / this.maxHealth;
        const barWidth = this.size * 1.2;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size / 2 - 8;
        
        // Fundo da barra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Barra de vida atual
        let healthColor;
        if (healthPercent > 0.6) {
            healthColor = '#4CAF50'; // Verde
        } else if (healthPercent > 0.3) {
            healthColor = '#FFC107'; // Amarelo
        } else {
            healthColor = '#F44336'; // Vermelho
        }
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }

    /**
     * Desenha indicadores visuais para efeitos ativos
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    drawEffects(ctx) {
        // Indicador de lentidão
        if (this.effects.slowed.active) {
            ctx.strokeStyle = '#5bc0de';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2 + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Indicador de veneno
        if (this.effects.poisoned.active) {
            ctx.fillStyle = 'rgba(156, 39, 176, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2 + 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Retorna informações do inimigo para exibição
     * @returns {Object} - Objeto com informações do inimigo
     */
    getInfo() {
        return {
            nome: this.type,
            vida: this.maxHealth,
            velocidade: this.baseSpeed,
            recompensa: this.reward,
            dano: this.damage,
            categoria: this.category,
            descricao: this.description
        };
    }
}

// INIMIGOS BÁSICOS

// Inimigo Rápido - Baixa vida, velocidade alta
class FastEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Rápido';
        this.description = 'Baixa vida, velocidade alta';
        this.category = 'Básico';
        this.shape = 'triangle';
        this.color = '#4CAF50'; // Verde
        this.maxHealth = 60;
        this.health = this.maxHealth;
        this.baseSpeed = 80;
        this.speed = this.baseSpeed;
        this.reward = 8;
        this.size = 14;
    }
}

// Inimigo Forte - Alta vida, velocidade baixa
class StrongEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Forte';
        this.description = 'Alta vida, velocidade baixa';
        this.category = 'Básico';
        this.shape = 'square';
        this.color = '#F44336'; // Vermelho
        this.maxHealth = 200;
        this.health = this.maxHealth;
        this.baseSpeed = 40;
        this.speed = this.baseSpeed;
        this.reward = 15;
        this.size = 18;
    }
}

// Inimigo Equilibrado - Atributos medianos
class BalancedEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Equilibrado';
        this.description = 'Atributos medianos';
        this.category = 'Básico';
        this.shape = 'circle';
        this.color = '#FFC107'; // Amarelo
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.baseSpeed = 60;
        this.speed = this.baseSpeed;
        this.reward = 10;
    }
}

// Inimigo Planador - Imune aos efeitos de lentidão
class GliderEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Planador';
        this.description = 'Imune aos efeitos de lentidão e a torres de gelo, canhão e balista';
        this.category = 'Básico';
        this.shape = 'diamond';
        this.color = '#2196F3'; // Azul
        this.maxHealth = 80;
        this.health = this.maxHealth;
        this.baseSpeed = 70;
        this.speed = this.baseSpeed;
        this.reward = 12;
    }

    // Sobreescreve o método slow para ser imune
    slow(factor, duration) {
        // Não faz nada - imune à lentidão
    }
    
    // Sobreescreve para ter resistência a certas torres
    takeDamage(amount, source = null) {
        // Imunidade a torres específicas
        if (source === 'canhao' || source === 'gelo' || source === 'balista') {
            return false; // Sem dano
        }
        
        // Aplica dano normal para outras fontes
        return super.takeDamage(amount, source);
    }
}

// INIMIGOS AVANÇADOS

// Inimigo Veloz - Extremamente rápido e esquiva de ataques
class SpeedsterEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Veloz';
        this.description = 'Extremamente rápido, causa mais dano. Tem chance de se esquivar de ataques';
        this.category = 'Avançado';
        this.shape = 'triangle';
        this.color = '#8BC34A'; // Verde claro
        this.maxHealth = 80;
        this.health = this.maxHealth;
        this.baseSpeed = 100;
        this.speed = this.baseSpeed;
        this.reward = 18;
        this.damage = 2;
        this.size = 13;
    }

    // Sobreescreve o método slow para ter resistência parcial
    slow(factor, duration) {
        // Reduz o efeito de lentidão (resistência parcial)
        super.slow(Math.sqrt(factor), Math.floor(duration * 0.7));
    }
    
    // Chance de se esquivar de ataques (1 em 5)
    takeDamage(amount, source = null) {
        // Gera um número aleatório entre 1 e 5
        const dodgeRoll = Math.floor(Math.random() * 5) + 1;
        
        // Se cair em 5, esquiva do ataque
        if (dodgeRoll === 5) {
            // Cria uma animação visual para mostrar que esquivou (um texto flutuante)
            const textPos = { x: this.x, y: this.y - 20 };
            // Aqui poderíamos adicionar uma animação visual para a esquiva se tivéssemos um sistema de animação
            
            return false; // Sem dano
        }
        
        // Caso contrário, aplica o dano normalmente
        return super.takeDamage(amount, source);
    }
}

// Inimigo Resistente - Muito resistente a dano
class ResistantEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Resistente';
        this.description = 'Alta resistência a dano, reduz dano recebido';
        this.category = 'Avançado';
        this.shape = 'square';
        this.color = '#E91E63'; // Rosa
        this.maxHealth = 300;
        this.health = this.maxHealth;
        this.baseSpeed = 45;
        this.speed = this.baseSpeed;
        this.reward = 25;
        this.damage = 2;
        this.size = 20;
        this.damageReduction = 0.3; // Reduz 30% do dano recebido
    }

    // Sobreescreve o método takeDamage para aplicar redução
    takeDamage(amount) {
        // Aplica redução de dano
        const reducedAmount = amount * (1 - this.damageReduction);
        return super.takeDamage(reducedAmount);
    }
}

// Inimigo Voador - Segue um caminho alternativo, mais curto
class FlyingEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Voador';
        this.description = 'Voa em linha reta, ignorando o caminho. Imune a torres de canhão, gelo e balista';
        this.category = 'Avançado';
        this.shape = 'triangle';
        this.color = '#9C27B0'; // Roxo
        this.maxHealth = 120;
        this.health = this.maxHealth;
        this.baseSpeed = 55;
        this.speed = this.baseSpeed;
        this.reward = 20;
        this.size = 16;
        
        // Voadores seguem um caminho mais direto
        this.pathIndex = 0;
        
        // Calcula um caminho mais direto para o destino
        this.createShorterPath();
    }
    
    // Sobreescreve para ter resistência a certas torres
    takeDamage(amount, source = null) {
        // Imunidade a torres específicas
        if (source === 'canhao' || source === 'gelo' || source === 'balista') {
            return false; // Sem dano
        }
        
        // Aplica dano normal para outras fontes
        return super.takeDamage(amount, source);
    }

    // Cria um caminho mais curto para o inimigo voador
    createShorterPath() {
        const originalPath = this.map.pathPixels;
        
        // Pega apenas alguns pontos do caminho original para criar um caminho mais curto
        const shortPath = [];
        shortPath.push(originalPath[0]); // Ponto inicial
        
        // Adiciona pontos intermediários pulando vários pontos do caminho original
        const step = Math.max(1, Math.floor(originalPath.length / 3));
        for (let i = step; i < originalPath.length; i += step) {
            shortPath.push(originalPath[i]);
        }
        
        // Adiciona o ponto final
        if (shortPath[shortPath.length - 1] !== originalPath[originalPath.length - 1]) {
            shortPath.push(originalPath[originalPath.length - 1]);
        }
        
        this.customPath = shortPath;
    }
    
    // Adiciona resistência a torres específicas
    takeDamage(amount, source = null) {
        // Imunidade a torres específicas
        if (source === 'canhao' || source === 'gelo' || source === 'balista') {
            return false; // Sem dano
        }
        
        // Aplica dano normal para outras fontes
        return super.takeDamage(amount, source);
    }

    // Sobreescreve o método update para usar o caminho personalizado
    update(deltaTime) {
        if (this.health <= 0 || this.reachedEnd) return 0;
        
        const timeFactor = deltaTime / 1000;
        
        // Atualiza efeitos
        this.updateEffects(deltaTime);
        
        // Usa o caminho personalizado
        const targetPoint = this.customPath[this.pathIndex];
        
        // Calcula a direção para o próximo ponto
        const dx = targetPoint.x - this.x;
        const dy = targetPoint.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        // Se estamos perto o suficiente do ponto, avançamos para o próximo
        if (distance < 5) {
            this.pathIndex++;
            
            // Verifica se chegamos ao fim do caminho
            if (this.pathIndex >= this.customPath.length) {
                this.reachedEnd = true;
                return this.damage;
            }
        } else {
            // Move o inimigo em direção ao próximo ponto
            const moveDistance = this.speed * timeFactor;
            
            // Normaliza o vetor de direção
            const vx = dx / distance;
            const vy = dy / distance;
            
            // Atualiza posição
            this.x += vx * moveDistance;
            this.y += vy * moveDistance;
        }
        
        // Se chegou ao final, retorna o dano
        if (this.reachedEnd) {
            return this.damage;
        }
        
        return 0;
    }

    // Redesenha o inimigo com uma aparência diferente
    draw(ctx) {
        // Barra de vida
        this.drawHealthBar(ctx);
        
        // Efeito de "flutuação"
        const hoverOffset = Math.sin(Date.now() / 200) * 2;
        
        // Desenha um triângulo "voador"
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size / 2 + hoverOffset);
        ctx.lineTo(this.x + this.size / 2, this.y + this.size / 2 + hoverOffset);
        ctx.lineTo(this.x - this.size / 2, this.y + this.size / 2 + hoverOffset);
        ctx.closePath();
        ctx.fill();
        
        // Asinhas
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(this.x - this.size / 4, this.y - this.size / 4 + hoverOffset);
        ctx.lineTo(this.x - this.size, this.y + hoverOffset);
        ctx.lineTo(this.x - this.size / 4, this.y + this.size / 4 + hoverOffset);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + this.size / 4, this.y - this.size / 4 + hoverOffset);
        ctx.lineTo(this.x + this.size, this.y + hoverOffset);
        ctx.lineTo(this.x + this.size / 4, this.y + this.size / 4 + hoverOffset);
        ctx.closePath();
        ctx.fill();
        
        // Desenha efeitos de status
        this.drawEffects(ctx);
    }
}

// Inimigo Super Equilibrado - Versão aprimorada do Equilibrado
class SuperBalancedEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Super Equilibrado';
        this.description = 'Versão aprimorada do Equilibrado';
        this.category = 'Avançado';
        this.shape = 'circle';
        this.color = '#FF9800'; // Laranja
        this.maxHealth = 180;
        this.health = this.maxHealth;
        this.baseSpeed = 65;
        this.speed = this.baseSpeed;
        this.reward = 22;
        this.damage = 2;
        this.size = 17;
        this.resistanceFactor = 0.15; // 15% de resistência a dano
        this.slowResistance = 0.2; // 20% de resistência a lentidão
    }

    // Sobrescreve o método takeDamage para ter resistência parcial
    takeDamage(amount) {
        const reducedAmount = amount * (1 - this.resistanceFactor);
        return super.takeDamage(reducedAmount);
    }

    // Sobrescreve o método slow para ter resistência parcial
    slow(factor, duration) {
        // Aplica a resistência à lentidão
        const adjustedFactor = factor + (1 - factor) * this.slowResistance;
        super.slow(adjustedFactor, duration);
    }
}

// Inimigo Regenerador - Recupera vida com o tempo
class RegeneratingEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Regenerador';
        this.description = 'Recupera vida ao longo do tempo';
        this.category = 'Avançado';
        this.shape = 'circle';
        this.color = '#4CAF50'; // Verde
        this.maxHealth = 150;
        this.health = this.maxHealth;
        this.baseSpeed = 55;
        this.speed = this.baseSpeed;
        this.reward = 23;
        this.size = 16;
        this.regenAmount = 0.5; // Quantidade de vida regenerada por tick
        this.regenInterval = 300; // Intervalo de regeneração em ms
        this.lastRegenTime = 0;
    }

    // Sobrescreve update para incluir regeneração
    update(deltaTime) {
        // Regeneração de vida
        const now = Date.now();
        if (now - this.lastRegenTime > this.regenInterval && this.health > 0 && this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + this.regenAmount);
            this.lastRegenTime = now;
        }
        
        return super.update(deltaTime);
    }

    // Sobrescreve draw para mostrar efeito de regeneração
    draw(ctx) {
        super.draw(ctx);
        
        // Mostra efeito de regeneração
        if (this.health < this.maxHealth) {
            ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2 + 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

// INIMIGOS ELITE

// Inimigo Raio - Extremamente rápido e imune a lentidão, com chance de esquivar
class LightningEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Raio';
        this.description = 'Ultra rápido, imune a lentidão, com alta chance de esquivar';
        this.category = 'Elite';
        this.shape = 'triangle';
        this.color = '#FFEB3B'; // Amarelo
        this.maxHealth = 120;
        this.health = this.maxHealth;
        this.baseSpeed = 120;
        this.speed = this.baseSpeed;
        this.reward = 30;
        this.damage = 3;
        this.size = 15;
        
        // Efeito de rastro
        this.trail = [];
        for (let i = 0; i < 5; i++) {
            this.trail.push({ x: this.x, y: this.y, alpha: 0.8 - i * 0.15 });
        }
    }

    // Sobreescreve slow para ser imune
    slow(factor, duration) {
        // Completamente imune à lentidão
    }
    
    // Chance de esquivar ataques (2 em 3)
    takeDamage(amount, source = null) {
        // Gera um número aleatório entre 1 e 3
        const dodgeRoll = Math.floor(Math.random() * 3) + 1;
        
        // Se cair em 1 ou 2, esquiva do ataque
        if (dodgeRoll <= 2) {
            // Poderia adicionar um efeito visual de esquiva aqui
            return false; // Sem dano
        }
        
        // Caso contrário, aplica o dano normalmente
        return super.takeDamage(amount, source);
    }

    // Sobreescreve update para adicionar rastro
    update(deltaTime) {
        // Atualiza o rastro
        this.trail.pop(); // Remove o último elemento
        this.trail.unshift({ x: this.x, y: this.y, alpha: 0.8 }); // Adiciona a posição atual
        
        return super.update(deltaTime);
    }

    // Sobreescreve draw para incluir o rastro
    draw(ctx) {
        // Desenha o rastro
        for (let i = 0; i < this.trail.length; i++) {
            const trailPart = this.trail[i];
            ctx.fillStyle = `rgba(255, 235, 59, ${trailPart.alpha})`;
            ctx.beginPath();
            ctx.moveTo(trailPart.x, trailPart.y - this.size / 2 * (0.8 - i * 0.1));
            ctx.lineTo(trailPart.x + this.size / 2 * (0.8 - i * 0.1), trailPart.y + this.size / 2 * (0.8 - i * 0.1));
            ctx.lineTo(trailPart.x - this.size / 2 * (0.8 - i * 0.1), trailPart.y + this.size / 2 * (0.8 - i * 0.1));
            ctx.closePath();
            ctx.fill();
        }
        
        // Desenha o inimigo
        super.draw(ctx);
        
        // Adiciona efeito de eletricidade
        const numBolts = 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < numBolts; i++) {
            const angle = (Math.PI * 2 / numBolts) * i + Date.now() / 500;
            const length = this.size / 2 + 5;
            
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            
            // Cria um caminho em zigue-zague
            let x = this.x;
            let y = this.y;
            
            for (let j = 0; j < 3; j++) {
                const segmentLength = length / 3;
                const dirX = Math.cos(angle + j * 0.2);
                const dirY = Math.sin(angle + j * 0.2);
                
                x += dirX * segmentLength;
                y += dirY * segmentLength;
                
                // Adiciona um desvio aleatório
                const offsetX = Math.random() * 4 - 2;
                const offsetY = Math.random() * 4 - 2;
                
                ctx.lineTo(x + offsetX, y + offsetY);
            }
            
            ctx.stroke();
        }
    }
}

// Inimigo Bombado - Extremamente resistente
class ToughEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Bombado';
        this.description = 'Extremamente resistente e poderoso';
        this.category = 'Elite';
        this.shape = 'square';
        this.color = '#F44336'; // Vermelho forte
        this.maxHealth = 500;
        this.health = this.maxHealth;
        this.baseSpeed = 40;
        this.speed = this.baseSpeed;
        this.reward = 40;
        this.damage = 4;
        this.size = 22;
        this.damageReduction = 0.4; // 40% de redução de dano
    }

    // Sobreescreve takeDamage para ter alta resistência
    takeDamage(amount) {
        const reducedAmount = amount * (1 - this.damageReduction);
        return super.takeDamage(reducedAmount);
    }

    // Sobreescreve draw para ter aparência mais intimidadora
    draw(ctx) {
        // Barra de vida
        this.drawHealthBar(ctx);
        
        // Desenha o inimigo bombado
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x - this.size / 2,
            this.y - this.size / 2,
            this.size,
            this.size
        );
        
        // Detalhes adicionais para mostrar que é forte
        ctx.fillStyle = '#B71C1C'; // Vermelho mais escuro
        
        // Desenha quatro "espinhos" nos cantos
        const spikeSize = this.size / 4;
        
        // Espinho superior esquerdo
        ctx.beginPath();
        ctx.moveTo(this.x - this.size / 2, this.y - this.size / 2);
        ctx.lineTo(this.x - this.size / 2 - spikeSize, this.y - this.size / 2 - spikeSize);
        ctx.lineTo(this.x - this.size / 2, this.y - this.size / 2 + spikeSize);
        ctx.closePath();
        ctx.fill();
        
        // Espinho superior direito
        ctx.beginPath();
        ctx.moveTo(this.x + this.size / 2, this.y - this.size / 2);
        ctx.lineTo(this.x + this.size / 2 + spikeSize, this.y - this.size / 2 - spikeSize);
        ctx.lineTo(this.x + this.size / 2, this.y - this.size / 2 + spikeSize);
        ctx.closePath();
        ctx.fill();
        
        // Espinho inferior direito
        ctx.beginPath();
        ctx.moveTo(this.x + this.size / 2, this.y + this.size / 2);
        ctx.lineTo(this.x + this.size / 2 + spikeSize, this.y + this.size / 2 + spikeSize);
        ctx.lineTo(this.x + this.size / 2 - spikeSize, this.y + this.size / 2);
        ctx.closePath();
        ctx.fill();
        
        // Espinho inferior esquerdo
        ctx.beginPath();
        ctx.moveTo(this.x - this.size / 2, this.y + this.size / 2);
        ctx.lineTo(this.x - this.size / 2 - spikeSize, this.y + this.size / 2 + spikeSize);
        ctx.lineTo(this.x - this.size / 2 + spikeSize, this.y + this.size / 2);
        ctx.closePath();
        ctx.fill();
        
        // Desenha efeitos de status
        this.drawEffects(ctx);
    }
}

// Inimigo Gárgula - Voador avançado que periodicamente fica invulnerável
class GargoyleEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Gárgula';
        this.description = 'Voa e fica invulnerável periodicamente. Imune a torres de canhão, gelo e balista';
        this.category = 'Elite';
        this.shape = 'diamond';
        this.color = '#607D8B'; // Cinza azulado
        this.maxHealth = 200;
        this.health = this.maxHealth;
        this.baseSpeed = 60;
        this.speed = this.baseSpeed;
        this.reward = 35;
        this.damage = 3;
        this.size = 18;
        
        // Propriedades para a invulnerabilidade
        this.invulnerable = false;
        this.invulnerabilityDuration = 2000; // 2 segundos
        this.invulnerabilityInterval = 5000; // A cada 5 segundos
        this.lastInvulnerabilityTime = 0;
        
        // Cria caminho personalizado (como o voador)
        this.createShorterPath();
    }

    // Cria um caminho mais curto (como o voador)
    createShorterPath() {
        const originalPath = this.map.pathPixels;
        
        // Cria um caminho ainda mais curto que o voador normal
        const shortPath = [];
        shortPath.push(originalPath[0]); // Ponto inicial
        
        // Adiciona apenas alguns pontos estratégicos
        const step = Math.max(1, Math.floor(originalPath.length / 2));
        for (let i = step; i < originalPath.length; i += step) {
            shortPath.push(originalPath[i]);
        }
        
        // Adiciona o ponto final
        if (shortPath[shortPath.length - 1] !== originalPath[originalPath.length - 1]) {
            shortPath.push(originalPath[originalPath.length - 1]);
        }
        
        this.customPath = shortPath;
    }

    // Sobrescreve update para incluir a mecânica de invulnerabilidade
    update(deltaTime) {
        const now = Date.now();
        
        // Gerencia o ciclo de invulnerabilidade
        if (!this.invulnerable && now - this.lastInvulnerabilityTime > this.invulnerabilityInterval) {
            this.invulnerable = true;
            this.lastInvulnerabilityTime = now;
            setTimeout(() => {
                this.invulnerable = false;
            }, this.invulnerabilityDuration);
        }
        
        // Usa o caminho personalizado (como o voador)
        if (this.health <= 0 || this.reachedEnd) return 0;
        
        const timeFactor = deltaTime / 1000;
        
        // Atualiza efeitos
        this.updateEffects(deltaTime);
        
        // Usa o caminho personalizado
        const targetPoint = this.customPath[this.pathIndex];
        
        // Calcula a direção para o próximo ponto
        const dx = targetPoint.x - this.x;
        const dy = targetPoint.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        // Se estamos perto o suficiente do ponto, avançamos para o próximo
        if (distance < 5) {
            this.pathIndex++;
            
            // Verifica se chegamos ao fim do caminho
            if (this.pathIndex >= this.customPath.length) {
                this.reachedEnd = true;
                return this.damage;
            }
        } else {
            // Move o inimigo em direção ao próximo ponto
            const moveDistance = this.speed * timeFactor;
            
            // Normaliza o vetor de direção
            const vx = dx / distance;
            const vy = dy / distance;
            
            // Atualiza posição
            this.x += vx * moveDistance;
            this.y += vy * moveDistance;
        }
        
        // Se chegou ao final, retorna o dano
        if (this.reachedEnd) {
            return this.damage;
        }
        
        return 0;
    }

    // Sobrescreve takeDamage para implementar invulnerabilidade
    takeDamage(amount, source = null) {
        // Imunidade a torres específicas
        if (source === 'canhao' || source === 'gelo' || source === 'balista') {
            return false; // Sem dano
        }
        
        // Verifica a invulnerabilidade temporária
        if (this.invulnerable) {
            return false; // Não recebe dano quando invulnerável
        }
        return super.takeDamage(amount, source);
    }

    // Sobrescreve draw para mostrar o efeito de invulnerabilidade
    draw(ctx) {
        // Efeito de "flutuação"
        const hoverOffset = Math.sin(Date.now() / 200) * 2;
        
        // Barra de vida
        this.drawHealthBar(ctx);
        
        // Cor base com efeito de invulnerabilidade
        let baseColor = this.invulnerable ? '#B0BEC5' : this.color;
        
        // Corpo do gárgula (diamante)
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size / 2 + hoverOffset);
        ctx.lineTo(this.x + this.size / 2, this.y + hoverOffset);
        ctx.lineTo(this.x, this.y + this.size / 2 + hoverOffset);
        ctx.lineTo(this.x - this.size / 2, this.y + hoverOffset);
        ctx.closePath();
        ctx.fill();
        
        // Asas
        const wingColor = this.invulnerable ? 'rgba(255, 255, 255, 0.7)' : 'rgba(96, 125, 139, 0.5)';
        ctx.fillStyle = wingColor;
        
        // Asa esquerda
        ctx.beginPath();
        ctx.moveTo(this.x - this.size / 4, this.y - this.size / 6 + hoverOffset);
        ctx.lineTo(this.x - this.size, this.y - this.size / 3 + hoverOffset);
        ctx.lineTo(this.x - this.size / 2, this.y + this.size / 4 + hoverOffset);
        ctx.closePath();
        ctx.fill();
        
        // Asa direita
        ctx.beginPath();
        ctx.moveTo(this.x + this.size / 4, this.y - this.size / 6 + hoverOffset);
        ctx.lineTo(this.x + this.size, this.y - this.size / 3 + hoverOffset);
        ctx.lineTo(this.x + this.size / 2, this.y + this.size / 4 + hoverOffset);
        ctx.closePath();
        ctx.fill();
        
        // Efeito de invulnerabilidade
        if (this.invulnerable) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.arc(this.x, this.y + hoverOffset, this.size, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Desenha efeitos de status
        this.drawEffects(ctx);
    }
}

// Inimigo Divisor - Se divide em dois inimigos menores quando destruído
class SplitterEnemy extends Enemy {
    constructor(map, level = 1, splitCount = 0) {
        super(map);
        this.type = 'Divisor';
        this.description = 'Se divide em dois quando destruído';
        this.category = 'Elite';
        this.shape = 'square';
        this.color = '#8BC34A'; // Verde claro
        this.level = level; // Nível do divisor (1 = original, 2 = primeira divisão, 3 = segunda divisão)
        this.splitCount = splitCount; // Contador de divisões
        this.maxSplits = 2; // Máximo de divisões
        
        // Ajusta atributos baseados no nível
        this.size = 20 - (level - 1) * 5; // Diminui o tamanho com cada divisão
        this.maxHealth = 160 / level;
        this.health = this.maxHealth;
        this.baseSpeed = 50 + level * 10; // Fica mais rápido com cada divisão
        this.speed = this.baseSpeed;
        this.reward = Math.floor(25 / level); // Menos recompensa para as divisões
        this.damage = Math.ceil(2 / level); // Menos dano para as divisões
    }

    // Método para criar inimigos divididos
    split() {
        // Só divide se ainda não atingiu o máximo de divisões
        if (this.splitCount >= this.maxSplits) {
            return [];
        }
        
        // Cria dois inimigos menores
        const newLevel = this.level + 1;
        const newSplitCount = this.splitCount + 1;
        
        const splitEnemy1 = new SplitterEnemy(this.map, newLevel, newSplitCount);
        const splitEnemy2 = new SplitterEnemy(this.map, newLevel, newSplitCount);
        
        // Define a posição inicial dos novos inimigos (um pouco deslocados do original)
        splitEnemy1.x = this.x - 10;
        splitEnemy1.y = this.y - 10;
        splitEnemy1.pathIndex = this.pathIndex;
        
        splitEnemy2.x = this.x + 10;
        splitEnemy2.y = this.y + 10;
        splitEnemy2.pathIndex = this.pathIndex;
        
        return [splitEnemy1, splitEnemy2];
    }

    // Desenho personalizado para mostrar que pode se dividir
    draw(ctx) {
        // Barra de vida
        this.drawHealthBar(ctx);
        
        // Corpo principal (quadrado)
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x - this.size / 2,
            this.y - this.size / 2,
            this.size,
            this.size
        );
        
        // Linhas de divisão
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        
        // Linha diagonal 1
        ctx.beginPath();
        ctx.moveTo(this.x - this.size / 2, this.y - this.size / 2);
        ctx.lineTo(this.x + this.size / 2, this.y + this.size / 2);
        ctx.stroke();
        
        // Linha diagonal 2
        ctx.beginPath();
        ctx.moveTo(this.x + this.size / 2, this.y - this.size / 2);
        ctx.lineTo(this.x - this.size / 2, this.y + this.size / 2);
        ctx.stroke();
        
        // Desenha efeitos de status
        this.drawEffects(ctx);
    }
}

// Inimigo Semi-Imortal - Se recupera completamente uma vez quando morre
class SemiImmortalEnemy extends Enemy {
    constructor(map) {
        super(map);
        this.type = 'Semi-Imortal';
        this.description = 'Recupera-se completamente uma vez quando morre';
        this.category = 'Elite';
        this.shape = 'star';
        this.color = '#FF5722'; // Laranja avermelhado
        this.maxHealth = 200;
        this.health = this.maxHealth;
        this.baseSpeed = 50;
        this.speed = this.baseSpeed;
        this.reward = 45;
        this.damage = 3;
        this.size = 18;
        this.resurrected = false; // Marca se já foi ressuscitado
        this.resurrectingAnimation = false;
        this.resurrectProgress = 0;
    }

    // Sobrescreve takeDamage para implementar a ressurreição
    takeDamage(amount) {
        super.takeDamage(amount);
        
        // Se morreu e ainda não foi ressuscitado, inicia a animação de ressurreição
        if (this.health <= 0 && !this.resurrected && !this.resurrectingAnimation) {
            this.resurrectingAnimation = true;
            this.resurrectProgress = 0;
            
            // Inicia o processo de ressurreição
            setTimeout(() => {
                this.resurrected = true;
                this.resurrectingAnimation = false;
                this.health = this.maxHealth;
                this.color = '#FFC107'; // Muda de cor após ressuscitar
            }, 2000); // 2 segundos para ressuscitar
            
            return false; // Não morreu de verdade
        }
        
        return this.health <= 0 && this.resurrected;
    }

    // Sobrescreve update para pausar durante a ressurreição
    update(deltaTime) {
        // Se está ressuscitando, pausa o movimento
        if (this.resurrectingAnimation) {
            this.resurrectProgress += deltaTime / 2000; // Progresso de 0 a 1 ao longo de 2 segundos
            return 0;
        }
        
        return super.update(deltaTime);
    }

    // Sobrescreve draw para mostrar a animação de ressurreição
    draw(ctx) {
        if (this.resurrectingAnimation) {
            // Animação de ressurreição
            this.drawResurrectionAnimation(ctx);
        } else {
            // Barra de vida
            this.drawHealthBar(ctx);
            
            // Corpo do inimigo (estrela)
            ctx.fillStyle = this.color;
            
            const spikes = 5;
            const outerRadius = this.size / 2;
            const innerRadius = this.size / 4;
            
            ctx.beginPath();
            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI / spikes) * i - Math.PI / 2;
                
                ctx.lineTo(
                    this.x + Math.cos(angle) * radius,
                    this.y + Math.sin(angle) * radius
                );
            }
            ctx.closePath();
            ctx.fill();
            
            // Se já foi ressuscitado, adiciona um halo
            if (this.resurrected) {
                ctx.strokeStyle = 'rgba(255, 193, 7, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            // Desenha efeitos de status
            this.drawEffects(ctx);
        }
    }

    // Método para desenhar a animação de ressurreição
    drawResurrectionAnimation(ctx) {
        const pulseSize = this.size * (1 + Math.sin(this.resurrectProgress * Math.PI) * 0.5);
        
        // Círculo pulsante
        ctx.fillStyle = `rgba(255, 193, 7, ${Math.sin(this.resurrectProgress * Math.PI)})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Estrela em formação
        ctx.fillStyle = this.color;
        const spikes = 5;
        const outerRadius = this.size / 2 * this.resurrectProgress;
        const innerRadius = this.size / 4 * this.resurrectProgress;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI / spikes) * i - Math.PI / 2;
            
            ctx.lineTo(
                this.x + Math.cos(angle) * radius,
                this.y + Math.sin(angle) * radius
            );
        }
        ctx.closePath();
        ctx.fill();
        
        // Texto "Ressuscitando..."
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Ressuscitando...', this.x, this.y - this.size);
    }
}

// Exporta as classes para uso global
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
