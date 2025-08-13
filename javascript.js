document.addEventListener("DOMContentLoaded", function () {
    const notesContainer = document.getElementById("notesContainer");
    const addNoteBtn = document.getElementById("addNoteBtn");
    const addNoteModal = document.getElementById("addNoteModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const noteForm = document.getElementById("noteForm");
    const searchInput = document.getElementById("searchInput");
    const filterSelect = document.getElementById("filterSelect");
    const emptyState = document.getElementById("emptyState");
    const confirmModal = document.getElementById("confirmModal");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    const darkModeToggle = document.getElementById("darkModeToggle");
    const exportBtn = document.getElementById("exportBtn");
    const importInput = document.getElementById("importInput");

    // View Note Modal elements
    const viewNoteModal = document.getElementById("viewNoteModal");
    const closeViewModalBtn = document.getElementById("closeViewModalBtn");

    let notes = JSON.parse(localStorage.getItem("notes")) || [];
    let noteToDeleteId = null;
    let editingId = null;
    let dragSrcId = null;

    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark");
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    renderNotes();
    updateEmptyState();

    addNoteBtn.addEventListener("click", openAddNoteModal);
    closeModalBtn.addEventListener("click", closeAddNoteModal);
    noteForm.addEventListener("submit", handleNoteSubmit);
    searchInput.addEventListener("input", filterNotes);
    filterSelect.addEventListener("change", filterNotes);
    cancelDeleteBtn.addEventListener("click", closeConfirmModal);
    confirmDeleteBtn.addEventListener("click", confirmDeleteNote);
    darkModeToggle.addEventListener("click", toggleDarkMode);
    exportBtn.addEventListener("click", exportNotes);
    importInput.addEventListener("change", importNotes);
    closeViewModalBtn.addEventListener("click", closeViewModal);
    window.addEventListener("click", (e) => {
        if (e.target === addNoteModal) closeAddNoteModal();
        if (e.target === confirmModal) closeConfirmModal();
        if (e.target === viewNoteModal) closeViewModal();
    });

    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (addNoteModal.classList.contains("active")) closeAddNoteModal();
            if (confirmModal.classList.contains("active")) closeConfirmModal();
            if (viewNoteModal.classList.contains("active")) closeViewModal();
        }
    });

    function renderNotes(notesToRender = notes) {
        notesContainer.innerHTML = "";

        notesToRender.forEach((note) => {
            const noteElement = document.createElement("div");
            noteElement.className = "note-card fade-in";
            noteElement.draggable = true;
            noteElement.dataset.id = note.id;
            noteElement.innerHTML = `
            <div class="note-content">
                <div class="note-header">
                    <h3 class="note-title">${escapeHtml(note.title)}</h3>
                    <div class="note-actions">
                        <button class="action-btn edit-btn" data-id="${note.id}" title="Edit">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${note.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="note-text">${escapeHtmlPreserve(note.content)}</p>
                <div class="note-footer">
                    <div class="note-footer-left">
                        <span class="note-tag ${getTagClass(note.tag)}">
                            ${getTagIcon(note.tag)} ${getTagName(note.tag)}
                        </span>
                    </div>
                    <span class="note-date">${formatDate(note.date)}</span>
                </div>
            </div>`;

            addDragHandlers(noteElement);

            // View full note when card is clicked (excluding edit/delete buttons)
            noteElement.addEventListener("click", function (e) {
                if (!e.target.closest(".edit-btn") && !e.target.closest(".delete-btn")) {
                    openViewModal(note);
                }
            });

            notesContainer.appendChild(noteElement);
        });

        document.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                noteToDeleteId = this.getAttribute("data-id");
                openConfirmModal();
            });
        });

        document.querySelectorAll(".edit-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                const id = this.getAttribute("data-id");
                openEditModal(id);
            });
        });
    }

    function getTagClass(tag) {
        const classes = {
            work: "tag-work",
            personal: "tag-personal",
            ideas: "tag-ideas",
            reminders: "tag-reminders",
        };
        return classes[tag] || "";
    }

    function getTagIcon(tag) {
        const icons = {
            work: '<i class="fas fa-briefcase"></i>',
            personal: '<i class="fas fa-user"></i>',
            ideas: '<i class="fas fa-lightbulb"></i>',
            reminders: '<i class="fas fa-bell"></i>',
        };
        return icons[tag] || "";
    }

    function getTagName(tag) {
        const names = {
            work: "Work",
            personal: "Personal",
            ideas: "Ideas",
            reminders: "Reminders",
        };
        return names[tag] || tag;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function escapeHtml(text) {
        return (text + "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function escapeHtmlPreserve(text) {
        return escapeHtml(text).replace(/\n/g, "<br>");
    }

    function openAddNoteModal() {
        editingId = null;
        document.getElementById("modalTitle").textContent = "New Note";
        addNoteModal.classList.add("active");
        addNoteModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        noteForm.reset();
        const defaultRadio = document.querySelector('input[name="noteTag"][value="ideas"]');
        if (defaultRadio) defaultRadio.checked = true;
    }

    function closeAddNoteModal() {
        addNoteModal.classList.remove("active");
        addNoteModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "auto";
        noteForm.reset();
        editingId = null;
    }

    function openEditModal(id) {
        const note = notes.find(n => n.id === id);
        if (!note) return;
        editingId = id;
        document.getElementById("modalTitle").textContent = "Edit Note";
        document.getElementById("noteTitle").value = note.title;
        document.getElementById("noteContent").value = note.content;
        const radio = document.querySelector('input[name="noteTag"][value="' + note.tag + '"]');
        if (radio) radio.checked = true;
        addNoteModal.classList.add("active");
        addNoteModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function openConfirmModal() {
        confirmModal.classList.add("active");
        confirmModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeConfirmModal() {
        confirmModal.classList.remove("active");
        confirmModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "auto";
        noteToDeleteId = null;
    }

    function handleNoteSubmit(e) {
        e.preventDefault();

        const title = document.getElementById("noteTitle").value.trim();
        const content = document.getElementById("noteContent").value.trim();
        const tag = document.querySelector('input[name="noteTag"]:checked').value;

        if (!title && !content) {
            alert("Please add a title or content for the note.");
            return;
        }

        if (editingId) {
            const idx = notes.findIndex(n => n.id === editingId);
            if (idx >= 0) {
                notes[idx].title = title;
                notes[idx].content = content;
                notes[idx].tag = tag;
                notes[idx].date = new Date().toISOString();
            }
        } else {
            const newNote = {
                id: "id_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
                title,
                content,
                tag,
                date: new Date().toISOString(),
            };
            notes.unshift(newNote);
        }

        saveNotes();
        renderNotes();
        closeAddNoteModal();
        updateEmptyState();
        filterNotes();
    }

    function confirmDeleteNote() {
        if (!noteToDeleteId) return;
        notes = notes.filter(n => n.id !== noteToDeleteId);
        saveNotes();
        renderNotes();
        updateEmptyState();
        filterNotes();
        closeConfirmModal();
    }

    function saveNotes() {
        localStorage.setItem("notes", JSON.stringify(notes));
    }

    function filterNotes() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;

        let filteredNotes = notes;

        if (searchTerm) {
            filteredNotes = filteredNotes.filter(
                (note) =>
                    (note.title || "").toLowerCase().includes(searchTerm) ||
                    (note.content || "").toLowerCase().includes(searchTerm)
            );
        }

        if (filterValue !== "all") {
            filteredNotes = filteredNotes.filter(
                (note) => note.tag === filterValue
            );
        }

        renderNotes(filteredNotes);
        updateEmptyState(filteredNotes);
    }

    function updateEmptyState(notesToCheck = notes) {
        emptyState.style.display = (!notesToCheck || notesToCheck.length === 0) ? "block" : "none";
    }

    function toggleDarkMode() {
        const isDark = document.body.classList.toggle("dark");
        localStorage.setItem("darkMode", isDark ? "true" : "false");
        darkModeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function exportNotes() {
        const data = JSON.stringify(notes, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mindspace-notes-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importNotes(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (evt) {
            try {
                const imported = JSON.parse(evt.target.result);
                if (!Array.isArray(imported)) throw new Error("Invalid file format");
                const clean = imported.map(item => ({
                    id: item.id || ("id_" + (item.date ? new Date(item.date).getTime() : Date.now()) + "_" + Math.floor(Math.random() * 1000)),
                    title: item.title || "",
                    content: item.content || "",
                    tag: item.tag || "ideas",
                    date: item.date || new Date().toISOString()
                }));
                if (confirm("Replace existing notes with imported notes? Click Cancel to merge.")) {
                    notes = clean;
                } else {
                    const existingIds = new Set(notes.map(n => n.id));
                    const filtered = clean.filter(n => !existingIds.has(n.id));
                    notes = clean.concat(notes);
                }
                saveNotes();
                renderNotes();
                updateEmptyState();
                filterNotes();
                importInput.value = "";
                alert("Import successful");
            } catch (err) {
                alert("Failed to import notes: " + err.message);
            }
        };
        reader.readAsText(file);
    }

    function addDragHandlers(el) {
        el.addEventListener("dragstart", (e) => {
            dragSrcId = el.dataset.id;
            el.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
            try { e.dataTransfer.setData("text/plain", dragSrcId); } catch { }
        });

        el.addEventListener("dragend", () => {
            dragSrcId = null;
            el.classList.remove("dragging");
            document.querySelectorAll(".drop-target").forEach(x => x.classList.remove("drop-target"));
        });

        el.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            el.classList.add("drop-target");
        });

        el.addEventListener("dragleave", () => {
            el.classList.remove("drop-target");
        });

        el.addEventListener("drop", (e) => {
            e.preventDefault();
            el.classList.remove("drop-target");
            const destId = el.dataset.id;
            const srcId = dragSrcId || (e.dataTransfer.getData("text/plain") || null);
            if (!srcId || srcId === destId) return;
            const srcIndex = notes.findIndex(n => n.id === srcId);
            const destIndex = notes.findIndex(n => n.id === destId);
            if (srcIndex < 0 || destIndex < 0) return;
            const [moved] = notes.splice(srcIndex, 1);
            notes.splice(destIndex, 0, moved);
            saveNotes();
            renderNotes();
        });
    }

    // View Note Modal Functions
    function openViewModal(note) {
        document.getElementById("viewNoteTitle").textContent = note.title;
        document.getElementById("viewNoteContent").textContent = note.content;
        viewNoteModal.classList.add("active");
        viewNoteModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeViewModal() {
        viewNoteModal.classList.remove("active");
        viewNoteModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "auto";
    }
});
