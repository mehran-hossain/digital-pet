import { useMemo, useState, useEffect, useRef } from "react";
import "./App.css";
import { calculateTrustMeter, checkTrustProgression } from "./Trust";
import { calculateComfortMeter } from "./Comfort";
import { Feed } from "./Feed";
import { Sit } from "./Sit";
import { Talk } from "./Talk";
import { Pet } from "./Pet";
import { StatusMeters } from "./StatusMeters";
import {
  ANIMATION_DURATION_MS,
  FADE_OUT_MS,
  FADE_IN_MS,
  REPLY_DELAY_MS,
  INTERACTION_COOLDOWN_MS,
  getSuggestionsForDay,
  createProgressState,
  isGentleTone,
} from "./utils";
import idleSprite from "./assets/cat animations/Idle.png";
import box2Sprite from "./assets/cat animations/Box2.png";
import box3IdleSprite from "./assets/cat animations/Box3.png";
import petSprite from "./assets/cat animations/Pet.png";
import eatingSprite from "./assets/cat animations/Eating.png";
import adoptionSprite from "./assets/cat animations/adoption.png";
import roomBackground from "./assets/cat animations/ExampleRooms/ExampleRoom 2.png";

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
  const petAnimationTimeoutRef = useRef(null);
  const interactionCooldownTimeoutRef = useRef(null);
  const [isTrust2SitAnimationActive, setIsTrust2SitAnimationActive] = useState(false);
  const [isPetAnimationActive, setIsPetAnimationActive] = useState(false);
  const [isFeedAnimationActive, setIsFeedAnimationActive] = useState(false);
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

  const dayIdleSprite = useMemo(() => {
    if (trustLevel === 1) return box2Sprite;
    if (trustLevel === 2) return box2Sprite;
    if (trustLevel === 3) return box3IdleSprite;
    return idleSprite;
  }, [trustLevel]);

  const meters = useMemo(() => {
    return {
      trust: calculateTrustMeter(trustLevel),
      comfort: calculateComfortMeter(trustLevel),
    };
  }, [trustLevel]);

  const maybeQueueLevelUp = (updatedProgress) => {
    const progression = checkTrustProgression(trustLevel, updatedProgress);
    if (progression) {
      setPendingTrustLevel(progression.nextTrustLevel);
      setMessages((prev) => [
        ...prev,
        {
          from: "system",
          text: progression.message,
          ts: Date.now(),
        },
      ]);
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

  const beginInteractionCooldown = (durationMs = INTERACTION_COOLDOWN_MS) => {
    if (isInteractionCoolingDown) return false;
    setIsInteractionCoolingDown(true);
    if (interactionCooldownTimeoutRef.current) {
      clearTimeout(interactionCooldownTimeoutRef.current);
    }
    interactionCooldownTimeoutRef.current = window.setTimeout(() => {
      setIsInteractionCoolingDown(false);
      interactionCooldownTimeoutRef.current = null;
    }, durationMs);
    return true;
  };

  const handlePet = () => {
    const willAnimate = trustLevel >= 4;
    if (!beginInteractionCooldown(willAnimate ? ANIMATION_DURATION_MS : INTERACTION_COOLDOWN_MS)) return;
    if (willAnimate) {
      pushSystem("You pet Meowzart gently. Meowzart purrs!");
      setIsPetAnimationActive(true);
      if (petAnimationTimeoutRef.current) {
        clearTimeout(petAnimationTimeoutRef.current);
      }
      petAnimationTimeoutRef.current = setTimeout(() => {
        setIsPetAnimationActive(false);
        petAnimationTimeoutRef.current = null;
      }, ANIMATION_DURATION_MS);
    }
    else {
      pushSystem("Meowzart stays hidden in the box and avoids touch.");
    }
  };

  const handleFeed = () => {
    const willAnimate = trustLevel >= 4;
    if (!beginInteractionCooldown(willAnimate ? ANIMATION_DURATION_MS : INTERACTION_COOLDOWN_MS)) return;
    const nextProgress = { ...progress, attemptedFeed: true };
    setProgress(nextProgress);
    if (willAnimate) {
      pushSystem("Meowzart happily eats the food you offer. Yum!");
    }
    else {
      pushSystem("You place food nearby, but Meowzart refuses.");
    }
    maybeQueueLevelUp(nextProgress);
  };

  const handleFeedAnimationStateChange = (isAnimating) => {
    setIsFeedAnimationActive(isAnimating);
  };

  const handleSitQuietly = () => {
    const willAnimate = trustLevel === 2;
    if (!beginInteractionCooldown(willAnimate ? ANIMATION_DURATION_MS : INTERACTION_COOLDOWN_MS)) return;
    const nextProgress = {
      ...progress,
      attemptedSitQuietly: true,
      spendTimeCount: progress.spendTimeCount + 1,
    };
    setProgress(nextProgress);
    if (willAnimate) {
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
      petSprite,
      eatingSprite,
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
      if (petAnimationTimeoutRef.current) {
        clearTimeout(petAnimationTimeoutRef.current);
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
            <Pet
              currentSprite={currentSprite}
              trustLevel={trustLevel}
              isTrust2SitAnimationActive={isTrust2SitAnimationActive}
              isPetAnimationActive={isPetAnimationActive}
              petSprite={petSprite}
              isFeedAnimationActive={isFeedAnimationActive}
              eatingSprite={eatingSprite}
            />
          </div>
          <div className="room-footer">
            <div className="action-buttons">
              <button onClick={handlePet} disabled={isInteractionCoolingDown}>Pet</button>
              <Feed 
                onFeed={handleFeed} 
                disabled={isInteractionCoolingDown} 
                trustLevel={trustLevel}
                onAnimationStateChange={handleFeedAnimationStateChange}
              />
              <Sit onSitQuietly={handleSitQuietly} disabled={isInteractionCoolingDown} />
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
          <StatusMeters
            trustLevel={trustLevel}
            trustLabel={meters.trust.label}
            trustValue={meters.trust.value}
            comfortLabel={meters.comfort.label}
            comfortValue={meters.comfort.value}
          />
          <Talk
            messages={messages}
            quickSuggestions={quickSuggestions}
            draftMessage={draftMessage}
            onDraftChange={setDraftMessage}
            onSendMessage={handleSendMessage}
            onSuggestionClick={handleSuggestionClick}
            isLocked={isMessageLocked}
            onKeyDown={handleSendMessageKeyDown}
          />
        </div>
      </div>
    </div>
  );
}