import * as THREE from 'three';

import CopyShader from '../PostProcessShaders/CopyShader';
import ShaderPass from './ShaderPass';
import MaskPass from './MaskPass';
import ClearMaskPass from './ClearMaskPass';

export default class EffectComposer {

    constructor( renderer, _renderTarget ) {

        let renderTarget = _renderTarget;
        this.renderer = renderer;

        if ( renderTarget === undefined ) {

            let parameters = {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                stencilBuffer: false,
            };
            let size = renderer.getDrawingBufferSize( new THREE.Vector2() );
            renderTarget = new THREE.WebGLRenderTarget( size.width, size.height, parameters );
            renderTarget.texture.name = 'EffectComposer.rt1';

        }

        this.renderTarget1 = renderTarget;
        this.renderTarget2 = renderTarget.clone();
        this.renderTarget2.texture.name = 'EffectComposer.rt2';

        this.writeBuffer = this.renderTarget1;
        this.readBuffer = this.renderTarget2;

        this.renderToScreen = true;

        this.passes = [];
        this.copyPass = new ShaderPass( CopyShader );

    }

    swapBuffers() {

        const tmp = this.readBuffer;
        this.readBuffer = this.writeBuffer;
        this.writeBuffer = tmp;

    }

    addPass( pass ) {

        this.passes.push( pass );
        let size = this.renderer.getDrawingBufferSize( new THREE.Vector2() );
        pass.setSize( size.width, size.height );

    }

    insertPass( pass, index ) {

        this.passes.splice( index, 0, pass );

    }

    isLastEnabledPass( passIndex ) {

        for ( let i = passIndex + 1; i < this.passes.length; i++ ) {

            if ( this.passes[ i ].enabled ) {

                return false;

            }

        }

        return true;

    }

    render( delta ) {

        let maskActive = false;
        let pass;
        let i;
        let il = this.passes.length;

        let currentRenderTarget = this.renderer.getRenderTarget();


        for ( i = 0; i < il; i += 1 ) {

            pass = this.passes[ i ];

            if ( pass.enabled === false ) {continue;}

            pass.renderToScreen = ( this.renderToScreen && this.isLastEnabledPass( i ) );
            pass.render( this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive );
            if ( pass.needsSwap ) {

                if ( maskActive ) {

                    let context = this.renderer.context;
                    context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );
                    this.copyPass.render( this.renderer, this.writeBuffer, this.readBuffer, delta );
                    context.stencilFunc( context.EQUAL, 1, 0xffffffff );

                }
                this.swapBuffers();

            }
            if ( pass instanceof MaskPass ) {

                maskActive = true;

            } else if ( pass instanceof ClearMaskPass ) {

                maskActive = false;

            }

        }

        this.renderer.setRenderTarget( currentRenderTarget );

    }

    reset( _renderTarget ) {

        let renderTarget = _renderTarget;
        if ( renderTarget === undefined ) {

            let size = this.renderer.getDrawingBufferSize( new THREE.Vector2() );
            renderTarget = this.renderTarget1.clone();
            renderTarget.setSize( size.width, size.height );

        }

        this.renderTarget1.dispose();
        this.renderTarget2.dispose();
        this.renderTarget1 = renderTarget;
        this.renderTarget2 = renderTarget.clone();
        this.writeBuffer = this.renderTarget1;
        this.readBuffer = this.renderTarget2;

    }

    setSize( width, height ) {

        this.renderTarget1.setSize( width, height );
        this.renderTarget2.setSize( width, height );
        let il = this.passes.length;
        for ( let i = 0; i < il; i += 1 ) {

            this.passes[ i ].setSize( width, height );

        }

    }

}
