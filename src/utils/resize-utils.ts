import {
  RESIZE_HANDLE_WIDTH,
  MIN_LEFT_PANEL_WIDTH,
  MIN_CENTER_PANEL_WIDTH,
  MIN_RIGHT_PANEL_WIDTH,
} from './workspace-constants';

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Calculate the max width for the left panel
 */
export const maxLeftPanelWidth = (containerWidth: number, rightPanelWidth: number): number =>
  Math.max(
    MIN_LEFT_PANEL_WIDTH,
    containerWidth - rightPanelWidth - MIN_CENTER_PANEL_WIDTH - RESIZE_HANDLE_WIDTH * 2,
  );

/**
 * Calculate the max width for the right panel
 */
export const maxRightPanelWidth = (containerWidth: number, leftPanelWidth: number): number =>
  Math.max(
    MIN_RIGHT_PANEL_WIDTH,
    containerWidth - leftPanelWidth - MIN_CENTER_PANEL_WIDTH - RESIZE_HANDLE_WIDTH * 2,
  );
