import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Plus, Trash2 } from "lucide-react";

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

const PRESET_SYLLABLES = ["CV", "CVC", "CVCC", "CCV", "CCVC", "V", "VC"];

interface LexEntry {
  id: number;
  word: string;
  meaning: string;
  pos: string;
}

const POS_OPTIONS = ["명사", "동사", "형용사", "부사", "접속사", "전치사", "기타"];

export function LangToolsDialog() {
  const [selectedConsonants, setSelectedConsonants] = useState<Set<string>>(new Set());
  const [selectedVowels, setSelectedVowels] = useState<Set<string>>(new Set());
  const [syllablePatterns, setSyllablePatterns] = useState<string[]>(["CV", "CVC"]);
  const [customSyllable, setCustomSyllable] = useState("");
  const [wordOrder, setWordOrder] = useState("SOV");
  const [morphologyType, setMorphologyType] = useState("교착어");
  const [headDirection, setHeadDirection] = useState("핵어후치");
  const [caseSuffix, setCaseSuffix] = useState(true);
  const [lexicon, setLexicon] = useState<LexEntry[]>([]);
  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [newPos, setNewPos] = useState("명사");
  const [nextId, setNextId] = useState(1);

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
    setLexicon(prev => [...prev, { id: nextId, word: newWord.trim(), meaning: newMeaning.trim(), pos: newPos }]);
    setNextId(n => n + 1);
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

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{children}</p>
  );

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
          <TabsList className="grid grid-cols-4 w-full shrink-0">
            <TabsTrigger value="phonemes" data-testid="tab-phonemes">음소 목록</TabsTrigger>
            <TabsTrigger value="phonotactics" data-testid="tab-phonotactics">음절 구조</TabsTrigger>
            <TabsTrigger value="typology" data-testid="tab-typology">유형론</TabsTrigger>
            <TabsTrigger value="lexicon" data-testid="tab-lexicon">어휘집</TabsTrigger>
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
