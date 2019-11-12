/*eslint no-console: ["error", { allow: ["warn", "error", "info"] }] */
import { isSet, pickFromArray } from '../../helpers/helpers';
import { LoadingManager, FileLoader, ShaderMaterial } from 'three';

const debug = false;

class Shaders {

    constructor( setShaderMethod ) {

        this.setShader = setShaderMethod;

        this.vertex = null;
        this.fragment = null;
        this.lastFragmentUsed = null;

        this.validVertexStart = 'varying';
        this.validFragmentStart = 'precision';

        this.availableFragShaders = [
            'the_80s_01.glsl'
        ];

        this.loadShaderFile = this.loadShaderFile.bind( this );
        this.shaderParser = this.shaderParser.bind( this );
        this.validateVertex = this.validateVertex.bind( this );
        this.validateFragment = this.validateFragment.bind( this );
        this.load = this.load.bind( this );
        this.switch = this.switch.bind( this );
        this.getLastPos = this.getLastPos.bind( this );
        this.randomize = this.randomize.bind( this );
        this.prev = this.prev.bind( this );
        this.next = this.next.bind( this );
        this.createMaterial = this.createMaterial.bind( this );

    }

    loadShaderFile ( shaderFile, shaderType ) {

        const loadingManager = new LoadingManager();
        const fileLoader = new FileLoader( loadingManager );
        let shader = null;

        return new Promise( ( resolve, reject ) => {

            fileLoader.load(
                shaderFile,
                fileLoader.onLoad = async ( code ) => {

                    shader = await code;
                    if ( shaderType === 'vertex' ) {

                        if ( this.validateVertex( shader ) ) {

                            resolve( shader );

                        }

                    } else if ( shaderType === 'fragment' ) {

                        if ( this.validateFragment( shader ) ) {

                            this.lastFragmentUsed = shaderFile;
                            resolve( shader );

                        }

                    } else {

                        const errorMessage = `Unable to validate ${shaderFile} shader`;
                        reject( errorMessage );

                    }

                },
                fileLoader.onProgress = ( xhr ) => {

                    if ( debug ) {

                        if ( xhr.lengthComputable ) {

                            let loadURL = xhr.currentTarget.responseURL;
                            let percentComplete = Math.round( ( xhr.loaded / xhr.total ) * 100 );
                            console.info( `${loadURL} ${percentComplete}% loaded` );

                        }

                    }

                },
                fileLoader.onError = ( file ) => {

                    const errorMessage = `Error trying to load ${file}`;
                    reject( errorMessage );

                }
            );

        } );

    }

    shaderParser ( shaderCode ) {

        return shaderCode.split( '\n' )[ 0 ].split( ' ' )[ 0 ];

    }

    validateVertex ( vertexCode ) {

        return (
            typeof vertexCode === 'string' &&
            this.shaderParser( vertexCode ) === this.validVertexStart
        );

    }

    validateFragment ( fragmentCode ) {

        return (
            typeof fragmentCode === 'string' &&
            this.shaderParser( fragmentCode ) === this.validFragmentStart
        );

    }

    load ( vertex, fragment ) {

        return new Promise( ( resolve, reject ) => {

            if ( isSet( this.vertex ) ) { this.vertex = null; }
            if ( isSet( this.fragment ) ) { this.fragment = null; }
            this.loadShaderFile( vertex, 'vertex' )
                .then(
                    ( result ) => {

                        this.vertex = result;
                        this.loadShaderFile( fragment, 'fragment' )
                            .then(
                                ( result ) => {

                                    this.fragment = result;
                                    resolve( true );

                                },
                                ( err ) => {

                                    reject( err );

                                }
                            );

                    },
                    ( err ) => {

                        reject( err );

                    } );

        } );

    }

    switch ( newFragmentShader ) {

        return new Promise( ( resolve, reject ) => {

            this.load( '/shaders/default_vert.glsl', newFragmentShader ).then(
                ( result ) => { resolve( result ); },
                ( err ) => { reject( err ); }
            );

        } );

    }

    getLastPos () {

        return this.availableFragShaders.indexOf( this.lastFragmentUsed );

    }

    randomize () {

        return new Promise( ( resolve, reject ) => {

            let randomFragment = () => pickFromArray( this.availableFragShaders );
            let newFragment = randomFragment();
            while ( newFragment === this.lastFragmentUsed ) {

                newFragment = randomFragment();

            }
            this.switch( newFragment ).then(
                ( result ) => { resolve( result ); },
                ( err ) => { reject( err ); }
            );

        } );

    }

    prev () {

        return new Promise ( ( resolve, reject ) => {

            let pos = this.getLastPos();
            let prev = ( ( pos - 1 ) < 0 ) ? this.availableFragShaders.length - 1 : pos - 1;
            let newFragment = this.availableFragShaders[ prev ];
            this.switch( newFragment ).then(
                ( result ) => { resolve( result ); },
                ( err ) => { reject ( err ); }
            );

        } );

    }

    next () {

        return new Promise ( ( resolve, reject ) => {

            let pos = this.getLastPos();
            let next = ( ( pos + 1 ) >= this.availableFragShaders.length ) ? 0 : pos + 1;
            let newFragment = this.availableFragShaders[ next ];

            this.switch( newFragment ).then(

                ( result ) => { resolve( result ); },
                ( err ) => { reject ( err ); }

            );

        } );

    }

    createMaterial ( uniforms ) {

        let newMaterial = new ShaderMaterial( {

            uniforms: uniforms,
            vertexShader: this.vertex,
            fragmentShader: this.fragment

        } );

        newMaterial.transparent = true;

        return newMaterial;

    }

}

export { Shaders };

