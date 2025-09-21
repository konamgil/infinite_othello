import { useCallback, useEffect, useRef, useState } from 'react';

export interface TowerEnergyState {
	progressPercent: number; // 0 ~ 100
	isFull: boolean;
	isCollecting: boolean;
	lastTickMs: number;
}

export interface UseTowerEnergyOptions {
	/** 100%까지 충전되는 데 필요한 시간(초). 기본 3600초(1시간) */
	fullChargeSeconds?: number;
	/** 로컬스토리지 key prefix */
	storageKey?: string;
	/** 개발/테스트용: 마운트 시 즉시 100%로 설정 */
	debugStartFull?: boolean;
}

export interface UseTowerEnergyApi extends TowerEnergyState {
	collect: () => void;
	reset: () => void;
}

const now = () => Date.now();

export function useTowerEnergy(
	options?: UseTowerEnergyOptions
): UseTowerEnergyApi {
	const {
		fullChargeSeconds = 3600,
		storageKey = 'towerEnergy',
		debugStartFull = false,
	} = options || {};

	const [progressPercent, setProgressPercent] = useState(0);
	const [isFull, setIsFull] = useState(false);
	const [isCollecting, setIsCollecting] = useState(false);
	const [lastTickMs, setLastTickMs] = useState(now());

	const intervalRef = useRef<number | null>(null);

	const clear = () => {
		if (intervalRef.current !== null) {
			window.clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	};

	const persist = (timeMs: number, progress: number) => {
		try {
			localStorage.setItem(`${storageKey}:time`, String(timeMs));
			localStorage.setItem(`${storageKey}:progress`, String(progress));
		} catch {}
	};

	useEffect(() => {
		try {
			if (debugStartFull) {
				setProgressPercent(100);
				setIsFull(true);
				const t = now();
				setLastTickMs(t);
				persist(t, 100);
				return;
			}

			const savedTime = localStorage.getItem(`${storageKey}:time`);
			const savedProgress = localStorage.getItem(`${storageKey}:progress`);
			const t = now();

			if (savedTime && savedProgress) {
				const last = parseInt(savedTime, 10);
				const progress = parseFloat(savedProgress);
				const deltaSec = (t - last) / 1000;
				const gained = (deltaSec / fullChargeSeconds) * 100;
				const next = Math.min(100, progress + gained);
				setProgressPercent(next);
				setIsFull(next >= 100);
				setLastTickMs(t);
				persist(t, next);
			} else {
				setProgressPercent(0);
				setIsFull(false);
				setLastTickMs(t);
				persist(t, 0);
			}
		} catch {
			// storage가 막힌 환경에서도 정상 동작하게 그냥 진행
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		clear();
		intervalRef.current = window.setInterval(() => {
			setLastTickMs((prev) => {
				const current = now();
				const deltaSec = (current - prev) / 1000;
				setProgressPercent((p) => {
					if (p >= 100) return 100;
					const gained = (deltaSec / fullChargeSeconds) * 100;
					const next = Math.min(100, p + gained);
					setIsFull(next >= 100);
					persist(current, next);
					return next;
				});
				return current;
			});
		}, 1000);
		return () => clear();
	}, [fullChargeSeconds, storageKey]);

	const reset = useCallback(() => {
		const t = now();
		setProgressPercent(0);
		setIsFull(false);
		setLastTickMs(t);
		persist(t, 0);
	}, [storageKey]);

	const collect = useCallback(() => {
		if (!isFull || isCollecting) return;
		setIsCollecting(true);
		// 수집 애니메이션이 끝나면 1.5초 후 초기화, 1초 후 수집 종료
		setTimeout(() => {
			reset();
		}, 1500);
		setTimeout(() => {
			setIsCollecting(false);
		}, 2500);
	}, [isFull, isCollecting, reset]);

	return {
		progressPercent,
		isFull,
		isCollecting,
		lastTickMs,
		collect,
		reset,
	};
}


