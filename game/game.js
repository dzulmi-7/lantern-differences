import { art, levels } from './scenes.js';

const $ = (selector) => document.querySelector(selector);
const leftScene = $('#left');
const rightScene = $('#right');
let level = Number(localStorage.getItem('lantern-level') || 0) % levels.length;
let found = loadFinds(level);
let soundEnabled = true;
let audioContext;

function loadFinds(levelIndex) {
  const saved = JSON.parse(localStorage.getItem('lantern-found') || '{}');
  return new Set((saved[levelIndex] || []).filter((i) => Number.isInteger(i) && i >= 0 && i < levels[levelIndex].dif.length));
}

function saveFinds() {
  const saved = JSON.parse(localStorage.getItem('lantern-found') || '{}');
  saved[level] = [...found];
  localStorage.setItem('lantern-found', JSON.stringify(saved));
}

function render() {
  const scene = levels[level];
  $('#levelname').textContent = scene.name;
  $('#total').textContent = scene.dif.length;
  $('#found').textContent = found.size;
  $('#dots').innerHTML = scene.dif.map((_, i) => `<i class="dot ${found.has(i) ? 'done' : ''}"></i>`).join('');

  for (const [panel, side] of [[leftScene, 0], [rightScene, 1]]) {
    panel.innerHTML = art(side, level);
    panel.querySelectorAll('.obj').forEach((object, index) => {
      object.addEventListener('click', (event) => {
        event.stopPropagation();
        findDifference(index);
      });
      object.addEventListener('focus', () => showKeyboardCursor(panel, index));
      object.addEventListener('keydown', (event) => handleObjectKey(event, panel, index));
    });

    for (const index of found) addMarker(panel, index, 'found');
    panel.onclick = (event) => {
      const bounds = panel.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 100;
      const y = ((event.clientY - bounds.top) / bounds.height) * 100;
      const index = scene.dif.findIndex((point) => Math.hypot(x - point.x, y - point.y) < 4.8);
      if (index < 0) markMiss(panel, x, y);
      else findDifference(index);
    };
  }
}

function addMarker(panel, index, kind) {
  const marker = document.createElement('i');
  marker.className = `difference ${kind}`;
  marker.style.left = `${levels[level].dif[index].x}%`;
  marker.style.top = `${levels[level].dif[index].y}%`;
  panel.append(marker);
  return marker;
}

function showKeyboardCursor(panel, index) {
  panel.querySelectorAll('.difference.cursor').forEach((marker) => marker.remove());
  addMarker(panel, index, 'cursor');
}

function handleObjectKey(event, panel, index) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    findDifference(index);
    return;
  }
  const direction = {
    ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1],
  }[event.key];
  if (!direction) return;
  event.preventDefault();
  const origin = levels[level].dif[index];
  const candidates = levels[level].dif.map((point, candidate) => ({
    candidate,
    dx: point.x - origin.x,
    dy: point.y - origin.y,
  })).filter((point) => point.candidate !== index && point.dx * direction[0] + point.dy * direction[1] > 0)
    .sort((a, b) => {
      const directionalDistance = (point) => Math.hypot(point.dx, point.dy) / (point.dx * direction[0] + point.dy * direction[1]);
      return directionalDistance(a) - directionalDistance(b);
    });
  const next = candidates[0]?.candidate ?? (index + 1) % levels[level].dif.length;
  panel.querySelectorAll('.obj')[next].focus();
}

function findDifference(index) {
  if (found.has(index)) return;
  found.add(index);
  saveFinds();
  render();
  playTone(740, 0.12);
  showToast(['A warm little glow.', 'There it is.', 'A detail restored.', 'Nicely noticed.'][index % 4]);
  if (found.size === levels[level].dif.length) {
    localStorage.setItem('lantern-complete', String(Math.max(Number(localStorage.getItem('lantern-complete') || 0), level + 1)));
    setTimeout(() => {
      $('#winTotal').textContent = found.size;
      $('#win').hidden = false;
    }, 500);
  }
}

function markMiss(panel, x, y) {
  const marker = document.createElement('i');
  marker.className = 'difference miss';
  marker.style.left = `${x}%`;
  marker.style.top = `${y}%`;
  panel.append(marker);
  playTone(180, 0.05);
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1000);
}

function playTone(frequency, duration) {
  if (!soundEnabled) return;
  try {
    audioContext ??= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.045, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    // Audio can be unavailable in a browser context; mouse and keyboard play still work.
  }
}

function changeLevel(nextLevel) {
  level = (nextLevel + levels.length) % levels.length;
  found = loadFinds(level);
  $('#win').hidden = true;
  render();
  localStorage.setItem('lantern-level', String(level));
}

function showHint() {
  const index = levels[level].dif.findIndex((_, i) => !found.has(i));
  if (index < 0) return;
  for (const panel of [leftScene, rightScene]) {
    const marker = addMarker(panel, index, 'pulse');
    setTimeout(() => marker.remove(), 2300);
  }
  showToast('A glimmer is waiting nearby.');
  playTone(520, 0.22);
}

$('#prev').addEventListener('click', () => changeLevel(level - 1));
$('#next').addEventListener('click', () => changeLevel(level + 1));
$('#hint').addEventListener('click', showHint);
$('#replay').addEventListener('click', () => {
  found.clear();
  saveFinds();
  $('#win').hidden = true;
  render();
});
$('#continue').addEventListener('click', () => changeLevel(level + 1));
$('#again').addEventListener('click', () => {
  found.clear();
  saveFinds();
  $('#win').hidden = true;
  render();
});
$('#sound').addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  $('#sound').innerHTML = `♫ <small>${soundEnabled ? 'ON' : 'OFF'}</small>`;
});

render();
