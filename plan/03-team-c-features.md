# 🅲 C팀 - 기능/배포팀 상세 플랜

> **한 줄 역할**: 게임의 "양념" — 사운드, 저장, 난이도, 축하 효과, 배포 담당
> **담당 파일**: `js/sound.js`, `js/storage.js`, `js/difficulty.js`, `README.md`, 배포 설정
> **예상 작업 시간**: Day 1 (4시간) + Day 2 (2시간) = **총 6시간**

---

## 📖 비전공자용 안내

C팀은 게임을 "더 재미있고 편리하게" 만드는 양념 역할입니다. C팀이 만드는 것들이 없어도 게임은 돌아가지만, **있으면 훨씬 즐거워지는** 요소들이에요.

- 🔊 카드를 뒤집을 때 "찰칵" 소리
- 💾 최고 점수를 기억해줘서 기록 경쟁 가능
- ⚙️ 쉬움/보통/어려움 세 단계 선택
- 🎊 이겼을 때 색종이가 펑펑 터지는 축하 효과
- 🌐 전 세계 누구나 접속할 수 있게 웹에 올리기

A팀이 "엔진", B팀이 "디자인"이라면 C팀은 **카오디오, 내비게이션, 광택 왁스** 같은 부가 요소입니다. 그리고 최종적으로 **차고에서 도로로 꺼내는** 역할(배포)도 C팀 담당!

---

## 🎯 핵심 책임

1. ✅ 난이도 설정 (쉬움/보통/어려움별 카드 수, 이모지 목록, 제한시간)
2. ✅ LocalStorage 최고 점수 저장/불러오기
3. ✅ 사운드 시스템 (뒤집기/매칭/실패/승리/BGM)
4. ✅ 게임 클리어 컨페티(색종이) 효과
5. ✅ GitHub Pages 배포 설정
6. ✅ README.md 작성
7. ✅ .gitignore 작성
8. ✅ 전체 QA 및 배포

---

## 📂 담당 파일

### `js/difficulty.js` - 난이도 설정
```javascript
const Difficulty = (function() {
  const configs = {
    easy: {
      rows: 3,
      cols: 4,
      timeLimit: 120,  // 초
      emojis: ['🐱', '🐶', '🐰', '🐻', '🐼', '🦊']
    },
    medium: {
      rows: 4,
      cols: 4,
      timeLimit: 180,
      emojis: ['🐱', '🐶', '🐰', '🐻', '🐼', '🦊', '🐸', '🐵']
    },
    hard: {
      rows: 4,
      cols: 6,
      timeLimit: 240,
      emojis: ['🐱', '🐶', '🐰', '🐻', '🐼', '🦊',
               '🐸', '🐵', '🦁', '🐯', '🐨', '🐷']
    }
  };

  function getConfig(level) {
    return { ...configs[level] };  // 복사본 반환 (불변성)
  }

  function getAllLevels() {
    return Object.keys(configs);
  }

  return { getConfig, getAllLevels };
})();
```

### `js/storage.js` - LocalStorage 래퍼
```javascript
const Storage = (function() {
  const PREFIX = 'memoCats_';

  function saveBestScore(difficulty, score) {
    const key = `${PREFIX}best_${difficulty}`;
    const current = getBestScore(difficulty);
    if (score > current) {
      localStorage.setItem(key, String(score));
      return true;  // 신기록!
    }
    return false;
  }

  function getBestScore(difficulty) {
    const key = `${PREFIX}best_${difficulty}`;
    return Number(localStorage.getItem(key)) || 0;
  }

  function getAllBestScores() {
    return {
      easy: getBestScore('easy'),
      medium: getBestScore('medium'),
      hard: getBestScore('hard')
    };
  }

  function isMuted() {
    return localStorage.getItem(`${PREFIX}muted`) === 'true';
  }

  function setMuted(muted) {
    localStorage.setItem(`${PREFIX}muted`, String(muted));
  }

  return { saveBestScore, getBestScore, getAllBestScores, isMuted, setMuted };
})();
```

### `js/sound.js` - 사운드 모듈
```javascript
const Sound = (function() {
  const sounds = {};
  let muted = false;

  // Web Audio API 대신 Audio 객체로 간단히 구현
  function init() {
    const soundFiles = {
      flip: 'assets/sounds/flip.mp3',
      match: 'assets/sounds/match.mp3',
      mismatch: 'assets/sounds/mismatch.mp3',
      win: 'assets/sounds/win.mp3'
    };
    Object.entries(soundFiles).forEach(([key, path]) => {
      sounds[key] = new Audio(path);
      sounds[key].preload = 'auto';
    });
    muted = Storage.isMuted();
  }

  function play(type) {
    if (muted || !sounds[type]) return;
    try {
      sounds[type].currentTime = 0;
      sounds[type].play().catch(() => {});  // 자동재생 정책 대응
    } catch (e) {
      console.warn('Sound play failed', e);
    }
  }

  function toggleMute() {
    muted = !muted;
    Storage.setMuted(muted);
    return muted;
  }

  // A팀 이벤트 구독 → 자동 재생
  function subscribeToGameEvents() {
    document.addEventListener('card:flipped', () => play('flip'));
    document.addEventListener('card:matched', () => play('match'));
    document.addEventListener('card:mismatched', () => play('mismatch'));
    document.addEventListener('game:won', () => play('win'));
  }

  return { init, play, toggleMute, subscribeToGameEvents };
})();
```

### 컨페티 효과 (`sound.js` 또는 별도 `confetti.js`)
```javascript
// game:won 이벤트 수신 → 화면에 색종이 뿌리기
// Canvas에 간단히 원 그려서 떨어뜨리는 애니메이션
function launchConfetti() {
  // 100개의 원을 랜덤 위치/색상/속도로 생성
  // requestAnimationFrame으로 떨어지게 애니메이션
  // 3초 후 자동 정리
}
```

### `README.md` - 프로젝트 소개
```markdown
# 🐱 냥냥 메모리 (Memo Cats)

초등학생을 위한 귀여운 메모리 카드 매칭 게임입니다.

## 🎮 플레이하기
👉 [여기서 바로 플레이](https://YOUR_USERNAME.github.io/web_game/)

## ✨ 특징
- 🟢🟡🔴 3단계 난이도
- 💾 최고 점수 자동 저장
- 🎵 효과음 & 축하 효과
- 📱 PC + 모바일 완벽 지원

## 🕹️ 조작법
- 카드 클릭 → 뒤집기
- 같은 그림 2장을 찾으면 매칭!

## 🛠️ 기술 스택
- HTML5 + CSS3 + Vanilla JavaScript
- LocalStorage (점수 저장)
- GitHub Pages (배포)

## 👥 개발
3개 팀이 병렬로 개발 (A팀: 로직 / B팀: 디자인 / C팀: 기능·배포)
```

### `.gitignore`
```
# 의존성
node_modules/

# 빌드 산출물
dist/
build/

# 에디터
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# 로그
*.log
```

---

## ⏱️ 단계별 작업 순서

### **Day 1 오전 (2시간) - 기반 기능**

#### [C1] difficulty.js 구현 (30분)
- 3개 난이도 설정 객체
- `getConfig()` 함수
- 이모지 목록 선정 (동물 테마 추천)

**결과물**: `Difficulty.getConfig('medium')` → 완전한 설정 객체 반환

#### [C2] storage.js 구현 (45분)
- LocalStorage 래퍼
- 최고 점수 저장/불러오기
- 음소거 상태 저장
- 키 프리픽스 통일 (`memoCats_`)

**결과물**: 브라우저 새로고침 후에도 점수 유지

#### [C3] 사운드 파일 수집 (45분)
- 무료 사운드 사이트: freesound.org, mixkit.co, zapsplat.com
- 필요 사운드: flip, match, mismatch, win
- `assets/sounds/` 폴더에 저장
- 각 파일 100KB 이하로 (로딩 속도)

**결과물**: 4개의 .mp3 파일 준비

---

### **Day 1 오후 (2시간) - 사운드 & 통합**

#### [C4] sound.js 구현 (1시간)
- Audio 객체로 사운드 프리로드
- `play()`, `toggleMute()` 함수
- A팀 이벤트 구독해서 자동 재생
- 음소거 상태 LocalStorage 연동

**결과물**: A팀 로직이 동작하면 자동으로 소리가 남

#### [C5] 음소거 버튼 UI (30분)
- 화면 우상단에 🔊/🔇 토글 버튼 추가
- `Sound.toggleMute()` 호출
- B팀과 협의해서 위치 조정

#### [C6] 최고점 저장 연동 (30분)
- `game:won` 이벤트 수신
- `Storage.saveBestScore()` 호출
- 종료 화면에 최고 점수 표시 (B팀 UI와 협업)

---

### **Day 2 오전 (1.5시간) - 축하 효과**

#### [C7] 컨페티(색종이) 효과 (1시간)
- `<canvas>` 추가 (전체 화면 고정)
- 100~150개 파티클 생성
- 랜덤 색상/속도/회전
- `requestAnimationFrame` 애니메이션
- 3초 후 자동 정리
- `game:won` 수신 시 실행

#### [C8] 신기록 뱃지 (30분)
- `saveBestScore()`가 `true` 반환 시 (신기록)
- 종료 화면에 "🏆 신기록!" 표시
- 특별 애니메이션

---

### **Day 2 오후 (1시간) - 배포**

#### [C9] 최종 QA (30분)
- 모든 난이도 플레이 테스트
- 사운드 정상 재생
- 모바일 음소거 기본값 체크 (자동재생 정책)
- Chrome/Edge/Safari 호환성
- 콘솔 에러 확인

#### [C10] GitHub 배포 (30분)
1. GitHub에 새 저장소 생성 (public)
2. `git remote add origin <URL>`
3. `git push -u origin master`
4. GitHub 저장소 → Settings → Pages
5. Source: `master` branch, `/` (root) 선택
6. 1~2분 후 `https://USERNAME.github.io/web_game/` 접속 가능
7. URL을 README에 업데이트

---

## 🧪 C팀 자체 테스트 체크리스트

### 기능 테스트
- [ ] 쉬움/보통/어려움 각각 올바른 설정 반환
- [ ] 최고 점수가 브라우저 새로고침 후 유지됨
- [ ] 신기록 달성 시 뱃지 표시
- [ ] 모든 사운드가 정상 재생
- [ ] 음소거 버튼이 동작하고 상태가 저장됨
- [ ] 게임 클리어 시 컨페티가 3초간 재생
- [ ] 모바일에서 사운드 정책 정상 대응

### 배포 체크리스트
- [ ] `.gitignore` 올바르게 작성
- [ ] GitHub에 푸시 완료
- [ ] GitHub Pages 활성화
- [ ] 공개 URL에서 정상 동작
- [ ] README에 URL 포함
- [ ] 모바일에서 공개 URL 접속 테스트

---

## 🔗 다른 팀과의 연결점

| 항목 | 상대팀 | 내용 |
|:---|:---:|:---|
| 난이도 설정 제공 | 🅰️ A팀 | `Difficulty.getConfig()` 호출로 카드 생성 |
| 최고점 저장 | 🅰️ A팀 | `game:won` 이벤트 수신하여 처리 |
| 사운드 트리거 | 🅰️ A팀 | 모든 `card:*`, `game:*` 이벤트 수신 |
| 음소거 버튼 위치 | 🅱️ B팀 | 헤더 또는 우상단 고정 위치 협의 |
| 컨페티 캔버스 | 🅱️ B팀 | 전체 화면 덮지만 포인터 이벤트는 통과 |
| 종료 화면 최고점 | 🅱️ B팀 | `#best-score` 요소에 값 업데이트 |

---

## 💡 C팀 기술 팁

### 브라우저 자동재생 정책 대응
```javascript
// 모바일 브라우저는 사용자 상호작용 전에 소리가 안 남
// 첫 클릭 시 '더미 재생'으로 잠금 해제
document.addEventListener('click', function unlock() {
  Object.values(sounds).forEach(s => {
    s.play().then(() => s.pause()).catch(() => {});
    s.currentTime = 0;
  });
  document.removeEventListener('click', unlock);
}, { once: true });
```

### 컨페티 파티클 (초간단 버전)
```javascript
function createConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:9999';
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const colors = ['#FF6B9D','#6BC5FF','#FFD93D','#81E979','#B39DFF'];
  const particles = Array.from({length: 120}, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    vy: 2 + Math.random() * 3,
    vx: -2 + Math.random() * 4,
    size: 6 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI
  }));

  const start = Date.now();
  (function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += 0.1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      ctx.restore();
    });
    if (Date.now() - start < 3000) requestAnimationFrame(loop);
    else canvas.remove();
  })();
}
```

### GitHub Pages 배포 (CLI 순서)
```bash
# 1. GitHub에서 새 저장소 생성 (웹에서)
# 2. 로컬에서 원격 추가
git remote add origin https://github.com/USERNAME/web_game.git
git branch -M main
git add .
git commit -m "첫 배포"
git push -u origin main

# 3. GitHub 웹에서:
#    Settings → Pages → Source: main branch, / (root)
#    → Save 후 1~2분 대기
# 4. https://USERNAME.github.io/web_game/ 접속
```

### 무료 사운드 리소스
- **mixkit.co/free-sound-effects/game** — 게임 효과음 전용, 무료
- **freesound.org** — 방대, CC 라이선스 (출처 표시)
- **zapsplat.com** — 회원가입 필요, 무료
- 추천 키워드: "card flip", "pop", "success", "fail", "fanfare"
