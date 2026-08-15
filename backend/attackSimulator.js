// =========================================================
// ATTACK SIMULATOR
// =========================================================
// Simulates a brute-force login attack against the backend,
// to demonstrate the Adaptive Security Gateway reacting live:
// normal fail -> puzzle -> puzzle -> temporary block.
//
// USAGE:
//   node attackSimulator.js
//
// Requires Node.js 18+ (uses built-in fetch).
// Make sure your backend server is already running on
// http://localhost:5000 before running this script.
// =========================================================

const API_URL = "http://localhost:5000/api/auth/login";

// Use a real registered user's email here.
// Keep the password DIFFERENT from their real password
// so every attempt is treated as a "wrong password" attack.
const TARGET_EMAIL = "admin@test.com";
const WRONG_PASSWORD = "hacker_guess_123";

// How many attack attempts to simulate
const TOTAL_ATTEMPTS = 6;

// Delay between attempts (ms) - slower looks more realistic on screen
const DELAY_MS = 1200;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    bold: "\x1b[1m",
};

const printHeader = () => {
    console.log(colors.bold + colors.cyan);
    console.log("=========================================================");
    console.log("   🛡️  ADAPTIVE SECURITY GATEWAY — ATTACK SIMULATOR");
    console.log("=========================================================");
    console.log(colors.reset);
    console.log(`Target account : ${TARGET_EMAIL}`);
    console.log(`Total attempts : ${TOTAL_ATTEMPTS}`);
    console.log("");
};

const printResult = (attemptNumber, data, status) => {
    console.log(colors.bold + `--- Attempt #${attemptNumber} ---` + colors.reset);
    console.log(`Status Code     : ${status}`);
    console.log(`Message         : ${data.message || "-"}`);

    if (data.trustScore !== undefined) {
        let scoreColor = colors.green;
        if (data.trustScore < 80) scoreColor = colors.yellow;
        if (data.trustScore < 40) scoreColor = colors.red;

        console.log(
            `Trust Score     : ${scoreColor}${data.trustScore}/100${colors.reset}`
        );
    }

    if (data.riskLevel) {
        console.log(`Risk Level      : ${data.riskLevel}`);
    }

    if (data.securityAction) {
        console.log(
            `Security Action : ${colors.magenta}${data.securityAction}${colors.reset}`
        );
    }

    if (data.puzzle) {
        console.log(`Puzzle Level    : ${data.puzzle.level}`);
        console.log(`Puzzle Question : ${data.puzzle.question}`);
    }

    if (data.blocked) {
        console.log(
            colors.red +
            colors.bold +
            `🚫 ACCOUNT BLOCKED for ${data.remainingTime} seconds!` +
            colors.reset
        );
    }

    console.log("");
};

const runAttack = async () => {
    printHeader();

    for (let i = 1; i <= TOTAL_ATTEMPTS; i++) {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: TARGET_EMAIL,
                    password: WRONG_PASSWORD,
                }),
            });

            const data = await response.json();

            printResult(i, data, response.status);

            if (data.blocked) {
                console.log(
                    colors.bold +
                    "Simulation stopped — account is now temporarily blocked." +
                    colors.reset
                );
                break;
            }
        } catch (error) {
            console.error(
                colors.red +
                `❌ Could not reach the server: ${error.message}` +
                colors.reset
            );
            console.error(
                "Make sure your backend is running on http://localhost:5000"
            );
            break;
        }

        await sleep(DELAY_MS);
    }

    console.log(colors.cyan + "Simulation complete.\n" + colors.reset);
};

runAttack();