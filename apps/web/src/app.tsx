import {
  AVATARS,
  DEFAULT_ROOM_CONFIG,
  PLAYER_COLORS,
  PLAYER_LIMITS,
  ROUND_LIMITS,
  WORD_CATEGORIES
} from "@imposter/domain";
import type {
  AvatarId,
  GameMode,
  PlayerColor,
  PrivatePlayerSnapshot,
  PublicPlayerSnapshot,
  PublicRoomSnapshot,
  RoomConfig
} from "@imposter/domain";
import {
  Check,
  Clipboard,
  Clock,
  Eye,
  Flag,
  LogOut,
  Play,
  ShieldQuestion,
  Users,
  Wifi,
  WifiOff
} from "lucide-react";
import QRCode from "qrcode";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from "react";
import { AvatarMark } from "./components/avatar-mark";
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

type ConnectionState = "idle" | "connecting" | "open" | "closed" | "error";

interface ProfileDraft {
  nickname: string;
  avatar: AvatarId;
  color: PlayerColor;
}

const modeOptions: readonly { label: string; value: GameMode }[] = [
  { label: "Accusation", value: "accusation" },
  { label: "Suspicion", value: "suspicion" }
];

const fallbackAvatar = AVATARS[0] ?? "comet";
const fallbackColor = PLAYER_COLORS[0] ?? "#2563eb";
const secondAvatar = AVATARS[1] ?? fallbackAvatar;
const secondColor = PLAYER_COLORS[1] ?? fallbackColor;

const defaultProfile: ProfileDraft = {
  nickname: "",
  avatar: fallbackAvatar,
  color: fallbackColor
};

export function App() {
  const initialRoomCode = new URLSearchParams(window.location.search).get("room") ?? "";
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

    const socket = createRoomSocket(session.code, session.token);
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
      token: session.token,
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
  }, []);

  return (
    <main className="app-shell">
      {room && privateSnapshot ? (
        <RoomScreen
          room={room}
          privateSnapshot={privateSnapshot}
          connectionState={connectionState}
          error={error}
          onSend={send}
          onLeave={leaveRoom}
        />
      ) : (
        <HomeScreen
          initialRoomCode={initialRoomCode}
          connectionState={connectionState}
          error={error}
          onCreate={async (input) => acceptSession(await createRoom(input))}
          onJoin={async (code, input) => acceptSession(await joinRoom(code, input))}
          onClearError={() => setError(undefined)}
        />
      )}
    </main>
  );
}

function HomeScreen({
  initialRoomCode,
  connectionState,
  error,
  onCreate,
  onJoin,
  onClearError
}: {
  initialRoomCode: string;
  connectionState: ConnectionState;
  error: string | undefined;
  onCreate: Parameters<typeof CreateRoomForm>[0]["onCreate"];
  onJoin: Parameters<typeof JoinRoomForm>[0]["onJoin"];
  onClearError: () => void;
}) {
  const [activePanel, setActivePanel] = useState<"host" | "join">(
    initialRoomCode ? "join" : "host"
  );

  return (
    <section className="home-grid">
      <div className="brand-panel">
        <div className="brand-lockup">
          <span className="brand-mark">IM</span>
          <span>Imposter</span>
        </div>
        <h1>Run the round, hide the word, catch the bluff.</h1>
        <p>
          A mobile-first room for in-person social deduction. The app handles roles, words, timers,
          suspicions, accusations, and scoring while the group plays face-to-face.
        </p>
        <div className="hero-stats" aria-label="MVP game limits">
          <span>
            <Users size={18} />
            3-12 players
          </span>
          <span>
            <Clock size={18} />
            30-600 sec
          </span>
          <span>
            <ShieldQuestion size={18} />1 imposter
          </span>
        </div>
      </div>

      <div className="setup-panel">
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
    </section>
  );
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
      onSubmit={(event) => {
        event.preventDefault();
        void onCreate({ host: profile, config });
      }}
    >
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
        className="primary-button"
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
        void onJoin(roomCode, profile);
      }}
    >
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
      <fieldset className="field-group">
        <legend>Avatar</legend>
        <div className="avatar-picker">
          {AVATARS.map((avatar) => (
            <button
              aria-label={`Use ${avatar} avatar`}
              className={profile.avatar === avatar ? "is-selected" : ""}
              key={avatar}
              type="button"
              onClick={() => onChange({ ...profile, avatar })}
            >
              <AvatarMark avatar={avatar} color={profile.color} size="sm" />
            </button>
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
    </>
  );
}

function RoomScreen({
  room,
  privateSnapshot,
  connectionState,
  error,
  onSend,
  onLeave
}: {
  room: PublicRoomSnapshot;
  privateSnapshot: PrivatePlayerSnapshot;
  connectionState: ConnectionState;
  error: string | undefined;
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

  if (!me) {
    return (
      <section className="room-layout">
        <p className="form-error">Your room profile was not found.</p>
        <button className="secondary-button" type="button" onClick={onLeave}>
          Leave
        </button>
      </section>
    );
  }

  return (
    <section className="room-layout">
      <RoomHeader
        connectionState={connectionState}
        me={me}
        privateSnapshot={privateSnapshot}
        room={room}
        onLeave={onLeave}
      />

      {error ? <p className="form-error">{error}</p> : null}

      {room.phase === "lobby" ? (
        <LobbyPanel me={me} room={room} onSend={onSend} />
      ) : currentRound ? (
        <RoundPanel me={me} privateSnapshot={privateSnapshot} room={room} onSend={onSend} />
      ) : null}

      {(room.phase === "results" || room.phase === "finished") && currentRound?.resolution ? (
        <ResultsPanel leaderboard={leaderboard} me={me} room={room} onSend={onSend} />
      ) : (
        <Leaderboard players={leaderboard} />
      )}
    </section>
  );
}

function RoomHeader({
  room,
  me,
  privateSnapshot,
  connectionState,
  onLeave
}: {
  room: PublicRoomSnapshot;
  me: PublicPlayerSnapshot;
  privateSnapshot: PrivatePlayerSnapshot;
  connectionState: ConnectionState;
  onLeave: () => void;
}) {
  const joinUrl = useMemo(() => {
    const url = new URL(window.location.href);
    url.search = `?room=${room.code}`;
    return url.toString();
  }, [room.code]);
  const [qrCode, setQrCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void QRCode.toDataURL(joinUrl, {
      margin: 1,
      width: 180,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    }).then(setQrCode);
  }, [joinUrl]);

  return (
    <header className="room-header">
      <div>
        <div className="room-code-label">Room code</div>
        <div className="room-code">{room.code}</div>
      </div>
      <div className="header-actions">
        <ConnectionPill state={connectionState} />
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
  const allReady =
    room.players.length >= PLAYER_LIMITS.min && room.players.every((player) => player.ready);
  const canHostStart = me.isHost && allReady;

  return (
    <section className="phase-panel">
      <div className="phase-heading">
        <div>
          <h2>Lobby</h2>
          <p>
            {room.players.length}/{room.config.maxPlayers} players joined. Everyone needs to ready
            up.
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
      <PlayerGrid players={room.players} />
      {me.isHost ? (
        <button
          className="primary-button full-width"
          disabled={!canHostStart}
          type="button"
          onClick={() => onSend({ type: "host.game.start" })}
        >
          <Play size={18} />
          Start game
        </button>
      ) : null}
    </section>
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

  if (!round) {
    return null;
  }

  const startingSpeaker = room.players.find((player) => player.id === round.startingSpeakerId);
  const mySuspicion = round.suspicions.find((suspicion) => suspicion.suspectingPlayerId === me.id);
  const remainingMs = Math.max(0, round.endsAt - now);
  const canAct = room.phase === "round" && !round.resolution;

  return (
    <section className="phase-panel">
      <div className="round-status">
        <div>
          <span className="round-label">Round {round.number}</span>
          <h2>{privateSnapshot.visibleWord ?? "Waiting for reveal"}</h2>
          <p>
            Starting speaker: <strong>{startingSpeaker?.nickname ?? "Unknown"}</strong>
          </p>
        </div>
        <TimerDial remainingMs={remainingMs} totalMs={room.config.roundDurationSeconds * 1000} />
      </div>

      <div className="action-grid">
        {room.config.mode === "suspicion" ? (
          <ActionSection
            disabled={!canAct || Boolean(mySuspicion)}
            icon={<Eye size={18} />}
            title="Suspicion"
            description={
              mySuspicion
                ? "Suspicion locked for this round."
                : "Add one non-retractable suspicion."
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
          disabled={!canAct}
          icon={<Flag size={18} />}
          title="Accusation"
          description="First valid accusation ends the round immediately."
        >
          {room.players
            .filter((player) => player.id !== me.id)
            .map((player) => (
              <PlayerActionButton
                disabled={!canAct}
                key={player.id}
                player={player}
                onClick={() =>
                  onSend({
                    type: "player.accuse.create",
                    payload: { accusedPlayerId: player.id }
                  })
                }
              />
            ))}
        </ActionSection>
      </div>
    </section>
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
  const imposter = room.players.find((player) => player.id === resolution?.imposterId);

  if (!resolution) {
    return null;
  }

  return (
    <section className="phase-panel results-panel">
      <div className={`result-banner ${resolution.outcome}`}>
        <span>{resolution.outcome === "imposter-caught" ? "Caught" : "Got away"}</span>
        <h2>{resolution.summary}</h2>
        <p>
          Word: <strong>{resolution.secretWord}</strong>. Imposter:{" "}
          <strong>{imposter?.nickname ?? "Unknown"}</strong>.
        </p>
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
        <button
          className="primary-button full-width"
          type="button"
          onClick={() => onSend({ type: "host.game.start" })}
        >
          <Play size={18} />
          Next round
        </button>
      ) : null}
      {room.phase === "finished" ? (
        <p className="final-note">Final winner: {leaderboard[0]?.nickname ?? "No winner"}</p>
      ) : null}
    </section>
  );
}

function PlayerGrid({ players }: { players: PublicPlayerSnapshot[] }) {
  return (
    <div className="player-grid">
      {players.map((player) => (
        <div className="player-card" key={player.id}>
          <AvatarMark avatar={player.avatar} color={player.color} />
          <div>
            <strong>{player.nickname}</strong>
            <span>{player.ready ? "Ready" : "Not ready"}</span>
          </div>
          {player.ready ? <Check className="ready-icon" size={18} /> : null}
        </div>
      ))}
    </div>
  );
}

function Leaderboard({ players }: { players: PublicPlayerSnapshot[] }) {
  return (
    <section className="leaderboard" aria-label="Leaderboard">
      <h2>Leaderboard</h2>
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
  disabled: _disabled,
  children
}: {
  title: string;
  description: string;
  icon: ReactNode;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <div className="action-section">
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

  return (
    <div
      className="timer-dial"
      style={{ "--progress": `${Math.max(0, Math.min(1, progress)) * 360}deg` } as CSSProperties}
    >
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
  return (
    <label className="field">
      <span>{label}</span>
      <input
        max={max}
        min={min}
        step={step}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
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
