// Simple AZ-305 Quiz App
const state = {
  all: [],           // all questions
  filtered: [],      // after search/filter
  mode: "browse",    // "browse" | "exam" | "wrong"
  examSet: [],       // indices for exam
  answers: {},       // {'1': 'A', ...}  // map by qnum (Question # in PDF)
  progress: {},      // {'qid': {'chosen': 'A', 'correct': true}}
  page: 0,
  pageSize: 25,
  query: "",
  topic: "",
  qtype: "",
  dark: false
};

const els = {
  container: document.getElementById('quizContainer'),
  search: document.getElementById('searchInput'),
  topicFilter: document.getElementById('topicFilter'),
  typeFilter: document.getElementById('typeFilter'),
  shuffle: document.getElementById('shuffleBtn'),
  exam: document.getElementById('examModeBtn'),
  wrong: document.getElementById('reviewWrongBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importBtn: document.getElementById('importBtn'),
  darkToggle: document.getElementById('darkToggle'),
  status: document.getElementById('status'),
  modal: document.getElementById('modal'),
  modalText: document.getElementById('modalText'),
  modalConfirm: document.getElementById('modalConfirm'),
  modalTitle: document.getElementById('modalTitle'),
};

function saveLocal() {
  const payload = {
    answers: state.answers,
    progress: state.progress,
    dark: state.dark
  };
  localStorage.setItem('az305_quiz_v1', JSON.stringify(payload));
}
function loadLocal() {
  try {
    const raw = localStorage.getItem('az305_quiz_v1');
    if (!raw) return;
    const data = JSON.parse(raw);
    state.answers = data.answers || {};
    state.progress = data.progress || {};
    state.dark = !!data.dark;
    document.body.classList.toggle('dark', state.dark);
    els.darkToggle.checked = state.dark;
  } catch {}
}

// Simple search/filter
function filterAll() {
  const q = state.query.toLowerCase().trim();
  state.filtered = state.all.filter(x => {
    const topicOk = !state.topic || x.topic === state.topic;
    const typeOk = !state.qtype || x.type === state.qtype;
    if (!q) return topicOk && typeOk;
    const hay = (x.question + " " + (x.options||[]).join(" ")).toLowerCase();
    return hay.includes(q) && topicOk && typeOk;
  });
  render();
}

function shuffle(arr) {
  let a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startExam() {
  state.mode = "exam";
  const pool = state.all.map((_, i) => i);
  state.examSet = shuffle(pool).slice(0, 50);
  state.filtered = state.examSet.map(i => state.all[i]);
  state.page = 0;
  render();
}

function reviewWrong() {
  state.mode = "wrong";
  const wrongIds = Object.entries(state.progress).filter(([,v]) => v.correct === false).map(([id]) => Number(id));
  const set = new Set(wrongIds);
  state.filtered = state.all.filter(q => set.has(q.id));
  state.page = 0;
  render();
}

function restoreBrowse() {
  state.mode = "browse";
  filterAll();
}

function render() {
  els.container.innerHTML = "";
  const list = state.filtered;
  const total = list.length;
  els.status.textContent = `共 ${state.all.length} 题 · 当前显示 ${total} 题 · 模式：${state.mode}`;

  list.forEach(q => {
    const card = document.createElement('div');
    card.className = "card";

    const meta = document.createElement('div');
    meta.className = "meta";
    const correctMark = state.progress[q.id]?.correct;
    const markText = correctMark === true ? "✔️" : (correctMark === false ? "❌" : "⏺");
    meta.textContent = `${markText} #${q.qnum} · ${q.topic} · ${q.type === "single_or_multi" ? "选择题" : "热点/拖放/开放题"}`;

    const question = document.createElement('div');
    question.className = "question";
    question.textContent = q.question;

    card.appendChild(meta);
    card.appendChild(question);

    // options
    if (q.options && q.options.length) {
      const box = document.createElement('div');
      box.className = "options";

      q.options.forEach(opt => {
        const el = document.createElement('div');
        el.className = "option";
        el.textContent = opt;
        el.addEventListener('click', () => onChoose(q, opt));
        // pre-color if answered
        const chosen = state.progress[q.id]?.chosen;
        if (chosen) {
          const isCorrect = isCorrectOption(q, opt);
          if (opt.startsWith(chosen)) el.classList.add(isCorrect ? 'correct' : 'wrong');
        }
        box.appendChild(el);
      });

      card.appendChild(box);
    }

    // actions
    const actions = document.createElement('div');
    actions.className = "actions";

    const revealBtn = document.createElement('button');
    revealBtn.textContent = "显示答案";
    revealBtn.addEventListener('click', () => revealAnswer(q, card));
    actions.appendChild(revealBtn);

    const bookmarkBtn = document.createElement('button');
    bookmarkBtn.textContent = "标记错题";
    bookmarkBtn.addEventListener('click', () => {
      state.progress[q.id] = state.progress[q.id] || {};
      state.progress[q.id].correct = false;
      saveLocal();
      render();
    });
    actions.appendChild(bookmarkBtn);

    card.appendChild(actions);

    const explain = document.createElement('div');
    explain.className = "explain";
    if (q.explanation) explain.textContent = q.explanation;
    card.appendChild(explain);

    els.container.appendChild(card);
  });
}

function isCorrectOption(q, optText) {
  const label = optText.slice(0,1); // 'A'
  const key = state.answers[String(q.qnum)];
  if (!key) return false;
  // allow multiple answers like "A,C"
  const ks = key.split(/[\,\s\/\+]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
  return ks.includes(label);
}

function onChoose(q, optText) {
  const label = optText.slice(0,1);
  const correct = isCorrectOption(q, optText);
  state.progress[q.id] = { chosen: label, correct };
  saveLocal();
  render();
}

function revealAnswer(q, card) {
  const key = state.answers[String(q.qnum)];
  const exp = document.createElement('div');
  exp.className = 'explain';
  exp.textContent = key ? `参考答案：${key}` : "尚未导入答案。你可以点击上方“导入答案/进度”导入答案键（按题号）。";
  card.appendChild(exp);
}

// Wire up header controls
els.search.addEventListener('input', (e) => { state.query = e.target.value; filterAll(); });
els.typeFilter.addEventListener('change', (e) => { state.qtype = e.target.value; filterAll(); });
els.shuffle.addEventListener('click', () => { state.filtered = shuffle(state.filtered); render(); });
els.exam.addEventListener('click', startExam);
els.reviewWrongBtn && (els.reviewWrongBtn.onclick = reviewWrong);
els.wrong.addEventListener('click', reviewWrong);
els.exportBtn.addEventListener('click', () => {
  const payload = { answers: state.answers, progress: state.progress };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'az305_progress.json';
  a.click();
  URL.revokeObjectURL(url);
});
els.importBtn.addEventListener('click', () => {
  els.modalTitle.textContent = "导入答案/进度";
  els.modalText.value = "";
  els.modal.showModal();
});
els.modalConfirm.addEventListener('click', () => {
  try {
    const obj = JSON.parse(els.modalText.value);
    if (obj.answers) state.answers = obj.answers;
    if (obj.progress) state.progress = obj.progress;
    saveLocal();
    restoreBrowse();
  } catch (e) { alert("JSON 解析失败"); }
});
els.darkToggle.addEventListener('change', (e) => {
  state.dark = !!e.target.checked;
  document.body.classList.toggle('dark', state.dark);
  saveLocal();
});

async function init() {
  loadLocal();
  const res = await fetch('questions.json');
  const data = await res.json();
  state.all = data.questions;
  state.filtered = data.questions;

  // Build topic filter
  const topics = Array.from(new Set(state.all.map(x => x.topic))).sort((a,b)=>{
    const na = parseInt(a.replace(/\D/g,'')) || 0;
    const nb = parseInt(b.replace(/\D/g,'')) || 0;
    return na - nb;
  });
  els.topicFilter.innerHTML = `<option value="">全部主题</option>` + topics.map(t => `<option value="${t}">${t}</option>`).join('');
  els.topicFilter.addEventListener('change', (e) => { state.topic = e.target.value; filterAll(); });

  render();
}

init();
