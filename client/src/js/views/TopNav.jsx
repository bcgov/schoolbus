import React from 'react';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';

import { Navbar, Nav, NavItem, NavDropdown, MenuItem, OverlayTrigger } from 'react-bootstrap';
import { Popover, Button, Glyphicon } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

import * as Constant from '../constants';

import Authorize from '../components/Authorize';
import Spinner from '../components/Spinner.jsx';
import bcLogo from '../../images/gov/gov3_bc_logo.png';

class TopNav extends React.Component {
  static propTypes = {
    currentUser: PropTypes.object,
    showWorkingIndicator: PropTypes.bool,
    requestError: PropTypes.object,
    version: PropTypes.object,
  };

  render() {
    var requestError = this.props.requestError;
    var html;

    if (requestError.html) {
      try {
        html = JSON.parse(requestError.html);
      } catch (e) {
        console.log(requestError.html);
        html = { errorTitle: 'Error', errorMessage: 'Internal error' };
      }
    }

    var errorTitle = html ? html.errorTitle : '';
    var errorMessage = html ? html.errorMessage : '';

    let environment = '';
    if (this.props.version.applicationVersions && this.props.version.applicationVersions.length > 0) {
      environment = `env-${this.props.version.applicationVersions[0].environment}`;
    }

    return (
      <div id="header">
        <nav id="header-main" className="navbar navbar-default navbar-fixed-top">
          <div className="container">
            <div id="logo">
              <a href="http://www2.gov.bc.ca/gov/content/home">
                <img title="Government of B.C." alt="Government of B.C." src={bcLogo} />
              </a>
            </div>
            <h1 id="banner">CVSE School Bus Inspection Tracking System</h1>
          </div>
          <Navbar id="top-nav" className={environment}>
            <Nav>
              <LinkContainer to={{ pathname: `/${Constant.HOME_PATHNAME}` }}>
                <NavItem eventKey={1}>Home</NavItem>
              </LinkContainer>
              <LinkContainer to={{ pathname: `/${Constant.BUSES_PATHNAME}` }}>
                <NavItem eventKey={2}>School Buses</NavItem>
              </LinkContainer>
              <LinkContainer to={{ pathname: `/${Constant.OWNERS_PATHNAME}` }}>
                <NavItem eventKey={3}>Owners</NavItem>
              </LinkContainer>
              <LinkContainer to={{ pathname: `/${Constant.NOTIFICATIONS_PATHNAME}` }}>
                <NavItem eventKey={4}>Notifications</NavItem>
              </LinkContainer>
              <Authorize permissions={[Constant.PERMISSION_USER_R, Constant.PERMISSION_ROLE_R]} matchAll={false}>
                <NavDropdown id="admin-dropdown" title="Administration">
                  <Authorize permissions={Constant.PERMISSION_USER_R}>
                    <LinkContainer to={{ pathname: `/${Constant.USERS_PATHNAME}` }}>
                      <MenuItem eventKey={5}>User Management</MenuItem>
                    </LinkContainer>
                  </Authorize>
                  <Authorize permissions={Constant.PERMISSION_ROLE_R}>
                    <LinkContainer to={{ pathname: `/${Constant.ROLES_PATHNAME}` }}>
                      <MenuItem eventKey={6}>Roles and Permissions</MenuItem>
                    </LinkContainer>
                  </Authorize>
                </NavDropdown>
              </Authorize>
            </Nav>
            <Nav id="navbar-current-user" pullRight>
              <NavItem>
                {this.props.currentUser.fullName} <small>{this.props.currentUser.districtName} District</small>
              </NavItem>
            </Nav>
            <OverlayTrigger
              trigger="click"
              placement="bottom"
              rootClose
              overlay={
                <Popover id="error-message" title={errorTitle + ' (' + requestError.status + ')'}>
                  <p>
                    <small>{errorMessage}</small>
                  </p>
                  <p>
                    <small>{requestError.message}</small>
                  </p>
                </Popover>
              }
            >
              <Button
                id="error-indicator"
                className={requestError.message ? '' : 'hide'}
                bsStyle="danger"
                bsSize="xsmall"
              >
                Error
                <Glyphicon glyph="exclamation-sign" />
              </Button>
            </OverlayTrigger>
            <div id="working-indicator" hidden={!this.props.showWorkingIndicator}>
              Working <Spinner />
            </div>
          </Navbar>
        </nav>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentUser: state.user,
    showWorkingIndicator: state.ui.requests.waiting,
    requestError: state.ui.requests.error,
    version: state.version,
  };
}

export default connect(mapStateToProps, null, null, { pure: false })(TopNav);
