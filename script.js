const ODS_LIST = [
  { num: 8, label: 'ODS 8 · Trabajo decente', color: '#A4026B', bg: '#FBEAF0', icon: 'ti-briefcase' },
  { num: 9, label: 'ODS 9 · Industria e innovación', color: '#F36E24', bg: '#FAEEDA', icon: 'ti-bulb' },
  { num: 12, label: 'ODS 12 · Producción sostenible', color: '#BF8B2E', bg: '#FAEEDA', icon: 'ti-refresh' },
  { num: 13, label: 'ODS 13 · Acción por el clima', color: '#3F7E44', bg: '#EAF3DE', icon: 'ti-leaf' },
  { num: 17, label: 'ODS 17 · Alianzas', color: '#185FA5', bg: '#E6F1FB', icon: 'ti-users-group' },
];

const BASE = { vida: 2, recup: 10, ener: 0, sal: 80, prov: 0, mod: 0 };
const CIRC = { vida: 6, recup: 75, ener: 70, sal: 110, prov: 50, mod: 80 };
const CRIS = { vida: 4, recup: 40, ener: 20, sal: 90, prov: 30, mod: 40 };

// Chart.js Global Defaults
if (typeof Chart !== 'undefined') {
  Chart.defaults.font.family = "'Outfit', sans-serif";
  Chart.defaults.color = '#64748b';
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
}

function getVals() {
  return {
    vida: +document.getElementById('sl-vida').value,
    recup: +document.getElementById('sl-recup').value,
    ener: +document.getElementById('sl-ener').value,
    sal: +document.getElementById('sl-sal').value,
    prov: +document.getElementById('sl-prov').value,
    mod: +document.getElementById('sl-mod').value,
  };
}

function setVals(v) {
  document.getElementById('sl-vida').value = v.vida;
  document.getElementById('sl-recup').value = v.recup;
  document.getElementById('sl-ener').value = v.ener;
  document.getElementById('sl-sal').value = v.sal;
  document.getElementById('sl-prov').value = v.prov;
  document.getElementById('sl-mod').value = v.mod;
  update();
}

function applyScenario(id) {
  ['base', 'circular', 'crisis'].forEach(s => {
    const el = document.getElementById('s-' + s);
    if (el) el.classList.remove('active');
  });
  const activeEl = document.getElementById('s-' + id);
  if (activeEl) activeEl.classList.add('active');

  if (id === 'base') setVals(BASE);
  else if (id === 'circular') setVals(CIRC);
  else setVals(CRIS);
}

function calcKPIs(v) {
  const ingresoBase = 420;
  const costeAdqBase = 300;
  const costeAdq = costeAdqBase / (v.vida / 2);
  const ahorroRecup = v.recup * 0.8;
  const costeSal = 80 + (v.sal - 80) * 1.2;
  const costeProv = 40 + v.prov * 0.3;
  const costeEnerg = 60 * (1 - v.ener * 0.007);
  const costeTotal = costeAdq + costeSal + costeProv + costeEnerg - ahorroRecup;
  const beneficio = Math.round(ingresoBase - costeTotal);

  const co2Base = 180;
  const co2 = Math.round(co2Base
    - (v.vida - 2) * 12
    - v.recup * 0.6
    - v.ener * 0.8
    - v.prov * 0.4
    - v.mod * 0.3);

  const reputacion = Math.min(100, Math.round(
    30
    + (v.vida - 2) * 4
    + v.recup * 0.25
    + v.ener * 0.2
    + (v.sal - 80) * 0.4
    + v.prov * 0.2
    + v.mod * 0.15
  ));

  const odsScore = {
    8: Math.min(100, Math.round(20 + (v.sal - 80) * 1.2 + v.prov * 0.3)),
    9: Math.min(100, Math.round(10 + v.mod * 0.6 + v.recup * 0.3)),
    12: Math.min(100, Math.round(5 + v.recup * 0.5 + v.mod * 0.4 + (v.vida - 2) * 5)),
    13: Math.min(100, Math.round(5 + v.ener * 0.6 + v.prov * 0.3 + (v.vida - 2) * 4)),
    17: Math.min(100, Math.round(20 + v.prov * 0.5 + reputacion * 0.2)),
  };

  return {
    beneficio,
    co2: Math.max(20, co2),
    reputacion,
    vidaUtil: v.vida,
    odsScore,
    costes: {
      adquisicion: Math.round(costeAdq),
      recuperacion: Math.round(ahorroRecup),
      salarios: Math.round(costeSal),
      proveedores: Math.round(costeProv),
      energia: Math.round(costeEnerg),
    }
  };
}

let chartCostes = null;
let chartScatter = null;
const history = [];

function update() {
  const v = getVals();

  document.getElementById('val-vida').textContent = v.vida + ' años';
  document.getElementById('val-recup').textContent = v.recup + '%';
  document.getElementById('val-ener').textContent = v.ener + '%';
  document.getElementById('val-sal').textContent = v.sal + '%';
  document.getElementById('val-prov').textContent = v.prov + '%';
  document.getElementById('val-mod').textContent = v.mod + '%';

  const k = calcKPIs(v);

  history.push({ ben: k.beneficio, co2: k.co2 });
  if (history.length > 30) history.shift();

  const kBase = calcKPIs(BASE);

  const metrics = [
    { label: 'Beneficio neto', value: k.beneficio, unit: '€/dispositivo/año', base: kBase.beneficio, higher: true, icon: 'ti-coin' },
    { label: 'Emisiones CO₂', value: k.co2, unit: 'kg CO₂/dispositivo/año', base: kBase.co2, higher: false, icon: 'ti-leaf' },
    { label: 'Reputación', value: k.reputacion, unit: '/ 100 pts', base: kBase.reputacion, higher: true, icon: 'ti-star' },
    { label: 'Vida útil media', value: k.vidaUtil, unit: 'años', base: kBase.vidaUtil, higher: true, icon: 'ti-device-laptop' },
  ];

  const grid = document.getElementById('metrics-grid');
  grid.innerHTML = metrics.map(m => {
    const diff = m.value - m.base;
    const better = m.higher ? diff > 0 : diff < 0;
    const worse = m.higher ? diff < 0 : diff > 0;
    const sign = diff > 0 ? '+' : '';
    const cls = better ? 'delta-up' : (worse ? 'delta-down' : 'delta-neutral');
    const arrow = better ? 'ti-trending-up' : (worse ? 'ti-trending-down' : 'ti-minus');
    
    return `<div class="metric">
      <div class="metric-label"><i class="ti ${m.icon}" style="margin-right:4px"></i> ${m.label}</div>
      <div class="metric-value">${(m.label.includes('Beneficio') && m.value >= 0 ? '+' : '') + m.value}</div>
      <div class="metric-unit">${m.unit}</div>
      <div class="metric-delta ${cls}">
        <i class="ti ${arrow}"></i> ${sign}${Math.round(diff)} vs inicial
      </div>
    </div>`;
  }).join('');

  const alertZone = document.getElementById('alert-zone');
  let alertHtml = '';
  if (k.beneficio < 0) {
    alertHtml = `<div class="alert-box alert-danger"><i class="ti ti-alert-triangle" style="font-size:20px"></i> <div><strong>Beneficio negativo.</strong> Los costes superan los ingresos. El modelo actual no es financieramente viable. Considera aumentar la vida útil o reducir la dependencia de proveedores costosos.</div></div>`;
  } else if (k.reputacion >= 80 && k.co2 <= 70) {
    alertHtml = `<div class="alert-box alert-good"><i class="ti ti-circle-check" style="font-size:20px"></i> <div><strong>Liderazgo en sostenibilidad.</strong> Has logrado un equilibrio excepcional entre rentabilidad y compromiso ambiental. Este modelo es un referente para el sector.</div></div>`;
  } else if (v.ener < 30 || v.mod < 30) {
    alertHtml = `<div class="alert-box alert-warning"><i class="ti ti-bulb" style="font-size:20px"></i> <div><strong>Potencial de mejora.</strong> Incrementar la energía renovable y el diseño modular reduciría drásticamente la huella de carbono con un impacto moderado en costes.</div></div>`;
  }
  alertZone.innerHTML = alertHtml;

  const odsGrid = document.getElementById('ods-grid');
  odsGrid.innerHTML = ODS_LIST.map(ods => {
    const score = k.odsScore[ods.num];
    const active = score >= 45;
    return `<span class="ods-pill ods-${active ? 'active' : 'inactive'}" 
      style="background:${active ? ods.bg : '#f1f5f9'}; color:${active ? ods.color : '#94a3b8'}; border-color:${active ? ods.color + '40' : 'transparent'}"
      title="Alineación: ${score}%">
      <i class="ti ${ods.icon}"></i> ${ods.label} · ${score}%
    </span>`;
  }).join('');

  // Charts
  const textCol = '#64748b';
  const gridCol = 'rgba(226, 232, 240, 0.5)';

  if (chartCostes) chartCostes.destroy();
  const canvasCostes = document.getElementById('chartCostes');
  if (canvasCostes) {
    const ctxC = canvasCostes.getContext('2d');
    chartCostes = new Chart(ctxC, {
      type: 'bar',
      data: {
        labels: ['Adquisición', 'Salarios', 'Proveedores', 'Energía', 'Ahorro Recup.'],
        datasets: [{
          data: [k.costes.adquisicion, k.costes.salarios, k.costes.proveedores, k.costes.energia, -k.costes.recuperacion],
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#ec4899'],
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { font: { size: 10 }, callback: v => v + '€' }, grid: { color: gridCol } }
        }
      }
    });
  }

  if (chartScatter) chartScatter.destroy();
  const canvasScatter = document.getElementById('chartScatter');
  if (canvasScatter) {
    const ctxS = canvasScatter.getContext('2d');
    chartScatter = new Chart(ctxS, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Historial',
            data: history.slice(0, -1).map(h => ({ x: h.co2, y: h.ben })),
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            pointRadius: 4,
          },
          {
            label: 'Actual',
            data: [{ x: k.co2, y: k.beneficio }],
            backgroundColor: '#10b981',
            pointRadius: 10,
            pointHoverRadius: 12,
            borderColor: '#fff',
            borderWidth: 3,
            shadowBlur: 10,
            shadowColor: 'rgba(16, 185, 129, 0.4)',
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'CO₂ (kg)', font: { size: 10, weight: 'bold' } }, ticks: { font: { size: 10 } }, grid: { color: gridCol } },
          y: { title: { display: true, text: 'Beneficio (€)', font: { size: 10, weight: 'bold' } }, ticks: { font: { size: 10 }, callback: v => v + '€' }, grid: { color: gridCol } }
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyScenario('base');
});
