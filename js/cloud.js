// ============================================================
// Cloud Module — Firestore 글로벌 리더보드
//
// 단일 책임: Firebase Web SDK v10 modular을 동적으로 import해
// 글로벌 리더보드의 read/write를 제공.
//
// 컬렉션:
//   leaderboard         — classic 모드 기록 (난이도별)
//   leaderboard_daily   — 일일 챌린지 기록 (dateKey YYYY-MM-DD별)
//
// versus 모드는 글로벌 저장 안 함(로컬 재미용).
// ============================================================

const Cloud = (function () {
  let dbPromise = null;
  let mod = null;

  function isReady() { return !!window.FIREBASE_READY; }

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

  // ====== 디바이스 ID ======
  const DEVICE_KEY = 'memoCats_deviceId';
  function getDeviceId() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      try { localStorage.setItem(DEVICE_KEY, id); } catch {}
    }
    return id;
  }

  // ====== 오늘 날짜 키 (KST YYYY-MM-DD) ======
  // 한국 시간(UTC+9, DST 없음) 기준으로 자정에 초기화. 타깃 사용자가 한국이라
  // 일일 챌린지 보드/리더보드가 한국 자정에 함께 갱신되는 게 자연스럽다.
  function todayKey() {
    const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // ====== 클라이언트 IP 페치 ======
  // 외부 API(api.ipify.org)에서 공인 IP 1회 페치 후 세션 캐시.
  // 실패하면 빈 문자열. 클라이언트가 보내는 값이라 위변조 가능 — 정확한 IP
  // 검증은 서버 없이는 불가. 어린이 게임 맥락에선 신뢰 신호로 보지 말고
  // 닉네임 옆 partial 표시용 메타데이터로만 활용.
  let cachedIp = null;
  async function getClientIp() {
    if (cachedIp !== null) return cachedIp;
    try {
      const res = await fetch('https://api.ipify.org?format=json', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) { cachedIp = ''; return ''; }
      const data = await res.json();
      cachedIp = String(data.ip || '').slice(0, 45); // IPv6 max 39 + 여유
      return cachedIp;
    } catch {
      cachedIp = '';
      return '';
    }
  }

  // 사용자 지역코드 (KR, US, JP, ...). navigator.language의 BCP47 region 부분 추출.
  // "ko-KR" → "KR" / "en-US" → "US" / "zh-Hans-CN" → "CN" / "ko" → "" (region 없음)
  // 빈 문자열로 저장되면 표시 시 기본 태극기로 폴백.
  function getCountryCode() {
    try {
      const lang = (typeof navigator !== 'undefined' && navigator.language) || '';
      const parts = lang.split('-');
      for (let i = 1; i < parts.length; i++) {
        const p = parts[i];
        if (p.length === 2 && /^[a-zA-Z]{2}$/.test(p)) {
          return p.toUpperCase();
        }
      }
      return '';
    } catch { return ''; }
  }

  // 사용자 로컬 타임존에서 "00:00 KST"가 몇 시인지 한/영 라벨로 반환.
  // KST=UTC+9 고정이라 항상 15:00 UTC = 00:00 KST.
  function getDailyResetInfo() {
    const sample = new Date();
    sample.setUTCHours(15, 0, 0, 0);
    let tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch {}
    const isKST = tz === 'Asia/Seoul';
    const ko = sample.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true });
    const en = sample.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return { isKST, koLocal: ko, enLocal: en };
  }

  // ====== 기록 추가 ======
  // entry: { mode, difficulty, name, score, time, moves, dateKey? }
  async function addEntry(entry) {
    if (!isReady()) return { ok: false, reason: 'not_configured' };
    const mode = entry.mode || 'classic';
    if (mode === 'versus') return { ok: false, reason: 'versus_local_only' };

    try {
      const db = await ensure();
      const collectionName =
        (mode === 'daily') ? 'leaderboard_daily' :
        (mode === 'timeattack') ? 'leaderboard_timeattack' :
        'leaderboard';
      const col = mod.collection(db, collectionName);

      // IP 페치 (실패해도 빈 문자열로 진행 — 차단 X)
      const ip = await getClientIp();

      const doc = {
        difficulty: String(entry.difficulty || 'medium'),
        name: String(entry.name || '익명').slice(0, 12),
        score: Number(entry.score) || 0,
        time: Number(entry.time) || 0,
        moves: Number(entry.moves) || 0,
        deviceId: getDeviceId(),
        country: getCountryCode(),
        ip: ip,
        createdAt: mod.serverTimestamp()
      };
      if (mode === 'daily') {
        doc.dateKey = entry.dateKey || todayKey();
      }
      if (mode === 'timeattack') {
        doc.boardsCleared = Number(entry.boardsCleared) || 0;
      }
      const ref = await mod.addDoc(col, doc);
      return { ok: true, id: ref.id };
    } catch (e) {
      console.warn('[Cloud] addEntry failed', e);
      return { ok: false, reason: 'error', error: e };
    }
  }

  // ====== Classic 기록 TOP N (기존) ======
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
      return snap.docs.map(d => mapDoc(d, me));
    } catch (e) {
      console.warn('[Cloud] getTop failed', e);
      return [];
    }
  }

  // ====== TimeAttack 기록 TOP N ======
  async function getTimeAttackTop(limitN = 10) {
    if (!isReady()) return [];
    try {
      const db = await ensure();
      const col = mod.collection(db, 'leaderboard_timeattack');
      const q = mod.query(
        col,
        mod.orderBy('score', 'desc'),
        mod.orderBy('time', 'asc'),
        mod.orderBy('moves', 'asc'),
        mod.limit(limitN)
      );
      const snap = await mod.getDocs(q);
      const me = getDeviceId();
      return snap.docs.map(d => mapDoc(d, me));
    } catch (e) {
      console.warn('[Cloud] getTimeAttackTop failed', e);
      return [];
    }
  }

  // ====== Daily 기록 TOP N — 오늘 날짜 기준 ======
  async function getDailyTop(limitN = 10, dateKey) {
    if (!isReady()) return [];
    const key = dateKey || todayKey();
    try {
      const db = await ensure();
      const col = mod.collection(db, 'leaderboard_daily');
      const q = mod.query(
        col,
        mod.where('dateKey', '==', key),
        mod.orderBy('score', 'desc'),
        mod.orderBy('time', 'asc'),
        mod.orderBy('moves', 'asc'),
        mod.limit(limitN)
      );
      const snap = await mod.getDocs(q);
      const me = getDeviceId();
      return snap.docs.map(d => mapDoc(d, me));
    } catch (e) {
      console.warn('[Cloud] getDailyTop failed', e);
      return [];
    }
  }

  function mapDoc(d, me) {
    const x = d.data();
    return {
      id: d.id,
      name: x.name || '익명',
      score: x.score || 0,
      time: x.time || 0,
      moves: x.moves || 0,
      boardsCleared: x.boardsCleared || 0,
      country: x.country || '',
      ip: x.ip || '',
      deviceId: x.deviceId,
      dateKey: x.dateKey,
      isMe: x.deviceId === me
    };
  }

  // ====== 실시간 구독 (Classic) ======
  // onUpdate(list): 변경 시 호출. 반환값 unsubscribe 함수.
  // 실패 시 unsubscribe는 noop. 호출자가 폴백을 할 수 있게 ok 플래그도 같이.
  async function subscribeTop(difficulty, limitN, onUpdate) {
    if (!isReady()) return () => {};
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
      const me = getDeviceId();
      const unsub = mod.onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => mapDoc(d, me));
        onUpdate(list);
      }, (err) => {
        console.warn('[Cloud] subscribeTop error', err);
      });
      return unsub;
    } catch (e) {
      console.warn('[Cloud] subscribeTop failed', e);
      return () => {};
    }
  }

  // ====== 실시간 구독 (TimeAttack) ======
  async function subscribeTimeAttackTop(limitN, onUpdate) {
    if (!isReady()) return () => {};
    try {
      const db = await ensure();
      const col = mod.collection(db, 'leaderboard_timeattack');
      const q = mod.query(
        col,
        mod.orderBy('score', 'desc'),
        mod.orderBy('time', 'asc'),
        mod.orderBy('moves', 'asc'),
        mod.limit(limitN)
      );
      const me = getDeviceId();
      const unsub = mod.onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => mapDoc(d, me));
        onUpdate(list);
      }, (err) => {
        console.warn('[Cloud] subscribeTimeAttackTop error', err);
      });
      return unsub;
    } catch (e) {
      console.warn('[Cloud] subscribeTimeAttackTop failed', e);
      return () => {};
    }
  }

  // ====== 실시간 구독 (Daily) ======
  async function subscribeDailyTop(limitN, onUpdate, dateKey) {
    if (!isReady()) return () => {};
    const key = dateKey || todayKey();
    try {
      const db = await ensure();
      const col = mod.collection(db, 'leaderboard_daily');
      const q = mod.query(
        col,
        mod.where('dateKey', '==', key),
        mod.orderBy('score', 'desc'),
        mod.orderBy('time', 'asc'),
        mod.orderBy('moves', 'asc'),
        mod.limit(limitN)
      );
      const me = getDeviceId();
      const unsub = mod.onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => mapDoc(d, me));
        onUpdate(list);
      }, (err) => {
        console.warn('[Cloud] subscribeDailyTop error', err);
      });
      return unsub;
    } catch (e) {
      console.warn('[Cloud] subscribeDailyTop failed', e);
      return () => {};
    }
  }

  // ====== 백분위 추정 (classic) ======
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
      const all = snap.docs.map(d => d.data().score || 0);
      if (all.length === 0) return null;
      const lower = all.filter(s => s < score).length;
      const ratio = lower / all.length;
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
    todayKey,
    getDailyResetInfo,
    getCountryCode,
    addEntry,
    getTop,
    getDailyTop,
    getTimeAttackTop,
    getPercentile,
    subscribeTop,
    subscribeDailyTop,
    subscribeTimeAttackTop
  };
})();
