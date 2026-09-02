// ===== Utilities =====
function getHeaderOffset() {
  const header = document.querySelector("header");
  if (!header) return 0;
  const rect = header.getBoundingClientRect();
  if (rect.top <= 0 && rect.bottom > 0) return rect.height;
  return 0;
}

// ===== State =====
let currentLayout = null;
// Facsimile mode
let currentFacsimileId = null;
let currentFacsPage = 1;
// Single-text mode
let currentEditionId = null;
let currentTextPage = 1;
// Synoptic mode
let activeEditionIds = [];
let currentSynopticPage = 1;

// Zoom state
let currentZoom = 100;

// ===== Facsimile Mode =====
function getFacsimilePages() {
  if (!currentFacsimileId) return [];
  const edBox = document.getElementById("facs-" + currentFacsimileId);
  if (!edBox) return [];
  return Array.from(edBox.querySelectorAll(".page"));
}

function zoomFacsimile(step) {
  currentZoom += step;
  if (currentZoom < 50) currentZoom = 50;
  if (currentZoom > 300) currentZoom = 300;
  applyZoom();
}

function resetFacsimileZoom() {
  currentZoom = 100;
  applyZoom();
}

function applyZoom() {
  document.querySelectorAll('.box-image img').forEach(img => {
    if (currentZoom === 100) {
      img.style.width = 'auto';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '85vh';
    } else {
      img.style.width = `${currentZoom}%`;
      img.style.maxWidth = 'none';
      img.style.maxHeight = 'none';
    }
  });
}

function updateFacsimileViewer() {
  document.querySelectorAll("#viewer_facs .page").forEach(p => p.style.display = "none");
  const pages = getFacsimilePages();
  const total = pages.length;
  if (total === 0) {
    updatePaginationUI(0, 0);
    return;
  }
  if (currentFacsPage < 1) currentFacsPage = 1;
  if (currentFacsPage > total) currentFacsPage = total;
  const pageDiv = pages[currentFacsPage - 1];
  pageDiv.style.display = "block";
  updatePaginationUI(currentFacsPage, total);
  requestAnimationFrame(() => scrollIntoView(pageDiv));
}

function goToFacsPage(n) {
  const num = parseInt(n, 10);
  const total = getFacsimilePages().length;
  if (!isNaN(num) && num >= 1 && num <= total) {
    currentFacsPage = num;
    updateFacsimileViewer();
  }
}

function selectFacsimile(viewId) {
  resetAll();
  currentLayout = "facsimile";
  document.getElementById("viewer_text").style.display = "none";
  document.getElementById("viewer_facs").style.display = "block";

  document.querySelectorAll("#viewer_facs .box-facs").forEach(div => {
    div.style.display = "none";
    div.classList.remove("active");
  });

  const edBox = document.getElementById("facs-" + viewId);
  if (edBox) {
    edBox.style.display = "block";
    edBox.classList.add("active");
  }

  currentFacsimileId = viewId;
  currentFacsPage = 1;
  document.getElementById("facsimileDropdown")?.classList.remove("show");
  updateFacsimileViewer();
}

// ===== Single-Text Mode =====
function getCurrentPages() {
  if (!currentEditionId) return [];
  const ed = document.getElementById(currentEditionId);
  if (!ed) return [];
  return Array.from(ed.querySelectorAll(".page"));
}

function updateTextViewer(noScroll = false) {
  document.querySelectorAll("#viewer_text .page").forEach(p => {
    p.style.display = "none";
    if (p.parentElement.classList.contains("container")) {
      p.parentElement.style.display = "none";
    }
  });
  const pages = getCurrentPages();
  const total = pages.length;
  if (total === 0) {
    updatePaginationUI(0, 0);
    return;
  }
  if (currentTextPage < 1) currentTextPage = 1;
  if (currentTextPage > total) currentTextPage = total;
  const pageDiv = pages[currentTextPage - 1];
  pageDiv.style.display = "block";
  if (pageDiv.parentElement.classList.contains("container")) {
    pageDiv.parentElement.style.display = "flex";
  }
  updatePaginationUI(currentTextPage, total);
  if (!noScroll) {
    requestAnimationFrame(() => scrollIntoView(pageDiv));
  }
}

function goToTextPage(n, noScroll = false) {
  const num = parseInt(n, 10);
  const total = getCurrentPages().length;
  if (!isNaN(num) && num >= 1 && num <= total) {
    currentTextPage = num;
    updateTextViewer(noScroll);
  }
}

function selectSingleText(viewId) {
  resetAll();
  currentLayout = "text";
  document.getElementById("viewer_facs").style.display = "none";
  document.getElementById("viewer_text").style.display = "block";
  document.querySelectorAll("#viewer_text > div").forEach(div => {
    div.style.display = "none";
    div.classList.remove("active");
  });
  const ed = document.getElementById(viewId);
  if (!ed) {
    console.warn("Edition not found:", viewId);
    return;
  }
  ed.style.display = "block";
  ed.classList.add("active");
  currentEditionId = viewId;
  currentTextPage = 1;
  document.getElementById("textOnlyDropdown")?.classList.remove("show");
  updateTextViewer();
}

// ===== Synoptic Mode =====
function toggleView(viewId) {
  if (currentLayout !== 'synoptic') {
    resetAll();
    currentLayout = 'synoptic';
    activeEditionIds = [];
    currentSynopticPage = 1;
    document.getElementById("viewer_facs").style.display = "none";
    document.getElementById("viewer_text").style.display = "flex";
  }
  const box = document.getElementById(viewId);
  const item = document.querySelector(`#synopticDropdown .item[onclick="toggleView('${viewId}')"]`);
  if (!box || !item) return;
  const isActive = box.classList.toggle('active');
  item.classList.toggle('checked');
  if (isActive) {
    if (!activeEditionIds.includes(viewId)) activeEditionIds.push(viewId);
  } else {
    activeEditionIds = activeEditionIds.filter(id => id !== viewId);
  }
  const viewer = document.getElementById('viewer_text');
  viewer.style.display = 'flex';
  viewer.style.flexWrap = 'nowrap';
  viewer.style.gap = '15px';
  Array.from(viewer.querySelectorAll('.box')).forEach(b => {
    if (activeEditionIds.includes(b.id)) {
      b.style.display = 'flex';
      b.style.flex = '1 1 0';
      b.style.minWidth = '0';
      b.classList.add('active');
    } else {
      b.style.display = 'none';
      b.classList.remove('active');
    }
  });
  updateSynopticView();
}

function updateSynopticView() {
  document.querySelectorAll("#viewer_text .page").forEach(p => p.style.display = "none");
  activeEditionIds = activeEditionIds.filter(id => {
    const ed = document.getElementById(id);
    if (!ed) return false;
    const pages = ed.querySelectorAll('.page');
    if (!pages || pages.length === 0) {
      ed.style.display = 'none';
      ed.classList.remove('active');
      const item = document.querySelector(`#synopticDropdown .item[onclick="toggleView('${id}')"]`);
      if (item) item.classList.remove('checked');
      return false;
    }
    return true;
  });
  if (activeEditionIds.length === 0) {
    document.querySelectorAll("#viewer_text .box").forEach(b => b.style.display = 'none');
    updatePaginationUI(0, 0);
    return;
  }
  const maxPages = activeEditionIds.reduce((acc, id) => {
    const ed = document.getElementById(id);
    return Math.max(acc, ed ? ed.querySelectorAll('.page').length : 0);
  }, 0);
  if (currentSynopticPage < 1) currentSynopticPage = 1;
  if (currentSynopticPage > maxPages) currentSynopticPage = maxPages;
  const chapterKeys = getCommonChapterKeys();
  const targetKey = chapterKeys[currentSynopticPage - 1];
  if (!targetKey) return;
  activeEditionIds.forEach(id => {
    const ed = document.getElementById(id);
    if (!ed) return;
    const pageDiv = ed.querySelector(`.page[data-chapter="${targetKey}"]`);
    if (pageDiv) pageDiv.style.display = 'block';
    ed.style.display = 'flex';
    ed.style.flex = '1 1 0';
    ed.style.flexDirection = 'column';
    ed.classList.add('active');
  });
  updatePaginationUI(currentSynopticPage, maxPages);
}

function getCommonChapterKeys() {
  const chapterSets = activeEditionIds.map(id => {
    const ed = document.getElementById(id);
    return new Set(Array.from(ed.querySelectorAll('.page')).map(p => p.dataset.chapter));
  });
  const allKeys = new Set();
  chapterSets.forEach(set => set.forEach(key => allKeys.add(key)));
  return Array.from(allKeys).sort((a, b) => {
    const na = parseInt(a.split('-')[1], 10);
    const nb = parseInt(b.split('-')[1], 10);
    return na - nb;
  });
}

function goToSynopticPage(n) {
  const num = parseInt(n, 10);
  const maxPages = activeEditionIds.reduce((acc, id) => {
    const ed = document.getElementById(id);
    return Math.max(acc, ed ? ed.querySelectorAll(".page").length : 0);
  }, 0);
  if (!isNaN(num) && num >= 1 && num <= maxPages) {
    currentSynopticPage = num;
    updateSynopticView();
  }
}

// ===== Shared UI & Navigation =====
function updatePaginationUI(current, total) {
  document.getElementById("pageDisplay").innerText = current;
  document.getElementById("totalPages").innerText = total;
  document.getElementById("pageInput").value = current;
}



function goToPage(n) {
  if (currentLayout === "facsimile") goToFacsPage(n);
  else if (currentLayout === "text") goToTextPage(n);
  else if (currentLayout === "synoptic") goToSynopticPage(n);
}

function nextPage() {
  if (currentLayout === "facsimile") {
    const total = getFacsimilePages().length;
    if (currentFacsPage < total) goToFacsPage(currentFacsPage + 1);
  } else if (currentLayout === "text") {
    const total = getCurrentPages().length;
    if (currentTextPage < total) goToTextPage(currentTextPage + 1);
  } else if (currentLayout === "synoptic") {
    const maxPages = activeEditionIds.reduce((acc, id) => {
      const ed = document.getElementById(id);
      return Math.max(acc, ed ? ed.querySelectorAll(".page").length : 0);
    }, 0);
    if (currentSynopticPage < maxPages) {
      currentSynopticPage++;
      updateSynopticView();
    }
  }
}

function prevPage() {
  if (currentLayout === "facsimile") {
    if (currentFacsPage > 1) goToFacsPage(currentFacsPage - 1);
  } else if (currentLayout === "text") {
    if (currentTextPage > 1) goToTextPage(currentTextPage - 1);
  } else if (currentLayout === "synoptic") {
    if (currentSynopticPage > 1) {
      currentSynopticPage--;
      updateSynopticView();
    }
  }
}

// ===== Layout Switching & Dropdowns =====
function resetAll() {
  document.querySelectorAll(".box").forEach(box => {
    box.classList.remove("active");
    box.style.flex = "";
    box.style.width = "";
    box.style.display = "none";
  });
  document.querySelectorAll("#synopticDropdown .item").forEach(item => item.classList.remove("checked"));
  document.getElementById("textOnlyDropdown")?.classList.remove("show");
  document.getElementById("synopticDropdown")?.classList.remove("show");
  document.getElementById("facsimileDropdown")?.classList.remove("show");

  const facs = document.getElementById("viewer_facs");
  if (facs) facs.style.display = "none";   // ✅ controlla prima
}

function setLayout(layout) {
  resetAll();
  currentLayout = layout;
  if (layout === "facsimile") {
    selectFacsimile('redazionea');
  }
}

function toggleFacsimileDropdown() {
  document.getElementById("facsimileDropdown").classList.toggle("show");
}

function toggleTextOnlyDropdown() {
  document.getElementById("textOnlyDropdown").classList.toggle("show");
}

function toggleSynopticDropdown() {
  document.getElementById("synopticDropdown").classList.toggle("show");
}

// ===== Init =====
// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#viewer_facs .page, #viewer_text .page").forEach(page => {
    if (page.textContent.trim().length === 0) page.remove();
  });
  currentFacsimileId = 'redazionea';
  currentFacsPage = 1;
  currentTextPage = 1;
  setLayout("facsimile");

  // Gestione parametri URL
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  const pageParam = params.get("page"); // esempio: "redazionea-3"
  const hash = window.location.hash.slice(1); // esempio: "person1_2"

  if (view === "text" && pageParam) {
    const [editionId, chapterNum] = pageParam.split("-");
    selectSingleText(editionId);

    const wantedPageId = `${editionId}-page-${chapterNum}`;
    const targetHash = window.location.hash.slice(1);

    let tries = 0;
    const intervalId = setInterval(() => {
      const pages = getCurrentPages();
      const pageIndex = pages.findIndex(p => p.id === wantedPageId);

      if (pageIndex !== -1) {
        goToTextPage(pageIndex + 1, true); // page becomes visible

        if (targetHash) {
          const target = document.querySelector(`#viewer_text [id="${targetHash}"]`);
          if (target) {
            setTimeout(() => {
              scrollIntoView(target);
              highlightElement(target);
            }, 300);
            clearInterval(intervalId);
          }
        } else {
          clearInterval(intervalId);
        }
      }

      tries++;
      if (tries > 50) clearInterval(intervalId);
    }, 100); // retry every 100ms up to 5 seconds
  }

  else if (view === "synoptic" && pageParam) {
    const editions = pageParam.split(",");
    editions.forEach(id => toggleView(id));
    // Aspetta che le pagine sinottiche siano caricate
    const checkAndScroll = setInterval(() => {
      const target = document.querySelector(`#viewer_text [id="${hash}"]`);
      if (target) {
        clearInterval(checkAndScroll);
        const [editionId, chapterNum] = pageParam.split("-");
        // Trova l'indice della pagina corretta
        const chapterKeys = getCommonChapterKeys();
        const targetKey = `${editionId}-${chapterNum}`;
        const pageIndex = chapterKeys.findIndex(key => key === targetKey);
        if (pageIndex !== -1) {
          goToSynopticPage(pageIndex + 1); // +1 perché gli indici partono da 1
          setTimeout(() => {
            scrollIntoView(target);
            highlightElement(target);
          }, 300);
        }
      }
    }, 100); // Controlla ogni 100ms
  }
});

function scrollIntoView(element) {
  if (!element) return false;

  const viewer = document.getElementById("viewer_text") || document.body;
  const headerOffset = getHeaderOffset();
  const rect = element.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) return false;

  let scrollTop;
  if (viewer !== document.body && viewer.scrollHeight > viewer.clientHeight) {
    const viewerRect = viewer.getBoundingClientRect();
    scrollTop = rect.top - viewerRect.top + viewer.scrollTop - headerOffset - 20;
    viewer.scrollTo({ top: scrollTop, behavior: "smooth" });
  } else {
    scrollTop = window.scrollY + rect.top - headerOffset - 20;
    window.scrollTo({ top: scrollTop, behavior: "smooth" });
  }
  return true;
}

// ===== Settings Panel =====
document.addEventListener('DOMContentLoaded', function () {
  const settingsIcon = document.getElementById("settingsIcon");
  const settingsPanel = document.getElementById("settingsPanel");
  if (settingsIcon && settingsPanel) {
    settingsIcon.addEventListener("click", () => settingsPanel.classList.add("open"));
    window.closeSettingsPanel = function () { settingsPanel.classList.remove("open"); };
  } else {
    window.closeSettingsPanel = function () { };
  }
  const toggleLb = document.getElementById('toggleLb');
  const toggleDel = document.getElementById('toggleDel');
  const toggleAdd = document.getElementById('toggleAdd');
  if (toggleLb) {
    const updateBr = () => document.body.classList.toggle('show-breaks', toggleLb.checked);
    toggleLb.addEventListener('change', updateBr);
    updateBr();
  }
  if (toggleDel) {
    const updateDel = () => {
      document.querySelectorAll('.tei-del').forEach(el => {
        el.style.display = toggleDel.checked ? 'none' : '';
      });
    };
    toggleDel.addEventListener('change', updateDel);
    updateDel();
  }
  if (toggleAdd) {
    const updateAdd = () => {
      document.querySelectorAll('.tei-add').forEach(el => {
        el.style.display = toggleAdd.checked ? 'none' : '';
      });
    };
    toggleAdd.addEventListener('change', updateAdd);
    updateAdd();
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const legendIcon = document.getElementById("legendIcon");
  const legendPanel = document.getElementById("legendPanel");

  if (legendIcon && legendPanel) {
    legendIcon.addEventListener("click", () => legendPanel.classList.add("open"));
    window.closeLegendPanel = function () {
      legendPanel.classList.remove("open");
    };
  } else {
    window.closeLegendPanel = function () { };
  }
});

// ===== Utilities =====
function highlightElement(element, duration = 5000) {
  if (!element || !document.body.contains(element)) return;

  // Remove previous highlights
  document.querySelectorAll('.highlighted').forEach(el => {
    el.classList.remove('highlighted');
    el.style.backgroundColor = '';
  });

  // Add new highlight
  element.classList.add('highlighted');
  element.style.backgroundColor = '#ffeb3b';
  element.style.outline = '4px solid #ff9800';
  element.style.outlineOffset = '2px';
  element.style.borderRadius = '2px';
  element.style.transition = 'all 0.3s ease';

  // Remove highlight after timeout
  setTimeout(() => {
    element.style.backgroundColor = '';
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.classList.remove('highlighted');
  }, duration);
}

// removed redundant scrollToHashWithHighlight

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {

  // person-toggle panels
  document.querySelectorAll(".person-toggle").forEach(toggle => {
    toggle.addEventListener("click", () => {
      const id = toggle.dataset.target;
      const panel = document.getElementById(id);
      if (panel) panel.classList.toggle("open");
    });
  });

  // open panel if hash inside
  const hash = window.location.hash.slice(1);
  if (hash) {
    const target = document.querySelector(`#viewer_text [id="${hash}"]`);
    if (target) {
      const wrapper = target.closest(".person-block");
      const toggle = wrapper?.querySelector(".person-toggle");
      if (toggle) {
        toggle.classList.add("open");
        const panelId = toggle.getAttribute("data-target");
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.add("open");
      }
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  fetch('/main2.html') // path to your parallel page
    .then(res => res.text())
    .then(pageText => {
      document.querySelectorAll('.occurrence-cell').forEach(cell => {
        let name = cell.dataset.name;
        // Match with up to 30 chars before/after
        let regex = new RegExp('(.{0,30})(' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(.{0,30})', 'gi');
        let matches = [...pageText.matchAll(regex)];

        if (matches.length > 0) {
          let table = '<table class="occ-table" border="1"><tr><th>Before</th><th>Match</th><th>After</th><th>Position</th></tr>';
          matches.forEach(m => {
            let before = m[1];
            let match = m[2];
            let after = m[3];
            let pos = pageText.indexOf(match);
            table += '<tr><td>' + before + '</td><td class="highlight">' + match + '</td><td>' + after + '</td><td>' + pos + '</td></tr>';
          });
          table += '</table>';
          cell.innerHTML = table;
        } else {
          cell.textContent = 'No occurrences';
        }
      });
    });
});

// removed duplicate event listeners


