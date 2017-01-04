import React from 'react';
import { connect } from 'react-redux';
import { PageHeader } from 'react-bootstrap';
import _ from 'lodash';


var UserManagement = React.createClass({
  propTypes: {
    currentUser : React.PropTypes.object,
    models      : React.PropTypes.object,
  },

  render: function() {
    return <div id="user-management">
      <PageHeader>User Management</PageHeader>
      {
        _.map(this.props.models.users, (user) => {
          return <h2>{user.fullName}</h2>;
        })
      }
    </div>;
  },
});


function mapStateToProps(state) {
  return {
    currentUser : state.user,
    models      : state.models,
  };
}

export default connect(mapStateToProps)(UserManagement);
