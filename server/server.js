// server/server.ts
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// src/data/scenarios.ts
function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return [value >> 16 & 255, value >> 8 & 255, value & 255];
}
function rgbToHex([red, green, blue]) {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}
function getInterpolatedColor(value, anchors) {
  const sorted = [...anchors].sort((a, b) => a[0] - b[0]);
  if (value <= sorted[0][0]) {
    return sorted[0][1];
  }
  for (let index = 1; index < sorted.length; index += 1) {
    const [stopValue, stopColor] = sorted[index];
    const [previousValue, previousColor] = sorted[index - 1];
    if (value <= stopValue) {
      const range = stopValue - previousValue;
      const amount = range <= 0 ? 0 : (value - previousValue) / range;
      const from = hexToRgb(previousColor);
      const to = hexToRgb(stopColor);
      return rgbToHex([
        Math.round(from[0] + (to[0] - from[0]) * amount),
        Math.round(from[1] + (to[1] - from[1]) * amount),
        Math.round(from[2] + (to[2] - from[2]) * amount)
      ]);
    }
  }
  return sorted[sorted.length - 1][1];
}
function createPaletteSteps(anchors, count = 40) {
  const sorted = [...anchors].sort((a, b) => a[0] - b[0]);
  const minValue = sorted[0][0];
  const maxValue = sorted[sorted.length - 1][0];
  const range = maxValue - minValue;
  return Array.from({ length: count }, (_, index) => {
    const value = index === count - 1 ? maxValue : minValue + range * index / (count - 1);
    const roundedValue = Math.round(value * 10) / 10;
    return [roundedValue, getInterpolatedColor(value, sorted)];
  });
}
var standardStations = [
  { id: "hanoi", name: "\uD558\uB178\uC774", names: { vi: "H\xE0 N\u1ED9i", en: "Hanoi", ko: "\uD558\uB178\uC774" }, lat: 21.0285, lon: 105.8542 },
  { id: "haiphong", name: "\uD558\uC774\uD401", names: { vi: "H\u1EA3i Ph\xF2ng", en: "Haiphong", ko: "\uD558\uC774\uD401" }, lat: 20.8449, lon: 106.6881 },
  { id: "quangninh", name: "\uAD11\uB2CC", names: { vi: "Qu\u1EA3ng Ninh", en: "Quangninh", ko: "\uAD11\uB2CC" }, lat: 20.9599, lon: 107.0425 },
  { id: "langson", name: "\uB791\uC120", names: { vi: "L\u1EA1ng S\u01A1n", en: "Langson", ko: "\uB791\uC120" }, lat: 21.8548, lon: 106.762 },
  { id: "laocai", name: "\uB77C\uC624\uCE74\uC774", names: { vi: "L\xE0o Cai", en: "Laocai", ko: "\uB77C\uC624\uCE74\uC774" }, lat: 22.4856, lon: 103.9707 },
  { id: "dienbien", name: "\uB514\uC5D4\uBE44\uC5D4", names: { vi: "\u0110i\u1EC7n Bi\xEAn", en: "Dienbien", ko: "\uB514\uC5D4\uBE44\uC5D4" }, lat: 21.3912, lon: 103.0163 },
  { id: "sonla", name: "\uC120\uB77C", names: { vi: "S\u01A1n La", en: "Sonla", ko: "\uC120\uB77C" }, lat: 21.3289, lon: 103.91 },
  { id: "hoabinh", name: "\uD654\uBE48", names: { vi: "H\xF2a B\xECnh", en: "Hoabinh", ko: "\uD654\uBE48" }, lat: 20.8172, lon: 105.3376 },
  { id: "thainguyen", name: "\uD0C0\uC774\uC751\uC6B0\uC60C", names: { vi: "Th\xE1i Nguy\xEAn", en: "Thainguyen", ko: "\uD0C0\uC774\uC751\uC6B0\uC60C" }, lat: 21.5939, lon: 105.8481 },
  { id: "vinhphuc", name: "\uBE48\uD479", names: { vi: "V\u0129nh Ph\xFAc", en: "Vinhphuc", ko: "\uBE48\uD479" }, lat: 21.3089, lon: 105.6046 },
  { id: "hanam", name: "\uD558\uB0A8", names: { vi: "H\xE0 Nam", en: "Hanam", ko: "\uD558\uB0A8" }, lat: 20.5403, lon: 105.9189 },
  { id: "namdinh", name: "\uB0A8\uB518", names: { vi: "Nam \u0110\u1ECBnh", en: "Namdinh", ko: "\uB0A8\uB518" }, lat: 20.4354, lon: 106.1782 },
  { id: "ninhbinh", name: "\uB2CC\uBE48", names: { vi: "Ninh B\xECnh", en: "Ninhbinh", ko: "\uB2CC\uBE48" }, lat: 20.2506, lon: 105.9749 },
  { id: "thanhhoa", name: "\uD0C4\uD638\uC544", names: { vi: "Thanh H\xF3a", en: "Thanhhoa", ko: "\uD0C4\uD638\uC544" }, lat: 19.8067, lon: 105.776 },
  { id: "nghean", name: "\uC751\uC5D0\uC548", names: { vi: "Ngh\u1EC7 An", en: "Nghean", ko: "\uC751\uC5D0\uC548" }, lat: 18.6732, lon: 105.6922 },
  { id: "hue", name: "\uD6C4\uC5D0", names: { vi: "Hu\u1EBF", en: "Hue", ko: "\uD6C4\uC5D0" }, lat: 16.4637, lon: 107.5909 },
  { id: "danang", name: "\uB2E4\uB0AD", names: { vi: "\u0110\xE0 N\u1EB5ng", en: "Da Nang", ko: "\uB2E4\uB0AD" }, lat: 16.0471, lon: 108.2062 },
  { id: "quangnam", name: "\uAD11\uB0A8", names: { vi: "Qu\u1EA3ng Nam", en: "Quangnam", ko: "\uAD11\uB0A8" }, lat: 15.8797, lon: 108.3325 },
  { id: "quynhon", name: "\uD034\uB17C", names: { vi: "Quy Nh\u01A1n", en: "Quynhon", ko: "\uD034\uB17C" }, lat: 13.783, lon: 109.2194 },
  { id: "nhatrang", name: "\uB0D0\uC9F1", names: { vi: "Nha Trang", en: "Nhatrang", ko: "\uB0D0\uC9F1" }, lat: 12.2451, lon: 109.1943 },
  { id: "dalat", name: "\uB2EC\uB78F", names: { vi: "\u0110\xE0 L\u1EA1t", en: "Dalat", ko: "\uB2EC\uB78F" }, lat: 11.9404, lon: 108.4583 },
  { id: "phanthiet", name: "\uD310\uD2F0\uC5E3", names: { vi: "Phan Thi\u1EBFt", en: "Phanthiet", ko: "\uD310\uD2F0\uC5E3" }, lat: 10.9333, lon: 108.1 },
  { id: "hochiminh", name: "\uD638\uCE58\uBBFC", names: { vi: "TP. H\u1ED3 Ch\xED Minh", en: "Ho Chi Minh City", ko: "\uD638\uCE58\uBBFC" }, lat: 10.8231, lon: 106.6297 },
  { id: "vungtau", name: "\uBD95\uB530\uC6B0", names: { vi: "V\u0169ng T\xE0u", en: "Vungtau", ko: "\uBD95\uB530\uC6B0" }, lat: 10.346, lon: 107.0843 },
  { id: "tayninh", name: "\uD0C0\uC774\uB2CC", names: { vi: "T\xE2y Ninh", en: "Tayninh", ko: "\uD0C0\uC774\uB2CC" }, lat: 11.3115, lon: 106.0985 },
  { id: "dongnai", name: "\uB3D9\uB098\uC774", names: { vi: "\u0110\u1ED3ng Nai", en: "Dongnai", ko: "\uB3D9\uB098\uC774" }, lat: 10.9574, lon: 106.8427 },
  { id: "cantho", name: "\uAE50\uD1A0", names: { vi: "C\u1EA7n Th\u01A1", en: "Cantho", ko: "\uAE50\uD1A0" }, lat: 10.0452, lon: 105.7469 },
  { id: "phuquoc", name: "\uD478\uAFB8\uC625", names: { vi: "Ph\xFA Qu\u1ED1c", en: "Phuquoc", ko: "\uD478\uAFB8\uC625" }, lat: 10.2899, lon: 103.984 },
  { id: "camau", name: "\uAE4C\uB9C8\uC6B0", names: { vi: "C\xE0 Mau", en: "Camau", ko: "\uAE4C\uB9C8\uC6B0" }, lat: 9.1769, lon: 105.1524 },
  { id: "hoangsa", name: "Ho\xE0ng Sa", names: { vi: "Qu\u1EA7n \u0111\u1EA3o Ho\xE0ng Sa", en: "Hoang Sa Archipelago", ko: "\uD669\uC0AC \uAD70\uB3C4" }, lat: 16.5, lon: 112.5 },
  { id: "truongsa", name: "Tr\u01B0\u1EDDng Sa", names: { vi: "Qu\u1EA7n \u0111\u1EA3o Tr\u01B0\u1EDDng Sa", en: "Truong Sa Archipelago", ko: "\uCBD4\uC5C9\uC0AC \uAD70\uB3C4" }, lat: 10.4, lon: 114.3 }
];
var humidityValues = {
  hanoi: 76,
  haiphong: 78,
  quangninh: 80,
  langson: 72,
  laocai: 70,
  dienbien: 68,
  sonla: 70,
  hoabinh: 74,
  thainguyen: 75,
  vinhphuc: 76,
  hanam: 77,
  namdinh: 82,
  ninhbinh: 80,
  thanhhoa: 82,
  nghean: 80,
  hue: 84,
  danang: 80,
  quangnam: 82,
  quynhon: 78,
  nhatrang: 76,
  dalat: 88,
  phanthiet: 78,
  hochiminh: 82,
  vungtau: 80,
  tayninh: 75,
  dongnai: 78,
  cantho: 84,
  phuquoc: 82,
  camau: 85,
  hoangsa: 82,
  truongsa: 84
};
var windValues = {
  hanoi: 3.2,
  haiphong: 5.4,
  quangninh: 6.2,
  langson: 2.8,
  laocai: 2.1,
  dienbien: 1.8,
  sonla: 2.4,
  hoabinh: 2.8,
  thainguyen: 3,
  vinhphuc: 3.2,
  hanam: 3.5,
  namdinh: 4.8,
  ninhbinh: 4.2,
  thanhhoa: 4.5,
  nghean: 5,
  hue: 3.8,
  danang: 6.5,
  quangnam: 5.8,
  quynhon: 5.2,
  nhatrang: 4.8,
  dalat: 3,
  phanthiet: 6.8,
  hochiminh: 4.2,
  vungtau: 7.2,
  tayninh: 3,
  dongnai: 3.5,
  cantho: 3.8,
  phuquoc: 6.5,
  camau: 5.8,
  hoangsa: 6.8,
  truongsa: 7.5
};
var gustValues = {
  hanoi: 5.8,
  haiphong: 9.2,
  quangninh: 10.5,
  langson: 4.8,
  laocai: 3.5,
  dienbien: 3,
  sonla: 4.2,
  hoabinh: 4.8,
  thainguyen: 5.2,
  vinhphuc: 5.5,
  hanam: 6,
  namdinh: 8.2,
  ninhbinh: 7.5,
  thanhhoa: 8,
  nghean: 9,
  hue: 6.8,
  danang: 11.2,
  quangnam: 10,
  quynhon: 9.2,
  nhatrang: 8.5,
  dalat: 5,
  phanthiet: 11.5,
  hochiminh: 7.5,
  vungtau: 12.8,
  tayninh: 5.2,
  dongnai: 6,
  cantho: 6.5,
  phuquoc: 10.5,
  camau: 9.8,
  hoangsa: 11.5,
  truongsa: 13
};
var pressureValues = {
  hanoi: 1009.5,
  haiphong: 1009.2,
  quangninh: 1009,
  langson: 1008.4,
  laocai: 1007.2,
  dienbien: 1007.8,
  sonla: 1007.5,
  hoabinh: 1008.6,
  thainguyen: 1009.2,
  vinhphuc: 1009.4,
  hanam: 1009.8,
  namdinh: 1009.7,
  ninhbinh: 1009.6,
  thanhhoa: 1009.2,
  nghean: 1008.8,
  hue: 1008.2,
  danang: 1008,
  quangnam: 1008.1,
  quynhon: 1007.8,
  nhatrang: 1007.9,
  dalat: 1002.4,
  phanthiet: 1007.8,
  hochiminh: 1008.2,
  vungtau: 1008,
  tayninh: 1008.1,
  dongnai: 1008.3,
  cantho: 1008.4,
  phuquoc: 1008.2,
  camau: 1008.5,
  hoangsa: 1007.5,
  truongsa: 1007.2
};
var rainValues = {
  hanoi: 1.2,
  haiphong: 2.5,
  quangninh: 3.8,
  langson: 0.8,
  laocai: 1,
  dienbien: 0.6,
  sonla: 0.8,
  hoabinh: 1.4,
  thainguyen: 1.2,
  vinhphuc: 1,
  hanam: 1.5,
  namdinh: 1.8,
  ninhbinh: 1.6,
  thanhhoa: 2.2,
  nghean: 2.5,
  hue: 3.5,
  danang: 2.8,
  quangnam: 3,
  quynhon: 1.5,
  nhatrang: 1.2,
  dalat: 0.8,
  phanthiet: 1,
  hochiminh: 4.5,
  vungtau: 3.5,
  tayninh: 4,
  dongnai: 4.2,
  cantho: 5,
  phuquoc: 6,
  camau: 5.5,
  hoangsa: 2.5,
  truongsa: 3.5
};
var solarValues = {
  hanoi: 450,
  haiphong: 480,
  quangninh: 500,
  langson: 380,
  laocai: 320,
  dienbien: 400,
  sonla: 390,
  hoabinh: 420,
  thainguyen: 440,
  vinhphuc: 450,
  hanam: 470,
  namdinh: 490,
  ninhbinh: 480,
  thanhhoa: 520,
  nghean: 580,
  hue: 600,
  danang: 650,
  quangnam: 640,
  quynhon: 630,
  nhatrang: 660,
  dalat: 580,
  phanthiet: 680,
  hochiminh: 720,
  vungtau: 730,
  tayninh: 710,
  dongnai: 700,
  cantho: 680,
  phuquoc: 650,
  camau: 660,
  hoangsa: 720,
  truongsa: 750
};
var temperatureValues = {
  hanoi: 29.5,
  haiphong: 28.2,
  quangninh: 28.5,
  langson: 26.4,
  laocai: 25.2,
  dienbien: 27.8,
  sonla: 26.2,
  hoabinh: 28.8,
  thainguyen: 28.6,
  vinhphuc: 29,
  hanam: 29.8,
  namdinh: 29.2,
  ninhbinh: 29.4,
  thanhhoa: 30.2,
  nghean: 31,
  hue: 32.5,
  danang: 31.5,
  quangnam: 31.2,
  quynhon: 30.5,
  nhatrang: 29.8,
  dalat: 21.4,
  phanthiet: 30.2,
  hochiminh: 32.8,
  vungtau: 31,
  tayninh: 33.2,
  dongnai: 32.5,
  cantho: 31.8,
  phuquoc: 30.6,
  camau: 31.2,
  hoangsa: 28.5,
  truongsa: 29.2
};
var forecastTempValues = {
  hanoi: 31.5,
  haiphong: 30.2,
  quangninh: 30.5,
  langson: 28.4,
  laocai: 27.2,
  dienbien: 29.8,
  sonla: 28.2,
  hoabinh: 30.8,
  thainguyen: 30.6,
  vinhphuc: 31,
  hanam: 31.8,
  namdinh: 31.2,
  ninhbinh: 31.4,
  thanhhoa: 32.2,
  nghean: 33,
  hue: 34.5,
  danang: 33.5,
  quangnam: 33.2,
  quynhon: 32.5,
  nhatrang: 31.8,
  dalat: 23.4,
  phanthiet: 32.2,
  hochiminh: 34.8,
  vungtau: 33,
  tayninh: 35.2,
  dongnai: 34.5,
  cantho: 33.8,
  phuquoc: 32.6,
  camau: 33.2,
  hoangsa: 29.5,
  truongsa: 30.2
};
var forecastRainValues = {
  hanoi: 5,
  haiphong: 10,
  quangninh: 12,
  langson: 3,
  laocai: 5,
  dienbien: 2,
  sonla: 4,
  hoabinh: 8,
  thainguyen: 6,
  vinhphuc: 5,
  hanam: 10,
  namdinh: 12,
  ninhbinh: 10,
  thanhhoa: 15,
  nghean: 18,
  hue: 25,
  danang: 20,
  quangnam: 22,
  quynhon: 10,
  nhatrang: 8,
  dalat: 4,
  phanthiet: 6,
  hochiminh: 30,
  vungtau: 22,
  tayninh: 25,
  dongnai: 28,
  cantho: 35,
  phuquoc: 45,
  camau: 40,
  hoangsa: 15,
  truongsa: 22
};
var forecastWindValues = { ...windValues };
var forecastHumidityValues = { ...humidityValues };
var cloudValues = {
  hanoi: 65,
  haiphong: 70,
  quangninh: 75,
  langson: 58,
  laocai: 50,
  dienbien: 45,
  sonla: 48,
  hoabinh: 55,
  thainguyen: 60,
  vinhphuc: 62,
  hanam: 64,
  namdinh: 78,
  ninhbinh: 74,
  thanhhoa: 80,
  nghean: 75,
  hue: 82,
  danang: 68,
  quangnam: 72,
  quynhon: 55,
  nhatrang: 50,
  dalat: 85,
  phanthiet: 45,
  hochiminh: 80,
  vungtau: 78,
  tayninh: 65,
  dongnai: 70,
  cantho: 82,
  phuquoc: 85,
  camau: 88,
  hoangsa: 60,
  truongsa: 65
};
var heatValues = {
  hanoi: 34,
  haiphong: 32,
  quangninh: 32,
  langson: 29,
  laocai: 27,
  dienbien: 30,
  sonla: 28,
  hoabinh: 33,
  thainguyen: 32,
  vinhphuc: 33,
  hanam: 34,
  namdinh: 33,
  ninhbinh: 33,
  thanhhoa: 35,
  nghean: 37,
  hue: 39,
  danang: 38,
  quangnam: 37,
  quynhon: 36,
  nhatrang: 34,
  dalat: 22,
  phanthiet: 35,
  hochiminh: 39,
  vungtau: 36,
  tayninh: 40,
  dongnai: 39,
  cantho: 38,
  phuquoc: 36,
  camau: 37,
  hoangsa: 33,
  truongsa: 34
};
var fireValues = {
  hanoi: 25,
  haiphong: 20,
  quangninh: 18,
  langson: 35,
  laocai: 38,
  dienbien: 42,
  sonla: 40,
  hoabinh: 30,
  thainguyen: 28,
  vinhphuc: 25,
  hanam: 24,
  namdinh: 20,
  ninhbinh: 22,
  thanhhoa: 35,
  nghean: 45,
  hue: 50,
  danang: 40,
  quangnam: 42,
  quynhon: 48,
  nhatrang: 45,
  dalat: 55,
  phanthiet: 52,
  hochiminh: 30,
  vungtau: 28,
  tayninh: 35,
  dongnai: 32,
  cantho: 25,
  phuquoc: 22,
  camau: 20,
  hoangsa: 10,
  truongsa: 8
};
var uvValues = {
  hanoi: 6.5,
  haiphong: 7,
  quangninh: 7.2,
  langson: 5.8,
  laocai: 5,
  dienbien: 6.2,
  sonla: 6,
  hoabinh: 6.4,
  thainguyen: 6.5,
  vinhphuc: 6.8,
  hanam: 7,
  namdinh: 7.2,
  ninhbinh: 7,
  thanhhoa: 8,
  nghean: 8.5,
  hue: 9,
  danang: 9.5,
  quangnam: 9.2,
  quynhon: 9,
  nhatrang: 9.2,
  dalat: 7.8,
  phanthiet: 9.5,
  hochiminh: 10.2,
  vungtau: 10.5,
  tayninh: 9.8,
  dongnai: 9.5,
  cantho: 10,
  phuquoc: 9.8,
  camau: 9.5,
  hoangsa: 9.5,
  truongsa: 10
};
var aqiValues = {
  hanoi: 154,
  haiphong: 120,
  quangninh: 92,
  langson: 64,
  laocai: 48,
  dienbien: 42,
  sonla: 52,
  hoabinh: 76,
  thainguyen: 110,
  vinhphuc: 105,
  hanam: 115,
  namdinh: 88,
  ninhbinh: 84,
  thanhhoa: 95,
  nghean: 102,
  hue: 58,
  danang: 46,
  quangnam: 52,
  quynhon: 62,
  nhatrang: 55,
  dalat: 32,
  phanthiet: 60,
  hochiminh: 142,
  vungtau: 78,
  tayninh: 115,
  dongnai: 98,
  cantho: 85,
  phuquoc: 50,
  camau: 42,
  hoangsa: 28,
  truongsa: 25
};
var landslideValues = {
  hanoi: 10,
  haiphong: 8,
  quangninh: 30,
  langson: 65,
  laocai: 88,
  dienbien: 84,
  sonla: 80,
  hoabinh: 68,
  thainguyen: 45,
  vinhphuc: 25,
  hanam: 5,
  namdinh: 5,
  ninhbinh: 12,
  thanhhoa: 48,
  nghean: 55,
  hue: 60,
  danang: 40,
  quangnam: 62,
  quynhon: 35,
  nhatrang: 25,
  dalat: 65,
  phanthiet: 15,
  hochiminh: 5,
  vungtau: 10,
  tayninh: 20,
  dongnai: 25,
  cantho: 5,
  phuquoc: 15,
  camau: 5,
  hoangsa: 5,
  truongsa: 5
};
var floodValues = {
  hanoi: 62,
  haiphong: 68,
  quangninh: 52,
  langson: 20,
  laocai: 15,
  dienbien: 12,
  sonla: 10,
  hoabinh: 35,
  thainguyen: 40,
  vinhphuc: 42,
  hanam: 58,
  namdinh: 72,
  ninhbinh: 68,
  thanhhoa: 55,
  nghean: 58,
  hue: 78,
  danang: 65,
  quangnam: 60,
  quynhon: 52,
  nhatrang: 48,
  dalat: 22,
  phanthiet: 45,
  hochiminh: 82,
  vungtau: 70,
  tayninh: 35,
  dongnai: 48,
  cantho: 75,
  phuquoc: 58,
  camau: 78,
  hoangsa: 42,
  truongsa: 45
};
var droughtValues = {
  hanoi: 25,
  haiphong: 22,
  quangninh: 20,
  langson: 32,
  laocai: 35,
  dienbien: 38,
  sonla: 35,
  hoabinh: 28,
  thainguyen: 26,
  vinhphuc: 24,
  hanam: 28,
  namdinh: 20,
  ninhbinh: 22,
  thanhhoa: 38,
  nghean: 48,
  hue: 52,
  danang: 45,
  quangnam: 48,
  quynhon: 68,
  nhatrang: 65,
  dalat: 40,
  phanthiet: 82,
  hochiminh: 72,
  vungtau: 68,
  tayninh: 78,
  dongnai: 65,
  cantho: 85,
  phuquoc: 70,
  camau: 88,
  hoangsa: 50,
  truongsa: 52
};
var typhoonValues = {
  hanoi: 3.2,
  haiphong: 9.8,
  quangninh: 12.5,
  langson: 2.8,
  laocai: 1.8,
  dienbien: 1.2,
  sonla: 2,
  hoabinh: 3.2,
  thainguyen: 3,
  vinhphuc: 3.2,
  hanam: 4.2,
  namdinh: 10.5,
  ninhbinh: 8.8,
  thanhhoa: 12,
  nghean: 15.2,
  hue: 28.5,
  danang: 48.2,
  quangnam: 35.8,
  quynhon: 24.2,
  nhatrang: 15.8,
  dalat: 6.5,
  phanthiet: 14.2,
  hochiminh: 5.2,
  vungtau: 12.5,
  tayninh: 3,
  dongnai: 4.8,
  cantho: 5,
  phuquoc: 6.8,
  camau: 8.5,
  hoangsa: 65.5,
  truongsa: 18.2
};
function buildPoints(values, isWindOrTyphoon = false) {
  return standardStations.map((station) => {
    let direction = void 0;
    if (isWindOrTyphoon) {
      if (station.lat > 19) direction = 230;
      else if (station.lat > 14) direction = 250;
      else direction = 270;
    }
    return {
      ...station,
      value: values[station.id] ?? 0,
      direction
    };
  });
}
var scenarios = [
  // 1. Observations
  {
    id: "temperature",
    title: "\uAE30\uC628",
    headline: "\uC2E4\uC2DC\uAC04 \uAE30\uC628 \uBD84\uD3EC",
    subtitle: "CF-VHWIS \uACE0\uD574\uC0C1\uB3C4 \uAE30\uC0C1\uC815\uBCF4 \uC0DD\uC0B0",
    unit: "\u2103",
    metric: "\uAE30\uC628",
    updatedAt: "2026.06.04 14:00",
    source: "CF-VHWIS",
    vhwisCategory: "T1H",
    maxValue: 45,
    minValue: 10,
    gridCellSizeMeters: 5200,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [10, "#3db8ff"],
      [18, "#7be1d3"],
      [25, "#fff1a8"],
      [30, "#ff9f3d"],
      [35, "#f04b2f"],
      [45, "#8b0032"]
    ]),
    points: buildPoints(temperatureValues)
  },
  {
    id: "humidity",
    title: "\uC0C1\uB300\uC2B5\uB3C4",
    headline: "\uC2E4\uC2DC\uAC04 \uC0C1\uB300\uC2B5\uB3C4 \uBD84\uD3EC",
    subtitle: "CF-VHWIS \uACE0\uD574\uC0C1\uB3C4 \uAE30\uC0C1\uC815\uBCF4 \uC0DD\uC0B0",
    unit: "%",
    metric: "\uC0C1\uB300\uC2B5\uB3C4",
    updatedAt: "2026.06.04 14:00",
    source: "CF-VHWIS",
    vhwisCategory: "T1H",
    maxValue: 100,
    minValue: 0,
    gridCellSizeMeters: 5200,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [0, "#e8f0fe"],
      [30, "#b3d1ff"],
      [50, "#66a3ff"],
      [70, "#1a75ff"],
      [90, "#0052cc"],
      [100, "#002966"]
    ]),
    points: buildPoints(humidityValues)
  },
  {
    id: "wind",
    title: "\uD48D\uC18D/\uD48D\uD5A5",
    headline: "\uC2E4\uC2DC\uAC04 \uD48D\uC18D \uBC0F \uBC14\uB78C\uC7A5 \uBCA1\uD130",
    subtitle: "CF-VHWIS \uACE0\uD574\uC0C1\uB3C4 \uBC14\uB78C \uAD00\uCE21 \uAD00\uCE21 \uC815\uBCF4",
    unit: "m/s",
    metric: "\uD48D\uC18D",
    updatedAt: "2026.06.04 14:00",
    source: "CF-VHWIS",
    vhwisCategory: "T1H",
    maxValue: 25,
    minValue: 0,
    gridCellSizeMeters: 5400,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [0, "#e8fdf5"],
      [3, "#a3f3d2"],
      [6, "#4ce4a6"],
      [12, "#f6c927"],
      [18, "#f68027"],
      [25, "#c81e3d"]
    ]),
    points: buildPoints(windValues, true)
  },
  {
    id: "gust",
    title: "\uB3CC\uD48D",
    headline: "\uC2E4\uC2DC\uAC04 \uB3CC\uD48D(Wind Gust) \uBD84\uD3EC",
    subtitle: "\uC21C\uAC04 \uCD5C\uB300 \uD48D\uC18D \uBC0F \uAE09\uACA9\uD55C \uB3CC\uD48D \uAC10\uC2DC",
    unit: "m/s",
    metric: "\uB3CC\uD48D",
    updatedAt: "2026.06.04 14:00",
    source: "CF-VHWIS",
    maxValue: 40,
    minValue: 0,
    gridCellSizeMeters: 5400,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [0, "#e0f7fa"],
      [5, "#80deea"],
      [10, "#26c6da"],
      [20, "#ffb74d"],
      [30, "#ff7043"],
      [40, "#d84315"]
    ]),
    points: buildPoints(gustValues, true)
  },
  {
    id: "pressure",
    title: "\uAE30\uC555",
    headline: "\uC2E4\uC2DC\uAC04 \uAE30\uC555(Surface Pressure) \uBD84\uD3EC",
    subtitle: "\uBCA0\uD2B8\uB0A8 \uAE30\uC555 \uBD84\uD3EC\uB3C4 \uBC0F \uC800\uAE30\uC555 \uC2DC\uC2A4\uD15C \uBD84\uC11D",
    unit: "hPa",
    metric: "\uAE30\uC555",
    updatedAt: "2026.06.04 14:00",
    source: "CF-VHWIS",
    maxValue: 1025,
    minValue: 990,
    gridCellSizeMeters: 5600,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [990, "#5e35b1"],
      [1e3, "#3949ab"],
      [1008, "#00acc1"],
      [1013, "#43a047"],
      [1020, "#ffb300"],
      [1025, "#ffb300"]
    ]),
    points: buildPoints(pressureValues)
  },
  {
    id: "rain",
    title: "\uAC15\uC218\uD604\uD669",
    headline: "\uC2E4\uC2DC\uAC04 \uAC15\uC218 \uBD84\uD3EC\uB3C4",
    subtitle: "CF-VHWIS \uACE0\uD574\uC0C1\uB3C4 \uAC15\uC218\uB7C9 \uAD00\uCE21 \uC815\uBCF4",
    unit: "mm",
    metric: "\uAC15\uC218\uB7C9",
    updatedAt: "2026.06.04 14:00",
    source: "CF-VHWIS",
    vhwisCategory: "RN1",
    maxValue: 200,
    minValue: 0,
    gridCellSizeMeters: 5200,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [0, "#fff1a8"],
      [5, "#b8ead5"],
      [10, "#75d5f4"],
      [25, "#367dff"],
      [50, "#7133ff"],
      [100, "#bd31ff"],
      [150, "#ff3e9d"],
      [200, "#ef2f2f"]
    ]),
    points: buildPoints(rainValues)
  },
  {
    id: "solar",
    title: "\uC77C\uC0AC\uB7C9",
    headline: "\uC2E4\uC2DC\uAC04 \uD0DC\uC591 \uC77C\uC0AC\uB7C9(Solar Radiation)",
    subtitle: "\uD0DC\uC591\uAD11 \uBC1C\uC804 \uBC0F \uC9C0\uC5ED\uBCC4 \uC5D0\uB108\uC9C0 \uBAA8\uB2C8\uD130\uB9C1",
    unit: "W/m\xB2",
    metric: "\uC77C\uC0AC\uB7C9",
    updatedAt: "2026.06.04 14:00",
    source: "CF-VHWIS",
    maxValue: 1e3,
    minValue: 0,
    gridCellSizeMeters: 5300,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [0, "#263238"],
      [100, "#ffcc80"],
      [300, "#ffe082"],
      [500, "#ffd54f"],
      [800, "#ffb300"],
      [1e3, "#ff8f00"]
    ]),
    points: buildPoints(solarValues)
  },
  // 2. Forecasts
  {
    id: "forecast_temp",
    title: "\uAE30\uC628 \uC608\uBCF4",
    headline: "\uB2E8\uAE30 \uC608\uBCF4 \uAE30\uC628 \uBD84\uD3EC (24h)",
    subtitle: "\uAE30\uC0C1 AI \uC608\uCE21 \uBAA8\uB378 \uBD84\uC11D \uACB0\uACFC",
    unit: "\u2103",
    metric: "\uC608\uCE21 \uAE30\uC628",
    updatedAt: "2026.06.04 14:00 (\uC608\uBCF4)",
    source: "CF-VHWIS \uC608\uBCF4",
    maxValue: 45,
    minValue: 10,
    gridCellSizeMeters: 5200,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [10, "#3db8ff"],
      [18, "#7be1d3"],
      [25, "#fff1a8"],
      [30, "#ff9f3d"],
      [35, "#f04b2f"],
      [45, "#8b0032"]
    ]),
    points: buildPoints(forecastTempValues)
  },
  {
    id: "forecast_rain",
    title: "\uAC15\uC218 \uC608\uBCF4",
    headline: "\uC608\uCE21 \uAC15\uC218\uB7C9 \uBD84\uD3EC (24h)",
    subtitle: "\uC218\uCE58 \uC608\uBCF4 \uBAA8\uB378 \uAC15\uC218 \uC608\uCE21 \uB370\uC774\uD130",
    unit: "mm",
    metric: "\uC608\uCE21 \uAC15\uC218\uB7C9",
    updatedAt: "2026.06.04 14:00 (\uC608\uBCF4)",
    source: "CF-VHWIS \uC608\uBCF4",
    maxValue: 25,
    minValue: 0,
    gridCellSizeMeters: 5200,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [0, "#fff1a8"],
      [5, "#b8ead5"],
      [10, "#75d5f4"],
      [25, "#367dff"],
      [50, "#7133ff"],
      [100, "#bd31ff"],
      [150, "#ff3e9d"],
      [200, "#ef2f2f"]
    ]),
    points: buildPoints(forecastRainValues)
  },
  {
    id: "forecast_wind",
    title: "\uBC14\uB78C \uC608\uBCF4",
    headline: "\uC608\uCE21 \uC218\uCE58 \uBC14\uB78C\uC7A5 \uBCA1\uD130 (24h)",
    subtitle: "\uB300\uAE30 \uC21C\uD658 \uBAA8\uB378 \uAE30\uBC18 \uB2E8\uAE30 \uBC14\uB78C \uBD84\uC11D",
    unit: "m/s",
    metric: "\uC608\uCE21 \uD48D\uC18D",
    updatedAt: "2026.06.04 14:00 (\uC608\uBCF4)",
    source: "CF-VHWIS \uC608\uBCF4",
    maxValue: 25,
    minValue: 0,
    gridCellSizeMeters: 5400,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [0, "#e8fdf5"],
      [3, "#a3f3d2"],
      [6, "#4ce4a6"],
      [12, "#f6c927"],
      [18, "#f68027"],
      [25, "#c81e3d"]
    ]),
    points: buildPoints(forecastWindValues, true)
  },
  {
    id: "forecast_humidity",
    title: "\uC2B5\uB3C4 \uC608\uBCF4",
    headline: "\uC608\uCE21 \uC0C1\uB300\uC2B5\uB3C4 \uBD84\uD3EC (24h)",
    subtitle: "\uC218\uCE58 \uC608\uBCF4 \uBAA8\uB378 \uB2E8\uAE30 \uC2B5\uB3C4 \uC608\uCE21",
    unit: "%",
    metric: "\uC608\uCE21 \uC2B5\uB3C4",
    updatedAt: "2026.06.04 14:00 (\uC608\uBCF4)",
    source: "CF-VHWIS \uC608\uBCF4",
    maxValue: 100,
    minValue: 0,
    gridCellSizeMeters: 5200,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [0, "#e8f0fe"],
      [30, "#b3d1ff"],
      [50, "#66a3ff"],
      [70, "#1a75ff"],
      [90, "#0052cc"],
      [100, "#002966"]
    ]),
    points: buildPoints(forecastHumidityValues)
  },
  {
    id: "cloud",
    title: "\uAD6C\uB984\uB7C9",
    headline: "\uC608\uCE21 \uCD1D \uAD6C\uB984\uB7C9(Cloud Cover)",
    subtitle: "\uD558\uB298 \uC0C1\uD0DC \uC608\uCE21 \uBC0F \uD0DC\uC591 \uAC00\uC2DC\uC131 \uBD84\uC11D",
    unit: "%",
    metric: "\uAD6C\uB984\uB7C9",
    updatedAt: "2026.06.04 14:00 (\uC608\uBCF4)",
    source: "CF-VHWIS \uC608\uBCF4",
    maxValue: 100,
    minValue: 0,
    gridCellSizeMeters: 5300,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [0, "#bbdefb"],
      [20, "#e3f2fd"],
      [50, "#e0e0e0"],
      [80, "#9e9e9e"],
      [100, "#616161"]
    ]),
    points: buildPoints(cloudValues)
  },
  // 3. Danger Indices
  {
    id: "heat",
    title: "\uCCB4\uAC10\uC628\uB3C4",
    headline: "\uC2E4\uC2DC\uAC04 \uCCB4\uAC10 \uC628\uB3C4 \uC9C0\uC218",
    subtitle: "\uC2B5\uB3C4\uC640 \uBC14\uB78C\uC744 \uACE0\uB824\uD55C \uC5F4 \uC2A4\uD2B8\uB808\uC2A4 \uBC0F \uB178\uCD9C \uC704\uD5D8\uB3C4",
    unit: "\u2103",
    metric: "\uCCB4\uAC10\uC628\uB3C4",
    updatedAt: "2026.06.04 14:00",
    source: "CF-VHWIS \uC704\uD5D8 \uC9C0\uC218",
    maxValue: 48,
    minValue: 10,
    gridCellSizeMeters: 5400,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [10, "#fff3a6"],
      [20, "#ffc857"],
      [28, "#ff8737"],
      [35, "#ed3c3b"],
      [40, "#c81e3d"],
      [48, "#8e102f"]
    ]),
    points: buildPoints(heatValues)
  },
  {
    id: "wildfire",
    title: "\uC0B0\uBD88 \uC704\uD5D8\uB3C4",
    headline: "\uC2E4\uC2DC\uAC04 \uC0B0\uBD88 \uC704\uD5D8\uC9C0\uC218",
    subtitle: "\uC628\uB3C4, \uC2B5\uB3C4, \uD48D\uC18D \uAE30\uBC18 \uC0B0\uB9BC \uD654\uC7AC \uD655\uC0B0 \uC704\uD5D8\uB3C4 \uBD84\uC11D",
    unit: "\uC810",
    metric: "\uC0B0\uBD88\uC704\uD5D8",
    updatedAt: "2026.06.04 14:00",
    source: "CF-VHWIS \uC704\uD5D8 \uC9C0\uC218",
    maxValue: 80,
    minValue: 0,
    gridCellSizeMeters: 5600,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [0, "#fee08b"],
      [20, "#fdae61"],
      [40, "#f46d43"],
      [60, "#d73027"],
      [80, "#4d001f"]
    ]),
    points: buildPoints(fireValues)
  },
  {
    id: "uv",
    title: "UV \uC9C0\uC218",
    headline: "\uC2E4\uC2DC\uAC04 \uC790\uC678\uC120 \uC9C0\uC218",
    subtitle: "\uC77C\uC0AC \uBC0F \uD0DC\uC591 \uC790\uC678\uC120 \uB178\uCD9C \uAC15\uB3C4 \uBC0F \uC778\uCCB4 \uC704\uD574\uB3C4",
    unit: "Index",
    metric: "\uC790\uC678\uC120",
    updatedAt: "2026.06.04 14:00",
    source: "CF-VHWIS",
    maxValue: 12,
    minValue: 0,
    gridCellSizeMeters: 5300,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [0, "#fffdd0"],
      [2, "#ffe066"],
      [5, "#ff8000"],
      [7, "#ff0000"],
      [10, "#cc00cc"],
      [12, "#6600cc"]
    ]),
    points: buildPoints(uvValues)
  },
  {
    id: "aqi",
    title: "\uB300\uAE30\uC9C8 \uC9C0\uC218",
    headline: "\uC2E4\uC2DC\uAC04 \uB300\uAE30\uC9C8 \uBD84\uD3EC (AQI)",
    subtitle: "US EPA \uAE30\uC900 \uBBF8\uC138\uBA3C\uC9C0 \uC885\uD569 \uB300\uAE30\uC9C8 \uC9C0\uC218",
    unit: "\uC810",
    metric: "\uB300\uAE30\uC9C8",
    updatedAt: "2026.06.04 14:00",
    source: "CF-VHWIS",
    vhwisCategory: "T1H",
    maxValue: 300,
    minValue: 0,
    gridCellSizeMeters: 5500,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [0, "#55a630"],
      [50, "#ffd166"],
      [100, "#f77f00"],
      [150, "#d62828"],
      [200, "#7209b7"],
      [300, "#4d001f"]
    ]),
    points: buildPoints(aqiValues)
  },
  {
    id: "landslide",
    title: "\uC0B0\uC0AC\uD0DC \uC704\uD5D8",
    headline: "\uC0B0\uC0AC\uD0DC \uCDE8\uC57D \uBC0F \uBD95\uAD34 \uC704\uD5D8\uC9C0\uC218",
    subtitle: "\uAC15\uC218\uB7C9 \uBC0F \uACE0\uB3C4 \uACBD\uC0AC\uB3C4\uB97C \uBC18\uC601\uD55C \uC0B0\uC0AC\uD0DC \uC608\uCC30",
    unit: "\uC810",
    metric: "\uC0B0\uC0AC\uD0DC\uC704\uD5D8",
    updatedAt: "2026.06.04 14:00",
    source: "CF-VHWIS \uC7AC\uB09C \uC9C0\uC218",
    maxValue: 100,
    minValue: 0,
    gridCellSizeMeters: 5400,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [0, "#e2f1e7"],
      [25, "#a3dbb6"],
      [50, "#ffeb3b"],
      [75, "#ff9800"],
      [100, "#e53935"]
    ]),
    points: buildPoints(landslideValues)
  },
  {
    id: "flood",
    title: "\uB3C4\uC2EC \uCE68\uC218",
    headline: "\uB3C4\uC2EC \uCE68\uC218 \uBC0F \uAC15 \uBC94\uB78C \uC704\uD5D8\uB3C4",
    subtitle: "\uC800\uC9C0\uB300 \uBC0F \uD574\uC218\uBA74 \uB9CC\uC870 \uC5F0\uACC4 \uCE68\uC218 \uB9AC\uC2A4\uD06C \uBAA8\uB378",
    unit: "\uC810",
    metric: "\uCE68\uC218\uC704\uD5D8",
    updatedAt: "2026.06.04 14:00",
    source: "CF-VHWIS \uC7AC\uB09C \uC9C0\uC218",
    maxValue: 100,
    minValue: 0,
    gridCellSizeMeters: 5200,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [0, "#e3f2fd"],
      [25, "#90caf9"],
      [50, "#2196f3"],
      [75, "#ab47bc"],
      [100, "#e91e63"]
    ]),
    points: buildPoints(floodValues)
  },
  {
    id: "drought",
    title: "\uAC00\uBB44/\uD1A0\uC591\uC218\uBD84",
    headline: "\uAC00\uBB44 \uBC0F \uBA54\uCF69\uB378\uD0C0 \uD1A0\uC591 \uC218\uBD84 \uC9C0\uC218",
    subtitle: "\uB18D\uACBD\uC9C0 \uC218\uBD84\uB7C9 \uBD84\uC11D \uBC0F \uD574\uC218 \uC5FC\uC218 \uCE68\uC785 \uC608\uCC30 \uC9C0\uD45C",
    unit: "\uC810",
    metric: "\uAC00\uBB44\uC9C0\uC218",
    updatedAt: "2026.06.04 14:00",
    source: "CF-VHWIS \uC7AC\uB09C \uC9C0\uC218",
    maxValue: 100,
    minValue: 0,
    gridCellSizeMeters: 5500,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [0, "#e8f5e9"],
      [30, "#c8e6c9"],
      [60, "#ffcc80"],
      [80, "#ff8a65"],
      [100, "#d84315"]
    ]),
    points: buildPoints(droughtValues)
  },
  // 4. Marine & Special
  {
    id: "typhoon",
    title: "\uD0DC\uD48D \uD2B8\uB798\uD0B9",
    headline: "\uC2E4\uC2DC\uAC04 \uD0DC\uD48D \uACBD\uB85C \uCD94\uC801 \uBC0F \uD48D\uD48D\uC7A5",
    subtitle: "\uB3D9\uD574(South China Sea) \uB0B4 \uBC1C\uC0DD \uD0DC\uD48D \uC774\uB3D9 \uACBD\uB85C \uAC10\uC2DC",
    unit: "m/s",
    metric: "\uD48D\uC18D",
    updatedAt: "2026.06.04 14:00",
    source: "VHWIS \uD0DC\uD48D\uC13C\uD130",
    maxValue: 75,
    minValue: 0,
    gridCellSizeMeters: 5500,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15],
    palette: createPaletteSteps([
      [0, "#e8fdf5"],
      [15, "#4ce4a6"],
      [25, "#f6c927"],
      [35, "#f68027"],
      [50, "#c81e3d"],
      [75, "#7b1fa2"]
    ]),
    points: buildPoints(typhoonValues, true)
  }
];

// server/kmaCache.ts
import Redis from "ioredis";
var REDIS_URL = process.env.REDIS_URL;
var redisClient = null;
if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2e3
    });
    redisClient.on("error", (err) => {
      console.warn("[vhwis-redis] Redis error, falling back to local memory cache:", err.message);
    });
    redisClient.on("connect", () => {
      console.log("[vhwis-redis] Connected to Redis successfully.");
    });
  } catch (err) {
    console.warn("[vhwis-redis] Failed to initialize Redis client:", err);
  }
}
function closeRedisConnection() {
  if (redisClient) {
    console.log("[vhwis-redis] Closing Redis connection...");
    redisClient.disconnect();
    redisClient = null;
  }
}
var cache = /* @__PURE__ */ new Map();
var REQUEST_TIMEOUT_MS = 8e3;
function isCoastalOrSeaStation(id) {
  const coastalIds = [
    "haiphong",
    "quangninh",
    "namdinh",
    "ninhbinh",
    "thanhhoa",
    "nghean",
    "hue",
    "danang",
    "quangnam",
    "quynhon",
    "nhatrang",
    "phanthiet",
    "vungtau",
    "phuquoc",
    "camau",
    "hoangsa",
    "truongsa"
  ];
  return coastalIds.includes(id);
}
function isMountainStation(id) {
  const mountainIds = ["langson", "laocai", "dienbien", "sonla", "hoabinh", "dalat"];
  return mountainIds.includes(id);
}
function isLowLyingStation(id) {
  const lowIds = ["hochiminh", "cantho", "camau", "hanoi", "haiphong", "vungtau", "namdinh"];
  return lowIds.includes(id);
}
function calculateWildfireRisk(temp, humidity, windSpeed) {
  const risk = temp * 1.5 - humidity + windSpeed * 0.5 + 30;
  return Math.min(80, Math.max(0, Math.round(risk * 10) / 10));
}
function formatTimeLabel(isoString) {
  return isoString.replace("T", " ");
}
function getTyphoonCenter(epoch) {
  const epochCycle = epoch % 48;
  const lon = 116 - epochCycle * 0.28;
  const lat = 15 + Math.sin(epochCycle * 0.1) * 2;
  return { lat, lon };
}
var rawCache = /* @__PURE__ */ new Map();
var RAW_CACHE_TTL = 2 * 60 * 60 * 1e3;
async function fetchRawOpenMeteo(type, lats, lons, forceRefresh = false) {
  const now = Date.now();
  const cacheKey = `raw:${type}:${lats}:${lons}`;
  if (!forceRefresh) {
    if (redisClient && redisClient.status === "ready") {
      try {
        const cachedVal = await redisClient.get(cacheKey);
        if (cachedVal) {
          return JSON.parse(cachedVal);
        }
      } catch (err) {
        console.warn("[vhwis-redis] Failed to fetch rawCache from Redis:", err);
      }
    }
    const cached = rawCache.get(type);
    if (cached?.data && cached.expiresAt > now) {
      return cached.data;
    }
    if (cached?.promise && cached.expiresAt > now) {
      return cached.promise;
    }
  }
  const url = type === "aqi" ? `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}&current=us_aqi&hourly=us_aqi&past_days=2&timezone=Asia%2FHo_Chi_Minh` : `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,shortwave_radiation,cloud_cover,uv_index&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,shortwave_radiation,cloud_cover,uv_index&wind_speed_unit=ms&past_days=2&timezone=Asia%2FHo_Chi_Minh`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const expiresAt = now + RAW_CACHE_TTL;
  const promise = fetch(url, { signal: controller.signal }).then(async (res) => {
    if (!res.ok) throw new Error(`Open-Meteo request failed: ${res.status}`);
    const data = await res.json();
    const arr = Array.isArray(data) ? data : [data];
    if (redisClient && redisClient.status === "ready") {
      try {
        await redisClient.set(cacheKey, JSON.stringify(arr), "PX", RAW_CACHE_TTL);
      } catch (err) {
        console.warn("[vhwis-redis] Failed to set rawCache in Redis:", err);
      }
    }
    rawCache.set(type, { data: arr, expiresAt });
    return arr;
  }).catch((err) => {
    const stale = rawCache.get(type);
    if (stale?.data) {
      console.warn(`[vhwis-cache] Open-Meteo ${type} error, serving stale raw cache:`, err);
      rawCache.set(type, { data: stale.data, expiresAt: now + 5 * 60 * 1e3 });
      return stale.data;
    }
    rawCache.delete(type);
    throw err;
  }).finally(() => clearTimeout(timeout));
  rawCache.set(type, { promise, expiresAt });
  return promise;
}
async function fetchOpenMeteo(scenarioId, _options = {}) {
  const scenario = scenarios.find((s) => s.id === scenarioId);
  if (!scenario) {
    throw new Error("Unsupported weather scenario");
  }
  const targets = scenario.points;
  const lats = targets.map((t) => t.lat).join(",");
  const lons = targets.map((t) => t.lon).join(",");
  const isAqi = scenarioId === "aqi";
  const responses = await fetchRawOpenMeteo(isAqi ? "aqi" : "forecast", lats, lons, false);
  if (responses.length === 0 || !responses[0].current) {
    throw new Error("No weather data returned from Open-Meteo");
  }
  const firstRes = responses[0];
  const currentTime = firstRes.current.time;
  const currentHourlyIndex = firstRes.hourly.time.indexOf(currentTime);
  const baseIndex = currentHourlyIndex >= 0 ? currentHourlyIndex : 48;
  const frames = [];
  if (scenarioId === "rain") {
    const ACCUM_HOURS = 12;
    const nowAccumPoints = targets.map((point, idx) => {
      const res = responses[idx];
      let rainSum = 0;
      if (res && res.hourly) {
        const fromIdx = Math.max(0, baseIndex - ACCUM_HOURS);
        for (let i = fromIdx; i <= baseIndex; i++) {
          rainSum += res.hourly.precipitation[i] || 0;
        }
      }
      return { ...point, value: Math.round(rainSum * 10) / 10 };
    });
    frames.push({
      id: `rain-now-${currentTime}`,
      label: `\uC2E4\uD669 ${ACCUM_HOURS}h \uB204\uC801`,
      updatedAt: formatTimeLabel(currentTime),
      source: "Open-Meteo 12\uC2DC\uAC04 \uB204\uC801\uAC15\uC218",
      points: nowAccumPoints,
      successfulPoints: nowAccumPoints.length
    });
    for (let offset = 1; offset <= 6; offset++) {
      const forecastIndex = baseIndex + offset;
      if (forecastIndex >= firstRes.hourly.time.length) break;
      const forecastTime = firstRes.hourly.time[forecastIndex];
      const fcstAccumPoints = targets.map((point, idx) => {
        const res = responses[idx];
        let rainSum = 0;
        if (res && res.hourly) {
          const fromIdx = Math.max(0, forecastIndex - ACCUM_HOURS);
          for (let i = fromIdx; i <= forecastIndex; i++) {
            rainSum += res.hourly.precipitation[i] || 0;
          }
        }
        return { ...point, value: Math.round(rainSum * 10) / 10 };
      });
      frames.push({
        id: `rain-fcst-${forecastTime}`,
        label: `\uC608\uBCF4 ${forecastTime.slice(11)} (12h \uB204\uC801)`,
        updatedAt: formatTimeLabel(forecastTime),
        source: "Open-Meteo 12\uC2DC\uAC04 \uB204\uC801\uAC15\uC218",
        points: fcstAccumPoints,
        successfulPoints: fcstAccumPoints.length
      });
    }
  } else {
    const getPointsForFrame = (hourlyIndex, timeString) => {
      const currentEpoch = Math.floor(new Date(timeString).getTime() / 36e5);
      const typhoonCenter = getTyphoonCenter(currentEpoch);
      return targets.map((point, idx) => {
        const res = responses[idx];
        let val = 0;
        let direction = void 0;
        if (res) {
          const currentObj = hourlyIndex === null ? res.current : null;
          const hourlyObj = hourlyIndex !== null ? res.hourly : null;
          const tempVal = currentObj ? currentObj.temperature_2m : hourlyObj.temperature_2m[hourlyIndex];
          const humidVal = currentObj ? currentObj.relative_humidity_2m : hourlyObj.relative_humidity_2m[hourlyIndex];
          const windVal = currentObj ? currentObj.wind_speed_10m : hourlyObj.wind_speed_10m[hourlyIndex];
          const windDirVal = currentObj ? currentObj.wind_direction_10m : hourlyObj.wind_direction_10m[hourlyIndex];
          const gustVal = currentObj ? currentObj.wind_gusts_10m : hourlyObj.wind_gusts_10m[hourlyIndex];
          const pressVal = currentObj ? currentObj.surface_pressure : hourlyObj.surface_pressure[hourlyIndex];
          const rainVal = currentObj ? currentObj.precipitation : hourlyObj.precipitation[hourlyIndex];
          const solarVal = currentObj ? currentObj.shortwave_radiation : hourlyObj.shortwave_radiation[hourlyIndex];
          const cloudVal = currentObj ? currentObj.cloud_cover : hourlyObj.cloud_cover[hourlyIndex];
          const apparentTempVal = currentObj ? currentObj.apparent_temperature : hourlyObj.apparent_temperature[hourlyIndex];
          const uvVal = currentObj ? currentObj.uv_index : hourlyObj.uv_index[hourlyIndex];
          const aqiVal = isAqi ? currentObj ? currentObj.us_aqi : hourlyObj.us_aqi[hourlyIndex] : 0;
          if (scenarioId === "temperature") val = tempVal;
          else if (scenarioId === "humidity") val = humidVal;
          else if (scenarioId === "wind") {
            val = windVal;
            direction = windDirVal;
          } else if (scenarioId === "gust") {
            val = gustVal;
            direction = windDirVal;
          } else if (scenarioId === "pressure") val = pressVal;
          else if (scenarioId === "solar") val = solarVal;
          else if (scenarioId === "forecast_temp") val = tempVal;
          else if (scenarioId === "forecast_rain") val = rainVal;
          else if (scenarioId === "forecast_wind") {
            val = windVal;
            direction = windDirVal;
          } else if (scenarioId === "forecast_humidity") val = humidVal;
          else if (scenarioId === "cloud") val = cloudVal;
          else if (scenarioId === "heat") val = apparentTempVal;
          else if (scenarioId === "wildfire") val = calculateWildfireRisk(tempVal, humidVal, windVal);
          else if (scenarioId === "uv") val = uvVal;
          else if (scenarioId === "aqi") val = aqiVal;
          else if (scenarioId === "landslide") {
            let pastRain = rainVal;
            if (hourlyIndex !== null && res.hourly) {
              const sliceStart = Math.max(0, hourlyIndex - 24);
              pastRain = res.hourly.precipitation.slice(sliceStart, hourlyIndex + 1).reduce((s, v) => s + (v || 0), 0);
            }
            val = pastRain * 2.8 + (isMountainStation(point.id) ? 35 : 5);
            val = Math.min(100, Math.max(0, val));
          } else if (scenarioId === "flood") {
            val = rainVal * 12 + (isLowLyingStation(point.id) ? 30 : 2);
            val = Math.min(100, Math.max(0, val));
          } else if (scenarioId === "drought") {
            val = 100 - humidVal + (tempVal - 22) * 1.6;
            if (point.id === "cantho" || point.id === "camau" || point.id === "phanthiet") val += 15;
            val = Math.min(100, Math.max(0, val));
          } else if (scenarioId === "typhoon") {
            const dx = point.lon - typhoonCenter.lon;
            const dy = point.lat - typhoonCenter.lat;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxWind = 70;
            val = maxWind * Math.exp(-dist / 2.8) + windVal * 0.4;
            val = Math.min(75, Math.max(0, val));
            const angleToCenter = Math.atan2(dy, dx) * 180 / Math.PI;
            direction = Math.round((angleToCenter + 90 + 20) % 360);
          } else if (scenarioId === "sst") {
            if (isCoastalOrSeaStation(point.id)) {
              val = tempVal - 1.2 + solarVal / 450;
              val = Math.min(33, Math.max(24, val));
            } else {
              val = 0;
            }
          } else if (scenarioId === "wave") {
            if (isCoastalOrSeaStation(point.id)) {
              val = windVal * 0.26 + 0.3;
              if (point.id === "hoangsa" || point.id === "truongsa") val += 1.5;
              val = Math.min(8, Math.max(0.2, val));
            } else {
              val = 0;
            }
          }
        }
        return {
          ...point,
          value: Math.round(val * 10) / 10,
          direction
        };
      });
    };
    const nowPoints = getPointsForFrame(null, currentTime);
    frames.push({
      id: `now-${currentTime}`,
      label: `\uC2E4\uD669 ${currentTime.slice(11)}`,
      updatedAt: formatTimeLabel(currentTime),
      source: isAqi ? "Open-Meteo \uB300\uAE30\uC9C8 \uC2E4\uD669" : scenarioId === "typhoon" ? "VHWIS \uD0DC\uD48D\uC13C\uD130" : isCoastalOrSeaStation(scenarioId) ? "VHWIS \uD574\uC591\uC2E4\uD669" : "Open-Meteo \uC2E4\uD669",
      points: nowPoints,
      successfulPoints: nowPoints.length
    });
    for (let offset = 1; offset <= 6; offset++) {
      const forecastIndex = baseIndex + offset;
      if (forecastIndex >= firstRes.hourly.time.length) break;
      const forecastTime = firstRes.hourly.time[forecastIndex];
      const forecastPoints = getPointsForFrame(forecastIndex, forecastTime);
      frames.push({
        id: `fcst-${forecastTime}`,
        label: `\uC608\uBCF4 ${forecastTime.slice(11)}`,
        updatedAt: formatTimeLabel(forecastTime),
        source: isAqi ? "Open-Meteo \uB300\uAE30\uC9C8 \uC608\uBCF4" : scenarioId === "typhoon" ? "VHWIS \uD0DC\uD48D\uC608\uCE21" : isCoastalOrSeaStation(scenarioId) ? "VHWIS \uD574\uC591\uC608\uBCF4" : "Open-Meteo \uC608\uBCF4",
        points: forecastPoints,
        successfulPoints: forecastPoints.length
      });
    }
  }
  return {
    scenarioId: scenario.id,
    frames,
    cacheHit: false,
    successfulPoints: targets.length,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function getTimeline(scenarioId, forceRefresh = false, options = {}) {
  const cacheKey = `timeline:${scenarioId}:${options.start || ""}:${options.end || ""}`;
  const localCacheKey = `${scenarioId}:${options.start || ""}:${options.end || ""}`;
  const now = Date.now();
  if (!forceRefresh) {
    if (redisClient && redisClient.status === "ready") {
      try {
        const cachedVal = await redisClient.get(cacheKey);
        if (cachedVal) {
          const parsed = JSON.parse(cachedVal);
          return { ...parsed, cacheHit: true };
        }
      } catch (err) {
        console.warn("[vhwis-redis] Failed to fetch timeline from Redis:", err);
      }
    }
    const cached = cache.get(localCacheKey);
    if (cached?.payload && cached.expiresAt > now) {
      return { ...cached.payload, cacheHit: true };
    }
    if (cached?.promise && cached.expiresAt > now) {
      return { ...await cached.promise, cacheHit: true };
    }
  }
  const expiresAt = now + 2 * 60 * 60 * 1e3;
  const promise = fetchOpenMeteo(scenarioId, options);
  cache.set(localCacheKey, { promise, expiresAt });
  try {
    const payload = await promise;
    cache.set(localCacheKey, { payload, expiresAt });
    if (redisClient && redisClient.status === "ready") {
      try {
        await redisClient.set(cacheKey, JSON.stringify(payload), "PX", 2 * 60 * 60 * 1e3);
      } catch (err) {
        console.warn("[vhwis-redis] Failed to set timeline in Redis:", err);
      }
    }
    return payload;
  } catch (error) {
    const cached = cache.get(localCacheKey);
    if (cached?.payload) {
      console.warn(`[vhwis-cache] API error for ${scenarioId}, serving stale cache:`, error);
      cache.set(localCacheKey, { payload: cached.payload, expiresAt: now + 5 * 60 * 1e3 });
      return { ...cached.payload, cacheHit: true };
    }
    cache.delete(localCacheKey);
    throw error;
  }
}
function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}
function createVhwisCacheMiddleware(_serviceKey) {
  return async (request, response, next) => {
    const url = request.url ?? "";
    if (!url.startsWith("/api/weather/")) {
      next();
      return;
    }
    const parsedUrl = new URL(url, "http://localhost");
    const scenarioId = decodeURIComponent(parsedUrl.pathname.replace("/api/weather/", ""));
    const forceRefresh = parsedUrl.searchParams.get("refresh") === "1";
    const options = {
      start: parsedUrl.searchParams.get("start") ?? void 0,
      end: parsedUrl.searchParams.get("end") ?? void 0
    };
    try {
      const payload = await getTimeline(scenarioId, forceRefresh, options);
      sendJson(response, 200, payload);
    } catch (error) {
      sendJson(response, 502, { error: error instanceof Error ? error.message : "Weather API failed" });
    }
  };
}
async function warmKmaCache(_serviceKey) {
  await Promise.all(scenarios.map((scenario) => getTimeline(scenario.id).catch(() => void 0)));
}
function scheduleVhwisCacheWarmup(_serviceKey) {
  let timer;
  const run = () => {
    warmKmaCache().finally(() => {
      timer = setTimeout(run, 30 * 60 * 1e3);
    });
  };
  run();
  return () => {
    if (timer) {
      clearTimeout(timer);
    }
  };
}

// server/server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var PORT = process.env.PORT || 8080;
var DIST_DIR = path.join(__dirname, "../dist");
var KMA_KEY = process.env.VITE_KMA_AUTH_KEY || "";
function serveStaticFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "text/plain; charset=utf-8";
    if (ext === ".html") contentType = "text/html; charset=utf-8";
    else if (ext === ".js") contentType = "application/javascript; charset=utf-8";
    else if (ext === ".css") contentType = "text/css; charset=utf-8";
    else if (ext === ".json") contentType = "application/json; charset=utf-8";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".svg") contentType = "image/svg+xml";
    else if (ext === ".ico") contentType = "image/x-icon";
    res.setHeader("Content-Type", contentType);
    res.end(data);
  });
}
var cacheMiddleware = createVhwisCacheMiddleware(KMA_KEY);
var server = http.createServer((req, res) => {
  const url = req.url || "/";
  if (url.startsWith("/api/weather/")) {
    cacheMiddleware(req, res, () => {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Not Found");
    });
    return;
  }
  let safeUrl = url.split("?")[0];
  if (safeUrl === "/") safeUrl = "/index.html";
  const targetPath = path.join(DIST_DIR, safeUrl);
  if (!targetPath.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Forbidden");
    return;
  }
  fs.stat(targetPath, (err, stats) => {
    if (err || !stats.isFile()) {
      serveStaticFile(path.join(DIST_DIR, "index.html"), res);
    } else {
      serveStaticFile(targetPath, res);
    }
  });
});
var stopWarmup = scheduleVhwisCacheWarmup(KMA_KEY);
server.listen(PORT, () => {
  console.log(`[VHWIS Production Server] Running at http://localhost:${PORT}`);
});
function handleShutdown(signal) {
  console.log(`Received ${signal}. Shutting down server...`);
  stopWarmup();
  closeRedisConnection();
  server.close(() => {
    console.log("Server closed. Exiting process.");
    process.exit(0);
  });
}
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));
