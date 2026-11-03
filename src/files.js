export function saveSettings(settings) {
  const lines = ['#awkwords version 1.2'];
  for (const row of settings.rows) if (row.name || row.value) lines.push(`${row.name}:${row.value}`);
  lines.push(`r:${settings.pattern}`, `n:${settings.count}`);
  if (settings.newline) lines.push('nle');
  if (settings.unique) lines.push('filterdup');
  return lines.join('\n') + '\n';
}

export function loadSettings(bytes) {
  let text = new TextDecoder('utf-8').decode(bytes);
  if (!/^#awkwords\s/m.test(text)) {
    text = new TextDecoder('windows-1250').decode(bytes);
    // Old versions encoded non-CP1250 characters as HTML entities.
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text.replace(/&(?:quot|#0*34|#x0*22);/gi, '&amp;quot;');
    text = textarea.value;
  }
  const settings = { rows: [], newline: false, unique: false };
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('#')) continue;
    if (/^[A-Z]?:/.test(line)) settings.rows.push({ name: line.slice(0, line.indexOf(':')), value: line.slice(line.indexOf(':') + 1) });
    else if (line.startsWith('r:')) settings.pattern = line.slice(2);
    else if (line.startsWith('n:')) settings.count = Number(line.slice(2));
    else if (line.startsWith('nle')) settings.newline = true;
    else if (line.startsWith('filterdup')) settings.unique = true;
  }
  if (!settings.rows.length || settings.pattern === undefined || !Number.isInteger(settings.count) || settings.count < 1 || settings.count > 9999 || settings.rows.length > 26) throw new Error('Invalid Awkwords settings file.');
  return settings;
}
