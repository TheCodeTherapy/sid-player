function requestFullScreen () {

    let el = document.body;

    let requestMethod = (
        el.requestFullScreen ||
        el.webkitRequestFullScreen ||
        el.mozRequestFullScreen ||
        el.msRequestFullScreen
    );

    if ( requestMethod ) { requestMethod.call( el ); }

}

function toggleFullScreen () {

    let doc = document;
    let el = doc.documentElement;
    let key = Element.ALLOW_KEYBOARD_INPUT;

    if (
        ( doc.fullScreenElement && doc.fullScreenElement !== null ) ||
        ( !doc.mozFullScreen && !doc.webkitIsFullScreen )
    ) {

        if ( el.requestFullScreen ) { el.requestFullScreen(); }
        else if ( el.mozRequestFullScreen ) { el.mozRequestFullScreen(); }
        else if ( el.webkitRequestFullScreen ) { el.webkitRequestFullScreen( key ); }

    } else {

        if ( doc.cancelFullScreen ) { doc.cancelFullScreen(); }
        else if ( doc.mozCancelFullScreen ) { doc.mozCancelFullScreen(); }
        else if ( doc.webkitCancelFullScreen ) { doc.webkitCancelFullScreen(); }

    }

}

export { requestFullScreen, toggleFullScreen };
