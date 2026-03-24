import { useMemo, useState, useEffect, useRef } from "react";
import "./App.css";
import { PetSprite } from "./components/PetSprite";
import idleSprite from "./assets/cat animations/Idle.png";
import box2Sprite from "./assets/cat animations/Box2.png";
import box3IdleSprite from "./assets/cat animations/Box3.png";
import adoptionSprite from "./assets/cat animations/adoption.png";
import roomBackground from "./assets/cat animations/ExampleRooms/ExampleRoom 2.png";

const GENTLE_SUGGESTIONS = [
  "It's okay",
  "I'll stay here",
  "Take your time",
  "You are safe with me",
  "I'm here when you're ready",
  "I'm not going anywhere",
];

function getSuggestionsForDay(day) {
  if (day % 2 === 1) {
    return GENTLE_SUGGESTIONS.slice(0, 3);
  }
  return GENTLE_SUGGESTIONS.slice(3, 6);
}

const HARSH_WORDS = ["stupid", "bad", "hate", "shut up", "idiot", "dumb"];

function createProgressState() {
  return {
    dialogueCount: 0,
    gentleDialogueCount: 0,
    attemptedFeed: false,
    attemptedSitQuietly: false,
    spendTimeCount: 0,
  };
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function getTrustLabel(level) {
  if (level === 1) return "Very low";
  if (level === 2) return "Warming up";
  if (level === 3) return "Growing";
  return "Warming up";
}

function getComfortLabel(level) {
  if (level === 1) return "Scared";
  if (level === 2) return "Cautious";
  if (level === 3) return "Calmer";
  return "Cautious";
}

export default function App() {
  const [started, setStarted] = useState(false);
  const [adopterName, setAdopterName] = useState("");
  const [day, setDay] = useState(1);
  const [trustLevel, setTrustLevel] = useState(1);
  const [pendingTrustLevel, setPendingTrustLevel] = useState(null);
  const [progress, setProgress] = useState(() => createProgressState());
  const dayRef = useRef(day);
  const [currentSprite, setCurrentSprite] = useState(idleSprite);
  const animationTimeoutRef = useRef(null);
  const trust2SitAnimationTimeoutRef = useRef(null);
  const interactionCooldownTimeoutRef = useRef(null);
  const [isTrust2SitAnimationActive, setIsTrust2SitAnimationActive] = useState(false);
  const [isInteractionCoolingDown, setIsInteractionCoolingDown] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const [messages, setMessages] = useState(() => [
    {
      from: "system",
      text: "Meowzart appears afraid and refuses to leave the box.",
      ts: Date.now(),
    },
  ]);
  const [draftMessage, setDraftMessage] = useState("");
  const [quickSuggestions, setQuickSuggestions] = useState(() => getSuggestionsForDay(1));
  const [isWaitingForReply, setIsWaitingForReply] = useState(false);
  const replyTimeoutRef = useRef(null);

  const ANIMATION_DURATION_MS = 4000;
  const FADE_OUT_MS = 280;
  const FADE_IN_MS = 280;
  const REPLY_DELAY_MS = 1200;
  const INTERACTION_COOLDOWN_MS = 700;

  const dayIdleSprite = useMemo(() => {
    if (trustLevel === 1) return box2Sprite;
    if (trustLevel === 2) return box2Sprite;
    if (trustLevel === 3) return box3IdleSprite;
    return idleSprite;
  }, [trustLevel]);

  const meters = useMemo(() => {
    const trustBase = trustLevel === 1 ? 15 : 30;
    const comfortBase = trustLevel === 1 ? 20 : trustLevel === 2 ? 36 : 50;
    return {
      trust: {
        value: clamp(Math.round(trustLevel === 3 ? 45 : trustBase), 1, 100),
        label: getTrustLabel(trustLevel),
      },
      comfort: {
        value: clamp(Math.round(comfortBase), 1, 100),
        label: getComfortLabel(trustLevel),
      },
    };
  }, [trustLevel]);

  const isGentleTone = (text) => {
    const normalized = text.toLowerCase();
    return !HARSH_WORDS.some((word) => normalized.includes(word));
  };

  const maybeQueueLevelUp = (updatedProgress) => {
    if (pendingTrustLevel) return;
    if (trustLevel === 1) {
      const canProgress =
        updatedProgress.gentleDialogueCount >= 3 &&
        updatedProgress.attemptedFeed &&
        updatedProgress.attemptedSitQuietly;
      if (canProgress) {
        setPendingTrustLevel(2);
        setMessages((prev) => [
          ...prev,
          {
            from: "system",
            text: "State 2 is ready. Advance to next day to activate it.",
            ts: Date.now(),
          },
        ]);
      }
      return;
    }

    if (trustLevel === 2) {
      const canProgress =
        updatedProgress.dialogueCount >= 3 &&
        updatedProgress.spendTimeCount >= 2;
      if (canProgress) {
        setPendingTrustLevel(3);
        setMessages((prev) => [
          ...prev,
          {
            from: "system",
            text: "State 3 is ready. Advance to next day to activate it.",
            ts: Date.now(),
          },
        ]);
      }
    }
  };

  useEffect(() => {
    dayRef.current = day;
  }, [day]);

  useEffect(() => {
    setQuickSuggestions(getSuggestionsForDay(day));
    setIsWaitingForReply(false);
    if (replyTimeoutRef.current) {
      clearTimeout(replyTimeoutRef.current);
      replyTimeoutRef.current = null;
    }
  }, [day, trustLevel]);

  useEffect(() => {
    if (animationTimeoutRef.current) return;
    setCurrentSprite(dayIdleSprite);
  }, [dayIdleSprite]);

  const pushSystem = (text) => {
    setMessages((prev) => [...prev, { from: "system", text, ts: Date.now() }]);
  };

  const beginInteractionCooldown = () => {
    if (isInteractionCoolingDown) return false;
    setIsInteractionCoolingDown(true);
    if (interactionCooldownTimeoutRef.current) {
      clearTimeout(interactionCooldownTimeoutRef.current);
    }
    interactionCooldownTimeoutRef.current = window.setTimeout(() => {
      setIsInteractionCoolingDown(false);
      interactionCooldownTimeoutRef.current = null;
    }, INTERACTION_COOLDOWN_MS);
    return true;
  };

  const handlePet = () => {
    if (!beginInteractionCooldown()) return;
    pushSystem("Meowzart stays hidden in the box and avoids touch.");
  };

  const handleFeed = () => {
    if (!beginInteractionCooldown()) return;
    const nextProgress = { ...progress, attemptedFeed: true };
    setProgress(nextProgress);
    pushSystem("You place food nearby, but Meowzart refuses.");
    maybeQueueLevelUp(nextProgress);
  };

  const handleSitQuietly = () => {
    if (!beginInteractionCooldown()) return;
    const nextProgress = {
      ...progress,
      attemptedSitQuietly: true,
      spendTimeCount: progress.spendTimeCount + 1,
    };
    setProgress(nextProgress);
    if (trustLevel === 2) {
      setIsTrust2SitAnimationActive(true);
      if (trust2SitAnimationTimeoutRef.current) {
        clearTimeout(trust2SitAnimationTimeoutRef.current);
      }
      trust2SitAnimationTimeoutRef.current = setTimeout(() => {
        setIsTrust2SitAnimationActive(false);
        trust2SitAnimationTimeoutRef.current = null;
      }, ANIMATION_DURATION_MS);
    }
    pushSystem("You sit quietly near the box. Meowzart watches you cautiously.");
    maybeQueueLevelUp(nextProgress);
  };

  // Preload sprite sheets so transitions feel smoother
  useEffect(() => {
    const images = [
      idleSprite,
      box2Sprite,
      box3IdleSprite,
      adoptionSprite,
    ].map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
    return () => {
      // allow GC to clean up
      images.forEach((img) => {
        img.onload = null;
      });
    };
  }, []);

  useEffect(() => {
    return () => {
      if (replyTimeoutRef.current) {
        clearTimeout(replyTimeoutRef.current);
      }
      if (trust2SitAnimationTimeoutRef.current) {
        clearTimeout(trust2SitAnimationTimeoutRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (interactionCooldownTimeoutRef.current) {
        clearTimeout(interactionCooldownTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = (suggestedText, fromSuggestion = false) => {
    const text = (suggestedText ?? draftMessage).trim();
    if (!text) return;
    if (isWaitingForReply) return;

    if (fromSuggestion) {
      setQuickSuggestions((prev) => prev.filter((suggestion) => suggestion !== text));
    }
    setMessages((prev) => [...prev, { from: "you", text, ts: Date.now() }]);
    setIsWaitingForReply(true);
    const nextProgress = {
      ...progress,
      dialogueCount: progress.dialogueCount + 1,
      gentleDialogueCount: progress.gentleDialogueCount + (isGentleTone(text) ? 1 : 0),
    };
    setProgress(nextProgress);
    maybeQueueLevelUp(nextProgress);

    replyTimeoutRef.current = window.setTimeout(() => {
      const reaction = trustLevel === 1 ? "Meowzart: ..." : "Meowzart: meow.";
      setMessages((prev) => [...prev, { from: "meowzart", text: reaction, ts: Date.now() }]);
      setIsWaitingForReply(false);
      replyTimeoutRef.current = null;
    }, REPLY_DELAY_MS);

    setDraftMessage("");
  };

  const isMessageLocked = isWaitingForReply;

  const handleSendMessageKeyDown = (e) => {
    if (e.key !== "Enter") return;
    if (isMessageLocked) return;
    handleSendMessage();
  };

  const handleSuggestionClick = (suggestion) => {
    if (isMessageLocked) return;
    handleSendMessage(suggestion, true);
  };

  const handleSendClick = () => {
    if (isMessageLocked) return;
    handleSendMessage();
  };

  const handleNextDay = (forceAdvance = false) => {
    if (isFading) return;
    setIsFading(true);

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    window.setTimeout(() => {
      const nextDay = dayRef.current + 1;
      setDay(nextDay);

      let dayMessage = `------Day ${nextDay}------`;

      if (forceAdvance) {
        const nextTrustLevel = Math.min(trustLevel + 1, 10);
        setTrustLevel(nextTrustLevel);
        setPendingTrustLevel(null);
        setProgress(createProgressState());
        dayMessage += ` Trust level is now ${nextTrustLevel}.`;
      } else if (pendingTrustLevel) {
        setTrustLevel(pendingTrustLevel);
        setPendingTrustLevel(null);
        setProgress(createProgressState());
        dayMessage += ` Trust level is now ${pendingTrustLevel}.`;
      }
      setMessages([{ from: "day", text: dayMessage, ts: Date.now() }]);

      window.setTimeout(() => setIsFading(false), FADE_IN_MS);
    }, FADE_OUT_MS);
  };

  if (!started) {
    return (
      <div className="home-page">
        <div className="certificate">
          <img src={adoptionSprite} alt="Adoption" className="adoption-image" />
          <h1>Adoption Certificate</h1>
          <p className="certificate-text">
            This certifies that{" "}
            <input
              type="text"
              value={adopterName}
              onChange={(e) => setAdopterName(e.target.value)}
              placeholder="your name"
              className="adopter-input"
            />{" "}
            has officially adopted Meowzart. What a great day!
          </p>
          <button onClick={() => setStarted(true)}>
            Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pet-page">
      <div className={`fade-overlay ${isFading ? "fade-overlay--visible" : ""}`} />
      <div className="main">
        <div className="left">
          <div
            className="room"
            style={{ backgroundImage: `url(${roomBackground})` }}
          >
            <div className="day-badge" aria-label="day counter">
              Day {day} | Trust {trustLevel}
            </div>
            <PetSprite
              className="pet-sprite"
              src={currentSprite}
              alt="cat"
              frameWidth={32}
              frameHeight={32}
              scale={4}
              fps={trustLevel === 2 ? (isTrust2SitAnimationActive ? 8 : 0) : trustLevel === 1 ? 0 : 8}
              startFrame={trustLevel === 2 && currentSprite === box2Sprite && isTrust2SitAnimationActive ? 3 : 0}
            />
          </div>
          <div className="room-footer">
            <div className="action-buttons">
              <button onClick={handlePet} disabled={isInteractionCoolingDown}>Pet</button>
              <button onClick={handleFeed} disabled={isInteractionCoolingDown}>Feed</button>
              <button onClick={handleSitQuietly} disabled={isInteractionCoolingDown}>Sit quietly</button>
            </div>
            <button
              className="next-day-room"
              onClick={() => handleNextDay(false)}
              disabled={isFading}
            >
              Next day
            </button>
            <button
              className="admin-next-day"
              onClick={() => handleNextDay(true)}
              disabled={isFading}
              title="Testing only: next day + trust level +1"
            >
              Admin Next Trust
            </button>
          </div>
        </div>

        <div className="hud">
          <div className="status-meters" aria-label="trust and comfort meters">
            <div className="status-meter">
              <div className="status-meter__label">
                  Trust L{trustLevel} [{meters.trust.label}]
              </div>
              <div className="status-meter__track" role="img" aria-label={`Trust ${meters.trust.value} percent`}>
                <div className="status-meter__fill status-meter__fill--trust" style={{ width: `${meters.trust.value}%` }} />
              </div>
            </div>
            <div className="status-meter">
              <div className="status-meter__label">
                Comfort [{meters.comfort.label}]
              </div>
              <div className="status-meter__track" role="img" aria-label={`Comfort ${meters.comfort.value} percent`}>
                <div
                  className="status-meter__fill status-meter__fill--comfort"
                  style={{ width: `${meters.comfort.value}%` }}
                />
              </div>
            </div>
          </div>
          <div className="message-box">
            <div className="message-log" aria-label="messages">
              {messages.slice(-6).map((m) => (
                <div
                  key={`${m.ts}-${m.from}-${m.text}`}
                  className={`message message--${m.from}`}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <div className="message-suggestions" aria-label="quick message suggestions">
              {quickSuggestions.map((suggestion) => (
                <button
                  key={`${day}-${trustLevel}-${suggestion}`}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isMessageLocked}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="message-compose">
              <input
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                onKeyDown={handleSendMessageKeyDown}
                placeholder="Send a message…"
                className="message-input"
              />
              <button onClick={handleSendClick} className="send-button" disabled={isMessageLocked}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}