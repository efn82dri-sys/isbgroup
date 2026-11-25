import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  DoubleSide,
  ClampToEdgeWrapping,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Path,
  PlaneGeometry,
  RepeatWrapping,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector2,
  Vector3,
  type MeshStandardMaterialParameters,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export interface MascotRig {
  root: Group;
  body: Group;
  head: Group;
  leftShoulder: Group;
  rightShoulder: Group;
  leftElbow: Group;
  rightElbow: Group;
  leftWrist: Group;
  rightWrist: Group;
  leftHip: Group;
  rightHip: Group;
  leftKnee: Group;
  rightKnee: Group;
  leftAnkle: Group;
  rightAnkle: Group;
  leftEye: Group;
  rightEye: Group;
  mouth: Group;
  surpriseMouth: Group;
  hat: Group;
  blueprint: Group;
  tablet: Group;
}

type Point = readonly [number, number];
type Point3 = readonly [number, number, number];
type Material = MeshStandardMaterial;

function standard(color: string, roughness = 0.65, extra?: MeshStandardMaterialParameters) {
  return new MeshStandardMaterial({ color, roughness, ...extra });
}

function pivot(parent: Group, x = 0, y = 0, z = 0) {
  const group = new Group();
  group.position.set(x, y, z);
  parent.add(group);
  return group;
}

function part(parent: Group, geometry: Mesh['geometry'], material: Material, x: number, y: number, z: number) {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function createTexture(size: number, paint: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx, size);
  return new CanvasTexture(canvas);
}

function makeTextile() {
  const texture = createTexture(128, (ctx, size) => {
    let noise = 41;
    const pixels = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        noise = (noise * 1664525 + 1013904223) >>> 0;
        const weft = Math.cos(Math.PI * x / 2) * Math.cos(Math.PI * (y + x / 2) / 2);
        const value = 128 + 20 * weft + (noise >>> 28) - 8;
        const offset = 4 * (y * size + x);
        pixels.data.set([value, value, value, 255], offset);
      }
    }
    ctx.putImageData(pixels, 0, 0);
  });
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

const MARK_OUTLINE: Point[] = [
  [0, 1.042], [.048, 1.038], [.083, 1.004], [.227, .920], [.227, .822],
  [.334, .762], [.433, .698], [.435, .553], [.530, .478], [.529, .267],
  [.452, .172], [.358, .091], [.248, .036], [.137, .008], [.062, .003],
  [.058, -.059], [-.054, -.061], [-.058, .003], [-.161, .014], [-.254, .043],
  [-.369, .099], [-.458, .178], [-.529, .267], [-.531, .478], [-.432, .553],
  [-.428, .699], [-.331, .764], [-.229, .822], [-.229, .920], [-.084, 1.004],
  [-.047, 1.038],
];

const FACE_RIGHT: Point[] = [
  [0, .890], [.109, .820], [.110, .713], [.233, .670], [.325, .614],
  [.339, .479], [.417, .414], [.416, .313], [.352, .228], [.274, .165],
  [.188, .122], [.056, .089],
];
const FACE_LEFT: Point[] = [
  [-.056, .089], [-.187, .123], [-.273, .166], [-.350, .229], [-.416, .313],
  [-.417, .414], [-.340, .479], [-.325, .614], [-.233, .670], [-.110, .713],
  [-.109, .820],
];
const FACE_OUTLINE: Point[] = [
  ...FACE_RIGHT, [.057, .149], [-.055, .149], ...FACE_LEFT,
];

function roundOutline(points: Point[], rounding: number) {
  const shape = new Shape();
  const interpolate = (from: Point, to: Point, fraction: number): Point => [
    from[0] + (to[0] - from[0]) * fraction,
    from[1] + (to[1] - from[1]) * fraction,
  ];
  for (let index = 0; index < points.length; index++) {
    const corner = points[index];
    const before = interpolate(corner, points[(index + points.length - 1) % points.length], rounding);
    const after = interpolate(corner, points[(index + 1) % points.length], rounding);
    if (index === 0) shape.moveTo(...before);
    else shape.lineTo(...before);
    shape.quadraticCurveTo(...corner, ...after);
  }
  shape.closePath();
  return shape;
}

function faceDepth(x: number, y: number) {
  return .172 + .067 * Math.max(0, 1 - (x / .49) ** 2 - ((y - .46) / .54) ** 2);
}

function shapeFace() {
  // The ivory panel also fills beneath the chin tab. The navy frame masks it
  // and leaves the exact opening visible even when the head turns.
  const outline = roundOutline([...FACE_RIGHT, [0, .072], ...FACE_LEFT], .21).getPoints(5);
  outline.pop();
  const centerY = .46;
  const rings = 8;
  const positions = [0, centerY, faceDepth(0, centerY)];
  const uvs = [.5, centerY];
  const indices: number[] = [];
  const sides = outline.length;
  for (let ring = 1; ring <= rings; ring++) {
    for (let side = 0; side < sides; side++) {
      const fraction = ring / rings * 1.065;
      const x = outline[side].x * fraction;
      const y = centerY + (outline[side].y - centerY) * fraction;
      positions.push(x, y, faceDepth(x, y));
      uvs.push(.5 + x, y);
      const current = 1 + (ring - 1) * sides + side;
      const next = 1 + (ring - 1) * sides + (side + 1) % sides;
      if (ring === 1) indices.push(0, next, current);
      else indices.push(current - sides, next, current, current - sides, next - sides, next);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

export function createMascotModel(): MascotRig {
  const root = new Group();
  const unitSphere = new SphereGeometry(1, 24, 16);
  const fabric = makeTextile();
  const textile = { bumpMap: fabric, bumpScale: .004 };
  const indigo = standard('#233b59', .77, textile);
  const seamBlue = standard('#3c5674', .8, textile);
  const vestBlue = standard('#1e3957', .72, textile);
  const cargo = standard('#21314a', .88, textile);
  const cargoShadow = standard('#17263c', .86, textile);
  const olive = standard('#8aab62', .77, textile);
  const darkOlive = standard('#527040', .79, textile);
  const rubber = standard('#f4eee7', .59);
  const pale = standard('#e4e6da', .81, textile);
  const ivory = standard('#fae9db', .65);
  const shell = standard('#203e66', .43, { metalness: .04 });
  const shellEdge = standard('#142c4d', .55);
  const orange = standard('#fe8225', .58);
  const orangeShadow = standard('#b94b17', .67);
  const highlight = standard('#fff6ed', .47);
  const black = standard('#111116', .22);
  const mouthTint = standard('#c9645d', .54);
  const metal = standard('#b6b8a8', .27, { metalness: .7 });
  const stitch = standard('#728084', .82);
  const jacketGreen = standard('#86a65d', .69, textile);
  const ribbing = standard('#152d45', .88, textile);
  const sneakerLeather = standard('#203c58', .59, textile);
  const sneakerMesh = standard('#34506c', .88, textile);

  function round(parent: Group, material: Material, width: number, height: number, depth: number, radius: number, x: number, y: number, z: number) {
    return part(parent, new RoundedBoxGeometry(width, height, depth, 3, radius), material, x, y, z);
  }

  function oval(parent: Group, material: Material, x: number, y: number, z: number, width: number, height: number, depth: number) {
    const mesh = part(parent, unitSphere, material, x, y, z);
    mesh.scale.set(width, height, depth);
    return mesh;
  }

  function piping(parent: Group, material: Material, points: Point3[], radius: number, closed = false) {
    const path = new CatmullRomCurve3(points.map(point => new Vector3(...point)), closed);
    return part(parent, new TubeGeometry(path, Math.max(9, points.length * 3), radius, 5, closed), material, 0, 0, 0);
  }

  function brand(parent: Group, material: Material, x: number, y: number, z: number, size: number) {
    // Use the contour of the head at a second scale for the woven brand badge.
    const outline = MARK_OUTLINE.map(([u, v]) => [x + u * size, y + (v - .5) * size, z] as const);
    piping(parent, material, outline, size * .038, true);
  }

  function clothForm(parent: Group, material: Material, profile: Point[], depth: number, x = 0, z = 0) {
    const curve = new CatmullRomCurve3(profile.map(([radius, height]) => new Vector3(radius, height, 0)));
    const outline = curve.getPoints(profile.length * 2).map(({ x: radius, y: height }) => (
      new Vector2(Math.max(0, radius), height)
    ));
    const fabricShape = part(parent, new LatheGeometry(outline, 24), material, x, 0, z);
    fabricShape.scale.z = depth;
    return fabricShape;
  }

  function jacketPanel(parent: Group, material: Material, points: Point[], front: number) {
    const geometry = new ExtrudeGeometry(roundOutline(points, .2), {
      depth: .008,
      bevelEnabled: true,
      bevelThickness: .006,
      bevelSize: .005,
      bevelSegments: 2,
      curveSegments: 4,
    });
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      position.setZ(i, position.getZ(i) + front - .76 * x ** 2 - .21 * (y - .33) ** 2);
    }
    geometry.computeVertexNormals();
    return part(parent, geometry, material, 0, 0, 0);
  }

  const body = pivot(root, 0, 1.10, 0);
  oval(body, cargo, 0, .014, .006, .302, .135, .191);
  clothForm(body, vestBlue, [
    [0, .067], [.266, .069], [.323, .089], [.347, .148], [.343, .215],
    [.357, .30], [.373, .398], [.366, .472], [.326, .522], [.235, .567],
    [.141, .584], [0, .586],
  ], .66);
  clothForm(body, ribbing, [[0, .059], [.282, .059], [.316, .069], [.320, .102], [.292, .121], [0, .125]], .64);
  jacketPanel(body, pale, [[-.072, .126], [.075, .126], [.073, .49], [.121, .564], [-.112, .564], [-.066, .492]], .246);
  jacketPanel(body, jacketGreen, [[-.077, .128], [-.285, .126], [-.334, .191], [-.329, .352], [-.218, .368], [-.076, .352]], .246);
  jacketPanel(body, jacketGreen, [[.222, .128], [.287, .128], [.334, .189], [.319, .286], [.259, .279]], .246);
  jacketPanel(body, jacketGreen, [[-.080, .092], [-.288, .090], [-.302, .118], [-.084, .118]], .236);
  jacketPanel(body, jacketGreen, [[.225, .092], [.287, .093], [.302, .118], [.221, .118]], .236);

  round(body, cargoShadow, .53, .074, .349, .034, 0, .054, .026);
  round(body, metal, .064, .044, .022, .012, 0, .059, .210);
  round(body, indigo, .040, .023, .010, .006, 0, .060, .222);
  oval(body, ribbing, 0, .551, -.037, .235, .098, .173);
  oval(body, ivory, 0, .588, .020, .126, .102, .113);

  for (const sign of [-1, 1]) {
    const frontX = sign * .078;
    const collar = oval(body, jacketGreen, sign * .145, .545, .161, .111, .045, .085);
    collar.rotation.set(-.16, sign * -.24, sign * .35);
    piping(body, ribbing, [
      [frontX, .106, .238], [frontX * .94, .223, .250], [frontX * .90, .397, .249],
      [frontX * 1.23, .515, .220],
    ], .014);
    piping(body, stitch, [
      [frontX * .94, .155, .251], [frontX * .87, .294, .260], [frontX * .90, .440, .258],
    ], .003);
    piping(body, ribbing, [
      [sign * .190, .157, .239], [sign * .219, .202, .227], [sign * .248, .247, .211],
    ], .013);
    piping(body, seamBlue, [
      [sign * .186, .153, .249], [sign * .214, .202, .240], [sign * .245, .249, .226],
    ], .0028);
    oval(body, metal, sign * .167, .057, .207, .009, .009, .004);
  }
  piping(body, darkOlive, [[-.077, .516, .247], [-.018, .467, .255], [.073, .529, .242]], .006);
  piping(body, darkOlive, [[-.310, .335, .180], [-.207, .365, .219], [-.086, .349, .247]], .003);
  round(body, metal, .018, .038, .017, .006, .074, .372, .265);
  brand(body, highlight, .180, .421, .240, .113);
  brand(body, pale, -.043, .412, -.248, .122);
  for (const layer of [.183, .273, .350]) {
    piping(body, seamBlue, [
      [-.286, layer, -.139], [-.158, layer - .011, -.210], [0, layer - .016, -.238],
      [.158, layer - .011, -.210], [.286, layer, -.139],
    ], .0035);
  }

  const head = pivot(body, 0, .66, 0);
  const backPlate = roundOutline(MARK_OUTLINE, .23);
  const frame = roundOutline(MARK_OUTLINE, .21);
  const opening = new Path();
  opening.curves = roundOutline([...FACE_OUTLINE].reverse(), .16).curves;
  frame.holes.push(opening);
  const shellEdges = { steps: 1, bevelEnabled: true, bevelSegments: 5, curveSegments: 5 };
  part(head, new ExtrudeGeometry(backPlate, {
    ...shellEdges, depth: .253, bevelThickness: .048, bevelSize: .026,
  }), shellEdge, 0, 0, -.247);
  part(head, new ExtrudeGeometry(frame, {
    ...shellEdges, depth: .195, bevelThickness: .025, bevelSize: .018,
  }), shell, 0, 0, .041);

  const faceTexture = createTexture(256, (ctx, size) => {
    const light = ctx.createRadialGradient(size * .49, size * .43, size * .12, size * .5, size * .50, size * .49);
    light.addColorStop(0, '#fff4ed');
    light.addColorStop(.75, '#f9e8df');
    light.addColorStop(1, '#ead1c7');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, size, size);
    for (const x of [.255, .745]) {
      const cheek = ctx.createRadialGradient(size * x, size * .716, 0, size * x, size * .716, size * .087);
      cheek.addColorStop(0, 'rgba(217,133,121,.32)');
      cheek.addColorStop(.61, 'rgba(223,148,131,.16)');
      cheek.addColorStop(1, 'rgba(223,148,131,0)');
      ctx.fillStyle = cheek;
      ctx.fillRect(0, 0, size, size);
    }
  });
  faceTexture.colorSpace = SRGBColorSpace;
  const skin = standard('#ffffff', .71, { map: faceTexture });
  part(head, shapeFace(), skin, 0, 0, 0);

  function eye(sign: number) {
    const x = sign * .180;
    const y = .398;
    const holder = pivot(head, x, y, faceDepth(x, y) + .010);
    holder.rotation.set(0, sign * .080, sign * -.073);
    oval(holder, black, 0, 0, 0, .060, .082, .029);
    oval(holder, highlight, -.013, .040, .022, .009, .014, .003);
    piping(holder, black, [
      [sign * .040, .043, .013], [sign * .071, .048, .012], [sign * .082, .068, .010],
    ], .008);
    piping(holder, black, [
      [sign * .045, .034, .012], [sign * .072, .035, .011], [sign * .087, .051, .009],
    ], .006);
    return holder;
  }

  const leftEye = eye(1);
  const rightEye = eye(-1);
  const mouth = pivot(head, 0, .263, faceDepth(0, .263) + .009);
  const smile = new Shape();
  smile.moveTo(-.088, .015);
  smile.bezierCurveTo(-.069, .011, -.047, -.002, 0, -.001);
  smile.bezierCurveTo(.046, -.002, .068, .011, .089, .017);
  smile.bezierCurveTo(.086, -.021, .054, -.054, .005, -.063);
  smile.bezierCurveTo(-.042, -.062, -.089, -.033, -.088, .015);
  part(mouth, new ExtrudeGeometry(smile, {
    depth: .007, bevelEnabled: true, bevelSize: .004, bevelThickness: .004, bevelSegments: 3, curveSegments: 12,
  }), black, 0, 0, 0);
  oval(mouth, mouthTint, 0, -.049, .013, .047, .016, .004);

  const surpriseMouth = pivot(head, 0, .234, faceDepth(0, .234) + .008);
  oval(surpriseMouth, black, 0, 0, .004, .044, .047, .009);
  oval(surpriseMouth, mouthTint, 0, -.026, .011, .022, .010, .004);
  surpriseMouth.visible = false;

  piping(head, olive, [[-.345, .768, .225], [-.271, .803, .233], [-.222, .806, .233], [-.121, .805, .236]], .013);
  const bow = pivot(head, .287, .763, .239);
  bow.rotation.set(.14, -.19, -.11);
  const bowCloth = standard('#93a96b', .62, { bumpMap: fabric, bumpScale: .002 });
  const bowShade = standard('#758d54', .67, { bumpMap: fabric, bumpScale: .002 });

  function ribbonLoop(height: number, width: number, angle: number, z: number, material: Material) {
    const loop = new Shape();
    loop.moveTo(-.016, -.018);
    loop.bezierCurveTo(-width * .83, height * .09, -width, height * .42, -width, height * .68);
    loop.bezierCurveTo(-width, height * .91, -width * .47, height, -.008, height);
    loop.bezierCurveTo(width * .64, height, width, height * .76, width * .83, height * .55);
    loop.bezierCurveTo(width * .68, height * .32, width * .4, height * .07, .019, -.014);
    loop.closePath();
    const fold = part(bow, new ExtrudeGeometry(loop, {
      ...shellEdges, depth: .035, bevelThickness: .021, bevelSize: .017,
    }), material, 0, 0, z);
    fold.rotation.z = angle;
  }

  ribbonLoop(.175, .046, .005, -.026, bowShade);
  ribbonLoop(.205, .069, .845, .004, bowCloth);
  ribbonLoop(.180, .072, -2.02, -.002, bowCloth);
  oval(bow, bowShade, .005, -.006, .036, .056, .048, .043).rotation.z = -.23;
  oval(bow, bowCloth, .007, -.003, .055, .049, .043, .037).rotation.z = -.23;

  function arm(sign: number) {
    const shoulder = pivot(body, sign * .36, .50, 0);
    clothForm(shoulder, vestBlue, [
      [0, -.198], [.085, -.193], [.117, -.153], [.119, -.111], [.125, -.080],
      [.122, -.039], [.090, .008], [.035, .026], [0, .026],
    ], 1.04);
    clothForm(shoulder, jacketGreen, [
      [0, -.332], [.102, -.319], [.117, -.280], [.113, -.246], [.126, -.214],
      [.125, -.177], [.116, -.146], [.109, -.133], [0, -.132],
    ], .98, sign * .008, .011);
    piping(shoulder, darkOlive, [
      [-.116, -.217, .021], [-.075, -.223, .097], [.001, -.229, .132], [.076, -.219, .101], [.121, -.205, .024],
    ], .0044);
    piping(shoulder, seamBlue, [[-.098, -.107, .061], [-.060, -.117, .115], [.021, -.113, .125], [.102, -.092, .067]], .0036);

    const elbow = pivot(shoulder, 0, -.30, 0);
    clothForm(elbow, jacketGreen, [
      [0, -.221], [.080, -.214], [.100, -.194], [.105, -.158], [.101, -.122],
      [.120, -.086], [.119, -.050], [.107, -.020], [.088, .024], [0, .033],
    ], 1.03, sign * .010, .013);
    piping(elbow, darkOlive, [[-.101, -.118, .054], [-.054, -.130, .102], [.022, -.135, .120], [.098, -.113, .060]], .0038);
    clothForm(elbow, ribbing, [
      [0, -.268], [.063, -.267], [.096, -.260], [.106, -.239], [.108, -.201], [.094, -.188], [0, -.183],
    ], .95, 0, .012);
    piping(elbow, seamBlue, [[-.074, -.222, .065], [-.043, -.232, .102], [.019, -.232, .121], [.085, -.217, .066]], .0038);

    const wrist = pivot(elbow, 0, -.27, 0);
    oval(wrist, ivory, 0, -.054, .035, .079, .076, .056);
    const thumb = oval(wrist, ivory, -sign * .069, -.070, .072, .032, .054, .029);
    thumb.rotation.z = -sign * .45;
    const fingerLengths = [.042, .052, .047, .038];
    for (const [index, length] of fingerLengths.entries()) {
      const finger = oval(wrist, ivory, sign * (index - 1.45) * .030, -.105 - length * .18,
        .050, .019, length, .026);
      finger.rotation.x = -.31;
      finger.rotation.z = sign * (index - 1.5) * .10;
    }
    return { shoulder, elbow, wrist };
  }

  function leg(sign: number) {
    const hip = pivot(root, sign * .147, 1.132, 0);
    clothForm(hip, cargo, [
      [0, -.515], [.087, -.510], [.132, -.475], [.137, -.443], [.151, -.409], [.144, -.376],
      [.153, -.344], [.153, -.293], [.150, -.253], [.155, -.210], [.158, -.162], [.151, -.104],
      [.153, -.048], [.136, .020], [.065, .047], [0, .047],
    ], 1.06, sign * .012, .011);
    const pocket = pivot(hip, sign * .128, -.233, .085);
    pocket.rotation.set(-.08, sign * .67, sign * .06);
    round(pocket, cargoShadow, .154, .200, .075, .025, 0, -.015, .013);
    round(pocket, cargo, .140, .182, .056, .026, 0, -.018, .032);
    round(pocket, cargoShadow, .169, .052, .063, .015, 0, .078, .043);
    round(pocket, seamBlue, .014, .009, .010, .004, 0, .067, .078);
    piping(pocket, seamBlue, [[-.053, .038, .048], [-.064, -.098, .049], [.058, -.098, .050], [.061, .036, .048]], .0028);
    piping(hip, seamBlue, [
      [sign * .095, -.039, .136], [sign * .114, -.129, .123], [sign * .101, -.270, .134], [sign * .110, -.420, .121],
    ], .0035);
    piping(hip, cargoShadow, [
      [sign * .118, -.068, .106], [sign * .078, -.109, .145], [sign * .060, -.143, .147],
    ], .0058);

    const knee = pivot(hip, 0, -.46, 0);
    clothForm(knee, cargo, [
      [0, -.442], [.070, -.441], [.100, -.427], [.138, -.405], [.141, -.372], [.122, -.350],
      [.132, -.322], [.142, -.299], [.135, -.274], [.127, -.240], [.134, -.182], [.140, -.147],
      [.146, -.104], [.145, -.061], [.137, -.023], [.119, .075], [0, .077],
    ], 1.06, sign * .017, .008);
    piping(knee, cargoShadow, [[sign * .103, -.268, .094], [sign * .047, -.282, .130], [-sign * .061, -.291, .111]], .0045);
    piping(knee, seamBlue, [[sign * .106, -.351, .083], [sign * .041, -.366, .123], [-sign * .067, -.363, .103]], .0031);
    piping(knee, cargoShadow, [[sign * .105, -.386, .103], [sign * .031, -.405, .140], [-sign * .069, -.400, .105]], .0038);

    const ankle = pivot(knee, 0, -.446, 0);
    const sneaker = pivot(ankle, sign * .028, 0, .065);
    sneaker.rotation.y = sign * .17;
    round(sneaker, orangeShadow, .323, .040, .518, .020, 0, -.200, .031);
    round(sneaker, orange, .337, .052, .534, .025, 0, -.184, .036);
    round(sneaker, rubber, .339, .089, .538, .034, 0, -.139, .036);
    oval(sneaker, sneakerLeather, 0, -.078, .011, .159, .101, .228);
    round(sneaker, rubber, .327, .135, .212, .066, 0, -.092, .181);
    oval(sneaker, sneakerLeather, 0, -.011, -.076, .136, .123, .123);
    oval(sneaker, sneakerMesh, 0, .020, .044, .076, .084, .108).rotation.x = -.56;
    round(sneaker, highlight, .090, .025, .089, .013, 0, .080, .035).rotation.x = -.52;
    for (let index = 0; index < 3; index++) {
      const z = .069 + index * .035;
      const y = .063 - index * .020;
      piping(sneaker, orange, [[-.081, y - .012, z], [-.049, y + .011, z + .003], [0, y + .012, z + .007],
        [.054, y + .010, z + .001], [.080, y - .009, z]], .012);
    }
    for (const side of [-1, 1]) {
      const quarter = oval(sneaker, orangeShadow, side * .140, -.068, -.022, .018, .070, .130);
      quarter.rotation.x = -.29;
      piping(sneaker, orange, [[side * .110, -.098, -.103], [side * .153, -.031, -.064],
        [side * .157, -.036, .023], [side * .149, -.097, .119]], .008);
      piping(sneaker, seamBlue, [[side * .107, -.040, -.115], [side * .132, .016, -.044],
        [side * .127, -.008, .053], [side * .116, -.028, .127]], .0045);
      const shoeBadge = pivot(sneaker, side * .158, -.058, .001);
      shoeBadge.rotation.y = side * Math.PI / 2;
      brand(shoeBadge, orange, 0, 0, 0, .078);
    }
    round(sneaker, orange, .049, .076, .025, .010, 0, .036, -.190);
    for (let index = 0; index < 3; index++) {
      round(sneaker, orangeShadow, .049, .014, .021, .004, (index - 1) * .065, -.202, .283);
    }
    return { hip, knee, ankle };
  }

  const leftArm = arm(1);
  const rightArm = arm(-1);
  const leftLeg = leg(1);
  const rightLeg = leg(-1);

  const hat = pivot(root);
  const safetyWhite = standard('#e4ecdf', .38, { metalness: .05 });
  const safetyEdge = standard('#a5b3ae', .5);
  const rimShape = new Shape();
  rimShape.absellipse(0, -.04, .56, .37, 0, Math.PI * 2, false, 0);
  const rimOpening = new Path();
  rimOpening.absellipse(0, .018, .445, .266, 0, Math.PI * 2, true, 0);
  rimShape.holes.push(rimOpening);
  const rimGeometry = new ExtrudeGeometry(rimShape, {
    depth: .025, steps: 1, bevelSegments: 3, bevelSize: .009, bevelThickness: .006, curveSegments: 24,
  });
  part(hat, rimGeometry, safetyWhite, 0, -.012, 0).rotation.x = -Math.PI / 2;

  const domeProfile: Point[] = [
    [.486, -.005], [.482, .053], [.465, .12], [.424, .201], [.362, .265],
    [.274, .314], [.16, .345], [0, .356], [0, .332], [.155, .321], [.257, .291],
    [.342, .245], [.402, .18], [.442, .106], [.459, .040], [.46, -.005], [.486, -.005],
  ];
  const crown = part(hat, new LatheGeometry(domeProfile.map(([radius, height]) => new Vector2(radius, height)), 48),
    safetyWhite, 0, 0, -.015);
  crown.scale.z = .64;

  for (const sign of [-1, 1]) {
    piping(hat, safetyEdge, [
      [sign * .07, .175, .273], [sign * .065, .262, .210],
      [sign * .063, .320, .132], [sign * .056, .352, .003],
      [sign * .065, .326, -.129], [sign * .068, .264, -.230],
    ], .006);
    round(hat, orange, .043, .020, .084, .009, sign * .410, .016, .210);
  }
  brand(hat, shell, 0, .100, .297, .076);
  hat.visible = false;

  const blueprint = pivot(root);
  const paper = createTexture(512, (ctx, size) => {
    ctx.fillStyle = '#eef0e6';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#c2d4c8';
    ctx.lineWidth = 1;
    for (let index = 16; index < size; index += 16) {
      ctx.beginPath();
      ctx.moveTo(index, 0);
      ctx.lineTo(index, size);
      ctx.moveTo(0, index);
      ctx.lineTo(size, index);
      ctx.stroke();
    }
    ctx.strokeStyle = '#294867';
    ctx.lineWidth = 6;
    ctx.strokeRect(42, 49, 424, 335);
    ctx.strokeRect(86, 81, 310, 211);
    ctx.strokeRect(255, 81, 141, 110);
    ctx.strokeRect(86, 177, 123, 115);
    ctx.strokeRect(255, 226, 141, 66);
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 326, 379, 37);
    ctx.beginPath();
    ctx.arc(207, 176, 36, 0, Math.PI / 2);
    ctx.arc(256, 225, 34, Math.PI, Math.PI * 1.5);
    ctx.stroke();
    ctx.fillStyle = '#294867';
    ctx.font = 'bold 29px sans-serif';
    ctx.fillText('ISB  /  A-01', 50, 448);
    ctx.font = '15px sans-serif';
    ctx.fillText('SITE PLAN', 363, 448);
    ctx.beginPath();
    ctx.moveTo(390, 411);
    ctx.lineTo(451, 411);
    ctx.stroke();
  });
  paper.colorSpace = SRGBColorSpace;
  paper.wrapS = ClampToEdgeWrapping;
  const planSurface = new PlaneGeometry(.75, .51, 22, 5);
  const vertices = planSurface.attributes.position;
  for (let index = 0; index < vertices.count; index++) {
    const x = vertices.getX(index);
    const y = vertices.getY(index);
    vertices.setZ(index, x * x * .47 + Math.sin(y * 8) * .014);
  }
  planSurface.computeVertexNormals();
  part(blueprint, planSurface, standard('#ffffff', .84, { map: paper, side: DoubleSide }), 0, 0, 0);
  blueprint.visible = false;

  const tablet = pivot(root);
  round(tablet, seamBlue, .55, .40, .066, .037, 0, 0, 0);
  round(tablet, shellEdge, .51, .36, .035, .025, 0, 0, .032);
  brand(tablet, pale, .012, .01, .052, .104);
  round(tablet, black, .038, .037, .017, .010, -.193, .125, .052);
  oval(tablet, seamBlue, -.191, .124, .065, .008, .008, .005);
  part(tablet, new BoxGeometry(.46, .31, .003), black, 0, 0, -.033);
  tablet.visible = false;

  root.name = 'ISB mascot';
  return {
    root,
    body,
    head,
    leftShoulder: leftArm.shoulder,
    rightShoulder: rightArm.shoulder,
    leftElbow: leftArm.elbow,
    rightElbow: rightArm.elbow,
    leftWrist: leftArm.wrist,
    rightWrist: rightArm.wrist,
    leftHip: leftLeg.hip,
    rightHip: rightLeg.hip,
    leftKnee: leftLeg.knee,
    rightKnee: rightLeg.knee,
    leftAnkle: leftLeg.ankle,
    rightAnkle: rightLeg.ankle,
    leftEye,
    rightEye,
    mouth,
    surpriseMouth,
    hat,
    blueprint,
    tablet,
  };
}

