import {
  Alien,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Coins,
  Crown,
  Eye,
  Gamepad,
  Globe,
  Message,
  Play,
  Skull,
  Target,
  Users,
  Zap
} from "pixelarticons/react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject
} from "react";
import { BrandWordmark } from "./brand-wordmark";

interface ArcadeCharacter {
  id: string;
  name: string;
  src: string;
  accent: string;
}

type ModeId = "accusation" | "suspicion";

const characters = [
  arcadeCharacter("pixel-panda", "PixelPanda", "#24e5ff"),
  arcadeCharacter("neon-ninja", "NeonNinja", "#ff3f9f"),
  arcadeCharacter("8-bit-bunny", "8BitBunny", "#ffdd3f"),
  arcadeCharacter("retro-rex", "RetroRex", "#67ff72"),
  arcadeCharacter("glitch-cat", "GlitchCat", "#a56cff"),
  arcadeCharacter("arcade-owl", "ArcadeOwl", "#168cff"),
  arcadeCharacter("astro-koala", "AstroKoala", "#ff6fc0"),
  arcadeCharacter("cyber-fox", "CyberFox", "#36f4e2"),
  arcadeCharacter("foggy-frog", "FoggyFrog", "#8aff6a"),
  arcadeCharacter("master-monkey", "MasterMonkey", "#ffb84f"),
  arcadeCharacter("punky-penguin", "PunkyPenguin", "#4fb2ff"),
  arcadeCharacter("robo-shark", "RoboShark", "#ff6a74"),
  arcadeCharacter("turbo-monkey", "TurboMonkey", "#e489ff")
] as const;

const heroCrew = [characters[7], characters[2], characters[1], characters[3], characters[4]];
const lobbyCrew = characters.slice(0, 6);

const modeDetails: Record<
  ModeId,
  { title: string; description: string; bestFor: string; icon: ReactNode; accent: string }
> = {
  accusation: {
    title: "Accusation",
    description: "Vote fast. Convince others. Call out the impostor before they decode the word.",
    bestFor: "Loud groups",
    icon: <Target aria-hidden="true" />,
    accent: "#24e5ff"
  },
  suspicion: {
    title: "Suspicion",
    description: "No instant vote. Track clues, compare stories, and expose the liar by consensus.",
    bestFor: "Sharp minds",
    icon: <Eye aria-hidden="true" />,
    accent: "#ff3f9f"
  }
};

export function LandingExperience() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState<ModeId>("accusation");

  useArcadeMotion(rootRef);

  return (
    <main className="arcade-landing" id="top" ref={rootRef}>
      <a className="arcade-skip-link" href="#how-it-works">
        Skip to how it works
      </a>
      <ArcadeStarfield />
      <div className="arcade-noise" aria-hidden="true" />

      <header className="arcade-nav" aria-label="Primary navigation">
        <a className="arcade-nav__brand" href="#top" aria-label="Impostor home">
          <BrandWordmark alt="" className="arcade-nav__wordmark" priority />
        </a>
        <nav className="arcade-nav__links" aria-label="Landing sections">
          <a href="#how-it-works">How it works</a>
          <a href="#modes">Modes</a>
          <a href="#lobby">Lobby</a>
          <a className="is-active" href="#play">
            Play
          </a>
        </nav>
        <a className="arcade-nav__console" href="/play" aria-label="Open the game console">
          <Alien aria-hidden="true" />
        </a>
      </header>

      <section className="arcade-hero" aria-labelledby="arcade-title">
        <div className="arcade-cabinet arcade-hero-reveal">
          <picture>
            <source
              media="(max-width: 720px)"
              srcSet="/arcade/cabinet-1200.webp 1200w, /arcade/cabinet-1800.webp 1800w"
            />
            <img
              alt=""
              className="arcade-cabinet__frame"
              decoding="async"
              fetchPriority="high"
              height="2400"
              src="/arcade/cabinet.webp"
              srcSet="/arcade/cabinet-1200.webp 1200w, /arcade/cabinet-1800.webp 1800w, /arcade/cabinet.webp 2400w"
              width="2400"
            />
          </picture>

          <div className="arcade-floating-coins" aria-hidden="true">
            <span>
              <Coins />
            </span>
            <span>
              <Coins />
            </span>
            <span>
              <Coins />
            </span>
            <span>
              <Coins />
            </span>
            <span>
              <Coins />
            </span>
          </div>

          <div className="arcade-cabinet__marquee">
            <h1 id="arcade-title">
              <BrandWordmark className="arcade-wordmark" priority />
            </h1>
            <p className="arcade-tagline">
              <Alien aria-hidden="true" />
              Bluff. Detect. Survive.
              <Skull aria-hidden="true" />
            </p>
          </div>

          <div className="arcade-cabinet__screen arcade-scanlines">
            <div className="arcade-hero-crew" aria-label="The arcade character crew">
              {heroCrew.map((character, index) => (
                <CharacterImage
                  character={character}
                  className={index === 2 ? "is-impostor" : undefined}
                  key={character.id}
                  priority
                />
              ))}
            </div>
            <div className="arcade-hero-stats" aria-label="Game details">
              <ArcadeStat icon={<Users aria-hidden="true" />} label="players" value="3–12" />
              <ArcadeStat icon={<Clock aria-hidden="true" />} label="minutes" value="15–45" />
            </div>
            <p className="arcade-hero-copy">One word. One liar. Everyone watching.</p>
          </div>

          <div className="arcade-cabinet__deck" id="play">
            <a className="arcade-button arcade-button--pink" href="/play">
              <Gamepad aria-hidden="true" />
              Host game
              <ArrowRight aria-hidden="true" />
            </a>
            <span className="arcade-versus" aria-hidden="true">
              VS
            </span>
            <a className="arcade-button arcade-button--cyan" href="/play?join=1">
              <Play aria-hidden="true" />
              Join game
              <ArrowRight aria-hidden="true" />
            </a>
          </div>

          <div className="arcade-cabinet__ticker" aria-label="Arcade high score">
            <Crown aria-hidden="true" />
            <span>TOP LIAR</span>
            <strong>PIXELCHEAT</strong>
            <b>12345 PTS</b>
            <Alien aria-hidden="true" />
          </div>

          <a className="arcade-downlink" href="#how-it-works" aria-label="Continue to how it works">
            <ChevronDown aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="arcade-section arcade-how" id="how-it-works" aria-labelledby="how-title">
        <ArcadeHeading id="how-title">How it works</ArcadeHeading>
        <div className="arcade-steps">
          <article
            className="arcade-step arcade-reveal"
            style={{ "--accent": "#24e5ff" } as CSSProperties}
          >
            <span className="arcade-step__number">01</span>
            <h3>Create a room</h3>
            <div className="arcade-step__visual arcade-step__visual--cabinet">
              <CharacterImage character={characters[0]} className="arcade-step__side-character" />
              <img
                alt=""
                className="arcade-step__mini-cabinet"
                height="1200"
                loading="lazy"
                src="/arcade/cabinet-1200.webp"
                width="1200"
              />
              <span>
                ROOM
                <br />
                B421
              </span>
              <CharacterImage character={characters[1]} className="arcade-step__side-character" />
            </div>
            <p>
              Host a lobby, share the six-character code, and bring everyone into the same room.
            </p>
          </article>

          <article
            className="arcade-step arcade-reveal"
            style={{ "--accent": "#ffdd3f" } as CSSProperties}
          >
            <span className="arcade-step__number">02</span>
            <h3>Reveal the word</h3>
            <div className="arcade-step__visual arcade-step__visual--word">
              <img
                alt=""
                className="arcade-step__word-cabinet"
                height="1200"
                loading="lazy"
                src="/arcade/cabinet-1200.webp"
                width="1200"
              />
              <Eye aria-hidden="true" />
              <strong>PIZZA</strong>
            </div>
            <p>Most players get the secret word. One player gets only a role and has to bluff.</p>
          </article>

          <article
            className="arcade-step arcade-reveal"
            style={{ "--accent": "#67ff72" } as CSSProperties}
          >
            <span className="arcade-step__number">03</span>
            <h3>Find the impostor</h3>
            <div className="arcade-step__visual arcade-step__visual--crew">
              {characters.slice(1, 5).map((character) => (
                <CharacterImage character={character} key={character.id} />
              ))}
              <Message className="arcade-speech" aria-hidden="true" />
            </div>
            <p>
              Talk, bait, accuse, and make the final read before the liar learns enough to blend in.
            </p>
          </article>
        </div>
      </section>

      <section className="arcade-section arcade-lobby" id="lobby" aria-labelledby="lobby-title">
        <ArcadeHeading id="lobby-title">Live lobby</ArcadeHeading>
        <div className="arcade-player-grid arcade-reveal" aria-label="Demo lobby players">
          {lobbyCrew.map((character, index) => (
            <button
              aria-pressed={selectedPlayer === index}
              className={selectedPlayer === index ? "arcade-player is-selected" : "arcade-player"}
              key={character.id}
              onClick={() => setSelectedPlayer(index)}
              style={{ "--accent": character.accent } as CSSProperties}
              type="button"
            >
              <span className="arcade-player__slot">{index + 1}</span>
              <CharacterImage character={character} />
              <strong>{character.name}</strong>
              <span className="arcade-player__ready">
                <Check aria-hidden="true" /> Ready
              </span>
            </button>
          ))}
        </div>
        <div className="arcade-room-status arcade-reveal" aria-live="polite">
          <span>
            <Globe aria-hidden="true" /> Room preview: B421QZ
          </span>
          <i aria-hidden="true" />
          <strong>6 / 12 players ready</strong>
          <i aria-hidden="true" />
          <span>
            {selectedPlayer === null
              ? "Choose a player card"
              : `${lobbyCrew[selectedPlayer]?.name} selected`}
          </span>
        </div>
      </section>

      <section className="arcade-section arcade-modes" id="modes" aria-labelledby="modes-title">
        <ArcadeHeading id="modes-title">Game modes</ArcadeHeading>
        <div className="arcade-mode-grid arcade-reveal" aria-label="Supported game modes">
          {(Object.keys(modeDetails) as ModeId[]).map((modeId) => {
            const mode = modeDetails[modeId];
            return (
              <button
                aria-pressed={selectedMode === modeId}
                className={selectedMode === modeId ? "arcade-mode is-selected" : "arcade-mode"}
                key={modeId}
                onClick={() => setSelectedMode(modeId)}
                style={{ "--accent": mode.accent } as CSSProperties}
                type="button"
              >
                <span className="arcade-mode__icon">{mode.icon}</span>
                <span className="arcade-mode__copy">
                  <strong>{mode.title}</strong>
                  <span>{mode.description}</span>
                  <small>Best for: {mode.bestFor}</small>
                </span>
                <span className="arcade-mode__lineup" aria-hidden="true">
                  {characters
                    .slice(modeId === "accusation" ? 3 : 7, modeId === "accusation" ? 8 : 12)
                    .map((character) => (
                      <CharacterImage character={character} key={character.id} />
                    ))}
                </span>
              </button>
            );
          })}
        </div>
        <p className="arcade-mode-status arcade-reveal" role="status">
          Cartridge selected: <strong>{modeDetails[selectedMode].title}</strong>
        </p>
      </section>

      <section className="arcade-ready" aria-labelledby="ready-title">
        <CharacterImage
          character={characters[1]}
          className="arcade-ready__character arcade-reveal"
        />
        <div className="arcade-ready__copy arcade-reveal">
          <h2 id="ready-title">
            <Zap aria-hidden="true" /> Ready to play? <Zap aria-hidden="true" />
          </h2>
          <p>Start the room. Share the code. Find the liar.</p>
          <div className="arcade-ready__actions">
            <a className="arcade-button arcade-button--pink" href="/play">
              Host game <ArrowRight aria-hidden="true" />
            </a>
            <a className="arcade-button arcade-button--cyan" href="/play?join=1">
              Join game <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
        <img
          alt=""
          className="arcade-ready__cabinet arcade-reveal"
          height="1200"
          loading="lazy"
          src="/arcade/cabinet-1200.webp"
          width="1200"
        />
      </section>
    </main>
  );
}

function arcadeCharacter(id: string, name: string, accent: string): ArcadeCharacter {
  return { id, name, accent, src: `/arcade/characters/${id}.webp` };
}

function CharacterImage({
  character,
  className,
  priority = false
}: {
  character: ArcadeCharacter;
  className?: string | undefined;
  priority?: boolean;
}) {
  return (
    <img
      alt=""
      className={className}
      decoding="async"
      height="512"
      loading={priority ? "eager" : "lazy"}
      src={character.src}
      width="512"
    />
  );
}

function ArcadeStat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <span className="arcade-stat">
      {icon}
      <strong>{value}</strong>
      <span>{label}</span>
    </span>
  );
}

function ArcadeHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div className="arcade-heading arcade-reveal">
      <span aria-hidden="true" />
      <i aria-hidden="true" />
      <h2 id={id}>{children}</h2>
      <i aria-hidden="true" />
      <span aria-hidden="true" />
    </div>
  );
}

function useArcadeMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const start = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger")
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        gsap.fromTo(
          ".arcade-hero-reveal",
          { opacity: 0, y: 24, scale: 0.985 },
          { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out" }
        );
        gsap.utils.toArray<HTMLElement>(".arcade-reveal").forEach((element) => {
          gsap.fromTo(
            element,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              ease: "power3.out",
              scrollTrigger: { trigger: element, start: "top 88%", once: true }
            }
          );
        });
        gsap.to(".arcade-hero-crew img", {
          y: -5,
          duration: 1.35,
          ease: "steps(3)",
          repeat: -1,
          yoyo: true,
          stagger: 0.1
        });
      }, root);
      cleanup = () => context.revert();
    };

    void start().catch(() => undefined);
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [rootRef]);
}

function ArcadeStarfield() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const start = async () => {
      const THREE = await import("three");
      if (cancelled) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
      camera.position.z = 8;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(720 * 3);
      for (let index = 0; index < positions.length; index += 3) {
        positions[index] = (seededCoordinate(index, 12.9898) - 0.5) * 22;
        positions[index + 1] = (seededCoordinate(index, 78.233) - 0.5) * 18;
        positions[index + 2] = (seededCoordinate(index, 37.719) - 0.5) * 10;
      }
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color: 0xdce8ff,
        size: 0.035,
        transparent: true,
        opacity: 0.72,
        sizeAttenuation: true
      });
      const stars = new THREE.Points(geometry, material);
      scene.add(stars);

      const resize = () => {
        const width = Math.max(1, mount.clientWidth);
        const height = Math.max(1, mount.clientHeight);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      resize();
      window.addEventListener("resize", resize);

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let frame = 0;
      const render = () => {
        stars.rotation.y += 0.00016;
        stars.rotation.x += 0.00003;
        renderer.render(scene, camera);
        if (!reducedMotion) frame = window.requestAnimationFrame(render);
      };
      render();

      cleanup = () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    };

    void start().catch(() => undefined);
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return <div className="arcade-starfield" ref={mountRef} />;
}

function seededCoordinate(index: number, multiplier: number) {
  const value = Math.sin((index + 1) * multiplier) * 43758.5453;
  return value - Math.floor(value);
}
