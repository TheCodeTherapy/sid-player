precision highp float;
uniform sampler2D iChannel0; // https://i.imgur.com/A3MIKYw.png
uniform	vec2 resolution;
uniform	vec2 mouse;
uniform	float time;
uniform float fft;
uniform vec4 date;
uniform float alpha;

const float PI = 3.141592653590;
const float hPI = PI / 2.0;
const float phi = 1.618033988750;
const float ttp = 0.333333333333;
const float ssp = 0.666666666667;
const vec2  hashV = vec2( 12.9898, 78.233 );
const float hashF = 43758.5453123;

mat2 rot( in float a ) {
	return mat2( cos ( a ), -sin( a ), sin( a ), cos( a ) );
}

float hash ( in vec2 uv ) {
    return fract( sin( dot( uv.xy, hashV ) ) * hashF );
}

float noise ( in vec2 uv ) {
    const vec2 O = vec2( 0.0, 1.0 );
	vec2 b = floor(uv);
	return mix( mix( hash( b ), hash( b + O.yx ), 0.5 ), mix( hash( b + O ), hash( b + O.yy ), 0.5 ), 0.5 );
}

vec2 truchetPattern ( in vec2 uv, in float index ) {
    index = fract( ( ( index - 0.5 ) * 2.0 ) );
    if ( index > 0.75 ) { uv = vec2( 1.0 ) - uv; }
    else if ( index > 0.50 ) { uv = vec2( 1.0 - uv.x, uv.y ); }
    else if ( index > 0.25 ) { uv = 1.0 - vec2( 1.0 - uv.x, uv.y ); }
    return uv;
}

float spiral ( in vec2 p ) {
    p = vec2(
        atan( p.x, p.y ) / PI * 4.0,
        log( length( p ) + 1.0 ) * 8.0 );
    p.x += time * 0.5;
    p.y -= p.x * 0.5 + time * 1.0;
    vec2 f = fract( p ) * 1.5 - 0.5;
    return max(f.x - p.x, f.y);
}

float waves ( in vec2 p, in float frac ) {
    float t2 = time * -0.5;
    p.y += t2;
    float w = sin( p.y - frac * 2.0 * PI + 1.5 * PI ) * 0.5 + 0.5;
    w += sin( p.x * 10.0 - p.y * 4.0 - time * 2.0 ) * ttp * 0.1;
    return w;
}

float truchet ( in vec2 p ) {
    p *= 16.0;
    p *= rot( time * 0.3 );
    p.x += time * 0.25;
	vec2 ipos = floor( p );
    vec2 fpos = fract( p );
    vec2 tile = truchetPattern( fpos, hash( ipos ) );
    float a = smoothstep( tile.x - 0.2, tile.x, tile.y) - smoothstep( tile.x, tile.x + 0.2, tile.y );
    return a;
}

float curvedTruchet ( in vec2 p ) {
    p *= 8.0;
    p *= rot( time * 0.2 );
	vec2 ipos = floor( p );
    vec2 fpos = fract( p );
    vec2 tile = truchetPattern( fpos, hash( ipos ) );
    float a = ( step( length( tile ), 0.55 ) - step( length( tile ), 0.45 ) ) +
              ( step( length( tile - vec2( 1.0 ) ), 0.55 ) - step( length( tile - vec2( 1.0 ) ), 0.45 ) );
    return a;
}

float stars ( in vec2 p ) {
    p.y += 1.5;
    float stars = 0.0, fl, s;
	for ( int layer = 0; layer < 6; layer++ ) {
		fl = float( layer );
		s = ( 160.0 - fl * 16.0 );
		stars += step( 0.2, pow( noise( mod( vec2( p.x * s + time * -80.0 - fl * 50.0, p.y * s ), resolution.x ) ), 16.0 ) );
	}
    return stars;
}

float squares ( in vec2 p ) {
    float y = -time * 1.5, t, d;
    float c = 0.0;
    for ( float i = 0.0; i < 8.0; i += 2.0 ) {
        t = mod( y + i, 8.0 );
        d = t * t;
        vec2 s = floor( mod( ( p + vec2( sin( -y * hPI ), cos( y * hPI ) ) / d ) * d, 2.0 ) );
        d = s.x + s.y - 1.0;
        c = max( c, d * d / t) * 1.1;
    }
    return c;
}

float plasma ( in vec2 p ) {
    p.y *= max( resolution.x, resolution.y ) / min( resolution.x, resolution.y );
    float t1 = time * 0.2, t2 = time * 0.5;
    p *= vec2( 80.0, 24.0 ), p = ceil( p ), p /= vec2( 80.0, 24.0 );
    float color = 0.0;
    color += 0.7 * sin( 00.5 * p.x + t1 );
    color += 3.0 * sin( 01.6 * p.y + t1 );
    color += 1.0 * sin( 10.0 * ( p.y * sin( t2 ) + p.x * cos( t1 ) ) + t2 );
    float cx = p.x + 0.5 * sin( t2 );
    float cy = p.y + 0.5 * cos( t2 * 0.5 );
    color +=  0.4 * sin( sqrt( 100.0 * cx *cx + 100.0 *cy * cy + 1.0 ) + time );
    color +=  0.9 * sin( sqrt( 075.0 * cx *cx + 025.0 *cy * cy + 1.0 ) + time );
    color += -1.4 * sin( sqrt( 256.0 * cx *cx + 025.0 *cy * cy + 1.0 ) + time );
    color +=  0.3 * sin( 0.5 * p.y + p.x + sin( time ) );
    return ( 3.0 * ( 0.5 + 0.499 * sin( color ) ) ) * ttp;
}

float pong ( in vec2 p ) {
    p *= 0.75;
    p.x *= 1.5;
    p.x += 0.5;
    float t = time;
    vec2 b;
    b.x = mod( t / 1.7, 1.88 ) + 0.03;
    b.y = mod( t / 2.5, 1.08 ) - 0.27;
    b = min(b, vec2 ( 1.94, 0.54) - b);
    float c = smoothstep(1.0, 0.9, 70.0 * distance(p, b)); // color
    float l = mix(b.y, sin(t * 3.1) * 0.2, b.x);
    float r = mix(cos(t * 3.7) / 4.5, b.y * 0.9, b.x);
    if ( (p.x < 0.04 && abs(l - p.y) < 0.06) || (p.x > 0.96 && abs(r - p.y) < 0.06) ) c += 1.0;
    if ( p.x <  0.001 || p.x > 0.999 || p.y < -0.27 || p.y > 0.27 ) c += 1.0;
    if ( p.x < -0.020 || p.x > 1.020 || p.y < -0.29 || p.y > 0.29 ) c = 0.0;
	return c;
}

float grid ( in vec2 p ) {
	vec2 cen = p / 2.0, gruv = p - cen;
	gruv = vec2( gruv.x * abs( 1.0 / gruv.y ), abs( 0.75 / gruv.y ) + ( mod( time, 1.0 ) ) );
	gruv.y = clamp( gruv.y, -1e1, 1e1 );
    float gridStrength = 2.0;
    vec2 da = vec2( 0.5 );
    vec2 db = mod( gruv, vec2( 1.0 ) );
    float dist = max( abs( da - db ).x, abs( da - db).y );
    float grid = gridStrength * dist;
	float gridMix = max( grid * 0.25, smoothstep( 0.5, 0.99, grid ) );
    return gridMix;
}

float corridor ( in vec2 p ) {
    p.y = abs( p.y );
    p.y = max( 0.08, p.y );
    p.x /= p.y;
    p.x += time;
    float c = mod( floor( p.x ) + floor( p.y * 2.0 ), 2.0 ) + 0.5;
    float dist = sqrt( p.y );
    c = c * max( 0.1, min( 1.0, dist * 1.3 ) );
    return c;
}

float rings ( in vec2 p ) {
    float t1 = time * 1.2;
    float t2 = time * 0.6;
    float scale = resolution.y / 50.0;
	float ring = 64.0;
	float radius = resolution.x;
	float gap = scale * 0.25;
	float d = length( p );
	d += 0.2 * ( sin( p.y * 0.25 / scale + t1 ) * sin( p.x * 0.25 / scale ) ) * scale * 5.0;
    d += 0.3 * sin( t2 ) + 0.1 * ( cos( p.x * 0.45 / scale ) * cos( p.x * 1.35 / scale ) ) * scale;
	float v = mod( d + radius / ( ring * 2.0 ), radius / ring );
	v = abs( v - radius / ( ring * 2.0 ) );
	v = clamp( v - gap, 0.0, 1.0);
	d += v;
    float m = fract( ( d - 1.0 ) * ( ring * -0.5, -ring, ring * 0.25 ) * 0.5 );
    return m;
}

float wave ( in vec2 p ) {
    p.x += time * 0.2 + ( 3.0 + sin( time ) * 0.25 );
    float w = sin( p.x * 14.0 + time * 1.2 ) / 4.0;
	float d = abs( p.y - w ) * 4.0;
	w += cos( p.x * 18.0 + time ) / 8.0;
	d *= ( abs( p.y - w ) * 18.0 ) * 0.25;
	float wave = 0.25 / d;
    return 1.0 - wave;
}

float flippingSquares ( in vec2 p ) {
    p *= 5.0;
    float size = 20.0 + abs( sin( time * 0.5 ) ) * 150.0;
    float hsm = 1.5 / resolution.y * size * 0.5;
    vec2 id = floor( p );
    p = fract( p ) - 0.5;
    float a = time;
    float phase = mod( floor( a / hPI), 2.0);
    float mask = 0.0;
    for( float y =- 1.0; y <= 1.0; y++ ) {
        for(float x =- 1.0; x <= 1.0; x++ ) {
            vec2 ruv = p + vec2( x, y );
            vec2 rid = id + vec2(x, y);
            ruv *= mat2( cos( a + vec4( 0.0, 33.0, 11.0, 0.0 ) ) );
            vec2 maskXY = smoothstep( 0.5 + hsm, 0.5 - hsm, abs( ruv ) );
            float maskI = maskXY.x * maskXY.y;
            vec2 idm = mod( rid, 2.0 );
            float draw = abs( idm.x * idm.y + ( 1.0 - idm.x ) * (1.0 - idm.y ) - phase );
            mask += maskI * draw;
        }
    }
    return abs( mask - phase );
}

float pacman ( in vec2 p, in float frac ) {
    float value = 0.0;
    p *= 4.0;
    vec2 pacmanCenter = vec2( 6.7 - frac * 12.0, 0.0 ), delta = p - pacmanCenter;
    float theta = abs( atan( delta.y, -delta.x ) );
    float mouth = step( max( 0.0, sin( time * 10.0 ) * 0.4 + 0.35 ), theta );
    float dist = distance( p, pacmanCenter );
    value += max(0.0, 20.0 - dist * 20.0 ) * mouth;
    if ( p.x > pacmanCenter.x + 0.5 ) { return value; }
    p.y += sin( ( 5.0 * time ) + p.x * 0.5 ) * 0.15;
    vec2 center = vec2( floor( p.x ) + 0.5, 0.0 );
    if ( p.x < pacmanCenter.x - 0.95) {
    	value += max( 0.0, 6.0 - distance( p , center ) * 30.0 ) * 1.5 - distance( pacmanCenter , center );
    }
    if ( p.x < pacmanCenter.x - 0.9 ) {
    	value += max( 0.0, 6.0 - distance( p , center ) * 30.0 ) * 0.60;
    } else if ( p.x < pacmanCenter.x - 0.6 ) {
        value += max( 0.0, 6.0 - distance( p , center ) * 30.0 ) * 0.30;
    } else if ( p.x < pacmanCenter.x - 0.3 ) {
        value += max( 0.0, 6.0 - distance( p , center ) * 30.0 ) * 0.15;
    } else if ( p.x < pacmanCenter.x + 0.25 ) {
        value += max( 0.0, 6.0 - distance( p , center ) * 30.0 ) * 0.07;
    }
    return value;
}

float irisColor ( in vec3 norm, in float frac, in float theta ) {
    float color = 1.0;
    float sTheta = sin( theta * 2.0 ) * 0.3 + 0.7;
    float zDist = distance( 0.98, norm.z );
    float sstzDist = 1.0 - smoothstep( 0.0, 0.1, zDist );
    if ( norm.z > 0.99 + smoothstep( 0.0, 0.7, frac ) * 0.009 ) {
        color = 0.0;
    } else if ( norm.z > 0.9 ) {
        color = 0.7 * sstzDist * sTheta;
    }
    return color;
}

float eye ( in vec2 uv, in float frac ) {
    uv *= 1.5;
    float r = length( uv );
	if ( r > 1.0 ) {
		return 0.0;
	} else {
		vec3 l = normalize( vec3( 1.0, 1.0, 2.0 ) );
		vec3 p = vec3( uv, sqrt( 1.0 - r * r ) );
        float angle = cos( time * 0.02914 ) * 15.115;
        mat2 rotxy = rot( angle );
        mat2 rotxz = rot( sin( time * 0.447 ) * 0.117 );
 		l.xy *= rotxy, p.xy *= rotxy, l.xz *= rotxz, p.xz *= rotxz;
        float d = dot( l, p ), theta = atan( p.x, p.y ) - angle;
		return ( d * 0.5 + d * d * 0.3 + 0.3 ) * irisColor( p, frac, theta );
	}
}

float InRect(const in vec2 vUV, const in vec4 vRect) {
	vec2 vTestMin = step(vRect.xy, vUV.xy), vTestMax = step(vUV.xy, vRect.zw);
	vec2 vTest = vTestMin * vTestMax;
	return vTest.x * vTest.y;
}

float sampleDigit(const in float fDigit, const in vec2 vUV) {
	const float x0 = 0.0 / 4.0; const float x1 = 1.0 / 4.0; const float x2 = 2.0 / 4.0; const float x3 = 3.0 / 4.0;
	const float x4 = 4.0 / 4.0; const float y0 = 0.0 / 5.0; const float y1 = 1.0 / 5.0; const float y2 = 2.0 / 5.0;
	const float y3 = 3.0 / 5.0; const float y4 = 4.0 / 5.0; const float y5 = 5.0 / 5.0; vec4 vRect0 = vec4( 0.0 );
	vec4 vRect1 = vec4( 0.0 ); vec4 vRect2 = vec4( 0.0 );
	     if ( fDigit <  0.5 ) { vRect0 = vec4( x0, y0, x3, y5 ); vRect1 = vec4( x1, y1, x2, y4 ); }
    else if ( fDigit <  1.5 ) { vRect0 = vec4( x1, y0, x2, y5 ); vRect1 = vec4( x0, y0, x0, y0 ); }
    else if ( fDigit <  2.5 ) { vRect0 = vec4( x0, y0, x3, y5 ); vRect1 = vec4( x0, y3, x2, y4 ); vRect2 = vec4( x1, y1, x3, y2 ); }
    else if ( fDigit <  3.5 ) { vRect0 = vec4( x0, y0, x3, y5 ); vRect1 = vec4( x0, y3, x2, y4 ); vRect2 = vec4( x0, y1, x2, y2 ); }
    else if ( fDigit <  4.5 ) { vRect0 = vec4( x0, y1, x2, y5 ); vRect1 = vec4( x1, y2, x2, y5 ); vRect2 = vec4( x2, y0, x3, y3 ); }
    else if ( fDigit <  5.5 ) { vRect0 = vec4( x0, y0, x3, y5 ); vRect1 = vec4( x1, y3, x3, y4 ); vRect2 = vec4( x0, y1, x2, y2 ); }
    else if ( fDigit <  6.5 ) { vRect0 = vec4( x0, y0, x3, y5 ); vRect1 = vec4( x1, y3, x3, y4 ); vRect2 = vec4( x1, y1, x2, y2 ); }
    else if ( fDigit <  7.5 ) { vRect0 = vec4( x0, y0, x3, y5 ); vRect1 = vec4( x0, y0, x2, y4 ); }
    else if ( fDigit <  8.5 ) { vRect0 = vec4( x0, y0, x3, y5 ); vRect1 = vec4( x1, y1, x2, y2 ); vRect2 = vec4( x1, y3, x2, y4 ); }
    else if ( fDigit <  9.5 ) { vRect0 = vec4( x0, y0, x3, y5 ); vRect1 = vec4( x1, y3, x2, y4 ); vRect2 = vec4( x0, y1, x2, y2 ); }
    else if ( fDigit < 10.5 ) { vRect0 = vec4( x1, y0, x2, y1 ); }
    else if ( fDigit < 11.5 ) { vRect0 = vec4( x0, y2, x3, y3 ); }
	float fResult = InRect(vUV, vRect0) + InRect(vUV, vRect1) + InRect(vUV, vRect2);
	return mod(fResult, 2.0);
}

float clock ( in vec2 p ) {
    float value = 0.0, pointer = 0.0, lp = length( p );
    value += smoothstep( 0.7, 0.8, lp ) * ( 1.0 - smoothstep( 0.8, 0.9, lp ) );
    vec2 push = p;
    p *= rot( floor( mod( date.w, 60.0 ) ) / 60.0 * 2.0 * PI );
    if ( p.x < 0.02 && p.x > -0.02 && p.y > -0.05 && p.y < 0.7 ) pointer = 1.0;
    value += pointer, p = push, p.y += 0.2, p.x -= 0.03;
    float minutes = mod( date.w / 60.0, 60.0 );
    float hour = mod( date.w / ( 60.0 * 60.0 ), 24.0 );
    if ( hour > 13.0 ) hour -= 12.0;
    p.y *= 0.7, p.x += 0.7;
    float print = 0.0;
    if ( hour >= 10.0 ) print += sampleDigit( floor( hour / 10.0 ), p * 3.3 );
    p.x -= 0.3;
    print += sampleDigit( floor( mod( hour, 10.0 ) ), p * 3.3 );
    push = p, p.y = -p.y + 0.22, p.x = -p.x + 0.44;
    value = print * 0.5 + value * ( 0.5 + 0.5 * ( 1.0 - print ) );
    p = push, p.x -= 0.5;
    print = sampleDigit( floor( minutes / 10.0 ), p * 3.3 );
    p.x -= 0.3;
    print += sampleDigit( floor( mod( minutes, 10.0 ) ), p * 3.3 );
    value = print * 0.5 + value * ( 0.5 + 0.5 - 0.5 * print);
    return value;
}

float sdCapsule( in vec3 p, in vec3 a, in vec3 b ) {
	vec3 pa = p - a, ba = b - a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	return length( pa - ba*h ) - 1.0;
}

vec3 normal( in vec3 p, in vec3 a, in vec3 b, in vec3 e ) {
	return normalize(
        vec3(
            sdCapsule( p + e.yxx, a, b ) - sdCapsule( p - e.yxx, a, b ),
            sdCapsule( p + e.xyx, a, b ) - sdCapsule( p - e.xyx, a, b ),
            sdCapsule( p + e.xxy, a, b ) - sdCapsule( p - e.xxy, a, b )
        )
    );
}

float capsuleColor( in vec3 p ) {
    if ( p.x > 0.2 ) { return 0.435; }
    else if ( p.x < -0.2 ) { return 0.65; }
    else { return 0.9; }
}

float capsule( in vec2 p ) {
    const vec3 e = vec3(  0.0, 0.001, 0.0 );
    const vec3 a = vec3(  1.5, 0.000, 0.0 );
    const vec3 b = vec3( -1.5, 0.000, 0.0 );
    vec3 dir = normalize( vec3( p * 0.7, 1.0 ) );
    vec3 forward = vec3( 0.0, 0.0, 1.0 );
    mat2 rotxy = rot( time * 0.235 + 0.5 );
    mat2 rotzx = rot( time * 0.412 - 0.7 );
    dir.xy *= rotxy;
    forward.xy *= rotxy;
    dir.zx *= rotzx;
    forward.zx *= rotzx;
    vec3 light = normalize( -forward );
    vec3 from = -forward * 5.0;
   	float totdist = 0.0;
    float mindist = 99999.9;
	bool set = false;
    float color = 0.25;
	for ( int steps = 0 ; steps < 30 ; steps++ ) {
		vec3 p = from + totdist * dir;
		float dist = sdCapsule( p, a, b );
        mindist = min( mindist, dist );
		totdist += dist;
		if ( dist < 0.04 ) {
            color = ( dot( normal( p, a, b, e ), light ) * 0.5 + 0.5 ) * capsuleColor( p );
            set = true;
            break;
		}
	}
    if ( !set && mindist < 0.25 ) { return 0.0; }
   	return color;
}

float strangeCell( in vec2 p ) {
    p *= 1.5;
    p.x += sin(10.0 * phi * p.y + time) * phi * 0.01;
	p.y += sin(10.0 * phi * p.x + time) * phi * 0.01;
	float a = atan(p.y / p.x) * 10.0;
	float l = 0.05 / abs(length(p) - 1.0 + sin(a + time * 3.0) * phi * ttp * 0.1);
    l = sqrt(l * l * l);
    p *= 2.02;
    a = atan(p.y / p.x) * 10.0;
	l += 0.05 / abs(length(p) - 1.0 + sin(a + time * 4.0) * phi * ttp * 0.1);
    return l;
}

float weirdCircle() {
    vec2 r = resolution, o = gl_FragCoord.xy - r / 2.0;
    o = vec2(length(o) / r.y - .2, atan(o.y,o.x));
    vec4 s = 0.08*cos(1.5*vec4(0,1,2,3) + time + o.y + sin(o.y) * cos(time)), e = s.yzwx, f = max(o.x-s,e-o.x);
    vec4 c = dot(clamp(f*r.y,0.,1.), 72.*(s-e)) * (s-.1) + f;
    float cf = sqrt( c.x + c.y + c.z ) / 1.3;
    return 2.0 - inversesqrt( cf * cf * 0.5 );
}

float spiralWaves() {
    float t = time * 0.5;
    vec2 u = gl_FragCoord.xy;
	vec2 V = gl_FragCoord.xy;
	vec2 U = 6.0 * u / resolution.y;
	U.x -= t;
	V = floor(U);
	float s = sign(mod(U.y,2.)-1.);
    U.y = dot(cos(2.*(t+V.x) * 1.5 * max(0.,.5-length(U = fract(U)-.5)) - vec2(99.,0) ), U);
	return smoothstep(-1.,10.0, s*U / 0.017 ).y;
}

float diamondWaves( in vec2 p ) {
    p.x /= max(resolution.x, resolution.y) / min(resolution.x, resolution.y) - 0.75;
    p = floor(256.0*p)/512.0;
	vec2 pc = 16.0*vec2(length(p),length(p*p));
	float tt = -time*2.0;
	float c = 0.7 * smoothstep(0.0, 0.5, sin((pc.x-pc.y)*8.+tt*1.00)*3.0+2.0-pc.y);
	float d = 0.5 * smoothstep(0.0, 0.5, sin((pc.x-pc.y)*8.+tt*1.25)*3.0+2.0-pc.y);
	float e = 0.5 * smoothstep(0.0, 0.5, sin((pc.x-pc.y)*8.+tt*1.50)*3.0+2.0-pc.y);
    return c + d * e + c * e;
}

float tri( in float t, in float scale, in float shift) {
	return ( abs( t * 2.0 - 1.0 ) - shift ) * ( scale );
}

float sun() {
    vec2 R = resolution.xy;
    vec2 p = (gl_FragCoord.xy - 0.5 * R) / R.y + 0.5;
    float dist = length( p - vec2( 0.5 + sin(time) * 0.0025, 0.5 + cos(time) * 0.0025 ) );
    float divisions = 6.0;
    float divisionsShift= 0.5;
    float pattern = tri( fract( ( p.y + time / 12.0 ) * 20.0 ), 2.0 / divisions, divisionsShift ) - ( -p.y + 0.30 ) * 0.7;
    float so = smoothstep( 0.0, -0.015, max( dist - 0.315, - pattern ) ) - 0.2;
    return so + 0.1;
}

float checkers() {
    vec2 R = resolution.xy;
    vec2 p = vec2( gl_FragCoord.xy - 0.5 * R.xy ) / R.y;
    float t = time * 0.75;
    vec3 col = vec3( 1.0 );
    float sc = 10.0;
    float rev = 2.0 * mod( floor( p.y * sc ), 2.0 ) - 1.0;
    float rev2 = 2.0 * mod( floor( p.x * sc ), 2.0 ) - 1.0;
    float wait = mod( floor( t ), 2.0 );
    float wait2 = mod( floor( t + 1.0 ), 2.0 );
    p.x += t * rev * 0.1 * wait;
    p.y += t * rev2 * 0.1  *wait2;
    vec2 id = floor( p * sc );
    col *= mod( id.x - id.y, 2.0 );
    return sqrt( col.x + ( 1.0 - col.x ) * 0.5 );
}

float map( in vec3 p ) {
	p.xz *= rot( time * PI / 5.5 );
	p.xy *= rot( time * PI / 5.5 );
	vec3 q = abs( p );
	float c = max( q.x, max( q.y, q.z ) ) - 0.5;
	return c;
}

vec3 trace( in vec3 o, in vec3 r ) {
	vec4 d;
	float t = 0.;
	for( int i = 0; i < 36; i++ ) {
		vec3 p = o + r * t;
		float d = map( p );
		t += d * 0.5;
	}
	vec3 p = o + r * t;
	return vec3( p * -0.6 + t * 0.2 );
}

float traceCube() {
	vec2 uv = ( gl_FragCoord.xy * 2.- resolution.xy) / resolution.y;
	vec3 o = vec3( 0.0, 0.0, -1.8 );
	vec3 r = normalize( vec3( uv, 1.5 ) );
	vec3 d = trace( o, r );
    return dot( r, d.xyz ) * 1.1;
}

float getEffect ( in int fx, in vec2 uv, in float frac ) {
    float effects = 26.0;
    int idx = int( effects ) - 1;
    fx = int( fract( float( fx ) * 1.61456 ) * effects );
    int temp = fx / idx;
    fx -= temp * idx;
    float value = 0.0;
         if ( fx ==  0 ) value = waves( uv, frac );
    else if ( fx ==  1 ) value = grid( uv );
    else if ( fx ==  2 ) value = curvedTruchet( uv );
    else if ( fx ==  3 ) value = pacman( uv, frac );
    else if ( fx ==  4 ) value = clock( uv );
    else if ( fx ==  5 ) value = truchet( uv );
    else if ( fx ==  6 ) value = plasma( uv );
    else if ( fx ==  7 ) value = eye( uv, frac );
    else if ( fx ==  8 ) value = capsule( uv );
    else if ( fx ==  9 ) value = squares( uv );
    else if ( fx == 10 ) value = stars( uv );
    else if ( fx == 11 ) value = spiral( uv );
    else if ( fx == 12 ) value = pong( uv );
    else if ( fx == 13 ) value = corridor( uv );
    else if ( fx == 14 ) value = rings( uv );
    else if ( fx == 15 ) value = wave( uv );
    else if ( fx == 16 ) value = flippingSquares( uv );
    else if ( fx == 17 ) value = strangeCell( uv );
    else if ( fx == 18 ) value = weirdCircle();
    else if ( fx == 19 ) value = spiralWaves();
    else if ( fx == 20 ) value = diamondWaves( uv );
    else if ( fx == 21 ) value = sun();
    else if ( fx == 22 ) value = checkers();
    else if ( fx == 23 ) value = traceCube();
    else                 value = plasma( uv );
   	return value;
}

float transition ( in vec2 uv, in float eLength ) {
    int fx = int( time / eLength );
    float frac = mod( time, eLength ) / eLength;
    float valueA = getEffect( fx, uv, 0.0 );
    float valueB = getEffect( fx - 1, uv, frac );
    return mix( valueB, valueA, smoothstep( ssp, 1.0, frac ) );
}

float dither ( in vec2 frag, in float ledSize, in float cellSize, in float eLength ) {
    vec2 cell = floor( ( frag + 2.0 ) / ledSize ) * ledSize * 1.0 - resolution.xy;
    cell /= resolution.y;
    float brightness = transition( cell, eLength );
    if ( brightness < 1.0 / 5.0 ) return 0.0;
    vec2 pixel = floor( mod( frag.xy / ledSize, cellSize ) );
    int x = int( pixel.x );
    int y = int( pixel.y );
    if (x == 0 || y == 0) return 0.0;
    if ( brightness > 4.0 / 5.0 ) return 1.0;
    bool result = false;
    if ( ( x == 1 && y == 2 && brightness > 3.0 / 5.0 ) ||
         ( x == 1 && y == 1 && brightness > 2.0 / 5.0 ) ||
         ( x == 2 && y == 2 && brightness > 1.0 / 5.0 ) ) {
        return 1.0;
    } else {
        return 0.0;
    }
}


float getDist ( in int fx, in vec2 p, in float frac ) {
    vec2 wp = vec2( p.x + sin( 4.0 * p.y + time * 2.0 ) * 0.05, p.y + cos( 2.0 * p.x + time ) * 0.05 );
    float effects = 13.0;
    int idx = int( effects ) - 1;
    fx = int( fract( float( fx ) * 1.61456 ) * effects );
    int temp = fx / idx;
    fx -= temp * idx;
    vec2 absp = abs( p );
    float value = 0.0;
    float v00 = 0.75 - ( ( absp.x + absp.y - ( min( absp.x, absp.y ) ) ) - ( min( absp.x, absp.y ) ) );
    float v01 = ( max( 0.8 - ( ( absp.x + sin( absp.y * 1.25 + time ) * 0.1 )  + ( absp.y ) - min( absp.x, absp.y ) ), 0.0 ) ) - 0.1;
    float v02 = 0.6 - ( ( absp.x + absp.y - min( absp.x, absp.y ) ) - ( ( min( absp.x, absp.y ) ) + sin( abs( absp.y ) + time ) * 0.2 ) );
    float v03 = max( 0.5 - ( ( ( abs( p * rot( time ) ).x ) + abs( p * rot( time ) ).y - min( abs( p * rot( time ) ).x, abs( p * rot( time ) ).y ) ) - 0.2 - ( ( min( absp.x, absp.y ) ) * 0.25 ) ), 0.0) * 1.5;
    float v04 = max( 0.9 - ( ( min( absp.x, absp.y ) ) + ( absp.x + absp.y - min( absp.x, absp.y ) ) ), 0.0 );
    float v05 = -( ( max( 0.4 - ( min( absp.x, absp.y ) ), 0.0 ) ) - ( max( 0.8 - ( absp.x + absp.y - min( absp.x, absp.y ) ), 0.0 ) ) );
    float v06 = -( ( max( 0.25 - ( min( abs( wp ).x, abs( wp ).y ) ), 0.0 ) ) - ( max( 0.8 - ( abs( wp ).x + abs( wp ).y - min( absp.x, absp.y ) ), 0.0 ) ) );
    float v07 = min(( max( 0.8 - ( abs( wp ).x + absp.y - min( abs( wp ).x, absp.y ) ), 0.0 ) ) * 2.0, ( max( 0.5 - ( min( abs( wp ).x, abs( wp ).y ) ), 0.0 ) ) * 2.0);
    float v08 = max( 0.7 - ( ( absp.x + absp.y - min( absp.x, absp.y ) ) - 0.5 * ( min( absp.x, absp.y ) ) *  ( absp.x + absp.y - min( absp.x, absp.y ) ) * 1.5 ), 0.0 ) * 1.0;
    float v09 = max( 0.9 - ( ( absp.x + absp.y - min( absp.x, absp.y ) ) - 0.5 * ( min( absp.x, absp.y ) ) * -( absp.x + absp.y - min( absp.x, absp.y ) ) * 1.5 ), 0.0 ) * 1.0;
    float v10 = 0.8 - length( vec2( absp.x * 0.8, absp.y * 1.2 ) );
    float v11 = 1.0 - length( absp * 1.2 );
    float v12 = 0.7 - length( ( vec2( p.x * cos( 0.2 * p.y + time * 0.5 ), p.y * sin( p.y + time * 0.5 ) * 0.125 ) ) * 1.2 );
    float v13 = 0.8 - length( vec2( absp.x * 0.8, absp.y * 1.2 ) ) * ( absp.x + absp.y - min( absp.x, absp.y ) );
         if ( fx ==  0 ) { value = v00; }
    else if ( fx ==  1 ) { value = v01; }
    else if ( fx ==  2 ) { value = v02; }
    else if ( fx ==  3 ) { value = v03; }
    else if ( fx ==  4 ) { value = v04; }
    else if ( fx ==  5 ) { value = v05; }
    else if ( fx ==  6 ) { value = v06; }
    else if ( fx ==  7 ) { value = v07; }
    else if ( fx ==  8 ) { value = v08; }
    else if ( fx ==  9 ) { value = v09; }
    else if ( fx == 10 ) { value = v10; }
    else if ( fx == 11 ) { value = v11; }
    else if ( fx == 12 ) { value = v12; }
    else                 { value = v13; }
    return value;
}

float transitionDist ( in vec2 uv, in float eLength ) {
    int fx = int( time / eLength );
    float frac = mod( time, eLength ) / eLength;
    float valueA = getDist( fx, uv, frac );
    float valueB = getDist( fx - 1, uv, frac );
    float valueMix = mix( valueB, valueA, smoothstep( 0.6, 1.0, frac ) );
    return mix( valueB, valueMix, smoothstep( 0.8, 1.0, frac ) );
}

void main ( void ) {
    const float ledSize = 2.0;
	const float cellSize = 4.0;
    const float size = ledSize * cellSize;
    const float eLength = 6.0;
    vec2 tUv = gl_FragCoord.xy / resolution.xy;
    vec2 coord = gl_FragCoord.xy * 2.0;
    vec2 cell = floor( ( ( gl_FragCoord.xy * 2.0 ) + 2.0 ) / size ) * size * 1.0 - resolution.xy;
    cell /= resolution.y;
    float df = dither( coord, ledSize, cellSize, eLength );

    float maskDistance = transitionDist( cell, eLength );
    if ( maskDistance > 0.0 ) {
        float value = 0.0;
        if ( maskDistance < 0.02 ) value = ( 0.25 * df ) * 0.125;
        else if ( maskDistance < 0.05 ) value = 0.0;
        else value = df;
        gl_FragColor = vec4( vec3( value * 0.025, value, value * 0.025 ) * 0.25, alpha );
    } else {
        if ( tUv.y < 0.5 ) { tUv.y = 1.0 - tUv.y; }
        if ( tUv.x < 0.5 ) { tUv.x = 1.0 - tUv.x; }
        vec4 t = texture2D( iChannel0, tUv );
        vec3 d = vec3( df * 0.005, df * 0.01, df * 0.005 ) * 0.02;
        gl_FragColor = vec4( vec3( sqrt( t.rgb ) + d ), alpha );
    }

    gl_FragColor = sqrt( sqrt( gl_FragColor ) );

}
