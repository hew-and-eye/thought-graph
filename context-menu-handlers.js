const menuLayers = {};

const contextMenu = {
  menuEl: getContextMenu(),
  reposition() {
    repositionContextMenu();
    return contextMenu;
  },
  hide() {
    hideContextMenu();
    return contextMenu;
  },
  addLayer(layer) {
    addContextMenuLayer(layer);
    return contextMenu;
  },
  activateLayer(name) {
    this.previousLayer = this.activeLayer;
    this.activeLayer = name;
    activateContextMenuLayer(name);
    return contextMenu;
  },
  toggleMinimized() {
    this.minimized = !this.minimized;
    if (this.minimized) {
      this.menuEl.classList.add("minimized");
      this.menuEl.innerHTML = '<span class="key-icon">m</span>';
    } else {
      this.activateLayer(this.activeLayer);
      this.menuEl.classList.remove("minimized");
    }
    return contextMenu;
  },
  minimized: false,
  activeLayer: null,
  previousLayer: null,
};
contextMenu.addLayer({
  name: "base",
  entries: [
    { icons: ["e"], description: "Edit" },
    { icons: ["c"], description: "Create" },
    { icons: ["Shift"], description: "Modifiers" },
    { icons: ["m"], description: "Hide menu" },
  ],
});
contextMenu.addLayer({
  name: "edit",
  entries: [{ icons: ["Esc"], description: "Finish edit" }],
});
contextMenu.addLayer({
  name: "create",
  entries: [
    { icons: ["wasd"], description: "Follow-up" },
    {
      icons: ["&#8593;&#8592;&#8595;&#8594;"],
      description: "Subthought",
    },
    { icons: ["ijkl"], description: "Unrelated" },
    { icons: ["Esc"], description: "Cancel" },
  ],
});
contextMenu.addLayer({
  name: "jumpChild",
  entries: [
    { icons: ["0-9"], description: "Select child" },
    { icons: ["Esc"], description: "Cancel" },
  ],
});
contextMenu.addLayer({
  name: "jumpParent",
  entries: [
    { icons: ["0-9"], description: "Select parent" },
    { icons: ["Esc"], description: "Cancel" },
  ],
});
contextMenu.addLayer({
  name: "jumpGlobal",
  entries: [
    { icons: ["0-99"], description: "Select node" },
    { icons: ["Shift", "g"], description: "Go to node" },
    { icons: ["Esc"], description: "Cancel" },
  ],
});
contextMenu.addLayer({
  name: "modifiers",
  entries: [
    {
      icons: ["&#8593;&#8592;&#8595;&#8594;"],
      description: "Move",
    },
    { icons: ["j"], description: "Jump to child" },
    { icons: ["k"], description: "Jump to parent" },
    { icons: ["g"], description: "Jump to any node" },
  ],
});
function repositionContextMenu() {
  const contextMenu = getContextMenu();
  if (getFocusedNode()) {
    const {
      renderData: { top, left, width },
    } = getFocusedNode();
    contextMenu.style.left = pxToNum(left) + pxToNum(width) + 10 + "px";
    contextMenu.style.top = Math.max(pxToNum(top) - 40, 0) + "px";
    contextMenu.style.pointerEvents = "auto";
    contextMenu.style.opacity = 1;
  } else {
    hideContextMenu();
  }
}

function getContextMenu() {
  return document.getElementById("context-menu");
}

function hideContextMenu() {
  const contextMenu = getContextMenu();
  if (contextMenu) {
    contextMenu.style.opacity = 0;
    contextMenu.style.pointerEvents = "none";
  }
}

function addContextMenuLayer({ name, entries = [] }) {
  const keyIconTemplate = '+ <span class="key-icon">ICON</span>';
  const menuEntryTemplate = `<p class="context-menu-entry">
      <span class="key-icons-wrapper">ICONS</span>
      <span class="description">DESCRIPTION</span>
    <p>`;
  let entryHtml = "";
  entries.forEach(({ icons, description }) => {
    let iconHtml = "";
    icons.forEach(
      (icon) => (iconHtml += keyIconTemplate.replace("ICON", icon))
    );
    iconHtml = iconHtml.replace("+", "");
    entryHtml += menuEntryTemplate
      .replace("ICONS", iconHtml)
      .replace("DESCRIPTION", description);
  });
  menuLayers[name] = entryHtml;
}

function activateContextMenuLayer(name) {
  if (menuLayers[name]) {
    if (!contextMenu.minimized) {
      getContextMenu().innerHTML = menuLayers[name];
    }
  }
}
