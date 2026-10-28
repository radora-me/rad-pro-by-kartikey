/**
 * Radora WebGL 3D Particle Wave Background
 *
 * High-performance GPU-rendered 3D particle terrain/wave replicating vid.mp4:
 * - Sweeping, undulating 3D dot-matrix particle mesh across the full screen
 * - Crisp, distinct glowing particles (teal, electric cyan, diamond-white peaks)
 * - Oblique perspective angle with prominent left-side crest and receding depth
 * - Interactive mouse parallax and smooth scroll response
 * - Additive blending with anti-aliased circular points
 * - 60+ FPS high-performance single VBO draw call with tab-visibility battery saving
 */
(function () {
    'use strict';

    /* ── Configuration ───────────────────────────────────────────── */
    const COLS        = 240;
    const ROWS        = 135;
    const WAVE_SPEED  = 0.40;

    /* ── Canvas Setup ────────────────────────────────────────────── */
    const canvas = document.createElement('canvas');
    canvas.id = 'radora-webgl-bg';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    const gl = canvas.getContext('webgl', {
        antialias            : false,
        alpha                : false,
        depth                : false,
        stencil              : false,
        powerPreference      : 'high-performance',
        preserveDrawingBuffer: false,
    });

    if (!gl) {
        canvas.remove();
        document.body.classList.add('webgl-unavailable');
        return;
    }
    document.body.classList.add('webgl-active');

    /* ── Shaders ─────────────────────────────────────────────────── */
    const VS = /* glsl */`
precision mediump float;

attribute vec2 aUV;          // Grid coordinate 0..1

uniform float uT;            // Time in seconds
uniform float uScroll;       // Scroll position 0..1
uniform vec2  uMouse;        // Mouse tilt -1..1
uniform float uAspect;       // Viewport aspect ratio
uniform float uDPR;          // Device pixel ratio

varying float vH;            // Normalized height
varying float vAlpha;        // Attenuation / edge fade

// 3D Rotation matrices
mat3 rotateX(float a) {
    float c = cos(a), s = sin(a);
    return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
}
mat3 rotateY(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
}
mat3 rotateZ(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
}

void main() {
    // World space: wide in X to fill viewport, deep in Z to reach the very top of the screen
    float x = (aUV.x - 0.5) * 17.5; // -8.75 .. +8.75
    float z = aUV.y * 17.5 + 0.8;   // +0.8 .. +18.3 (fills screen from bottom to above navbar)

    // Multi-frequency wave harmonics matching vid.mp4:
    // 1. Diagonal traveling wave
    float diag1 = x * 0.38 - z * 0.26;
    float w1 = sin(diag1 + uT * 1.15) * 1.25;

    // 2. Counter-angle cross undulation
    float diag2 = x * 0.22 + z * 0.38;
    float w2 = cos(diag2 - uT * 0.85) * 0.85;

    // 3. Fine organic ripples across the whole surface
    float w3 = sin((x * 0.55 + z * 0.30) * 1.4 + uT * 1.35) * 0.38;

    // 4. Iconic crest wave on left (prominent swooping ridge from the video)
    float leftEnvelope = exp(-pow((x + 2.8) * 0.34, 2.0));
    float leftCrest = sin(z * 0.40 - uT * 0.95) * 1.65 * leftEnvelope;

    // 5. Flowing crest filling top background (seen behind navbar and top edge)
    float topFlow = sin(x * 0.30 + z * 0.35 + uT * 0.75) * 0.70;

    // 6. Gentle right-side crest
    float rightEnvelope = exp(-pow((x - 4.5) * 0.35, 2.0));
    float rightWave = sin(z * 0.45 + uT * 0.70) * 0.90 * rightEnvelope;

    float y = (w1 + w2 + w3 + leftCrest + topFlow + rightWave);

    // Height normalized 0..1 for color gradient
    vH = clamp((y + 2.2) / 4.8, 0.0, 1.0);

    // Camera tilt & oblique perspective (matching vid.mp4)
    float pitch = 0.44 + uMouse.y * 0.07 + uScroll * 0.20;
    float yaw   = uMouse.x * 0.09;
    float roll  = -0.04 + uMouse.x * 0.03;

    // Position relative to camera origin (camera slightly elevated)
    vec3 pos = vec3(x, y - 1.15, z);

    mat3 rot = rotateX(pitch) * rotateY(yaw) * rotateZ(roll);
    vec3 camPos = rot * pos;

    // Perspective projection
    float fovTan = 0.52; // tan(55° / 2)
    float depth = max(camPos.z, 0.35);
    float sc = (1.0 / fovTan) / depth;

    // Screen projection: position wave spanning from bottom all the way through top
    float screenX = camPos.x * sc / uAspect;
    float screenY = (camPos.y * sc) - 0.02;

    gl_Position = vec4(screenX, screenY, clamp(depth / 20.0, 0.0, 1.0), 1.0);

    // Dynamic point size: crisp, clean dots
    // Strictly bounded between 1.3px and 4.8px
    float baseSize = 2.5 + vH * 1.8;
    float atten = 3.6 / depth;
    gl_PointSize = clamp(baseSize * atten * uDPR, 1.4, 5.4);

    // Atmospheric fades: smooth boundaries at sides and far horizon beyond the screen top
    float edgeX    = 1.0 - smoothstep(6.8, 8.8, abs(x));
    float nearFade = smoothstep(0.8, 1.8, z);
    float farFade  = 1.0 - smoothstep(14.5, 18.2, z);
    vAlpha = edgeX * nearFade * farFade;
}
`;

    const FS = /* glsl */`
precision mediump float;

varying float vH;
varying float vAlpha;

void main() {
    // Anti-aliased circular point sprite
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Smooth edge transition
    float circle = 1.0 - smoothstep(0.28, 0.50, dist);

    // Glowing core highlight
    float core = 1.0 - smoothstep(0.0, 0.20, dist);

    // Rich institutional cyan/teal palette matching vid.mp4:
    // Deep Teal (#022b49) -> Luminous Cyan (#00a8cc) -> Electric Neon Cyan (#00e5ff) -> Diamond Ice (#e8fcff)
    vec3 cNavy = vec3(0.02, 0.18, 0.35);
    vec3 cTeal = vec3(0.00, 0.65, 0.82);
    vec3 cCyan = vec3(0.10, 0.92, 1.00);
    vec3 cIce  = vec3(0.90, 0.99, 1.00);

    vec3 col;
    if (vH < 0.32) {
        col = mix(cNavy, cTeal, vH / 0.32);
    } else if (vH < 0.72) {
        col = mix(cTeal, cCyan, (vH - 0.32) / 0.40);
    } else {
        col = mix(cCyan, cIce, (vH - 0.72) / 0.28);
    }

    // Inner bright core highlight
    col = mix(col, vec3(1.0), core * 0.55);

    // Controlled alpha for crisp, luminous additive glow without blow-out
    float alpha = circle * vAlpha * (0.70 + vH * 0.55);
    gl_FragColor = vec4(col * alpha, alpha);
}
`;

    /* ── Compile & Link ──────────────────────────────────────────── */
    function mkShader(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.warn('[Radora WebGL]', gl.getShaderInfoLog(s));
            return null;
        }
        return s;
    }

    const prog = gl.createProgram();
    const vs = mkShader(gl.VERTEX_SHADER, VS);
    const fs = mkShader(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) {
        canvas.remove();
        document.body.classList.remove('webgl-active');
        document.body.classList.add('webgl-unavailable');
        return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.warn('[Radora WebGL]', gl.getProgramInfoLog(prog));
        canvas.remove();
        return;
    }
    gl.useProgram(prog);

    /* ── Geometry Setup (Single static VBO) ───────────────────────── */
    const N = COLS * ROWS;
    const uv = new Float32Array(N * 2);
    let k = 0;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            uv[k++] = c / (COLS - 1);
            uv[k++] = r / (ROWS - 1);
        }
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);

    const aUV = gl.getAttribLocation(prog, 'aUV');
    gl.enableVertexAttribArray(aUV);
    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);

    /* ── Uniform Locations ───────────────────────────────────────── */
    const uT      = gl.getUniformLocation(prog, 'uT');
    const uScroll = gl.getUniformLocation(prog, 'uScroll');
    const uMouse  = gl.getUniformLocation(prog, 'uMouse');
    const uAspect = gl.getUniformLocation(prog, 'uAspect');
    const uDPR    = gl.getUniformLocation(prog, 'uDPR');

    /* ── GL State ────────────────────────────────────────────────── */
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);      // Additive glow
    gl.clearColor(0.035, 0.035, 0.05, 1.0);  // Dark canvas clear

    /* ── Resize & Viewport ───────────────────────────────────────── */
    let currentDPR = 1;
    function resize() {
        currentDPR = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width  = (window.innerWidth  * currentDPR) | 0;
        canvas.height = (window.innerHeight * currentDPR) | 0;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform1f(uAspect, canvas.width / canvas.height);
        gl.uniform1f(uDPR, currentDPR);
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    /* ── Interactive Input ───────────────────────────────────────── */
    let mx = 0, my = 0, tx = 0, ty = 0;
    let scroll = 0, tscroll = 0;

    window.addEventListener('pointermove', e => {
        tx = (e.clientX / window.innerWidth  - 0.5) * 2;
        ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    window.addEventListener('scroll', () => {
        const ms = document.documentElement.scrollHeight - window.innerHeight;
        tscroll = ms > 0 ? window.scrollY / ms : 0;
    }, { passive: true });

    /* ── Render Loop ─────────────────────────────────────────────── */
    let paused = false;
    let t0 = performance.now();
    let lastTs = 0;

    const lowEnd = (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 2)
        || (navigator.connection || {}).saveData
        || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frameBudget = lowEnd ? 50 : 1000 / 60;

    document.addEventListener('visibilitychange', () => {
        paused = document.hidden;
        if (!paused) requestAnimationFrame(tick);
    });

    function tick(now) {
        requestAnimationFrame(tick);
        if (paused) return;
        if (now - lastTs < frameBudget - 1) return;
        lastTs = now;

        const t = (now - t0) * 0.001 * WAVE_SPEED;
        mx     += (tx - mx)          * 0.06;
        my     += (ty - my)          * 0.06;
        scroll += (tscroll - scroll) * 0.05;

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(uT,      t);
        gl.uniform1f(uScroll, scroll);
        gl.uniform2f(uMouse,  mx, my);
        gl.uniform1f(uDPR,    currentDPR);
        gl.drawArrays(gl.POINTS, 0, N);
    }

    requestAnimationFrame(tick);
})();
