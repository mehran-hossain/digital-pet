import { useMemo, useState, useEffect, useRef } from "react";
import {
  calculateTrustMeter,
  checkTrustProgression,
  checkTrustRegression,
} from "./Trust";
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
  createProgressState,
  isGentleTone,
} from "./utils";
import "./App.css";

import box2Sprite from "./assets/cat animations/Box2.png";
import box3IdleSprite from "./assets/cat animations/Box3.png";
import idleSprite from "./assets/cat animations/Idle.png";
import waitingSprite from "./assets/cat animations/Waiting.png";
import sadSprite from "./assets/cat animations/Sad.png";
import crySprite from "./assets/cat animations/Cry.png";
import layDownSprite from "./assets/cat animations/LayDown.png";
import excitedSprite from "./assets/cat animations/Excited.png";
import petSprite from "./assets/cat animations/Pet.png";
import eatingSprite from "./assets/cat animations/Eating.png";
import adoptionSprite from "./assets/cat animations/adoption.png";
import roomBackground from "./assets/cat animations/ExampleRooms/ExampleRoom 2.png";

const STAGE_CONFIG = {
  1: {
    label: "Fear",
    sprite: box2Sprite,
    entryMessage: "Meowzart stays inside the box. It seems tense.",
    replyText: "Meowzart: ...",
    suggestions: ["It's okay", "I'll stay here"],
    feedText: "You place food nearby. Meowzart doesn't approach.",
    petText: "Meowzart recoils slightly and stays hidden.",
    sitText: "You sit nearby. Meowzart watches from inside the box.",
  },
  2: {
    label: "Observation",
    sprite: box2Sprite,
    entryMessage: "Meowzart watches you from inside the box. It seems unsure, but alert.",
    replyText: "Meowzart: ...",
    suggestions: ["You can come out", "I won't get closer"],
    feedText: "Meowzart looks at the food, but stays inside.",
    petText: "Meowzart pulls back.",
    sitText: "Meowzart keeps watching you.",
  },
  3: {
    label: "First Step",
    sprite: box3IdleSprite,
    entryMessage:
      "Meowzart steps out of the box, but keeps its distance.",
    replyText: "Meowzart: meow.",
    suggestions: ["You can stay there", "Hi..."],
    feedText: "Meowzart approaches slightly, then stops.",
    petText: "Meowzart startles and steps back.",
    sitText: "Meowzart stays nearby, watching.",
  },
  4: {
    label: "Tolerance",
    sprite: waitingSprite,
    entryMessage: "Meowzart stays nearby. It seems less tense.",
    replyText: "Meowzart: meow.",
    suggestions: ["Take your time", "I'll stay here"],
    feedText: "Meowzart sniffs the food, then backs away.",
    petText: "Meowzart hesitates, then moves away.",
    sitText: "Meowzart remains close.",
  },
  5: {
    label: "Curiosity",
    sprite: waitingSprite,
    entryMessage: "Meowzart lingers nearby and watches you carefully.",
    replyText: "Meowzart: meow.",
    suggestions: ["It's safe", "You don't have to rush"],
    feedText: "Meowzart nibbles the food, then backs away.",
    petText: "Meowzart isn't ready for touch yet.",
    sitText: "Meowzart stays close a little longer.",
  },
  6: {
    label: "First Acceptance",
    sprite: waitingSprite,
    entryMessage: "Meowzart seems less afraid now.",
    replyText: "Meowzart: meow.",
    suggestions: ["You can try it", "Good job"],
    feedText: "Meowzart eats a little, then steps back.",
    petText: "Meowzart isn't ready for touch yet.",
    sitText: "Meowzart stays nearby.",
  },
  7: {
    label: "Setback",
    sprite: crySprite,
    entryMessage:
      "There's a storm! The thunder startles Meowzart. It's distressed",
    replyText: "Meowzart: ...",
    suggestions: ["It's okay", "I'm still here"],
    feedText: "Meowzart nibbles the food, then backs away.",
    petText: "Meowzart recoils.",
    sitText: "Meowzart retreats.",
  },
  8: {
    label: "Rebuilding",
    sprite: sadSprite,
    entryMessage: "Meowzart slowly comes out again. It seems cautious, but remembers you.",
    replyText: "Meowzart: meow.",
    suggestions: ["You're safe", "I won't leave"],
    feedText: "Meowzart approaches slowly and eats a little more.",
    petText: "Meowzart steps away.",
    sitText: "Meowzart stays near you longer.",
  },
  9: {
    label: "Affection",
    sprite: layDownSprite,
    entryMessage: "Meowzart stays close. It seems comfortable.",
    replyText: "Meowzart: meow.",
    suggestions: ["Hey...", "Good job"],
    feedText: "Meowzart eats comfortably.",
    petText: "Meowzart allows a gentle touch.",
    sitText: "Meowzart rests nearby.",
  },
  10: {
    label: "Bond",
    sprite: excitedSprite,
    entryMessage: "Meowzart remains near you. It appears relaxed.",
    replyText: "Meowzart: meow!",
    suggestions: ["Hi Meowzart", "Let's stay here"],
    feedText: "Meowzart happily eats.",
    petText: "Meowzart leans into your hand.",
    sitText: "Meowzart relaxes beside you.",
  },
};

function getStage(level) {
  return STAGE_CONFIG[Math.max(1, Math.min(10, level))] ?? STAGE_CONFIG[1];
}

export default function App() {
  const [started, setStarted] = useState(false);
  const [adopterName, setAdopterName] = useState("");
  const [day, setDay] = useState(1);
  const [trustLevel, setTrustLevel] = useState(1);
  const [pendingTrustLevel, setPendingTrustLevel] = useState(null);
  const [progress, setProgress] = useState(() => createProgressState());
  const [stormTriggered, setStormTriggered] = useState(false);

  const dayRef = useRef(day);
  const animationTimeoutRef = useRef(null);
  const trust2SitAnimationTimeoutRef = useRef(null);
  const petAnimationTimeoutRef = useRef(null);
  const interactionCooldownTimeoutRef = useRef(null);
  const replyTimeoutRef = useRef(null);

  const [currentSprite, setCurrentSprite] = useState(box2Sprite);
  const [isTrust2SitAnimationActive, setIsTrust2SitAnimationActive] =
    useState(false);
  const [isPetAnimationActive, setIsPetAnimationActive] = useState(false);
  const [isFeedAnimationActive, setIsFeedAnimationActive] = useState(false);
  const [isInteractionCoolingDown, setIsInteractionCoolingDown] =
    useState(false);
  const [isFading, setIsFading] = useState(false);

  const [messages, setMessages] = useState(() => [
    {
      from: "system",
      text: STAGE_CONFIG[1].entryMessage,
      ts: Date.now(),
    },
  ]);

  const [draftMessage, setDraftMessage] = useState("");
  const [quickSuggestions, setQuickSuggestions] = useState(
    STAGE_CONFIG[1].suggestions
  );
  const [isWaitingForReply, setIsWaitingForReply] = useState(false);

  const stage = useMemo(() => getStage(trustLevel), [trustLevel]);

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
    setQuickSuggestions(stage.suggestions);
    setIsWaitingForReply(false);

    if (replyTimeoutRef.current) {
      clearTimeout(replyTimeoutRef.current);
      replyTimeoutRef.current = null;
    }
  }, [day, trustLevel, stage]);

  useEffect(() => {
    if (animationTimeoutRef.current) return;
    setCurrentSprite(stage.sprite);
  }, [stage]);

  useEffect(() => {
    const images = [
      box2Sprite,
      box3IdleSprite,
      idleSprite,
      waitingSprite,
      sadSprite,
      crySprite,
      layDownSprite,
      excitedSprite,
      petSprite,
      eatingSprite,
      adoptionSprite,
    ].map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

    return () => {
      images.forEach((img) => {
        img.onload = null;
      });
    };
  }, []);

  useEffect(() => {
    return () => {
      if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
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

  const pushSystem = (text) => {
    setMessages((prev) => [...prev, { from: "system", text, ts: Date.now() }]);
  };

  const beginInteractionCooldown = (
    durationMs = INTERACTION_COOLDOWN_MS
  ) => {
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
    const willAnimate = trustLevel >= 9;

    if (
      !beginInteractionCooldown(
        willAnimate ? ANIMATION_DURATION_MS : INTERACTION_COOLDOWN_MS
      )
    ) {
      return;
    }

    if (willAnimate) {
      pushSystem(stage.petText);
      setIsPetAnimationActive(true);

      if (petAnimationTimeoutRef.current) {
        clearTimeout(petAnimationTimeoutRef.current);
      }

      petAnimationTimeoutRef.current = setTimeout(() => {
        setIsPetAnimationActive(false);
        petAnimationTimeoutRef.current = null;
      }, ANIMATION_DURATION_MS);
    } else {
      setProgress((prev) => ({
        ...prev,
        forcedTouchCount: (prev.forcedTouchCount || 0) + 1,
      }));

      pushSystem(stage.petText);
    }
  };

  const handleFeed = () => {
    const willAnimate = trustLevel >= 6;

    if (
      !beginInteractionCooldown(
        willAnimate ? ANIMATION_DURATION_MS : INTERACTION_COOLDOWN_MS
      )
    ) {
      return;
    }

    const nextProgress = {
      ...progress,
      attemptedFeed: true,
    };

    setProgress(nextProgress);
    pushSystem(stage.feedText);
    maybeQueueLevelUp(nextProgress);
  };

  const handleFeedAnimationStateChange = (isAnimating) => {
    setIsFeedAnimationActive(isAnimating);
  };

  const handleSitQuietly = () => {
    const willAnimate = trustLevel === 2;

    if (
      !beginInteractionCooldown(
        willAnimate ? ANIMATION_DURATION_MS : INTERACTION_COOLDOWN_MS
      )
    ) {
      return;
    }

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

    pushSystem(stage.sitText);
    maybeQueueLevelUp(nextProgress);
  };

  const handleSendMessage = (suggestedText, fromSuggestion = false) => {
    const text = (suggestedText ?? draftMessage).trim();
    const gentle = isGentleTone(text);

    if (!text) return;
    if (isWaitingForReply) return;

    if (fromSuggestion) {
      setQuickSuggestions((prev) =>
        prev.filter((suggestion) => suggestion !== text)
      );
    }

    setMessages((prev) => [...prev, { from: "you", text, ts: Date.now() }]);
    setIsWaitingForReply(true);

    const nextProgress = {
      ...progress,
      dialogueCount: progress.dialogueCount + 1,
      gentleDialogueCount: progress.gentleDialogueCount + (gentle ? 1 : 0),
      harshDialogueCount: gentle
        ? progress.harshDialogueCount || 0
        : (progress.harshDialogueCount || 0) + 1,
    };

    setProgress(nextProgress);
    maybeQueueLevelUp(nextProgress);

    replyTimeoutRef.current = window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { from: "meowzart", text: stage.replyText, ts: Date.now() },
      ]);
      setIsWaitingForReply(false);
      replyTimeoutRef.current = null;
    }, REPLY_DELAY_MS);

    setDraftMessage("");
  };

  const handleSendMessageKeyDown = (e) => {
    if (e.key !== "Enter") return;
    if (isWaitingForReply) return;
    handleSendMessage();
  };

  const handleSuggestionClick = (suggestion) => {
    if (isWaitingForReply) return;
    handleSendMessage(suggestion, true);
  };

  const handleNextDay = (adminAdvance = false) => {
    const nextDayNumber = dayRef.current + 1;

    const noInteraction =
      progress.dialogueCount === 0 &&
      !progress.attemptedFeed &&
      !progress.attemptedSitQuietly &&
      progress.spendTimeCount === 0;

    const progressWithNegatives = {
      ...progress,
      ignoredDay: noInteraction,
    };

    let nextTrust = trustLevel;
    let transitionMessage = null;
    let nextStormTriggered = stormTriggered;

    if (adminAdvance) {
      nextTrust = Math.min(10, trustLevel + 1);
      if (nextTrust === 7) {
        transitionMessage = STAGE_CONFIG[7].entryMessage;
        nextStormTriggered = true;
      }
    } else {
      const regression = checkTrustRegression(
        trustLevel,
        progressWithNegatives
      );

      if (regression) {
        nextTrust = regression.nextTrustLevel;
        transitionMessage = regression.message;
      } else if (pendingTrustLevel && pendingTrustLevel > trustLevel) {
        nextTrust = pendingTrustLevel;

        if (nextTrust === 7 && !stormTriggered) {
          transitionMessage = STAGE_CONFIG[7].entryMessage;
          nextStormTriggered = true;
        } else {
          transitionMessage = getStage(nextTrust).entryMessage;
        }
      }
    }

    setIsFading(true);

    window.setTimeout(() => {
      setTrustLevel(nextTrust);
      setStormTriggered(nextStormTriggered);
      setPendingTrustLevel(null);
      setProgress(createProgressState());
      setDay(nextDayNumber);

      setMessages((prev) => [
        ...prev,
        { from: "day", text: `Day ${nextDayNumber}`, ts: Date.now() },
        ...(transitionMessage
          ? [{ from: "system", text: transitionMessage, ts: Date.now() + 1 }]
          : []),
      ]);

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
            has officially adopted Meowzart.
          </p>
          <button onClick={() => setStarted(true)}>Start</button>
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
              Day {day} | {meters.trust.label}
            </div>

            <div className="pet-anchor">
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
          </div>

          <div className="room-footer">
            <div className="action-buttons">
              <button onClick={handlePet} disabled={isInteractionCoolingDown}>
                Pet
              </button>
              <Feed
                onFeed={handleFeed}
                disabled={isInteractionCoolingDown}
                trustLevel={trustLevel}
                onAnimationStateChange={handleFeedAnimationStateChange}
              />
              <Sit
                onSitQuietly={handleSitQuietly}
                disabled={isInteractionCoolingDown}
              />
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
              SKIP (DEMO ONLY)
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
            isLocked={isWaitingForReply}
            onKeyDown={handleSendMessageKeyDown}
          />
        </div>
      </div>
    </div>
  );
}