import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Plus, Trash2, ArrowRight, ChevronRight } from "lucide-react";

const CONSONANTS = [
  { ipa: "p", label: "p" }, { ipa: "b", label: "b" }, { ipa: "t", label: "t" },
  { ipa: "d", label: "d" }, { ipa: "k", label: "k" }, { ipa: "g", label: "g" },
  { ipa: "ʔ", label: "ʔ" }, { ipa: "m", label: "m" }, { ipa: "n", label: "n" },
  { ipa: "ŋ", label: "ŋ" }, { ipa: "f", label: "f" }, { ipa: "v", label: "v" },
  { ipa: "θ", label: "θ" }, { ipa: "ð", label: "ð" }, { ipa: "s", label: "s" },
  { ipa: "z", label: "z" }, { ipa: "ʃ", label: "ʃ" }, { ipa: "ʒ", label: "ʒ" },
  { ipa: "x", label: "x" }, { ipa: "h", label: "h" }, { ipa: "tʃ", label: "tʃ" },
  { ipa: "dʒ", label: "dʒ" }, { ipa: "l", label: "l" }, { ipa: "r", label: "r" },
  { ipa: "ɾ", label: "ɾ" }, { ipa: "j", label: "j" }, { ipa: "w", label: "w" },
  { ipa: "ɬ", label: "ɬ" }, { ipa: "q", label: "q" }, { ipa: "χ", label: "χ" },
];

const VOWELS = [
  { ipa: "i", label: "i" }, { ipa: "y", label: "y" }, { ipa: "ɨ", label: "ɨ" },
  { ipa: "u", label: "u" }, { ipa: "e", label: "e" }, { ipa: "ø", label: "ø" },
  { ipa: "ə", label: "ə" }, { ipa: "o", label: "o" }, { ipa: "ɛ", label: "ɛ" },
  { ipa: "œ", label: "œ" }, { ipa: "a", label: "a" }, { ipa: "ɑ", label: "ɑ" },
  { ipa: "æ", label: "æ" }, { ipa: "ʌ", label: "ʌ" }, { ipa: "ɔ", label: "ɔ" },
];

const VOWEL_SET = new Set(VOWELS.map(v => v.ipa));
const CONSONANT_SET = new Set(CONSONANTS.map(c => c.ipa));

const PRESET_SYLLABLES = ["CV", "CVC", "CVCC", "CCV", "CCVC", "V", "VC"];

const ENVIRONMENT_OPTIONS = [
  { value: "always",          label: "항상" },
  { value: "intervocalic",    label: "모음 사이 (V_V)" },
  { value: "word-initial",    label: "어두 (단어 처음)" },
  { value: "word-final",      label: "어말 (단어 끝)" },
  { value: "before-vowel",    label: "모음 앞" },
  { value: "after-vowel",     label: "모음 뒤" },
  { value: "before-consonant",label: "자음 앞" },
  { value: "after-consonant", label: "자음 뒤" },
];

interface LexEntry {
  id: number;
  word: string;
  meaning: string;
  pos: string;
}

interface SoundRule {
  id: number;
  from: string;
  to: string;
  env: string;
  note: string;
}

const POS_OPTIONS = ["명사", "동사", "형용사", "부사", "접속사", "전치사", "기타"];

function isVowelChar(ch: string): boolean {
  return VOWEL_SET.has(ch);
}

function isConsonantChar(ch: string): boolean {
  return CONSONANT_SET.has(ch);
}

function applyRule(word: string, rule: SoundRule): string {
  const { from, to, env } = rule;
  if (!from) return word;

  const chars = [...word];
  let result = "";

  let i = 0;
  while (i < chars.length) {
    const slice = word.slice(i);
    if (!slice.startsWith(from)) {
      result += chars[i];
      i++;
      continue;
    }

    const prev = result.length > 0 ? result[result.length - 1] : null;
    const nextIdx = i + from.length;
    const next = nextIdx < word.length ? word[nextIdx] : null;

    let match = false;
    switch (env) {
      case "always":
        match = true;
        break;
      case "intervocalic":
        match = prev !== null && isVowelChar(prev) && next !== null && isVowelChar(next);
        break;
      case "word-initial":
        match = i === 0;
        break;
      case "word-final":
        match = nextIdx === word.length;
        break;
      case "before-vowel":
        match = next !== null && isVowelChar(next);
        break;
      case "after-vowel":
        match = prev !== null && isVowelChar(prev);
        break;
      case "before-consonant":
        match = next !== null && isConsonantChar(next);
        break;
      case "after-consonant":
        match = prev !== null && isConsonantChar(prev);
        break;
    }

    result += match ? to : from;
    i += from.length;
  }

  return result;
}

function applyAllRules(word: string, rules: SoundRule[]): string {
  return rules.reduce((w, rule) => applyRule(w, rule), word);
}

export function LangToolsDialog() {
  const [selectedConsonants, setSelectedConsonants] = useState<Set<string>>(new Set());
  const [selectedVowels, setSelectedVowels] = useState<Set<string>>(new Set());
  const [syllablePatterns, setSyllablePatterns] = useState<string[]>(["CV", "CVC"]);
  const [customSyllable, setCustomSyllable] = useState("");
  const [wordOrder, setWordOrder] = useState("SOV");
  const [morphologyType, setMorphologyType] = useState("교착어");
  const [headDirection, setHeadDirection] = useState("핵어후치");
  const [lexicon, setLexicon] = useState<LexEntry[]>([]);
  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [newPos, setNewPos] = useState("명사");
  const [nextLexId, setNextLexId] = useState(1);

  const [rules, setRules] = useState<SoundRule[]>([]);
  const [ruleFrom, setRuleFrom] = useState("");
  const [ruleTo, setRuleTo] = useState("");
  const [ruleEnv, setRuleEnv] = useState("always");
  const [ruleNote, setRuleNote] = useState("");
  const [nextRuleId, setNextRuleId] = useState(1);

  const toggleConsonant = (ipa: string) => {
    setSelectedConsonants(prev => {
      const next = new Set(prev);
      next.has(ipa) ? next.delete(ipa) : next.add(ipa);
      return next;
    });
  };

  const toggleVowel = (ipa: string) => {
    setSelectedVowels(prev => {
      const next = new Set(prev);
      next.has(ipa) ? next.delete(ipa) : next.add(ipa);
      return next;
    });
  };

  const toggleSyllablePattern = (pattern: string) => {
    setSyllablePatterns(prev =>
      prev.includes(pattern) ? prev.filter(p => p !== pattern) : [...prev, pattern]
    );
  };

  const addCustomSyllable = () => {
    const val = customSyllable.trim().toUpperCase();
    if (val && !syllablePatterns.includes(val)) {
      setSyllablePatterns(prev => [...prev, val]);
    }
    setCustomSyllable("");
  };

  const removeSyllable = (pattern: string) => {
    setSyllablePatterns(prev => prev.filter(p => p !== pattern));
  };

  const addLexEntry = () => {
    if (!newWord.trim() || !newMeaning.trim()) return;
    setLexicon(prev => [...prev, { id: nextLexId, word: newWord.trim(), meaning: newMeaning.trim(), pos: newPos }]);
    setNextLexId(n => n + 1);
    setNewWord("");
    setNewMeaning("");
  };

  const removeLexEntry = (id: number) => {
    setLexicon(prev => prev.filter(e => e.id !== id));
  };

  const downloadLexicon = () => {
    if (lexicon.length === 0) return;
    const lines = ["단어\t의미\t품사", ...lexicon.map(e => `${e.word}\t${e.meaning}\t${e.pos}`)];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lexicon.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const addRule = () => {
    if (!ruleFrom.trim()) return;
    setRules(prev => [...prev, {
      id: nextRuleId,
      from: ruleFrom.trim(),
      to: ruleTo.trim(),
      env: ruleEnv,
      note: ruleNote.trim(),
    }]);
    setNextRuleId(n => n + 1);
    setRuleFrom("");
    setRuleTo("");
    setRuleNote("");
    setRuleEnv("always");
  };

  const removeRule = (id: number) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const moveRule = (id: number, direction: -1 | 1) => {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + direction;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const ruleResults = useMemo(() =>
    lexicon.map(entry => ({
      ...entry,
      derived: applyAllRules(entry.word, rules),
    })),
    [lexicon, rules]
  );

  const downloadDerived = () => {
    if (ruleResults.length === 0) return;
    const lines = ["원형\t변화형\t의미\t품사",
      ...ruleResults.map(e => `${e.word}\t${e.derived}\t${e.meaning}\t${e.pos}`)];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "derived-lexicon.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{children}</p>
  );

  const envLabel = (val: string) => ENVIRONMENT_OPTIONS.find(o => o.value === val)?.label ?? val;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" data-testid="button-lang-tools">
          <Wrench className="w-4 h-4 mr-2" />
          언어 제작도구
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">인공어 제작도구</DialogTitle>
          <p className="text-xs text-muted-foreground">인공어 설계에 필요한 핵심 요소들을 정의하세요.</p>
        </DialogHeader>

        <Tabs defaultValue="phonemes" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-5 w-full shrink-0">
            <TabsTrigger value="phonemes" data-testid="tab-phonemes">음소 목록</TabsTrigger>
            <TabsTrigger value="phonotactics" data-testid="tab-phonotactics">음절 구조</TabsTrigger>
            <TabsTrigger value="typology" data-testid="tab-typology">유형론</TabsTrigger>
            <TabsTrigger value="lexicon" data-testid="tab-lexicon">어휘집</TabsTrigger>
            <TabsTrigger value="soundchange" data-testid="tab-soundchange">음운 규칙</TabsTrigger>
          </TabsList>

          {/* 음소 목록 */}
          <TabsContent value="phonemes" className="flex-1 overflow-y-auto space-y-5 pr-1 mt-4">
            <div>
              <SectionTitle>자음 ({selectedConsonants.size}개 선택)</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {CONSONANTS.map(c => (
                  <button
                    key={c.ipa}
                    data-testid={`btn-consonant-${c.ipa}`}
                    onClick={() => toggleConsonant(c.ipa)}
                    className={`w-10 h-10 rounded-md text-sm font-mono border transition-colors ${
                      selectedConsonants.has(c.ipa)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <SectionTitle>모음 ({selectedVowels.size}개 선택)</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {VOWELS.map(v => (
                  <button
                    key={v.ipa}
                    data-testid={`btn-vowel-${v.ipa}`}
                    onClick={() => toggleVowel(v.ipa)}
                    className={`w-10 h-10 rounded-md text-sm font-mono border transition-colors ${
                      selectedVowels.has(v.ipa)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            {(selectedConsonants.size > 0 || selectedVowels.size > 0) && (
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                {selectedConsonants.size > 0 && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">자음: </span>
                    {[...selectedConsonants].join("  ")}
                  </p>
                )}
                {selectedVowels.size > 0 && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">모음: </span>
                    {[...selectedVowels].join("  ")}
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          {/* 음절 구조 */}
          <TabsContent value="phonotactics" className="flex-1 overflow-y-auto space-y-5 pr-1 mt-4">
            <div>
              <SectionTitle>음절 패턴 (C=자음, V=모음)</SectionTitle>
              <p className="text-xs text-muted-foreground mb-3">
                언어에서 허용할 음절 구조를 선택하세요. 예: CV는 자음+모음(바, 나), CVC는 자음+모음+자음(박, 날).
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {PRESET_SYLLABLES.map(p => (
                  <button
                    key={p}
                    data-testid={`btn-syllable-${p}`}
                    onClick={() => toggleSyllablePattern(p)}
                    className={`px-3 py-1.5 rounded-md text-sm font-mono border transition-colors ${
                      syllablePatterns.includes(p)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={customSyllable}
                  onChange={e => setCustomSyllable(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && addCustomSyllable()}
                  placeholder="직접 입력 (예: CCVCC)"
                  className="font-mono text-sm"
                  data-testid="input-custom-syllable"
                />
                <Button variant="outline" onClick={addCustomSyllable} data-testid="btn-add-syllable">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {syllablePatterns.length > 0 && (
              <div>
                <SectionTitle>선택된 패턴</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {syllablePatterns.map(p => (
                    <Badge
                      key={p}
                      variant="secondary"
                      className="gap-1.5 font-mono text-sm py-1 px-2 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeSyllable(p)}
                      data-testid={`badge-syllable-${p}`}
                    >
                      {p}
                      <span className="text-xs opacity-60">×</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* 유형론 */}
          <TabsContent value="typology" className="flex-1 overflow-y-auto space-y-5 pr-1 mt-4">
            <div className="space-y-2">
              <Label data-testid="label-word-order">기본 어순</Label>
              <Select value={wordOrder} onValueChange={setWordOrder}>
                <SelectTrigger data-testid="select-word-order">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["SOV", "SVO", "VSO", "VOS", "OVS", "OSV"].map(o => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {wordOrder === "SOV" && "주어-목적어-동사 순 (한국어, 일본어, 터키어와 유사)"}
                {wordOrder === "SVO" && "주어-동사-목적어 순 (영어, 중국어, 스페인어와 유사)"}
                {wordOrder === "VSO" && "동사-주어-목적어 순 (아랍어, 히브리어와 유사)"}
                {wordOrder === "VOS" && "동사-목적어-주어 순 (말라가시어와 유사)"}
                {wordOrder === "OVS" && "목적어-동사-주어 순 (히샤르야나어와 유사)"}
                {wordOrder === "OSV" && "목적어-주어-동사 순 (극히 드문 어순)"}
              </p>
            </div>

            <div className="space-y-2">
              <Label data-testid="label-morphology">형태론 유형</Label>
              <Select value={morphologyType} onValueChange={setMorphologyType}>
                <SelectTrigger data-testid="select-morphology">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="교착어">교착어 (Agglutinative)</SelectItem>
                  <SelectItem value="굴절어">굴절어 (Inflectional)</SelectItem>
                  <SelectItem value="고립어">고립어 (Isolating)</SelectItem>
                  <SelectItem value="포합어">포합어 (Polysynthetic)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {morphologyType === "교착어" && "접사가 규칙적으로 결합 (한국어, 터키어, 핀란드어)"}
                {morphologyType === "굴절어" && "어근이 변형되어 문법 관계 표시 (라틴어, 러시아어)"}
                {morphologyType === "고립어" && "어순으로 문법 관계 표시, 굴절 없음 (중국어, 베트남어)"}
                {morphologyType === "포합어" && "여러 형태소가 하나의 단어로 결합 (이누이트어, 촉토어)"}
              </p>
            </div>

            <div className="space-y-2">
              <Label data-testid="label-head-direction">핵어 방향</Label>
              <Select value={headDirection} onValueChange={setHeadDirection}>
                <SelectTrigger data-testid="select-head-direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="핵어후치">핵어후치 (Head-Final)</SelectItem>
                  <SelectItem value="핵어전치">핵어전치 (Head-Initial)</SelectItem>
                  <SelectItem value="혼합">혼합형</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {headDirection === "핵어후치" && "수식어가 핵어 앞에 옴 — 형용사+명사, 목적어+동사 (SOV 계열에 자주 나타남)"}
                {headDirection === "핵어전치" && "수식어가 핵어 뒤에 옴 — 동사+목적어, 명사+형용사 (SVO 계열에 자주 나타남)"}
                {headDirection === "혼합" && "구 유형마다 핵어 위치가 다름"}
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-foreground mb-1">설정 요약</p>
              <p className="text-xs text-muted-foreground">어순: <span className="text-foreground font-medium">{wordOrder}</span></p>
              <p className="text-xs text-muted-foreground">형태론: <span className="text-foreground font-medium">{morphologyType}</span></p>
              <p className="text-xs text-muted-foreground">핵어 방향: <span className="text-foreground font-medium">{headDirection}</span></p>
            </div>
          </TabsContent>

          {/* 어휘집 */}
          <TabsContent value="lexicon" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="flex gap-2 mb-3 shrink-0">
              <Input
                value={newWord}
                onChange={e => setNewWord(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addLexEntry()}
                placeholder="인공어 단어"
                className="font-mono text-sm"
                data-testid="input-new-word"
              />
              <Input
                value={newMeaning}
                onChange={e => setNewMeaning(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addLexEntry()}
                placeholder="의미 (한국어)"
                className="text-sm"
                data-testid="input-new-meaning"
              />
              <Select value={newPos} onValueChange={setNewPos}>
                <SelectTrigger className="w-28 text-sm shrink-0" data-testid="select-new-pos">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POS_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="default" onClick={addLexEntry} data-testid="btn-add-word">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto border rounded-lg">
              {lexicon.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                  단어를 추가해 어휘집을 채워보세요.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">인공어 단어</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">의미</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">품사</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lexicon.map((entry, idx) => (
                      <tr key={entry.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/10"} data-testid={`row-lexicon-${entry.id}`}>
                        <td className="px-3 py-2 font-mono">{entry.word}</td>
                        <td className="px-3 py-2">{entry.meaning}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">{entry.pos}</Badge>
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => removeLexEntry(entry.id)}
                            data-testid={`btn-remove-word-${entry.id}`}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {lexicon.length > 0 && (
              <div className="flex items-center justify-between pt-3 shrink-0">
                <p className="text-xs text-muted-foreground">{lexicon.length}개 단어</p>
                <Button variant="outline" size="sm" onClick={downloadLexicon} data-testid="btn-download-lexicon">
                  어휘집 내보내기 (.txt)
                </Button>
              </div>
            )}
          </TabsContent>

          {/* 음운 변화 규칙 */}
          <TabsContent value="soundchange" className="flex-1 overflow-hidden flex flex-col mt-4 gap-4">
            {/* 규칙 추가 */}
            <div className="shrink-0 space-y-2">
              <SectionTitle>새 규칙 추가</SectionTitle>
              <p className="text-xs text-muted-foreground -mt-1 mb-2">
                특정 환경에서 음소가 어떻게 바뀌는지 정의합니다. 규칙은 위에서 아래 순서로 적용됩니다.
              </p>
              <div className="flex gap-2 items-center">
                <Input
                  value={ruleFrom}
                  onChange={e => setRuleFrom(e.target.value)}
                  placeholder="변화 전 (예: p)"
                  className="font-mono text-sm w-32 shrink-0"
                  data-testid="input-rule-from"
                />
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  value={ruleTo}
                  onChange={e => setRuleTo(e.target.value)}
                  placeholder="변화 후 (예: b)"
                  className="font-mono text-sm w-32 shrink-0"
                  data-testid="input-rule-to"
                />
                <Select value={ruleEnv} onValueChange={setRuleEnv}>
                  <SelectTrigger className="text-sm" data-testid="select-rule-env">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENVIRONMENT_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Input
                  value={ruleNote}
                  onChange={e => setRuleNote(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addRule()}
                  placeholder="메모 (선택, 예: 유성음화)"
                  className="text-sm"
                  data-testid="input-rule-note"
                />
                <Button variant="default" onClick={addRule} data-testid="btn-add-rule" className="shrink-0">
                  <Plus className="w-4 h-4 mr-1" />
                  추가
                </Button>
              </div>
            </div>

            {/* 규칙 목록 */}
            <div className="shrink-0">
              {rules.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3 border rounded-lg bg-muted/10">
                  아직 규칙이 없습니다. 위에서 규칙을 추가하세요.
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  {rules.map((rule, idx) => (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-2 px-3 py-2 text-sm ${idx % 2 === 0 ? "bg-background" : "bg-muted/10"}`}
                      data-testid={`row-rule-${rule.id}`}
                    >
                      <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
                      <span className="font-mono text-primary font-medium w-8">{rule.from || "∅"}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="font-mono text-primary font-medium w-8">{rule.to || "∅"}</span>
                      <Badge variant="outline" className="text-xs shrink-0">{envLabel(rule.env)}</Badge>
                      {rule.note && <span className="text-xs text-muted-foreground truncate flex-1">{rule.note}</span>}
                      <div className="flex gap-1 ml-auto shrink-0">
                        <button onClick={() => moveRule(rule.id, -1)} disabled={idx === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors rotate-[-90deg]"
                          data-testid={`btn-rule-up-${rule.id}`}>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => moveRule(rule.id, 1)} disabled={idx === rules.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors rotate-90"
                          data-testid={`btn-rule-down-${rule.id}`}>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeRule(rule.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                          data-testid={`btn-remove-rule-${rule.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 적용 결과 */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <SectionTitle>어휘집 적용 결과</SectionTitle>
                {ruleResults.some(e => e.word !== e.derived) && (
                  <Button variant="outline" size="sm" onClick={downloadDerived} data-testid="btn-download-derived">
                    변화형 내보내기 (.txt)
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto border rounded-lg min-h-0">
                {lexicon.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                    어휘집 탭에서 단어를 추가하면 변화 결과가 여기 표시됩니다.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">원형</th>
                        <th className="px-2 py-2 text-muted-foreground text-xs"></th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">변화형</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">의미</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ruleResults.map((entry, idx) => {
                        const changed = entry.word !== entry.derived;
                        return (
                          <tr key={entry.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/10"} data-testid={`row-result-${entry.id}`}>
                            <td className="px-3 py-2 font-mono text-muted-foreground">{entry.word}</td>
                            <td className="px-2 py-2 text-muted-foreground">
                              <ArrowRight className="w-3 h-3" />
                            </td>
                            <td className={`px-3 py-2 font-mono font-medium ${changed ? "text-primary" : "text-muted-foreground"}`}>
                              {entry.derived}
                              {changed && <span className="ml-1.5 text-xs text-muted-foreground font-normal">(변화)</span>}
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">{entry.meaning}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
