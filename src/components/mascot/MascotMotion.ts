import { Euler, Matrix4, Quaternion, Vector3, MathUtils, type Group } from 'three';
import type { MascotRig } from './MascotModel';

export type MascotAction = 'idle' | 'welcome' | 'helmet' | 'plan' | 'lab' | 'insights' | 'contact' | 'course';

type Prop = 'helmet' | 'blueprint' | 'tablet';
type Point = readonly [number, number, number];
type ReactionKind = 'hop' | 'greet' | 'thank' | 'nod';

interface Reaction {
  kind: ReactionKind;
  startedAt: number;
  side: 1 | -1;
}

interface ReactionMovement {
  rise: number;
  compression: number;
  tuck: number;
}

interface Pose {
  left: Vector3;
  right: Vector3;
  leftOpen: number;
  rightOpen: number;
  lean: number;
  turn: number;
  tilt: number;
  nod: number;
  gaze: number;
  smile: number;
}

const DOWN = new Vector3(0, -1, 0);
const Z = new Vector3(0, 0, 1);
const GRIP = new Vector3(0, -0.105, 0.045);
const REST_LEFT: Point = [0.44, 1.075, 0.075];
const REST_RIGHT: Point = [-0.44, 1.075, 0.075];
const PROP_FOR_ACTION: Partial<Record<MascotAction, Prop>> = {
  helmet: 'helmet',
  plan: 'blueprint',
  lab: 'tablet',
  course: 'tablet',
};
const BLINK_INTERVALS = [3.8, 5.1, 3.2, 4.7, 6.15];
const REACTION_SEQUENCE: ReactionKind[] = ['hop', 'thank', 'hop', 'greet'];
const REACTION_LENGTH: Record<ReactionKind, number> = {
  hop: 1.20,
  greet: 1.34,
  thank: 1.44,
  nod: .86,
};

function unit(value: number) {
  return MathUtils.clamp(value, 0, 1);
}

// Zero velocity at each end lets the limb settle into the next movement.
function ease(value: number) {
  const t = unit(value);
  return t * t * (3 - 2 * t);
}

function span(time: number, from: number, to: number) {
  return ease((time - from) / (to - from));
}

function envelope(time: number, start: number, peak: number, release: number, end: number) {
  return span(time, start, peak) * (1 - span(time, release, end));
}

function emptyPose(): Pose {
  return {
    left: new Vector3(...REST_LEFT),
    right: new Vector3(...REST_RIGHT),
    leftOpen: 0,
    rightOpen: 0,
    lean: 0,
    turn: 0,
    tilt: 0,
    nod: 0,
    gaze: 0,
    smile: 1,
  };
}

function copyPose(target: Pose, source: Pose) {
  target.left.copy(source.left);
  target.right.copy(source.right);
  target.leftOpen = source.leftOpen;
  target.rightOpen = source.rightOpen;
  target.lean = source.lean;
  target.turn = source.turn;
  target.tilt = source.tilt;
  target.nod = source.nod;
  target.gaze = source.gaze;
  target.smile = source.smile;
}

function blendPose(target: Pose, a: Pose, b: Pose, amount: number) {
  target.left.lerpVectors(a.left, b.left, amount);
  target.right.lerpVectors(a.right, b.right, amount);
  target.leftOpen = MathUtils.lerp(a.leftOpen, b.leftOpen, amount);
  target.rightOpen = MathUtils.lerp(a.rightOpen, b.rightOpen, amount);
  target.lean = MathUtils.lerp(a.lean, b.lean, amount);
  target.turn = MathUtils.lerp(a.turn, b.turn, amount);
  target.tilt = MathUtils.lerp(a.tilt, b.tilt, amount);
  target.nod = MathUtils.lerp(a.nod, b.nod, amount);
  target.gaze = MathUtils.lerp(a.gaze, b.gaze, amount);
  target.smile = MathUtils.lerp(a.smile, b.smile, amount);
}

function evaluateGesture(pose: Pose, action: MascotAction, time: number) {
  pose.left.set(...REST_LEFT);
  pose.right.set(...REST_RIGHT);
  pose.leftOpen = 0;
  pose.rightOpen = 0;
  pose.lean = 0;
  pose.turn = 0;
  pose.tilt = 0;
  pose.nod = 0;
  pose.gaze = 0;
  pose.smile = 1;

  switch (action) {
    case 'welcome': {
      const reach = envelope(time, 0.10, 0.72, 2.35, 3.10);
      const wave = envelope(time, 0.62, 0.90, 2.05, 2.35);
      const flick = Math.sin((time - 0.70) * Math.PI * 3.55) * wave;
      pose.left.x += reach * (0.20 + 0.053 * flick);
      pose.left.y += reach * (0.74 + 0.022 * flick);
      pose.left.z += reach * 0.21;
      pose.leftOpen = reach * (2.94 + 0.29 * flick);
      pose.right.z += 0.05 * reach;
      pose.lean = -0.045 * reach;
      pose.turn = 0.14 * reach;
      pose.tilt = 0.09 * reach;
      pose.nod = -0.065 * reach + 0.13 * envelope(time, 0.25, 0.53, 0.59, 0.84);
      const speaking = envelope(time, 0.78, 0.90, 1.73, 1.95);
      pose.smile += speaking * (0.20 + 0.33 * (0.5 + 0.5 * Math.sin(time * 25)));
      break;
    }
    case 'helmet': {
      pose.nod = 0.11 * envelope(time, 1.77, 2.00, 2.07, 2.32);
      pose.lean = 0.035;
      break;
    }
    case 'plan': {
      const reading = 1 - 0.82 * envelope(time % 6.8, 3.6, 4.2, 5.1, 5.75);
      pose.nod = 0.215 * reading;
      pose.gaze = Math.sin(time * 1.35) * 0.07 * reading;
      pose.tilt = -0.05 * reading;
      break;
    }
    case 'lab': {
      const curious = envelope(time % 6, 1.0, 1.6, 3.0, 3.8);
      pose.nod = 0.14 * curious + 0.025;
      pose.gaze = -0.085 * curious;
      pose.tilt = 0.095 * curious;
      break;
    }
    case 'insights': {
      const thought = envelope(time, 0.20, 0.95, 2.8, 3.60);
      const idea = envelope(time, 3.25, 3.80, 4.25, 4.94);
      pose.right.x += 0.24 * thought - 0.18 * idea;
      pose.right.y += 0.72 * thought + 0.57 * idea;
      pose.right.z += 0.25 * thought + 0.21 * idea;
      pose.rightOpen = -1.95 * thought - 2.50 * idea;
      pose.tilt = -0.14 * thought + 0.075 * idea;
      pose.nod = 0.11 * thought - 0.09 * idea;
      pose.gaze = -0.16 * thought + 0.03 * idea;
      pose.smile -= 0.23 * thought;
      break;
    }
    case 'contact': {
      const offer = envelope(time, 0.16, 0.82, 1.58, 2.46);
      pose.left.x += 0.16 * offer;
      pose.right.x -= 0.16 * offer;
      pose.left.y += 0.28 * offer;
      pose.right.y += 0.28 * offer;
      pose.left.z += 0.28 * offer;
      pose.right.z += 0.28 * offer;
      pose.leftOpen = 1.66 * offer;
      pose.rightOpen = -1.66 * offer;
      pose.nod = 0.13 * envelope(time, 0.72, 1.00, 1.12, 1.45);
      pose.smile += 0.14 * offer;
      break;
    }
    case 'course': {
      pose.tilt = 0.055;
      pose.nod = 0.07 * envelope(time % 7, 1.2, 1.45, 1.57, 1.85);
      pose.smile += 0.08;
      break;
    }
    case 'idle':
      break;
  }
}

function mixHand(pose: Pose, side: 1 | -1, position: Point, open: number, weight: number) {
  const hand = side === 1 ? pose.left : pose.right;
  hand.set(
    MathUtils.lerp(hand.x, side * position[0], weight),
    MathUtils.lerp(hand.y, position[1], weight),
    MathUtils.lerp(hand.z, position[2], weight),
  );
  if (side === 1) pose.leftOpen = MathUtils.lerp(pose.leftOpen, open, weight);
  else pose.rightOpen = MathUtils.lerp(pose.rightOpen, -open, weight);
}

function evaluateReaction(pose: Pose, movement: ReactionMovement, reaction: Reaction, time: number) {
  const side = reaction.side;
  if (reaction.kind === 'hop') {
    const load = envelope(time, 0, .16, .18, .27);
    const landing = envelope(time, .70, .81, .86, 1.13);
    const swing = envelope(time, .15, .36, .60, 1.16);
    const flight = unit((time - .24) / .50);
    // Ease along the ground for the first and last few frames of the arc.
    const release = span(flight, 0, .085) * (1 - span(flight, .91, 1));
    movement.rise = .29 * 4 * flight * (1 - flight) * release;
    movement.compression = .095 * load + .11 * landing;
    movement.tuck = envelope(flight, .03, .34, .61, .98);
    mixHand(pose, 1, [.52, 1.01, .018], .10, load * .65);
    mixHand(pose, -1, [.52, 1.01, .018], .10, load * .65);
    mixHand(pose, side, [.69, 1.91, .20], 2.58, swing);
    mixHand(pose, side === 1 ? -1 : 1, [.65, 1.76, .20], 2.28, swing);
    pose.lean += .17 * load - .09 * swing + .16 * landing;
    pose.nod += .13 * load - .09 * swing + .13 * landing;
    pose.tilt += side * .065 * swing;
    pose.smile += .30 * swing;
    return;
  }

  if (reaction.kind === 'greet') {
    const raise = envelope(time, 0, .30, .84, 1.34);
    const flick = Math.sin((time - .30) * 19) * envelope(time, .30, .43, .71, .90);
    mixHand(pose, side, [.67 + .045 * flick, 1.78, .25], 2.52 + .21 * flick, raise);
    pose.tilt += side * .11 * raise;
    pose.turn += side * .07 * raise;
    pose.nod += .10 * envelope(time, .38, .54, .58, .78);
    pose.smile += .19 * raise;
    return;
  }

  if (reaction.kind === 'thank') {
    const handOverHeart = envelope(time, .02, .42, 1.0, 1.44);
    const bow = envelope(time, .27, .58, .67, 1.15);
    mixHand(pose, side, [.135, 1.53, .32], 1.19, handOverHeart);
    movement.compression = .028 * bow;
    pose.lean += .14 * bow;
    pose.nod += .20 * bow;
    pose.tilt += side * .09 * handOverHeart;
    pose.smile += .14 * handOverHeart;
    return;
  }

  const acknowledgement = envelope(time, .05, .30, .46, .86);
  pose.nod += .13 * acknowledgement;
  pose.tilt += side * .06 * acknowledgement;
  pose.smile += .16 * acknowledgement;
}

function createArm(shoulder: Group, elbow: Group, wrist: Group, side: number) {
  const upperLength = elbow.position.length();
  const lowerLength = wrist.position.length();
  const aim = new Vector3();
  const guide = new Vector3();
  const perpendicular = new Vector3();
  const bend = new Vector3();
  const forearm = new Vector3();
  const orientation = new Quaternion();
  const inverse = new Quaternion();

  return (
    target: Vector3,
    open: number,
    rootToBody: Matrix4,
    rootToBodyRotation: Quaternion,
  ) => {
    aim.copy(target).applyMatrix4(rootToBody).sub(shoulder.position);
    const distance = MathUtils.clamp(aim.length(), 0.08, upperLength + lowerLength - 0.002);
    aim.normalize();
    guide.set(side * 0.86, 1.12, -0.08).applyMatrix4(rootToBody).sub(shoulder.position);
    perpendicular.copy(guide).addScaledVector(aim, -guide.dot(aim)).normalize();
    const along = (upperLength ** 2 - lowerLength ** 2 + distance ** 2) / (2 * distance);
    const offset = Math.sqrt(Math.max(0, upperLength ** 2 - along ** 2));
    bend.copy(aim).multiplyScalar(along).addScaledVector(perpendicular, offset);
    forearm.copy(aim).multiplyScalar(distance).sub(bend).normalize();

    shoulder.quaternion.setFromUnitVectors(DOWN, bend.normalize());
    inverse.copy(shoulder.quaternion).invert();
    elbow.quaternion.setFromUnitVectors(DOWN, forearm.applyQuaternion(inverse));
    orientation.setFromAxisAngle(Z, open);
    wrist.quaternion
      .copy(shoulder.quaternion)
      .multiply(elbow.quaternion)
      .invert()
      .multiply(rootToBodyRotation)
      .multiply(orientation);
  };
}

function createPlantedLeg(hip: Group, knee: Group, ankle: Group) {
  const rest = hip.position.clone();
  const upper = knee.position.length();
  const lower = ankle.position.length();
  const direction = new Vector3();
  const bend = new Vector3();
  const shin = new Vector3();
  const inverse = new Quaternion();

  return (shift: number, drop: number, tuck: number, toePitch: number) => {
    hip.position.set(rest.x + shift, rest.y - drop, rest.z);
    direction.set(-shift, -upper - lower + drop + tuck, 0);
    const distance = direction.length();
    direction.normalize();
    const along = (upper ** 2 - lower ** 2 + distance ** 2) / (2 * distance);
    bend.copy(direction).multiplyScalar(along);
    bend.z = Math.sqrt(Math.max(0, upper ** 2 - along ** 2));
    shin.copy(direction).multiplyScalar(distance).sub(bend).normalize();
    hip.quaternion.setFromUnitVectors(DOWN, bend.normalize());
    inverse.copy(hip.quaternion).invert();
    knee.quaternion.setFromUnitVectors(DOWN, shin.applyQuaternion(inverse));
    ankle.quaternion.copy(hip.quaternion).multiply(knee.quaternion).invert();
    ankle.rotateX(toePitch);
  };
}

export function createMascotMotion(rig: MascotRig) {
  const current = emptyPose();
  const from = emptyPose();
  const target = emptyPose();
  const composed = emptyPose();
  const rootRest = rig.root.position.y;
  const bodyRest = rig.body.position.clone();
  const shoulderRest = rig.leftShoulder.position.y;
  const headRest = rig.head.position.y;
  const leftEyeRest = rig.leftEye.position.clone();
  const rightEyeRest = rig.rightEye.position.clone();
  const eyeLeftHeight = rig.leftEye.scale.y;
  const eyeRightHeight = rig.rightEye.scale.y;
  const mouthWidth = rig.mouth.scale.x;
  const mouthHeight = rig.mouth.scale.y;
  const surpriseMouth = rig.surpriseMouth;
  const surpriseMouthWidth = surpriseMouth.scale.x;
  const surpriseMouthHeight = surpriseMouth.scale.y;
  const applyLeftArm = createArm(rig.leftShoulder, rig.leftElbow, rig.leftWrist, 1);
  const applyRightArm = createArm(rig.rightShoulder, rig.rightElbow, rig.rightWrist, -1);
  const applyLeftLeg = createPlantedLeg(rig.leftHip, rig.leftKnee, rig.leftAnkle);
  const applyRightLeg = createPlantedLeg(rig.rightHip, rig.rightKnee, rig.rightAnkle);
  const rootInverse = new Matrix4();
  const rootToBody = new Matrix4();
  const rootToBodyRotation = new Quaternion();
  const headToRootRotation = new Quaternion();
  const rotationScratch = new Quaternion();
  const positionScratch = new Vector3();
  const propPosition = new Vector3();
  const propEuler = new Euler();
  const propRotation = new Quaternion();
  const propLift = new Vector3();
  const propStow = new Vector3();
  const heldPoint = new Vector3();
  const wristPoint = new Vector3();
  let tabletPresentation = 0;
  let action: MascotAction = 'idle';
  let carried: Prop | undefined;
  let progress = 0;
  let propVelocity = 0;
  let clock = 0;
  let actionTime = 0;
  let crossfade = 1;
  let blinkIndex = 0;
  let lastBlink = -1;
  let nextBlink = 2.25;
  let retractForReplay = false;
  let reaction: Reaction | undefined;
  let reactionIndex = 0;
  let nextReactionAt = 0;
  let pointerNear = false;
  const movement: ReactionMovement = { rise: 0, compression: 0, tuck: 0 };
  const pointer = { x: 0, y: 0, proximity: 0, impulse: 0 };
  const attention = { x: 0, y: 0, proximity: 0, surprise: 0, weight: 1 };

  function setPointer(x: number, y: number, proximity: number, speed: number) {
    pointer.x = MathUtils.clamp(x, -1, 1);
    pointer.y = MathUtils.clamp(y, -1, 1);
    pointer.proximity = unit(proximity);
    const suddenApproach = span(speed, 0.56, 0.95) * span(pointer.proximity, 0.37, 0.85);
    pointer.impulse = pointer.proximity > 0 ? Math.max(pointer.impulse, suddenApproach) : 0;
  }

  function updateAttention(delta: number, puttingOn: number) {
    const headroom = carried === 'helmet' ? 0.8 - 0.72 * puttingOn
      : carried || action === 'insights' ? 0.48
      : 1;
    attention.weight = MathUtils.damp(attention.weight, headroom, 10, delta);
    const influence = pointer.proximity * attention.weight;
    attention.x = MathUtils.damp(attention.x, pointer.x * influence, 10, delta);
    attention.y = MathUtils.damp(attention.y, pointer.y * influence, 10, delta);
    attention.proximity = MathUtils.damp(attention.proximity, influence, 7, delta);
    const surprise = pointer.impulse * attention.weight;
    attention.surprise = MathUtils.damp(attention.surprise, surprise, surprise > attention.surprise ? 18 : 7, delta);
    pointer.impulse = MathUtils.damp(pointer.impulse, 0, 3.8, delta);
  }

  function updateReaction() {
    if (reaction && clock - reaction.startedAt >= REACTION_LENGTH[reaction.kind]) {
      reaction = undefined;
    }
    if (pointer.proximity <= .39) pointerNear = false;
    if (pointerNear || pointer.proximity < .73) return;
    pointerNear = true;
    if (clock < nextReactionAt || reaction) return;

    // Acknowledging the visitor with the face leaves active props in their grip.
    const handsOccupied = Boolean(carried || PROP_FOR_ACTION[action]) || (action === 'insights' && actionTime < 4.95);
    const kind = handsOccupied ? 'nod' : REACTION_SEQUENCE[reactionIndex++ % REACTION_SEQUENCE.length];
    reaction = { kind, startedAt: clock, side: pointer.x < 0 ? -1 : 1 };
    nextReactionAt = clock + 3.15;
  }

  function updateMouth(smile: number, surprise: number) {
    const width = mouthWidth * (1 + 0.23 * smile);
    const height = mouthHeight * (composed.smile + 0.13 * smile);

    // Swap shapes while the mouth is nearly closed so the corners never jump.
    const transition = span(surprise, 0.06, 0.63);
    const smileAmount = 1 - span(transition, 0, 0.55);
    const surpriseAmount = span(transition, 0.42, 1);
    rig.mouth.visible = smileAmount > 0.01;
    rig.mouth.scale.x = width * smileAmount;
    rig.mouth.scale.y = height * Math.sqrt(smileAmount);
    surpriseMouth.visible = surpriseAmount > 0.01;
    surpriseMouth.scale.x = surpriseMouthWidth * surpriseAmount;
    surpriseMouth.scale.y = surpriseMouthHeight * Math.sqrt(surpriseAmount);
  }

  function setAction(next: MascotAction, replay = false) {
    if (next === action && !replay) return;
    retractForReplay = next === action && replay && progress > 0 && carried === PROP_FOR_ACTION[next];
    copyPose(from, current);
    action = next;
    actionTime = 0;
    crossfade = 0;
  }

  function updatePropProgress(delta: number) {
    const wanted = PROP_FOR_ACTION[action];
    if (!carried) carried = wanted;
    if (!carried) return;
    const active = carried === wanted && !retractForReplay;
    const duration = carried === 'helmet' ? (active ? 2.05 : 1.45) : 0.85;
    const speed = (active ? 1 : -1) / duration;
    propVelocity = MathUtils.damp(propVelocity, speed, 14, delta);
    progress = unit(progress + propVelocity * delta);
    if (progress === 1 && active) propVelocity = 0;
    if (progress === 0 && !active) {
      carried = wanted;
      propVelocity = 0;
      retractForReplay = false;
    }
  }

  function gripWrist(
    hand: Vector3,
    gripPoint: Vector3,
    gripAngle: number,
    weight: number,
  ) {
    rotationScratch.setFromAxisAngle(Z, gripAngle);
    wristPoint.copy(GRIP).applyQuaternion(rotationScratch).negate().add(gripPoint);
    hand.lerp(wristPoint, weight);
  }

  function animateHelmet(pose: Pose, p: number) {
    const { hat, head } = rig;
    const grab = span(p, 0.02, 0.20) * (1 - span(p, 0.60, 0.76));
    const lift = span(p, 0.10, 0.62);
    const seat = span(p, 0.62, 0.85);
    const size = span(p, 0.0, 0.29);
    const helmetDepth = 1.34;
    propStow.set(0.32, 1.01, -0.36);
    propLift.set(0.66, 1.89, 0.17);
    propPosition.lerpVectors(propStow, propLift, lift);
    propPosition.y += Math.sin(lift * Math.PI) * 0.045;
    propEuler.set(
      MathUtils.lerp(-0.26, 0.12, lift),
      MathUtils.lerp(-0.68, -0.15, lift),
      MathUtils.lerp(0.45, -0.18, lift),
    );
    propRotation.setFromEuler(propEuler);
    positionScratch.set(0, 0.894, 0.015);
    head.localToWorld(positionScratch);
    positionScratch.applyMatrix4(rootInverse);
    propPosition.lerp(positionScratch, seat);
    const clearance = Math.sin(seat * Math.PI);
    propPosition.y += clearance * 0.32;
    propPosition.z += clearance * 0.37;
    rig.root.getWorldQuaternion(headToRootRotation).invert();
    head.getWorldQuaternion(rotationScratch);
    headToRootRotation.multiply(rotationScratch);
    propRotation.slerp(headToRootRotation, seat);
    hat.visible = p > 0.001;
    hat.position.copy(propPosition);
    hat.quaternion.copy(propRotation);
    hat.scale.set(size, size, size * helmetDepth);

    // Keep the hand under the closest part of the brim until it releases.
    const handAngle = 2.18 - lift * 0.32;
    heldPoint.set(-0.26, -0.026, 0.323 * helmetDepth)
      .multiplyScalar(size)
      .applyQuaternion(propRotation)
      .add(propPosition);
    gripWrist(pose.left, heldPoint, handAngle, grab);
    pose.leftOpen = MathUtils.lerp(pose.leftOpen, handAngle, grab);
    const balance = envelope(p, 0.20, 0.56, 0.72, 0.94);
    pose.right.x -= 0.10 * balance;
    pose.right.y += 0.11 * balance;
    pose.right.z += 0.04 * balance;
  }

  function animateDocument(pose: Pose, p: number, blueprint: boolean) {
    const document = blueprint ? rig.blueprint : rig.tablet;
    const amount = span(p, 0.02, 0.83);
    const size = span(p, 0.0, 0.36);
    const x = blueprint ? 0 : 0.18;
    const y = blueprint ? 1.37 : 1.38;
    const beat = blueprint ? 0 : envelope(actionTime % 5, 1.20, 1.60, 1.70, 2.10);
    propStow.set(0.33, 1.015, -0.28);
    propLift.set(x, y, 0.34);
    propPosition.lerpVectors(propStow, propLift, amount);
    propPosition.z += 0.11 * Math.sin(amount * Math.PI);
    propPosition.y += Math.sin(clock * 2) * 0.009 * amount;
    propEuler.set(
      MathUtils.lerp(0.14, blueprint ? -0.32 : -0.40, amount),
      MathUtils.lerp(-1.38, blueprint ? 0.025 : -0.17, amount),
      MathUtils.lerp(0.40, blueprint ? -0.075 : -0.16, amount),
    );
    document.visible = p > 0.001;
    document.position.copy(propPosition);
    document.rotation.copy(propEuler);
    document.scale.setScalar(size);

    const leftAngle = -1.96;
    const rightAngle = 1.98;
    propRotation.setFromEuler(propEuler);
    heldPoint.set(blueprint ? 0.30 : 0.202, blueprint ? -0.15 : -0.105, 0.04)
      .multiplyScalar(size)
      .applyQuaternion(propRotation)
      .add(propPosition);
    gripWrist(pose.left, heldPoint, leftAngle, span(p, 0.015, 0.29));
    pose.leftOpen = MathUtils.lerp(pose.leftOpen, leftAngle, span(p, 0.015, 0.29));

    const secondHand = span(p, 0.38, 0.92);
    if (blueprint) {
      heldPoint.set(-0.30, -0.148, 0.038)
        .multiplyScalar(size)
        .applyQuaternion(propRotation)
        .add(propPosition);
      gripWrist(pose.right, heldPoint, rightAngle, secondHand);
      pose.rightOpen = MathUtils.lerp(pose.rightOpen, rightAngle, secondHand);
    } else {
      const gesture = MathUtils.lerp(beat, 0.38 + 0.38 * beat, tabletPresentation);
      pose.right.x += 0.36 * secondHand * gesture;
      pose.right.y += 0.31 * secondHand * gesture;
      pose.right.z += 0.28 * secondHand * gesture;
      pose.rightOpen = MathUtils.lerp(pose.rightOpen, -2.32, secondHand * gesture);
    }
  }

  function update(deltaSeconds: number) {
    const delta = MathUtils.clamp(deltaSeconds, 0, 0.055);
    clock += delta;
    tabletPresentation = MathUtils.damp(tabletPresentation, action === 'course' ? 1 : 0, 7, delta);
    // A route selected in midair should wait for the landing before picking up a prop.
    const landing = reaction?.kind === 'hop' && clock - reaction.startedAt < .95;
    if (!landing) updatePropProgress(delta);
    if (!retractForReplay && (!carried || carried === PROP_FOR_ACTION[action])) actionTime += delta;
    crossfade = unit(crossfade + delta / 0.43);
    evaluateGesture(target, action, actionTime);
    blendPose(current, from, target, ease(crossfade));
    copyPose(composed, current);
    movement.rise = 0;
    movement.compression = 0;
    movement.tuck = 0;
    updateReaction();
    if (reaction) evaluateReaction(composed, movement, reaction, clock - reaction.startedAt);

    // Small rhythm differences keep the head, torso and breath from moving in lockstep.
    const breath = Math.sin(clock * 1.85);
    const drift = Math.sin(clock * 0.95 + 0.8);
    const puttingOn = carried === 'helmet' ? envelope(progress, 0.20, 0.65, 0.78, 0.97) : 0;
    updateAttention(delta, puttingOn);
    const { x: lookX, y: lookY, proximity, surprise } = attention;
    const curiosity = lookX * (0.65 + 0.35 * Math.abs(lookX)) * (1 - surprise);
    const pelvisShift = drift * .021 + composed.turn * .13 - puttingOn * .037;
    const pelvisDrop = .004 + puttingOn * .042 + (1 - breath) * .004 + movement.compression;
    rig.root.position.y = rootRest + movement.rise;
    applyLeftLeg(pelvisShift, pelvisDrop, .042 * movement.tuck, .12 * movement.tuck);
    applyRightLeg(pelvisShift, pelvisDrop, .016 * movement.tuck, .19 * movement.tuck);
    rig.body.position.copy(bodyRest);
    rig.body.position.x += pelvisShift;
    rig.body.position.y += breath * 0.008 - puttingOn * 0.05 - movement.compression;
    rig.body.rotation.set(composed.lean + puttingOn * 0.075, composed.turn * 0.72, drift * 0.016 - puttingOn * 0.10);
    rig.leftShoulder.position.y = shoulderRest + puttingOn * 0.042;
    rig.head.position.y = headRest - puttingOn * 0.045;
    rig.head.rotation.set(
      composed.nod + 0.022 * breath + puttingOn * 0.16 - 0.11 * lookY - 0.055 * surprise,
      composed.gaze + 0.033 * Math.sin(clock * 0.61) - puttingOn * 0.12 + 0.25 * lookX,
      composed.tilt + 0.022 * drift - puttingOn * 0.45 - 0.125 * curiosity,
    );

    if (clock >= nextBlink) {
      lastBlink = nextBlink;
      nextBlink += BLINK_INTERVALS[blinkIndex++ % BLINK_INTERVALS.length];
    }
    const blink = 1 - 0.94 * envelope(clock - lastBlink, 0, 0.075, 0.10, 0.19);
    const smile = span(proximity, 0.28, 0.88) * (1 - surprise);
    const eyeOpening = 1 + 0.38 * surprise - 0.08 * smile;
    rig.leftEye.position.copy(leftEyeRest);
    rig.rightEye.position.copy(rightEyeRest);
    rig.leftEye.position.x += 0.018 * lookX;
    rig.rightEye.position.x += 0.018 * lookX;
    rig.leftEye.position.y += 0.013 * lookY;
    rig.rightEye.position.y += 0.013 * lookY;
    rig.leftEye.scale.y = eyeLeftHeight * blink * (eyeOpening + 0.15 * curiosity);
    rig.rightEye.scale.y = eyeRightHeight * blink * (eyeOpening - 0.15 * curiosity);
    updateMouth(smile, surprise);

    rig.root.updateWorldMatrix(true, false);
    rig.head.updateWorldMatrix(true, false);
    rootInverse.copy(rig.root.matrixWorld).invert();
    rootToBody.copy(rootInverse).multiply(rig.body.matrixWorld).invert();
    rootToBodyRotation.setFromRotationMatrix(rootToBody);

    rig.hat.visible = false;
    rig.blueprint.visible = false;
    rig.tablet.visible = false;
    if (carried === 'helmet') animateHelmet(composed, progress);
    if (carried === 'blueprint' || carried === 'tablet') animateDocument(composed, progress, carried === 'blueprint');

    applyLeftArm(composed.left, composed.leftOpen, rootToBody, rootToBodyRotation);
    applyRightArm(composed.right, composed.rightOpen, rootToBody, rootToBodyRotation);
  }

  function reset(next: MascotAction = 'idle') {
    action = next;
    actionTime = 0;
    clock = 0;
    crossfade = 1;
    tabletPresentation = next === 'course' ? 1 : 0;
    carried = PROP_FOR_ACTION[next];
    progress = 0;
    propVelocity = 0;
    retractForReplay = false;
    blinkIndex = 0;
    lastBlink = -1;
    nextBlink = 2.25;
    reaction = undefined;
    reactionIndex = 0;
    nextReactionAt = 0;
    pointerNear = false;
    Object.assign(pointer, { x: 0, y: 0, proximity: 0, impulse: 0 });
    Object.assign(attention, { x: 0, y: 0, proximity: 0, surprise: 0, weight: 1 });
    update(0);
  }

  reset();

  return { setAction, setPointer, update, reset };
}
