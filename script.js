let tests = JSON.parse(localStorage.getItem('tests') || '[]');

function renderTable() {
  const tbody = document.querySelector('#testTable tbody');
  tbody.innerHTML = '';
  tests.forEach((test, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${test.id}</td>
      <td>${test.step}</td>
      <td>${test.description}</td>
      <td>${test.type === 'positive' ? 'Positivo' : 'Negativo'}</td>
      <td>${test.priority}</td>
      <td>${statusText(test.status)}</td>
      <td>${test.assignee}</td>
      <td>
        <button class="details-btn" data-index="${i}">Detalhes</button>
        <button class="edit-btn" data-index="${i}">Editar</button>
        <button class="duplicate-btn" data-index="${i}">Duplicar</button>
        <button class="delete-btn" data-index="${i}">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  localStorage.setItem('tests', JSON.stringify(tests));
  addTableListeners();
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
  document.querySelectorAll('.details-btn').forEach(btn => {
    btn.onclick = () => openModal(btn.dataset.index);
  });
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => openModal(btn.dataset.index);
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => {
      if (confirm('Excluir este cenário?')) {
        tests.splice(btn.dataset.index, 1);
        renderTable();
      }
    };
  });
  document.querySelectorAll('.duplicate-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = btn.dataset.index;
      const original = tests[idx];
      const copy = JSON.parse(JSON.stringify(original));
      copy.id = generateNewId(original.id);
      tests.splice(Number(idx) + 1, 0, copy);
      renderTable();
    };
  });
}

function generateNewId(oldId) {
  const match = oldId.match(/(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const num = parseInt(match[2], 10) + 1;
    let newId = prefix + num;
    let count = 1;
    while (tests.some(t => t.id === newId)) {
      newId = prefix + (num + count);
      count++;
    }
    return newId;
  }
  let newId = oldId + "-copy";
  let count = 1;
  while (tests.some(t => t.id === newId)) {
    newId = oldId + "-copy" + count;
    count++;
  }
  return newId;
}

document.getElementById('addTest').onclick = () => openModal();

function openModal(index = null) {
  document.getElementById('modal').style.display = 'flex';
  if (index !== null) {
    const t = tests[index];
    document.getElementById('modalTitle').innerText = `Detalhes do Teste: ${t.id}`;
    document.getElementById('testIndex').value = index;
    document.getElementById('testId').value = t.id;
    document.getElementById('testStep').value = t.step || '';
    document.getElementById('testDescription').value = t.description || '';
    document.getElementById('testType').value = t.type;
    document.getElementById('testPriority').value = t.priority;
    document.getElementById('testStatus').value = t.status;
    document.getElementById('testAssignee').value = t.assignee || '';
    document.getElementById('testPrereq').value = t.prereq || '';
    document.getElementById('testSapAction').value = t.sapAction || '';
    document.getElementById('testSapExpected').value = t.sapExpected || '';
    document.getElementById('testApiValidation').value = t.apiValidation || '';
    document.getElementById('testApiExpected').value = t.apiExpected || '';
    document.getElementById('testMoreDetails').value = t.moreDetails || '';
  } else {
    document.getElementById('modalTitle').innerText = 'Novo Cenário';
    document.getElementById('testForm').reset();
    document.getElementById('testIndex').value = '';
  }
}

// Garante texto puro nos textareas
document.querySelectorAll('textarea.plain-text').forEach(textarea => {
  textarea.addEventListener('paste', function(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, text.replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n'));
  });
});

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

document.getElementById('closeModal').onclick = closeModal;
document.getElementById('cancelModal').onclick = closeModal;

document.getElementById('testForm').onsubmit = function(e) {
  e.preventDefault();
  const getPlain = id => document.getElementById(id).value.replace(/[\u200B-\u200D\uFEFF]/g, '');
  const test = {
    id: document.getElementById('testId').value,
    step: document.getElementById('testStep').value,
    description: document.getElementById('testDescription').value,
    type: document.getElementById('testType').value,
    priority: document.getElementById('testPriority').value,
    status: document.getElementById('testStatus').value,
    assignee: document.getElementById('testAssignee').value,
    prereq: getPlain('testPrereq'),
    sapAction: getPlain('testSapAction'),
    sapExpected: getPlain('testSapExpected'),
    apiValidation: getPlain('testApiValidation'),
    apiExpected: getPlain('testApiExpected'),
    moreDetails: getPlain('testMoreDetails')
  };
  const idx = document.getElementById('testIndex').value;
  if (idx === '') {
    tests.push(test);
  } else {
    tests[idx] = test;
  }
  closeModal();
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

window.onclick = function(event) {
  if (event.target === document.getElementById('modal')) {
    closeModal();
  }
};

renderTable();