import React, { useState, useCallback } from 'react';
import { GameReplay } from '../../../types/replay';
import {
  Download, FileText, Image, Video, Share2, Copy, Check,
  Loader2, X, Settings, Eye, Camera, Film, Database
} from 'lucide-react';

/**
 * @interface ReplayExporterProps
 * `ReplayExporter` 컴포넌트의 props를 정의합니다.
 */
interface ReplayExporterProps {
  /** @property {GameReplay} replay - 내보낼 리플레이 데이터. */
  replay: GameReplay;
  /** @property {() => void} onClose - 내보내기 모달을 닫을 때 호출될 콜백. */
  onClose: () => void;
  /** @property {string} [className] - 컴포넌트의 최상위 요소에 적용할 추가 CSS 클래스. */
  className?: string;
}

/**
 * @interface ExportOptions
 * 사용자가 선택할 수 있는 다양한 내보내기 옵션의 타입을 정의합니다.
 */
interface ExportOptions {
  format: 'json' | 'pgn' | 'gif' | 'mp4' | 'png' | 'svg';
  includeAnalysis: boolean;
  includeComments: boolean;
  includeTimestamps: boolean;
  compressData: boolean;
  imageSize: 'small' | 'medium' | 'large';
  animationSpeed: 'slow' | 'normal' | 'fast';
  theme: 'cosmic' | 'classic' | 'modern';
}

/**
 * 게임 리플레이를 다양한 형식으로 내보내는 모달 UI를 제공하는 컴포넌트입니다.
 * 사용자는 형식과 세부 옵션을 선택하여 데이터를 다운로드하거나 공유 링크를 생성할 수 있습니다.
 * @param {ReplayExporterProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 리플레이 내보내기 모달 UI.
 */
export function ReplayExporter({ replay, onClose, className = '' }: ReplayExporterProps) {
  /** @state {ExportOptions} exportOptions - 현재 선택된 내보내기 옵션. */
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeAnalysis: true,
    includeComments: true,
    includeTimestamps: true,
    compressData: false,
    imageSize: 'medium',
    animationSpeed: 'normal',
    theme: 'cosmic'
  });

  /** @state {boolean} isExporting - 현재 내보내기 프로세스가 진행 중인지 여부. */
  const [isExporting, setIsExporting] = useState(false);
  /** @state {number} exportProgress - 내보내기 진행률 (0-100). */
  const [exportProgress, setExportProgress] = useState(0);
  /** @state {boolean} copied - 공유 URL이 클립보드에 복사되었는지 여부. */
  const [copied, setCopied] = useState(false);
  /** @state {string | null} shareUrl - 생성된 공유 URL. */
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  /** 내보내기 형식 선택 UI를 위한 설정값 배열. */
  const formatOptions = [
    { format: 'json' as const, icon: Database, title: 'JSON 데이터', description: '완전한 게임 데이터와 분석 정보', color: 'text-blue-400', bgColor: 'bg-blue-400/10', borderColor: 'border-blue-400/20' },
    { format: 'pgn' as const, icon: FileText, title: 'PGN 파일', description: '표준 게임 기록 형식', color: 'text-green-400', bgColor: 'bg-green-400/10', borderColor: 'border-green-400/20' },
    { format: 'png' as const, icon: Image, title: '게임 보드 이미지', description: '최종 게임 상태 스크린샷', color: 'text-purple-400', bgColor: 'bg-purple-400/10', borderColor: 'border-purple-400/20' },
    { format: 'gif' as const, icon: Camera, title: '애니메이션 GIF', description: '전체 게임 진행 애니메이션', color: 'text-amber-400', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/20' },
    { format: 'mp4' as const, icon: Video, title: 'MP4 비디오', description: '고품질 게임 재생 비디오', color: 'text-red-400', bgColor: 'bg-red-400/10', borderColor: 'border-red-400/20' },
    { format: 'svg' as const, icon: Film, title: 'SVG 다이어그램', description: '벡터 형식 게임 보드', color: 'text-cyan-400', bgColor: 'bg-cyan-400/10', borderColor: 'border-cyan-400/20' }
  ];

  /**
   * 게임 데이터와 선택된 형식을 기반으로 다운로드할 파일명을 생성합니다.
   * @returns {string} 생성된 파일명.
   */
  const generateFileName = useCallback(() => {
    const date = new Date(replay.gameInfo.startTime).toISOString().split('T')[0];
    const opponent = replay.playerBlack.name === '우주의 오델로 수호자'
      ? replay.playerWhite.name
      : replay.playerBlack.name;
    const cleanOpponent = opponent.replace(/[^a-zA-Z0-9가-힣]/g, '_');
    const result = replay.result.winner === 'draw' ? 'draw' :
      (replay.result.winner === 'black' && replay.playerBlack.name === '우주의 오델로 수호자') ||
      (replay.result.winner === 'white' && replay.playerWhite.name === '우주의 오델로 수호자')
        ? 'win' : 'loss';

    return `othello_${date}_vs_${cleanOpponent}_${result}.${exportOptions.format}`;
  }, [replay, exportOptions.format]);

  /**
   * 내보내기 프로세스를 시뮬레이션하고, 데이터를 생성하여 다운로드를 트리거합니다.
   */
  const simulateExport = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);

    // 1. 내보내기 진행률 시뮬레이션
    const progressSteps = [10, 25, 50, 75, 90, 100];
    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      setExportProgress(step);
    }

    // 2. 형식에 따른 데이터 생성
    let exportData: string | Blob;
    const fileName = generateFileName();
    try {
      switch (exportOptions.format) {
        case 'json':
          exportData = JSON.stringify({ gameInfo: replay.gameInfo, players: { black: replay.playerBlack, white: replay.playerWhite }, result: replay.result, moves: exportOptions.includeTimestamps ? replay.moves : replay.moves.map(m => ({ ...m, timestamp: undefined })), analysis: exportOptions.includeAnalysis ? replay.analysis : undefined, metadata: replay.metadata, exportOptions: { exportedAt: new Date().toISOString(), version: '1.0.0', format: 'json' } }, null, exportOptions.compressData ? 0 : 2);
          break;
        case 'pgn':
          exportData = generatePGN();
          break;
        case 'png': case 'gif': case 'mp4': case 'svg':
          // 실제 미디어 파일 생성 대신 데모용 플레이스홀더 데이터 생성
          exportData = `# ${exportOptions.format.toUpperCase()} Export\n# Game: ${replay.id}\n# Generated: ${new Date().toISOString()}`;
          break;
        default:
          throw new Error(`Unsupported format: ${exportOptions.format}`);
      }

      // 3. 파일 다운로드 트리거
      const blob = typeof exportData === 'string' ? new Blob([exportData], { type: 'text/plain' }) : exportData;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 4. 공유 URL 생성 (지원되는 형식의 경우)
      if (['json', 'pgn'].includes(exportOptions.format)) {
        const shareId = btoa(replay.id + Date.now().toString()).slice(0, 12);
        setShareUrl(`https://othello.space/replay/${shareId}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [replay, exportOptions, generateFileName]);

  /**
   * 리플레이 데이터를 PGN(Portable Game Notation) 형식의 문자열로 변환합니다.
   * @returns {string} PGN 형식 문자열.
   */
  const generatePGN = (): string => {
    const date = new Date(replay.gameInfo.startTime);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '.');
    let pgn = `[Event "Infinity Othello Game"]\n[Site "Infinity Othello"]\n[Date "${dateStr}"]\n[Round "-"]\n[Black "${replay.playerBlack.name}"]\n[White "${replay.playerWhite.name}"]\n[Result "${replay.result.winner === 'black' ? '1-0' : replay.result.winner === 'white' ? '0-1' : '1/2-1/2'}"]\n[GameMode "${replay.gameMode}"]\n[TimeControl "-"]\n[FinalScore "${replay.result.finalScore.black}-${replay.result.finalScore.white}"]\n\n`;

    replay.moves.forEach((move, index) => {
      const moveNumber = Math.floor(index / 2) + 1;
      const position = `${String.fromCharCode(97 + move.x)}${move.y + 1}`;
      if (index % 2 === 0) pgn += `${moveNumber}. ${position}`;
      else pgn += ` ${position}${index < replay.moves.length - 1 ? '\n' : ''}`;
      if (exportOptions.includeComments && move.evaluationScore !== undefined) pgn += ` {[%eval ${move.evaluationScore}]}`;
    });
    pgn += `\n\n${replay.result.winner === 'black' ? '1-0' : replay.result.winner === 'white' ? '0-1' : '1/2-1/2'}`;
    return pgn;
  };

  /** 생성된 공유 URL을 클립보드에 복사합니다. */
  const copyShareUrl = useCallback(async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  }, [shareUrl]);

  /** 현재 선택된 형식의 설정 객체를 반환합니다. */
  const getFormatConfig = () => {
    return formatOptions.find(opt => opt.format === exportOptions.format);
  };

  return (
    <div className={`fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 ${className}`}>
      <div className="w-full max-w-2xl bg-black/70 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
              <Download size={20} className="text-purple-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-display tracking-wider">
                리플레이 내보내기
              </h2>
              <p className="text-sm text-white/60 font-display">
                게임 데이터를 다양한 형식으로 저장하세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            disabled={isExporting}
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Export Progress */}
        {isExporting && (
          <div className="p-4 sm:p-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 size={20} className="text-blue-400 animate-spin" />
              <span className="text-white/90 font-display">내보내는 중...</span>
              <span className="text-white/60 text-sm">{exportProgress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Format Selection */}
          <div>
            <h3 className="text-sm font-semibold text-white/90 mb-3 font-display">내보내기 형식</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formatOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = exportOptions.format === option.format;

                return (
                  <button
                    key={option.format}
                    onClick={() => setExportOptions(prev => ({ ...prev, format: option.format }))}
                    disabled={isExporting}
                    className={`p-3 sm:p-4 rounded-xl border text-left transition-all duration-200 ${
                      isSelected
                        ? `${option.bgColor} ${option.borderColor} scale-105`
                        : 'bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon size={20} className={isSelected ? option.color : 'text-white/60'} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white/90 text-sm font-display mb-1">
                          {option.title}
                        </h4>
                        <p className="text-xs text-white/60 font-display">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Options */}
          <div>
            <h3 className="text-sm font-semibold text-white/90 mb-3 font-display flex items-center gap-2">
              <Settings size={16} />
              내보내기 옵션
            </h3>

            <div className="space-y-3">
              {/* Data Options */}
              {['json', 'pgn'].includes(exportOptions.format) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 rounded-lg bg-black/20 border border-white/10 cursor-pointer hover:bg-black/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeAnalysis}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeAnalysis: e.target.checked }))}
                      disabled={isExporting}
                      className="w-4 h-4 rounded border-white/20 bg-black/30 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-white/80 font-display">분석 데이터 포함</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-lg bg-black/20 border border-white/10 cursor-pointer hover:bg-black/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeTimestamps}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeTimestamps: e.target.checked }))}
                      disabled={isExporting}
                      className="w-4 h-4 rounded border-white/20 bg-black/30 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-white/80 font-display">타임스탬프 포함</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-lg bg-black/20 border border-white/10 cursor-pointer hover:bg-black/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeComments}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeComments: e.target.checked }))}
                      disabled={isExporting}
                      className="w-4 h-4 rounded border-white/20 bg-black/30 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-white/80 font-display">해설 포함</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-lg bg-black/20 border border-white/10 cursor-pointer hover:bg-black/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={exportOptions.compressData}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, compressData: e.target.checked }))}
                      disabled={isExporting}
                      className="w-4 h-4 rounded border-white/20 bg-black/30 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-white/80 font-display">데이터 압축</span>
                  </label>
                </div>
              )}

              {/* Media Options */}
              {['png', 'gif', 'mp4', 'svg'].includes(exportOptions.format) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-2 font-display">이미지 크기</label>
                    <select
                      value={exportOptions.imageSize}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, imageSize: e.target.value as any }))}
                      disabled={isExporting}
                      className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white/80 text-sm font-display focus:border-purple-400 focus:outline-none"
                    >
                      <option value="small">작음 (512x512)</option>
                      <option value="medium">보통 (1024x1024)</option>
                      <option value="large">큼 (2048x2048)</option>
                    </select>
                  </div>

                  {['gif', 'mp4'].includes(exportOptions.format) && (
                    <div>
                      <label className="block text-xs text-white/60 mb-2 font-display">애니메이션 속도</label>
                      <select
                        value={exportOptions.animationSpeed}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, animationSpeed: e.target.value as any }))}
                        disabled={isExporting}
                        className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white/80 text-sm font-display focus:border-purple-400 focus:outline-none"
                      >
                        <option value="slow">느림 (0.5x)</option>
                        <option value="normal">보통 (1x)</option>
                        <option value="fast">빠름 (2x)</option>
                      </select>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-white/60 mb-2 font-display">테마</label>
                    <select
                      value={exportOptions.theme}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, theme: e.target.value as any }))}
                      disabled={isExporting}
                      className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white/80 text-sm font-display focus:border-purple-400 focus:outline-none"
                    >
                      <option value="cosmic">우주 테마</option>
                      <option value="classic">클래식 테마</option>
                      <option value="modern">모던 테마</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* File Preview */}
          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
            <h4 className="text-sm font-semibold text-white/90 mb-2 font-display flex items-center gap-2">
              <Eye size={16} />
              파일 미리보기
            </h4>
            <div className="text-sm text-white/70 font-mono bg-black/30 rounded-lg p-3 border border-white/10">
              <div className="flex items-center justify-between">
                <span>파일명: {generateFileName()}</span>
                <span className="text-xs text-white/50">
                  {getFormatConfig()?.format.toUpperCase()}
                </span>
              </div>
              <div className="mt-2 text-xs text-white/50">
                게임 ID: {replay.id} • 수 개수: {replay.moves.length} •
                결과: {replay.result.finalScore.black}-{replay.result.finalScore.white}
              </div>
            </div>
          </div>

          {/* Share URL */}
          {shareUrl && (
            <div className="p-4 rounded-xl bg-green-400/10 border border-green-400/20">
              <h4 className="text-sm font-semibold text-green-300 mb-2 font-display flex items-center gap-2">
                <Share2 size={16} />
                공유 링크 생성됨
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white/80 text-sm font-mono focus:outline-none"
                />
                <button
                  onClick={copyShareUrl}
                  className="px-3 py-2 rounded-lg bg-green-500/20 border border-green-400/30 text-green-300 hover:bg-green-500/30 transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t border-white/10">
          <div className="text-xs text-white/50 font-display">
            {getFormatConfig()?.description}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-display"
            >
              취소
            </button>
            <button
              onClick={simulateExport}
              disabled={isExporting}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed font-display flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  내보내는 중...
                </>
              ) : (
                <>
                  <Download size={16} />
                  내보내기
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}