import sys
 import re
 from collections import defaultdict

 FILLERS_JA = ["えー", "えっと", "あの", "うーん", "まあ", "なんか", "そのー", "えと", "あのー", "うん"]
 FILLERS_EN = ["um", "uh", "like", "you know", "so", "actually", "basically"]
 ALL_FILLERS = FILLERS_JA + FILLERS_EN


 def parse_speakers(text):
     """人物ごとに発言テキストを分割する"""
     pattern = re.compile(r"^(.+?)[:：]\s*", re.MULTILINE)
     matches = list(pattern.finditer(text))

     speakers = defaultdict(str)
     for i, match in enumerate(matches):
         name = match.group(1).strip()
         start = match.end()
         end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
         speakers[name] += text[start:end] + " "

     return speakers


 def count_fillers(text):
     counts = defaultdict(int)
     text_lower = text.lower()
     for filler in ALL_FILLERS:
         found = len(re.findall(re.escape(filler), text_lower))
         if found:
             counts[filler] = found
     return counts


 def print_result(name, counts):
     total = sum(counts.values())
     print(f"\n【{name}】 合計: {total}回")
     for filler, count in sorted(counts.items(), key=lambda x: -x[1]):
         bar = "█" * count
         print(f"  {filler:<8} {count:>4}回  {bar}")


 def main():
     if len(sys.argv) > 1:
         with open(sys.argv[1], encoding="utf-8") as f:
             text = f.read()
         print(f"ファイル: {sys.argv[1]}")
     else:
         print("テキストを入力してください (終了: Ctrl+D):\n")
         text = sys.stdin.read()

     speakers = parse_speakers(text)

     if not speakers:
         # 人物名が見つからない場合はテキスト全体を集計
         counts = count_fillers(text)
         if not counts:
             print("フィラーは検出されませんでした。")
         else:
             print_result("全体", counts)
         return

     print("\n=== フィラー集計結果 ===")
     grand_total = 0
     for name, speech in speakers.items():
         counts = count_fillers(speech)
         if counts:
             print_result(name, counts)
             grand_total += sum(counts.values())
         else:
             print(f"\n【{name}】 フィラーなし")

     print(f"\n{'─'*30}")
     print(f"  全員合計: {grand_total}回")


 if __name__ == "__main__":
     main()
