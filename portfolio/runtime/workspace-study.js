import './lateral-study.css';
import './workspace-study.css';
import './assets/aman-pencil.css';
import backIcon from './assets/pencil-back.svg?raw';
import { createPencilContactLinks } from './pencil-contact-icons.js';
import { createCompanyMark } from './company-marks.js';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createArmModel } from './arm-model.js';
import { createPencilMaterial } from './pencil-material.js';
import { createPencilContours } from './pencil-contours.js';
import { REST_POSE, applyArmPose } from './motion-study.js';
import { solveBoundedFollow } from './bounded-follow.js';
import { createCameraStudyRig } from './camera-rig.js';
import { sampleCarryWorkspace } from './carry-workspace.js';
import { chooseHomeGripFraction, createHomeCarryWorkspace } from './home-carry.js';
import { createCaptionCarryWorkspace, sampleCaptionCarryWorkspace } from './caption-carry.js';
import { sampleGlyphUnfold } from './glyph-unfold.js';
import { workspaceLayout, workspaceOffset, projectWorkspace, workspaceGrip } from './workspace-layout.js';
import { pointerMovedSinceLanding } from './arm-round-trip.js';
import { EXPERIENCE_NOTES } from './experience-notes.js';
import { experienceReadingLayout } from './experience-layout.js';
import { configureExperienceWorkspace } from './experience-workspace.js';
import { createExperienceFollow } from './experience-follow.js';
import { magneticBlockRepulsion, settleSpring } from './text-repulsion.js';
import { portfolioFlowField } from './portfolio-field.js';
import { configurePhoneWorkspace } from './phone-workspace.js';
import { createArmEntrance } from './arm-entrance.js';

export function mountPortfolio(root) {
  const controller = new AbortController();
  const cleanup = [];
  let disposed = false;
  let ready = false;
  let stopRuntime = () => {};

  function dispose() {
    if (disposed) return;
    disposed = true;
    controller.abort();
    stopRuntime();
    for (const release of cleanup.reverse()) {
      try { release(); } catch { /* A lost GPU context must not block other cleanup. */ }
    }
    root.classList.remove('portfolio-preview', 'phone-preview');
    delete root.dataset.ready;
  }
  function fail() {
    dispose();
    root.dispatchEvent(new Event('portfolio-error'));
  }
  function runSafely(action) {
    if (disposed) return;
    try { action(); }
    catch { fail(); }
  }
  function on(target, type, listener, options = {}) {
    target?.addEventListener(type, event => runSafely(() => listener.call(target, event)),
      { ...options, signal: controller.signal });
  }

  try {
    const canvas = root.querySelector('canvas');
    canvas.setAttribute('aria-label', 'Pencil robotic arm carrying a title into place, releasing it, and returning ready for the reverse pickup');
    const stage = canvas.parentElement;
    const main = root.matches('main') ? root : root.querySelector('main');
    main.classList.add('workspace-study');
    const header = root.querySelector('header');
    root.classList.add('portfolio-preview');
    header.innerHTML = '<h1>I’m <span class="pencil-name">Aman</span>, a mechatronics student at Waterloo.</h1><p>Currently building AI systems at Vooma.</p>';
    header.append(createPencilContactLinks());
    const studyFooter = root.querySelector('footer');
    studyFooter?.remove();
    const options = root.querySelector('#drag-choices');
    const carrier = root.querySelector('#drag-carrier');
    root.querySelector('#drag-preview')?.remove();
    const article = root.querySelector('#reading');
    const heading = article.querySelector('h2');
    const context = article.querySelector('.reading-context');
    const phoneCompanySlot = document.createElement('div');
    phoneCompanySlot.className = 'phone-company-slot';
    article.prepend(phoneCompanySlot);
    heading.after(context);
    const phoneHeadlineWindow = document.createElement('div');
    phoneHeadlineWindow.className = 'phone-headline-window';
    heading.before(phoneHeadlineWindow);
    phoneHeadlineWindow.append(heading);
    const contextCompany = document.createElement('span');
    contextCompany.className = 'summary-company';
    contextCompany.setAttribute('aria-hidden', 'true');
    const contextName = document.createElement('span');
    contextName.className = 'sr-only';
    const summaryMark = document.createElement('span');
    summaryMark.className = 'summary-mark';
    summaryMark.setAttribute('aria-hidden', 'true');
    const contextRole = document.createElement('span');
    contextRole.className = 'summary-role';
    context.replaceChildren(contextName, summaryMark, contextCompany, contextRole);
    const intro = document.createElement('div');
    intro.className = 'reading-intro';
    article.querySelector('.reading-intro').replaceWith(intro);
    article.querySelector('.reading-notes')?.remove();
    root.querySelector('#read-notes')?.remove();
    const homeButton = root.querySelector('#reading-back');
    const workNavigation = document.createElement('nav');
    workNavigation.className = 'work-navigation';
    workNavigation.setAttribute('aria-label', 'Other work');
    stage.append(workNavigation);
    homeButton.innerHTML = backIcon;
    homeButton.setAttribute('aria-label', 'Return Home');
    workNavigation.prepend(homeButton);
    homeButton.classList.add('icon-back');
    const trace = root.querySelector('#fling-trace');
    const contactMarks = root.querySelector('#grip-contact');
    const releaseStreak = root.querySelector('#release-streak');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const phoneScreen = matchMedia('(max-width: 700px)');
    const DESKTOP_TYPE = { home: 22, heading: 24, context: 13, meta: 12, preview: 14 };
    const TYPE = { ...DESKTOP_TYPE };
    const READING_SIDE = 1;
    const clamp = value => Math.max(0, Math.min(1, value));
    const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
    const lerp = (a, b, t) => a + (b - a) * t;

    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
    catch { throw new Error('WebGL is unavailable.'); }
    cleanup.push(() => renderer.dispose());
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0xffffff, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const scene = new THREE.Scene();
    const room = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(renderer);
    const environment = generator.fromScene(room, 0.04);
    cleanup.push(() => environment.dispose());
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.45;
    room.dispose();
    generator.dispose();
    scene.add(new THREE.HemisphereLight(0xffffff, 0xc3c5c7, 0.7));
    const light = new THREE.DirectionalLight(0xffffff, 2.6);
    light.position.set(-3, 8, 6);
    scene.add(light);
    const arm = createArmModel();
    const originalMaterials = new Set();
    cleanup.push(() => {
      const geometries = new Set();
      const materials = new Set(originalMaterials);
      arm.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) materials.add(object.material);
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
    });
    arm.traverse(object => {
      if (!object.isMesh) return;
      originalMaterials.add(object.material);
      object.material = createPencilMaterial(object.material, object.geometry);
    });
    applyArmPose(arm, REST_POSE);
    scene.add(arm);
    const armBounds = new THREE.Box3().setFromObject(arm);
    const drawing = createPencilContours(arm, { constructionGuides: false });
    cleanup.push(() => drawing.dispose());
    scene.add(drawing.group);
    const camera = new THREE.PerspectiveCamera(28, 2, 0.1, 100);
    const followGuard = createExperienceFollow({ arm, camera, restPose: { ...REST_POSE, yaw: 1.1 } });
    camera.up.set(0, 1, 0);
    const grip = arm.getObjectByName('gripPoint');
    let layout;
    let followOptions = null;
    let homePose = { ...REST_POSE };
    let idlePose = { ...REST_POSE };
    let mix = 0;
    let composition = 0;
    let readingCenterShift = 0;
    let selected = null;
    let motion = null;
    let queued = null;
    let hovered = null;
    let armPose = { ...REST_POSE };
    let followPose = { ...idlePose };
    let following = false;
    let pointerInside = false;
    let lastPointer = null;
    let pointerAtLanding = null;
    let awaitingPointer = false;
    let frameId = 0;
    let lastTimestamp = 0;
    let previousSize = '';
    let hoverItem = null;
    let ambientTime = 0;
    let optionsSettling = false;
    let phone = null;
    let phoneTextTransition = null;
    let observer;
    const entrance = createArmEntrance({ arm, drawing, options, stage, reducedMotion });
    cleanup.push(() => entrance.dispose());
    stopRuntime = () => {
      cancelPhoneTextTransition();
      stopFrame();
      observer?.disconnect();
    };
    const busy = () => Boolean(motion && !motion.completed);
    const ambientRunning = () => !phone && !busy() && !selected && !reducedMotion.matches;

    function createTitle(text) {
      const label = document.createElement('span');
      label.className = 'drag-title';
      const note = EXPERIENCE_NOTES.find(item => item.text === text);
      label.style.lineHeight = note ? '1.25' : '1.45';
      for (const character of Array.from(text)) {
        const glyph = document.createElement('span');
        glyph.className = 'title-glyph';
        glyph.textContent = character;
        glyph.setAttribute('aria-hidden', 'true');
        label.append(glyph);
      }
      return label;
    }
    const items = EXPERIENCE_NOTES.map((data, index) => {
      const button = document.createElement('button');
      button.className = 'drag-option';
      button.setAttribute('aria-label', `Open ${data.company} experience`);
      button.dataset.side = data.side;
      const label = createTitle(data.text);
      label.classList.add('experience-headline');
      const company = createTitle(data.company);
      company.classList.add('drag-company', 'experience-company');
      const extra = document.createElement('span');
      extra.className = 'company-extra';
      extra.textContent = data.homeContext ? ` · ${data.homeContext}` : '';
      const metadata = document.createElement('span');
      metadata.className = 'experience-meta';
      const companyToken = document.createElement('span');
      companyToken.className = 'company-token';
      companyToken.append(createCompanyMark(data.company), company);
      metadata.append(companyToken, extra);
      const description = document.createElement('span');
      description.className = 'experience-preview';
      description.textContent = data.description;
      const accessibleDescription = document.createElement('span');
      accessibleDescription.className = 'preview-description';
      accessibleDescription.id = `experience-description-${index}`;
      accessibleDescription.textContent = `${data.text} ${data.description}`;
      button.setAttribute('aria-describedby', accessibleDescription.id);
      const content = document.createElement('span');
      content.className = 'option-content';
      content.append(metadata, label, description);
      button.append(content);
      options.append(button, accessibleDescription);
      description.setAttribute('aria-hidden', 'true');
      const item = { ...data, index, button, content, label, metadata, extra, description,
        copyDescription: data.description, companyToken, companyLabel: company, offset: 0, velocity: 0, hoverBase: 0, repelX: 0, repelY: 0, repelVX: 0, repelVY: 0 };
      on(button, 'click', () => requestOpen(item));
      on(button, 'pointerenter', () => { hovered = item; updatePreview(); });
      on(button, 'pointerleave', () => { hovered = null; updatePreview(); });
      on(button, 'focus', () => { if (button.matches(':focus-visible')) hovered = null; updatePreview(); });
      on(button, 'blur', updatePreview);
      const navigationButton = document.createElement('button');
      navigationButton.className = 'work-caption';
      const captionCompany = document.createElement('span');
      captionCompany.className = 'caption-company pencil-link';
      captionCompany.textContent = data.company;
      navigationButton.append(createCompanyMark(data.company), captionCompany);
      navigationButton.setAttribute('aria-label', `Show ${data.company} summary`);
      on(navigationButton, 'click', () => requestOpen(item));
      workNavigation.append(navigationButton);
      item.navigationButton = navigationButton;
      item.captionTitle = captionCompany;
      return item;
    });
    function updatePreview() {
      const item = busy() ? null : hovered || items.find(item => item.button.matches(':focus-visible'));
      if (item !== hoverItem) {
        hoverItem = item || null;
        if (hoverItem) hoverItem.hoverBase = selected ? 0 : Math.max(-2.5, Math.min(2.5, hoverItem.offset));
        wake();
      }
      for (const option of items) option.button.classList.toggle('is-hovered', option === hoverItem);
    }
    function homeTextRect(item) {
      const top = item.homeAnchor.y - TYPE.meta * 1.45 - 6 - item.metrics.height / 2;
      return { left: item.homeAnchor.left, right: item.homeAnchor.left + item.homeAnchor.noteWidth,
        top, bottom: top + 18 + 6 + item.metrics.height + 8 + item.metrics.previewHeight };
    }
    function updateOptionOffsets(dt) {
      optionsSettling = false;
      if (busy()) return;
      const fadeIn = ease(ambientTime / .7);
      const tip = project(grip.getWorldPosition(new THREE.Vector3()));
      for (const item of items) {
        const drift = selected ? 0 : Math.sin(ambientTime * .85 + item.row * 1.9) * 2.5 * fadeIn;
        const target = phone || reducedMotion.matches ? 0 : item === hoverItem ? item.hoverBase - 6 : drift;
        const locked = item.button.matches(':focus-visible');
        const repulsion = phone || selected || reducedMotion.matches || !pointerInside || awaitingPointer ? { x: 0, y: 0 }
          : locked ? { x: item.repelX, y: item.repelY } : magneticBlockRepulsion(tip, homeTextRect(item), { preferredX: -1 });
        const vertical = settleSpring(item.offset, item.velocity, target, dt);
        const x = settleSpring(item.repelX, item.repelVX, repulsion.x, dt, 18);
        const y = settleSpring(item.repelY, item.repelVY, repulsion.y, dt, 18);
        item.offset = vertical.value; item.velocity = vertical.velocity;
        item.repelX = x.value; item.repelVX = x.velocity;
        item.repelY = y.value; item.repelVY = y.velocity;
        optionsSettling ||= Math.abs(item.offset - target) > .005 || Math.abs(item.velocity) > .02
          || Math.abs(item.repelX - repulsion.x) > .005 || Math.abs(item.repelY - repulsion.y) > .005
          || Math.abs(item.repelVX) > .02 || Math.abs(item.repelVY) > .02;
      }
    }
    function paintOptionOffsets() {
      for (const item of items) {
        const amount = busy() ? motion.captureHome && motion.item === item
          ? 1 - ease(motion.time / motion.plan.timing.reachEnd) : 1 - motion.layoutProgress : 1;
        const offset = busy() ? motion.offsets[item.index] : item.offset;
        item.content.style.transform = `translate3d(${item.repelX * amount}px, ${(offset + item.repelY) * amount}px, 0)`;
        item.button.dataset.repulsion = `${item.repelX.toFixed(2)},${item.repelY.toFixed(2)}`;
      }
      article.style.transform = 'none';
    }
    function stopFrame() { cancelAnimationFrame(frameId); frameId = 0; lastTimestamp = 0; }
    function wake() { if (!disposed && !frameId && !document.hidden) { lastTimestamp = 0; frameId = requestAnimationFrame(animate); } }
    function project(world) { return projectWorkspace(world, camera, layout, composition); }
    function unitsPerPixel(world) {
      const depth = -world.clone().applyMatrix4(camera.matrixWorldInverse).z;
      return 2 * depth * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / ((layout.armViewportHeight || layout.height) * camera.zoom);
    }
    function measureTitle(text, fontSize = TYPE.heading) {
      const node = createTitle(text);
      node.classList.add('workspace-heading-measure');
      node.style.fontSize = `${fontSize}px`;
      stage.append(node);
      const rect = node.getBoundingClientRect();
      node.remove();
      return { width: rect.width, height: rect.height };
    }
    function measurePreview(text, width) {
      const node = document.createElement('span');
      node.textContent = text;
      node.style.cssText = `position:absolute;visibility:hidden;display:block;width:${width}px;font-size:${TYPE.preview}px;line-height:1.5`;
      stage.append(node);
      const height = node.getBoundingClientRect().height;
      node.remove();
      return height;
    }
    function measureGlyphLayout(text, fontSize, visibleNode = null) {
      if (visibleNode) {
        const box = visibleNode.getBoundingClientRect();
        const spans = [...visibleNode.querySelectorAll('.title-glyph')];
        const range = document.createRange();
        const lineHeight = parseFloat(getComputedStyle(visibleNode).lineHeight);
        let offset = 0;
        const glyphs = Array.from(text, (character, index) => {
          let rect;
          if (spans.length) rect = spans[index].getBoundingClientRect();
          else {
            range.setStart(visibleNode.firstChild, offset);
            offset += character.length;
            range.setEnd(visibleNode.firstChild, offset);
            rect = range.getBoundingClientRect();
          }
          return { x: (rect.left - box.left) / fontSize,
            y: (rect.top - box.top - (spans.length ? 0 : (lineHeight - rect.height) / 2)) / fontSize,
            width: rect.width / fontSize, height: lineHeight / fontSize,
            hidden: spans.length ? getComputedStyle(spans[index]).visibility === 'hidden' : false };
        });
        return { width: box.width / fontSize, height: box.height / fontSize, glyphs };
      }
      const node = createTitle(text);
      node.classList.add('workspace-heading-measure');
      node.style.fontSize = `${fontSize}px`;
      stage.append(node);
      const box = node.getBoundingClientRect();
      const glyphs = Array.from(node.querySelectorAll('.title-glyph'), glyph => {
        const rect = glyph.getBoundingClientRect();
        return { x: (rect.left - box.left) / fontSize, y: (rect.top - box.top) / fontSize, width: rect.width / fontSize, height: rect.height / fontSize };
      });
      node.remove();
      return { width: box.width / fontSize, height: box.height / fontSize, glyphs };
    }
    function applyPayloadLayout(progress) {
      const { payload, sourceLayout, targetLayout } = motion;
      if (motion.brandPayload) {
        const width = lerp(motion.sourceMarkWidth, 18, progress) / TYPE.context;
        const height = lerp(motion.sourceMarkHeight, 18, progress) / TYPE.context;
        motion.brandPayload.style.gap = `${lerp(7, 8, progress) / TYPE.context}em`;
        motion.brandMark.style.width = `${width}em`;
        motion.brandMark.style.height = `${height}em`;
        motion.brandAnchor = { x: width / 2, y: 10 / TYPE.context };
        return;
      }
      const layout = sampleGlyphUnfold(payload.textContent, sourceLayout, targetLayout, progress);
      if (motion.anchorGlyph !== undefined) {
        const index = motion.anchorGlyph;
        motion.payloadAnchor = { x: layout.glyphs[index].x + lerp(sourceLayout.glyphs[index].width, targetLayout.glyphs[index].width, progress) / 2,
          y: layout.glyphs[index].y + lerp(sourceLayout.glyphs[index].height, targetLayout.glyphs[index].height, progress) / 2 };
      }
      payload.style.width = `${layout.width}em`;
      payload.style.height = `${layout.height}em`;
      Array.from(payload.querySelectorAll('.title-glyph')).forEach((glyph, index) => {
        const point = layout.glyphs[index];
        glyph.style.position = 'absolute';
        glyph.style.left = `${point.x}em`;
        glyph.style.top = `${point.y}em`;
      });
    }
    function planTitleCarry({ text, sourceNode, sourceLayout, targetLayout, sourceFont, targetFont,
      targetLeft, targetTop, fromComposition, toComposition, preferred, sourceDelta = { x: 0, y: 0 } }) {
      const stageRect = stage.getBoundingClientRect();
      const rect = sourceNode.getBoundingClientRect();
      const candidates = Array.from(text).map((character, index) => ({ character, index }))
        .filter(({ character, index }) => !/\s/u.test(character) && !sourceLayout.glyphs[index].hidden)
        .sort((a, b) => Math.abs(a.index / text.length - preferred) - Math.abs(b.index / text.length - preferred));
      let lastError;
      for (const { index } of candidates) {
        const from = sourceLayout.glyphs[index], to = targetLayout.glyphs[index];
        const sourcePixel = { x: rect.left - stageRect.left + sourceDelta.x + (from.x + from.width / 2) * sourceFont,
          y: rect.top - stageRect.top + sourceDelta.y + (from.y + from.height / 2) * sourceFont };
        const destinationPixel = { x: targetLeft + (to.x + to.width / 2) * targetFont,
          y: targetTop + (to.y + to.height / 2) * targetFont };
        try {
          const plan = createHomeCarryWorkspace({ camera, layout, fromPose: armPose, sourcePixel, destinationPixel,
            fromComposition, toComposition, gripFraction: preferred });
          return { plan, anchorGlyph: index };
        } catch (error) { lastError = error; }
      }
      throw lastError || new Error('The visible title has no reachable pickup point.');
    }
    function readingPoints(item, targetRole = 'heading', gripFraction = 1, sideSign = READING_SIDE) {
      const reading = experienceReadingLayout(layout, sideSign);
      const titleSize = measureTitle(item.text);
      const size = targetRole === 'company' ? measureTitle(item.company, TYPE.context) : titleSize;
      const y = targetRole === 'company'
        ? layout.summaryTop + titleSize.height + 12 + 10
        : layout.summaryTop + size.height / 2;
      return { dockPixel: { x: reading.summaryLeft + (targetRole === 'company' ? 9 : size.width * gripFraction), y } };
    }
    function setSummary(item, titleNode, companyNode = null, markNode = null) {
      if (heading.firstElementChild !== titleNode) heading.replaceChildren(titleNode);
      heading.setAttribute('aria-label', item.text);
      if (!companyNode) companyNode = article.dataset.item === String(item.index) && contextCompany.firstElementChild
        ? contextCompany.firstElementChild : createTitle(item.company);
      if (contextCompany.firstElementChild !== companyNode) contextCompany.replaceChildren(companyNode);
      contextName.textContent = item.company;
      if (article.dataset.item !== String(item.index)) {
        article.dataset.item = item.index;
        context.style.left = '0px';
        context.style.marginTop = '12px';
        summaryMark.replaceChildren(markNode || createCompanyMark(item.company));
        intro.replaceChildren(...item.summary.map(text => { const p = document.createElement('p'); p.textContent = text; return p; }));
      }
      contextRole.textContent = phone ? item.role : `· ${item.role}`;
      if (markNode && summaryMark.firstElementChild !== markNode) summaryMark.replaceChildren(markNode);
    }
    function movementOptions(reading = Boolean(selected), position = composition) {
      if (phone) return { width: layout.width, height: layout.height, canvasShift: 0, halo: 4, softBand: 24,
        viewport: { left: 0, top: 0, right: layout.width, bottom: 340 }, obstacles: [] };
      return portfolioFlowField({ layout, composition: position });
    }
    function clearReadyPose(plan, targetComposition) {
      if (phone) { plan.nextPose = { ...phone.restPose, grip: 0 }; return; }
      const options = movementOptions(targetComposition > .5, targetComposition);
      let result = followGuard.safeRest(options, plan.nextPose);
      if (!result.safe) result = followGuard.safeRest(options);
      plan.nextPose = { ...result.pose, grip: 0 };
      if (!phone && targetComposition > .5 && !selected) {
        const reading = experienceReadingLayout(layout, READING_SIDE);
        const groupLeft = Math.min(result.bounds.left, reading.summaryLeft - 6);
        const groupRight = Math.max(result.bounds.right, reading.summaryLeft + reading.summaryWidth);
        readingCenterShift = layout.width / 2 - (groupLeft + groupRight) / 2;
      }
    }
    function requestOpen(item, force = false) {
      if (motion && !motion.completed) {
        queued = motion.type === 'open' && motion.item === item ? null : { type: 'open', item };
        if (motion.paused) { motion.paused = false; wake(); }
        syncViewState();
        renderLayout();
        return;
      }
      if (!force && selected === item) { heading.focus({ preventScroll: true }); return; }
      if (phone) { changePhoneText(item, () => restorePhoneSummary(item)); return; }
      startOpen(item);
    }

    function cancelPhoneTextTransition(commit = false, keepTokens = false) {
      const transition = phoneTextTransition;
      phoneTextTransition = null;
      transition?.animations.forEach(animation => animation.cancel());
      if (!keepTokens) transition?.tokenAnimations.forEach(animation => animation.cancel());
      if (commit && transition?.phase === 'out') transition.apply();
      return transition;
    }
    function phoneCopyNodes() {
      const nodes = selected ? [heading, context, article.querySelector('.reading-body')]
        : items.flatMap(item => [item.label, item.description]);
      return nodes.filter(node => node.getBoundingClientRect().height > 0);
    }
    function changePhoneText(item, apply) {
      const outgoing = phoneCopyNodes();
      const presentation = outgoing.map(node => {
        const style = getComputedStyle(node);
        return { opacity: Number(style.opacity), transform: style.transform };
      });
      const previous = cancelPhoneTextTransition(false, true);
      if (reducedMotion.matches) {
        previous?.tokenAnimations.forEach(animation => animation.cancel());
        apply(); return;
      }
      const transition = { item, apply, phase: 'out', tokenAnimations: previous?.tokenAnimations || [],
        animations: outgoing.map((node, index) => node.animate([
          presentation[index],
          { opacity: 0, transform: `translateY(${node === heading ? -8 : -2}px)` },
        ], { duration: 70, easing: 'ease-in', fill: 'forwards' })) };
      phoneTextTransition = transition;
      transition.animations[0].onfinish = () => {
        if (phoneTextTransition !== transition) return;
        const departing = selected;
        const origins = items.map(option => option.companyToken.getBoundingClientRect());
        transition.tokenAnimations.forEach(animation => animation.cancel());
        transition.animations.forEach(animation => animation.cancel());
        apply();
        transition.phase = 'in';
        // Reparent the actual labels, then preserve their current on-screen positions.
        transition.tokenAnimations = items.map((option, index) => {
          const destination = option.companyToken.getBoundingClientRect();
          const dx = origins[index].left - destination.left;
          const dy = origins[index].top - destination.top;
          const bend = departing && item ? option === item ? -40 : option === departing ? 12 : 0 : 0;
          const path = Array.from({ length: 17 }, (_, step) => {
            const t = step / 16;
            const x = dx * (bend ? 1 - 3 * t * t + 2 * t * t * t : 1 - t);
            const y = bend ? dy * (1 - t * t * t) + 3 * bend * t * (1 - t) : dy * (1 - t);
            return { offset: t, transform: `translate(${x}px, ${y}px)` };
          });
          return option.companyToken.animate(path, { duration: 230, easing: 'cubic-bezier(.22,.75,.2,1)' });
        });
        const incoming = phoneCopyNodes();
        transition.animations = incoming.map(node => node.animate([
          { opacity: 0, transform: `translateY(${node === heading ? 10 : 3}px)` },
          { opacity: 1, transform: 'translateY(0px)' },
        ], { duration: 150, delay: node === heading ? 90 : 125,
          easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
        transition.animations.at(-1).onfinish = () => {
          if (phoneTextTransition === transition) cancelPhoneTextTransition();
        };
      };
    }
    function resetCompanyTokens() {
      carrier.hidden = true;
      for (const item of items) item.metadata.prepend(item.companyToken);
    }
    function restorePhoneSummary(item) {
      stopFrame(); following = false; hovered = null;
      selected = item; motion = null; mix = 1; composition = 1;
      phone.offset = phone.homeOffset; phone.offsetX = phone.centerOffsetX;
      armPose = { ...homePose }; idlePose = { ...armPose }; followPose = { ...armPose };
      setSummary(item, createTitle(item.text));
      article.style.visibility = 'visible'; article.style.opacity = '1';
      article.inert = false; article.setAttribute('aria-hidden', 'false');
      for (const node of [heading, context, contextRole, article.querySelector('.reading-body')]) node.style.opacity = '1';
      phone.readingHeight = article.getBoundingClientRect().height;
      const url = new URL(location.href); url.searchParams.set('work', item.id);
      history.replaceState(history.state, '', url);
      render(); syncViewState();
    }

    function startOpen(item) {
      stopFrame();
      const fromMix = mix;
      const fromComposition = composition;
      const targetSide = READING_SIDE;
      const switching = !phone && !!selected && fromMix > 0.99;
      const targetRole = switching ? 'company' : 'heading';
      const gripFraction = switching ? .5 : item.homeGripFraction;
      const targetFont = switching ? TYPE.context : TYPE.heading;
      const points = readingPoints(item, targetRole, gripFraction, targetSide);
      const stageRect = stage.getBoundingClientRect();
      const sourceNode = switching ? item.captionTitle : item.label;
      const visibleTitle = sourceNode.getBoundingClientRect();
      const sourceMark = switching ? item.navigationButton.querySelector('.company-mark').getBoundingClientRect() : null;
      const sourcePixel = sourceMark
        ? { x: sourceMark.left + sourceMark.width / 2 - stageRect.left, y: sourceMark.top + sourceMark.height / 2 - stageRect.top }
        : { x: visibleTitle.left + visibleTitle.width * gripFraction - stageRect.left,
          y: visibleTitle.top + visibleTitle.height / 2 - stageRect.top };
      let plan = switching ? createCaptionCarryWorkspace({ camera, layout, fromPose: armPose, sourcePixel,
        destinationPixel: points.dockPixel, fromComposition, toComposition: targetSide, gripFraction,
        readyPixel: readingPoints(item, 'heading', item.homeGripFraction, targetSide).dockPixel }) : null;
      const payloadText = switching ? item.company : item.text;
      const payload = createTitle(payloadText);
      const sourceFont = parseFloat(getComputedStyle(sourceNode).fontSize);
      let brandPayload = null, brandMark = null;
      if (switching) {
        brandPayload = document.createElement('span');
        brandPayload.className = 'caption-payload';
        brandPayload.style.height = `${20 / TYPE.context}em`;
        brandMark = createCompanyMark(item.company);
        brandPayload.append(brandMark, payload);
      }
      const sourceLayout = measureGlyphLayout(payloadText, sourceFont, sourceNode);
      const targetLayout = measureGlyphLayout(payloadText, targetFont);
      let anchorGlyph, captureHome = false;
      if (!switching) {
        const carryOptions = { text: payloadText, sourceNode, sourceLayout, targetLayout,
          sourceFont, targetFont, targetLeft: layout.summaryLeft, targetTop: layout.summaryTop,
          fromComposition, toComposition: targetSide, preferred: gripFraction };
        let carried;
        try { carried = planTitleCarry(carryOptions); }
        catch {
          captureHome = true;
          carried = planTitleCarry({ ...carryOptions, sourceDelta: { x: -item.repelX, y: -item.offset - item.repelY } });
        }
        plan = carried.plan; anchorGlyph = carried.anchorGlyph;
        points.dockPixel = plan.destinationPixel;
      }
      clearReadyPose(plan, targetSide);
      motion = {
        type: 'open', item, plan, points, time: reducedMotion.matches ? plan.endTime : 0,
        completed: false, paused: false, fromMix, fromComposition, targetSide, switching, playbackRate: switching ? 1.25 : 1.2,
        keyboardSelection: (selected ? item.navigationButton : item.button).matches(':focus-visible'),
        outgoing: selected && heading.firstElementChild ? { item: selected, node: heading.firstElementChild,
          companyNode: contextCompany.firstElementChild } : null,
        payload, headingPayload: switching ? createTitle(item.text) : payload,
        companyPayload: switching ? payload : createTitle(item.company),
        gripFraction, targetRole, targetFont, fontWorld: sourceFont * unitsPerPixel(new THREE.Vector3(plan.home.x, plan.home.y, plan.home.z)),
        sourceLayout, targetLayout, anchorGlyph, captureHome,
        brandPayload, brandMark, sourceMarkWidth: sourceMark?.width, sourceMarkHeight: sourceMark?.height,
        offsets: items.map(option => option.offset), layoutProgress: 0,
      };
      queued = null;
      following = false;
      hovered = null;

      applyMotion();
      render();
      syncViewState();
      if (reducedMotion.matches) commitMotion();
      else wake();
    }
    function requestHome() {
      if (motion && !motion.completed) {
        queued = { type: 'home' };
        if (motion.paused) { motion.paused = false; wake(); }
        syncViewState();
        return;
      }
      if (phone) {
        if (!selected && !phoneTextTransition) return;
        changePhoneText(null, () => {
          resetWorkspace();
          const url = new URL(location.href); url.searchParams.delete('work');
          history.replaceState(history.state, '', url);
        });
        return;
      }
      if (!selected) return;
      stopFrame();
      const item = selected;
      const gripFraction = item.homeGripFraction;
      const stageRect = stage.getBoundingClientRect();
      const visibleTitle = heading.firstElementChild.getBoundingClientRect();
      const sourcePixel = { x: visibleTitle.left + visibleTitle.width * gripFraction - stageRect.left,
        y: visibleTitle.top + visibleTitle.height / 2 - stageRect.top };
      const sourceLayout = measureGlyphLayout(item.text, TYPE.heading, heading.firstElementChild);
      const targetLayout = measureGlyphLayout(item.text, TYPE.home);
      const carryOptions = { text: item.text, sourceNode: heading.firstElementChild, sourceLayout, targetLayout,
        sourceFont: TYPE.heading, targetFont: TYPE.home, targetLeft: item.homeAnchor.left,
        targetTop: item.homeAnchor.y - item.metrics.height / 2,
        fromComposition: composition, toComposition: 0, preferred: gripFraction };
      const carried = planTitleCarry(carryOptions);
      const plan = carried.plan;
      clearReadyPose(plan, 0);
      motion = {
        type: 'home', item, plan, time: reducedMotion.matches ? plan.endTime : 0,
        completed: false, paused: false, fromMix: mix, fromComposition: composition, playbackRate: 1.2,
        payload: heading.firstElementChild, companyPayload: contextCompany.firstElementChild,
        gripFraction, targetFont: TYPE.home, fontWorld: TYPE.heading * unitsPerPixel(new THREE.Vector3(plan.home.x, plan.home.y, plan.home.z)),
        sourceLayout, targetLayout, anchorGlyph: carried.anchorGlyph,
        offsets: items.map(option => option.offset), layoutProgress: 0,
        restoreFocus: document.activeElement === homeButton || article.contains(document.activeElement),
      };
      queued = null;
      following = false;
      applyMotion();
      render();
      syncViewState();
      if (reducedMotion.matches) commitMotion();
      else wake();
    }
    function showPayload(world, fontSize, gripFraction) {
      motion.payload.style.font = 'inherit';
      motion.payload.style.lineHeight = motion.targetRole === 'company' ? '1.45' : '1.25';
      const point = project(world);
      if (motion.brandPayload) {
        motion.brandPayload.replaceChildren(motion.brandMark, motion.payload);
        if (motion.brandPayload.parentElement !== carrier) carrier.replaceChildren(motion.brandPayload);
        carrier.hidden = false;
        carrier.style.fontSize = `${fontSize}px`;
        carrier.style.left = `${point.x - motion.brandAnchor.x * fontSize}px`;
        carrier.style.top = `${point.y - motion.brandAnchor.y * fontSize}px`;
        carrier.style.transform = 'none';
        return;
      }
      if (motion.payload.parentElement !== carrier) carrier.replaceChildren(motion.payload);
      carrier.hidden = false;
      carrier.style.left = `${point.x}px`;
      carrier.style.top = `${point.y}px`;
      carrier.style.fontSize = `${fontSize}px`;
      if (motion.payloadAnchor) {
        carrier.style.left = `${point.x - motion.payloadAnchor.x * fontSize}px`;
        carrier.style.top = `${point.y - motion.payloadAnchor.y * fontSize}px`;
        carrier.style.transform = 'none';
      } else carrier.style.transform = `translate(${-100 * gripFraction}%, -50%)`;
    }
    function applyMotion() {
      if (!motion) return;
      const { plan, time } = motion;
      const { reachEnd, gripEnd, releaseTime } = plan.timing;
      const frame = motion.switching ? sampleCaptionCarryWorkspace(plan, time) : sampleCarryWorkspace(plan, time);
      const opening = motion.type === 'open';
      const layoutProgress = frame.sceneProgress;
      motion.layoutProgress = layoutProgress;
      mix = opening ? lerp(motion.fromMix, 1, layoutProgress) : motion.fromMix * (1 - layoutProgress);
      composition = frame.composition;
      armPose = frame.pose;
      applyArmPose(arm, armPose);
      const world = grip.getWorldPosition(new THREE.Vector3());
      const growth = layoutProgress;
      const natural = motion.fontWorld / unitsPerPixel(world);
      applyPayloadLayout(growth);
      carrier.hidden = true;
      article.inert = true;
      article.setAttribute('aria-hidden', 'true');
      article.querySelector('.reading-body').style.opacity = '1';
      heading.style.opacity = '1';
      context.style.opacity = '1';
      contextRole.style.opacity = '1';
      if (opening) {
        if (time >= plan.landTime) {
          setSummary(motion.item, motion.headingPayload, motion.companyPayload, motion.brandMark);
          article.style.visibility = 'visible';
          article.style.opacity = '1';
          const reveal = ease((time - releaseTime) / (plan.endTime - releaseTime));
          article.querySelector('.reading-body').style.opacity = reveal;
          heading.style.opacity = motion.targetRole === 'company' ? reveal : 1;
          context.style.opacity = motion.targetRole === 'company' ? 1 : reveal;
          contextRole.style.opacity = motion.targetRole === 'company' ? reveal : 1;
        } else {
          const oldOpacity = motion.outgoing ? 1 - ease(time / 0.12) : 0;
          if (motion.outgoing && oldOpacity > 0) setSummary(motion.outgoing.item, motion.outgoing.node, motion.outgoing.companyNode);
          article.style.visibility = oldOpacity > 0 ? 'visible' : 'hidden';
          article.style.opacity = oldOpacity;
          if (time >= gripEnd) showPayload(world, lerp(natural, motion.targetFont, growth), motion.gripFraction);
        }
      } else {
        if (time < gripEnd) {
          setSummary(motion.item, motion.payload, motion.companyPayload);
          article.style.visibility = 'visible';
          article.style.opacity = 1 - ease(time / reachEnd) * 0.35;
          article.querySelector('.reading-body').style.opacity = 1 - ease(time / reachEnd);
        } else {
          article.style.visibility = 'hidden';
          if (time < plan.landTime) showPayload(world, lerp(natural, motion.targetFont, growth), motion.gripFraction);
        }
      }
      applyEffects(frame);
    }
    function applyEffects(frame) {
      const { time, plan, payload } = motion;
      const { reachEnd, gripEnd, placeTime, releaseTime } = plan.timing;
      const pinchProgress = clamp((time - reachEnd) / (gripEnd - reachEnd));
      const pinch = time < gripEnd + .09 ? Math.sin(Math.PI * pinchProgress / 2) * (1 - clamp((time - gripEnd) / .09)) : 0;
      const contactPayload = motion.brandPayload || payload;
      contactPayload.style.transformOrigin = motion.brandPayload ? `${motion.brandAnchor.x}em 50%` : `${motion.gripFraction * 100}% 50%`;
      contactPayload.style.transform = `scaleX(${1 - .025 * pinch})`;
      const placed = time >= placeTime;
      const progress = (time - (placed ? placeTime : reachEnd)) / (placed ? .16 : .17);
      const strength = progress > 0 && progress < 1 ? Math.sin(Math.PI * progress) : 0;
      if (strength > 0 && !reducedMotion.matches) {
        const point = project(grip.getWorldPosition(new THREE.Vector3()));
        const radius = 9 + ease(progress) * 9;
        const marks = placed ? [[-1,1],[1,1]] : [[-1,-1],[-1,1],[1,-1],[1,1]];
        contactMarks.setAttribute('d', marks.map(([x,y]) => `M${point.x+x*radius},${point.y+y*radius*.65} l${x*5},${y*3}`).join(' '));
        contactMarks.style.opacity = strength * .8;
      } else contactMarks.setAttribute('d', '');
      trace.setAttribute('d', '');
      const landing = (time - placeTime) / Math.max(.001, plan.endTime - placeTime);
      if (landing > 0 && landing < 1 && !reducedMotion.matches) {
        const point = motion.plan.destinationPixel;
        const width = payload.getBoundingClientRect().width + (motion.brandPayload ? 26 : 0);
        const left = point.x - (motion.brandPayload ? 9 : width * motion.gripFraction);
        const y = point.y + (motion.targetFont || TYPE.home) * .7;
        releaseStreak.setAttribute('d', `M${left},${y} Q${left+width*.45},${y+1.6} ${left+width*ease(clamp(landing*2.2))},${y-.3}`);
        releaseStreak.style.opacity = Math.sin(Math.PI * landing) * .55;
      } else releaseStreak.setAttribute('d', '');
    }
    function commitMotion() {
      if (!motion) return;
      const completed = motion;
      const next = queued;
      queued = null;
      for (const item of items) { item.offset = 0; item.velocity = 0; item.repelX = item.repelY = item.repelVX = item.repelVY = 0; }
      hoverItem = null;
      if (completed.type === 'open') {
        selected = completed.item;
        motion.completed = true;
        motion.paused = true;
        mix = 1;
        composition = completed.targetSide;
        article.inert = false;
        article.setAttribute('aria-hidden', 'false');
      } else {
        selected = null;
        motion = null;
        mix = 0;
        composition = 0;
        ambientTime = 0;
        heading.replaceChildren();
        contextCompany.replaceChildren();
        article.style.visibility = 'hidden';
        carrier.hidden = true;
        following = false;
        followPose = { ...armPose };
        awaitingPointer = true;
        pointerAtLanding = lastPointer ? { ...lastPointer } : null;
      }
      const url = new URL(location.href);
      if (selected) url.searchParams.set('work', selected.id);
      else url.searchParams.delete('work');
      history.replaceState(history.state, '', url);
      idlePose = { ...armPose };
      followPose = { ...idlePose };
      following = false;
      awaitingPointer = true;
      pointerAtLanding = lastPointer ? { ...lastPointer } : null;
      followOptions = movementOptions();
      const ready = followGuard.safeRest(followOptions, idlePose);
      stage.dataset.armSafe = String(ready.safe);
      stage.dataset.armBounds = JSON.stringify(ready.bounds);
      motion?.payload?.style.removeProperty('transform');
      motion?.brandPayload?.style.removeProperty('transform');
      contactMarks.setAttribute('d', '');
      releaseStreak.setAttribute('d', '');
      render();
      syncViewState();
      if (completed.type === 'open' && completed.keyboardSelection && !next) heading.focus({ preventScroll: true });
      if (completed.type === 'home' && completed.restoreFocus && !next) completed.item.button.focus({ preventScroll: true });
      if (next?.type === 'home') { if (selected) requestHome(); }
      else if (next?.item && next.item !== selected) requestOpen(next.item);
      else if (ambientRunning()) wake();
    }
    function renderLayout() {
      if (!layout) return;
      stage.style.transform = phone ? 'none' : `translateX(${readingCenterShift * composition}px)`;
      canvas.style.transform = `translateX(${workspaceOffset(layout, composition)}px)`;
      const orientation = READING_SIDE;
      const mirror = (1 - orientation) / 2;
      const rightReading = experienceReadingLayout(layout, 1);
      const leftReading = experienceReadingLayout(layout, -1);
      const opening = motion?.type === 'open';
      const lifted = opening && motion.time >= motion.plan.timing.gripEnd;
      const waitingPickup = opening && motion.outgoing && motion.fromMix > .99 && !lifted;
      const active = opening ? waitingPickup ? motion.outgoing.item : motion.item : selected;
      article.style.left = `${lerp(rightReading.summaryLeft, leftReading.summaryLeft, mirror)}px`;
      article.style.top = `${layout.summaryTop}px`;
      let captionLeft = rightReading.summaryLeft + (phone ? 52 : 32);
      for (const item of items) {
        const { height, previewHeight, extraWidth } = item.metrics;
        const home = item.homeAnchor;
        const padding = 7;
        const homeAbove = 18 + 6;
        const headlineY = home.y - homeAbove - height / 2;
        item.button.style.left = `${home.left}px`;
        item.button.style.top = `${headlineY - padding}px`;
        item.button.style.width = `${home.noteWidth}px`;
        item.button.style.padding = `${padding}px 0`;
        item.metadata.style.fontSize = `${TYPE.meta}px`;
        item.companyLabel.style.fontSize = `${TYPE.meta}px`;
        item.extra.style.maxWidth = `${extraWidth}px`;
        item.extra.style.opacity = 1;
        item.label.style.fontSize = `${TYPE.home}px`;
        item.label.style.height = `${height}px`;
        item.label.style.marginTop = '6px';
        item.description.style.height = `${previewHeight}px`;
        item.description.style.marginTop = '8px';
        item.description.style.opacity = 1;
        item.description.style.visibility = 'visible';
        item.label.setAttribute('aria-hidden', 'false');
        item.button.dataset.side = 'left';
        item.button.classList.toggle('is-active', mix > .5 && active === item);
        item.button.classList.toggle('is-queued', queued?.item === item);
        item.button.setAttribute('aria-current', String(mix > .5 && active === item));
        const carried = busy() && motion.item === item && motion.time >= motion.plan.timing.gripEnd && motion.time < motion.plan.landTime;
        item.label.style.opacity = carried && motion.targetRole !== 'company' ? 0 : 1;
        item.companyLabel.style.opacity = carried && motion.targetRole === 'company' ? 0 : 1;
        if (motion?.type === 'home' && motion.item === item && motion.time < motion.plan.landTime) item.label.style.opacity = '0';
        if (phone && motion?.type === 'home' && motion.item === item && busy()) item.label.style.opacity = '0';
        const hidden = mix >= .99 || (item === active && (lifted || mix > .001));
        item.button.style.visibility = hidden ? 'hidden' : 'visible';
        item.button.style.opacity = 1 - mix;
        item.button.inert = hidden;
        item.button.setAttribute('aria-hidden', String(hidden));
        if (item !== active) {
          item.navigationButton.style.left = `${captionLeft}px`;
          captionLeft += item.navigationWidth + (phone ? 20 : 24);
        }
        item.navigationButton.hidden = item === active;
        item.navigationButton.style.visibility = '';
        item.navigationButton.inert = item === active;
        item.navigationButton.classList.toggle('is-selected', item === active);
        item.navigationButton.classList.toggle('is-queued', queued?.item === item);
        item.navigationButton.setAttribute('aria-current', item === active ? 'page' : 'false');
        item.navigationButton.disabled = busy();
      }
      homeButton.style.left = `${rightReading.summaryLeft - (phone ? 0 : 6)}px`;
      workNavigation.style.opacity = mix;
      workNavigation.style.visibility = mix > .01 ? 'visible' : 'hidden';
      workNavigation.inert = mix <= .01;
      homeButton.inert = mix <= .01;
      paintOptionOffsets();
      updatePreview();
      if (phone) renderPhoneLayout();
    }
    function renderPhoneLayout() {
      const reading = Boolean(selected);
      const active = selected;
      stage.style.height = `${layout.height}px`;
      canvas.style.transformOrigin = '0 0';
      canvas.style.transform = `translate(${phone.offsetX}px, ${phone.offset}px) scale(${phone.scale})`;
      article.style.visibility = reading ? 'visible' : 'hidden';
      article.style.opacity = '1';
      for (const node of [heading, context, article.querySelector('.reading-body')]) node.style.opacity = '1';
      phoneCompanySlot.style.opacity = '1';
      article.inert = !reading; article.setAttribute('aria-hidden', String(!reading));
      workNavigation.style.top = `${phone.contentTop}px`;
      workNavigation.style.opacity = reading ? 1 : 0;
      workNavigation.style.visibility = reading ? 'visible' : 'hidden';
      workNavigation.inert = !reading; homeButton.inert = !reading;
      for (const item of items) {
        const inSummary = reading && active === item;
        const host = inSummary ? phoneCompanySlot : reading ? item.navigationButton : item.metadata;
        if (item.companyToken.parentElement !== host) host.prepend(item.companyToken);
        item.companyToken.style.opacity = '1';
        item.companyLabel.style.opacity = '1';
        item.label.style.opacity = '1';
        item.button.style.visibility = reading ? 'hidden' : 'visible';
        item.description.style.visibility = reading ? 'hidden' : 'visible';
        item.button.style.opacity = '1';
        item.button.inert = reading; item.button.setAttribute('aria-hidden', String(reading));
        item.navigationButton.hidden = item === active;
        item.navigationButton.style.visibility = '';
        item.navigationButton.inert = item === active;
        item.navigationButton.disabled = false;
        for (const child of item.navigationButton.children) if (child !== item.companyToken) child.style.display = 'none';
      }
      if (reading) {
        const otherWork = items.filter(item => item !== active);
        const widths = otherWork.map(item => item.navigationButton.getBoundingClientRect().width);
        const totalWidth = 44 + 12 + widths.reduce((total, width) => total + width, 0) + 18 * (otherWork.length - 1);
        const start = layout.summaryLeft + (layout.summaryWidth - totalWidth) / 2;
        homeButton.style.left = `${start}px`;
        let left = start + 56;
        otherWork.forEach((item, index) => {
          item.navigationButton.style.left = `${left}px`;
          left += widths[index] + 18;
        });
      }
    }

    function render() {
      if (disposed) return;
      if (!phone || phone.needsDrawing) {
        applyArmPose(arm, armPose);
        drawing.update(camera);
        entrance.draw();
        renderer.render(scene, camera);
        if (phone) phone.needsDrawing = false;
      }
      renderLayout();
    }
    function syncViewState() {
      stage.dataset.summarySide = 'right';
      stage.dataset.mode = busy() ? motion.type === 'home' ? 'returning' : 'opening' : selected ? 'reading' : 'home';
    }
    function updateFollow() {
      if (phone) { following = false; return; }
      if (busy() || awaitingPointer) return;
      followOptions = movementOptions();
      if (!finePointer.matches || reducedMotion.matches || !pointerInside || !lastPointer) followPose = { ...idlePose };
      else {
        const rect = stage.getBoundingClientRect();
        const cursor = { x: lastPointer.x - rect.left, y: lastPointer.y - rect.top };
        followPose = solveBoundedFollow({ pixel: cursor, camera, layout, composition, idlePose, field: followOptions });
      }
      if (reducedMotion.matches) { following = false; return; }
      following = true;
      wake();
    }
    function animate(timestamp) {
      if (disposed) return;
      frameId = 0;
      if (document.hidden) return;
      const elapsed = lastTimestamp ? Math.max(0, (timestamp - lastTimestamp) / 1000) : 0;
      lastTimestamp = timestamp;
      const dt = Math.min(elapsed || 1 / 60, .05);
      if (busy()) entrance.finish();
      let armChanged = false;
      if (entrance.running) {
        const destination = followGuard.constrain({ fromPose: homePose, candidatePose: followPose, ...followOptions });
        armPose = entrance.advance(dt, destination.pose);
        armChanged = true;
      } else if (busy() && !motion.paused) {
        motion.time = Math.min(motion.plan.endTime, motion.time + elapsed * motion.playbackRate);
        applyMotion();
        if (motion.time === motion.plan.endTime) commitMotion();
        armChanged = true;
      } else if (following && !busy()) {
        const fromPose = { ...armPose };
        const candidate = { ...armPose };
        let remaining = 0;
        for (const key of Object.keys(REST_POSE)) {
          const delta = followPose[key] - armPose[key];
          candidate[key] += delta * (1 - Math.exp(-(key === 'yaw' ? 7 : 10) * dt));
          remaining += Math.abs(delta);
        }
        const limited = followGuard.constrain({ fromPose, candidatePose: candidate, ...followOptions });
        if (limited.startedUnsafe && limited.recoveryPose) {
          for (const key of Object.keys(REST_POSE)) armPose[key] += (limited.recoveryPose[key] - armPose[key]) * (1 - Math.exp(-10 * dt));
          followPose = { ...limited.recoveryPose };
          following = true;
          stage.dataset.armBounds = JSON.stringify(limited.bounds);
          stage.dataset.armSafe = 'false';
        } else {
          armPose = limited.pose;
          const moved = Object.keys(REST_POSE).reduce((sum, key) => sum + Math.abs(armPose[key] - fromPose[key]), 0);
          following = remaining > .0003 && (!limited.blocked || moved > .00001);
          stage.dataset.armBounds = JSON.stringify(limited.bounds);
          stage.dataset.armSafe = String(limited.safe);
        }
        armChanged = true;
      }

      if (!busy()) {
        if (ambientRunning()) ambientTime += dt;
        updateOptionOffsets(dt);
      }
      if (armChanged) { render(); syncViewState(); }
      else paintOptionOffsets();
      if (entrance.running || (busy() && !motion.paused) || following || ambientRunning() || (!busy() && optionsSettling)) {
        if (!frameId) frameId = requestAnimationFrame(animate);
      } else lastTimestamp = 0;
    }
    function resetWorkspace() {
      stopFrame();
      resetCompanyTokens();
      if (phone) { phone.offset = phone.homeOffset; phone.offsetX = phone.centerOffsetX; }
      motion=null; selected=null; queued=null; mix=0; composition=0; readingCenterShift=0;
      ambientTime=0; hoverItem=null; hovered=null;
      for (const item of items) { item.offset=0; item.velocity=0; item.repelX=item.repelY=item.repelVX=item.repelVY=0; }
      awaitingPointer=false; pointerAtLanding=null;
      idlePose={...homePose}; armPose={...homePose}; followPose={...homePose}; following=false;
      heading.replaceChildren(); carrier.replaceChildren(); carrier.hidden=true;
      article.style.visibility='hidden'; article.inert=true; article.setAttribute('aria-hidden','true');
      for (const path of [trace,contactMarks,releaseStreak]) path.setAttribute('d','');
      render(); syncViewState();
      if (ambientRunning()) wake();
    }
    function resize() {
      if (disposed) return;
      const isPhone = phoneScreen.matches;
      main.classList.toggle('phone-workspace', isPhone);
      root.classList.toggle('phone-preview', isPhone);
      main.classList.toggle('compact-phone', isPhone && window.innerHeight < 760);
      if (!isPhone) {
        stage.style.removeProperty('height'); canvas.style.removeProperty('height');
        root.querySelector('.motion-marks').style.removeProperty('height');
        workNavigation.style.removeProperty('top');
        canvas.style.removeProperty('transform-origin');
        phoneCompanySlot.style.removeProperty('opacity');
      }
      const rect = stage.getBoundingClientRect();
      if (!rect.width || (!isPhone && !rect.height)) return;
      const viewportHeight = Math.round(window.visualViewport?.height || window.innerHeight);
      const size = isPhone ? `phone,${rect.width},${viewportHeight},${header.getBoundingClientRect().height}` : `desktop,${rect.width},${rect.height}`;
      if (size === previousSize) return;
      previousSize = size;
      entrance.finish('resize');
      entrance.setMode(isPhone);
      const pendingPhoneChange = cancelPhoneTextTransition();
      stage.scrollTop = 0;
      const returningHome = pendingPhoneChange ? !pendingPhoneChange.item : busy() && motion.type === 'home';
      const restoreId = pendingPhoneChange ? pendingPhoneChange.item?.id || null : busy() ? motion.type === 'open' ? motion.item.id : null
        : selected?.id || new URLSearchParams(location.search).get('work');
      stopFrame();
      if (!isPhone) for (const item of items) {
        item.metadata.prepend(item.companyToken);
        for (const child of item.navigationButton.children) child.style.removeProperty('display');
      }
      Object.assign(TYPE, isPhone ? { home: 18, heading: 20, context: 12, meta: 12, preview: 13.5 } : DESKTOP_TYPE);
      for (const item of items) {
        item.navigationWidth = item.navigationButton.getBoundingClientRect().width || item.navigationWidth;
        const bounds = measureTitle(item.text, TYPE.home);
        item.metrics = { width: bounds.width, height: bounds.height, previewHeight: 0,
          extraWidth: item.homeContext ? measureTitle(` · ${item.homeContext}`, TYPE.meta).width : 0 };
      }
      if (isPhone) {
        const columnLeft = Math.max(0, (rect.width - 400) / 2);
        const columnWidth = Math.min(400, rect.width);
        article.style.width = `${columnWidth}px`;
        let maxSummaryHeight = 0;
        for (const item of items) {
          setSummary(item, createTitle(item.text));
          maxSummaryHeight = Math.max(maxSummaryHeight, article.getBoundingClientRect().height);
        }
        let homeRowsHeight = 0;
        for (const item of items) {
          item.metrics.previewHeight = main.classList.contains('compact-phone') ? 0 : measurePreview(item.copyDescription, columnWidth);
          item.phoneRowHeight = 20 + 6 + item.metrics.height + (item.metrics.previewHeight ? 8 + item.metrics.previewHeight : 0) + 16;
          homeRowsHeight += item.phoneRowHeight;
        }
        const mainStyle = getComputedStyle(main);
        const padding = parseFloat(mainStyle.paddingTop) + parseFloat(mainStyle.paddingBottom);
        const available = viewportHeight - header.getBoundingClientRect().height - padding - 8;
        const textHeight = Math.max(homeRowsHeight, maxSummaryHeight + 52);
        const maxScale = main.classList.contains('compact-phone') ? .82 : .9;
        const scale = Math.max(.5, Math.min(maxScale, (available - textHeight - 24) / 240));
        const height = Math.max(360, 240 * scale + 16 + textHeight + 8);
        const homeShift = Math.max(0, (height - (240 * scale + 16 + textHeight)) / 2);
        const contentTop = 240 * scale + 16 + homeShift;
        phone = configurePhoneWorkspace({ camera, width: rect.width, height, topInset: 0 });
        Object.assign(phone, { scale, centerOffsetX: rect.width * (1 - scale) / 2,
          homeOffset: -45 * scale + homeShift, contentTop, needsDrawing: true });
        phone.offset = phone.homeOffset; phone.offsetX = phone.centerOffsetX;
        layout = phone.layout;
        Object.assign(layout, { summaryLeft: columnLeft, summaryWidth: columnWidth, summaryTop: contentTop + 52 });
        let rowTop = contentTop;
        for (const item of items) {
          item.homeAnchor = { left: columnLeft, right: columnLeft + item.metrics.width, width: item.metrics.width,
            y: rowTop + 24 + item.metrics.height / 2, noteWidth: columnWidth, side: 'left' };
          rowTop += item.phoneRowHeight;
          item.homeGripFraction = .5; item.side = 'left';
        }
        stage.style.height = `${height}px`;
        canvas.style.height = `${height}px`;
        root.querySelector('.motion-marks').style.height = `${height}px`;
        homePose = { ...phone.restPose };
      } else {
        phone = null;
        camera.clearViewOffset();
        layout = workspaceLayout(rect.width, rect.height);
        const rig = createCameraStudyRig({ aspect: rect.width / rect.height, armBounds });
        camera.fov = rig.fov; camera.aspect = rig.aspect; camera.near = rig.near; camera.far = rig.far;
        camera.position.copy(rig.views.explore.position); camera.lookAt(rig.views.explore.target);
        camera.zoom = 1.28; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
        const home = configureExperienceWorkspace({ layout, camera, spacious: true,
          titleWidths: items.map(item => item.metrics.width), titleHeights: items.map(item => item.metrics.height) });
        layout = home.layout;
        for (const item of items) {
          item.homeAnchor = { ...home.anchors[item.index], noteWidth: 320 };
          const headingSize = measureTitle(item.text);
          item.homeGripFraction = chooseHomeGripFraction({ camera, layout,
            home: { left: item.homeAnchor.left, width: item.metrics.width, y: item.homeAnchor.y },
            heading: { left: layout.summaryLeft, width: headingSize.width, y: layout.summaryTop + headingSize.height / 2 } });
          item.side = item.homeAnchor.side;
          item.metrics.previewHeight = measurePreview(item.copyDescription, item.homeAnchor.noteWidth);
          item.home = workspaceGrip(item.homeAnchor, camera, layout, 0).point;
        }
      }
      renderer.setSize(layout.width, layout.height, false);
      article.style.left = `${layout.summaryLeft}px`; article.style.top = `${layout.summaryTop}px`;
      article.style.width = `${layout.summaryWidth}px`;
      followOptions = movementOptions(false, 0);
      const safeRest = followGuard.safeRest(followOptions, phone?.restPose);
      homePose = safeRest.pose;
      stage.dataset.armBounds = JSON.stringify(safeRest.bounds);
      stage.dataset.armSafe = String(safeRest.safe);
      resetWorkspace();
      if (returningHome) {
        const url = new URL(location.href); url.searchParams.delete('work');
        history.replaceState(history.state, '', url);
      }
      const restoreItem = items.find(item => item.id === restoreId);
      if (restoreItem) {
        if (phone) restorePhoneSummary(restoreItem);
        else {
          startOpen(restoreItem);
          stopFrame();
          if (busy()) {
            motion.keyboardSelection = false;
            motion.time = motion.plan.endTime;
            applyMotion(); commitMotion();
          }
        }
      }
      if (!ready) {
        if (!selected) armPose = entrance.start(homePose, Boolean(phone));
        render(); wake();
        ready = true;
        root.dataset.ready = 'true';
        root.dispatchEvent(new Event('portfolio-ready'));
      }
    }
    document.fonts.ready.then(() => { if (!disposed) runSafely(resize); });
    on(window, 'resize', resize);
    on(window.visualViewport, 'resize', resize);
    options.setAttribute('aria-label','Work to explore');
    on(window, 'pointermove',event=>{
      if(event.pointerType!=='mouse')return;
      pointerInside=true;lastPointer={x:event.clientX,y:event.clientY};
      if(awaitingPointer){if(!pointerAtLanding){pointerAtLanding={...lastPointer};return;}if(!pointerMovedSinceLanding(pointerAtLanding,lastPointer))return;awaitingPointer=false;pointerAtLanding=null;}
      updateFollow();
    });
    on(document.documentElement, 'pointerleave',()=>{pointerInside=false;updateFollow();});
    on(homeButton, 'click',requestHome);
    on(document, 'keydown',event=>{if(event.key==='Escape')requestHome();});
    on(document, 'visibilitychange',()=>{
      if(document.hidden){stopFrame();if(busy())motion.paused=true;}
      else {if(busy())motion.paused=false;if(entrance.running||busy()||following||ambientRunning())wake();}
    });
    on(reducedMotion, 'change',()=>{
      entrance.finish(); entrance.setMode(Boolean(phone));
      armPose = { ...idlePose };
      stopFrame(); following=false;
      cancelPhoneTextTransition(true);
      for(const item of items){item.offset=0;item.velocity=0;item.repelX=item.repelY=item.repelVX=item.repelVY=0;}
      if(busy()){motion.time=motion.plan.endTime;applyMotion();commitMotion();}
      render();syncViewState();if(ambientRunning())wake();
    });
    resize();
    observer = new ResizeObserver(() => runSafely(resize));
    observer.observe(stage);
    on(window, 'pageshow', event => {
      if (!event.persisted) return;
      previousSize = '';
      resize();
      if (busy()) motion.paused = false;
      if (entrance.running || busy() || following || ambientRunning()) wake();
    });
    on(window, 'pagehide',event=>{
      cancelPhoneTextTransition();
      stopFrame();if(event.persisted){if(motion&&!motion.completed)motion.paused=true;syncViewState();return;}
      dispose();
    });

    on(canvas, 'webglcontextlost', event => {
      event.preventDefault();
      fail();
    });
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
