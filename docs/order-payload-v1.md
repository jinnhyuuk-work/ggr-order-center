# Order Payload v1

> Deprecated: 2026-03-16부터 신규 payload는 `v2`를 사용합니다. 최신 규격은 `docs/order-payload-v3.md`를 참고하세요.

## 1. 목적
- 주문 전송 데이터의 키/타입/빈값 표현을 고정해 페이지별 구현 차이로 인한 운영 오류를 방지한다.

## 2. 고정 규칙
1. `schemaVersion`은 `v1`로 고정한다.
2. `pageKey`는 항상 포함한다. 값은 `board | door | top`.
3. 배열 필드는 값이 없으면 `[]`로 보낸다.
4. 객체 필드는 값이 없으면 `{}`로 보낸다.
5. 상담품목 가격은 `pricing`에서 숫자 대신 `null`과 `displayPriceLabel`로 표현한다.
6. 추가옵션/가공서비스 `id`는 전역 유니크 접두 규칙을 사용한다.

## 3. 루트 스키마
```json
{
  "schemaVersion": "v1",
  "pageKey": "board",
  "createdAt": "2026-03-06T12:00:00.000Z",
  "customer": {
    "name": "",
    "phone": "",
    "email": "",
    "postcode": "",
    "address": "",
    "detailAddress": "",
    "memo": ""
  },
  "totals": {
    "grandTotal": 0,
    "subtotal": 0,
    "hasCustomPrice": false,
    "displayPriceLabel": null
  },
  "items": []
}
```

## 4. 아이템 스키마
```json
{
  "lineId": "uuid",
  "itemType": "product",
  "name": "예시",
  "quantity": 1,
  "materialId": "lpm_basic",
  "dimensions": {
    "thicknessMm": 18,
    "widthMm": 500,
    "lengthMm": 1200
  },
  "options": [],
  "services": [],
  "serviceDetails": {},
  "pricing": {
    "materialCost": 47000,
    "processingCost": 6500,
    "total": 53500,
    "isCustomPrice": false,
    "displayPriceLabel": null
  }
}
```

## 5. 상담품목 가격 표현
```json
{
  "pricing": {
    "materialCost": null,
    "processingCost": null,
    "total": null,
    "isCustomPrice": true,
    "displayPriceLabel": "상담안내"
  }
}
```

## 6. 버전 정책
- 필드 추가/의미 변경이 있으면 `schemaVersion`을 올린다. (`v2`, `v3` ...)
