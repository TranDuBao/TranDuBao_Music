export function formatCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return count.toString();
}

export function formatPlays(count: number, isVi: boolean): string {
  const formatted = formatCount(count);
  if (isVi) {
    return `${formatted} lượt nghe`;
  }
  return `${formatted} ${count === 1 ? 'play' : 'plays'}`;
}

export function formatPlaysShort(count: number, isVi: boolean): string {
  const formatted = formatCount(count);
  if (isVi) {
    return `${formatted} lượt`;
  }
  return `${formatted} ${count === 1 ? 'play' : 'plays'}`;
}

export function formatDateLabel(label: string, viewMode: 'day' | 'month' | 'year'): string {
  if (!label) return '';
  
  let datePart = label;
  if (label.includes('T')) {
    datePart = label.split('T')[0];
  } else if (label.includes(' ')) {
    datePart = label.split(' ')[0];
  }

  const parts = datePart.split('-');
  if (parts.length === 3) {
    // YYYY-MM-DD -> DD/MM/YYYY
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  
  if (parts.length === 2 && viewMode === 'month') {
    // YYYY-MM -> MM/YYYY
    return `${parts[1]}/${parts[0]}`;
  }

  return label;
}

export function getCategoryIcon(name?: string, icon?: string): string {
  if (icon && icon !== '#' && icon.trim() !== '') return icon;
  if (!name) return '🎵';
  const lower = name.toLowerCase();
  if (lower.includes('china') || lower.includes('trung') || lower.includes('c-pop') || lower.includes('cpop')) return '🇨🇳';
  if (lower.includes('v-pop') || lower.includes('vpop') || lower.includes('việt')) return '🇻🇳';
  if (lower.includes('k-pop') || lower.includes('kpop') || lower.includes('hàn')) return '🇰🇷';
  if (lower.includes('us-uk') || lower.includes('usuk') || lower.includes('english')) return '🇺🇸';
  if (lower.includes('j-pop') || lower.includes('jpop') || lower.includes('nhật')) return '🇯🇵';
  if (lower.includes('lofi')) return '📻';
  if (lower.includes('remix') || lower.includes('edm') || lower.includes('electronic')) return '⚡';
  if (lower.includes('rock')) return '🎸';
  if (lower.includes('jazz')) return '🎷';
  if (lower.includes('classical')) return '🎻';
  return '🎵';
}
