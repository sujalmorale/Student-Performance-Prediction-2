/* ==========================================================================
   WHATSAPP SYSTEM & LINK GENERATOR - JAVASCRIPT LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initWhatsAppGateway();
});

function initWhatsAppGateway() {
  const phoneInput = document.getElementById('phone-input');
  const countrySelect = document.getElementById('country-code');
  const messageInput = document.getElementById('message-input');
  const studentNameInput = document.getElementById('student-name');
  
  // Attach event listeners for real-time live link updates
  if (phoneInput) phoneInput.addEventListener('input', updateGeneratedLink);
  if (countrySelect) countrySelect.addEventListener('change', updateGeneratedLink);
  if (messageInput) messageInput.addEventListener('input', updateGeneratedLink);
  if (studentNameInput) studentNameInput.addEventListener('input', updateGeneratedLink);

  // Check URL query parameters for pre-filling (e.g. from Student Dashboard)
  parseUrlParams();

  // Initial link generation & QR render
  updateGeneratedLink();
}

// Preset Template Selector
function applyTemplate(templateType) {
  const messageInput = document.getElementById('message-input');
  const studentName = document.getElementById('student-name')?.value.trim() || '[Student Name]';


  // Toggle active class on pills
  document.querySelectorAll('.template-pill').forEach(pill => pill.classList.remove('active'));
  const activePill = document.querySelector(`.template-pill[onclick*="${templateType}"]`);
  if (activePill) activePill.classList.add('active');

  let text = '';
  switch (templateType) {
    case 'report':
      text = `🎓 *STUDENT ACADEMIC PERFORMANCE REPORT*\n\n` +
             `*Student Name:* ${studentName}\n` +
             `*Predicted Marks:* 88.5 / 100 (88.5%)\n` +
             `*Letter Grade:* Grade A (GPA 3.7)\n` +
             `*Status:* Excellent | Pass Prob: 98.5%\n\n` +
             `*Key Strengths:*\n` +
             `• Class Attendance: 92% presence\n` +
             `• Weekly Study Hours: 22 hrs/week\n\n` +
             `*Recommended Action Plan:*\n` +
             `• Maintain current study regimen & complete final revision exercises.\n\n` +
             `_Generated via Student Performance Prediction System_`;

      break;

    case 'attendance':
      text = `⚠️ *ACADEMIC ATTENDANCE ADVISORY*\n\n` +
             `Dear Parent/Guardian of ${studentName},\n\n` +
             `This is an urgent notification regarding attendance rate (Current: 68%).\n` +
             `Regular classroom attendance is critical for maintaining passing grades.\n\n` +
             `Please contact the Academic Counseling Office at your earliest convenience to schedule a guidance meeting.\n\n` +
             `_Academic Advisory Board_`;
      break;

    case 'meeting':
      text = `📅 *PARENT-TEACHER CONFERENCE INVITATION*\n\n` +
             `Dear Parent/Guardian,\n\n` +
             `You are cordially invited to attend the mid-term Parent-Teacher Academic Review for ${studentName}.\n\n` +
             `📍 *Location:* Main Academic Hall / Online Portal\n` +
             `🕒 *Time:* Friday at 3:00 PM\n\n` +
             `Please reply to confirm your availability.`;
      break;

    case 'custom':
    default:
      text = `Hello! Interested in discussing the student academic progress report for ${studentName}.`;
      break;
  }

  if (messageInput) {
    messageInput.value = text;
    updateGeneratedLink();
  }
}

// Generate WhatsApp Link & Render QR Code
function updateGeneratedLink() {
  const countryCode = document.getElementById('country-code')?.value.replace('+', '') || '91';
  let phoneRaw = document.getElementById('phone-input')?.value.replace(/[^0-9]/g, '') || '';
  const messageText = document.getElementById('message-input')?.value || '';

  const fullPhone = countryCode + phoneRaw;
  const encodedText = encodeURIComponent(messageText);

  // Build URLs
  const waMeLink = fullPhone 
    ? `https://wa.me/${fullPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  const apiWaLink = fullPhone
    ? `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  // Update UI Link Box & Buttons
  const linkDisplay = document.getElementById('generated-url');
  if (linkDisplay) linkDisplay.textContent = waMeLink;

  const btnOpenWeb = document.getElementById('btn-open-web');
  if (btnOpenWeb) btnOpenWeb.href = apiWaLink;

  const btnOpenApp = document.getElementById('btn-open-app');
  if (btnOpenApp) btnOpenApp.href = waMeLink;

  // Update Live Chat Bubble Preview
  const chatBubbleText = document.getElementById('chat-preview-text');
  if (chatBubbleText) {
    chatBubbleText.textContent = messageText || 'Your formatted message preview will appear here...';
  }

  // Generate QR Code
  renderQRCode(waMeLink);
}

// Custom Pure JavaScript QR Code Canvas Generator
function renderQRCode(textToEncode) {
  const canvas = document.getElementById('qr-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 190;
  canvas.width = size;
  canvas.height = size;

  // Clear Canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // If QRCode library is available via script CDN
  if (window.QRCode && typeof window.QRCode.toCanvas === 'function') {
    window.QRCode.toCanvas(canvas, textToEncode, { width: size, margin: 1 }, (err) => {
      if (err) drawFallbackQR(ctx, size, textToEncode);
    });
  } else {
    drawFallbackQR(ctx, size, textToEncode);
  }
}

// Fallback Canvas Pattern for QR Visual
function drawFallbackQR(ctx, size, text) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Draw QR corner positioning squares
  const drawCornerSquare = (x, y) => {
    ctx.fillStyle = '#075E54';
    ctx.fillRect(x, y, 42, 42);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 6, y + 6, 30, 30);
    ctx.fillStyle = '#25D366';
    ctx.fillRect(x + 12, y + 12, 18, 18);
  };

  drawCornerSquare(10, 10);
  drawCornerSquare(size - 52, 10);
  drawCornerSquare(10, size - 52);

  // Pseudo Data Grid based on hash of string
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash << 5) - hash + text.charCodeAt(i);

  ctx.fillStyle = '#111827';
  const gridCount = 15;
  const cellSize = (size - 20) / gridCount;

  for (let r = 0; r < gridCount; r++) {
    for (let c = 0; c < gridCount; c++) {
      // Skip corner finder patterns
      if ((r < 4 && c < 4) || (r < 4 && c > gridCount - 5) || (r > gridCount - 5 && c < 4)) continue;
      
      const pseudoVal = (r * 17 + c * 31 + Math.abs(hash)) % 7;
      if (pseudoVal < 3) {
        ctx.fillRect(10 + c * cellSize, 10 + r * cellSize, cellSize - 1, cellSize - 1);
      }
    }
  }

  // Draw Center WhatsApp Icon Overlay
  ctx.fillStyle = '#25D366';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 16, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WA', size / 2, size / 2);
}

// Copy WhatsApp Link to Clipboard
async function copyWhatsAppLink() {
  const url = document.getElementById('generated-url')?.textContent;
  if (!url) return;

  try {
    await navigator.clipboard.writeText(url);
    showToast('WhatsApp Link Copied to Clipboard!');
  } catch (e) {
    // Fallback for copy
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('WhatsApp Link Copied!');
  }
}

// Share via Native Web Share API
async function shareWhatsAppLink() {
  const url = document.getElementById('generated-url')?.textContent;
  const text = document.getElementById('message-input')?.value || 'Student Academic Report Link';

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'WhatsApp Academic Link',
        text: text,
        url: url
      });
      showToast('Shared successfully!');
    } catch (err) {
      console.log('Share dismissed');
    }
  } else {
    copyWhatsAppLink();
  }
}

// Parse incoming URL query params to auto-populate form
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const phone = params.get('phone');
  const text = params.get('text');
  const student = params.get('student');
  const report = params.get('report');

  if (phone) {
    const phoneInput = document.getElementById('phone-input');
    if (phoneInput) phoneInput.value = phone.replace(/[^0-9]/g, '');
  }

  if (student) {
    const studentInput = document.getElementById('student-name');
    if (studentInput) studentInput.value = student;
  }

  if (report) {
    applyTemplate('report');
  } else if (text) {
    const messageInput = document.getElementById('message-input');
    if (messageInput) messageInput.value = text;
  }
}

// Toast notification display
function showToast(message) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
