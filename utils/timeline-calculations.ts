import type { Block, CalculatedBlock } from '@/types';
import { formatMinutesToTime, parseTimeToMinutes } from '@/utils/time-formatter';

export function calculateTimeline(
  blocks: Block[],
  baseTime: string
): CalculatedBlock[] {
  let currentTotalMinutes = parseTimeToMinutes(baseTime);

  return blocks.map((block) => {
    const startTimeStr = formatMinutesToTime(currentTotalMinutes);
    const blockTotalDuration = block.duration + (block.time_offset ?? 0);
    currentTotalMinutes += blockTotalDuration;
    const endTimeStr = formatMinutesToTime(currentTotalMinutes);

    return {
      ...block,
      start: startTimeStr,
      end: endTimeStr,
      actualDuration: blockTotalDuration,
    };
  });
}
