// =============================================
// Ccfolia Marker Panel Auto Creator - content.js
// =============================================

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

// React toggle (MUI Switch) 클릭 - 현재 상태 확인 후 필요할 때만 클릭
function setToggle(checkbox, desiredOn) {
  const isOn = checkbox.checked;
  if (isOn !== desiredOn) checkbox.click();
}

function parseJson(raw) {
  let data;
  try { data = JSON.parse(raw); } catch { return null; }
  if (!data.memo) { console.warn("[CcfoliaHelper] memo 필드가 없습니다."); return null; }
  
  const type = data.type ?? "marker"; // 기본값: marker
  const isScreen = type === "screen";
  
  return {
    type,
    width:           data.width            ?? (isScreen ? 4 : 2),
    height:          data.height           ?? (isScreen ? 4 : 2),
    overlapPriority: data.overlapPriority  ?? 1,
    memo:            String(data.memo),
    fixedPlacement:  data.fixedPlacement   ?? false,
    fixedSize:       data.fixedSize        ?? false,
    clickAction:     data.clickAction      ?? "none",
    clickActionText: data.clickActionText  ?? "",
  };
}

function getDialog(panelType = "Marker panel settings") {
  return [...document.querySelectorAll("[role='dialog']")]
    .find((el) => el.textContent.includes(panelType));
}

// 설정 읽기 (popup에서 저장한 autoSave 설정)
async function getSettings(panelType) {
  return new Promise((resolve) => {
    const key = panelType === "screen" ? "autoSaveScreen" : "autoSaveMarker";
    chrome.storage.sync.get({ [key]: true }, (data) => {
      resolve({ autoSave: data[key] });
    });
  });
}

// ── 메인 ──────────────────────────────────────
async function createPanel(panelData) {
  console.log("[CcfoliaHelper] 시작", panelData);
  
  const isScreen = panelData.type === "screen";
  const listName = isScreen ? "Screen panel list" : "Marker panel list";
  const buttonLabel = isScreen ? "[GM] Screen panel list" : "[GM] Marker panel list";
  const settingsName = isScreen ? "Screen panel settings" : "Marker panel settings";

  // STEP 0: 이미 열려있는 panel list가 있으면 닫기
  const existingPanel = [...document.querySelectorAll("header")].find(
    (el) => el.querySelector("h6")?.textContent.includes(listName)
  );
  if (existingPanel) {
    // X 버튼 (CloseIcon) 찾아서 닫기
    const closeBtn = [...existingPanel.querySelectorAll("button")].find(
      (btn) => btn.querySelector("svg path")?.getAttribute("d")?.includes("M19 6.41")
    );
    if (closeBtn) {
      closeBtn.click();
      await wait(200);
    }
  }

  // STEP 1: Panel list 열기
  const panelListBtn = findButtonByAriaLabel(buttonLabel);
  if (!panelListBtn) { console.error(`[CcfoliaHelper] ${listName} 버튼 없음`); return; }
  panelListBtn.click();

  // STEP 2: + 버튼 클릭
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

  // STEP 4: 목록 맨 아래 NOTEXT 클릭
  const lastItem = await waitFor(() => {
    const items = [...document.querySelectorAll("li, div")].filter(
      (el) =>
        el.textContent.includes("NOTEXT") &&
        el.children.length <= 5 &&
        el.getBoundingClientRect().height > 0
    );
    return items.length > 0 ? items[items.length - 1] : null;
  });
  if (!lastItem) { console.error("[CcfoliaHelper] NOTEXT 항목 없음"); return; }
  lastItem.click();

  // STEP 5: settings 창 inputs 대기 및 값 입력
  const inputs = await waitFor(() => {
    const d = getDialog(settingsName);
    if (!d) return null;
    const list = [...d.querySelectorAll("input")].filter(
      (inp) => inp.getBoundingClientRect().width > 0
    );
    return list.length >= 3 ? list : null;
  });
  if (!inputs) { console.error("[CcfoliaHelper] settings 입력 필드 없음"); return; }

  setInput(inputs[0], String(panelData.width));
  setInput(inputs[1], String(panelData.height));
  setInput(inputs[2], String(panelData.overlapPriority));

  // Memo
  const dialog = getDialog(settingsName);
  const textarea = dialog && [...dialog.querySelectorAll("textarea")]
    .find((ta) => ta.getBoundingClientRect().width > 0);
  if (textarea) setInput(textarea, panelData.memo);

  // Fixed placement / Fixed size / As a plane panel (MUI Switch = input[type=checkbox])
  if (dialog) {
    const checkboxes = [...dialog.querySelectorAll("input[type='checkbox']")]
      .filter(el => el.getBoundingClientRect().width > 0);
    // 순서: Fixed placement (0번), Fixed size (1번), As a plane panel (2번, Screen only)
    if (checkboxes[0]) setToggle(checkboxes[0], panelData.fixedPlacement);
    if (checkboxes[1]) setToggle(checkboxes[1], panelData.fixedSize);
    if (checkboxes[2] && isScreen) setToggle(checkboxes[2], panelData.asPlanePanel ?? false);
  }

  // STEP 6: Advanced settings & click-action
  if (panelData.clickAction === "sendToChat") {
    const advBtn = await waitFor(() => {
      const d = getDialog(settingsName);
      if (!d) return null;
      return [...d.querySelectorAll("[role='button']")].find(
        (el) =>
          el.textContent.includes("Advanced settings") &&
          el.getBoundingClientRect().height > 0
      );
    });
    if (advBtn) {
      advBtn.click();
      await waitFor(() => advBtn.getAttribute("aria-expanded") === "true");

      const dropdown = await waitFor(() => {
        const d = getDialog(settingsName);
        if (!d) return null;
        return [...d.querySelectorAll("[role='combobox']")].find(
          (el) =>
            el.textContent.includes("No operations") &&
            el.getBoundingClientRect().height > 10
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

  // STEP 7: autoSave 설정에 따라 Save 또는 대기
  const { autoSave } = await getSettings(panelData.type);
  if (autoSave) {
    await wait(50);
    const saveBtn = await waitFor(() =>
      [...document.querySelectorAll("button")].find(
        (btn) => btn.textContent.trim() === "Save" && btn.getBoundingClientRect().width > 0
      ), 1000
    );
    if (saveBtn) {
      saveBtn.click();
      console.log(`[CcfoliaHelper] ✅ ${isScreen ? "Screen panel" : "Marker panel"} 완료 (자동 저장)!`);
    } else {
      console.warn("[CcfoliaHelper] Save 버튼 못 찾음 - 수동으로 저장해주세요");
    }
  } else {
    console.log(`[CcfoliaHelper] ✅ ${isScreen ? "Screen panel" : "Marker panel"} 입력 완료 - 수동 저장 모드`);
  }
}


// ── popup에서 오는 메시지 수신 ──────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CREATE_PANEL") {
    createPanel(msg.data).then(() => sendResponse({ ok: true }));
    return true; // 비동기 응답
  }
});

// ── paste 이벤트 ──────────────────────────────
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
