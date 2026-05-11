export const PRODUCT_CATALOG = {
  enlatado: [
    {
      id: 'atun',
      name: 'Atun enlatado',
      defaults: {
        tref: 121.1,
        z: 10,
        d: 0.21,
        n: 12,
        m: 1.2,
        cp: 3.6,
        dT: 35,
        u: 0.85,
        dtlm: 18,
        intervals: [
          { id: '1', temp: 100, dt: 8 },
          { id: '2', temp: 112, dt: 16 },
          { id: '3', temp: 121, dt: 24 },
        ],
      },
    },
    {
      id: 'sardina',
      name: 'Sardina enlatada',
      defaults: {
        tref: 121.1,
        z: 9,
        d: 0.25,
        n: 12,
        m: 0.95,
        cp: 3.5,
        dT: 33,
        u: 0.82,
        dtlm: 16,
        intervals: [
          { id: '1', temp: 98, dt: 7 },
          { id: '2', temp: 110, dt: 15 },
          { id: '3', temp: 120, dt: 22 },
        ],
      },
    },
  ],
};

export function getDefaults(type, productId) {
  const products = PRODUCT_CATALOG[type] || [];
  const found = products.find((p) => p.id === productId) || products[0];
  return found?.defaults || {
    tref: 0,
    z: 0,
    d: 0,
    n: 0,
    m: 0,
    cp: 0,
    dT: 0,
    u: 0,
    dtlm: 0,
    intervals: [
      { id: '1', temp: 0, dt: 0 },
      { id: '2', temp: 0, dt: 0 },
      { id: '3', temp: 0, dt: 0 },
    ],
  };
}
