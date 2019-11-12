import * as THREE from 'three';

import Pass from './Pass';


export default class RenderingPass extends Pass {

    constructor() {

        super();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        this.scene = new THREE.Scene();
        this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
        this.scene.name = 'effectcomposer_scene';
        this.quad.name = 'effectcomposer_quad';
        this.quad.frustumCulled = false;
        this.scene.add( this.quad );

    }

}
