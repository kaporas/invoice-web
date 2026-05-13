import { normalizeDate, parseNumber } from '@/lib/utils/notion-parser'

describe('normalizeDate', () => {
  it('유효한 날짜 문자열을 ISO 형식으로 반환한다', () => {
    expect(normalizeDate('2026-04-28')).toBe('2026-04-28')
  })

  it('null이면 오늘 날짜를 반환한다', () => {
    const result = normalizeDate(null)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('잘못된 날짜 문자열이면 오늘 날짜를 반환한다', () => {
    const result = normalizeDate('invalid-date')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('parseNumber', () => {
  it('숫자를 그대로 반환한다', () => {
    expect(parseNumber(500000)).toBe(500000)
  })

  it('숫자 문자열을 파싱한다', () => {
    expect(parseNumber('1234')).toBe(1234)
  })

  it('파싱 불가 값이면 기본값을 반환한다', () => {
    expect(parseNumber('abc', 0)).toBe(0)
  })

  it('null이면 기본값을 반환한다', () => {
    expect(parseNumber(null, 99)).toBe(99)
  })
})
