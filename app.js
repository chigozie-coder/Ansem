import * as THREE from "three";

const CONTRACT = "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump";
const DEX_URL = `https://api.dexscreener.com/latest/dex/tokens/${CONTRACT}`;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  pointer: { x: 0, y: 0 },
  scroll: 0,
  intensity: 0.72,
  trails: 0.56,
  audioPlaying: false,
  marketPulse: 0.82,
  quest: new Set(),
};

const formatUsd = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
};

const compact = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: n >= 1000000 ? 2 : 1,
  }).format(n);
};

const showToast = (message) => {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
};

const legacyCopy = (text) => {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  const ok = document.execCommand("copy");
  field.remove();
  return ok;
};

const copyContract = async () => {
  try {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(CONTRACT);
      } catch {
        if (!legacyCopy(CONTRACT)) throw new Error("Copy blocked");
      }
    } else {
      if (!legacyCopy(CONTRACT)) throw new Error("Copy blocked");
    }
    showToast("Contract copied. Now the chart is one tap away.");
    completeQuest("copy");
    coinRain(12);
  } catch {
    showToast("Copy blocked by browser");
  }
};

$("#copy-ca")?.addEventListener("click", copyContract);
$("#copy-ca-2")?.addEventListener("click", copyContract);
$("#sticky-copy")?.addEventListener("click", copyContract);
$('[data-quest="copy"]')?.addEventListener("click", copyContract);
$$('[data-quest="chart"], [data-quest="buy"]').forEach((link) => {
  link.addEventListener("click", () => completeQuest(link.dataset.quest));
});

function completeQuest(step) {
  state.quest.add(step);
  $(`[data-quest="${step}"]`)?.classList.add("is-done");
  const progress = Math.min(100, 18 + state.quest.size * 27);
  $("#quest-progress")?.style.setProperty("width", `${progress}%`);
  if (state.quest.size >= 3) {
    showToast("Black bull route complete");
    coinRain(30);
  }
}

document.addEventListener("pointerdown", (event) => {
  const flash = $("#cursor-flash");
  flash.style.left = `${event.clientX}px`;
  flash.style.top = `${event.clientY}px`;
  flash.classList.remove("is-on");
  requestAnimationFrame(() => flash.classList.add("is-on"));
});

document.addEventListener("pointermove", (event) => {
  state.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  state.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("scroll", () => {
  state.scroll = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
  $("#sticky-buy")?.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.55);
});

const coinRain = (count = 24) => {
  for (let i = 0; i < count; i += 1) {
    const coin = document.createElement("span");
    coin.className = "coin";
    coin.textContent = "$";
    coin.style.left = `${Math.random() * 100}vw`;
    coin.style.animationDelay = `${Math.random() * 420}ms`;
    coin.style.animationDuration = `${1000 + Math.random() * 1100}ms`;
    document.body.appendChild(coin);
    window.setTimeout(() => coin.remove(), 2400);
  }
};

$("#rain-button")?.addEventListener("click", () => {
  coinRain(42);
  showToast("Airdrop wall activated");
});

$$("[data-tilt]").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg) translateY(-3px)`;
  });
  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

$$(".magnetic").forEach((button) => {
  button.addEventListener("pointermove", (event) => {
    const rect = button.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
    button.style.transform = `translate(${x}px, ${y}px)`;
  });
  button.addEventListener("pointerleave", () => {
    button.style.transform = "";
  });
});

const buildSparkline = (seed = 0.5) => {
  const points = [];
  let y = 190 - seed * 80;
  for (let i = 0; i < 70; i += 1) {
    y += (Math.random() - 0.44) * 34;
    y -= seed * 2.6;
    y = Math.max(36, Math.min(238, y));
    points.push([20 + i * (860 / 69), y]);
  }

  const line = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(" ");
  const area = `${line} L 880 278 L 20 278 Z`;
  $("#spark-line")?.setAttribute("d", line);
  $("#spark-area")?.setAttribute("d", area);

  const bars = $("#volume-bars");
  if (bars) {
    bars.innerHTML = points
      .filter((_, index) => index % 2 === 0)
      .map(([x], index) => {
        const height = 12 + Math.abs(Math.sin(index * 1.7 + seed * 8)) * 72;
        return `<rect x="${x.toFixed(1)}" y="${(278 - height).toFixed(1)}" width="7" height="${height.toFixed(1)}" />`;
      })
      .join("");
  }
};

const hydrateMarket = async () => {
  buildSparkline(0.75);
  try {
    const response = await fetch(DEX_URL, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`DexScreener ${response.status}`);
    const data = await response.json();
    const pair = (data.pairs || [])
      .filter((item) => item?.baseToken?.address === CONTRACT && Number(item?.liquidity?.usd || 0) > 0)
      .sort((a, b) => Number(b.volume?.h24 || 0) - Number(a.volume?.h24 || 0))[0];
    if (!pair) throw new Error("No pair found");

    const change = Number(pair.priceChange?.h24 || 0);
    const txns = Number(pair.txns?.h24?.buys || 0) + Number(pair.txns?.h24?.sells || 0);
    const pulse = Math.max(44, Math.min(100, 62 + change * 0.6 + Math.log10(Math.max(1, txns)) * 5));
    state.marketPulse = pulse / 100;

    $("#price-usd").textContent = formatUsd(pair.priceUsd);
    $("#sticky-price").textContent = `${formatUsd(pair.priceUsd)} · ${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
    $("#price-change").textContent = `${change >= 0 ? "+" : ""}${change.toFixed(2)}% (24H)`;
    $("#price-change").style.color = change >= 0 ? "var(--green)" : "#ff5770";
    $("#market-cap").textContent = `$${compact(pair.marketCap || pair.fdv)}`;
    $("#liquidity").textContent = `$${compact(pair.liquidity?.usd)}`;
    $("#volume-24h").textContent = `$${compact(pair.volume?.h24)}`;
    $("#txns-24h").textContent = compact(txns);
    $("#hero-strength").textContent = `${Math.round(pulse)}%`;
    $("#hero-volume").textContent = `$${compact(pair.volume?.h24)}`;
    $("#strength-score").textContent = `${Math.round(pulse)}%`;
    $(".ring-meter")?.style.setProperty("--score", pulse);
    $("#strength-copy").textContent =
      change >= 0
        ? "Momentum is green, liquidity is visible, and the chart is doing the selling before the button does."
        : "The bull is cooling off, but the live panel keeps the trenches honest.";
    $("#pair-name").textContent = `${pair.dexId.toUpperCase()} / ${pair.quoteToken?.symbol || "SOL"}`;
    buildSparkline(Math.max(0.35, Math.min(0.95, state.marketPulse)));
  } catch (error) {
    $("#live-dot").textContent = "Cached";
    $("#hero-strength").textContent = "82%";
    $("#hero-volume").textContent = "API cooling";
    $("#strength-copy").textContent = "DexScreener did not answer, so the page is showing fallback momentum UI.";
  }
};

hydrateMarket();
window.setInterval(hydrateMarket, 60000);

const initThree = () => {
  const canvas = $("#bull-canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020402, 0.04);

  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 1.8, 12);

  const green = new THREE.Color(0x9dff22);
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x050705,
    metalness: 0.92,
    roughness: 0.28,
    emissive: 0x061300,
    emissiveIntensity: 0.45,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x8cff1a,
    metalness: 0.35,
    roughness: 0.2,
    emissive: 0x63ff18,
    emissiveIntensity: 2.1,
  });

  const bull = new THREE.Group();
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x9dff22,
    transparent: true,
    opacity: 0.36,
  });
  const addEdges = (mesh) => {
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMat);
    edges.position.copy(mesh.position);
    edges.rotation.copy(mesh.rotation);
    edges.scale.copy(mesh.scale).multiplyScalar(1.01);
    bull.add(edges);
  };

  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(2.3, 2), darkMat);
  body.scale.set(1.8, 0.95, 0.9);
  bull.add(body);
  addEdges(body);

  const chest = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), darkMat);
  chest.position.set(2.65, 0.15, 0);
  chest.scale.set(1, 1.2, 0.9);
  bull.add(chest);
  addEdges(chest);

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 2), darkMat);
  head.position.set(4.05, 0.7, 0);
  head.scale.set(1.05, 0.82, 0.78);
  bull.add(head);
  addEdges(head);

  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.05, 5), darkMat);
  snout.position.set(4.82, 0.46, 0);
  snout.rotation.z = -Math.PI / 2;
  bull.add(snout);
  addEdges(snout);

  const hornGeo = new THREE.ConeGeometry(0.18, 2.1, 18);
  const hornLeft = new THREE.Mesh(hornGeo, glowMat);
  hornLeft.position.set(4.18, 1.46, 0.78);
  hornLeft.rotation.set(0.68, 0.25, -0.75);
  bull.add(hornLeft);
  const hornRight = hornLeft.clone();
  hornRight.position.z = -0.78;
  hornRight.rotation.x = -0.68;
  bull.add(hornRight);

  const legGeo = new THREE.CylinderGeometry(0.22, 0.32, 1.8, 7);
  [[-2.2, -1.55, 0.7], [-1.2, -1.65, -0.72], [1.6, -1.55, 0.7], [2.6, -1.66, -0.72]].forEach((pos, index) => {
    const leg = new THREE.Mesh(legGeo, darkMat);
    leg.position.set(pos[0], pos[1], pos[2]);
    leg.rotation.z = index % 2 ? -0.14 : 0.13;
    bull.add(leg);
    addEdges(leg);
    const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.42), glowMat);
    hoof.position.set(pos[0] + 0.08, -2.55, pos[2]);
    bull.add(hoof);
    addEdges(hoof);
  });

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.2, 8), glowMat);
  tail.position.set(-4.25, 0.4, 0);
  tail.rotation.z = -1.2;
  bull.add(tail);

  bull.position.set(2.15, -0.18, -5.25);
  bull.rotation.set(0.05, -0.42, 0.03);
  bull.scale.setScalar(1.08);
  scene.add(bull);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80, 30, 30),
    new THREE.MeshBasicMaterial({ color: 0x0b150b, wireframe: true, transparent: true, opacity: 0.18 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.72;
  scene.add(floor);

  const tokenGroup = new THREE.Group();
  const tokenMat = new THREE.MeshStandardMaterial({
    color: 0x0d1709,
    metalness: 0.75,
    roughness: 0.2,
    emissive: 0x2d7600,
    emissiveIntensity: 0.75,
  });
  for (let i = 0; i < 48; i += 1) {
    const token = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 28), tokenMat);
    token.position.set((Math.random() - 0.5) * 26, (Math.random() - 0.5) * 12, -8 - Math.random() * 22);
    token.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    token.userData.speed = 0.012 + Math.random() * 0.035;
    tokenGroup.add(token);
  }
  scene.add(tokenGroup);

  const particles = new THREE.BufferGeometry();
  const particleCount = 900;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 42;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
    positions[i * 3 + 2] = -Math.random() * 44;
  }
  particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particleMesh = new THREE.Points(
    particles,
    new THREE.PointsMaterial({ color: green, size: 0.028, transparent: true, opacity: 0.76 })
  );
  scene.add(particleMesh);

  scene.add(new THREE.AmbientLight(0xffffff, 0.38));
  const key = new THREE.PointLight(0x9dff22, 28, 40);
  key.position.set(6, 6, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0x7b3cff, 18, 38);
  rim.position.set(-7, 4, 0);
  scene.add(rim);

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();
  const animate = () => {
    const t = clock.getElapsedTime();
    const pulse = state.marketPulse * state.intensity;
    bull.rotation.y = -0.42 + Math.sin(t * 0.65) * 0.08 + state.pointer.x * 0.08;
    bull.rotation.x = 0.05 + state.pointer.y * 0.035;
    bull.position.x = 2.15 - state.scroll * 7.5;
    bull.position.z = -6 + state.scroll * 2;
    bull.scale.setScalar(1.08 + Math.sin(t * 2.4) * 0.012 * pulse);
    hornLeft.scale.y = 1 + Math.sin(t * 5) * 0.06;
    hornRight.scale.y = 1 + Math.cos(t * 5) * 0.06;
    tokenGroup.rotation.y += 0.002 + pulse * 0.002;
    tokenGroup.children.forEach((token, index) => {
      token.position.z += token.userData.speed * (1 + pulse);
      token.rotation.x += 0.03;
      token.rotation.y += 0.022;
      if (token.position.z > 6) token.position.z = -30 - (index % 10);
    });
    particleMesh.rotation.y = t * 0.025;
    particleMesh.position.x = state.pointer.x * 0.45;
    floor.position.z = (t * 1.2) % 4;
    camera.position.x = state.pointer.x * 0.35;
    camera.position.y = 1.8 + state.pointer.y * 0.18;
    camera.lookAt(0, 0, -5);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  animate();
};

initThree();

let audioContext;
let oscillator;
let gainNode;
let analyser;

const visualizer = $("#visualizer");
const visualCtx = visualizer?.getContext("2d");

const startAudio = async () => {
  audioContext ||= new AudioContext();
  oscillator = audioContext.createOscillator();
  const bass = audioContext.createOscillator();
  gainNode = audioContext.createGain();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 128;

  oscillator.type = "sawtooth";
  bass.type = "sine";
  oscillator.frequency.value = 92;
  bass.frequency.value = 46;
  gainNode.gain.value = 0.045;

  oscillator.connect(gainNode);
  bass.connect(gainNode);
  gainNode.connect(analyser);
  analyser.connect(audioContext.destination);
  oscillator.start();
  bass.start();
  oscillator.bass = bass;
  state.audioPlaying = true;
  $("#radio-toggle")?.classList.add("is-playing");
  $("#sound-toggle")?.classList.add("is-playing");
};

const stopAudio = () => {
  if (oscillator) {
    oscillator.stop();
    oscillator.bass?.stop();
    oscillator = null;
  }
  state.audioPlaying = false;
  $("#radio-toggle")?.classList.remove("is-playing");
  $("#sound-toggle")?.classList.remove("is-playing");
};

const toggleAudio = () => {
  if (state.audioPlaying) stopAudio();
  else startAudio();
};

$("#radio-toggle")?.addEventListener("click", toggleAudio);
$("#sound-toggle")?.addEventListener("click", toggleAudio);

$("#intensity")?.addEventListener("input", (event) => {
  state.intensity = Number(event.target.value) / 100;
});

$("#trails")?.addEventListener("input", (event) => {
  state.trails = Number(event.target.value) / 100;
});

const drawVisualizer = () => {
  if (!visualCtx || !visualizer) return;
  const width = visualizer.width;
  const height = visualizer.height;
  visualCtx.fillStyle = `rgba(2, 4, 2, ${0.18 + (1 - state.trails) * 0.65})`;
  visualCtx.fillRect(0, 0, width, height);

  const bars = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
  if (analyser && bars) analyser.getByteFrequencyData(bars);

  const count = 44;
  const gap = 5;
  const barWidth = (width - gap * (count - 1)) / count;
  for (let i = 0; i < count; i += 1) {
    const audioValue = bars ? bars[i % bars.length] / 255 : 0.25 + Math.abs(Math.sin(Date.now() / 260 + i)) * 0.45;
    const value = audioValue * state.intensity + Math.sin(Date.now() / 360 + i * 0.7) * 0.09;
    const h = Math.max(8, value * height * 0.86);
    const x = i * (barWidth + gap);
    const y = height - h;
    const gradient = visualCtx.createLinearGradient(0, y, 0, height);
    gradient.addColorStop(0, "#9dff22");
    gradient.addColorStop(0.55, "#38ff6a");
    gradient.addColorStop(1, "rgba(157,255,34,0.08)");
    visualCtx.fillStyle = gradient;
    visualCtx.fillRect(x, y, barWidth, h);
  }

  if (oscillator && gainNode) {
    oscillator.frequency.value = 76 + state.intensity * 54 + Math.sin(Date.now() / 400) * 12;
    oscillator.bass.frequency.value = 38 + state.marketPulse * 18;
    gainNode.gain.value = 0.018 + state.intensity * 0.055;
  }
  requestAnimationFrame(drawVisualizer);
};

drawVisualizer();
