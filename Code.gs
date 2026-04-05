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

function onDocsHomepage(e) {
  return buildHomeCard();
}

function buildHomeCard() {
  const section = CardService.newCardSection();
  section.addWidget(
    CardService.newTextParagraph().setText(
      "ドキュメント内のフィラーワードを検出・集計します。"
    )
  );
  section.addWidget(
    CardService.newButtonSet().addButton(
      CardService.newTextButton()
        .setText("フィラーをカウント")
        .setOnClickAction(CardService.newAction().setFunctionName("onAnalyze"))
    )
  );

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("フィラーカウンター"))
    .addSection(section)
    .build();
}

function onAnalyze(e) {
  const data = analyzeDocument();
  const card = buildResultCard(data);
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(card))
    .build();
}

function makeBar(count, max) {
  const BAR_MAX = 10;
  const filled = max > 0 ? Math.round((count / max) * BAR_MAX) : 0;
  return "█".repeat(filled) + "░".repeat(BAR_MAX - filled);
}

function buildResultCard(data) {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle("解析結果")
  );

  if (!data || !data.results || data.results.length === 0) {
    card.addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextParagraph().setText("フィラーは検出されませんでした。")
      )
    );
    return card.build();
  }

  const sorted = data.results.slice().sort((a, b) => {
    const totalA = Object.values(a.counts).reduce((s, v) => s + v, 0);
    const totalB = Object.values(b.counts).reduce((s, v) => s + v, 0);
    return totalB - totalA;
  });

  // サマリーセクション（複数話者の場合のみ）
  if (sorted.length > 1) {
    const summarySection = CardService.newCardSection().setHeader("▼ 話者サマリー");
    sorted.forEach(({ name, counts }) => {
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      summarySection.addWidget(
        CardService.newDecoratedText()
          .setTopLabel(name)
          .setText(`合計 ${total} 回`)
      );
    });
    card.addSection(summarySection);
  }

  // 話者ごとの詳細セクション
  sorted.forEach(({ name, counts }) => {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const localMax = total > 0 ? Math.max(...Object.values(counts)) : 1;
    const section = CardService.newCardSection().setHeader(
      `【${name}】合計: ${total} 回`
    );

    if (total === 0) {
      section.addWidget(
        CardService.newTextParagraph().setText("フィラーなし")
      );
    } else {
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([filler, count]) => {
          section.addWidget(
            CardService.newDecoratedText()
              .setTopLabel(filler)
              .setText(`${makeBar(count, localMax)}  ${count} 回`)
          );
        });
    }
    card.addSection(section);
  });

  card.addSection(
    CardService.newCardSection().addWidget(
      CardService.newButtonSet().addButton(
        CardService.newTextButton()
          .setText("再解析")
          .setOnClickAction(
            CardService.newAction().setFunctionName("onReanalyze")
          )
      )
    )
  );

  return card.build();
}

function onReanalyze(e) {
  const data = analyzeDocument();
  const card = buildResultCard(data);
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card))
    .build();
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
