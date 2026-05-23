import {
  mergeBluetoothDevices,
  normalizeBluetoothMacAddress,
} from '../scannerUtils';

describe('scannerUtils bluetooth', () => {
  it('normalise une MAC avec ou sans séparateurs', () => {
    expect(normalizeBluetoothMacAddress('aabbccddeeff')).toBe('AA:BB:CC:DD:EE:FF');
    expect(normalizeBluetoothMacAddress('AA-BB-CC-DD-EE-FF')).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('fusionne les listes sans doublons', () => {
    const merged = mergeBluetoothDevices(
      [{ id: 'AA:BB:CC:DD:EE:01', name: 'A', bonded: true }],
      [{ id: 'aa:bb:cc:dd:ee:01', name: 'A2', bonded: false }],
      [{ id: 'AA:BB:CC:DD:EE:02', name: 'B', bonded: false }]
    );
    expect(merged).toHaveLength(2);
    expect(merged[0].id).toBe('AA:BB:CC:DD:EE:01');
    expect(merged[0].bonded).toBe(true);
  });
});
