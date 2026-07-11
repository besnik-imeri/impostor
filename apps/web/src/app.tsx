import {
  AVATARS,
  DEFAULT_ROOM_CONFIG,
  PLAYER_COLORS,
  PLAYER_LIMITS,
  ROUND_LIMITS,
  WORD_CATEGORIES
} from "@impostor/domain";
import type {
  AvatarId,
  GameMode,
  PlayerColor,
  PrivatePlayerSnapshot,
  PublicPlayerSnapshot,
  PublicRoomSnapshot,
  RoomConfig
} from "@impostor/domain";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  Clipboard,
  Crown,
  Eye,
  Flag,
  Gamepad2,
  Home,
  KeyRound,
  LogOut,
  Moon,
  Play,
  RotateCcw,
  Settings,
  Shield,
  SlidersHorizontal,
  Sun,
  TimerReset,
  Trophy,
  User,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap
} from "lucide-react";
import QRCode from "qrcode";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction
} from "react";
import { AvatarMark } from "./components/avatar-mark";
import { LandingExperience } from "./components/landing-experience";
import { SegmentedControl } from "./components/segmented-control";
import {
  createRoom,
  createRoomSocket,
  joinRoom,
  type ClientCommand,
  type RoomSessionResponse,
  type ServerEvent
} from "./lib/api";
import {
  clearStoredRoomSession,
  readStoredRoomSession,
  storeRoomSession,
  type StoredRoomSession
} from "./lib/session";
import { getAvatarLabel } from "./lib/avatars";
import { isValidRoomConfigDraft } from "./lib/room-config";
import { loadThemePreference, saveThemePreference, type ThemePreference } from "./lib/theme";

type ConnectionState = "idle" | "connecting" | "open" | "closed" | "error";
type SetupPanel = "host" | "join";

interface ProfileDraft {
  nickname: string;
  avatar: AvatarId;
  color: PlayerColor;
}

interface AppRoute {
  screen: "landing" | "play";
  initialRoomCode: string;
  forceJoin: boolean;
}

const modeOptions: readonly { label: string; value: GameMode }[] = [
  { label: "Accusation", value: "accusation" },
  { label: "Suspicion", value: "suspicion" }
];

const avatarGroups: readonly { label: string; avatars: readonly AvatarId[] }[] = [
  {
    label: "Boy avatars",
    avatars: AVATARS.filter((avatar) => avatar.startsWith("boy-"))
  },
  {
    label: "Girl avatars",
    avatars: AVATARS.filter((avatar) => avatar.startsWith("girl-"))
  }
];

const fallbackAvatar = AVATARS[0] ?? "boy-1";
const fallbackColor = PLAYER_COLORS[0] ?? "#276ef1";
const secondAvatar = AVATARS.find((avatar) => avatar.startsWith("girl-")) ?? fallbackAvatar;
const secondColor = PLAYER_COLORS[1] ?? fallbackColor;

const defaultProfile: ProfileDraft = {
  nickname: "",
  avatar: fallbackAvatar,
  color: fallbackColor
};

export function App() {
  const route = getRoute();
  const [theme, setTheme] = useThemePreference();
  const toggleTheme = useCallback(
    () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    [setTheme]
  );

  return route.screen === "play" ? (
    <PlayApp
      forceJoin={route.forceJoin}
      initialRoomCode={route.initialRoomCode}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  ) : (
    <LandingPage theme={theme} onToggleTheme={toggleTheme} />
  );
}

function getRoute(): AppRoute {
  const url = new URL(window.location.href);
  const initialRoomCode = (url.searchParams.get("room") ?? "").toUpperCase();

  if (url.pathname === "/play") {
    return {
      screen: "play",
      initialRoomCode,
      forceJoin: Boolean(initialRoomCode) || url.searchParams.get("join") === "1"
    };
  }

  if (initialRoomCode) {
    const nextUrl = new URL("/play", window.location.origin);
    nextUrl.searchParams.set("room", initialRoomCode);
    window.history.replaceState(null, "", nextUrl.toString());
    return {
      screen: "play",
      initialRoomCode,
      forceJoin: true
    };
  }

  return {
    screen: "landing",
    initialRoomCode: "",
    forceJoin: false
  };
}

function LandingPage({
  theme,
  onToggleTheme
}: {
  theme: ThemePreference;
  onToggleTheme: () => void;
}) {
  return <LandingExperience theme={theme} onToggleTheme={onToggleTheme} />;
}

function PhoneStatusBar() {
  return (
    <div className="phone-status-bar" aria-hidden="true">
      <span>9:41</span>
      <span className="phone-status-icons">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

function StatPill({ icon, label, detail }: { icon: ReactNode; label: string; detail: string }) {
  return (
    <span className="stat-pill">
      {icon}
      <strong>{label}</strong>
      <span>{detail}</span>
    </span>
  );
}

function BrandLockup({ href }: { href?: string }) {
  const content = (
    <>
      <span className="brand-mark" aria-hidden="true">
        IM
      </span>
      <span className="brand-word">Impostor</span>
    </>
  );

  return href ? (
    <a className="brand-lockup" href={href}>
      {content}
    </a>
  ) : (
    <span className="brand-lockup">{content}</span>
  );
}

function ThemeToggle({ theme, onToggle }: { theme: ThemePreference; onToggle: () => void }) {
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      aria-label={`Switch to ${nextTheme} theme`}
      className="icon-button theme-toggle"
      title={`Switch to ${nextTheme} theme`}
      type="button"
      onClick={onToggle}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function AppTopBar({
  eyebrow,
  meta,
  theme,
  title,
  onToggleTheme
}: {
  eyebrow: string;
  meta?: string;
  theme: ThemePreference;
  title: string;
  onToggleTheme: () => void;
}) {
  return (
    <header className="app-topbar">
      <BrandLockup href="/" />
      <div className="topbar-center">
        <span>{eyebrow}</span>
        <strong>{title}</strong>
      </div>
      <div className="topbar-actions">
        {meta ? (
          <span className="connection-pill topbar-meta">
            <Users size={15} />
            {meta}
          </span>
        ) : null}
        <button
          aria-label="Notifications"
          className="icon-button"
          title="Notifications"
          type="button"
        >
          <Bell size={18} />
        </button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}

type SidebarKey =
  "home" | "host" | "join" | "play" | "modes" | "profile" | "leaderboard" | "settings";

function AppSidebar({ active }: { active: SidebarKey }) {
  const items: readonly { key: SidebarKey; icon: ReactNode; label: string }[] = [
    { key: "home", icon: <Home size={17} />, label: "Home" },
    { key: "host", icon: <Gamepad2 size={17} />, label: "Host game" },
    { key: "join", icon: <KeyRound size={17} />, label: "Join game" },
    { key: "play", icon: <BookOpen size={17} />, label: "How to play" },
    { key: "modes", icon: <Shield size={17} />, label: "Game modes" },
    { key: "profile", icon: <User size={17} />, label: "Profile" },
    { key: "leaderboard", icon: <Trophy size={17} />, label: "Leaderboard" },
    { key: "settings", icon: <Settings size={17} />, label: "Settings" }
  ];

  return (
    <aside className="app-sidebar" aria-label="Game navigation">
      <nav>
        {items.map((item) => (
          <a
            aria-current={active === item.key ? "page" : undefined}
            className={active === item.key ? "is-active" : ""}
            href={item.key === "home" ? "/" : "/play"}
            key={item.key}
          >
            {item.icon}
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
      <StatPill icon={<Users size={18} />} label="3-12" detail="players" />
    </aside>
  );
}

function PlayApp({
  initialRoomCode,
  forceJoin,
  theme,
  onToggleTheme
}: {
  initialRoomCode: string;
  forceJoin: boolean;
  theme: ThemePreference;
  onToggleTheme: () => void;
}) {
  const socketRef = useRef<WebSocket | undefined>(undefined);
  const [storedSession, setStoredSession] = useState<StoredRoomSession | undefined>(() =>
    readStoredRoomSession()
  );
  const [room, setRoom] = useState<PublicRoomSnapshot | undefined>();
  const [privateSnapshot, setPrivateSnapshot] = useState<PrivatePlayerSnapshot | undefined>();
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    storedSession ? "connecting" : "idle"
  );
  const [error, setError] = useState<string | undefined>();

  const connect = useCallback((session: StoredRoomSession) => {
    socketRef.current?.close();

    const socket = createRoomSocket(session.code);
    socketRef.current = socket;

    socket.addEventListener("open", () => setConnectionState("open"));
    socket.addEventListener("close", () => setConnectionState("closed"));
    socket.addEventListener("error", () => {
      setConnectionState("error");
      setError("Realtime connection failed. Refresh or rejoin the room.");
    });
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data as string) as ServerEvent;

      if (message.type === "room.snapshot" || message.type === "game.finished") {
        setRoom(message.payload);
      }

      if (message.type === "private.snapshot") {
        setPrivateSnapshot(message.payload);
      }

      if (message.type === "command.rejected") {
        setError(message.payload.message);
      }
    });
  }, []);

  useEffect(() => {
    if (!storedSession) {
      return;
    }

    connect(storedSession);

    return () => {
      socketRef.current?.close();
    };
  }, [connect, storedSession]);

  useEffect(() => {
    if (!storedSession) {
      return;
    }

    const interval = window.setInterval(() => {
      sendCommand(socketRef.current, { type: "client.heartbeat" });
    }, 25_000);

    return () => window.clearInterval(interval);
  }, [storedSession]);

  const send = useCallback((command: ClientCommand) => {
    setError(undefined);
    sendCommand(socketRef.current, command);
  }, []);

  const acceptSession = useCallback((session: RoomSessionResponse) => {
    storeRoomSession(session);
    const nextStored = {
      code: session.room.code,
      playerId: session.player.playerId
    };
    setStoredSession(nextStored);
    setRoom(session.room);
    setPrivateSnapshot(session.player);
    setError(undefined);
    setConnectionState("connecting");
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.close();
    clearStoredRoomSession();
    setStoredSession(undefined);
    setRoom(undefined);
    setPrivateSnapshot(undefined);
    setConnectionState("idle");
    setError(undefined);
    window.history.replaceState(null, "", "/play");
  }, []);

  return (
    <main className="app-shell">
      {room && privateSnapshot ? (
        <RoomScreen
          room={room}
          privateSnapshot={privateSnapshot}
          connectionState={connectionState}
          error={error}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onSend={send}
          onLeave={leaveRoom}
        />
      ) : (
        <PlayHomeScreen
          connectionState={connectionState}
          error={error}
          forceJoin={forceJoin}
          initialRoomCode={initialRoomCode}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onCreate={async (input) => acceptSession(await createRoom(input))}
          onJoin={async (code, input) => acceptSession(await joinRoom(code, input))}
          onClearError={() => setError(undefined)}
        />
      )}
    </main>
  );
}

function PlayHomeScreen({
  initialRoomCode,
  forceJoin,
  connectionState,
  error,
  theme,
  onToggleTheme,
  onCreate,
  onJoin,
  onClearError
}: {
  initialRoomCode: string;
  forceJoin: boolean;
  connectionState: ConnectionState;
  error: string | undefined;
  theme: ThemePreference;
  onToggleTheme: () => void;
  onCreate: Parameters<typeof CreateRoomForm>[0]["onCreate"];
  onJoin: Parameters<typeof JoinRoomForm>[0]["onJoin"];
  onClearError: () => void;
}) {
  const [activePanel, setActivePanel] = useState<SetupPanel>(
    initialRoomCode || forceJoin ? "join" : "host"
  );

  return (
    <section className="arcade-app-frame play-home">
      <PhoneStatusBar />
      <AppSidebar active={activePanel === "host" ? "host" : "join"} />
      <div className="app-stage">
        <AppTopBar
          eyebrow="Ready room"
          theme={theme}
          title={activePanel === "host" ? "Host a game" : "Join a game"}
          onToggleTheme={onToggleTheme}
        />
        <div className="play-dashboard-grid host-workspace-grid">
          <section className="mobile-lobby-summary" aria-label="Mobile lobby summary">
            <div className="current-lobby-card">
              <div className="preview-heading">
                <strong>Current lobby</strong>
                <span>Host</span>
              </div>
              <div className="current-lobby-main">
                <div>
                  <h2>Neon Night</h2>
                  <p>
                    Code: <b>X7K9D</b>
                  </p>
                  <span>8 / 12 players</span>
                </div>
                <div className="mini-qr mini-qr-large" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <AvatarStack />
            </div>

            <button className="quick-play-row" type="button" onClick={() => setActivePanel("join")}>
              <ZapIcon />
              <span>
                <strong>Quick play</strong>
                Jump into a public game
              </span>
              <ArrowRight size={18} />
            </button>

            <div className="quick-action-grid" aria-label="Quick actions">
              <button
                className="quick-action-card is-host"
                type="button"
                onClick={() => {
                  onClearError();
                  setActivePanel("host");
                }}
              >
                <Gamepad2 size={28} />
                <strong>Host game</strong>
              </button>
              <button
                className="quick-action-card is-join"
                type="button"
                onClick={() => {
                  onClearError();
                  setActivePanel("join");
                }}
              >
                <KeyRound size={28} />
                <strong>Join game</strong>
              </button>
              <button className="quick-action-card is-modes" type="button">
                <Shield size={28} />
                <strong>Game modes</strong>
              </button>
              <button className="quick-action-card is-how" type="button">
                <BookOpen size={28} />
                <strong>How to play</strong>
              </button>
            </div>

            <button className="profile-strip" type="button">
              <User size={25} />
              <span>
                <strong>Profile</strong>
                View stats & history
              </span>
              <ArrowRight size={18} />
            </button>

            <LeaderboardPreview />
          </section>

          <div className="setup-panel play-setup-panel host-command-panel">
            <div className="workspace-heading">
              <span>{activePanel === "host" ? "Host a game" : "Join a game"}</span>
              <h1>{activePanel === "host" ? "Host a game" : "Join a game"}</h1>
              <p>
                {activePanel === "host"
                  ? "Create your lobby and invite your friends."
                  : "Enter a lobby code, pick your table identity, and jump in."}
              </p>
            </div>
            <div className="panel-tabs" role="tablist" aria-label="Choose setup flow">
              <button
                aria-selected={activePanel === "host"}
                className={activePanel === "host" ? "is-selected" : ""}
                type="button"
                onClick={() => {
                  onClearError();
                  setActivePanel("host");
                }}
              >
                Host
              </button>
              <button
                aria-selected={activePanel === "join"}
                className={activePanel === "join" ? "is-selected" : ""}
                type="button"
                onClick={() => {
                  onClearError();
                  setActivePanel("join");
                }}
              >
                Join
              </button>
            </div>

            {activePanel === "host" ? (
              <CreateRoomForm busy={connectionState === "connecting"} onCreate={onCreate} />
            ) : (
              <JoinRoomForm
                busy={connectionState === "connecting"}
                initialRoomCode={initialRoomCode}
                onJoin={onJoin}
              />
            )}

            {error ? <p className="form-error">{error}</p> : null}
          </div>

          <aside className="lobby-preview-panel">
            <div className="preview-heading">
              <strong>3. Lobby preview</strong>
              <span>Placeholder</span>
            </div>
            <div className="preview-code-card">
              <span>Lobby code</span>
              <strong>X7K9D</strong>
              <p>Share this code or scan to join.</p>
              <div className="mini-qr preview-qr" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="preview-player-row">
              <span>8 / 12 players joined</span>
              <AvatarStack />
            </div>
            <button
              aria-label="Create room"
              className="primary-button full-width lobby-preview-submit"
              disabled={activePanel !== "host" || connectionState === "connecting"}
              form="create-room-form"
              type="submit"
            >
              Create lobby
              <ArrowRight size={18} />
            </button>
            <p className="preview-expiry-note">Lobby will be active for 30 minutes.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}

function AvatarStack() {
  return (
    <div className="avatar-stack" aria-hidden="true">
      <AvatarMark avatar="girl-5" color="#ff5a98" size="xs" />
      <AvatarMark avatar="boy-3" color="#1db4ff" size="xs" />
      <AvatarMark avatar="girl-11" color="#71f264" size="xs" />
      <AvatarMark avatar="boy-8" color="#ffd21f" size="xs" />
      <AvatarMark avatar="girl-2" color="#ff8b3d" size="xs" />
      <AvatarMark avatar="boy-10" color="#b95cff" size="xs" />
      <span>+4</span>
    </div>
  );
}

function LeaderboardPreview() {
  return (
    <div className="leaderboard-preview">
      <div className="preview-heading">
        <strong>Leaderboard</strong>
        <span>Weekly top players</span>
      </div>
      <div className="preview-row">
        <span>1</span>
        <AvatarMark avatar="girl-5" color="#7cf25f" size="sm" />
        <strong>PixelMaster</strong>
        <b>2,450</b>
      </div>
      <div className="preview-row">
        <span>2</span>
        <AvatarMark avatar="boy-3" color="#ff2e8b" size="sm" />
        <strong>DeceptiOn</strong>
        <b>1,870</b>
      </div>
      <div className="preview-row">
        <span>3</span>
        <AvatarMark avatar="girl-11" color="#b95cff" size="sm" />
        <strong>MindGames</strong>
        <b>1,420</b>
      </div>
      <button className="secondary-button full-width" type="button">
        View full leaderboard
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

function ZapIcon() {
  return <Zap size={28} strokeWidth={2.5} />;
}

function CreateRoomForm({
  busy,
  onCreate
}: {
  busy: boolean;
  onCreate: (input: { host: ProfileDraft; config: Partial<RoomConfig> }) => Promise<void>;
}) {
  const [profile, setProfile] = useState<ProfileDraft>(defaultProfile);
  const [config, setConfig] = useState<RoomConfig>({
    ...DEFAULT_ROOM_CONFIG
  });

  return (
    <form
      className="form-stack"
      id="create-room-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (profile.nickname.trim().length < 2) {
          return;
        }

        void onCreate({ host: profile, config });
      }}
    >
      <div className="form-section-label">2. Game settings</div>
      <ProfileFields profile={profile} onChange={setProfile} />
      <SegmentedControl
        label="Game mode"
        options={modeOptions}
        value={config.mode}
        onChange={(mode) => setConfig((current) => ({ ...current, mode }))}
      />
      <label className="field">
        <span>Category</span>
        <select
          value={config.categoryId}
          onChange={(event) =>
            setConfig((current) => ({ ...current, categoryId: event.target.value }))
          }
        >
          {WORD_CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <div className="two-column">
        <NumberField
          label="Players"
          max={PLAYER_LIMITS.max}
          min={PLAYER_LIMITS.min}
          value={config.maxPlayers}
          onChange={(maxPlayers) => setConfig((current) => ({ ...current, maxPlayers }))}
        />
        <NumberField
          label="Rounds"
          max={ROUND_LIMITS.maxCount}
          min={ROUND_LIMITS.minCount}
          value={config.roundCount}
          onChange={(roundCount) => setConfig((current) => ({ ...current, roundCount }))}
        />
      </div>
      <NumberField
        label="Round seconds"
        max={ROUND_LIMITS.maxDurationSeconds}
        min={ROUND_LIMITS.minDurationSeconds}
        step={15}
        value={config.roundDurationSeconds}
        onChange={(roundDurationSeconds) =>
          setConfig((current) => ({ ...current, roundDurationSeconds }))
        }
      />
      <button
        className="primary-button host-inline-submit"
        disabled={busy || profile.nickname.trim().length < 2}
        type="submit"
      >
        <Play size={18} />
        Create room
      </button>
    </form>
  );
}

function JoinRoomForm({
  busy,
  initialRoomCode,
  onJoin
}: {
  busy: boolean;
  initialRoomCode: string;
  onJoin: (code: string, input: ProfileDraft) => Promise<void>;
}) {
  const [roomCode, setRoomCode] = useState(initialRoomCode.toUpperCase());
  const [profile, setProfile] = useState<ProfileDraft>({
    ...defaultProfile,
    avatar: secondAvatar,
    color: secondColor
  });

  return (
    <form
      className="form-stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (roomCode.length < 4 || profile.nickname.trim().length < 2) {
          return;
        }

        void onJoin(roomCode, profile);
      }}
    >
      <div className="form-section-label">Join lobby</div>
      <label className="field">
        <span>Room code</span>
        <input
          autoCapitalize="characters"
          inputMode="text"
          maxLength={6}
          placeholder="ABC123"
          value={roomCode}
          onChange={(event) =>
            setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
          }
        />
      </label>
      <ProfileFields profile={profile} onChange={setProfile} />
      <button
        className="primary-button"
        disabled={busy || roomCode.length < 4 || profile.nickname.trim().length < 2}
        type="submit"
      >
        <Check size={18} />
        Join room
      </button>
    </form>
  );
}

function ProfileFields({
  profile,
  onChange
}: {
  profile: ProfileDraft;
  onChange: (profile: ProfileDraft) => void;
}) {
  return (
    <>
      <label className="field">
        <span>Nickname</span>
        <input
          autoComplete="nickname"
          maxLength={24}
          placeholder="Your table name"
          value={profile.nickname}
          onChange={(event) => onChange({ ...profile, nickname: event.target.value })}
        />
      </label>
      <details className="profile-customizer">
        <summary>
          <AvatarMark avatar={profile.avatar} color={profile.color} size="sm" />
          <span>Customize avatar</span>
        </summary>
        <fieldset className="field-group">
          <legend>Avatar</legend>
          <div className="avatar-groups">
            {avatarGroups.map((group) => (
              <div className="avatar-group" key={group.label}>
                <div className="avatar-group-title">{group.label}</div>
                <div className="avatar-picker">
                  {group.avatars.map((avatar) => (
                    <button
                      aria-label={`Use ${getAvatarLabel(avatar)}`}
                      className={profile.avatar === avatar ? "is-selected" : ""}
                      key={avatar}
                      type="button"
                      onClick={() => onChange({ ...profile, avatar })}
                    >
                      <AvatarMark avatar={avatar} color={profile.color} size="picker" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>
        <fieldset className="field-group">
          <legend>Color</legend>
          <div className="color-picker">
            {PLAYER_COLORS.map((color) => (
              <button
                aria-label={`Use ${color} player color`}
                className={profile.color === color ? "is-selected" : ""}
                key={color}
                style={{ "--swatch": color } as CSSProperties}
                type="button"
                onClick={() => onChange({ ...profile, color })}
              />
            ))}
          </div>
        </fieldset>
      </details>
    </>
  );
}

function RoomScreen({
  room,
  privateSnapshot,
  connectionState,
  error,
  theme,
  onToggleTheme,
  onSend,
  onLeave
}: {
  room: PublicRoomSnapshot;
  privateSnapshot: PrivatePlayerSnapshot;
  connectionState: ConnectionState;
  error: string | undefined;
  theme: ThemePreference;
  onToggleTheme: () => void;
  onSend: (command: ClientCommand) => void;
  onLeave: () => void;
}) {
  const me = room.players.find((player) => player.id === privateSnapshot.playerId);
  const currentRound = room.currentRound;
  const leaderboard = useMemo(
    () =>
      [...room.players].sort(
        (left, right) => right.score - left.score || left.nickname.localeCompare(right.nickname)
      ),
    [room.players]
  );
  const showResults =
    (room.phase === "results" || room.phase === "finished") && Boolean(currentRound?.resolution);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const visibleLeaderboardOpen = !showResults && leaderboardOpen;

  if (!me) {
    return (
      <section className="room-layout room-layout-empty">
        <p className="form-error">Your room profile was not found.</p>
        <button className="secondary-button" type="button" onClick={onLeave}>
          Leave
        </button>
      </section>
    );
  }

  return (
    <section className={`arcade-app-frame room-layout room-phase-${room.phase}`}>
      <AppSidebar
        active={
          room.phase === "lobby"
            ? me.isHost
              ? "host"
              : "join"
            : showResults
              ? "leaderboard"
              : "play"
        }
      />
      <div className="app-stage">
        <AppTopBar
          eyebrow={`Lobby code: ${room.code}`}
          meta={`${room.players.length} / ${room.config.maxPlayers}`}
          theme={theme}
          title={
            room.phase === "lobby" ? "Host lobby" : showResults ? "Round results" : "Take action"
          }
          onToggleTheme={onToggleTheme}
        />
        <div className="room-content">
          <RoomHeader
            connectionState={connectionState}
            me={me}
            privateSnapshot={privateSnapshot}
            room={room}
            leaderboardOpen={visibleLeaderboardOpen}
            showLeaderboardButton={!showResults}
            onToggleLeaderboard={() => setLeaderboardOpen((open) => !open)}
            onLeave={onLeave}
          />

          {error ? <p className="form-error">{error}</p> : null}

          {room.phase === "lobby" ? (
            <LobbyPanel me={me} room={room} onSend={onSend} />
          ) : showResults ? (
            <ResultsPanel leaderboard={leaderboard} me={me} room={room} onSend={onSend} />
          ) : currentRound ? (
            <RoundPanel me={me} privateSnapshot={privateSnapshot} room={room} onSend={onSend} />
          ) : null}

          {visibleLeaderboardOpen ? <Leaderboard players={leaderboard} /> : null}
        </div>
      </div>
    </section>
  );
}

function RoomHeader({
  room,
  me,
  privateSnapshot,
  connectionState,
  leaderboardOpen,
  showLeaderboardButton,
  onToggleLeaderboard,
  onLeave
}: {
  room: PublicRoomSnapshot;
  me: PublicPlayerSnapshot;
  privateSnapshot: PrivatePlayerSnapshot;
  connectionState: ConnectionState;
  leaderboardOpen: boolean;
  showLeaderboardButton: boolean;
  onToggleLeaderboard: () => void;
  onLeave: () => void;
}) {
  const joinUrl = useMemo(() => {
    const url = new URL("/play", window.location.origin);
    url.searchParams.set("room", room.code);
    return url.toString();
  }, [room.code]);
  const [qrCode, setQrCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void QRCode.toDataURL(joinUrl, {
      margin: 1,
      width: 180,
      color: {
        dark: "#171426",
        light: "#ffffff"
      }
    }).then(setQrCode);
  }, [joinUrl]);

  return (
    <header className="room-header">
      <div className="room-code-block">
        <div className="room-code-label">Room code</div>
        <div className="room-code">{room.code}</div>
      </div>
      <div className="header-actions">
        <ConnectionPill state={connectionState} />
        {showLeaderboardButton ? (
          <button
            aria-expanded={leaderboardOpen}
            aria-label={leaderboardOpen ? "Hide leaderboard" : "Show leaderboard"}
            className="icon-button"
            title={leaderboardOpen ? "Hide leaderboard" : "Show leaderboard"}
            type="button"
            onClick={onToggleLeaderboard}
          >
            <Trophy size={18} />
          </button>
        ) : null}
        <button
          className="icon-button"
          title="Copy join link"
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(joinUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          }}
        >
          {copied ? <Check size={18} /> : <Clipboard size={18} />}
        </button>
        <button className="icon-button" title="Leave room" type="button" onClick={onLeave}>
          <LogOut size={18} />
        </button>
      </div>
      <div className="identity-strip">
        <AvatarMark avatar={me.avatar} color={me.color} />
        <div>
          <strong>{me.nickname}</strong>
          <span>{privateSnapshot.isHost ? "Host" : "Player"}</span>
        </div>
      </div>
      {qrCode ? (
        <img alt={`QR code for room ${room.code}`} className="qr-code" src={qrCode} />
      ) : null}
    </header>
  );
}

function LobbyPanel({
  room,
  me,
  onSend
}: {
  room: PublicRoomSnapshot;
  me: PublicPlayerSnapshot;
  onSend: (command: ClientCommand) => void;
}) {
  const readyCount = room.players.filter((player) => player.ready).length;
  const allReady =
    room.players.length >= PLAYER_LIMITS.min && room.players.every((player) => player.ready);
  const canHostStart = me.isHost && allReady;
  const configKey = roomConfigKey(room.config);
  const startHint =
    room.players.length < PLAYER_LIMITS.min
      ? `${PLAYER_LIMITS.min - room.players.length} more player needed`
      : "Waiting for every player to ready up";

  return (
    <section className="phase-panel lobby-panel">
      <div className="phase-heading">
        <div>
          <span className="round-label">Lobby</span>
          <h2>Gather the suspects.</h2>
          <p>
            {room.players.length}/{room.config.maxPlayers} joined. {readyCount} ready.
          </p>
        </div>
        <button
          className={me.ready ? "secondary-button is-positive" : "primary-button"}
          type="button"
          onClick={() =>
            onSend({
              type: "player.ready.set",
              payload: { ready: !me.ready }
            })
          }
        >
          <Check size={18} />
          {me.ready ? "Ready" : "Ready up"}
        </button>
      </div>
      {me.isHost ? (
        <LobbyConfigPanel
          initialConfig={room.config}
          currentPlayers={room.players.length}
          key={configKey}
          onApply={(config) =>
            onSend({
              type: "host.room.config.update",
              payload: { config }
            })
          }
        />
      ) : (
        <RoomConfigSummary config={room.config} />
      )}
      <PlayerGrid players={room.players} />
      {me.isHost ? (
        <div className="host-start-block">
          <button
            className="primary-button full-width"
            disabled={!canHostStart}
            type="button"
            onClick={() => onSend({ type: "host.game.start" })}
          >
            <Play size={18} />
            Start game
          </button>
          {!canHostStart ? <span>{startHint}</span> : <span>All set. Start the reveal.</span>}
        </div>
      ) : null}
    </section>
  );
}

function LobbyConfigPanel({
  initialConfig,
  currentPlayers,
  onApply
}: {
  initialConfig: RoomConfig;
  currentPlayers: number;
  onApply: (config: RoomConfig) => void;
}) {
  const [config, setConfig] = useState<RoomConfig>(initialConfig);
  const dirty = !roomConfigsEqual(config, initialConfig);
  const valid = isValidRoomConfigDraft(config, currentPlayers);

  return (
    <form
      className="lobby-config-panel"
      onSubmit={(event) => {
        event.preventDefault();
        if (!dirty || !valid) {
          return;
        }

        onApply(config);
      }}
    >
      <div className="config-panel-heading">
        <SlidersHorizontal size={18} />
        <strong>Game settings</strong>
      </div>
      <SegmentedControl
        label="Game mode"
        options={modeOptions}
        value={config.mode}
        onChange={(mode) => setConfig({ ...config, mode })}
      />
      <label className="field">
        <span>Category</span>
        <select
          value={config.categoryId}
          onChange={(event) => setConfig({ ...config, categoryId: event.target.value })}
        >
          {WORD_CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <div className="two-column">
        <NumberField
          label="Players"
          max={PLAYER_LIMITS.max}
          min={Math.max(PLAYER_LIMITS.min, currentPlayers)}
          value={config.maxPlayers}
          onChange={(maxPlayers) => setConfig({ ...config, maxPlayers })}
        />
        <NumberField
          label="Rounds"
          max={ROUND_LIMITS.maxCount}
          min={ROUND_LIMITS.minCount}
          value={config.roundCount}
          onChange={(roundCount) => setConfig({ ...config, roundCount })}
        />
      </div>
      <NumberField
        label="Round seconds"
        max={ROUND_LIMITS.maxDurationSeconds}
        min={ROUND_LIMITS.minDurationSeconds}
        step={15}
        value={config.roundDurationSeconds}
        onChange={(roundDurationSeconds) => setConfig({ ...config, roundDurationSeconds })}
      />
      <button className="secondary-button full-width" disabled={!dirty || !valid} type="submit">
        <Check size={18} />
        Apply settings
      </button>
    </form>
  );
}

function RoomConfigSummary({ config }: { config: RoomConfig }) {
  const category = WORD_CATEGORIES.find((candidate) => candidate.id === config.categoryId);

  return (
    <div className="config-summary" aria-label="Game settings">
      <span>{config.mode === "accusation" ? "Accusation" : "Suspicion"}</span>
      <span>{category?.label ?? config.categoryId}</span>
      <span>{config.roundCount} rounds</span>
      <span>{config.roundDurationSeconds}s timer</span>
    </div>
  );
}

function RoundPanel({
  room,
  me,
  privateSnapshot,
  onSend
}: {
  room: PublicRoomSnapshot;
  me: PublicPlayerSnapshot;
  privateSnapshot: PrivatePlayerSnapshot;
  onSend: (command: ClientCommand) => void;
}) {
  const round = room.currentRound;
  const now = useNow(250);
  const [pendingAccusation, setPendingAccusation] = useState<
    { roundId: string; playerId: string } | undefined
  >();

  if (!round) {
    return null;
  }

  const startingSpeaker = room.players.find((player) => player.id === round.startingSpeakerId);
  const mySuspicion = round.suspicions.find((suspicion) => suspicion.suspectingPlayerId === me.id);
  const pendingAccusationId =
    pendingAccusation?.roundId === round.id ? pendingAccusation.playerId : undefined;
  const pendingPlayer = pendingAccusation
    ? room.players.find((player) => player.id === pendingAccusationId)
    : undefined;
  const remainingMs = Math.max(0, round.endsAt - now);
  const canAct = room.phase === "round" && !round.resolution;
  const isImpostor = privateSnapshot.role === "impostor";
  const canAccuse = canAct && !isImpostor;

  return (
    <section className="round-panel live-game-board">
      <div className="how-play-panel">
        <div className="phase-heading">
          <div>
            <span className="round-label">How to play</span>
            <h2>How to play</h2>
            <p>A game of deception, deduction, and persuasion.</p>
          </div>
        </div>
        <div className="instruction-grid">
          <InstructionCard
            icon={<BookOpen size={36} />}
            title="1. The word"
            text={
              isImpostor
                ? "Everyone else knows the secret word. You only know that you are the impostor."
                : `Your secret word is ${privateSnapshot.visibleWord ?? "being revealed"}.`
            }
          />
          <InstructionCard
            icon={<Users size={36} />}
            title="2. Discuss & deceive"
            text="Talk, ask questions, and try to figure out who does not know."
          />
          <InstructionCard
            icon={<Zap size={36} />}
            title="3. Take action"
            text="Accuse, suspect, or clear players. Earn points when your read is right."
          />
        </div>
        <div className={isImpostor ? "role-card is-impostor" : "role-card is-word"}>
          <Shield size={30} />
          <div>
            <span>{isImpostor ? "Impostor note" : "Player note"}</span>
            <p>
              {isImpostor
                ? "One player is the impostor and does NOT know the word. Blend in. Mislead. Survive."
                : "You know the word. Help the group without making your clues too obvious."}
            </p>
          </div>
        </div>
      </div>

      <aside className="round-score-panel">
        <div className="round-score-header">
          <span>
            Round {round.number} / {room.config.roundCount}
          </span>
          <strong>
            {Math.ceil(remainingMs / 1000)
              .toString()
              .padStart(2, "0")}{" "}
            sec
          </strong>
        </div>
        <div className="round-side">
          <TimerDial remainingMs={remainingMs} totalMs={room.config.roundDurationSeconds * 1000} />
          <div className="speaker-chip">
            <Gamepad2 size={17} />
            <span>
              Starting speaker: <strong>{startingSpeaker?.nickname ?? "Unknown"}</strong>
            </span>
          </div>
        </div>
        <Leaderboard players={room.players} />
      </aside>

      <aside className="take-action-panel">
        <div className="preview-heading">
          <strong>Take action</strong>
          <span>What will you do?</span>
        </div>
        <div className="action-button-stack">
          <button
            className="take-action-button is-accuse"
            disabled={!canAccuse}
            type="button"
            onClick={() => {
              const firstTarget = room.players.find((player) => player.id !== me.id);
              if (firstTarget) {
                setPendingAccusation({ roundId: round.id, playerId: firstTarget.id });
              }
            }}
          >
            <Flag size={24} />
            <span>
              <strong>Accuse</strong>
              Eliminate a player
            </span>
          </button>
          <button
            className="take-action-button is-suspect"
            disabled={!canAct || Boolean(mySuspicion)}
            type="button"
          >
            <Eye size={24} />
            <span>
              <strong>Suspect</strong>
              Mark as suspicious
            </span>
          </button>
          <button className="take-action-button is-clear" disabled={!canAct} type="button">
            <Shield size={24} />
            <span>
              <strong>Clear</strong>
              Defend a player
            </span>
          </button>
        </div>

        <div className="action-grid live-target-grid">
          {room.config.mode === "suspicion" ? (
            <ActionSection
              disabled={!canAct || Boolean(mySuspicion)}
              icon={<Eye size={18} />}
              title="Suspicion"
              description={
                mySuspicion
                  ? "Suspicion locked for this round."
                  : "Mark one player. You cannot change it."
              }
            >
              {room.players
                .filter((player) => player.id !== me.id)
                .map((player) => (
                  <PlayerActionButton
                    disabled={!canAct || Boolean(mySuspicion)}
                    key={player.id}
                    player={player}
                    selected={mySuspicion?.targetPlayerId === player.id}
                    onClick={() =>
                      onSend({
                        type: "player.suspect.create",
                        payload: { targetPlayerId: player.id }
                      })
                    }
                  />
                ))}
            </ActionSection>
          ) : null}

          <ActionSection
            disabled={!canAccuse}
            icon={<Flag size={18} />}
            title="Accusation"
            description={
              isImpostor
                ? "The impostor cannot accuse."
                : "Pick a player, then confirm the accusation."
            }
          >
            {room.players
              .filter((player) => player.id !== me.id)
              .map((player) => (
                <PlayerActionButton
                  disabled={!canAccuse}
                  key={player.id}
                  player={player}
                  selected={pendingAccusationId === player.id}
                  onClick={() => setPendingAccusation({ roundId: round.id, playerId: player.id })}
                />
              ))}
          </ActionSection>
        </div>

        {pendingPlayer && canAccuse ? (
          <div className="accuse-confirm" role="dialog" aria-labelledby="accuse-confirm-title">
            <AvatarMark avatar={pendingPlayer.avatar} color={pendingPlayer.color} size="lg" />
            <div>
              <span>Final accusation</span>
              <strong id="accuse-confirm-title">Accuse {pendingPlayer.nickname}?</strong>
              <p>This resolves the round immediately.</p>
            </div>
            <div className="confirm-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setPendingAccusation(undefined)}
              >
                <X size={17} />
                Cancel
              </button>
              <button
                className="danger-button"
                type="button"
                onClick={() => {
                  onSend({
                    type: "player.accuse.create",
                    payload: { accusedPlayerId: pendingPlayer.id }
                  });
                  setPendingAccusation(undefined);
                }}
              >
                <Flag size={17} />
                Accuse
              </button>
            </div>
          </div>
        ) : null}
      </aside>
    </section>
  );
}

function InstructionCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="instruction-card">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function ResultsPanel({
  room,
  me,
  leaderboard,
  onSend
}: {
  room: PublicRoomSnapshot;
  me: PublicPlayerSnapshot;
  leaderboard: PublicPlayerSnapshot[];
  onSend: (command: ClientCommand) => void;
}) {
  const resolution = room.currentRound?.resolution;
  const impostor = room.players.find((player) => player.id === resolution?.impostorId);
  const winner = leaderboard[0];
  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false);

  if (!resolution) {
    return null;
  }

  return (
    <section className="phase-panel results-panel">
      <div className={`result-banner ${resolution.outcome}`}>
        <div>
          <span>{resolution.outcome === "impostor-caught" ? "Caught" : "Got away"}</span>
          <h2>{resolution.summary}</h2>
          <p>
            Word: <strong>{resolution.secretWord}</strong>. Impostor:{" "}
            <strong>{impostor?.nickname ?? "Unknown"}</strong>.
          </p>
        </div>
        {impostor ? <AvatarMark avatar={impostor.avatar} color={impostor.color} size="xl" /> : null}
      </div>
      <div className="score-deltas">
        {resolution.scoreDeltas.map((delta) => {
          const player = room.players.find((candidate) => candidate.id === delta.playerId);
          return (
            <div className="delta-row" key={delta.playerId}>
              <span>{player?.nickname ?? "Player"}</span>
              <strong>{delta.points > 0 ? `+${delta.points}` : delta.points}</strong>
            </div>
          );
        })}
      </div>
      <Leaderboard players={leaderboard} />
      {room.phase === "results" && me.isHost ? (
        <>
          <button
            className="primary-button full-width"
            type="button"
            onClick={() => onSend({ type: "host.game.start" })}
          >
            <Play size={18} />
            Next round
          </button>
          <button
            className="secondary-button full-width"
            type="button"
            onClick={() => setResetConfirmationOpen(true)}
          >
            <RotateCcw size={18} />
            Set up another game
          </button>
        </>
      ) : null}
      {room.phase === "results" && me.isHost && resetConfirmationOpen ? (
        <div className="accuse-confirm" role="dialog" aria-labelledby="reset-confirm-title">
          <RotateCcw size={28} />
          <div>
            <span>Reset room</span>
            <strong id="reset-confirm-title">Set up another game?</strong>
            <p>This skips the remaining rounds and returns everyone to the lobby.</p>
          </div>
          <div className="confirm-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setResetConfirmationOpen(false)}
            >
              <X size={17} />
              Cancel
            </button>
            <button
              className="danger-button"
              type="button"
              onClick={() => {
                onSend({ type: "host.game.reset" });
                setResetConfirmationOpen(false);
              }}
            >
              <RotateCcw size={17} />
              Reset game
            </button>
          </div>
        </div>
      ) : null}
      {room.phase === "finished" ? (
        <div className="final-note">
          {winner ? <AvatarMark avatar={winner.avatar} color={winner.color} size="lg" /> : null}
          <span>Final winner</span>
          <strong>{winner?.nickname ?? "No winner"}</strong>
        </div>
      ) : null}
      {room.phase === "finished" && me.isHost ? (
        <button
          className="primary-button full-width"
          type="button"
          onClick={() => onSend({ type: "host.game.reset" })}
        >
          <RotateCcw size={18} />
          Set up another game
        </button>
      ) : null}
    </section>
  );
}

function PlayerGrid({ players }: { players: PublicPlayerSnapshot[] }) {
  return (
    <div className="player-grid">
      {players.map((player) => (
        <div
          className={`player-card ${player.ready ? "is-ready" : ""} ${
            player.connected ? "" : "is-offline"
          }`}
          key={player.id}
        >
          <AvatarMark avatar={player.avatar} color={player.color} />
          <div>
            <strong>{player.nickname}</strong>
            <span>{player.ready ? "Ready" : "Not ready"}</span>
          </div>
          <div className="player-card-badges">
            {player.isHost ? <Crown size={16} /> : null}
            {player.ready ? <Check className="ready-icon" size={18} /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function Leaderboard({ players }: { players: PublicPlayerSnapshot[] }) {
  return (
    <section className="leaderboard" aria-label="Leaderboard">
      <h2>
        <Trophy size={19} />
        Leaderboard
      </h2>
      {players.map((player, index) => (
        <div className="leader-row" key={player.id}>
          <span>{index + 1}</span>
          <AvatarMark avatar={player.avatar} color={player.color} size="sm" />
          <strong>{player.nickname}</strong>
          <span>{player.score}</span>
        </div>
      ))}
    </section>
  );
}

function ActionSection({
  title,
  description,
  icon,
  disabled,
  children
}: {
  title: string;
  description: string;
  icon: ReactNode;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <div className={disabled ? "action-section is-disabled" : "action-section"}>
      <div className="action-heading">
        <span>{icon}</span>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      <div className="player-action-list">{children}</div>
    </div>
  );
}

function PlayerActionButton({
  player,
  selected = false,
  disabled,
  onClick
}: {
  player: PublicPlayerSnapshot;
  selected?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={selected ? "player-action is-selected" : "player-action"}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <AvatarMark avatar={player.avatar} color={player.color} size="sm" />
      <span>{player.nickname}</span>
      {selected ? <Check size={16} /> : null}
    </button>
  );
}

function TimerDial({ remainingMs, totalMs }: { remainingMs: number; totalMs: number }) {
  const seconds = Math.ceil(remainingMs / 1000);
  const progress = totalMs > 0 ? remainingMs / totalMs : 0;
  const urgencyClass = progress <= 0.2 ? "is-danger" : progress <= 0.45 ? "is-warning" : "";

  return (
    <div
      className={`timer-dial ${urgencyClass}`}
      style={{ "--progress": `${Math.max(0, Math.min(1, progress)) * 360}deg` } as CSSProperties}
    >
      <TimerReset size={18} />
      <span>{seconds}</span>
      <small>sec</small>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const inputLabelId = useId();
  const updateValue = (nextValue: number) => {
    if (!Number.isFinite(nextValue)) {
      return;
    }

    onChange(Math.min(max, Math.max(min, nextValue)));
  };

  return (
    <div className="field number-field">
      <span id={inputLabelId}>{label}</span>
      <div className="number-stepper">
        <button
          aria-label="Decrease value"
          disabled={value <= min}
          type="button"
          onClick={() => updateValue(value - step)}
        >
          -
        </button>
        <input
          max={max}
          min={min}
          aria-labelledby={inputLabelId}
          step={step}
          type="number"
          value={value}
          onChange={(event) => updateValue(Number(event.target.value))}
        />
        <button
          aria-label="Increase value"
          disabled={value >= max}
          type="button"
          onClick={() => updateValue(value + step)}
        >
          +
        </button>
      </div>
    </div>
  );
}

function ConnectionPill({ state }: { state: ConnectionState }) {
  const online = state === "open";

  return (
    <span className={online ? "connection-pill is-online" : "connection-pill"}>
      {online ? <Wifi size={15} /> : <WifiOff size={15} />}
      {online ? "Live" : state}
    </span>
  );
}

function useThemePreference(): [ThemePreference, Dispatch<SetStateAction<ThemePreference>>] {
  const [theme, setTheme] = useState<ThemePreference>(() => loadThemePreference());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    saveThemePreference(theme);
  }, [theme]);

  return [theme, setTheme];
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(interval);
  }, [intervalMs]);

  return now;
}

function sendCommand(socket: WebSocket | undefined, command: ClientCommand): void {
  if (socket?.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(
    JSON.stringify({
      ...command,
      requestId: command.requestId ?? crypto.randomUUID()
    })
  );
}

function roomConfigsEqual(left: RoomConfig, right: RoomConfig): boolean {
  return (
    left.mode === right.mode &&
    left.categoryId === right.categoryId &&
    left.maxPlayers === right.maxPlayers &&
    left.roundCount === right.roundCount &&
    left.roundDurationSeconds === right.roundDurationSeconds
  );
}

function roomConfigKey(config: RoomConfig): string {
  return [
    config.mode,
    config.categoryId,
    config.maxPlayers,
    config.roundCount,
    config.roundDurationSeconds
  ].join(":");
}
