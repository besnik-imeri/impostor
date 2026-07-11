import type { AvatarId, PlayerColor } from "@impostor/domain";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Crosshair,
  Eye,
  Flag,
  Gamepad2,
  KeyRound,
  Moon,
  Play,
  Shield,
  Sun,
  TimerReset,
  Trophy,
  Users,
  Zap
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { BufferGeometry, Material, Object3D } from "three";
import type { ThemePreference } from "../lib/theme";
import { AvatarMark } from "./avatar-mark";

interface LandingExperienceProps {
  theme: ThemePreference;
  onToggleTheme: () => void;
}

type StepId = "room" | "word" | "hunt";
type ModeId = "accusation" | "suspicion";

interface GameStep {
  id: StepId;
  title: string;
  command: string;
  text: string;
  icon: ReactNode;
}

interface DemoPlayer {
  name: string;
  avatar: AvatarId;
  color: PlayerColor;
  status: string;
  score: string;
  heat: number;
}

const gameSteps = [
  {
    id: "room",
    title: "Create a room",
    command: "Insert coin",
    text: "Host from one phone, throw the code on screen, and let everyone pick a table identity.",
    icon: <Gamepad2 size={24} />
  },
  {
    id: "word",
    title: "Reveal the word",
    command: "Private screen",
    text: "Players see the secret word. The impostor sees only the role and has to improvise.",
    icon: <Shield size={24} />
  },
  {
    id: "hunt",
    title: "Find the impostor",
    command: "Final read",
    text: "Talk, bait, accuse, and score points when your read is brave enough to be right.",
    icon: <Flag size={24} />
  }
] satisfies readonly [GameStep, ...GameStep[]];

const demoPlayers = [
  {
    name: "Mika",
    avatar: "girl-3",
    color: "#ff2d87",
    status: "Host",
    score: "+4",
    heat: 42
  },
  {
    name: "Blair",
    avatar: "boy-7",
    color: "#02a9ff",
    status: "Ready",
    score: "+2",
    heat: 66
  },
  {
    name: "Casey",
    avatar: "girl-10",
    color: "#ffd21e",
    status: "Too calm",
    score: "+1",
    heat: 88
  },
  {
    name: "Noor",
    avatar: "boy-2",
    color: "#22f28d",
    status: "Watching",
    score: "0",
    heat: 54
  }
] satisfies readonly [DemoPlayer, ...DemoPlayer[]];

const modeCopy: Record<ModeId, { title: string; text: string; icon: ReactNode; action: string }> = {
  accusation: {
    title: "Accusation",
    text: "One decisive call can end the round. Fast, loud, dramatic, and perfect for fearless groups.",
    icon: <Crosshair size={25} />,
    action: "Accuse Casey"
  },
  suspicion: {
    title: "Suspicion",
    text: "Everyone locks in a read before the table explodes. More clues, more second guessing.",
    icon: <Eye size={25} />,
    action: "Mark suspicion"
  }
};

export function LandingExperience({ theme, onToggleTheme }: LandingExperienceProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [activeMode, setActiveMode] = useState<ModeId>("accusation");
  const [activePlayer, setActivePlayer] = useState(2);
  const [attractModeRunning, setAttractModeRunning] = useState(true);
  const selectedStep = gameSteps[activeStep] ?? gameSteps[0];
  const selectedMode = modeCopy[activeMode];
  const selectedPlayer = demoPlayers[activePlayer] ?? demoPlayers[0];

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      root.querySelectorAll<HTMLElement>(".gsap-reveal").forEach((element) => {
        element.style.opacity = "1";
        element.style.transform = "none";
      });
      return;
    }

    let cancelled = false;
    let revertContext: (() => void) | undefined;

    const startMotion = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger")
      ]);

      if (cancelled) {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      const context = gsap.context(() => {
        gsap.set(".gsap-reveal", { opacity: 0, y: 28 });
        gsap.to(".hero-reveal", {
          opacity: 1,
          y: 0,
          duration: 0.82,
          ease: "power3.out",
          stagger: 0.08
        });
        gsap.to(".cabinet-lamp", {
          opacity: 0.42,
          duration: 0.72,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: {
            each: 0.06,
            from: "edges"
          }
        });
        gsap.to(".arcade-token", {
          y: -10,
          rotate: 5,
          duration: 1.8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: 0.16
        });
        gsap.to(".ticker-track", {
          xPercent: -50,
          duration: 22,
          ease: "none",
          repeat: -1
        });
        gsap.utils.toArray<HTMLElement>(".experience-section .gsap-reveal").forEach((element) => {
          gsap.to(element, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 84%"
            }
          });
        });
        gsap.to(".parallax-prize", {
          yPercent: -24,
          ease: "none",
          scrollTrigger: {
            trigger: ".experience-hero",
            start: "top top",
            end: "bottom top",
            scrub: 0.7
          }
        });
      }, root);

      revertContext = () => context.revert();
    };

    void startMotion();

    return () => {
      cancelled = true;
      revertContext?.();
    };
  }, []);

  return (
    <main className="experience-shell" ref={rootRef}>
      <header className="experience-nav" aria-label="Primary navigation">
        <a className="experience-brand" href="/" aria-label="Impostor home">
          Impostor
        </a>
        <nav className="experience-nav-links" aria-label="Landing sections">
          <a href="#how-it-works">How it works</a>
          <a href="#modes">Modes</a>
          <a href="#lobby">Lobby</a>
          <a href="#play">Play</a>
        </nav>
        <div className="experience-nav-actions">
          <button
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="experience-icon-button"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            type="button"
            onClick={onToggleTheme}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a className="experience-mini-cta" href="/play?join=1">
            <KeyRound size={17} />
            Join
          </a>
        </div>
      </header>

      <section className="experience-hero" aria-labelledby="experience-title">
        <ArcadeAttractCanvas active={attractModeRunning} />
        <div className="experience-hero-grid">
          <div className="experience-hero-copy">
            <h1 className="hero-reveal" id="experience-title" data-text="Impostor">
              Impostor
            </h1>
            <p className="experience-tagline hero-reveal">
              <span>Bluff.</span> <span>Detect.</span> <span>Survive.</span>
            </p>
            <p className="experience-lede hero-reveal">
              One word. One liar. Everyone watching. A social deception party game built for quick
              rooms, loud reads, and theatrical betrayals.
            </p>
            <div className="experience-actions hero-reveal">
              <a aria-label="Start playing" className="experience-primary-link" href="/play">
                <Gamepad2 size={22} />
                Host game
              </a>
              <a className="experience-secondary-link" href="/play?join=1">
                <KeyRound size={21} />
                Join game
              </a>
            </div>
            <div className="experience-stat-row hero-reveal" aria-label="Game stats">
              <StatToken icon={<Users size={19} />} value="3-12" label="players" />
              <StatToken icon={<TimerReset size={19} />} value="15-45" label="minutes" />
              <StatToken icon={<Zap size={19} />} value="0" label="accounts" />
            </div>
          </div>

          <div className="experience-stage hero-reveal" aria-label="Interactive arcade preview">
            <ArcadeCabinet
              activePlayer={activePlayer}
              attractModeRunning={attractModeRunning}
              onToggleAttractMode={() => setAttractModeRunning((current) => !current)}
            />
            <button
              className="hero-player-chip parallax-prize"
              type="button"
              onClick={() => setActivePlayer((current) => (current + 1) % demoPlayers.length)}
            >
              <AvatarMark avatar={selectedPlayer.avatar} color={selectedPlayer.color} size="sm" />
              <span>
                <strong>{selectedPlayer.name}</strong>
                Suspicion {selectedPlayer.heat}%
              </span>
              <ArrowRight size={17} />
            </button>
            <div className="arcade-token token-one" aria-hidden="true">
              +2
            </div>
            <div className="arcade-token token-two" aria-hidden="true">
              ?
            </div>
            <div className="arcade-token token-three" aria-hidden="true">
              x
            </div>
          </div>
        </div>

        <a className="hero-next-strip hero-reveal" href="#how-it-works">
          <span>How it works</span>
          <ArrowDown size={18} />
        </a>
      </section>

      <section className="experience-section how-section" id="how-it-works">
        <div className="experience-section-heading gsap-reveal">
          <span>How it works</span>
          <h2>Three moves. Infinite suspicion.</h2>
          <p>
            The UI stays out of the conversation until the table needs a reveal, a timer, or one
            beautifully reckless accusation.
          </p>
        </div>
        <div className="how-layout">
          <div className="step-console gsap-reveal" role="tablist" aria-label="How it works steps">
            {gameSteps.map((step, index) => (
              <button
                aria-selected={activeStep === index}
                className={activeStep === index ? "step-button is-active" : "step-button"}
                key={step.id}
                role="tab"
                type="button"
                onClick={() => setActiveStep(index)}
                onMouseEnter={() => setActiveStep(index)}
              >
                <span className="step-button-icon">{step.icon}</span>
                <span>
                  <strong>{step.title}</strong>
                  <small>{step.command}</small>
                </span>
              </button>
            ))}
          </div>
          <div className={`step-screen is-${selectedStep.id} gsap-reveal`} role="tabpanel">
            <div className="step-screen-header">
              <span>{selectedStep.command}</span>
              <strong>{selectedStep.title}</strong>
            </div>
            <div className="scanner-lanes" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <p>{selectedStep.text}</p>
            <div className="word-reveal">
              <span>Secret word</span>
              <strong>{selectedStep.id === "word" ? "IMPOSTOR" : "Arcade"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="experience-section lobby-section" id="lobby">
        <div className="experience-section-heading gsap-reveal">
          <span>Live lobby</span>
          <h2>A party console in everyone’s pocket.</h2>
          <p>
            The host gets a big-screen rhythm. Players get fast identity picks, private reveals, and
            a score trail that feels like an arcade cabinet warming up.
          </p>
        </div>
        <div className="lobby-layout">
          <div className="lobby-monitor gsap-reveal">
            <div className="lobby-monitor-top">
              <span>Room X7K9D</span>
              <strong>8 / 12 ready</strong>
            </div>
            <div className="lobby-ticker" aria-hidden="true">
              <div className="ticker-track">
                <span>Casey dodged the question</span>
                <span>Mika started the timer</span>
                <span>Blair suspects Noor</span>
                <span>Word reveal armed</span>
                <span>Casey dodged the question</span>
                <span>Mika started the timer</span>
                <span>Blair suspects Noor</span>
                <span>Word reveal armed</span>
              </div>
            </div>
            <div className="player-board">
              {demoPlayers.map((player, index) => (
                <button
                  className={
                    activePlayer === index ? "demo-player-card is-active" : "demo-player-card"
                  }
                  key={player.name}
                  type="button"
                  onClick={() => setActivePlayer(index)}
                >
                  <AvatarMark avatar={player.avatar} color={player.color} size="md" />
                  <span>
                    <strong>{player.name}</strong>
                    {player.status}
                  </span>
                  <b>{player.score}</b>
                </button>
              ))}
            </div>
          </div>
          <aside className="suspicion-meter gsap-reveal" aria-label="Selected player signal">
            <AvatarMark avatar={selectedPlayer.avatar} color={selectedPlayer.color} size="xl" />
            <span>Spotlight</span>
            <h3>{selectedPlayer.name}</h3>
            <div className="meter-track" aria-label={`${selectedPlayer.heat}% suspicion`}>
              <span style={{ width: `${selectedPlayer.heat}%` }} />
            </div>
            <p>{selectedPlayer.status}. Keep talking, because the table is already watching.</p>
          </aside>
        </div>
      </section>

      <section className="experience-section modes-section" id="modes">
        <div className="experience-section-heading gsap-reveal">
          <span>Game modes</span>
          <h2>Choose the kind of chaos.</h2>
          <p>
            Keep the round sharp with direct accusations, or let everyone build a suspicion trail
            before the final read.
          </p>
        </div>
        <div className="mode-layout">
          <div className="mode-switcher gsap-reveal" role="tablist" aria-label="Game modes">
            {(["accusation", "suspicion"] as const).map((mode) => (
              <button
                aria-selected={activeMode === mode}
                className={activeMode === mode ? "mode-button is-active" : "mode-button"}
                key={mode}
                role="tab"
                type="button"
                onClick={() => setActiveMode(mode)}
              >
                {modeCopy[mode].icon}
                <span>
                  <strong>{modeCopy[mode].title}</strong>
                  {modeCopy[mode].text}
                </span>
              </button>
            ))}
          </div>
          <div className={`mode-playfield gsap-reveal is-${activeMode}`} role="tabpanel">
            <div className="mode-playfield-header">
              <span>{selectedMode.title}</span>
              <strong>{selectedMode.action}</strong>
            </div>
            <div className="target-grid">
              {demoPlayers.map((player, index) => (
                <button
                  className={index === activePlayer ? "target-button is-targeted" : "target-button"}
                  key={player.name}
                  type="button"
                  onClick={() => setActivePlayer(index)}
                >
                  <AvatarMark avatar={player.avatar} color={player.color} size="sm" />
                  <span>{player.name}</span>
                  {index === activePlayer ? <Check size={16} /> : null}
                </button>
              ))}
            </div>
            <p>{selectedMode.text}</p>
          </div>
        </div>
      </section>

      <section className="experience-final" id="play">
        <div className="experience-final-copy gsap-reveal">
          <Trophy size={30} />
          <h2>Ready to play?</h2>
          <p>Start a room, hand everyone a code, and let the table find its liar.</p>
        </div>
        <div className="experience-final-actions gsap-reveal">
          <a className="experience-primary-link" href="/play">
            <Play size={22} />
            Host game
          </a>
          <a className="experience-secondary-link" href="/play?join=1">
            <KeyRound size={21} />
            Join game
          </a>
        </div>
      </section>
    </main>
  );
}

function StatToken({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <span className="experience-stat-token">
      {icon}
      <strong>{value}</strong>
      <span>{label}</span>
    </span>
  );
}

function ArcadeCabinet({
  activePlayer,
  attractModeRunning,
  onToggleAttractMode
}: {
  activePlayer: number;
  attractModeRunning: boolean;
  onToggleAttractMode: () => void;
}) {
  const player = demoPlayers[activePlayer] ?? demoPlayers[0];

  return (
    <div
      className={
        attractModeRunning ? "arcade-cabinet-experience is-running" : "arcade-cabinet-experience"
      }
    >
      <div className="cabinet-marquee" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <span className="cabinet-lamp" key={index} />
        ))}
      </div>
      <div className="cabinet-screen">
        <div className="screen-grid" aria-hidden="true" />
        <div className="screen-title">
          <span>Round 03</span>
          <strong>Find the impostor</strong>
        </div>
        <div className="screen-suspect">
          <AvatarMark avatar={player.avatar} color={player.color} size="xl" />
          <div>
            <span>Current read</span>
            <strong>{player.name}</strong>
            <p>Suspicion {player.heat}%</p>
          </div>
        </div>
        <div className="screen-actions" aria-hidden="true">
          <span>Accuse</span>
          <span>Suspect</span>
          <span>Clear</span>
        </div>
      </div>
      <div className="cabinet-controls">
        <button className="cabinet-play-toggle" type="button" onClick={onToggleAttractMode}>
          {attractModeRunning ? <TimerReset size={18} /> : <Play size={18} />}
          {attractModeRunning ? "Attract on" : "Attract paused"}
        </button>
        <span className="joystick-stick" aria-hidden="true" />
        <span className="cabinet-button is-pink" aria-hidden="true" />
        <span className="cabinet-button is-cyan" aria-hidden="true" />
        <span className="cabinet-button is-yellow" aria-hidden="true" />
      </div>
    </div>
  );
}

function ArcadeAttractCanvas({ active }: { active: boolean }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    let cancelled = false;
    let cleanupScene: (() => void) | undefined;

    const startScene = async () => {
      const THREE = await import("three");

      if (cancelled) {
        return;
      }

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0.7, 7.2);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.dataset.testid = "arcade-attract-canvas";
      mount.appendChild(renderer.domElement);

      const geometries: BufferGeometry[] = [];
      const materials: Material[] = [];
      const registerGeometry = <TGeometry extends BufferGeometry>(geometry: TGeometry) => {
        geometries.push(geometry);
        return geometry;
      };
      const registerMaterial = <TMaterial extends Material>(material: TMaterial) => {
        materials.push(material);
        return material;
      };

      const cyan = registerMaterial(
        new THREE.MeshBasicMaterial({ color: 0x02a9ff, transparent: true, opacity: 0.76 })
      );
      const pink = registerMaterial(
        new THREE.MeshBasicMaterial({ color: 0xff2d87, transparent: true, opacity: 0.78 })
      );
      const yellow = registerMaterial(
        new THREE.MeshBasicMaterial({ color: 0xffd21e, transparent: true, opacity: 0.72 })
      );
      const mint = registerMaterial(
        new THREE.MeshBasicMaterial({ color: 0x22f28d, transparent: true, opacity: 0.64 })
      );
      const darkGlass = registerMaterial(
        new THREE.MeshBasicMaterial({ color: 0x08081e, transparent: true, opacity: 0.48 })
      );

      const world = new THREE.Group();
      scene.add(world);

      const cabinet = new THREE.Group();
      const frameGeometry = registerGeometry(new THREE.BoxGeometry(2.95, 3.35, 0.16));
      const screenGeometry = registerGeometry(new THREE.BoxGeometry(2.34, 1.54, 0.2));
      const deckGeometry = registerGeometry(new THREE.BoxGeometry(2.72, 0.46, 0.22));
      const frame = new THREE.Mesh(frameGeometry, darkGlass);
      const screen = new THREE.Mesh(screenGeometry, cyan);
      const deck = new THREE.Mesh(deckGeometry, pink);
      frame.position.z = -0.05;
      screen.position.set(0, 0.35, 0.12);
      deck.position.set(0, -1.36, 0.2);
      cabinet.add(frame, screen, deck);

      const ringGeometry = registerGeometry(new THREE.TorusGeometry(0.82, 0.018, 8, 96));
      const ringOne = new THREE.Mesh(ringGeometry, pink);
      const ringTwo = new THREE.Mesh(ringGeometry, yellow);
      ringOne.position.set(0, 0.35, 0.28);
      ringTwo.position.set(0, 0.35, 0.3);
      ringTwo.scale.setScalar(0.68);
      cabinet.add(ringOne, ringTwo);
      world.add(cabinet);

      const tokenGeometry = registerGeometry(new THREE.CylinderGeometry(0.17, 0.17, 0.052, 6));
      const tokenMaterials = [cyan, pink, yellow, mint];
      const tokens = new THREE.Group();
      for (let index = 0; index < 34; index += 1) {
        const token = new THREE.Mesh(tokenGeometry, tokenMaterials[index % tokenMaterials.length]);
        const lane = index % 4;
        const depth = -2.8 + (index % 9) * 0.66;
        const side = lane < 2 ? -1 : 1;
        token.position.set(side * (2.2 + lane * 0.54), -1.15 + ((index * 37) % 120) / 100, depth);
        token.rotation.set(index * 0.19, index * 0.27, index * 0.11);
        tokens.add(token);
      }
      world.add(tokens);

      const grid = new THREE.GridHelper(10, 18, 0x02a9ff, 0xff2d87);
      grid.position.y = -1.85;
      grid.position.z = -0.8;
      world.add(grid);

      const ambientLineGeometry = registerGeometry(new THREE.BoxGeometry(0.032, 0.032, 5.8));
      for (let index = 0; index < 8; index += 1) {
        const line = new THREE.Mesh(ambientLineGeometry, index % 2 === 0 ? cyan : pink);
        line.position.set(-4.4 + index * 1.25, 1.72 - (index % 3) * 0.34, -1.4);
        line.rotation.z = index % 2 === 0 ? 0.3 : -0.24;
        world.add(line);
      }

      const pointer = { x: 0, y: 0 };
      const handlePointerMove = (event: PointerEvent) => {
        const bounds = mount.getBoundingClientRect();
        pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      };
      mount.addEventListener("pointermove", handlePointerMove);

      const resize = () => {
        const width = Math.max(1, mount.clientWidth);
        const height = Math.max(1, mount.clientHeight);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      resize();
      window.addEventListener("resize", resize);

      const startedAt = performance.now();
      let frameId = 0;
      let disposed = false;

      const render = () => {
        const elapsed = (performance.now() - startedAt) / 1000;

        if (activeRef.current && !reducedMotion) {
          world.rotation.y += (pointer.x * 0.18 - world.rotation.y) * 0.035;
          world.rotation.x += (-pointer.y * 0.08 - world.rotation.x) * 0.035;
          cabinet.rotation.z = Math.sin(elapsed * 0.7) * 0.018;
          ringOne.rotation.z = elapsed * 0.74;
          ringTwo.rotation.z = -elapsed * 1.04;
          tokens.children.forEach((child: Object3D, index: number) => {
            child.rotation.y += 0.008 + index * 0.0002;
            child.position.y += Math.sin(elapsed * 1.35 + index) * 0.0008;
          });
          grid.position.z = -0.8 + ((elapsed * 0.28) % 0.55);
        }

        renderer.render(scene, camera);

        if (!disposed && !reducedMotion) {
          frameId = window.requestAnimationFrame(render);
        }
      };

      render();

      cleanupScene = () => {
        disposed = true;
        window.cancelAnimationFrame(frameId);
        window.removeEventListener("resize", resize);
        mount.removeEventListener("pointermove", handlePointerMove);
        renderer.dispose();
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((material) => material.dispose());
        renderer.domElement.remove();
      };
    };

    void startScene();

    return () => {
      cancelled = true;
      cleanupScene?.();
    };
  }, []);

  return <div className="arcade-webgl-backdrop" ref={mountRef} />;
}
