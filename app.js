const state = {
  bank: [], mode: "mcq", topic: "all", difficulty: "all",
  current: null, selected: new Set(), submitted: false, queue: [], position: 0,
  stats: { attempted: 0, correct: 0, score: 0 }
};
const $ = (id) => document.getElementById(id);
const letters = ["A","B","C","D","E","F"];

async function loadBank() {
  try {
    const response = await fetch("./questions.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    validateBank(data);
    state.bank = data;
    $("bank-count").textContent = `${data.length.toLocaleString()} questions loaded`;
    $("bank-status").textContent = `Loaded ${data.length} starter questions. This is a working sample bank, not the planned 8,000-question collection.`;
    populateTopics();
    buildQueue();
  } catch (error) {
    $("bank-count").textContent = "Question bank could not load";
    $("question-text").textContent = "Could not load questions.json.";
    $("question-instruction").textContent = "Run this project through VS Code Live Server or publish it to a static host. Opening index.html directly may block data loading.";
    console.error(error);
  }
}
function validateBank(bank) {
  if (!Array.isArray(bank)) throw new Error("questions.json must contain an array.");
  const ids = new Set();
  for (const q of bank) {
    if (!q.id || ids.has(q.id)) throw new Error(`Missing or duplicate question ID: ${q.id || "(empty)"}`);
    ids.add(q.id);
    if (!["mcq","msq","nat"].includes(q.mode)) throw new Error(`Invalid mode in ${q.id}`);
    if (!Array.isArray(q.options) || q.options.length < 2) throw new Error(`Invalid options in ${q.id}`);
    if (!Array.isArray(q.answer) || !q.answer.length || q.answer.some(n => !Number.isInteger(n) || n < 0 || n >= q.options.length)) throw new Error(`Invalid answer key in ${q.id}`);
    if (q.mode !== "msq" && q.answer.length !== 1) throw new Error(`MCQ/NAT must have exactly one answer in ${q.id}`);
    if (!q.explanation || !q.topic || !q.difficulty) throw new Error(`Missing metadata/explanation in ${q.id}`);
  }
}
function filteredQuestions() {
  return state.bank.filter(q => q.mode === state.mode &&
    (state.topic === "all" || q.topic === state.topic) &&
    (state.difficulty === "all" || q.difficulty === state.difficulty));
}
function populateTopics() {
  const topics = [...new Set(state.bank.map(q => q.topic))].sort();
  $("topic-filter").innerHTML = '<option value="all">All topics</option>' + topics.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
}
function buildQueue() {
  state.queue = filteredQuestions().map(q => q.id);
  shuffle(state.queue); state.position = 0; showQuestion();
}
function shuffle(array) {
  for (let i=array.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [array[i],array[j]]=[array[j],array[i]]; }
}
function showQuestion() {
  state.selected.clear(); state.submitted = false;
  const qid = state.queue[state.position];
  state.current = state.bank.find(q => q.id === qid) || null;
  $("feedback").className = "feedback hidden";
  $("submit-btn").classList.remove("hidden"); $("next-btn").classList.add("hidden");
  if (!state.current) {
    $("question-text").textContent = "No questions match these filters.";
    $("question-instruction").textContent = "Choose another topic or difficulty, or switch quiz mode.";
    $("options").innerHTML = ""; $("submit-btn").disabled = true;
    $("q-topic").textContent = "No questions"; $("q-number").textContent = "0 questions";
    $("progress-fill").style.width = "0%"; $("marks-label").textContent = "—";
    return;
  }
  const q = state.current;
  $("q-mode").textContent = q.mode.toUpperCase();
  $("q-topic").textContent = `${q.topic} · ${q.subtopic || "General"}`;
  $("q-difficulty").textContent = q.difficulty;
  $("q-number").textContent = `Question ${state.position+1} of ${state.queue.length}`;
  $("progress-fill").style.width = `${((state.position+1)/state.queue.length)*100}%`;
  $("question-text").textContent = q.question;
  $("question-instruction").textContent = q.mode === "msq" ? "Select all correct options. Exact match required for marks." : "Select one answer.";
  $("marks-label").textContent = q.mode === "mcq" ? `+${q.marks} / −${q.marks===2 ? "⅔" : "⅓"}` : q.mode === "msq" ? `+${q.marks} / 0` : `+${q.marks} / 0`;
  $("options").innerHTML = q.options.map((option,i)=>`<button class="option" data-index="${i}"><span class="option-key">${letters[i] || i+1}</span><span>${escapeHtml(option)}</span></button>`).join("");
  $("options").querySelectorAll(".option").forEach(btn=>btn.addEventListener("click",()=>selectOption(Number(btn.dataset.index))));
  $("submit-btn").disabled = true;
}
function selectOption(index) {
  if (state.submitted) return;
  const q = state.current;
  if (q.mode === "msq") {
    state.selected.has(index) ? state.selected.delete(index) : state.selected.add(index);
  } else {
    state.selected.clear(); state.selected.add(index);
  }
  $("options").querySelectorAll(".option").forEach(btn=>btn.classList.toggle("selected",state.selected.has(Number(btn.dataset.index))));
  $("submit-btn").disabled = state.selected.size === 0;
}
function submitAnswer() {
  if (!state.current || state.submitted || !state.selected.size) return;
  state.submitted = true;
  const q = state.current;
  const chosen = [...state.selected].sort((a,b)=>a-b);
  const answer = [...q.answer].sort((a,b)=>a-b);
  const correct = chosen.length===answer.length && chosen.every((v,i)=>v===answer[i]);
  let awarded = 0;
  if (correct) awarded = q.marks;
  else if (q.mode === "mcq") awarded = -(q.marks===2 ? 2/3 : 1/3);
  state.stats.attempted++;
  if (correct) state.stats.correct++;
  state.stats.score += awarded;
  updateStats();
  $("options").querySelectorAll(".option").forEach((btn,i)=>{
    btn.disabled = true;
    if (q.answer.includes(i)) btn.classList.add("correct");
    else if (state.selected.has(i)) btn.classList.add("incorrect");
  });
  const correctText = q.answer.map(i=>`${letters[i] || i+1}. ${q.options[i]}`).join("; ");
  const reason = correct ? "Correct." : q.mode==="mcq" ? (awarded<0 ? "Incorrect — negative marking applies." : "Incorrect.") : "Not an exact match — no marks awarded.";
  $("feedback").className = `feedback ${correct ? "" : "wrong"}`;
  $("feedback").innerHTML = `<strong>${reason} ${awarded>0?"+":""}${formatScore(awarded)} marks</strong><div><b>Correct answer:</b> ${escapeHtml(correctText)}</div><p>${escapeHtml(q.explanation)}</p>`;
  $("submit-btn").classList.add("hidden"); $("next-btn").classList.remove("hidden");
}
function formatScore(n) { return Number(n.toFixed(2)).toString(); }
function updateStats() {
  $("stat-attempted").textContent = state.stats.attempted;
  $("stat-correct").textContent = state.stats.correct;
  $("stat-accuracy").textContent = `${state.stats.attempted ? Math.round(state.stats.correct/state.stats.attempted*100) : 0}%`;
  $("stat-score").textContent = formatScore(state.stats.score);
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

document.querySelectorAll(".mode-card").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".mode-card").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active"); state.mode=btn.dataset.mode; buildQueue();
}));
$("topic-filter").addEventListener("change",e=>{state.topic=e.target.value;buildQueue();});
$("difficulty-filter").addEventListener("change",e=>{state.difficulty=e.target.value;buildQueue();});
$("shuffle-btn").addEventListener("click",buildQueue);
$("submit-btn").addEventListener("click",submitAnswer);
$("next-btn").addEventListener("click",()=>{
  if (state.position+1 < state.queue.length) state.position++;
  else { shuffle(state.queue); state.position=0; }
  showQuestion();
});
$("reset-stats-btn").addEventListener("click",()=>{
  state.stats={attempted:0,correct:0,score:0};updateStats();
});
$("theme-toggle").addEventListener("click",()=>{
  const dark=document.documentElement.dataset.theme!=="dark";
  document.documentElement.dataset.theme=dark?"dark":"light";
  localStorage.setItem("gg-theme",dark?"dark":"light");
});
document.documentElement.dataset.theme=localStorage.getItem("gg-theme")||"light";
loadBank();
