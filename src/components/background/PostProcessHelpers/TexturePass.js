import * as THREE from 'three';

import RenderingPass from './RenderingPass';
import CopyShader from './CopyShader';


export default class TexturePass extends RenderingPass {

    constructor( map, opacity ) {

        super();
        const shader = CopyShader;
        this.map = map;
        this.opacity = ( opacity !== undefined ) ? opacity : 1.0;
        this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );
        this.material = new THREE.ShaderMaterial( {
            uniforms: this.uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader,
            depthTest: false,
            depthWrite: false,
        } );
        this.needsSwap = false;

    }


    render( _renderer, writeBuffer, readBuffer ) {

        const renderer = _renderer;
        const oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;
        this.quad.material = this.material;
        this.uniforms.opacity.value = this.opacity;
        this.uniforms.tDiffuse.value = this.map;
        this.material.transparent = ( this.opacity < 1.0 );
        renderer.render( this.scene, this.camera, this.renderToScreen ? null : readBuffer, this.clear );
        renderer.autoClear = oldAutoClear;

    }

}
