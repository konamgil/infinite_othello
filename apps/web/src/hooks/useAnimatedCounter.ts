import { useEffect, useRef, useState } from 'react';

export interface UseAnimatedCounterOptions {
	/** 전체 애니메이션 소요 시간(ms) */
	durationMs?: number;
	/** 갱신 스텝 수 (프레임 개념) */
	steps?: number;
}

export interface UseAnimatedCounterApi {
	/** 현재 표시 값 */
	value: number;
	/** 지정한 목표 값까지 애니메이션 */
	animateTo: (targetValue: number) => void;
	/** 즉시 값을 설정 (애니메이션 없이) */
	setValue: (nextValue: number) => void;
}

/**
 * 숫자 값을 부드럽게 증가/감소시키는 범용 카운터 훅
 * - 고정된 duration과 steps로 간단한 보간을 수행합니다.
 * - 외부 상태 변경과의 동기화를 위해 setValue를 노출합니다.
 */
export function useAnimatedCounter(
	initialValue: number,
	options?: UseAnimatedCounterOptions
): UseAnimatedCounterApi {
	const { durationMs = 1500, steps = 60 } = options || {};
	const [value, setValue] = useState<number>(initialValue);
	const intervalRef = useRef<number | null>(null);

	const clear = () => {
		if (intervalRef.current !== null) {
			window.clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	};

	const animateTo = (targetValue: number) => {
		clear();
		const startValue = value;
		if (startValue === targetValue || steps <= 0 || durationMs <= 0) {
			setValue(targetValue);
			return;
		}
		const difference = targetValue - startValue;
		const stepValue = difference / steps;
		let currentStep = 0;
		const intervalMs = durationMs / steps;

		intervalRef.current = window.setInterval(() => {
			currentStep += 1;
			const next = Math.round(startValue + stepValue * currentStep);
			setValue(next);
			if (currentStep >= steps) {
				clear();
				setValue(targetValue);
			}
		}, intervalMs);
	};

	useEffect(() => () => clear(), []);

	return { value, animateTo, setValue };
}


