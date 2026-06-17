// =============================================
// Ccfolia Helper - content.js
// =============================================

// inject.js는 manifest에서 world:"MAIN", run_at:"document_start"로 직접 주입됨

// ── URL에서 roomId 추출 ───────────────────────────────────────────────
function getRoomId() {
  const m = window.location.pathname.match(/\/rooms\/([^/]+)/);
  return m ? m[1] : null;
}

// ── 유틸 ──────────────────────────────────────────────────────────────
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const result = fn();
    if (result) return result;
    await wait(20);
  }
  return null;
}

function findButtonByAriaLabel(label) {
  return document.querySelector(`button[aria-label="${label}"]`);
}

function setInput(el, value) {
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function setToggle(checkbox, desiredOn) {
  if (checkbox.checked !== desiredOn) checkbox.click();
}

function parseJson(raw) {
  let data;
  try { data = JSON.parse(raw); } catch { return null; }
  if (!data.memo) { console.warn("[CcfoliaHelper] memo 필드가 없습니다."); return null; }

  const type = data.type ?? "marker";
  const isScreen = type === "screen";

  return {
    type,
    width:           data.width           ?? (isScreen ? 4 : 2),
    height:          data.height          ?? (isScreen ? 4 : 2),
    overlapPriority: data.overlapPriority ?? 1,
    memo:            String(data.memo),
    imageUrl:        data.imageUrl        ?? null,
    coverImageUrl:   data.coverImageUrl   ?? null,
    fixedPlacement:  data.fixedPlacement  ?? false,
    fixedSize:       data.fixedSize       ?? false,
    asPlanePanel:    data.asPlanePanel    ?? false,
    clickAction:     data.clickAction     ?? "none",
    clickActionText: data.clickActionText ?? "",
  };
}

function getDialog(panelType = "Marker panel settings") {
  return [...document.querySelectorAll("[role='dialog']")]
    .find((el) => el.textContent.includes(panelType));
}

// ── API 방식: inject.js에 메시지 → Firestore REST API ────────────────
let _reqCounter = 0;

function createPanelViaAPI(panelData) {
  const roomId = getRoomId();
  if (!roomId) return Promise.reject(new Error("ROOM_ID_NOT_FOUND"));

  return new Promise((resolve, reject) => {
    const requestId = `ccfh_${++_reqCounter}_${Date.now()}`;
    const timer = setTimeout(() => {
      window.removeEventListener("message", onMsg);
      reject(new Error("TIMEOUT"));
    }, 8000);

    function onMsg(event) {
      if (!event.data?.__ccfoliaHelper) return;
      if (event.data.action !== "CREATE_RESULT") return;
      if (event.data.requestId !== requestId) return;
      clearTimeout(timer);
      window.removeEventListener("message", onMsg);
      if (event.data.success) resolve();
      else reject(new Error(event.data.error ?? "UNKNOWN"));
    }

    window.addEventListener("message", onMsg);
    window.postMessage({ __ccfoliaHelper: true, action: "CREATE_ITEM", requestId, roomId, itemData: panelData }, "*");
  });
}

// ── DOM 방식 (GM 전용 버튼 필요 / 폴백) — 현재 미사용, API 전용 운영 ──
/*
async function createPanelViaDOM(panelData) {
  const isScreen = panelData.type === "screen";
  const listName = isScreen ? "Screen panel list" : "Marker panel list";
  const buttonLabel = isScreen ? "[GM] Screen panel list" : "[GM] Marker panel list";
  const settingsName = isScreen ? "Screen panel settings" : "Marker panel settings";

  // STEP 0: 이미 열려있는 panel list 닫기
  const existingPanel = [...document.querySelectorAll("header")].find(
    (el) => el.querySelector("h6")?.textContent.includes(listName)
  );
  if (existingPanel) {
    const closeBtn = [...existingPanel.querySelectorAll("button")].find(
      (btn) => btn.querySelector("svg path")?.getAttribute("d")?.includes("M19 6.41")
    );
    if (closeBtn) { closeBtn.click(); await wait(200); }
  }

  // STEP 1: Panel list 열기
  const panelListBtn = findButtonByAriaLabel(buttonLabel);
  if (!panelListBtn) { console.error(`[CcfoliaHelper] ${listName} 버튼 없음 (GM 전용)`); return; }
  panelListBtn.click();

  // STEP 2: + 버튼
  const addBtn = await waitFor(() => {
    const header = [...document.querySelectorAll("header")].find(
      (el) => el.querySelector("h6")?.textContent.includes(listName)
    );
    if (!header) return null;
    for (const btn of header.querySelectorAll("button")) {
      const path = btn.querySelector("svg path");
      if (path?.getAttribute("d")?.includes("M19 13") && btn.getBoundingClientRect().width > 0)
        return btn;
    }
    return null;
  });
  if (!addBtn) { console.error("[CcfoliaHelper] + 버튼 없음"); return; }
  addBtn.click();

  // STEP 3: NOIMAGE 클릭
  const noImageBtn = await waitFor(() =>
    [...document.querySelectorAll("li, span, div, p")].find(
      (el) => el.textContent.trim() === "NOIMAGE" && el.children.length === 0
    )
  );
  if (!noImageBtn) { console.error("[CcfoliaHelper] NOIMAGE 없음"); return; }
  noImageBtn.click();

  // STEP 4: NOTEXT 항목 클릭
  const lastItem = await waitFor(() => {
    const items = [...document.querySelectorAll("li, div")].filter(
      (el) => el.textContent.includes("NOTEXT") && el.children.length <= 5 && el.getBoundingClientRect().height > 0
    );
    return items.length > 0 ? items[items.length - 1] : null;
  });
  if (!lastItem) { console.error("[CcfoliaHelper] NOTEXT 항목 없음"); return; }
  lastItem.click();

  // STEP 5: 입력 필드 채우기
  const inputs = await waitFor(() => {
    const d = getDialog(settingsName);
    if (!d) return null;
    const list = [...d.querySelectorAll("input")].filter((inp) => inp.getBoundingClientRect().width > 0);
    return list.length >= 3 ? list : null;
  });
  if (!inputs) { console.error("[CcfoliaHelper] settings 입력 필드 없음"); return; }

  setInput(inputs[0], String(panelData.width));
  setInput(inputs[1], String(panelData.height));
  setInput(inputs[2], String(panelData.overlapPriority));

  const dialog = getDialog(settingsName);
  const textarea = dialog && [...dialog.querySelectorAll("textarea")].find((ta) => ta.getBoundingClientRect().width > 0);
  if (textarea) setInput(textarea, panelData.memo);

  if (dialog) {
    const checkboxes = [...dialog.querySelectorAll("input[type='checkbox']")].filter(
      (el) => el.getBoundingClientRect().width > 0
    );
    if (checkboxes[0]) setToggle(checkboxes[0], panelData.fixedPlacement);
    if (checkboxes[1]) setToggle(checkboxes[1], panelData.fixedSize);
    if (checkboxes[2] && isScreen) setToggle(checkboxes[2], panelData.asPlanePanel ?? false);
  }

  // STEP 6: Click action
  if (panelData.clickAction === "sendToChat") {
    const advBtn = await waitFor(() => {
      const d = getDialog(settingsName);
      if (!d) return null;
      return [...d.querySelectorAll("[role='button']")].find(
        (el) => el.textContent.includes("Advanced settings") && el.getBoundingClientRect().height > 0
      );
    });
    if (advBtn) {
      advBtn.click();
      await waitFor(() => advBtn.getAttribute("aria-expanded") === "true");
      const dropdown = await waitFor(() => {
        const d = getDialog(settingsName);
        if (!d) return null;
        return [...d.querySelectorAll("[role='combobox']")].find(
          (el) => el.textContent.includes("No operations") && el.getBoundingClientRect().height > 10
        );
      });
      if (dropdown) {
        dropdown.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        const option = await waitFor(() =>
          [...document.querySelectorAll("li, [role='option']")].find(
            (el) => el.textContent.trim() === "Send to chat"
          )
        );
        if (option) {
          option.click();
          if (panelData.clickActionText) {
            const chatInput = await waitFor(() => {
              const d = getDialog(settingsName);
              if (!d) return null;
              return d.querySelector("textarea[name='messageText']");
            });
            if (chatInput) setInput(chatInput, panelData.clickActionText);
          }
        }
      }
    }
  }

  // STEP 7: Save 버튼 클릭
  await wait(50);
  const saveBtn = await waitFor(() =>
    [...document.querySelectorAll("button")].find(
      (btn) => btn.textContent.trim() === "Save" && btn.getBoundingClientRect().width > 0
    ), 1000
  );
  if (saveBtn) {
    saveBtn.click();
    console.log(`[CcfoliaHelper] ✅ DOM 방식 저장 완료 (${isScreen ? "Screen" : "Marker"})`);
  } else {
    console.warn("[CcfoliaHelper] Save 버튼 못 찾음 - 수동 저장 필요");
  }
}
*/

// ── 메인: API 전용 ────────────────────────────────────────────────────
async function createPanel(panelData) {
  const label = panelData.type === "screen" ? "Screen panel" : "Marker panel";
  await createPanelViaAPI(panelData);
  console.log(`[CcfoliaHelper] ✅ ${label} 생성 완료 (API)`);
}

// ── popup에서 오는 메시지 수신 ────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CREATE_PANEL") {
    createPanel(msg.data).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === "GET_CHAR_FROM_DIALOG") {
    scanDialogForChar()
      .then(charData => sendResponse({ ok: true, charData }))
      .catch(() => sendResponse({ ok: true, charData: null }));
    return true;
  }
  if (msg.type === "UPLOAD_STANDINGS_FROM_POPUP") {
    const roomId = getRoomId();
    uploadStandingViaInject(roomId, msg.charId, msg.files)
      .then(count => sendResponse({ ok: true, count }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (msg.type === "ADD_STANDING_URL_FROM_POPUP") {
    const roomId = getRoomId();
    addStandingUrlViaInject(roomId, msg.charId, msg.faceName, msg.imageUrl)
      .then(() => sendResponse({ ok: true }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (msg.type === "GET_CHAR_FACES_FROM_POPUP") {
    const roomId = getRoomId();
    getCharFacesViaInject(roomId, msg.charId)
      .then(faces => sendResponse({ ok: true, faces }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (msg.type === "UPLOAD_FILES_TO_CDN_FROM_POPUP") {
    uploadFilesToCdnViaInject(msg.files)
      .then(items => sendResponse({ ok: true, items }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});

// ── inject.js → popup으로 캐릭터 감지 알림 중계 ──────────────────────
window.addEventListener("message", (e) => {
  if (!e.data?.__ccfoliaHelper) return;
  if (e.data.action === "CHAR_DETECTED") {
    chrome.runtime.sendMessage({ type: "CHAR_DETECTED", charId: e.data.charId, charName: e.data.charName }).catch(() => {});
  }
});

// ── 우클릭 메뉴 → 즐겨찾기 추가 기능 ─────────────────────────────────

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function showToast(msg, isError = false) {
  const t = document.createElement("div");
  t.style.cssText = [
    "position:fixed", "bottom:24px", "right:24px", "z-index:2147483647",
    `background:${isError ? "#7f0000" : "#1b5e20"}`,
    "color:#fff", "padding:10px 14px", "border-radius:6px",
    "font-size:13px", "font-family:sans-serif",
    "box-shadow:0 2px 10px rgba(0,0,0,.5)", "pointer-events:none",
    "max-width:280px", "word-break:break-word",
  ].join(";");
  t.textContent = "[CCF Helper] " + msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function getPanelDataFromInject() {
  return new Promise((resolve) => {
    const requestId = `ccfh_ctx_${++_reqCounter}_${Date.now()}`;
    const timer = setTimeout(() => {
      window.removeEventListener("message", onMsg);
      resolve(null);
    }, 5000);
    function onMsg(event) {
      if (!event.data?.__ccfoliaHelper) return;
      if (event.data.action !== "PANEL_DATA_RESULT") return;
      if (event.data.requestId !== requestId) return;
      clearTimeout(timer);
      window.removeEventListener("message", onMsg);
      resolve(event.data.panelData ?? null);
    }
    window.addEventListener("message", onMsg);
    window.postMessage({ __ccfoliaHelper: true, action: "GET_PANEL_DATA", requestId }, "*");
  });
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function uploadStandingViaInject(roomId, charId, files) {
  return new Promise((resolve, reject) => {
    const requestId = `ccfh_standing_${++_reqCounter}_${Date.now()}`;
    const timer = setTimeout(() => { window.removeEventListener("message", onMsg); reject(new Error("TIMEOUT")); }, 120000);
    function onMsg(event) {
      if (!event.data?.__ccfoliaHelper) return;
      if (event.data.action !== "UPLOAD_STANDING_RESULT") return;
      if (event.data.requestId !== requestId) return;
      clearTimeout(timer); window.removeEventListener("message", onMsg);
      if (event.data.success) resolve(event.data.count);
      else reject(new Error(event.data.error ?? "UNKNOWN"));
    }
    window.addEventListener("message", onMsg);
    window.postMessage({ __ccfoliaHelper: true, action: "UPLOAD_STANDING", requestId, roomId, charId, files }, "*");
  });
}

function scanDialogForChar() {
  return new Promise((resolve) => {
    const requestId = `ccfh_dialog_${++_reqCounter}_${Date.now()}`;
    const timer = setTimeout(() => { window.removeEventListener("message", onMsg); resolve(null); }, 6000);
    function onMsg(event) {
      if (!event.data?.__ccfoliaHelper) return;
      if (event.data.action !== "SCAN_DIALOG_RESULT") return;
      if (event.data.requestId !== requestId) return;
      clearTimeout(timer); window.removeEventListener("message", onMsg);
      resolve(event.data.charData ?? null);
    }
    window.addEventListener("message", onMsg);
    window.postMessage({ __ccfoliaHelper: true, action: "SCAN_DIALOG_FOR_CHAR", requestId }, "*");
  });
}

function addStandingUrlViaInject(roomId, charId, faceName, imageUrl) {
  return new Promise((resolve, reject) => {
    const requestId = `ccfh_addurl_${++_reqCounter}_${Date.now()}`;
    const timer = setTimeout(() => { window.removeEventListener("message", onMsg); reject(new Error("TIMEOUT")); }, 15000);
    function onMsg(event) {
      if (!event.data?.__ccfoliaHelper) return;
      if (event.data.action !== "UPLOAD_STANDING_RESULT") return;
      if (event.data.requestId !== requestId) return;
      clearTimeout(timer); window.removeEventListener("message", onMsg);
      if (event.data.success) resolve();
      else reject(new Error(event.data.error ?? "UNKNOWN"));
    }
    window.addEventListener("message", onMsg);
    window.postMessage({ __ccfoliaHelper: true, action: "ADD_STANDING_URL", requestId, roomId, charId, faceName, imageUrl }, "*");
  });
}

function uploadFilesToCdnViaInject(files) {
  return new Promise((resolve, reject) => {
    const requestId = `ccfh_cdn_${++_reqCounter}_${Date.now()}`;
    const timer = setTimeout(() => { window.removeEventListener("message", onMsg); reject(new Error("TIMEOUT")); }, 120000);
    function onMsg(event) {
      if (!event.data?.__ccfoliaHelper) return;
      if (event.data.action !== "UPLOAD_FILES_TO_CDN_RESULT") return;
      if (event.data.requestId !== requestId) return;
      clearTimeout(timer); window.removeEventListener("message", onMsg);
      if (event.data.success) resolve(event.data.items);
      else reject(new Error(event.data.error ?? "UNKNOWN"));
    }
    window.addEventListener("message", onMsg);
    window.postMessage({ __ccfoliaHelper: true, action: "UPLOAD_FILES_TO_CDN", requestId, files }, "*");
  });
}

function getCharFacesViaInject(roomId, charId) {
  return new Promise((resolve, reject) => {
    const requestId = `ccfh_faces_${++_reqCounter}_${Date.now()}`;
    const timer = setTimeout(() => { window.removeEventListener("message", onMsg); reject(new Error("TIMEOUT")); }, 10000);
    function onMsg(event) {
      if (!event.data?.__ccfoliaHelper) return;
      if (event.data.action !== "GET_CHAR_FACES_RESULT") return;
      if (event.data.requestId !== requestId) return;
      clearTimeout(timer); window.removeEventListener("message", onMsg);
      if (event.data.success) resolve(event.data.faces);
      else reject(new Error(event.data.error ?? "UNKNOWN"));
    }
    window.addEventListener("message", onMsg);
    window.postMessage({ __ccfoliaHelper: true, action: "GET_CHAR_FACES", requestId, roomId, charId }, "*");
  });
}

async function addPanelToFavorites(panelData) {
  const name = (panelData.memo || "").slice(0, 20) || "unnamed";
  const newBm = { id: genId(), folderId: "default", name, data: panelData };
  await new Promise((resolve) => {
    chrome.storage.local.get(
      { folders: [{ id: "default", name: "기본 폴더" }], bookmarks: [] },
      (d) => { d.bookmarks.push(newBm); chrome.storage.local.set(d, resolve); }
    );
  });
  const typeLabel = panelData.type === "screen" ? "SCR" : "MRK";
  showToast(`[${typeLabel}] "${name}" 즐겨찾기에 추가됨!`);
}

async function injectFavButton(menu) {
  if (menu.querySelector(".ccfh-ctx-btn")) return;
  if (menu.textContent.includes("To own piece")) return;

  const panelData = await getPanelDataFromInject();
  if (!panelData) return;

  // 메뉴가 이미 닫힌 경우(async 동안 제거됨) 중단
  if (!menu.isConnected) return;

  // 기존 메뉴 아이템 스타일 참고용
  const sample = menu.querySelector("li");

  const btn = document.createElement("li");
  btn.className = "ccfh-ctx-btn";
  btn.setAttribute("role", "menuitem");
  btn.style.cssText = [
    "display:flex", "align-items:center", "gap:8px",
    "padding:6px 16px", "cursor:pointer",
    "font-size:0.875rem", "color:#ffd700",
    "list-style:none", "user-select:none",
    "border-bottom:1px solid rgba(255,255,255,0.12)",
    "margin-bottom:4px",
  ].join(";");
  if (sample) {
    const fs = window.getComputedStyle(sample).fontSize;
    if (fs) btn.style.fontSize = fs;
  }
  btn.innerHTML = `<span style="font-size:1em">★</span><span>[CCF Helper] 즐겨찾기에 추가</span>`;

  btn.addEventListener("mouseenter", () => { btn.style.background = "rgba(255,215,0,0.15)"; });
  btn.addEventListener("mouseleave", () => { btn.style.background = ""; });

  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    e.preventDefault();
    // 메뉴 닫기
    setTimeout(() => document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })), 10);
    await addPanelToFavorites(panelData);
  });

  // 맨 위에 삽입 — 하단 appendChild 시 화면 밖으로 잘리는 문제 방지
  menu.insertBefore(btn, menu.firstChild);
}

// 메뉴를 클릭 위치에서 살짝 위로 올림
function nudgeMenuUp(menu) {
  setTimeout(() => requestAnimationFrame(() => {
    let container = menu;
    while (container && container !== document.body) {
      if (window.getComputedStyle(container).position === "absolute") break;
      container = container.parentElement;
    }
    if (!container || container === document.body) return;
    const curTop = parseFloat(container.style.top);
    if (!isNaN(curTop)) container.style.top = Math.max(4, curTop - 80) + "px";
  }), 0);
}

// MutationObserver: ccfolia의 [role="menu"] 등장 감지
// 우클릭(contextmenu)으로 열린 메뉴에만 버튼 주입 — 드롭다운 오염 방지
let _contextMenuFired = false;
document.addEventListener("contextmenu", () => { _contextMenuFired = true; }, true);
const _ctxObserver = new MutationObserver((mutations) => {
  for (const mut of mutations) {
    for (const node of mut.addedNodes) {
      if (node.nodeType !== 1) continue;
      if (node.getAttribute?.("role") === "menu") {
        if (_contextMenuFired) { _contextMenuFired = false; injectFavButton(node); nudgeMenuUp(node); }
      } else {
        const menu = node.querySelector?.("[role='menu']");
        if (menu && _contextMenuFired) { _contextMenuFired = false; injectFavButton(menu); nudgeMenuUp(menu); }
      }
    }
  }
});
_ctxObserver.observe(document.body, { childList: true, subtree: true });

// ── paste 이벤트 ──────────────────────────────────────────────────────
document.addEventListener("paste", async (e) => {
  const t = e.target;
  if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;

  const text = e.clipboardData?.getData("text/plain") ?? "";
  if (!text.trim()) return;

  const panelData = parseJson(text);
  if (!panelData) return;

  e.preventDefault();
  e.stopImmediatePropagation();
  await createPanel(panelData);
}, true);

// MUI Dialog 트랜지션 제거
const style = document.createElement("style");
style.textContent = `.MuiDialog-root .MuiBackdrop-root, .MuiDialog-container, .MuiDialog-paper { transition: none !important; animation: none !important; }`;
document.head.appendChild(style);

console.log("[CcfoliaHelper] 로드 완료 ✅");
