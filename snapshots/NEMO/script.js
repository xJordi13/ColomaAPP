const profile = document.getElementById("profile");

function getProfileData() {
  const Tref = Number(document.getElementById("tref").value);
  const Z = Number(document.getElementById("z").value);

  if (!Number.isFinite(Tref) || !Number.isFinite(Z) || Z <= 0) {
    return { error: "Z no puede ser 0" };
  }

  const rows = [...profile.querySelectorAll(".interval")];
  if (rows.length === 0) {
    return { error: "Agrega al menos un intervalo" };
  }

  let f = 0;
  let validIntervals = 0;

  rows.forEach((row) => {
    const T = Number(row.querySelector(".row-t").value);
    const dt = Number(row.querySelector(".row-dt").value);

    if (!Number.isFinite(T) || !Number.isFinite(dt) || dt <= 0) {
      return;
    }

    const exponent = (T - Tref) / Z;
    if (!Number.isFinite(exponent) || Math.abs(exponent) > 12) {
      return;
    }

    const L = Math.pow(10, exponent);
    if (!Number.isFinite(L)) {
      return;
    }

    const contribution = L * dt;
    if (!Number.isFinite(contribution) || contribution > 1e6) {
      return;
    }

    validIntervals += 1;
    f += contribution;
  });

  if (validIntervals === 0) {
    return { error: "Ingresa valores validos (Delta t > 0)" };
  }

  return { value: f };
}

function createIntervalRow(temp = 0, dt = 0) {
  const row = document.createElement("div");
  row.className = "interval";
  row.innerHTML = `
    <label>T (C)
      <input type="number" step="0.1" class="row-t" value="${temp}">
    </label>
    <label>Delta t (min)
      <input type="number" step="0.01" class="row-dt" value="${dt}">
    </label>
    <button class="btn ghost remove-row" type="button">Quitar</button>
  `;

  row.querySelector(".remove-row").addEventListener("click", () => {
    row.remove();
    updateResults();
  });

  row.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", updateResults);
  });

  profile.appendChild(row);
}

function updateResults() {
  const out = getProfileData();
  const resultFReal = document.getElementById("resultFReal");
  const resultFDesign = document.getElementById("resultFDesign");
  const badge = document.getElementById("validation");
  // helper: detect if user hasn't entered any non-zero numeric input yet
  function allNumericInputsAreZero() {
    const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
    if (inputs.length === 0) return true;
    return inputs.every((inp) => {
      const v = Number(inp.value);
      return !Number.isFinite(v) ? true : v === 0;
    });
  }

  if (out.error) {
    // if everything is still at default 0, don't show an error state yet
    if (allNumericInputsAreZero()) {
      resultFReal.textContent = "F_real = -";
      resultFDesign.textContent = "F_diseno = -";
      badge.textContent = "Estado: -";
      badge.classList.remove("ok", "fail");
      return;
    }

    resultFReal.textContent = `F_real = error (${out.error})`;
    resultFDesign.textContent = "F_diseno = -";
    badge.textContent = `Estado: error (${out.error})`;
    badge.classList.remove("ok");
    badge.classList.add("fail");
    return;
  }

  resultFReal.textContent = `F_real = ${out.value.toFixed(4)} min eq`;

  const D = Number(document.getElementById("d").value);
  const n = Number(document.getElementById("n").value);
  const fDesign = D * n;
  resultFDesign.textContent = `F_diseno = ${Number.isFinite(fDesign) ? fDesign.toFixed(4) : "-"} min eq`;

  badge.classList.remove("ok", "fail");

  if (!Number.isFinite(fDesign) || fDesign <= 0) {
    badge.textContent = "Estado: define D y reducciones";
    return;
  }

  if (out.value >= fDesign) {
    badge.textContent = "Estado: Proceso seguro (F_real >= F_diseno)";
    badge.classList.add("ok");
  } else {
    badge.textContent = "Estado: Ajustar variables (F_real < F_diseno)";
    badge.classList.add("fail");
  }
}

document.getElementById("btnL").addEventListener("click", () => {
  const T = Number(document.getElementById("temp").value);
  const Tref = Number(document.getElementById("tref").value);
  const Z = Number(document.getElementById("z").value);

  if (!Number.isFinite(Z) || Z <= 0) {
    document.getElementById("resultL").textContent = "L = error (Z no puede ser 0)";
    return;
  }

  const L = Math.pow(10, (T - Tref) / Z);
  const formattedL = L >= 0.00001 ? L.toFixed(5) : L.toExponential(3);
  document.getElementById("resultL").textContent = `L = ${formattedL}`;
});

document.getElementById("addRow").addEventListener("click", () => {
  createIntervalRow();
  updateResults();
});

document.getElementById("calcF").addEventListener("click", updateResults);

document.getElementById("calcDesign").addEventListener("click", updateResults);

document.getElementById("calcHeat").addEventListener("click", () => {
  const m = Number(document.getElementById("m").value);
  const cp = Number(document.getElementById("cp").value);
  const dT = Number(document.getElementById("dT").value);
  const U = Number(document.getElementById("u").value);
  const dTlm = Number(document.getElementById("dtlm").value);

  const Q = m * cp * dT;
  document.getElementById("resultQ").textContent = `Q = ${Q.toFixed(3)} kW aprox`;

  if (U === 0 || dTlm === 0) {
    document.getElementById("resultA").textContent = "A = error (U y Delta T_lm no pueden ser 0)";
    return;
  }

  const A = Q / (U * dTlm);
  document.getElementById("resultA").textContent = `A = ${A.toFixed(3)} m2 aprox`;
});

createIntervalRow(0, 0);
createIntervalRow(0, 0);
createIntervalRow(0, 0);
updateResults();
