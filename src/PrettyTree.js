// Reference of the algorithm: https://llimllib.github.io/pymag-trees/

let distanceY = 80;
let distanceX = 100;

function findDfsTree(node, parent = undefined, depth = 0) {
  node.vis = 0;
  for (let child of node.children)
    if (child.vis === -1) {
      node.dfsTreeChildren.push(child);
      findDfsTree(child, node, depth + 1);
    }
}

function assign(node, parent = undefined, depth = 1, pos = 1) {
  node.vis = 1;
  node.x = -1;
  node.y = depth * distanceY;
  node.parent = parent;
  node.thread = undefined;
  node.offset = 0;
  node.ancestor = node;
  node.change = 0;
  node.shift = 0;
  node.leftmost = undefined;
  node.pos = pos;

  let i = 1;
  for (let child of node.children)
    if (child.vis === 0) {
      assign(child, node, depth + 1, i++);
    }
}

function left(node) {
  return node.thread || (node.children.length && node.children[0]);
}

function right(node) {
  return node.thread || (node.children.length && node.children[node.children.length - 1]);
}

function leftBrother(node) {
  if (node.parent === undefined)
    return undefined;
  let bro = undefined;
  for (let child of node.parent.children) {
    if (child === node) break;
    bro = child;
  }
  return bro;
}

function leftmostSibling(node) {
  if (node.leftmost === undefined && node.parent && node !== node.parent.children[0]) {
    node.leftmost = node.parent.children[0];
  }
  return node.leftmost;
}

function noChildrenLeft(node) {
  for (let child of node.children)
    if (child.vis === 1)
      return false;
  return true;
}

function buchheim(node) {
  node.vis = 2;
  if (noChildrenLeft(node)) {
    if (leftmostSibling(node)) {
      node.x = leftBrother(node).x + distanceX;
    } else {
      node.x = 0;
    }
  } else {
    let defaultAncestor = node.children[0];
    for (let child of node.children)
      if (child.vis === 1) {
        buchheim(child);
        defaultAncestor = apportion(child, defaultAncestor);
      }
    executeShifts(node);

    const mid = (node.children[0].x + node.children[node.children.length - 1].x) / 2;
    const bro = leftBrother(node);
    if (bro) {
      node.x = bro.x + distanceX;
      node.offset = node.x - mid;
    } else {
      node.x = mid;
    }
  }
}

function apportion(node, defaultAncestor) {
  const w = leftBrother(node);
  if (w !== undefined && w !== node) {
    let vir = node;
    let vor = node;
    let vil = w;
    let vol = leftmostSibling(node);
    let sir = node.offset;
    let sor = node.offset;
    let sil = vil.offset;
    let sol = vol.offset;
    while (right(vil) && left(vir)) {
      vil = right(vil);
      vir = left(vir);
      vol = left(vol);
      vor = right(vor);
      vor.ancestor = node;
      let shift = (vil.x + sil) - (vir.x + sir) + distanceX;
      if (shift > 0) {
        moveSubtree(ancestor(vil, node, defaultAncestor), node, shift);
        sir = sir + shift;
        sor = sor + shift;
      }
      sil += vil.offset;
      sir += vir.offset;
      sol += vol.offset;
      sor += vor.offset;
    }
    if (right(vil) && !right(vor)) {
      vor.thread = right(vil);
      vor.offset += sil - sor;
    } else {
      if (left(vir) && !left(vol)) {
        vol.thread = left(vir);
        vol.offset += sir - sol;
      }
      defaultAncestor = node;
    }
  }
  return defaultAncestor;
}

function moveSubtree(wl, wr, shift) {
  if (wl !== undefined && wr !== undefined) {
    let subtrees = wr.pos - wl.pos;
    wr.change -= shift / subtrees;
    wr.shift += shift;
    wl.change += shift / subtrees;
    wr.x += shift;
    wr.offset += shift;
  }
}

function executeShifts(node) {
  let shift = 0;
  let change = 0;
  for (let i = node.children.length - 1; i >= 0; i--) {
    let child = node.children[i];
    child.x += shift;
    child.offset += shift;
    change += child.change;
    shift += child.shift + change;
  }
}

function ancestor(vil, node, defaultAncestor) {
  if (node.parent === undefined)
    return defaultAncestor;
  const isChild = node.parent.children.includes((node) => {
    return node.id === vil.ancestor.id;
  });
  return isChild ? vil.ancestor : defaultAncestor;
}

function dfs(node, m = distanceX, depth = 1) {
  node.x += m;
  node.vis = 3;

  let treeRange = {
    mn: node.x,
    mx: node.x
  };

  for (let child of node.children)
    if (child.vis === 2) {
      let childTreeRange = dfs(child, m + node.offset, depth + 1);
      treeRange.mn = Math.min(treeRange.mn, childTreeRange.mn);
      treeRange.mx = Math.max(treeRange.mx, childTreeRange.mx);
    }
  // console.log(node.id, treeRange);

  return treeRange;
}

function moveTree(node, mn) {
  node.x += mn;
  node.vis = 4;
  for (let child of node.children)
    if (child.vis === 3) {
      moveTree(child, mn);
    }
}

function addEdgesToTheList(nodes, edges) {
  for (let node of nodes) {
    node.children = [];
    node.dfsTreeChildren = [];
    node.vis = -1;
  }

  // add edges to the tree
  for (let edge of edges) {
    const node = nodes.find(node => {
      return node.id === edge[0].from;
    });
    const child = nodes.find(node => {
      return node.id === edge[0].to;
    });
    node.children.push(child);
    child.children.push(node);
  }
}

export function getComponentFrom(startingNodeId, nodes, edges) {
  addEdgesToTheList(nodes, edges);

  let component = new Set();

  function dfs(node) {
    component.add(node.id);
    node.vis = 1;
    for (let child of node.children)
      if (child.vis === -1) {
        dfs(child);
      }
  }

  let startingNode = nodes.find((node) => node.id === startingNodeId);
  dfs(startingNode);

  return component;
}

export function prettyTree(props, callback) {
  const { drawGraph, likeTree, nodes, edges } = props;

  distanceY = 90;
  distanceX = 80;

  const byLabel = (a, b) => {
    if (a.label < b.label)
      return -1;
    if (a.label > b.label)
      return 1;
    return 0;
  }

  if (likeTree) {
    addEdgesToTheList(nodes, edges);

    if (!drawGraph) {
      // Drawing a trie
      for (let node of nodes)
        node.children.sort(byLabel);
    }

    // find the dfs tree
    for (let node of nodes) {
      if (node.vis === -1)
        findDfsTree(node);
    }

    // change the children with the dfsTreeChildren
    for (let node of nodes) {
      node.children = node.dfsTreeChildren;
      delete node.dfsTreeChildren;
    }

    // algorithm of buchheim for a pretty tree
    let sum = 0;
    for (let node of nodes)
      if (node.vis === 0) {
        assign(node);
        buchheim(node);

        // define the current tree range
        let treeRange = dfs(node);
        let width = treeRange.mx - treeRange.mn;

        // console.log(treeRange, width);

        if (width >= 0) {
          moveTree(node, sum);
          sum += width;
        }
        sum += distanceX;
      }
  }

  callback();
}
