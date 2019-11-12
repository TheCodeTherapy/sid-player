import React, { Component } from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import './ContactPage.css';

const links = {
    'LinkedIn': {
        url: 'https://linkedin.com/in/mgzme',
        icon: 'fa-linkedin-square'
    },
    'GitHub': {
        url: 'https://github.com/mgzme',
        icon: 'fa-github'
    },
    'Twitter': {
        url: 'https://twitter.com/marcogomez_',
        icon: 'fa-twitter'
    },
    'Instagram': {
        url: 'https://instagram.com/omarcogomez',
        icon: 'fa-instagram'
    },
    'Facebook': {
        url: 'https://facebook.com/SpaceMonkeyTube',
        icon: 'fa-facebook'
    },
    'YouTube': {
        url: 'https://youtube.com/TioMacaco',
        icon: 'fa-youtube'
    },
    'Email': {
        url: 'mailto:marcogomez@mgz.me',
        icon: 'fa-envelope'
    }
};

class ContactPage extends Component {

    constructor( props ) {

        super( props );
        this.state = {};

    }

    shouldComponentUpdate() { return false; }

    render() {

        return (
            <div className="view">
                <h1>Contact</h1>
                <div className="content">
                    <div className="container-wrapper">

                        <div className="page-container">
                            <Row>
                                <Col xl={6}>
                                    <div className="block-title">
                                        <h3><strong>Contact</strong> me!</h3>
                                    </div>
                                    <div className="block-content">
                                        <div className="contact-text">
                                            <p>Are you interested on my work? You can follow me on any of my Social Media profiles listed on this page and, even preferably, shoot me a message through my E-Mail.</p>
                                            <p>I'm always looking forward new challenges, projects and opportunities, and I hope we can work on cool things together!</p>
                                        </div>
                                    </div>
                                </Col>
                                <Col xl={6}>
                                    <div className="block-title">
                                        <h3><strong>E-Mail</strong> and Social Media Profiles</h3>
                                    </div>
                                    <div className="block-content">
                                        <div className="contact-links">
                                            {Object.keys( links ).map( ( key, index ) => (
                                                <li key={index}>
                                                    <a
                                                        className="social-button"
                                                        href={links[key].url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title={key}
                                                    >
                                                        <i className={`fa ${links[key].icon}`}></i>
                                                        {key}
                                                    </a>
                                                </li>
                                            ) )}
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                    </div>
                </div>
            </div>
        );

    }

}

export default ContactPage;
