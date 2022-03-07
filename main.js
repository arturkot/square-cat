import "./style.css";
import textureImage from "./baked-occlusion-body.jpg";
import sceneUrl from "./square-cat-scene.gltf?url";
import { Scene } from "three/src/scenes/Scene";
import { OrthographicCamera } from "three/src/cameras/OrthographicCamera";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { MeshPhongMaterial } from "three/src/materials/MeshPhongMaterial";
import { SpotLight } from "three/src/lights/SpotLight";
import { HemisphereLight } from "three/src/lights/HemisphereLight";
import { Matrix4 } from "three/src/math/Matrix4";
import { Vector3 } from "three/src/math/Vector3";
import { Mesh } from "three/src/objects/Mesh";
import { GLTFLoader } from "./GLTFLoader.js";

const ANIMATION_SPEED = 4;
const CAMERA_X = -200;
const CAMERA_Y = 200;
const CAMERA_Z = -200;

const styles = new URL("./component-style.css", import.meta.url).href;

const easeOutQuad = (t) => t * (2 - t);

class SquareCat extends HTMLElement {
  isHoverSupport = matchMedia("(hover: hover").matches;
  catCenterXpos = window.innerWidth / 2;
  catCenterYpos = 280;
  mouseXPos = false;
  mouseYPos = false;
  isAnimating = false;
  startAngle = 0;
  currentAngle = 0;
  theBody = null;

  constructor() {
    super();

    this.shadow = this.attachShadow({ mode: "closed" });

    this.w = this.shadow.host.offsetWidth * 2;
    this.h = this.shadow.host.offsetHeight * 2;

    this.scene = new Scene();
    this.camera = new OrthographicCamera(
      this.w / -2,
      this.w / 2,
      this.h / 2,
      this.h / -2,
      -1000,
      1000
    );
    this.renderer = new WebGLRenderer({ alpha: true });
    this.textureLoader = new TextureLoader();
    this.loader = new GLTFLoader();

    this.textureBody = new MeshPhongMaterial({
      color: 0xcccccc,
      map: this.textureLoader.load(textureImage),
      shininess: 1,
      flatShading: true,
    });

    this.hemisphereLight = new HemisphereLight(0x404040, 0xfefefe, 2);
    this.spotLight = new SpotLight();

    this.adjustSize();
    this.setup();
    this.animate();
  }

  adjustSize() {
    const observer = new ResizeObserver(() => {
      this.w = this.shadow.host.offsetWidth * 2;
      this.h = this.shadow.host.offsetHeight * 2;
      this.camera.left = this.w / -2;
      this.camera.right = this.w / 2;
      this.camera.top = this.h / 2;
      this.camera.bottom = this.h / -2;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.w, this.h);
    });
    observer.observe(this.shadow.host);
  }

  setup() {
    this.renderer.antialias = true;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(this.w, this.h);

    this.spotLight.intensity = 1.8;
    this.spotLight.position.set(400, 2000, 40);

    this.scene.add(this.hemisphereLight);
    this.scene.add(this.spotLight);

    this.camera.position.set(CAMERA_X + 1, CAMERA_Y + 1, CAMERA_Z + 1);
    this.camera.lookAt(new Vector3(CAMERA_X, CAMERA_Y, CAMERA_Z));
    this.camera.updateProjectionMatrix();

    document.addEventListener("mousemove", (event) => {
      this.mouseXPos = event.clientX;
      this.mouseYPos = event.clientY;
    });

    window.addEventListener("resize", () => {
      this.catCenterXpos = window.innerWidth / 2;
    });

    const linkElem = document.createElement("link");
    linkElem.setAttribute("rel", "stylesheet");
    linkElem.setAttribute("href", styles);

    this.loader.load(sceneUrl, this.drawCatBody);
    this.shadow.append(linkElem);
    this.shadow.append(this.renderer.domElement);
  }

  drawCatBody = (gltf) => {
    const bodyGeo = gltf.scene.children[0].geometry;
    bodyGeo.applyMatrix4(new Matrix4().makeTranslation(0, 0, 1));
    this.theBody = new Mesh(bodyGeo, this.textureBody);
    this.theBody.position.set(0, 0, 0);
    this.theBody.scale.set(140, 140, 140);
    this.theBody.rotation.set(0, (this.currentAngle * Math.PI) / 180, 0);
    this.scene.add(this.theBody);
  };

  updateCat() {
    if (!this.theBody || !this.mouseXPos) return;

    if (this.mouseYPos < this.catCenterYpos + 100)
      this.mouseYPos = this.catCenterYpos;
    const atan2 = Math.atan2(
      this.catCenterYpos - this.mouseYPos,
      this.catCenterXpos - this.mouseXPos
    );
    const targetAngle = (atan2 * -180) / Math.PI - 45;

    if (!this.isHoverSupport) {
      if (targetAngle === this.currentAngle) return;
      if (!this.isAnimating) this.startAngle = currentAngle;
      let updateAngle = this.currentAngle;

      if (this.isAnimating) {
        updateAngle =
          this.startAngle +
          easeOutQuad(
            Math.abs(this.currentAngle - this.startAngle) /
              Math.abs(targetAngle - this.startAngle)
          ) *
            (targetAngle - this.startAngle);
      }

      if (this.currentAngle < targetAngle) {
        this.currentAngle += ANIMATION_SPEED;
        this.isAnimating = true;
        if (targetAngle < this.currentAngle) {
          this.isAnimating = false;
          this.currentAngle = targetAngle;
        }
      }

      if (currentAngle > targetAngle) {
        this.currentAngle -= ANIMATION_SPEED;
        this.isAnimating = true;
        if (targetAngle > currentAngle) {
          this.isAnimating = false;
          this.currentAngle = targetAngle;
        }
      }

      this.theBody.rotation.set(0, (updateAngle * Math.PI) / 180, 0);
    } else {
      this.theBody.rotation.set(0, (targetAngle * Math.PI) / 180, 0);
    }
  }

  animate = () => {
    this.updateCat();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  };
}

customElements.define("square-cat", SquareCat);
