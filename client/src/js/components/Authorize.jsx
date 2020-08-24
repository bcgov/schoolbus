import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { hasAllPermissions, hasSomePermissions } from '../utils/permissions';

const Authorize = ({ children, userPermissions, permissions, matchAll }) => {
  let permissionsToCheck = [];

  if (typeof permissions === 'string') permissionsToCheck.push(permissions);
  else permissionsToCheck = [...permissions];

  let valid = false;

  if (matchAll) valid = hasAllPermissions(userPermissions, permissionsToCheck);
  else valid = hasSomePermissions(userPermissions, permissionsToCheck);

  if (valid) return <>{children}</>;
  else return <></>;
};

Authorize.propTypes = {
  children: PropTypes.element.isRequired,
  permissions: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
  matchAll: PropTypes.bool,
};

Authorize.defaultProps = {
  matchAll: true,
};

const mapStateToProps = (state) => {
  return {
    userPermissions: state.user.permissions,
  };
};

export default connect(mapStateToProps, null)(Authorize);
