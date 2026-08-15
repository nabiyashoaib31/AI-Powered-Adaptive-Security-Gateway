import { useEffect, useState } from "react";
import "./App.css";

function App() {
  // =========================
  // LOGIN STATES
  // =========================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // USER STATES
  // =========================

  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // =========================
  // SECURITY LOG STATES
  // =========================

  const [securityLogs, setSecurityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // =========================
  // BLOCK STATES
  // =========================

  const [blocked, setBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // =========================
  // SECURITY PUZZLE STATES
  // =========================

  const [showPuzzle, setShowPuzzle] = useState(false);
  const [puzzleQuestion, setPuzzleQuestion] = useState("");
  const [puzzleLevel, setPuzzleLevel] = useState("");
  const [puzzleAnswer, setPuzzleAnswer] = useState("");
  const [puzzleLoading, setPuzzleLoading] = useState(false);
  const [puzzleMessage, setPuzzleMessage] = useState("");
  const [puzzleVerified, setPuzzleVerified] = useState(false);

  // =========================
  // PROOF OF WORK STATES
  // =========================

  const [showPoW, setShowPoW] = useState(false);
  const [powChallenge, setPowChallenge] = useState("");
  const [powDifficulty, setPowDifficulty] = useState(4);
  const [powLoading, setPowLoading] = useState(false);
  const [powMessage, setPowMessage] = useState("");
  const [powVerified, setPowVerified] = useState(false);

  // =========================
  // DASHBOARD TAB STATE
  // =========================

  const [activeTab, setActiveTab] = useState("dashboard");

  // =========================
  // ATTACK SIMULATOR STATE
  // =========================

  const [attackLog, setAttackLog] = useState([]);
  const [attackRunning, setAttackRunning] = useState(false);

  // =========================
  // BLOCK TIMER
  // =========================

  useEffect(() => {
    if (!blocked || remainingTime <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRemainingTime((time) => {
        if (time <= 1) {
          clearInterval(timer);

          setBlocked(false);
          setRemainingTime(0);

          setMessage(
            "✅ Account unlocked. You may try again."
          );

          return 0;
        }

        return time - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [blocked, remainingTime]);

  // =========================
  // SECURITY LOGS
  // =========================

  const fetchSecurityLogs = async () => {
    setLogsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/security/logs"
      );

      const data = await response.json();

      if (data.securityAction === "SECURITY_PUZZLE") {
        console.log("PUZZLE PAYLOAD (logs fetch):", data.puzzle);

        if (data.puzzle && data.puzzle.question) {
          setPuzzleQuestion(data.puzzle.question);
          setPuzzleLevel(data.puzzle.level || "N/A");
        } else {
          setPuzzleQuestion(
            "⚠️ Puzzle could not be loaded from server. Please refresh and try again."
          );
          setPuzzleLevel("N/A");
        }

        setPuzzleAnswer("");
        setPuzzleVerified(false);
        setPuzzleMessage("");
        setShowPuzzle(true);

        setMessage(
          `⚠️ Security puzzle required | Trust Score: ${data.trustScore ?? "N/A"
          }`
        );

        return;
      }

      if (data.success) {
        setSecurityLogs(data.logs || []);
      }
    } catch (error) {
      console.error(
        "Failed to fetch security logs:",
        error
      );
    } finally {
      setLogsLoading(false);
    }
  };

  // =========================
  // SHA-256
  // =========================

  const sha256 = async (text) => {
    const encoder = new TextEncoder();

    const data = encoder.encode(text);

    const hashBuffer =
      await crypto.subtle.digest(
        "SHA-256",
        data
      );

    const hashArray = Array.from(
      new Uint8Array(hashBuffer)
    );

    return hashArray
      .map((byte) =>
        byte
          .toString(16)
          .padStart(2, "0")
      )
      .join("");
  };

  // =========================
  // SOLVE PROOF OF WORK
  // =========================

  const solveProofOfWork = async (
    challenge,
    difficulty
  ) => {
    const target =
      "0".repeat(difficulty);

    let nonce = 0;

    while (true) {
      const hash = await sha256(
        challenge + nonce
      );

      if (hash.startsWith(target)) {
        return {
          nonce,
          hash,
        };
      }

      nonce++;

      // Prevent browser freezing
      if (nonce % 1000 === 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, 0)
        );
      }
    }
  };

  // =========================
  // HANDLE LOGIN
  // =========================

  const handleLogin = async (e) => {
    e.preventDefault();

    if (blocked) {
      setMessage(
        `🚫 Account temporarily blocked. Try again in ${remainingTime} seconds.`
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data =
        await response.json();
      console.log("LOGIN RESPONSE:", data);
      console.log("PUZZLE DATA:", data.puzzle);

      // =========================
      // SUCCESSFUL LOGIN
      // =========================

      if (response.ok) {
        localStorage.setItem(
          "token",
          data.token
        );

        setUser(data.user);
        setLoggedIn(true);

        setShowPoW(false);
        setPowVerified(false);
        setPowChallenge("");
        setPowMessage("");

        setShowPuzzle(false);
        setPuzzleVerified(false);
        setPuzzleMessage("");

        fetchSecurityLogs();

        return;
      }

      // =========================
      // PROOF OF WORK REQUIRED
      // =========================

      if (
        data.securityAction ===
        "PROOF_OF_WORK"
      ) {
        setPowChallenge(
          data.challenge
        );

        setPowDifficulty(
          data.difficulty || 4
        );

        setShowPoW(true);

        setPowVerified(false);

        setPowMessage(
          "⚠️ High-risk activity detected. Please complete the Proof-of-Work challenge."
        );

        return;
      }

      // =========================
      // SECURITY PUZZLE REQUIRED
      // =========================

      if (
        data.securityAction ===
        "SECURITY_PUZZLE"
      ) {
        console.log(
          "PUZZLE PAYLOAD:",
          data.puzzle
        ); // debug: check exact shape backend sent

        if (data.puzzle && data.puzzle.question) {
          setPuzzleLevel(
            data.puzzle.level || "N/A"
          );

          setPuzzleQuestion(
            data.puzzle.question
          );
        } else {
          // backend didn't send puzzle in the expected shape
          setPuzzleLevel("N/A");

          setPuzzleQuestion(
            "⚠️ Puzzle could not be loaded from server. Please refresh and try again."
          );
        }

        setShowPuzzle(true);

        setPuzzleAnswer("");

        setPuzzleVerified(false);

        setPuzzleMessage(
          `🧩 Security challenge required | Trust Score: ${data.trustScore ?? "N/A"}`
        );
        return;
      }

      // =========================
      // TEMPORARY BLOCK
      // =========================

      if (data.blocked === true) {
        setShowPuzzle(false);
        setShowPoW(false);

        setBlocked(true);

        setRemainingTime(
          Number(data.remainingTime) || 30
        );

        setMessage(
          `🚫 Account temporarily blocked | Trust Score: ${data.trustScore ?? "N/A"
          }`
        );

        return;
      }

      // =========================
      // NORMAL LOGIN ERROR
      // =========================

      setMessage(
        `⚠️ ${data.message ||
        "Login failed"
        } | Trust Score: ${data.trustScore ?? "N/A"
        }`
      );
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setMessage(
        "❌ Cannot connect to security server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // VERIFY SECURITY PUZZLE
  // =========================

  const handlePuzzleSubmit =
    async () => {
      if (!puzzleAnswer.trim()) {
        setPuzzleMessage(
          "⚠️ Please enter your answer."
        );
        return;
      }

      setPuzzleLoading(true);
      setPuzzleMessage("");

      try {
        const response =
          await fetch(
            "http://localhost:5000/api/auth/verify-puzzle",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                email,
                answer:
                  puzzleAnswer,
              }),
            }
          );

        const data =
          await response.json();

        if (response.ok) {
          setPuzzleVerified(
            true
          );

          setShowPuzzle(false);

          setPuzzleAnswer("");

          setPuzzleMessage("");

          setMessage(
            "🛡️ Security challenge passed. Now enter your password again."
          );
        } else {
          setPuzzleVerified(
            false
          );

          if (data.puzzle) {
            setPuzzleQuestion(
              data.puzzle.question
            );

            setPuzzleLevel(
              data.puzzle.level
            );
          }

          setPuzzleAnswer("");

          setPuzzleMessage(
            `❌ Incorrect answer. A new security challenge is required | Trust Score: ${data.trustScore ?? "N/A"}`
          );
        }
      } catch (error) {
        console.error(
          "Puzzle verification error:",
          error
        );

        setPuzzleMessage(
          "❌ Cannot connect to security server."
        );
      } finally {
        setPuzzleLoading(false);
      }
    };

  // =========================
  // VERIFY PROOF OF WORK
  // =========================

  const handleProofOfWork =
    async () => {
      if (!powChallenge) {
        return;
      }

      setPowLoading(true);

      setPowMessage(
        "🧩 Solving Proof-of-Work challenge..."
      );

      try {
        // Solve challenge in browser
        const result =
          await solveProofOfWork(
            powChallenge,
            powDifficulty
          );

        setPowMessage(
          `Nonce found: ${result.nonce}. Verifying with security server...`
        );

        // Send solution to backend
        const response =
          await fetch(
            "http://localhost:5000/api/security/pow/verify",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                challenge:
                  powChallenge,

                nonce: result.nonce,

                difficulty:
                  powDifficulty,
              }),
            }
          );

        const data =
          await response.json();

        // =========================
        // SECURITY PUZZLE AFTER POW
        // =========================

        if (
          data.securityAction ===
          "SECURITY_PUZZLE"
        ) {
          setShowPuzzle(true);

          setPuzzleVerified(
            false
          );

          console.log("PUZZLE PAYLOAD (after PoW):", data.puzzle);

          if (data.puzzle && data.puzzle.question) {
            setPuzzleQuestion(
              data.puzzle.question
            );

            setPuzzleLevel(
              data.puzzle.level || "N/A"
            );
          } else {
            setPuzzleQuestion(
              "⚠️ Puzzle could not be loaded from server. Please refresh and try again."
            );

            setPuzzleLevel("N/A");
          }

          setPuzzleAnswer("");

          setPuzzleMessage(
            "🧩 Security challenge required. Solve it before trying your password again."
          );

          setShowPoW(false);

          return;
        }

        // =========================
        // POW VERIFIED
        // =========================

        if (
          response.ok &&
          data.verified
        ) {
          setPowVerified(
            true
          );

          setPowMessage(
            "✅ Proof-of-Work verification successful!"
          );

          setMessage(
            "🛡️ Security challenge passed. You may now retry login with the correct password."
          );
        } else {
          setPowVerified(
            false
          );

          setPowMessage(
            "❌ Proof-of-Work verification failed."
          );
        }
      } catch (error) {
        console.error(
          "PoW error:",
          error
        );

        setPowMessage(
          "❌ Proof-of-Work verification failed."
        );
      } finally {
        setPowLoading(false);
      }
    };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    setLoggedIn(false);
    setUser(null);

    setEmail("");
    setPassword("");

    setSecurityLogs([]);

    setShowPoW(false);
    setPowChallenge("");
    setPowVerified(false);
    setPowMessage("");

    setShowPuzzle(false);
    setPuzzleAnswer("");
    setPuzzleVerified(false);
    setPuzzleMessage("");

    setBlocked(false);
    setRemainingTime(0);

    setMessage("");
  };

  // =========================
  // ATTACK SIMULATOR
  // Live brute-force demo: repeatedly sends
  // wrong passwords for this account and shows
  // trust score dropping in real time.
  // =========================

  const runAttackSimulation = async () => {
    setAttackRunning(true);
    setAttackLog([]);

    const targetEmail = user.email || email;
    const totalAttempts = 5;

    for (let i = 1; i <= totalAttempts; i++) {
      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: targetEmail,
              password: "wrong_password_" + i,
            }),
          }
        );

        const data = await response.json();

        setAttackLog((prev) => [
          ...prev,
          {
            attempt: i,
            status:
              data.securityAction ||
              (data.blocked ? "TEMPORARY_BLOCK" : "DENY"),
            trustScore: data.trustScore,
            riskLevel: data.riskLevel,
            message: data.message,
            blocked: data.blocked === true,
          },
        ]);

        if (data.blocked) {
          break;
        }
      } catch (error) {
        setAttackLog((prev) => [
          ...prev,
          {
            attempt: i,
            status: "ERROR",
            message: "Could not reach server",
            blocked: false,
          },
        ]);
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setAttackRunning(false);
  };

  // =========================
  // DASHBOARD
  // =========================

  if (loggedIn && user) {
    const trustScore =
      user.trustScore ?? 100;

    let riskLevel = "LOW";

    if (trustScore < 80) {
      riskLevel = "MEDIUM";
    }

    if (trustScore < 50) {
      riskLevel = "CRITICAL";
    }

    return (
      <div className="dashboard">

        {/* SIDEBAR */}

        <aside className="sidebar">

          <div className="dashboard-logo">
            🛡️

            <span>
              Adaptive
              <br />
              Security
            </span>
          </div>

          <nav>

            <div
              className={
                activeTab === "dashboard"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => setActiveTab("dashboard")}
            >
              📊 Dashboard
            </div>

            <div
              className={
                activeTab === "alerts"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => {
                setActiveTab("alerts");
                fetchSecurityLogs();
              }}
            >
              🚨 Security Alerts
            </div>

            <div
              className={
                activeTab === "logs"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => {
                setActiveTab("logs");
                fetchSecurityLogs();
              }}
            >
              📋 Security Logs
            </div>

            <div
              className={
                activeTab === "simulator"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => setActiveTab("simulator")}
            >
              ⚡ Attack Simulator
            </div>

          </nav>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </aside>

        {/* MAIN DASHBOARD */}

        <main className="dashboard-main">

          {/* HEADER */}

          <header className="dashboard-header">

            <div>
              <h1>
                Security Dashboard
              </h1>

              <p>
                AI-Powered Adaptive Security Gateway
              </p>
            </div>

            <div className="user-info">

              <div className="user-avatar">
                👤
              </div>

              <div>

                <strong>
                  {user.name ||
                    "User"}
                </strong>

                <small>
                  {user.email ||
                    email}
                </small>

              </div>

            </div>

          </header>

          {/* SECURITY STATUS */}

          <div className="status-banner">

            <div>

              <span className="online-dot">
              </span>

              <strong>
                Security Gateway Active
              </strong>

            </div>

            <span>
              Real-time protection enabled
            </span>

          </div>

          {activeTab === "dashboard" && (
            <>

              {/* STAT CARDS */}

              <section className="stats-grid">

                <div className="stat-card">

                  <div className="stat-icon">
                    🎯
                  </div>

                  <div>

                    <span>
                      Trust Score
                    </span>

                    <h2>
                      {trustScore}
                    </h2>

                  </div>

                </div>

                <div className="stat-card">

                  <div className="stat-icon">
                    ⚠️
                  </div>

                  <div>

                    <span>
                      Risk Level
                    </span>

                    <h2
                      className={riskLevel.toLowerCase()}
                    >
                      {riskLevel}
                    </h2>

                  </div>

                </div>

                <div className="stat-card">

                  <div className="stat-icon">
                    🔐
                  </div>

                  <div>

                    <span>
                      Authentication
                    </span>

                    <h2 className="safe">
                      JWT Active
                    </h2>

                  </div>

                </div>

                <div className="stat-card">

                  <div className="stat-icon">
                    🛡️
                  </div>

                  <div>

                    <span>
                      Account Status
                    </span>

                    <h2 className="safe">
                      {user.status ||
                        "Safe"}
                    </h2>

                  </div>

                </div>

              </section>

              {/* TRUST SCORE */}

              <section className="dashboard-card">

                <div className="card-title">

                  <div>

                    <h2>
                      Behavioral Trust Score
                    </h2>

                    <p>
                      Current security confidence of this user
                    </p>

                  </div>

                  <strong className="big-score">
                    {trustScore}/100
                  </strong>

                </div>

                <div className="progress-background">

                  <div
                    className="progress-bar"
                    style={{
                      width: `${trustScore}%`,
                    }}
                  >
                  </div>

                </div>

                <div className="score-labels">

                  <span>
                    High Risk
                  </span>

                  <span>
                    Medium
                  </span>

                  <span>
                    Trusted
                  </span>

                </div>

              </section>

              {/* RECENT ACTIVITY */}

              <section className="dashboard-card">

                <div className="card-title">

                  <div>

                    <h2>
                      Recent Security Activity
                    </h2>

                    <p>
                      Latest activity detected by the gateway
                    </p>

                  </div>

                </div>

                <div className="activity-list">

                  <div className="activity">

                    <span className="activity-icon success">
                      ✓
                    </span>

                    <div>

                      <strong>
                        Successful Login
                      </strong>

                      <p>
                        {user.email ||
                          email}
                      </p>

                    </div>

                    <span className="activity-time">
                      Just now
                    </span>

                  </div>

                  <div className="activity">

                    <span className="activity-icon secure">
                      🛡️
                    </span>

                    <div>

                      <strong>
                        JWT Authentication
                      </strong>

                      <p>
                        Protected session established
                      </p>

                    </div>

                    <span className="activity-time">
                      Just now
                    </span>

                  </div>

                  <div className="activity">

                    <span className="activity-icon secure">
                      ✓
                    </span>

                    <div>

                      <strong>
                        Security Check Passed
                      </strong>

                      <p>
                        Behavior appears normal
                      </p>

                    </div>

                    <span className="activity-time">
                      Just now
                    </span>

                  </div>

                </div>

              </section>

            </>
          )}

          {activeTab === "logs" && (

            <section className="dashboard-card">

              <div className="card-title">

                <div>

                  <h2>
                    Security Logs
                  </h2>

                  <p>
                    Real security events recorded by the gateway
                  </p>

                </div>

                <button
                  className="refresh-btn"
                  onClick={
                    fetchSecurityLogs
                  }
                >
                  🔄 Refresh
                </button>

              </div>

              {logsLoading ? (

                <div className="logs-message">
                  Loading security logs...
                </div>

              ) : securityLogs.length === 0 ? (

                <div className="logs-message">
                  No security logs available.
                </div>

              ) : (

                <div className="logs-container">

                  {securityLogs
                    .slice(0, 10)
                    .map(
                      (log, index) => {

                        const isFailed =
                          log.status ===
                          "FAILED LOGIN";

                        const isBlocked =
                          log.blocked ===
                          true ||
                          log.riskLevel ===
                          "CRITICAL";

                        return (
                          <div
                            className="log-row"
                            key={index}
                          >

                            <div className="log-status">

                              <span
                                className={
                                  isBlocked
                                    ? "log-dot blocked"
                                    : isFailed
                                      ? "log-dot failed"
                                      : "log-dot success"
                                }
                              >
                              </span>

                              <div>

                                <strong>
                                  {log.status}
                                </strong>

                                <small>
                                  {log.email}
                                </small>

                              </div>

                            </div>

                            <div className="log-details">

                              <span>
                                Trust:{" "}
                                {log.trustScore ??
                                  "N/A"}
                              </span>

                              <span>
                                Risk:{" "}
                                {log.riskLevel ??
                                  "LOW"}
                              </span>
                              <span>
                                Device:{" "}
                                {log.device ?? "Unknown"}
                              </span>

                              {log.failedAttempts !==
                                undefined && (
                                  <span>
                                    Attempts:{" "}
                                    {
                                      log.failedAttempts
                                    }
                                  </span>
                                )}

                            </div>

                            <div className="log-time">
                              {log.timestamp}
                            </div>

                          </div>
                        );
                      }
                    )}

                </div>

              )}

            </section>

          )}

          {activeTab === "alerts" && (

            <section className="dashboard-card">

              <div className="card-title">

                <div>

                  <h2>
                    🚨 Security Alerts
                  </h2>

                  <p>
                    High-risk and critical events detected by the gateway
                  </p>

                </div>

                <button
                  className="refresh-btn"
                  onClick={fetchSecurityLogs}
                >
                  🔄 Refresh
                </button>

              </div>

              {logsLoading ? (

                <div className="logs-message">
                  Loading alerts...
                </div>

              ) : securityLogs.filter(
                (log) =>
                  log.riskLevel === "HIGH" ||
                  log.riskLevel === "CRITICAL"
              ).length === 0 ? (

                <div className="logs-message">
                  No high-risk alerts. System is secure.
                </div>

              ) : (

                <div className="logs-container">

                  {securityLogs
                    .filter(
                      (log) =>
                        log.riskLevel === "HIGH" ||
                        log.riskLevel === "CRITICAL"
                    )
                    .slice(0, 10)
                    .map((log, index) => (

                      <div className="log-row" key={index}>

                        <div className="log-status">

                          <span className="log-dot blocked">
                          </span>

                          <div>

                            <strong>
                              {log.status}
                            </strong>

                            <small>
                              {log.email}
                            </small>

                          </div>

                        </div>

                        <div className="log-details">

                          <span>
                            Trust Score: {log.trustScore}
                          </span>

                          <span>
                            Risk: {log.riskLevel}
                          </span>

                        </div>

                        <div className="log-time">
                          {log.timestamp}
                        </div>

                      </div>

                    ))}

                </div>

              )}

            </section>

          )}

          {activeTab === "simulator" && (

            <section className="dashboard-card">

              <div className="card-title">

                <div>

                  <h2>
                    ⚡ Attack Simulator
                  </h2>

                  <p>
                    Simulates a brute-force attack on this account to demonstrate adaptive defense
                  </p>

                </div>

                <button
                  className="refresh-btn"
                  onClick={runAttackSimulation}
                  disabled={attackRunning}
                >
                  {attackRunning
                    ? "⏳ Running..."
                    : "▶ Start Attack Simulation"}
                </button>

              </div>

              {attackLog.length === 0 && !attackRunning && (

                <div className="logs-message">
                  Click "Start Attack Simulation" to simulate repeated failed login attempts and watch the trust score adapt in real time.
                </div>

              )}

              {attackLog.length > 0 && (

                <div className="logs-container">

                  {attackLog.map((entry, index) => (

                    <div className="log-row" key={index}>

                      <div className="log-status">

                        <span
                          className={
                            entry.blocked
                              ? "log-dot blocked"
                              : entry.status === "ALLOW"
                                ? "log-dot success"
                                : "log-dot failed"
                          }
                        >
                        </span>

                        <div>

                          <strong>
                            Attempt {entry.attempt}: {entry.status}
                          </strong>

                          <small>
                            {entry.message}
                          </small>

                        </div>

                      </div>

                      <div className="log-details">

                        <span>
                          Trust Score: {entry.trustScore ?? "N/A"}
                        </span>

                        <span>
                          Risk: {entry.riskLevel ?? "N/A"}
                        </span>

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </section>

          )}

          {activeTab === "dashboard" && (
            <>

              {/* PROTECTION MODULES */}

              <section className="dashboard-card">

                <div className="card-title">

                  <div>

                    <h2>
                      Active Protection Modules
                    </h2>

                    <p>
                      Security mechanisms currently protecting the system
                    </p>

                  </div>

                </div>

                <div className="modules-grid">

                  <div className="module active-module">

                    <span>
                      🔐
                    </span>

                    <div>

                      <strong>
                        JWT Authentication
                      </strong>

                      <small>
                        Active
                      </small>

                    </div>

                  </div>

                  <div className="module active-module">

                    <span>
                      🚫
                    </span>

                    <div>

                      <strong>
                        Brute Force Protection
                      </strong>

                      <small>
                        Active
                      </small>

                    </div>

                  </div>

                  <div className="module active-module">

                    <span>
                      ⚡
                    </span>

                    <div>

                      <strong>
                        Adaptive Rate Limiting
                      </strong>

                      <small>
                        Active
                      </small>

                    </div>

                  </div>

                  <div className="module active-module">

                    <span>
                      🧩
                    </span>

                    <div>

                      <strong>
                        Proof-of-Work
                      </strong>

                      <small>
                        Active
                      </small>

                    </div>

                  </div>

                  <div className="module active-module">

                    <span>
                      📋
                    </span>

                    <div>

                      <strong>
                        Security Logging
                      </strong>

                      <small>
                        Active
                      </small>

                    </div>

                  </div>

                </div>

              </section>

            </>
          )}

          <footer>
            AI-Powered Adaptive Security Gateway © 2026
          </footer>

        </main>

      </div>
    );
  }

  // =========================
  // LOGIN PAGE
  // =========================

  return (
    <div className="app">

      <div className="background-glow">
      </div>

      <div className="login-container">

        {/* BRAND */}

        <div className="brand">

          <div className="shield">
            🛡️
          </div>

          <h1>
            Adaptive Security
          </h1>

          <p>
            AI-Powered Security Gateway
          </p>

        </div>

        {/* LOGIN CARD */}

        <div className="login-card">

          <h2>
            Secure Login
          </h2>

          <p className="subtitle">
            Sign in to access your protected account
          </p>

          {/* LOGIN FORM */}

          <form
            onSubmit={handleLogin}
          >

            <label>
              Email Address
            </label>

            <input
              type="email"
              placeholder="admin@test.com"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              disabled={
                loading ||
                blocked ||
                showPuzzle
              }
              required
            />

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              disabled={
                showPuzzle ||
                loading ||
                blocked
              }
              required
            />

            <button
              type="submit"
              disabled={
                loading ||
                showPuzzle ||
                blocked
              }
            >
              {loading
                ? "Checking Security..."
                : blocked
                  ? `Blocked (${remainingTime}s)`
                  : "Login Securely"}
            </button>

          </form>

          {/* NORMAL MESSAGE */}

          {message && (
            <div className="message">
              {message}
            </div>
          )}

          {/* =========================
              SECURITY PUZZLE
          ========================= */}

          {showPuzzle && (

            <div
              className="pow-box"
              style={{
                marginTop: "20px",
                padding: "20px",
                border:
                  "1px solid #444",
                borderRadius:
                  "12px",
                background:
                  "#111",
              }}
            >

              <h3>
                🧩 Security Challenge
              </h3>

              <p>
                Suspicious login activity detected.
              </p>

              <p>
                Solve this challenge before trying your password again.
              </p>

              <div
                style={{
                  marginTop:
                    "15px",
                  padding:
                    "18px",
                  background:
                    "#1b1b1b",
                  borderRadius:
                    "10px",
                }}
              >

                <strong>
                  Security Level:
                </strong>

                <span
                  style={{
                    marginLeft:
                      "8px",
                  }}
                >
                  {puzzleLevel}
                </span>

                <div
                  style={{
                    marginTop:
                      "15px",
                    fontSize:
                      "18px",
                    fontWeight:
                      "600",
                  }}
                >
                  {puzzleQuestion}
                </div>

              </div>

              <input
                type="number"
                placeholder="Enter your answer"
                value={puzzleAnswer}
                onChange={(e) =>
                  setPuzzleAnswer(
                    e.target.value
                  )
                }
                disabled={
                  puzzleLoading
                }
                style={{
                  width: "100%",
                  marginTop:
                    "15px",
                  padding:
                    "12px",
                  boxSizing:
                    "border-box",
                }}
              />

              <button
                type="button"
                onClick={
                  handlePuzzleSubmit
                }
                disabled={
                  puzzleLoading ||
                  !puzzleAnswer.trim()
                }
                style={{
                  width: "100%",
                  marginTop:
                    "12px",
                }}
              >
                {puzzleLoading
                  ? "🔐 Verifying..."
                  : "Verify Security Challenge"}
              </button>

              {puzzleMessage && (

                <div
                  style={{
                    marginTop:
                      "15px",
                  }}
                >
                  {puzzleMessage}
                </div>

              )}

            </div>

          )}

          {/* =========================
              PROOF OF WORK
          ========================= */}

          {showPoW && (

            <div
              className="pow-box"
              style={{
                marginTop:
                  "20px",
                padding:
                  "20px",
                border:
                  "1px solid #444",
                borderRadius:
                  "12px",
              }}
            >

              <h3>
                🧩 Security Verification
              </h3>

              <p>
                Your activity has been classified as high risk.
              </p>

              <p>
                The gateway requires a Proof-of-Work challenge.
              </p>

              <div
                style={{
                  wordBreak:
                    "break-all",
                  padding:
                    "10px",
                  margin:
                    "10px 0",
                  background:
                    "#111",
                  borderRadius:
                    "8px",
                }}
              >

                <strong>
                  Challenge:
                </strong>

                <br />

                {powChallenge}

              </div>

              <p>
                Difficulty:{" "}
                <strong>
                  {powDifficulty}
                </strong>
              </p>

              <button
                type="button"
                onClick={
                  handleProofOfWork
                }
                disabled={
                  powLoading ||
                  powVerified
                }
              >
                {powLoading
                  ? "🧩 Solving Challenge..."
                  : powVerified
                    ? "✅ PoW Verified"
                    : "Solve Security Challenge"}
              </button>

              {powMessage && (

                <div
                  style={{
                    marginTop:
                      "12px",
                  }}
                >
                  {powMessage}
                </div>

              )}

              {powVerified && (

                <div
                  style={{
                    marginTop:
                      "12px",
                  }}
                >
                  🛡️ Security challenge passed.
                  <br />
                  Now enter the correct password and retry login.
                </div>

              )}

            </div>

          )}

          {/* SECURITY INFO */}

          <div className="security-info">

            <span>
              🔐 JWT Authentication
            </span>

            <span>
              🛡️ Adaptive Protection
            </span>

            <span>
              🧩 Proof-of-Work
            </span>

          </div>

        </div>

        <p className="footer-text">
          Your security is continuously monitored
        </p>

      </div>

    </div>
  );
}

export default App;