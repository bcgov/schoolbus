import React from 'react';
import PropTypes from 'prop-types';

import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import _ from 'lodash';

import Confirm from '../components/Confirm.jsx';
import OverlayTrigger from '../components/OverlayTrigger.jsx';

class DeleteButton extends React.Component {
  static propTypes = {
    onConfirm: PropTypes.func.isRequired,
    name: PropTypes.string,
    hide: PropTypes.bool,
  };

  render() {
    var props = _.omit(this.props, 'onConfirm', 'hide', 'name');

    return (
      <OverlayTrigger trigger="click" placement="top" rootClose overlay={<Confirm onConfirm={this.props.onConfirm} />}>
        <Button
          title={`Delete ${this.props.name}`}
          bsSize="xsmall"
          className={this.props.hide ? 'hidden' : ''}
          {...props}
        >
          <FontAwesomeIcon icon="trash-alt" />
        </Button>
      </OverlayTrigger>
    );
  }
}

export default DeleteButton;
