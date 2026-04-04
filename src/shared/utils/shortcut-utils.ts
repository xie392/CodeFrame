import { SYSTEM_RESERVED_SHORTCUTS, SHORTCUT_COMMAND_LABELS } from '@shared/constants';
import type { ShortcutCommand } from '@shared/types';

/**
 * 冲突检测结果
 */
export interface ConflictResult {
  hasConflict: boolean;
  type: 'system' | 'custom' | null;
  message: string;
  conflictingCommand?: ShortcutCommand;
}

/**
 * 检测快捷键是否与系统保留快捷键冲突
 */
export function checkSystemConflict(shortcut: string): boolean {
  if (!shortcut) return false;
  
  // 标准化快捷键格式
  const normalized = normalizeShortcut(shortcut);
  
  return SYSTEM_RESERVED_SHORTCUTS.some(
    (reserved) => normalizeShortcut(reserved) === normalized
  );
}

/**
 * 检测快捷键是否与已配置的其他快捷键冲突
 */
export function checkCustomConflict(
  shortcut: string,
  currentCommand: ShortcutCommand,
  customShortcuts: Record<ShortcutCommand, string>
): ConflictResult {
  if (!shortcut) {
    return { hasConflict: false, type: null, message: '' };
  }
  
  const normalized = normalizeShortcut(shortcut);
  
  for (const [command, existingShortcut] of Object.entries(customShortcuts)) {
    // 跳过当前正在编辑的命令
    if (command === currentCommand) continue;
    
    if (existingShortcut && normalizeShortcut(existingShortcut) === normalized) {
      return {
        hasConflict: true,
        type: 'custom',
        message: `该快捷键已被「${SHORTCUT_COMMAND_LABELS[command] || command}」使用`,
        conflictingCommand: command as ShortcutCommand,
      };
    }
  }
  
  return { hasConflict: false, type: null, message: '' };
}

/**
 * 检测快捷键冲突（综合检测）
 */
export function checkShortcutConflict(
  shortcut: string,
  currentCommand: ShortcutCommand,
  customShortcuts: Record<ShortcutCommand, string>
): ConflictResult {
  if (!shortcut) {
    return { hasConflict: false, type: null, message: '' };
  }
  
  // 先检测系统冲突
  if (checkSystemConflict(shortcut)) {
    return {
      hasConflict: true,
      type: 'system',
      message: '该快捷键与系统快捷键冲突',
    };
  }
  
  // 再检测自定义快捷键冲突
  return checkCustomConflict(shortcut, currentCommand, customShortcuts);
}

/**
 * 标准化快捷键格式
 * 将快捷键转换为统一格式以便比较
 */
export function normalizeShortcut(shortcut: string): string {
  if (!shortcut) return '';
  
  const parts = shortcut.split('+').map((p) => p.trim().toUpperCase());
  
  // 定义修饰键顺序
  const modifierOrder = ['CTRL', 'ALT', 'SHIFT'];
  
  // 分离修饰键和主键
  const modifiers: string[] = [];
  const mainKeys: string[] = [];
  
  for (const part of parts) {
    if (modifierOrder.includes(part)) {
      if (!modifiers.includes(part)) {
        modifiers.push(part);
      }
    } else {
      mainKeys.push(part);
    }
  }
  
  // 按顺序排序修饰键
  modifiers.sort((a, b) => modifierOrder.indexOf(a) - modifierOrder.indexOf(b));
  
  return [...modifiers, ...mainKeys].join('+');
}

/**
 * 验证快捷键格式是否有效
 */
export function isValidShortcutFormat(shortcut: string): boolean {
  if (!shortcut) return false;
  
  const parts = shortcut.split('+');
  
  // 必须至少有 2 个部分
  if (parts.length < 2) return false;
  
  // 必须至少有一个修饰键
  const hasModifier = parts.some((p) =>
    ['CTRL', 'ALT', 'SHIFT'].includes(p.trim().toUpperCase())
  );
  
  // 必须有一个主键
  const hasMainKey = parts.some(
    (p) => !['CTRL', 'ALT', 'SHIFT'].includes(p.trim().toUpperCase())
  );
  
  return hasModifier && hasMainKey;
}

/**
 * 获取快捷键的替代建议
 */
export function getSuggestedAlternatives(
  shortcut: string,
  count: number = 3
): string[] {
  const suggestions: string[] = [];
  const parts = shortcut.split('+');
  
  // 找到主键
  const mainKey = parts.find(
    (p) => !['Ctrl', 'Alt', 'Shift'].includes(p.trim())
  );
  
  if (!mainKey) return suggestions;
  
  // 生成替代建议
  const alternativeModifiers = [
    ['Alt', mainKey],
    ['Ctrl', 'Alt', mainKey],
    ['Ctrl', 'Shift', mainKey],
  ];
  
  for (const mods of alternativeModifiers) {
    if (suggestions.length >= count) break;
    const suggested = mods.join('+');
    if (
      !checkSystemConflict(suggested) &&
      suggested !== shortcut
    ) {
      suggestions.push(suggested);
    }
  }
  
  return suggestions;
}
