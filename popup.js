const autoSaveMarkerEl = document.getElementById("autoSaveMarker");
const autoSaveScreenEl = document.getElementById("autoSaveScreen");
const statusMarkerEl   = document.getElementById("statusMarker");
const statusScreenEl   = document.getElementById("statusScreen");

// Chrome storage 확인
if (!chrome?.storage?.sync) {
  console.error("[ERROR] chrome.storage.sync not available");
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

// 생성기 토글 함수
function toggleGeneratorMarker(e) {
  console.log("[DEBUG] toggleGeneratorMarker called");
  e.preventDefault();
  const generator = document.getElementById("markerGenerator");
  const header = e.currentTarget;
  
  console.log("Generator element:", generator);
  console.log("Header element:", header);
  console.log("Current collapsed state:", generator.classList.contains("collapsed"));
  
  generator.classList.toggle("collapsed");
  
  console.log("New collapsed state:", generator.classList.contains("collapsed"));
  
  if (generator.classList.contains("collapsed")) {
    header.querySelector("span").textContent = "▶ 생성기 펼치기";
  } else {
    header.querySelector("span").textContent = "▼ 생성기 접기";
  }
}

function toggleGeneratorScreen(e) {
  console.log("[DEBUG] toggleGeneratorScreen called");
  e.preventDefault();
  const generator = document.getElementById("screenGenerator");
  const header = e.currentTarget;
  
  console.log("Generator element:", generator);
  console.log("Header element:", header);
  console.log("Current collapsed state:", generator.classList.contains("collapsed"));
  
  generator.classList.toggle("collapsed");
  
  console.log("New collapsed state:", generator.classList.contains("collapsed"));
  
  if (generator.classList.contains("collapsed")) {
    header.querySelector("span").textContent = "▶ 생성기 펼치기";
  } else {
    header.querySelector("span").textContent = "▼ 생성기 접기";
  }
}

// 저장된 설정 불러오기
if (chrome?.storage?.sync) {
  chrome.storage.sync.get({ autoSaveMarker: true, autoSaveScreen: true }, (data) => {
    autoSaveMarkerEl.checked = data.autoSaveMarker;
    autoSaveScreenEl.checked = data.autoSaveScreen;
    updateStatusMarker(data.autoSaveMarker);
    updateStatusScreen(data.autoSaveScreen);
  });
}

// 마커 토글 변경 시 저장
autoSaveMarkerEl.addEventListener("change", () => {
  const autoSaveMarker = autoSaveMarkerEl.checked;
  chrome.storage.sync.set({ autoSaveMarker });
  updateStatusMarker(autoSaveMarker);
});

// 스크린 토글 변경 시 저장
autoSaveScreenEl.addEventListener("change", () => {
  const autoSaveScreen = autoSaveScreenEl.checked;
  chrome.storage.sync.set({ autoSaveScreen });
  updateStatusScreen(autoSaveScreen);
});

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

function updateStatusMarker(autoSave) {
  if (autoSave) {
    statusMarkerEl.className = "status saved";
    statusMarkerEl.textContent = "✓ 자동 저장 ON — 붙여넣기 후 즉시 완료됩니다";
  } else {
    statusMarkerEl.className = "status manual";
    statusMarkerEl.textContent = "✎ 수동 저장 — 내용 확인 후 Save를 직접 누르세요";
  }
}

function updateStatusScreen(autoSave) {
  if (autoSave) {
    statusScreenEl.className = "status saved";
    statusScreenEl.textContent = "✓ 자동 저장 ON — 붙여넣기 후 즉시 완료됩니다";
  } else {
    statusScreenEl.className = "status manual";
    statusScreenEl.textContent = "✎ 수동 저장 — 내용 확인 후 Save를 직접 누르세요";
  }
}

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
    console.log("[DEBUG] markerHeader clicked");
    const gen = document.getElementById("markerGenerator");
    gen.classList.toggle("collapsed");
    const isCollapsed = gen.classList.contains("collapsed");
    markerHeader.querySelector("span").textContent = isCollapsed ? "▶ 생성기 펼치기" : "▼ 생성기 접기";
  });
}

if (screenHeader) {
  screenHeader.style.cursor = "pointer";
  screenHeader.addEventListener("click", () => {
    console.log("[DEBUG] screenHeader clicked");
    const gen = document.getElementById("screenGenerator");
    gen.classList.toggle("collapsed");
    const isCollapsed = gen.classList.contains("collapsed");
    screenHeader.querySelector("span").textContent = isCollapsed ? "▶ 생성기 펼치기" : "▼ 생성기 접기";
  });
}

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
  const tabId = tabs[0].id;
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
        <span class="fav-folder-name">📁 ${folder.name}</span>
        <div class="fav-folder-actions">
          <button class="fav-run-all-btn" data-folder-id="${folder.id}" title="폴더 전체 실행" ${folderItems.length === 0 ? "disabled" : ""}>▶▶ 전체</button>
          <button class="io-btn fav-export-folder-btn" data-folder-id="${folder.id}" title="폴더 내보내기">⬆</button>
          ${!isDefault ? `<button class="del-folder-btn" data-id="${folder.id}" title="삭제">🗑</button>` : ""}
        </div>
      </div>
      <div class="fav-items">
        ${folderItems.length === 0 ? '<div class="fav-empty">항목 없음</div>' : ""}
        ${folderItems.map((b) => `
          <div class="fav-item" data-id="${b.id}" draggable="true">
            <span class="fav-item-type ${b.data?.type === "screen" ? "scr" : "mrk"}">${b.data?.type === "screen" ? "SCR" : "MRK"}</span>
            <span class="fav-item-name" title="${b.name}">${b.name}</span>
            <div class="fav-item-actions">
              <button class="fav-run-btn" data-json='${JSON.stringify(b.data)}' title="ccfolia에 생성">▶</button>
              <button class="fav-copy-btn" data-json='${JSON.stringify(b.data)}' title="복사">📋</button>
              <button class="fav-edit-btn-trigger" data-id="${b.id}" title="편집">✏️</button>
              <button class="del-bookmark-btn" data-id="${b.id}" title="삭제">🗑</button>
            </div>
          </div>
          <div class="fav-edit-form" id="edit-form-${b.id}">
            <div class="fav-edit-label">이름</div>
            <input class="edit-name-input" value="${b.name}">
            <div class="fav-edit-label">JSON 데이터</div>
            <textarea class="edit-json-input">${JSON.stringify(b.data, null, 2)}</textarea>
            <div class="fav-edit-btns">
              <button class="fav-edit-btn cancel-edit-btn">취소</button>
              <button class="fav-edit-btn primary save-edit-btn" data-id="${b.id}">저장</button>
            </div>
          </div>
        `).join("")}
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

    folderEl.querySelectorAll(".fav-copy-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(btn.dataset.json).then(() => {
          btn.textContent = "✓";
          setTimeout(() => (btn.textContent = "📋"), 1500);
        });
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
        const jsonRaw = form.querySelector(".edit-json-input").value.trim();
        if (!newName) { alert("이름을 입력해주세요."); return; }
        let newData;
        try { newData = JSON.parse(jsonRaw); } catch { alert("JSON 형식이 올바르지 않습니다."); return; }
        if (!newData.memo) { alert("memo 필드가 필요합니다."); return; }
        const d = await getFavData();
        const bm = d.bookmarks.find(b => b.id === btn.dataset.id);
        if (bm) { bm.name = newName; bm.data = newData; }
        await saveFavData(d);
        renderFavTree();
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

    // ── 드래그앤드롭: 항목 → 폴더 이동 ──
    folderEl.querySelectorAll(".fav-item").forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        e.stopPropagation(); // 폴더 드래그와 구분
        e.dataTransfer.setData("bookmarkId", item.dataset.id);
        item.classList.add("dragging");
        console.log("[CcfoliaHelper] 항목 드래그 시작:", item.querySelector(".fav-item-name")?.textContent);
      });
      item.addEventListener("dragend", () => item.classList.remove("dragging"));
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
      const draggingFolderId = e.dataTransfer.types.includes("folderid") || e.dataTransfer.getData("folderId");
      // 항목 드래그 중이면 폴더 드롭 처리 (기존 로직)
      if (e.dataTransfer.types.includes("bookmarkid")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      // 마우스 위치로 위/아래 판단
      const rect = folderEl.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      document.querySelectorAll(".folder-drag-over-top, .folder-drag-over-bottom")
        .forEach(el => el.classList.remove("folder-drag-over-top", "folder-drag-over-bottom"));
      if (e.clientY < mid) {
        folderEl.classList.add("folder-drag-over-top");
      } else {
        folderEl.classList.add("folder-drag-over-bottom");
      }
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

// 즐겨찾기 탭 클릭 시 렌더링
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.dataset.tab === "fav") renderFavTree();
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
