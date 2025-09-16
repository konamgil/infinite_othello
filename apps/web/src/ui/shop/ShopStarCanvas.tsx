import React, { useEffect, useRef } from 'react';

interface ShopStarCanvasProps {
  className?: string;
}

export function ShopStarCanvas({ className = '' }: ShopStarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 상점 아이템들 (보석처럼 반짝이는)
    const shopItems: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
      twinkle: number;
      type: 'gem' | 'coin' | 'chest';
    }> = [];

    // 금화들 (떠다니는)
    const coins: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      rotation: number;
      rotationSpeed: number;
      drift: number;
    }> = [];

    // 보석/아이템들 초기화
    for (let i = 0; i < 20; i++) {
      shopItems.push({
        x: Math.random() * canvas.width / window.devicePixelRatio,
        y: Math.random() * canvas.height / window.devicePixelRatio,
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.7 + 0.3,
        color: ['#FF6B35', '#F7931E', '#FFD23F', '#A8E6CF', '#88D8B0'][Math.floor(Math.random() * 5)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        twinkle: Math.random() * 0.03 + 0.01,
        type: ['gem', 'coin', 'chest'][Math.floor(Math.random() * 3)] as 'gem' | 'coin' | 'chest'
      });
    }

    // 금화들 초기화
    for (let i = 0; i < 15; i++) {
      coins.push({
        x: Math.random() * canvas.width / window.devicePixelRatio,
        y: Math.random() * canvas.height / window.devicePixelRatio,
        size: Math.random() * 3 + 1.5,
        opacity: Math.random() * 0.5 + 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        drift: Math.random() * 0.8 + 0.3
      });
    }

    let time = 0;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // 상점 배경 그라디언트 (부유함을 상징)
      const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
      gradient.addColorStop(0, '#2D1B69');    // 깊은 보라
      gradient.addColorStop(0.3, '#1E3A8A');  // 진한 파랑
      gradient.addColorStop(0.7, '#7C3AED');  // 보라
      gradient.addColorStop(1, '#2D1B69');    // 다시 깊은 보라

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // 부의 오라 (황금빛)
      ctx.save();
      const auraGrad = ctx.createRadialGradient(
        rect.width * 0.5, rect.height * 0.4, 0,
        rect.width * 0.5, rect.height * 0.4, rect.width * 0.7
      );
      auraGrad.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
      auraGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(rect.width * 0.5, rect.height * 0.4, rect.width * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 상점 아이템들 그리기
      shopItems.forEach(item => {
        const twinkle = Math.sin(time * item.twinkle) * 0.4 + 0.6;
        const currentOpacity = item.opacity * twinkle;

        item.rotation += item.rotationSpeed;

        ctx.save();
        ctx.globalAlpha = currentOpacity;
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);

        ctx.fillStyle = item.color;
        ctx.shadowBlur = item.size * 2.5;
        ctx.shadowColor = item.color;

        if (item.type === 'gem') {
          // 보석 그리기 (다이아몬드 모양)
          ctx.beginPath();
          ctx.moveTo(0, -item.size);
          ctx.lineTo(item.size * 0.6, -item.size * 0.3);
          ctx.lineTo(item.size * 0.6, item.size * 0.3);
          ctx.lineTo(0, item.size);
          ctx.lineTo(-item.size * 0.6, item.size * 0.3);
          ctx.lineTo(-item.size * 0.6, -item.size * 0.3);
          ctx.closePath();
          ctx.fill();

          // 보석 내부 반사
          ctx.globalAlpha = currentOpacity * 0.7;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.moveTo(0, -item.size * 0.6);
          ctx.lineTo(item.size * 0.3, -item.size * 0.2);
          ctx.lineTo(0, item.size * 0.2);
          ctx.lineTo(-item.size * 0.3, -item.size * 0.2);
          ctx.closePath();
          ctx.fill();

        } else if (item.type === 'coin') {
          // 동전 그리기
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.ellipse(0, 0, item.size, item.size * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();

          // 동전 테두리
          ctx.strokeStyle = '#FFA500';
          ctx.lineWidth = item.size * 0.1;
          ctx.stroke();

        } else if (item.type === 'chest') {
          // 보물상자 그리기
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(-item.size * 0.8, -item.size * 0.6, item.size * 1.6, item.size * 1.2);

          // 보물상자 뚜껑
          ctx.fillStyle = '#A0522D';
          ctx.fillRect(-item.size * 0.8, -item.size * 0.6, item.size * 1.6, item.size * 0.4);

          // 자물쇠
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(-item.size * 0.2, -item.size * 0.4, item.size * 0.4, item.size * 0.3);
        }

        ctx.restore();
      });

      // 떠다니는 금화들
      coins.forEach(coin => {
        coin.y -= coin.drift;
        coin.rotation += coin.rotationSpeed;

        if (coin.y < -10) {
          coin.y = rect.height + 10;
          coin.x = Math.random() * rect.width;
        }

        ctx.save();
        ctx.globalAlpha = coin.opacity * (Math.sin(time * 0.008) * 0.3 + 0.7);
        ctx.translate(coin.x, coin.y);
        ctx.rotate(coin.rotation);

        // 금화 그리기
        ctx.fillStyle = '#FFD700';
        ctx.shadowBlur = coin.size * 2;
        ctx.shadowColor = '#FFD700';

        ctx.beginPath();
        ctx.ellipse(0, 0, coin.size, coin.size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 금화 안의 무늬
        ctx.globalAlpha = coin.opacity * 0.8;
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.ellipse(0, 0, coin.size * 0.6, coin.size * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // 상점의 마법 입자들
      ctx.save();
      ctx.globalAlpha = 0.2;
      for (let i = 0; i < 8; i++) {
        const magicX = (time * 0.4 + i * 60) % rect.width;
        const magicY = rect.height * 0.6 + Math.sin(time * 0.01 + i) * 120;

        const colors = ['#FF6B35', '#F7931E', '#FFD23F'];
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.arc(magicX, magicY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 떠다니는 RP 아이콘들
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.font = '16px Arial';
      for (let i = 0; i < 6; i++) {
        const rpX = (time * 0.2 + i * 80) % rect.width;
        const rpY = rect.height * 0.3 + Math.sin(time * 0.006 + i) * 60;

        ctx.fillStyle = '#90EE90';
        ctx.fillText('RP', rpX, rpY);
      }
      ctx.restore();

      time++;
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ background: 'linear-gradient(135deg, #2D1B69 0%, #1E3A8A 50%, #7C3AED 100%)' }}
    />
  );
}