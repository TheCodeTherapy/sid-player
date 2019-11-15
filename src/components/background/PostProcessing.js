import { Vector2 } from 'three';

import CopyShader from './PostProcessShaders/CopyShader';
import RGBShiftShader from './PostProcessShaders/RGBShiftShader';
import BadVHSShader from './PostProcessShaders/BadVHSShader';
import DitherColorShader from './PostProcessShaders/DitherColorsShader';

import ShaderPass from './PostProcessHelpers/ShaderPass';
import EffectComposer from './PostProcessHelpers/EffectComposer';
import RenderPass from './PostProcessHelpers/RenderPass';
import BloomPass from './PostProcessHelpers/BloomPass';

export default class PostProcessing {

    constructor( renderer, scene, camera, width, height ) {

        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.width = width;
        this.height = height;

        let composer = new EffectComposer( this.renderer );

        composer.setSize( this.width, this.height );

        let renderPass = new RenderPass( this.scene, this.camera );
        renderPass.name = 'renderPass';
        let bloomPass = new BloomPass( new Vector2( this.width, this.height ), 5, 0.7, 0.3 );
        bloomPass.name = 'bloomPass';
        let rgbShift = new ShaderPass( RGBShiftShader );
        rgbShift.name = 'rgbShift';
        let ditherColor = new ShaderPass( DitherColorShader );
        ditherColor.name = 'ditherColor';
        let badVHS = new ShaderPass( BadVHSShader );
        badVHS.name = 'badVHS';
        let copyShader = new ShaderPass( CopyShader );
        copyShader.name = 'copyShader';

        rgbShift.uniforms[ 'amount' ].value = 0.004;
        rgbShift.uniforms[ 'angle' ].value = 0.0;

        let ditherColorRes = new Vector2();
        ditherColorRes.x = this.width;
        ditherColorRes.y = this.height;

        ditherColor.uniforms[ 'resolution' ].value = ditherColorRes;
        ditherColor.uniforms[ 'time' ].value = 0.0;
        ditherColor.uniforms[ 'resMultiplier' ].value = 0.5;
        ditherColor.uniforms[ 'effectLength' ].value = 7.0;
        ditherColor.uniforms[ 'mode' ].value = 4;
        ditherColor.uniforms[ 'mixAmount' ].value = 0.9;
        ditherColor.uniforms[ 'autoSwitch' ].value = true;

        let badVHSres = new Vector2();
        badVHSres.x = this.width;
        badVHSres.y = this.height;

        badVHS.uniforms[ 'time' ].value = 0.0;
        badVHS.uniforms[ 'h_distort' ].value = 0.0021;
        badVHS.uniforms[ 'v_distort' ].value = 0.0025;
        badVHS.uniforms[ 'glitch' ].value = false;
        badVHS.uniforms[ 'g_amount' ].value = 0.0;
        badVHS.uniforms[ 'mix_amount' ].value = 1.0;
        badVHS.uniforms[ 'resolution' ].value = badVHSres;
        badVHS.uniforms[ 'offset' ].value = 0.5;

        rgbShift.enabled = false;
        bloomPass.enabled = false;
        ditherColor.enabled = false;
        badVHS.enabled = false;
        copyShader.enabled = true;

        rgbShift.renderToScreen = false;
        bloomPass.renderToScreen = false;
        ditherColor.renderToScreen = false;
        badVHS.renderToScreen = true;
        copyShader.renderToScreen = true;

        composer.addPass( renderPass );
        composer.addPass( ditherColor );
        composer.addPass( bloomPass );
        composer.addPass( rgbShift );
        composer.addPass( badVHS );
        composer.addPass( copyShader );

        this.composer = composer;
        this.rgbShift = rgbShift;
        this.bloomPass = bloomPass;
        this.badVHS = badVHS;
        this.ditherColor = ditherColor;

        this.render = this.render.bind( this );

    }

    setRGBShift ( settings ) {

        if ( typeof settings === 'object' ) {

            this.rgbShift.uniforms[ 'amount' ].value = settings.amount || this.rgbShift.uniforms[ 'amount' ].value;
            this.rgbShift.uniforms[ 'angle' ].value = settings.angle || this.rgbShift.uniforms[ 'angle' ].value;
            this.rgbShift.enabled = settings.enabled || this.rgbShift.enabled;

        }

    }

    setBloomPass ( settings ) {

        if ( typeof settings === 'object' ) {

            this.bloomPass.setStrength( settings.strength || this.bloomPass.strength );
            this.bloomPass.setRadius( settings.radius || this.bloomPass.radius );
            this.bloomPass.setThreshold( settings.threshold || this.bloomPass.threshold );
            this.bloomPass.enabled = settings.enabled || this.bloomPass.enabled;

        }

    }

    setBadVHS ( settings ) {

        if ( typeof settings === 'object' ) {

            this.badVHS.uniforms[ 'time' ].value = settings.time || this.badVHS.uniforms[ 'time' ].value;
            this.badVHS.uniforms[ 'h_distort' ].value = settings.h_distort || this.badVHS.uniforms[ 'h_distort' ].value;
            this.badVHS.uniforms[ 'v_distort' ].value = settings.v_distort || this.badVHS.uniforms[ 'v_distort' ].value;
            this.badVHS.uniforms[ 'glitch' ].value = settings.glitch || this.badVHS.uniforms[ 'glitch' ].value;
            this.badVHS.uniforms[ 'g_amount' ].value = settings.g_amount || this.badVHS.uniforms[ 'g_amount' ].value;
            this.badVHS.uniforms[ 'mix_amount' ].value = settings.mix_amount || this.badVHS.uniforms[ 'mix_amount' ].value;
            this.badVHS.uniforms[ 'resolution' ].value = settings.resolution || this.badVHS.uniforms[ 'resolution' ].value;
            this.badVHS.uniforms[ 'scanlines' ].value = settings.scanlines || this.badVHS.uniforms[ 'scanlines' ].value;
            this.badVHS.uniforms[ 'screencurve' ].value = settings.screencurve || this.badVHS.uniforms[ 'screencurve' ].value;
            this.badVHS.uniforms[ 'offset' ].value = settings.offset | this.badVHS.uniforms[ 'offset' ].value;
            this.badVHS.enabled = settings.enabled || this.badVHS.enabled;

        }

    }

    setDitherColor ( settings ) {

        if ( typeof settings === 'object' ) {

            this.ditherColor.uniforms[ 'resolution' ].value = settings.resolution || this.ditherColor.uniforms[ 'resolution' ].value;
            this.ditherColor.uniforms[ 'time' ].value = settings.time || this.ditherColor.uniforms[ 'time' ].value;
            this.ditherColor.uniforms[ 'resMultiplier' ].value = settings.resMultiplier || this.ditherColor.uniforms[ 'resMultiplier' ].value;
            this.ditherColor.uniforms[ 'effectLength' ].value = settings.effectLength || this.ditherColor.uniforms[ 'effectLength' ].value;
            this.ditherColor.uniforms[ 'mode' ].value = settings.mode || this.ditherColor.uniforms[ 'mode' ].value;
            this.ditherColor.uniforms[ 'mixAmount' ].value = settings.mixAmount || this.ditherColor.uniforms[ 'mixAmount' ].value;
            this.ditherColor.uniforms[ 'autoSwitch' ].value = settings.autoSwitch || this.ditherColor.uniforms[ 'autoSwitch' ].value;
            this.ditherColor.enabled = settings.enabled || this.ditherColor.enabled;

        }

    }

    render ( delta ) {

        this.composer.render( delta );

    }

}

