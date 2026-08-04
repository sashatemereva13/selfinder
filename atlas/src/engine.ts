import * as THREE from "three";
import type { FieldDefinition } from "./types";
import { auraFigureSvg } from "./auraFigureSvg";

const TAU = Math.PI * 2;
export class ConsciousnessEngine {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  private renderer: THREE.WebGLRenderer;
  private clock = new THREE.Clock();
  private group = new THREE.Group();
  private substrate: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private particles?: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  private lines: THREE.Line[] = [];
  private definition: FieldDefinition;
  private resizeObserver: ResizeObserver;
  private animation = 0;
  private observerLoad = 0;
  private observerMaterial?: THREE.ShaderMaterial;
  private observerAuraMaterial?: THREE.MeshBasicMaterial;
  private observerRoot?: THREE.Group;
  private observerLobes: Array<{
    line: THREE.Line;
    centerX: number;
    centerY: number;
    rx: number;
    ry: number;
    index: number;
    side: number;
  }> = [];

  constructor(
    private host: HTMLElement,
    definition: FieldDefinition,
    private format: "lab" | "reel" = "lab",
    private cut: "discovery" | "atlas" | "pure" = "atlas",
    private offline = false,
  ) {
    this.definition = definition;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor(0x06060d, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.append(this.renderer.domElement);
    this.scene.fog = new THREE.FogExp2(0x06060d, 0.055);
    this.substrate = this.buildFractalBackground();
    this.scene.add(this.substrate);
    this.scene.add(this.group);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.setDefinition(definition);
    this.resize();
    if (offline) this.renderAt(0);
    else this.tick();
  }

  setDefinition(definition: FieldDefinition) {
    this.definition = definition;
    if (this.substrate) {
      const uniforms = this.substrate.material.uniforms;
      uniforms.uColor.value.set(definition.color);
      uniforms.uFractal.value = ["mandelbrot", "julia", "apollonian", "sierpinski", "koch"].indexOf(definition.shaderBehavior.fractal);
      uniforms.uSymmetry.value = definition.shaderBehavior.symmetry;
      uniforms.uMotion.value = definition.timeBehavior.speed * (0.08 + definition.motionProfile.pulse * 0.12);
      uniforms.uCoherence.value = definition.spatialCoherence;
      uniforms.uVisibility.value = (this.format === "reel" ? 1.28 : 1) * Math.max(
        .52,
        (0.48 + definition.informationFlow * 0.28) * (1 - definition.lightBehavior.absorption * .28),
      );
      uniforms.uObserverCoupling.value = definition.resonance * .45 + definition.permeability * .35 + Math.abs(definition.gravity.strength) * .2;
    }
    this.group.clear();
    this.observerMaterial = undefined;
    this.observerAuraMaterial = undefined;
    this.observerRoot = undefined;
    this.observerLobes = [];
    this.lines = [];
    this.camera.position.set(0, 0, definition.cameraBehavior.distance);
    this.buildParticles();
    this.buildFieldLines();
    this.buildSvgObserver();
  }

  private buildFractalBackground() {
    const material = new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uLoopPhase: { value: 0 },
        uAspect: { value: 1 },
        uFractal: { value: 0 },
        uSymmetry: { value: 7 },
        uMotion: { value: 0.2 },
        uCoherence: { value: 0.5 },
        uVisibility: { value: 0.06 },
        uObserverCoupling: { value: 0.5 },
        uColor: { value: new THREE.Color(this.definition.color) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uLoopPhase;
        uniform float uAspect;
        uniform float uFractal;
        uniform float uSymmetry;
        uniform float uMotion;
        uniform float uCoherence;
        uniform float uVisibility;
        uniform float uObserverCoupling;
        uniform vec3 uColor;

        const float PI = 3.14159265359;

        mat2 rotate2d(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, -s, s, c);
        }

        float sdBox(vec3 p, vec3 b) {
          vec3 q = abs(p) - b;
          return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
        }

        float sdTorus(vec3 p, vec2 radii) {
          return length(vec2(length(p.xy) - radii.x, p.z)) - radii.y;
        }

        float sdOctahedron(vec3 p, float size) {
          p = abs(p);
          return (p.x + p.y + p.z - size) * 0.57735027;
        }

        vec2 kaleidoscope(vec2 p) {
          float sector = 6.28318530718 / max(3.0, uSymmetry);
          float angle = abs(mod(atan(p.y, p.x) + sector * .5, sector) - sector * .5);
          return length(p) * vec2(cos(angle), sin(angle));
        }

        float recursiveForm(vec3 p) {
          vec3 q = p;
          float scale = 1.0;
          float distanceField = 10.0;
          for (int i = 0; i < 5; i++) {
            q = abs(q) - vec3(.62, .57, .7);
            q.xy *= rotate2d(.72 + float(i) * .13);
            q.yz *= rotate2d(.44);
            float primitive;
            if (uFractal < .5) primitive = abs(length(q) - .48) - .045;
            else if (uFractal < 1.5) primitive = sdTorus(q, vec2(.42, .065));
            else if (uFractal < 2.5) primitive = abs(length(q) - .38) - .055;
            // A hollow recursive cube is a conservative, ray-marchable 3D
            // analogue of the Sierpinski construction. The previous solid
            // box distance could place the camera inside a negative field,
            // causing this entire family to resolve as an empty frame.
            else if (uFractal < 3.5) primitive = abs(sdBox(q, vec3(.34))) - .045;
            else primitive = sdOctahedron(q, .52) - .025;
            distanceField = min(distanceField, primitive / scale);
            q *= 1.58;
            scale *= 1.58;
          }
          return distanceField;
        }

        float mapScene(vec3 p) {
          float travel = uLoopPhase * 4.0;
          p.z += travel;
          float observerDistance = length(p.xy);
          float observerField = exp(-observerDistance * 1.35) * uObserverCoupling;
          p.xy *= 1.0 + observerField * (.12 + sin(p.z * .7) * .035);
          p.xy = kaleidoscope(p.xy);
          p.xy *= rotate2d((sin(p.z * .24) + sin(uTime) * .08) * .34);
          vec3 repeated = mod(p + 2.0, 4.0) - 2.0;
          float architecture = recursiveForm(repeated);
          float corridor = abs(length(p.xy) - (1.68 + sin(p.z * .55) * .18)) - .035;
          return min(architecture, corridor);
        }

        vec3 normalAt(vec3 p) {
          vec2 e = vec2(.0025, 0.0);
          return normalize(vec3(
            mapScene(p + e.xyy) - mapScene(p - e.xyy),
            mapScene(p + e.yxy) - mapScene(p - e.yxy),
            mapScene(p + e.yyx) - mapScene(p - e.yyx)
          ));
        }

        void main() {
          vec2 uv = (vUv - .5) * 2.0;
          // The perspective camera has already cropped this square shader
          // plane to the viewport aspect. Applying uAspect here again made
          // portrait/Reel renders horizontally compressed.
          vec3 rayOrigin = vec3(0.0, 0.0, -3.2);
          vec3 rayDirection = normalize(vec3(uv * .72, 1.35));
          float distanceTravelled = 0.0;
          float glow = 0.0;
          float hit = 0.0;
          vec3 point = rayOrigin;

          for (int i = 0; i < 72; i++) {
            point = rayOrigin + rayDirection * distanceTravelled;
            float distanceToSurface = mapScene(point);
            glow += .0015 / (.018 + abs(distanceToSurface));
            if (distanceToSurface < .0025) { hit = 1.0; break; }
            distanceTravelled += max(distanceToSurface * .68, .008);
            if (distanceTravelled > 18.0) break;
          }

          vec3 base = vec3(.012, .014, .025);
          vec3 color = base;
          if (hit > .5) {
            vec3 normal = normalAt(point);
            // PhilosopherObject's construction-line language translated to
            // the ray-marched architecture: transparent faces, crisp outer
            // contours, and repeated meridian/facet lines across the form.
            float rim = pow(1.0 - abs(dot(normal, -rayDirection)), 3.8);
            vec3 local = mod(point + 2.0, 4.0) - 2.0;
            float longitude = abs(sin(atan(local.y, local.x) * max(3.0, uSymmetry)));
            float latitude = abs(sin(local.z * 5.2 + length(local.xy) * 1.7));
            float facet = min(longitude, latitude);
            float construction = 1.0 - smoothstep(.035, .16, facet);
            float section = 1.0 - smoothstep(.025, .11, abs(sin((local.x + local.y - local.z) * 4.0)));
            float linework = clamp(rim * 1.25 + construction * .72 + section * .28, 0.0, 1.0);
            float depthFade = exp(-distanceTravelled * .055);
            vec3 ink = mix(uColor, vec3(.94, .89, .81), .18);
            color += ink * linework * depthFade * uVisibility * 1.35;
            color += uColor * construction * rim * depthFade * uVisibility * .45;
          }
          // A very faint depth trace preserves the endless corridor without
          // turning its empty faces back into shaded surfaces.
          color += uColor * min(glow * .006, .075) * uVisibility;
          float chestField = exp(-length(uv - vec2(0.0, .05)) * 4.2);
          color += uColor * chestField * uObserverCoupling * .075;
          float vignette = 1.0 - smoothstep(.55, 1.35, length(uv));
          color = mix(base, color, .3 + vignette * .7);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), material);
    mesh.position.z = -5;
    mesh.renderOrder = -100;
    return mesh;
  }

  private buildSvgObserver() {
    const loadId = ++this.observerLoad;
    const color = `#${new THREE.Color(this.definition.color).getHexString()}`;
    const svg = auraFigureSvg(color);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    new THREE.TextureLoader().load(dataUrl, (texture) => {
      if (loadId !== this.observerLoad) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.NormalBlending,
        uniforms: {
          uMap: { value: texture },
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(this.definition.color) },
          uResonance: { value: this.definition.resonance },
          uReveal: { value: 1 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform sampler2D uMap;
          uniform float uTime;
          uniform float uResonance;
          uniform float uReveal;
          uniform vec3 uColor;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }

          void main() {
            vec4 source = texture2D(uMap, vUv);
            if (source.a < .012) discard;

            // Slow recursive illumination passes through the silhouette. It
            // shares the scene's loop phase, so the observer feels exposed to
            // the same field rather than uniformly pasted above it.
            vec2 p = (vUv - .5) * vec2(1.0, 1.75);
            float rings = .5 + .5 * sin(length(p) * 34.0 - uTime * 2.0);
            float filaments = .5 + .5 * sin((p.x * 15.0 + p.y * 9.0) + sin(uTime) * 1.4);
            float grain = hash(floor(vUv * vec2(180.0, 315.0)) + floor(uTime / 6.28318));
            float internalLight = mix(.38, .86, rings * .46 + filaments * .34 + grain * .2);
            float chest = exp(-length((vUv - vec2(.5, .455)) * vec2(1.0, 1.5)) * 15.0);
            vec3 body = mix(uColor * internalLight, source.rgb, .24 + chest * .48);
            float livingAlpha = source.a * (.58 + internalLight * .3 + uResonance * .08) * uReveal;
            gl_FragColor = vec4(body, livingAlpha);
          }
        `,
      });
      this.observerMaterial = material;
      const geometry = new THREE.PlaneGeometry(1, 1);
      const observerRoot = new THREE.Group();
      this.observerRoot = observerRoot;
      const sprite = new THREE.Mesh(geometry, material);
      // In portrait production mode the observer occupies roughly one third
      // of the frame and sits above the copy. This leaves the lower-left and
      // right edge available for Instagram's account/caption and action rail.
      const discovery = this.format === "reel" && this.cut === "discovery";
      const atlasReel = this.format === "reel" && this.cut === "atlas";
      const height = discovery ? .9 : atlasReel ? .58 : this.format === "reel" ? 1.16 : 1.52;
      sprite.scale.set(height * (240 / 420), height, 1);
      sprite.position.set(0, 0, .42);
      sprite.renderOrder = 120;
      observerRoot.position.set(
        discovery ? .32 : atlasReel ? 0 : this.format === "reel" ? -.12 : 0,
        discovery ? -.42 : atlasReel ? -.12 : this.format === "reel" ? .46 : .16,
        0,
      );
      observerRoot.add(sprite);

      // A broader additive echo replaces the SVG's formerly uniform glow
      // with light that appears to leak into the surrounding volume.
      const auraMaterial = new THREE.MeshBasicMaterial({ map: texture, color, transparent: true, opacity: .13, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false });
      this.observerAuraMaterial = auraMaterial;
      const aura = new THREE.Mesh(geometry.clone(), auraMaterial);
      aura.scale.copy(sprite.scale).multiplyScalar(1.065);
      aura.position.copy(sprite.position).add(new THREE.Vector3(0, 0, -.025));
      aura.renderOrder = 119;
      observerRoot.add(aura);

      // Exact measured-state language from mobile AuraField: each field is a
      // mirrored pair of vertical ellipses meeting at the chest. The body is
      // their narrow throat rather than an object placed in front of them.
      const chestY = sprite.position.y + height * ((190 - 148) / 420);
      for (let i = 0; i < 4; i++) {
        const ry = height * (.25 + i * .075);
        const rx = ry * .42;
        const lobeMaterial = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: .18 + i * .035,
          blending: THREE.AdditiveBlending,
          depthTest: false,
          depthWrite: false,
        });
        for (const side of [-1, 1]) {
          const curve = new THREE.EllipseCurve(sprite.position.x + side * rx, chestY, rx, ry, 0, TAU);
          const points = curve.getPoints(128).map((p) => new THREE.Vector3(p.x, p.y, .37));
          const lobe = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), lobeMaterial);
          lobe.renderOrder = 118;
          this.observerLobes.push({ line: lobe, centerX: sprite.position.x + side * rx, centerY: chestY, rx, ry, index: i, side });
          observerRoot.add(lobe);
        }
      }
      this.group.add(observerRoot);
      if (this.offline) this.renderAt(0);
    }, undefined, (error) => {
      console.error("Selfinder aura SVG texture failed to load", error);
    });
  }

  private buildObserver() {
    // Faithful Three.js translation of mobile/src/components/AuraFigure.tsx's
    // 200 × 380 SVG primitives. In the Atlas, both the body and its aura
    // inherit the current field color so the observer visibly belongs to the
    // active vibration.
    const observer = new THREE.Group();
    const fieldColor = new THREE.Color(this.definition.color);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: fieldColor, depthTest: false, depthWrite: false });
    const glow = new THREE.MeshBasicMaterial({ color: fieldColor, transparent: true, opacity: .12, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false });
    const scale = .0065;
    const point = (x: number, y: number) => new THREE.Vector2((x - 100) * scale, (190 - y) * scale);

    const ellipse = (cx: number, cy: number, rx: number, ry: number, material: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 64), material);
      const center = point(cx, cy);
      mesh.position.set(center.x, center.y, 0);
      mesh.scale.set(rx * scale, ry * scale, 1);
      return mesh;
    };
    const polygon = (coordinates: Array<[number, number]>, material: THREE.Material) => {
      const shape = new THREE.Shape();
      coordinates.forEach(([x, y], i) => { const p = point(x, y); i ? shape.lineTo(p.x, p.y) : shape.moveTo(p.x, p.y); });
      shape.closePath();
      return new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
    };
    const bodyLayer = (material: THREE.Material) => {
      const layer = new THREE.Group();
      layer.add(
        ellipse(100, 40, 23, 23, material),
        polygon([[86,54],[114,54],[114,98],[86,98]], material),
        ellipse(100, 148, 32, 52, material),
        polygon([[78,88],[58,96],[46,192],[62,196]], material),
        polygon([[122,88],[142,96],[154,192],[138,196]], material),
        polygon([[93,196],[74,199],[66,320],[88,324]], material),
        polygon([[107,196],[126,199],[134,320],[112,324]], material),
        ellipse(53,193,13,13,material), ellipse(147,193,13,13,material),
        ellipse(75,330,17,10,material), ellipse(125,330,17,10,material),
      );
      return layer;
    };

    const glowLayer = bodyLayer(glow);
    glowLayer.scale.setScalar(1.09);
    glowLayer.position.z = -.025;
    observer.add(glowLayer, bodyLayer(bodyMaterial));

    // Mobile aura's luminous chest core, approximated with nested additive
    // discs so it remains GPU-cheap and crisp in a looping reel.
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const coreMaterial = new THREE.MeshBasicMaterial({
        color: i < 2 ? 0xfff9ef : fieldColor,
        transparent: true,
        opacity: (1 - t) * .13,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      });
      const core = ellipse(100, 148, 13 + i * 4.2, 13 + i * 4.2, coreMaterial);
      core.position.z = .025 + i * .0001;
      observer.add(core);
    }

    // The same two-lobed field language used by AuraField in the mobile app.
    for (let i = 0; i < 4; i++) {
      const ry = .56 + i * .14;
      const rx = ry * .42;
      const lineMaterial = new THREE.LineBasicMaterial({ color: fieldColor, transparent: true, opacity: .12 + i * .025, depthTest: false });
      for (const side of [-1, 1]) {
        const curve = new THREE.EllipseCurve(side * rx, .27, rx, ry, 0, TAU);
        const lobe = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(curve.getPoints(96).map((p) => new THREE.Vector3(p.x, p.y, -.04))), lineMaterial);
        observer.add(lobe);
      }
    }

    // Deterministic aura dust concentrated around the silhouette.
    const dotCount = 180;
    const dotPositions = new Float32Array(dotCount * 3);
    for (let i = 0; i < dotCount; i++) {
      const angle = i * 2.399963;
      const radius = .28 + ((i * 37) % 100) / 100 * .58;
      dotPositions[i * 3] = Math.cos(angle) * radius * .72;
      dotPositions[i * 3 + 1] = .18 + Math.sin(angle) * radius * 1.48;
      dotPositions[i * 3 + 2] = .04;
    }
    const dotsGeometry = new THREE.BufferGeometry();
    dotsGeometry.setAttribute("position", new THREE.BufferAttribute(dotPositions, 3));
    observer.add(new THREE.Points(dotsGeometry, new THREE.PointsMaterial({ color: fieldColor, size: .012, transparent: true, opacity: .34, blending: THREE.AdditiveBlending, depthTest: false })));
    observer.renderOrder = 100;
    this.group.add(observer);
  }

  private point(i: number, count: number) {
    const d = this.definition;
    const u = i / count;
    const a = u * TAU * d.shaderBehavior.symmetry;
    const v = ((i * 0.61803398875) % 1) * 2 - 1;
    const shell = Math.sqrt(1 - v * v);
    switch (d.dominantGeometry.primary) {
      case "fragments": return new THREE.Vector3(Math.cos(a) * (1.2 + shell), v * 1.8, Math.sin(a) * (1.2 + shell));
      case "rings": return new THREE.Vector3(Math.cos(a) * shell * 1.75, v * 1.75, Math.sin(a) * shell * 1.75);
      case "cloud": return new THREE.Vector3(Math.cos(a) * shell * 1.9, v * 1.35, Math.sin(a) * shell * 1.9);
      case "voids": return new THREE.Vector3(Math.cos(a) * (1.05 + shell * .8), v * 1.8, Math.sin(a) * (1.05 + shell * .8));
      case "tunnel": return new THREE.Vector3(Math.cos(a) * (.25 + u * 1.7), Math.sin(a) * (.25 + u * 1.7), (u - .5) * 3.5);
      case "membrane": return new THREE.Vector3((u - .5) * 4, Math.sin(a) * .38, v * .7);
      case "spiral": return new THREE.Vector3(Math.cos(a) * u * 2, (u - .5) * 3.2, Math.sin(a) * u * 2);
      case "cracks": return new THREE.Vector3(Math.cos(a) * shell * 1.7, v * 2, Math.sin(a) * shell * 1.7).multiplyScalar(.75 + .25 * Math.round(u * 4));
      case "cone": return new THREE.Vector3(Math.cos(a) * u * 1.5, (u - .5) * 3.2, Math.sin(a) * u * 1.5);
      case "lattice": return new THREE.Vector3(((i % 13) - 6) * .27, ((Math.floor(i / 13) % 13) - 6) * .27, ((Math.floor(i / 169) % 9) - 4) * .27);
      case "network": return new THREE.Vector3(Math.cos(a) * shell * 1.75, v * 1.75, Math.sin(a * 2) * shell * 1.2);
      case "light": return new THREE.Vector3(Math.cos(a) * shell * 2.2, v * 2.2, Math.sin(a) * shell * 2.2);
      default: return new THREE.Vector3(Math.cos(a) * shell * 1.65, v * 1.65, Math.sin(a) * shell * 1.65);
    }
  }

  private buildParticles() {
    // The philosopher picker never uses floating dots: every mark is a
    // relationship between points. Translate the former particle cloud into
    // many short construction segments while retaining each field's DNA.
    const segmentCount = Math.round(260 + this.definition.informationFlow * 520);
    const positions = new Float32Array(segmentCount * 2 * 3);
    for (let i = 0; i < segmentCount; i++) {
      const start = this.point(i, segmentCount);
      const end = this.point((i + 1 + Math.round(this.definition.resonance * 5)) % segmentCount, segmentCount);
      const length = .035 + this.definition.particleBehavior.cohesion * .055;
      end.sub(start).normalize().multiplyScalar(length).add(start);
      start.toArray(positions, i * 6);
      end.toArray(positions, i * 6 + 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.particles = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
      color: this.definition.color,
      transparent: true,
      opacity: this.definition.particleBehavior.visibility * .36,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    this.group.add(this.particles);
  }

  private buildFieldLines() {
    const fieldLineCount = Math.round(3 + this.definition.fieldLines.density * 12);
    for (let n = 0; n < fieldLineCount; n++) {
      const radius = 1.15 + n * 0.065;
      const points = Array.from({ length: 180 }, (_, i) => {
        const a = i / 179 * TAU;
        const wobble = Math.sin(a * this.definition.shaderBehavior.symmetry + n) * this.definition.entropy * this.definition.fieldLines.tremor * .14;
        return new THREE.Vector3(Math.cos(a) * (radius + wobble), Math.sin(a) * (radius + wobble), Math.sin(a * 2 + n) * .34);
      });
      const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: this.definition.color, transparent: true, opacity: this.definition.fieldLines.integrity * (0.045 + n * .009) }));
      line.rotation.set(n * .17, n * .29, n * .11);
      this.lines.push(line);
      this.group.add(line);
    }
  }

  private tick = () => {
    this.animation = requestAnimationFrame(this.tick);
    this.renderAt(this.clock.getElapsedTime());
  };

  renderAt(elapsed: number) {
    // All reel motion is derived from a 12-second phase. Sinusoidal movement
    // and the shader's four-unit travel period therefore return exactly to
    // their opening values at the loop boundary.
    const loopDuration = this.cut === "discovery" ? 7 : this.cut === "pure" ? 6 : 12;
    const loopPhase = (elapsed % loopDuration) / loopDuration;
    const t = loopPhase * TAU;
    const discoveryReveal = this.cut === "discovery"
      ? THREE.MathUtils.smoothstep(loopPhase, .12, .29) * (1 - THREE.MathUtils.smoothstep(loopPhase, .9, 1))
      : 1;
    if (this.observerMaterial) {
      this.observerMaterial.uniforms.uTime.value = t;
      this.observerMaterial.uniforms.uReveal.value = discoveryReveal;
    }
    if (this.observerAuraMaterial) this.observerAuraMaterial.opacity = .13 * discoveryReveal;
    if (this.observerRoot) {
      const vibration = (.006 + this.definition.fieldLines.tremor * .028 + this.definition.entropy * .012)
        * (.45 + this.definition.timeBehavior.speed * .55);
      const cycles = 1 + Math.round(this.definition.timeBehavior.speed * 2);
      const atlasReel = this.cut === "atlas" && this.format === "reel";
      const baseX = this.cut === "discovery" && this.format === "reel" ? .32 : atlasReel ? 0 : this.format === "reel" ? -.12 : 0;
      const baseY = this.cut === "discovery" && this.format === "reel" ? -.42 : atlasReel ? -.12 : this.format === "reel" ? .46 : .16;
      this.observerRoot.position.x = baseX + Math.sin(t * cycles) * vibration + Math.sin(t * 3) * vibration * .35;
      this.observerRoot.position.y = baseY + Math.cos(t * (cycles + 1)) * vibration * .72 + Math.sin(t * 2) * vibration * .28;
      this.observerRoot.rotation.z = Math.sin(t * cycles + .7) * vibration * .7;
      const pulseScale = 1 + Math.sin(t * 2 - .4) * vibration * .5;
      this.observerRoot.scale.set(pulseScale * (1 + Math.sin(t * 3) * vibration * .18), pulseScale, 1);
    }
    this.observerLobes.forEach(({ line, centerX, centerY, rx, ry, index, side }) => {
      const positions = line.geometry.getAttribute("position") as THREE.BufferAttribute;
      const cycles = 1 + Math.round(this.definition.timeBehavior.speed * 2.4);
      const sharedPhase = t * cycles;
      const independentPhase = index * (1 - this.definition.resonance) * 1.37 + (side < 0 ? .43 : 0);
      const amplitude = (.009 + this.definition.fieldLines.tremor * .048 + this.definition.entropy * .02)
        * (.5 + this.definition.timeBehavior.speed * .72);
      const impulse = 1 + Math.pow(Math.max(0, Math.sin(t)), 8) * this.definition.motionProfile.acceleration * 2.2;
      const gravityX = this.definition.gravity.direction[0] * this.definition.gravity.strength * Math.sin(t) * .035;
      const gravityY = this.definition.gravity.direction[1] * this.definition.gravity.strength * Math.sin(t) * .035;
      const harmonics = Math.max(2, Math.round(this.definition.shaderBehavior.symmetry * .55));

      for (let pointIndex = 0; pointIndex < positions.count; pointIndex++) {
        const angle = pointIndex / (positions.count - 1) * TAU;
        const vibration = Math.sin(angle * harmonics + sharedPhase + independentPhase) * amplitude * impulse;
        const resonanceWave = Math.sin(angle * 2 - sharedPhase) * this.definition.resonance * .015;
        const horizontal = rx * (1 + vibration + resonanceWave);
        const vertical = ry * (1 + vibration * .55 - resonanceWave * .35);
        positions.setXYZ(
          pointIndex,
          centerX + Math.cos(angle) * horizontal + gravityX,
          centerY + Math.sin(angle) * vertical + gravityY,
          .37,
        );
      }
      positions.needsUpdate = true;
      const material = line.material as THREE.LineBasicMaterial;
      material.opacity = (.2 + this.definition.fieldLines.integrity * .42)
        * (1 - this.definition.lightBehavior.absorption * .12)
        * (1 + Math.sin(sharedPhase + independentPhase) * this.definition.fieldLines.tremor * .2)
        * discoveryReveal;
    });
    this.substrate.material.uniforms.uLoopPhase.value = loopPhase;
    this.substrate.material.uniforms.uTime.value = t;
    const pulse = 1 + Math.sin(t) * this.definition.motionProfile.pulse * 0.04;
    if (this.particles) {
      const direction = this.definition.gravity.direction;
      this.particles.rotation.y = Math.sin(t) * this.definition.cameraBehavior.orbit * 8;
      this.particles.rotation.z = Math.sin(t) * (.02 + this.definition.shaderBehavior.distortion * .08);
      const gravityPulse = 1 - Math.sin(t) * this.definition.gravity.strength * .012;
      const collapse = 1 - (.035 + this.definition.gravity.strength * .045) * (.5 + .5 * Math.sin(t));
      this.particles.scale.setScalar(
        this.definition.particleBehavior.mode === "breathe" ? pulse
          : this.definition.particleBehavior.mode === "collapse" ? collapse
          : gravityPulse,
      );
      this.particles.position.set(direction[0], direction[1], direction[2]).multiplyScalar(Math.sin(t) * this.definition.gravity.strength * .08);
    }
    this.lines.forEach((line, i) => { line.rotation.z = i * .11 + Math.sin(t) * (.012 + i * .001) * (1 + this.definition.informationFlow); });
    this.group.rotation.y = Math.sin(t) * this.definition.cameraBehavior.orbit * 5;
    this.camera.position.x = Math.sin(t * 2) * this.definition.cameraBehavior.shake * .08;
    this.camera.position.y = Math.sin(t) * this.definition.cameraBehavior.drift * .08;
    this.renderer.render(this.scene, this.camera);
  }

  private resize() {
    const { clientWidth: width, clientHeight: height } = this.host;
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
    this.substrate.material.uniforms.uAspect.value = width / Math.max(height, 1);
    this.renderer.setSize(width, height, false);
  }

  dispose() { cancelAnimationFrame(this.animation); this.resizeObserver.disconnect(); this.substrate.geometry.dispose(); this.substrate.material.dispose(); this.renderer.dispose(); this.host.replaceChildren(); }
}
