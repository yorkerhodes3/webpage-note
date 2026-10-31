(() => {
  "use strict";

  const config = window.WebpageNoteConfig;
  if (!config || config.enabled !== true) return;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(config.repository || "")) {
    console.error("Webpage Note requires a repository in owner/repo format.");
    return;
  }
  if (document.getElementById("webpage-note")) return;

  const start = () => {
    if (document.getElementById("webpage-note")) return;
    const page = new URL(window.location.href);
    page.search = "";
    page.hash = "";
    const storageKey = `webpage-note:${config.repository}:${page.href}`;
    let notes = [];
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) {
        notes = saved.filter(note =>
          note && typeof note.selector === "string" &&
          typeof note.text === "string" && typeof note.comment === "string"
        );
      }
    } catch {
      // The widget also works when browser storage is unavailable.
    }

    const host = document.createElement("div");
    host.id = "webpage-note";
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      :host { all: initial; }
      dialog { font: 16px/1.5 system-ui, sans-serif; color: #172033;
        background: white; border: 1px solid #64748b; border-radius: 10px;
        padding: 20px; width: min(420px, calc(100vw - 64px)); }
      dialog::backdrop { background: #0006; }
      h2 { margin: 0 0 12px; font-size: 20px; }
      p { overflow-wrap: anywhere; }
      label { display: block; font-weight: 600; }
      textarea { box-sizing: border-box; width: 100%; min-height: 120px;
        margin: 8px 0; padding: 8px; font: inherit; }
      button { padding: 8px 12px; margin: 4px; cursor: pointer; font: inherit; }
      .marker { position: fixed; z-index: 2147483646; background: #fef08a;
        color: #172033; border: 2px solid #854d0e; border-radius: 50%;
        width: 30px; height: 30px; padding: 0; margin: 0; font-size: 14px; }
      .status { font-size: 14px; }
    `;
    root.append(style);

    const dialog = document.createElement("dialog");
    dialog.setAttribute("aria-labelledby", "note-heading");
    const heading = document.createElement("h2");
    heading.id = "note-heading";
    heading.textContent = "Comment on this page";
    const context = document.createElement("p");
    const label = document.createElement("label");
    label.htmlFor = "note-comment";
    label.textContent = "Comment";
    const input = document.createElement("textarea");
    input.id = "note-comment";
    input.maxLength = 4000;
    const privacy = document.createElement("p");
    privacy.className = "status";
    privacy.textContent = "Review the captured text before sharing. URL query parameters are omitted. GitHub opens in a new tab; you must submit the issue there.";
    const issueText = document.createElement("textarea");
    issueText.readOnly = true;
    issueText.hidden = true;
    issueText.setAttribute("aria-label", "Issue text to copy into GitHub");
    const status = document.createElement("p");
    status.className = "status";
    status.setAttribute("role", "status");
    const save = document.createElement("button");
    save.textContent = "Save locally";
    const publish = document.createElement("button");
    publish.textContent = "Open GitHub issue";
    const remove = document.createElement("button");
    remove.textContent = "Delete local note";
    const close = document.createElement("button");
    close.textContent = "Close";
    dialog.append(heading, context, label, input, privacy, issueText, status, save, publish, remove, close);
    root.append(dialog);

    let current = null;
    let activeIndex = -1;
    let previousFocus = null;
    const markers = [];

    const selectorFor = element => {
      const parts = [];
      while (element && element !== document.documentElement) {
        if (element.id) {
          parts.unshift(`#${CSS.escape(element.id)}`);
          break;
        }
        let index = 1;
        for (let sibling = element.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
          if (sibling.localName === element.localName) index++;
        }
        parts.unshift(`${CSS.escape(element.localName)}:nth-of-type(${index})`);
        element = element.parentElement;
      }
      return parts.join(" > ") || "html";
    };

    const open = (note, index = -1) => {
      previousFocus = document.activeElement;
      current = { ...note };
      activeIndex = index;
      context.textContent = `${note.selector}\n${note.text}`;
      input.value = note.comment;
      status.textContent = "";
      issueText.hidden = true;
      remove.hidden = index < 0;
      dialog.showModal();
      input.focus();
    };

    const positionMarkers = () => {
      markers.forEach(({ button, selector }) => {
        let target;
        try {
          target = document.querySelector(selector);
        } catch {
          button.hidden = true;
          return;
        }
        if (!target) {
          button.hidden = true;
          return;
        }
        const rect = target.getBoundingClientRect();
        button.hidden = !target.getClientRects().length ||
          rect.bottom < 0 || rect.top > window.innerHeight ||
          rect.right < 0 || rect.left > window.innerWidth;
        button.style.left = `${Math.max(0, Math.min(window.innerWidth - 30, rect.right - 30))}px`;
        button.style.top = `${Math.max(0, Math.min(window.innerHeight - 30, rect.top))}px`;
      });
    };

    const render = () => {
      markers.forEach(({ button }) => button.remove());
      markers.length = 0;
      notes.forEach((note, index) => {
        const button = document.createElement("button");
        button.className = "marker";
        button.textContent = String(index + 1);
        button.title = `Local note: ${note.comment}`;
        button.setAttribute("aria-label", `Open local note ${index + 1}: ${note.comment}`);
        button.addEventListener("click", () => open(note, index));
        root.append(button);
        markers.push({ button, selector: note.selector });
      });
      positionMarkers();
    };

    const persist = () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(notes));
        status.textContent = "Saved in this browser only. Not yet posted to GitHub.";
      } catch {
        status.textContent = "Browser storage is unavailable. This note will be lost on reload.";
      }
      render();
    };

    const saveNote = () => {
      const comment = input.value.trim();
      if (!comment) {
        status.textContent = "Enter a comment first.";
        input.focus();
        return false;
      }
      current.comment = comment;
      if (activeIndex < 0) {
        activeIndex = notes.length;
        notes.push({ ...current });
      } else {
        notes[activeIndex] = { ...current };
      }
      remove.hidden = false;
      persist();
      return true;
    };

    save.addEventListener("click", saveNote);
    publish.addEventListener("click", () => {
      if (!saveNote()) return;
      const metadata = JSON.stringify({
        tool: "webpage-note",
        version: 1,
        url: page.href,
        selector: current.selector,
        text: current.text
      }, null, 2);
      // Escape backticks so captured page content cannot close the metadata fence.
      const body = [
        "## Website review",
        "",
        current.comment,
        "",
        "## Page context",
        "",
        "```json",
        metadata.replace(/`/g, "\\u0060"),
        "```",
        "",
        "Review this feedback and implement the requested changes in the website repository."
      ].join("\n");
      const url = new URL(`https://github.com/${config.repository}/issues/new`);
      url.searchParams.set("title", `[Website review] ${(document.title || page.pathname).slice(0, 100)}`);
      url.searchParams.set("body", body);
      const needsCopy = url.href.length > 7500;
      issueText.hidden = !needsCopy;
      if (needsCopy) {
        issueText.value = body;
        url.searchParams.delete("body");
      }
      window.open(url.href, "_blank", "noopener,noreferrer");
      status.textContent = needsCopy
        ? "This note is too long for a prefilled URL. Copy the issue text field above and paste it into the GitHub issue body, then submit there."
        : "GitHub issue form opened. Submit it on GitHub to share this note; the local copy is retained.";
    });
    remove.addEventListener("click", () => {
      if (activeIndex < 0) return;
      notes.splice(activeIndex, 1);
      persist();
      dialog.close();
    });
    close.addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    });
    document.addEventListener("contextmenu", event => {
      if (event.shiftKey || event.composedPath().includes(host)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      event.preventDefault();
      if (dialog.open) return;
      const selected = window.getSelection()?.toString().trim();
      open({
        selector: selectorFor(target),
        text: (selected || target.textContent || "").trim().slice(0, 1000),
        comment: ""
      });
    });
    let scheduled = false;
    const schedulePositions = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        positionMarkers();
      });
    };
    window.addEventListener("scroll", schedulePositions, true);
    window.addEventListener("resize", schedulePositions);
    render();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
