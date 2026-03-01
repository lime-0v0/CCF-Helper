// =============================================
// CcfoliaHelper - inject.js
// world: "MAIN", run_at: "document_start"
// Firebase보다 먼저 실행 → 토큰 캡처 + Firestore REST API 쓰기
// =============================================
(function () {
  "use strict";

  let authToken = null;

  // ── 1. localStorage에서 Firebase 토큰 취득 (v8) ───────────────────────
  function tryLocalStorage() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith("firebase:authUser:")) continue;
        const data = JSON.parse(localStorage.getItem(key) ?? "null");
        const token = data?.stsTokenManager?.accessToken;
        if (token) { authToken = token; return true; }
      }
    } catch (_) {}
    return false;
  }

  // ── 2. IndexedDB에서 Firebase 토큰 취득 (v9) ─────────────────────────
  function tryIndexedDB() {
    try {
      const req = indexedDB.open("firebaseLocalStorageDb");
      req.onsuccess = (e) => {
        try {
          const db = e.target.result;
          if (!db.objectStoreNames.contains("firebaseLocalStorage")) return;
          const store = db.transaction("firebaseLocalStorage", "readonly").objectStore("firebaseLocalStorage");
          store.getAll().onsuccess = (ev) => {
            for (const item of ev.target.result ?? []) {
              const token = item?.value?.stsTokenManager?.accessToken;
              if (token) { authToken = token; return; }
            }
          };
        } catch (_) {}
      };
    } catch (_) {}
  }

  // ── 3. Firebase v8 전역 (window.firebase) ───────────────────────────
  function tryFirebaseV8() {
    try {
      const user = window.firebase?.auth?.()?.currentUser;
      if (user?.getIdToken) {
        user.getIdToken().then((t) => { authToken = t; }).catch(() => {});
        return true;
      }
    } catch (_) {}
    return false;
  }

  // ── 4. fetch 인터셉터 (document_start → Firebase보다 먼저 설치됨) ──────
  const _fetch = window.fetch;
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : (input?.url ?? "");

    // 요청 헤더에서 Bearer 토큰 캡처
    if (url.includes("googleapis.com")) {
      const h = init?.headers;
      if (h) {
        const auth = typeof h.get === "function"
          ? h.get("Authorization")
          : (h["Authorization"] ?? h["authorization"]);
        if (auth?.startsWith("Bearer ")) authToken = auth.slice(7);
      }
    }

    const resp = await _fetch.apply(this, arguments);

    // securetoken.googleapis.com 갱신 응답에서 ID 토큰 캡처
    if (url.includes("securetoken.googleapis.com")) {
      try {
        resp.clone().json().then((d) => {
          if (d.id_token) authToken = d.id_token;
          else if (d.access_token) authToken = d.access_token;
        }).catch(() => {});
      } catch (_) {}
    }

    return resp;
  };

  // ── 5. XHR 인터셉터 (Firebase BrowserChannel은 XHR 사용) ─────────────
  const _xhrOpen = XMLHttpRequest.prototype.open;
  const _xhrSetHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__helperUrl = String(url ?? "");
    return _xhrOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (
      this.__helperUrl?.includes("googleapis.com") &&
      name.toLowerCase() === "authorization" &&
      value?.startsWith("Bearer ")
    ) {
      authToken = value.slice(7);
    }
    return _xhrSetHeader.apply(this, arguments);
  };

  // 초기 토큰 취득 시도 (페이지 로드 시 이미 인증 상태인 경우)
  tryLocalStorage();
  tryIndexedDB();
  // Firebase 앱 초기화 완료 후 재시도
  setTimeout(() => { if (!authToken) tryFirebaseV8(); }, 1000);
  setTimeout(() => { if (!authToken) { tryFirebaseV8(); tryLocalStorage(); } }, 3000);

  // ── 메시지 수신: content script → inject.js ──────────────────────────
  window.addEventListener("message", async (event) => {
    if (event.source !== window) return;
    if (!event.data?.__ccfoliaHelper) return;
    if (event.data.action !== "CREATE_ITEM") return;

    const { requestId, roomId, itemData } = event.data;

    // 최신 토큰으로 갱신 시도
    await new Promise((resolve) => {
      try {
        const user = window.firebase?.auth?.()?.currentUser;
        if (user?.getIdToken) {
          user.getIdToken().then((t) => { authToken = t; resolve(); }).catch(resolve);
        } else {
          resolve();
        }
      } catch (_) { resolve(); }
    });

    if (!authToken) {
      window.postMessage({ __ccfoliaHelper: true, action: "CREATE_RESULT", requestId, success: false, error: "AUTH_TOKEN_NOT_CAPTURED" }, "*");
      return;
    }

    try {
      const result = itemData.type === "marker"
        ? await firestoreUpsertMarker(roomId, itemData)
        : await firestoreCreateScreen(roomId, itemData);
      window.postMessage({ __ccfoliaHelper: true, action: "CREATE_RESULT", requestId, success: true, docId: result.name }, "*");
    } catch (e) {
      window.postMessage({ __ccfoliaHelper: true, action: "CREATE_RESULT", requestId, success: false, error: e.message }, "*");
    }
  });

  // ── Firestore REST API: 마커 생성 (room 문서의 markers 맵 PATCH) ──────
  async function firestoreUpsertMarker(roomId, d) {
    const markerId = Math.random().toString(36).slice(2, 13);
    const now = Date.now();
    const base = `https://firestore.googleapis.com/v1/projects/ccfolia-160aa/databases/(default)/documents/rooms/${encodeURIComponent(roomId)}`;
    const url = `${base}?updateMask.fieldPaths=markers.${markerId}&updateMask.fieldPaths=updatedAt`;

    const markerFields = {
      text:    { stringValue: d.memo },
      width:   { integerValue: String(d.width) },
      height:  { integerValue: String(d.height) },
      z:       { integerValue: String(d.overlapPriority ?? 1) },
      locked:  { booleanValue: d.fixedPlacement ?? false },
      freezed: { booleanValue: d.fixedSize ?? false },
    };

    if (d.clickAction === "sendToChat") {
      markerFields.clickAction = { mapValue: { fields: {
        type: { stringValue: "message" },
        text: { stringValue: d.clickActionText ?? "" },
      }}};
    }

    const body = {
      fields: {
        markers: { mapValue: { fields: { [markerId]: { mapValue: { fields: markerFields } } } } },
        updatedAt: { integerValue: String(now) },
      },
    };

    const resp = await _fetch(url, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${authToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`Firestore ${resp.status}: ${await resp.text()}`);
    return resp.json();
  }

  // ── Firestore REST API: 스크린 패널 생성 (items 서브컬렉션 POST) ──────
  async function firestoreCreateScreen(roomId, d) {
    const url = `https://firestore.googleapis.com/v1/projects/ccfolia-160aa/databases/(default)/documents/rooms/${encodeURIComponent(roomId)}/items`;
    const now = Date.now();

    const fields = {
      x:             { integerValue: "0" },
      y:             { integerValue: "0" },
      z:             { integerValue: String(d.overlapPriority ?? 1) },
      angle:         { integerValue: "0" },
      width:         { integerValue: String(d.width) },
      height:        { integerValue: String(d.height) },
      locked:        d.fixedPlacement ? { booleanValue: true } : { nullValue: "NULL_VALUE" },
      deckId:        { nullValue: "NULL_VALUE" },
      active:        { booleanValue: true },
      closed:        { booleanValue: false },
      withoutOwner:  { booleanValue: false },
      freezed:       { booleanValue: d.fixedSize ?? false },
      type:          { stringValue: "object" },
      ownerColor:    { nullValue: "NULL_VALUE" },
      ownerName:     { nullValue: "NULL_VALUE" },
      memo:          { stringValue: d.memo },
      imageUrl:      { nullValue: "NULL_VALUE" },
      coverImageUrl: { nullValue: "NULL_VALUE" },
      clickAction:   d.clickAction === "sendToChat"
        ? { mapValue: { fields: {
            type: { stringValue: "message" },
            text: { stringValue: d.clickActionText ?? "" },
          }}}
        : { nullValue: "NULL_VALUE" },
      order:         { integerValue: String(now) },
      createdAt:     { integerValue: String(now) },
      updatedAt:     { integerValue: String(now) },
    };

    if (d.asPlanePanel) fields.asPlanePanel = { booleanValue: true };

    const resp = await _fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${authToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
    if (!resp.ok) throw new Error(`Firestore ${resp.status}: ${await resp.text()}`);
    return resp.json();
  }

  console.log("[CcfoliaHelper] inject.js 로드 완료 ✅");
})();
