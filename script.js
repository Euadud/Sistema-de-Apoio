
function goTo(pageId) {
  document.querySelectorAll('.page.active').forEach(p => p.classList.remove('active'));

  const page = document.getElementById(pageId);
  if (page) {
    page.classList.add('active');
  }

  window.scrollTo(0, 0);

  if (pageId === 'page-inventario')  renderTable('inventario');
  if (pageId === 'page-componentes') renderComponentes();
  if (pageId === 'page-estsuperior') renderTable('estsuperior');
  if (pageId === 'page-estinferior') renderTable('estinferior');
  if (pageId === 'page-galpao')      renderTable('galpao');
  if (pageId === 'page-saida')       renderSaidaItens();
}


const STORAGE_KEY = 'flapa_data';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Erro ao carregar dados:', e);
  }

  return {
    inventario: [],
    componentes: [],
    estsuperior: [],
    estinferior: [],
    galpao: [],
    saidaAtual: {
      empresa: '',
      solicitante: '',
      data: '',
      itens: []
    },
    historicoSaidas: []
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
}

let DB = loadData();

DB.inventario      = DB.inventario      || [];
DB.componentes     = DB.componentes     || [];
DB.estsuperior     = DB.estsuperior     || [];
DB.estinferior     = DB.estinferior     || [];
DB.galpao          = DB.galpao          || [];
DB.saidaAtual      = DB.saidaAtual      || { empresa: '', solicitante: '', data: '', itens: [] };
DB.historicoSaidas = DB.historicoSaidas || [];


const tableConfigs = {
  inventario:  { fields: ['desc', 'cod', 'marca', 'qtd'],          hasLocal: false, prefix: 'inv'    },
  estsuperior: { fields: ['desc', 'cod', 'marca', 'qtd', 'local'], hasLocal: true,  prefix: 'estsup' },
  estinferior: { fields: ['desc', 'cod', 'marca', 'qtd', 'local'], hasLocal: true,  prefix: 'estinf' },
  galpao:      { fields: ['desc', 'cod', 'marca', 'qtd', 'local'], hasLocal: true,  prefix: 'galpao' },
};

function addRow(type) {
  const cfg   = tableConfigs[type];
  const p     = cfg.prefix;
  const desc  = document.getElementById(p + '-desc').value.trim();
  const cod   = document.getElementById(p + '-cod').value.trim();
  const marca = document.getElementById(p + '-marca').value.trim();
  const qtd   = document.getElementById(p + '-qtd').value.trim();
  const local = cfg.hasLocal ? document.getElementById(p + '-local').value.trim() : null;

  if (!desc) { alert('Informe a descrição.'); return; }

  const item = { id: Date.now(), desc, cod, marca, qtd };
  if (cfg.hasLocal) item.local = local;

  DB[type].push(item);
  saveData();

  document.getElementById(p + '-desc').value  = '';
  document.getElementById(p + '-cod').value   = '';
  document.getElementById(p + '-marca').value = '';
  document.getElementById(p + '-qtd').value   = '';
  if (cfg.hasLocal) document.getElementById(p + '-local').value = '';

  renderTable(type);
}

function deleteRow(type, id) {
  if (!confirm('Deseja remover este item?')) return;
  DB[type] = DB[type].filter(i => i.id !== id);
  saveData();
  renderTable(type);
}

function editRow(type, id) {
  const cfg  = tableConfigs[type];
  const item = DB[type].find(i => i.id === id);
  if (!item) return;

  const newDesc = prompt('Descrição:', item.desc);
  if (newDesc === null) return;
  const newCod = prompt('Código:', item.cod);
  if (newCod === null) return;
  const newMarca = prompt('Marca:', item.marca);
  if (newMarca === null) return;
  const newQtd = prompt('Qtd:', item.qtd);
  if (newQtd === null) return;

  item.desc  = newDesc;
  item.cod   = newCod;
  item.marca = newMarca;
  item.qtd   = newQtd;

  if (cfg.hasLocal) {
    const newLocal = prompt('Local:', item.local);
    if (newLocal !== null) item.local = newLocal;
  }

  saveData();
  renderTable(type);
}

function renderTable(type) {
  const cfg    = tableConfigs[type];
  const tbody  = document.getElementById(type + '-tbody');
  if (!tbody) return;

  const searchEl = document.getElementById(type + '-search');
  const term     = searchEl ? searchEl.value.trim().toLowerCase() : '';

  let rows = DB[type];
  if (term) {
    rows = rows.filter(i =>
      (i.desc  || '').toLowerCase().includes(term) ||
      (i.cod   || '').toLowerCase().includes(term) ||
      (i.marca || '').toLowerCase().includes(term) ||
      (i.local || '').toLowerCase().includes(term)
    );
  }

  if (rows.length === 0) {
    const colspan = cfg.hasLocal ? 6 : 5;
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="empty-msg">Nenhum item cadastrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(item => `
    <tr>
      <td>${escapeHtml(item.desc)}</td>
      <td>${escapeHtml(item.cod)}</td>
      <td>${escapeHtml(item.marca)}</td>
      <td>${escapeHtml(item.qtd)}</td>
      ${cfg.hasLocal ? `<td>${escapeHtml(item.local)}</td>` : ''}
      <td>
        <button class="btn-icon edit" onclick="editRow('${type}', ${item.id})">✎</button>
        <button class="btn-icon del"  onclick="deleteRow('${type}', ${item.id})">🗑</button>
      </td>
    </tr>
  `).join('');
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;');
}


function addComponente() {
  const nome       = document.getElementById('comp-nome').value.trim();
  const equip      = document.getElementById('comp-equip').value.trim();
  const fornecedor = document.getElementById('comp-fornecedor').value.trim();
  const ida        = document.getElementById('comp-ida').value;
  const retorno    = document.getElementById('comp-retorno').value;
  const nf         = document.getElementById('comp-nf').value.trim();

  if (!nome) { alert('Informe o componente.'); return; }

  DB.componentes.push({
    id: Date.now(),
    nome, equip, fornecedor,
    ida:     ida     || '-',
    retorno: retorno || '-',
    nf:      nf      || '-',
    anexo:   ''
  });
  saveData();

  document.getElementById('comp-nome').value       = '';
  document.getElementById('comp-equip').value      = '';
  document.getElementById('comp-fornecedor').value = '';
  document.getElementById('comp-ida').value        = '';
  document.getElementById('comp-retorno').value    = '';
  document.getElementById('comp-nf').value         = '';

  renderComponentes();
}

function deleteComponente(id) {
  if (!confirm('Deseja remover este componente?')) return;
  DB.componentes = DB.componentes.filter(i => i.id !== id);
  saveData();
  renderComponentes();
}

function editComponente(id) {
  const item = DB.componentes.find(i => i.id === id);
  if (!item) return;

  const nome = prompt('Componente:', item.nome);
  if (nome === null) return;
  const equip = prompt('Equipamento:', item.equip);
  if (equip === null) return;
  const fornecedor = prompt('Fornecedor:', item.fornecedor);
  if (fornecedor === null) return;
  const ida = prompt('Data ida (aaaa-mm-dd):', item.ida);
  if (ida === null) return;
  const retorno = prompt('Data retorno (aaaa-mm-dd ou -):', item.retorno);
  if (retorno === null) return;
  const nf = prompt('NF:', item.nf);
  if (nf === null) return;

  item.nome       = nome;
  item.equip      = equip;
  item.fornecedor = fornecedor;
  item.ida        = ida;
  item.retorno    = retorno;
  item.nf         = nf;

  saveData();
  renderComponentes();
}

function renderComponentes() {
  const tbody = document.getElementById('componentes-tbody');
  if (!tbody) return;

  const term = document.getElementById('comp-search').value.trim().toLowerCase();

  let rows = [...DB.componentes];
  if (term) {
    rows = rows.filter(i =>
      (i.nome       || '').toLowerCase().includes(term) ||
      (i.equip      || '').toLowerCase().includes(term) ||
      (i.fornecedor || '').toLowerCase().includes(term) ||
      (i.nf         || '').toLowerCase().includes(term)
    );
  }
  rows.sort((a, b) => (b.ida || '').localeCompare(a.ida || ''));

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-msg">Nenhum componente registrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(item => `
    <tr>
      <td>${escapeHtml(item.nome)}</td>
      <td>${escapeHtml(item.equip)}</td>
      <td>${escapeHtml(item.fornecedor)}</td>
      <td>${escapeHtml(item.ida)}</td>
      <td>${escapeHtml(item.retorno)}</td>
      <td>${escapeHtml(item.nf)}</td>
      <td>${item.anexo ? `<a class="link" href="${item.anexo}" target="_blank">📎 Abrir</a>` : '-'}</td>
      <td>
        <button class="btn-icon edit" onclick="editComponente(${item.id})">✎</button>
        <button class="btn-icon del"  onclick="deleteComponente(${item.id})">🗑</button>
      </td>
    </tr>
  `).join('');
}

function addSaidaItem() {
  const empresa     = document.getElementById('saida-empresa').value.trim();
  const solicitante = document.getElementById('saida-solicitante').value.trim();
  const data        = document.getElementById('saida-data').value;
  const qtd         = document.getElementById('saida-qtd').value.trim();
  const material    = document.getElementById('saida-material').value.trim();
  const aplicacao   = document.getElementById('saida-aplicacao').value.trim();

  if (!qtd || !material) {
    alert('Informe ao menos Qtd e Material.');
    return;
  }

  DB.saidaAtual.empresa     = empresa;
  DB.saidaAtual.solicitante = solicitante;
  DB.saidaAtual.data        = data;
  DB.saidaAtual.itens.push({ id: Date.now(), qtd, material, aplicacao });
  saveData();

  document.getElementById('saida-qtd').value       = '';
  document.getElementById('saida-material').value  = '';
  document.getElementById('saida-aplicacao').value = '';

  renderSaidaItens();
}

function removeSaidaItem(id) {
  DB.saidaAtual.itens = DB.saidaAtual.itens.filter(i => i.id !== id);
  saveData();
  renderSaidaItens();
}

function renderSaidaItens() {
  const empresa     = document.getElementById('saida-empresa');
  const solicitante = document.getElementById('saida-solicitante');
  const data        = document.getElementById('saida-data');
  const container   = document.getElementById('saida-itens');

  if (!empresa || !solicitante || !data || !container) return;

  empresa.value     = DB.saidaAtual.empresa     || '';
  solicitante.value = DB.saidaAtual.solicitante || '';
  data.value        = DB.saidaAtual.data        || '';

  if (!DB.saidaAtual.itens.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = DB.saidaAtual.itens.map(it => `
    <div class="saida-item-row">
      <span class="qtd">${escapeHtml(it.qtd)}x</span>
      <span class="mat">${escapeHtml(it.material)}</span>
      <span class="apl">${escapeHtml(it.aplicacao)}</span>
      <button class="btn-icon del" onclick="removeSaidaItem(${it.id})">🗑</button>
    </div>
  `).join('');
}

function gerarPDFSaida() {
  DB.saidaAtual.empresa     = document.getElementById('saida-empresa').value.trim();
  DB.saidaAtual.solicitante = document.getElementById('saida-solicitante').value.trim();
  DB.saidaAtual.data        = document.getElementById('saida-data').value;

  if (!DB.saidaAtual.itens.length) {
    alert('Adicione ao menos um item antes de gerar o PDF.');
    return;
  }

  const html = `
    <html>
    <head>
      <title>Saída</title>
      <style>
        body { font-family: Arial; padding: 30px; }
        h1 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        td, th { border: 1px solid #333; padding: 8px; text-align: left; font-size: 13px; }
      </style>
    </head>
    <body>
      <h1>Comprovante de Saída - FLAPA</h1>
      <p><b>Empresa:</b> ${escapeHtml(DB.saidaAtual.empresa)}</p>
      <p><b>Solicitante:</b> ${escapeHtml(DB.saidaAtual.solicitante)}</p>
      <p><b>Data:</b> ${escapeHtml(DB.saidaAtual.data)}</p>
      <table>
        <tr><th>Qtd</th><th>Material</th><th>Aplicação</th></tr>
        ${DB.saidaAtual.itens.map(it => `
          <tr>
            <td>${escapeHtml(it.qtd)}</td>
            <td>${escapeHtml(it.material)}</td>
            <td>${escapeHtml(it.aplicacao)}</td>
          </tr>
        `).join('')}
      </table>
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  if (!win) {
    alert('O popup foi bloqueado. Permita popups para gerar o PDF.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 300);

  DB.historicoSaidas.unshift({
    id:           Date.now(),
    empresa:      DB.saidaAtual.empresa,
    solicitante:  DB.saidaAtual.solicitante,
    data:         DB.saidaAtual.data,
    itens:        JSON.parse(JSON.stringify(DB.saidaAtual.itens))
  });

  DB.saidaAtual = { empresa: '', solicitante: '', data: '', itens: [] };
  saveData();
  renderSaidaItens();
  renderHistorico();
}

function toggleHistorico() {
  const div = document.getElementById('saida-historico');
  const btn = document.getElementById('hist-btn');
  if (div.style.display === 'none') {
    div.style.display = 'block';
    btn.textContent = 'Ocultar histórico';
    renderHistorico();
  } else {
    div.style.display = 'none';
    btn.textContent = 'Histórico de saída';
  }
}

function renderHistorico() {
  const tbody = document.getElementById('historico-tbody');
  if (!tbody) return;

  if (!DB.historicoSaidas.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-msg">Nenhuma saída registrada ainda.</td></tr>`;
    return;
  }

  tbody.innerHTML = DB.historicoSaidas.map(h => `
    <tr>
      <td>${escapeHtml(h.empresa)}</td>
      <td>${escapeHtml(h.solicitante)}</td>
      <td>${escapeHtml(h.data)}</td>
      <td>${h.itens.map(it => `${escapeHtml(it.qtd)}x ${escapeHtml(it.material)}`).join('<br>')}</td>
      <td><button class="btn-icon del" onclick="deleteHistorico(${h.id})">🗑</button></td>
    </tr>
  `).join('');
}

function deleteHistorico(id) {
  if (!confirm('Remover este registro do histórico?')) return;
  DB.historicoSaidas = DB.historicoSaidas.filter(h => h.id !== id);
  saveData();
  renderHistorico();
}


function selecionarMarca(tipo, marca) {
  const targetId = tipo === 'Máquinas' ? 'marca-info-maquinas' : 'marca-info-caminhoes';
  const el = document.getElementById(targetId);
  if (!el) return;
  el.style.display = 'block';
  el.textContent = `Checklist de ${tipo} - ${marca} (em desenvolvimento)`;
}


document.addEventListener('DOMContentLoaded', function () {
  renderTable('inventario');
  renderTable('estsuperior');
  renderTable('estinferior');
  renderTable('galpao');
  renderComponentes();
  renderSaidaItens();
  renderHistorico();
});
