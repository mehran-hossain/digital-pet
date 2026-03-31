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
  resetDailyProgress,
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
import catsick2Sprite from "./assets/cat animations/catsick2.png";

const TUTORIAL_STEPS = [
  {
    title: "Meowzart may be scared at first",
    body: "Early interactions can seem negative. This is normal because building trust takes time!",
  },
  {
    title: "Gentle actions help build trust",
    body: "Try sitting quietly, speaking kindly, and watching how Meowzart reacts.",
  },
  {
    title: "Rushing or forcing actions and neglect reduces trust",
    body: "Trying to force rejected actions or leaving Meowzart alone too long can lower trust. Gentle, consistent care helps it feel safe.",
  },
  {
    title: "Progress will happen over multiple days",
    body: "Try observe Meowzart -> act gently -> watch the reaction -> move to the next day.",
  },
  {
    title: "You've Got A Fur Baby!",
    body: "Your goal is to bond with Meowzart by developing trust over several days.",
  },
];

const STAGE_CONFIG = {
  1: {
    label: "Fear",
    sprite: box2Sprite,
    entryMessage:
      "Try sitting quietly nearby Meowzart or sending a kind message from the suggestions below.",
    replyText: "Meowzart: ...",
    suggestions: ["Hello Meowzart", "I'll stay here until you're ready to come out."],
    feedText:
      "You place food nearby. Meowzart doesn't approach. Meowzart isn't ready yet. Try sitting quietly or speaking gently, then try again tomorrow.",
    petText:
      "Meowzart recoils slightly and stays hidden. It's not ready for touch yet.",
    sitText: "You sit nearby. Meowzart watches from inside the box.",
  },
  2: {
    label: "Observation",
    sprite: box2Sprite,
    entryMessage:
      "Meowzart watches you from inside the box. It seems unsure, but alert. Gentle actions still help most here.",
    replyText: "Meowzart: ...",
    suggestions: ["You can come out", "I won't get closer"],
    feedText:
      "Meowzart looks at the food, but stays inside. It may need more time.",
    petText: "Meowzart pulls back. It isn't ready for touch yet.",
    sitText: "Meowzart keeps watching you.",
  },
  3: {
    label: "First Step",
    sprite: catsick2Sprite,
    entryMessage:
      "Meowzart steps out of the box, but keeps its distance. Staying calm helps.",
    replyText: "Meowzart: meow.",
    suggestions: ["You can stay there", "Hi..."],
    feedText:
      "Meowzart approaches slightly, then stops. It notices the food, but still seems cautious.",
    petText: "Meowzart startles and steps back. It isn't ready for touch yet.",
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
      "There's a storm! The thunder startles Meowzart. It's distressed.",
    replyText: "Meowzart: ...",
    suggestions: ["It's okay", "I'm still here"],
    feedText: "Meowzart nibbles the food, then backs away.",
    petText: "Meowzart recoils.",
    sitText: "Meowzart retreats.",
  },
  8: {
    label: "Rebuilding",
    sprite: sadSprite,
    entryMessage:
      "Meowzart slowly comes out again. It seems cautious, but remembers you.",
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
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  const dayRef = useRef(day);
  const trustLevelRef = useRef(trustLevel);
  const pendingTrustLevelRef = useRef(pendingTrustLevel);
  const progressRef = useRef(progress);
  const stormTriggeredRef = useRef(stormTriggered);
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
    {
      from: "system",
      text: "Move on to the next day once you're done.",
      ts: Date.now() + 1,
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

  const maybeQueueLevelUp = (updatedProgress, levelOverride = trustLevelRef.current) => {
    const progression = checkTrustProgression(levelOverride, updatedProgress);
    if (progression) {
      pendingTrustLevelRef.current = progression.nextTrustLevel;
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
    trustLevelRef.current = trustLevel;
  }, [trustLevel]);

  useEffect(() => {
    pendingTrustLevelRef.current = pendingTrustLevel;
  }, [pendingTrustLevel]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    stormTriggeredRef.current = stormTriggered;
  }, [stormTriggered]);

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
    const currentTrustLevel = trustLevelRef.current;
    const currentStage = getStage(currentTrustLevel);
    const willAnimate = currentTrustLevel >= 9;

    if (
      !beginInteractionCooldown(
        willAnimate ? ANIMATION_DURATION_MS : INTERACTION_COOLDOWN_MS
      )
    ) {
      return;
    }

    if (willAnimate) {
      pushSystem(currentStage.petText);
      setIsPetAnimationActive(true);

      if (petAnimationTimeoutRef.current) {
        clearTimeout(petAnimationTimeoutRef.current);
      }

      petAnimationTimeoutRef.current = setTimeout(() => {
        setIsPetAnimationActive(false);
        petAnimationTimeoutRef.current = null;
      }, ANIMATION_DURATION_MS);
    } else {
      setProgress((prev) => {
        const nextProgress = {
          ...prev,
          dailyForcedTouchCount: (prev.dailyForcedTouchCount || 0) + 1,
        };
        progressRef.current = nextProgress;
        return nextProgress;
      });

      pushSystem(`${currentStage.petText} Try speaking gently or giving Meowzart space instead.`);
    }
  };

  const handleFeed = () => {
    const currentTrustLevel = trustLevelRef.current;
    const currentStage = getStage(currentTrustLevel);
    const willAnimate = currentTrustLevel >= 6;

    if (
      !beginInteractionCooldown(
        willAnimate ? ANIMATION_DURATION_MS : INTERACTION_COOLDOWN_MS
      )
    ) {
      return;
    }

    const currentProgress = progressRef.current;
    const nextProgress = {
      ...currentProgress,
      attemptedFeed: true,
      dailyAttemptedFeed: true,
    };

    progressRef.current = nextProgress;
    setProgress(nextProgress);
    pushSystem(currentStage.feedText);
    maybeQueueLevelUp(nextProgress, currentTrustLevel);
  };

  const handleFeedAnimationStateChange = (isAnimating) => {
    setIsFeedAnimationActive(isAnimating);
  };

  const handleSitQuietly = () => {
    const currentTrustLevel = trustLevelRef.current;
    const currentStage = getStage(currentTrustLevel);
    const currentProgress = progressRef.current;
    const willAnimate = currentTrustLevel === 2;

    if (
      !beginInteractionCooldown(
        willAnimate ? ANIMATION_DURATION_MS : INTERACTION_COOLDOWN_MS
      )
    ) {
      return;
    }

    const nextProgress = {
      ...currentProgress,
      attemptedSitQuietly: true,
      spendTimeCount: currentProgress.spendTimeCount + 1,
      dailyAttemptedSitQuietly: true,
      dailySpendTimeCount: currentProgress.dailySpendTimeCount + 1,
    };

    progressRef.current = nextProgress;
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

    pushSystem(currentStage.sitText);
    maybeQueueLevelUp(nextProgress, currentTrustLevel);
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

    const currentProgress = progressRef.current;
    const currentTrustLevel = trustLevelRef.current;
    const currentStage = getStage(currentTrustLevel);

    const nextProgress = {
      ...currentProgress,
      dialogueCount: currentProgress.dialogueCount + 1,
      gentleDialogueCount: currentProgress.gentleDialogueCount + (gentle ? 1 : 0),
      dailyDialogueCount: currentProgress.dailyDialogueCount + 1,
      dailyGentleDialogueCount: currentProgress.dailyGentleDialogueCount + (gentle ? 1 : 0),
      dailyHarshDialogueCount: gentle
        ? currentProgress.dailyHarshDialogueCount || 0
        : (currentProgress.dailyHarshDialogueCount || 0) + 1,
    };

    progressRef.current = nextProgress;
    setProgress(nextProgress);
    maybeQueueLevelUp(nextProgress, currentTrustLevel);

    replyTimeoutRef.current = window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { from: "meowzart", text: currentStage.replyText, ts: Date.now() },
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

  const handleNextDay = () => {
    const currentDay = dayRef.current;
    const currentTrustLevel = trustLevelRef.current;
    const currentPendingTrustLevel = pendingTrustLevelRef.current;
    const currentProgress = progressRef.current;
    const currentStormTriggered = stormTriggeredRef.current;
    const nextDayNumber = currentDay + 1;

    const noInteractionToday =
      currentProgress.dailyDialogueCount === 0 &&
      !currentProgress.dailyAttemptedFeed &&
      !currentProgress.dailyAttemptedSitQuietly &&
      currentProgress.dailySpendTimeCount === 0;

    const progressWithNegatives = {
      ...currentProgress,
      ignoredDay: noInteractionToday,
    };

    let nextTrust = currentTrustLevel;
    let transitionMessage = null;
    let nextStormTriggered = currentStormTriggered;

    const regression = checkTrustRegression(
      currentTrustLevel,
      progressWithNegatives
    );

    if (regression) {
      nextTrust = regression.nextTrustLevel;
      transitionMessage = regression.message;
    } else if (
      currentPendingTrustLevel &&
      currentPendingTrustLevel > currentTrustLevel
    ) {
      nextTrust = currentPendingTrustLevel;

      if (nextTrust === 7 && !currentStormTriggered) {
        transitionMessage = STAGE_CONFIG[7].entryMessage;
        nextStormTriggered = true;
      } else {
        transitionMessage = getStage(nextTrust).entryMessage;
      }
    }

    setIsFading(true);

    window.setTimeout(() => {
      trustLevelRef.current = nextTrust;
      stormTriggeredRef.current = nextStormTriggered;
      pendingTrustLevelRef.current = null;

      const resetProgress = resetDailyProgress(progressRef.current);
      progressRef.current = resetProgress;
      dayRef.current = nextDayNumber;

      setTrustLevel(nextTrust);
      setStormTriggered(nextStormTriggered);
      setPendingTrustLevel(null);
      setProgress(resetProgress);
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

  const handleStart = () => {
    if (!adopterName.trim()) return;
    setStarted(true);
    setTutorialStep(0);
    setShowTutorial(true);
  };

  const handleNextTutorialStep = () => {
    if (tutorialStep >= TUTORIAL_STEPS.length - 1) {
      setShowTutorial(false);
      return;
    }
    setTutorialStep((prev) => prev + 1);
  };

  const tutorial = TUTORIAL_STEPS[tutorialStep];

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
              placeholder="Enter your name"
              className="adopter-input"
            />{" "}
            has officially adopted Meowzart.
          </p>
          <button onClick={handleStart} disabled={!adopterName.trim()}>
            Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pet-page">
      <div className={`fade-overlay ${isFading ? "fade-overlay--visible" : ""}`} />

      {showTutorial && tutorial ? (
        <div className="tutorial-overlay" role="dialog" aria-modal="true">
          <div className="tutorial-card">
            <div className="tutorial-step">Getting started • {tutorialStep + 1}/{TUTORIAL_STEPS.length}</div>
            <h2>{tutorial.title}</h2>
            <p>{tutorial.body}</p>
            <div className="tutorial-actions">
              <button type="button" className="tutorial-skip" onClick={() => setShowTutorial(false)}>
                Skip
              </button>
              <button type="button" className="tutorial-next" onClick={handleNextTutorialStep}>
                {tutorialStep === TUTORIAL_STEPS.length - 1 ? "Start caring for Meowzart" : "Next"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

          <div className="guidance-panel" aria-label="interaction guidance">
            <div className="guidance-panel__title">How to care for Meowzart</div>
            <div className="guidance-panel__steps">
              1. Observe → 2. Act gently → 3. Watch the reaction → 4. Move to the next day
            </div>
            <div className="guidance-panel__note">
              Early interactions may seem negative, that is normal.
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
              onClick={handleNextDay}
              disabled={isFading}
            >
              Next day
            </button>

            {/*
            <button
              className="admin-next-day"
              onClick={() => handleNextDay(true)}
              disabled={isFading}
              title="Testing only: next day + trust level +1"
            >
              SKIP (DEMO ONLY)
            </button>
            */}
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
