import * as THREE from 'three'

export default class Skydome {

    constructor(scene, skyTexture, radius, widthSegments, heightSegments){
        this.scene = scene;
        this.skyTexture = skyTexture;
        this.radius = radius;
        this.widthSegments = widthSegments;
        this.heightSegments = heightSegments;
    }

    initSkydome(){
        const textureLoader = new THREE.TextureLoader();
        const skyTexture = textureLoader.load(this.skyTexture);

        const skyGeometry = new THREE.SphereGeometry(this.radius, this.widthSegments, this.heightSegments);

        const skyMaterial = new THREE.MeshBasicMaterial({
        map: skyTexture,
        side: THREE.BackSide,
        transparent: true
        });

        const skydome = new THREE.Mesh(skyGeometry, skyMaterial);
        this.skydome = skydome;

        this.scene.add(skydome);
    }





}
