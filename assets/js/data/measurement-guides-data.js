export const DOOR_MEASUREMENT_GUIDES = Object.freeze({
  "door-size": {
    title: "도어 사이즈 측정법",
    intro: "도어는 실제 설치될 문짝 외곽 기준으로 mm 단위 실측이 필요합니다.",
    images: [
      {
        src: "assets/img/page/door/measure/door-measure-01.jpg",
        alt: "도어 사이즈 측정법 1단계",
      },
      {
        src: "assets/img/page/door/measure/door-measure-02.jpg",
        alt: "도어 사이즈 측정법 2단계",
      },
      {
        src: "assets/img/page/door/measure/door-measure-03.jpg",
        alt: "도어 사이즈 측정법 3단계",
      },
    ],
    sections: [
      {
        title: "1. 폭(W)과 길이(H) 측정",
        items: [
          "도어 정면 기준으로 좌우 폭과 길이를 직선으로 측정해주세요.",
        ],
      },
      {
        title: "2. 도어 두께 확인",
        items: [
          "도어 두께는 선택한 도어 자재 두께(예: 18T)와 동일해야 합니다.",
        ],
      },
      {
        title: "3. 두께/측면두께 확인",
        items: [
          "측면 두께는 경첩이 고정될 가구 측판 두께를 기준으로 선택하세요.",
        ],
      },
    ],
  },
  "door-hinge": {
    title: "경첩 위치 측정법",
    intro: "경첩 위치는 문이 열리는 방향보다 경첩 고정 방향 기준으로 잡는 것이 중요합니다.",
    images: [
      {
        src: "assets/img/page/door/measure/hinge-measure-01.jpg",
        alt: "경첩 위치 측정법 1단계",
      },
      {
        src: "assets/img/page/door/measure/hinge-measure-02.jpg",
        alt: "경첩 위치 측정법 2단계",
      },
    ],
    sections: [
      {
        title: "1. 경첩 방향 먼저 선택",
        items: [
          "좌측/우측 중 경첩이 고정될 측면을 먼저 정하세요.",
          "방향이 바뀌면 모든 위치 기준점이 함께 바뀝니다.",
        ],
      },
      {
        title: "2. 선반 위치 확인",
        items: [
          "선반/서랍 간섭이 없는지 도어 개폐 방향에서 확인하세요.",
          "자동 계산값을 기본으로 두고 기존 타공이 있으면 그 위치에 맞춰 조정하세요.",
        ],
      },
    ],
  },
});

export const TOP_MEASUREMENT_GUIDES = Object.freeze({
  "top-size": {
    title: "상판 사이즈 측정법",
    intro: "상판은 싱크대 상부 실제 설치 구간을 기준으로 mm 단위 실측이 필요합니다.",
    images: [
      {
        src: "assets/img/page/top/measure/top-measure-01.jpg",
        alt: "상판 사이즈 측정법 1단계",
      },
      {
        src: "assets/img/page/top/measure/top-measure-02.jpg",
        alt: "상판 사이즈 측정법 2단계",
      },
      {
        src: "assets/img/page/top/measure/top-measure-03.jpg",
        alt: "상판 사이즈 측정법 3단계",
      },
    ],
    sections: [
      {
        title: "1. 타입과 사이즈 측정",
        items: [
          "상판 형태(I/ㄱ/역ㄱ/ㄷ자)를 먼저 선택해주세요.",
          "형태에 맞춰 깊이와 길이를 빠짐없이 측정해주세요.",
        ],
      },
      {
        title: "2. 두께 측정",
        items: [
          "상판의 두께를 측정해주세요.",
        ],
      },
      {
        title: "3. 뒷턱/뒷선반 측정",
        items: [
          "뒷턱/뒷선반이 있으면 설치 구간과 높이를 측정 상담 시 전달해주세요.",
        ],
      },
    ],
  },
});

export const SYSTEM_MEASUREMENT_GUIDES = Object.freeze({
  "system-layout": {
    title: "레이아웃/설치공간 측정법",
    intro: "레이아웃은 벽체 기준 설치 가능한 실제 길이를 기준으로 입력해주세요.",
    images: [
      {
        src: "assets/img/page/system/measure/width-masure-01.jpg",
        alt: "레이아웃/설치공간 측정법 1단계",
      },
      {
        src: "assets/img/page/system/measure/width-masure-02.jpg",
        alt: "레이아웃/설치공간 측정법 2단계",
      },
    ],
    sections: [
      {
        title: "1. 레이아웃 타입 선택",
        items: [
          "설치 공간의 넓이를 벽체 기준 직선 거리로 실측해주세요.",
          "천장과 바닥에 장식 몰딩/문선/배관 등 장애물이 있으면 제외해주세요.",
        ],
      },
      {
        title: "2. 설치공간 길이 측정",
        items: [
          "레이아웃 타입에 맞춰 각각의 설치공간을 모두 측정해주세요.",
          "연결되지 않은 분리 구간은 ㅣ자 개별 구성으로 나누어 측정해주세요.",
        ],
      },
      {
        title: "3. 구간별 오차 확인",
        items: [
          "좌/중/우 또는 상/중/하처럼 여러 지점을 측정해 편차를 확인하세요.",
          "편차가 있으면 시공 간섭이 없는 기준값으로 입력하는 것을 권장합니다.",
        ],
      },
    ],
  },
  "system-ceiling": {
    title: "천장 높이 측정법",
    intro: "천장 높이는 포스트바 제작 기준이므로 최소/최대 높이를 함께 확인해야 합니다.",
    images: [
      {
        src: "assets/img/page/system/measure/height-masure-03.jpg",
        alt: "천장 높이 측정법 1단계",
      },
    ],
    sections: [
      {
        title: "1. 천장 높이 측정",
        items: [
          "설치 예정 구간에서 가장 낮은 곳과 가장 높은 곳을 바닥부터 수직으로 측정하세요.",
          "보, 커튼박스 등에 설치를 원하시면 개별높이 항목을 추가해 각각 입력하세요.",
        ],
      },
      {
        title: "2. 가장 높은 높이",
        items: [
          "동일 구간 내 가장 높은 지점을 측정해 최대값으로 입력하세요.",
          "최소/최대 높이 차이가 크면 설치 조건이 달라질 수 있습니다.",
        ],
      },
      {
        title: "3. 개별높이 추가",
        items: [
          "구간마다 높이가 다르면 개별높이 항목을 추가해 각각 입력하세요.",
          "추가된 개별높이 수량은 포스트바 구성과 견적에 함께 반영됩니다.",
        ],
      },
    ],
  },
});
