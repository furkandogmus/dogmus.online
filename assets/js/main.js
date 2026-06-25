// Yıl bilgisi
(function () {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

// Tema değiştirme (açık / koyu) — tercih localStorage'da saklanır
(function () {
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = saved || (prefersDark ? "dark" : "light");

  apply(initial);

  if (toggle) {
    toggle.addEventListener("click", function () {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      localStorage.setItem("theme", next);
    });
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    if (toggle) toggle.textContent = theme === "dark" ? "☀️" : "🌙";
  }
})();

// Hero atmosferi — hafif WebGL katmanı
(function () {
  const canvas = document.getElementById("hero-webgl");
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReducedMotion.matches) return;

  const gl =
    canvas.getContext("webgl", { alpha: true, antialias: true }) ||
    canvas.getContext("experimental-webgl", { alpha: true, antialias: true });
  if (!gl) {
    canvas.style.display = "none";
    return;
  }

  const vertexSource = `
    attribute vec2 aPosition;
    varying vec2 vUv;

    void main() {
      vUv = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision mediump float;

    varying vec2 vUv;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uTheme;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 345.45));
      p += dot(p, p + 34.345);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p);
        p *= 2.03;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 uv = vUv;
      vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
      float t = uTime * 0.055;

      vec3 dayTop = vec3(0.72, 0.83, 0.74);
      vec3 dayBottom = vec3(1.0, 0.78, 0.49);
      vec3 nightTop = vec3(0.07, 0.13, 0.20);
      vec3 nightBottom = vec3(0.23, 0.31, 0.30);
      vec3 sky = mix(mix(dayBottom, dayTop, uv.y), mix(nightBottom, nightTop, uv.y), uTheme);

      vec2 cloudUv = vec2(uv.x * aspect.x * 2.0 - t, uv.y * 1.4 + sin(t) * 0.05);
      float cloud = smoothstep(0.46, 0.78, fbm(cloudUv * 2.25));
      cloud *= smoothstep(0.05, 0.55, uv.y) * smoothstep(1.05, 0.55, uv.y);
      vec3 cloudColor = mix(vec3(1.0, 0.92, 0.72), vec3(0.65, 0.76, 0.82), uTheme);
      sky = mix(sky, cloudColor, cloud * mix(0.28, 0.18, uTheme));

      vec2 sunPos = vec2(0.82, 0.72);
      vec2 moonPos = vec2(0.86, 0.62);
      float sunGlow = 1.0 - smoothstep(0.0, 0.56, distance((uv - sunPos) * aspect, vec2(0.0)));
      float moonGlow = 1.0 - smoothstep(0.0, 0.44, distance((uv - moonPos) * aspect, vec2(0.0)));
      sky += vec3(1.0, 0.74, 0.30) * sunGlow * (1.0 - uTheme) * 0.34;
      sky += vec3(0.54, 0.71, 0.94) * moonGlow * uTheme * 0.3;

      float meadow = smoothstep(0.16, 0.0, uv.y);
      vec3 meadowColor = mix(vec3(0.54, 0.63, 0.34), vec3(0.18, 0.35, 0.28), uTheme);
      sky = mix(sky, meadowColor, meadow * 0.36);

      float specks = 0.0;
      vec2 gridUv = uv * vec2(30.0, 18.0);
      vec2 cell = floor(gridUv);
      vec2 local = fract(gridUv) - 0.5;
      float sparkleSeed = hash(cell);
      float blink = 0.45 + 0.55 * sin(uTime * 0.9 + sparkleSeed * 8.0);
      float star = smoothstep(0.04, 0.0, length(local));
      specks += star * step(0.965, sparkleSeed) * blink * smoothstep(0.32, 0.82, uv.y);

      vec2 dustUv = fract(gridUv + vec2(t * 1.8, sin(t + uv.x) * 0.35)) - 0.5;
      float dustSeed = hash(cell + 18.0);
      float dust = smoothstep(0.08, 0.0, length(dustUv));
      specks += dust * step(0.955, dustSeed) * (1.0 - uTheme) * 0.5;

      sky += mix(vec3(1.0, 0.82, 0.45), vec3(0.75, 0.9, 1.0), uTheme) * specks * 0.65;

      float vignette = smoothstep(0.98, 0.18, distance(uv, vec2(0.5, 0.5)));
      vec3 color = sky * (0.78 + vignette * 0.22);
      gl_FragColor = vec4(color, 0.62);
    }
  `;

  const program = createProgram(vertexSource, fragmentSource);
  if (!program) {
    canvas.style.display = "none";
    return;
  }

  const positionLocation = gl.getAttribLocation(program, "aPosition");
  const resolutionLocation = gl.getUniformLocation(program, "uResolution");
  const timeLocation = gl.getUniformLocation(program, "uTime");
  const themeLocation = gl.getUniformLocation(program, "uTheme");
  const buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );
  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let width = 0;
  let height = 0;
  let frameId = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
    const nextHeight = Math.max(1, Math.floor(rect.height * dpr));
    if (nextWidth === width && nextHeight === height) return;

    width = nextWidth;
    height = nextHeight;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }

  function render(time) {
    resize();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(resolutionLocation, width, height);
    gl.uniform1f(timeLocation, time * 0.001);
    gl.uniform1f(themeLocation, document.documentElement.getAttribute("data-theme") === "dark" ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    frameId = window.requestAnimationFrame(render);
  }

  window.addEventListener("resize", resize, { passive: true });
  prefersReducedMotion.addEventListener("change", function (event) {
    if (event.matches) {
      window.cancelAnimationFrame(frameId);
      canvas.style.display = "none";
    } else {
      canvas.style.display = "block";
      frameId = window.requestAnimationFrame(render);
    }
  });

  frameId = window.requestAnimationFrame(render);

  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  }

  function createProgram(vertex, fragment) {
    const vertexShader = createShader(gl.VERTEX_SHADER, vertex);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragment);
    if (!vertexShader || !fragmentShader) return null;

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) return shaderProgram;

    gl.deleteProgram(shaderProgram);
    return null;
  }
})();

// Proje slider — kesintisiz döngü için kartları çoğalt
(function () {
  const track = document.querySelector(".project-track");
  if (!track) return;
  const cards = Array.from(track.children);
  cards.forEach(function (card) {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.tabIndex = -1;
    track.appendChild(clone);
  });
})();
