const DEFAULT_WIDTH = 200;
const DEFAULT_HEIGHT = 200;
let tabindex = 0;
const state = {};
function generateId() {
  return Math.floor(Math.random() * 1000000);
}
function addNode({
  renderData = {},
  relationships = { parents: [], children: [] },
  content = "",
  id = generateId(),
}) {
  const node = {
    id,
    renderData,
    relationships,
    content,
    nodeEl: null,
  };
  node.addRelationship = ({ child, type }) => {
    addRelationship({ parent: node, child, type });
    return node;
  };
  node.renderNode = () => {
    renderNode(node);
    return node;
  };
  node.move = (left, top) => {
    node.renderData.top = top + "px";
    node.renderData.left = left + "px";
    node.renderNode();
    return node;
  };
  node.relMove = (left, top) => {
    const absTop = pxToNum(node.renderData.top) + top;
    const absLeft = pxToNum(node.renderData.left) + left;
    node.move(absLeft, absTop);
    return node;
  };
  node.setNodeElement = () => {
    setNodeElement(node);
    return node;
  };
  node.delete = () => {
    deleteNode(node);
    deleteRelationships(node);
  };
  node.moveCameraToNode = () => {
    const xScroll =
      pxToNum(node.renderData.left) -
      window.screen.availWidth / 2 +
      pxToNum(node.renderData.width);
    const yScroll =
      pxToNum(node.renderData.top) -
      window.screen.availHeight / 2 +
      pxToNum(node.renderData.height);
    window.scroll({ left: xScroll, top: yScroll, behavior: "smooth" });
    return node;
  };
  node.setFocusedNode = () => {
    if (getFocusedNode() && getFocusedNode().nodeEl) {
      getFocusedNode().nodeEl.classList.remove("focused");
    }
    state.focusedNode = node;
    state.editNode = null;
    function setFocusedClass() {
      if (node.nodeEl) {
        node.nodeEl.classList.add("focused");
        contextMenu.reposition();
      } else {
        setTimeout(setFocusedClass, 100);
      }
    }
    setFocusedClass();
    return node;
  };
  node.setEditNode = (focus = true) => {
    if (state.focusedNode === node) {
      if (node.nodeEl) {
        if (focus) {
          state.editNode = node;
          node.nodeEl.classList.add("edit-mode");
          node.nodeEl.querySelector(".thought-content").focus();
          document.execCommand("selectAll", false, null);
          contextMenu.activateLayer("edit");
        } else {
          state.editNode = null;
          node.nodeEl.classList.remove("edit-mode");
          node.nodeEl.querySelector(".thought-content").blur();
          contextMenu.activateLayer("base");
          if (window.getSelection) {
            window.getSelection().removeAllRanges();
          } else if (document.selection) {
            document.selection.empty();
          }
        }
      }
    }
    return node;
  };
  state[node.id] = node;
  return node;
}
function addRelationship({ parent, child, type }) {
  if (["parallel", "sub", "progression"].includes(type)) {
    if (state[parent.id] && state[child.id]) {
      state[parent.id].relationships.children.push({
        childId: child.id,
        type,
      });
      state[child.id].relationships.parents.push({ parentId: parent.id });
      renderRelationship({ parent, child, type });
    } else {
      throw new Error("addRelationship: Could not find child.");
    }
  } else {
    throw new Error(`addRelationship: Invalid subtype "${type}".`);
  }
}
function deleteNode(node) {
  node.nodeEl.style.display = "none";
  node.renderData.display = "none";
  node.nodeEl.tabIndex = null;
}
function deleteRelationships(node) {
  const lines = Array.from(
    document.querySelectorAll(`.child-id-${node.id}, .parent-id-${node.id}`)
  );
  lines.forEach((l) => (l.style.display = "none"));
}
function renderRelationship({ parent, child, type }) {
  let line = document.getElementById(`relationship-${parent.id}-${child.id}`);
  let decorator = document.getElementById(`decorator-${parent.id}-${child.id}`);
  if (!line) {
    line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttributeNS(null, "stroke", "#333");
    line.setAttributeNS(null, "stroke-width", "2");
    line.setAttributeNS(null, "fill", "none");
    line.classList.add(`child-id-${child.id}`);
    line.classList.add(`parent-id-${parent.id}`);
    line.classList.add("relationship");
    document.getElementById("relationship-layer").appendChild(line);
    line.setAttribute("id", `relationship-${parent.id}-${child.id}`);
  }
  const decoratorTypeToTag = {
    sub: "circle",
    progression: "path",
  };
  if (!decorator && decoratorTypeToTag[type]) {
    decorator = document.createElementNS(
      "http://www.w3.org/2000/svg",
      decoratorTypeToTag[type]
    );
    decorator.setAttribute("id", `decorator-${parent.id}-${child.id}`);
    decorator.setAttributeNS(null, "stroke", "#666");
    decorator.setAttributeNS(null, "stroke-width", "2");
    decorator.setAttributeNS(null, "fill", "#666");
    decorator.classList.add(`child-id-${child.id}`);
    decorator.classList.add(`parent-id-${parent.id}`);
    decorator.classList.add("decorator");
    document.getElementById("relationship-layer").appendChild(decorator);
  }
  if (
    parent.renderData.display === "none" ||
    child.renderData.display === "none"
  ) {
    line.style.display = "none";
    if (decorator) {
      decorator.style.display = "none";
    }
  } else if (line.style.display === "none") {
    line.style.display = "block";
    if (decorator) {
      decorator.style.display = "block";
    }
  }
  const cloneParent = { ...parent };
  const cloneChild = { ...child };
  [cloneParent, cloneChild].forEach((source) => {
    Object.entries(source.renderData).forEach(([k, v]) => {
      if (["top", "width", "height", "left"].includes(k)) {
        source.renderData[k] = pxToNum(v);
      }
    });
  });
  let {
    renderData: { top: pTop, width: pWidth, height: pHeight, left: pLeft },
  } = cloneParent;
  let {
    renderData: { top: cTop, width: cWidth, height: cHeight, left: cLeft },
  } = cloneChild;
  const p1 = {
    x: pLeft + pWidth / 2,
    y: pTop + pHeight / 2,
  };
  const p2 = {
    x: cLeft + cWidth / 2,
    y: cTop + cHeight / 2,
  };
  function getDecoratorCoordinates(type) {
    const start = {};
    const m = (p2.y - p1.y) / (p2.x - p1.x);
    const xInverter = p2.x >= p1.x ? 1 : -1;
    const yInverter = p2.y >= p1.y ? 1 : -1;
    if (-pHeight / pWidth <= m && m <= pHeight / pWidth) {
      start.x = p1.x + (xInverter * pWidth) / 2;
    } else {
      start.y = p1.y + (yInverter * pHeight) / 2;
    }
    if (!start.x) {
      start.x = p1.x + (yInverter * pWidth) / m / 2;
    }
    if (!start.y) {
      start.y = p1.y + (xInverter * m * pHeight) / 2;
    }
    const end = {};
    if (-cHeight / cWidth <= m && m <= cHeight / cWidth) {
      end.x = p2.x - (xInverter * cWidth) / 2;
    } else {
      end.y = p2.y - (yInverter * cHeight) / 2;
    }
    if (!end.x) {
      end.x = p2.x - (yInverter * cWidth) / m / 2;
    }
    if (!end.y) {
      end.y = p2.y - (xInverter * m * cHeight) / 2;
    }
    return { start, end };
  }
  function setDecorator() {
    const { start, end } = getDecoratorCoordinates();

    if (type === "sub") {
      decorator.setAttributeNS(null, "cx", start.x);
      decorator.setAttributeNS(null, "cy", start.y);
      decorator.setAttributeNS(null, "r", 8);
    } else if (type === "progression") {
      const theta = -Math.atan((end.y - start.y) / (end.x - start.x));
      const inverter = end.x >= start.x ? 1 : -1;
      const thetaOffset = (inverter * (70 * Math.PI)) / 180;
      const point1 = `${end.x - 20 * Math.sin(theta + thetaOffset)}, ${
        end.y - 20 * Math.cos(theta + thetaOffset)
      }`;
      const point2 = `${end.x + 20 * Math.sin(theta - thetaOffset)}, ${
        end.y + 20 * Math.cos(theta - thetaOffset)
      }`;
      decorator.setAttributeNS(
        null,
        "d",
        `M${end.x} ${end.y} L${point1} L${point2} Z`
      );
    }
  }
  line.setAttributeNS(null, "d", `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`);
  setDecorator();
}
function setNodeElement(node) {
  if (!node.nodeEl) {
    const nodeEl = document.createElement("div");
    nodeEl.classList.add("thought-node");
    nodeEl.tabIndex = tabindex;
    tabindex++;
    Object.entries(node.renderData).forEach(([k, v]) => {
      nodeEl.style[k] = v;
    });
    nodeEl.innerHTML = `<div class="thought-content" contenteditable>${
      node.content || "Write something here"
    }</div>`;
    nodeEl
      .querySelector(".thought-content")
      .addEventListener("input", (event) => {
        node.content = event.target.innerText;
      });
    nodeEl.setAttribute("id", `node-${node.id}`);
    nodeEl.addEventListener("click", () => {
      node.setFocusedNode().setEditNode();
    });
    document.getElementById("graph-wrapper").appendChild(nodeEl);
    node.nodeEl = nodeEl;
  }
  return node.nodeEl;
}
function renderNode({ id, renderData, nodeEl, content, relationships }) {
  Object.entries(renderData).forEach(([k, v]) => {
    nodeEl.style[k] = v;
  });
  const self = state[id];
  nodeEl.querySelector(".thought-content").innerText = content;
  relationships.children.forEach((child) => {
    renderRelationship({
      parent: self,
      child: state[child.childId],
      type: child.type,
    });
  });
  relationships.parents.forEach((parent) => {
    const type = state[parent.parentId].relationships.children.find(
      ({ childId }) => childId === id
    ).type;
    renderRelationship({ parent: state[parent.parentId], child: self, type });
  });
}

function pxToNum(px) {
  return Number(px.toString().replace("px", ""));
}
function getFocusedNode() {
  return state.focusedNode && state[state.focusedNode.id];
}
