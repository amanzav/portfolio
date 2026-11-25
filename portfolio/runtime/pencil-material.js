import * as THREE from 'three';

export function createPencilMaterial(originalMaterial, geometry) {
  const color = originalMaterial.color ?? new THREE.Color(0xffffff);
  const luminance = color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
  const hardware = 1 - THREE.MathUtils.smoothstep(luminance, 0.17, 0.64);
  if (geometry && !geometry.boundingBox) geometry.computeBoundingBox();
  const bounds = geometry?.boundingBox;
  const boundsMin = bounds?.min.clone() ?? new THREE.Vector3();
  const boundsSize = bounds?.getSize(new THREE.Vector3()) ?? new THREE.Vector3(1, 1, 1);
  const elongatedHousing = geometry?.type === 'ExtrudeGeometry' && boundsSize.x > 1;

  return new THREE.ShaderMaterial({
    name: 'Paper graphite',
    toneMapped: false,
    side: originalMaterial.side ?? THREE.FrontSide,
    clipping: true,
    uniforms: {
      graphiteReveal: { value: 1 },
      paperOpacity: { value: 1 },
      graphiteBase: { value: THREE.MathUtils.lerp(0.998, 0.4, hardware) },
      hardwareAmount: { value: hardware },
      pencilLight: { value: new THREE.Vector3(-0.5, 0.8, 1).normalize() },
      boundsMin: { value: boundsMin },
      boundsSize: { value: boundsSize },
      elongatedHousing: { value: Number(elongatedHousing) },
    },
    vertexShader: /* glsl */`
      #include <clipping_planes_pars_vertex>
      varying vec3 paperPosition;
      varying vec3 paperNormal;
      varying vec3 worldNormal;

      void main() {
        paperPosition = position;
        paperNormal = normalize(normal);
        vec3 viewNormal = normalize(normalMatrix * normal);
        worldNormal = vec3(
          dot(viewMatrix[0].xyz, viewNormal),
          dot(viewMatrix[1].xyz, viewNormal),
          dot(viewMatrix[2].xyz, viewNormal)
        );
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }
    `,
    fragmentShader: /* glsl */`
      #include <clipping_planes_pars_fragment>
      uniform float graphiteReveal;
      uniform float paperOpacity;
      uniform float graphiteBase;
      uniform float hardwareAmount;
      uniform vec3 pencilLight;
      uniform vec3 boundsMin;
      uniform vec3 boundsSize;
      uniform float elongatedHousing;
      varying vec3 paperPosition;
      varying vec3 paperNormal;
      varying vec3 worldNormal;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 cell = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), f.x),
                   mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), f.x), f.y);
      }

      float strokes(vec2 uv, float direction, float frequency, float seed) {
        float along = dot(uv, normalize(vec2(1.0, direction)));
        float across = dot(uv, normalize(vec2(-direction, 1.0)));
        float bend = noise(vec2(along * 6.0, across * 9.0 + seed)) - 0.5;
        float phase = across * frequency + bend * 0.16;
        float row = floor(phase + 0.5);
        float distanceToLine = abs(fract(phase + 0.5) - 0.5);
        float pressure = noise(vec2(along * 16.0 + seed, row * 0.73));
        float halfWidth = mix(0.025, 0.065, pressure);
        float aa = max(fwidth(phase) * 0.6, 0.008);
        float line = 1.0 - smoothstep(halfWidth - aa, halfWidth + aa, distanceToLine);

        float section = along * 3.6 + hash(vec2(row, seed)) * 4.0;
        float ends = smoothstep(0.03, 0.18, fract(section))
                   * (1.0 - smoothstep(0.68, 0.99, fract(section)));
        float graphite = mix(0.55, 1.0, noise(uv * 145.0 + seed));
        return line * mix(0.22, 1.0, ends) * graphite;
      }

      vec2 hatchLayers(vec2 uv) {
        return vec2(strokes(uv, 0.85, 18.0, 5.7),
                    strokes(uv, -1.15, 23.0, 31.2));
      }

      void main() {
        #include <clipping_planes_fragment>
        vec3 normal = normalize(worldNormal);
        if (!gl_FrontFacing) normal = -normal;
        float facingLight = dot(normal, pencilLight);
        float shade = 1.0 - smoothstep(-0.35, 0.74, facingLight);
        vec3 relativePosition = (paperPosition - boundsMin) / max(boundsSize, vec3(0.0001));
        float lowerQuarter = 1.0 - smoothstep(0.14, 0.36, relativePosition.y);
        float endFade = smoothstep(0.035, 0.20, relativePosition.x)
                      * (1.0 - smoothstep(0.80, 0.965, relativePosition.x));
        float broadFace = smoothstep(0.65, 0.95, abs(normalize(paperNormal).z));
        float formShade = elongatedHousing * lowerQuarter * endFade * broadFace * 0.86;
        shade = max(shade, formShade);
        float primaryWeight = smoothstep(0.18, 0.65, shade);
        float crossWeight = smoothstep(0.73, 0.98, shade);

        // Object-space triplanar strokes stay attached to each rigid housing.
        vec3 blend = pow(abs(normalize(paperNormal)), vec3(8.0));
        blend /= max(blend.x + blend.y + blend.z, 0.0001);
        vec2 hatch = hatchLayers(paperPosition.yz) * blend.x
                   + hatchLayers(paperPosition.xz) * blend.y
                   + hatchLayers(paperPosition.xy) * blend.z;

        float softGraphite = pow(shade, 2.0) * 0.045;
        float marks = hatch.x * primaryWeight * 0.70
                    + hatch.y * crossWeight * 0.35;
        float intensity = graphiteBase - softGraphite - marks;
        intensity -= hardwareAmount * shade * 0.065;
        vec3 graphite = mix(vec3(1.0), vec3(clamp(intensity, 0.20, 1.0)), graphiteReveal);
        gl_FragColor = vec4(graphite, paperOpacity);
        #include <colorspace_fragment>
      }
    `,
  });
}
