// ============================================================
// Firebase 설정 — 글로벌 리더보드 백엔드
//
// 사용법:
//   1) https://console.firebase.google.com 에서 프로젝트 생성
//   2) Firestore Database 활성화 (asia-northeast3 권장)
//   3) 웹 앱 등록 후 받은 firebaseConfig 객체로 아래 값 교체
//   4) (선택) Firestore 보안 규칙은 README의 가이드 참고
//
// 키 미설정 상태에서도 게임은 정상 작동하며, 글로벌 리더보드만
// 비활성화되고 "준비 중" 안내가 표시됩니다.
// ============================================================

window.FIREBASE_CONFIG = {
  apiKey:            "REPLACE_ME",
  authDomain:        "REPLACE_ME",
  projectId:         "REPLACE_ME",
  storageBucket:     "REPLACE_ME",
  messagingSenderId: "REPLACE_ME",
  appId:             "REPLACE_ME"
};

window.FIREBASE_READY = !Object.values(window.FIREBASE_CONFIG).some(
  (v) => !v || v === "REPLACE_ME"
);
