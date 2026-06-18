import type { Block, CalculatedBlock, CalculatedTimelineResult } from '@/types';
import { formatMinutesToTime, parseTimeToMinutes } from '@/utils/time-formatter';

function sortByPosition(a: Block, b: Block): number {
  return a.position - b.position;
}

export function getRootBlocks(blocks: Block[]): Block[] {
  return blocks.filter((b) => !b.parent_id).sort(sortByPosition);
}

export function getChildBlocks(blocks: Block[], parentId: string): Block[] {
  return blocks.filter((b) => b.parent_id === parentId).sort(sortByPosition);
}

/** Blocos que consomem tempo na linha do tempo (filhos ou pais sem filhos). */
export function getLinearTimingBlocks(blocks: Block[]): Block[] {
  const linear: Block[] = [];

  for (const root of getRootBlocks(blocks)) {
    const children = getChildBlocks(blocks, root.id);
    if (children.length > 0) {
      linear.push(...children);
    } else {
      linear.push(root);
    }
  }

  return linear;
}

export function getLinearBlockIndex(blocks: Block[], blockId: string): number {
  return getLinearTimingBlocks(blocks).findIndex((b) => b.id === blockId);
}

export function calculateTimeline(blocks: Block[], baseTime: string): CalculatedTimelineResult {
  const linear = getLinearTimingBlocks(blocks);
  let currentTotalMinutes = parseTimeToMinutes(baseTime);

  const byId: Record<string, CalculatedBlock> = {};

  for (const block of linear) {
    const startTimeStr = formatMinutesToTime(currentTotalMinutes);
    const blockTotalDuration = block.duration + (block.time_offset ?? 0);
    currentTotalMinutes += blockTotalDuration;
    const endTimeStr = formatMinutesToTime(currentTotalMinutes);

    byId[block.id] = {
      ...block,
      start: startTimeStr,
      end: endTimeStr,
      actualDuration: blockTotalDuration,
    };
  }

  const roots: CalculatedBlock[] = [];
  const childrenByParentId: Record<string, CalculatedBlock[]> = {};

  for (const root of getRootBlocks(blocks)) {
    const children = getChildBlocks(blocks, root.id);

    if (children.length > 0) {
      const calculatedChildren = children.map((child) => byId[child.id]);
      childrenByParentId[root.id] = calculatedChildren;

      const first = calculatedChildren[0];
      const last = calculatedChildren[calculatedChildren.length - 1];
      const totalDuration = calculatedChildren.reduce((sum, child) => sum + child.actualDuration, 0);

      roots.push({
        ...root,
        start: first.start,
        end: last.end,
        actualDuration: totalDuration,
      });
    } else if (byId[root.id]) {
      roots.push(byId[root.id]);
    }
  }

  return {
    roots,
    childrenByParentId,
    linearBlocks: linear.map((block) => byId[block.id]),
    byId,
  };
}

/** Compat: retorna lista linear calculada (usada em startBlockNow e legado). */
export function calculateLinearTimeline(blocks: Block[], baseTime: string): CalculatedBlock[] {
  return calculateTimeline(blocks, baseTime).linearBlocks;
}
