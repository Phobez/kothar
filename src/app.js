import { compile, generate } from './generator.js';
import { loadSettings, saveSettings } from './files.js';

const $ = (selector) => document.querySelector(selector);
const themeToggle = $('#theme-toggle');
function updateThemeToggle() {
  const light = document.documentElement.dataset.theme === 'light';
  themeToggle.textContent = light ? 'Dark mode' : 'Light mode';
  themeToggle.setAttribute('aria-pressed', String(light));
}
updateThemeToggle();
themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('kothar-theme', theme); } catch { /* The toggle still works without storage. */ }
  updateThemeToggle();
});
const rows = $('#rows');
const defaults = { rows: [{ name: 'V', value: 'a/i/u' }, { name: 'C', value: 'p/t/k/s/m/n' }, { name: 'N', value: 'm/n' }], pattern: 'CV(CV)(N)', count: 100, newline: false, unique: false };

function addRow(row = { name: '', value: '' }) {
  if (rows.children.length >= 26) return;
  const wrapper = document.createElement('div'); wrapper.className = 'pattern-row';
  const select = document.createElement('select'); select.setAttribute('aria-label', 'Subpattern letter');
  for (const letter of ['', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']) {
    const option = document.createElement('option'); option.value = letter; option.textContent = letter || '—'; select.append(option);
  }
  select.value = row.name;
  const input = document.createElement('input'); input.value = row.value; input.placeholder = 'e.g. a/e/i/o/u'; input.spellcheck = false; input.setAttribute('aria-label', 'Subpattern options');
  const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove'; remove.textContent = '×'; remove.setAttribute('aria-label', 'Remove subpattern'); remove.addEventListener('click', () => { wrapper.remove(); updateAdd(); });
  wrapper.append(select, input, remove); rows.append(wrapper); updateAdd();
}
function updateAdd() { $('#add').disabled = rows.children.length >= 26; }
function settings() {
  return { rows: [...rows.children].map(row => ({ name: row.querySelector('select').value, value: row.querySelector('input').value })), pattern: $('#pattern').value, count: Number($('#count').value), newline: $('#newline').checked, unique: $('#unique').checked };
}
function apply(data) {
  rows.replaceChildren(); data.rows.forEach(addRow);
  $('#pattern').value = data.pattern; $('#count').value = data.count; $('#newline').checked = data.newline; $('#unique').checked = data.unique;
}
function message(text, error = false) { $('#message').textContent = text; $('#message').className = text ? (error ? 'notice error' : 'notice') : ''; }
apply(defaults);
$('#add').addEventListener('click', () => addRow());
$('#generator').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const data = settings(); const compiled = compile(data.pattern, data.rows); const start = performance.now();
    const result = generate(compiled, data.count, data.unique);
    $('#output').textContent = result.words.join(data.newline ? '\n' : ' ');
    $('#stats').textContent = `${result.words.length} words · ${result.filtered} filtered · ${result.duplicates} duplicates · ${((performance.now() - start) / 1000).toFixed(3)} seconds · ${compiled.possibilities.toLocaleString()} possible renderings (before filters)`;
    message(compiled.warnings.join(' '));
  } catch (error) { message(error.message, true); }
});
$('#save').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([saveSettings(settings())], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'kothar-settings.awkw'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('#open').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try { apply(loadSettings(await file.arrayBuffer())); message(`Opened ${file.name}.`); }
  catch (error) { message(error.message, true); }
  event.target.value = '';
});
$('#copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#output').textContent); message('Copied to clipboard.'); }
  catch { message('Could not copy. Select the words and copy them manually.', true); }
});
