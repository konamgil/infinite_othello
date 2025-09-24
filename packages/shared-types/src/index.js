/**
 * 🎯 Infinite Othello - 완전 새로운 타입 시스템
 *
 * 설계 원칙:
 * - 직관적이고 명확한 네이밍
 * - 오델로 게임 도메인에 최적화
 * - 타입 안전성과 성능 모두 고려
 * - 책임 분리된 상태 아키텍처
 */
// ===== 🔧 Utility Types =====
/** 위치 유효성 검사 */
export const isValidPosition = (pos) => pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
/** 플레이어 반전 */
export const getOpponent = (player) => player === 'black' ? 'white' : 'black';
/** 위치 문자열 변환 (디버깅용) */
export const positionToString = (pos) => `${String.fromCharCode(97 + pos.col)}${pos.row + 1}`; // a1, b2, etc.
/** 문자열을 위치로 변환 */
export const stringToPosition = (str) => {
    if (str.length !== 2)
        return null;
    const col = str.charCodeAt(0) - 97; // a=0, b=1, etc.
    const row = parseInt(str[1]) - 1; // 1=0, 2=1, etc.
    return isValidPosition({ row, col }) ? { row, col } : null;
};
// ===== 📊 Constants =====
export const GAME_CONSTANTS = {
    BOARD_SIZE: 8,
    INITIAL_PIECES: 4,
    MAX_MOVES: 60,
    DEFAULT_AI_DELAY: 1000, // ms
    DEFAULT_TIME_LIMIT: 1800, // 30분
    MIN_RATING: 800,
    MAX_RATING: 3000,
    INITIAL_RATING: 1200
};
