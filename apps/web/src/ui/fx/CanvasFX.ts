/**
 * Canvas FX System - 모바일 게임급 시각 효과 엔진
 * 오델로 나이트: 인피니트 탑
 */

export interface FXConfig {
  color: {
    spark: string;
    swap: string;
    glow: string;
    portal: string;
    starfield: string;
  };
  limits: {
    home: number;
    battle: number;
  };
  timing: {
    flip: number;
    ring: number;
    pulse: number;
  };
}

export const DEFAULT_FX_CONFIG: FXConfig = {
  color: {
    spark: '#E7B142',    // 톤다운 적용 (design-feedback.md 5번)
    swap: '#FDE68A',
    glow: '#E7B142',     // 골드 통합
    portal: '#7C6AF0',   // 톤다운 적용 (design-feedback.md 5번)
    starfield: '#E5E7EB'
  },
  limits: {
    home: 120,      // 150 → 120 (design-feedback.md 7번)
    battle: 320     // 250 → 320 (480→320 상한선)
  },
  timing: {
    flip: 160,      // design-feedback.md 3번: 160ms 유지
    ring: 180,      // design-feedback.md 4번: 180ms 유지
    pulse: 2000
  }
};

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  type: 'spark' | 'trail' | 'star' | 'burst' | 'ripple';
  data?: any;
}

export interface FXLayer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  particles: Particle[];
  lastUpdate: number;
  active: boolean;
}

export class CanvasFX {
  private layers: Map<string, FXLayer> = new Map();
  private config: FXConfig;
  private animationFrame: number = 0;
  private devicePixelRatio: number;
  private eventBus: EventTarget;
  private particleCount = 0;

  constructor(config: FXConfig = DEFAULT_FX_CONFIG) {
    this.config = config;
    this.devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2); // 2x 제한
    this.eventBus = new EventTarget();
    this.setupEventListeners();
  }

  createLayer(name: string, container: HTMLElement, width: number, height: number): FXLayer {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // HiDPI 설정
    const pixelWidth = width * this.devicePixelRatio;
    const pixelHeight = height * this.devicePixelRatio;

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '10';

    ctx.scale(this.devicePixelRatio, this.devicePixelRatio);

    container.appendChild(canvas);

    const layer: FXLayer = {
      canvas,
      ctx,
      particles: [],
      lastUpdate: 0,
      active: true
    };

    this.layers.set(name, layer);
    return layer;
  }

  private setupEventListeners() {
    // 게임 이벤트 리스너
    this.eventBus.addEventListener('game:flipStart', this.handleFlipStart.bind(this) as EventListener);
    this.eventBus.addEventListener('game:place', this.handlePlace.bind(this) as EventListener);
    this.eventBus.addEventListener('ui:modalOpen', this.handleModalOpen.bind(this) as EventListener);
    this.eventBus.addEventListener('tower:progress', this.handleTowerProgress.bind(this) as EventListener);
  }

  private handleFlipStart(event: CustomEvent) {
    const { disc, x, y } = event.detail;
    this.discFlip(x, y, disc.color);
    this.flipBurst(x, y);
  }

  private handlePlace(event: CustomEvent) {
    const { x, y } = event.detail;
    this.landingRipple(x, y);
  }

  private handleModalOpen(event: CustomEvent) {
    const { element } = event.detail;
    this.portalRing(element);
  }

  private handleTowerProgress(event: CustomEvent) {
    const { node } = event.detail;
    this.nodeSpark(node.x, node.y);
  }

  // FX 효과 메서드들
  starfield(layerName: string, count: number = 28) {   // design-feedback.md 1번: 60→28개
    const layer = this.layers.get(layerName);
    if (!layer) return;

    const width = layer.canvas.width / this.devicePixelRatio;
    const height = layer.canvas.height / this.devicePixelRatio;

    for (let i = 0; i < count; i++) {
      const particle: Particle = {
        id: `star_${Date.now()}_${i}`,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: 1,
        maxLife: 1,
        size: Math.random() * 2 + 0.5,
        color: this.config.color.starfield,
        alpha: Math.random() * 0.18 + 0.02,  // design-feedback.md 1번: α 0.35→0.18
        type: 'star',
        data: { pulsePhase: Math.random() * Math.PI * 2 }
      };
      layer.particles.push(particle);
    }
    this.particleCount += count;
  }

  portalRing(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // DOM 전환과 함께 포탈 링 효과
    const rings = 3;
    for (let ring = 0; ring < rings; ring++) {
      setTimeout(() => {
        this.createRingExpansion(centerX, centerY, ring * 20 + 30);
      }, ring * 60);
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([10]);
    }
  }

  private createRingExpansion(x: number, y: number, maxRadius: number) {
    // design-feedback.md 1번: ring radius 38→120px (기존 140)
    const ringCount = Math.min(16, Math.max(8, maxRadius / 10)); // 적응적 파티클 수
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2;
      const particle: Particle = {
        id: `ring_${Date.now()}_${i}`,
        x: x,
        y: y,
        vx: Math.cos(angle) * 2,  // 속도 감소
        vy: Math.sin(angle) * 2,
        life: this.config.timing.ring,
        maxLife: this.config.timing.ring,
        size: 3,
        color: this.config.color.portal,
        alpha: 0.22,  // design-feedback.md 1번: glow alpha 0.35→0.22
        type: 'burst',
        data: { angle, maxRadius }
      };

      // 활성 레이어 찾아서 추가
      const activeLayer = Array.from(this.layers.values()).find(l => l.active);
      if (activeLayer) {
        activeLayer.particles.push(particle);
        this.particleCount++;
      }
    }
  }

  glowPulse(element: HTMLElement) {
    const rect = element.getBoundingClientRect();

    // CSS 글로우와 함께 파티클 글로우
    element.style.transition = 'box-shadow 0.5s ease';
    element.style.boxShadow = `0 0 20px ${this.config.color.glow}80`;

    setTimeout(() => {
      element.style.boxShadow = '';
    }, 500);
  }

  discFlip(x: number, y: number, color: string) {
    // 디스크 뒤집기 애니메이션용 파티클들 (성능 최적화 - 렌더링 부하 감소)
    const flipParticles = 4; // 6 -> 4개로 감소
    const battleLayer = this.layers.get('battle');

    if (!battleLayer) return;

    // 파티클 생성을 일괄 처리
    const newParticles: Particle[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < flipParticles; i++) {
      const angle = (i / flipParticles) * Math.PI * 2;

      newParticles.push({
        id: `flip_${timestamp}_${i}`,
        x: x,
        y: y,
        vx: Math.cos(angle) * 1.2, // 1.5 -> 1.2로 속도 감소
        vy: Math.sin(angle) * 1.2,
        life: this.config.timing.flip,
        maxLife: this.config.timing.flip,
        size: 3, // 4 -> 3으로 크기 감소
        color: color === 'black' ? '#1F2937' : '#F9FAFB',
        alpha: 0.8, // 0.9 -> 0.8로 투명도 감소
        type: 'spark',
        data: { flipPhase: 0 }
      });
    }

    // 일괄 추가로 성능 향상
    battleLayer.particles.push(...newParticles);
    this.particleCount += newParticles.length;
  }

  flipBurst(x: number, y: number) {
    // design-feedback.md 3번: 파티클 총량 디스크당 36→14
    const burstCount = 10;  // 24→10발 (design-feedback.md 2번)

    for (let i = 0; i < burstCount; i++) {
      const angle = (i / burstCount) * Math.PI * 2;
      const speed = Math.random() * 4 + 2;

      const particle: Particle = {
        id: `burst_${Date.now()}_${i}`,
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 380 + Math.random() * 220,
        maxLife: 600,
        size: Math.random() * 3 + 1,
        color: this.config.color.spark,
        alpha: 0.8,
        type: 'burst',
        data: {}
      };

      const battleLayer = this.layers.get('battle');
      if (battleLayer) {
        battleLayer.particles.push(particle);
        this.particleCount++;
      }
    }
  }

  landingRipple(x: number, y: number) {
    // 착수 지점 리플 효과
    const ripples = 2;

    for (let ring = 0; ring < ripples; ring++) {
      setTimeout(() => {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const particle: Particle = {
            id: `ripple_${Date.now()}_${ring}_${i}`,
            x: x,
            y: y,
            vx: Math.cos(angle) * (1 + ring * 0.5),
            vy: Math.sin(angle) * (1 + ring * 0.5),
            life: 420,
            maxLife: 420,
            size: 2,
            color: this.config.color.glow,
            alpha: 0.6 - ring * 0.2,
            type: 'ripple',
            data: { ring }
          };

          const battleLayer = this.layers.get('battle');
          if (battleLayer) {
            battleLayer.particles.push(particle);
            this.particleCount++;
          }
        }
      }, ring * 100);
    }
  }

  nodeSpark(x: number, y: number) {
    // design-feedback.md 2번: NODE_SPARK 24발→10발
    const sparkCount = 10;

    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2;
      const particle: Particle = {
        id: `node_spark_${Date.now()}_${i}`,
        x: x,
        y: y,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2 - 1, // 약간 위로
        life: 200,      // design-feedback.md 2번: 300ms→200ms
        maxLife: 200,
        size: Math.random() * 2 + 1,
        color: this.config.color.spark,
        alpha: 1,
        type: 'spark',
        data: {}
      };

      const towerLayer = this.layers.get('tower');
      if (towerLayer) {
        towerLayer.particles.push(particle);
        this.particleCount++;
      }
    }
  }

  errorShake(element: HTMLElement) {
    // DOM 엘리먼트 쉐이크 + 파티클
    const originalTransform = element.style.transform;

    const shake = [
      'translateX(-2px)',
      'translateX(2px)',
      'translateX(-1px)',
      'translateX(1px)',
      'translateX(0px)'
    ];

    shake.forEach((transform, i) => {
      setTimeout(() => {
        element.style.transform = transform;
        if (i === shake.length - 1) {
          element.style.transform = originalTransform;
        }
      }, i * 25);
    });

    // 경고 파티클
    const rect = element.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      const particle: Particle = {
        id: `error_${Date.now()}_${i}`,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 120,
        maxLife: 120,
        size: 3,
        color: '#EF4444',
        alpha: 0.8,
        type: 'burst',
        data: {}
      };

      const activeLayer = Array.from(this.layers.values()).find(l => l.active);
      if (activeLayer) {
        activeLayer.particles.push(particle);
        this.particleCount++;
      }
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 20, 50]);
    }
  }

  private updateParticle(particle: Particle, deltaTime: number) {
    particle.life -= deltaTime;
    particle.x += particle.vx * deltaTime / 16;
    particle.y += particle.vy * deltaTime / 16;

    // 생명주기별 알파 조정
    const lifeFactor = particle.life / particle.maxLife;
    particle.alpha = Math.max(0, lifeFactor);

    // 타입별 특수 업데이트
    switch (particle.type) {
      case 'star':
        if (particle.data) {
          particle.data.pulsePhase += deltaTime * 0.003;
          particle.alpha = 0.3 + 0.5 * Math.sin(particle.data.pulsePhase);
        }
        break;
      case 'ripple':
        particle.size += deltaTime * 0.05;
        break;
      case 'burst':
        particle.vy += deltaTime * 0.01; // 중력
        break;
    }

    return particle.life > 0;
  }

  private renderParticle(ctx: CanvasRenderingContext2D, particle: Particle) {
    ctx.save();
    ctx.globalAlpha = particle.alpha;
    ctx.fillStyle = particle.color;

    switch (particle.type) {
      case 'star':
        this.renderStar(ctx, particle);
        break;
      case 'spark':
        this.renderSpark(ctx, particle);
        break;
      case 'ripple':
        this.renderRipple(ctx, particle);
        break;
      case 'burst':
        this.renderBurst(ctx, particle);
        break;
      default:
        this.renderDefault(ctx, particle);
    }

    ctx.restore();
  }

  private renderStar(ctx: CanvasRenderingContext2D, particle: Particle) {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderSpark(ctx: CanvasRenderingContext2D, particle: Particle) {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();

    // 글로우 효과
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = particle.size * 2;
    ctx.fill();
  }

  private renderRipple(ctx: CanvasRenderingContext2D, particle: Particle) {
    ctx.strokeStyle = particle.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.stroke();
  }

  private renderBurst(ctx: CanvasRenderingContext2D, particle: Particle) {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderDefault(ctx: CanvasRenderingContext2D, particle: Particle) {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }

  update(deltaTime: number) {
    for (const [name, layer] of this.layers) {
      if (!layer.active) continue;

      // 파티클 업데이트
      layer.particles = layer.particles.filter(particle => {
        const alive = this.updateParticle(particle, deltaTime);
        if (!alive) this.particleCount--;
        return alive;
      });

      // 파티클 수 제한
      const limit = name === 'battle' ? this.config.limits.battle : this.config.limits.home;
      if (layer.particles.length > limit) {
        const excess = layer.particles.length - limit;
        layer.particles.splice(0, excess);
        this.particleCount -= excess;
        // 성능 최적화: 경고 메시지 제거 (프로덕션)
      }
    }
  }

  render() {
    for (const [name, layer] of this.layers) {
      if (!layer.active || layer.particles.length === 0) continue;

      const ctx = layer.ctx;
      // 더티 렉트 최적화: 파티클이 없으면 클리어 스킵
      ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);

      layer.particles.forEach(particle => {
        this.renderParticle(ctx, particle);
      });
    }
  }

  start() {
    let lastTime = 0;
    let frameCount = 0;
    let skipFrames = 0;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;

      // design-feedback.md 1번: fps 30 그대로, but idle 시 15fps로 다운스케일
      const targetFPS = this.particleCount < 50 ? 15 : 30;  // idle 감지
      const targetDelay = 1000 / targetFPS;

      if (deltaTime < targetDelay) {
        this.animationFrame = requestAnimationFrame(animate);
        return;
      }

      // 렉 감지: deltaTime이 너무 크면 프레임 스킵
      if (deltaTime > 100) {
        skipFrames++;
        if (skipFrames > 3) {
          // 3프레임 연속 렉이면 파티클 수 강제 감소
          for (const layer of this.layers.values()) {
            if (layer.particles.length > 50) {
              layer.particles.splice(0, Math.floor(layer.particles.length * 0.3));
            }
          }
          skipFrames = 0;
        }
      } else {
        skipFrames = 0;
      }

      lastTime = currentTime;
      frameCount++;

      this.update(deltaTime);
      this.render();

      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
  }

  emit(eventName: string, detail: any) {
    this.eventBus.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  on(eventName: string, handler: EventListener) {
    this.eventBus.addEventListener(eventName, handler);
  }

  off(eventName: string, handler: EventListener) {
    this.eventBus.removeEventListener(eventName, handler);
  }

  setLayer(name: string, active: boolean) {
    const layer = this.layers.get(name);
    if (layer) {
      layer.active = active;
    }
  }

  getStats() {
    return {
      particleCount: this.particleCount,
      layerCount: this.layers.size,
      activeLayerCount: Array.from(this.layers.values()).filter(l => l.active).length
    };
  }

  destroy() {
    this.stop();

    for (const [name, layer] of this.layers) {
      layer.canvas.remove();
    }

    this.layers.clear();
    this.particleCount = 0;
  }
}

// 전역 FX 인스턴스
export const fx = new CanvasFX();