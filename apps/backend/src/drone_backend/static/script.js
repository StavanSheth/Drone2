document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Three.js Rotating Drone Background ---
    initThreeJSBackground();

    // --- 2. Theme Switching ---
    initThemeSwitch();

    // --- 3. Language Switching ---
    initLanguageSwitch();

    // --- 4. Live Data Simulation ---
    setInterval(updateTelemetry, 2500);
    setInterval(updateLogs, 3500); // New Log generation

    // --- 5. Initialize New Graphs ---
    initSpectralGraph();
    initRadarChart();

    // --- 7. Initialize Chatbot ---
    initChatbot();

    // --- 8. Initialize Recording ---
    initRecording();
});

// --- Chatbot Logic ---
function initChatbot() {
    const fab = document.getElementById('chatbot-fab');
    const chatWindow = document.getElementById('chat-window');
    const closeBtn = document.getElementById('chat-close-btn');
    const expandBtn = document.getElementById('chat-expand-btn');
    const modal = document.getElementById('chat-modal');
    const closeModalBtn = document.getElementById('chat-modal-close-btn');

    const inputSmall = document.getElementById('chat-input-small');
    const sendSmall = document.getElementById('chat-send-small');
    const bodySmall = document.getElementById('chat-body-small');

    const inputLarge = document.getElementById('chat-input-large');
    const sendLarge = document.getElementById('chat-send-large');
    const bodyLarge = document.getElementById('chat-body-large');

    // Toggle Small Chat
    fab.addEventListener('click', () => {
        chatWindow.classList.toggle('active');
        fab.style.transform = chatWindow.classList.contains('active') ? 'scale(0)' : 'scale(1)';
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('active');
        fab.style.transform = 'scale(1)';
    });

    // Fullscreen Mode
    expandBtn.addEventListener('click', () => {
        modal.classList.add('active');
        chatWindow.classList.remove('active'); // Hide small chat
        syncChatHistory();
    });

    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        chatWindow.classList.add('active'); // Restore small chat
    });

    // Send Message Logic
    function sendMessage(msg, isUser = true) {
        if (!msg) return;

        const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        // Template
        const msgHTML = `
            <div class="chat-message ${isUser ? 'user' : 'bot'}">
                <div class="msg-content">${msg}</div>
                <div class="msg-time">${time}</div>
            </div>
        `;

        // Add to both views
        bodySmall.insertAdjacentHTML('beforeend', msgHTML);
        bodyLarge.insertAdjacentHTML('beforeend', msgHTML);

        // Scroll to bottom
        bodySmall.scrollTop = bodySmall.scrollHeight;
        bodyLarge.scrollTop = bodyLarge.scrollHeight;

        // Auto-reply simulation
        if (isUser) {
            setTimeout(() => {
                const replies = [
                    "Processing request...",
                    "Analyzing field data.",
                    "Drone coordinates updated.",
                    "Scanning for anomalies.",
                    "Battery efficiency is optimal.",
                    "Weather conditions are stable."
                ];
                const randomReply = replies[Math.floor(Math.random() * replies.length)];
                sendMessage(randomReply, false);
            }, 1000 + Math.random() * 2000);
        }
    }

    // Event Listeners for Input
    function handleInput(input, btn) {
        btn.addEventListener('click', () => {
            sendMessage(input.value);
            input.value = '';
        });
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage(input.value);
                input.value = '';
            }
        });
    }

    handleInput(inputSmall, sendSmall);
    handleInput(inputLarge, sendLarge);

    function syncChatHistory() {
        // In a real app, this might fetch history. 
        // Here, we are already appending to both DOMs simultaneously, 
        // confirming scroll position is bottom.
        bodyLarge.scrollTop = bodyLarge.scrollHeight;
    }
}

// --- Recording Logic ---
function initRecording() {
    const recordBtn = document.getElementById('recordBtn');
    if (!recordBtn) return;

    let isRecording = false;
    let mediaRecorder;
    let recordedChunks = [];

    recordBtn.addEventListener('click', async () => {
        if (!isRecording) {
            // Start Recording
            const stream = document.getElementById('webcam-feed').srcObject;
            if (!stream) {
                alert("No camera feed available to record.");
                return;
            }

            recordedChunks = [];

            // Check supported mime types
            const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
                ? "video/webm; codecs=vp9"
                : "video/webm";

            mediaRecorder = new MediaRecorder(stream, { mimeType });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: mimeType });
                const url = URL.createObjectURL(blob);

                // Create download link
                const a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                a.href = url;
                a.download = `drone-feed-${new Date().toISOString()}.webm`;
                a.click();
                window.URL.revokeObjectURL(url);
            };

            mediaRecorder.start();
            isRecording = true;
            recordBtn.classList.add('recording');
            recordBtn.innerHTML = '<i class="fa-solid fa-stop"></i> <span>STOP</span>';
        } else {
            // Stop Recording
            mediaRecorder.stop();
            isRecording = false;
            recordBtn.classList.remove('recording');
            recordBtn.innerHTML = '<i class="fa-solid fa-circle"></i> <span>REC</span>';
        }
    });
}


// --- Log Generation ---
const logMessages = [
    { type: 'info', msg: '[SYS] Scanning telemetry...' },
    { type: 'success', msg: '[NAV] Waypoint 4 reached.' },
    { type: 'info', msg: '[SENS] Soil moisture data packet rx.' },
    { type: 'warn', msg: '[AI] Minor wind turbulence detected.' },
    { type: 'success', msg: '[CAM] Image captured (4K).' },
    { type: 'info', msg: '[NET] Uploading field data...' }
];

function updateLogs() {
    const consoleEl = document.getElementById('logConsole');
    const msgData = logMessages[Math.floor(Math.random() * logMessages.length)];
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });

    const div = document.createElement('div');
    div.className = 'log-line';
    div.innerHTML = `<span class="time">${time}</span> <span class="${msgData.type}">${msgData.msg.split(' ')[0]}</span> ${msgData.msg.substring(msgData.msg.indexOf(' ') + 1)}`;

    consoleEl.appendChild(div);
    if (consoleEl.children.length > 6) {
        consoleEl.removeChild(consoleEl.firstChild);
    }
}

// --- Spectral Graph (Canvas Visualizer) ---
function initSpectralGraph() {
    const canvas = document.getElementById('spectralCanvas');
    const ctx = canvas.getContext('2d');

    // Resize handling
    function resize() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight - 30; // Accounting for header
    }
    resize();
    window.addEventListener('resize', resize);

    const bars = 40;
    const barWidth = canvas.width / bars;

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, 'rgba(0, 210, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 255, 157, 0.8)');

        ctx.fillStyle = gradient;

        for (let i = 0; i < bars; i++) {
            // Generate wave pattern mixed with random noise for "spectral" look
            const time = Date.now() * 0.002;
            const heightFactor = (Math.sin(i * 0.2 + time) + 1) / 2;
            const noise = Math.random() * 0.3;

            const barHeight = (heightFactor * 0.6 + noise * 0.4) * canvas.height;

            const x = i * barWidth;
            const y = canvas.height - barHeight;

            // Rounded bars
            ctx.beginPath();
            ctx.roundRect(x + 2, y, barWidth - 4, barHeight, 4);
            ctx.fill();
        }

        requestAnimationFrame(animate);
    }
    animate();
}

// --- Radar Chart (Health Index) ---
function initRadarChart() {
    const canvas = document.getElementById('radarCanvas');
    const ctx = canvas.getContext('2d');

    function resize() {
        // Use container dimensions but ensure square aspect ratio for radar
        const size = Math.min(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);
        canvas.width = size;
        canvas.height = size;
    }
    resize();
    window.addEventListener('resize', resize);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 20;
    const numAxes = 5;
    const labels = ["Water", "Soil", "Pest", "Growth", "Temp"];

    // Random values for the shape
    let values = [0.8, 0.7, 0.9, 0.85, 0.6];
    let targetValues = [...values];

    setInterval(() => {
        // Slowly morph values
        targetValues = values.map(v => Math.max(0.4, Math.min(1.0, v + (Math.random() - 0.5) * 0.2)));
    }, 2000);

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Interpolate current values towards target
        values = values.map((v, i) => v + (targetValues[i] - v) * 0.05);

        // Draw Web/Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        for (let level = 1; level <= 4; level++) {
            const r = (radius / 4) * level;
            ctx.beginPath();
            for (let i = 0; i <= numAxes; i++) {
                const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Draw Axes
        ctx.beginPath();
        for (let i = 0; i < numAxes; i++) {
            const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw Data Shape
        ctx.fillStyle = 'rgba(0, 210, 255, 0.3)';
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < numAxes; i++) {
            const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
            const r = radius * values[i];
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw Points
        ctx.fillStyle = '#fff';
        for (let i = 0; i < numAxes; i++) {
            const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
            const r = radius * values[i];
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(animate);
    }
    animate();
}

// --- Three.js Logic ---
function initThreeJSBackground() {
    const container = document.getElementById('canvas-container');
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Geometry - Abstract Drone Representation (Group of geometric shapes since we lack an asset)
    const droneGroup = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(1.5, 0.3, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.3,
        metalness: 0.8
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    droneGroup.add(body);

    // Arms
    const armGeom = new THREE.CylinderGeometry(0.1, 0.1, 3.5);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const arm1 = new THREE.Mesh(armGeom, armMat);
    arm1.rotation.z = Math.PI / 4;
    arm1.rotation.x = Math.PI / 2;
    droneGroup.add(arm1);

    const arm2 = new THREE.Mesh(armGeom, armMat);
    arm2.rotation.z = -Math.PI / 4;
    arm2.rotation.x = Math.PI / 2;
    droneGroup.add(arm2);

    // Rotors (Visualized as semi-transparent discs)
    const rotorGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.05, 32);
    const rotorMat = new THREE.MeshBasicMaterial({
        color: 0x00d2ff,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });

    const rotorPositions = [
        { x: 1.2, y: 0.2, z: 1.2 },
        { x: -1.2, y: 0.2, z: -1.2 },
        { x: 1.2, y: 0.2, z: -1.2 },
        { x: -1.2, y: 0.2, z: 1.2 }
    ];

    rotorPositions.forEach(pos => {
        const rotor = new THREE.Mesh(rotorGeom, rotorMat);
        rotor.position.set(pos.x, pos.y, pos.z);
        droneGroup.add(rotor);
    });

    // Add particles/glow
    const particleGeom = new THREE.BufferGeometry();
    const particleCount = 100;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 10;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
        size: 0.05,
        color: 0x00ff9d,
        transparent: true,
        opacity: 0.5
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    scene.add(droneGroup);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00d2ff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xff9d00, 0.5);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // Animation Loop
    let time = 0;
    function animate() {
        requestAnimationFrame(animate);

        time += 0.005;

        // Gentle float
        droneGroup.position.y = Math.sin(time) * 0.2;

        // Slow rotation
        droneGroup.rotation.y += 0.002;
        droneGroup.rotation.z = Math.sin(time * 0.5) * 0.05; // Slight tilt

        // Particle rotation
        particles.rotation.y -= 0.0005;

        renderer.render(scene, camera);
    }

    animate();

    // Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// --- Theme Switch ---
function initThemeSwitch() {
    const toggle = document.getElementById('checkbox');
    const html = document.documentElement;

    toggle.addEventListener('change', () => {
        if (toggle.checked) {
            html.setAttribute('data-theme', 'light');
        } else {
            html.setAttribute('data-theme', 'dark');
        }
    });
}

// --- Language Switch ---
const translations = {
    en: {
        brandName: "Trinetra",
        flightTelemetry: "FLIGHT TELEMETRY",
        altitude: "ALT",
        speed: "SPD",
        battery: "BATTERY",
        gpsSignal: "GPS SIGNAL",
        live: "LIVE",
        automation: "AUTOMATION",
        autoWaterDesc: "Auto-water when moisture < 30%",
        active: "ACTIVE",
        fieldSensors: "FIELD SENSORS",
        soilMoisture: "Soil Moisture",
        statusLow: "Status: LOW",
        phLevel: "pH Level",
        tankLevel: "Tank Level",
        spectralAnalysis: "SPECTRAL ANALYSIS (NDVI)",
        healthIndex: "HEALTH INDEX",
        fieldSensors: "FIELD STATUS",
        weather: "WEATHER",
        systemLogs: "SYSTEM LOGS",
        alerts: "RISK ALERTS"
    },
    hi: {
        brandName: "एरो-एग्री प्रहरी",
        flightTelemetry: "उड़ान टेलीमेट्री",
        altitude: "ऊंचाई",
        speed: "गति",
        battery: "बैटरी",
        gpsSignal: "जीपीएस सिग्नल",
        live: "लाइव",
        automation: "ऑटो",
        autoWaterDesc: "नमी < ३०% होने पर स्वचालित पानी",
        active: "सक्रिय",
        fieldSensors: "खेत की स्थिति",
        soilMoisture: "मिट्टी की नमी",
        statusLow: "स्थिति: कम",
        phLevel: "पीएच स्तर",
        tankLevel: "टैंक स्तर",
        spectralAnalysis: "स्पेक्ट्रल विश्लेषण",
        healthIndex: "स्वास्थ्य सूचकांक",
        weather: "मौसम",
        systemLogs: "सिस्टम लॉग",
        alerts: "जोखिम चेतावनी"
    },
    mr: {
        brandName: "एरो-एग्री सेंटिनेल",
        flightTelemetry: "फ्लाइट टेलिमेट्री",
        altitude: "उंची",
        speed: "वेग",
        battery: "बॅटरी",
        gpsSignal: "जीपीएस सिग्नल",
        live: "थेट",
        automation: "ऑटो",
        autoWaterDesc: "ओलावा < ३०% असल्यास स्वयंचलित पाणी",
        active: "सक्रिय",
        fieldSensors: "शेताची स्थिती",
        soilMoisture: "मातीची आर्द्रता",
        statusLow: "स्थिती: कमी",
        phLevel: "पीएच पातळी",
        tankLevel: "टाकी पातळी",
        spectralAnalysis: "वर्णक्रमीय विश्लेषण",
        healthIndex: "आरोग्य निर्देशांक",
        weather: "हवामान",
        systemLogs: "सिस्टम लॉग्स",
        alerts: "धोका सूचना"
    }
};

function initLanguageSwitch() {
    const langSelect = document.getElementById('langSelect');

    langSelect.addEventListener('change', (e) => {
        const lang = e.target.value;
        updateContent(lang);
    });
}

function updateContent(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // Update body font if Devnagari to look better? 
    // For now sticking to premium fonts defined in CSS which support extensive glyphs.
}

// --- Simulation Logic ---
function updateTelemetry() {
    // Randomize simple values to make the dashboard feel 'alive'

    // Altitude +/- 1m
    const altEl = document.querySelector('#altGauge .value');
    let currentAlt = parseInt(altEl.textContent);
    let change = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    altEl.textContent = Math.max(0, currentAlt + change);

    // Speed +/- 1km/h
    const spdEl = document.querySelector('#speedGauge .value');
    let currentSpd = parseInt(spdEl.textContent);
    change = Math.floor(Math.random() * 3) - 1;
    spdEl.textContent = Math.max(0, currentSpd + change);

    // Voltage fluctuation
    const voltEl = document.querySelector('.battery-details span:first-child');
    let volt = (22 + Math.random() * 0.5).toFixed(1);
    voltEl.textContent = `${volt}V`;

    // pH Fluctuation slightly
    const phEl = document.querySelector('.ph-val .big-num');
    let ph = (6.8 + (Math.random() * 0.2 - 0.1)).toFixed(1);
    phEl.textContent = ph;

    // Wind Update
    const windSpeed = document.getElementById('windSpeed');
    const windArrow = document.getElementById('windArrow');
    if (windSpeed) {
        windSpeed.textContent = Math.floor(Math.random() * 10 + 5); // 5-15
        const rot = Math.floor(Math.random() * 360);
        windArrow.style.transform = `rotate(${rot}deg)`;
    }

    // AI Yield Update (Slow random fluctuation)
    if (Math.random() > 0.7) {
        const aiValEl = document.querySelector('.ai-val');
        if (aiValEl) {
            let base = 92;
            let val = base + Math.floor(Math.random() * 5 - 2);
            aiValEl.textContent = `${val}%`;
        }
    }
}

// --- Webcam Logic ---
async function initWebcam() {
    const video = document.getElementById('webcam-feed');
    if (!video) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (err) {
        console.error("Error accessing webcam: ", err);
        // Add error log to the system logs
        const consoleEl = document.getElementById('logConsole');
        if (consoleEl) {
            const div = document.createElement('div');
            div.className = 'log-line';
            div.innerHTML = `<span class="time">${new Date().toLocaleTimeString('en-GB', { hour12: false })}</span> <span class="error" style="color: #ff4757;">[ERR]</span> Camera access denied.`;
            consoleEl.appendChild(div);
        }
    }
}