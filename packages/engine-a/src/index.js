import { getValidMoves } from "core";
function pick(arr) {
    if (!arr.length)
        return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
}
const engine = {
    name: "Random Engine",
    version: "1.0.0",
    author: "Infinite Othello",
    async analyze(req) {
        // Get valid moves using new game logic
        const moves = getValidMoves(req.gameCore.board, req.gameCore.currentPlayer);
        const bestMove = pick(moves) || null;
        return {
            bestMove,
            evaluation: 0, // Random engine doesn't evaluate
            nodes: moves.length,
            depth: 1,
            timeUsed: 1, // Minimal time for random selection
            pv: bestMove ? [bestMove] : undefined
        };
    }
};
export default engine;
