const parseQuery = query => {

    const queryRegexp = /^[?#]/;
    const queryFilter = /\+/g;

    return query
        ? ( queryRegexp.test( query ) ? query.slice( 1 ) : query )
            .split( '&' )
            .reduce( ( params, param ) => {

                let [ key, value ] = param.split( '=' );
                params[ key ] = value
                    ? decodeURIComponent( value.replace( queryFilter, ' ' ) )
                    : '';

                return params;

            }, {} )
        : {};

};

export default parseQuery;
