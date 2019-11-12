import Pass from './Pass';


export default class MaskPass extends Pass {

    constructor( scene, camera ) {

        super();
        this.scene = scene;
        this.camera = camera;
        this.clear = true;
        this.needsSwap = false;
        this.inverse = false;

    }


    render( renderer, writeBuffer, readBuffer, delta, maskActive ) {

        let context = renderer.context;
        let state = renderer.state;
        state.buffers.color.setMask( false );
        state.buffers.depth.setMask( false );
        state.buffers.color.setLocked( true );
        state.buffers.depth.setLocked( true );

        let writeValue;
        let clearValue;

        if ( this.inverse ) {

            writeValue = 0;
            clearValue = 1;

        } else {

            writeValue = 1;
            clearValue = 0;

        }

        state.buffers.stencil.setTest( true );
        state.buffers.stencil.setOp( context.REPLACE, context.REPLACE, context.REPLACE );
        state.buffers.stencil.setFunc( context.ALWAYS, writeValue, 0xffffffff );
        state.buffers.stencil.setClear( clearValue );

        renderer.setRenderTarget( readBuffer );
        if ( this.clear ) {renderer.clear();}
        renderer.render( this.scene, this.camera );

        renderer.setRenderTarget( writeBuffer );
        if ( this.clear ) {renderer.clear();}
        renderer.render( this.scene, this.camera );

        state.buffers.color.setLocked( false );
        state.buffers.depth.setLocked( false );

        state.buffers.stencil.setFunc( context.EQUAL, 1, 0xffffffff );	// draw if == 1
        state.buffers.stencil.setOp( context.KEEP, context.KEEP, context.KEEP );

    }

}
