let listenToBaseLayer = true;
let shiftDown = false;
contextMenu.activateLayer("base").toggleMinimized();
window.addEventListener("keydown", (event) => {
  if (event.key === "Shift") {
    shiftDown = true;
    if (listenToBaseLayer) {
      contextMenu.activateLayer("modifiers");
    }
  }
});
window.addEventListener("keyup", (event) => {
  if (event.key === "Shift") {
    shiftDown = false;
    if (contextMenu.activeLayer === "modifiers" && listenToBaseLayer) {
      contextMenu.activateLayer(contextMenu.previousLayer);
    }
  }
  if (event.key === "Tab") {
    setTimeout(document.activeElement.click(), 50);
  }
  if (!listenToBaseLayer) {
    return;
  }
  if (getFocusedNode()) {
    if (!state.editNode) {
      if (event.key === "e") {
        getFocusedNode().setEditNode();
        contextMenu.activateLayer("edit");
      } else if (event.key === "Delete") {
        getFocusedNode().delete();
      } else if (!shiftDown) {
        if (event.key === "ArrowRight") {
          addNodeToGraph([1, 0]);
        } else if (event.key === "ArrowLeft") {
          addNodeToGraph([-1, 0]);
        } else if (event.key === "ArrowUp") {
          addNodeToGraph([0, -1]);
        } else if (event.key === "ArrowDown") {
          addNodeToGraph([0, 1]);
        } else if (event.key === "d") {
          addNodeToGraph([1, 0], DEFAULT_OFFSET, "progression");
        } else if (event.key === "a") {
          addNodeToGraph([-1, 0], DEFAULT_OFFSET, "progression");
        } else if (event.key === "w") {
          addNodeToGraph([0, -1], DEFAULT_OFFSET, "progression");
        } else if (event.key === "s") {
          addNodeToGraph([0, 1], DEFAULT_OFFSET, "progression");
        } else if (event.key === "m") {
          contextMenu.toggleMinimized();
        } else if (event.key === "c") {
          contextMenu.activateLayer("create");
        } else if (event.key === "Escape") {
          contextMenu.activateLayer("base");
        }
      } else if (shiftDown) {
        if (event.key === "ArrowLeft") {
          getFocusedNode().relMove(-SHIFT_SIZE, 0).moveCameraToNode();
          contextMenu.reposition();
        } else if (event.key === "ArrowRight") {
          getFocusedNode().relMove(SHIFT_SIZE, 0).moveCameraToNode();
          contextMenu.reposition();
        } else if (event.key === "ArrowDown") {
          getFocusedNode().relMove(0, SHIFT_SIZE).moveCameraToNode();
          contextMenu.reposition();
        } else if (event.key === "ArrowUp") {
          getFocusedNode().relMove(0, -SHIFT_SIZE).moveCameraToNode();
          contextMenu.reposition();
        } else if (event.key === "G") {
          addGlobalJumpListener();
        } else if (event.key === "J") {
          addRelativeJumpListener("children", getFocusedNode());
        } else if (event.key === "K") {
          addRelativeJumpListener("parents", getFocusedNode());
        }
      }
    } else if (event.key === "Escape") {
      state.focusedNode.setEditNode(false);
      contextMenu.activateLayer("base");
    }
  } else {
    contextMenu.hide();
  }
});
function addRelativeJumpListener(relativeType, self) {
  const relatives = getFocusedNode().relationships[relativeType];
  if (relatives && relatives.length > 1) {
    listenToBaseLayer = false;
    contextMenu.activateLayer(
      relativeType === "children" ? "jumpChild" : "jumpParent"
    );
    createRelativeNavigationBoxes(relatives, self);
    window.addEventListener("keyup", jumpListener);
  } else if (relatives) {
    focusNode(0);
  }
  function jumpListener(event) {
    if (event.key !== "Escape" && event.key !== "Shift") {
      try {
        focusNode(Number(event.key));
      } catch (_) {}
    }
    if (event.key !== "Shift") {
      removeNavigationBoxes();
      window.removeEventListener("keyup", jumpListener);
      listenToBaseLayer = true;
      contextMenu.activateLayer("base");
    }
  }
  function focusNode(index) {
    contextMenu.reposition().activateLayer("base");
    const selectedRelative = relatives[index];
    const selectedNode =
      state[selectedRelative.childId || selectedRelative.parentId];
    selectedNode.setFocusedNode().moveCameraToNode();
  }
}
function addGlobalJumpListener() {
  contextMenu.activateLayer("jumpGlobal");
  createGlobalNavigationBoxes();
  window.addEventListener("keyup", jumpListener);
  listenToBaseLayer = false;
  let index = "";
  function jumpListener(event) {
    try {
      if (event.key !== "G") {
        if (!isNaN(Number(event.key))) {
          index += event.key;
        }
      } else {
        index = Number(index);
        const selectedNode = Object.values(state)[index];
        selectedNode.setFocusedNode().moveCameraToNode();
        contextMenu.reposition().activateLayer("base");
      }
    } catch (_) {}
    if (event.key === "Escape" || event.key === "G") {
      removeNavigationBoxes();
      contextMenu.activateLayer("base");
      listenToBaseLayer = true;
      window.removeEventListener("keyup", jumpListener);
    }
  }
}
function createGlobalNavigationBoxes() {
  const elements = Object.keys(state).map((k) =>
    document.getElementById(`node-${k}`)
  );
  createNavigationBoxes(elements);
}
function createRelativeNavigationBoxes(relatives, self) {
  const decorators = relatives.map(({ childId, parentId }) => {
    const id = "decorator-parentId-childId"
      .replace("childId", childId || self.id)
      .replace("parentId", parentId || self.id);
    return document.getElementById(id);
  });
  createNavigationBoxes(decorators);
}
function createNavigationBoxes(elements) {
  elements.forEach((d, index) => {
    if (d) {
      const { x, y, height, width } = d.getBoundingClientRect();
      const navBox = document.createElement("div");
      navBox.innerText = index;
      navBox.style.left = x + window.scrollX + width / 2 + "px";
      navBox.style.top = y + window.scrollY + height / 2 + "px";
      navBox.classList.add("navigation-box");
      document.body.appendChild(navBox);
    }
  });
}
function removeNavigationBoxes() {
  Array.from(document.querySelectorAll(".navigation-box")).forEach((box) => {
    box.parentNode.removeChild(box);
  });
}
function addNodeToGraph(offsetVector, offset = DEFAULT_OFFSET, type = "sub") {
  const { x: initX, y: initY } = getRelativePosition(
    getFocusedNode(),
    offsetVector,
    -offset / 2
  );
  const initPos = {
    top: initY + "px",
    left: initX + "px",
    height: DEFAULT_HEIGHT + "px",
    width: DEFAULT_WIDTH + "px",
  };
  const typeToContent = {
    sub: "Add a supplementary thought",
    progression: "Continue this train of thought",
  };
  const newNode = addNode({
    renderData: initPos,
    content: typeToContent[type],
  }).setNodeElement();
  getFocusedNode().addRelationship({ child: newNode, type });
  const { x: finalX, y: finalY } = getRelativePosition(
    state.focusedNode,
    offsetVector,
    offset
  );
  setTimeout(() => {
    newNode
      .move(finalX, finalY)
      .moveCameraToNode()
      .setFocusedNode()
      .setEditNode();
    contextMenu.activateLayer("base").reposition();
  }, 0);
}
function getRelativePosition(
  { renderData },
  [xOffset, yOffset],
  offset = DEFAULT_OFFSET
) {
  return {
    x:
      pxToNum(renderData.left) +
      offsetDistanceFromEdge(renderData.width, xOffset, offset),
    y:
      pxToNum(renderData.top) +
      offsetDistanceFromEdge(renderData.height, yOffset, offset),
  };
  function offsetDistanceFromEdge(
    edgeLengthPx,
    offsetCoefficient,
    offsetMagnitude
  ) {
    return (
      offsetCoefficient * offsetMagnitude +
      (offsetCoefficient !== 0 ? offsetCoefficient * pxToNum(edgeLengthPx) : 0)
    );
  }
}
