let tests = JSON.parse(localStorage.getItem('tests') || '[]');
let expandedRow = null; // Índice da linha ampliada (visualização)
let editingRow = null;  // Índice da linha em edição
let isInserting = false; // Se está inserindo nova linha

function getNextTestId() {
  // Busca todos os IDs que seguem o padrão TFxxx
  const ids = tests
    .map(t => t.id)
    .filter(id => /^TF\d{3}$/.test(id))
    .map(id => parseInt(id.slice(2), 10));
  let next = 1;
  while (ids.includes(next)) next++;
  return 'TF' + String(next).padStart(3, '0');
}

function renderTipoBadge(tipo) {
  if (tipo === 'positive') {
    return '<span class="badge badge-tipo-positivo">Positivo</span>';
  } else if (tipo === 'negative') {
    return '<span class="badge badge-tipo-negativo">Negativo</span>';
  }
  return '';
}

function renderStatusBadge(status) {
  switch (status) {
    case 'not-started':
      return '<span class="badge badge-status-naoiniciado">Não iniciado</span>';
    case 'in-progress':
      return '<span class="badge badge-status-emandamento">Em andamento</span>';
    case 'completed':
      return '<span class="badge badge-status-concluido">Concluído</span>';
    case 'blocked':
      return '<span class="badge badge-status-bloqueado">Bloqueado</span>';
    case 'deferred':
      return '<span class="badge badge-status-adiado">Adiado</span>';
    default:
      return '';
  }
}

function renderTable() {
  const tbody = document.querySelector('#testTable tbody');
  tbody.innerHTML = '';
  tests.forEach((test, i) => {
    // Linha principal
    const tr = document.createElement('tr');

    if (editingRow === i) {
      // Linha em modo de edição inline (ampliada)
      tr.innerHTML = `
        <td colspan="8" style="padding:0;">
          <form class="inline-edit-form" data-index="${i}">
            <div class="details-fields">
              <label>ID do Teste
                <input name="id" type="text" value="${test.id || ''}" required>
              </label>
              <label>Etapa do cenário
                <input name="step" type="text" value="${test.step || ''}">
              </label>
              <label>Descrição
                <input name="description" type="text" value="${test.description || ''}">
              </label>
              <label>Tipo
                <select name="type">
                  <option value="positive" ${test.type === 'positive' ? 'selected' : ''}>Positivo</option>
                  <option value="negative" ${test.type === 'negative' ? 'selected' : ''}>Negativo</option>
                </select>
              </label>
              <label>Prioridade
                <input name="priority" type="text" value="${test.priority || ''}">
              </label>
              <label>Status
                <select name="status">
                  <option value="not-started" ${test.status === 'not-started' ? 'selected' : ''}>Não iniciado</option>
                  <option value="in-progress" ${test.status === 'in-progress' ? 'selected' : ''}>Em andamento</option>
                  <option value="completed" ${test.status === 'completed' ? 'selected' : ''}>Concluído</option>
                  <option value="blocked" ${test.status === 'blocked' ? 'selected' : ''}>Bloqueado</option>
                  <option value="deferred" ${test.status === 'deferred' ? 'selected' : ''}>Adiado</option>
                </select>
              </label>
              <label>Responsável
                <input name="assignee" type="text" value="${test.assignee || ''}">
              </label>
              <label>Pré-requisitos
                <textarea name="prereq" class="plain-text">${test.prereq || ''}</textarea>
              </label>
              <label>Ação no SAP Fiori
                <textarea name="sapAction" class="plain-text">${test.sapAction || ''}</textarea>
              </label>
              <label>Resultado esperado SAP
                <textarea name="sapExpected" class="plain-text">${test.sapExpected || ''}</textarea>
              </label>
              <label>Validação na API
                <textarea name="apiValidation" class="plain-text">${test.apiValidation || ''}</textarea>
              </label>
              <label>Resultado esperado API
                <textarea name="apiExpected" class="plain-text">${test.apiExpected || ''}</textarea>
              </label>
              <label>Mais detalhes
                <textarea name="moreDetails" class="plain-text">${test.moreDetails || ''}</textarea>
              </label>
            </div>
            <div class="details-actions">
              <button type="submit">Salvar</button>
              <button type="button" class="cancel-btn">Cancelar</button>
            </div>
          </form>
        </td>
      `;
      tr.className = 'details-row';
      tbody.appendChild(tr);
    } else {
      // Linha normal
      tr.innerHTML = `
        <td>${test.id}</td>
        <td>${test.step}</td>
        <td>${test.description}</td>
        <td>${renderTipoBadge(test.type)}</td>
        <td>${test.priority}</td>
        <td>${renderStatusBadge(test.status)}</td>
        <td>${test.assignee}</td>
        <td>
          <button class="expand-btn" data-index="${i}">${expandedRow === i ? 'Recolher' : 'Ampliar'}</button>
          <button class="edit-btn" data-index="${i}">Editar</button>
          <button class="duplicate-btn" data-index="${i}">Duplicar</button>
          <button class="delete-btn" data-index="${i}">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);

      // Linha expandida de visualização (apenas leitura)
      if (expandedRow === i) {
        const detailsTr = document.createElement('tr');
        detailsTr.className = 'details-row';
        detailsTr.innerHTML = `
          <td colspan="8">
            <div class="details-view">
              <div class="details-view-block">
                <strong>Pré-requisitos:</strong>
                <div>${formatText(test.prereq)}</div>
              </div>
              <div class="details-view-block">
                <strong>Ação no SAP Fiori:</strong>
                <div>${formatText(test.sapAction)}</div>
              </div>
              <div class="details-view-block">
                <strong>Resultado esperado SAP:</strong>
                <div>${formatText(test.sapExpected)}</div>
              </div>
              <div class="details-view-block">
                <strong>Validação na API:</strong>
                <div>${formatText(test.apiValidation)}</div>
              </div>
              <div class="details-view-block">
                <strong>Resultado esperado API:</strong>
                <div>${formatText(test.apiExpected)}</div>
              </div>
              <div class="details-view-block">
                <strong>Mais detalhes:</strong>
                <div>${formatText(test.moreDetails)}</div>
              </div>
            </div>
          </td>
        `;
        tbody.appendChild(detailsTr);
      }
    }
  });

  // Linha de inserção no final (ampliada)
  if (isInserting) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="8" style="padding:0;">
        <form class="inline-insert-form">
          <div class="details-fields">
            <label>ID do Teste
              <input name="id" type="text" value="${getNextTestId()}" required>
            </label>
            <label>Etapa do cenário
              <input name="step" type="text">
            </label>
            <label>Descrição
              <input name="description" type="text">
            </label>
            <label>Tipo
              <select name="type">
                <option value="positive">Positivo</option>
                <option value="negative">Negativo</option>
              </select>
            </label>
            <label>Prioridade
              <input name="priority" type="text">
            </label>
            <label>Status
              <select name="status">
                <option value="not-started">Não iniciado</option>
                <option value="in-progress">Em andamento</option>
                <option value="completed">Concluído</option>
                <option value="blocked">Bloqueado</option>
                <option value="deferred">Adiado</option>
              </select>
            </label>
            <label>Responsável
              <input name="assignee" type="text">
            </label>
            <label>Pré-requisitos
              <textarea name="prereq" class="plain-text"></textarea>
            </label>
            <label>Ação no SAP Fiori
              <textarea name="sapAction" class="plain-text"></textarea>
            </label>
            <label>Resultado esperado SAP
              <textarea name="sapExpected" class="plain-text"></textarea>
            </label>
            <label>Validação na API
              <textarea name="apiValidation" class="plain-text"></textarea>
            </label>
            <label>Resultado esperado API
              <textarea name="apiExpected" class="plain-text"></textarea>
            </label>
            <label>Mais detalhes
              <textarea name="moreDetails" class="plain-text"></textarea>
            </label>
          </div>
          <div class="details-actions">
            <button type="submit">Salvar</button>
            <button type="button" class="cancel-insert-btn">Cancelar</button>
          </div>
        </form>
      </td>
    `;
    tr.className = 'details-row';
    tbody.appendChild(tr);
  }

  localStorage.setItem('tests', JSON.stringify(tests));
  addTableListeners();
}

function formatText(text) {
  if (!text) return '<span style="color:#bbb">-</span>';
  return String(text).replace(/\n/g, '<br>');
}

function statusText(status) {
  return {
    "not-started": "Não iniciado",
    "in-progress": "Em andamento",
    "completed": "Concluído",
    "blocked": "Bloqueado",
    "deferred": "Adiado"
  }[status] || status;
}

function addTableListeners() {
  // Ampliar/Recolher
  document.querySelectorAll('.expand-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.index);
      if (expandedRow === idx) {
        expandedRow = null;
      } else {
        expandedRow = idx;
        editingRow = null;
        isInserting = false;
      }
      renderTable();
    };
  });

  // Editar
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.index);
      editingRow = idx;
      expandedRow = null;
      isInserting = false;
      renderTable();
    };
  });

  // Excluir
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => {
      if (confirm('Excluir este cenário?')) {
        tests.splice(btn.dataset.index, 1);
        if (expandedRow === Number(btn.dataset.index)) expandedRow = null;
        if (editingRow === Number(btn.dataset.index)) editingRow = null;
        renderTable();
      }
    };
  });

  // Duplicar
  document.querySelectorAll('.duplicate-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = btn.dataset.index;
      const original = tests[idx];
      const copy = JSON.parse(JSON.stringify(original));
      copy.id = getNextTestId();
      tests.splice(Number(idx) + 1, 0, copy);
      renderTable();
    };
  });

  // Edição inline
  document.querySelectorAll('.inline-edit-form').forEach(form => {
    form.onsubmit = function(e) {
      e.preventDefault();
      const idx = Number(form.dataset.index);
      tests[idx] = {
        id: form.id.value,
        step: form.step.value,
        description: form.description.value,
        type: form.type.value,
        priority: form.priority.value,
        status: form.status.value,
        assignee: form.assignee.value,
        prereq: form.prereq.value,
        sapAction: form.sapAction.value,
        sapExpected: form.sapExpected.value,
        apiValidation: form.apiValidation.value,
        apiExpected: form.apiExpected.value,
        moreDetails: form.moreDetails.value
      };
      editingRow = null;
      renderTable();
    };
    form.querySelector('.cancel-btn').onclick = function() {
      editingRow = null;
      renderTable();
    };
  });

  // Inserção inline
  document.querySelectorAll('.inline-insert-form').forEach(form => {
    form.onsubmit = function(e) {
      e.preventDefault();
      tests.push({
        id: form.id.value,
        step: form.step.value,
        description: form.description.value,
        type: form.type.value,
        priority: form.priority.value,
        status: form.status.value,
        assignee: form.assignee.value,
        prereq: form.prereq.value,
        sapAction: form.sapAction.value,
        sapExpected: form.sapExpected.value,
        apiValidation: form.apiValidation.value,
        apiExpected: form.apiExpected.value,
        moreDetails: form.moreDetails.value
      });
      isInserting = false;
      renderTable();
    };
    form.querySelector('.cancel-insert-btn').onclick = function() {
      isInserting = false;
      renderTable();
    };
  });
}

document.getElementById('addTest').onclick = () => {
  isInserting = true;
  expandedRow = null;
  editingRow = null;
  renderTable();
};

document.getElementById('export-xlsx').onclick = function() {
  const headers = [
    "ID do Teste", "Etapa do cenário", "Descrição", "Tipo", "Prioridade", "Status", "Responsável",
    "Pré-requisitos", "Ação no SAP Fiori", "Resultado esperado SAP", "Validação na API", "Resultado esperado API", "Mais detalhes"
  ];
  const data = tests.map(test => ({
    "ID do Teste": test.id,
    "Etapa do cenário": test.step,
    "Descrição": test.description,
    "Tipo": test.type === 'positive' ? 'Positivo' : 'Negativo',
    "Prioridade": test.priority,
    "Status": statusText(test.status),
    "Responsável": test.assignee,
    "Pré-requisitos": test.prereq,
    "Ação no SAP Fiori": test.sapAction,
    "Resultado esperado SAP": test.sapExpected,
    "Validação na API": test.apiValidation,
    "Resultado esperado API": test.apiExpected,
    "Mais detalhes": test.moreDetails
  }));
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  ws['!cols'] = headers.map(() => ({ wch: 30 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cenarios");
  XLSX.writeFile(wb, "cenarios.xlsx");
};

renderTable();