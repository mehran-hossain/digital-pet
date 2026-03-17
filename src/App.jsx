import { useMemo, useState, useReducer, useEffect, useRef } from "react";
import "./App.css";
import { PetSprite } from "./components/PetSprite";
import idleSprite from "./assets/cat animations/Idle.png";
import idle2Sprite from "./assets/cat animations/Idle2.png";
import waitingSprite from "./assets/cat animations/Waiting.png";
import sleepSprite from "./assets/cat animations/Sleep.png";
import box2Sprite from "./assets/cat animations/Box2.png";
import petSprite from "./assets/cat animations/Pet.png";
import eatingSprite from "./assets/cat animations/Eating.png";
import bathtubSprite from "./assets/cat animations/13Jul2025UpdateBathtab.png";
import adoptionSprite from "./assets/cat animations/adoption.png";
import roomBackground from "./assets/cat animations/ExampleRooms/ExampleRoom 2.png";

const initialPet = {
  mood: "neutral",
  lastInteraction: Date.now(),
  tricksUnlocked: ["sit"],
  message: "Hi 👋",
  currentTrick: null,
};

function petReducer(pet, action) {
  switch (action.type) {
    case "PET":
      return { ...pet, mood: "happy", lastInteraction: Date.now(), message: "Purr! 😊" };

    case "FEED":
      return { ...pet, mood: "happy", lastInteraction: Date.now(), message: "Yum! 🍪" };

    case "TIME_PASS": {
      // if no interaction for 10 seconds, go neutral
      const now = Date.now();
      const idleMs = now - pet.lastInteraction;
      if (idleMs > 6000) {
        return { ...pet, mood: "neutral", message: "Just chilling." };
      }
      return pet;
    }

    case "BATHE":
      return {
        ...pet,
        mood: "happy",
        lastInteraction: Date.now(),
        message: "Splish splash! 🛁",
      };

    case "TEACH_TRICK": {
      const trick = action.trick; // e.g. "playDead"
      if (pet.tricksUnlocked.includes(trick)) return pet;
      return {
        ...pet,
        tricksUnlocked: [...pet.tricksUnlocked, trick],
        message: `Learned ${trick}! 🎉`,
      };
    }

    case "DO_TRICK": {
      const trick = action.trick;
      return {
        ...pet,
        lastInteraction: Date.now(),
        message: `Doing ${trick}! 🎭`,
        currentTrick: trick,
      };
    }

    case "CLEAR_TRICK": {
      return {
        ...pet,
        currentTrick: null,
      };
    }

    default:
      return pet;
  }
}

export default function App() {
  const [started, setStarted] = useState(false);
  const [adopterName, setAdopterName] = useState("");
  const [pet, dispatch] = useReducer(petReducer, initialPet);
  const [day, setDay] = useState(1);
  const dayRef = useRef(day);
  const [currentSprite, setCurrentSprite] = useState(idleSprite);
  const [day1Attempts, setDay1Attempts] = useState({
    pet: false,
    feed: false,
    bathe: false,
  });
  const animationTimeoutRef = useRef(null);
  const [isFading, setIsFading] = useState(false);

  const [messages, setMessages] = useState(() => [
    {
      from: "system",
      text: "Meowzart appears afraid and refuses to leave the box",
      ts: Date.now(),
    },
  ]);
  const [draftMessage, setDraftMessage] = useState("");

  const ANIMATION_DURATION_MS = 4000;
  const FADE_OUT_MS = 280;
  const FADE_IN_MS = 280;

  const dayIdleSprite = useMemo(() => {
    if (day === 1) {
      return box2Sprite;
    }
    const options = [idleSprite, idle2Sprite, waitingSprite, sleepSprite];
    const idx = (Math.max(1, day) - 1) % options.length;
    return options[idx];
  }, [day]);

  useEffect(() => {
    dayRef.current = day;
  }, [day]);

  useEffect(() => {
    // When the day changes (or app starts), ensure we render the correct idle
    // unless an animation is currently playing.
    if (animationTimeoutRef.current) return;
    setCurrentSprite(dayIdleSprite);
  }, [dayIdleSprite]);

  const playAnimation = (sprite) => {
    setCurrentSprite(sprite);
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    animationTimeoutRef.current = setTimeout(() => {
      setCurrentSprite(dayIdleSprite);
      animationTimeoutRef.current = null;
    }, ANIMATION_DURATION_MS);
  };

  const handlePet = () => {
    if (day === 1) {
      if (day1Attempts.pet) return;

      const nextAttempts = { ...day1Attempts, pet: true };
      setDay1Attempts(nextAttempts);

        setMessages((msgs) => [
          ...msgs,
          { from: "system", text: "Meowzart refuses", ts: Date.now() },
          ...(nextAttempts.pet && nextAttempts.feed && nextAttempts.bathe
            ? [
                {
                  from: "system",
                  text: "maybe Meowzart will be more comfortable tomorrow",
                  ts: Date.now(),
                },
              ]
            : []),
        ]);

      return;
    }
    if (day === 2) {
      setMessages((msgs) => [
        ...msgs,
        { from: "system", text: "Meowzart refuses", ts: Date.now() },
      ]);
      return;
    }
    dispatch({ type: "PET" });
    playAnimation(petSprite);

    if (day === 3) {
      setMessages((msgs) => [
        ...msgs,
        { from: "meowzart", text: "Meowzart: ..purrr....<3", ts: Date.now() },
      ]);
    }
  };

  const handleFeed = () => {
    if (day === 1) {
      if (day1Attempts.feed) return;

      const nextAttempts = { ...day1Attempts, feed: true };
      setDay1Attempts(nextAttempts);

      setMessages((msgs) => [
        ...msgs,
        { from: "system", text: "Meowzart refuses", ts: Date.now() },
        ...(nextAttempts.pet && nextAttempts.feed && nextAttempts.bathe
          ? [
              {
                from: "system",
                text: "maybe Meowzart will be more comfortable tomorrow",
                ts: Date.now(),
              },
            ]
          : []),
      ]);

      return;
    }
    if (day === 2) {
      setMessages((msgs) => [
        ...msgs,
        { from: "system", text: "Meowzart refuses", ts: Date.now() },
      ]);
      return;
    }
    dispatch({ type: "FEED" });
    playAnimation(eatingSprite);

    if (day === 3) {
      setMessages((msgs) => [
        ...msgs,
        { from: "meowzart", text: "Meowzart: CHOMPCHOMPCHOMP", ts: Date.now() },
      ]);
    }
  };

  const handleBathe = () => {
    if (day === 1) {
      if (day1Attempts.bathe) return;

      const nextAttempts = { ...day1Attempts, bathe: true };
      setDay1Attempts(nextAttempts);

      setMessages((msgs) => [
        ...msgs,
        { from: "system", text: "Meowzart refuses", ts: Date.now() },
        ...(nextAttempts.pet && nextAttempts.feed && nextAttempts.bathe
          ? [
              {
                from: "system",
                text: "maybe Meowzart will be more comfortable tomorrow",
                ts: Date.now(),
              },
            ]
          : []),
      ]);

      return;
    }
    if (day === 2) {
      setMessages((msgs) => [
        ...msgs,
        { from: "system", text: "Meowzart refuses", ts: Date.now() },
      ]);
      return;
    }
    dispatch({ type: "BATHE" });
    playAnimation(bathtubSprite);
  };

  const isBathSprite = currentSprite === bathtubSprite;
  const currentFrameWidth = isBathSprite ? 64 : 32;
  const currentFrameHeight = isBathSprite ? 43 : 32;

  // Preload animation sprite sheets so transitions feel smoother
  useEffect(() => {
    const images = [
      idleSprite,
      idle2Sprite,
      waitingSprite,
      sleepSprite,
      petSprite,
      eatingSprite,
      bathtubSprite,
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

  const handleSendMessage = () => {
    const text = draftMessage.trim();
    if (!text) return;
    if (day === 1) {
      const now = Date.now();
      // Show the user's message immediately
      setMessages((prev) => [...prev, { from: "you", text, ts: now }]);
      // Delay Meowzart's default reply by ~2 seconds, and only if it's still Day 1
      window.setTimeout(() => {
        if (dayRef.current !== 1) return;
        setMessages((prev) => [
          ...prev,
          { from: "meowzart", text: "Meowzart: ...", ts: Date.now() },
        ]);
      }, 2000);
    } else if (day === 2) {
      const now = Date.now();
      setMessages((prev) => [...prev, { from: "you", text, ts: now }]);
      window.setTimeout(() => {
        if (dayRef.current !== 2) return;
        setMessages((prev) => [
          ...prev,
          { from: "meowzart", text: "Meowzart: Meow", ts: Date.now() },
        ]);
      }, 2000);
    } else {
      setMessages((prev) => [...prev, { from: "you", text, ts: Date.now() }]);
    }
    setDraftMessage("");
  };

  const handleNextDay = () => {
    if (isFading) return;
    setIsFading(true);

    // Clear any in-flight animation so the day switch is deterministic.
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    window.setTimeout(() => {
      const nextDay = dayRef.current + 1;
      setDay(nextDay);
      // Reset Day 1 attempts once we move on, just to keep state clean
      if (nextDay !== 1) {
        setDay1Attempts({ pet: false, feed: false, bathe: false });
      }
      const baseMessages = [
        {
          from: "day",
          text: `------Day ${nextDay}------`,
          ts: Date.now(),
        },
      ];
      // On Day 3, add a welcoming system line
      const day3Extra =
        nextDay === 3
          ? [
              {
                from: "system",
                text: "Meowzart has been waiting for you!",
                ts: Date.now() + 1,
              },
            ]
          : [];
      // Wipe previous chat and start fresh with the new day divider (+ optional extra)
      setMessages([...baseMessages, ...day3Extra]);
      // `dayIdleSprite` updates via `day`, and effect will set `currentSprite`
      window.setTimeout(() => setIsFading(false), FADE_IN_MS);
    }, FADE_OUT_MS);
  };

  // Time-based mood reset
  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => dispatch({ type: "TIME_PASS" }), 7000);
    return () => clearInterval(id);
  }, [started]);

  // Clear trick after 1 second
  useEffect(() => {
    if (pet.currentTrick) {
      const timer = setTimeout(() => {
        dispatch({ type: "CLEAR_TRICK" });
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [pet.currentTrick]);

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
              Day {day}
            </div>
            <PetSprite
              className="pet-sprite"
              src={currentSprite}
              alt="cat"
              frameWidth={currentFrameWidth}
              frameHeight={currentFrameHeight}
              scale={4}
              fps={day === 1 ? 0 : 8}
            />
          </div>
          <div className="room-footer">
            <div className="action-buttons">
              <button
                onClick={handlePet}
                disabled={day === 1 && day1Attempts.pet}
              >
                Pet
              </button>
              <button
                onClick={handleFeed}
                disabled={day === 1 && day1Attempts.feed}
              >
                Feed
              </button>
              <button
                onClick={handleBathe}
                disabled={day === 1 && day1Attempts.bathe}
              >
                Bathe
              </button>
            </div>
            <button
              className="next-day-room"
              onClick={handleNextDay}
              disabled={
                day === 1 &&
                !(day1Attempts.pet && day1Attempts.feed && day1Attempts.bathe)
              }
            >
              Next day
            </button>
          </div>
        </div>

        <div className="hud">
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
            <div className="message-compose">
              <input
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                placeholder="Send a message…"
                className="message-input"
              />
              <button onClick={handleSendMessage} className="send-button">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}