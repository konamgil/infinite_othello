/**
 * IndexedDB에서 값을 검색하기 위한 플레이스홀더(placeholder) 함수입니다.
 * 현재는 아무 작업도 수행하지 않으며 항상 undefined를 반환합니다.
 *
 * @template T - 검색할 값의 타입.
 * @param {string} _key - 검색할 아이템의 키.
 * @returns {Promise<T | undefined>} 항상 undefined로 귀결되는 프로미스.
 */
export async function get<T>(_key: string): Promise<T | undefined> {
  return undefined;
}

/**
 * IndexedDB에 값을 저장하기 위한 플레이스홀더 함수입니다.
 * 현재는 아무 작업도 수행하지 않습니다(no-op).
 *
 * @template T - 저장할 값의 타입.
 * @param {string} _key - 저장할 아이템의 키.
 * @param {T} _value - 저장할 값.
 */
export async function set<T>(_key: string, _value: T): Promise<void> {
  // 아무 작업도 하지 않는 플레이스홀더
}

