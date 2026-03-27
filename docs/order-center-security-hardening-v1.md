# 주문센터 보안 운영 가이드 v1 (A안)

- 문서 버전: `v1.0`
- 작성일: `2026-03-26`
- 목적: 프런트 직접 전송 구조(EmailJS/Cloudinary)를 유지하면서, v1 핫픽스 범위에서 남용 리스크를 낮춘다.

## 1. 이번 A안에서 적용한 코드 가드

1. 허용 도메인 외 환경에서 주문 전송/이미지 업로드 차단
2. 런타임 설정(`window.__ORDER_CENTER_CONFIG`)으로 보안/연동 값을 주입할 수 있도록 정리
3. 시스템 미리보기 업로드 경로도 동일 도메인 정책 적용

기본 허용 도메인:

1. `order-center.ggr.kr`
2. `ggr.kr`
3. `localhost`
4. `127.0.0.1`
5. 접미사 허용: `.ggr.kr`

## 2. 런타임 설정 주입 방식

공통 부트스트랩 스크립트 1개를 사용한다.

```html
<script src="assets/js/runtime-config-bootstrap.js"></script>
```

운영 배포에서 환경값을 덮어써야 하면, 아래 스니펫을 `runtime-config-bootstrap.js`보다 먼저 선언한다.

```html
<script>
  window.__ORDER_CENTER_CONFIG = {
    security: {
      enforceAllowedHosts: true,
      allowedHosts: ["order-center.ggr.kr", "ggr.kr", "localhost", "127.0.0.1"],
      allowedHostSuffixes: [".ggr.kr"]
    },
    emailjs: {
      serviceId: "service_xxx",
      templateId: "template_xxx",
      publicKey: "public_xxx"
    },
    cloudinary: {
      enabled: true,
      cloudName: "cloud_xxx",
      uploadPreset: "preset_xxx",
      folder: "ggr-order-center/system-preview"
    }
  };
</script>
<script src="assets/js/runtime-config-bootstrap.js"></script>
```

운영 원칙:

1. 운영 배포에서는 `enforceAllowedHosts: true` 유지
2. 값 로테이션 시 런타임 설정만 교체하고, 코드의 하드코딩 값은 예비값으로만 취급

## 3. EmailJS 운영 제한 체크리스트

1. 허용 도메인(Allowed Domains)에 `order-center.ggr.kr` 및 필요한 `*.ggr.kr`만 등록
2. 템플릿/서비스를 주문센터 전용으로 분리
3. 월간 사용량 임계치 알림 설정
4. 키 유출/오남용 의심 시 `publicKey` 즉시 재발급 및 교체

## 4. Cloudinary 운영 제한 체크리스트

1. 업로드 프리셋을 주문센터 전용으로 분리
2. 허용 포맷 제한(`jpg,jpeg,png,webp`)
3. 최대 파일 크기 제한(권장: `10MB` 이하)
4. 업로드 폴더 강제(`ggr-order-center/*`)
5. 비정상 트래픽 모니터링 알림 설정
6. 오남용 발생 시 프리셋 즉시 비활성화

## 5. 장애/오남용 대응 순서

1. Cloudinary 프리셋 비활성화 또는 이름 교체
2. EmailJS `publicKey` 재발급
3. 런타임 설정 교체 배포
4. 허용 도메인 목록 재검토 후 최소 권한으로 재적용
