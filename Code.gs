const FILLERS = [
  "あー",
  "あの",
  "あのー",
  "あのう",
  "いや",
  "いやー",
  "いやあ",
  "うーん",
  "うん",
  "えーと",
  "えと",
  "えっと",
  "えー",
  "じゃあ",
  "じゃー",
  "すー",
  "そのー",
  "そのう",
  "なんか",
  "まあ",
  "まー",
  "んー",
];

function onOpen() {
  DocumentApp.getUi()
    .createMenu("フィラーカウンター")
    .addItem("フィラーをカウント", "showSidebar")
    .addToUi();
}

function onInstall() {
  onOpen();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("sidebar")
    .setTitle("フィラーカウンター")
    .setWidth(300);
  DocumentApp.getUi().showSidebar(html);
}

function analyzeDocument() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const text = body.getText();

  const speakers = parseSpeakers(text);

  if (Object.keys(speakers).length === 0) {
    const counts = countFillers(text);
    return { results: [{ name: "全体", counts: counts }] };
  }

  const results = [];
  for (const [name, speech] of Object.entries(speakers)) {
    const counts = countFillers(speech);
    results.push({ name, counts });
  }
  return { results };
}

function parseSpeakers(text) {
  const pattern = /^(.+?)[:：]\s*/gm;
  const matches = [...text.matchAll(pattern)];
  const speakers = {};

  for (let i = 0; i < matches.length; i++) {
    const name = matches[i][1].trim();
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    if (!speakers[name]) speakers[name] = "";
    speakers[name] += text.slice(start, end) + " ";
  }
  return speakers;
}

function countFillers(text) {
  const textLower = text.toLowerCase();
  const counts = {};
  for (const filler of FILLERS) {
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const found = (textLower.match(new RegExp(escaped, "g")) || []).length;
    if (found > 0) counts[filler] = found;
  }
  return counts;
}
