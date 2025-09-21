import React from 'react';
import { Zap } from 'lucide-react';

interface EnergyBarProps {
	progressPercent: number;
	isFull: boolean;
	isCollecting: boolean;
	onCollect?: () => void;
}

export const EnergyBar: React.FC<EnergyBarProps> = ({ 
	progressPercent, 
	isFull, 
	isCollecting, 
	onCollect 
}) => {
	return (
		<div className="w-full max-w-md mx-auto mb-4">
			{/* 에너지바와 수집 버튼 통합 컨테이너 */}
			<div className="relative flex items-center gap-3">
				{/* 에너지바 */}
				<div className="flex-1">
					<div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/10 relative">
						<div
							className={`h-full transition-all duration-500 ${
								isFull 
									? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
									: 'bg-gradient-to-r from-cyan-400 to-blue-500'
							}`}
							style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
						/>
						
						{/* 에너지 가득참 반짝거림 효과 */}
						{isFull && !isCollecting && (
							<div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-orange-500/30 animate-pulse rounded-full" />
						)}
					</div>
				</div>

				{/* 통합 수집 버튼 - 에너지바와 정확히 중앙 정렬 */}
				<button
					onClick={onCollect}
					disabled={!isFull || isCollecting || !onCollect}
					className={`
						w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0
						${isFull && !isCollecting 
							? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 active:scale-95' 
							: 'bg-white/10 border border-white/20'
						}
						${isFull && !isCollecting ? 'animate-pulse hover:animate-none' : ''}
					`}
				>
					<Zap 
						size={14} 
						className={`
							${isFull && !isCollecting 
								? 'text-white drop-shadow-sm' 
								: 'text-white/40'
							}
						`} 
					/>
					
					{/* 수집 가능할 때 반짝거리는 링 */}
					{isFull && !isCollecting && (
						<div className="absolute inset-0 rounded-full border-2 border-yellow-300/60 animate-ping" />
					)}
				</button>
			</div>
			
			{/* 통합 상태/안내 텍스트 - 고정 높이로 덜컥거림 방지 */}
			<div className="mt-1 h-5 flex items-center justify-between">
				{/* 왼쪽: 상태 텍스트 */}
				<div className="text-[10px] text-white/60 font-display">
					{isFull ? (isCollecting ? '수집 중...' : '100% 충전됨') : `${Math.round(progressPercent)}%`}
				</div>
				
				{/* 오른쪽: 수집 안내 (에너지 가득찰 때만) */}
				<div className="flex items-center">
					{isFull && !isCollecting && (
						<span className="text-xs text-yellow-400/80 font-display animate-pulse transition-opacity duration-300">
							⚡ 수집하세요! (+150 RP)
						</span>
					)}
				</div>
			</div>
		</div>
	);
};


