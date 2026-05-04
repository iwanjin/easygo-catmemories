// ============================================================
// Cloud Module — Firestore 글로벌 리더보드
//
// 단일 책임: Firebase Web SDK v10 modular API를 동적으로 import해
// 글로벌 리더보드의 read/write를 제공.
//
// 키가 설정 안 되어 있으면(window.FIREBASE_READY === false) 모든
// 함수는 "비활성" 신호를 반환해서 호출 측에서 graceful하게 처리한다.
//
// 컬렉션 구조:
//   leaderboard (단일 컬렉션)
//     - difficulty: "easy" | "medium" | "hard"
//     - name:       string (1..12자, 트리밍됨, 빈값이면 "익명")
//     - score:      number
//     - time:       number (초)
//     - moves:      number
//     - deviceId:   string (anonymous device fingerprint)
//     - createdAt:  serverTimestamp
//
// TOP10 정렬: score desc, time asc, moves asc.
//   → Firestore 콘솔에서 복합 인덱스 자동 안내됨.
// ============================================================

const Cloud = (function () {
  let appPromise = null;
  let dbPromise = null;
  let mod = null; // firestore 함수들 캐시

  function isReady() {
    return !!window.FIREBASE_READY;
  }

  // 첫 호출 시에만 SDK 동적 import — 게임 시작에는 영향 없음.
  async function ensure() {
    if (!isReady()) throw new Error('FIREBASE_NOT_CONFIGURED');
    if (dbPromise) return dbPromise;

    const appMod = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js');
    const fsMod = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js');
    mod = fsMod;

    const app = appMod.initializeApp(window.FIREBASE_CONFIG);
    const db = fsMod.getFirestore(app);
    dbPromise = Promise.resolve(db);
    return dbPromise;
  }

  // ====== 디바이스 ID — 글로벌 기록을 "내 기록"으로 식별 ======
  const DEVICE_KEY = 'memoCats_deviceId';
  function getDeviceId() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      try {
        localStorage.setItem(DEVICE_KEY, id);
      } catch {}
    }
    return id;
  }

  // ====== 글로벌 기록 추가 ======
  // entry: { difficulty, name, score, time, moves }
  // 반환: { ok: true, id } | { ok: false, reason }
  async function addEntry(entry) {
    if (!isReady()) return { ok: false, reason: 'not_configured' };
    try {
      const db = await ensure();
      const col = mod.collection(db, 'leaderboard');
      const doc = await mod.addDoc(col, {
        difficulty: String(entry.difficulty || 'easy'),
        name: String(entry.name || '익명').slice(0, 12),
        score: Number(entry.score) || 0,
        time: Number(entry.time) || 0,
        moves: Number(entry.moves) || 0,
        deviceId: getDeviceId(),
        createdAt: mod.serverTimestamp()
      });
      return { ok: true, id: doc.id };
    } catch (e) {
      console.warn('[Cloud] addEntry failed', e);
      return { ok: false, reason: 'error', error: e };
    }
  }

  // ====== 난이도별 TOP N 조회 ======
  // 반환: [{ name, score, time, moves, deviceId, isMe }] | []
  async function getTop(difficulty, limitN = 10) {
    if (!isReady()) return [];
    try {
      const db = await ensure();
      const col = mod.collection(db, 'leaderboard');
      const q = mod.query(
        col,
        mod.where('difficulty', '==', difficulty),
        mod.orderBy('score', 'desc'),
        mod.orderBy('time', 'asc'),
        mod.orderBy('moves', 'asc'),
        mod.limit(limitN)
      );
      const snap = await mod.getDocs(q);
      const me = getDeviceId();
      return snap.docs.map((d) => {
        const x = d.data();
        return {
          name: x.name || '익명',
          score: x.score || 0,
          time: x.time || 0,
          moves: x.moves || 0,
          deviceId: x.deviceId,
          isMe: x.deviceId === me
        };
      });
    } catch (e) {
      console.warn('[Cloud] getTop failed', e);
      return [];
    }
  }

  // ====== 백분위 계산 ======
  // 단순화: 같은 난이도의 최근 200건 표본을 가져와 내 점수보다 낮은 비율 계산.
  // 이상적이진 않지만, 글로벌 통계 추세를 대략 반영하고 비용도 작음.
  // count() aggregation은 Spark(무료)에서도 쓸 수 있지만 인덱스 요구 + 추가 비용 우려가
  // 있어 표본 기반으로 처리.
  // 반환: { topPct: number(1..100), sampleSize: number } | null
  async function getPercentile(difficulty, score) {
    if (!isReady()) return null;
    try {
      const db = await ensure();
      const col = mod.collection(db, 'leaderboard');
      const q = mod.query(
        col,
        mod.where('difficulty', '==', difficulty),
        mod.orderBy('createdAt', 'desc'),
        mod.limit(200)
      );
      const snap = await mod.getDocs(q);
      const all = snap.docs.map((d) => d.data().score || 0);
      if (all.length === 0) return null;
      const lower = all.filter((s) => s < score).length;
      const ratio = lower / all.length; // 내 점수가 얼마나 위인가
      const topPct = Math.max(1, Math.round((1 - ratio) * 100));
      return { topPct, sampleSize: all.length };
    } catch (e) {
      console.warn('[Cloud] getPercentile failed', e);
      return null;
    }
  }

  return {
    isReady,
    getDeviceId,
    addEntry,
    getTop,
    getPercentile
  };
})();
