/**
 * Story Time - DYNAMIC Animated PDF Reader
 * Premium experience with fully animated characters
 */

import * as pc from 'playcanvas';

// State
const state = {
    app: null, pdfDoc: null, pages: [], currentPage: 0, totalPages: 0,
    isPlaying: false, isReading: false, readingSpeed: 1, autoFlip: true,
    discussionMode: true, autoplayOnLoad: true, ttsEnabled: false, characterStyle: 'default',
    bookEntity: null, characters: [], particles: null,
    currentWordIndex: 0, words: [], sentences: [], animationFrame: null,
    camera: null, time: 0, speechSynth: null, currentUtterance: null
};

// DOM Elements
const els = {
    loadingScreen: document.getElementById('loading-screen'),
    appContainer: document.getElementById('app-container'),
    welcomePanel: document.getElementById('welcome-panel'),
    readingControls: document.getElementById('reading-controls'),
    uploadZone: document.getElementById('upload-zone'),
    pdfInput: document.getElementById('pdf-input'),
    uploadBtn: document.getElementById('upload-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsPanel: document.getElementById('settings-panel'),
    closeSettings: document.getElementById('close-settings'),
    bookTitle: document.getElementById('book-title'),
    currentPageEl: document.getElementById('current-page'),
    totalPagesEl: document.getElementById('total-pages'),
    prevPageBtn: document.getElementById('prev-page-btn'),
    nextPageBtn: document.getElementById('next-page-btn'),
    playPauseBtn: document.getElementById('play-pause-btn'),
    playIcon: document.getElementById('play-icon'),
    stopBtn: document.getElementById('stop-btn'),
    speedSlider: document.getElementById('speed-slider'),
    speedValue: document.getElementById('speed-value'),
    newBookBtn: document.getElementById('new-book-btn'),
    dialogue1: document.getElementById('dialogue-1'),
    dialogue2: document.getElementById('dialogue-2'),
    dialogueText1: document.getElementById('dialogue-text-1'),
    dialogueText2: document.getElementById('dialogue-text-2'),
    canvas: document.getElementById('application')
};

// PDF.js
const pdfjsLib = window['pdfjsLib'];
if (pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

// Character class for animated figures
class AnimatedCharacter {
    constructor(app, config) {
        this.app = app;
        this.config = config;
        this.root = new pc.Entity(config.name);
        this.parts = {};
        this.state = 'idle';
        this.targetPos = null;
        this.animTime = 0;
        this.blinkTimer = 0;
        this.gestureTimer = 0;
        this.isPointing = false;
        this.isTalking = false;
        this.emotions = { happy: 0, thinking: 0, excited: 0 };

        this.build();
        this.root.setPosition(config.position.x, config.position.y, config.position.z);
        app.root.addChild(this.root);
    }

    build() {
        const c = this.config;

        // Body
        this.parts.body = this.createPart('cylinder', c.bodyColor, [0.45, 0.7, 0.35], [0, 0.35, 0]);

        // Head
        this.parts.head = this.createPart('sphere', c.skinColor, [0.35, 0.4, 0.35], [0, 1.1, 0]);

        // Hair
        if (c.hairStyle === 'long') {
            this.parts.hair = this.createPart('sphere', c.hairColor, [0.38, 0.32, 0.38], [0, 1.25, -0.02]);
            const hairBack = this.createPart('cylinder', c.hairColor, [0.12, 0.35, 0.12], [0, 0.9, -0.15]);
            hairBack.setEulerAngles(15, 0, 0);
        } else {
            this.parts.hair = this.createPart('box', c.hairColor, [0.32, 0.12, 0.32], [0, 1.28, 0]);
        }

        // Face
        this.parts.leftEye = this.createPart('sphere', new pc.Color(1, 1, 1), [0.08, 0.08, 0.04], [-0.08, 1.12, 0.16]);
        this.parts.rightEye = this.createPart('sphere', new pc.Color(1, 1, 1), [0.08, 0.08, 0.04], [0.08, 1.12, 0.16]);
        this.parts.leftPupil = this.createPart('sphere', new pc.Color(0.1, 0.1, 0.1), [0.04, 0.04, 0.02], [-0.08, 1.12, 0.19]);
        this.parts.rightPupil = this.createPart('sphere', new pc.Color(0.1, 0.1, 0.1), [0.04, 0.04, 0.02], [0.08, 1.12, 0.19]);
        this.parts.mouth = this.createPart('box', new pc.Color(0.8, 0.4, 0.4), [0.1, 0.02, 0.02], [0, 1.0, 0.17]);

        // Arms
        const armX = c.side === 'left' ? 0.28 : -0.28;
        this.parts.leftArm = this.createPart('cylinder', c.skinColor, [0.06, 0.35, 0.06], [-0.28, 0.55, 0]);
        this.parts.rightArm = this.createPart('cylinder', c.skinColor, [0.06, 0.35, 0.06], [0.28, 0.55, 0]);
        this.parts.leftArm.setEulerAngles(0, 0, 20);
        this.parts.rightArm.setEulerAngles(0, 0, -20);

        // Hands
        this.parts.leftHand = this.createPart('sphere', c.skinColor, [0.06, 0.06, 0.06], [-0.35, 0.3, 0]);
        this.parts.rightHand = this.createPart('sphere', c.skinColor, [0.06, 0.06, 0.06], [0.35, 0.3, 0]);

        // Legs
        this.parts.leftLeg = this.createPart('cylinder', new pc.Color(0.2, 0.2, 0.3), [0.08, 0.35, 0.08], [-0.12, -0.15, 0]);
        this.parts.rightLeg = this.createPart('cylinder', new pc.Color(0.2, 0.2, 0.3), [0.08, 0.35, 0.08], [0.12, -0.15, 0]);

        // Feet
        this.parts.leftFoot = this.createPart('box', new pc.Color(0.3, 0.2, 0.15), [0.08, 0.04, 0.12], [-0.12, -0.35, 0.02]);
        this.parts.rightFoot = this.createPart('box', new pc.Color(0.3, 0.2, 0.15), [0.08, 0.04, 0.12], [0.12, -0.35, 0.02]);

        // Accessories
        if (c.hasGlasses) {
            this.parts.glasses = this.createPart('box', new pc.Color(0.1, 0.1, 0.1), [0.28, 0.02, 0.02], [0, 1.12, 0.18]);
        }
    }

    createPart(type, color, scale, pos) {
        const entity = new pc.Entity();
        entity.addComponent('render', { type });
        const mat = new pc.StandardMaterial();
        mat.diffuse = color;
        mat.gloss = 0.4;
        mat.metalness = 0;
        mat.update();
        entity.render.meshInstances[0].material = mat;
        entity.setLocalScale(scale[0], scale[1], scale[2]);
        entity.setLocalPosition(pos[0], pos[1], pos[2]);
        this.root.addChild(entity);
        return entity;
    }

    update(dt) {
        this.animTime += dt;
        this.blinkTimer += dt;
        this.gestureTimer += dt;

        // Breathing animation
        const breathe = Math.sin(this.animTime * 2) * 0.01;
        this.parts.body.setLocalScale(0.45 + breathe, 0.7 + breathe * 2, 0.35 + breathe);

        // Idle sway
        this.root.setEulerAngles(
            Math.sin(this.animTime * 0.5) * 2,
            this.config.rotation + Math.sin(this.animTime * 0.3) * 3,
            Math.sin(this.animTime * 0.7) * 1
        );

        // Blinking
        if (this.blinkTimer > 3 + Math.random() * 2) {
            this.blink();
            this.blinkTimer = 0;
        }

        // Talking animation
        if (this.isTalking) {
            const mouthOpen = 0.02 + Math.abs(Math.sin(this.animTime * 15)) * 0.04;
            this.parts.mouth.setLocalScale(0.1, mouthOpen, 0.02);

            // Head bob while talking
            this.parts.head.setLocalPosition(0, 1.1 + Math.sin(this.animTime * 8) * 0.02, 0);
        } else {
            this.parts.mouth.setLocalScale(0.1, 0.02, 0.02);
        }

        // Pointing animation
        if (this.isPointing) {
            const pointArm = this.config.side === 'left' ? this.parts.rightArm : this.parts.leftArm;
            const targetAngle = this.config.side === 'left' ? -70 : 70;
            const wave = Math.sin(this.animTime * 4) * 5;
            pointArm.setEulerAngles(60, 0, targetAngle + wave);
        } else {
            this.parts.leftArm.setEulerAngles(0, 0, 20 + Math.sin(this.animTime) * 5);
            this.parts.rightArm.setEulerAngles(0, 0, -20 + Math.sin(this.animTime + 1) * 5);
        }

        // Random gestures
        if (this.gestureTimer > 5 + Math.random() * 5 && !this.isTalking) {
            this.doRandomGesture();
            this.gestureTimer = 0;
        }

        // Walking animation
        if (this.state === 'walking' && this.targetPos) {
            this.walkTowards(dt);
        }

        // Look at book
        this.lookAtBook();
    }

    blink() {
        const scaleDown = () => {
            this.parts.leftEye.setLocalScale(0.08, 0.02, 0.04);
            this.parts.rightEye.setLocalScale(0.08, 0.02, 0.04);
            this.parts.leftPupil.setLocalScale(0.04, 0.01, 0.02);
            this.parts.rightPupil.setLocalScale(0.04, 0.01, 0.02);
        };
        const scaleUp = () => {
            this.parts.leftEye.setLocalScale(0.08, 0.08, 0.04);
            this.parts.rightEye.setLocalScale(0.08, 0.08, 0.04);
            this.parts.leftPupil.setLocalScale(0.04, 0.04, 0.02);
            this.parts.rightPupil.setLocalScale(0.04, 0.04, 0.02);
        };
        scaleDown();
        setTimeout(scaleUp, 100);
    }

    doRandomGesture() {
        const gestures = ['nod', 'tilt', 'shrug'];
        const gesture = gestures[Math.floor(Math.random() * gestures.length)];

        if (gesture === 'nod') {
            let t = 0;
            const animate = () => {
                t += 0.05;
                const nod = Math.sin(t * Math.PI * 2) * 10;
                this.parts.head.setEulerAngles(nod, 0, 0);
                if (t < 1) requestAnimationFrame(animate);
                else this.parts.head.setEulerAngles(0, 0, 0);
            };
            animate();
        } else if (gesture === 'tilt') {
            let t = 0;
            const animate = () => {
                t += 0.03;
                const tilt = Math.sin(t * Math.PI) * 15;
                this.parts.head.setEulerAngles(0, 0, tilt);
                if (t < 1) requestAnimationFrame(animate);
                else this.parts.head.setEulerAngles(0, 0, 0);
            };
            animate();
        }
    }

    lookAtBook() {
        // Pupils look towards center (book)
        const lookX = this.config.side === 'left' ? 0.02 : -0.02;
        this.parts.leftPupil.setLocalPosition(-0.08 + lookX, 1.11, 0.19);
        this.parts.rightPupil.setLocalPosition(0.08 + lookX, 1.11, 0.19);
    }

    walkTowards(dt) {
        const pos = this.root.getPosition();
        const dx = this.targetPos.x - pos.x;
        const dz = this.targetPos.z - pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.1) {
            const speed = 1.5;
            pos.x += (dx / dist) * speed * dt;
            pos.z += (dz / dist) * speed * dt;
            this.root.setPosition(pos);

            // Walking leg animation
            const legSwing = Math.sin(this.animTime * 10) * 20;
            this.parts.leftLeg.setEulerAngles(legSwing, 0, 0);
            this.parts.rightLeg.setEulerAngles(-legSwing, 0, 0);

            // Arm swing
            this.parts.leftArm.setEulerAngles(-legSwing * 0.5, 0, 20);
            this.parts.rightArm.setEulerAngles(legSwing * 0.5, 0, -20);

            // Body bounce
            this.root.setPosition(pos.x, this.config.position.y + Math.abs(Math.sin(this.animTime * 10)) * 0.05, pos.z);
        } else {
            this.state = 'idle';
            this.parts.leftLeg.setEulerAngles(0, 0, 0);
            this.parts.rightLeg.setEulerAngles(0, 0, 0);
        }
    }

    moveTo(x, z) {
        this.targetPos = { x, z };
        this.state = 'walking';
    }

    startTalking() { this.isTalking = true; }
    stopTalking() { this.isTalking = false; }
    startPointing() { this.isPointing = true; }
    stopPointing() { this.isPointing = false; }

    jumpExcited() {
        let t = 0;
        const baseY = this.config.position.y;
        const animate = () => {
            t += 0.05;
            const jump = Math.sin(t * Math.PI) * 0.3;
            const pos = this.root.getPosition();
            this.root.setPosition(pos.x, baseY + jump, pos.z);
            if (t < 1) requestAnimationFrame(animate);
        };
        animate();
    }

    wave() {
        const arm = this.config.side === 'left' ? this.parts.rightArm : this.parts.leftArm;
        let t = 0;
        const animate = () => {
            t += 0.05;
            const wave = Math.sin(t * Math.PI * 4) * 30;
            arm.setEulerAngles(70, wave, this.config.side === 'left' ? -60 : 60);
            if (t < 1) requestAnimationFrame(animate);
            else arm.setEulerAngles(0, 0, this.config.side === 'left' ? -20 : 20);
        };
        animate();
    }
}

// Initialize PlayCanvas
async function initPlayCanvas() {
    const canvas = els.canvas;
    const app = new pc.Application(canvas, {
        mouse: new pc.Mouse(canvas),
        touch: new pc.TouchDevice(canvas),
        keyboard: new pc.Keyboard(window)
    });

    state.app = app;
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    window.addEventListener('resize', () => app.resizeCanvas());
    app.start();

    createScene(app);
    app.on('update', (dt) => update(dt));

    return app;
}

function createScene(app) {
    // Camera with cinematic setup
    const camera = new pc.Entity('camera');
    camera.addComponent('camera', {
        clearColor: new pc.Color(0.05, 0.03, 0.08),
        fov: 50,
        nearClip: 0.1,
        farClip: 100
    });
    camera.setPosition(0, 2, 5.5);
    camera.setEulerAngles(-12, 0, 0);
    app.root.addChild(camera);
    state.camera = camera;

    // Dramatic lighting
    const keyLight = new pc.Entity('keyLight');
    keyLight.addComponent('light', {
        type: 'spot',
        color: new pc.Color(1, 0.9, 0.7),
        intensity: 3,
        range: 20,
        innerConeAngle: 30,
        outerConeAngle: 45,
        castShadows: true,
        shadowResolution: 2048
    });
    keyLight.setPosition(0, 6, 3);
    keyLight.setEulerAngles(60, 0, 0);
    app.root.addChild(keyLight);

    // Rim lights for characters
    const rimLight1 = new pc.Entity('rimLight1');
    rimLight1.addComponent('light', {
        type: 'point',
        color: new pc.Color(0.4, 0.6, 1),
        intensity: 1.5,
        range: 8
    });
    rimLight1.setPosition(-4, 2, 0);
    app.root.addChild(rimLight1);

    const rimLight2 = new pc.Entity('rimLight2');
    rimLight2.addComponent('light', {
        type: 'point',
        color: new pc.Color(1, 0.5, 0.7),
        intensity: 1.5,
        range: 8
    });
    rimLight2.setPosition(4, 2, 0);
    app.root.addChild(rimLight2);

    // Environment
    createEnvironment(app);
    createBook(app);
    createCharacters(app);
    createMagicParticles(app);
}

function createEnvironment(app) {
    // Luxurious floor
    const floor = new pc.Entity('floor');
    floor.addComponent('render', { type: 'plane' });
    const floorMat = new pc.StandardMaterial();
    floorMat.diffuse = new pc.Color(0.12, 0.08, 0.15);
    floorMat.gloss = 0.7;
    floorMat.metalness = 0.3;
    floorMat.update();
    floor.render.meshInstances[0].material = floorMat;
    floor.setLocalScale(25, 1, 25);
    floor.setPosition(0, -0.35, 0);
    app.root.addChild(floor);

    // Elegant table
    const table = new pc.Entity('table');
    table.addComponent('render', { type: 'cylinder' });
    const tableMat = new pc.StandardMaterial();
    tableMat.diffuse = new pc.Color(0.25, 0.15, 0.1);
    tableMat.gloss = 0.8;
    tableMat.update();
    table.render.meshInstances[0].material = tableMat;
    table.setLocalScale(2.5, 0.08, 2.5);
    table.setPosition(0, 0, 0);
    app.root.addChild(table);

    // Table leg
    const leg = new pc.Entity('leg');
    leg.addComponent('render', { type: 'cylinder' });
    leg.render.meshInstances[0].material = tableMat;
    leg.setLocalScale(0.15, 0.35, 0.15);
    leg.setPosition(0, -0.2, 0);
    app.root.addChild(leg);

    // Floating bookshelves
    for (let i = 0; i < 3; i++) {
        const shelf = new pc.Entity(`shelf${i}`);
        shelf.addComponent('render', { type: 'box' });
        const shelfMat = new pc.StandardMaterial();
        shelfMat.diffuse = new pc.Color(0.3, 0.2, 0.15);
        shelfMat.gloss = 0.5;
        shelfMat.update();
        shelf.render.meshInstances[0].material = shelfMat;
        shelf.setLocalScale(3, 0.08, 0.4);
        shelf.setPosition(-3.5, 1.5 + i * 0.8, -4);
        app.root.addChild(shelf);

        // Books on shelf
        for (let j = 0; j < 6; j++) {
            const book = new pc.Entity(`book${i}_${j}`);
            book.addComponent('render', { type: 'box' });
            const bookMat = new pc.StandardMaterial();
            const hue = Math.random();
            bookMat.diffuse = new pc.Color(
                0.3 + hue * 0.5,
                0.2 + (1 - hue) * 0.4,
                0.3 + Math.random() * 0.4
            );
            bookMat.gloss = 0.6;
            bookMat.update();
            book.render.meshInstances[0].material = bookMat;
            const h = 0.3 + Math.random() * 0.25;
            book.setLocalScale(0.06 + Math.random() * 0.03, h, 0.25);
            book.setPosition(-4.8 + j * 0.5, 1.5 + i * 0.8 + h / 2 + 0.04, -4);
            book.setEulerAngles(0, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 5);
            app.root.addChild(book);
        }
    }
}

function createBook(app) {
    const bookContainer = new pc.Entity('bookContainer');
    bookContainer.setPosition(0, 0.15, 0);
    app.root.addChild(bookContainer);
    state.bookEntity = bookContainer;

    // Book covers
    const coverMat = new pc.StandardMaterial();
    coverMat.diffuse = new pc.Color(0.6, 0.15, 0.15);
    coverMat.gloss = 0.8;
    coverMat.metalness = 0.1;
    coverMat.update();

    // Left cover
    const leftCover = new pc.Entity('leftCover');
    leftCover.addComponent('render', { type: 'box' });
    leftCover.render.meshInstances[0].material = coverMat;
    leftCover.setLocalScale(0.9, 0.04, 1.2);
    leftCover.setPosition(-0.5, 0, 0);
    bookContainer.addChild(leftCover);

    // Right cover
    const rightCover = new pc.Entity('rightCover');
    rightCover.addComponent('render', { type: 'box' });
    rightCover.render.meshInstances[0].material = coverMat;
    rightCover.setLocalScale(0.9, 0.04, 1.2);
    rightCover.setPosition(0.5, 0, 0);
    bookContainer.addChild(rightCover);

    // Spine
    const spine = new pc.Entity('spine');
    spine.addComponent('render', { type: 'box' });
    spine.render.meshInstances[0].material = coverMat;
    spine.setLocalScale(0.08, 0.06, 1.2);
    spine.setPosition(0, 0, 0);
    bookContainer.addChild(spine);

    // Pages
    const pageMat = new pc.StandardMaterial();
    pageMat.diffuse = new pc.Color(0.98, 0.95, 0.9);
    pageMat.emissive = new pc.Color(0.15, 0.15, 0.12);
    pageMat.gloss = 0.2;
    pageMat.update();

    // Left page
    const leftPage = new pc.Entity('leftPage');
    leftPage.addComponent('render', { type: 'plane' });
    leftPage.render.meshInstances[0].material = pageMat.clone();
    leftPage.setLocalScale(0.8, 1, 1.1);
    leftPage.setPosition(-0.45, 0.03, 0);
    leftPage.setEulerAngles(-90, 0, 0);
    bookContainer.addChild(leftPage);
    state.leftPage = leftPage;

    // Right page
    const rightPage = new pc.Entity('rightPage');
    rightPage.addComponent('render', { type: 'plane' });
    rightPage.render.meshInstances[0].material = pageMat.clone();
    rightPage.setLocalScale(0.8, 1, 1.1);
    rightPage.setPosition(0.45, 0.03, 0);
    rightPage.setEulerAngles(-90, 180, 0);
    bookContainer.addChild(rightPage);
    state.rightPage = rightPage;

    // Golden decorations
    const goldMat = new pc.StandardMaterial();
    goldMat.diffuse = new pc.Color(0.9, 0.7, 0.2);
    goldMat.gloss = 0.95;
    goldMat.metalness = 0.9;
    goldMat.update();

    for (let i = 0; i < 4; i++) {
        const corner = new pc.Entity(`corner${i}`);
        corner.addComponent('render', { type: 'box' });
        corner.render.meshInstances[0].material = goldMat;
        corner.setLocalScale(0.08, 0.05, 0.08);
        const x = (i % 2 === 0 ? -0.9 : 0.9);
        const z = (i < 2 ? -0.55 : 0.55);
        corner.setPosition(x, 0.02, z);
        bookContainer.addChild(corner);
    }

    bookContainer.setEulerAngles(-8, 0, 0);
}

function createCharacters(app) {
    // Professor Lily - elegant teacher
    const lily = new AnimatedCharacter(app, {
        name: 'Lily',
        position: { x: -1.8, y: 0, z: 1.2 },
        rotation: 25,
        side: 'left',
        bodyColor: new pc.Color(0.5, 0.3, 0.6),
        skinColor: new pc.Color(0.95, 0.8, 0.72),
        hairColor: new pc.Color(0.25, 0.15, 0.1),
        hairStyle: 'long',
        hasGlasses: true
    });
    state.characters.push(lily);

    // Max - enthusiastic student
    const max = new AnimatedCharacter(app, {
        name: 'Max',
        position: { x: 1.8, y: 0, z: 1.2 },
        rotation: -25,
        side: 'right',
        bodyColor: new pc.Color(0.3, 0.5, 0.65),
        skinColor: new pc.Color(0.9, 0.75, 0.65),
        hairColor: new pc.Color(0.2, 0.12, 0.08),
        hairStyle: 'short',
        hasGlasses: false
    });
    state.characters.push(max);
}

function createMagicParticles(app) {
    const container = new pc.Entity('particles');

    // Floating magic orbs
    for (let i = 0; i < 25; i++) {
        const orb = new pc.Entity(`orb${i}`);
        orb.addComponent('render', { type: 'sphere' });

        const orbMat = new pc.StandardMaterial();
        const hue = Math.random();
        orbMat.diffuse = new pc.Color(0.8 + hue * 0.2, 0.6 + (1 - hue) * 0.4, 1);
        orbMat.emissive = new pc.Color(0.5 + hue * 0.5, 0.3 + (1 - hue) * 0.5, 0.8);
        orbMat.emissiveIntensity = 3;
        orbMat.opacity = 0.7;
        orbMat.blendType = pc.BLEND_ADDITIVE;
        orbMat.update();

        orb.render.meshInstances[0].material = orbMat;
        const size = 0.02 + Math.random() * 0.04;
        orb.setLocalScale(size, size, size);
        orb.setPosition(
            (Math.random() - 0.5) * 10,
            0.5 + Math.random() * 4,
            (Math.random() - 0.5) * 8
        );

        orb.animData = {
            basePos: orb.getPosition().clone(),
            speedX: 0.2 + Math.random() * 0.3,
            speedY: 0.5 + Math.random() * 0.5,
            speedZ: 0.2 + Math.random() * 0.3,
            ampX: 0.5 + Math.random() * 1,
            ampY: 0.3 + Math.random() * 0.5,
            ampZ: 0.5 + Math.random() * 1,
            phase: Math.random() * Math.PI * 2
        };

        container.addChild(orb);
    }

    app.root.addChild(container);
    state.particles = container;
}

// Animation loop
function update(dt) {
    state.time += dt;

    // Update characters
    state.characters.forEach(char => char.update(dt));

    // Animate particles
    if (state.particles) {
        state.particles.children.forEach(orb => {
            if (orb.animData) {
                const d = orb.animData;
                const t = state.time;
                orb.setPosition(
                    d.basePos.x + Math.sin(t * d.speedX + d.phase) * d.ampX,
                    d.basePos.y + Math.sin(t * d.speedY + d.phase) * d.ampY,
                    d.basePos.z + Math.cos(t * d.speedZ + d.phase) * d.ampZ
                );
            }
        });
    }

    // Subtle camera movement
    if (state.camera) {
        const camX = Math.sin(state.time * 0.1) * 0.2;
        const camY = 2 + Math.sin(state.time * 0.15) * 0.1;
        state.camera.setPosition(camX, camY, 5.5);
    }

    // Book glow pulse
    if (state.bookEntity && state.isReading) {
        const pulse = 0.5 + Math.sin(state.time * 3) * 0.3;
        state.leftPage.render.meshInstances[0].material.emissiveIntensity = pulse;
        state.rightPage.render.meshInstances[0].material.emissiveIntensity = pulse;
    }
}

// Create UI
function createTextDisplayUI() {
    const container = document.createElement('div');
    container.id = 'text-stage';
    container.innerHTML = `
        <div class="reader-indicators">
            <div class="reader-card left" id="reader-card-1">
                <div class="reader-emoji">👩‍🏫</div>
                <div class="reader-info">
                    <span class="reader-name">Prof. Lily</span>
                    <span class="reader-status">Reading...</span>
                </div>
            </div>
            <div class="reader-card right" id="reader-card-2">
                <div class="reader-info">
                    <span class="reader-name">Max</span>
                    <span class="reader-status">Listening...</span>
                </div>
                <div class="reader-emoji">👨‍🎓</div>
            </div>
        </div>
        <div class="text-stage-panel" id="text-panel">
            <div class="text-content" id="text-content"></div>
            <div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div>
        </div>
        <div class="effect-layer" id="effect-layer"></div>
    `;
    document.getElementById('reading-controls').appendChild(container);
    addDynamicStyles();
}

function addDynamicStyles() {
    const s = document.createElement('style');
    s.textContent = `
        #text-stage { position: absolute; top: 130px; left: 20px; right: 20px; bottom: 90px; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; padding: 10px; pointer-events: none; z-index: 20; overflow: visible; }
        .reader-indicators { display: flex; justify-content: space-between; width: 100%; max-width: 700px; margin-bottom: 12px; flex-shrink: 0; pointer-events: auto; }
        .reader-card { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: rgba(0,0,0,0.8); backdrop-filter: blur(20px); border-radius: 40px; border: 1px solid rgba(255,255,255,0.15); opacity: 0.7; transition: all 0.4s ease; transform: scale(0.95); }
        .reader-card.active { opacity: 1; transform: scale(1); background: linear-gradient(135deg, rgba(236,72,153,0.3), rgba(139,92,246,0.3)); border-color: rgba(236,72,153,0.5); box-shadow: 0 0 25px rgba(236,72,153,0.4); }
        .reader-emoji { font-size: 2rem; animation: floatEmoji 3s ease-in-out infinite; }
        .reader-card.active .reader-emoji { animation: bounceEmoji 0.5s ease infinite; }
        @keyframes floatEmoji { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes bounceEmoji { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-8px) scale(1.1); } }
        .reader-info { display: flex; flex-direction: column; }
        .reader-name { font-weight: 600; font-size: 0.9rem; }
        .reader-status { font-size: 0.75rem; color: rgba(255,255,255,0.6); }
        .reader-card.active .reader-status { color: #ec4899; }
        .text-stage-panel { width: 100%; max-width: 650px; padding: 20px 25px; background: rgba(0,0,0,0.9); backdrop-filter: blur(30px); border-radius: 20px; border: 2px solid rgba(139,92,246,0.4); box-shadow: 0 15px 50px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 40px rgba(139,92,246,0.25); flex: 1; min-height: 0; overflow-y: auto; pointer-events: auto; scrollbar-width: thin; scrollbar-color: rgba(139,92,246,0.5) transparent; }
        .text-stage-panel::-webkit-scrollbar { width: 8px; }
        .text-stage-panel::-webkit-scrollbar-track { background: transparent; }
        .text-stage-panel::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #ec4899, #8b5cf6); border-radius: 4px; }
        .text-content { font-size: 1.15rem; line-height: 1.85; padding-bottom: 20px; }
        .text-content .word { display: inline-block; padding: 3px 5px; margin: 2px; border-radius: 5px; opacity: 0.4; transform: translateY(6px); transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); color: #cbd5e1; }
        .text-content .word.visible { opacity: 1; transform: translateY(0); color: #f1f5f9; }
        .text-content .word.current { background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; transform: translateY(0) scale(1.1); box-shadow: 0 0 18px rgba(236,72,153,0.7), 0 0 35px rgba(139,92,246,0.4); animation: wordPulse 0.35s ease; font-weight: 600; }
        @keyframes wordPulse { 0% { transform: scale(1.2); } 100% { transform: scale(1.1); } }
        .text-content .word.read { opacity: 0.75; color: #c4b5fd; }
        .progress-track { height: 5px; background: rgba(255,255,255,0.15); border-radius: 3px; margin-top: 15px; overflow: hidden; flex-shrink: 0; }
        .progress-fill { height: 100%; width: 0%; background: linear-gradient(90deg, #ec4899, #8b5cf6, #06b6d4); transition: width 0.3s ease; border-radius: 3px; box-shadow: 0 0 10px rgba(236,72,153,0.5); }
        .effect-layer { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 1000; }
        .floating-word { position: absolute; font-size: 1.6rem; font-weight: 700; background: linear-gradient(135deg, #ec4899, #8b5cf6); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 0 0 30px rgba(236,72,153,0.5); animation: floatWord 3s ease-out forwards; }
        @keyframes floatWord { 0% { opacity: 0; transform: translateY(0) scale(0.5) rotate(-5deg); } 20% { opacity: 1; transform: translateY(-30px) scale(1.2) rotate(0deg); } 80% { opacity: 1; } 100% { opacity: 0; transform: translateY(-200px) scale(0.8) rotate(5deg); } }
        .sparkle { position: absolute; width: 10px; height: 10px; background: white; border-radius: 50%; animation: sparkle 1s ease-out forwards; }
        @keyframes sparkle { 0% { opacity: 1; transform: scale(0); } 50% { opacity: 1; transform: scale(1.5); } 100% { opacity: 0; transform: scale(0); } }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
            #text-stage { top: 100px; left: 10px; right: 10px; bottom: 85px; padding: 5px; }
            .reader-indicators { margin-bottom: 8px; }
            .reader-card { padding: 6px 12px; gap: 6px; border-radius: 30px; }
            .reader-emoji { font-size: 1.4rem; }
            .reader-name { font-size: 0.75rem; }
            .reader-status { font-size: 0.65rem; }
            .text-stage-panel { padding: 14px 16px; border-radius: 16px; }
            .text-content { font-size: 1rem; line-height: 1.75; }
            .text-content .word { padding: 2px 4px; margin: 1px; font-size: 0.95rem; }
            .text-content .word.current { transform: scale(1.08); }
            .progress-track { height: 4px; margin-top: 10px; }
            .floating-word { font-size: 1.2rem; }
        }
        
        @media (max-width: 480px) {
            #text-stage { top: 95px; left: 6px; right: 6px; bottom: 80px; }
            .reader-card { padding: 5px 10px; }
            .reader-emoji { font-size: 1.2rem; }
            .reader-info { gap: 0; }
            .reader-name { font-size: 0.7rem; }
            .reader-status { font-size: 0.6rem; }
            .text-stage-panel { padding: 12px 14px; border-radius: 14px; }
            .text-content { font-size: 0.9rem; line-height: 1.7; }
            .text-content .word { padding: 2px 3px; font-size: 0.88rem; }
        }
    `;
    document.head.appendChild(s);
}

// PDF & Reading
async function loadPDF(file) {
    try {
        showLoading('Loading PDF...');
        const ab = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
        state.pdfDoc = pdf;
        state.totalPages = pdf.numPages;
        state.pages = [];

        showLoading('Extracting content...');
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = (await page.getTextContent()).items.map(item => item.str).join(' ');
            const vp = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = vp.width;
            canvas.height = vp.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            state.pages.push({ pageNum: i, text, canvas });
        }

        els.bookTitle.textContent = file.name.replace('.pdf', '');
        els.totalPagesEl.textContent = state.totalPages;
        await goToPage(0);
        els.welcomePanel.classList.add('hidden');
        els.readingControls.classList.remove('hidden');

        // Characters react
        state.characters[0].wave();
        setTimeout(() => state.characters[1].jumpExcited(), 500);

        hideLoading();

        // Autoplay if enabled
        if (state.autoplayOnLoad) {
            setTimeout(() => {
                startReading();
            }, 1000);
        }
    } catch (e) {
        console.error(e);
        hideLoading();
        alert('Error loading PDF');
    }
}

function showLoading(msg) {
    els.loadingScreen.querySelector('.loading-text').textContent = msg;
    els.loadingScreen.classList.remove('fade-out');
}
function hideLoading() { els.loadingScreen.classList.add('fade-out'); }

async function goToPage(idx) {
    if (idx < 0 || idx >= state.totalPages) return;
    stopReading();
    state.currentPage = idx;
    updatePageTextures();
    els.currentPageEl.textContent = idx + 1;
    els.prevPageBtn.disabled = idx === 0;
    els.nextPageBtn.disabled = idx >= state.totalPages - 1;
    animatePageFlip();
    prepareText(idx);

    // Auto-start reading if autoplay is enabled
    if (state.autoplayOnLoad) {
        setTimeout(() => startReading(), 500);
    }
}

function updatePageTextures() {
    const page = state.pages[state.currentPage];
    if (!page) return;
    const tex = new pc.Texture(state.app.graphicsDevice, { width: page.canvas.width, height: page.canvas.height, format: pc.PIXELFORMAT_RGBA8, mipmaps: false });
    tex.setSource(page.canvas);
    if (state.leftPage?.render) {
        const m = state.leftPage.render.meshInstances[0].material.clone();
        m.diffuseMap = tex;
        m.emissive = new pc.Color(0.2, 0.2, 0.18);
        m.update();
        state.leftPage.render.meshInstances[0].material = m;
    }
    const next = state.pages[state.currentPage + 1];
    if (next && state.rightPage?.render) {
        const tex2 = new pc.Texture(state.app.graphicsDevice, { width: next.canvas.width, height: next.canvas.height, format: pc.PIXELFORMAT_RGBA8, mipmaps: false });
        tex2.setSource(next.canvas);
        const m2 = state.rightPage.render.meshInstances[0].material.clone();
        m2.diffuseMap = tex2;
        m2.emissive = new pc.Color(0.2, 0.2, 0.18);
        m2.update();
        state.rightPage.render.meshInstances[0].material = m2;
    }
}

function animatePageFlip() {
    if (!state.bookEntity) return;
    let t = 0;
    const orig = state.bookEntity.getEulerAngles().clone();
    const animate = () => {
        t += 0.03;
        const flip = Math.sin(t * Math.PI) * 8;
        state.bookEntity.setEulerAngles(orig.x + flip, orig.y, orig.z);
        if (t < 1) requestAnimationFrame(animate);
    };
    animate();
    state.characters.forEach(c => c.blink());
}

function prepareText(idx) {
    const page = state.pages[idx];
    if (!page) return;
    const text = page.text.replace(/\s+/g, ' ').trim();
    state.sentences = (text.match(/[^.!?]+[.!?]+/g) || [text]).map(s => s.trim()).filter(s => s);
    state.words = text.split(/\s+/).filter(w => w);
    state.currentWordIndex = 0;
    updateTextDisplay();
}

function updateTextDisplay() {
    const el = document.getElementById('text-content');
    if (!el) return;
    el.innerHTML = state.words.map((w, i) => `<span class="word" data-i="${i}">${w}</span>`).join(' ');
    document.getElementById('progress-fill').style.width = '0%';
}

function startVisualReading() {
    if (!state.words.length) {
        if (state.autoFlip && state.currentPage < state.totalPages - 1) setTimeout(() => goToPage(state.currentPage + 1), 1000);
        return;
    }
    state.isReading = true;
    state.currentReader = 1;
    setActiveReader(1);
    state.characters[0].startTalking();
    state.characters[0].startPointing();
    animateReading();
}

function animateReading() {
    if (!state.isPlaying || !state.isReading) return;
    if (state.currentWordIndex >= state.words.length) {
        state.isReading = false;
        state.characters.forEach(c => { c.stopTalking(); c.stopPointing(); });
        state.characters[0].jumpExcited();
        state.characters[1].wave();
        createSparkles();
        if (state.autoFlip && state.currentPage < state.totalPages - 1) setTimeout(() => goToPage(state.currentPage + 1), 1500);
        else stopReading();
        return;
    }

    const wordEl = document.querySelector(`.word[data-i="${state.currentWordIndex}"]`);
    if (wordEl) {
        document.querySelectorAll('.word.current').forEach(w => { w.classList.remove('current'); w.classList.add('read'); });
        document.querySelectorAll('.word').forEach((w, i) => {
            if (i <= state.currentWordIndex) w.classList.add('visible');
            if (i === state.currentWordIndex) w.classList.add('current');
        });

        // Auto-scroll to keep current word visible
        const textPanel = document.getElementById('text-panel');
        if (textPanel) {
            const panelRect = textPanel.getBoundingClientRect();
            const wordRect = wordEl.getBoundingClientRect();
            const relativeTop = wordRect.top - panelRect.top + textPanel.scrollTop;
            const targetScroll = relativeTop - panelRect.height / 3;
            textPanel.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
        }

        // Switch readers
        if (state.discussionMode && state.currentWordIndex > 0 && state.currentWordIndex % 15 === 0) {
            const newReader = state.currentReader === 1 ? 2 : 1;
            setActiveReader(newReader);
            state.characters[state.currentReader - 1].stopTalking();
            state.characters[state.currentReader - 1].stopPointing();
            state.currentReader = newReader;
            state.characters[newReader - 1].startTalking();
            state.characters[newReader - 1].startPointing();
        }

        // Float important words
        if (Math.random() > 0.92 && state.words[state.currentWordIndex].length > 4) {
            createFloatingWord(state.words[state.currentWordIndex]);
        }

        document.getElementById('progress-fill').style.width = `${(state.currentWordIndex / state.words.length) * 100}%`;

        // Speak word with TTS if enabled
        if (state.ttsEnabled && state.speechSynth) {
            speakWord(state.words[state.currentWordIndex]);
        }
    }

    state.currentWordIndex++;
    state.animationFrame = setTimeout(animateReading, 180 / state.readingSpeed);
}

function setActiveReader(num) {
    document.getElementById('reader-card-1').classList.toggle('active', num === 1);
    document.getElementById('reader-card-2').classList.toggle('active', num === 2);
    document.querySelector('#reader-card-1 .reader-status').textContent = num === 1 ? 'Reading...' : 'Listening...';
    document.querySelector('#reader-card-2 .reader-status').textContent = num === 2 ? 'Reading...' : 'Listening...';
}

function createFloatingWord(word) {
    const layer = document.getElementById('effect-layer');
    const el = document.createElement('div');
    el.className = 'floating-word';
    el.textContent = word;
    el.style.left = `${30 + Math.random() * 40}%`;
    el.style.top = `${40 + Math.random() * 20}%`;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function createSparkles() {
    const layer = document.getElementById('effect-layer');
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const s = document.createElement('div');
            s.className = 'sparkle';
            s.style.left = `${20 + Math.random() * 60}%`;
            s.style.top = `${30 + Math.random() * 40}%`;
            s.style.background = `hsl(${280 + Math.random() * 60}, 80%, 70%)`;
            layer.appendChild(s);
            setTimeout(() => s.remove(), 1000);
        }, i * 50);
    }
}

// TTS
let lastSpokenSentence = -1;
function speakText(text) {
    if (!state.speechSynth || !text || !state.ttsEnabled) return;

    // Don't re-speak the same sentence
    const sentenceIndex = Math.floor(state.currentWordIndex / 10);
    if (sentenceIndex === lastSpokenSentence) return;
    lastSpokenSentence = sentenceIndex;

    // Get a chunk of words to speak
    const startIdx = state.currentWordIndex;
    const endIdx = Math.min(startIdx + 10, state.words.length);
    const chunk = state.words.slice(startIdx, endIdx).join(' ');

    if (!chunk.trim()) return;

    state.speechSynth.cancel();
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.rate = state.readingSpeed * 1.2;
    utterance.pitch = 1;
    utterance.volume = 1;
    state.speechSynth.speak(utterance);
    console.log('Speaking:', chunk);
}

function speakWord(word) {
    speakText(word);
}

// Character styles
const characterPresets = {
    default: [
        { name: 'Lily', bodyColor: [0.5, 0.3, 0.6], skinColor: [0.95, 0.8, 0.72], hairColor: [0.25, 0.15, 0.1], hairStyle: 'long', hasGlasses: true },
        { name: 'Max', bodyColor: [0.3, 0.5, 0.65], skinColor: [0.9, 0.75, 0.65], hairColor: [0.2, 0.12, 0.08], hairStyle: 'short', hasGlasses: false }
    ],
    leader: [
        { name: 'Leader', bodyColor: [0.95, 0.55, 0.2], skinColor: [0.85, 0.7, 0.55], hairColor: [0.85, 0.85, 0.85], hairStyle: 'short', hasGlasses: true, hasBeard: true },
        { name: 'Assistant', bodyColor: [0.3, 0.4, 0.55], skinColor: [0.9, 0.75, 0.65], hairColor: [0.15, 0.1, 0.08], hairStyle: 'short', hasGlasses: false }
    ],
    kids: [
        { name: 'Mia', bodyColor: [1, 0.6, 0.7], skinColor: [0.95, 0.82, 0.75], hairColor: [0.3, 0.2, 0.1], hairStyle: 'long', hasGlasses: false },
        { name: 'Leo', bodyColor: [0.4, 0.7, 0.5], skinColor: [0.88, 0.72, 0.6], hairColor: [0.2, 0.15, 0.1], hairStyle: 'short', hasGlasses: false }
    ]
};

function updateCharacterStyle(style) {
    const presets = characterPresets[style] || characterPresets.default;

    // Update reader card emojis
    const emojiMap = {
        default: ['👩‍🏫', '👨‍🎓'],
        leader: ['🧔', '👨‍💼'],
        kids: ['👧', '👦']
    };
    const emojis = emojiMap[style] || emojiMap.default;
    document.querySelector('#reader-card-1 .reader-emoji').textContent = emojis[0];
    document.querySelector('#reader-card-2 .reader-emoji').textContent = emojis[1];
    document.querySelector('#reader-card-1 .reader-name').textContent = presets[0].name;
    document.querySelector('#reader-card-2 .reader-name').textContent = presets[1].name;

    // Update 3D characters colors
    if (state.characters.length >= 2) {
        for (let i = 0; i < 2; i++) {
            const char = state.characters[i];
            const preset = presets[i];
            if (char.parts.body?.render) {
                const mat = char.parts.body.render.meshInstances[0].material;
                mat.diffuse = new pc.Color(preset.bodyColor[0], preset.bodyColor[1], preset.bodyColor[2]);
                mat.update();
            }
            if (char.parts.hair?.render) {
                const mat = char.parts.hair.render.meshInstances[0].material;
                mat.diffuse = new pc.Color(preset.hairColor[0], preset.hairColor[1], preset.hairColor[2]);
                mat.update();
            }
        }
    }
}

// Controls
function startReading() { state.isPlaying = true; els.playIcon.textContent = '⏸'; startVisualReading(); }
function pauseReading() {
    state.isPlaying = false; state.isReading = false;
    els.playIcon.textContent = '▶';
    if (state.animationFrame) clearTimeout(state.animationFrame);
    state.characters.forEach(c => { c.stopTalking(); c.stopPointing(); });
    if (state.speechSynth) state.speechSynth.cancel();
}
function stopReading() {
    pauseReading();
    document.querySelectorAll('.word').forEach(w => w.classList.remove('current', 'read', 'visible'));
    document.getElementById('reader-card-1')?.classList.remove('active');
    document.getElementById('reader-card-2')?.classList.remove('active');
    state.currentWordIndex = 0;
    document.getElementById('progress-fill').style.width = '0%';
}
function togglePlayPause() { state.isPlaying ? pauseReading() : (state.currentWordIndex > 0 && state.currentWordIndex < state.words.length ? (state.isPlaying = true, els.playIcon.textContent = '⏸', state.isReading = true, state.characters[state.currentReader - 1].startTalking(), state.characters[state.currentReader - 1].startPointing(), animateReading()) : startReading()); }

// Events
function setupEvents() {
    els.uploadZone.addEventListener('click', () => els.pdfInput.click());
    els.uploadZone.addEventListener('dragover', e => { e.preventDefault(); els.uploadZone.classList.add('drag-over'); });
    els.uploadZone.addEventListener('dragleave', () => els.uploadZone.classList.remove('drag-over'));
    els.uploadZone.addEventListener('drop', e => { e.preventDefault(); els.uploadZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]?.type === 'application/pdf') loadPDF(e.dataTransfer.files[0]); });
    els.pdfInput.addEventListener('change', e => e.target.files[0] && loadPDF(e.target.files[0]));
    els.uploadBtn.addEventListener('click', () => els.pdfInput.click());
    els.settingsBtn.addEventListener('click', () => els.settingsPanel.classList.toggle('hidden'));
    els.closeSettings.addEventListener('click', () => els.settingsPanel.classList.add('hidden'));
    els.prevPageBtn.addEventListener('click', () => goToPage(state.currentPage - 1));
    els.nextPageBtn.addEventListener('click', () => goToPage(state.currentPage + 1));
    els.playPauseBtn.addEventListener('click', togglePlayPause);
    els.stopBtn.addEventListener('click', stopReading);
    els.speedSlider.addEventListener('input', e => { state.readingSpeed = parseFloat(e.target.value); els.speedValue.textContent = `${state.readingSpeed}x`; });
    els.newBookBtn.addEventListener('click', () => { stopReading(); state.pdfDoc = null; state.pages = []; state.currentPage = 0; els.welcomePanel.classList.remove('hidden'); els.readingControls.classList.add('hidden'); });

    // Settings toggles
    const ttsEl = document.getElementById('tts-enabled');
    const autoplayEl = document.getElementById('autoplay-on-load');
    const autoFlipEl = document.getElementById('auto-flip');
    const discussionEl = document.getElementById('discussion-mode');
    const charStyleEl = document.getElementById('character-style');

    if (ttsEl) ttsEl.addEventListener('change', e => {
        state.ttsEnabled = e.target.checked;
        if (!state.ttsEnabled && state.speechSynth) {
            state.speechSynth.cancel();
        }
    });
    if (autoplayEl) autoplayEl.addEventListener('change', e => state.autoplayOnLoad = e.target.checked);
    if (autoFlipEl) autoFlipEl.addEventListener('change', e => state.autoFlip = e.target.checked);
    if (discussionEl) discussionEl.addEventListener('change', e => state.discussionMode = e.target.checked);
    if (charStyleEl) charStyleEl.addEventListener('change', e => {
        state.characterStyle = e.target.value;
        updateCharacterStyle(e.target.value);
    });

    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateSceneTheme(btn.dataset.theme);
        });
    });

    // Init speech synthesis
    state.speechSynth = window.speechSynthesis;

    document.addEventListener('keydown', e => {
        if (!els.welcomePanel.classList.contains('hidden')) return;
        if (e.key === 'ArrowLeft') goToPage(state.currentPage - 1);
        if (e.key === 'ArrowRight') goToPage(state.currentPage + 1);
        if (e.key === ' ') { e.preventDefault(); togglePlayPause(); }
        if (e.key === 'Escape') stopReading();
    });
}

function updateSceneTheme(theme) {
    if (!state.app || !state.camera) return;

    const isLight = ['bright', 'cream', 'sky'].includes(theme);

    const themes = {
        library: { bg: new pc.Color(0.05, 0.03, 0.08), ambient: new pc.Color(0.15, 0.1, 0.2), key: new pc.Color(1, 0.9, 0.7), keyIntensity: 1.5 },
        cozy: { bg: new pc.Color(0.1, 0.06, 0.04), ambient: new pc.Color(0.2, 0.12, 0.08), key: new pc.Color(1, 0.7, 0.4), keyIntensity: 1.5 },
        nature: { bg: new pc.Color(0.1, 0.15, 0.1), ambient: new pc.Color(0.15, 0.2, 0.12), key: new pc.Color(0.9, 1, 0.8), keyIntensity: 1.5 },
        bright: { bg: new pc.Color(0.92, 0.94, 0.98), ambient: new pc.Color(0.9, 0.9, 0.95), key: new pc.Color(1, 1, 1), keyIntensity: 2.5 },
        cream: { bg: new pc.Color(0.96, 0.94, 0.88), ambient: new pc.Color(0.9, 0.85, 0.8), key: new pc.Color(1, 0.98, 0.9), keyIntensity: 2.5 },
        sky: { bg: new pc.Color(0.75, 0.88, 0.98), ambient: new pc.Color(0.8, 0.88, 0.95), key: new pc.Color(1, 1, 0.98), keyIntensity: 2.5 }
    };

    const t = themes[theme] || themes.library;

    // Update background
    state.camera.camera.clearColor = t.bg;

    // Update ambient light
    state.app.scene.ambientLight = t.ambient;

    // Update key light
    const keyLight = state.app.root.findByName('keyLight');
    if (keyLight?.light) {
        keyLight.light.color = t.key;
        keyLight.light.intensity = t.keyIntensity;
    }

    // Update floor and table for light themes
    const floor = state.app.root.findByName('floor');
    const table = state.app.root.findByName('table');

    if (floor?.render) {
        const floorMat = floor.render.meshInstances[0].material;
        if (isLight) {
            floorMat.diffuse = new pc.Color(0.85, 0.82, 0.78);
            floorMat.emissive = new pc.Color(0.3, 0.28, 0.25);
        } else {
            floorMat.diffuse = new pc.Color(0.15, 0.1, 0.08);
            floorMat.emissive = new pc.Color(0.05, 0.03, 0.02);
        }
        floorMat.update();
    }

    if (table?.render) {
        const tableMat = table.render.meshInstances[0].material;
        if (isLight) {
            tableMat.diffuse = new pc.Color(0.7, 0.55, 0.4);
            tableMat.emissive = new pc.Color(0.2, 0.15, 0.1);
        } else {
            tableMat.diffuse = new pc.Color(0.3, 0.2, 0.12);
            tableMat.emissive = new pc.Color(0.05, 0.03, 0.02);
        }
        tableMat.update();
    }

    console.log('Theme changed to:', theme, isLight ? '(light)' : '(dark)');
}

// Init
async function init() {
    try {
        await initPlayCanvas();
        createTextDisplayUI();
        setupEvents();
        setTimeout(() => { els.loadingScreen.classList.add('fade-out'); els.appContainer.classList.remove('hidden'); }, 800);
    } catch (e) {
        console.error(e);
        els.loadingScreen.querySelector('.loading-text').textContent = 'Error loading. Please refresh.';
    }
}

init();
