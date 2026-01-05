let data = JSON.parse(localStorage.getItem("collections")) || [];

// Limiti caratteri
const MAX_OBJECT_NAME_LENGTH = 25;
const MAX_LIST_NAME_LENGTH = 30;

function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) : text;
}

// ---------- STORAGE ----------
function save() {
  localStorage.setItem("collections", JSON.stringify(data));
}

// ---------- DARK MODE ----------
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

// ---------- TABS ----------
document.querySelectorAll('.tab-item[data-tab]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// ---------- AGGIUNGI LISTA ----------
document.getElementById("addListTab").addEventListener("click", () => {
  const name = prompt("Nome nuova lista (max 30 caratteri):");
  if (!name) return;
  const trimmedName = truncateText(name.trim(), MAX_LIST_NAME_LENGTH);
  data.push({ name: trimmedName, items: [] });
  save();
  renderLists();
});

// ---------- EXPORT / IMPORT ----------
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

// ---------- RENDER LISTE ----------
const listsContainer = document.getElementById("listsContainer");
const noListsMessage = document.getElementById("noListsMessage");

function renderLists() {
  listsContainer.innerHTML = "";
  if (!data.length) {
    noListsMessage.style.display = "block";
    return;
  }
  noListsMessage.style.display = "none";

  data.forEach((list, listIdx) => {
    const card = createListCard(list, listIdx);
    listsContainer.appendChild(card);
  });
}

function createListCard(list, listIdx) {
  const card = document.createElement("div");
  card.className = "list-card";

  // HEADER
  const header = document.createElement("div");
  header.className = "list-header";

  const leftSection = document.createElement("div");
  leftSection.style.display = "flex";
  leftSection.style.flexDirection = "column";
  leftSection.style.gap = "2px";
  leftSection.style.alignItems = "flex-start";

  const nameSpan = document.createElement("span");
  nameSpan.innerText = list.name;

  const progressPreview = document.createElement("span");
  progressPreview.className = "progress-preview";
  progressPreview.style.fontSize = "0.75rem";
  progressPreview.style.color = "var(--muted-dark)";
  progressPreview.style.fontWeight = "400";
  
  const updateProgressPreview = () => {
    const completed = list.items.filter(i => i.found).length;
    const total = list.items.length;
    progressPreview.innerText = total > 0 ? `${completed}/${total} completati` : "Nessun elemento";
  };
  
  updateProgressPreview();

  leftSection.append(nameSpan, progressPreview);

  const btnContainer = document.createElement("div");

  const editBtn = document.createElement("i");
  editBtn.className = "fa fa-pen list-edit";
  editBtn.title = "Modifica nome lista";

  const deleteBtn = document.createElement("i");
  deleteBtn.className = "fa fa-trash list-delete";
  deleteBtn.title = "Elimina lista";

  btnContainer.append(editBtn, deleteBtn);
  header.append(leftSection, btnContainer);
  card.appendChild(header);

  // EVENTI HEADER
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

  // ITEMS CONTAINER CON ANIMAZIONE
  const itemsContainer = document.createElement("div");
  itemsContainer.className = "items-container";
  
  const itemsWrapper = document.createElement("div");
  itemsWrapper.className = "items-wrapper";
  itemsContainer.appendChild(itemsWrapper);
  
  card.appendChild(itemsContainer);

  // Funzione per aggiornare l'anteprima
  card.updateProgressPreview = updateProgressPreview;

  header.onclick = () => {
    const isOpen = itemsContainer.classList.contains('open');
    
    // Chiudi tutte le altre liste
    document.querySelectorAll('.items-container').forEach(ic => {
      if (ic !== itemsContainer) {
        ic.classList.remove('open');
      }
    });
    
    // Toggle questa lista
    if (isOpen) {
      itemsContainer.classList.remove('open');
    } else {
      itemsContainer.classList.add('open');
      renderItems(list, itemsWrapper, card);
    }
  };

  return card;
}

// ---------- RENDER OGGETTI ----------
function renderItems(list, container, card) {
  // Svuota completamente il container della lista
  const parentContainer = container.parentElement;
  parentContainer.innerHTML = "";
  
  const newWrapper = document.createElement("div");
  newWrapper.className = "items-wrapper";
  parentContainer.appendChild(newWrapper);

  // PROGRESS BAR (fuori dallo scroll)
  const progressContainer = document.createElement("div");
  progressContainer.style.padding = "0 12px 8px 12px";
  
  const prog = document.createElement("progress");
  const progText = document.createElement("div");
  progText.className = "progress-text";
  progressContainer.append(prog, progText);
  newWrapper.appendChild(progressContainer);

  // CONTENITORE SCROLLABILE
  const scrollContainer = document.createElement("div");
  scrollContainer.style.maxHeight = "400px";
  scrollContainer.style.overflowY = "auto";
  scrollContainer.style.overflowX = "hidden";
  scrollContainer.style.padding = "0 12px 12px 12px";
  scrollContainer.style.display = "flex";
  scrollContainer.style.flexDirection = "column";
  scrollContainer.style.gap = "8px";
  scrollContainer.className = "items-scroll-container";
  
  // Aggiungi stili scrollbar
  const style = document.createElement("style");
  style.textContent = `
    .items-scroll-container::-webkit-scrollbar {
      width: 8px;
    }
    .items-scroll-container::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
    }
    .items-scroll-container::-webkit-scrollbar-thumb {
      background: var(--primary);
      border-radius: 10px;
    }
    .items-scroll-container::-webkit-scrollbar-thumb:hover {
      background: #0066cc;
    }
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
    if (card && card.updateProgressPreview) {
      card.updateProgressPreview();
    }
  };

  // FORM AGGIUNGI OGGETTO
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

  // ITEMS
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

    // Pulsanti modifica/elimina
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

// DRAG & DROP
let draggingEl = null;

document.addEventListener("dragover", e => {
  e.preventDefault();
  if (!draggingEl) return;

  const container = draggingEl.closest('.items-wrapper');
  if (!container) return;

  const items = [...container.querySelectorAll(".item:not(.dragging)")];
  const after = items.find(i =>
    e.clientY < i.getBoundingClientRect().top + i.offsetHeight / 2
  );

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

document.addEventListener("DOMContentLoaded", renderLists);
