function isSet ( target ) { return ( typeof target !== 'undefined' && target !== null ); }

function isFloat ( n ) { return ( ( '.'.indexOf( n.toString() ) ) && ( ( typeof( n ) === 'number' && n % 1 !== 0 ) || !isNaN( parseFloat( n ) ) ) ); }

function normalize ( n, max ) { return ( ( n / max ) - 0.5 ) * 2.0; }

function normalizeMinMax ( n , min, max ) { return ( n - min ) / ( max - min ); }

function round ( n, digits ) { return Number( n.toFixed( digits ) ); }

function mod ( n, m ) { return ( ( n % m ) + m ) % m; }

function clamp ( n, min, max ) { return n <= min ? min : n >= max ? max : n; }

function ease ( target, n, factor ) { return round( ( target - n ) * factor, 5 ); }

function oscillate ( s, e, t, ts ) { return ( ( e - s ) / 2.0 ) + s + ( ( Math.sin( t * ts ) * ( e - s ) ) / 2.0 ); }

function degToRad ( degrees ) { return degrees * Math.PI / 180.0; }

function notCloseEnough ( target, n ) { return ( Math.abs( target - n ) > 0.01 ); }

function avgArr ( arr ) { return ( arr.reduce( function( sum, b ) { return sum + b; } ) / arr.length ); }

function pickFromArray ( arr ) { return arr[ Math.floor( Math.random() * arr.length ) ]; }

function randomRange ( min, max ) { return min + ( Math.random() * ( max - min ) ); }

function lerp ( n, min, max ) { return min + ( ( max - min ) * n ); }

export { isSet, isFloat, normalize, normalizeMinMax, round, mod, clamp, ease, oscillate, degToRad, notCloseEnough, avgArr, pickFromArray, randomRange, lerp };
