import React from 'react';

import { NavLink } from 'react-router-dom';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import './Menu.css';

const routes = [
    {
        to: '/',
        label: 'Home',
        iconSet: 'menu-icon pe-7s-icon pe-7s-home',
        className: 'main-menu nav-link'
    },
    {
        to: '/contact',
        label: 'Contact',
        iconSet: 'menu-icon pe-7s-icon pe-7s-mail',
        className: 'main-menu nav-link'
    }
];

const brand = () => {

    return (

        <Navbar.Brand href="/" id="nav_brand" className="nav-brand">
            <img
                src='/images/png/mos.png'
                width='100px'
                alt='Marco Gomez ( @marcogomez_ ) MOS SID Player'
            />
        </Navbar.Brand>

    );

};

const gitHub = () => {

    return (
        <a
            href="https://github.com/mgzme/sid-player"
            alt="Fork me on GitHub"
            title="Star me on GitHub =)"
            target="_blank"
            rel="noopener noreferrer"
            className="main-menu nav-link"
        >
            <i className="menu-icon-fa fa fa-github"></i>
            Source
        </a>
    );

}

const Menu = ( props ) => {

    return (
        <div className="Menu">
            <div className="header nav">
                <Navbar
                    collapseOnSelect
                    fixed="top"
                    expand="md"
                    bg="dark"
                    variant="dark"
                    className="container-fluid"
                >
                    {brand()}
                    <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                    <Navbar.Collapse id="responsive-navbar-nav">
                        <Nav className="mr-auto" id="navbar_left_container"></Nav>
                        <Nav>
                            {routes.map( ( { to, label, iconSet, className } ) => {

                                return (
                                    <NavLink key={to} strict exact to={to} className={className}>
                                        <i className={iconSet}></i>
                                        {label}
                                    </NavLink>
                                );

                            } )}
                            {gitHub()}
                            <div
                                id="toggle_fullscreen"
                                className="main-menu nav-link toggle-fullscreen"
                                onClick={props.toggleFullScreen}
                            >
                                <i className="pe-7s-expand1"></i>
                            </div>
                        </Nav>
                    </Navbar.Collapse>
                </Navbar>
            </div>
        </div>
    );

};

export default Menu;