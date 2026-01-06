let data = JSON.parse(localStorage.getItem("collections")) || [];
let allTags = JSON.parse(localStorage.getItem("tags")) || [];
let currentFilter = localStorage.getItem("currentFilter") || "none";
let currentTagFilter = localStorage.getItem("currentTagFilter") || "all";
let archivedLists = JSON.parse(localStorage.getItem("archivedLists")) || [];

const MAX_OBJECT_NAME_LENGTH = 25;
const MAX_LIST_NAME_LENGTH = 30;

const TAG_COLORS = [
  { name: 'Rosso', value: 'rgba(255, 59, 48, 0.85)' },
  { name: 'Arancione', value: 'rgba(255, 149, 0, 0.85)' },
  { name: 'Giallo', value: 'rgba(255, 204, 0, 0.85)' },
  { name: 'Verde', value: 'rgba(48, 209, 88, 0.85)' },
  { name: 'Turchese', value: 'rgba(100, 210, 255, 0.85)' },
  { name: 'Blu', value: 'rgba(5, 106, 207, 0.85)' },
  { name: 'Indaco', value: 'rgba(88, 86, 214, 0.85)' },
  { name: 'Viola', value: 'rgba(191, 90, 242, 0.85)' },
  { name: 'Rosa', value: 'rgba(255, 45, 85, 0.85)' },
  { name: 'Grigio', value: 'rgba(142, 142, 147, 0.85)' }
];

function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) : text;
}

function save() {
  localStorage.setItem("collections", JSON.stringify(data));
}

function saveTags() {
  localStorage.setItem("tags", JSON.stringify(allTags));
}

function saveFilter() {
  localStorage.setItem("currentFilter", currentFilter);
  localStorage.setItem("currentTagFilter", currentTagFilter);
}

function saveArchive() {
  localStorage.setItem("archivedLists", JSON.stringify(archivedLists));
}

function isListComplete(list) {
  if (!list.items || list.items.length === 0) return false;
  return list.items.every(item => item.found);
}

function checkCompletedLists() {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  data.forEach((list, index) => {
    if (isListComplete(list)) {
      if (!list.completedAt) {
        list.completedAt = now;
        save();
      } else if (now - list.completedAt >= oneHour) {
        archiveList(index);
      }
    } else {
      if (list.completedAt) {
        delete list.completedAt;
        save();
      }
    }
  });
}

function archiveList(listIdx) {
  const list = data[listIdx];
  if (!list) return;
  list.archivedAt = Date.now();
  archivedLists.push(list);
  data.splice(listIdx, 1);
  save();
  saveArchive();
  renderLists();
  renderArchive();
}

function unarchiveList(archiveIdx) {
  const list = archivedLists[archiveIdx];
  if (!list) return;
  delete list.archivedAt;
  delete list.completedAt;
  data.push(list);
  archivedLists.splice(archiveIdx, 1);
  save();
  saveArchive();
  renderLists();
  renderArchive();
}

function deleteArchivedList(archiveIdx) {
  if (!confirm("Eliminare definitivamente questa lista dall'archivio?")) return;
  archivedLists.splice(archiveIdx, 1);
  saveArchive();
  renderArchive();
}

setInterval(checkCompletedLists, 1000);

const darkToggle = document.getElementById('darkToggle');
darkToggle.checked = JSON.parse(localStorage.getItem('darkMode') || 'true');
document.body.classList.toggle('dark', darkToggle.checked);
document.body.classList.toggle('light', !darkToggle.checked);

darkToggle.addEventListener('change', () => {
  const isDark = darkToggle.checked;
  document.body.classList.toggle('dark', isDark);
  document.body.classList.toggle('light', !isDark);
  localStorage.setItem('darkMode', isDark);
});

document.querySelectorAll('.tab-item[data-tab]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'lists') {
      document.querySelectorAll('.view-tab').forEach(vt => vt.classList.remove('active'));
      document.querySelector('.view-tab[data-view="lists"]').classList.add('active');
    }
  });
});

document.querySelectorAll('.view-tab').forEach(viewTab => {
  viewTab.addEventListener('click', () => {
    const view = viewTab.dataset.view;
    document.querySelectorAll('.view-tab').forEach(vt => vt.classList.remove('active'));
    viewTab.classList.add('active');
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    if (view === 'lists') {
      document.getElementById('lists').classList.add('active');
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      document.querySelector('.tab-item[data-tab="lists"]').classList.add('active');
    } else if (view === 'archive') {
      document.getElementById('archive').classList.add('active');
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    }
  });
});

document.getElementById("addListTab").addEventListener("click", () => {
  const name = prompt("Nome nuova lista (max 30 caratteri):");
  if (!name) return;
  const trimmedName = truncateText(name.trim(), MAX_LIST_NAME_LENGTH);
  data.push({ name: trimmedName, items: [], tags: [], createdAt: Date.now() });
  save();
  renderLists();
});

document.getElementById("filterBtn").addEventListener("click", () => {
  document.getElementById("filterModal").classList.add("show");
  renderFilterOptions();
});

function closeFilterModal() {
  document.getElementById("filterModal").classList.remove("show");
}

function renderFilterOptions() {
  const container = document.getElementById("filterOptions");
  const filters = [
    { id: "none", label: "Nessun filtro", icon: "fas fa-times" },
    { id: "most-complete", label: "Dal più completo al meno completo", icon: "fas fa-arrow-down" },
    { id: "least-complete", label: "Dal meno completo al più completo", icon: "fas fa-arrow-up" },
    { id: "newest", label: "Dal più recente al meno recente", icon: "fas fa-clock" },
    { id: "oldest", label: "Dal meno recente al più recente", icon: "fas fa-history" }
  ];
  
  container.innerHTML = filters.map(f => `
    <div class="filter-option ${currentFilter === f.id ? 'active' : ''}" onclick="applyFilter('${f.id}')">
      <span><i class="${f.icon}"></i> ${f.label}</span>
      ${currentFilter === f.id ? '<i class="fas fa-check"></i>' : ''}
    </div>
  `).join('');
  
  if (allTags.length > 0) {
    container.innerHTML += '<div class="filter-tag-section"><strong>Filtra per Tag:</strong></div>';
    container.innerHTML += `
      <div class="filter-option ${currentTagFilter === 'all' ? 'active' : ''}" onclick="applyTagFilter('all')">
        <span><i class="fas fa-tags"></i> Tutti i tag</span>
        ${currentTagFilter === 'all' ? '<i class="fas fa-check"></i>' : ''}
      </div>
    `;
    allTags.forEach(tag => {
      const count = data.filter(list => list.tags && list.tags.some(t => t.name === tag.name)).length;
      container.innerHTML += `
        <div class="filter-option ${currentTagFilter === tag.name ? 'active' : ''}" onclick="applyTagFilter('${tag.name}')">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="tag-color-preview" style="background:${tag.color};"></span>
            <span>${tag.name}</span>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <span class="tag-badge">${count}</span>
            ${currentTagFilter === tag.name ? '<i class="fas fa-check"></i>' : ''}
          </div>
        </div>
      `;
    });
  }
}

function applyFilter(filterId) {
  currentFilter = filterId;
  saveFilter();
  renderLists();
  closeFilterModal();
}

function applyTagFilter(tag) {
  currentTagFilter = tag;
  saveFilter();
  renderLists();
  closeFilterModal();
}

document.getElementById("tagsBtn").addEventListener("click", () => {
  document.getElementById("tagsModal").classList.add("show");
  renderTagsList();
});

function closeTagsModal() {
  document.getElementById("tagsModal").classList.remove("show");
}

function renderTagsList() {
  const container = document.getElementById("tagsList");
  if (allTags.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--muted-dark);padding:20px;">Nessun tag creato</p>';
    return;
  }
  
  container.innerHTML = allTags.map(tag => {
    const count = data.filter(list => list.tags && list.tags.some(t => t.name === tag.name)).length;
    return `
      <div class="tag-item">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="tag-color-preview" style="background:${tag.color};"></span>
          <span><i class="fas fa-tag"></i> ${tag.name}</span>
        </div>
        <div class="tag-actions">
          <span class="tag-badge">${count}</span>
          <button class="tag-delete" onclick="deleteTag('${tag.name}')" title="Elimina tag">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function addNewTag() {
  const input = document.getElementById("newTagInput");
  const tagName = input.value.trim();
  if (!tagName) return;
  if (allTags.some(t => t.name === tagName)) {
    alert("Questo tag esiste già!");
    return;
  }
  showColorPickerModal(tagName);
}

function showColorPickerModal(tagName) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay show';
  modal.innerHTML = `
    <div class="modal-content color-picker-modal">
      <div class="modal-header">
        <h3><i class="fas fa-palette"></i> Scegli colore per "${tagName}"</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="color-picker-grid" id="colorPickerGrid"></div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button onclick="confirmColorSelection('${tagName}')" style="flex:1;">Conferma</button>
        <button onclick="this.closest('.modal-overlay').remove()" style="flex:1;background:var(--danger);">Annulla</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const grid = document.getElementById('colorPickerGrid');
  grid.innerHTML = TAG_COLORS.map((color, idx) => `
    <div class="color-option" data-color-index="${idx}" style="background:${color.value};" onclick="selectColor(${idx})">
      <i class="fas fa-check"></i>
    </div>
  `).join('');
  selectColor(0);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

let selectedColorIndex = 0;

window.selectColor = function(index) {
  selectedColorIndex = index;
  document.querySelectorAll('.color-option').forEach((el, idx) => {
    el.classList.toggle('selected', idx === index);
  });
};

window.confirmColorSelection = function(tagName) {
  allTags.push({ name: tagName, color: TAG_COLORS[selectedColorIndex].value });
  saveTags();
  renderTagsList();
  document.getElementById("newTagInput").value = "";
  document.querySelector('.color-picker-modal').closest('.modal-overlay').remove();
};

function deleteTag(tagName) {
  if (!confirm(`Eliminare il tag "${tagName}"? Verrà rimosso da tutte le liste.`)) return;
  allTags = allTags.filter(t => t.name !== tagName);
  data.forEach(list => {
    if (list.tags) list.tags = list.tags.filter(t => t.name !== tagName);
  });
  if (currentTagFilter === tagName) currentTagFilter = "all";
  saveTags();
  save();
  saveFilter();
  renderTagsList();
  renderLists();
}

document.getElementById("filterModal").addEventListener("click", (e) => {
  if (e.target.id === "filterModal") closeFilterModal();
});

document.getElementById("tagsModal").addEventListener("click", (e) => {
  if (e.target.id === "tagsModal") closeTagsModal();
});

document.getElementById("newTagInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") addNewTag();
});

function manageListTags(list, listIdx) {
  if (allTags.length === 0) {
    alert("Non hai ancora creato tag! Vai su Gestisci Tag per crearne.");
    return;
  }
  const modal = document.createElement('div');
  modal.className = 'modal-overlay show';
  modal.innerHTML = `
    <div class="modal-content tag-selector-modal">
      <div class="modal-header">
        <h3><i class="fas fa-tags"></i> Seleziona Tag per "${list.name}"</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <p style="color:var(--muted-dark);font-size:0.9rem;margin-bottom:12px;">Puoi selezionare solo 1 tag per lista. Clicca di nuovo per rimuoverlo.</p>
      <div class="tag-selector-list" id="tagSelectorList"></div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button onclick="applyTagSelection()" style="flex:1;">Conferma</button>
        <button onclick="this.closest('.modal-overlay').remove()" style="flex:1;background:var(--danger);">Annulla</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const tagList = document.getElementById('tagSelectorList');
  tagList.innerHTML = allTags.map(tag => {
    const isSelected = list.tags && list.tags.length > 0 && list.tags[0].name === tag.name;
    return `
      <div class="tag-selector-item ${isSelected ? 'selected' : ''}" data-tag='${JSON.stringify(tag)}' onclick="toggleTagSelectionSingle(this)">
        <div style="display:flex;align-items:center;gap:8px;min-width:0;">
          <span class="tag-color-preview" style="background:${tag.color};flex-shrink:0;"></span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${tag.name}</span>
        </div>
        <i class="fas fa-check" style="opacity:${isSelected ? '1' : '0'};"></i>
      </div>
    `;
  }).join('');
  window.toggleTagSelectionSingle = function(element) {
    const isAlreadySelected = element.classList.contains('selected');
    document.querySelectorAll('.tag-selector-item').forEach(item => {
      item.classList.remove('selected');
      item.querySelector('.fa-check').style.opacity = '0';
    });
    if (!isAlreadySelected) {
      element.classList.add('selected');
      element.querySelector('.fa-check').style.opacity = '1';
    }
  };
  window.applyTagSelection = function() {
    const selectedElement = document.querySelector('.tag-selector-item.selected');
    if (selectedElement) {
      list.tags = [JSON.parse(selectedElement.dataset.tag)];
    } else {
      list.tags = [];
    }
    save();
    renderLists();
    modal.remove();
  };
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Liste-MyList.json";
  a.click();
});

document.getElementById("importBtn").addEventListener("click", () => {
  document.getElementById("importFile").click();
});

document.getElementById("importFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!Array.isArray(imported)) throw "Formato non valido";
      if (confirm("Importare le liste? Quelle attuali verranno sovrascritte.")) {
        data = imported;
        save();
        renderLists();
        alert("Liste importate con successo");
      }
    } catch {
      alert("File JSON non valido");
    }
  };
  reader.readAsText(file);
});

const listsContainer = document.getElementById("listsContainer");
const noListsMessage = document.getElementById("noListsMessage");

function renderLists() {
  listsContainer.innerHTML = "";
  let filteredData = currentTagFilter === "all" ? [...data] : data.filter(list => list.tags && list.tags.some(t => t.name === currentTagFilter));
  if (currentFilter === "most-complete") {
    filteredData.sort((a, b) => {
      const aComplete = a.items.filter(i => i.found).length / (a.items.length || 1);
      const bComplete = b.items.filter(i => i.found).length / (b.items.length || 1);
      return bComplete - aComplete;
    });
  } else if (currentFilter === "least-complete") {
    filteredData.sort((a, b) => {
      const aComplete = a.items.filter(i => i.found).length / (a.items.length || 1);
      const bComplete = b.items.filter(i => i.found).length / (b.items.length || 1);
      return aComplete - bComplete;
    });
  } else if (currentFilter === "newest") {
    filteredData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } else if (currentFilter === "oldest") {
    filteredData.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }
  if (!filteredData.length) {
    noListsMessage.style.display = "block";
    noListsMessage.innerText = currentTagFilter !== "all" ? `Nessuna lista con il tag "${currentTagFilter}"` : "Non ci sono liste qui";
    return;
  }
  noListsMessage.style.display = "none";
  filteredData.forEach((list) => {
    const listIdx = data.indexOf(list);
    const card = createListCard(list, listIdx);
    listsContainer.appendChild(card);
  });
}

function createListCard(list, listIdx) {
  const card = document.createElement("div");
  card.className = "list-card";
  if (!list.tags) list.tags = [];
  if (!list.createdAt) list.createdAt = Date.now();
  const header = document.createElement("div");
  header.className = "list-header";
  if (isListComplete(list)) header.classList.add("completed");
  const leftSection = document.createElement("div");
  leftSection.style.display = "flex";
  leftSection.style.flexDirection = "column";
  leftSection.style.gap = "4px";
  leftSection.style.alignItems = "flex-start";
  const nameContainer = document.createElement("div");
  nameContainer.style.display = "flex";
  nameContainer.style.alignItems = "center";
  nameContainer.style.gap = "6px";
  nameContainer.style.flexWrap = "wrap";
  const nameSpan = document.createElement("span");
  nameSpan.innerText = list.name;
  nameContainer.appendChild(nameSpan);
  if (list.tags && list.tags.length > 0) {
    const tag = list.tags[0];
    const tagBadge = document.createElement("span");
    tagBadge.className = "list-tag-badge";
    tagBadge.style.background = tag.color;
    tagBadge.innerText = tag.name;
    nameContainer.appendChild(tagBadge);
  }
  const progressPreview = document.createElement("span");
  progressPreview.className = "progress-preview";
  progressPreview.style.fontSize = "0.75rem";
  progressPreview.style.color = "var(--muted-dark)";
  progressPreview.style.fontWeight = "400";
  const updateProgressPreview = () => {
    const completed = list.items.filter(i => i.found).length;
    const total = list.items.length;
    progressPreview.innerText = total > 0 ? `${completed}/${total} Completo` : "Nessun elemento";
    if (isListComplete(list)) {
      header.classList.add("completed");
    } else {
      header.classList.remove("completed");
    }
  };
  updateProgressPreview();
  leftSection.append(nameContainer, progressPreview);
  const btnContainer = document.createElement("div");
  const archiveIcon = document.createElement("i");
  archiveIcon.className = "fa fa-archive list-edit";
  archiveIcon.title = "Archivia lista";
  const tagsIcon = document.createElement("i");
  tagsIcon.className = "fa fa-tags list-edit";
  tagsIcon.title = "Gestisci tag lista";
  const editBtn = document.createElement("i");
  editBtn.className = "fa fa-pen list-edit";
  editBtn.title = "Modifica nome lista";
  const deleteBtn = document.createElement("i");
  deleteBtn.className = "fa fa-trash list-delete";
  deleteBtn.title = "Elimina lista";
  btnContainer.append(archiveIcon, tagsIcon, editBtn, deleteBtn);
  header.append(leftSection, btnContainer);
  card.appendChild(header);
  archiveIcon.onclick = e => {
    e.stopPropagation();
    if (confirm(`Archiviare la lista "${list.name}"?`)) archiveList(listIdx);
  };
  tagsIcon.onclick = e => {
    e.stopPropagation();
    manageListTags(list, listIdx);
  };
  editBtn.onclick = e => {
    e.stopPropagation();
    const newName = prompt("Modifica nome lista (max 30 caratteri):", list.name);
    if (newName && newName.trim() !== "") {
      list.name = truncateText(newName.trim(), MAX_LIST_NAME_LENGTH);
      save();
      renderLists();
    }
  };
  deleteBtn.onclick = e => {
    e.stopPropagation();
    if (confirm("Eliminare lista?")) {
      data.splice(listIdx, 1);
      save();
      renderLists();
    }
  };
  const itemsContainer = document.createElement("div");
  itemsContainer.className = "items-container";
  const itemsWrapper = document.createElement("div");
  itemsWrapper.className = "items-wrapper";
  itemsContainer.appendChild(itemsWrapper);
  card.appendChild(itemsContainer);
  card.updateProgressPreview = updateProgressPreview;
  header.onclick = () => {
    const isOpen = itemsContainer.classList.contains('open');
    document.querySelectorAll('.items-container').forEach(ic => {
      if (ic !== itemsContainer) ic.classList.remove('open');
    });
    if (isOpen) {
      itemsContainer.classList.remove('open');
    } else {
      itemsContainer.classList.add('open');
      renderItems(list, itemsWrapper, card);
    }
  };
  return card;
}

const archiveContainer = document.getElementById("archiveContainer");
const noArchiveMessage = document.getElementById("noArchiveMessage");

function renderArchive() {
  archiveContainer.innerHTML = "";
  if (!archivedLists.length) {
    noArchiveMessage.style.display = "block";
    return;
  }
  noArchiveMessage.style.display = "none";
  archivedLists.forEach((list, archiveIdx) => {
    const card = createArchivedListCard(list, archiveIdx);
    archiveContainer.appendChild(card);
  });
}

function createArchivedListCard(list, archiveIdx) {
  const card = document.createElement("div");
  card.className = "list-card";
  if (!list.tags) list.tags = [];
  const header = document.createElement("div");
  header.className = "list-header";
  if (isListComplete(list)) header.classList.add("completed");
  const leftSection = document.createElement("div");
  leftSection.style.display = "flex";
  leftSection.style.flexDirection = "column";
  leftSection.style.gap = "4px";
  leftSection.style.alignItems = "flex-start";
  const nameContainer = document.createElement("div");
  nameContainer.style.display = "flex";
  nameContainer.style.alignItems = "center";
  nameContainer.style.gap = "6px";
  nameContainer.style.flexWrap = "wrap";
  const nameSpan = document.createElement("span");
  nameSpan.innerText = list.name;
  nameContainer.appendChild(nameSpan);
  if (list.tags && list.tags.length > 0) {
    const tag = list.tags[0];
    const tagBadge = document.createElement("span");
    tagBadge.className = "list-tag-badge";
    tagBadge.style.background = tag.color;
    tagBadge.innerText = tag.name;
    nameContainer.appendChild(tagBadge);
  }
  const archivedInfo = document.createElement("span");
  archivedInfo.className = "progress-preview";
  archivedInfo.style.fontSize = "0.75rem";
  archivedInfo.style.color = "var(--muted-dark)";
  archivedInfo.style.fontWeight = "400";
  const completed = list.items.filter(i => i.found).length;
  const total = list.items.length;
  archivedInfo.innerText = `${completed}/${total} Completo - Archiviata`;
  leftSection.append(nameContainer, archivedInfo);
  const btnContainer = document.createElement("div");
  const restoreIcon = document.createElement("i");
  restoreIcon.className = "fa fa-undo list-edit";
  restoreIcon.title = "Ripristina lista";
  const deleteBtn = document.createElement("i");
  deleteBtn.className = "fa fa-trash list-delete";
  deleteBtn.title = "Elimina definitivamente";
  btnContainer.append(restoreIcon, deleteBtn);
  header.append(leftSection, btnContainer);
  card.appendChild(header);
  restoreIcon.onclick = e => {
    e.stopPropagation();
    if (confirm(`Ripristinare la lista "${list.name}"?`)) unarchiveList(archiveIdx);
  };
  deleteBtn.onclick = e => {
    e.stopPropagation();
    deleteArchivedList(archiveIdx);
  };
  const itemsContainer = document.createElement("div");
  itemsContainer.className = "items-container";
  const itemsWrapper = document.createElement("div");
  itemsWrapper.className = "items-wrapper";
  itemsContainer.appendChild(itemsWrapper);
  card.appendChild(itemsContainer);
  header.onclick = () => {
    const isOpen = itemsContainer.classList.contains('open');
    document.querySelectorAll('.items-container').forEach(ic => {
      if (ic !== itemsContainer) ic.classList.remove('open');
    });
    if (isOpen) {
      itemsContainer.classList.remove('open');
    } else {
      itemsContainer.classList.add('open');
      renderArchivedItems(list, itemsWrapper);
    }
  };
  return card;
}

function renderArchivedItems(list, container) {
  const parentContainer = container.parentElement;
  parentContainer.innerHTML = "";
  const newWrapper = document.createElement("div");
  newWrapper.className = "items-wrapper";
  parentContainer.appendChild(newWrapper);
  const progressContainer = document.createElement("div");
  progressContainer.style.padding = "0 12px 8px 12px";
  const prog = document.createElement("progress");
  const found = list.items.filter(i => i.found).length;
  const total = list.items.length;
  prog.max = total || 1;
  prog.value = found;
  const progText = document.createElement("div");
  progText.className = "progress-text";
  progressContainer.append(prog, progText);
  newWrapper.appendChild(progressContainer);
  const scrollContainer = document.createElement("div");
  scrollContainer.style.maxHeight = "400px";
  scrollContainer.style.overflowY = "auto";
  scrollContainer.style.overflowX = "hidden";
  scrollContainer.style.padding = "0 12px 12px 12px";
  scrollContainer.style.display = "flex";
  scrollContainer.style.flexDirection = "column";
  scrollContainer.style.gap = "8px";
  scrollContainer.className = "items-scroll-container";
  list.items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "item";
    const left = document.createElement("div");
    left.className = "item-left";
    const check = document.createElement("div");
    check.className = "checkbox" + (item.found ? " checked" : "");
    const checkMark = document.createElement("span");
    check.appendChild(checkMark);
    const nameDiv = document.createElement("div");
    nameDiv.className = "item-name" + (item.found ? " found" : "");
    nameDiv.innerText = item.name;
    nameDiv.title = item.name;
    left.append(check);
    if (item.img) {
      const img = document.createElement("img");
      img.src = item.img;
      img.alt = item.name;
      left.appendChild(img);
    }
    left.appendChild(nameDiv);
    div.appendChild(left);
    scrollContainer.appendChild(div);
  });
  newWrapper.appendChild(scrollContainer);
}

function renderItems(list, container, card) {
  const parentContainer = container.parentElement;
  parentContainer.innerHTML = "";
  const newWrapper = document.createElement("div");
  newWrapper.className = "items-wrapper";
  parentContainer.appendChild(newWrapper);
  const progressContainer = document.createElement("div");
  progressContainer.style.padding = "0 12px 8px 12px";
  const prog = document.createElement("progress");
  const progText = document.createElement("div");
  progText.className = "progress-text";
  progressContainer.append(prog, progText);
  newWrapper.appendChild(progressContainer);
  const scrollContainer = document.createElement("div");
  scrollContainer.style.maxHeight = "400px";
  scrollContainer.style.overflowY = "auto";
  scrollContainer.style.overflowX = "hidden";
  scrollContainer.style.padding = "0 12px 12px 12px";
  scrollContainer.style.display = "flex";
  scrollContainer.style.flexDirection = "column";
  scrollContainer.style.gap = "8px";
  scrollContainer.className = "items-scroll-container";
  const style = document.createElement("style");
  style.textContent = `
    .items-scroll-container::-webkit-scrollbar { width: 8px; }
    .items-scroll-container::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
    .items-scroll-container::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 10px; }
    .items-scroll-container::-webkit-scrollbar-thumb:hover { background: #0066cc; }
  `;
  if (!document.getElementById("scroll-style")) {
    style.id = "scroll-style";
    document.head.appendChild(style);
  }
  const updateProgressBar = () => {
    const found = list.items.filter(i => i.found).length;
    const total = list.items.length;
    prog.max = total || 1;
    prog.value = found;
    if (card && card.updateProgressPreview) card.updateProgressPreview();
  };
  const addBtn = document.createElement("button");
  addBtn.className = "add-object-btn";
  addBtn.innerText = "+";
  const form = document.createElement("div");
  form.className = "add-object-form";
  form.style.display = "none";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "Nome oggetto (max 25 caratteri)";
  nameInput.maxLength = MAX_OBJECT_NAME_LENGTH;
  const imageInput = document.createElement("input");
  imageInput.type = "file";
  imageInput.accept = "image/*";
  const buttonGroup = document.createElement("div");
  buttonGroup.className = "button-group";
  const submitBtn = document.createElement("button");
  submitBtn.innerText = "Aggiungi";
  submitBtn.className = "submit-btn";
  const closeBtn = document.createElement("button");
  closeBtn.innerText = "Chiudi";
  closeBtn.className = "close-btn";
  buttonGroup.append(submitBtn, closeBtn);
  form.append(nameInput, imageInput, buttonGroup);
  scrollContainer.append(addBtn, form);
  addBtn.onclick = () => { form.style.display = "flex"; nameInput.focus(); };
  closeBtn.onclick = () => form.style.display = "none";
  submitBtn.onclick = () => {
    if (!nameInput.value) return;
    const obj = { name: truncateText(nameInput.value, MAX_OBJECT_NAME_LENGTH), found: false, img: null };
    const addItem = () => {
      list.items.push(obj);
      save();
      renderItems(list, newWrapper, card);
      form.style.display = "none";
      nameInput.value = "";
      imageInput.value = "";
    };
    if (imageInput.files[0]) {
      const reader = new FileReader();
      reader.onload = e => { obj.img = e.target.result; addItem(); };
      reader.readAsDataURL(imageInput.files[0]);
    } else addItem();
  };
  list.items.forEach((item, idx) => {
    const itemEl = createItemElement(item, list, newWrapper, idx, card);
    scrollContainer.appendChild(itemEl);
  });
  newWrapper.appendChild(scrollContainer);
  updateProgressBar();
  function createItemElement(item, list, wrapper, idx, card) {
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.index = idx;
    const left = document.createElement("div");
    left.className = "item-left";
    const handle = document.createElement("div");
    handle.className = "drag-handle";
    handle.innerText = "☰";
    const check = document.createElement("div");
    check.className = "checkbox" + (item.found ? " checked" : "");
    const checkMark = document.createElement("span");
    check.appendChild(checkMark);
    const nameDiv = document.createElement("div");
    nameDiv.className = "item-name" + (item.found ? " found" : "");
    nameDiv.innerText = item.name;
    nameDiv.title = item.name;
    check.onclick = () => {
      item.found = !item.found;
      save();
      check.classList.toggle("checked", item.found);
      nameDiv.classList.toggle("found", item.found);
      updateProgressBar();
    };
    handle.addEventListener("mousedown", () => div.draggable = true);
    handle.addEventListener("mouseup", () => div.draggable = false);
    div.addEventListener("dragstart", () => {
      draggingEl = div;
      div.classList.add("dragging");
    });
    div.addEventListener("dragend", () => {
      div.classList.remove("dragging");
      div.draggable = false;
    });
    left.append(handle, check);
    if (item.img) {
      const img = document.createElement("img");
      img.src = item.img;
      img.alt = item.name;
      left.appendChild(img);
    }
    left.appendChild(nameDiv);
    div.appendChild(left);
    const buttonGroup = document.createElement("div");
    buttonGroup.style.display = "flex";
    buttonGroup.style.gap = "4px";
    const editBtn = document.createElement("button");
    editBtn.innerHTML = '<i class="fa fa-pen"></i>';
    editBtn.classList.add("edit-btn");
    editBtn.onclick = () => {
      const newName = prompt("Modifica nome oggetto (max 25 caratteri):", item.name);
      if (newName && newName.trim() !== "") {
        item.name = truncateText(newName.trim(), MAX_OBJECT_NAME_LENGTH);
        save();
        renderItems(list, wrapper, card);
      }
    };
    const delBtn = document.createElement("button");
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.classList.add("delete-btn");
    delBtn.onclick = () => {
      if (confirm("Eliminare oggetto?")) {
        list.items.splice(list.items.indexOf(item), 1);
        save();
        renderItems(list, wrapper, card);
      }
    };
    buttonGroup.append(editBtn, delBtn);
    div.append(buttonGroup);
    return div;
  }
}

let draggingEl = null;

document.addEventListener("dragover", e => {
  e.preventDefault();
  if (!draggingEl) return;
  const container = draggingEl.closest('.items-wrapper');
  if (!container) return;
  const items = [...container.querySelectorAll(".item:not(.dragging)")];
  const after = items.find(i => e.clientY < i.getBoundingClientRect().top + i.offsetHeight / 2);
  if (after) container.insertBefore(draggingEl, after);
  else container.appendChild(draggingEl);
});

document.addEventListener("drop", e => {
  e.preventDefault();
  if (!draggingEl) return;
  const container = draggingEl.closest('.items-wrapper');
  if (!container) return;
  const listCard = draggingEl.closest('.list-card');
  const listIdx = [...listsContainer.children].indexOf(listCard);
  const list = data[listIdx];
  const newIdx = [...container.querySelectorAll(".item")].indexOf(draggingEl);
  const oldIdx = Number(draggingEl.dataset.index);
  if (oldIdx !== newIdx && oldIdx > -1) {
    const moved = list.items.splice(oldIdx, 1)[0];
    list.items.splice(newIdx, 0, moved);
    save();
    renderItems(list, container, draggingEl.closest('.list-card'));
  }
  draggingEl = null;
});

document.addEventListener("DOMContentLoaded", () => {
  renderLists();
  renderArchive();
});
