// filters.js
// Daltonization color matrices + SVG filter injection.
//
// Each matrix is the standard daltonization operator collapsed into a single
// linear transform:  M = I + C * (I - S)
//   S = deficiency simulation matrix
//   C = error-redistribution matrix (shifts lost red/green info into channels
//       the viewer can perceive)
// Applied to a page as an SVG <feColorMatrix> referenced by CSS filter: url().

(function () {
  "use strict";

  // 3x3 daltonization-correction matrices (row-major: R, G, B output rows).
  const MATRICES = {
    deuteranopia: [
      [1.0, 0.0, 0.0],
      [-0.4375, 1.4375, 0.0],
      [0.2625, -0.5625, 1.3],
    ],
    protanopia: [
      [1.0, 0.0, 0.0],
      [-0.2549, 1.2549, 0.0],
      [0.3031, -0.5451, 1.242],
    ],
    // Tritanopia (blue/yellow). Lost blue-yellow info is redistributed into
    // the red/green channels a tritanope retains.
    tritanopia: [
      [1.0, -0.3325, 0.3325],
      [0.0, 1.3325, -0.3325],
      [0.0, -0.475, 1.475],
    ],
  };

  const SVG_NS = "http://www.w3.org/2000/svg";
  const CONTAINER_ID = "cbfh-filter-defs";

  // Blend a 3x3 matrix toward identity by strength t.
  // t = 0 -> no change (identity), t = 1 -> standard correction,
  // t > 1 -> over-drive (extrapolates the correction for harder cases).
  function blendToIdentity(m, t) {
    const I = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const out = [];
    for (let r = 0; r < 3; r++) {
      out.push([]);
      for (let c = 0; c < 3; c++) {
        out[r].push((1 - t) * I[r][c] + t * m[r][c]);
      }
    }
    return out;
  }

  // Convert a 3x3 matrix to the 20-value (4x5) feColorMatrix string.
  function toFeColorMatrixValues(m) {
    const r = m[0];
    const g = m[1];
    const b = m[2];
    return [
      r[0], r[1], r[2], 0, 0,
      g[0], g[1], g[2], 0, 0,
      b[0], b[1], b[2], 0, 0,
      0, 0, 0, 1, 0,
    ].join(" ");
  }

  // Ensure the hidden <svg> with <filter> defs exists in the page DOM and is
  // up to date with the requested deficiency type + strength.
  function ensureFilters(type, strength) {
    const matrix = MATRICES[type] || MATRICES.deuteranopia;
    const t = typeof strength === "number" ? Math.max(0, Math.min(3, strength)) : 1;
    const values = toFeColorMatrixValues(blendToIdentity(matrix, t));

    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
      container = document.createElementNS(SVG_NS, "svg");
      container.setAttribute("id", CONTAINER_ID);
      container.setAttribute("aria-hidden", "true");
      // Keep it out of layout / invisible but present.
      container.setAttribute(
        "style",
        "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;"
      );

      const filter = document.createElementNS(SVG_NS, "filter");
      filter.setAttribute("id", "cbfh-daltonize");
      filter.setAttribute("color-interpolation-filters", "sRGB");

      const fe = document.createElementNS(SVG_NS, "feColorMatrix");
      fe.setAttribute("type", "matrix");
      fe.setAttribute("id", "cbfh-daltonize-matrix");
      fe.setAttribute("values", values);

      filter.appendChild(fe);
      container.appendChild(filter);
      (document.body || document.documentElement).appendChild(container);
    } else {
      const fe = document.getElementById("cbfh-daltonize-matrix");
      if (fe) fe.setAttribute("values", values);
    }
  }

  // Expose to content.js (same content-script isolated world).
  window.CBFH = {
    FILTER_URL: "url(#cbfh-daltonize)",
    ensureFilters,
    types: Object.keys(MATRICES),
  };
})();
