import { __test__ } from '@/lib/ai/parse-resume';

const { extractSummaryFallback, extractExperienceFallback, extractProjectsFallback, extractProjectSummaryFallback } = __test__;

describe('extractSummaryFallback', () => {
  it('한국어 표준 자기소개 섹션을 추출한다', () => {
    const text = `홍길동
이메일: hong@example.com

자기소개
3년차 프론트엔드 개발자로 React 와 TypeScript 를 주로 사용합니다.
사용자 경험과 성능 최적화에 관심이 많습니다.

경력 사항
2020.01 ~ 2023.05  (주)테스트
프론트엔드 개발자
- 메인 페이지 리팩터링`;
    const result = extractSummaryFallback(text);
    expect(result).toContain('3년차 프론트엔드 개발자');
    expect(result).toContain('성능 최적화');
    expect(result).not.toContain('메인 페이지');
  });

  it('영문 Summary 헤더를 추출한다', () => {
    const text = `Jane Doe

Summary
Senior backend engineer with 5 years of experience in distributed systems.

Experience
2019.03 ~ 2024.01  Acme Corp.
`;
    const result = extractSummaryFallback(text);
    expect(result).toContain('Senior backend engineer');
  });

  it('머리표 prefix 가 붙은 헤더도 인식한다', () => {
    const text = `■ 자기소개
백엔드 5년차입니다.

■ 경력`;
    const result = extractSummaryFallback(text);
    expect(result).toBe('백엔드 5년차입니다.');
  });

  it('헤더 잔여 텍스트(콜론 뒤)도 수집한다', () => {
    const text = `자기소개: 풀스택 개발자입니다.

경력`;
    const result = extractSummaryFallback(text);
    expect(result).toBe('풀스택 개발자입니다.');
  });

  it('summary 섹션이 없으면 빈 문자열을 반환한다', () => {
    const text = `홍길동
경력
2020 ~ 2023  회사`;
    expect(extractSummaryFallback(text)).toBe('');
  });
});

describe('extractExperienceFallback', () => {
  it('한국어 경력 섹션의 entry 를 추출한다', () => {
    const text = `자기소개
요약 텍스트

경력 사항
2020.01 ~ 2023.05
(주)테스트컴퍼니
프론트엔드 개발자
- 메인 페이지 리팩터링
- 성능 최적화로 LCP 30% 개선

2018.03 ~ 2019.12
주식회사 알파
백엔드 개발자
- API 개발

학력
서울대학교`;
    const result = extractExperienceFallback(text);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]?.period).toMatch(/2020\.01/);
    expect(result[0]?.company).toMatch(/테스트컴퍼니/);
    expect(result[0]?.role).toMatch(/프론트엔드/);
    expect(result[0]?.description).toMatch(/리팩터링|LCP/);
    expect(result[1]?.company).toMatch(/알파/);
  });

  it('영문 Experience 섹션도 추출한다', () => {
    const text = `Summary
Engineer.

Experience
2020.03 ~ 2024.01
Acme Inc.
Senior Engineer
- Built scalable services

Education
MIT`;
    const result = extractExperienceFallback(text);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]?.company).toMatch(/Acme/);
    expect(result[0]?.role).toMatch(/Engineer/i);
  });

  it('프로젝트 섹션만 있는 이력서는 경력을 빈 배열로 반환한다', () => {
    const text = `자기소개
신입 개발자입니다.

프로젝트 경험
2023.06 ~ 2023.12
캐봄 - 이력서 분석 서비스
프론트엔드 개발자
- Next.js 로 위저드 UI 구현
- Tailwind CSS 디자인 시스템

학력
서울대학교`;
    const result = extractExperienceFallback(text);
    expect(result).toEqual([]);
  });

  it('경력 + 프로젝트 섹션이 모두 있으면 경력만 반환한다', () => {
    const text = `경력
2020.01 ~ 2022.12
(주)에이
개발자
- 업무

프로젝트
2023.01 ~ 2023.06
사이드 프로젝트
풀스택
- 개인 작업

학력
대학교`;
    const result = extractExperienceFallback(text);
    expect(result.length).toBe(1);
    expect(result[0]?.company).toMatch(/에이/);
  });

  it('경력 섹션이 없으면 빈 배열을 반환한다', () => {
    const text = `홍길동
이메일: a@b.com
학력
대학교`;
    expect(extractExperienceFallback(text)).toEqual([]);
  });
});

describe('extractProjectsFallback', () => {
  it('프로젝트 섹션에서 항목을 추출한다', () => {
    const text = `프로젝트 경험
2023.06 ~ 2023.12
캐봄 - 이력서 분석 서비스
프론트엔드 개발자
- Next.js 로 위저드 UI 구현

학력
서울대학교`;
    const result = extractProjectsFallback(text);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]?.period).toMatch(/2023\.06/);
    expect(result[0]?.description).toMatch(/Next\.js/);
  });

  it('경력 섹션만 있으면 프로젝트는 빈 배열을 반환한다', () => {
    const text = `경력\n2020.01 ~ 2022.12\n(주)테스트\n개발자\n- 업무`;
    expect(extractProjectsFallback(text)).toEqual([]);
  });
});

describe('extractProjectSummaryFallback', () => {
  it('프로젝트 섹션에서 정제된 요약 문장을 생성한다', () => {
    const text = `프로젝트 경험
2023.06 ~ 2023.12
캐봄 - 이력서 분석 서비스
프론트엔드 개발자
- Next.js 로 위저드 UI 구현
- Tailwind CSS 디자인 시스템

학력
서울대학교`;
    const result = extractProjectSummaryFallback(text);
    expect(result).toContain('캐봄');
    expect(result).toContain('프론트엔드');
    expect(result).not.toContain('프로젝트 제목:');
  });

  it('"프로젝트 제목:" 레이블을 제거한 회사명을 사용한다', () => {
    const text = `프로젝트
2023.01 ~ 2023.06
프로젝트 제목: 누뉴(NUNEW)
프론트엔드
- 기능 구현

학력
대학교`;
    const result = extractProjectSummaryFallback(text);
    expect(result).toContain('누뉴(NUNEW)');
    expect(result).not.toContain('프로젝트 제목:');
  });

  it('프로젝트가 여러 개면 문장을 이어 붙인다', () => {
    const text = `프로젝트
2023.01 ~ 2023.06
알파 앱
프론트엔드
- 기능 A

2023.07 ~ 2023.12
베타 서비스
백엔드
- 기능 B

학력
대학교`;
    const result = extractProjectSummaryFallback(text);
    expect(result).toContain('알파');
    expect(result).toContain('베타');
  });

  it('프로젝트 섹션이 없으면 빈 문자열을 반환한다', () => {
    const text = `홍길동\n경력\n2020 ~ 2022  (주)테스트`;
    expect(extractProjectSummaryFallback(text)).toBe('');
  });
});
