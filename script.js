const cheatsheet = document.querySelector("#cheatsheet");
const searchInput = document.querySelector("#search-input");
const expandAllButton = document.querySelector("#expand-all");
const collapseAllButton = document.querySelector("#collapse-all");
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");

const placeholder = "— no content yet —";

function textOrPlaceholder(value) {
  return value.trim() || placeholder;
}

function formatSql(value) {
  if (!value.trim()) return value;

  return value
    .replace(
      /SELECT\s+([\s\S]*?)(?=\s+FROM\s)/gi,
      (_, columns) =>
        `SELECT\n  ${columns.trim().replace(/\s*,\s*/g, ",\n  ")}`,
    )
    .replace(
      /\s+(FROM|INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|CROSS JOIN|JOIN|WHERE|GROUP BY|HAVING|ORDER BY|LIMIT|OFFSET|UNION ALL|UNION|INTERSECT|EXCEPT)\s+/gi,
      "\n$1 ",
    )
    .replace(/\s+(AND|OR)\s+/gi, "\n  $1 ");
}

function createTextBlock(label, value) {
  const block = document.createElement("section");
  block.className = "content-block";

  const labelElement = document.createElement("span");
  labelElement.className = "content-label";
  labelElement.textContent = label;

  const text = document.createElement("p");
  text.className = "content-text";
  text.textContent = textOrPlaceholder(value);
  if (!value.trim()) text.classList.add("empty-content");

  block.append(labelElement, text);
  return block;
}

function createCodeBlock(labelText, value, options = {}) {
  const block = document.createElement("section");
  block.className = "content-block";

  const label = document.createElement("span");
  label.className = "content-label";
  label.textContent = labelText;
  if (options.platform) {
    const badge = document.createElement("small");
    badge.className = "platform-badge";
    badge.textContent = options.platform;
    label.append(" ", badge);
  }

  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.className = options.highlight ? "syntax-box language-sql" : "output-box";
  code.textContent = options.highlight
    ? textOrPlaceholder(formatSql(value))
    : textOrPlaceholder(value);
  if (!value.trim()) code.classList.add("empty-content");

  pre.append(code);
  block.append(label, pre);
  return block;
}

function renderTopics(items) {
  cheatsheet.replaceChildren();

  items.forEach((topic, index) => {
    const details = document.createElement("details");
    details.className = "topic";
    details.dataset.title = topic.title.toLocaleLowerCase();
    details.id = topic.id;

    const summary = document.createElement("summary");
    summary.className = "topic-summary";
    const number = document.createElement("span");
    number.className = "topic-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const title = document.createElement("span");
    title.className = "topic-title";
    title.textContent = topic.title;

    summary.append(number, title);

    const content = document.createElement("div");
    content.className = "topic-content";
    content.append(
      createTextBlock("Definition", topic.definition),
      createCodeBlock("Structure/Syntax", topic.structure, { highlight: true }),
      createCodeBlock("Example", topic.example, {
        highlight: true,
        platform: "PostgreSQL",
      }),
      createCodeBlock("Output", topic.output),
      createTextBlock("Note", topic.note),
    );

    details.append(summary, content);
    cheatsheet.append(details);
  });

  if (window.hljs) {
    cheatsheet.querySelectorAll("code.language-sql").forEach((code) => {
      window.hljs.highlightElement(code);
    });
  }

  filterTopics();
}

function visibleTopics() {
  return [...document.querySelectorAll(".topic")].filter(
    (topic) => !topic.hidden,
  );
}

function filterTopics() {
  const query = searchInput.value.trim().toLowerCase();
  const elements = [...document.querySelectorAll(".topic")];

  elements.forEach((topic) => {
    const matches = !query || topic.dataset.title.includes(query);
    topic.hidden = !matches;
  });

  const count = visibleTopics().length;
  resultsCount.textContent = query
    ? `${count} matching topic${count === 1 ? "" : "s"}`
    : `${count} topics`;
  emptyState.hidden = count !== 0;
}

function setAll(open) {
  visibleTopics().forEach((topic) => {
    topic.open = open;
  });
}

async function loadTopics() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (!Array.isArray(data))
      throw new Error("data.json must contain an array.");
    renderTopics(data);
  } catch {
    resultsCount.textContent = "Unable to load reference data.";
    emptyState.hidden = false;
    emptyState.textContent =
      "Run the site from GitHub Pages or a local web server so data.json can be loaded.";
  }
}

searchInput.addEventListener("input", filterTopics);
expandAllButton.addEventListener("click", () => setAll(true));
collapseAllButton.addEventListener("click", () => setAll(false));

loadTopics();
