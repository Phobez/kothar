// Awkwords-compatible pattern parsing and generation, independent of the UI.
export function compile(pattern, rows) {
  const definitions = new Map();
  const warnings = [];
  for (const { name, value } of rows) {
    if (!name) continue;
    if (!/^[A-Z]$/.test(name)) throw new Error('Subpattern names must be single capital letters.');
    if (definitions.has(name)) warnings.push(`Subpattern ${name} is defined more than once; the last definition is used.`);
    definitions.set(name, value);
  }

  function parse(text, label) {
    let pos = 0;
    function options(end = '') {
      const choices = [];
      let parts = [], weight = 1;
      const finish = () => { choices.push({ parts, weight }); parts = []; weight = 1; };
      while (pos < text.length && text[pos] !== end) {
        const char = text[pos++];
        if (char === '/') { finish(); continue; }
        if (char === '*' ) {
          const digits = text.slice(pos).match(/^\d+/)?.[0] || '';
          pos += digits.length;
          const requested = Number(digits) || 1;
          if (requested > 128) warnings.push(`Weight ${requested} was reduced to 128.`);
          weight = Math.min(128, requested);
          continue;
        }
        if (char === '^') {
          if (!parts.length) throw new Error(`${label}: a filter needs a preceding fragment.`);
          let filter = '';
          while (pos < text.length && !/[\[\]()A-Z^/\*]/.test(text[pos])) {
            if (text[pos] === '"') filter += quoted();
            else if (text[pos] === ' ') pos++;
            else filter += text[pos++];
          }
          if (!filter) throw new Error(`${label}: empty filter.`);
          parts.at(-1).filters.push(filter);
          continue;
        }
        if (char === ']' || char === ')') throw new Error(`${label}: unmatched ${char}.`);
        if (char === '[' || char === '(') {
          const close = char === '[' ? ']' : ')';
          const inner = options(close);
          if (text[pos] !== close) throw new Error(`${label}: missing ${close}.`);
          pos++;
          parts.push({ type: char === '(' ? 'optional' : 'group', inner, filters: [] });
        } else if (/[A-Z]/.test(char)) {
          parts.push({ type: 'reference', name: char, filters: [] });
        } else {
          let literal = char === '"' ? quoted(true) : char === ' ' ? '' : char;
          while (pos < text.length && !/[\[\]()A-Z^/*]/.test(text[pos])) {
            if (text[pos] === '"') literal += quoted();
            else if (text[pos] === ' ') pos++;
            else literal += text[pos++];
          }
          if (literal) parts.push({ type: 'literal', value: literal, filters: [] });
        }
      }
      finish();
      return choices;
    }
    function quoted(openConsumed = false) {
      if (!openConsumed) pos++;
      if (text[pos] === '"') { pos++; return '"'; }
      const end = text.indexOf('"', pos);
      if (end === -1) throw new Error(`${label}: unclosed quote.`);
      const result = text.slice(pos, end); pos = end + 1; return result;
    }
    return options();
  }

  const trees = new Map([...definitions].map(([name, value]) => [name, parse(value, `Subpattern ${name}`)]));
  const root = parse(pattern, 'Pattern');
  const visited = new Set(), active = new Set(), missing = new Set();
  function visit(tree) {
    for (const choice of tree) for (const part of choice.parts) {
      if (part.inner) visit(part.inner);
      if (part.type === 'reference') {
        if (!trees.has(part.name)) { missing.add(part.name); continue; }
        if (active.has(part.name)) throw new Error(`Cyclic dependency involving subpattern ${part.name}.`);
        if (!visited.has(part.name)) {
          active.add(part.name); visit(trees.get(part.name)); active.delete(part.name); visited.add(part.name);
        }
      }
    }
  }
  visit(root);
  for (const [name, tree] of trees) if (!visited.has(name)) {
    active.add(name); visit(tree); active.delete(name); visited.add(name);
  }
  if (missing.size) warnings.push(`Undefined subpatterns: ${[...missing].join(', ')}. They render as empty text; quote literal capitals.`);

  function count(tree) {
    return tree.reduce((sum, choice) => sum + choice.parts.reduce((product, part) => {
      if (part.type === 'reference') return product * (trees.has(part.name) ? count(trees.get(part.name)) : 1);
      if (part.inner) return product * (count(part.inner) + (part.type === 'optional' ? 1 : 0));
      return product;
    }, 1), 0);
  }
  function render(tree, random) {
    const total = tree.reduce((sum, choice) => sum + choice.weight, 0);
    let pick = Math.floor(random() * total), selected = tree[0];
    for (const choice of tree) { selected = choice; if (pick < choice.weight) break; pick -= choice.weight; }
    let result = '';
    for (const part of selected.parts) {
      let value = '';
      if (part.type === 'literal') value = part.value;
      else if (part.type === 'reference' && trees.has(part.name)) value = render(trees.get(part.name), random);
      else if (part.type === 'group' || (part.type === 'optional' && random() >= 0.5)) value = render(part.inner, random);
      if (value === null || part.filters.includes(value)) return null;
      result += value;
    }
    return result;
  }
  return { warnings: [...new Set(warnings)], possibilities: count(root), render: (random = Math.random) => render(root, random) };
}

export function generate(compiled, attempts, unique = false, random = Math.random) {
  const words = [], seen = new Set();
  let filtered = 0, duplicates = 0;
  for (let i = 0; i < attempts; i++) {
    const word = compiled.render(random);
    if (word === null) filtered++;
    else if (unique && seen.has(word)) duplicates++;
    else { words.push(word); seen.add(word); }
  }
  return { words, filtered, duplicates };
}
