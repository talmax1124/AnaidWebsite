import { F as BlockOffset, Kt as BlockPath, X as EditorContext, dt as EditorSelection, ft as EditorSelectionPoint, qt as ChildPath } from "../_chunks-dts/index.js";
import * as _sanity_types7 from "@sanity/types";
import { KeyedSegment, PortableTextBlock, PortableTextTextBlock } from "@sanity/types";
import { isSpan, isTextBlock } from "@portabletext/schema";
/**
 * @public
 */
declare function blockOffsetToSpanSelectionPoint({
  context,
  blockOffset,
  direction
}: {
  context: Pick<EditorContext, 'schema' | 'value'>;
  blockOffset: BlockOffset;
  direction: 'forward' | 'backward';
}): {
  path: ChildPath;
  offset: number;
} | undefined;
/**
 * @public
 */
declare function spanSelectionPointToBlockOffset({
  context,
  selectionPoint
}: {
  context: Pick<EditorContext, 'schema' | 'value'>;
  selectionPoint: EditorSelectionPoint;
}): BlockOffset | undefined;
/**
 * @public
 */
declare function blockOffsetToBlockSelectionPoint({
  context,
  blockOffset
}: {
  context: Pick<EditorContext, 'value'>;
  blockOffset: BlockOffset;
}): EditorSelectionPoint | undefined;
/**
 * @public
 */
declare function blockOffsetToSelectionPoint({
  context,
  blockOffset,
  direction
}: {
  context: Pick<EditorContext, 'schema' | 'value'>;
  blockOffset: BlockOffset;
  direction: 'forward' | 'backward';
}): EditorSelectionPoint | undefined;
/**
 * @public
 */
declare function blockOffsetsToSelection({
  context,
  offsets,
  backward
}: {
  context: Pick<EditorContext, 'schema' | 'value'>;
  offsets: {
    anchor: BlockOffset;
    focus: BlockOffset;
  };
  backward?: boolean;
}): EditorSelection;
/**
 * @public
 */
declare function childSelectionPointToBlockOffset({
  context,
  selectionPoint
}: {
  context: Pick<EditorContext, 'schema' | 'value'>;
  selectionPoint: EditorSelectionPoint;
}): BlockOffset | undefined;
/**
 * @public
 */
declare function getBlockEndPoint({
  context,
  block
}: {
  context: Pick<EditorContext, 'schema'>;
  block: {
    node: PortableTextBlock;
    path: BlockPath;
  };
}): EditorSelectionPoint;
/**
 * @public
 */
declare function getBlockStartPoint({
  context,
  block
}: {
  context: Pick<EditorContext, 'schema'>;
  block: {
    node: PortableTextBlock;
    path: BlockPath;
  };
}): EditorSelectionPoint;
/**
 * @public
 */
declare function getSelectionEndPoint<TEditorSelection extends NonNullable<EditorSelection> | null, TEditorSelectionPoint extends EditorSelectionPoint | null = (TEditorSelection extends NonNullable<EditorSelection> ? EditorSelectionPoint : null)>(selection: TEditorSelection): TEditorSelectionPoint;
/**
 * @public
 */
declare function getSelectionStartPoint<TEditorSelection extends NonNullable<EditorSelection> | null, TEditorSelectionPoint extends EditorSelectionPoint | null = (TEditorSelection extends NonNullable<EditorSelection> ? EditorSelectionPoint : null)>(selection: TEditorSelection): TEditorSelectionPoint;
/**
 * @public
 */
declare function getTextBlockText(block: PortableTextTextBlock): string;
/**
 * @public
 */
declare function isEmptyTextBlock(context: Pick<EditorContext, 'schema'>, block: PortableTextBlock | unknown): boolean;
/**
 * @public
 */
declare function isEqualSelectionPoints(a: EditorSelectionPoint, b: EditorSelectionPoint): boolean;
/**
 * @public
 */
declare function isEqualSelections(a: EditorSelection, b: EditorSelection): boolean;
/**
 * @public
 */
declare function isKeyedSegment(segment: unknown): segment is KeyedSegment;
/**
 * @public
 */
declare function isSelectionCollapsed(selection: EditorSelection): boolean;
/**
 * @beta
 */
declare function mergeTextBlocks({
  context,
  targetBlock,
  incomingBlock
}: {
  context: Pick<EditorContext, 'keyGenerator' | 'schema'>;
  targetBlock: PortableTextTextBlock;
  incomingBlock: PortableTextTextBlock;
}): PortableTextTextBlock<_sanity_types7.PortableTextObject | _sanity_types7.PortableTextSpan>;
/**
 * @public
 */
declare function reverseSelection<TEditorSelection extends NonNullable<EditorSelection> | null>(selection: TEditorSelection): TEditorSelection;
/**
 * @public
 */
declare function selectionPointToBlockOffset({
  context,
  selectionPoint
}: {
  context: Pick<EditorContext, 'schema' | 'value'>;
  selectionPoint: EditorSelectionPoint;
}): BlockOffset | undefined;
/**
 * @public
 */
declare function sliceBlocks({
  context,
  blocks
}: {
  context: Pick<EditorContext, 'schema' | 'selection'> & {
    keyGenerator?: () => string;
  };
  blocks: Array<PortableTextBlock>;
}): Array<PortableTextBlock>;
/**
 * @beta
 */
declare function splitTextBlock({
  context,
  block,
  point
}: {
  context: Pick<EditorContext, 'schema'>;
  block: PortableTextTextBlock;
  point: EditorSelectionPoint;
}): {
  before: PortableTextTextBlock;
  after: PortableTextTextBlock;
} | undefined;
export { blockOffsetToBlockSelectionPoint, blockOffsetToSelectionPoint, blockOffsetToSpanSelectionPoint, blockOffsetsToSelection, childSelectionPointToBlockOffset, getBlockEndPoint, getBlockStartPoint, getSelectionEndPoint, getSelectionStartPoint, getTextBlockText, isEmptyTextBlock, isEqualSelectionPoints, isEqualSelections, isKeyedSegment, isSelectionCollapsed, isSpan, isTextBlock, mergeTextBlocks, reverseSelection, selectionPointToBlockOffset, sliceBlocks, spanSelectionPointToBlockOffset, splitTextBlock };