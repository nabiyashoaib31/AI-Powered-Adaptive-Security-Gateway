// =========================
// SECURITY PUZZLE SERVICE
// =========================

const generateSecurityPuzzle = (failedAttempts) => {

    // =========================
    // EASY - 2nd FAILED ATTEMPT
    // =========================

    if (failedAttempts === 2) {

        const start = Math.floor(Math.random() * 5) + 2;

        return {
            level: "EASY",
            question: `What number comes next? ${start} → ${start * 2} → ${start * 4} → ?`,
            answer: start * 8
        };
    }


    // =========================
    // MEDIUM - 3rd FAILED ATTEMPT
    // =========================

    if (failedAttempts === 3) {

        const start = Math.floor(Math.random() * 5) + 3;

        return {
            level: "MEDIUM",
            question: `What number comes next? ${start} → ${start + 4} → ${start + 8} → ${start + 12} → ?`,
            answer: start + 16
        };
    }


    // =========================
    // HARD - 4th FAILED ATTEMPT
    // =========================

    if (failedAttempts === 4) {

        const start = Math.floor(Math.random() * 5) + 2;

        return {
            level: "HARD",
            question: `What number comes next? ${start}² → ${(start + 1)}² → ${(start + 2)}² → ?`,
            answer: Math.pow(start + 3, 2)
        };
    }


    // =========================
    // VERY HARD
    // =========================

    const start = Math.floor(Math.random() * 5) + 2;

    return {
        level: "VERY HARD",
        question: `Solve: ${start} × 3 + 5 = ?`,
        answer: start * 3 + 5
    };
};


// =========================
// VERIFY ANSWER
// =========================

const verifySecurityPuzzle = (puzzle, answer) => {

    if (!puzzle) {
        return false;
    }

    // Convert both to numbers
    const userAnswer = Number(String(answer).trim());
    const correctAnswer = Number(puzzle.answer);

    console.log("PUZZLE QUESTION:", puzzle.question);
    console.log("CORRECT ANSWER:", correctAnswer);
    console.log("USER ANSWER:", userAnswer);

    return userAnswer === correctAnswer;
};


module.exports = {
    generateSecurityPuzzle,
    verifySecurityPuzzle
};