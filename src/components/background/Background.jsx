/* eslint-disable no-console */
/*eslint no-console: ["error", { allow: ["warn", "error", "info"] }] */
import React, { Component } from 'react';
import {
    Vector2,
    Vector4,
    WebGLRenderer,
    Scene,
    Camera,
    PlaneBufferGeometry,
    Mesh,
    Texture,
    RepeatWrapping,
    Clock
} from 'three';

import { ease } from '../helpers/helpers';

import { jsSID } from '../player/SIDPlayer';

import { Shaders } from './ShaderHelpers/ShaderHelpers';

import PostProcessing from './PostProcessing';

import './Background.css';

function isSet ( target ) {

    return ( typeof target !== 'undefined' && target !== null );

}

class Background extends Component {

    constructor( props ) {

        super( props );

        this.state = {
            playing: false,
        };

        this.SIDPlayer = null;

        this.canvas = null;
        this.canvasContext = null;
        this.canvasTexture = null;

        this.width = null;
        this.height = null;

        this.mouseFocus = false;
        this.mouseX = 0.0;
        this.mouseY = 0.0;
        this.mouseTargetX = 0.0;
        this.mouseTargetY = 0.0;
        this.isTouchDevice = false;
        this.currentTouchPositionX = 0.0;
        this.currentTouchPositionY = 0.0;
        this.lastTouchPositionX = 0.0;
        this.lastTouchPositionY = 0.0;

        this.frictionTarget = 0.017;

        this.clock = null;
        this.frameId = null;
        this.time = 0;
        this.timer = 0;
        this.frame = 0;

        this.init = this.init.bind( this );

        this.defaultFragmentShader = '/shaders/the_80s_m.glsl';
        this.shaderMaterial = null;
        
    }

    init() {

        this.canvas = document.createElement( 'canvas' );
        this.canvasContext = this.canvas.getContext( '2d' );

        this.canvas.style.width = 1024;
        this.canvas.style.height = 1024;
        this.canvas.style.opacity = 0.0;
        this.canvas.style.position = 'fixed';
        this.canvas.width = 1024;
        this.canvas.height = 1024;

        this.canvasTexture = new Texture( this.canvas );
        this.canvasTexture.wrapS = this.canvasTexture.wrapT = RepeatWrapping;
        this.canvasTexture.repeat.set( 1, 1 );

        this.width = this.mount.clientWidth;
        this.height = this.mount.clientHeight;

        this.clock = new Clock();
        this.frame = 1;

    }

    getDate() {

        let date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth();
        let day = date.getDay();
        let epochHours = date.getHours() * 3600;
        let epochMinutes = date.getMinutes() * 60;
        let epochSeconds = date.getSeconds();
        let seconds = epochSeconds + epochMinutes + epochHours;

        return new Vector4( year, month, day, seconds );

    }

    initializeSID = () => {

        if ( this.SIDPlayer === null ) {

            this.SIDPlayer = new jsSID( 16384, 0.0005 );
            this.SIDPlayer.load();

            let playButton = document.getElementById( 'play_button' );
            if ( playButton ) {

                playButton.style.opacity = 0.0;
                playButton.style.zIndex = '-100';

            }

        }

    }

    componentDidMount() {

        this.init();

        this.handleResize = () => {

            this.width = this.mount.clientWidth;
            this.height = this.mount.clientHeight;
            this.renderer.setSize( this.width, this.height );
            this.postProcessing.width = this.width;
            this.postProcessing.height = this.height;
            if ( isSet( this.composer ) ) {

                this.composer.setSize( this.width, this.height );

            }
            this.uniforms.resolution.value.x = this.width;
            this.uniforms.resolution.value.y = this.height;

        };

        this.handleMouseOut = ( e ) => {

            let from = e.relatedTarget || e.toElement;

            if ( !from || from.nodeName === 'HTML' ) {

                this.mouseFocus = false;

            }

        };

        this.handleMouse = ( e ) => {

            if ( !this.mouseFocus ) { this.mouseFocus = true; }

            this.mouseTargetX = ( ( e.clientX / this.mount.clientWidth ) - 0.5 ) * 2.0;
            this.mouseTargetY = ( ( e.clientY / this.mount.clientHeight ) - 0.5 ) * 2.0;

        };

        this.handleTouch = ( e ) => {

            if ( !this.mouseFocus ) { this.mouseFocus = true; }

            if (
                e.type === 'touchstart' ||
                e.type === 'touchmove' ||
                e.type === 'touchend' ||
                e.type === 'touchcancel'
            ) {

                if ( e.changedTouches !== undefined ) {

                    this.props.clearTitle();
                    let touch = e.changedTouches[ 0 ];
                    this.currentTouchPositionX = ( ( touch.clientX / this.mount.clientWidth ) - 0.5 ) * 2.0;
                    this.currentTouchPositionY = ( ( touch.clientY / this.mount.clientHeight ) - 0.5 ) * 2.0;
                    this.mouseTargetX += ( this.currentTouchPositionX - this.lastTouchPositionX ) * 5.0;
                    this.mouseTargetY += ( this.currentTouchPositionY - this.lastTouchPositionY ) * 5.0;
                    this.lastTouchPositionX = this.currentTouchPositionX;
                    this.lastTouchPositionY = this.currentTouchPositionY;

                }

            }

        };

        this.start = () => {

            setTimeout( () => {

                if ( !this.frameId ) {

                    this.uniforms.alpha.value = 0.0;
                    this.frameId = requestAnimationFrame( this.animate );
                    this.handleResize();

                }

            }, 500 );

        };

        this.stop = () => { cancelAnimationFrame( this.frameId ); };

        this.updateCanvas = () => {

            let halfHeight = this.canvas.height / 2;

            this.canvasContext.clearRect( 0, 0, this.canvas.width, this.canvas.height );
            this.canvasContext.fillStyle = '#000000';
            this.canvasContext.fillRect( 0, 0, this.canvas.width, this.canvas.height );

            this.canvasContext.lineWidth = 2;
            this.canvasContext.strokeStyle = '#01FF01';
            this.canvasContext.beginPath();

            if ( this.SIDPlayer !== null ) {

                let sliceWidth = this.canvas.width * 0.995 / this.SIDPlayer.bufferLength;
                let x = 0;
    
                for( let i = 0; i < this.SIDPlayer.bufferLength; i++ ) {
    
                    let v = this.SIDPlayer.audioDataArray[ i ] / 128.0;
                    let y = v * halfHeight;
    
                    if( i === 0 ) {
    
                        this.canvasContext.moveTo( x, y );
    
                    } else {
    
                        this.canvasContext.lineTo( x, y );
    
                    }
    
                    x += sliceWidth;
    
                }
    
                this.canvasContext.lineTo( this.canvas.width, halfHeight );
                this.canvasContext.stroke();

            }

        };

        this.updateUniforms = () => {

            this.uniforms.time.value = this.timer;

            if ( this.uniforms.alpha.value < 1.0 ) {

                this.uniforms.alpha.value += ease( 1.0, this.uniforms.alpha.value, 0.05 );
                this.uniforms.alpha.value = ( this.uniforms.alpha.value > 0.99 )
                    ? 1.0
                    : this.uniforms.alpha.value;

            }

            this.mount.style.opacity = this.uniforms.alpha.value;

            let mX = this.mouseTargetX;
            let mY = this.mouseTargetY;

            if ( this.mouseFocus ) {

                if ( !this.state.playing ) {

                    if ( this.SIDPlayer !== null ) {

                        this.setState( { playing: !this.state.playing } );
                        this.SIDPlayer.playContinue();

                    }

                }

                this.mouseX += Number( ( ( mX - this.mouseX ) * this.frictionTarget ).toFixed( 5 ) );
                this.mouseY += Number( ( ( mY - this.mouseY ) * this.frictionTarget ).toFixed( 5 ) );

            } else {

                this.mouseX += Number( ( ( 0.0 - this.mouseX ) * this.frictionTarget ).toFixed( 5 ) );
                this.mouseY += Number( ( ( 0.0 - this.mouseY ) * this.frictionTarget ).toFixed( 5 ) );

            }

            this.uniforms.date.value = this.getDate();
            this.uniforms.mouse.value = { x: this.mouseX, y: this.mouseY };
            this.uniforms.iChannel0.value = this.canvasTexture;

            if ( this.SIDPlayer !== null ) {

                this.SIDPlayer.analyser.getByteTimeDomainData( this.SIDPlayer.audioDataArray );

            }

        };

        this.updatePostProcessing = () => {

            this.postProcessing.setBloomPass( {

                strength: 0.5,
                radius: 0.25,
                threshold: 0.05

            } );

            // this.postProcessing.setRGBShift( {

            //     enabled: false,
            //     amount: 0.000000001,
            //     angle: 0.0

            // } );

            this.postProcessing.setBadVHS( {

                enabled: false,
                screencurve: 'false',
                resolution: new Vector2( this.width, this.height ),
                h_distort: 0.000000001,
                v_distort: 0.000000001,
                g_amount: 0.05,
                time: this.timer * 2.0,
                mix_amount: 1.0,
                scanlines: 'false',
                offset: 0.1

            } );

        };

        this.renderScene = () => {

            this.composer.render();

        };

        this.animate = () => {

            this.time = this.clock.getDelta();
            this.timer += this.time;
            this.frame += 1;
            this.canvasTexture.needsUpdate = true;

            this.updateUniforms();
            this.updateCanvas();
            this.updatePostProcessing();
            this.renderScene();

            if ( this.frameId !== null ) {

                this.frameId = window.requestAnimationFrame( this.animate );

            }

        };

        this.composeAndMount = () => {

            this.canvasTexture = new Texture( this.canvas );

            let uniforms = {

                iChannel0: { type: 't', value: this.canvasTexture },
                time: { type: 'f', value: 20.0 },
                date: { type: 'v4', value: this.getDate() },
                resolution: { type: 'v2', value: new Vector2( this.width, this.height ) },
                mouse: { type: 'v2', value: new Vector2() },
                alpha: { type: 'f', value: 0.0 }

            };

            let renderer = new WebGLRenderer( { alpha: true } );
            renderer.setSize( this.width, this.height );
            renderer.setPixelRatio( window.devicePixelRatio );
            this.renderer = renderer;

            this.mount.appendChild( this.renderer.domElement );

            let scene = new Scene();
            let camera = new Camera();
            camera.position.z = 1;

            this.scene = scene;
            this.camera = camera;
            this.uniforms = uniforms;

            let geometry = new PlaneBufferGeometry( 2, 2 );
            let shaderMaterial = this.shaders.createMaterial( this.uniforms );
            let mesh = new Mesh( geometry, shaderMaterial );

            scene.add( mesh );

            this.postProcessing = new PostProcessing(

                this.renderer,
                this.scene,
                this.camera,
                this.width,
                this.height

            );

            this.postProcessing.setRGBShift( { enabled: false } );
            this.postProcessing.setBloomPass( { enabled: true } );
            this.postProcessing.setBadVHS( { enabled: true } );
            this.composer = this.postProcessing.composer;

            window.addEventListener( 'resize', this.handleResize );

            let touchEvents = () => {

                try {

                    document.createEvent( 'TouchEvent' );

                    return true;

                }

                catch ( e ) { return false; }

            };

            if ( touchEvents() ) {

                window.addEventListener( 'touchmove', this.handleTouch );
                this.isTouchDevice = true;

            } else {

                window.addEventListener( 'mouseout', this.handleMouseOut );
                window.addEventListener( 'mousemove', this.handleMouse );
                this.isTouchDevice = false;

            }

            this.start();

        };

        this.shaders = new Shaders();
        this.shaders.load( '/shaders/default_vert.glsl', this.defaultFragmentShader ).then(

            ( result ) => { if ( result ) { this.composeAndMount(); }   },
            ( err ) => { console.error( err ); }

        );

    }

    componentWillUnmount() {

        window.removeEventListener( 'resize', this.handleResize );

        if ( this.isTouchDevice === false ) {

            window.removeEventListener( 'mouseout', this.handleMouseOut );
            window.removeEventListener( 'mousemove', this.handleMouse );

        } else {

            window.removeEventListener( 'touchmove', this.handleTouch );

        }

        this.stop();
        this.mount.removeChild( this.renderer.domElement );

    }

    shouldComponentUpdate() { return false; }

    render() {

        return (
            <>
                <div className="background-canvas" ref = { mount => { this.mount = mount; } }>
                    <div className="player-wrapper">
                    </div>
                </div>
                <div
                    className="play-button"
                    id="play_button"
                    onClick={this.initializeSID}
                >PLAY</div>
            </>
        );

    }

}

export default Background;
