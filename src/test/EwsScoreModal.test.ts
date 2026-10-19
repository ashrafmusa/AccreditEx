import { scoreSpO2Scale2 } from "@/components/clinical/EwsScoreModal";

describe("NEWS2 SpO2 Scale 2", () => {
  it.each([
    [83, false, 3],
    [84, false, 2],
    [85, true, 2],
    [86, false, 1],
    [87, true, 1],
    [88, false, 0],
    [92, true, 0],
    [93, false, 0],
    [93, true, 1],
    [94, true, 1],
    [95, true, 2],
    [96, true, 2],
    [97, true, 3],
    [100, true, 3],
  ])("scores %i%% with supplemental oxygen=%s as %i", (spo2, onO2, expected) => {
    expect(scoreSpO2Scale2(spo2, onO2)).toBe(expected);
  });
});
