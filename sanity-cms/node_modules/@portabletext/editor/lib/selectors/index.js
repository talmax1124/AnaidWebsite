import { getSelectionStartPoint, getSelectionEndPoint, getFocusTextBlock, getFocusChild, getFocusBlock, getSelectionText } from "../_chunks-es/selector.is-at-the-start-of-block.js";
import { getActiveAnnotations, getActiveListItem, getActiveStyle, getCaretWordSelection, getFirstBlock, getFocusBlockObject, getFocusInlineObject, getFocusListBlock, getFocusSpan, getLastBlock, getMarkState, getNextBlock, getNextInlineObject, getNextSpan, getPreviousBlock, getPreviousInlineObject, getPreviousSpan, getSelectedBlocks, getSelectedSpans, getSelectedTextBlocks, getSelectedValue, getSelectionEndBlock, getSelectionStartBlock, isActiveAnnotation, isActiveDecorator, isActiveListItem, isActiveStyle, isAtTheEndOfBlock, isAtTheStartOfBlock, isOverlappingSelection, isPointAfterSelection, isPointBeforeSelection, isSelectingEntireBlocks, isSelectionCollapsed, isSelectionExpanded } from "../_chunks-es/selector.is-at-the-start-of-block.js";
import { getBlockKeyFromSelectionPoint, getChildKeyFromSelectionPoint, spanSelectionPointToBlockOffset, getSelectionEndPoint as getSelectionEndPoint$1, getSelectionStartPoint as getSelectionStartPoint$1, getBlockEndPoint, getBlockStartPoint } from "../_chunks-es/util.slice-blocks.js";
import { isTextBlock, isSpan } from "@portabletext/schema";
import { isPortableTextSpan, isKeySegment } from "@sanity/types";
const getAnchorBlock = (snapshot) => {
  if (!snapshot.context.selection)
    return;
  const key = getBlockKeyFromSelectionPoint(snapshot.context.selection.anchor), index = key ? snapshot.blockIndexMap.get(key) : void 0, node = index !== void 0 ? snapshot.context.value.at(index) : void 0;
  return node && key ? {
    node,
    path: [{
      _key: key
    }]
  } : void 0;
}, getAnchorTextBlock = (snapshot) => {
  const anchorBlock = getAnchorBlock(snapshot);
  return anchorBlock && isTextBlock(snapshot.context, anchorBlock.node) ? {
    node: anchorBlock.node,
    path: anchorBlock.path
  } : void 0;
}, getAnchorChild = (snapshot) => {
  if (!snapshot.context.selection)
    return;
  const anchorBlock = getAnchorTextBlock(snapshot);
  if (!anchorBlock)
    return;
  const key = getChildKeyFromSelectionPoint(snapshot.context.selection.anchor), node = key ? anchorBlock.node.children.find((span) => span._key === key) : void 0;
  return node && key ? {
    node,
    path: [...anchorBlock.path, "children", {
      _key: key
    }]
  } : void 0;
}, getAnchorSpan = (snapshot) => {
  const anchorChild = getAnchorChild(snapshot);
  return anchorChild && isPortableTextSpan(anchorChild.node) ? {
    node: anchorChild.node,
    path: anchorChild.path
  } : void 0;
}, getBlockOffsets = (snapshot) => {
  if (!snapshot.context.selection)
    return;
  const selectionStartPoint = getSelectionStartPoint(snapshot), selectionEndPoint = getSelectionEndPoint(snapshot);
  if (!selectionStartPoint || !selectionEndPoint)
    return;
  const start = spanSelectionPointToBlockOffset({
    context: snapshot.context,
    selectionPoint: selectionStartPoint
  }), end = spanSelectionPointToBlockOffset({
    context: snapshot.context,
    selectionPoint: selectionEndPoint
  });
  return start && end ? {
    start,
    end
  } : void 0;
}, getNextInlineObjects = (snapshot) => {
  const focusTextBlock = getFocusTextBlock(snapshot), selectionEndPoint = getSelectionEndPoint(snapshot), selectionEndPointChildKey = selectionEndPoint && isKeySegment(selectionEndPoint.path[2]) ? selectionEndPoint.path[2]._key : void 0;
  if (!focusTextBlock || !selectionEndPointChildKey)
    return [];
  let endPointChildFound = !1;
  const inlineObjects = [];
  for (const child of focusTextBlock.node.children) {
    if (child._key === selectionEndPointChildKey) {
      endPointChildFound = !0;
      continue;
    }
    if (!isSpan(snapshot.context, child) && endPointChildFound) {
      inlineObjects.push({
        node: child,
        path: [...focusTextBlock.path, "children", {
          _key: child._key
        }]
      });
      break;
    }
  }
  return inlineObjects;
}, getPreviousInlineObjects = (snapshot) => {
  const focusTextBlock = getFocusTextBlock(snapshot), selectionStartPoint = getSelectionStartPoint(snapshot), selectionStartPointChildKey = selectionStartPoint && isKeySegment(selectionStartPoint.path[2]) ? selectionStartPoint.path[2]._key : void 0;
  if (!focusTextBlock || !selectionStartPointChildKey)
    return [];
  const inlineObjects = [];
  for (const child of focusTextBlock.node.children) {
    if (child._key === selectionStartPointChildKey)
      break;
    isSpan(snapshot.context, child) || inlineObjects.push({
      node: child,
      path: [...focusTextBlock.path, "children", {
        _key: child._key
      }]
    });
  }
  return inlineObjects;
}, getSelection = (snapshot) => snapshot.context.selection, getSelectionEndChild = (snapshot) => {
  const endPoint = getSelectionEndPoint$1(snapshot.context.selection);
  if (endPoint)
    return getFocusChild({
      ...snapshot,
      context: {
        ...snapshot.context,
        selection: {
          anchor: endPoint,
          focus: endPoint
        }
      }
    });
}, getSelectionStartChild = (snapshot) => {
  const startPoint = getSelectionStartPoint$1(snapshot.context.selection);
  if (startPoint)
    return getFocusChild({
      ...snapshot,
      context: {
        ...snapshot.context,
        selection: {
          anchor: startPoint,
          focus: startPoint
        }
      }
    });
}, getBlockTextAfter = (snapshot) => {
  if (!snapshot.context.selection)
    return "";
  const endPoint = getSelectionEndPoint$1(snapshot.context.selection), block = getFocusBlock({
    ...snapshot,
    context: {
      ...snapshot.context,
      selection: {
        anchor: endPoint,
        focus: endPoint
      }
    }
  });
  if (!block)
    return "";
  const endOfBlock = getBlockEndPoint({
    context: snapshot.context,
    block
  });
  return getSelectionText({
    ...snapshot,
    context: {
      ...snapshot.context,
      selection: {
        anchor: endPoint,
        focus: endOfBlock
      }
    }
  });
}, getBlockTextBefore = (snapshot) => {
  if (!snapshot.context.selection)
    return "";
  const startPoint = getSelectionStartPoint$1(snapshot.context.selection), block = getFocusBlock({
    ...snapshot,
    context: {
      ...snapshot.context,
      selection: {
        anchor: startPoint,
        focus: startPoint
      }
    }
  });
  if (!block)
    return "";
  const startOfBlock = getBlockStartPoint({
    context: snapshot.context,
    block
  });
  return getSelectionText({
    ...snapshot,
    context: {
      ...snapshot.context,
      selection: {
        anchor: startOfBlock,
        focus: startPoint
      }
    }
  });
}, getValue = (snapshot) => snapshot.context.value;
export {
  getActiveAnnotations,
  getActiveListItem,
  getActiveStyle,
  getAnchorBlock,
  getAnchorChild,
  getAnchorSpan,
  getAnchorTextBlock,
  getBlockOffsets,
  getBlockTextAfter,
  getBlockTextBefore,
  getCaretWordSelection,
  getFirstBlock,
  getFocusBlock,
  getFocusBlockObject,
  getFocusChild,
  getFocusInlineObject,
  getFocusListBlock,
  getFocusSpan,
  getFocusTextBlock,
  getLastBlock,
  getMarkState,
  getNextBlock,
  getNextInlineObject,
  getNextInlineObjects,
  getNextSpan,
  getPreviousBlock,
  getPreviousInlineObject,
  getPreviousInlineObjects,
  getPreviousSpan,
  getSelectedBlocks,
  getSelectedSpans,
  getSelectedTextBlocks,
  getSelectedValue,
  getSelection,
  getSelectionEndBlock,
  getSelectionEndChild,
  getSelectionEndPoint,
  getSelectionStartBlock,
  getSelectionStartChild,
  getSelectionStartPoint,
  getSelectionText,
  getValue,
  isActiveAnnotation,
  isActiveDecorator,
  isActiveListItem,
  isActiveStyle,
  isAtTheEndOfBlock,
  isAtTheStartOfBlock,
  isOverlappingSelection,
  isPointAfterSelection,
  isPointBeforeSelection,
  isSelectingEntireBlocks,
  isSelectionCollapsed,
  isSelectionExpanded
};
//# sourceMappingURL=index.js.map
