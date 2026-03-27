# 주문센터 치수 제약 단일소스 가이드 (v1)

## 1) 기준 파일
- 공통 치수 기준은 `assets/js/data/dimension-constraints.js`에서 관리합니다.
- 키는 `top`, `door`, `board` 3개이며, 각 키는 아래 4개 값을 가집니다.
  - `minWidth`
  - `maxWidth`
  - `minLength`
  - `maxLength`

## 2) 코드 연결 지점
- 상판: `assets/js/data/top-data.js`, `assets/js/top.js`
- 도어: `assets/js/data/door-data.js`, `assets/js/door.js`, `door.html`
- 합판: `assets/js/data/board-data.js`, `assets/js/board.js`, `board.html`

## 3) 변경 절차
1. `assets/js/data/dimension-constraints.js`의 기준값 수정
2. 필요 시 특정 자재에서만 다른 값이 필요하면 해당 자재 객체에 개별 `min/max` 오버라이드 추가
3. 수동 확인
   - 화면 placeholder 범위 문구
   - 입력 `min/max` 네이티브 제한
   - 에러 메시지 기준값

## 4) 원칙
- 기본값은 단일소스(`dimension-constraints.js`)를 우선합니다.
- 자재별 예외값이 있으면 자재 데이터가 우선합니다.
