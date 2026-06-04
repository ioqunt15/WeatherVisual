export interface TyphoonPoint {
  timeLabel: string;
  lon: number;
  lat: number;
  pressure: number;
  wind: number; // m/s
  speedMovement: number; // km/h
  dirMovement: {
    ko: string;
    vi: string;
    en: string;
  };
  windRadius: number; // km
}

export interface HistoricalTyphoon {
  id: string;
  name: {
    ko: string;
    vi: string;
    en: string;
  };
  year: number;
  category: {
    ko: string;
    vi: string;
    en: string;
  };
  details: {
    ko: string;
    vi: string;
    en: string;
  };
  points: TyphoonPoint[];
}

export const historicalTyphoons: HistoricalTyphoon[] = [
  {
    id: 'yagi_2024',
    name: {
      ko: '태풍 야기 (YAGI)',
      vi: 'Bão số 3 (YAGI)',
      en: 'Typhoon YAGI'
    },
    year: 2024,
    category: {
      ko: '5등급 (초강력)',
      vi: 'Siêu bão (Cấp 5)',
      en: 'Super Typhoon (Cat 5)'
    },
    details: {
      ko: '2024년 9월 베트남 북부(하이퐁, 꽝닌)를 강타한 역대 최강급 태풍. 홍강 범람과 대규모 산사태를 유발함.',
      vi: 'Siêu bão lịch sử đổ bộ vào Hải Phòng - Quảng Ninh tháng 9/2024, gây ngập lụt diện rộng tại Hà Nội và sạt lở nghiêm trọng.',
      en: 'Historic Category 5 super typhoon that struck Northern Vietnam (Quang Ninh/Haiphong) in Sept 2024, causing catastrophic river floods.'
    },
    points: [
      {
        timeLabel: '2024.09.05 06:00',
        lon: 116.8,
        lat: 19.2,
        pressure: 935,
        wind: 52,
        speedMovement: 15,
        dirMovement: { ko: '서북서', vi: 'Tây Tây Bắc', en: 'WNW' },
        windRadius: 320
      },
      {
        timeLabel: '2024.09.05 18:00',
        lon: 115.3,
        lat: 19.5,
        pressure: 925,
        wind: 55,
        speedMovement: 15,
        dirMovement: { ko: '서북서', vi: 'Tây Tây Bắc', en: 'WNW' },
        windRadius: 340
      },
      {
        timeLabel: '2024.09.06 06:00',
        lon: 113.8,
        lat: 19.7,
        pressure: 915,
        wind: 58,
        speedMovement: 15,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 360
      },
      {
        timeLabel: '2024.09.06 18:00',
        lon: 112.0,
        lat: 20.0,
        pressure: 915,
        wind: 58,
        speedMovement: 18,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 360
      },
      {
        timeLabel: '2024.09.07 00:00',
        lon: 110.4,
        lat: 20.2,
        pressure: 920,
        wind: 55,
        speedMovement: 18,
        dirMovement: { ko: '서북서', vi: 'Tây Tây Bắc', en: 'WNW' },
        windRadius: 330
      },
      {
        timeLabel: '2024.09.07 06:00',
        lon: 108.6,
        lat: 20.5,
        pressure: 930,
        wind: 50,
        speedMovement: 18,
        dirMovement: { ko: '서북서', vi: 'Tây Tây Bắc', en: 'WNW' },
        windRadius: 300
      },
      {
        timeLabel: '2024.09.07 12:00',
        lon: 107.2,
        lat: 20.8,
        pressure: 940,
        wind: 45,
        speedMovement: 20,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 260
      },
      {
        timeLabel: '2024.09.07 18:00',
        lon: 105.8,
        lat: 21.0,
        pressure: 975,
        wind: 30,
        speedMovement: 20,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 180
      },
      {
        timeLabel: '2024.09.08 00:00',
        lon: 104.2,
        lat: 21.3,
        pressure: 990,
        wind: 20,
        speedMovement: 18,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 100
      },
      {
        timeLabel: '2024.09.08 06:00',
        lon: 102.5,
        lat: 21.5,
        pressure: 1000,
        wind: 12,
        speedMovement: 15,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 50
      }
    ]
  },
  {
    id: 'trami_2024',
    name: {
      ko: '태풍 짜미 (TRAMI)',
      vi: 'Bão số 6 (TRAMI)',
      en: 'Typhoon TRAMI'
    },
    year: 2024,
    category: {
      ko: '1등급 (일반)',
      vi: 'Bão Cấp 10-11',
      en: 'Category 1 Typhoon'
    },
    details: {
      ko: '2024년 10월 베트남 중부 다낭/훼 지역에 상륙하여 육상 루핑 후 다시 해상으로 나가는 독특한 경로로 기록적인 폭우를 유발함.',
      vi: 'Cơn bão đổ bộ vào Thừa Thiên Huế - Đà Nẵng tháng 10/2024, di chuyển dị thường (vòng ngược ra biển) gây mưa lũ đặc biệt nghiêm trọng.',
      en: 'Struck Thừa Thiên Huế - Đà Nẵng in Oct 2024. Made a rare loop back to sea, dumping catastrophic rainfall in Central Vietnam.'
    },
    points: [
      {
        timeLabel: '2024.10.25 06:00',
        lon: 115.5,
        lat: 17.5,
        pressure: 985,
        wind: 28,
        speedMovement: 15,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 250
      },
      {
        timeLabel: '2024.10.25 18:00',
        lon: 113.8,
        lat: 17.3,
        pressure: 980,
        wind: 30,
        speedMovement: 15,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 260
      },
      {
        timeLabel: '2024.10.26 06:00',
        lon: 112.0,
        lat: 17.0,
        pressure: 975,
        wind: 33,
        speedMovement: 15,
        dirMovement: { ko: '서남서', vi: 'Tây Nam', en: 'WSW' },
        windRadius: 280
      },
      {
        timeLabel: '2024.10.26 18:00',
        lon: 110.2,
        lat: 16.6,
        pressure: 975,
        wind: 33,
        speedMovement: 12,
        dirMovement: { ko: '서남서', vi: 'Tây Nam', en: 'WSW' },
        windRadius: 280
      },
      {
        timeLabel: '2024.10.27 00:00',
        lon: 109.1,
        lat: 16.4,
        pressure: 980,
        wind: 30,
        speedMovement: 12,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 240
      },
      {
        timeLabel: '2024.10.27 06:00',
        lon: 108.2,
        lat: 16.2,
        pressure: 985,
        wind: 28,
        speedMovement: 10,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 200
      },
      {
        timeLabel: '2024.10.27 12:00',
        lon: 107.9,
        lat: 16.0,
        pressure: 990,
        wind: 23,
        speedMovement: 6,
        dirMovement: { ko: '남남서', vi: 'Nam Nam Tây', en: 'SSW' },
        windRadius: 150
      },
      {
        timeLabel: '2024.10.27 18:00',
        lon: 108.3,
        lat: 15.8,
        pressure: 992,
        wind: 20,
        speedMovement: 5,
        dirMovement: { ko: '동', vi: 'Đông', en: 'E' },
        windRadius: 110
      },
      {
        timeLabel: '2024.10.28 06:00',
        lon: 109.2,
        lat: 16.0,
        pressure: 996,
        wind: 18,
        speedMovement: 10,
        dirMovement: { ko: '동', vi: 'Đông', en: 'E' },
        windRadius: 80
      }
    ]
  },
  {
    id: 'noru_2022',
    name: {
      ko: '태풍 노루 (NORU)',
      vi: 'Bão số 4 (NORU)',
      en: 'Typhoon NORU'
    },
    year: 2022,
    category: {
      ko: '4등급 (매우 강)',
      vi: 'Bão rất mạnh (Cấp 14)',
      en: 'Category 4 Typhoon'
    },
    details: {
      ko: '2022년 9월 매우 빠른 속도로 남중국해를 횡단하여 다낭-꽝남 부근에 상륙함. 강한 풍속과 산간 지역 침수가 특징임.',
      vi: 'Siêu bão di chuyển cực nhanh qua Biển Đông đổ bộ vào Quảng Nam - Đà Nẵng tháng 9/2022 gây gió giật mạnh và ngập lụt cục bộ.',
      en: 'Fast-moving Category 4 typhoon that swept through South China Sea and made landfall near Da Nang/Quang Nam in Sept 2022.'
    },
    points: [
      {
        timeLabel: '2022.09.26 06:00',
        lon: 115.8,
        lat: 15.6,
        pressure: 955,
        wind: 43,
        speedMovement: 22,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 280
      },
      {
        timeLabel: '2022.09.26 18:00',
        lon: 113.8,
        lat: 15.6,
        pressure: 945,
        wind: 46,
        speedMovement: 24,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 300
      },
      {
        timeLabel: '2022.09.27 06:00',
        lon: 111.4,
        lat: 15.7,
        pressure: 935,
        wind: 50,
        speedMovement: 24,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 310
      },
      {
        timeLabel: '2022.09.27 18:00',
        lon: 109.4,
        lat: 15.8,
        pressure: 940,
        wind: 48,
        speedMovement: 20,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 280
      },
      {
        timeLabel: '2022.09.28 00:00',
        lon: 108.2,
        lat: 15.9,
        pressure: 955,
        wind: 40,
        speedMovement: 20,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 240
      },
      {
        timeLabel: '2022.09.28 06:00',
        lon: 106.8,
        lat: 16.0,
        pressure: 985,
        wind: 25,
        speedMovement: 18,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 150
      },
      {
        timeLabel: '2022.09.28 12:00',
        lon: 105.0,
        lat: 16.1,
        pressure: 998,
        wind: 15,
        speedMovement: 18,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 80
      }
    ]
  },
  {
    id: 'molave_2020',
    name: {
      ko: '태풍 모라베 (MOLAVE)',
      vi: 'Bão số 9 (MOLAVE)',
      en: 'Typhoon MOLAVE'
    },
    year: 2020,
    category: {
      ko: '3등급 (강)',
      vi: 'Bão rất mạnh (Cấp 13)',
      en: 'Category 3 Typhoon'
    },
    details: {
      ko: '2020년 10월 꽝응아이 성 부근에 상륙하여 대규모 산사태와 해수 범람을 일으켜 대규모 인명/재산 피해를 냄.',
      vi: 'Cơn bão đổ bộ Quảng Ngãi tháng 10/2020, gây sạt lở đất nghiêm trọng tại Quảng Nam và nước dâng do bão cực kỳ nguy hiểm.',
      en: 'Devastating Category 3 typhoon that hit Central Vietnam (Quang Ngai/Quang Nam) in Oct 2020, triggering fatal mudslides.'
    },
    points: [
      {
        timeLabel: '2020.10.26 06:00',
        lon: 115.8,
        lat: 13.5,
        pressure: 960,
        wind: 40,
        speedMovement: 25,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 260
      },
      {
        timeLabel: '2020.10.26 18:00',
        lon: 113.5,
        lat: 14.0,
        pressure: 950,
        wind: 45,
        speedMovement: 25,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 280
      },
      {
        timeLabel: '2020.10.27 06:00',
        lon: 111.0,
        lat: 14.5,
        pressure: 945,
        wind: 47,
        speedMovement: 22,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 290
      },
      {
        timeLabel: '2020.10.27 18:00',
        lon: 109.2,
        lat: 14.8,
        pressure: 950,
        wind: 45,
        speedMovement: 22,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 270
      },
      {
        timeLabel: '2020.10.28 00:00',
        lon: 108.6,
        lat: 15.0,
        pressure: 960,
        wind: 40,
        speedMovement: 20,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 220
      },
      {
        timeLabel: '2020.10.28 06:00',
        lon: 107.0,
        lat: 15.2,
        pressure: 988,
        wind: 23,
        speedMovement: 20,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 130
      },
      {
        timeLabel: '2020.10.28 12:00',
        lon: 105.2,
        lat: 15.4,
        pressure: 1002,
        wind: 13,
        speedMovement: 15,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 60
      }
    ]
  }
];
