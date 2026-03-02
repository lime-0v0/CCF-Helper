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

  // ── 우클릭 패널 데이터 캐시 (React fiber 추출) ──────────────────────────
  let _contextPanelCache = null;
  let _cachedReduxStore  = null; // Redux store 캐시 (fiber walk 중 발견 시 저장)

  document.addEventListener("contextmenu", (e) => {
    _contextPanelCache = null;
    try {
      console.log("[CCFHelper:ctx] contextmenu target:", e.target.tagName, e.target.className?.slice?.(0, 60));

      // 1차: 이벤트 타겟에서 직접 추출
      let data = _extractPanelFromEl(e.target);

      // 2차: elementsFromPoint — 뒷면 등 오버레이가 e.target을 가릴 때
      if (!data && document.elementsFromPoint) {
        const els = document.elementsFromPoint(e.clientX, e.clientY);
        for (const el of els) {
          if (el === e.target || el === document.body || el === document.documentElement) continue;
          data = _extractPanelFromEl(el);
          if (data) {
            console.log("[CCFHelper:ctx] elementsFromPoint hit:", el.tagName, String(el.className).slice(0, 40));
            break;
          }
        }
      }

      // 3차: .movable 요소를 좌표 기반 hit-test — 뒷면 포탈 오버레이 케이스
      // (오버레이가 .movable DOM 트리 밖에 렌더링되어 elementsFromPoint가 .movable을 반환 못할 때)
      if (!data) {
        const movables = document.querySelectorAll(".movable");
        for (const movable of movables) {
          const rect = movable.getBoundingClientRect();
          if (e.clientX >= rect.left && e.clientX <= rect.right &&
              e.clientY >= rect.top  && e.clientY <= rect.bottom) {
            // 먼저 DOM 속성(aria-label 등)에서 추출 시도
            data = _extractFromDom(movable);
            if (!data) {
              // DOM 실패 시 fiber walk 시도 (aria-label이 빈 뒷면 케이스)
              // .movable 자체의 fiber.return을 통해 패널 컴포넌트까지 올라감
              data = _extractPanelFromEl(movable);
            }
            if (data) {
              console.log("[CCFHelper:ctx] .movable hit-test success:", data.memo?.slice(0, 20));
              break;
            }
          }
        }
      }

      // 4차: Redux store에서 직접 패널 탐색
      // (1~3차 모두 실패 시 — 뒷면 포탈이 Room 레벨 렌더링이라 fiber chain에 패널 컴포넌트 없음)
      // 1차 fiber walk에서 Redux Provider fiber를 통과하며 _cachedReduxStore가 이미 세팅됨
      if (!data && _cachedReduxStore) {
        data = _findPanelInRedux(e.clientX, e.clientY);
      }

      _contextPanelCache = data;
      console.log("[CCFHelper:ctx] cache result:", _contextPanelCache);
    } catch (err) {
      console.warn("[CCFHelper:ctx] extraction error:", err);
    }
  }, true);

  function _extractPanelFromEl(el) {
    // ── 1차: DOM 속성에서 직접 읽기 ─────────────────────────────────────
    const domResult = _extractFromDom(el);
    if (domResult) return domResult;

    // ── 2차: React fiber fallback (기존 코드) ───────────────────────────
    let node = el;
    let domDepth = 0;
    while (node && node !== document.documentElement) {
      const result = _tryFiber(node, domDepth);
      if (result) return result;
      node = node.parentElement;
      domDepth++;
    }
    console.warn("[CCFHelper:ctx] DOM depth exhausted at", domDepth, "levels — no panel found");
    return null;
  }

  /** DOM 속성 직접 추출 (ccfolia가 aria-label / style에 데이터를 노출함) */
  function _extractFromDom(el) {
    let text = "";
    let movableEl = null;
    let isScreen = false;

    // non-empty aria-label을 가진 첫 요소의 값 반환
    function _firstLabel(root) {
      for (const c of root.querySelectorAll("[aria-label]")) {
        const v = c.getAttribute("aria-label") || "";
        if (v) return v;
      }
      return "";
    }

    // ─── 1차: data-dragging 컨테이너 → 스크린 패널
    let panelEl = el;
    for (let i = 0; i < 12 && panelEl && panelEl !== document.documentElement; i++) {
      if (panelEl.dataset && panelEl.dataset.dragging !== undefined) break;
      panelEl = panelEl.parentElement;
    }
    if (panelEl && panelEl.dataset?.dragging !== undefined) {
      isScreen = true;
      text = panelEl.getAttribute("aria-label") || "";
      movableEl = panelEl.closest?.(".movable");
      // 뒷면 등에서 aria-label이 비어있으면 .movable 내 non-empty 값 탐색
      if (!text && movableEl) text = _firstLabel(movableEl);
    }

    // ─── 2차: .movable 조상(또는 자기 자신) 탐색 → 마커/스크린 패널
    if (!text) {
      let node = el;
      for (let i = 0; i < 12 && node && node !== document.documentElement; i++) {
        if (node.classList?.contains("movable")) break;
        node = node.parentElement;
      }
      if (node?.classList?.contains("movable")) {
        movableEl = node;
        // 스크린 패널: .movable 안에 [data-dragging] 자식이 있으면 스크린
        const dataDraggingChild = movableEl.querySelector("[data-dragging]");
        if (dataDraggingChild) {
          isScreen = true;
          text = dataDraggingChild.getAttribute("aria-label") || "";
        }
        // 마커 패널 (또는 스크린에서 aria-label 못 찾은 경우)
        if (!text) {
          const draggable = movableEl.querySelector('[aria-roledescription="draggable"]');
          const labelEl = draggable?.querySelector("[aria-label]") ?? movableEl.querySelector("[aria-label]");
          text = labelEl?.getAttribute("aria-label") || "";
          if (!text) text = _firstLabel(movableEl);
        }
      }
    }

    if (!text || !movableEl) return null;

    // imageUrl: 패널 안의 img 태그
    const imgs = movableEl.querySelectorAll("img");
    const imageUrl = imgs[0]?.src || undefined;

    // width / height / z: .movable 인라인 style
    const width  = parseFloat(movableEl.style.width)  || 0;
    const height = parseFloat(movableEl.style.height) || 0;
    const z      = parseInt(movableEl.style.zIndex)   || 1;

    const PX_PER_GRID = 24;
    const result = {
      type: isScreen ? "screen" : "marker",
      memo: text,
      width:           width  ? Math.round(width  / PX_PER_GRID) : (isScreen ? 4 : 2),
      height:          height ? Math.round(height / PX_PER_GRID) : (isScreen ? 4 : 2),
      overlapPriority: z,
      fixedPlacement:  false,
      fixedSize:       false,
      clickAction:     "none",
    };
    if (isScreen) result.asPlanePanel = false;
    if (imageUrl) result.imageUrl = imageUrl;

    console.log("[CCFHelper:ctx] DOM extraction success:", result);
    return result;
  }

  function _tryFiber(el, domDepth) {
    const key = Object.keys(el).find(k =>
      k.startsWith("__reactFiber") || k.startsWith("__reactInternalInstance")
    );
    if (!key) {
      if (domDepth < 6) console.log(`[CCFHelper:fiber] dom=${domDepth} NO fiber key (${el.tagName}.${String(el.className).slice(0,30)})`);
      return null;
    }
    let fiber = el[key];
    let fiberCount = 0;
    for (let i = 0; fiber && i < 80; i++, fiber = fiber.return) {
      fiberCount++;
      const props = fiber.memoizedProps;

      // ── props 전체 덤프 (처음 20 레벨) ──
      if (i < 20 && props && typeof props === "object") {
        const keys = Object.keys(props);
        const sample = {};
        for (const k of keys.slice(0, 8)) {
          const v = props[k];
          sample[k] = typeof v === "string" ? v.slice(0, 30)
                    : (v && typeof v === "object") ? `{${Object.keys(v).slice(0,4).join(",")}}`
                    : v;
        }
        console.log(`[CCFHelper:fiber] dom=${domDepth} f=${i} [${keys.slice(0,10).join(",")}]`, sample);
      }

      // ── Redux Provider 감지 → store 캐시 ──────────────────────────────
      // fiber chain에는 항상 Redux Provider가 포함되므로 한 번만 캐시하면 됨
      if (!_cachedReduxStore) {
        const val = fiber.memoizedProps?.value;
        if (val?.store?.getState) {
          _cachedReduxStore = val.store;
          console.log("[CCFHelper:redux] Redux store cached ✓");
        }
      }

      // ── memoizedState 덤프 + 매칭 (hook state / Redux useSelector 결과) ──
      // ccfolia는 useSelector로 Redux에서 패널 데이터를 가져오므로
      // memoizedProps가 아닌 memoizedState(hook state)에 데이터가 있을 수 있음
      {
        let hs = fiber.memoizedState;
        let hi = 0;
        while (hs && hi < 8) {
          const sv = hs.memoizedState;
          if (sv && typeof sv === "object" && !Array.isArray(sv)) {
            const skeys = Object.keys(sv);
            if (i < 20 && skeys.length > 1) {
              console.log(`[CCFHelper:hookState] dom=${domDepth} f=${i} hook=${hi} [${skeys.slice(0,8).join(",")}]`, sv);
            }
            // memoizedState 값도 패널 데이터로 매칭 시도
            const r = _matchProps(sv, domDepth, i);
            if (r) return r;
          }
          hs = hs.next; hi++;
        }
      }

      if (!props || typeof props !== "object") continue;
      const r = _matchProps(props, domDepth, i);
      if (r) return r;
    }
    if (domDepth < 4) console.log(`[CCFHelper:fiber] dom=${domDepth} done — ${fiberCount} fibers, no match`);
    return null;
  }

  function _matchProps(props, domDepth, fiberDepth) {
    if (!props || typeof props !== "object" || Array.isArray(props)) return null;
    // Marker: Firestore field name "text" = 메모 내용
    if (typeof props.text === "string" && props.text.trim() &&
        props.width != null && props.height != null &&
        props.z != null) {
      console.log(`[CCFHelper:match] MARKER hit at dom=${domDepth} fiber=${fiberDepth}`, props);
      return _buildData("marker", props.text, props);
    }
    // Screen: "memo" 필드 + type === "object"
    if (typeof props.memo === "string" && props.memo.trim() &&
        props.width != null && props.height != null) {
      console.log(`[CCFHelper:match] SCREEN hit at dom=${domDepth} fiber=${fiberDepth}`, props);
      return _buildData("screen", props.memo, props);
    }
    // 중첩 객체 탐색 ("current" = useRef hook state 대응)
    for (const k of ["marker", "item", "panel", "data", "value", "current"]) {
      const v = props[k];
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const r = _matchProps(v, domDepth, fiberDepth);
        if (r) return r;
      }
    }
    return null;
  }

  /** Redux store에서 패널 객체를 탐색해 _buildData로 반환 */
  function _findPanelInRedux(clientX, clientY) {
    if (!_cachedReduxStore) return null;
    try {
      const state = _cachedReduxStore.getState();

      // 클릭 좌표에 해당하는 .movable 찾기
      let targetMovable = null;
      for (const mv of document.querySelectorAll(".movable")) {
        const r = mv.getBoundingClientRect();
        if (clientX >= r.left && clientX <= r.right &&
            clientY >= r.top  && clientY <= r.bottom) {
          targetMovable = mv; break;
        }
      }

      // .movable 식별 정보 (imageUrl, 크기, z)
      const PX_PER_GRID = 24;
      const imgSrc = targetMovable?.querySelector("img")?.src || "";
      const gw = targetMovable ? Math.round((parseFloat(targetMovable.style.width)  || 0) / PX_PER_GRID) : 0;
      const gh = targetMovable ? Math.round((parseFloat(targetMovable.style.height) || 0) / PX_PER_GRID) : 0;
      const gz = targetMovable ? (parseInt(targetMovable.style.zIndex) || 1) : 1;

      // Redux state에서 패널 객체 재귀 수집 (depth 5, 순환참조 없는 JSON state 가정)
      const panels = [];
      const _seen = new Set();
      function collectPanels(obj, depth) {
        if (depth > 5 || !obj || typeof obj !== "object" || _seen.has(obj)) return;
        _seen.add(obj);
        if (Array.isArray(obj)) { for (const v of obj) collectPanels(v, depth + 1); return; }
        if (typeof obj.memo === "string" && obj.memo.trim() && obj.width != null && obj.height != null) {
          panels.push(obj); return;
        }
        for (const v of Object.values(obj)) {
          if (v && typeof v === "object") collectPanels(v, depth + 1);
        }
      }
      collectPanels(state, 0);

      console.log("[CCFHelper:redux] panels:", panels.length,
        "| imgSrc:", imgSrc.slice(0, 60), "| size:", gw, "×", gh, "z:", gz);

      if (panels.length === 0) return null;

      // 1순위: imageUrl / coverImageUrl 매칭 (가장 정확)
      if (imgSrc) {
        const byImg = panels.find(p => p.imageUrl === imgSrc || p.coverImageUrl === imgSrc);
        if (byImg) {
          console.log("[CCFHelper:redux] matched by imageUrl:", byImg.memo);
          return _buildData("screen", byImg.memo, byImg);
        }
      }
      // 2순위: width × height × z 단독 후보
      const bySize = gw > 0
        ? panels.filter(p => p.width === gw && p.height === gh && (p.z === gz || p.overlapPriority === gz))
        : [];
      if (bySize.length === 1) {
        console.log("[CCFHelper:redux] matched by size:", bySize[0].memo);
        return _buildData("screen", bySize[0].memo, bySize[0]);
      }
      console.log("[CCFHelper:redux] no unique match — by-size candidates:", bySize.length);
    } catch (err) {
      console.warn("[CCFHelper:redux] lookup error:", err);
    }
    return null;
  }

  function _buildData(type, memo, props) {
    const d = {
      type,
      memo: String(memo),
      width:           Number(props.width)  || (type === "screen" ? 4 : 2),
      height:          Number(props.height) || (type === "screen" ? 4 : 2),
      overlapPriority: Number(props.z ?? props.overlapPriority ?? 1),
      fixedPlacement:  Boolean(props.locked   ?? props.fixedPlacement ?? false),
      fixedSize:       Boolean(props.freezed  ?? props.fixedSize      ?? false),
      clickAction:     "none",
      clickActionText: "",
    };
    if (type === "screen") d.asPlanePanel = Boolean(props.asPlanePanel ?? false);
    if (props.imageUrl)      d.imageUrl      = props.imageUrl;
    if (props.coverImageUrl) d.coverImageUrl = props.coverImageUrl;
    // clickAction 파싱
    const ca = props.clickAction;
    if (ca && typeof ca === "object" && ca.type === "message") {
      d.clickAction = "sendToChat";
      d.clickActionText = ca.text ?? "";
    } else if (typeof ca === "string" && ca !== "none") {
      d.clickAction = ca;
    }
    if (!d.clickActionText) delete d.clickActionText;
    if (!d.imageUrl) delete d.imageUrl;
    return d;
  }

  // ── 메시지 수신: content script → inject.js ──────────────────────────
  window.addEventListener("message", async (event) => {
    if (event.source !== window) return;
    if (!event.data?.__ccfoliaHelper) return;

    // ── GET_PANEL_DATA: 우클릭한 패널 데이터 반환 ──
    if (event.data.action === "GET_PANEL_DATA") {
      const { requestId } = event.data;
      window.postMessage({
        __ccfoliaHelper: true,
        action: "PANEL_DATA_RESULT",
        requestId,
        panelData: _contextPanelCache,
      }, "*");
      return;
    }

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
    const markerId = "m" + Math.random().toString(36).slice(2, 12);
    const now = Date.now();
    const base = `https://firestore.googleapis.com/v1/projects/ccfolia-160aa/databases/(default)/documents/rooms/${encodeURIComponent(roomId)}`;
    const url = `${base}?updateMask.fieldPaths=markers.${markerId}&updateMask.fieldPaths=updatedAt`;

    const markerFields = {
      text:     { stringValue: d.memo },
      width:    { integerValue: String(d.width) },
      height:   { integerValue: String(d.height) },
      z:        { integerValue: String(d.overlapPriority ?? 1) },
      locked:   { booleanValue: d.fixedPlacement ?? false },
      freezed:  { booleanValue: d.fixedSize ?? false },
      imageUrl: d.imageUrl ? { stringValue: d.imageUrl } : { nullValue: "NULL_VALUE" },
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
      imageUrl:      d.imageUrl      ? { stringValue: d.imageUrl }      : { nullValue: "NULL_VALUE" },
      coverImageUrl: d.coverImageUrl ? { stringValue: d.coverImageUrl } : { nullValue: "NULL_VALUE" },
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
