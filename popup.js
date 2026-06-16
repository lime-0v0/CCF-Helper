// ── 팝업 토스트 ─────────────────────────────
function showPopupToast(msg) {
  const existing = document.getElementById("popup-toast");
  if (existing) existing.remove();
  const t = document.createElement("div");
  t.id = "popup-toast";
  t.textContent = msg;
  t.style.cssText = [
    "position:fixed", "bottom:10px", "left:50%", "transform:translateX(-50%)",
    "background:#1b5e20", "color:#fff", "padding:7px 14px",
    "border-radius:5px", "font-size:11px", "font-family:inherit",
    "box-shadow:0 2px 8px rgba(0,0,0,.6)", "pointer-events:none",
    "white-space:nowrap", "z-index:9999",
    "animation:toast-in .15s ease",
  ].join(";");
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

// Marker JSON 생성기
const markerWidthEl = document.getElementById("markerWidth");
const markerHeightEl = document.getElementById("markerHeight");
const markerPriorityEl = document.getElementById("markerPriority");
const markerMemoEl = document.getElementById("markerMemo");
const markerFixedPlacementEl = document.getElementById("markerFixedPlacement");
const markerFixedSizeEl = document.getElementById("markerFixedSize");
const markerClickActionEl = document.getElementById("markerClickAction");
const markerClickActionTextEl = document.getElementById("markerClickActionText");
const markerClickActionGroup = document.getElementById("markerClickActionGroup");
const markerCopyBtn = document.getElementById("markerCopyBtn");
const markerGenerator = document.getElementById("markerGenerator");

// Screen JSON 생성기
const screenWidthEl = document.getElementById("screenWidth");
const screenHeightEl = document.getElementById("screenHeight");
const screenPriorityEl = document.getElementById("screenPriority");
const screenMemoEl = document.getElementById("screenMemo");
const screenFixedPlacementEl = document.getElementById("screenFixedPlacement");
const screenFixedSizeEl = document.getElementById("screenFixedSize");
const screenAsAsPanelEl = document.getElementById("screenAsPlanePanel");
const screenClickActionEl = document.getElementById("screenClickAction");
const screenClickActionTextEl = document.getElementById("screenClickActionText");
const screenClickActionGroup = document.getElementById("screenClickActionGroup");
const screenCopyBtn = document.getElementById("screenCopyBtn");
const screenGenerator = document.getElementById("screenGenerator");

// Click Action 토글
markerClickActionEl.addEventListener("change", () => {
  markerClickActionGroup.style.display = markerClickActionEl.value === "sendToChat" ? "flex" : "none";
});

screenClickActionEl.addEventListener("change", () => {
  screenClickActionGroup.style.display = screenClickActionEl.value === "sendToChat" ? "flex" : "none";
});

// Marker JSON 복사
markerCopyBtn.addEventListener("click", () => {
  if (!markerMemoEl.value.trim()) {
    alert("Memo (필수) 필드를 입력해주세요!");
    return;
  }

  const json = {
    type: "marker",
    width: parseInt(markerWidthEl.value) || 2,
    height: parseInt(markerHeightEl.value) || 2,
    overlapPriority: parseInt(markerPriorityEl.value) || 1,
    memo: markerMemoEl.value,
  };

  if (markerFixedPlacementEl.checked) json.fixedPlacement = true;
  if (markerFixedSizeEl.checked) json.fixedSize = true;

  if (markerClickActionEl.value !== "none") {
    json.clickAction = markerClickActionEl.value;
    json.clickActionText = markerClickActionTextEl.value;
  }

  const markerImageUrl = document.getElementById("markerImageUrl")?.value.trim();
  if (markerImageUrl) json.imageUrl = markerImageUrl;

  const jsonStr = JSON.stringify(json);
  navigator.clipboard.writeText(jsonStr).then(() => {
    markerCopyBtn.textContent = "✓ 복사됨!";
    markerCopyBtn.classList.add("copied");
    setTimeout(() => {
      markerCopyBtn.textContent = "📋 JSON 복사";
      markerCopyBtn.classList.remove("copied");
    }, 2000);
  });
});

// Screen JSON 복사
screenCopyBtn.addEventListener("click", () => {
  if (!screenMemoEl.value.trim()) {
    alert("Memo (필수) 필드를 입력해주세요!");
    return;
  }

  const json = {
    type: "screen",
    width: parseInt(screenWidthEl.value) || 4,
    height: parseInt(screenHeightEl.value) || 4,
    overlapPriority: parseInt(screenPriorityEl.value) || 1,
    memo: screenMemoEl.value,
  };

  if (screenFixedPlacementEl.checked) json.fixedPlacement = true;
  if (screenFixedSizeEl.checked) json.fixedSize = true;
  if (screenAsAsPanelEl.checked) json.asPlanePanel = true;

  if (screenClickActionEl.value !== "none") {
    json.clickAction = screenClickActionEl.value;
    json.clickActionText = screenClickActionTextEl.value;
  }

  const screenImageUrl = document.getElementById("screenImageUrl")?.value.trim();
  if (screenImageUrl) json.imageUrl = screenImageUrl;

  const screenCoverImageUrl = document.getElementById("screenCoverImageUrl")?.value.trim();
  if (screenCoverImageUrl) json.coverImageUrl = screenCoverImageUrl;

  const jsonStr = JSON.stringify(json);
  navigator.clipboard.writeText(jsonStr).then(() => {
    screenCopyBtn.textContent = "✓ 복사됨!";
    screenCopyBtn.classList.add("copied");
    setTimeout(() => {
      screenCopyBtn.textContent = "📋 JSON 복사";
      screenCopyBtn.classList.remove("copied");
    }, 2000);
  });
});

// 탭 전환 (disabled 탭은 무시)
document.querySelectorAll(".tab:not(.disabled)").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
  });
});

// 생성기 헤더 클릭 이벤트
const markerHeader = document.getElementById("markerGeneratorHeader");
const screenHeader = document.getElementById("screenGeneratorHeader");

if (markerHeader) {
  markerHeader.style.cursor = "pointer";
  markerHeader.addEventListener("click", () => {
    const gen = document.getElementById("markerGenerator");
    gen.classList.toggle("collapsed");
    const isCollapsed = gen.classList.contains("collapsed");
    markerHeader.querySelector("span").textContent = isCollapsed ? "▶ 생성기 펼치기" : "▼ 생성기 접기";
  });
}

if (screenHeader) {
  screenHeader.style.cursor = "pointer";
  screenHeader.addEventListener("click", () => {
    const gen = document.getElementById("screenGenerator");
    gen.classList.toggle("collapsed");
    const isCollapsed = gen.classList.contains("collapsed");
    screenHeader.querySelector("span").textContent = isCollapsed ? "▶ 생성기 펼치기" : "▼ 생성기 접기";
  });
}

// ── 기본값 설정 헤더 토글 ───────────────────────────────────────────────
["marker", "screen"].forEach(type => {
  const hdr = document.getElementById(`${type}DefaultsHeader`);
  if (!hdr) return;
  hdr.style.cursor = "pointer";
  hdr.addEventListener("click", () => {
    const sec = document.getElementById(`${type}Defaults`);
    sec.classList.toggle("collapsed");
    const collapsed = sec.classList.contains("collapsed");
    hdr.querySelector("span").textContent = collapsed ? "▶ 기본값 설정 펼치기" : "▼ 기본값 설정 접기";
  });
});

// ── 기본값 로드 · 저장 · 생성기 반영 ──────────────────────────────────
const SYS = {
  marker: { width: 2, height: 2, priority: 1, imageUrl: "", fixedPlacement: false, fixedSize: false },
  screen: { width: 4, height: 4, priority: 1, imageUrl: "", coverImageUrl: "", fixedPlacement: false, fixedSize: false, asPlanePanel: false },
};

function applyGeneratorDefaults(type, saved) {
  const sys = SYS[type];
  const w   = (saved?.width    > 0) ? saved.width    : sys.width;
  const h   = (saved?.height   > 0) ? saved.height   : sys.height;
  const pr  = (saved?.priority > 0) ? saved.priority : sys.priority;
  const img  = saved?.imageUrl      ?? "";
  const cimg = saved?.coverImageUrl ?? "";
  const fp   = saved?.fixedPlacement ?? false;
  const fs   = saved?.fixedSize      ?? false;
  const ap   = saved?.asPlanePanel   ?? false;

  // 기본값 입력 필드
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };
  set(`${type}DefaultWidth`,    (saved?.width    > 0) ? saved.width    : "");
  set(`${type}DefaultHeight`,   (saved?.height   > 0) ? saved.height   : "");
  set(`${type}DefaultPriority`, (saved?.priority > 0) ? saved.priority : "");
  set(`${type}DefaultImageUrl`, img);
  setChk(`${type}DefaultFixedPlacement`, fp);
  setChk(`${type}DefaultFixedSize`,      fs);
  if (type === "screen") {
    set("screenDefaultCoverImageUrl", cimg);
    setChk("screenDefaultAsPlanePanel", ap);
  }

  // 생성기 초기값
  set(`${type}Width`,    w);
  set(`${type}Height`,   h);
  set(`${type}Priority`, pr);
  set(`${type}ImageUrl`, img);
  setChk(`${type}FixedPlacement`, fp);
  setChk(`${type}FixedSize`,      fs);
  if (type === "screen") {
    set("screenCoverImageUrl", cimg);
    setChk("screenAsPlanePanel", ap);
  }
}

function saveAndApplyDefaults(type) {
  const get    = (id) => document.getElementById(id);
  const w   = parseInt(get(`${type}DefaultWidth`)?.value)    || 0;
  const h   = parseInt(get(`${type}DefaultHeight`)?.value)   || 0;
  const pr  = parseInt(get(`${type}DefaultPriority`)?.value) || 0;
  const img  = get(`${type}DefaultImageUrl`)?.value  ?? "";
  const cimg = get("screenDefaultCoverImageUrl")?.value ?? "";
  const fp   = get(`${type}DefaultFixedPlacement`)?.checked ?? false;
  const fs   = get(`${type}DefaultFixedSize`)?.checked      ?? false;
  const ap   = get("screenDefaultAsPlanePanel")?.checked    ?? false;
  const saved = { width: w, height: h, priority: pr, imageUrl: img, fixedPlacement: fp, fixedSize: fs,
                  ...(type === "screen" ? { coverImageUrl: cimg, asPlanePanel: ap } : {}) };
  chrome.storage.local.set({ [`${type}Defaults`]: saved });
  applyGeneratorDefaults(type, saved);
}

// 팝업 열릴 때 기본값 로드
chrome.storage.local.get(["markerDefaults", "screenDefaults"], (data) => {
  applyGeneratorDefaults("marker", data.markerDefaults);
  applyGeneratorDefaults("screen", data.screenDefaults);
});

// 기본값 변경 시 즉시 저장
["Width", "Height", "Priority", "ImageUrl", "FixedPlacement", "FixedSize"].forEach(field => {
  document.getElementById(`markerDefault${field}`)?.addEventListener("change", () => saveAndApplyDefaults("marker"));
  document.getElementById(`screenDefault${field}`)?.addEventListener("change", () => saveAndApplyDefaults("screen"));
});
document.getElementById("screenDefaultCoverImageUrl")?.addEventListener("change", () => saveAndApplyDefaults("screen"));
document.getElementById("screenDefaultAsPlanePanel")?.addEventListener("change", () => saveAndApplyDefaults("screen"));

// =============================================
// 즐겨찾기 (Favorites) 기능
// =============================================

// ── ccfolia 탭에 패널 생성 요청 ─────────────
async function runOnCcfolia(dataList, triggerBtn) {
  const tabs = await chrome.tabs.query({ url: "https://ccfolia.com/rooms/*" });
  if (tabs.length === 0) {
    alert("ccfolia 방 탭이 열려있지 않습니다.");
    return;
  }
  // 팝업을 열기 직전에 포커스된 브라우저 창의 ccfolia 탭 우선 사용
  let targetTab = null;
  try {
    const win = await chrome.windows.getLastFocused({ populate: true, windowTypes: ["normal"] });
    targetTab = win.tabs?.find(t => t.url?.startsWith("https://ccfolia.com/rooms/")) ?? null;
  } catch (e) { /* 무시 */ }
  if (!targetTab) {
    tabs.sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
    targetTab = tabs[0];
  }
  const tabId = targetTab.id;
  console.log(`[CcfoliaHelper] 실행 시작 - 총 ${dataList.length}개, tabId: ${tabId}`);

  const origText = triggerBtn?.textContent;
  if (triggerBtn) { triggerBtn.textContent = "⏳"; triggerBtn.disabled = true; }

  for (let i = 0; i < dataList.length; i++) {
    const data = dataList[i];
    const t = Date.now();
    console.log(`[CcfoliaHelper] [${i+1}/${dataList.length}] 전송 시작:`, data.memo?.slice(0,20));
    try {
      const res = await chrome.tabs.sendMessage(tabId, { type: "CREATE_PANEL", data });
      console.log(`[CcfoliaHelper] [${i+1}/${dataList.length}] 완료 +${Date.now()-t}ms`, res);
      if (i < dataList.length - 1) {
        await new Promise(r => setTimeout(r, 300));
      }
    } catch(e) {
      console.error(`[CcfoliaHelper] [${i+1}/${dataList.length}] 전송 실패`, e);
    }
  }

  console.log("[CcfoliaHelper] 전체 실행 완료");
  if (triggerBtn) {
    triggerBtn.textContent = "✓";
    setTimeout(() => {
      triggerBtn.textContent = origText;
      triggerBtn.disabled = false;
    }, 1500);
  }
}

async function getFavData() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ folders: [{ id: "default", name: "기본 폴더" }], bookmarks: [] }, resolve);
  });
}

async function saveFavData(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, resolve);
  });
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── 트리 렌더링 ───────────────────────────
async function renderFavTree() {
  const { folders, bookmarks } = await getFavData();
  const tree = document.getElementById("favTree");
  if (!tree) return;
  tree.innerHTML = "";

  if (folders.length === 0) {
    tree.innerHTML = '<div class="fav-empty">폴더가 없습니다.</div>';
    return;
  }

  folders.forEach((folder) => {
    const folderItems = bookmarks.filter((b) => b.folderId === folder.id);
    const isDefault = folder.id === "default";

    const folderEl = document.createElement("div");
    folderEl.className = "fav-folder open";
    folderEl.dataset.id = folder.id;

    folderEl.innerHTML = `
      <div class="fav-folder-header">
        <span class="fav-folder-arrow">▶</span>
        <span class="fav-folder-name">📁 ${escapeHtml(folder.name)}</span>
        <div class="fav-folder-actions">
          <button class="fav-run-all-btn" data-folder-id="${escapeHtml(folder.id)}" title="폴더 전체 생성" ${folderItems.length === 0 ? "disabled" : ""}>▶</button>
          <button class="io-btn fav-export-folder-btn" data-folder-id="${escapeHtml(folder.id)}" title="내보내기">⤴</button>
          ${!isDefault ? `<button class="del-folder-btn" data-id="${escapeHtml(folder.id)}" title="삭제">✕</button>` : ""}
        </div>
      </div>
      <div class="fav-items">
        ${folderItems.length === 0 ? '<div class="fav-empty">항목 없음</div>' : ""}
        ${folderItems.map((b) => {
          const d = b.data || {};
          const ca = d.clickAction || "none";
          const caText = d.clickActionText || "";
          return `
          <div class="fav-item" data-id="${escapeHtml(b.id)}" draggable="true">
            <span class="fav-item-type ${b.data?.type === "screen" ? "scr" : "mrk"}">${b.data?.type === "screen" ? "SCR" : "MRK"}</span>
            ${b.data?.imageUrl ? `<img class="fav-item-thumb" src="${escapeHtml(b.data.imageUrl)}" onerror="this.style.display='none'" alt="">` : ""}
            <span class="fav-item-name" data-json='${escapeHtml(JSON.stringify(b.data))}' title="클릭하여 JSON 복사 | ${escapeHtml(b.name)}">${escapeHtml(b.name)}</span>
            <div class="fav-item-actions">
              <button class="fav-run-btn" data-json='${escapeHtml(JSON.stringify(b.data))}' title="ccfolia에 생성">▶</button>
              <button class="fav-edit-btn-trigger" data-id="${escapeHtml(b.id)}" title="편집">✎</button>
              <button class="del-bookmark-btn" data-id="${escapeHtml(b.id)}" title="삭제">✕</button>
            </div>
          </div>
          <div class="fav-edit-form" id="edit-form-${escapeHtml(b.id)}">
            <div class="fav-edit-label">이름</div>
            <input class="edit-name-input" value="${escapeHtml(b.name)}">
            <div class="fav-edit-row3">
              <div>
                <div class="fav-edit-label">WIDTH</div>
                <input class="edit-width-input" type="number" min="1" value="${d.width ?? 2}">
              </div>
              <div>
                <div class="fav-edit-label">HEIGHT</div>
                <input class="edit-height-input" type="number" min="1" value="${d.height ?? 2}">
              </div>
              <div>
                <div class="fav-edit-label">PRIORITY</div>
                <input class="edit-priority-input" type="number" min="1" value="${d.overlapPriority ?? 1}">
              </div>
            </div>
            <div class="fav-edit-label">MEMO (패널 이름)</div>
            <textarea class="edit-memo-input">${escapeHtml(d.memo ?? "")}</textarea>
            <div class="fav-edit-label">IMAGE URL (선택)</div>
            <input class="edit-imageurl-input" type="text" placeholder="https://..." value="${escapeHtml(d.imageUrl ?? "")}">
            ${d.type === "screen" ? `
            <div class="fav-edit-label">COVER IMAGE URL (뒷면, 선택)</div>
            <input class="edit-coverimageurl-input" type="text" placeholder="https://..." value="${escapeHtml(d.coverImageUrl ?? "")}">
            ` : ""}
            <div class="fav-edit-toggle-row">
              <span class="fav-edit-label">Fixed Placement (위치 고정)</span>
              <label class="toggle"><input class="edit-fixed-placement" type="checkbox" ${d.fixedPlacement ? "checked" : ""}><span class="toggle-track"></span><span class="toggle-thumb"></span></label>
            </div>
            <div class="fav-edit-toggle-row">
              <span class="fav-edit-label">Fixed Size (크기 고정)</span>
              <label class="toggle"><input class="edit-fixed-size" type="checkbox" ${d.fixedSize ? "checked" : ""}><span class="toggle-track"></span><span class="toggle-thumb"></span></label>
            </div>
            ${d.type === "screen" ? `
            <div class="fav-edit-toggle-row">
              <span class="fav-edit-label">Plane Panel</span>
              <label class="toggle"><input class="edit-plane-panel" type="checkbox" ${d.asPlanePanel ? "checked" : ""}><span class="toggle-track"></span><span class="toggle-thumb"></span></label>
            </div>` : ""}
            <div class="fav-edit-label">CLICK ACTION</div>
            <select class="edit-click-action">
              <option value="none"${ca === "none" ? " selected" : ""}>None</option>
              <option value="sendToChat"${ca === "sendToChat" ? " selected" : ""}>Send to chat</option>
            </select>
            <div class="edit-ca-text-group"${ca !== "sendToChat" ? ' style="display:none"' : ""}>
              <div class="fav-edit-label">CLICK ACTION TEXT</div>
              <textarea class="edit-click-action-text">${escapeHtml(caText)}</textarea>
            </div>
            <div class="fav-edit-btns">
              <button class="fav-setdefault-btn" data-type="${b.data?.type === 'screen' ? 'screen' : 'marker'}" data-json='${escapeHtml(JSON.stringify(b.data))}' title="이 항목의 값을 생성기 기본값으로 저장">기본값으로 설정</button>
              <div class="fav-edit-btns-right">
                <button class="fav-edit-btn cancel-edit-btn">취소</button>
                <button class="fav-edit-btn primary save-edit-btn" data-id="${escapeHtml(b.id)}">저장</button>
              </div>
            </div>
          </div>
          `;
        }).join("")}
      </div>
    `;

    folderEl.querySelector(".fav-folder-header").addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      folderEl.classList.toggle("open");
    });

    const delFolderBtn = folderEl.querySelector(".del-folder-btn");
    if (delFolderBtn) {
      delFolderBtn.addEventListener("click", async () => {
        if (!confirm(`"${folder.name}" 폴더와 항목을 모두 삭제할까요?`)) return;
        const d = await getFavData();
        await saveFavData({
          folders: d.folders.filter((f) => f.id !== folder.id),
          bookmarks: d.bookmarks.filter((b) => b.folderId !== folder.id),
        });
        renderFavTree();
      });
    }

    // ── 이름 클릭 → JSON 복사 ──
    folderEl.querySelectorAll(".fav-item-name").forEach((span) => {
      span.addEventListener("click", (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(span.dataset.json).then(() => {
          span.classList.add("copied-flash");
          setTimeout(() => span.classList.remove("copied-flash"), 1200);
          showPopupToast("복사되었습니다!");
        });
      });
    });

    // ── 기본값으로 설정 버튼 ──
    folderEl.querySelectorAll(".fav-setdefault-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const type = btn.dataset.type; // "marker" | "screen"
        const d = JSON.parse(btn.dataset.json);
        const saved = {
          width: d.width ?? 0,
          height: d.height ?? 0,
          priority: d.overlapPriority ?? 0,
          imageUrl: d.imageUrl ?? "",
          fixedPlacement: d.fixedPlacement ?? false,
          fixedSize: d.fixedSize ?? false,
          ...(type === "screen" ? { coverImageUrl: d.coverImageUrl ?? "", asPlanePanel: d.asPlanePanel ?? false } : {}),
        };
        chrome.storage.local.set({ [`${type}Defaults`]: saved });
        applyGeneratorDefaults(type, saved);
        btn.textContent = "✓ 설정됨";
        setTimeout(() => (btn.textContent = "기본값으로 설정"), 1500);
      });
    });

    folderEl.querySelectorAll(".del-bookmark-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const d = await getFavData();
        await saveFavData({ ...d, bookmarks: d.bookmarks.filter((b) => b.id !== btn.dataset.id) });
        renderFavTree();
      });
    });

    // ── 편집 버튼 ──
    folderEl.querySelectorAll(".fav-edit-btn-trigger").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const form = document.getElementById(`edit-form-${btn.dataset.id}`);
        if (!form) return;
        // 다른 열린 편집 폼 닫기
        document.querySelectorAll(".fav-edit-form.open").forEach(f => {
          if (f !== form) f.classList.remove("open");
        });
        form.classList.toggle("open");
      });
    });

    folderEl.querySelectorAll(".cancel-edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        btn.closest(".fav-edit-form").classList.remove("open");
      });
    });

    folderEl.querySelectorAll(".save-edit-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const form = btn.closest(".fav-edit-form");
        const newName = form.querySelector(".edit-name-input").value.trim();
        if (!newName) { alert("이름을 입력해주세요."); return; }
        const memo = form.querySelector(".edit-memo-input").value.trim();
        if (!memo) { alert("MEMO 필드를 입력해주세요."); return; }
        const d = await getFavData();
        const bm = d.bookmarks.find(b => b.id === btn.dataset.id);
        if (!bm) return;
        bm.name = newName;
        const data = { ...(bm.data || {}) };
        data.memo   = memo;
        data.width  = parseInt(form.querySelector(".edit-width-input").value)    || 2;
        data.height = parseInt(form.querySelector(".edit-height-input").value)   || 2;
        data.overlapPriority = parseInt(form.querySelector(".edit-priority-input").value) || 1;
        const imageUrl = form.querySelector(".edit-imageurl-input").value.trim();
        if (imageUrl) data.imageUrl = imageUrl; else delete data.imageUrl;
        data.fixedPlacement = form.querySelector(".edit-fixed-placement")?.checked ?? false;
        data.fixedSize      = form.querySelector(".edit-fixed-size")?.checked      ?? false;
        if (data.type === "screen") {
          const coverImageUrl = form.querySelector(".edit-coverimageurl-input")?.value.trim();
          if (coverImageUrl) data.coverImageUrl = coverImageUrl; else delete data.coverImageUrl;
          data.asPlanePanel = form.querySelector(".edit-plane-panel")?.checked ?? false;
        }
        const clickAction = form.querySelector(".edit-click-action").value;
        if (clickAction !== "none") {
          data.clickAction     = clickAction;
          data.clickActionText = form.querySelector(".edit-click-action-text")?.value || "";
        } else {
          data.clickAction = "none";
          delete data.clickActionText;
        }
        bm.data = data;
        await saveFavData(d);
        renderFavTree();
      });
    });

    // Click Action select → text 필드 토글
    folderEl.querySelectorAll(".edit-click-action").forEach((sel) => {
      sel.addEventListener("change", () => {
        const group = sel.closest(".fav-edit-form").querySelector(".edit-ca-text-group");
        if (group) group.style.display = sel.value === "sendToChat" ? "" : "none";
      });
    });

    // ── 항목 실행 버튼 ──
    folderEl.querySelectorAll(".fav-run-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const data = JSON.parse(btn.dataset.json);
        await runOnCcfolia([data], btn);
      });
    });

    // ── 폴더 전체 실행 버튼 ──
    const runAllBtn = folderEl.querySelector(".fav-run-all-btn");
    if (runAllBtn) {
      runAllBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const d = await getFavData();
        const items = d.bookmarks.filter((b) => b.folderId === folder.id);
        if (items.length === 0) return;
        await runOnCcfolia(items.map(i => i.data), runAllBtn);
      });
    }

    // ── 드래그앤드롭: 항목 순서 변경 및 폴더 이동 ──
    folderEl.querySelectorAll(".fav-item").forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        e.stopPropagation();
        e.dataTransfer.setData("bookmarkId", item.dataset.id);
        item.classList.add("dragging");
        console.log("[CcfoliaHelper] 항목 드래그 시작:", item.querySelector(".fav-item-name")?.textContent);
      });
      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        document.querySelectorAll(".drag-over, .drag-over-bottom")
          .forEach(el => el.classList.remove("drag-over", "drag-over-bottom"));
      });
      item.addEventListener("dragover", (e) => {
        if (!e.dataTransfer.types.includes("bookmarkid")) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        document.querySelectorAll(".drag-over, .drag-over-bottom")
          .forEach(el => el.classList.remove("drag-over", "drag-over-bottom"));
        const rect = item.getBoundingClientRect();
        item.classList.add(e.clientY < rect.top + rect.height / 2 ? "drag-over" : "drag-over-bottom");
      });
      item.addEventListener("dragleave", (e) => {
        if (!item.contains(e.relatedTarget))
          item.classList.remove("drag-over", "drag-over-bottom");
      });
      item.addEventListener("drop", async (e) => {
        item.classList.remove("drag-over", "drag-over-bottom");
        const bookmarkId = e.dataTransfer.getData("bookmarkId");
        if (!bookmarkId || bookmarkId === item.dataset.id) return;
        e.preventDefault();
        e.stopPropagation();
        const d = await getFavData();
        const fromIdx = d.bookmarks.findIndex(b => b.id === bookmarkId);
        const toIdx = d.bookmarks.findIndex(b => b.id === item.dataset.id);
        if (fromIdx === -1 || toIdx === -1) return;
        const rect = item.getBoundingClientRect();
        const insertBefore = e.clientY < rect.top + rect.height / 2;
        const [moved] = d.bookmarks.splice(fromIdx, 1);
        moved.folderId = d.bookmarks[d.bookmarks.findIndex(b => b.id === item.dataset.id)].folderId;
        const newToIdx = d.bookmarks.findIndex(b => b.id === item.dataset.id);
        d.bookmarks.splice(insertBefore ? newToIdx : newToIdx + 1, 0, moved);
        await saveFavData(d);
        renderFavTree();
      });
    });

    // ── 폴더 순서 드래그앤드롭 ──
    folderEl.setAttribute("draggable", "true");
    folderEl.addEventListener("dragstart", (e) => {
      // 항목 드래그와 구분: 폴더 헤더에서만 시작
      if (e.target.closest(".fav-item")) return;
      e.dataTransfer.setData("folderId", folder.id);
      e.dataTransfer.effectAllowed = "move";
      folderEl.classList.add("folder-dragging");
      console.log("[CcfoliaHelper] 폴더 드래그 시작:", folder.name);
    });
    folderEl.addEventListener("dragend", () => {
      folderEl.classList.remove("folder-dragging");
      document.querySelectorAll(".folder-drag-over-top, .folder-drag-over-bottom")
        .forEach(el => el.classList.remove("folder-drag-over-top", "folder-drag-over-bottom"));
    });
    folderEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      // 항목 드래그 중이면 폴더 순서 표시 없이 드롭만 허용
      if (e.dataTransfer.types.includes("bookmarkid")) return;
      // 폴더 순서 변경: 마우스 위치로 위/아래 판단
      const rect = folderEl.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      document.querySelectorAll(".folder-drag-over-top, .folder-drag-over-bottom")
        .forEach(el => el.classList.remove("folder-drag-over-top", "folder-drag-over-bottom"));
      folderEl.classList.add(e.clientY < mid ? "folder-drag-over-top" : "folder-drag-over-bottom");
    });
    folderEl.addEventListener("dragleave", (e) => {
      if (!folderEl.contains(e.relatedTarget)) {
        folderEl.classList.remove("folder-drag-over-top", "folder-drag-over-bottom");
      }
    });
    folderEl.addEventListener("drop", async (e) => {
      folderEl.classList.remove("folder-drag-over-top", "folder-drag-over-bottom");
      const draggedFolderId = e.dataTransfer.getData("folderId");
      const bookmarkId = e.dataTransfer.getData("bookmarkId");

      // 항목 드롭 (기존 로직)
      if (bookmarkId) {
        e.preventDefault();
        const d = await getFavData();
        const bm = d.bookmarks.find((b) => b.id === bookmarkId);
        if (bm && bm.folderId !== folder.id) {
          bm.folderId = folder.id;
          await saveFavData(d);
          renderFavTree();
        }
        return;
      }

      // 폴더 순서 변경
      if (draggedFolderId && draggedFolderId !== folder.id) {
        e.preventDefault();
        const d = await getFavData();
        const fromIdx = d.folders.findIndex(f => f.id === draggedFolderId);
        const toIdx = d.folders.findIndex(f => f.id === folder.id);
        if (fromIdx === -1 || toIdx === -1) return;

        const rect = folderEl.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const insertBefore = e.clientY < mid;

        const [moved] = d.folders.splice(fromIdx, 1);
        const newToIdx = d.folders.findIndex(f => f.id === folder.id);
        d.folders.splice(insertBefore ? newToIdx : newToIdx + 1, 0, moved);

        console.log("[CcfoliaHelper] 폴더 순서 변경:", d.folders.map(f => f.name));
        await saveFavData(d);
        renderFavTree();
      }
    });

    // ── 폴더 내보내기 ──
    folderEl.querySelectorAll(".fav-export-folder-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const d = await getFavData();
        const folderData = d.folders.find(f => f.id === btn.dataset.folderId);
        const items = d.bookmarks.filter(b => b.folderId === btn.dataset.folderId);
        const exportData = { folders: [folderData], bookmarks: items };
        downloadJson(exportData, `ccfolia-${folderData.name}.json`);
      });
    });

    tree.appendChild(folderEl);
  });
}

// ── 폴더 추가 인라인 폼 ──────────────────
const addFolderBtn = document.getElementById("addFolderBtn");
const addFolderForm = document.getElementById("addFolderForm");
const cancelFolderBtn = document.getElementById("cancelFolderBtn");
const confirmFolderBtn = document.getElementById("confirmFolderBtn");

addFolderBtn?.addEventListener("click", () => {
  document.getElementById("folderNameInput").value = "";
  addFolderForm.classList.toggle("open");
  if (addBookmarkForm.classList.contains("open")) addBookmarkForm.classList.remove("open");
});
cancelFolderBtn?.addEventListener("click", () => addFolderForm.classList.remove("open"));
confirmFolderBtn?.addEventListener("click", async () => {
  const name = document.getElementById("folderNameInput").value.trim();
  if (!name) return;
  const d = await getFavData();
  d.folders.push({ id: genId(), name });
  await saveFavData(d);
  addFolderForm.classList.remove("open");
  renderFavTree();
});

// ── 항목 추가 인라인 폼 ──────────────────
const addBookmarkBtn = document.getElementById("addBookmarkBtn");
const addBookmarkForm = document.getElementById("addBookmarkForm");
const cancelBookmarkBtn = document.getElementById("cancelBookmarkBtn");
const confirmBookmarkBtn = document.getElementById("confirmBookmarkBtn");

async function openAddBookmarkForm(prefillData = null, prefillName = "") {
  const { folders } = await getFavData();
  const sel = document.getElementById("bookmarkFolderSelect");
  sel.innerHTML = folders.map((f) => `<option value="${f.id}">${f.name}</option>`).join("");
  document.getElementById("bookmarkNameInput").value = prefillName;
  document.getElementById("bookmarkJsonInput").value = prefillData ? JSON.stringify(prefillData, null, 2) : "";

  // 즐겨찾기 탭으로 이동 후 폼 열기
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.querySelector("[data-tab='fav']").classList.add("active");
  document.getElementById("tab-fav").classList.add("active");

  if (addFolderForm.classList.contains("open")) addFolderForm.classList.remove("open");
  addBookmarkForm.classList.add("open");
  renderFavTree();
}

addBookmarkBtn?.addEventListener("click", () => openAddBookmarkForm());
cancelBookmarkBtn?.addEventListener("click", () => addBookmarkForm.classList.remove("open"));
confirmBookmarkBtn?.addEventListener("click", async () => {
  const name = document.getElementById("bookmarkNameInput").value.trim();
  const folderId = document.getElementById("bookmarkFolderSelect").value;
  const jsonRaw = document.getElementById("bookmarkJsonInput").value.trim();
  if (!name) { alert("이름을 입력해주세요."); return; }
  let data;
  try { data = JSON.parse(jsonRaw); } catch { alert("JSON 형식이 올바르지 않습니다."); return; }
  if (!data.memo) { alert("memo 필드가 필요합니다."); return; }
  const d = await getFavData();
  d.bookmarks.push({ id: genId(), folderId, name, data });
  await saveFavData(d);
  addBookmarkForm.classList.remove("open");
  renderFavTree();
});

// ── 생성기 → 즐겨찾기 버튼 ───────────────
function buildMarkerJson() {
  if (!document.getElementById("markerMemo")?.value.trim()) return null;
  const json = {
    type: "marker",
    width: parseInt(document.getElementById("markerWidth")?.value) || 2,
    height: parseInt(document.getElementById("markerHeight")?.value) || 2,
    overlapPriority: parseInt(document.getElementById("markerPriority")?.value) || 1,
    memo: document.getElementById("markerMemo").value,
  };
  if (document.getElementById("markerFixedPlacement")?.checked) json.fixedPlacement = true;
  if (document.getElementById("markerFixedSize")?.checked) json.fixedSize = true;
  const ca = document.getElementById("markerClickAction")?.value;
  if (ca && ca !== "none") { json.clickAction = ca; json.clickActionText = document.getElementById("markerClickActionText")?.value || ""; }
  const imageUrl = document.getElementById("markerImageUrl")?.value.trim();
  if (imageUrl) json.imageUrl = imageUrl;
  return json;
}

function buildScreenJson() {
  if (!document.getElementById("screenMemo")?.value.trim()) return null;
  const json = {
    type: "screen",
    width: parseInt(document.getElementById("screenWidth")?.value) || 4,
    height: parseInt(document.getElementById("screenHeight")?.value) || 4,
    overlapPriority: parseInt(document.getElementById("screenPriority")?.value) || 1,
    memo: document.getElementById("screenMemo").value,
  };
  if (document.getElementById("screenFixedPlacement")?.checked) json.fixedPlacement = true;
  if (document.getElementById("screenFixedSize")?.checked) json.fixedSize = true;
  if (document.getElementById("screenAsPlanePanel")?.checked) json.asPlanePanel = true;
  const ca = document.getElementById("screenClickAction")?.value;
  if (ca && ca !== "none") { json.clickAction = ca; json.clickActionText = document.getElementById("screenClickActionText")?.value || ""; }
  const imageUrl = document.getElementById("screenImageUrl")?.value.trim();
  if (imageUrl) json.imageUrl = imageUrl;
  const coverImageUrl = document.getElementById("screenCoverImageUrl")?.value.trim();
  if (coverImageUrl) json.coverImageUrl = coverImageUrl;
  return json;
}

document.getElementById("markerFavBtn")?.addEventListener("click", () => {
  const json = buildMarkerJson();
  if (!json) { alert("Memo를 먼저 입력해주세요."); return; }
  openAddBookmarkForm(json, json.memo.slice(0, 20));
});

document.getElementById("screenFavBtn")?.addEventListener("click", () => {
  const json = buildScreenJson();
  if (!json) { alert("Memo를 먼저 입력해주세요."); return; }
  openAddBookmarkForm(json, json.memo.slice(0, 20));
});

// 탭 클릭 시 추가 처리
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.dataset.tab === "fav") renderFavTree();
    if (tab.dataset.tab === "standing") initStandingTab();
  });
});

renderFavTree();

// =============================================
// 내보내기 / 불러오기
// =============================================

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function importJson(file, mode = 'merge') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!imported.folders || !imported.bookmarks) {
          alert("올바른 내보내기 파일이 아닙니다."); reject(); return;
        }
        const d = await getFavData();

        if (mode === 'replace') {
          await saveFavData(imported);
        } else {
          // merge: 기존 id와 겹치지 않게 합치기
          const existingFolderIds = new Set(d.folders.map(f => f.id));
          const existingBmIds = new Set(d.bookmarks.map(b => b.id));
          const newFolders = imported.folders.filter(f => !existingFolderIds.has(f.id));
          const newBms = imported.bookmarks.filter(b => !existingBmIds.has(b.id));
          await saveFavData({
            folders: [...d.folders, ...newFolders],
            bookmarks: [...d.bookmarks, ...newBms],
          });
        }
        renderFavTree();
        resolve();
      } catch { alert("파일 파싱 오류"); reject(); }
    };
    reader.readAsText(file);
  });
}

// 전체 내보내기
document.getElementById("exportAllBtn")?.addEventListener("click", async () => {
  const d = await getFavData();
  downloadJson(d, `ccfolia-favorites-all.json`);
});

// 전체 불러오기
document.getElementById("importAllBtn")?.addEventListener("click", () => {
  document.getElementById("importAllInput").click();
});

document.getElementById("importAllInput")?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const mode = confirm("기존 데이터를 완전히 교체할까요?\n[확인] = 교체, [취소] = 기존에 추가") ? 'replace' : 'merge';
  await importJson(file, mode);
  e.target.value = "";
});

// =============================================
// 스탠딩 탭
// =============================================

let _stdCharId = null;
let _stdCharName = null;

async function getStandingLib() {
  return new Promise(r => chrome.storage.local.get({ standingLib: [] }, d => r(d.standingLib)));
}
async function saveStandingLib(lib) {
  return new Promise(r => chrome.storage.local.set({ standingLib: lib }, r));
}

async function getCcfoliaTab() {
  const tabs = await chrome.tabs.query({ url: "https://ccfolia.com/rooms/*" });
  if (!tabs.length) return null;
  let target = null;
  try {
    const win = await chrome.windows.getLastFocused({ populate: true, windowTypes: ["normal"] });
    target = win.tabs?.find(t => t.url?.startsWith("https://ccfolia.com/rooms/")) ?? null;
  } catch (_) {}
  if (!target) {
    tabs.sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
    target = tabs[0];
  }
  return target;
}

async function initStandingTab() {
  const nameEl = document.getElementById("stdCharName");
  const uploadSection = document.getElementById("stdUploadSection");
  nameEl.textContent = "감지 중...";
  nameEl.className = "std-char-name";

  const tab = await getCcfoliaTab();
  let charData = null;
  if (tab) {
    try { charData = (await chrome.tabs.sendMessage(tab.id, { type: "GET_CHAR_FROM_DIALOG" }))?.charData; }
    catch (_) {}
  }

  if (charData?.id) {
    _stdCharId = charData.id;
    _stdCharName = charData.name || "(이름 없음)";
    nameEl.textContent = `캐릭터: ${_stdCharName}`;
    nameEl.className = "std-char-name detected";
    uploadSection.style.display = "block";
  } else {
    _stdCharId = null; _stdCharName = null;
    nameEl.textContent = tab ? "캐릭터 편집 화면을 열어 주세요" : "ccfolia 방 탭이 없습니다";
    uploadSection.style.display = "none";
  }
  await renderStandingLib();
}

async function renderStandingLib() {
  const lib = await getStandingLib();
  const listEl = document.getElementById("stdLibList");
  if (!lib.length) {
    listEl.innerHTML = `<div class="std-lib-empty">저장된 스탠딩이 없습니다.</div>`;
    return;
  }
  listEl.innerHTML = lib.map(item => `
    <div class="std-lib-item" data-id="${item.id}">
      ${item.imageUrl
        ? `<img class="std-lib-thumb" src="${item.imageUrl}" alt="" loading="lazy">`
        : `<div class="std-lib-thumb-placeholder"></div>`}
      <span class="std-lib-name" title="${item.name}">${item.name}</span>
      <div class="std-lib-actions">
        <button class="std-apply-btn" data-id="${item.id}" ${_stdCharId ? "" : "disabled"}>▶</button>
        <button class="std-del-btn" data-id="${item.id}" title="삭제">✕</button>
      </div>
    </div>
  `).join("");

  listEl.querySelectorAll(".std-apply-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!_stdCharId) return;
      const item = lib.find(i => i.id === btn.dataset.id);
      if (!item) return;
      const tab = await getCcfoliaTab();
      if (!tab) { showPopupToast("ccfolia 탭 없음"); return; }
      const faceName = "@" + item.name.replace(/^@+/, "");
      try {
        const res = await chrome.tabs.sendMessage(tab.id, {
          type: "ADD_STANDING_URL_FROM_POPUP", charId: _stdCharId, faceName, imageUrl: item.imageUrl,
        });
        if (res?.ok) showPopupToast(`"${item.name}" 적용됨!`);
        else showPopupToast(`실패: ${res?.error ?? "오류"}`);
      } catch (e) { showPopupToast("오류: " + e.message); }
    });
  });

  listEl.querySelectorAll(".std-del-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const newLib = lib.filter(i => i.id !== btn.dataset.id);
      await saveStandingLib(newLib);
      await renderStandingLib();
    });
  });
}

// 재감지 버튼
document.getElementById("stdRefreshBtn")?.addEventListener("click", initStandingTab);

// 파일 업로드
document.getElementById("stdUploadBtn")?.addEventListener("click", () => {
  document.getElementById("stdFileInput").click();
});
document.getElementById("stdFileInput")?.addEventListener("change", async (e) => {
  const files = [...e.target.files];
  e.target.value = "";
  if (!files.length || !_stdCharId) return;
  const tab = await getCcfoliaTab();
  if (!tab) { showPopupToast("ccfolia 탭 없음"); return; }

  showPopupToast(`${files.length}개 업로드 중...`);
  try {
    const fileData = await Promise.all(files.map(async f => {
      const buffer = await f.arrayBuffer();
      return { faceName: "@" + f.name.replace(/\.[^.]+$/, ""), type: f.type || "image/png", buffer };
    }));
    const res = await chrome.tabs.sendMessage(tab.id, {
      type: "UPLOAD_STANDINGS_FROM_POPUP", charId: _stdCharId, files: fileData,
    });
    if (res?.ok) showPopupToast(`스탠딩 ${res.count}개 추가됨!`);
    else showPopupToast(`실패: ${res?.error ?? "오류"}`);
  } catch (err) { showPopupToast("오류: " + err.message); }
});

// URL 추가 폼
document.getElementById("stdAddUrlBtn")?.addEventListener("click", () => {
  const form = document.getElementById("stdUrlForm");
  form.style.display = form.style.display === "none" ? "block" : "none";
});
document.getElementById("stdUrlCancelBtn")?.addEventListener("click", () => {
  document.getElementById("stdUrlForm").style.display = "none";
  document.getElementById("stdUrlNameInput").value = "";
  document.getElementById("stdUrlImageInput").value = "";
});
document.getElementById("stdUrlSaveBtn")?.addEventListener("click", async () => {
  const name = document.getElementById("stdUrlNameInput").value.trim();
  const imageUrl = document.getElementById("stdUrlImageInput").value.trim();
  if (!name) { alert("이름을 입력해주세요."); return; }
  if (!imageUrl) { alert("이미지 URL을 입력해주세요."); return; }
  const lib = await getStandingLib();
  lib.push({ id: "sl_" + Date.now().toString(36), name, imageUrl });
  await saveStandingLib(lib);
  document.getElementById("stdUrlForm").style.display = "none";
  document.getElementById("stdUrlNameInput").value = "";
  document.getElementById("stdUrlImageInput").value = "";
  await renderStandingLib();
  showPopupToast(`"${name}" 저장됨!`);
});
