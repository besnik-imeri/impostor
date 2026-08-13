(() => {
  const doc = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = Boolean(window.gsap);
  const hasScrollTrigger = Boolean(window.ScrollTrigger);
  const toast = document.querySelector('.toast');
  let sfxEnabled = false;
  let audioCtx = null;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  function randomCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  function ensureAudio() {
    if (!audioCtx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function beep(type = 'coin') {
    if (!sfxEnabled) return;
    const ctx = ensureAudio();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    const presets = {
      coin: [740, 1180, 0.08, 'square'],
      hover: [320, 520, 0.035, 'triangle'],
      scan: [160, 760, 0.26, 'sawtooth'],
      deny: [190, 110, 0.18, 'square'],
      win: [520, 1320, 0.38, 'square']
    };
    const [start, end, duration, wave] = presets[type] || presets.coin;

    osc.type = wave;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    osc.frequency.setValueAtTime(start, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, end), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  function updateCursor(e) {
    doc.style.setProperty('--mx', `${e.clientX}px`);
    doc.style.setProperty('--my', `${e.clientY}px`);
  }
  window.addEventListener('pointermove', updateCursor, { passive: true });

  function updateScrollMeter() {
    const meter = $('.scroll-meter span');
    if (!meter) return;
    const max = document.body.scrollHeight - window.innerHeight;
    const progress = max <= 0 ? 0 : window.scrollY / max;
    meter.style.width = `${Math.min(1, Math.max(0, progress)) * 100}%`;
  }
  window.addEventListener('scroll', updateScrollMeter, { passive: true });
  updateScrollMeter();

  function initSoundToggle() {
    const toggle = $('.sound-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      sfxEnabled = !sfxEnabled;
      toggle.setAttribute('aria-pressed', String(sfxEnabled));
      if (sfxEnabled) {
        ensureAudio();
        beep('coin');
        showToast('SFX online. Tiny arcade beeps unlocked.');
      } else {
        showToast('SFX muted. Stealth mode enabled.');
      }
    });
  }

  function initMagnetic() {
    if (reducedMotion) return;
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const strength = el.classList.contains('btn') ? 0.16 : 0.10;
        if (hasGSAP) {
          gsap.to(el, { x: x * strength, y: y * strength, duration: 0.28, ease: 'power3.out' });
        } else {
          el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
        }
      });
      el.addEventListener('pointerleave', () => {
        if (hasGSAP) {
          gsap.to(el, { x: 0, y: 0, duration: 0.45, ease: 'elastic.out(1, .45)' });
        } else {
          el.style.transform = '';
        }
      });
      el.addEventListener('pointerenter', () => beep('hover'));
    });
  }

  function initParallax() {
    const root = $('[data-parallax-root]');
    const screen = $('[data-parallax]');
    if (!root || !screen || reducedMotion) return;

    root.addEventListener('pointermove', (e) => {
      const rect = root.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      if (hasGSAP) {
        gsap.to(root, { rotateY: px * 3.4, rotateX: py * -2.4, transformPerspective: 900, duration: 0.7, ease: 'power3.out' });
        gsap.to(screen, { x: px * 10, y: py * 8, duration: 0.7, ease: 'power3.out' });
      }
    });

    root.addEventListener('pointerleave', () => {
      if (hasGSAP) {
        gsap.to(root, { rotateY: 0, rotateX: 0, duration: 1.1, ease: 'elastic.out(1, .55)' });
        gsap.to(screen, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, .55)' });
      }
    });
  }

  function introAnimations() {
    if (!hasGSAP || reducedMotion) return;
    if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero__cabinet', { y: 52, opacity: 0, scale: 0.96, duration: 0.95 })
      .from('.screen-hud', { y: -12, opacity: 0, duration: 0.55 }, '-=0.55')
      .from('.hero-wordmark', { y: 30, opacity: 0, skewX: -8, duration: 0.75 }, '-=0.46')
      .from('.hero-tagline', { y: 16, opacity: 0, duration: 0.45 }, '-=0.28')
      .from('.crew-member', { y: 30, opacity: 0, scale: 0.82, stagger: 0.07, duration: 0.52 }, '-=0.18')
      .from('.stat-card, .cta-row > *', { y: 18, opacity: 0, stagger: 0.06, duration: 0.44 }, '-=0.12');

    gsap.to('.ufo-beam', { filter: 'blur(1px) drop-shadow(0 0 32px rgba(255,63,159,.9))', yoyo: true, repeat: -1, duration: 1.2, ease: 'sine.inOut' });

    if (hasScrollTrigger) {
      $$('.section').forEach((section) => {
        gsap.from($$('.section-heading, .step-card, .lobby-console, .mode-card, .mode-output, .ready-card', section), {
          scrollTrigger: { trigger: section, start: 'top 76%' },
          y: 42,
          opacity: 0,
          stagger: 0.08,
          duration: 0.72,
          ease: 'power3.out'
        });
      });
    }
  }

  function glitchLoop() {
    const targets = $$('.hero-wordmark');
    if (reducedMotion || targets.length === 0) return;
    const run = () => {
      const t = targets[Math.floor(Math.random() * targets.length)];
      t.classList.add('is-glitching');
      if (hasGSAP) {
        gsap.fromTo(t, { x: -3 }, { x: 3, duration: 0.045, repeat: 3, yoyo: true, onComplete: () => { t.classList.remove('is-glitching'); gsap.set(t, { x: 0 }); } });
      } else {
        setTimeout(() => t.classList.remove('is-glitching'), 120);
      }
    };
    setInterval(run, 2200 + Math.random() * 1200);
  }

  function burst(x, y, color = 'var(--yellow)') {
    if (reducedMotion) return;
    const count = 14;
    for (let i = 0; i < count; i += 1) {
      const pixel = document.createElement('span');
      pixel.className = 'burst-pixel';
      pixel.style.left = `${x}px`;
      pixel.style.top = `${y}px`;
      pixel.style.color = color;
      pixel.style.background = color;
      document.body.appendChild(pixel);
      const angle = (Math.PI * 2 * i) / count;
      const distance = 32 + Math.random() * 38;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      if (hasGSAP) {
        gsap.to(pixel, { x: tx, y: ty, opacity: 0, scale: 0, duration: 0.62, ease: 'power3.out', onComplete: () => pixel.remove() });
      } else {
        pixel.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${tx}px,${ty}px)`, opacity: 0 }], { duration: 620, easing: 'ease-out' }).onfinish = () => pixel.remove();
      }
    }
  }

  function initButtons() {
    $$('[data-scroll-to]').forEach((button) => {
      button.addEventListener('click', () => {
        const target = $(button.dataset.scrollTo);
        if (target) target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      });
    });

    $$('[data-action]').forEach((button) => {
      button.addEventListener('click', (e) => {
        const action = button.dataset.action;
        const rect = button.getBoundingClientRect();
        burst(e.clientX || rect.left + rect.width / 2, e.clientY || rect.top + rect.height / 2, action === 'host' ? 'var(--pink)' : 'var(--cyan)');
        beep(action === 'host' ? 'win' : 'coin');
        if (action === 'host') {
          const code = randomCode();
          $('#room-code').textContent = code;
          $('#room-input').value = code;
          showToast(`Host cabinet booted. Share room ${code}.`);
        } else {
          $('.section--play').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
          showToast('Join panel opened. Type the room code from your host.');
        }
      });
    });

    const shuffle = $('#shuffle-code');
    if (shuffle) {
      shuffle.addEventListener('click', (e) => {
        const code = randomCode();
        $('#room-code').textContent = code;
        $('#room-input').value = code;
        burst(e.clientX, e.clientY, 'var(--yellow)');
        beep('coin');
        showToast(`New room code generated: ${code}`);
      });
    }
  }

  function initLobby() {
    const players = $$('.player-card');
    const scanButton = $('#scan-button');
    const result = $('#scan-result');
    let scanning = false;

    players.forEach((card) => {
      card.addEventListener('click', () => {
        if (scanning) return;
        card.classList.toggle('is-suspect');
        const name = card.dataset.player;
        beep(card.classList.contains('is-suspect') ? 'scan' : 'hover');
        showToast(card.classList.contains('is-suspect') ? `${name} marked suspicious.` : `${name} cleared from your notes.`);
      });
    });

    if (scanButton && result) {
      scanButton.addEventListener('click', () => {
        if (scanning) return;
        scanning = true;
        players.forEach((card) => card.classList.remove('is-revealed'));
        result.textContent = 'Cabinet is reading table noise... 27%, 61%, 99%...';
        beep('scan');
        if (hasGSAP && !reducedMotion) {
          gsap.fromTo(players, { y: 0 }, { y: -6, repeat: 3, yoyo: true, stagger: 0.04, duration: 0.08, ease: 'steps(1)' });
        }
        setTimeout(() => {
          const impostor = players.find((card) => card.dataset.role === 'impostor');
          if (impostor) {
            impostor.classList.add('is-revealed');
            result.innerHTML = '<strong>Suspicion spike:</strong> RetroRex is over-explaining the pizza clue.';
            if (hasGSAP && !reducedMotion) {
              gsap.fromTo(impostor, { scale: 1.0 }, { scale: 1.06, repeat: 3, yoyo: true, duration: 0.14, ease: 'power2.inOut' });
            }
          }
          beep('win');
          scanning = false;
        }, reducedMotion ? 250 : 1250);
      });
    }
  }

  function initModes() {
    const output = $('#mode-output');
    const copy = {
      accusation: ['Accusation', 'Fastest onboarding. Great default for a public landing page CTA because users instantly understand the stakes: talk, accuse, vote.'],
      suspicion: ['Suspicion', 'A slower, clue-led mode for repeat players. The UI leans into detective tools, noise meters, and social reads instead of instant elimination.'],
      sabotage: ['Sabotage', 'The high-energy cartridge. It gives the landing page playful moments for timed prompts, flashing warnings, and unpredictable mini-events.']
    };

    $$('.mode-card').forEach((card) => {
      card.addEventListener('click', () => {
        $$('.mode-card').forEach((c) => {
          c.classList.remove('is-active');
          c.setAttribute('aria-selected', 'false');
        });
        card.classList.add('is-active');
        card.setAttribute('aria-selected', 'true');
        const [title, text] = copy[card.dataset.mode] || copy.accusation;
        if (output) {
          output.querySelector('strong').textContent = title;
          output.querySelector('p').textContent = text;
          if (hasGSAP && !reducedMotion) {
            gsap.fromTo(output, { y: 10, opacity: 0.5 }, { y: 0, opacity: 1, duration: 0.34, ease: 'power3.out' });
          }
        }
        beep('coin');
      });
    });
  }

  function initJoinForm() {
    const form = $('.join-form');
    const input = $('#room-input');
    if (!form || !input) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value.trim();
      if (!/^\d{4}$/.test(value)) {
        beep('deny');
        showToast('The cabinet needs a four-digit room code.');
        input.focus();
        return;
      }
      beep('win');
      showToast(`Joining room ${value}. Keep your word secret.`);
      if (hasGSAP && !reducedMotion) {
        gsap.fromTo(form, { x: -4 }, { x: 4, repeat: 3, yoyo: true, duration: 0.05, onComplete: () => gsap.set(form, { x: 0 }) });
      }
    });
  }

  function initThree() {
    const canvas = $('#space-webgl');
    if (!canvas || !window.THREE || reducedMotion) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1200);
    camera.position.z = 180;

    const starCount = 1200;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const palette = [new THREE.Color(0x22e8ff), new THREE.Color(0xff3f9f), new THREE.Color(0xffdc3f), new THREE.Color(0xffffff), new THREE.Color(0x66ff72)];
    for (let i = 0; i < starCount; i += 1) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 760;
      positions[i3 + 1] = (Math.random() - 0.5) * 520;
      positions[i3 + 2] = (Math.random() - 0.5) * 520;
      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({ size: 1.6, vertexColors: true, transparent: true, opacity: 0.85 });
    const stars = new THREE.Points(geometry, material);
    scene.add(stars);

    const tokenGroup = new THREE.Group();
    const tokenGeometry = new THREE.TorusGeometry(8, 2, 8, 20);
    const tokenMaterials = [0xff3f9f, 0x22e8ff, 0xffdc3f, 0x66ff72, 0x9d65ff].map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.62 }));
    for (let i = 0; i < 18; i += 1) {
      const token = new THREE.Mesh(tokenGeometry, tokenMaterials[i % tokenMaterials.length]);
      token.position.set((Math.random() - 0.5) * 420, (Math.random() - 0.5) * 320, -60 - Math.random() * 180);
      token.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      token.scale.setScalar(0.55 + Math.random() * 1.35);
      token.userData.speed = 0.002 + Math.random() * 0.006;
      tokenGroup.add(token);
    }
    scene.add(tokenGroup);

    let pointerX = 0;
    let pointerY = 0;
    window.addEventListener('pointermove', (e) => {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    function resize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
    window.addEventListener('resize', resize);
    resize();

    function animate(time) {
      stars.rotation.y = time * 0.000035 + pointerX * 0.025;
      stars.rotation.x = pointerY * 0.018;
      tokenGroup.rotation.y = time * 0.00008 + pointerX * 0.03;
      tokenGroup.rotation.x = pointerY * 0.018;
      tokenGroup.children.forEach((token, index) => {
        token.rotation.x += token.userData.speed;
        token.rotation.y += token.userData.speed * 1.4;
        token.position.y += Math.sin(time * 0.001 + index) * 0.012;
      });
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  const TICKER_SEGMENTS = [
    { text: '♕', className: 'ticker__seg--crown' },
    { text: 'TOP LIAR', className: 'ticker__seg--liar' },
    { text: 'PIXELCHEAT', className: 'ticker__seg--cheat' },
    { text: '12345 PTS', className: 'ticker__seg--pts' },
  ];
  const TICKER_BLINK_MS = 15000;

  function renderTickerLine(container, segments) {
    container.replaceChildren();
    segments.forEach(({ text, className }) => {
      const group = document.createElement('span');
      group.className = 'ticker__group';
      [...text].forEach((char) => {
        const span = document.createElement('span');
        span.className = className;
        span.textContent = char;
        group.appendChild(span);
      });
      container.appendChild(group);
    });
  }

  function initTicker() {
    const root = $('.cabinet-ticker .ticker');
    if (!root) return;

    root.replaceChildren();
    const line = document.createElement('div');
    line.className = 'ticker__line';
    renderTickerLine(line, TICKER_SEGMENTS);
    root.appendChild(line);

    const blink = () => {
      if (reducedMotion) return;
      line.classList.remove('is-blinking');
      void line.offsetHeight;
      line.classList.add('is-blinking');
    };

    line.addEventListener('animationend', (event) => {
      if (event.animationName === 'ticker-blink') {
        line.classList.remove('is-blinking');
      }
    });

    window.setInterval(blink, TICKER_BLINK_MS);
  }

  function boot() {
    initSoundToggle();
    initMagnetic();
    initParallax();
    introAnimations();
    glitchLoop();
    initButtons();
    initLobby();
    initModes();
    initJoinForm();
    initTicker();
    initThree();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
