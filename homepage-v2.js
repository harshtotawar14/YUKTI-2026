(() => {
  'use strict';

  const stepText = {
    0: 'Service, location and time — submitted in one short form.',
    1: 'Skill, documents and availability checked before anything else.',
    2: 'Suitability is ranked with an explainable, reason-coded trail.',
    3: 'The worker accepts or declines — without penalty.',
    4: 'Booking-linked OTP or QR confirms the right worker on site.',
    5: 'Bill, payment, rating and audit are saved to one record.'
  };

  function wireSteps() {
    const steps = [...document.querySelectorAll('#landing .step')];
    const detailWrap = document.querySelector('#landing .step-detail');
    const detailText = document.getElementById('stepDetailText');
    if (!steps.length || !detailWrap || !detailText) return;
    let openIndex = null;
    steps.forEach(button => button.addEventListener('click', () => {
      const index = button.dataset.i;
      if (openIndex === index) {
        detailWrap.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
        openIndex = null;
        return;
      }
      steps.forEach(step => step.setAttribute('aria-expanded', 'false'));
      button.setAttribute('aria-expanded', 'true');
      detailText.textContent = stepText[index];
      detailWrap.classList.add('open');
      openIndex = index;
    }));
  }

  function startNetworkCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodeCount = 54;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const points = Array.from({ length: nodeCount }, (_, index) => {
      const y = 1 - (index / (nodeCount - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const angle = goldenAngle * index;
      return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius, accent: index % 7 === 0 };
    });

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let time = 0;
    let frame = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      pixelRatio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function palette() {
      const styles = getComputedStyle(document.getElementById('landing'));
      return {
        ink: styles.getPropertyValue('--ink').trim() || '#152B3B',
        teal: styles.getPropertyValue('--teal').trim() || '#0E5F53',
        amber: styles.getPropertyValue('--amber').trim() || '#C57A2C',
        background: styles.getPropertyValue('--bg').trim() || '#F3F4EF'
      };
    }

    function project(point, angle) {
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      const x = point.x * cosine - point.z * sine;
      const z = point.x * sine + point.z * cosine;
      const tilt = .17;
      const y = point.y * Math.cos(tilt) - z * Math.sin(tilt);
      const depth = point.y * Math.sin(tilt) + z * Math.cos(tilt);
      const scale = Math.min(width, height) * .36;
      return { x: width / 2 + x * scale, y: height / 2 + y * scale, z: depth };
    }

    function draw() {
      const colors = palette();
      context.clearRect(0, 0, width, height);
      const projected = points.map(point => ({ ...project(point, time), accent: point.accent }));

      context.lineWidth = 1;
      for (let first = 0; first < projected.length; first += 1) {
        for (let second = first + 1; second < projected.length; second += 1) {
          const dx = projected[first].x - projected[second].x;
          const dy = projected[first].y - projected[second].y;
          const distance = Math.hypot(dx, dy);
          if (distance > Math.min(width, height) * .105) continue;
          const alpha = Math.max(.06, .27 - distance / 700);
          context.strokeStyle = `${colors.ink}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
          context.beginPath();
          context.moveTo(projected[first].x, projected[first].y);
          context.lineTo(projected[second].x, projected[second].y);
          context.stroke();
        }
      }

      projected.sort((a, b) => a.z - b.z).forEach(point => {
        const radius = 2.5 + (point.z + 1) * 1.3;
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fillStyle = point.accent ? colors.amber : colors.teal;
        context.fill();
        context.lineWidth = 1.5;
        context.strokeStyle = colors.background;
        context.stroke();
      });

      if (!reduceMotion) {
        time += .0028;
        frame = requestAnimationFrame(draw);
      }
    }

    resize();
    draw();
    addEventListener('resize', () => { resize(); if (reduceMotion) draw(); }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (reduceMotion) return;
      if (document.hidden) cancelAnimationFrame(frame);
      else { cancelAnimationFrame(frame); frame = requestAnimationFrame(draw); }
    });
  }

  function start() {
    wireSteps();
    startNetworkCanvas();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
