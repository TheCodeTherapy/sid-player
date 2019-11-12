import * as THREE from 'three';

import RenderingPass from './RenderingPass';


export default class ShaderPass extends RenderingPass {

    constructor( shader, textureID ) {

        super();
        this.textureID = ( textureID !== undefined ) ? textureID : 'tDiffuse';
        if ( shader instanceof THREE.ShaderMaterial ) {

            this.uniforms = shader.uniforms;
            this.material = shader;

        } else if ( shader ) {

            this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );
            this.material = new THREE.ShaderMaterial( {
                defines: Object.assign( {}, shader.defines ),
                uniforms: this.uniforms,
                vertexShader: shader.vertexShader,
                fragmentShader: shader.fragmentShader,
            } );

        }

    }

    render( renderer, writeBuffer, readBuffer ) {

        if ( this.uniforms[ this.textureID ] ) {

            this.uniforms[ this.textureID ].value = readBuffer.texture;

        }

        this.quad.material = this.material;
        if ( this.renderToScreen ) {

            renderer.setRenderTarget( null );
            renderer.render( this.scene, this.camera );

        } else {

            renderer.setRenderTarget( writeBuffer );
            if ( this.clear ) {renderer.clear( renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil );}
            renderer.render( this.scene, this.camera );
            //renderer.clear();

        }

    }

}
