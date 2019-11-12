/* eslint-disable no-undef */
/* eslint-disable no-fallthrough */

function playSID( SIDUrl, subTune ) {

    if ( typeof SIDPlayer === 'undefined' ) {

        let SIDPlayer = new jsSID( 16384,0.0005 );
        SIDPlayer.loadAndStart( SIDUrl, subTune );

    }

}

class jsSID {

    constructor( bufferLength, background_noise ) {

        this.jsSID_audioCtx = null;
        this.jsSID_scriptNode = null;
        this.outBuffer = null;
        let sampleRate;

        if ( typeof AudioContext !== 'undefined' ) {

            this.jsSID_audioCtx = new AudioContext();

        } else {

            this.jsSID_audioCtx = new webkitAudioContext();

        }

        sampleRate = this.jsSID_audioCtx.sampleRate;

        this.TriSaw_8580 = new Array( 4096 );
        this.PulseSaw_8580 = new Array( 4096 );
        this.PulseTriSaw_8580 = new Array( 4096 );

        this.triWave = null;
        this.pulseWave = null;

        if ( typeof this.jsSID_audioCtx.createJavaScriptNode === 'function' ) {

            this.jsSID_scriptNode = this.jsSID_audioCtx.createJavaScriptNode( bufferLength, 0, 1 );

        } else {

            this.jsSID_scriptNode = this.jsSID_audioCtx.createScriptProcessor( bufferLength, 0, 1 );

        }

        this.source = this.jsSID_scriptNode;
        this.analyser = this.jsSID_audioCtx.createAnalyser();
        this.analyser.fftSize = 4096;
        this.analyser.minDecibels = -90;
        this.analyser.maxDecibels = -10;
        this.analyser.smoothingTimeConstant = 0.85;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.audioDataArray = new Uint8Array( this.bufferLength );

        this.jsSID_scriptNode.onaudioprocess = function ( e ) {

            let  outBuffer = e.outputBuffer;
            let  outData = outBuffer.getChannelData( 0 );

            for ( let sample = 0; sample < outBuffer.length; sample++ ) {

                outData[ sample ] = play();

            }

        };

        this.loadAndStart = function ( SIDUrl, subT ) {

            this.loadInit( SIDUrl, subT ); if ( startCallback !== null ) {

                startCallback();

            }

            this.playContinue();

        };

        this.loadInit = function ( SIDUrl, subT ) {

            loaded = 0;

            this.pause();
            initSID();

            subTune = subT;
            let request = new XMLHttpRequest();
            request.open( 'GET', SIDUrl, true );
            request.responseType = 'arraybuffer';
            request.onload = function () {

                let fileData = new Uint8Array( request.response );
                let i, strEnd;
                let offs = fileData[ 7 ];

                loadAddress = ( fileData[ 8 ] + fileData[ 9 ] )
                    ? ( fileData[ 8 ] * 256 ) + fileData[ 9 ]
                    : ( fileData[ offs + 1 ] * 256 ) + fileData[ offs ];

                for ( i = 0; i < 32; i++ ) {

                    timerMode[ 31 - i ] = fileData[ 0x12 + ( i >> 3 ) ] & Math.pow( 2, 7 - ( i % 8 ) );

                }

                for ( i = 0; i < memory.length; i++ ) {

                    memory[ i ] = 0;

                }

                for ( i = offs + 2; i < fileData.byteLength; i++ ) {

                    if ( loadAddress + i - ( offs + 2 ) < memory.length ) {

                        memory[ loadAddress + i - ( offs + 2 ) ] = fileData[ i ];

                    }

                }

                strEnd = 1;
                for ( i = 0; i < 32; i++ ) {

                    if ( strEnd !== 0 ) {

                        strEnd = SIDTitle[ i ] = fileData[ 0x16 + i ];

                    } else {

                        strEnd = SIDTitle[ i ] = 0;

                    }

                }

                strEnd = 1;
                for ( i = 0; i < 32; i++ ) {

                    if ( strEnd !== 0 ) {

                        strEnd = SIDAuthor[ i ] = fileData[ 0x36 + i ];

                    } else {

                        strEnd = SIDAuthor[ i ] = 0;

                    }

                }

                strEnd = 1;
                for ( i = 0; i < 32; i++ ) {

                    if ( strEnd !== 0 ) {

                        strEnd = SIDInfo[ i ] = fileData[ 0x56 + i ];

                    } else {

                        strEnd = SIDInfo[ i ] = 0;

                    }

                }

                initAddress = ( fileData[ 0xA ] + fileData[ 0xB ] )
                    ? ( fileData[ 0xA ] * 256 ) + fileData[ 0xB ]
                    : loadAddress;

                playAddress = playAddressF = ( fileData[ 0xC ] * 256 ) + fileData[ 0xD ];
                subTune_amount = fileData[ 0xF ];
                preferred_SID_model[ 0 ] = ( fileData[ 0x77 ] & 0x30 ) >= 0x20 ? 8580 : 6581;
                preferred_SID_model[ 1 ] = ( fileData[ 0x77 ] & 0xC0 ) >= 0x80 ? 8580 : 6581;
                preferred_SID_model[ 2 ] = ( fileData[ 0x76 ] & 3 ) >= 3 ? 8580 : 6581;

                SID_address[ 1 ] = fileData[ 0x7A ] >= 0x42 && ( fileData[ 0x7A ] < 0x80 || fileData[ 0x7A ] >= 0xE0 )
                    ? 0xD000 + ( fileData[ 0x7A ] * 16 )
                    : 0;

                SID_address[ 2 ] = fileData[ 0x7B ] >= 0x42 && ( fileData[ 0x7B ] < 0x80 || fileData[ 0x7B ] >= 0xE0 )
                    ? 0xD000 + ( fileData[ 0x7B ] * 16 )
                    : 0;

                SIDAmount = 1 + ( SID_address[ 1 ] > 0 ) + ( SID_address[ 2 ] > 0 );
                loaded = 1;

                if ( loadCallback !== null ) {

                    loadCallback();

                }

                init( subTune );

            };

            request.send( null );

        };

        this.start = function ( subT ) {

            init( subT );

            if ( startCallback !== null ) {

                startCallback();

            }

            this.playContinue();

        };

        this.playContinue = function () {

            this.source.connect( this.analyser );
            this.analyser.connect( this.jsSID_audioCtx.destination );
            // this.source.connect( this.jsSID_audioCtx.destination );
            // this.jsSID_scriptNode.connect( this.jsSID_audioCtx.destination );

        };

        this.pause = function () {

            if ( loaded && initialized ) {

                this.source.disconnect( this.analyser );
                this.analyser.disconnect( this.jsSID_audioCtx.destination );
                // this.jsSID_scriptNode.disconnect( this.jsSID_audioCtx.destination );

            }

        };

        this.stop = function () { this.pause(); init( subTune ); };
        this.getTitle = function () { return String.fromCharCode.apply( null, SIDTitle ); };
        this.getAuthor = function () { return String.fromCharCode.apply( null, SIDAuthor ); };
        this.getInfo = function () { return String.fromCharCode.apply( null, SIDInfo ); };
        this.getSubTunes = function () { return subTune_amount; };
        this.getPrefModel = function () { return preferred_SID_model[ 0 ]; };
        this.getModel = function () { return SID_model; };
        this.getOutput = function () { return ( output / OUTPUT_SCALE_DOWN ) * ( memory[ 0xD418 ] & 0xF ); };
        this.getPlayTime = function () { return parseInt( playtime ); };
        this.setModel = function ( model ) { SID_model = model; };
        this.setVolume = function ( vol ) { volume = vol; };
        this.setLoadCallback = function ( fname ) { loadCallback = fname; };
        this.setStartCallback = function ( fname ) { startCallback = fname; };
        this.setEndCallback = function ( fname, seconds ) { endCallback = fname; playLength = seconds; };

        let C64_CPU_CLOCK = 985248;
        let USE_PAL = false;
        let PAL_FRAMERATE = 50;
        let NTSC_FRAMERATE = 60;
        let SID_CHANNEL_AMOUNT = 3;
        let OUTPUT_SCALE_DOWN = 0x10000 * SID_CHANNEL_AMOUNT * 16;

        let SIDAmount_vol = [ 0, 1, 0.6, 0.4 ];
        let SIDTitle = new Uint8Array( 0x20 );
        let SIDAuthor = new Uint8Array( 0x20 );
        let SIDInfo = new Uint8Array( 0x20 );
        let timerMode = new Uint8Array( 0x20 );

        let loadAddress = 0x1000;
        let initAddress = 0x1000;
        let playAddressF = 0x1003;
        let playAddress = 0x1003;

        let subTune = 0;
        let subTune_amount = 1;
        let playLength = 0;
        let frameSpeed = 1;
        let preferred_SID_model = [ 8580.0, 8580.0, 8580.0 ];

        let SID_model = 8580.0;
        let SID_address = [ 0xD400, 0, 0 ];

        let memory = new Uint8Array( 65536 );
        for ( let i=0; i < memory.length; i++ ) { memory[ i ] = 0; }

        let loaded = 0, initialized = 0, finished = 0, loadCallback = null, startCallback = null;

        let endCallback = null, playtime = 0, ended = 0;
        let clk_ratio = C64_CPU_CLOCK / sampleRate;
        let frameSamplePeriod = sampleRate / ( ( ( USE_PAL ) ? PAL_FRAMERATE : NTSC_FRAMERATE ) * frameSpeed );
        let frameCount = 1, volume = 1.0, CPUTime = 0, pPC;
        let SIDAmount = 1, mix = 0;

        const init = ( subT ) => {

            if ( loaded ) {

                initialized = 0;
                subTune = subT;
                initCPU( initAddress );
                initSID();
                A = subTune;
                memory[ 1 ] = 0x37;
                memory[ 0xDC05 ] = 0;

                for ( let timeout = 100000; timeout >= 0; timeout-- ) {

                    if ( CPU() ) { break; }

                }

                if ( timerMode[ subTune ] || memory[ 0xDC05 ] ) {

                    if ( !memory[ 0xDC05 ] ) {

                        memory[ 0xDC04 ] = 0x24;
                        memory[ 0xDC05 ] = 0x40;

                    }

                    frameSamplePeriod = ( memory[ 0xDC04 ] + ( memory[ 0xDC05 ] * 256 ) ) / clk_ratio;

                } else {

                    frameSamplePeriod = sampleRate / PAL_FRAMERATE;

                }

                if ( playAddressF === 0 ) {

                    playAddress = ( ( memory[ 1 ] & 3 ) < 2 )
                        ? memory[ 0xFFFE ] + ( memory[ 0xFFFF ] * 256 )
                        : memory[ 0x314 ] + ( memory[ 0x315 ] * 256 );

                } else {

                    playAddress = playAddressF;

                    if ( playAddress >= 0xE000 && memory[ 1 ] === 0x37 ) {

                        memory[ 1 ] = 0x35;

                    }

                }

                initCPU( playAddress );
                frameCount = 1;
                finished = 0;
                CPUTime = 0;
                playtime = 0;
                ended = 0;
                initialized = 1;

            }

        };

        const play = () => {

            if ( loaded && initialized ) {

                frameCount--;
                playtime += 1 / sampleRate;

                if ( frameCount <= 0 ) {

                    frameCount = frameSamplePeriod;
                    finished = 0;
                    PC = playAddress;
                    SP = 0xFF;

                }

                if ( finished === 0 ) {

                    while ( CPUTime <= clk_ratio ) {

                        pPC = PC;

                        if ( CPU() >= 0xFE ) {

                            finished = 1;
                            break;

                        } else { CPUTime += cycles; }

                        if ( ( memory[ 1 ] & 3 ) > 1 && pPC < 0xE000 && ( PC === 0xEA31 || PC === 0xEA81 ) ) {

                            finished = 1;
                            break;

                        }

                        if (
                            ( addr === 0xDC05 || addr === 0xDC04 ) &&
                            ( memory[ 1 ] & 3 ) && timerMode[ subTune ]
                        ) {

                            frameSamplePeriod = ( memory[ 0xDC04 ] + ( memory[ 0xDC05 ] * 256 ) ) / clk_ratio;

                        }

                        if ( storeAddress >= 0xD420 && storeAddress < 0xD800 && ( memory[ 1 ] & 3 ) ) {

                            if ( !( SID_address[ 1 ] <= storeAddress && storeAddress < SID_address[ 1 ] + 0x1F ) && !( SID_address[ 2 ] <= storeAddress && storeAddress < SID_address[ 2 ] + 0x1F ) ) {

                                memory[ storeAddress & 0xD41F ] = memory[ storeAddress ];

                            }

                        }

                        if ( addr === 0xD404 && !( memory[ 0xD404 ] & 1 ) ) {

                            ADSRState[ 0 ] &= 0x3E;

                        }

                        if ( addr === 0xD40B && !( memory[ 0xD40B ] & 1 ) ) {

                            ADSRState[ 1 ] &= 0x3E;

                        }

                        if ( addr === 0xD412 && !( memory[ 0xD412 ] & 1 ) ) {

                            ADSRState[ 2 ] &= 0x3E;

                        }

                    }

                    CPUTime -= clk_ratio;

                }

            }

            if (
                playLength > 0 &&
                parseInt( playtime ) === parseInt( playLength ) &&
                endCallback !== null &&
                ended === 0
            ) {

                ended = 1;
                endCallback();

            }

            mix = SID( 0, 0xD400 );

            if ( SID_address[ 1 ] ) {

                mix += SID( 1, SID_address[ 1 ] );

            }

            if ( SID_address[ 2 ] ) {

                mix += SID( 2, SID_address[ 2 ] );

            }

            let vMix = mix * volume * SIDAmount_vol[ SIDAmount ];

            return vMix + ( ( Math.random() * background_noise ) - ( background_noise / 2 ) );

        };

        let flagsW = [ 0x01, 0x21, 0x04, 0x24, 0x00, 0x40, 0x08, 0x28 ];
        let branchFlag = [ 0x80, 0x40, 0x01, 0x02 ];
        let PC = 0, A = 0, T = 0, X = 0, Y = 0, SP = 0xFF, IR = 0, addr = 0, ST = 0x00, cycles = 0, storeAddress = 0;

        const initCPU = ( memPos ) => { PC = memPos; A = 0; X = 0; Y = 0; ST = 0; SP = 0xFF; };

        const CPU = () => {

            IR = memory[ PC ];
            cycles = 2;
            storeAddress = 0;

            if ( IR & 1 ) {

                switch ( IR & 0x1F ) {

                case 1:

                case 3:
                    addr = memory[ memory[ ++PC ] + X ] + ( memory[ memory[ PC ] + X + 1 ] * 256 );
                    cycles = 6;
                    break;

                case 0x11:

                case 0x13:
                    addr = memory[ memory[ ++PC ] ] + ( memory[ memory[ PC ] + 1 ] * 256 ) + Y;
                    cycles = 6;
                    break;

                case 0x19:

                case 0x1F:
                    addr = memory[ ++PC ] + ( memory[ ++PC ] * 256 ) + Y;
                    cycles = 5;
                    break;

                case 0x1D:
                    addr = memory[ ++PC ] + ( memory[ ++PC ] * 256 ) + X;
                    cycles = 5;
                    break;

                case 0xD:

                case 0xF:
                    addr = memory[ ++PC ] + ( memory[ ++PC ] * 256 );
                    cycles = 4;
                    break;

                case 0x15:
                    addr = memory[ ++PC ] + X;
                    cycles = 4;
                    break;

                case 5:

                case 7:
                    addr = memory[ ++PC ];
                    cycles = 3;
                    break;

                case 0x17:
                    addr = memory[ ++PC ] + Y;
                    cycles = 4;
                    break;

                case 9:

                case 0xB:
                    addr = ++PC;
                    cycles = 2;

                default:

                }

                addr &= 0xFFFF;

                switch ( IR & 0xE0 ) {

                case 0x60:
                    T = A;
                    A += memory[ addr ] + ( ST & 1 );
                    ST &= 20;
                    ST |= ( A & 128 ) | ( A > 255 );
                    A &= 0xFF;
                    ST |= ( ( !A ) << 1 ) | ( ( !( ( T ^ memory[ addr ] ) & 0x80 ) && ( ( T ^ A ) & 0x80 ) ) >> 1 );
                    break;

                case 0xE0:
                    T = A;
                    A -= memory[ addr ] + !( ST & 1 );
                    ST &= 20;
                    ST |= ( A & 128 ) | ( A >= 0 );
                    A &= 0xFF;
                    ST |= ( ( !A ) << 1 ) | ( ( ( ( T ^ memory[ addr ] ) & 0x80 ) && ( ( T ^ A ) & 0x80 ) ) >> 1 );
                    break;

                case 0xC0:
                    T = A - memory[ addr ];
                    ST &= 124;
                    ST |= ( ( !( T & 0xFF ) ) << 1 ) | ( T & 128 ) | ( T >= 0 );
                    break;

                case 0x00:
                    A |= memory[ addr ];
                    ST &= 125;
                    ST |= ( ( !A ) << 1 ) | ( A & 128 );
                    break;

                case 0x20:
                    A &= memory[ addr ];
                    ST &= 125;
                    ST |= ( ( !A ) << 1 ) | ( A & 128 );
                    break;

                case 0x40:
                    A ^= memory[ addr ];
                    ST &= 125;
                    ST |= ( ( !A ) << 1 ) | ( A & 128 );
                    break;

                case 0xA0:
                    A = memory[ addr ];
                    ST &= 125;
                    ST |= ( ( !A ) << 1 ) | ( A & 128 );
                    if ( ( IR & 3 ) === 3 ) { X = A; }
                    break;

                case 0x80:
                    memory[ addr ] = A & ( ( ( IR & 3 ) === 3 ) ? X : 0xFF );
                    storeAddress = addr;

                default:

                }

            } else if ( IR & 2 ) {

                switch ( IR & 0x1F ) {

                case 0x1E:
                    addr = memory[ ++PC ] + ( memory[ ++PC ] * 256 ) + ( ( ( IR & 0xC0 ) !== 0x80 ) ? X : Y );
                    cycles = 5;
                    break;

                case 0xE:
                    addr = memory[ ++PC ] + ( memory[ ++PC ] * 256 );
                    cycles = 4;
                    break;

                case 0x16:
                    addr = memory[ ++PC ] + ( ( ( IR & 0xC0 ) !== 0x80 ) ? X : Y );
                    cycles = 4;
                    break;

                case 6:
                    addr = memory[ ++PC ];
                    cycles = 3;
                    break;

                case 2:
                    addr = ++PC;
                    cycles = 2;

                default:

                }

                addr &= 0xFFFF;

                switch ( IR & 0xE0 ) {

                case 0x00:
                    ST &= 0xFE;

                case 0x20:
                    if ( ( IR & 0xF ) === 0xA ) {

                        A = ( A << 1 ) + ( ST & 1 );
                        ST &= 60;
                        ST |= ( A & 128 ) | ( A > 255 );
                        A &= 0xFF;
                        ST |= ( !A ) << 1;

                    } else {

                        T = ( memory[ addr ] << 1 ) + ( ST & 1 );
                        ST &= 60;
                        ST |= ( T & 128 ) | ( T > 255 );
                        T &= 0xFF;
                        ST |= ( !T ) << 1;
                        memory[ addr ] = T;
                        cycles += 2;

                    }
                    break;

                case 0x40:
                    ST &= 0xFE;

                case 0x60:
                    if ( ( IR & 0xF ) === 0xA ) {

                        T = A;
                        A = ( A >> 1 ) + ( ( ST & 1 ) * 128 );
                        ST &= 60;
                        ST |= ( A & 128 ) | ( T & 1 );
                        A &= 0xFF;
                        ST |= ( !A ) << 1;

                    } else {

                        T = ( memory[ addr ] >> 1 ) + ( ( ST & 1 ) * 128 );
                        ST &= 60;
                        ST |= ( T & 128 ) | ( memory[ addr ] & 1 );
                        T &= 0xFF;
                        ST |= ( !T ) << 1;
                        memory[ addr ] = T;
                        cycles += 2;

                    }
                    break;

                case 0xC0:
                    if ( IR & 4 ) {

                        memory[ addr ]--;
                        memory[ addr ] &= 0xFF;
                        ST &= 125;
                        ST |= ( ( !memory[ addr ] ) << 1 ) | ( memory[ addr ] & 128 );
                        cycles += 2;

                    } else {

                        X--;
                        X &= 0xFF;
                        ST &= 125;
                        ST |= ( ( !X ) << 1 ) | ( X & 128 );

                    }
                    break;

                case 0xA0:
                    if ( ( IR & 0xF ) !== 0xA ) {

                        X = memory[ addr ];

                    } else if ( IR & 0x10 ) {

                        X = SP;
                        break;

                    } else {

                        X = A;

                    }
                    ST &= 125;
                    ST |= ( ( !X ) << 1 ) | ( X & 128 );
                    break;

                case 0x80:
                    if ( IR & 4 ) {

                        memory[ addr ] = X;
                        storeAddress = addr;

                    } else if ( IR & 0x10 ) {

                        SP = X;

                    } else {

                        A = X;
                        ST &= 125;
                        ST |= ( ( !A ) << 1 ) | ( A & 128 );

                    }
                    break;

                case 0xE0:
                    if ( IR & 4 ) {

                        memory[ addr ]++;
                        memory[ addr ] &= 0xFF;
                        ST &= 125;
                        ST |= ( ( !memory[ addr ] ) << 1 ) | ( memory[ addr ] & 128 );
                        cycles += 2;

                    }

                default:

                }

            } else if ( ( IR & 0xC ) === 8 ) {

                switch ( IR & 0xF0 ) {

                case 0x60:
                    SP++;
                    SP &= 0xFF;
                    A = memory[ 0x100 + SP ];
                    ST &= 125;
                    ST |= ( ( !A ) << 1 ) | ( A & 128 );
                    cycles = 4;
                    break;

                case 0xC0:
                    Y++;
                    Y &= 0xFF;
                    ST &= 125;
                    ST |= ( ( !Y ) << 1 ) | ( Y & 128 );
                    break;

                case 0xE0:
                    X++;
                    X &= 0xFF;
                    ST &= 125;
                    ST |= ( ( !X ) << 1 ) | ( X & 128 );
                    break;

                case 0x80:
                    Y--;
                    Y &= 0xFF;
                    ST &= 125;
                    ST |= ( ( !Y ) << 1 ) | ( Y & 128 );
                    break;

                case 0x00:
                    memory[ 0x100 + SP ] = ST;
                    SP--;
                    SP &= 0xFF;
                    cycles = 3;
                    break;

                case 0x20:
                    SP++;
                    SP &= 0xFF;
                    ST = memory[ 0x100 + SP ];
                    cycles = 4;
                    break;

                case 0x40:
                    memory[ 0x100 + SP ] = A;
                    SP--;
                    SP &= 0xFF;
                    cycles = 3;
                    break;

                case 0x90:
                    A = Y;
                    ST &= 125;
                    ST |= ( ( !A ) << 1 ) | ( A & 128 );
                    break;

                case 0xA0:
                    Y = A;
                    ST &= 125;
                    ST |= ( ( !Y ) << 1 ) | ( Y & 128 );
                    break;

                default:
                    if ( flagsW[ IR >> 5 ] & 0x20 ) {

                        ST |= ( flagsW[ IR >> 5 ] & 0xDF );

                    } else {

                        ST &= 255 - ( flagsW[ IR >> 5 ] & 0xDF );

                    }

                }

            } else {

                if ( ( IR & 0x1F ) === 0x10 ) {

                    PC++;
                    T = memory[ PC ];

                    if ( T & 0x80 ) {

                        T -= 0x100;

                    }

                    if ( IR & 0x20 ) {

                        if ( ST & branchFlag[ IR >> 6 ] ) {

                            PC += T;
                            cycles = 3;

                        }

                    } else {

                        if ( !( ST & branchFlag[ IR >> 6 ] ) ) {

                            PC += T;
                            cycles = 3;

                        }

                    }

                } else {

                    switch ( IR & 0x1F ) {

                    case 0:
                        addr = ++PC;
                        cycles = 2;
                        break;

                    case 0x1C:
                        addr = memory[ ++PC ] + ( memory[ ++PC ] * 256 ) + X;
                        cycles = 5;
                        break;

                    case 0xC:
                        addr = memory[ ++PC ] + ( memory[ ++PC ] * 256 );
                        cycles = 4;
                        break;

                    case 0x14:
                        addr = memory[ ++PC ] + X;
                        cycles = 4;
                        break;

                    case 4:
                        addr = memory[ ++PC ];
                        cycles = 3;

                    default:

                    }

                    addr &= 0xFFFF;
                    switch ( IR & 0xE0 ) {

                    case 0x00:
                        memory[ 0x100 + SP ] = PC % 256;
                        SP--;
                        SP &= 0xFF;
                        memory[ 0x100 + SP ] = PC / 256;
                        SP--;
                        SP &= 0xFF;
                        memory[ 0x100 + SP ] = ST;
                        SP--;
                        SP &= 0xFF;
                        PC = memory[ 0xFFFE ] + ( memory[ 0xFFFF ] * 256 ) - 1;
                        cycles = 7;
                        break;

                    case 0x20:
                        if ( IR & 0xF ) {

                            ST &= 0x3D;
                            ST |= ( memory[ addr ] & 0xC0 ) | ( ( !( A & memory[ addr ] ) ) << 1 );

                        } else {

                            memory[ 0x100 + SP ] = ( PC + 2 ) % 256;
                            SP--;
                            SP &= 0xFF;
                            memory[ 0x100 + SP ] = ( PC + 2 ) / 256;
                            SP--;
                            SP &= 0xFF;
                            PC = memory[ addr ] + ( memory[ addr + 1 ] * 256 ) - 1;
                            cycles = 6;

                        }
                        break;

                    case 0x40:
                        if ( IR & 0xF ) {

                            PC = addr - 1;
                            cycles = 3;

                        } else {

                            if ( SP >= 0xFF ) { return 0xFE; }
                            SP++;
                            SP &= 0xFF;
                            ST = memory[ 0x100 + SP ];
                            SP++;
                            SP &= 0xFF;
                            T = memory[ 0x100 + SP ];
                            SP++;
                            SP &= 0xFF;
                            PC = memory[ 0x100 + SP ] + ( T * 256 ) - 1;
                            cycles = 6;

                        }
                        break;

                    case 0x60:
                        if ( IR & 0xF ) {

                            PC = memory[ addr ] + ( memory[ addr + 1 ] * 256 ) - 1;
                            cycles = 5;

                        } else {

                            if ( SP >= 0xFF ) { return 0xFF; }
                            SP++;
                            SP &= 0xFF;
                            T = memory[ 0x100 + SP ];
                            SP++;
                            SP &= 0xFF;
                            PC = memory[ 0x100 + SP ] + ( T * 256 ) - 1;
                            cycles = 6;

                        }
                        break;

                    case 0xC0:
                        T = Y - memory[ addr ];
                        ST &= 124;
                        ST |= ( ( !( T & 0xFF ) ) << 1 ) | ( T & 128 ) | ( T >= 0 );
                        break;

                    case 0xE0:
                        T = X - memory[ addr ];
                        ST &= 124;
                        ST |= ( ( !( T & 0xFF ) ) << 1 ) | ( T & 128 ) | ( T >= 0 );
                        break;

                    case 0xA0:
                        Y = memory[ addr ];
                        ST &= 125;
                        ST |= ( ( !Y ) << 1 ) | ( Y & 128 );
                        break;

                    case 0x80:
                        memory[ addr ] = Y;
                        storeAddress = addr;

                    default:

                    }

                }

            }

            PC++;
            PC &= 0xFFFF;

            return 0;

        };

        let gateBitMask = 0x01;
        let syncBitMask = 0x02;
        let ringBitMask = 0x04;
        let testBitMask = 0x08;
        let triangleBitMask = 0x10;
        let sawBitMask = 0x20;
        let pulseBitMask = 0x40;
        let noiseBitMask = 0x80;
        let holdZeroBitMask = 0x10;
        let decaySustainBitMask = 0x40;
        let attackBitMask = 0x80;
        let filterSW = [ 1, 2, 4, 1, 2, 4, 1, 2, 4 ];
        let lowPassBitMask = 0x10;
        let bandPassBitMask = 0x20;
        let highPassBitMask = 0x40;
        let off3BitMask = 0x80;
        let ADSRState = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
        let rateCounter = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
        let envCounter = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
        let expCounter = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
        let prevSR = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
        let phaseAccumulator = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
        let prevAccumulator = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
        let sourceMSBrise = [ 0, 0, 0 ];
        let sourceMSB = [ 0, 0, 0 ];
        let noiseLFSR = [ 0x7FFFF8, 0x7FFFF8, 0x7FFFF8, 0x7FFFF8, 0x7FFFF8, 0x7FFFF8, 0x7FFFF8, 0x7FFFF8, 0x7FFFF8 ];
        let prevWFOut = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
        let prevWAVData = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
        let combinedWaveForm;
        let prevLowPass = [ 0, 0, 0 ];
        let prevBandPass = [ 0, 0, 0 ];
        let cutoffRatio8580 = -2 * 3.14 * ( 12500 / 256 ) / sampleRate;
        let cutoffRatio6581 = -2 * 3.14 * ( 20000 / 256 ) / sampleRate;
        let prevGate;
        let channelAdd;
        let ctrl;
        let wf;
        let test;
        let period;
        let step;
        let SR;
        let accumulatorAdd;
        let MSB;
        let tmp;
        let pw;
        let lim;
        let waveFormOut;
        let cutoff;
        let resonance;
        let filterIn;
        let output;

        const initSID = () => {

            let i = 0x0000;

            for ( i = 0xD400; i <= 0xD7FF; i++ ) {

                memory[ i ] = 0;

            }

            for ( i = 0xDE00; i <= 0xDFFF; i++ ) {

                memory[ i ] = 0;

            }

            for ( i = 0; i < 9; i++ ) {

                ADSRState[ i ] = holdZeroBitMask;
                rateCounter[ i ] = envCounter[ i ] = expCounter[ i ] = prevSR[ i ] = 0;

            }

        };

        const SID = ( num, SIDAddress ) => {

            filterIn = 0;
            output = 0;

            for ( let channel = num * SID_CHANNEL_AMOUNT; channel < ( num + 1 ) * SID_CHANNEL_AMOUNT; channel++ ) {

                prevGate = ( ADSRState[ channel ] & gateBitMask );
                channelAdd = SIDAddress + ( ( channel - ( num * SID_CHANNEL_AMOUNT ) ) * 7 );
                ctrl = memory[ channelAdd + 4 ];
                wf = ctrl & 0xF0;
                test = ctrl & testBitMask;
                SR = memory[ channelAdd + 6 ];
                tmp = 0;

                if ( prevGate !== ( ctrl & gateBitMask ) ) {

                    if ( prevGate ) {

                        ADSRState[ channel ] &= 0xFF - ( gateBitMask | attackBitMask | decaySustainBitMask );

                    } else {

                        ADSRState[ channel ] = ( gateBitMask | attackBitMask | decaySustainBitMask );

                        if ( ( SR & 0xF ) > ( prevSR[ channel ] & 0xF ) ) {

                            tmp = 1;

                        }

                    }

                }
                prevSR[ channel ] = SR;
                rateCounter[ channel ] += clk_ratio;
                if ( rateCounter[ channel ] >= 0x8000 ) {

                    rateCounter[ channel ] -= 0x8000;

                }

                if ( ADSRState[ channel ] & attackBitMask ) {

                    step = memory[ channelAdd + 5 ] >> 4;
                    period = ADSRPeriods[ step ];

                } else if ( ADSRState[ channel ] & decaySustainBitMask ) {

                    step = memory[ channelAdd + 5 ] & 0xF;
                    period = ADSRPeriods[ step ];

                } else {

                    step = SR & 0xF;
                    period = ADSRPeriods[ step ];

                }

                step = ADSRStep[ step ];

                if ( rateCounter[ channel ] >= period && rateCounter[ channel ] < period + clk_ratio && tmp === 0 ) {

                    rateCounter[ channel ] -= period;

                    if ( ( ADSRState[ channel ] & attackBitMask ) || ++expCounter[ channel ] === ADSRExpTable[ envCounter[ channel ] ] ) {

                        if ( !( ADSRState[ channel ] & holdZeroBitMask ) ) {

                            if ( ADSRState[ channel ] & attackBitMask ) {

                                envCounter[ channel ] += step;

                                if ( envCounter[ channel ] >= 0xFF ) {

                                    envCounter[ channel ] = 0xFF;
                                    ADSRState[ channel ] &= 0xFF - attackBitMask;

                                }

                            } else if ( !( ADSRState[ channel ] & decaySustainBitMask ) || envCounter[ channel ] > ( SR >> 4 ) + ( SR & 0xF0 ) ) {

                                envCounter[ channel ] -= step;

                                if ( envCounter[ channel ] <= 0 && envCounter[ channel ] + step !== 0 ) {

                                    envCounter[ channel ] = 0;
                                    ADSRState[ channel ] |= holdZeroBitMask;

                                }

                            }

                        }

                        expCounter[ channel ] = 0;

                    }

                }
                envCounter[ channel ] &= 0xFF;

                accumulatorAdd = ( memory[ channelAdd ] + ( memory[ channelAdd + 1 ] * 256 ) ) * clk_ratio;

                if ( test || ( ( ctrl & syncBitMask ) && sourceMSBrise[ num ] ) ) {

                    phaseAccumulator[ channel ] = 0;

                } else {

                    phaseAccumulator[ channel ] += accumulatorAdd;

                    if ( phaseAccumulator[ channel ] > 0xFFFFFF ) {

                        phaseAccumulator[ channel ] -= 0x1000000;

                    }

                }

                MSB = phaseAccumulator[ channel ] & 0x800000;
                sourceMSBrise[ num ] = ( MSB > ( prevAccumulator[ channel ] & 0x800000 ) ) ? 1 : 0;

                if ( wf & noiseBitMask ) {

                    tmp = noiseLFSR[ channel ];

                    if ( ( ( phaseAccumulator[ channel ] & 0x100000 ) !== ( prevAccumulator[ channel ] & 0x100000 ) ) || accumulatorAdd >= 0x100000 ) {

                        step = ( tmp & 0x400000 ) ^ ( ( tmp & 0x20000 ) << 5 );
                        tmp = ( ( tmp << 1 ) + ( step > 0 || test ) ) & 0x7FFFFF;
                        noiseLFSR[ channel ] = tmp;

                    }

                    waveFormOut = ( wf & 0x70 ) ? 0 : ( ( tmp & 0x100000 ) >> 5 ) + ( ( tmp & 0x40000 ) >> 4 ) + ( ( tmp & 0x4000 ) >> 1 ) + ( ( tmp & 0x800 ) << 1 ) + ( ( tmp & 0x200 ) << 2 ) + ( ( tmp & 0x20 ) << 5 ) + ( ( tmp & 0x04 ) << 7 ) + ( ( tmp & 0x01 ) << 8 );

                } else if ( wf & pulseBitMask ) {

                    pw = ( memory[ channelAdd + 2 ] + ( ( memory[ channelAdd + 3 ] & 0xF ) * 256 ) ) * 16;
                    tmp = accumulatorAdd >> 9;

                    if ( 0 < pw && pw < tmp ) { pw = tmp; }

                    tmp ^= 0xFFFF;

                    if ( pw > tmp ) { pw = tmp; }

                    tmp = phaseAccumulator[ channel ] >> 8;

                    if ( wf === pulseBitMask ) {

                        step = 256 / ( accumulatorAdd >> 16 );

                        if ( test ) {

                            waveFormOut = 0xFFFF;

                        } else if ( tmp < pw ) {

                            lim = ( 0xFFFF - pw ) * step;

                            if ( lim > 0xFFFF ) { lim = 0xFFFF; }

                            waveFormOut = lim - ( ( pw - tmp ) * step );

                            if ( waveFormOut < 0 ) { waveFormOut = 0; }

                        } else {

                            lim = pw * step;

                            if ( lim > 0xFFFF ) { lim = 0xFFFF; }

                            waveFormOut = ( ( 0xFFFF - tmp ) * step ) - lim;

                            if ( waveFormOut >= 0 ) { waveFormOut = 0xFFFF; }

                            waveFormOut &= 0xFFFF;

                        }

                    } else {

                        waveFormOut = ( tmp >= pw || test ) ? 0xFFFF : 0;

                        if ( wf & triangleBitMask ) {

                            if ( wf & sawBitMask ) {

                                waveFormOut = ( waveFormOut )
                                    ? combineWaveForm( channel, PulseTriSaw_8580, tmp >> 4, 1 )
                                    : 0;

                            } else {

                                tmp = phaseAccumulator[ channel ] ^ ( ctrl & ringBitMask ? sourceMSB[ num ] : 0 );
                                waveFormOut = ( waveFormOut )
                                    ? combineWaveForm( channel, PulseSaw_8580, ( tmp ^ ( tmp & 0x800000 ? 0xFFFFFF : 0 ) ) >> 11, 0 )
                                    : 0;

                            }

                        } else if ( wf & sawBitMask ) {

                            waveFormOut = ( waveFormOut )
                                ? combineWaveForm( channel, PulseSaw_8580, tmp >> 4, 1 )
                                : 0;

                        }

                    }

                } else if ( wf & sawBitMask ) {

                    waveFormOut = phaseAccumulator[ channel ] >> 8;

                    if ( wf & triangleBitMask ) {

                        waveFormOut = combineWaveForm( channel, TriSaw_8580, waveFormOut >> 4, 1 );

                    } else {

                        step = accumulatorAdd / 0x1200000;
                        waveFormOut += waveFormOut * step;

                        if ( waveFormOut > 0xFFFF ) {

                            waveFormOut = 0xFFFF - ( ( waveFormOut - 0x10000 ) / step );

                        }

                    }

                } else if ( wf & triangleBitMask ) {

                    tmp = phaseAccumulator[ channel ] ^ ( ctrl & ringBitMask ? sourceMSB[ num ] : 0 );
                    waveFormOut = ( tmp ^ ( tmp & 0x800000 ? 0xFFFFFF : 0 ) ) >> 7;

                }

                if ( wf ) {

                    prevWFOut[ channel ] = waveFormOut;

                } else {

                    waveFormOut = prevWFOut[ channel ];

                }

                prevAccumulator[ channel ] = phaseAccumulator[ channel ];
                sourceMSB[ num ] = MSB;

                if ( memory[ SIDAddress + 0x17 ] & filterSW[ channel ] ) {

                    filterIn += ( waveFormOut - 0x8000 ) * ( envCounter[ channel ] / 256 );

                } else if ( ( channel % SID_CHANNEL_AMOUNT ) !== 2 || !( memory[ SIDAddress + 0x18 ] & off3BitMask ) ) {

                    output += ( waveFormOut - 0x8000 ) * ( envCounter[ channel ] / 256 );

                }

            }

            if ( memory[ 1 ] & 3 ) {

                memory[ SIDAddress + 0x1B ] = waveFormOut >> 8;

            }

            memory[ SIDAddress + 0x1C ] = envCounter[ 3 ];

            cutoff = ( ( memory[ SIDAddress + 0x15 ] & 7 ) / 8 ) + memory[ SIDAddress + 0x16 ] + 0.2;

            if ( SID_model === 8580.0 ) {

                cutoff = 1 - Math.exp( cutoff * cutoffRatio8580 );
                resonance = Math.pow( 2, ( ( 4 - ( memory[ SIDAddress + 0x17 ] >> 4 ) ) / 8 ) );

            } else {

                if ( cutoff < 24 ) {

                    cutoff = 0.035;

                } else {

                    cutoff = 1 - ( 1.263 * Math.exp( cutoff * cutoffRatio6581 ) );

                }

                resonance = ( memory[ SIDAddress + 0x17 ] > 0x5F ) ? 8 / ( memory[ SIDAddress + 0x17 ] >> 4 ) : 1.41;

            }

            tmp = filterIn + ( prevBandPass[ num ] * resonance ) + prevLowPass[ num ];

            if ( memory[ SIDAddress + 0x18 ] & highPassBitMask ) {

                output -= tmp;

            }

            tmp = prevBandPass[ num ] - ( tmp * cutoff );
            prevBandPass[ num ] = tmp;

            if ( memory[ SIDAddress + 0x18 ] & bandPassBitMask ) {

                output -= tmp;

            }

            tmp = prevLowPass[ num ] + ( tmp * cutoff );
            prevLowPass[ num ] = tmp;

            if ( memory[ SIDAddress + 0x18 ] & lowPassBitMask ) {

                output += tmp;

            }

            return ( output / OUTPUT_SCALE_DOWN ) * ( memory[ SIDAddress + 0x18 ] & 0xF );

        };

        const combineWaveForm = ( channel, waveFormArray, index, differ6581 ) => {

            if ( differ6581 && SID_model === 6581.0 ) {

                index &= 0x7FF;

            }
            combinedWaveForm = ( waveFormArray[ index ] + prevWAVData[ channel ] ) / 2;
            prevWAVData[ channel ] = waveFormArray[ index ];

            return combinedWaveForm;

        };

        const createCombinedWF = ( waveFormArray, bitMulti, bitStrength, threshold ) => {

            for ( let i = 0; i < 4096; i++ ) {

                waveFormArray[ i ] = 0;

                for ( let j = 0; j < 12; j++ ) {

                    let bitLevel = 0;

                    for ( let k = 0; k < 12; k++ ) {

                        bitLevel += ( bitMulti / Math.pow( bitStrength, Math.abs( k - j ) ) ) * ( ( ( i >> k ) & 1 ) - 0.5 );

                    }

                    waveFormArray[ i ] += ( bitLevel >= threshold ) ? Math.pow( 2, j ) : 0;

                }

                waveFormArray[ i ] *= 12;

            }

        };

        createCombinedWF( this.TriSaw_8580, 0.8, 2.4, 0.64 );

        createCombinedWF( this.PulseSaw_8580, 1.4, 1.9, 0.68 );

        createCombinedWF( this.PulseTriSaw_8580, 0.8, 2.5, 0.64 );

        let period0 = Math.max( clk_ratio, 9 );

        let ADSRPeriods = [
            period0, 32 * 1, 63 * 1, 95 * 1,
            149 * 1, 220 * 1, 267 * 1, 313 * 1,
            392 * 1, 977 * 1, 1954 * 1, 3126 * 1,
            3907 * 1, 11720 * 1, 19532 * 1, 31251 * 1
        ];

        let ADSRStep = [ Math.ceil( period0 / 9 ), 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ];

        let ADSRExpTable = [
            1, 30, 30, 30, 30, 30, 30, 16, 16, 16, 16, 16, 16, 16, 16, 8,
            8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 4, 4, 4, 4, 4,
            4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
            4, 4, 4, 4, 4, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2,
            2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
            2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
        ];

    }

}

export { playSID, jsSID };
