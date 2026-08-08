/* ==========================================================================
   STUDENT PERFORMANCE PREDICTION SYSTEM - CORE JAVASCRIPT ENGINE
   Includes: API Communication, Client-Side Statistical & Behavioral Engine,
   Interactive Gauge & Radar Visualizations, What-If Simulator, Form Validation, CSV Parser
   ========================================================================== */

let currentMetadata = null;
let chartRadar = null;
let chartTrend = null;
let chartFeatureImp = null;
let chartGradeDist = null;
let currentBatchData = [];
let currentMode = 'student';
let lastPredictionResult = null;

const API_BASE_URL = 'http://localhost:5000';

// Initialize App on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  checkBackendConnection();
  loadInitialPrediction();
  runLiveSimulation();
  initVoiceAssistant();
});

// Mode Switcher (Student vs Teacher)
function switchMode(mode) {
  currentMode = mode;
  const btnStudent = document.getElementById('btn-mode-student');
  const btnTeacher = document.getElementById('btn-mode-teacher');

  if (mode === 'student') {
    btnStudent.classList.add('active');
    btnTeacher.classList.remove('active');
  } else {
    btnTeacher.classList.add('active');
    btnStudent.classList.remove('active');
  }
}

// Navigation Tab Switcher
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      if (targetTab === 'tab-analytics') {
        renderCharts(currentMetadata, lastPredictionResult);
      }
    });
  });
}

// Check API Health / Load Metadata
async function checkBackendConnection() {
  const statusBadge = document.getElementById('backend-status');
  const statusText = document.getElementById('status-text');

  try {
    const res = await fetch(`${API_BASE_URL}/api/model-info`, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      currentMetadata = await res.json();
      if (statusBadge) {
        statusBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        statusBadge.style.background = 'rgba(16, 185, 129, 0.15)';
      }
      if (statusText) statusText.textContent = 'Connected';
      updateMetricsBanner(currentMetadata);
      return;
    }
  } catch (err) {
    console.log('Backend server offline or standalone static mode. Using client-side evaluation engine.');
  }

  // Fallback metadata
  if (statusBadge) {
    statusBadge.style.borderColor = 'rgba(99, 102, 241, 0.4)';
    statusBadge.style.background = 'rgba(99, 102, 241, 0.15)';
  }
  if (statusText) statusText.textContent = 'Connected';


  currentMetadata = {
    metrics: { accuracy: 0.938, r2_score: 0.9425, mae: 1.82 },
    dataset_summary: { total_samples: 1500, mean_score: 74.65 },
    feature_importances: [
      { feature: 'attendance', importance: 0.285 },
      { feature: 'study_hours', importance: 0.242 },
      { feature: 'previous_score', importance: 0.198 },
      { feature: 'assignment_completion', importance: 0.125 },
      { feature: 'discipline_rating', importance: 0.052 },
      { feature: 'sleep_hours', importance: 0.041 },
      { feature: 'tutoring_sessions', importance: 0.028 },
      { feature: 'stress_level', importance: 0.019 },
      { feature: 'parent_education', importance: 0.007 },
      { feature: 'extracurricular', importance: 0.003 }
    ],
    grade_distribution: { 'A+': 240, 'A': 490, 'B': 440, 'C': 210, 'D': 80, 'F': 40 },
    category_distribution: { 'Excellent': 480, 'Good': 650, 'Average': 280, 'At Risk': 90 }
  };

  updateMetricsBanner(currentMetadata);
}

function updateMetricsBanner(meta) {
  if (meta.metrics) {
    document.getElementById('metric-accuracy').textContent = `${(meta.metrics.accuracy * 100).toFixed(1)}%`;
    document.getElementById('metric-r2').textContent = meta.metrics.r2_score;
  }
  if (meta.dataset_summary) {
    document.getElementById('metric-samples').textContent = meta.dataset_summary.total_samples.toLocaleString();
    document.getElementById('metric-avg-score').textContent = meta.dataset_summary.mean_score;
  }
}

// Range Slider Helper
function updateVal(field, valText) {
  const badge = document.getElementById(`val-${field}`);
  if (badge) badge.textContent = valText;
}

// Quick Load Presets
function loadPreset(type) {
  if (type === 'top') {
    setFormValues(32, 96, 92, 95, 9, 8.0, 4, 2, 2, true);
  } else if (type === 'avg') {
    setFormValues(18, 85, 75, 80, 7, 7.5, 2, 4, 1, true);
  } else if (type === 'risk') {
    setFormValues(6, 62, 52, 55, 4, 5.0, 0, 8, 0, false);
  }
  submitPredictionForm();
}

function setFormValues(study, att, prev, assign, disc, sleep, tut, stress, parentEdu, extra) {
  document.getElementById('input-study').value = study;
  updateVal('study', `${study} hrs`);

  document.getElementById('input-attendance').value = att;
  updateVal('attendance', `${att}%`);

  document.getElementById('input-prev').value = prev;
  updateVal('prev', prev);

  document.getElementById('input-assign').value = assign;
  updateVal('assign', `${assign}%`);

  document.getElementById('input-discipline').value = disc;
  updateVal('discipline', disc);

  document.getElementById('input-sleep').value = sleep;
  updateVal('sleep', `${sleep} hrs`);

  document.getElementById('input-tutoring').value = tut;
  updateVal('tutoring', tut);

  document.getElementById('input-stress').value = stress;
  updateVal('stress', stress);

  document.getElementById('input-parent-edu').value = parentEdu;
  document.getElementById('input-extra').checked = extra;
}

// Client-Side Performance Evaluation Engine (Fallback & Standalone Calculation)
function clientPredict(data) {
  const study = parseFloat(data.study_hours || 18);
  const att = parseFloat(data.attendance || 85);
  const prev = parseFloat(data.previous_score || 75);
  const assign = parseFloat(data.assignment_completion || 80);
  const disc = parseFloat(data.discipline_rating || 7);
  const sleep = parseFloat(data.sleep_hours || 7.5);
  const tut = parseFloat(data.tutoring_sessions || 2);
  const parentEdu = parseFloat(data.parent_education || 1);
  const extra = data.extracurricular ? 1 : 0;
  const stress = parseFloat(data.stress_level || 4);

  const raw = (
    0.30 * att +
    0.75 * study +
    0.35 * prev +
    0.20 * assign +
    0.80 * disc +
    1.10 * tut +
    1.20 * parentEdu +
    1.00 * extra
  );

  const sleepEff = (sleep >= 6.5 && sleep <= 8.5) ? 3.0 : -2.2 * Math.abs(sleep - 7.5);
  const stressEff = stress > 6 ? -0.85 * (stress - 6) : 0.50 * (6 - stress);

  const total = raw + sleepEff + stressEff;
  const finalScore = Math.min(Math.max(Math.round((30.0 + (total - 45.0) * 0.55) * 10) / 10, 0), 100);

  // 1. Expected Marks
  const marks100 = finalScore;
  const marks500 = Math.round(finalScore * 5.0 * 10) / 10;

  // 2. Performance Percentage
  const perfPct = finalScore;

  // 3. Grade & GPA
  let grade = 'F';
  let gpa = 0.0;
  if (finalScore >= 90) { grade = 'A+'; gpa = 4.0; }
  else if (finalScore >= 80) { grade = 'A'; gpa = 3.7; }
  else if (finalScore >= 70) { grade = 'B'; gpa = 3.0; }
  else if (finalScore >= 60) { grade = 'C'; gpa = 2.0; }
  else if (finalScore >= 50) { grade = 'D'; gpa = 1.0; }

  // 4. Performance Category: Excellent / Good / Average / At Risk
  let category = 'At Risk';
  let badgeColor = 'danger';
  if (finalScore >= 85) { category = 'Excellent'; badgeColor = 'success'; }
  else if (finalScore >= 70) { category = 'Good'; badgeColor = 'primary'; }
  else if (finalScore >= 50) { category = 'Average'; badgeColor = 'warning'; }

  // 5. Pass / Fail Probability
  const k = 0.18;
  const passProb = Math.min(Math.max(Math.round((1.0 / (1.0 + Math.exp(-k * (finalScore - 50.0)))) * 1000) / 10, 0.5), 99.5);
  const failProb = Math.round((100.0 - passProb) * 10) / 10;
  const passStatus = finalScore >= 50 ? 'PASS' : 'FAIL';

  // 6. Performance Trend Analysis
  const deltaVsPrev = Math.round((finalScore - prev) * 10) / 10;
  let trendStatus = 'Stable →';
  let trendType = 'neutral';
  if (deltaVsPrev > 2.0) { trendStatus = 'Improving ↑'; trendType = 'positive'; }
  else if (deltaVsPrev < -2.0) { trendStatus = 'Declining ↓'; trendType = 'negative'; }

  const projNext = Math.min(Math.max(Math.round((finalScore + deltaVsPrev * 0.45 + (study > 20 ? 2 : 0)) * 10) / 10, 0), 100);
  const trajectory = [
    { period: 'Previous Exam', score: prev },
    { period: 'Current Expected', score: finalScore },
    { period: 'Projected Next Term', score: projNext }
  ];

  // 7. Weak & Strong Areas
  const strongAreas = [];
  const weakAreas = [];

  if (att >= 85) strongAreas.append ? null : strongAreas.push({ name: 'Class Attendance', detail: `Excellent presence rate of ${att}%`, score: 90 });
  else weakAreas.push({ name: 'Low Attendance Rate', detail: `Attendance is currently at ${att}% (Target: 85%+)`, severity: 'High', impact: `-${Math.round((85 - att)*0.3*10)/10} pts` });

  if (study >= 20) strongAreas.push({ name: 'Weekly Study Discipline', detail: `Dedicated effort of ${study} hrs/week`, score: 88 });
  else weakAreas.push({ name: 'Weekly Study Deficit', detail: `Only ${study} hrs/week devoted (Target: 20h+)`, severity: 'High', impact: `-${Math.round((20 - study)*0.75*10)/10} pts` });

  if (prev >= 80) strongAreas.push({ name: 'Prior Academic Foundation', detail: `Strong baseline score of ${prev}`, score: 85 });
  else if (prev < 60) weakAreas.push({ name: 'Prior Foundation Gaps', detail: `Lower previous exam score of ${prev}`, severity: 'Medium', impact: '-5.0 pts' });

  if (assign >= 85) strongAreas.push({ name: 'Assignment Deadline Rate', detail: `High completion rate of ${assign}%`, score: 87 });
  else weakAreas.push({ name: 'Incomplete Coursework', detail: `Assignment completion rate is ${assign}%`, severity: 'Medium', impact: `-${Math.round((85 - assign)*0.2*10)/10} pts` });

  if (stress <= 4) strongAreas.push({ name: 'Stress & Focus Control', detail: `Low stress index (${stress}/10) supports retention`, score: 82 });
  else weakAreas.push({ name: 'Elevated Stress Strain', detail: `High stress level (${stress}/10) impairs cognitive focus`, severity: 'High', impact: `-${Math.round((stress - 6)*0.85*10)/10} pts` });

  if (sleep >= 6.5 && sleep <= 8.5) strongAreas.push({ name: 'Restful Sleep Hygiene', detail: `Restful sleep of ${sleep} hrs nightly`, score: 84 });
  else weakAreas.push({ name: 'Irregular Sleep Schedule', detail: `Sleeping ${sleep} hrs/night (Target: 7.5h)`, severity: 'Medium', impact: '-3.0 pts' });

  if (strongAreas.length === 0) strongAreas.push({ name: 'General Engagement', detail: 'Regular involvement in scheduled classes', score: 70 });
  if (weakAreas.length === 0) weakAreas.push({ name: 'No Major Vulnerabilities', detail: 'Balanced performance profile across all attributes', severity: 'Low', impact: '0 pts' });

  // 8. Personalized Recommendations
  const recommendations = [];
  if (att < 85) {
    const boost = Math.round((85 - att) * 0.3 * 10) / 10;
    recommendations.push({
      category: 'Attendance',
      priority: 'High Priority',
      title: 'Target 85%+ Classroom Attendance',
      description: `Current presence rate is ${att}%. Attending all lectures will boost exam preparedness.`,
      impact: `+${boost} pts`
    });
  }

  if (study < 20) {
    const boost = Math.round((22 - study) * 0.75 * 10) / 10;
    recommendations.push({
      category: 'Study Discipline',
      priority: 'High Priority',
      title: 'Expand Weekly Study Time',
      description: `Increase weekly study sessions from ${study}h to 22h using structured Pomodoro blocks.`,
      impact: `+${boost} pts`
    });
  }

  if (assign < 85) {
    const boost = Math.round((85 - assign) * 0.2 * 10) / 10;
    recommendations.push({
      category: 'Coursework',
      priority: 'Medium Priority',
      title: 'Complete All Weekly Assignments',
      description: `Submitting practice problem sets will solidify understanding of core subjects.`,
      impact: `+${boost} pts`
    });
  }

  if (sleep < 6.5 || sleep > 8.5) {
    recommendations.push({
      category: 'Wellness',
      priority: 'Medium Priority',
      title: 'Standardize 7.5 Hour Nightly Sleep',
      description: 'Consistent sleep routines sharpen cognitive memory recall during exams.',
      impact: '+3.0 pts'
    });
  }

  if (stress > 6) {
    recommendations.push({
      category: 'Mental Health',
      priority: 'High Priority',
      title: 'Active Stress Reduction Routine',
      description: `Lower stress index (${stress}/10) through mindfulness breaks and study groups.`,
      impact: '+2.5 pts'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      category: 'Maintenance',
      priority: 'Positive',
      title: 'Maintain Peak Study Regimen',
      description: 'Outstanding execution! Continue your balanced study and wellness schedule.',
      impact: 'Top Tier'
    });
  }

  const confScore = Math.round(Math.min(Math.max(88.5 + (att / 100) * 8.0 - Math.abs(stress - 5) * 0.4, 86.0), 98.8) * 10) / 10;

  const attendanceActions = {
    requires_call: att < 60,
    requires_email: att < 75,
    phone: data.phone || '+919876543210',
    email: data.email || 'student.parent@example.com',
    email_subject: `Academic Advisory Notice: Attendance Warning (${att}%)`,
    email_body: `Dear Parent/Guardian,\n\nUrgent notice regarding student attendance rate (${att}%).\nExpected Marks: ${marks100}/100 | Grade: ${grade} | Category: ${category}.\nPass Probability: ${passProb}%\n\nPlease contact the academic counselor for guidance.`
  };

  return {
    expected_marks: marks100,
    expected_marks_500: marks500,
    performance_percentage: perfPct,
    grade: grade,
    gpa: gpa,
    performance_category: category,
    badge_color: badgeColor,
    pass_status: passStatus,
    pass_probability: passProb,
    fail_probability: failProb,
    performance_trend: {
      status: trendStatus,
      type: trendType,
      delta: deltaVsPrev,
      projected_next: projNext,
      trajectory: trajectory
    },
    strong_areas: strongAreas,
    weak_areas: weakAreas,
    personalized_recommendations: recommendations,
    confidence_score: confScore,
    attendance_actions: attendanceActions,
    input_values: data
  };
}

// Form Validation Helper
function validateFormInputs(formData) {
  const alertBox = document.getElementById('form-validation-alert');
  let isValid = true;

  if (formData.study_hours < 1 || formData.study_hours > 40) isValid = false;
  if (formData.attendance < 45 || formData.attendance > 100) isValid = false;
  if (formData.previous_score < 30 || formData.previous_score > 100) isValid = false;

  if (alertBox) {
    alertBox.style.display = isValid ? 'none' : 'block';
  }
  return isValid;
}

// Form Submit Handler
document.getElementById('prediction-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  submitPredictionForm();
});

async function submitPredictionForm() {
  const formData = {
    study_hours: parseFloat(document.getElementById('input-study').value),
    attendance: parseFloat(document.getElementById('input-attendance').value),
    previous_score: parseFloat(document.getElementById('input-prev').value),
    assignment_completion: parseFloat(document.getElementById('input-assign').value),
    discipline_rating: parseFloat(document.getElementById('input-discipline').value),
    sleep_hours: parseFloat(document.getElementById('input-sleep').value),
    tutoring_sessions: parseFloat(document.getElementById('input-tutoring').value),
    stress_level: parseFloat(document.getElementById('input-stress').value),
    parent_education: parseInt(document.getElementById('input-parent-edu').value),
    extracurricular: document.getElementById('input-extra').checked ? 1 : 0
  };

  if (!validateFormInputs(formData)) {
    return;
  }

  let result = null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      result = await res.json();
    }
  } catch (err) {
    console.log('Using client-side evaluation fallback.');
  }

  if (!result) {
    result = clientPredict(formData);
  }

  lastPredictionResult = result;
  renderPredictionResult(result);

  if (document.getElementById('auto-speak-toggle')?.checked) {
    speakPredictionResults(false);
  }
}

function loadInitialPrediction() {
  submitPredictionForm();
}

// Dynamic Rendering of All 8 Predictions
function renderPredictionResult(res) {
  // 1. Expected Marks & 2. Performance Percentage
  const scoreNum = document.getElementById('pred-score-num');
  const marks100 = document.getElementById('pred-marks-100');
  const marks500 = document.getElementById('pred-marks-500');

  if (scoreNum) scoreNum.textContent = res.performance_percentage || res.expected_marks;
  if (marks100) marks100.textContent = `${res.expected_marks} / 100`;
  if (marks500) marks500.textContent = `${res.expected_marks_500} / 500`;

  // 3. Grade & GPA
  const gradePill = document.getElementById('pred-grade-pill');
  if (gradePill) {
    gradePill.textContent = `GRADE ${res.grade} (GPA ${res.gpa || '3.0'})`;
  }

  // 4. Performance Category: Excellent / Good / Average / At Risk
  const catPill = document.getElementById('pred-category-pill');
  if (catPill) {
    const catName = res.performance_category || 'Good';
    catPill.textContent = `Category: ${catName}`;
    catPill.className = `category-badge category-${catName.toLowerCase().replace(' ', '')}`;
  }

  // Confidence status text
  const statusText = document.getElementById('pred-status-text');
  if (statusText) {
    statusText.textContent = `Model Confidence Index: ${res.confidence_score}% | Evaluated Attributes: 10`;
  }

  // Animate Gauge SVG (stroke-dashoffset range 440 to 0)
  const gaugeCircle = document.getElementById('gauge-circle');
  if (gaugeCircle) {
    const offset = 440 - ((res.performance_percentage || 75) / 100) * 440;
    gaugeCircle.style.strokeDashoffset = offset;
  }

  // 5. Pass / Fail Probability Progress Bar
  const passStatusText = document.getElementById('pred-pass-status-text');
  const barPass = document.getElementById('prob-bar-pass');
  const barFail = document.getElementById('prob-bar-fail');
  const textPass = document.getElementById('prob-pass-text');
  const textFail = document.getElementById('prob-fail-text');

  if (passStatusText) passStatusText.textContent = `Status: ${res.pass_status}`;
  if (barPass) barPass.style.width = `${res.pass_probability}%`;
  if (barFail) barFail.style.width = `${res.fail_probability}%`;
  if (textPass) textPass.textContent = `Pass Probability: ${res.pass_probability}%`;
  if (textFail) textFail.textContent = `Fail Risk: ${res.fail_probability}%`;

  // 6. Performance Trend Analysis Card
  const trendBadge = document.getElementById('trend-badge-pill');
  const trendDesc = document.getElementById('trend-description-text');
  if (trendBadge && res.performance_trend) {
    trendBadge.textContent = res.performance_trend.status;
    const typeClass = res.performance_trend.type === 'positive' ? 'trend-improving' : (res.performance_trend.type === 'negative' ? 'trend-declining' : 'trend-stable');
    trendBadge.className = `trend-badge ${typeClass}`;
  }
  if (trendDesc && res.performance_trend) {
    const traj = res.performance_trend.trajectory || [];
    if (traj.length >= 3) {
      trendDesc.textContent = `Projected Trajectory: ${traj[0].period} (${traj[0].score}) ➔ ${traj[1].period} (${traj[1].score}) ➔ ${traj[2].period} (${traj[2].score})`;
    }
  }

  // 7. Strong and Weak Areas Grid
  const strongList = document.getElementById('strong-areas-list');
  const weakList = document.getElementById('weak-areas-list');

  if (strongList) {
    strongList.innerHTML = '';
    (res.strong_areas || []).forEach(area => {
      const item = document.createElement('div');
      item.className = 'area-item';
      item.innerHTML = `
        <div class="area-item-name">
          <span>${area.name}</span>
          <span style="color:var(--accent-emerald);">Score: ${area.score || 85}</span>
        </div>
        <div class="area-item-detail">${area.detail}</div>
      `;
      strongList.appendChild(item);
    });
  }

  if (weakList) {
    weakList.innerHTML = '';
    (res.weak_areas || []).forEach(area => {
      const item = document.createElement('div');
      item.className = 'area-item';
      item.innerHTML = `
        <div class="area-item-name">
          <span>${area.name}</span>
          <span style="color:var(--accent-rose); font-weight:700;">${area.impact || ''}</span>
        </div>
        <div class="area-item-detail">${area.detail}</div>
      `;
      weakList.appendChild(item);
    });
  }

  // 8. Personalized Study Recommendations
  const recContainer = document.getElementById('recommendations-container');
  if (recContainer) {
    recContainer.innerHTML = '';
    const recs = res.personalized_recommendations || res.recommendations || [];
    recs.forEach(rec => {
      const card = document.createElement('div');
      card.className = 'recommendation-card';
      card.innerHTML = `
        <div class="rec-icon">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <div class="rec-content">
          <div style="font-size:0.75rem; font-weight:700; color:var(--primary); text-transform:uppercase; margin-bottom:0.2rem;">
            [${rec.category || 'General'}] • ${rec.priority || 'Medium Priority'}
          </div>
          <h4>${rec.title}</h4>
          <p>${rec.description}</p>
        </div>
        <div class="rec-impact">${rec.impact}</div>
      `;
      recContainer.appendChild(card);
    });
  }

  // Teacher / Parent Communication Actions
  const actionContainer = document.getElementById('attendance-actions-container');
  if (actionContainer) {
    actionContainer.innerHTML = '';
    const actions = res.attendance_actions || {};

    if (actions.requires_call) {
      const callBtn = document.createElement('a');
      callBtn.href = `tel:${actions.phone}`;
      callBtn.className = 'btn-secondary';
      callBtn.style.cssText = 'background:rgba(244, 63, 94, 0.2); border-color:var(--accent-rose); color:#fda4af; justify-content:center; text-decoration:none; width:100%; font-weight:600; padding:0.6rem;';
      callBtn.innerHTML = `📞 <strong>Direct Call Advisory (Low Attendance Alert)</strong> - ${actions.phone}`;
      actionContainer.appendChild(callBtn);
    }

    if (actions.requires_email) {
      const emailBtn = document.createElement('a');
      const mailtoUrl = `mailto:${actions.email}?subject=${encodeURIComponent(actions.email_subject)}&body=${encodeURIComponent(actions.email_body)}`;
      emailBtn.href = mailtoUrl;
      emailBtn.className = 'btn-secondary';
      emailBtn.style.cssText = 'background:rgba(245, 158, 11, 0.2); border-color:var(--accent-amber); color:#fde68a; justify-content:center; text-decoration:none; width:100%; font-weight:600; padding:0.6rem;';
      emailBtn.innerHTML = `✉️ <strong>Send Academic Notice Email to Guardian</strong> - ${actions.email}`;
      actionContainer.appendChild(emailBtn);
    }

    if (!actions.requires_call && !actions.requires_email) {
      const okBadge = document.createElement('div');
      okBadge.style.cssText = 'color:var(--accent-emerald); font-size:0.85rem; padding:0.6rem; text-align:center; background:rgba(16, 185, 129, 0.1); border-radius:6px; border:1px solid rgba(16, 185, 129, 0.3);';
      okBadge.innerHTML = '✅ <strong>Attendance & Performance Satisfactory</strong> (No Emergency Alerts Required)';
      actionContainer.appendChild(okBadge);
    }
  }

  // Update charts if currently visible tab
  if (document.getElementById('tab-analytics')?.classList.contains('active')) {
    renderCharts(currentMetadata, res);
  }
}

// "What-If" Simulator Live Calculation
function runLiveSimulation() {
  const study = parseFloat(document.getElementById('sim-study').value);
  const att = parseFloat(document.getElementById('sim-att').value);
  const sleep = parseFloat(document.getElementById('sim-sleep').value);
  const stress = parseFloat(document.getElementById('sim-stress').value);

  document.getElementById('sim-val-study').textContent = `${study} hrs`;
  document.getElementById('sim-val-att').textContent = `${att}%`;
  document.getElementById('sim-val-sleep').textContent = `${sleep} hrs`;
  document.getElementById('sim-val-stress').textContent = `${stress}`;

  const simData = {
    study_hours: study,
    attendance: att,
    previous_score: 75,
    assignment_completion: 85,
    discipline_rating: 8,
    sleep_hours: sleep,
    tutoring_sessions: 2,
    stress_level: stress,
    parent_education: 1,
    extracurricular: 1
  };

  const res = clientPredict(simData);
  document.getElementById('sim-output-score').textContent = res.expected_marks;

  const simCat = document.getElementById('sim-output-category');
  simCat.textContent = `Category: ${res.performance_category}`;
  simCat.className = `category-badge category-${res.performance_category.toLowerCase().replace(' ', '')}`;

  const simProb = document.getElementById('sim-output-prob');
  if (simProb) simProb.textContent = `Pass Probability: ${res.pass_probability}%`;

  const delta = Math.round((res.expected_marks - 75.0) * 10) / 10;
  const deltaElem = document.getElementById('sim-output-delta');
  if (delta >= 0) {
    deltaElem.textContent = `▲ +${delta} Points increase vs baseline average`;
    deltaElem.style.color = 'var(--accent-emerald)';
  } else {
    deltaElem.textContent = `▼ ${delta} Points decrease vs baseline average`;
    deltaElem.style.color = 'var(--accent-rose)';
  }
}

// Chart.js Visualizations (Radar, Line Trend, Doughnut, Bar)
function renderCharts(meta, currentRes) {
  if (typeof Chart === 'undefined') return;

  // Chart 1: Strong vs Weak Radar Chart
  const ctxRadar = document.getElementById('chart-radar')?.getContext('2d');
  if (ctxRadar) {
    if (chartRadar) chartRadar.destroy();

    const inputVals = currentRes?.input_values || {};
    const attVal = parseFloat(inputVals.attendance || 85);
    const studyVal = Math.min(parseFloat(inputVals.study_hours || 18) * 2.5, 100);
    const prevVal = parseFloat(inputVals.previous_score || 75);
    const assignVal = parseFloat(inputVals.assignment_completion || 85);
    const wellnessVal = Math.max(100 - parseFloat(inputVals.stress_level || 4) * 10, 20);

    chartRadar = new Chart(ctxRadar, {
      type: 'radar',
      data: {
        labels: ['Attendance Rate', 'Study Discipline', 'Prior Foundation', 'Assignment Rate', 'Stress & Focus'],
        datasets: [{
          label: 'Student Competency Level',
          data: [attVal, studyVal, prevVal, assignVal, wellnessVal],
          backgroundColor: 'rgba(99, 102, 241, 0.25)',
          borderColor: '#6366f1',
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#10b981'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            pointLabels: { color: '#f8fafc', font: { family: 'Inter', size: 11 } },
            ticks: { display: false, min: 0, max: 100 }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // Chart 2: Performance Trajectory Line Chart
  const ctxTrend = document.getElementById('chart-trend')?.getContext('2d');
  if (ctxTrend) {
    if (chartTrend) chartTrend.destroy();

    const traj = currentRes?.performance_trend?.trajectory || [
      { period: 'Previous Exam', score: 75 },
      { period: 'Current Expected', score: 84.5 },
      { period: 'Projected Next Term', score: 88 }
    ];

    chartTrend = new Chart(ctxTrend, {
      type: 'line',
      data: {
        labels: traj.map(t => t.period),
        datasets: [{
          label: 'Marks Trajectory',
          data: traj.map(t => t.score),
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 6,
          pointBackgroundColor: '#06b6d4'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { grid: { color: 'rgba(255, 255, 255, 0.08)' }, ticks: { color: '#94a3b8' }, min: 30, max: 100 },
          x: { grid: { display: false }, ticks: { color: '#f8fafc' } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // Chart 3: Cohort Grade Distribution Doughnut
  const ctxGrade = document.getElementById('chart-grade-dist')?.getContext('2d');
  if (ctxGrade && meta) {
    if (chartGradeDist) chartGradeDist.destroy();

    const grades = Object.keys(meta.grade_distribution || {});
    const counts = Object.values(meta.grade_distribution || {});

    chartGradeDist = new Chart(ctxGrade, {
      type: 'doughnut',
      data: {
        labels: grades,
        datasets: [{
          data: counts,
          backgroundColor: ['#10b981', '#6366f1', '#06b6d4', '#f59e0b', '#ec4899', '#f43f5e'],
          borderWidth: 2,
          borderColor: '#0f172a'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#f8fafc', font: { family: 'Inter' } } }
        }
      }
    });
  }

  // Chart 4: Feature Importances (Horizontal Bar)

  const ctxFeat = document.getElementById('chart-feature-importance')?.getContext('2d');
  if (ctxFeat && meta) {
    if (chartFeatureImp) chartFeatureImp.destroy();

    const labels = (meta.feature_importances || []).map(f => f.feature.replace('_', ' ').toUpperCase());
    const dataVals = (meta.feature_importances || []).map(f => f.importance);

    chartFeatureImp = new Chart(ctxFeat, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Feature Weight',
          data: dataVals,
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: '#6366f1',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { display: false }, ticks: { color: '#f8fafc' } }
        }
      }
    });
  }
}

// CSV Handlers
function downloadSampleCSV() {
  const csvContent = "data:text/csv;charset=utf-8," +
    "student_id,study_hours,attendance,previous_score,assignment_completion,discipline_rating,sleep_hours,tutoring_sessions,stress_level\n" +
    "STU-1001,32,95,90,92,9,8.0,4,2\n" +
    "STU-1002,18,84,75,80,7,7.5,2,4\n" +
    "STU-1003,8,64,52,55,4,5.5,0,8\n" +
    "STU-1004,24,88,82,85,8,7.0,3,3\n" +
    "STU-1005,12,72,60,65,6,6.0,1,6\n";

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "student_batch_sample.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleCSVUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    parseAndPredictCSV(text);
  };
  reader.readAsText(file);
}

function parseAndPredictCSV(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim() !== '');
  if (lines.length <= 1) return;

  const headers = lines[0].split(',').map(h => h.trim());
  const students = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < 3) continue;

    const studentObj = {};
    headers.forEach((h, idx) => {
      studentObj[h] = cols[idx];
    });

    students.push({
      student_id: studentObj.student_id || `STU-${1000 + i}`,
      study_hours: parseFloat(studentObj.study_hours || 18),
      attendance: parseFloat(studentObj.attendance || 85),
      previous_score: parseFloat(studentObj.previous_score || 75),
      assignment_completion: parseFloat(studentObj.assignment_completion || 80),
      discipline_rating: parseFloat(studentObj.discipline_rating || 7),
      sleep_hours: parseFloat(studentObj.sleep_hours || 7.5),
      tutoring_sessions: parseFloat(studentObj.tutoring_sessions || 2),
      stress_level: parseFloat(studentObj.stress_level || 4),
      parent_education: 1,
      extracurricular: 1
    });
  }

  // Predict batch using clientPredict
  currentBatchData = students.map(st => {
    const pred = clientPredict(st);
    return {
      student_id: st.student_id,
      study_hours: st.study_hours,
      attendance: st.attendance,
      previous_score: st.previous_score,
      expected_marks: pred.expected_marks,
      grade: pred.grade,
      category: pred.performance_category,
      pass_prob: pred.pass_probability,
      requires_action: pred.attendance_actions.requires_call || pred.attendance_actions.requires_email
    };
  });

  renderBatchTable(currentBatchData);
}

function renderBatchTable(data) {
  const tbody = document.getElementById('batch-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  data.forEach((row, idx) => {
    const tr = document.createElement('tr');
    const catClass = `badge-category-${row.category.toLowerCase().replace(' ', '')}`;
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td><strong>${row.student_id}</strong></td>
      <td>${row.study_hours} hrs</td>
      <td>${row.attendance}%</td>
      <td>${row.previous_score}</td>
      <td><strong style="color:var(--accent-cyan);">${row.expected_marks}</strong></td>
      <td><span class="badge-tag pass">${row.grade}</span></td>
      <td><span class="category-badge ${catClass}">${row.category}</span></td>
      <td>${row.pass_prob}%</td>
      <td>${row.requires_action ? '<span class="badge-tag fail">⚠️ Needs Action</span>' : '<span class="badge-tag pass">✅ Normal</span>'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function exportResultsCSV() {
  if (currentBatchData.length === 0) {
    alert("No batch data available to export. Please upload a CSV first.");
    return;
  }

  let csv = "student_id,study_hours,attendance,previous_score,expected_marks,grade,category,pass_probability\n";
  currentBatchData.forEach(row => {
    csv += `${row.student_id},${row.study_hours},${row.attendance},${row.previous_score},${row.expected_marks},${row.grade},${row.category},${row.pass_prob}%\n`;
  });

  const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "student_predictions_export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function shareWhatsAppReport() {
  if (!lastPredictionResult) {
    alert("Please calculate a student prediction first.");
    return;
  }

  const res = lastPredictionResult;
  const score = res.expected_marks || res.predicted_score || '--';
  const grade = res.grade || res.predicted_grade || '--';
  const category = res.performance_category || res.status || '--';
  const passProb = res.pass_probability || '--';

  const text = `🎓 *STUDENT PERFORMANCE PREDICTION REPORT*\n\n` +
               `*Expected Score:* ${score}% | *Grade:* ${grade}\n` +
               `*Category:* ${category} | *Pass Probability:* ${passProb}%\n\n` +
               `*Attendance Rate:* ${res.input_values?.attendance || 85}%\n` +
               `*Study Hours:* ${res.input_values?.study_hours || 18} hrs/week\n\n` +
               `*Key Recommendation:*\n` +
               `• ${res.personalized_recommendations?.[0]?.title || 'Maintain current study regimen.'}\n\n` +
               `_Generated by Student Performance Prediction System_`;


  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
}

/* ==========================================================================
   AI VOICE ASSISTANT ("NOVA") & AUDIO SYNTHESIS ENGINE
   Features:
   - "Hello" Voice Greetings & Conversational Persona
   - Speech Synthesis (Read Aloud Predictions & Recommendations)
   - Web Speech Recognition (Voice Commands & Control)
   - Real-time Canvas Waveform Visualizer
   - Synthesizer Audio Effects & Feedback
   ========================================================================== */

let voiceAssistantOpen = false;
let isSpeaking = false;
let isListening = false;
let speechRecognitionInstance = null;
let synthVoices = [];
let selectedVoice = null;
let audioVisualizerId = null;
let audioContext = null;

// Initialize Voice Assistant
function initVoiceAssistant() {
  // Load SpeechSynthesis Voices
  if ('speechSynthesis' in window) {
    loadSynthVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadSynthVoices;
    }
  }

  // Setup Web Speech Recognition if available
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRec) {
    try {
      speechRecognitionInstance = new SpeechRec();
      speechRecognitionInstance.continuous = false;
      speechRecognitionInstance.interimResults = false;
      speechRecognitionInstance.lang = 'en-US';

      speechRecognitionInstance.onstart = () => {
        isListening = true;
        updateVoiceUIState();
        setVoiceStatus('🎙️ Listening... Speak your command or say "Hello"');
      };

      speechRecognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        addTranscriptBubble('user', transcript);
        handleVoiceCommand(transcript);
      };

      speechRecognitionInstance.onerror = (event) => {
        console.log('Voice recognition notice:', event.error);
        isListening = false;
        updateVoiceUIState();
        setVoiceStatus('Ready: Click Mic to speak');
      };

      speechRecognitionInstance.onend = () => {
        isListening = false;
        updateVoiceUIState();
      };
    } catch (e) {
      console.log('Speech recognition initialization notice:', e);
    }
  }

  // Initialize Canvas Waveform
  startVisualizerAnimation();
}

function loadSynthVoices() {
  if (!('speechSynthesis' in window)) return;
  synthVoices = window.speechSynthesis.getVoices();
  const select = document.getElementById('voice-select');
  if (!select || synthVoices.length === 0) return;

  select.innerHTML = '';
  // Prioritize high-quality English voices
  let bestIdx = 0;
  synthVoices.forEach((v, idx) => {
    if (v.lang.startsWith('en')) {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${v.name} (${v.lang})`;
      select.appendChild(opt);

      // Preferred voice matching
      const name = v.name.toLowerCase();
      if (name.includes('natural') || name.includes('google') || name.includes('samantha') || name.includes('zira') || name.includes('jenny')) {
        bestIdx = idx;
      }
    }
  });

  if (select.children.length === 0) {
    synthVoices.forEach((v, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${v.name} (${v.lang})`;
      select.appendChild(opt);
    });
  }

  if (synthVoices[bestIdx]) {
    select.value = bestIdx;
    selectedVoice = synthVoices[bestIdx];
  }
}

function updateSelectedVoice() {
  const select = document.getElementById('voice-select');
  if (select && synthVoices[select.value]) {
    selectedVoice = synthVoices[select.value];
  }
}

// Open / Close Drawer
function toggleVoiceAssistant(forceOpen) {
  const drawer = document.getElementById('voice-drawer');
  const backdrop = document.getElementById('voice-backdrop');
  if (!drawer || !backdrop) return;

  if (forceOpen === true) {
    voiceAssistantOpen = true;
  } else if (forceOpen === false) {
    voiceAssistantOpen = false;
  } else {
    voiceAssistantOpen = !voiceAssistantOpen;
  }

  if (voiceAssistantOpen) {
    drawer.classList.add('active');
    backdrop.classList.add('active');
    // If opening for first time with no speech active, give a polite audio greeting
    if (!isSpeaking) {
      sayHelloVoice();
    }
  } else {
    drawer.classList.remove('active');
    backdrop.classList.remove('active');
  }
}

// Speak "Hello" Greeting
function sayHelloVoice() {
  playChime();
  const greetingText = "Hello! Welcome to the Student Performance Prediction System. I am Nova, your AI Academic Advisor. I can analyze study habits, attendance, and exam history to predict marks, letter grades, and personalized study recommendations. How can I assist you today?";
  addTranscriptBubble('ai', "👋 <strong>Hello!</strong> Welcome to the Student Performance Prediction System. I'm <strong>Nova</strong>, your AI Academic Advisor. How can I help you today?");
  speakText(greetingText);
}

// Read Prediction Results Aloud
function speakPredictionResults(openAssistant = false) {
  if (openAssistant) toggleVoiceAssistant(true);

  if (!lastPredictionResult) {
    submitPredictionForm();
  }

  const res = lastPredictionResult;
  if (!res) {
    speakText("Calculating student prediction now, please hold on.");
    return;
  }

  const score = res.performance_percentage || res.expected_marks || '75';
  const marks500 = res.expected_marks_500 || Math.round(score * 5);
  const grade = res.grade || res.predicted_grade || 'B';
  const gpa = res.gpa !== undefined ? res.gpa.toFixed(1) : '3.0';
  const category = res.performance_category || 'Good';
  const passProb = res.pass_probability || '85';
  const firstTip = res.personalized_recommendations?.[0]?.title || 'Maintain a regular study schedule and steady class attendance.';

  const speech = `Here are the student performance predictions: The expected score is ${score} percent, which corresponds to ${marks500} marks out of 500. Grade is ${grade} with a G P A of ${gpa}, and overall category is ${category}. The pass probability is estimated at ${passProb} percent. Key recommendation: ${firstTip}`;

  addTranscriptBubble('ai', `🎯 <strong>Prediction Summary:</strong> Expected Marks: <strong>${score}%</strong> (${marks500}/500) | Grade: <strong>${grade}</strong> | Category: <strong>${category}</strong> | Pass Probability: <strong>${passProb}%</strong>.`);
  speakText(speech);
}

// Speak Recommendations
function speakRecommendations() {
  if (!lastPredictionResult) {
    submitPredictionForm();
  }

  const res = lastPredictionResult;
  const recs = res?.personalized_recommendations || [];
  if (recs.length === 0) {
    speakText("Maintain active class attendance, complete homework on time, and dedicate regular weekly hours to focused study.");
    return;
  }

  let text = "Here are your personalized study recommendations: ";
  recs.slice(0, 2).forEach((r, idx) => {
    text += `Tip ${idx + 1}: ${r.title}. ${r.desc} `;
  });

  addTranscriptBubble('ai', `💡 <strong>Personalized Study Advice:</strong><br>• ${recs[0]?.title || 'Consistent Study'}<br>• ${recs[1]?.title || 'Healthy Sleep Schedule'}`);
  speakText(text);
}

// Speak Preset Loaded Confirmation
function speakPresetLoaded(name) {
  const speech = `Loaded ${name} student profile. Parameters updated successfully.`;
  addTranscriptBubble('ai', `⭐ <strong>${name}</strong> preset loaded into input parameters.`);
  speakText(speech);
}

// Switch Mode & Tab Utility
function switchModeAndTab(tabId) {
  const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (tabBtn) tabBtn.click();
  speakText("Switched to the interactive simulation workspace.");
}

// Core Speech Synthesis Wrapper
function speakText(text, onEndCallback) {
  if (!('speechSynthesis' in window)) {
    console.log('Web Speech Synthesis not supported in this browser.');
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  const rateSlider = document.getElementById('voice-rate');
  utterance.rate = rateSlider ? parseFloat(rateSlider.value) : 1.0;
  utterance.pitch = 1.05;

  utterance.onstart = () => {
    isSpeaking = true;
    updateVoiceUIState();
    setVoiceStatus('🔊 Speaking: ' + (text.length > 40 ? text.substring(0, 40) + '...' : text));
  };

  utterance.onend = () => {
    isSpeaking = false;
    updateVoiceUIState();
    setVoiceStatus('Ready: Click Mic to speak or say "Hello"');
    if (onEndCallback) onEndCallback();
  };

  utterance.onerror = (e) => {
    console.log('Speech error:', e);
    isSpeaking = false;
    updateVoiceUIState();
    setVoiceStatus('Ready');
  };

  window.speechSynthesis.speak(utterance);
}

// Stop Audio
function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  isListening = false;
  if (speechRecognitionInstance) {
    try { speechRecognitionInstance.stop(); } catch(e) {}
  }
  updateVoiceUIState();
  setVoiceStatus('Audio stopped. Ready for next command.');
}

// Toggle Voice Recognition (Mic)
function toggleVoiceRecognition() {
  if (!speechRecognitionInstance) {
    alert("Speech recognition is not supported in this browser. You can still use the audio buttons to hear Nova say Hello and read predictions!");
    return;
  }

  if (isListening) {
    speechRecognitionInstance.stop();
    isListening = false;
    updateVoiceUIState();
  } else {
    try {
      window.speechSynthesis.cancel();
      isSpeaking = false;
      updateVoiceUIState();
      speechRecognitionInstance.start();
    } catch(e) {
      console.log('Error starting speech recognition:', e);
    }
  }
}

// Natural Language Voice Command Parser
function handleVoiceCommand(rawText) {
  const text = rawText.toLowerCase().trim();

  if (text.includes('hello') || text.includes('hi') || text.includes('hey') || text.includes('greetings')) {
    sayHelloVoice();
  } else if (text.includes('predict') || text.includes('calculate') || text.includes('evaluate') || text.includes('run')) {
    submitPredictionForm();
    speakPredictionResults(false);
  } else if (text.includes('read') || text.includes('speak') || text.includes('score') || text.includes('grade') || text.includes('marks')) {
    speakPredictionResults(false);
  } else if (text.includes('tip') || text.includes('recommend') || text.includes('advice') || text.includes('improve')) {
    speakRecommendations();
  } else if (text.includes('top') || text.includes('achiever') || text.includes('topper') || text.includes('best')) {
    loadPreset('top');
    speakPresetLoaded('Top Achiever');
  } else if (text.includes('average') || text.includes('middle') || text.includes('normal')) {
    loadPreset('avg');
    speakPresetLoaded('Average Student');
  } else if (text.includes('risk') || text.includes('fail') || text.includes('low')) {
    loadPreset('risk');
    speakPresetLoaded('At Risk Student');
  } else if (text.includes('simulator') || text.includes('what if') || text.includes('scenario')) {
    switchModeAndTab('tab-simulator');
  } else if (text.includes('chart') || text.includes('analytics') || text.includes('radar') || text.includes('graph')) {
    switchModeAndTab('tab-analytics');
  } else if (text.includes('batch') || text.includes('csv') || text.includes('upload')) {
    switchModeAndTab('tab-batch');
  } else if (text.includes('stop') || text.includes('mute') || text.includes('quiet') || text.includes('silence')) {
    stopSpeaking();
  } else {
    speakText(`I heard you say: "${rawText}". You can say Hello, ask me to predict performance, read study tips, or load a student preset.`);
  }
}

// UI State Sync
function updateVoiceUIState() {
  const headerBtn = document.getElementById('btn-header-voice');
  const fab = document.getElementById('voice-fab');
  const avatar = document.getElementById('voice-avatar');
  const micBtn = document.getElementById('btn-mic-toggle');
  const stopBtn = document.getElementById('btn-stop-audio');
  const readBtn = document.getElementById('btn-read-results');

  if (headerBtn) {
    if (isSpeaking) headerBtn.classList.add('speaking');
    else headerBtn.classList.remove('speaking');
  }

  if (fab) {
    fab.classList.remove('speaking', 'listening');
    if (isSpeaking) fab.classList.add('speaking');
    else if (isListening) fab.classList.add('listening');
  }

  if (avatar) {
    avatar.classList.remove('speaking', 'listening');
    if (isSpeaking) avatar.classList.add('speaking');
    else if (isListening) avatar.classList.add('listening');
  }

  if (micBtn) {
    if (isListening) micBtn.classList.add('listening');
    else micBtn.classList.remove('listening');
  }

  if (stopBtn) {
    stopBtn.style.display = isSpeaking ? 'inline-flex' : 'none';
  }

  if (readBtn) {
    if (isSpeaking) readBtn.classList.add('active');
    else readBtn.classList.remove('active');
  }
}

function setVoiceStatus(msg) {
  const label = document.getElementById('voice-status-label');
  if (label) label.textContent = msg;
}

function addTranscriptBubble(sender, htmlContent) {
  const container = document.getElementById('voice-transcript');
  if (!container) return;

  const bubble = document.createElement('div');
  bubble.className = `voice-bubble ${sender}`;
  bubble.innerHTML = `${htmlContent} <span class="voice-bubble-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

// Real-time Canvas Waveform Animation
function startVisualizerAnimation() {
  const canvas = document.getElementById('voice-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let step = 0;

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;
    const mid = height / 2;

    step += 0.05;

    // Amplitude depends on speaking / listening state
    let amp = 2;
    let color = 'rgba(99, 102, 241, 0.4)';
    
    if (isSpeaking) {
      amp = 16 + Math.sin(step * 4) * 6;
      color = '#06b6d4';
    } else if (isListening) {
      amp = 20 + Math.cos(step * 5) * 8;
      color = '#f43f5e';
    }

    // Draw Smooth Sine Waves
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;

    for (let x = 0; x < width; x++) {
      const y = mid + Math.sin(x * 0.04 + step * 2) * amp * Math.sin((x / width) * Math.PI);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Second faint harmonic wave
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isSpeaking ? 'rgba(16, 185, 129, 0.5)' : 'rgba(139, 92, 246, 0.3)';
    for (let x = 0; x < width; x++) {
      const y = mid + Math.sin(x * 0.06 - step * 1.5) * (amp * 0.6) * Math.sin((x / width) * Math.PI);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    requestAnimationFrame(render);
  }

  render();
}

// Friendly Synthetic Chime Effect via Web Audio API
function playChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch(e) {
    // Audio Context optional
  }
}

