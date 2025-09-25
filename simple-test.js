// 간단한 Neo 엔진 동작 테스트
import { engineNeo } from './packages/engine-neo/dist/index.js';

console.log('🔍 Neo Engine 기본 정보:');
console.log('Name:', engineNeo.name);
console.log('Version:', engineNeo.version);
console.log('Author:', engineNeo.author);

// 기본 보드 생성 (오델로 시작 위치)
function createInitialBoard() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  board[3][3] = 'white';
  board[3][4] = 'black';
  board[4][3] = 'black';
  board[4][4] = 'white';
  return board;
}

async function testBasicAnalysis() {
  console.log('\n🧪 기본 분석 테스트...');

  const gameCore = {
    id: 'simple-test',
    board: createInitialBoard(),
    currentPlayer: 'black',
    validMoves: [],
    score: { black: 2, white: 2 },
    status: 'playing',
    moveHistory: [],
    canUndo: false,
    canRedo: false
  };

  try {
    console.log('분석 시작...');

    const result = await engineNeo.analyze({
      gameCore,
      timeLimit: 1000, // 1초
      skill: 50 // 중간 난이도
    });

    console.log('✅ 분석 완료!');
    console.log('Best Move:', result.bestMove);
    console.log('Evaluation:', result.evaluation);
    console.log('Depth:', result.depth);
    console.log('Nodes:', result.nodes);
    console.log('Time Used:', result.timeUsed + 'ms');

    return true;

  } catch (error) {
    console.error('❌ 분석 실패:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

async function main() {
  console.log('🚀 Neo Engine 간단 테스트 시작\n');

  const success = await testBasicAnalysis();

  if (success) {
    console.log('\n✅ Neo Engine이 정상 동작합니다!');
  } else {
    console.log('\n❌ Neo Engine에 문제가 있습니다.');
    process.exit(1);
  }
}

main().catch(console.error);