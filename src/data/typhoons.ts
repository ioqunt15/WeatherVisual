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
  duration: {
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
    duration: {
      ko: '2024.09.05 ~ 2024.09.08',
      vi: '05/09/2024 ~ 08/09/2024',
      en: 'Sep 05, 2024 ~ Sep 08, 2024'
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
    duration: {
      ko: '2024.10.25 ~ 2024.10.28',
      vi: '25/10/2024 ~ 28/10/2024',
      en: 'Oct 25, 2024 ~ Oct 28, 2024'
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
    duration: {
      ko: '2022.09.26 ~ 2022.09.28',
      vi: '26/09/2022 ~ 28/09/2022',
      en: 'Sep 26, 2022 ~ Sep 28, 2022'
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
    duration: {
      ko: '2020.10.26 ~ 2020.10.28',
      vi: '26/10/2020 ~ 28/10/2020',
      en: 'Oct 26, 2020 ~ Oct 28, 2020'
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
  },
  {
    id: 'doksuri_2017',
    name: {
      ko: '태풍 독수리 (DOKSURI)',
      vi: 'Bão số 10 (DOKSURI)',
      en: 'Typhoon DOKSURI'
    },
    year: 2017,
    category: {
      ko: '4등급 (매우 강)',
      vi: 'Bão rất mạnh (Cấp 14)',
      en: 'Category 4 Typhoon'
    },
    duration: {
      ko: '2017.09.12 ~ 2017.09.16',
      vi: '12/09/2017 ~ 16/09/2017',
      en: 'Sep 12, 2017 ~ Sep 16, 2017'
    },
    details: {
      ko: '2017년 9월 베트남 중부 하띤, 꽝빈 성 일대를 강타한 강력한 태풍. 광범위한 침수와 정전 피해를 유발함.',
      vi: 'Cơn bão số 10 đổ bộ vào Hà Tĩnh - Quảng Bình tháng 9/2017 với sức gió hủy diệt, gây thiệt hại vô cùng lớn về tài sản.',
      en: 'Powerful Category 4 typhoon that struck Central Vietnam (Ha Tinh/Quang Binh) in Sept 2017, causing severe damage and blackouts.'
    },
    points: [
      {
        timeLabel: '2017.09.12 18:00',
        lon: 116.5,
        lat: 15.8,
        pressure: 990,
        wind: 23,
        speedMovement: 15,
        dirMovement: { ko: '서북서', vi: 'Tây Tây Bắc', en: 'WNW' },
        windRadius: 150
      },
      {
        timeLabel: '2017.09.13 06:00',
        lon: 114.5,
        lat: 16.2,
        pressure: 975,
        wind: 33,
        speedMovement: 18,
        dirMovement: { ko: '서북서', vi: 'Tây Tây Bắc', en: 'WNW' },
        windRadius: 220
      },
      {
        timeLabel: '2017.09.13 18:00',
        lon: 112.5,
        lat: 16.6,
        pressure: 965,
        wind: 38,
        speedMovement: 20,
        dirMovement: { ko: '서북서', vi: 'Tây Tây Bắc', en: 'WNW' },
        windRadius: 260
      },
      {
        timeLabel: '2017.09.14 06:00',
        lon: 110.5,
        lat: 17.0,
        pressure: 955,
        wind: 43,
        speedMovement: 20,
        dirMovement: { ko: '서북서', vi: 'Tây Tây Bắc', en: 'WNW' },
        windRadius: 290
      },
      {
        timeLabel: '2017.09.14 18:00',
        lon: 108.3,
        lat: 17.4,
        pressure: 945,
        wind: 46,
        speedMovement: 22,
        dirMovement: { ko: '서북서', vi: 'Tây Tây Bắc', en: 'WNW' },
        windRadius: 310
      },
      {
        timeLabel: '2017.09.15 06:00',
        lon: 106.3,
        lat: 17.8,
        pressure: 950,
        wind: 43,
        speedMovement: 22,
        dirMovement: { ko: '서북서', vi: 'Tây Tây Bắc', en: 'WNW' },
        windRadius: 270
      },
      {
        timeLabel: '2017.09.15 12:00',
        lon: 105.1,
        lat: 18.0,
        pressure: 965,
        wind: 33,
        speedMovement: 20,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 200
      },
      {
        timeLabel: '2017.09.15 18:00',
        lon: 103.8,
        lat: 18.2,
        pressure: 985,
        wind: 23,
        speedMovement: 20,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 120
      },
      {
        timeLabel: '2017.09.16 06:00',
        lon: 101.5,
        lat: 18.5,
        pressure: 1000,
        wind: 13,
        speedMovement: 18,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 50
      }
    ]
  },
  {
    id: 'damrey_2017',
    name: {
      ko: '태풍 담레이 (DAMREY)',
      vi: 'Bão số 12 (DAMREY)',
      en: 'Typhoon DAMREY'
    },
    year: 2017,
    category: {
      ko: '2등급 (강)',
      vi: 'Bão mạnh (Cấp 12)',
      en: 'Category 2 Typhoon'
    },
    duration: {
      ko: '2017.11.01 ~ 2017.11.05',
      vi: '01/11/2017 ~ 05/11/2017',
      en: 'Nov 01, 2017 ~ Nov 05, 2017'
    },
    details: {
      ko: '2017년 11월 베트남 남중부 냐짱과 칸화 성 일대를 강타하여 수많은 가옥이 파손되고 막대한 재산 피해를 입힘.',
      vi: 'Cơn bão đổ bộ Khánh Hòa tháng 11/2017, tàn phá nghiêm trọng thành phố Nha Trang và vùng lân cận trước thềm hội nghị APEC.',
      en: 'Struck Southern Central Vietnam (Khanh Hoa/Nha Trang) in Nov 2017, causing massive infrastructure damage right before APEC.'
    },
    points: [
      {
        timeLabel: '2017.11.01 18:00',
        lon: 118.5,
        lat: 12.0,
        pressure: 998,
        wind: 18,
        speedMovement: 15,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 100
      },
      {
        timeLabel: '2017.11.02 06:00',
        lon: 116.5,
        lat: 12.1,
        pressure: 990,
        wind: 23,
        speedMovement: 18,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 150
      },
      {
        timeLabel: '2017.11.02 18:00',
        lon: 114.5,
        lat: 12.2,
        pressure: 980,
        wind: 28,
        speedMovement: 18,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 180
      },
      {
        timeLabel: '2017.11.03 06:00',
        lon: 112.5,
        lat: 12.4,
        pressure: 970,
        wind: 33,
        speedMovement: 18,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 220
      },
      {
        timeLabel: '2017.11.03 18:00',
        lon: 110.5,
        lat: 12.6,
        pressure: 960,
        wind: 38,
        speedMovement: 20,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 250
      },
      {
        timeLabel: '2017.11.04 00:00',
        lon: 109.5,
        lat: 12.7,
        pressure: 955,
        wind: 40,
        speedMovement: 20,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 260
      },
      {
        timeLabel: '2017.11.04 06:00',
        lon: 108.4,
        lat: 12.8,
        pressure: 975,
        wind: 30,
        speedMovement: 20,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 180
      },
      {
        timeLabel: '2017.11.04 18:00',
        lon: 106.2,
        lat: 13.0,
        pressure: 990,
        wind: 20,
        speedMovement: 18,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 100
      },
      {
        timeLabel: '2017.11.05 06:00',
        lon: 104.0,
        lat: 13.2,
        pressure: 1004,
        wind: 10,
        speedMovement: 15,
        dirMovement: { ko: '서', vi: 'Tây', en: 'W' },
        windRadius: 30
      }
    ]
  },
  {
    id: 'haiyan_2013',
    name: {
      ko: '태풍 하이옌 (HAIYAN)',
      vi: 'Siêu bão Hải Yến (HAIYAN)',
      en: 'Typhoon HAIYAN'
    },
    year: 2013,
    category: {
      ko: '5등급 (초강력)',
      vi: 'Siêu bão lịch sử (Cấp 5)',
      en: 'Super Typhoon (Cat 5)'
    },
    duration: {
      ko: '2013.11.08 ~ 2013.11.11',
      vi: '08/11/2013 ~ 11/11/2013',
      en: 'Nov 08, 2013 ~ Nov 11, 2013'
    },
    details: {
      ko: '필리핀을 강타한 후 남중국해를 거쳐 베트남 해안을 따라 북상해 꽝닌 성 부근에 상륙한 역사적 초강력 태풍.',
      vi: 'Siêu bão thế kỷ càn quét Philippines trước khi đi dọc bờ biển miền Trung và đổ bộ Quảng Ninh tháng 11/2013.',
      en: 'One of the strongest tropical cyclones ever recorded. Swept across the South China Sea and made landfall in Northern Vietnam.'
    },
    points: [
      {
        timeLabel: '2013.11.08 18:00',
        lon: 119.5,
        lat: 11.5,
        pressure: 895,
        wind: 75,
        speedMovement: 35,
        dirMovement: { ko: '서북서', vi: 'Tây Tây Bắc', en: 'WNW' },
        windRadius: 400
      },
      {
        timeLabel: '2013.11.09 06:00',
        lon: 115.8,
        lat: 12.8,
        pressure: 910,
        wind: 65,
        speedMovement: 32,
        dirMovement: { ko: '서북서', vi: 'Tây Tây Bắc', en: 'WNW' },
        windRadius: 380
      },
      {
        timeLabel: '2013.11.09 18:00',
        lon: 112.5,
        lat: 14.5,
        pressure: 925,
        wind: 55,
        speedMovement: 30,
        dirMovement: { ko: '서북서', vi: 'Tây Tây Bắc', en: 'WNW' },
        windRadius: 350
      },
      {
        timeLabel: '2013.11.10 06:00',
        lon: 109.8,
        lat: 16.5,
        pressure: 940,
        wind: 48,
        speedMovement: 28,
        dirMovement: { ko: '북서', vi: 'Tây Bắc', en: 'NW' },
        windRadius: 300
      },
      {
        timeLabel: '2013.11.10 18:00',
        lon: 108.0,
        lat: 19.0,
        pressure: 955,
        wind: 40,
        speedMovement: 25,
        dirMovement: { ko: '북북서', vi: 'Bắc Tây Bắc', en: 'NNW' },
        windRadius: 240
      },
      {
        timeLabel: '2013.11.11 06:00',
        lon: 107.0,
        lat: 21.0,
        pressure: 975,
        wind: 30,
        speedMovement: 22,
        dirMovement: { ko: '북북동', vi: 'Bắc Đông Bắc', en: 'NNE' },
        windRadius: 150
      },
      {
        timeLabel: '2013.11.11 12:00',
        lon: 107.8,
        lat: 22.2,
        pressure: 990,
        wind: 20,
        speedMovement: 20,
        dirMovement: { ko: '북동', vi: 'Đông Bắc', en: 'NE' },
        windRadius: 80
      }
    ]
  }
];
