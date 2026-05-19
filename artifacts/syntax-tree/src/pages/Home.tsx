import React, { useState, useEffect } from 'react';
import { parseIndentedTree } from '@/lib/treeParser';
import { TreeRenderer } from '@/components/TreeRenderer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Play, Settings } from 'lucide-react';
import { LangToolsDialog } from '@/components/LangToolsDialog';

const EXAMPLE_TEXT = `S
  NP
    Det
      이
    N
      고양이가
  VP
    V
      앉았다`;

export default function Home() {
  const [text, setText] = useState('');
  const [lineStyle, setLineStyle] = useState<'straight' | 'curved'>('curved');
  const [theme, setTheme] = useState<'light' | 'dark' | 'colorful'>('light');
  const [fontSize, setFontSize] = useState([16]);

  const tree = parseIndentedTree(text);

  const loadExample = () => {
    setText(EXAMPLE_TEXT);
  };

  const downloadSvg = () => {
    const svgEl = document.getElementById('tree-svg');
    if (!svgEl) return;
    
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'syntax-tree.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPng = () => {
    const svgEl = document.getElementById('tree-svg');
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = svgEl.clientWidth;
      canvas.height = svgEl.clientHeight;
      if (theme === 'dark') {
        ctx!.fillStyle = '#0f172a';
      } else {
        ctx!.fillStyle = '#ffffff';
      }
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'syntax-tree.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6 lg:p-8 flex flex-col gap-6">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-4 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">문법 트리 생성기</h1>
          <p className="text-sm text-muted-foreground mt-1">
            들여쓰기를 이용해 문장 구조를 실시간으로 시각화하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadExample} className="font-medium">
            <Play className="w-4 h-4 mr-2" />
            예시 보기
          </Button>
          <Button variant="default" onClick={downloadSvg} disabled={!tree}>
            <Download className="w-4 h-4 mr-2" />
            SVG 다운로드
          </Button>
          <Button variant="secondary" onClick={downloadPng} disabled={!tree}>
            <Download className="w-4 h-4 mr-2" />
            PNG 다운로드
          </Button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        <div className="flex flex-col gap-6 lg:col-span-1 h-[600px] lg:h-auto">
          <Card className="flex-1 flex flex-col shadow-sm">
            <div className="p-4 border-b bg-muted/10 font-medium flex items-center gap-2">
              <span>입력창</span>
            </div>
            <CardContent className="p-0 flex-1 relative">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={"2칸 들여쓰기로 트리를 구조화하세요.\n\n예시:\nS\n  NP\n    N\n      나\n  VP\n    V\n      간다"}
                className="w-full h-full min-h-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 font-mono text-sm leading-relaxed"
                spellCheck={false}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <div className="p-4 border-b bg-muted/10 font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>설정</span>
            </div>
            <CardContent className="p-4 space-y-6">
              <div className="space-y-3">
                <Label>연결선 스타일</Label>
                <Select value={lineStyle} onValueChange={(val: any) => setLineStyle(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="스타일 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="straight">직선</SelectItem>
                    <SelectItem value="curved">곡선</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>테마</Label>
                <Select value={theme} onValueChange={(val: any) => setTheme(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="테마 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">기본 (밝게)</SelectItem>
                    <SelectItem value="dark">다크 모드</SelectItem>
                    <SelectItem value="colorful">컬러풀</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>글자 크기 (노드 크기)</Label>
                  <span className="text-xs text-muted-foreground">{fontSize[0]}px</span>
                </div>
                <Slider
                  value={fontSize}
                  onValueChange={setFontSize}
                  min={12}
                  max={32}
                  step={1}
                  className="py-1"
                />
              </div>

              <div className="pt-1 border-t">
                <LangToolsDialog />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border shadow-sm relative overflow-hidden h-[600px] lg:h-auto">
          <TreeRenderer 
            tree={tree} 
            lineStyle={lineStyle} 
            theme={theme} 
            fontSize={fontSize[0]} 
          />
        </div>
      </div>
    </div>
  );
}
